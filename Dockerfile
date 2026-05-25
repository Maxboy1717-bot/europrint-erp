# syntax=docker/dockerfile:1.7
# ============================================================================
# EuroPrint ERP — Production Dockerfile (API backend only)
# Multi-stage build: deps → build → runtime
#
# IMPORTANT: This image builds ONLY the NestJS API backend.
# Frontend (artifacts/erp-dashboard) is built separately because:
#   1. Rollup 4.x native binaries (@rollup/rollup-linux-*) are not in the
#      lockfile for either musl (Alpine) or glibc (sandboxed builds) and
#      pnpm --frozen-lockfile skips them.
#   2. Frontend is best served by Nginx as static files, not by NestJS.
# To build the frontend: run `pnpm --filter erp-dashboard run build` locally
# or use a separate Dockerfile.frontend with a non-sandboxed Node image.
# ============================================================================

# ── Stage 1: Install dependencies (cached layer) ────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

# Build toolchain for native node modules (bcrypt, etc.) — bcrypt's
# node-pre-gyp postinstall needs python3 + make + g++ as fallback if a
# prebuilt binary isn't available for musl.
RUN apk add --no-cache python3 make g++

# HUSKY=0 disables husky's prepare script (which needs .git, unavailable
# here). bcrypt's postinstall still runs to fetch/compile the native binary.
ENV HUSKY=0

# pnpm via corepack (no global install needed)
RUN corepack enable && corepack prepare pnpm@9 --activate

# Copy lockfile + workspace manifests + pnpm config for cached install.
# .npmrc is REQUIRED — without it, pnpm 9 defaults to autoInstallPeers=true
# which mismatches the lockfile (autoInstallPeers=false) and aborts with
# ERR_PNPM_LOCKFILE_CONFIG_MISMATCH.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/api/package.json ./apps/api/
COPY artifacts/erp-dashboard/package.json ./artifacts/erp-dashboard/
COPY lib/db/package.json ./lib/db/
COPY lib/api-zod/package.json ./lib/api-zod/
COPY lib/api-spec/package.json ./lib/api-spec/
COPY lib/api-client-react/package.json ./lib/api-client-react/
COPY lib/math-utils/package.json ./lib/math-utils/

RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# ── Stage 2: Build backend only (skip frontend) ──────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app
RUN apk add --no-cache python3 make g++
ENV HUSKY=0
RUN corepack enable && corepack prepare pnpm@9 --activate

# Copy source first (no nested node_modules thanks to .dockerignore).
COPY . .

# Reinstall in build stage to populate per-workspace node_modules with
# their .bin scripts (tsc, nest). Pnpm store mount is shared with deps
# so this is fast (resolves from cache, no network).
# HUSKY=0 skips husky's prepare script; bcrypt's postinstall still runs.
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# Build order: lib/db first (api depends on it), then api.
# Frontend (erp-dashboard) intentionally NOT built — see header comment.
RUN pnpm --filter @workspace/db run build && \
    pnpm --filter @europrint/api run build

# ── Stage 3: Production runtime (slim) ───────────────────────────────────────
FROM node:20-alpine AS runtime
WORKDIR /app

# pg_dump for backup cron + tini for proper PID 1 signal handling.
# postgresql-client is generic on Alpine 3.20+ (postgresql15-client renamed).
RUN apk add --no-cache postgresql-client tini

RUN corepack enable && corepack prepare pnpm@9 --activate

# Non-root user (rootless container best practice)
RUN addgroup -g 1001 -S nodejs && \
    adduser -u 1001 -S nodejs -G nodejs

# Copy whole /app from build stage to preserve pnpm's symlinked workspace
# node_modules (apps/api/node_modules → ../../node_modules/.pnpm/...).
# Without symlinks, runtime would fail with `Cannot find module 'module-alias/register'`
# because apps/api/dist/main.js requires module-alias which lives in workspace deps.
COPY --from=build --chown=nodejs:nodejs /app /app

# Trim non-runtime files that ended up in the COPY.
# NOTE: lib/*/src is KEPT — some HR compiled modules (e.g.
# onboarding-checklists.repository.js) have baked-in relative requires to
# `../../../../../../lib/db/src` that bypass `@workspace/db`. Keeping the
# source dirs is ~20 MB extra and avoids MODULE_NOT_FOUND at runtime.
# Frontend artifacts + scripts + docs + husky + github are safe to drop.
RUN rm -rf /app/apps/api/src /app/apps/api/test \
    /app/artifacts /app/scripts /app/docs /app/.husky /app/.github 2>/dev/null || true

USER nodejs

# Default port (override via env)
ENV NODE_ENV=production \
    PORT=3000

EXPOSE 3000

# tini handles SIGTERM/SIGINT correctly (Node's SIGTERM grace-period works)
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "apps/api/dist/main.js"]
