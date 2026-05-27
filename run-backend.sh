#!/usr/bin/env bash
# EuroPrint — faqat backend (NestJS :3030) ni ishga tushiradi.
# Ishlatish:  bash run-backend.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

# Backend @workspace/db ni dist/cjs dan require qiladi — yo'q bo'lsa build qilamiz.
if [ ! -f lib/db/dist/cjs/index.js ]; then
  echo "[run-backend] lib/db build qilinmoqda..."
  pnpm --filter @workspace/db run build
fi

echo "[run-backend] Backend ishga tushmoqda → http://localhost:3030 (Ctrl+C to'xtatadi)"
exec pnpm --filter @europrint/api run dev:unsafe
