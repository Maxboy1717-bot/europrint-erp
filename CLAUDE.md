# EuroPrint ERP — Claude Code Uchun Loyiha Qo'llanmasi

> Bu fayl Claude Code terminaliga loyihaning arxitekturasi, qoidalari va hozirgi holati
> haqida to'liq ma'lumot beradi. Har bir vazifani boshlashdan oldin bu faylni o'qing.

> 🏛️ **AGENT KONSTITUTSIYASI — Har sessiyada majburiy o'qish:**
> [`docs/agent-constitution.md`](docs/agent-constitution.md) — Ish metodologiyasi,
> modul holatlari, katta vazifalar jarayoni (dizayn o'zgartirish, refactor), commit qoidalari,
> va governance. Bu faylni o'qimagan agent sessiya boshlamaydi.

> 📦 **MODUL REESTRI:**
> [`docs/modules/INDEX.md`](docs/modules/INDEX.md) — Qaysi modul BLESSED/INVENTORY/NOT_YET
> ekanini tekshiring. BLESSED modul fayllarini o'zgartirishdan oldin INDEX ni ko'ring.

> 🛡️ **Dedup / refactor / agent sessiyasidan oldin majburiy o'qish:**
> [`docs/dedup-safety-rules.md`](docs/dedup-safety-rules.md) — 15 ta xavfsizlik qoidasi
> (cyclic shim taqiq, tsconfig `dist/cjs/`, nest watch tree-kill bug, PWA SW NetworkOnly,
> agent overlap, smoke test, va boshqalar). 3 ta oltin qoida:
> 1. Har o'zgarishdan keyin backend boot tekshirish
> 2. `git commit` har bosqichda — `git stash` ishlatmaslik
> 3. Drizzle schema'larda cyclic shim YO'Q — faqat bir tomonli re-export

---

## Loyiha Haqida

**Nomi:** EuroPrint ERP  
**Stack:** NestJS (backend) + React + Vite (frontend) + Drizzle ORM + PostgreSQL  
**Monorepo:** pnpm workspaces

```
apps/api/src/          ← NestJS backend
artifacts/erp-dashboard/src/  ← React frontend
lib/db/src/schema/     ← Drizzle ORM sxemalar
scripts/               ← Audit va reviewer skriptlari
```

**Ishga tushirish:**
```bash
pnpm --filter @europrint/api run dev:unsafe   # backend
pnpm --filter erp-dashboard run dev           # frontend
bash scripts/run-all-reviewers.sh             # barcha tekshiruvlar
```

---

## MUHIM: Kodlash Uslubi

1. **Til:** Barcha yangi kod TypeScript (strict mode)
2. **Validatsiya:** Faqat **Zod** — `class-validator` EMAS
3. **DB:** Faqat **Drizzle ORM** — `raw SQL` faqat lateral join kabi murakkab holatlarda
4. **Xato boshqaruvi:** Faqat **Result pattern** — `throw new Error()` EMAS
5. **Fayl hajmi:** 900 qatordan oshmasin — oshsa bo'laklarga ajratiladi; har bir funksiya 150 qatordan oshmasin
6. **Konstantlar:** `apps/api/src/common/constants/business.constants.ts` faylidan ishlatilsin

---

## Qoida A — Xavfsizlik: Parol va Tokenlar (🔴 KRITIK)

**Qoida:** Hech qachon default parol, hardcoded credential yoki noto'g'ri JWT secret
ishlatilmaydi.

```typescript
// ❌ NOTO'G'RI — admin.seed.ts
const ADMIN_PASSWORD = process.env.ADMIN_SEED_PASSWORD ?? 'Admin123!';
// Env yo'q bo'lsa 'Admin123!' ishlatiladi — xavfli!

// ✅ TO'G'RI
const ADMIN_PASSWORD = process.env.ADMIN_SEED_PASSWORD;
if (!ADMIN_PASSWORD) throw new Error('ADMIN_SEED_PASSWORD env o\'rnatilmagan');

// ❌ NOTO'G'RI — admin-auth.controller.ts:33
this.jwtService.verify(body.refreshToken);  // access token secret ishlatadi!

// ✅ TO'G'RI
const refreshSecret = this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');
this.jwtService.verify(body.refreshToken, { secret: refreshSecret });

// ❌ NOTO'G'RI — migration ichida hardcoded hash
'$2b$10$xxxxx' AS password_hash  -- test123 paroli!

// ✅ TO'G'RI — migration faqat tuzilmani yaratadi, parol seed orqali
-- Migration faylida parol hash bo'lmasligi kerak
```

**Hozirgi holat:**
- `apps/api/src/database/seeds/admin.seed.ts:6` — `'Admin123!'` fallback — **TUZATILISHI KERAK**
- `apps/api/src/shared/db/migrations/org-structure-sync.sql:40` — `test123` hash — **TUZATILISHI KERAK**
- `apps/api/src/modules/legacy/controllers/admin-auth.controller.ts:33` — noto'g'ri secret — **TUZATILISHI KERAK**
- `apps/api/src/modules/auth/domain/value-objects/password.vo.ts:14` — bcrypt rounds 10 (admin 12 ishlatadi) — **TEKSHIRILSIN**

---

## Qoida B — SQL Injection Taqiqlangan (🔴 KRITIK)

**Qoida:** `sql.raw(variable)` HECH QACHON ishlatilmaydi. `sql.raw()` faqat literal
string bilan ruxsat etiladi.

```typescript
// ❌ NOTO'G'RI — SQL injection xavfi!
const rawQuery = req.body.query;
await db.execute(sql.raw(rawQuery));          // legacy.service.ts:27

// ❌ NOTO'G'RI — o'zgaruvchi string
await db.execute(sql.raw(q));                 // schema.ts:86,91

// ✅ TO'G'RI — parametrli so'rov
await db.execute(sql`SELECT * FROM users WHERE id = ${id}`);

// ✅ TO'G'RI — ORM
await db.select().from(users).where(eq(users.id, id));

// ⚠ MAQBUL — faqat DDL migration (literal string, o'zgaruvchi emas)
await db.execute(sql.raw(`CREATE INDEX IF NOT EXISTS ...`));
```

**Hozirgi holat:**
- `apps/api/src/modules/legacy/services/legacy.service.ts:27` — `sql.raw(rawQuery)` — **DARHOL TUZATILSIN**
- `apps/api/src/shared/db/schema.ts:86,91` — `sql.raw(q)` shared helper — **TUZATILSIN**
- `apps/api/src/shared/db/invariants.ts:1047` — `sql.raw(m.sql)` — **TUZATILSIN**

---

## Qoida 1 — Result Pattern (Backend) ♻️

**Qoida:** Barcha repository va service metodlari `Promise<Result<T>>` qaytarishi shart.
`return null`, `return undefined`, `throw new Error()` ishlatilmaydi.

```typescript
// ❌ NOTO'G'RI
async findUser(id: number) {
  const rows = await db.select().from(users).where(eq(users.id, id));
  if (!rows[0]) return null;
  return rows[0];
}

// ✅ TO'G'RI
async findUser(id: number): Promise<Result<User>> {
  try {
    const rows = await db.select().from(users).where(eq(users.id, id));
    if (!rows[0]) return err(AppErr('NOT_FOUND', 'User topilmadi'));
    return ok(rows[0]);
  } catch (e) {
    return err(AppErr('INTERNAL', String(e)));
  }
}

// ✅ TO'G'RI — controller ichida
const result = await this.repo.findUser(id);
if (!result.ok) throw new NotFoundException(result.error.message);
return result.data;
```

**Reviewer:** `bash scripts/reviewer-result-pattern.sh`  
**Hozirgi holat:** FAIL: 143 ta metod tuzatilishi kerak

---

## Qoida 2 — Array Xavfsizligi 🛡️

**Qoida:** `.map()`, `.filter()`, `.reduce()`, `.find()`, `.forEach()` ishlatishdan OLDIN
`Array.isArray()` tekshiruvi majburiy.

```typescript
// ❌ NOTO'G'RI — crash xavfi
const items = data.map(x => x.id);

// ✅ TO'G'RI
const rows = Array.isArray(data) ? data : [];
const items = rows.map(x => x.id);

// ✅ TO'G'RI — frontend (React)
const sessions = sessionsData?.data ?? [];
const filtered = Array.isArray(sessions) ? sessions.filter(s => s.status === 'active') : [];
```

**Reviewer:** `bash scripts/reviewer-array-safety.sh`  
**Hozirgi holat:** FAIL: 678 (backend: ~380, frontend: ~298)

---

## Qoida 3 — DTO Validatsiya (Zod) ✅

**Qoida:** `@Body()` qabul qiladigan har bir controller metodi Zod schema bilan validate
qilishi shart.

```typescript
// ❌ NOTO'G'RI
@Post()
async create(@Body() body: any) {
  return this.service.create(body);
}

// ✅ TO'G'RI
const CreateSchema = z.object({
  name:     z.string().min(1).max(200),
  quantity: z.number().int().positive(),
  price:    z.number().positive(),
});

@Post()
async create(@Body() body: unknown) {
  const dto = CreateSchema.parse(body);
  return this.service.create(dto);
}
```

**Hozirgi holat:** PASS — barcha formlar `zodResolver` ishlatadi

---

## Qoida 4 — Raw SQL Cheklangan 🔒

**Qoida:** Oddiy CRUD uchun Drizzle ORM ishlatiladi. Raw SQL faqat ORM bilan
ifodalab bo'lmaydigan murakkab so'rovlar uchun (izoh bilan).

```typescript
// ❌ NOTO'G'RI — oddiy select uchun
await db.execute(sql`SELECT * FROM employees WHERE id = ${id}`);

// ✅ TO'G'RI — ORM
await db.select().from(employees).where(eq(employees.id, id));

// ⚠ MAQBUL — murakkab, izoh bilan
// NOTE: Drizzle LATERAL JOIN qo'llab-quvvatlamaydi
await db.execute(sql`SELECT e.* FROM employees e LATERAL JOIN ...`);
```

**Hozirgi holat:** ~200+ raw SQL mavjud — asosan `compatibility/` va AI agent
servislarida. Yangi kod uchun ORM ishlatilsin.

---

## Qoida 5 — `as unknown` Stub Taqiqlangan 🚫

**Qoida:** `[] as unknown[]`, `{} as unknown`, `null as unknown` stub sifatida
ishlatilmaydi.

```typescript
// ❌ NOTO'G'RI — DB ga bormaydi, soxta ma'lumot
return { data: [] as unknown[], total: 0 };

// ✅ TO'G'RI — haqiqiy DB so'rov
const result = await this.repo.findAll(filters);
const data = result.ok && Array.isArray(result.data) ? result.data : [];
return { data, total: data.length };
```

**Reviewer:** `bash scripts/reviewer-as-unknown.sh`  
**Hozirgi holat:** FAIL: 3 (`gamification.controller.ts`, `crm-extended.service.ts` ×2)

---

## Qoida 6 — Controller Faqat Transport Qatlami 🚦

**Qoida:** Controller ichida biznes logika, hisob-kitob, `.map()`/`.filter()` zanjiri,
`Date` arifmetikasi bo'lmasligi kerak.

```typescript
// ❌ NOTO'G'RI — controller ichida ABC klassifikatsiya
@Get('abc-analysis')
async getAbc() {
  const rows = await this.db.execute(sql`...`);
  const total = rows.reduce((s, r) => s + r.value, 0);
  return rows.map(r => ({
    ...r,
    cumPercent: r.value / total * 100,
    class: r.cumPercent <= 80 ? 'A' : r.cumPercent <= 95 ? 'B' : 'C',
  }));
}

// ✅ TO'G'RI — controller delegate qiladi
@Get('abc-analysis')
async getAbc() {
  const result = await this.catalogService.getAbcAnalysis();
  return unwrapOrThrow(result);
}
```

**Eng yomon fayllar:**
- `wms-catalog.controller.ts` — 5 ta metod (ABC, aging, expiry, turnover, stock balance) to'liq servisga ko'chirilishi kerak
- `crm-ai-extended.controller.ts` — risk score hisob-kitobi servisga ko'chirilsin
- `hr-payroll.controller.ts` — INPS/JSHD hisoblash `PayrollService`ga ko'chirilsin
- `pp-intelligence.controller.ts` — MRP matrisi `PpIntelligenceService`ga ko'chirilsin
- `chat-advanced.controller.ts` — N+1 loop `ChatService.getBulkUnread()`ga ko'chirilsin

---

## Qoida 7 — Environment O'zgaruvchilari ⚙️

**Qoida:** `process.env.X` to'g'ridan ishlatilmaydi. Faqat `ConfigService` orqali.

```typescript
// ❌ NOTO'G'RI
const secret = process.env.JWT_SECRET;

// ✅ TO'G'RI
const secret = this.config.getOrThrow<string>('JWT_SECRET');
```

**Reviewer:** `bash scripts/reviewer-process-env.sh`  
**Hozirgi holat:** PASS

---

## Qoida 8 — Controller Guard Bilan Himoyalangan 🔐

**Qoida:** Har bir controller `@UseGuards(JwtAuthGuard)` yoki `@Public()` dekoratori
bilan belgilanishi shart.

```typescript
// ❌ NOTO'G'RI
@Controller('orders')
export class OrdersController {}

// ✅ TO'G'RI
@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {}
```

**Reviewer:** `bash scripts/reviewer-jwt-guard.sh`  
**Hozirgi holat:** PASS

---

## Qoida 9 — Non-null Assertion Taqiqlangan (`!`) ⚠️

**Qoida:** `obj!.prop`, `arr[0]!`, `.find()!` ishlatilmaydi. Optional chaining va
fallback ishlatiladi.

```typescript
// ❌ NOTO'G'RI
const cfg = typeConfig!;
const face = faces[0]!;
const item = list.find(x => x.id === id)!;

// ✅ TO'G'RI
if (!typeConfig) return;
const cfg = typeConfig;

const face = faces[0];
if (!face) return err(AppErr('NOT_FOUND', 'Face not found'));

const item = list.find(x => x.id === id) ?? defaultItem;
```

**Hozirgi holat:** 9 ta production faylda non-null assertion mavjud — tuzatilsin

---

## Qoida 10 — Soxta Javoblar Taqiqlangan 🚫

**Qoida:** `return { ok: true }`, `return {}`, `return []` — real ma'lumot o'rniga
soxta javob qaytarilmaydi. Hali tayyor bo'lmagan endpoint `HttpStatus.NOT_IMPLEMENTED`
qaytarishi kerak.

```typescript
// ❌ NOTO'G'RI — soxta muvaffaqiyat
@Post('send')
async send(@Body() body: unknown) {
  return { ok: true };   // hech narsa qilmaydi!
}

// ❌ NOTO'G'RI — bo'sh array
@Get('items')
async getItems() {
  return { data: [] };   // DB ga bormaydi
}

// ✅ TO'G'RI — hali tayyor bo'lmagan
@Get('items')
async getItems() {
  throw new HttpException('Tez orada amalga oshiriladi', HttpStatus.NOT_IMPLEMENTED);
}

// ✅ TO'G'RI — real ma'lumot
@Get('items')
async getItems(@Query() query: unknown) {
  const dto = ItemsQuerySchema.parse(query);
  const result = await this.service.findAll(dto);
  return unwrapOrThrow(result);
}
```

**Hozirgi holat:** ~50 ta soxta javob mavjud — birinchi navbatda tuzatilsin:
- `chat.controller.ts:307,315,369` — `return { ok: true }`
- `wms-integration.controller.ts:60,66,88` — `return { data: [] }`
- `sd-customers.controller.ts:111,152,184,204` — `return {}`

---

## Qoida 11 — 404 Xatoligi To'g'ri Qaytarilsin 🔍

**Qoida:** `@Get(':id')` yoki `@Param` ishlatadigan har bir metod natijani null
tekshirib, `NotFoundException` qaytarishi shart.

```typescript
// ❌ NOTO'G'RI — null tekshirilmaydi
@Get(':id')
async getOne(@Param('id') id: string) {
  return this.service.findById(+id);   // null qaytarsa ham 200 keladi
}

// ✅ TO'G'RI
@Get(':id')
async getOne(@Param('id') id: string) {
  const result = await this.service.findById(+id);
  if (!result.ok) throw new NotFoundException(result.error.message);
  return result.data;
}
```

**Hozirgi holat:** 8 ta controller `@Param` ishlatadi lekin null tekshirmaydi:
- `pp-intelligence.controller.ts:64`
- `mes-production-sessions.controller.ts:54`
- `wms-catalog.controller.ts:458`
- `adaptation.controller.ts` — stub ID qaytaradi
- `hr-dashboard.controller.ts` — stub ID qaytaradi

---

## Qoida 12 — Magic Number Taqiqlangan 🔢

**Qoida:** Biznes qoidalar uchun ishlatiladigan raqamlar `business.constants.ts`
faylida nom bilan saqlanadi.

```typescript
// ❌ NOTO'G'RI
const score = achievement * 0.5 + quality * 0.3 + oee * 0.2;
const isChurnRisk = daysSince > 180;
const netSalary = gross * (1 - 0.12);

// ✅ TO'G'RI — apps/api/src/common/constants/business.constants.ts
export const KPI_WEIGHT_ACHIEVEMENT = 0.5;
export const KPI_WEIGHT_QUALITY     = 0.3;
export const KPI_WEIGHT_OEE         = 0.2;
export const CHURN_HIGH_DAYS        = 180;
export const INCOME_TAX_RATE        = 0.12;

// Ishlatish
const score = achievement * KPI_WEIGHT_ACHIEVEMENT
            + quality     * KPI_WEIGHT_QUALITY
            + oee         * KPI_WEIGHT_OEE;
```

**Tuzatilishi kerak bo'lgan konstantalar:**

| Fayl | Qator | Raqam | Tavsiya |
|------|-------|-------|---------|
| `employee-kpi.handler.ts` | 94 | `0.5 + 0.3 + 0.2` | `KPI_WEIGHT_*` |
| `drizzle-sd-customers.repo.ts` | 151 | `0.35+0.25+0.20+0.15+0.05` | `ABC_SCORE_WEIGHT_*` |
| `strategic-agent.service.ts` | 50 | `0.7 / 1.3` | `FORECAST_PESSIMISTIC / OPTIMISTIC` |
| `depreciation.service.ts` | 36,41 | `/ 12` | `MONTHS_PER_YEAR` |
| `sd-quotations.service.ts` | 35 | `> 100 ? 0.1 : > 50 ? 0.05` | `BULK_DISCOUNT_*` |
| `lead-scoring-agent.service.ts` | 90 | `> 180 / > 90` | `CHURN_HIGH_DAYS / MED_DAYS` |
| `telegram-bots-cron-recruitment.service.ts` | 112 | `7*24*60*60*1000` | `SEVEN_DAYS_MS` |
| `sales.repository.ts` | 46 | `* 0.05` | `COMMISSION_RATE` |

---

## Qoida 13 — Fayl Hajmi 900 Qator, Funksiya 150 Qator ✂️

**Qoida (2026-05-28 yangilandi — 3 barobarga oshirildi):**
- Har bir fayl **900 qatordan** oshmasligi kerak (avval 300 edi). Oshsa bo'laklarga ajratiladi.
- Har bir funksiya/metod **150 qatordan** oshmasligi kerak (avval 50 edi). Oshsa kichikroq funksiyalarga bo'linadi.

Bo'lish konvensiyasi:
- `*Types.ts` — interfeys va konstantalar (JSX yo'q)
- `*Helpers.tsx` — kichik UI komponentlar
- `*Sections.tsx` — bo'lim komponentlar
- `*Dialogs.tsx` — dialog komponentlar (o'z state'i bilan)
- `*Tabs.tsx` — tab komponentlar

```
// Misol: HRCapitalTests.tsx (2700+ qator) → 5 fayl
HRCapitalTestsTypes.ts     ← interfeys, konstantalar
HRCapitalTestsHelpers.tsx  ← kichik helper komponentlar
HRCapitalTestsTabs.tsx     ← tab komponentlar
HRCapitalTestsDialogs.tsx  ← dialog komponentlar
HRCapitalTests.tsx         ← faqat state + orchestration (≤ 900 qator)
```

**Hozirgi holat — yangi 900-qator chegarasidan oshgan fayllar (backend):**

| Fayl | Qator | Amal |
|------|-------|------|
| `drizzle-kanban-ext.repo.ts` | 964 | 900+ — bo'linsin |

> Eslatma: 300–899 qatorli fayllar endi qoidaga muvofiq (oldin bo'lish kerak edi). Kelajakda 900+ va funksiyalar 150+ qator bo'lgan joylarni bo'lish kifoya.

---

## Qoida 14 — O'chirish Tasdiqi Majburiy 🗑️

**Qoida:** Har qanday o'chirish amali `ConfirmDialog` yoki `AlertDialog` orqali
tasdiqlanishi shart. `onClick` bevosita `deleteMutation.mutate()` chaqirmasligi kerak.

```tsx
// ❌ NOTO'G'RI — tasdiqlashsiz o'chirish
<Button onClick={() => deleteTestMutation.mutate(test.id)}>
  O'chirish
</Button>

// ✅ TO'G'RI — ConfirmDialog bilan
const [confirmId, setConfirmId] = useState<number | null>(null);

<Button onClick={() => setConfirmId(test.id)}>
  O'chirish
</Button>

<ConfirmDialog
  open={confirmId !== null}
  onOpenChange={open => { if (!open) setConfirmId(null); }}
  title="O'chirishni tasdiqlang"
  description="Bu amalni qaytarib bo'lmaydi."
  confirmText="O'chirish"
  variant="destructive"
  onConfirm={() => { if (confirmId) deleteTestMutation.mutate(confirmId); }}
/>
```

**Hozirgi holat — tuzatilishi kerak:**
- `src/pages/Tests.tsx:179` — dropdown o'chirish tasdiqlashsiz
- `src/pages/RoutingConfiguration.tsx:528` — operation o'chirish tasdiqlashsiz

---

## Qoida 15 — Direct `db.*` Service Ichida Taqiqlangan 🗄️

**Qoida:** Service fayllari `db.*` to'g'ridan chaqirmaydi. Faqat repository orqali.

```typescript
// ❌ NOTO'G'RI — service ichida to'g'ridan DB
@Injectable()
export class EmployeeService {
  constructor(private readonly db: DrizzleService) {}

  async findAll() {
    return this.db.select().from(employees);  // service DB ni to'g'ridan ko'radi
  }
}

// ✅ TO'G'RI — repository orqali
@Injectable()
export class EmployeeService {
  constructor(private readonly employeeRepo: IEmployeeRepository) {}

  async findAll() {
    return this.employeeRepo.findAll();
  }
}
```

**Hozirgi holat — tuzatilishi kerak:**
- `legacy.service.ts` — ~30 ta `db.execute` chaqiruvi
- `financial-reports-query.service.ts` — 9 ta to'g'ridan DB chaqiruvi
- `ai-alerts.service.ts` — 5 ta to'g'ridan DB chaqiruvi
- `employees-compat-profile.service.ts` — 12 ta to'g'ridan DB chaqiruvi

---

## Qoida 16 — `as unknown as T` O'rniga `typedExecute<T>` 🔷

**Qoida:** Raw SQL natijasini cast qilish uchun `typedExecute<T>` helper ishlatiladi.

```typescript
// ❌ NOTO'G'RI — manual cast
const r = await db.execute(sql`SELECT * FROM kpi WHERE ...`);
const rows = (r as unknown as { rows: KpiRow[] }).rows;

// ✅ TO'G'RI — typed helper
// apps/api/src/shared/db/typed-execute.ts mavjud
import { typedExecute } from '@shared/db/typed-execute';

const rows = await typedExecute<KpiRow>(sql`SELECT * FROM kpi WHERE ...`);
```

**Hozirgi holat:** `pos/repositories/` ichida 15+ cast mavjud —
`typedExecute<T>` helper allaqachon mavjud, ishlatilsin.

---

## Frontend Qoidalari

### F1 — Har bir `useQuery` uchun loading holati bo'lishi kerak

```tsx
// ❌ NOTO'G'RI
const { data } = useQuery({ queryKey: ['/api/orders'] });
return <Table data={data} />;   // data undefined bo'lishi mumkin

// ✅ TO'G'RI
const { data, isLoading } = useQuery({ queryKey: ['/api/orders'] });
if (isLoading) return <Skeleton className="h-64" />;
const orders = Array.isArray(data?.data) ? data.data : [];
return <Table data={orders} />;
```

### F2 — `useMutation` onError handler majburiy

```tsx
// ❌ NOTO'G'RI
const mutation = useMutation({
  mutationFn: (id) => apiRequest('DELETE', `/api/items/${id}`),
  onSuccess: () => queryClient.invalidateQueries(...),
});

// ✅ TO'G'RI
const mutation = useMutation({
  mutationFn: (id) => apiRequest('DELETE', `/api/items/${id}`),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['/api/items'] });
    toast({ title: "Muvaffaqiyatli o'chirildi" });
  },
  onError: () => toast({ title: "Xatolik", variant: "destructive" }),
});
```

### F3 — API chaqiruv imzosi to'g'ri bo'lishi kerak

```typescript
// ❌ NOTO'G'RI
apiRequest('/api/orders');         // method yo'q
apiRequest('/api/orders', {});     // URL birinchi arg sifatida

// ✅ TO'G'RI
apiRequest('GET', '/api/orders');
apiRequest('POST', '/api/orders', { quantity: 5 });
apiRequest('DELETE', `/api/orders/${id}`);
```

### F4 — Stub sahifalar hali mavjud (22 ta route)

Quyidagi routelar hali `StubPage.tsx` ko'rsatadi — real sahifaga almashtirilishi kerak:

```
/360, /ai, /ai-camera, /ai-exam, /ai/hr, /ai/marketing,
/ai-planning, /ai/wms, /assignments, /export, /gpt, /insights,
/integration/requests, /inventory/advanced, /iot-enhanced,
/micro-modules, /modules, /pos/mini-app, /pos/printer-config,
/sap, /video-progress
```

---

## Hozirgi Tekshiruv Holati

| Skript | Qoida | Holat |
|--------|-------|-------|
| `reviewer-array-safety.sh` | Array.isArray | **FAIL: 678** |
| `reviewer-result-pattern.sh` | Result\<T\> | **FAIL: 143** |
| `reviewer-as-unknown.sh` | as unknown stub | FAIL: 3 |
| `reviewer-dto-validation.sh` | Zod validation | ✅ PASS |
| `reviewer-process-env.sh` | ConfigService | ✅ PASS |
| `reviewer-jwt-guard.sh` | JWT Guard | ✅ PASS |
| `reviewer-wms-crud.sh` | CRUD to'liqligi | ✅ PASS |
| `reviewer-missing-endpoints.sh` | API endpoints | ✅ PASS |
| `reviewer-slice-safety.sh` | Redux slices | ✅ PASS |
| `reviewer-security.sh` | Xavfsizlik | ✅ PASS |

---

## Sessiya Tarixi

| Sana | Sessiya | Natija |
|------|---------|--------|
| 2026-05-22 | 20-agent 2-to'lqin duplikat tozalash va to'liq verifikatsiya | lib/db build PASS; BE tsc 0; FE tsc 0 (2 xato tuzatildi: api-state.tsx default param, AdvancedFiltersDialogs.tsx Course.id cast); Orphan §1=354, §2=427; shared/db pgTable=671; FE canonical types/constants/shared mavjud |

---

## Ustuvor Tuzatishlar (Tartibi Bilan)

### 🔴 DARHOL (Production uchun xavfli)

1. `admin.seed.ts:6` — `'Admin123!'` default parolni o'chiring
2. `org-structure-sync.sql:40` — `test123` bcrypt hashini migration'dan oling
3. `legacy.service.ts:27` — `sql.raw(rawQuery)` SQL injection — parametrli qiling
4. `schema.ts:86,91` — `sql.raw(q)` — parametrli qiling
5. `admin-auth.controller.ts:33` — `JWT_REFRESH_SECRET` ishlatsin

### 🟠 MUHIM (Funksional muammolar)

6. `wms-catalog.controller.ts` — 5 ta biznes logika metod `WmsCatalogService`ga ko'chiring
7. `chat.controller.ts:307,315,369` — `return { ok: true }` → real logika
8. `sd-customers.controller.ts` — 4 ta `return {}` → real logika
9. `Tests.tsx:179`, `RoutingConfiguration.tsx:528` — o'chirishga tasdiqlash qo'shing
10. `pos/repositories/*.ts` — 15+ cast `typedExecute<T>` bilan almashtiring

### 🟡 KEYINROQ (Kod sifati)

11. `FAIL: 143` — Result pattern (repository metodlar)
12. `FAIL: 678` — Array.isArray tekshiruvlari
13. Magic numberlar → `business.constants.ts`
14. 300+ qatorli fayllarni bo'laklash
15. 22 ta stub route → real sahifalar

---

## Ishga Tushirish

```bash
# Barcha tekshiruvlar
bash scripts/run-all-reviewers.sh

# Faqat eng muhim muammolar
bash scripts/src/problems-audit.sh

# Admin account lock bo'lsa
ADMIN_SEED_PASSWORD='EuroPrint2024!' pnpm --filter @europrint/api run seed

# Xavfsizlik tekshiruvi
bash scripts/src/pentest.sh

# Backend
pnpm --filter @europrint/api run dev:unsafe

# Frontend
pnpm --filter erp-dashboard run dev
```

---

### Qoida 17: No-Stub Policy — notImplemented() TAQIQLANGAN
❌ `return notImplemented('...')` → yangi kodda QOʻSHISH TAQIQLANGAN
✅ Haqiqiy Drizzle/SQL query yozing
✅ Agar DB schema tayyorlanmagan bo'lsa — EPComingSoon (FE) yoki `{ items: [], total: 0 }` (BE)
Pre-commit: `scripts/check-no-new-stubs.mjs` → commit block

### Qoida 18: FE-BE URL Shartnomasi
❌ `apiRequest("GET", "/api/X")` — BE da `/api/X` yo'q
✅ Endpoint mavjudligini tekshirib, keyin FE yozing
Pre-commit: `scripts/check-fe-api-urls.mjs` → WARNING (commit block emas)

### Qoida 19: Yangi Sahifa Minimumi — Faqat GET TAQIQLANGAN
❌ `pages/NewPage.tsx` — faqat `useQuery()`, `useMutation()` yo'q
✅ Kamida bitta CREATE / UPDATE / DELETE mutation bo'lishi kerak
✅ ISTISNO: `EPComingSoon` sahifasi (placeholder) — mutation kerak emas
Pre-commit: `scripts/check-page-has-crud.mjs` → WARNING

### Qoida 20: Route-Page Sinxronizatsiyasi
❌ Sidebar'ga URL qo'shish, lekin sahifa fayl yaratmaslik
✅ Fayl MAVJUD bo'lgandan KEYIN sidebar'ga qo'shing
✅ Agar sahifa hali tayyor emas — `EPComingSoon` wrapper yarating
Tekshirish: `scripts/check-sidebar-routes.mjs`

### Qoida 21: Dizayn-tizim — token + shablon majburiy (regress-himoya) 🎨
❌ Inline `style={{ color:'#fff' }}` / `style={{ background:'rgba(...)' }}` — xom rang TAQIQLANGAN
❌ Tailwind arbitrary hex `text-[#94a3b8]` — WARN (token bilan almashtiring)
✅ `var(--ep-*)` / `var(--mod-*)` token yoki semantic Tailwind class ishlating
✅ Yangi sahifa = mavjud shablon (ListPage / DetailPage / FormPage / DashboardPage / BoardPage) + PROPS — **yangi dizayn EMAS**
✅ Yagona manba — tokenlar: `artifacts/erp-dashboard/src/erp-modern-ui/*.css` · komponentlar: `src/components/ep/` + `src/components/ui/`
Pre-commit: `scripts/check-design-tokens.mjs` (diff-aware) — inline xom rang BLOK, Tailwind `[#hex]` WARN
Bypass (sabab bilan): `git commit --no-verify`

---

*Yangilangan: 2026-05-29 | Qoida 21 qo'shildi (dizayn-tizim regress-himoya). Qoidalar 17-20 (2026-05-28).*
