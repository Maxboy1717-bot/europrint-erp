# EuroPrint ERP — SQL Injection + Ma'lumot Sizishi Auditi
**Sana:** 2026-06-02  
**Metod:** Read-only white-box kod tahlili (exploit qilinmagan)  
**Manba:** `apps/api/src` to'liq skan (QADAM 1–6)

---

## SQL INJECTION

### Holat: XAVFSIZ (ma'lum istisnolar bilan)

**Parametrli template literals (xavfsiz) — keng ishlatilgan:**
Barcha operatsion so'rovlar Drizzle `sql\`...\${value}\`` parametrik shablonlari orqali
ishlaydi. Foydalanuvchi kiritgan qiymat hech qachon `sql.raw()` ga berilmaydi.

**`sql.raw()` ishlatilgan joylar (5 ta) — barchasi DDL-literal:**

| Fayl | Satr | Matn | Xavf |
|------|------|------|------|
| `shared/db/invariants.ts:38` | `sql.raw(literal DDL)` | Hard-coded DDL blok, note PA-S3 | ✅ Xavfsiz |
| `shared/db/invariants.ts:86` | `sql.raw(m.sql)` | `m` static array'dan (migrations-drift.ts), foydalanuvchi kirmaydi | ✅ Xavfsiz |
| `infrastructure/database/crm-migration.service.ts:92` | `sql.raw(ddl)` | Private helper'lardan, literal string | ✅ Xavfsiz |
| `infrastructure/database/sprint6-migration.service.ts:257` | `sql.raw(ddl)` | Private helper array, literal | ✅ Xavfsiz |
| `infrastructure/database/sprint2-migration.service.ts:185` | `sql.raw(table)+sql.raw(name)+sql.raw(definition)` | `SPRINT2_CONSTRAINT_DEFINITIONS` ReadonlyArray'dan, private metod | ⚠️ Potensial |

**Sprint2 tahlili (sprint2-migration.service.ts:185):**
```typescript
// Private metod, foydalanuvchi kirmaydi — lekin `table` va `name` runtime o'zgaruvchi
ALTER TABLE ${sql.raw(table)} ADD CONSTRAINT ${sql.raw(name)} ${sql.raw(definition)};
```
Bu metod `SPRINT2_CONSTRAINT_DEFINITIONS` statik massivdan keladigan qiymatlarni ishlatadi
(kod komentida tasdiqlangan: "no user input"). Ammo agar bu massiv kelajakda user-controlled
ma'lumot bilan to'ldirilsa, klassik SQL injection paydo bo'ladi.
**Xavf darajasi: LOW** (hozircha, statik massiv uchun).

**AVVALGI MUAMMO (tuzatilgan):**
`legacy.service.ts:27` da `sql.raw(rawQuery)` — foydalanuvchidan kelgan so'rov — bu
`2026-06-01 security-pentest` hisobotida tasdiqlangan va tuzatilgan. Joriy kod:
```typescript
// SECURITY: PA-S4a — historic sql.raw(rawQuery) pass-through has been refactored away.
```

**Xom SQL (db.execute + template) — xavfsiz pattern:**
`boomerang-hire.cron.ts`, `queries-technology.ts`, `queries-wms.ts`,
`badge-award.cron.ts`, `kanban-recurring.cron.ts` — barchasi `sql\`...\${value}\``
parametrik, ORM-compatible. Injection yo'q.

**Ma'lumotlar bazasi seed (master-data.seed.ts:47):**
```typescript
`SELECT code, COUNT(*)::text AS cnt FROM ${t.name} ...`
```
`t.name` seed script ichidagi hard-coded jadval nomlaridan keladi (foydalanuvchi kirmaydi).
Ammo agar seed qo'shimcha interfeys orqali chaqirilsa — xavf bor.
**Xavf darajasi: LOW** (seed faqat admin ishlatadi).

---

## MA'LUMOT SIZISHI (Error Leakage)

### Exception Filter tahlili (`global-exception.filter.ts`)

**Stack trace foydalanuvchiga qaytariladi:** ❌ YO'Q

Exception filter uch qatlamli himoya qiladi:

