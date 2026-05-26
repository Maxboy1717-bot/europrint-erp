#!/usr/bin/env bash
# Reviewer for Rule 15: no sensitive data in logs.
# Flags logger.* lines that interpolate variables matching password/token/secret/etc.
# PERFORMANCE: Single bulk grep instead of per-file loops over ~2557 API ts files on Windows.
set -uo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

RED='\033[0;31m'; GREEN='\033[0;32m'; NC='\033[0m'; BOLD='\033[1m'

echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  Rule 15: No Sensitive Data in Logs                  ${NC}"
echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"
echo ""

SENSITIVE='(password|passwd|pwd|token|secret|api[_-]?key|jwt|otp|pin|ssn|card[_-]?number|cvv|inn)'

# Single bulk grep (1 process instead of ~2557 per-file calls)
violations_raw=$(grep -rnEi "(logger|log|console)\.[a-z]+\(.*\$\{[^}]*${SENSITIVE}[^}]*\}" \
  "$ROOT_DIR/apps/api/src" \
  --include="*.ts" \
  2>/dev/null \
  | grep -vE '\.spec\.ts:' \
  | grep -vE ':[0-9]+:\s*//' \
  || true)

if [ -z "$violations_raw" ]; then
  echo -e "${GREEN}PASS${NC}: 0 sensitive-data log(s)"
  exit 0
fi

# Group by file and display
violations=0
mapfile -t VIOL_FILES < <(echo "$violations_raw" | awk -F: '{print $1}' | sort -u)
for fp in "${VIOL_FILES[@]}"; do
  rel="${fp#$ROOT_DIR/}"
  mapfile -t FILE_HITS < <(echo "$violations_raw" | grep -F "${fp}:")
  cnt=${#FILE_HITS[@]}
  violations=$((violations + cnt))
  echo -e "${RED}✗${NC} $rel — $cnt sensitive-data log(s)"
  for i in "${!FILE_HITS[@]}"; do
    [ "$i" -ge 3 ] && break
    echo "    ${FILE_HITS[$i]#*:}"
  done
done

echo ""
echo -e "${RED}FAIL${NC}: $violations sensitive-data log(s)"
exit 1
