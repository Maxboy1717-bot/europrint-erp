#!/usr/bin/env bash
# Reviewer for Rule 21: all frontend API calls go through apiRequest helper.
set -uo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

FE="$ROOT_DIR/artifacts/erp-dashboard/src"
RED='\033[0;31m'; GREEN='\033[0;32m'; NC='\033[0m'; BOLD='\033[1m'

echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  Rule 21: API Calls via apiRequest Only              ${NC}"
echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"

if [ ! -d "$FE" ]; then echo "frontend dir not found"; exit 0; fi

violations=0
while IFS= read -r file; do
  # Skip files that ARE the apiRequest plumbing (would be circular):
  #   queryClient.ts, api-request.ts, auth-refresh.ts, useAuth.tsx,
  #   errorLogger.ts (log endpoint must not retry through itself),
  #   upload.ts (multipart upload needs raw fetch),
  #   webPush.ts (service-worker registration uses fetch directly).
  case "$file" in
    */queryClient.ts|*/api-request.ts|*/auth-refresh.ts|*/useAuth.tsx|*/errorLogger.ts|*/upload.ts|*/webPush.ts) continue ;;
    # Bootstrap auth pages: pre-token, so apiRequest (which expects token) doesn't apply
    */Login.tsx|*/useIoTTabletAuth.ts) continue ;;
    # IoT tablet pages use custom `x-tablet-token` header, not Bearer JWT —
    # apiRequest helper assumes Bearer; raw fetch is the correct path here.
    */useIoTTablet.ts|*/useIoTTabletAlerts.ts|*/useIoTTabletData.ts) continue ;;
    # OrgChartPage downloads binary blobs (xlsx/pdf/png) — apiRequest is
    # JSON-only and would rebind the response; raw fetch is correct for blobs.
    */OrgChartPage.tsx) continue ;;
    # ManualInspectionForm sets Authorization header inline (impersonation flow)
    */ManualInspectionForm.tsx) continue ;;
    # POS pages use pos_session token (not main JWT) — apiRequest helper uses Bearer JWT
    */PosLotTraceability.tsx|*/PosReservations.tsx) continue ;;
    # HRSafety exports a binary PDF blob — apiRequest is JSON-only
    */HRSafety.tsx) continue ;;
  esac
  # Match bare fetch('/api or axios(  or new XMLHttpRequest()
  hits=$(grep -nE "\bfetch\(['\"]?/api|\baxios\.[a-z]+\(|new XMLHttpRequest" "$file" 2>/dev/null \
    | grep -vE 'queryClient\.ts|api-request\.ts|fetchWithAuth|api-client' \
    | head -3)
  if [ -n "$hits" ]; then
    rel="${file#$ROOT_DIR/}"
    count=$(echo "$hits" | wc -l | tr -d ' ')
    echo -e "${RED}✗${NC} $rel — $count direct HTTP call(s)"
    violations=$((violations+count))
  fi
done < <(find "$FE" \( -name "*.tsx" -o -name "*.ts" \) -not -path "*/node_modules/*" -not -path "*/dist/*" 2>/dev/null)

echo ""
if [ "$violations" -eq 0 ]; then
  echo -e "${GREEN}PASS${NC}: 0 direct HTTP calls"
  exit 0
else
  echo -e "${RED}FAIL${NC}: $violations direct HTTP call(s)"
  exit 1
fi
