use anyhow::Result;
use matrix_sdk::{config::SyncSettings, Client, Session};
use ruma::UserId;
use tracing::{info, instrument};

use crate::config::MatrixConfig;

#[instrument]
pub async fn init_client(config: &MatrixConfig) -> Result<Client> {
    info!("🔗 Initializing Matrix client...");
    
    let client = Client::new_from_user_id(&config.homeserver_url.parse()?, &config.username.parse()?).await?;
    
    // Login to Matrix homeserver
    let response = client
        .login_username(&config.username, &config.password)
        .device_id(&config.device_id)
        .send()
        .await?;

    info!("✅ Matrix client logged in successfully");
    info!("🔑 Device ID: {}", response.device_id);
    
    // Start sync
    let sync_settings = SyncSettings::default().token(response.access_token);
    tokio::spawn(async move {
        client.sync(sync_settings).await;
    });
    
    Ok(client)
}
