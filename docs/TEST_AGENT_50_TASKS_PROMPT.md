# EuroPrint ERP — 50 Test Task Agent Promti (Atomic Execution)

> **Bu fayl AI agent (Claude Code, Cursor) uchun yo'riqnoma.**
> Agent **50 ta atomic test taskini yaratadi va birma-bir bajaradi**.
> Promtni o'zgartirmasdan to'liqligicha agentga bering.

---

## SIZ KIMSIZ

Siz — **Test Engineer Agent**. Vazifangiz: EuroPrint ERP loyihasi uchun **50 ta atomic test task** yaratish va har birini birma-bir bajarish. Har task — bitta test fayl, aniq testlar bilan.

Loyiha:
```
Uzbek-Language-Module/
├── apps/api/                         ← NestJS backend
│   └── src/modules/                  ← 55 domain modul (DDD)
├── artifacts/erp-dashboard/          ← React frontend
└── lib/db/                            ← Drizzle schemas
```

Hozirgi test holati: **Backend 12.13%, Frontend 0.87%** — yaroqsiz.
Maqsad: 50 atomic task — **400+ test case yozish**, coverage 12% → 40% ga oshirish.

---

## ⚠️ ISH BOSHIDA — BIR MARTALIK RUXSAT

Birinchi xabaringizda foydalanuvchidan **shu fayllar uchun bir martalik ruxsat** so'rang:

```
Quyidagi fayl va papkalarga to'liq o'qish + yozish ruxsati so'rayman.
Har task uchun qaytadan ruxsat so'ramayman — 50 taskni oxirigacha bajaraman.

1. apps/api/src/**/*.ts                       (test uchun manba kod)
2. apps/api/test/**/*.ts                      (yangi test fayllari)
3. artifacts/erp-dashboard/src/**/*.{ts,tsx}  (frontend manba)
4. artifacts/erp-dashboard/e2e/**/*.spec.ts   (Playwright e2e)
5. apps/api/test/_fixtures/                    (yangi factory fayllar)
6. apps/api/test/_helpers/                     (yangi helper fayllar)
7. docs/test-progress.md                       (progress hisobot)
8. apps/api/package.json                       (faqer-js qo'shish uchun)

Ruxsat berasizmi? (HA / YO'Q)
```

**"HA" desa** — boshlaysiz va keyin hech qachon ruxsat so'ramaysiz.

---

## QATTIQ QOIDALAR

1. **Har task — alohida test fayl.** 50 task = 50 fayl. Bittadan boshqasiga sakrash yo'q.
2. **TaskCreate orqali 50 ta task yaratasiz** ish boshlanishida. Keyin birma-bir bajarib, TaskUpdate orqali "completed" qilasiz.
3. **`it.skip`, `xit`, `test.todo` TAQIQLANGAN.**
4. **`expect(true).toBe(true)` TAQIQLANGAN** — task FAIL.
5. **Business logic'ni mock qilish TAQIQLANGAN** — faqat DB / HTTP / Redis mock.
6. **Har test nomi:** `it('<verb> <expected> when <condition>')` formatda.
7. **Fayl ≤ 300 qator.** Oshsa — bo'l (`*-create.spec.ts`, `*-error.spec.ts`).
8. **Har task tugagandan keyin:** `pnpm test:api <fayl>` ishlash kerak. Yashil bo'lmasa — task tugamagan.
9. **Hadeb so'rashga TAQIQLANGAN.** 50 taskni oxirigacha bajarasiz.
10. **`console.log` test ichida TAQIQLANGAN.**

---

## 1-QADAM — 50 TASKNI YARATING

Bir martalik ruxsatdan keyin, `TaskCreate` tool orqali quyidagi 50 ta taskni **bir vaqtning o'zida** yarating:

### TASK 1-10: Domain Aggregates va Value Objects (Pure unit, mock yo'q)

```
TASK 1: Lead aggregate uchun test
- Fayl: apps/api/test/unit/crm/lead.aggregate.spec.ts
- Manba: apps/api/src/modules/crm/domain/aggregates/lead.aggregate.ts
- Test case lar:
  • create() — yangi Lead status='new' bilan yaratiladi
  • create() — domain event emit qilinmaydi (faqat business action'da)
  • qualify() — status new → qualified ga o'tadi
  • qualify() — converted statusdan qualify mumkin emas
  • qualify() — LeadQualified eventi emit qiladi
  • convertToDeal() — qualified bo'lmaganda Err qaytaradi
  • convertToDeal() — muvaffaqiyatda converted bo'ladi
  • convertToDeal() — LeadConverted event dealId bilan emit qiladi
- Minimal test: 8 ta
- Coverage maqsadi: aggregate ≥ 95%
```

