# Backend Duplikatlar Auditi

**Sana:** 2026-05-27  
**Tekshirilgan yo'llar:**
- `apps/api/src/modules/` — barcha modullar
- `apps/api/src/shared/db/` — barcha schema fayllar

---

## 1. Bir xil fayl nomlari — turli modullarda (eng xavfli juftliklar)

| Fayl nomi | Modul 1 | Modul 2 | Xavf |
|---|---|---|---|
| `admin-auth.controller.ts` | `modules/legacy/controllers/` | `modules/general/controllers/` | CRITICAL |
| `barcode.controller.ts` | `modules/pos/presentation/` | `modules/pos-v2/presentation/` | HIGH |
| `fi.controller.ts` | `modules/finance/fi/` | `modules/remaining/` | HIGH |
| `fi.service.ts` | `modules/finance/fi/` | `modules/remaining/` | HIGH |
| `reports-hub.controller.ts` | `modules/finance/reports-hub/` | `modules/remaining/` | HIGH |
| `reports-hub.service.ts` | `modules/finance/reports-hub/` | `modules/remaining/` | HIGH |
| `three-way-match.service.ts` | `modules/pos/application/services/` | `modules/remaining/` | HIGH |
| `attendance.service.ts` | `modules/hr/attendance/` | `modules/security/attendance/` | HIGH |
| `payroll.service.ts` | `modules/finance/payroll/` | `modules/hr/payroll/` | HIGH |
| `orders.service.ts` | `modules/sd/orders/` | `modules/design/orders/` | MEDIUM |
| `dashboard.service.ts` | `modules/director/dashboard/` | `modules/wms/application/wms-catalog/` | MEDIUM |
| `leads.service.ts` | `modules/crm/leads/` | `modules/marketing/leads/` | MEDIUM |
| `crm-ai.service.ts` | `modules/ai/services/` | `modules/crm/application/` | HIGH |
| `sms.service.ts` | `modules/pos/application/services/` | `modules/notifications/domain/services/` | MEDIUM |
| `legacy.service.ts` | `modules/legacy/services/` | (boshqa modul) | MEDIUM |
| `general-legacy-a.controller.ts` | `modules/legacy/controllers/` | `modules/general/controllers/` | HIGH |
| `general-legacy-b.controller.ts` | `modules/legacy/controllers/` | `modules/general/controllers/` | HIGH |
| `chat.controller.ts` | (2 ta modul) | — | MEDIUM |
| `reports.controller.ts` | (3 ta modul) | — | CRITICAL |
| `requests.controller.ts` | (2 ta modul) | — | MEDIUM |
| `feedback-360.service.ts` | (2 ta modul) | — | MEDIUM |
| `employee-ledger.service.ts` | (2 ta modul) | — | MEDIUM |
| `certification.service.ts` | (2 ta modul) | — | MEDIUM |
| `deliveries.service.ts` | (2 ta modul) | — | MEDIUM |
| `kmeans.service.ts` | (2 ta modul) | — | LOW |
| `telegram.service.ts` | (2 ta modul) | — | MEDIUM |

**Tavsiya:** `modules/remaining/` va `modules/legacy/` papkalaridagi fayllar canonical modullarga o'tkazilishi yoki olib tashlanishi kerak. `reports.controller.ts` 3 ta joyda — bu CRITICAL.

---

## 2. Bir xil class nomlari — turli fayllarda

| Class nomi | Xavf | Izoh |
|---|---|---|
| `AdminAuthController` | CRITICAL | `legacy` va `general` modulida ikkalasi ham mavjud |
| `BarcodeController` | HIGH | `pos` va `pos-v2` da alohida, bir xil nom |
| `FiController` | HIGH | `finance/fi` va `remaining` da |
| `FiService` | HIGH | `finance/fi` va `remaining` da |
| `GeneralLegacyAController` | HIGH | `legacy` va `general` da |
| `GeneralLegacyBController` | HIGH | `legacy` va `general` da |
| `AttendanceService` | HIGH | `hr/attendance` va `security/attendance` da |
| `PayrollService` | HIGH | `finance/payroll` va `hr/payroll` da |
| `OrdersService` | MEDIUM | `sd/orders` va `design/orders` da |
| `LeadsService` | MEDIUM | `crm/leads` va `marketing/leads` da |
| `CrmAiService` | HIGH | `ai/services` va `crm/application` da |
| `AiRouterService` | MEDIUM | (2 ta faylda) |
| `KMeansService` | LOW | (2 ta faylda) |
| `DeliveriesService` | MEDIUM | (2 ta faylda) |
| `DealWonListener` | MEDIUM | (2 ta faylda) |
| `HrBotService` | MEDIUM | (2 ta faylda) |
| `CreateNotificationCommand` | MEDIUM | (2 ta faylda) |
| `CreateOrderCommand` | MEDIUM | (2 ta faylda) |
| `CreateOrderHandler` | MEDIUM | (2 ta faylda) |
| `GetInvoicesHandler` | MEDIUM | (2 ta faylda) |
| `GetInvoicesQuery` | MEDIUM | (2 ta faylda) |
| `ListOrdersHandler` | MEDIUM | (2 ta faylda) |
| `ListOrdersQuery` | MEDIUM | (2 ta faylda) |
| `OrderStatusChangedEvent` | MEDIUM | (2 ta faylda) |
| `AuditInterceptor` | HIGH | `shared` va boshqa modulda |

