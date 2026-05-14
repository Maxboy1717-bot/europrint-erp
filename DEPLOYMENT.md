# EuroPrint ERP — Production Deployment Runbook

This document is the canonical guide for deploying EuroPrint ERP to production. Last updated: 2026-05-14.

---

## 1. Prerequisites

### Host requirements
- **OS:** Ubuntu 22.04 LTS or newer (Alpine via Docker also supported)
- **CPU:** 2 cores minimum, 4 recommended
- **RAM:** 4 GB minimum, 8 GB recommended
- **Disk:** 20 GB minimum (DB + backups + logs); SSD strongly recommended
- **Network:** Inbound 80/443 (web), outbound 443 (Telegram, OpenAI, GCS)

### Runtime
- **Node.js:** v20.0.0 or higher
- **pnpm:** v9.0.0 or higher (via `corepack enable && corepack prepare pnpm@9 --activate`)
- **PostgreSQL:** v15+ with extensions `uuid-ossp`, `pg_trgm`
- **Redis:** v7+

### Optional services
- **S3-compatible storage:** for file uploads (GCS/AWS S3/MinIO)
- **Telegram Bot API:** for HR/CRM notifications (set `TELEGRAM_BOT_TOKEN`)
- **OpenAI/Anthropic:** for AI agents (graceful degradation if absent)

---

## 2. Two deployment paths

### Path A — Docker Compose (recommended for single-host)

```bash
git clone https://github.com/Maxboy1717-bot/europrint-erp.git
cd europrint-erp

# 1. Configure env
cp apps/api/.env.example .env
# Edit .env — fill ALL required variables (see §3)

# 2. Build + start
docker compose up -d --build

# 3. Wait for DB to be healthy
docker compose ps  # both postgres and redis should show "healthy"

# 4. Apply migrations
docker compose exec api pnpm --filter @workspace/db run db:migrate
docker compose exec api node scripts/apply-legacy-fixes.js   # see §4

# 5. Seed initial admin
docker compose exec -e ADMIN_SEED_PASSWORD='YourStrong!Password' \
  api pnpm --filter @europrint/api run seed

# 6. Verify
curl https://erp.europrint.uz/api/health
# Expected: {"status":"ok"}
```

### Path B — PM2 cluster (multi-server or bare-metal)

```bash
# On the server:
git clone https://github.com/Maxboy1717-bot/europrint-erp.git /srv/europrint
cd /srv/europrint
pnpm install --frozen-lockfile

# Build all packages (order matters)
pnpm --filter @workspace/db run build
pnpm --filter @europrint/api run build
pnpm --filter @workspace/erp-dashboard run build

# Set env vars (use /etc/europrint.env loaded by systemd or pm2)
sudo cp apps/api/.env.example /etc/europrint.env
sudo chmod 600 /etc/europrint.env
sudo vim /etc/europrint.env   # fill ALL required vars

# Migrations
pnpm --filter @workspace/db run db:migrate

# Seed (one-time, on first deploy)
ADMIN_SEED_PASSWORD='YourStrong!Password' \
  pnpm --filter @europrint/api run seed

# Start with PM2
pm2 start ecosystem.config.cjs --env production
pm2 save
pm2 startup   # follow the printed instructions

# Set up Nginx (see nginx.conf in repo root)
sudo cp nginx.conf /etc/nginx/nginx.conf
sudo nginx -t && sudo systemctl reload nginx
```

---

## 3. Required environment variables

These **MUST** be set before first start. See `apps/api/.env.example` for the
complete list of 49 variables. Critical ones below:

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/europrint
PGSSLMODE=require                                    # production: require SSL

# JWT (generate strong values)
JWT_SECRET=$(openssl rand -hex 32)                   # MUST be ≥32 chars
JWT_REFRESH_SECRET=$(openssl rand -hex 32)           # MUST differ from JWT_SECRET
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Redis
REDIS_HOST=redis.internal
REDIS_PORT=6379

# App
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://erp.europrint.uz
ALLOWED_ORIGINS=https://erp.europrint.uz             # comma-separated for multi-origin

