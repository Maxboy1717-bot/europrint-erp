# OMBOR — DIZAYN/UX + DUBLIKAT SAHIFALAR TAHLILI (2026-06-02)

> **FAQAT TAHLIL** — hech narsa o'chirilmadi/o'zgartirilmadi. Brauzer (:20806, Super Admin) + kod + jonli DB.
> Egasi: "interfeys umuman noto'g'ri" + "dublikat omborlar juda ko'p" — bu safar SHUNGA qaraldi.

---

## QISQA HUKM
**94 ta ombor-bog'liq sahifa fayli bor** (66 ERP `/pages/` + 28 POS SPA). Bitta domen uchun haddan tashqari ko'p.
**3 avlod UI yonma-yon yashaydi:** (1) YANGI toza `/wms/*` (~5 sahifa, ishlaydi, chiroyli) · (2) ESKI ERP (WMS*/Warehouse*/MM*/Material* ~60 sahifa, aralash: ishlaydi/buzuq/bo'sh/dublikat) · (3) ESKI POS SPA (28 `Pos*` sahifa, **raw-kalit bilan to'la**). Egasi haqliki — bu **chalkash, dublikatga to'la, yarim-tarjima** tizim.

---

## 1-QISM — DUBLIKAT OMBOR SAHIFALARI

### 1A. Bir xil ishni qiladigan DUBLIKAT klasterlar

| Funksiya | Necha xil sahifa | Asl (qoldir) | Dublikat/eski (o'chir) |
|---|---|---|---|
| **Dashboard** | **4–6** | `/wms/overview` (WarehouseDashboardPage) ✅ | `/wms/kpi-hub` (WarehouseKpiHub — bir xil data) · `/wms/dashboard` (WMSDashboard — **BUZUQ**) · MMDashboard · PosDashboard · PosKpiDashboard |
| **Materiallar ro'yxati** | **5–6** | bittasi (Excel jadval qilib) | WMSMaterials (`/inventory/materials` — **bo'sh/uzilgan**) · MaterialBalance · MaterialCardsPage · RawMaterialsPage · MaterialsAccounting · PosMaterials |
| **Material 360 profil** | **2** | WarehouseMaterial360 (`/wms/material/360/:id`) | PosMaterial360 (POS SPA, raw kalit) |
| **Kirim/Chiqim** | **3** | PosMonitorPage inline (yangi, toza) ✅ | WarehouseKirimWizard (`/wms/kirim-new`) · PosMovementKirim/Chiqim (POS SPA, raw kalit) |
| **QC ko'rib chiqish** | **2** | bittasi | WarehouseQCReview · PosQCReview |
| **Karantin** | **2** | bittasi | WarehouseQuarantine · PosQuarantine |
| **Rezervatsiya** | **2** | StockReservation (`/wms/reservation`) | PosReservations |
| **Xodim inventari (podotchet)** | **2** | EmployeeInventory (`/wms/employee-inventory`) | PosMyInventory |
| **Hisobotlar** | **3** | bittasi | WarehouseReports (`/warehouse/reports`) · WarehouseReportsAll (`/wms/reports` + `/wms/reports-all`) · PosReports |
| **Omborlar ro'yxati** | **2** | WarehousesPage (`/wms/warehouses`) ✅ | PosWarehouses |
| **Ombor qoldig'i (stok)** | **3** | WarehouseStockPage (`/wms/warehouse-stock/:id`) ✅ | PosWarehouseDetail.stock · WMSDashboard ichidagi stok |

### 1B. Dublikat ROUTE'lar (BIR sahifa, bir necha URL — sidebar takror)
- `MMExtended` → **3 URL** (`/mm/check-bot`, `/mm/creditor-debts`, `/mm/supplier-portal`) — sidebar 3 ta alohida yozuv, lekin bitta sahifaning tablari.
- `LogisticsDashboard` → **7 URL** (`/logistics`, `/logistics/transport`, `/route-planning`, `/gps`, `/fuel`, `/drivers`, `/vehicle-schedule`) — 7 sidebar yozuvi → 1 sahifa.
- `GoodsReceiving` → 2 URL (`/wms/grn` + `/warehouse/goods-receiving`).
- `StockReservation` → 2 URL · `InventoryCount` → 2 URL · `WarehouseReportsAll` → 2 URL.

