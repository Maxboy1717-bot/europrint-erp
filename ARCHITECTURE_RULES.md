# EuroPrint ERP — Arxitektura Qoidalari

> Bu hujjat majburiy qoidalarni belgilaydi. Har bir qoida tegishli reviewer skript bilan
> tekshiriladi. Merge oldidan `bash scripts/run-all-reviewers.sh` ishga tushirilishi shart.

---

## Qoida 1 — Result Pattern (Backend)

**Qoida:** Barcha repository va service metodlari `Promise<Result<T>>` qaytarishi shart.
`return null`, `return undefined`, `throw new Error()` ishlatilmaydi.

**Mantiq:** Caller har doim xato holati borligini tekshira olishi kerak. Exception = dastur
to'xtashi. `Result<T>` = nazorat ostidagi xato.

```typescript
// ❌ NOTO'G'RI — xatoni caller bila olmaydi
async findUser(id: number) {
  const user = await db.select().from(users).where(eq(users.id, id));
  if (!user[0]) return null;       // caller null tekshirmasligi mumkin
  return user[0];
}

// ✅ TO'G'RI — caller majburan tekshiradi
async findUser(id: number): Promise<Result<User>> {
  try {
    const rows = await db.select().from(users).where(eq(users.id, id));
    if (!rows[0]) return err(AppErr('NOT_FOUND', 'User not found'));
    return ok(rows[0]);
  } catch (e) {
    return err(AppErr('INTERNAL', String(e)));
  }
}

// ✅ TO'G'RI — callerda
const result = await this.repo.findUser(id);
if (!result.ok) throw new NotFoundException(result.error.message);
const user = result.data;   // type safe, null yo'q
```

**Reviewer:** `bash scripts/reviewer-result-pattern.sh`
**Hozirgi holat:** FAIL: 143 (143 ta repository metodi to'g'irlanishi kerak)

---

## Qoida 2 — Array Xavfsizligi

**Qoida:** `.map()`, `.filter()`, `.forEach()`, `.reduce()`, `.find()`, `.some()`, `.every()`,
`.flatMap()`, `.sort()` ishlatishdan OLDIN `Array.isArray()` tekshiruvi majburiy.

**Mantiq:** API har doim to'g'ri ma'lumot qaytarmaydi. Backend `null`, `undefined`, yoki
boshqa tur qaytarishi mumkin. Himoyasiz array operatsiya = runtime crash.

```typescript
// ❌ NOTO'G'RI — API null qaytarsa crash
const result = await this.repo.findAll();
return result.data.map(item => ({ id: item.id }));   // TypeError: null.map is not a function

// ✅ TO'G'RI — himoyalangan
const result = await this.repo.findAll();
if (!result.ok) return [];
const rows = Array.isArray(result.data) ? result.data : [];
return rows.map(item => ({ id: item.id }));

// ✅ TO'G'RI — utilita funksiya
function safeMap<T, R>(arr: unknown, fn: (x: T) => R): R[] {
  return Array.isArray(arr) ? (arr as T[]).map(fn) : [];
}
const items = safeMap(result.data, item => ({ id: item.id }));
```

**Reviewer:** `bash scripts/reviewer-array-safety.sh`
**Hozirgi holat:** FAIL: 678 (backend: ~380, frontend: ~298)

---

## Qoida 3 — DTO Validatsiya (Zod)

**Qoida:** `@Body()` qabul qiladigan har bir controller metodi Zod schema bilan validate
qilishi shart. Loyiha Zod ishlatadi — class-validator EMAS.

**Mantiq:** Validatsiyasiz input = xavfsizlik teshigi. Foydalanuvchi ixtiyoriy ma'lumot
yuborishi mumkin.

