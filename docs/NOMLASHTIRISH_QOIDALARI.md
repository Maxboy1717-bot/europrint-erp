# EUROPRINT ERP — NOMLASHTIRISH QOIDALARI

> **Har narsa qanday nomlanadi. Fayl, class, metod, DB, route, event, xato kodi.**
> Noto'g'ri nom = tushunmovchilik = bug. Bir xil narsa har joyda bir xil nomlansin.
> Bog'liq: [STANDARTLAR.md](../STANDARTLAR.md) §6 · [DRIZZLE_STANDARTLARI.md](DRIZZLE_STANDARTLARI.md) · [XATO_KODLARI.md](XATO_KODLARI.md)

---

## 1. FAYL NOMLASH (kebab-case)

```
Backend fayllari:
  [modul]-[entity].[tur].ts

  hr-employee.entity.ts          ← domain entity
  hr-employee.service.ts         ← application service
  hr-employee.repository.ts      ← infrastructure
  hr-employee.controller.ts      ← presentation controller
  create-hr-employee.dto.ts      ← DTO
  update-hr-employee.dto.ts      ← DTO
  hr-employee-created.event.ts   ← domain event
  hr-employee.module.ts          ← NestJS module
  hr-employee.service.spec.ts    ← unit test
  hr-employee.repository.spec.ts ← integration test
  hr-employee.controller.e2e-spec.ts ← e2e test

Frontend fayllari:
  HrEmployeeList.tsx             ← sahifa (PascalCase)
  HrEmployeeForm.tsx             ← forma komponenti
  useHrEmployees.ts              ← React hook
  hrEmployee.api.ts              ← API funksiyalar
  hrEmployee.types.ts            ← TypeScript tipalari

Migration fayllari:
  d1-create-roles.sql            ← d[tartib]-[tavsif].sql
  d5-add-razryad-column.sql
  seed-01-roles.sql              ← seed-[tartib]-[jadval].sql

ADR fayllari:
  ADR-007-event-driven-only.md   ← ADR-[nomer]-[tavsif].md
```

---

## 2. CLASS NOMLASH (PascalCase)

```typescript
// Entity:
HrEmployee            // [Modul][Entity]
SalesOrder            // CamelCase, modul prefiksi

// Value Object:
Salary                // tushunarsiz ism (VO)
PhoneNumber
RazryadLevel

// Domain Event:
HrEmployeeCreatedEvent     // [Modul][Entity][Amal]Event
SalesOrderConfirmedEvent
MesSessionCompletedEvent

// Repository Interface:
IHrEmployeeRepository      // I[Modul][Entity]Repository
ISalesOrderRepository

// Repository Implementation:
DrizzleHrEmployeeRepository    // Drizzle[Modul][Entity]Repository
HrEmployeeRepository           // (Drizzle prefix ixtiyoriy)

// Service:
HrEmployeeService         // [Modul][Entity]Service
SdOrderService

// Controller:
HrEmployeeController      // [Modul][Entity]Controller
SdOrderController

// DTO:
CreateHrEmployeeDto       // [Amal][Modul][Entity]Dto
UpdateHrEmployeeDto
HrEmployeeResponseDto

// Module:
HrModule                  // [Modul]Module
SdModule

// Guard/Filter/Interceptor:
JwtAuthGuard              // [Nom][Tur]Guard
RolesGuard
GlobalExceptionFilter
LoggingInterceptor
```

---

## 3. METOD NOMLASH (camelCase)

```typescript
// Service metodlari:
findAll(query)             // ro'yxat
findById(id)              // yakka (id bo'yicha)
findByEmail(email)        // yakka (boshqa field)
create(dto)               // yaratish
update(id, dto)           // yangilash
delete(id)                // o'chirish (soft)
hardDelete(id)            // to'liq o'chirish (rare!)

// Domain entity metodlari:
HrEmployee.create(props)  // static factory
employee.promote(razryad) // biznes amal (imperativ)
employee.terminate()      // holat o'zgartirish
employee.isActive()       // holat tekshiruv (boolean)
employee.calculateSalary() // hisob

// Repository metodlari:
findById(id)
findAll(filter, page, limit)
findByOrgFunction(orgFunctionId)
save(entity)
delete(id)
exists(id)

// Controller metodlari:
list(@Query() query)       // GET /employees
getOne(@Param('id') id)   // GET /employees/:id
create(@Body() dto)        // POST /employees
update(@Param('id'), @Body()) // PATCH /employees/:id
remove(@Param('id') id)   // DELETE /employees/:id

// TAQIQ nomlash:
getData()          // nima data? ❌
doSomething()      // nima qiladi? ❌
handleRequest()    // qaysi request? ❌
processInfo()      // qaysi info? ❌
```

