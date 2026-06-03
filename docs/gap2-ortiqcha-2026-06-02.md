# GAP-2 — TIZIMDA BOR, LEKIN VIZYONDA YO'Q (ortiqcha / legacy / o'lik)

**Sana:** 2026-06-02
**Rol:** 🔵 Tahlilchi (QAT'IY READ-ONLY) — hech narsa o'zgartirilmadi, faqat shu hisobot.
**Vizyon manbai:** `docs/ombor-pos-master-plan.md` (§0–§17) — **Ombor + Moliya nazorat tizimi**.
**Doira:** backend `apps/api/src`, frontend `artifacts/erp-dashboard/src`.
**Cross-ref:** `docs/ui2-ombor-ui-2026-06-02.md`, `docs/ui3-kassir-ui-2026-06-02.md`, `docs/MASTER_DATA_AUDIT_2026-05-31.md`, memory (POS 3-avlod, master-data overlaps, dead-code cleanup'lar), `CLAUDE.md` Qoida 22.

---

## 0. METODOLOGIYA VA OGOHLANTIRISH

Vizyon (§0) tizimni **ko'p-omborli barcode-asosli material nazorat + moliya rahbari dashboard** deb belgilaydi. §15 integratsiya nuqtalari sifatida **faqat** quyilarni eslatadi: MM (ta'minot), FI (moliya/GL), MES (tayyor mahsulot), HR (xodim/offboarding), QC, org-sxema, Kommunikatsiya markazi, Logistika. **Boshqa hech bir modul vizyonda yo'q.**

⚠️ **Muhim ehtiyot:** Jonli `europrint` DB deyarli BO'SH = qurilish bosqichi (memory: `reference_live_db_location.md`). Shuning uchun "ishlatilmaydi/o'lik" hukmi **statik kod** asosida (route yo'q, sidebar yo'q, @deprecated, dublikat) — runtime trafik asosida EMAS. "delete" hukmlari = **tavsiya**, bajarish faqat egasi ruxsati bilan (Qoida 23).

**Surface raqamlari (kod):**
- Backend: **54 modul** papkasi (`apps/api/src/modules/*`).
- Frontend: **~1007 page fayl** (ko'pi `*Types/*Sections/*Dialogs` bo'laklari), **20 sidebar guruh** (tz01–tz17 + kanban/coordination/chat), **54 top-level route + ~75 STUB_ROUTE/Warehouse/Camera/HR/Finance ichki route**.
- Vizyon to'g'ridan-to'g'ri qamragan sidebar guruh: **tz08 (Ombor) + tz10 (Moliya) yadrosi + tz09 (Ta'minot, MM) + tz04 (QC) qisman**. Qolgan **~15 guruh** vizyon yadrosidan tashqarida.

---

## 1. VIZYONDA YO'Q MODULLAR / SAHIFALAR (extra surface)

> Pastdagilar vizyon §0–§17 da umuman ta'riflanmagan. §15 integratsiya nuqtasi bo'lganlar **keep (integ.)** deb belgilangan; sof ortiqchalari **noaniq/delete**.

### 1.1 To'liq vizyondan tashqari modullar (sidebar guruh)

| Sidebar | Modul | Asosiy route'lar | Vizyonda? | Hukm |
|---|---|---|---|---|
| tz01 | Savdo va CRM | `sd/dashboard`, `sd/customers`, `crm-workspace`, `sales`, `ai/crm`, `sd/sales-orders`, `order-create`, `order-workflow` | §3.4 EXTERNAL_OUT "sotuv buyurtmasiga bog'lab" — **buyurtma kerak**, lekin to'liq CRM/lid/kvota EMAS | **keep (qisman integ.)** — order/sotuv-buyurtma yadrosi kerak; lid/RFM/AI-CRM = ortiqcha |
| tz02 | **Marketing** | `marketing/*` (dashboard, leads, campaigns, content, seo, ab-testing, nps-churn, website-cms...) | YO'Q (umuman) | **noaniq → delete-nomzod**. Hozir feature-flag bilan **default ko'rinadi** (`feature-flags.ts:33` default `true`!), BE ~60/99 endpoint 501 |
| tz03 | Dizayn | `design/*` (16 sahifa: generator, ai-review, 3d-mockup, brand-guidelines, costing...) | YO'Q (faqat §15 emas; dizayn buyurtma order-flowga tegishli bo'lishi mumkin) | **noaniq** — order→design fan-out (memory phase4) bor; lekin AI-generator/3D-mockup/brand = ortiqcha |
| tz06 | AI Rejalashtirish | `ai-production-planning`, `pp/*` (bottleneck, demand-forecast, what-if, energy-optimization, oee-monitor) | §3.4 "AI rejalashtiradi (BOM+rezerv)" eslatiladi, lekin alohida 18-bandli PP moduli EMAS | **keep (integ. yadro)** + ortiqcha analitika (what-if/energy) = noaniq |
| tz07 | Ishlab Chiqarish (MES) | `mes/*`, `iot/tablet`, `production/orders`, `mes/gamification` | §15 MES integ. (tayyor mahsulot→QC→ombor) | **keep (integ.)**; lekin `mes/gamification` = ortiqcha (§2.2 smena YO'Q ruhiga zid) |
| tz12 | **Ta'lim (LMS)** | `lms-dashboard`, `courses`, `lessons`, `tests`, `ai-exams`, `certificates`, `lms/leaderboard`, `hr-capital/tests`, `lms/micro-learning` | YO'Q (umuman) | **noaniq → delete-nomzod** (vizyon material nazoratiga aloqasiz) |
| tz13 | Xavfsizlik (kamera) | `camera-safety`, `camera/monitoring`, `face-registration`, `security/ppe`, `security/hazmat`, `security/evacuation` | YO'Q (§6.5 AI-kamera = **barcode skan** uchun; xavfsizlik/yuz-tanish EMAS) | **noaniq** — barcode-kamera kerak, yuz-tanish/PPE/evakuatsiya = ortiqcha |
| tz14 | Xo'jalik (MRO) | `mro/*` (preventive, spare-parts, utilities, kitchen, uniforms, cleaning, sanitation) | §3.3 ho'jalik **ombori** (household_mro) bor, lekin MRO ta'mirlash/kommunal/oshxona EMAS | **keep (household ombori)** + ortiqcha (kitchen/uniforms/sanitation/utilities) = noaniq |
| tz15 | **IoT va Kamera** | `iot/dashboard`, `iot/sensor-monitoring`, `camera-*` (heatmap, ai, employees, ratings), `iot/digital-twin`, `iot/predictive-maintenance` | YO'Q (sensor/kamera AI vizyon material nazoratida yo'q) | **noaniq → delete-nomzod** (digital-twin, heatmap, employee-rating kamera) |
| tz16 | **Direktor** | `europrint/director`, `europrint/control`, `europrint/auditor`, `agents/*` (14 AI agent), `ideal-rasm`, `director/ai-summary` | YO'Q (§14.3 "Moliya rahbari Dashboard" bor; alohida Direktor moduli+14 agent EMAS) | **noaniq** — moliya dashboard'i tz10'da; bu 20-bandli direktor surface ortiqcha |
| tz17 | **Admin Panel (SaaS)** | `super-admin`, `saas/tenant-management`, `saas/onboarding`, `saas/licensing`, `saas/module-control`, `saas/monitoring` | YO'Q (vizyon **multi-tenant SaaS EMAS**; bitta zavod) | **noaniq → delete-nomzod** (SaaS/litsenziya/tenant tizimi vizyonga keraksiz) |
| kanban | Vazifalar | `kanban`, `hr/recruiting-kanban`, `strategic-tasks` | YO'Q (buyurtma workflow bor, lekin umumiy kanban EMAS) | **noaniq** |
| coordination | Koordinatsiya | `coordination?tab=*`, `agents/*` (yana 14 agent) | §15 "Kommunikatsiya markazi (so'rov)" integ. | **keep (CC integ.)** — lekin "5 Kengash" + AI-agent takrori = ortiqcha |
| chat | Chat | `chat` (4 band, hammasi bitta `chat` URL!) | YO'Q | **noaniq** (4 sidebar bandi → 1 URL = soxta navigatsiya) |

### 1.2 Backend modullar vizyon §15 ro'yxatida YO'Q

| BE modul | Fayl soni | Vizyonda? | Hukm |
|---|---|---|---|
| `modules/ecommerce` (+Website merged) | 15 | YO'Q (vizyon make-to-order, retail/web do'kon EMAS) | **delete-nomzod** |
| `modules/feedback-360` | 1 | YO'Q | **noaniq** (HR ichida, deferred) |
| `modules/aisha` | 55 | YO'Q (AI dispetcher; vizyonda AI tavsiya bor lekin alohida "Aisha" moduli yo'q) | **noaniq** |
| `modules/ai-agents` + `modules/agents` | 12+ | YO'Q (14-agent hub) | **noaniq** |
| `modules/lms` | — | YO'Q | **delete-nomzod** (tz12 bilan birga) |
| `modules/marketing` | — | YO'Q | **delete-nomzod** (tz02 bilan birga) |
| `modules/camera` + IoT kamera AI | — | qisman (barcode skan kerak) | **noaniq** |
| `modules/general`, `modules/remaining` | 11+49 | nomi bilan = "qoldiq/aralash" axlat | **noaniq → tekshirish** (legacy bucket) |

