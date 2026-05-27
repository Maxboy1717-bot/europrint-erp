# Audit: PROBLEMS — Barcha Topilmalar Ro'yxati

**Sana:** 2026-05-25  
**Auditor:** Claude (mustaqil tahlil, hech qanday mavjud audit MD fayli o'qilmadi)  
**Jami topilmalar:** P0: 6, P1: 11, P2: 8, P3: 5

---

## P0 — DARHOL TO'XTATISH KERAK (Production bloker)

---

### PROBLEM-001 — Anthropic API Kaliti Ochiq `.env`da (P0)

**Fayl:** `apps/api/.env` (root darajasida)  
**Turdagi xavf:** Credentials leak  
```
ANTHROPIC_API_KEY=***ANTHROPIC-KEY-REMOVED***...
```
**Ta'sir:** Agar bu fayl git'ga commit qilingan bo'lsa (hatto `.gitignore`da bo'lsa ham tarix orqali) yoki CI serveri orqali o'qilsa — haqiqiy Anthropic API kaliti oshkor. Har bir so'rov to'lanadi, kalitni o'g'irlagan odam barcha AI xizmatlardan foydalana oladi.  
**Tuzatish:** 1) Kalitni darhol `https://console.anthropic.com` da revoke qiling. 2) `.env` faylni `.gitignore`ga qo'shing. 3) Kalit Vault yoki environment inject orqali bering. Taxminiy vaqt: **30 daqiqa**.

---

### PROBLEM-002 — CRM Lead Yaratish DB Constraint Xatosi (P0)

**Fayl:** `apps/api/src/modules/crm/infrastructure/repositories/drizzle-crm-leads.repo.ts` (create metodi)  
**Turdagi xavf:** Runtime crash — har qanday lead yaratish 500 xato beradi  
```ts
// Repository INSERT qiladi, lekin crm_leads.title NOT NULL ustunini yozmaydi
await db.insert(crmLeads).values({
  contact_name: dto.contactName,  // Noto'g'ri ustun nomi (yangi schema: name)
  status: dto.status,             // Yangi schema: statusId
  // title — umuman yo'q, lekin NOT NULL constraint bor
});
```
**Ta'sir:** CRM moduli asosiy funksiyasi — lead yaratish — ishlamaydi. Kassir yoki menejer har safar 500 Internal Server Error oladi.  
**Tuzatish:** Repository'ni yangi schema bilan sinxronlashtirish: `name` → `dto.contactName`, `title` → `dto.companyName || dto.contactName`, `statusId` → `dto.stage`. Taxminiy vaqt: **2-4 soat**.

---

### PROBLEM-003 — Schema ↔ Repository Sinxron Emas (P0)

**Fayl:** `apps/api/src/modules/crm/infrastructure/repositories/drizzle-lead.repo.ts:93`  
**Turdagi xavf:** Runtime crash (ORM field nomi xatosi)  
```ts
// ORM camelCase ishlatadi, lekin kod snake_case yozgan
where(eq(leads.deleted_at, null))  // Xato: leads.deletedAt kerak
```
**Ta'sir:** Lead ro'yxati so'ralganda ORM runtime xatosi beradi. Kanban ko'rinmaydi.  
**Tuzatish:** Barcha `deleted_at` → `deletedAt`, `contact_name` → `name` kabi snake_case → camelCase o'zgartirish. Taxminiy vaqt: **2-3 soat**.

---

### PROBLEM-004 — Auth: `jti` Claim Yo'q → Logout Ishlamaydi (P0)

**Fayl:** `apps/api/src/modules/auth/application/services/login.service.ts:182`  
```ts
// JWT payload'da jti yo'q
const payload = { sub: user.id, email: user.email, role: user.role };
// jwt-auth.guard.ts:99 da blacklist tekshiruvi:
const isBlacklisted = await this.redis.get(`blacklist:${payload.jti}`);
// payload.jti = undefined → 'blacklist:undefined' tekshiriladi → hech qachon mos kelmaydi
```
**Ta'sir:** Logout qilgandan keyin access token muddati tugamaguncha (8 soat) ishlayveradi. Parol o'zgartirilganda yoki foydalanuvchi o'chirilganda tokenlar bekor bo'lmaydi.  
**Tuzatish:** `payload`ga `jti: randomUUID()` qo'shing, logout da `redis.set('blacklist:' + jti, '1', 'EX', ttl)` qiling. Taxminiy vaqt: **3-5 soat**.

