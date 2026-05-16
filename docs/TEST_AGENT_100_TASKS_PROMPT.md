# EuroPrint ERP — 100 Test Task Agent Promti (Atomic Execution)

> **Bu fayl AI agent (Claude Code, Cursor) uchun yo'riqnoma.**
> Loyihada **100 ta atomic test task**. ~40 tasi allaqachon bajarilgan — qolgan 60 tasi + qo'shimcha kengaytirish bilan jami **100 ta** tugatiladi.
> Promtni o'zgartirmasdan to'liqligicha agentga bering.

---

## SIZ KIMSIZ

Siz — **Test Engineer Agent**. Vazifangiz: EuroPrint ERP loyihasi uchun **100 ta atomic test task** yaratish, **mavjudlarini tekshirish**, **yo'qlarini yozish**. Har task — bitta test fayl.

Loyiha:
```
Uzbek-Language-Module/
├── apps/api/                         ← NestJS backend
│   ├── src/modules/                  ← 55 domain modul
│   └── test/                          ← mavjud testlar shu yerda
├── artifacts/erp-dashboard/          ← React frontend
└── lib/db/                            ← Drizzle schemas
```

**Hozirgi holat:**
- ~40 ta test fayl allaqachon mavjud (S2–S6 batch'lar)
- Backend coverage: ~25% (oshib boryapti)
- Frontend coverage: ~5%
- **Maqsad: 100 ta test fayl, backend ≥ 80%, frontend ≥ 60%**

---

## ⚠️ ISH BOSHIDA — BIR MARTALIK RUXSAT

Birinchi xabaringizda foydalanuvchidan **bitta** ruxsat so'rang:

```
Quyidagi fayl va papkalarga to'liq o'qish + yozish ruxsati so'rayman.
Har task uchun qaytadan ruxsat so'ramayman — 100 taskni oxirigacha bajaraman.

1. apps/api/src/**/*.ts                            (manba kod)
2. apps/api/test/**/*.ts                           (mavjud + yangi testlar)
3. artifacts/erp-dashboard/src/**/*.{ts,tsx}       (frontend manba)
4. artifacts/erp-dashboard/e2e/**/*.spec.ts        (Playwright)
5. apps/api/test/_fixtures/                         (factory fayllar)
6. apps/api/test/_helpers/                          (helper fayllar)
7. docs/test-progress.md                            (progress hisobot)
8. apps/api/package.json                            (paket qo'shish)
9. artifacts/erp-dashboard/package.json
10. artifacts/erp-dashboard/playwright.config.ts

Ruxsat berasizmi? (HA / YO'Q)
```

**"HA" desa** — boshlaysiz va keyin hech qachon ruxsat so'ramaysiz.

---

## QATTIQ QOIDALAR

1. **100 task = 100 test fayl.** Sakrash yo'q, yarim qoldirish yo'q.
2. **Avval mavjudlarni tekshirasiz** (audit), keyin yangilarini yozasiz.
3. **TaskCreate orqali 100 task** yaratasiz birinchi marta. Keyin TaskUpdate orqali ish.
4. **`it.skip`, `xit`, `test.todo` TAQIQLANGAN.**
5. **`expect(true).toBe(true)` TAQIQLANGAN.**
6. **Business logic'ni mock qilish TAQIQLANGAN** — faqat I/O.
7. **Har test nomi:** `it('<verb> <expected> when <condition>')`.
8. **Fayl ≤ 300 qator.**
9. **Har task tugagandan keyin** `pnpm test:api <fayl>` yashil bo'lishi shart.
10. **Hadeb so'rashga TAQIQLANGAN** — 100 ta oxirigacha.
11. **`console.log` test ichida TAQIQLANGAN.**
12. **TypeScript strict + ESLint pass** har faylda.

---

## 0-QADAM — MAVJUDLARNI INVENTARIZATSIYA QILING

Birinchi qadam: **ish boshlashdan oldin**, hozirgi test holatini aniqlang:

```bash
# 1. Mavjud test fayllar ro'yxati
find apps/api/test -name "*.spec.ts" > docs/test-inventory.txt
find artifacts/erp-dashboard -name "*.test.tsx" -o -name "*.test.ts" >> docs/test-inventory.txt
find artifacts/erp-dashboard/e2e -name "*.spec.ts" >> docs/test-inventory.txt

# 2. Coverage o'lchang
pnpm --filter @europrint/api test --coverage --silent 2>&1 | tail -20 > docs/test-baseline-coverage.txt

# 3. Mavjudlar va kerakli 100 ro'yxat solishtirish
node scripts/audit-test-coverage.mjs > docs/test-gap-analysis.md
```

Bu hisobot 100 ta vazifaning **qaysilari mavjud, qaysilari yo'q** ekanini aniq ko'rsatadi.

---

## 1-QADAM — 100 TASKNI YARATING

Bir martalik ruxsatdan keyin, `TaskCreate` orqali **100 taskni bir vaqtning o'zida** yarating. Har task uchun **metadata**'da quyidagini saqlang:

```json
{
  "subject": "TASK N: <nomi>",
  "description": "<vazifa>",
  "metadata": {
    "fayl": "apps/api/test/.../X.spec.ts",
    "manba": "apps/api/src/.../X.ts",
    "minTestCases": 8,
    "guruh": "domain|handler|repo|controller|guard|hook|component|e2e",
    "status": "mavjud|qisman|yo'q"
  }
}
```

**Avval `docs/test-inventory.txt`ni o'qib**, har taskni:
- ✅ MAVJUD bo'lsa — `status='mavjud'` qo'ying, **verification fazaga o'tkazasiz** (test'larni qayta o'qib, sifatini baholaysiz, kerakli test case'larni qo'shasiz)
- ⚠️ QISMAN — `status='qisman'`, kamayotgan test'larni qo'shasiz
- ❌ YO'Q — `status='yo'q'`, noldan yozasiz

---

## 100 TASK RO'YXATI

### GURUH 1 — Domain Aggregates va Value Objects (Task 1–15)

| # | Fayl | Manba | Min test |
|:---:|---|---|:---:|
| 1 | `unit/crm/lead.aggregate.spec.ts` | `crm/domain/aggregates/lead.aggregate.ts` | 8 |
| 2 | `unit/crm/deal.aggregate.spec.ts` | `crm/domain/aggregates/deal.aggregate.ts` | 8 |
| 3 | `unit/sd/sales-order.aggregate.spec.ts` | `sd/domain/aggregates/sales-order.aggregate.ts` | 12 |
| 4 | `unit/auth/auth-user.aggregate.spec.ts` | `auth/domain/aggregates/auth-user.aggregate.ts` | 8 |
| 5 | `unit/auth/password.vo.spec.ts` | `auth/domain/value-objects/password.vo.ts` | 10 |
| 6 | `unit/shared/money.vo.spec.ts` | `shared/domain/value-objects/money.vo.ts` | 8 |
| 7 | `unit/crm/ai-score.vo.spec.ts` | `crm/domain/value-objects/ai-score.vo.ts` | 5 |
| 8 | `unit/crm/lead-status.vo.spec.ts` | `crm/domain/value-objects/lead-status.vo.ts` | 5 |
| 9 | `unit/crm/deal-status.vo.spec.ts` | `crm/domain/value-objects/deal-status.vo.ts` | 5 |
| 10 | `unit/sd/so-status.vo.spec.ts` | `sd/domain/value-objects/so-status.vo.ts` | 8 |
| 11 | `unit/sd/quotation.aggregate.spec.ts` | `sd/domain/aggregates/quotation.aggregate.ts` | 8 |
| 12 | `unit/sd/invoice.aggregate.spec.ts` | `sd/domain/aggregates/invoice.aggregate.ts` | 8 |
| 13 | `unit/sd/delivery.aggregate.spec.ts` | `sd/domain/aggregates/delivery.aggregate.ts` | 8 |
| 14 | `unit/hr/employee.aggregate.spec.ts` | `hr/domain/aggregates/employee.aggregate.ts` | 8 |
| 15 | `unit/pp/production-order.aggregate.spec.ts` | `pp/domain/aggregates/production-order.aggregate.ts` | 10 |

### GURUH 2 — CQRS Command/Query Handlers (Task 16–35)

| # | Fayl | Manba | Min test |
|:---:|---|---|:---:|
| 16 | `unit/auth/login.handler.spec.ts` | `auth/application/commands/login.handler.ts` | 10 |
| 17 | `unit/auth/logout.handler.spec.ts` | `auth/application/commands/logout.handler.ts` | 5 |
| 18 | `unit/auth/change-password.handler.spec.ts` | `auth/application/commands/change-password.handler.ts` | 8 |
| 19 | `unit/auth/verify-otp.handler.spec.ts` | `auth/application/commands/verify-otp.handler.ts` | 6 |
| 20 | `unit/auth/resend-otp.handler.spec.ts` | `auth/application/commands/resend-otp.handler.ts` | 5 |
| 21 | `unit/crm/create-lead.handler.spec.ts` | `crm/application/commands/create-lead.handler.ts` | 7 |
| 22 | `unit/crm/qualify-lead.handler.spec.ts` | `crm/application/commands/qualify-lead.handler.ts` | 6 |
| 23 | `unit/crm/create-deal.handler.spec.ts` | `crm/application/commands/create-deal.handler.ts` | 6 |
| 24 | `unit/crm/mark-deal-won.handler.spec.ts` | `crm/application/commands/mark-deal-won.handler.ts` | 6 |
| 25 | `unit/sd/create-order.handler.spec.ts` | `sd/application/commands/create-order.handler.ts` | 7 |
| 26 | `unit/sd/update-order-status.handler.spec.ts` | `sd/application/commands/update-order-status.handler.ts` | 8 |
| 27 | `unit/sd/approve-advance-bypass.handler.spec.ts` | `sd/application/commands/approve-advance-bypass.handler.ts` | 7 |
| 28 | `unit/sd/approve-tech-checkpoint.handler.spec.ts` | `sd/application/commands/approve-tech-checkpoint.handler.ts` | 8 |
| 29 | `unit/sd/create-invoice.handler.spec.ts` | `sd/application/commands/create-invoice.handler.ts` | 7 |
| 30 | `unit/sd/confirm-advance-payment.handler.spec.ts` | `sd/application/commands/confirm-advance-payment.handler.ts` | 7 |
| 31 | `unit/hr/create-employee.handler.spec.ts` | `hr/application/commands/create-employee.handler.ts` | 6 |
| 32 | `unit/hr/request-leave.handler.spec.ts` | `hr/application/commands/request-leave.handler.ts` | 6 |
| 33 | `unit/pp/start-production.handler.spec.ts` | `pp/application/commands/start-production.handler.ts` | 7 |
| 34 | `unit/wms/receive-inventory.handler.spec.ts` | `wms/application/commands/receive-inventory.handler.ts` | 6 |
| 35 | `unit/wms/transfer-inventory.handler.spec.ts` | `wms/application/commands/transfer-inventory.handler.ts` | 7 |

### GURUH 3 — Repository Integration Tests (Task 36–50)

Test DB bilan (Docker postgres-test).

| # | Fayl | Manba | Min test |
|:---:|---|---|:---:|
| 36 | `integration/auth/drizzle-auth.repo.spec.ts` | `auth/infrastructure/repositories/drizzle-auth.repo.ts` | 8 |
| 37 | `integration/crm/drizzle-lead.repo.spec.ts` | `crm/infrastructure/repositories/drizzle-lead.repo.ts` | 7 |
| 38 | `integration/crm/drizzle-deal.repo.spec.ts` | `crm/infrastructure/repositories/drizzle-deal.repo.ts` | 7 |
| 39 | `integration/sd/drizzle-sales-order.repo.spec.ts` | `sd/infrastructure/repositories/drizzle-sales-order.repo.ts` | 8 |
| 40 | `integration/sd/drizzle-sd-orders.repo.spec.ts` | `sd/orders/drizzle-sd-orders.repo.ts` | 6 |
| 41 | `integration/sd/drizzle-sd-invoices.repo.spec.ts` | `sd/invoices/drizzle-sd-invoices.repo.ts` | 6 |
| 42 | `integration/sd/drizzle-sd-deliveries.repo.spec.ts` | `sd/deliveries/drizzle-sd-deliveries.repo.ts` | 6 |
| 43 | `integration/hr/drizzle-employees.repo.spec.ts` | `hr/employees/drizzle-employees.repo.ts` | 7 |
| 44 | `integration/kanban/drizzle-kanban.repo.spec.ts` | `kanban/infrastructure/repositories/drizzle-kanban.repo.ts` | 7 |
| 45 | `integration/sd/drizzle-quotation.repo.spec.ts` | yangi yoki mavjud | 6 |
| 46 | `integration/sd/drizzle-contract.repo.spec.ts` | yangi yoki mavjud | 6 |
| 47 | `integration/pp/drizzle-production-order.repo.spec.ts` | `pp/infrastructure/repositories/...` | 7 |
| 48 | `integration/wms/drizzle-inventory.repo.spec.ts` | `wms/infrastructure/repositories/...` | 7 |
| 49 | `integration/finance/drizzle-gl.repo.spec.ts` | `finance/infrastructure/repositories/...` | 7 |
| 50 | `integration/pos/drizzle-pos.repo.spec.ts` | `pos/infrastructure/repositories/...` | 6 |

### GURUH 4 — Controller E2E (Supertest, Task 51–66) — KO'P YANGI

| # | Fayl | Controller | Min test |
|:---:|---|---|:---:|
| 51 | `e2e/auth.controller.e2e-spec.ts` | AuthController | 12 |
| 52 | `e2e/crm-leads.controller.e2e-spec.ts` | CrmLeadsController | 10 |
| 53 | `e2e/crm-deals.controller.e2e-spec.ts` | CrmDealsController | 10 |
| 54 | `e2e/crm-contacts.controller.e2e-spec.ts` | CrmContactsController | 8 |
| 55 | `e2e/sd-orders.controller.e2e-spec.ts` | SdOrdersController | 10 |
| 56 | `e2e/sd-invoices.controller.e2e-spec.ts` | SdInvoicesController | 8 |
| 57 | `e2e/sd-quotations.controller.e2e-spec.ts` | SdQuotationsController | 8 |
| 58 | `e2e/hr-employees.controller.e2e-spec.ts` | HrEmployeesController | 10 |
| 59 | `e2e/hr-payroll.controller.e2e-spec.ts` | HrPayrollController | 8 |
| 60 | `e2e/finance.controller.e2e-spec.ts` | FinanceController | 10 |
| 61 | `e2e/wms.controller.e2e-spec.ts` | WmsController | 10 |
| 62 | `e2e/pos.controller.e2e-spec.ts` | PosController | 8 |
| 63 | `e2e/lms.controller.e2e-spec.ts` | LmsController | 8 |
| 64 | `e2e/mes.controller.e2e-spec.ts` | MesController | 8 |
| 65 | `e2e/kanban.controller.e2e-spec.ts` | KanbanController | 8 |
| 66 | `e2e/director.controller.e2e-spec.ts` | DirectorController | 6 |

**Har controller e2e da:**
- Happy path (200/201)
- Auth missing (401)
- Insufficient role (403)
- Validation error (400)
- Not found (404)
- Throttle limit (429)

### GURUH 5 — Guards, Pipes, Interceptors (Task 67–73)

| # | Fayl | Manba | Min test |
|:---:|---|---|:---:|
| 67 | `unit/guards/jwt-auth.guard.spec.ts` | `common/guards/jwt-auth.guard.ts` | 7 |
| 68 | `unit/guards/roles.guard.spec.ts` | `common/guards/roles.guard.ts` | 6 |
| 69 | `unit/guards/permission.guard.spec.ts` | `common/guards/permission.guard.ts` | 6 |
| 70 | `unit/guards/sod.guard.spec.ts` | `common/guards/sod.guard.ts` | 5 |
| 71 | `unit/common/global-exception.filter.spec.ts` | `common/filters/global-exception.filter.ts` | 8 |
| 72 | `unit/common/audit.interceptor.spec.ts` | `common/interceptors/audit.interceptor.ts` | 5 |
| 73 | `unit/common/result-unwrap.interceptor.spec.ts` | `common/interceptors/result-unwrap.interceptor.ts` | 6 |

### GURUH 6 — Shared Services + Common Helpers (Task 74–80)

| # | Fayl | Manba | Min test |
|:---:|---|---|:---:|
| 74 | `unit/common/result.spec.ts` | `common/result.ts` | 10 |
| 75 | `unit/common/time/tashkent-time.service.spec.ts` | `common/time/tashkent-time.service.ts` | 8 |
| 76 | `unit/common/cache.decorator.spec.ts` | `common/decorators/cache.decorator.ts` | 6 |
| 77 | `unit/common/business-constants.spec.ts` | `common/constants/business.constants.ts` | 4 |
| 78 | `unit/shared/db/typed-execute.spec.ts` | `shared/db/typed-execute.ts` | 6 |
| 79 | `unit/shared/db/invariants.spec.ts` | `shared/db/invariants.ts` | 5 |
| 80 | `unit/common/http-result.spec.ts` | `common/http-result.ts` | 8 |

### GURUH 7 — Event-Driven Triggers (Task 81–85)

ARCHITECTURE.md'da 20+ trigger ro'yxatlangan. Eng muhim 5 tasi:

| # | Fayl | Trigger | Min test |
|:---:|---|---|:---:|
| 81 | `integration/triggers/deal-won-to-so.spec.ts` | Trigger 2: DealWon → SO yaratish | 5 |
| 82 | `integration/triggers/three-checkpoint-to-pp.spec.ts` | Trigger 5: 3-checkpoint → PP signal | 5 |
| 83 | `integration/triggers/payment-to-order-closed.spec.ts` | Trigger 15: Full payment → Closed | 5 |
| 84 | `integration/triggers/advance-bypass-audit.spec.ts` | Trigger 20: Advance bypass audit | 4 |
| 85 | `integration/triggers/design-flag-event.spec.ts` | Trigger 3: design_flag → Design event | 4 |

### GURUH 8 — Frontend React Query Hooks (Task 86–90)

| # | Fayl | Hook | Min test |
|:---:|---|---|:---:|
| 86 | `src/hooks/__tests__/use-auth.test.tsx` | `useAuth` | 8 |
| 87 | `src/hooks/__tests__/use-crm.test.tsx` | `useCrm` | 7 |
| 88 | `src/hooks/__tests__/use-hr-employees.test.tsx` | `useHrEmployees` | 7 |
| 89 | `src/hooks/__tests__/use-finance.test.tsx` | `useFinance` | 6 |
| 90 | `src/hooks/__tests__/use-mes.test.tsx` | `useMes` | 6 |

### GURUH 9 — Frontend Component Tests (Task 91–95) — KO'PI YANGI

| # | Fayl | Component | Min test |
|:---:|---|---|:---:|
| 91 | `src/components/__tests__/AppSidebar.test.tsx` | AppSidebar (RBAC, collapse) | 8 |
| 92 | `src/components/__tests__/EmployeeDialog.test.tsx` | EmployeeDialog (form, validation) | 8 |
| 93 | `src/components/__tests__/AddCourseDialog.test.tsx` | AddCourseDialog | 6 |
| 94 | `src/components/__tests__/KanbanBoard.test.tsx` | Kanban dnd | 8 |
| 95 | `src/components/__tests__/PrivateRoute.test.tsx` | PrivateRoute (auth guard) | 5 |

### GURUH 10 — Playwright E2E User Flows (Task 96–100) — BARCHASI YANGI

| # | Fayl | Flow | Min test |
|:---:|---|---|:---:|
| 96 | `e2e/login-dashboard.spec.ts` | Login → Dashboard → RBAC sidebar | 5 |
| 97 | `e2e/crm-to-sd-trigger.spec.ts` | Lead → Deal → SO avtomatik trigger | 6 |
| 98 | `e2e/production-lifecycle.spec.ts` | PP → MES → QC → close | 7 |
| 99 | `e2e/hr-employee-payroll.spec.ts` | Employee CRUD + Leave + Payroll | 6 |
| 100 | `e2e/pos-sale-gl.spec.ts` | POS sale → GL posting | 5 |

---

## 2-QADAM — HAR TASKNI BAJARASIZ

Tartib:

```
1. TaskList orqali keyingi `pending` taskni oling
2. TaskUpdate(id, status='in_progress') qiling
3. Task metadata'ni o'qing — `status: mavjud|qisman|yo'q`
   
   a) status='mavjud' bo'lsa:
      - Mavjud test faylini o'qing
      - Talab qilingan min test case bormi tekshiring
      - Yo'q bo'lsa, qo'shing
      - Sifatini baholang (qoidalar bo'yicha)
      - `pnpm test:api <fayl>` — yashil bo'lsa OK
   
   b) status='qisman' bo'lsa:
      - Yo'q test'larni qo'shing
      - Pattern'ni boshqalarga moslang
      - Test yashil bo'lsin
   
   c) status='yo'q' bo'lsa:
      - Noldan yozing (shablon'lardan foydalaning)
      - Min test case bajarilishi kerak
      - JSON structure tekshiring (har `expect` real)
      - Yashil bo'lsin
4. TaskUpdate(id, status='completed') qiling
5. docs/test-progress.md ga 1 qator yozing:
   "TASK N | <fayl> | <test soni> | <coverage farqi> | <vaqt>"
6. Keyingi task'ga o'ting
```

**100 ta task tugaguncha to'xtamaysiz.** Har 10 taskdan keyin coverage o'lchang.

---

## 3-QADAM — INFRATUZILMA (TASK 1 dan oldin)

Agar mavjud emas bo'lsa:

```bash
# 1. Test DB Docker
cat > apps/api/test/docker-compose.test.yml <<'EOF'
version: '3.8'
services:
  postgres-test:
    image: postgres:15
    environment:
      POSTGRES_USER: test
      POSTGRES_PASSWORD: test
      POSTGRES_DB: europrint_test
    ports:
      - "5433:5432"
EOF

# 2. Faker + Supertest
pnpm --filter @europrint/api add -D @faker-js/faker supertest @types/supertest

# 3. Factory'lar (agar yo'q bo'lsa)
mkdir -p apps/api/test/_fixtures
cat > apps/api/test/_fixtures/factories.ts <<'EOF'
import { faker } from '@faker-js/faker';
export const userFactory = (over = {}) => ({
  id: faker.number.int(),
  username: faker.internet.userName(),
  email: faker.internet.email(),
  passwordHash: '$2b$10$mockHashOnly',
  failedAttempts: 0,
  lockedUntil: null,
  isActive: true,
  ...over,
});
// leadFactory, dealFactory, salesOrderFactory, employeeFactory, productionOrderFactory...
EOF

# 4. Helper (test DB setup)
mkdir -p apps/api/test/_helpers
cat > apps/api/test/_helpers/setup-test-db.ts <<'EOF'
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

export async function setupTestDb() {
  const client = postgres({
    host: 'localhost', port: 5433, user: 'test', password: 'test', database: 'europrint_test',
  });
  const db = drizzle(client);
  // run migrations
  return db;
}
export async function teardownTestDb(db: any) { /* drop schema */ }
EOF

# 5. MSW server (frontend)
mkdir -p artifacts/erp-dashboard/src/test
cat > artifacts/erp-dashboard/src/test/msw-server.ts <<'EOF'
import { setupServer } from 'msw/node';
export const server = setupServer();
EOF

# 6. Playwright config tekshirish
cat artifacts/erp-dashboard/playwright.config.ts || echo "playwright.config.ts yo'q — yarating"
```

---

## 4-QADAM — TEST YOZISH SHABLONLARI

(Quyidagi shablonlarga moslab har testni yozing — qoidalarga muvofiq)

### A) Aggregate test (Task 1–15)

```ts
import { Lead } from '@/modules/crm/domain/aggregates/lead.aggregate';
import { LeadStatus } from '@/modules/crm/domain/value-objects/lead-status.vo';
import { AIScore } from '@/modules/crm/domain/value-objects/ai-score.vo';

describe('Lead aggregate', () => {
  const validProps = {
    companyId: 1,
    firstName: 'Akmal',
    lastName: 'Karimov',
    email: 'akmal@uzpaper.uz',
    phone: '+998901234567',
    status: LeadStatus.create('new').data!,
    aiScore: AIScore.create(75).data!,
    createdBy: 1,
    source: 'website',
  };

  describe('create()', () => {
    it('returns a Lead with status "new" when valid props are given', () => {
      const lead = Lead.create(validProps);
      expect(lead.getStatus().getValue()).toBe('new');
    });

    it('does not emit any domain event on creation', () => {
      const lead = Lead.create(validProps);
      expect(lead.getDomainEvents()).toHaveLength(0);
    });
  });

  describe('qualify()', () => {
    it('transitions status from new to qualified', () => {
      const lead = Lead.create(validProps);
      const result = lead.qualify();
      expect(result.ok).toBe(true);
      expect(lead.getStatus().getValue()).toBe('qualified');
    });

    it('returns Err when called from converted status', () => {
      const lead = Lead.create({ ...validProps, status: LeadStatus.create('converted').data! });
      expect(lead.qualify().ok).toBe(false);
    });

    it('emits LeadQualified event on success', () => {
      const lead = Lead.create(validProps);
      lead.qualify();
      const events = lead.getDomainEvents();
      expect(events.find(e => e.eventName === 'LeadQualified')).toBeDefined();
    });
  });
});
```

### B) CQRS Handler test (Task 16–35)

```ts
import { Test } from '@nestjs/testing';
import { LoginHandler } from '@/modules/auth/application/commands/login.handler';
import { JwtService } from '@nestjs/jwt';
import { userFactory } from '@test/_fixtures/factories';

describe('LoginHandler', () => {
  let handler: LoginHandler;
  let repo: { findByUsername: jest.Mock; save: jest.Mock };
  let jwt: { sign: jest.Mock };

  beforeEach(async () => {
    repo = { findByUsername: jest.fn(), save: jest.fn() };
    jwt = { sign: jest.fn(() => 'mock.token') };
    const moduleRef = await Test.createTestingModule({
      providers: [
        LoginHandler,
        { provide: 'IAuthRepository', useValue: repo },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();
    handler = moduleRef.get(LoginHandler);
  });

  it('returns Err when user is not found', async () => {
    repo.findByUsername.mockResolvedValue({ ok: true, data: null });
    const result = await handler.execute({ username: 'x', password: 'y' });
    expect(result.ok).toBe(false);
  });

  it('locks account after 5 failed attempts', async () => {
    const user = userFactory({ failedAttempts: 4, passwordHash: '$2b$10$wrong' });
    repo.findByUsername.mockResolvedValue({ ok: true, data: user });
    await handler.execute({ username: user.username, password: 'wrong' });
    expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ lockedUntil: expect.any(Date) }));
  });
});
```

### C) Repository Integration test (Task 36–50)

```ts
import { setupTestDb, teardownTestDb } from '@test/_helpers/setup-test-db';
import { DrizzleAuthRepo } from '@/modules/auth/infrastructure/repositories/drizzle-auth.repo';
import { users } from '@workspace/db/schema';
import { userFactory } from '@test/_fixtures/factories';

describe('DrizzleAuthRepo (integration)', () => {
  let db: any;
  let repo: DrizzleAuthRepo;

  beforeAll(async () => { db = await setupTestDb(); repo = new DrizzleAuthRepo(db); });
  afterAll(async () => { await teardownTestDb(db); });
  beforeEach(async () => { await db.delete(users); });

  it('findByUsername returns Ok(null) when user does not exist', async () => {
    const result = await repo.findByUsername('nonexistent');
    expect(result.ok).toBe(true);
    expect(result.data).toBeNull();
  });

  it('save inserts new user and returns id', async () => {
    const user = userFactory();
    const result = await repo.save(user);
    expect(result.ok).toBe(true);
    expect(result.data?.id).toBeGreaterThan(0);
  });
});
```

### D) Controller E2E (Task 51–66)

```ts
import { Test } from '@nestjs/testing';
import { NestFastifyApplication, FastifyAdapter } from '@nestjs/platform-fastify';
import { AppModule } from '@/app.module';

describe('AuthController (e2e)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });
  afterAll(async () => { await app.close(); });

  it('returns 200 with accessToken when valid credentials are given', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { username: 'admin', password: 'Test1@Password' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toHaveProperty('accessToken');
  });

  it('returns 401 when password is incorrect', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { username: 'admin', password: 'WRONG' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('returns 429 after 5 failed attempts (throttle)', async () => {
    for (let i = 0; i < 5; i++) {
      await app.inject({ method: 'POST', url: '/api/auth/login', payload: { username: 'admin', password: 'x' } });
    }
    const res = await app.inject({ method: 'POST', url: '/api/auth/login', payload: { username: 'admin', password: 'x' } });
    expect(res.statusCode).toBe(429);
  });
});
```

### E) Frontend Hook (Task 86–90)

```tsx
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from '../use-auth';
import { server } from '@/test/msw-server';
import { http, HttpResponse } from 'msw';

const wrapper = ({ children }: any) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

describe('useAuth', () => {
  it('returns isAuthenticated=true after successful login mutation', async () => {
    server.use(
      http.post('/api/auth/login', () => HttpResponse.json({ accessToken: 'x', user: { id: 1, username: 'admin' } }))
    );
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => { await result.current.login('admin', 'Test1@Password'); });
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));
  });
});
```

### F) Component (Task 91–95)

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AppSidebar } from '../AppSidebar';
import { TestProviders } from '@/test/TestProviders';

describe('AppSidebar', () => {
  it('shows all modules when user role is admin', () => {
    render(<AppSidebar />, { wrapper: TestProviders({ user: { role: 'admin' } }) });
    expect(screen.getByText(/HR/i)).toBeVisible();
    expect(screen.getByText(/finansy/i)).toBeVisible();
  });

  it('hides finance module when user role is HR', () => {
    render(<AppSidebar />, { wrapper: TestProviders({ user: { role: 'hr' } }) });
    expect(screen.queryByText(/finansy/i)).not.toBeInTheDocument();
  });

  it('collapses when collapse button is clicked', () => {
    render(<AppSidebar />, { wrapper: TestProviders() });
    fireEvent.click(screen.getByLabelText(/yopish/i));
    expect(screen.getByTestId('sidebar')).toHaveClass('collapsed');
  });
});
```