1. **`HttpException`** → faqat `message` qaytariladi (stack yo'q)
2. **`ZodError`** → faqat `"Validation error"` (tafsilot yo'q)
3. **`Error` (boshqa)** → `exception.message` qaytariladi

**Muhim nuance — 5xx GET xatolari:**
```typescript
// satr 84-90:
reply.status(HttpStatus.SERVICE_UNAVAILABLE).send({
  success: false,
  error: 'Server temporarily unavailable',
  code: 'SERVICE_UNAVAILABLE',
  debug: process.env['NODE_ENV'] !== 'production' ? message : undefined,  // ⚠️
  timestamp: new Date().toISOString(),
})
```
Development muhitida `debug` maydoni real xato matni chiqadi — bu normal va to'g'ri
(`NODE_ENV=development` da). Production da `undefined` = chiqmaydi. ✅

**Stack trace log:** `main.ts:164`:
```typescript
logger.error(err.stack ?? '(stack yo\'q)');
```
Bu faqat server logiga yoziladi, foydalanuvchiga chiqmaydi. ✅

**Xato tafsilotlari xavfi:**
`Error` subclasslari uchun `exception.message` qaytariladi. Drizzle/PostgreSQL xatolari
`message` da texnik ma'lumot (jadval nomi, ustun nomi) bo'lishi mumkin:
- `"column 'xyz' of relation 'employees' does not exist"` — DB sxema ma'lumoti sizishi
- `"duplicate key value violates unique constraint 'users_email_key'"` — jadval/ustun nomi
**Xavf darajasi: MEDIUM** — production da DB xato matnlari foydalanuvchiga ko'rinishi mumkin.

---

## HARDCODED MAXFIY MA'LUMOT

### `.env` fayl holati

`.gitignore` da to'g'ri yozilgan:
```
.env
.env.local
.env.*.local
.env.production
apps/api/.env
apps/api/.env.production
```
`.env` faqat diskda, git'da yo'q. ✅

**API key holati:**
Barcha API kalitlari `process.env` orqali (yoki `ConfigService.get`):
- `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `YANDEX_API_KEY` — env'dan
- `JWT_SECRET`, `JWT_REFRESH_SECRET` — env'dan
- `DATABASE_URL`, `REDIS_HOST` — env'dan

Hardcoded secret topilmadi. ✅

**Admin seed:** `admin.seed.ts:15-18`:
```typescript
const RAW_ADMIN_PASSWORD = process.env.ADMIN_SEED_PASSWORD;
if (!RAW_ADMIN_PASSWORD) {
  throw new Error('ADMIN_SEED_PASSWORD env required — set it in .env before seeding');
}
```
CLAUDE.md da eslatilgan `'Admin123!'` fallback — **HOZIR YO'Q**, tuzatilgan. ✅

**Swagger:** production da o'chirilgan (`if (process.env.NODE_ENV === 'production') return`). ✅

### Log'larda maxfiy ma'lumot

Telegram bot token yo'qligi WARN bilan loglanadi — lekin token qiymati chiqmaydi:
```typescript
this.logger.warn('HR Bot token not configured (TELEGRAM_HR_BOT_TOKEN missing)');
```
✅ Xavfsiz — token nomi emas, token qiymati loglanmaydi.

`push.service.ts:144,152` — maxsus izoh bilan token loglanmaydi. ✅

**process.env to'g'ridan ishlatilishi:**
`main.ts`, `main-bootstrap.ts`, `telegram/*.ts` da `process.env.X` to'g'ridan ishlatiladi
(CLAUDE.md Qoida 7 ga zid — `ConfigService` tavsiya etilgan).
**Xavf darajasi: LOW** (funksional muammo, xavfsizlik muammosi emas).

---

## PII (SHAXSIY MA'LUMOT) HIMOYASI

### Pasport/INN/Bank ma'lumotlari

**Mavjud ustunlar (migrations-drift.ts da):**
- `employees.passport_series`, `employees.passport_number`, `employees.passport_issue_date`
- `employees.bank_account_number`, `employees.bank_account_currency`
- `crm_companies.passport_number`
- `employee_bank_accounts` jadval (to'liq bank rekvizitlari)

**INN validator:** `uzbek-tin.validator.ts` — O'zbek STIR (9-raqamli) validatsiya. ✅

**Muammo:** Bu maydonlarni qaytaruvchi endpointlarda `@Exclude` dekoratori ishlatilmagan
(ClassSerializerInterceptor yo'q). PII ma'lumotlari response'da to'liq chiqishi mumkin.
**Xavf darajasi: MEDIUM**

### Salary (maosh) himoyasi

**`hr-payroll.controller.ts` — `@Roles` bilan himoyalangan:**
```typescript
@Roles('PAYROLL_OFFICER', 'HR_MANAGER', 'DIRECTOR', 'SUPER_ADMIN')  // satr 48
@Roles('PAYROLL_OFFICER', 'DIRECTOR', 'SUPER_ADMIN')                 // satr 63
@Roles('DIRECTOR', 'SUPER_ADMIN')                                     // satr 119
```
Oddiy `manager` roli ushbu endpointlarga kira olmaydi. ✅

**`employees-compat-sub.controller.ts` — salary-history:**
```typescript
@UseGuards(RolesGuard)
@Roles(...HR_ROLES)  // satr 42 — HR rollari bilan himoyalangan
```
✅ Himoyalangan.

**`general-legacy-b.controller.ts:90` — `salary-benchmark`:**
`@Get('finance/salary-benchmark')` — `@Roles` mavjudligi tekshirilmadi — bu pentest
hisobotida "privesc-minor" sifatida qayd etilgan. ⚠️

### `@Exclude` / Serializer holati

`ClassSerializerInterceptor` va `@Exclude` — **topilmadi**. Bu means:
- Entity/DTO obyektlarida `password_hash`, `bank_account_number`, `passport_number` kabi
  maydonlar borlarida, ular response'da chiqishi mumkin (agar mapper yo'q bo'lsa).
- Drizzle raw query natijalari to'liq qaytariladi.
**Xavf darajasi: MEDIUM**

---

## CORS + RATE LIMITING + UPLOAD

### CORS sozlamasi

`configureAppMiddleware` (`main-bootstrap.ts:179-189`):
```typescript
app.enableCors({
  origin: (origin, cb) => {
    if (!origin) { cb(null, true); return; }  // ⚠️ origin yo'q = ruxsat
    if (origins.includes(origin)) { cb(null, true); return; }
    if (isDev && isReplitOrigin(origin)) { cb(null, true); return; }
    cb(new Error(`CORS: origin '${origin}' ruxsat etilmagan`), false);
  },
  credentials: true,
  ...
})
```

**Muammo 1:** `if (!origin) { cb(null, true); return; }` — origin sarlavhasi yo'q bo'lganda
(server-to-server, curl, Postman) CORS o'tadi. Bu aslida standart xulq, lekin credentials
bilan birga va API authenticated bo'lganda — CSRF vektori bo'lishi mumkin. CSRF check esa
alohida `configureCsrfOriginCheck` da bor (origin-based). ✅ Kompensatsiya bor.

**Muammo 2:** `ALLOWED_ORIGINS` bo'sh bo'lsa (`.env` da o'rnatilmagan), faqat dev rejimida
Replit originlari ruxsat etiladi. Production da bo'sh = hech qanday origin qabul qilinmaydi
(yangi loyiha uchun xavfli konfiguratsiya xatosi ehtimoli).

**CSRF himoyasi:** `configureCsrfOriginCheck` — POST/PUT/PATCH/DELETE da Origin/Referer
tekshiriladi. Login endpointlari (`/api/auth/*`) istisno. ✅

### Rate Limiting / Throttler

**Global throttler (app.module.ts):**
```
default: 100 req/min
auth:    5 req/min
ai:      20 req/min
report:  10 req/min
export:  5 req/min
```
`FastifyThrottlerGuard` global o'rnatilgan. ✅

**Login rate limit (main-bootstrap.ts):** IP-based 5 urinish/60s. ✅

**Muammo:** OTP per-session attempt cap yo'q — faqat per-IP throttle. Pentest hisobotida ham
qayd etilgan (Medium xavf). ⚠️

### Fayl yuklash xavfsizligi

**Global limit (main.ts:79):**
```typescript
await app.register(require('@fastify/multipart'), { limits: { fileSize: MAX_FILE_SIZE, files: 1 } });
```
Fayl hajmi cheklangan. ✅

**Kanban file upload (`kanban-card-files.controller.ts:88-100`):**
```typescript
const mp = await (req as unknown as MultipartReq).file();
const buf      = await mp.toBuffer();
const fileName = mp.filename;
const mimeType = mp.mimetype;
// ...
const safeName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
fs.writeFileSync(path.join(uploadsDir, safeName), buf);
```

**MUAMMO 1 — MIME tip tekshirilmaydi:**
`mimeType` o'qiladi, lekin **hech qanday allowlist tekshiruvi yo'q**. Foydalanuvchi
`Content-Type: image/jpeg` deb e'lon qilib, ichida PHP/JS script yuborishi mumkin.
**Xavf darajasi: HIGH**

**MUAMMO 2 — Fayl kengaytmasi tekshirilmaydi:**
`fileName.replace(/[^a-zA-Z0-9._-]/g, '_')` — `.php`, `.js`, `.sh` kengaytmalar
ham o'tib ketadi. Agar web server bu papkani serve qilsa — Remote Code Execution (RCE)
xavfi bor.
**Xavf darajasi: HIGH** (agar `/uploads/kanban/` web orqali serve qilinsa)

**MUAMMO 3 — LMS knowledge-base.controller.ts:**
```typescript
async uploadFile(@Req() req: ...) {
  const mp = await req.file();
  // mimeType tekshiruvi topilmadi
```
Bir xil muammo — MIME va extension tekshiruvi yo'q.
**Xavf darajasi: HIGH**

**Ijobiy:** `storage.controller.ts` (pentest #2) — extension allowlist va path traversal
himoyasi qo'shilgan (2026-06-01 fix). ✅

---

## XAVFLI JOYLAR (Priority)

| # | Muammo | Fayl:satr | Xavf darajasi | Tavsiya |
|---|---|---|---|---|
| 1 | Kanban file upload — MIME/kengaytma tekshiruvi yo'q | `kanban-card-files.controller.ts:93,152` | 🔴 HIGH | MIME allowlist + kengaytma whitelist qo'shing; `.php/.js/.sh` blok qiling |
| 2 | LMS knowledge-base upload — MIME tekshiruvi yo'q | `knowledge-base.controller.ts:107` | 🔴 HIGH | Bir xil — storage.controller.ts fix patternini ko'chiring |
| 3 | DB xato matnlari response'da | `global-exception.filter.ts:51-53` | 🟠 MEDIUM | `Error` uchun `message` ni generic "Internal error" bilan almashtiring; stack/table nomi chiqmasin |
| 4 | OTP per-session attempt cap yo'q | `auth` modul, otp_sessions jadval | 🟠 MEDIUM | `attempts` ustun qo'shing; 5 noto'g'ri kiritish = session lock |
| 5 | PII maydonlari serializer chiqarmaydimi? | Barcha `employees`/`crm_companies` response | 🟠 MEDIUM | `@Exclude` yoki explicit DTO mapper bilan passport/bank ustunlarini qoldiring |
| 6 | `pip`/`enps`/`wake-config` — `@Roles` yo'q | `pip.controller.ts`, `enps.controller.ts`, `wake-config.controller.ts` | 🟡 LOW-MEDIUM | `@Roles('HR_MANAGER', 'SUPER_ADMIN')` qo'shing |
| 7 | `sprint2-migration.service.ts:185` — `sql.raw(table)` | `sprint2-migration.service.ts:185` | 🟡 LOW | Statik array uchun xavfsiz, lekin kelajakda Drizzle `identifier()` ga o'tkazing |
| 8 | `process.env` to'g'ridan (ConfigService o'rniga) | `main.ts`, `telegram/*.ts`, `main-bootstrap.ts` | 🟡 LOW | ConfigService.getOrThrow() ga o'tkazing (Qoida 7) |
| 9 | CORS — `!origin` = ruxsat | `main-bootstrap.ts:181` | 🟡 LOW | Server-to-server API uchun `credentials:false` yoki endpoint-level origin pin |

---

## UMUMIY BAHO

| Soha | Holat | Ball |
|------|-------|------|
| SQL Injection | ✅ Parametrik (legacy.service tuzatilgan) | 9/10 |
| Ma'lumot sizishi (stack trace) | ✅ Filter himoyalangan | 8/10 |
| Hardcoded secret | ✅ Yo'q (env to'g'ri) | 10/10 |
| .env git holati | ✅ .gitignore bor | 10/10 |
| Log'larda maxfiy | ✅ Token qiymati loglanmaydi | 9/10 |
| PII himoyasi | ⚠️ @Exclude yo'q | 5/10 |
| Salary ruxsati | ✅ @Roles himoyalangan | 9/10 |
| CORS | ✅ Allowlist (origin=null nuance) | 7/10 |
| Rate limiting | ✅ Throttler + login limit | 8/10 |
| File upload | ❌ MIME/ext tekshiruvi yo'q | 3/10 |

**Umumiy xavf darajasi:** MEDIUM (asosan file upload va PII serializer muammo)

---

## AVVALGI PENTEST BILAN SOLISHTIRISH

2026-06-01 pentest'dan bu yangi topilmalar:
- **Yangi:** `kanban-card-files.controller.ts` + `knowledge-base.controller.ts` — MIME/ext tekshiruvi yo'q (storage.controller.ts fix qilingan, boshqalar qolgan)
- **Yangi:** `global-exception.filter.ts` — DB xato matni `message` ga kirib chiqishi
- **Tasdiqlangan (hali ochiq):** OTP per-session cap, pip/enps @Roles, PII serializer
- **Yopilgan:** `legacy.service.ts sql.raw(rawQuery)`, storage.controller.ts @Public, admin.seed.ts fallback parol

*Hisobot: 2026-06-02 | Tahlilchi: Claude Sonnet 4.6 (READ-ONLY sessiya)*
