# Report 14 — Production & Manufacturing

**Date:** 2026-05-27 (second pass)
**Scope:**
- `apps/api/src/modules/pp/` (Production Planning)
- `apps/api/src/modules/mes/` (Manufacturing Execution System)
- `apps/api/src/modules/qc/` (Quality Control)
- `lib/db/src/schema/pp/`, `lib/db/src/schema/mes-schema.ts`, `lib/db/src/schema/qc-schema.ts`
- `apps/api/src/modules/erp/erp-products.controller.ts` (frontend hits this for BOM)
- `artifacts/erp-dashboard/src/pages/` (frontend production/MES/BOM pages)

## Diff vs round 1

Round-1 audit (`docs/full-analysis-2026-05-27/14-production-manufacturing.md`) — partly correct, partly wrong, partly incomplete:

| Round-1 claim | Verdict | Note |
|---|---|---|
| "MRP service existence unconfirmed" | **WRONG.** | A full MRP handler with Wagner-Whitin, POQ, EOQ, L4L lot-sizing is implemented in `apps/api/src/modules/pp/application/commands/run-mrp.handler.ts` (269 lines) — backed by a real `BomExplosionService` (Kahn topo sort, 232 lines). |
| "`bom_items.component_id` references `products.id` (wrong table)" | **PARTIALLY WRONG.** | Drizzle column is `integer` with NO `.references()` (line 330). A code comment says "FK type fix: should reference material_cards.id (integer), not products.id". DB-level FK is **actually applied** via `migrations-drift.ts:3288–3292`: drops `bom_items_component_id_fkey` and re-adds it pointing to `material_cards(id)`. So in the live DB, it points to `material_cards`, not `products`. |
| "`production_order_components.raw_material_id` references `raw_materials`" | **WRONG / OUT OF DATE.** | Drizzle column is `integer` with no FK in code (line 544), but `migrations-drift.ts:3294–3297` drops the old FK and re-adds it as `FOREIGN KEY (raw_material_id) REFERENCES material_cards(id)`. The schema comment confirms: "FK type fix: was varchar referencing raw_materials; changed to integer to reference material_cards.id". |
| "`production_facts_sm72.operatorId` has no FK" | **WRONG.** | Line 24 of `pp-production.ts` shows `operatorId: integer("operator_id").references(() => users.id, { onDelete: "set null" })`. The FK was added. |
| "Dual date columns in production_orders" | **CORRECT.** | Confirmed at `pp-production.ts:456–459` (varchar YYYY-MM-DD) and `471–474` (timestamp). Both groups co-exist. |
| "bom_items has `material_id` ADD-ONLY integer with no FK" | **CORRECT.** | Line 337 — `materialId: integer("material_id")` has no `.references()`. This is what `erp.repository.ts` JOINs against (see Section 2). |
| Status chain `created → released → in_progress → completed → closed` (6 stages) | **CORRECT for DB.** | But round-1 missed that the aggregate uses a totally different chain (`planned/released_to_production/...`) and there is a THIRD chain in `PP_TRANSITIONS`. See Section 4. |
| "production_qc_checks at pp-production.ts:786" | **OFF.** | Actual line is `pp-production.ts:792`. Table exists, structure is plausible. |

**New findings not in round 1 (this pass):**

1. **`DrizzlePpProductionOrdersRepository.create()` writes `status: 'planned'` into a column whose CHECK forbids `'planned'`.** Will throw on every insert. The repo also fails to set `plannedQuantity` (notNull). The service is wired in `pp.module.ts` but never called by any controller — it is dead code that would be a P0 if it were on a path.
2. **`execSavePo` (the actually-used save path) hard-codes `plannedQuantity: 1`**, losing the real planned quantity from `CreateProductionOrderCommand`.
3. **Three incompatible production-order state machines** coexist (DB CHECK ≠ `PoStatus` enum ≠ `PP_TRANSITIONS`). See Section 4.
4. **`/api/erp/bom-headers/:id/explosion` is a NAIVE single-level JOIN** — it joins `bom_items.material_id` (not `component_id`) to `material_cards`. The real, multi-level Kahn explosion in `BomExplosionService.explodeFromDb()` is wired into MRP but **not exposed via any HTTP route**. The frontend `BOMManagement.tsx` therefore renders a one-level pseudo-explosion.
5. **No `qc_inspections` table in `lib/db/src/schema/qc-schema.ts`** — the persisted `qc_inspections` table lives in `apps/api/src/shared/db/schema-wms.ts:156–179` with UUID PK, while `pp-production.ts:792` defines a separate `production_qc_checks` table with `serial` PK. Two unrelated QC stores.
6. **`routings.workCenters` (jsonb) duplicates `routing_operations.workCenterId`** — denormalized JSON copy of operation-level work-center assignments.
7. **LMS-cert gate on MES `startSession` reads `session.getCertificationRequired()`** without first loading the work-center's `certificationLmsCourseId`. The certification-required flag must be pre-set on session creation; not verified from work-center.

---

## 1. Module structure (mes / pp / qc)

### `apps/api/src/modules/pp/` (Production Planning)

