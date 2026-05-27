# Frontend Duplikatlar Audit

> Sana: 2026-05-27
> Manbaa: `artifacts/erp-dashboard/src/`
> Jami sahifalar: 1265 tsx | Jami komponentlar: 626 tsx

---

## 1. Bir xil fayl nomlari — pages/

| Fayl | Joylashuv 1 | Joylashuv 2 | Izoh |
|------|-------------|-------------|------|
| `RemainingTabs.tsx` | `pages/analytics/` | `pages/employee-profile/` | Turli kontekst, boshqa kontent |
| `KanbanColumn.tsx` | `pages/crm/` | `pages/kanban/` | CRM va umumiy kanban page kopiyasi |
| `GamificationTab.tsx` | `pages/lms-dashboard/` | `pages/lms-extended/` | LMS ikki versiya — extend qilish o'rniga ko'chirgan |
| `AssessmentTab.tsx` | `pages/analytics/` | `pages/employee-profile/` | Turli tip va interfeys bilan qayta yozilgan |

---

## 2. Bir xil fayl nomlari — components/

| Fayl | Joylashuvlar | Farq |
|------|-------------|------|
| `helpers.tsx` (5x) | `assets/`, `director/`, `recruiting/`, `sd/`, `wms/` | Har biri o'z helper funksiyalari — fmtNum, fmtMoney, fmtDate qayta-qayta yozilgan |
| `KpiCard.tsx` (4x) | `hr/org/`, `shared/`, `wms/material360/`, `wms/tabs/` | `shared/KpiCard` kanonik, qolganlar parallel kopiyalar |
| `BasicTab.tsx` (3x) | `sd/`, `wms/material360/`, `wms/tabs/` | `material360` va `tabs` versiyalari kichik farq bilan (interfeys nomi, import path) |
| `SuppliersTab.tsx` (2x) | `wms/material360/`, `wms/tabs/` | Deyarli bir xil |
| `SummaryCards.tsx` (2x) | `finance/income-expense/`, `wms/receiving/` | Turli domain, bir xil nom |
| `StorageTab.tsx` (2x) | `wms/material360/`, `wms/tabs/` | Parallel kopiya |
| `StockTab.tsx` (2x) | `wms/material360/`, `wms/tabs/` | Parallel kopiya |
| `StatCard.tsx` (2x) | `hr/orgnode/`, `shared/` | `shared/` kanonik bo'lishi kerak |
| `QualityTab.tsx` (2x) | `wms/material360/`, `wms/tabs/` | Parallel kopiya |
| `ProductionTab.tsx` (2x) | `wms/material360/`, `wms/tabs/` | Parallel kopiya |
| `OrdersTab.tsx` (2x) | `sd/`, `sd/europrint/` | Subdirektory fork |
| `MovementsTab.tsx` (2x) | `wms/material360/`, `wms/tabs/` | Parallel kopiya |
| `KanbanColumn.tsx` (2x) | `crm/`, `recruiting/` | Kanban pattern qayta implement |
| `InventoryTab.tsx` (2x) | `wms/material360/`, `wms/tabs/` | Parallel kopiya |
| `HistoryTab.tsx` (2x) | `hr/orgnode/`, `wms/reservation/` | Turli domain, bir xil nom |
| `ForecastTab.tsx` (2x) | `wms/material360/`, `wms/tabs/` | Parallel kopiya |
| `FinanceTab.tsx` (2x) | `sd/`, `wms/material360/` | Turli domain |
| `EmptyState.tsx` (2x) | `components/` (root), `dizayn-new/` | `dizayn-new/` — eski dizayn izi, 348 satr farq |
| `EmptyState.test.tsx` (2x) | `__tests__/`, `dizayn-new/__tests__/` | Test ham ikki joyda |
| `DashboardStats.tsx` (2x) | `components/` (root), `dizayn-new/` | `dizayn-new/` — 354 satr farq |
| `AppSidebar.tsx` (2x) | `components/` (root), `dizayn-new/` | `dizayn-new/` — 373 satr farq, boshqa implementatsiya |

**Asosiy pattern:** `wms/material360/` va `wms/tabs/` papkalarida 9 ta bir xil nomli fayl bor. Ular refactor o'rniga to'liq ko'chirib, kichik o'zgarishlar qilingan. `dizayn-new/` papkasi ham eski alternativ dizayn izi — 3 ta asosiy komponent parallel saqlanmoqda.

---

## 3. Bir xil hook nomlari

| Hook | Joylashuv 1 | Joylashuv 2 | Izoh |
|------|-------------|-------------|------|
| `useCreateTransfer` | `hooks/use-hr-assessment.ts` (real implementatsiya) | `hooks/use-wms.ts` (boshqa implementatsiya) | HR va WMS transfer create alohida hook — shared qilinmagan |

