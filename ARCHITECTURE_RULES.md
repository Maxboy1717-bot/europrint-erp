# EuroPrint ERP — Architecture Rules

> Every rule below is enforced by a reviewer script. **Run `bash scripts/run-all-reviewers.sh` before every merge.** The architecture rule test (`apps/api/test/architecture/rules.spec.ts`) verifies that each rule is documented, has an existing reviewer, exits deterministically (0=PASS, 1=FAIL), and defines wrong/correct examples.

## Summary

| # | Rule | Status | Violations |
|---|------|--------|------------|
| 1 | Result Pattern | ✅ PASS | 0 |
| 2 | Array Safety | ✅ PASS | 0 |
| 3 | Zod Validation | ✅ PASS | 0 |
| 4 | No Raw SQL | ✅ PASS | 0 |
| 5 | No `as unknown` Stubs | ✅ PASS | 0 |
| 6 | Controller is Transport Only | ✅ PASS | 0 |
| 7 | Environment Variables via ConfigService | ✅ PASS | 0 |
| 8 | All Controllers Must Have Guards | ✅ PASS | 0 |
| 9 | try/catch Required | ✅ PASS | 0 |
| 10 | Repository Layer Only | ✅ PASS | 0 |
| 11 | No Circular Dependencies | ✅ PASS | 0 |
| 12 | No Magic Numbers | ✅ PASS | 0 |
| 13 | No Non-null Assertions | ✅ PASS | 0 |
| 14 | No `console.log` | ✅ PASS | 0 |
| 15 | No Sensitive Data in Logs | ✅ PASS | 0 |
| 16 | File Size Limit | ✅ PASS | 0 |
| 17 | Function Size Limit | ✅ PASS | 0 |
| 18 | No `any` Type | ✅ PASS | 0 |
| 19 | Mutations Require AlertDialog | ✅ PASS | 0 |
| 20 | Frontend Forms Require Zod | ✅ PASS | 0 |
| 21 | API Calls via `apiRequest` Only | ✅ PASS | 0 |
| 22 | Unit Tests Required | ✅ PASS | 0 |

**Aggregate: 22 PASS / 0 FAIL.** Run `bash scripts/run-all-reviewers.sh` for the live count.

---

## Rule 1 — Result Pattern

**Description:** All repository and service methods must return `Promise<Result<T>>`. `return null`, `return undefined`, and `throw new Error()` are forbidden.

**Why:** The caller is forced to inspect the failure branch. Exceptions stop the program; `Result<T>` is a controlled failure that TypeScript's discriminated union forces every caller to handle.

```typescript
// ❌ WRONG — caller may forget to null-check
async findUser(id: number) {
  const rows = await db.select().from(users).where(eq(users.id, id));
  if (!rows[0]) return null;
  return rows[0];
}

// ✅ CORRECT — caller is forced to check r.ok
async findUser(id: number): Promise<Result<User>> {
  try {
    const rows = await db.select().from(users).where(eq(users.id, id));
    if (!rows[0]) return Err(AppErr('NOT_FOUND', 'User not found'));
    return Ok(rows[0]);
  } catch (e) {
    return Err(AppErr('INTERNAL', String(e)));
  }
}
```

**Reviewer:** `bash scripts/reviewer-result-pattern.sh`
**Current Status:** ✅ **PASS** — 0 violations

---

## Rule 2 — Array Safety

**Description:** Before `.map()`, `.filter()`, `.forEach()`, `.reduce()`, `.find()`, `.some()`, `.every()`, `.flatMap()`, `.sort()` — an `Array.isArray()` check is mandatory.

**Why:** A non-array input crashes the entire request handler. Drizzle and API responses sometimes return wrapped or null shapes; defending at every call site prevents `.map is not a function` 500s.

```typescript
// ❌ WRONG — crash risk
const ids = data.map(x => x.id);

// ✅ CORRECT
const rows = Array.isArray(data) ? data : [];
const ids = rows.map(x => x.id);

// ✅ CORRECT — frontend with Result envelope
const sessions = Array.isArray(sessionsData?.data) ? sessionsData.data : [];
```

**Reviewer:** `bash scripts/reviewer-array-safety.sh`
**Current Status:** ✅ **PASS** — 0 violations

---

## Rule 3 — Zod Validation

**Description:** Every controller method that accepts `@Body()` must validate the payload through a Zod schema. `class-validator` decorators are forbidden in new code.

