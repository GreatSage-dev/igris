# ==============================================================================
# IGRIS — Ephemeral Quarantine Blast Chamber & MCP Server
# Target Platform: Google Cloud Run (GitLab "Life After Code" Hackathon Bonus)
# ==============================================================================

# Build Stage
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json tsconfig.json ./
RUN npm ci

COPY src ./src
COPY scripts ./scripts
COPY index.html ./
RUN npm run build

# Production Runner Stage
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

# Install Git for Gate 3 Bisection
RUN apk add --no-cache git

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/index.html ./index.html
COPY evidence ./evidence

# Non-root secure execution
RUN addgroup -S igris && adduser -S igris -G igris
RUN chown -R igris:igris /app
USER igris

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/ || exit 1

CMD ["node", "dist/server.js"]
