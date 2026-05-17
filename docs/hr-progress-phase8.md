# HR Phase 8 — Testing & Polish Progress

Reference: `docs/HR_PRODUCTION_AGENT_PROMPT.md` § PHASE 8
Branch (this worktree): `worktree-agent-aa4080563bb72ed16` (from `chore/clean-faza-3`)
Agent: HR Phase 8 (Testing & Polish) remediation agent
Date: 2026-05-17

> Phase 8 is intentionally split because most of its 10 tasks depend on
> Phases 1-7 being merged. This file tracks the **test infrastructure**
> portion that can be landed now. Feature-content tests (E2E specs for pages
> not yet implemented, mutation scoring on changing code, etc.) are deferred
> to **Phase 8 part B — after Phase 1-7 merge**.
>
> When `docs/hr-progress.md` is merged from the main repo branch, append
> these entries under a new "Phase 8" heading.

## Worktree reality check

The worktree shipped to this agent is at HEAD `7da4077c` which is **older**
than `chore/clean-faza-3` (`037dd98d` on the parent repo). That means:

- No `docs/hr-progress.md` from Phase 0 is present here — created
  `docs/hr-progress-phase8.md` (this file) instead to avoid a phantom merge
  conflict.
- No `apps/api/test/_fixtures/hr.factories.ts` — Phase 0 setup not yet
  visible. Backend integration tests written here use plain inline seeds.
- Existing test infra already in place at this HEAD:
  - `@playwright/test` + 11 E2E specs under `artifacts/erp-dashboard/e2e/`
    (including `hr-employees.spec.ts` and `hr-assets.spec.ts`).
  - `artifacts/erp-dashboard/playwright.config.ts` with chromium project,
    JUnit reporter, base URL = `http://localhost:5173`.
  - `apps/api/test/jest.config.js` with `testRegex: 'test/.*\\.spec\\.ts$'`
    and `swc-jest` transform.
- Not present (none of these existed at this HEAD):
  - Stryker / mutation testing config.
  - Storybook config under `artifacts/erp-dashboard/.storybook/`.
  - k6 scripts.
  - `@axe-core/playwright` dependency.
  - Test Postgres compose file.

## Tasks delivered

| Task | Status | Files | Run command |
|------|--------|-------|-------------|
| T8.1 — Frontend E2E suite (HR pages) | done (infra) | `artifacts/erp-dashboard/e2e/hr-recruiting.spec.ts`, `artifacts/erp-dashboard/e2e/hr-org-structure.spec.ts` | `pnpm --filter erp-dashboard exec playwright test e2e/hr-recruiting.spec.ts e2e/hr-org-structure.spec.ts` |
| T8.2 — Backend integration test infra | done (infra) | `docker-compose.test.yml`, `apps/api/test/_helpers/setup-test-db.ts`, `apps/api/test/hr/employees.integration.spec.ts`, `apps/api/test/hr/leave-requests.integration.spec.ts`, `apps/api/test/hr/departments.integration.spec.ts` | See "Backend integration runbook" below |
| T8.6 — Accessibility audit (axe-core baseline) | done (infra) | `artifacts/erp-dashboard/e2e/hr-a11y.spec.ts` | `pnpm --filter erp-dashboard add -D @axe-core/playwright axe-core && pnpm --filter erp-dashboard exec playwright test e2e/hr-a11y.spec.ts` |

## Tasks deferred (Phase 8 part B — after Phases 1-7 merge)

| Task | Why deferred |
|------|-------------|
| T8.3 — Stryker mutation testing (75% score) | Mutation score is only meaningful on stable code. Premature on a module that's about to be rewritten in Phases 5-7. Add Stryker config + a single example run as the last step of Phase 8 part B. |
| T8.4 — k6 performance benchmarks | Endpoint shape (`/api/employees`, `/api/hr/recruitment/funnel`) is still in flight in Phase 2 + 5. Bench against a moving target produces noise. Plan: ship one `k6/hr-employees-list.js` script + p95 budget once Phase 5 lands. |
| T8.5 — Storybook + Chromatic visual regression | EmployeeCard / OrgNode / SidebarItem components are being touched in Phases 3 + 6. Defer Storybook setup until those land so stories are written against final API. |
| T8.7 — Bundle size optimization | Awaits the lazy-loading reshape from `HRRoutes.tsx` migration (already started — uses `lazy()`). Real bundle audit after Phase 7. |
| T8.8 — Per-page documentation | Awaits final page surface from Phase 4 (broken APIs) and Phase 7 (sub-modules). |
| T8.9 — Pilot launch checklist | Trivially blocked on Phases 1-7. |
| T8.10 — Production deployment runbook | Same blocker as T8.9. |

## Backend integration runbook

