# HR Module — Production-Grade Remediation Progress

Tracking the HR Production Agent Plan. Each entry lists the sub-task, status,
commit SHAs, and any handoff notes for other phases.

---

## Phase 6 — OrgChart Production-Grade

| Sub-task | Status | SHA(s) | Notes |
|----------|--------|--------|-------|
| **T6.1 Search/filter** | done | `b750a549` | Search input + highlight + auto-expand ancestors implemented via `src/pages/org-chart/{OrgChartSearchBar.tsx, orgChartUtils.ts}`. |
| **T6.2 Click person → navigate** | done | `b750a549` | VEP chip now renders as `<Link href="/employees/:id">` when `vepUserId`/`headUserId` is set. Project's actual employee route is `/employees/:id` (not `/hr/employees/:id`). |
| **T6.3 Drag-drop reassign** | wip / deferred | `b3aef1c3` (backend guard only) | Cycle detector dependency from **Phase 1 T1.3** is NOT yet present in this worktree (`apps/api/src/modules/org-structure/application/services/cycle-detector.service.ts` does not exist). A defensive ancestor-walk cycle check has been added inline to `OrgStructureService.move()` so backend rejects (a) self-parent and (b) ancestor cycles even before T1.3 ships. Frontend drag-drop UI not yet wired — handed off. |
| **T6.4 O(n²) → O(n)** | done | `bfe291a4` | Replaced `buildTree(nodes, parentId)` recursion (which called `nodes.filter()` once per node) with a single-pass parent→children Map (2n iterations). New export `buildTree` lives in `org-chart-compat.service.ts`. Frontend `buildIndex` provides the same O(n) guarantee for client-side search. |
| **T6.5 Position Portret** | not started | _n/a_ | Out of scope for this session — handed off. |
| **T6.6 Export improvements** | not started | _n/a_ | Existing Excel/PDF export already in place; HTML + vector-PDF improvements handed off. |

### Audit hooks

- `orgchart-cycle-detection` audit — still **stub-pass** (real cycle detector lives in Phase 1 T1.3). Will only flip to `pass` once that lands; the inline check in `OrgStructureService.move()` is a safety net, not a substitute.

### Reality-check findings (vs. master prompt assumptions)

1. `OrgChartPage.tsx` lives at `artifacts/erp-dashboard/src/pages/OrgChartPage.tsx` — confirmed.
2. Backend `apps/api/src/modules/org-structure/` exists and is flat (no `application/services` sub-tree). Cycle detector service path from the prompt is **not present**.
3. Master prompt referenced `/hr/employees/:id`. Actual route in `HRRoutes.tsx` is `/employees/:id` — links target the actual route.
4. The O(n²) loop the prompt calls out lives in `OrgChartCompatService.buildTree` (compatibility layer used by the `/api/org-chart/tree` endpoint that the page actually consumes), NOT in `OrgStructureService.getHierarchy` (which already uses a parent map). Fixed in the right place.

### Dependencies on other phases

- **Phase 1 T1.3 — CycleDetectorService**: required before T6.3 drag-drop UI is enabled. Once landed, replace the inline check in `OrgStructureService.move()` with `CycleDetectorService.wouldCreateCycle(id, newParentId)`.
- **Phase 2 T2.3 — Mobile responsive**: independent; my changes touch desktop/tablet layouts only and use existing Tailwind utility classes.

### Files added / modified

- `apps/api/src/modules/compatibility/org-chart-compat.service.ts` — replaced recursive O(n²) `buildTree` with O(n) parent-Map implementation; export `buildTree` for unit testing.
- `apps/api/src/modules/org-structure/org-structure.service.ts` — defensive cycle check in `move()`.
- `apps/api/test/org-chart-tree.spec.ts` — 9 tests covering empty/single/multi-level/orphans/order/perf-5000/perf-deep-2000/non-array guard.
- `apps/api/test/org-structure-move.spec.ts` — 6 tests covering self-cycle / ancestor-cycle / valid-move / promote-to-root / deep-cycle-no-DB-write / corrupt-DB tolerance.
- `artifacts/erp-dashboard/src/pages/OrgChartPage.tsx` — slimmed to orchestration only; wires search index + tree node component.
- `artifacts/erp-dashboard/src/pages/org-chart/orgChartTypes.ts` — shared interfaces.
- `artifacts/erp-dashboard/src/pages/org-chart/orgChartUtils.ts` — `buildIndex`, `searchTree`, `highlightTokens`, `collectAllIds`.
- `artifacts/erp-dashboard/src/pages/org-chart/OrgChartTreeNode.tsx` — node renderer with `<mark>` highlight + employee Link.
- `artifacts/erp-dashboard/src/pages/org-chart/OrgChartSearchBar.tsx` — controlled search input + result counter.
- `artifacts/erp-dashboard/src/pages/org-chart/__tests__/orgChartUtils.test.ts` — 12 tests on pure helpers (incl. 5 000-node perf).
- `artifacts/erp-dashboard/src/pages/org-chart/__tests__/OrgChartTreeNode.test.tsx` — 7 tests: highlight, ring, link rendering, link click does not toggle.
- `artifacts/erp-dashboard/src/pages/org-chart/__tests__/OrgChartSearchBar.test.tsx` — 6 tests: placeholder/aria, onChange, count, clear.
