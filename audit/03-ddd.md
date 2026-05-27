# Audit: 03 — DDD va Arxitektura Tahlili

**Sana:** 2026-05-25

---

## DDD Folder Strukturasi (modul bo'yicha)

| Modul | domain | application | infrastructure | presentation |
|---|---|---|---|---|
| admin | yes | yes | yes | yes |
| ai | yes | yes | yes | yes |
| aisha | yes | yes | yes | yes |
| auth | yes | yes | yes | yes |
| communication-center | yes | yes | yes | yes |
| core | yes | yes | yes | yes |
| crm | yes | yes | yes | yes |
| design | yes | yes | yes | yes |
| director | yes | yes | yes | yes |
| finance | yes | yes | yes | yes |
| hr | yes | yes | yes | yes |
| iot | yes | yes | yes | yes |
| kanban | yes | yes | yes | yes |
| lms | yes | yes | yes | yes |
| logistics | yes | yes | yes | yes |
| marketing | yes | yes | yes | yes |
| mes | yes | yes | yes | yes |
| mm | yes | yes | yes | yes |
| mro | yes | yes | yes | yes |
| notifications | yes | yes | yes | yes |
| order-workflow | yes | yes | yes | yes |
| pos | yes | yes | yes | yes |
| pos-v2 | yes | yes | yes | yes |
| pp | yes | yes | yes | yes |
| qc | yes | yes | yes | yes |
| sd | yes | yes | yes | yes |
| security | yes | yes | yes | yes |
| wms | yes | yes | yes | yes |
| **To'liq DDD strukturasiz modullar** | | | | |
| adaptation | no | no | no | no |
| agents | no | no | no | no |
| ai-agents | no | no | no | yes (only) |
| bot-gateway | no | no | no | no |
| camera | no | no | no | no |
| chat | no | no | no | no |
| common | no | no | no | yes (only) |
| compatibility | no | no | no | no |
| ecommerce | no | no | no | no |
| erp | no | no | no | no |
| export | no | no | no | no |
| feedback-360 | no | no | no | no |
| fi | no | no | no | no |
| general | no | no | no | no |
| hr-assets | no | no | no | no |
| integration | no | no | no | no |
| legacy | no | no | no | no |
| org-structure | no | no | no | no |
| queue | no | no | no | no |
| remaining | no | no | no | no |
| shared | yes | no | yes | no |
| storage | no | no | no | no |

**Xulosa:** 28 ta modul to'liq 4-qatlamli DDD strukturasiga ega. 23 ta modul hech qanday DDD strukturasiz — flat yoki bo'sh papkalar.

---

## Aggregate'lar

**Topilgan:** 45 ta (path: `*/domain/aggregates/*.ts`)

To'liq ro'yxat:
- admin/user, aisha/conversation, auth/auth-user
- core/department, core/panel, core/position
- crm/deal, crm/lead
- design/design-order
- director/approval-request
- finance/budget, finance/invoice
- hr/attendance, hr/employee, hr/funnel, hr/leave-request, hr/onboarding-plan, hr/payroll-record
- iot/sensor-device, iot/sensor-reading
- kanban/kanban-task
- lms/certificate
- logistics/delivery
- marketing/campaign
- mes/downtime-event, mes/production-session
- mm/material, mm/purchase-order
- mro/maintenance-order
- notifications/notification
- order-workflow/order
- pos-v2/inventory-count, pos-v2/transfer-request
- pp/bom, pp/production-order, pp/routing, pp/work-center
- qc/defect, qc/inspection, qc/reclamation
- sd/sales-order
- security/security-incident
- wms/stock

---

## Value Object'lar

**Topilgan:** 20 ta (path: `*/domain/value-objects/*.ts`)

- aisha: pending-approval, tool-call, voice-command
- auth: password
- crm: ai-score, deal-status, lead-status
- hr: funnel-stage, salary
- order-workflow: order-status
- sd: so-status
- shared: currency, customer-id, email, employee-id, invoice-status, money, phone-number, product-id, tenant-id