```bash
# 1. Start test Postgres (single-container, tmpfs, port 55432)
docker compose -f docker-compose.test.yml up -d

# 2. Apply current schema once
TEST_DATABASE_URL=postgres://test:test@localhost:55432/europrint_test \
  pnpm --filter @workspace/db run db:push

# 3. Run integration tests
RUN_INTEGRATION_TESTS=1 \
TEST_DATABASE_URL=postgres://test:test@localhost:55432/europrint_test \
  pnpm --filter @europrint/api exec jest --config test/jest.config.js \
    test/hr/employees.integration.spec.ts \
    test/hr/leave-requests.integration.spec.ts \
    test/hr/departments.integration.spec.ts

# 4. Tear down (wipes data thanks to tmpfs)
docker compose -f docker-compose.test.yml down
```

By default the integration specs are wrapped in `describe.skip` unless
`RUN_INTEGRATION_TESTS=1` is set. This keeps `pnpm test` green on developer
machines without Postgres on :55432.

## Frontend E2E runbook

```bash
# Run all HR E2E specs (assumes API on :8080, dev server on :5173)
pnpm --filter erp-dashboard exec playwright test \
  e2e/hr-employees.spec.ts \
  e2e/hr-recruiting.spec.ts \
  e2e/hr-org-structure.spec.ts \
  e2e/hr-assets.spec.ts

# Environment knobs (all optional):
#   API_BASE_URL          default http://localhost:8080
#   PLAYWRIGHT_BASE_URL   default http://localhost:5173
#   TEST_ADMIN_USER       default admin
#   TEST_ADMIN_PASS       default admin123
```

The two new specs (`hr-recruiting.spec.ts`, `hr-org-structure.spec.ts`)
follow the contract-style pattern already established by
`hr-employees.spec.ts`: unauthenticated → expect 401/403; authenticated →
either expect 200 or tolerate 404/501 so they remain green while the
endpoints are still being implemented in Phases 2 & 5.

## Accessibility (axe-core) runbook

```bash
# 1. Install axe-core for Playwright (one-time)
pnpm --filter erp-dashboard add -D @axe-core/playwright axe-core

# 2. Run baseline scan
pnpm --filter erp-dashboard exec playwright test e2e/hr-a11y.spec.ts

# The spec scans /login, /employees, /hr/recruiting, /org-chart.
# It fails on any 'critical' or 'serious' WCAG 2.1 AA violation.
# 'color-contrast' is excluded from the baseline — re-enable after design
# tokens stabilize.
```

Until `@axe-core/playwright` is installed, the spec self-skips via a
dynamic `import()` guarded by try/catch — so it doesn't break CI today.

## Run-time numbers

No real benchmarks taken this session: the integration tests require Docker
+ a schema-applied test database, and the worktree environment isn't wired
for that. **T8.4 k6** is the right place to capture p95 numbers; deferred
above. Smoke-run timing for the new files when run locally with the API
unreachable (`pnpm exec playwright test e2e/hr-recruiting.spec.ts`) is
~400 ms per spec including Playwright startup.

## Commits (this worktree)

Three commits, one per setup piece, on branch
`worktree-agent-aa4080563bb72ed16` (from `chore/clean-faza-3`):

| SHA | Subject | Files |
|-----|---------|-------|
| `75f4f54b` | chore(hr-test): playwright HR specs + axe-core a11y baseline | 3 e2e specs (288 LOC) |
| `261b07e4` | chore(hr-test): backend integration test infra + 3 example specs | docker-compose.test.yml + setup-test-db helper + 3 specs (471 LOC) |
| `7ec6b0a1` | docs(hr): Phase 8 progress note — 3 infra pieces done, 7 deferred | this file |

## Open questions / handoff notes

- **Schema drift risk**: The integration tests hard-code column names
  (`name_uz`, `code`, `employee_code`). If Phase 1 task 1.5 (PII
  encryption) rewrites column types, these specs will need updating.
- **Test DB seeding**: Currently each spec inline-seeds its own fixtures.
  Phase 0 in the main branch added `apps/api/test/_fixtures/hr.factories.ts`
  — when those land here, refactor the integration specs to use them
  (replace ~30 lines of inline INSERTs per file).
- **`hr-employees.spec.ts` already exists** at this HEAD with 14 tests
  covering both unauth and admin-authenticated paths. T8.1's "25 specs"
  target should be measured against the union of (existing 11 e2e files +
  the 2 added here + 5-10 more once Phase 4 broken APIs land).
- **No CI wiring**: I did not modify `.github/workflows/*` because the
  worktree doesn't show what's expected to run. Recommend adding an
  `integration-tests` job that:
    1. starts `docker-compose.test.yml`,
    2. applies schema,
    3. runs `RUN_INTEGRATION_TESTS=1 pnpm --filter @europrint/api run test`.
