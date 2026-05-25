#!/bin/bash
# EuroPrint ERP — Asbobdan oldingi tekshiruv (PreToolUse hook)
# Har qanday tool ishlamasdan oldin bu skript ishlaydi.
#
# Hook input: JSON via stdin (see Claude Code hook docs):
#   {"tool_name":"Bash","tool_input":{"command":"..."}, ...}
# Exit code 0 = allow, 2 = block, others = warn.

set -uo pipefail

# Read hook payload from stdin
PAYLOAD="$(cat)"
TOOL_NAME="$(echo "$PAYLOAD" | jq -r '.tool_name // ""' 2>/dev/null || echo "")"
COMMAND="$(echo "$PAYLOAD" | jq -r '.tool_input.command // ""' 2>/dev/null || echo "")"

# ── 1. KRITIK: massiv DB o'chirish operatsiyalarini bloklash ───────────────
if echo "$COMMAND" | grep -qiE "DROP TABLE|DELETE FROM [a-z_]+ WHERE 1|TRUNCATE TABLE"; then
  echo "❌ BLOKLANDI: Massiv DB o'chirish operatsiyasi aniqlandi" >&2
  echo "   Buyruq: $COMMAND" >&2
  echo "   Zarurat bo'lsa DBA ga murojaat qiling yoki migration orqali bajaring." >&2
  exit 2
fi

# ── 2. Production DB ga to'g'ridan yozishni bloklash ─────────────────────
if echo "$COMMAND" | grep -qiE "DATABASE_URL.*prod(uction)?\b"; then
  echo "❌ BLOKLANDI: Production bazasiga to'g'ridan yozish" >&2
  echo "   Migration orqali o'zgartirish kiriting." >&2
  exit 2
fi

# ── 3. force-push to main/master ─────────────────────────────────────────
if echo "$COMMAND" | grep -qiE "git push.*--force.*(main|master)|git push.*-f.*(main|master)"; then
  echo "❌ BLOKLANDI: main/master ga force-push" >&2
  echo "   Avval to'g'ri branch'ga push qiling va PR oching." >&2
  exit 2
fi

# ── 4. rm -rf xavfli yo'llar ─────────────────────────────────────────────
if echo "$COMMAND" | grep -qE "rm -rf (/|~|\\$HOME)"; then
  echo "❌ BLOKLANDI: rm -rf xavfli yo'l ustida" >&2
  exit 2
fi

# ── 5. .env fayl o'qishni audit log'ga yozish (ogohlantirish, blok emas) ─
if echo "$COMMAND" | grep -qE "cat .*\.env|head .*\.env|print.*\.env"; then
  AUDIT_DIR="${HOME}/.claude"
  mkdir -p "$AUDIT_DIR" 2>/dev/null
  echo "$(date '+%Y-%m-%d %H:%M:%S') | .env read | $COMMAND" >> "$AUDIT_DIR/europrint-audit.log"
fi

# ── 6. node_modules yo'qligini tekshirish ────────────────────────────────
if [ "$TOOL_NAME" = "Bash" ] && echo "$COMMAND" | grep -qE "^(npm|pnpm|yarn|npx) (run|test|start|exec)"; then
  if [ ! -d "node_modules" ] && [ ! -d "apps/api/node_modules" ]; then
    echo "⚠️  ESLATMA: node_modules topilmadi. Avval: pnpm install" >&2
    # warn only — don't block; the script may handle its own install
  fi
fi

# ── 7. Schema o'zgarishi — eslatma ──────────────────────────────────────
if [ "$TOOL_NAME" = "Edit" ] || [ "$TOOL_NAME" = "Write" ]; then
  FILE_PATH="$(echo "$PAYLOAD" | jq -r '.tool_input.file_path // ""' 2>/dev/null || echo "")"
  if echo "$FILE_PATH" | grep -qE "lib/db/src/schema/|shared/schema\.ts"; then
    echo "📋 ESLATMA: Schema fayl tahrirlanmoqda — $FILE_PATH" >&2
    echo "   Migration kerak bo'ladi: pnpm --filter @workspace/db drizzle-kit generate" >&2
  fi
fi

exit 0
