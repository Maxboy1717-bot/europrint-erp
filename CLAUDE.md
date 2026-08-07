# EuroPrint ERP — Claude Code Uchun Loyiha Qo'llanmasi

> Bu fayl Claude Code terminaliga loyihaning arxitekturasi, qoidalari va hozirgi holati
> haqida to'liq ma'lumot beradi. Har bir vazifani boshlashdan oldin bu faylni o'qing.

> ⭐ **LOYIHA KONSTITUTSIYASI (yangi, kanonik):**
> [`LOYIHA_QOIDALARI.md`](LOYIHA_QOIDALARI.md) — 17 bo'lim: 23 arxitektura qoidasi, DB, DDD, Security, FE, Test, CI/CD + EuroPrint-maxsus qoidalar (C/E/F/H).
> [`DIZAYN_QOIDALARI.md`](DIZAYN_QOIDALARI.md) — EP Design System: tokenlar, EPPageHeader/EPKpiCard/EPCard/EPStatusPill, AppShell, modul ranglar.
> [`STANDARTLAR.md`](STANDARTLAR.md) — ⭐ AGENT QOʻLLANMASI: kanonik jadvallar (nima ishlat/ishlaTMA), jadval/ustun/API nomlash, DDD tuzilma, Drizzle/controller/service/repo/DTO shablonlar, duplikat tekshiruv skriptlari. **§15 = 72 ta tarixiy xato qoidasi.**
> [`EuroPrint_Master_Prompt.md`](EuroPrint_Master_Prompt.md) — ⭐ BAJARUVCHI (Muslimbek) har sessiyada o'qi: doimiy kontekst (A) + 22 faz prompti (B).
> [`docs/V2-REBUILD/Backend_Reja/00_Indeks.md`](docs/V2-REBUILD/Backend_Reja/00_Indeks.md) — 18 fazali backend reja (indeks, hamma faz tayyor).
> [`docs/adr/`](docs/adr/) — Arxitektura qarorlari (ADR-001..006): org_functions/sales_orders/entries/warehouse_stock/Result-T/technology_cards.
> [`FE_STANDARTLAR.md`](FE_STANDARTLAR.md) — ⭐ FRONTEND standartlari: useQuery/useMutation/forma/jadval/modal shablonlar (copy-paste tayyor), EP komponentlar, rang/token/AppShell qoidalari, pre-commit tekshiruv ro'yxati.
> [`BOSHLASH.md`](BOSHLASH.md) — Dev setup: clone, .env, Docker, migratsiya, seed, ishga tushirish, smoke test, umumiy muammolar va hal yo'llari.
> [`docs/LUGAT.md`](docs/LUGAT.md) — Domain lug'at: gofra/offset atamalar, kanonik jadval nomlari, ERP qisqartmalar, aralashtirilmasligi kerak terminlar.
> [`docs/GIT_QOIDALARI.md`](docs/GIT_QOIDALARI.md) — Git qoidalar: branch, commit format, `git add <aniq-fayl>` (HECH QACHON `-A`), migration commit, taqiqlangan amallar.
> [`docs/migration/seed/`](docs/migration/seed/) — Seed SQL (idempotent): roles, razryad 1-6, unit_of_measures, accounts (BHMS), defect_catalog (gofra/offset/silkscreen/flexi).
> [`docs/EVENT_KATALOGI.md`](docs/EVENT_KATALOGI.md) — ⭐ Domain events: 19 event (nom, payload schema, emitter, listener, holat: ✅/⚠️/🔲). Oltin zanjir SD→PP→MES→QC→WMS→FIN.
> [`docs/API_SHARTNOMA.md`](docs/API_SHARTNOMA.md) — FE↔BE kelishuv: success/error/pagination format, HTTP kodlar, ID=integer, sana=ISO8601, endpoint nomlash.
> [`docs/XATO_KODLARI.md`](docs/XATO_KODLARI.md) — Standart xato kodlari: HR_*/SD_*/PP_*/MES_*/QC_*/WMS_*/FIN_*/CRM_*/AUTH_*. Result<T> bilan birga ishlaydi.
> [`docs/DB_ERD.md`](docs/DB_ERD.md) — Jadvallar munosabati (matnli ERD): kanonik vs eskirgan jadvallar xaritasi, FK bog'lanishlar.
> [`docs/SPRINT_REJA.md`](docs/SPRINT_REJA.md) — Sprint 0-10 reja: tartib, bog'liqlik, tekshiruv mezonlari. Sprint 0 ✅ bajarildi.
> [`docs/migration/MIGRATION_TARTIB.md`](docs/migration/MIGRATION_TARTIB.md) — Migration tartib: poydevor→org→material→SD→PP→MES→QC→WMS→FIN.
> [`docs/V2_PAPKA_STRUKTURASI.md`](docs/V2_PAPKA_STRUKTURASI.md) — ⭐ V2 papka arxitekturasi: Strangler Fig pattern, `modules/` = V2 toza DDD, `_legacy/` = V1 o'chirilish kutmoqda, qaerda nima yoziladi jadvali.
> [`docs/PARAZIT_KOD_QOIDALARI.md`](docs/PARAZIT_KOD_QOIDALARI.md) — ⭐ Parazit kod qoidalari: 8 tur (soxta/o'lik/stub/echo/phantom/ghost/view-yozish), oldini olish P-1..P-5, o'chirish tartibi, V1 katalog (~130 parazit).
> [`docs/MASTER_DATA_STANDARTLARI.md`](docs/MASTER_DATA_STANDARTLARI.md) — Master data standartlari: jadval egalari, kim yarata/o'zgartira oladi, versiyalash (technology_cards), soft delete, biznes kalit, lookup=seed-only, material kod formati.
> [`docs/XAVFSIZLIK_STANDARTLARI.md`](docs/XAVFSIZLIK_STANDARTLARI.md) — ⭐ Xavfsizlik: 4 global guard qoidasi, rol matrisi, input validatsiya (whitelist=true), SQL injection (Drizzle), JWT (HS256+pin), RBAC, bcrypt×12, OWASP Top10 EuroPrint uchun.
> [`docs/TEST_STANDARTLARI.md`](docs/TEST_STANDARTLARI.md) — Test standartlari: real DB qoidasi (mock repo taqiq), unit/integration/e2e tuzilma, factory pattern, coverage maqsadlari (domain≥90%), Jest config, nima test qilinmaydi.
> [`docs/PERFORMANCE_STANDARTLARI.md`](docs/PERFORMANCE_STANDARTLARI.md) — Performance: N+1 taqiq (1 so'rov=1 SQL), pagination majburiy (max 100), index standartlari (FK+deleted_at+FTS), javob vaqti maqsadlari, EXPLAIN ANALYZE, katta jadval strategiyasi.
> [`docs/MODUL_SHARTNOMASI.md`](docs/MODUL_SHARTNOMASI.md) — Modul chegaralari: modul A → modul B faqat event orqali (servis import taqiq), jadval egasi xaritasi, outbox pattern, shared read qoidasi, NestJS import tuzilmasi.
> [`docs/MUHIT_STANDARTLARI.md`](docs/MUHIT_STANDARTLARI.md) — Muhit: port standartlari (3030/5173/5432), .env majburiy o'zgaruvchilar, Docker Compose, dev/test/prod farqlari, secret rotation, startup validatsiya, pre-deploy tekshiruv.
> [`docs/MONITORING_STANDARTLARI.md`](docs/MONITORING_STANDARTLARI.md) — Monitoring: log darajalari (error/warn/log/debug), nima loglanadi/loglanmaydi (JWT/parol taqiq), JSON strukturalangan log, GlobalExceptionFilter, health check format, performance monitoring.
> [`docs/XAVF_REESTRI.md`](docs/XAVF_REESTRI.md) — ⭐ Xavf reestri: 23 aniqlangan xavf (R-01..R-23) E×T=M ball bilan. Kritik (M≥15): ikki-dunyo, GL atomarligi, secret leak, event yo'qolishi, N+1. Har sprint yangilanadi.
> [`docs/KOCHIRISH_QOIDALARI.md`](docs/KOCHIRISH_QOIDALARI.md) — ⭐ V1→V2 ko'chirish: 6-bosqich (tahlil→domen→app→infra→presentation→cleanup), nima saqlash/qayta yozish, zero-downtime, rollback, modul tartib (auth→org→hr→mm→sd→...).
> [`docs/CODE_REVIEW_STANDARTLARI.md`](docs/CODE_REVIEW_STANDARTLARI.md) — Code review: commit format, PR shabloni, tekshiruv ro'yxati (SEC/DB/DDD/TEST/PERF/NAMING), bloker vs taklif, merge qoidalari, self-review.
> [`docs/DRIZZLE_STANDARTLARI.md`](docs/DRIZZLE_STANDARTLARI.md) — Drizzle ORM: schema definition pattern, SELECT/INSERT/UPDATE/softdelete, JOIN (N+1 yo'q), transaction, VIEW, migration workflow, kanonik jadval nomlari.
> [`docs/TEXNIK_QARZ.md`](docs/TEXNIK_QARZ.md) — Texnik qarz reestri: 18 qarz T-01..T-18 (P0/P1/P2/P3). P0: ikki-dunyo, outbox. P1: ghost endpoint, hardcoded matn, parazit ~130. Sprint bo'yicha to'lash rejasi.
> [`docs/SPRINT_DOD.md`](docs/SPRINT_DOD.md) — Sprint Definition of Done: global checklisti (tsc/test/golden-thread/sec), Sprint 0 to'liq ro'yxati ✅, Sprint 1-10 maxsus DoD, sign-off tartibi.
> [`docs/GOLDEN_THREAD_TEKSHIRUV.md`](docs/GOLDEN_THREAD_TEKSHIRUV.md) — Oltin zanjir tekshiruvi: SD→PP→MES→QC→WMS→FIN curl qadamlari, domain_events SQL, listener grep, sprint holati jadvali.
> [`docs/FUNDAMENT_STATUS.md`](docs/FUNDAMENT_STATUS.md) — ⭐ MASTER CHECKLISTI: 30 hujjat kategoriya bo'yicha (Arxitektura/Jarayon/Xavfsizlik/Ma'lumot/Xavf/Integratsiya/Muhit/Reja). Sprint 0 ✅ 100% tugadi. Sprint 1 tayyor.
> [`docs/V2_YOQILISH_REJASI.md`](docs/V2_YOQILISH_REJASI.md) — ⭐ V2 GA O'TISH REJASI: Strangler Fig, 10 sprint jadvali (Auth+Org→Material+SD→PP→MES→QC→WMS→FIN→CRM→AI+IoT→Test), har sprint foydalanuvchi ko'radigan yangiliklar, xavf/yechim jadvali, muvaffaqiyat mezonlari. "V2 ga qanday o'tamiz?" — aniq javob.
> [`docs/NOMLASHTIRISH_QOIDALARI.md`](docs/NOMLASHTIRISH_QOIDALARI.md) — Nomlashtirish standartlari: fayl (kebab-case), class (PascalCase), metod (camelCase), DB (snake_case), API route, event (modul.entity.amal), xato kodi (MODUL_TAVSIF), i18n kalit (modul.entity.kalit). Har kategoriya uchun ✅/❌ misollar.
> [`docs/CI_CD_STANDARTLARI.md`](docs/CI_CD_STANDARTLARI.md) — CI/CD: ci.yml bosqichlari, pre-commit hooklar ro'yxati, branch strategiyasi (chore/schema-convergence de-facto main), deployment tartibi (pull→install→build→migrate→restart), backup qoidasi, muhit tekshiruvi.
> [`docs/DEPENDENCY_STANDARTLARI.md`](docs/DEPENDENCY_STANDARTLARI.md) — Dependency boshqaruvi: 5-savol tekshiruvi (kerak/tavsiya/yangilanish/litsenziya/zaiflik), tasdiqlangan paketlar (NestJS/Drizzle/React/TanStack), taqiqlangan paketlar (moment/axios/sequelize/typeorm/redux/webpack), versiya strategiyasi (^/~/Exact), pnpm workspace qoidasi, audit (sprint boshida).
> [`docs/ROLLBACK_PLAYBOOK.md`](docs/ROLLBACK_PLAYBOOK.md) — Rollback: qaror daraxti (API tushdi/DB muammo/migration xato/V2 bug/secret leak/relay to'xtadi/FE ishlamaydi), har holat uchun aniq buyruqlar, < 5 daqiqada tiklash maqsadi, incident log shabloni.
> Test factory base (`apps/api/src/common/factories/`): har modul Drizzle sxemasi yaratilgandan keyin qo'shiladi (real DB, mock emas — Backend_Reja/14_Test.md §1 qoida).

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

**Hozirgi holat (2026-08-07 jonli tekshirildi — hammasi YOPILGAN):**
- `apps/api/src/database/seeds/admin.seed.ts` — ✅ fallback parol yo'q; PA-S1 izohi bilan env yo'q bo'lsa hard-fail. `BCRYPT_ROUNDS` endi `common/constants/security.constants` dan (runtime hasher bilan bir manba).
- `apps/api/src/shared/db/migrations/org-structure-sync.sql` — ✅ `test123` hash yo'q.
- `apps/api/src/modules/legacy/controllers/admin-auth.controller.ts` — ✅ fayl umuman yo'q (legacy controller o'chirilgan).

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

**Hozirgi holat (2026-08-07 jonli tekshirildi — hammasi YOPILGAN):**
- `apps/api/src/modules/legacy/services/legacy.service.ts` — ✅ `sql.raw` qolmagan.
- `apps/api/src/shared/db/schema.ts:114` — ✅ `sql.raw(q)` faqat `ddlRun()` ichida qoldi va `DDL_PREFIX_RE` runtime tekshiruvi bilan himoyalangan (PA-S4b): satr DDL kalit so'zi bilan boshlanmasa `throw` qiladi, ya'ni so'rov payload'idan kelgan bo'lak o'tolmaydi.

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
**Hozirgi holat:** ✅ FAIL: 0 (WARN: 6 — forecast/ai-data/finance-ai/pos-event/quarantine/warehouse-kpi repos)

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
**Hozirgi holat:** ✅ FAIL: 0 (PASS: 1172)

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
**Hozirgi holat (2026-08-07):** ✅ FAIL: 0 (WARN: 1). Avvalgi "FAIL: 3" eskirgan edi — `gamification.controller.ts` umuman yo'q, `crm-extended.service.ts` (endi `modules/compatibility/`) da bitta ham `as unknown` qolmagan.

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

**Hozirgi holat (2026-08-07 jonli tekshirildi — ro'yxatning katta qismi yopilgan):**
- `wms-catalog.controller.ts` — ✅ 0 ta `reduce(`/`.map(` qoldi (ABC/aging/expiry/turnover/stock-balance servisga ko'chirilgan)
- `pp-intelligence.controller.ts` — ✅ MRP matrisi ko'chirilgan (`this.svc.formatMrpResponse(...)`, izohda "Qoida 6 audit 2026-08-06 T22B"); faylda 1 ta `reduce(` qolgan — tekshirilsin
- `crm-ai-extended.controller.ts` — 1 ta `.map(` qolgan — tekshirilsin
- `hr-payroll.controller.ts`, `chat-advanced.controller.ts` — qayta tekshirilmagan

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

**Hozirgi holat (2026-08-07 jonli tekshirildi — "~50 ta" eskirgan):**
- `chat.controller.ts` — ✅ 0 ta `return { ok: true }`
- `wms-integration.controller.ts` — ✅ butun kod bazasida 0 ta `return { data: [] }`
- `sd-customers.controller.ts` — 4 ta `return {}` qolgan (270/328/380/413), LEKIN bular **soxta emas**: `svc.softDelete()` / `svc.deleteContact()` real ish bajaradi, faqat javob tanasi bo'sh (DELETE ack). Faylda buni tushuntiruvchi `LEGACY_NOOP` izohi bor.
- Butun `apps/api/src` bo'yicha 13 ta `return { ok: true }` qolgan (chat-uploads ×3, CC ×5, erp-documents ×2, erp-spreadsheets ×2, kanban ×1) — namunaviy tekshiruv hammasi **qonuniy ack** ekanini ko'rsatdi: avval `if (!result.ok) throw ...`, keyin ok qaytariladi. Bu Qoida 10 buzilishi EMAS.
- ⚠️ Qoida 10 ning haqiqiy nishoni — **hech narsa qilmasdan** ok qaytaruvchi endpoint. Yangi da'vo qo'shishdan oldin real ish bajarilishini tasdiqlang (Q-29).

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

**Hozirgi holat (2026-08-07 jonli tekshirildi):**
- `pp-intelligence.controller.ts`, `mes-production-sessions.controller.ts`, `wms-catalog.controller.ts` — ✅ hammasi `unwrapOrThrow(await ...)` ishlatadi, ya'ni Result xatosi HTTP xatosiga aylanadi. Eski satr raqamlari ham noto'g'ri (kod ko'chgan).
- `adaptation.controller.ts`, `hr-dashboard.controller.ts` — qayta tekshirilmagan.

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
| `shared/db/invariants/migrations-drift.ts` | 4555 | Migration-reestri (generatsiya qilingan DDL ro'yxati) — bo'lish qiymati past, lekin qoidadan ISTISNO deb hujjatlashtirilmagan |
| `shared/db/invariants/migrations-schema.ts` | 2292 | Yuqoridagi kabi |
| `modules/iot/presentation/iot-tablet.controller.ts` | 1219 | ⚠️ Haqiqiy nomzod — bo'linishi kerak |
| `modules/org-structure/card.repository.ts` | 1061 | ⚠️ Haqiqiy nomzod |
| `modules/hr/payroll/payroll.service.ts` | 1040 | ⚠️ Haqiqiy nomzod |
| `artifacts/erp-dashboard/src/pages/CashierHub.tsx` | 1125 | ⚠️ FE — yagona 900+ fayl |

> ⚠️ 2026-08-07 tuzatildi: bu jadval "900+ fayl qolmadi" deb yozilgan edi — bu XATO. `drizzle-kanban-ext.repo.ts` haqiqatan bo'lingan (156-qatorli facade + 8 sub-repo), lekin yuqoridagi 6 fayl chegaradan oshadi. Migration-reestrlarini istisno qilish kerak bo'lsa — bu egasi qarori, o'z-o'zicha "yo'q" deb yozilmaydi (Q-40).

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

**Hozirgi holat (2026-08-07 jonli tekshirildi):** `modules/pos/` bo'yicha **4 ta** `as unknown as` qolgan
("15+" eskirgan). `typedExecute<T>` helper mavjud — qolgan 4 tasi shunga o'tkazilsin.

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

### F4 — Stub sahifalar (ESKIRGAN, 2026-07-03 yangilandi — 3.13-stub-routes)

⚠️ Bu ro'yxat eskirgan edi (manba: `docs/audit/MASTER-REJA-VIZYON-2026-07-02.md:57`).
13 route allaqachon REAL sahifaga almashtirilgan (session 2026-05-12), 3 route
o'chirilgan (`/gpt`, `/inventory/advanced`, `/pos/mini-app` — 404, sidebar'da
yo'q edi), qolgan **5 tasi 2026-07-03 da StubRoutes.tsx'dan olib tashlandi**
(Q-46 — BE mavjud edi lekin funksiya boshqa jonli sahifada allaqachon bor edi,
alohida stub-route ortiqcha):

| Route | Qaror | Sabab |
|---|---|---|
| `/export` | O'CHIRILDI | BE (5 CSV/PDF endpoint) `RemainingTabsHr.tsx`da (HR analytics) allaqachon jonli |
| `/micro-modules` | O'CHIRILDI | BE (list/create/view) `/lms/micro-learning`da (sidebar+routed, `MicroLearningTab`) allaqachon jonli |
| `/modules` | O'CHIRILDI | BE (LMS module CRUD) `/courses/:id` ichida `AddModuleDialog` orqali allaqachon ishlatiladi; alohida global module-manager sahifa vizyonda yo'q |
| `/pos/printer-config` | O'CHIRILDI | BE bor, lekin `/warehouse/barcodes` ichidagi Printer Settings tab bilan funksional dublikat (u `/api/warehouse/printer-config` ishlatadi) |
| `/sap` | O'CHIRILDI | BE aslida `sales_orders` ustidan ichki shim (haqiqiy tashqi SAP integratsiya emas); funksiya `/erp/sales` (`SalesOrders.tsx`)da allaqachon bor; haqiqiy SAP integratsiya = egasi-qaror kutadi |

**Stub-route soni endi: 0.** (`ComingSoonPage.tsx` ham endi ishlatilmagani uchun o'chirildi.)

---

## Hozirgi Tekshiruv Holati

| Skript | Qoida | Holat |
|--------|-------|-------|
| `reviewer-array-safety.sh` | Array.isArray | ✅ PASS (0 FAIL, 1172 pass) |
| `reviewer-result-pattern.sh` | Result\<T\> | ✅ PASS (0 FAIL, 6 WARN) |
| `reviewer-as-unknown.sh` | as unknown stub | ✅ PASS (0 FAIL, 1 WARN) |
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

### ✅ 🔴 DARHOL — 2026-08-07 da BESHTASI HAM YOPILGAN (band-ma-band jonli tekshirildi)

Bu ro'yxat ~2 oy davomida yopilgan muammolarni "production uchun xavfli" deb ko'rsatib turdi. Har
bir bandni CLAUDE.md ning tegishli bo'limida dalil bilan hujjatlashtirdim:

1. ~~`admin.seed.ts:6` `'Admin123!'`~~ → ✅ fallback yo'q, env bo'lmasa hard-fail (PA-S1)
2. ~~`org-structure-sync.sql:40` `test123` hash~~ → ✅ faylda hash yo'q
3. ~~`legacy.service.ts:27` `sql.raw(rawQuery)`~~ → ✅ `sql.raw` qolmagan
4. ~~`schema.ts:86,91` `sql.raw(q)`~~ → ✅ `ddlRun()` ichida `DDL_PREFIX_RE` runtime darvozasi (PA-S4b)
5. ~~`admin-auth.controller.ts:33`~~ → ✅ fayl umuman yo'q

> ⚠️ Saboq (Q-29): bu jadval o'z-o'zidan yangilanmaydi. Da'voni **jonli kodda tekshirmasdan**
> ro'yxatga ishonmang — na "ochiq" deb, na "yopilgan" deb.

### 🟠 MUHIM — 2026-08-07 holati

| # | Eski da'vo | Tekshirilgan holat |
|---|---|---|
| 6 | `wms-catalog.controller.ts` 5 biznes-metod | ✅ ko'chirilgan (0 `reduce`/`.map`) |
| 7 | `chat.controller.ts:307,315,369` `{ ok: true }` | ✅ 0 ta qolgan |
| 8 | `sd-customers.controller.ts` 4 ta `return {}` | ⚠️ qolgan, lekin **soxta emas** — DELETE real ish bajaradi, javob tanasi bo'sh (Qoida 10 buzilishi emas) |
| 9 | `Tests.tsx:179`, `RoutingConfiguration.tsx:528` tasdiqsiz o'chirish | ⚠️ satr raqamlari eskirgan — qayta tekshirilsin |
| 10 | `pos/repositories/*.ts` 15+ cast | ⚠️ **4 ta** qolgan (15+ eskirgan) |

### ⚠️ 2026-08-07 da topilgan HAQIQIY ochiq muammolar

1. **900+ qatorli 6 fayl** — Qoida 13 jadvaliga qarang (jadval "qolmadi" deb yolg'on yozgan edi)
2. **`alert_thresholds` va `kanban_column_sla`** — jadvallar default qatorlar bilan mavjud, lekin
   **hech qanday kod ularni o'qimaydi**; `kanban_column_sla` uchun boot-guard ham yo'q
3. **`PosDepartmentGuard` / `PosWarehouseAccessGuard`** — to'liq yozilgan, lekin hech qaysi
   controllerda `@UseGuards()` bilan qo'llanilmagan → bo'lim/ombor izolyatsiyasi amalda ishlamaydi
4. **`business_settings.pos.norma_fakt_farqi_ortiqcha_sarf_94`** (id=50, 2026-07-11) — hech qaysi
   kod o'qimaydi, ~1 oydan beri egasi javobini kutmoqda
5. **`GET /coordination/baskets`** — orfan (FE-chaqiruv o'chirilgan, endpoint qolgan)

### 🟡 KEYINROQ (Kod sifati)

11. ✅ Result pattern — FAIL: 0 (WARN: 6 deferred — forecast/ai-data/finance-ai/pos-event/quarantine/warehouse-kpi)
12. ✅ Array.isArray — FAIL: 0 (PASS: 1172)
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

### Qoida 22: Ombor + POS Monitor sidebar kanonik (regress-himoya) 🧭
❌ Eski `/pos/*` sidebar klasteri (pos/dashboard, pos/stock, pos/movements, pos/requests, pos/barcode, pos/inventory-counts, pos/warehouse, pos/sync, pos/inventory, pos/mini-app) — POS Monitor'ni takrorlaydi
❌ 9 ombor-turi alohida sidebar yozuvi (warehouse/hub/RM-MAIN .. MRO-STORE) — Ombor Dashboard ichidagi filterni takrorlaydi
✅ POS = yagona `{ url: "pos-monitor" }` (zavod ombori tablet ilovasi; kassa → Finance)
✅ Ombor turlari = `warehouse/hub` (Ombor Dashboard) ichidagi Tabs filter; `/warehouse/hub/:code` route deep-link uchun saqlanadi
Pre-commit: `scripts/check-sidebar-regress.mjs` (diff-aware) — yangi `/pos/*` yoki `warehouse/hub/<CODE>` sidebar yozuvi BLOK
Bypass (sabab bilan): `git commit --no-verify`
Manba: memory `session_2026-05-21_full_cleanup.md` + `project_pos_monitor_purpose.md`

---

### Qoida 23: Parallel sessiya rollari — Tahlilchi 🔵 / Bajaruvchi 🟢 (nazorat) 🧭
**Kontekst:** 2026-06-02 da parallel sessiyalar bir-birini ko'rmay, tahlil hisobotidagi **tavsiyalarni** ruxsatsiz **bajargan** (legacy o'chirish `adcd527e`, Portret `2f353637`, employees.user_id) — egasi "faqat tahlil" deganda. Quyidagi rollar shuni oldini oladi.

Har sessiya promt boshida ROL oladi:
- 🔵 **Tahlilchi (QAT'IY read-only):** HECH NARSA o'zgartirmaydi — fayl/kod/DB/commit yo'q, faqat `docs/` ga hisobot. Ko'p parallel mayli. Oxirida `git status` da `docs/` dan boshqa narsa ko'rinsa = XATO.
- 🟢 **Bajaruvchi (ruxsat darvozasi):** faqat egasi AYNAN aytgan vazifa; o'zgartirishdan OLDIN reja + RUXSAT so'raydi; bir vaqtda FAQAT BITTA bajaruvchi.

❌ **Tavsiya ≠ ruxsat** — tahlil/audit hisobotidagi "o'chir/tuzat" tavsiyasini HECH KIM o'z-o'zicha bajarmaydi. Bajarish faqat egasi aniq "ha, bajar" deganda.
❌ `git add -A` / `git add .` TAQIQLANGAN — faqat aniq fayl (`git add <fayl>`); aks holda boshqa sessiya ishini supurib ketadi.
✅ To'liq copy-paste promt shablonlari: `docs/parallel-sessiya-nazorati.md`

---

## JARAYON VA BOSHQARUV QOIDALARI (Q-24..Q-45) 🧭

> Ish jarayoni/boshqaruv qoidalari (kod uslubi qoidalari A,B,1-23 yuqorida).
> Manba: 2026-06-02 bajaruvchi sessiyasi (parallel-sessiya nazorati + verify-don't-trust saboqlari).
> Avtomatlashtirilgan qoida yonida tekshiruv skripti ko'rsatilgan.

### 🅰️ Jarayon
- **Q-24 — Sessiya protokoli:** Har sessiya boshida `CLAUDE.md` o'qi + `git status`/`git log -5` + `git branch` + lokal health (:3030 backend / :20806 frontend) + concurrency (boshqa sessiya/worktree bormi) tekshir.
- **Q-25 — Bitta haqiqat manbai:** Vizyon master rejada (`docs/`). O'zgarish bo'lsa darrov yoziladi. Hujjat ziddiyatida master reja ustun.
- **Q-26 — Qaror jurnali:** Uzun sessiyaning muhim qarorlari (deferral, dizayn tanlovlari) `docs/`ga yoziladi.
- **Q-27 — Vizyon vs Ijro ajratish:** Advisor = vizyon (kod yo'q); Bajaruvchi = ijro (vizyon qarorini o'zi qabul qilmaydi). Har xabarda rol aniq.

### 🅱️ Ijro xavfsizligi
- **Q-28 — Ruxsat darvozasi:** O'zgarishdan OLDIN `fayl:satr` + aynan o'zgarish + sabab → RUXSAT so'ra. Egasi aniq "ha" demaguncha o'zgartirish YO'Q. (`scripts/check-large-diff.mjs` — katta diff WARN)
- **Q-29 — Verify-don't-trust:** Audit/katalog/advisor da'vosini tekshirilmagan deb hisobla. Kod + DB (`_audit/q.cjs` read-only) bilan JONLI tasdiqla. Yangi endpoint testsiz → WARN (`scripts/check-endpoint-test.mjs`).
- **Q-30 — Secret subagentga berilmaydi:** Subagentga secret topshirma; faqat shaklini (uzunlik/prefiks) tekshir; qiymat HECH QACHON chop etilmaydi. (`scripts/check-no-secret-print.mjs` — BLOK 🔴)
- **Q-31 — Subagent izolyatsiyasi:** Subagent faqat ALOHIDA faylda ishlaydi; bir faylga 2 ish → ketma-ket; subagent commit qilmaydi (bosh agent tekshirib commit qiladi).
- **Q-32 — Static fallback:** Lokal/auth qulasa → static verifikatsiya (typecheck + diff o'qish + pattern tasdiq + spec/DB-proof). Jonli isbot lokal tiklanganda.

### 🅲️ Sifat
- **Q-33 — Boshlangan ish to'liq:** Yarim qoldirilmaydi. "Keyin" qism `docs/`ga belgilanadi — tegilmaydi, o'chirilmaydi.
- **Q-34 — Chuqurlik bahosi:** Toza fix (jadval + ustun aniq, FE mos) → darrov qil. Dizayn/semantik qaror (jadval tanlash, model) → egasidan so'ra.
- **Q-35 — Jadval yaratish = egasi ruxsati:** Yangi migration/`CREATE TABLE` faqat egasi ruxsati bilan. Faylda `APPROVED:` izoh yo'q bo'lsa → WARN (`scripts/check-unauthorized-migration.mjs`).

### 🅳️ Yaxlitlik
- **Q-36 — Promt yaxlit:** Vazifa maydalanmaydi — yaxlit reja bilan olib boriladi.
- **Q-37 — Qoidalar bloki:** Har bajaruvchi promt boshida qoidalar bloki bo'ladi.
- **Q-38 — Holat hisoboti:** Har paket/bosqich oxirida holat hisoboti (done / defer / commit'lar) egaga ko'rsatiladi.

### 🅲️ Sifat (davomi)
- **Q-39 — Kod qotirish (regressiya taqiq):** O'chirilgan narsa QAYTA yaratilmaydi. Ishlayotgan funksiya egasi ruxsatisiz o'zgartirilmaydi. Regressiya TAQIQ — o'zgarishdan keyin avval ishlagan narsa hamon ishlashi shart (verify bilan tasdiqlanadi). *Manba: 2026-06-03 DARAJA 1 tomir-kesish (`docs/deleted-routes.md`).*
- **Q-40 — Ishlaydi ≠ to'g'ri:** Kod xatosiz ishlashi (200 qaytarishi) uning mazmunan TO'G'RI ekanini bildirmaydi. Logika/hisob-kitob/saqlash haqiqatda to'g'ri ekani tasdiqlanadi (DB-proof + FE-moslik + biznes-qoida). "Yashil lekin noto'g'ri" — fake-create, echo/hardcoded javob — TAQIQ. ⭐ TO'G'RI o'lchovi = master reja vizyoni (`docs/`): kod vizyonga zid ishlasa (ishlasa ham) = xato. Agent o'zi "to'g'ri" deb hal qilmaydi — egasi yoki vizyon belgilaydi.

### 🅴️ UI/UX izchillik va forma
- **Q-41 — Dizayn/UI izchillik:** Tugma joylashuvi STANDART — har sahifada bir xil joyda (saqlash o'ngda, bekor chapda — yoki egasi belgilagan standart); har xil layout TAQIQ. Dizayn token (Qoida 21) + UI shablon (`ListPage`/`FormPage`/`DetailPage`/`DashboardPage`) MAJBURIY. ⭐ Yangi sahifa = mavjud shablon + props (o'zboshimcha layout TAQIQ); tugma/forma joylashuvi shablondan keladi. Dizayn standartini egasi belgilaydi → hamma sahifa amal qiladi; o'zgartirish faqat egasi ruxsati bilan.
- **Q-42 — Tab ierarxiyasi:** ⭐ Tab ichida tab — MAKS 2 daraja (asosiy tab → ichki tab); 3+ daraja TAQIQ (chalkashtiradi). Tab tuzilmasi TEKIS yoki aniq 2 daraja; har modul tab tartibi master rejada (`docs/`) belgilanadi. Mavjud 3+ daraja "tab ichida tab" → tekislanadi (faqat egasi ruxsati bilan).
- **Q-43 — Forma saqlash majburiy:** ⭐ Har forma REAL saqlaydi: FE mutation (POST/PUT) → BE endpoint → real INSERT/UPDATE → DB. "Saqlash" tugmasi faqat local state o'zgartirsa yoki echo qaytarsa = XATO. Forma yaratilsa: BE endpoint + DB jadval + real saqlash + qayta yuklashda ko'rinish (F1/F2). ⭐ "Ko'rinadi lekin saqlamaydi" (fake-create) TAQIQ — Q-40 ning amaliy holati. Verify: kirit → saqla → sahifani qayta och → ko'rinadimi (real saqlangan). Skript: `scripts/check-form-has-save.mjs` (diff-aware, WARN) — forma bor lekin mutation yo'q → WARN; escape `// no-save-form`.

### 🅵️ Operatsion / muhit
- **Q-44 — Windows `nest watch` crash = muhit, kod emas:** Katta rebuilddan keyin backend :3030 tushishi mumkin (000) — Windows `nest watch` tree-kill bug (manba: `docs/dedup-safety-rules.md`). Bu KOD xatosi EMAS (typecheck + DB-proof PASS bo'lsa). **Belgi:** `/api/auth/health` ham 000 (butun server tushgan, bitta endpoint emas). **Chora:** dev-serverni qayta ishga tushir (`pnpm --filter @europrint/api run dev:unsafe`) — panik yo'q. **Verify (Q-32):** server tushganda → static fallback (typecheck + rollback-tx DB-proof) bilan fix tasdiqlanadi; jonli-HTTP isbot server qaytgach + login bilan.
- **Q-45 — Log fayllar HECH QACHON commit qilinmaydi (xavfsizlik) 🔴:** `backend.log*` va boshqa loglar JWT token / sezgir runtime ma'lumot saqlashi mumkin → `.gitignore`'da, HECH QACHON commit qilinmaydi. ⚠️ Nozik nuance: `*.log` rotated loglarni (`backend.log.prev3` — `.prev3` bilan tugaydi) **ushlamaydi** → `backend.log*` + `*.log.*` kerak. Agar log commit'ga tushib qolsa → darrov olib tashla (`git rm --cached`).

### 🅶️ Kod hayoti va direktiva (Q-46..Q-47) — egasi 2026-06-17
- **Q-46 — Ishlab turgan kod O'CHIRILMAYDI; to'g'ri ishlamaydigan kod TO'LIQ o'chiriladi ✂️🔴 (egasi qoidasi):** Bu Q-39 (kod-qotirish/regressiya) ning to'ldirmasi. ⭐ **Ikki tomonlama qoida:**
  - ✅ **Ishlab turgan (to'g'ri ishlaydigan) kod/funksiya/sahifa/element HECH QACHON o'chirilmaydi** — dizayn moslash, refactor, "tozalash" bahonasida ham YO'Q. Statistika kartasi, tugma, feature, ma'lumot maydoni — ishlayotgan bo'lsa, qoladi (recruiting 9→5 stat olib tashlash = BU QOIDA BUZILISHI edi). "Dizaynni moslash = faqat ko'rinish; mazmun/funksiya o'chmaydi."
  - ❌ **To'g'ri ISHLAMAYDIGAN kod — yarim-ishlaydigan, soxta (fake/echo/hardcoded), crash beradigan, o'lik (de-routed/orphan), dublikat — TO'LIQ o'chiriladi.** Buzuq kodni "saqlab qo'yish" yoki yarim holatda qoldirish TAQIQ — yo to'g'irlanadi, yo butunlay olib tashlanadi (chala qoldirilmaydi). O'chirishdan oldin: kod haqiqatan ishlamasligini tasdiqla (Q-29 verify) + boshqa joy import qilmasligini tekshir (Q-39 regress).
  - O'lchov: "ishlaydimi + to'g'rimi?" (Q-40). Ishlaydi+to'g'ri → saqlanadi. Ishlamaydi/noto'g'ri → to'liq o'chiriladi yoki to'g'irlanadi, chala emas.
- **Q-47 — Bajaruvchi direktivasi ≥1000 qator (egasi qoidasi) 📜:** Muslimbekka beriladigan har bir direktiva fayli **1000 qatordan kam bo'lmasin** — to'liq, batafsil, hech qanday noaniqlik qoldirmaydigan. Har faza/modul/fayl/pattern alohida yoziladi: aniq `fayl:satr`, oldin/keyin kod misollari, standart spetsifikatsiyasi (API, token ro'yxati), qabul-mezoni, edge-holatlar, self-verify qadamlari. ⚠️ To'ldiruvchi "filler" emas — haqiqiy batafsillik (massiv ish ko'lami buni oqlaydi). Kichik vazifa bo'lsa ham, direktiva to'liq kontekst + qoidalar bloki + har bosqich isboti bilan yoziladi.

---

## 🧩 Prompt naqshlari (EuroPrint ERP)

> Manba: Claude Code rasmiy prompt-kutubxonasi (code.claude.com/docs/en/prompt-library),
> loyihaga moslashtirilgan. Bu bo'lim yuqoridagi Q-qoidalardan (nazorat) ALOHIDA — maqsad
> tezlashtirish/osonlashtirish, nazorat emas.

### Foydali prompt naqshlari

**Modulni tushunish uchun** (ishga tushirishdan oldin doim foydali):
```
give me an overview of the {module} module: architecture, key files, and how it
connects to {other_module}
```
Masalan: `give me an overview of the POS/Kassir module: architecture, key files, and how it connects to the warehouse module`

**Xatti-harakat qayerda amalga oshishini topish:**
```
where do we {behavior}?
```
Masalan: `where do we calculate the sloy formula (m² to kg conversion)?`

**O'zgarish ko'lamini oldindan bilish:**
```
which files would I need to touch to {change}?
```

**Mavjud naqshga ergashib yangi narsa qurish:**
```
look at how {existing_module} is implemented, then build {new_module} the same way
```
Masalan: `look at how the production routing module is implemented, then build the org approval-chain module the same way`

**Kichik, aniq funksiya qo'shish:**
```
add a {endpoint} endpoint that returns {payload}
```

**Testlar bilan implementatsiya (test-driven):**
```
write tests for {feature} first, then implement it until they pass
```

**Commit qilishdan oldin o'z-o'zini tekshirish:**
```
review your uncommitted changes and flag anything that looks risky before committing
```

**Xatoni ildizidan tuzatish:**
```
here is the error/log: @{log_file}. find the root cause and verify the fix, don't
just patch the symptom
```

**Subagent bilan xavfsizlik tekshiruvi** (asosiy sessiyani to'ldirmasdan):
```
use a subagent to review {path} for security issues and report what it finds
```

**Tuzatishni qoidaga aylantirish** (agent bir xil xatoni takrorlasa):
```
you keep {mistake}. add a rule to CLAUDE.md so this stops happening
```

**Sessiya oxirida bilim to'plash:**
```
summarize what we did this session and suggest what to add to CLAUDE.md
```

### Promptlarni yozishda 6 tamoyil

1. **Qadamlarni emas, natijani tasvirlang** — Claude fayllarni o'zi topsin.
2. **O'z ishini tekshirish usulini bering** — "ishga tushir", "sina", "solishtir", "tasdiqla" so'zlarini qo'shing, shunda bir urinishdan keyin ham davom etadi.
3. **Ma'lumotnomaga ishora qiling** — mos kelishi kerak bo'lgan mavjud fayl/naqshni nomlang (masalan: "production routing modulidagi kabi").
4. **O'lchanadigan maqsad bering** — samaradorlik/qamrov bo'lsa, aniq metrika va chegara ayting.
5. **Artefaktni bering** — xato, log, skrinshot, plan natijasini to'g'ridan-to'g'ri promptga joylashtiring yoki `@fayl` bilan ishora qiling.
6. **Javob formatini ayting** — uzunlik, format, auditoriyani nomlang.

### Naqsh → skill/hook aylantirish

Bir prompt loyihada bir necha marta ishlatilsa:
```
create a /{name} skill for this project that {steps}
```
yoki takrorlanuvchi avtomatik xatti-harakat uchun:
```
write a hook that {action} after every {event}
```
Bu keyingi agent sessiyalari uchun `/buyruq` sifatida qayta ishlatiladigan qiladi — har safar qayta yozish shart emas.

---

*Yangilangan: 2026-07-03 (Prompt naqshlari bo'limi qo'shildi — Claude Code rasmiy prompt-kutubxonasidan moslashtirilgan, nazorat-qoidalardan alohida). 2026-06-17 (Q-46 ishlab-turgan-kod-o'chmaydi/buzuq-kod-to'liq-o'chiriladi [egasi]; Q-47 direktiva ≥1000 qator [egasi]). 2026-06-03 | Q-44..Q-45 qo'shildi (Q-44 Windows nest-watch crash = muhit, kod emas; Q-45 log fayllar hech qachon commit qilinmaydi — JWT token xavfi, `*.log` rotated loglarni ushlamaydi → `backend.log*`+`*.log.*`). Q-39..Q-43 (kod-qotirish, ishlaydi≠to'g'ri+master-reja, dizayn izchillik, tab ≤2 daraja, forma saqlash + `check-form-has-save`). Q-24..Q-38 (jarayon/boshqaruv). Qoida 23 (parallel sessiya rollari). Qoida 22 (Ombor+POS sidebar). Qoidalar 17-21.*
