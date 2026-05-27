# Audit: 05 — Xavfsizlik

**Sana:** 2026-05-25

---

## JWT Token Saqlash

**Holat: YAXSHI — httpOnly cookie yondashuvi qabul qilingan**

Avvalgi `localStorage` yondashuvi olib tashlangan va hozir tozalash kodi bor:

**Fayl:** `artifacts/erp-dashboard/src/hooks/useAuth.tsx:133-142`
```ts
// We also purge any legacy tokens that might still be in localStorage
localStorage.removeItem("access_token");
localStorage.removeItem("refresh_token");
localStorage.removeItem("token");
```

**Fayl:** `artifacts/erp-dashboard/src/lib/auth-refresh.ts:89-91`  
Login paytida `localStorage`'ga yozish to'xtatilgan, faqat o'chirish qolgan.

**Fayl:** `apps/api/src/modules/auth/presentation/auth.controller.ts:34-37`  
Access token: 24 soatlik `httpOnly` cookie (`access_token`).  
Refresh token: 7 kunlik `httpOnly` cookie (`refresh_token`), faqat `/api/auth` yo'liga cheklangan.

**Fayl:** `apps/api/src/common/guards/jwt-auth.guard.ts:21-49`  
Guard birinchi navbatda `httpOnly` cookie'dan token oladi, agar yo'q bo'lsa `Authorization: Bearer` sarlavhasiga qaraydi — mobil/API klientlar uchun qulaylik.

**Xulosa:** XSS xavfi yo'q — tokenlar JavaScript tomonidan o'qib bo'lmaydi.

---

## SQL Injection

**Holat: QONIQARLI — barcha `sql.raw` ishlatishlari whitelistdan**

### `sql.raw` ishlatilgan joylar:

**1. DDL Migrations (xavfsiz)**  
**Fayl:** `apps/api/src/common/database/ddl-migrations.ts:27,41,43,150,157,206,223,241`  
Faqat literal DDL satrlari — foydalanuvchi inputi yo'q.

**2. Admin repo (xavfsiz)**  
**Fayl:** `apps/api/src/modules/admin/infrastructure/repositories/admin-extra.repo.ts:122`  
Izoh: "fully literal SELECT string (no interpolation)... no user input."

**3. Aisha AI Tools (xavfsiz — whitelist bilan)**  
**Fayl:** `apps/api/src/modules/aisha/application/tools/compare-periods.tool.ts:70-78`  
`meta.table` va `meta.column` faqat `ALLOWED` statik dict'dan keladi:
- `sales_orders/production_orders/qc_inspections` (table)
- `total/qty_produced/id` (column)
Foydalanuvchi metric kiritsa — `if (!meta) return Err(...)` bilan bloklanadi.

**Fayl:** `apps/api/src/modules/aisha/application/tools/generate-kpi-report.tool.ts:58`  
`where` o'zgaruvchisi faqat `periodWhere()` private helper'dan keladi, u faqat `today|week|month` qaytaradi — foydalanuvchi SQL kirita olmaydi.

**4. Sprint2 Migration (xavfsiz — private, static)**  
**Fayl:** `apps/api/src/infrastructure/database/sprint2-migration.service.ts:185`  
```ts
ALTER TABLE ${sql.raw(table)} ADD CONSTRAINT ${sql.raw(name)} ${sql.raw(definition)};
```
`table`, `name`, `definition` — `SPRINT2_CONSTRAINT_DEFINITIONS` statik massivdan; `private` metod, hech qanday public caller yo'q, foydalanuvchi inputi yo'q.

**Xulosa:** SQL injection xavfi topilmadi. Barcha `sql.raw` ishlatishlari izohlanган va statik ma'lumotlarga bog'liq.

---

## Rate Limiting

**Holat: YAXSHI — multi-profile throttler mavjud**

**Fayl:** `apps/api/src/app.module.ts:11-12`  
`@nestjs/throttler` `ThrottlerModule` sifatida ro'yxatdan o'tkazilgan.

**Fayl:** `apps/api/src/common/decorators/throttle-profiles.ts`  
Named profile dekoratorlari mavjud:
- **Auth profili:** Credential stuffing va enumeration'ga qarshi qattiq cheklov.
- **AI profili:** `20 req/min` — LLM endpoint'lar uchun.
- **Default:** Umumiy endpoint'lar uchun.

**Fayl:** `apps/api/src/common/guards/fastify-throttler.guard.ts:27-30`  
Auth endpoint'lari faqat `auth` throttler bilan tekshiriladi, boshqa endpoint'lar `default` bilan — to'g'ri ajratilgan.

**Tekshirilmagan:** Har bir profil uchun aniq `ttl` va `limit` qiymatlari. Agar `default` profil chegarasi juda yuqori bo'lsa — brute force xavfi bor.

