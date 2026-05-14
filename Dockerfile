# syntax=docker/dockerfile:1.7
# ============================================================================
# EuroPrint ERP — Production Dockerfile
# Multi-stage build: deps → build → runtime
# ============================================================================

# ── Stage 1: Install dependencies (cached layer) ────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

# pnpm via corepack (no global install needed)
RUN corepack enable && corepack prepare pnpm@9 --activate

# Copy lockfile + workspace manifests for cached install
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY artifacts/erp-dashboard/package.json ./artifacts/erp-dashboard/
COPY lib/db/package.json ./lib/db/
COPY lib/api-zod/package.json ./lib/api-zod/
COPY lib/api-spec/package.json ./lib/api-spec/
COPY lib/api-client-react/package.json ./lib/api-client-react/
COPY lib/math-utils/package.json ./lib/math-utils/

RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# ── Stage 2: Build all packages ──────────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9 --activate

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build order matters: lib/db first (others depend on it), then api + frontend
RUN pnpm --filter @workspace/db run build && \
    pnpm --filter @europrint/api run build && \
    pnpm --filter @workspace/erp-dashboard run build

# ── Stage 3: Production runtime (slim) ───────────────────────────────────────
FROM node:20-alpine AS runtime
WORKDIR /app

# pg_dump for the backup cron + tini for proper PID 1 signal handling
RUN apk add --no-cache postgresql15-client tini

RUN corepack enable && corepack prepare pnpm@9 --activate

# Non-root user (rootless container best practice)
RUN addgroup -g 1001 -S nodejs && \
    adduser -u 1001 -S nodejs -G nodejs

# Copy only what's needed at runtime
COPY --from=build --chown=nodejs:nodejs /app/apps/api/dist ./apps/api/dist
COPY --from=build --chown=nodejs:nodejs /app/apps/api/package.json ./apps/api/
COPY --from=build --chown=nodejs:nodejs /app/artifacts/erp-dashboard/dist ./artifacts/erp-dashboard/dist
COPY --from=build --chown=nodejs:nodejs /app/lib ./lib
COPY --from=build --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nodejs:nodejs /app/package.json /app/pnpm-workspace.yaml ./

USER nodejs

# Default port (override via env)
ENV NODE_ENV=production \
    PORT=3000

EXPOSE 3000

# tini handles SIGTERM/SIGINT correctly (Node's SIGTERM grace-period works)
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "apps/api/dist/main.js"]