---

## 4. O'ZGARUVCHI NOMLASH (camelCase)

```typescript
// ✅ TO'G'RI — aniq, tavsiflovchi:
const employeeId = 5;
const totalAmount = 5_000_000;
const isActive = true;
const createdAt = new Date();
const orgFunctionId = 12;
const hrManagerToken = getToken('hr_manager');

// Array:
const employees = [];         // ko'plik
const orderItems = [];
const razryadLevels = [];

// ❌ TAQIQ — noaniq:
const data = ...              // qaysi data?
const result = ...            // qaysi natija?
const temp = ...              // vaqtinchalik?
const x = ...                 // hech narsa anglatmaydi
const e = ...                 // employee? event? error?
const i = ...                 // faqat loop index uchun ruxsat

// Constants (SCREAMING_SNAKE_CASE):
const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;  // 10MB
const DEFAULT_PAGE_SIZE = 20;
const JWT_EXPIRES_IN = '15m';
```

---

## 5. DB NOMLASH (snake_case)

```sql
-- Jadval nomlari: [modul_prefiksi]_[entity]
hr_employees              -- hr modul, employees
hr_leave_requests         -- hr modul, leave requests
sales_orders              -- sd modul → sales_ prefix
sales_order_items
org_functions             -- org modul
org_departments
mes_sessions              -- mes modul
qc_inspections            -- qc modul
wms_warehouse_transactions -- wms modul
fin_budget_lines          -- fin modul (entries = SAP#76 exception)

-- Ustun nomlari: snake_case
id                        -- doim integer serial
full_name                 -- ikki so'z
org_function_id           -- FK: [jadval_tekis]_id
created_at                -- timestamp (doim _at)
updated_at
deleted_at                -- soft delete
created_by                -- FK users(id)
is_active                 -- boolean: is_ prefiksi
base_salary               -- numeric pul maydoni

-- Index nomlari: idx_[jadval]_[ustun]
idx_hr_employees_org_function_id
idx_sales_orders_customer_id
idx_sales_orders_deleted_at

-- FK constraint nomlari: fk_[jadval]_[ustun]
fk_hr_employees_org_function_id

-- Sequence: [jadval]_id_seq (PostgreSQL avtomatik)
```

---

## 6. API ROUTE NOMLASH

```
Qoidalar:
  - kebab-case, ko'plik, modul prefiksi
  - PATCH (emas PUT)
  - Harakat nomi uchun sub-route: /confirm, /cancel, /complete

Misollar:
  GET    /api/hr/employees              → ro'yxat
  GET    /api/hr/employees/:id          → yakka
  POST   /api/hr/employees              → yaratish
  PATCH  /api/hr/employees/:id          → yangilash
  DELETE /api/hr/employees/:id          → o'chirish

  GET    /api/sd/orders                 → buyurtmalar ro'yxati
  POST   /api/sd/orders                 → buyurtma yaratish
  PATCH  /api/sd/orders/:id/confirm     → tasdiqlash (harakat)
  PATCH  /api/sd/orders/:id/cancel      → bekor qilish

  GET    /api/org/functions             → org funksiyalar
  GET    /api/fin/entries?date=2026-06  → GL yozuvlar (filter)

  ❌ TAQIQ:
  GET /api/getEmployees        — fe'l bilan boshlanmaydi
  POST /api/createOrder        — yaratish POST bilan bildiriadi
  GET /api/employee_list       — snake_case route
  PUT /api/hr/employees/:id    — PUT emas PATCH
```

---

## 7. EVENT NOMLASH

