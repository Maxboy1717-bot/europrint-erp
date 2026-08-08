# PP (Rejalashtirish) — FAZA-0 RE-AUDIT (read-only, verify-don't-trust)
> 2026-06-17 · Bajaruvchi 🟢 (MASSIV) · Manba: docs/audit/MUSLIMBEK-PROMT-05-PP + jonli DB/route probe
> Metod: `_audit/q.cjs` (read-only DB) + HTTP probe :3030 + kod o'qish + BEGIN/ROLLBACK insert-proof.

## XULOSA (1 qator)
PP **~70% qurilgan va ulangan** (CQRS DDD + scheduling + CRP/MRP/BOM + oltin-ip listenerlar), endpointlar JONLI (401). Lekin **production order YARATIB BO'LMAYDI EDI** — har ikkala insert yo'li 23502 bilan qulardi (DB-proof). Tuzatildi (create yo'li, DDL'siz, commit `b1f2d238`). Release yo'li uchun 1 ta DDL kerak (status ustuni keng — egasi tasdig'i).

---

## 1. KANONIK JADVALLAR (jonli, real)
| Jadval | Tur | Qator | Izoh |
|--------|-----|-------|------|
| `production_orders` | **r (kanonik)** | 0 | PP ishlab-chiqarish buyurtma. 2 yozuvchi yo'l (CQRS execSavePo + pp-planning). |
| `papka_orders` | r | 0 | messaging-conflated (mes_papka_orders=VIEW ustida) — PP buyurtma EMAS, alohida. |
| `work_centers` | r | — | **efficiency_rate ustuni BOR** ⇒ CRP-503 ALLAQACHON tuzatilgan (promt taxmini eskirgan). |
| `pp_work_centers` / `pp_routing_operations` / `pp_mrp_runs` / `shift_schedules` / `mes_papka_orders` | **v (VIEW)** | — | bazaviy jadvallar ustida ko'rinish. |
| `pp_routing` / `pp_mrp_run_lines` / `routing_operations` / `shift_handovers` / `ow_tech_cards` | r | 0 | real jadvallar, bo'sh (qurilish bosqichi). |
| `sales_orders` | r | 12 | oltin-ip manbai (seed EP-2024-*). |
| `products` | r | **0 (BO'SH)** | ⚠️ product_id FK manbai bo'sh — uchidan-uchiga oqim uchun seed kerak. |

C6 — parallel dunyo YO'Q: PP buyurtma = `production_orders` (kanonik). papka_orders alohida (messaging).

## 2. QURILGAN VA ULANGAN (verify-don't-trust — tasdiqlandi)
- **CQRS DDD:** aggregates (production-order/bom/routing/work-center), command handlers (create/release PO, run-mrp, approve-bom/routing, work-center CRUD), query handlers (orders/boms/routings/work-centers/mrp-report/machine-load/mps-atp/production-plan).
- **Scheduling/algoritm:** johnson/network/capacity/scheduling + costing + learning-curve + bom-explosion + crp + mps + intelligence servislari.
- **10 controller, endpointlar JONLI (401 guarded):** pp/orders, pp/work-centers, pp/routing, pp/bom, pp/crp, equipment, planning, production/shift-reports, technology.
- **Oltin-ip kiruvchi listenerlar ULANGAN** (`@EventsHandler`): DesignApproved, LabTestPassed, AdvanceApproved, MroMaintenanceStop, WmsGoodsIssued → PP. (#03 da chiquvchi pp-released→MES ham tasdiqlangan.)
- **FE boy:** AIProductionPlanning(+Chart/Dialogs/Sections), CapacityPlanning(+Tabs), CrpPage, ERPProduction, MESWorkCenters, va h.k.

> Eslatma: kod ichidagi `return { ok: true, data: <real> }` belgilari FAKE EMAS — bu inline `Result.Ok` shakli (real data: saveResult/paginatedResult/shortage). Faqat 2 ta haqiqiy stub bor (pastda).

## 3. BUZUQ (CORE — DB-proof bilan) → TUZATILDI
| # | Muammo | Isbot | Holat |
|---|--------|-------|-------|
| ⭐1 | **execSavePo** product_id (NOT NULL) ni bermaydi + `soId` argumentini E'TIBORSIZ qoldiradi (sales_order_id hech qachon yozilmaydi) → 23502 crash; SD↔PP bog'i yo'qoladi | INSERT proof: CRASH 23502 col=product_id; FIXED shakl OK (sales_order_id=1, product_id=1) | ✅ `b1f2d238` |
| 2 | **pp-planning.createScheduleEntry** planned_quantity (NOT NULL) ni bermaydi → 23502 | proof: CRASH→FIXED OK (planned_quantity=5) | ✅ `b1f2d238` |
| 3 | **savePo har doim INSERT** qiladi → release-production-order DUBLIKAT qator yaratadi (status yangilamaydi) | proof: UPDATE → 1 qator (dublikatsiz) | ✅ `b1f2d238` (execUpdatePoStatus, id>0→UPDATE) |
| 4 | **release status crash:** `production_orders.status varchar(20)`, kanonik qiymat `'released_to_production'` = 22 belgi → 22001 overflow | proof: 22001 "value too long" | ⏳ **DDL kerak** (pastda — egasi tasdig'i) |

## 4. HALOL STUB (notImplemented — qabul qilinadi)
- `technology/cards/generate` + `technology/cards/:id/optimize` (AI texkarta generatsiya/optimizatsiya) → honest 501. AI feature, kechiktiriladi (Faza 6 / #15 AI).

## 5. KECHIKTIRILGAN PERIFERIK (vizyon, katta — keyingi fazalar)
AI 7-step planner (E3), owner dashboard (EP-PP-134), Pareto CRON (EP-PP-136), Excel export (EP-PP-129), shift-reja UI + plan-fakt 4-raqam kiritish (EP-PP-092), kod-lug'at (EP-PP-109, egasi ma'no kiritadi), status-lug'at 7-status Uzbek (EP-PP-082). Bular MUSLIMBEK-PROMT-05 Faza 4-6 — keyin.

## 6. REGRESSIYA: yo'q
BE tsc 0; barcha reviewer PASS; TAKROR 0; login oldin/keyin 401; server 200. create yo'li tuzatildi, release yo'li avval ham buzuq edi (endi product_id/dublikat crash yo'q, faqat status-kenglik DDL kutadi) = regressiya emas, sof yaxshilanish.

---

## ⏳ DDL TASDIG'I KUTILMOQDA (MASSIV rail 1) — release→MES yo'lini yopish uchun
```sql
-- APPROVED: owner <kutilmoqda>
-- production_orders.status varchar(20) -> varchar(50): kanonik 'released_to_production' (22) sig'sin;
-- sales_orders.status allaqachon varchar(50) — moslik. Ma'lumot yo'qotilmaydi (kengaytirish).
ALTER TABLE production_orders ALTER COLUMN status TYPE varchar(50);
```
Bu tasdiqlansa: release-production-order to'liq ishlaydi (status='released_to_production' yoziladi → PpReleasedEvent → MES). Tasdiqsiz: create ishlaydi, release status-yozuvda 22001 beradi.

> Keyingi (MASSIV, tasdiqdan keyin): DDL run + release live-proof → SD→PP→MES oltin-ip create→release jonli → PP modul hisoboti → #06 MES.