---

### PROBLEM-005 — Auth: OTP Login Flow Stub (P0)

**Fayl:** `artifacts/erp-dashboard/src/components/auth/LoginForm.tsx:63`  
```ts
const handleEmployeeIdSubmit = async (e) => {
  e.preventDefault();
  // Server'ga hech narsa yuborilmaydi!
  navigate('/dashboard');  // To'g'ridan-to'g'ri redirect
};
```
**Ta'sir:** Employee ID + OTP orqali kirish flow'i — server tekshiruvisiz dashboardga o'tadi. Bu autentifikatsiyasiz kirish imkoniyati.  
**Tuzatish:** `POST /auth/employee-login` endpoint'iga ID va OTP yuborib, faqat muvaffaqiyatli javobda navigate qilish. Taxminiy vaqt: **4-6 soat**.

---

### PROBLEM-006 — `SodGuard` (Separation of Duties) Hech Qachon Ishlamaydi (P0)

**Fayl:** `apps/api/src/common/guards/sod.guard.ts:53`  
```ts
canActivate(context: ExecutionContext): boolean {
  const user = request.user;
  const violations = this.sodRules
    .filter(rule => /* permissions array tekshiradi */);
  // Muammo: JWT payload'da permissions[] yo'q
  // user.permissions = undefined → violations = [] → doim true
  return violations.length === 0;
}
```
**Ta'sir:** Moliyaviy operatsiyalarda Separation of Duties tamoyili buzilgan. Bitta foydalanuvchi ham hisob-faktura yaratib, ham tasdiqlashi mumkin.  
**Tuzatish:** Login service'da `permissions[]` ni JWT'ga qo'shish yoki Guard'da DB'dan real-time permission fetch qilish. Taxminiy vaqt: **1 kun**.

---

## P1 — MUHIM (1 hafta ichida tuzatilishi kerak)

---

### PROBLEM-007 — POS: Transaction Yo'q — Sotuv + Stock Decrement Ajralgan (P1)

**Fayl:** `apps/api/src/modules/pos/application/services/cash-register.service.ts:137-142`  
```ts
// Alohida INSERT va UPDATE — transaction yo'q
await this.cashRegisterRepo.insertTransaction(saleData);  // 1-query
await this.inventoryRepo.decrementStock(items);           // 2-query — agar bu tushsa...
// ...sotuv yozilgan, stok kamaymagan → inventory noto'g'ri
```
**Ta'sir:** Server yoki DB o'rtasida tushsa — sotuv "tugallangan" bo'lib qoladi, lekin ombor stoki kamaytirilmaydi. Bir necha kundan so'ng stok ma'lumotlari haqiqatga mos kelmaydi.  
**Tuzatish:** `db.transaction(async (trx) => { ... })` bilan ikkala operatsiyani o'rash. Taxminiy vaqt: **2-4 soat**.

---

### PROBLEM-008 — Auth: JWT va Cookie Muddati Mos Kelmaydi (P1)

**Fayl:** `apps/api/src/modules/auth/application/services/login.service.ts` va `auth.controller.ts`  
```ts
// login.service.ts: accessToken 8h
const accessToken = this.jwt.sign(payload, { expiresIn: '8h' });
// auth.controller.ts: cookie 24h
res.cookie('access_token', token, { maxAge: 24 * 60 * 60 * 1000 });

// refreshToken: service 30d, cookie 7d
```
**Ta'sir:** Cookie muddati uzunroq — token amal qilmasa ham cookie brauzerda qoladi. Foydalanuvchi "kirgan" ko'rinadi lekin so'rovlar 401 beradi — UX chalkashligi.  
**Tuzatish:** Cookie `maxAge` = JWT `expiresIn` ga teng qilish. Taxminiy vaqt: **1 soat**.

---

### PROBLEM-009 — CRM: CQRS Handler Bypass Qilingan (P1)