```
TASK 2: Deal aggregate uchun test
- Fayl: apps/api/test/unit/crm/deal.aggregate.spec.ts
- Manba: apps/api/src/modules/crm/domain/aggregates/deal.aggregate.ts
- Test case lar:
  • create() — Deal status='qualification' bilan yaratiladi
  • markAsWon() — DealWon event emit qiladi
  • markAsLost(reason) — reason majburiyligi tekshiriladi
  • markAsLost() — bo'sh reason'da Err qaytaradi
  • updateStatus() — valid transition tekshiruvi
  • updateStatus() — invalid transitionda Err
- Minimal test: 8 ta
```

```
TASK 3: SalesOrder aggregate uchun test
- Fayl: apps/api/test/unit/sd/sales-order.aggregate.spec.ts
- Manba: apps/api/src/modules/sd/domain/aggregates/sales-order.aggregate.ts
- Test case lar:
  • create() — draft statusi bilan
  • checkAdvanceAndBlock() — 70% avans kerak, kam bo'lsa blocked=true
  • checkAdvanceAndBlock() — bypassed bo'lsa o'tadi
  • bypassAdvance() — reason majburiy
  • approveTechCheckpoint('BOM') — uchta checkpoint mavjud
  • isThreeCheckpointPassed() — uchovi tasdiq bo'lsa true
  • updateStatus() — 20+ status'lar orasidagi valid transition
- Minimal test: 12 ta
```

```
TASK 4: AuthUser aggregate uchun test
- Fayl: apps/api/test/unit/auth/auth-user.aggregate.spec.ts
- Manba: apps/api/src/modules/auth/domain/aggregates/auth-user.aggregate.ts
- Test case lar:
  • verifyPassword() — to'g'ri parol qabul qilinadi
  • verifyPassword() — noto'g'ri parol rad etiladi
  • incrementFailedAttempts() — counter +1 bo'ladi
  • lockAccount() — 30 daqiqalik lock o'rnatiladi
  • resetFailedAttempts() — 0 ga qaytaradi
  • UserLoggedIn event emit qilinishi
- Minimal test: 8 ta
```

```
TASK 5: Password Value Object uchun test
- Fayl: apps/api/test/unit/auth/password.vo.spec.ts
- Manba: apps/api/src/modules/auth/domain/value-objects/password.vo.ts
- Test case lar:
  • create('Short1!') — min 8 belgi qoidasi
  • create('alllowercase1!') — katta harf majburiy
  • create('ALLUPPER1!') — kichik harf majburiy
  • create('NoNumber!') — raqam majburiy
  • create('NoSpecial1') — maxsus belgi majburiy
  • create('Valid1@Pass') — OK qaytaradi
  • hashedValue — bcrypt orqali xeshlanadi
  • compare() — to'g'ri parol bilan true
- Minimal test: 10 ta
```

```
TASK 6: Money Value Object uchun test
- Fayl: apps/api/test/unit/shared/money.vo.spec.ts
- Manba: apps/api/src/modules/shared/domain/value-objects/money.vo.ts
- Test case lar:
  • add() — bir xil currency
  • add() — turli currencyda Err
  • subtract() — negative natija Err
  • equals() — qiymat va currency bir xil
  • toString() — format tekshiruvi
  • Decimal precision (decimal.js)
- Minimal test: 8 ta
```

```
TASK 7: AIScore Value Object uchun test
- Fayl: apps/api/test/unit/crm/ai-score.vo.spec.ts
- Test case lar: range 0-100, validation, equality
- Minimal test: 5 ta
```

```
TASK 8: LeadStatus Value Object uchun test
- Fayl: apps/api/test/unit/crm/lead-status.vo.spec.ts
- Test case lar: valid statuslar, invalid Err, equals
- Minimal test: 5 ta
```

```
TASK 9: DealStatus Value Object uchun test
- Fayl: apps/api/test/unit/crm/deal-status.vo.spec.ts
- Test case lar: status transition mantig'i
- Minimal test: 5 ta
```