```typescript
// Format: [modul].[entity].[amal] (snake_case, past tense)
'hr.employee.created'         // xodim yaratildi
'hr.employee.terminated'      // xodim ishdan ketdi
'sd.sales_order.confirmed'    // buyurtma tasdiqlandi
'sd.sales_order.cancelled'    // buyurtma bekor
'pp.work_order.created'       // ishlanma yaratildi
'pp.work_order.completed'     // ishlanma tugadi
'mes.session.started'         // smena boshlandi
'mes.session.completed'       // smena tugadi
'qc.inspection.passed'        // sifat o'tdi
'qc.inspection.failed'        // sifat o'tmadi
'wms.stock.received'          // ombor kirim
'wms.stock.issued'            // ombor chiqim
'fin.payment.received'        // to'lov keldi
'fin.payroll.period_closed'   // maosh davri yopildi

// ❌ TAQIQ:
'createOrder'           — present tense, camelCase
'OrderCreated'          — PascalCase, modul yo'q
'order_confirmed'       — modul yo'q
'sd_order_confirmed'    — underscore (modul.entity.action formati)
```

---

## 8. XATO KODI NOMLASH

```typescript
// Format: [MODUL]_[TAVSIF] (SCREAMING_SNAKE_CASE)
'HR_NOT_FOUND'           // Xodim topilmadi
'HR_EMAIL_DUPLICATE'     // Email takrorlanma
'HR_VALIDATION_ERROR'    // Validatsiya xatosi
'SD_ORDER_NOT_FOUND'     // Buyurtma topilmadi
'SD_CUSTOMER_INACTIVE'   // Mijoz faol emas
'PP_INSUFFICIENT_STOCK'  // Xom ashyo yetishmaydi
'MES_SESSION_ACTIVE'     // Smena allaqachon faol
'QC_INSPECTION_EXISTS'   // Tekshiruv allaqachon bor
'WMS_STOCK_NEGATIVE'     // Manfiy zaxira bo'lmaydi
'FIN_SAP76_FORBIDDEN'    // gl_journal_entries ga yozish taqiq
'AUTH_INVALID_TOKEN'     // JWT noto'g'ri
'AUTH_EXPIRED_TOKEN'     // JWT muddati o'tgan
'COMMON_VALIDATION'      // Umumiy validatsiya
'COMMON_NOT_FOUND'       // Umumiy topilmadi

// ❌ TAQIQ:
'error_404'             — HTTP kodi emas
'notFound'              — camelCase
'USER_ERROR_1'          — noaniq raqam
```

---

## 9. i18n KALIT NOMLASH

```typescript
// Format: [modul].[entity].[kalit]
'hr.employee.title'           → "Xodimlar"
'hr.employee.full_name'       → "To'liq ism"
'hr.employee.create'          → "Xodim qo'shish"
'hr.employee.delete_confirm'  → "O'chirishni tasdiqlang"

'sd.order.status.draft'       → "Qoralama"
'sd.order.status.confirmed'   → "Tasdiqlangan"

'common.actions.save'         → "Saqlash"
'common.actions.cancel'       → "Bekor qilish"
'common.actions.delete'       → "O'chirish"
'common.messages.saved'       → "Saqlandi"
'common.messages.error'       → "Xato yuz berdi"

'validation.required'         → "Majburiy maydon"
'validation.max_length'       → "Ko'pi bilan {{max}} belgi"

// ❌ TAQIQ:
'employees_title'             — modul yo'q, underscore
'hrEmployeeFullName'          — camelCase
'title'                       — juda umumiy
```

---

## 10. TAQIQ PATTERN XULOSA

```
❌ Abbreviatsiya (mgr, emp, ord, usr)  → to'liq nom
❌ 1 harfli o'zgaruvchi (x, e, r)      → faqat loop index (i, j, k)
❌ Raqam bilan tugash (data2, temp3)   → tavsiflovchi nom
❌ Tip o'zi nom (string1, array1)      → maqsad asosida nom
❌ Rus tilidagi nom (sotrudnik, zakaz) → inglizcha yoki o'zbekcha
❌ BARCHA KATTA HARF (EMPLOYEE)        → faqat constant uchun
❌ barcha kichik harf (hremployeeservice) → PascalCase class uchun
```

---

*EuroPrint ERP · Nomlashtirish Qoidalari · Versiya: 2026-06-18*
