---
name: warehouse
description: EuroPrint ombor va material boshqaruvi — rulo karton, FIFO/FEFO, inventarizatsiya, ABC tahlil. Trigger so'zlar: "ombor", "warehouse", "WMS", "material", "qoldiq", "rol", "rulo", "inventar", "ABC", "FIFO", "FEFO".
---

# Ombor Moduli — Skill

## Modul hududi
- Backend: `apps/api/src/modules/wms/`, `apps/api/src/modules/mm/`, `apps/api/src/modules/logistics/`
- Frontend: `artifacts/erp-dashboard/src/pages/wms/`, `WarehouseHub*.tsx`, `WMSDashboard.tsx`
- Schema: `lib/db/src/schema/mm-*.ts`, `wms-*.ts`, `pos-warehouse*.ts`

## Asosiy konseptlar

### Rol (Rulo) Tizimi — KORXONA ASOSIY XOM ASHYOSI
- Har rol unique ID, joriy og'irlik (kg), en (mm), tur, yetkazib beruvchi, joylashuv
- Holatlar: `available` → `in_use` → `low` → `empty`
- `remaining_weight_kg < 20` → `is_low=true` → event `warehouse.roll_low` emit qilinadi
- `remaining_weight_kg == 0` → `status='empty'`
- QR kod payload: roll_id + article + remaining

### FIFO / FEFO allocation
- `pos-fifo.service.ts` — `getCandidates()` + `allocate(warehouseId, materialId, demand)`
- FIFO (oddiy material) → `received_date ASC`
- FEFO (muddatli material) → `expiry_date ASC`
- `Insufficient stock` → `Err('INSUFFICIENT')`

### Three-way match (PO × GR × Invoice)
- PO qty ↔ Goods Receipt qty ↔ Invoice qty (tolerance ±5%)
- Price: `expected = GR.qty × PO.unitPrice`, tolerance ±5%
- Mos kelmasa: `Err('QTY_OOT'|'PRICE_OOT'|'INVOICE_QTY_MISMATCH')`

### ABC Tahlil
- Yillik qiymat bo'yicha tartiblash
- Cumulative %: ≤80%=A, ≤95%=B, >95%=C

### Inventory Variance
- `variance(system, counted)` → `{diff, pct, severity}`
- ≤2% → `ok`, ≤10% → `minor`, >10% → `major`

## API endpointlar
- `GET /api/wms/inventory` — joriy qoldiqlar
- `POST /api/wms/inventory/count` — inventarizatsiya boshlash
- `GET /api/wms/abc-analysis` — ABC reklassifikatsiya
- `GET /api/wms/dashboard` — KPI panel
- `GET /api/mm/purchase-orders` — xarid buyurtmalari
- `POST /api/mm/purchase-orders` — yangi PO
- `POST /api/mm/goods-receipts` — yetkazib berishni qabul qilish
- `POST /api/wms/transfers` — omborlar orasi ko'chirish

## Biznes qoidalari
1. **Hard delete YO'Q** — har doim `is_deleted=true` (soft delete).
2. **Negative balance taqiqlangan** — `applyDelta(balance, delta)` `BELOW_ZERO` qaytaradi.
3. **Roll usage event** — `warehouse_roll_usage` jadvaliga audit yoziladi.
4. **Material card unique by `kod`** — duplicate detection upstream.
5. **Stock turnover** = `cogs / avgInventory` — 0 bo'lsa null qaytaradi (div-by-zero guard).

## Test fayllari
- `apps/api/test/materials/warehouse.spec.ts` — 15 tests
- `apps/api/test/materials/materials-exhaustive.spec.ts` — 104 tests
- `apps/api/test/pos/pos-exhaustive.spec.ts` — FIFO/FEFO

## Eslatma
- Yangi material qo'shishda `numericMoney` Drizzle tipini ishlating, `doublePrecision` EMAS.
- Roll ID — string (mijoz tomonidan beriladigan), DB id — number (auto-gen).