Layout (DDD-ish slice):
```
pp/
  pp.module.ts                              # NestJS module wiring
  application/
    commands/
      create-production-order.handler.ts    # CreateProductionOrderCommand
      release-production-order.handler.ts   # ReleaseProductionOrderCommand
      approve-bom.handler.ts
      approve-routing.handler.ts
      create-work-center.command.ts
      update-work-center.command.ts
      run-mrp.handler.ts                    # MRP — real, 269 lines
      run-mrp-lot-sizing.ts                 # Wagner-Whitin, POQ helpers
    queries/                                # GetBoms, GetRoutings, GetMrpReport,
                                            # GetProductionOrders[ById], ProductionPlan,
                                            # MachineLoad, MpsAtp, GetWorkCenters[Stats]
    services/
      pp-mps.service.ts                     # Master Production Schedule
      pp-crp.service.ts                     # Capacity Requirements Planning
      pp-intelligence.service.ts            # KPI/insights
    pp-planning.service.ts                  # schedule entry CRUD
    pp-equipment.service.ts
  domain/
    aggregates/
      production-order.aggregate.ts         # ProductionOrder (5-status enum PoStatus)
      bom.aggregate.ts                      # Bom + BomItem
      routing.aggregate.ts
      work-center.aggregate.ts              # WorkCenter (NO assignOperator())
    services/
      bom-explosion.service.ts              # Kahn topo, multi-level — 232 lines
      costing.service.ts
      crp.service.ts
      learning-curve.service.ts
      scheduling.service.ts
      scheduling-johnson.service.ts         # 2-machine Johnson rule
      scheduling-network.service.ts         # CPM / critical-path
      scheduling-capacity.service.ts
    events/ pp-released.event.ts
    repositories/
      pp.repository.ts                      # PP_REPO token, IPpRepository
      i-pp-planning.repo.ts
      i-pp-equipment.repo.ts
  infrastructure/
    event-handlers/
      advance-approved.listener.ts          # Trigger 7
      mro-stop.listener.ts                  # Trigger 18
      design-approved-trigger5.listener.ts  # Trigger 5 (design side)
      lab-test-passed-trigger5.listener.ts  # Trigger 5 (lab side)
      design-lab-join.service.ts            # shared join service
      wms-goods-issued.listener.ts          # Trigger 9
    repositories/
      drizzle-pp.repo.ts                    # IPpRepository impl (uses execSavePo)
      drizzle-work-center.repo.ts
      pp-planning.repository.ts
      pp-equipment.repository.ts
  presentation/
    pp-orders.controller.ts                 # /pp/orders
    pp-bom.controller.ts                    # /pp/bom
    pp-routing.controller.ts                # /pp/routings
    pp-work-centers.controller.ts           # /pp/work-centers
    pp-planning.controller.ts               # /planning
    pp-equipment.controller.ts              # /pp/equipment
    pp-intelligence.controller.ts
  bom/                                      # newer flat-slice (parallel to /domain + /infra)
    bom.service.ts
    drizzle-pp-bom.repo.ts                  # used by BomService
    i-pp-bom.repo.ts
  routings/
    routings.service.ts
    drizzle-pp-routings.repo.ts
    i-pp-routings.repo.ts
  work-centers/
    work-centers.service.ts
    drizzle-pp-work-centers.repo.ts
    i-pp-work-centers.repo.ts
  production-orders/                        # DEAD CODE — provider wired, no controller calls it
    production-orders.service.ts
    drizzle-pp-production-orders.repo.ts    # WILL CRASH on insert (status='planned')
    i-pp-production-orders.repo.ts
  technology/                               # merged from old modules/technology/
    technology.controller.ts                # /technology
    technology.service.ts
    technology-schema.service.ts
    …
  production/                               # merged from old modules/production/
    production-shift-reports.controller.ts  # /production/shift-reports
    production-reports.controller.ts        # /production
    production.service.ts
```

The PP module has **two parallel implementations** of repositories: the older `/domain/repositories` + `/infrastructure/repositories` (used by CQRS command handlers), and a newer flat slice (`bom/`, `routings/`, `work-centers/`, `production-orders/`) created by direct `BomService`/`RoutingsService` injection. They do not share repository interfaces; both write to the same tables.

### `apps/api/src/modules/mes/`

```
mes.module.ts                                # MesModule
mes.gateway.ts                               # WebSocket gateway
application/
  mes-maintenance.service.ts
  mes-production-sessions.service.ts
  mes-shifts-stats.service.ts
  commands/start-session.handler.ts          # LMS cert gate
  commands/complete-session.handler.ts
  commands/record-downtime.handler.ts
  commands/end-downtime.command.ts
  commands/end-downtime.handler.ts
  queries/get-sessions.handler.ts
  queries/get-oee.handler.ts
  queries/get-downtime[ -summary ].handler.ts
domain/
  aggregates/production-session.aggregate.ts # certificationRequired flag
  aggregates/downtime-event.aggregate.ts
  events/mes-completed.event.ts
  events/mes-to-hr-360.event.ts
  repositories/mes.repository.ts             # MES_REPO + DOWNTIME_REPO
infrastructure/
  repositories/drizzle-mes.repo.ts           # uses raw `production_sessions` table
  repositories/drizzle-downtime.repo.ts
  repositories/mes-maintenance.repo.ts
  repositories/mes-production-sessions.repo.ts
  repositories/mes-shifts-stats.repo.ts
  event-handlers/lms-cert-expired-mes.listener.ts        # Trigger 17 (daily sweep)
  event-handlers/lms-cert-expired-live-mes.listener.ts   # Trigger 17 (realtime)
  event-handlers/lms-cert-expired-block.service.ts       # shared deactivate-skill
operations/operations.service.ts             # /mes/operations
work-orders/work-orders.service.ts           # WORK_ORDERS_REPO
presentation/
  mes-sessions.controller.ts                 # /mes/sessions
  mes-operations.controller.ts               # /mes/operations
  mes-maintenance.controller.ts              # /mes/maintenance
  mes-shifts-stats.controller.ts             # /mes/shifts-stats
  mes-production-sessions.controller.ts      # /mes/production-sessions
```

### `apps/api/src/modules/qc/`

```
qc.module.ts                                 # QcModule
application/
  commands/submit-inspection.handler.ts
  commands/report-defect.handler.ts
  commands/resolve-defect.handler.ts
  commands/create-reclamation.handler.ts
  queries/get-inspections.handler.ts
  queries/get-inspection-stats.handler.ts
  queries/get-defects.handler.ts
  queries/get-reclamations.handler.ts
  qc-new.service.ts
  qc-extended.service.ts
  qc-defects-extended.service.ts
  qc-parameters.service.ts
  repositories/qc.repository.ts              # QC_REPOSITORY_PROVIDER
domain/
  aggregates/inspection.aggregate.ts         # statuses pending/in_progress/passed/failed/rework
  aggregates/defect.aggregate.ts
  aggregates/reclamation.aggregate.ts
  enums/inspection-status.enum.ts
  events/ index.ts                           # QcPassedEvent, QcFailedEvent
  repositories/i-qc.repo.ts                  # QC_COMPUTE_REPO
  repositories/i-qc-extended.repo.ts
  repositories/i-qc-defects-extended.repo.ts
  services/
    defect-detector.service.ts
    spc.service.ts                           # Statistical Process Control
    dpmo.service.ts                          # Defects per million opps
    fmea.service.ts                          # Failure Mode & Effect Analysis
    delta-e.service.ts                       # CIELAB color difference
    ink-consumption.service.ts
    imposition.service.ts
    spoilage.service.ts
defects/
  defects.service.ts
  drizzle-defects.repo.ts                    # DEFECTS_REPO
  i-defects.repo.ts
infrastructure/
  event-handlers/mes-completed.listener.ts
  event-handlers/so-sample-requested.listener.ts
  repositories/drizzle-inspection.repo.ts    # writes to qc_inspections (UUID, schema-wms.ts)
  repositories/drizzle-defect.repo.ts
  repositories/drizzle-qc-reclamation.repo.ts
  repositories/drizzle-qc.repo.ts
  repositories/qc-new.repository.ts
  repositories/qc-parameters.repository.ts
  repositories/qc-extended*.repository.ts    # 5 files
presentation/
  qc-inspections.controller.ts               # /qc/inspections
  qc-defects.controller.ts                   # /qc/defects
  qc-reclamations.controller.ts              # /qc/reclamations
  qc-extended.controller.ts
  qc-defects-extended.controller.ts
  qc-new.controller.ts
  qc-parameters.controller.ts
  qc-dpmo.controller.ts
  print.controller.ts
```

---

## 2. BOM model & FK targets

### `bom_headers` — `lib/db/src/schema/pp/pp-production.ts:284–307`

