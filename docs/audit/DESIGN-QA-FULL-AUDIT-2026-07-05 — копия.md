# EuroPrint ERP — Frontend Design / Layout QA Audit

**Date:** 2026-07-05
**Type:** Read-only investigation. Nothing modified. A separate task will fix.

## ⚠️ Method & honesty statement (read first)

**Route count:** **~380 page routes**, defined as lazy-loaded arrays across 10 module route files (`HRRoutes`, `ProductionRoutes`, `CRMRoutes`, `FinanceRoutes`, `DirectorRoutes`, `AdminRoutes`, `WarehouseRoutes`, `CameraRoutes`, `AnalyticsRoutes`, `StubRoutes`) and aggregated in `routes/AppRouter.tsx` into one `ROUTE_ARRAY` (per-file lazy counts: Production 73, Stub 50, HR 48, Warehouse 40, CRM 38, Director 29, Admin 28, Finance 26, Camera 20, Analytics 17, + misc).

**Screenshots were NOT captured.** The live app is **login-gated** (`App.tsx:18` `PrivateRoute` + `useAuth`), and I do not have valid credentials (owner-data). Driving a real browser through ~380 authenticated routes × 3 viewports (~1,140 captures) behind that wall is not feasible in one pass. Per the task's own fallback rule, I therefore used **static code analysis** of the page components and shared layout components — grepping for the specific layout anti-patterns and opening the flagged files to cite exact `file:line`. **This is code-traceable QA, not visual verification.**

**Coverage:** every module's route set was swept; **~67 page files were opened and read in full (~18%)**, the rest were pattern-scanned within their module. Screenshot coverage = **0%** (see above). This is honest — a purely visual defect with no code smell (e.g. a runtime CSS cascade only visible when data is present) could be missed.

**Key up-front conclusion on "some pages don't render at all":** I found **zero BROKEN pages in code** — every one of the ~380 routes has a valid default export, guards its arrays (`Array.isArray`/`?.`), and has no `throw` in a render body. The owner's "doesn't render/function at all" symptom is **almost certainly the backend flap I diagnosed & fixed earlier today** (the nest-watch EADDRINUSE restart loop → `ECONNREFUSED`/blank data), **not** a frontend code defect. If pages still fail to render now that the backend is stable, that would be a data/auth issue, not a layout bug.

---

## 1. Findings table (48 findings, by module)

The per-module tables follow. Columns: `Route/Page file | Category | Viewport(s) | Evidence file:line + cause | Severity`.


---

## HR

Static code QA of the ~48 pages referenced by `src/routes/HRRoutes.tsx` (+ shared header/shell components). READ-ONLY. Pages scanned via grep: 48 (all have exactly one `export default` → no missing-export BROKEN cases). Pages opened & confirmed: RecruitingKanban (full), HRPip, HRConflict, SkillsMatrix, InspectionPage, HRMap, HROffboarding + all shared shells (AppShellModern, DedicatedPageShell, EPPageHeader, ui/page-header).

### Headline: header/layout INCONSISTENCY is the dominant defect
Almost NO HR page uses the canonical `EPPageHeader` component. Instead there are ~7 competing hand-rolled header styles. Grep of `<h1` across the 48 files shows the split:
- `EPPageHeader` component (canonical): only ~7 pages (Employees, EmployeeProfile, HRDashboard, HRCapitalTests, HRAIDashboard, Mentorship, ShiftSchedule).
- `PageHeader` (2nd component, `@/components/ui/page-header`): HRMilestones, RaciMatrix, SevenFunctions.
- `<h1 className="font-semibold text-base">` compact-bar family (16px title): ~18 pages — HRPip, HRConflict, HRBirthdays, HRAlumni, HRSafety, HRVacationSick, HRHealthMonitoring, HROnboarding, HROffboarding, HRGamification, HRCareerPath, Discipline, ErrorCatalogConfig, InternalJobBoard, JobDescriptionsPage, RazryadLevelConfig, ShiftTypesConfig, ReferralPage.
- `<h1 className="ep-h1">` hand-rolled (right size, no component): Applications, EventsCalendar, SkillsMatrix, CandidateReport.
- `text-2xl font-bold`: HRMap, HRAssetManagement, RecruiterKPIPage, ReceptionPage, OrgNodeDetail, DailyReportPage.
- `text-xl font-semibold`: HREnps, Questionnaire, QuestionnaireTemplates, OrgStructureHierarchy.
- `text-4xl font-light` + legacy `bg-surface`/`text-on-surface` tokens: RecruitingKanban.