---

## 2. LEGACY / O'LIK FUNKSIYALAR (unused / dead)

### 2.1 `compatibility/` modul — eng katta legacy bucket

`apps/api/src/modules/compatibility/` ichida **40+ controller** `@deprecated` markeri bilan: `cfo.controller`, `crm-extended.controller`, `asset-management.controller`, `barcode-warehouse.controller`, `europrint-control*.controller`, `saas.controller`, `telegram-admin.controller`, `users-compat`, `goals-compat`, `succession-compat`, `mentorships-compat`, `hr-map-compat`, `candidates-compat`, `approval-workflow.controller`, `settings-admin.controller`, `pos-warehouse-integration.controller`, `warehouse-catalog/label/barcode-ops.controller`, va h.k.

- **Holat:** Bular eski Express→Nest ko'chirish "compat shim"lari. Ko'pi FE legacy route'lariga xizmat qiladi.
- **Vizyonga aloqasi:** `warehouse-*compat`, `pos-warehouse-integration`, `barcode-warehouse` ombor bilan bog'liq — lekin **kanonik emas** (UI-2 §4: WMSExtended/Hub/Integratsiya stublari allaqachon FE'dan olib tashlangan).
- **Hukm:** **noaniq → audit-keyin-delete**. Har bittasini FE consumer'i bor-yo'qligini tekshirib, yo'q bo'lsa o'chirish. Sof legacy.

