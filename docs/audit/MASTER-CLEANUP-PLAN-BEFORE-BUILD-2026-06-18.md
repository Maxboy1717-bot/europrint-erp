# MASTER CLEANUP PLAN — everything before the vision-build (P4 design + P5 nav + residual)

> **Advisor (Claude) planning doc, 2026-06-18.** Owner decision (reaffirmed): **finish ALL cleanup first, THEN
> build the vision.** This is the umbrella plan for every remaining pre-build cleanup, grounded in a LIVE
> per-module audit (palette/hex/header across page **and co-located** files — not a page-file-only undercount).
>
> **What this is:** the complete scope + order + rules + Definition-of-Done. **What this is NOT:** the per-module
> executor directive — each module gets its own ≥1000-line directive at its turn (like
> `MUSLIMBEK-PROMT-P4-FINANCE-2026-06-18.md`), generated from this baseline. This doc is the roadmap; the
> per-module directives are the work orders.
>
> **Role model:** Advisor (me) = plan + verify + write directives, never writes app code. Executor (Muslimbek) =
> writes code + commits. Owner relays + visually confirms each module.

---

## §1 — THE SCOPE REALITY (live-measured 2026-06-18, co-located files included)

The design-standardization debt across the whole FE (`artifacts/erp-dashboard/src`):

| Metric | Count |
|---|---|
| Routed pages (≈) | **~317** |
| Pages WITH `EPPageHeader` | **~123 (38%)** → ~194 need a header |
| Raw Tailwind palette sites (`bg-red-500`…) | **~1,557** |
| Inline hex sites (`#rrggbb`) | **~254** |
| **Total raw-color sites to convert** | **~1,811** |
| Files carrying design debt (page + co-located) | **~289** |
| AI/Aisha pages (Q-41 — light touch only) | **~16** |
| Logic-zone pages (GL/payroll/MES/stock — shell-only) | **~48** |

⭐ **Why this is bigger than the first Finance §4 estimate:** the original audit grepped only `<Page>.tsx`. The
real rendering (cards, charts, sections, tabs) lives in **co-located files** (`*Sections/*Tabs/*Cards/*Charts/
*Detail/*Extra`), which hold most of the debt. This plan counts them. The diff-aware `check-design-tokens.mjs`
does NOT flag pre-existing palette in untouched files — so the only reliable measure is an explicit grep of
`<Page>*.tsx`, which this plan uses.

---

## §2 — PER-MODULE SCOPE (the breakdown — each row becomes one module directive)

Pages = routed page components in that route file. Header = pages already using `EPPageHeader`. Palette/Hex =
raw-color sites across page + co-located files. Debt files = files needing conversion. ⚠️Logic = pages whose
posting/closure/calculation/scheduling/stock logic must NOT be touched (restyle shell only). AI = Q-41 light-touch.

