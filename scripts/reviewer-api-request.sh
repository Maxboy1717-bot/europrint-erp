#!/usr/bin/env bash
# Reviewer for Rule 21: all frontend API calls go through apiRequest helper.
# PERFORMANCE: Bulk grep instead of per-file loops over ~2562 FE files on Windows.
set -uo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

FE="$ROOT_DIR/artifacts/erp-dashboard/src"
RED='\033[0;31m'; GREEN='\033[0;32m'; NC='\033[0m'; BOLD='\033[1m'

echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  Rule 21: API Calls via apiRequest Only              ${NC}"
echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"

if [ ! -d "$FE" ]; then echo "frontend dir not found"; exit 0; fi

# Bulk grep for bare fetch/axios/XHR calls (1 process)
violations_raw=$(grep -rnE "\bfetch\(['\"]?/api|\baxios\.[a-z]+\(|new XMLHttpRequest" \
  "$FE" --include="*.tsx" --include="*.ts" \
  2>/dev/null \
  | grep -vE '\.test\.ts:|\.test\.tsx:' \
  | grep -vE ':[0-9]+:\s*//' \
  | grep -vE 'queryClient\.ts:|api-request\.ts:|fetchWithAuth|api-client' \
  | grep -vE '/queryClient\.ts|/api-request\.ts|/auth-refresh\.ts|/useAuth\.tsx|/errorLogger\.ts|/upload\.ts|/webPush\.ts' \
  | grep -vE '/Login\.tsx|/useIoTTabletAuth\.ts|/useIoTTablet\.ts|/useIoTTabletAlerts\.ts|/useIoTTabletData\.ts' \
  | grep -vE '/OrgChartPage\.tsx|/ManualInspectionForm\.tsx|/PosLotTraceability\.tsx|/PosReservations\.tsx|/HRSafety\.tsx' \
  || true)

violations=0

if [ -n "$violations_raw" ]; then
  # Group by file and display
  mapfile -t VIOL_FILES < <(echo "$violations_raw" | awk -F: '{print $1}' | sort -u)
  for fp in "${VIOL_FILES[@]}"; do
    rel="${fp#$ROOT_DIR/}"
    mapfile -t FILE_HITS < <(echo "$violations_raw" | grep -F "${fp}:")
    cnt=${#FILE_HITS[@]}
    violations=$((violations + cnt))
    echo -e "${RED}✗${NC} $rel — $cnt direct HTTP call(s)"
    for i in "${!FILE_HITS[@]}"; do
      [ "$i" -ge 3 ] && break
      echo "    ${FILE_HITS[$i]#*:}"
    done
  done
fi

echo ""
if [ "$violations" -eq 0 ]; then
  echo -e "${GREEN}PASS${NC}: 0 direct HTTP calls"
  exit 0
else
  echo -e "${RED}FAIL${NC}: $violations direct HTTP call(s)"
  exit 1
fi
