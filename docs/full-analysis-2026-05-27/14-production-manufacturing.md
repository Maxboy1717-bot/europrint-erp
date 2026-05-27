# Report 14: Production & Manufacturing (PP Module)

**Date:** 2026-05-27  
**Scope:** apps/api/src/modules/pp/, lib/db/src/schema/pp/, artifacts/erp-dashboard/src/pages/Production*

---

## 1. Module Overview

The Production Planning (PP) module implements manufacturing order management with BOM (Bill of Materials), routing, work center management, MES (Manufacturing Execution System) integration, and QC hooks. It is organized as a folder module with sub-domains:
- `apps/api/src/modules/pp/bom/` — BOM management
- `apps/api/src/modules/pp/production-orders/` — production order lifecycle
- `apps/api/src/modules/pp/routings/` — routing operations
- `apps/api/src/modules/pp/work-centers/` — work center management
- `apps/api/src/modules/pp/technology/` — technologist approval
- `apps/api/src/modules/pp/production/` — production execution
- `apps/api/src/modules/mes/` — MES dashboard (separate module)

The PP module is deeply integrated with SD (sales orders trigger production orders), WMS (material consumption), and QC.

---

## 2. Page/Screen Inventory

| Page file | Purpose |
|---|---|
| `artifacts/erp-dashboard/src/pages/ERPProduction.tsx` | Main production dashboard |
| `artifacts/erp-dashboard/src/pages/ProductionOrder360.tsx` | Production order 360° view |
| `artifacts/erp-dashboard/src/pages/ProductionOrder360Bom.tsx` | BOM sub-view |
| `artifacts/erp-dashboard/src/pages/ProductionOrder360Cost.tsx` | Costing sub-view |
| `artifacts/erp-dashboard/src/pages/ProductionOrder360Equipment.tsx` | Equipment sub-view |
| `artifacts/erp-dashboard/src/pages/ProductionOrder360Quality.tsx` | QC sub-view |
| `artifacts/erp-dashboard/src/pages/ProductionOrder360Dialogs.tsx` | Action dialogs |
| `artifacts/erp-dashboard/src/pages/BOMManagement.tsx` | BOM CRUD |
| `artifacts/erp-dashboard/src/pages/BOMManagementDialogs.tsx` | BOM dialogs |
| `artifacts/erp-dashboard/src/pages/AIProductionPlanning.tsx` | AI-assisted MRP |
| `artifacts/erp-dashboard/src/pages/AIProductionPlanningChart.tsx` | MRP chart |
| `artifacts/erp-dashboard/src/pages/AIProductionPlanningDialogs.tsx` | MRP dialogs |
| `artifacts/erp-dashboard/src/pages/MESProducts.tsx` | MES product tracking |
| `artifacts/erp-dashboard/src/pages/MESDashboard.tsx` | MES dashboard |

Backend controllers (`apps/api/src/modules/pp/presentation/`):
- `pp-orders.controller.ts` — `GET/POST/PATCH /pp/orders`
- `pp-bom.controller.ts` — `GET/POST/PATCH /pp/boms`
- `pp-routing.controller.ts` — `GET/POST /pp/routings`
- `pp-work-centers.controller.ts` — `GET/POST /pp/work-centers`
- `pp-planning.controller.ts` — `GET/POST /pp/planning` (MRP)
- `pp-equipment.controller.ts` — `GET/POST /pp/equipment`
- `pp-intelligence.controller.ts` — `GET /pp/intelligence` (AI insights)

---

## 3. Production Order Lifecycle

**Status chain** (`production_orders.status` CHECK constraint, `pp/pp-production.ts:484`):

```
created → released → in_progress → completed → closed
                                ↘ qc_hold (QC failure) → (back to in_progress or completed)
```

**Order types:** `standard`, `rework`, `sample`

### Data Flow Chain

```
SD module (SdOrderService.transitionStatus → 'released_to_production')
  → Creates production order via event or direct call
  → INSERT INTO production_orders {
      order_number, product_id, bom_id, routing_id,
      sales_order_id, planned_quantity, status='created'
    }
  → INSERT INTO production_order_operations (per routing operation)
  → INSERT INTO production_order_components (per BOM item)

pp-orders.controller.ts PATCH /pp/orders/:id/release
  → PpOrderService.release()
  → UPDATE production_orders SET status='released'
  → Triggers material reservation via POS module:
    → INSERT INTO pos_stock_reservations { production_order_id, material_card_id, reserved_qty }

MES execution:
  → PATCH /pp/orders/:id/start
  → UPDATE production_orders SET status='in_progress', actual_start=NOW()
  → UPDATE production_order_operations SET status='in_progress'

Material consumption:
  → POST /pos/movements { movement_type: 'INTERNAL_ISSUE', production_order_id }
  → posMovementLines with material quantities consumed
  → material_cards.current_stock -= quantity
  → production_material_allocs INSERT

QC check:
  → QC module creates qc_inspection record
  → If passed: UPDATE production_orders SET status='completed'
  → If failed: UPDATE production_orders SET status='qc_hold'
  → IF rework: new production_order with order_type='rework'

Completion:
  → UPDATE production_orders SET status='closed', actual_end=NOW()
  → SD module notified: UPDATE sales_orders SET master_status='ready_for_fg_warehouse'
```