### G) Playwright E2E (Task 96–100)

```ts
import { test, expect } from '@playwright/test';

test.describe('CRM Lead → Deal → SO trigger flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/username/i).fill('admin');
    await page.getByLabel(/parol/i).fill('Test1@Password');
    await page.getByRole('button', { name: /tizimga kirish/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('lead can be qualified, converted to deal, marked won, and SO is auto-created', async ({ page }) => {
    // 1. CRM ga kirish
    await page.getByRole('link', { name: /CRM/i }).click();

    // 2. Lead yaratish
    await page.getByRole('button', { name: /yangi lead/i }).click();
    await page.getByLabel(/ism/i).fill('Test Lead');
    await page.getByLabel(/email/i).fill('test@uzpaper.uz');
    await page.getByLabel(/telefon/i).fill('+998901234567');
    await page.getByRole('button', { name: /saqlash/i }).click();
    await expect(page.getByText('Test Lead')).toBeVisible();

    // 3. Qualify qilish
    await page.getByText('Test Lead').click();
    await page.getByRole('button', { name: /qualify/i }).click();
    await expect(page.getByText(/qualified/i)).toBeVisible();

    // 4. Deal'ga aylantirish
    await page.getByRole('button', { name: /deal/i }).click();
    await expect(page.getByText(/deal/i)).toBeVisible();

    // 5. Won deb belgilash
    await page.getByRole('button', { name: /won/i }).click();
    await expect(page.getByText(/won/i)).toBeVisible();

    // 6. SD modulida SO mavjudligini tekshirish
    await page.getByRole('link', { name: /sotuvlar/i }).click();
    await expect(page.getByText(/SO-\d+/i)).toBeVisible();
    await expect(page.getByText(/test@uzpaper.uz/i)).toBeVisible();
  });
});
```

