use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::env;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub port: u16,
    pub database_url: String,
    pub redis_url: String,
    pub matrix_config: MatrixConfig,
    pub jwt_secret: String,
    pub environment: String,
    pub log_level: String,
    pub performance_targets: PerformanceTargets,
    pub aae_config: AaeConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MatrixConfig {
    pub homeserver_url: String,
    pub username: String,
    pub password: String,
    pub device_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceTargets {
    pub message_latency_ms: u64,
    pub file_upload_init_ms: u64,
    pub database_query_ms: u64,
    pub memory_limit_mb: u64,
    pub concurrent_users: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AaeConfig {
    pub company_name: String,
    pub ldap_url: String,
    pub ldap_base_dn: String,
    pub iso_compliance: Vec<String>,
    pub thai_language_support: bool,
    pub employee_capacity: u32,
}

impl AppConfig {
    pub fn load() -> Result<Self> {
        dotenvy::dotenv().ok();

        let config = Self {
            port: env::var("PORT")
                .unwrap_or_else(|_| "3000".to_string())
                .parse()
                .unwrap_or(3000),
            
            database_url: env::var("DATABASE_URL")
                .unwrap_or_else(|_| "postgresql://aaeconnect:aaeconnect123@localhost:5432/aaeconnect".to_string()),
            
            redis_url: env::var("REDIS_URL")
                .unwrap_or_else(|_| "redis://localhost:6379".to_string()),
            
            matrix_config: MatrixConfig {
                homeserver_url: env::var("MATRIX_HOMESERVER_URL")
                    .unwrap_or_else(|_| "https://matrix.aae.local".to_string()),
                username: env::var("MATRIX_USERNAME")
                    .unwrap_or_else(|_| "aaeconnect".to_string()),
                password: env::var("MATRIX_PASSWORD")
                    .unwrap_or_else(|_| "secure_password".to_string()),
                device_id: env::var("MATRIX_DEVICE_ID")
                    .unwrap_or_else(|_| "AAEConnect_Server".to_string()),
            },
            
            jwt_secret: env::var("JWT_SECRET")
                .unwrap_or_else(|_| "your-super-secret-jwt-key-here".to_string()),
            
            environment: env::var("NODE_ENV")
                .unwrap_or_else(|_| "development".to_string()),
            
            log_level: env::var("LOG_LEVEL")
                .unwrap_or_else(|_| "info".to_string()),
            
            performance_targets: PerformanceTargets {
                message_latency_ms: 25,
                file_upload_init_ms: 500,
                database_query_ms: 10,
                memory_limit_mb: 25,
                concurrent_users: 1000,
            },
            
            aae_config: AaeConfig {
                company_name: "Advanced ID Asia Engineering Co.,Ltd".to_string(),
                ldap_url: env::var("LDAP_URL")
                    .unwrap_or_else(|_| "ldap://ldap.aae.local:389".to_string()),
                ldap_base_dn: env::var("LDAP_BASE_DN")
                    .unwrap_or_else(|_| "dc=aae,dc=local".to_string()),
                iso_compliance: vec![
                    "ISO 9001:2015".to_string(),
                    "IATF 16949".to_string(),
                ],
                thai_language_support: true,
                employee_capacity: 1000,
            },
        };

        Ok(config)
    }
}

impl Default for AppConfig {
    fn default() -> Self {
        Self::load().expect("Failed to load configuration")
    }
}