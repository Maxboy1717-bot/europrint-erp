# EuroPrint ERP — Dublikat-maqsadli sahifalar to'liq tahlili

> **Sana:** 2026-07-10
> **Rol:** 🔵 Tahlilchi (Qoida 23 — QAT'IY read-only). Hech bir kod/DB/konfig fayli o'zgartirilmadi, o'chirilmadi, birlashtirilmadi.
> **Maqsad:** Bir xil MAQSADGA xizmat qiluvchi, lekin alohida/dublikat/nomuvofiq sahifa sifatida amalga oshirilgan ekranlarni aniqlash ("ikki-dunyo" / dublikat-UI naqshi).
> **Metod:** Marshrut inventari dasturiy yig'ildi → maqsad bo'yicha guruhlandi (nom/modul bo'yicha EMAS) → har bir sahifaning haqiqiy `/api/*` endpointi grep bilan tekshirildi → sidebar/nav-havola/redirect bo'yicha yetib-borish holati hisoblandi → oldingi audit topilmalari jonli kodda qayta tekshirildi.

---

## 0. Metodologiya va manbalar

| Element | Manba |
|---|---|
| Marshrut ta'riflari | `artifacts/erp-dashboard/src/routes/*.tsx` (12 fayl, `[path, Component]` tuple massivlari) |
| Router yig'uvchi | `routes/AppRouter.tsx` — `ALL_MODULE_ROUTES` + `<ModuleGroup>` |
| Jonli sidebar | `components/sidebar/constants.ts` → `menuGroups` (`url:` + `defaultUrl:`) |
| Sidebar zanjiri | `App.tsx:114` → `AppShellModern` → `components/ModuleSidebar.tsx:16` → `sidebar/constants.ts` |
| Router'dan tashqari ushlagichlar | `App.tsx:65-105` (erta `return` bloklari) |
| Endpoint isboti | Har sahifada `apiRequest("GET","/api/...")` / `useQuery({queryKey:["/api/..."]})` grep |

**Yetib-borish (reachability) ta'rifi.** Marshrut quyidagilarning birortasi orqali foydalanuvchiga ochiq hisoblanadi: (a) sidebar `url`/`defaultUrl`, (b) kod ichidagi `setLocation`/`navigate`/`href=`/`<Link to=` havolasi, (c) `<Redirect to=>` nishoni, (d) dinamik detail marshruti (`:id`). Hech biri bo'lmasa — **orphan**.

---

## 1. Asosiy raqamlar

| O'lchov | Qiymat |
|---|---|
| Jami ro'yxatdan o'tgan marshrut | **474** |
| Unikal sahifa komponenti | 358 |
| Alias marshrut (1 komponent → 2+ yo'l) | 116 |
| Sidebar yozuvi (`url` + `defaultUrl`) | 294 |
| `<Redirect>` nishoni | 30 |
| Kod ichidagi nav-havola nishoni | 77 |
| **Orphan marshrut** | **153** |
| — `StubRoutes.tsx` da | 48 |
| — boshqa route fayllarda | 105 |
| Sahifa fayllari (`pages/**/*.tsx`) | 884 |

> **Talqin:** har uch marshrutdan bittasi (153/474 ≈ 32%) hech qanday UI yo'li orqali ochilmaydi — faqat URL'ni qo'lda yozib kirish mumkin.

---

## 2. Dublikat-maqsad guruhlari (17 ta)

Ustunlar: **maqsad guruhi | ishtirokchi sahifalar (fayl:yo'l) | bir xil ma'lumotmi | canonical (jonli) | orphan/dead | tavsiya**

| # | Maqsad guruhi | Ishtirokchi sahifalar (fayl:yo'l) | Bir xil ma'lumotmi | Canonical (jonli) | Orphan / dead | Tavsiya |
|---|---|---|---|---|---|---|
| D1 | Ombor umumiy dashboard | `WarehouseRoutes.tsx:55` `/wms/overview` · `:73` `/wms/dashboard` · `:74` `/wms/kpi-hub` | **Ha** — hammasi `warehouse_stock` agregati | `/wms/overview` (WarehouseDashboardPage, sidebar `constants.ts:326`) | `WMSDashboard`, `WarehouseKpiHub` | Birlashtirish → 2 tasini o'chirish. `WarehouseDashboardPage.tsx:5` docblock o'zi "eski WMSDashboard o'rniga" deydi |
| D2 | AI material rezervatsiya | `WarehouseRoutes.tsx:69` `/wms/reservation` · `ProductionRoutes.tsx:100` `/pp/ai-reservation` | **Ha** — ikkalasi `"/api/ai-reservation/dashboard"` (`StockReservation.tsx:64`, `AIReservation.tsx:110`) | `StockReservation` (modulyar) | `AIReservation` (eski monolit) | ⚠️ **Ikkalasi ham sidebar'da** (`constants.ts:337` va `:263`) — bitta yozuvga tushirish |
| D3 | SD modulining to'liq takrori | `CRMRoutes.tsx:63` `/sd/crm` → `SDEuroprint` (7 tab) | **Ha** — 7 tab jonli SD sahifalari bilan bir xil endpoint | Alohida SD sahifalari (`/sd/customers`, `/sd/leads`, ...) | **`SDEuroprint`** — butun modul takrori | O'chirish (Q-46). Faqat `CRMRoutes.tsx:63` dan import qilinadi |
| D4 | Sotuv buyurtmalari | `CRMRoutes.tsx:69` `/sd/sales-orders` · `:59` `/erp/sales` | **Ha** — ikkalasi `sales_orders` (ikki-dunyo) | `/sd/sales-orders` → `/api/sd/orders` | `SalesOrders` → `/api/sap/sales-orders` (SAP-shim, `SalesOrders.tsx:37`) | Birlashtirish. CLAUDE.md allaqachon `/sap` stub'ini shu sabab o'chirgan |
| D5 | MRP | `ProductionRoutes.tsx:130` `/pp/mrp` · `/planning` (mrp tab) | **Yo'q** — ikki xil backend: `/api/pp/mrp/run` (`MrpMatrix.tsx:70`) vs `/api/erp/mrp-runs` (`PlanningBoard.tsx:155`) | `PlanningBoard` (sidebar + `/erp/pp/mrp` redirect nishoni) | `MrpMatrix` | ⚠️ **Ikki jonli MRP backend** — ma'lumot yaxlitligi xavfi |
| D6 | OEE monitoring | `IoTExtended.tsx:59` va `IoTDashboard.tsx:69` — **bir xil `/api/iot-sensors/oee`**; qo'shimcha `/pp/oee-monitor` (`/api/iot/oee/live`), `/mes/oee-monitor` (`/api/mes/oee`), `/agents/production` | Qisman — IoT ikkitasi aynan bir xil | `/iot/oee-live` (IoT), `/mes/oee-monitor` (MES sessiyalari) | `IoTDashboard` OEE kartasi, `/pp/oee-monitor` | IoT-OEE'ni bitta endpoint + bitta sahifaga yig'ish |
| D7 | Uskuna / mashina masteri | `/pp/equipment` (`/api/equipment`) · `/equipment` (`/api/mro/equipment`) · `/mro/dashboard` (`/api/integration/mro/equipment`) · `/machine-status-*` (`/api/iot/machine-status`) · `/camera-machines` (`/api/machine-status-current`) | **Ha** (jismoniy mashina) — **3 xil equipment backend, 2 xil machine-status** | `/mes/work-centers` (`/api/pp/work-centers`) + `/mro/dashboard` | `PPEquipmentPage`, `EquipmentPage`, `MachineStatusPage` | Endpoint konvergensiyasi; orphanlarni o'chirish |
| D8 | Karantin / kirish QC | `WarehouseRoutes.tsx:78` `/wms/quarantine` · `:81` `/wms/qc-review` | **Ha** — `/api/pos/wh-features/quarantine` | — (ikkalasi orphan) | Ikkalasi | Bittaga birlashtirish |
| D9 | SD overview dashboard | `CRMRoutes.tsx:64` `/sd/dashboard` · `:81` `/sd/dashboard/overview` | **Ha** — bir xil `"/api/sd/dashboard/overview"` (`SDDashboard.tsx:223`, `SDOverviewDashboard.tsx:35`) | `SDDashboard` | `SDOverviewDashboard` (268 qator) | O'chirish |
| D10 | Mentorlik | `HRRoutes.tsx:66` `/mentorship` · `StubRoutes.tsx:120` `/mentorships` | **Ha** — `/api/mentorships` (`Mentorship.tsx:34`, `MentorshipsPage.tsx:55`) | `Mentorship` | `MentorshipsPage` (279 qator) | O'chirish |
| D11 | Haftalik reja | `HRRoutes.tsx:92` `/weekly-plan` · `StubRoutes.tsx:132` `/weekly-plans` | **Ha** — `/api/weekly-plans` | `WeeklyPlanPage` | `WeeklyPlansPage` (255 qator) | O'chirish |
| D12 | Ariza javoblari | `HRRoutes.tsx:68` `/applications` · `StubRoutes.tsx:100` `/application-responses` | **Ha** (superset/subset) — `/api/application-responses` | `Applications` | `ApplicationResponsesPage` (175 qator) | O'chirish |
| D13 | Nazorat markazi | `DirectorRoutes.tsx:57` `/europrint/control` · `StubRoutes.tsx:111` `/europrint-control` | **Ha** — `/api/europrint-control/*` (auditor-dashboard, validation-summary ustma-ust) | `EuroprintControlCenter` (sidebar `constants.ts:586`) | `EuroprintControlPage` (290 qator) | O'chirish |
| D14 | AI agent hub | `DirectorRoutes.tsx:45` `/agents` · `AdminRoutes.tsx:97` `/ai/agents` | **Yo'q** — `/api/agents/*` vs `/api/ai-agents/*` | `AgentsHub` (sidebar) | `AIAgentsPage` (133 qator) | Konvergensiya yoki o'chirish |
| D15 | Kamera dashboard | `CameraRoutes.tsx:30` `/camera-dashboard` · `:47` `/camera-ai` | **Ha** — `/api/camera-dashboard/*` + `/api/cameras` | — | — | ⚠️ **Ikkalasi ham sidebar'da** (`constants.ts:561`, `:565`), bir xil ma'lumot |
| D16 | Ombor hisobotlari | `WarehouseRoutes.tsx:75/76` `/wms/reports(-all)` · `:66` `/warehouse/reports` | **Ha** (superset/subset) — 22 hisobot vs 3 hisobot | `WarehouseReportsAll` | `WarehouseReports` | Subsetni o'chirish; superset'ni sidebar'ga chiqarish |
| D17 | CRP / quvvat rejalashtirish | `ProductionRoutes.tsx:131` `/pp/crp` (`/api/pp/crp`) · `/erp/pp/capacity` (`/api/erp/work-center-capacity`) | **Ha** (maqsad) — turli backend | `CapacityPlanning` (sidebar) | `CrpPage` | O'chirish |

### Dublikat EMAS deb tasdiqlangan (nomi o'xshash, entity boshqa)

Bu guruhlar tekshirildi va **haqiqiy dublikat emas** — ro'yxatga faqat kelajakdagi "soxta topilma"ni oldini olish uchun kiritilgan:

| "O'xshash" juftlik | Nega dublikat emas |
|---|---|
| `/notifications` vs `/settings/notifications` | Birinchisi tasma (`/api/pos/notifications`), ikkinchisi foydalanuvchi sozlamalari (`/api/notifications/preferences`) |
| `/hr-dashboard` vs `/ai-hr/dashboard` | `/api/hr/*` operatsion vs `/api/ai-hr/*` AI provayder/byudjet |
| `/hr/daily-reports` vs `/erp-daily-reports` | HR xodim hisobotlari (`/api/hr-v2/daily-reports`) vs ishlab chiqarish hisobotlari (`/api/erp/daily-reports`) |
| `/sd/invoices` vs `/integration/invoice-verification` | Mijoz sotuv-fakturasi vs yetkazib-beruvchi 3-way match |
| `/integration/gl-posting` vs `/accounting/gl-documents` | POS→GL joylash navbati (`/api/pos/gl/*`) vs GL hujjatlari |
| Uchta audit-log ko'ruvchi | `/api/admin/audit-*`, `/api/pos/reports/audit`, `/api/europrint-control/audit-logs` — uch xil qamrov |
| Marketing/CRM/SD "Lidlar" | Uch xil jadval: `marketing_leads`, `deals` (crm_deals=VIEW), `sd_leads`. ⚠️ Lekin sidebar'da **ikkita yozuv aynan "Lidlar"** deb nomlangan (`constants.ts:126` va `:156`) — UX chalkashligi |
| `tech_cards` vs `routing` | Retsept vs operatsiya ketma-ketligi |

---

## 3. Avval ma'lum bo'lgan dublikatlar — jonli koddagi holat

> Har biri qayta tekshirildi (eski topilmani takrorlamasdan).

| # | Eski topilma | Holat | Isbot |
|---|---|---|---|
| 1 | `chat` vs `hr-v2/chat` | ✅ **TUZATILGAN** — `hr-v2` chat emas; bu `getNestApiBase()` API-base helperi (`lib/apiBase.ts:11`), `/api/hr-v2` stringini qaytaradi. Ikkinchi chat sahifasi mavjud emas. | `lib/apiBase.ts:11` |
| 1b | **`/chat/admin`** | ❌ **YANGI REGRESSIYA** — `App.tsx:99` `location === "/chat" \|\| location.startsWith("/chat/")` shartida **AppRouter'gacha** `return` qiladi va to'liq `ChatPage`ni ko'rsatadi. `AppRouter.tsx:196-200` dagi `/chat/admin` marshrutiga hech qachon yetib borilmaydi. `ChatAdminPage` (161 qator) + `ChatAdminPageSections/Dialogs/Types` — **faqat shu o'lik marshrutdan import qilinadi**, boshqa hech qayerdan emas. | `App.tsx:99`, `AppRouter.tsx:198` |
| 2 | POS legacy vs v2 prefiks | ✅ **TUZATILGAN** — yagona `/pos-monitor` sub-app (`App.tsx:95`). Eski `/pos/*` sidebar klasteri o'chirilgan (`constants.ts:396` faqat izoh); `check-sidebar-regress.mjs` bilan himoyalangan. **Qoldiq:** `PosMonitorPage` ikkita sidebar'siz deep-link'da (`/wms/pos-monitor`, `/pos-monitor/legacy-main`) — ataylab saqlangan. | `App.tsx:95`, `constants.ts:396` |
| 3 | Kamera 3-prefiks | ✅ **TUZATILGAN** — `/erp-cameras`, `/erp/cameras/reports`, `/erp/cameras/heatmap` endi sof `<Redirect>` (`AppRouter.tsx:151-153`). Barcha jonli sahifalar `camera-*` nomlashda. | `AppRouter.tsx:151-153` |
| 4 | `kpi` vs `kpis` | ✅ **MAVJUD EMAS** — yalang'och `/kpi` yoki `/kpis` marshruti umuman yo'q. Barcha KPI marshrutlari modul-scoped va har biri boshqa entity o'qiydi (`/api/goals`, `/api/employee-kpi`, `/api/hr/recruitment/kpi`, `/api/okr/*`, `/api/director/kpis`). `/director/kpis` yagona ko'plik shakli, singular jufti yo'q. | route inventari |
| 5 | Kanban dead-controller | ✅ **TUZATILGAN** — `KanbanModule` `app.module.ts:48` (import) va `:145` (imports massivi) da ro'yxatdan o'tgan. `kanban.module.ts:44-53` da 6 controller. `kanban-ext.controller.ts` — o'lik emas, **re-export barreli** (`presentation/kanban-ext.controller.ts:6-9`). FE `/kanban` → `useKanbanBoard` → jonli `/api/kanban/*`. | `app.module.ts:145`, `kanban.module.ts:44` |

**Xulosa:** beshta eski topilmadan **beshtasi tuzatilgan**. Lekin `/chat/admin` bo'yicha yangi regressiya ochildi (1b).

---

## 3A. Yangi topilgan dublikat guruhlari

### 3A.1 ⭐ Ikkinchi, o'lik sidebar ta'rifi

`components/dizayn-new/AppSidebar.tsx` (367 qator, 22 ta `url:` yozuvi) **o'zining mustaqil, qattiq-yozilgan navigatsiya menyusiga** ega va `sidebar/constants.ts` ni umuman ishlatmaydi. `components/AppSidebar.tsx:5` uni `AppSidebarRedesign` sifatida re-export qiladi.

Isbot — **hech bir ishlab-chiqarish fayli import qilmaydi**:
```
components/AppSidebar.tsx:5        (re-export)
components/__tests__/AppSidebar.test.tsx:107   (faqat test)
```
Jonli zanjir esa: `App.tsx:114` → `AppShellModern` (`erp-modern-ui/AppShellModern.tsx:9`) → `ModuleSidebar` → `components/ModuleSidebar.tsx:16` → `sidebar/constants.ts`.

**Oqibat:** ikkita raqobatchi navigatsiya haqiqati mavjud, biri butunlay o'lik. `OrdersRegistry` ("Buyruqlar", `dizayn-new/AppSidebar.tsx:89`) **faqat o'lik sidebar'da** bor — jonli `constants.ts` da yo'q, ya'ni `/orders-registry` sahifasiga UI'dan kirish yo'li yo'q.

### 3A.2 ⭐ `/warehouse/hub` — siniq redirect nishoni

`AppRouter.tsx:141` (`/warehouse-management`) va `:142` (`/warehouse/dashboard`) ikkalasi `/warehouse/hub` ga yo'naltiradi. Lekin **`/warehouse/hub` uchun hech qanday marshrut ta'rifi mavjud emas** — natija: 404 (`NotFound`).

`WarehouseKpiHub.tsx:143` ham `navigate("/warehouse/hub/${code}")` qiladi — o'sha siniq nishonga.

⚠️ **Hujjat-kod ziddiyati:** CLAUDE.md Qoida 22 `warehouse/hub` ni "Ombor Dashboard" deb **kanonik** deb ataydi va `/warehouse/hub/:code` deep-link "saqlanadi" deydi. Kodda ikkalasi ham yo'q.

### 3A.3 ⭐ `StubRoutes.tsx` = 49 ta yashirin alias qatlami

CLAUDE.md F4 bo'limi: *"Stub-route soni endi: 0"*. Aslida `routes/StubRoutes.tsx` mavjud, `AppRouter.tsx:110` da `<ModuleGroup routes={STUB_ROUTES}>` sifatida ulangan va **49 marshrutni ro'yxatdan o'tkazadi**. Hech biri sidebar'da yo'q.

- **14 tasi** jonli sahifaning ikkinchi nusxasi (`/ai`→`AgentsHub`, `/gl`→`GLDocuments`, `/insights`→`Analytics`, `/ai/hr`→`HRAIDashboard`, `/360`→`Customer360Page`, `/iot-enhanced`→`IoTExtended`, ...)
- **35 tasi** faqat shu yerda yashaydi va hech qayerdan yetib bo'lmaydi (`/okr`, `/mentors`, `/candidates`, `/equipment`, `/machine-status-current`, `/raw-materials`, ...)

To'liq ro'yxat → §4.4.

### 3A.4 Bir komponent — ikkita sidebar yozuvi

| Komponent | Sidebar yozuvi 1 | Sidebar yozuvi 2 |
|---|---|---|
| `MRODashboard` | `/mro/dashboard` (`constants.ts:530`) | `/integration/mro` (`:531`) |
| `RecruitingKanban` | `/hr/recruiting` | `/hr/recruiting-kanban` |
| `Courses` | `/courses` | `/lessons` |
| `IoTDashboard` | `constants.ts:306` | `constants.ts:556` |
| `ProductionAgentDashboard` | `constants.ts:600` | `constants.ts:659` |
| `StockReservation` / `AIReservation` | `/wms/reservation` (`:337`) | `/pp/ai-reservation` (`:263`) — **turli komponent, bir xil endpoint** (D2) |

### 3A.5 Soyalangan marshrut — `/iot/tablet`

`ProductionRoutes.tsx:219` da `IOT_ROLES` rol-himoyasi bilan ro'yxatdan o'tgan. Lekin `App.tsx:79` uni **`PrivateRoute` va `RoleRoute` dan oldin** ushlab `return` qiladi. Ya'ni marshrut ta'rifidagi rol-gate hech qachon qo'llanmaydi.

> Eslatma: bu planshet ilovasi uchun ataylab qilingan bo'lishi mumkin (memory: "iot-tablet @Public tuzatildi" — backend tomonda). Baholash egasiga qoladi; bu hisobot faqat holatni qayd etadi.

### 3A.6 "Tech" oroli — sidebar kirish nuqtasi yo'q

`Technology` (`/technology`), `TechDashboard` (`/tech/dashboard-home`), `TechApproval` (`/tech-approval`) — `ProductionRoutes.tsx:114-116`. Faqat bir-biriga `<Link>` qiladi; sidebar'dan hech biriga kirish nuqtasi yo'q (`tech/cards` faqat `TechCards`ga boradi). Ularga faqat sidebar'da bo'lmagan redirect aliaslar orqali (`/tech/dashboard`, `/tech/approval`, `/tech/parameters`, `/tech/standards`) yetib boriladi.

Bundan tashqari `TechDashboard.tsx:92` `/api/technology/*` emas, **`/api/design/statistics`, `/api/design/orders`, `/api/design/templates`** o'qiydi — noto'g'ri ulangan.

### 3A.7 Ombor: bitta stok ustida 5+ endpoint oilasi

Kanonik jadval `warehouse_stock` (xom) + `warehouse_stock_fg` (tayyor mahsulot). FE esa unga besh xil endpoint oilasi orqali murojaat qiladi: `/api/warehouse/*`, `/api/wms/*`, `/api/pos/wh-features/*`, `/api/material-balance/*`, `/api/inventory/*`. Aynan shu FE parchalanishi D1/D5/D8/D16 dublikat sahifalarining ildizi.

---

## 4. To'liq ro'yxatlar

### 4.1 Barcha ro'yxatdan o'tgan marshrutlar (474)

Ustunlar: **Yo'l** · **Sidebar** (YES=jonli menyuda, dyn=dinamik `:id`, NO=menyuda yo'q) · **Komponent** · **Manba fayl** · **Route ta'rifi**


#### `ADMIN_ROUTES` — 12 marshrut

| Yo'l | Sidebar | Komponent | Manba | Route |
|---|---|---|---|---|
| `/settings` | **YES** | Settings | `@/pages/Settings` | `AdminRoutes.tsx:39` |
| `/settings/notifications` | NO | NotificationSettings | `@/pages/NotificationSettings` | `AdminRoutes.tsx:40` |
| `/super-admin` | **YES** | SuperAdminPanel | `@/pages/SuperAdminPanel` | `AdminRoutes.tsx:41` |
| `/system-monitor` | NO | SystemMonitor | `@/pages/SystemMonitor` | `AdminRoutes.tsx:42` |
| `/telegram-bot` | NO | TelegramBotAdmin | `@/pages/TelegramBotAdmin` | `AdminRoutes.tsx:43` |
| `/telegram/admin` | **YES** | TelegramBotAdmin | `@/pages/TelegramBotAdmin` | `AdminRoutes.tsx:44` |
| `/approvals` | nav | ApprovalHub | `@/pages/ApprovalHub` | `AdminRoutes.tsx:45` |
| `/integrations` | NO | IntegrationManagement | `@/pages/IntegrationManagement` | `AdminRoutes.tsx:46` |
| `/customer-portal` | NO | CustomerPortalConfig | `@/pages/CustomerPortalConfig` | `AdminRoutes.tsx:47` |
| `/admin/exceptions` | **YES** | ExceptionLog | `@/pages/ExceptionLog` | `AdminRoutes.tsx:48` |
| `/admin/queues` | **YES** | QueueMonitor | `@/pages/QueueMonitor` | `AdminRoutes.tsx:49` |
| `/admin/audit-log` | NO | AuditLogPage | `@/pages/AuditLogPage` | `AdminRoutes.tsx:50` |

#### `AI_HR_ROUTES` — 2 marshrut

| Yo'l | Sidebar | Komponent | Manba | Route |
|---|---|---|---|---|
| `/ai-hr/dashboard` | **YES** | HRAIDashboard | `@/pages/HRAIDashboard` | `HRRoutes.tsx:111` |
| `/ai-hr/interviews` | **YES** | AIInterviewPage | `@/pages/AIInterviewPage` | `HRRoutes.tsx:112` |

#### `ANALYTICS_ROUTES` — 20 marshrut

| Yo'l | Sidebar | Komponent | Manba | Route |
|---|---|---|---|---|
| `/analytics` | **YES** | Analytics | `@/pages/Analytics` | `AnalyticsRoutes.tsx:28` |
| `/notifications` | **YES** | NotificationCenter | `@/pages/NotificationCenter` | `AnalyticsRoutes.tsx:29` |
| `/ai/forecast` | NO | ForecastAnalytics | `@/pages/ForecastAnalytics` | `AnalyticsRoutes.tsx:30` |
| `/lms-dashboard` | **YES** | LMSDashboard | `@/pages/LMSDashboard` | `AnalyticsRoutes.tsx:31` |
| `/courses` | **YES** | Courses | `@/pages/Courses` | `AnalyticsRoutes.tsx:32` |
| `/lms/course-card-binding` | **YES** | LMSCourseCardBinding | `@/pages/LMSCourseCardBinding` | `AnalyticsRoutes.tsx:33` |
| `/lessons` | **YES** | Courses | `@/pages/Courses` | `AnalyticsRoutes.tsx:34` |
| `/courses/:id` | dyn | CourseDetail | `@/pages/CourseDetail` | `AnalyticsRoutes.tsx:35` |
| `/courses/:id/lessons` | dyn | LessonPlayer | `@/pages/LessonPlayer` | `AnalyticsRoutes.tsx:36` |
| `/courses/:id/lessons/:lessonId` | dyn | LessonPlayer | `@/pages/LessonPlayer` | `AnalyticsRoutes.tsx:37` |
| `/tests` | **YES** | Tests | `@/pages/Tests` | `AnalyticsRoutes.tsx:38` |
| `/tests/:id` | dyn | TestDetail | `@/pages/TestDetail` | `AnalyticsRoutes.tsx:39` |
| `/ai-exams` | **YES** | AIExams | `@/pages/AIExams` | `AnalyticsRoutes.tsx:40` |
| `/ai/fit-scores` | **YES** | AIFitScores | `@/pages/AIFitScores` | `AnalyticsRoutes.tsx:41` |
| `/all-exams` | **YES** | AllExams | `@/pages/AllExams` | `AnalyticsRoutes.tsx:42` |
| `/certificates` | **YES** | Certificates | `@/pages/Certificates` | `AnalyticsRoutes.tsx:43` |
| `/goals` | **YES** | GoalsKPI | `@/pages/GoalsKPI` | `AnalyticsRoutes.tsx:44` |
| `/knowledge-base` | NO | KnowledgeBase | `@/pages/KnowledgeBase` | `AnalyticsRoutes.tsx:45` |
| `/kanban` | **YES** | KanbanBoard | `@/pages/KanbanBoard` | `AnalyticsRoutes.tsx:46` |
| `/hr/recruiting-kanban` | **YES** | RecruitingKanban | `@/pages/RecruitingKanban` | `AnalyticsRoutes.tsx:47` |

#### `ARCHITECTURE_GAP_ROUTES` — 4 marshrut

| Yo'l | Sidebar | Komponent | Manba | Route |
|---|---|---|---|---|
| `/ai/agents` | NO | AIAgentsPage | `@/pages/AIAgentsPage` | `AdminRoutes.tsx:97` |
| `/admin/validate` | NO | ValidatePage | `@/pages/ValidatePage` | `AdminRoutes.tsx:98` |
| `/dashboard/progress` | NO | ProgressPage | `@/pages/ProgressPage` | `AdminRoutes.tsx:99` |
| `/hr/face-employees` | NO | EmployeesForFacePage | `@/pages/EmployeesForFacePage` | `AdminRoutes.tsx:100` |

#### `CAMERA_ROUTES` — 26 marshrut

| Yo'l | Sidebar | Komponent | Manba | Route |
|---|---|---|---|---|
| `/camera-dashboard` | **YES** | CameraDashboard | `@/pages/camera-dashboard` | `CameraRoutes.tsx:30` |
| `/cameras` | **YES** | CamerasManagement | `@/pages/cameras-management` | `CameraRoutes.tsx:31` |
| `/camera-safety` | **YES** | CameraSafety | `@/pages/camera-safety` | `CameraRoutes.tsx:32` |
| `/camera-quality` | **YES** | CameraQuality | `@/pages/camera-quality` | `CameraRoutes.tsx:33` |
| `/camera-employees` | **YES** | CameraEmployeesAI | `@/pages/camera-employees` | `CameraRoutes.tsx:34` |
| `/camera-machines` | **YES** | CameraMachines | `@/pages/camera-machines` | `CameraRoutes.tsx:35` |
| `/camera-alerts` | **YES** | CameraAlertsPage | `@/pages/camera-alerts` | `CameraRoutes.tsx:36` |
| `/camera-reports` | **YES** | CameraReportsPage | `@/pages/camera-reports` | `CameraRoutes.tsx:37` |
| `/camera-settings` | **YES** | CameraSettingsPage | `@/pages/camera-settings` | `CameraRoutes.tsx:38` |
| `/camera-heatmap` | **YES** | CameraHeatmapPage | `@/pages/camera-heatmap` | `CameraRoutes.tsx:39` |
| `/camera-employee-ratings` | **YES** | CameraEmployeeRatingsPage | `@/pages/camera-employee-ratings` | `CameraRoutes.tsx:40` |
| `/camera-live-monitoring` | **YES** | CameraLiveMonitoring | `@/pages/CameraLiveMonitoring` | `CameraRoutes.tsx:41` |
| `/camera/monitoring` | **YES** | FaceRecognitionMonitoring | `@/pages/FaceRecognitionMonitoring` | `CameraRoutes.tsx:42` |
| `/face-registration` | **YES** | FaceRegistration | `@/pages/FaceRegistration` | `CameraRoutes.tsx:43` |
| `/attendance-monitor` | NO | AttendanceMonitorPage | `@/pages/AttendanceMonitorPage` | `CameraRoutes.tsx:44` |
| `/employee-tracking` | NO | EmployeeTrackingReport | `@/pages/EmployeeTrackingReport` | `CameraRoutes.tsx:45` |
| `/europrint/camera-ai-analytics` | NO | CameraAIAnalytics | `@/pages/CameraAIAnalytics` | `CameraRoutes.tsx:46` |
| `/camera-ai` | **YES** | CameraAIModernHub | `@/camera-ai-modern/pages/CameraAIModernHub` | `CameraRoutes.tsx:47` |
| `/security` | redir | SecurityDashboard | `@/pages/SecurityDashboard` | `CameraRoutes.tsx:48` |
| `/security/attendance` | **YES** | SecurityExtended | `@/pages/SecurityExtended` | `CameraRoutes.tsx:49` |
| `/security/zone-access` | **YES** | SecurityExtended | `@/pages/SecurityExtended` | `CameraRoutes.tsx:50` |
| `/security/ppe` | **YES** | SecurityExtended | `@/pages/SecurityExtended` | `CameraRoutes.tsx:51` |
| `/security/hazmat` | **YES** | SecurityExtended | `@/pages/SecurityExtended` | `CameraRoutes.tsx:52` |
| `/security/evacuation` | **YES** | SecurityExtended | `@/pages/SecurityExtended` | `CameraRoutes.tsx:53` |
| `/security/visitors` | **YES** | SecurityExtended | `@/pages/SecurityExtended` | `CameraRoutes.tsx:54` |
| `/security/rating` | **YES** | SecurityExtended | `@/pages/SecurityExtended` | `CameraRoutes.tsx:55` |

#### `DESIGN_ROUTES` — 12 marshrut

| Yo'l | Sidebar | Komponent | Manba | Route |
|---|---|---|---|---|
| `/design/dashboard` | **YES** | DesignDashboard | `@/pages/DesignDashboard` | `ProductionRoutes.tsx:184` |
| `/design/orders` | **YES** | DesignOrders | `@/pages/DesignOrders` | `ProductionRoutes.tsx:185` |
| `/design-orders/:id` | dyn | DesignOrderDetail | `@/pages/DesignOrderDetail` | `ProductionRoutes.tsx:186` |
| `/design/generator` | **YES** | AIDesignGenerator | `@/pages/AIDesignGenerator` | `ProductionRoutes.tsx:187` |
| `/design/ai-review` | **YES** | DesignExtended | `@/pages/DesignExtended` | `ProductionRoutes.tsx:188` |
| `/design/3d-mockup` | **YES** | DesignExtended | `@/pages/DesignExtended` | `ProductionRoutes.tsx:189` |
| `/design/brand-guidelines` | **YES** | DesignExtended | `@/pages/DesignExtended` | `ProductionRoutes.tsx:190` |
| `/design/comparison` | **YES** | DesignExtended | `@/pages/DesignExtended` | `ProductionRoutes.tsx:191` |
| `/design/templates` | **YES** | DesignExtended | `@/pages/DesignExtended` | `ProductionRoutes.tsx:192` |
| `/design/tools` | **YES** | DesignExtended | `@/pages/DesignExtended` | `ProductionRoutes.tsx:193` |
| `/design/costing` | **YES** | DesignExtended | `@/pages/DesignExtended` | `ProductionRoutes.tsx:194` |
| `/design/library` | **YES** | DesignExtended | `@/pages/DesignExtended` | `ProductionRoutes.tsx:195` |

#### `DIRECTOR_ROUTES` — 37 marshrut

| Yo'l | Sidebar | Komponent | Manba | Route |
|---|---|---|---|---|
| `/coordination` | **YES** | CoordinationPage | `@/pages/CoordinationPage` | `DirectorRoutes.tsx:42` |
| `/coordination/workflow-rules` | **YES** | WorkflowRules | `@/pages/WorkflowRules` | `DirectorRoutes.tsx:43` |
| `/coordination/quorum` | **YES** | CouncilQuorum | `@/pages/CouncilQuorum` | `DirectorRoutes.tsx:44` |
| `/agents` | **YES** | AgentsHub | `@/pages/agents/AgentsHub` | `DirectorRoutes.tsx:45` |
| `/agents/production` | **YES** | ProductionAgentDashboard | `@/pages/agents/ProductionDashboard` | `DirectorRoutes.tsx:46` |
| `/agents/hr-performance` | **YES** | HRPerformanceAgentDash | `@/pages/agents/HRPerformanceDashboard` | `DirectorRoutes.tsx:47` |
| `/agents/quality` | **YES** | QualityAgentDashboard | `@/pages/agents/QualityDashboard` | `DirectorRoutes.tsx:48` |
| `/agents/strategic` | **YES** | StrategicAgentDashboard | `@/pages/agents/StrategicDashboard` | `DirectorRoutes.tsx:49` |
| `/agents/facilities` | **YES** | FacilitiesAgentDashboard | `@/pages/agents/FacilitiesDashboard` | `DirectorRoutes.tsx:50` |
| `/agents/procurement` | **YES** | ProcurementAgentDashboard | `@/pages/agents/ProcurementDashboard` | `DirectorRoutes.tsx:51` |
| `/crm/customer/:id` | dyn | Customer360Page | `@/pages/Customer360Page` | `DirectorRoutes.tsx:52` |
| `/warehouse/rolls` | NO | RollManagementPage | `@/pages/warehouse/RollManagementPage` | `DirectorRoutes.tsx:53` |
| `/agents/:id` | dyn | AgentsHub | `@/pages/agents/AgentsHub` | `DirectorRoutes.tsx:54` |
| `/erp-daily-reports` | NO | ERPDailyReports | `@/pages/ERPDailyReports` | `DirectorRoutes.tsx:55` |
| `/erp/employee/:id` | dyn | EmployeeProfile | `@/pages/EmployeeProfile` | `DirectorRoutes.tsx:56` |
| `/europrint/control` | **YES** | EuroprintControlCenter | `@/pages/EuroprintControlCenter` | `DirectorRoutes.tsx:57` |
| `/europrint/auditor` | **YES** | AuditorPanel | `@/pages/AuditorPanel` | `DirectorRoutes.tsx:58` |
| `/europrint/accountant` | **YES** | AccountantView | `@/pages/AccountantView` | `DirectorRoutes.tsx:59` |
| `/europrint/strategic` | **YES** | StrategicTasksPanel | `@/pages/StrategicTasksPanel` | `DirectorRoutes.tsx:60` |
| `/strategic-tasks` | **YES** | StrategicTasksPanel | `@/pages/StrategicTasksPanel` | `DirectorRoutes.tsx:61` |
| `/europrint/employee-kpi` | **YES** | EmployeeDailyKPIPanel | `@/pages/EmployeeDailyKPIPanel` | `DirectorRoutes.tsx:62` |
| `/europrint/waste-tracking` | **YES** | WasteTracking | `@/pages/WasteTracking` | `DirectorRoutes.tsx:63` |
| `/europrint/reports-hub` | **YES** | ReportsHub | `@/pages/ReportsHub` | `DirectorRoutes.tsx:64` |
| `/director/ai-summary` | **YES** | DirectorExtended | `@/pages/DirectorExtended` | `DirectorRoutes.tsx:65` |
| `/director/problem-points` | **YES** | DirectorExtended | `@/pages/DirectorExtended` | `DirectorRoutes.tsx:66` |
| `/director/production` | NO | DirectorExtended | `@/pages/DirectorExtended` | `DirectorRoutes.tsx:67` |
| `/director/hr-stats` | NO | DirectorExtended | `@/pages/DirectorExtended` | `DirectorRoutes.tsx:68` |
| `/director/finance` | NO | DirectorExtended | `@/pages/DirectorExtended` | `DirectorRoutes.tsx:69` |
| `/director/kpis` | NO | DirectorExtended | `@/pages/DirectorExtended` | `DirectorRoutes.tsx:70` |
| `/ideal-rasm` | **YES** | IdealRasmPage | `@/pages/IdealRasmPage` | `DirectorRoutes.tsx:71` |
| `/director/ai-audit` | NO | DirectorAiAudit | `@/pages/DirectorAiAudit` | `DirectorRoutes.tsx:72` |
| `/director/kpi-thresholds` | NO | KpiThresholdConfig | `@/pages/KpiThresholdConfig` | `DirectorRoutes.tsx:73` |
| `/director/company-state-config` | NO | CompanyStateThresholdConfig | `@/pages/CompanyStateThresholdConfig` | `DirectorRoutes.tsx:74` |
| `/director/kpi-weights` | NO | KpiScoreWeightsConfig | `@/pages/KpiScoreWeightsConfig` | `DirectorRoutes.tsx:75` |
| `/director/monthly-plans` | NO | MonthlyPlansPage | `@/pages/MonthlyPlansPage` | `DirectorRoutes.tsx:76` |
| `/director/diary` | NO | DirectorDiaryPage | `@/pages/DirectorDiaryPage` | `DirectorRoutes.tsx:77` |
| `/director/stat-regulations` | NO | StatRegulationsPage | `@/pages/StatRegulationsPage` | `DirectorRoutes.tsx:78` |

#### `FINANCE_ROUTES` — 31 marshrut

| Yo'l | Sidebar | Komponent | Manba | Route |
|---|---|---|---|---|
| `/finance-dashboard` | **YES** | FinanceDashboard | `@/pages/FinanceDashboard` | `FinanceRoutes.tsx:36` |
| `/cfo/dashboard` | redir | CFODashboard | `@/pages/CFODashboard` | `FinanceRoutes.tsx:37` |
| `/finance/cashflow` | **YES** | CashFlowManagement | `@/pages/CashFlowManagement` | `FinanceRoutes.tsx:38` |
| `/finance/budgets` | **YES** | BudgetManagement | `@/pages/BudgetManagement` | `FinanceRoutes.tsx:39` |
| `/finance/order-costing` | **YES** | OrderCosting | `@/pages/OrderCosting` | `FinanceRoutes.tsx:40` |
| `/finance/reports` | **YES** | FinancialReports | `@/pages/FinancialReports` | `FinanceRoutes.tsx:41` |
| `/finance/profitability` | **YES** | ProductProfitability | `@/pages/ProductProfitability` | `FinanceRoutes.tsx:42` |
| `/finance/daily-kpi` | **YES** | DailyKPIDashboard | `@/pages/DailyKPIDashboard` | `FinanceRoutes.tsx:43` |
| `/accounting/ar` | **YES** | AccountsReceivable | `@/pages/AccountsReceivable` | `FinanceRoutes.tsx:44` |
| `/accounting/ap` | **YES** | AccountsPayable | `@/pages/AccountsPayable` | `FinanceRoutes.tsx:45` |
| `/accounting/ar-ap-aging` | **YES** | ArApAging | `@/pages/ArApAging` | `FinanceRoutes.tsx:46` |
| `/accounting/payroll-automation` | **YES** | PayrollAutomation | `@/pages/PayrollAutomation` | `FinanceRoutes.tsx:47` |
| `/accounting/materials` | **YES** | MaterialsAccounting | `@/pages/MaterialsAccounting` | `FinanceRoutes.tsx:48` |
| `/accounting/gl-documents` | **YES** | GLDocuments | `@/pages/GLDocuments` | `FinanceRoutes.tsx:49` |
| `/accounting/chart-of-accounts` | **YES** | ChartOfAccounts | `@/pages/ChartOfAccounts` | `FinanceRoutes.tsx:50` |
| `/accounting/period-closing` | **YES** | PeriodClosing | `@/pages/PeriodClosing` | `FinanceRoutes.tsx:51` |
| `/accounting/cashier-hub` | **YES** | CashierHub | `@/pages/CashierHub` | `FinanceRoutes.tsx:52` |
| `/accounting/income-expense` | **YES** | IncomeExpense | `@/pages/IncomeExpense` | `FinanceRoutes.tsx:53` |
| `/accounting/inventory-valuation` | **YES** | InventoryValuation | `@/pages/InventoryValuation` | `FinanceRoutes.tsx:54` |
| `/accounting/asset-management` | **YES** | AssetManagement | `@/pages/AssetManagement` | `FinanceRoutes.tsx:55` |
| `/fi/cost-centers` | **YES** | FinanceExtended | `@/pages/FinanceExtended` | `FinanceRoutes.tsx:56` |
| `/fi/transfer-pricing` | **YES** | FinanceExtended | `@/pages/FinanceExtended` | `FinanceRoutes.tsx:57` |
| `/fi/tax-management` | **YES** | FinanceExtended | `@/pages/FinanceExtended` | `FinanceRoutes.tsx:58` |
| `/fi/tax-calendar` | **YES** | FinanceExtended | `@/pages/FinanceExtended` | `FinanceRoutes.tsx:59` |
| `/fi/audit-log` | **YES** | FinanceExtended | `@/pages/FinanceExtended` | `FinanceRoutes.tsx:60` |
| `/fi/risk-ai` | **YES** | FinanceExtended | `@/pages/FinanceExtended` | `FinanceRoutes.tsx:61` |
| `/cfo/config` | nav | CfoConfigSettings | `@/pages/CfoConfigSettings` | `FinanceRoutes.tsx:62` |
| `/finance/variance` | nav | FinanceVariance | `@/pages/FinanceVariance` | `FinanceRoutes.tsx:63` |
| `/finance/break-even` | nav | FinanceBreakEven | `@/pages/FinanceBreakEven` | `FinanceRoutes.tsx:64` |
| `/finance/pricing-tiers` | nav | PricingTiers | `@/pages/PricingTiers` | `FinanceRoutes.tsx:65` |
| `/ai/finance` | **YES** | AIFinancePage | `@/pages/AIFinancePage` | `FinanceRoutes.tsx:66` |

#### `HR_ROUTES` — 46 marshrut

| Yo'l | Sidebar | Komponent | Manba | Route |
|---|---|---|---|---|
| `/employees` | **YES** | Employees | `@/pages/Employees` | `HRRoutes.tsx:61` |
| `/employees/:id` | dyn | EmployeeProfile | `@/pages/EmployeeProfile` | `HRRoutes.tsx:62` |
| `/hr-map` | **YES** | HRMap | `@/pages/HRMap` | `HRRoutes.tsx:63` |
| `/hr/recruiting` | **YES** | RecruitingKanban | `@/pages/RecruitingKanban` | `HRRoutes.tsx:64` |
| `/skills-matrix` | **YES** | SkillsMatrix | `@/pages/SkillsMatrix` | `HRRoutes.tsx:65` |
| `/mentorship` | **YES** | Mentorship | `@/pages/Mentorship` | `HRRoutes.tsx:66` |
| `/events-calendar` | **YES** | EventsCalendar | `@/pages/EventsCalendar` | `HRRoutes.tsx:67` |
| `/applications` | **YES** | Applications | `@/pages/Applications` | `HRRoutes.tsx:68` |
| `/shift-schedule` | **YES** | ShiftSchedule | `@/pages/ShiftSchedule` | `HRRoutes.tsx:69` |
| `/hr/shift-types-config` | NO | ShiftTypesConfig | `@/pages/ShiftTypesConfig` | `HRRoutes.tsx:70` |
| `/hr/razryad-config` | NO | RazryadLevelConfig | `@/pages/RazryadLevelConfig` | `HRRoutes.tsx:71` |
| `/hr-dashboard` | **YES** | HRDashboard | `@/pages/HRDashboard` | `HRRoutes.tsx:72` |
| `/hr-capital/tests` | **YES** | HRCapitalTests | `@/pages/HRCapitalTests` | `HRRoutes.tsx:73` |
| `/org-structure/hierarchy` | **YES** | OrgStructureHierarchy | `@/pages/OrgStructureHierarchy` | `HRRoutes.tsx:74` |
| `/org-structure/hierarchy/node/:id` | dyn | OrgNodeDetail | `@/pages/OrgNodeDetail` | `HRRoutes.tsx:75` |
| `/org-structure/error-catalog` | **YES** | ErrorCatalogConfig | `@/pages/ErrorCatalogConfig` | `HRRoutes.tsx:76` |
| `/org-structure/question-bank` | NO | QuestionBankConfig | `@/pages/QuestionBankConfig` | `HRRoutes.tsx:77` |
| `/hr/onboarding` | **YES** | HROnboarding | `@/pages/HROnboarding` | `HRRoutes.tsx:78` |
| `/hr/vacation-sick` | **YES** | HRVacationSick | `@/pages/HRVacationSick` | `HRRoutes.tsx:79` |
| `/hr/succession` | **YES** | HRSuccessionPlanning | `@/pages/HRSuccessionPlanning` | `HRRoutes.tsx:80` |
| `/hr/offboarding` | **YES** | HROffboarding | `@/pages/HROffboarding` | `HRRoutes.tsx:81` |
| `/hr/health-monitoring` | **YES** | HRHealthMonitoring | `@/pages/HRHealthMonitoring` | `HRRoutes.tsx:82` |
| `/hr/career-path` | **YES** | HRCareerPath | `@/pages/HRCareerPath` | `HRRoutes.tsx:83` |
| `/hr/safety` | **YES** | HRSafety | `@/pages/HRSafety` | `HRRoutes.tsx:84` |
| `/hr/recruiter-kpi` | NO | RecruiterKPIPage | `@/pages/RecruiterKPIPage` | `HRRoutes.tsx:85` |
| `/hr/reception` | **YES** | ReceptionPage | `@/pages/ReceptionPage` | `HRRoutes.tsx:86` |
| `/hr/daily-reports` | **YES** | DailyReportPage | `@/pages/DailyReportPage` | `HRRoutes.tsx:87` |
| `/hr/assets` | redir | HRAssetManagement | `@/pages/HRAssetManagement` | `HRRoutes.tsx:88` |
| `/hr/referrals` | **YES** | ReferralPage | `@/pages/ReferralPage` | `HRRoutes.tsx:89` |
| `/hr/candidate-report/:id` | dyn | CandidateReport | `@/pages/CandidateReport` | `HRRoutes.tsx:90` |
| `/hr/brand` | **YES** | HRBrandPage | `@/pages/HRBrandPage` | `HRRoutes.tsx:91` |
| `/weekly-plan` | **YES** | WeeklyPlanPage | `@/pages/WeeklyPlanPage` | `HRRoutes.tsx:92` |
| `/hr/inspection` | NO | InspectionPage | `@/pages/InspectionPage` | `HRRoutes.tsx:93` |
| `/hr/pip` | NO | HRPip | `@/pages/HRPip` | `HRRoutes.tsx:95` |
| `/hr/gamification` | NO | HRGamification | `@/pages/HRGamification` | `HRRoutes.tsx:96` |
| `/hr/birthdays` | nav | HRBirthdays | `@/pages/HRBirthdays` | `HRRoutes.tsx:97` |
| `/discipline` | **YES** | Discipline | `@/pages/Discipline` | `HRRoutes.tsx:98` |
| `/hr/conflict` | NO | HRConflict | `@/pages/HRConflict` | `HRRoutes.tsx:99` |
| `/hr/alumni` | NO | HRAlumni | `@/pages/HRAlumni` | `HRRoutes.tsx:100` |
| `/hr/enps` | NO | HREnps | `@/pages/HREnps` | `HRRoutes.tsx:101` |
| `/questionnaire` | NO | Questionnaire | `@/pages/Questionnaire` | `HRRoutes.tsx:102` |
| `/questionnaire-templates` | NO | QuestionnaireTemplates | `@/pages/QuestionnaireTemplates` | `HRRoutes.tsx:103` |
| `/seven-functions` | NO | SevenFunctions | `@/pages/SevenFunctions` | `HRRoutes.tsx:104` |
| `/raci-matrix` | NO | RaciMatrix | `@/pages/RaciMatrix` | `HRRoutes.tsx:105` |
| `/hr/milestones` | nav | HRMilestones | `@/pages/HRMilestones` | `HRRoutes.tsx:106` |
| `/hr/job-descriptions` | NO | JobDescriptionsPage | `@/pages/JobDescriptionsPage` | `HRRoutes.tsx:107` |

#### `INTEGRATION_ROUTES` — 7 marshrut

| Yo'l | Sidebar | Komponent | Manba | Route |
|---|---|---|---|---|
| `/integration/gl-posting` | NO | GLPostingMonitor | `@/pages/GLPostingMonitor` | `AdminRoutes.tsx:54` |
| `/integration/invoice-verification` | NO | InvoiceVerification | `@/pages/InvoiceVerification` | `AdminRoutes.tsx:55` |
| `/integration/expense-management` | **YES** | ExpenseManagement | `@/pages/ExpenseManagement` | `AdminRoutes.tsx:56` |
| `/integration/mro` | **YES** | MRODashboard | `@/pages/MRODashboard` | `AdminRoutes.tsx:57` |
| `/integration/vendor-performance` | **YES** | VendorPerformance | `@/pages/VendorPerformance` | `AdminRoutes.tsx:58` |
| `/integration/employee-rating` | **YES** | EmployeeRating | `@/pages/EmployeeRating` | `AdminRoutes.tsx:59` |
| `/integration/hr-lms` | **YES** | HRLMSSkills | `@/pages/HRLMSSkills` | `AdminRoutes.tsx:60` |

#### `IOT_ROUTES` — 10 marshrut

| Yo'l | Sidebar | Komponent | Manba | Route |
|---|---|---|---|---|
| `/iot/sensor-monitoring` | **YES** | IoTExtended | `@/pages/IoTExtended` | `ProductionRoutes.tsx:214` |
| `/iot/predictive-maintenance` | **YES** | IoTExtended | `@/pages/IoTExtended` | `ProductionRoutes.tsx:215` |
| `/iot/oee-live` | **YES** | IoTExtended | `@/pages/IoTExtended` | `ProductionRoutes.tsx:216` |
| `/iot/digital-twin` | **YES** | IoTExtended | `@/pages/IoTExtended` | `ProductionRoutes.tsx:217` |
| `/iot/alerts` | **YES** | IoTExtended | `@/pages/IoTExtended` | `ProductionRoutes.tsx:218` |
| `/iot/tablet` | **YES** | IoTTablet | `@/pages/IoTTablet` | `ProductionRoutes.tsx:219` |
| `/iot/dashboard` | **YES** | IoTDashboard | `@/pages/IoTDashboard` | `ProductionRoutes.tsx:220` |
| `/iot/sensor-capex` | **YES** | IotSensorCapex | `@/pages/IotSensorCapex` | `ProductionRoutes.tsx:221` |
| `/iot/material-kits` | NO | WarehouseMaterialKits | `@/pages/WarehouseMaterialKits` | `ProductionRoutes.tsx:222` |
| `/iot/daily-view` | **YES** | WarehouseDailyView | `@/pages/WarehouseDailyView` | `ProductionRoutes.tsx:223` |

#### `KAIZEN_ROUTES` — 1 marshrut

| Yo'l | Sidebar | Komponent | Manba | Route |
|---|---|---|---|---|
| `/kaizen` | **YES** | KaizenPage | `@/pages/KaizenPage` | `AdminRoutes.tsx:88` |

#### `LMS_ADMIN_ROUTES` — 4 marshrut

| Yo'l | Sidebar | Komponent | Manba | Route |
|---|---|---|---|---|
| `/lms/test-management` | **YES** | LMSExtended | `@/pages/LMSExtended` | `AdminRoutes.tsx:73` |
| `/lms/course-author` | **YES** | LMSExtended | `@/pages/LMSExtended` | `AdminRoutes.tsx:74` |
| `/lms/operator-certification` | **YES** | LMSExtended | `@/pages/LMSExtended` | `AdminRoutes.tsx:75` |
| `/lms/learning-budget` | **YES** | LMSExtended | `@/pages/LMSExtended` | `AdminRoutes.tsx:76` |

#### `LMS_LEARNER_ROUTES` — 5 marshrut

| Yo'l | Sidebar | Komponent | Manba | Route |
|---|---|---|---|---|
| `/lms/leaderboard` | **YES** | LMSExtended | `@/pages/LMSExtended` | `AdminRoutes.tsx:80` |
| `/lms/knowledge-base` | **YES** | KnowledgeBase | `@/pages/KnowledgeBase` | `AdminRoutes.tsx:81` |
| `/lms/micro-learning` | **YES** | LMSExtended | `@/pages/LMSExtended` | `AdminRoutes.tsx:82` |
| `/lms/gamification` | NO | LMSExtended | `@/pages/LMSExtended` | `AdminRoutes.tsx:83` |
| `/lms/support` | nav | LMSSupport | `@/pages/LMSSupport` | `AdminRoutes.tsx:84` |

#### `MARKETING_ROUTES` — 16 marshrut

| Yo'l | Sidebar | Komponent | Manba | Route |
|---|---|---|---|---|
| `/marketing/dashboard` | **YES** | MarketingDashboard | `@/pages/MarketingDashboard` | `CRMRoutes.tsx:92` |
| `/marketing/campaigns` | **YES** | MarketingCampaigns | `@/pages/MarketingCampaigns` | `CRMRoutes.tsx:93` |
| `/marketing/content` | **YES** | MarketingContent | `@/pages/MarketingContent` | `CRMRoutes.tsx:94` |
| `/marketing/leads` | **YES** | MarketingLeads | `@/pages/MarketingLeads` | `CRMRoutes.tsx:95` |
| `/marketing/calendar` | **YES** | MarketingCalendar | `@/pages/MarketingCalendar` | `CRMRoutes.tsx:96` |
| `/marketing/exhibitions` | **YES** | MarketingExhibitions | `@/pages/MarketingExhibitions` | `CRMRoutes.tsx:97` |
| `/marketing/pr` | **YES** | MarketingPR | `@/pages/MarketingPR` | `CRMRoutes.tsx:98` |
| `/marketing/budget` | **YES** | MarketingBudget | `@/pages/MarketingBudget` | `CRMRoutes.tsx:99` |
| `/marketing/settings` | **YES** | MarketingSettings | `@/pages/MarketingSettings` | `CRMRoutes.tsx:100` |
| `/marketing/social-inbox` | **YES** | MarketingSocialInbox | `@/pages/MarketingSocialInbox` | `CRMRoutes.tsx:101` |
| `/marketing/website-cms` | **YES** | MarketingWebsiteCMS | `@/pages/MarketingWebsiteCMS` | `CRMRoutes.tsx:102` |
| `/marketing/analytics` | **YES** | MarketingExtended | `@/pages/MarketingExtended` | `CRMRoutes.tsx:103` |
| `/marketing/seo` | **YES** | MarketingExtended | `@/pages/MarketingExtended` | `CRMRoutes.tsx:104` |
| `/marketing/ab-testing` | **YES** | MarketingExtended | `@/pages/MarketingExtended` | `CRMRoutes.tsx:105` |
| `/marketing/competitors` | **YES** | MarketingExtended | `@/pages/MarketingExtended` | `CRMRoutes.tsx:106` |
| `/marketing/nps-churn` | **YES** | MarketingExtended | `@/pages/MarketingExtended` | `CRMRoutes.tsx:107` |

#### `MES_ROUTES` — 12 marshrut

| Yo'l | Sidebar | Komponent | Manba | Route |
|---|---|---|---|---|
| `/mes/dashboard-home` | **YES** | MESHomeDashboard | `@/pages/MESHomeDashboard` | `ProductionRoutes.tsx:145` |
| `/mes/work-centers` | **YES** | MESWorkCenters | `@/pages/MESWorkCenters` | `ProductionRoutes.tsx:146` |
| `/mes/products` | **YES** | MESProducts | `@/pages/MESProducts` | `ProductionRoutes.tsx:147` |
| `/mes/downtimes` | **YES** | MESDowntimes | `@/pages/MESDowntimes` | `ProductionRoutes.tsx:148` |
| `/mes/workers` | **YES** | MESWorkerAssignments | `@/pages/MESWorkerAssignments` | `ProductionRoutes.tsx:149` |
| `/mes/oee-monitor` | **YES** | MESExtended | `@/pages/MESExtended` | `ProductionRoutes.tsx:150` |
| `/mes/reason-log` | **YES** | MESExtended | `@/pages/MESExtended` | `ProductionRoutes.tsx:151` |
| `/mes/zone-management` | **YES** | MESExtended | `@/pages/MESExtended` | `ProductionRoutes.tsx:152` |
| `/mes/maintenance-request` | **YES** | MESExtended | `@/pages/MESExtended` | `ProductionRoutes.tsx:153` |
| `/mes/gamification` | **YES** | MESExtended | `@/pages/MESExtended` | `ProductionRoutes.tsx:154` |
| `/mes/machine-norms` | **YES** | MESExtended | `@/pages/MESExtended` | `ProductionRoutes.tsx:155` |
| `/mes/smena-handover` | **YES** | MESExtended | `@/pages/MESExtended` | `ProductionRoutes.tsx:156` |

#### `MRO_ROUTES` — 12 marshrut

| Yo'l | Sidebar | Komponent | Manba | Route |
|---|---|---|---|---|
| `/mro/dashboard` | **YES** | MRODashboard | `@/pages/MRODashboard` | `ProductionRoutes.tsx:199` |
| `/mro/preventive` | **YES** | PreventiveMaintenancePage | `@/pages/mro/PreventiveMaintenancePage` | `ProductionRoutes.tsx:200` |
| `/mro/spare-parts` | **YES** | SparePartsPage | `@/pages/mro/SparePartsPage` | `ProductionRoutes.tsx:201` |
| `/mro/utilities` | **YES** | UtilityReadingsPage | `@/pages/mro/UtilityReadingsPage` | `ProductionRoutes.tsx:202` |
| `/mro/expense-control` | **YES** | MROExtended | `@/pages/MROExtended` | `ProductionRoutes.tsx:203` |
| `/mro/kitchen` | **YES** | CanteenManagementPage | `@/pages/mro/CanteenManagementPage` | `ProductionRoutes.tsx:204` |
| `/mro/uniforms` | **YES** | MROExtended | `@/pages/MROExtended` | `ProductionRoutes.tsx:205` |
| `/mro/office-inventory` | **YES** | FacilityInventoryPage | `@/pages/mro/FacilityInventoryPage` | `ProductionRoutes.tsx:206` |
| `/mro/cleaning` | **YES** | CleaningSchedulePage | `@/pages/mro/CleaningSchedulePage` | `ProductionRoutes.tsx:207` |
| `/mro/sanitation` | **YES** | MROExtended | `@/pages/MROExtended` | `ProductionRoutes.tsx:208` |
| `/mro/building-inventory` | **YES** | FacilityInventoryPage | `@/pages/mro/FacilityInventoryPage` | `ProductionRoutes.tsx:209` |
| `/mro/settings` | **YES** | MROSettings | `@/pages/MROSettings` | `ProductionRoutes.tsx:210` |

#### `ORDERS_REGISTRY_ROUTES` — 1 marshrut

| Yo'l | Sidebar | Komponent | Manba | Route |
|---|---|---|---|---|
| `/orders-registry` | NO | OrdersRegistry | `@/pages/OrdersRegistry` | `AdminRoutes.tsx:92` |

#### `PRODUCTION_ROUTES` — 47 marshrut

| Yo'l | Sidebar | Komponent | Manba | Route |
|---|---|---|---|---|
| `/erp-production` | NO | ERPProduction | `@/pages/ERPProduction` | `ProductionRoutes.tsx:95` |
| `/production/orders` | **YES** | ProductionReport | `@/pages/ProductionReport` | `ProductionRoutes.tsx:96` |
| `/production/orders/:id` | dyn | ProductionOrder360 | `@/pages/ProductionOrder360` | `ProductionRoutes.tsx:97` |
| `/planning` | **YES** | PlanningBoard | `@/pages/PlanningBoard` | `ProductionRoutes.tsx:98` |
| `/ai-production-planning` | **YES** | AIProductionPlanning | `@/pages/AIProductionPlanning` | `ProductionRoutes.tsx:99` |
| `/pp/ai-reservation` | **YES** | AIReservation | `@/pages/AIReservation` | `ProductionRoutes.tsx:100` |
| `/papka-orders` | **YES** | PapkaOrders | `@/pages/PapkaOrders` | `ProductionRoutes.tsx:101` |
| `/order-create` | **YES** | OrderCreationWizard | `@/pages/OrderCreationWizard` | `ProductionRoutes.tsx:102` |
| `/order-approval` | NO | OrderApprovalWorkflow | `@/pages/OrderApprovalWorkflow` | `ProductionRoutes.tsx:103` |
| `/pp/dashboard` | **YES** | PPDashboard | `@/pages/PPDashboard` | `ProductionRoutes.tsx:104` |
| `/pp/queue` | **YES** | PPQueue | `@/pages/PPQueue` | `ProductionRoutes.tsx:105` |
| `/pp/reason-codes` | **YES** | PPReasonCodes | `@/pages/PPReasonCodes` | `ProductionRoutes.tsx:106` |
| `/pp/weekly-plan` | **YES** | PPWeeklyPlan | `@/pages/PPWeeklyPlan` | `ProductionRoutes.tsx:107` |
| `/erp/pp/bom` | **YES** | BOMManagement | `@/pages/BOMManagement` | `ProductionRoutes.tsx:108` |
| `/erp/pp/routing` | **YES** | RoutingConfiguration | `@/pages/RoutingConfiguration` | `ProductionRoutes.tsx:109` |
| `/erp/pp/capacity` | **YES** | CapacityPlanning | `@/pages/CapacityPlanning` | `ProductionRoutes.tsx:110` |
| `/pp/gofra-config` | NO | GofraFluteConfig | `@/pages/GofraFluteConfig` | `ProductionRoutes.tsx:111` |
| `/pp/gofra-waste-config` | NO | GofraWasteConfig | `@/pages/GofraWasteConfig` | `ProductionRoutes.tsx:112` |
| `/pp/work-center-norms` | NO | WorkCenterNormsConfig | `@/pages/WorkCenterNormsConfig` | `ProductionRoutes.tsx:113` |
| `/technology` | NO | Technology | `@/pages/Technology` | `ProductionRoutes.tsx:114` |
| `/tech/dashboard-home` | redir | TechDashboard | `@/pages/TechDashboard` | `ProductionRoutes.tsx:115` |
| `/tech-approval` | nav | TechApproval | `@/pages/TechApproval` | `ProductionRoutes.tsx:116` |
| `/tech-cards` | nav | TechCards | `@/pages/TechCards` | `ProductionRoutes.tsx:117` |
| `/tech/cards` | **YES** | TechCards | `@/pages/TechCards` | `ProductionRoutes.tsx:118` |
| `/tech/material-alternatives` | **YES** | TechPPExtended | `@/pages/TechPPExtended` | `ProductionRoutes.tsx:119` |
| `/tech/machine-selection` | **YES** | TechPPExtended | `@/pages/TechPPExtended` | `ProductionRoutes.tsx:120` |
| `/tech/time-cost` | **YES** | TechPPExtended | `@/pages/TechPPExtended` | `ProductionRoutes.tsx:121` |
| `/tech/cost-optimization` | **YES** | TechPPExtended | `@/pages/TechPPExtended` | `ProductionRoutes.tsx:122` |
| `/tech/client-requirements` | **YES** | TechPPExtended | `@/pages/TechPPExtended` | `ProductionRoutes.tsx:123` |
| `/tech/change-history` | **YES** | TechPPExtended | `@/pages/TechPPExtended` | `ProductionRoutes.tsx:124` |
| `/tech/parallel-orders` | **YES** | TechPPExtended | `@/pages/TechPPExtended` | `ProductionRoutes.tsx:125` |
| `/pp/shift-management` | **YES** | AIShiftManagementPage | `@/pages/ai-planning/AIShiftManagementPage` | `ProductionRoutes.tsx:126` |
| `/pp/parallel-processes` | **YES** | TechPPExtended | `@/pages/TechPPExtended` | `ProductionRoutes.tsx:127` |
| `/pp/rush-orders` | **YES** | RushOrderPage | `@/pages/ai-planning/RushOrderPage` | `ProductionRoutes.tsx:128` |
| `/pp/bottleneck` | **YES** | BottleneckAnalysisPage | `@/pages/ai-planning/BottleneckAnalysisPage` | `ProductionRoutes.tsx:129` |
| `/pp/mrp` | NO | MrpMatrix | `@/pages/MrpMatrix` | `ProductionRoutes.tsx:130` |
| `/pp/crp` | NO | CrpPage | `@/pages/CrpPage` | `ProductionRoutes.tsx:131` |
| `/pp/equipment` | NO | PPEquipmentPage | `@/pages/PPEquipmentPage` | `ProductionRoutes.tsx:132` |
| `/pp/demand-forecast` | **YES** | DemandForecastingPage | `@/pages/ai-planning/DemandForecastingPage` | `ProductionRoutes.tsx:133` |
| `/pp/what-if` | **YES** | TechPPExtended | `@/pages/TechPPExtended` | `ProductionRoutes.tsx:134` |
| `/pp/delivery-calculator` | **YES** | TechPPExtended | `@/pages/TechPPExtended` | `ProductionRoutes.tsx:135` |
| `/pp/energy-optimization` | **YES** | TechPPExtended | `@/pages/TechPPExtended` | `ProductionRoutes.tsx:136` |
| `/pp/oee-monitor` | **YES** | OEELiveMonitorPage | `@/pages/ai-planning/OEELiveMonitorPage` | `ProductionRoutes.tsx:137` |
| `/pp/kpi-deviation` | **YES** | TechPPExtended | `@/pages/TechPPExtended` | `ProductionRoutes.tsx:138` |
| `/pp/realtime-progress` | **YES** | TechPPExtended | `@/pages/TechPPExtended` | `ProductionRoutes.tsx:139` |
| `/finance/approval` | **YES** | FinanceApproval | `@/pages/FinanceApproval` | `ProductionRoutes.tsx:140` |
| `/design/approval` | **YES** | DesignApproval | `@/pages/DesignApproval` | `ProductionRoutes.tsx:141` |

#### `QC_ROUTES` — 21 marshrut

| Yo'l | Sidebar | Komponent | Manba | Route |
|---|---|---|---|---|
| `/qc/dashboard-home` | redir | QCDashboard | `@/pages/QCDashboard` | `ProductionRoutes.tsx:160` |
| `/qc-module` | nav | QCModule | `@/pages/QCModule` | `ProductionRoutes.tsx:161` |
| `/print/ink-coverage` | NO | InkCoverageCalculator | `@/pages/InkCoverageCalculator` | `ProductionRoutes.tsx:162` |
| `/print/imposition` | NO | ImpositionCalculator | `@/pages/ImpositionCalculator` | `ProductionRoutes.tsx:163` |
| `/qc/approval` | **YES** | QCApproval | `@/pages/QCApproval` | `ProductionRoutes.tsx:164` |
| `/qc/final` | **YES** | QCFinalInspection | `@/pages/QCFinalInspection` | `ProductionRoutes.tsx:165` |
| `/qc/lab` | **YES** | QCExtended | `@/pages/QCExtended` | `ProductionRoutes.tsx:166` |
| `/qc/paper-parameters` | NO | PaperParametersPage | `@/pages/qc/PaperParametersPage` | `ProductionRoutes.tsx:167` |
| `/qc/vendor-quality` | **YES** | SupplierQualityPage | `@/pages/qc/SupplierQualityPage` | `ProductionRoutes.tsx:168` |
| `/qc/defect-management` | **YES** | DefectManagementPage | `@/pages/qc/DefectManagementPage` | `ProductionRoutes.tsx:169` |
| `/qc/complaints` | **YES** | ReclamationsPage | `@/pages/qc/ReclamationsPage` | `ProductionRoutes.tsx:170` |
| `/qc/certificates` | **YES** | QualityCertificatesPage | `@/pages/qc/QualityCertificatesPage` | `ProductionRoutes.tsx:171` |
| `/qc/iso` | **YES** | QCExtended | `@/pages/QCExtended` | `ProductionRoutes.tsx:172` |
| `/qc/trends` | **YES** | QualityTrendPage | `@/pages/qc/QualityTrendPage` | `ProductionRoutes.tsx:173` |
| `/qc/dpmo-calculator` | **YES** | QcDpmoCalculator | `@/pages/qc/QcDpmoCalculator` | `ProductionRoutes.tsx:174` |
| `/qc/in-process` | **YES** | InProcessQcPage | `@/pages/qc/InProcessQcPage` | `ProductionRoutes.tsx:175` |
| `/qc/root-causes` | **YES** | RootCausesPage | `@/pages/qc/RootCausesPage` | `ProductionRoutes.tsx:176` |
| `/qc/ai-analysis` | **YES** | QCExtended | `@/pages/QCExtended` | `ProductionRoutes.tsx:177` |
| `/qc/reports` | **YES** | QCExtended | `@/pages/QCExtended` | `ProductionRoutes.tsx:178` |
| `/qc/settings` | **YES** | QCExtended | `@/pages/QCExtended` | `ProductionRoutes.tsx:179` |
| `/qc/parameters-config` | NO | QcParametersConfig | `@/pages/qc/QcParametersConfig` | `ProductionRoutes.tsx:180` |

#### `SAAS_ROUTES` — 6 marshrut

| Yo'l | Sidebar | Komponent | Manba | Route |
|---|---|---|---|---|
| `/saas/tenant-management` | **YES** | SaaSExtended | `@/pages/SaaSExtended` | `AdminRoutes.tsx:64` |
| `/saas/onboarding` | **YES** | SaaSExtended | `@/pages/SaaSExtended` | `AdminRoutes.tsx:65` |
| `/saas/licensing` | **YES** | SaaSExtended | `@/pages/SaaSExtended` | `AdminRoutes.tsx:66` |
| `/saas/module-control` | **YES** | SaaSExtended | `@/pages/SaaSExtended` | `AdminRoutes.tsx:67` |
| `/saas/monitoring` | **YES** | SaaSExtended | `@/pages/SaaSExtended` | `AdminRoutes.tsx:68` |
| `/saas/error-log` | **YES** | SaaSExtended | `@/pages/SaaSExtended` | `AdminRoutes.tsx:69` |

#### `SALES_ROUTES` — 37 marshrut

| Yo'l | Sidebar | Komponent | Manba | Route |
|---|---|---|---|---|
| `/ai/crm` | **YES** | AiCrmPage | `@/pages/AiCrmPage` | `CRMRoutes.tsx:50` |
| `/ai-crm` | NO | AiCrmPage | `@/pages/AiCrmPage` | `CRMRoutes.tsx:51` |
| `/crm-workspace` | **YES** | CRMWorkspace | `@/pages/CRMWorkspace` | `CRMRoutes.tsx:52` |
| `/crm/funnel` | NO | CrmFunnelAnalytics | `@/pages/CrmFunnelAnalytics` | `CRMRoutes.tsx:53` |
| `/crm/rfm` | NO | CrmRfmClusters | `@/pages/CrmRfmClusters` | `CRMRoutes.tsx:54` |
| `/crm/cohort` | NO | CrmCohortAnalysis | `@/pages/CrmCohortAnalysis` | `CRMRoutes.tsx:55` |
| `/crm/activities` | NO | CRMActivities | `@/pages/CRMActivities` | `CRMRoutes.tsx:56` |
| `/crm/settings` | NO | CRMSettings | `@/pages/CRMSettings` | `CRMRoutes.tsx:57` |
| `/crm/funnel-settings` | **YES** | CRMFunnelSettings | `@/pages/CRMFunnelSettings` | `CRMRoutes.tsx:58` |
| `/erp/sales` | redir | SalesOrders | `@/pages/SalesOrders` | `CRMRoutes.tsx:59` |
| `/sd/quotations` | NO | SDSalesQuotes | `@/pages/SDSalesQuotes` | `CRMRoutes.tsx:62` |
| `/sd/crm` | NO | SDEuroprint | `@/pages/SDEuroprint` | `CRMRoutes.tsx:63` |
| `/sd/dashboard` | **YES** | SDDashboard | `@/pages/SDDashboard` | `CRMRoutes.tsx:64` |
| `/sd/customers` | **YES** | SDCustomers | `@/pages/SDCustomers` | `CRMRoutes.tsx:65` |
| `/sd/customers/:id` | dyn | Customer360Page | `@/pages/Customer360Page` | `CRMRoutes.tsx:66` |
| `/crm/customer/:id` | dyn | Customer360Page | `@/pages/Customer360Page` | `CRMRoutes.tsx:67` |
| `/sd/sales-quotes` | **YES** | SDSalesQuotes | `@/pages/SDSalesQuotes` | `CRMRoutes.tsx:68` |
| `/sd/sales-orders` | **YES** | SDSalesOrders | `@/pages/SDSalesOrders` | `CRMRoutes.tsx:69` |
| `/sd/orders/:id` | dyn | SDOrderDetail | `@/pages/SDOrderDetail` | `CRMRoutes.tsx:70` |
| `/sd/sales-payments` | **YES** | SDSalesPayments | `@/pages/SDSalesPayments` | `CRMRoutes.tsx:71` |
| `/sd/sales-management` | NO | SDSalesManagement | `@/pages/SDSalesManagement` | `CRMRoutes.tsx:72` |
| `/sd/invoices` | NO | SDSalesManagement | `@/pages/SDSalesManagement` | `CRMRoutes.tsx:73` |
| `/sd/forecast` | NO | SDSalesManagement | `@/pages/SDSalesManagement` | `CRMRoutes.tsx:74` |
| `/sd/analytics` | NO | SDSalesManagement | `@/pages/SDSalesManagement` | `CRMRoutes.tsx:75` |
| `/sd/commission` | NO | SDSalesManagement | `@/pages/SDSalesManagement` | `CRMRoutes.tsx:76` |
| `/sd/kpi` | **YES** | SDKpi | `@/pages/SDKpi` | `CRMRoutes.tsx:77` |
| `/sd/contracts` | **YES** | SDContracts | `@/pages/SDContracts` | `CRMRoutes.tsx:78` |
| `/sd/settings` | **YES** | SDSettings | `@/pages/SDSettings` | `CRMRoutes.tsx:79` |
| `/sd/debitors` | NO | SDDebitors | `@/pages/SDDebitors` | `CRMRoutes.tsx:80` |
| `/sd/dashboard/overview` | NO | SDOverviewDashboard | `@/pages/SDOverviewDashboard` | `CRMRoutes.tsx:81` |
| `/sd/dashboard/quota` | redir | SDQuotaDashboard | `@/pages/SDQuotaDashboard` | `CRMRoutes.tsx:82` |
| `/sd/manager-panel` | NO | SDExtended | `@/pages/SDExtended` | `CRMRoutes.tsx:83` |
| `/sd/warehouse-rental` | **YES** | SDExtended | `@/pages/SDExtended` | `CRMRoutes.tsx:84` |
| `/sd/advance-control` | **YES** | SDExtended | `@/pages/SDExtended` | `CRMRoutes.tsx:85` |
| `/sd/leads` | NO | SDLeads | `@/pages/SDLeads` | `CRMRoutes.tsx:86` |
| `/sd/deliveries` | NO | SDDeliveries | `@/pages/SDDeliveries` | `CRMRoutes.tsx:87` |
| `/sd/lost-orders` | **YES** | SDLostOrders | `@/pages/SDLostOrders` | `CRMRoutes.tsx:88` |

#### `SELF_SERVICE_ROUTES` — 1 marshrut

| Yo'l | Sidebar | Komponent | Manba | Route |
|---|---|---|---|---|
| `/hr/internal-jobs` | NO | InternalJobBoard | `@/pages/InternalJobBoard` | `HRRoutes.tsx:116` |

#### `STUB_ROUTES` — 49 marshrut

| Yo'l | Sidebar | Komponent | Manba | Route |
|---|---|---|---|---|
| `/360` | NO | Customer360Page | `@/pages/Customer360Page` | `StubRoutes.tsx:63` |
| `/ai` | NO | AgentsHubPage | `@/pages/agents/AgentsHub` | `StubRoutes.tsx:64` |
| `/ai-camera` | NO | CameraAIAnalyticsPage | `@/pages/CameraAIAnalytics` | `StubRoutes.tsx:65` |
| `/ai-exam` | NO | AIExamsPage | `@/pages/AIExams` | `StubRoutes.tsx:66` |
| `/ai/hr` | NO | HRAIDashboardPage | `@/pages/HRAIDashboard` | `StubRoutes.tsx:67` |
| `/ai/marketing` | NO | AiCrmPageComponent | `@/pages/AiCrmPage` | `StubRoutes.tsx:68` |
| `/ai-planning` | NO | AIProductionPlanningPage | `@/pages/AIProductionPlanning` | `StubRoutes.tsx:69` |
| `/ai/wms` | NO | WmsAnalyticsPage | `@/pages/WmsAnalyticsPage` | `StubRoutes.tsx:70` |
| `/assignments` | NO | MESWorkerAssignmentsPage | `@/pages/MESWorkerAssignments` | `StubRoutes.tsx:71` |
| `/insights` | NO | AnalyticsPage | `@/pages/Analytics` | `StubRoutes.tsx:72` |
| `/integration/requests` | NO | IntegrationMgmtPage | `@/pages/IntegrationManagement` | `StubRoutes.tsx:73` |
| `/iot-enhanced` | NO | IoTExtendedPage | `@/pages/IoTExtended` | `StubRoutes.tsx:74` |
| `/video-progress` | NO | LessonPlayerPage | `@/pages/LessonPlayer` | `StubRoutes.tsx:75` |
| `/3way-match` | NO | ThreeWayMatchPage | `@/pages/ThreeWayMatchPage` | `StubRoutes.tsx:97` |
| `/achievements` | NO | AchievementsPage | `@/pages/AchievementsPage` | `StubRoutes.tsx:98` |
| `/ai/automation` | NO | AiAutomationPage | `@/pages/AiAutomationPage` | `StubRoutes.tsx:99` |
| `/application-responses` | NO | ApplicationResponsesPage | `@/pages/ApplicationResponsesPage` | `StubRoutes.tsx:100` |
| `/approval-workflow` | NO | ApprovalWorkflowPage | `@/pages/ApprovalWorkflowPage` | `StubRoutes.tsx:101` |
| `/attempts` | NO | AttemptsPage | `@/pages/AttemptsPage` | `StubRoutes.tsx:102` |
| `/calendar-events` | NO | CalendarEventsPage | `@/pages/CalendarEventsPage` | `StubRoutes.tsx:103` |
| `/candidates` | NO | CandidatesPage | `@/pages/CandidatesPage` | `StubRoutes.tsx:104` |
| `/company-state` | NO | CompanyStatePage | `@/pages/CompanyStatePage` | `StubRoutes.tsx:105` |
| `/daily-attendance` | NO | AttendancePage | `@/pages/AttendanceMonitorPage` | `StubRoutes.tsx:106` |
| `/employee-files` | redir | EmployeeFilesPage | `@/pages/EmployeeFilesPage` | `StubRoutes.tsx:107` |
| `/employee-productivity` | NO | EmployeeProductivityPage | `@/pages/EmployeeProductivityPage` | `StubRoutes.tsx:108` |
| `/employee-zone-history` | NO | EmployeeZoneHistoryPage | `@/pages/EmployeeZoneHistoryPage` | `StubRoutes.tsx:109` |
| `/equipment` | NO | EquipmentPage | `@/pages/EquipmentPage` | `StubRoutes.tsx:110` |
| `/europrint-control` | NO | EuroprintControlPage | `@/pages/EuroprintControlPage` | `StubRoutes.tsx:111` |
| `/gl` | NO | GLDocumentsPage | `@/pages/GLDocuments` | `StubRoutes.tsx:112` |
| `/hr/zno` | NO | HRZnoPage | `@/pages/HRZnoPage` | `StubRoutes.tsx:113` |
| `/hr/zvs` | NO | HRZvsPage | `@/pages/HRZvsPage` | `StubRoutes.tsx:114` |
| `/iot-sensors` | NO | IotSensorsPage | `@/pages/IotSensorsPage` | `StubRoutes.tsx:115` |
| `/machine-status-current` | NO | MachineStatusPage | `@/pages/MachineStatusPage` | `StubRoutes.tsx:116` |
| `/machine-status-logs` | NO | MachineStatusPage | `@/pages/MachineStatusPage` | `StubRoutes.tsx:117` |
| `/material-cards` | NO | MaterialCardsPage | `@/pages/MaterialCardsPage` | `StubRoutes.tsx:118` |
| `/mentors` | NO | MentorsPage | `@/pages/MentorsPage` | `StubRoutes.tsx:119` |
| `/mentorships` | NO | MentorshipsPage | `@/pages/MentorshipsPage` | `StubRoutes.tsx:120` |
| `/okr` | NO | OkrPage | `@/pages/OkrPage` | `StubRoutes.tsx:121` |
| `/order-status` | NO | OrderStatusPage | `@/pages/OrderStatusPage` | `StubRoutes.tsx:122` |
| `/production-facts` | NO | ProductionFactsPage | `@/pages/ProductionFactsPage` | `StubRoutes.tsx:123` |
| `/production/shift-reports` | NO | ShiftReportsPage | `@/pages/ShiftReportsPage` | `StubRoutes.tsx:124` |
| `/quality-defects-camera` | NO | QualityDefectsCameraPage | `@/pages/QualityDefectsCameraPage` | `StubRoutes.tsx:125` |
| `/questions` | NO | QuestionsPage | `@/pages/QuestionsPage` | `StubRoutes.tsx:126` |
| `/raci-crisis` | NO | RaciCrisisPage | `@/pages/RaciCrisisPage` | `StubRoutes.tsx:127` |
| `/raw-materials` | NO | RawMaterialsPage | `@/pages/RawMaterialsPage` | `StubRoutes.tsx:128` |
| `/safety-violations` | NO | SafetyViolationsPage | `@/pages/SafetyViolationsPage` | `StubRoutes.tsx:129` |
| `/users` | NO | UsersPage | `@/pages/UsersPage` | `StubRoutes.tsx:130` |
| `/waste` | NO | WastePage | `@/pages/WastePage` | `StubRoutes.tsx:131` |
| `/weekly-plans` | NO | WeeklyPlansPage | `@/pages/WeeklyPlansPage` | `StubRoutes.tsx:132` |

#### `WAREHOUSE_ROUTES` — 55 marshrut

| Yo'l | Sidebar | Komponent | Manba | Route |
|---|---|---|---|---|
| `/wms/overview` | **YES** | WarehouseDashboardPage | `@/pages/WarehouseDashboardPage` | `WarehouseRoutes.tsx:55` |
| `/wms/procurement` | **YES** | ProcurementPage | `@/pages/ProcurementPage` | `WarehouseRoutes.tsx:56` |
| `/wms/warehouses` | **YES** | WarehousesPage | `@/pages/WarehousesPage` | `WarehouseRoutes.tsx:57` |
| `/wms/warehouse-stock/:id` | dyn | WarehouseStockPage | `@/pages/WarehouseStockPage` | `WarehouseRoutes.tsx:58` |
| `/warehouse/finished-goods` | **YES** | FinishedGoodsStockPage | `@/pages/FinishedGoodsStock` | `WarehouseRoutes.tsx:59` |
| `/wms/warehouses/:type` | dyn | WarehouseTypePage | `@/pages/WarehouseTypePage` | `WarehouseRoutes.tsx:60` |
| `/wms/pos-monitor` | NO | PosMonitorPage | `@/pages/PosMonitorPage` | `WarehouseRoutes.tsx:61` |
| `/warehouse/inventory-count` | NO | InventoryCount | `@/pages/InventoryCount` | `WarehouseRoutes.tsx:63` |
| `/warehouse/goods-receiving` | NO | GoodsReceiving | `@/pages/GoodsReceiving` | `WarehouseRoutes.tsx:64` |
| `/warehouse/reservations` | NO | StockReservation | `@/pages/StockReservation` | `WarehouseRoutes.tsx:65` |
| `/warehouse/reports` | NO | WarehouseReports | `@/pages/WarehouseReports` | `WarehouseRoutes.tsx:66` |
| `/warehouse/barcodes` | NO | BarcodeSystem | `@/pages/BarcodeSystem` | `WarehouseRoutes.tsx:67` |
| `/wms/grn` | **YES** | GoodsReceiving | `@/pages/GoodsReceiving` | `WarehouseRoutes.tsx:68` |
| `/wms/reservation` | **YES** | StockReservation | `@/pages/StockReservation` | `WarehouseRoutes.tsx:69` |
| `/wms/inventory` | **YES** | InventoryCount | `@/pages/InventoryCount` | `WarehouseRoutes.tsx:70` |
| `/wms/variance-approval` | **YES** | WMSVarianceApproval | `@/pages/WMSVarianceApproval` | `WarehouseRoutes.tsx:71` |
| `/wms/rental` | **YES** | WarehouseRental | `@/pages/WarehouseRental` | `WarehouseRoutes.tsx:72` |
| `/wms/dashboard` | NO | WMSDashboard | `@/pages/WMSDashboard` | `WarehouseRoutes.tsx:73` |
| `/wms/kpi-hub` | NO | WarehouseKpiHub | `@/pages/WarehouseKpiHub` | `WarehouseRoutes.tsx:74` |
| `/wms/reports` | NO | WarehouseReportsAll | `@/pages/WarehouseReportsAll` | `WarehouseRoutes.tsx:75` |
| `/wms/reports-all` | NO | WarehouseReportsAll | `@/pages/WarehouseReportsAll` | `WarehouseRoutes.tsx:76` |
| `/wms/material/360/:id` | dyn | WarehouseMaterial360 | `@/pages/WarehouseMaterial360` | `WarehouseRoutes.tsx:77` |
| `/wms/quarantine` | NO | WarehouseQuarantine | `@/pages/WarehouseQuarantine` | `WarehouseRoutes.tsx:78` |
| `/wms/barcodes-queue` | NO | WarehouseBarcodeQueue | `@/pages/WarehouseBarcodeQueue` | `WarehouseRoutes.tsx:79` |
| `/wms/passports` | NO | WarehouseInventoryPassport | `@/pages/WarehouseInventoryPassport` | `WarehouseRoutes.tsx:80` |
| `/wms/qc-review` | NO | WarehouseQCReview | `@/pages/WarehouseQCReview` | `WarehouseRoutes.tsx:81` |
| `/wms/employee-inventory` | NO | EmployeeInventory | `@/pages/EmployeeInventory` | `WarehouseRoutes.tsx:82` |
| `/wms/kirim-new` | NO | WarehouseKirimWizard | `@/pages/WarehouseKirimWizard` | `WarehouseRoutes.tsx:83` |
| `/wms/notifications` | NO | NotificationCenter | `@/pages/NotificationCenter` | `WarehouseRoutes.tsx:84` |
| `/wms/audit-log` | NO | WarehouseAuditLog | `@/pages/WarehouseAuditLog` | `WarehouseRoutes.tsx:85` |
| `/wms/material-balance` | NO | MaterialBalance | `@/pages/MaterialBalance` | `WarehouseRoutes.tsx:86` |
| `/wms/scanner` | NO | BarcodeScanner | `@/pages/BarcodeScanner` | `WarehouseRoutes.tsx:87` |
| `/inventory/materials` | **YES** | WMSMaterials | `@/pages/WMSMaterials` | `WarehouseRoutes.tsx:88` |
| `/inventory/materials/:id` | dyn | WMSMaterials | `@/pages/WMSMaterials` | `WarehouseRoutes.tsx:89` |
| `/wms/settings` | **YES** | WMSSettings | `@/pages/WMSSettings` | `WarehouseRoutes.tsx:90` |
| `/wms/material-unit-price` | nav | MaterialUnitPriceConfig | `@/pages/MaterialUnitPriceConfig` | `WarehouseRoutes.tsx:91` |
| `/wms/rulon-cards` | NO | RulonCards | `@/pages/RulonCards` | `WarehouseRoutes.tsx:92` |
| `/wms/bins` | NO | WarehouseBinsPage | `@/pages/WarehouseBinsPage` | `WarehouseRoutes.tsx:93` |
| `/wms/zones` | NO | WarehouseZonesPage | `@/pages/WarehouseZonesPage` | `WarehouseRoutes.tsx:94` |
| `/wms/goods-issue` | NO | WmsGoodsIssuePage | `@/pages/WmsGoodsIssuePage` | `WarehouseRoutes.tsx:95` |
| `/wms/eoq` | NO | WmsEoqPage | `@/pages/WmsEoqPage` | `WarehouseRoutes.tsx:96` |
| `/wms/in-transit` | **YES** | WmsInTransitPage | `@/pages/WmsInTransitPage` | `WarehouseRoutes.tsx:97` |
| `/mm/vendors` | **YES** | MMVendors | `@/pages/MMVendors` | `WarehouseRoutes.tsx:99` |
| `/mm/purchase-orders` | **YES** | MMPurchaseOrders | `@/pages/MMPurchaseOrders` | `WarehouseRoutes.tsx:100` |
| `/mm/dashboard` | **YES** | MMDashboard | `@/pages/MMDashboard` | `WarehouseRoutes.tsx:101` |
| `/mm/check-bot` | **YES** | MMExtended | `@/pages/MMExtended` | `WarehouseRoutes.tsx:102` |
| `/mm/creditor-debts` | **YES** | MMExtended | `@/pages/MMExtended` | `WarehouseRoutes.tsx:103` |
| `/mm/supplier-portal` | **YES** | MMExtended | `@/pages/MMExtended` | `WarehouseRoutes.tsx:104` |
| `/logistics` | redir | LogisticsDashboard | `@/pages/LogisticsDashboard` | `WarehouseRoutes.tsx:106` |
| `/logistics/transport` | **YES** | LogisticsDashboard | `@/pages/LogisticsDashboard` | `WarehouseRoutes.tsx:107` |
| `/logistics/route-planning` | **YES** | LogisticsDashboard | `@/pages/LogisticsDashboard` | `WarehouseRoutes.tsx:108` |
| `/logistics/gps` | **YES** | LogisticsDashboard | `@/pages/LogisticsDashboard` | `WarehouseRoutes.tsx:109` |
| `/logistics/fuel` | **YES** | LogisticsDashboard | `@/pages/LogisticsDashboard` | `WarehouseRoutes.tsx:110` |
| `/logistics/drivers` | **YES** | LogisticsDashboard | `@/pages/LogisticsDashboard` | `WarehouseRoutes.tsx:111` |
| `/logistics/vehicle-schedule` | **YES** | LogisticsDashboard | `@/pages/LogisticsDashboard` | `WarehouseRoutes.tsx:112` |

### 4.2 Orphan marshrutlar — 153 ta

Mezon: sidebar'da yo'q **va** kod ichida `setLocation`/`href`/`<Link>` havolasi yo'q **va** redirect nishoni emas **va** dinamik `:id` sahifasi emas.


#### `STUB_ROUTES` — 48 orphan

| Yo'l | Komponent | Manba | Route |
|---|---|---|---|
| `/360` | Customer360Page | `@/pages/Customer360Page` | `StubRoutes.tsx:63` |
| `/ai` | AgentsHubPage | `@/pages/agents/AgentsHub` | `StubRoutes.tsx:64` |
| `/ai-camera` | CameraAIAnalyticsPage | `@/pages/CameraAIAnalytics` | `StubRoutes.tsx:65` |
| `/ai-exam` | AIExamsPage | `@/pages/AIExams` | `StubRoutes.tsx:66` |
| `/ai/hr` | HRAIDashboardPage | `@/pages/HRAIDashboard` | `StubRoutes.tsx:67` |
| `/ai/marketing` | AiCrmPageComponent | `@/pages/AiCrmPage` | `StubRoutes.tsx:68` |
| `/ai-planning` | AIProductionPlanningPage | `@/pages/AIProductionPlanning` | `StubRoutes.tsx:69` |
| `/ai/wms` | WmsAnalyticsPage | `@/pages/WmsAnalyticsPage` | `StubRoutes.tsx:70` |
| `/assignments` | MESWorkerAssignmentsPage | `@/pages/MESWorkerAssignments` | `StubRoutes.tsx:71` |
| `/insights` | AnalyticsPage | `@/pages/Analytics` | `StubRoutes.tsx:72` |
| `/integration/requests` | IntegrationMgmtPage | `@/pages/IntegrationManagement` | `StubRoutes.tsx:73` |
| `/iot-enhanced` | IoTExtendedPage | `@/pages/IoTExtended` | `StubRoutes.tsx:74` |
| `/video-progress` | LessonPlayerPage | `@/pages/LessonPlayer` | `StubRoutes.tsx:75` |
| `/3way-match` | ThreeWayMatchPage | `@/pages/ThreeWayMatchPage` | `StubRoutes.tsx:97` |
| `/achievements` | AchievementsPage | `@/pages/AchievementsPage` | `StubRoutes.tsx:98` |
| `/ai/automation` | AiAutomationPage | `@/pages/AiAutomationPage` | `StubRoutes.tsx:99` |
| `/application-responses` | ApplicationResponsesPage | `@/pages/ApplicationResponsesPage` | `StubRoutes.tsx:100` |
| `/approval-workflow` | ApprovalWorkflowPage | `@/pages/ApprovalWorkflowPage` | `StubRoutes.tsx:101` |
| `/attempts` | AttemptsPage | `@/pages/AttemptsPage` | `StubRoutes.tsx:102` |
| `/calendar-events` | CalendarEventsPage | `@/pages/CalendarEventsPage` | `StubRoutes.tsx:103` |
| `/candidates` | CandidatesPage | `@/pages/CandidatesPage` | `StubRoutes.tsx:104` |
| `/company-state` | CompanyStatePage | `@/pages/CompanyStatePage` | `StubRoutes.tsx:105` |
| `/daily-attendance` | AttendancePage | `@/pages/AttendanceMonitorPage` | `StubRoutes.tsx:106` |
| `/employee-productivity` | EmployeeProductivityPage | `@/pages/EmployeeProductivityPage` | `StubRoutes.tsx:108` |
| `/employee-zone-history` | EmployeeZoneHistoryPage | `@/pages/EmployeeZoneHistoryPage` | `StubRoutes.tsx:109` |
| `/equipment` | EquipmentPage | `@/pages/EquipmentPage` | `StubRoutes.tsx:110` |
| `/europrint-control` | EuroprintControlPage | `@/pages/EuroprintControlPage` | `StubRoutes.tsx:111` |
| `/gl` | GLDocumentsPage | `@/pages/GLDocuments` | `StubRoutes.tsx:112` |
| `/hr/zno` | HRZnoPage | `@/pages/HRZnoPage` | `StubRoutes.tsx:113` |
| `/hr/zvs` | HRZvsPage | `@/pages/HRZvsPage` | `StubRoutes.tsx:114` |
| `/iot-sensors` | IotSensorsPage | `@/pages/IotSensorsPage` | `StubRoutes.tsx:115` |
| `/machine-status-current` | MachineStatusPage | `@/pages/MachineStatusPage` | `StubRoutes.tsx:116` |
| `/machine-status-logs` | MachineStatusPage | `@/pages/MachineStatusPage` | `StubRoutes.tsx:117` |
| `/material-cards` | MaterialCardsPage | `@/pages/MaterialCardsPage` | `StubRoutes.tsx:118` |
| `/mentors` | MentorsPage | `@/pages/MentorsPage` | `StubRoutes.tsx:119` |
| `/mentorships` | MentorshipsPage | `@/pages/MentorshipsPage` | `StubRoutes.tsx:120` |
| `/okr` | OkrPage | `@/pages/OkrPage` | `StubRoutes.tsx:121` |
| `/order-status` | OrderStatusPage | `@/pages/OrderStatusPage` | `StubRoutes.tsx:122` |
| `/production-facts` | ProductionFactsPage | `@/pages/ProductionFactsPage` | `StubRoutes.tsx:123` |
| `/production/shift-reports` | ShiftReportsPage | `@/pages/ShiftReportsPage` | `StubRoutes.tsx:124` |
| `/quality-defects-camera` | QualityDefectsCameraPage | `@/pages/QualityDefectsCameraPage` | `StubRoutes.tsx:125` |
| `/questions` | QuestionsPage | `@/pages/QuestionsPage` | `StubRoutes.tsx:126` |
| `/raci-crisis` | RaciCrisisPage | `@/pages/RaciCrisisPage` | `StubRoutes.tsx:127` |
| `/raw-materials` | RawMaterialsPage | `@/pages/RawMaterialsPage` | `StubRoutes.tsx:128` |
| `/safety-violations` | SafetyViolationsPage | `@/pages/SafetyViolationsPage` | `StubRoutes.tsx:129` |
| `/users` | UsersPage | `@/pages/UsersPage` | `StubRoutes.tsx:130` |
| `/waste` | WastePage | `@/pages/WastePage` | `StubRoutes.tsx:131` |
| `/weekly-plans` | WeeklyPlansPage | `@/pages/WeeklyPlansPage` | `StubRoutes.tsx:132` |

#### `WAREHOUSE_ROUTES` — 25 orphan

| Yo'l | Komponent | Manba | Route |
|---|---|---|---|
| `/wms/pos-monitor` | PosMonitorPage | `@/pages/PosMonitorPage` | `WarehouseRoutes.tsx:61` |
| `/warehouse/inventory-count` | InventoryCount | `@/pages/InventoryCount` | `WarehouseRoutes.tsx:63` |
| `/warehouse/goods-receiving` | GoodsReceiving | `@/pages/GoodsReceiving` | `WarehouseRoutes.tsx:64` |
| `/warehouse/reservations` | StockReservation | `@/pages/StockReservation` | `WarehouseRoutes.tsx:65` |
| `/warehouse/reports` | WarehouseReports | `@/pages/WarehouseReports` | `WarehouseRoutes.tsx:66` |
| `/warehouse/barcodes` | BarcodeSystem | `@/pages/BarcodeSystem` | `WarehouseRoutes.tsx:67` |
| `/wms/dashboard` | WMSDashboard | `@/pages/WMSDashboard` | `WarehouseRoutes.tsx:73` |
| `/wms/kpi-hub` | WarehouseKpiHub | `@/pages/WarehouseKpiHub` | `WarehouseRoutes.tsx:74` |
| `/wms/reports` | WarehouseReportsAll | `@/pages/WarehouseReportsAll` | `WarehouseRoutes.tsx:75` |
| `/wms/reports-all` | WarehouseReportsAll | `@/pages/WarehouseReportsAll` | `WarehouseRoutes.tsx:76` |
| `/wms/quarantine` | WarehouseQuarantine | `@/pages/WarehouseQuarantine` | `WarehouseRoutes.tsx:78` |
| `/wms/barcodes-queue` | WarehouseBarcodeQueue | `@/pages/WarehouseBarcodeQueue` | `WarehouseRoutes.tsx:79` |
| `/wms/passports` | WarehouseInventoryPassport | `@/pages/WarehouseInventoryPassport` | `WarehouseRoutes.tsx:80` |
| `/wms/qc-review` | WarehouseQCReview | `@/pages/WarehouseQCReview` | `WarehouseRoutes.tsx:81` |
| `/wms/employee-inventory` | EmployeeInventory | `@/pages/EmployeeInventory` | `WarehouseRoutes.tsx:82` |
| `/wms/kirim-new` | WarehouseKirimWizard | `@/pages/WarehouseKirimWizard` | `WarehouseRoutes.tsx:83` |
| `/wms/notifications` | NotificationCenter | `@/pages/NotificationCenter` | `WarehouseRoutes.tsx:84` |
| `/wms/audit-log` | WarehouseAuditLog | `@/pages/WarehouseAuditLog` | `WarehouseRoutes.tsx:85` |
| `/wms/material-balance` | MaterialBalance | `@/pages/MaterialBalance` | `WarehouseRoutes.tsx:86` |
| `/wms/scanner` | BarcodeScanner | `@/pages/BarcodeScanner` | `WarehouseRoutes.tsx:87` |
| `/wms/rulon-cards` | RulonCards | `@/pages/RulonCards` | `WarehouseRoutes.tsx:92` |
| `/wms/bins` | WarehouseBinsPage | `@/pages/WarehouseBinsPage` | `WarehouseRoutes.tsx:93` |
| `/wms/zones` | WarehouseZonesPage | `@/pages/WarehouseZonesPage` | `WarehouseRoutes.tsx:94` |
| `/wms/goods-issue` | WmsGoodsIssuePage | `@/pages/WmsGoodsIssuePage` | `WarehouseRoutes.tsx:95` |
| `/wms/eoq` | WmsEoqPage | `@/pages/WmsEoqPage` | `WarehouseRoutes.tsx:96` |

#### `SALES_ROUTES` — 18 orphan

| Yo'l | Komponent | Manba | Route |
|---|---|---|---|
| `/ai-crm` | AiCrmPage | `@/pages/AiCrmPage` | `CRMRoutes.tsx:51` |
| `/crm/funnel` | CrmFunnelAnalytics | `@/pages/CrmFunnelAnalytics` | `CRMRoutes.tsx:53` |
| `/crm/rfm` | CrmRfmClusters | `@/pages/CrmRfmClusters` | `CRMRoutes.tsx:54` |
| `/crm/cohort` | CrmCohortAnalysis | `@/pages/CrmCohortAnalysis` | `CRMRoutes.tsx:55` |
| `/crm/activities` | CRMActivities | `@/pages/CRMActivities` | `CRMRoutes.tsx:56` |
| `/crm/settings` | CRMSettings | `@/pages/CRMSettings` | `CRMRoutes.tsx:57` |
| `/sd/quotations` | SDSalesQuotes | `@/pages/SDSalesQuotes` | `CRMRoutes.tsx:62` |
| `/sd/crm` | SDEuroprint | `@/pages/SDEuroprint` | `CRMRoutes.tsx:63` |
| `/sd/sales-management` | SDSalesManagement | `@/pages/SDSalesManagement` | `CRMRoutes.tsx:72` |
| `/sd/invoices` | SDSalesManagement | `@/pages/SDSalesManagement` | `CRMRoutes.tsx:73` |
| `/sd/forecast` | SDSalesManagement | `@/pages/SDSalesManagement` | `CRMRoutes.tsx:74` |
| `/sd/analytics` | SDSalesManagement | `@/pages/SDSalesManagement` | `CRMRoutes.tsx:75` |
| `/sd/commission` | SDSalesManagement | `@/pages/SDSalesManagement` | `CRMRoutes.tsx:76` |
| `/sd/debitors` | SDDebitors | `@/pages/SDDebitors` | `CRMRoutes.tsx:80` |
| `/sd/dashboard/overview` | SDOverviewDashboard | `@/pages/SDOverviewDashboard` | `CRMRoutes.tsx:81` |
| `/sd/manager-panel` | SDExtended | `@/pages/SDExtended` | `CRMRoutes.tsx:83` |
| `/sd/leads` | SDLeads | `@/pages/SDLeads` | `CRMRoutes.tsx:86` |
| `/sd/deliveries` | SDDeliveries | `@/pages/SDDeliveries` | `CRMRoutes.tsx:87` |

#### `HR_ROUTES` — 15 orphan

| Yo'l | Komponent | Manba | Route |
|---|---|---|---|
| `/hr/shift-types-config` | ShiftTypesConfig | `@/pages/ShiftTypesConfig` | `HRRoutes.tsx:70` |
| `/hr/razryad-config` | RazryadLevelConfig | `@/pages/RazryadLevelConfig` | `HRRoutes.tsx:71` |
| `/org-structure/question-bank` | QuestionBankConfig | `@/pages/QuestionBankConfig` | `HRRoutes.tsx:77` |
| `/hr/recruiter-kpi` | RecruiterKPIPage | `@/pages/RecruiterKPIPage` | `HRRoutes.tsx:85` |
| `/hr/inspection` | InspectionPage | `@/pages/InspectionPage` | `HRRoutes.tsx:93` |
| `/hr/pip` | HRPip | `@/pages/HRPip` | `HRRoutes.tsx:95` |
| `/hr/gamification` | HRGamification | `@/pages/HRGamification` | `HRRoutes.tsx:96` |
| `/hr/conflict` | HRConflict | `@/pages/HRConflict` | `HRRoutes.tsx:99` |
| `/hr/alumni` | HRAlumni | `@/pages/HRAlumni` | `HRRoutes.tsx:100` |
| `/hr/enps` | HREnps | `@/pages/HREnps` | `HRRoutes.tsx:101` |
| `/questionnaire` | Questionnaire | `@/pages/Questionnaire` | `HRRoutes.tsx:102` |
| `/questionnaire-templates` | QuestionnaireTemplates | `@/pages/QuestionnaireTemplates` | `HRRoutes.tsx:103` |
| `/seven-functions` | SevenFunctions | `@/pages/SevenFunctions` | `HRRoutes.tsx:104` |
| `/raci-matrix` | RaciMatrix | `@/pages/RaciMatrix` | `HRRoutes.tsx:105` |
| `/hr/job-descriptions` | JobDescriptionsPage | `@/pages/JobDescriptionsPage` | `HRRoutes.tsx:107` |

#### `DIRECTOR_ROUTES` — 13 orphan

| Yo'l | Komponent | Manba | Route |
|---|---|---|---|
| `/warehouse/rolls` | RollManagementPage | `@/pages/warehouse/RollManagementPage` | `DirectorRoutes.tsx:53` |
| `/erp-daily-reports` | ERPDailyReports | `@/pages/ERPDailyReports` | `DirectorRoutes.tsx:55` |
| `/director/production` | DirectorExtended | `@/pages/DirectorExtended` | `DirectorRoutes.tsx:67` |
| `/director/hr-stats` | DirectorExtended | `@/pages/DirectorExtended` | `DirectorRoutes.tsx:68` |
| `/director/finance` | DirectorExtended | `@/pages/DirectorExtended` | `DirectorRoutes.tsx:69` |
| `/director/kpis` | DirectorExtended | `@/pages/DirectorExtended` | `DirectorRoutes.tsx:70` |
| `/director/ai-audit` | DirectorAiAudit | `@/pages/DirectorAiAudit` | `DirectorRoutes.tsx:72` |
| `/director/kpi-thresholds` | KpiThresholdConfig | `@/pages/KpiThresholdConfig` | `DirectorRoutes.tsx:73` |
| `/director/company-state-config` | CompanyStateThresholdConfig | `@/pages/CompanyStateThresholdConfig` | `DirectorRoutes.tsx:74` |
| `/director/kpi-weights` | KpiScoreWeightsConfig | `@/pages/KpiScoreWeightsConfig` | `DirectorRoutes.tsx:75` |
| `/director/monthly-plans` | MonthlyPlansPage | `@/pages/MonthlyPlansPage` | `DirectorRoutes.tsx:76` |
| `/director/diary` | DirectorDiaryPage | `@/pages/DirectorDiaryPage` | `DirectorRoutes.tsx:77` |
| `/director/stat-regulations` | StatRegulationsPage | `@/pages/StatRegulationsPage` | `DirectorRoutes.tsx:78` |

#### `PRODUCTION_ROUTES` — 9 orphan

| Yo'l | Komponent | Manba | Route |
|---|---|---|---|
| `/erp-production` | ERPProduction | `@/pages/ERPProduction` | `ProductionRoutes.tsx:95` |
| `/order-approval` | OrderApprovalWorkflow | `@/pages/OrderApprovalWorkflow` | `ProductionRoutes.tsx:103` |
| `/pp/gofra-config` | GofraFluteConfig | `@/pages/GofraFluteConfig` | `ProductionRoutes.tsx:111` |
| `/pp/gofra-waste-config` | GofraWasteConfig | `@/pages/GofraWasteConfig` | `ProductionRoutes.tsx:112` |
| `/pp/work-center-norms` | WorkCenterNormsConfig | `@/pages/WorkCenterNormsConfig` | `ProductionRoutes.tsx:113` |
| `/technology` | Technology | `@/pages/Technology` | `ProductionRoutes.tsx:114` |
| `/pp/mrp` | MrpMatrix | `@/pages/MrpMatrix` | `ProductionRoutes.tsx:130` |
| `/pp/crp` | CrpPage | `@/pages/CrpPage` | `ProductionRoutes.tsx:131` |
| `/pp/equipment` | PPEquipmentPage | `@/pages/PPEquipmentPage` | `ProductionRoutes.tsx:132` |

#### `ADMIN_ROUTES` — 6 orphan

| Yo'l | Komponent | Manba | Route |
|---|---|---|---|
| `/settings/notifications` | NotificationSettings | `@/pages/NotificationSettings` | `AdminRoutes.tsx:40` |
| `/system-monitor` | SystemMonitor | `@/pages/SystemMonitor` | `AdminRoutes.tsx:42` |
| `/telegram-bot` | TelegramBotAdmin | `@/pages/TelegramBotAdmin` | `AdminRoutes.tsx:43` |
| `/integrations` | IntegrationManagement | `@/pages/IntegrationManagement` | `AdminRoutes.tsx:46` |
| `/customer-portal` | CustomerPortalConfig | `@/pages/CustomerPortalConfig` | `AdminRoutes.tsx:47` |
| `/admin/audit-log` | AuditLogPage | `@/pages/AuditLogPage` | `AdminRoutes.tsx:50` |

#### `ARCHITECTURE_GAP_ROUTES` — 4 orphan

| Yo'l | Komponent | Manba | Route |
|---|---|---|---|
| `/ai/agents` | AIAgentsPage | `@/pages/AIAgentsPage` | `AdminRoutes.tsx:97` |
| `/admin/validate` | ValidatePage | `@/pages/ValidatePage` | `AdminRoutes.tsx:98` |
| `/dashboard/progress` | ProgressPage | `@/pages/ProgressPage` | `AdminRoutes.tsx:99` |
| `/hr/face-employees` | EmployeesForFacePage | `@/pages/EmployeesForFacePage` | `AdminRoutes.tsx:100` |

#### `QC_ROUTES` — 4 orphan

| Yo'l | Komponent | Manba | Route |
|---|---|---|---|
| `/print/ink-coverage` | InkCoverageCalculator | `@/pages/InkCoverageCalculator` | `ProductionRoutes.tsx:162` |
| `/print/imposition` | ImpositionCalculator | `@/pages/ImpositionCalculator` | `ProductionRoutes.tsx:163` |
| `/qc/paper-parameters` | PaperParametersPage | `@/pages/qc/PaperParametersPage` | `ProductionRoutes.tsx:167` |
| `/qc/parameters-config` | QcParametersConfig | `@/pages/qc/QcParametersConfig` | `ProductionRoutes.tsx:180` |

#### `CAMERA_ROUTES` — 3 orphan

| Yo'l | Komponent | Manba | Route |
|---|---|---|---|
| `/attendance-monitor` | AttendanceMonitorPage | `@/pages/AttendanceMonitorPage` | `CameraRoutes.tsx:44` |
| `/employee-tracking` | EmployeeTrackingReport | `@/pages/EmployeeTrackingReport` | `CameraRoutes.tsx:45` |
| `/europrint/camera-ai-analytics` | CameraAIAnalytics | `@/pages/CameraAIAnalytics` | `CameraRoutes.tsx:46` |

#### `INTEGRATION_ROUTES` — 2 orphan

| Yo'l | Komponent | Manba | Route |
|---|---|---|---|
| `/integration/gl-posting` | GLPostingMonitor | `@/pages/GLPostingMonitor` | `AdminRoutes.tsx:54` |
| `/integration/invoice-verification` | InvoiceVerification | `@/pages/InvoiceVerification` | `AdminRoutes.tsx:55` |

#### `ANALYTICS_ROUTES` — 2 orphan

| Yo'l | Komponent | Manba | Route |
|---|---|---|---|
| `/ai/forecast` | ForecastAnalytics | `@/pages/ForecastAnalytics` | `AnalyticsRoutes.tsx:30` |
| `/knowledge-base` | KnowledgeBase | `@/pages/KnowledgeBase` | `AnalyticsRoutes.tsx:45` |

#### `LMS_LEARNER_ROUTES` — 1 orphan

| Yo'l | Komponent | Manba | Route |
|---|---|---|---|
| `/lms/gamification` | LMSExtended | `@/pages/LMSExtended` | `AdminRoutes.tsx:83` |

#### `ORDERS_REGISTRY_ROUTES` — 1 orphan

| Yo'l | Komponent | Manba | Route |
|---|---|---|---|
| `/orders-registry` | OrdersRegistry | `@/pages/OrdersRegistry` | `AdminRoutes.tsx:92` |

#### `SELF_SERVICE_ROUTES` — 1 orphan

| Yo'l | Komponent | Manba | Route |
|---|---|---|---|
| `/hr/internal-jobs` | InternalJobBoard | `@/pages/InternalJobBoard` | `HRRoutes.tsx:116` |

#### `IOT_ROUTES` — 1 orphan

| Yo'l | Komponent | Manba | Route |
|---|---|---|---|
| `/iot/material-kits` | WarehouseMaterialKits | `@/pages/WarehouseMaterialKits` | `ProductionRoutes.tsx:222` |

### 4.3 Alias guruhlari — bitta komponent, bir nechta yo'l

Jami 46 komponent, 162 marshrut.

| Komponent (manba) | Yo'llar soni | Yo'llar (sidebar holati bilan) |
|---|---|---|
| `@/pages/TechPPExtended` | 13 | `/tech/material-alternatives` **[sidebar]** · `/tech/machine-selection` **[sidebar]** · `/tech/time-cost` **[sidebar]** · `/tech/cost-optimization` **[sidebar]** · `/tech/client-requirements` **[sidebar]** · `/tech/change-history` **[sidebar]** · `/tech/parallel-orders` **[sidebar]** · `/pp/parallel-processes` **[sidebar]** · `/pp/what-if` **[sidebar]** · `/pp/delivery-calculator` **[sidebar]** · `/pp/energy-optimization` **[sidebar]** · `/pp/kpi-deviation` **[sidebar]** · `/pp/realtime-progress` **[sidebar]** |
| `@/pages/DesignExtended` | 8 | `/design/ai-review` **[sidebar]** · `/design/3d-mockup` **[sidebar]** · `/design/brand-guidelines` **[sidebar]** · `/design/comparison` **[sidebar]** · `/design/templates` **[sidebar]** · `/design/tools` **[sidebar]** · `/design/costing` **[sidebar]** · `/design/library` **[sidebar]** |
| `@/pages/LMSExtended` | 7 | `/lms/test-management` **[sidebar]** · `/lms/course-author` **[sidebar]** · `/lms/operator-certification` **[sidebar]** · `/lms/learning-budget` **[sidebar]** · `/lms/leaderboard` **[sidebar]** · `/lms/micro-learning` **[sidebar]** · `/lms/gamification` _[orphan]_ |
| `@/pages/SecurityExtended` | 7 | `/security/attendance` **[sidebar]** · `/security/zone-access` **[sidebar]** · `/security/ppe` **[sidebar]** · `/security/hazmat` **[sidebar]** · `/security/evacuation` **[sidebar]** · `/security/visitors` **[sidebar]** · `/security/rating` **[sidebar]** |
| `@/pages/MESExtended` | 7 | `/mes/oee-monitor` **[sidebar]** · `/mes/reason-log` **[sidebar]** · `/mes/zone-management` **[sidebar]** · `/mes/maintenance-request` **[sidebar]** · `/mes/gamification` **[sidebar]** · `/mes/machine-norms` **[sidebar]** · `/mes/smena-handover` **[sidebar]** |
| `@/pages/LogisticsDashboard` | 7 | `/logistics` _[orphan]_ · `/logistics/transport` **[sidebar]** · `/logistics/route-planning` **[sidebar]** · `/logistics/gps` **[sidebar]** · `/logistics/fuel` **[sidebar]** · `/logistics/drivers` **[sidebar]** · `/logistics/vehicle-schedule` **[sidebar]** |
| `@/pages/SaaSExtended` | 6 | `/saas/tenant-management` **[sidebar]** · `/saas/onboarding` **[sidebar]** · `/saas/licensing` **[sidebar]** · `/saas/module-control` **[sidebar]** · `/saas/monitoring` **[sidebar]** · `/saas/error-log` **[sidebar]** |
| `@/pages/DirectorExtended` | 6 | `/director/ai-summary` **[sidebar]** · `/director/problem-points` **[sidebar]** · `/director/production` _[orphan]_ · `/director/hr-stats` _[orphan]_ · `/director/finance` _[orphan]_ · `/director/kpis` _[orphan]_ |
| `@/pages/FinanceExtended` | 6 | `/fi/cost-centers` **[sidebar]** · `/fi/transfer-pricing` **[sidebar]** · `/fi/tax-management` **[sidebar]** · `/fi/tax-calendar` **[sidebar]** · `/fi/audit-log` **[sidebar]** · `/fi/risk-ai` **[sidebar]** |
| `@/pages/IoTExtended` | 6 | `/iot/sensor-monitoring` **[sidebar]** · `/iot/predictive-maintenance` **[sidebar]** · `/iot/oee-live` **[sidebar]** · `/iot/digital-twin` **[sidebar]** · `/iot/alerts` **[sidebar]** · `/iot-enhanced` _[stub]_ |
| `@/pages/SDSalesManagement` | 5 | `/sd/sales-management` _[orphan]_ · `/sd/invoices` _[orphan]_ · `/sd/forecast` _[orphan]_ · `/sd/analytics` _[orphan]_ · `/sd/commission` _[orphan]_ |
| `@/pages/MarketingExtended` | 5 | `/marketing/analytics` **[sidebar]** · `/marketing/seo` **[sidebar]** · `/marketing/ab-testing` **[sidebar]** · `/marketing/competitors` **[sidebar]** · `/marketing/nps-churn` **[sidebar]** |
| `@/pages/QCExtended` | 5 | `/qc/lab` **[sidebar]** · `/qc/iso` **[sidebar]** · `/qc/ai-analysis` **[sidebar]** · `/qc/reports` **[sidebar]** · `/qc/settings` **[sidebar]** |
| `@/pages/Customer360Page` | 4 | `/sd/customers/:id` _[dyn]_ · `/crm/customer/:id` _[dyn]_ · `/crm/customer/:id` _[dyn]_ · `/360` _[stub]_ |
| `@/pages/LessonPlayer` | 3 | `/courses/:id/lessons` _[dyn]_ · `/courses/:id/lessons/:lessonId` _[dyn]_ · `/video-progress` _[stub]_ |
| `@/pages/AiCrmPage` | 3 | `/ai/crm` **[sidebar]** · `/ai-crm` _[orphan]_ · `/ai/marketing` _[stub]_ |
| `@/pages/SDExtended` | 3 | `/sd/manager-panel` _[orphan]_ · `/sd/warehouse-rental` **[sidebar]** · `/sd/advance-control` **[sidebar]** |
| `@/pages/agents/AgentsHub` | 3 | `/agents` **[sidebar]** · `/agents/:id` _[dyn]_ · `/ai` _[stub]_ |
| `@/pages/MROExtended` | 3 | `/mro/expense-control` **[sidebar]** · `/mro/uniforms` **[sidebar]** · `/mro/sanitation` **[sidebar]** |
| `@/pages/MMExtended` | 3 | `/mm/check-bot` **[sidebar]** · `/mm/creditor-debts` **[sidebar]** · `/mm/supplier-portal` **[sidebar]** |
| `@/pages/TelegramBotAdmin` | 2 | `/telegram-bot` _[orphan]_ · `/telegram/admin` **[sidebar]** |
| `@/pages/IntegrationManagement` | 2 | `/integrations` _[orphan]_ · `/integration/requests` _[stub]_ |
| `@/pages/MRODashboard` | 2 | `/integration/mro` **[sidebar]** · `/mro/dashboard` **[sidebar]** |
| `@/pages/KnowledgeBase` | 2 | `/lms/knowledge-base` **[sidebar]** · `/knowledge-base` _[orphan]_ |
| `@/pages/Analytics` | 2 | `/analytics` **[sidebar]** · `/insights` _[stub]_ |
| `@/pages/NotificationCenter` | 2 | `/notifications` **[sidebar]** · `/wms/notifications` _[orphan]_ |
| `@/pages/Courses` | 2 | `/courses` **[sidebar]** · `/lessons` **[sidebar]** |
| `@/pages/AIExams` | 2 | `/ai-exams` **[sidebar]** · `/ai-exam` _[stub]_ |
| `@/pages/RecruitingKanban` | 2 | `/hr/recruiting-kanban` **[sidebar]** · `/hr/recruiting` **[sidebar]** |
| `@/pages/AttendanceMonitorPage` | 2 | `/attendance-monitor` _[orphan]_ · `/daily-attendance` _[stub]_ |
| `@/pages/CameraAIAnalytics` | 2 | `/europrint/camera-ai-analytics` _[orphan]_ · `/ai-camera` _[stub]_ |
| `@/pages/SDSalesQuotes` | 2 | `/sd/quotations` _[orphan]_ · `/sd/sales-quotes` **[sidebar]** |
| `@/pages/EmployeeProfile` | 2 | `/erp/employee/:id` _[dyn]_ · `/employees/:id` _[dyn]_ |
| `@/pages/StrategicTasksPanel` | 2 | `/europrint/strategic` **[sidebar]** · `/strategic-tasks` **[sidebar]** |
| `@/pages/GLDocuments` | 2 | `/accounting/gl-documents` **[sidebar]** · `/gl` _[stub]_ |
| `@/pages/HRAIDashboard` | 2 | `/ai-hr/dashboard` **[sidebar]** · `/ai/hr` _[stub]_ |
| `@/pages/AIProductionPlanning` | 2 | `/ai-production-planning` **[sidebar]** · `/ai-planning` _[stub]_ |
| `@/pages/TechCards` | 2 | `/tech-cards` _[orphan]_ · `/tech/cards` **[sidebar]** |
| `@/pages/MESWorkerAssignments` | 2 | `/mes/workers` **[sidebar]** · `/assignments` _[stub]_ |
| `@/pages/mro/FacilityInventoryPage` | 2 | `/mro/office-inventory` **[sidebar]** · `/mro/building-inventory` **[sidebar]** |
| `@/pages/MachineStatusPage` | 2 | `/machine-status-current` _[stub]_ · `/machine-status-logs` _[stub]_ |
| `@/pages/InventoryCount` | 2 | `/warehouse/inventory-count` _[orphan]_ · `/wms/inventory` **[sidebar]** |
| `@/pages/GoodsReceiving` | 2 | `/warehouse/goods-receiving` _[orphan]_ · `/wms/grn` **[sidebar]** |
| `@/pages/StockReservation` | 2 | `/warehouse/reservations` _[orphan]_ · `/wms/reservation` **[sidebar]** |
| `@/pages/WarehouseReportsAll` | 2 | `/wms/reports` _[orphan]_ · `/wms/reports-all` _[orphan]_ |
| `@/pages/WMSMaterials` | 2 | `/inventory/materials` **[sidebar]** · `/inventory/materials/:id` _[dyn]_ |

### 4.4 `StubRoutes.tsx` — 49 marshrut

CLAUDE.md "Stub-route soni endi: 0" deydi; aslida fayl 49 marshrutni ro'yxatdan o'tkazadi. Hech biri sidebar'da yo'q.

**A) Jonli sahifaning ikkinchi nusxasi — 14 ta:**

| Stub yo'l | Route | Komponent | Bir xil komponentning jonli yo'li |
|---|---|---|---|
| `/360` | `StubRoutes.tsx:63` | Customer360Page | `/sd/customers/:id` · `/crm/customer/:id` · `/crm/customer/:id` |
| `/ai` | `StubRoutes.tsx:64` | AgentsHubPage | `/agents` **[sidebar]** · `/agents/:id` |
| `/ai-camera` | `StubRoutes.tsx:65` | CameraAIAnalyticsPage | `/europrint/camera-ai-analytics` |
| `/ai-exam` | `StubRoutes.tsx:66` | AIExamsPage | `/ai-exams` **[sidebar]** |
| `/ai/hr` | `StubRoutes.tsx:67` | HRAIDashboardPage | `/ai-hr/dashboard` **[sidebar]** |
| `/ai/marketing` | `StubRoutes.tsx:68` | AiCrmPageComponent | `/ai/crm` **[sidebar]** · `/ai-crm` |
| `/ai-planning` | `StubRoutes.tsx:69` | AIProductionPlanningPage | `/ai-production-planning` **[sidebar]** |
| `/assignments` | `StubRoutes.tsx:71` | MESWorkerAssignmentsPage | `/mes/workers` **[sidebar]** |
| `/insights` | `StubRoutes.tsx:72` | AnalyticsPage | `/analytics` **[sidebar]** |
| `/integration/requests` | `StubRoutes.tsx:73` | IntegrationMgmtPage | `/integrations` |
| `/iot-enhanced` | `StubRoutes.tsx:74` | IoTExtendedPage | `/iot/sensor-monitoring` **[sidebar]** · `/iot/predictive-maintenance` **[sidebar]** · `/iot/oee-live` **[sidebar]** · `/iot/digital-twin` **[sidebar]** · `/iot/alerts` **[sidebar]** |
| `/video-progress` | `StubRoutes.tsx:75` | LessonPlayerPage | `/courses/:id/lessons` · `/courses/:id/lessons/:lessonId` |
| `/daily-attendance` | `StubRoutes.tsx:106` | AttendancePage | `/attendance-monitor` |
| `/gl` | `StubRoutes.tsx:112` | GLDocumentsPage | `/accounting/gl-documents` **[sidebar]** |

**B) Faqat StubRoutes'da yashaydigan — 35 ta (hech qayerdan yetib bo'lmaydi):**

