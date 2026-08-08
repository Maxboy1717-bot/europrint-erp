# 20 — Frontend Routing va Sidebar Auditi

> **Hujjat turi:** REPORT-ONLY. Hech narsa o'zgartirilmadi.
> **Sana:** 2026-06-08
> **Manba:** `artifacts/erp-dashboard/src/routes/*.tsx` + `App.tsx` (marshrutlar), `components/sidebar/constants.ts` (navigatsiya). Router: **wouter** (`App.tsx:9`, `AppRouter.tsx:2` — `<Route>`/`<Redirect>` wouter'niki, React Router emas).
> **Eslatma:** Prompt `constants-groups-a/b.ts` deb nomlagan edi — amalda navigatsiya bitta `components/sidebar/constants.ts` (40KB) ga konsolidatsiya qilingan; `constants-groups-a/b.ts` **mavjud emas**.
> **To'liq jadval:** barcha nav itemlar va marshrutlar `20-routes-and-nav.csv` hamroh faylida.

---

## 1. Umumiy raqamlar

| Ko'rsatkich | Qiymat |
|---|---|
| Marshrut fayllari | 13 (`routes/*.tsx` + `App.tsx`) |
| Jami marshrutlar | **492** (tuple 438 + redirect/alias 50 + JSX 4) |
| Sidebar nav leaf (link) | **270** |
| Sidebar separatorlar (sarlavha) | 93 |
| Marshrutga ulanmagan nav linklar | **0** (1 nomzod `pos-monitor` maxsus mount bilan ishlaydi) |
| Takroriy nav URL (2-3x) | **11** |
| Legacy alias (redirect) marshrutlar | **50** |
| Haqiqiy stub/placeholder sahifalar | **6** (StubPage) |
| Sidebar'da yo'q marshrutlar (sub/detail/alias/stub) | **177** |

> **Asosiy xulosa:** sidebar navigatsiyasi sog'lom — **270 ta nav linkning hammasi** marshrutga (yoki maxsus mountga) ulanadi. Buzuq sidebar havola amalda yo'q.

---

## 2. `pos-monitor` — maxsus mount (buzuq emas)

Sidebar'da `pos-monitor` URL'i bor, lekin `<Route>` yoki tuple emas. `App.tsx:95-96` da maxsus shart bilan ishlanadi:

```tsx
if (location.startsWith("/pos-monitor")) {
  return <Suspense fallback={<PageLoader />}><PosMonitorApp /></Suspense>;
}
```

Demak `/pos-monitor` **reachable** (alohida SPA sifatida montaj qilingan). Kamchilik emas, lekin marshrut ro'yxatida ko'rinmaydi → tahlil chalkashligi.

---

## 3. Takroriy sidebar URL'lar (11)

Bir xil URL sidebar'da bir necha guruhda takrorlangan (bir sahifaga bir necha kirish nuqtasi):

| URL | Marta |
|---|---|
| `iot/dashboard` | 2 |
| `pos-monitor` | 2 |
| `mentorship` | 2 |
| `cameras` | 2 |
| `agents` | 2 |
| `agents/production` | 2 |
| `agents/hr-performance` | 2 |
| `agents/quality` | 2 |
| `agents/strategic` | 2 |
| `applications` | 2 |
| `chat` | 3 |

---

## 4. Legacy alias / redirect marshrutlar (50)

`<Redirect>`/`<Navigate>` orqali eski URL'lar yangi sahifalarga yo'naltiriladi (orqaga moslik). Namuna:

| Eski URL (alias) | Fayl:satr |
|---|---|
| `/orgstructure` | routes/AppRouter.tsx:125 |
| `/org-structure/builder` | routes/AppRouter.tsx:126 |
| `/org-structure/view` | routes/AppRouter.tsx:127 |
| `/erp-analytics` | routes/AppRouter.tsx:128 |
| `/erp-roles` | routes/AppRouter.tsx:129 |
| `/warehouse-management` | routes/AppRouter.tsx:130 |
| `/warehouse/dashboard` | routes/AppRouter.tsx:131 |
| `/logistics/dashboard` | routes/AppRouter.tsx:132 |
| `/accounting-dashboard` | routes/AppRouter.tsx:133 |
| `/fi-finance` | routes/AppRouter.tsx:134 |
| `/erp-finance` | routes/AppRouter.tsx:135 |
| `/fi/dashboard` | routes/AppRouter.tsx:136 |
| `/cfo-dashboard` | routes/AppRouter.tsx:137 |
| `/accounting/payroll` | routes/AppRouter.tsx:138 |
| `/integration/shift-scheduling` | routes/AppRouter.tsx:139 |
| `/erp-cameras` | routes/AppRouter.tsx:140 |
| `/erp/cameras/reports` | routes/AppRouter.tsx:141 |
| `/erp/cameras/heatmap` | routes/AppRouter.tsx:142 |
| `/security/dashboard` | routes/AppRouter.tsx:143 |
| `/sales` | routes/AppRouter.tsx:144 |
| `/crm` | routes/AppRouter.tsx:145 |
| `/crm/dashboard` | routes/AppRouter.tsx:146 |
| `/crm/leads` | routes/AppRouter.tsx:147 |
| `/crm/deals` | routes/AppRouter.tsx:148 |
| `/crm/contacts` | routes/AppRouter.tsx:149 |
| `/crm/companies` | routes/AppRouter.tsx:150 |
| `/crm/proposals` | routes/AppRouter.tsx:151 |
| `/crm/invoices` | routes/AppRouter.tsx:152 |
| `/sd/quota-dashboard` | routes/AppRouter.tsx:153 |
| `/erp/planning` | routes/AppRouter.tsx:154 |

> To'liq 50 ta: `20-routes-and-nav.csv` (kind=redirect).

---

## 5. Haqiqiy stub / placeholder sahifalar (6)

`StubRoutes.tsx` nomi chalg'ituvchi — undagi ~49 marshrut endi **haqiqiy** sahifalarga ulangan ("Stub → real" izohlari). Faqat **6** marshrut hali ham `StubPage` ("...moduli hali ishlab chiqilmoqda") placeholder'iga bog'langan:

| URL | Izoh (kod) | Fayl:satr |
|---|---|---|
| `/ai/wms` | WmsAnalytics o'chirildi (stub) | `routes/StubRoutes.tsx:72` |
| `/export` | export module not yet built | `routes/StubRoutes.tsx:80` |
| `/micro-modules` | LMS micro-modules, deferred | `routes/StubRoutes.tsx:81` |
| `/modules` | module manager, deferred | `routes/StubRoutes.tsx:82` |
| `/pos/printer-config` | printer HW config, deferred | `routes/StubRoutes.tsx:83` |
| `/sap` | SAP integration, deferred | `routes/StubRoutes.tsx:84` |

---

## 6. Sidebar'da yo'q marshrutlar (177) — sub/detail/orfan

Bu marshrutlar mavjud, lekin sidebar leaf'da to'g'ridan-to'g'ri yo'q. Ko'pchiligi detail/sub sahifalar (`/:id`), tab yoki tugma orqali ochiladi. Namuna (dastlabki 40):

| Path | Component | Fayl:satr |
|---|---|---|
| `/system-monitor` | SystemMonitor | routes/AdminRoutes.tsx:42 |
| `/telegram-bot` | TelegramBotAdmin | routes/AdminRoutes.tsx:43 |
| `/approvals` | ApprovalHub | routes/AdminRoutes.tsx:45 |
| `/integrations` | IntegrationManagement | routes/AdminRoutes.tsx:46 |
| `/customer-portal` | CustomerPortalConfig | routes/AdminRoutes.tsx:47 |
| `/admin/audit-log` | AuditLogPage | routes/AdminRoutes.tsx:50 |
| `/integration/gl-posting` | GLPostingMonitor | routes/AdminRoutes.tsx:54 |
| `/integration/invoice-verification` | InvoiceVerification | routes/AdminRoutes.tsx:55 |
| `/integration/mro` | MRODashboard | routes/AdminRoutes.tsx:57 |
| `/saas/module-control` | SaaSExtended | routes/AdminRoutes.tsx:67 |
| `/lms/learning-budget` | LMSExtended | routes/AdminRoutes.tsx:76 |
| `/lms/gamification` | LMSExtended | routes/AdminRoutes.tsx:83 |
| `/lms/support` | LMSSupport | routes/AdminRoutes.tsx:84 |
| `/orders-registry` | OrdersRegistry | routes/AdminRoutes.tsx:92 |
| `/ai/agents` | AIAgentsPage | routes/AdminRoutes.tsx:97 |
| `/admin/validate` | ValidatePage | routes/AdminRoutes.tsx:98 |
| `/dashboard/progress` | ProgressPage | routes/AdminRoutes.tsx:99 |
| `/hr/face-employees` | EmployeesForFacePage | routes/AdminRoutes.tsx:100 |
| `/ai/forecast` | ForecastAnalytics | routes/AnalyticsRoutes.tsx:28 |
| `/knowledge-base` | KnowledgeBase | routes/AnalyticsRoutes.tsx:41 |
| `/` | ? | routes/AppRouter.tsx:91 |
| `/ai-crm` | AiCrmPage | routes/CRMRoutes.tsx:48 |
| `/crm/funnel` | CrmFunnelAnalytics | routes/CRMRoutes.tsx:50 |
| `/crm/rfm` | CrmRfmClusters | routes/CRMRoutes.tsx:51 |
| `/crm/cohort` | CrmCohortAnalysis | routes/CRMRoutes.tsx:52 |
| `/crm/activities` | CRMActivities | routes/CRMRoutes.tsx:53 |
| `/crm/settings` | CRMSettings | routes/CRMRoutes.tsx:54 |
| `/erp/sales` | SalesOrders | routes/CRMRoutes.tsx:55 |
| `/sd/quotations` | SDSalesQuotes | routes/CRMRoutes.tsx:58 |
| `/sd/crm` | SDEuroprint | routes/CRMRoutes.tsx:59 |
| `/crm/customer/:id` | Customer360Page | routes/CRMRoutes.tsx:63 |
| `/sd/sales-payments` | SDSalesPayments | routes/CRMRoutes.tsx:66 |
| `/sd/sales-management` | SDSalesManagement | routes/CRMRoutes.tsx:67 |
| `/sd/invoices` | SDSalesManagement | routes/CRMRoutes.tsx:68 |
| `/sd/forecast` | SDSalesManagement | routes/CRMRoutes.tsx:69 |
| `/sd/analytics` | SDSalesManagement | routes/CRMRoutes.tsx:70 |
| `/sd/commission` | SDSalesManagement | routes/CRMRoutes.tsx:71 |
| `/sd/debitors` | SDDebitors | routes/CRMRoutes.tsx:75 |
| `/sd/manager-panel` | SDExtended | routes/CRMRoutes.tsx:78 |
| `/sd/leads` | SDLeads | routes/CRMRoutes.tsx:81 |

> To'liq ro'yxat: `20-routes-and-nav.csv`. Qaysilari haqiqiy orfan ekani modul hisobotlarida (05-17) aniqlanadi.

---

## 7. Xulosa

Frontend routing sog'lom: **270 sidebar link**ning barchasi marshrutga ulanadi (buzuq havola yo'q; `pos-monitor` maxsus mount). Asosiy kuzatuvlar — **50 ta legacy alias**, **11 ta takroriy** sidebar URL, va atigi **6 ta haqiqiy placeholder**. `StubRoutes.tsx` nomi chalg'ituvchi. 177 marshrut sidebar'da yo'q, aksariyati detail/sub sahifalar.

