# WMS module (`apps/api/src/modules/wms/`)

> Full warehouse management for the production site. Material cards, stock,
> lots, expiries, movements, valuation, ABC analysis, EOQ replenishment,
> physical-count workflows. Talks to POS-on-floor terminals through `pos/`.

## Subfolder map

```
wms/
├── application/                     Service layer (per use-case)
│   ├── wms-catalog.service.ts           Dashboard analytics (ABC/aging/expiry)
│   ├── wms-eoq.service.ts               EOQ recalculation + HITL gate
│   ├── wms-counts.service.ts            Physical inventory counts
│   ├── wms-crud.service.ts              Material card CRUD
│   ├── wms-extended.service.ts          Extended attributes, valuation
│   ├── wms-analytics.service.ts         Cross-functional analytics
│   ├── wms-warehouse-gateway.service.ts Gateway to POS terminals
│   ├── inventory-materials.service.ts   Materials catalog + balances
│   ├── inventory-advanced.service.ts    Reservation, allocation
│   ├── iot-enhanced.service.ts          IoT-fed sensor telemetry
│   ├── warehouse-rental.service.ts      3rd-party warehouse rental tracking
│   ├── commands/                        CQRS command handlers
│   ├── queries/                         CQRS query handlers
│   └── events/                          Domain event listeners
├── domain/
│   ├── aggregates/                  DDD aggregates (Material, Lot, Movement)
│   ├── services/                    Pure domain logic
│   │   └── eoq-calculator.service.ts    Wilson EOQ + tier discounts
│   └── repositories/                Repository interfaces
├── infrastructure/                  Drizzle repository implementations
├── inventory/                       Inventory-specific endpoints
├── movements/                       Stock-movement workflow (kirim/chiqim)
├── analytics/                       Cross-time analytical queries
├── warehouses/                      Warehouse master + location tree
├── presentation/                    NestJS controllers (thin transport)
├── dto/                             Zod schemas for endpoints
└── wms.module.ts                    Wiring
```

## Key formulas & decisions

| Need to know...                                  | Read this                                              |
|--------------------------------------------------|--------------------------------------------------------|
| ABC Pareto class assignment (80/15/5)             | `application/wms-catalog.service.ts` → `getAbcAnalysis` |
| Wilson EOQ formula + price-tier discount choice   | `domain/services/eoq-calculator.service.ts`            |
| When EOQ recommendations require human approval   | `application/wms-eoq.service.ts` (HITL_PURCHASE_THRESHOLD) |
| Aging buckets (slow movers)                       | `application/wms-catalog.service.ts` → `getAging`      |
| Expiry watch (FEFO health)                        | `application/wms-catalog.service.ts` → `getExpiry`     |
| Physical-count reconciliation                     | `application/wms-counts.service.ts`                    |

## Inventory state model

```
material_cards                       master SKU
  ↳ warehouse_stock                  current on-hand per warehouse
  ↳ batch_lots                       lot/batch with mfg + expiry dates
  ↳ pos_movements                    every receipt + issue + transfer
  ↳ pos_movement_lines               line items per movement
  ↳ wm_reservations                  soft-allocated for open orders
  ↳ three_way_match_log              PO ↔ receipt ↔ invoice match audit
  ↳ standard_cost / abc_segment      derived nightly
```

## ABC analysis lifecycle

The cached `material_cards.abc_segment` column is updated by a nightly job.
But `wms-catalog.service.getAbcAnalysis()` recomputes live so the dashboard
shows current-quarter classes, not yesterday's snapshot. If you change the
80/15/5 thresholds:
1. Update the inline thresholds in `getAbcAnalysis`
2. Update the nightly job that writes `abc_segment`
3. Document the change in `business.constants` (currently they're inline
   for readability — see top of `wms-catalog.service.ts` for why).

## EOQ flow

```
Buyer triggers POST /api/wms/eoq/recalc-all
    ↓
WmsEoqService.enqueueRecalculation()
    ↓  (enqueues via BullMQ; falls back to async local on queue failure)
queue/processors/mrp-run.processor.ts
    ↓  for each active material:
EoqCalculatorService.calculate({ demand, ordering, holding })
    ↓
If PO value > HITL threshold (50M UZS):
    → mark as RECOMMENDATION, wait for buyer approval
Else:
    → write directly to material_cards.recommended_eoq
```

## 3-way match (PO ↔ Receipt ↔ Invoice)

Lives in `apps/api/src/modules/pos/repositories/three-way-match.repository.ts`
(POS module, because POS terminals trigger the match on receipt). Reads
`pos_movements`, joins with PO and invoice, posts variance to GL if any.

## Conventions

- Material balances stored as `numeric` to avoid float drift over millions
  of movements. Always parse with `safeNum(value, 0)`.
- Unit conversions (kg ↔ litre ↔ piece) live on `material_cards`. Never
  hardcode density.
- Lot expiry uses FEFO (First-Expire-First-Out) by default — `wms-counts`
  knows about FIFO override for specific materials.
- Movement types are a closed enum: `EXTERNAL_IN`, `EXTERNAL_OUT`,
  `INTERNAL_TRANSFER`, `INTERNAL_ISSUE`, `INTERNAL_RETURN`, `DAMAGE`,
  `INVENTORY_ADJ_PLUS`, `INVENTORY_ADJ_MINUS`. Adding one requires updates
  to POS i18n + dashboard filters.
- Every movement records `approved_by` + `approved_at` for audit.

## Where to read deeper

- ABC rationale and Pareto math → top of `application/wms-catalog.service.ts`
- EOQ + HITL threshold reasoning → top of `application/wms-eoq.service.ts`
- POS terminal protocol → `apps/api/src/modules/pos/README.md` (if present)
- Three-way match algorithm → `apps/api/src/modules/pos/repositories/three-way-match.repository.ts`