| # | Module (route file) | Pages | Header | Palette | Hex | Debt files | ⚠️Logic zones | AI/Q-41 | Status |
|---|---|---|---|---|---|---|---|---|---|
| 1 | **Finance** (FinanceRoutes) | 25 | 12 | ~95 | ~5 | ~24 | GL/payroll (5) | AIFinancePage | 🔄 6.1+6.2+FIXUP+6.3a done; 6.3(8 pages)+6.4 left |
| 2 | **Production** (ProductionRoutes) | 45 | 20 | 233 | 13 | 38 | 8 (MES/CRP/MRP/BOM) | 3 (AIDesignGen, AIProdPlan, AIReservation) | ⏳ |
| 3 | **HR** (HRRoutes) | 44 | 7 | 339 | 34 | 30 | 6 (employee state/leave/discipline) | 2 (AIInterview, HRAIDashboard) | ⏳ (recruiting = delete-nothing redesign) |
| 4 | **CRM/SD** (CRMRoutes) | 37 | 27 | 124 | 15 | 41 | 7 (analytics dashboards, safe) | 1 (AiCrmPage) | ⏳ |
| 5 | **Warehouse** (WarehouseRoutes) | 32 | 9 | 173 | 1 | 20 | 9 (stock/receiving/count) | 0 | ⏳ |
| 6 | **Admin** (AdminRoutes) | 28 | 12 | 177 | 0 | 27 | 4 (GL/invoice/expense/approval) | 1 (AIAgentsPage) | ⏳ |
| 7 | **Director** (DirectorRoutes) | 22 | 6 | 166 | 33 | 28 | 2 (AccountantView, DirectorExtended) | 8 (agents/* dashboards) | ⏳ (mostly AI → lighter than it looks) |
| 8 | **Camera/IoT** (CameraRoutes) | 19 | 15 | 116 | 40 | 36 | 0 | 1 (CameraAIAnalytics) | ⏳ |
| 9 | **Analytics/LMS** (AnalyticsRoutes) | 16 | 11 | 6 | 8 | 2 | 0 | 2 (ForecastAnalytics, AIExams) | ⏳ (quick win — only 2 debt files) |
| 10 | **Stub** (StubRoutes) | 49 | 7 | 111 | 2 | 30 | 7 (GLDocuments/3WayMatch/MES/raw-materials) | 6 | ⏳ (many thin/placeholder pages) |
| — | **AppRouter top-level** | 5 | — | (incl. above) | — | — | — | AishaPage (Q-41) | ⏳ small |

**Notes per module:**
- **Production** — biggest palette load (233). Hotspots: QCModuleHelpers(22), MESHomeDashboardSections(12),
  MRODashboardSections(10+10). MES/CRP/MRP/BOM = scheduling/work-order logic → restyle shell only.
- **HR** — lowest header coverage (7/44) + highest palette (339). Hotspots: HRDashboard(52), DailyReportPage(38),
  CandidateReport(36), RecruiterKPIPage(32). Recruiting kanban = **delete-nothing redesign** (owner decision: keep
  all 9 stats). Employee state/leave/discipline = state-sensitive (don't change logic).
- **CRM/SD** — best header coverage (27/37). Two-worlds note: SDSalesOrders etc. are SD; analytics dashboards
  (Funnel/Cohort/RFM) are read-only — safe to restyle.
- **Warehouse** — almost no hex (1); 173 palette in dashboards (NotificationCenter 21, Logistics 20). 9 stock/
  ledger pages = shell-only.
- **Admin** — all palette, zero hex. GL/invoice/expense/approval = shell-only.
- **Director** — 8 of 22 pages are `agents/*` AI dashboards (Q-41 — light touch), so real work is ~14 pages.
- **Camera/IoT** — highest hex (40), good header coverage (15/19); no logic zones → safe + fast.
- **Analytics/LMS** — near-clean (only 2 debt files). **Quickest module.**
- **Stub** — 49 pages but many are thin placeholders; 7 touch GL/MES/inventory (shell-only).

---

## §3 — THE STANDARD PER-MODULE FLOW (identical for every module)

Each module is ONE checkpoint, executed exactly like Finance. The recipe (full detail in the Finance directive
`docs/audit/MUSLIMBEK-PROMT-P4-FINANCE-2026-06-18.md` §2–§12, reused verbatim):

1. **Audit (fresh).** `grep <Page>*.tsx` for every page in the route file → palette/hex/header per page+co-located.
2. **Header.** Pages lacking `EPPageHeader` get one (title/subtitle/actions via props). Bespoke `text-3xl/4xl`
   page titles + gradient strips → `EPPageHeader`.
3. **Root = `space-y-6`.** ⭐ The shell (`AppShellModern.tsx:180`) already pads (`p-4 lg:p-6`) + scrolls
   (`overflowY:auto`). Page root is plain `space-y-6` — NO own `p-5/h-full/overflow-auto` (double-pad + nested
   scrollbar). (Learned in Finance 6.3.)
4. **Color → token.** Every raw palette class + inline hex → EP token (`--ep-green/red/yellow/blue/...`,
   `--mod-*`). Status `<Badge>`/colored chips → `<EPStatusPill tone=...>`. KPI tiles → `<EPKpiCard>`. Generic
   surfaces → `<EPCard>`. States → `EPErrorState`/`EPEmptyState`/`EPSkeleton*`.
5. **Co-located included.** A page is done only when `<Page>*.tsx` (Sections/Tabs/Dialogs/Cards/Charts/Detail/
   Extra) are ALL palette/hex-clean.
6. **DELETE-NOTHING (Q-46).** Every stat/column/button/dialog/tab/branch/series/label is preserved. Color
   semantics preserved (green=positive, red=negative, yellow=warning, etc.). Restyle, never remove.
7. **Commit per logical group** (`git add <exact files>`), then self-verify, then STOP for advisor.
8. **Self-verify:** FE `tsc` 0 · `check-design-tokens.mjs` clean · `check-sidebar-routes.mjs` PASS ·
   `i18n-status.mjs` uz/uz-cyr 0 missing · `grep <Page>*.tsx` returns only AI/Q-41 pages · DELETE-NOTHING ledger
   (N→N) · screenshots of high-change pages.
9. **Advisor verifies** (adversarial workflow: DELETE-NOTHING + logic-untouched + standard-applied + tone-semantics
   + guards, checking even the verification agents' claims) → **owner visually confirms** → next module.

---

## §4 — CROSS-CUTTING HARD RULES (apply to every module)

1. **FE-presentation ONLY.** No `apps/api/**`, no `*.sql`, no schema/migrations. No change to `useQuery`/
   `useMutation`/`queryKey`/`mutationFn`/`apiRequest`/`onSuccess`/zod/field-names/tab-`value` strings. Same
   behavior, new skin.
2. **⚠️Logic-zones = shell-only.** GL posting / journal / `entries` / `gl_journal_entries`/`gl_lines` (SAP#76) /
   payroll close+calculate / MES scheduling+work-orders / stock-movement+receiving+inventory-ledger — restyle the
   visual container, NEVER touch the calc/posting/closure code path.
3. **AI/Aisha = Q-41 exempt.** ~16 AI pages (AishaPage, AI*, agents/* dashboards): do NOT force the EP card/header
   standard if futuristic. Only fix raw i18n keys + inline hex that breaks dark mode. Keep the bespoke look.
4. **DELETE-NOTHING (Q-46).** Working code is never deleted for "cleanup". Broken/dead code is deleted FULLY (but
   in a design pass you almost never delete — report broken-found to advisor, leave in place).
5. **Co-located scope.** Always grep `<Page>*.tsx`, never just `<Page>.tsx`.
6. **Root = `space-y-6`** (shell pads+scrolls).
7. **i18n: ru → Yandex pipeline.** Fill uz/uz-cyr from in-source fallbacks (`i18n-fill-from-fallbacks.mjs`); never
   hand-write ru (owner decision).
8. **Commit safety.** `git add <exact file>` only; never `-A`. One executor (Q-23). No logs/secrets committed.
9. **Verify-don't-trust — both ways.** Advisor verifies executor AND the verification agents (e.g. an agent
   wrongly called `--ep-primary` "blue" — it's `#FF902F` orange). Token-color claims checked against §3.1.

---

## §5 — RECOMMENDED MODULE ORDER

Owner can reorder. Rationale = finish in-progress first, then a quick win for momentum, then core/high-traffic,
then AI-heavy (lighter than the numbers suggest), then the long tail.

1. **Finance** (finish 6.3 + 6.4) — in progress, proves the pattern.
2. **Analytics/LMS** — quick win (only 2 debt files), builds momentum.
3. **Camera/IoT** — no logic zones, good header coverage → fast + safe.
4. **Warehouse (Ombor)** — core; 1 hex, mostly palette in dashboards.
5. **CRM/SD (Savdo)** — core; best header coverage already.
6. **Production (Ishlab chiqarish)** — biggest; do after the pattern is well-grooved.
7. **HR (Xodimlar)** — biggest palette + recruiting delete-nothing redesign; needs care.
8. **Admin** — GL/invoice logic-zones; shell-only.
9. **Director** — mostly AI agent dashboards (Q-41) → ~14 real pages.
10. **Stub** — long tail of thin/placeholder pages.

(Alternative if owner prefers his earlier order: HR → Ombor → Ishlab chiqarish → SD → CRM first. Either works.)

---

## §6 — P5: NAVIGATION + SIDEBAR (separate checkpoint)

The owner's original visible complaints — handle as one standalone checkpoint (can be done EARLY for visibility,
or last):
- **Top module-nav overflow:** the module tabs don't all fit across the top → overflow/wrap/scroll or a "more"
  menu, so every module is reachable. (Owner screenshot.)
- **Sidebar consistency:** section grouping + spacing uniform across all 17 sidebar groups; the sidebar must show
  modules fully (the owner's "sidebarda to'liq ko'rinmaydi"). No functional route changes — `check-sidebar-routes`
  must stay 275/275.
- **No page deletion** — orphan reality is already resolved (only 2 dead pages; the rest are wired). P5 is layout
  only.

---

## §7 — FUNCTIONAL RESIDUAL (confirm before build — not design)

These are NOT design; verify their status before declaring build-ready:
- **Real 503s:** qc col-drift (qc_final_inspections order_id→papka_order_id/status→result/inspector_id→inspected_by),
  finance `fi_payments`→`finance_payments` — confirm executed. `ow_orders` (missing) = **deferred to vision**
  (two-worlds; owner-gated).
- **Two-worlds / golden-thread:** not in scope for cleanup; the spine harness (`golden-thread-chain-proof.cjs`)
  must still exit 0 after all cleanup (no regression). Build phase addresses two-worlds + wiring.
- **i18n:** P2 done (uz/uz-cyr 0 missing); ru → Yandex pipeline (owner-approved, a build-phase task).

---

## §8 — DEFINITION OF DONE (the gate to start building)

Build starts only when ALL of these hold:
- [ ] All ~317 pages have `EPPageHeader` (except AI/Q-41 pages, by design).
- [ ] `grep` across all `<Page>*.tsx` = **0 raw palette / 0 inline hex** (except AI/Q-41 futuristic pages).
- [ ] Status via `EPStatusPill`, KPI via `EPKpiCard`, states via EP components — app-wide.
- [ ] Page roots = `space-y-6` (no double-pad / nested scroll).
- [ ] **DELETE-NOTHING proven** per module (N→N ledgers) — no feature lost in the whole pass.
- [ ] P5 nav: top-nav fits, sidebar consistent + fully visible.
- [ ] Guards green app-wide: FE `tsc` 0 · `check-design-tokens` clean · `check-sidebar-routes` 275/275 ·
      `i18n-status` uz/uz-cyr 0 missing.
- [ ] Backend untouched by the design pass; `golden-thread-chain-proof.cjs` still exit 0.
- [ ] Owner has visually confirmed each module.

---

## §9 — EFFORT REALITY (honest)

- **~10 module checkpoints + P5 nav.** Each module = 1–3 executor sessions (size-dependent) + advisor verify +
  owner confirm. Finance alone has taken ~4 increments (6.1, FIXUP, 6.2, 6.3a…) and isn't done.
- **~1,811 color conversions + ~194 headers across ~289 files.** This is mechanical but careful (DELETE-NOTHING +
  co-located + verify each). It is the LONGEST phase of the whole project — realistically many sessions.
- This is the cost of "all design first, then build." It is thorough and low-risk (nothing deleted, each step
  verified), but it is not fast. The trade-off was the owner's explicit choice.

---

## §10 — HOW EACH MODULE DIRECTIVE IS PRODUCED

When a module's turn comes, the advisor writes its ≥1000-line directive (Q-47) by:
1. Re-running the per-page+co-located audit for that route file (fresh numbers — this plan's table is the baseline).
2. Reusing the Finance directive's §1–§3, §5, §7, §9, §10, §12 **verbatim** (module-agnostic standard).
3. Writing module-specific §4 (audit table), §6 (per-page blocks with ⚠️logic-zones + AI/Q-41 flags), §11 (checklist).
4. Owner relays it to Muslimbek; advisor verifies each commit-group; owner confirms; next module.

> END OF MASTER PLAN. Order of work: Finance (finish) → §5 sequence → P5 nav → §7 confirm → §8 gate → BUILD.
> Nothing gets deleted; every module is verified; the owner sees each one before we move on.
