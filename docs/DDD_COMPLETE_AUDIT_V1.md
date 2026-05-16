# EuroPrint ERP — DDD To'liq Audit Hisoboti

> **Sana:** 2026-05-15
> **Metod:** 4 parallel Explore agent, har biri DDD'ning **alohida o'lchamini** chuqur o'rganadi
> **Qoplam:** Tactical patterns + CQRS + Domain Events/Repositories + Strategic patterns
> **Hajmi:** 56 modul, ~3 000 fayl skaner qilindi
> **Asosiy xulosa:** **DDD umumiy compliance ~58%** — commit message'lardagi "DDD 95%" da'vosi marketing

---

## 1. EXECUTIVE SUMMARY

Loyihada DDD strukturasi **bor** (29 modulda `domain/`, `application/`, `infrastructure/`, `presentation/` papkalar). Lekin **strukturasi DDD'mi yoki DDD jingleisi** — bu hisobot javob beradi.

### Umumiy DDD ball: **58/100**

```
Tactical patterns (Aggregates, VOs, Events):      45-50%  ⚠️
CQRS (Command/Query separation):                  78%      ✅
Domain Events:                                     42%     ❌
Repositories:                                      68%     ⚠️
Strategic patterns (Bounded contexts, ACL):       58%     ⚠️
                                                  ─────
                                       O'RTACHA:   58%     ⚠️
```

### Top 3 yutuq

✅ **SD moduli (Sales-Delivery)** — DDD'ning oltin standarti. SalesOrder aggregate 338 qator, rich business logic
✅ **CRM Deal aggregate** — 57/60 ball, mukammal encapsulation va event emission
✅ **CQRS infrastruktura** — `@nestjs/cqrs` ulangan, 170 ta handler, 78% modulda real ishlamoqda

### Top 3 muammo

❌ **Primitive Obsession** — 24/29 modulda **0 ta VO**. ID'lar, status'lar `string` sifatida
❌ **CRM 11 parallel service** — `application/` ichida 11 ta service handler'larni bypass qiladi
❌ **Dual event mexanizmi** — `EventBus` va `EventEmitter2` ikkalasi parallel ishlatiladi

---

## 2. TACTICAL DDD PATTERNS (Agent 1)

### 2.1 Aggregate inventarizatsiya (29 modulda)

| Modul | Aggregates | VOs | Domain Services | Events | Repo Interfeyslar |
|---|:---:|:---:|:---:|:---:|:---:|
| crm | 2 | 3 | 3 | 3 | 2 |
| sd | 1 | 1 | 0 | 3 | 2 |
| auth | 1 | 1 | 0 | 1 | 1 |
| aisha | 1 | 3 | 0 | 5 | 0 |
| finance | 2 | 0 | 10 | 2 | 1 |
| hr | 3 | 0 | 3 | 2 | 1 |
| pp | 4 | 0 | 8 | 0 | 0 |
| qc | 3 | 0 | 8 | 0 | 1 |
| wms | 1 | 0 | 4 | 0 | 0 |
| director | 1 | 0 | 0 | 6 | 1 |
| order-workflow | 1 | 1 | 0 | 1 | 0 |
| shared | 0 | 6 | 0 | 0 | 0 |
| pos | 0 | 0 | 0 | 0 | 1 |
| ai, communication-center | 0 | 0 | 0 | 0 | 0 |
| (qolgan 15 modul) | 1-2 each | 0 | 0-1 | 0-1 | 1 |

**Jami:** 40 ta aggregate, 14 ta VO, 40 ta domain service, 25 ta event

### 2.2 Aggregate sifat scorecard (top 5)

| Aggregate | Rich Methods | Invariants | Result Pattern | Encapsulation | Events | Clean | JAMI/60 |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **crm/deal.aggregate.ts** | 9 | 9 | 10 | 9 | 10 | 10 | **57** |
| **sd/sales-order.aggregate.ts** | 8 | 9 | 10 | 9 | 10 | 10 | **56** |
| admin/user.aggregate.ts | 8 | 8 | 9 | 9 | 7 | 10 | 51 |
| core/department.aggregate.ts | 7 | 7 | 9 | 6 | 9 | 10 | 48 |
| hr/employee.aggregate.ts | 5 | 5 | 3 | 8 | 2 | 10 | **33** |