```ts
export const bomHeaders = pgTable("bom_headers", {
  id: serial("id").primaryKey(),
  bomNumber: varchar("bom_number", { length: 50 }).notNull().unique(),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "restrict" }),
  version: varchar("version", { length: 20 }).notNull().default("1.0"),
  status: varchar("status", { length: 20 }).notNull().default("draft"),
  baseQuantity: numericMoney("base_quantity").notNull().default(1),
  baseUnit: varchar("base_unit", { length: 20 }).notNull().default("dona"),
  validFrom: varchar("valid_from", { length: 10 }),
  validTo: varchar("valid_to", { length: 10 }),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
  deletedBy: varchar("deleted_by"),
}, …);
```
CHECK: `status IN ('draft','active','inactive','archived')`.

### `bom_items` — `pp-production.ts:321–348`

```ts
export const bomItems = pgTable("bom_items", {
  id: serial("id").primaryKey(),
  bomId: varchar("bom_id").notNull().references(() => bomHeaders.id, { onDelete: "cascade" }),
  itemNumber: varchar("item_number", { length: 10 }).notNull(),
  componentType: varchar("component_type", { length: 20 }).notNull().default("material"),
  // FK type fix: should reference material_cards.id (integer), not products.id.
  // Cannot use .references() here without creating a circular import
  // (pp-production → mm-material-cards → pp-schema → pp-production).
  // DB-level FK is applied via migrations-drift.ts entry below.
  componentId: integer("component_id").notNull(),
  quantity: numericMoney("quantity").notNull(),
  unit: varchar("unit", { length: 20 }).notNull().default("dona"),
  scrapPercentage: numericMoney("scrap_percentage").notNull().default(0),
  position: integer("position").notNull().default(0),
  notes: text("notes"),
  materialId: integer("material_id"),                  // ADD-ONLY duplicate, no FK
  scrapPercent: numericMoney("scrap_percent"),         // ADD-ONLY duplicate, no FK
  …
}, …);
```

### DB-level FK (live DB) — `apps/api/src/shared/db/invariants/migrations-drift.ts:3288–3292`

```js
// TASK 4: bom_items.component_id — drop wrong FK (products), add correct FK (material_cards)
{ name: 'bom_items.component_id DROP old FK',
  sql: `ALTER TABLE IF EXISTS bom_items DROP CONSTRAINT IF EXISTS bom_items_component_id_fkey` },
{ name: 'bom_items.component_id TYPE integer',
  sql: `ALTER TABLE IF EXISTS bom_items ALTER COLUMN component_id TYPE INTEGER USING component_id::INTEGER` },
{ name: 'bom_items.component_id ADD FK material_cards',
  sql: `DO $$ BEGIN IF NOT EXISTS (…) THEN
        ALTER TABLE bom_items ADD CONSTRAINT bom_items_component_id_fkey
          FOREIGN KEY (component_id) REFERENCES material_cards(id);
        END IF; END $$` },
```

**So in the running DB, `bom_items.component_id → material_cards.id`.** Round-1 was incorrect to say it still points at `products`. However the Drizzle ORM type system is unaware of this FK, which means Drizzle relations and Drizzle-zod inserts give no compile-time safety.

### `bom_items.material_id` — separate ADD-ONLY column

`pp-production.ts:337`: `materialId: integer("material_id")` — no `.references()` in Drizzle, no FK in `migrations-drift.ts`. Yet the ERP frontend BOM page uses **this** column, not `component_id`, via:

```ts
// apps/api/src/modules/erp/erp.repository.ts:62
return exec(sql`SELECT bi.*, mc.name AS material_name, mc.unit,
                       (bi.quantity * ${quantity}) AS required_qty
                FROM bom_items bi
                LEFT JOIN material_cards mc ON mc.id = bi.material_id
                WHERE bi.bom_id = ${id} ORDER BY bi.id`);
```

So we have **two parallel material-link columns**: `component_id` (with DB FK) and `material_id` (no FK), and different code paths use different ones. This is the real BOM bug.

### Two BOM repository slices

- `apps/api/src/modules/pp/bom/drizzle-pp-bom.repo.ts` (used by `/pp/bom` controller, `BomService`) — does NOT join components. `findItemsByBomId` returns `bom_items.*` raw.
- `apps/api/src/modules/erp/erp.repository.ts` (used by `/api/erp/bom-items` and `/api/erp/bom-headers/:id/explosion`) — joins on the **ADD-ONLY** `material_id`.
- `apps/api/src/modules/pp/domain/services/bom-explosion.service.ts` — full Kahn explosion, but `findActiveBomComponents()` in the repo is what decides which column it reads.

Let me trace the explosion repo call:

`apps/api/src/modules/pp/infrastructure/repositories/drizzle-pp.repo.ts` declares `findActiveBomComponents()` (implementation not quoted above — would need verification of which column is read). The handler `RunMrpHandler` (line 75) injects `BomExplosionService`, which calls `repo.findActiveBomComponents()`.

---

## 3. MRP service

**Round 1 said this was unconfirmed. It is real, in two files (~500 LOC).**

### `apps/api/src/modules/pp/application/commands/run-mrp.handler.ts` (269 lines)

Public input shape (lines 41–67):
```ts
export interface MpsRow      { productId: string; periodIndex: number; quantity: number; }
export interface MaterialPolicy {
  materialId: string;
  lotSizingMethod: LotSizingMethod;          // 'L4L' | 'EOQ' | 'POQ' | 'WAGNER_WHITIN'
  eoq?: number; poqPeriods?: number;
  leadTimeDays: number; safetyStock?: number;
}
export interface PlannedOrder {
  materialId: string; qty: number;
  periodIndex: number; releaseByPeriod: number;
}
```

Algorithm (paraphrased from lines 94–267):
1. For each MPS row, call `bomService.explodeInMemory(productId, qty, bomEdges)` → flat material requirements map.
2. Bucket gross requirements per material per period.
3. For each material, apply lot-sizing:
   - **Wagner-Whitin** (lines 156–178): computes period-by-period NR with running on-hand, then calls `wagnerWhitin(nrByPeriod)` (DP, O(n²)) for optimal lot sizes.
   - **POQ** (Period Order Quantity, lines 179–232): aggregates `poqPeriods` demand into a single lot, accounting for future scheduled receipts.
   - **L4L / EOQ** (lines 233–262): period-by-period; `qty = max(NR, EOQ)` or `qty = NR`.
4. For each lot, compute `releaseByPeriod = max(0, t - leadTimePeriodOffset)`.

Result shape:
```ts
export interface MrpRunResult {
  plannedOrders: PlannedOrder[];
  netRequirements: { materialId: string; period: number; gr: number; sr: number; nr: number }[];
  runAt: Date;
}
```

`@Calculation('pp.mrp.run')` decorator is applied (line 94) so the run gets instrumented.

### `apps/api/src/modules/pp/domain/services/bom-explosion.service.ts` (232 lines)

