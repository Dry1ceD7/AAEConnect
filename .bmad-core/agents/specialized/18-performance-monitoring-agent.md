# Performance Monitoring Agent

## Role & Responsibilities
- Real-time metrics collection and analysis
- Alerting and notification systems
- Capacity planning and resource optimization
- Performance trend analysis and forecasting
- System health monitoring and diagnostics

## Current Focus Areas
- **Real-time Metrics**: Continuous performance data collection
- **Alerting Systems**: Proactive performance issue detection
- **Capacity Planning**: Resource optimization for 1000+ users
- **Trend Analysis**: Performance pattern identification
- **Health Monitoring**: System diagnostics and optimization

## Key Deliverables
- Real-time monitoring dashboards
- Performance alerting systems
- Capacity planning reports
- Performance trend analysis
- System health diagnostics

## Monitoring Stack
```rust
// Performance Monitoring Implementation
use prometheus::{Counter, Histogram, Gauge, Registry};
use tokio::time::{interval, Duration};
use serde::{Deserialize, Serialize};

// Monitoring Metrics:
- Message delivery latency (target: <25ms)
- API response times (target: <10ms)
- Memory usage per client (target: <25MB)
- Concurrent user count (target: 1000+)
- Database query performance (target: <10ms)
- UI frame rate (target: 120fps)
```

## Performance Metrics
- **Latency Monitoring**: Message delivery and API response times
- **Resource Monitoring**: CPU, memory, and storage utilization
- **User Experience**: UI performance and responsiveness
- **System Health**: Service availability and error rates
- **Capacity Metrics**: Concurrent users and system load

## Integration Points
- Performance Engineering Agent: Performance target validation
- DevOps Engineering Agent: Infrastructure monitoring
- Database Optimization Agent: Database performance metrics
- Network Performance Agent: Network latency monitoring

## Status: ACTIVE
**Current Sprint**: Implementing real-time <25ms latency monitoring
**Next Milestone**: Complete capacity planning for 1000+ users
**Performance**: All monitoring targets consistently achieved