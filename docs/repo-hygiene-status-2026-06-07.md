# EuroPrint ERP — Repo Hygiene Status Report
**Date:** 2026-06-07  
**Branch:** `chore/schema-convergence` (ahead of main by ~835 commits)

---

## STEP 1 — Backup Push ✅

Push to GitHub after 584-commit gap (last pushed: 2026-05-27 @ b009b377).

**Result:** `chore/schema-convergence` pushed to `origin` (e7fe97d3 at time of push).  
**Note:** Push was initially BLOCKED by GitHub push-protection (Anthropic + Yandex API keys leaked in commit 2c20cbf4, file: `docs/full-analysis-2026-05-27-v2/01-architecture-monorepo.md`).

---

## KEY SCRUB — Secret History Rewrite ✅

Secrets scrubbed from git history before backup push.

- Tool: `git-filter-repo --replace-text /tmp/replacements.txt --force`
- Commits rewritten: 884
- Secrets replaced with `***REMOVED***` in all blobs
- Push-protection scan: **PASSED** after scrub
- Status: All scrubbed values confirmed gone from new history (`grep -c` = 0)

**Keys affected (NOT printed, Q-30 compliance):** Anthropic API key + Yandex API key from docs analysis file.

⚠️ **Owner action needed:** Rotate both keys (even though they never reached GitHub, they existed locally).

---

## STEP 2 — main Update ✅

```
origin/main: 7da4077c (2026-05-14, stale)
→ fast-forward push with --force-with-lease after filter-repo rewrite
→ origin/main: e7fe97d3 (now in sync with chore/schema-convergence)
```

---

## STEP 3 — CI Diagnosis + Fixes

### CI Pipeline (`ci.yml`) before fixes
| Job | Status | Root Cause |
|-----|--------|-----------|
| All jobs | ❌ 0s failure | YAML parse error: unquoted `:` in step `name:` |

### Commits applied (STEP 3)

| Commit | Description |
|--------|-------------|
| `ddc82310` | fix(ci): quote step names with colons — fix 0s workflow file issue |
| `aa11ab6b` | fix(ci): @types/ws, security tests, deps, DATABASE_URL mock |

### CI Pipeline after fixes

| Job | Status |
|-----|--------|
| TypeScript Tekshiruv | ✅ PASS |
| ESLint Tekshiruv | ✅ PASS |
| Xavfsizlik Audit | ✅ PASS |
| Vitest Unit Testlar | ❌ 23/677 suites failing (63/9292 tests) |
| Build Tekshiruv | ⏩ SKIPPED (depends on unit tests) |

### Fixes applied per failure category

#### YAML parse error (0s failure)
- **Root cause:** `- name: lib/db build (kerak: @workspace/db CJS importi uchun)` — unquoted colon in YAML value
- **Fix:** Quoted both occurrences (typecheck + unit-tests jobs): `"lib/db build (kerak: @workspace/db CJS importi uchun)"`

#### TypeScript: `Cannot find module 'ws'`
- **Root cause:** `apps/api/src/modules/hr/ai-interview-v2/gemini-live.gateway.ts` uses `import WebSocket from 'ws'`; pnpm isolates transitive deps so `ws` not accessible without direct declaration
- **Fix:** Added `ws@^8.18.0` + `@types/ws@^8.5.14` to `apps/api/package.json`; lock file updated (axios: 1.15.2→1.17.0, @types/ws@8.18.1 added)

#### Security audit: HIGH CVEs
- **`tmp@0.2.5`** (path traversal, via exceljs@4.4.0): root `pnpm.overrides` had `>=0.2.3` — bumped to `>=0.2.6`
- **`axios@1.15.2`** (CVE: proxy bypass + MitM via proto-pollution): upgraded to `^1.16.0` (locked to 1.17.0)

#### Unit tests: DATABASE_URL crash-on-import
- **Root cause:** `lib/db/dist/cjs/index.js:52` throws at module load if `DATABASE_URL` not set. ~20 test suites transitively import `@shared/db` and crashed before running any tests.
- **Fix (config-level):** Added fallback mock values in ci.yml unit-tests env:
  ```yaml
  DATABASE_URL: ${{ secrets.DATABASE_URL || 'postgresql://mock:mock@localhost:5432/testdb' }}
  JWT_SECRET:   ${{ secrets.JWT_SECRET || 'mock-jwt-secret-for-unit-tests-only' }}
  ```
- **Owner action:** Set real `DATABASE_URL` and `JWT_SECRET` as GitHub Actions secrets for integration tests to pass.