`explodeInMemory(productId, qty, components)` (lines 93–210):
1. Builds full adjacency `Map<parentId, {childId, qty}[]>`.
2. BFS from `productId` to compute reachable subgraph.
3. Restricts adjacency & in-degree to reachable nodes.
4. Kahn topological order; cycle detection scoped to the reachable subgraph (CONFLICT error on cycle).
5. Reverse-traversal memoization — each node's memo = `{self → 1, …summed children}`.
6. Returns child requirements multiplied by `qty`, root excluded.

Complexity: O(V+E). Comments document a diamond-dependency test case (A→B→D, A→C→D).

`explodeFromDb(productId, qty)` (lines 217–231) calls `repo.findActiveBomComponents()` to load `BomEdge[]` then delegates to `explodeInMemory`.

### HTTP exposure — limited

- **MRP is NOT exposed via HTTP** in `pp-planning.controller.ts` (the controller only has `/planning/schedule` GET/POST and `/planning/operations/:id` PATCH, lines 44–76).
- There is no `/api/pp/mrp/run` or `/api/pp/mrp/explode` route.
- The frontend `AIProductionPlanning.tsx` calls `/api/ai-planning/...` (in `modules/ai/`), which is **not** this MRP. It is a separate AI-planning module.
- The handler `RunMrpHandler` is registered as a provider (`pp.module.ts:147`) but no controller emits a `RunMrpCommand`. The CommandBus has no entry point.

**Conclusion:** the MRP code is real, well-engineered, and dead behind the wall. It is reachable only via direct injection — currently no caller does so.

### `GetMrpReportHandler` — read-only query

Registered at `pp.module.ts:95`, query at `application/queries/get-mrp-report.handler.ts`. Returns historical `mrp_results` rows (presumably), but no route was found for it either. Search hits zero controller wiring beyond the handler itself.

---

## 4. Production orders

### Schema — `production_orders` (`pp-production.ts:444–491`)

```ts
export const productionOrders = pgTable("production_orders", {
  id: serial("id").primaryKey(),
  orderNumber: varchar("order_number", { length: 50 }).notNull().unique(),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "restrict" }),
  bomId: varchar("bom_id").references(() => bomHeaders.id, { onDelete: "set null" }),           // optional
  routingId: varchar("routing_id").references(() => routings.id, { onDelete: "set null" }),     // optional
  salesOrderId: varchar("sales_order_id").references(() => salesOrders.id, { onDelete: "set null" }),
  plannedQuantity: numericMoney("planned_quantity").notNull(),
  confirmedQuantity: numericMoney("confirmed_quantity").notNull().default(0),
  scrapQuantity: numericMoney("scrap_quantity").notNull().default(0),
  orderType: varchar("order_type", { length: 20 }).notNull().default("standard"),
  status: varchar("status", { length: 20 }).notNull().default("created"),
  plannedStartDate: varchar("planned_start_date", { length: 10 }),  // YYYY-MM-DD
  plannedEndDate: varchar("planned_end_date", { length: 10 }),
  actualStartDate: varchar("actual_start_date", { length: 10 }),
  actualEndDate: varchar("actual_end_date", { length: 10 }),
  priority: integer("priority").notNull().default(3),
  workCenterId: varchar("work_center_id").references(() => workCenters.id, { onDelete: "set null" }),
  productionType: varchar("production_type", { length: 30 }).default("other"),
  defectiveQty: numericMoney("defective_qty").notNull().default(0),
  plannedCost: numericMoney("planned_cost"),
  actualCost: numericMoney("actual_cost"),
  responsibleManagerId: varchar("responsible_manager_id", { length: 50 }),
  shiftSupervisorId: varchar("shift_supervisor_id", { length: 50 }),
  qcInspectorId: varchar("qc_inspector_id", { length: 50 }),
  notes: text("notes"),
  // ── ADD-ONLY: live DB superset columns ──
  scheduledStart: timestamp("scheduled_start"),
  scheduledEnd: timestamp("scheduled_end"),
  actualStart: timestamp("actual_start"),
  actualEnd: timestamp("actual_end"),
  productName: text("product_name"),
  quantity: numericMoney("quantity"),
  unit: varchar("unit", { length: 20 }),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
}, (t) => [
  …,
  check("production_orders_order_type_chk",
        sql`${t.orderType} IN ('standard','rework','sample')`),
  check("production_orders_status_chk",
        sql`${t.status} IN ('created','released','in_progress','completed','closed','qc_hold')`),
]);
```

### State machine — THREE conflicting definitions

| Source | Statuses |
|---|---|
| **DB CHECK** (`pp-production.ts:490`) | `created` → `released` → `in_progress` → `completed` → `closed` (+ `qc_hold` branch) |
| **Aggregate** `PoStatus` (`production-order.aggregate.ts:11–17`) | `planned`, `released_to_production`, `in_progress`, `completed`, `cancelled` |
| **`PP_TRANSITIONS`** (`status-machines.constants.ts:91–99`) | `not_started` → `planning_in_progress` → `plan_approved` → `released_to_production` → `in_production` → `production_completed`, plus `rejected` |

The aggregate's `release()` (line 90) sets `this._status = PoStatus.RELEASED_TO_PRODUCTION` (`'released_to_production'`), then persists via `savePo`. The DB CHECK rejects this string.

### Save path is broken in TWO ways

1. **`apps/api/src/common/database/queries-pp.ts:12–27`** (`execSavePo`, the one CQRS actually uses):
   ```ts
   await db.insert(production_orders_int).values({
     status,                            // ← 'planned' or 'released_to_production' (aggregate)
     bomId, routingId,
     plannedStartDate: plannedStart != null ? String(plannedStart) : undefined,
     plannedEndDate: plannedEnd != null ? String(plannedEnd) : undefined,
     orderNumber: `PO-${Date.now()}`,
     plannedQuantity: 1,                // ← hard-coded; loses real qty
     createdBy: createdBy != null ? Number(createdBy) : undefined,
   } …);
   ```
   The aggregate's status strings (`'planned'`, `'released_to_production'`) are NOT in the CHECK whitelist. Every insert will throw `production_orders_status_chk` violation.

2. **`apps/api/src/modules/pp/production-orders/drizzle-pp-production-orders.repo.ts:42–57`** (`DrizzlePpProductionOrdersRepository.create`):
   ```ts
   const row = {
     orderNumber: dto.orderNumber as string | undefined,
     productId: dto.productId as string | undefined,
     quantity: (dto.quantity as string | undefined) ?? '1',     // ADD-ONLY column
     unit: dto.unit as string | undefined,                       // ADD-ONLY column
     status: 'planned',                                          // CHECK violation
     plannedStart: dto.plannedStart as Date | undefined,         // ADD-ONLY timestamp col
     plannedEnd: dto.plannedEnd as Date | undefined,
     createdBy: createdBy ? String(createdBy) : (dto.createdBy as string | undefined),
   };
   ```
   Same `'planned'` issue. Also fails to set `plannedQuantity` (NOT NULL) and `productId` is typed as `string | undefined` but the column is `integer NOT NULL`. This service is wired in `pp.module.ts:126` but no controller calls it — dead path. Still, it would crash if invoked.

