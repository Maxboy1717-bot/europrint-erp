#!/bin/bash
# EuroPrint ERP — CRUD Tugmalar Auditi (rg bilan tezlashtirilgan)
# Ishlatish: bash scripts/missing-crud-audit.sh
set -euo pipefail

PAGES="./artifacts/erp-dashboard/src/pages"
BACKEND="./apps/api/src"
CYAN='\033[0;36m'; BLUE='\033[0;34m'; NC='\033[0m'; BOLD='\033[1m'
hdr() { echo -e "\n${BOLD}${BLUE}══ $* ${NC}"; }
sub() { echo -e "${CYAN}$*${NC}"; }

echo "============================================================"
echo "  CRUD TUGMALAR TAHLILI — FRONTEND vs BACKEND"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "============================================================"

# ── Barcha fayllar ro'yxatini bir marta olish (tez) ──────────
all_pages=$(rg --files -g "*.tsx" "$PAGES" 2>/dev/null | sort)
all_ctrl=$(rg --files -g "*.controller.ts" "$BACKEND" 2>/dev/null | sort)
total_pages=$(echo "$all_pages" | wc -l)
total_ctrl=$(echo "$all_ctrl" | wc -l)

# ── Set-difference: pattern topilmagan fayllar ───────────────
# $1 = pattern, $2 = glob, $3 = dir
pages_without() {
  local has
  has=$({ rg -l "$1" -g "$2" "$3" 2>/dev/null || true; } | sort)
  if [ -z "$has" ]; then
    echo "$all_pages"
  else
    comm -23 <(echo "$all_pages") <(echo "$has")
  fi
}

ctrl_without() {
  local has
  has=$({ rg -l "$1" -g "*.controller.ts" "$BACKEND" 2>/dev/null || true; } | sort)
  if [ -z "$has" ]; then
    echo "$all_ctrl"
  else
    comm -23 <(echo "$all_ctrl") <(echo "$has")
  fi
}

# ══ §1. FRONTEND CRUD ════════════════════════════════════════
hdr "§1 — FRONTEND: CRUD amal yo'q sahifalar"

sub "[1.1] QO'SHISH (Create/POST) yo'q:"
pages_without 'onClick|onSubmit|handleCreate|useMutation|"POST"|Qoshish|Yaratish' \
  "*.tsx" "$PAGES" \
  | while read -r f; do [ -n "$f" ] && echo "  ✗ $(basename "$f")"; done

sub "[1.2] TAHRIRLASH (Edit/PUT/PATCH) yo'q:"
pages_without 'handleEdit|handleUpdate|"PUT"|"PATCH"|Tahrir' \
  "*.tsx" "$PAGES" \
  | while read -r f; do [ -n "$f" ] && echo "  ✗ $(basename "$f")"; done

sub "[1.3] O'CHIRISH (Delete) yo'q:"
pages_without 'handleDelete|"DELETE"|window\.confirm|AlertDialog' \
  "*.tsx" "$PAGES" \
  | while read -r f; do [ -n "$f" ] && echo "  ✗ $(basename "$f")"; done

sub "[1.4] JO'NATISH (Submit) yo'q:"
pages_without 'onSubmit|handleSubmit|type.*submit' \
  "*.tsx" "$PAGES" \
  | while read -r f; do [ -n "$f" ] && echo "  ✗ $(basename "$f")"; done

# ══ §2. BACKEND CRUD ═════════════════════════════════════════
hdr "§2 — BACKEND: To'liq CRUD yo'q controllerlar"

sub "[2.1] POST endpoint yo'q:"
ctrl_without '@Post\(' | while read -r f; do
  [ -n "$f" ] && echo "  ✗ $(basename "$f")"
done

sub "[2.2] PUT/PATCH yo'q:"
ctrl_without '@Put\(|@Patch\(' | while read -r f; do
  [ -n "$f" ] && echo "  ✗ $(basename "$f")"
done

sub "[2.3] DELETE yo'q:"
ctrl_without '@Delete\(' | while read -r f; do
  [ -n "$f" ] && echo "  ✗ $(basename "$f")"
done

# ══ §3. MODAL / FORMA SIFATI ══════════════════════════════════
hdr "§3 — MODAL / FORMA SIFATI"

sub "[3.1] Delete bor, confirm yo'q:"
has_delete=$({ rg -l '"DELETE"|handleDelete' -g "*.tsx" "$PAGES" 2>/dev/null || true; } | sort)
has_confirm=$({ rg -l 'window\.confirm|AlertDialog|ConfirmDialog' -g "*.tsx" "$PAGES" 2>/dev/null || true; } | sort)
comm -23 <(echo "$has_delete") <(echo "$has_confirm") \
  | while read -r f; do [ -n "$f" ] && echo "  ✗ $(basename "$f")"; done

sub "[3.2] Forma bor, validation yo'q:"
has_form=$({ rg -l 'useForm|onSubmit' -g "*.tsx" "$PAGES" 2>/dev/null || true; } | sort)
has_val=$({ rg -l 'zodResolver|yup|zod\.object|formState\.errors' -g "*.tsx" "$PAGES" 2>/dev/null || true; } | sort)
comm -23 <(echo "$has_form") <(echo "$has_val") \
  | while read -r f; do [ -n "$f" ] && echo "  ✗ $(basename "$f")"; done

# ══ §4. XULOSA ═══════════════════════════════════════════════
hdr "§4 — XULOSA JADVALI"

no_post=$(pages_without 'onClick|onSubmit|"POST"|useMutation' "*.tsx" "$PAGES" \
  | grep -c '.' || true)
no_put=$(pages_without '"PUT"|"PATCH"|handleEdit|handleUpdate' "*.tsx" "$PAGES" \
  | grep -c '.' || true)
no_del=$(pages_without '"DELETE"|handleDelete' "*.tsx" "$PAGES" \
  | grep -c '.' || true)

printf "  %-45s %s\n" "Jami frontend sahifalar:"     "$total_pages ta"
printf "  %-45s %s\n" "Jami backend controllerlar:"   "$total_ctrl ta"
echo ""
printf "  %-45s %s\n" "POST (Create) yo'q sahifalar:"  "$no_post ta"
printf "  %-45s %s\n" "PUT/PATCH (Edit) yo'q:"         "$no_put ta"
printf "  %-45s %s\n" "DELETE yo'q sahifalar:"         "$no_del ta"

echo ""
echo "  Yakunlandi: $(date '+%Y-%m-%d %H:%M:%S')"
