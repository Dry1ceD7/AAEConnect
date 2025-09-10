use axum::{extract::State, http::StatusCode, response::IntoResponse, Json};
use serde::{Deserialize, Serialize};
use tracing::{error, info, instrument};
use uuid::Uuid;

use crate::{services::auth::AuthService, AppState, ApiResponse};

#[derive(Deserialize)]
pub struct LoginRequest {
    pub username: String,
    pub password: String,
}

#[derive(Deserialize)]
pub struct RegisterRequest {
    pub username: String,
    pub email: String,
    pub password: String,
    pub full_name: String,
    pub aae_employee_id: Option<String>,
    pub department: Option<String>,
    pub position: Option<String>,
}

#[derive(Serialize)]
pub struct AuthResponse {
    pub access_token: String,
    pub refresh_token: String,
    pub expires_in: i64,
    pub user: UserInfo,
}

#[derive(Serialize)]
pub struct UserInfo {
    pub id: Uuid,
    pub username: String,
    pub email: String,
    pub full_name: Option<String>,
    pub aae_employee_id: Option<String>,
    pub department: Option<String>,
    pub position: Option<String>,
    pub avatar_url: Option<String>,
}

#[derive(Deserialize)]
pub struct RefreshTokenRequest {
    pub refresh_token: String,
}

#[instrument(skip(state, request))]
pub async fn login(
    State(state): State<AppState>,
    Json(request): Json<LoginRequest>,
) -> impl IntoResponse {
    let auth_service = AuthService::new(state.db.clone(), state.config.clone());

    match auth_service.authenticate(&request.username, &request.password).await {
        Ok(auth_response) => {
            info!("User {} logged in successfully", request.username);
            (StatusCode::OK, Json(ApiResponse::success(auth_response)))
        }
        Err(e) => {
            error!("Login failed for user {}: {}", request.username, e);
            (
                StatusCode::UNAUTHORIZED,
                Json(ApiResponse::<()>::error("Invalid credentials".to_string())),
            )
        }
    }
}

#[instrument(skip(state, request))]
pub async fn register(
    State(state): State<AppState>,
    Json(request): Json<RegisterRequest>,
) -> impl IntoResponse {
    let auth_service = AuthService::new(state.db.clone(), state.config.clone());

    match auth_service.register(&request).await {
        Ok(auth_response) => {
            info!("User {} registered successfully", request.username);
            (StatusCode::CREATED, Json(ApiResponse::success(auth_response)))
        }
        Err(e) => {
            error!("Registration failed for user {}: {}", request.username, e);
            (
                StatusCode::BAD_REQUEST,
                Json(ApiResponse::<()>::error(format!("Registration failed: {}", e))),
            )
        }
    }
}

#[instrument(skip(state, request))]
pub async fn refresh_token(
    State(state): State<AppState>,
    Json(request): Json<RefreshTokenRequest>,
) -> impl IntoResponse {
    let auth_service = AuthService::new(state.db.clone(), state.config.clone());

    match auth_service.refresh_token(&request.refresh_token).await {
        Ok(auth_response) => {
            info!("Token refreshed successfully");
            (StatusCode::OK, Json(ApiResponse::success(auth_response)))
        }
        Err(e) => {
            error!("Token refresh failed: {}", e);
            (
                StatusCode::UNAUTHORIZED,
                Json(ApiResponse::<()>::error("Invalid refresh token".to_string())),
            )
        }
    }
}

#[instrument(skip(state))]
pub async fn logout(State(state): State<AppState>) -> impl IntoResponse {
    // TODO: Implement token blacklisting
    info!("User logged out");
    (StatusCode::OK, Json(ApiResponse::success("Logged out successfully")))
}