**Why:** One validation library, one source of truth. Zod schemas double as TypeScript types (via `z.infer<typeof Schema>`).

```typescript
// ❌ WRONG — uses class-validator + accepts `any`
@Post()
async create(@Body() body: any) {
  return this.service.create(body);
}

// ✅ CORRECT
const CreateSchema = z.object({
  name: z.string().min(1).max(200),
  quantity: z.number().int().positive(),
});

@Post()
async create(@Body() body: unknown) {
  const dto = CreateSchema.parse(body);
  return this.service.create(dto);
}
```

**Reviewer:** `bash scripts/reviewer-dto-validation.sh`
**Current Status:** ✅ **PASS** — 0 violations

---

## Rule 4 — No Raw SQL

**Description:** `db.execute(sql\`...\`)` is allowed only for queries that cannot be expressed with Drizzle ORM (LATERAL JOIN, dynamic SQL fragments, complex UNION ALL, etc.). Simple CRUD must use the ORM. `sql.raw(variable)` is **strictly forbidden** (SQL-injection risk).

**Why:** Drizzle gives compile-time type safety; raw strings break that and re-introduce injection risk. The ORM also enables refactoring with confidence.

```typescript
// ❌ WRONG — SQL injection risk
const q = req.body.query;
await db.execute(sql.raw(q));

// ❌ WRONG — simple CRUD as raw SQL
await db.execute(sql`SELECT * FROM employees WHERE id = ${id}`);

// ✅ CORRECT — ORM
await db.select().from(employees).where(eq(employees.id, id));

// ⚠ ACCEPTED — complex, with a WHY comment
// WHY: Drizzle does not support LATERAL JOIN; raw SQL is the only path.
await db.execute(sql`SELECT e.* FROM employees e LATERAL JOIN ...`);
```

**Reviewer:** `bash scripts/reviewer-raw-sql.sh`
**Current Status:** ✅ **PASS** — 0 violations

---

## Rule 5 — No `as unknown` Stubs

**Description:** `[] as unknown[]`, `null as unknown`, `{} as unknown` used as stubs are forbidden. Use real types and real data from the repository.

**Why:** Stubbed values silently break dashboards: the UI shows empty tables when the backend never actually hit the DB.

```typescript
// ❌ WRONG — never queries DB
return { data: [] as unknown[], total: 0 };

// ✅ CORRECT
const result = await this.repo.findAll(filters);
const data = result.ok && Array.isArray(result.data) ? result.data : [];
return { data, total: data.length };
```

**Reviewer:** `bash scripts/reviewer-as-unknown.sh`
**Current Status:** ✅ **PASS** — 0 violations

---

## Rule 6 — Controller is Transport Only

**Description:** Controllers may validate input, call a service, and format the response. Business logic, calculations, `.map()/.filter()` chains, `Date` arithmetic, and direct DB queries inside controllers are forbidden.

**Why:** Putting business logic in controllers makes it impossible to reuse from a cron job, queue processor, or test. It also blurs layer boundaries.

```typescript
// ❌ WRONG — ABC classification inside controller
@Get('abc-analysis')
async getAbc() {
  const rows = await this.db.execute(sql`...`);
  const total = rows.reduce((s, r) => s + r.value, 0);
  return rows.map(r => ({ ...r, class: r.value / total > 0.8 ? 'A' : 'B' }));
}

// ✅ CORRECT
@Get('abc-analysis')
async getAbc() {
  const r = await this.catalogService.getAbcAnalysis();
  return unwrapOrThrow(r);
}
```

**Reviewer:** `bash scripts/reviewer-controller-logic.sh`
**Current Status:** ✅ **PASS** — 0 violations

---

## Rule 7 — Environment Variables via ConfigService

**Description:** `process.env.X` must not be used directly. All access goes through `ConfigService.getOrThrow()` (or `.get<T>()` with a fallback).

**Why:** `ConfigService` validates env on boot, supports testing overrides, and documents which keys the service actually depends on. Direct `process.env` reads bypass all of that.

```typescript
// ❌ WRONG
const secret = process.env.JWT_SECRET;

// ✅ CORRECT
const secret = this.config.getOrThrow<string>('JWT_SECRET');
```

**Reviewer:** `bash scripts/reviewer-process-env.sh`
**Current Status:** ✅ **PASS** — 0 violations

---

## Rule 8 — All Controllers Must Have Guards

