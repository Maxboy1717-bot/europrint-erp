# 01 — Arxitektura va Monorepo Xaritasi

> **Hujjat turi:** REPORT-ONLY (faqat tahlil). Bu tahlil davomida hech qanday manba kod, sxema, migratsiya yoki konfiguratsiya **o'zgartirilmadi**.
> **Tahlil sanasi:** 2026-06-08
> **Tahlil chegarasi (scope):** `C:\Users\AzzA\Downloads\EuroPrint-Clean\Uzbek-Language-Module` — canonical (asosiy) monorepo nusxasi.
> **Dalil formati:** har bir da'vo `fayl:satr` ko'rinishida keltiriladi. Tasdiqlab bo'lmagan narsalar `TASDIQLANMAGAN` deb belgilanadi.
> **Eslatma:** `docs/` papkasida oldingi auditlar mavjud (`schema-canon-map.md`, `two-worlds-analysis.md`, `stub-endpoint-catalog.md`, `full-analysis-2026-05-27/`, `-v2/`). Ular kontekst sifatida o'qildi, lekin bu hisobotdagi har bir da'vo kod (`fayl:satr`) orqali **mustaqil** qayta tasdiqlandi.

---

## 1. Umumiy ko'rinish va nusxalar masalasi

`EuroPrint-Clean` ildiz papkasida monorepo'ning **uchta** alohida nusxasi mavjud. Bu tahlil faqat canonical nusxani qamrab oladi; qolganlari deyarli bir xil dublikat bo'lib, faqat qisqacha qayd etiladi:

| Nusxa | Yo'l | Holati | Tahlilga kiritildimi |
|---|---|---|---|
| **Canonical** | `Uzbek-Language-Module/` | To'liq pnpm monorepo, `pnpm-workspace.yaml` mavjud | **Ha** |
| Git worktree | `agent1-wt/` | `.git` — fayl (worktree pointer), kodi canonical bilan deyarli bir xil | Yo'q (dublikat) |
| Audit volume | `Uzbek-Language-Volume/_audit` | Audit chiqindilari | Yo'q |
| Ichki worktree'lar | `Uzbek-Language-Module/.claude/worktrees/agent-*` (5 ta) | Agent ish nusxalari (`agent-a088…`, `agent-a8f2…`, `agent-ac73…`, `agent-af6e…`, `green-lie-group1`) | Yo'q (dublikat) |

Texnologiya steki: **pnpm** monorepo (`packageManager: pnpm@9.15.9`, root `package.json`), backend **NestJS + Fastify** (`@nestjs/platform-fastify`, `apps/api/package.json`), frontend **React 19 + Vite 7** (catalog `react: 19.1.0`, `vite: ^7.3.2`, `pnpm-workspace.yaml`), ma'lumotlar qatlami **Drizzle ORM + PostgreSQL** (`drizzle-orm`, `pg`, `postgres`, `apps/api/package.json`).

---

## 2. Monorepo tuzilishi (workspace paketlari)

Workspace glob'lari `pnpm-workspace.yaml`da belgilangan: `apps/*`, `artifacts/*`, `lib/*`, `lib/integrations/*`, `scripts`.

