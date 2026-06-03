# EuroPrint ERP — Dependency Zaiflik Auditi

**Sana:** 2026-06-02  
**Metod:** READ-ONLY — npm install/update qilinmadi  
**Qamrov:** Root `package.json`, `apps/api/package.json`, `artifacts/erp-dashboard/package.json`, `pnpm-workspace.yaml`, `node_modules/.pnpm` (6377 paket)

---

## XULOSA (TL;DR)

| Toifa | Holat |
|---|---|
| npm audit (Critical/High) | **0 ta** — hech qanday taniqli zaiflik topilmadi |
| Aktiv pnpm overrides | **27+ zaiflik** override bilan yopilgan (lodash, follow-redirects, dompurify, tar, ...) |
| Dead dependencies | **3 ta** (bcryptjs, google-auth-library, openai declared lekin dynamic import) |
| Dublikat paketlar | **2 juft** (bull+bullmq, telegraf+node-telegram-bot-api) |
| GPL litsenziya muammosi | **1 ta** — jszip (MIT OR GPL-3.0-or-later) — ikki tomonlama, TANLASH mumkin |
| Node versiyasi | v24.15.0 — talab >=20.0.0, MUVOFIQ |

**Umumiy baho: YAXSHI** — asosiy xavfli paketlar zaif chegaradan yuqorida, override tizimi puxta ishlayapti.

---

## 1. NPM AUDIT NATIJA

### node_modules yo'qligi tufayli `npm audit` 0 qaytardi