| Yo'l | Komponent | Manba | Route |
|---|---|---|---|
| `/ai/wms` | WmsAnalyticsPage | `@/pages/WmsAnalyticsPage` | `StubRoutes.tsx:70` |
| `/3way-match` | ThreeWayMatchPage | `@/pages/ThreeWayMatchPage` | `StubRoutes.tsx:97` |
| `/achievements` | AchievementsPage | `@/pages/AchievementsPage` | `StubRoutes.tsx:98` |
| `/ai/automation` | AiAutomationPage | `@/pages/AiAutomationPage` | `StubRoutes.tsx:99` |
| `/application-responses` | ApplicationResponsesPage | `@/pages/ApplicationResponsesPage` | `StubRoutes.tsx:100` |
| `/approval-workflow` | ApprovalWorkflowPage | `@/pages/ApprovalWorkflowPage` | `StubRoutes.tsx:101` |
| `/attempts` | AttemptsPage | `@/pages/AttemptsPage` | `StubRoutes.tsx:102` |
| `/calendar-events` | CalendarEventsPage | `@/pages/CalendarEventsPage` | `StubRoutes.tsx:103` |
| `/candidates` | CandidatesPage | `@/pages/CandidatesPage` | `StubRoutes.tsx:104` |
| `/company-state` | CompanyStatePage | `@/pages/CompanyStatePage` | `StubRoutes.tsx:105` |
| `/employee-files` | EmployeeFilesPage | `@/pages/EmployeeFilesPage` | `StubRoutes.tsx:107` |
| `/employee-productivity` | EmployeeProductivityPage | `@/pages/EmployeeProductivityPage` | `StubRoutes.tsx:108` |
| `/employee-zone-history` | EmployeeZoneHistoryPage | `@/pages/EmployeeZoneHistoryPage` | `StubRoutes.tsx:109` |
| `/equipment` | EquipmentPage | `@/pages/EquipmentPage` | `StubRoutes.tsx:110` |
| `/europrint-control` | EuroprintControlPage | `@/pages/EuroprintControlPage` | `StubRoutes.tsx:111` |
| `/hr/zno` | HRZnoPage | `@/pages/HRZnoPage` | `StubRoutes.tsx:113` |
| `/hr/zvs` | HRZvsPage | `@/pages/HRZvsPage` | `StubRoutes.tsx:114` |
| `/iot-sensors` | IotSensorsPage | `@/pages/IotSensorsPage` | `StubRoutes.tsx:115` |
| `/machine-status-current` | MachineStatusPage | `@/pages/MachineStatusPage` | `StubRoutes.tsx:116` |
| `/machine-status-logs` | MachineStatusPage | `@/pages/MachineStatusPage` | `StubRoutes.tsx:117` |
| `/material-cards` | MaterialCardsPage | `@/pages/MaterialCardsPage` | `StubRoutes.tsx:118` |
| `/mentors` | MentorsPage | `@/pages/MentorsPage` | `StubRoutes.tsx:119` |
| `/mentorships` | MentorshipsPage | `@/pages/MentorshipsPage` | `StubRoutes.tsx:120` |
| `/okr` | OkrPage | `@/pages/OkrPage` | `StubRoutes.tsx:121` |
| `/order-status` | OrderStatusPage | `@/pages/OrderStatusPage` | `StubRoutes.tsx:122` |
| `/production-facts` | ProductionFactsPage | `@/pages/ProductionFactsPage` | `StubRoutes.tsx:123` |
| `/production/shift-reports` | ShiftReportsPage | `@/pages/ShiftReportsPage` | `StubRoutes.tsx:124` |
| `/quality-defects-camera` | QualityDefectsCameraPage | `@/pages/QualityDefectsCameraPage` | `StubRoutes.tsx:125` |
| `/questions` | QuestionsPage | `@/pages/QuestionsPage` | `StubRoutes.tsx:126` |
| `/raci-crisis` | RaciCrisisPage | `@/pages/RaciCrisisPage` | `StubRoutes.tsx:127` |
| `/raw-materials` | RawMaterialsPage | `@/pages/RawMaterialsPage` | `StubRoutes.tsx:128` |
| `/safety-violations` | SafetyViolationsPage | `@/pages/SafetyViolationsPage` | `StubRoutes.tsx:129` |
| `/users` | UsersPage | `@/pages/UsersPage` | `StubRoutes.tsx:130` |
| `/waste` | WastePage | `@/pages/WastePage` | `StubRoutes.tsx:131` |
| `/weekly-plans` | WeeklyPlansPage | `@/pages/WeeklyPlansPage` | `StubRoutes.tsx:132` |