| Paket | Yo'l | Roli | Asosiy bog'liqliklar | Izoh |
|---|---|---|---|---|
| `@europrint/workspace` | `/` (root) | Workspace ildizi, skriptlar, pnpm overrides | eslint, prettier, husky, lint-staged | `version: 2.0.0`, `private: true` (root `package.json:2-4`) |
| `@europrint/api` | `apps/api` | **Backend** (NestJS+Fastify, CQRS, BullMQ, Socket.IO) | `@nestjs/*`, `@workspace/db`, `@workspace/math-utils`, `drizzle-orm`, `pg`, `postgres` | Yagona ishlaydigan backend; 51 ta biznes-modul |
| `@workspace/erp-dashboard` | `artifacts/erp-dashboard` | **Frontend** (React 19, Vite, Zustand, react-query) | `@dnd-kit/*`, `zustand`, `socket.io-client`, `leaflet`, `jspdf` | **Hech qanday `@workspace/*` import qilmaydi** (to'liq mustaqil) |
| `@workspace/europrint-site` | `artifacts/europrint-site` | Ommaviy veb-sayt (`<title>EuroPrint — Ommaviy Sayt`) | `dompurify` | Statik/marketing sayt |
| `@workspace/mockup-sandbox` | `artifacts/mockup-sandbox` | Dizayn mockup canvas (`<title>Mockup Canvas`) | — (bo'sh `dependencies`) | Faqat o'z `package.json`ida ko'rinadi → **orfan** |
| (paket emas) | `artifacts/api-server` | Faqat `public/` papka | — | `package.json` **yo'q** → pnpm paketi emas, statik host artefakti |
| `@workspace/db` | `lib/db` | **Canonical Drizzle sxema** + drizzle-kit | `drizzle-orm`, `drizzle-zod`, `pg`, `zod` | Sxemaning haqiqiy manbasi; `dist/cjs`ga build qilinadi |
| `@workspace/types` | `lib/types` | Umumiy TS tiplar | — | Faqat o'z ichida ishlatiladi → **orfan** |
| `@workspace/api-spec` | `lib/api-spec` | API spec/codegen | — | Iste'molchi topilmadi → **orfan** |
| `@workspace/api-zod` | `lib/api-zod` | Zod sxemalar | `zod` | Iste'molchi topilmadi → **orfan** |
| `@workspace/api-client-react` | `lib/api-client-react` | React API klient (react-query) | `@tanstack/react-query` | Iste'molchi topilmadi → **orfan** |
| `@workspace/math-utils` | `lib/math-utils` | Matematik yordamchilar | — | `apps/api` ishlatadi (`apps/api/package.json:83`) |
| `@workspace/scripts` | `scripts` | Audit/CLI skriptlar | — | 15+ `audit:*` skript |

> **Eslatma — orfan paketlar:** `@workspace/api-spec`, `@workspace/api-zod`, `@workspace/api-client-react`, `@workspace/types` — bu paketlarga havola faqat `lib/types` ichidan topildi (11 fayl, hammasi `lib/types/src/*` ichida o'z-o'ziga havola). Na `apps/api`, na `erp-dashboard` ularni import qiladi. Frontend `vite.config`/`tsconfig`da bu paketlar uchun alias ham yo'q, demak frontend ularni hatto resolve qila olmaydi.

---

## 3. Build / konfiguratsiya fayllari va pipeline

**Ildiz skriptlari** (root `package.json`):

- `build` → faqat `@europrint/api` build; `build:all` → `@workspace/db` build → api → erp → site (zanjir).
- `typecheck` → `api exec tsc --noEmit` **+** `erp-dashboard typecheck`.
- `test` → `api test` **+** `erp-dashboard test`.
- `db:migrate` → `@europrint/api run migrate`.
- `ci:check` → `typecheck && lint && test`.

**TypeScript konfiguratsiyasi — ikki xil rejim:**

| Fayl | `extends` | `module` | `moduleResolution` | `customConditions` | Izoh |
|---|---|---|---|---|---|
| `tsconfig.base.json` | — | `esnext` | `bundler` | `["workspace"]` | Frontend/lib uchun asos |
| `apps/api/tsconfig.json` | **yo'q** (mustaqil) | `commonjs` | `node` | yo'q | Backend klassik CJS rejimi; `outDir: ./dist` (`apps/api/tsconfig.json`) |
| `artifacts/erp-dashboard/tsconfig.json` | `../../tsconfig.base.json` | (asosdan) | `bundler` | `["workspace"]` (asosdan) | 3 alias: `@/*`, `@shared/schema`, `@assets/*` |

**Vite (frontend):** `artifacts/erp-dashboard/vite.config.*:297-305` — alias'lar: `@` → `src`, `@shared/schema` → `src/shared-schema.ts`, `@assets` → `../../attached_assets`. Build chiqishi `dist/public` (`vite.config:101`). `vite.config:25` izohida dev-proxy IPv6 `::1` muammosi qayd etilgan (backend faqat IPv4 xizmat qiladi → proxy 500/503) — operatsion xavf.

**Drizzle (`lib/db/drizzle.config.ts`):** `schema` → `./src/schema/index.ts` (canonical barrel, `drizzle.config.ts:14`), `out` → `./drizzle`, `dialect: postgresql`, `url: process.env.DATABASE_URL` (mavjud bo'lmasa throw, `drizzle.config.ts:9-11`).

---

## 4. Modul rezolyutsiyasi va sxema barrel (ENG MUHIM bo'lim)

Tizimda **uchta alohida sxema yuzasi (schema surface)** mavjud va bir nechta nom (`@europrint/schemas`, `@workspace/db`, `@shared/db`) compile-time va runtime'da **turli fayllarga** resolve bo'ladi. Bu drift va "stub vs canonical" muammosining ildizi.

### 4.1 Uchta sxema yuzasi

1. **Canonical** — `lib/db/src/schema/*` (697 ta `pgTable(` ta'rifi). Barrel: `lib/db/src/schema/index.ts` (~60 modulni re-export qiladi). `dist/cjs`ga build qilinadi.
2. **Backend superset (stub/compat)** — `apps/api/src/shared/db/` (455 ta `pgTable(` ta'rifi) + `europrint-compat.ts` shim. Bu canonical ustiga **ADD-ONLY superset**.
3. **Frontend mahalliy** — `artifacts/erp-dashboard/src/shared-schema.ts` (frontendning o'z tip/sxema nusxasi). Frontend backend sxemasidan **butunlay ajratilgan**.

### 4.2 Rezolyutsiya tartibi — qaysi ta'rif "yutadi"

| Import nomi | Compile-time (TS) qayerga | Runtime qayerga | Natija |
|---|---|---|---|
| `@europrint/schemas` | `apps/api/src/shared/db/europrint-compat.ts` (**mahalliy superset**) — `apps/api/tsconfig.json:14` | `lib/db/dist/cjs` (**canonical build**) — `apps/api/package.json:6` | **MOS EMAS:** TS mahalliy superset'ni ko'radi, Node canonical build'ni yuklaydi |
| `@workspace/db` | `lib/db/dist/cjs/index` (build `.d.ts`) — `apps/api/tsconfig.json:38` | `lib/db/dist/cjs/index.js` (pnpm `workspace:*` → `exports.require`) — `apps/api/package.json:82`, `lib/db/package.json:10` | Ikkalasi ham `dist/cjs` — **agar `dist` qayta build qilingan bo'lsa mos**; eskirsa drift |
| `@workspace/db` (boshqa paketlar, TS `import`) | `lib/db/src/index.ts` (`exports.import`) — `lib/db/package.json:9` | `dist/cjs` (`exports.require`) | TS manbani, runtime build'ni ko'radi |
| `@shared/db` | `apps/api/src/shared/db/index.ts` — `apps/api/tsconfig.json:18` | (mahalliy fayl) | Mahalliy |

> **Tahlil natijasi:** `apps/api/src` ichidagi **697 ta fayl** sxemani `@workspace/db` / `@europrint/schemas` / `@shared/db` orqali import qiladi. Eng ko'p ishlatiladigan `@europrint/schemas` **compile vaqtida mahalliy superset (`europrint-compat.ts`)**ga, **runtime'da esa `lib/db/dist/cjs` canonical build'ga** boradi. Demak TS muvaffaqiyatli tekshirilgan kod ham, agar mahalliy superset'da bor lekin `dist`da yo'q (yoki teskari) ustun/jadval ishlatilsa, runtime'da xato berishi mumkin. Bu drift batafsil **03-hisobotda** tahlil qilinadi.

### 4.3 `europrint-compat.ts` shim tuzilishi

`apps/api/src/shared/db/europrint-compat.ts` (64 satr) mahalliy fayllar va canonical'ni aralashtiradi:

- `europrint-compat.ts:6` — `export * from './schema'` (mahalliy barrel).
- `europrint-compat.ts:9-58` — `schema-compat-1..5`, `schema-compat-zod`, `schema-ai`, `schema-marketing-ext`, `schema-admin-ext` mahalliy fayllaridan nomli re-export.
- `europrint-compat.ts:56` — `export { blogPosts, marketingBudgetLines, marketingLeadContacts, sdCustomerCompetitors } from '@workspace/db'` — ya'ni shimning o'zi ham **canonical (dist/cjs)dan** ba'zi jadvallarni tortadi.

### 4.4 Canonical barrel'dagi dublikat-boshqaruv izlari

`lib/db/src/schema/index.ts` barrel'ida tarixiy dublikatlarni boshqarish bo'yicha aniq izohlar bor — bu duplikat jadval muammosini tasdiqlaydi (batafsil 03-hisobotda):

- `hr-architecture-additions`dan **bo'sh** selektiv re-export ("aiCvScreenings, jobTemplates... boshqa joyda aniqlangan, ular authoritative").
- `admin-assets`dan faqat `assetItems, assetMaintenance` (qolganlari "authoritative copies in pp/pp-enhanced").
- `employees`dan faqat `employees` ("EmployeeFile/EmploymentContract allaqachon `hr-schema` orqali").
- `users` "core-schema → core-users → users orqali allaqachon export qilingan".

---

## 5. Raqamli inventar (yuqori daraja)

| Ko'rsatkich | Soni | Manba / usul |
|---|---|---|
| Manba fayllar (TS/TSX, `apps`+`artifacts`+`lib`, `node_modules`/`dist` siz) | **5 689** | `find … -name '*.ts' -o '*.tsx'` |
| Frontend `.tsx` fayllar (`artifacts`+`lib`) | **1 803** | `find` |
| Backend controllerlar (`*.controller.ts`) | **341** | `find apps -name '*.controller.ts'` |
| Backend servicelar (`*.service.ts`) | **511** | `find` |
| Backend repositorylar (`*.repository.ts`) | **231** | `find` |
| NestJS modullar (`*.module.ts`) | **64** | `find` |
| Backend biznes-modul papkalar (`apps/api/src/modules/`) | **51** | `ls` |
| Canonical Drizzle `pgTable(` ta'riflar (`lib/db/src/schema`) | **697** | `grep -o pgTable(` |
| `apps/api` mahalliy `pgTable(` ta'riflar (`src/shared/db`) | **455** | `grep -o pgTable(` |
| Migratsiyalar — drizzle-kit (`lib/db/drizzle/*.sql`) | **14** | `ls` |
| Migratsiyalar — qo'lda (`apps/api/src/shared/db/migrations/*.sql`) | **58** | `ls` |
| i18n lokallar | **3** (`uz`, `ru`, `uz-cyr`) | `artifacts/erp-dashboard/src/locales` |
| i18n namespace fayllar | `uz`=56, `ru`=56, `uz-cyr`=**55** | `ls` (uz-cyr 1 ta kam) |

> `*.controller.ts`/`*.service.ts`/`*.repository.ts` sonlari fayl-konvensiyasiga ko'ra; ba'zi marshrutlar/servicelar boshqacha nomlangan bo'lishi mumkin — aniq endpoint sanog'i **21-hisobotda**.

---

## 6. Paketlararo bog'liqlik grafi

```
@europrint/api  ──(runtime: package.json:82-83)──▶  @workspace/db (→ dist/cjs)
      │                                          └▶  @workspace/math-utils
      │
      ├─(TS: tsconfig.json:14)──▶ src/shared/db/europrint-compat.ts ──▶ ./schema, ./schema-compat-*  (mahalliy superset)
      │                                                              └▶ @workspace/db (ba'zi jadvallar, dist/cjs)
      └─(TS: tsconfig.json:38)──▶ lib/db/dist/cjs (canonical build)

@workspace/erp-dashboard  ──▶  (HECH BIR workspace paketi YO'Q) ──▶  src/shared-schema.ts (mahalliy)

@workspace/types ──▶ (faqat o'z ichida) ✗ tashqi iste'molchi yo'q
@workspace/api-spec / api-zod / api-client-react ──▶ ✗ iste'molchi topilmadi (orfan)
@workspace/mockup-sandbox ──▶ ✗ orfan
```

Asosiy xulosa: yagona **haqiqiy** runtime bog'liqlik zanjiri `@europrint/api → @workspace/db (+math-utils)`. Frontend backend bilan faqat HTTP orqali bog'lanadi (kod darajasida ajratilgan). Beshta `lib`/artifact paketi orfan.

---

## 7. Backend modullar va modul-darajasidagi takrorlanishlar

`apps/api/src/modules/` da **51** papka. Domenlar bo'yicha guruhlash va e'tiborli **dublikat/qoplama** holatlar:

- **Moliya:** `fi` **va** `finance` — ikkita alohida moliya moduli (qoplanishi mumkin; 08/09-hisobotlarda tekshiriladi).
- **POS:** `pos` **va** `pos-v2` — ikkita POS moduli (10/11-hisobotlarda).
- **Ishlab chiqarish/ombor:** `mm` (materiallar), `mro`, `wms`, `pp`, `mes` — bir-birini qoplashi mumkin (12/14-hisobotlar).
- **CRM/sotuv:** `crm`, `sd`, `marketing`, `ecommerce`.
- **HR:** `hr`, `hr-assets`, `org-structure`, `feedback-360`, `applications`.
- **AI:** `ai`, `ai-agents`, `agents`, `aisha`.
- **Boshqa:** `admin`, `auth`, `core`, `kanban`, `lms`, `iot`, `logistics`, `qc`, `notifications`, `communication-center`, `chat`, `camera`, `bot-gateway`, `telegram`, `director`, `erp`, `export`, `storage`, `queue`, `integration`, `security`, `order-workflow`, `compatibility`, `general`, `remaining`, `shared`, `common`.
- **Shubhali nomlar:** `remaining`, `general`, `compatibility` — placeholder/"qoldiq" modul bo'lishi mumkin (23-hisobotda tekshiriladi).

---

## 8. Xulosa

EuroPrint — pnpm asosidagi yirik enterprise ERP monorepo: NestJS+Fastify backend (51 modul, ~341 controller, ~511 service), React 19+Vite frontend (~1 803 `.tsx`), Drizzle+PostgreSQL. Arxitekturaning eng muhim xususiyati — **sxemaning uch yuzaliligi** va `@europrint/schemas`/`@workspace/db` nomlarining compile-time va runtime'da **turli fayllarga resolve bo'lishi**. Bu "ADD-ONLY superset" yondashuvi qulay, lekin TS-tekshiruvi (mahalliy superset) va runtime (canonical `dist/cjs`) o'rtasida sezilmaydigan drift xavfini tug'diradi — bu butun tizim bo'ylab eng tizimli zaiflik. Ikkilamchi muammolar: ikkita migratsiya manbasi, bir nechta orfan paket, va modul darajasidagi takrorlanishlar (`fi`/`finance`, `pos`/`pos-v2`).

---

## 9. Kamchiliklar jadvali

| # | Muammo | Jiddiylik | Dalil (`fayl:satr`) | Ta'sir | Tavsiya (qo'llanilmagan) |
|---|---|---|---|---|---|
| A1 | `@europrint/schemas` TS'da mahalliy superset'ga, runtime'da canonical `dist/cjs`ga resolve bo'ladi — compile/runtime nomuvofiqligi | **P1** | `apps/api/tsconfig.json:14` vs `apps/api/package.json:6` | TS o'tgan kod runtime'da `column/table` xatosi berishi mumkin | Yagona manbaga keltirish; superset'ni `lib/db`ga ko'chirish yoki shimni canonical bilan generatsiya qilish |
| A2 | `@workspace/db` TS va runtime ikkalasi ham `dist/cjs`ga bog'liq — `dist` eskirsa drift | **P1** | `apps/api/tsconfig.json:38`, `lib/db/package.json:5-16` | Eski `dist` bilan ishlash → noto'g'ri sxema | Build pipeline'da `@workspace/db build`ni har doim avval majburlash (root `build:all` to'g'ri, lekin `build`/`dev:api` emas) |
| A3 | Ikkita migratsiya manbasi: `lib/db/drizzle` (14) va `apps/api/src/shared/db/migrations` (58) | **P2** | `lib/db/drizzle/*.sql`, `apps/api/src/shared/db/migrations/*.sql` | Migratsiya tartibi/ziddiyati noaniq, drift manbai | Bitta migratsiya egasini belgilash; ikkinchisini hujjatlashtirish |
| A4 | Orfan paketlar: `api-spec`, `api-zod`, `api-client-react`, `types`, `mockup-sandbox` | **P3** | `@workspace/*` faqat `lib/types/src/*`da; frontend'da 0 ta `@workspace` import | Chalkashlik, build vaqti, o'lik kod | Ishlatilmasa workspace'dan chiqarish yoki arxivlash |
| A5 | Modul takrorlanishi: `fi`+`finance`, `pos`+`pos-v2` | **P2** | `apps/api/src/modules/` (51 papka) | Endpoint/biznes-mantiq ikkilanishi | 08-11 hisobotlardan keyin birlashtirish rejasi |
| A6 | Ildizda va `.claude/worktrees`da bir nechta dublikat nusxa | **P3** | `agent1-wt/`, `.claude/worktrees/agent-*` (5) | Disk, chalkashlik, eski kod adashtirishi | Worktree'larni tozalash/arxivlash |
| A7 | `uz-cyr` lokalida 1 namespace fayli kam (55 vs 56) | **P3** | `src/locales/uz-cyr` (55) vs `uz`/`ru` (56) | Kirill tilida 1 namespace tarjimasiz | 19-hisobotda aniq fayl aniqlanadi |
| A8 | `apps/api/tsconfig.json` `tsconfig.base.json`ni `extends` qilmaydi (qoidalar ajralgan) | **P3** | `apps/api/tsconfig.json` (`extends` yo'q) | Backend/umumiy TS qoidalari bir-biridan farq qiladi | Atayin bo'lsa hujjatlashtirish |

---

## 10. Ochiq savollar / TASDIQLANMAGAN

- **TASDIQLANMAGAN:** `lib/db/dist/cjs` build'i hozir manba (`src`) bilan sinxronmi yoki eskirganmi — bu live drift A1/A2 ta'sirini hal qiladi (**07-hisobot** build'dan keyin aniqlashtiriladi).
- **TASDIQLANMAGAN:** `lib/integrations/*` glob'ida haqiqiy paketlar bormi (`pnpm-workspace.yaml`da e'lon qilingan, lekin tarkibi tekshirilmagan).
- **TASDIQLANMAGAN:** `fi` vs `finance` va `pos` vs `pos-v2` — qaysi biri faol, qaysi biri eski (08-11 hisobotlarda).
- **Ochiq savol:** `@europrint/api` `run migrate` skripti qaysi migratsiya manbasini (drizzle yoki shared/db/migrations) ishlatadi? (21/07-hisobotlarda aniqlanadi.)
- 697 va 455 — `pgTable(` matn-uchrashuvlari soni; ba'zi fayllar barrel'ga kirmagan yoki dinamik bo'lishi mumkin. Aniq, deduplikatsiya qilingan jadval ro'yxati **02-hisobotda**.