**Muammo:** 45 ta aggregate uchun faqat 20 ta VO — ko'plab modullar domain-specific VO'larsiz ishlayapti. Masalan, `pp`, `wms`, `logistics`, `mes`, `mro`, `qc` modullarida birorta ham modul-spesifik VO yo'q.

---

## Repository Pattern

- **Interface'lar (i-*.ts):** 80 ta
- **Implementatsiyalar (drizzle-*.ts):** 85 ta
- **Baholash:** Soni yaqin, ammo implementatsiya interfeyslarga qaraganda +5 — ba'zi implementatsiyalar interfeyzsiz ishlayotgan bo'lishi mumkin.

### IoC Bypass — Controller'dan to'g'ridan DB ga kirish

10 ta controller fayl `db.` yoki `runQuery` orqali to'g'ridan-to'g'ri ma'lumotlar bazasiga murojaat qiladi — repository layer'ni bypass qiladi:

```
communication-center/cc-documents.controller.ts    → runQuery (SQL raw)
communication-center/cc-public.controller.ts       → runQuery (SQL raw)
communication-center/cc-webhook.controller.ts      → db.
compatibility/departments-positions-compat.controller.ts → db.execute(sql`...`)
hr/hr-employee-goals.controller.ts                 → runQuery (5+ joyda)
kanban/kanban-cards.controller.ts                  → db. yoki runQuery
lms/lms-core.controller.ts                         → db. yoki runQuery
mm/mm-purchase-orders.controller.ts                → db. yoki runQuery
qc/qc-reclamations.controller.ts                   → db. yoki runQuery
sd/sd-contracts.controller.ts                      → db. yoki runQuery
```

Bu DDD qoidasini buzish: presentation layer domain layerga emas, to'g'ri infra'ga murojaat qilmoqda.

---

## CQRS

- **Command handler'lar:** 87 ta
- **Query handler'lar:** 69 ta
- **`commandBus.execute()` / `CommandBus` ishlatuvchi modullar:** 61 ta fayl
- **`@EventsHandler` dekoratorlari:** 68 ta

CQRS NestJS pattern orqali to'liq qo'llanilgan. Buyruq va so'rov handler'lari alohida papkalarda. EventsHandler soni (68) katta — domenga asoslangan event-driven arxitektura ishlaydi.

---

## Result Pattern

- **`Result<` / `.isOk()` / `Result.ok` ishlatuvchi fayllar:** 1254 ta
- **`throw new Exception/Error` ishlatuvchi fayllar:** 293 ta
- **Holat:** Aralash — loyihaning 80%+ qismi Result pattern'ga o'tkazilgan, lekin 293 ta faylda hali ham exception throwing davom etmoqda.

Result pattern `@common/types/result.type` va `@common/result` orqali ikki xil import yo'li bilan ishlatilmoqda — bu konventsiya nomuvofiqligini ko'rsatadi.

---

## 5 Kritik Aggregate Chuqur Tahlili

### 1. CRM Lead
**Fayl:** `apps/api/src/modules/crm/domain/aggregates/lead.aggregate.ts`
**LOC:** 258
**Tavsif:** Rich Domain Model

**Asosiy biznes metodlar:**
```ts
qualify(): Result<void> {
  if (!this.canQualify()) {
    return Err('Lead cannot be qualified from current status');
  }
  const statusResult = LeadStatus.create('qualified');
  if (!statusResult.ok) return Err('Invalid status transition');
  this.status = statusResult.data;
  this.addDomainEvent({ aggregateId: this.id, eventName: 'LeadQualified' });
  return Ok();
}

convertToDeal(dealId: number): Result<void> {
  if (this.status.getValue() !== 'qualified') {
    return Err('Only qualified leads can be converted to deals');
  }
  // status → 'converted' + LeadConverted event
}

markAsLost(reason: string): Result<void> {
  // terminal status guard + LeadLost event
}

private canQualify(): boolean {
  const validStatuses = ['new', 'contacted'];
  return validStatuses.includes(this.status.getValue());
}
```