### 4.5 Redirect aliaslar

**`REDIRECT_PATHS` massivi (57 yo'l)** — `routes/AppRouter.tsx:53`. Bu massiv faqat 404'dan qutqaradi; haqiqiy yo'naltirish quyidagi `<Route><Redirect>` juftlarida.

```
/chat
/chat/admin
/orgstructure
/org-structure/builder
/org-structure/view
/org-structure/cards
/org-structure/razryad-levels
/erp-analytics
/erp-roles
/warehouse-management
/warehouse/dashboard
/logistics/dashboard
/accounting-dashboard
/fi-finance
/erp-finance
/fi/dashboard
/cfo-dashboard
/accounting/payroll
/integration/shift-scheduling
/erp-cameras
/erp/cameras/reports
/erp/cameras/heatmap
/security/dashboard
/crm
/crm/dashboard
/crm/leads
/crm/deals
/crm/contacts
/crm/companies
/crm/proposals
/crm/invoices
/sd/quota-dashboard
/erp/planning
/erp/pp/mrp
/tech/dashboard
/tech/approval
/tech/parameters
/tech/standards
/iot/live
/europrint/director
/qc/dashboard
/qc/standards
/qc/parameters
/qc/tests
/succession-planning
/hr/succession-planning
/hr/leave
/feedback
/logout
/sales
/aisha
/assets
/hr/documents
/cfo
/org-chart
s create
  // action always inserted a PARENT-LESS org_departments row (no parent picker on that thinner
  // form) — a second, unreachable-from-sidebar create path that fed the 
 single-tree
  // problem (D11.7/G9). The canonical create path is /org-structure/hierarchy (AddNodeDialog,
  // now with a parent picker — G4).
  
```

> Eslatma: `nishon marshruti YO'Q` bayrog'i tuple-massiv inventari bo'yicha hisoblangan. `/` va `/login` `AppRouter`/`App` da to'g'ridan-to'g'ri `<Route>` sifatida ta'riflangan — ular **sog'lom**. Qolgan bayroq (`/warehouse/hub`) haqiqiy siniq nishon.

**Haqiqiy `<Redirect>` juftlari (54 ta):**

| Manba yo'l | Nishon | AppRouter.tsx |
|---|---|---|
| `/orgstructure` | `/org-structure/hierarchy` | `132` |
| `/org-structure/builder` | `/org-structure/hierarchy` | `133` |
| `/org-structure/view` | `/org-structure/hierarchy` | `134` |
| `/org-structure/cards/:id` | `/org-structure/hierarchy` | `136` |
| `/org-structure/cards` | `/org-structure/hierarchy` | `137` |
| `/org-structure/razryad-levels` | `/org-structure/hierarchy` | `138` |
| `/erp-analytics` | `/analytics` | `139` |
| `/erp-roles` | `/settings` | `140` |
| `/warehouse-management` | `/warehouse/hub` ⚠️ **nishon marshruti YO'Q** | `141` |
| `/warehouse/dashboard` | `/warehouse/hub` ⚠️ **nishon marshruti YO'Q** | `142` |
| `/logistics/dashboard` | `/logistics` | `143` |
| `/accounting-dashboard` | `/finance-dashboard` | `144` |
| `/fi-finance` | `/finance-dashboard` | `145` |
| `/erp-finance` | `/finance-dashboard` | `146` |
| `/fi/dashboard` | `/finance-dashboard` | `147` |
| `/cfo-dashboard` | `/cfo/dashboard` | `148` |
| `/accounting/payroll` | `/accounting/payroll-automation` | `149` |
| `/integration/shift-scheduling` | `/shift-schedule` | `150` |
| `/erp-cameras` | `/camera-dashboard` | `151` |
| `/erp/cameras/reports` | `/camera-reports` | `152` |
| `/erp/cameras/heatmap` | `/camera-heatmap` | `153` |
| `/security/dashboard` | `/security` | `154` |
| `/sales` | `/erp/sales` | `155` |
| `/crm` | `/crm-workspace` | `156` |
| `/crm/dashboard` | `/crm-workspace` | `157` |
| `/crm/leads` | `/crm-workspace` | `158` |
| `/crm/deals` | `/crm-workspace` | `159` |
| `/crm/contacts` | `/crm-workspace` | `160` |
| `/crm/companies` | `/crm-workspace` | `161` |
| `/crm/proposals` | `/crm-workspace` | `162` |
| `/crm/invoices` | `/crm-workspace` | `163` |
| `/sd/quota-dashboard` | `/sd/dashboard/quota` | `164` |
| `/erp/planning` | `/planning?tab=plans` | `165` |
| `/erp/pp/mrp` | `/planning?tab=mrp` | `166` |
| `/tech/dashboard` | `/tech/dashboard-home` | `167` |
| `/tech/approval` | `/tech-approval` | `168` |
| `/tech/parameters` | `/tech-approval` | `169` |
| `/tech/standards` | `/tech-approval` | `170` |
| `/iot/live` | `/iot/dashboard` | `171` |
| `/europrint/director` | `/` (bosh sahifa, `AppRouter.tsx:98`) | `172` |
| `/qc/dashboard` | `/qc/dashboard-home` | `173` |
| `/qc/standards` | `/qc-module` | `174` |
| `/qc/parameters` | `/qc-module` | `175` |
| `/qc/tests` | `/qc-module` | `176` |
| `/succession-planning` | `/hr/succession` | `177` |
| `/hr/succession-planning` | `/hr/succession` | `178` |
| `/hr/leave` | `/hr/vacation-sick` | `179` |
| `/feedback` | `/kanban` | `180` |
| `/logout` | `/login` (`App.tsx:70`) | `181` |
| `/assets` | `/hr/assets` | `184` |
| `/hr/documents` | `/employee-files` | `185` |
| `/cfo` | `/cfo/dashboard` | `186` |
| `/org-chart` | `/org-structure/hierarchy` | `187` |
| `/org-departments` | `/org-structure/hierarchy` | `188` |

### 4.6 Sidebar'da bor, marshrut ta'rifi yo'q (23 yozuv)

| Sidebar url | constants.ts | Tur | Holat |
|---|---|---|---|
| `sales` | `128` | url | redirect orqali ishlaydi |
| `qc/dashboard` | `204` | defaultUrl | redirect orqali ishlaydi |
| `qc/dashboard` | `207` | url | redirect orqali ishlaydi |
| `qc/tests` | `209` | url | redirect orqali ishlaydi |
| `qc/parameters` | `210` | url | redirect orqali ishlaydi |
| `qc/standards` | `211` | url | redirect orqali ishlaydi |
| `tech/approval` | `235` | defaultUrl | redirect orqali ishlaydi |
| `tech/approval` | `238` | url | redirect orqali ishlaydi |
| `pos-monitor` | `332` | url | `App.tsx:95` sub-app ushlaydi — OK |
| `cfo-dashboard` | `373` | defaultUrl | redirect orqali ishlaydi |
| `cfo` | `376` | url | redirect orqali ishlaydi |
| `cfo-dashboard` | `377` | url | redirect orqali ishlaydi |
| `pos-monitor` | `402` | url | `App.tsx:95` sub-app ushlaydi — OK |
| `assets` | `439` | url | redirect orqali ishlaydi |
| `europrint/director` | `581` | defaultUrl | redirect orqali ishlaydi |
| `europrint/director` | `584` | url | redirect orqali ishlaydi |
| `aisha` | `585` | url | redirect orqali ishlaydi |
| `aisha` | `657` | url | redirect orqali ishlaydi |
| `chat` | `670` | defaultUrl | redirect orqali ishlaydi |
| `chat` | `673` | url | redirect orqali ishlaydi |
| `chat` | `674` | url | redirect orqali ishlaydi |
| `chat` | `675` | url | redirect orqali ishlaydi |
| `chat` | `676` | url | redirect orqali ishlaydi |
---

## 5. Ishonch darajasi va tekshirilmagan joylar

### Yuqori ishonch — `file:line` bilan bevosita tasdiqlangan

- `/chat/admin` yetib bo'lmasligi (`App.tsx:99` vs `AppRouter.tsx:198`)
- O'lik ikkinchi sidebar (`dizayn-new/AppSidebar.tsx`, import qiluvchi yo'q)
- `/warehouse/hub` marshruti mavjud emasligi
- `StubRoutes.tsx` 49 marshrut + 14 alias ustma-ustligi
- D2, D9, D10, D11, D13 — endpoint tengligi grep bilan isbotlangan
- D6 — `IoTExtended.tsx:59` va `IoTDashboard.tsx:69` bir xil `"/api/iot-sensors/oee"`
- `/iot/tablet` soyalanishi
- Eski 5 topilmaning holati (chat / POS / kamera / kpi / Kanban)

