# Phase 4 — Production department fan-out: DEFERRED (2026-06-01)

**Decision (owner):** Defer wiring the **production** department into the advance-paid
order→department fan-out. The other departments (mold, design, cliché, logistics) are wired and
live-proven; production is **not** because the data foundation it needs does not yet exist.

This is a *deliberate* deferral, not an omission. Production stays selectable in
`sd_order_departments`, but the fan-out orchestrator currently logs it as "not yet wired" rather
than creating a fake/marker job (the owner explicitly rejected marker-only).

## What the read-only investigation found (live `europrint` DB)

### 1. The manager's product/qty/dimensions DO exist — in `sd_quotation_items`
It is the **only** table carrying the real flexo spec:
```
product_type, paper_type, thickness_mm, length_mm, width_mm, height_mm,
print_colors, lamination, perforation, special_coating, is_new_die,
quantity, unit_price, cost_price, paper_cost, production_cost, print_cost,
delivery_cost, die_cost, setup_time_minutes
```
Link to an order: `sd_sales_orders.id` ← `sd_quotations.order_id` (both `integer` ✅) ←
`sd_quotation_items.quotation_id`. So line-items reach an order **only via its quotation**.

### 2. Gap A — directly-created orders have NO line-items
`POST /api/sd/orders` only accepts `companyId / totalAmount / currency / designFlag / sampleFlag`
— no items. Only **quotation-originated** orders (where `sd_quotations.order_id` is set) have
`sd_quotation_items`. An order created directly has zero line-items, so production would have
nothing to plan.

### 3. Gap B — no production target table can hold the spec
| Target | Only NOT-NULL needs | Holds spec/dimensions? | Order key |
|---|---|---|---|
| `production_plan_lines` | `planned_quantity` | ❌ (`product_id` int + `notes` text only) | `order_id` varchar |
| `production_orders` | `order_number, product_id(int), planned_quantity` | ❌ | `sales_order_id` (SAP) |
| `ow_production_plans` | `order_id(uuid), machine_id, planned_start/end` | ❌ (header: machine+schedule) | uuid |
| `ow_work_orders` | `production_plan_id(uuid), machine_id, qty_target` | ❌ (downstream of a plan) | via plan |

### 4. Gap C — product model mismatch (no catalog)
`sd_quotation_items` identifies products by **`product_type`** (varchar, e.g. "box"/"label"), but
every production table wants **`product_id`** (int FK). There is **no product catalog** and **no
`product_type → product_id` mapping** in the DB.

## Why this blocks a faithful wiring
The owner's vision is "the FULL order detail (incl. dimensions) flows to each department." For
production that means the spec must land somewhere structured. Today it would either be:
- **lossy** (stuff dimensions/spec into `production_plan_lines.notes` as JSON), or
- require **new columns** on a half-formed production-line model, or
- require **orders to always originate from quotations** (so items exist), or
- require a **product catalog** + `product_type→product_id` resolution.

All four are bigger architectural commitments than the other four departments needed.

## What must be decided before production can be wired (un-defer checklist)
1. **Order line-item model**: do operational orders (`sd_sales_orders`) get their own line-item
   table, or is the canonical line-item source always the quotation (`sd_quotation_items`)? If
   the latter, should production fan-out require a linked quotation?
2. **Product catalog**: introduce a products/materials catalog and a `product_type → product_id`
   mapping (or decide production lines key on `product_type` text instead of `product_id`).
3. **Production line table**: choose `production_plan_lines` (lightest, order-keyed) and decide
   whether to add structured spec/dimension columns, or accept `notes`-JSON.
4. **Done signal**: production line tables have no status column — decide whether the dept-track
   "done" lives on `sd_order_departments` only, on a plan header, or needs a new status column.

## Current state (unchanged by this deferral)
- `advance-approved-fanout.listener.ts`: `production` falls into the default branch →
  `log("department not yet wired (Phase 4 incremental)")`. No row is created. No fake.
- Wired + proven departments: **mold, design, cliché, logistics** (4/6).
- Also deferred: **warehouse/rulon** is under separate read-only investigation.
