# Multi-stage build for production optimization
FROM node:22-alpine as builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Production stage
FROM node:22-alpine as production

# Create app directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S aaeconnect -u 1001

# Copy built dependencies
COPY --from=builder /app/node_modules ./node_modules

# Copy application code
COPY --chown=aaeconnect:nodejs . .

# Install BMAD Method for production
RUN npx bmad-method install --full --directory . --ide other

# Create necessary directories with proper permissions
RUN mkdir -p logs temp && \
    chown -R aaeconnect:nodejs logs temp docs .ai

# Expose port
EXPOSE 3000

# Switch to non-root user
USER aaeconnect

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node healthcheck.js

# Start the application
CMD ["npm", "start"]