# Initial admin (one-time, for seed command)
ADMIN_SEED_PASSWORD=YourStrong!Password
```

**Optional feature env vars** (empty = feature disabled):
- `TELEGRAM_BOT_TOKEN`, `TG_*_CHAT_ID` (9 chat IDs for routing)
- `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GOOGLE_API_KEY`
- `JITSI_APP_ID`, `JITSI_KEY_ID`, `JITSI_PRIVATE_KEY` (video calls)
- `GCS_BUCKET`, `GCS_KEYFILE` (object storage)
- `BACKUP_DIR=/var/backups/europrint`, `BACKUP_RETENTION_DAYS=30`

---

## 4. Database migrations

### Tracked migrations (Drizzle)
```bash
pnpm --filter @workspace/db run db:migrate
```
This applies all SQL files in `lib/db/drizzle/0000_*.sql` through the latest.

### Legacy fix-schema files
The project root contains 17 `fix-schema*.sql` files from earlier development
that haven't been consolidated into Drizzle migrations yet. **They must be
applied manually in this order:**

```bash
PGPASSWORD=$DB_PASS psql -h $DB_HOST -U $DB_USER -d europrint -f fix-schema.sql
for n in 2 3 4 5 6 7 8 9 10 11 12; do
  PGPASSWORD=$DB_PASS psql -h $DB_HOST -U $DB_USER -d europrint -f fix-schema-${n}.sql
done
for v in FINAL FINAL2 FINAL3 FINAL4 FINAL5; do
  PGPASSWORD=$DB_PASS psql -h $DB_HOST -U $DB_USER -d europrint -f fix-schema-${v}.sql
done
```

(Some files use `IF NOT EXISTS` so re-running is idempotent for those parts.
Verify with: `psql -d europrint -c '\dt'` afterwards.)

**TODO:** consolidate these into a tracked Drizzle migration (`0011_consolidated_fixes.sql`).
Tracked as a known blocker; ETA 4-8 hours.

### Seed initial data
```bash
# Admin user (one-time)
ADMIN_SEED_PASSWORD='Strong!Pass1' pnpm --filter @europrint/api run seed

# Master data (departments, positions, leave types, shift types, etc.)
pnpm --filter @europrint/api run seed:master-data

# Kanban templates (optional)
pnpm --filter @europrint/api run seed:kanban-templates
```

---

## 5. Verification after deploy

```bash
# 1. API health
curl https://erp.europrint.uz/api/health
# Expected: {"status":"ok"}

# 2. Login flow (uses real admin password from seed)
curl -X POST https://erp.europrint.uz/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"Strong!Pass1"}'
# Expected: {"accessToken":"...","refreshToken":"...","user":{...}}

# 3. Check logs
pm2 logs europrint-api --lines 50          # PM2 path
docker compose logs --tail=50 api          # Docker path

# 4. Database connection
docker compose exec postgres psql -U europrint -c 'SELECT count(*) FROM users;'

# 5. Redis connectivity
docker compose exec redis redis-cli ping
# Expected: PONG
```

---

## 6. Backup procedure

A daily backup cron is built into the API (runs at **03:00 server time**)
via `apps/api/src/cron/backup-database.cron.ts`. It produces gzipped SQL
dumps to `${BACKUP_DIR}` (default `/var/backups/europrint`) and prunes
files older than `${BACKUP_RETENTION_DAYS}` (default 30).

### Manual backup (before risky deploys)
```bash
# Full DB dump
pg_dump $DATABASE_URL --no-owner --no-privileges -Fc \
  > /var/backups/europrint/manual-$(date +%Y%m%d-%H%M%S).dump

# Verify backup
pg_restore --list /var/backups/europrint/manual-*.dump | head -50
```

### Offsite copy (recommended)
Sync to S3/GCS after each backup. Add to crontab on the host:
```cron
15 3 * * *  /usr/bin/aws s3 sync /var/backups/europrint/ s3://europrint-backups/$(date +\%Y/\%m)/
```

---

## 7. Rollback procedure

If a deploy goes wrong, roll back in this order:

### Step 1 — Revert API to previous build
```bash
# PM2 path
cd /srv/europrint
git log --oneline -10                  # find the previous good commit
git checkout <previous-commit>
pnpm install --frozen-lockfile
pnpm --filter @europrint/api run build
pnpm --filter @workspace/erp-dashboard run build
pm2 reload ecosystem.config.cjs --env production

