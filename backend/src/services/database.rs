use anyhow::Result;
use sqlx::{postgres::PgPoolOptions, PgPool};
use tracing::{info, instrument};

#[instrument]
pub async fn init_pool(database_url: &str) -> Result<PgPool> {
    info!("🔗 Connecting to PostgreSQL database...");
    
    let pool = PgPoolOptions::new()
        .max_connections(20)
        .min_connections(5)
        .acquire_timeout(std::time::Duration::from_secs(30))
        .idle_timeout(std::time::Duration::from_secs(600))
        .max_lifetime(std::time::Duration::from_secs(1800))
        .connect(database_url)
        .await?;

    // Run migrations
    run_migrations(&pool).await?;
    
    info!("✅ Database pool initialized successfully");
    Ok(pool)
}

#[instrument]
pub async fn run_migrations(pool: &PgPool) -> Result<()> {
    info!("🔄 Running database migrations...");
    
    // Create users table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            username VARCHAR(50) UNIQUE NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            full_name VARCHAR(255),
            aae_employee_id VARCHAR(20),
            department VARCHAR(100),
            position VARCHAR(100),
            avatar_url VARCHAR(500),
            is_active BOOLEAN DEFAULT true,
            last_seen TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )
        "#
    ).execute(pool).await?;

    // Create rooms table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS rooms (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) NOT NULL,
            description TEXT,
            room_type VARCHAR(20) DEFAULT 'group', -- 'direct', 'group', 'channel'
            is_encrypted BOOLEAN DEFAULT true,
            is_public BOOLEAN DEFAULT false,
            aae_department VARCHAR(100),
            matrix_room_id VARCHAR(255),
            created_by UUID REFERENCES users(id),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )
        "#
    ).execute(pool).await?;

    // Create messages table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS messages (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            room_id UUID NOT NULL REFERENCES rooms(id),
            user_id UUID NOT NULL REFERENCES users(id),
            content TEXT NOT NULL,
            message_type VARCHAR(20) DEFAULT 'text', -- 'text', 'file', 'image', 'voice'
            encrypted_content BYTEA,
            matrix_event_id VARCHAR(255),
            reply_to UUID REFERENCES messages(id),
            edited_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT NOW()
        )
        "#
    ).execute(pool).await?;

    // Create room_members table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS room_members (
            room_id UUID NOT NULL REFERENCES rooms(id),
            user_id UUID NOT NULL REFERENCES users(id),
            role VARCHAR(20) DEFAULT 'member', -- 'admin', 'moderator', 'member'
            joined_at TIMESTAMPTZ DEFAULT NOW(),
            PRIMARY KEY (room_id, user_id)
        )
        "#
    ).execute(pool).await?;

    // Create files table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS files (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            filename VARCHAR(255) NOT NULL,
            original_filename VARCHAR(255) NOT NULL,
            content_type VARCHAR(100) NOT NULL,
            file_size BIGINT NOT NULL,
            file_hash VARCHAR(64) NOT NULL,
            storage_path VARCHAR(500) NOT NULL,
            uploaded_by UUID NOT NULL REFERENCES users(id),
            room_id UUID REFERENCES rooms(id),
            is_encrypted BOOLEAN DEFAULT true,
            created_at TIMESTAMPTZ DEFAULT NOW()
        )
        "#
    ).execute(pool).await?;

    // Create indexes for performance
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_messages_room_id ON messages(room_id)")
        .execute(pool).await?;
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at)")
        .execute(pool).await?;
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)")
        .execute(pool).await?;
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)")
        .execute(pool).await?;

    // Create TimescaleDB hypertables for time-series data
    sqlx::query("SELECT create_hypertable('messages', 'created_at', if_not_exists => TRUE)")
        .execute(pool).await.ok(); // Ignore error if TimescaleDB is not available

    info!("✅ Database migrations completed successfully");
    Ok(())
}

#[instrument]
pub async fn health_check(pool: &PgPool) -> Result<()> {
    sqlx::query("SELECT 1").execute(pool).await?;
    Ok(())
}