# UI KOD-SKAN 2 — OMBOR / POS MONITOR (2026-06-02)

> **ROL: 🔵 Tahlilchi (QAT'IY READ-ONLY).** Hech narsa o'zgartirilmadi — faqat shu hisobot yozildi.
> **Qatlam: FAQAT KOD** (brauzer YO'Q). Har topilma fayl(:satr) dalili bilan. Vizual qatlamni asosiy sessiya qo'shadi.
> **FE root:** `artifacts/erp-dashboard/src`
> **Vizyon manbasi:** `docs/ombor-pos-master-plan.md` (§0–§17). Eslatma: vazifa "A+.X" deydi, lekin vizyon hujjati `§X` formatida — quyida §3/§7/§14/§16 ga solishtirildi.
> **Oldingi hujjat:** `docs/ombor-dizayn-dublikat-tahlil-2026-06-02.md` (brauzer+kod+DB) — quyida KOD darajasida tasdiqlandi/yangilandi/2 ta da'vo TUZATILDI.

---

## 0. QISQA HUKM (kod darajasida)

Eski hisobot ("94 sahifa, 3 avlod UI, POS SPA rasvo") **asosan TO'G'RI** va kod bilan tasdiqlandi. Lekin **2 ta da'vo noaniq/xato edi** va tuzatildi:
- ❌→✅ **`WMSDashboard` "BUZUQ"** emas — kodi toza/to'liq; "Xatolik" = runtime (bo'sh DB'da `/api/warehouse/dashboard/*` 503 → `EPErrorState`). Kod ≠ buzuq; lekin **funksional dublikat** (3-chi dashboard).
- ❌→✅ **`WMSMaterials` "bo'sh/uzilgan"** emas — kodi toza/to'liq (real CRUD, ABC, 360, EP token). "0 material" = bo'sh `europrint` DB (memory: `reference_live_db_location.md`), kod nuqsoni emas.

**Asosiy kod-haqiqat:** ikki avlod aniq ajraladi —
1. **YANGI kanonik `/pages/Warehouse*`/`Warehouses*`/`WarehouseDashboard*` + `PosMonitorPage`** = toza (EP/ui + `tLabel` + semantic token, **0 ta inline xom rang**).
2. **ESKI POS SPA `src/pos-monitor/`** = alohida ilova: **523 ta inline xom rang / 43 fayl**, **473 ta hardcoded hex / 30 fayl**, **263 ta raw camelCase i18n kalit / 39 fayl**, **o'z i18n tizimi** (`pos-monitor/i18n/`) + **o'z teması** (`pos-theme.css`). Bu — vizyon §1.13/§16.4 ("rasvo TAQIQ, EP token majburiy") ning **ommaviy buzilishi**.
3. **O'RTA avlod `/pages/WMS*`/`MM*`/`Material*`** = toza dizayn (xom rang ~0), lekin **funksional dublikat** (dashboard×3, materiallar ro'yxati×5).

**Raqamlar (kod):** ERP `/pages/` scan-zonasida **65** fayl (test/split'siz), POS SPA `pos-monitor/`da **44** tsx (36 sahifa). `WarehouseRoutes.tsx` = **45 route**, `PosMonitorApp.tsx` = **29 route**. Vizyon §3 (13 ombor turi) + §14 (Material 360 + moliya drill-down) toza tomonda **MAVJUD va ishlaydi**; ortiqcha ~70 sahifa eski/dublikat.

---

## 1. SAHIFA INVENTARI

### 1.1. Skan natijasi (Glob)

| Hudud | Fayl soni | Izoh |
|---|---|---|
| `/pages/` (WMS/Warehouse/MM/Material/Pos/Procurement/Warehouses, test+split'siz) | **65** | aralash: kanonik + o'rta avlod + split-fayllar (`*Sections`/`*Dialogs`/`*Tabs`) |
| `src/pos-monitor/` jami `.tsx` | **44** | alohida SPA (sahifa+komponent+layout) |
| `src/pos-monitor/pages/*.tsx` | **36** | eski POS sahifalari |
| `src/components/wms/**` | ~40 | kanonik sahifalar ishlatadigan EP-uslub komponentlar (material360/reports/receiving/...) |
| `src/components/pos/**` | ~10 | **eski kassa POS** (ProductCatalog/CartPanel/PaymentDialog/PosReports) — Ombor EMAS, savdo-kassa qoldig'i |

> Oldingi hujjatdagi "94 sahifa" = 65 (`/pages/` keng skan, lekin split-fayllar ham sanalgan) + 28–36 (POS SPA). Tartibi to'g'ri.

### 1.2. Kanonik (YANGI, toza) — `WarehouseRoutes.tsx` boshi + `PosMonitorApp`

✅ **6 ta haqiqiy kanonik sahifa** (vizyon §16.5 "yangi toza UI"):
| Sahifa | Route | Fayl | Vizyon |
|---|---|---|---|
| Ombor moliya dashboard | `/wms/overview` | `pages/WarehouseDashboardPage.tsx` | §14.3 (real-time, drill-down ombor→material) ✅ |
| Omborlar (config-driven turlar) | `/wms/warehouses` + `/:type` | `pages/WarehousesPage.tsx` + `WarehouseTypePage.tsx` | §3.0 (har tur kartochka, 1-qator qo'shish) ✅ |
| Ombor qoldig'i (Excel jadval) | `/wms/warehouse-stock/:id` | `pages/WarehouseStockPage.tsx` | §14.2 ✅ |
| POS Monitor (kirim/chiqim/skaner) | `/pos-monitor` | `pages/PosMonitorPage.tsx` | §4 (data-entry) ✅ |
| Xarid so'rovi (P2P) | `/wms/procurement` | `pages/ProcurementPage.tsx` | §7 ⚠️ (UX xom — pastda) |
| Material 360 (yagona) | `/wms/material/360/:id` | `pages/WarehouseMaterial360.tsx` | §14.2 ✅ |

### 1.3. POS SPA (`/pos-monitor/*`) — alohida sub-ilova

`App.tsx:31,96` — `PosMonitorApp` lazy-mount; `PosMonitorApp.tsx` ichida **29 `<Route>`**. MUHIM nuance:
- `/pos-monitor` = **kanonik `PosMonitorPage`** (`PosMonitorApp.tsx:14,118-124` `PosMonitorMain`). ✅
- Qolgan **~25 eski sahifa** (`PosDashboard`, `PosKpiDashboard`, `PosMovementKirim/Chiqim`, `PosWarehouseDetail`, `PosMaterial360`, `PosLedger`, `PosReservations`, `PosQCReview`, `PosQuarantine`, `PosReports`, `PosGoodsReceipts`, `RequisitionDetail`, `PosMyInventory`, `PosInventory`, ...) hali **deep-link bilan ochiladi** (`PosMonitorApp.tsx:127-344`). Catch-all (`:347-349`) noma'lum yo'lni `/pos-monitor`ga qaytaradi.
- **POS SPA sidebar** (`PosLayout.tsx:45-58`) faqat **7 band** ko'rsatadi + dinamik per-ombor linklar (`:164-208`). Ya'ni eski sahifalarning ko'pi navigatsiyada YO'Q, lekin route sifatida tirik (o'lik-bog'liq emas, deep-link bor).

⚠️ **Natija:** POS SPA = vizyon §16.5 da "o'chiriladi/redirect" deyilgan "eski rasvo UI". Hozir 25 eski sahifa hamon mavjud va deep-link orqali yetib boriladi.

---

## 2. i18n RAW-KALIT / RASVO MATN

### 2.1. POS SPA — raw camelCase kalitlar ❌ (eng og'ir muammo)

**Grep `t("camelCaseKalit")` (nuqtasiz, ns'siz): 263 ta / 39 fayl** — `src/pos-monitor/`.

Eng zich fayllar:
- `pos-monitor/pages/PosMovementKirimSteps.tsx` — **33** raw kalit. Misollar (`:33,62,78,82,123,164,172,189,192,218,222,227`):
  `t("manzilOmbori")`, `t("yukXatiRaqami")`, `t("qoshimchaIzoh")`, `t("hozirchaMateriallarYoqQatorQoshish")`, `t("jamiQatorlar")`, `t("barchaTashqiKirimlarAvval")`, `t("saqlagandanSongQcTekshiruviBoshlanadi")`...
- `PosMaterial360.tsx` — 19 · `PosKpiDashboard.tsx` — 13 · `PosMovementDetail.tsx` — 13 · `PosGoodsReceipts.tsx` — 11 · `PosMovementChiqimLeft.tsx` — 10 · `PosGoodsReceipts/PosGoodsReceipts` boshqalar.

⚠️ **Bu kalitlar locale faylda MAVJUD**, lekin kalit NOMI = o'zbekcha jumla (camelCase). Bu vizyon §1.4/§16.4 ("har matn `tLabel('ns.key','Default')`") ning anti-pattern'i — strukturali namespace yo'q, kalit = matn.

### 2.2. RU "tarjima" = buzuq (Kirill+Lotin aralash) ❌ KRITIK

POS SPA raw kalitlarining **ruscha qiymati mashina-aralash axlat** — vizyon §1.4 (3 toza til) buziladi. Dalil (`src/locales/ru/common.json`):
- `:6656` `"hechQaysiOmbordaStokYoq": "Ничего какой omborda stok нет"` — ruscha+o'zbekcha bema'ni aralash.
- `:6630` `"manzilOmbori": "Адрес ombori *"` — yarim tarjima.
- `:5251` `"qabulAktlariYoq": "Приёмка aktlari yo'q"` — yarim tarjima.

uz qiymati to'g'ri (`uz/common.json:2200,3907,5475`). Ya'ni **RU rejimda POS SPA buzuq matn ko'rsatadi** (uz rejimda o'qiladi).

### 2.3. Dual i18n tizimi ❌ (chalkashlik manbai)

POS SPA **ikki xil i18n** ishlatadi:
- `pos-monitor/layout/PosLayout.tsx:8` → `usePosI18n` (alohida: `pos-monitor/i18n/{uz,ru,uz-cyr}.json` + `usePosI18n.ts`).
- `pos-monitor/PosMonitorApp.tsx:10` + sahifalar → ERP `@/lib/i18n` (`useTranslation`) + `src/locales/`.

⚠️ Bitta sub-ilovada 2 ta tarjima manbasi = qo'sh-saqlash, drift xavfi. Kanonik `/pages/*` faqat ERP `tLabel`/`useTranslation` ishlatadi.

### 2.4. Hardcoded matn (i18n'ni chetlab o'tish) ⚠️

`PosMaterial360.tsx:56-64` — `MOVEMENT_COLOR` map: label'lar **to'g'ridan o'zbekcha** ("Tashqi Kirim", "Bo'limga Berish", "Zarar"...) — fayl `useTranslation` import qilsa-da (`:17`), bu label'lar `t()`'siz. RU/uz-cyr'da o'zbekcha qoladi.

### 2.5. Kanonik tomon — toza ✅

- `WarehouseDashboardPage.tsx` — barcha matn `tLabel("common.whDash.*", "Default")` (`:43,55,65,...`). ⚠️ kichik: `MOVEMENT_LABEL` (`:17-23`) hardcoded uz (lekin fallback sifatida maqbul).
- `WMSMaterials.tsx` — `useTranslation('common')` + `useTranslation('wms')`, strukturali kalitlar (`tWms("categoryAll")`, `:68-76`). ⚠️ kichik: lekin `t("dashboard9")`, `t("status28")`, `t("close2")` kabi **avto-raqamlangan kalitlar** ko'rinadi (i18n auto-gen artefakti — toza emas, lekin ishlaydi).
- `PosMonitorPage.tsx` — `tLabel(...)` (`:23`). ✅

---

## 3. DIZAYN TOKEN BUZILISHI (xom rang / hex)

### 3.1. POS SPA — ommaviy buzilish ❌❌ (Qoida 21 + §1.13 + §16.4)

| Pattern | Soni | Fayl | Hudud |
|---|---|---|---|
| `style={{ color/background/... }}` inline xom | **523** | **43** | `src/pos-monitor/` |
| Hardcoded hex `#rrggbb` | **473** | **30** | `src/pos-monitor/` |

Eng og'ir:
- `PosMovementKirimSteps.tsx` — 35 inline + 2 hex · `PosMaterials.tsx` — 14 inline + **55 hex** · `PosWarehouses.tsx` — 20 inline + **55 hex** · `PosKpiDashboard.tsx` — 25 inline + 37 hex · `PosMaterial360.tsx` — 14 inline + **46 hex**.
- Aniq dalil — `PosMaterial360.tsx:57-63`: `EXTERNAL_IN: { bg: "#ECFDF5", text: "#065F46" }`, `DAMAGE: { bg: "#FEF2F2", text: "#991B1B" }` ... — xom hex paletka.

> Eslatma: `PosLayout.tsx` o'zi ko'p joyda `var(--pos-*)`/`var(--ep-primary)` token ishlatadi (`:127-273`), lekin baribir **og'ir inline-styled** (geometriya/layout inline). `pos-theme.css` — alohida tema. Vizyon §1.13 EP dizayn-tizim komponenti talab qiladi; POS SPA o'z dizayn tilini quradi.

### 3.2. Kanonik tomon — toza ✅

| Pattern | Soni | Hudud |
|---|---|---|
| `style={{ color/background }}` inline xom | **0** | `/pages/{WMS,Warehouse,MM,Material,Pos,Procurement}*.tsx` |
| `text-[#hex]` / `bg-[#hex]` arbitrary | **1** | faqat `MMExtendedTabs.tsx:?` (1 ta) |

✅ Kanonik sahifalar `text-primary`/`text-muted-foreground`/`text-destructive`/`text-[var(--ep-red)]`/`text-[var(--ep-green)]` (semantic token) ishlatadi — masalan `WMSMaterials.tsx:170,172`, `WarehouseDashboardPage.tsx:54,101,122`.

---

## 4. DUBLIKAT / ESKI SAHIFALAR

### 4.1. Funksional dublikat klasterlar (kod bilan tasdiqlangan)

| Funksiya | Necha sahifa | Kanonik (qoldir) | Dublikat (eski) | Dalil |
|---|---|---|---|---|
| **Dashboard** | **5** | `WarehouseDashboardPage` (`/wms/overview`) ✅ | `WMSDashboard` (`/wms/dashboard`) · `WarehouseKpiHub` (`/wms/kpi-hub`) · `MMDashboard` (`/mm/dashboard`) · `PosKpiDashboard`/`PosDashboard` (POS SPA) | `WarehouseRoutes.tsx:45,61,62,81` + `PosMonitorApp.tsx:13,21` |
| **Materiallar ro'yxati** | **5+** | `WMSMaterials` (`/inventory/materials`) ✅ | `MaterialBalance` · `MaterialCardsPage` · `MaterialsAccounting` · `PosMaterials`/`PosMaterialBalance` | `WarehouseRoutes.tsx:74,76` + Glob |
| **Material 360** | **2** | `WarehouseMaterial360` (`/wms/material/360/:id`) | `PosMaterial360` (POS SPA, xom hex) | §1.2 vs `PosMonitorApp.tsx:19,204` |
| **Kirim/Chiqim** | **3** | `PosMonitorPage` inline ✅ | `WarehouseKirimWizard` (`/wms/kirim-new`) · `PosMovementKirim/Chiqim` (POS SPA) | `WarehouseRoutes.tsx:71` + `PosMonitorApp.tsx:28,29` |
| **QC ko'rib chiqish** | **2** | `WarehouseQCReview` (`/wms/qc-review`) | `PosQCReview` | `WarehouseRoutes.tsx:69` + `PosMonitorApp.tsx:39` |
| **Karantin** | **2** | `WarehouseQuarantine` (`/wms/quarantine`) | `PosQuarantine` | `WarehouseRoutes.tsx:66` + `PosMonitorApp.tsx:38` |
| **Rezervatsiya** | **2** | `StockReservation` (`/wms/reservation`) | `PosReservations` | `WarehouseRoutes.tsx:58` + `PosMonitorApp.tsx:24` |
| **Xodim inventari (podotchet)** | **2** | `EmployeeInventory` (`/wms/employee-inventory`) | `PosMyInventory` | `WarehouseRoutes.tsx:70` + `PosMonitorApp.tsx:32` |
| **Hisobotlar** | **3+** | bittasi | `WarehouseReports` (`/warehouse/reports`) · `WarehouseReportsAll` (`/wms/reports`+`/wms/reports-all`) · `PosReports` (×2: `pos-monitor/pages` + `components/pos`) | `WarehouseRoutes.tsx:55,63,64` |
| **Omborlar ro'yxati** | **2** | `WarehousesPage` (`/wms/warehouses`) ✅ | `PosWarehouses` | §1.2 vs `PosMonitorApp.tsx:15` |
| **Ombor qoldig'i** | **2** | `WarehouseStockPage` ✅ | `PosWarehouseDetail.stock` | §1.2 vs `PosMonitorApp.tsx:16` |

> **`PosReports` IKKI nusxada**: `pos-monitor/pages/PosReports.tsx` VA `components/pos/PosReports.tsx` — ikkinchisi eski kassa-POS qoldig'i.

### 4.2. Dublikat ROUTE'lar (1 sahifa → bir necha URL)

`WarehouseRoutes.tsx`'da kod bilan tasdiqlangan:
- **`MMExtended` → 3 URL** (`:82-84`): `/mm/check-bot`, `/mm/creditor-debts`, `/mm/supplier-portal` → bitta `MMExtended`. Sidebar (`constants.ts:333,334,337`) 3 alohida yozuv.
- **`LogisticsDashboard` → 6 URL** (`:86-92`): `/logistics`, `/logistics/transport`, `/route-planning`, `/gps`, `/fuel`, `/drivers`, `/vehicle-schedule` → bitta sahifa. Sidebar (`constants.ts:339-345`) 6 alohida yozuv. *(Eski hujjat "7" degandi — kodda `/logistics` o'zi + 6 sub = 7 yozuv; sahifa bitta.)*
- **`GoodsReceiving` → 2 URL** (`:53,57`): `/warehouse/goods-receiving` + `/wms/grn`.
- **`StockReservation` → 2 URL** (`:54,58`): `/warehouse/reservations` + `/wms/reservation`.
- **`InventoryCount` → 2 URL** (`:52,59`): `/warehouse/inventory-count` + `/wms/inventory`.
- **`WarehouseReportsAll` → 2 URL** (`:63,64`): `/wms/reports` + `/wms/reports-all`.
- **`WMSMaterials` → 2 URL** (`:76,77`): `/inventory/materials` + `/inventory/materials/:id` (bu LEGITIM — list + detail).

### 4.3. @deprecated belgisi

❌ **YO'Q.** Skan-zonada (`{WMS,Warehouse,MM,Material,Pos}*.tsx` + `pos-monitor/`) `@deprecated` tag **topilmadi**. Ya'ni dublikatni faqat xulq-atvor (route/funksiya) bilan aniqlash mumkin, marker bilan emas — bu dedup'ni qiyinlashtiradi.

### 4.4. Sidebar (kanonik `components/sidebar/constants.ts`) — Qoida 22 hurmat qilinadi ✅

- **tz08 "Ombor"** (`:301-321`): 11 band, **yagona** "POS Monitor (kirim/chiqim)" (`:313`), **yagona** "Omborlar" (config-driven, `:310`). **9-ombor-turi klasteri YO'Q** ✅ (Qoida 22). Eski `/pos/*` klasteri YO'Q ✅.
- **tz10 "Moliya"** (`:376-377`): yana bitta "POS Monitor" yozuvi (kassa kontekstida). Izoh aniq (`:373-375`).
- ⚠️ tz08'da "Material 360°" (`:318`) → `/inventory/materials` (`WMSMaterials` = ro'yxat). **Nom-mos emas**: yorliq "360°" lekin sahifa = ro'yxat (garchi ichida 360 detail bo'lsa ham). Mayda IA muammosi.

---

## 5. KOMPONENT QAYTA-ISHLATISH

### 5.1. Kanonik tomon — yaxshi reuse ✅

- **EP komponentlar:** `EPPageHeader`, `EPErrorState` (`WMSDashboard.tsx:31`, `WMSMaterials.tsx:33`), `Card/Badge/Skeleton/Table` (`ui/`).
- **`components/wms/**` umumiy:** `helpers.tsx` (fmtNum/fmtQty/fmtMoney/StockStatusBadge/AbcBadge — `WMSMaterials.tsx:28`), `MaterialDialog.tsx` (`:29`), `material360/*` (BasicTab/StockTab/MovementsTab/FinanceTab/... — `WarehouseMaterial360` ishlatadi), `reports/*` (AbcAnalysisTab/AgingTab/...), `receiving/*`, `reservation/*`, `valuation/*`, `inventory/*`. Bu — **vizyon §16.1 "reuse" ga mos** strukturali komponent kutubxonasi.
- **Shared `Material360Card`** (`WMSMaterials.tsx:7`) — yagona 360 kartochka, ikki joyda (list-detail + 360 route).
- ⚠️ `WMSMaterials.tsx` o'z ichida `KpiCard` (`:45-62`) lokal e'lon qiladi — `components/wms/material360/KpiCard.tsx` ham bor (mayda dublikat-komponent).

### 5.2. POS SPA — reuse YO'Q, har sahifa o'ziniki ❌

- POS SPA o'z layout (`PosLayout`), o'z scanner (`PosBarcodeScanner`), o'z tablar (`GlTab`/`StepsTab`), o'z drawer (`PosNotificationsDrawer`), o'z i18n, o'z tema ishlatadi — ERP `components/ep`/`components/ui` BILAN BOG'LANMAGAN. Har sahifa inline-styled (523 inline). Bu — **vizyon §1.13/§16.4 buzilishi** va kanonik tomondan tubdan farqli "dizayn tili".

---

## 6. VIZYONGA MOSLIK (§3, §7, §14, §16) — kod vs vizyon

| Vizyon bandi | Talab | Kod holati | Hukm |
|---|---|---|---|
| **§3.0** | Ombor turi config jadval (`warehouse_types`), har tur sahifa, 1-qator qo'shish | `WarehousesPage.tsx` + `WarehouseTypePage.tsx` config-driven (`warehouseApi.types()`) | ✅ MOS |
| **§3 (13 tur)** | 13 ombor turi (raw/rulon/household/finished/production/defective/waste/tools/department + karantin holat) | Kod **config-driven** — UI turlarni serverdan oladi (`WarehousesPage.tsx:31-37`); kategoriya map'da 6 kategoriya (`:17-24`). Vizyon §17 "9 tur jonli" deydi. Sahifa 13 turni ham ko'rsata oladi (config kelса). | ✅ MOS (kengaytiriladigan) |
| **§14.2** | Material 360 (qoldiq+qiymat, butun tarix, partiya+yetkazuvchi, QR/QC/passport, hozir kimda) | `WarehouseMaterial360` + `components/wms/material360/*` (Stock/Movements/Finance/Suppliers/Inventory/Storage/Production/Quality/Forecast tab) | ✅ MOS (boy) |
| **§14.3** | Moliya rahbari dashboard real-time: KPI+grafik, har ombor qoldiq+qiymat **drill-down ombor→material**, ogohlantirish | `WarehouseDashboardPage.tsx`: totals KPI, omborlar jadvali (`:155-167`) har qator `→ /wms/warehouse-stock/:id` drill-down (`:158`), low-stock panel (`:97-131`) | ✅ MOS |
| **§7.2–§7.3** | P2P: ta'minotchi so'rov, **org-sxema bo'yicha avto tasdiq-zanjir** (rahbar→direktor, summaga qarab) | `ProcurementPage.tsx` — approval-chain bor, LEKIN UI **raw user ID** so'raydi: `:152` `placeholder="masalan 5"` (xodim), `:208` `placeholder="masalan 35"` (rahbar), `:250,284`. Foydalanuvchi ID yodlamaydi. | ⚠️ QISMAN — backend bor, UX xom (qidiruv/dropdown kerak, §7) |
| **§16.4** | Har matn `tLabel`, har rang EP token, raw hex/rgb TAQIQ | Kanonik: ✅. POS SPA: ❌ (523 inline + 473 hex + 263 raw kalit) | ⚠️ kanonik MOS / POS SPA BUZUQ |
| **§16.5** | Eski rasvo UI (WMS extended + pos-monitor eski) yangi toza tayyor bo'lgach **o'chiriladi/redirect** | Yangi toza tayyor (✅), lekin eski POS SPA (25 sahifa) + WMS dublikatlar (dashboard×3, ro'yxat×5) hamon **tirik va route'da** | ❌ BAJARILMAGAN (eski hali o'chmagan) |
| **§1.4** | 3 toza til (uz-lotin/uz-kirill/rus), har matn tarjima | Kanonik: ✅. POS SPA RU = buzuq aralash (`ru/common.json:6656,6630,5251`) | ⚠️ POS SPA RU buzuq |

---

## 7. XULOSA — qaysi kerak / ortiqcha (kod nuqtai)

### ✅ QOLADI (kanonik, toza, vizyonga mos) — ~6 sahifa + `components/wms/**`
`WarehouseDashboardPage` (`/wms/overview`) · `WarehousesPage`+`WarehouseTypePage` (`/wms/warehouses`) · `WarehouseStockPage` (`/wms/warehouse-stock/:id`) · `PosMonitorPage` (`/pos-monitor`) · `WarehouseMaterial360` (`/wms/material/360/:id`) · `WMSMaterials` (`/inventory/materials` — toza, faqat bo'sh DB) · barcha `components/wms/**` + `components/ep`.

### ⚠️ QAYTA DIZAYN (kod yaxshi, lekin UX/tuzilma tuzatish)
- **`ProcurementPage`** — raw user ID o'rniga xodim/rahbar **qidiruv-dropdown** (vizyon §7.2-§7.3). Backend tayyor (approval-chain).
- **Dashboard birlashtirish** — `WMSDashboard` + `WarehouseKpiHub` ning kerakli widgetlarini `WarehouseDashboardPage`ga ko'chirib, ikkitasini olib tashlash (3→1).
- **Materiallar birlashtirish** — `WMSMaterials` kanonik; `MaterialBalance`/`MaterialCardsPage`/`MaterialsAccounting` ni ko'rib chiqib birlashtirish.

### 🗑️ ESKI/DUBLIKAT (vizyon §16.5 bo'yicha o'chirish/redirect nomzodi) — ~25+ POS SPA + ~5 WMS dublikat
- **Butun eski POS SPA sahifalari** (`pos-monitor/pages/*` — 25 ta, `PosMonitorPage`dan tashqari): raw-kalit + xom hex + dual i18n. `PosMonitorPage`+kanonik `/wms/*` bilan qoplangan.
- **Dublikat dashboard:** `WMSDashboard`, `WarehouseKpiHub` (overview bilan ust-ust).
- **Dublikat hisobot:** `WarehouseReports` yoki `WarehouseReportsAll` (bittasi) + `components/pos/PosReports` (kassa qoldig'i).
- **Dublikat route konsolidatsiya:** MMExtended×3→1, Logistics×7→1 (sahifa allaqachon bitta — faqat sidebar/route tozalash).

> ⚠️ **DIQQAT (Qoida 23):** Bu — TAHLIL. Yuqoridagi "o'chirish/birlashtirish" = **TAVSIYA, ruxsat EMAS**. Hech narsa o'chirilmasin — faqat egasi aniq "bajar" deganda. Eslatma: oldin parallel sessiya tahlil tavsiyasini ruxsatsiz bajargan (memory: legacy `adcd527e`).

### Raqamlar (yakuniy, kod)
- Ombor-bog'liq fayllar: `/pages/` **65** + POS SPA **44** + `components/wms` ~40 + `components/pos` ~10.
- Toza tizim uchun **~10–12 sahifa yetadi** (kanonik 6 + birlashtirilgan materiallar/hisobot/inventarizatsiya).
- POS SPA: **523 inline xom rang / 43 fayl**, **473 hex / 30 fayl**, **263 raw i18n kalit / 39 fayl**, **RU tarjima buzuq**.
- Kanonik tomon: **0 inline xom rang**, **1 hex** (MMExtendedTabs), strukturali `tLabel`.

---

## 8. OLDINGI HUJJATGA TUZATISHLAR (kod tasdig'i)

| Oldingi da'vo (`ombor-dizayn-dublikat...md`) | Kod-haqiqat | Holat |
|---|---|---|
| `WMSDashboard` "BUZUQ — ochilmaydi" | Kod toza/to'liq (CRUD+EP+split). "Xatolik" = `EPErrorState` (`:112`) bo'sh DB 503'da. Dublikat, lekin buzuq emas. | **TUZATILDI** |
| `WMSMaterials` "bo'sh/uzilgan (0)" | Kod toza/to'liq (real CRUD+ABC+360+token). "0" = bo'sh `europrint` DB. | **TUZATILDI** |
| "94 raw kalit" | Kod: **263** raw `t(camelCase)` / 39 fayl (eski "94" = distinct kalit; ishlatish ko'proq). | **YANGILANDI (kattaroq)** |
| "Logistics 7 URL" | Kod: `/logistics` + 6 sub = 7 sidebar yozuvi, sahifa bitta. | TASDIQLANDI (aniqlik) |
| POS SPA "raw-kalitli, rasvo" | TASDIQLANDI + xom hex (473) + dual i18n + RU buzuq qo'shildi. | TASDIQLANDI+kengaytirildi |
| Kanonik `/wms/*` "professional, toza" | TASDIQLANDI (0 inline rang, tLabel, EP token). | TASDIQLANDI |
| Sidebar Qoida 22 (POS yagona, 9-tur klaster yo'q) | `constants.ts:310,313` TASDIQLANDI. | TASDIQLANDI |

---

*Tahlil 2026-06-02 — FAQAT KOD (brauzersiz). 🔵 Read-only. Hech narsa o'zgartirilmadi (faqat shu hisobot). Vizual qatlam asosiy sessiyada.*