**Description:** Every `@Controller()` must either be wrapped in `@UseGuards(JwtAuthGuard)` (global default) or explicitly opt out per-method with `@Public()`. Unguarded endpoints are forbidden.

**Why:** A new controller without a guard is an instant auth bypass. The default must be "locked", not "open".

```typescript
// ❌ WRONG — no guard, anyone can call
@Controller('orders')
export class OrdersController { }

// ✅ CORRECT
@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController { }
```

**Reviewer:** `bash scripts/reviewer-jwt-guard.sh`
**Current Status:** ✅ **PASS** — 0 violations

---

## Rule 9 — try/catch Required

**Description:** Every repository and service method that touches the DB must wrap the call in `try { ... } catch { return Err(...) }`. The reviewer also accepts the `safeCall(...)` wrapper as equivalent.

**Why:** An uncaught DB exception (connection drop, constraint violation, timeout) crashes the request with a 500 instead of producing a clean Result.

```typescript
// ❌ WRONG
async findById(id: number) {
  return await db.select().from(users).where(eq(users.id, id));
}

// ✅ CORRECT — try/catch
async findById(id: number): Promise<Result<User | null>> {
  try {
    const rows = await db.select().from(users).where(eq(users.id, id));
    return Ok(rows[0] ?? null);
  } catch (e) {
    return Err(AppErr('INTERNAL', String(e)));
  }
}

// ✅ CORRECT — safeCall wrapper
async findById(id: number): Promise<Result<User | null>> {
  return safeCall(async () => {
    const rows = await db.select().from(users).where(eq(users.id, id));
    return rows[0] ?? null;
  }, 'DB_ERROR');
}
```

**Reviewer:** `bash scripts/reviewer-try-catch.sh`
**Current Status:** ✅ **PASS** — 0 violations

---

## Rule 10 — Repository Layer Only

**Description:** Repository methods only interact with the database. Business logic, calculations, and conditional formatting must live in the service layer. SQL-side aggregates (`SUM`, `AVG`, `COUNT`, `COALESCE`) inside `sql\`...\`` templates are not "business logic" — they're query syntax.

**Why:** A repository is a thin mapping from domain entity to DB row. Putting business rules there couples the data model to the rules and prevents reuse from cron jobs or queue processors.

```typescript
// ❌ WRONG — repository computes ABC tier in JS
async getAbcAnalysis() {
  const rows = await db.select().from(items);
  return rows.map(r => ({ ...r, tier: r.value > 1000 ? 'A' : 'B' }));
}

// ✅ CORRECT — repo returns raw rows; service classifies
async getItemsWithValue() {
  return Ok(await db.select().from(items));
}
```

**Reviewer:** `bash scripts/reviewer-repository-layer.sh`
**Current Status:** ✅ **PASS** — 0 violations

---

## Rule 11 — No Circular Dependencies

**Description:** Modules must not import each other in a cycle. Cycles are resolved by extracting the shared interface or type into a third module.

**Why:** Circular imports cause `undefined` at module-eval time, kill tree-shaking, and create a maze that no one can reason about.

```typescript
// ❌ WRONG: a.ts and b.ts import each other
// a.ts: import { B } from './b';
// b.ts: import { A } from './a';

// ✅ CORRECT: shared type in c.ts
// c.ts: export interface Shared { ... }
// a.ts: import { Shared } from './c';
// b.ts: import { Shared } from './c';
```

**Reviewer:** `bash scripts/reviewer-circular-deps.sh` (prefers `madge` in CI for AST-precise analysis)
**Current Status:** ✅ **PASS** — 0 violations

---

## Rule 12 — No Magic Numbers

**Description:** Business numeric constants (tax rates, KPI weights, thresholds) must live in `apps/api/src/common/constants/business.constants.ts` with meaningful names. Formulaic constants in algorithms (e.g., `Math.round(x * 100) / 100`, `value / 100` for percent-to-decimal, jitter `0.2 - 0.1`) are exempt — extracting them harms readability.

**Why:** A bare `0.12` says nothing; `INCOME_TAX_RATE` says everything. Changing the value becomes a one-line edit instead of a grep-and-replace.

```typescript
// ❌ WRONG
const score = a * 0.5 + q * 0.3 + o * 0.2;

// ✅ CORRECT
import { KPI_WEIGHT_ACHIEVEMENT, KPI_WEIGHT_QUALITY, KPI_WEIGHT_OEE }
  from '@/common/constants/business.constants';
const score = a * KPI_WEIGHT_ACHIEVEMENT
            + q * KPI_WEIGHT_QUALITY
            + o * KPI_WEIGHT_OEE;
```