```typescript
// ❌ NOTO'G'RI — hech qanday validatsiya yo'q
@Post()
async create(@Body() body: any) {
  return this.service.create(body);   // body nima bo'lsa ham qabul qilinadi
}

// ✅ TO'G'RI — Zod bilan
import { z } from 'zod';

const CreateOrderSchema = z.object({
  quantity: z.number().int().positive('Miqdor musbat son bo\'lishi kerak'),
  price:    z.number().positive('Narx musbat bo\'lishi kerak'),
  product:  z.string().min(1).max(200),
});
type CreateOrderDto = z.infer<typeof CreateOrderSchema>;

@Post()
async create(@Body() body: unknown) {
  const dto = CreateOrderSchema.parse(body);   // noto'g'ri input → 400 avtomat
  return this.service.create(dto);
}
```

**Nima emas:** `class-validator` dekoratorlari (`@IsString`, `@IsNotEmpty`) loyihada
ishlatilmaydi. Eski 19 ta class-validator import Zod ga ko'chirilishi kerak.

**Reviewer:** `bash scripts/reviewer-dto-validation.sh`

---

## Qoida 4 — Raw SQL Taqiqlangan

**Qoida:** `db.execute(sql\`...\`)` faqat Drizzle ORM query builder bilan ifodalab
bo'lmaydigan murakkab so'rovlarda ruxsat etiladi. Oddiy CRUD uchun ORM ishlatiladi.

```typescript
// ❌ NOTO'G'RI — oddiy select uchun raw SQL
const rows = await db.execute(sql`SELECT * FROM users WHERE id = ${id}`);

// ✅ TO'G'RI — ORM
const rows = await db.select().from(users).where(eq(users.id, id));

// ⚠ MAQBUL — ORM bilan ifodalab bo'lmaydigan murakkab join (izoh bilan)
// NOTE: Drizzle lateral join qo'llab-quvvatlamaydi, raw SQL shart
const rows = await db.execute(sql`
  SELECT e.*, d.name as dept_name
  FROM employees e
  LATERAL JOIN departments d ON d.id = e.department_id
  WHERE e.status = 'active'
`);
```

**Hozirgi holat:** 7 ta (`finance-actions.repository.ts` ×3, `drizzle-hr-vacancies.repo.ts` ×3,
legacy ×1)

---

## Qoida 5 — `as unknown` Taqiqlangan (Stub Sifatida)

**Qoida:** `[] as unknown[]`, `null as unknown`, `{} as unknown` stub sifatida
ishlatilmaydi. Bu real ma'lumot o'rniga soxta tur beradi.

```typescript
// ❌ NOTO'G'RI — stub, DB ma'lumoti yo'q
return { history: [] as unknown[], total: 0 };

// ✅ TO'G'RI — haqiqiy tur va DB
interface HistoryItem { id: number; points: number; date: Date; }
const result = await this.repo.getHistory(userId);
const history = result.ok && Array.isArray(result.data) ? result.data as HistoryItem[] : [];
return { history, total: history.length };
```

**Istisnolar:** Type assertion uchun `as unknown as TargetType` (type cast, stub emas)
`hr-dashboard.repository.ts` kabi fayllar — bu type assertion, stub emas.

**Reviewer:** `bash scripts/reviewer-as-unknown.sh`
**Hozirgi holat:** FAIL: 3 (gamification.controller.ts, crm-extended.service.ts ×2)

---

## Qoida 6 — Controller Faqat Transport Qatlami

