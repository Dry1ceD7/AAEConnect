use axum::{extract::{Path, Query, State}, http::StatusCode, response::IntoResponse, Json};
use serde::{Deserialize, Serialize};
use tracing::{error, info, instrument};
use uuid::Uuid;

use crate::{services::messaging::{ChatMessage, MessagingService}, AppState, ApiResponse};

#[derive(Deserialize)]
pub struct GetMessagesQuery {
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

#[derive(Deserialize)]
pub struct SendMessageRequest {
    pub room_id: Uuid,
    pub content: String,
    pub message_type: Option<String>,
    pub reply_to: Option<Uuid>,
}

#[instrument(skip(state))]
pub async fn get_messages(
    Path(room_id): Path<Uuid>,
    Query(query): Query<GetMessagesQuery>,
    State(state): State<AppState>,
) -> impl IntoResponse {
    let messaging_service = MessagingService::new(state.db.clone());
    
    let limit = query.limit.unwrap_or(50).min(100); // Max 100 messages per request
    let offset = query.offset.unwrap_or(0);

    match messaging_service.get_messages(&room_id, limit, offset).await {
        Ok(messages) => {
            info!("Retrieved {} messages for room {}", messages.len(), room_id);
            (StatusCode::OK, Json(ApiResponse::success(messages)))
        }
        Err(e) => {
            error!("Failed to get messages for room {}: {}", room_id, e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::<()>::error("Failed to retrieve messages".to_string())),
            )
        }
    }
}

#[instrument(skip(state))]
pub async fn send_message(
    State(state): State<AppState>,
    Json(request): Json<SendMessageRequest>,
) -> impl IntoResponse {
    // TODO: Extract user ID from authentication context
    let user_id = Uuid::new_v4(); // Placeholder

    let message = ChatMessage {
        id: Uuid::new_v4(),
        room_id: request.room_id,
        user_id,
        username: "test_user".to_string(), // TODO: Get from auth context
        content: request.content,
        message_type: request.message_type.unwrap_or_else(|| "text".to_string()),
        reply_to: request.reply_to,
        created_at: chrono::Utc::now(),
    };

    let messaging_service = MessagingService::new(state.db.clone());

    match messaging_service.send_message(message.clone()).await {
        Ok(_) => {
            info!("Message sent successfully: {}", message.id);
            (StatusCode::CREATED, Json(ApiResponse::success(message)))
        }
        Err(e) => {
            error!("Failed to send message: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::<()>::error("Failed to send message".to_string())),
            )
        }
    }
}

#[instrument(skip(state))]
pub async fn get_message(
    Path(message_id): Path<Uuid>,
    State(state): State<AppState>,
) -> impl IntoResponse {
    match sqlx::query_as!(
        ChatMessage,
        r#"
        SELECT 
            m.id, m.room_id, m.user_id, m.content, m.message_type, m.reply_to, m.created_at,
            u.username as "username!"
        FROM messages m
        JOIN users u ON m.user_id = u.id
        WHERE m.id = $1
        "#,
        message_id
    )
    .fetch_optional(state.db.as_ref())
    .await
    {
        Ok(Some(message)) => {
            (StatusCode::OK, Json(ApiResponse::success(message)))
        }
        Ok(None) => {
            (
                StatusCode::NOT_FOUND,
                Json(ApiResponse::<()>::error("Message not found".to_string())),
            )
        }
        Err(e) => {
            error!("Failed to get message {}: {}", message_id, e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::<()>::error("Failed to retrieve message".to_string())),
            )
        }
    }
}