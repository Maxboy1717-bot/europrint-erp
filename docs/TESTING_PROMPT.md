# EuroPrint ERP — Test Bilan To'liq Qoplash Promti (HARD MODE)

> **Hujjat turi:** Strict execution prompt for AI/developer agent
> **Maqsad:** EuroPrint ERP loyihasini **80%+ test qoplami** bilan qoplash. Yengillik yo'q, hisobot yo'q, faqat ishlovchi testlar.
> **Sana:** 2026-05-15
> **Mas'ul:** Bajaruvchi (siz — agent yoki dasturchi)

---

## ⚠️ MAJBURIY QOIDALAR (BUZGAN BO'LSA — TASK FAIL)

1. **TEST YOZMASDAN HECH NARSA OQILMAYDI.** "Ko'rib chiqdim, hammasi to'g'ri" javobi taqiqlangan. Faqat **`.spec.ts` / `.test.ts` fayl yaratish** orqali ishni isbotlaysiz.
2. **`it.skip`, `xit`, `test.todo`, `describe.skip` taqiqlangan.** Test yozildimi — ishlashi shart.
3. **Mock — minimal.** Faqat tashqi I/O (DB, HTTP, Redis, Telegram) mock qilinadi. **Business logic'ni HECH QACHON mock qilmaysiz.**
4. **`expect(true).toBe(true)` taqiqlangan.** Bunday test PR'da topilsa — task FAIL.
5. **`any` taqiqlangan testlarda ham.** Test fayllar `tsc --noEmit` orqali toza o'tishi shart.
6. **Har bir test fayl ≤ 300 qator** (Rule 16). Katta bo'lsa, `*-create.spec.ts`, `*-update.spec.ts` ga bo'linadi.
7. **Har bir testning nomi imperative + behavior:** `it('returns Err when user is locked')` — OK. `it('test1')` — FAIL.
8. **Coverage threshold pastlatilmaydi.** Vitest config'da `lines: 25` ni topganingiz uchun **80** ga ko'tarishingiz shart.
9. **`console.log` test ichida ham taqiqlangan** (Rule 14).
10. **Har bir PR'da CI yashil bo'lishi shart.** Lokal'da o'tdimi — yetarli emas. CI'da ishlashi shart.

---

## 1. Hozirgi holat (raqamlarda)

### 1.1 Backend (apps/api/)

| Ko'rsatkich | Qiymat |
|---|---:|
| Production `.ts` fayllar | **2 150** |
| Test `.spec.ts` fayllar | **261** |
| Test/prod nisbati | **12.13%** |
| Coverage threshold (Jest config) | **Belgilanmagan** (= 0% talab) |
| Test turlari taqsimoti | DTO: 26 · Service: 15 · Handler: 2 · Guard: 1 · Boshqa: 217 |

### 1.2 Frontend (artifacts/erp-dashboard/)

| Ko'rsatkich | Qiymat |
|---|---:|
| Production `.ts` / `.tsx` fayllar | **1 946** |
| Unit test fayllar | **6** (`i18n/__tests__/*` + `__tests__/business-logic.test.ts`) |
| Playwright E2E fayllar | **11** |
| Test/prod nisbati | **0.87%** ❗ |
| Vitest coverage threshold (hozirgi) | **lines 25, functions 25, branches 20, statements 25** |

### 1.3 E2E (Playwright)

| Ko'rsatkich | Qiymat |
|---|---:|
| Jami unique routes | **~480** |
| E2E spec fayllar | **11** |
| Route coverage | **~2.3%** ❗❗ |

### 1.4 Xulosa

> **Hozirgi umumiy test yetuklik darajasi: ~15%.**
> Backend 12%, frontend ~1%, E2E ~2%. Bu — **prod'ga chiqarish uchun yaroqsiz**.
> Maqsad: **80%+ qoplash 12 hafta ichida.**

---

## 2. Maqsad raqamlari (qattiq, pastlatilmaydi)