**Tavsiya:** NestJS DI container'da bir xil class nomi konflikti runtime'da aniq xatoga olib kelmaydi (modul izolyatsiyasi bor), lekin kelajakda `import` aralashtirishi CRITICAL bug yaratishi mumkin.

---

## 3. Parallel repository'lar (bir jadvalga ikki xil repo)

| Fayl nomi | Modul 1 | Modul 2 | Xavf |
|---|---|---|---|
| `applications.repository.ts` | (2 ta modul) | — | HIGH |
| `coordination.repository.ts` | (2 ta modul) | — | MEDIUM |
| `crm-activities.repository.ts` | (2 ta modul) | — | HIGH |
| `crm-ai.repository.ts` | (2 ta modul) | — | HIGH |
| `crm-auto-lead.repository.ts` | (2 ta modul) | — | MEDIUM |
| `crm-bitrix-compat.repository.ts` | (2 ta modul) | — | MEDIUM |
| `crm-comms.repository.ts` | (2 ta modul) | — | MEDIUM |
| `crm-companies.repository.ts` | (2 ta modul) | — | HIGH |
| `crm-contacts.repository.ts` | (2 ta modul) | — | HIGH |
| `crm-custom-fields.repository.ts` | (2 ta modul) | — | MEDIUM |
| `crm-extras.repository.ts` | (2 ta modul) | — | MEDIUM |
| `crm-followup-compat.repository.ts` | (2 ta modul) | — | MEDIUM |
| `crm-leads-ops.repository.ts` | (2 ta modul) | — | HIGH |
| `mm-dashboard.repository.ts` | (2 ta modul) | — | MEDIUM |
| `mm-materials-extras.repository.ts` | (2 ta modul) | — | MEDIUM |
| `mm-vendors-pr.repository.ts` | (2 ta modul) | — | MEDIUM |
| `okr.repository.ts` | (2 ta modul) | — | MEDIUM |
| `pos-request-ext.repository.ts` | (2 ta modul) | — | HIGH |
| `pp-equipment.repository.ts` | (2 ta modul) | — | MEDIUM |
| `pp-planning.repository.ts` | (2 ta modul) | — | MEDIUM |
| `qc-defects-extended.repository.ts` | (2 ta modul) | — | MEDIUM |
| `qc-extended.repository.ts` | (2 ta modul) | — | MEDIUM |
| `sd-dashboard.repository.ts` | (2 ta modul) | — | MEDIUM |
| `sd-leads.repository.ts` | (2 ta modul) | — | HIGH |
| `sd-payments.repository.ts` | (2 ta modul) | — | HIGH |
| `sd-quotations.repository.ts` | (2 ta modul) | — | HIGH |
| `strategic.repository.ts` | (2 ta modul) | — | MEDIUM |
| `i-finance-payroll.repo.ts` | (2 ta modul) | — | HIGH |

**Tavsiya:** CRM repository'lari ayniqsa xavfli — `crm-contacts`, `crm-companies`, `crm-leads-ops` uchun bitta canonical repo bo'lishi kerak. Ikki repo bir jadvalga yozsa — race condition va data integrity muammolari.

---

## 4. Compat/Legacy vs Canonical juftliklar

### 4a. `modules/legacy/` — canonical bilan parallel

