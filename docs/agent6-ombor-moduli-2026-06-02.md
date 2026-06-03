# AGENT6 — OMBOR MODULI CHUQUR TAHLIL (2026-06-02)

> **FAQAT TAHLIL — read-only.** Hech narsa o'zgartirilmadi/yaratilmadi (faqat shu hisobot).
> Har da'vo: **kod (fayl:satr) + jonli DB `europrint`@:5432 (`count(*)`) + grep** bilan tasdiqlandi.
> Manba: mavjud 9 ta docs hisoboti (ombor-jadvallari/ombor-dizayn-dublikat/asl-holat/POS_OMBOR/master-plan) **o'qib KENGAYTIRILDI** — qaytarilmadi.
> Vizyon o'lchovi: `docs/ombor-pos-master-plan.md` §0–§17 (74+ savol intervyu).

---

## 0. QISQA HUKM (egasi uchun)

Ombor moduli — **EuroPrint'ning eng kuchli, eng to'liq moduli**. Vizyonning yadrosi (POS↔Ombor atomik bog'lanish, config-driven 9 ombor turi, EXTERNAL_IN 5-bosqich pipeline, P2P) **KOD darajasida QURILGAN va WIRED**. Lekin:
- **Jonli DB deyarli bo'sh** (qurilish bosqichi): 24 stok qator / 21 material / 2 harakat / 3 material_movement / 0 reservation — ya'ni **pipeline yozilgan, lekin oxirigacha bir marta ham ishlatilmagan** (2 ta EXTERNAL_IN `pending` da qotib qolgan).
- **3 avlod UI yonma-yon** (yangi `/wms/*` toza + eski WMS + eski POS SPA) → **94 sahifa fayli, ~33 distinct route** — dublikatga to'la.
- **Ba'zi joylar STUB/SOXTA** (WMS `createStock()` → `{success:true}`; reservation = repo bor lekin endpoint yo'q; parent-bola barcode = DB ustun bor lekin kod yo'q; per-rulon kg = config flag bor lekin kod yo'q).

**Umumiy: Ombor vizyonga ~62-65% (kod), lekin "to'liq oxirigacha ishlatilgan" (end-to-end live) ~25%.**

---

## 1. DB — OMBOR JADVALLARI (jonli `count(*)`, 2026-06-02)

### 1.1 Ombor turlari va omborlar — **DUBLIKAT bor (taksonomiya bo'lingan)**

| Jadval | Qator | Izoh |
|---|---|---|
| `warehouse_types` (config) | **9** | code: raw_material, paper_rolls, household_mro, finished_goods, production, defective, waste_paper, tools_equipment, department_warehouse |
| `warehouses` (jonli) | **12** | quyida — **type qiymatlari config bilan MOS EMAS!** |

