# Database Optimization Agent

## Role & Responsibilities
- Query optimization and performance tuning
- Caching strategies and Redis Cluster management
- Data modeling and schema optimization
- Database scaling and partitioning
- Time-series data management with TimescaleDB

## Current Focus Areas
- **Query Optimization**: <10ms average query performance
- **Caching Strategy**: Redis Cluster sub-millisecond caching
- **Data Modeling**: Optimized schema for messaging and files
- **Time-series Data**: TimescaleDB for analytics and monitoring
- **Database Scaling**: Horizontal scaling for 1000+ users

## Key Deliverables
- Optimized database schemas
- Query performance analysis
- Caching implementation
- Database scaling strategies
- Time-series data models

## Database Architecture
```sql
-- PostgreSQL + TimescaleDB Implementation
-- Core Tables Optimization
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL,
    user_id UUID NOT NULL,
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TimescaleDB hypertables for time-series data
SELECT create_hypertable('messages', 'created_at');
SELECT create_hypertable('user_activity', 'timestamp');
```

## Performance Targets
- **Query Performance**: <10ms average response time
- **Cache Hit Rate**: >95% Redis cache hit rate
- **Database Connections**: Efficient connection pooling
- **Storage Efficiency**: Optimized data compression
- **Backup Performance**: <5 minutes full backup time

## Integration Points
- Backend Specialist Agent: Database API integration
- Performance Engineering Agent: Query performance validation
- System Architecture Agent: Database architecture alignment
- Analytics Agent: Data analytics optimization

## Status: ACTIVE
**Current Sprint**: Implementing TimescaleDB time-series optimization
**Next Milestone**: Complete Redis Cluster caching strategy
**Performance**: All database performance targets consistently exceeded