```
TASK 10: SoStatus Value Object uchun test
- Fayl: apps/api/test/unit/sd/so-status.vo.spec.ts
- Test case lar: 20+ statuslar va valid transitionlar
- Minimal test: 8 ta
```

### TASK 11-20: CQRS Command/Query Handlers (Mock: repo, JWT, event emitter)

```
TASK 11: LoginHandler uchun test
- Fayl: apps/api/test/unit/auth/login.handler.spec.ts
- Manba: apps/api/src/modules/auth/application/commands/login.handler.ts
- Mocks: IAuthRepository, JwtService, EventEmitter
- Test case lar:
  • execute() — user topilmaganda Err
  • execute() — account locked bo'lsa Err
  • execute() — account inactive bo'lsa Err
  • execute() — noto'g'ri parolda Err + failedAttempts++
  • execute() — 5+ failed urinishdan keyin account lock
  • execute() — muvaffaqiyatda accessToken qaytariladi
  • execute() — lastLogin yangilanadi
  • execute() — UserLoggedIn event emit qilinadi
  • execute() — audit log yoziladi
- Minimal test: 10 ta
```

```
TASK 12: LogoutHandler uchun test
- Fayl: apps/api/test/unit/auth/logout.handler.spec.ts
- Test case lar: token blacklist, audit log
- Minimal test: 5 ta
```

```
TASK 13: ChangePasswordHandler uchun test
- Fayl: apps/api/test/unit/auth/change-password.handler.spec.ts
- Test case lar: eski parol verify, yangi parol validation, hash update
- Minimal test: 8 ta
```

```
TASK 14: CreateLeadHandler uchun test
- Fayl: apps/api/test/unit/crm/create-lead.handler.spec.ts
- Test case lar: existing email Err, AIScore generatsiya, Lead.create() chaqirilishi
- Minimal test: 7 ta
```

```
TASK 15: QualifyLeadHandler uchun test
- Fayl: apps/api/test/unit/crm/qualify-lead.handler.spec.ts
- Test case lar: lead topilmaganda Err, qualify() chaqirish, save chaqirish
- Minimal test: 6 ta
```

```
TASK 16: CreateDealHandler uchun test
- Fayl: apps/api/test/unit/crm/create-deal.handler.spec.ts
- Test case lar: lead → deal, status, amount validation
- Minimal test: 6 ta
```

```
TASK 17: MarkDealWonHandler uchun test
- Fayl: apps/api/test/unit/crm/mark-deal-won.handler.spec.ts
- Test case lar: deal Won status, DealWon event emit (Trigger 2)
- Minimal test: 6 ta
```

```
TASK 18: CreateOrderHandler uchun test
- Fayl: apps/api/test/unit/sd/create-order.handler.spec.ts
- Test case lar: SO yaratish, draft status, OrderCreated event
- Minimal test: 7 ta
```

```
TASK 19: UpdateOrderStatusHandler uchun test
- Fayl: apps/api/test/unit/sd/update-order-status.handler.spec.ts
- Test case lar: valid transition, advance check, blocked status
- Minimal test: 8 ta
```

```
TASK 20: ApproveAdvanceBypassHandler uchun test
- Fayl: apps/api/test/unit/sd/approve-advance-bypass.handler.spec.ts
- Test case lar: faqat Director rolga ruxsat, reason majburiy, audit log
- Minimal test: 7 ta
```

### TASK 21-28: Repository Integration Tests (test DB bilan)

```
TASK 21: DrizzleAuthRepo uchun integration test
- Fayl: apps/api/test/integration/auth/drizzle-auth.repo.spec.ts
- Manba: apps/api/src/modules/auth/infrastructure/repositories/drizzle-auth.repo.ts
- Setup: Docker PostgreSQL test DB, beforeAll/afterAll
- Test case lar:
  • findByUsername() — mavjud user
  • findByUsername() — yo'q user
  • save() — yangi user insert
  • save() — existing user update
  • incrementFailedAttempts() — atomic increment
  • lockAccount() — lockedUntil timestamp
- Minimal test: 8 ta
```

```
TASK 22-28: shu pattern bilan
  • drizzle-lead.repo.spec.ts
  • drizzle-deal.repo.spec.ts
  • drizzle-sales-order.repo.spec.ts
  • drizzle-sd-orders.repo.spec.ts
  • drizzle-sd-invoices.repo.spec.ts
  • drizzle-employees.repo.spec.ts
  • drizzle-kanban.repo.spec.ts
- Har biri ≥ 6 test
```