**⚠️ KASHFIYOT — `warehouses.type` ≠ `warehouse_types.code` (taksonomiya dublikat/bo'lingan):**

`warehouses` jadvalidagi 12 ombor (DB'dan):
```
id=1  WH-MAIN          type=MAIN              ← warehouse_types da YO'Q (legacy)
id=4  WH-PROD-OFFSET   type=PRODUCTION_OFFSET ← warehouse_types da YO'Q
id=5  WH-PROD-FLEXO    type=PRODUCTION_FLEXO  ← warehouse_types da YO'Q
id=11 RM-MAIN          type=raw_material      ✅ mos
id=12 RM-ROLLS         type=raw_material      ⚠️ paper_rolls bo'lishi kerak edi (config'da alohida tur bor!)
id=13 FG-MAIN          type=finished_goods    ✅ mos
id=14 WIP-MAIN         type=wip               ← warehouse_types da YO'Q (production bo'lishi kerak)
id=15 SCRAP-MAIN       type=scrap             ← warehouse_types da YO'Q (defective/waste_paper)
id=16 QC-HOLD          type=quarantine        ← karantin = OMBOR sifatida! (master-plan §3.10 "karantin = HOLAT, alohida ombor EMAS" ga ZID)
id=17 TOOL-MAIN        type=tools             ← config'da tools_equipment
id=18 MRO-MAIN         type=household         ← config'da household_mro
id=19 MRO-STORE        type=mro               ← warehouse_types da YO'Q
```

**Xulosa:** 12 ombordan faqat **3 tasi** (RM-MAIN, FG-MAIN, va qisman) config `code` bilan to'liq mos. Qolgan 9 tasi **eski legacy `type`** (MAIN/PRODUCTION_*/wip/scrap/quarantine/tools/household/mro) ishlatadi → **config-driven UI (`warehouse-config.service.listTypes`) bu omborlarni topa olmaydi** (chunki `WHERE w.type = wt.code` JOIN bo'sh qaytaradi ko'p tur uchun). Bu — vizyon §3.0 "yangi tur = 1 qator" config-driven g'oyasiga qisman zid: **eski va yangi taksonomiya aralash**.
- Tasdiq: `warehouse-config.service.ts:31` — `(SELECT COUNT(*) FROM warehouses w WHERE w.type = wt.code AND w.is_active) AS warehouseCount`. PosMonitorPage faqat `warehouseCount > 0` turlarni ko'rsatadi (`PosMonitorPage.tsx:534`) → eski-type omborlar POS Monitor tablarida **ko'rinmaydi**.
- ⚠️ `QC-HOLD` ombori jadval sifatida bor (id=16), lekin master-plan §3.10 karantinni **alohida ombor emas, HOLAT** deydi. quarantine-workflow esa stokни shu QC-HOLD omborga jismonan ko'chiradi (`quarantine-workflow.service.ts:51`) — ya'ni implementatsiya vizyondan biroz farq qiladi (ombor sifatida ishlaydi).

### 1.2 Stok / material / harakat — jonli qatorlar

| Jadval | Qator | Holat |
|---|---|---|
| **warehouse_stock** (CANONICAL) | **24** | 6 ombor stokli (id 1/4/5/9/12/16); 12 ombordan faqat 6 tasida stok |
| material_cards (CANONICAL material) | **21** | asosiy lug'at |
| **materials** (mm/materials POST yozadigan jadval) | **0** | ⚠️ **material yaratish boshqa jadvalga yozadi** (quyida 5-bo'lim) |
| mm_materials | VIEW→materials | 0 |
| batch_lots (lot/FEFO) | **21** | jonli |
| pos_movements | **2** | ikkalasi `EXTERNAL_IN` + `status='pending'` (oxirigacha bormagan!) |
| pos_movement_lines | 2 | |
| material_movements (issue/receive jurnal) | **3** | 1 ISSUE (×3) + 1 RECEIVE (×5) + 1 INTERNAL_ISSUE (×100) |
| inventory_counts | **6** | 2 completed + 2 in_progress + 1 draft + 1 (real ishlatilgan!) |
| inventory_count_lines | **0** | sanoq satrlari bo'sh |
| **stock_reservations** (bron) | **0** | repo bor, endpoint YO'Q (quyida) |
| stock_ledger | **0** | canonical-bo'sh |
| stock_transfers / lines | 5 / 7 | jonli (ombor-aro ko'chirish) |
| goods_receipts (GRN) | **0** | |
| warehouse_bins | **126** | eng ko'p data (joy/bin) |
| warehouse_zones | 9 | |
| warehouse_employees | **9** | jonli (ombor↔xodim biriktirish) |
| material_barcodes | **0** | `parent_barcode_id` ustuni BOR, lekin 0 qator + parent kodi YO'Q |

**Asosiy stok manbai:** `warehouse_stock` per-ombor stok:
```
ombor 1:  9 qator, qty 8725
ombor 4:  6 qator, qty 1425
ombor 5:  6 qator, qty 11480
ombor 9:  1 qator, qty 100
ombor 12: 1 qator, qty 15125
ombor 16: 1 qator, qty 10   (QC-HOLD — karantinda turgan material)
```
**reserved_quantity hammasida 0** → hech qachon bron ishlatilmagan.

---

## 2. POS MONITOR — kirim/chiqim (ISHLAYDI ✅, yadro)

### 2.1 PosMonitorPage tugmalari (Material / Kirim / Chiqim) — **SQL xato YO'Q, ishonchli**

`artifacts/erp-dashboard/src/pages/PosMonitorPage.tsx` (893 satr) — **toza, professional, tLabel + EP/ui**:
- **Tablar = ombor turlari** (`warehouseApi.types()`, faqat `warehouseCount>0`) → ombor dropdown → **Excel-stil qoldiq jadval** (Material/Jami/Mavjud/Bir./Yangilangan/[Kirim][Chiqim] tugma).
- **[Kirim] tugma** (`PosMonitorPage.tsx:383`) → `IssueDialog mode=receive` → `posOperationsApi.receive(warehouseId, {materialId, quantity, reason})` → `POST /api/pos/operations/warehouses/:id/receive`.
- **[Chiqim] tugma** (`:388`) → `mode=issue` → `posOperationsApi.issue(...)` → `POST .../issue`. `disabled={row.available<=0}` (minus saldo bloki UI'da ham).
- **Barcode qidirish** (`:583` handleBarcodeScan): topsa avto **Chiqim dialog** ochadi; topmasa toast. USB/wedge skaner (`useHardwareScanner`) + kamera (`PosBarcodeScanner`, BarcodeDetector/ZXing).
- **P2P Qabul bo'limi** (`P2PSection`): `pos/operations/p2p/pending` → [Qabul] → chek raqami/summa dialog → `POST p2p/:id/receive`.

**⚠️ MUHIM nuans — "Yangi Material" tugmasi YO'Q:**
- PosMonitorPage'da **faqat MAVJUD stok qatorlariga** Kirim/Chiqim qilinadi. Omborda hali yo'q materialni **bu sahifadan qo'sha olmaysiz** (yangi material kartochka yaratish UI yo'q).
- `receiveStock` (BE) upsert qiladi (yangi qator yarata oladi), lekin u **mavjud material_cards.id** talab qiladi (`warehouse-config.service.ts:159` — material topilmasa 404). Ya'ni yangi material avval `material_cards`'da bo'lishi kerak.
- Yangi material kartochka **faqat 2 yo'l bilan**: (a) `mm/materials` POST (lekin u `materials` jadvalga yozadi, `material_cards`'ga EMAS — 5-bo'lim), (b) P2P qabulда avto-yaratish (`AUTO-P{req}-I{item}` kod bilan, `material_cards`'ga). → **"Yangi material" oqimi PosMonitor'da yo'qoladi/uzilgan.**

### 2.2 Backend canonical oqim (issue/receive) — **REAL + ATOMIK ✅**

`apps/api/src/modules/pos/application/services/warehouse-config.service.ts` + `presentation/pos-operations.controller.ts` (ikkalasi `pos.module.ts:64,85` da WIRED):

| Endpoint | Yozadi | Atomiklik |
|---|---|---|
| `POST /pos/operations/warehouses/:id/issue` | `warehouse_stock −qty` + `material_cards.current_stock` + `material_movements 'ISSUE'` | ✅ `UPDATE ... WHERE available_quantity >= qty RETURNING` — yetmasa 400 (`warehouse-config.service.ts:112-118`) |
| `POST .../receive` | `warehouse_stock +qty` (UPDATE→INSERT upsert) + `material_cards` + `material_movements 'RECEIVE'` | ✅ upsert (`:167-186`) |
| `GET .../warehouses/:id/stock` | (o'qish) `warehouse_stock`+`material_cards` JOIN | — |
| `GET .../materials/:id/movements` | (o'qish) `material_movements` so'nggi 50 | — |
| `POST .../p2p/:id/receive` | `ProcurementRequestService.receiveProcurement` | ✅ |

**Hukm 2.2:** issue/receive = **vizyon §9.4 (minus saldo blok) + §9.5 (real-time, batch yo'q) BAJARILGAN**. Jonli dalil: `material_movements` 3 qator (bu oqim orqali yozilgan). ⚠️ Kamchilik: oddiy `rawSql` ketma-ket statementlar — **bitta DB transaction'ga (BEGIN/COMMIT) o'ralmagan** (`warehouse-config.service.ts` — stock UPDATE, material_cards UPDATE, movement INSERT 3 alohida). 30+ terminal stress'ida (§1.9) qisman xavf (RETURNING atomik, lekin 3 jadval orasида atomiklik yo'q).

---

## 3. EXTERNAL_IN 5-bosqich pipeline (karantin→QC) — **QURILGAN+WIRED, lekin ISHLATILMAGAN ⚠️**

Vizyon §4.1: `DRAFT → KARANTIN → QC → OMBOR_MENEJER → AI_GL`. Holat:

### 3.1 Quarantine workflow — **REAL state-machine ✅**
`quarantine-workflow.service.ts` (145 satr) + `warehouse-features.controller.ts` (`/api/pos/wh-features/*`, `pos.module.ts:84` WIRED):
- `STATUS_FLOW` to'liq tranzitsiya jadvali (`:15-24`): draft→pending→karantin→qc_review→approved→completed.
- `POST movement/:id/move-to-quarantine` → status `karantin` + stokни **QC-HOLD omborga** ko'chiradi (`:51 upsertWarehouseStock`).
- `POST movement/:id/qc-decision` body `{QABUL|REWORK|CHIQARISH}`:
  - **QABUL** → stok `QC-HOLD → RM-MAIN` ko'chiriladi (`:108-110` reduce QC-HOLD + upsert RM-MAIN), passport yangilanadi.
  - **REWORK** → approved (MES'ga).
  - **CHIQARISH** (RAD) → QC-HOLD'dan stok qaytariladi (`:121-123`).
- Cron: `pos-quarantine-check.job.ts` — 48 soatdan o'tgan karantin → avto `qc_review`.

### 3.2 Auto-barcode (Code-128) — **REAL ✅**
`auto-barcode.service.ts`: EXTERNAL_IN yaratilganda har qatorga `{KOD}-{YYYYMMDD}-{RND6}` barcode → `pos_barcode_print_queue`. `POST wh-features/movement/:id/auto-barcode` WIRED (`:105`).

### 3.3 Auto-GL + 3-way-match + GRN + Material 360 — **HAMMASI WIRED**
`warehouse-features.controller.ts`:
- `POST movement/:id/gl-post` + `GET gl/journal` (AutoGlPostingService).
- `POST three-way-match` + `/auto` (chek+so'rov+kirim solishtiruv, §7.6).
- `GET/POST grn` + `/approve` (GoodsReceiptService — qabul akti).
- `GET material/:id/profile` (Material360Service — §14.2 inventar 360).

### 3.4 MovementsController (`/pos/movements`) — to'liq route, lekin parallel
`movements.controller.ts` (`pos.module.ts:68` WIRED): list/detail/create/`PATCH :id/status`/`POST qc-decision`/`POST damage`/**`GET :id/pdf`**/`:id/confirmations`/`:id/history`. Writer `pos-movement.repository.ts` — faqat `posMovements`+`posMovementLines` yozadi (warehouse_stock'ga TO'G'RIDAN yozmaydi; stok harakati status-workflow orqali).

### 3.5 ❌ NEGA "ishlatilmagan" — jonli dalil
- `pos_movements` = **2 qator, IKKALASI `status='pending'`** (id=1→ombor 12, id=2→ombor 16). Hech biri karantin→QC→completed zanjirini bosib o'tmagan.
- `goods_receipts=0`, `material_barcodes=0` (auto-barcode hech ishlatilmagan), `inventory_count_lines=0`.
- Ya'ni: **5-bosqich pipeline KOD'da to'liq + endpointlar WIRED, lekin jonli oqim oxirigacha bir marta ham haydalmagan** → "qog'ozda bor, hayotda yo'q".

**Hukm 3:** EXTERNAL_IN 5-bosqich, QC 3-qaror (§5.2), auto-barcode (§6.3), GRN, 3-way-match, auto-GL, Material 360 — **KOD bor + WIRED (≈ vizyonning 80%i implementatsiya qilingan)**, lekin **end-to-end live proof YO'Q** (pending'da qotgan). Bu ombor modulining eng kuchli, lekin eng kam ishlatilgan qismi.

---

## 4. PDF — harakat akti (REAL ✅, lekin tor)

`pos-pdf.service.ts` (`generateMovementAct`) — **`pdf-lib` ishlatadi** (haqiqiy PDF, stub EMAS): movement header + lines + creator + imzo + rekvizit (`:11 import {PDFDocument...} from 'pdf-lib'`). `GET /pos/movements/:id/pdf` (`movements.controller.ts:128`) va `inventory-count.controller.ts` PDF chiqaradi.

**❌ Vizyon §12 to'liq emas:**
- §12.1 **hisob-faktura (chiqimda alohida PDF)** — `generateMovementAct` faqat harakat akti; faktura alohida PDF YO'Q (asl-holat: "PDF akt YO'Q" da'vosi qisman noto'g'ri — harakat akti bor, faktura yo'q).
- §12.3 **akt turlari config-driven** (inventarizatsiya dalolatnoma, brak komissiya, asbob berish/qaytarish, utilizatsiya) — yo'q.
- §12.4 raqamlash `RM-KIRIM-2026-00001` shaklida — movement_number `POS-2026-00001` (ombor+tur prefiksi yo'q).

---

## 5. MATERIAL yaratish — **BO'LINISH (split) ❌**

| "Yangi material" yo'li | Endpoint | Yozadigan jadval | Qator |
|---|---|---|---|
| MM modul | `POST /mm/materials` (`mm-materials.controller.ts:114`) → `CreateMaterialCommand` → `MM_MATERIAL_REPO` (drizzle-material.repo) | **`materials`** | 0 |
| P2P qabul (avto) | `receiveProcurement` | **`material_cards`** | 21 |
| Compat/erp.repo | `erp.repository.ts` raw INSERT | **`material_cards`** | 21 |

- `mm_materials` = **VIEW→materials** (`information_schema`: table_type=VIEW), `materials` = BASE TABLE (0 qator).
- **Natija:** UI'dagi "material yaratish" (MM modul) `materials` (0)'ga yozadi, lekin **butun ombor oqimi `material_cards` (21)'ni o'qiydi** (warehouse-config, pos-operations, Material 360 — hammasi `material_cards`). → **yangi material yaratsangiz omborda KO'RINMAYDI** (boshqa jadval). Bu master-plan §1.12 "duplikat YO'Q" va MASTER_DATA_AUDIT #3 (material×4) bilan tasdiqlangan bo'linish.
- ✅ To'g'ri canonical = `material_cards`. `materials`/`mm_materials` = birlashtirish kerak (memory: test-only dublikat).

---

## 6. BARCODE ota-bola ierarxiya — **DB ustun bor, KOD YO'Q ❌**

- DB: `material_barcodes.parent_barcode_id` ustuni **MAVJUD** (information_schema tasdiq), lekin **0 qator**.
- Kod: `material_barcodes` faqat 2 faylda o'qiladi (`pos-barcode.repository.ts:64,95` + compat) — va **faqat `gtin`/`sscc`** ustunlari (GS1 kod qidirish). `parent_barcode_id` **hech qayerda o'qilmaydi/yozilmaydi** (grep: 0 match kod ichida).
- Vizyon §3.2 (rulon → ota rulon → bola bo'lak/qoldiq), §6.2 (tur-maxsus boy QR) — **implementatsiya YO'Q**. Per-rulon **kg/og'irlik** tracking: `warehouse_types.paper_rolls.unit_basis='weight'` config flag bor, lekin **pos kod'da rulon-kg, split, qoldiq-kg logikasi YO'Q** (grep `weight|roll_weight|kg` → faqat barcode/notification/email fayllarida noaloqador). 
- Qo'shimcha: RM-ROLLS ombori (id=12) `type=raw_material` (paper_rolls EMAS) → rulon ombori alohida tur sifatida ham ajratilmagan.

**Hukm 6:** Barcode SCAN (qidirish, EAN/Code-128/QR generatsiya) ishlaydi; **ota-bola ierarxiya + per-rulon kg/split — YO'Q-BUZUQ** (faqat skelet).

---

## 7. MATERIAL BRON (stock_reservations) — **REPO bor, ENDPOINT YO'Q ⚠️**

- `pos-stock-reservation.repository.ts` — to'liq CRUD (`createReservation`/`findById`/`cancelById`/`fulfillByMovementId`/`expireOldReservations`) ✅.
- `stock-reservation.service.ts` — `reserve()` (mavjud tekshirib bron), `cancel()`, `fulfill()`, `expireOldReservations()` ✅. Consumer: `PosMovementService` + `PosRequestService` (requisition workflow `reserveStock` chaqiradi).
- ❌ **HECH BIR controller `StockReservationService.reserve` ni HTTP endpoint qilib ochmaydi** (grep: faqat `pos-stub.controller.ts` da "reserve" so'zi — u ham reservation emas, false-positive). Ya'ni **bron faqat dasturiy ichki** (requisition oqimi ishlaganda), to'g'ridan UI tugmasi yo'q.
- ❌ Jonli: `stock_reservations=0`, `warehouse_stock.reserved_quantity` hammasida `0` → **bron hech qachon yaratilmagan**.
- ⚠️ Latent bug: `reserve()` `status:'active'` (kichik harf) yozadi (`stock-reservation.service.ts:71`), lekin `cancel()` `status !== 'ACTIVE'` (katta) tekshiradi (`:91`) — casing nomuvofiqligi (0 qator bo'lgani uchun hozir bilinmaydi).
- ⚠️ `getAvailableStock` `current_stock` **VIEW**'dan o'qiydi (`:26`), `warehouse_stock`'dan emas → bron va asosiy oqim **boshqa manba** (nomuvofiqlik xavfi).

FE: `StockReservation` sahifasi bor (`/wms/reservation`, `/warehouse/reservations`), lekin BE bron endpoint bo'lmagani uchun to'liq ishlamaydi (audit "PosReservations dublikat").

---

## 8. KARANTIN / QC OQIMI — **2 implementatsiya (REAL service + FE sahifa) ⚠️**

- BE: `quarantine-workflow.service.ts` (3-bo'limda) — to'liq REAL ✅ (`pos/wh-features/quarantine` + `move-to-quarantine` + `qc-decision`).
- FE: `WarehouseQuarantine.tsx` (`/wms/quarantine`) + `WarehouseQCReview.tsx` (`/wms/qc-review`) + POS SPA `PosQuarantine`/`PosQCReview` (dublikat). 
- Jonli: QC-HOLD ombori (id=16) da 1 material (10 dona) turibdi → karantinда **bitta material bor**, lekin movement'lar `pending` (qc_review'ga o'tmagan).
- ❌ Vizyon §5.1 "barcha EXTERNAL_IN avval karantinga" — **avtomatik EMAS** (P2P qabul to'g'ridan asosiy omborga prixod qiladi; karantin faqat alohida `move-to-quarantine` chaqirilsa). §5.3 mijoz qaytarishi (dalolatnoma) — yo'q.

**Hukm 8:** Karantin→QC **mexanizmi REAL va WIRED**, lekin (a) avtomatik trigger yo'q (qo'lda), (b) FE 4 xil sahifa (dublikat), (c) jonli oxirigacha haydalmagan.

---

## 9. INVENTARIZATSIYA (inventory_counts) — **REAL + ISHLATILGAN ✅ (eng jonli)**

- BE: `inventory-count.controller.ts` (`/pos/inventory-counts`, WIRED) — list/create/record-actual/bulk-record/approve + PDF. `PosInventoryCountService` real.
- Jonli: **`inventory_counts=6`** (2 completed, 2 in_progress, 1 draft + 1) — **haqiqatan ishlatilgan** (ombor 1/4/5/7/8). ⚠️ Lekin `inventory_count_lines=0` (sanoq satrlari kiritilmagan — sessiyalar ochilgan, satr yo'q).
- ⚠️ **"3 parallel" emas:** `pos_inventory_counts` + `wms_inventory_counts` = **VIEW→inventory_counts** (ombor-jadvallari hisoboti tasdiqladi). Bitta haqiqiy jadval. Birlashtirish KERAK EMAS.
- ❌ Vizyon §11.1 cycle-count (kunlik) kodi qisman, §11.3 FIFO so'rov navbati — yo'q.

---

## 10. WMS MODUL (`/wms/*`) — **ASOSAN STUB/STALE ⚠️**

`apps/api/src/modules/wms/presentation/` — 22+ controller, **STUB tig'iz**:
- `wms-stock.controller.ts:51` — `createStock() { return { success: true }; }` — **SOXTA javob (Rule 10 buzilgan)**, DB'ga yozmaydi.
- `wms-warehouses.controller.ts:146` — `return { items: [], total: 0 }` fallback.
- Stub hisobi (`{success:true}`/`{data:[]}`/`notImplemented`/TODO) — **20 ta, 7 controllerда**: wms-barcode (8), wms-integration (6), wms-stock/inventory/catalog×2/rental/iot-enhanced (qolgani).
- ✅ Ishlaydigan: `wms-stock` GET list (GetStockInventoryQuery), `getStock(:id)` (WmsCrudService), `fefo` query; `wms-warehouses` GET; `wms-counts`; `wms-eoq`; `rop`/safety-stock servislari (real hisob).

**Hukm 10:** WMS modul = **eski parallel qatlam** — ba'zi GET'lar real, lekin asosiy CREATE'lar stub. Yangi canonical = `pos/operations` + `pos/warehouse-config`. WMS modul **deprecate/konsolidatsiya nomzodi** (POS_OMBOR P1-6).

---

## 11. FRONTEND — 94 SAHIFA, ~33 ROUTE, DUBLIKATGA TO'LA ❌

`WarehouseRoutes.tsx` (93 satr) — **49 route entry → ~33 distinct komponent**. Dublikat (ombor-dizayn-dublikat hisoboti TASDIQLANDI + raqamlandi):

| Funksiya | URL dublikat | Komponent |
|---|---|---|
| `WarehouseReportsAll` | `/wms/reports` + `/wms/reports-all` (2 URL) | 1 |
| `GoodsReceiving` | `/warehouse/goods-receiving` + `/wms/grn` (2) | 1 |
| `StockReservation` | `/warehouse/reservations` + `/wms/reservation` (2) | 1 |
| `InventoryCount` | `/warehouse/inventory-count` + `/wms/inventory` (2) | 1 |
| `WMSMaterials` | `/inventory/materials` + `/inventory/materials/:id` (2) | 1 |
| `MMExtended` | `/mm/check-bot` + `/mm/creditor-debts` + `/mm/supplier-portal` (3) | 1 |
| `LogisticsDashboard` | `/logistics` ×7 URL | 1 |

**Sahifa hukmlari (brauzer tasdig'i — asl-holat/ombor-dizayn hisobotlaridan):**
- ✅ **Professional (~6):** `/wms/overview` (WarehouseDashboardPage, real: 248,710,000 so'm/12 ombor/23 stok), `/wms/warehouses` (config-driven), `/wms/warehouse-stock/:id` (Excel jadval), `PosMonitorPage`, `/wms/procurement` (lekin xom UI).
- ❌ **BUZUQ:** `/wms/dashboard` (WMSDashboard — "Xatolik yuz berdi").
- ❌ **STUB:** `/mm/check-bot` (MMExtended Chek Bot tab — "Tez orada").
- ❌ **BO'SH/UZILGAN:** `/inventory/materials` (WMSMaterials — "Material topilmadi" lekin 21 material bor; `materials` 0'dan o'qiydi yoki noto'g'ri endpoint).
- ⚠️ **Chalkash:** `/wms/kpi-hub` (overview dublikati).
- ❌ **Raw-matnli (~94 kalit):** butun POS SPA (`PosMovementKirim/Chiqim`, `PosWarehouseDetail`, `PosMaterial360`, `PosKpiDashboard`, `PosLedger`, ...) — tarjimasiz camelCase.

**Hukm 11:** **94 ombor sahifasi → toza tizimда ~10-12 yetadi.** 3 avlod UI aralash; ~70+ dublikat/eski/raw; 1 buzuq + 1 stub + 1 bo'sh.

---

## 12. VIZYON vs HOLAT — TO'LIQ JADVAL (master-plan §1–§17)

| § | Vizyon | Holat | Dalil |
|---|---|---|---|
| §1.2 | POS Monitor ERP SSO (login yo'q) | ✅ | PosMonitorApp `useAuth()`, eski login redirect |
| §1.3 | Yagona responsive FE | ✅ | PosMonitorPage + Telegram WebApp |
| §1.5 | Offline (IndexedDB sync) | ⚠️ | hook bor, sync yarim |
| §1.9 | 30+ terminal FOR UPDATE+SEQUENCE | ⚠️ | issue atomik (RETURNING), lekin 3-jadval TX yo'q |
| §1.10 | Config-driven (warehouse_types) | ✅⚠️ | 9 tur jonli, LEKIN warehouses.type config bilan mos emas (1.1) |
| §1.12 | ADD-ONLY, duplikat yo'q | ❌ | material `materials`/`material_cards` bo'lingan (5); UI 94 dublikat |
| §3 | 9 ombor turi alohida sahifa | ✅⚠️ | config 9 tur; lekin 12 ombordan 9 tasi eski-type |
| §3.2 | Rulon: alohida QR, kg, qisman sarf | ❌ | unit_basis=weight flag bor, kod yo'q; RM-ROLLS type=raw_material |
| §3.10 | Karantin = HOLAT (ombor emas) | ⚠️ | QC-HOLD ombor sifatida mavjud (id=16); workflow stokни ko'chiradi |
| §4.1 | EXTERNAL_IN 5-bosqich | ✅⚠️ | KOD+WIRED (3); jonli 2 ta pending'da qotgan |
| §4.x | Harakat turlari (transfer/damage/return) | ✅⚠️ | damage/transfer endpoint bor; stock_transfers=5 jonli |
| §5.2 | QC 3-qaror (QABUL/REWORK/RAD) | ✅ | quarantine-workflow.qcDecision REAL |
| §5.1 | Avto karantin (har EXTERNAL_IN) | ❌ | qo'lda `move-to-quarantine` (avto emas) |
| §6.3 | Barcode avto-generatsiya | ✅ | auto-barcode.service (Code-128) |
| §6.2 | Ota-bola QR / tur-maxsus | ❌ | parent_barcode_id ustun bor, kod yo'q (6) |
| §6.4 | ZPL/EPL termal printer | ⚠️ | print_queue bor, printer-config controller bor, etiket chop yarim |
| §6.5 | 2 skaner (USB+kamera) | ✅ | useHardwareScanner + PosBarcodeScanner |
| §7 | P2P xarid zanjiri | ✅ | ProcurementRequestService + approval chain (master-plan §17 DONE) |
| §7.7 | Chek tasdiq→ombor prixod | ✅ | receiveProcurement → warehouse_stock |
| §9.4 | Minus saldo blok | ✅ | `available_quantity >= qty` |
| §9.5 | Real-time stok | ✅ | har harakat darhol DB |
| §9.1-9.2 | FIFO/FEFO tannarx | ⚠️ | PosFifoService + fefo query bor; batch_lots=21; to'liq emas |
| §9.6 | Auto-GL (AI tavsiya) | ⚠️ | AutoGlPostingService + gl-post endpoint bor; gl_account_mappings bo'sh |
| §10 | Podotchet (Mening inventarim) | ⚠️ | employee_inventory_ledger=0; EmployeeInventory sahifa bor |
| §11 | Inventarizatsiya (davriy+cycle) | ✅⚠️ | inventory_counts=6 jonli; lines=0; cycle qisman |
| §12 | PDF akt + faktura + akt turlari | ⚠️ | harakat akti PDF REAL (pdf-lib); faktura/akt-turlari yo'q (4) |
| §13 | Bildirishnoma config-driven | ⚠️ | low-stock cron + Telegram; config jadval yo'q |
| §14 | Moliya dashboard + Material 360 | ✅ | /wms/overview real; Material360Service WIRED |
| §15 | ERP integratsiya (MM/FI/MES/HR/QC/CC) | ⚠️ | QC/MM qisman; CC/MES uzilgan |
| §15.2 | Telegram Mini App = web teng | ⚠️ | pos/mini-app bor, to'liq emas |

---

## 13. UCH TOIFA XULOSA

### ✅ ISHLAYDI (real + jonli dalil)
1. POS Monitor kirim/chiqim (atomik, minus blok) — `material_movements=3` jonli.
2. Config-driven 9 ombor turi (`warehouse_types`) + `/wms/overview` dashboard (real qiymat).
3. `warehouse_stock` canonical stok (24 qator, 6 ombor) + Excel jadval (view).
4. Inventarizatsiya (`inventory_counts=6` ishlatilgan).
5. P2P xarid zanjiri (approval + chek + ombor prixod) — master-plan §17 DONE.
6. Barcode SCAN (USB/wedge + kamera, GS1/Code-128 generatsiya).
7. PDF harakat akti (pdf-lib, real).
8. warehouse_bins (126) + warehouse_employees (9) — strukturа jonli.

### ⚠️ QISMAN / STUB / WIRED-LEKIN-ISHLATILMAGAN
1. **EXTERNAL_IN 5-bosqich + karantin→QC + auto-barcode + auto-GL + 3-way-match + GRN + Material 360** — KOD to'liq + endpoint WIRED, **lekin jonli 2 ta movement `pending`'da qotgan, GRN/barcode=0** (end-to-end hech haydalmagan).
2. **Material bron** (stock_reservations) — repo+service REAL, **HTTP endpoint YO'Q**, jonli 0; casing bug + current_stock VIEW manba.
3. **FIFO/FEFO tannarx** (PosFifoService, batch_lots=21) — qisman.
4. **Auto-GL** — service bor, `gl_account_mappings` bo'sh (mapping seed kerak).
5. **Podotchet** (employee_inventory_ledger=0) — sahifa bor, oqim bo'sh.
6. **WMS modul** — GET'lar qisman real, CREATE'lar stub (`createStock`→`{success:true}`).
7. **PDF faktura + akt turlari** (§12) — faqat harakat akti bor.
8. **Offline sync + Telegram Mini App** — yarim.

### ❌ YO'Q / BUZUQ
1. **Barcode ota-bola ierarxiya** (§3.2/§6.2) — DB ustun bor (`parent_barcode_id`), kod 0.
2. **Per-rulon kg/og'irlik/split/qoldiq** (§3.2) — config flag bor, kod yo'q; RM-ROLLS type noto'g'ri.
3. **Material yaratish bo'lingan** — `mm/materials` POST→`materials`(0), ombor→`material_cards`(21) (yangi material omborda ko'rinmaydi).
4. **PosMonitorPage'da "Yangi material" tugmasi yo'q** (faqat mavjud qatorlarga kirim/chiqim).
5. **`/wms/dashboard` (WMSDashboard) BUZUQ** ("Xatolik"); **`/inventory/materials` BO'SH** (21 material bor, 0 ko'rsatadi); **`/mm/check-bot` STUB**.
6. **Avto-karantin** (§5.1 har EXTERNAL_IN avval karantin) — qo'lda.
7. **94 sahifa dublikat** (3 avlod UI, ~70+ ortiqcha, POS SPA raw-matn 94 kalit).
8. **warehouses.type ≠ warehouse_types.code** — taksonomiya bo'lingan (12 ombordan 9 tasi config'dan tashqarida).

---

## 14. OMBOR NECHA % (vizyonga)

| O'lcham | % | Asos |
|---|---|---|
| **KOD bazasi qurilishi** | **~62-65%** | Yadro (POS↔ombor, config, 5-bosqich pipeline, P2P, QC, barcode-scan, PDF, inventory) qurilgan+WIRED |
| **End-to-end jonli ishlatilgan** | **~25%** | Faqat issue/receive (3 movement) + inventory (6) + P2P haqiqatan ishlagan; 5-bosqich pipeline pending'da qotgan |
| **UI tozaligi/IA** | **~30%** | 94 sahifa, 3 avlod aralash, ~6 professional |
| **Dublikatsiz/canonical** | **~50%** | material/UI/taksonomiya bo'lingan; lekin DB asosan canonical+VIEW |

### YAGONA RAQAM: **Ombor moduli vizyonga ~62% (kod) / ~25% (jonli to'liq oqim).**

> EuroPrint modullari ichida **eng yuqori** (Kassir ~10%, CC ~30%, Kanban ~50% bilan solishtirganda). Ombor = "dvigatel bor va quvvatli, lekin sinov-yo'lda hali to'liq haydalmagan + kuzov (UI) dublikatga to'la".

---

## 15. EGASI UCHUN — TOP TUZATISHLAR (ustuvor)

1. **Taksonomiya yagonalashtirish:** `warehouses.type` ni `warehouse_types.code` ga moslash (MAIN→?, wip→production, scrap→defective/waste_paper, tools→tools_equipment, household→household_mro, RM-ROLLS→paper_rolls) → config-driven UI 12 omborni ham ko'rsin.
2. **Material birlashtirish:** `mm/materials` POST ni `material_cards`'ga yo'naltirish (yoki `materials`→`material_cards` sinxron) → yangi material omborda ko'rinsin. PosMonitorPage'ga "Yangi material" tugma.
3. **5-bosqich pipeline'ni jonli sinash:** 1 ta EXTERNAL_IN ni DRAFT→KARANTIN→QC→COMPLETED gacha haydab, warehouse_stock + barcode + GL + GRN ishlashini isbotlash (hozir 2 ta pending'da).
4. **Bron endpoint:** `StockReservationService.reserve` ni controllerga ulash + casing bug fix (`'active'`/`'ACTIVE'`) + `warehouse_stock.reserved_quantity` ni haqiqatan yangilash.
5. **UI tozalash:** 94→~12 sahifa; WMSDashboard (buzuq)/WMSMaterials (bo'sh)/POS SPA (raw) o'chirish; `/wms/*` + PosMonitorPage qoldirish.
6. **WMS stub'larni tozalash:** `createStock()→{success:true}` va 20 stub — yoki real qilish yoki o'chirish.
7. **Ota-bola barcode + rulon kg** — §3.2/§6.2 implementatsiya (skelet bor).
8. **3-jadval issue/receive ni transaction'ga o'rash** (§1.9 atomiklik).

---

*Tahlil 2026-06-02 — kod (Read/Grep) + jonli DB `europrint`@:5432 (count + information_schema) + 9 mavjud docs hisoboti kengaytirildi. Brauzer da'volari (professional/buzuq sahifalar) asl-holat + ombor-dizayn-dublikat hisobotlaridan (brauzer tasdiq, Super Admin). Hech narsa o'zgartirilmadi.*
