# Finance module (`apps/api/src/modules/finance/`)

> CFO-facing financial analytics + period close. Companion to `fi/` (which
> handles raw bookkeeping — GL entries, AP/AR, journal posting). `finance/`
> sits on top of `fi/` and produces the numbers you see on the CFO dashboard.

## Subfolder map

```
finance/
├── domain/services/              Pure compute — read-only analytics
│   ├── financial-ratios.service.ts   Liquidity/Profitability/Leverage + Altman Z
│   ├── variance-analysis.service.ts  MPV/MQV/LRV/LEV/OV standard-cost variance
│   ├── standard-cost.service.ts      Period-frozen std-cost reference table
│   ├── depreciation.service.ts       SL / DB / SYD / UOP per fixed asset
│   ├── break-even.service.ts         CM, MOS, DOL per product per period
│   └── cfo-config.service.ts         Tunable rates (overhead, std labour)
├── application/                  Use-case handlers (CQRS-style)
├── budgets/                      Budget vs. actual rollups
├── cashflow/                     Cashflow forecast + position
├── financial-reports/            P&L, balance sheet, equity statement
├── reports-hub/                  Scheduled-reports definitions and runs
├── payroll/                      (legacy split — see hr/ for current impl)
├── order-costing/                Per-order COGS rollup (joins to PP + MES)
├── gl/                           Bridge to fi/ for GL postings
├── presentation/                 NestJS controllers (thin transport)
└── finance.module.ts             Wiring
```

## Which formulas live where

| Need to know about...        | Read this                                                            |
|------------------------------|----------------------------------------------------------------------|
| Altman Z bankruptcy risk     | `domain/services/financial-ratios.service.ts`                        |
| Standard vs. actual variance | `domain/services/variance-analysis.service.ts`                       |
| Period-frozen standard cost  | `domain/services/standard-cost.service.ts`                           |
| Asset depreciation methods   | `domain/services/depreciation.service.ts`                            |
| Break-even / margin of safety| `domain/services/break-even.service.ts`                              |
| Per-product COGS             | `order-costing/order-costing.service.ts`                             |
| Cashflow position + forecast | `cashflow/cashflow.service.ts`                                       |
| Tax (VAT / simplified)       | `../fi/tax/general-tax.service.ts` *(not in finance/)*               |

## CFO config (tuneable rates)

`cfo-config.service.ts` exposes `getNumber(key, default)`. Used to thread
"factory-wide standard rates" through the variance/standard-cost services
without redeploys. Defaults at the call site only kick in when the row
hasn't been set.

Current keys:
- `overhead_rate_per_hour` (default 15,000 UZS)
- `std_labor_rate_per_hour` (default 25,000 UZS)
- `audit_variance_threshold_pct` (default 20)
- `wacc_for_npv` (default 0.14 — used by CLV DCF)

## How a CFO dashboard request flows

```
GET /api/finance/cfo/dashboard?period=2026-04
        │
        ▼
CfoDashboardController                       (presentation/)
        │  delegates
        ▼
CfoDashboardService                          (application/)
        │  fans out to:
        ├── financialRatios.compute(period)  (domain — DB read)
        ├── breakEven.analyze(...)
        ├── cashflow.getPosition(period)
        └── varianceAnalysis.analyzeAll(period)
        │
        ▼
   compose CFO DTO → return
```

Each `domain/services/*` is read-only — no writes to `fi/` ledgers. Writing
to GL goes through `fi/` directly.

## Conventions

- All money in **UZS** at the storage layer. Frontend formats for display.
- Period codes are `YYYY-MM` strings (e.g. `'2026-04'`). NEVER use `Date`.
- Standards are frozen for the period — updates create a new row, never
  mutate. Variance reports must remain reproducible.
- Every monetary `numeric` is parsed with `safeNum(value, 0)`. NULLs from
  the DB happen on edge-period queries and should not crash the dashboard.
- Variance ≥ 20% is flagged for manual audit (`audit_variance_threshold_pct`).

## Where to read deeper

- Altman Z derivation + coefficients → top of `financial-ratios.service.ts`
- Why standards are quarterly-frozen → top of `standard-cost.service.ts`
- Why MPV/MQV split matters → top of `variance-analysis.service.ts`
- Break-even MOS warning logic → top of `break-even.service.ts`
- Depreciation method choice (SL vs DB vs SYD vs UOP) → top of `depreciation.service.ts`
