# MES — Manufacturing Execution System (`apps/api/src/modules/mes/`)

> Real-time shop-floor execution. Bridges the gap between the *plan*
> (from PP) and the *physical machines* (IoT/cameras). Tracks downtimes,
> production sessions, defects, and feeds OEE back to the planner.

## Subfolder map

```
mes/
├── application/                Use-case services
├── domain/                     Aggregates + domain services
├── operations/                 Operation execution (start/pause/stop)
├── work-orders/                Shop-floor work-order lifecycle
├── constants/                  Status enums, downtime reason codes
├── dto/                        Zod schemas
├── infrastructure/             Drizzle repositories
├── presentation/               NestJS controllers (thin transport)
└── mes.module.ts               Wiring
```

OEE calculator lives in **`apps/api/src/modules/iot/oee/oee-calculator.service.ts`**
(IoT module — it consumes sensor data). MES *uses* the calculator and
records the result against work orders.

## What MES tracks (per machine, per shift)

```
Production Session             ← worker logs in, picks a work order
   ↳ Cycle Counter              ← good units produced
   ↳ Defect Counter             ← scrapped units (with reason)
   ↳ Downtime Records           ← planned + unplanned, with reason codes
   ↳ OEE Snapshot               ← computed when session closes
   ↳ Tech Card Adherence        ← did the operator follow the routing?
```

## State machine — Production Order at the MES boundary

```
released  →  in_production  →  completed
         ↓
       paused                 (operator halt)
         ↓
       resumed
```

MES emits `ProductionStarted`, `ProductionPaused`, `ProductionCompleted`
events that:
- Inventory listens to (consumes raw materials, books finished goods)
- Finance listens to (rolls up actual cost into the order)
- Director dashboard listens to (alerts on long pauses)

## Downtime classification

Every downtime is tagged with one of:
- **Planned** (scheduled maintenance, changeover, lunch) — counts against
  Performance only, not Availability
- **Unplanned** (breakdown, material shortage, operator absent) — hits
  Availability hard
- **Quality** (rejected sample triggered a stop) — counts against Quality

Reason codes live in `constants/`. Adding a new reason requires updating
i18n (UZ + RU) and the dashboard filter dropdown.

## How OEE flows back

```
Operator closes session
        │
        ▼
MES rolls up:
   plannedProductionTime    (from work_order.scheduled_minutes)
   runTime                  (session duration − sum of downtime durations)
   idealCycleTime           (from product master)
   actualQuantity            (cycle counter)
   defectQuantity            (defect counter)
        │
        ▼
OeeCalculatorService.calculate(...)
   → Availability × Performance × Quality
        │
        ▼
Persist `mes_oee_snapshots` row + emit OeeRecorded event
        │
        ▼
Director dashboard refreshes, alerts on OEE < 0.40 (critical)
```

## Conventions

- Every cycle/defect counter increment is a row, not an UPDATE. Append-only
  for audit. Aggregates are computed via SUM at query time (with a 1-min
  cache).
- Downtime duration computed as `endedAt - startedAt`; if `endedAt` is
  null, the downtime is "in progress" (rendered live on the dashboard).
- All times stored as TIMESTAMPTZ. Display uses `TashkentTimeService`.
- Work-order status transitions emit events; never write to the status
  column directly outside the state-machine guard.

## Where to read deeper

- OEE formula + benchmarks → top of `iot/oee/oee-calculator.service.ts`
- Production order lifecycle → `production/` module (separate from MES)
- Sensor ingest pipeline → `iot/` module
- KPI from MES → `hr/domain/services/kpi.service.ts` (uses OEE as one of 3 axes)