### TASK 29-36: Controller e2e (Supertest)

```
TASK 29: AuthController e2e
- Fayl: apps/api/test/e2e/auth.controller.e2e-spec.ts
- Setup: Test.createTestingModule() bilan to'liq Nest app
- Test case lar:
  • POST /auth/login — happy path → 200 + accessToken
  • POST /auth/login — noto'g'ri parol → 401
  • POST /auth/login — yo'q user → 401
  • POST /auth/login — 5 marta noto'g'ri → account locked (429 yoki maxsus xato)
  • POST /auth/logout — token bilan → 200
  • POST /auth/logout — tokensiz → 401
  • PATCH /auth/change-password — happy → 200
  • PATCH /auth/change-password — eski parol noto'g'ri → 400
  • GET /auth/me — token bilan → user
  • Throttling — 5/min cheklash
- Minimal test: 12 ta
```

```
TASK 30: CrmLeadsController e2e
- Fayl: apps/api/test/e2e/crm-leads.controller.e2e-spec.ts
- Test case lar: GET list, GET by id, POST create, validation errors, RBAC
- Minimal test: 10 ta
```

```
TASK 31-36: shu pattern bilan
  • crm-deals.controller.e2e-spec.ts
  • sd-orders.controller.e2e-spec.ts
  • hr-employees.controller.e2e-spec.ts
  • finance.controller.e2e-spec.ts
  • wms.controller.e2e-spec.ts
  • pos.controller.e2e-spec.ts
- Har biri ≥ 8 test
```

### TASK 37-41: Guard, Pipe, Interceptor

```
TASK 37: JwtAuthGuard uchun test
- Fayl: apps/api/test/unit/guards/jwt-auth.guard.spec.ts
- Test case lar:
  • @Public() route — o'tkazib yuboradi
  • Bearer yo'q — 401
  • Bearer expired — 401
  • Bearer valid — next()
  • Bearer noto'g'ri secret — 401
- Minimal test: 7 ta
```

```
TASK 38: RolesGuard uchun test
- Fayl: apps/api/test/unit/guards/roles.guard.spec.ts
- Test case lar: rol moslashuvi, multi-role, no-role bypass
- Minimal test: 6 ta
```

```
TASK 39: PermissionGuard uchun test
- Fayl: apps/api/test/unit/guards/permission.guard.spec.ts
- Test case lar: fine-grained permission, missing permission rejection
- Minimal test: 6 ta
```

```
TASK 40: SodGuard (Separation of Duties) uchun test
- Fayl: apps/api/test/unit/guards/sod.guard.spec.ts
- Test case lar: bir foydalanuvchi 2 rol conflict, SoD violation rejection
- Minimal test: 5 ta
```

```
TASK 41: GlobalExceptionFilter + ZodValidationPipe uchun test
- Fayl: apps/api/test/unit/common/global-exception.filter.spec.ts
- Test case lar:
  • Result.Err → HTTP status mapping
  • Zod parse error → 400 with details
  • Unknown error → 500
  • Custom AppError code
- Minimal test: 8 ta
```

### TASK 42-45: Frontend React Query Hooks

```
TASK 42: use-auth hook test
- Fayl: artifacts/erp-dashboard/src/hooks/__tests__/use-auth.test.tsx
- Tools: @testing-library/react, @tanstack/react-query, MSW
- Test case lar:
  • useAuth() — initial isLoading=true
  • useAuth() — login mutation success → isAuthenticated=true
  • useAuth() — login mutation error → toast
  • useAuth() — logout mutation → state reset
  • useAuth() — refetch on token refresh
- Minimal test: 8 ta
```

```
TASK 43: use-crm hook test
- Fayl: artifacts/erp-dashboard/src/hooks/__tests__/use-crm.test.tsx
- Test case lar: list, create, update, optimistic update, error
- Minimal test: 7 ta
```

```
TASK 44: use-hr-employees hook test
- Fayl: artifacts/erp-dashboard/src/hooks/__tests__/use-hr-employees.test.tsx
- Test case lar: filtering, pagination, mutation invalidation
- Minimal test: 7 ta
```

```
TASK 45: use-finance hook test
- Fayl: artifacts/erp-dashboard/src/hooks/__tests__/use-finance.test.tsx
- Test case lar: cashflow, budget, KPI query
- Minimal test: 6 ta
```

### TASK 46-48: Frontend Component Tests

