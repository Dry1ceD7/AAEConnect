use anyhow::Result;
use redis::{Client, Connection};
use tracing::{info, instrument};

#[instrument]
pub async fn init_client(redis_url: &str) -> Result<Client> {
    info!("🔗 Connecting to Redis...");
    
    let client = Client::open(redis_url)?;
    
    // Test connection
    let mut conn = client.get_connection()?;
    redis::cmd("PING").query::<String>(&mut conn)?;
    
    info!("✅ Redis client initialized successfully");
    Ok(client)
}