**Reviewer:** `bash scripts/reviewer-magic-numbers.sh`
**Current Status:** ✅ **PASS** — 0 violations

---

## Rule 13 — No Non-null Assertions

**Description:** The `!` postfix operator is forbidden. Use `??`, optional chaining (`?.`), or explicit `if` checks.

**Why:** `!` tells the compiler to trust you when in fact a runtime null is possible. Crashes silently in prod.

```typescript
// ❌ WRONG
const item = list.find(x => x.id === id)!;
const face = faces[0]!;

// ✅ CORRECT
const item = list.find(x => x.id === id) ?? defaultItem;
const face = faces[0];
if (!face) return Err(AppErr('NOT_FOUND', 'Face missing'));
```

**Reviewer:** `bash scripts/reviewer-non-null.sh`
**Current Status:** ✅ **PASS** — 0 violations

---

## Rule 14 — No `console.log`

**Description:** Use NestJS `Logger` only. `console.log`, `console.warn`, `console.error` are forbidden in production code (`apps/api/src/`, `artifacts/erp-dashboard/src/`).

**Why:** `Logger` integrates with pino structured logging; `console.*` skips that pipeline and produces unparseable output in production.

```typescript
// ❌ WRONG
console.log('User logged in', user);

// ✅ CORRECT
private readonly logger = new Logger(MyService.name);
this.logger.log(`User logged in: ${user.username}`);
```

**Reviewer:** `bash scripts/reviewer-console-log.sh`
**Current Status:** ✅ **PASS** — 0 violations

---

## Rule 15 — No Sensitive Data in Logs

**Description:** Passwords, JWT tokens, refresh tokens, OTP codes, card numbers, INN/passport numbers, and full names paired with phone numbers must never appear in logs.

**Why:** Log files are forwarded to monitoring systems and persisted. A single plaintext password in logs is a security incident.

```typescript
// ❌ WRONG
this.logger.log(`login attempt: ${username}:${password}`);
this.logger.log(`token issued: ${token}`);

// ✅ CORRECT
this.logger.log(`login attempt for username: ${username}`);
this.logger.log(`token issued for user id: ${user.id}`);
```

**Reviewer:** `bash scripts/reviewer-sensitive-logs.sh`
**Current Status:** ✅ **PASS** — 0 violations

---

## Rule 16 — File Size Limit (300 lines)

**Description:** Each `.ts` / `.tsx` file must be ≤ 300 lines. Larger files are split into purposeful submodules (`*Types.ts`, `*Helpers.tsx`, `*Sections.tsx`, `*Dialogs.tsx`, `*Tabs.tsx`).

**Why:** Reviewer cognitive load. PR diffs become unreadable past 300 lines. A long file usually has multiple responsibilities mixed.

```
// Example split — HRCapitalTests.tsx (941 lines) → 5 files
HRCapitalTestsTypes.ts     // interfaces, constants
HRCapitalTestsHelpers.tsx  // small helpers
HRCapitalTestsTabs.tsx     // tab components
HRCapitalTestsDialogs.tsx  // dialog components
HRCapitalTests.tsx         // state + orchestration (193 lines)
```

**Reviewer:** `bash scripts/reviewer-file-size.sh`
**Current Status:** ✅ **PASS** — 0 violations

---

## Rule 17 — Function Size Limit (30 lines)

**Description:** Each function/method body must be ≤ 30 lines (excluding signature and closing brace). Larger bodies are extracted into helper functions.

**Why:** A function that does one thing fits on a screen. Length is a proxy for "too many responsibilities."

```typescript
// ❌ WRONG — 80-line function doing parsing + calc + DB write
async processOrder(input: unknown) {
  // 80 lines of mixed concerns
}

// ✅ CORRECT — three named helpers
async processOrder(input: unknown) {
  const dto = this.parseOrderInput(input);
  const totals = this.computeTotals(dto);
  return this.persistOrder(dto, totals);
}
```

**Reviewer:** `bash scripts/reviewer-function-size.sh`
**Current Status:** ✅ **PASS** — 0 violations

---

## Rule 18 — No `any` Type

**Description:** The `any` type is forbidden. Use `unknown` (then narrow), generics, or explicit types.

