# EuroPrint ERP — Test Holati Tahlili va 2026 Tavsiya / Test-State Analysis & 2026 Recommendation

> **Sana:** 2026-06-06 · **Rol:** 🔵 Tahlilchi (read-only) · **O'zgartirilgan kod:** YO'Q (faqat shu hujjat)
> **Metod:** verify-don't-trust — har bir da'vo jonli repo'da `file:line` bilan tasdiqlangan.
> **Stack:** FE `artifacts/erp-dashboard` (React+Vite+wouter) · BE `apps/api/src` (NestJS+Fastify) · PostgreSQL+Drizzle.

---

## ⭐ TL;DR — Eng muhim topilma (the brief's premise is wrong)

Topshiriq "is there Jest? Vitest? anything?" deb so'raydi — go'yo test infratuzilmasi yo'qdek.
**Bu noto'g'ri.** EuroPrint allaqachon **to'liq, zamonaviy 2026 test stack**iga ega:

- **Backend:** Jest 29.7 + ts-jest/@swc/jest, `@nestjs/testing`, **Stryker 9.6 mutation testing**, 3 ta Jest config (unit / dto / e2e).
- **Frontend:** **Vitest 4.1** + `@vitejs/plugin-react` + jsdom, `@testing-library/react`+`user-event`+`jest-dom`, `@vitest/coverage-v8`, `fake-indexeddb`.
- **E2E:** **Playwright 1.58** (mock-backend + real-backend rejimlar).
- **Test DB:** **testcontainers** (`@testcontainers/postgresql`) + `docker-compose.test.yml`, Docker-gated skip.
- **CI:** **2 ta GitHub Actions workflow** — `ci.yml` + `code-quality.yml` (Postgres+Redis service, codecov, 22 arxitektura reviewer, i18n-leak gate, Semgrep).
- **Coverage:** codecov + bosqichma-bosqich threshold rejasi (`docs/TESTING_PROMPT.md`).

**Demak savol "qaysi framework qo'shamiz?" emas.** Stack to'g'ri va zamonaviy. **Asl muammo — CHUQURLIK va ULANISH:**
mavjud ~1050 test faylining ~411 tasi (149 BE stub + 262 FE smoke) sayoz skaffold (≈0 xulq tekshiruvi);
golden thread (order→production→warehouse→finance) hech qachon **jonli DB**'ga qarshi uchma-uch ishlatilmaydi;
va 41 ta `_audit/proof-*.cjs` (haqiqiy "saqlanadimi?" isboti) qo'lda, CI'dan tashqarida, **jonli** DB'ga uriladi.

