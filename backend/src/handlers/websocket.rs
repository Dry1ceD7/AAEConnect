use axum::{
    extract::{State, WebSocketUpgrade},
    response::Response,
};
use tracing::{error, info, instrument};
use uuid::Uuid;

use crate::{services::messaging::MessagingService, AppState};

#[instrument(skip(state))]
pub async fn websocket_handler(
    ws: WebSocketUpgrade,
    State(state): State<AppState>,
) -> Response {
    // TODO: Extract user information from authentication
    // For now, using placeholder values
    let user_id = Uuid::new_v4();
    let username = "test_user".to_string();

    info!("WebSocket connection request from user: {}", username);

    ws.on_upgrade(move |socket| {
        let messaging_service = MessagingService::new(state.db.clone());
        async move {
            messaging_service.handle_websocket(socket, user_id, username).await;
        }
    })
}