### Order-creation control flow (the live one)

```
PpOrdersController.create
  → CreateProductionOrderCommand(soId, bomId, routingId, plannedStart, plannedEnd, checkpointValidated)
  → CreateProductionOrderHandler.execute
    1. Guard: !checkpointValidated → Err('Uch checkpoint o\'tilishi kerak')
    2. ppRepo.getBom(bomId) → bomResult
    3. new ProductionOrder(0, soId, bomId, routingId, plannedStart, plannedEnd)
         → po._status = PoStatus.PLANNED = 'planned'
    4. po.setCheckpointValidated(true)
    5. For each BOM item: po.addMaterialRequirement(new MaterialRequirement(item.materialId, item.getNetQuantity()))
    6. ppRepo.savePo(po)
       → execSavePo(soId, 'planned', bomId, routingId, plannedStart, plannedEnd)
       → INSERT INTO production_orders (status='planned', plannedQuantity=1, …)
       → ❌ CHECK constraint violation

PpOrdersController.release
  → ReleaseProductionOrderCommand(poId)
  → ReleaseProductionOrderHandler.execute
    1. ppRepo.getPo(poId) → ProductionOrder
    2. po.release()
       → status = 'released_to_production'
       → addDomainEvent({ type: 'PP_RELEASED_TO_PRODUCTION', data: { poId } })
    3. ppRepo.savePo(po) → INSERT (always inserts; no UPDATE branch in execSavePo)
    4. eventBus.publish(new PpReleasedEvent(poId, po.getMaterialList()))
```

The save path `savePo` is INSERT-only (no `onConflict`), so a `release()` will create a second row, not update the first. The aggregate has no `update()`.

### Other tables

#### `production_order_operations` (`pp-production.ts:508–525`)
```ts
{
  id: serial,
  productionOrderId: varchar references productionOrders.id (cascade),
  routingOperationId: varchar references routingOperations.id (set null),
  operationNumber: varchar(10) notNull,
  workCenterId: varchar references workCenters.id (set null),
  plannedDuration: numericMoney(0),
  actualDuration: numericMoney(0),
  status: varchar(20) default('pending'),
  startedAt: timestamp,
  completedAt: timestamp,
  operatorId: integer,                  // NO FK to users
}
CHECK: status IN ('pending','in_progress','completed')
```

Note the FK column types are `varchar` even though `productionOrders.id` and `routingOperations.id` are `serial` (integer). This is the same pattern as round-1 found in other modules — Drizzle FK uses `varchar` for an `integer` PK. The migration drift likely fixes this in DB too, but I did not find a specific entry for `production_order_operations`.

#### `production_order_components` (`pp-production.ts:539–553`)
```ts
{
  id: serial,
  productionOrderId: varchar references productionOrders.id (cascade),
  rawMaterialId: integer notNull,                   // DB FK → material_cards (drift line 3297)
  requiredQuantity: numericMoney notNull,
  issuedQuantity: numericMoney(0),
  unit: varchar(20) notNull,
  warehouseId: varchar references warehouses.id (set null),
}
```

Comment at line 542: "FK type fix: was varchar referencing raw_materials; changed to integer to reference material_cards.id. DB-level FK applied via migrations-drift.ts." So **round-1 was wrong** — this points at `material_cards`, not `raw_materials`.

#### `production_status_history` (`pp-production.ts:820–832`) — audit trail
Captures `oldStatus → newStatus` transitions with `changedBy` (integer, no FK to users) and `changedAt`.

#### `production_qc_checks` (`pp-production.ts:792–808`)
```ts
{
  id: serial,
  productionOrderId: varchar references productionOrders.id (cascade),
  checkStage: varchar(20) notNull,                 // e.g. 'incoming' / 'in_process' / 'final'
  checkedQty: integer(0),
  passedQty: integer(0),
  failedQty: integer(0),
  defectTypes: jsonb default([]),
  checkedBy: integer (no FK),
  checkedAt: timestamp defaultNow,
  notes: text,
  createdAt: timestamp,
}
```

#### `papka_orders` (`pp-papka.ts:16–54`) — paper-folder master order (the original ERP unit-of-work)
- `id`: varchar uuid PK (NOT integer like other PKs).
- `salesOrderId`: varchar(36) → sales_orders.id.
- `bomId`/`productId`/`routingId`: varchar references to bomHeaders/products/routings.
- Status CHECK has 11 statuses: `draft, pending_design, pending_tech, pending_qc, approved, ready_for_planning, planned, production, qc_final, completed, cancelled` — yet another state machine, distinct from all three above.
- Dates are all `varchar(10)`.

#### `mes_papka_orders` (`mes-schema.ts:54–77`) — MES copy
```ts
{
  id: serial,                              // ← integer, conflicts with papka_orders.id (varchar uuid)
  salesOrderId: varchar(100),              // ← no FK, plain string
  orderNumber: varchar(100),
  customerName, productName: text,
  quantity, completedQty: integer,
  status: varchar(30) default 'PENDING',
  priority: varchar(20),
  plannedDate, completedAt: timestamp(tz),
  assignedTo, workCenterId: integer (no FK),
  …
}
CHECK: status IN ('PENDING','IN_PROGRESS','COMPLETED','CANCELLED','ON_HOLD')
```

So `papka_orders` (varchar PK, 11 lowercase statuses) and `mes_papka_orders` (serial PK, 5 SHOUTING_SNAKE statuses) are two different tables for what conceptually should be the same thing. They are **not linked** by any FK — only by `salesOrderId` as a soft join key.

---

## 5. Work centers & routings

### `work_centers` (`pp-production.ts:48–84`)
```ts
{
  id: serial,
  code: varchar(50) unique notNull,
  name: text notNull, nameRu: text,
  type: varchar(20) notNull,                                          // CHECK: line/machine/workshop
  capacity: integer,
  departmentId: integer → departments.id (set null),
  isActive: boolean default true,
  certificationLmsCourseId: integer,                                  // LMS hard-block, line 63
  requiredSkillName: varchar(100),
  // ADD-ONLY:
  nameUz: text, hoursPerDay, costPerHour, capacityPerHour: numericMoney,
  department: varchar(100), orgDepartmentId: integer,
  createdAt, updatedAt: timestamp, deletedAt: timestamp,
}
CHECK: type IN ('line','machine','workshop')
```

`WorkCenterType` enum in aggregate (`work-center.aggregate.ts:16–21`) has **4 values** including `MANUAL = 'manual'` — but the DB CHECK rejects `'manual'`. Another schema/aggregate drift.

### `work_center_capacity` (`pp-production.ts:567–586`)
Effective-dated capacity windows with `numberOfMachines`, `utilizationPercentage`, `shiftsPerDay`, `hoursPerShift`, `workingDaysPerWeek`, derived `totalCapacityHours`/`availableCapacityHours`. Validity by `validFrom/validTo` (varchar YYYY-MM-DD).