### Ehtiyot shart — statik tahlil chegarasi

Orphan aniqlash **statik grep**ga asoslanadi: `setLocation(...)`, `navigate(...)`, `href=`, `<Link to=`. Quyidagilar e'tibordan chetda qolishi mumkin:

- O'zgaruvchi yoki template-literal bilan yasalgan yo'l (`setLocation(\`/x/${id}\`)` — dinamik qism)
- Konfiguratsiya massividan kelayotgan yo'llar
- Dialog/dropdown ichidagi shartli navigatsiya

Shu sababli **153 raqami yuqori chegara**. Har bir o'chirishdan oldin alohida tasdiq kerak (Qoida Q-29 "verify-don't-trust", Q-46 "o'chirishdan oldin import yo'qligini tekshir").

### Tekshirilmagan (bu tahlil qamrovidan tashqarida)

- **Backend entity tengligi.** `/api/pp/mrp` va `/api/erp/mrp-*` bir jadvalgami; `/api/equipment` / `/api/mro/equipment` / `/api/integration/mro/equipment` bir jadvalgami; `/api/sd/orders` va `/api/sap/sales-orders` aynan bir `sales_orders` qatorlarigami. Bularni tasdiqlash uchun BE controller + Drizzle repo tahlili kerak (DB-proof).
- `QCExtended` tab endpointlari — statik `/api/` mos kelmadi (dinamik qurilgan bo'lishi mumkin).
- Finance tomondagi `InventoryValuation` va `MaterialsAccounting` bir stokni ikki marta baholaydimi.
- `RulonCards` (`/api/wms/rulon-cards`) va `RollManagementPage` (`/api/agents/inventory/rolls`) bir feature'mi — **egasi qarori kerak**.

---

## 6. Tavsiya qilingan ish paketlari

> Bu faqat tavsiya. Qoida 23: **tavsiya ≠ ruxsat**. Hech biri egasining aniq "ha, bajar" so'zisiz bajarilmaydi.

### Paket A — Xavfsiz aniq dublikatlarni o'chirish
Mezon: orphan + jonli nusxa mavjud + aynan bir xil endpoint.

| Fayl | Qator | Guruh |
|---|---|---|
| `pages/SDOverviewDashboard.tsx` | 268 | D9 |
| `pages/MentorshipsPage.tsx` | 279 | D10 |
| `pages/WeeklyPlansPage.tsx` | 255 | D11 |
| `pages/ApplicationResponsesPage.tsx` | 175 | D12 |
| `pages/EuroprintControlPage.tsx` | 290 | D13 |

Jami ~1267 qator + tegishli `StubRoutes.tsx` / route yozuvlari.

### Paket B — Siniq narsalarni tuzatish
1. `/chat/admin` — `ChatAdminPage` yetib bo'lmaydi (`App.tsx:99` shartini toraytirish yoki admin sahifasini chat ichiga tab qilish).
2. `/warehouse/hub` — 2 ta redirect 404 ga olib boradi; marshrut yaratish yoki redirect nishonini o'zgartirish.
3. `/iot/tablet` — rol-gate chetlab o'tilgan (agar bu ataylab bo'lmasa).