| Route/Page file | Category | Viewport | Evidence file:line + cause | Severity |
|---|---|---|---|---|
| ~41 of 48 HR pages | INCONSISTENT | all | Do NOT use canonical `EPPageHeader` component (`components/ep/EPPageHeader.tsx`). ~7 different header typographies coexist (see list above). No breadcrumb, no shared spacing contract. E.g. SkillsMatrix.tsx:98 `ep-h1`, HRPip.tsx:211 `font-semibold text-base`, HRMap.tsx:92 `text-2xl font-bold`, RecruitingKanban.tsx:197 `text-4xl font-light`. | MEDIUM |
| Shared `components/ui/page-header.tsx` (PageHeader) | RESPONSIVE-BREAK | mobile | Line 50 `flex flex-row items-center justify-between` — NO mobile stacking (contrast EPPageHeader which uses `flex-col sm:flex-row`). Long title + action buttons collide/overflow at <640px. Affects HRMilestones, RaciMatrix, SevenFunctions. | MEDIUM |
| Shared `erp-modern-ui/AppShellModern.tsx` + all self-padding pages | UGLY-BOUNDARY | all | Shell scroll container adds `p-4 lg:p-6` (line 180) AND virtually every HR page re-wraps itself in `p-5 lg:p-6` / `p-6` (e.g. SkillsMatrix.tsx:95, HRPip.tsx:207, HRConflict.tsx:185, HRMap.tsx:88, InspectionPage.tsx:62, RecruitingKanban.tsx:194). Result = ~40-48px DOUBLED outer padding on nearly every HR page. Systemic. **UNCERTAIN** whether visually tuned/accepted, but code shows page is direct child of the padded div (`{children}` at :181). | MEDIUM |
| RecruitingKanban.tsx | INCONSISTENT | all | :194 uses legacy Material tokens `bg-surface` + :197-198 `text-on-surface`/`text-on-surface-variant` (rest of app uses `bg-background`/`text-foreground`); :197 `text-4xl font-light` is a unique header size. Also self-adds `overflow-auto ... h-full` → nested scroll region inside shell's own overflow. | MEDIUM |
| InspectionPage.tsx | INCONSISTENT | all (dark mode) | Hardcoded non-token light colors break dark mode: :65 `text-gray-900`, :69 `text-gray-500`, :73 `bg-red-50 border-red-200`. Also `max-w-6xl mx-auto` centering (:62) — a layout variant no sibling uses. | MEDIUM |
| HRBrandPage.tsx / CandidateReport.tsx | INCONSISTENT | dark mode | Hardcoded `text-gray-900` on title (HRBrandPage.tsx:192, CandidateReport.tsx:105) — fixed dark text, unreadable in dark theme (violates Qoida 21 token rule). | LOW |
| HROffboarding.tsx | RESPONSIVE-BREAK | tablet | :148 `grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-4` — duplicate `sm:` prefix; the later `sm:grid-cols-4` wins so the intended 2-col intermediate is skipped → 4 cramped stat cards at ~640px. | LOW |
| Compact-header family (HRPip.tsx:209, HRConflict.tsx:187, HRBirthdays, HRSafety, etc.) | RESPONSIVE-BREAK | mobile | Header row `flex items-center justify-between gap-3` with NO `flex-wrap`; icon + title + action Button in one non-wrapping row. Short titles OK, but long translated titles + button crowd on narrow screens. | LOW |
| HRMap.tsx | CRAMPED / UNCERTAIN | mobile | Fixed `h-[600px]` skeleton (:82) and `h-[620px]` map container (:156). Tall on mobile but acceptable for a map viewport — likely intentional. Flag only if map should be responsive-height. | LOW (UNCERTAIN) |

### Notes / non-issues verified
- **No BROKEN pages**: all 48 files export a default component; lazy imports in HRRoutes.tsx resolve. EPComingSoon in HREnps/HRAlumni/HROffboarding is used only as an empty/error fallback, not as the whole page — OK.
- Grids are mostly responsive: HRBirthdays, HRCareerPath, HRHealthMonitoring, ShiftSchedule, HRPip, HRVacationSick all use proper `grid-cols-1/2 sm: md: lg:` ramps. Only HROffboarding.tsx:148 is malformed (above).
- `EPPageHeader.tsx` and `DedicatedPageShell.tsx` themselves are sound (EPPageHeader stacks correctly on mobile). The problem is that HR pages bypass them rather than a defect inside them.
- Table scroll (`overflow-x-auto` on wide tables) not observed as a defect; internal card scroll-traps not found in HR set (the `overflow-auto` usages are the intended fixed-header + scrolling-body pattern with `flex-1`).

---

## Production / PP / MES / QC

Static code-analysis QA of the pages referenced by `src/routes/ProductionRoutes.tsx` (PRODUCTION/MES/QC/DESIGN/MRO/IOT route groups, ~73 route entries → ~60 unique page files; many routes share the six "*Extended" orchestrator pages). AppShell (`erp-modern-ui/AppShellModern.tsx:170-183`) already supplies the scroll container (`main` = `height:calc(100dvh-3.5rem); overflow:hidden` → inner div `flex-1; minHeight:0; overflowY:auto; p-4 lg:p-6`), so page-level `flex flex-col h-full p-5` is safe (outer scroll handles overflow) — I did NOT flag routine `h-full`.

Overall: the module is in good shape. No BROKEN (unrenderable) pages found — default exports present, array access guarded (matches CLAUDE.md array-safety PASS). Tab orchestrators (TechPPExtended, MESExtended, MROExtended, QCExtended) delegate to section components that each wrap in `<TabsContent value="…">`, so tab switching works correctly (verified in MESExtendedTabsA.tsx & TechPPExtendedSections.tsx). Defects found are mostly minor/cosmetic; two are real visible bugs.