**Qoida:** Controller faqat: 1) validatsiya, 2) service chaqiruv, 3) javob formatlash.
Biznes logika (if/else zanjiri, hisob-kitob, DB so'rov) controller ichida bo'lmasligi kerak.

```typescript
// ❌ NOTO'G'RI — controller ichida biznes logika
@Get('salary')
async getSalary(@Param('id') id: string) {
  const emp = await this.db.select().from(employees).where(eq(employees.id, +id));
  if (!emp[0]) throw new NotFoundException();
  const base = emp[0].baseSalary;
  const bonus = base * 0.1;   // ← biznes logika controller ichida!
  const tax = (base + bonus) * 0.12;
  return { net: base + bonus - tax };
}

// ✅ TO'G'RI — controller faqat delegate qiladi
@Get('salary')
async getSalary(@Param('id') id: string) {
  const result = await this.payrollService.calculateSalary(+id);
  if (!result.ok) throw new NotFoundException(result.error.message);
  return result.data;
}
```

---

## Qoida 7 — Environment O'zgaruvchilari

**Qoida:** `process.env.X` to'g'ridan ishlatilmaydi. Faqat `ConfigService` orqali.

```typescript
// ❌ NOTO'G'RI
const secret = process.env.JWT_SECRET;

// ✅ TO'G'RI
constructor(private readonly config: ConfigService) {}

const secret = this.config.get<string>('JWT_SECRET');
if (!secret) throw new Error('JWT_SECRET muhit o\'zgaruvchisi o\'rnatilmagan');
```

**Reviewer:** `bash scripts/reviewer-process-env.sh`

---

## Qoida 8 — Barcha Controller Guard Bilan Himoyalangan

**Qoida:** Har bir controller `@UseGuards(JwtAuthGuard)` yoki `@Public()` dekoratori bilan
belgilanishi shart. Belgilanmagan endpoint = anonim foydalanuvchi kirishi mumkin.

```typescript
// ❌ NOTO'G'RI — himoyasiz
@Controller('employees')
export class EmployeesController { ... }

// ✅ TO'G'RI — guard bilan
@Controller('employees')
@UseGuards(JwtAuthGuard)
export class EmployeesController { ... }

// ✅ TO'G'RI — ochiq endpoint (alohida belgilanadi)
@Public()
@Get('health')
health() { return { status: 'ok' }; }
```

**Reviewer:** `bash scripts/reviewer-jwt-guard.sh`

---

## Qoida 9 — try/catch

**Qoida:** try/catch Result pattern bilan birgalikda **TALAB QILINADI**. try/catch ko'p
bo'lishi muammo emas — bu to'g'ri Result pattern belgidir.

```typescript
// ✅ TO'G'RI — try/catch Result bilan (majburiy)
async findAll(): Promise<Result<User[]>> {
  try {
    const rows = await db.select().from(users);
    return ok(rows);
  } catch (e) {            // ← bu TO'G'RI try/catch
    return err(AppErr('INTERNAL', String(e)));
  }
}
```

`master-data-audit.sh` 933 ta try/catch ni hisoblab, ogohlantiradi — bu FALSE POSITIVE.
Loyihada 933 ta try/catch = 933 ta to'g'ri Result wrapper.

---

## Tekshiruv Skriptlari

| Skript | Tekshiradigan qoida | Holat |
|--------|---------------------|-------|
| `scripts/reviewer-array-safety.sh` | Qoida 2 — Array.isArray | FAIL: 678 |
| `scripts/reviewer-result-pattern.sh` | Qoida 1 — Result<T> | FAIL: 143 |
| `scripts/reviewer-dto-validation.sh` | Qoida 3 — Zod validation | Tuzatildi |
| `scripts/reviewer-as-unknown.sh` | Qoida 5 — as unknown stub | FAIL: 3 |
| `scripts/reviewer-process-env.sh` | Qoida 7 — ConfigService | PASS |
| `scripts/reviewer-jwt-guard.sh` | Qoida 8 — Guard | PASS |
| `scripts/reviewer-wms-crud.sh` | Qoida 6 — CRUD to'liqligi | PASS |
| `scripts/reviewer-missing-endpoints.sh` | API endpoint to'liqligi | PASS |
| `scripts/reviewer-slice-safety.sh` | Redux slice xavfsizligi | PASS |
| `scripts/reviewer-security.sh` | Xavfsizlik tekshiruvi | PASS: 9, FAIL: 1* |

`*` reviewer-security FAIL: admin account lock edi — `pnpm seed` bilan tiklandi.

## Ishga tushirish

```bash
# Barcha reviewerlarni tekshirish
bash scripts/run-all-reviewers.sh

# Admin account lock bo'lsa
ADMIN_SEED_PASSWORD='EuroPrint2024!' pnpm --filter @europrint/api run seed

# Pentest
bash scripts/src/pentest.sh

# Barcha muammolar
bash scripts/src/problems-audit.sh
```
