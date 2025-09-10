use anyhow::Result;
use axum::{
    extract::{State, WebSocketUpgrade},
    http::StatusCode,
    response::{IntoResponse, Response},
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::{net::SocketAddr, sync::Arc};
use tokio::net::TcpListener;
use tower::ServiceBuilder;
use tower_http::{
    cors::CorsLayer,
    trace::TraceLayer,
    compression::CompressionLayer,
};
use tracing::{info, instrument};
use uuid::Uuid;

mod config;
mod handlers;
mod middleware;
mod models;
mod services;
mod utils;

use config::AppConfig;
use handlers::{auth, health, messages, users, websocket};
use middleware::{auth as auth_middleware, metrics};
use services::{database, redis, matrix};

#[derive(Clone)]
pub struct AppState {
    pub db: Arc<sqlx::PgPool>,
    pub redis: Arc<redis::Client>,
    pub matrix_client: Arc<matrix_sdk::Client>,
    pub config: Arc<AppConfig>,
}

#[derive(Serialize, Deserialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub message: Option<String>,
    pub timestamp: chrono::DateTime<chrono::Utc>,
}

impl<T> ApiResponse<T> {
    pub fn success(data: T) -> Self {
        Self {
            success: true,
            data: Some(data),
            message: None,
            timestamp: chrono::Utc::now(),
        }
    }

    pub fn error(message: String) -> ApiResponse<()> {
        ApiResponse {
            success: false,
            data: None,
            message: Some(message),
            timestamp: chrono::Utc::now(),
        }
    }
}

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::EnvFilter::from_default_env())
        .init();

    info!("🚀 Starting AAEConnect Backend Server");

    // Load configuration
    let config = Arc::new(AppConfig::load()?);
    info!("📋 Configuration loaded");

    // Initialize database
    let db = Arc::new(database::init_pool(&config.database_url).await?);
    info!("🗄️  Database connected");

    // Initialize Redis
    let redis_client = Arc::new(redis::Client::open(config.redis_url.clone())?);
    info!("🔴 Redis connected");

    // Initialize Matrix client
    let matrix_client = Arc::new(matrix::init_client(&config.matrix_config).await?);
    info!("🔒 Matrix client initialized");

    // Create application state
    let state = AppState {
        db: db.clone(),
        redis: redis_client,
        matrix_client,
        config: config.clone(),
    };

    // Build the application router
    let app = create_router(state).await;

    // Start the server
    let addr = SocketAddr::from(([0, 0, 0, 0], config.port));
    let listener = TcpListener::bind(&addr).await?;
    
    info!("🌐 Server listening on {}", addr);
    info!("📊 Health check: http://{}/health", addr);
    info!("📈 Metrics: http://{}/metrics", addr);
    info!("🔌 WebSocket: ws://{}/ws", addr);

    axum::serve(listener, app).await?;

    Ok(())
}

async fn create_router(state: AppState) -> Router {
    Router::new()
        // Health and monitoring endpoints
        .route("/health", get(health::health_check))
        .route("/metrics", get(health::metrics))
        .route("/ready", get(health::readiness_check))
        
        // Authentication endpoints
        .route("/auth/login", post(auth::login))
        .route("/auth/logout", post(auth::logout))
        .route("/auth/refresh", post(auth::refresh_token))
        .route("/auth/register", post(auth::register))
        
        // User management endpoints
        .route("/users/profile", get(users::get_profile))
        .route("/users/profile", post(users::update_profile))
        .route("/users/search", get(users::search_users))
        
        // Message endpoints
        .route("/messages/:room_id", get(messages::get_messages))
        .route("/messages", post(messages::send_message))
        .route("/messages/:message_id", get(messages::get_message))
        
        // WebSocket endpoint for real-time communication
        .route("/ws", get(websocket::websocket_handler))
        
        // File upload/download endpoints
        .route("/files/upload", post(handlers::files::upload_file))
        .route("/files/:file_id", get(handlers::files::download_file))
        
        // Add middleware layers
        .layer(
            ServiceBuilder::new()
                .layer(TraceLayer::new_for_http())
                .layer(CompressionLayer::new())
                .layer(CorsLayer::permissive()) // Configure CORS for AAE domains
                .layer(metrics::MetricsLayer::new())
        )
        .with_state(state)
}

// Global error handler
impl IntoResponse for anyhow::Error {
    fn into_response(self) -> Response {
        let error_response = ApiResponse::<()>::error(self.to_string());
        (StatusCode::INTERNAL_SERVER_ERROR, Json(error_response)).into_response()
    }
}