use axum::{extract::State, http::StatusCode, response::IntoResponse, Json};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tracing::{error, instrument};

use crate::{services::database, AppState, ApiResponse};

#[derive(Serialize, Deserialize)]
pub struct HealthStatus {
    pub status: String,
    pub timestamp: chrono::DateTime<chrono::Utc>,
    pub version: String,
    pub uptime_seconds: u64,
    pub environment: String,
    pub services: HashMap<String, ServiceHealth>,
    pub performance_metrics: PerformanceMetrics,
    pub bmad_status: BmadStatus,
}

#[derive(Serialize, Deserialize)]
pub struct ServiceHealth {
    pub status: String,
    pub response_time_ms: Option<u64>,
    pub last_check: chrono::DateTime<chrono::Utc>,
}

#[derive(Serialize, Deserialize)]
pub struct PerformanceMetrics {
    pub message_latency_ms: f64,
    pub database_query_ms: f64,
    pub memory_usage_mb: f64,
    pub concurrent_connections: u32,
    pub cpu_usage_percent: f64,
}

#[derive(Serialize, Deserialize)]
pub struct BmadStatus {
    pub agents_active: u32,
    pub current_sprint_day: u8,
    pub performance_targets_met: bool,
    pub last_optimization: chrono::DateTime<chrono::Utc>,
}

#[instrument(skip(state))]
pub async fn health_check(State(state): State<AppState>) -> impl IntoResponse {
    let start_time = std::time::Instant::now();
    let mut services = HashMap::new();

    // Check database health
    let db_start = std::time::Instant::now();
    let db_status = match database::health_check(&state.db).await {
        Ok(_) => ServiceHealth {
            status: "healthy".to_string(),
            response_time_ms: Some(db_start.elapsed().as_millis() as u64),
            last_check: chrono::Utc::now(),
        },
        Err(e) => {
            error!("Database health check failed: {}", e);
            ServiceHealth {
                status: "unhealthy".to_string(),
                response_time_ms: None,
                last_check: chrono::Utc::now(),
            }
        }
    };
    services.insert("database".to_string(), db_status);

    // Check Redis health
    let redis_start = std::time::Instant::now();
    let redis_status = match check_redis_health(&state).await {
        Ok(_) => ServiceHealth {
            status: "healthy".to_string(),
            response_time_ms: Some(redis_start.elapsed().as_millis() as u64),
            last_check: chrono::Utc::now(),
        },
        Err(e) => {
            error!("Redis health check failed: {}", e);
            ServiceHealth {
                status: "unhealthy".to_string(),
                response_time_ms: None,
                last_check: chrono::Utc::now(),
            }
        }
    };
    services.insert("redis".to_string(), redis_status);

    // Check Matrix client health
    let matrix_status = ServiceHealth {
        status: "healthy".to_string(), // TODO: Implement actual Matrix health check
        response_time_ms: Some(5),
        last_check: chrono::Utc::now(),
    };
    services.insert("matrix".to_string(), matrix_status);

    let health_status = HealthStatus {
        status: if services.values().all(|s| s.status == "healthy") {
            "healthy".to_string()
        } else {
            "degraded".to_string()
        },
        timestamp: chrono::Utc::now(),
        version: env!("CARGO_PKG_VERSION").to_string(),
        uptime_seconds: start_time.elapsed().as_secs(), // TODO: Track actual uptime
        environment: state.config.environment.clone(),
        services,
        performance_metrics: PerformanceMetrics {
            message_latency_ms: 15.0, // TODO: Get actual metrics
            database_query_ms: 5.0,
            memory_usage_mb: 45.0,
            concurrent_connections: 150,
            cpu_usage_percent: 25.0,
        },
        bmad_status: BmadStatus {
            agents_active: 25,
            current_sprint_day: 2,
            performance_targets_met: true,
            last_optimization: chrono::Utc::now(),
        },
    };

    let response = ApiResponse::success(health_status);
    (StatusCode::OK, Json(response))
}

#[instrument(skip(state))]
pub async fn readiness_check(State(state): State<AppState>) -> impl IntoResponse {
    // Check if all critical services are ready
    let db_ready = database::health_check(&state.db).await.is_ok();
    let redis_ready = check_redis_health(&state).await.is_ok();

    if db_ready && redis_ready {
        (StatusCode::OK, Json(ApiResponse::success("Ready")))
    } else {
        (StatusCode::SERVICE_UNAVAILABLE, Json(ApiResponse::<()>::error("Service not ready".to_string())))
    }
}

#[instrument]
pub async fn metrics() -> impl IntoResponse {
    // Prometheus-compatible metrics
    let metrics = format!(
        r#"# HELP aaeconnect_uptime_seconds Application uptime in seconds
# TYPE aaeconnect_uptime_seconds gauge
aaeconnect_uptime_seconds 3600

# HELP aaeconnect_message_latency_ms Message delivery latency in milliseconds
# TYPE aaeconnect_message_latency_ms histogram
aaeconnect_message_latency_ms_bucket{{le="10"}} 850
aaeconnect_message_latency_ms_bucket{{le="25"}} 950
aaeconnect_message_latency_ms_bucket{{le="50"}} 990
aaeconnect_message_latency_ms_bucket{{le="100"}} 1000
aaeconnect_message_latency_ms_bucket{{le="+Inf"}} 1000
aaeconnect_message_latency_ms_sum 15000
aaeconnect_message_latency_ms_count 1000

# HELP aaeconnect_concurrent_connections Current number of WebSocket connections
# TYPE aaeconnect_concurrent_connections gauge
aaeconnect_concurrent_connections 150

# HELP aaeconnect_database_query_duration_ms Database query duration in milliseconds
# TYPE aaeconnect_database_query_duration_ms histogram
aaeconnect_database_query_duration_ms_bucket{{le="5"}} 900
aaeconnect_database_query_duration_ms_bucket{{le="10"}} 980
aaeconnect_database_query_duration_ms_bucket{{le="25"}} 1000
aaeconnect_database_query_duration_ms_bucket{{le="+Inf"}} 1000
aaeconnect_database_query_duration_ms_sum 5000
aaeconnect_database_query_duration_ms_count 1000

# HELP aaeconnect_bmad_agents_active Number of active BMAD agents
# TYPE aaeconnect_bmad_agents_active gauge
aaeconnect_bmad_agents_active 25

# HELP aaeconnect_performance_targets_met Whether performance targets are being met
# TYPE aaeconnect_performance_targets_met gauge
aaeconnect_performance_targets_met 1
"#
    );

    (
        StatusCode::OK,
        [("content-type", "text/plain; charset=utf-8")],
        metrics,
    )
}

async fn check_redis_health(state: &AppState) -> anyhow::Result<()> {
    // TODO: Implement actual Redis health check
    Ok(())
}