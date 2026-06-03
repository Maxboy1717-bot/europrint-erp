# Agent13 — Xavfsizlik to'liq audit (2026-06-02)

**Maqsad:** `docs/security-pentest-2026-06-01.md` ni o'qib **tasdiqlash + kengaytirish**.
**Usul:** white-box (kod o'qish: Read/Grep, fayl:satr dalil) + **jonli unauth probe** (backend `127.0.0.1:3030` ishlayapti) + DB role-modeli.
**Cheklov:** READ-ONLY — hech narsa o'zgartirilmadi. Token mint qilinmadi (oldingi qaror saqlandi).

---

## 0. Bir qatorli xulosa

Tizimning **autorizatsiya tayanchi MUSTAHKAM**: 4 ta GLOBAL guard (Throttler → Jwt → Roles → Sod → Permission) `app.module.ts:193-197` da ulangan, 344 controllerda **1273 `@Roles` + 177 `@RequirePermission`**, atigi **35 `@Public` (18 faylda)**. Oldingi 2 ta KRITIK teshik (iot-tablet, storage) **jonli probe bilan YOPIQ tasdiqlandi (401)**. Qolgan hammasi — **hardening tavsiyalari**, bloker emas. **Yangi 1 ta o'rta + 3 ta past topildi** (quyida). Parol/kamera/maxfiy ochiq saqlanmagan. Jonli SQL-injection yo'q.

---

## 1. Global guard zanjiri — TASDIQLANDI (oldingi "guardsiz=ochiq" da'volari NOTO'G'RI)

`apps/api/src/app.module.ts:191-197`:
```
{ provide: APP_GUARD, useClass: FastifyThrottlerGuard }  // rate-limit
{ provide: APP_GUARD, useClass: JwtAuthGuard }           // auth (cookie/bearer)
{ provide: APP_GUARD, useClass: RolesGuard }             // @Roles
{ provide: APP_GUARD, useClass: SodGuard }               // separation-of-duties
{ provide: APP_GUARD, useClass: PermissionGuard }        // @RequirePermission RBAC
```
Demak controllerda `@UseGuards` YOZILMAGAN bo'lsa ham endpoint **default himoyalangan** —
faqat `@Public()` bilan ochiladi. `JwtAuthGuard.canActivate` (`jwt-auth.guard.ts:66-123`)
faqat `@Public` (`IS_PUBLIC_KEY`) bo'lsa `return true` qiladi; aks holda token majburiy.

**Raqamlar (jonli `grep` bilan):**
| O'lcham | Son |
|---|---|
| `@Controller` fayllar | **344** |
| `@Public()` (jami) | **35** |
| `@Public()` saqlovchi fayllar | **18** |
| `@Roles(...)` | **1273** |
| `@RequirePermission(...)` | **177** |

`RolesGuard` (`roles.guard.ts:51`) va `PermissionGuard` (`permission.guard.ts:33`):
`admin`/`super_admin`/`director` har doim o'tadi (RBAC bypass-by-design adminlar uchun).
DB rol modeli (memory tasdig'i): **manager×27, super_admin×3, director×1** — oddiy
foydalanuvchi = `manager`, u sezgir controllerlardan 403 oladi.

---

## 2. JONLI unauth probe natijalari (brauzer/runtime tasdiq)

Backend `127.0.0.1:3030`, token YO'Q:

| Endpoint | HTTP | Izoh |
|---|---|---|
| `GET /api/hr-v2/pip` | **401** | auth majburiy ✓ |
| `GET /api/aisha/wake/config` | **401** | auth majburiy ✓ |
| `GET /api/storage/x.png` | **401** | **storage fix HALI YOPIQ** ✓ (avval 200 edi) |
| `GET /api/iot/tablet/orders?workerId=1` | **401** | **iot-tablet fix HALI YOPIQ** ✓ (avval 200 edi) |
| `POST /api/website/banners` (bo'sh body) | **401** | global Jwt guard ushladi ✓ |
| `GET /api/website/banners` | **200** | public (marketing read) — dizayn bo'yicha |
| `GET /api/cc/verify/test` | **503** | public hujjat-tekshiruv (topilmadi→503 niqob) |

**Oldingi hisobotdagi 2 ta KRITIK High (iot-tablet, storage) — jonli 401 bilan
qayta tasdiqlandi: regress YO'Q.**

---

## 3. @Public endpointlar inventarizatsiyasi (35 ta — har biri ko'rib chiqildi)

Hammasi quyidagi 3 sinfdan biriga tushadi: **(A) login/refresh/health**, **(B) tashqi
integratsiya (Telegram/website/ecommerce QR)**, **(C) `@Public` + ICHKI custom guard/sessiya**.

### ISHLAYDI / xavfsiz @Public (auth oqimi)
- `auth.controller.ts:85` `POST /auth/login` `@Public` + `AuthThrottle`(5/daq) + **akkaunt-lock** (§6).
- `auth.controller.ts:148` `POST /auth/refresh` `@Public` — refresh secret bilan (auth modul).
- `auth-account.controller.ts:61,72,89` `verify-otp`/`resend-otp`/`health` `@Public`.
- `pos-auth.controller.ts:37` `POST /pos/auth/login` `@Public`+`AuthThrottle`; `:71` `ping` `@Public`.
- `general-legacy-a.controller.ts:189` `POST /legacy/client-errors` `@Public` — body cap (oldingi fix).

### @Public + ICHKI guard/sessiya (sinf-darajada Public, lekin himoyalangan)
- **iot-tablet** (`iot-tablet.controller.ts:60,72,84` GET + `116` login + `126` sos): `@Public`
  faqat global Jwt'ni chetlash uchun; `TabletTokenGuard` (`tablet-token.guard.ts`) **`x-tablet-token`
  JWT majburiy** (`tablet===true`). Jonli 401 ✓.
- **bot-gateway** (`bot-gateway.controller.ts:47` class `@Public` + `@UseGuards(TelegramAuthGuard)`):
  `telegram-auth.guard.ts:46-64` webhook secret tokenni **`timingSafeEqual`** (const-time) bilan
  tekshiradi; **production'da secret bo'lmasa 401** (`:62-63`). + telegram_id→active employee lookup.
- **pos mini-app** (`mini-app.controller.ts:54` class `@Public`): har metod `resolveSession()` →
  `pos-telegram.service.validateSession()`; `auth` metodi Telegram **initData HMAC-SHA256**
  (`pos-telegram.service.ts:96-130`) bilan tasdiqlanadi.
- `mini-app-history.controller.ts:24` — xuddi shu sessiya patterni.

### Tashqi public (dizayn bo'yicha ochiq — past xavf)
- **ecommerce** (`ecommerce-public.controller.ts:28,36,46,59`): kategoriya/mahsulot read +
  `POST /public/orders` + `POST /public/contact` (sayt formasi → CRM lead). Zod bilan validatsiya.
- **website** (`website.controller.ts:32,50`; `website-media.controller.ts:33,72,111`): settings/
  pages/banners/portfolio/news **READ** `@Public` — saytga ko'rsatish uchun.
- **cc-verify** (`cc-public.controller.ts:46`): `GET /cc/verify/:id` — chop etilgan hujjat QR
  tekshiruvi; `@Throttle 10/daq` (enumeratsiya himoyasi); signature_hash faqat oxirgi 12 belgi.
- **hr ai-interview-v2** (`ai-interview-v2.controller.ts:106,115,125`): nomzod public interview.
- **admin-auth** (`admin-auth.controller.ts:36`): `POST /auth/refresh` legacy — **JWT_REFRESH_SECRET**
  ishlatadi (`:45`, oldingi fix tasdiq).

**Xulosa:** 35 @Public ning birortasi ham "himoyasiz sezgir data" emas — yoki auth oqimi,
yoki ichki guard/sessiya, yoki ataylab tashqi public (read/forma).

---

## 4. YANGI TOPILMALAR (oldingi hisobotda yo'q)

### 4.1 [O'RTA→PAST] Website kontent yozish — rol granularligi yo'q
`website.controller.ts` va `website-media.controller.ts` da **yozish** endpointlari
(`POST/PUT /website/pages`, `/website/banners`, `/website/portfolio`,
`PUT /website/settings/:key`) da **`@Roles` YO'Q**. Class `@Controller()` da `@UseGuards` yo'q.
- Global Jwt guard tufayli **login MAJBURIY** (jonli `POST /website/banners` → **401**) — ya'ni
  **unauth yozish EMAS** (men dastlab High deb shubhalandim — jonli probe pasaytirdi).
- Lekin **har qanday log32an `manager`** (27 ta oddiy user) saytning ommaviy kontentini
  yaratishi/tahrirlashi mumkin — marketing/admin bilan cheklanmagan. Bu **kontent-yaxlitlik /
  defacement** xavfi (past-o'rta). DELETE metodlari `@Roles('admin','hr')` bilan (lekin ular
  baribir 403 stub: "audit compliance uchun o'chirib bo'lmaydi").
- **Tavsiya:** yozish metodlariga `@Roles(ADMIN, MARKETING, DIRECTOR)` qo'shilsin.
- Fayl:satr — `website.controller.ts:44,61,71`; `website-media.controller.ts:44,54,83,93`.

### 4.2 [PAST] `wake-config` GET maxfiy kalitni har logingan userga ochadi
`wake-config.controller.ts:40-47` `GET /aisha/wake/config` — `@Roles` yo'q, har logingan user
`picovoiceKey` (Porcupine access key) + ElevenLabs `voiceId` ni oladi. (PATCH `setSensitivity`
**director-only** `:56` — to'g'ri himoyalangan.) Jonli unauth → 401. **Tavsiya:** GET ga
`@Roles` yoki kalitni FE build-time ga ko'chirish. Oldingi hisobot wake-config ni "@Roles yo'q"
deb yozgan — aniqlik: **PATCH himoyalangan, faqat GET kalit-sizib chiqishi past xavf**.

### 4.3 [PAST] `pip`/`enps` rol-gate yo'q (oldingi hisobot bilan bir xil, hali ochiq)
`pip.controller.ts:37` va `enps.controller.ts:34` faqat `@UseGuards(JwtAuthGuard)` (global guard
bilan ortiqcha), **`@Roles` yo'q** → har `manager` PIP/eNPS yarata/o'qiy oladi. Jonli `GET
/api/hr-v2/pip` → 401 (auth bor), lekin rol cheklovi yo'q. **Tavsiya:** `@Roles(HR_*, ADMIN)`.

### 4.4 [PAST/INFO] O'lik dublikat controller fayllar (route collision EMAS)
`modules/legacy/controllers/` ichida `general-legacy-a.controller.ts`,
`general-legacy-b.controller.ts`, `admin-auth.controller.ts` — **3 ta dublikat fayl**, lekin
**hech bir `*.module.ts` ularni ro'yxatdan o'tkazmaydi** (faqat `general/legacy.module.ts:12-17`
`general/` nusxalarini ulaydi). Runtime'da route to'qnashuvi YO'Q (jonli tasdiq: bitta marshrut).
Xavfsizlik xavfi past — ammo o'lik kod (chalkashlik manbai). **Tavsiya:** o'chirish (alohida task).

### 4.5 [PAST] OTP HMAC/kod taqqoslash const-time emas (kichik timing-oracle)
`verify-otp.service.ts:38` `session.code !== command.code` — oddiy `!==`. Telegram mini-app HMAC
`pos-telegram.service.ts:122` `expectedHash !== hash` — ham oddiy `!==`. (bot-gateway esa
`timingSafeEqual` ishlatadi — nomuvofiqlik). Hex/raqamli taqqoslashda timing-oracle amaliy past,
ammo izchillik uchun `crypto.timingSafeEqual` tavsiya.

---

## 5. OLDINGI hisobot tavsiyalari — hozirgi holat (qayta tekshirildi)

| # | Tavsiya | Holat (2026-06-02) | Dalil |
|---|---|---|---|
| R1 | **OTP per-session attempt cap** | **HALI OCHIQ** | `verify-otp.service.ts:28-44` — `attempts++`/lock YO'Q; faqat expiry+kod tekshiradi |
| R2 | pip/enps/wake-config ga `@Roles` | **QISMAN** | pip/enps hali `@Roles`siz; wake PATCH director-only (4.2/4.3) |
| R3 | CRM row-scoping (rep akkauntlar) | **LATENT** | bugun faqat director/super_admin CRM ko'radi — by-design |
| R4 | **JWT alg-pin `algorithms:['HS256']`** | **HALI OCHIQ** | `auth.module.ts:40-45` va `chat.module.ts:36-38` factory'da `verifyOptions` YO'Q; `JwtAuthGuard:84` `jwtService.verify(token)` opsiyasiz → alg pin qilinmagan. `jwt.config.ts:20` `algorithm:'HS256'` faqat **sign** uchun, verify'ga uzatilmagan |
| R5 | storage upload ga `@Roles` | **QISMAN** | auth majburiy (jonli 401), lekin upload ga rol cheklovi yo'q (alohida) |

### 5.1 JWT alg-pin — chuqurroq
- `jwtService.verify(token)` hech qaerda `algorithms` ro'yxati bermaydi (3 ta JwtModule:
  `auth.module.ts`, `chat.module.ts`, `communication-center.module.ts` — hech birida verify-opt yo'q).
- Amaliy ta'sir: tizim faqat **HS256 simmetrik secret** ishlatadi, **public key yo'q** → klassik
  RS256→HS256 confusion amaliy emas. `alg:none` esa `jsonwebtoken` da default rad etiladi
  (secret berilgan). Shuning uchun **xavf past**, lekin defense-in-depth uchun pin tavsiya o'rinli.
- `communication-center.module.ts:60` `cfg.get('JWT_SECRET')` (`getOrThrow` emas) — lekin
  `jwt.config.ts:9` boot'da JWT_SECRET majburiy → amaliy undefined bo'lmaydi.

---

## 6. To'g'ri ishlayotgan himoyalar (POZITIV — tasdiqlangan)

| Mexanizm | Dalil | Holat |
|---|---|---|
| **Akkaunt lock (login brute-force)** | `drizzle-auth.repo.ts:144-148` — `failed_login_attempts+1>=5 → locked_until=NOW()+15min`; reset `:172` | ISHLAYDI |
| **Login rate-limit (IP)** | `main-bootstrap.ts:145-154` 5/60s + Throttler `auth` profil 5/daq | ISHLAYDI |
| **CSRF himoya** | `main-bootstrap.ts:86-143` — state-changing metodlarga Origin/Referer allowlist + SameSite=Strict cookie. *(Oldingi hisobotda eslatilmagan — yangi pozitiv)* | ISHLAYDI |
| **httpOnly + Secure(prod) + SameSite=Strict cookie** | `auth.controller.ts:49` `{httpOnly:true, secure:prod, sameSite:'strict'}` | ISHLAYDI |
| **JWT blacklist (jti revoke)** | `jwt-auth.guard.ts:99-115` — `refresh_tokens.is_revoked` jti bo'yicha (DB xato→fail-open) | ISHLAYDI |
| **Telegram webhook const-time secret** | `telegram-auth.guard.ts:53,112-117` `timingSafeEqual` | ISHLAYDI |
| **Telegram mini-app initData HMAC** | `pos-telegram.service.ts:96-130` HMAC-SHA256(WebAppData) | ISHLAYDI |
| **Security headers** | `main-bootstrap.ts:54` Permissions-Policy `camera=(),microphone=()...` (oldingi fix) | ISHLAYDI |
| **Prod'da stack-trace yashirin** | `global-exception.filter.ts:88` `debug` faqat non-prod | ISHLAYDI |
| **Swagger secret bilan** | `main-bootstrap.ts:198-213` prod'da SWAGGER_SECRET majburiy, aks holda o'chiq | ISHLAYDI |
| **`.env` git'da YO'Q** | `git ls-files` faqat `*.env.example` (4 ta) chiqaradi; `apps/api/.env` disk'da untracked | TASDIQ |
| **Parol hash bcrypt, default yo'q** | `admin.seed.ts:14-19` ADMIN_SEED_PASSWORD majburiy, fallback YO'Q | ISHLAYDI |
| **Env validatsiya (Zod)** | `env.schema.ts:15-17` JWT_SECRET≥32, REFRESH≥32, ADMIN_SEED_PASSWORD≥8 | ISHLAYDI |

---

## 7. SQL injection — JONLI/STATIK tahlil (yo'q, ekspluatatsiya bo'lmaydi)

`sql.raw(...)` ~25 joyda — har biri tekshirildi:
- **DDL literal** (xavfsiz): `ddl-migrations.ts:27,41,43,150,206,...`, `invariants.ts:38,86`,
  `*-migration.service.ts` — `CREATE INDEX/TABLE` literal stringlar, foydalanuvchi inputi yo'q.
- **Parametrlangan / izohlangan** (xavfsiz): `compatibility/*`, `pos/*`, `aisha/*tool.ts` —
  izohlarda "no sql.raw() with user-controlled values".
- `schema.ts:120 sql.raw(q)` va `aisha/compare-periods.tool.ts:75-78` — `q`/`meta.table`/`meta.column`
  **ichki literal/enum** (foydalanuvchi inputi emas). `sprint2-migration.service.ts:185`
  `sql.raw(table/name/definition)` — migration ichki konstantalar.
- `legacy.service.ts:28` — izoh: tarixiy `sql.raw(rawQuery)` pass-through **olib tashlangan** (oldingi fix).
- Barcha user-facing so'rovlar `sql\`...${param}\`` (parametrlangan) yoki Drizzle ORM (`eq()` ...).

**Xulosa:** foydalanuvchi inputidan keladigan `sql.raw` YO'Q → SQL-injection yo'q (oldingi
hisobot tasdiqlandi).

---

## 8. Error leakage / dublikat route / maxfiy

- **Error leakage:** `global-exception.filter.ts` — prod'da `debug` undefined; lekin **non-GET 500**
  uchun `:94 error: message` xom `Error.message` ni qaytaradi (Result-unwrap interceptor 500'da
  `String(e)` berishi mumkin). Past xavf (stack yo'q, faqat xabar). GET-5xx esa generik
  "Server temporarily unavailable". **Tavsiya:** non-GET 500'da ham generik xabar.
- **Dublikat route:** runtime'da YO'Q (o'lik fayl dublikatlari §4.4, ammo ro'yxatdan o'tmagan).
  Memory tasdig'i: sd/SalesDistribution ghost yo'q, route-map toza.
- **Maxfiy ochiq saqlangan:** **YO'Q** — barcha secret env orqali (`JWT_SECRET`, `JWT_REFRESH_SECRET`,
  `TELEGRAM_BOT_TOKEN`, `REDIS_PASSWORD`, `SWAGGER_SECRET`, `picovoiceKey` config'dan).
  **Kamera paroli — YO'Q:** `cameras` jadvalida faqat `snapshot_url`; RTSP/onvif/parol manbada yo'q
  (`camera.service.ts` bo'sh; `erp-camera.*` faqat report/detection o'qiydi). Vazifadagi "kamera
  paroli ochiq?" — **TASDIQLANMADI, bunday narsa yo'q**.

---

## 9. KRITIK MUAMMOLAR — PRIORITY tartibida

### 🟢 KRITIK/High bloker — YO'Q (hammasi yopilgan, jonli tasdiq)
iot-tablet + storage → 401 (regress yo'q). Yangi unauth teshik topilmadi.

### 🟠 O'RTA (production'dan oldin yaxshilash, bloker emas)
1. **OTP session attempt-cap (R1)** — `otp_sessions` ga `attempts` ustun + ~5 noto'g'ridan keyin
   sessiya lock. Hozir faqat IP-throttle + expiry. — `verify-otp.service.ts:38`.
2. **JWT alg-pin (R4)** — 3 ta JwtModule factory + `JwtAuthGuard.verify` ga
   `algorithms:['HS256']`. Amaliy xavf past (HS-only), lekin defense-in-depth. — `auth.module.ts:40`.
3. **Website yozish rol-gate (4.1)** — `@Roles(ADMIN,MARKETING,DIRECTOR)` qo'shish (har manager
   sayt kontentini o'zgartira oladi). — `website*.controller.ts`.

### 🟡 PAST (hardening)
4. **pip/enps `@Roles` (4.3 / R2)** — HR/admin bilan cheklash.
5. **wake-config GET kalit-sizishi (4.2)** — GET ga `@Roles` yoki kalitni FE'ga ko'chirish.
6. **OTP/initData const-time taqqoslash (4.5)** — `timingSafeEqual`.
7. **non-GET 500 error-message niqobi (§8)** — generik xabar.
8. **O'lik dublikat controller fayllar (4.4)** — `modules/legacy/controllers/` 3 fayl o'chirish.
9. **JWT secret rotatsiya (prod)** — `apps/api/.env` dev placeholder (`local-dev-…`) ni prod uchun almashtirish.
10. **Storage upload `@Roles` (R5)** — yuklash huquqini cheklash (auth allaqachon bor).

---

## 10. Go-live hukmi

**Shartli GO** — oldingi hukm bilan bir xil va **jonli qayta-tasdiqlangan**. Ikki bloker teshik
(iot-tablet, storage) yopiq (401). Autorizatsiya tayanchi mustahkam (1273 @Roles, 4 global guard).
Ekspluatatsiya qilinadigan SQL-inj / hardcoded secret / kamera-parol / dublikat-route YO'Q.
Production'dan oldin: **OTP cap + JWT alg-pin + JWT secret rotatsiya + website yozish rol-gate**.
Qolgan 6 element — sof hardening, bloker emas.

---
*Tahlil: agent13-xavfsizlik · 2026-06-02 · READ-ONLY · kod (fayl:satr) + jonli unauth probe (127.0.0.1:3030) + DB role-modeli. Oldingi `security-pentest-2026-06-01.md` tasdiqlandi va kengaytirildi.*
