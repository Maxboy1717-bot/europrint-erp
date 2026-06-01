# Kanban / Board Tangle Map (2026-06-01) — READ-ONLY discovery

Ground-truthed with grep/file:line + live DB (`europrint`). Four parallel Explore agents
seeded the search; **every cross-concept claim below was re-verified directly** (the agents
contradicted each other — e.g. one wrongly called `KanbanBoardView` a shared component).

## Verdict (short)
The three concepts are **NOT tangled at the data level** — no shared tables, no candidate
stored in `crm_leads`, no shared stages table across concepts. The real problem is the
opposite: **duplication** — 3 (really 4) independent board implementations, **3 different
stage-storage mechanisms**, and **one latent, unwired schema bridge** from the tasks kanban
to CRM deals. Plus intra-CRM inconsistencies.

---

## The boards that exist

| # | Concept | Route | Page | Board wrapper (DnD) | Column cmpt | Card cmpt | Tables |
|---|---|---|---|---|---|---|---|
| 1 | **Tasks/projects** | `/kanban` | `pages/KanbanBoard.tsx` | `components/kanban/KanbanBoardView.tsx` | `pages/kanban/KanbanColumn.tsx` | `pages/kanban/KanbanCard.tsx` | `kanban_boards`, `kanban_columns`, `kanban_cards` (+ ~25 `task_*`) |
| 2 | **CRM / sales** | `/crm-workspace` (`/crm/*` → redirect, AppRouter.tsx:145-150) | `pages/CRMWorkspace.tsx` | `components/crm/workspace/KanbanView.tsx` | `pages/crm/KanbanColumn.tsx` | `pages/crm/EntityCard.tsx` | `crm_leads`, `crm_deals` (+ `crm_stages`, `crm_pipelines`) |
| 3 | **Recruitment** | `/hr/recruiting-kanban` (AnalyticsRoutes.tsx:43) | `pages/RecruitingKanban.tsx` | `components/recruiting/KanbanBoardGrid.tsx` | `components/recruiting/KanbanColumn.tsx` | `components/recruiting/DraggableCandidateCard.tsx` | `hr_candidate_funnels`, `candidates`, `vacancies` |
| 4 | **SD sales leads** (no drag-drop) | `/sd/crm` (LeadsTab) | `components/sd/europrint/LeadsTab.tsx` | — (manual status buttons) | — | custom Card | `sd_leads` |

Routes: tasks `AnalyticsRoutes.tsx:42`; recruitment `AnalyticsRoutes.tsx:43`; CRM redirects `AppRouter.tsx:145-150`.

## How each stores its stages/columns — THREE different mechanisms
- **Tasks** → DB table `kanban_columns` (dynamic, per-board, user-created). `kanban-core.ts:44`.
- **CRM** → stages are **hardcoded in the frontend** (`pages/crm/crm-types.ts` LEAD_STAGES/DEAL_STAGES). A `crm_stages` table **exists** (live cols: `status_id, entity_id, category_id, name, name_ru, sort, color, semantics`; `entity_id` discriminates `LEAD_STATUS` vs `DEAL_STAGE`) **but the CRM board never queries it** — so the DB stage table and the FE stages are disconnected.
- **Recruitment** → **hardcoded FE constants** (`components/recruiting/helpers-constants.tsx`, 12 stages) backed by a Postgres **enum** `recruitment_funnel_stage` (`lib/db/src/schema/hr-recruiter.ts:32`). No stages table.

## The one real cross-concept link — schema-level, UNWIRED
The **tasks** kanban schema is built to optionally host CRM deals, but nothing wires it:
- `kanban_boards.type` CHECK = `{'crm_deals','tasks','custom'}` — `kanban-core.ts:19,26`.
- `kanban_cards.related_type` CHECK = `{'deal','order','task','none'}`, `related_id` commented "crm_deals.id yoki boshqa" — `kanban-core.ts:78-79,115`.
- **Verification:** `grep` found **zero** references between the `crm` module and the `kanban` module (either direction). No code creates a `'crm_deals'`-type board or syncs `crm_deals` → `kanban_cards`. Live `kanban_boards` has 0 rows, no `type` values present.
- ⇒ A deal can NOT currently appear on the tasks board. The hook exists in the schema only.

## Shared infrastructure (not a tangle)
- `@dnd-kit/*` is used by all three DnD boards — but each wraps it independently (3 separate `KanbanColumn.tsx`, 3 board wrappers). **No generic shared board component.** (`KanbanBoardView` is imported only by tasks `KanbanBoardSections.tsx:23` + a test; recruitment imports `KanbanBoardGrid`; CRM imports `KanbanView`.)
- `@hello-pangea/dnd` is in package.json but **unused** (no imports).

## Where it's CLEAN (verified separate)
- Candidates are NOT stored in `crm_leads`; vacancies are NOT `crm_deals` — separate tables, no FKs between recruitment and CRM.
- Recruitment stages never touch `crm_stages`.
- Tasks `kanban_*` tables have no FK to `crm_*`.
- Routes/controllers/API namespaces are distinct (`/api/kanban/*`, `/api/crm/*`, `/api/hr/recruitment/*`).

## Where the "confusion" actually lives
1. **Duplication, not mixing:** 4 parallel board implementations (3 DnD + 1 manual), 3 stage-storage mechanisms. "Which kanban is the kanban?" is the confusion — not shared rows.
2. **Two sales "leads" boards:** `crm_leads` (CRM workspace) vs `sd_leads` (SD `/sd/crm`) — separate tables, separate UIs. A sales-side split.
3. **CRM ignores its own stage table:** `crm_stages` exists (and even has lead/deal discriminator) yet the FE hardcodes stages — so dynamic pipelines aren't actually wired.
4. **Latent tasks↔deals bridge** (above): `kanban_boards.type='crm_deals'` suggests someone intended deals to be viewable on the tasks board; never implemented.
5. **Intra-CRM workflow confusion** (separate from kanban): `/api/crm/leads/:id/qualify` (QualifyLeadCommand) auto-creates a deal, and `/api/crm/leads/:id/convert` (ConvertLeadToDealCommand) also creates a deal — two endpoints both producing deals from a lead.

## What separating the 3 concepts cleanly would involve (sketch, not a plan)
- Decide ONE board engine: either (a) keep 3 bespoke boards, or (b) extract one generic board (columns+cards+DnD) parametrised per concept. Today there is no shared engine.
- Decide stage storage policy: unify on a table-driven approach, or keep the enum for recruitment + hardcoded for CRM intentionally. Today all three differ.
- Decide the tasks↔deals bridge: either wire `kanban_boards.type='crm_deals'` (deals visible on tasks board) or drop the dead schema fields.
- Resolve the sales-side `crm_leads` vs `sd_leads` duplication (which is the canonical lead?).
- Resolve qualify-vs-convert (both create deals).

READ-ONLY map only — no changes made, no fix executed. Owner decides the separation strategy.
