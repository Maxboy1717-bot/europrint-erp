# EUROPRINT ERP — TO'LIQ QOIDALAR KONSTITUTSIYASI

> Loyihaning rasmiy, buzilmas qoidalari. **Har qanday AI agent (Claude) va dasturchi doim shu qoidalarga amal qiladi.**
> [CLAUDE.md](CLAUDE.md) bilan birga har sessiyada hisobga olinadi.
> Tarkib: 1 Stek · 2 Arxitektura (23) · 3 Database · 4 Master Data · 5 Duplikat · 6 DDD · 7 Security · 8 Frontend · 9 Testing · 10 Logging · 11 Performance · 12 Queue · 13 Event-driven · 14 Code Review · 15 Agent · 16 Fayl tuzilma · 17 CI/CD.
> Loyiha: **EuroPrint ERP** — Yevroprint poligrafiya korxonasi uchun to'liq ERP.

---

## 1. TEXNOLOGIYA STEKI

```
Backend:
  Runtime:    Node.js 20+ (ESM)
  Framework:  NestJS 11 + Fastify adapter
  ORM:        Drizzle ORM (PostgreSQL)
  Auth:       JWT (access 24h + refresh 7d) + HTTP-only cookie
  Queue:      BullMQ (Redis) + EventEmitter2
  Validation: Zod (class-validator TAQIQ)
  Testing:    Jest / Vitest
Frontend:
  UI:         React 19 + TypeScript 5
  Build:      Vite
  State:      TanStack Query v5 (server state)
  Forms:      react-hook-form + zodResolver
  UI Kit:     shadcn/ui + Radix UI + Tailwind CSS + EP Design System
  i18n:       custom useTranslation (uz / ru / uz-cyr)
  Testing:    Vitest + Testing Library
Infra:
  DB:         PostgreSQL 16   |   Cache/Queue: Redis 7
  Package:    pnpm workspaces monorepo
  CI:         GitHub Actions  |   Container: Docker + docker-compose
  AI:         Gemini API + Gemini LIVE (video-intervyu)
  Messaging:  Telegraf.js (Telegram bot)
  Label:      ZPL/EPL/PDF
```

> Kanonik yo'llar: `apps/api/src/` (BE) · `artifacts/erp-dashboard/src/` (FE) · `lib/db/src/schema/` (Drizzle kanonik).

---

## 2. ARXITEKTURA QOIDALARI (23 ta)

### Qoida 1 — Result Pattern
Barcha service/repository → `Result<T>`. `throw` TAQIQLANGAN (istisnolardan tashqari).
```ts
async findEmployee(id: number): Promise<Result<Employee, AppError>> {
  try {
    const row = await db.select().from(hrEmployees).where(eq(hrEmployees.id, id)).limit(1);
    return row[0] ? Ok(row[0]) : Err({ code: 'NOT_FOUND', message: 'Xodim topilmadi' });
  } catch (e) { return Err({ code: 'DB_ERROR', message: String(e) }); }
}
```
**ISTISNO (throw RUXSAT):** Bull queue `process()` (retry); `db.transaction()` callback (rollback); NestJS HTTP exception controller'da; SSE/WebSocket stream error.

### Qoida 2 — Array Safety
```ts
const items = (result.data ?? []).map(i => i.name);
Array.isArray(rows) ? rows.map(...) : [];
// TAQIQLANGAN: result.data.map(...)  // null → crash
```

### Qoida 3 — Zod Validation (barcha boundary)
```ts
const dto = CreateEmployeeSchema.parse(body);          // throw → 400
const parsed = CreateEmployeeSchema.safeParse(body);   // manual
const form = useForm({ resolver: zodResolver(schema) }); // frontend
// TAQIQLANGAN: manual if/else validation, class-validator
```

### Qoida 4 — No Raw SQL in Controllers/Services
`db.execute(sql\`...\`)` controller/service'da TAQIQLANGAN → faqat Repository (`*.repo.ts` / `*.repository.ts`).

### Qoida 5 — No `as unknown as X` (yangi kodda)
Type guard ishlat. **Istisno:** compat stub, Drizzle `$inferInsert` cast (izoh bilan).

