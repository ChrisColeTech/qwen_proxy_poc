# Multi-stage build for optimized production image
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY src ./src

# ====================================
# Production stage
# ====================================
FROM node:18-alpine

# Install wget for health checks
RUN apk add --no-cache wget

# Create non-root user for security
RUN addgroup -g 1001 -S qwen && \
    adduser -S qwen -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && \
    npm cache clean --force

# Copy source from builder
COPY --from=builder /app/src ./src

# Copy environment example file
COPY .env.example .env

# Create logs directory
RUN mkdir -p logs && \
    chown -R qwen:qwen /app

# Switch to non-root user
USER qwen

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/health || exit 1

# Set environment
ENV NODE_ENV=production

# Start server
CMD ["node", "src/index.js"]