---

## CSRF

**Holat: YAXSHI — SameSite=Strict + Origin/Referer tekshiruvi**

**Fayl:** `apps/api/src/main-bootstrap.ts:30,70-129`

Himoya strategiyasi:
1. Auth cookie'lari `SameSite=Strict` bilan o'rnatiladi — brauzer cross-site so'rovlarda cookie'ni yubormayd.
2. `POST/PUT/PATCH/DELETE` so'rovlari uchun `Origin` yoki `Referer` sarlavhasi tekshiriladi.
3. Istisno yo'llar: `/api/auth/login`, `/api/auth/refresh`, `/api/auth/logout` — bu yo'llar `SameSite=Strict` bilan allaqachon himoyalangan, lekin "login CSRF" xavfi bor (jabrlanuvchini tajovuzkor hisobi bilan login qilish).

**Potensial muammo:** Login CSRF haqida izoh bor (`apps/api/src/main-bootstrap.ts:102-104`), ammo bu xavfga qarshi aniq chora ko'rilmagan — hujjatda faqat "MVP uchun yetarli" deyilgan.

---

## RBAC / Public Endpoint'lar

**Holat: DIQQAT — 30 ta `@Public()` endpoint, ba'zilari nozik**

Jami `@Public()` dekorator ishlatishlari: **36 ta satr** (deklaratsiya va izohlar kiritilgan holda).  
Haqiqiy public endpoint'lar soni: **~30 ta**.

| Fayl | Public Endpoint | Izoh |
|------|----------------|------|
| `auth.controller.ts:85,148` | Login, Refresh | To'g'ri — public bo'lishi shart |
| `auth-account.controller.ts:61,72,89` | Parol tiklash, ro'yxatdan o'tish | To'g'ri |
| `general-legacy-a.controller.ts:160` | Legacy endpoint | **Tekshirishni tavsiya** — "legacy" so'zi xavfsizlik tekshiruvidan o'tkazilganligini kafolatlamaydi |
| `bot-gateway.controller.ts:47` | Bot webhook | To'g'ri — Telegram/bot integratsiya |
| `cc-public.controller.ts:46` | CC public | Communication Center — foydalanuvchi uchun ochiq ma'lumotlar |
| `ecommerce-public.controller.ts:28,36,46,59` | E-commerce katalog | To'g'ri — internet do'kon |
| `website-media.controller.ts:33,72,111` | Website media | To'g'ri |
| `website.controller.ts:32,50` | Website sahifalari | To'g'ri |
| `admin-auth.controller.ts:36` | Admin login | **Diqqat** — admin login alohida throttle'ga ega ekanligini tekshiring |
| `ai-interview-v2.controller.ts:106,115,125` | AI intervyu | **Diqqat** — nomzod uchun public, lekin ma'lumot oqishi xavfini tekshirish kerak |
| `iot-tablet.controller.ts:60,71,82,112,123` | IoT tablet | **Diqqat** — 5 ta public endpoint; IoT qurilmalar authentication'siz murojaat qiladi |
| `mini-app.controller.ts:54` | POS mini-app | To'g'ri — Telegram mini-app |
| `mini-app-history.controller.ts:24` | POS mini-app history | **Diqqat** — tarix ma'lumotlari public? |
| `pos-auth.controller.ts:37,71` | POS login | To'g'ri |

**Eng katta xavf:** `iot-tablet.controller.ts` da 5 ta `@Public()` endpoint — IoT qurilmalari autentifikatsiyasiz murojaat qilsa, bu qurilmalar network'ga kirgan istalgan shaxs tomonidan ishlatilishi mumkin. Hech bo'lmaganda device token yoki API key kerak.

---

## Xavfsizlik Xulosasi

| Xavf | Severity | Holat |
|------|----------|-------|
| JWT localStorage saqlash | HIGH | Hal qilingan — httpOnly cookie'ga o'tilgan |
| SQL Injection | HIGH | Xavfsiz — barcha `sql.raw` whitelistdan |
| CSRF | MEDIUM | Hal qilingan — SameSite=Strict + Origin tekshiruvi |
| Rate Limiting | MEDIUM | Mavjud — auth va AI profillar bor |
| Login CSRF | LOW | Qisman — hujjatda tan olingan, MVP uchun qabul qilingan |
| IoT tablet public endpoints (5 ta) | MEDIUM | **Tekshirish kerak** — device-level auth yo'q |
| Admin login throttle | LOW | Tekshirilmadi |
| Legacy public endpoint | LOW | Tekshirishni tavsiya |
| AI intervyu public data exposure | LOW | Tekshirishni tavsiya |
| POS mini-app-history public | LOW | Tekshirishni tavsiya |