### 2.2 Eski POS SPA — 25 o'lik sahifa (sidebar'da YO'Q)

UI-2 §1.3 + §4 tasdiqladi: `src/pos-monitor/PosMonitorApp.tsx` da **25 eski POS SPA sahifa** (`PosDashboard`, `PosKpiDashboard`, `PosWarehouses`, `PosMaterials`, `PosMaterial360`, `PosMovementKirim/Chiqim`, `PosLedger`, `PosReservations`, `PosQuarantine`, `PosQCReview`, `PosReports`, `PosGoodsReceipts`, `PosInventory`, `PosRequests`...).
- **Holat:** sidebar'da YO'Q, faqat deep-link bilan tirik; raw-kalit i18n + xom hex + dual i18n (vizyon §1.13/§16.4 buzilishi).
- **Bog'liqlik:** `PosMonitorPage.tsx:657-671` [To'liq Kirim/Chiqim/Karantin/Hisobot] tugmalari **hali shu SPA'ga** olib boradi — to'g'ridan o'chirib bo'lmaydi.
- **Hukm:** **delete (lekin avval EP-uslubga ko'chirish)** — vizyon §16.5 "eski rasvo UI o'chiriladi/redirect" aynan shu.

### 2.3 `pos` vs `pos-v2` — ikki avlod backend

- `modules/pos` = **161 fayl** (kanonik, `/api/pos/*`).
- `modules/pos-v2` = **26 fayl** DDD reimplementatsiya (`/v2/pos/*`: barcode/inventory-count/reports/requests controller'lar). `feature-modules.ts:46` da registratsiya qilingan.
- FE'da `/v2/pos/printer-config` = **Stub** (`StubRoutes.tsx:87`, "duplicate, deferred").
- **Hukm:** **noaniq → konvergensiya**. Bitta konsept (POS ombor operatsiyasi) ikki BE modulda. pos-v2 toza DDD, lekin yarim. Egasi qaysi avlod kanonik ekanini tanlashi kerak.

### 2.4 STUB route'lar (FE) — real BE/sahifa yo'q

`StubRoutes.tsx:79-87` hali 8 sof stub: `/auth`, `/export`, `/gpt`, `/micro-modules`, `/modules`, `/pos/printer-config`, `/sap`, `/v2/pos/printer-config`, `/ai/wms` (WmsAnalytics o'chirilgan). + CLAUDE.md F4 ro'yxatidagi 22 stub route.
- **Hukm:** `/sap`, `/gpt`, `/export`, `/modules`, `/micro-modules` = vizyonda YO'Q → **delete-nomzod**. `/ai/wms` allaqachon o'lik stub.

### 2.5 `dizayn-new/AppSidebar.tsx` — abandoned-refactor

`components/dizayn-new/AppSidebar.tsx` + `erp-modern-ui/AppShellModern.tsx` mavjud, lekin kanonik = `components/AppSidebar.tsx` (memory `session_2026-05-30`: groups-a/b + 10 domen partial = o'lik abandoned-refactor, 12 fayl o'chgan edi). `dizayn-new/` shu turkumdan.
- **Hukm:** **noaniq → tekshirish** (import qilinmasa delete).

---

## 3. DUBLIKATLAR (bir konsept ikki joyda)

| # | Konsept | Joy 1 (kanonik) | Joy 2+ (dublikat) | Manba | Hukm |
|---|---|---|---|---|---|
| 1 | **POS (3 avlod)** | `pages/PosMonitorPage` + `warehouse.api.ts` | (a) o'rta `WMS*/MM*/Material*/Stock*`, (b) eski POS SPA 25 sahifa | UI-2 §0 | konsolidatsiya (a keep, b delete) |
| 2 | **Ombor Dashboard ×4** | `WarehouseDashboardPage` (`/wms/overview`) | `WMSDashboard`, `WarehouseKpiHub`, `MMDashboard`, POS `PosKpiDashboard/PosDashboard` | UI-2 §4.1 | 4→1 birlashtirish |
| 3 | **Material ro'yxat/360** | `WMSMaterials` (`/inventory/materials`) | `MaterialBalance`, `MaterialCardsPage`, `MaterialsAccounting`, `WarehouseMaterial360`, POS `PosMaterials/PosMaterial360` | UI-2 §4.1 | konsolidatsiya |
| 4 | **Kirim/Chiqim oqim** | `PosMonitorPage` inline dialog | `WarehouseKirimWizard` (`/wms/kirim-new`), POS `PosMovementKirim/Chiqim` | UI-2 §4.1 | konsolidatsiya |
| 5 | **Karantin/QC** | `WarehouseQuarantine/QCReview` | POS `PosQuarantine/PosQCReview` | UI-2 §4.1 | delete eski SPA |
| 6 | **Reservation** | `StockReservation` (`/wms/reservation`, **AI-batch**) | POS `PosReservations`; + vizyon `stock_reservations` (haqiqiy bron) YO'Q | UI-2 §2 | aniqlashtirish |
| 7 | **AI Agent Hub** | `agents` (tz16) | `coordination` ham aynan `agents/*` 7 bandni takrorlaydi | `constants.ts:567-576` vs `623-631` | dedup |
| 8 | **Mijoz (master-data)** | `sd_customers` (faol UI) | `customers` (AI kutadi), `crm_*` | `MASTER_DATA_AUDIT_2026-05-31.md` (mijoz×3) | konvergensiya (memory) |
| 9 | **Material (master-data)** | `material_cards` (faol) | `materials`, `mm_materials`, `raw_materials` | master-data audit (material×4) | konvergensiya |
| 10 | **Kassa (retail vs vizyon)** | — (vizyon kassiri YO'Q) | `CashRegister.tsx` = chakana do'kon POS (`/api/pos/products`+savat+QQS+chek) | UI-3 §1 | **delete-nomzod** (vizyon make-to-order, retail do'kon yo'q) |
| 11 | **pos / pos-v2 BE** | `modules/pos` (161) | `modules/pos-v2` (26, `/v2/pos`) | §2.3 | konvergensiya |
| 12 | **Mentorlik/Ko'nikma** | tz11 (HR) | tz12 (Ta'lim) **aynan** `mentorship` + `skills-matrix` takror | `constants.ts:418,460,417,462` | dedup |

---

## 4. TEST / DEMO QOLDIQLARI (mock panellar, seed)

| # | Joy | Nima | Hukm |
|---|---|---|---|
| 1 | `components/kanban/ThreeBasketsPanel.tsx:50` | **`INITIAL_ITEMS` hardcoded 5 soxta xabar** ("Sardor T.", "Nilufar R.", "QC tekshirish natijasi"...) `useState`'ga to'g'ridan beriladi — DB'ga bormaydi. + butun fayl **xom hex inline style** (`background:"#FFFFFF"`, `#2D3748`...) — Qoida 21 buzilishi | **delete demo data** (real CC basket API'ga ulash) |
| 2 | `pages/SevenFunctions.tsx` | `mockData`/sample marker grep'da chiqdi (7-funksiya demo) | **tekshirish** (consumer bormi) |
| 3 | `pages/CrmRfmClusters.tsx` | mock/sample RFM klaster ma'lumoti | CRM ortiqcha (§1.1) bilan birga |
| 4 | `pages/KanbanBoard.tsx` | `INITIAL_ITEMS`/mock grep chiqdi (ammo aniq mock-column topilmadi) | **tekshirish** |
| 5 | `admin.json` (uz/ru/uz-cyr locale) | `MOCK_`/`demoData` tarjima kalitlari | zararsiz (locale) |
| 6 | Migration `hr-full-seed.sql`, `org-structure-sync.sql:40` (`test123` hash) | seed/test data migration ichida | **delete test hash** (CLAUDE.md Qoida A — xavfli) |
| 7 | `*.smoke.test.tsx`, `*.test.tsx` (Applications, AppSidebar...) | test fayllari (legitim) | keep |

---

## 5. PER-ITEM HUKM JADVALI (delete / keep / noaniq)

### 🔴 Delete-nomzod (vizyonga keraksiz, sof ortiqcha)
- `CashRegister.tsx` + `useCashRegister.ts` (retail POS) — vizyon make-to-order, chakana do'kon YO'Q (UI-3 §5).
- `modules/ecommerce` (+Website) — web/retail do'kon vizyonda yo'q.
- tz17 **SaaS/Admin Panel** (`saas/*`, tenant, licensing) — vizyon multi-tenant EMAS.
- tz12 **LMS** + `modules/lms` + `hr-capital/tests` + `lms/leaderboard` — material nazoratiga aloqasiz.
- tz02 **Marketing** (+ `modules/marketing`) — vizyonda yo'q; BE 60/99 = 501; feature-flag default `true` (yashirish kerak edi).
- Eski POS SPA 25 sahifa (`pos-monitor/pages/*`) — §16.5 redirect/o'chirish (avval EP oqimga ko'chirish).
- STUB `/sap`, `/gpt`, `/export`, `/modules`, `/micro-modules`, `/ai/wms`.
- `ThreeBasketsPanel` INITIAL_ITEMS demo data + migration `test123` hash.

### 🟡 Keep (vizyon §15 integratsiya yoki yadro)
- tz08 Ombor (yadro), tz10 Moliya yadrosi (GL/kassa-nazorat/podotchet), tz09 MM Ta'minot, tz04 QC.
- tz07 MES (tayyor mahsulot integ.) — `mes/gamification`dan tashqari.
- tz06 PP AI-rejalashtirish (§3.4 yadro) — what-if/energy analitikadan tashqari.
- coordination/CC (so'rov integ.), logistics (§7.5/§15).
- HR (tz11) yadrosi — xodim/offboarding (§10/§15), podotchet egasi.
- `modules/pos` (kanonik), `WarehouseDashboardPage`, `WMSMaterials`, `ProcurementPage`.

### ⚪ Noaniq (egasi qarori kerak)
- tz01 CRM/Savdo — order/sotuv-buyurtma yadrosi kerak, lid/RFM/AI-CRM ortiqcha.
- tz03 Dizayn — order→design fan-out bor; AI-generator/3D/brand ortiqcha.
- tz13 Xavfsizlik + tz15 IoT/Kamera — barcode-kamera kerak; yuz-tanish/PPE/digital-twin/heatmap ortiqcha.
- tz14 MRO — household ombori keep; kitchen/uniforms/utilities ortiqcha.
- tz16 Direktor (14 agent, ideal-rasm) — moliya dashboard tz10'da; bu surface takror.
- `compatibility/` 40+ controller — consumer-audit keyin delete.
- `pos-v2` vs `pos` — konvergensiya kerak.
- `modules/aisha` (55), `modules/general`/`remaining` (60) — tekshirish.
- `dizayn-new/AppSidebar` + `AppShellModern` — abandoned-refactor tekshirish.

---

## 6. UMUMIY "EXTRA-SURFACE" BAHOSI

| O'lcham | Jami | Vizyon yadrosi | Ortiqcha (extra) | Ortiqcha % |
|---|---|---|---|---|
| Sidebar guruh | 20 | ~4 (tz08, tz10, tz09, tz04) | ~16 | **~80%** |
| BE modul papka | 54 | ~10 (pos, wms, mm, fi, finance, qc, mes, hr, org-structure, communication-center) | ~44 | **~80%** |
| FE page fayl (~1007) | 1007 | ombor+moliya ≈ 60–80 | ~900+ | **~90%** |
| Ombor sahifa (UI-2) | ~57 (49 route + 25 SPA - overlap) | 6 kanonik | ~50 dublikat/legacy | **~88%** |
| STUB route | ~30 | 0 | ~30 | 100% |
| `compatibility/` controller | 40+ | ~3 (warehouse-compat qisman) | ~37 | **~90%** |

**Xulosa raqami:** EuroPrint **ERP** — to'liq korxona tizimi (17 modul); vizyon esa undagi **2 modul** (Ombor + Moliya nazorat). Demak vizyon nuqtai-nazaridan tizimning **~80% sirti "vizyondan tashqari"**. Ammo bu sirtning katta qismi **boshqa biznes-modul** (HR/CRM/MES/Design real ishlatiladi) — sof **"o'lik/legacy/dublikat"** (xavfsiz o'chirish nomzodi) qismi:
- **~25 eski POS SPA sahifa** (UI-2).
- **~40 `compatibility/` legacy controller**.
- **~7 ombor dashboard/material dublikat klasteri** (UI-2 §4).
- **`CashRegister` retail POS, `ecommerce`, sof STUB route'lar, ThreeBaskets demo data**.
- **pos-v2 yarim-konvergensiya, dizayn-new abandoned-refactor**.

Ya'ni **sof tozalanadigan o'lik/dublikat ≈ 80–110 fayl/sahifa**; qolgan ortiqcha sirt = "boshqa modul, vizyon doirasidan tashqari" (o'chirish = biznes qarori, egasi hal qiladi).

---

## 7. ESLATMA (Qoida 23)

Yuqoridagi BARCHA "delete/noaniq" = **TAVSIYA**, ruxsat EMAS. Jonli DB bo'sh = qurilish bosqichi; "ishlatilmaydi" statik kod asosida. Hech narsa o'chirilmasin/o'zgartirilmasin — faqat egasi aniq "bajar" deganda. Bu hisobot faqat `docs/` ga yozildi; boshqa fayl o'zgartirilmadi.

*Tahlil 2026-06-02 — 🔵 Read-only. Cross-ref: ui2, ui3, master-data audit, memory (POS 3-avlod, dead-code cleanup, live-db bo'sh).*