### Qoida 6 — Controller = Transport Only
```ts
@Post()
async create(@Body() body: unknown) {
  const dto = CreateOrderSchema.parse(body);           // 1. parse
  const result = await this.service.create(dto);       // 2. service
  if (!result.ok) throw new BadRequestException(result.error.message);
  return result.data;                                  // 3. response
}
// TAQIQLANGAN: controller'da DB query, biznes logika, transformatsiya
```

### Qoida 7 — Env Vars faqat ConfigService
```ts
const secret = this.config.getOrThrow<string>('JWT_SECRET');  // process.env.* TAQIQ
// .env.example: barcha kalitlar DOIM ro'yxatda (qiymatsiz)
```

### Qoida 8 — Barcha Controller'larda Guard
```ts
@Controller('hr/employees') @UseGuards(JwtAuthGuard, RolesGuard) export class EmployeesController {}
@Get('health') @Public() async health() {}   // ongli qaror, izoh kerak
```
**4 GLOBAL GUARD mavjud:** JwtAuthGuard · RolesGuard · SodGuard · PermissionsGuard — bularni takrorlamaslik.

### Qoida 9 — try/catch DB chaqiruvlar atrofida
```ts
async save(entity: Employee): Promise<Result<Employee, AppError>> {
  try { await db.insert(hrEmployees).values(payload); return Ok(entity); }
  catch (e) { this.logger.error('[EmpRepo] save xato:', e); return Err({ code: 'DB_ERROR', message: String(e) }); }
}
```

### Qoida 10 — Repository Layer Only
`Domain → Application → Infrastructure(Repository) → DB`. Faqat `*.repo.ts`/`*.repository.ts` `db.*` chaqiradi.

### Qoida 11 — Circular Dependency Yo'q
`ModuleA → ModuleB → ModuleA` = FAIL. `madge`/DepGraph bilan tekshir; ForwardRef yoki shared module.

### Qoida 12 — Magic Number Yo'q
```ts
const MAX_LOGIN_ATTEMPTS = 5;  const INPS_RATE = 0.08;  const NDFL_RATE = 0.12;
// TAQIQLANGAN: if (attempts > 5)  const tax = salary * 0.12;
```

### Qoida 13 — Non-null Assertion Yo'q
```ts
user?.name ?? 'Noma\'lum';   if (!row) return Err({ code: 'NOT_FOUND' });
// TAQIQLANGAN: user!.name  row!.id
```

### Qoida 14 — console.log Yo'q (production)
Backend: `private readonly logger = new Logger(X.name)`. Frontend: `errorLogger`. **Istisno:** `scripts/`.

### Qoida 15 — Sensitive Data Log'ga Tushmasin
Parol, token, karta raqami, OTP, JWT secret — LOG'DA HECH QACHON. Subagentga secret berilmaydi (Q-30).

### Qoida 16 — Fayl Hajmi ≤ 900 satr
Oshsa: helper faylga / kichik class'larga bo'lish.

### Qoida 17 — Funksiya Hajmi ≤ 150 satr
Oshsa: private helper / strategy pattern.

### Qoida 18 — `any` Type Yo'q
`unknown` + type guard. `type DbRow = Record<string, unknown>` — DB row uchun ruxsat.

### Qoida 19 — Destructive Action → AlertDialog
O'chirish/qaytarish/massiv yangilash → confirm SHART (shadcn `AlertDialog`).

### Qoida 20 — Form → Zod + react-hook-form
`useForm({ resolver: zodResolver(schema), defaultValues })`. Manual validation TAQIQ.

### Qoida 21 — API Call → faqat apiRequest()
```ts
const res = await apiRequest<Employee[]>('GET', '/api/hr/employees');  // fetch/axios TAQIQ
```

### Qoida 22 — Har Service'ga Unit Test
`*.service.spec.ts`, Repository mock, DB'siz (AAA pattern).

### Qoida 23 — Schema Dup Ratchet
`pgTable("jadval")` BITTA faylda. Dup count oshsa → CI FAIL.

---

## 3. DATABASE QOIDALARI

**Jadval nomlari:** snake_case, **ko'plik**, modul prefiksi:

| Modul | Prefiks | Misol |
|-------|---------|-------|
| HR / Xodimlar | `hr_` | `hr_employees`, `hr_leave_requests` |
| Org tuzilma | `org_` | `org_functions`, `org_departments` |
| Savdo/SD | `sd_` | `sd_sales_orders` (VIEW), `sales_orders` (kanonik) |
| Ishlab chiqarish/PP | `pp_` | `pp_production_plans`, `work_orders` |
| MES | `mes_` | `mes_shift_handovers` (VIEW) |
| Sifat/QC | `qc_` | `qc_checks`, `qc_reclamations` |
| Ombor/WMS | `wms_` | `warehouse_stock` (kanonik) |
| Moliya/FIN | `fin_` | `entries` (kanonik GL) |
| CRM | `crm_` | `crm_leads`, `crm_deals` |
| POS | `pos_` | `pos_transactions` |
| IoT/MES mashina | `iot_` / `mes_` | `mes_telemetry` |
| AI | `ai_` | `ai_recommendations` |
| Marketing | `mkt_` | `mkt_campaigns` |
| LMS | `lms_` | `lms_courses` |
| Notification | `ntf_` | `ntf_notifications` |
| Kanban | `kan_` | `kan_boards`, `kan_tasks` |

❌ `User`, `employeeList`, prefikssiz yangi jadval — TAQIQ.

**Standart ustunlar (barcha jadvalda):**
```sql
id          SERIAL / INTEGER GENERATED ALWAYS AS IDENTITY
created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
deleted_at  TIMESTAMPTZ              -- soft delete, NULL = aktiv
```

**Jadval toifalari:**
| Tur | Qo'shimcha ustunlar |
|-----|-------------------|
| Aggregate-root (biznes) | + `created_by, updated_by` · `version` (optimistic lock) |
| Child/line | + parent FK; alohida version/deleted_at YO'Q |
| Global lookup | `code` UNIQUE + `status`; soft-delete yo'q |
| Append-only (ledger/audit/outbox) | faqat insert; UPDATE/DELETE trigger rad etadi |

**Drizzle (kanonik bitta joy + re-export):**
```ts
// lib/db/src/schema/hr-employees.ts — KANONIK
export const hrEmployees = pgTable('hr_employees', {
  id:           integer('id').primaryKey().generatedAlwaysAsIdentity(),
  userId:       integer('user_id').references(() => users.id),
  orgFunctionId: integer('org_function_id').references(() => orgFunctions.id),
  status:       varchar('status', { length: 50 }).notNull().default('active'),
  createdAt:    timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt:    timestamp('updated_at', { withTimezone: true }).defaultNow(),
  deletedAt:    timestamp('deleted_at', { withTimezone: true }),
});
// apps/api/src/shared/db/schema.ts — RE-EXPORT:  export { hrEmployees } from '@workspace/db';
// TAQIQLANGAN: ikkinchi pgTable("hr_employees")
```

**Migration — IDEMPOTENT:**
```sql
CREATE TABLE IF NOT EXISTS hr_employees ( ... );
ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS razryad_level_id INTEGER;
```
Har migration APPROVED izoh bilan: `-- APPROVED: egasi (sana)`.

**Index:** FK DOIM index; qidiruv → unique; soft-delete partial index.
```sql
CREATE INDEX IF NOT EXISTS idx_hr_employees_org_function ON hr_employees(org_function_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE deleted_at IS NULL;
```

**Check constraint:**
```sql
ALTER TABLE sales_orders ADD CONSTRAINT chk_sales_orders_status
  CHECK (status IN ('draft','confirmed','in_production','shipped','done','cancelled'));
```