### 1C. DB darajasi (oldingi inventarizatsiya TASDIQLANDI)
Canonical baza + compat-VIEW arxitekturasi: `warehouse_stock` (canonical) ustidan `current_stock`/`pos_warehouse_stock_view` VIEW; material `material_cards` (21) lekin `materials`/`mm_materials` (bo'sh) ham bor. **UI bu chalkashlikni ko'rsatadi:** `/wms/overview` 23 stok deydi · `/wms/kpi-hub` 21 material deydi · `/inventory/materials` **0 (bo'sh)** deydi — uchchasi har xil manbadan o'qiydi.

---

## 2-QISM — INTERFEYS / DIZAYN SIFATI

| Sahifa | Dizayn hukmi | Rasvo matn | UX muammosi |
|---|---|---|---|
| `/wms/overview` (Moliya nazorati) | ✅ **Professional** | yo'q (toza o'zbekcha) | yaxshi |
| `/wms/warehouses` (9 tur) | ✅ **Professional** | yo'q | yaxshi, config-driven |
| `/wms/warehouse-stock` | ✅ **Professional** (Excel jadval) | yo'q | faqat ko'rish |
| `/pos-monitor` (PosMonitorPage) | ✅ **Professional** | yo'q | kirim/chiqim/skaner toza |
| `/wms/procurement` (P2P) | ⚠️ **Yarim** | yo'q | **xom UX**: "Ta'minotchi xodim ID: masalan 5", "Rahbar user ID: 35" — foydalanuvchi ID bilmaydi |
| `/wms/kpi-hub` (KPI Hub) | ⚠️ **Chalkash** | yo'q | 12 KPI karta + uzun "har ombor" ro'yxati (ko'p 0) — to'lib ketgan |
| `/wms/dashboard` (WMSDashboard) | ❌ **BUZUQ** | — | "Xatolik yuz berdi" — ochilmaydi |
| `/inventory/materials` (WMSMaterials) | ❌ **Bo'sh/uzilgan** | yo'q | "Material topilmadi" (0), lekin omborda 21 material bor; sidebar yorlig'i "Material 360°" lekin sahifa = ro'yxat (nom mos emas) |
| `/mm/check-bot` (MMExtended Chek Bot) | ❌ **STUB** | yo'q | "Tez orada — Bu bo'lim hali ishlab chiqilmoqda" |
| **POS SPA ichki sahifalar** (PosMovementKirim/Chiqim, PosWarehouseDetail, PosKpiDashboard, PosMaterial360, PosGoodsReceipts, PosLedger...) | ❌ **Rasvo matn** | **HA — 94 ta raw camelCase kalit** | tarjimasiz: `hechQaysiOmbordaStokYoq`, `qabulAktlariYoq`, `realTimeKorsatgichlar`, `materiallarRoyxatigaQaytish`, `sanoqQatorlariniKiritishUchunBarcode`, `muddatYaqinlashayotganMateriallar`... |

### Raw-matn (rasvo) — eng ko'p shu fayllarda (POS SPA):
PosMovementKirimSteps (12) · PosMovementChiqimRight/Left (6+6) · RequisitionDetail.sections (5) · PosWarehouseDetail (5) · PosMovementNew (5) · PosMaterial360 (4) · PosKpiDashboard (4) · PosWarehouses (3) · PosMaterialDetail (3) · PosGoodsReceipts (3) — jami **94 ta**.

### Boshqa UX/dizayn muammolari
- **Navigatsiya bug'i:** URL'ga to'g'ridan kirilsa sidebar noto'g'ri modulda qoladi (masalan `/wms/dashboard` ochilganda "Savdo va CRM" sidebar turdi).
- **Izchillik yo'q:** yangi `/wms/*` (toza) vs eski WMS/POS (boshqa ko'rinish) — bir tizimda 3 xil dizayn tili.
- **Sidebar takror:** 3 ta yozuv → 1 MMExtended; bir necha "dashboard"; 7 logistika yozuvi → 1 sahifa.

---

## 3-QISM — XULOSA (toza, professional, dublikatsiz tizim uchun)

### ✅ QOLADI (asl, ishlaydigan, chiroyli) — ~6 sahifa
`/wms/overview` (WarehouseDashboardPage) · `/wms/warehouses` + `/:type` (WarehousesPage/WarehouseTypePage) · `/wms/warehouse-stock/:id` (WarehouseStockPage — Excel) · `PosMonitorPage` (kirim/chiqim/skaner/QC/P2P) · `/wms/procurement` (ProcurementPage — **lekin UX qayta dizayn**) · WarehouseMaterial360 (yagona 360).

### 🗑️ O'CHIRILADI (dublikat / buzuq / stub / raw) — ~70+ sahifa
- **Dublikat dashboard:** WMSDashboard (buzuq) · WarehouseKpiHub (overview dublikati) · MMDashboard · PosDashboard · PosKpiDashboard.
- **Butun eski POS SPA (28 `Pos*` sahifa)** — raw-kalitli, PosMonitorPage bilan qoplangan (PosMovementKirim/Chiqim, PosWarehouseDetail, PosMaterial360, PosLedger, PosReservations, PosQCReview, PosQuarantine, PosReports, PosGoodsReceipts, PosKpiDashboard, RequisitionDetail...).
- **Dublikat materiallar ro'yxati:** WMSMaterials · MaterialBalance · MaterialCardsPage · RawMaterialsPage · MaterialsAccounting — bittaga birlashtirish.
- **Dublikat hisobot:** WarehouseReports yoki WarehouseReportsAll — bittasi.
- **Stub:** MMExtended Chek Bot tab.
- **Dublikat route:** MMExtended×3, Logistics×7, GoodsReceiving/StockReservation/InventoryCount×2.

### 🎨 QAYTA DIZAYN bo'ladi
- **ProcurementPage (P2P)** — raw ID o'rniga qidiruv/dropdown (xodim/rahbar nomi bilan); CC/Kanban'ga ulash.
- **Yagona materiallar ro'yxati** — Excel jadval (vizyon #1), `material_cards`'dan o'qisin (0 emas).
- **Yagona dashboard** — overview qoladi, kpi-hub'ning kerakli widgetlari ko'chiriladi.
- **POS SPA o'rniga** PosMonitorPage'ni kengaytirish (raw-kalitli eski sahifalarni qayta yozmaslik — yangi tozaga ko'chirish).

### Raqamlar
- Jami ombor sahifa: **94** → toza tizimda **~10–12 yetadi** (qolgani dublikat/eski/raw).
- Buzuq: 1 (WMSDashboard) · Stub: 1 (Chek Bot) · Bo'sh-uzilgan: 1 (WMSMaterials) · Raw-matnli: ~10 POS SPA sahifa (94 kalit).
- Dizayn jihatdan **professional: ~6 sahifa** (yangi `/wms/*` + PosMonitorPage); **rasvo/eski/buzuq: ~70+**.

> **Asosiy xulosa (egasi haqli):** tizim "ishlaydi" (texnik), lekin **dizayn/IA darajasida chalkash** — 3 avlod UI aralash, 94 sahifa (ko'pi dublikat), POS SPA raw-matnli, bir nechta buzuq/stub/bo'sh sahifa. Toza his uchun: yangi `/wms/*` + PosMonitorPage'ni QOLDIRIB, qolgan ~70+ eski/dublikat/raw sahifani O'CHIRISH + 3-4 sahifani qayta dizayn qilish kerak.

*Tahlil 2026-06-02 — brauzer + kod + DB. Hech narsa o'zgartirilmadi.*
