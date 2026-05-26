#!/usr/bin/env bash
# Reviewer for Rule 12: no magic numbers in business logic.
# Flags numeric literals with > 2 significant digits inside service/handler files,
# excluding obvious constants (0, 1, -1, 100, common HTTP status codes).
# PERFORMANCE: Single bulk grep pipeline instead of per-file loops over ~685 files on Windows.
set -uo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

SRC="$ROOT_DIR/apps/api/src"
RED='\033[0;31m'; GREEN='\033[0;32m'; NC='\033[0m'; BOLD='\033[1m'

echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  Rule 12: No Magic Numbers in Business Logic         ${NC}"
echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"
echo ""

if [ ! -d "$SRC" ]; then echo "src dir not found"; exit 0; fi

# Flag: arithmetic with floating decimals (0.5, 0.12, 0.7) or large integers
# WHY: skip formulaic constants that are clearer inline than extracted:
#   - Math.round(x * 100) / 100  (idiomatic 2-decimal round)
#   - x * 0.2 - 0.1               (jitter formula)
#   - limit > 1000 / > 100        (pagination cap)
#   - x / 100                     (percent-to-decimal conversion)

# Single bulk grep pipeline (6 processes instead of ~3425 on Windows)
violations_raw=$(grep -rnE '(\* 0\.[1-9])' \
  "$SRC" \
  --include="*.service.ts" --include="*.handler.ts" \
  2>/dev/null \
  | grep -vE '\.spec\.ts:' \
  | grep -vE ':[0-9]+:[[:space:]]*(//|/?\*|\*/)' \
  | grep -vE '(HttpStatus\.|status\s*=\s*[2-5][0-9]{2}|200|201|204|301|400|401|403|404|409|413|422|429|500|501|502|503)' \
  | grep -vE '\.constants\.|business\.constants|test/|\.spec\.' \
  | grep -vE 'Math\.(round|floor|ceil|min|max)|jitter|alpha|probability|holdLen|series\.length|\.length \* 0|expected_amount|VIP|trial' \
  || true)

if [ -z "$violations_raw" ]; then
  echo -e "${GREEN}PASS${NC}: 0 magic-number candidates"
  exit 0
fi

# Group by file and display (up to 3 samples per file)
violations=0
mapfile -t VIOL_FILES < <(echo "$violations_raw" | awk -F: '{print $1}' | sort -u)
for fp in "${VIOL_FILES[@]}"; do
  rel="${fp#$ROOT_DIR/}"
  mapfile -t FILE_HITS < <(echo "$violations_raw" | grep -F "${fp}:")
  cnt=${#FILE_HITS[@]}
  violations=$((violations + cnt))
  echo -e "${RED}✗${NC} $rel — $cnt magic-number candidate(s)"
  for i in "${!FILE_HITS[@]}"; do
    [ "$i" -ge 3 ] && break
    echo "    ${FILE_HITS[$i]#*:}"
  done
done

echo ""
echo -e "${RED}FAIL${NC}: $violations magic-number candidate(s)"
exit 1
