use anyhow::Result;
use axum::extract::ws::{Message, WebSocket};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use std::{collections::HashMap, sync::Arc};
use tokio::sync::{broadcast, RwLock};
use tracing::{error, info, instrument, warn};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatMessage {
    pub id: Uuid,
    pub room_id: Uuid,
    pub user_id: Uuid,
    pub username: String,
    pub content: String,
    pub message_type: String,
    pub reply_to: Option<Uuid>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebSocketMessage {
    pub message_type: String,
    pub data: serde_json::Value,
    pub timestamp: DateTime<Utc>,
}

#[derive(Debug, Clone)]
pub struct ConnectedUser {
    pub user_id: Uuid,
    pub username: String,
    pub sender: broadcast::Sender<WebSocketMessage>,
}

pub struct MessagingService {
    db: Arc<PgPool>,
    connections: Arc<RwLock<HashMap<Uuid, ConnectedUser>>>,
    room_channels: Arc<RwLock<HashMap<Uuid, broadcast::Sender<WebSocketMessage>>>>,
}

impl MessagingService {
    pub fn new(db: Arc<PgPool>) -> Self {
        Self {
            db,
            connections: Arc::new(RwLock::new(HashMap::new())),
            room_channels: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    #[instrument(skip(self))]
    pub async fn add_connection(&self, user_id: Uuid, username: String) -> broadcast::Receiver<WebSocketMessage> {
        let (tx, rx) = broadcast::channel(1000);
        
        let user = ConnectedUser {
            user_id,
            username: username.clone(),
            sender: tx,
        };

        self.connections.write().await.insert(user_id, user);
        
        info!("User {} connected to WebSocket", username);
        rx
    }

    #[instrument(skip(self))]
    pub async fn remove_connection(&self, user_id: &Uuid) {
        if let Some(user) = self.connections.write().await.remove(user_id) {
            info!("User {} disconnected from WebSocket", user.username);
        }
    }

    #[instrument(skip(self))]
    pub async fn send_message(&self, message: ChatMessage) -> Result<()> {
        let start_time = std::time::Instant::now();

        // Store message in database
        let stored_message = self.store_message(&message).await?;

        // Create WebSocket message
        let ws_message = WebSocketMessage {
            message_type: "new_message".to_string(),
            data: serde_json::to_value(&stored_message)?,
            timestamp: Utc::now(),
        };

        // Send to all users in the room
        self.broadcast_to_room(&message.room_id, ws_message).await?;

        let latency = start_time.elapsed();
        if latency.as_millis() > 25 {
            warn!("Message delivery exceeded 25ms target: {}ms", latency.as_millis());
        } else {
            info!("Message delivered in {}ms", latency.as_millis());
        }

        Ok(())
    }

    #[instrument(skip(self))]
    async fn store_message(&self, message: &ChatMessage) -> Result<ChatMessage> {
        let stored_message = sqlx::query_as!(
            ChatMessage,
            r#"
            INSERT INTO messages (id, room_id, user_id, content, message_type, reply_to, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id, room_id, user_id, content, message_type, reply_to, created_at,
                     (SELECT username FROM users WHERE id = $3) as "username!"
            "#,
            message.id,
            message.room_id,
            message.user_id,
            message.content,
            message.message_type,
            message.reply_to,
            message.created_at
        )
        .fetch_one(self.db.as_ref())
        .await?;

        Ok(stored_message)
    }

    #[instrument(skip(self))]
    async fn broadcast_to_room(&self, room_id: &Uuid, message: WebSocketMessage) -> Result<()> {
        // Get room members
        let room_members = self.get_room_members(room_id).await?;

        let connections = self.connections.read().await;
        let mut sent_count = 0;

        for member_id in room_members {
            if let Some(user) = connections.get(&member_id) {
                if let Err(e) = user.sender.send(message.clone()) {
                    warn!("Failed to send message to user {}: {}", user.username, e);
                } else {
                    sent_count += 1;
                }
            }
        }

        info!("Broadcasted message to {} users in room {}", sent_count, room_id);
        Ok(())
    }

    #[instrument(skip(self))]
    async fn get_room_members(&self, room_id: &Uuid) -> Result<Vec<Uuid>> {
        let members = sqlx::query!(
            "SELECT user_id FROM room_members WHERE room_id = $1",
            room_id
        )
        .fetch_all(self.db.as_ref())
        .await?
        .into_iter()
        .map(|row| row.user_id)
        .collect();

        Ok(members)
    }

    #[instrument(skip(self))]
    pub async fn get_messages(&self, room_id: &Uuid, limit: i64, offset: i64) -> Result<Vec<ChatMessage>> {
        let messages = sqlx::query_as!(
            ChatMessage,
            r#"
            SELECT 
                m.id, m.room_id, m.user_id, m.content, m.message_type, m.reply_to, m.created_at,
                u.username as "username!"
            FROM messages m
            JOIN users u ON m.user_id = u.id
            WHERE m.room_id = $1
            ORDER BY m.created_at DESC
            LIMIT $2 OFFSET $3
            "#,
            room_id,
            limit,
            offset
        )
        .fetch_all(self.db.as_ref())
        .await?;

        Ok(messages)
    }

    #[instrument(skip(self))]
    pub async fn handle_websocket(&self, socket: WebSocket, user_id: Uuid, username: String) {
        let mut rx = self.add_connection(user_id, username.clone()).await;
        let (mut sender, mut receiver) = socket.split();

        // Handle outgoing messages
        let outgoing = {
            let service = self.clone();
            tokio::spawn(async move {
                while let Ok(msg) = rx.recv().await {
                    let json_msg = serde_json::to_string(&msg).unwrap_or_default();
                    if sender.send(Message::Text(json_msg)).await.is_err() {
                        break;
                    }
                }
            })
        };

        // Handle incoming messages
        let incoming = {
            let service = self.clone();
            tokio::spawn(async move {
                while let Some(msg) = receiver.next().await {
                    if let Ok(msg) = msg {
                        if let Ok(text) = msg.to_text() {
                            if let Err(e) = service.handle_incoming_message(text, &user_id).await {
                                error!("Error handling incoming message: {}", e);
                            }
                        }
                    } else {
                        break;
                    }
                }
            })
        };

        // Wait for either task to finish
        tokio::select! {
            _ = outgoing => {},
            _ = incoming => {},
        }

        // Clean up connection
        self.remove_connection(&user_id).await;
    }

    #[instrument(skip(self))]
    async fn handle_incoming_message(&self, message: &str, user_id: &Uuid) -> Result<()> {
        let ws_message: WebSocketMessage = serde_json::from_str(message)?;

        match ws_message.message_type.as_str() {
            "send_message" => {
                let chat_message: ChatMessage = serde_json::from_value(ws_message.data)?;
                self.send_message(chat_message).await?;
            }
            "typing" => {
                // Handle typing indicators
                self.handle_typing_indicator(ws_message.data, user_id).await?;
            }
            "read_receipt" => {
                // Handle read receipts
                self.handle_read_receipt(ws_message.data, user_id).await?;
            }
            _ => {
                warn!("Unknown message type: {}", ws_message.message_type);
            }
        }

        Ok(())
    }

    #[instrument(skip(self))]
    async fn handle_typing_indicator(&self, data: serde_json::Value, user_id: &Uuid) -> Result<()> {
        // Implement typing indicator logic
        info!("Handling typing indicator for user {}", user_id);
        Ok(())
    }

    #[instrument(skip(self))]
    async fn handle_read_receipt(&self, data: serde_json::Value, user_id: &Uuid) -> Result<()> {
        // Implement read receipt logic
        info!("Handling read receipt for user {}", user_id);
        Ok(())
    }
}

impl Clone for MessagingService {
    fn clone(&self) -> Self {
        Self {
            db: Arc::clone(&self.db),
            connections: Arc::clone(&self.connections),
            room_channels: Arc::clone(&self.room_channels),
        }
    }
}

use futures_util::{SinkExt, StreamExt};