**Eng yaxshi 2 ta — referans standart sifatida ishlatilsin.**
**Eng yomon 1 ta (Employee) — Result yo'q, event yo'q, anemic ko'rinish.**

### 2.3 Value Object sifati (top 4)

| VO | Immutable | Equals | Validation | Result | Clean | JAMI/50 |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **shared/email.vo.ts** | 10 | 10 | 10 | 10 | 10 | **50** |
| **crm/deal-status.vo.ts** | 10 | 10 | 10 | 10 | 10 | **50** |
| auth/password.vo.ts | 10 | 8 | 10 | 8 | 10 | 46 |
| shared/money.vo.ts | 10 | 7 | 9 | 7 | 10 | 43 |

**Email VO va DealStatus VO — mukammal namuna.** Boshqa VO'lar shu darajaga ko'tarilishi kerak.

### 2.4 Eng katta anti-pattern: Primitive Obsession

**24 modul / 29 (83%)** **0 ta VO** bilan ishlaydi.

```typescript
// ❌ HOZIRGI HOLAT (Department aggregate):
class Department {
  private headId: string | null;          // EmployeeId VO bo'lishi kerak
  private code: string;                    // DepartmentCode VO bo'lishi kerak
  private parentId: string | null;        // DepartmentId VO bo'lishi kerak
}

// ✅ DDD TO'G'RI:
class Department {
  private headId: EmployeeId | null;      // VO — validatsiya + immutability
  private code: DepartmentCode;            // VO — formati majburiy
  private parentId: DepartmentId | null;  // VO — type safety
}
```

