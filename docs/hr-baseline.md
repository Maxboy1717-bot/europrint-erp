# HR Module — Pre-Remediation Baseline

Captured: 2026-05-17
Branch: `chore/clean-faza-3`
Reference audit: V6 (`docs/HR_PRODUCTION_AGENT_PROMPT.md`)

Re-run with `node scripts/hr-audit.mjs --summary` to compare against this snapshot.
Raw JSON: `docs/hr-baseline.json`.

## `hr-audit.mjs --summary` (2026-05-17)

```
HR audit — 3/10 passed
  [FAIL] unprotected-hr-controllers — Unprotected: apps/api/src/modules/hr/ai-interview-v2/ai-interview-v2.controller.ts
  [PASS] guarded-controllers-without-roles — Every guarded HR controller has @Roles or @Public.
  [FAIL] addemployee-data-loss — Missing in adapter: shift, salaryType, workshopZone, age, childrenCount, maritalStatus, housingType, householdMembers, attestationDate, latitude, longitude
  [FAIL] salary-masking — EmployeeProfile.tsx mentions salary but no RoleGate component is used.
  [FAIL] pii-encryption — Missing: encryption.service.ts, repo encrypt usage
  [FAIL] tenant-id-coverage — 0/10 HR schemas declare tenant_id
  [FAIL] recruiter-kanban-dnd — artifacts/erp-dashboard/src/pages/RecruitingKanban.tsx does not use @dnd-kit (no real drag-drop).
  [FAIL] orgchart-cycle-detection — No cycle detection logic found in org-structure.
  [PASS] sidebar-duplicates — No known HR sidebar duplicate pairs detected.
  [PASS] frontend-test-coverage — 56 HR-related frontend test files (target ≥ 20)
```

## Interpretation

| Check | Maps to | Status |
|-------|---------|:------:|
| unprotected-hr-controllers | Task 1.1 | 1 controller (`ai-interview-v2`) |
| guarded-controllers-without-roles | Task 1.1 (coverage) | already clean |
| addemployee-data-loss | Task 1.4 | all 11 fields missing |
| salary-masking | Task 1.2 | `RoleGate` not yet introduced |
| pii-encryption | Task 1.5 | encryption layer absent |
| tenant-id-coverage | Task 2.1 | 0/10 HR schemas (multi-tenancy = 0%) |
| recruiter-kanban-dnd | Task 5.1 | no `@dnd-kit` |
| orgchart-cycle-detection | Task 1.3 | no detector |
| sidebar-duplicates | Phase 3 | check is conservative; v6 audit lists 2 duplicates, but neither pair has both routes present in the scanned sidebar files (may be a stale audit finding) |
| frontend-test-coverage | Phase 8 | 56 HR-related test files — exceeds the 20-floor; v6 claim of "0 frontend E2E tests" applies only to `e2e/` (Playwright), not `__tests__/` (Vitest). Refine the check later. |

## Sidebar duplicate caveat

The audit script's `sidebar-duplicates` check only flags duplicates if **both**
route paths from a known-bad pair appear in the scanned sidebar config files.
The V6 audit claims 2 duplicates exist; the check disagrees. Two possibilities:

1. The duplicates were already removed between V6 and now.
2. The sidebar config is split across more files than the check scans.

Phase 3 should manually verify before declaring the duplicate count.

## Frontend test caveat

56 test files match the broad pattern (`hr|employee|recruit|payroll|leave|attendance`
in the filename, anywhere under `artifacts/erp-dashboard/src`). The V6 audit's
"0 frontend E2E tests for HR pages" refers specifically to Playwright specs in
`artifacts/erp-dashboard/e2e/`. The current check does not enforce that
distinction. Phase 8 will split the count into Vitest vs Playwright.

## Score baseline (from V6 audit, not measured here)

| Dimension | V6 score |
|-----------|---------:|
| Overall | 64 |
| Security | 86 |
| Performance | 60 |
| Reliability | 25 |
| DDD | 64 |

These are reproduced from the V6 audit document; this remediation does not
re-score them at baseline. Re-scoring will happen after each phase using the
same V6 methodology, so deltas are apples-to-apples.