| Legacy fayl | Canonical ekvivalent | Xavf |
|---|---|---|
| `legacy/controllers/admin-auth.controller.ts` | `general/controllers/admin-auth.controller.ts` | CRITICAL |
| `legacy/controllers/general-legacy-a.controller.ts` | `general/controllers/general-legacy-a.controller.ts` | HIGH |
| `legacy/controllers/general-legacy-b.controller.ts` | `general/controllers/general-legacy-b.controller.ts` | HIGH |
| `legacy/services/legacy.service.ts` | (turli joylarda) | MEDIUM |
| `legacy/services/legacy-iot.service.ts` | (IoT modul) | MEDIUM |

### 4b. `modules/remaining/` — canonical bilan parallel

`remaining/` moduli asosan tugallanmagan yoki refactor qilinmagan kodlarni o'z ichiga oladi. Quyidagilar canonical modullarda ham mavjud:

| Remaining fayl | Canonical modul | Xavf |
|---|---|---|
| `remaining/fi.service.ts` | `finance/fi/fi.service.ts` | CRITICAL |
| `remaining/fi.controller.ts` | `finance/fi/fi.controller.ts` | CRITICAL |
| `remaining/fi.repository.ts` | `finance/fi/` | CRITICAL |
| `remaining/reports-hub.service.ts` | `finance/reports-hub/reports-hub.service.ts` | HIGH |
| `remaining/reports-hub.controller.ts` | `finance/reports-hub/reports-hub.controller.ts` | HIGH |
| `remaining/three-way-match.service.ts` | `pos/application/services/three-way-match.service.ts` | HIGH |

### 4c. `modules/compatibility/` — wrapper sifatida

`compatibility/` moduli asosan eski API contract'larni saqlab, canonical servislarni chaqiradi. Lekin bir qator servislar **mustaqil logika** bajaradi — bu noto'g'ri:

