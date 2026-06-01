# Phase 4 — Order → Department fan-out (2026-06-01)

**Owner vision (delivered):** The sales manager opens an order, selects which departments it
needs. **After the 70% advance is paid** (not at create), the order **fans out** to every
selected department — each gets a tracked job with a status lifecycle (started → done). Uses
existing tables + the CQRS event spine; no new parallel system; no new FE page (the existing
order detail page consumes these endpoints).

## Status: 5 / 6 departments wired + live-proven

| Dept (key) | Target table | Created at fan-out | Done signal | Status endpoint |
|---|---|---|---|---|
| Mold (`mold`) | `ow_molds` | vendor='Internal', status ORDERED | status **RECEIVED** | `PATCH :id/molds/:moldId/status` |
| Design (`design`) | `ow_tech_cards` | order_id only (DRAFT) | status **CONFIRMED** → approved_at | `PATCH :id/tech-cards/:tcId/status` |
| Cliché (`cliche`) | `ow_cliches` | photopolymer/Internal, ORDERED | **arrived_at** (ARRIVED) | `PATCH :id/cliches/:clicheId/status` |
| Logistics (`logistics`) | `ow_shipping_requests` → child `ow_deliveries` | shipping request (order-keyed) | delivery **DELIVERED** | `PATCH :id/shipping/status` |
| Warehouse/rulon (`warehouse`) | `ow_material_requirements` | material='TBD', qty=0, NEEDED | status **ISSUED** | `PATCH :id/materials/:reqId/status` |
| **Production** (`production`) | — | **DEFERRED** | — | — (see production-deferred doc) |

## The spine
1. **Advance-paid event** — `confirm-advance-payment.handler` publishes `AdvanceApprovedEvent`
   on the transition into `advance_status='approved'` (the 70% gate).
2. **Selection table** — `sd_order_departments` (order_id, department, mode, status). Manager
   sets it via `PATCH /api/sd/orders/:id/departments`.
3. **Orchestrator** — `AdvanceApprovedFanoutListener` (`@EventsHandler(AdvanceApprovedEvent)`)
   reads the selected departments and creates each dept's job (idempotent), marking it `started`.
4. **Saga view** — `GET /api/sd/orders/:id/saga` returns the order + selected departments + a
   per-department track (count / done / progressPct + rows).

All `ow_*` dept tables were repointed `order_id uuid → integer` (idempotent migrations-drift
DO-blocks) so they key to the operational order `sd_sales_orders.id`. The orphan `ow_orders`
FSM stays dead; only the dept-track tables are reused.

## Pre-existing order-create blockers fixed along the way
Order-create via the API was fully broken (DB is empty/build-phase, so the path had drifted
unnoticed). Three fixes (owner-approved drift-convergence + one code bug):
1. **`sd_sales_orders.version`** — NOT NULL but live DB lost the `DEFAULT 0` its Drizzle def
   declares → null-violation. Re-aligned (migrations-drift, idempotent).
2. **`domain_events.id`** (outbox PK) — `uuid` column, but the def's `$defaultFn(() => createId())`
   produced a **cuid2** (invalid uuid) → outbox insert failed → order tx rolled back. Changed def
   to `.defaultRandom()` + added `DEFAULT gen_random_uuid()`.
3. **`execSdSalesOrderInsert`** — `onConflictDoNothing()` with no `.returning()` → create returned
   `id 0` → advance-payment 404'd. Now `.returning()` the serial id (with by-order_number
   fallback) and `assignPersistedId()` on the aggregate.

## Multi-dept final proof (live, 2026-06-01)
One order, all 5 departments selected, **one** 70% advance:
- → all 5 jobs auto-created (ow_molds / ow_tech_cards / ow_cliches / ow_shipping_requests /
  ow_material_requirements = 1 each), all depts `started`.
- → advanced each (RECEIVED / CONFIRMED / ARRIVED / DELIVERED / ISSUED), all HTTP 200.
- → final saga: all 5 tracks `progressPct 100`, all 5 depts `done`.
- → cleanup verified empty.

## Commits (branch `chore/schema-convergence`)
- mold/design/cliché (earlier), `20e445b6` cliché
- `61b04e4b` logistics + order-create repair (version, domain_events.id, id-return)
- `d2da9052` production deferral doc
- `3ff5c1ce` warehouse/rulon

## Remaining
- **Production** — deferred; needs an order line-item model + product catalog
  (`product_type → product_id`). See `docs/phase4-production-deferred-2026-06-01.md`.
- The dept status endpoints currently advance status only; richer per-dept detail (mold vendor
  reassignment, warehouse real material+qty, logistics driver/route) is future work on top of
  the proven spine.
