use chrono::{DateTime, Utc};
use uuid::Uuid;

pub fn generate_id() -> Uuid {
    Uuid::new_v4()
}

pub fn current_timestamp() -> DateTime<Utc> {
    Utc::now()
}

pub fn format_duration_ms(duration: std::time::Duration) -> u64 {
    duration.as_millis() as u64
}

pub fn validate_performance_target(actual_ms: u64, target_ms: u64, operation: &str) -> bool {
    if actual_ms <= target_ms {
        tracing::info!("✅ {} completed in {}ms (target: {}ms)", operation, actual_ms, target_ms);
        true
    } else {
        tracing::warn!("⚠️  {} took {}ms, exceeding target of {}ms", operation, actual_ms, target_ms);
        false
    }
}
