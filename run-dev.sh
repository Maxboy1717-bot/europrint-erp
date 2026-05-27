#!/usr/bin/env bash
# ============================================================================
# EuroPrint ERP — local dev ishga tushirish skripti
# ============================================================================
# Backend (NestJS, :3030) + Frontend (Vite erp-dashboard, :20806) ni birga
# ishga tushiradi. Git Bash / WSL / Linux / macOS da ishlaydi.
#
# Ishlatish:
#   bash run-dev.sh              # backend + frontend
#   bash run-dev.sh --docker-db  # avval Postgres+Redis konteynerini ko'taradi
#   bash run-dev.sh --api        # faqat backend
#   bash run-dev.sh --web        # faqat frontend
#   bash run-dev.sh --seed       # ishga tushirishdan oldin admin seed
#
# Talablar: Node >=20, pnpm >=9, (ixtiyoriy) Docker — DB/Redis uchun.
# ============================================================================
set -euo pipefail

# Skript joylashgan papka = monorepo root
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

API_PORT=3030
WEB_PORT=20806

RUN_API=1
RUN_WEB=1
DOCKER_DB=0
DO_SEED=0

for arg in "$@"; do
  case "$arg" in
    --api)       RUN_API=1; RUN_WEB=0 ;;
    --web)       RUN_API=0; RUN_WEB=1 ;;
    --docker-db) DOCKER_DB=1 ;;
    --seed)      DO_SEED=1 ;;
    -h|--help)
      grep '^#' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "Noma'lum argument: $arg (--help ko'ring)"; exit 1 ;;
  esac
done

log()  { printf '\033[1;34m[run-dev]\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[run-dev]\033[0m %s\n' "$*"; }
die()  { printf '\033[1;31m[run-dev]\033[0m %s\n' "$*" >&2; exit 1; }

# --- 1. Talablarni tekshirish -----------------------------------------------
command -v node >/dev/null 2>&1 || die "node topilmadi. Node >=20 o'rnating."
command -v pnpm >/dev/null 2>&1 || die "pnpm topilmadi. 'corepack enable' yoki 'npm i -g pnpm@9' qiling."

NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
[ "$NODE_MAJOR" -ge 20 ] || warn "Node $NODE_MAJOR < 20 — muammo bo'lishi mumkin."

# --- 2. Bog'liqliklarni o'rnatish (node_modules yo'q bo'lsa) -----------------
if [ ! -d "node_modules" ]; then
  log "node_modules yo'q — pnpm install..."
  pnpm install
else
  log "node_modules mavjud — install o'tkazib yuborildi."
fi

# --- 3. (ixtiyoriy) Docker'da Postgres + Redis ------------------------------
if [ "$DOCKER_DB" -eq 1 ]; then
  command -v docker >/dev/null 2>&1 || die "docker topilmadi (--docker-db uchun kerak)."
  log "Postgres + Redis konteynerlarini ko'taryapman (apps/api/.env credentials bilan)..."
  docker rm -f europrint-pg europrint-redis >/dev/null 2>&1 || true
  docker run -d --name europrint-pg \
    -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=europrint \
    -p 5432:5432 postgres:15-alpine >/dev/null
  docker run -d --name europrint-redis -p 6379:6379 redis:7-alpine >/dev/null
  log "Postgres tayyor bo'lishini kutyapman..."
  for _ in $(seq 1 30); do
    if docker exec europrint-pg pg_isready -U postgres >/dev/null 2>&1; then break; fi
    sleep 1
  done
  log "DB/Redis tayyor."
fi

# --- 4. PostgreSQL ulanishini tekshirish (ogohlantirish) --------------------
if command -v pg_isready >/dev/null 2>&1; then
  pg_isready -h localhost -p 5432 >/dev/null 2>&1 \
    || warn "PostgreSQL :5432 da javob bermayapti. (--docker-db bilan ko'tarishingiz mumkin)"
else
  warn "pg_isready yo'q — DB holatini tekshira olmadim. Backend ulanmasa Postgres'ni ishga tushiring."
fi

# --- 5. lib/db ni build qilish (@workspace/db dist/cjs talab qilinadi) ------
log "lib/db (@workspace/db) build qilinmoqda..."
pnpm --filter @workspace/db run build

# --- 6. (ixtiyoriy) admin seed ----------------------------------------------
if [ "$DO_SEED" -eq 1 ]; then
  log "Admin seed ishga tushmoqda..."
  pnpm --filter @europrint/api run seed
fi

# --- 7. Backend + Frontend ni birga ishga tushirish -------------------------
PIDS=()
cleanup() {
  log "To'xtatilmoqda..."
  for pid in "${PIDS[@]:-}"; do kill "$pid" 2>/dev/null || true; done
  wait 2>/dev/null || true
}
trap cleanup INT TERM EXIT

if [ "$RUN_API" -eq 1 ]; then
  log "Backend ishga tushmoqda → http://localhost:$API_PORT (NestJS watch)"
  pnpm --filter @europrint/api run dev:unsafe &
  PIDS+=("$!")
fi

if [ "$RUN_WEB" -eq 1 ]; then
  log "Frontend ishga tushmoqda → http://localhost:$WEB_PORT/erp-dashboard/ (Vite)"
  pnpm --filter @workspace/erp-dashboard run dev &
  PIDS+=("$!")
fi

log "Tayyor. To'xtatish uchun Ctrl+C."
wait