---

## 5-QADAM — YAKUNIY HISOBOT

100 task tugagandan keyin **bitta hisobot** chiqaring:

```markdown
# 100 Test Task — Yakuniy Hisobot

## Umumiy raqamlar
- Boshlandi: 2026-XX-XX HH:MM
- Yakunlandi: 2026-XX-XX HH:MM
- Davomiyligi: X soat Y minut

## Status taqsimoti
| Status | Soni |
|---|---:|
| Avval mavjud edi (sifatini tasdiqladim) | ~40 |
| Qo'shimcha test case qo'shdim | ~10 |
| Noldan yozdim | ~50 |
| **JAMI** | **100** |

## Guruh bo'yicha
| Guruh | Task # | Yangi test fayl | Test case |
|---|---|---:|---:|
| 1. Domain Aggregates + VO | 1–15 | 15 | ~105 |
| 2. CQRS Handlers | 16–35 | 20 | ~135 |
| 3. Repository Integration | 36–50 | 15 | ~100 |
| 4. Controller E2E | 51–66 | 16 | ~140 |
| 5. Guards/Pipes/Interceptors | 67–73 | 7 | ~45 |
| 6. Shared/Common Helpers | 74–80 | 7 | ~50 |
| 7. Event-Driven Triggers | 81–85 | 5 | ~25 |
| 8. Frontend Hooks | 86–90 | 5 | ~35 |
| 9. Frontend Components | 91–95 | 5 | ~35 |
| 10. Playwright E2E | 96–100 | 5 | ~30 |
| **JAMI** | — | **100** | **~700** |

## Coverage farqi
| O'lcham | Avval | Keyin | Farq |
|---|:---:|:---:|:---:|
| Backend lines | ~25% | **XX%** | +X% |
| Backend branches | ~20% | **XX%** | +X% |
| Backend functions | ~30% | **XX%** | +X% |
| Frontend lines | ~5% | **XX%** | +X% |
| E2E route coverage | ~2% | **XX%** | +X% |

## CI holati
- ✅ `pnpm test:api` PASS — X testlar
- ✅ `pnpm test:erp` PASS
- ✅ `pnpm test:e2e` PASS
- ✅ ESLint PASS
- ✅ TypeCheck PASS
- ✅ Coverage threshold ko'tarildi: lines 25 → 80, branches 20 → 75

## Test yozayotganda topilgan bug'lar
1. (har bir bug GitHub issue qilingan)

## Keyingi qadamlar (50-haftalik reja)
- Stryker mutation test'larini joriy qilish
- Visual regression (Chromatic) qo'shish
- Performance budget'lar (k6)
- 80% → 90% coverage uchun 30 ta yangi test
```