**Fayl:** `apps/api/src/modules/crm/presentation/crm-leads.controller.ts`  
```ts
// CreateLeadHandler yozilgan, lekin controller uni ishlatmaydi
@Post('quick')
async createQuickLead(@Body() dto) {
  return this.leadsService.create(dto);  // CommandBus yo'q, to'g'ridan service
}
// Natija: duplicate email tekshiruvi, domain event'lar, aggregate invariant'lar — barchasi o'chirilgan
```
**Ta'sir:** DDD arxitekturasining asosi — CQRS — amalda ishlamaydi. Domain logika bypass qilinadi.  
**Tuzatish:** `commandBus.execute(new CreateLeadCommand(dto))` ga o'tish. Taxminiy vaqt: **3-5 soat**.

---

### PROBLEM-010 — CRM Kanban Drag-Drop Silent Fail (P1)

**Fayl:** `apps/api/src/modules/crm/infrastructure/repositories/drizzle-crm-leads.repo.ts` (updateStage metodi)  
```ts
// Frontend PATCH /api/crm/leads/:id/stage yuboradi
// Repository noto'g'ri ustun nomini ishlatadi
await db.update(crmLeads).set({ status: stage })  // Noto'g'ri: statusId kerak
  .where(eq(crmLeads.id, id));
// Drizzle xato bermaydi (update 0 row), lekin response 200 qaytadi
```
**Ta'sir:** Kanban'da karta surish vizual ko'rinadi, lekin DB da stage o'zgarmaydi. Sahifani yangilaganda karta eski holatga qaytadi. Foydalanuvchi bilmaydi.  
**Tuzatish:** `status` → `statusId` to'g'rilash va `returning()` bilan 0 row holatini tekshirish. Taxminiy vaqt: **2 soat**.

---

### PROBLEM-011 — CRM Convert to Deal Ishlamaydi (P1)

**Fayl:** `apps/api/src/modules/crm/infrastructure/repositories/drizzle-lead.repo.ts:toDomain()`  
```ts
toDomain(row) {
  return Lead.reconstitute({
    contactName: row.contact_name,  // Yangi schemada: row.name
    status: row.status,             // Yangi schemada: row.statusId
  });
  // Natija: bo'sh/noto'g'ri Lead → "qualified" tekshiruvi fail → convert doim xato
}
```
**Ta'sir:** Lead → Deal konversiyasi (CRM'ning asosiy funksiyasi) ishlamaydi.  
**Tuzatish:** `toDomain()` metodini yangi schema ustun nomlariga moslashtirish. Taxminiy vaqt: **3-4 soat**.

---

### PROBLEM-012 — 42 ta Modul Test-siz (P1)

**Fayl:** `apps/api/src/modules/*/` (52 ta moduldan 42 tasida `.spec.ts` yo'q)  
```bash
# Spec fayli BILAN modullar: auth, crm, hr, pos, finance, pp, admin, ai, iot (10 ta)
# SPEC FAYLI YO'Q: aisha, wms, sd, mm, mro, lms, qc, director, ecommerce, ... (42 ta)
```
**Ta'sir:** Regression xavfi yuqori. Har qanday refaktoring yashirin xatolarni keltirib chiqarishi mumkin. CI gate'siz bo'lsa yanada xavfli.  
**Tuzatish:** Eng muhim 10 modul uchun integration test'lar qo'shish. Taxminiy vaqt: **2-3 hafta**.

---

### PROBLEM-013 — GitHub Actions CI/CD Yo'q (P1)

**Fayl:** `.github/workflows/` papka mavjud emas  
**Ta'sir:** Har `git push`da avtomatik test, lint, typecheck ishlamaydi. Broken kod main'ga tushishi mumkin.  
**Tuzatish:** Minimal pipeline: `pnpm install → tsc --noEmit → vitest → pnpm build`. Taxminiy vaqt: **1 kun**.

---

### PROBLEM-014 — Migration Uch Kanalga Bo'lingan (P1)

**Fayl:** `lib/db/drizzle/` (15 fayl), `apps/api/drizzle/` (17 fayl), qo'lda SQL fayllar (`drift-fix-*`)  
**Ta'sir:** Schema va ORM o'rtasida real farq bor — bu `drift-fix-*` fayllarning mavjudligi isboti. Yangi developer qaysi kanaldan foydalanishni bilmaydi.  
**Tuzatish:** Bitta kanalni standart qilish, qolganlarni arxivlash. Taxminiy vaqt: **2-3 kun**.

---

### PROBLEM-015 — `marketing` va `iot` Modullari Ko'p Stub (P1)

**Fayl:** `apps/api/src/modules/marketing/` (99 endpoint, 60 stub marker)  
**Fayl:** `apps/api/src/modules/iot/` (137 endpoint, 50 stub marker)  
**Ta'sir:** Bu modullar foydalanuvchiga "ishlayapti" deb ko'rinadi, lekin 60% operatsiyalar DB'ga hech narsa yozmaydi.  
**Tuzatish:** Stub endpoint'larni frontend'dan yashirish yoki real implementatsiyani qo'shish. Taxminiy vaqt: **2-4 hafta** (to'liq implementatsiya).