---

## 8. Kamchiliklar jadvali

| # | Muammo | Jiddiylik | Dalil | Ta'sir | Tavsiya |
|---|---|---|---|---|---|
| E1 | 6 ta placeholder sahifa (`StubPage`) marshruti bor | **P2** | 5-bo'lim; `StubRoutes.tsx:72-84` | "ishlab chiqilmoqda" sahifa | Tugatish yoki marshrutni olib tashlash |
| E2 | 50 ta legacy alias redirect | **P3** | 4-bo'lim | URL chalkashligi, texnik qarz | Eskirgan aliaslarni olib tashlash |
| E3 | 11 ta takroriy sidebar URL | **P3** | 3-bo'lim | Menyu shovqini | Takror linklarni birlashtirish |
| E4 | `StubRoutes.tsx` nomi chalg'ituvchi | **P3** | 5-bo'lim | Chalkashlik | Qayta nomlash/ajratish |
| E5 | `pos-monitor` maxsus mount, marshrutda ko'rinmaydi | **P3** | `App.tsx:95-96` | Tahlil chalkashligi | Standart marshrutga keltirish |
| E6 | 177 marshrut sidebar'siz | **P3** | 6-bo'lim | Ehtimoliy orfan | Modul hisobotlarida tekshirish |

---

## 9. Ochiq savollar / TASDIQLANMAGAN

- **TASDIQLANMAGAN:** 177 ta "sidebar'siz" marshrutdan qaysilari haqiqatan orfan — tugma/tab/dynamic nav tahlilini talab qiladi (05-17).
- **Eslatma:** `constants-groups-a/b.ts` mavjud emas — navi