---

## 4. DB Tables & Columns Used

### `production_orders` (lib/db/src/schema/pp/pp-production.ts:438)

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `order_number` | varchar(50) UNIQUE | |
| `product_id` | integer NOT NULL → products.id | |
| `bom_id` | varchar → bom_headers.id | Optional BOM link |
| `routing_id` | varchar → routings.id | Optional routing link |
| `sales_order_id` | varchar → sales_orders.id | SD integration |
| `planned_quantity` | numericMoney NOT NULL | |
| `confirmed_quantity` | numericMoney DEFAULT 0 | Actual output |
| `scrap_quantity` | numericMoney DEFAULT 0 | |
| `order_type` | varchar(20) DEFAULT 'standard' | standard / rework / sample |
| `status` | varchar(20) DEFAULT 'created' | 6-stage lifecycle |
| `planned_start_date` / `planned_end_date` | varchar(10) | YYYY-MM-DD |
| `actual_start_date` / `actual_end_date` | varchar(10) | YYYY-MM-DD |
| `priority` | integer DEFAULT 3 | 1-5 |
| `work_center_id` | varchar → work_centers.id | Primary work center |
| `planned_cost` / `actual_cost` | numericMoney | Cost tracking |
| `defective_qty` | numericMoney DEFAULT 0 | |

### `production_order_operations` (pp-production.ts:502)

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `production_order_id` | varchar NOT NULL → production_orders.id | |
| `routing_operation_id` | varchar → routing_operations.id | |
| `operation_number` | varchar(10) NOT NULL | |
| `work_center_id` | varchar → work_centers.id | |
| `planned_duration` | numericMoney DEFAULT 0 | Hours |
| `actual_duration` | numericMoney DEFAULT 0 | |
| `status` | varchar(20) DEFAULT 'pending' | pending / in_progress / completed |
| `operator_id` | integer | Assigned operator |

### `production_order_components` (pp-production.ts:533)

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `production_order_id` | varchar NOT NULL → production_orders.id | |
| `raw_material_id` | varchar NOT NULL → raw_materials.id | Material needed |
| `required_quantity` | numericMoney NOT NULL | Planned consumption |
| `issued_quantity` | numericMoney DEFAULT 0 | Actual issued |
| `unit` | varchar(20) NOT NULL | |
| `warehouse_id` | varchar → warehouses.id | Source warehouse |

---

## 5. BOM — Implemented

BOM is **fully implemented** in the schema.

### `bom_headers` (pp-production.ts:282)

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `bom_number` | varchar(50) UNIQUE | |
| `product_id` | integer NOT NULL → products.id | |
| `version` | varchar(20) DEFAULT '1.0' | |
| `status` | varchar(20) DEFAULT 'draft' | draft / active / inactive / archived |
| `base_quantity` | numericMoney DEFAULT 1 | Per how many units |
| `base_unit` | varchar(20) DEFAULT 'dona' | |
| `valid_from` / `valid_to` | varchar(10) | Date validity |
| `is_active` | boolean DEFAULT true | |

### `bom_items` (pp-production.ts:321)

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `bom_id` | varchar NOT NULL → bom_headers.id | |
| `item_number` | varchar(10) | |
| `component_type` | varchar(20) DEFAULT 'material' | material / sub_assembly |
| `component_id` | varchar NOT NULL → products.id | **Links to products, not material_cards** |
| `quantity` | numericMoney NOT NULL | |
| `unit` | varchar(20) DEFAULT 'dona' | |
| `scrap_percentage` | numericMoney DEFAULT 0 | |
| `material_id` | integer | ADD-ONLY: link to material_cards |

**Critical issue:** `bom_items.component_id` references `products.id`, not `material_cards.id`. This means BOM components are products (finished/semi-finished), not raw materials. Raw material consumption is tracked separately in `production_order_components` → `raw_materials`.

### `routings` and `routing_operations` (pp-production.ts:~360)

Routings define the manufacturing process steps. Each routing links to a product and contains ordered operations. Operations reference work centers and define planned durations.

---

## 6. Production Tracking Stages

