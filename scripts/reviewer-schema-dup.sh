#!/usr/bin/env bash
# Rule 23 — Schema Dup Ratchet. Thin wrapper around the node implementation so
# it plugs into run-all-reviewers.sh (emits a "PASS: .. | WARN: .. | FAIL: N"
# summary line and a 0/1 exit code). See scripts/reviewer-schema-dup.mjs.
exec node "$(dirname "$0")/reviewer-schema-dup.mjs" "$@"
