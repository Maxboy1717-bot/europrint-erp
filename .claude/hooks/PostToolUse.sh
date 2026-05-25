#!/bin/bash
# EuroPrint ERP — Asbobdan keyingi nazorat (PostToolUse hook)
# Tool execute bo'lgandan keyin loglash va eslatma.

set -uo pipefail

PAYLOAD="$(cat)"
TOOL_NAME="$(echo "$PAYLOAD" | jq -r '.tool_name // ""' 2>/dev/null || echo "")"
EXIT_CODE="$(echo "$PAYLOAD" | jq -r '.tool_response.exit_code // 0' 2>/dev/null || echo 0)"
FILE_PATH="$(echo "$PAYLOAD" | jq -r '.tool_input.file_path // ""' 2>/dev/null || echo "")"

AUDIT_DIR="${HOME}/.claude"
mkdir -p "$AUDIT_DIR" 2>/dev/null

# ── 1. Audit log ─────────────────────────────────────────────────────────
{
  printf '%s | tool=%s | exit=%s' "$(date '+%Y-%m-%d %H:%M:%S')" "$TOOL_NAME" "$EXIT_CODE"
  [ -n "$FILE_PATH" ] && printf ' | file=%s' "$FILE_PATH"
  printf '\n'
} >> "$AUDIT_DIR/europrint-audit.log"

# ── 2. Schema o'zgarishi — migration eslatma ────────────────────────────
if [ "$TOOL_NAME" = "Edit" ] || [ "$TOOL_NAME" = "Write" ]; then
  if echo "$FILE_PATH" | grep -qE "lib/db/src/schema/|shared/schema\.ts"; then
    echo "📋 Schema o'zgardi: $FILE_PATH" >&2
    echo "   Kerakli harakatlar:" >&2
    echo "     1. pnpm --filter @workspace/db exec drizzle-kit generate" >&2
    echo "     2. pnpm --filter @workspace/db exec drizzle-kit push (yoki migrate)" >&2
    echo "     3. Zod sxemalarini yangilang (apps/api + frontend)" >&2
  fi
fi

# ── 3. Test fayli yozildi — uni run qilish eslatma ──────────────────────
if [ "$TOOL_NAME" = "Write" ] && echo "$FILE_PATH" | grep -qE "\.spec\.ts$|\.test\.ts$"; then
  REL_PATH="${FILE_PATH#*/Uzbek-Language-Module/}"
  echo "🧪 Yangi spec yozildi: $REL_PATH" >&2
  echo "   Run: npx jest --config apps/api/test/jest.config.js \"$REL_PATH\"" >&2
fi

# ── 4. Katta fayl ogohlantirish (Rule 16: 300 line limit) ──────────────
if [ -n "$FILE_PATH" ] && [ -f "$FILE_PATH" ]; then
  LINES=$(wc -l < "$FILE_PATH" 2>/dev/null || echo 0)
  if [ "$LINES" -gt 300 ]; then
    echo "⚠️  Rule 16: $FILE_PATH endi $LINES qatorga ega (chegara 300)" >&2
    echo "   Bo'laklash kerak (*Types.ts, *Helpers.tsx, *Sections.tsx)" >&2
  fi
fi

exit 0