Production tracking is multi-level:
1. **Order level** — `production_orders.status` (6 stages)
2. **Operation level** — `production_order_operations.status` (3 stages per operation)
3. **Work center level** — `work_center_capacity` (planned vs actual utilization)
4. **MES level** — `production_facts_sm72` (daily actual qty, defects per operator)
5. **Material level** — `production_order_components.issued_quantity` vs `required_quantity`

---

## 7. Integration with Inventory (Raw Material Consumption)

```
production_order_components: required_quantity planned at order creation
  ↓ (on RELEASE)
pos_stock_reservations: reserved_qty allocated for the order
  ↓ (on material ISSUE)
POST /pos/movements { movement_type: 'INTERNAL_ISSUE' }
  → pos_movement_lines (records actual issue)
  → material_cards.current_stock -= quantity
  → production_material_allocs (tracks financial value)
  ↓ (on ORDER COMPLETE)
production_order_components.issued_quantity = actual issued
pos_stock_reservations status → 'FULLY_ISSUED'
```

---

## 8. Integration with QC

`production_orders` links to QC via:
- `production_orders.status = 'qc_hold'` — QC failure flag
- `qc_schema.ts:786` — `production_qc_checks.production_order_id` FK (found via grep)
- `ProductionOrder360Quality.tsx` — QC tab in production order 360 view
- `pos_damage_qc_links` — damage events from production link to QC inspections

---

## 9. What Is Missing or Broken

1. **`bom_items.component_id` references `products`, not `material_cards`** — BOM components are finished products, not raw materials. The actual raw material link is `production_order_components.raw_material_id`. This creates a gap: the BOM does not directly drive raw material consumption calculation.
2. **`bom_items.material_id` is an ADD-ONLY integer column** with no FK — intended to link to `material_cards` but not enforced.
3. **`production_orders.bom_id` and `routing_id` are optional** — production orders can be created without a BOM or routing. This defeats the purpose of the BOM system.
4. **No MRP explosion implemented** — the `mrp_runs` and `mrp_results` tables exist (referenced in imports) but no confirmed `MrpService.explodeBom()` implementation was found. AI planning page (`AIProductionPlanning.tsx`) may be using a stub.
5. **`production_order_components.raw_material_id` references `raw_materials`, not `material_cards`** — inconsistent with the rest of the system.
6. **Work center LMS certification block** is schema-defined (`certificationLmsCourseId`) but enforcement in `assignOperator()` not verified.
7. **`production_facts_sm72`** stores operator production facts but `operatorId` is `integer NOT NULL` with no FK to `users.id` or `employees.id`. Orphan records possible.
8. **Dual date columns** — `planned_start_date` (varchar YYYY-MM-DD) and `scheduled_start` (timestamp) duplicate the same data in different types. Same for actual dates.

---

## Summary

PP module has a complete schema for production orders, BOM, routings, and work centers. BOM is implemented but has a gap: components reference `products` not `material_cards`, so the BOM does not directly drive raw material consumption. MRP explosion is schema-ready but service implementation is unconfirmed. QC integration exists. Inventory consumption goes through the POS movement system.

---

## Gaps Table

| Issue | Severity | Evidence | Impact | Suggested Fix |
|---|---|---|---|---|
| `bom_items.component_id` → `products.id` (not material_cards) | P1 | `pp-production.ts:323` | BOM cannot drive raw material consumption | Add `material_card_id` column with proper FK |
| `production_orders.bom_id` optional | P2 | `pp-production.ts:443` (no notNull) | Orders can run without BOM | Require BOM for `standard` order type |
| MRP explosion service unconfirmed | P2 | `AIProductionPlanning.tsx` exists but service body not read | Planning may be manual only | Verify/implement `MrpService.explodeBom()` |
| `production_order_components.raw_material_id` → `raw_materials`, not `material_cards` | P2 | `pp-production.ts:536` | Inconsistent material entity | Standardize on `material_cards` |
| `production_facts_sm72.operatorId` — no FK | P2 | `pp-production.ts:24` | Orphan production facts | Add FK to `users.id` or `employees.id` |
| Dual date types (varchar + timestamp) | P3 | `production_orders` ADD-ONLY columns | Inconsistent queries | Standardize on `timestamp` |
| LMS certification enforcement in `assignOperator()` unverified | P2 | `work_centers.certificationLmsCourseId` | Uncertified operators may be assigned | Read `assignOperator()` service and add guard |

---

## Open Questions / UNVERIFIED

- Does `SdOrderService.transitionStatus('released_to_production')` automatically create a `production_orders` row, or is this manual?
- Is `MrpService` in `apps/api/src/modules/pp/` fully implemented with BOM explosion logic?
- `production_qc_checks` table (referenced at `pp-production.ts:786`) — what are its columns? QC integration depth not fully verified.
- Does `pp-planning.controller.ts` return real MRP data or is it AI-generated suggestions?
