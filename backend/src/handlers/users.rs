use axum::{extract::{Query, State}, http::StatusCode, response::IntoResponse, Json};
use serde::{Deserialize, Serialize};
use tracing::{error, info, instrument};
use uuid::Uuid;

use crate::{handlers::auth::UserInfo, AppState, ApiResponse};

#[derive(Deserialize)]
pub struct SearchUsersQuery {
    pub q: String,
    pub limit: Option<i64>,
}

#[derive(Deserialize)]
pub struct UpdateProfileRequest {
    pub full_name: Option<String>,
    pub department: Option<String>,
    pub position: Option<String>,
    pub avatar_url: Option<String>,
}

#[instrument(skip(state))]
pub async fn get_profile(State(state): State<AppState>) -> impl IntoResponse {
    // TODO: Extract user ID from authentication context
    let user_id = Uuid::new_v4(); // Placeholder

    match get_user_by_id(&state, &user_id).await {
        Ok(Some(user)) => {
            (StatusCode::OK, Json(ApiResponse::success(user)))
        }
        Ok(None) => {
            (
                StatusCode::NOT_FOUND,
                Json(ApiResponse::<()>::error("User not found".to_string())),
            )
        }
        Err(e) => {
            error!("Failed to get user profile: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::<()>::error("Failed to retrieve profile".to_string())),
            )
        }
    }
}

#[instrument(skip(state))]
pub async fn update_profile(
    State(state): State<AppState>,
    Json(request): Json<UpdateProfileRequest>,
) -> impl IntoResponse {
    // TODO: Extract user ID from authentication context
    let user_id = Uuid::new_v4(); // Placeholder

    match sqlx::query!(
        r#"
        UPDATE users 
        SET full_name = COALESCE($2, full_name),
            department = COALESCE($3, department),
            position = COALESCE($4, position),
            avatar_url = COALESCE($5, avatar_url),
            updated_at = NOW()
        WHERE id = $1
        "#,
        user_id,
        request.full_name,
        request.department,
        request.position,
        request.avatar_url
    )
    .execute(state.db.as_ref())
    .await
    {
        Ok(_) => {
            info!("Profile updated for user {}", user_id);
            match get_user_by_id(&state, &user_id).await {
                Ok(Some(user)) => {
                    (StatusCode::OK, Json(ApiResponse::success(user)))
                }
                _ => {
                    (
                        StatusCode::INTERNAL_SERVER_ERROR,
                        Json(ApiResponse::<()>::error("Failed to retrieve updated profile".to_string())),
                    )
                }
            }
        }
        Err(e) => {
            error!("Failed to update profile for user {}: {}", user_id, e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::<()>::error("Failed to update profile".to_string())),
            )
        }
    }
}

#[instrument(skip(state))]
pub async fn search_users(
    Query(query): Query<SearchUsersQuery>,
    State(state): State<AppState>,
) -> impl IntoResponse {
    let limit = query.limit.unwrap_or(20).min(50); // Max 50 users per search
    let search_term = format!("%{}%", query.q);

    match sqlx::query_as!(
        UserInfo,
        r#"
        SELECT id, username, email, full_name, aae_employee_id, department, position, avatar_url
        FROM users 
        WHERE (username ILIKE $1 OR full_name ILIKE $1 OR email ILIKE $1 OR department ILIKE $1)
          AND is_active = true
        ORDER BY 
          CASE 
            WHEN username ILIKE $1 THEN 1
            WHEN full_name ILIKE $1 THEN 2
            WHEN email ILIKE $1 THEN 3
            ELSE 4
          END,
          username
        LIMIT $2
        "#,
        search_term,
        limit
    )
    .fetch_all(state.db.as_ref())
    .await
    {
        Ok(users) => {
            info!("Found {} users matching query: {}", users.len(), query.q);
            (StatusCode::OK, Json(ApiResponse::success(users)))
        }
        Err(e) => {
            error!("Failed to search users: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::<()>::error("Failed to search users".to_string())),
            )
        }
    }
}

async fn get_user_by_id(state: &AppState, user_id: &Uuid) -> anyhow::Result<Option<UserInfo>> {
    let user = sqlx::query_as!(
        UserInfo,
        r#"
        SELECT id, username, email, full_name, aae_employee_id, department, position, avatar_url
        FROM users 
        WHERE id = $1 AND is_active = true
        "#,
        user_id
    )
    .fetch_optional(state.db.as_ref())
    .await?;

    Ok(user)
}