**Ta'siri:**
- Bug topish qiyin (`""` vs `undefined` vs `"null"` farqi yo'q)
- Validation har joyda takrorlanadi
- Type safety yo'q (har joyda `string`)

### 2.5 Tactical DDD verdict: **45-50%**

| Toifa | Modul soni | Foiz |
|---|:---:|:---:|
| Real tactical DDD (rich aggregates + VOs) | 8-10 | **30%** |
| Qisman (aggregate bor, VO yo'q) | 10-12 | **38%** |
| Anemic / CRUD-like | 8-10 | **32%** |

---

## 3. CQRS PATTERN (Agent 2)

### 3.1 CQRS infrastruktura

- ✅ `@nestjs/cqrs v11.0.3` ulangan
- ✅ `CqrsModule` 22 modulda import qilingan
- ✅ `CommandBus`, `QueryBus`, `EventBus` instantiated
- ✅ **170 ta handler fayl** mavjud (~95 command + ~75 query)

### 3.2 CQRS reality matrix (top 10 modul)

| Modul | Commands | Queries | Handlers | Services (anti-pattern) | CqrsModule | Bus | Ball/10 |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **sd** | 6 | 5 | 11 | **0** | ✅ | ✅ | **9.5** |
| **mes** | 4 | 4 | 8 | 0 | ✅ | ✅ | 9.5 |
| **qc** | 4 | 4 | 8 | 0 | ✅ | ✅ | 9.5 |
| **wms** | 5 | 5 | 10 | 0 | ✅ | ✅ | 9.5 |
| **hr** | 8 | 8 | 16 | 0 | ✅ | ✅ | 9.5 |
| **finance** | 6 | 6 | 12 | 0 | ✅ | ✅ | 9.5 |
| **pp** | 7 | 7 | 14 | 0 | ✅ | ✅ | 9.0 |
| **crm** | 7 | 3 | 10 | **11** | ✅ | Partial | **6.0** ⚠️ |
| admin | 0 | 0 | 0 | 5 | ❌ | ❌ | 3.0 |
| auth | 0 | 0 | 0 | 4 | ❌ | ❌ | 3.0 |

### 3.3 Eng katta CQRS anti-pattern: CRM module

**CRM `application/` ichida 11 ta service** (CQRS qoidasini buzadi):
```
crm/application/
├── crm-activities.service.ts
├── crm-ai.service.ts
├── crm-auto-lead.service.ts
├── crm-bitrix-compat.service.ts
├── crm-companies.service.ts
├── crm-contacts.service.ts
├── crm-comms.service.ts
├── crm-custom-fields.service.ts
├── crm-extras.service.ts
├── crm-followup-compat.service.ts
└── crm-ai-extended.service.ts
```

**Natija — parallel update paths:**
```typescript
// crm-leads.controller.ts:98
this.leadsService.findAll();          // ❌ service path
this.leadsService.create();           // ❌ service path
this.commandBus.execute(new ...);     // ✅ CQRS path
```

**Bir Lead 2 yo'l bilan yangilanadi** → eventual consistency yo'qoladi → bug.

### 3.4 CQRS verdict: **78% adoption**

8/10 asosiy modul to'liq CQRS, 2/10 (Admin, Auth) klassik (qabul qilinadi — cross-cutting), CRM — kontaminatsiyalangan.

---

## 4. DOMAIN EVENTS + REPOSITORIES (Agent 3)

### 4.1 Event-driven architecture

**Inventar:**
- **25 ta domain event** defined (`*.event.ts`)
- **24 ta listener** (`*.listener.ts`)
- **3/10 aggregate** real `addDomainEvent()` chaqiradi (7/10 — theatrical)

**Dual mexanizmi (anti-pattern):**
- `EventBus.publish()` — CRM, SD
- `EventEmitter2.emit()` + `@OnEvent('name')` — Finance, PP

Bu — 2 ta parallel event tizimi. Refactor uchun blocker.

### 4.2 20+ Trigger map (hujjat vs reality)

| Trigger | Hujjatda | Kodda |
|---|:---:|:---:|
| 1. Lead qualified → CRM pipeline | ✅ | ❌ Listener yo'q |
| 2. Deal Won → SD Order avto-yaratish | ✅ | ✅ **Ishlaydi** |
| 3. Design flag → Design task | ✅ | ✅ |
| 4. Sample flag → QC sample | ✅ | ❌ |
| 5. 3-checkpoint → PP signal | ✅ | ✅ |
| 6. Advance approved → PP unlock | ✅ | ✅ |
| 15. Full payment → Order closed | ✅ | ✅ |
| 20. Advance bypass audit | ✅ | ❌ Trigger map'da yo'q |
| 7-14, 16-19 | qisman | qisman |

**Implemented: 7 / 20+ (35%)**

### 4.3 Eng katta gap: Outbox pattern yo'q

```
Hozir:                      Tavsiya:
Aggregate.save()            Aggregate.save() + outbox INSERT (atomic)
       ↓                              ↓
EventBus.publish()           Outbox Publisher worker
       ↓                              ↓
Listener (fire-forget)       Listener (idempotent)
```

**Risk:** Handler crash → event yo'qoladi. Idempotency yo'q (duplicate fire mumkin).

### 4.4 Repository pattern

- **67 ta interface** (`i-*.repo.ts`) — barchasi `domain/repositories/`'da ✅
- **95+ ta Drizzle implementation** — barchasi `infrastructure/repositories/`'da ✅
- **5 ta repo `application/`'da** (anti-pattern, fix kerak)
- **4 ta aggregate** uchun 2 ta repo (CRM Leads, SD Orders, va h.k.)
- **0 ta repository test** (Docker postgres bilan integration test)

### 4.5 Eng yomon repo anti-pattern: CRM dual repository

```
CRM Leads:
  ├── DrizzleLeadRepository (DDD — Lead aggregate qaytaradi)
  └── DrizzleCrmLeadsRepository (legacy — Row[] qaytaradi)
```

Bir aggregate uchun 2 ta repo = bug magnet.

### 4.6 Events+Repos verdict: **55%** (42% events + 68% repos avg)

---

## 5. STRATEGIC DDD (Agent 4)

### 5.1 Module size taqsimoti

| Toifa | Modul soni | Modullar | Muammo |
|---|:---:|---|---|
| **HUGE (>100 fayl)** | 3 | hr (230), pos (139), finance (134) | **Bo'lish kerak** |
| LARGE (30-100) | 8 | crm (114), compatibility (88), wms (83), ai (83), pp (76), sd (67), qc (63), director (60) | OK |
| MEDIUM (10-30) | 18 | aisha, lms, kanban, iot, mm, auth, va h.k. | Yaxshi |
| SMALL (5-10) | 11 | core, common, website, ecommerce | OK |
| **TINY (<5 fayl)** | 16 | fi (1), storage (2), adaptation (4), feedback-360 (4), sales (4), sap (5) | **Birlashtirish kerak** |

### 5.2 Eng kritik strategic DDD muammolar

**1. "remaining/" — God Module (37 fayl, 9 ta unrelated domain):**
- company-state, exception-log, reports-hub, system, material-balance, production-facts, order-status, ideal-rasm, three-way-match
- Bounded context'siz axlat'xona

**2. "compatibility/" — ACL yo'q (88 fayl, 28 controller):**
- Legacy `Row` type'larni butun loyihaga eksport qiladi
- Anti-corruption layer'siz legacy konseptlar yangi koddan o'tib ketadi

**3. Mega-modullar:**
- `hr` (230 fayl) — payroll + recruitment + training + safety birga
- `pos` (139 fayl) — retail + payment + inventory birga
- `finance` (134 fayl) — invoicing + budgets + costing + reports birga

**4. Shared kernel bloated:**
- `apps/api/src/shared/db/` da **95+ schema fayl**
- Barcha modul shared schema'ga bog'liq → coupling
- Real DDD: har modul o'z schema'sini ownership qilishi kerak

**5. Cross-module direct import (7 ta):**
- `crm.module.ts` → `TelegramModule`
- `chat.module.ts` → `HrModule`
- `queue.module.ts` → `PpModule` (BomExplosionService), `AiModule` (Forecast)

### 5.3 Multi-tenancy strategic verdict

- `order-workflow` aggregate'da `tenantId` field bor ✅
- `compatibility/saas.service` tenant management stubs (P3-26 wired emas)
- **Reality:** No actual isolation. tenant_id 5/187 schema fayl'da

### 5.4 Strategic verdict: **58%**

| Aspekt | Ball |
|---|:---:|
| Module isolation (87.5% don't cross-import) | ✅ |
| Context map dokumentatsiya | ❌ (0%) |
| ACL legacy uchun | ❌ (20%) |
| Shared kernel sof | ❌ (40% — bloated) |
| Ubiquitous language | ⚠️ (65%) |
| Module size discipline | ⚠️ (50%) |
| Multi-tenancy | ❌ (30%) |

---

## 6. UMUMIY DDD COMPLIANCE — 56 MODUL BO'YICHA

### 6.1 Modul DDD scorecard

| Modul | Tactical | CQRS | Events | Repos | Strategic | **JAMI** |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **sd** | 85 | 95 | 90 | 80 | 80 | **86** ⭐ |
| **crm** | 65 | 60 | 75 | 65 | 75 | **68** |
| **mes** | 70 | 95 | 60 | 75 | 80 | **76** |
| **qc** | 70 | 95 | 50 | 75 | 80 | **74** |
| **wms** | 60 | 95 | 50 | 70 | 80 | **71** |
| **hr** | 50 | 95 | 40 | 75 | 60 | **64** |
| **finance** | 65 | 95 | 60 | 70 | 60 | **70** |
| **pp** | 50 | 90 | 30 | 60 | 80 | **62** |
| **auth** | 70 | 30 | 70 | 80 | 80 | **66** |
| **aisha** | 70 | 50 | 60 | 70 | 80 | **66** |
| **director** | 60 | 70 | 80 | 70 | 75 | **71** |
| **admin** | 50 | 30 | 30 | 70 | 75 | **51** |
| **lms** | 50 | 70 | 40 | 70 | 75 | **61** |
| **kanban** | 40 | 70 | 30 | 65 | 75 | **56** |
| **iot** | 40 | 60 | 30 | 65 | 75 | **54** |
| **logistics** | 50 | 70 | 30 | 70 | 75 | **59** |
| **mro** | 40 | 60 | 30 | 65 | 75 | **54** |
| **mm** | 40 | 65 | 30 | 60 | 70 | **53** |
| **design** | 50 | 70 | 50 | 65 | 75 | **62** |
| **marketing** | 40 | 60 | 30 | 65 | 65 | **52** |
| **notifications** | 40 | 50 | 60 | 65 | 70 | **57** |
| **security** | 50 | 60 | 30 | 65 | 75 | **56** |
| **pos** | 30 | 60 | 20 | 65 | 60 | **47** |
| **pos-v2** | 50 | 70 | 30 | 70 | 70 | **58** |
| **order-workflow** | 60 | 60 | 50 | 65 | 80 | **63** |
| **core** | 45 | 30 | 30 | 65 | 70 | **48** |
| **shared** | 80 (VOs) | N/A | N/A | N/A | 70 | **75** |
| **ai** | 30 | 30 | 30 | 50 | 60 | **40** |
| **communication-center** | 30 | 50 | 20 | 60 | 60 | **44** |
| (qolgan 26 modul: legacy, compat, integration, va h.k.) | 30-50 | 30-50 | 20-40 | 50-70 | 40-70 | **40-55** |

**Top 5 modul:** SD (86), MES (76), QC (74), Director (71), Finance (70)
**Bottom 5 modul:** AI (40), Communication-center (44), POS (47), Core (48), Admin (51)

### 6.2 Umumiy o'rtacha: **58/100**

---

## 7. AGENT TASK'LAR (siz so'raganday)

DDD'ni 58% → 85% ga ko'tarish uchun **20 ta atomic agent task**. Har biri **multi-agent reviewer pattern** bilan.

### Squad DDD-A: Primitive Obsession Fix (6 task)

```
DDD-A1: Create EmployeeId, DepartmentId, OrderId, CustomerId, ProductId VOs in shared/
DDD-A2: Migrate Department aggregate to use DepartmentId + EmployeeId VOs
DDD-A3: Migrate Employee aggregate (HR) to use IDs as VOs + add Result pattern
DDD-A4: Migrate SalesOrder to use OrderId + CustomerId VOs
DDD-A5: Add status VOs to 5 modules (lms, kanban, iot, marketing, mro)
DDD-A6: Money VO consistency — all amounts wrapped, no `number` for currency
Time: ~3 days each = 18 days
```

### Squad DDD-B: CRM Parallel Path Elimination (4 task)

```
DDD-B1: Delete crm-leads-ops.repository.ts + crm-leads-ops.service.ts
DDD-B2: Migrate crm-companies, crm-contacts, crm-communications services → handlers
DDD-B3: Migrate crm-activities, crm-extras, crm-custom-fields services → handlers
DDD-B4: Update CRM controllers — only CommandBus/QueryBus, no service direct calls
Time: ~8 days
```

### Squad DDD-C: Domain Event Discipline (4 task)

```
DDD-C1: Audit 10 aggregates without event emission — add addDomainEvent on state transitions
DDD-C2: Implement outbox pattern (domain_events table + publisher worker)
DDD-C3: Consolidate dual event mechanism — pick EventBus, deprecate EventEmitter2
DDD-C4: Implement 13 missing triggers from documented 20+
Time: ~8 days
```

### Squad DDD-D: Repository Hardening (3 task)

```
DDD-D1: Move 5 repos from application/ to infrastructure/
DDD-D2: Eliminate dual repositories (CRM, SD) — pick one, migrate
DDD-D3: Add integration tests for 30 critical repositories (Docker postgres)
Time: ~6 days
```

### Squad DDD-E: Strategic Refactoring (3 task)

```
DDD-E1: Split mega-modules:
  - hr → hr-payroll, hr-recruitment, hr-training, hr-safety
  - pos → pos-retail, pos-payment, pos-inventory
  - finance → finance-invoicing, finance-budgets, finance-reports, finance-costing
DDD-E2: Implement ACL for compatibility module — Row → DomainDTO translation
DDD-E3: Decompose "remaining/" — 9 unrelated services to proper bounded contexts
Time: ~12 days
```

### Total: **20 task, ~52 ish kun**

---

## 8. QUALITY GATES (har task uchun)

```
DDD Worker → PR
   ↓
3 ta avtomatik gate:
├── DDD Compliance Checker (yangi script)
│   - Aggregate sifat ≥ 50/60
│   - VO usage > 30%
│   - No service in application/commands/
├── Rule Enforcer (mavjud 22 rules)
└── Code Reviewer
   ↓
3/3 PASS → merge + DDD scorecard update
```

**Yangi script:** `scripts/ddd-compliance-check.mjs`:
```javascript
// Per-module ball, regression aniqlaydi
{
  "sd": { tactical: 85, cqrs: 95, events: 90, ... },
  "crm": { tactical: 65, cqrs: 60, ... }
}
```

CI gate: ball pasaysa — PR FAIL.

---

## 9. ROADMAP (3 oy / 12 hafta)

| Hafta | Squad | Maqsad | DDD ball |
|:---:|---|---|:---:|
| 1-2 | DDD-A (Primitive Obsession) | 14 → 40 VO | 58 → 65 |
| 3-4 | DDD-B (CRM parallel paths) | 11 service → 0 | 65 → 70 |
| 5-6 | DDD-C (Events + Outbox) | 7 → 20 triggers, outbox | 70 → 78 |
| 7-8 | DDD-D (Repository hardening) | Dual repos → 1, tests | 78 → 82 |
| 9-12 | DDD-E (Strategic) | Mega-module split, ACL, "remaining" decompose | 82 → 90 |

**Jami: 12 hafta, 1 odam parallel.** 2 odam — 6 hafta.

---

## 10. BITTA JUMLALI YAKUN

> **EuroPrint ERP DDD compliance 58/100 — strukturasi DDD'mi yoki DDD jingleisi savoliga javob: 30% real DDD + 38% qisman + 32% anemic/CRUD. Eng katta muammolar: 83% modul VO ishlatmaydi (primitive obsession), CRM 11 ta service handler'larni bypass qiladi, 25 event'ning 7 tasi real trigger'ga ulangan, hr/pos/finance — mega-modullar (>100 fayl), "remaining/" — 9 unrelated domain'li axlat'xona. 20 ta atomic task + multi-agent reviewer pattern bilan 12 hafta ichida DDD 58 → 90 ga ko'tariladi.**

---

## 11. AVVALGI HISOBOTLAR

- V1-V2 (May 13-15): Yuzaki audit, DDD = 47%
- V3 (May 15 chuqur): 5 agent, DDD = 35%
- V4 (May 15 +5h): 5 commit fix tasdiqlandi
- V5-V6 (May 15 +7h): Real ball 74, "DDD 95%" da'vosi yolg'on tasdiqlandi
- **DDD V1 (bu hisobot):** 4 agent chuqur tahlil, **58% umumiy DDD**

---

## 12. MANBALAR

- 4 ta Explore agent (parallel, ~4 daqiqa)
- 56 modulning real `domain/`, `application/`, `infrastructure/` strukturasini skaner
- 40 aggregate fayli o'qildi (top 15 chuqur tahlil)
- 14 VO fayli o'qildi
- 170 handler fayli inventarizatsiya
- 25 event + 24 listener tekshiruvi
- 67 repo interface + 95+ implementation skaner
- Git log oxirgi 68 commit
