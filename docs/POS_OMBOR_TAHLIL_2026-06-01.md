# POS Monitor + Ombor — Vizyon vs Hozirgi holat TAHLILI

> Sana: 2026-06-01 · Egasi vizyoni: POS Monitor (skaner interfeysi) → OMBOR
> (zaxira) → ERP (data/hisobot) — uchchasi bog'langan bo'lsin.
> Bu hujjat **faqat tahlil**, hech narsa tuzatilmadi. Egasi tasdig'idan keyin tuzatish bosqichi.

---

## 1. MAVJUD SPECIFIKATSIYA — MD/Q&A FAYLLAR (topildi va o'qildi)

### 1.1. Asosiy talab manbalari (eng muhim)

| Fayl | Mazmun | Sana |
|---|---|---|
| **`docs/ombor-pos-master-plan.md`** ⭐ | 74+ savol-javobli intervyu + vizyon → §0–§17 yagona spetsifikatsiya. Qoidalar majburiy. | 2026-05-30 |
| **`docs/ombor-pos-EXECUTION-ROADMAP.md`** ⭐ | IJRO yo'l xaritasi. Faza A (tozalash) → B (barcode) → C (QC) → ... → K (kassa+FIFO). | 2026-05-30 |
| `docs/full-analysis-2026-05-27-v2/10-pos-monitor-warehouse.md` | Round 2 audit: P0-P2 muammolar, 3 stok manbai, dead-letter event listenerlar | 2026-05-27 |
| `docs/full-analysis-2026-05-27-v2/12-inventory-materials-stock.md` | Round 2: 4 material jadvali, FK type mismatch, transaksiyasizlik | 2026-05-27 |
| `docs/MASTER_DATA_AUDIT_2026-05-31.md` | DUPLIKAT/ZIDDIYAT master-data (mijoz x3, material x4, aktiv x2) | 2026-05-31 |
| `docs/PHASE7_DEFERRED.md` | Klaster 2 — yarim ulangan fayl-yuklash; Klaster 3 — 47 FE↔BE endpoint mismatch | 2026-05-31 |
| `docs/legacy-dept-pos-table-migration-plan.md` | Legacy POS jadvallar drop rejasi | 2026-05-29 |

### 1.2. Spetsifikatsiya — qisqa xulosa (egasi nimani xohlaydi)

**Vizyon (master-plan §0):** Moliya tomonidan to'liq nazorat qilinadigan, **ko'p-omborli**,
**barcode-asosli** material nazorat tizimi. Har inventar (eng kichigigacha) barcode/QR
oladi. Har xarid ombordan prixod + kassadan rasxod bo'lib o'tadi. Xodim podotchetda
javobgar. Markaziy ombor YO'Q — o'rniga moliya rahbari uchun dashboard.

**Asosiy qoidalar:**

- §1.2 **POS Monitor ERP SSO** — alohida login YO'Q. ERP'ga kirgan = POS ochiq.
- §1.3 **Yagona responsive frontend** (PC + planshet + smartfon).
- §1.5 **Offline** — uzilsa IndexedDB ga saqlanadi, qaytganda sync.
- §1.9 **30+ terminal bir omborga** — PostgreSQL `FOR UPDATE` + SEQUENCE majburiy.
- §1.10 **Config-driven** — ombor turi, akt turi, bildirishnoma, dashboard widget.
- §1.12 **Buzmaslik** — har o'zgarish additive; schema ADD-ONLY.

**Ombor turlari (§3, config-driven `warehouse_types` jadvali, 9 ta):** raw_material,
paper_rolls, household_mro, finished_goods, production, defective, waste_paper,
tools_equipment, department_warehouse.

**Harakat turlari (§4):** EXTERNAL_IN (5 bosqich: DRAFT → KARANTIN → QC → OMBOR_MENEJER → AI_GL),
EXTERNAL_OUT (Ombor menejer + Moliya + AI), INTERNAL_ISSUE, INTERNAL_RETURN,
INTERNAL_TRANSFER, DAMAGE.

**P2P xarid zanjiri (§7):** ichki ta'minotchi so'rovi → org-sxema tasdiq zanjiri →
avans/o'z puli → tashqi vendor → chek-bot (Telegram OCR) → 3-tomonlama solishtiruv →
ombor prixod → podotchet reconcile.

