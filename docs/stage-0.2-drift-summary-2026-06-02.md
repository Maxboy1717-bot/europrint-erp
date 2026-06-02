# Stage 0.2 — DB column/table drift fixes — CLOSED (2026-06-02)

**Branch:** chore/schema-convergence
**Mode:** single Executor, permission-gated, each fix committed alone (no `git add -A`).
**Verification:** every fix typecheck-clean + DB-query proof; #5 also live-verified (HTTP 200).
**Catalog source:** `docs/xato1-katalog-2026-06-02.md`, `docs/xato2-ustun-nom-drift-2026-06-02.md`.

## Fixed (committed)

| # | Fix | Files | Commit | Endpoints revived |
|---|---|---|---|---|
| 1 | `material_cards.name` -> `xom_ashyo` (+ `unit`->`unit_of_measure`, INSERT `code`->`kod`/`name`->`xom_ashyo`, drop `standard_cost`) across erp/wms/pp/qc | 7 | `80c1faaa` | GET /erp/production-facts, /erp/production-plans; MRP/PR/dashboard material names |
| 2 | `warehouse_stock.material_card_id` -> `material_id` (+ `mc.code`->`mc.kod` in 2 WMS controllers) | 8 | `3197569f` | WMS stock-turnover/dashboard/abc-aging, gateway inventory, warehouse inventory |
| 3 | `mes_sessions`: `start_time`->`started_at`, `end_time`->`completed_at`, `pp_order_id`->`production_order_id` | 2 | `9d572b35` | GET/POST /mes/sessions; erp work-center stats |
| 4a | `mes_downtime_events` -> `downtime_events` redirect (`reason`->`reason_description`) | 1 | `8f37f9ac` | POST/GET /mes/sessions/:id/downtime (record + list) |
| 4b | `warehouse_stock_balance` -> `warehouse_stock` redirect (`balance`->`quantity`, `material_card_id`->`material_id`) | 1 | `b24162ce` | inventory-agent forecast + critical-stock (real data instead of fallback) |
| 5 | erp-reports READ: drop phantom `work_center_id` / `reported_by` JOINs -> `dr.*`/`dl.*` | 1 | `3d94bbfc` | GET /erp/daily-reports, /erp/downtime-logs (now HTTP 200 ok:true; were soft-500 ok:false) |

**Key principle applied (4a/4b/5):** when a "missing table/column" is really the code using the
wrong name for an existing object, REDIRECT the code — do not CREATE an empty duplicate or
ALTER ADD a phantom column (that diverges from the blessed Drizzle/migrations schema).

## Deferred (documented, not urgent — all 0-row, nothing blocked)

| Item | Why deferred | Doc / commit |
|---|---|---|
| **4c `gl_journal_lines`** | NOT a single missing table — the whole finance/ratios + finance/gl query model is phantom (`gl_journal_lines` + `gl_accounts` missing, `entry_date`->`posted_at`, `source_id` missing); ALL GL tables = 0 rows. Needs a finance-GL subsystem rewrite. | `docs/deferred-finance-gl-2026-06-02.md` / `f92cc8da` |
| **erp-reports 4 WRITE methods** | create/update DailyReport+DowntimeLog write phantom columns; need JSONB packing + semantic decisions (`work_center_id`->`machine_id`?) + FE-contract check. | `docs/deferred-erp-reports-write-methods-2026-06-02.md` / `bc953025` |
| **Group C (uuid<->int FK drift)** | Owner-deferred to Stage 0.0. Endpoints: GET /erp/capacity (`mes_sessions.work_center_id` uuid <-> `work_centers.id` int), GET /wms/transactions (`mm_materials.id` uuid <-> `material_id` int), bom JOIN type drift. | (Stage 0.0) |

## Still need attention (B-group, NOT assigned to Stage 0.2)

These remain 503 per the catalog; outside the assigned Stage 0.2 scope, listed for the owner:
- **GET /mes/shifts** — `mes_shift_handovers.incoming_supervisor` (DB: `received_by`).
- **GET /mes/maintenance** — `mes_maintenance_requests.assigned_to` + `work_center_id` (DB: `requested_by` / `equipment_id`). Related: the mes-maintenance.repo `reason_id` redirect left flagged in 4a (ambiguous `reason_code_id` vs `mes_downtime_reasons`).
- **GET /wms/transactions** — `wms_transactions.deleted_at` missing (B) + uuid<->int (C).

## Environment

Backend rebuilt (2555 files, SWC) and restarted on :3030 — serving live. Frontend :20806 up.
Live proof captured for #5 via authenticated browser fetch (both endpoints HTTP 200 ok:true).

## Net result

6 drift fixes shipped (22 files), 8+ GET endpoints moved from 503/soft-500 to 200, 3 items
deferred with clear follow-up docs. Drift-fix phase (Stage 0.2) closed. Group C remains for
Stage 0.0; the finance-GL and erp-write paths are separate documented tasks.