`use-hr.ts` faylida `use-hr-assessment.ts` dan re-export qilingan, bu qo'shimcha chalkashlik yaratadi.

---

## 4. Ko'p ishlatiladigan API endpointlar (3+ joylashuvda hardcoded)

| Endpoint | Ishlatilgan joy soni | Muammo |
|----------|---------------------|--------|
| `/api/employees` | **80** (44+36, " va ' bilan) | Eng ko'p takrorlangan; string inconsistency ham bor |
| `/api/warehouse/warehouses` | 33 | Har komponentda fetch, shared hook yo'q |
| `/api/papka-orders` | 27 | Markazlashtirilmagan |
| `/api/kanban/boards` | 27 | — |
| `/api/sd/orders` | 24 | — |
| `/api/crm/leads` | 23 | — |
| `/api/sd/customers` | 22 | — |
| `/api/crm/deals` | 21 | — |
| `/api/crm/activities` | 20 | — |
| `/api/courses` | 20 | — |
| `/api/sd/quotations` | 19 | — |
| `/api/iot/production-sessions` | 19 | — |
| `/api/crm/companies` | 19 | — |
| `/api/users` | 15 | — |
| `/api/erp/work-centers` | 15 | — |
| `/api/design/orders` | 15 | — |
| `/api/hr/employees` | 14 | `/api/employees` bilan parallel — ikki xil endpoint bir xil resurs uchun |

**Kritik:** `/api/employees` va `/api/hr/employees` ikkalasi ham ishlatilmoqda — bu endpoint inconsistency, nafaqat duplikat.

---

## 5. Bir xil export funksiya nomi turli fayllarda

**Pages papkasida:**

| Nom | Takror soni | Izoh |
|-----|-------------|------|
| `StatusBadge` | 7 | Hamma module o'zida yozgan |
| `getStatusBadge` | 6 | Helper funksiya, shared qilinmagan |
| `KpiCard` | 6 | Page ichida local component sifatida |
| `StatsGrid` | 5 | — |
| `statusBadge` | 4 | Kichik harf bilan yana bir versiya |
| `SummaryCards` | 4 | — |
| `GamificationTab` | 3 | (page duplikati bilan mos) |
| `ChatPanel` | 3 | — |
| `ApprovalDialog` | 3 | — |

**Components papkasida:**

| Nom | Takror soni | Izoh |
|-----|-------------|------|
| `KpiCard` | 7 | 4 fayl + pages ichidagi 3 |
| `EmptyState` | 4 | — |
| `BasicTab` | 3 | — |
| `fmtNum` / `fmtMoney` / `fmtDate` | 2 (har biri) | Har modul helpers.tsx da qayta yozgan |
| `StatusBadge` / `StockStatusBadge` | 2 | — |
| `SidebarHeader` / `SidebarFooter` | 2 | — |

---

## 6. Takroriy useQuery queryKey'lar

| queryKey | Ishlatilgan joy soni | Izoh |
|----------|---------------------|------|
| `["/api"]` | **34** | Noto'g'ri — umumiy `/api` key, cache collision xavfi |
| `["/api/employees"]` | 19 | Shared hook bo'lishi kerak |
| `["/api/iot/production-sessions"]` | 18 | — |
| `["/api/papka-orders"]` | 17 | — |
| `["/api/warehouse/warehouses"]` | 16 | — |
| `["/api/users"]` | 15 | — |
| `["/api/sd/quotations"]` | 15 | — |
| `["/api/crm/deals"]` | 14 | — |
| `["/api/sd/orders"]` | 13 | — |
| `["/api/courses"]` | 12 | — |
| `["/api/kanban/boards"]` | 11 | — |
| `["/api/hr/recruitment/vacancies"]` | 11 | — |
| `["/api/erp/work-centers"]` | 11 | — |
| `["/api/crm/leads"]` | 11 | — |
| `["/api/barcode-warehouse/dashboard"]` | 11 | — |
| `["/api/cameras"]` | 10 | — |
| `["/api/saas/tenants"]` | 9 | — |

**`["/api"]` — 34 ta joy:** Bu queryKey juda keng, turli so'rovlar bir-birining cache'ini override qilishi mumkin. Eng jiddiy bug xavfi.

---

## 7. Import qilinmagan komponentlar (dead components)

Jami: **308 ta** komponent fayl hech qaerdan import qilinmagan.

Asosiy guruhlar:

| Kategoriya | Misollar | Soni (taxminiy) |
|------------|---------|-----------------|
| `dizayn-new/` papkasi | `AppSidebar`, `DashboardStats`, `EmptyState` va boshqalar | ~30 |
| Chat moduli | `ChatAvatar`, `ChatLayoutHeader`, `ChatLayoutMessages`, `ChatLayoutSidebar`, `ChatLayoutWidgets`, `ChatRoomHeader`, `ChatSearchPanel` | ~15 |
| CRM detail sheets | `CompanyDetailSheet`, `CompanyEditForm`, `ContactDetailSheet`, `ContactEditForm`, `DealDetailSheet`, `DealForm` | ~10 |
| WMS moduli | `BasketColumn`, `BinsTabView360`, `BatchDialogs` | ~8 |
| Test fayllar (.test.tsx) | Ko'pchilik | ~40 |
| AI/Analytics panel | `AIInsightsPanel`, `AnalyticsChart`, `ComparisonPanel` | ~5 |
| HR moduli | `BaseSalaryInput`, `BasicInfoSection`, `CandidateChecklist`, `CandidateReport` | ~10 |
| Boshqalar | `ActionDropdown`, `AdvancedFilters`, `AvatarMockup`, `Calculator`, `DataTable.*` | ~190 |

**Eslatma:** "Import qilinmagan" degani — `src/` ichidagi boshqa fayllardan statik import yo'q. Ba'zilari dinamik import yoki lazy load bilan chaqirilgan bo'lishi mumkin, lekin 308 ta juda ko'p.

---

## 8. Route'ga ulanmagan sahifalar (dead pages)

Jami sahifalar: **1223** tsx (test faylsiz ham juda ko'p)
Route'langan sahifalar: **~250** (lazy import orqali)

Route'larda **topilmagan** asosiy sahifalar (namunaviy ro'yxat):

| Sahifa | Joylashuv | Holat |
|--------|-----------|-------|
| `AIInterviewLive` | `pages/` | Route yo'q |
| `AIInterviewPage` | `pages/` | Route yo'q |
| `AIInterviewPublicPage` | `pages/` | Route yo'q |
| `AIPayrollDialog` | `pages/` | Dialog, route kerak emas |
| `AiAutomationPage` | `pages/` | Route yo'q |
| `ApplicationResponsesPage` | `pages/` | Route yo'q |
| `ApprovalWorkflowPage` | `pages/` | Route yo'q |
| `AuditConsole` | `pages/` | Route yo'q |
| `CalendarEventsPage` | `pages/` | Route yo'q |
| `CFODashboardCards/Charts/Extra` | `pages/` | Asosiy sahifa bormi? Sub-komponent sifatida? |
| `CandidateReport` | `pages/` | Route yo'q |
| `ChiqishNazoratibolimi` | `pages/` | O'zbek nomli maxsus sahifa — route yo'q |
| `ChopNavbatiBolimi` | `pages/` | O'zbek nomli maxsus sahifa — route yo'q |
| `DataTable.*` variantlari | `pages/` | Route emas, komponent |
| `DealDetailSheet*` | `pages/` | Modal/sheet |
| `EmployeeTable` | `pages/` | Komponent, route emas |

**Muhim:** 1223 ta sahifa faylining ~1000 tasi dialog, tab, section, sub-komponent bo'lib, pages/ papkasiga joylashtirilgan — bu noto'g'ri tashkiliy qaror. Haqiqiy "sahifa" (route bilan bog'liq) 250 ga yaqin.

---

## Xulosa va ustuvorliklar

| Muammo | Jiddiylik | Tavsiya |
|--------|-----------|---------|
| `queryKey: ["/api"]` — 34 joyda | KRITIK | Har bir so'rovga aniq key bering |
| `/api/employees` vs `/api/hr/employees` — ikki endpoint | YUQORI | Birini deprecated qiling |
| `wms/material360/` va `wms/tabs/` — 9 ta parallel fayl | YUQORI | Bitta papkaga birlashtiring |
| `dizayn-new/` papkasi — 3 asosiy komponent parallel | O'RTA | `dizayn-new/` ni o'chiring yoki merge qiling |
| `helpers.tsx` — 5 modulda qayta yozilgan | O'RTA | `@/lib/format.ts` yoki `@/utils/format.ts` ga ko'chiring |
| `KpiCard` — 4 ta fayl | O'RTA | Faqat `shared/KpiCard` qolsin |
| 308 import qilinmagan komponent | O'RTA | Tree-shaking tekshiruvi, keraksizlarini o'chiring |
| 1000+ sahifa faylining pages/ da bo'lishi | PAST | Pages/ ni faqat route-level sahifalar uchun ishlating |
