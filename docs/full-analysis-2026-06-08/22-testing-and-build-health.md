# 22 — Build, Tip va Test Sog'lig'i

> **Hujjat turi:** REPORT-ONLY. Hech narsa o'zgartirilmadi.
> **Sana:** 2026-06-08
> **MUHIM — sandbox cheklovi:** Bu tahlil izolyatsiya qilingan Linux sandbox'ida bajarildi. Repo'ning `node_modules` pnpm symlink'lari sandbox'da materializatsiya qilinmagan (`node_modules/.bin/tsc` mavjud emas, pnpm store yo'q). Shu sababli **typecheck/build/test'ni shu yerda yangidan ishga tushira olmadim**. Quyidagilar: (a) mustaqil tasdiqlangan statik faktlar (konfiguratsiya, sanoq, `fayl:satr`), (b) repo'da saqlangan **haqiqiy** natija fayli (`vitest-junit.xml`), va (c) 2026-06-06 sanali mavjud test hisoboti (kross-referens). Yangidan ishga tushirishni talab qiladigan da'volar `TASDIQLANMAGAN (sandbox)` deb belgilangan.

---

## 1. Test va build toolchain inventari (tasdiqlangan, `fayl:satr`)

| Qatlam | Vosita | Versiya | Manba |
|---|---|---|---|
| Backend unit/e2e | Jest | `^29.7.0` | `apps/api/package.json` |
| BE transform | ts-jest / @swc/jest | `29.4.9` / `0.2.39` | `apps/api/package.json` |
| BE mutation testing | Stryker + jest-runner | `^9.6.1` | `apps/api/package.json` |
| BE testing util | `@nestjs/testing` | `^11.x` | `apps/api/package.json` |
| Frontend unit/component | **Vitest** | `^4.1.2` | `artifacts/erp-dashboard/package.json` |
| FE component | `@testing-library/react` + `user-event` + `jest-dom` | `16.3` / `14.6` / `6.9` | `erp-dashboard/package.json` |
| FE coverage | `@vitest/coverage-v8` | `^4.1.2` | `erp-dashboard/package.json` |
| E2E | `@playwright/test` | `^1.58.2` | `erp-dashboard/package.json` |
| Integration DB | `@testcontainers/postgresql` | (lazy) | `apps/api/test/_setup/test-db.ts` |
| BE Jest configlar | unit / dto / e2e | — | `apps/api/test/jest.config.js`, `jest.dto.config.js`, `jest.e2e.config.js` |
| FE Vitest config | — | — | `artifacts/erp-dashboard/vitest.config.ts` |

**Xulosa:** test stack to'liq va zamonaviy (Jest+Vitest+Playwright+Stryker+testcontainers). "Test yo'q" degan taxmin noto'g'ri.

---

## 2. Test fayllari soni (mustaqil sanab tasdiqlangan)

| Joy | Pattern | Soni | Tabiat |
|---|---|---|---|
| BE | `apps/api/**/*.spec.ts` | **706** | aralash |
| BE | `apps/api/test/_stubs/*.spec.ts` | **149** | sayoz scaffold (≈0 xulq tekshiruvi) |
| BE | `apps/api/**/*.e2e-spec.ts` | **17** | controller e2e |
| FE | `**/*.test.tsx` | **343** | shundan **262 `.smoke.test.tsx`** sayoz |
| FE | `**/*.test.ts` | **58** | ko'pi haqiqiy unit |
| FE | `e2e/*.spec.ts` (Playwright) | **46** | mock-backend |

> Jami ~1170 test fayl; ulardan ~411 (149 BE stub + 262 FE smoke) **sayoz skaffold** — mavjud, lekin haqiqiy xulq/assert tekshiruvi minimal. Bu test *qoplami* emas, *chuqurligi* muammosi.

---

## 3. Oxirgi qayd etilgan test natijalari

### 3.1 Frontend (Vitest) — HAQIQIY natija fayli

`artifacts/erp-dashboard/test-results/vitest-junit.xml` (oxirgi run: **2026-06-06 21:21**, host `DESKTOP-C0761A1`):

| Ko'rsatkich | Qiymat |
|---|---|
| Jami testlar | **1413** |
| Failures | **0** |
| Errors | **0** |
| Vaqt | 67.6s |

> Ya'ni oxirgi qayd etilgan FE Vitest run **to'liq yashil (0 fail)**. Lekin (2-bo'lim) 262 smoke test sayoz — "yashil" chuqur ishonch bermaydi.

### 3.2 Backend (Jest) — `TASDIQLANMAGAN (sandbox)`

Backend uchun saqlangan junit/natija fayli topilmadi (`apps/api`da `*junit*` yo'q). Sandbox'da Jest'ni ishga tushira olmadim. 2026-06-06 hisoboti (`docs/test-holati-tahlil-2026-06-06.md`) BE 706 spec'ning katta qismini (149 stub) sayoz deb tavsiflaydi, lekin aniq pass/fail soni o'sha hujjatda ham run-natija sifatida keltirilmagan → **jonli pass/fail TASDIQLANMAGAN**. Tavsiya: `pnpm --filter @europrint/api run test` ni mahalliy Windows'da ishga tushirib, natijani qayd etish.

---

## 4. Typecheck va build

| Bosqich | Sandbox'da | Dalil / izoh |
|---|---|---|
| `tsc --noEmit` (api) | **ishga tushmadi** | `node_modules/.bin/tsc` yo'q (pnpm symlink materializatsiya qilinmagan) — `TASDIQLANMAGAN (sandbox)` |
| `erp typecheck` | **ishga tushmadi** | xuddi shu sabab |
| `@workspace/db` build artefakti | mavjud | `lib/db/dist/cjs/index.js` **2026-06-05** da qayta build qilingan (eng yangi manba `lib/db/src/schema/sd-order-items.ts` = 2026-06-06, ya'ni dist ≈ 1 kun orqada) |

> **A2 drift xavfiga aniqlik (01/03-hisobot):** `lib/db/dist/cjs` deyarli joriy (2026-06-05). Bundan tashqari **CI typecheck'dan oldin `@workspace/db`ni qayta build qiladi** (`ci.yml:45-46`, `ci.yml:81-82`), shuning uchun CI'da staleness xavfi past. Qoldiq xavf — **mahalliy** `build`/`dev:api` skriptlari `@workspace/db`ni avtomatik build qilmaydi (faqat `build:all` qiladi).

---

## 5. Ma'lum ESM/uuid muammosi — HAL QILINGAN (workaround)

Prompt "ESM/uuid muammosi" deb eslatadi. Bu haqiqiy va **allaqachon hal qilingan**:

- `apps/api/test/jest.config.js:12-15` — `transformIgnorePatterns: ['node_modules/(?!(uuid|nanoid|jose|@anthropic-ai|@noble|@scure)/)']` — ESM-only paketlarni Jest transform qiladi.
- `apps/api/test/jest.config.js:76-77` — `'^uuid$': '<rootDir>/test/_setup/uuid-mock.js'` — `uuid@14` toza ESM bo'lgani uchun CJS shim'ga map qilingan.
- Ildiz `pnpm-workspace.yaml` overrides: `uuid: ">=14.0.0"`.

> Demak Jest'ning uuid/ESM bilan to'qnashuvi mock shim orqali aylanib o'tilgan. Bu texnik qarz (mock), lekin testlarni bloklamaydi.

---

## 6. CI/CD holati

`.github/workflows/` da **2 ta** workflow (ikkalasi 2026-06-06):

- **`ci.yml`** — `typecheck` (pnpm install → `@workspace/db build` → `tsc --noEmit` api → erp typecheck) va `unit-tests` (lib/db build → BE Jest → FE Vitest coverage). `DATABASE_URL` mock fallback bilan.
- **`code-quality.yml`** — Backend Test+Coverage (test DB'ga schema qo'llanadi), Frontend Vitest, va **22 ta arxitektura reviewer skripti** (`scripts/run-all-reviewers.sh`), arxitektura spec testi, i18n-leak gate, Semgrep.

> **Kuzatuv:** ikki workflow ustma-ust (BE test ikkalasida ham bor; biri Postgres bilan, biri mock bilan) — birlashtirish kerak. CI push'da ishlaydi (repo `Uzbek-Language-Module/` ichida, `git` SOG'LOM, ~793 commit — 2026-06-06 hisobotiga ko'ra, `TASDIQLANMAGAN` jonli git holati).

---

## 7. Windows-ga xos qadamlar

Repo Windows mahalliy ishlashga moslangan: `RUN_LOCAL.md` (Windows qo'llanma), `run-local.ps1` (PowerShell runner), `clean-restart.ps1` (PowerShell 5.1 mos toza qayta ishga tushirish). Prompt eslatgan "nest build oldidan `apps/api/dist` tozalash" — bu PowerShell skriptlarida hujjatlashtirilgan amaliyot (Windows fayl-qulflash muammolarini oldini olish uchun); aniq qadam `clean-restart.ps1` ichida (`TASDIQLANMAGAN` — to'liq satr tekshirilmadi).

---

## 8. Xulosa

Test va build infratuzilmasi **etuk va zamonaviy** (Jest 29.7, Vitest 4.1, Playwright, Stryker, testcontainers, 2 CI workflow, 22 arxitektura reviewer). Oxirgi qayd etilgan **FE Vitest run to'liq yashil — 1413 test, 0 fail** (2026-06-06). Asosiy zaiflik — **test chuqurligi**: ~411 sayoz skaffold (149 BE stub + 262 FE smoke). Backend jonli pass/fail va typecheck/build natijalari bu sandbox'da tasdiqlanmadi (toolchain yo'q) — ularni mahalliy Windows'da qayta ishga tushirish kerak. ESM/uuid muammosi mock shim bilan hal qilingan. `@workspace/db` build deyarli joriy va CI uni typecheck'dan oldin qayta quradi.

---

## 9. Kamchiliklar jadvali

| # | Muammo | Jiddiylik | Dalil | Ta'sir | Tavsiya |
|---|---|---|---|---|---|
| F1 | ~411 sayoz test (149 BE stub + 262 FE smoke) | **P2** | 2-bo'lim; `apps/api/test/_stubs`, `*.smoke.test.tsx` | "Yashil CI" soxta ishonch beradi | Smoke/stub'larni haqiqiy xulq testlariga aylantirish |
| F2 | BE jonli pass/fail tasdiqlanmagan | **P2** | 3.2-bo'lim | Test holati noaniq | Mahalliy `run test` + junit chiqishini saqlash |
| F3 | 2 ta CI workflow ustma-ust (BE test ikki marta) | **P3** | 6-bo'lim; `ci.yml`, `code-quality.yml` | CI vaqti/resurs isrofi | Workflow'larni birlashtirish |
| F4 | Mahalliy `build`/`dev:api` `@workspace/db`ni build qilmaydi | **P2** | 4-bo'lim; root `package.json` | Eski dist bilan ishlash xavfi (mahalliy) | `predev`/`prebuild` hook qo'shish |
| F5 | uuid ESM mock shim (texnik qarz) | **P3** | `jest.config.js:76-77` | Haqiqiy uuid xatti-harakati test qilinmaydi | uzoq muddatda ESM Jest'ga o'tish |
| F6 | golden thread (order→production→warehouse→finance) jonli DB e2e yo'q | **P2** | 2026-06-06 hisobot | Uchma-uch oqim tekshirilmagan | Bitta to'liq e2e jonli DB testi |

---

## 10. Ochiq savollar / TASDIQLANMAGAN

- **TASDIQLANMAGAN (sandbox):** `tsc --noEmit` (api + erp) natijasi — sandbox'da toolchain yo'q. Mahalliy ishga tushirish kerak.
- **TASDIQLANMAGAN (sandbox):** Backend Jest jonli pass/fail soni.
- **TASDIQLANMAGAN:** `clean-restart.ps1` ichidagi aniq `dist` tozalash satri (to'liq o'qilmadi).
- **Eslatma:** FE Vitest natijasi (1413/0) `vitest-junit.xml`dan — 2026-06-06 da foydalanuvchi mashinasida yozilgan haqiqiy run; bugungi holat o'zgargan bo'lishi mumkin.