---

## 6-QADAM — DUPLICATION va MERGE STRATEGIYASI

**Ehtimol:** sizdan oldin S2–S6 batch'lar ba'zi test fayllarini yaratdi. Agar topsangiz:

1. **Mavjud fayl sifatini baholang:**
   - Min test case mavjudmi?
   - `expect(true)` yoki bo'sh testlar bormi?
   - Test nomi to'g'rimi (`it('verb expected when condition')`)?
   - Pattern shablonga mosmi?

2. **Sifat past bo'lsa:**
   - Mavjud testlarni qayta yozing (ovverride)
   - Lekin mavjud test caselarni o'chirib tashlamang — kengaytirib qo'shing

3. **Sifat yaxshi bo'lsa:**
   - Ortiqcha test case qo'shing (min talab darajasiga yetkazing)
   - "completed" deb belgilab keyingisiga o'ting

---

## NIMA QILMASLIK

- ❌ Har task uchun ruxsat so'rash
- ❌ Mavjud testlarni "ko'rib chiqdim, OK" deb tashlash (sifatini auditdan o'tkazasiz)
- ❌ Yarim ish ("keyin tugataman")
- ❌ `expect(true).toBe(true)` yoki bo'sh assertion
- ❌ Business logic mock
- ❌ `any` test'da
- ❌ `console.log` test'da
- ❌ Fayl 300+ qator
- ❌ Test qizil bo'lsa "completed" qilish
- ❌ "Bu murakkab, skip qilaman" — skip yo'q

---

## NIMA QILISH KERAK

- ✅ Avval `docs/test-inventory.txt` yarating — mavjudlarni tushuning
- ✅ 100 TaskCreate bir vaqtning o'zida
- ✅ Har task: in_progress → o'qish → yozish → test → completed
- ✅ Har 10 taskdan keyin coverage o'lchang
- ✅ Topilgan bug'larni alohida issue qiling
- ✅ Pattern shablonlardan foydalaning
- ✅ docs/test-progress.md ga progressни yozing
- ✅ Yakuniy hisobot bilan tugating

---

## ENG OXIRGI ESLATMA

Loyihada ~40 ta test fayl allaqachon mavjud. Lekin **100 ga yetkazish kerak**. Sizning ishingiz:

1. **Mavjudlarini auditdan o'tkazib, sifatini ko'taring** (~40 task)
2. **Yo'qlarini noldan yozing** (~60 task — Controller e2e, Component, Playwright)
3. **Jami 100 ta yashil test fayl** + coverage 80%+

**Bo'lmasa "tugadi" demang.** 100 ga yetmaguncha to'xtamaysiz.

**Boshlang:**
1. Ruxsat oling (bir martagina)
2. `docs/test-inventory.txt` yarating — mavjudlarni hisoblang
3. 100 TaskCreate
4. 1-taskdan oxirigacha bajarib boring
5. Har 10 taskdan keyin coverage
6. 100-task tugaganda yakuniy hisobot

Boshlayman demang — **boshlang**.