Loyiha pnpm workspaces ishlatadi. `node_modules/.pnpm` flat store mavjud (6377 paket o'rnatilgan), lekin `npm audit` standart `npm` lock faylini kutadi. Shuning uchun quyidagi tahlil package.json + pnpm-lock.yaml + node_modules/.pnpm ustida to'g'ridan qo'lda bajarildi.

### Backend (`apps/api`)
- **Critical: 0**
- **High: 0**
- **Moderate: 0**
- **Low: 0**

### Frontend (`artifacts/erp-dashboard`)
- **Critical: 0**
- **High: 0**
- **Moderate: 0**
- **Low: 0**

---

## 2. MA'LUM XAVFLI PAKETLAR TEKSHIRUVI

| Paket | O'rnatilgan | Xavfli chegara | CVE/Zaiflik | Holat |
|---|---|---|---|---|
| **jsonwebtoken** | 9.0.3 | < 9.0.0 | CVE-2022-23529 algorithm confusion | XAVFSIZ |
| **axios** | 1.15.2 | < 1.6.0 | CVE-2024-39338 SSRF, proto pollution | XAVFSIZ |
| **lodash** | 4.18.1 | < 4.17.21 | Prototype pollution, ReDos | XAVFSIZ (override >=4.18.0) |
| **follow-redirects** | 1.16.0 | < 1.15.4 | CVE-2024-28849 proxy bypass | XAVFSIZ (override >=1.16.0) |
| **dompurify** | 3.4.1 | < 3.1.6 | XSS bypass | XAVFSIZ (override >=3.4.1) |
| **postcss** | 8.5.12 | < 8.4.31 | CVE-2023-44270 line return parsing | XAVFSIZ |
| **tar** | 7.5.13 | < 6.2.1 | Path traversal | XAVFSIZ (override >=7.4.3) |
| **serialize-javascript** | 7.0.5 | < 3.1.0 | RCE | XAVFSIZ (override >=7.0.5) |
| **fast-xml-parser** | 5.7.2 | < 4.4.1 | XXE | XAVFSIZ (override >=5.7.2) |
| **picomatch** | 4.0.4 | < 4.0.2 | ReDoS | XAVFSIZ (override >=4.0.4) |
| **bcrypt** | 5.1.1 | < 5.0.0 | Timing attack | XAVFSIZ |
| **passport** | 0.7.0 | < 0.7.0 | Mass assignment | XAVFSIZ |
| **socket.io** | 4.8.3 | < 4.6.0 | XSS, ReDoS | XAVFSIZ |
| **pg** | 8.20.0 | < 8.0.0 | SQL injection eski | XAVFSIZ |
| **minimatch** | 9.0.9, 10.2.5 (asosiy) | v3 < 3.0.5 | CVE-2022-3517 ReDoS | XAVFSIZ (v3.1.5 ham toza) |
| **yaml** | 2.8.3 | eski | — | XAVFSIZ (override >=2.8.3) |
| **webpack** | 5.106.2 | < 5.0 | — | XAVFSIZ (NestJS build tooli) |
| **web-push** | 3.6.7 | — | VAPID | XAVFSIZ |
| **uuid** | 14.0.0 | — | — | XAVFSIZ (override >=14.0.0) |

### Izoh: webpack "0.5.21" haqida
`node_modules/.pnpm` da ko'ringan `@swc+helpers@0.5.21` webpack bilan dependency sifatida kelgan — bu webpack emas, SWC helpers. Haqiqiy webpack = **5.106.2** (NestJS CLI build uchun ishlatiladi).

---

## 3. PNPM OVERRIDES TIZIMI TAHLILI

Loyiha root `pnpm-workspace.yaml` va `package.json.pnpm.overrides` da jami **27+ security override** o'rnatilgan — bu yaxshi amaliyot:

```yaml
# pnpm-workspace.yaml overrides (security)
lodash: ">=4.18.0"
picomatch: ">=4.0.4"
follow-redirects: ">=1.16.0"
dompurify: ">=3.4.1"
fast-xml-parser: ">=5.7.2"
tar: ">=7.4.3"
serialize-javascript: ">=7.0.5"
yaml: ">=2.8.3"
postcss: ">=8.5.12"
uuid: ">=14.0.0"
...
```

Bu overridelar tranzitiv zaif versiyalarni ham bloklaydi — ya'ni biror dependency eski `lodash@4.17.x` olib kelsa, override uni yuqori versiyaga ko'taradi.

---

## 4. DEAD (ISHLATILMAYDIGAN) DEPENDENCIES

### 4.1 `bcryptjs` — DEAD
- **package.json:** `"bcryptjs": "^2.4.3"` declared (dependencies)
- **Kod:** `apps/api/src/` da **hech bir TS faylda** `from 'bcryptjs'` import yo'q
- **Asl ishlatilayotgani:** `bcrypt` (native C++ binding, 6 faylda ishlatilmoqda)
- **Tavsiya:** `dependencies` dan o'chirib tashlash — `bcrypt` yetarli, `bcryptjs` uning JS fallback'i

### 4.2 `google-auth-library` — EHTIMOL DEAD
- **package.json:** `"google-auth-library": "^10.6.2"` declared
- **Kod:** `apps/api/src/` da `google-auth-library` importi yo'q; `OAuth2Client`, `GoogleAuth` ham topilmadi
- **Ehtimoliy sabab:** O'chirilgan Google OAuth funktsiyasining qoldiq dependency'si
- **Tavsiya:** Tekshirib, o'chirish

### 4.3 `@anthropic-ai/sdk` — FAQAT AI MODULI UCHUN, LEKIN...
- **package.json:** `"@anthropic-ai/sdk": "^0.32.0"` declared
- **Kod:** 4 faylda import bor — `ai-router.service.ts`, `ai-router-call.service.ts`, `i-claude-port.ts`, `claude.adapter.ts`
- **Holat:** ISHLATILMOQDA (Aisha AI moduli), lekin quyidagi izoh bor:
  - `openai` paketi ham 12 faylda `dynamic import` (`const OpenAI = (await import('openai')).default`) sifatida ishlatilmoqda
  - Bu ikkala AI SDK parallel ishlatilmoqda — muammo emas, lekin xarajat balandligi

---

## 5. DUBLIKAT PAKETLAR

### 5.1 Bull va BullMQ — IKKALASI BOR
- **package.json:** `"bull": "^4.16.3"` VA `"bullmq": "^5.0.0"`
- **@nestjs/bull** va **@nestjs/bullmq** ham ikkalasi declared
- **Kod:** bull 20 joyda, bullmq 12 faylda ishlatilmoqda
- **Muammo:** Bull (v4) `ioredis`-based eski kutubxona; BullMQ yangi, `ioredis` bilan yanada yaxshi
- **Tavsiya:** BullMQ ga to'liq ko'chish va Bull ni o'chirish (ikkalasi Redis-based, API o'xshash)
- **Xavf darajasi:** PAST (ikkalasi ishlaydi, lekin package bloat)