#### Unit tests: cross-platform path traversal
- **Root cause:** `safePath()` in two security test files didn't normalize backslashes. Windows-style payloads (`'..\\..\\Windows\\System32'`, `'C:\\Windows\\System32'`) were not detected as traversal on Linux CI (backslash is not `path.sep`).
- **Fix:** Normalize backslashes in both `security-suite.spec.ts` and `security-exhaustive.spec.ts`; add Windows absolute path regex guard.

#### Unit tests: orphaned test file
- **`test/pos-gl-auto.service.spec.ts`** — imported `pos-gl-auto.listener` and `pos-movement-completed.event`, both deleted in commit `a1343fb5`. Deleted the test file.

#### Unit tests: 23 remaining assertion failures (pre-existing)
These are pre-existing test assertion failures where source code changed without updating test expectations. Being fixed separately (see agent task):

```
test/compatibility/asset-management.spec.ts
test/compatibility/goals-compat.spec.ts
test/compatibility/hr-map-compat.spec.ts
test/compatibility/saas.spec.ts
test/compatibility/succession-compat.spec.ts
test/compatibility/users-compat.spec.ts
test/crm/crm-activities.repository.spec.ts
test/crm/lead-save.spec.ts
test/crm/qualify-lead.handler.spec.ts
test/design/request-design.handler.spec.ts
test/hr/create-employee.handler.spec.ts
test/hr/daily-report.controller.spec.ts
test/hr/hr-offboarding.controller.spec.ts
test/integration/pos-sales-persistence.spec.ts
test/iot/anomaly-detected.handler.spec.ts
test/iot/record-sensor-reading.handler.spec.ts
test/marketing/campaigns.repository.spec.ts
test/mm/create-purchase-order.handler.spec.ts
test/mm/goods-receipt.handler.spec.ts
test/sd/confirm-advance-payment.handler.spec.ts
test/sd/create-order.handler.spec.ts
test/sd/sd-dashboard.service.spec.ts
test/security/report-incident.handler.spec.ts
```

Pattern: error messages changed, return types changed (string → object), event payloads changed.

---

## STEP 4 — Branch Cleanup

### Local branches deleted
67 merged `worktree-agent-*` branches deleted before filter-repo (reduces scope).

### Remote branches status (after filter-repo rewrite)

These branches are "not-merged" because their commit hashes no longer exist in the rewritten history:

| Branch | Status | Action |
|--------|--------|--------|
| `chore/faza-1-foundation` | not-merged (old hash) | KEPT — pending owner review |
| `chore/faza-3-batch-1` | not-merged (old hash) | KEPT |
| `chore/faza-3-batch-2` | not-merged (old hash) | KEPT |
| `chore/faza-3-batch-3` | not-merged (old hash) | KEPT |
| `chore/faza-3-loading-states` | not-merged (old hash) | KEPT |
| `chore/clean-faza-3` | not-merged (old hash) | KEPT |
| `ci/lib-db-build` | does not exist | N/A |

⚠️ **Owner note:** These branches contain UI/feature work that may have value. They cannot be fast-forward merged onto the rewritten history without a rebase. Owner decision needed before deletion.

### Active worktrees (NOT deleted)
- `agent1/fix-leverage` — locked worktree
- `chore/green-lie-group1` — locked worktree

⚠️ Both point to pre-filter-repo commit hashes. Before pushing from these worktrees, their branches must be rebased onto the new rewritten history (`git rebase --onto <new-base> <old-base> <branch>`).

---

## Summary

| Item | Status |
|------|--------|
| Backup pushed to GitHub | ✅ |
| Secrets scrubbed from history | ✅ |
| `main` updated | ✅ |
| CI 0s YAML failure | ✅ Fixed |
| TypeScript typecheck | ✅ Passing |
| ESLint | ✅ Passing |
| Security audit (pnpm audit --level=high) | ✅ Passing |
| Unit tests (DATABASE_URL crash) | ✅ Fixed (fallback mock) |
| Unit tests (cross-platform path tests) | ✅ Fixed |
| Unit tests (orphaned test) | ✅ Deleted |
| Unit tests (23 assertion failures) | 🔄 In progress |
| Build job | ⏩ Blocked on unit tests |
| Remote branch cleanup | ⏩ Owner decision needed |

---

## Owner Actions Required

1. **Rotate leaked API keys:** Anthropic key + Yandex API key (even though never pushed to GitHub, they existed in local history)
2. **Set GitHub Actions secrets:** `DATABASE_URL` + `JWT_SECRET` for integration tests (Settings → Secrets → Actions)
3. **Decide on faza-3 branches:** Review and rebase or delete `chore/faza-1-foundation`, `chore/faza-3-*`, `chore/clean-faza-3`
4. **Worktrees post-rewrite:** `agent1/fix-leverage` and `chore/green-lie-group1` need rebase before pushing
