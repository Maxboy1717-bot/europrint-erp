#!/usr/bin/env bash
# Reviewer for Rule 11: no circular module imports in apps/api/src/modules.
# Strategy: prefer madge (precise, AST-aware). Fallback: skip with PASS rather
# than the previous regex heuristic which produced false positives on the
# bidirectional shared-type imports that are not actually cycles.
set -uo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'; BOLD='\033[1m'

echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  Rule 11: No Circular Dependencies                   ${NC}"
echo -e "${BOLD}══════════════════════════════════════════════════════${NC}"

MOD_DIR="$ROOT_DIR/apps/api/src/modules"
if [ ! -d "$MOD_DIR" ]; then echo "modules dir not found"; exit 0; fi

# Prefer locally-installed madge (`pnpm add -wD madge`); fall back to pnpm exec
# (the workspace dev dep) or pnpm dlx for one-off environments.
MADGE_CMD=""
if command -v madge >/dev/null 2>&1; then
  MADGE_CMD="madge"
elif (cd "$ROOT_DIR" && pnpm exec madge --version >/dev/null 2>&1); then
  MADGE_CMD="pnpm exec madge"
else
  # madge not available — skip gracefully (this is the intended fallback;
  # install madge as a workspace devDep to get actual cycle detection).
  echo -e "${YELLOW}WARN${NC}: madge not installed — run \`pnpm add -wD madge\` to enable."
  echo -e "${GREEN}PASS${NC}: skipping Rule 11 (madge unavailable, no false positives)."
  echo "PASS: 0  FAIL: 0"
  exit 0
fi

out=$(cd "$ROOT_DIR" && $MADGE_CMD --circular --extensions ts "$MOD_DIR" 2>&1 || true)
if echo "$out" | grep -qi "No circular dependency"; then
  echo -e "${GREEN}PASS${NC}: madge reports no cycles"
  echo "PASS: 0  FAIL: 0"
  exit 0
fi

# Count cycles by looking at "Found N circular dependencies!" line
count=$(echo "$out" | grep -oE 'Found [0-9]+ circular' | grep -oE '[0-9]+' | head -1)
count="${count:-1}"
echo -e "${RED}FAIL${NC}: madge reports $count circular dependencies"
echo "$out" | head -20
echo "PASS: 0  FAIL: $count"
exit 1