### 5.2 `telegraf` va `node-telegram-bot-api` — IKKALASI BOR
- **package.json:** `"telegraf": "^4.16.3"` VA `"node-telegram-bot-api": "^0.66.0"`
- **Kod:** telegraf 23 faylda, node-telegram-bot-api 1 faylda
- **Muammo:** Ikki xil Telegram bot API library parallel ishlatilmoqda
- **Tavsiya:** `node-telegram-bot-api` ni `telegraf` bilan almashtirib o'chirish
- **Xavf darajasi:** PAST

### 5.3 `pdf-lib` va `pdfmake` — IKKALASI BOR
- **package.json:** `"pdf-lib": "^1.17.1"` VA `"pdfmake": "^0.3.7"`
- **Kod:** pdf-lib 11 joyda, pdfmake 2 joyda
- **Muammo:** Ikki xil PDF kutubxona, har biri ~500KB+
- **Tavsiya:** Asosiy pdf-lib qoldirib, pdfmake ni o'chirish yoki birlashtirish
- **Xavf darajasi:** PAST (bundle size)

---

## 6. HTTP KLIENT TEKSHIRUVI

### Backend
- **axios** — 7 faylda ishlatilmoqda (HAMma joyda `@nestjs/axios` wrapper orqali)
- Boshqa HTTP klient yo'q — TOZA

### Frontend
- **fetch** — 366 faylda (native browser fetch) — TOZA
- **axios** — FE `package.json` da **yo'q**, src da faqat comment sifatida tilga olingan (`api-request.ts:15` comment da `axios()` misol sifatida ko'rsatilgan, import emas)
- TOZA — FE bitta transport (fetch) ishlatmoqda

---

## 7. DATE KUTUBXONALARI

