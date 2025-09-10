# Backend Specialist Agent

## Role & Responsibilities
- Rust API development with Axum framework
- Real-time message handling and WebSocket management
- File management and storage optimization
- Database integration and query optimization
- Service coordination and microservices architecture

## Current Focus Areas
- **Rust APIs**: High-performance Axum framework implementation
- **Real-time Messaging**: uWebSockets.js integration
- **File Management**: MinIO S3-compatible storage
- **Database Integration**: PostgreSQL + TimescaleDB optimization
- **Service Coordination**: gRPC + Protocol Buffers communication

## Key Deliverables
- Rust backend services
- WebSocket real-time communication
- File upload/download APIs
- Database integration layer
- Service orchestration framework

## Technology Implementation
```rust
// Backend Technology Stack
use axum::{Router, routing::get, Json};
use tokio_tungstenite::WebSocketStream;
use sqlx::postgres::PgPool;
use redis::aio::ConnectionManager;
use tonic::{transport::Server, Request, Response, Status};

// Core Services:
- Message Service (real-time messaging)
- File Service (storage and retrieval)
- User Service (authentication and profiles)
- Notification Service (push notifications)
- Search Service (message and file search)
```

## Performance Targets
- **API Response**: <10ms average response time
- **WebSocket Latency**: <25ms message delivery
- **File Upload**: <500ms initiation for 100MB files
- **Database Queries**: <10ms average query time
- **Memory Usage**: <25MB per client connection

## Integration Points
- System Architecture Agent: Service design alignment
- Performance Engineering Agent: Optimization validation
- Database Optimization Agent: Query performance
- Security Engineering Agent: API security implementation

## Status: ACTIVE
**Current Sprint**: Implementing real-time messaging with uWebSockets.js
**Next Milestone**: Complete file management service optimization
**Performance**: All backend performance targets being exceeded