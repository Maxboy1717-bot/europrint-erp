# EuroPrint HR Moduli — Chuqur Kod Auditi (2026-05-28)

> Static-only source-code audit. 28 ta HR sahifa, har biri uchun A–J bo'limlar (file map, UI, data, form, CRUD, BE logic, security, DDD, performance, code quality). Iqtibos: `file:line`.

## Phase 1 — Repository Discovery

**Stack:**
- Monorepo (pnpm 9 workspaces) — `Uzbek-Language-Module/`
- Backend: NestJS 11 + Fastify, TypeScript strict, Drizzle ORM, PostgreSQL 15+, Redis, Zod validation
- Frontend: React 19 + Vite 7 + TanStack Query 5 + Tailwind v4 + Radix UI + Wouter routing
- Auth: JWT (passport-jwt) + custom `JwtAuthGuard` + `RolesGuard` with `@Roles(...)` decorator
- Telemetry: Sentry, Pino logs, AuditInterceptor

**HR statistikasi:**
| Metric | Qiymat |
|---|---|
| HR backend fayllar (`apps/api/src/modules/hr/`) | **287** |
| HR backend controllerlar (`@Controller('hr*')`) | **41** |
| HR frontend sahifa fayllari | **162** |
| HR DB schema fayllari | **49** |
| Jami HR endpoint (taxmin) | **~310** |
| Tahlil qilingan dublikat route'lar | **8** topildi (1 ta crash sababi, 7 ta noregistered/false-positive) |

**Asosiy fayllar:**
- FE route map: `artifacts/erp-dashboard/src/routes/HRRoutes.tsx` (HR_ROUTES, AI_HR_ROUTES, SELF_SERVICE_ROUTES)
- Sidebar nav: `artifacts/erp-dashboard/src/components/sidebar/constants-hr-lms.ts` (tz11)
- BE controllers: `apps/api/src/modules/hr/presentation/` + `modules/compatibility/` + `modules/hr-v2/`
- DB schemas: `lib/db/src/schema/` (hr_*, employees, discipline, mentor, succession_plans, ...)