### Paket C — Sidebar tozalash
1. O'lik `components/dizayn-new/AppSidebar.tsx` + `components/AppSidebar.tsx` + testi bo'yicha qaror.
2. 5 ta bir-komponent-ikki-yozuv (§3A.4).
3. D2 (AI rezervatsiya) va D15 (kamera dashboard) — ikkalasi sidebar'da bo'lgan **haqiqiy** dublikatlar.
4. Ikkita "Lidlar" yozuvi (`constants.ts:126`, `:156`) — nomlarini farqlash.

### Paket D — `StubRoutes.tsx` qatlamini hal qilish
- 14 alias marshrutni o'chirish (jonli nusxasi bor).
- 35 orphan sahifa bo'yicha Q-46 qarori: sidebar'ga chiqarish yoki to'liq o'chirish.

### Paket E — Chuqur tekshiruv (DB-proof)
- MRP: `/api/pp/mrp` vs `/api/erp/mrp-*` — ikki jonli yozuv yo'li bormi?
- OEE: `/api/iot/oee/live` vs `/api/iot-sensors/oee` vs `/api/mes/oee`.
- Uskuna: 3 ta equipment backend bir jadvalgami.
- Sotuv: `/api/sd/orders` vs `/api/sap/sales-orders` (ikki-dunyo qoldig'i).

---

*Hisobot 2026-07-10 da 🔵 Tahlilchi rolida tuzildi. Kod, DB, konfiguratsiya o'zgartirilmadi. Barcha da'volar `fayl:qator` bilan qo'llab-quvvatlangan; tekshirilmagan da'volar aniq belgilangan.*