- `compatibility/cfo.service.ts` — o'z query'larini bajaradi (canonical `finance` moduliga yo'q)
- `compatibility/crm-extended.service.ts` — `crm` modulidagi `crm-extras.service.ts` bilan overlap
- `compatibility/employees-compat.service.ts` / `employees-compat-profile.service.ts` / `employees-compat-financials.service.ts` — `hr/employees` modulida ham mavjud logika

**Tavsiya:** `remaining/` va `legacy/` modullarini to'liq canonical modullarga migrate qilish kerak. `compatibility/` faqat shim/adapter bo'lishi, o'z DB query'lari bo'lmasligi kerak.

---

## 5. Shared DB Schema Duplikatlar (bir xil jadval nomi — ko'p fayllarda)

| Jadval nomi | Fayl 1 | Fayl 2 | Fayl 3 | Xavf |
|---|---|---|---|---|
| `attendance` | `schema-hr-lms.ts:65` | `schema-business-c-2-hr-payroll.ts:44` | `schema-compat-2.ts:30` / `schema-misc-app-b.ts:13` | CRITICAL |
| `lms_tests` | `schema-business-c-1.ts:13` | `schema-compat-4.ts:151` | `schema-misc-app-b.ts:33` | CRITICAL |
| `lms_courses` | `schema-hr-lms.ts:113` | `schema-misc-app-b.ts:41` | — | HIGH |
| `lms_enrollments` | `schema-hr-lms.ts:133` | `schema-misc-app-b.ts:48` | — | HIGH |
| `users` | `schema-compat-1a.ts:9` | `schema-misc-app-a.ts:19` | — | CRITICAL |
| `employees` | `schema-hr-lms.ts:39` | `schema-misc-app-a.ts:37` | — | CRITICAL |
| `leave_requests` | `schema-compat-2.ts:42` | `schema-misc-app-a.ts:80` | — | HIGH |
| `materials` | `schema-compat-2.ts:186` | `schema-ext-a-2.ts:127` | `schema-pos-ext.ts:99` | CRITICAL |
| `payroll_periods` | `schema-business-c-2-hr-payroll.ts:29` | (compat fayllar) | — | HIGH |

**Izoh:** Drizzle ORM da bir xil jadval nomi ikki xil `pgTable()` ta'rifida bo'lsa, migration'da conflict bo'lmaydi (ikkala ta'rif bir xil PG jadvalga qaraydi), lekin TypeScript'da import qilganda **qaysi ta'rifni ishlatish noaniq** — bu xato uchun ochiq eshik.

**Tavsiya:** Har bir jadval uchun bitta "canonical" schema fayl bo'lishi kerak. `schema-misc-app-a.ts`, `schema-misc-app-b.ts`, `schema-compat-*.ts` fayllar asosiy schema fayllariga merge qilinishi yoki to'liq re-export qilishi kerak.

---

## 6. Guard va Decorator duplikatlar (Auth infra)

Bu loyihaning eng ko'p takrorlangan infra komponentlari:

| Fayl | Nusxalar soni | Joylari | Xavf |
|---|---|---|---|
| `roles.guard.ts` | 4 ta | `auth/guards/`, `auth/infrastructure/guards/`, `admin/infrastructure/guards/`, `shared/guards/` | CRITICAL |
| `roles.decorator.ts` | 4 ta | `auth/decorators/`, `auth/infrastructure/decorators/`, `admin/infrastructure/decorators/`, `shared/decorators/` | CRITICAL |
| `jwt-auth.guard.ts` | 3 ta | `auth/guards/`, `auth/infrastructure/guards/`, `shared/guards/` | HIGH |
| `current-user.decorator.ts` | 3 ta | `auth/decorators/`, `auth/infrastructure/decorators/`, `shared/decorators/` | HIGH |

**Tavsiya:** `shared/guards/` va `shared/decorators/` kanonik manba bo'lishi kerak. Boshqa joylardagi nusxalar import bilan almashtirilishi kerak. Aks holda, bir joyda patch qilingan guard boshqa joyda eskirib qoladi — bu security vuln.

---

## 7. Eng Ko'p Takrorlangan Metodlar (>3 modul)

Quyidagi metodlar 4 yoki undan ko'p service'da uchraydi (turli modullarda identik signatura):

| Metod | Necha modulda | Xavf | Izoh |
|---|---|---|---|
| `async findAll(query)` | 15+ | LOW | CRUD pattern, kutilgan |
| `async findOne(id)` | 12+ | LOW | CRUD pattern, kutilgan |
| `async create(dto)` | 10+ | LOW | CRUD pattern, kutilgan |
| `async update(id, dto)` | 8+ | LOW | CRUD pattern, kutilgan |
| `async remove(id)` | 6+ | LOW | CRUD pattern, kutilgan |
| `async getDashboard()` | 10+ | MEDIUM | Har biri turli data qaytaradi, lekin nom bir xil — nomlanish standarti yo'q |
| `async getStats()` | 8+ | LOW | Acceptable, lekin response shape'lari har xil |
| `async calculate(input)` | 4 | LOW | Har xil domenga tegishli |

**Izoh:** `findAll/findOne/create/update/remove` metodlari CRUD pattern bo'lgani uchun takrorlanishi tabiiy. Asosiy muammo — `getDashboard()` va `getStats()` response type'lari `Record<string, unknown>` bilan type-erased — bu runtime xatolarga sabab.

---

## 8. Umumiy Xulosa

| Kategoriya | CRITICAL | HIGH | MEDIUM | LOW |
|---|---|---|---|---|
| Bir xil fayl nomlari | 2 | 12 | 10 | 2 |
| Bir xil class nomlari | 2 | 8 | 14 | 1 |
| Repository duplikatlar | 0 | 10 | 18 | 0 |
| Guard/decorator duplikatlar | 2 | 2 | 0 | 0 |
| DB schema jadval duplikatlar | 5 | 3 | 0 | 0 |
| Legacy/remaining vs canonical | 3 | 5 | 6 | 0 |
| **JAMI** | **14** | **40** | **48** | **3** |

### Birinchi navbatda hal qilinishi kerak (CRITICAL):

1. **`users` va `employees` jadvallar** — `schema-hr-lms.ts` va `schema-misc-app-a.ts` da ikki xil ta'rif. Biri olib tashlansin.
2. **`attendance` jadvali** — 4 ta faylda. Bitta canonical manba belgilansin.
3. **`lms_tests` jadvali** — 3 ta faylda. `schema-business-c-1.ts` canonical bo'lishi kerak.
4. **`materials` jadvali** — 3 ta faylda (`compat-2`, `ext-a-2`, `pos-ext`). Birida saqlansa, qolganlar re-export qilsin.
5. **`roles.guard.ts` / `roles.decorator.ts`** — 4 ta nusxa. `shared/guards/` va `shared/decorators/` canonical bo'lsin, boshqalar o'chirilsin.
6. **`remaining/fi.*`** — `finance/fi/` moduli bilan to'liq duplikat. `remaining/fi.*` olib tashlansin.
7. **`legacy/` va `general/` controllerlari** — bir xil class, bir xil nom. Biri moduldan chiqarilsin.
8. **`reports.controller.ts`** — 3 ta modulda. Qaysi biri aktiv ekanini aniqlash va birini canonical qilish kerak.