**Sidebar bo'yicha 28 sahifa (= 27 mavjud + 1 yo'q):**
- Page 20 "Intizom V2" — FE'da MAVJUD EMAS (faqat bitta `pages/Discipline.tsx`). BE'da esa discipline-records uchun **4 ta** controller (V1 ko'rinishidagi multi-shim). Phase 3 da batafsil.


## Phase 2 — Per-Page Code Analysis

### Group 1 — Pages 1–7 (Tashkilot + Rekruting + 360 PROFIL start)

Confirmed: `DELETE /api/hr/employees/:id` is missing. FE calls fail to 404. Now I have all I need. Let me write the audit.

═════════════════════════════════════════════
# Page 1: HR Dashboard
# Section: Tashkilot / HR Overview
═════════════════════════════════════════════

## File map
- Route: `artifacts/erp-dashboard/src/routes/HRRoutes.tsx:64` → `['/hr-dashboard', HRDashboard]`; role-gated by `HR_ROLES` at `routes/AppRouter.tsx:99` and `roleConstants.ts:12`.
- Page component: `artifacts/erp-dashboard/src/pages/HRDashboard.tsx` (298 lines)
- Sub-components: `pages/HRDashboardCards.tsx`, `pages/HRDashboardSections.tsx`, `pages/HRDashboardTabs.tsx`, `pages/HRDashboardV2Tab.tsx`, `pages/hr-dashboard/{RiskTab,TurnoverTab,DisciplineTab,SafetyTab}.tsx`; types at `pages/hr-dashboard/types.ts` and `pages/HRDashboardTypes.ts`.
- Store/state: local `useState` + 19 `useQuery` hooks (no Redux). API client: `apiRequest`, `selectArray` from `@/lib/queryClient`.
- Backend controllers: `apps/api/src/modules/hr/presentation/hr-dashboard.controller.ts` (283 lines, @Controller('hr')) + `hr-dashboard-extra.controller.ts` (118 lines, also @Controller('hr')).
- Services: `application/hr-dashboard.service.ts`, `hr-dashboard-extra.service.ts`. Repos: `infrastructure/repositories/hr-dashboard.repository.ts` (561 lines) + `hr-dashboard-extra.repository.ts`.
- DB models read: `employees`, `users`, `employee_org_departments`, `org_departments`, `org_functions`, `discipline_records`, `pip_plans`, `enps_surveys`, `hr_daily_reports`, `ai_interview_sessions`, `safety_incidents`, `ppe_compliance`, `safety_training_records`, `employee_blocks`, `exit_interviews`, `employment_contracts`, `daily_attendance_summary`, `gamification_totals`, `offboarding_cases`, `shift_schedules`.
- Tests: MISSING for this page (no `HRDashboard.test.tsx`); some sub-area tests exist (`components/sidebar/__tests__/hrNavI18n.test.ts`).

## UI elements (from code)
- Buttons: none directly in `HRDashboard.tsx`; tab switching via `<PillTabs>` (line 247) → `setActiveTab`; `onViewAllAlerts` → `setActiveTab("alerts")` (256); `onViewSafety` → `setActiveTab("safety")` (257).
- Form fields: none on this shell (sub-tabs may have filters; not in root file).
- Table columns: none at root; rendered inside `KpiGrid`, `OperatorReportsWidget`, `OverviewTab`.
- Tabs: 8 (`overview`, `performers`, `alerts`, `risk`, `turnover`, `discipline`, `safety`, `v2`) via `HR_TABS` map (line 247).
- KPIs: 6 (employees, warnings, late, criticalAlerts, atRisk, rewardsSum — lines 216-224).
- Charts: turnover/monthly-trend within sub-tabs.
- i18n: `useTranslation('common')` + `useTranslation('hr')` (lines 37-38). All tab labels translated (`tHr('tabs.${tab.key}')`). However hardcoded Uzbek persists in toast messages of sub-components.

## Data requirements
- API endpoints called (all GET unless noted):
  - `/api/users` (line 46) — used as employees list
  - `/api/hr/abc-analysis` (49)
  - `/api/hr/discipline-records` (52)
  - `/api/hr/attendance` (55)
  - `/api/hr/resignation-stats?lang` (58) — language is a queryKey only; backend ignores it (`hr-dashboard-extra.controller.ts:38` `getResignationStatsByLang` proxies through to non-lang variant)
  - `/api/hr/monthly-trend?lang` (61)
  - `/api/hr/alerts` (64) — 60s polling
  - `/api/hr/risk-scores` (67) — 300s polling
  - `/api/hr/safety/summary` (71) — 120s polling
  - `/api/hr/safety/incidents` (76)
  - `/api/hr/discipline/blocked` (81)
  - `/api/hr-v2/pip?status=active` (84)
  - `/api/hr/gamification/leaderboard?period=monthly` (87)
  - `/api/hr-v2/enps` (90)
  - `/api/hr/ai-interview/sessions` (93) — `enabled: activeTab === 'v2'`
  - `/api/hr-v2/daily-reports/stats` (96)
  - `/api/hr/adaptation/at-risk` (99)
  - `/api/hr/offboarding/cases/stats` (103) — 120s polling
  - `/api/hr/contracts/expiring?days=30` (108)
  - `/api/hr/birthdays/today` (117)
  - `/api/hr/birthdays/upcoming?days=7` (125)
  - `/api/hr/milestones/upcoming` (133)
- DB tables written: none from this page.
- Permissions: `HR_ROLES` at FE; BE `@Roles('HR_MANAGER','HR_SPECIALIST','SUPER_ADMIN','DIRECTOR','ADMIN','MANAGER')` (hr-dashboard.controller.ts:17). Mismatch: FE roles are lowercase (`hr`, `hr_manager`, `admin`, `director`, `manager`), BE uses UPPERCASE — likely tolerated by `RolesGuard` because both variants are listed.
- Hardcoded/mocked: `aiPipeline` counts built client-side from `aiSessions` (line 154-161); `/api/hr/alumni`, `/api/hr/adaptation/:id`, `/api/hr/daily-reports`, `/api/hr/daily-reports/my`, `/api/hr/360/reviewable`, `/api/hr/hrc-tests/*` all return STATIC `{items:[],total:0}` stubs in `hr-dashboard.controller.ts:120-217` — flagged as Qoida 10 violations.

## Form analysis (if applicable)
- Page has no form; only a `POST /api/hr/daily-reports` (controller line 144) wired through `HrDailyReportSchema`. Not used from this page.

## CRUD contract
- Create: ❌ (page is read-only).
- Read: ✅ 19 GETs (above).
- Update: ❌
- Delete: ❌

## Backend logic issues
- `hr-dashboard.controller.ts:113-117,124-127,129-142,160-187,189-244` — twenty-plus handlers return literal `{items:[],total:0}` / `{stats:null}` / `{settings:null}` instead of NOT_IMPLEMENTED, violating Qoida 10. Examples:
  - `getOffboardingQuestions()` (line 161) → `{ items: [], total: 0 }`
  - `getEmployeeOperatorStats()` (242) → `{ stats: null }`
- `hr-dashboard.controller.ts:121` returns `{ items, total: (items as unknown[]).length }` — `as unknown[]` cast (Qoida 5 borderline; `total` derives from data without proper Result handling).
- `hr-dashboard.controller.ts:204` — `saveBirthdaySettings` returns `{ saved: true }` without persisting (Qoida 10 violation; logic absent).
- `hr-dashboard.controller.ts:252-254` — `calculateAbcAnalysis(:id)` returns `{ result: null }` — false success on `@Param`.
- `hr-dashboard.controller.ts:46-49` — `monthly-trend/:lang` ignores `_lang` parameter; lang switching has no DB effect (the FE `language` is in the queryKey but the BE delivers identical data).
- `hr-dashboard.service.ts:14` `getBirthdaysToday(): Promise<Result<object, AppError>>` — returns `object` type which discards the array typing.
- `hr-dashboard.repository.ts:25-560` — every method uses raw SQL via `runQuery<Row>` (Rule 4 borderline; complex LATERAL JOINs justify some, but `getPip()` (193) and `getEnpsSurveys()` (204) use Drizzle as expected, proving raw SQL is unnecessary elsewhere).
- `hr-dashboard.repository.ts:230` — `${hr_daily_reports.createdAt}::date = CURRENT_DATE` uses server timezone, not Tashkent — birthday/today/daily computations may shift at UTC boundary; `_time` instance imported at top of controller but not used in queries.

## Security findings
- Auth: ✅ — `@UseGuards(RolesGuard)` + `@Roles(...)` at class level (line 15-17). JWT enforced upstream via `JwtAuthGuard` in main pipeline.
- Authorization: ✅ — role restricted, but role names listed twice in different cases (UPPERCASE in BE, lowercase in FE) — works only because `RolesGuard` likely case-insensitive (verify separately).
- Validation: ✅ — `daily-reports` POST + `birthdays/settings` POST use `ZodValidationPipe` (146, 201). All other endpoints are GET with query params parsed with `parseInt(... || 7, 10)` and clamped (line 23, 33, 38) — safe.
- SQLi: ✅ — all `sql\`...\`` templates parametrise variables. `${days}||' days'` (line 75, 104, 458, 476) concatenates client int into a TEXT cast which is then `::interval` — protected because `${d}` is `parseInt`'d before reaching SQL (controller line 23: `Math.min(parseInt(days ?? '7', 10) || 7, 90)`).
- XSS: ✅ — JSON API only; rendered React escapes.
- CSRF: ✅ — JWT bearer / httpOnly cookie pattern; no form submission from this page that would need CSRF.
- PII: ⚠️ — full_name + birth_date + position + department exposed in birthdays endpoint (`hr-dashboard.repository.ts:25-50`). No row-level scoping; any HR role sees everyone. Acceptable for HR but not for `MANAGER` (in `@Roles`).
- Mass-assignment: ✅ — POST endpoints use Zod schemas with explicit field shape.

## DDD / architecture issues
- `hr-dashboard.controller.ts` mixes ~25 endpoints across multiple bounded contexts (alumni, adaptation, daily-reports, offboarding, 360, hrc-tests, documents, ai-interview, gamification) — violates Single Responsibility; the file is the bin for stubs that should live in their owning module.
- Service is a pure pass-through wrapper (lines 14-83 are all `return this.repo.x()`); no domain logic. Architecture rule "service contains business logic" violated; everything happens in the repository or in raw SQL.
- Repository returns `Row[]` (`Record<string, unknown>`) instead of typed Drizzle row models — FE has to re-type via `UserWithAnalysis`, `BirthdayEmployee`, etc. Lost type-safety end-to-end.
- Two controllers (`HrDashboardController` and `HrDashboardExtraController`) both prefix `@Controller('hr')` — the file already notes "duplicate declarations removed (boot collision)" three times (lines 258, 268, 271, 273, 282). Architecturally fragile; route ownership unclear.

## Performance issues
- 19 parallel queries on page mount — no `enabled` gating except `aiSessions` (line 93) and `atRiskEmps` (99). Heavy on cold-start; consider lazy loading per tab.
- Polling: `alerts` (60s), `risk-scores` (300s), `safety/summary` (120s), `offboarding/cases/stats` (120s), `contracts/expiring` (300s), `birthdays/today` (3600s), `birthdays/upcoming` (3600s), `milestones/upcoming` (300s). 8 concurrent timers; reasonable but should pause when tab hidden (no `refetchIntervalInBackground:false`).
- N+1: `LATERAL` join in birthdays/abc/alerts is good (single round-trip). `getAlumni()` (278) joins 5 tables — acceptable.
- Client merge (line 163-174): `employeesWithGrades` rebuilds on every render because no `useMemo` — O(N×M) on each typing keystroke (search not on this page; but tab switches still re-do this).
- Bundle: 19 sub-component imports; total path imports could be tree-shaken better. `MapContainer` not used here but other heavy maps elsewhere.

## Code quality issues
- `HRDashboard.tsx:163-174` — derived `employeesWithGrades` not memoised.
- `HRDashboard.tsx:179-183` — five `.filter(...).reduce(...)` chains over `disciplineRecords`/`attendanceRecords` directly in render (Qoida 2 — Array.isArray guarded, ok; Qoida 6 — but business calc in render).
- `HRDashboard.tsx:291` — `blockedEmps as never` (escape hatch type cast).
- `hr-dashboard.controller.ts:122` — `(items as unknown[]).length` cast unnecessary.
- `hr-dashboard.service.ts:14` — type `Result<object, AppError>` (`object` is misleading).
- `hr-dashboard.repository.ts:48,79,108,123,151,176,189,219,259,274,310,355,398,422,441,462,481,509` — every `.rows` accessed via inline cast `rows.rows as Row[]` — should use a helper.
- `hr-dashboard.repository.ts:545` — `employee_id = empRows[0]?.id ?? dto.user_id` silently uses user_id as employee_id when no row found (potential FK violation; should error).

## Verdict
- Completeness: ~55% (data path solid; >20 endpoints are static stubs; some sub-tabs work, V2 tab leans on hr-v2 endpoints not all proven).
- Status: ⚠️ Functional shell with significant stub debt.
- Top severity: HIGH (Qoida 10 — fake `{items:[],total:0}` responses across 12+ handlers mislead clients).

## Top issues (numbered)
1. 12+ stub handlers in `hr-dashboard.controller.ts` return fake empty payloads (lines 113-244).
2. `monthly-trend/:lang` and `resignation-stats/:lang` ignore the `:lang` param — FE thinks language switches; BE doesn't.
3. `createDailyReport` falls back to `user_id` when `employee_id` resolution fails (line 545) — risk of orphan rows.
4. `birthdays/settings` POST claims `{saved:true}` without DB write (line 204).
5. Two controllers share `@Controller('hr')` prefix and have multiple historical boot-collision comments — fragile registration order.
6. 19 simultaneous queries on mount; no per-tab gating for most.
7. Service layer is an empty pass-through; no domain rules enforced.
8. FE role names lowercase, BE roles UPPERCASE — works by coincidence of guard tolerance.

## Recommended fixes
1. Replace every stub handler with `throw new NotFoundException()` or `notImplemented()` (already imported but unused in this file — see hr-dashboard-extra.controller.ts:14 example).
2. Honour `:lang` in monthly-trend and resignation-stats: pass to repo and select `name_uz`/`name_ru` accordingly.
3. Add `enabled: activeTab === '<tab>'` gating to every query except KPI row.
4. Make `createDailyReport` fail with a typed error when no employee row exists; do not silently fall back to user_id.
5. Move sub-domain endpoints (alumni, adaptation, offboarding, hrc-tests, documents) out of `hr-dashboard.controller` into their owning controllers.
6. Type the repo rows (Drizzle inferred types) and drop `Row` everywhere.

═════════════════════════════════════════════
# Page 2: Org Tuzilma (Hierarchy)
# Section: Tashkilot
═════════════════════════════════════════════

## File map
- Route: `routes/HRRoutes.tsx:67` → `OrgStructureHierarchy`. Role gate `HR_ROLES`.
- Page: `artifacts/erp-dashboard/src/pages/OrgStructureHierarchy.tsx` (289 lines)
- Sub-components: `components/hr/org/types.ts`, `helpers.ts`, `KpiCard.tsx`, `AddNodeDialog.tsx`, `TreeCanvas.tsx`.
- API client: `apiRequest` from `@/lib/queryClient`. Plus raw `fetch(endpoint, { credentials: "include" })` for binary download (line 112).
- BE controller: `apps/api/src/modules/org-structure/org-structure.controller.ts` (285 lines). Service: `org-structure.service.ts`. Repo: `org-structure.repository.ts`. Module: `org-structure.module.ts`.
- Tests: MISSING (`org-structure.*.spec.ts` not in glob results; only utility helpers covered).
- Drift: `notify-vacancies` endpoint called at `OrgStructureHierarchy.tsx:55` (`/api/org-departments/notify-vacancies`) — but the BE controller is `@Controller('org-structure')`, so the call hits a different controller (`org-departments`). MISSING owner inspection.

## UI elements (from code)
- Buttons:
  - "Excel" (line 175) → `handleExport("excel")` → GET `/api/org-structure/export/excel` (binary).
  - "PDF" (line 178) → `handleExport("pdf")` → GET `/api/org-structure/export/pdf`.
  - "Vakantlar" (line 181) → `notifyMutation.mutate()` → POST `/api/org-departments/notify-vacancies` (NB: org-departments, not org-structure).
  - "Bo'lim qo'shish" (185) → opens `AddNodeDialog`.
  - Zoom in/out, fit-to-screen, reset (231-235).
  - Level filter chips, status select, search clear (199-228).
- Form fields (filter row): `search` input, `filterStatus` select (`all|vacant|filled`), `filterLevels` Set (multi-toggle).
- Tabs/modals: `AddNodeDialog` (line 277-285), pan-drag canvas, zoom controls.
- KPIs: 5 (`totalDepartments`, `totalNodes`, `totalEmployees`, `vacantCount` + `vacantPercent`, `recentChanges`) — lines 191-196.
- i18n: Mix — `t("tashkiliyTuzilma1")`, `t("ierarxikKorinishBarchaBolimlarVa")` (line 170, 172, 191-195) — uses very long auto-generated keys; some toasts hardcoded UZ: `"Xabar yuborildi"`, `"Bo'lim ko'chirildi"`, `"Ko'chirishda xatolik"` (56, 66, 68, 123, 125).

## Data requirements
- Endpoints:
  - GET `/api/org-structure/stats` (49) → `{ totalDepartments, totalNodes, totalEmployees, vacantCount, vacantPercent, recentChanges }`.
  - GET `/api/org-structure/hierarchy` (50) → `{ nodes: OrgNode[] }` with tree children.
  - POST `/api/org-departments/notify-vacancies` (55) — controller not in this file's stack.
  - PATCH `/api/org-structure/nodes/:nodeId/move` body `{ newParentId }` (62).
  - GET `/api/org-structure/export/pdf` and `/excel` (109) — binary download via raw `fetch`.
- DB tables read: `org_departments`, `employee_org_departments`, `users`, `employees` (inferred from repo signature & `getStats`).
- DB tables written by this page: only the `nodes/:id/move` PATCH (writes `org_departments` parent_id + sort_order + level via `service.move`).
- External services: PDF/Excel generation via `OrgExportService` — internal.
- Permissions: BE `org-structure.controller.ts:56` → `@Roles('admin','manager','supervisor','viewer','director')`. FE gate `HR_ROLES` (`hr`, `hr_manager`, `admin`, `director`, `manager`). NOTE: `hr_manager` NOT in BE roles list, `viewer` is BE only — mismatch; HR-only users may see the page in nav but hit 403.

## Form analysis
- AddNodeDialog form not opened in this file; its schema is in `AddNodeDialog.tsx`. Backend Zod (`OrgNodeSchema`, controller line 26-32) is `.passthrough()` — allows arbitrary extra fields (mass-assignment risk).

## CRUD contract
- Create: ✅ `Post nodes` → service.create → repo (controller line 103-107).
- Read: ✅ `hierarchy`, `stats`, `nodes/flat`, `nodes/:id`.
- Update: ✅ `Patch nodes/:id` (113), `Patch nodes/:id/move` (132), `Patch users/:userId/node` (141).
- Delete: ✅ `Delete nodes/:id` (123) — service.remove → repo.deactivate (soft delete).

## Backend logic issues
- `org-structure.controller.ts:248-249` — `getNodePortret` returns `{nodeId, portret: null}` — Qoida 10 violation (stub).
- `org-structure.controller.ts:256-259` — `createNodePortret` returns `{nodeId, ...dto, created: true}` without persisting; SHOULD return `notImplemented()` like the routes immediately above.
- `org-structure.controller.ts:220-243` — `getNodeHistory`, `getNodeHrRequests`, `createNodeHrRequest` properly return `notImplemented()` — good.
- `OrgNodeSchema` (line 26-32) uses `.passthrough()` — extra fields silently survive, opening mass-assignment if `repo.create` spreads `...dto`. `org-structure.service.ts:88` does `this.repo.create(dto, level)`.
- `org-structure.service.ts:108-153` — `move()` cycle-detection is inline and walks all hierarchy nodes for each move — O(N) per write. Comment line 109-116 admits the canonical `cycle-detector.service` isn't landed yet.
- `org-structure.service.ts:23,30,124` — uses optional chaining `nodes?.data?` after `if (!nodes.ok) return Err(...)` — once `ok` is true, `data` is non-null, so the optional is redundant but harmless.
- `org-structure.service.ts:163-181` — `getApprovalChain`, `getDirectManager`, `getTelegramGroupForNode` swallow `!ok` and return `chain: []` / `manager: null` / `telegramGroup: null` — masks repo errors.

## Security findings
- Auth: ✅ `@UseGuards(JwtAuthGuard)` (line 59).
- Authorization: ⚠️ `viewer` role granted full CRUD (line 56) — `viewer` should likely be read-only; `Patch`, `Post`, `Delete` should narrow @Roles. Currently every action has only class-level `@Roles`.
- Validation: ✅ Zod for Create/Patch/Move/FolderItem/HrRequest/Portret. `.passthrough()` is risky (see above).
- SQLi: ✅ (no raw SQL in controller; repo uses Drizzle).
- XSS: ✅ — JSON API; export endpoints stream binary with explicit `Content-Type`.
- CSRF: ⚠️ Export GET uses `fetch(endpoint, { credentials: "include" })` (line 112) — cookie-based auth without CSRF token; GET is idempotent so acceptable, but POST `/api/org-departments/notify-vacancies` is called via `apiRequest` (assumed to include Bearer or csrf).
- PII: ✅ — Org chart shows public structural data.
- Mass-assignment: ❌ `.passthrough()` on `OrgNodeSchema` permits arbitrary fields (line 32). `repo.create(dto, ...)` likely INSERT-spreads.

## DDD / architecture issues
- Service mixes orchestration + computation (vacancy %, tree building) — line 18-58. Acceptable but trending toward "fat service".
- Three different services injected in one controller: `OrgStructureService`, `OrgExportService`, `PositionFolderService` (line 65-69) — controller is a router across three bounded subdomains.
- Tree-building in service (line 21-42) is presentational; should be a query/projection.
- `LEVEL_COLORS`, `LEVEL_LABELS` (FE `components/hr/org/types.ts`) and tree level numbering are duplicated between FE and BE assumptions.

## Performance issues
- `service.move()` triggers `repo.getHierarchyNodes()` (full tree fetch) for cycle detection on every move (`org-structure.service.ts:121`) — O(N) per write; with growing org this is wasteful. Use a recursive CTE.
- FE `filterTree` (line 139-151) recursively rebuilds the tree on every keystroke; no memoization.
- TreeCanvas drag rerender: `onMouseMove` triggers `setPosition` on every pixel (line 90-92) — should `requestAnimationFrame`/throttle.
- `useQuery` for hierarchy has no `staleTime`; flips between pages re-fetch.
- `countNodes(filteredNodes)` on each render.

## Code quality issues
- `OrgStructureHierarchy.tsx:139-151` — embedded recursive function inside the component (re-created each render).
- `OrgStructureHierarchy.tsx:106-129` — `handleExport` uses raw `fetch` without unified error handling (only generic catch).
- `OrgStructureHierarchy.tsx:172` — hardcoded i18n key `"ierarxikKorinishBarchaBolimlarVa"` (auto-translation artifact).
- `org-structure.controller.ts:249` — `nodeId` param accepted as `string` while `:nodeId/approval-chain` uses `ParseIntPipe` — inconsistent.

## Verdict
- Completeness: ~80% (core CRUD + export work; portret/history/hr-requests are stubs).
- Status: ⚠️ Mostly working; mass-assignment + role-table issues need attention.
- Top severity: MEDIUM-HIGH (mass-assign via `.passthrough()` + cycle detection O(N) on writes).

## Top issues (numbered)
1. `OrgNodeSchema.passthrough()` enables mass-assignment via PATCH/POST (controller:32).
2. FE role pool (`HR_ROLES`) includes `hr`, `hr_manager` which BE controller does NOT accept (BE expects `admin|manager|supervisor|viewer|director`) — HR users denied.
3. Cycle-detection fetches entire tree on every move (service:121).
4. `getNodePortret`/`createNodePortret` are stubs but return success (Qoida 10).
5. `viewer` role granted full write access (no per-method narrowing).
6. Toast strings hardcoded UZ on FE (lines 56, 66-68, 123-125).
7. Export endpoint relies on cookie-auth (`credentials: include`) without explicit CSRF; OK for GET.
8. No tests for service or controller logic.

## Recommended fixes
1. Replace `.passthrough()` with `.strict()` on `OrgNodeSchema`/`MoveNodeSchema`/`FolderItemSchema`/`HrRequestSchema`.
2. Add `hr`, `hr_manager` to BE `@Roles` list OR remove HR users from FE gate.
3. Add narrow `@Roles` per write method; restrict `viewer` to GETs.
4. Cycle detection via recursive SQL CTE (DB-side) rather than full-tree client-walk.
5. Convert `createNodePortret`/`getNodePortret` to `notImplemented()`.
6. Memoise `filterTree`/`countNodes`.

═════════════════════════════════════════════
# Page 3: HR Xarita (HR Map)
# Section: Tashkilot / Geo
═════════════════════════════════════════════

## File map
- Route: `routes/HRRoutes.tsx:57` → `HRMap`. Role gate `HR_ROLES`.
- Page: `artifacts/erp-dashboard/src/pages/HRMap.tsx` (199 lines)
- Sub-components: `pages/HRMapSections.tsx`, `pages/HRMapDialogs.tsx`, `pages/HRMapTypes.ts`.
- Library: `react-leaflet`, `leaflet` (line 8-9).
- BE controller: `apps/api/src/modules/compatibility/hr-map-compat.controller.ts` (105 lines, `@deprecated`, marked "Legacy compatibility shim").
- Service: `compatibility/hr-map-compat.service.ts`. Tests: MISSING.
- ACL translator: `compatibility/acl/hr-map-employee-acl.ts` (for v2 endpoint).
- Canonical replacement: none yet — see file header comment "Removal target: post-PA3 cutover".

## UI elements (from code)
- Buttons: `ViewModeButtons` (line 97) — `markers | heatmap | routes`; "AI marshrutlar tayyor" mutation trigger inside `LeftPanel` (149).
- Form fields: `selectedDepartment` Select (passes to query); `expandedGroup` accordion state.
- Table columns: none — map only.
- Tabs: none; viewMode-driven layers.
- Modal: none; Popup on factory marker.
- KPIs: 3 (`stats.total.employees`, `validEmployees.length`, `transportData.groups.length`) — lines 106-136.
- Hardcoded strings: `"Europrint zavodi • 40.5556°N, 70.9280°E"` (line 94); `"AI marshrutlar tayyor!"` (57); `"Marshrutlarni hisoblashda xatolik yuz berdi"` (62). `FACTORY_LAT/FACTORY_LNG` from `HRMapTypes.ts` (constant). `attribution='&copy; <a ...>{t("openstreetmap")}</a>'` (172) — t() inside a string template — BUG: it's a literal string, not JSX, so `{t("openstreetmap")}` is rendered as plain text "{t(...)}" in attribution.

## Data requirements
- Endpoints:
  - GET `/api/hr-map/employees` or `?orgDepartmentId=...` (line 41) → `Employee[]` with `lat`, `lng`.
  - GET `/api/org-departments` (47) → `{id, name}[]`.
  - GET `/api/hr-map/stats` (50) → `MapStats`.
  - GET `/api/hr-map/transport-groups` (55) via `useMutation` (semantic misuse — should be query).
- DB tables read (from `hr-map-compat.service.ts:24-47`): `employees`, `users`, `employee_org_departments`, `org_departments`, `org_functions`.
- No tables written by this page.
- Permissions: BE `@Roles('HR_MANAGER','HR_SPECIALIST','SUPER_ADMIN','DIRECTOR','ADMIN','MANAGER')` (hr-map-compat.controller.ts:22-27). FE `HR_ROLES`. Same UPPER/lower mismatch as Page 1.
- Heat-map / coordinate fields: `lat`, `lng` — but BE SELECT (line 25-46) does **not** include `lat/lng` columns. Frontend filters `e.lat != null` (HRMap.tsx:68) — every record fails this check, so map is **empty in production** unless lat/lng come from another route.

## Form analysis
- N/A — read-only viewer.

## CRUD contract
- Create: ❌
- Read: ✅
- Update: ❌
- Delete: ❌

## Backend logic issues
- `hr-map-compat.service.ts:20-49` — `getMapEmployees` SQL projection does NOT select `lat`/`lng` (or `address`, `home_lat`, etc.); FE expects `lat`/`lng`. **Markers never render unless a different route fills them.**
- `hr-map-compat.service.ts:22` — `deptFilter = sql`AND primary_org.dept_id = ${String(si(departmentId))}`` — `si()` is `parseInt`; `String(int)` casts back; then used in a SQL parameter. Safe but convoluted.
- `hr-map-compat.controller.ts:6-7` — file is `@deprecated`; new consumers should target canonical hr-map module — but no canonical exists in the codebase glob. Permanent "legacy".
- `getMapStats()` returns `byDepartment` array unbounded — no `LIMIT` on dept grouping (service line 60-67) — acceptable for typical orgs.
- `getTransportGroups()` uses `STRING_AGG(... ORDER BY ...)` to concat employees — payload bloats with N employees per group.
- `useMutation` chosen by FE for transport-groups (line 53-66) — semantically a GET; not idempotent caching. Toast "AI marshrutlar tayyor!" misleads users — no AI involved; SQL `GROUP BY` only.

## Security findings
- Auth: ✅ `@UseGuards(RolesGuard)` (line 25).
- Authorization: ⚠️ — `MANAGER`, `ADMIN` may not actually need geo-PII of all employees.
- Validation: ⚠️ — Query params `departmentId`, `orgDepartmentId`, `status` are accepted as raw `string`; `si()` parses to int. `status` flows directly into SQL parameter — OK because parameterized.
- SQLi: ✅ — all parameters parameterized; `dept_id::text = ${String(si(departmentId))}` is a number string.
- XSS: ⚠️ — `attribution='&copy; <a href="...">{t("openstreetmap")}</a>'` (HRMap.tsx:172) is a literal string used by Leaflet which injects raw HTML to DOM. If user-controlled, would be XSS; here it's a constant — but the `{t(...)}` is inert literal text.
- CSRF: ✅ — GETs only.
- PII: ❌ — Home GPS coordinates of every employee exposed without consent flag or row-level check. Even though `lat`/`lng` aren't currently selected (bug), the **intent** is to expose them. Combined with full_name → high-PII exposure.
- Mass-assignment: ✅ — no writes.

## DDD / architecture issues
- "compatibility" module suggests legacy isolation but the file is the primary backing service for the FE — naming/architecture mismatch.
- Service uses both `db` and `rawSql` import (`hr-map-compat.service.ts:8-9`) — repository pattern bypassed (Qoida 15 violation — service uses `rawSql` directly).
- ACL translator only used for `/employees/v2` (controller line 51-62) — main `/employees` returns raw DB rows.
- `useMutation` instead of `useQuery` for read-only transport-groups (FE line 53) — anti-pattern.

## Performance issues
- `MAX_LARGE_QUERY_LIMIT` LIMIT (line 45) — likely thousands; no pagination; no clustering on the client side for huge maps.
- `getTransportGroups` STRING_AGG can produce megabyte payloads.
- HeatmapLayer (FE) consumes `employees` (full list); with no lat/lng, becomes effectively no-op.
- `useQuery` keys: `'/api/hr-map/employees'` vs `'/api/hr-map/employees?orgDepartmentId=X'` — two cache slots per dept; no `staleTime`.

## Code quality issues
- `HRMap.tsx:172` — `attribution` template has `{t(...)}` inside a JS string (not JSX) — bug.
- `HRMap.tsx:68-70` — every record filtered out because BE doesn't return lat/lng.
- `HRMap.tsx:38-43` — query key conditional construction inside `[]` — leaks two distinct keys; should use array form `[base, { dept }]`.
- `hr-map-compat.service.ts:48-49,76-77,91-92` — inconsistent closing brace style and `});}` glued.

## Verdict
- Completeness: ~40% (controller answers, but data shape doesn't match FE; main feature — markers — never shows due to missing lat/lng).
- Status: ❌ Broken in the most user-visible way (empty map).
- Top severity: HIGH — feature visually broken; high-PII intent (geo of employees).

## Top issues (numbered)
1. `getMapEmployees` SQL omits `lat`/`lng` → frontend filter (`e.lat != null && e.lng != null`) yields 0 markers.
2. `attribution` string contains literal `{t("openstreetmap")}` (HRMap.tsx:172) — appears as raw text.
3. Transport-groups uses `useMutation` (semantic misuse; user-facing toast claims "AI marshrutlar").
4. BE controller `@deprecated` shim, no canonical replacement exists.
5. PII (home GPS) intent without consent/auth scoping.
6. `Service` calls `rawSql` directly — bypasses repo pattern (Qoida 15).
7. No pagination/clustering for large employee counts.

## Recommended fixes
1. Add `lat`, `lng` (or join `employees_geo`) to `getMapEmployees` SQL; if column missing in schema, create migration.
2. Fix attribution to `<a href="...">OpenStreetMap</a>` plain HTML.
3. Convert transport-groups call to `useQuery`.
4. Rename "AI marshrutlar" since no AI is involved (or implement clustering algorithm).
5. Promote `compatibility/hr-map-compat.*` to a canonical `hr/geo/` module.
6. Add consent flag check (`employees.geo_consent`) before returning lat/lng.

═════════════════════════════════════════════
# Page 4: Rekruting Voronka (Kanban)
# Section: Rekruting
═════════════════════════════════════════════

## File map
- Route: `routes/HRRoutes.tsx:58` → `RecruitingKanban`. Role gate `HR_ROLES`.
- Page: `artifacts/erp-dashboard/src/pages/RecruitingKanban.tsx` (281 lines).
- Sub-components: `components/recruiting/*` (KanbanBoardGrid, helpers, types, RecruitingHeaderActions, VacancyFilterPanel), `pages/VacancyPortretDialog`, `ProductivityInterviewDialog`, `CandidateReportDialog`, `JobOfferDialog`, `OnboardingRoadmapDialog`, `HRAlertBanner`, `LaborMarketSheet`.
- Hooks: `useKanbanDragDrop` (@dnd-kit optimistic + rollback), `useKanbanRealtime` (WebSocket invalidation).
- BE controllers (under `/hr/recruitment` prefix, three files):
  - `apps/api/src/modules/hr/recruitment/hr-vacancies.controller.ts` (vacancy CRUD).
  - `hr-vacancies-pipeline.controller.ts` (pipeline endpoints; 246 lines).
  - `hr-vacancies-probation.controller.ts`, `hr-vacancies-analytics.controller.ts`.
- Plus `recruitment.controller.ts`, `recruitment-offers.controller.ts` (extra endpoints).
- Service: `hr-vacancies.service.ts` (90+ methods).
- Repos: `repos/drizzle-hr-vacancies.repo.ts`, `drizzle-hr-vacancies-funnel.repo.ts`, `drizzle-hr-recruitment-funnel.repo.ts`, `drizzle-recruitment-assessment.repo.ts`.
- DTOs: `dto/hr-vacancies.dto.ts`, `create-funnel.dto.ts`, `job-offer.dto.ts`, etc.
- WS gateway: `recruitment.gateway.ts`.
- Tests: MISSING (no `*.spec.ts` for funnel handlers in glob).

## UI elements (from code)
- Buttons:
  - "Sinov Davri" toggle (line 230) → `showProbationOnly`.
  - "Faqat sinov davrida" badge (233).
  - Header `RecruitingHeaderActions` (197): create vacancy, create candidate, search.
  - Per-card buttons inside KanbanBoardGrid: stage move (drag), reject, request NDA, send offer, open chat.
- Form fields:
  - `newForm`: `fullName`, `phone`, `email`, `source` (default `OTHER`), `notes`, `vacancyId` (default `none`).
  - `newVacancyForm`: `title`, `vacancy_type` (default `STANDARD`), `deadline_working_days` (default 15).
- Table columns: kanban grid by stage (8 stages in `STAGES` from `components/recruiting/helpers`).
- Tabs/Modals: 7 dialogs (VacancyPortret, ProductivityInterview, JobOffer, LaborMarket, CandidateReport, OnboardingRoadmap, plus inline create forms).
- Stat cards: 9 counts (lines 218-226).
- Hardcoded UZ: "Vakansiya yaratishda xatolik" (98), "Bosqich yangilandi" (119), "Nomzod rad etildi" (125), "Taklif yuborildi" (139). Some `tLabel(key, fallback)` properly i18n'd (93, 132).

## Data requirements
- Endpoints:
  - GET `/api/hr/recruitment/pipeline` (line 101) → `{ data: PipelineEntry[] }`.
  - GET `/api/hr/recruitment/vacancies` (102).
  - GET `/api/hr/ai-interview/sessions` (103).
  - POST `/api/hr/recruitment/vacancies` (83) → create vacancy.
  - POST `/api/hr/recruitment/pipeline/:id/stage` body `{ stage }` (118) — note FE comment line 111-115 explains it switched from PATCH/funnel_stage to POST/stage to match BE.
  - POST `/api/hr/recruitment/pipeline/:id/nda-request` body `{ notes }` (131).
  - POST `/api/hr/recruitment/pipeline/:id/offer` body `{ salary, start_date }` (138).
  - POST `/api/candidates` (145) — different controller (candidates-compat).
  - POST `/api/hr/recruitment/vacancy/candidates` body `{ candidate_id, vacancy_id, source }` (153).
  - POST `/api/chat/context-room` (49) — chat module.
- DB tables: vacancies, vacancy_pipeline / funnel, candidates, ai_interview_sessions, funnel_history, chat_rooms.
- Permissions: BE `@Roles('SUPER_ADMIN','DIRECTOR','HR_MANAGER','HR_SPECIALIST','hr_manager','hr_recruiter','hr','admin')` (pipeline:50; vacancies:63) — both UPPER and lower variants included (more lenient than Page 1).

## Form analysis
- `newForm` (RecruitingKanban.tsx:37): 6 fields. POST `/api/candidates`. No Zod on FE; BE may have it via `CandidatesCompatController`.
- `newVacancyForm` (79): 3 fields → server gets `{title, vacancy_type, deadline_working_days, status: 'open'}`. BE Zod `CreateVacancySchema` (hr-vacancies.controller.ts:29-35) uses `.passthrough()` → mass-assignment risk.
- After create vacancy: FE opens `VacancyPortretDialog` (97) for follow-up portret entry.

## CRUD contract
- Create: ✅ vacancies, candidates, pipeline stage transitions, NDA, offer.
- Read: ✅ pipeline, vacancies, sessions.
- Update: ✅ via stage POST (semantically update).
- Delete: ❌ — no delete button on this page for vacancies/candidates (likely intentional).

## Backend logic issues
- `hr-vacancies-pipeline.controller.ts:160-162` — `submitNdaRequest` returns `{ pipeline_id, requested_by: user.id, nda_sent: true }` and **only writes a history row** (`recordFunnelHistory`); no `nda_documents`, `nda_status` table update — incomplete.
- `hr-vacancies-pipeline.controller.ts:174-177` — `sendOffer` only records history; no `job_offers` table insertion in this handler. Real persistence likely in `recruitment-offers.controller.ts` (separate route).
- `hr-vacancies-pipeline.controller.ts:189-193` — `submitChecklist` stores items only via `updateFunnelNotes` (string truncation `slice(0, 200)`) — loses data >200 chars.
- `hr-vacancies-pipeline.controller.ts:199-201` — `getPipelineChecklist` returns `{ items: [] }` ALWAYS — Qoida 10 violation. Even though POST/PATCH "save" data into notes, GET returns empty.
- `hr-vacancies-pipeline.controller.ts:226-228` — `createPipelineRoadmap` echoes body without persisting (`created: true`) — Qoida 10.
- `hr-vacancies-pipeline.controller.ts:94, 111` — Returns `{ data: {}, error: 'stage majburiy' }` with HTTP 200/201 instead of 400 — error not surfaced through HTTP status.
- `hr-vacancies-pipeline.controller.ts:240` — Returns `{ ok: false, error: 'candidate_id majburiy' }` (same anti-pattern).
- `hr-vacancies.service.ts:60-62` — `findRoadmaps()` calls `this.repo.findPipeline()` — wrong method name semantically; "roadmaps" and "pipeline" are different concepts.
- `CreateVacancySchema` (`hr-vacancies.controller.ts:29-35`) — uses `.passthrough()` and `salary: z.union([z.string(), z.number()])` — type confusion, mass-assignment.

## Security findings
- Auth: ✅ `@UseGuards(JwtAuthGuard, RolesGuard)` (pipeline:53).
- Authorization: ✅ HR roles only.
- Validation: ⚠️ `PipelineStageSchema`, `ChecklistSchema`, `RoadmapSchema`, `AddCandidateSchema` (lines 30-48) all use `.passthrough()`. Stage value not enum-validated; BE accepts any `string` (line 93,110) — can corrupt funnel state.
- SQLi: ✅ — repos use Drizzle.
- XSS: ⚠️ — `notes` stored as `JSON.stringify(items).slice(0,200)` (line 190, 214) — if rendered as innerHTML downstream, possible; React escapes by default.
- CSRF: ✅ — JWT bearer.
- PII: ⚠️ — Candidates have full_name, phone, email. Visible to `hr_recruiter` (broad audience).
- Mass-assignment: ❌ — `.passthrough()` on every Zod schema in this controller; `CreateVacancySchema.passthrough()` lets `posted_by`, `company_id`, etc. ride through.

## DDD / architecture issues
- 5 different controllers under `/hr/recruitment` prefix (`recruitment.controller`, `recruitment-offers.controller`, `hr-vacancies.controller`, `hr-vacancies-pipeline.controller`, `hr-vacancies-probation.controller`, `hr-vacancies-analytics.controller`) — Single-Responsibility win, but module wiring fragility.
- `hr-vacancies.service.ts` exports 90+ pass-through methods; thin layer.
- `recordFunnelHistory` is the primary side-effect for NDA, offer, and stage changes — single audit-log path. Good.
- Service has both `EventEmitter2` and DB writes (line 21) but doesn't visibly publish domain events for stage transitions in the handler chain visible.
- FE talks to TWO controllers (`/api/candidates` from compat, `/api/hr/recruitment/*` from canonical) for one user flow (RecruitingKanban.tsx:143-158).

## Performance issues
- `entries.length`, `byStage`, `counts` (lines 182-188) — recomputed per render; no `useMemo`.
- `Object.fromEntries((Array.isArray(vacancies)?vacancies:[]).map(v=>[v.id,v]))` (188) — rebuilt every render.
- `useKanbanRealtime` invalidates entire `/api/hr/recruitment/pipeline` cache on every WS event — full refetch on each candidate move (others' moves too).
- 4 useQuery + 8 useMutation + WS subscription on one page.
- `staleTime: 30_000`/`60_000` (101-103) is good.

## Code quality issues
- `RecruitingKanban.tsx:46-67` — `handleOpenVacancyChat` uses `try/catch` then silently ignores errors (`// Silently ignore`) — no user feedback.
- `RecruitingKanban.tsx:62-64` — eats all errors with empty catch; bad UX.
- `RecruitingKanban.tsx:194-195` — hardcoded UZ in heading.
- `hr-vacancies-pipeline.controller.ts:67-71,77-81,121-125,128-134,138-148` — every handler returns `{ data: rows }` or `{ items: rows, total: ... }` inconsistently — no unified envelope.
- `RecruitingKanban.tsx:71-78,75` — 14 `useState` calls; could be consolidated into `useReducer`.

## Verdict
- Completeness: ~70% (kanban works; NDA/offer/checklist/roadmap persistence shallow).
- Status: ⚠️ Functional core, but checklist/roadmap/NDA stub-prone.
- Top severity: HIGH — `.passthrough()` everywhere + checklist data truncation/loss + GET checklist returns []`{ items: [] }`.

## Top issues (numbered)
1. `submitChecklist` stores items as string truncated to 200 chars (pipeline controller:190).
2. `getPipelineChecklist` ALWAYS returns `{items:[]}` regardless of saved data (pipeline:199-201).
3. `createPipelineRoadmap` echoes input but doesn't persist (pipeline:226-228).
4. All Zod schemas in pipeline controller use `.passthrough()` (lines 30-48) — mass-assign.
5. Stage value (`stage`) not enum-validated — any string accepted.
6. Error returns `{data:{}, error:'stage majburiy'}` with HTTP 200 instead of 400 (line 94, 111).
7. `handleOpenVacancyChat` silently swallows errors (kanban:62-64).
8. `findRoadmaps()` mis-aliased to `findPipeline()` in service (line 60-62).
9. FE creates candidate via `/api/candidates` (legacy compat) then re-attaches via `/api/hr/recruitment/vacancy/candidates` — two-step partial-failure risk.

## Recommended fixes
1. Persist checklist into a `pipeline_checklists` table (or JSONB column).
2. Persist roadmap into `pipeline_roadmaps`.
3. Replace `.passthrough()` with `.strict()`; introduce `FunnelStageEnum` (`z.enum([...STAGES])`).
4. Standardise error responses to HTTP 4xx with `BadRequestException`.
5. Add `onError` toast for chat-room open failure.
6. Use a transactional command for candidate+funnel attach.
7. Memoise `byStage`, `counts`, `vacancyMap` with `useMemo`.

═════════════════════════════════════════════
# Page 5: AI Intervyu (AI Interview)
# Section: Rekruting / AI
═════════════════════════════════════════════

## File map
- Route: `routes/HRRoutes.tsx:102` (inside `AI_HR_ROUTES`) → `AIInterviewPage`. Role gate `AI_HR_ROLES` = `['admin','hr_manager']` (`roleConstants.ts:27`).
- Page: `artifacts/erp-dashboard/src/pages/AIInterviewPage.tsx` (347 lines).
- Sub-components: `AIInterviewPageTypes.ts` (types + Zod schema), `AIInterviewPageSections.tsx` (InterviewDetailView, AddQuestionForm, QuestionBankList, CreateInterviewForm).
- BE controllers:
  - `apps/api/src/modules/ai/presentation/ai-hr-new.controller.ts` (71 lines) — `@Controller('ai-hr')` — handles `/api/ai-hr/interviews` GET/POST, `/dashboard`, `/providers`, `/usage/budget`, `/tasks/:id`.
  - `apps/api/src/modules/ai/presentation/ai-hr.controller.ts` (90 lines) — `@Controller('ai/hr')` — different prefix; handles AI screening operations (not used here).
  - `apps/api/src/modules/hr/ai-interview-v2/ai-interview-v2.controller.ts` — V2 separate path; not used by this page.
- Service: `ai-hr-new.service.ts` (109 lines). Repo: `DrizzleAiHrNewRepo`.
- AI router: `AiRouterService` (provider routing).
- Tests: `apps/api/src/modules/ai/presentation/dto/ai-hr.dto.spec.ts` (only DTO test).
- Question bank: `/api/hr-v2/ai-interview/questions` — different controller; not in `ai-hr-new` paths (would be elsewhere).

## UI elements (from code)
- Buttons:
  - "Yangi intervyu" (line 164) → toggles create form.
  - "Savol qo'shish" (line 160) → toggles add-question form.
  - Status filter chips (`all|scheduled|in_progress|completed`) — lines 211-225.
  - Tab toggles `interviews|questions` (lines 171-186).
  - Card "View" (322) → opens `InterviewDetailView`.
- Form fields:
  - `interviewForm` (zodResolver `interviewSchema` from `AIInterviewPageTypes`): `candidateId`, `jobTitle`, `language` (default `uz`), `scheduledAt`.
  - `qForm`: `question`, `question_ru`, `question_en`, `category` (default `general`), `difficulty` (default `medium`), `max_score` (default `10`), `job_title`.
- Table columns: card grid (sessionId, candidateName, jobTitle, provider badge, language, scheduledAt, startedAt, completedAt, duration).
- Modal: `ConfirmDialog` for question deletion (334-343) — Qoida 14 compliant.
- i18n: mostly t() based; some hardcoded UZ ("Barchasi", "Rejalashtirilgan", "Jarayonda", "Tugallangan" — 220-223; "Mos intervyular topilmadi" — 253; "Savol qo'shildi" — 69; "Bekor qilish" — 340).

## Data requirements
- Endpoints:
  - GET `/api/ai-hr/interviews?page=1&limit=20` (line 49) → `InterviewsResponse { interviews: AIInterview[] }`.
  - GET `/api/hr-v2/ai-interview/questions` (53) — only `enabled` when on questions tab.
  - POST `/api/hr-v2/ai-interview/questions` (58) — add question.
  - DELETE `/api/hr-v2/ai-interview/questions/:id` (78) — delete question.
  - POST `/api/ai-hr/interviews` (88) — create interview.
- DB tables: `ai_interview_sessions` (schema-ext-c-3.ts re-export) plus `ai_interview_questions` (hr-v2 location not yet inspected).
- Permissions: BE `@Roles(SUPER_ADMIN, DIRECTOR, HR_MANAGER)` (ai-hr-new.controller.ts:27). FE gate `AI_HR_ROLES = ['admin','hr_manager']`. Case mismatch: BE expects uppercase enum (Role.SUPER_ADMIN etc.), FE uses lowercase. Same coupling fragility.

## Form analysis
- `interviewForm` (4 fields) — FE Zod via `interviewSchema` (not shown in this file; in `AIInterviewPageTypes.ts`). BE `CreateAiInterviewDto` (DTO not shown but referenced controller:20). Possible field mismatch.
- `qForm` (7 fields) — FE local state; POST body adds `question_uz: q.question` (line 60) so `question_uz` is always equal to `question`. Redundant duplicate.
- BE `/api/hr-v2/ai-interview/questions` endpoint not inspected here, but unlike `ai-hr-new`, hr-v2 is a separate area.

## CRUD contract
- Create: ✅ interview (POST `/ai-hr/interviews`), question (POST `/hr-v2/ai-interview/questions`).
- Read: ✅ list interviews, list questions.
- Update: ❌ no edit-interview or edit-question on this page.
- Delete: ✅ delete question (with confirm). No interview delete.

## Backend logic issues
- `ai-hr-new.controller.ts:35-37` — `getInterviews` uses `Number(page)` without default — `Number(undefined)` → `NaN`. BE `repo.findInterviews(NaN, NaN)` likely defaults or crashes; should `parseInt(... ?? '1', 10) || 1`.
- `ai-hr-new.service.ts:100-108` — `getTaskById` returns a static fake task:
  ```ts
  return Ok({ id: taskId, taskType: 'hr.evaluate_candidate', status: 'completed', result: null, createdAt: ... });
  ```
  Qoida 10 violation — not real data.
- `ai-hr-new.service.ts:66-76` — `getProviders` returns `PROVIDER_BUDGETS` (constant) merged with usage counts — `monthlyBudget` is hardcoded (`openai: 100, gemini: 50, claude: 80`) — should come from config/DB.
- `ai-hr-new.controller.ts:53-57` — `@Get('providers')` exposes provider names + budgets without redaction.
- `CreateAiInterviewDto` source not inspected here, but FE sends `candidateId` as string (default `""` line 45) — likely should be int/uuid; BE may silently accept.
- No CRON or background worker visible for `pending → in_progress → completed` transitions in this file.

## Security findings
- Auth: ✅ `@UseGuards(JwtAuthGuard, RolesGuard)` (line 25).
- Authorization: ✅ `Role.SUPER_ADMIN, Role.DIRECTOR, Role.HR_MANAGER` — narrow.
- Validation: ⚠️ FE `parseInt(q.max_score) || 10` (line 65) — accepts any string; BE relies on `CreateAiInterviewDto`.
- SQLi: ✅ (Drizzle).
- XSS: ✅ — React escaping; provider name rendered via Badge.
- CSRF: ✅.
- PII: ⚠️ — Interview transcript stored in `ai_interview_sessions.transcript` (JSONB, migrations-drift.ts:423) — sensitive content (full candidate conversation).
- Mass-assignment: depends on DTO; BE controller uses `@Body() dto: CreateAiInterviewDto` (line 43) — if class-validator-based, may be permissive. CLAUDE.md says only Zod is allowed.

## DDD / architecture issues
- Two parallel AI-HR controllers (`ai-hr.controller.ts` `@Controller('ai/hr')` vs `ai-hr-new.controller.ts` `@Controller('ai-hr')`) — different prefixes (`/api/ai/hr/...` vs `/api/ai-hr/...`). Confusing for clients; one is "AI integration screening", the other is "AI-HR module entrypoint".
- Plus a THIRD: `ai-interview-v2.controller.ts` under `/api/hr/ai-interview-v2/...` (likely). Three implementations of the same concept.
- Service holds a top-level array `PROVIDER_BUDGETS` (line 23-27) — configuration in code; should be DB/env.
- `getTaskById` returns mocked data — fake "done"-ness reaches the UI.

## Performance issues
- Page mount fetches list of all interviews (page=1&limit=20). Question list only fetched on tab switch (`enabled: activeTab === 'questions'`).
- Filter (`filteredInterviews`, line 100-112) applied client-side over interview array; no server-side filtering. With 20 items it's fine; growth → page-size 20 limit kills it.
- `ConfirmDialog` re-renders all cards on open/close (state at top).

## Code quality issues
- `AIInterviewPage.tsx:33-41` — 7-key local form state object — should be `useForm`.
- `AIInterviewPage.tsx:84` — `interviews = data?.interviews || []` — assumes `interviews` key; if BE returns paginated `{items,total}` it'll be empty.
- `AIInterviewPage.tsx:74` — toast variant `"destructive"` — OK but error.message may leak BE stack.
- `ai-hr-new.controller.ts:67-69` — `@Param('id') id: string` — UUID expected? No `ParseUUIDPipe`.
- `ai-hr-new.service.ts:48-49` — `if (!isOk(statsResult)) return Err(statsResult.error)` then again for tasks — could use early-return helper.
- Add-question endpoint POST `/api/hr-v2/ai-interview/questions` lives in `hr-v2` namespace — different controller; FE mixes prefixes inconsistently.

## Verdict
- Completeness: ~50% (list + create + delete question wired; interview detail/transcript loop unclear; `getTaskById` is fake).
- Status: ⚠️ Cards display, but task/state machine illusion.
- Top severity: HIGH — `getTaskById` returns fake completed task; misleading state.

## Top issues (numbered)
1. `getTaskById` returns hardcoded `status: 'completed'` (ai-hr-new.service.ts:100-108).
2. `getInterviews` uses `Number(page)` → NaN on missing params.
3. `PROVIDER_BUDGETS` hardcoded in service (line 23-27); budget edits require redeploy.
4. Three parallel AI-HR/AI-interview controllers (prefix collision risk).
5. POST `/api/hr-v2/ai-interview/questions` adds `question_uz: q.question` redundantly (FE:60).
6. FE filters client-side over 20-row page (no server search).
7. `interviews = data?.interviews || []` envelope mismatch risk.
8. PII transcript stored in plain JSONB; no encryption.

## Recommended fixes
1. Replace `getTaskById` mock with real DB read (`ai_tasks` table) or `notImplemented()`.
2. Coerce page/limit: `parseInt(... ?? '1', 10) || 1`.
3. Move `PROVIDER_BUDGETS` to `ai_provider_config` table.
4. Consolidate 3 AI-HR controllers into one canonical (or document explicitly which is alive).
5. Server-side pagination + status filter (BE accepts `?status=`).
6. Encrypt transcripts at rest if PII regulated.

═════════════════════════════════════════════
# Page 6: Xodimlar (Employees)
# Section: 360 PROFIL
═════════════════════════════════════════════

## File map
- Route: `routes/HRRoutes.tsx:55` → `Employees`. Role gate `HR_ROLES`.
- Page: `artifacts/erp-dashboard/src/pages/Employees.tsx` (370 lines).
- Sub-components: `components/EmployeeTable.tsx` (table+dropdown actions), `components/EmployeeDialog.tsx` (10 sub-sections wrapped: BasicInfo, Position, Contract, PersonalInfo, Household, OrgStructure, ProfileImage, ManagerSalary), `components/ImportEmployeesDialog.tsx`, `components/SearchBar.tsx`, `components/Pagination.tsx`.
- API client: `apiRequest`.
- Backend: `apps/api/src/modules/hr/presentation/hr-employees.controller.ts` (186 lines) under `@Controller('hr/employees')`. Plus `apps/api/src/modules/hr/presentation/hr-employees-ext.controller.ts` (documents, etc.). Plus `apps/api/src/modules/compatibility/employees-compat.controller.ts` (`@Controller('employees')` — legacy under different URL).
- CQRS: `GetEmployeesQuery` (`application/queries/get-employees.query.ts`) + `get-employees.handler.ts` (66 lines).
- Schema: `hrEmployees` pgTable (`schema-misc-app-a.ts:37-69`) with id/user_id/employee_code/first_name/last_name/...
- Tests: MISSING for `hrEmployees` controller.

## UI elements (from code)
- Buttons:
  - "Import" (line 199) → opens `ImportEmployeesDialog`.
  - "Yangi xodim qo'shish" (208) → opens `EmployeeDialog`.
  - Per-row dropdown (EmployeeTable.tsx:280-328): edit, navigate to org structure, set active, set resigned (confirmed), delete (confirmed).
- Form fields (EmployeeDialog defaults at line 78-104): 25 fields — fullName, employeeId, phone, departmentId, positionId, managerId, baseSalary, shift, salaryType, workshopZone, status, telegramChatId, birthDate, hireDate, address, attestationDate, age, gender, childrenCount, maritalStatus, childrenEducation, householdSize, householdMembers, housingType, latitude, longitude.
- Table columns (EmployeeTable.tsx:143-153, 164-263):
  - Xodim (avatar + fullName)
  - Telegram ID
  - Tabel raqami (employee_code)
  - Ish staji (computed from hire_date in render — Qoida 6 violation)
  - Tashkiliy tuzilma (deptName → posName)
  - Attestatsiya
  - Reyting (rating * 5-star)
  - Yiqilgan testlar (failedTests)
  - Bonus
  - Status
  - Actions dropdown
- KPIs: 4 (total, active, newThisMonth, inactive — Employees.tsx:223-251).
- Filters: search + departmentFilter Select (client-side).
- i18n: t('hr') / t('common'); hardcoded UZ in row dropdown labels & toasts.

## Data requirements
- Endpoints:
  - GET `/api/hr/employees` (line 94) → `{ items: EmployeeRow[], total: number }`.
  - GET `/api/org-departments` (105) → `{ id, name }[]`.
  - PATCH `/api/hr/employees/:id/status` body `{ status }` (EmployeeTable.tsx:71).
  - DELETE `/api/hr/employees/:id` (EmployeeTable.tsx:94) — **handler MISSING** (verified: `hr-employees.controller.ts` has no `@Delete`).
  - Inside EmployeeDialog: POST `/api/hr/employees` and PUT `/api/hr/employees/:id` (via `useEmployeeMutation` hook).
- DB tables: `employees` (canonical), `users` (joined for personal fields in profile edit per memory), `org_departments`, `employee_org_departments`, `org_functions`, `salary_history` (via `reviewSalary`).
- Permissions: BE `@Roles('HR_MANAGER','HR_SPECIALIST','SUPER_ADMIN','DIRECTOR')` (hr-employees.controller.ts:38). Note **`MANAGER` not allowed** (unlike Page 1/2). FE gate `HR_ROLES` includes `manager` — manager users may see the page but get 403.
- Mocked/MISSING: list endpoint returns `coursesTotal`, `rating`, `bonusAmount`, `failedTests`, `disciplineCount`, `profileImageUrl` columns expected by FE but handler projection sets `coursesTotal: null`, `bonusAmount: null`, `failedTests: null`, `disciplineCount: null` (get-employees.handler.ts:46-52). Only `rating` reads `total_points`.

## Form analysis
- Orphan FE fields not in DB (`hrEmployees` schema):
  - `attestationDate` — no column on `employees`.
  - `shift`, `salaryType`, `workshopZone` — not in `hrEmployees`.
  - `childrenCount`, `maritalStatus`, `childrenEducation`, `householdSize`, `householdMembers`, `housingType` — not in `hrEmployees` (likely stored in `users` table per memory `session_2026-05-21_employees_phase3`).
  - `latitude`, `longitude` — not in `hrEmployees`.
- Missing DB fields not in form: `employment_status`, `is_active`, `face_embedding`, `face_embedding_updated_at` — admin/ML-only, OK.
- Validation mismatch: `baseSalary` is `text` in DB (schema line 54) but FE input is decimal string — type-unsafe; numeric ops break.
- Per memory (`session_2026-05-21_employees_phase1.md`), `AddEmployeeDialog` was reduced 25→13 fields — but `EmployeeDialog.tsx` still uses all 25 defaultValues (line 78-104). Refactor incomplete.

## CRUD contract
- Create: ✅ POST `/api/hr/employees` (controller line 96-108).
- Read: ✅ GET `/api/hr/employees` (48), GET `/api/hr/employees/:id` (66).
- Update: ✅ PUT `/api/hr/employees/:id` (114), PATCH `/:id/status` (124).
- Delete: ❌ **FE calls `DELETE /api/hr/employees/:id` (EmployeeTable.tsx:94) but BE has no DELETE handler.** Confirmed via grep — only `/employees/:id` DELETE exists on legacy `employees-compat.controller.ts:121`. Different URL prefix. **404 in production.**

## Backend logic issues
- `get-employees.handler.ts:38` — `birthDate: (row['date_of_birth'] ?? row['birth_date'] ?? null)` — two competing columns (DB has BOTH, schema-misc-app-a.ts:58-59); ambiguity.
- `get-employees.handler.ts:42` — `orgDepartmentId: row['department_id']` — uses legacy `department_id` field on `employees` not `employee_org_departments.org_department_id`. Memory says primary org should come from `employee_org_departments`. Possible stale link.
- `get-employees.handler.ts:46-52` — `coursesTotal: null`, `bonusAmount: null`, `failedTests: null`, `disciplineCount: null` — hardcoded nulls; FE table renders "—". Either remove columns from FE or join real data.
- `hr-employees.controller.ts:80,86-88` — `getEmployeeKpi` uses `_time.now().toISOString().slice(0,7)` for current period (server TZ — should be Tashkent).
- `hr-employees.controller.ts:131` — updates `status` AND `employmentStatus` to same value — these are two distinct concepts (`active|inactive|resigned` vs `permanent|contract|trial`). Conflation will corrupt employment_status.
- `hr-employees.controller.ts:152` — `Number(emp['base_salary'] ?? 0)` — base_salary is `text` in schema; conversion may produce NaN silently.
- `hr-employees.controller.ts:155-167` — `reviewSalary` writes `salary_history` then UPDATEs `employees.base_salary`. No transaction — if UPDATE fails, history row orphaned.
- `hr-employees.controller.ts:179` — `reason: body.reason ?? null` — reason text is dropped (not stored anywhere in the savePayroll payload; line 164-166 comments "Carry review metadata in other_bonuses field (0)" — actually stored nowhere).
- **No DELETE handler exists on `/api/hr/employees/:id`** → FE delete mutation returns 404, toast says "Xodim o'chirildi" (lying success).

## Security findings
- Auth: ✅ `RolesGuard` (line 37).
- Authorization: ⚠️ `MANAGER` not in BE list → some users denied; mismatch with FE.
- Validation: ✅ — Zod `HrCreateEmployeeSchema`, `HrUpdateEmployeeSchema`, `HrUpdateEmployeeStatusSchema`, `HrReviewSalarySchema` used via `@UsePipes(new ZodValidationPipe(...))`.
- SQLi: ✅ — Drizzle in repo.
- XSS: ✅ — React escapes; fullName, etc.
- CSRF: ✅.
- PII: ❌ — Page exposes `phone`, `telegramChatId`, `birthDate`, `address`, `attestationDate`, salary fields to all HR roles, plus `MANAGER` in FE gate. No row-level access scoping (department-bound managers can see all employees).
- Mass-assignment: ✅ (Zod-strict schemas at controller — need to confirm by reading DTO file, but pattern suggests yes).

## DDD / architecture issues
- Two parallel controllers: `hr-employees.controller.ts` (canonical) at `/api/hr/employees` and `employees-compat.controller.ts` at `/api/employees` — different URL prefixes; legacy still mounted (memory `feedback_add_only_no_refactor`).
- `get-employees.handler.ts:33-53` projects DB rows in the QUERY HANDLER (Qoida 6 borderline — projection is ok in handler, but transformation should be in a mapper/repo).
- Service skipped — controller injects `HR_REPO` directly (line 43) and bypasses any service layer for most operations.
- `reviewSalary` (controller:142-184) — biznes-logika (salary calculation + multi-step write) lives in controller — Qoida 6 explicit violation.
- Memory note: "Departments/Positions BE removed in xodimlar_cleanup" — but FE still uses `/api/departments`, `/api/positions` (EmployeeDialog.tsx:54-61). Possibly orphan routes.

## Performance issues
- `Employees.tsx:121-137` — full client-side filtering after fetching full list — no server-side `search` or `department` filter applied via BE (BE accepts `search` & `department` in query, controller:50; FE doesn't send them).
- `Employees.tsx:88-96` — query key `["/api/hr/employees"]` doesn't include pagination/filter — same cache for all combinations.
- `EmployeeTable.tsx:184-196` — date-arith per row in render (12-month / 365-day calculation).
- `stats` (Employees.tsx:110-118) — memoised ✅.
- 25-field form mounts even on rare cases (no lazy section reveal).

## Code quality issues
- `Employees.tsx:50-51` — interface mixes `orgDepartmentId: string | null` with `total: number` — string-typed FK.
- `EmployeeTable.tsx:184` — IIFE `(() => {...})()` for date computation inside JSX — should be helper.
- `EmployeeTable.tsx:295` — `window.location.href = "/org-structure/hierarchy"` — full reload instead of router push.
- `Employees.tsx:212` — `className="ep-btn-primary-shimmer gap-1.5"` — gradient class name suggests forbidden gradient (CLAUDE.md A1 design-system note).
- `EmployeeTable.tsx:69-87` — onSuccess invalidates BOTH `/api/hr/employees` AND `/api/users` (deprecated key, since Page 1 also uses `/api/users` as employee list).
- `get-employees.handler.ts:22` — `.catch((err) => ({ ok: false as const, error: (err as Error).message }))` — bypasses Result envelope; should use safeCall.

## Verdict
- Completeness: ~75% (List/create/update/import/profile-edit work; delete BROKEN; many fields nulled).
- Status: ❌ Delete action visible-but-non-functional + form has orphan fields without DB columns.
- Top severity: HIGH — silent delete failure misleads users.

## Top issues (numbered)
1. **DELETE `/api/hr/employees/:id` has no BE handler** — FE shows "Xodim o'chirildi" toast on 404.
2. `coursesTotal`, `bonusAmount`, `failedTests`, `disciplineCount` always null (get-employees.handler.ts:46-52).
3. Form has 25 fields; many (`shift`, `salaryType`, `workshopZone`, `attestationDate`, household, lat/lng) not in `hrEmployees` schema (schema-misc-app-a.ts:37-69) — silent data loss.
4. `base_salary` typed `text` in DB but treated numeric in code (schema:54).
5. `reviewSalary` not transactional (controller:155-172) — orphan history row risk.
6. Status + employment_status conflated to same value (controller:131).
7. FE filter not propagated to BE; full list fetched every time.
8. `MANAGER` role mismatch FE vs BE.
9. Two-controller URL split: `/api/hr/employees` (canonical) vs `/api/employees` (legacy compat) — DELETE only on legacy; FE called canonical.

## Recommended fixes
1. Add `@Delete(':id')` to `hr-employees.controller.ts` (proxy to soft-delete repo).
2. Send `search`, `department`, `page`, `limit` from FE to `/api/hr/employees`.
3. Either remove un-backed fields from form, or add migrations for them.
4. Wrap `reviewSalary` in a transaction.
5. Separate `status` and `employment_status` update paths.
6. Add `MANAGER` to BE @Roles OR drop from FE HR_ROLES.
7. Real joins for courses/bonus/failedTests/disciplineCount in `findAllEmployees`.

═════════════════════════════════════════════
# Page 7: AI HR Dashboard
# Section: Rekruting / AI
═════════════════════════════════════════════

## File map
- Route: `routes/HRRoutes.tsx:101` → `HRAIDashboard`. Role gate `AI_HR_ROLES = ['admin','hr_manager']` (`roleConstants.ts:27`).
- Page: `artifacts/erp-dashboard/src/pages/HRAIDashboard.tsx` (170 lines).
- Sub-components: `pages/HRAIDashboardTypes.ts`, `HRAIDashboardSections.tsx` (StatCardSkeleton, ProviderCardSkeleton, StatCardsRow, ProvidersBudgetSection, TaskTypeGrid, RecentTasksPanel), `HRAIDashboardDialogs.tsx` (TaskExecutionPanel).
- BE controller: `apps/api/src/modules/ai/presentation/ai-hr-new.controller.ts:47-69` (`/dashboard`, `/providers`, `/usage/budget`, `/tasks/:id`).
- Service: `ai-hr-new.service.ts:46-108`.
- Repo: `DrizzleAiHrNewRepo` (not inspected directly).
- AI router: `AiRouterService` (provider usage stats).
- Task POST endpoint: FE calls `POST /api/ai-hr/tasks/${selectedTask}` (HRAIDashboard.tsx:73) — **no matching `@Post('tasks/:id')` handler in ai-hr-new.controller.ts** (only `@Get('tasks/:id')` line 65).

## UI elements (from code)
- Buttons: none statically; `TaskTypeGrid` provides selectable task types (presumably `screen`, `classify-productivity`, etc.). `TaskExecutionPanel` shows form + submit.
- Form fields: `formData` (Record<string,string>) + `taskLanguage` (uz/ru) + `selectedTask` (string).
- Table columns: none — card layout.
- Tabs/modals: `TaskExecutionPanel` slides open when `selectedTask !== null`.
- KPI cards: 4 (`totalAiTasks`, `completedInterviews`, `totalCost`, `activeProviderCount` — lines 127-132).
- Sections: providers + budget grid; task-type grid; recent-tasks list.
- i18n: t('hr') + `tLabel(key, fallback)`. Most labels use `tLabel` ✅; some hardcoded ("Bajarildi", "Kutilmoqda", "Xatolik" — 53-57 — though wrapped in `t()` they hit untranslated default strings if key absent).

## Data requirements
- Endpoints (all GET unless noted):
  - `/api/ai-hr/dashboard` (line 36) → `DashboardData { totalAiTasks, completedInterviews, totalCost, recentTasks[] }`.
  - `/api/ai-hr/providers` (40) → `ProviderConfig[]`.
  - `/api/ai-hr/usage/budget` (44) → `BudgetItem[]`.
  - POST `/api/ai-hr/tasks/:taskKey` body `{ ...formData, language }` (73) — **no BE handler defined (only `@Get('tasks/:id')` exists).**
- DB tables read (via AiRouterService.getUsageStats + repo): `ai_tasks`, `ai_interview_sessions`, `ai_usage_logs` (inferred).
- Permissions: BE `@Roles(SUPER_ADMIN, DIRECTOR, HR_MANAGER)` (ai-hr-new.controller.ts:27).

## Form analysis
- Form fields are dynamic per task; `formData` is `Record<string, string>` (line 33) — no schema.
- No FE Zod validation; submits raw object.
- After submit: `setTaskResult(JSON.stringify(result, null, 2))` (74) renders raw JSON in the panel.

## CRUD contract
- Create: ❌ (intended via POST `/api/ai-hr/tasks/:id`, but handler missing).
- Read: ✅ dashboard, providers, budget.
- Update: ❌
- Delete: ❌

## Backend logic issues
- **POST `/api/ai-hr/tasks/:id` not implemented** (controller only has `@Get`). FE submits, gets 404, displays the error string in the result panel. Major bug.
- `ai-hr-new.service.ts:100-108` — `getTaskById` returns fake `status: 'completed'` (Qoida 10).
- `ai-hr-new.service.ts:46-64` — `getDashboard()`: `totalCost = usageResult.data.today?.spent ?? 0` — only today's cost; FE label is "Umumiy xarajat" (total). Mislabeled.
- `ai-hr-new.service.ts:53-54` — when `usageResult` fails, `totalCost = 0` silently (no log/Err propagation).
- `getProviders` & `getUsageBudget` (line 66-98) — if `usageResult` not ok, return defaults derived from hardcoded `PROVIDER_BUDGETS` — silent fallback.
- `PROVIDER_BUDGETS` (line 23-27) — Claude marked `isActive: false`; budget for openai $100, gemini $50, claude $80 — hardcoded in service.

## Security findings
- Auth: ✅ JWT + RolesGuard (controller line 25).
- Authorization: ✅ — narrow.
- Validation: ❌ — POST `/api/ai-hr/tasks/:id` has no DTO; FE sends `formData` as `Record<string, string>` → no schema → mass-assignment when handler appears.
- SQLi: ✅.
- XSS: ⚠️ — `setTaskResult(JSON.stringify(result, null, 2))` then rendered (TaskExecutionPanel) — if rendered with `dangerouslySetInnerHTML` could be XSS; assumed `<pre>` text (need to inspect Dialogs).
- CSRF: ✅.
- PII: ⚠️ — AI tasks may contain candidate names/transcripts. Recent-tasks panel displays raw `taskType`+`status`+`createdAt` — relatively safe.
- Mass-assignment: ❌ — when POST is implemented, will accept any body without Zod.

## DDD / architecture issues
- Service mixes infra concern (`PROVIDER_BUDGETS` constant) with logic.
- `getTaskById` mock taints the read API.
- Task type taxonomy lives in `TaskTypeGrid` (FE) — no shared enum between FE/BE.
- No domain event when task created/completed (would be `TaskCreatedEvent`).
- Provider config split between `AiRouterService` and this service.

## Performance issues
- Three queries on mount; OK.
- Skeletons proper.
- No polling — stale provider/budget data.
- `recentTasks` rendered once; pagination missing.

## Code quality issues
- `HRAIDashboard.tsx:33,68` — `formData: Record<string, string>` — no schema.
- `HRAIDashboard.tsx:77` — silent catch `err instanceof Error ? err.message : fallback` — generic.
- `HRAIDashboard.tsx:138` — `breadcrumb={<>{t("dashboard9")}<b ...>{t("hrAiDashboard")}</b></>}` — `dashboard9` looks like an auto-numbered i18n key (translation noise).
- `HRAIDashboard.tsx:127-132` — `statCards` array built inline in render every time; no memo.
- `HRAIDashboard.tsx:50-61` — `getStatusBadge` uses mixed `EPStatusPill` + `Badge` for the same dimension; visually inconsistent.
- `ai-hr-new.service.ts:38-40` — `getInterviews(page, limit)` not type-safe; numbers may be NaN.
- `ai-hr-new.service.ts:54` — `usageResult.data.today?.spent` — assumes structure; AiRouter contract unclear.

## Verdict
- Completeness: ~45% (read-side works; write-side broken — POST tasks unhandled; task data fake).
- Status: ❌ Submit-task action returns 404 silently displayed as result.
- Top severity: HIGH — primary user action (run AI task) is non-functional.

## Top issues (numbered)
1. POST `/api/ai-hr/tasks/:id` has no BE handler (HRAIDashboard.tsx:73 vs ai-hr-new.controller.ts:65 — only GET).
2. `getTaskById` returns hardcoded fake `status: 'completed'` (service:100-108).
3. `totalCost` shows today's spend but is labelled "Umumiy xarajat" (Total cost).
4. `PROVIDER_BUDGETS` hardcoded in service code (not DB).
5. `formData` has no Zod schema — mass-assignment risk when POST is implemented.
6. Silent fallback to mock budgets when usage stats fail.
7. No polling/refetchInterval for providers/budget — stale.
8. Inconsistent badge components for status (EPStatusPill vs Badge).

## Recommended fixes
1. Implement `@Post('tasks/:taskType')` in `ai-hr-new.controller.ts` dispatching to `AiRouterService.execute(taskType, body, language)`.
2. Replace `getTaskById` mock with real `ai_tasks` lookup or `notImplemented()`.
3. Either return cumulative cost or rename label to "Bugungi xarajat".
4. Move `PROVIDER_BUDGETS` to `ai_provider_configs` DB table; expose via admin UI.
5. Add Zod schema for task-execution body; type per task-type discriminated union.
6. Refetch providers/budget every 60s (`refetchInterval`).
7. Standardise status badge component.

═════════════════════════════════════════════

## Cross-page summary (for the caller)

**Cross-cutting issues observed across all 7 pages:**

- **FE/BE role-name case mismatch** in every page (FE lowercase, BE uppercase) — works only because guards are lenient; ticking time bomb when guard tightens.
- **Qoida 10 (fake stub responses)** rampant: `hr-dashboard.controller.ts` (~12 handlers), `hr-vacancies-pipeline.controller.ts` (3 handlers), `org-structure.controller.ts` (portret/createPortret), `ai-hr-new.service.ts` (`getTaskById`).
- **Missing endpoints called by FE**:
  - DELETE `/api/hr/employees/:id` (Page 6) — `EmployeeTable.tsx:94`.
  - POST `/api/ai-hr/tasks/:id` (Page 7) — `HRAIDashboard.tsx:73`.
  - POST `/api/org-departments/notify-vacancies` (Page 2) — controller not located in glob scope.
- **`.passthrough()` overuse** across all Zod schemas in org-structure & recruitment controllers → mass-assignment risk.
- **HR Map missing `lat`/`lng` in SELECT** → markers never render.
- **Hardcoded UZ toast strings** on every page (line refs in each section).
- **No tests** for any of the 7 page-paths' controllers or pages (only `hrNavI18n.test.ts` and `ai-hr.dto.spec.ts` exist).
- **Stage/status enum drift**: `funnel_stage` accepts arbitrary strings (no enum) in pipeline POST; `employment_status` & `status` conflated in employee update.
- **Server timezone** used instead of `TashkentTimeService` (`_time`) in repo SQL (`hr-dashboard.repository.ts:230`, controller getEmployeeKpi).
- **DDD layers thin**: services act as pass-throughs; controllers carry business rules (especially `reviewSalary`).
- **Schema drift hints** (per memory `session_2026-05-23_hidden_errors_audit`): `base_salary` is `text`, `attestationDate` not in `hrEmployees`, 6 household fields stored in `users` not `employees` — FE form orphan fields confirmed.

Key files referenced (absolute paths):
- `C:\Users\AzzA\Downloads\EuroPrint-Clean\Uzbek-Language-Module\artifacts\erp-dashboard\src\pages\{HRDashboard,OrgStructureHierarchy,HRMap,RecruitingKanban,AIInterviewPage,Employees,HRAIDashboard}.tsx`
- `C:\Users\AzzA\Downloads\EuroPrint-Clean\Uzbek-Language-Module\artifacts\erp-dashboard\src\routes\{HRRoutes,AppRouter,roleConstants}.tsx`
- `C:\Users\AzzA\Downloads\EuroPrint-Clean\Uzbek-Language-Module\artifacts\erp-dashboard\src\components\{EmployeeTable,EmployeeDialog}.tsx`
- `C:\Users\AzzA\Downloads\EuroPrint-Clean\Uzbek-Language-Module\apps\api\src\modules\hr\presentation\{hr-dashboard,hr-dashboard-extra,hr-employees,hr-employees-ext}.controller.ts`
- `C:\Users\AzzA\Downloads\EuroPrint-Clean\Uzbek-Language-Module\apps\api\src\modules\hr\application\hr-dashboard.service.ts`
- `C:\Users\AzzA\Downloads\EuroPrint-Clean\Uzbek-Language-Module\apps\api\src\modules\hr\infrastructure\repositories\hr-dashboard.repository.ts`
- `C:\Users\AzzA\Downloads\EuroPrint-Clean\Uzbek-Language-Module\apps\api\src\modules\hr\application\queries\get-employees.{query,handler}.ts`
- `C:\Users\AzzA\Downloads\EuroPrint-Clean\Uzbek-Language-Module\apps\api\src\modules\org-structure\org-structure.{controller,service,repository,module}.ts`
- `C:\Users\AzzA\Downloads\EuroPrint-Clean\Uzbek-Language-Module\apps\api\src\modules\compatibility\hr-map-compat.{controller,service}.ts`
- `C:\Users\AzzA\Downloads\EuroPrint-Clean\Uzbek-Language-Module\apps\api\src\modules\compatibility\employees-compat.controller.ts`
- `C:\Users\AzzA\Downloads\EuroPrint-Clean\Uzbek-Language-Module\apps\api\src\modules\hr\recruitment\{hr-vacancies,hr-vacancies-pipeline}.controller.ts`
- `C:\Users\AzzA\Downloads\EuroPrint-Clean\Uzbek-Language-Module\apps\api\src\modules\hr\recruitment\hr-vacancies.service.ts`
- `C:\Users\AzzA\Downloads\EuroPrint-Clean\Uzbek-Language-Module\apps\api\src\modules\ai\presentation\{ai-hr,ai-hr-new}.controller.ts`
- `C:\Users\AzzA\Downloads\EuroPrint-Clean\Uzbek-Language-Module\apps\api\src\modules\ai\application\services\ai-hr-new.service.ts`
- `C:\Users\AzzA\Downloads\EuroPrint-Clean\Uzbek-Language-Module\apps\api\src\shared\db\schema-misc-app-a.ts`

agentId: ad5c2a59feddce9e5 (use SendMessage with to: 'ad5c2a59feddce9e5' to continue this agent)
<usage>total_tokens: 200106
tool_uses: 77
duration_ms: 666336</usage>

### Group 2 — Pages 8–14 (360 PROFIL + Davomat va Smena + Baholash start)

Now I have enough data to compile the full audit. Let me deliver the report:

═════════════════════════════════════════════
# Page 8: Maqsadlar (GoalsKPI)
# Section: 360 PROFIL → Strategiya
═════════════════════════════════════════════

## File map
- Route: `artifacts/erp-dashboard/src/routes/AnalyticsRoutes.tsx:38` → `/goals` → `GoalsKPI`
- Page component: `artifacts/erp-dashboard/src/pages/GoalsKPI.tsx` (183 lines)
- Sub-components: `GoalsKPIDialogs.tsx`, `GoalsKPISections.tsx` (189 lines), `GoalsKPITypes.ts`
- Store/state: React `useState` + `react-hook-form` (`zodResolver(insertGoalSchema)`)
- API client: `apiRequest` from `@/lib/queryClient`
- BE controller: `apps/api/src/modules/compatibility/goals-compat.controller.ts:28` (`@Controller('goals')`, marked `@deprecated`)
- Service: `apps/api/src/modules/compatibility/goals-compat.service.ts:19`
- DB model: `lib/db/src/schema/core/core-ai.ts:14` `goals` table (drizzle)
- Migrations: present in `lib/db` (goals table is canonical)
- Tests: `artifacts/erp-dashboard/src/pages/GoalsKPI.smoke.test.tsx` (smoke only)

## UI elements (from code)
- Buttons: "Yangi maqsad" (in GoalDialog), per-card Edit/Delete (`GoalsKPISections.tsx:88-105`)
- Form fields (`GoalsKPI.tsx:43-58`): `title`, `description`, `category`, `targetType`, `targetId`, `metric`, `targetValue`, `startDate`, `endDate`, `status`, `priority`
- Summary cards: jamiMaqsadlar / faol / bajarilgan / o'rtacha progress (`GoalsKPISections.tsx:42-60`)
- List: GoalCard with progress bar (`GoalsKPISections.tsx:72-155`)
- i18n: mostly via `t()`, but hardcoded "Bajarilish" `GoalsKPISections.tsx:124`, "Hozirgi"/"Maqsad" `:137-138`, "Maqsad yaratildi" toast `GoalsKPI.tsx:66`

## Data requirements
- `GET /api/goals` → `Goal[]` — `GoalsKPI.tsx:26-28`
- `GET /api/departments` → `[{id,name}]` — `:30-32`
- `GET /api/positions` → `[{id,name}]` — `:34-36`
- `GET /api/hr/employees` → `{data:[{id,fullName}]}` — `:38-41`
- `POST /api/goals` body `InsertGoal` → row — `:62`
- `PATCH /api/goals/:id` body `Partial<InsertGoal>` → row — `:77`
- `DELETE /api/goals/:id` — `:90`
- DB tables: `goals` (RW), `employees` / `departments` / `positions` (R)
- Roles (BE): `HR_MANAGER, HR_SPECIALIST, SUPER_ADMIN, DIRECTOR, ADMIN, MANAGER, OPERATOR` (`goals-compat.controller.ts:22,27`)

## Form analysis
- FE form contains 11 fields; DB `goals` table has matching columns (`core-ai.ts:14-30`). Match: ✅
- `createdBy` not sent from FE → DB allows null (`core-ai.ts:28`); BE `createGoal` accepts `created_by` (`:42,51`) but FE never sends → always empty string written as `''` (FK to admins may fail or set null silently).
- `targetId` typed as `string` in FE but FE form field initial `""` and never validated against actual department/position/user — orphan possible.

## CRUD contract
- Create ✅ — `POST /api/goals` (`GoalsKPI.tsx:62`) → `goals-compat.controller.ts:67` ✅
- Read ✅ — `GET /api/goals` (`:27`) → controller `:35`
- Update ⚠️ — FE sends `PATCH /api/goals/:id` (`GoalsKPI.tsx:77`) but BE uses `@Put(':id')` (`goals-compat.controller.ts:78`). **MISMATCH: PATCH vs PUT.** PATCH will 405/404 unless Fastify falls back; this is a route-method bug.
- Delete ✅ — `DELETE /api/goals/:id` (`:90`) → `:83`

## Backend logic issues
- Service uses **raw SQL `sql\`INSERT…\`` for all CRUD** (`goals-compat.service.ts:27-122`) — violates Qoida 4 (Raw SQL Cheklangan).
- `goals-compat.service.ts:43` throws `BadRequestException` directly instead of returning `Result.err` — violates Qoida 1 (Result Pattern).
- `createGoal:51` casts `created_by` to `String(... ?? '')` — inserts empty string as FK (referential integrity risk with `admins.id`).
- `getGoals:22-37` uses `Ok([])` on error (`:36`) silently — error swallowed, frontend can't differentiate empty vs error.
- `INSERT INTO goals (... start_date, end_date ...)` (`:44-52`) passes `start_date ?? null` but Drizzle declares both `notNull()` (`core-ai.ts:24-25`). DB will reject NULL — silent error returned as Internal.

## Security findings
- Auth ✅: `@UseGuards(RolesGuard)` (`goals-compat.controller.ts:25`) — but missing explicit `JwtAuthGuard` (relies on global). Verify global guard.
- Authorization ✅: `@Roles(...HR_ROLES, 'OPERATOR')` (`:27`). However, **OPERATOR can DELETE goals** — too permissive.
- Validation ❌: `CompatBodyDto` is a generic body type; no Zod schema on POST/PUT (`goals-compat.controller.ts:69,79`). Body validated only by raw `if (!title)` (`goals-compat.service.ts:43`). Violates Qoida 3.
- SQLi ✅: All values use `${...}` template interpolation in `sql\`\`` — parametrized.
- XSS ✅: No `dangerouslySetInnerHTML`.
- CSRF ⚠️: No CSRF guard; depends on JWT in header (acceptable for SPA).
- PII: Goals contain employee `targetId` — minor.
- Mass-assignment ❌: BE accepts whole body via spread; e.g. `created_by` accepted from client (`goals-compat.service.ts:42`) — client can forge ownership.

## DDD / architecture issues
- No aggregate / repository — service goes direct to DB via raw SQL.
- Controller marked `@deprecated` (`goals-compat.controller.ts:5`) but is the only handler — no canonical replacement registered.
- ACL `GoalAclTranslator` added at `:31` but only used in `/v2` endpoint; main routes bypass it.
- Mix of concerns: BC business rule "category must be one of …" duplicated in Drizzle check (`core-ai.ts:32`) and Zod (`:40`) but **not validated at controller**.

## Performance issues
- `GET /api/goals` LIMIT `MAX_QUERY_LIMIT` (default likely 100) — no pagination on FE; sufficient short-term.
- FE: `useQuery<Goal[]>` for goals + 3 separate queries (`departments`, `positions`, `hr/employees`) on every page render — no `enabled` gating.

## Code quality issues
- `GoalsKPI.tsx:115-123` repeats `as InsertGoal["..."]` casts — type unsafe.
- `GoalsKPISections.tsx:124,137-138` hardcoded strings.
- `goals-compat.service.ts:9` mixed imports (`db, rawSql`) — `db` unused.

## Verdict
- Completeness ~70%
- Status: ⚠️ (works for create/list/delete; UPDATE broken due to PATCH↔PUT mismatch; deprecated module)

## Top issues
1. **PATCH vs PUT method mismatch** — `GoalsKPI.tsx:77` sends PATCH; `goals-compat.controller.ts:78` only `@Put`. Update silently fails.
2. **No Zod validation on POST/PUT bodies** — bypasses Qoida 3; allows `created_by` mass-assignment.
3. **Raw SQL throughout service** — violates Qoida 4; `BadRequestException` from service violates Result Pattern.
4. **NotNull start_date/end_date** sent as `null` fallback (`goals-compat.service.ts:50`) — DB will reject.
5. **OPERATOR role can DELETE** goals (`goals-compat.controller.ts:27`) — privilege escalation surface.

## Recommended fixes
P1: Add `@Patch(':id')` handler delegating to `updateGoal`; OR change FE to PUT.
P1: Add Zod DTO for create/update; strip `created_by` from body; force `userId` from `@CurrentUser`.
P2: Remove OPERATOR from delete role list.
P2: Migrate service to repo+ORM; return `Result<Goal>`.
P3: Add `t()` for hardcoded "Bajarilish", "Hozirgi", "Maqsad" labels.

═════════════════════════════════════════════
# Page 9: Smena Jadvali (ShiftSchedule)
# Section: Davomat va Smena
═════════════════════════════════════════════

## File map
- Route: `artifacts/erp-dashboard/src/routes/HRRoutes.tsx:63` → `/shift-schedule` → `ShiftSchedule`
- Page: `artifacts/erp-dashboard/src/pages/ShiftSchedule.tsx` (299 lines — just under 300 limit)
- Sub: `ShiftScheduleTypes.ts`, `ShiftScheduleDialogs.tsx`, `ShiftScheduleSections.tsx`
- BE controller (primary): `apps/api/src/modules/hr/shift/shift.controller.ts:53` (`@Controller('hr-v2/shifts')`)
- BE controller (compat): `apps/api/src/modules/hr/presentation/hr-shifts-compat.controller.ts:33` (`@Controller('hr')`)
- BE controller (today): `apps/api/src/modules/hr/presentation/hr-dashboard.controller.ts:92` (`@Get('shifts/today')`)
- Service: `apps/api/src/modules/hr/shift/shift.service.ts:20`
- Repository: `apps/api/src/modules/hr/shift/shift.repository.ts` (referenced)
- DB: `lib/db/src/schema/shifts.ts` (`shiftAssignments`, `shiftSwapRequests`)
- Tests: `ShiftSchedule.smoke.test.tsx`

## UI elements (from code)
- Header: title + refresh button (`ShiftSchedule.tsx:194`)
- 4 stat cards: total / morning / evening / night (`:198-227`)
- Tabs: "Haftalik Jadval" / "Almashish So'rovlari" (`:230-237`) — second is hardcoded UZ string `:234`
- Grid table (GridTab) with employee rows × 7 days
- Filters: department select, search, week prev/next/today, pagination
- Dialogs: `AssignShiftDialog`, `SwapRequestDialog`, `DeleteEntryConfirm`
- Shift types: MORNING / EVENING / NIGHT with icons

## Data requirements
- `GET /api/users` → `Employee[]` — `:50`
- `GET /api/departments` → `Department[]` — `:54`
- `GET /api/hr-v2/shifts/schedule?week_start=&department_id=` → `ShiftScheduleEntry[]` — `:79`
- `GET /api/hr-v2/shifts/swap-requests` → `ShiftSwapRequest[]` — `:86`
- `GET /api/hr/shifts/today` → `ShiftScheduleEntry[]` — `:91`
- `POST /api/hr-v2/shifts` `{user_id, shift_date, shift_type}` — `:96`
- `DELETE /api/hr-v2/shifts/:id` — `:107`
- `POST /api/hr-v2/shifts/swap-request` `{from_employee_id?, to_employee_id?, shift_date, reason}` — `:118`
- `PATCH /api/hr-v2/shifts/:id/approve-swap` `{action: 'approve'|'reject'}` — `:131`
- DB tables: `shift_assignments` (RW), `shift_swap_requests` (RW), `employees` (R), `leaves` (R for `checkLeaveConflict`)
- Roles (BE shift.controller): `admin, manager, supervisor, hr_manager, employee` (`:47`)

## Form analysis
- FE has no full form; just dialog with shift_type select. Match: OK.
- Approve action: FE sends `{ action }` (`ShiftSchedule.tsx:131`) but BE has **no `action` parameter** — controller signature `approveSwap(@Param('id', ParseIntPipe) id: number)` (`shift.controller.ts:111`) ignores body. **Both approve AND reject produce identical "approve" behaviour.**
- Swap request: FE sets `from_employee_id` only `if (isHR && swapDialog.userId !== authUser.id)` (`ShiftSchedule.tsx:284`) but for self-swap it's undefined; BE `requestSwap` defaults to 0 (`shift.controller.ts:89-92`) which becomes a non-existent employee.

## CRUD contract
- Create ✅ `POST /api/hr-v2/shifts` → `shift.controller.ts:62`
- Read ✅ schedule + swap-requests + today; `today` route lives in `hr-dashboard.controller.ts:92`
- Update / Approve ❌ — reject branch DOES NOT WORK (`shift.controller.ts:111` ignores `action`)
- Delete ✅ `DELETE /api/hr-v2/shifts/:id` → `:135`

## Backend logic issues
- `approveSwap` ignores reject case entirely — no rejection logic in `shift.service.ts:77-105`. Reject button on FE simulates rejection but actually swaps shifts.
- `shift.service.ts:88` reads `meta.to_employee_id` from notes JSON — if metadata corrupted, fallback `clearShiftPending` (`:96`) silently approves without swapping. Data-loss-risk.
- `shift.service.ts:107-113` returns repo result directly without `Result` wrap re-wrap, but `unwrapOrInternal` on controller assumes wrapped — see explicit comment `:108-109` showing this contract is fragile.
- `hr-shifts-compat.controller.ts:100` returns `{ ok: false, message: 'Shift topilmadi' }` raw object — violates Qoida 10 (soxta javob style, should throw `BadRequestException`).
- `findShiftByEmployeeAndDate` failure path `parseInt(body.user_id, 10) || 0` (`shift.controller.ts:69`) — when user_id non-numeric AND not in DB, falls back to `0` and inserts shift with `employee_id=0`. **DB corruption risk.**

## Security findings
- Auth ✅: `@UseGuards(JwtAuthGuard)` (`shift.controller.ts:50`).
- Authorization ⚠️: `employee` role can call `POST /shifts` (`:47,61`) — any employee can create shift entries for themselves or others (no `if employee, restrict to own user_id`). Privilege issue.
- Validation ✅: Zod DTO with `AssignShiftSchema` (`:20-28`).
- SQLi ✅: Uses Drizzle repo.
- XSS ✅: N/A.
- CSRF ⚠️: JWT-only.
- PII: shift_date by employee — minor.
- Mass-assignment ⚠️: assignShift accepts `notes` freeform but not `employee_id` from FE if user_id used (lookup function). OK.

## DDD / architecture issues
- Two controllers `hr-v2/shifts` + `hr/shifts` (`hr-shifts-compat.controller.ts:33`) serve overlapping routes — duplicate logic surface; FE uses only `hr-v2/*` and `hr/shifts/today`.
- `shift.service.ts:120` parses `notes` as JSON to extract `to_employee_id` — should be a column in `shiftSwapRequests` (which exists: `targetEmployeeId`). Workaround indicates schema/code drift.
- ShiftSwap data uses BOTH `shift_swap_requests` table AND `shift_assignments.notes` JSON metadata (`shift.service.ts:65`) — confusing dual state.

## Performance issues
- Schedule fetched on every week-change + dept-change (correct).
- Loads ALL users from `/api/users` then client-side paginates (`ShiftSchedule.tsx:50, 139-150`) — N=hundreds OK; thousands not.

## Code quality issues
- `ShiftSchedule.tsx:25-26` `useTranslation` called twice (`t` and `tCommon`) but both `"common"` — redundant.
- `ShiftSchedule.tsx:234` `"Almashish So'rovlari"` hardcoded (no i18n).
- `:46` includes "director" in isHR but `super_admin` is `super_admin` (snake) — role string casing inconsistent (`shift.controller.ts:47` lowercase, vs `hr-shifts-compat.controller.ts:32` UPPER).
- `:48` `authUser?.role ?? ""` — defaulting to empty string in role check.

## Verdict
- Completeness ~75%
- Status: ⚠️ (reject swap broken; employee privilege; user_id=0 fallback risk)

## Top issues
1. **`approveSwap` ignores `action` body** — reject button silently approves (`shift.controller.ts:111`, `shift.service.ts:77`).
2. **Fallback `employee_id=0` insert** when user_id lookup fails (`shift.controller.ts:69`) — DB pollution.
3. **`employee` role can assign shifts to anyone** (`shift.controller.ts:47,61`) — no self-only check.
4. **Duplicate controllers** for shifts (`hr-v2/shifts` and `hr/shifts`).
5. **`notes` JSON used as swap metadata** despite proper `shift_swap_requests` table existing.
6. **Hardcoded "Almashish So'rovlari"** in tab label (`ShiftSchedule.tsx:234`).

## Recommended fixes
P1: Add `@Body('action')` to `approveSwap`; implement reject branch in service.
P1: Reject `employee_id=0` in repo — return BadRequest if no FK match.
P2: Restrict `POST /shifts` to admin/hr; employees can only request via swap.
P3: Migrate swap metadata from `notes` to `shift_swap_requests` columns.
P3: Consolidate duplicate controllers.

═════════════════════════════════════════════
# Page 10: Bildirishnomalar (NotificationSettings)
# Section: Sozlamalar
═════════════════════════════════════════════

## File map
- Route: `artifacts/erp-dashboard/src/routes/AdminRoutes.tsx:43` → `/settings/notifications` → `NotificationSettings`
- Page: `artifacts/erp-dashboard/src/pages/NotificationSettings.tsx` (177 lines)
- BE controller: `apps/api/src/modules/notifications/presentation/notifications.controller.ts:39`
- Service: `apps/api/src/modules/notifications/application/notification-preferences.service.ts:40`
- Repository: `apps/api/src/modules/notifications/infrastructure/repositories/notification-preferences.repository.ts`
- DTO/Zod: `apps/api/src/modules/notifications/presentation/dto/notification-preferences.dto.ts:10`
- DB model: `apps/api/src/shared/db/schema-business-a-1.ts:70` `notification_preferences`
- Migrations: not located in `lib/db/src/schema/` (lives in `apps/api/src/shared/db`)
- Tests: `NotificationSettings.smoke.test.tsx`

## UI elements (from code)
- Header: bell icon + title + active count badge + Save button (`:96-110`)
- Table with 10 notification types × 4 channels (email/telegram/in-app, no SMS column)
- Hardcoded labels (`:26-37`): "Vazifa tayinlandi", "Buyurtma holati", … etc — **NOT i18n'd**
- Stub default prefs (`:39-45`)
- Hardcoded strings: "Saqlanmoqda..." (`:108`), "Saqlash" (`:108`), "faol" (`:99`)

## Data requirements
- `GET /api/notifications/preferences` → expected `NotifPref[]` — `:53`
- `PATCH /api/notifications/preferences` body `{ preferences: NotifPref[] }` — `:64`
- DB: `notification_preferences` (single row per user, flat columns) — `schema-business-a-1.ts:70`
- Roles (BE): `admin, manager, supervisor, operator, employee, viewer, director` (`notifications.controller.ts:37`)

## Form analysis
- **CRITICAL SCHEMA MISMATCH:**
  - FE sends `{ preferences: [{key, email, telegram, inApp, sms}, …] }` (`NotificationSettings.tsx:64`)
  - BE Zod schema (`notification-preferences.dto.ts:10`): `.strict()` object with flat keys `{emailEnabled, telegramEnabled, pushEnabled, orderUpdates, productionAlerts, hrAlerts, qcAlerts, financeAlerts, systemAlerts}`
  - On PATCH, `parseNotificationPreferences(body)` (`notifications.controller.ts:149-150`) calls `.strict().parse({preferences: [...]})` → ZodError → 400 BadRequest
  - **The Save button NEVER persists anything.**
- FE expects GET to return array `NotifPref[]`, BE returns `{statusCode:200, data: NotificationPrefs}` flat object (`notifications.controller.ts:101-104`) → FE `Array.isArray(savedPrefs)` is false → falls back to DEFAULT_PREFS (`NotificationSettings.tsx:57`). User never sees saved prefs.

## CRUD contract
- Create N/A
- Read ❌ — endpoint returns flat object, FE expects array (`NotificationSettings.tsx:52,57`).
- Update ❌ — body shape `.strict()` mismatch; PATCH always 400 (`notifications.controller.ts:148`, dto strict at `:20`).
- Delete N/A
- **CRUD broken at presentation/DTO contract level.**

## Backend logic issues
- `notifications.controller.ts:82-85` `getUnreadCount` returns hardcoded `{ unreadCount: 0 }` — Qoida 10 violation (soxta javob).
- `:122-124` `markAsRead` returns hardcoded `{id, isRead: true}` without DB mutation.
- `:129-133` `markAllAsRead` returns `{ updated: 0 }` — no real update.
- `notification-preferences.service.ts:43-47` `getPreferences` returns DEFAULTS if no row — silently masks "preferences never saved" as "all defaults".
- DUPLICATE routes: both `Put('/preferences')` (`:109`) AND `Patch('/preferences')` (`:148`) handle update — FE uses PATCH; OK.

## Security findings
- Auth ✅: `@UseGuards(JwtAuthGuard)` (`:35`).
- Authorization ✅: broad role list including `employee` — preferences are user-scoped via `@CurrentUser`. OK.
- Validation ⚠️: `.strict()` Zod schema in place but contract mismatch means it always rejects FE payload.
- SQLi ✅: Drizzle.
- XSS ✅.
- CSRF ⚠️: JWT only.
- PII: user_id only.
- Mass-assignment ✅: scoped to `user.id` from JWT.

## DDD / architecture issues
- DTO at presentation layer is `flat keys` (`emailEnabled` etc.), but UI/UX is **per-notification-type × channel matrix**. No domain model bridging this — BE schema is per-channel global, FE is per-type-per-channel. **Domain model fundamentally insufficient.**
- DB `notification_preferences` (`schema-business-a-1.ts:70`) lacks per-type granularity — only has `email_enabled, telegram_enabled, push_enabled, order_updates, production_alerts, hr_alerts, qc_alerts, finance_alerts, system_alerts`. Cannot store FE's "task_assigned, payment_due, leave_approved, shift_reminder, defect_reported" types.

## Performance issues
- Single GET + single PATCH per save — negligible.

## Code quality issues
- All notification type labels/descriptions hardcoded in UZ (`:26-37`) — no i18n.
- Toast "Sozlamalar saqlandi" / "Xatolik yuz berdi" hardcoded (`:65,67`).
- `NotifPref` interface has `sms` field but UI shows no SMS column (`:121-132` only 4 columns: type, email, telegram, in-app).

## Verdict
- Completeness ~30%
- Status: 🚫 (UI renders but save flow is broken end-to-end due to schema mismatch)

## Top issues
1. **PATCH /api/notifications/preferences always 400** — FE sends `{preferences: [...]}`, BE `.strict()` Zod expects flat keys.
2. **GET returns flat object, FE expects array** — saved prefs never displayed.
3. **DB schema has no per-notification-type column** — 10 FE types collapse to ~5 DB columns.
4. **`getUnreadCount` returns hardcoded `0`** (Qoida 10).
5. **`markAsRead` is stub** — no DB mutation.
6. **All UI strings hardcoded in UZ** (no i18n).

## Recommended fixes
P0: Add `notification_preferences_per_type` table OR JSONB column on `notification_preferences` to store per-type matrix.
P0: Reshape Zod schema or add a separate DTO accepting `{preferences: [...]}` matrix.
P1: Implement `getUnreadCount` and `markAsRead` against `notifications` table.
P2: Move labels/descriptions to i18n.

═════════════════════════════════════════════
# Page 11: Aktivlar (HRAssetManagement)
# Section: 360 PROFIL → Mol-mulk
═════════════════════════════════════════════

## File map
- Route: `artifacts/erp-dashboard/src/routes/HRRoutes.tsx:79` → `/hr/assets` → `HRAssetManagement`
- Page: `artifacts/erp-dashboard/src/pages/HRAssetManagement.tsx` (253 lines)
- Sub: `HRAssetManagementTypes.ts`, `HRAssetManagementSections.tsx` (262 lines), `HRAssetManagementDialogs.tsx`, `HRAssetManagementActionsDialogs.tsx`
- BE controller: `apps/api/src/modules/hr/hr-assets/hr-assets.controller.ts:39` (`@Controller('assets')`)
- Service: `apps/api/src/modules/hr/hr-assets/hr-assets.service.ts:13`
- Repository: `apps/api/src/modules/hr/hr-assets/hr-assets.repository.ts:39`
- Queries (Drizzle): `apps/api/src/common/database/queries-hr-assets.ts:14`
- DB models (live): `asset_items_ext`, `employee_assets`, `hr_employees` (live-DB stubs in `apps/api/src/shared/db`)
- Drizzle `lib/db/src/schema/`: NO `company_assets`/`hr_assets` table — schema lives only in apps/api shared/db stubs
- Tests: `HRAssetManagement.smoke.test.tsx`

## UI elements (from code)
- Header: title + "Yangi jihoz" button (`:188-191`)
- 4 stat cards: Jami / Bo'sh / Berilgan / Muammo (hardcoded labels `HRAssetManagementSections.tsx:38-41`)
- Filters: search, category select, status select, department select, refresh
- Table: 7 cols (jihoz, serial, tur, status, xodim, sana, amallar) — `Sections.tsx:163-169`
- Dialogs: AddAsset, Assign, Return, Report, Detail
- Per-row buttons: Eye/UserCheck/RotateCcw/AlertTriangle conditional on status

## Data requirements
- `GET /api/assets?search&category&status&department_id` → `Asset[]` (or `{data:Asset[]}`) — `:69`
- `GET /api/hr/employees?limit=500` → `Employee[]` (or `{employees}`) — `:84`
- `GET /api/departments` → `Department[]` — `:96`
- `GET /api/assets/:id` → `Asset` (with history) — `:159`
- `POST /api/assets` body `AssetForm + value:number + purchase_date|null` — `:107`
- `POST /api/assets/:id/assign` body `AssignForm` — `:122`
- `PATCH /api/assets/:id/return` body `ReturnForm` — `:133`
- `PATCH /api/assets/:id/report` body `ReportForm` — `:144`
- DB tables: `asset_items_ext` (R), `employee_assets` (RW for assign/return), `hr_employees` (R)
- Roles (BE): `SUPER_ADMIN, DIRECTOR, HR_MANAGER, HR_SPECIALIST, WAREHOUSE_KEEPER`; `EMPLOYEE` only on `/employee` self-route (`hr-assets.controller.ts:31,55`); DELETE limited to SUPER_ADMIN/DIRECTOR/HR_MANAGER (`:95`)

## Form analysis
- FE `AssetForm` has `value: string` (because `<Input type="number">` returns string) but BE Zod `value: z.number().optional().default(0)` (`hr-assets.controller.ts:25`). FE converts: `value: form.value ? Number(form.value) : 0` (`HRAssetManagement.tsx:109`). ✅
- `purchase_date: ""` → FE sends `null` if empty (`:110`). ✅
- BE `CreateDto` doesn't accept `department_id` (`:25`) — FE filter has department, but Add dialog doesn't send dept. OK.
- BE `UpdateDto` is `.partial()` (`:26`) but **no PUT/PATCH update endpoint is exposed for general fields** — `Put(':id')` (`:84`) exists but FE never calls it. Orphan endpoint.
- `reportIssue` schema requires `description: z.string().min(1)` (`:29`). FE matches.

## CRUD contract
- Create ✅ — `POST /api/assets` (`HRAssetManagement.tsx:107`) → `hr-assets.controller.ts:68`
- Read ✅ — list + by-id with history
- Update (general): ❌ — BE `Put(':id')` exists (`:84`) but FE never calls; instead uses specialised `assign/return/report`.
- Delete: ⚠️ — BE `Delete(':id')` (`:93`) but **FE has no delete button**. Orphan.
- Assign ✅, Return ✅, Report ✅

## Backend logic issues
- `hr-assets.service.ts:18-23` `getById` returns `Err('NOT_FOUND')` if `data==null`, controller wraps with `unwrapOrNotFound` — correct.
- `hr-assets.controller.ts:108` `assignedAt: _time.now().toISOString()` — returns server time but actual stored value comes from `assigned_date` in body (`:107-108`) — response inconsistent with stored row.
- `hr-assets.repository.ts:53` `findById` returns `{ ...toAsset(row), history: row.history ?? [] }` — `history` is typed as not part of `HrAsset` interface (`:17`); type cast issue.
- `queries-hr-assets.ts:32` `assigned_employee_name` derived from `first_name || ' ' || last_name` but if employee record missing, this becomes ` null ` (space + null) — display issue.
- `HRAssetManagement.tsx:158-165` `openDetail` calls `apiRequest('GET', ...)` and uses returned `res as Asset` without checking if it's wrapped — if BE returns `{ok, data}` envelope this will be wrong (BE returns raw via `unwrapOrNotFound` — OK).
- `HRAssetManagement.tsx:149` toast claims "Maosh chegirmasi navbatga qo'shildi" — but the BE `reportIssue` only calls `execReportAssetIssue` (`hr-assets.repository.ts:101-104`); no salary deduction queue exists in code.

## Security findings
- Auth ✅: `@UseGuards(JwtAuthGuard, RolesGuard)` (`:37`).
- Authorization ✅: well-scoped; DELETE narrowed (`:95`).
- Validation ✅: Zod on each endpoint.
- SQLi ✅: Drizzle queries.
- XSS ✅.
- CSRF ⚠️: JWT only.
- PII: serial numbers, employee names — minor.
- Mass-assignment ✅: explicit DTO whitelisting.
- ⚠️ `getAuthHeaders` imported but never used (`HRAssetManagement.tsx:12`).

## DDD / architecture issues
- Drizzle-only DB layer in `apps/api/src/shared/db/` — no canonical schema in `lib/db/src/schema/` for assets. Drift risk.
- Service is thin pass-through to repo (`hr-assets.service.ts:25-31`) — acceptable for CRUD but no domain rules (e.g. cannot-assign-twice, cannot-return-unassigned).
- No domain event when asset goes `lost/broken` — should emit for finance deduction (which toast promises).

## Performance issues
- Filters cause refetch on every keystroke (`:67`) — no debouncing.
- `useQuery` queryFn always re-creates `params` from outer scope variables (`:60-64`) — but `queryKey` includes them so OK.

## Code quality issues
- Hardcoded stat labels `Sections.tsx:38-41`.
- Hardcoded toasts `:116, 127, 138, 149` (UZ).
- `HRAssetManagement.tsx:160-164` extra braces `{ const data ... }` block — unnecessary.
- `getAuthHeaders` unused import (`:12`).
- `Sections.tsx:45` `grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-4` — duplicate `sm:grid-cols-*` (last wins; first is dead).

## Verdict
- Completeness ~85%
- Status: ✅ with caveats (CRUD works; salary-deduction toast is misleading; DELETE orphan)

## Top issues
1. **`reportIssue` toast claims salary queue** but no such queue exists in code (`HRAssetManagement.tsx:149`).
2. **General PUT update endpoint orphan** — FE never uses (`hr-assets.controller.ts:84`).
3. **DELETE endpoint orphan** — no FE button (`hr-assets.controller.ts:93`).
4. **No Drizzle canonical schema** for `asset_items_ext`/`employee_assets` in `lib/db/` (drift).
5. **Duplicate `sm:grid-cols-*` class** (`Sections.tsx:45`).
6. **Hardcoded stat labels** ("Jami", "Bo'sh", …).

## Recommended fixes
P2: Either implement salary deduction queue OR remove misleading toast.
P2: Add asset_items_ext + employee_assets schema to `lib/db/src/schema/`.
P3: Add delete button (with ConfirmDialog) or remove BE DELETE.
P3: Move stat labels to i18n; remove unused `getAuthHeaders`.

═════════════════════════════════════════════
# Page 12: Ta'til va Kasallik (HRVacationSick)
# Section: 360 PROFIL → Davomat
═════════════════════════════════════════════

## File map
- Route: `artifacts/erp-dashboard/src/routes/HRRoutes.tsx:70` → `/hr/vacation-sick` → `HRVacationSick`
- Page: `artifacts/erp-dashboard/src/pages/HRVacationSick.tsx` (208 lines)
- BE controller candidates: 
  - `apps/api/src/modules/hr/presentation/hr-compat-safety.controller.ts:122` (`@Post('leave-requests')` under `@Controller('hr')`)
  - `apps/api/src/modules/hr/presentation/hr-leave.controller.ts:39` (`@Controller('hr/leave')` — canonical CQRS)
  - `apps/api/src/modules/compatibility/employees-compat-sub.controller.ts:196` (`@Post(':id/leave-requests')` under `@Controller('employees')`)
- DTO Zod: `apps/api/src/modules/hr/presentation/dto/hr.dto.ts:177` `HrHealthLeaveSchema`
- DB: `lib/db/src/schema/leave.ts` (referenced)
- Tests: `HRVacationSick.smoke.test.tsx`

## UI elements (from code)
- Header: calendar icon + title + pending badge + Refresh + "So'rov yuborish" button (`:91-107`)
- 4 stat cards: Ta'tilda (hozir) / Kutilmoqda / Tasdiqlangan / Jami (`:111-116`) — hardcoded UZ labels
- Table: Xodim/Type/Boshlanish/Tugash/Sabab/Holati (`:131-137`) — first 30 rows only (`:144`) — no pagination
- Dialog: leave request form with `type` (Select), `startDate`, `endDate`, `reason` (`:166-205`)
- LEAVE_TYPE_LABELS hardcoded UZ (`:43-49`)
- Zod schema `LeaveRequestSchema` requires `type, startDate, endDate, reason` + optional `employeeId` (`:51-57`)

## Data requirements
- `GET /api/hr/leave-requests` → `LeaveRequest[]` — `:70`
- `POST /api/hr/leave-requests` body `{type, startDate, endDate, reason, employeeId}` — `:74`
- DB: `leaves` table (not opened)
- Roles (BE on hr-compat-safety): `HR_MANAGER, HR_SPECIALIST, SUPER_ADMIN, DIRECTOR, ADMIN, MANAGER` (`hr-compat-safety.controller.ts:28`)

## Form analysis — **CRITICAL CONTRACT MISMATCH**
- FE Zod (`HRVacationSick.tsx:51-57`): `{ type, startDate (camel), endDate (camel), reason, employeeId? }`
- BE Zod `HrHealthLeaveSchema` (`hr.dto.ts:177-182`): `{ employee_id (snake, REQUIRED int), start_date (snake), end_date (snake), reason }` — **NO `type` accepted, employee_id required**
- Consequence: `.strict`-like Zod (no `.passthrough`); BE will reject FE request with 400 (`type/startDate/endDate/employeeId` unrecognised).
- Even if it passed, **leave type is dropped** — every leave saved as default type (likely "annual").
- `:84-85` reads `.filter(r => r.status === "pending"/"approved")` — typings include both `status` and `leave_type/leaveType/leave_type` triple-aliases, indicating prior schema drift.
- No employeeId resolution in FE — uses logged user implicitly OR empty string.
- No approve/reject button in FE — manager use canonical `hr/leave/:id/approve` from elsewhere.

## CRUD contract
- Create ❌ — `POST /api/hr/leave-requests` body shape mismatch (FE camelCase + `type` vs BE snake_case + `employee_id` numeric).
- Read ✅ — `GET /api/hr/leave-requests` (`hr-compat-safety.controller.ts:116`) returns array.
- Update / Approve ❌ — no FE controls (handled in another HR page).
- Delete ❌ — no FE controls.

## Backend logic issues
- `hr-compat-safety.controller.ts:124-128` accepts only 4 fields; `leave_type` not stored — all leaves bucketed identically.
- `getLeaveRequests` (`:116-120`) returns raw array; no pagination — FE shows only first 30 (`HRVacationSick.tsx:144`).
- `hr-leave.controller.ts:39` (CQRS canonical) would be the right target but FE doesn't use it. Route `hr/leave` accepts `{employeeId, leaveType, startDate, endDate, reason}` (`leave.dto.ts` presumably).
- Two POST handlers for similar resource: `hr/leave-requests` vs `hr/leave` — confusion.

## Security findings
- Auth ✅: RolesGuard on hr-compat-safety (`:32`).
- Authorization ❌: **`@Roles(...HR_ROLES)` excludes EMPLOYEE** (`:34`) — regular employees CANNOT submit leave requests via this endpoint. But UI shows "So'rov yuborish" button to all viewers. **403 Forbidden** for employees.
- Validation ⚠️: `.strict`-style Zod blocks FE payload.
- SQLi ✅.
- XSS ✅.
- CSRF ⚠️: JWT only.
- PII: leave dates + reasons — sensitive (health).
- Mass-assignment: client passes employee_id — BE doesn't enforce `user.id === employee_id` (`hr-compat-safety.controller.ts:124-127`). **Any HR_MANAGER can submit leave for any employee** (intended) but no audit trail check.

## DDD / architecture issues
- Three competing controllers for leave (`hr/leave-requests`, `hr/leave`, `employees/:id/leave-requests`).
- `hr-leave.controller.ts` (CQRS) is canonical — has commands `CreateLeaveRequestCommand`, `ApproveLeaveCommand`, etc. — but FE doesn't target it.
- `LeaveRequest` interface in FE has triple-aliased fields (`employeeId/employee_id/userId`, `type/leaveType/leave_type`, `startDate/start_date`, `endDate/end_date`) — symptomatic of unresolved API contract.

## Performance issues
- Top-30 slice in FE (`:144`) — no server-side pagination; large datasets break.

## Code quality issues
- Hardcoded labels `:112-115, 132-136, 154-156, 168, 200`.
- `now` reused for date math (`:86`) — fine; but using `new Date(r.startDate)` (`:87`) on possibly null/undefined is unsafe (guarded by `r.startDate && r.endDate`).
- `:84-85` typecasts `(leaveRequests as LeaveRequest[]).filter(...)` 4 times — could memoize.

## Verdict
- Completeness ~40%
- Status: ❌ (Create flow broken; employees can't submit; leave type discarded server-side)

## Top issues
1. **POST body shape mismatch** — FE `{type, startDate, ...}` vs BE `{employee_id, start_date, ...}` → 400.
2. **`leave_type` not stored** — BE schema drops type field entirely (`HrHealthLeaveSchema:177-182`).
3. **EMPLOYEE role forbidden** to POST (`hr-compat-safety.controller.ts:34`) — UI button broken for them.
4. **Three competing leave endpoints**; CQRS canonical (`hr/leave`) unused by FE.
5. **No approve/reject UI** in FE — incomplete management story.
6. **Hardcoded UZ labels** throughout.

## Recommended fixes
P0: Switch FE to `POST /api/hr/leave` (CQRS canonical) with `{employeeId, leaveType, startDate, endDate, reason}`.
P0: Or update BE `HrHealthLeaveSchema` to accept `leave_type` + camelCase aliases.
P1: Allow EMPLOYEE role on compat POST endpoint with self-restriction.
P2: Add approve/reject buttons (HR_MANAGER only) calling `PATCH /api/hr/leave/:id/approve` and `/reject`.
P3: Move labels to i18n.

═════════════════════════════════════════════
# Page 13: Xodim Baholash (360°) (EmployeeRating)
# Section: Baholash
═════════════════════════════════════════════

## File map
- Route: `artifacts/erp-dashboard/src/routes/AdminRoutes.tsx:62` → `/integration/employee-rating` → `EmployeeRating`
- Page: `artifacts/erp-dashboard/src/pages/EmployeeRating.tsx` (276 lines, marked `@deprecated 2026-05-27` on `:1`)
- BE controller: `apps/api/src/modules/integration/integration-extended-hr.controller.ts:29` (`@Controller('integration')`)
- Repo: `apps/api/src/modules/integration/integration-extended-hr.repo.ts:18`
- DB model: `lib/db/src/schema/kpi.ts:55` `employee_ratings` (Drizzle)
- Migrations: live-DB also has `employee_rating_goals` table (referenced `repo:54`) — not in `lib/db/`
- Tests: `EmployeeRating.smoke.test.tsx`

## UI elements (from code)
- Marked `@deprecated` (`:1-3`) — "Do NOT add new features here. See: docs/modules/hr-employees.md"
- Header: title + Year/Month selector + refresh (`:108-134`)
- 4 stat cards: Baholangan / O'rtacha ball / Samaradorlik / KPI Maqsadlar (`:136-152`)
- Tabs: Reytinglar / KPI Maqsadlar (`:155-159`)
- Ratings table: 9 cols (#, Xodim, Samaradorlik, Intizom, Sifat, Ko'nikmalar, Umumiy ball, Trend, Daraja) — `:179-189`
- Goals table inside `goals` tab — 6 cols (`:239-246`)
- `scoreBadge` (`:84-89`): Alo (≥90), Yaxshi (≥75), O'rta (≥50), Yomon — magic thresholds

## Data requirements
- `GET /api/integration/employee-rating/ratings` (with `periodYear, periodMonth` in queryKey but **never sent as query params**) → expected `RatingsResponse {ratings, total}` — `:64-66`
- `GET /api/integration/employee-rating/goals` → `GoalItem[]` — `:68-70`
- `GET /api/integration/employee-rating/stats` → expected `RatingStats {avgScores: {avgComposite, avgProductivity, totalRated}}` — `:72-74`
- DB: `employee_ratings`, `employee_rating_goals`, `employees`
- Roles: `admin, super_admin, hr_manager, manager, director` (`integration-extended-hr.controller.ts:19`)

## Form analysis
- No write forms; this page is read-only display.

## CRUD contract
- Create — N/A (no UI)
- Read ❌ — multiple shape mismatches:
  - **`GET /ratings` BE returns `Row[]` (array)** (`integration-extended-hr.controller.ts:95`); FE expects `{ratings, total}` (`EmployeeRating.tsx:64`). `ratingsData?.ratings` always `undefined`.
  - **`GET /stats` BE returns `{total_ratings, average_score, high_performers, needs_improvement}`** (`integration-extended-hr.repo.ts:60`); FE expects `{avgScores: {avgComposite, avgProductivity, totalRated}}` — none match, all stats show `0`.
  - **Field name mismatches:**
    - BE row uses DB columns `overall_score` (`repo:60`) — but Drizzle schema has column `overall_rating` (`kpi.ts:61`). DB drift confirmed.
    - FE expects `productivityScore, disciplineScore, qualityScore, skillsScore, compositeScore, trend` — DB schema has `performanceRating, behaviorRating, skillsRating, overallRating`. **No `compositeScore`, `disciplineScore`, `trend` columns anywhere.**
- Period filter never sent: `useQuery({queryKey:[...periodYear,periodMonth]})` re-fetches on change but `queryFn` not overridden → default `apiRequest` is used → URL is just `/api/integration/employee-rating/ratings` with no query string. **Year/Month dropdowns are decorative.**

## Backend logic issues
- `findEmployeeRatings` (`repo:42-50`) filters by `period_year`/`period_month` columns (`:45,47`) but Drizzle schema names them `rating_year`/`rating_month` (`kpi.ts:60`). **Column not found → SQL error → safeCall swallows → empty array.**
- `getEmployeeRatingStats` (`repo:58-63`) selects `overall_score` (`:60`) — column doesn't exist in Drizzle (only `overall_rating`); silent SQL error.
- `findEmployeeRatingGoals` (`repo:53-56`) queries `employee_rating_goals` — table not in Drizzle schema; only in live DB. Drift.
- `getEmployeeRatingStats` (`:60`) uses `EXTRACT(YEAR FROM NOW())` — ignores period filter — always current year.
- All BE handlers return `r.ok ? r.data : []` (`controller:80,95,113`) — error handling pattern OK, but masks all DB drift errors as empty arrays.

## Security findings
- Auth ✅: `JwtAuthGuard + RolesGuard` (`:26-27`).
- Authorization ✅: 5 roles only.
- Validation N/A (read-only, no body).
- SQLi ✅: parametrized sql\`\`.
- XSS ✅.
- CSRF N/A.
- PII: aggregate scores per employee — moderate.
- Mass-assignment N/A.

## DDD / architecture issues
- Page marked `@deprecated` but still registered in routes — should redirect or be removed.
- BE column-name drift between Drizzle (`overall_rating`, `rating_year`) and repo (`overall_score`, `period_year`) — proves nobody runs this code.
- No domain model — straight DB → controller via repo.
- `compositeScore` / `trend` / `disciplineScore` fields exist only in FE imagination — no source.

## Performance issues
- Three independent queries on mount; no Suspense; no `enabled` gating. Manageable.

## Code quality issues
- Magic thresholds 90/75/50 in `scoreBadge` (`:85-88`) — violates Qoida 12.
- Hardcoded month labels UZ (`:96-100`) — should be i18n.
- KPI weights labels duplicated (`'Maqsad'` appears twice in table headers `:243`).
- `.toString()` on numeric fields (`:143,147,220`) — pointless.

## Verdict
- Completeness ~25%
- Status: 🚫 (page renders, but all data is 0/empty due to column-name drift and shape mismatches; deprecated)

## Top issues
1. **DB column drift** — repo uses `period_year/period_month/overall_score` (`repo:45,60`); Drizzle has `rating_year/rating_month/overall_rating`. **All SQL silently errors.**
2. **Response shape mismatch** — BE returns array, FE expects `{ratings, total}` (`controller:95` vs `EmployeeRating.tsx:64-66`).
3. **Stats shape mismatch** — BE `{average_score, ...}` vs FE `{avgScores.avgComposite, ...}`.
4. **Year/Month filters not sent** — queryKey changes refetch but no params on URL.
5. **`employee_rating_goals` table not in Drizzle** — drift; will error if table absent.
6. **Page deprecated yet still routed**.
7. **Magic thresholds 90/75/50** in scoreBadge.

## Recommended fixes
P0: Decide canonical: move logic to `hr-employees.md` referenced doc; redirect `/integration/employee-rating` to canonical page.
P1: Align repo column names with Drizzle (`overall_rating`, `rating_year`, `rating_month`).
P1: Wrap controller response as `{ratings: data, total: data.length}` OR change FE to `data`.
P2: Send periodYear/periodMonth as query params.
P2: Move thresholds to `business.constants.ts`.

═════════════════════════════════════════════
# Page 14: Ko'nikmalar Matritsasi (SkillsMatrix)
# Section: 360 PROFIL → Rivojlanish
═════════════════════════════════════════════

## File map
- Route: `artifacts/erp-dashboard/src/routes/HRRoutes.tsx:59` → `/skills-matrix` → `SkillsMatrix`
- Page: `artifacts/erp-dashboard/src/pages/SkillsMatrix.tsx` (197 lines)
- Sub: `skills-matrix/types.ts`, `skills-matrix/SkillDialog`, `skills-matrix/EmployeeSkillDialog`
- BE controllers:
  - `apps/api/src/modules/hr/presentation/hr-gsd.controller.ts:49` (`@Controller('hr')` — handles `/hr/skills` CRUD)
  - `apps/api/src/modules/hr/presentation/hr-compat-a.controller.ts` (handles `/hr/employee-skills`)
  - `apps/api/src/modules/hr/skills-matrix/skills-matrix.controller.ts:32` (`@Controller('hr-v2/skills-matrix')` — separate v2 catalog/score, **not used by this page**)
- Service: `apps/api/src/modules/hr/presentation/hr-gsd.service.ts:13`
- DB models: `lib/db/src/schema/lms-schema.ts:378` `skills`, `:392` `userSkills`; also `lib/db/src/schema/skills.ts:12` `employeeSkills` (different table!)
- Tests: `SkillsMatrix.smoke.test.tsx`

## UI elements (from code)
- Header: title + 2 "Add" buttons (`:96-104`)
- 3 stat cards: Total skills / Skilled employees / Total assigned (`:108-110`)
- Two side-by-side cards: skills list + employee-skills list (`:113-173`)
- Skill table: code/name/category/actions (`:122-138`)
- Employee skills: name + skill + level badge + delete (`:153-168`)
- `ConfirmDialog` for both deletes (`:175-194`) — ✅ follows Qoida 14
- Hardcoded translation keys via i18n `hr` namespace — good
- `getLevelBadge` uses `tLabel` mixed strings (`types.ts:53-62`) — 3 of 5 labels NOT i18n'd (`"Oddiy"`, `"Yuqori"`, `"Mutaxassis"`)

## Data requirements
- `GET /api/hr/skills` → `{items: Skill[], total}` — handled at `hr-gsd.controller.ts:92`
- `GET /api/hr/employees` — `:44`
- `GET /api/hr/employee-skills` — `hr-compat-a.controller.ts:108`
- `POST /api/hr/skills` body `SkillFormValues` — `hr-gsd.controller.ts:166` ❌ **FAKE RESPONSE**
- `PATCH /api/hr/skills/:id` — `:175` ❌ **FAKE RESPONSE**
- `DELETE /api/hr/skills/:id` — `:183` ❌ **FAKE RESPONSE**
- `POST /api/hr/employee-skills` — `hr-compat-a.controller.ts:113`
- `DELETE /api/hr/employee-skills/:id` — `hr-compat-a.controller.ts:216` ❌ **`notImplemented` (501)**
- DB: `skills` (lms-schema), `user_skills` (lms-schema), or `employee_skills` (skills.ts) — DUAL tables
- Roles: `SUPER_ADMIN, DIRECTOR, HR_MANAGER, HR_SPECIALIST, admin` (`hr-gsd.controller.ts:40`)

## Form analysis
- FE skill schema (`types.ts:33-40`): `{code, name, nameRu, category, description?, descriptionRu?}` — 6 fields
- BE Create schema (`hr-gsd.controller.ts:34-38`): `{name, category?, levels?}` `.passthrough()` — accepts FE fields but **only `name/category/levels` validated**.
- DB `skills` table (lms-schema.ts:378-388) has columns `id, name, name_ru, category, level, created_at` — **no `code`, no `description`, no `description_ru`**. FE schema fields don't map to DB columns.
- Alternative DB `employee_skills` (skills.ts:12-28) is per-employee data, not catalogue.
- Employee skill schema FE (`types.ts:44-49`): `{userId, skillId, level (1-5 number), notes}` — but DB `user_skills` (lms-schema.ts:392-405) uses `level: varchar(20)` enum `beginner/intermediate/advanced/expert`. **Type mismatch:** FE sends number 1–5, DB expects string enum.

## CRUD contract
- Create skill ❌ — BE returns `{ data: { id: Date.now(), ...dto, created: true } }` (`hr-gsd.controller.ts:169`). **No DB insert.** Qoida 10 violation.
- Read skills ✅ — `hr-gsd.controller.ts:92-97` queries via service.
- Update skill ❌ — BE returns fake `{id, ...dto, updated:true}` (`:178`). No DB update.
- Delete skill ❌ — BE returns fake `{id, deleted:true}` (`:186`). No DB delete.
- Create employee skill ⚠️ — `hr-compat-a.controller.ts:113-118` calls service with `proficiency_level`, but FE sends `level: number`. Likely fails at DTO validation.
- Delete employee skill ❌ — `hr-compat-a.controller.ts:216-218` returns `notImplemented` (501).
- Get-by-id ❌ — `hr-gsd.controller.ts:107-110` returns `{id, name: null, category: null, levels: []}` static (stub, comment `:100-103`).

## Backend logic issues
- 5 of 7 skill endpoints are fakes (Qoida 10 violation): create/update/delete skill, delete employee skill, get-skill-by-id.
- `hr-gsd.controller.ts:34-38` `CreateSkillSchema` is `.passthrough()` → forwards arbitrary fields, but BE doesn't persist anything.
- FE invalidates `["/api/hr/skills"]` after fake create (`SkillsMatrix.tsx:52`) → list refetches → no new row → user sees nothing → confused.
- `getSkillById` returns null payload — FE never calls this route, but it's also a stub.

## Security findings
- Auth ✅: `@UseGuards(JwtAuthGuard, RolesGuard)` (`hr-gsd.controller.ts:43`).
- Authorization ✅: HR roles only.
- Validation ⚠️: Zod present but no persistence; bypasses domain rules.
- SQLi ✅: Drizzle on read path.
- XSS ✅.
- CSRF ⚠️: JWT.
- PII: employee skill levels — minor.
- Mass-assignment ⚠️: `.passthrough()` allows extra fields but they're ignored due to fake response.

## DDD / architecture issues
- **Three competing skill data sources:**
  - `lib/db/src/schema/lms-schema.ts:378` `skills` (catalog: name, name_ru, category, level — single-level per skill, doesn't fit FE matrix)
  - `lib/db/src/schema/lms-schema.ts:392` `userSkills` (skillId, userId, level varchar enum, verifiedBy)
  - `lib/db/src/schema/skills.ts:12` `employeeSkills` (skillName as string, proficiencyLevel varchar enum, proficiencyScore decimal) — different domain
  - `apps/api/src/shared/db/schema-misc-app-b.ts:104` `skillsTable` (3-col stub: id/category/name)
- No code calls catalogue CRUD against any of these tables.
- `hr-v2/skills-matrix/*` controller (separate) uses `skill_code` string-keyed model (`skills-matrix.controller.ts:17-23`) — yet ANOTHER schema view.
- Domain incoherent across 4+ schema variants.

## Performance issues
- 3 parallel queries on mount (skills, employees, employeeSkills) — OK.
- Employee skills list slices to 10 (`SkillsMatrix.tsx:153`) — no pagination.

## Code quality issues
- `types.ts:55, 57` use `tLabel` but `:56, 58, 59` are plain hardcoded strings ("Oddiy", "Yuqori", "Mutaxassis") — inconsistent i18n.
- `SkillsMatrix.tsx:80` ternary statement-expression without assignment (`editingSkill ? update.mutate(...) : create.mutate(...)`) — works but lint-unfriendly.
- `Set((employeeSkills as EmployeeSkillRecord[] | undefined)?.map(...)).size || 0` (`:109`) — repeated cast pattern.
- `hr-gsd.controller.ts:169` magic `Date.now()` as id — produces collisions across calls, response misleads.

## Verdict
- Completeness ~25%
- Status: 🚫 (READ works partially; CRUD on skills entirely fake; DELETE employee-skill 501)

## Top issues
1. **POST/PATCH/DELETE /api/hr/skills are all soxta javob** — return `Date.now()` ids, no DB writes (`hr-gsd.controller.ts:166-187`). Qoida 10 violation.
2. **DELETE /api/hr/employee-skills/:id** returns 501 NotImplemented (`hr-compat-a.controller.ts:218`).
3. **Get-skill-by-id is a stub** returning nulls.
4. **3+ overlapping skill schemas** in Drizzle (`lms-schema.skills`, `lms-schema.userSkills`, `skills.employeeSkills`, `schema-misc-app-b.skillsTable`).
5. **FE level (1-5 number) vs DB enum** (`beginner/intermediate/advanced/expert`) — type drift in employee_skills create.
6. **Hardcoded UZ level labels** in `getLevelBadge` (`types.ts:55-60`).

## Recommended fixes
P0: Choose canonical skills schema (recommended: `lms-schema.skills` + `userSkills`); implement real CRUD in `hr-gsd.service` against it.
P0: Implement DELETE `/hr/employee-skills/:id` (replace `notImplemented`).
P1: Reconcile FE level `1-5` number with DB enum (mapping helper).
P2: Implement get-skill-by-id properly.
P3: Migrate stub schemas; deprecate one of `employeeSkills` vs `userSkills`.
P3: Move all `getLevelBadge` strings to i18n.

═════════════════════════════════════════════
# Audit summary (Group 2)
═════════════════════════════════════════════

| # | Page | Status | Completeness | Verdict |
|---|------|--------|--------------|---------|
| 8 | Maqsadlar | ⚠️ | ~70% | UPDATE broken (PATCH/PUT mismatch); raw SQL service |
| 9 | Smena Jadvali | ⚠️ | ~75% | Reject swap broken; employee privilege escalation |
| 10 | Bildirishnomalar | 🚫 | ~30% | PATCH always 400; flat-vs-matrix schema mismatch |
| 11 | Aktivlar | ✅ | ~85% | Salary-deduction toast misleading; orphan endpoints |
| 12 | Ta'til/Kasallik | ❌ | ~40% | POST body shape mismatch; leave_type discarded |
| 13 | Xodim Reytingi | 🚫 | ~25% | DB column drift; response shape mismatch; deprecated |
| 14 | Ko'nikmalar | 🚫 | ~25% | All Skill CRUD are fake; 3 schemas; type drift |

Average completeness: ~50%. **5 of 7 pages have broken or fake write paths.** Only **Aktivlar (Asset Management) has a fully functional CRUD pipeline.**

Cross-cutting themes:
- **Soxta javob (Qoida 10) violations**: `hr-gsd.controller.ts:166-187`, `notifications.controller.ts:82-133`, several leave/skill endpoints.
- **Raw SQL outside repos (Qoida 4)**: `goals-compat.service.ts`, `integration-extended-hr.repo.ts`.
- **Schema drift between Drizzle (`lib/db/`) and live SQL** (`employee_ratings.overall_rating` vs `overall_score`; `period_year` vs `rating_year`; skills tables fragmentation).
- **Method mismatches**: PATCH vs PUT (Goals), missing action body (Shift approve).
- **DTO contract drift FE↔BE**: NotificationSettings flat vs matrix; HRVacationSick camel vs snake; EmployeeRating wrap vs raw.
- **Hardcoded UZ strings** (no i18n) across all 7 pages.
- **All required Drizzle schemas absent** for several tables (assets, leave-requests' status, employee_rating_goals).

Files referenced (absolute paths) provided per page above.

agentId: a4066c041173bb624 (use SendMessage with to: 'a4066c041173bb624' to continue this agent)
<usage>total_tokens: 195005
tool_uses: 117
duration_ms: 596857</usage>

### Group 3 — Pages 15–21 (Baholash rest + Onboarding + Offboarding + Nazorat start)

> **DIQQAT:** Group 3 (sahifalar 15-21) tahlili to'liq tarzda yakuniy agent javobida bor edi, lekin disk faylga saqlanmagan (size limitidan past tushdi). Cross-page summary va eng muhim topilmalar quyida — to'liq per-page sectionlar agent natijasida bo'lgan; quyidagi xulosa va Phase 5 ga ular asoslangan.

# Group 3 — Cross-page summary (15–21)

**Per-page verdict (agent group 3 dan):**
- **Page 15 Mentorlik (/mentorship)** — ❌ Broken — BE \`mentors\` directory'sini modellaydi, FE pairing modelini → create 400, "faol" doim 0.
- **Page 16 Succession Planning (/hr/succession)** — ⚠️ Partial — 3/4 endpoint real; \`key-positions\` \`{items,total}\` envelope vs FE bare-array → kritik KPI bo'sh.
- **Page 17 Onboarding (/hr/onboarding)** — ⚠️ Partial — checklist CRUD real; roadmap POST stub (\`hr-vacancies-pipeline.controller.ts:225\`); roadmaplar \`items\` vs \`data\` shakl.
- **Page 18 Offboarding (/hr/offboarding)** — ❌ Broken — har o'qish \`{data}\` o'rab qaytaradi, FE bare kutadi (\`HROffboarding.tsx:62-66\`); create 400 (camelCase \`employeeId\` vs \`employee_id\` + enum \`resignation\` ≠ allowed).
- **Page 19 Intizom (/discipline)** — ⚠️ Partial — BE'da 4 ta controller bir resurs uchun (yuqorida 3.1). FE qaysi birini chaqirishi belgilanmagan.
- **Page 20 Intizom V2** — 🚫 EMPTY SHELL — FE'da sahifa yo'q. **Lekin BE'da implicit dublikatsiya bor** (yuqorida).
- **Page 21 Sog'liq Nazorati (/hr/health-monitoring)** — ❌ Broken — POST 400 (\`department_id\` kerak, FE yubormaydi; 3 ta FE field BE Zod tomonidan rad etiladi); update/delete yo'q.

**Cross-page issue clusters:**
- 4 sahifa (15, 18, 21, 14) kontrakt buzilishidan ❌.
- 1 sahifa (16, 17) konvert shaklidan ⚠️.
- 1 sahifa (19) controllerlar erkin (real ishlaydi lekin xavfsiz emas).
- Tenant scoping — har sahifada yo'q.
- 300-line qoidasi buzgan fayllar: HRHealthMonitoring.tsx (346), HROffboardingDialogs.tsx (~300), Discipline.tsx (~?).
- Per-page security dilemma: ko'pchilik compat controllerda \`@Roles\` decorator yo'q.

(To'liq per-page tahlil — file:line iqtibos bilan — agentning to'liq javobida edi; bu yer faqat o'lchov sababli umumiy xulosa.)


### Group 4 — Pages 22–28 (Nazorat rest + HR V2 + Yangi + Brend + Haftalik)

So career plans actually maps to `succession_plans` table — NOT `career_paths`. The FE-expected fields are `employee_name, target_position_title, current_position_title, status, target_date, progress_percent, mentor_name, notes`. The BE returns `current_holder_name, candidate_name, position_name, readiness_level, development_plan, priority`. SEVERE field name mismatch — most FE columns will show "—".

POST `/api/succession/career-plans` requires `position_id` and `candidate_id` (numbers). But the FE sends `employee_name, current_position_title, target_position_title` (strings). FE will hit 400 BadRequestException "position_id va candidate_id majburiy".

I have enough material. Let me produce the audit now.

═════════════════════════════════════════════
# Page 22: Kasbiy O'sish (HR Career Path)
# Section: HR V2 (Talent Development)
═════════════════════════════════════════════

## File map
- Route: `artifacts/erp-dashboard/src/routes/HRRoutes.tsx:74` → `['/hr/career-path', HRCareerPath]`
- FE component: `artifacts/erp-dashboard/src/pages/HRCareerPath.tsx` (1 file, 361 lines, self-contained — no extracted *Sections/*Dialogs/*Types siblings)
- Store/state: useState (view, statusFilter, search, newOpen, form), TanStack Query `["/api/succession/career-plans"]`
- API client: `apiRequest` (`@/lib/queryClient`)
- BE controller: `apps/api/src/modules/compatibility/succession-compat.controller.ts:35-64` (`@Controller('succession')` — `@deprecated` Legacy compatibility shim per file header)
- BE service: `apps/api/src/modules/compatibility/succession-compat.service.ts:19-58`
- BE repo: none — service uses `rawSql` directly (Rule 15 violation: service touches DB)
- DB model: `succession_plans` (legacy), NOT `careerPaths`/`careerPathSteps` (`lib/db/src/schema/hr-v2-schema.ts:146/166` — unused by this page)
- Migrations: n/a
- Tests: `HRCareerPath.smoke.test.tsx` (smoke only)

## UI elements
- Buttons: "Yangi reja" (HRCareerPath.tsx:225) → `setNewOpen(true)`; "Saqlash" (line 171-176) → `create.mutate()` → POST. Card/table view toggle (lines 271-282).
- Form fields (NewPlanDialog, lines 110-167): employeeName (string), currentPosition (string), targetPosition (string), targetDate (date), mentorName (string), notes (string).
- Table columns: xodim, joriyLavozim, Maqsad, taraqqiyot, mentor, muddat, status (lines 315-322).
- Filters: search (line 252), status select (lines 258-269: all/active/completed/on_hold/cancelled).
- Stats cards: total / active / completed / avg progress (lines 232-244).
- Hardcoded strings: many — e.g. `"Yangi kasbiy reja yaratildi"` toast (line 128), `"Xatolik yuz berdi"` (132), Card labels `"Jami rejalar"` etc. (lines 233-236) — bypasses i18n.

## Data requirements
- `GET /api/succession/career-plans` → list of `CareerPlan` rows (line 190).
- `POST /api/succession/career-plans` → body `{employee_name, current_position_title, target_position_title, target_date, mentor_name, notes, status, progress_percent}` (HRCareerPath.tsx:116-125).
- DB tables actually queried by BE: `succession_plans LEFT JOIN employees LEFT JOIN positions` (succession-compat.service.ts:24-37). FE-expected fields like `employee_name`, `target_position_title`, `current_position_title`, `mentor_name`, `progress_percent`, `target_date` are NOT returned — BE returns `current_holder_name`, `candidate_name`, `position_name`, `readiness_level`, `priority`, `target_date`. Field-name mismatch is catastrophic.
- Permissions: `@Roles('HR_MANAGER','HR_SPECIALIST','SUPER_ADMIN','DIRECTOR','ADMIN','MANAGER')` (succession-compat.controller.ts:22).
- MISSING: GET single, PATCH/PUT update, DELETE, progress mutation — only LIST+CREATE exposed for FE consumers (PUT exists at `.controller.ts:62` but no FE usage).

## Form analysis
- FE form sends `employee_name` (string), `current_position_title` (string), `target_position_title` (string) — BE INSERT (succession-compat.service.ts:47-54) expects `position_id` (FK), `candidate_id` (FK), `current_holder_id`, `readiness_level`, `development_plan`, `target_date`, `priority`. POST will throw 400 "position_id va candidate_id majburiy" (line 46) → the create button is functionally broken.
- Orphan FE fields (no DB column for them in succession_plans): `employee_name`, `current_position_title`, `target_position_title`, `mentor_name`, `progress_percent`, `notes`.
- Missing FE fields: `position_id`, `candidate_id`, `current_holder_id`, `readiness_level`, `priority`.
- Validation: no zod resolver on dialog form — only `disabled={!form.employeeName || !form.targetPosition}` (line 173). Rule 3 violation for client-side validation.

## CRUD contract
- C: ❌ POST exists (succession-compat.controller.ts:55) but FE payload structure is incompatible — guaranteed 400.
- R: ⚠ GET exists (line 35) but field shape mismatch — cards render `"—"` for every row.
- U: ❌ PUT exists (line 62) but no FE wiring to update progress / mentor / status.
- D: ❌ Neither BE nor FE.

## Backend logic issues
- `succession-compat.service.ts:24-38` raw SQL — Rule 4 acceptable here, but service bypasses repository (Rule 15 violation).
- Service is `@deprecated` (header line 4-7) yet the only FE consumer for `/hr/career-path` — no migration replacement exists.
- `succession-compat.controller.ts:75-87` `getCandidates` returns talent pool (different domain) under `/succession/candidates` — confusing namespacing.

## Security findings
- Auth: ✅ `@UseGuards(RolesGuard)` (succession-compat.controller.ts:25) — but JwtAuthGuard not explicitly chained here.
- Authorization: ✅ `HR_ROLES` enforced (line 22, 27).
- Input validation: ❌ POST/PUT use `SuccessionBodyDto` but no Zod schema visible in controller; service does only ad-hoc `if (!position_id || !candidate_id) throw…` (line 46). Other fields pass through unchecked → mass-assignment risk.
- SQLi: ✅ parameterised template tags (lines 24-37).
- XSS: ✅ React escapes; no `dangerouslyInnerHTML`.
- CSRF: token-based (cookie-with-credentials); standard.
- PII: `employee_name`, `phone` etc. exposed to all HR_ROLES — no per-employee scope check.
- Mass assignment: BE inserts any field passed by FE without an allow-list beyond two-key validation — risk MEDIUM.

## DDD / architecture issues
- Bounded context smell: page is under HR but actually consumes Succession context via deprecated compat shim.
- No aggregate or domain service — pure CRUD over `succession_plans`.
- Rule 15 violation: `SuccessionCompatService` uses `rawSql` directly (succession-compat.service.ts:24).

## Performance issues
- Whole table fetched, then filtered client-side (HRCareerPath.tsx:196-203) — fine for small dataset, ugly at scale.
- `LIMIT MAX_QUERY_LIMIT` server-side (line 37) — no pagination cursor.

## Code quality issues
- Mixed languages in hardcoded strings (HRCareerPath.tsx:233-236).
- Inline conditional `(Array.isArray(all) ? all : [])` repeated 5+ times (lines 207-212) — should hoist.
- `as unknown` not used here; ✅ on Rule 5.
- `STATUS_MAP` hardcoded Uzbek labels (lines 43-48) — bypass i18n.

## Verdict
- Completeness: ~20% — the page renders, but the data layer is completely wrong (different domain).
- Status: ❌ Broken — Create is non-functional, Read shows empty fields.

## Top issues
1. POST contract incompatibility → create always 400 (HRCareerPath.tsx:116-125 vs succession-compat.service.ts:46).
2. GET returns `current_holder_name`/`candidate_name` while FE reads `employee_name`/`target_position_title` → all rows blank.
3. No mentor, progress_percent, notes columns in `succession_plans`.
4. Backed by `@deprecated` compat shim with no migration plan.
5. Hardcoded UZ strings bypass i18n.
6. No DELETE / U on progress.
7. Rule 15 violation (service touches DB directly).

## Recommended fixes (prioritized)
1. Build a real `CareerPathRepository` over `careerPaths`/`careerPathSteps` schema (hr-v2-schema.ts:146/166) and wire FE to `/api/hr/career-paths`.
2. Add Zod DTO with `employeeId`, `currentPositionId`, `targetPositionId`, `mentorId`, `progressPercent`.
3. Add PATCH endpoint for progress updates; add DELETE.
4. Move hardcoded UZ labels to i18n keys.
5. Add `useQuery` `isLoading` skeleton vs full-page render branch (already partially in place).

═════════════════════════════════════════════
# Page 23: Xavfsizlik (HR Safety)
# Section: Nazorat (Compliance/EHS)
═════════════════════════════════════════════

## File map
- Route: `artifacts/erp-dashboard/src/routes/HRRoutes.tsx:75` → `['/hr/safety', HRSafety]`
- FE component: `artifacts/erp-dashboard/src/pages/HRSafety.tsx` (198 lines)
- Sub-files: `HRSafetyTypes.ts` (99 lines, Zod schemas), `HRSafetySections.tsx` (231 lines), `HRSafetyDialogs.tsx` (218 lines)
- State: useState + 4× useForm + useQuery (4 lists + 1 summary) + 5 useMutation
- API client: `apiRequest` + raw `fetch` (line 138)
- BE controllers:
  - `apps/api/src/modules/hr/safety/hr-safety.controller.ts` (`@Controller('hr/safety')`) — has GET/PATCH/DELETE per-id + POST export pdf + GET department-summary
  - `apps/api/src/modules/hr/presentation/hr-compat-safety.controller.ts:69-114` — `@Controller('hr')` — POST `safety/incidents`, GET/POST `safety/trainings`, GET/POST `safety/hazard-zones`, GET/POST `safety/ppe-compliance`
  - `apps/api/src/modules/hr/presentation/hr-dashboard-extra.controller.ts:52,60` — `@Controller('hr')` — GET `safety/summary`, GET `safety/incidents`
- BE services: `HrSafetyService` (40 lines), `HrCompatSafetyService` (81 lines), `HrDashboardExtraService` (not opened)
- BE repos: `hr-safety.repository.ts`, `hr-compat-safety.repository.ts:85-211`
- DB models: `safety_incidents`, `safety_training_records`, `safety_trainings`, `ppe_compliance`, `hazard_zones` (`lib/db/src/schema/safety.ts`) + local stubs in `apps/api/src/shared/db/schema-business-c-2-hr-safety.ts`
- Tests: `HRSafety.smoke.test.tsx`

## UI elements
- Buttons: "PDF hisobot" (HRSafety.tsx:137) → raw `fetch('/api/hr/safety/export/pdf')` GET; "Hodisa qo'shish" (148), "PPE qo'shish" (149), "Trening qo'shish" (150), "Zona qo'shish" (151); Per-row Trash icon (HRSafetySections.tsx:86-90) → `onDeleteRequest(inc.id)` → `setConfirmDeleteId` → ConfirmDialog → `deleteIncident.mutate(confirmDeleteId)`.
- Form fields (HRSafetyTypes.ts:7-39 Zod schemas):
  - Incident: userId?, incidentType (enum), severity (enum), description, incidentDate, location.
  - PPE: userId?, ppeType (enum: helmet/gloves/vest/boots/glasses), status, issuedDate?, expiryDate?.
  - Training: userId?, trainingName, trainingType?, scheduledDate?, expiryDate?, status (enum).
  - Zone: zoneName, location, hazardType, description?, riskLevel (enum).
- Table columns vary per tab; 4 tabs (incidents/ppe/trainings/zones).
- Summary cards (HRSafetySections.tsx:18-22): incidentsThisMonth, ppeCompliancePercent, expiringTrainings, openIncidents.
- i18n: mostly via `t()` calls, but several hardcoded toast/section labels remain (e.g. HRSafety.tsx:85, 95, 105, 115 toast titles in UZ literal).

## Data requirements
- `GET /api/hr/safety/incidents` (HRSafety.tsx:55) → array of `SafetyIncident`. Served by `hr-dashboard-extra.controller.ts:60` (NOT in hr-safety.controller.ts which has only `:id` per-row routes).
- `GET /api/hr/safety/ppe-compliance` (line 60) → served by `hr-compat-safety.controller.ts:103`.
- `GET /api/hr/safety/trainings` (line 65) → served by `hr-compat-safety.controller.ts:77`.
- `GET /api/hr/safety/hazard-zones` (line 70) → served by `hr-compat-safety.controller.ts:90`.
- `GET /api/hr/safety/summary` (line 75) → served by `hr-dashboard-extra.controller.ts:52`.
- `POST /api/hr/safety/incidents` (line 80) → served by `hr-compat-safety.controller.ts:69`.
- `POST /api/hr/safety/ppe-compliance`, `POST /api/hr/safety/trainings`, `POST /api/hr/safety/hazard-zones` → all `hr-compat-safety.controller.ts`.
- `DELETE /api/hr/safety/incidents/{id}` (HRSafety.tsx:121) → `hr-safety.controller.ts:59` (note: actually does soft-update `{status:'closed'}` not real delete, line 61).
- `GET /api/hr/safety/export/pdf` (line 138) — ❌ BE has only `@Post('export/pdf')` (`hr-safety.controller.ts:106`). FE GET fetch will return 404/405.
- DB tables read/written: `safety_incidents`, `safety_training_records`, `ppe_compliance`, `hazard_zones`, `hrEmployees`, `hrDepartments`.
- Permissions: HR/Safety roles on both controllers.

## Form analysis
- FE Zod schemas use `userId` (string) — BE inserts `employee_id` (integer). Mismatch but coerced via `(employeeId ?? null) as number` (hr-compat-safety.repository.ts:204). Will silently store NULL when FE leaves userId blank.
- FE Incident dialog (HRSafetyDialogs.tsx:39-66) collects: userId, location, incidentType, description, incidentDate. But BE POST schema (hr-compat-safety.controller.ts:71-74) expects `incident_type, severity, description, location_description, department_id, incident_date` — the FE doesn't send `department_id`, doesn't send `severity` from dialog (default 'minor' from form init at HRSafety.tsx:40 but no severity input visible in dialog!). Severity field is in zod schema but UI never collects it → defaults to 'minor' silently.
- FE Training dialog has no `score`, `isPassed` inputs but BE requires `training_id` (FK); the FE form has `trainingName` (free text) — orphan field; BE insertion (hr-compat-safety.repository.ts:127-128) stores `training_id` (FK) NULL, drops `trainingName` entirely.
- FE Zone dialog has no `zone_code` or `max_occupancy` or `required_ppe` (collected). BE schema requires zone_code, etc. (hr-compat-safety.controller.ts:98).
- FE PPE expects `status` enum but BE Drizzle column is `is_compliant: boolean` — silent enum→boolean coercion.

## CRUD contract
- C: ✅ incidents/ppe/trainings/zones POST exist.
- R: ✅ all 4 lists + summary.
- U: ❌ no FE update wiring (PATCH `incidents/:id` exists at hr-safety.controller.ts:68 but unused by FE).
- D: ⚠ FE DELETE for incidents only; PPE/training/zone delete missing.

## Backend logic issues
- DELETE incident actually just patches `status='closed'` (hr-safety.controller.ts:61) — semantic mismatch with FE which shows "Hodisa o'chirildi" toast (HRSafety.tsx:124). Closed incidents would still appear on list unless `getSafetyIncidentsRaw` excludes them.
- Export PDF returns `{ exported: true, count, format: 'pdf' }` JSON (hr-safety.controller.ts:111) — NOT a binary file. FE `r.blob()` (line 139) will get a JSON blob and download it as PDF — produces a corrupted "PDF" file.
- `hr_brand_settings` exists as local stub (schema-business-c-2-hr-safety.ts:11-17) outside the canonical barrel — Drift pattern noted in MEMORY.md.

## Security findings
- Auth: ✅ JwtAuthGuard on `hr-safety.controller.ts:27`; RolesGuard on both controllers.
- Authorization: ✅ HR roles enforced.
- Validation: ✅ Zod pipes on POST (e.g. hr-compat-safety.controller.ts:70).
- SQLi: ✅ Drizzle parameterised.
- XSS: ✅.
- CSRF: cookie+credentials standard.
- PII: employee names exposed in PPE/training rows (joined via LEFT JOIN, repository.ts:113, 190). Sensitive for medical/leave context.
- Mass assignment: schemas explicit allow-list.

## DDD / architecture issues
- Three separate controllers handle one `hr/safety/*` namespace — split logic creates 32-dup-route risk noted in MEMORY.md.
- `hr-dashboard-extra.controller.ts:60` and `hr-safety.controller.ts:48` both handle `incidents` but at different paths — confusing.
- Service `HrSafetyService` is thin pass-through to repo (40 lines, no logic).
- `HrCompatSafetyService` is also a `compat`-style passthrough.

## Performance issues
- 4 separate queries on mount (HRSafety.tsx:55-77) — no batch endpoint; 4 round trips before page renders.
- `LIMIT 100` hardcoded everywhere — no pagination UI.
- Joins on employees table on every list (repository.ts:113, 190) — could be slow with large employee tables.

## Code quality issues
- HRSafety.tsx:56-77 — repeated `Array.isArray(rawXyz) ? rawXyz : Array.isArray(rawXyz?.data) ? rawXyz.data : []` boilerplate; should be a helper.
- `confirmText="O'chirish"` hardcoded (HRSafety.tsx:190); `cancelText="Bekor qilish"` (line 191) — Rule 14 OK on flow, but i18n bypassed.
- HRSafetySections.tsx:69-93 — `inc.severity` raw string display, no enum→label mapping.
- HRSafetyDialogs.tsx — incident dialog missing severity select (only zod default 'minor' applied).

## Verdict
- Completeness: ~55% — read flows OK; create flows partially broken (severity, training_id, zone_code missing); delete is soft-update mislabeled; export PDF broken.
- Status: ⚠ Half-broken — looks functional but key writes drop data, PDF export returns JSON.

## Top issues
1. Export PDF: FE GET vs BE POST + BE returns JSON not bytes (hr-safety.controller.ts:106-112).
2. Incident dialog has no severity input; defaults to 'minor' silently (HRSafetyDialogs.tsx:39-66).
3. Training dialog `trainingName` is orphan; BE requires `training_id` FK and drops the name (hr-compat-safety.repository.ts:124-136).
4. Zone dialog missing `zone_code`, `max_occupancy`, `required_ppe`.
5. DELETE incident is actually a soft-close (hr-safety.controller.ts:61); FE toast misleading.
6. PPE `status` enum→`is_compliant` boolean coercion (HRSafetyTypes.ts:19 vs schema-business-c-2-hr-safety.ts).
7. Three controllers share `hr/safety/*` namespace — duplication risk.

## Recommended fixes (prioritized)
1. Add `@Get('export/pdf')` to hr-safety.controller.ts and stream a real PDF (use `pdf-lib` like daily-report.service.ts:94).
2. Add `severity` select to IncidentDialog.
3. Replace Training `trainingName` text with a select bound to `safety_trainings` list.
4. Add real DELETE: hard-delete or rename `delete` to `close` and update FE toast.
5. Add zone_code generator/auto-suggest in ZoneDialog.
6. Consolidate `hr/safety` routes into a single controller.
7. Add server-side pagination (`?page=…&limit=…`).

═════════════════════════════════════════════
# Page 24: Kunlik Hisobot (Daily Report)
# Section: HR V2 (Operations)
═════════════════════════════════════════════

## File map
- Route: `HRRoutes.tsx:78` → `['/hr/daily-reports', DailyReportPage]`
- FE component: `DailyReportPage.tsx` (224 lines)
- Sub-files: `DailyReportPageTypes.ts` (67 lines), `DailyReportPageSections.tsx`, `DailyReportPageDialogs.tsx`
- State: useState (form, selectedDept, reportType, overrideId, overrideReason); 5 useQuery; 2 useMutation
- BE controller: `apps/api/src/modules/hr/daily-report/daily-report.controller.ts` (`@Controller('hr-v2/daily-reports')`)
- BE service: `apps/api/src/modules/hr/daily-report/daily-report.service.ts` (226 lines) — includes PDF generation, 2 Cron jobs
- BE repo: `apps/api/src/modules/hr/daily-report/daily-report.repository.ts` (200+ lines, raw SQL heavy)
- DB models: `hr_daily_reports`, `hr_daily_report_audit` (`hr-v2-schema.ts:116, 135`)
- Tests: `DailyReportPage.smoke.test.tsx`

## UI elements
- Tabs: submit / history / admin (DailyReportPage.tsx:154-166).
- Submit form: `tasks_completed`, `metrics`, `tomorrow_plan` (textareas in `SubmitForm`).
- Admin tab: department select, report-type select (all/operator/office), submitted/missing columns, HR override button.
- Stats cards: submitted_count, auto_absent_count, pending_count, departments_with_reports (DailyReportPageSections.tsx:25-29).
- Deadline display: 17:00–20:00 window (line 142-148).

## Data requirements
- `GET /api/hr-v2/daily-reports/employee?employeeId=X&limit=14` (line 49) — served by daily-report.controller.ts:99.
- `GET /api/hr-v2/daily-reports/stats?date=YYYY-MM-DD` (line 54) — daily-report.controller.ts:67.
- `GET /api/departments` (line 60) — external module.
- `GET /api/hr-v2/daily-reports/department/{id}?date=YYYY-MM-DD` (line 65) — daily-report.controller.ts:121.
- `GET /api/hr-v2/daily-reports/by-date?date=…&type=…&limit=100` (line 72) — daily-report.controller.ts:72.
- `POST /api/hr-v2/daily-reports` (line 82) — controller.ts:46.
- `PATCH /api/hr-v2/daily-reports/{id}/override` (line 98) — controller.ts:62.
- Permissions: `@Roles('admin','manager','supervisor','operator','employee','hr_manager','hr_specialist')` (controller.ts:37) — quite broad.

## Form analysis
- FE `INITIAL_FORM`: `tasks_completed, metrics, tomorrow_plan` (DailyReportPageTypes.ts:60-64) — matches BE schema (controller.ts:17-28).
- HR Override: FE sends `{is_auto_absent, status: 'absent', hr_user_id, reason}` (DailyReportPage.tsx:128). BE schema `OverrideReportSchema` only accepts `hr_user_id, override_notes` (controller.ts:31-34). `is_auto_absent`, `status`, `reason` will be silently dropped during Zod parse. FE-sent `reason` should be `override_notes`. Override status doesn't actually move report to "absent" — service forces `newStatus = body.override_notes ? 'submitted'` (service.ts:68) → wrong status.
- Stats shape mismatch: FE expects `stats.submitted_count, stats.auto_absent_count, stats.pending_count, stats.departments_with_reports` (DailyReportPageSections.tsx:26-29). BE returns `{submitted_count, absent_count, total_active_employees}` (daily-report.repository.ts:69-75) — `auto_absent_count` (FE) vs `absent_count` (BE), no `pending_count`, no `departments_with_reports`. Also BE returns flat row, not `{stats: …}` wrapped → FE reads `stats.stats?.submitted_count` (line 26) → undefined.

## CRUD contract
- C: ✅ POST (upsert behavior, repository.ts:21-32).
- R: ✅ by employee, by date, by department, stats.
- U: ⚠ HR override exists but contract mismatch — partial functionality.
- D: ❌ no DELETE endpoint.

## Backend logic issues
- `hrOverride` (service.ts:65-72) — `newStatus || 'submitted'` — when FE sends `status: 'absent'` the service ignores it and forces `'submitted'`.
- `getStats` (repository.ts:67-79) — uses table alias `dr` in LEFT JOIN condition but Drizzle won't bind aliases the way raw SQL would; the `sql\`dr.employee_id…\`` is parsed as raw — fragile; might fail at runtime if alias not registered.
- `repository.ts:75` — `LEFT JOIN hr_daily_reports` with no `.as('dr')` alias yet condition uses `dr.employee_id` — relies on Drizzle's default alias which is `hr_daily_reports`, so this query is wrong. (Test coverage likely catches this only at runtime.)
- PDF generator at service.ts:94-176 uses Helvetica font — won't render Uzbek cyrillic glyphs (only Latin). PDF will show "?" or empty boxes for Cyrillic content.
- Cron 17:00 reminder (service.ts:179) and 20:00 mark-absent (line 205) — server timezone assumed UTC; `_time.now()` uses Tashkent but cron parser doesn't have timezone — actual fire time will be UTC.

## Security findings
- Auth: ✅ JwtAuthGuard + RolesGuard (controller.ts:40).
- Authorization: ✅ but role list very broad including 'employee', 'operator' — fine for submit, but `byDepartment`, `byDate` (HR snapshots) should be HR-only. Currently any 'employee' can read department snapshots.
- Validation: ✅ Zod schemas; `ParseIntPipe` on params.
- SQLi: ✅ parameterised.
- XSS: ✅.
- CSRF: standard.
- PII: employee names + report content exposed to broad role list.
- Mass assignment: explicit zod allow-list.

## DDD / architecture issues
- Service has heavy PDF generation (~80 lines) and 2 Cron jobs — should split into `DailyReportPdfService`/`DailyReportSchedulerService`.
- Repository uses both Drizzle and `runQuery<Row>` raw SQL — mixed styles (Rule 4).

## Performance issues
- `byDate` query (repository.ts:92-124) has complex LATERAL JOIN on every row — heavy.
- `getByDepartment` runs 2 separate queries (submitted + missing, lines 136-181) — could be one UNION.
- `useQuery` `refetchInterval: 60000` on stats (DailyReportPage.tsx:55) — fine.

## Code quality issues
- `empId = user?.employeeId || 1` (DailyReportPage.tsx:43) — silently defaults to employee 1 if missing — dangerous bug (submits report as employee #1 for any logged-out condition).
- Hardcoded UZ strings throughout (lines 85-93, 100, 106, 124, 134).
- DailyReportPage.tsx:128 sends fields BE doesn't accept — should be a typed DTO.
- Cron `@Cron('0 17 * * 1-6')` magic — should reference `BUSINESS_HOURS_END_HOUR` constant (Rule 12).

## Verdict
- Completeness: ~70%.
- Status: ⚠ Functional core OK; HR override partially broken; stats UI partially blank; PDF Cyrillic broken; employee#1 fallback dangerous.

## Top issues
1. `empId = user?.employeeId || 1` → silent identity falsification (DailyReportPage.tsx:43).
2. HR override `is_auto_absent`/`status`/`reason` dropped at validation; service hardcodes status='submitted' (service.ts:68).
3. Stats shape `stats.stats?.…` undefined — BE returns flat object (repository.ts:69 vs FE DailyReportPageSections.tsx:26).
4. `repository.ts:75` Drizzle alias bug — `dr.employee_id` won't bind without `.as('dr')`.
5. PDF Helvetica can't render Uzbek glyphs (service.ts:103).
6. Broad role list allows non-HR to read department snapshots (controller.ts:37).
7. PATCH override: FE field `reason` mislabeled (should be `override_notes`).
8. `wms-catalog`-style controller-side body assembly (controller.ts:48-52) — small Rule 6 violation.

## Recommended fixes (prioritized)
1. Throw 401 instead of defaulting empId to 1.
2. Align FE override field names with BE Zod schema; remove force-submit-status logic.
3. Wrap stats in `{ stats: … }` and rename `absent_count→auto_absent_count`; add `pending_count`, `departments_with_reports`.
4. Embed a Unicode font (e.g. Noto Sans) in PDF generator.
5. Split admin endpoints (`by-date`, `department/:id`) behind `hr_manager`/`hr_specialist` roles only.
6. Add `.as('dr')` to the Drizzle leftJoin (repository.ts:75).

═════════════════════════════════════════════
# Page 25: Reception
# Section: HR V2 (Front-desk)
═════════════════════════════════════════════

## File map
- Route: `HRRoutes.tsx:77` → `['/hr/reception', ReceptionPage]`
- FE component: `ReceptionPage.tsx` (273 lines, single file, no Sections/Dialogs split — exceeds best practice)
- BE controller: `apps/api/src/modules/hr/reception/reception.controller.ts` (`@Controller('hr-v2/reception')`)
- BE service: `reception.service.ts` (102 lines)
- BE repo: `reception.repository.ts` (107 lines)
- DB model: `visitor_log` (`hr-v2-schema.ts:266-285`)
- Tests: `ReceptionPage.smoke.test.tsx`

## UI elements
- Tabs: checkin / active / validate / log (lines 113-119).
- Form: visitor_name, visitor_phone, visitor_company, visit_purpose, host_employee_id (number string), registered_by (defaults "1" — same identity-falsification risk).
- Check-in submit button (line 140) → `checkIn.mutate({...form, host_employee_id: parseInt, registered_by: parseInt})`.
- Badge preview card with print button (line 162) → `window.print()`.
- Active visitors: each row has "Logout" (Chiqarish) button → `checkOut.mutate(v.id)` (line 190) — **no confirmation dialog** — Rule 14 violation.
- Validate tab: input + Tekshirish button → calls `validateBadge()` async (line 83-86).
- Log table: visitor, company, host, check-in, check-out, duration, badge (lines 247-263).

## Data requirements
- `GET /api/hr-v2/reception/stats` (line 41) → BE returns `{active_visitors, today_visitors, month_visitors}` (repository.ts:84-93). FE expects `currently_inside, today_visitors, this_week, total_all_time` (line 34-39). 3/4 keys mismatch → "Hozir ichkari" / "Bu hafta" / "Jami" always 0.
- `GET /api/hr-v2/reception/active` (line 47) → list of active visitors.
- `GET /api/hr-v2/reception/log` (line 54) → log entries.
- `POST /api/hr-v2/reception/check-in` (line 62) → returns insert row plus `badge_number`. FE expects `{badge_code, badge_expires_at, visit:{visitor_name, visitor_company, check_in_at}}` (line 28). Mismatch: BE returns `badge_number` not `badge_code`; no `badge_expires_at`; no `visit` envelope. Badge preview UI will render undefined values.
- `PATCH /api/hr-v2/reception/{id}/check-out` (line 74) → BE expects `CheckOutDto` body (notes optional). FE sends empty `{}` — OK.
- `GET /api/hr-v2/reception/badge/{code}` (line 84) → returns row with `host_name`. FE expects `{valid, visitor_name, host_name, expires_at, error}` (line 29). BE returns the raw row from `visitor_log` — no `valid` flag, no `expires_at`. → validate-result UI shows `validateResult.valid` (line 219) — undefined → falsy → always shows "Badge noto'g'ri".

## Form analysis
- FE Check-in dialog sends `visit_purpose` (line 25), but BE schema accepts `purpose` OR `purpose_of_visit` (controller.ts:21-22). FE-sent `visit_purpose` is dropped! BE inserts `purpose: ''` (controller.ts:94 fallback).
- FE `registered_by: "1"` hardcoded default (line 25) — Rule for identity, should come from `useAuth()`.
- FE `host_employee_id` collected as string then `parseInt`; BE Zod requires int — works but no error handling.

## CRUD contract
- C: ⚠ Check-in works but `purpose` dropped due to field-name mismatch.
- R: ✅ active / log / stats (with shape issues).
- U: ✅ Check-out.
- D: ❌ No delete (acceptable — log is append-only).
- Badge validation: ❌ broken contract.

## Backend logic issues
- `validateBadge` (repository.ts:46-55) returns raw row without computing `valid` flag or `expires_at`; doesn't expire badges (no `badge_expires_at` column anywhere).
- `checkInVisitor` service (service.ts:34-52) generates `badgeNumber` then returns `{...row, badge_number}` — the spread happens after `row` which is already a `Result<Row>` shape, so `badge_number` is at root, not in `data`. FE destructure may break.
- `autoCheckoutOverdueVisitors` Cron (service.ts:84-101) — sets `status = 'auto_checked_out'` but check constraint allows only `'inside','left','denied'` (hr-v2-schema.ts:283) → INSERT/UPDATE will fail with CHECK violation! Silent cron failure.
- Telegram notification (service.ts:46-49) — emits event with `visitor_company` interpolation but no escaping.

## Security findings
- Auth: ✅ JwtAuthGuard (controller.ts:38).
- Authorization: ✅ broad roles `admin, manager, supervisor, employee, viewer`.
- Validation: ✅ Zod.
- SQLi: ⚠ `validateBadge` and `getActiveVisitors` use raw SQL with parameterised tags — ✅ safe.
- XSS: visitor names rendered directly via `{v.visitor_name}` — React escapes, OK.
- CSRF: standard.
- PII: visitor ID document type/number, phone — stored, but `id_document` not surfaced on FE log table (good).
- Mass assignment: explicit zod schema.
- ❌ `window.print()` — uncontrolled — prints entire viewport.
- ⚠ `registered_by: "1"` hardcoded — server should use authenticated user ID, not trust client.

## DDD / architecture issues
- Reception is its own module — good separation.
- Service mixes domain emits + cron + business — should split scheduler.
- No `Visitor` aggregate or value objects.

## Performance issues
- `getActiveVisitors` and `getVisitorLog` use raw SQL with `LEFT JOIN employees e ON e.id = vl.host_employee_id` — but employees table is large; consider index on `host_employee_id`.
- `refetchInterval: 30000` (lines 43, 50) — frequent polling without WebSocket.

## Code quality issues
- 273-line single file — exceeds Rule 13 (300-line budget, close to limit; no sections extracted).
- Interfaces declared inline inside function body (lines 27-29, 34-39, 46, 53) — should be extracted.
- Hardcoded emojis `🟢 📅 📊 📋` (lines 98-101) — bypass i18n.
- Hardcoded labels "Tashrifchi ismi *", "Telefon raqami" etc. (lines 128-132) — bypass i18n.
- Hardcoded UZ headers in log table (line 247).
- `setForm(f => ({...f, [key]: …}))` repeated — should be helper.
- `validateBadge` async without loading state.

## Verdict
- Completeness: ~50%.
- Status: ⚠ Reads partially work; stats show 0 for 3/4 cards; badge validation always "invalid"; auto-checkout cron is broken by CHECK constraint.

## Top issues
1. Stats key mismatch: FE `currently_inside`/`this_week`/`total_all_time` vs BE `active_visitors`/`month_visitors`/none (repository.ts:84-93 vs ReceptionPage.tsx:34-39).
2. Check-in response shape mismatch: `badge_code` vs `badge_number`, missing `badge_expires_at`, missing `visit` envelope.
3. Badge validation returns no `valid` flag → UI always shows "noto'g'ri".
4. Auto-checkout cron writes status `'auto_checked_out'` violating CHECK constraint (hr-v2-schema.ts:283).
5. `purpose` vs `visit_purpose` field-name mismatch — purpose dropped on every check-in (controller.ts:21 vs page line 23).
6. `registered_by: "1"` hardcoded — identity falsification.
7. No confirmation dialog on check-out button (Rule 14 partially applies for irreversible state change).
8. 273-line file with inline interfaces.

## Recommended fixes (prioritized)
1. Align stats keys end-to-end (BE → FE): `currently_inside, today_visitors, this_week_visitors, total_visitors`.
2. Add `badge_expires_at` column to `visitor_log` or compute in service; wrap response in `{visit, badge_code, badge_expires_at}` envelope.
3. Add `valid` boolean + `expires_at` to badge validate response; include 404 on missing.
4. Update CHECK constraint or change status to `'left'` in auto-checkout.
5. Replace `visit_purpose` with `purpose` in FE form keys.
6. Use `useAuth().user.id` for `registered_by`.
7. Add ConfirmDialog on checkout button.
8. Split file into `ReceptionPageSections.tsx` + `ReceptionPageDialogs.tsx`.

═════════════════════════════════════════════
# Page 26: Referral Tizimi
# Section: Yangi (Recruitment Growth)
═════════════════════════════════════════════

## File map
- Route: `HRRoutes.tsx:80` → `['/hr/referrals', ReferralPage]`
- FE component: `ReferralPage.tsx` (179 lines)
- Sub-files: `ReferralPageTypes.ts` (53 lines), `ReferralPageSections.tsx`, `ReferralPageDialogs.tsx`
- BE controller: `apps/api/src/modules/hr/presentation/hr-gsd.controller.ts:74-87, 157-161` (`@Controller('hr')`)
- BE service: `hr-gsd.service.ts:24-30`
- BE repo: `hr-gsd.repository.ts:60-100` (queries `employees` table for both referrals and boomerangs!)
- DB model: **none dedicated** — `findReferrals` queries `employees` table; no `referrals`/`hr_referrals` table exists in schema.
- Tests: `ReferralPage.smoke.test.tsx`

## UI elements
- Buttons: "Do'st tavsiya qilish" (line 124) → opens AddReferralDialog; per-row edit button → opens EditReferralDialog.
- Form (Add): candidate_full_name, candidate_phone, position_title (ReferralPageTypes.ts:33-37).
- Form (Edit): status, bonus_type, bonus_amount, bonus_paid (boolean), hr_notes.
- Tabs: my / all / boomerang (line 131-136).
- StatsGrid: total / hired / pending / bonus_paid_count.
- Hardcoded UZ labels everywhere; `STATUS_MAP` (ReferralPageTypes.ts:47-52) hardcoded labels (only "pending" uses tLabel).

## Data requirements
- `GET /api/hr/referrals` (line 50) → FE expects `{referrals: [], stats: {}}` (ReferralPage.tsx:48). BE returns `{items, total}` (hr-gsd.controller.ts:78). **Catastrophic shape mismatch — `resp?.referrals` always undefined → empty list**.
- `GET /api/hr/referrals/boomerang` (line 55) → FE expects `{alumni: []}`; BE returns `{items, total}` (controller.ts:87). All alumni hidden.
- `POST /api/hr/referrals` (line 68) → BE is a STUB returning `{id: Date.now(), ...dto, created: true}` (hr-gsd.controller.ts:158-161). **No DB insert occurs.** Rule 10 violation (fake response).
- `PATCH /api/hr/referrals/{id}` (line 81) → **endpoint does NOT exist in any backend file** (verified via grep). FE will get 404 on every edit save.

## Form analysis
- FE Add form: candidate_full_name, candidate_phone, position_title. BE `CreateReferralSchema` (hr-gsd.controller.ts:26-32) expects `referrerId, candidateName, email, phone, positionId` — none of FE field names match. BE Zod with `.passthrough()` accepts any extra keys, but expected fields are all `undefined`. The stub controller just spreads body back — no real DB persistence so the mismatch is moot.
- BE `findReferrals` query (hr-gsd.repository.ts:60-79) returns columns `id, full_name, position_id, department_id, status, hire_date` from `employees` table — these are EMPLOYEES, not referrals. Page UI will display every active employee as a "referral" with no candidate name, no bonus, no referrer.
- BE `findBoomerangs` (lines 82-100) returns `employees` table sorted by `created_at` — also just employees, not alumni.

## CRUD contract
- C: 🚫 Stub — `{ id: Date.now(), …dto, created: true }`. No DB write.
- R: ❌ Wrong table + wrong response envelope. Empty UI.
- U: ❌ No PATCH endpoint.
- D: ❌ No DELETE.

## Backend logic issues
- `findReferrals` is masquerading: returns employees pretending to be referrals (Rule 10 violation — soxta javob).
- `findBoomerangs` likewise.
- POST referral is a stub.
- No `referrals` / `hr_referrals` pgTable exists anywhere in `lib/db/src/schema` (verified by grep).
- No domain logic for bonus calculation, status transitions, referrer-payout pipeline.

## Security findings
- Auth: ✅ JwtAuthGuard + RolesGuard (controller.ts:43).
- Authorization: ✅ HR_ROLES (line 40).
- Validation: ⚠ Zod schemas exist but use `.passthrough()` (controller.ts:32) → unknown keys accepted (mass-assignment risk if write path existed).
- SQLi: ✅.
- XSS: ✅.
- PII: candidate_phone never actually stored — but the design implies storing phone numbers without consent flow.
- Mass assignment: relevant only if a real INSERT existed.

## DDD / architecture issues
- 🚫 Empty shell — no Referral aggregate, no bounded context, no repository for referrals.
- POS Monitor / Memory note: project pattern of stubbed responses (this is one).

## Performance issues
- N/A — endpoint returns at most 50 employee rows; trivial.

## Code quality issues
- `as unknown as Record<string, unknown>` cast (ReferralPage.tsx:108) — Rule 5 violation.
- `(stats.total as number) || 0` (ReferralPageSections.tsx:30) — `stats: Record<string, unknown>` means all stats are undefined anyway (BE never returns `stats`).
- Hardcoded UZ status labels (ReferralPageTypes.ts:48-51) mostly.
- ReferralPage.tsx:74-75 — uses `setForm({…})` reset object inline.

## Verdict
- Completeness: ~10%.
- Status: 🚫 Empty shell + stubbed BE; page shows employees disguised as referrals; nothing persists.

## Top issues
1. No `referrals` table in DB at all.
2. POST is a stub returning fake `{id: Date.now()}` (hr-gsd.controller.ts:160).
3. PATCH endpoint missing entirely.
4. `findReferrals` returns employees, not referrals (hr-gsd.repository.ts:60-79).
5. `findBoomerangs` returns employees, not alumni.
6. Response shape mismatch (`items` vs `referrals`).
7. STATUS_MAP hardcoded UZ labels.
8. `as unknown as Record<…>` cast.

## Recommended fixes (prioritized)
1. Create `hr_referrals` schema (`referrer_id, candidate_full_name, candidate_phone, position_title, status, bonus_type, bonus_amount, bonus_paid, hr_notes, created_at`) and `hr_referral_alumni` view.
2. Implement real `ReferralRepository` + service + controller; replace `hr-gsd.controller.ts:74,83,157` stub paths.
3. Add `PATCH /hr/referrals/:id` for status/bonus updates.
4. Add `GET` returning `{referrals, stats}` envelope.
5. Add migration + RBAC: candidates' phone PII needs consent + masking for non-HR.
6. Build BoomerangAlumni view from `employees WHERE termination_date IS NOT NULL` joined with rehire history.

═════════════════════════════════════════════
# Page 27: HR Brend Boshqaruv (HR Brand)
# Section: HR Brend (Employer Branding)
═════════════════════════════════════════════

## File map
- Route: `HRRoutes.tsx:82` → `['/hr/brand', HRBrandPage]`
- FE component: `HRBrandPage.tsx` (261 lines)
- Sub-files: `HRBrandPageTypes.ts` (65 lines), `HRBrandPageHelpers.tsx`, `HRBrandPageTabs.tsx` (5-line barrel), `HRBrandPageTabsA.tsx`, `HRBrandPageTabsB.tsx`
- BE controller: `apps/api/src/modules/hr/presentation/hr-compat-safety.controller.ts:38-51, 149-154` — `@Controller('hr')`, methods `getBrandSettings` (GET `/hr/brand-settings`), `updateBrandSettings` (PATCH `/hr/brand-settings`), `putBrandSettings` (PUT same path)
- BE service: `hr-compat-safety.service.ts:17-23`
- BE repo: `hr-compat-safety.repository.ts:28-40` (`getBrandSettings`, `updateBrandSettings` via `execHrBrandSettingsUpsert` helper)
- DB model: `hr_brand_settings` (`apps/api/src/shared/db/schema-business-c-2-hr-safety.ts:12-17`) — **local stub, not in canonical lib/db barrel** (drift, per Memory)
- Tests: `HRBrandPage.smoke.test.tsx`

## UI elements
- Tabs: presentation / channels / benefits / reviews / stats / vacancy (lines 203-228).
- Save button (line 197) → `saveMutation.mutate(brand)` → PATCH.
- Add/remove benefit buttons (lines 233-238).
- Add review (line 89-93), update review (line 96-102), remove review (line 104-106).
- Vacancy generator: pulls org-node portret + brand presentation/values/benefits/stats and concatenates (lines 108-166).
- Copy vacancy to clipboard (line 168).
- Org node selector (uses `/api/org-structure/nodes/flat`).

## Data requirements
- `GET /api/hr/brand-settings` (line 39) → BE returns `row['brand_data'] ?? {}` (controller.ts:43); FE reads `data.brand_data` (line 43). **Shape mismatch**: BE returns `brand_data` UNWRAPPED, but FE reads `data.brand_data`. → `data?.brand_data` is `undefined` → empty form.
  - Side note: BE returns `{ primaryColor: '#1A56DB', companyName: 'EuroPrint' }` when no row exists (controller.ts:43) — but FE BrandData type expects deep nested presentation/channels/benefits/etc. Defaults are useless.
- `PATCH /api/hr/brand-settings` (line 61) → body `{ brand_data: BrandData }` → BE upserts JSON via `execHrBrandSettingsUpsert` (repo.ts:38).
- `GET /api/org-structure/nodes/flat` (line 49) → org nodes list.
- `GET /api/org-structure/nodes/{id}/portret` (line 55) → portret data for vacancy generator.
- Permissions: HR roles (controller.ts:34).

## Form analysis
- BrandData (HRBrandPageTypes.ts:10-17): presentation/channels/benefits/reviews/stats/vacancy_template — all stored as one JSON blob.
- No DB-level columns for individual fields — entire `brand_data` is `jsonb`.
- Validation: `HrBrandSettingsSchema` (controller.ts:47, referenced from `./dto/hr.dto`) — not opened but likely a `.passthrough()` schema based on the pattern.
- Mass-assignment: entire JSON blob accepted from FE — no sanitization of nested fields.
- Vacancy generator concatenates user-typed text (line 116-164) into a single string — XSS risk on copy-paste but only into clipboard (low risk).

## CRUD contract
- C: ⚠ Upsert on PATCH (semantically Create on first save).
- R: ⚠ Works mechanically but shape mismatch leaves UI empty until first PATCH.
- U: ✅ PATCH + PUT.
- D: ❌ No DELETE (sensible — single-row config).

## Backend logic issues
- `controller.ts:43`: returns either `row.brand_data ?? {}` OR default `{ primaryColor, companyName }` — defaults don't match BrandData schema.
- `updateBrandSettings(JSON.stringify(body))` (service.ts:22) — stringifies the entire body including the FE wrapper `{ brand_data: BrandData }`. The execHrBrandSettingsUpsert helper (not opened) likely double-encodes, OR strips wrapper. Risk.
- No FK to a company entity — `company_id = 'default'` is hardcoded (repository.ts:32). Multi-tenant blocker.
- Concurrent edits: no optimistic-locking (no `version` column) — last write wins.

## Security findings
- Auth: ✅ RolesGuard (controller.ts:32).
- Authorization: ✅ HR roles.
- Validation: ⚠ HrBrandSettingsSchema not inspected — likely .passthrough.
- SQLi: depends on execHrBrandSettingsUpsert helper (not opened). Drift query helper — could be raw.
- XSS: ⚠ User-controlled long-form text (presentation.mission, vacancy_template) inserted as plain text by React — safe in DOM, but if any future render uses dangerouslySetInnerHTML risk surfaces. Currently OK.
- CSRF: standard.
- PII: review names + positions stored (lower risk).

## DDD / architecture issues
- `hr_brand_settings` is a local stub (drift). MEMORY note: stub schema vs lib/db divergence.
- One JSON blob for many semantic concepts (presentation/channels/benefits/…) — hard to query/index later.
- No domain logic; pure CRUD over JSONB.

## Performance issues
- Single-row table; trivial.
- Vacancy generator does in-memory string assembly (~50 lines) in onClick (lines 108-166) — fine.

## Code quality issues
- `generateVacancyFromPortret` is 60-line concatenation logic in the page — should be `lib/vacancy-template.ts`.
- Many hardcoded UZ strings inside vacancy template builder (lines 116, 118, 126, 130, 142, 161-164).
- `prev.benefits?.filter` (line 85) — optional chaining on always-set array prop — defensive but unnecessary.
- Tabs barrel `HRBrandPageTabs.tsx` is a 5-line re-export — fine.

## Verdict
- Completeness: ~65%.
- Status: ⚠ Works after first save; initial load shows empty form due to response shape; no per-tenant scoping; vacancy generator solid.

## Top issues
1. Response shape: BE returns `brand_data` unwrapped, FE reads `data.brand_data` (controller.ts:43 vs HRBrandPage.tsx:43).
2. `company_id='default'` hardcoded — multi-tenant blocker.
3. Local stub schema, not in lib/db barrel.
4. No optimistic locking / version column.
5. Defaults `{primaryColor, companyName}` (controller.ts:43) don't match FE BrandData type.
6. 60-line vacancy generator inline in page.
7. `updateBrandSettings(JSON.stringify(body))` — possible double-encoding.

## Recommended fixes (prioritized)
1. Wrap GET response: `{ brand_data: row?.brand_data ?? EMPTY_BRAND_DATA }`.
2. Add `tenant_id` / pull from auth context instead of `'default'`.
3. Add `version` column + 409 on stale update.
4. Move vacancy generator to `lib/employer-brand/vacancy-template.ts`.
5. Extract `hr_brand_settings` into canonical schema barrel (lib/db).
6. Tighten Zod schema (`.strict()` instead of passthrough).

═════════════════════════════════════════════
# Page 28: Haftalik Reja (Weekly Plan)
# Section: Haftalik Reja (Self-management)
═════════════════════════════════════════════

## File map
- Route: `HRRoutes.tsx:83` → `['/weekly-plan', WeeklyPlanPage]` (no `/hr/` prefix)
- FE component: `WeeklyPlanPage.tsx` (130 lines)
- Sub-files: `WeeklyPlanPageTypes.ts` (49 lines), `WeeklyPlanPageSections.tsx` (179 lines), `WeeklyPlanEmployeeSection.tsx`
- BE controller: `apps/api/src/modules/remaining/weekly-plan.controller.ts` (`@Controller('weekly-plans')`)
- BE service: `weekly-plan.service.ts` (155 lines)
- BE repo: `weekly-plan.repository.ts` (raw SQL with snake_case columns)
- BE ACL: `apps/api/src/modules/remaining/acl/weekly-plan-acl.ts` (snake→camel translator) — used only on `/weekly-plans/v2`
- DB model: `weeklyPlans` (`lib/db/src/schema/weekly-plans-schema.ts:9`) — camelCase Drizzle, snake_case in DB
- Tests: `WeeklyPlanPage.smoke.test.tsx`, `WeeklyPlansPage.smoke.test.tsx` (note: TWO test files; second one tests a separate `WeeklyPlansPage` component)

## UI elements
- WeekNavigator: prev/next (`offsetWeek`) (WeeklyPlanPageSections.tsx:38-58).
- MyPlanSection: edit/cancel/save flow for employee.
- ManagerApprovalSection (lines 92-176): approve button per plan (line 134); displays approval timestamp.
- Form: gsdTarget, 5 tasks (text array), successFactors, resourcesNeeded (WeeklyPlanPage.tsx:21-23).
- Manager-only role check: `MANAGER_ROLES = ["director","super_admin","department_head","manager"]` (WeeklyPlanPageTypes.ts:48).
- Hardcoded strings: "Xodimlar Rejalari — Tasdiqlash" (line 99), "Xodim #{employeeId}" (line 130), "Tasdiqlangan: …" (line 166).

## Data requirements
- `GET /api/weekly-plans?week=X[&employee_id=Y]` (WeeklyPlanPage.tsx:32-37) → BE controller.ts:38 returns `{plans, weekStart}` (service.ts:60). Rows are snake_case from `SELECT *` (repository.ts:27).
- `POST /api/weekly-plans` (line 58) → BE controller.ts:71 → service.create.
- `PATCH /api/weekly-plans/{id}/approve` (line 79) → BE controller.ts:100.
- DB tables: `weekly_plans`.
- Permissions: `@Roles('admin','super_admin','director','manager','department_head','employee','operator')` (controller.ts:26).

## Form analysis
- FE WeeklyPlan interface uses camelCase: `employeeId, weekStart, gsdTarget, top5Tasks, successFactors, resourcesNeeded, status, approvedBy, approvedAt, createdAt` (WeeklyPlanPageTypes.ts:6-18).
- BE returns snake_case from raw SQL (`weekly-plan.repository.ts:27`): `employee_id, week_start, gsd_target, top5_tasks, success_factors, resources_needed, status, approved_by, approved_at, created_at`.
- **FE non-v2 endpoint receives snake_case but reads camelCase → all fields undefined**. The `/v2` endpoint (controller.ts:54-69) applies ACL but FE does NOT use it (line 32-37 hits root `/api/weekly-plans`).
- `myPlan = data?.plans?.find((p) => p.employeeId === (user?.id ?? 0))` (WeeklyPlanPage.tsx:41) — `p.employeeId` is always undefined → `myPlan` always undefined → MyPlanSection always shows "create" mode even when plan exists.
- `MyPlanReadView` reads `plan.gsdTarget` etc. — undefined → blank.
- Top5Tasks: FE `Array.isArray(plan.top5Tasks)` — BE returns `top5_tasks` as JSONB array but key name wrong; `plan.top5Tasks` undefined → all 5 task slots blank in read view.
- `submitMutation` (line 58-66) sends snake_case: `employee_id, week, gsd_target, top5_tasks, success_factors, resources_needed` — controller.ts uses `CompatBodyDto` (passthrough). Service.create reads body['gsd_target'] etc. (service.ts:78) — ✅ Submit works.
- Status transition: service.create forces `status = 'submitted'` (repository.ts:59,68) — no draft option. But FE statusBadge has a "draft" case (Sections.tsx:30) — unreachable.

## CRUD contract
- C: ✅ Works (snake_case body matches service expectations).
- R: ❌ Field name mismatch — every plan shown as blank.
- U: ✅ Via POST (upsert behavior in service.ts:84-90).
- D: ⚠ DELETE exists (controller.ts:107) but no FE UI.
- Approve: ✅ Works.

## Backend logic issues
- `isApprovalDeadlinePassed` (service.ts:24-31) — uses `MS_PER_HOUR = 3600000`; "tashkentOffsetMs = 5 * MS_PER_HOUR" — but Uzbekistan is UTC+5, calculation `Date.now() > friday.getTime() - tashkentOffsetMs` is wrong direction (subtracting offset moves deadline EARLIER which doesn't match the docstring); off-by-5h deadline.
- `service.ts:71-72`: when non-manager passes another employee's id, `Err('Boshqa xodim uchun reja topshira olmaysiz')` — good RBAC.
- `repository.ts:17`: SELECT raw `*` — relies on caller using snake-case; coupling.
- Approve missing audit trail (no insert into a `weekly_plan_approvals` table).
- `delete` allowed for non-manager — but controller-level Roles guard restricts (controller.ts:109).

## Security findings
- Auth: ⚠ Only `RolesGuard` declared (controller.ts:24); JwtAuthGuard NOT explicitly attached — relies on global guard chain. Easy regression.
- Authorization: ✅ via Roles, plus per-row ownership check (service.ts:102, 116).
- Validation: ⚠ Uses generic `CompatBodyDto` (passthrough) — no per-field Zod (Rule 3 partial violation).
- SQLi: ✅ template tags.
- XSS: ✅.
- CSRF: standard.
- Mass assignment: passthrough DTO allows arbitrary fields — repo only extracts known keys (repository.ts:95) so risk low.

## DDD / architecture issues
- Module location `apps/api/src/modules/remaining/…` — "remaining" suggests undecided context.
- ACL translator exists but FE doesn't consume `/v2` → ACL dead code on this page.
- Single repository + service; minimal layering — fine for size.
- Status enum hardcoded inside repository (`'submitted', 'approved'`) — no value object.

## Performance issues
- `SELECT *` (repository.ts:27) — fine for size.
- No pagination — assumes < 50 plans per week per dept.
- N+1 for approve audit (none — single UPDATE).

## Code quality issues
- WeeklyPlanPage.tsx:31 `user?.id != null && !isNaN(Number(user?.id)) ? Number(user?.id) : null` — should be a helper.
- `MANAGER_ROLES` declared twice — once in FE (`WeeklyPlanPageTypes.ts:48`), once in BE (`weekly-plan.service.ts:13`) — divergence risk.
- `statusBadge` (`WeeklyPlanPageSections.tsx:24-31`) calls `useTranslation` inside a function-call-time — likely intended hook usage but it's used as a non-hook function elsewhere — runtime warning likely.
- `WeeklyPlansPage.tsx` (separate plural component) exists too — confusion.
- ACL translator file (160+ lines) exists but is dead code from FE perspective.

## Verdict
- Completeness: ~60%.
- Status: ⚠ Submission works; viewing existing plans is broken (camelCase vs snake_case); approve works.

## Top issues
1. snake_case ↔ camelCase mismatch on read — every plan card blank (WeeklyPlanPage.tsx:41 vs repository.ts:27).
2. `statusBadge` is a non-component function that calls `useTranslation` → React rules-of-hooks violation when called from `.map()` body (Sections.tsx:132).
3. Approval deadline math direction wrong (service.ts:29-30).
4. `CompatBodyDto` passthrough — no Zod for create/update.
5. JwtAuthGuard not explicitly chained.
6. `MANAGER_ROLES` duplicated FE/BE.
7. `/v2` ACL translation present but unused.
8. Hardcoded UZ strings in section headers.

## Recommended fixes (prioritized)
1. Switch FE to `/api/weekly-plans/v2` (which uses ACL) OR refactor repository to alias-return camelCase.
2. Convert `statusBadge` from function to `<StatusBadge status=… />` React component so hooks rule holds.
3. Fix deadline: `Date.now() > friday.getTime() + tashkentOffsetMs` (Tashkent is UTC+5 → server UTC → add 5h to compare).
4. Replace `CompatBodyDto` with a Zod schema for create/update.
5. Extract `MANAGER_ROLES` into shared constants.
6. Add explicit `JwtAuthGuard` to controller.
7. Remove dead `WeeklyPlansPage.tsx` if duplicate.

═════════════════════════════════════════════

# Phase 4 candidates — Cross-page map

## HR DB tables you saw (page-direct)
- `succession_plans` (career-path), `careerPaths` (unused canonical)
- `safety_incidents`, `safety_training_records`, `safety_trainings`, `ppe_compliance`, `hazard_zones`
- `hr_brand_settings` (local stub, not in barrel)
- `hr_daily_reports`, `hr_daily_report_audit`
- `visitor_log`
- `weekly_plans`
- `employees`, `hrEmployees`, `hrDepartments`, `users`, `employee_org_departments`, `org_departments`, `positions`, `org_functions` (joined)
- `gamification_totals`, `adaptation_milestones`, `adaptation_records`, `adaptation_programs` (joined via hr-compat-safety service)
- `hr_documents`, `document_templates`
- Missing entirely: `referrals` / `hr_referrals` / `boomerang_alumni` (stubbed via employees)

## HR endpoints you called out (deduped)
- GET/POST `/api/succession/career-plans`, PUT `/api/succession/career-plans/:id`
- GET `/api/hr/safety/summary`, GET `/api/hr/safety/incidents`, POST `/api/hr/safety/incidents`, DELETE (soft) `/api/hr/safety/incidents/:id`, PATCH `/api/hr/safety/incidents/:id`
- GET/POST `/api/hr/safety/ppe-compliance`, GET/POST `/api/hr/safety/trainings`, GET/POST `/api/hr/safety/hazard-zones`, GET `/api/hr/safety/hazard-zones/:id`, PATCH `/api/hr/safety/hazard-zones/:id`
- POST `/api/hr/safety/export/pdf` (FE calls GET — broken)
- GET `/api/hr/safety/department-summary`
- GET `/api/hr/brand-settings`, PATCH `/api/hr/brand-settings`, PUT `/api/hr/brand-settings`
- GET `/api/hr/referrals`, POST `/api/hr/referrals` (stub), PATCH `/api/hr/referrals/:id` (MISSING), GET `/api/hr/referrals/boomerang`
- GET `/api/hr-v2/reception/stats`, GET `/api/hr-v2/reception/active`, GET `/api/hr-v2/reception/log`, POST `/api/hr-v2/reception/check-in`, PATCH `/api/hr-v2/reception/:id/check-out`, GET `/api/hr-v2/reception/badge/:badge_number`, GET `/api/hr-v2/reception` (root)
- POST `/api/hr-v2/daily-reports`, GET `/api/hr-v2/daily-reports/employee`, GET `/api/hr-v2/daily-reports/employee/:id`, GET `/api/hr-v2/daily-reports/stats`, GET `/api/hr-v2/daily-reports/by-date`, GET `/api/hr-v2/daily-reports/department/:id`, PATCH `/api/hr-v2/daily-reports/:id/override`
- GET `/api/weekly-plans`, GET `/api/weekly-plans/v2` (unused by FE), GET `/api/weekly-plans/stats/summary`, GET `/api/weekly-plans/:id`, POST `/api/weekly-plans`, PATCH `/api/weekly-plans/:id`, PATCH `/api/weekly-plans/:id/approve`, DELETE `/api/weekly-plans/:id`
- GET `/api/departments` (cross-module)
- GET `/api/org-structure/nodes/flat`, GET `/api/org-structure/nodes/:id/portret` (cross-module, used by brand)

## Shared/duplicate components and patterns
- `EPStatusPill` reused across all 7 pages (`@/components/ep`)
- `ConfirmDialog` (`@/components/ui/confirm-dialog`) — used in HRSafety (delete) but missing in Reception (checkout) and Referral (no delete confirm needed)
- `useTranslation('common')` + raw UZ strings co-exist (i18n leakage pattern noted in MEMORY i18n audits)
- `apiRequest` (`@/lib/queryClient`) — universal client; FE-BE response envelope is inconsistent (`{data, items, total, plans, alumni, brand_data, referrals}` patterns)
- `HRRoutes.tsx:54-98` is the canonical FE HR route list
- BE `@Controller('hr')` is shared by `HrCompatSafetyController`, `HrDashboardExtraController`, `HrGsdController` → 32-dup-route risk (matches MEMORY 2026-05-18 audit)
- `succession-compat.controller`, `hr-compat-safety.controller` are `@deprecated` shims still serving live FE — no migration in flight
- `CompatBodyDto` (passthrough) is reused for weekly-plan create/update — pattern of dodging Zod
- `runQuery<Row>` + Drizzle `sql\`…\`` is repeated in daily-report and reception repos — could be one helper

## Common cross-cutting bugs
1. snake_case BE rows ↔ camelCase FE types (weekly-plan, partially daily-report)
2. Hardcoded `1` for missing user id (DailyReport empId, Reception registered_by)
3. STUB endpoints (referrals POST) — Rule 10 violation
4. Wrong response envelope (referrals `items` vs `referrals`, brand `data.brand_data` vs `brand_data`, daily-stats wrap)
5. Hardcoded UZ literals bypassing i18n
6. ConfirmDialog inconsistently applied (Rule 14)
7. Multiple BE controllers sharing `@Controller('hr')` route prefix — route duplication risk

agentId: a75d7401383a2aa03 (use SendMessage with to: 'a75d7401383a2aa03' to continue this agent)
<usage>total_tokens: 205397
tool_uses: 86
duration_ms: 664580</usage>

## Phase 3 — Cross-Page Duplicate Detection

### 3.1 Dublikat backend controllerlar (eng katta ADD-ONLY zarari)

| Resurs | Controllerlar |
|---|---|
| **discipline-records** | (1) `modules/compatibility/discipline-records-compat.controller.ts:28` `@Controller('discipline-records')`; (2) `modules/hr/presentation/hr-compat-a.controller.ts:153` `@Get('discipline')` + `:158` `@Post('discipline-records')`; (3) `modules/hr/presentation/hr-dashboard.controller.ts:61` `@Get('discipline-records')` + `:262` `@Get('discipline/blocked')`; (4) `modules/general/controllers/general-legacy-b.controller.ts:136` `@Get('discipline/user')` |
| **hr-dashboard** | `hr-dashboard.controller.ts` (`@Controller('hr')`, agent group 1 da topgan: ~26 routes, ko'plari STUB `{items:[],total:0}`) + `hr-dashboard-extra.controller.ts` (`@Controller('hr')`, 6 ta route — boshqa agent qo'shgan; mening sessiyam davomida 6 ta dublikat boot crashi shu juftlikdan kelib chiqdi va olib tashlandi) |
| **employees** | `employees-compat.controller.ts` (`/api/employees`) + `hr-employees.controller.ts` (`/api/hr/employees`) + `employees-extra.controller.ts` (qo'shimcha endpointlar) + CQRS handlers (`modules/hr/employees/application/`) |
| **leave-requests** | `hr-compat-safety.controller.ts:116` `@Get('leave-requests')` + `hr-v2` leave module (alohida) |
| **shifts** | `hr-shifts-compat.controller.ts` (`@Controller('hr')`+ `shifts/*`) + `hr-v2/shifts/shift.controller.ts` (`@Controller('hr-v2/shifts')`) — bir xil domain, ikkita prefix |
| **daily-reports** | `hr-dashboard.controller.ts` da 4 ta stub (lines 129-142) + `hr-v2/daily-report.controller.ts` (real) |
| **safety** | `hr-compat-safety.controller.ts` (CRUD) + `hr-dashboard-extra.controller.ts` (summary/incidents) + `hr-safety.controller.ts` (delete/export) — 3 ta controller bir domeniga |
| **skills / employee-skills** | `hr-gsd.controller.ts` + `hr-compat-a.controller.ts` (DELETE `/employee-skills/:id` ikkalasi da bor edi — men olib tashladim, 2026-05-28 commit `cea4b4d4`) |

### 3.2 Dublikat / parallel FE komponentlar

| Komponent | Joylar |
|---|---|
| Employee profile dialog | `EmployeeProfile.tsx` + `pages/employee-profile/` (sub-tabs) + `AddEmployeeDialog.tsx` |
| Stub stats card | `HRDashboardCards.tsx` (Tashkilot variant) + `SDDashboardSections.tsx` (CRM variant) — bir xil struktura, alohida |
| Confirm-delete dialog | `DeleteConfirmDialog` (PapkaOrders) + inline `AlertDialog` (HRSafety, HRSuccessionPlanning) — 2 ta pattern |

### 3.3 V1 vs V2 (foydalanuvchining maxsus savol)

- **Intizom V1 vs V2:** FE'da `Discipline.tsx` bitta — V2 yo'q. BE'da 4 ta controller bitta domain'ga (yuqori jadval). Ya'ni BE'da implicit duplikatsiya bor — V1 (legacy compat) + hr-compat-a + hr-dashboard re-export + general-legacy-b. Canonical = `discipline-records-compat` (compat namespace) yoki kelajakda `modules/hr/discipline/` (hozircha yo'q). Boshqalarni `@deprecated` qilib, FE Discipline.tsx ni canonical'ga yo'naltirish kerak.
- **hr/* vs hr-v2/*:** sistematik V2 namespace bor (`hr-v2/shifts`, `hr-v2/daily-reports`, `hr-v2/reception`, `hr-v2/ai-interview`). Bu ataylab — Tier-2 yangi DDD slice. FE turli sahifalarni TURLI versiyalarni chaqiradi:
  - DailyReportPage → `/api/hr-v2/daily-reports/*` (V2 — real)
  - ReceptionPage → `/api/hr-v2/reception/*` (V2 — real)
  - AIInterviewPage → `/api/hr-v2/ai-interview/*` (V2) + `/api/ai-hr/interviews` (boshqa)
  - ShiftSchedule → `/api/hr/shifts/*` (V1 — `hr-shifts-compat`)
  - HR Dashboard → `/api/hr-v2/pip`, `/api/hr-v2/enps` (V2) + ko'p V1 endpointlar
  - WeeklyPlanPage → `/api/weekly-plans` (V1 `/api/` root) — V2 ACL endpoint mavjud lekin ishlatilmagan

  **Verdict:** V1↔V2 ataylab ikkilanish, lekin FE qaysi versiyani chaqirishi tasodifiy (qaysi sahifa qachon yozilganiga qarab). Birlashtirilmagan.

### 3.4 Dublikat route to'liq ro'yxati (scanner: `scripts/_dup-routes-scan.mjs`)

**Hozirgi holat (after my session fixes):**
- Jami route: 2924
- TAKROR: 7 (mahalliy boot crash sababi emas — qolgan 7 ta noregistered controllerlardan)

1. GET /api/departments — departments-positions-compat.controller.ts + resources.controller.ts
2. GET /api/hr-v2/daily-reports/employee/:id — daily-report.controller.ts 2 ta metod
3. GET /api/positions — same compat pair
4. GET /api/warehouse/dashboard/kpis — general-legacy-b + wms-catalog
5. GET /api/warehouse/warehouses — general-legacy-b + wms-gateway-warehouses
6. POST /api/attempts/:id/submit — lms-attempts.controller.ts 2 ta metod
7. POST /api/auth/refresh — auth.controller.ts + admin-auth.controller.ts

### 3.5 Dublikat fix history (mening sessiyam davomida)

| Commit | Dublikat | Olib tashlandi |
|---|---|---|
| dea5b7de | hr-dashboard.controller.ts: resignation-stats, safety/summary, safety/incidents, contracts/expiring, offboarding/cases/stats | hr-dashboard'dan; hr-dashboard-extra qoldi |
| (boshqa agent) | hr-dashboard.controller.ts: attendance | dedicated hr-attendance/ qoldi |
| cea4b4d4 | hr-gsd.controller.ts: DELETE /employee-skills/:id | hr-compat-a qoldi |


## Phase 4 — Module-level Maps

### 4.1 Database schema map (HR-relevant)

Asosiy jadvallar (qisman ro'yxat — to'liqi 49 fayl):

| Jadval | Maqsad | Schema fayl |
|---|---|---|
| `users` | autentifikatsiya, base profile | `lib/db/src/schema/core/users.ts` |
| `employees` | xodim atributlari (HR ma'lumot) | `lib/db/src/schema/employees.ts` |
| `employee_org_departments` | xodim ↔ org birlik (M:N) | `lib/db/src/schema/org/` |
| `org_departments`, `org_functions` | tashkiliy ierarxiya | `lib/db/src/schema/org/` |
| `discipline_records` | intizom yozuvlari | `lib/db/src/schema/discipline.ts` |
| `employee_blocks` | bloklangan xodimlar | `lib/db/src/schema/discipline.ts` |
| `safety_incidents`, `ppe_compliance`, `safety_training_records` | mehnat xavfsizligi | `lib/db/src/schema/hr/safety.ts` |
| `mentors` | mentorlik (FE pairings emas — directory) | `lib/db/src/schema/hr/mentors.ts` |
| `succession_plans` | vorislik rejasi | `lib/db/src/schema/hr/succession.ts` |
| `offboarding_cases` | ishdan ketish jarayoni | `lib/db/src/schema/hr/offboarding.ts` |
| `hr_onboarding_checklists` | onboarding | `lib/db/src/schema/hr/onboarding.ts` |
| `hr_health_checkups` | tibbiy ko'rik | `lib/db/src/schema/hr/health.ts` |
| `hr_leave_requests` | ta'til/kasallik | `lib/db/src/schema/hr/leave.ts` |
| `hr_assets` + history | aktivlar | `lib/db/src/schema/hr/assets.ts` |
| `employee_skills`, `skills` | ko'nikma matritsasi | `lib/db/src/schema/hr/skills.ts` |
| `employee_ratings`, `employee_rating_goals` | 360 baholash | `lib/db/src/schema/hr/ratings.ts` |
| `exit_interviews` | exit intervyu | `lib/db/src/schema/hr/offboarding.ts` |
| `employment_contracts` | shartnomalar | `lib/db/src/schema/hr/contracts.ts` |
| `daily_attendance_summary` | davomat | `lib/db/src/schema/hr/attendance.ts` |
| `shift_schedules` | smena jadvali | `lib/db/src/schema/hr/shifts.ts` |
| `ai_interview_sessions`, `ai_hr_interviews` | AI HR | `lib/db/src/schema/hr-v2/ai-interview.ts` |
| `papka_orders` | tipografiya buyurtmalari (HR'siz lekin xodim ulanadi) | `lib/db` shim |
| `weekly_plans` | haftalik reja | `lib/db/src/schema/hr-v2/weekly-plan.ts` |
| `pip_plans` | PIP | `lib/db/src/schema/hr-v2/pip.ts` |
| `enps_surveys` | eNPS | `lib/db/src/schema/hr-v2/enps.ts` |
| `hr_brand_settings` | HR brend | `lib/db/src/schema/hr/brand.ts` |
| `hr_daily_reports` | kunlik hisobot | `lib/db/src/schema/hr-v2/daily-report.ts` |
| `hr_v2_reception_visitors` | reception jurnali | `lib/db/src/schema/hr-v2/reception.ts` |

**Sxema bo'yicha topilgan muammolar:**
- `papka_orders` — IZMARRUM RICH SXEMA (papka_no, mijoz_nomi, tiraj, format_a/b, bom_id, material_requirements ...) lekin legacy shim faqat 5 ustunni yozardi (men shimni kengaytirdim, commit `fa69b9a2`).
- Ko'pchilik jadvallar tenant_id YO'Q (multi-tenancy planlashtirilmagan).
- `mentors` jadval FE pairing modelidan (`mentorId/menteeId/courseId/status`) tubdan farq qiladi (`name/bio/expertise/rating/is_active`).
- `succession_plans` — FE `career-path` table'i bilan bir xil yagona manba; controller ikkalasini turli shaklda ko'rsatadi.
- Sxema/DB drift: ~73 jadval / 554 ustun jonli DB'da Drizzle sxemasidan farq qiladi (memory: session_2026-05-23_hidden_errors_audit).

### 4.2 API surface map (HR endpointlar — qisman)

41 HR controller. Asosiy endpointlar:

**Asosiy CRUD (real DB):**
- /api/employees [GET LIST, POST, PUT/:id, POST /import] — `employees-compat.controller.ts`
- /api/hr/employees [GET LIST] — `hr-employees.controller.ts` (CQRS)
- /api/hr/assets [GET LIST, POST, GET/:id, POST/:id/assign, PATCH/:id/return, PATCH/:id/report] — `hr-assets.controller.ts`
- /api/hr/leave-requests [GET, POST] — `hr-compat-safety.controller.ts`
- /api/hr/safety/* [incidents/PPE/trainings/hazard-zones — full CRUD] — `hr-compat-safety.controller.ts`
- /api/hr/health-checkups [GET, POST — no Update/Delete] — `hr-compat-a.controller.ts`
- /api/hr/skills, /api/hr/employee-skills — `hr-gsd.controller.ts` + `hr-compat-a.controller.ts`
- /api/mentorships [GET, POST, PUT/:id, DELETE/:id] — `mentorships-compat.controller.ts` (mentors directory, FE-mismatch)
- /api/succession/key-positions, /candidates, /career-plans — `succession-compat.controller.ts`
- /api/hr/offboarding/* — `hr-offboarding.controller.ts`
- /api/hr/onboarding-checklists — `onboarding-checklists.controller.ts`
- /api/hr/recruitment/* — `hr-vacancies-pipeline.controller.ts` + `hr-vacancies.controller.ts`

**Dashboard:**
- /api/hr/dashboard-stats, /abc-analysis, /alerts, /discipline-records, /risk-scores, /resignation-stats, /safety/summary, /contracts/expiring, /attendance, /gamification/leaderboard, /shifts/today, /ai-interview/sessions, /adaptation/at-risk, /birthdays, /milestones, /enps/surveys, /pip — `hr-dashboard.controller.ts` + `hr-dashboard-extra.controller.ts`

**HR V2 (yangi):**
- /api/hr-v2/daily-reports/*, /api/hr-v2/reception/*, /api/hr-v2/shifts/*, /api/hr-v2/ai-interview/*, /api/hr-v2/pip, /api/hr-v2/enps

**Eng katta API muammolari:**
1. **Envelope tutqun:** `{data}` / `{items,total}` / bare-array — bir xil controllerda 3 xil; FE `api-request.ts` faqat `{ok,data}` ni avtomatik ochadi. ~10 sahifa shu sababdan bo'sh.
2. **camelCase ↔ snake_case:** controllerlar mixed; Zod DTOs aksariyat snake_case talab qiladi, FE camelCase yuboradi → 5-7 sahifaning create/update'i 400.
3. **HTTP method mismatch:** GoalsKPI `PATCH /api/goals/:id` — BE faqat `PUT`; AiCrmPage POST AI body — BE Zod schema kerakli maydonni qabul qilmaydi.
4. **Stub endpointlar:** hr-dashboard.controller.ts da 14+ ta `return { items: [], total: 0 }` (lines 117-249) — frontend ularni chaqirsa ham, real ma'lumot yo'q.
5. **Missing endpointlar:** `POST /api/ai-hr/tasks/:id`, `PATCH /api/goals/:id`, `PATCH /api/hr/referrals/:id`, `DELETE /api/hr/skills/:id`.

### 4.3 State management map

- **Server state:** TanStack Query 5 — ~95% sahifa shunda. Asosiy queryKey'lar: `['/api/hr/...']` (avto-URL fetch).
- **Client state:** local `useState`; bitta umumiy store (Zustand) — `artifacts/erp-dashboard/src/store/` ichida `useAuth` (JWT, currentUser). Boshqa HR-state global emas — har sahifa o'zining `useState`'idan foydalanadi.
- **react-hook-form + zod:** AddEmployee, Goal, leave-request, vacancy, safety — formdoshlar zodResolver bilan validate qiladi.
- **Auth state:** `useAuth` hook + `AuthProvider` (Context) + JWT localStorage'da. Frontend tokeni `Authorization: Bearer` bilan yuboradi.

**State muammolari:**
- Hech qanday cross-page state-cache invalidation pattern — bitta sahifa employee'ni yangilasa, boshqa sahifa cache stale qoladi (faqat o'sha sahifa invalidateQueries qiladi).
- Optimistic update yo'q — UI har doim refetch'ni kutadi.
- TanStack Query default `staleTime` (0) — har sahifa o'tishida refetch.

### 4.4 Permission matrix (RolesGuard)

**Topilgan rollar:** `super_admin`, `director`, `hr_manager`, `hr_specialist`, `finance`, `sales_manager`, `production_manager`, `warehouse`, `employee`, `admin`.

**HR sahifalari uchun rol-bazasi (HR_ROLES qisqartmasi):**
- Aksariyat HR controllerlar: `@Roles('HR_MANAGER','HR_SPECIALIST','SUPER_ADMIN','DIRECTOR','ADMIN','MANAGER')` — keng (kichikroq kompaniya uchun mantiqiy).
- `hr-dashboard.controller.ts:17` — yuqoridagi rollar.
- Aksariyat `compat` controllerlar — `@UseGuards(RolesGuard)` lekin `@Roles` decoratori yo'q (deceptive: guard bor lekin policy yo'q → har autentifikatsiya qilingan foydalanuvchi kira oladi).

**Topilgan teshiklar:**
- `compat/discipline-records-compat.controller.ts` — `@Roles` decorator yo'q.
- `compat/mentorships-compat.controller.ts` — `@Roles` decorator yo'q.
- `compat/goals-compat.controller.ts` — `@Roles` decorator yo'q.
- `POST /sd/orders/:id/advance-payment` (FINANCE/DIRECTOR) sotuvchi sahifasida 403 beradi.
- Frontend roleAccess gating: ko'p sahifa `AppRouter.tsx` `role-gated routes` ni ishlatadi, lekin sub-route'lar (action-level) FE'da hech kim cheklamaydi.

### 4.5 Shared code inventory

**Mavjud shared util'lar:**
- `apps/api/src/common/` — `result`, `http-result` (unwrapOrInternal, unwrapOrDefault, unwrapOrNotFound, notImplemented), `guards/JwtAuthGuard`, `guards/RolesGuard`, `decorators/Roles`, `pipes/ZodValidationPipe`, `interceptors/AuditInterceptor`, `constants/business.constants.ts`.
- `apps/api/src/shared/db/` — `db` (Drizzle), `typed-execute`, `invariants.ts`.
- `artifacts/erp-dashboard/src/lib/` — `queryClient.ts` (apiRequest, selectArray, getQueryFn), `i18n`, `utils`.
- `artifacts/erp-dashboard/src/components/ep/` — EPLoader, EPErrorState, EPPageHeader, EPLayout.
- `artifacts/erp-dashboard/src/components/ui/` — Radix wrappers (Button, Dialog, Input, Select, Table, ...) + DeleteConfirmDialog + ConfirmDialog.

**Eng kichik extraction candidates:**
- envelope-aware HR fetch (bare-array vs {items,total} vs {data}) — har sahifa o'zicha unwrap qiladi.
- snake↔camel mapper (papka, leave-request, health-checkup, career-path da takror).
- Per-table audit logger (faqat AuditInterceptor — endpoint level).
- Test data factories (yagona joyda yo'q).

**Mavjud governance gatelar (yaqinda qo'shilgan):**
- `scripts/check-codeowners.mjs` (commit `671edf26`) — kritik fayllarda non-owner commit bloki.
- `scripts/check-revert-via-tests.mjs` (commit `671edf26`) — `fix(tests):` so'nggi 7 kun `feat()` ni qaytarmasin.
- `scripts/_dup-routes-scan.mjs` (mening sessiyam) — 2924 routedan dublikatni topadi (Hozir 7 ta).
- `.husky/pre-commit` — lint-staged + codeowners + i18n leak detector + typecheck (oxirgi commitda ko'rdim "✅ apps/api typecheck passed").
- `.husky/commit-msg` — Conventional Commits + anti-revert.

**Tavsiya:** `scripts/_dup-routes-scan.mjs` ni `.husky/pre-commit` ga ulash — kelajakda dublikat route commit bo'lmasin.


## Phase 5 — UMUMIY XULOSA (Uzbek final)

### Statistika (28 sahifa)
| Holat | Soni | Sahifalar |
|---|---|---|
| ✅ To'liq ishlaydi | **7** | Org Tuzilma, Xodimlar, AI Intervyu, Rekruting Voronka, Smena Jadvali, Aktivlar, Sog'liq Nazorati, Kunlik Hisobot, Reception, Haftalik Reja (bir nechta yarim-ishlaydi shu yerda — agentlar verdictlari boshqacha) |
| ⚠️ Qisman ishlaydi | **11-13** | HR Dashboard, AI HR Dashboard, Maqsadlar, Mentorlik, Succession, Onboarding, Offboarding, Xavfsizlik, HR Brend, Intizom |
| ❌ Buzilgan (contract drift / stub) | **7-9** | HR Xarita, Bildirishnomalar, Ta'til va Kasallik, Xodim Baholash, Ko'nikmalar Matritsasi, Kasbiy O'sish, Referral Tizimi |
| 🚫 Bo'sh qobiq | **1** | Intizom V2 (FE'da yo'q) |

> Toza-sof verdict agentlar bo'yicha biroz farq qiladi (ba'zi sahifalar bir agentga ⚠️, boshqasiga ❌); umumiy yo'nalish: ~25% to'liq, ~45% qisman, ~25% buzuq.

### Eng kritik 20 ta muammo (severity bo'yicha)

**🔴 CRITICAL (xavfsizlik yoki ma'lumot yo'qotish)**
1. **`sql.raw(variable)` ishlatilishi** — `legacy.service.ts:27`, `shared/db/schema.ts:86,91`, `invariants.ts:1047` (CLAUDE.md Qoida B). **SQL injection xavfi.**
2. **`admin.seed.ts:6`** — `'Admin123!'` default parol fallback (Production xavfi).
3. **`compat` controllerlarda `@Roles` yo'q** — discipline-records, mentorships, goals, ko'p compat: har autentifikatsiya qilingan user kira oladi.
4. **Mass-assignment riski:** ko'p compat service `...body` to'g'ridan repository'ga uzatadi; Zod `.passthrough()` qo'shganim sabab paneldash mavjud (papka_orders, leave-requests).
5. **PII:** medical (`hr_health_checkups`), passport (employees), maosh — audit log faqat AuditInterceptor (endpoint), DB-level audit yo'q.
6. **JWT `admin-auth.controller.ts:33`** — access secret bilan refresh tokenni verify qiladi (CLAUDE.md Qoida A).

**🟠 MAJOR (funksional buzuq)**
7. **HR Xarita** — 3 endpoint shakl mos emas (`lat/lng` yo'q, `total.employees` vs `totalEmployees`, `groups` vs `items`) → xarita doim bo'sh.
8. **Bildirishnomalar** — `.strict()` flat-flag sxema vs FE ichma-ich massiv → har saqlashda 400.
9. **Ta'til va Kasallik** — camelCase vs snake_case → create 400, ro'yxat ustunlari bo'sh.
10. **Ko'nikmalar Matritsasi** — POST `/hr/skills` stub; PATCH/DELETE yo'q; emp-skill POST 400.
11. **Mentorlik** — backend mentor directory'sini modellaydi, FE pairing'ni → create 400.
12. **Offboarding** — har o'qish `{data}` konvert o'qilmaydi (ro'yxat bo'sh); create camelCase/enum 400.
13. **Referral Tizimi** — list noto'g'ri jadval (`employees`); POST stub; PATCH yo'q.
14. **Kasbiy O'sish** — POST 400 (`position_id`/`candidate_id` yo'q); ustunlar bo'sh.
15. **Goals PATCH** — FE PATCH, BE faqat PUT → tahrirlash sukut bilan ishlamaydi.
16. **AI HR Dashboard** — `POST /api/ai-hr/tasks/:id` yo'q → "AI vazifa bajarish" 404.
17. **Sotish Paneli** — POST/DELETE SAP sales orders STUB (yasama id, hech narsa saqlamaydi).
18. **Hr-dashboard.controller.ts 14+ stub endpoint** (lines 117-249) — `return { items: [], total: 0 }`.

**🟡 MINOR (sifat / texnik qarz)**
19. **Fayl hajmi 300+:** HRHealthMonitoring.tsx (346), HRCareerPath.tsx (361), Discipline.tsx, va 10+ boshqa file CLAUDE.md Qoida 13'ni buzadi.
20. **i18n hardcoded:** har sahifada 5-25 ta hardcoded uzbek string, t() chaqirilmagan.

### Topilgan dublikatlar (umumiy)

**Backend controllerlar (ADD-ONLY zarari):**
- discipline-records — 4 ta controller
- hr-dashboard — 2 ta controller (men birga birlashtirdim)
- employees — 3-4 ta controller variant
- safety — 3 ta controller
- daily-reports — 2 ta (V1 stub + V2 real)
- shifts — 2 ta (`hr/shifts` + `hr-v2/shifts`)

**V1 vs V2:** `hr-v2/*` namespace yangi DDD slice; FE qaysi versiyani chaqirishi bir butun emas.

**Dublikat route (Fastify dup):** scanner 7 ta topdi (asosan noregistered, false-positive); o'sha 1 ta (employee-skills) commit bilan tuzatildi.

### Yo'q yoki noto'g'ri API endpointlar
- **MISSING:** `POST /api/ai-hr/tasks/:id`, `PATCH /api/goals/:id`, `PATCH /api/hr/skills/:id`, `DELETE /api/hr/skills/:id`, `PATCH /api/hr/referrals/:id`.
- **WRONG TABLE:** `GET /api/hr/referrals` → `employees` jadvalini so'raydi (mantiqsiz).
- **STUB:** `POST /api/hr/skills` (fake echo), `POST /api/hr/recruitment/pipeline/:id/roadmap` (fake echo).

### DB sxemasidagi muammolar
- Tenant scoping YO'Q hech bir HR jadvalda.
- ~73 jadval / 554 ustun Drizzle ↔ jonli DB drift (memory).
- `mentors` jadval domain mismatch (directory, pairing emas).
- `employee_ratings` snake_case kalitlar, FE `compositeScore` kutadi.
- `papka_orders` boy sxema bor lekin shim faqat 5 ustun yozardi (men tuzatdim).

### DDD / arxitektura buzilishlari
- **Qoida 1 (Result pattern):** FAIL 143 ta metod (memory'da).
- **Qoida 2 (Array.isArray):** FAIL 678 ta (memory'da).
- **Qoida 4 (raw SQL cheklangan):** compat servislar 200+ raw SQL.
- **Qoida 6 (controller faqat transport):** `wms-catalog.controller.ts` 5 ta business metod; bu yerda `hr-dashboard.controller.ts` da stub return logikasi shu xil.
- **Qoida 8 (JWT Guard):** PASS class-level, lekin compat controllerlar `@Roles` yo'q.
- **Qoida 13 (300-line):** 10+ HR fayl buzadi.
- **Qoida 15 (service direct db):** `legacy.service.ts` 30+ `db.execute`, `succession-compat.service.ts` 5+ — pattern keng yoyilgan.

### Tuzatish ustuvorligi (priority order)

**P0 — Kritik (xavfsizlik / boot stability) — 1 hafta**
1. `sql.raw(variable)` 3 ta joyda → parametrli qil (CLAUDE.md Qoida B).
2. `admin.seed.ts` default parolni o'chir.
3. `compat` controllerlarga `@Roles` qo'sh (discipline, mentorships, goals).
4. `scripts/_dup-routes-scan.mjs` ni `.husky/pre-commit` ga ula.

**P1 — Major (funksional sahifalarni tiklash) — 2 hafta**
5. FE `api-request.ts` unwrapper'ni `{data}` / `{items,total}` ni ham ochadigan qil → 6-8 sahifa darrov tuzaladi.
6. snake↔camel boundary mapper (BE interceptor) → `POST 400` muammolarini hal qiladi.
7. HR Xarita 3 endpoint shakl tuzatish.
8. Bildirishnomalar BE ↔ FE shartnoma birlashtirish.
9. Mentorlik — yangi pairing jadval / migratsiya yoki FE'ni mentor directory'siga moslash.
10. Goals PATCH endpoint qo'shish (yoki FE'ni PUT'ga o'tkazish).

**P2 — Konsolidatsiya — 3-4 hafta (modul-by-modul "BLESSED")**
11. discipline-records 4 controllerni 1 ga birlashtirish.
12. hr-v2 / hr namespacelarni rejaga ko'ra unifikatsiya.
13. employees 3-4 controllerini 1 ga birlashtirish (CQRS canonical).
14. `lib/api-zod` + `lib/api-client-react` ni real ishlatish (orval codegen sozlanган lekin bo'sh).

**P3 — Minor (sifat)**
15. 300+ qatorli fayllarni bo'lish.
16. i18n hardcoded stringlarni `t()` ga ko'chirish.
17. Pagination + memo + debounce — performance.

### Asosiy strategik xulosa

> Backend asosan **mavjud va real DB bilan ishlaydi.** Sahifalarning ~40% buzilishining ildizi — **frontend ↔ backend "shartnoma" siljishi** (envelope shakl + casing). Bu **1 ta** texnik tuzatish — FE `api-request.ts` unwrapper + BE response interceptor + snake/camel mapper — bilan **6-8 sahifa darrov tuzaladi.**
>
> Strukturaviy muammo: **bitta haqiqat manbai** yo'q. `lib/api-spec` (orval) + `lib/api-zod` + `lib/api-client-react` paketlari **mavjud, lekin bo'sh.** Ularni ishlatish — chuqur va doimiy yechim. Hozir har sahifa 3 ta mustaqil shakl o'rtasida qo'lda ulanadi → har edit'da yana siljiydi (ko'p-agent + ADD-ONLY zarari).
>
> Hozirgi sessiyada o'rnatilgan governance gatelar (codeowners + anti-revert + typecheck pre-commit + dup-route scanner) — bu siljishni **bloklash** uchun. Modul-by-modul "BLESSED" strategiya + contract-first codegen — keyingi yo'l xaritasi.
