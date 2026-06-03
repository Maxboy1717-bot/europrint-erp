# AGENT3 — FRONTEND HAMMA ROUTE / SAHIFA TAHLILI (2026-06-02)

> **FAQAT TAHLIL** — hech narsa o'zgartirilmadi/o'chirilmadi. Manba: kod (`artifacts/erp-dashboard/src/routes/*.tsx` + `pages/**`) + jonli brauzer (Chrome MCP, `http://localhost:20806/erp-dashboard/...`, Super Admin sessiyasi).
> Har bir da'vo: route fayl:satr **YOKI** brauzer dalili (sahifa matni) bilan tasdiqlangan.
> Mavjud hisobotlar kengaytirildi: `docs/ombor-dizayn-dublikat-tahlil-2026-06-02.md`, `docs/asl-holat-pos-ombor-kassir-kanban-cc-2026-06-02.md`, `docs/iot-tablet-asl-holat-2026-06-02.md`.

---

## QISQA HUKM (raqamlar bilan)

- **441 ta route** (sidebar/URL) `routes/*.tsx` da, lekin ular **~343 ta lazy komponent**ga ulanadi (ko'p route bitta sahifaning tablari).
- **~280 ta haqiqiy "alohida" sahifa komponenti** (route maqsadi) — qolgan ~100 route **multiplekser** sahifalardir (14 ta `*Extended` + bir nechta umumiy komponent bir necha URL'ga ulangan).
- Fayl jihatdan: `pages/**` da **848 ta .tsx** (test'siz), lekin shundan **321 tasi bo'lak** (`*Sections/Helpers/Tabs/Dialogs/Types/Modals/Cards/Steps`) — ya'ni ~527 ta "mazmunli" komponent fayl. POS-monitor SPA: **44 fayl**. Camera-AI-modern: 3.
- **Texnik holat: deyarli HAMMA sahifa OCHILADI va RENDER bo'ladi** (oq ekran/crash juda kam). 16 ta vakil sahifa brauzerda tekshirildi — **1 tasi buzuq** (`/wms/dashboard`), qolganlari render bo'ldi.
- **Mazmun holati: ko'pi BO'SH** (jonli DB qurilish bosqichida, ko'p jadval 0 qator) — bu "mock" emas, balki **real-lekin-bo'sh**. Faqat **2 modulda haqiqiy data** ko'rindi: Ombor (`/wms/overview` 248.7M so'm, 23 stok) va HR (`/employees` 30 xodim) + CRM (5 lid).
- **Frontend tayyorlik bahosi: ~62%** (skelet/sahifa qamrovi a'lo ~90%; lekin haqiqiy ishlaydigan+to'la sahifalar ~35-40%; integratsiya/IA chalkash).

---

## 1-QISM — ROUTE INVENTARIZATSIYASI (fayl bo'yicha)

`routes/*.tsx` (har birida `[url, Component]` juftliklari). Soni `grep -cE "^\s*\['/"`:

| Route fayli | Route soni | Modul guruhi |
|---|---:|---|
| `ProductionRoutes.tsx` | **101** | Ishlab chiqarish + MES + QC + Design + MRO + IoT (6 export) |
| `StubRoutes.tsx` | **58** | Stub→real aralash (37 real, 8 pure-stub, 13 "stub→real") |
| `CRMRoutes.tsx` | **50** | Sotuv/SD (33) + Marketing (16) |
| `WarehouseRoutes.tsx` | **45** | Ombor + MM + Logistika |
| `HRRoutes.tsx` | **44** | HR (42) + AI-HR (2) + Self-service (1) |
| `AdminRoutes.tsx` | **40** | Admin + Integration + SaaS + LMS + Kaizen + Orders |
| `FinanceRoutes.tsx` | **30** | Moliya + Buxgalteriya |
| `DirectorRoutes.tsx` | **29** | Direktor + AI agentlar + EuroPrint control |
| `CameraRoutes.tsx` | **26** | Kamera AI + Xavfsizlik |
| `AnalyticsRoutes.tsx` | **18** | Analytics + LMS + Kanban + Notifications |
| **JAMI** | **441** | + AppRouter ichida ~40 redirect alias + 6 standalone (chat, order-workflow, pos-monitor, iot/tablet, mini-app, login/otp) |

`AppRouter.tsx:53-72` da **~40 ta REDIRECT_PATHS** (eski sidebar linklar → kanonik sahifaga). `App.tsx` da **6 ta SPA-tashqi route**: `/login`, `/otp-verify`, `/iot/tablet`, `/ai-interview/*`, `/public/hrc-test/*`, `/mini-app*`, `/pos-monitor*`, `/chat*` (AppShell'dan tashqarida render qilinadi).

---

## 2-QISM — MULTIPLEKSER SAHIFALAR (1 komponent = ko'p route)

Bu **eng muhim struktura kashfiyoti**: 441 route ≠ 441 sahifa. **14 ta `*Extended` sahifa** `URL_TAB_MAP[location]` orqali bitta komponentda o'nlab URL'ni tab sifatida render qiladi (dalil: `MESExtended.tsx:41`, `TechPPExtended.tsx:29` — `useState(URL_TAB_MAP[location])`).

| Multiplekser komponent | Necha route'ga xizmat qiladi | Misol URL'lar |
|---|---:|---|
| `TechPPExtended` | **~18** | `/tech/material-alternatives`, `/pp/what-if`, `/pp/parallel-processes`, `/pp/delivery-calculator`... |
| `SecurityExtended` | **7** | `/security/attendance`, `/security/ppe`, `/security/hazmat`... |
| `MESExtended` | **7** | `/mes/oee-monitor`, `/mes/reason-log`, `/mes/zone-management`... |
| `DesignExtended` | **8** | `/design/ai-review`, `/design/3d-mockup`, `/design/templates`... |
| `FinanceExtended` | **6** | `/fi/cost-centers`, `/fi/tax-management`, `/fi/audit-log`... |
| `SaaSExtended` | **6** | `/saas/tenant-management`, `/saas/licensing`... |
| `MarketingExtended` | **5** | `/marketing/analytics`, `/marketing/seo`, `/marketing/nps-churn`... |
| `SDSalesManagement` | **5** | `/sd/sales-management`, `/sd/invoices`, `/sd/forecast`, `/sd/analytics`, `/sd/commission` |
| `MMExtended` | **3** | `/mm/check-bot`, `/mm/creditor-debts`, `/mm/supplier-portal` |
| `SDExtended` | **4** | `/sd/manager-panel`, `/sd/warehouse-rental`, `/sd/advance-control` |
| `QCExtended` | **6** | `/qc/lab`, `/qc/iso`, `/qc/ai-analysis`, `/qc/reports`, `/qc/settings` |
| `MROExtended` | **5** | `/mro/expense-control`, `/mro/uniforms`, `/mro/sanitation` |
| `IoTExtended` | **5** | `/iot/sensor-monitoring`, `/iot/predictive-maintenance`... |
| `LMSExtended` | **~9** | `/lms/test-management`, `/lms/leaderboard`, `/lms/gamification`... |
| `LogisticsDashboard` | **7** | `/logistics`, `/logistics/gps`, `/logistics/fuel`, `/drivers`... (`WarehouseRoutes.tsx:86-92`) |

**Natija:** ~110 route shu 15 multiplekser orqali xizmat qiladi. Toza tizimda bu yaxshi (kod takrori yo'q), lekin **sidebar bo'lib ketgan** (1 sahifaning tablari alohida sidebar yozuvi sifatida ko'rinadi — `ombor-dizayn-dublikat` docs §1B buni MMExtended×3, Logistics×7 uchun aytgan; bu butun tizim bo'ylab pattern).

---

## 3-QISM — BRAUZERDA TEKSHIRILGAN SAHIFALAR (16 vakil)

Har biri jonli ochildi, sahifa matni o'qildi. Belgilar: ✅ ISHLAYDI(data/struktura) · ⚠️ QISMAN(bo'sh/placeholder/mock) · ❌ BUZUQ(xato).

| # | URL | Komponent | Holat | Brauzer dalili |
|---|---|---|:--:|---|
| 1 | `/` | DirectorDashboard | ✅ | "Direktor paneli" — to'liq KPI panel, AI xulosa, 20 modul gauge, ФП formula, AIsha ovozli yordamchi. Data 0 (DB bo'sh), lekin struktura to'liq |
| 2 | `/wms/overview` | WarehouseDashboardPage | ✅ | **REAL DATA**: Jami 248,710,000 so'm · 12 ombor (5 qoldiqli) · 23 stok qator · so'nggi harakatlar (Kirim/Chiqim real) |
| 3 | `/wms/dashboard` | WMSDashboard | ❌ | **"Xatolik yuz berdi"** (ErrorBoundary fallback) — sahifa ochilmaydi. `ombor-dizayn-dublikat` docs tasdiqlandi |
| 4 | `/inventory/materials` | WMSMaterials | ⚠️ | Render bo'ladi lekin **"Material topilmadi" (0)** — overview 23 stok ko'rsatadi, bu 0. Data-manba bo'linishi (materials/mm_materials bo'sh jadval) |
| 5 | `/fi/cost-centers` | FinanceExtended | ✅ | "Moliya — Kengaytirilgan" — 4 xarajat markazi (CC-001..004 seed), tab routing ishlaydi |
| 6 | `/marketing/dashboard` | MarketingDashboard | ✅ | To'liq dashboard: kampaniya/lid/NPS/churn/AI yordamchi bo'limlari (data 0 = DB bo'sh) |
| 7 | `/mm/check-bot` | MMExtended (Chek Bot tab) | ⚠️ | **STUB tab**: "Tez orada — Bu bo'lim hali ishlab chiqilmoqda". Boshqa tablar (Yetkazuvchilar/Buyurtmalar/Qabul/Kreditor) bor |
| 8 | `/mes/oee-monitor` | MESExtended | ✅ | "MES — Sex Boshqaruvi" — 7 tab, OEE monitoring UI to'liq (data 0 = 0 work_centers) |
| 9 | `/employees` | Employees | ✅ | **REAL DATA**: 30 ta xodim (Sherzod Aliyev EP-2025-002...), pagination, ustunlar to'liq |
| 10 | `/crm-workspace` | CRMWorkspace | ✅ | **REAL DATA**: 5 lid kanban (Max/Test/g/A) pipeline bosqichlarida, konversiya 40%, 8 ko'rinish tab |
| 11 | `/kanban` | KanbanBoard | ⚠️ | Dvigatel ishlaydi (8 ko'rinish) LEKIN **test-axlat** ("Salom"/"savol"/"1231322"/"Nima") + **3-Savat MOCK** (hardcoded: "Yangi shartnoma loyhasi/Sardor T."...) |
| 12 | `/accounting/cash-register` | CashRegister | ⚠️ | **NOTO'G'RI KONSEPT** — retail POS (shtrix skaner, QQS 12%, Naqd/Karta, "Sotishni yakunlash"). Egasi: kassir=naqd-nazorat hub |
| 13 | `/sap` | StubPage | ⚠️ | Pure stub: "Tez orada — sap moduli hali ishlab chiqilmoqda" + Bosh sahifaga qaytish |
| 14 | `/sd/manager-panel` | SDExtended | ✅ | "Menejer Paneli" — 4 tab, struktura to'liq, data 0 |
| 15 | `/qc/paper-parameters` | PaperParametersPage | ✅ | "Qog'oz Parametrlari" — 9 kategoriya × 57+ param UI, data 0 |
| 16 | `/saas/tenant-management` | SaaSExtended | ✅ | "Tenant Boshqaruvi" — jadval struktura, data 0 |
| 17 | `/mro/spare-parts` | SparePartsPage | ⚠️ | **PLACEHOLDER LABEL bug**: sarlavha "Sarlavha", tavsif "Tavsif", "low Stock", "Jami Value" — i18n `mro` ns yuklanmagan (kod to'g'ri: `t('spareParts.title',"Ehtiyot Qismlar")` SparePartsPage.tsx:47, lekin "Sarlavha" render bo'ldi) |
| 18 | `/finance-dashboard` | FinanceDashboard | ✅ | To'liq: ФП tsikl, soliq qoidalar (INPS/JSHD 12%, min ish haqi 1,120,000 real), hisoblar rejasi |
| 19 | `/pos-monitor` | PosMonitorApp (SPA) | ✅ | **REAL**: 12 ombor sidebar, tablar (To'liq Kirim QC+barcode/Chiqim/Karantin-QC/Harakatlar/Hisobotlar), skaner, real stok (OFFICE-PEN 15125), P2P Qabul. Minor raw-kalit chrome'da ("europrintErp", "erpGaQaytish", "close2") |

**Brauzer xulosasi (16-19 vakil):** 11 ✅ to'liq render · 6 ⚠️ qisman (bo'sh/placeholder/mock/noto'g'ri-konsept) · 1 ❌ buzuq.

---

## 4-QISM — TOIFALAR BO'YICHA HUKM

### ✅ ISHLAYDI (data ko'rinadi yoki struktura to'liq + real seed)
Vakil: `/` (Director), `/wms/overview`, `/employees`, `/crm-workspace`, `/pos-monitor`, `/finance-dashboard`, `/fi/cost-centers`, `/marketing/dashboard`, `/mes/oee-monitor`, `/sd/manager-panel`, `/qc/paper-parameters`, `/saas/tenant-management`.
**Haqiqiy data bilan (DB qatori):** faqat **Ombor** (stok/harakat), **HR** (30 xodim), **CRM** (5 lid), **Finance seed** (4 cost-center, 42 hisob, ChartOfAccounts). Qolgan ✅ sahifalar **struktura-ishlaydi-lekin-bo'sh** (DB qurilish bosqichida).

### ⚠️ QISMAN (bo'sh-mock / placeholder / noto'g'ri-konsept)
1. **`/inventory/materials`** — render bo'ladi, 0 material (data-manba bo'linishi: `material_cards` 21 ≠ `materials` 0).
2. **`/kanban`** — dvigatel ishlaydi, lekin test-axlat data + **3-Savat hardcoded MOCK** (`ThreeBasketsPanel.tsx`, asl-holat docs §D tasdiqladi).
3. **`/accounting/cash-register`** — retail-POS (noto'g'ri konsept; egasi naqd-nazorat hub istaydi).
4. **`/mm/check-bot`** (+ boshqa "Chek Bot" tab) — STUB ("Tez orada").
5. **MRO/QC "dedicated" sahifalar** (`/mro/spare-parts`, ehtimol `/mro/preventive`, `/qc/*` dedicated) — **i18n placeholder bug** ("Sarlavha"/"Tavsif" ko'rinadi; kodda fallback to'g'ri, `mro` ns yuklanmayapti). Bu ~12 dedicated TZ-04/TZ-14 sahifaga ta'sir qilishi mumkin.
6. **POS-monitor SPA raw-kalit** — sahifa ishlaydi, lekin chrome'da ~94 raw camelCase kalit (`ombor-dizayn-dublikat` docs §2 batafsil: PosMovementKirim/Chiqim, PosWarehouseDetail, PosMaterial360...).

### ❌ YO'Q / BUZUQ (oq ekran / xato / pure stub)
1. **`/wms/dashboard` (WMSDashboard)** — ❌ **ErrorBoundary "Xatolik yuz berdi"** (yagona tasdiqlangan buzuq sahifa).
2. **8 ta pure StubPage** (`StubRoutes.tsx:79-87`): `/auth`, `/export`, `/gpt`, `/micro-modules`, `/modules`, `/pos/printer-config`, `/sap`, `/v2/pos/printer-config` — hammasi "Tez orada".
3. **`/ai/wms`** (`StubRoutes.tsx:72`) — `Stub` ga ulangan (izoh: "WmsAnalytics o'chirildi (stub)").

---

## 5-QISM — DUBLIKAT SAHIFALAR (ombor-dizayn-dublikat docs kengaytmasi)

`ombor-dizayn-dublikat-tahlil-2026-06-02.md` ombor domeni dublikatlarini batafsil bergan (94 ombor sahifa → ~10-12 yetadi). Bu yerda **butun frontend bo'yicha** dublikat patternlar:

### 5A. Dublikat ROUTE (bir komponent → bir necha URL, sidebar takror)
- **`Customer360Page` → 3 URL** (`/360`, `/sd/customers/:id`, `/crm/customer/:id`) — `CRMRoutes.tsx:61-62`, `StubRoutes.tsx:65`, `DirectorRoutes.tsx:42` (4-marta!).
- **`LogisticsDashboard` → 7 URL** (`WarehouseRoutes.tsx:86-92`).
- **`MMExtended` → 3**, **`GLDocuments` → 2** (`/gl`, `/accounting/gl-documents`), **`MRODashboard` → 2** (`/mro/dashboard`, `/integration/mro`), **`MESWorkerAssignments` → 2** (`/assignments`, `/mes/workers`), **`RecruitingKanban` → 2** (`/hr/recruiting`, `/hr/recruiting-kanban`), **`NotificationCenter` → 2**, **`AttendanceMonitorPage` → 2** (`/daily-attendance`, `/attendance-monitor`), **`Analytics` → 2** (`/analytics`, `/insights`), **`AiCrmPage` → 3** (`/ai/crm`, `/ai-crm`, `/ai/marketing`), **`AIProductionPlanning` → 2** (`/ai-planning`, `/ai-production-planning`), **`AIExams` → 2** (`/ai-exam`, `/ai-exams`), **`KnowledgeBase` → 2**, **`Courses` → 2** (`/courses`, `/lessons`), **`MaterialCardsPage` → 1** (lekin `RawMaterialsPage` alohida — material ro'yxati 5-6 dublikat, docs §1A).

### 5B. Dublikat KOMPONENT (semantik bir xil ish, ALOHIDA fayl) — Ombor domeni
`ombor-dizayn-dublikat` docs §1A tasdiqlagan (bu yerda takrorlamayman, kengaytiraman): **Dashboard 4-6 ta** (WarehouseDashboardPage/WarehouseKpiHub/WMSDashboard/MMDashboard + POS PosDashboard/PosKpiDashboard) · **Materiallar ro'yxati 5-6 ta** (WMSMaterials/MaterialBalance/MaterialCardsPage/RawMaterialsPage/MaterialsAccounting/PosMaterials) · **Material 360 2 ta** · **Kirim/Chiqim 3 ta** · **QC/Karantin/Rezerv/Hisobot/Podotchet har biri 2-3 ta** (WMS* vs Pos* takrori).

### 5C. ESKI POS SPA dublikat (28 `Pos*` sahifa)
`pos-monitor/pages/` da **44 fayl** (`PosMovementKirim`, `PosMovementChiqim`, `PosWarehouseDetail`, `PosMaterial360`, `PosLedger`, `PosReservations`, `PosQCReview`, `PosQuarantine`, `PosReports`, `PosGoodsReceipts`, `PosKpiDashboard`, `RequisitionDetail`...). Bular ERP-yon WMS* sahifalarini **takrorlaydi** va raw-kalitli. Yangi `PosMonitorApp.tsx` (toza) ularning ko'pini qoplaydi.

### 5D. Yangi vs eski avlod (3 dizayn tili)
`ombor-dizayn-dublikat` docs aytgan: (1) yangi toza `/wms/*` + `pos-monitor`, (2) eski ERP `WMS*/MM*/Material*`, (3) eski POS SPA `Pos*`. Bu butun tizimda ham bor: `*Extended` (yangi tab-multiplekser, toza) vs alohida eski sahifalar.

---

## 6-QISM — O'LIK TUGMA / MOCK DATA / HARDCODED

| Joy | Tur | Dalil |
|---|---|---|
| `KanbanBoard.tsx` 3-Savat | **MOCK hardcoded** | `ThreeBasketsPanel` — "Yangi shartnoma loyhasi/Sardor T. 09:15" va h.k. brauzerda ko'rindi (real CC=0) |
| `KanbanBoard.tsx` doskalar | **Test-axlat** | "Salom"/"savol"/"1231322" ustunlar, "Nima" karta (brauzer) |
| `DirectorDashboard` "20 modul holati" | **Hardcoded 100** | har modul "100" gauge (brauzer) — real holat hisoblamaydi |
| `ForecastAnalytics.tsx`, `SevenFunctions.tsx`, `mini-app/TelegramMiniApp.tsx` | **mock/sample const** | `grep "const (mock|demo|sample)"` topdi (4 fayl) |
| `ReceptionPage.tsx` | **hardcoded data[]** | grep heuristic |
| `/mm/check-bot` "Oxirgi cheklar" | **Stub bo'lim** | "Tez orada" (brauzer) |
| POS-monitor chrome | **raw i18n kalit** | "europrintErp", "erpGaQaytish", "close2" (brauzer) |
| MRO/QC dedicated label | **placeholder i18n** | "Sarlavha"/"Tavsif" (brauzer) — `mro` ns yuklanmagan |

> **Eslatma:** ko'p sahifa "bo'sh" (0 qator) — bu **mock EMAS**, balki real `useQuery` jonli bo'sh DB'dan. Mock = faqat yuqoridagi 7 holat.

---

## 7-QISM — JAMI SAHIFA SONI (aniq hisob)

| Metrika | Son |
|---|---:|
| Route juftliklari (`routes/*.tsx`) | **441** |
| Lazy komponent importlari (`routes/*.tsx`) | **343** |
| Redirect aliaslar (`AppRouter.tsx`) | **~40** |
| SPA-tashqi standalone route (`App.tsx`) | **6** |
| `pages/**/*.tsx` (test'siz) | **848** |
| — shundan bo'lak fayl (`*Sections/Helpers/Tabs/Dialogs/Types/Modals/Cards/Steps`) | **321** |
| — "mazmunli" komponent fayl (848−321) | **~527** |
| `pos-monitor/**` (test'siz) | **44** |
| `camera-ai-modern` pages | **3** |
| `pages/` quyi-papka | **23** |
| EPComingSoon ishlatgan sahifa | **7** |
| Pure StubPage route | **8** (+1 `/ai/wms`) |

**"Foydalanuvchi ko'radigan alohida sahifa" ≈ 280** (343 lazy − ~63 dublikat/redirect ulanish). Toza tizimda ~150-180 yetardi (ombor domenida ~80 ortiqcha, docs §3).

---

## 8-QISM — XULOSA: FRONTEND NECHA %

### Toifalar bo'yicha taqsimot (vakil 16-19 + kod ekstrapolyatsiyasi)

| Toifa | Taxminiy ulush | Izoh |
|---|---:|---|
| ✅ Ishlaydi + render + struktura to'liq | **~85-90%** sahifa ochiladi | Texnik jihatdan deyarli hamma sahifa ishlaydi (crash kam) |
| ✅ Ishlaydi + **haqiqiy data** | **~10%** | Faqat Ombor/HR/CRM/Finance-seed real data ko'rsatadi (qolgan DB bo'sh) |
| ⚠️ Qisman (bo'sh/placeholder/mock/noto'g'ri) | **~25-30%** | Empty (DB), 3-savat mock, kassa noto'g'ri, MRO/QC placeholder label, POS raw-kalit |
| ❌ Buzuq (xato/oq ekran) | **~1%** | `/wms/dashboard` yagona tasdiqlangan; +8 pure stub |

### Yakuniy baho: **Frontend ~62% tayyor**

**Hisoblash mantiqi:**
- **Sahifa qamrovi / skelet: ~90%** — 441 route, 280+ sahifa, deyarli hamma render bo'ladi, dizayn-tizim (token/shablon) izchil yangi sahifalarda.
- **Funksional to'liqlik (data + ishlaydigan CRUD): ~40%** — ko'p sahifa bo'sh (DB qurilishda), 2-3 modul real data, mock/stub/placeholder bor.
- **IA / dublikatsizlik / tozalik: ~50%** — 110+ multiplekser route sidebar bo'lib ketgan, ombor domeni 80 ortiqcha sahifa, 3 dizayn avlodi aralash, eski POS SPA raw-kalit.
- **O'rtacha (skelet 90% × 0.4 + funksional 40% × 0.4 + IA 50% × 0.2) ≈ 62%.**

**Asosiy xabar (egasi uchun):** Frontend **sahifa jihatdan deyarli to'liq qurilgan** (441 route, ~280 sahifa, ~90% render bo'ladi) va texnik jihatdan **mustahkam** (faqat 1 buzuq sahifa). LEKIN: (1) **ko'p sahifa bo'sh** — chunki jonli DB qurilish bosqichida (bu "buzuq" emas, "data yo'q"); (2) **IA chalkash** — 110+ route bitta-sahifa-ko'p-tab multiplekserlar, ombor domenida ~80 dublikat sahifa, 3 dizayn avlodi yonma-yon; (3) **bir nechta sifat nuqsoni** — Kanban 3-savat mock + test-axlat, kassa noto'g'ri konsept, MRO/QC dedicated sahifalarda i18n placeholder ("Sarlavha"), POS SPA raw-kalit. Toza, professional his uchun: dublikat ombor/POS sahifalarni birlashtirish + Kanban data tozalash + MRO/QC i18n ns tuzatish + kassa konseptini qayta belgilash kerak.

*Tahlil 2026-06-02 — kod (`routes/*.tsx` + `pages/**`) + jonli brauzer (19 sahifa, Super Admin). Hech narsa o'zgartirilmadi.*