### `shift_calendars` (`pp-production.ts:602–622`)
Daily calendar rows (year/month/day/dayOfWeek) per work-center with shift number, start/end time (HH:mm), break minutes, net working hours.

### `routings` (`pp-production.ts:363–387`)
```ts
{
  id: serial,
  routingNumber: varchar(50) unique notNull,
  productId: integer notNull → products.id (restrict),
  version: integer default 1,
  status: varchar(20) default 'draft',                                // CHECK draft/active/inactive
  validFrom, validTo: varchar(10),
  description: text,
  // ADD-ONLY:
  name: text, isActive: boolean,
  steps: jsonb, workCenters: jsonb,                                   // ← denormalized JSON copies
  createdBy: integer → users.id,
  createdAt, updatedAt, deletedAt: timestamp,
}
```

The `workCenters` jsonb column overlaps with the proper `routingOperations.workCenterId` FK. Same for `steps` overlapping with `routingOperations.operationDescription`.

### `routing_operations` (`pp-production.ts:400–426`)
```ts
{
  id: serial,
  routingId: integer notNull → routings.id (cascade),
  operationNumber: integer notNull,
  operationDescription: text,
  workCenterId: integer notNull → workCenters.id (restrict),
  setupTime, machineTime, laborTime: numericMoney(0),
  baseQuantity: numericMoney(1),
  sequence: integer notNull,
  isParallel: boolean default false,
  notes: text,
  // ADD-ONLY:
  name: text, productId: integer,
  setupTimeMin, runTimePerUnitMin, runTimeMin: numericMoney,
  isActive: boolean, createdAt: timestamp, deletedAt: timestamp,
}
```

### LMS-cert HARD BLOCK — partly implemented

`work-centers.certificationLmsCourseId` is the schema-side gate (`pp-production.ts:57–62` comment: "§8 LMS→MES HARD BLOCK: Ushbu ish markazida ishlash uchun talab qilinadigan LMS kurs ID si. NULL = sertifikat talab yo'q. Agar belgilansa: operator bu kursni tugatgan bo'lishi SHART, aks holda assignOperator() BLOCKED").

But the `WorkCenter` aggregate (`work-center.aggregate.ts`) has NO `assignOperator()` method — only `setCapacity()` and `markOutOfService()`. The gate is checked from **MES, not PP**:

`apps/api/src/modules/mes/application/commands/start-session.handler.ts:40–60`
```ts
// §8.3 LMS SERTIFIKAT TEKSHIRUVI — HARD BLOCK
if (session.getCertificationRequired()) {
  const certResult = await this.mesRepo.checkOperatorCertification(
    command.operatorId, command.courseId,
  );
  const certData = certResult.ok ? certResult.data as { valid?: boolean; … } : null;
  if (!certResult.ok || !certData?.valid) {
    const errorMsg = `LMS sertifikati kerak: …`;
    return Err(AppErr('FORBIDDEN', errorMsg));
  }
}
```

The `command.courseId` defaults to `0` (line 17) — the controller caller must pass it. The session's `certificationRequired` flag is pre-stored on the row. There is no path that loads `workCenters.certificationLmsCourseId` and sets the flag/courseId from it; the caller must hand them in. So the LMS gate is **operationally functional only if the caller correctly populates both fields** — easy to bypass by sending `courseId = 0` or `certificationRequired = false`.

The reverse direction (cert expiry → block) IS implemented properly in `lms-cert-expired-block.service.ts:48–71`: flips `employee_skills.is_active = false` for the affected employee/course.

---

## 6. Date type consistency

Confirming round-1's "dual date types" finding and adding new cases.

### `production_orders` — 4 dates, two types each

| Logical date | varchar YYYY-MM-DD | timestamp (ADD-ONLY) |
|---|---|---|
| planned start | `plannedStartDate` (456) | `scheduledStart` (471) |
| planned end | `plannedEndDate` (457) | `scheduledEnd` (472) |
| actual start | `actualStartDate` (458) | `actualStart` (473) |
| actual end | `actualEndDate` (459) | `actualEnd` (474) |

The Drizzle types let you write to either group. `execSavePo` writes to **varchar** (`plannedStartDate`/`plannedEndDate`) by stringifying a `Date`. `DrizzlePpProductionOrdersRepository.create` writes to **timestamp** (`plannedStart`/`plannedEnd`). Mixed writers → queries on one column see only half the data.

### `production_order_operations` — different pattern

`startedAt` / `completedAt` are timestamps. No varchar duplicates.

### Cross-table comparison

| Table | Date columns | Type |
|---|---|---|
| `production_orders` | planned/actual start/end | varchar(10) AND timestamp (dual) |
| `production_order_operations` | startedAt, completedAt | timestamp |
| `production_status_history` | changedAt | timestamp |
| `production_qc_checks` | checkedAt, createdAt | timestamp |
| `papka_orders` | sana, planSanaIch, tayyorBolishSanasi | varchar(10) |
| `mes_papka_orders` | plannedDate, completedAt | timestamp(tz) |
| `mes_production_sessions` | sessionDate, startTime, endTime | timestamp |
| `mes_shift_stats` | shiftDate | timestamp |
| `bom_headers` | validFrom, validTo | varchar(10) |
| `routings` | validFrom, validTo | varchar(10) |
| `shift_calendars` | startTime, endTime | varchar(5) HH:mm |
| `mrp_runs` | runDate | varchar(10); `startTime`/`endTime` are timestamps |
| `mrp_results` | requiredDate, orderDate | varchar(10) |
| `production_facts_sm72` | factDate | varchar(10) |
| `production_fact` | factDate, startTime, endTime | varchar(10) + varchar(5) |
| `downtime_logs` | downtimeDate, startTime, endTime | varchar(10) + varchar(5) |
| `qc_material_tests` | testDate | varchar(10) |
| `qc_final_inspections` | inspectedAt | timestamp |
| `qc_reclamations` | claimDate, reportedDate, reportedAt | varchar AND timestamp (dual) |
| `qc_braks` | brakDate | varchar(10) |

**Conclusions:**
- The `production_orders` "dual date" pattern is the worst — same logical date in two columns, two types, two writers.
- The schema-wide convention is inconsistent: `papka_orders` and `production_facts_sm72` use varchar(10), `mes_*` and `qc_inspections` use timestamps.
- `qc_reclamations` also has dual `claimDate (varchar) + reportedAt (timestamp)`.
- Time columns are uniformly `varchar(5)` HH:mm where they exist standalone, never `time`.

---

## 7. QC integration

### Two QC inspection tables (schema fragmentation)

1. **`qc_inspections` — `apps/api/src/shared/db/schema-wms.ts:156–179`** (UUID PK, lives in WMS schema)
   ```ts
   {
     id: uuid (primaryKey, createId()),
     reference_id: uuid notNull,
     reference_type: text notNull,                      // 'batch' | 'order'
     inspector_id: uuid notNull → users.id (restrict),
     status: qcStatusEnum default 'pending',            // pending/in_progress/on_hold/passed/failed
     items_checked, items_passed, items_failed: integer notNull,
     notes: text, attachments: text default '[]',
     created_at, updated_at: timestamp(tz),
   }
   ```
   Written by `DrizzleQcInspectionRepository.save()` from the `Inspection` aggregate. UUID IDs and snake_case columns — completely different convention from the rest of the schema.

