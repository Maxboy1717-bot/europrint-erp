#!/usr/bin/env bash
# EuroPrint — STABIL backend launcher (watch'siz).
#
# Nima farqi bor (run-backend.sh dan)?
#   * run-backend.sh        — `nest start --watch` (kod o'zgargach avto-reload,
#                              lekin Windowsda tree-kill bug bilan 30-60 daq
#                              ichida o'lib qoladi).
#   * run-backend-stable.sh — `nest build && node dist/main.js` (watch yo'q,
#                              tree-kill bug yo'q, soatlab ishlaydi).
#
# Ishlatish:
#   bash run-backend-stable.sh
#
# Qachon ishlatish:
#   - Kunlik dev qilmayotgan vaqtda backend ko'p soat ko'tarilib turishi kerak
#     bo'lsa (login, demo, QA).
#   - Kod o'zgartirsangiz qayta yoqing (build kerak — Ctrl+C va yana bu skriptni).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

# 1. lib/db — @europrint/api dist/cjs orqali require qiladi
if [ ! -f lib/db/dist/cjs/index.js ]; then
  echo "[stable] lib/db build qilinmoqda..."
  pnpm --filter '@workspace/db' run build
fi

# 2. apps/api ni bir martalik build qilamiz (watch yo'q)
echo "[stable] apps/api build qilinmoqda (30-90 soniya)..."
pnpm --filter '@europrint/api' run build

# 3. Watch'siz ishga tushiramiz — tree-kill bug yo'q, barqaror
echo "[stable] Backend → http://localhost:3030 (Ctrl+C to'xtatadi)"
exec pnpm --filter '@europrint/api' run start