# Docker path
docker compose down
git checkout <previous-commit>
docker compose up -d --build
```

### Step 2 — Restore database (only if schema changed and migrations are incompatible)
```bash
# WARNING: This OVERWRITES production data. Make sure you have a fresh backup first!
pg_restore --clean --if-exists -d $DATABASE_URL /var/backups/europrint/manual-LATEST.dump
```

### Step 3 — Verify
```bash
curl https://erp.europrint.uz/api/health
# Test login + a critical workflow (create order, view dashboard, etc.)
```

### Rollback time budget
- API-only rollback: **5-10 minutes** (build + reload)
- API + DB rollback: **30-60 minutes** (depends on DB size)

---

## 8. Monitoring & logging

### Application logs
- **API:** Pino structured JSON to stdout
  - PM2: `/var/log/europrint/api-{out,error}.log`
  - Docker: `docker compose logs api`
- **Nginx:** `/var/log/nginx/{access,error}.log`
- **PostgreSQL:** `/var/log/postgresql/`

### Prometheus metrics
The API exposes `/metrics` (prom-client integration). Scrape with:
```yaml
# prometheus.yml
scrape_configs:
  - job_name: europrint-api
    static_configs:
      - targets: ['api.europrint.uz:3000']
    metrics_path: /metrics
```

### Health endpoint
- **Path:** `GET /api/health`
- **Expected:** `200 OK` with `{"status":"ok"}`
- **Use for:** load balancer health checks, Kubernetes readiness probes,
  uptime monitoring (UptimeRobot, Pingdom, etc.)

### Recommended alerts (set up after first prod deploy)
- API health endpoint returns non-200 for >2 minutes
- Disk space <20% free
- DB connection pool exhausted (warning at >80%)
- Failed login attempts >100/minute (potential brute force)
- Backup cron failure (check logs daily)

---

## 9. Common operational tasks

### Add new admin user
```bash
# SQL one-liner (replace bcrypt hash from Node):
node -e "console.log(require('bcrypt').hashSync('NewPass!', 12))"
psql $DATABASE_URL -c "INSERT INTO users (username, password_hash, role, ...) VALUES (...);"
```

### Reset user password
```bash
# Same approach — update password_hash in users table
```

### Clear Redis cache (e.g., after schema change)
```bash
docker compose exec redis redis-cli FLUSHDB
```

### Scale horizontally (multiple API instances)
Edit `nginx.conf` upstream block:
```nginx
upstream api_backend {
  server api-1:3000 max_fails=3 fail_timeout=30s;
  server api-2:3000 max_fails=3 fail_timeout=30s;
  server api-3:3000 max_fails=3 fail_timeout=30s;
  keepalive 32;
}
```
Then `nginx -s reload`.

For PM2 cluster mode, just bump `instances` in `ecosystem.config.cjs` and
`pm2 reload`.

---

## 10. Known operational gaps

These are tracked but not yet addressed in production tooling. Mitigation
strategies are noted:

1. **JWT in localStorage (Frontend security)**
   - **Risk:** XSS attack can steal session tokens
   - **Mitigation:** strict CSP in Nginx + Helmet; WAF in front (Cloudflare)
   - **Fix ETA:** 3 dev-days for httpOnly cookie migration

2. **17 legacy fix-schema SQL files**
   - **Risk:** manual apply step is error-prone, no idempotency for some
   - **Mitigation:** wrap in a shell script + dry-run with `--single-transaction`
   - **Fix ETA:** 4-8 hours to consolidate into Drizzle migration 0011

3. **Frontend has 1,174 TypeScript errors** (`tsc --noEmit`)
   - **Risk:** type drift, silent bugs at runtime
   - **Mitigation:** Vite still transpiles correctly; runtime is unaffected
   - **Fix ETA:** 16-24 hours of mechanical fixes

4. **Limited frontend test coverage** (6 test files)
   - **Risk:** regressions land in production undetected
   - **Mitigation:** manual QA + extensive backend test coverage (235 spec files)
   - **Fix ETA:** ongoing — grow test coverage with new features

5. **No automated DB-level monitoring alerts**
   - **Risk:** slow queries, connection exhaustion may go unnoticed
   - **Mitigation:** Prometheus + Grafana stack (see §8)
   - **Fix ETA:** 1-2 days to set up Grafana dashboards

---

## 11. Contacts & escalation

- **Production incident on-call:** _[fill in]_
- **DBA / infra:** _[fill in]_
- **Frontend lead:** _[fill in]_
- **Backend lead:** _[fill in]_

For non-urgent improvements: open a GitHub issue at
https://github.com/Maxboy1717-bot/europrint-erp/issues.

---

*Document version: 1.0 | Maintained alongside source code.*