**Why:** `any` is a type-system bypass. Once it enters, type errors propagate silently across the call graph.

```typescript
// ❌ WRONG
function process(input: any) { return input.foo.bar; }

// ✅ CORRECT — narrow from unknown
function process(input: unknown) {
  if (typeof input === 'object' && input !== null && 'foo' in input) { /* ... */ }
}

// ✅ CORRECT — explicit type
function process<T extends { foo: { bar: string } }>(input: T) { return input.foo.bar; }
```

**Reviewer:** `bash scripts/reviewer-any-type.sh`
**Current Status:** ✅ **PASS** — 0 violations

---

## Rule 19 — Mutations Require AlertDialog

**Description:** Every delete, approve, reject, and cancel action in the React UI must be confirmed via an `<AlertDialog>`. `onClick` may not call `deleteMutation.mutate()` directly.

**Why:** One misclick should not destroy a record.

```tsx
// ❌ WRONG
<Button onClick={() => deleteMutation.mutate(test.id)}>O'chirish</Button>

// ✅ CORRECT
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button>O'chirish</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogTitle>O'chirishni tasdiqlang</AlertDialogTitle>
    <AlertDialogDescription>Bu amalni qaytarib bo'lmaydi.</AlertDialogDescription>
    <AlertDialogFooter>
      <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
      <AlertDialogAction onClick={() => deleteMutation.mutate(test.id)}>
        O'chirish
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

**Reviewer:** `bash scripts/reviewer-alert-dialog.sh`
**Current Status:** ✅ **PASS** — 0 violations

---

## Rule 20 — Frontend Forms Require Zod

**Description:** Every React form must validate via a Zod schema, normally via `useForm({ resolver: zodResolver(schema) })`. Submitting a form without validation is forbidden.

**Why:** Single source of truth between the browser, the API DTO, and the backend Zod schema.

```tsx
// ❌ WRONG
const form = useForm();
const onSubmit = (values) => mutate(values);

// ✅ CORRECT
const Schema = z.object({ name: z.string().min(1), amount: z.number().positive() });
const form = useForm({ resolver: zodResolver(Schema) });
```

**Reviewer:** `bash scripts/reviewer-form-validation.sh`
**Current Status:** ✅ **PASS** — 0 violations

---

## Rule 21 — API Calls via `apiRequest` Only

**Description:** All frontend API calls must go through the shared `apiRequest` helper (`@/lib/queryClient`). Direct `fetch()`, `axios`, or `XMLHttpRequest` calls are forbidden in `artifacts/erp-dashboard/src/`.

**Why:** `apiRequest` handles Bearer-header injection, 401 refresh, error unwrapping, and toast surfacing. Direct `fetch` bypasses all of that.

```typescript
// ❌ WRONG
const r = await fetch('/api/orders', { method: 'GET' });

// ✅ CORRECT
const orders = await apiRequest('GET', '/api/orders');
```

**Reviewer:** `bash scripts/reviewer-api-request.sh`
**Current Status:** ✅ **PASS** — 0 violations

---

## Rule 22 — Unit Tests Required

**Description:** Every service method must be covered by at least one unit test (Jest) in `apps/api/test/`. PRs that add a service without tests must not be merged. The reviewer accepts a matching spec by basename, by class-name mention anywhere under `test/`, or by domain-level coverage in a `*-exhaustive.spec.ts`.

**Why:** Coverage of business-critical logic is non-negotiable. Tests (run via Jest) document intent and catch regressions on every push.

```typescript
// ❌ WRONG: service merged without any test
@Injectable()
export class UntestedService {
  async compute(x: number) { /* ... */ }
}

// ✅ CORRECT: matching spec exists in apps/api/test/
describe('TestedService', () => {
  it('compute returns expected value', async () => {
    const r = await service.compute(5);
    expect(r).toBeDefined();
  });
});
```

**Reviewer:** `bash scripts/reviewer-unit-tests.sh`
**Current Status:** ✅ **PASS** — 0 violations

---

## Aggregate audit & merge gate

The full audit is produced by `bash scripts/run-all-reviewers.sh`. The script runs every reviewer above and prints a summary table. CI integration: the script exits with code 0 only if **every** rule passes.

The architecture-rules contract test (`apps/api/test/architecture/rules.spec.ts`) verifies that every rule has documentation in this file, an executable reviewer script, deterministic exit semantics, and wrong/correct example definitions.