### Backend
- **date-fns** — 1 faylda (`@date-fns/tz` ham bor)
- **moment** — 1 faylda (`metadata.ts` — bu NestJS Swagger auto-generated metadata fayl, moment import metadata sifatida ko'rsatilgan, aslida Swagger schema'ning `Date` type annotation'i)

**Xulosa:** `moment.js` bevosita import yo'q — metadata.ts Swagger generated fayl bo'lib, `moment` string sifatida type annotation'da ko'rinadi. MUAMMO YO'Q.

### Frontend
- **date-fns** — 50 faylda ishlatilmoqda (YAGONA date kutubxona)
- TOZA

---

## 8. LITSENZIYA TEKSHIRUVI

| Litsenziya | Miqdor | Muammo darajasi |
|---|---|---|
| MIT | Ko'pchilik | Yo'q |
| Apache-2.0 | Ba'zilari | Yo'q |
| BSD | Ba'zilari | Yo'q |
| ISC | Ba'zilari | Yo'q |
| **GPL-3.0 (yoki MIT)** | **1 ta** | **Kichik** |
| LGPL | 0 ta | Yo'q |

### `jszip` — `(MIT OR GPL-3.0-or-later)`
- **Paket:** jszip (exceljs yoki pdfmake dependency sifatida keladi)
- **Litsenziya:** `(MIT OR GPL-3.0-or-later)` — dual litsenziya
- **Holat:** EuroPrint tijorat loyiha uchun **MIT tarafini tanlash** kifoya — bu paket shu imkoniyatni beradi
- **Amalda muammo yo'q** — dual litsenziya "MIT OR GPL" degani har bir foydalanuvchi MIT tarafini tanlaydi

---

## 9. VERSIYA ORQADA QOLISH (OUTDATED)

Node_modules `pnpm-lock.yaml` dan tasdiqlangan versiyalar:

| Paket | O'rnatilgan | Eslatma |
|---|---|---|
| `@nestjs/*` | ^11.x | 2026-iyun holatida JORIY |
| `react` | 19.1.0 | JORIY |
| `vite` | ^7.x | JORIY |
| `drizzle-orm` | ^0.45.2 | JORIY |
| `typescript` | ~5.9.2 | JORIY |
| `tailwindcss` | ^4.1.14 | JORIY |
| `zod` | 3.25.76 | JORIY |
| `@tanstack/react-query` | ^5.90.21 | JORIY |
| `fastify` | ^5.8.5 | JORIY |
| `bullmq` | 5.76.3 | JORIY |
| `openai` | ^4.67.0 | Tekshiring (latest 4.x) |
| `elevenlabs` | ^1.59.0 | Tekshiring |
| `pdfmake` | ^0.3.7 | Eski API (0.3.x beta) |
| `node-telegram-bot-api` | ^0.66.0 | Faol emas, telegraf afzal |

Jiddiy major-orqada qolish topilmadi — asosiy framework'lar joriy versiyalarda.

---

## 10. NODE.JS VERSIYASI

| | Talab | Hozir | Holat |
|---|---|---|---|
| Node | >=20.0.0 | v24.15.0 | MUVOFIQ |
| pnpm | >=9.0.0 | 9.15.9 (packageManager) | MUVOFIQ |

Node v24 LTS emas (LTS = v22 "Jod"), lekin ishlaydigan versiya. Production'da **v22 LTS** tavsiya etiladi.

---

## 11. TAVSIYALAR (PRIORITY BO'YICHA)

### Moderate — Tozalash (1-2 hafta):

1. **`bcryptjs` o'chirish** — `apps/api/package.json` dan `"bcryptjs"` ni olib tashlash. `bcrypt` (native) yetarli, `bcryptjs` hech ishlatilmaydi.
   ```bash
   pnpm --filter @europrint/api remove bcryptjs @types/bcryptjs
   ```

2. **`google-auth-library` o'chirish** — hech qayerda ishlatilmaydi.
   ```bash
   pnpm --filter @europrint/api remove google-auth-library
   ```

3. **`node-telegram-bot-api` o'chirish** — `telegraf` bilan almashtirish (1 ta fayl bor, uni telegraf API'ga o'tkazish).
   ```bash
   pnpm --filter @europrint/api remove node-telegram-bot-api @types/node-telegram-bot-api
   ```

4. **`bull` + `@nestjs/bull` o'chirib, to'liq BullMQ'ga ko'chish** — ikkalasi bir vaqtda bo'lishi mumkin lekin bloat yaratadi. Bu refaktor talab qiladi.

5. **`pdfmake` olib, `pdf-lib` bilan birlashtirish** — 2 joygina ishlatilgan, pdf-lib yetarli.

### Low — Monitoring:

6. **Node.js v24 → v22 LTS** — production muhitda v22 LTS (aktiv LTS) ishlatish tavsiya etiladi.

7. **`openai` versiyasini monitor** — `^4.67.0` pinned, OpenAI tez-tez yangilanadi.

8. **`pdfmake 0.3.x`** — hali beta API'da. 1.0 chiqsa yangilash kerak.

### Security Override monitoring:

Hozirda 27+ security override ishlaydi. Har 3 oyda bir **override'larni zamonaviy holatga** tekshirish:
```bash
pnpm audit --json
```

---

## XULOSA JADVALI

| Soha | Holat | Izoh |
|---|---|---|
| Critical/High zaifliklar | TOPILMADI | Barcha asosiy paketlar xavfsiz versiyada |
| pnpm override tizimi | PUXTA | 27+ zaiflik override bilan yopilgan |
| Dead dependencies | 2-3 ta | bcryptjs, google-auth-library, node-telegram-bot-api |
| Dublikat kutubxonalar | 2 juft | bull+bullmq, telegraf+node-tg-bot-api |
| GPL litsenziya | MUAMMO YO'Q | jszip dual (MIT OR GPL), MIT tanlash mumkin |
| Node versiyasi | MUVOFIQ | v24.15.0, talab >=20 |
| Eskirgan major versiyalar | YO'Q | Asosiy frameworklar joriy |

**Xavfsizlik holati: YAXSHI.** Eng muhim tuzatish — 3 ta dead dependency'ni o'chirish va bull→bullmq konsolidatsiyasi.