```
TASK 46: EmployeeDialog component test
- Fayl: artifacts/erp-dashboard/src/components/__tests__/EmployeeDialog.test.tsx
- Test case lar:
  • valid form submission → mutation called
  • invalid form (empty name) → submit disabled
  • cancel button → onClose called
  • date picker — UZ locale format
  • server error → toast
- Minimal test: 8 ta
```

```
TASK 47: AddCourseDialog component test
- Fayl: artifacts/erp-dashboard/src/components/__tests__/AddCourseDialog.test.tsx
- Test case lar: form fields, validation, submit
- Minimal test: 6 ta
```

```
TASK 48: AppSidebar component test
- Fayl: artifacts/erp-dashboard/src/components/__tests__/AppSidebar.test.tsx
- Test case lar:
  • Admin rol — barcha modullar ko'rinadi
  • HR rol — faqat HR modullari
  • collapse/expand state
  • active route highlight
  • language switcher
- Minimal test: 8 ta
```

### TASK 49-50: E2E Playwright Flow

```
TASK 49: Login → Dashboard E2E flow
- Fayl: artifacts/erp-dashboard/e2e/login-dashboard.spec.ts
- Steps:
  1. /login ochish
  2. credentials kiritish
  3. submit
  4. dashboard yuklanishi
  5. sidebar elementlari ko'rinishi
  6. logout
  7. /login ga qaytishi
- Asserts: URL, page title, sidebar items, RBAC
- Minimal: 5 ta test
```

```
TASK 50: CRM Lead → Deal → SO Trigger E2E flow
- Fayl: artifacts/erp-dashboard/e2e/crm-to-sd-trigger.spec.ts
- Steps:
  1. CRM sahifasiga kirish
  2. Yangi Lead yaratish
  3. Lead qualify qilish
  4. Lead → Deal convert qilish
  5. Deal Won deb belgilash
  6. SD sahifasida avtomatik SO yaratilganini tekshirish (Trigger 2)
- Asserts: SO mavjud, status, mijoz ma'lumotlari to'g'ri
- Minimal: 6 ta test
```

---

## 2-QADAM — HAR TASKNI BAJARASIZ

50 task yaratganingizdan keyin, **birma-bir** quyidagi tartibda bajarasiz:

```
1. TaskList orqali keyingi `pending` taskni oling (ID tartibda)
2. TaskUpdate(id, status='in_progress') qiling
3. Manba kodni o'qing
4. Test fayl yarating, **kamida talab qilingan test caselar** yozing
5. `pnpm test:api <fayl>` ishlab yashil bo'lsin
6. TaskUpdate(id, status='completed') qiling
7. docs/test-progress.md ga 1 qator yozing (fayl + test soni + vaqt)
8. Keyingi task'ga o'ting
```

**Hech qachon to'xtamaysiz**, hech qachon "shu yetarli" demaysiz. 50 ta tugaguncha.

---

## 3-QADAM — INFRATUZILMA (TASK 1 dan oldin)

Birinchi taskni boshlashdan oldin **infratuzilmani tayyorlang**:

```bash
# 1. Test DB uchun Docker compose
# apps/api/test/docker-compose.test.yml yarating:

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

# 2. Factory'lar
# apps/api/test/_fixtures/factories.ts yarating
# @faker-js/faker bilan: userFactory, leadFactory, dealFactory, salesOrderFactory

# 3. Test helper'lar
# apps/api/test/_helpers/setup-test-db.ts
# beforeAll: drizzle migrate, afterAll: drop schema

# 4. paket qo'shish
pnpm --filter @europrint/api add -D @faker-js/faker supertest @types/supertest
```

---

## 4-QADAM — TEST YOZISH SHABLONLARI

### Aggregate test shabloni (TASK 1-10)

```ts
// apps/api/test/unit/crm/lead.aggregate.spec.ts
import { Lead } from '@/modules/crm/domain/aggregates/lead.aggregate';
import { LeadStatus } from '@/modules/crm/domain/value-objects/lead-status.vo';
import { AIScore } from '@/modules/crm/domain/value-objects/ai-score.vo';

describe('Lead aggregate', () => {
  const validProps = {
    companyId: 1,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@test.com',
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
      const result = lead.qualify();
      expect(result.ok).toBe(false);
    });

    it('emits LeadQualified event on success', () => {
      const lead = Lead.create(validProps);
      lead.qualify();
      const events = lead.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]?.eventName).toBe('LeadQualified');
    });
  });

  // ... convertToDeal() testlari shu pattern bilan
});
```