**Domain event'lar:** LeadQualified, LeadConverted, LeadLost — barchasi `addDomainEvent` orqali.
**Invariant tekshiruvlar:** Status mashinasi to'g'ri — faqat `new/contacted` → `qualified`, faqat `qualified` → `converted`.
**VO'lar:** `LeadStatus`, `AIScore`, `Email`, `PhoneNumber`, `CustomerId` — barchasi Type-safe.
**Verdikt:** Loyihadagi eng yaxshi aggregate namunalaridan biri. Rich model, invariantlar to'g'ri, event'lar mavjud.

---

### 2. CRM Deal
**Fayl:** `apps/api/src/modules/crm/domain/aggregates/deal.aggregate.ts`
**LOC:** 156
**Tavsif:** Rich Domain Model

**Asosiy biznes metodlar:**
```ts
markAsWon(actualAmount?: number): Result<void> {
  if (!this.canMarkAsWon()) {
    return Err(`Cannot mark deal as won from status '${this.status.getValue()}'`);
  }
  // Money VO orqali actualAmount validatsiya
  this.addDomainEvent({ eventName: 'DealWon', data: { dealId, companyId, totalAmount } });
  return Ok();
}

markAsLost(reason: string): Result<void> {
  if (this.status.getValue() === 'lost' || this.status.getValue() === 'won') {
    return Err(`Cannot mark deal as lost from terminal status...`);
  }
  if (!reason || reason.trim().length === 0) {
    return Err('Loss reason is required'); // Non-empty reason invariant
  }
}

updateStatus(newStatus: string): Result<void> {
  if (newStatus === 'won' || newStatus === 'lost') {
    return Err(`Use markAsWon()/markAsLost() to transition to '${newStatus}'`);
  }
  // Faqat intermediate statuslar: qualification → proposal → negotiation
}

private canMarkAsWon(): boolean {
  const winningStatuses = ['proposal', 'negotiation'];
  return winningStatuses.includes(this.status.getValue());
}
```

**Domain event'lar:** DealWon, DealLost.
**Invariant tekshiruvlar:** Terminal holatdan qaytib bo'lmaydi, `won/lost` faqat dedicated metodlar orqali.
**Verdikt:** Juda yaxshi — `updateStatus` metodi `won/lost`ga o'tishni taqiqlab, to'g'ri metodlarga yo'naltiradi. Bu kuchli dizayn qaror.

---

### 3. HR Employee
**Fayl:** `apps/api/src/modules/hr/domain/aggregates/employee.aggregate.ts`
**LOC:** 243
**Tavsif:** Qisman Rich — asosan hisob-kitob metodlari bor, lekin holatni o'zgartiruvchi biznes metodlar (terminate, promote, transfer) yo'q.

**Asosiy biznes metodlar:**
```ts
calculateGrossSalary(overtimeHours: number, bonus: number): number { ... } // Legacy, primitive
calculateGrossSalaryVO(overtimeHours: number, bonus: number): Result<Money> { ... } // VO version
calculateInps(gross: number, inpsRate): number { ... }
calculateInpsVO(gross: number, inpsRate): Result<Money> { ... }
calculateJshd(gross: number, jshdRate): number { ... }
calculateJshdVO(gross: number, jshdRate): Result<Money> { ... }
calculateNetSalary(gross, inps, jshd, other): number { ... }
calculateNetSalaryVO(...): Result<Money> { ... }
emitSalaryCalculation(...): void { ... } // event emit
```

**Muammo:** `terminate()`, `goOnLeave()`, `activate()`, `promote()`, `transferDepartment()` metodlari YO'Q. `status` maydoni mavjud (`active | on_leave | terminated`) lekin uni o'zgartiruvchi domain metodlar yo'q. Bu anemic model belgisi — holat o'zgarishi service/handler darajasida amalga oshirilayotgan bo'lishi mumkin.