| Route/Page file | Category | Viewport(s) | Evidence file:line + exact class/cause | Severity |
|---|---|---|---|---|
| `pages/DesignOrderDetail.tsx` (`/design-orders/:id`) | UGLY-BOUNDARY | all | Lines **112 & 157**: `className="min-h-screen from-orange-50 via-gray-50 to-orange-100 dark:from-gray-950 …"` — gradient color-stops (`from-*/via-*/to-*`) with **NO `bg-gradient-to-*` direction class** → the intended gradient background never renders (stops are inert); page shows default bg instead. Definite defect. | MEDIUM |
| `pages/DesignOrderDetail.tsx` | RESPONSIVE-BREAK / SCROLL-TRAP | all | Lines 112, 127, 157: `min-h-screen` on a page nested inside AppShell's `calc(100dvh-3.5rem)` scroll container → forces box ≥100vh, adds ~3.5rem of extra scroll even when content is short; loading spinner (127) centers on a screen-height box offset by the header. | LOW-MEDIUM |
| `pages/ImpositionCalculator.tsx` (`/print/imposition`) | RESPONSIVE-BREAK | mobile/laptop | Line **164**: `className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-4 gap-3"` — **duplicate/conflicting `sm:` prefix**; Tailwind keeps the last (`sm:grid-cols-4`), so the 4 KPI stat cards jump 1→4 columns at 640px and are cramped on small tablets (no `md:`/`lg:` intermediate step intended). Definite class bug. | LOW-MEDIUM |
| `pages/ImpositionCalculator.tsx` | INCONSISTENT | all | Root uses `p-6 max-w-6xl mx-auto space-y-6` (line 86) instead of the module-standard `flex flex-col h-full p-5 lg:p-6 gap-5`; and hardcodes raw palette (`text-slate-900/500/400`, `border-red-300`, `bg-red-50` — e.g. lines 90-91,177,239) instead of `var(--ep-*)`/semantic tokens used by sibling calculators (InkCoverageCalculator uses tokens). | LOW |
| `pages/iot/IoTLoginPanel.tsx`, `IoTSchedulePanel.tsx`, `IoTProductionDashboard.tsx` (`/iot/tablet`) | RESPONSIVE-BREAK | all | `min-h-screen` roots (IoTLoginPanel:28, IoTSchedulePanel:43, IoTProductionDashboard:58). If IoTTablet renders inside AppShell → double scrollbar / header offset. UNCERTAIN — likely intentional standalone full-screen tablet UI (own `font-inter` shell); flag only if tablet route is wrapped by AppShell. | LOW (uncertain) |
| `pages/PapkaOrders.tsx:175`, `pages/DesignOrders.tsx:148` | UGLY-BOUNDARY | all | Loading state wraps spinner in `min-h-screen` inside AppShell → full-viewport box, spinner visually off-center (offset by header) + transient extra scroll. Loading-only, cosmetic. | LOW |
| `pages/TechPPExtendedSections.tsx:87` | INCONSISTENT | — | Bogus/typo Tailwind class `className="mt-0 band-y-4 space-y-4"` — `band-y-4` is not a real utility (dead, harmless; the `space-y-4` still applies). Cosmetic dead class. | LOW |
| `pages/MESExtended.tsx:158` vs siblings | INCONSISTENT | all | Root is bare `<div className="space-y-5">` (no padding, no `h-full`) relying on AppShell padding, while sibling Extended pages (DesignExtended:55, QCExtended:68, IoTExtended:94, TechPP, MRO) use `flex flex-col h-full p-5 lg:p-6 gap-5`. Inconsistent horizontal inset across the same module's tab pages. Also IoTDashboard.tsx:180 / ERPProduction inner / PapkaOrders:186 use bare `space-y-6`. | LOW |
| Shared: `components/DedicatedPageShell.tsx:30` + most pages | UGLY-BOUNDARY | desktop | Shell/pages add `p-5 lg:p-6` on top of AppShell's own inner `p-4 lg:p-6` (AppShellModern.tsx:180) → ~40-48px combined side padding at desktop (double gutter). Systemic and consistent, so reads as intentional generous spacing rather than a break; note once. Used by DedicatedPageShell (qc/InProcessQcPage, RootCausesPage, ReclamationsPage, QcDpmoCalculator) + nearly all module pages. | LOW (uncertain) |

Shared EP components (`components/ep/EPCard.tsx`, `EPPageHeader.tsx`, `EPKpiCard.tsx`, `DedicatedPageShell.tsx`) are structurally sound — no fixed-height/overflow/missing-padding defect inside them; the only shared note is the double-padding above. Fixed heights seen elsewhere are legitimate: `max-h-[90vh] overflow-y-auto` on `DialogContent` (modals), `min-w-[Npx]` on `<TableHead>` (wide tables with horizontal scroll — MrpMatrix.tsx:201-205, PlanningTabPanels.tsx:75-77), and `h-[260px]/h-[300px]` on chart containers (DesignDashboard.tsx:167/197, CapacityPlanningSections.tsx:175) — all OK, not flagged.

