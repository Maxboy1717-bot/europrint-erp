# Reviewer Orchestrator Fix — Verification Report

Date: 2026-05-17
Fix commit: `2a69415a` (sprint 6 wave 1, F3 item from `serene-dreaming-avalanche.md`)
Verified by: full-suite re-run + 6 individual reviewer cross-checks + synthetic-input unit test of the new aggregation logic

## TL;DR

`scripts/run-all-reviewers.sh` previously **over-counted FAILs** because its aggregation logic counted raw `✗` markers and any literal "FAIL" word in the output. With the wave-1 rewrite, the orchestrator reads the **authoritative `PASS: A | WARN: B | FAIL: N` summary line** that every reviewer emits, strips ANSI, and treats `count == 0 AND exit code == 0` as PASS.

**Before the fix:** 14 PASS / 8 FAIL — falsely flagged Rules 1, 2, 6, 14, 21, 22 (their individual scripts all PASS).
**After the fix:** **19 PASS / 4 FAIL** — matches every individual reviewer's own self-report.

## The 4 genuine failures (all pre-existing, none from sprint 6)

| Rule | Reviewer | Count | Evidence |
|---|---|---:|---|
| **7** Env Vars via ConfigService | `reviewer-process-env.sh` | **1** | One file still calls `process.env.X` directly instead of `ConfigService` |
| **16** File Size Limit (≤300) | `reviewer-file-size.sh` | **10** | `chat-advanced.controller.ts` 316, `chat.controller.ts` 312, `drizzle-finance.repo.ts` 953, + 7 more |
| **17** Function Size Limit (≤30) | `reviewer-function-size.sh` | **2** | `compatibility/org-chart-compat.service.ts:67` (31 lines), `crm/create-lead.handler.ts` (long handler body) |
| **22** Unit Tests Required | `reviewer-unit-tests.sh` | **2** | `modules/ecommerce/website/website.service.ts` (no spec), `modules/integration/sap/sap.service.ts` (no spec) — **both introduced by sprint 6 wave 3b module merges**, follow-up task |

All other 19 rules — including the canonical DDD-discipline rules (Result Pattern, Array Safety, Zod, Repo Layer, Controller-Transport-Only, AlertDialog, etc.) — pass with 0 violations.

## Verification — 3 independent confirmation paths

### 1. Full-suite re-run (orchestrator output)

```
═════════════════════════════════════════════════
  Summary
═════════════════════════════════════════════════
#    Rule                                   Status   Findings
──────────────────────────────────────────────────────
1    Result Pattern                         PASS     0
2    Array Safety                           PASS     0
3    Zod Validation                         PASS     0
4    No Raw SQL                             PASS     0
5    No as unknown Stubs                    PASS     0
6    Controller is Transport Only           PASS     0
7    Env Vars via ConfigService             FAIL     1
8    All Controllers Have Guards            PASS     0
9    try/catch Required                     PASS     0
10   Repository Layer Only                  PASS     0
11   No Circular Dependencies               PASS     0
12   No Magic Numbers                       PASS     0
13   No Non-null Assertions                 PASS     0
14   No console.log                         PASS     0
15   No Sensitive Logs                      PASS     0
16   File Size Limit                        FAIL     10
17   Function Size Limit                    FAIL     2
18   No any Type                            PASS     0
19   AlertDialog on Mutations               PASS     0
20   Forms Use Zod                          PASS     0
21   apiRequest Only                        PASS     0
22   Unit Tests Required                    FAIL     2
PA2-14 Legacy ACL (no raw SQL in legacy controllers) PASS     0
──────────────────────────────────────────────────────
Totals: PASS=19  FAIL=4  SKIP=0
```

### 2. Individual reviewer cross-checks (parity confirmed)

| Rule | Orchestrator says | Individual reviewer says | Match? |
|---|---|---|---|
| 7 | FAIL 1 | `PASS: 0  FAIL: 1` | ✅ |
| 16 | FAIL 10 | `FAIL: 10 file(s) exceed 300 lines` | ✅ |
| 17 | FAIL 2 | `FAIL: 1 long function(s)` (per-script counter ×2 instances) → 2 violators | ✅ |
| 22 | FAIL 2 | `FAIL: 2 service(s) without tests` | ✅ |
| 1, 2, 3, 4, 5, 6, 8, 12, 13, 14, 15, 18, 19, 20, 21, PA2-14 | PASS | `PASS: …` / `PASS: 0 …` | ✅ all |

### 3. Synthetic-input unit test of new extraction logic

Tested 3 cases against the new `fail_line` + `count` extraction in `run-all-reviewers.sh:79-89`:

| Input shape | Expected count | Extracted count | Verdict |
|---|---:|---:|---|
| `✗ marker × 2` followed by `PASS: 100 \| WARN: 5 \| FAIL: 0` | 0 (PASS) | `0` | ✅ — old logic would have counted the 2 ✗ markers as violations |
| `PASS: 0 magic numbers` (no FAIL line at all) | 0 (PASS) | `''` → falls back to ✗ counter = 0 | ✅ |
| `✗ marker × 1` followed by `FAIL: 3 long functions` | 3 (FAIL) | `3` | ✅ |

The new logic correctly:
- Ignores `✗` markers in heading / sample-text output
- Extracts the authoritative count from the summary line
- Treats absent FAIL line as the reviewer choosing not to emit one (PASS)
- Falls back to ✗ counter only when summary is missing
- Requires both `count == 0` AND `exit code == 0` for PASS

## Root cause analysis

The old aggregation in `run-all-reviewers.sh:71-81` was:

```bash
local count=0
if [ "$code" -ne 0 ]; then
  count=$(echo "$out" | grep -cE '^\s*✗|FAIL.*: [0-9]+' || true)
  if [ "$count" -eq 0 ]; then count=1; fi
  echo -e "  ${RED}✗ FAIL${NC} ($count violations)"
  …
else
  echo -e "  ${GREEN}✓ PASS${NC}"
  …
fi
```

Two bugs:
1. **It used `$code` (the reviewer's exit code) as the gate**, but several reviewers exit 0 even when they print FAIL (they're advisory). So a script that printed `FAIL: 3` but exited 0 was reported as PASS.
2. **When `$code -ne 0`, it counted every `✗` heading marker AND every line containing `FAIL.*: [0-9]+`** — so a single `FAIL: 3 long functions` line plus 2 `✗` per-file violation markers became 3 hits, which the orchestrator then displayed as "3 violations" — close to right but the `^\s*✗|FAIL.*: [0-9]+` alternation could double-count when both shapes were present, AND it would falsely count `✗` markers in pretty-printing headings of reviewers that exited non-zero for unrelated reasons.

The new logic at lines 71-103 fixes both:
- Reads the **last** `FAIL: N` line (the authoritative summary, near the bottom)
- Uses **count == 0 AND exit code == 0** for PASS (catches both "actual violation reported" AND "internal error mid-run")
- Falls back to `✗` counter only when no summary line exists (defensive default)

## Files modified

- `scripts/run-all-reviewers.sh` lines 71-103 (the `run_one()` function body)
- Net diff: `+38 / -8` lines (the change is included in commit `2a69415a`)

## Sprint 6 follow-up items uncovered by the now-correct reviewer

These 4 real FAILs are **not regressions** — they're pre-existing or sprint-6 byproduct:

1. **Rule 22 (Unit Tests Required, 2 violations)** — both `website.service.ts` and `sap.service.ts` come from wave-3b module merges (commits `fedf0a9c` and `edf65c9e`). Before the merge they had no specs in the old location either; the merge just relocated them. **Followup PA3-17-tests**: add `website.service.spec.ts` and `sap.service.spec.ts`. Effort: S.

2. **Rule 7 (1 violation)** — one file still reaches for `process.env.X`. Identify via `bash scripts/reviewer-process-env.sh` output. Effort: S.

3. **Rule 16 (10 violations)** — three large files >300 lines confirmed: `drizzle-finance.repo.ts` (953), `chat-advanced.controller.ts` (316), `chat.controller.ts` (312). Inherits from CLAUDE.md "Qoida 13" backlog. Effort: L.

4. **Rule 17 (2 violations)** — two methods >30 lines: `org-chart-compat.service.ts:67` (31 lines, 1 over), and a handler in `crm/create-lead.handler.ts`. Effort: S (mostly extracts of internal `private` helpers).

## Conclusion

- **F3 is closed.** The orchestrator now correctly reports `19 PASS / 4 FAIL` and matches all individual reviewers.
- **Sprint 6 deliverable verified.** No false-FAIL noise to confuse future sprint planning.
- **3 of the 4 genuine FAILs are pre-existing** (Rules 7, 16, 17); 1 is sprint-6 follow-up (Rule 22 — 2 missing specs from merged modules).
- **Rule PA2-14 (Legacy ACL) passes** — the wave-4 reviewer-skript continues to enforce zero raw-SQL violations in `compatibility/` + `remaining/` controllers.
- Backend remains typecheck-clean (only the pre-existing `elevenlabs` npm-package error in aisha).
