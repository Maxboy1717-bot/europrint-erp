#!/bin/bash
# EuroPrint ERP — CRUD Tahlil v2 (rg bilan tezlashtirilgan)
# Ishlatish: bash scripts/missing-crud-v2.sh
set -euo pipefail

PAGES="./artifacts/erp-dashboard/src/pages"
BACKEND="./apps/api/src"
CYAN='\033[0;36m'; BLUE='\033[0;34m'; NC='\033[0m'; BOLD='\033[1m'
hdr() { echo -e "\n${BOLD}${BLUE}== $* ==${NC}"; }
sub() { echo -e "${CYAN}$*${NC}"; }

# rg exit 1 (0 natija) bilan set -e ni himoya qilish
rg_count() { { rg -c "$@" 2>/dev/null || true; } | awk -F: '{s+=$2} END{print s+0}'; }
rg_list()  { { rg -l "$@" 2>/dev/null || true; } | sort; }
diff_files() {
  local a="$1" b="$2"
  [ -z "$a" ] && return
  [ -z "$b" ] && { echo "$a"; return; }
  comm -23 <(echo "$a") <(echo "$b")
}

echo "  CRUD TAHLIL v2 — ANIQ NATIJALAR"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "  ============================================================"

all_pages=$(rg --files -g "*.tsx" "$PAGES" 2>/dev/null | sort)
all_ctrl=$(rg --files -g "*.controller.ts" "$BACKEND" 2>/dev/null | sort)
total=$(echo "$all_pages" | wc -l)
be_total=$(echo "$all_ctrl" | wc -l)

# -- §1. Faqat READ sahifalari ------------------------------------
hdr "§1. FAQAT READ (hech qanday yozish yo'q)"
has_write=$(rg_list '"POST"|"PUT"|"PATCH"|"DELETE"|useMutation' -g "*.tsx" "$PAGES")
no_write=$(diff_files "$all_pages" "$has_write")
echo "$no_write" | while read -r f; do
  [ -z "$f" ] && continue
  n=$(wc -l < "$f" 2>/dev/null || echo 0)
  [ "${n:-0}" -gt 50 ] && echo "  READ-ONLY: $(basename "$f" .tsx) ($n qator)"
done

# -- §2. DELETE bor, CONFIRM yo'q ---------------------------------
hdr "§2. DELETE bor, CONFIRM yo'q (xavfli)"
has_del=$(rg_list '"DELETE"|handleDelete' -g "*.tsx" "$PAGES")
has_cnf=$(rg_list 'window\.confirm|AlertDialog|ConfirmDialog' -g "*.tsx" "$PAGES")
diff_files "$has_del" "$has_cnf" | while read -r f; do
  [ -n "$f" ] && echo "  ⚠ $(basename "$f" .tsx)"
done

# -- §3. FORMA bor, ERROR handling yo'q ---------------------------
hdr "§3. FORMA bor, xato ko'rsatish yo'q"
has_form=$(rg_list 'useForm|onSubmit|handleSubmit' -g "*.tsx" "$PAGES")
has_err=$(rg_list 'onError|setError|formState\.errors|toast\.error|isError' -g "*.tsx" "$PAGES")
diff_files "$has_form" "$has_err" | while read -r f; do
  [ -n "$f" ] && echo "  ⚠ $(basename "$f" .tsx)"
done

# -- §4. API bor, LOADING yo'q ------------------------------------
hdr "§4. API chaqiruv bor, loading yo'q"
has_qry=$(rg_list 'useQuery|useMutation' -g "*.tsx" "$PAGES")
has_lod=$(rg_list 'isLoading|isPending|Skeleton|Spinner' -g "*.tsx" "$PAGES")
diff_files "$has_qry" "$has_lod" | while read -r f; do
  [ -n "$f" ] && echo "  ⚠ $(basename "$f" .tsx)"
done

# -- §5. Backend: DELETE yo'q (POST bor) --------------------------
hdr "§5. Backend: DELETE endpoint yo'q (POST bor)"
ctrl_post=$(rg_list '@Post\(' -g "*.controller.ts" "$BACKEND")
ctrl_del=$(rg_list '@Delete\(' -g "*.controller.ts" "$BACKEND")
diff_files "$ctrl_post" "$ctrl_del" | while read -r f; do
  [ -z "$f" ] && continue
  mp=$(rg_count '@Post\(' "$f")
  echo "  ✗ $(basename "$f" .ts) — POST:$mp DELETE:0"
done

# -- §6. Backend: UPDATE yo'q (POST bor) --------------------------
hdr "§6. Backend: Update yo'q (POST bor)"
ctrl_upd=$(rg_list '@Put\(|@Patch\(' -g "*.controller.ts" "$BACKEND")
diff_files "$ctrl_post" "$ctrl_upd" | while read -r f; do
  [ -z "$f" ] && continue
  mp=$(rg_count '@Post\(' "$f")
  echo "  ✗ $(basename "$f" .ts) — POST:$mp UPDATE:0"
done

# -- §7. Modul solishtirish (FE vs BE) ---------------------------
hdr "§7. MODUL BO'YICHA FRONTEND vs BACKEND"
printf "  %-20s %-12s %-12s %s\n" "Modul" "FE sahifa" "BE ctrl" "Holat"
printf "  %-20s %-12s %-12s %s\n" "────────────────────" "──────────" "──────────" "────"

check_module() {
  local label=$1 fe_glob=$2 be_mod=$3
  local fe=0 be=0 status

  fe=$({ rg --files -g "*${fe_glob}*.tsx" "$PAGES" 2>/dev/null || true; } | wc -l)
  if [ -d "$BACKEND/modules/$be_mod" ]; then
    be=$({ rg --files -g "*.controller.ts" "$BACKEND/modules/$be_mod" 2>/dev/null || true; } | wc -l)
  fi

  if [ "$fe" -eq 0 ] && [ "$be" -gt 0 ]; then status="⚠ FE yo'q"
  elif [ "$fe" -gt 0 ] && [ "$be" -eq 0 ]; then status="⚠ BE yo'q"
  elif [ "$fe" -eq 0 ] && [ "$be" -eq 0 ]; then status="✗ Topilmadi"
  else status="✓ OK"; fi

  printf "  %-20s %-12s %-12s %s\n" "$label" "${fe} sahifa" "${be} ctrl" "$status"
}

check_module "HR"       "hr"          "hr"
check_module "Finance"  "accountant"  "finance"
check_module "CRM"      "crm"         "crm"
check_module "WMS"      "wms"         "wms"
check_module "MES"      "erp"         "mes"
check_module "QC"       "qc"          "qc"
check_module "SD"       "sd"          "sd"
check_module "LMS"      "lms"         "lms"
check_module "Kanban"   "kanban"      "kanban"
check_module "IoT"      "iot"         "iot"

# -- §8. Xulosa ---------------------------------------------------
hdr "§8. XULOSA"
no_write_count=$(echo "${no_write}" | grep -c '.' || true)
printf "  %-40s %s\n" "Frontend sahifalar jami:"    "$total ta"
printf "  %-40s %s\n" "Backend controllerlar jami:"  "$be_total ta"
printf "  %-40s %s\n" "Faqat READ sahifalar:"        "$no_write_count ta"
echo ""
echo "  Yakunlandi: $(date '+%Y-%m-%d %H:%M:%S')"
