use axum::{
    extract::{Multipart, Path, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use serde::{Deserialize, Serialize};
use tracing::{error, info, instrument};
use uuid::Uuid;

use crate::{AppState, ApiResponse};

#[derive(Serialize)]
pub struct FileInfo {
    pub id: Uuid,
    pub filename: String,
    pub original_filename: String,
    pub content_type: String,
    pub file_size: i64,
    pub download_url: String,
    pub uploaded_by: Uuid,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[instrument(skip(state, multipart))]
pub async fn upload_file(
    State(state): State<AppState>,
    mut multipart: Multipart,
) -> impl IntoResponse {
    // TODO: Extract user ID from authentication context
    let user_id = Uuid::new_v4(); // Placeholder

    while let Some(field) = multipart.next_field().await.unwrap() {
        let name = field.name().unwrap_or("").to_string();
        let filename = field.file_name().unwrap_or("unknown").to_string();
        let content_type = field.content_type().unwrap_or("application/octet-stream").to_string();

        if name == "file" {
            let data = field.bytes().await.unwrap();
            let file_size = data.len() as i64;
            
            // Generate unique filename
            let file_id = Uuid::new_v4();
            let file_extension = std::path::Path::new(&filename)
                .extension()
                .and_then(|ext| ext.to_str())
                .unwrap_or("");
            let stored_filename = format!("{}.{}", file_id, file_extension);

            // TODO: Implement actual file storage (MinIO, local filesystem, etc.)
            let storage_path = format!("/files/{}", stored_filename);

            // Calculate file hash for integrity
            let file_hash = format!("{:x}", sha2::Sha256::digest(&data));

            match sqlx::query!(
                r#"
                INSERT INTO files (id, filename, original_filename, content_type, file_size, file_hash, storage_path, uploaded_by)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                "#,
                file_id,
                stored_filename,
                filename,
                content_type,
                file_size,
                file_hash,
                storage_path,
                user_id
            )
            .execute(state.db.as_ref())
            .await
            {
                Ok(_) => {
                    let file_info = FileInfo {
                        id: file_id,
                        filename: stored_filename,
                        original_filename: filename,
                        content_type,
                        file_size,
                        download_url: format!("/files/{}", file_id),
                        uploaded_by: user_id,
                        created_at: chrono::Utc::now(),
                    };

                    info!("File uploaded successfully: {} ({})", file_info.original_filename, file_id);
                    return (StatusCode::CREATED, Json(ApiResponse::success(file_info)));
                }
                Err(e) => {
                    error!("Failed to store file metadata: {}", e);
                    return (
                        StatusCode::INTERNAL_SERVER_ERROR,
                        Json(ApiResponse::<()>::error("Failed to upload file".to_string())),
                    );
                }
            }
        }
    }

    (
        StatusCode::BAD_REQUEST,
        Json(ApiResponse::<()>::error("No file provided".to_string())),
    )
}

#[instrument(skip(state))]
pub async fn download_file(
    Path(file_id): Path<Uuid>,
    State(state): State<AppState>,
) -> impl IntoResponse {
    match sqlx::query!(
        "SELECT filename, original_filename, content_type, storage_path FROM files WHERE id = $1",
        file_id
    )
    .fetch_optional(state.db.as_ref())
    .await
    {
        Ok(Some(file)) => {
            // TODO: Implement actual file retrieval from storage
            info!("File download requested: {} ({})", file.original_filename, file_id);
            
            // For now, return file metadata
            (
                StatusCode::OK,
                Json(ApiResponse::success(format!(
                    "File download would serve: {} from {}",
                    file.original_filename, file.storage_path
                ))),
            )
        }
        Ok(None) => {
            (
                StatusCode::NOT_FOUND,
                Json(ApiResponse::<()>::error("File not found".to_string())),
            )
        }
        Err(e) => {
            error!("Failed to get file {}: {}", file_id, e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::<()>::error("Failed to retrieve file".to_string())),
            )
        }
    }
}

use sha2::Digest;