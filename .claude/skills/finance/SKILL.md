---
name: finance
description: EuroPrint moliya moduli — GL, AP/AR, payroll, budget, cashflow, invoicing, payment matching. Trigger so'zlar: "moliya", "finance", "GL", "ledger", "AP", "AR", "to'lov", "payment", "invoice", "buxgalteriya", "byudjet", "cashflow", "CFO".
---

# Moliya Moduli — Skill

## Modul hududi
- Backend: `apps/api/src/modules/finance/`, `apps/api/src/modules/fi/`, `apps/api/src/modules/sd/` (sales-side AR)
- Frontend: `Finance*`, `Accounting*`, `CFO*`, `AccountsPayable.tsx`, `AccountsReceivable.tsx`
- Schema: `lib/db/src/schema/fi-*.ts`, `finance-*.ts`

## Asosiy konseptlar

### General Ledger (GL)
- Chart of accounts: asset/liability/equity/revenue/expense
- Journal entry: `totalDebit === totalCredit` (BALANCED INVARIANT)
- `gl.service.ts:postDocument()` → BadRequestException agar unbalanced
- Period closed → `Err('PERIOD_CLOSED')` (yopiq oyga yozish taqiqlangan)

### Numeric Money — KRITIK!
- `numericMoney` Drizzle tipi → `NUMERIC(18,4)` PostgreSQL'da
- HECH QACHON `doublePrecision` ishlatma — float drift 0.1+0.2≠0.3 muammosi
- Decimal.js bilan ishlanadi, `.toFixed(4)` formatda

### AR/AP Aging
```
0–30   days  → current
31–60        → bucket 1
61–90        → bucket 2
90+          → overdue
```

### Payment Matching
- `matchPayment(invoiceAmount, paymentAmount, tolerance=0.01)`
- Natija: `exact` | `overpaid` | `underpaid`
- Tolerance — 0.01 cent (NUMERIC precision noise)

### Budget Variance
- `variance(budgeted, actual)` → `{absolute, pct, isOver}`
- 0 budget bo'lsa pct=0 (div-by-zero guard)

### Cash Flow Projection
- Opening balance + inflows − outflows = closing
- Min balance dip tracking (kunlik minimum)
- Negative closing → `ok: false` flag

### Payroll Calc
- Gross × (1 − incomeTaxRate − inpsRate) = Net
- INPS_RATE = 0.08, INCOME_TAX_RATE = 0.12 (`business.constants.ts`)

### Break-Even
- `units = fixedCost / (price − variableCost)`
- contribution ≤ 0 → `Err('NO_BREAK_EVEN')`
- negative fixedCost → `Err('NEGATIVE_FIXED_COST')`

## API endpointlar
- `GET    /api/finance/cashflow` — cashflow forecast
- `GET    /api/finance/budget` — byudjet
- `POST   /api/finance/invoices` — yangi invoice
- `PATCH  /api/finance/invoices/:id` — yangilash
- `PUT    /api/finance/invoices/:id` — to'liq almashtirish
- `DELETE /api/finance/invoices/:id` — bekor qilish
- `GET    /api/finance/payments` — to'lovlar
- `POST   /api/finance/payments` — to'lov yozish
- `GET    /api/accounting/gl/accounts` — chart of accounts
- `POST   /api/accounting/gl/accounts/seed` — boshlang'ich chart seed
- `GET    /api/accounting/materials/by-order?orderId=X` — buyurtma bo'yicha materiallar (orderId optional → [])
- `POST   /api/finance/journal-entries` — GL yozuv (balanced invariant)

## Biznes qoidalari
1. **GL balanced invariant** — debit ≠ credit → 400 BadRequest, hech qachon yozuv qoldirma.
2. **Invoice FSM:** `draft → pending → approved → paid`, `pending → rejected`, `approved → cancelled`.
3. **Multi-currency** — UZS, USD, EUR, RUB; conversion `amount × rates[from] / rates[to]`.
4. **VAT default 12%** — `CFO_VAT_RATE` env orqali override mumkin.
5. **Late fee** — `amount × rate × daysLate` (default rate=0.001).

## Test fayllari
- `apps/api/test/finance/gl.service.spec.ts` — 23 tests
- `apps/api/test/finance/break-even.spec.ts` — break-even + payroll
- `apps/api/test/finance/finance-exhaustive.spec.ts` — 153 tests

## Eslatma
- `process.env` to'g'ridan ishlatma — `ConfigService.get<string>(...)` orqali (Rule 7).
- Yangi GL account qo'shishda `gl-accounts.constants.ts` ga yozing.
- Payroll secret rates `business.constants.ts` da, hardcoded magic number EMAS (Rule 12).