2. **`production_qc_checks` — `lib/db/src/schema/pp/pp-production.ts:792–808`** (serial PK, lives in PP schema)
   - Aggregated check counts per production order per stage.
   - `productionOrderId` FK directly to `productionOrders.id`.

These tables have **no relationship**. `qc_inspections.reference_id` is UUID and `production_orders.id` is `serial`; they cannot be joined.

### Other QC tables (`qc-schema.ts`)

- `qc_standards` (line 22) — standards catalog (iso/gost/uzst/internal).
- `qc_parameter_definitions` (44) — measurable parameters.
- `qc_material_tests` (71–102) — incoming material QC; FK `materialCardId → material_cards.id`, `orderId → papka_orders.id`.
- `qc_final_inspections` (153–176) — final per `papkaOrderId`, sample size + defect rate, result enum (5 statuses including `conditional_pass`, `rework_required`).
- `qc_reclamations` (205–242) — customer complaints, `papka_order_id`, status `new/investigating/resolved/rejected`. Has many ADD-ONLY duplicates (`customerId`, `customerName`, `orderId`, `productionOrderId`, `type`, `severity`, `assignedTo`, `reportedAt`, `reportedDate`, `slaDueAt`, `costImpact`, `isResolved`).
- `qc_braks` (257–) — defect (brak) records per `papkaOrderId`, stage in `incoming/production/final/warehouse`.
- `qc_supplier_quality` (293) — vendor scorecards.
- `inline_qc_checks` (319) — real-time line checks.
- `qc_root_causes` (333) — 5-why / fishbone root-cause logs.

### Inspection aggregate state machine

`apps/api/src/modules/qc/domain/aggregates/inspection.aggregate.ts`:
```
pending → in_progress (start)
in_progress → passed (pass)  → emits QcPassedEvent
              failed (fail)  → emits QcFailedEvent
              rework (rework)
```
On `pass()`/`fail()` the aggregate stamps a domain event. The QC module declares a `MesCompletedListener` (`mes-completed.listener.ts`) which presumably triggers inspection creation when MES completes a session.

### `production_orders.status = 'qc_hold'`

The status CHECK includes `qc_hold`. No code path explicitly sets it — search for `'qc_hold'` returns only the CHECK constraint itself. The QC failure handler does not propagate to production order status; the wiring is only inferred.

### Defect & reclamation flow

```
QcDefectsController POST /qc/defects
  → ReportDefectCommand (qc/application/commands/report-defect.handler.ts)
  → DEFECTS_REPO.save(new Defect(...))
QcReclamationsController POST /qc/reclamations
  → CreateReclamationCommand
  → DrizzleQcReclamationRepo.create
```

---

## 8. Frontend integration

### Production pages (47 .tsx files under `artifacts/erp-dashboard/src/pages/`)

| Page | Backend route(s) used |
|---|---|
| `ERPProduction.tsx` | (parent dashboard) |
| `ProductionOrder360.tsx` + 6 tab files (Bom/Cost/Equipment/Quality/Shifts/Sections) | `/api/erp/production-orders/:id`, `/api/erp/bom-headers/:bomId`, `/api/erp/equipment` |
| `ProductionOrder360Dialogs.tsx` | release / status PATCH actions |
| `BOMManagement.tsx` | `POST /api/erp/bom-headers`, `POST /api/erp/bom-items`, `DELETE`, `GET /api/erp/bom-headers/:id/explosion?quantity=1` |
| `AIProductionPlanning.tsx` + Chart/Detail/Dialogs/Sections | `/api/ai-planning/plans`, `/api/ai-planning/generate`, `/api/ai-planning/plans/:id/approve|reject|execute|reschedule|block-material`, `/api/ai-planning/decisions/:id/accept`, `/api/ai-planning/config` |
| `MESDashboard.tsx`, `MESHomeDashboard.tsx` | `/api/mes/sessions`, `/api/mes/operations` |
| `MESDowntimes.tsx` | `/api/mes/operations/downtime` |
| `MESExtended*.tsx` (5 files) | `/api/mes/shifts-stats`, `/api/mes/maintenance` |
| `MESProducts.tsx` | `/api/mes/papka-orders` (uses `mes_papka_orders`) |
| `MESWorkCenters.tsx` + sections/dialogs | `/api/erp/work-centers` and `/api/pp/work-centers` |
| `MESWorkerAssignments.tsx` | `/api/mes/sessions` |
| `ProductionFactsPage.tsx` | `/api/production/...` |
| `CapacityPlanning.tsx` + 4 sub-files | `/api/pp/...`, `/api/erp/work-centers/capacity` |

### Backend routes the frontend hits vs. PP module exposure

| Frontend uses | PP module has |
|---|---|
| `GET /api/erp/bom-headers/:id/explosion` | Yes — `erp-products.controller.ts:135` (NAIVE 1-level join) |
| `POST /api/erp/bom-headers`, `POST /api/erp/bom-items` | Yes — `erp-products.controller.ts` |
| `GET /api/pp/bom` | Yes — `pp-bom.controller.ts:52` (lists, but no explosion) |
| `POST /api/pp/orders` | Yes — `pp-orders.controller.ts:93` (CQRS → would fail on insert) |
| `PATCH /api/pp/orders/:id/release` | Yes — `pp-orders.controller.ts:115` |
| `POST /api/ai-planning/generate` etc. | Yes — `modules/ai/presentation/ai-planning.controller.ts` (separate from MRP) |
| `POST /api/pp/mrp/run` | **NO ROUTE** — `RunMrpHandler` has no caller |
| `GET /api/pp/mrp/report` | **NO ROUTE** — `GetMrpReportHandler` has no caller |

So the **MRP engine has zero frontend reach**. The "AI planning" page uses an entirely separate `modules/ai/` codebase.

### BOM explosion shown to user is wrong

`BOMManagement.tsx` line 80 calls `GET /api/erp/bom-headers/${bomId}/explosion?quantity=1`. Server impl (`erp.repository.ts:60–65`):
```ts
return exec(sql`SELECT bi.*, mc.name AS material_name, mc.unit,
                       (bi.quantity * ${quantity}) AS required_qty
                FROM bom_items bi
                LEFT JOIN material_cards mc ON mc.id = bi.material_id
                WHERE bi.bom_id = ${id} ORDER BY bi.id`);
```
It's a **single-level join**, not a recursive explosion. Sub-assemblies (`componentType = 'sub_assembly'`) are not exploded. The real Kahn-based `BomExplosionService.explodeFromDb()` is not invoked.

---

## 9. Findings summary

### P0 — Will fail at runtime / cripples a core flow

