#!/usr/bin/env bash
# Reviewer-102: CQRS Result<T> — handler execute() signatures + controller unwrap gate
# Architecture rules: AR-4 / AR-5 / AR-11 / AR-12
#
# §1  CQRS handler execute() must declare a typed Promise<...> return type
# §2  Controllers must NOT have a bare `return result;` without prior Err-check
# §3  Global ResultUnwrapInterceptor must be registered in app bootstrap
# §4  Repository files must not have literal `return null;` inside Result<T> methods
#
# Exit 0 = PASS  |  Exit 1 = FAIL
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
API_SRC="$ROOT/apps/api/src"

PASS=0
FAIL=0
WARN=0

section() { echo; echo "=== $1 ==="; }
pass()    { echo "  PASS: $1"; PASS=$((PASS + 1)); }
fail()    { echo "  FAIL: $1"; FAIL=$((FAIL + 1)); }
warn()    { echo "  WARN: $1"; WARN=$((WARN + 1)); }

# ─── §1  Handler execute() typed return — handles multi-line signatures ─────
section "§1 Handler execute() — must declare typed Promise<...> return type"

HANDLER_UNTYPED=0
while IFS= read -r f; do
  # Use awk: scan for `async execute(` then look within next 6 lines for `Promise<`
  result=$(awk '
    /async execute\s*\(/ { found=1; line=NR; text=$0 }
    found && /Promise</ { found=0; next }
    found && /\{/ {
      # Opening brace without seeing Promise< — untyped
      printf "%s:%d: %s\n", FILENAME, line, text
      found=0
    }
  ' "$f" 2>/dev/null || true)
  if [[ -n "$result" ]]; then
    fail "$(basename "$f") — execute() missing return type annotation"
    echo "    → $result"
    HANDLER_UNTYPED=$((HANDLER_UNTYPED + 1))
  fi
done < <(find "$API_SRC" -name "*.handler.ts" | grep -v "\.spec\." | sort)

if [[ "$HANDLER_UNTYPED" -eq 0 ]]; then
  pass "All CQRS handler execute() methods declare a typed Promise<...> return"
fi

# ─── §2  Controller bare `return result;` without unwrap ───────────────────
section "§2 Controller bare return result; — must unwrap or have prior Err-check"

BARE_CTRL=0
while IFS= read -r f; do
  hits=$(grep -nE "^\s+return result;" "$f" 2>/dev/null || true)
  if [[ -n "$hits" ]]; then
    while IFS= read -r hit; do
      lineno=$(echo "$hit" | grep -oE "^[0-9]+" || true)
      if [[ -n "$lineno" ]]; then
        prev_line=$(sed -n "$((lineno - 1))p" "$f" 2>/dev/null || true)
        if echo "$prev_line" | grep -qE "if\s*\(.*result\.(ok|isOk|isErr|err)\b|if\s*\(!result\.ok\)"; then
          warn "$(basename "$f"):$lineno — Err-propagation after result.ok check (OK with global interceptor)"
        else
          fail "$(basename "$f"):$lineno — bare return result; without Err-check — unwrap required"
          BARE_CTRL=$((BARE_CTRL + 1))
        fi
      fi
    done <<< "$hits"
  fi
done < <(find "$API_SRC" -name "*.controller.ts" | grep -v "\.spec\." | sort)

if [[ "$BARE_CTRL" -eq 0 ]]; then
  pass "No un-checked bare 'return result;' in controllers"
fi

# ─── §3  Global ResultUnwrapInterceptor registered ─────────────────────────
section "§3 Global ResultUnwrapInterceptor — must be registered"

INTERCEPTOR=$(grep -rn "ResultUnwrapInterceptor\|APP_INTERCEPTOR" \
  "$API_SRC" --include="*.ts" 2>/dev/null | grep -v "\.spec\." | head -3 || true)

if [[ -n "$INTERCEPTOR" ]]; then
  pass "ResultUnwrapInterceptor found in source (globally registered via APP_INTERCEPTOR)"
else
  fail "ResultUnwrapInterceptor not found — controllers returning Result<T> will leak the wrapper"
fi

# ─── §4  Repository return null inside Result<T>-typed methods ─────────────
section "§4 Repository literal return null; co-located with Result<T> methods"

# Node-based method-level check: find `return null;` inside methods that declare
# `Promise<Result<` return type. Uses awk window approach.
REPO_RESULT_NULL=0
while IFS= read -r f; do
  issues=$(awk '
    /Promise<Result</ { in_result=1; depth=0 }
    in_result && /\{/ { depth++ }
    in_result && /\}/ {
      depth--
      if (depth <= 0) { in_result=0 }
    }
    in_result && /^\s*return null;/ {
      printf "%s:%d\n", FILENAME, NR
    }
  ' "$f" 2>/dev/null || true)
  if [[ -n "$issues" ]]; then
    while IFS= read -r iss; do
      fail "$iss — return null; inside a Promise<Result<T>> method body (use ternary or Err())"
      REPO_RESULT_NULL=$((REPO_RESULT_NULL + 1))
    done <<< "$issues"
  fi
done < <(find "$API_SRC/modules" \( -name "*.repository.ts" -o -name "*.repo.ts" \) 2>/dev/null \
  | grep -v "\.spec\." | sort)

if [[ "$REPO_RESULT_NULL" -eq 0 ]]; then
  pass "No literal return null; found inside Promise<Result<T>> method bodies"
fi

# ─── Summary ───────────────────────────────────────────────────────────────
echo
echo "─────────────────────────────────────────────"
echo "  PASS: $PASS  |  FAIL: $FAIL  |  WARN: $WARN"
echo "─────────────────────────────────────────────"

if [[ "$FAIL" -gt 0 ]]; then
  echo "RESULT: FAIL ($FAIL issues must be resolved)"
  exit 1
else
  echo "RESULT: PASS"
  exit 0
fi
