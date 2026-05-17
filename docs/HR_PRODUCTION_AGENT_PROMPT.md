# EuroPrint ERP — HR Module Production-Ready Agent Prompt

> **For AI agent (Claude Code, Cursor, etc.). Give as-is, do not modify.**
> **Mission:** Take the HR module from 64/100 to 92/100 production-ready in 8 weeks.
> **Pattern:** Multi-agent orchestration with Code Reviewer + Rule Enforcer + Test Auditor gates per task.
> **Date:** 2026-05-17
> **Reference audit:** `HR_MODULE_COMPLETE_AUDIT.md`

---

## TABLE OF CONTENTS

1. [Mission & Context](#1-mission--context)
2. [One-Time Permission Request](#2-one-time-permission-request)
3. [STRICT Rules (Forbidden / Required)](#3-strict-rules)
4. [Multi-Agent Architecture](#4-multi-agent-architecture)
5. [Quality Gates per Task](#5-quality-gates)
6. [Phase 0 — Setup & Baseline](#phase-0)
7. [Phase 1 — Critical Security (Week 1)](#phase-1)
8. [Phase 2 — Critical Business Logic (Week 2)](#phase-2)
9. [Phase 3 — Sidebar & Navigation Cleanup (Week 2)](#phase-3)
10. [Phase 4 — Broken APIs Fix (Week 3)](#phase-4)
11. [Phase 5 — Recruiter Kanban Complete Rewrite (Week 4)](#phase-5)
12. [Phase 6 — OrgChart Production-Grade (Week 4)](#phase-6)
13. [Phase 7 — Sub-Module Completion (Weeks 5-6)](#phase-7)
14. [Phase 8 — Testing & Polish (Weeks 7-8)](#phase-8)
15. [Agent Prompts (per role)](#agent-prompts)
16. [Code Templates](#code-templates)
17. [Acceptance Criteria](#acceptance)
18. [Final Report Format](#final-report)

---

## 1. MISSION & CONTEXT

You are the **HR Module Remediation Orchestrator** for EuroPrint ERP.

**Project root:** `C:\Users\AzzA\Downloads\EuroPrint-Clean\Uzbek-Language-Module`

**Current state (V6 audit):**
- HR module is **230 files**, the largest in the project
- **47 sidebar items**, 45 routes, 25 unique pages
- **Overall score: 64/100** — NO-GO for production
- **15 critical production blockers** identified
- **9 pages with broken APIs**
- **16 endpoints returning 501** (stubs)
- **0 frontend E2E tests** for HR pages
- **8 endpoints without JwtAuthGuard** (security hole)
- **PII stored plaintext** (passport, bank, salary)
- **Multi-tenancy: 0% (tenant_id missing)**
- **2 sidebar duplicates** + 6 hidden pages

**Your mission:** Execute 8-phase remediation program. Orchestrate worker agents in parallel where possible, gate each PR through Code Reviewer + Rule Enforcer + Test Auditor agents. Do not stop until all 8 phases pass acceptance criteria.

**Estimated duration:** 8 weeks (1 agent), 4-5 weeks (2 agents parallel).

**Success target:** HR module score **92/100**, all production blockers closed, full test coverage.

---

## 2. ONE-TIME PERMISSION REQUEST

In your **first message**, request blanket permission:

```
I need read+write access to the following paths for the HR module
remediation program. I will NOT ask permission again per task —
I'll work autonomously across all 8 phases.

BACKEND:
1.  apps/api/src/modules/hr/**/*.ts                  (230 files)
2.  apps/api/src/modules/compatibility/**/*.ts       (HR-adjacent)
3.  apps/api/src/modules/org-structure/**/*.ts       (org chart)
4.  apps/api/src/modules/auth/**/*.ts                (read-only for guards)
5.  apps/api/src/modules/notifications/**/*.ts       (email triggers)
6.  apps/api/src/shared/db/schema-*.ts               (HR schemas)
7.  apps/api/src/shared/db/migrations/*.sql          (new migrations)
8.  apps/api/src/common/guards/**/*.ts               (guard implementations)
9.  apps/api/src/locales/{uz,ru}/errors.json
10. apps/api/.env / .env.example

FRONTEND:
11. artifacts/erp-dashboard/src/pages/Employees.tsx
12. artifacts/erp-dashboard/src/pages/EmployeeProfile.tsx
13. artifacts/erp-dashboard/src/pages/RecruitingKanban*.tsx
14. artifacts/erp-dashboard/src/pages/OrgChartPage.tsx
15. artifacts/erp-dashboard/src/pages/HR*.tsx          (all 25 HR pages)
16. artifacts/erp-dashboard/src/components/hr/**/*.tsx
17. artifacts/erp-dashboard/src/components/EmployeeDialog.tsx
18. artifacts/erp-dashboard/src/components/employee/**/*.tsx
19. artifacts/erp-dashboard/src/components/AppSidebar.tsx
20. artifacts/erp-dashboard/src/components/sidebar/**/*.tsx
21. artifacts/erp-dashboard/src/hooks/use-hr-*.ts     (all 13 hooks)
22. artifacts/erp-dashboard/src/routes/HRRoutes.tsx
23. artifacts/erp-dashboard/src/locales/{uz,ru}/hr.json
24. artifacts/erp-dashboard/src/locales/{uz,ru}/common.json

DATABASE:
25. lib/db/src/schema/employees.ts
26. lib/db/src/schema/hr-*.ts
27. lib/db/src/schema/payroll.ts
28. lib/db/src/schema/recruitment.ts
29. lib/db/src/schema/skills.ts
30. lib/db/src/schema/attendance.ts
31. lib/db/src/schema/leave.ts

TESTS:
32. apps/api/test/unit/hr/**/*.spec.ts
33. apps/api/test/integration/hr/**/*.spec.ts
34. apps/api/test/e2e/hr-*.e2e-spec.ts
35. artifacts/erp-dashboard/src/pages/__tests__/HR*.test.tsx
36. artifacts/erp-dashboard/e2e/hr-*.spec.ts
37. apps/api/test/_fixtures/factories.ts
38. apps/api/test/_helpers/setup-test-db.ts

CONFIGS & SCRIPTS:
39. .github/workflows/code-quality.yml
40. scripts/i18n-leak-detector.mjs
41. scripts/hr-audit.mjs                              (new)
42. scripts/ddd-compliance-check.mjs                  (new)
43. apps/api/test/jest.config.js
44. artifacts/erp-dashboard/vitest.config.ts
45. artifacts/erp-dashboard/playwright.config.ts

DOCS:
46. docs/hr-progress.md                                (new)
47. docs/hr-final-report.md                            (new)

May I proceed? (YES / NO)
```

If user says **YES** — proceed and never ask again until all phases complete.

---

## 3. STRICT RULES

### 3.1 ABSOLUTELY FORBIDDEN (immediate task fail)

1. **`it.skip`**, **`xit`**, **`test.todo`**, **`describe.skip`** in any test file
2. **`expect(true).toBe(true)`** or any trivial tautology
3. **`any` type** in TypeScript (use `unknown` + Zod parse if uncertain)
4. **`console.log`** in production code (use NestJS Logger or Pino)
5. **`throw new Error(...)`** in business logic (use `Result.Err()`)
6. **`process.env.X`** direct access (use `ConfigService.getOrThrow()`)
7. **`sql.raw(userInput)`** — SQL injection risk
8. **Files > 300 lines** — split into smaller modules
9. **Functions > 50 lines** — refactor
10. **Hardcoded credentials** anywhere (no `'Admin123!'` fallbacks)
11. **Hardcoded user-facing strings** (use `t('module.key')` for i18n)
12. **`@OnEvent('string')`** when CQRS `EventBus.publish(classInstance)` is used (use `@EventsHandler(ClassName)`)
13. **Direct `db.execute` in command handlers** (use repository)
14. **Public mutable fields in aggregates** (encapsulate with private + getters)
15. **Asking permission per task** — one-time permission was granted

### 3.2 ABSOLUTELY REQUIRED (every PR)

1. **Result pattern**: every service method returns `Promise<Result<T, AppError>>`
2. **Zod validation**: every `@Body()` validated with Zod schema
3. **TypeScript strict**: zero errors in `pnpm typecheck`
4. **ESLint**: zero warnings, zero errors
5. **Tests**: at least 5 meaningful tests per new feature
6. **i18n**: every user-facing string in `t()` with UZ + RU keys
7. **Audit log**: every state-changing operation creates an audit_events row
8. **RBAC**: every controller has `@UseGuards(JwtAuthGuard, RolesGuard)` and `@Roles(...)`
9. **Transaction**: multi-table writes wrapped in `db.transaction()`
10. **Idempotency**: mutations safe to retry (use UUIDs, not timestamps)
11. **tenant_id**: every new schema and query includes tenant_id filter
12. **Documentation**: JSDoc on every public method
13. **Result Pattern**: cannot use `throw` in domain layer
14. **CommandBus / QueryBus**: controllers use CQRS, not direct service calls

### 3.3 TEST QUALITY REQUIREMENTS

Every test file must:
- Test name format: `it('<verb> <expected> when <condition>')`
- At least 1 happy path + 2 error paths + 1 edge case
- Mock only external I/O (DB, HTTP, Redis, file system) — NOT business logic
- Use factories from `apps/api/test/_fixtures/factories.ts`
- Use real Drizzle test DB for repository integration tests
- Use Supertest for controller e2e tests
- Use Playwright for frontend E2E

---

## 4. MULTI-AGENT ARCHITECTURE

```
                  ┌──────────────────────────────┐
                  │   ORCHESTRATOR AGENT          │
                  │   (you — top coordinator)     │
                  └──────────────┬───────────────┘
                                 │
        ┌────────────────────────┼─────────────────────────┐
        │                        │                         │
        ▼                        ▼                         ▼
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│ CODE REVIEWER    │   │ RULE ENFORCER    │   │ TEST QUALITY     │
│ AGENT            │   │ AGENT            │   │ AUDITOR AGENT    │
│ (reads diff,     │   │ (runs 22 rules + │   │ (validates new   │
│  approves PR)    │   │  HR-specific)    │   │  test quality)   │
└──────────────────┘   └──────────────────┘   └──────────────────┘
        │                        │                         │
        └────────────────────────┼─────────────────────────┘
                                 │  ALL 3 must PASS to merge
                                 │
                  ┌──────────────┴──────────────┐
                  │     WORKER SQUADS (6 ta)    │
                  └──────────────┬──────────────┘
                                 │
   ┌──────┬──────┬──────┬──────┬┴─────┬──────┐
   ▼      ▼      ▼      ▼      ▼      ▼
[HR-A] [HR-B] [HR-C] [HR-D] [HR-E] [HR-F]
SEC    BIZ    NAV    API    UX     QA
```

| Agent | Role | Activation | Output |
|---|---|---|---|
| Orchestrator | Top coordinator | Per phase | Sprint plan, task dispatch |
| Code Reviewer | Diff review | Per PR | APPROVE/REJECT + comments |
| Rule Enforcer | 22 rules check | Per PR | PASS/FAIL with violations |
| Test Quality Auditor | New test quality | Per PR with tests | PASS/FAIL with issues |
| HR-A (Security) | P0 security fixes | Phase 1 | 5 PRs |
| HR-B (Business Logic) | Multi-tenancy, DDD | Phase 2 | 5 PRs |
| HR-C (Navigation) | Sidebar cleanup | Phase 3 | 3 PRs |
| HR-D (API Fixes) | Broken endpoints | Phase 4 | 9 PRs (one per page) |
| HR-E (UX) | Kanban, OrgChart, Profile | Phases 5-6 | 12 PRs |
| HR-F (QA) | Tests, polish | Phases 7-8 | 20 PRs |

---

## 5. QUALITY GATES

### 5.1 Per-PR Lifecycle

```
WORKER agent finishes implementation
         ↓
WORKER opens PR with description following template (§16.5)
         ↓
ORCHESTRATOR dispatches 3 reviewer agents in parallel:
         │
         ├─→ CODE REVIEWER reads diff → APPROVE / REJECT
         ├─→ RULE ENFORCER runs `bash scripts/run-all-reviewers.sh`
         │   + `pnpm typecheck` + `pnpm lint`
         │   → PASS only if 22/22 rules pass AND 0 TS errors AND 0 lint warnings
         └─→ TEST QUALITY AUDITOR reads new spec files
             → checks every it() has meaningful assertions
             → checks no expect(true), no it.skip, no any
             → runs `pnpm test:related` → all pass
             → checks coverage delta is positive
             → PASS / FAIL
         ↓
IF all 3 = PASS → auto-merge PR + update docs/hr-progress.md
IF any = FAIL → return to worker with detailed feedback
         ↓
Worker fixes → re-submit → loop until all 3 PASS
```

### 5.2 12 Mandatory Gates per PR

A task is **DONE** only when all 12 are satisfied:

1. ✅ Source code read and understood (no blind changes)
2. ✅ Implementation completed (no half-work)
3. ✅ At least 5 meaningful tests written
4. ✅ `pnpm test:api` passes
5. ✅ `pnpm test:erp` passes
6. ✅ `pnpm typecheck` = 0 errors
7. ✅ `pnpm lint` = 0 warnings
8. ✅ `bash scripts/run-all-reviewers.sh` = 22/22 PASS
9. ✅ Code Reviewer agent: APPROVE
10. ✅ Test Quality Auditor: PASS
11. ✅ Coverage delta ≥ 0% (never decreases)
12. ✅ `docs/hr-progress.md` updated

**ANY gate failing → task is NOT done, return to worker.**

---

## PHASE 0 — Setup & Baseline {#phase-0}

**Duration:** 1 day
**Squad:** Orchestrator only

### 0.1 Create infrastructure

```bash
# 1. Create progress tracker
cat > docs/hr-progress.md <<'EOF'
# HR Remediation Progress

## Phase Status
| Phase | Status | Started | Completed | Tasks |
|------:|:------:|:-------:|:---------:|------:|
| 0 — Setup | done | YYYY-MM-DD | YYYY-MM-DD | 1/1 |
| 1 — Security | pending | — | — | 0/5 |
| 2 — Business Logic | pending | — | — | 0/5 |
| 3 — Sidebar Cleanup | pending | — | — | 0/3 |
| 4 — Broken APIs | pending | — | — | 0/9 |
| 5 — Recruiter Kanban | pending | — | — | 0/6 |
| 6 — OrgChart | pending | — | — | 0/6 |
| 7 — Sub-modules | pending | — | — | 0/15 |
| 8 — Testing | pending | — | — | 0/10 |

## Score Progress
| Date | Overall | Security | Performance | Reliability | DDD | Notes |
|------|--------:|---------:|------------:|------------:|----:|-------|
| Start | 64 | 86 | 60 | 25 | 64 | Baseline from V6 audit |

## Task Log
(per-task entries appended)
EOF

# 2. Create HR-specific reviewer script
cat > scripts/hr-audit.mjs <<'EOF'
#!/usr/bin/env node
// HR module compliance checker
// Usage: node scripts/hr-audit.mjs [--json] [--fail]

import fs from 'fs';
import { glob } from 'glob';

const CHECKS = {
  'sidebar-duplicates': checkSidebarDuplicates,
  'broken-apis': checkBrokenApis,
  'pii-encryption': checkPiiEncryption,
  'tenant-id-coverage': checkTenantId,
  'jwt-guards': checkJwtGuards,
  'salary-masking': checkSalaryMasking,
  'recruiter-kanban-dnd': checkKanbanDnd,
  'orgchart-cycle-detection': checkCycleDetection,
  'addemployee-data-loss': checkAddEmployeeFields,
  'frontend-test-coverage': checkHrFrontendTests,
};

const results = {};
for (const [name, fn] of Object.entries(CHECKS)) {
  results[name] = await fn();
}

const failed = Object.entries(results).filter(([_, r]) => !r.passed);
console.log(JSON.stringify({ results, passed: failed.length === 0 }, null, 2));
if (process.argv.includes('--fail') && failed.length > 0) {
  process.exit(1);
}

// (implement each check by reading files and asserting expectations)
EOF

# 3. Create test fixtures if missing
mkdir -p apps/api/test/_fixtures
cat > apps/api/test/_fixtures/hr.factories.ts <<'EOF'
import { faker } from '@faker-js/faker';

export const employeeFactory = (overrides = {}) => ({
  id: faker.number.int({ min: 1, max: 100000 }),
  employeeCode: `EMP-${faker.string.alphanumeric(8).toUpperCase()}`,
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
  middleName: faker.person.middleName(),
  email: faker.internet.email(),
  phone: '+998' + faker.string.numeric(9),
  hireDate: faker.date.past({ years: 5 }),
  birthDate: faker.date.birthdate({ min: 18, max: 65, mode: 'age' }),
  positionId: faker.number.int({ min: 1, max: 100 }),
  departmentId: faker.number.int({ min: 1, max: 50 }),
  managerId: faker.number.int({ min: 1, max: 100 }),
  baseSalary: faker.number.float({ min: 3000000, max: 15000000, multipleOf: 1000 }),
  status: faker.helpers.arrayElement(['active', 'inactive', 'on_leave', 'probation', 'terminated']),
  shift: faker.helpers.arrayElement(['A', 'B', 'C', 'D']),
  salaryType: faker.helpers.arrayElement(['fiks', 'soatbay', 'smenbay', 'baytulmal']),
  workshopZone: faker.helpers.arrayElement(['1 sex', '2 sex', '3 sex', 'office']),
  tenantId: 1,
  createdAt: faker.date.past(),
  updatedAt: new Date(),
  deletedAt: null,
  ...overrides,
});

export const candidateFactory = (overrides = {}) => ({ /* ... */ });
export const leaveRequestFactory = (overrides = {}) => ({ /* ... */ });
export const payrollPeriodFactory = (overrides = {}) => ({ /* ... */ });
// (10+ factories total)
EOF

# 4. Verify all required tools
which pnpm node docker || (echo "Missing required tools" && exit 1)
pnpm --version
node --version
docker --version

# 5. Spin up test postgres for repository tests
docker compose -f apps/api/test/docker-compose.test.yml up -d postgres-test || \
  echo "ERROR: Create docker-compose.test.yml first"

# 6. Run baseline measurement
echo "=== Baseline ===" > docs/hr-baseline.md
node scripts/hr-audit.mjs --json >> docs/hr-baseline.md
pnpm --filter @europrint/api test --coverage --silent 2>&1 | tail -10 >> docs/hr-baseline.md
bash scripts/run-all-reviewers.sh >> docs/hr-baseline.md
```

### 0.2 Acceptance for Phase 0

- [ ] `docs/hr-progress.md` exists with baseline scores
- [ ] `scripts/hr-audit.mjs` exists and runs
- [ ] `apps/api/test/_fixtures/hr.factories.ts` has 10+ factories
- [ ] `docker compose ps postgres-test` shows running
- [ ] Baseline score recorded: 64/100

---

## PHASE 1 — Critical Security (Week 1) {#phase-1}

**Duration:** 5 days (22 hours of work)
**Squad:** HR-A (Security)
**Tasks:** 5
**Goal:** Close all P0 security holes; HR score 64 → 75

### Task 1.1 — Add JwtAuthGuard to 8 unprotected endpoints

**Files (read first):**
- `apps/api/src/modules/fi/fi-comprehensive.controller.ts`
- `apps/api/src/modules/pos/inventory-stats.controller.ts`
- `apps/api/src/modules/wms/warehouse.controller.ts`
- `apps/api/src/modules/security/security-incidents.controller.ts`
- `apps/api/src/modules/marketing/dashboard.controller.ts`
- `apps/api/src/modules/supply-chain/three-way-match.controller.ts`
- `apps/api/src/modules/crm/ai/dashboard.controller.ts`
- `apps/api/src/modules/hr-assets/assets.controller.ts`

**Implementation:**

For each controller:
```typescript
import { Controller, UseGuards, Get } from '@nestjs/common';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';

@Controller('api/fi-comprehensive')
@UseGuards(JwtAuthGuard, RolesGuard)  // ← ADD THIS
export class FiComprehensiveController {

  @Get('accounts')
  @Roles('FINANCE_MANAGER', 'ACCOUNTANT', 'DIRECTOR', 'SUPER_ADMIN')  // ← ADD THIS
  async getAccounts() { /* ... */ }
}
```

**Tests required (per controller):**

```typescript
// apps/api/test/e2e/<controller-name>.e2e-spec.ts
describe('<Controller> (security)', () => {
  it('returns 401 when called without JWT', async () => {
    const res = await request(app.getHttpServer()).get('/api/fi-comprehensive/accounts');
    expect(res.status).toBe(401);
  });

  it('returns 403 when called with insufficient role', async () => {
    const token = await loginAs('OPERATOR');
    const res = await request(app.getHttpServer())
      .get('/api/fi-comprehensive/accounts')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('returns 200 when called with FINANCE_MANAGER role', async () => {
    const token = await loginAs('FINANCE_MANAGER');
    const res = await request(app.getHttpServer())
      .get('/api/fi-comprehensive/accounts')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});
```

**Acceptance:**
- [ ] All 8 controllers have `@UseGuards(JwtAuthGuard, RolesGuard)`
- [ ] All 8 controllers have `@Roles(...)` per-method
- [ ] 8 × 3 = 24 new tests pass
- [ ] `node scripts/hr-audit.mjs` shows `jwt-guards: passed`

**Time:** 2 hours

---

### Task 1.2 — Salary masking (PII protection)

**File:** `artifacts/erp-dashboard/src/pages/EmployeeProfile.tsx`
**Issue:** Line 321 — all users can see salary

**Implementation:**

1. Create `RoleGate` component:
```typescript
// artifacts/erp-dashboard/src/components/RoleGate.tsx
import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';

type Role = 'ADMIN' | 'DIRECTOR' | 'HR_MANAGER' | 'HR_SPECIALIST' | string;

interface RoleGateProps {
  allow: Role[];
  fallback?: ReactNode;
  allowSelf?: { userId: number };  // Allow viewing own data
  children: ReactNode;
}

export function RoleGate({ allow, fallback = null, allowSelf, children }: RoleGateProps) {
  const { user } = useAuth();
  if (!user) return <>{fallback}</>;

  const hasRole = allow.includes(user.role);
  const isSelf = allowSelf && allowSelf.userId === user.id;

  if (hasRole || isSelf) return <>{children}</>;
  return <>{fallback}</>;
}
```

2. Wrap salary section in `EmployeeProfile.tsx`:
```typescript
// BEFORE (line 321):
<div>Salary: {employee.baseSalary}</div>

// AFTER:
<RoleGate
  allow={['HR_MANAGER', 'HR_SPECIALIST', 'DIRECTOR', 'SUPER_ADMIN']}
  allowSelf={{ userId: employee.userId }}
  fallback={<div>Salary: <span className="text-muted">●●●●●</span></div>}
>
  <div>Salary: {formatCurrency(employee.baseSalary)}</div>
</RoleGate>
```

3. Same pattern for:
   - Bank account numbers
   - Passport numbers
   - National ID
   - Termination date
   - Performance review scores

**Tests required:**

```typescript
// artifacts/erp-dashboard/src/components/__tests__/RoleGate.test.tsx
describe('RoleGate', () => {
  it('renders children when user role matches allow list', () => { /* ... */ });
  it('renders fallback when user role does not match', () => { /* ... */ });
  it('renders children when allowSelf matches user.id', () => { /* ... */ });
  it('renders fallback when no user is logged in', () => { /* ... */ });
});

// artifacts/erp-dashboard/src/pages/__tests__/EmployeeProfile.test.tsx
describe('EmployeeProfile salary masking', () => {
  it('shows salary to HR_MANAGER', () => { /* ... */ });
  it('shows salary to DIRECTOR', () => { /* ... */ });
  it('shows salary to self (own profile)', () => { /* ... */ });
  it('hides salary from regular employee viewing others profile', () => { /* ... */ });
  it('shows masked stars instead of salary number', () => { /* ... */ });
});
```

**Acceptance:**
- [ ] `RoleGate` component created with tests
- [ ] EmployeeProfile.tsx salary wrapped
- [ ] 5+ similar fields wrapped (bank, passport, etc.)
- [ ] 9 tests pass
- [ ] Manual verification: log in as OPERATOR → cannot see salary

**Time:** 2 hours

---

### Task 1.3 — OrgChart cycle detection

**File:** `apps/api/src/modules/org-structure/org-structure.service.ts`
**Issue:** Line 117 — `moveFunnelStage()` doesn't check for cycles

**Implementation:**

```typescript
// apps/api/src/modules/org-structure/application/services/cycle-detector.service.ts
import { Injectable } from '@nestjs/common';
import { Result, Ok, Err, AppErr } from '@common/result';

@Injectable()
export class CycleDetectorService {
  /**
   * Returns Err if moving nodeId under newParentId would create a cycle.
   * Algorithm: walk from newParentId up the ancestor chain;
   * if we hit nodeId, it's a cycle.
   */
  async wouldCreateCycle(
    nodeId: number,
    newParentId: number | null,
    getParent: (id: number) => Promise<number | null>,
  ): Promise<Result<boolean, AppError>> {
    if (newParentId === null) return Ok(false);  // moving to root, no cycle
    if (newParentId === nodeId) return Ok(true);  // self-parent

    const visited = new Set<number>();
    let current: number | null = newParentId;
    let depth = 0;
    const MAX_DEPTH = 100;  // safety against infinite loop in already-broken data

    while (current !== null) {
      if (depth++ > MAX_DEPTH) return Err(AppErr('INTERNAL', 'Org tree depth exceeded — data corruption'));
      if (visited.has(current)) return Err(AppErr('INTERNAL', 'Existing cycle detected in org tree'));
      if (current === nodeId) return Ok(true);  // would create cycle
      visited.add(current);

      try {
        current = await getParent(current);
      } catch (e) {
        return Err(AppErr('INTERNAL', `Failed to traverse org tree: ${String(e)}`));
      }
    }

    return Ok(false);
  }
}
```

Update `org-structure.service.ts`:
```typescript
async moveNode(nodeId: number, newParentId: number | null): Promise<Result<void, AppError>> {
  // CYCLE CHECK
  const cycleCheck = await this.cycleDetector.wouldCreateCycle(
    nodeId,
    newParentId,
    async (id) => {
      const node = await this.repo.findById(id);
      return node.ok ? node.data?.parentId ?? null : null;
    },
  );
  if (!cycleCheck.ok) return cycleCheck;
  if (cycleCheck.data) {
    return Err(AppErr('VALIDATION', 'Cannot move: would create circular hierarchy'));
  }

  // Safe to move
  return this.repo.update(nodeId, { parentId: newParentId });
}
```

**Tests required:**

```typescript
// apps/api/test/unit/org-structure/cycle-detector.service.spec.ts
describe('CycleDetectorService', () => {
  it('returns false when moving to root (null parent)', () => { /* ... */ });
  it('returns true when self-parenting (nodeId === newParentId)', () => { /* ... */ });
  it('returns true when newParent is descendant of node', () => { /* ... */ });
  it('returns false when newParent is unrelated branch', () => { /* ... */ });
  it('detects 3-node cycle: A→B→C→A', () => { /* ... */ });
  it('rejects move when depth exceeds 100 (corrupted data)', () => { /* ... */ });
  it('handles null parent in chain gracefully', () => { /* ... */ });
});

// apps/api/test/integration/org-structure/move-node.integration-spec.ts
describe('OrgStructure.moveNode (with real DB)', () => {
  it('rejects move that would create cycle', async () => {
    // Setup: A→B→C
    // Try: move A under C (cycle)
    // Expect: Err('VALIDATION', 'Cannot move: would create circular hierarchy')
  });
  it('allows valid move (B under D)', () => { /* ... */ });
  it('does not modify DB on rejected move', () => { /* ... */ });
});
```

**Acceptance:**
- [ ] `CycleDetectorService` exists
- [ ] `OrgStructureService.moveNode` uses cycle check
- [ ] 7 unit tests pass
- [ ] 3 integration tests pass
- [ ] Manual: try to move CEO under intern → rejected

**Time:** 2 hours

---

### Task 1.4 — Add Employee data loss fix (9 fields)

**Critical bug:** Form accepts 9 fields, DB doesn't store them.

**Step 1 — Migration:**

```sql
-- apps/api/src/shared/db/migrations/0013_add_employee_personal_fields.sql
-- Add 9 fields that frontend already sends but backend ignores

ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS shift VARCHAR(20),
  ADD COLUMN IF NOT EXISTS salary_type VARCHAR(20),
  ADD COLUMN IF NOT EXISTS workshop_zone VARCHAR(50),
  ADD COLUMN IF NOT EXISTS age INTEGER,
  ADD COLUMN IF NOT EXISTS children_count INTEGER,
  ADD COLUMN IF NOT EXISTS marital_status VARCHAR(20),
  ADD COLUMN IF NOT EXISTS housing_type VARCHAR(30),
  ADD COLUMN IF NOT EXISTS household_members INTEGER,
  ADD COLUMN IF NOT EXISTS attestation_date DATE,
  ADD COLUMN IF NOT EXISTS latitude NUMERIC(9, 6),
  ADD COLUMN IF NOT EXISTS longitude NUMERIC(9, 6);

-- Add CHECK constraints for enum-like fields
ALTER TABLE employees ADD CONSTRAINT employees_shift_check
  CHECK (shift IS NULL OR shift IN ('A', 'B', 'C', 'D', '1', '2', '3'));

ALTER TABLE employees ADD CONSTRAINT employees_salary_type_check
  CHECK (salary_type IS NULL OR salary_type IN ('fiks', 'soatbay', 'smenbay', 'baytulmal'));

ALTER TABLE employees ADD CONSTRAINT employees_marital_status_check
  CHECK (marital_status IS NULL OR marital_status IN ('single', 'married', 'divorced', 'widowed'));

ALTER TABLE employees ADD CONSTRAINT employees_housing_type_check
  CHECK (housing_type IS NULL OR housing_type IN ('own', 'rent', 'family', 'dormitory'));

ALTER TABLE employees ADD CONSTRAINT employees_lat_check CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90));
ALTER TABLE employees ADD CONSTRAINT employees_lng_check CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180));
ALTER TABLE employees ADD CONSTRAINT employees_age_check CHECK (age IS NULL OR (age >= 14 AND age <= 100));
ALTER TABLE employees ADD CONSTRAINT employees_children_check CHECK (children_count IS NULL OR (children_count >= 0 AND children_count <= 30));
```

**Step 2 — Update Drizzle schema:**

```typescript
// lib/db/src/schema/employees.ts (add to existing definition)
export const employees = pgTable('employees', {
  // ... existing 66 columns ...

  // NEW fields (Task 1.4):
  shift: varchar('shift', { length: 20 }),
  salaryType: varchar('salary_type', { length: 20 }),
  workshopZone: varchar('workshop_zone', { length: 50 }),
  age: integer('age'),
  childrenCount: integer('children_count'),
  maritalStatus: varchar('marital_status', { length: 20 }),
  housingType: varchar('housing_type', { length: 30 }),
  householdMembers: integer('household_members'),
  attestationDate: date('attestation_date'),
  latitude: numeric('latitude', { precision: 9, scale: 6 }),
  longitude: numeric('longitude', { precision: 9, scale: 6 }),
}, (table) => ({
  // ... existing indexes ...
}));
```

**Step 3 — Update adapter:**

```typescript
// apps/api/src/modules/compatibility/employees-payload.adapter.ts
// Around line 97-120: ADD these field mappings

export function adaptEmployeePayload(body: unknown): EmployeeInsertPayload {
  const data = body as Record<string, unknown>;
  return {
    // ... existing 20 mappings ...

    // NEW (Task 1.4):
    shift: data.shift as string | undefined,
    salaryType: data.salaryType as string | undefined,
    workshopZone: data.workshopZone as string | undefined,
    age: data.age != null ? Number(data.age) : undefined,
    childrenCount: data.childrenCount != null ? Number(data.childrenCount) : undefined,
    maritalStatus: data.maritalStatus as string | undefined,
    housingType: data.housingType as string | undefined,
    householdMembers: data.householdMembers != null ? Number(data.householdMembers) : undefined,
    attestationDate: data.attestationDate ? new Date(data.attestationDate as string) : undefined,
    latitude: data.latitude != null ? Number(data.latitude) : undefined,
    longitude: data.longitude != null ? Number(data.longitude) : undefined,
  };
}
```

**Step 4 — Fix hire date mismatch:**

```typescript
// artifacts/erp-dashboard/src/components/hr/employee-dialog/types.ts
// Line 21:
hireDate: z.string().min(1, 'Hire date is required'),  // ← required (was optional)
```

**Step 5 — Tests:**

```typescript
describe('Add Employee — data persistence', () => {
  it('persists shift field to DB', async () => {
    const payload = employeeFactory({ shift: 'A' });
    const result = await service.create(payload);
    const saved = await repo.findById(result.data.id);
    expect(saved.data.shift).toBe('A');
  });

  it('persists salaryType field to DB', async () => { /* ... */ });
  it('persists workshopZone field to DB', async () => { /* ... */ });
  it('persists childrenCount field to DB', async () => { /* ... */ });
  it('persists maritalStatus field to DB', async () => { /* ... */ });
  it('persists housingType field to DB', async () => { /* ... */ });
  it('persists householdMembers field to DB', async () => { /* ... */ });
  it('persists attestationDate field to DB', async () => { /* ... */ });
  it('persists latitude+longitude fields to DB', async () => { /* ... */ });
  it('rejects invalid shift value (CHECK constraint)', async () => { /* ... */ });
  it('rejects negative children count', async () => { /* ... */ });
  it('rejects age out of range (14-100)', async () => { /* ... */ });
});
```

**Acceptance:**
- [ ] Migration 0013 runs successfully
- [ ] 11 new columns exist in employees table
- [ ] CHECK constraints enforce valid values
- [ ] Adapter persists all 11 fields
- [ ] 12 tests pass (round-trip through API → DB → query)
- [ ] Hire date now required in form
- [ ] `node scripts/hr-audit.mjs` shows `addemployee-data-loss: passed`

**Time:** 8 hours

---

### Task 1.5 — PII encryption layer

**Files:** `lib/db/src/schema/employees.ts`, new `apps/api/src/shared/db/encryption.service.ts`

**Implementation:**

```sql
-- Migration 0014_enable_pgcrypto.sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

```typescript
// apps/api/src/shared/db/encryption.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Result, Ok, Err, AppErr } from '@common/result';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';

@Injectable()
export class EncryptionService {
  private readonly key: string;

  constructor(private readonly config: ConfigService) {
    this.key = config.getOrThrow<string>('PII_ENCRYPTION_KEY');
    if (this.key.length < 32) {
      throw new Error('PII_ENCRYPTION_KEY must be at least 32 characters');
    }
  }

  async encrypt(plaintext: string): Promise<string> {
    const result = await db.execute(sql`SELECT pgp_sym_encrypt(${plaintext}, ${this.key}) AS encrypted`);
    return (result.rows[0] as { encrypted: string }).encrypted;
  }

  async decrypt(encrypted: string): Promise<Result<string, AppError>> {
    try {
      const result = await db.execute(sql`SELECT pgp_sym_decrypt(${encrypted}::bytea, ${this.key}) AS plaintext`);
      return Ok((result.rows[0] as { plaintext: string }).plaintext);
    } catch (e) {
      return Err(AppErr('INTERNAL', 'Failed to decrypt PII'));
    }
  }

  /** Mask for display: show only last 4 chars */
  mask(value: string, visibleChars = 4): string {
    if (value.length <= visibleChars) return '●'.repeat(value.length);
    return '●'.repeat(value.length - visibleChars) + value.slice(-visibleChars);
  }
}
```

Update repository to encrypt/decrypt automatically:

```typescript
// apps/api/src/modules/hr/employees/drizzle-employees.repo.ts
async save(employee: EmployeeAggregate): Promise<Result<EmployeeAggregate, AppError>> {
  const encrypted = {
    ...employee.toPlainObject(),
    passportNumber: employee.passportNumber ? await this.encryption.encrypt(employee.passportNumber) : null,
    bankAccountNumber: employee.bankAccountNumber ? await this.encryption.encrypt(employee.bankAccountNumber) : null,
    nationalId: employee.nationalId ? await this.encryption.encrypt(employee.nationalId) : null,
  };
  // ... insert/update
}

async findById(id: number, decryptPii = false): Promise<Result<EmployeeAggregate, AppError>> {
  const row = await db.select().from(employees).where(eq(employees.id, id)).limit(1);
  if (!row[0]) return Err(AppErr('NOT_FOUND', 'Employee not found'));

  let passportNumber: string | null = null;
  let bankAccountNumber: string | null = null;
  let nationalId: string | null = null;

  if (decryptPii) {
    if (row[0].passportNumber) {
      const decrypted = await this.encryption.decrypt(row[0].passportNumber);
      if (decrypted.ok) passportNumber = decrypted.data;
    }
    // ... same for other PII fields
  } else {
    passportNumber = row[0].passportNumber ? this.encryption.mask(row[0].passportNumber, 4) : null;
    // ... etc
  }

  return Ok(EmployeeAggregate.fromPersistence({ ...row[0], passportNumber, bankAccountNumber, nationalId }));
}
```

**Migration to encrypt existing data:**

```typescript
// apps/api/src/shared/db/migrations/0015_encrypt_existing_pii.ts
// Run once after deploying encryption service
async function encryptExistingData(encryption: EncryptionService) {
  const allEmployees = await db.select({
    id: employees.id,
    passportNumber: employees.passportNumber,
    bankAccountNumber: employees.bankAccountNumber,
    nationalId: employees.nationalId,
  }).from(employees);

  for (const emp of allEmployees) {
    const updates: any = {};
    if (emp.passportNumber && !emp.passportNumber.startsWith('\\x')) {
      updates.passportNumber = await encryption.encrypt(emp.passportNumber);
    }
    // ... same for other fields
    if (Object.keys(updates).length > 0) {
      await db.update(employees).set(updates).where(eq(employees.id, emp.id));
    }
  }
}
```

**Tests:**

```typescript
describe('EncryptionService', () => {
  it('encrypts plaintext to non-readable bytea', async () => { /* ... */ });
  it('decrypts to original plaintext', async () => { /* ... */ });
  it('returns Err on wrong key', async () => { /* ... */ });
  it('masks shows only last 4 chars', () => { /* ... */ });
  it('mask handles short input gracefully', () => { /* ... */ });
});

describe('EmployeesRepo PII encryption', () => {
  it('saves encrypted PII (raw DB column is encrypted)', async () => { /* ... */ });
  it('returns masked PII by default (decryptPii=false)', async () => { /* ... */ });
  it('returns plaintext PII when decryptPii=true', async () => { /* ... */ });
});
```

**Acceptance:**
- [ ] `pgcrypto` extension enabled
- [ ] `EncryptionService` created with tests
- [ ] `PII_ENCRYPTION_KEY` env var documented in `.env.example`
- [ ] Repository encrypts on save, decrypts only when explicitly requested
- [ ] Migration 0015 encrypts existing rows
- [ ] 8 tests pass
- [ ] Manual: `SELECT passport_number FROM employees LIMIT 1` returns encrypted bytea

**Time:** 8 hours

### Phase 1 Acceptance Summary

- [ ] All 5 tasks complete
- [ ] All quality gates passed for each PR
- [ ] HR score: 64 → 75 (+11)
- [ ] `node scripts/hr-audit.mjs --fail` exits 0 for security checks
- [ ] Update `docs/hr-progress.md`: Phase 1 done

---

## PHASE 2 — Critical Business Logic (Week 2) {#phase-2}

**Duration:** 5 days (26 hours)
**Squad:** HR-B
**Goal:** Multi-tenancy + transactions + missing form fields; HR score 75 → 82

### Task 2.1 — Multi-tenancy migration (tenant_id)

**Tables to modify:** `employees`, `payroll_periods`, `salary_history`, `leave_requests`, `attendance`, `discipline_records`, `candidates`, `vacancies`, `aisha_conversations`, `aisha_tool_calls`

**Migration 0016:**
```sql
-- Add tenant_id to all HR tables
ALTER TABLE employees ADD COLUMN IF NOT EXISTS tenant_id INTEGER NOT NULL DEFAULT 1 REFERENCES tenants(id);
CREATE INDEX IF NOT EXISTS idx_employees_tenant ON employees(tenant_id);

-- (Same pattern for 9 other tables)

-- Drop default after backfill
-- ALTER TABLE employees ALTER COLUMN tenant_id DROP DEFAULT;
```

**TenantContext middleware:**
```typescript
// apps/api/src/shared/db/tenant-context.ts
import { AsyncLocalStorage } from 'async_hooks';

interface TenantContext {
  tenantId: number;
  userId: number;
  roles: string[];
}

const storage = new AsyncLocalStorage<TenantContext>();

export const tenantContext = {
  run: <T>(context: TenantContext, fn: () => T): T => storage.run(context, fn),
  get: (): TenantContext => {
    const ctx = storage.getStore();
    if (!ctx) throw new Error('Tenant context not initialized');
    return ctx;
  },
  getTenantId: (): number => tenantContext.get().tenantId,
};
```

**Drizzle middleware:**
```typescript
// Wrap every query to inject tenant_id
import { tenantContext } from '@shared/db/tenant-context';

export async function withTenantFilter<T>(query: SelectQueryBuilder<T>): SelectQueryBuilder<T> {
  return query.where(eq(table.tenantId, tenantContext.getTenantId()));
}
```

**Tests:**
```typescript
describe('Multi-tenant isolation', () => {
  it('tenant 1 user cannot see tenant 2 employees', async () => {
    await tenantContext.run({ tenantId: 1, userId: 1, roles: [] }, async () => {
      const employees = await repo.findAll();
      expect(employees.data.every(e => e.tenantId === 1)).toBe(true);
    });
  });

  it('saving employee auto-sets tenant_id from context', async () => { /* ... */ });
  it('migration backfilled all existing employees with tenant_id=1', async () => { /* ... */ });
  it('query without context throws error', async () => { /* ... */ });
});
```

**Time:** 8 hours

### Task 2.2 — Recruiter Kanban drag-drop (real implementation)

(Phase 5 covers this in detail. Skip here, go to Phase 5.)

### Task 2.3 — OrgChart mobile responsive

**File:** `OrgChartPage.tsx`

**Implementation:**
- Detect viewport width with `useMediaQuery`
- If `< 768px`, switch to accordion list view
- Otherwise, render canvas tree
- Add pinch-zoom for mobile (using `@use-gesture/react`)

```typescript
import { useMediaQuery } from '@/hooks/use-media-query';

export function OrgChartPage() {
  const isMobile = useMediaQuery('(max-width: 767px)');
  return isMobile ? <OrgListMobile data={tree} /> : <OrgTreeDesktop data={tree} />;
}
```

**Tests:**
```typescript
// E2E
test('renders tree on desktop viewport', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/org-structure/hierarchy');
  await expect(page.locator('[data-testid=org-tree-desktop]')).toBeVisible();
});

test('renders list on mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/org-structure/hierarchy');
  await expect(page.locator('[data-testid=org-list-mobile]')).toBeVisible();
});
```

**Time:** 4 hours

### Task 2.4 — Add Employee transactions

```typescript
// apps/api/src/modules/hr/application/commands/create-employee.handler.ts
async execute(command: CreateEmployeeCommand): Promise<Result<{ id: number }, AppError>> {
  return await db.transaction(async (tx) => {
    try {
      // 1. Insert employee
      const empResult = await this.employeesRepo.save(employee, tx);
      if (!empResult.ok) throw empResult.error;

      // 2. Create user account
      const userResult = await this.userService.createForEmployee(empResult.data, tx);
      if (!userResult.ok) throw userResult.error;

      // 3. Trigger welcome email (async, after commit)
      this.eventBus.publish(new EmployeeCreatedEvent(empResult.data.id));

      // 4. Audit log
      await this.auditService.log({
        action: 'employee.created',
        entityType: 'employee',
        entityId: empResult.data.id,
        userId: command.userId,
      }, tx);

      return Ok({ id: empResult.data.id });
    } catch (e) {
      // Transaction rolled back automatically
      return Err(AppErr('INTERNAL', `Failed to create employee: ${String(e)}`));
    }
  });
}
```

**Time:** 4 hours

### Task 2.5 — Add missing form fields (Manager, Salary)

**File:** `artifacts/erp-dashboard/src/components/EmployeeDialog.tsx`

Add:
- `ManagerSelect` autocomplete component (search by name)
- `BaseSalaryInput` with currency formatting and grade picker

**Time:** 4 hours

### Phase 2 Acceptance Summary

- [ ] All 5 tasks complete
- [ ] Multi-tenant isolation enforced
- [ ] OrgChart works on phone (320px+)
- [ ] Add Employee is transactional
- [ ] Form has Manager + Salary fields
- [ ] HR score: 75 → 82 (+7)

---

## PHASE 3 — Sidebar & Navigation Cleanup (Week 2) {#phase-3}

**Duration:** 1 day
**Squad:** HR-C
**Goal:** Remove 2 duplicates + decide on 6 hidden pages

### Task 3.1 — Remove sidebar duplicates

**File:** `artifacts/erp-dashboard/src/components/AppSidebar.tsx` (or wherever sidebar config lives)

Remove from sidebar:
- "Vorislik rejasi" duplicate → keep `/hr/succession`, remove `/hr/succession-planning` from menu
- "Ta'til va kasallik" duplicate → keep `/hr/vacation-sick`, remove `/hr/leave` from menu

**File:** `artifacts/erp-dashboard/src/routes/HRRoutes.tsx`

Add redirects:
```typescript
import { Redirect } from 'wouter';

export const HR_ROUTES: [string, React.ComponentType][] = [
  // ... existing routes ...
  ['/hr/succession-planning', () => <Redirect to="/hr/succession" />],
  ['/hr/leave', () => <Redirect to="/hr/vacation-sick" />],
  ['/hr/recruiting-kanban', () => <Redirect to="/hr/recruiting" />],
];
```

**Tests:**
```typescript
test('redirects /hr/succession-planning to /hr/succession', async ({ page }) => {
  await page.goto('/hr/succession-planning');
  await expect(page).toHaveURL('/hr/succession');
});
```

**Time:** 1 hour

### Task 3.2 — Decide fate of 6 hidden pages

For each of: SkillsMatrix, Mentorship, EventsCalendar, Applications, HRCapitalCourses, HRCapitalTests

Read the page, decide:
- **Keep & expose**: add to sidebar under appropriate category
- **Deprecate**: remove from routes, return 404 with note

Recommended:
- SkillsMatrix → add to "XODIM RIVOJLANISHI"
- Mentorship → add to "XODIM RIVOJLANISHI"
- EventsCalendar → add to "ISH JARAYONI"
- Applications → keep but document as legacy (might be obsoleted by Recruitment)
- HRCapitalCourses, HRCapitalTests → add to "TAHLIL VA AI" (training)

**Time:** 2 hours

### Task 3.3 — Sidebar i18n audit

Verify every sidebar item uses `t('nav.hr.<key>')`. Add missing keys to UZ + RU.

**Time:** 1 hour

### Phase 3 Acceptance

- [ ] 0 sidebar duplicates
- [ ] 0 hidden pages (all either visible or 404)
- [ ] All sidebar labels translated UZ + RU
- [ ] HR score: 82 → 84 (+2)

---

## PHASE 4 — Broken APIs Fix (Week 3) {#phase-4}

**Duration:** 5 days
**Squad:** HR-D
**Goal:** Fix 9 pages with broken APIs; HR score 84 → 87

### Tasks 4.1-4.9 — One PR per broken page

For each of the 9 broken pages, follow this protocol:

1. **Identify broken APIs** (from `docs/pages-audit-report.md`)
2. **Decide:**
   - (a) Implement the missing endpoint
   - (b) Update frontend to use existing endpoint
   - (c) Remove the feature if no longer needed
3. **Implementation**
4. **Tests** (unit + integration + E2E)
5. **Manual verification** (open page, click around, no console errors)

### Task 4.1 — `/hr/daily-reports` (4 broken APIs)

**Broken:**
- `GET /api/hr-v2/daily-reports/employee?employeeId=X&limit=14`
- `GET /api/hr-v2/daily-reports/stats?date=X`
- 2 more

**Implementation:**
- Implement all 4 endpoints in `hr-v2/daily-reports.controller.ts`
- Schema: `daily_reports` table
- Tests: 4 e2e + 4 integration

**Time:** 6 hours

### Task 4.2-4.9 (similar pattern for each remaining 8 pages)

(Detail each as Task 4.1 was detailed)

---

## PHASE 5 — Recruiter Kanban Complete Rewrite (Week 4) {#phase-5}

**Duration:** 5 days
**Squad:** HR-E
**Goal:** Real drag-drop + real-time + AI integration; Kanban 65 → 90

### Task 5.1 — Drag-drop with @dnd-kit

**File:** `artifacts/erp-dashboard/src/pages/RecruitingKanban.tsx`

```typescript
import { DndContext, DragEndEvent, DragOverlay, useSensors, useSensor, PointerSensor } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

export function RecruitingKanban() {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const [activeCandidate, setActiveCandidate] = useState<Candidate | null>(null);

  const updateStageMutation = useMutation({
    mutationFn: ({ candidateId, newStage }: MoveStageDto) =>
      apiRequest.patch(`/api/hr/recruitment/funnel/${candidateId}/move`, { newStage }),
    // Optimistic update
    onMutate: async ({ candidateId, newStage }) => {
      await queryClient.cancelQueries({ queryKey: ['/api/hr/recruitment/pipeline'] });
      const previous = queryClient.getQueryData(['/api/hr/recruitment/pipeline']);
      queryClient.setQueryData(['/api/hr/recruitment/pipeline'], (old: any) => {
        // Move card in cache immediately
        return { ...old, /* ... */ };
      });
      return { previous };
    },
    onError: (err, vars, context) => {
      queryClient.setQueryData(['/api/hr/recruitment/pipeline'], context?.previous);
      toast.error(t('hr.kanban.moveError'));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/hr/recruitment/pipeline'] });
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const candidateId = active.id as number;
    const newStage = over.id as string;

    // Optimistic mutation
    updateStageMutation.mutate({ candidateId, newStage });
    setActiveCandidate(null);
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={(e) => setActiveCandidate(findCandidate(e.active.id as number))}
      onDragEnd={handleDragEnd}
    >
      <div className="kanban-board">
        {STAGES.map(stage => (
          <KanbanColumn key={stage} stage={stage}>
            <SortableContext items={candidatesInStage(stage)} strategy={verticalListSortingStrategy}>
              {candidatesInStage(stage).map(candidate => (
                <CandidateCard key={candidate.id} candidate={candidate} />
              ))}
            </SortableContext>
          </KanbanColumn>
        ))}
      </div>
      <DragOverlay>
        {activeCandidate && <CandidateCard candidate={activeCandidate} isDragging />}
      </DragOverlay>
    </DndContext>
  );
}
```

**Time:** 6 hours

### Task 5.2 — Real-time WebSocket sync

Use Socket.io to broadcast stage changes:

```typescript
// Backend listener
@OnEvent('candidate.stage-changed')
async onCandidateStageChanged(event: CandidateStageChangedEvent) {
  this.io.to(`tenant-${event.tenantId}`).emit('candidate:moved', event);
}

// Frontend hook
useEffect(() => {
  socket.on('candidate:moved', (event) => {
    queryClient.invalidateQueries({ queryKey: ['/api/hr/recruitment/pipeline'] });
  });
}, []);
```

**Time:** 4 hours

### Task 5.3 — AI Interview integration

When candidate moves to TEST_SENT → automatically schedule AI interview via `aiInterviewService.schedule(candidateId)`.

**Time:** 4 hours

### Task 5.4 — Job offer PDF generation

When moving to OFFER_SENT → generate offer letter PDF via `pdfMake` and email to candidate.

**Time:** 6 hours

### Task 5.5 — Hire → Auto-create Employee

When moving to HIRED → trigger `CreateEmployeeFromCandidateHandler` which:
1. Reads candidate data
2. Creates employee record (transaction)
3. Creates user account
4. Sends welcome email
5. Triggers onboarding workflow

**Time:** 6 hours

### Task 5.6 — Funnel conversion analytics

Add "Conversion" panel showing % drop-off between each pair of adjacent stages.

**Time:** 4 hours

### Phase 5 Acceptance

- [ ] Drag-drop works smoothly (manual test with mouse)
- [ ] Real-time updates between 2 browser sessions
- [ ] AI interview auto-scheduled on TEST_SENT stage
- [ ] Offer letter PDF generated on OFFER_SENT
- [ ] Hire creates Employee record automatically
- [ ] Funnel analytics show conversion %
- [ ] 25 new tests pass (unit + integration + E2E)
- [ ] Kanban score: 65 → 90 (+25)

---

## PHASE 6 — OrgChart Production-Grade (Week 4) {#phase-6}

**Duration:** 4 days
**Squad:** HR-E

### Tasks
- 6.1 Search/filter (find person in tree)
- 6.2 Click person → navigate to profile
- 6.3 Drag-drop reassign (HR only)
- 6.4 Performance: O(n²) → O(n) with parent-child Map
- 6.5 Position Portret (CRUD for position profile)
- 6.6 Export improvements (HTML, vector PDF)

(Detail each as in previous phases)

**Phase 6 Acceptance:**
- OrgChart score: 60 → 90

---

## PHASE 7 — Sub-Module Completion (Weeks 5-6) {#phase-7}

**Duration:** 10 days
**Squad:** HR-E + HR-F

### Tasks
- 7.1 Offboarding (30 → 80)
- 7.2 PIP (35 → 80)
- 7.3 Onboarding (45 → 80) — buddy, documents, dashboards
- 7.4 Payroll closure workflow + GL posting
- 7.5 Leave balance accrual logic
- 7.6 Benefits administration module (new)
- 7.7 Performance review forms
- 7.8 Manager self-service dashboards
- 7.9 Compliance calendar
- 7.10 Salary bands + market data
- 7.11-7.15 Smaller fixes

**Phase 7 Acceptance:**
- All sub-modules ≥ 70%
- HR sub-module average: 58 → 78

---

## PHASE 8 — Testing & Polish (Weeks 7-8) {#phase-8}

**Duration:** 10 days
**Squad:** HR-F (QA focus)

### Tasks
- 8.1 Frontend E2E suite (25 specs — one per page)
- 8.2 Backend integration tests (Docker postgres) — 50 tests
- 8.3 Mutation testing (Stryker) — target 75% mutation score
- 8.4 Performance benchmarks (k6 load tests)
- 8.5 Visual regression (Storybook + Chromatic)
- 8.6 Accessibility audit (axe-core)
- 8.7 Bundle size optimization
- 8.8 Documentation update (per-page how-to)
- 8.9 Pilot launch checklist
- 8.10 Production deployment runbook

**Phase 8 Acceptance:**
- Frontend test coverage: 0% → 70%
- Backend test coverage: 50% → 85%
- Mutation score: ? → 75%
- HR final score: 92+/100 ✅

---

## AGENT PROMPTS (per role) {#agent-prompts}

### Code Reviewer Agent

```
You are the CODE REVIEWER for HR module PRs.

When called with a PR/commit SHA:
1. Run: git diff <base>..<head> --stat
2. For each changed file in HR scope:
   - Read in full
   - Compare against EuroPrint patterns (DDD, Result, Zod, i18n, RBAC)
   - Check task-specific acceptance criteria
3. Output:
   VERDICT: APPROVE | REJECT
   FILES_REVIEWED: N
   ISSUES_FOUND: M
   DETAIL:
     - file.ts:42 — [issue type] — [explanation] — [fix suggestion]

REJECT triggers (any):
- `any` type used
- console.log present
- expect(true) or it.skip
- Business logic in controller
- Service mixed with handler in application/commands/
- Hardcoded strings (non-whitelist)
- Files > 300 lines
- Functions > 50 lines
- Direct DB access from controller
- Missing tests for new logic
- Coverage decreased
- Missing tenant_id in new schema/query
- Missing @UseGuards on new controller
- Sensitive field (salary, passport) not wrapped in RoleGate

Be strict but constructive.
```

### Rule Enforcer Agent

```
You are the RULE ENFORCER for HR PRs.

Run these checks and report:

1. bash scripts/run-all-reviewers.sh
   - Captures 22 ARCHITECTURE_RULES status
2. pnpm --filter @europrint/api exec tsc --noEmit
3. pnpm --filter erp-dashboard run typecheck
4. pnpm --filter @europrint/api run lint
5. pnpm --filter erp-dashboard run lint
6. node scripts/hr-audit.mjs --fail   # HR-specific checks
7. node scripts/i18n-leak-detector.mjs

Output:
RULE ENFORCEMENT: PASS | FAIL
ARCHITECTURE_RULES: 22/22 PASS
HR_SPECIFIC: 10/10 PASS
TS errors: 0 (backend), 0 (frontend)
Lint: PASS
i18n leaks: 0

If ANY fails — return FAIL with specifics.
```

### Test Quality Auditor

```
You are the TEST QUALITY AUDITOR for HR PRs.

When new test files added/modified:
1. List new/modified .spec.ts files
2. For each, check:
   - it() name format: 'verb expected when condition'
   - 5+ meaningful assertions per test
   - No expect(true).toBe(true)
   - No it.skip / xit / test.todo
   - No console.log
   - No `any` type
   - Business logic NOT mocked (only I/O)
   - Factories used (apps/api/test/_fixtures/hr.factories.ts)
   - Happy + error path tested
3. Run: pnpm test:related <changed files>
4. Check coverage delta

Output:
TEST QUALITY: PASS | FAIL
FILES_AUDITED: N
QUALITY_SCORE: 0-100
ISSUES:
  - file.spec.ts:12 — [issue]
COVERAGE: +X% (lines), +Y% (branches)

Threshold:
- Quality < 70 → REJECT
- Coverage decreased → REJECT
```

---

## CODE TEMPLATES {#code-templates}

(Templates for repository, handler, controller, frontend page, hook, test — see Phase 1 tasks for examples)

---

## ACCEPTANCE CRITERIA (Final) {#acceptance}

All must be TRUE for HR module to be production-ready:

- [ ] All 8 phases complete
- [ ] 60+ PRs merged (one per task)
- [ ] All ARCHITECTURE_RULES PASS (22/22)
- [ ] All HR-specific audit checks PASS (10/10)
- [ ] Frontend test coverage ≥ 70%
- [ ] Backend test coverage ≥ 85%
- [ ] Mutation score ≥ 75% (Stryker)
- [ ] 0 endpoints without JwtAuthGuard
- [ ] 0 PII stored plaintext
- [ ] tenant_id on every HR table
- [ ] 0 sidebar duplicates
- [ ] 0 broken APIs in `docs/pages-audit-report.md`
- [ ] 0 stub endpoints (501)
- [ ] Recruiter Kanban: drag-drop + real-time + AI integration
- [ ] OrgChart: search + drag-reassign + mobile responsive + cycle detection
- [ ] Add Employee: all 30+ fields persisted, transactional, audit logged
- [ ] Employee Profile: salary masked for non-HR, self-service /my-profile exists
- [ ] All sub-modules ≥ 70%
- [ ] Director pilot test passed (10 real workflows)
- [ ] HR final score: 92+/100

---

## FINAL REPORT FORMAT {#final-report}

After all 8 phases, produce `docs/hr-final-report.md`:

```markdown
# HR Module — Final Production-Readiness Report

## Summary
- Start date: YYYY-MM-DD
- End date: YYYY-MM-DD
- Duration: X weeks
- PRs merged: NN
- Tests added: NN
- New backend LOC: NN
- New frontend LOC: NN

## Phase results
| Phase | Tasks | Days | Tests added | Score delta |
|------:|------:|-----:|------------:|------------:|
| 0 — Setup | 1 | 1 | 0 | 0 |
| 1 — Security | 5 | 5 | 30 | +11 |
| 2 — Business | 5 | 5 | 25 | +7 |
| 3 — Sidebar | 3 | 1 | 5 | +2 |
| 4 — Broken APIs | 9 | 5 | 35 | +3 |
| 5 — Kanban | 6 | 5 | 25 | +5 |
| 6 — OrgChart | 6 | 4 | 20 | +5 |
| 7 — Sub-modules | 15 | 10 | 80 | +6 |
| 8 — Testing | 10 | 10 | 100 | +5 |
| **JAMI** | **60** | **46** | **320** | **+44** |

## Score Progress
| Date | Overall | Security | Performance | Reliability | DDD |
|------|--------:|---------:|------------:|------------:|----:|
| Start | 64 | 86 | 60 | 25 | 64 |
| After P1 | 75 | 100 | 65 | 35 | 65 |
| After P2 | 82 | 100 | 75 | 75 | 75 |
| ...
| FINAL | 92 | 100 | 92 | 90 | 92 |

## Director Pilot Test
- 10 workflows tested
- 10/10 passed
- Average response time: Xms
- Cost per day: $X

## Known Issues (if any)
(list any deferred items with rationale)

## Recommendations for next quarter
- ...
```

---

## NOW BEGIN

1. **Request one-time permission** (Section 2)
2. **Execute Phase 0 setup** (1 day)
3. **Start Phase 1** with Task 1.1 (8 endpoints JwtAuthGuard) — easiest, quickest win
4. **Per each PR**: dispatch all 3 reviewer agents in parallel; merge only if all PASS
5. **Update `docs/hr-progress.md`** after every task
6. **Phase 8 final**: produce final report

**Do not stop** until all 60 tasks across 8 phases are merged and final acceptance criteria are met. This is an 8-week commitment. Plan accordingly.
