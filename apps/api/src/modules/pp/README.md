# PP — Production Planning module (`apps/api/src/modules/pp/`)

> Materials Requirements Planning (MRP), Capacity Requirements Planning
> (CRP), routing, BOM management. Sits between Sales (which generates
> demand) and Production / MES (which executes the schedule).

## Subfolder map

```
pp/
├── application/
│   ├── commands/
│   │   └── run-mrp.handler.ts              The MRP runner (4 lot-sizing methods)
│   ├── services/
│   │   ├── pp-intelligence.service.ts      MRP orchestrator (run tracking, persistence)
│   │   └── pp-crp.service.ts               Capacity Requirements Planning
│   ├── queries/                            Read-side handlers
│   └── events/                             Domain events (MrpCompleted, etc.)
├── domain/
│   ├── services/
│   │   ├── bom-explosion.service.ts        Multi-level BOM → flat requirements
│   │   ├── learning-curve.service.ts       Productivity ramp for new products
│   │   └── rop-trigger.service.ts          Reorder-point trigger evaluator
│   └── repositories/                       Repo interfaces
├── bom/                                    BOM master data CRUD
├── production-orders/                      Production order creation + lifecycle
├── routings/                               Routing master (operations + work centers)
├── work-centers/                           Work center capacity definitions
├── infrastructure/                         Drizzle repository implementations
├── dto/                                    Zod schemas
├── presentation/                           NestJS controllers (thin transport)
└── pp.module.ts                            Wiring
```

## The MRP pipeline

```
Master Production Schedule (MPS)      ← demand: finished products per period
       +
BOM (parent → child + qty per unit)
       +
Material policies (lot size, lead time, safety stock)
       +
Opening on-hand + scheduled receipts
       │
       ▼
RunMrpHandler.runMrp()
       │  per material:
       │    1. Explode BOM (bom-explosion.service)
       │    2. Compute gross requirements per period
       │    3. Subtract on-hand + scheduled receipts → net requirements
       │    4. Lot-size: L4L / EOQ / POQ / Wagner-Whitin
       │    5. Offset by lead time → release period
       │
       ▼
PlannedOrder[] — what to procure / produce, when
```

Read the rationale for each step at the top of:
- `bom-explosion.service.ts` — Kahn topological sort, diamond dependencies
- `run-mrp.handler.ts` — Why 4 lot-sizing methods + when to choose each
- `pp-intelligence.service.ts` — Concurrency guard, run tracking, defaults

## Lot-sizing decision tree

| Material behaviour                           | Recommended method            |
|----------------------------------------------|-------------------------------|
| Cheap to order, expensive to hold (consumables) | L4L (lot-for-lot)          |
| Steady demand, commodity item                 | EOQ                           |
| Reduce order count, accept some over-stock    | POQ (period order quantity)   |
| Lumpy demand + significant setup cost         | Wagner-Whitin (optimal DP)    |

The planner sets the method per material. MRP reads it from
`material_policies.lot_sizing_method`.

## Capacity (CRP) — separate from MRP

MRP answers "what to make" — CRP answers "can we make it?" by loading the
planned operations against work-center capacity. `pp-crp.service.ts`
checks whether the resulting schedule fits and flags overloaded centers.

## Production order lifecycle

```
draft → released → in_production → completed
                                 ↘ cancelled
```

Transitions are managed by `production-orders/` controllers + service.
Status changes emit events that MES + Inventory listen to.

## Conventions

- Periods are 1-indexed `number` (period 1 = current planning month).
  Stored as bucket markers on `pp_mrp_planned_orders.period_index`.
- `production_orders.planned_quantity` is the target; `confirmed_quantity`
  accumulates from MES feedback. `actual_cost` is rolled up by Finance.
- BOM rows store `qty_per_unit` as `numeric` to allow non-integer ratios
  (0.5 sheets of cardboard per box, etc.).
- Routing operation time is `numeric` minutes; cumulative cycle time is
  computed by `pp-crp.service`.
- MRP run rows (`pp_mrp_runs`) use a partial unique index to prevent
  concurrent runs — see `pp-intelligence.service.ts` top-of-file.

## How a Sales Order pulls MRP

```
1. SD creates Sales Order
2. SO → schedule_items inserted (demand row per finished product)
3. Planner runs MRP (manually or scheduled)
4. MRP produces PlannedOrder rows per material
5. Purchasing converts PlannedOrders → real POs
6. Production triggers production_orders from PlannedOrders
7. MES executes; feedback closes the loop
```

## Where to read deeper

- MRP math + lot-sizing rationale → top of `application/commands/run-mrp.handler.ts`
- BOM explosion with diamond dependencies → top of `domain/services/bom-explosion.service.ts`
- Run-tracking + concurrency → top of `application/services/pp-intelligence.service.ts`
- CRP capacity model → `application/services/pp-crp.service.ts`
- Reorder-point logic → `domain/services/rop-trigger.service.ts`