**Domain event'lar:** `SalaryCalculatedEvent` — faqat hisob-kitob uchun, holatni o'zgartiruvchi eventlar yo'q.
**Verdikt:** Hisob-kitob qismi rich, lekin lifecycle management (ishga olish, bo'shatish, ta'tilga yuborish) aggregate tashqarisida qolgan. Qisman anemic.

---

### 4. Finance Invoice
**Fayl:** `apps/api/src/modules/finance/domain/aggregates/invoice.aggregate.ts`
**LOC:** 217
**Tavsif:** Rich Domain Model — refactor amalga oshirilgan (DDD C.20/C.21 deb izohda yozilgan)

**Asosiy biznes metodlar:**
```ts
markAsPartiallyPaid(amount: number): Result<void> {
  // 1. status 'draft' yoki 'overdue' bo'lsa to'lov qabul qilinmaydi
  // 2. Salbiy miqdor rad etiladi
  // 3. Ortiqcha to'lov bloklanadi
  // 4. InvoicePartiallyPaidEvent emit
  // 5. Agar to'liq to'lansa — InvoiceFullyPaidEvent emit + status o'zgaradi
}

markAsFullyPaid(finalAmount: number): Result<void> { ... }

get remainingAmount(): number { ... }
get isOverdue(): boolean { ... } // Deadline o'tganmi?
```

**Domain event'lar:** `InvoiceFullyPaidEvent`, `InvoicePartiallyPaidEvent` — alohida event fayllarda.
**Invariant tekshiruvlar:** Salbiy to'lov, ortiqcha to'lov, noto'g'ri status — hammasi bloklanadi.
**Dual API muammosi:** Legacy `InvoiceProps` va yangi `InvoiceCreateInput` — ikkala factory yo'li mavjud, bu murakkablikni oshiradi.
**Verdikt:** Yaxshi refactor amalga oshirilgan, lekin ikki xil factory yo'li saqlanib qolgan.

---

### 5. PP ProductionOrder
**Fayl:** `apps/api/src/modules/pp/domain/aggregates/production-order.aggregate.ts`
**LOC:** 131
**Tavsif:** Rich Domain Model — sodda, ammo to'liq

**Asosiy biznes metodlar:**
```ts
release(): Result<void> {
  if (!this._checkpointValidated) return Err('CHECKPOINT_REQUIRED');
  if (this._status !== PoStatus.PLANNED) return Err('INVALID_STATUS_FOR_RELEASE');
  this._status = PoStatus.RELEASED_TO_PRODUCTION;
  this.addDomainEvent({ type: 'PP_RELEASED_TO_PRODUCTION', data: { poId } });
  return { ok: true, data: undefined };
}

startProduction(): Result<void> {
  if (this._status !== PoStatus.RELEASED_TO_PRODUCTION) return Err('NOT_RELEASED');
  this._status = PoStatus.IN_PROGRESS;
  this.addDomainEvent({ type: 'PP_STARTED', ... });
}

complete(): Result<void> {
  if (this._status !== PoStatus.IN_PROGRESS) return Err('NOT_IN_PROGRESS');
  this._status = PoStatus.COMPLETED;
  this.addDomainEvent({ type: 'PP_COMPLETED', ... });
}

addMaterialRequirement(material): Result<void> {
  // Duplicate material guard
}
```