> ✅ **TUZATISH (2026-06-06):** oldingi "git repo EMAS" da'vosi **XATO** edi — bu parent-dir path xatosi.
> Harness/tahlil `EuroPrint-Clean` parent papkasini tekshirgan; **repo bir daraja pastda — `Uzbek-Language-Module/`**'da
> (`git rev-parse --show-toplevel` shuni tasdiqladi). Repo SOG'LOM: **793 commit**, branch `chore/schema-convergence`,
> GitHub remote `origin → Maxboy1717-bot/europrint-erp.git`. `.github/workflows/` shu repo ichida va **push'da ishga tushadi**.
> Demak CI dormant EMAS. Qoladigan yagona haqiqiy nuqta: **2 workflow ustma-ust** (`ci.yml` Postgres'siz ╳ `code-quality.yml` Postgres bilan).

---

## A. CURRENT STATE — Hozirgi holat (verified)

### A.1 Frameworklar va versiyalar (file:line)

| Qatlam | Framework | Versiya | Manba |
|---|---|---|---|
| BE unit/e2e | Jest | `^29.7.0` | `apps/api/package.json:154` |
| BE transform | ts-jest / @swc/jest / babel-jest | `29.4.9` / `0.2.39` / `30.3.0` | `package.json:138-155` |
| BE testing util | `@nestjs/testing` | `^11.1.19` | `package.json:135` |
| BE mutation | Stryker + jest-runner | `^9.6.1` | `package.json:136-137` |
| FE unit/component | **Vitest** | `^4.1.2` | `erp-dashboard/package.json:105` |
| FE component | `@testing-library/react`+`user-event`+`jest-dom` | `16.3.2`/`14.6.1`/`6.9.1` | `package.json:62-65` |
| FE coverage | `@vitest/coverage-v8` | `^4.1.2` | `package.json:74` |
| FE DOM | jsdom | `^29.0.2` | `package.json:86` |
| E2E | `@playwright/test` | `^1.58.2` | `package.json:24,90` |
| Integration DB | `@testcontainers/postgresql` | (lazy import) | `apps/api/test/_setup/test-db.ts:39` |
| Monorepo gate | husky + lint-staged | `9.1.7` / `15.5.2` | root `package.json:41-42` |

**Test scriptlari (haqiqiy):**
- BE: `test` → `jest --config test/jest.config.js` · `test:dto` → `jest.dto.config.js` · `test:e2e` → `jest.e2e.config.js` · `test:mutation` → `stryker run` (`apps/api/package.json:42-46`).
- FE: `test` → `vitest run` · `test:coverage` → `vitest --coverage` · `test:e2e` → `playwright test` · `test:e2e:api` (`erp-dashboard/package.json:11-16`).
- Root: `test` (BE+FE), `test:api`, `test:erp`, `test:coverage`, `ci:check` = typecheck+lint+test (root `package.json:19-27`).

### A.2 Test fayl sonlari (node_modules/worktree chiqarib tashlangan)

| Joy | Pattern | Soni | Tabiat |
|---|---|---|---|
| BE | `apps/api/**/*.spec.ts` | **707** | aralash (pastga qarang) |
| BE | `apps/api/test/_stubs/*.spec.ts` | **149** | 🟥 sayoz scaffold |
| BE | `apps/api/test/e2e/*.e2e-spec.ts` | **17** | controller e2e |
| BE | `apps/api/**/*.test.ts` | 0 | (Jest faqat `.spec.ts` ishlatadi) |
| FE | `*.test.tsx` | **343** | shundan **262 `.smoke.test.tsx`** 🟥 sayoz |
| FE | `*.test.ts` | **58** | ko'pi haqiqiy unit |
| FE | `e2e/*.spec.ts` (Playwright) | **46** | mock-backend'ga qarshi |
| `_audit` | `proof-*.cjs` | **41** | qo'lda DB-proof (CI emas) |

**707 BE spec'ning tarkibi (verify qilingan namunalar):**
- **149** `test/_stubs/*` — har biri ~3 assertion: `expect(mod).toBeDefined()` + module-cache + `typeof`. **0 biznes xulq.**
  Fayl ichi izohi: *"Deeper behavioral coverage lives in the domain-exhaustive spec"* (`test/_stubs/AdminExtraService.spec.ts:4-5`).
- Katta to'plam `src/**/*.dto.spec.ts` (Zod DTO validatsiya) — `test:dto` orqali alohida (`jest.dto.config.js:4` `testRegex: 'src/.*\.dto\.spec\.ts$'`). Bular Jest'ning asosiy `test` konfigida **ishlamaydi** (`jest.config.js:4` faqat `test/.*\.spec\.ts$`).
- ~80 ta haqiqiy xulq spec'i `test/` ildizida + `test/unit`, `test/pos`, `test/mm`, `test/hr`, `test/architecture`, `test/aisha`.
- 3 ta integration spec `test/hr/*.integration.spec.ts` (default **skip**).

### A.3 Coverage holati va threshold

| Qatlam | Hozirgi floor (enforced) | Step-up reja | Manba |
|---|---|---|---|
| BE (Jest) | lines 25 / func 25 / branch 20 / stmt 25 | 25→50→70→**80** | `jest.config.js:43-50` + izoh:41-42 |
| FE (Vitest) | lines 15 / func 15 / branch 10 / stmt 15 | 5→… ratchet | `vitest.config.ts:50-55` + izoh:47-49 |

⚠️ **Nomuvofiqlik:** `docs/TESTING_PROMPT.md` hozirgi haqiqiy coverage'ni BE ~12%, FE ~0.87% deb keltiradi —
bu enforced floor'dan (25% / 15%) **past**. Ya'ni yo floor jonli DB bo'lmagan lokal run'da real bajarilmayapti
(unit-only o'tib ketadi), yoki TESTING_PROMPT raqamlari eskirgan. CI'da haqiqiy raqamni codecov ko'rsatadi.

### A.4 CI holati — 2 ta workflow (repo'da haqiqatan mavjud, node_modules emas)

`.github/workflows/ci.yml` va `.github/workflows/code-quality.yml` (ikkalasi tasdiqlangan).

**`ci.yml`** (push: main/develop/chore/feat/fix + PR):
- `typecheck` (BE `tsc --noEmit` + FE typecheck)
- `unit-tests` — BE `jest` + FE `vitest --coverage`; **lekin Postgres service YO'Q** (`DATABASE_URL` faqat `secrets`'dan, `ci.yml:88`). Demak DB-bog'liq spec'lar yo mock yo skip.
- `lint` (`eslint --max-warnings 0`, `ci.yml:144`)
- `security-audit` (`pnpm audit --audit-level=high`)
- `build` (needs typecheck+unit+lint)

**`code-quality.yml`** (to'liqroq, PR+push):
- `test-backend` — **`postgres:15` + `redis:7` service**, `drizzle push` bilan schema, `jest --coverage` → **codecov** (`code-quality.yml:20-68`). ⭐ Bu yagona joyda BE testlar **haqiqiy DB**'ga qarshi ishlaydi.
- `test-frontend` — Vitest + codecov.
- `test-architecture` — 22 reviewer skript + `ARCHITECTURE_RULES.md` drift gate + `test/architecture` spec (`:97-121`).
- `test-e2e` — Playwright, **faqat PR**, **MOCK backend** bilan (`:126-149`).
- `i18n-leakage` — hardcoded UI string'ni bloklaydi (`:154-181`).
- `security` — Semgrep (`:186-193`).

> ⚠️ Ikki workflow **ustma-ust** (ikkalasi ham typecheck/unit/coverage qiladi) — `ci.yml`'da Postgres yo'q, `code-quality.yml`'da bor. Bu chalkashlik; kanonik bittasi tanlanishi kerak.

### A.5 Test DB holati — testcontainers (zamonaviy, to'g'ri)

- `apps/api/test/_setup/test-db.ts` — `isDockerAvailable()` (`:22`) → `PostgreSqlContainer` lazy import (`:39`); Docker bo'lmasa `null` qaytaradi va `describeWithDb = describe.skip` (`:66-67`). Windows dev mashinalarini sindirмaydi.
- `apps/api/test/_helpers/setup-test-db.ts` — `TEST_DATABASE_URL` (fallback `postgres://test:test@localhost:55432/europrint_test`), `docker-compose.test.yml` (`:14,89`).
- Integration spec'lari **default skip**: `RUN_INTEGRATION_TESTS === '1'` bo'lmasa `describe.skip` (`test/hr/employees.integration.spec.ts:24-29`). Faqat 3 ta (HR: employees/departments/leave-requests).
- CI'da `code-quality.yml` haqiqiy `postgres:15` service beradi — ya'ni integration uchun infra **tayyor**, lekin spec'lar hali kam.

### A.6 NestJS scaffold (`nest g` standart spec)

Standart `nest`-generatsiya qilingan bo'sh `.spec` topilmadi. Buning o'rniga **149 ta `test/_stubs/*Service.spec.ts`** —
qo'lda(skript) generatsiya qilingan "module yuklanadi" smoke testlar (yuqorida A.2). Bular `nest g` artefakti emas, ataylab yozilgan minimal scaffold.

### A.7 _audit proof skriptlari — qo'lda DB-proof (avtomat suite EMAS) ✅ tasdiqlandi

- **41 ta** `_audit/proof-*.cjs` (jami 47 `.cjs`). `require('pg').Pool` bilan **jonli** Postgres'ga ulanadi.
- Pattern: `INSERT → SELECT/funksiya chaqir → exact assert → DELETE (cleanup)`. Misollar:
  - `proof-bom-explosion.cjs` — BOM portlatish: M1 qty2 scrap0 → **2000**; M2 qty5 scrap10% → **5500** (`:51-52`), idempotent re-run=0, keyin cleanup (`:55-61`).
  - `proof-design-greenlie.cjs` — generate→2 row, approve→`approved`, reject→`rejected`+reason, cleanup→0.
  - `proof-layer-formula.cjs`, `proof-pos-gl-live.cjs`, `proof-production-fanout.cjs`, `proof-outbox-roundtrip.cjs` — golden-thread bo'g'inlari.
- **Jest suite'ga ulanmagan** — qo'lda `node _audit/proof-*.cjs` bilan ishga tushiriladi. Ya'ni bular **haqiqiy "saqlanadimi" isbotlari**, lekin regressiyani ushlamaydi (CI'da yo'q) va **jonli** DB'ga uriladi (xavf).

### A.8 Test CHUQURLIGI — sifat (verify-don't-trust, namuna asosida)

**Backend — KUCHLI joylar (haqiqiy xulq, exact raqamlar):**
- `test/finance-engine.spec.ts` — **27 case**: Money VO (banker's rounding), NPV/IRR (CF=[−100,30,40,50]→NPV≈4.61), amortizatsiya, 13-haftalik cashflow (5200). DB yo'q (sof domen).
- `test/qc-spc-fmea.spec.ts` — **52 case**: OEE clamp, p-chart UCL/LCL, X-bar/R, Cp/Cpk (1.33 capable), RPN=S×O×D (7×8×6=336), DPMO→sigma, ΔE CIEDE2000, TAC limitlari. **A'lo.**
- `test/pos-fifo.service.spec.ts` — **15 case**: FIFO `received_date ASC`, FEFO `expiry_date ASC`, ko'p-partiya allokatsiya, yetishmovchilik xatosi. DB **mock**.
- `test/hr-payroll-closure.spec.ts` — **17 case**: GL jurnal balansi (debit=credit=1100), hisob mapping (6710), holat o'tish guardlari. DB mock.
- `test/mm/layer-formula.spec.ts` — **6 case**, ⭐ vision #7 BRAIN: **476 varaq** (100kg/300GSM/1000×700, `:14-15`), **591.61 GSM** korrugat (205+205+127×1.43, `:22-29`), teskari hisob 476→100kg. **Math haqiqiy va to'g'ri.**

**Backend — SAYOZ:**
- 149 `_stubs` (≈0 qiymat). `test/architecture/rules.spec.ts` — **enforcement-based**: reviewer skript *mavjudligini* va `ARCHITECTURE_RULES.md` ni tekshiradi, kod *muvofiqligini* test orqali EMAS.

**Frontend — KUCHLI:**
- `src/lib/__tests__/business-logic.test.ts` — **60+ assertion**: ZVS level chegaralari (500K/5M/100M), kompaniya holati, `getWeekStart` yil-chegarasi, `formatMoney`.
- `src/lib/i18n/__tests__/loader.test.ts` — **40+ assertion**: fallback zanjiri, interpolatsiya, completeness.
- `src/test/setup.ts` — global mock: jest-dom, `fake-indexeddb/auto`, `matchMedia`, `ResizeObserver`, `IntersectionObserver` (`vitest.config.ts:18` setupFiles).

**Frontend — SAYOZ / yo'q:**
- **262 `.smoke.test.tsx`** — faqat `expect(container.firstChild).not.toBeNull()` ("crash qilmay render bo'ladi"). Auto-generatsiya, 0 xulq.
- ~46 komponent test (`fireEvent` bilan) — click + callback assert; **forma to'ldirish / validatsiya / submit YO'Q** (ya'ni Qoida Q-43 "forma saqlash" aynan **test qilinmagan**); modern `userEvent` o'rniga eski `fireEvent`.
- **Playwright (46 spec) MOCK backend'ga qarshi** (`playwright.config.ts:43-68` `e2e/mock-backend.mjs`). Mock = in-memory, **DB yo'q, FK yo'q** (`mock-backend.mjs:241-295` 4 ta mock xodim). Auth/endpoint-mavjudligi tekshiriladi, **golden thread EMAS**.

### A.9 Honest gap — haqiqiy test suite uchun nima yetishmaydi

1. **Sayoz fayllar headline'ni shishiradi:** 149 BE stub + 262 FE smoke = ~411 fayl ≈0 xulq qiymati. "707+343 test" raqami haqiqiy qoplamani **kuchli ortiqcha** ko'rsatadi.
2. **Past coverage:** BE ~12–25%, FE <1–15%. Kuchli domen-math borligi joyida, lekin tor.
3. **Golden thread hech qachon jonli ishlamaydi:** modullararo uchma-uch (order→advance→fan-out→production→warehouse→GL) test **yo'q**. Playwright mock'da, integration spec'lar 3 ta (HR) va skip.
4. **Wiring untested:** controller→service→repo→DB zanjiri deyarli test qilinmagan (domen-math izolyatsiyada unit qilingan).
5. **41 proof skript = "haqiqiy" test, lekin qo'lda + jonli DB + CI'siz:** regressiyani ushlamaydi, xavfli (jonli DB), runner assertion emas.
6. **2 CI workflow ustma-ust** — kanonik bittasi yo'q (`ci.yml` Postgres'siz, `code-quality.yml` Postgres bilan). *(Eslatma: oldingi "git yo'q → CI dormant" da'vosi XATO edi — qarang yuqoridagi TUZATISH; repo `Uzbek-Language-Module/`da, 793 commit, GitHub remote, CI push'da ishlaydi.)*

---

## B. RECOMMENDED 2026 STACK — Tavsiya etilgan stack

> **Asosiy xulosa:** Stack allaqachon to'g'ri va zamonaviy. **Migratsiya KERAK EMAS.** Tavsiya = **konsolidatsiya + chuqurlashtirish + ulash**, framework almashtirish emas.

| Maqsad | Tavsiya | Sabab (topilganga asoslangan) |
|---|---|---|
| **BE unit** | **Jest'ni saqlash** (Vitest'ga ko'chirмaslik) | 707 fayl + 3 config + Stryker + `@nestjs/testing` allaqachon Jest'da. Ko'chirish = ulkan churn, marginal foyda. Tezlik kerak bo'lsa: butun suite'ni **`@swc/jest`** (allaqachon bor) ga o'tkaz, ts-jest type-check yukini olib tashla (typecheck alohida CI job sifatida allaqachon bor). |
| **BE integration** | **Supertest + testcontainers Postgres** (allaqachon scaffold) | `test/_setup/test-db.ts` + `code-quality.yml` Postgres service tayyor. Eng yuqori leverage: skip-by-default integration'ni **majburiy CI job**ga aylantirish. |
| **FE unit/component** | **Vitest + Testing Library** (bor) + `fireEvent`→**`user-event`** | `user-event` allaqachon dependency (`package.json:65`). Forma to'ldir→submit→validatsiya assert qo'shish (Q-43). |
| **FE/Acceptance E2E** | **Playwright** (bor) + **real-backend project** | Mavjud mock-project'ni tez smoke uchun saqla; 3–5 kritik oqim (ayniqsa golden thread) uchun NestJS + testcontainer Postgres + seed bilan **haqiqiy** project qo'sh. |
| **Mutation** | **Stryker** (bor), lekin **scope qil** | Butun kodga emas — yuqori-qiymatli domen fayllarga: `layer-formula`, `finance-engine`, `qc-spc-fmea`, `pos-fifo`. |
| **Coverage/Report** | **codecov** (bor) + halol ratchet | Floor'ni haqiqatga moslab (yashil-halol qil), keyin bosqichma-bosqich ko'tar. |

**Nima uchun Jest (BE) saqlanadi, Vitest (FE) qoladi:** bu aynan Vite+NestJS+PG+Drizzle uchun zamonaviy-to'g'ri kombinatsiya.
NestJS ekotizimi Jest'ga tabiiy (`@nestjs/testing`, `--testPathPattern`, Stryker jest-runner); Vite FE esa Vitest'ga tabiiy (bir xil transform/ESM/`vite.config`). Ikkala dunyoni bitta runner'ga majburlash sun'iy ish va xavf keltiradi.

---

## C. WHERE TESTS PLUG INTO THE PLAN — Reja bilan bog'lanish

1. **Foundation (avval):**
   - ~~git init~~ — **KERAK EMAS:** git ALLAQACHON mavjud (`Uzbek-Language-Module/`, 793 commit, GitHub remote, CI push'da ishlaydi). Bu qadam olib tashlandi.
   - **2 workflow'ni birlashtirish** — `code-quality.yml` ni kanonik qil (Postgres+codecov+arxitektura+e2e+semgrep unda), `ci.yml` dublikatlarини olib tashla. ⬅ Foundation'ning asl ishi shu.
   - **Coverage floor'ni halollashtir** — enforced floor = real raqam, keyin ratchet.
2. **Golden thread = system acceptance E2E:** bitta test order→70% advance→`AdvanceApprovedFanoutListener` fan-out→production→warehouse→GL ni **seeded testcontainer DB**'ga qarshi yuradi. Bu qo'lda proof skriptlar + listener'ni avtomatik kafolatga aylantiradi.
3. **Layer formula = exact-number unit test:** ⭐ **ALLAQACHON BAJARILGAN** (`test/mm/layer-formula.spec.ts` — 476 varaq / 591.61 GSM). Tavsiya: ko'proq grammage + korrugat case qo'sh va **Stryker bilan target qil** (bu "brain" mutatsiyaga chidamli bo'lsin).
4. **Har real/tuzatilgan endpoint → integration test:** **41 `_audit/proof-*.cjs` ni Jest+Supertest+testcontainer integration spec'ga port qil.** Mantiq allaqachon yozilgan (INSERT→SELECT→assert→cleanup) — uni runner'ga ko'chirib, qo'lda DB-proof'ni **doimiy regressiya suite**ga aylantirasan. Eng arzon-yuqori leverage.

---

## D. PROPOSED ORDER — Bosqichli, kam-xavf rollout

| Faza | Ish | Leverage / natija | Kerak |
|---|---|---|---|
| **0 — Foundation (kunlar)** | git init + CI fire'ni tasdiqla; 2 workflow'ni birlashtir; coverage floor'ni halollashtir | CI haqiqatan himoya qila boshlaydi; yashil-halol | Egasi qarori (git/remote) |
| **1 — Proof→Auto integration** | 41 `_audit/proof-*.cjs` → Supertest+testcontainer integration spec. Golden-thread bo'g'inlaridan boshla: `bom-explosion`, `production-fanout`, `pos-gl-live`, `layer-formula`, `outbox-roundtrip` | Qo'lda isbot → doimiy regressiya; jonli DB xavfi yo'qoladi | Schema o'zg. yo'q; `code-quality.yml` PG service bor |
| **2 — Golden thread E2E** | order→…→finance bitta real-backend acceptance testi | Vision #21 avtomatik kafolatlanadi | Seed + testcontainer; kod o'zg. yo'q |
| **3 — Domen unit chuqurlashtirish** | finance/qc/layer spec'larini kengaytir; shu fayllarga Stryker; 149 stub'ni golden-thread service'lari uchun **real** xulq spec'iga almashtir | Sayoz scaffold → haqiqiy qoplama | Yo'q |
| **4 — FE behavioral** | komponent testlar `fireEvent`→`userEvent`; kritik formalarga **save-test** (Q-43); smoke'ni render-floor sifatida saqla | "Ko'rinadi lekin saqlamaydi" (fake-create) ushlanadi | Yo'q |
| **5 — Coverage ratchet** | floor 25→50→70 (BE), 15→40→60 (FE) spec'lar tushgani sayin | Regressiyaga qarshi qotirish | Yo'q |

---

## ROLL-UP — Yakuniy xulosa

**Frameworklar (mavjud, zamonaviy):** Jest 29 + Stryker (BE) · Vitest 4 + Testing Library (FE) · Playwright 1.58 · testcontainers · codecov · 2 CI workflow. → **Tavsiya: saqlash + chuqurlashtirish, ko'chirмaslik.**

**Test fayllari (verified):** BE 707 `.spec.ts` (shundan 149 sayoz stub + 17 e2e + katta DTO to'plami + ~80 haqiqiy) · FE 343 `.test.tsx` (262 sayoz smoke) + 58 `.test.ts` (ko'pi haqiqiy) + 46 Playwright (mock) · 41 qo'lda `_audit` proof.

**Haqiqiy xulq qoplamasi:** kuchli, lekin tor — finance/QC/layer-formula domen-math **a'lo**; wiring/endpoint/golden-thread/FE-forma deyarli **yo'q**.

**TOP 5 gap (built ↔ kerakli):**
1. **Golden thread uchma-uch jonli test YO'Q** — eng katta bo'shliq (modullararo integration 3 ta HR spec, skip).
2. **41 proof skript CI'da emas** — haqiqiy DB-isbotlar regressiyani ushlamaydi + jonli DB'ga uriladi (xavf).
3. **~411 sayoz fayl** (149 BE stub + 262 FE smoke) raqamni shishiradi, qiymati ≈0.
4. **2 CI workflow ustma-ust** (`ci.yml` Postgres'siz ╳ `code-quality.yml` Postgres bilan) — kanonik bittasi tanlanishi kerak. *(Oldingi "git yo'q → CI dormant" da'vosi XATO — repo `Uzbek-Language-Module/`da, CI push'da ishlaydi.)*
5. **FE forma-saqlash (Q-43) test qilinmagan** — `fireEvent`-only, submit/validatsiya yo'q ⇒ "ko'rinadi lekin saqlamaydi" tutilmaydi.

**Eng arzon-yuqori leverage qadam:** Faza 1 — 41 proof skriptni testcontainer integration spec'ga ko'chirish (mantiq tayyor) + Faza 2 golden-thread acceptance testi. Bu ikkisi vision #21/#22 ni avtomatik kafolatga aylantiradi.

---

*Tahlil read-only yakunlandi. Hech qanday kod/migration/commit qilinmadi — faqat shu hujjat (`docs/test-holati-tahlil-2026-06-06.md`) yozildi. Commit'ni egasi/boshqa oyna bajaradi (Qoida 23, parallel-xavfsizlik).*