pages_scanned ≈ 60 unique files (73 routes); pages_opened fully = 12 (DedicatedPageShell, EPCard, DesignExtended, TechPPExtended, MESExtended, QCExtended, InkCoverageCalculator, ImpositionCalculator, GofraFluteConfig, MROExtended[partial], DesignOrderDetail[partial], AppShellModern[grep]); structure grep-scanned across all remaining (dashboards, qc/*, mro/*, iot/*, ai-planning/*, config pages) + verified 2 section files for TabsContent behavior.

---

## Finance / Analytics / Director

Static code QA of the ~72 pages referenced by `FinanceRoutes.tsx`, `AnalyticsRoutes.tsx`, `DirectorRoutes.tsx`.
Method: grep the anti-patterns across `src/pages` (incl. `pages/agents`, `pages/accountant`, `pages/analytics`, `pages/payroll`, `pages/kanban`, `pages/warehouse`), then opened flagged files to confirm. Shared EP components (`EPCard`, `EPKpiCard`, `EPPageHeader`) and `DedicatedPageShell` were read in full and are **sound** — no fixed-height/overflow/padding defect in them (the defects below are per-page).

**Headline:** No BROKEN pages found (all `throw new Error` are inside handlers/mutationFns, not render bodies; all lazy pages have default exports; KPI grids are guarded with `Array.isArray`). The dominant real defect is a **systemic duplicate-breakpoint Tailwind bug** (`sm:grid-cols-2 sm:grid-cols-4`) — the second `sm:` utility wins in source order, so the grid jumps 1→4/5 columns at the 640px breakpoint, **skipping the 2-column step**, cramping KPI/form cards on 640–767px tablets & large phones. This appears codebase-wide (HR/MES/QC/employee-profile too), not only in these modules.

| Route/Page file | Category | Viewport(s) | Evidence file:line + cause | Severity |
|---|---|---|---|---|
| pages/FinanceBreakEven.tsx | RESPONSIVE-BREAK | mobile/laptop (640–767px) | `:190` & `:217` KPI grids `grid-cols-1 sm:grid-cols-2 sm:grid-cols-4` — duplicate `sm:`; `sm:grid-cols-4` overrides `sm:grid-cols-2` → 4 cramped result cards at 640px. `:157` cost-structure form `sm:grid-cols-2 sm:grid-cols-5` (5 inputs at 640px). `:280` `sm:grid-cols-2 sm:grid-cols-3`. | MEDIUM |
| pages/FinanceVariance.tsx | RESPONSIVE-BREAK | mobile/laptop | `:277` `grid-cols-1 sm:grid-cols-2 sm:grid-cols-5` — 5 centered stat tiles collapse straight to 5-wide at 640px (2-col dead). | MEDIUM |
| pages/FinanceDashboardTabs.tsx (FinanceDashboard) | RESPONSIVE-BREAK | mobile/laptop | `:86` `grid-cols-1 sm:grid-cols-2 sm:grid-cols-4` — dashboard KPI row jumps to 4-wide at 640px. | MEDIUM |
| pages/PricingTiers.tsx | RESPONSIVE-BREAK | mobile/laptop | `:244` `grid-cols-1 sm:grid-cols-2 sm:grid-cols-3` duplicate `sm:` in tier cards. | LOW |
| pages/IdealRasmPage.tsx | RESPONSIVE-BREAK | mobile/laptop | `:329` `grid-cols-1 sm:grid-cols-2 sm:grid-cols-4` duplicate `sm:`. | LOW |
| pages/agents/AgentsHub.tsx | RESPONSIVE-BREAK / CRAMPED | laptop/desktop | `:144` "20 modul holati" grid `grid-cols-2 lg:grid-cols-4 md:grid-cols-5 lg:grid-cols-7` — **duplicate `lg:`**; `lg:grid-cols-7` wins → 7 narrow tiles with `truncate`-clipped module names on desktop; the `lg:grid-cols-4` is dead code. | MEDIUM |
| pages/DirectorExtended.tsx | SCROLL-TRAP / INCONSISTENT (UNCERTAIN) | all | `:136` root is `<div className="flex flex-col">` with **no `h-full`**, wrapping `Tabs` `flex-1 flex flex-col overflow-hidden` (`:159`) + inner `flex-1 overflow-auto` (`:160`). Sibling route pages (FinanceExtended `:158`, DedicatedPageShell, KpiThresholdConfig `:160`) all use `flex flex-col h-full`. With `overflow-hidden` on an unbounded-height flex parent the inner scroll region may not bound correctly (content clip or lost internal scroll) depending on AppShell height. Serves 6 routes (/director/ai-summary, problem-points, production, hr-stats, finance, kpis). | MEDIUM |
| pages/agents/ProductionDashboard.tsx (+ HRPerformance/Quality/Strategic/Facilities/Procurement dashboards) | INCONSISTENT | all | Hand-rolls its own `KpiBox` (`:100`) with hardcoded `bg-slate-50 / bg-red-50 / bg-amber-50 / bg-emerald-50` (`:69`,`:101-103`) instead of `EPKpiCard` used by other module dashboards. Consistent among the 7 agent dashboards but diverges from EP design-system + raw color = Qoida 21 token concern. | LOW |
| pages/KpiThresholdConfig.tsx, pages/KpiScoreWeightsConfig.tsx, pages/CompanyStateThresholdConfig.tsx | INCONSISTENT | all | Hand-roll a custom header `<div className="border-b ... flex items-center gap-3">` (KpiThresholdConfig `:162`) instead of `EPPageHeader`, unlike most sibling routed pages. Cosmetic; layout is otherwise clean (table wrapped in `overflow-x-auto`). | LOW |
| pages/FinanceExtendedTabsExtra.tsx (FinanceExtended → /fi/tax-calendar, /fi/risk-ai) | INCONSISTENT (not a defect) | all | `:103` `TaxCalendarTab` and `:129` `RiskAITab` render `EPComingSoon` / `—` placeholders. Allowed per Qoida 17/F4, but note these two `/fi/*` routes are placeholder content, and RiskAI shows `grid-cols-1 md:grid-cols-3` cards with em-dash values. | LOW |
| pages/kanban/DashboardPanel.tsx (KanbanBoard /kanban) | SCROLL-TRAP (UNCERTAIN — likely intentional) | all | `:190` `max-h-[200px] overflow-auto` (overdue inbox) and `:252` `max-h-[300px] overflow-auto` (employee stats) on dashboard-panel lists. Both capped at `.slice(0,10)`, so bounded internal scroll is deliberate, not variable-content overflow. Acceptable. | LOW |

### Notes / non-findings
- **Grids are otherwise responsive-safe:** the vast majority of KPI rows across these modules use correct `grid-cols-1 md:grid-cols-2 lg:grid-cols-4` (e.g. AccountsReceivable/Payable `:128`, CashFlowManagementSections `:29`, DailyKPIDashboard `:96`, AccountantView `:161/:302`, MaterialsAccountingSections `:74`, LMSDashboard `:140`, EuroprintControlCenterTabs). No bare `grid-cols-4/5/6` without a base/responsive prefix was found in assigned pages.
- **CashierHub.tsx** (688-line page) is well-structured: EPStatusPill/EPEmptyState/EPSkeletonTable, `grid-cols-2 md:grid-cols-4` ledger strip, table scroll correct. No defect.
- **FinanceExtended.tsx / DirectorExtended.tsx** each drive 6 sidebar routes via `URL_TAB_MAP` with **no visible TabsList** (tab triggers replaced by an empty `<div className="border-b ..." />`, FinanceExtended `:166`). Intentional (navigation via sidebar), not a layout break, but worth confirming against vision.
- The duplicate-`sm:`/`lg:` bug is a one-line fix each (change the second prefix to `md:`/`lg:`), and is the highest-value cleanup — fixing the 3 finance dashboards (BreakEven/Variance/FinanceDashboardTabs) removes the visible tablet cramping.

pages_scanned: ~72 (grep across all) · pages_opened (confirmed): 10 page files + 4 shared components.

---

## CRM / Sales / Marketing / Camera

Static code QA of pages referenced by `routes/CRMRoutes.tsx` (SALES_ROUTES + MARKETING_ROUTES) and `routes/CameraRoutes.tsx`. FE root: `artifacts/erp-dashboard/src`. All paths below are relative to that root.

**Overall health: GOOD.** No BROKEN pages found — every lazy import resolves to a real file, no `throw new Error` sits in a render body (the `throw`s in SD/Marketing/Camera pages are all inside mutationFn/event handlers), no page uses `EPComingSoon`/stub as its whole body, and array access is uniformly guarded with `Array.isArray(...)`. The CRM kanban board and the camera video grids are correctly responsive. Findings are layout/responsive polish, not crashes.

| Route/Page file | Category | Viewport(s) | Evidence file:line + exact class/cause | Severity |
|---|---|---|---|---|
| `pages/SDSalesOrders.tsx` | RESPONSIVE-BREAK | mobile/tablet | `SDSalesOrders.tsx:353` two-pane master-detail `<div className="flex gap-6 h-[calc(100vh-260px)]">` with a fixed `w-80` (320px) order-list column (`:355 w-80 ... shrink-0`) and `flex-1` detail (`:379`). No `flex-col md:flex-row` — on a phone the 320px list + gap-6 leaves the detail panel a sliver. Should stack on mobile. | MEDIUM |
| `pages/CRMWorkspace.tsx` (calendar view) | RESPONSIVE-BREAK / UGLY-BOUNDARY | mobile/tablet | `CRMWorkspace.tsx:319` `grid grid-cols-2 lg:grid-cols-7` renders a 7-day calendar (weekday headers + day cells) as a **2-column** grid on everything below `lg` (<1024px). A weekly calendar in 2 columns reads as broken; weekday labels ("Mon…Sun") wrap illogically. Needs `sm:grid-cols-7`. | MEDIUM |
| `pages/SecurityExtended.tsx` | RESPONSIVE-BREAK | mobile | `SecurityExtended.tsx:135` `TabsList className="bg-transparent h-12 gap-4"` holds 7 icon+text triggers (zones/visitors/attendance/ppe/hazmat/evacuation/rating) in a single row inside `border-b px-4` with no `overflow-x-auto` and no `flex-wrap` → tab row overflows / clips on narrow widths. | MEDIUM |
| `pages/SDEuroprint.tsx` | UGLY-BOUNDARY | all | `SDEuroprint.tsx:36` quick-nav is `sticky top-0` but its scroll parent is the **sibling** `flex-1 overflow-y-auto` at `:53`, not itself — the sticky never engages against the actual scroll region (cosmetically OK since it sits at top, but the sticky is inert). UNCERTAIN (may be acceptable as a static header). | LOW |
| Camera module KPI cards (`pages/camera-dashboard-grids.tsx`, `pages/CameraLiveMonitoringSections.tsx`, `pages/SDExtended.tsx:148-163`, most `camera-*.tsx`) | INCONSISTENT | all | Hand-rolled stat cards `<div className="bg-card rounded-lg p-5">` instead of the shared `EPKpiCard`/`EPCard` used elsewhere (e.g. `camera-dashboard-grids.tsx:49,70,82…`). Consistent *within* the camera module but diverges from EP design-system siblings. Broad but low-impact. | LOW |
| `pages/CameraAIAnalytics.tsx` / `pages/CameraLiveMonitoringSections.tsx` | SCROLL-TRAP | all | Side-panel lists with fixed small max-height + internal scroll: `CameraAIAnalytics.tsx:212` `max-h-80 overflow-y-auto`; `CameraLiveMonitoringSections.tsx:196` `max-h-60 overflow-y-auto` (240px — smallish), `:257 max-h-[600px] overflow-y-auto`. Legitimate detection-feed panels, but `max-h-60` is tight. UNCERTAIN (likely intentional). | LOW |
| Camera feed/list ScrollAreas (`camera-*-sections.tsx`, `camera-dashboard-feeds.tsx`, `camera-employees.tsx`, `camera-quality.tsx`, `camera-safety.tsx`, `camera-machines.tsx`) | SCROLL-TRAP (borderline) | all | Repeated `<ScrollArea className="h-[400px]">` / `h-[300px]` / `h-[500px]` wrapping variable lists (e.g. `camera-alerts-sections.tsx:193 h-[500px]`, `camera-employees.tsx:291 h-[400px]`). These are deliberate scroll containers (ScrollArea component), not cards — flagged only for awareness; NOT a defect. | LOW |

### Notes / non-issues verified (so orchestrator doesn't re-flag)
- **CRM Kanban** (`components/crm/workspace/KanbanView.tsx:34`) is correct: `flex-1 overflow-x-auto` + inner `flex gap-5 min-w-max` + columns `w-full sm:w-[270px] flex-shrink-0` (`pages/crm/KanbanColumn.tsx:60`). Proper horizontal-scroll board.
- **Camera video grid** (`CameraLiveMonitoringSections.tsx:90-97`) switches `grid-cols-1 md:grid-cols-2 / lg:grid-cols-3 / lg:grid-cols-4` per 2x2/3x3/4x4 selector; feeds use `aspect-video` (responsive). Fine.
- **Heatmap** `grid grid-cols-10 gap-1 aspect-square max-w-[500px] mx-auto` (`camera-heatmap-employee.tsx:90`, `camera-heatmap-general.tsx:175`) — fixed 10-col is intentional heatmap matrix, centered + capped. Fine.
- **Recharts** `h-[300px]`/`h-[400px]` wrappers (`camera-reports-tabs*.tsx`) are the required fixed-height parent for `ResponsiveContainer`. Fine.
- The three `*Extended` hub pages (`SDExtended`, `MarketingExtended`, `SecurityExtended`) are fully real (queries + mutation in SecurityExtended), use `EPPageHeader`, and are NOT stubs.
- `EPCard.tsx` shared component is clean (token-based padding default 18, no fixed height/overflow) — no shared-component defect.

---

## WMS / IoT / MRO / Design / POS-Monitor

**Verdict: healthy module.** Static analysis of the pages behind `WarehouseRoutes.tsx` (~40 WMS pages), plus `pages/mro` (6), `pages/iot` + `IoTDashboard/IoTTablet/IoTExtended`, `Design*` pages, `components/wms`, and the 44-file `pos-monitor/` app. Shared shell (`DedicatedPageShell`) and the EP component set (`EPCard`/`EPKpiCard`/`EPPageHeader`) are correctly responsive — `EPPageHeader` even documents a deliberate `min-h-fit` fix for a prior header-overlap bug. All 46 assigned page files have a valid `export default` — **no BROKEN pages found**. Nearly every grid uses `grid-cols-1 sm:… md:… lg:…` responsive fallbacks. Overflow scrollers are on dialogs/side-panels/wide tables (legitimate), not on reflowable cards. Findings below are minor.

| Route/Page file | Category | Viewport(s) | Evidence file:line + cause | Severity |
|---|---|---|---|---|
| pages/WarehouseMaterial360.tsx | CRAMPED (UNCERTAIN) | laptop (lg 1024–1280) | :174 `lg:grid-cols-7` — 7 KPI boxes incl. money values (`fmtMoney` e.g. "1 234 567 so'm") in ~105px columns at lg width minus sidebar; values will wrap/truncate. Fine at xl+. Steps down to md:4 / sm:2 so mobile OK. | LOW-MEDIUM |
| pos-monitor/layout/PosLayout.tsx | RESPONSIVE-BREAK (UNCERTAIN) | mobile/narrow tablet portrait | :60–124 `.pos-topbar` packs logo + "ERP ga qaytish" link + clock + online-status + lang + notif + user block + logout in one flex row with **no `flex-wrap`** (raw inline styles, `pos-*` CSS). Designed for landscape tablet; would overflow in portrait/narrow. | LOW |
| pages/MMPurchaseOrders.tsx | CRAMPED (UNCERTAIN) | laptop (md 768) | :206 `md:grid-cols-6` — 6 status stat cards at md ≈120px each. Has `grid-cols-1 sm:grid-cols-2` fallback so acceptable; slightly tight at exactly md. | LOW |
| pos-monitor/** (44 files) | INCONSISTENT (by design) | all | POS Monitor is a deliberately separate design system (`pos-root`/`pos-topbar`/`pos-btn`, `var(--pos-*)` tokens, heavy inline `style={{}}`) rather than EP components — internally consistent, intentional per spec 2026-06-27 ("tablet data-entry app"). Not a layout defect; noted for awareness only. | LOW |

### Non-findings (checked and cleared)
- **~59-warehouse overview list** (`WarehouseDashboardPage.tsx:149–174`): plain `<table>` in `overflow-x-auto`, no fixed height — reflows correctly. OK.
- **Scroll containers**: `WarehouseDashboardPage.tsx:190` (`max-h-96 overflow-y-auto` recent-movements side panel), `WarehouseStockPage.tsx:174` (`max-h-80` inside a **Dialog**), `WarehouseMaterialKitsDialogs.tsx:34` (`max-h-[400px]` in dialog), `WarehouseAuditLog.tsx:228/236` (`max-h-32` on `<pre>` JSON diff w/ `overflow-x-auto`) — all legitimate bounded scroll, not scroll-traps.
- **IoT tablet large elements**: `h-16/h-20/h-24` buttons & inputs in `pages/iot/IoTProductionDashboardDialogs.tsx`, `IoTSchedulePanel.tsx`, `IoTProductionDashboard.tsx` are intentional large touch targets for the tablet UI. OK.
- **Fixed heights on `h-24/h-32` etc.**: all are Skeleton loaders or dashed empty-state placeholders (`DesignExtendedSections.tsx:86/176`, `MMExtendedFleetTabs.tsx:67`, `IoTExtendedSectionsExtra.tsx:110`) — not content containers. OK.
- **EPComingSoon**: only used `variant="inline"` inside individual tabs (`DesignExtended.tsx:96`, `MMExtendedTabs.tsx:43`) — partial section placeholders, never the whole page. OK.
- **min-w-[200px]/[300px] flex items**: all paired with `flex-1` in flex-wrap search/filter rows — reflow fine. OK.
- **pages/mro (6 pages)**: no fixed-height/overflow/dense-grid/oversized-width hits. Clean.

### Shared component issues
None. `EPCard`, `EPKpiCard`, `EPPageHeader`, `DedicatedPageShell` are all sound and responsive — no fixed-height/overflow/padding defects that would cascade to pages.

pages_scanned ≈ 90 (40 WMS route pages + 44 pos-monitor files + iot/mro/design). pages_opened = 9 (DedicatedPageShell, EPCard, EPKpiCard, EPPageHeader, WarehouseDashboardPage, WarehouseStockPage, WarehouseMaterial360, IoTTablet, PosLayout) — remainder assessed via grep of anti-pattern classes across the full set.

---

## Admin / LMS / Kaizen / Integration / Stub

Scope: all pages referenced by `routes/AdminRoutes.tsx` (28 unique: admin config, INTEGRATION, SAAS, LMS_ADMIN, LMS_LEARNER, KAIZEN, ORDERS_REGISTRY, ARCHITECTURE_GAP) + `routes/StubRoutes.tsx` (~48 unique). 76 unique page files scanned; 13 page files opened in full; all 76 grepped for anti-patterns. No live screenshots (login-gated) — static analysis only.

### Key verification results
- **StubRoutes = NOT stubs.** All ~48 lazy imports in `StubRoutes.tsx` resolve to fully-built pages with real content and valid `export default`. NONE render `EPComingSoon`/`ComingSoonPage`/`notImplemented`. CLAUDE.md's "stub-routes = 0" claim is CONFIRMED — the file name is legacy; every route renders a real page. No BROKEN/blank/error stub found.
- **No BROKEN pages.** All 76 files have a default export; no `throw new Error` in render bodies; no `w-screen`, no negative margins. Array-safety guards present (`Array.isArray(...) ? ... : []` pattern used consistently, e.g. AgentsHub, TelegramBotAdmin) — consistent with the global array-safety reviewer passing.
- Shared EP components (`EPCard.tsx`, `EPPageHeader.tsx`, `EPComingSoon.tsx`) are SOUND — no fixed-height/overflow/padding defect in them.

### Findings

| Route/Page file | Category | Viewport(s) | Evidence file:line + cause | Severity |
|---|---|---|---|---|
| `erp-modern-ui/AppShellModern.tsx` (SHARED — affects ~all pages) | UGLY-BOUNDARY | all | Main canvas child `<div className="p-4 lg:p-6" style={overflowY:auto}>` (AppShellModern.tsx:180) wraps every routed page. Most pages ALSO wrap themselves in `flex flex-col h-full p-5 lg:p-6` → shell p-6 + page p-6 = ~48px doubled horizontal padding app-wide. UNCERTAIN (may be intentional generous spacing) but redundant. | MEDIUM (uncertain) |
| NotificationSettings / ApprovalHub / SaaSExtended / LMSExtended / IoTExtended / MESWorkerAssignments / HRVacationSick | UGLY-BOUNDARY | desktop/laptop | Outer wrapper already has `p-5 lg:p-6`, then an inner content `<div className="flex-1 overflow-auto p-6">` adds a THIRD padding layer (ApprovalHub.tsx:296+311, SaaSExtended.tsx:96+112, LMSExtended.tsx:129, IoTExtended.tsx:108, HRVacationSick.tsx:109, NotificationSettings.tsx:112, MESWorkerAssignments.tsx:130). Redundant nested padding. The `flex-1 overflow-auto` itself is a legit tab/scroll container (not a scroll-trap). | LOW-MEDIUM |
| ApprovalHub.tsx / SaaSExtended.tsx | UGLY-BOUNDARY | all | `border-b` custom header (`ApprovalHub.tsx:297`, `SaaSExtended.tsx:97`) sits INSIDE the `p-5 lg:p-6` container, so the divider line is inset from the card/page edges (floating underline) and header text is double-indented (`px-6` on top of outer `p-6`). | LOW |
| ApprovalHub.tsx, SaaSExtended.tsx, Settings.tsx, SuperAdminPanel.tsx, ExceptionLog.tsx, QueueMonitor.tsx, UsersPage.tsx, AuditLogPage.tsx, KnowledgeBase.tsx, LMSSupport.tsx, CameraAIAnalytics.tsx, Customer360Page.tsx, +~42 more | INCONSISTENT | all | ~54 of 76 assigned pages do NOT import `EPPageHeader`; they hand-roll headers (custom `border-b`+`<h1>`) while ~22 siblings (ProgressPage, LMSExtended, GLDocuments, etc.) and the canonical `DedicatedPageShell` use `EPPageHeader`. Widespread header-style drift, not a one-off. Systemic — report once. | MEDIUM (systemic, uncertain) |
| pages/agents/AgentsHub.tsx | RESPONSIVE-BREAK / INCONSISTENT | laptop/desktop | Line 144: `grid grid-cols-2 lg:grid-cols-4 md:grid-cols-5 lg:grid-cols-7` — DUPLICATE/conflicting `lg:grid-cols-*` (grid-cols-4 is dead, grid-cols-7 wins) and illogical breakpoint order (`md:` after `lg:`). Renders (7 cols at lg) but sloppy. | LOW |
| pages/NotificationSettings.tsx | CRAMPED | mobile | Lines 121 & 139: a 5-field pseudo-table built as `grid grid-cols-2 lg:grid-cols-5`; on mobile the 5 fields squash into 2 columns and wrap, header vs rows may misalign. Has responsive intent. UNCERTAIN. | LOW |
| pages/TelegramBotAdmin.tsx | SCROLL-TRAP (likely intentional) | all | Line 145: connected-users list `space-y-1.5 max-h-80 overflow-y-auto`. Bounded 320px scroll list inside a Card. Legit long-list feed pattern; flag as possible internal scrollbar. UNCERTAIN. | LOW |
| pages/CameraAIAnalytics.tsx | SCROLL-TRAP (likely intentional) | all | Line 212: `space-y-3 max-h-80 overflow-y-auto` list inside a card. Same bounded-feed pattern. UNCERTAIN. | LOW |
| pages/EuroprintControlPage.tsx | SCROLL-TRAP (likely intentional) | all | Line 259: audit-log feed `divide-y max-h-72 overflow-y-auto` inside a card. Bounded activity feed. UNCERTAIN. | LOW |

### Notes
- KaizenPage.tsx (kaizen), OrdersRegistry.tsx, ProgressPage.tsx, ValidatePage.tsx, AIAgentsPage.tsx, EmployeesForFacePage.tsx and the bulk of the stub-route pages are clean: responsive grids (`grid-cols-1 sm/md/lg:grid-cols-N`), guarded arrays, EP components or `<table>` with legitimate `overflow-x-auto`. No fixed pixel widths that break mobile (all `w-[180px]` etc. are `w-full sm:w-[..]` responsive or table-cell `max-w-[..] truncate` on secondary text = acceptable).
- No CRAMPED fixed small-height content containers (`h-16..h-64`/`max-h-[Npx]` wrapping variable content) found beyond the three bounded-list feeds above.


---

## 2. Total routes vs. actually inspected

| Metric | Count |
|--------|------:|
| Total page routes (lazy) | ~380 |
| Routes/pages **opened & read in full** (code) | ~67 (~18%) |
| Routes **pattern-scanned** within their module | ~all |
| Routes inspected **in a live browser (screenshot)** | **0** (login-gated, no credentials) |
| Pages found **BROKEN** (fail to render, code-level) | **0** |

**Why 0 screenshots:** the app requires login (`PrivateRoute`) and credentials are owner-data I do not hold; ~380 routes × 3 viewports is also beyond a single pass. A follow-up with a valid login could visually confirm the code-level findings below — especially the "cramped grid" and "double-padding" items, whose severity depends on live content width.

## 3. Per-module summary (worst → best)

| Module | Pages | Findings | Worst issue | Notes |
|--------|------:|---------:|-------------|-------|
| **HR** | 48 | 9 | INCONSISTENT — only ~7/48 use `EPPageHeader`; ~7 competing hand-rolled header styles | Biggest single-pattern cleanup opportunity |
| **Admin / LMS / Kaizen / Stub** | 76 | 9 | UGLY-BOUNDARY — triple padding on the Extended/Hub family; ~54/76 hand-roll headers | StubRoutes confirmed NOT stubs (all real pages) |
| **Finance / Analytics / Director** | 72 | 11 | RESPONSIVE-BREAK — duplicate-`sm:` grid bug (KPI grids jump 1→4/5/7 cols) | Most concrete widespread bug lives here |
| **Production / PP / MES / QC** | ~60 | 9 | UGLY-BOUNDARY — `DesignOrderDetail` gradient never renders (missing `bg-gradient-to-*`) | Two real visible bugs; rest LOW |
| **CRM / Sales / Marketing / Camera** | 58 | 7 | RESPONSIVE-BREAK — SDSalesOrders 2-pane doesn't stack; CRMWorkspace 7-day calendar collapses to 2 cols | Kanban & camera grids verified sound |
| **WMS / IoT / MRO / Design / POS-Monitor** | ~90 | 3 | CRAMPED — 7-across KPI row on Material360 at laptop | Cleanest module; 59-warehouse list reflows fine |

## 4. Shared-component root causes (fix once → fixes many)

**These three systemic issues explain the owner's "cramped / ugly boundaries" observation far more than any per-page bug:**

1. **Duplicate-breakpoint Tailwind grid bug (codebase-wide) — the #1 concrete defect.** `grid-cols-1 sm:grid-cols-2 sm:grid-cols-4` (or `lg:grid-cols-4 … lg:grid-cols-7`): when the *same* responsive prefix appears twice, CSS source-order makes the **later one win**, so the grid jumps straight from 1 column to 4/5/7, **skipping the 2-column step** — cramming KPI/stat/form cards on tablet/laptop widths. Confirmed occurrences: `FinanceBreakEven.tsx:190,217`, `FinanceVariance.tsx:277`, `FinanceDashboardTabs.tsx:86`, `PricingTiers.tsx:244`, `IdealRasmPage.tsx:329`, `ImpositionCalculator.tsx:164`, `HROffboarding.tsx:148`, `agents/AgentsHub.tsx:144`. Each is a **one-line fix** (change the second prefix to `md:`/`lg:`). This is exactly "content squeezed into too-small a container."

2. **App-shell double/triple padding (UGLY-BOUNDARY, systemic, UNCERTAIN).** The scroll canvas in `components/AppShellModern.tsx:180` already applies `p-4 lg:p-6` + `overflowY:auto`, **and** most pages re-wrap their content in `flex flex-col h-full p-5 lg:p-6` (the `DedicatedPageShell.tsx:30` pattern), **and** the Extended/Hub family (`ApprovalHub`, `SaaSExtended`, `LMSExtended`, `IoTExtended`, `HRVacationSick`, `NotificationSettings`, `MESWorkerAssignments`) adds a further inner `flex-1 overflow-auto p-6` → ~40–48px doubled (or tripled) side gutters and inconsistent edges between pages. Marked UNCERTAIN because it may have been visually tolerated, but it is the most likely cause of "inconsistent boundaries/spacing between pages."

3. **`EPPageHeader` non-adoption (INCONSISTENT, ~54–95 pages).** The canonical header component is used by only a minority of pages; the rest hand-roll ~7 different title typographies (`text-base` / `text-xl` / `text-2xl` / `text-4xl` / `ep-h1` / a second `ui/page-header.tsx` that doesn't stack on mobile). This makes headers look different page-to-page within the same module. A single migration to `EPPageHeader` fixes it wholesale — and also fixes the mobile-collision of the non-responsive `ui/page-header.tsx:50` (used by HRMilestones, RaciMatrix, SevenFunctions).

**Confirmed NOT root causes (verified sound):** `EPCard`, `EPKpiCard`, `EPPageHeader`, `DedicatedPageShell` themselves have no fixed-height/overflow/padding defect. CRM kanban board (`overflow-x-auto` + `min-w-max` + responsive columns), camera video grids (`aspect-video` + responsive `grid-cols`), and the 59-row warehouse overview (plain `overflow-x-auto` table) all reflow correctly. `pos-monitor/` is a deliberately separate, internally-consistent design system (`var(--pos-*)` tokens).

## 5. Top 10 worst offenders (severity × how many users see it regularly)

1. **Duplicate-`sm:`/`lg:` grid bug** (8+ high-traffic finance/HR/production pages) — RESPONSIVE-BREAK/CRAMPED, MEDIUM but everywhere; the clearest match to "renders too small/cramped."
2. **App-shell double/triple padding** (~all pages) — UGLY-BOUNDARY; every page inherits inconsistent gutters. High reach.
3. **`EPPageHeader` non-adoption** (~54+ pages across HR/Admin) — INCONSISTENT headers, seen on every page load.
4. **`agents/AgentsHub.tsx:144`** duplicate-`lg:` → 7 truncated module tiles — dashboard users hit this daily. MEDIUM.
5. **`DirectorExtended.tsx:136`** root missing `h-full` under `overflow-hidden` Tabs (drives 6 director routes) — possible clipped/lost internal scroll. MEDIUM, UNCERTAIN.
6. **`SDSalesOrders.tsx:353`** fixed `w-80` sidebar + `flex`, no mobile stacking → detail panel crushed on laptop/mobile — a core sales page. MEDIUM.
7. **`CRMWorkspace.tsx:319`** 7-day calendar renders as 2 columns below 1024px — CRM users on laptops. MEDIUM.
8. **`DesignOrderDetail.tsx:112,157`** gradient background never renders (`from/via/to` with no `bg-gradient-to-*`) — visible "broken look" on every design order. MEDIUM.
9. **`SecurityExtended.tsx:135`** 7-tab `TabsList` (`h-12 gap-4`) with no `overflow-x`/`flex-wrap` → tabs overflow on narrow widths. MEDIUM.
10. **Hardcoded light-only colors** (`InspectionPage.tsx:65,73` `text-gray-900`/`bg-red-50`; HRBrandPage; CandidateReport) → dark-mode break. LOW-MEDIUM, but affects anyone using dark mode.

## 6. Final completeness statement

- Total page routes: **~380**. Opened & read in full: **~67 (~18%)**; module-swept: ~100%; **live browser screenshots: 0** (login-gated, no credentials — the honest gap).
- **BROKEN pages found: 0.** The "pages don't render at all" symptom is attributed to the earlier (now-fixed) backend restart-loop, not frontend code.
- Findings are **overwhelmingly systemic** (3 shared root causes) rather than per-page — the fix strategy should be component/pattern-first (duplicate-breakpoint sweep, padding reconciliation, `EPPageHeader` migration), which would clear the majority of the 48 findings at once.
- **Recommended follow-up before fixing:** obtain a test login and visually confirm the Top 10 at desktop/laptop/mobile — a handful may prove visually tolerable (the double-padding especially), and content-dependent cramping is best judged with real data on screen.

*Investigation only — nothing modified.*
