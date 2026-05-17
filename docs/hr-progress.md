# HR Module — Production-Readiness Progress

Branch: `chore/clean-faza-3` (worktree).

## Phase 3 — Sidebar & Navigation Cleanup

### T3.1 — Remove sidebar duplicates  ✅

Canonical paths kept:
- `/hr/succession` (HRSuccessionPlanning component)
- `/hr/vacation-sick` (HRVacationSick component)

Removed:
- `/hr/succession-planning` HR route (was a second mapping to the same component)
- `/hr/leave` stub route

Redirects added in `artifacts/erp-dashboard/src/routes/AppRouter.tsx`
(wouter `<Redirect>` inside a `<Route>`):
- `/hr/succession-planning` → `/hr/succession`
- `/hr/leave` → `/hr/vacation-sick`
- `/succession-planning` legacy alias now points at `/hr/succession`
  (previously pointed at the deleted `/hr/succession-planning`)

`REDIRECT_PATHS` in `AppRouter.tsx` was extended with the two new aliases so
that `isKnownPath` does not fall through to `NotFound`.

`Layout.tsx` sidebar item (legacy `Layout` shell) updated:
`/hr/leave` "Ta'til" → `/hr/vacation-sick` "Ta'til va Kasallik".

Commit: `86f5a39a`

Files changed:
- `artifacts/erp-dashboard/src/routes/HRRoutes.tsx`
- `artifacts/erp-dashboard/src/routes/StubRoutes.tsx`
- `artifacts/erp-dashboard/src/routes/AppRouter.tsx`
- `artifacts/erp-dashboard/src/components/Layout.tsx`

Tests: `artifacts/erp-dashboard/src/routes/__tests__/hrRouteDedup.test.ts`

### T3.2 — Decide 6 "hidden" pages  ✅

Reality-check finding: all 6 pages flagged as "hidden" by V6 audit already
have working routes in `HRRoutes.tsx` and are also already exposed in
sidebar config (`artifacts/erp-dashboard/src/components/sidebar/constants.ts`):

| Page | Route | Sidebar placement (before T3.2) | Decision |
|------|-------|-----------------------------------|----------|
| SkillsMatrix     | `/skills-matrix` | tz12 LMS · "Ko'nikmalar"          | KEEP, also surface in HR sidebar |
| Mentorship       | `/mentorship`    | tz12 LMS · "Mentorlik"            | KEEP, also surface in HR sidebar |
| EventsCalendar   | `/events-calendar` | tz12 LMS · "Tadbirlar"          | KEEP, current placement |
| Applications     | `/applications`  | tz17 Admin + Kanban · "Arizalar"  | KEEP, current placement |
| HRCapitalCourses | `/hr-capital/courses` | tz12 LMS · "HR Capital Kurslar" | KEEP, current placement |
| HRCapitalTests   | `/hr-capital/tests`   | tz12 LMS · "HR Capital Testlar" | KEEP, current placement |

Action: promoted `SkillsMatrix` ("Ko'nikmalar Matritsasi") and `Mentorship`
("Mentorlik") into tz11 (HR) BAHOLASH section, alongside "Xodim Baholash"
and "Succession Planning", so HR managers don't need to switch modules
for talent-development workflows.

Commit: `2316b661`

Files changed:
- `artifacts/erp-dashboard/src/components/sidebar/constants.ts`

### T3.3 — Sidebar i18n audit  ✅

Reality-check finding: the **active** sidebar (`AppSidebarRedesign`) and the
legacy `Layout.tsx` both render hardcoded UZ strings. `ModuleTabs.tsx` calls
`useTranslation('navigation')` and `getTranslatedMenuGroups(t)`, but the
latter previously ignored its `t` argument and returned raw config.

Action taken (in-scope, HR module only — other modules' migration is a
later phase):

1. Added 60+ flat `hr*` keys to both locale bundles:
   - `artifacts/erp-dashboard/src/locales/uz/navigation.json`
   - `artifacts/erp-dashboard/src/locales/ru/navigation.json`
   Keys cover every visible tz11 sidebar entry and every section
   separator.  The project's i18n loader (`lib/i18n/loader.ts`) only does
   flat `moduleData[key]` lookups, so nested keys are not used.

2. Extracted i18n wiring into a new helper file:
   - `artifacts/erp-dashboard/src/components/sidebar/hrNavI18n.ts`
     (147 lines, ≤300)

   Exports:
   - `HR_NAV_SECTION_KEYS`  — separator UZ title → flat key
   - `HR_NAV_URL_KEYS`      — menu url → flat key
   - `translateHrModule(t, group)` — returns a copy of the HR `MenuGroup`
     with all visible labels translated, falling back to the original
     UZ string when `t(key)` returns the key itself (missing).

3. Wired `getTranslatedMenuGroups` in `constants.ts` to translate tz11
   via `translateHrModule(t, hrModule)`. Other modules pass through
   unchanged.

Parity: the existing `lib/i18n/__tests__/completeness.test.ts` enforces
that every UZ navigation key also exists in RU and vice-versa, so the
new keys cannot drift.

Tests:
- `artifacts/erp-dashboard/src/components/sidebar/__tests__/hrNavI18n.test.ts`
  (verifies every tz11 item is covered by the key maps, every key exists
  in both UZ and RU bundles, and the translator picks the correct
  language)

Files changed:
- `artifacts/erp-dashboard/src/locales/uz/navigation.json`
- `artifacts/erp-dashboard/src/locales/ru/navigation.json`
- `artifacts/erp-dashboard/src/components/sidebar/constants.ts`
- `artifacts/erp-dashboard/src/components/sidebar/hrNavI18n.ts` (new)

### Audit: sidebar-duplicates check

Script: `scripts/hr-audit.mjs --check=sidebar-duplicates`
(see `scripts/hr-audit.mjs` for details).

The script scans every sidebar config (`AppSidebar`, `Layout.tsx`,
`sidebar/constants.ts`, `StubRoutes`, `HRRoutes`) for the known duplicate
pairs and reports a PASS only when each pair has exactly **one** canonical
entry and the legacy alias is either absent or registered as a redirect.

Phase 3 commits:
- T3.1: `86f5a39a`
- T3.2: `2316b661`
- T3.3: `8d363f4e`

Audit script result:

```
$ node scripts/hr-audit.mjs --summary
[hr-audit] sidebar-duplicates: PASS
  · redirect OK: /hr/succession-planning -> /hr/succession
  · redirect OK: /hr/leave -> /hr/vacation-sick
```
