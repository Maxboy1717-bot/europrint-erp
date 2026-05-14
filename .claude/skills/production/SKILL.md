---
name: production
description: EuroPrint ishlab chiqarish moduli — Production Order lifecycle, BOM, sex yuklanishi, defect/qayta ishlov. Trigger so'zlar: "buyurtma", "production order", "ishlab chiqarish", "sex", "rejalashtirish", "BOM", "MES", "OEE".
---

# Ishlab Chiqarish Moduli — Skill

## Modul hududi
- Backend: `apps/api/src/modules/pp/`, `apps/api/src/modules/mes/`, `apps/api/src/modules/production/`
- Frontend: `artifacts/erp-dashboard/src/pages/` da PP*, MES*, Production* sahifalar
- Schema: `lib/db/src/schema/pp-*.ts`, `mes-*.ts`

## Production Order Lifecycle
```
draft → released → in_production → completed
                                 → cancelled
                                 (har bosqichda cancel mumkin)
```

## Asosiy konseptlar

### BOM (Bill of Materials)
- Har mahsulot uchun materiallar ro'yxati (qty/unit)
- `expandBom(orderQty, bom)` → har material uchun total qty
- Scrap factor (qoldiq foiz) ko'rib chiqiladi

### Work Centers (sexlar)
- `work_centers` jadvali — har sex/stansiya
- Capacity (qism/soat), loading, queue uzunligi
- Bottleneck tahlili — eng band sex aniqlanadi

### MES Sessions
- `idle → running → paused → completed/aborted`
- Real-time progress, OEE (Availability × Performance × Quality)
- Pause sabablari: breakdown/changeover/material/operator

## API endpointlar
- `GET    /api/pp/orders` — barcha buyurtmalar (filter: status, customer, dateRange)
- `POST   /api/pp/orders` — yangi buyurtma (CQRS CommandBus orqali)
- `GET    /api/pp/orders/:id` — bitta buyurtma (NotFoundException agar mavjud emas)
- `PATCH  /api/pp/orders/:id` — yangilash (status FSM tekshiruvi)
- `PATCH  /api/pp/orders/:id/release` — ishlab chiqarishga yuborish (faqat `draft`→`released`)
- `DELETE /api/pp/orders/:id` — bekor qilish (cascade FK orqali)
- `GET    /api/pp/bom` — BOM ro'yxati
- `POST   /api/pp/bom` — yangi BOM
- `GET    /api/mes/sessions` — joriy MES sessiyalar
- `POST   /api/mes/sessions` — sessiya boshlash

## Biznes qoidalari
1. **Buyurtma faqat `approved` holatda `released` ga o'tadi** — boshqa har qanday transition `Err(INVALID_TRANSITION)` qaytaradi.
2. **Material yetishmasa** → status `on_hold`, omborga avtomatik signal (`warehouse.material_low` event).
3. **Defect > 5%** → QC ga signal (`qc.defect_threshold_exceeded`).
4. **BOM null/empty** → `Err('NO_LINES')`.
5. **Negative qty** → `Err('INVALID_QUANTITY')`.

## Test fayllari
- `apps/api/test/production/pp-orders.spec.ts` — FSM matrix, BOM expansion, OEE
- `apps/api/test/production/production-exhaustive.spec.ts` — 136 dense tests

## Eslatma
- Yangi buyurtma yaratishda **CommandBus orqali** delegate qiling (CQRS pattern), to'g'ridan service chaqirmang.
- `GET /api/pp/orders` `queryBus.execute()` orqali — controller-da bare bus.execute() yo'q.
