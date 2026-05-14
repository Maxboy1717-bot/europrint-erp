# POS module (`apps/api/src/modules/pos/`)

> Point-of-Sale terminals on the shop floor. These are tablet/kiosk
> endpoints for warehouse operators to record kirim (receipts), chiqim
> (issues), and reconcile against POs. NOT retail POS — this is industrial
> "physical movement recording" software.
>
> See also: `pos-v2/` (newer rewrite, parallel) and the frontend POS
> sub-app at `artifacts/erp-dashboard/src/pos-monitor/`.

## Subfolder map

```
pos/
├── controllers/                Tablet-facing REST endpoints (thin)
├── repositories/               Drizzle data access
│   ├── auto-gl-posting.repository.ts        Auto-create GL entries from POS movements
│   ├── auto-barcode.repository.ts           Generate barcode labels on receive
│   ├── three-way-match.repository.ts        PO ↔ Receipt ↔ Invoice match audit
│   ├── pos-employee-balance.repository.ts   Track materials issued to each operator
│   ├── goods-receipt.repository.ts          Receive-PO workflow
│   └── warehouse-employees.repository.ts    Per-warehouse operator roster
├── services/                   Business logic
├── employee-ledger.service.ts  Operator material ledger (given vs returned)
├── employee-write-off.service.ts  Write-off when material can't be returned
├── lifecycle-block.service.ts  Status-transition guards
├── dto/                        Zod schemas
├── events/                     Domain events (MovementCreated, etc.)
├── guards/                     POS-specific auth guards
└── jobs/                       Cron / scheduled cleanups
```

## What POS terminals do

```
Operator at terminal:
   ↓
 Login (PIN or RFID badge)
   ↓
 Scan barcode (material) or pick from list
   ↓
 Enter quantity + reason code
   ↓
 Submit movement
   ↓
[POS backend]
 ↓ validates lifecycle (lifecycle-block.service)
 ↓ creates pos_movement + pos_movement_lines rows
 ↓ updates warehouse_stock (atomic transaction)
 ↓ emits MovementCreated event
 ↓ optionally posts to GL (auto-gl-posting)
 ↓ if external receipt: starts 3-way match
```

## Key workflows

### Kirim (receive from supplier)
1. PO exists in `purchase_orders`
2. Truck arrives; operator scans PO barcode at terminal
3. POS opens "GOODS_RECEIPT" movement; operator confirms each line + qty
4. Movement approved → `warehouse_stock` increments + `three_way_match_log` row
5. When invoice arrives, three-way match flags variance for AP review

### Chiqim (internal issue)
1. Production team requests material via `material_requests`
2. Warehouse operator at terminal sees pending requests
3. Picks material, confirms qty → INTERNAL_ISSUE movement
4. `pos_employee_balance` tracks "given to operator A"
5. Operator A returns leftover → INTERNAL_RETURN closes the ledger

### Write-off (when return is impossible)
- Lost / damaged / consumed materials trigger `employee-write-off.service`
- Requires approver sign-off above threshold
- Posts to GL as expense

## 3-way match (PO ↔ Receipt ↔ Invoice)

Implemented in `repositories/three-way-match.repository.ts`. The match
status enum:
- `MATCHED`      all three line up within tolerance
- `VARIANCE`     small drift (≤ 5%) — flagged but auto-passed
- `FAILED`       large drift — held for AP manual review
- `PENDING`      invoice not yet received

The CFO dashboard surfaces FAILED entries. See top of the repo file for
why this lives in POS rather than FI (POS triggers the match at receipt
time, not when the invoice lands).

## Conventions

- Movement types are a closed enum (see `wms/README.md` for the full list).
- All movements are append-only — corrections create a counter-movement
  rather than UPDATEing the original. Auditors require this.
- POS terminals must work offline (intermittent factory wifi). The
  frontend `pos-monitor` uses IndexedDB to queue movements and sync
  when reconnected (see `artifacts/erp-dashboard/src/pos-monitor/`).
- Operator PIN is verified server-side; never store plaintext.
  Auto-lock after 15 minutes idle (configurable).

## Where to read deeper

- 3-way match algorithm → `repositories/three-way-match.repository.ts`
- Auto-GL posting on receipt → `repositories/auto-gl-posting.repository.ts`
- Frontend POS sub-app → `artifacts/erp-dashboard/src/pos-monitor/`
- Inventory state model → `modules/wms/README.md`
