use anyhow::{anyhow, Result};
use argon2::{
    password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use chrono::{Duration, Utc};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use rand_core::OsRng;
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use std::sync::Arc;
use tracing::{error, info, instrument};
use uuid::Uuid;

use crate::{config::AppConfig, handlers::auth::{AuthResponse, RegisterRequest, UserInfo}};

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String, // Subject (user ID)
    pub username: String,
    pub email: String,
    pub exp: i64, // Expiration time
    pub iat: i64, // Issued at
    pub iss: String, // Issuer
}

pub struct AuthService {
    db: Arc<PgPool>,
    config: Arc<AppConfig>,
    argon2: Argon2<'static>,
}

impl AuthService {
    pub fn new(db: Arc<PgPool>, config: Arc<AppConfig>) -> Self {
        Self {
            db,
            config,
            argon2: Argon2::default(),
        }
    }

    #[instrument(skip(self, password))]
    pub async fn authenticate(&self, username: &str, password: &str) -> Result<AuthResponse> {
        // First try database authentication
        if let Ok(response) = self.database_authenticate(username, password).await {
            return Ok(response);
        }

        // If database auth fails, try LDAP authentication for AAE employees
        self.ldap_authenticate(username, password).await
    }

    #[instrument(skip(self, password))]
    async fn database_authenticate(&self, username: &str, password: &str) -> Result<AuthResponse> {
        let user = sqlx::query!(
            r#"
            SELECT id, username, email, password_hash, full_name, aae_employee_id, 
                   department, position, avatar_url
            FROM users 
            WHERE username = $1 OR email = $1
            "#,
            username
        )
        .fetch_optional(self.db.as_ref())
        .await?;

        let user = user.ok_or_else(|| anyhow!("User not found"))?;

        // Verify password
        let parsed_hash = PasswordHash::new(&user.password_hash)?;
        self.argon2
            .verify_password(password.as_bytes(), &parsed_hash)
            .map_err(|_| anyhow!("Invalid password"))?;

        let user_info = UserInfo {
            id: user.id,
            username: user.username.clone(),
            email: user.email.clone(),
            full_name: user.full_name,
            aae_employee_id: user.aae_employee_id,
            department: user.department,
            position: user.position,
            avatar_url: user.avatar_url,
        };

        let (access_token, refresh_token) = self.generate_tokens(&user_info).await?;

        Ok(AuthResponse {
            access_token,
            refresh_token,
            expires_in: 3600, // 1 hour
            user: user_info,
        })
    }

    #[instrument(skip(self, password))]
    async fn ldap_authenticate(&self, username: &str, password: &str) -> Result<AuthResponse> {
        // TODO: Implement LDAP authentication for AAE employees
        // This would connect to AAE's LDAP/AD server and verify credentials
        
        info!("LDAP authentication attempted for user: {}", username);
        
        // For now, return error - implement LDAP client in production
        Err(anyhow!("LDAP authentication not yet implemented"))
    }

    #[instrument(skip(self, request))]
    pub async fn register(&self, request: &RegisterRequest) -> Result<AuthResponse> {
        // Hash password
        let salt = SaltString::generate(&mut OsRng);
        let password_hash = self
            .argon2
            .hash_password(request.password.as_bytes(), &salt)?
            .to_string();

        // Insert user into database
        let user_id = Uuid::new_v4();
        sqlx::query!(
            r#"
            INSERT INTO users (id, username, email, password_hash, full_name, aae_employee_id, department, position)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            "#,
            user_id,
            request.username,
            request.email,
            password_hash,
            request.full_name,
            request.aae_employee_id,
            request.department,
            request.position
        )
        .execute(self.db.as_ref())
        .await
        .map_err(|e| anyhow!("Failed to create user: {}", e))?;

        let user_info = UserInfo {
            id: user_id,
            username: request.username.clone(),
            email: request.email.clone(),
            full_name: Some(request.full_name.clone()),
            aae_employee_id: request.aae_employee_id.clone(),
            department: request.department.clone(),
            position: request.position.clone(),
            avatar_url: None,
        };

        let (access_token, refresh_token) = self.generate_tokens(&user_info).await?;

        Ok(AuthResponse {
            access_token,
            refresh_token,
            expires_in: 3600,
            user: user_info,
        })
    }

    #[instrument(skip(self))]
    pub async fn refresh_token(&self, refresh_token: &str) -> Result<AuthResponse> {
        // Decode and validate refresh token
        let token_data = decode::<Claims>(
            refresh_token,
            &DecodingKey::from_secret(self.config.jwt_secret.as_ref()),
            &Validation::default(),
        )?;

        let user_id: Uuid = token_data.claims.sub.parse()?;

        // Get user from database
        let user = sqlx::query!(
            r#"
            SELECT id, username, email, full_name, aae_employee_id, department, position, avatar_url
            FROM users 
            WHERE id = $1
            "#,
            user_id
        )
        .fetch_optional(self.db.as_ref())
        .await?;

        let user = user.ok_or_else(|| anyhow!("User not found"))?;

        let user_info = UserInfo {
            id: user.id,
            username: user.username,
            email: user.email,
            full_name: user.full_name,
            aae_employee_id: user.aae_employee_id,
            department: user.department,
            position: user.position,
            avatar_url: user.avatar_url,
        };

        let (access_token, refresh_token) = self.generate_tokens(&user_info).await?;

        Ok(AuthResponse {
            access_token,
            refresh_token,
            expires_in: 3600,
            user: user_info,
        })
    }

    #[instrument(skip(self))]
    async fn generate_tokens(&self, user: &UserInfo) -> Result<(String, String)> {
        let now = Utc::now();
        let access_exp = now + Duration::hours(1);
        let refresh_exp = now + Duration::days(30);

        let access_claims = Claims {
            sub: user.id.to_string(),
            username: user.username.clone(),
            email: user.email.clone(),
            exp: access_exp.timestamp(),
            iat: now.timestamp(),
            iss: "AAEConnect".to_string(),
        };

        let refresh_claims = Claims {
            sub: user.id.to_string(),
            username: user.username.clone(),
            email: user.email.clone(),
            exp: refresh_exp.timestamp(),
            iat: now.timestamp(),
            iss: "AAEConnect".to_string(),
        };

        let access_token = encode(
            &Header::default(),
            &access_claims,
            &EncodingKey::from_secret(self.config.jwt_secret.as_ref()),
        )?;

        let refresh_token = encode(
            &Header::default(),
            &refresh_claims,
            &EncodingKey::from_secret(self.config.jwt_secret.as_ref()),
        )?;

        Ok((access_token, refresh_token))
    }

    #[instrument(skip(self))]
    pub async fn validate_token(&self, token: &str) -> Result<Claims> {
        let token_data = decode::<Claims>(
            token,
            &DecodingKey::from_secret(self.config.jwt_secret.as_ref()),
            &Validation::default(),
        )?;

        Ok(token_data.claims)
    }
}