**POS↔Ombor BOG'LANISH:** POS Monitor sotish/qabul → atomik **warehouse_stock** o'zgartirish
+ **material_movements** jurnal. Bu vizyonning yadrosi.

**Roadmap fazalari (EXECUTION-ROADMAP):**

- **Faza A** (TOZALASH + ERP SSO) — eski WMS rasvosini olib tashlash, POS SSO ulash
- **Faza B** (Barcode/QR/Etiket) — EAN-13 + Code-128 + QR avto, ZPL/EPL termal printer
- **Faza C** (Karantin → QC oqimi) — status sifatida (alohida ombor emas)
- **Faza D** (PDF akt) — kirim akti + hisob-faktura + akt turlari config
- **Faza E** (Inventarizatsiya) — davriy + kunlik cycle count
- **Faza F** (Bildirishnoma config-driven)
- **Faza G** (Material 360 — har inventar to'liq profil)
- **Faza H** (Mening inventarim / podotchet / offboarding bloki)
- **Faza I** (Auto-GL — gl_account_mappings seed → AWAITING_REVIEW)
- **Faza J** (Bo'lim ombori + AI norma)
- **Faza K** (Kassa + FIFO tannarx)

---

## 2. POS MONITOR — HOZIRGI HOLAT (kod inspektsiyasi)

### 2.1 Frontend (`artifacts/erp-dashboard/src/pos-monitor/`)

**Holat: ISHLAYDI (asosi toza, lekin parallel sahifalar bor).**

**Asosiy struktura:**

- `App.tsx` ichida `/pos-monitor` prefix bilan SPA mount qilinadi (`PosMonitorApp.tsx`).
- ERP SSO `useAuth()` orqali — `pos_session` token YO'Q (§1.2 ✅ bajarilgan).
- `/pos-monitor/login` → `/pos-monitor` redirect (eski login YOPILGAN).
- 23 ta lazy-load sahifa (PosWarehouses, PosMaterial360, PosMovementKirim, PosMovementChiqim, PosQuarantine, PosQCReview, PosLedger, PosMyInventory, ...).
- **Canonical asosiy sahifa:** `PosMonitorPage` (`@/pages/PosMonitorPage`) — tabs+kirim/chiqim+barcode dialogu (ombor xodimi planshet uchun).
- 3 til (uz/ru/uz-cyr), Telegram WebApp init.
- Socket.IO `/pos` namespace ulanish.
- Offline sync hook (`useOfflineSync`, IndexedDB).

**Barcode/skaner:**

- `PosBarcodeScanner.tsx` — kamera (BarcodeDetector API), manual input.
- `useHardwareScanner` hook — 3 manba: USB HID, Web Serial, klaviatura wedge.
- `useCameraScanner` hook (BarcodeDetector + ZXing fallback).
- BE chaqiruvi: `POST /api/pos/barcode/scan` → material kartochka qaytaradi.

**API client:**

- Yangi `pos-operations.api.ts` → `BASE = /api/pos/operations` — **toza ERP cookie auth** (`credentials: include`). PosMonitorPage shu klientni ishlatadi.
- Eski `pos-monitor.api.ts` — header'da `§1.2: ERP SSO` deb yozilgan, ammo to'liq tekshirilmagan (legacy sahifalar uchun).

### 2.2 Backend (`apps/api/src/modules/pos/`)

**Holat: ISHLAYDI — yangi `pos/operations` toza oqim mavjud, lekin **eski 22 controller hali ham bor** (parallel, ba'zilari dead).

**Yangi canonical oqim (POS Monitor uchun, ✅):**

| Endpoint | Controller | Service | Yozadi |
|---|---|---|---|
| `GET /api/pos/operations/warehouses` | `PosOperationsController` | `WarehouseConfigService.listWarehouses` | (faqat o'qish) |
| `GET /api/pos/operations/warehouses/:id/stock` | … | `getWarehouseStock` | (o'qish) |
| **`POST /api/pos/operations/warehouses/:id/issue`** ⭐ | … | `issueStock` | `warehouse_stock −qty` (atomik) + `material_cards.current_stock` + `material_movements` 'ISSUE' |
| **`POST /api/pos/operations/warehouses/:id/receive`** ⭐ | … | `receiveStock` | `warehouse_stock +qty` (upsert) + `material_cards` + `material_movements` 'RECEIVE' |
| `GET /api/pos/operations/p2p/pending` | … | `procurementRequest.listRequests('approved')` | (o'qish) |
| **`POST /api/pos/operations/p2p/:requestId/receive`** ⭐ | … | `procurementRequest.receiveProcurement` | so'rov 'received' + advance settled + `warehouse_stock` prixod (har qator) + `material_movements` |
| `GET /api/pos/operations/materials/:id/movements` | … | `getMaterialMovements` | (o'qish) |
| `POST /api/pos/barcode/scan` | `BarcodeController` | `PosBarcodeService.scanBarcode` | (Redis cache → DB → AI) |

Chiqim ATOMIK: `UPDATE … WHERE available_quantity >= qty RETURNING …` — yetmasa qator
yangilanmaydi, 400 qaytariladi. ✅ Konkurensiya xavfsiz.

**Eski parallel POS oqim (legacy, ⚠️ rasvo lekin ishlaydi):**

- `MovementsController` (`/pos/movements`) → `PosMovementService.createMovement` →
  `pos_stock_ledger` (append-only journal) + `current_stock` (live aggregate, ALOHIDA jadval) — bu `warehouse_stock` ga YOZMAYDI. Ya'ni **eski POS oqimi yangi ombor jadvalini yangilamaydi.**
- 23 ta controller jami: StockController, CashRegisterController (retail till), InventoryCountController, RequestsController, EmployeeController, ReportsController, GlController, SyncController, PosAuthController (deprecate kerak), MiniAppController, PrinterConfigController(s) × 2, ...

**Dead/yarim ulangan:**

- `PosWmsSyncService` event listener — `PosMovementCompletedEvent` hech qachon nashr qilinmaydi (faqat string topic `pos.movement.data.completed` emitlanadi, CQRS listener ushlamaydi). Natija: eski POS movement'ni completed qilsangiz `warehouse_stock` YANGILANMAYDI.
- `PosGlAutoListener` — xuddi shu sababdan dead. `gl_posting_log` auto-yozilmaydi.
- `pos_movements.ai_gl_status` ustun — defaultda 'PENDING', hech qachon yangilanmaydi.

**Cron jobs (5 ta, ishlaydi):**

| Job | Jadval | Vazifa |
|---|---|---|
| StockLedgerService.evaluateStockAlerts | hourly | `pos_stock_ledger` da kam qoldiq alerti |
| PosLowStockJob.checkLowStock | hourly | `PosFifoService` orqali alert + Telegram (ikkalasi paralel — duplicate xavfi) |
| PosQuarantineCheckJob | hourly | 48 soatdan o'tgan qarantine → qc_review |
| PosFifoRecalculateJob | 02:00 daily | Muddati o'tgan partiyalar |
| PosInactiveMaterialsJob | Sun 22:00 | 90 kun ishlatilmagan material |

### 2.3 ERP ichidagi POS sahifa (`/wms/pos-monitor`)

`WarehouseRoutes.tsx` da `['/wms/pos-monitor', PosMonitorPage]` — bitta route bilan POS Monitor ERP sidebar'idan ham ochiladi (ombor xodimi planshet kabi ishlatadi).

---

## 3. OMBOR — HOZIRGI HOLAT

### 3.1 Frontend — TOZA YANGI sahifalar (`/wms/*`)

**Holat: ISHLAYDI, toza, EP/ui + tLabel + semantic token bo'yicha.**

| Route | Sahifa | BE endpoint | Vazifa |
|---|---|---|---|
| `/wms/overview` | `WarehouseDashboardPage` | `GET /api/pos/warehouse-config/dashboard` | Moliya rahbari nazorati — KPI + qiymat + kam qoldiq + so'nggi harakatlar |
| `/wms/warehouses` | `WarehousesPage` | `GET /api/pos/warehouse-config/types` | Tur-kartochkalar (raw_material, paper_rolls, …) — yangi tur qo'shilsa UI o'zi ko'rsatadi |
| `/wms/warehouses/:type` | `WarehouseTypePage` | `…/warehouses?type=…` | Tur ichidagi omborlar |
| `/wms/warehouse-stock/:id` | `WarehouseStockPage` | `…/warehouses/:id/stock` | Bitta ombor qoldig'i (VIEW-ONLY) |
| `/wms/procurement` | `ProcurementPage` | `GET/POST /api/pos/procurement/requests` | P2P xarid zanjiri (yangi toza) |
| `/wms/pos-monitor` | `PosMonitorPage` | `pos/operations/*` | POS Monitor ERP ichida |
| `/wms/inventory` | `InventoryCount` | `/api/warehouse/inventory-counts` | (ishlaydi, generic count) |
| `/wms/material-balance` | `MaterialBalance` | `/api/material-balance/*` | (eski lekin ishlaydi) |
| `/wms/audit-log` | `WarehouseAuditLog` | `/api/wms/audit-log` | (ishlaydi) |

### 3.2 Frontend — ESKI RASVO (hali ham mavjud, roadmap o'chirishni belgilagan)

**Ko'p sahifalar — roadmap Faza A.4 da o'chirish belgilangan, lekin amalga oshmagan.**

Konkret rasvo / stub / takror sahifalar (WarehouseRoutes.tsx hali register qiladi):
`WMSDashboard`, `MMExtended` (4 alohida tab), `WmsAnalytics`, `WMSMaterials`,
`MaterialBalance` (eski), `BarcodeWarehouse`, `WarehouseReports`, `WarehouseDirectory`,
`WarehouseIntegrations`, ko'p `WarehouseRental*` fayllar. Audit ularni "stub yoki dublikat" deb belgilagan.

### 3.3 Backend (`apps/api/src/modules/wms/` + `pos/` + `compatibility/`)

**Holat: ko'p qatlamli — yangi toza + eski legacy + dead-letter.**

| Modul | Controllerlar | Ishlaydigan asosiy |
|---|---|---|
| `pos/presentation/warehouse-config.controller.ts` ⭐ | `pos/warehouse-config` (GET-only) | types/warehouses/stock/dashboard/movements — toza, yangi |
| `pos/presentation/pos-operations.controller.ts` ⭐ | `pos/operations` | issue/receive/p2p (POS Monitor amaliyot) |
| `wms/presentation/` — 22 ta controller | `wms/*`, `warehouse/*`, `inventory/*`, `iot*` | Aralash: ba'zilari ishlaydi, ko'pi takror/stub |
| `compatibility/` — 3 ta warehouse controller | `warehouse-barcode-ops`, `warehouse-catalog`, `warehouse-label` | Legacy compat |
| Dead-letter | `PosWmsSyncService`, `PosGlAutoListener` | Hech qachon ishga tushmaydi |

**Asosiy muammo:** 7 ta WMS controller `@Controller('warehouse')` bilan bare prefix — route to'qnashuv xavfi (audit'da P2 belgilangan).

### 3.4 Stok manbalari — 3 ta parallel jadval (audit P0-P1)

| Jadval | Yozuvchisi | O'qiluvchisi | Holat |
|---|---|---|---|
| **`warehouse_stock`** ⭐ | `WarehouseConfigService` (POS operations, P2P qabul) | `/wms/overview`, `/wms/warehouse-stock`, `WarehouseStockPage` | Canonical, toza — POS Monitor + ERP ko'rish |
| `pos_stock_ledger` (append-only) | Eski `StockLedgerService` (eski `MovementsController` movements completed bo'lganda) | StockController kun davomida | Legacy, yangi pos/operations bunga YOZMAYDI |
| `current_stock` (live aggregate) | Eski POS `_processCompletedMovement` | StockController | Legacy, takrorlanish |
| `material_cards.current_stock` (global, warehouse'siz) | `WarehouseConfigService` + ROP trigger + ba'zi eski oqimlar | RopTriggerHandler (canonical) | Reorder point uchun |
| `stocks` (FEFO/lot, WMS) | `DrizzleWmsRepository` (FEFO reserve/issue) | WMS goods-issue handler | Faqat WMS module ichida |

**Natija:** `warehouse_stock` (yangi POS oqim) va `pos_stock_ledger`/`current_stock` (eski POS oqim) ham parallel ishlaydi — qaysi sahifa qaysi oqimni ishlatishi tasodifiy. Bitta material qoldig'i `/api/pos/stock` va `/api/pos/operations/warehouses/:id/stock` da farqlanishi mumkin.

---

## 4. POS ↔ OMBOR BOG'LANISH

### 4.1 ✅ Mavjud va ishlaydigan bog'lanish (yangi canonical oqim)

```
POS Monitor (PosMonitorPage / pos-monitor SPA)
   ↓ posOperationsApi.issue(warehouseId, {materialId, quantity, reason})
   ↓
POST /api/pos/operations/warehouses/:id/issue
   ↓
WarehouseConfigService.issueStock (atomik DB):
   1. UPDATE warehouse_stock SET quantity = quantity - qty,
                                  available_quantity = available_quantity - qty
      WHERE warehouse_id = $id AND material_id = $mid
        AND available_quantity >= $qty
      RETURNING quantity, available_quantity;
   2. UPDATE material_cards SET current_stock = GREATEST(0, current_stock - qty);
   3. INSERT INTO material_movements (material_id, movement_type='ISSUE', quantity, performed_by, ...);
   4. Logger.log('[WMS] Ombor #X chiqim …')
   ↓
Return { warehouseId, materialId, issued, newQuantity, newAvailable, movementId }
   ↓
PosMonitorPage UI yangilanadi (toast + jadval refresh)
```

Kirim (receive) bir xil pattern — upsert.

**P2P qabul** (§7.7) ham ishlaydi:
- `ProcurementRequestService.receiveProcurement` → chek qabul + advance settled + per-qator `warehouse_stock` prixod + `material_cards` yangilash + `material_movements` 'RECEIVE'.
- Material kartochka avtomatik yaratiladi (`AUTO-P{requestId}-I{itemId}` kod bilan) — agar mavjud bo'lmasa.

### 4.2 ⚠️ Yarim ulangan / parallel bog'lanish (audit topgan)

- **Eski POS `MovementsController` movements** completed bo'lganda `pos_stock_ledger`
  va `current_stock` ga yozadi, lekin `warehouse_stock` ga YO'Q. Bu eski sahifalar
  ishlatadi (PosMovements, ba'zi inventory count).
- **`PosWmsSyncService.onMovementCompleted`** event listener `warehouse_stock` ga
  yozish uchun yozilgan, lekin event nashr qilinmagani uchun ishlamaydi.
- **`PosWmsSyncService.onMovementCreated`** (created event) hatto `transaction_type='kirim'`
  qattiq kodlangan holda `warehouse_transactions` ga draft yozadi — chiqim/transfer bo'lsa
  ham. Audit P0-2 belgilagan: tarix jurnali noto'g'ri.

### 4.3 ❌ Hali yo'q yoki vizyondan farq qilgan qismlar

- **Karantin status** (§3.10) — qabul → KARANTIN → QC → asosiy ombor ketma-ketligi yo'q. Hozirgi P2P qabul to'g'ridan asosiy omborga prixod qiladi (QC siz).
- **QC 3-qaror** (qabul/rework/rad) UI va oqim yo'q.
- **5-bosqichli EXTERNAL_IN** (DRAFT → KARANTIN → QC → OMBOR_MENEJER → AI_GL) — faqat 1-bosqich bor.
- **`gl_posting_log`** auto-yozish dead (gl_account_mappings BO'SH, listener dead).
- **`min_stock_alerts`** jadvali bor — yozuvchisi YO'Q. UI to'g'ridan `material_cards` ni o'qiydi.
- **PDF akt** generatsiyasi yo'q.
- **Cycle count** (kunlik) — kodi bor, to'liq oqim emas.
- **Bo'lim ombori transfer + AI norma** yo'q.

---

## 5. TAQQOSLA — TALAB vs HOZIRGI (xulosa jadvali)

| # | Vizyon talabi (master-plan) | Holat | Izoh |
|---|---|---|---|
| §1.2 | POS Monitor ERP SSO (alohida login YO'Q) | ✅ | PosMonitorApp `useAuth()`; legacy login redirect |
| §1.3 | Yagona responsive frontend | ✅ | PosMonitorPage + Telegram WebApp ulanish |
| §1.5 | Offline sync (IndexedDB) | ⚠️ | Hook bor, sync endpointlar yarim |
| §1.9 | 30+ terminal — FOR UPDATE + SEQUENCE | ⚠️ | Yangi pos/operations atomik (RETURNING bilan), eski oqim TX-siz |
| §1.10 | Config-driven (warehouse_types, akt turlari, ...) | ✅⚠️ | warehouse_types 9 tur ishlaydi; akt turlari, notif config yo'q |
| §1.12 | ADD-ONLY schema, additive | ⚠️ | Hozirgacha hurmat qilingan, lekin eski jadvalla parallel turibdi |
| §3 | 9 ombor turi config jadval | ✅ | `warehouse_types` (9 qator) jonli |
| §4 | Harakat turlari (5-bosqich EXTERNAL_IN, ...) | ❌ | Faqat to'g'ridan prixod. Karantin/QC bosqichlari yo'q |
| §5 | QC 3-qaror (qabul/rework/rad) | ❌ | Oqim yo'q |
| §6 | Barcode/QR avto-generatsiya + ZPL/EPL | ⚠️ | Scan ishlaydi, AUTO-generatsiya P2P qabulda "AUTO-PX-IX" kod, etiket print yo'q |
| §6.5 | Skan 2 usul (USB + kamera) | ✅ | useHardwareScanner (HID/Serial/wedge) + PosBarcodeScanner (BarcodeDetector) |
| §6.6 | Material topilmasa: toast + qo'lda + yangi kartochka + admin Telegram | ⚠️ | Toast + manual qidirish + new kartochka bor; admin Telegram emas |
| §7 | P2P xarid zanjiri | ✅ | ProcurementRequestService + approval chain jonli |
| §7.7 | Chek tasdiqlangach ombor prixod | ✅ | enterWarehouseStock — har qator atomik prixod |
| §7.10 | Kassa = naqd nazorati (har xarid ombordan o'tadi) | ⚠️ | P2P qabulda ombor + podotchet bor; alohida kassa modul yo'q |
| §9 | FIFO tannarx, ko'p valyuta, real-time stok | ⚠️ | Stok real-time (yangi yo'l); FIFO faqat eski FifoService da; valyuta UI yo'q |
| §9.4 | Minus saldo BLOK | ✅ | `available_quantity >= qty` shart bilan |
| §9.6 | Auto-GL (Debit/Credit AI tavsiya) | ❌ | gl_account_mappings BO'SH; listener dead |
| §10 | Mening inventarim (podotchet) | ⚠️ | Sahifa bor (PosMyInventory), ledger oqimi to'liq emas |
| §11 | Inventarizatsiya (davriy + kunlik) | ⚠️ | 3 parallel count tizimi (POS / WMS / generic) — konsolidatsiya kerak |
| §12 | PDF hujjat/akt | ❌ | Yo'q |
| §13 | Bildirishnoma config-driven | ⚠️ | Kam qoldiq cron + Telegram bor; config jadval yo'q |
| §14 | Hisobot + Moliya dashboard | ✅ | `/wms/overview` jonli — KPI + qiymat + low-stock |
| §15.1 | ERP modullari bilan real-time | ⚠️ | MM/FI/HR/QC integratsiya qisman; MES yo'q |
| §15.2 | Telegram Mini App = web bilan teng | ⚠️ | Bor (`pos/mini-app`), to'liq emas |
| §17 | Bajarilgan (DONE) | ✅ | warehouse_types, P2P core, approval chain |

**Vizyon yadrosi (POS↔Ombor bog'lanish) — ISHLAYDI 🟢** (yangi pos/operations
oqimi). Lekin eski parallel oqim hali ham mavjud → 3 stok jadvali, nomuvofiqlik
xavfi. Roadmap Faza A.2-A.4 (eski tozalash) bajarilmagan.

---

## 6. ASOSIY TOPILMALAR — PRIORITY (P0/P1/P2)

### 6.1 🔴 P0 — vizyon yadrosiga to'g'ridan-to'g'ri ta'sir

**P0-1. Bitta stok manbai (single source of truth) yo'q — 3 parallel jadval.**
Yangi `warehouse_stock` (POS operations) va eski `pos_stock_ledger` + `current_stock`
(legacy MovementsController) parallel yoziladi. Eski sahifalar (PosMovements,
PosLedger, ba'zi count) eski jadvalni o'qiydi, yangi sahifalar yangisini. Bitta
material uchun ikki xil qoldiq ko'rinishi mumkin.

**Tavsiya:** `warehouse_stock` ni yagona qiling. Eski `MovementsController` oqimini
deprecate qiling (yoki uni `WarehouseConfigService` ga yo'naltiring). `pos_stock_ledger`
ni audit log sifatida saqlang (yozish to'xtatilgan holatda) — keyin migrate qiling.

**P0-2. Material jadvali konsolidatsiyasi (MASTER_DATA_AUDIT #3).**
4 ta material jadvali: `material_cards` (canonical), `raw_materials` (legacy procurement),
`mm_materials` (uchinchi), `materials`. 3 xil "material yaratish" 3 xil jadvalga yozadi.
`MaterialCardsPage` POST 404 buzuq.

**Tavsiya:** `material_cards` ni yagona qiling. `MaterialCardsPage` POST endpoint'ini
tuzating. `raw_materials`/`mm_materials` ni `material_cards` ga sinxron qiling yoki
ko'chiring.

**P0-3. Eski POS movement oqimi `warehouse_stock` ga yozmaydi.**
Eski `MovementsController` movements completed bo'lganda `pos_stock_ledger` va
`current_stock` ni yangilaydi, ammo `warehouse_stock` (yangi ombor jadvalini) emas.
Roadmap Faza A.2 da o'chirish belgilangan.

**Tavsiya:** Eski PosMovements/PosMovementKirim/PosMovementChiqim sahifalarini yangi
`pos/operations` ga ko'chiring yoki o'chiring (Faza A.2).

### 6.2 🟠 P1 — muhim, lekin yadro ishlaydi

**P1-1. Eski rasvo WMS sahifalar (Faza A.4 bajarilmagan).** WMSDashboard, MMExtended (4 tab),
WmsAnalytics, BarcodeWarehouse, WarehouseReports — roadmap o'chirishni belgilagan, lekin
hali register. Foydalanuvchini chalg'itadi.

**P1-2. `PosMovementService.createMovement` transaksiyasiz** (insertMovement va
addLines ikki alohida statement). Header without lines xavfi (eski oqim).

**P1-3. WMS `reserveMaterial`/`issueGoods` FEFO loop transaksiyasiz**
(`drizzle-wms.repo.ts`). `withTransaction` helper bor — ishlatilmagan.

**P1-4. Karantin status oqimi yo'q (§3.10).** Hozirgi P2P qabul to'g'ridan asosiy
omborga prixod qiladi — QC siz, karantin holatisiz. Vizyon: KARANTIN → QC → asosiy.

**P1-5. Dead-letter event listenerlar.** `PosWmsSyncService`, `PosGlAutoListener` —
event hech qachon nashr qilinmaydi. Eski jadvallar bilan birga o'chirish (yoki ulashni
to'g'rilash) kerak.

**P1-6. 23 ta POS controller + 22 ta WMS controller.** Ko'pi takror/legacy/stub.
7 ta WMS controller `warehouse` bare prefix — route to'qnashuv xavfi.

**P1-7. `min_stock_alerts` jadval yozuvchisi yo'q.** UI to'g'ridan `material_cards` ni
o'qiydi. Yoki ROP triggerga ulang, yoki jadvalni o'chiring.

### 6.3 🟡 P2 — vaqt o'tib qilish kerak

**P2-1. Auto-GL pipeline ishlamaydi.** `gl_account_mappings` BO'SH; listener dead.
Faza I — moliya bilan schyot mapping seed → keyin event ulash.

**P2-2. PDF akt generatsiya yo'q** (Faza D).

**P2-3. 3 parallel inventory-count tizimi** (POS / WMS / generic) — konsolidatsiya kerak (Faza E).

**P2-4. Notifikatsiya markazi config-driven emas** (Faza F).

**P2-5. Material 360 sahifa bor lekin to'liq emas** (Faza G).

**P2-6. Bo'lim ombori + AI norma yo'q** (Faza J).

**P2-7. Telegram Mini App to'liq emas, offline sync yarim.**

**P2-8. POS auth `/pos/auth` controller hali ham bor** — alohida login YO'Q deyilgan,
endpoint deprecate qilinmagan.

---

## 7. TAVSIYA — IJRO TARTIBI (ustuvorlik bilan)

### Birinchi qadam — ROADMAP Faza A ni tugallash (2-3 hafta)

1. **A.1 ✅ DONE** — POS Monitor ERP SSO (bajarilgan).
2. **A.2 — eski POS sahifalarni yangi `pos/operations` ga ko'chirish.**
   PosMovements/PosMovementKirim/PosMovementChiqim/PosInventory/PosLedger sahifalarini
   `posOperationsApi` ga o'tkazing (eski `pos-monitor.api.ts` ni `apiRequest` orqali yo'naltiring).
3. **A.3 — toza sidebar (tz08).** Eski WMS sahifalarini sidebar'dan olib tashlang.
4. **A.4 — o'lik WMS sahifalar (WMSDashboard, MMExtended-tabs, WmsAnalytics, ...) ni o'chiring.**
   Roadmap belgilagan sahifalar ro'yxati bor.
5. **A.5 — Bitta stok jadval qaror.** `warehouse_stock` ni canonical qiling.
   `pos_stock_ledger` ni faqat audit log sifatida saqlang, yozishni to'xtating.
   Reconciliation cron joriy qiling (bir martalik backfill kerak).
6. **A.6 — Material konsolidatsiyasi.** `material_cards` ni yagona qiling.
   `MaterialCardsPage` POST endpoint'ini tuzating.

### Ikkinchi qadam — Faza B (Barcode/Etiket — 1 hafta)

- EAN-13 + Code-128 + QR avto-generatsiya (qisman bor, to'liq emas).
- ZPL/EPL termal printer (Zebra/TSC) — etiket shabloni config-driven.
- Tur-maxsus shablon (rulon kg/o'lcham, oddiy material, tayyor mahsulot).

### Uchinchi qadam — Faza C (Karantin → QC oqimi — 1-2 hafta)

- Yangi qabul → `status='quarantine'` (status sifatida, alohida ombor emas, §3.10).
- QC 3-qaror UI (qabul → asosiy ombor; rework → MES; rad → ta'minotchi/brak).
- 48 soat avto o'tish (cron allaqachon bor).

### To'rtinchi qadam — Faza D (PDF akt — 1 hafta)

- Kirim akti + chiqim akti + hisob-faktura PDF servisi.
- Raqamlash: Ombor + Tur + Yil + ketma-ket.

### Keyingi qadamlar — E, F, G, H, I, J, K (roadmap bo'yicha)

---

## 8. CHEKLOVLAR VA ESLATMA

- **Live endpoint test bajarilmadi:** sandbox Linux'dan localhost:3030 ga ulanish
  bloklangan. Tahlil to'liq kod inspektsiyasi + skema + master-plan/audit hujjatlari
  asosida. Egasi `:3030` da yangi `pos/operations/*` endpointlarini jonli sinov
  qilishi tavsiya etiladi (`curl 127.0.0.1:3030/api/pos/warehouse-config/types`,
  POST issue/receive).
- **Audit'lar 2026-05-27** (round 1+2) va MASTER_DATA_AUDIT 2026-05-31 — eng yangi
  manbalar. Roadmap 2026-05-30.
- **Hech bir kod o'zgartirilmadi** — bu hujjat read-only tahlil. Tuzatish bosqichi
  egasining tasdig'ini kutadi.
- Master-plan §16.2 qoidasi: "Yarim ish YO'Q. Aniq reja → to'liq bajarish → BE/FE tsc
  0 → jonli test → alohida commit." Har faza alohida tasdiq bilan boshlanishi kerak.

---

*Tahlil 2026-06-01 da kod + 7 ta MD/Q&A hujjat asosida tayyorlandi. Ground-truth:
har topilma kod faylida tasdiqlandi. Endi egasi qaysi P0/P1 dan boshlashni belgilashi
kerak.*
