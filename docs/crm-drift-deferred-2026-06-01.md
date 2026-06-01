# CRM Drift — Deferred / Adjacent Issues (2026-06-01)

This session converged the **CRM module's live-DB drift** for the owner-scoped tables and
verified the lead→deal→customer payoff end-to-end (HTTP round-trip + DB check on the live
`europrint` database).

## ✅ Done & live-verified this session

| Commit | Table / flow | Result |
|---|---|---|
| `e8210652` | **crm_deals** | GET list/`:id` 200, POST 201, 404 on missing; full row persisted (stage_id, opportunity, currency_id, close_date, assigned_by_id, additional_info, metadata.lead_id) |
| `8845c313` | **crm_contacts** | CRUD 200/201; email/phone scalar↔jsonb flatten/wrap (no data loss); duplicate-check via `@>` |
| `16131958` | **lead→deal convert** | `POST /api/crm/leads/:id/convert` → crm_deals row (metadata.lead_id) + sd_customers row; real deal id; idempotent (no orphan deal); regression clean |

Ground truth: live `crm_deals` and `crm_contacts` are **Bitrix-style** tables (canonical
defs in `lib/db/src/schema/`). The `schema-compat-1a` defs were the drift source and were
aliased to the real columns. Key live constraints discovered:
- `crm_deals.stage_semantic_id` CHECK = `{process,success,fail}` → app business status is
  stored in the free-form `stage_id` column instead.
- `crm_deals` NOT NULL: `title`, `opportunity`, `assigned_by_id`.
- `crm_leads.status_id` CHECK = `{NEW,IN_PROCESS,CONVERTED,JUNK}`; the app lifecycle
  (`new/qualified/converted`) lives in free-form `status_description`.

---

## ⏸ Deferred — OUT of the agreed scope (crm_deals + crm_contacts only)

These were discovered while fixing the scoped tables. None were touched. Listed for an
owner decision. **Severities are my assessment; verify before acting.**

### 1. `crm_stages` table drift — blocks `/api/crm/funnel`  ·  severity: MEDIUM
`getFunnelStageData` (`drizzle-crm-analytics.repo.ts`) joins `crm_stages` and reads
`cs.is_success`, `cs.is_fail`, `cs.sort_order` — **none of these columns exist** in the live
`crm_stages` table. So `/api/crm/funnel` returns 503 regardless of the (now-fixed) crm_deals
side. Fixing it means converging `crm_stages` the same way (alias/repoint to real columns or
add the columns). The crm_deals column in that query was corrected (`pipeline_id →
category_id`); only the crm_stages part remains.

### 2. `crm_leads.status_id` CHECK mapping — blocks "qualify a lead" in the UI  ·  severity: HIGH
`drizzle-lead.repo.ts` and `drizzle-crm-leads.repo.ts` write
`status_id = getStatus().toUpperCase()`. For a lead moving to **qualified** that yields
`'QUALIFIED'`, which violates `crm_leads_status_id_chk` (`{NEW,IN_PROCESS,CONVERTED,JUNK}`)
→ the qualify action 500s. The convert flow itself is fine (it writes `'CONVERTED'`, which is
valid), and a lead inserted directly as qualified converts correctly — but **in the running
app you cannot move a lead to `qualified`**, so the realistic lead→deal funnel is blocked at
the qualify step. Fix = map lifecycle status → a valid `status_id`
(`qualified → IN_PROCESS`, `lost/junk → JUNK`, etc.) and keep the lifecycle code in
`status_description`. This is a `crm_leads` table concern (prior task), left untouched per scope.

### 3. Phantom `crm_deals` columns in **non-CRM-module** raw SQL  ·  severity: LOW–MEDIUM
The crm_deals def-alias fix protects every Drizzle-property consumer app-wide, but raw SQL
strings outside `modules/crm/` still hardcode columns that don't exist in the live table.
These are pre-existing (the columns never existed); the def change does not affect them.

| File | Phantom ref | Guarded? |
|---|---|---|
| `modules/agents/director-agent.service.ts:62` | `status` | check before acting |
| `modules/agents/strategic-agent.service.ts:43` | `status`, `close_date` vs `NOW()` (varchar/timestamp) | `.catch()` → returns 0 |
| `modules/agents/lead-scoring-agent.service.ts:80,89` | `created_at` | `.catch()` → `[]` |
| `modules/aisha/.../get-customer-info.tool.ts:60` | `SUM(value)` (no `value` col; use `opportunity`/`amount`) | — |
| `modules/compatibility/crm-extended.service.ts:72` | `created_at` (the `:121` query is clean) | — |
| `modules/sd/sales/sales.repository.ts:43,62` | `created_at`, `updated_at`, `status`, `expected_amount` | — |

Clean (no phantom, listed to avoid re-flagging): `marketing-agent.service.ts:51`,
`crm-extended.service.ts:121`.

Note on value semantics: the app now stores business status in `crm_deals.stage_id`
(lowercase `won/lost/...`), while some analytics filter `stage_semantic_id IN ('WON','LOST')`
(uppercase). On the empty build DB this has no effect; worth unifying when data lands.

### 4. Dead/unwired `CrmLeadsOpsService.convert` → `insertDeal`  ·  severity: LOW
`crm-leads-ops.repository.insertDeal` is reached only via `CrmLeadsOpsService.convert`, which
is **not HTTP-wired** (the convert controller uses the `ConvertLeadToDealCommand` CQRS path).
Its drift was fixed (title/forecast_amount/metadata.lead_id), but it does not set the
`opportunity` / `assigned_by_id` NOT-NULL columns — it would fail if ever wired. Either delete
the dead path or complete it.

---

## Suggested next step
If the owner wants the **realistic lead→deal funnel** usable in the UI, do #2 (crm_leads
status_id mapping) next — it is small and unblocks lead qualification. #1 (`crm_stages`)
unblocks the funnel analytics page. #3/#4 are latent and can wait.