### Handler test shabloni (TASK 11-20)

```ts
// apps/api/test/unit/auth/login.handler.spec.ts
import { Test } from '@nestjs/testing';
import { LoginHandler } from '@/modules/auth/application/commands/login.handler';
import { JwtService } from '@nestjs/jwt';

describe('LoginHandler', () => {
  let handler: LoginHandler;
  let repo: { findByUsername: jest.Mock; save: jest.Mock };
  let jwt: { sign: jest.Mock };

  beforeEach(async () => {
    repo = { findByUsername: jest.fn(), save: jest.fn() };
    jwt = { sign: jest.fn(() => 'mock.token.value') };
    const module = await Test.createTestingModule({
      providers: [
        LoginHandler,
        { provide: 'IAuthRepository', useValue: repo },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();
    handler = module.get(LoginHandler);
  });

  it('returns Err when user is not found', async () => {
    repo.findByUsername.mockResolvedValue({ ok: true, data: null });
    const result = await handler.execute({ username: 'x', password: 'y' });
    expect(result.ok).toBe(false);
  });

  it('returns Err when account is locked', async () => {
    repo.findByUsername.mockResolvedValue({
      ok: true,
      data: { lockedUntil: new Date(Date.now() + 60_000) },
    });
    const result = await handler.execute({ username: 'x', password: 'y' });
    expect(result.ok).toBe(false);
  });

  // ... boshqalar
});
```

### Integration repo shabloni (TASK 21-28)

```ts
// apps/api/test/integration/auth/drizzle-auth.repo.spec.ts
import { setupTestDb, teardownTestDb } from '@/test/_helpers/setup-test-db';
import { DrizzleAuthRepo } from '@/modules/auth/infrastructure/repositories/drizzle-auth.repo';
import { users } from '@workspace/db/schema';

describe('DrizzleAuthRepo (integration)', () => {
  let db: any;
  let repo: DrizzleAuthRepo;

  beforeAll(async () => {
    db = await setupTestDb();
    repo = new DrizzleAuthRepo(db);
  });

  afterAll(async () => {
    await teardownTestDb(db);
  });

  beforeEach(async () => {
    await db.delete(users);
  });

  it('findByUsername returns Ok(null) when not found', async () => {
    const result = await repo.findByUsername('nonexistent');
    expect(result.ok).toBe(true);
    expect(result.data).toBeNull();
  });

  // ... boshqalar
});
```

### Controller e2e shabloni (TASK 29-36)

```ts
// apps/api/test/e2e/auth.controller.e2e-spec.ts
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

  afterAll(async () => {
    await app.close();
  });

  it('POST /auth/login returns 200 with accessToken on valid credentials', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { username: 'admin', password: 'Test1@Password' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toHaveProperty('accessToken');
  });

  // ... boshqalar
});
```

### Frontend hook shabloni (TASK 42-45)

```tsx
// artifacts/erp-dashboard/src/hooks/__tests__/use-auth.test.tsx
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from '../use-auth';
import { server } from '@/test/msw-server';
import { http, HttpResponse } from 'msw';

const wrapper = ({ children }: any) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

describe('useAuth', () => {
  it('returns isAuthenticated=true after successful login', async () => {
    server.use(
      http.post('/api/auth/login', () => HttpResponse.json({ accessToken: 'x', user: { id: 1 } }))
    );
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.login).toBeDefined());
    // ... mutation chaqirish va isAuthenticated tekshirish
  });
});
```

### Component test shabloni (TASK 46-48)

```tsx
// artifacts/erp-dashboard/src/components/__tests__/EmployeeDialog.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EmployeeDialog } from '../EmployeeDialog';
import { TestProviders } from '@/test/TestProviders';

describe('EmployeeDialog', () => {
  it('calls onSubmit with form data when valid', async () => {
    const onSubmit = jest.fn();
    render(<EmployeeDialog open onClose={() => {}} onSubmit={onSubmit} />, { wrapper: TestProviders });
    fireEvent.change(screen.getByLabelText(/ism/i), { target: { value: 'Akmal' } });
    fireEvent.click(screen.getByRole('button', { name: /saqlash/i }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
  });

  it('disables submit button when name is empty', () => {
    render(<EmployeeDialog open onClose={() => {}} onSubmit={() => {}} />, { wrapper: TestProviders });
    expect(screen.getByRole('button', { name: /saqlash/i })).toBeDisabled();
  });
});
```