| Komponent | Hozir | 12-haftalik maqsad | Min. coverage |
|---|:---:|:---:|:---:|
| Backend service tests | 15 fayl | **300+ fayl** | **lines ≥ 80%, branches ≥ 75%** |
| Backend handler/command tests (CQRS) | 2 | **159+** (har handler) | **lines ≥ 90%** |
| Backend repository tests (with test DB) | 0 | **111+** (har Drizzle repo) | **lines ≥ 70%** |
| Backend guard / interceptor tests | 1 | **15+** | **lines ≥ 95%** |
| Backend e2e (Supertest) | 0 | **80+ endpoint suite** | har controller ≥ 1 happy + 1 error |
| Frontend hook tests | 0 | **~50** (har `use-*.ts`) | **lines ≥ 80%** |
| Frontend component tests | ~6 | **~200** (page hangmamatlari + dialog'lar) | **lines ≥ 70%** |
| Frontend page smoke tests | 0 | **~890** (har bir sahifa render bo'lsin) | render fail = test fail |
| Playwright E2E user flow | 11 | **40+** (asosiy 40 ta user-journey) | har module ≥ 2 flow |
| Visual regression (Storybook + Chromatic) | yo'q | har componentda ≥ 1 story | diff < 0.1% |

---

## 3. Test piramidasi (qancha — qaysi qatlamga)

```
                ┌──────────────────────┐
                │   Manual / Exploratory │  ~5%
                ├──────────────────────┤
                │   E2E (Playwright)    │  ~10%  → 40+ flow
                ├──────────────────────┤
                │   Integration tests   │  ~25%  → 80+ Supertest, repository
                ├──────────────────────┤
                │   Unit tests          │  ~60%  → 700+ unit (service, handler, hook, util)
                └──────────────────────┘
```

Ulush: **60% unit + 25% integration + 10% E2E + 5% manual**.

---

## 4. Backend test rejasi (apps/api/)

### 4.1 Test turi 1 — Domain Aggregate testlari (39 ta aggregate)

**MAJBURIY:** har bir aggregate uchun **alohida `.aggregate.spec.ts`** fayl. Sof unit test — DB yo'q, mock yo'q.

Misol — `lead.aggregate.spec.ts`:
```ts
describe('Lead aggregate', () => {
  describe('create()', () => {
    it('creates a Lead with status="new"', () => { /* ... */ });
    it('emits no domain event on creation', () => { /* ... */ });
  });
  describe('qualify()', () => {
    it('transitions status new -> qualified', () => { /* ... */ });
    it('returns Err if status is converted', () => { /* ... */ });
    it('emits LeadQualified event', () => { /* ... */ });
  });
  describe('convertToDeal()', () => {
    it('returns Err if not qualified', () => { /* ... */ });
    it('transitions to converted on success', () => { /* ... */ });
    it('emits LeadConverted event with dealId', () => { /* ... */ });
  });
});
```

**Qoplam:** har metod ≥ 3 ta test (happy + 2 error path). Jami: **39 × ~10 = ~390 test case.**

### 4.2 Test turi 2 — Value Object testlari

`Password.vo.ts`, `Money.vo.ts`, `AIScore.vo.ts`, `LeadStatus.vo.ts`, `DealStatus.vo.ts`, ...
Har VO uchun **`.vo.spec.ts`**:
- valid input → Ok
- har validatsiya qoidasi alohida test (≥ 8 hol — min uzunlik, max, harf turlari, special char)
- equality (`equals()`)
- value getter

**Maqsad:** har VO ≥ 95% coverage.

### 4.3 Test turi 3 — CQRS Command/Query Handler testlari (159 ta handler)

Har handler uchun **`.handler.spec.ts`** — `@nestjs/testing` modul ishlatib.

Mock'lar: faqat repository (`I*Repository`) va event emitter. Aggregate'lar ham haqiqiy.

Misol — `login.handler.spec.ts`:
```ts
describe('LoginHandler', () => {
  let handler: LoginHandler;
  let repo: MockType<IAuthRepository>;
  let jwt: MockType<JwtService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [LoginHandler, mockProvider('IAuthRepository'), mockProvider(JwtService)],
    }).compile();
    handler = module.get(LoginHandler);
    repo = module.get('IAuthRepository');
    jwt = module.get(JwtService);
  });

  it('returns Err when user not found', async () => { /* ... */ });
  it('returns Err when account is locked', async () => { /* ... */ });
  it('returns Err and increments failedAttempts on wrong password', async () => { /* ... */ });
  it('locks account after 5 failed attempts', async () => { /* ... */ });
  it('returns accessToken on success', async () => { /* ... */ });
  it('resets failedAttempts on successful login', async () => { /* ... */ });
  it('emits UserLoggedIn event on success', async () => { /* ... */ });
});
```

**Maqsad:** har handler ≥ 5 ta test, jami: **159 × ~6 = ~950 test**.

### 4.4 Test turi 4 — Repository integration testlari (111 ta repo)

**Tirik test database** ishlatiladi (Docker postgres). Mock yo'q.
- `beforeAll`: `pnpm db:migrate` test schema'ga
- `beforeEach`: truncate
- `afterAll`: drop schema

Misol — `drizzle-lead.repo.spec.ts`:
```ts
describe('DrizzleLeadRepository (integration)', () => {
  let repo: DrizzleLeadRepository;
  let db: PostgresJsDatabase;
  beforeAll(async () => { db = await setupTestDb(); repo = new DrizzleLeadRepository(db); });
  afterAll(async () => { await teardownTestDb(db); });
  beforeEach(async () => { await db.delete(crmLeads); });

  it('findByEmail returns Ok(null) when not found', async () => { /* ... */ });
  it('findByEmail returns Ok(Lead) when exists', async () => { /* ... */ });
  it('save inserts new lead and returns id', async () => { /* ... */ });
  it('save throws unique constraint error returns Err', async () => { /* ... */ });
  // ...
});
```

**Maqsad:** har CRUD operatsiya ≥ 4 ta test (happy / not found / conflict / DB error). Jami: **111 × ~5 = ~555 test**.

### 4.5 Test turi 5 — Controller (Supertest) testlari

`@nestjs/testing` + `supertest` orqali full stack (Guard → Controller → Service → in-memory DB).

Har controller uchun **`.controller.e2e-spec.ts`** — controller'da `n` ta route bo'lsa, **`n × 4`** test (happy / auth missing / forbidden / validation error).

**Maqsad:** 324 controller × ~4 = **~1 300 e2e test case** (kichik fayllarda — 80+ suite).

### 4.6 Test turi 6 — Guard, Interceptor, Pipe testlari

- `JwtAuthGuard` — public route'da yo'naltirmaydi, bearer yo'q → 401, valid bearer → next, expired → 401.
- `RolesGuard` — har rol kombinatsiyasi.
- `SodGuard` — Separation of Duties.
- `PermissionGuard` — fine-grained permission.
- `AuditInterceptor` — har request audit log yozadi.
- `ResultUnwrapInterceptor` — Ok → response, Err → HttpException mapping.
- `ZodValidationPipe` — global behavior.

**Maqsad:** ≥ **15 ta cross-cutting test fayl**, har bir uchun ≥ 95% coverage.

### 4.7 Test turi 7 — Event-Driven (modullararo) testlari

20+ trigger har biri uchun E2E test:
- Trigger 2: Deal Won → SO yaratiladi. (CRM moduli `mark-deal-won` → SD `deal-won.listener` → SO yangi yaratildi)
- Trigger 5: 3-checkpoint → PP signal
- Trigger 15: Full payment → Order Closed

**Maqsad:** ≥ **20 ta integration test** (har trigger uchun bittadan).

### 4.8 Backend test jami hisobi

| Tur | Soni | Vaqt |
|---|---:|---:|
| Aggregate (.aggregate.spec.ts) | ~390 test (39 fayl) | 5 kun |
| Value Object (.vo.spec.ts) | ~120 test (15 fayl) | 1.5 kun |
| Handler (.handler.spec.ts) | ~950 test (159 fayl) | 12 kun |
| Repository integration | ~555 test (111 fayl) | 10 kun |
| Controller e2e (Supertest) | ~1 300 test (80+ fayl) | 12 kun |
| Guard / Interceptor / Pipe | ~50 test (15 fayl) | 2 kun |
| Trigger / Event integration | ~25 test (20 fayl) | 3 kun |
| **Backend jami** | **~3 390 test** | **~45.5 kun** |

---

## 5. Frontend test rejasi (artifacts/erp-dashboard/)

### 5.1 Test turi 1 — Utility / Lib testlari

`src/lib/` ichidagi har bir helper, formatter, parser, calc uchun **`.test.ts`**.

Misol fayllar (audit asosida):
- `lib/queryClient.ts` → retry, error handling
- `lib/apiRequest.ts` → header injection, Result unwrap
- `lib/roleRoutes.ts` → role → default route
- `lib/formatters/` har biri (money, date, percentage, phone)
- `lib/validators/` har Zod schema (UZ phone, INN, MFO)

**Maqsad:** ≥ **40 ta `.test.ts`** util uchun.

### 5.2 Test turi 2 — React Hook testlari

`src/hooks/` ichida 30+ hook bor (`use-crm`, `use-hr-employees`, `use-finance`, ...). Har biri uchun:
- Query muvaffaqiyatli → data qaytaradi
- Query xato → error state
- Mutation onSuccess → query invalidatsiya
- Mutation onError → toast
- Optimistic update qaytarish

Vositalar: `@testing-library/react`, `@tanstack/react-query`, MSW (Mock Service Worker).

**Maqsad:** ≥ **50 ta hook test fayl**, har biri ≥ 4 test case.

### 5.3 Test turi 3 — Component testlari

**Komponentlar uchun ustuvor ro'yxat:**

1. **Form komponentlari** — har birida valid submit, invalid blokirovka, server error to'lqini.
   `EmployeeDialog`, `AddCourseDialog`, `AddDisciplineDialog`, …
2. **Dialog / Modal** — open/close, Escape, click-outside, mutation.
3. **Table komponentlari** — pagination, sort, filter, empty state, error state.
4. **Chart komponentlari** — data yo'q → empty, ko'p data → tooltip, recharts render.
5. **Sidebar / Navigation** — RBAC bo'yicha menyu element ko'rinishi.

**Maqsad:** ≥ **200 ta `.test.tsx`** — komponent darajasida.

### 5.4 Test turi 4 — Page Smoke testlari (891 sahifa!)

Avtomatik generator yoziladi:
```ts
// page-smoke.spec.tsx
describe('Page smoke: <name>', () => {
  it('renders without throwing', () => {
    const { container } = render(<Page />, { wrapper: TestProviders });
    expect(container.firstChild).not.toBeNull();
  });
});
```

Generator — har sahifa fayli uchun bo'sh prop bilan render, error boundary qaytarmasin.

**Maqsad:** **891 ta** smoke test (1 sahifa = 1 test). Bu **rendering regression** dan himoya qiladi.

### 5.5 Test turi 5 — Playwright E2E (har modul uchun)

Hozir 11 ta E2E bor. Maqsad: **40 ta**.

Modul bo'yicha minimal flow ro'yxati (har biriga 1 ta spec):

| Modul | E2E flow |
|---|---|
| Auth | login, logout, change password, OTP verify, expired token redirect |
| HR | employee CRUD, attendance kirish, payroll generation, recruitment flow |
| CRM | lead create → qualify → deal → won → SO trigger |
| SD | SO create, advance check, status transitions, invoice generation |
| Production | production order create, MES start session, OEE display |
| WMS | inventory receive, transfer, ABC analysis filter |
| POS | kirim, chiqim, 3-way match, GL posting |
| Finance | invoice → payment → GL, cashflow report, budget |
| Director | dashboard load, AI summary, alerts panel |
| LMS | course assign, lesson play, test attempt, certificate |
| Camera | live feed, attendance event, safety violation alert |
| Chat | message send, room create, real-time receive |
| Telegram bots | (e2e bot connector test) |

**Maqsad:** **40 ta flow** × har bir ~5 step = **~200 step**.

### 5.6 Frontend test jami hisobi

| Tur | Soni | Vaqt |
|---|---:|---:|
| Util / lib | 40 fayl | 3 kun |
| React Query hooks | 50 fayl | 6 kun |
| Component (form/dialog/table) | 200 fayl | 15 kun |
| Page smoke | 891 fayl (avtogenerator + manual fix) | 5 kun |
| Playwright E2E | 40 spec | 10 kun |
| **Frontend jami** | **~1 220 test fayl** | **~39 kun** |

---

## 6. Cross-cutting va boshqa test turlari

### 6.1 Architecture rules contract test (mavjud — kengaytirilsin)

Hozir `apps/api/test/architecture/rules.spec.ts` 22 qoidani tekshiradi. Bu **saqlanadi va kuchaytiriladi**:
- Har FAIL qoida (Rule 4 — 48 violations, Rule 9 — 19, Rule 16 — 48, Rule 17 — 85) **integration test bilan o'lchanadi**.
- Yangi qoida buzilsa, CI fail bo'lishi shart.

### 6.2 Performance / Load test

`apps/api/test/perf/` mavjud. Kengaytirish:
- `k6` yoki `autocannon` bilan asosiy endpointlar
- 100 RPS / 10 sek davomida latency p95 < 200ms
- Login throttle (5/min) ishlashi tasdiqlash
- AI throttle (20/min) ishlashi tasdiqlash

**Maqsad:** ≥ **10 ta perf scenario**.

### 6.3 Security test

`apps/api/test/security/security-suite.spec.ts` mavjud. Kengaytirish:
- SQL injection probe (Rule 4 ga bog'liq — 48 violation)
- XSS via reflected text
- CSRF — Fastify Helmet test
- JWT forgery — wrong secret
- Refresh token reuse detection
- RBAC bypass attempt — har controller'da har rol

**Maqsad:** ≥ **30 ta security test case**.

### 6.4 Mutation testing (Stryker)

Coverage 80%+ bo'lganidan keyin **Stryker** bilan mutation test:
- Real mutation score ≥ **60%**
- Survived mutant lar uchun yangi test yozish

### 6.5 Snapshot test (faqat tanlangan)

- DTO Zod schema'lar — schema o'zgarsa snapshot fail
- PDF eksport sarlavhalari — layout regression
- i18n JSON tuzilishi — diff alert

---

## 7. Test infratuzilmasi (DevOps qismi)

### 7.1 CI pipeline (GitHub Actions)

`.github/workflows/code-quality.yml` ni quyidagicha kengaytiring:

```yaml
jobs:
  test-backend:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
      redis:
        image: redis:7
    steps:
      - uses: actions/checkout@v4
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter @workspace/db build
      - run: pnpm --filter @workspace/db push-force
      - run: pnpm --filter @europrint/api test --coverage
      - uses: codecov/codecov-action@v3
        with:
          fail_ci_if_error: true
          flags: backend
          token: ${{ secrets.CODECOV_TOKEN }}

  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter erp-dashboard test --coverage
      - run: pnpm --filter erp-dashboard test:e2e

  test-architecture:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: bash scripts/run-all-reviewers.sh   # 22 qoida
      - run: pnpm --filter @europrint/api test test/architecture
```

**Branch protection:** `main` ga merge faqat:
- `test-backend` PASS
- `test-frontend` PASS
- `test-architecture` PASS
- Coverage ≥ 80% (Codecov diff)

### 7.2 Lokal `pnpm test` ish jarayoni

```bash
# Backend hammasi
pnpm test:api

# Frontend hammasi  
pnpm test:erp

# Faqat o'zgartirilgan fayl bilan bog'liq testlar (lokal speedup)
pnpm test:related

# Coverage olish va HTML ko'rish
pnpm test:coverage:open
```

### 7.3 Test ma'lumotlar (fixtures)

`apps/api/test/_fixtures/` ichida har domain uchun factory:
- `userFactory(overrides?)` → `User`
- `leadFactory(overrides?)` → `Lead`
- `dealFactory(overrides?)` → `Deal`
- `salesOrderFactory(overrides?)` → `SalesOrder`

Vosita: `@faker-js/faker` (yangi qo'shilishi kerak).

**Maqsad:** ≥ 30 factory funksiyasi.

### 7.4 Test DB strategiya

- **Variant A (tavsiya):** Docker postgres + pgschema (`pnpm db:migrate` har test run-ida)
- Variant B: pglite (in-memory)
- Variant C: SQLite emulation — TAQIQLANGAN (PostgreSQL semantikasi farq qiladi)

### 7.5 Test bug zonalari (priority)

Audit asosida quyidagilar ustuvor (FAIL endpoints ko'p):
1. WMS — `/api/warehouse/orders-by-date/:date` 500 (BU TEST BILAN QO'LGA OLINMAGAN!)
2. Barcode Warehouse — `/api/barcode-warehouse/dashboard` 500
3. CRM analytics aggregations — 500 risk
4. HR dashboard-stats — 500 risk
5. Finance reports — 500 risk

**Qoida:** har 500'ga olib keluvchi endpoint **shu hafta** ichida regression test bilan qoplanadi.

---

## 8. Sprintlar bo'yicha jadval (12 hafta = 6 sprint, 2 odam)

| Sprint | Maqsad | Yetkazib beriladigan |
|:---:|---|---|
| **S1** (1–2 hafta) | Infratuzilma + Architecture test | Docker postgres, factories, CI yangilanishi, 22 rule test kuchaytirilgan |
| **S2** (3–4 hafta) | Backend Aggregate + VO testlari | 39 aggregate + 15 VO spec, ~500 test |
| **S3** (5–6 hafta) | Backend Handler testlari (CQRS) | 159 handler spec, ~950 test |
| **S4** (7–8 hafta) | Backend Repository + Controller e2e | 111 repo + 80 supertest, ~1 850 test |
| **S5** (9–10 hafta) | Frontend Hooks + Components | 50 hook + 200 component, ~1 000 test |
| **S6** (11–12 hafta) | Page smoke + Playwright E2E + Security + Perf | 891 smoke + 40 E2E + 30 security + 10 perf |

**Jami:** **~4 700+ test fayl yozish kerak**, **~85 ish-kun**, **80%+ coverage**.

---

## 9. Promt (bajaruvchi AI / dasturchiga yo'naltirilgan qattiq buyruq)

> Quyidagi promtni AI agent yoki yangi dasturchiga bering. **O'zgartirmasdan**. Bu — strict execution promt.

---

```
SEN — TestEngineer agent san. Maqsading: EuroPrint ERP loyihasini 80%+ test qoplami bilan qoplash.

QATTIQ QOIDALAR (BUZSANG — VAZIFA FAIL):
1. Hech narsani so'rab o'tirmaysan. Plan tayyor — TESTING_PROMPT.md da. Bajar.
2. Har bir hafta yakunida git'da push qilingan, CI yashil bo'lgan ish 
   isbotini ko'rsatish kerak. "Yozdim, ishlashini tekshirmadim" — FAIL.
3. it.skip / xit / test.todo TAQIQLANGAN. Yozdingmi — ishlashi shart.
4. `expect(true).toBe(true)` topilsa — barcha o'sha hafta ishi rad qilinadi.
5. Mock — faqat tashqi I/O (DB, HTTP, Redis). Business logic'ni HECH QACHON mock qilmaysan.
6. Test fayllar TypeScript strict + ESLint o'tishi shart. `any` taqiqlangan.
7. Har bir test nomi: `it('<verb> <expected> when <condition>')`. Boshqa shaklda — FAIL.
8. Test fayl ≤ 300 qator. Oshsa — bo'l. `*-create.spec.ts`, `*-error-cases.spec.ts`.
9. Coverage faqat o'sadi. Pasaytirish uchun PR olinmaydi. Har PR'da diff ≥ 0%.
10. `console.log` taqiqlangan. Debug uchun Jest verbose ishlat.

ISH TARTIBI (har sprint):
1. TESTING_PROMPT.md dan keyingi sprint topshirig'ini o'qi
2. Hozirgi coverage o'lcha: `pnpm test:coverage` — sonni yoz
3. Birma-bir fayllarni yoz. Har 5 fayldan keyin commit + push
4. Sprint oxirida coverage farqini hisobotda yoz (eski % → yangi %)
5. CI yashil — keyin keyingi sprint

QAY QO'L BILAN BOSHLASH:
- S1: `apps/api/test/_fixtures/factories.ts` yarat, faker bilan 30 factory
- S1: Docker compose postgres test DB qo'sh
- S1: GitHub Actions workflow yangilanishi
- S1: 22-rules architecture test'ni kuchaytirib, FAIL bo'lgan 4 qoidaga 
       integration test qo'sh

NIMANI TEST QILMAYSAN (deny list):
- `node_modules`, `dist`, `coverage`, `.git`
- Generated kodlar (`lib/api-zod/src/generated/`, `lib/api-client-react/src/generated/`)
- Migration .sql fayllari
- Locales JSON fayllari (CI'da i18n-check.cjs alohida tekshiradi)

NIMANI ALBATTA TEST QILASAN (must list — UI yoki backend FAIL bo'lsa eng katta xavf):
- Har Aggregate metodi (39 × ~10 = ~390 case)
- Har CQRS handler (159 × ~6 = ~950 case)
- Har Repository (111 × ~5 = ~555 case)
- Har Guard / Interceptor / Pipe (15+ × ~3 = ~50 case)
- Har 500-qaytaruvchi endpoint regression test
- Har 20+ Trigger (event-driven) e2e

CHIQARMA / RAPPORT FORMATI (sprint yakunida):
- File: docs/test-progress-sprint-N.md
- Yangi fayllar ro'yxati
- Yangi coverage % (lines, branches, statements)
- CI URL (yashil bo'lishi shart)
- Topilgan bug'lar (test yozayotganda)

EH-TIBORLI BO'LISH:
- "300 fayl yozdim" deding lekin `expect(true).toBe(true)` 50 ta — bu YOLG'ON
- Code-coverage faqat true positive testlar bilan oshirilsin
- Branch coverage muhim — happy + error path kerak
- Mutation score ≥ 60% (Stryker bilan oxirida tekshiriladi)

START:
1. `pnpm test --coverage` ishlat
2. Hozirgi raqamni docs/test-baseline.md ga yoz
3. S1 boshla
```

---

## 10. Foiz xulosa

| Komponent | Bugun | 12 hafta keyin | Yaxshilanish |
|---|:---:|:---:|:---:|
| Backend test/prod nisbati | 12.13% | **≥ 60%** | +47.87% |
| Frontend test/prod nisbati | 0.87% | **≥ 50%** | +49.13% |
| E2E route coverage | ~2.3% | **≥ 30%** | +27.7% |
| Vitest coverage threshold | 25% | **80%** | +55% |
| Jest coverage threshold | yo'q | **80%** | +80% |
| Mutation score | yo'q | **60%** | +60% |
| Architecture rule FAIL'lar | 4 | **0** | −100% |
| 500-qaytaruvchi endpointlar | ~50 | **0** | −100% |
| Test fayllari soni | 278 | **≥ 4 700** | +1 590% |
| **Umumiy test yetuklik** | **~15%** | **≥ 80%** | **+65%** |

---

## 11. Qabul mezonlari (DONE = quyidagi hammasi PASS)

- [ ] Backend Jest coverage **lines ≥ 80%, branches ≥ 75%**
- [ ] Frontend Vitest coverage **lines ≥ 80%, functions ≥ 80%**
- [ ] Playwright E2E ≥ **40 ta spec** yashil
- [ ] Architecture rules (22 ta) — **0 ta FAIL**
- [ ] Stryker mutation score ≥ **60%**
- [ ] CI branch protection: 4 ta workflow PASS bo'lmasa merge taqiqlangan
- [ ] `it.skip` / `xit` / `test.todo` butun repoda **0 ta**
- [ ] `expect(true).toBe(true)` / `expect(1).toBe(1)` topish: **0 ta**
- [ ] `console.log` test fayllarda: **0 ta**
- [ ] `docs/test-coverage-monthly.md` — har oy avtomatik yangilanadi
- [ ] Har 500-qaytaruvchi endpoint regression test bilan qoplangan
- [ ] Loyihada `any` test fayllarda: **0 ta**

---

## 12. Bitta jumlali xulosa

> **Bugun test yetuklik ~15%. 12 hafta, 2 odam, ~4 700 yangi test fayl, qattiq qoidalar — yo 80%+ qoplam, yoki taskni bermayman. Yengillik yo'q. Mock qilib qutulish yo'q. `expect(true)` yo'q.**

---

## Manbalar

- `apps/api/test/jest.config.js`
- `artifacts/erp-dashboard/vitest.config.ts`
- `artifacts/erp-dashboard/e2e/` (11 ta mavjud spec)
- `apps/api/test/architecture/rules.spec.ts`
- `ARCHITECTURE_RULES.md` (22 qoida)
- `SYSTEM_AUDIT_REPORT.md` (~50 ta 500 endpoint ro'yxati)