1. **`execSavePo` writes status `'planned'` / `'released_to_production'` into a CHECK-constrained column.**
   - Evidence: `apps/api/src/common/database/queries-pp.ts:18–27` writes `status` directly from `ProductionOrder.getStatus()` which returns `PoStatus` enum values (`'planned'`, `'released_to_production'`, `'in_progress'`, `'completed'`, `'cancelled'`).
   - CHECK: `pp-production.ts:490` allows only `('created','released','in_progress','completed','closed','qc_hold')`.
   - Impact: Every `POST /pp/orders` and every `PATCH /pp/orders/:id/release` throws a 500 `check_violation` on insert. Production-order creation is **broken end-to-end**.
   - Fix: align the aggregate enum with the DB CHECK (or vice versa) and translate at the repo boundary.

2. **`execSavePo` hard-codes `plannedQuantity: 1`.**
   - Evidence: `queries-pp.ts:25`.
   - Impact: Even if (1) is fixed, every production order shows planned qty = 1 regardless of what the user/caller passed. Costing, MRP, scheduling all wrong.

3. **`DrizzlePpProductionOrdersRepository.create()` does the same `'planned'` mistake AND sends `productId: string` to an `integer NOT NULL` column.**
   - Evidence: `apps/api/src/modules/pp/production-orders/drizzle-pp-production-orders.repo.ts:42–55`.
   - Impact: Currently dead code (no controller calls it), but if wired it crashes immediately.

4. **`/api/erp/bom-headers/:id/explosion` is a 1-level join, not an explosion.**
   - Evidence: `apps/api/src/modules/erp/erp.repository.ts:60–65`.
   - Impact: Sub-assemblies are silently dropped. BOM "required materials" shown to operator/planner is wrong for any multi-level BOM. Costing rolled up from this is wrong.

### P1 — Architectural drift, silently wrong results

5. **Three incompatible production-order state machines.**
   - DB CHECK (6 statuses) ≠ `PoStatus` enum (5 statuses, different names) ≠ `PP_TRANSITIONS` (7 statuses, different names again).
   - Evidence: `pp-production.ts:490`, `production-order.aggregate.ts:11–17`, `status-machines.constants.ts:91–99`.
   - Impact: State transitions verified by `isTransitionAllowed(PP_TRANSITIONS, ...)` (where it's used) reject valid DB transitions and accept some the DB rejects.

6. **Two BOM material-link columns coexist (`component_id` with DB FK to material_cards, `material_id` ADD-ONLY no FK).** Different code paths use different columns.
   - `pp/bom/drizzle-pp-bom.repo.ts` (writes/reads `component_id`, no join).
   - `erp/erp.repository.ts` (joins on `material_id`).
   - Impact: BOM items created via `/pp/bom` will not show up in `/api/erp/bom-headers/:id/explosion` (material_id NULL → LEFT JOIN returns NULL material_name).

7. **MRP engine (`RunMrpHandler` + `BomExplosionService`) has no HTTP route.**
   - 500 lines of correct code (Wagner-Whitin, POQ, EOQ, L4L; Kahn topo sort with cycle detection) — wired as a CQRS handler but **no controller emits the command**.
   - The "AI Production Planning" page does NOT call it; it calls a separate `modules/ai/` AI service.
   - Impact: Real MRP is dead inventory; users instead see "AI suggestions" with unknown algorithmic basis.

8. **`production_orders` has dual date columns.**
   - varchar `plannedStartDate/EndDate/actualStartDate/EndDate` and timestamp `scheduledStart/End/actualStart/End` for the same logical dates.
   - Different writers use different groups. Queries on one will miss half the data.

9. **`papka_orders` (uuid PK, 11 statuses) and `mes_papka_orders` (serial PK, 5 statuses) are not joined by FK.**
   - Only `salesOrderId` as a soft link.
   - Two parallel order representations with totally different status spaces.

10. **`WorkCenterType` aggregate enum has `'manual'` value, DB CHECK rejects it.**
    - Evidence: `work-center.aggregate.ts:16–21` vs `pp-production.ts:83`.
    - Impact: Creating a "manual" work center via the aggregate throws CHECK violation.

11. **LMS-cert gate at MES session start trusts caller-supplied `certificationRequired` and `courseId`.**
    - Evidence: `start-session.handler.ts:40–60` — never loads `workCenters.certificationLmsCourseId`. The gate is bypassable by setting `certificationRequired = false` on session creation or passing `courseId = 0`.

12. **`production_orders.bomId` and `routingId` are nullable.**
    - Evidence: `pp-production.ts:448–449`. Standard orders can be created without a BOM or routing → no material requirements → no operations → defeats the model.

### P2 — Schema hygiene / dead code

13. **`DrizzlePpProductionOrdersRepository` + `ProductionOrdersService` provider chain is dead code** (provider registered, never injected by a controller). Future maintainers will trip over the broken `create()` path.

14. **`routings.workCenters` (jsonb) and `routings.steps` (jsonb)** denormalize `routing_operations` rows. No code keeps them in sync. Potential consistency bug if either side is read independently.

15. **`production_order_operations.productionOrderId` and `routingOperationId` are `varchar` referencing `serial` (integer) PKs.** Type mismatch in Drizzle FK definition.

16. **No `qc_inspections` in `lib/db/src/schema/`.** Canonical table lives only in `apps/api/src/shared/db/schema-wms.ts`. Convention drift (UUID PK, snake_case columns) inside a single ERP.

17. **`qc_reclamations` has ~14 ADD-ONLY duplicate columns** (`customerId`/`customerName`, `orderId`, `productionOrderId`, `type`/`severity`, `assignedTo`, `reportedAt`/`reportedDate`, `slaDueAt`, `costImpact`, `isResolved`) — many of which duplicate or partially overlap the canonical fields above them.

18. **`bom_items.materialId` and `scrapPercent` are ADD-ONLY duplicates** of `componentId` and `scrapPercentage` (lines 337–338). No code keeps them aligned.

19. **`production_orders.scrapQuantity` and `defectiveQty`** both exist (lines 453, 463) — appears to be the same concept under two names.

20. **`production_order_operations.operatorId`** — `integer`, no FK to `users.id`. Round-1 incorrectly flagged this against `production_facts_sm72` (which DOES have the FK now); the orphan-record risk has moved here.

### Gaps left for future passes

- The exact body of `DrizzlePpRepository.findActiveBomComponents()` (called by `BomExplosionService.explodeFromDb()`) was not read — needs verification whether it reads `component_id` or `material_id`.
- The relationship between `pp.module.ts`'s two BOM repository slices (CQRS path via `DrizzlePpRepository.getBom` vs. flat-slice `DrizzlePpBomRepository`) is not tested — they may double-write or stop-writing depending on which controller is hit.
- The `/pp/orders/:id/release` event chain (`PpReleasedEvent` → WMS goods-issue → `wms-goods-issued.listener` → `sales_orders.master_status = 'in_production'`) appears wired but full end-to-end verification of state-machine alignment is out of scope.
- Whether `production_qc_checks` and `qc_inspections` are ever cross-referenced (UUID vs. serial PKs make this hard).