### Playwright E2E shabloni (TASK 49-50)

```ts
// artifacts/erp-dashboard/e2e/login-dashboard.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Login to Dashboard flow', () => {
  test('admin can login and see all sidebar items', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/username/i).fill('admin');
    await page.getByLabel(/parol/i).fill('Test1@Password');
    await page.getByRole('button', { name: /tizimga kirish/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText(/boshqaruv paneli/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /hr/i })).toBeVisible();
  });
});
```

---

## 5-QADAM — YAKUNIY HISOBOT

50 task tugagandan keyin, **bitta yakuniy hisobot** chiqaring:

```markdown
# Test Yozish — Yakuniy Hisobot

## Umumiy raqamlar
- Boshlandi: 2026-XX-XX
- Yakunlandi: 2026-XX-XX
- Davomiyligi: X soat

## Yaratilgan fayllar (50 ta)
- ✅ Task 1-10: 10 aggregate/VO test (75 test case)
- ✅ Task 11-20: 10 handler test (70 test case)
- ✅ Task 21-28: 8 repo integration test (50 test case)
- ✅ Task 29-36: 8 controller e2e (75 test case)
- ✅ Task 37-41: 5 guard/pipe test (32 test case)
- ✅ Task 42-45: 4 frontend hook test (28 test case)
- ✅ Task 46-48: 3 component test (22 test case)
- ✅ Task 49-50: 2 Playwright e2e (11 test case)
- **JAMI: ~363 test case**

## Coverage farqi
- Backend lines: 12.13% → XX%
- Backend branches: ? → XX%
- Frontend lines: 0.87% → XX%
- E2E route coverage: 2.3% → XX%

## CI holati
- pnpm test:api — ✅ PASS (X testlar)
- pnpm test:erp — ✅ PASS
- pnpm test:e2e — ✅ PASS
- ESLint — ✅ PASS
- TypeCheck — ✅ PASS

## Topilgan bug'lar (test yozayotganda)
1. ... (har biri yangi GitHub issue sifatida)

## Keyingi qadamlar
- Coverage 80%+ ga qancha qoldi
- Qaysi modullar test'siz qoldi
- Qaysi paternlar bo'yicha keyingi taskel
```

---

## 6-QADAM — NIMA QILMASLIK

- ❌ Har task uchun alohida ruxsat so'rash
- ❌ Yarim test yozib qoldirish ("keyin tugataman")
- ❌ `expect(true).toBe(true)` yoki o'xshash bo'sh assertion
- ❌ Business logic'ni mock qilish (faqat I/O mock)
- ❌ `any` ishlatish (TypeScript strict)
- ❌ `console.log` test ichida
- ❌ Test nomini `it('test1')` qilib qo'yish
- ❌ Fayl 300 qatordan oshishi
- ❌ Test yashil bo'lmasdan completed qilish
- ❌ "AI agent uchun qiyin" deb skip qilish

---

## 7-QADAM — NIMA QILISH KERAK

- ✅ Birinchi 50 ta TaskCreate'ni bir vaqtda yarating
- ✅ Har taskni TaskUpdate orqali 'in_progress' → 'completed' qilib boring
- ✅ Har test fayldan keyin `pnpm test` ishlatib yashil bo'lishini tekshiring
- ✅ docs/test-progress.md ga progress yozing
- ✅ Topilgan har bug'ni alohida issue qiling
- ✅ Coverage farqini har 10 taskdan keyin o'lchang
- ✅ Yakuniy hisobot bilan ish tugating

---

## ENG OXIRGI ESLATMA

Siz **mahsulot menejer emas, dizayner emas** — siz **test injenersiz**.
Vazifa aniq: 50 ta test fayl yarating. Har birida talab qilingan minimal test caselar yozilsin. Hammasi yashil bo'lsin. CI o'tsin.

**Boshlang:**
1. Ruxsat oling (bir martagina)
2. 3-qadam — infratuzilma tayyorlang
3. TaskCreate orqali 50 taskni yarating
4. 1-taskdan boshlab, birma-bir bajarib boring
5. 50-task tugaganda yakuniy hisobot bering

**Bo'lmasa qaytib kelmang. 50 ta task bajarilmaguncha "tugadi" demang.**