**Transaction (ko'p jadval atomik):**
```ts
await db.transaction(async (tx) => {
  const order = await tx.insert(salesOrders).values(orderData).returning();
  await tx.insert(salesOrderItems).values(items.map(i => ({ ...i, salesOrderId: order[0].id })));
  await tx.insert(domainEvents).values({ type: 'order.created', payload: JSON.stringify({orderId: order[0].id}) });
});
```

> ⭐ **KANONIK JADVALLAR (ikki-dunyo taqiqlangan):**
> - Buyurtma: `sales_orders` (`sd_sales_orders`=VIEW); `orders` — eski, o'chirish.
> - Stok: `warehouse_stock` (`current_stock`=VIEW); `stocks`=partiya (saqlanadi, alohida maqsad).
> - GL: `entries`/`gl_entries` kanonik; `gl_journal_entries`+`gl_lines`=SAP#76 (tegma).
> - Yangi jadval → avval ikki-dunyo tekshiruvi; mavjud bo'lsa VIEW yoki shu jadvalni ishlat.
> - Yangi jadval → egasi ruxsati kerak (Q-35): `-- APPROVED: egasi (sana)` izoh migratsiyada.

---

## 4. MASTER DATA QOIDALARI

**Yagona manba:** har biznes ob'ekti = 1 kanonik jadval. Ikki jadval bir ma'no = XATO → VIEW yoki refaktor.

**View pattern (modul izolyatsiyasi):**
```sql
CREATE TABLE sales_orders (...);              -- KANONIK
CREATE OR REPLACE VIEW sd_sales_orders AS     -- SD alias
  SELECT id, customer_id, status, total FROM sales_orders WHERE deleted_at IS NULL;
CREATE OR REPLACE VIEW current_stock AS       -- WMS alias
  SELECT material_id, warehouse_id, qty, reserved_qty FROM warehouse_stock WHERE deleted_at IS NULL;
```

**Enum/Lookup:** statik → kodda konstanta; dinamik → DB jadval (`code` UNIQUE).

**Kanonik master jadvallar (EuroPrint):**
- Mijoz: `sd_customers` (→ FE); `customers` (ichki kanonik) — birlashtirilsin
- Material: `material_cards` (kanonik, faol); `mm_materials` (test-only dup)
- Xodim: `hr_employees` + `users` (login) — `org_functions`ga bog'liq (karta markaz)
- Zavod/sex: `org_departments` (kanonik)
- Karta (lavozim): `org_functions` (29+ FK, asosiy hub)
- Razryad: `razryad_levels` (HR poydevori)
- Texkarta: `technology_cards` (kanonik master, `tech_cards`=order-bound, tegma)

---

## 5. DUPLIKAT OLDINI OLISH

- Fayl: kanonik bitta, qolganlar `export { ... } from '@/lib/format'`.
- Component: har modulda o'z `KpiCard` ❌ → `components/shared/` yoki EP Design System.
- Schema: `pgTable('jadval')` bir faylda; boshqa joyda re-export.
- Service: bir xil hisob ikki service'da ❌ → `common/` shared.
- i18n: bir key ikki namespace'da ❌ → `common`'ga ko'chir.
- Drizzle dup ratchet: CI bloklaydi.

---

## 6. DDD ARXITEKTURA QOIDALARI

**4-layer (har modul):** `domain/` → `application/` → `infrastructure/` → `presentation/` → `[module].module.ts`.

**Value Object (immutable, o'z-o'zini validate):**
```ts
export class RazryadLevel {
  private constructor(private readonly value: number) {}
  static create(raw: number): Result<RazryadLevel, AppError> {
    if (raw < 1 || raw > 6) return Err({ code: 'INVALID_RAZRYAD', message: 'Razryad 1-6 orasida' });
    return Ok(new RazryadLevel(raw));
  }
  getValue() { return this.value; }
}
```

**Aggregate root:** faqat metodlar orqali o'zgaradi + domain events → `pullDomainEvents()`.

**Event-driven:** `class OrderCreatedEvent implements DomainEvent { readonly type='order.created'; ... }`. Outbox pattern (DB + domain_events jadval atomik).

---

## 7. AUTHENTICATION / SECURITY

**JWT payload:** `{ sub, username, role, jti }` — hech qachon parol/OTP/karta raqami.
**5 GLOBAL GUARD:** JwtAuthGuard · RolesGuard · SodGuard · PermissionsGuard · (AuditInterceptor).
**@Public()** — faqat asoslangan holatlarda (izoh bilan).
**Input sanitizatsiya:** XSS → `sanitizeHtml`; SQL → Drizzle parameterized; Path traversal → `basename`.
**Secrets:** `.env` (git'da YO'Q) qiymat bilan; `.env.example` qiymatsiz; prod → Vault.
**JWT minting TAQIQ** — subagent/Muslimbek JWT yaratmaydi (Q-30). Kalitlar logs'da YO'Q.

**Ruxsat modeli:** RBAC (`roles`) + maydon darajasi (oylik faqat haqdorga); ruxsat **kartadan** (lavozim = org_function) → xodimga.

---

## 8. FRONTEND QOIDALARI

**Query (queryKey aniq/unique; har holat ko'rsatilsin):**
```ts
const { data, isLoading, isError } = useQuery({
  queryKey: ['hr-employees', { page, orgFunctionId, status }],
  queryFn: () => apiRequest<Employee[]>('GET', `/api/hr/employees?page=${page}`),
  staleTime: 30_000,
});
if (isLoading) return <EPSkeletonTable />;
if (isError) return <EPErrorState />;
if (!data?.length) return <EPEmptyState />;
```

**Mutation (invalidate + toast):**
```ts
const m = useMutation({
  mutationFn: (dto: CreateEmployeeDto) => apiRequest<Employee>('POST', '/api/hr/employees', dto),
  onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['hr-employees'] }); toast.success(t('saved')); },
  onError: (e) => toast.error(e.message ?? t('error')),
});
```

**i18n:** hardcoded matn TAQIQ → `const { t } = useTranslation('hr'); t('employee.name')`. Har yangi key → `uz/` + `ru/` + `uz-cyr/` uchchalasiga.

**Format (kanonik `@/lib/format`):** `formatCurrency`, `formatDate`, `formatDateTime`, `formatNumber`. Qayta yozish TAQIQ.

**Error boundary:** har asosiy page `<ErrorBoundary>`.

**Design tizimi (majburiy):** FAQAT EP Design System — [DIZAYN_QOIDALARI.md](DIZAYN_QOIDALARI.md). Xom rang (`#...`) TAQIQ. Faqat token (`var(--ep-*)`, `var(--mod-*)`). Yangi sahifa: `EPPageHeader` + `space-y-6` root + EP komponentlar.

---

## 9. TESTING QOIDALARI

**Backend unit (AAA, mock repo, DB'siz):**
```ts
it('xodim yaratish — muvaffaqiyatli', async () => {
  mockRepo.findByUserId.mockResolvedValue(Ok(null));
  mockRepo.save.mockResolvedValue(Ok(mockEmployee));
  const result = await service.createEmployee(dto, adminId);
  expect(result.ok).toBe(true);
  expect(mockRepo.save).toHaveBeenCalledOnce();
});
```

**Frontend:** smoke (`renders without throwing`) + feature (filtr ishlaydi va h.k.).
**Integration:** `app.inject()` → statusCode/json tekshir.
**CI gate:** typecheck 0 + test coverage ≥ 70% → merge.

---

## 10. LOGGING QOIDALARI

Backend: `Logger(X.name)` — `log()` amallar · `warn()` kutilmagan · `error()` xato+stack.

**Audit log (muhim operatsiyalar):**
```ts
await this.auditLog.record({ action: 'employee.created', entityType: 'Employee', entityId,
  userId, ip: request.ip });
```

Log fayllar HECH QACHON commit qilinmaydi (`.gitignore`: `backend.log*`, `*.log.*`).

---

## 11. PERFORMANCE QOIDALARI

**N+1 → JOIN:** loop ichida DB call YO'Q; `leftJoin` ishlat.
**Pagination:** `.limit(20).offset(page*20)` — hamma narsani olish TAQIQ.
**Cache:** TanStack `staleTime` (5min statik / 30s tez / 0 real-time); Redis `setex`.

---

## 12. QUEUE / BACKGROUND JOB

BullMQ `@Process()` — inner Result; fail → `throw new Error()` (Bull retry uchun). EventEmitter2 — in-process fast events. Outbox — guaranteed delivery (DB + polling processor).

---

## 13. EVENT-DRIVEN QOIDALARI

**Domain event:** `class SalesOrderCreatedEvent implements DomainEvent { readonly type='order.created'; ... }`.

**Outbox (guaranteed delivery):**
```ts
await db.transaction(async (tx) => {
  await tx.insert(salesOrders).values(orderData);
  await tx.insert(domainEvents).values({ type:'order.created', payload: JSON.stringify({orderId}), status:'pending' });
});
```
Event listeners `@OnEvent('order.created')` — hech bo'lmasa bitta listener KERAK (zero-listener event = no-op xavfi).

---

## 14. CODE REVIEW CHECKLISTI

- **CR-SEC:** ☐ SQL injection (Drizzle param) ☐ XSS ☐ har endpoint guard ☐ secrets `.env` ☐ JWT minting TAQIQ ☐ sensitive log YO'Q ☐ rate limit (public).
- **CR-DB:** ☐ transaction atomic ☐ N+1 yo'q ☐ FK index ☐ NOT NULL ☐ soft-delete filter ☐ migration additive ☐ APPROVED izoh (Q-35) ☐ ikki-dunyo tekshiruvi.
- **CR-TS:** ☐ `any` yo'q ☐ `!` yo'q ☐ type guard ☐ Result<T> ☐ explicit return type.
- **CR-FE:** ☐ EPSkeleton loading ☐ EPErrorState ☐ EPEmptyState ☐ queryKey unique ☐ mutation invalidate ☐ Zod+RHF ☐ destructive→AlertDialog ☐ i18n `t()` ☐ EP token (no raw color).
- **CR-ARCH:** ☐ layer (Controller→Service→Repo→DB) ☐ circular dep yo'q ☐ dead code yo'q ☐ duplication yo'q ☐ file/function size ☐ kanonik jadval ☐ VIEW, FAKE YO'Q.
- **CR-VIZYON:** ☐ Vizyon (docs/audit/) ga mosmi ☐ ishlaydi=mazmunan to'g'ri emasini tekshir (C2) ☐ round-trip isboti (C4).

---

## 15. AGENT KONSTITUTSIYASI

- **ADVISOR (Claude):** FAQAT hujjat/promt/tahlil/nazorat — KOD YO'Q, commit YO'Q (I1).
- **BAJARUVCHI (Muslimbek):** kod+commit; bir vaqtda BITTA; subagent faqat read-only tahlil (I2).
- **SCOPE:** FAQAT so'ralgan vazifa; ortiqcha refactor TAQIQ; "by the way" → `spawn_task`.
- **ADD-ONLY:** ishlayotgan kod o'chirilmaydi (Q-46); yangi qo'shiladi; singan kod to'liq o'chiriladi.
- **TEKSHIRISH:** `npx tsc --noEmit` (0 xato) + `pnpm test --passWithNoTests` + `check-design-tokens.mjs` + `check-sidebar-routes.mjs` + `i18n-status.mjs`.
- **GIT:** `git add [aniq fayl]` (add -A TAQIQ) · commit har bosqich · log fayllar commit TAQIQ.
- **DDL:** ko'rsatish → egasi "ha" → `APPROVED: egasi (sana)` izoh → bajarish (Q-35).
- **VIZYON = to'g'rilik o'lchovi:** 200 OK ≠ to'g'ri. `docs/audit/` vizyoniga mos bo'lishi SHART (C1).
- **FAKE YO'Q:** har endpoint REAL DB INSERT/UPDATE. `{ok:true}`/echo TAQIQ. Yo'q → halol 501 (C3).
- **i18n:** hardcoded matn TAQIQ; yangi key → uz+ru+uz-cyr uchchalasiga.
- **XOTIRA:** muhim qaror darrov `memory/` ga yoziladi; sessiya boshida `CLAUDE.md` o'qi.
- **TOKEN:** subagent fleetlar TAQIQ (routine verify uchun); cheap inline verify ishlat (Q-anti-waste).

---

## 16. FAYL TUZILMASI (kanonik)

```
repo-root/  (Uzbek-Language-Module/)
├── CLAUDE.md                          # auto-load konstitutsiya
├── LOYIHA_QOIDALARI.md               # ★ bu fayl
├── DIZAYN_QOIDALARI.md               # EP Design System
├── apps/api/src/
│   ├── modules/[MODULE]/
│   │   ├── domain/        aggregates/ entities/ value-objects/ repositories/(I*) events/
│   │   ├── application/   services/ commands/ queries/ dtos/(Zod)
│   │   ├── infrastructure/ repositories/(drizzle-*.repo.ts) adapters/
│   │   ├── presentation/  controllers/
│   │   └── [module].module.ts
│   ├── shared/  db/(schema.ts re-export)  domain/(shared VOs)
│   └── common/  guards/ decorators/ result/(Ok,Err,Result<T>) filters/
├── lib/db/src/schema/                # KANONIK Drizzle (bitta manba)
├── artifacts/erp-dashboard/src/
│   ├── components/  ui/(shadcn) shared/ [module]/
│   ├── pages/  hooks/(useQuery/useMutation)
│   └── lib/  format.ts  i18n/(uz/ ru/ uz-cyr/)  apiRequest.ts
├── docs/
│   ├── audit/                        # Vizyon hujjatlari (MASTER-SAVOL-JAVOB va boshqalar)
│   ├── V2-REBUILD/                   # v2 reja + Backend_Reja/
│   └── migration/                    # SQL migratsiyalar
└── scripts/                          # check-design-tokens, check-sidebar-routes, i18n-status
```

---

## 17. CI/CD KONFIGURATSIYA

```yaml
name: EuroPrint CI
on:
  push: { branches: [main, 'chore/**', 'feat/**', 'fix/**'] }
  pull_request:
jobs:
  backend:        # tsc:api (0 xato) + jest --coverage
  frontend:       # tsc:fe + vitest --coverage
  architecture:   # scripts/run-all-reviewers.sh  (23 qoida)
  design-tokens:  # scripts/check-design-tokens.mjs  (0 raw color)
  i18n-check:     # scripts/i18n-status.mjs  (0 missing key)
  schema-dup:     # scripts/check-schema-dups.js  (ratchet)
  security:       # semgrep p/owasp-top-ten + p/secrets
```
Har job PASS bo'lmasa merge bloklanadi.

---

## ⭐ VIZYON & TO'G'RILIK QOIDALARI (EuroPrint-maxsus, buzilmas)

**C1.** Vizyon = to'g'rilik o'lchovi: `docs/audit/` (intervyu + MASTER-SAVOL-JAVOB + 1000-Q&A).
**C2.** Verify-don't-trust: har da'vo kod + DB + live probe bilan tasdiq.
**C3.** Fake YO'Q: har forma REAL saqlaydi. `{ok:true}` stub → 501.
**C5.** Regress TAQIQ: avval ishlagan → o'zgarishdan keyin ham ishlaydi.
**C6.** Qayta qurish YO'Q (modul darajasida): tuzat va ula — to'liq qayta yozish TAQIQ.

**E1.** AI kuzatadi → inson tasdiqlaydi (jarima/ball/blok = avtomatik EMAS).
**E2.** Karta-markaz: org_function karta = birlamchi; xodim ikkilamchi.
**E3.** AI rejalashtiradi: 7-qadam (buyurtma→material→bron→marshrut→vaqt→reja→ijro); menejer tasdiqlaydi.
**E5.** Org-sxema marshruti: hujjat/tasdiq org-chart bo'yicha.
**E6.** Bitta haqiqat: ikki-dunyo TAQIQ; kanonik jadval yagona.

**F1.** RBAC eng kuchli: ruxsat kartadan, maydon darajasida. 5 global guard.
**F6.** Secret subagentga berilmaydi; JWT mint TAQIQ; log COMMIT TAQIQ.

**H1.** Buyurtma = `sales_orders`; **H2.** Stok = `warehouse_stock`; **H3.** GL = `entries`; **H4.** Yangi jadval → ikki-dunyo tekshiruvi + egasi ruxsati.

---

*Hujjat oxiri — [CLAUDE.md](CLAUDE.md) orqali har sessiyada qo'llanadi.*
*EuroPrint ERP · Egasi: Ayubxon Pozilov · Manba: docs/audit/ vizyon hujjatlar · Versiya: 2026-06-18*
