# EuroPrint ERP — HR Manual Org-Card Entry UI: Full Readiness Audit (read-only)

**Date:** 2026-07-06
**Question:** Can HR staff, starting today, manually recreate the owner's wall-mounted org chart (Vladelets → CEO → 3 directors → 7 Departaments → Otdel → Sektsiya → Sektor, each card showing role title + person/"Vakant" + ЦКП) inside the ERP, card by card, through a UI screen — writing canonical `org_departments` data other systems depend on?
**Method:** Code trace (FE mutation → BE endpoint → table write) + live DB. **⚠️ The live UI is not clickable from this environment** (browser can't reach `:20806`); write-paths were verified by tracing code to real INSERT/UPDATE, and by live DB state — not by driving the actual screen. Flagged inline. **Investigation only — no cards created, no code changed.**

> **Untested-in-practice (per the rules, stated explicitly):** the manual card-by-card UI has **effectively never been used at scale**. Of 143 live `org_departments` rows, **142 were created in 4 bulk-insert bursts** (110 in a single minute on 2026-05-09, 18 on 2026-05-05, etc. — seed/import scripts); **exactly 1 row** exists outside those bursts (2026-06-26). So the cards you see are seeded, not hand-entered. The CRUD code is real (below), but "0–1 cards created through the UI live" — untested, not proven-broken.

---

## Part A — Does the UI exist and is it reachable by HR?

| # | Question | Status | Evidence (route / file:line / live) | Notes |
|---|----------|--------|-------------------------------------|-------|
| A1 | Org-card management screen + nav reachability | **READY** | Canonical page `/org-structure/hierarchy` → `pages/OrgStructureHierarchy.tsx`; detail `/org-structure/hierarchy/node/:id` → `OrgNodeDetail` (`HRRoutes.tsx:73-74`). Sidebar link **"Org Tuzilma"** → `org-structure/hierarchy` (`sidebar/constants.ts:412`). 6 legacy routes (`/orgstructure`, `/org-structure/builder\|view\|cards\|razryad-levels`, `/org-chart`) **redirect** here (`AppRouter.tsx:126-181`). | A real, sidebar-linked page — not hidden. Cards added via `AddNodeDialog`, edited via `OrgNodeDetail` tabs. |
| A2 | Role guard — can an HR-tier role create/edit? | **PARTIAL** (FE/BE role mismatch) | FE gate `HR_ROLES=['hr','hr_manager','admin','director','manager']` (`roleConstants.ts:12`). BE write guard on the **reachable** create path: `@Roles('admin','manager','supervisor','viewer','director')` on `OrgStructureController` (`org-structure.controller.ts:143`). | ⚠️ **`hr`/`hr_manager` open the page but are NOT in the BE `@Roles` for `/nodes` writes → a pure HR-role account would 403 on create/update.** `viewer` can write (over-permissive). Live accounts are `manager`×27/`super_admin`×3/`director`×1, so **a manager/director account works end-to-end today**; a dedicated HR login would be blocked on the reachable path. (The separate `/cards` controller *does* include `hr_manager` — but its UI is orphaned, see C10.) |
| A3 | One card: create+name, set parent, assign employee, set head — real writes? | **READY** (all 4 real, no green-lie) | (a)+(b) `AddNodeDialog.tsx:73` `POST /api/org-structure/nodes` → `db.insert(orgDepartments).values({name,parent_id,node_type,…})` (`org-mutations.repo.ts:36-51`). (c) `EmployeesTab.tsx:71` `PATCH /api/org-structure/users/:userId/node` → `INSERT INTO employee_org_departments` (`org-mutations.repo.ts:309-313`). (d) `MainTab.tsx:223`/`EditDialog.tsx:89` `PATCH /nodes/:id {headUserId}` → `db.update(orgDepartments)` (`org-mutations.repo.ts:130,157`). | All four hit real INSERT/UPDATE — no echo/local-state green-lie (satisfies Q-40/Q-43). Assigning to an owner/ceo/director/section card auto-fills `head_user_id` if null (`repo:330-336`). |

## Part B — Does the UI support the EXACT depth/shape needed?

| # | Question | Status | Evidence | Notes |
|---|----------|--------|----------|-------|
| B4 | Nest 4 levels (Dept→Otdel→Sektsiya→Sektor)? depth cap? | **PARTIAL** | No `maxDepth`/`max_depth` in FE or BE; level is computed from `parent_id` chain (`org-structure.service.ts:105-108`) — **mechanically unbounded**. BUT the create-form `nodeType` dropdown offers only **5 values: owner / top_director / director / department / section** (`types.ts:84-90`). Live deepest `hierarchy_level = 3`; **no `sektor` node_type exists at all**, and `otdeleniye` (14 live rows, seeded) is **not in the create dropdown**. | Depth is buildable by nesting parent IDs, but **the node_type vocabulary can't express the owner's tier names** (Otdel/Sektsiya/Sektor). HR would have to force every tier into "department"/"section" — the structure builds, the *labels* don't match the wall chart. |
| B5 | Bulk/repetitive entry ergonomics | **PARTIAL** | `AddNodeDialog` is a ~15-field form; **parent is set by typing a numeric ID into a text `Input`** (`AddNodeDialog.tsx:152-158`), not a picker. Inline "add child" pre-fills parentId (`OrgStructureHierarchy.tsx:167-170`). No duplicate/clone. Excel bulk-import exists: `POST /api/org-structure/nodes/import` (max 1000 rows, partial-commit, `controller:218`). | Building 50+ cards one-by-one is **tedious** (long form + hand-typed parent id). The owner wants manual (not bulk) entry, so the Excel path is a fallback the owner explicitly doesn't want — meaning the tedium is real. |
| B6 | Save a vacant card (no employee, no head)? | **READY** | No head/employee field in create; save disabled only on empty name (`AddNodeDialog.tsx:229`). `headUserId` optional in DTO (`z.union([number,null]).optional()`, `controller:50`); create never sets it. Live 125/143 rows have null head — vacant is the norm, no crash. | Matches the owner's "vacant stays vacant" rule; degrades gracefully (ZVS-style fallback returns Ok when head null). |
| B7 | ЦКП (purpose) field saved, not decorative? | **READY** | FE `tskp` text field (max 32) `AddNodeDialog.tsx:142-149` → INSERT `tskp` column (`org-mutations.repo.ts:44`); also `tskp_target`, `tskp_measurement_unit`, `ckp_formula_type`. Live `tskp` non-empty on **25/143**. | Wired to a real column. Fill is thin but the write path is genuine. |
| B8 | Card shows person name + "Vakant", wall-chart-like? | **READY** | `TreeNodeCard.tsx`: `isVacant=!node.headUserName` (:29); red dashed border + "vakant" badge (:53,76-80); else avatar + `headUserName` (:124-137). `TreeCanvas` renders a draggable, zoom/pan card tree. | Visual parity with the wall chart: card-per-role, vacant distinct, head name shown. |

## Part C — Cross-reference with known data-integrity gaps

| # | Question | Status | Evidence | Notes |
|---|----------|--------|----------|-------|
| C9 | Writes ONLY to canonical `org_departments`, or also legacy tables? | **PARTIAL** | The reachable create `POST /nodes` inserts `org_departments` **but also mirror-writes legacy `positions` + `departments`** via `sync-helper.ts:32-80` on every create/update. `POST /api/org-functions` (`resources.service.ts:183`) still writes the legacy `org_functions` (97-row) world. **Employee-assignment splits across two disagreeing tables:** `/cards/:id/assign` → `employee_cards` (read by salary/card-gate, `card.repository.ts:495`), while the reachable `/users/:userId/node` and `EmployeeDialog` → `employee_org_departments`. | ⚠️ **Real two-worlds risk.** An employee assigned through the reachable hierarchy screen lands in `employee_org_departments`, but FORMULA-A salary and card-occupant logic read `employee_cards` → the assignment is **invisible downstream**. And node creation keeps feeding legacy `positions`/`departments`. So manual entry does not cleanly consolidate onto one table. |
| C10 | Exactly ONE UI create entry point? | **MISSING (multiple)** | Live: `AddNodeDialog` → `/nodes` (`OrgStructureHierarchy`); `OrgDepartmentsPage.tsx:55` → `POST /api/core/departments` (a separate "Departments" admin page). Orphaned: `OrgCardsPanel`→`CardFormDialog` → `/api/org-structure/cards` (the *canonical* card dialog, imported nowhere; `/org-structure/cards` redirects to hierarchy). | **Two live create pages + one dead canonical dialog.** Both live pages ultimately land in `org_departments` (so no *new* base-table world), but the "right" card-CRUD UI (which is HR-role-gated and writes `employee_cards`) is orphaned, while the reachable path is the generic node path that mirror-writes legacy. HR could create the same unit on two different screens. |

## Part D — Vision cross-check (`docs/migration/02-vysotskiy-7-tree.md`, `docs/audit/ORGSXEMA-INTERVYU-VS-HOLAT-2026-06-25.md`)

| # | Vision requirement | Status | Evidence | Gap |
|---|--------------------|--------|----------|-----|
| D11.1 | Card: role title + razryad as fields | **READY** | `card.controller.ts:24-43`; `card.repository.ts:150` | Matches. |
| D11.2 | Card: ЦКП + target + SON/FOIZ/VAQT unit | **PARTIAL** | `card.repository.ts:151` | Fields built; data sparse (tskp 25/143, target 0); auto-ЦКП feed not built. |
| D11.3 | Card: oylik (salary_type/min/max/bonus) | **PARTIAL** | `card.repository.ts:151` | Fields built but **card→payroll unwired** (payroll uses baseSalary param, not the card); salary data ~0. |
| D11.4 | Card: talab/requirement (structured) | **PARTIAL** | `org_node_portret.portret_data` JSONB, `card.repository.ts:375` | Free JSONB via Portret; no typed schema. |
| D11.5 | Card: darslik/course bound to card | **PARTIAL/MISSING** | `courses.card_id` exists | Bind unwired; course→card 0/5. |
| D11.6 | Person / vacant 5-state lifecycle | **READY** (built since 2026-06-25 doc) | `card.repository.ts:533/552/600/621` freeze/thaw/setVacant/restore | Manual state works; auto offboarding→vacant chain not wired. |
| D11.7 | Single tree: Owner→CEO→7 Otdeleniye→Otdel→Sektsiya→Sektor | **PARTIAL** | tree ~38% (doc) | Tree + drag-reparent live, but **single-tree invariant broken** (14 roots; duplicate otdeleniye sets); `otdeleniye_no` 1-7 not enforced. |
| D11.8 | Manual card-by-card entry is the intended method | **PARTIAL** | orphaned `CardFormDialog`; reachable `/nodes` | Manual entry exists but **fragmented** — canonical dialog orphaned; no card-type template/auto-fill. |
| D11.9 | Excel bulk import | **PARTIAL** (built since doc) | `controller:218` | Endpoint now present; template/upsert thin. |
| D11.10 | HR is the intended maintainer | **READY** | `@Roles(...'hr_manager'...)` on `card.controller.ts:71` | Matches — *but* the reachable `/nodes` path omits `hr` (see A2). |
| D11.11 | head_user_id + razryad = owner/HR DATA | **PARTIAL** (data-gated) | head 18/143, razryad ~0 | Mechanism built; data awaits owner. |
| D11.12 | **Single canonical card table (no two-worlds)** | **MISSING** | `resources.service.ts:183` (org_functions), `sync-helper.ts` (positions/departments mirror) | `org_departments`(143) + `org_functions`(97) + `departments`(18) still parallel; employee carries 3 pointers. Core vision principle unmet. |
| D11.13 | Field-level audit + mandatory reason for money/razryad edits | **MISSING** | Update DTO has no `reason` | Only partial: manual razryad PATCH writes `razryad_history` (`card.repository.ts:234`). |
| D11.14 | Confidential-field projection by role (BE-side) | **MISSING** | `findOne` returns full node | All roles see salary/razryad; no BE projection. |

**Net vs vision:** matches on field schema, HR-maintainer intent, and (newly built since the 2026-06-25 doc) lifecycle + Excel import. Falls short on the **core principle of a single canonical card table** (three worlds still fed), single-tree invariant, card→payroll wiring, confidential projection, and mandatory-reason audit. Nothing materially exceeds vision.

---

## Go / No-Go verdict

**QUALIFIED GO for building the visual structure — but not a clean one, and not with a dedicated HR login as-is.**

Mechanically, the core loop works with real writes: an operator can create a card, name it, nest it under a parent, leave it vacant, type its ЦКП, assign an employee, and set a head — every step is a genuine INSERT/UPDATE (A3, B6, B7), and the tree renders wall-chart-style with name/"Vakant" (B8). So **the hierarchy can be built today**.

**Blockers/frictions, in the order HR would actually hit them during entry:**

1. **Login/role (first thing hit).** With a **dedicated `hr`/`hr_manager` account**, the reachable create page (`/nodes`) **403s** — its BE `@Roles` omits HR (A2). ➜ *Today's workaround: do the data-entry session with a `manager` or `director` account (27 exist), which works end-to-end.* A true HR login is blocked until the role list is fixed.
2. **Tier naming (hit at the first Otdel/Sektsiya/Sektor card).** The create dropdown has no `otdeleniye`/`otdel`/`sektsiya`/`sektor` types — only department/section (B4). HR can nest 4 levels (depth is uncapped) but **cannot label them with the owner's tier names**; the wall chart's structure is representable, its vocabulary is not.
3. **Parent entry friction (every card).** Parent is a **hand-typed numeric ID** (B5) — slow and error-prone across 50+ cards; "add child" helps but there's no picker/duplicate.
4. **Assignment goes to the wrong table (hit when assigning people).** The reachable assign path writes `employee_org_departments`, but salary/card-gate logic reads `employee_cards` (C9) — so assignments **save but are invisible** to the systems that depend on them; and the canonical card dialog that writes `employee_cards` is orphaned (C10).
5. **Two-worlds recurrence (structural, ongoing).** Node creation still mirror-writes legacy `positions`/`departments`, and a second live "Departments" page can create the same unit (C9/C10, D11.12) — the exact fragmentation prior audits flagged.

So: **HR can build the tree today (with a manager/director account), but the result will have mismatched tier labels, and the employee assignments won't reach payroll/permissions** — i.e. it produces the visual chart but not yet the clean canonical data source the downstream systems need.

---

## Fastest-path recommendation (smallest fix vs nice-to-have)

*Analysis-only; stated as the smallest change that would unblock, not a design.*

- **To unblock HR entry TODAY (zero code):** run the data-entry session with a **`manager` or `director` account** — the full create/nest/assign/head/vacant/ЦКП loop works with those roles right now.
- **Smallest code fix to make it truly HR-usable:** add `hr`/`hr_manager` to the `@Roles(...)` on the reachable `OrgStructureController` write endpoints (`org-structure.controller.ts:143`) — a one-line role-list change so a dedicated HR login isn't 403'd (and drop `viewer` from the write list).
- **Smallest fix for data integrity (the one that matters most):** point the reachable assign path and the create flow at **one** membership/card table so assignments reach salary/permissions — i.e. either wire the canonical `CardFormDialog`/`/cards` (writes `employee_cards`) as the single entry point, or make `/nodes` assignment write the same table the salary/gate logic reads. Without this, manually-entered assignments are invisible downstream (the highest-value gap).
- **Nice-to-have (later, not blocking):** add `otdeleniye`/`otdel`/`sektsiya`/`sektor` to the node_type dropdown (tier-name fidelity), a parent **picker** instead of numeric ID + a "duplicate card" action (entry speed), confidential-field projection, and mandatory-reason audit on money/razryad edits.

---

*Investigation only. No cards created, no code or data modified. Live figures are read-only queries against `europrint` on 2026-07-06 (`node _audit/q.cjs "…"`); UI write-paths verified by code trace, not by live clicks (browser unreachable from this environment). Cross-references: `docs/audit/ORGCHART-PERMISSION-READINESS-FULL-2026-07-06.md`, `docs/audit/TWO-WORLDS-FULL-AUDIT-2026-07-06.md`, `docs/audit/ORGSXEMA-INTERVYU-VS-HOLAT-2026-06-25.md`, `docs/migration/02-vysotskiy-7-tree.md`.*
