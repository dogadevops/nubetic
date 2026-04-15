# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies (use legacy-peer-deps to resolve Astro v6 compatibility)
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build Astro app
RUN npm run build

# Production stage
FROM node:22-alpine AS runner

WORKDIR /app

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Create directory for config persistence
RUN mkdir -p /app/src/data

# Expose port
EXPOSE 4321

# Environment variables (set in docker-compose or .env file)
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4321

# Start server
CMD ["node", "dist/server/entry.mjs"]