**Kichik farqlar boshqalardan:**
- Error kodlari string literal sifatida (masalan `'CHECKPOINT_REQUIRED'`) — bu to'g'ri pattern (tarjima presentation layer'da).
- `Ok()` o'rniga `{ ok: true, data: undefined }` — bir xil Result pattern'ning turli yozuvi, aralash konventsiya.
- `_orderNumber`, `_createdAt` kabi IOrderHeader maydonlari hali to'ldirilmagan (`''`, `new Date()`).

**Verdikt:** Kichik, lekin mazmunan to'g'ri. Holat mashinkasi aniq, har bir o'tish tekshirilgan. IOrderHeader implementatsiyasi stub darajasida.

---

## Umumiy DDD Sifat Bahosi

### Kuchli tomonlar

1. **Struktura mavjud va izchil** — 28 ta modul to'liq 4-qatlamli DDD arxitekturasiga ega (domain / application / infrastructure / presentation).
2. **Aggregate'lar rich model** — Lead, Deal, Invoice, ProductionOrder biznes metodlarga ega, anemic emas.
3. **Result pattern keng qo'llangan** — 1254 ta fayl `Result<T>` ishlatadi. Exception-based approach qoldig'i (293 fayl) qisqarib bormoqda.
4. **Domain event'lar ishlaydi** — 68 ta `@EventsHandler`, 76 ta event fayl, real event bus integratsiyasi bor.
5. **Value Object'lar shared/** — `Money`, `Email`, `PhoneNumber`, `Currency`, `TenantId` kabi umumiy VO'lar markazlashtirilgan.
6. **Repository interfeyslari** — 80 ta interface, 85 ta implementatsiya. IoC container orqali bog'liq.
7. **CQRS to'liq** — 87 command + 69 query handler, CommandBus 61 modulda ishlatilgan.

### Muammolar

1. **IoC Bypass (kritik):** 10 ta controller fayl repository'ni o'tkazib, to'g'ridan-to'g'ri `db.execute()` yoki `runQuery()` chaqiradi. Bu presentation → domain → infrastructure qoidasini buzadi. Eng yomoni: `hr-employee-goals.controller.ts` — 5+ joyda raw SQL, `compatibility` controller esa to'liq DDD'siz ishlaydi.

2. **VO yetishmovchiligi:** 45 aggregate uchun faqat 20 VO. `pp`, `wms`, `logistics`, `mes`, `mro`, `qc` modullarida modul-spesifik VO'lar yo'q — bu primitive obsession anti-pattern.

3. **HR Employee — qisman anemic:** `status` maydoni (`active | on_leave | terminated`) bor, lekin `terminate()`, `goOnLeave()`, `activate()` metodlari yo'q. Holat o'zgarishi aggregate tashqarisida amalga oshirilayotgan bo'lishi mumkin.

4. **Result pattern ikki import yo'li:** `@common/types/result.type` va `@common/result` — bir xil narsaning ikki xil joyi. Konventsiya birlashtirilib yuborilmagan.

5. **23 ta "bo'sh" modul:** `adaptation`, `agents`, `chat`, `ecommerce`, `feedback-360`, `fi`, `legacy` va boshqalar — DDD strukturasiz papkalar. Ular refaktoring ketidan qolgan yoki hali qo'shilmagan.

6. **IOrderHeader stub implementatsiyasi:** `ProductionOrder`dagi `_orderNumber = ''`, `_createdAt = new Date()` — persistence modeli hali yetarlicha rivojlanmagan.

7. **Dual factory pattern (Invoice):** Legacy `InvoiceProps` va yangi `InvoiceCreateInput` bir aggregate ichida — migratsiya tugallanmagan.

### Umumiy baho

```
DDD Folder Struktura:  8/10  (28 modul to'liq, 23 flat)
Aggregate boylik:      7/10  (ko'pchilik rich, HR Employee qisman anemic)
Value Object coverage: 5/10  (faqat 20/45, ko'p modullarda yo'q)
Repository pattern:    7/10  (10 controller IoC'ni bypass qiladi)
CQRS:                  8/10  (to'liq qo'llanilgan)
Result pattern:        7/10  (aralash, 293 fayl hali exception)
Domain Events:         8/10  (68 handler, real integratsiya)

Umumiy: 7.1/10
```

Loyiha DDD arxitekturasini **jiddiy qabul qilgan** va asosiy qismlarda to'g'ri amalga oshirgan. Asosiy muammo — refaktoring tugallanmaganida: ba'zi modullar hali flat, ba'zi controller'lar DDD'ni bypass qiladi, VO coverage yetarli emas.
