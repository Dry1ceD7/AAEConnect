use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: Uuid,
    pub username: String,
    pub email: String,
    pub full_name: Option<String>,
    pub aae_employee_id: Option<String>,
    pub department: Option<String>,
    pub position: Option<String>,
    pub avatar_url: Option<String>,
    pub is_active: bool,
    pub last_seen: Option<chrono::DateTime<chrono::Utc>>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Room {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub room_type: String,
    pub is_encrypted: bool,
    pub is_public: bool,
    pub aae_department: Option<String>,
    pub matrix_room_id: Option<String>,
    pub created_by: Uuid,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Message {
    pub id: Uuid,
    pub room_id: Uuid,
    pub user_id: Uuid,
    pub content: String,
    pub message_type: String,
    pub encrypted_content: Option<Vec<u8>>,
    pub matrix_event_id: Option<String>,
    pub reply_to: Option<Uuid>,
    pub edited_at: Option<chrono::DateTime<chrono::Utc>>,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct File {
    pub id: Uuid,
    pub filename: String,
    pub original_filename: String,
    pub content_type: String,
    pub file_size: i64,
    pub file_hash: String,
    pub storage_path: String,
    pub uploaded_by: Uuid,
    pub room_id: Option<Uuid>,
    pub is_encrypted: bool,
    pub created_at: chrono::DateTime<chrono::Utc>,
}