---

### PROBLEM-016 — `security` Moduli O'zi Stub (P1)

**Fayl:** `apps/api/src/modules/security/` (25 endpoint, 10 stub marker)  
**Ta'sir:** Xavfsizlik moduli o'zi 40% ishlamaydigan endpoint'lar bilan. Audit log, SIEM integratsiya — ko'rsatiladigan lekin yozilmaydigan.  
**Tuzatish:** Real implementatsiya yoki ochiqchasiga "Not Implemented" qaytarish. Taxminiy vaqt: **1-2 hafta**.

---

### PROBLEM-017 — IoT: 5 ta Public Endpoint — Device Auth Yo'q (P1)

**Fayl:** `apps/api/src/modules/iot/presentation/iot-tablet.controller.ts`  
```ts
@Public()
@Post('tablet/heartbeat')
// @Public() — hech qanday autentifikatsiya yo'q
// Har kim sanoat jihozidan "heartbeat" yuboraoladi
```
**Ta'sir:** Sanoat IoT qurilmalariga ulanadigan endpoint'lar ochiq. Yolg'on sensor ma'lumotlari yuborilishi mumkin.  
**Tuzatish:** API Key yoki Device Certificate autentifikatsiyasi qo'shish. Taxminiy vaqt: **1-2 kun**.

---

## P2 — MUHIM EMAS, LEKIN TUZATISH KERAK (1 oy ichida)

---

### PROBLEM-018 — POS Tax Hisob-Kitobi Noto'g'ri (P2)

**Fayl:** `apps/api/src/modules/pos/application/services/cash-register.service.ts` (tax calculation)  
**Ta'sir:** QQS inclusive formula ishlatilgan, lekin `totalAmount` taxsiz qaytariladi. Moliyaviy hisobotlar noto'g'ri.  
**Tuzatish:** Tax type (inclusive/exclusive) va hisobot formatini moliya bo'limi bilan kelishish. Taxminiy vaqt: **4 soat**.

---

### PROBLEM-019 — POS Offline Duplicate Xavfi (P2)

**Fayl:** `artifacts/erp-dashboard/src/lib/pos-sync.ts` va server schema  
**Ta'sir:** `offlineLocalId` server'da saqlanmaydi. Retry paytida bir sotuv ikki marta yozilishi mumkin.  
**Tuzatish:** Server schemaga `offline_local_id UNIQUE` qo'shish va upsert ishlatish. Taxminiy vaqt: **3-5 soat**.

---

### PROBLEM-020 — 10 ta Controller To'g'ridan DB ga Kiradi (P2)

**Fayl:** `apps/api/src/modules/hr/presentation/hr-employee-goals.controller.ts` (5+ raw SQL)  
```ts
// Controller ichida to'g'ridan raw query
const result = await db.execute(sql`SELECT * FROM employee_goals WHERE...`);
```
**Ta'sir:** DDD layering buzilgan — bu 10 ta controllerda domain logic va DB query aralashib ketgan.  
**Tuzatish:** Repository layer orqali o'tkazish. Taxminiy vaqt: **1-2 hafta**.

---

### PROBLEM-021 — 11 ta Moliyaviy Ustun Inconsistent Scale (P2)

**Fayl:** `lib/db/src/schema/` — turli schema fayllari  
**Ta'sir:** Kimdir `NUMERIC(18,4)`, kimdir `NUMERIC(18,2)`, kimdir `doublePrecision` ishlatgan — pul hisobotlarida yaxlitlash farqlari.  
**Tuzatish:** Barcha moliyaviy ustunlarni `numericMoney` helper orqali standartlashtirish. Taxminiy vaqt: **1 kun**.

---

### PROBLEM-022 — FK onDelete Ko'rsatilmagan (P2)

**Fayl:** `lib/db/src/schema/qc-schema.ts:155`  
```ts
paperOrderId: integer('paper_order_id').references(() => paperOrders.id)
// onDelete ko'rsatilmagan → PostgreSQL RESTRICT default
// Parent o'chirilganda child mavjud bo'lsa DB xatosi
```
**Ta'sir:** QC moduli bilan bog'liq paper order o'chirilganda kutilmagan constraint xatosi.  
**Tuzatish:** `onDelete: 'cascade'` yoki `'set null'` aniq ko'rsatish. Taxminiy vaqt: **1 soat**.

---

### PROBLEM-023 — `@Public()` Endpoint'lar Sanoqsiz Ko'p (P2)

**Fayl:** `apps/api/src/modules/**/*.controller.ts`  
```bash
# grep natijasi: 47 ta @Public() endpoint topildi
```
**Ta'sir:** Ba'zilari intentional (health, auth), lekin barchasi audit qilinmagan.  
**Tuzatish:** Har `@Public()` uchun comment qo'shish, noto'g'ri belgilanganlarni himoyalash. Taxminiy vaqt: **3-4 soat**.

---

### PROBLEM-024 — HR Employee Aggregate Qisman Anemic (P2)

**Fayl:** `apps/api/src/modules/hr/domain/aggregates/employee.aggregate.ts`  
**Ta'sir:** `status` maydoni bor, lekin `terminate()`, `goOnLeave()`, `promote()` metodlari yo'q. HR operatsiyalari aggregate bypass qilib service'da bajariladi.  
**Tuzatish:** Business metodlarini aggregate'ga ko'chirish. Taxminiy vaqt: **1-2 kun**.

---

### PROBLEM-025 — 23 ta Modul Flat (DDD Strukturasiz) (P2)

**Fayl:** `apps/api/src/modules/adaptation/`, `chat/`, `ecommerce/`, `feedback-360/` va boshqalar  
**Ta'sir:** Bu modullar arxitektura qoidalariga mos kelmaydi — domain/application/infrastructure bo'linishi yo'q.  
**Tuzatish:** Kelajakdagi refaktoring uchun backlog. Taxminiy vaqt: **2-4 hafta**.

---

## P3 — YAXSHILASH (Keyingi iteration)

---

### PROBLEM-026 — POS Analytics Endpoint'lar HTTP 501 (P3)

**Fayl:** `apps/api/src/modules/pos/presentation/pos-stub.controller.ts`  
**Ta'sir:** `GET /pos/sales/daily`, `GET /pos/inventory/low-stock` va boshqalar `paymentBreakdown`, `topProducts` bo'sh massiv qaytaradi.  

### PROBLEM-027 — CRM Lead Parallel Repository (P3)

**Fayl:** `drizzle-lead.repo.ts` va `drizzle-crm-leads.repo.ts` — ikkita parallel implementatsiya  
**Ta'sir:** Qaysi biri canonical — noaniq. Ikkalasi ham schema bilan mos emas.  

### PROBLEM-028 — 1311 Sahifadan Qanchasi Real Render Bo'ladi? (P3)

**Ta'sir:** 1311 `.tsx` sahifa topildi. Qanchasi router'da ro'yxatdan o'tgan, qanchasi reachable — aniqlanmadi.  

### PROBLEM-029 — PostgreSQL 15 vs 16 Versiya Kelishmovchiligi (P3)

**Fayl:** `docker-compose.yml` (postgres:15), `docker-compose.prod.yml` (postgres:16)  
**Ta'sir:** Dev va prod da turli behaviour — xususan JSON va text indexlash farqlari.  

### PROBLEM-030 — VO Coverage Yetarli Emas (P3)

**Ta'sir:** 45 aggregate uchun 20 VO. `pp`, `wms`, `mes`, `mro`, `qc` modullarida modul-spesifik VO'lar yo'q — primitive `number`/`string` ishlatilmoqda.
