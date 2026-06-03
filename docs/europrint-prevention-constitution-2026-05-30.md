# EuroPrint ERP — PREVENTION KONSTITUTSIYASI va MASHINA-GATE'LAR

**Sana:** 2026-05-30 · **Manba:** 32 read-only agent (16 gate × design→adversarial-prove) · har gate haqiqiy findinglarda otilishi grep bilan tasdiqlangan.
**Prinsip:** *machine-gate inson intizomidan uzoq yashaydi.* Hujjat gate'ni TASVIRLAYDI, hech qachon ENFORCE qilmaydi.
Haqiqiy gate testi: hujjat o'qimagan yangi dasturchi ham violation'ni merge qila olmaydi — **CI server-side bloklaydi**.

> ⚠️ **Eng muhim aniqlik:** hozir **CI deyarli hech narsani bloklamaydi** — `ci.yml` to'liq ESLint ishlatmaydi,
> `code-quality.yml:54,116` da `|| true` xatolarni yashiradi, `ci.yml:144` da `--max-warnings 100`, codecov `fail_ci_if_error:false`.
> Shuning uchun **RULE ZERO (Task #1)** bajarilmaguncha boshqa har qanday gate bypass qilinadi.

---

## 1. ROOT-CAUSE QOIDALAR (31 root-cause → 9 asosiy, 414 finding ortida)

| # | Root-cause | Natija (finding) | Gate |
|---|---|---|---|
| **R0** | **CI gate'lar soxta** (`\|\| true`, `--max-warnings 100`, ESLint ishlamaydi) | hamma narsa bypass | RULE ZERO |
| R1 | Konstanta/enum/tip uchun yagona manba yo'q | INPS 8-12×, Employee 3 def, role enum 3 xil | G1, G7, G8, G9 |
| R2 | Arxitektura chegarasi majburlanmaydi (db.* service'da) | 17 bypass sayt | G3 |
| R3 | Schema kanonikallashtirilmagan + runtime DDL | 696 pgTable dup, boot DDL | G4 |
| R4 | Referens-yaxlitlik gate yo'q (dead kod) | 39 dead, 27 o'chsa bo'ladi | G13 |
| R5 | Stub/kontrakt majburlanmaydi | 35 wired-stub | G5 |
| R6 | Pul/stok/auth test gate yo'q | 17 E2E dan 2 moliyaviy | G6 |
| R7 | Fayl-hajmi cap yo'q | 900+ qatorli fayllar | G7-size |
| **R8 (YANGI)** | **Qatlamlararo izchillik tekshirilmaydi** — FE BE hisobini takrorlaydi · schema default konstantaga zid · idempotency yo'q · secret commit | pension 10×, schema teskari, retry dublikat, .env ochiq | G10, G11, G12, G14, G15 |

**R8 — 9 nomzod qoidadan TASHQARI topilgan yangi root-cause.** Bu eng yashirin qatlam: kod "to'g'ri ko'rinadi" lekin
ikki joy bir-biriga zid (FE↔BE, schema↔constant) yoki himoya butun SINF sifatida yo'q (idempotency, secret).

---

## 2. KONSTITUTSIYA (har qoida: RULE / WHY / ENFORCEMENT / DETECTION)

### RULE ZERO — CI HAQIQIY bo'lishi shart (boshqa hamma gate shunga bog'liq)
- **RULE:** Hech bir CI step xatoni yashirmaydi (`|| true` yo'q), ESLint `--max-warnings 0`, testlar va schema/lint xatolari merge'ni bloklaydi.
- **WHY:** `code-quality.yml:54` (db push `|| true`), `:116` (arch-doc `|| true`), `ci.yml:144` (`--max-warnings 100`), codecov `fail_ci_if_error:false` (:67,:91) — gate'lar yashil ko'rinadi, lekin violation o'tadi.
- **ENFORCEMENT (BEST):** `.github/workflows/*.yml` tuzatish (quyida aniq diff). + `ci.yml` ga FE+BE ESLint step qo'shish (hozir ESLint CI'da yo'q).
- **DETECTION:** PR-CI — har red gate merge'ni bloklaydi.

### G1 — Konstanta yagona manba (soliq/stavka)
- **RULE:** Service/controller/repository da soliq/stavka raqamli literal (0.01/0.05/0.08/0.12) TAQIQ; faqat `business.constants.ts` dan import.
- **WHY:** INPS 0.01 vs 0.08 vs 0.12 — `finance-extended-payroll.service.ts:19`, `finance-payroll.repository.ts:13`, `hr-payroll.controller.ts:32` (payroll 8× xato).
- **ENFORCEMENT:** ESLint `no-restricted-syntax` (literal selector) + **2-gate:** unit test `business.constants` qiymatlarini tasdiqlaydi (INPS=0.01, JSHD=0.12).
- **DETECTION:** PR-CI (ESLint) + test. **Blind-spot:** noto'g'ri moduldan import / `parseFloat('0.08')` / `sql\`\`` template — test + grep bilan yopiladi.

### G3 — Service'da to'g'ridan db.* yo'q (Qoida 15)
- **RULE:** `*.service.ts` Drizzle `db.*` ni to'g'ridan chaqirmaydi; faqat `*.repository.ts` orqali.
- **WHY:** `finance-extended-payroll.service.ts`, `pos-fifo.service.ts` + ~15 sayt.
- **ENFORCEMENT:** ESLint `no-restricted-syntax` override (`*.service.ts` da `db.` MemberExpression). **Fires=true** (mavjud saytlarda otiladi).
- **DETECTION:** PR-CI. **Blind-spot:** `this.db`, alias, repo'ga o'ralgan db — selector kengaytiriladi.

### G4 — Bitta jadval + runtime DDL yo'q
- **RULE:** Har `pgTable('name')` butun kodda 1 marta; `sql.raw(CREATE/ALTER/DROP)` boot'da TAQIQ; schema faqat versioned migration.
- **WHY:** 696 pgTable dup (status-machines IDENTIK 2 fayl), `invariants.ts` boot DDL.
- **ENFORCEMENT:** `scripts/check-schema-uniqueness.mjs` (pgTable nomi 1 marta) + boot DDL grep ban. CI step.
- **DETECTION:** PR-CI.

### G5 — Jonli route'da stub yo'q
- **RULE:** Jonli route handler real DB call-path'siz success qaytarmaydi (`return {ok:true}`/`{data:[]}`/`notImplemented`).
- **WHY:** 35 wired-stub — `pos-stub.controller`, `hr-dashboard.controller:119-228`, `wms-catalog:140`, `marketing-analytics-stubs`.
- **ENFORCEMENT:** `check-no-new-stubs.mjs` kuchaytirish (mavjud) + test: handler real call-path. **Wired-stub O'CHIRILMAYDI — odam tugatadi yoki gate qiladi.**
- **DETECTION:** PR-CI (yangi stub bloklanadi).

### G6 — Pul/stok/auth test majburiy
- **RULE:** GL posting / payroll / FIFO / stock movement / auth fayllariga o'zgarish → tegishli test mavjud + green; coverage 80%+ shu path'larga.
- **WHY:** 17 E2E dan faqat 2 moliyaviy; payroll/GL/FIFO ZERO test.
- **ENFORCEMENT:** Jest/Vitest coverage threshold (per-path) + CI step. **Fires=true.**
- **DETECTION:** PR-CI (coverage red).

### G7 — Tip/DTO yagona manba + fayl-hajmi cap
- **RULE (tip):** Har entity (Employee/User/Invoice/Order/Material) bitta canonical tip (`lib/types`); modul-local qayta ta'rif TAQIQ. **RULE (size):** fayl ≤900 (BE)/≤600 (FE), funksiya ≤150.
- **WHY:** Employee/User/Invoice 3 def; `drizzle-kanban-ext.repo.ts:964`, `PosMonitorPage:892`.
- **ENFORCEMENT:** `scripts/check-duplicate-types.mjs` + ESLint `max-lines`/`max-lines-per-function`.
- **DETECTION:** PR-CI.

### G8/G10 — Enum/state-machine yagona manba (YANGI, R8)
- **RULE:** Har semantik enum/status/role to'plami 1 joyda; bir xil nom turli qiymat/format bilan TAQIQ.
- **WHY:** `super_admin` vs `SUPER_ADMIN` (3 fayl); 4 xil order state-machine; movement enum 10 vs 6.
- **ENFORCEMENT:** `scripts/check-enum-ssot.mjs`. **ci-blocking=true, fires=true.**
- **DETECTION:** PR-CI.

### G11 — FE BE logikasini takrorlamaydi (YANGI, R8)
- **RULE:** Frontend soliq/INPS/JSHD/pension/komissiya HISOBLAMAYDI; BE hisoblaydi, FE ko'rsatadi.
- **WHY:** `TaxCalculator.tsx:14` pension 0.001 vs BE 0.01 (10× kam); `PayrollAutomation.tsx:61` INPS.
- **ENFORCEMENT:** ESLint (FE da soliq literal/hisob ban) + `scripts/check-fe-be-parity.mjs` (FE konstanta = BE).
- **DETECTION:** PR-CI. **Blind-spot:** inline hisob, util'ga ko'chirilgan — AST + parity test.

### G12 — Schema default to'g'riligi (YANGI, R8)
- **RULE:** Pul/stavka ustun `default` = canonical `business.constants` qiymati.
- **WHY:** `schema-hr-lms.ts:59-60` `inps_rate='0.12', jshd_rate='0.01'` (TESKARI).
- **ENFORCEMENT:** `apps/api/test/schema-payroll-defaults.spec.ts` — default = constant. **ci-blocking=true, fires=true.**
- **DETECTION:** PR-CI (test red).

### G14 — Idempotency majburiy (pul/stok mutation) (YANGI, R8)
- **RULE:** Pul/stok o'zgartiruvchi har POST/PATCH `Idempotency-Key` header + DB UNIQUE talab qiladi.
- **WHY:** `posMovements` idempotencyKey YO'Q (`pos-schema-v2.ts:71`); advance_payments retry dublikat.
- **ENFORCEMENT:** `scripts/check-idempotency-guard.mjs`. **ci-blocking=true, fires=true.**
- **DETECTION:** PR-CI.

### G13 — Dead kod gate
- **RULE:** 0-referensli export/fayl TAQIQ.
- **WHY:** 39 dead (27 o'chsa bo'ladi), dead FE pages/components.
- **ENFORCEMENT:** `knip` CI step (`knip.json`).
- **DETECTION:** PR-CI.

### G15 — Secret commit qilinmaydi (YANGI, R8)
- **RULE:** Haqiqiy secret (.env/JWT_SECRET/DB parol/API key) git'ga TAQIQ; faqat `.env.example` placeholder.
- **WHY:** **`.env` git'ga commit qilingan, JWT_SECRET + 4 real secret ochiq.**
- **ENFORCEMENT:** `gitleaks` CI step + `.gitignore` `.env` + git tarixidan tozalash + secret rotatsiya.
- **DETECTION:** PR-CI (gitleaks red). **DARHOL:** secretlarni rotatsiya qiling — ular allaqachon oshkor.

### G9 — CLAUDE.md = faqat pointer
- **RULE:** CLAUDE.md faqat "bu gate'lar CI'da ishlaydi, red bo'lsa qanday tuzatish" pointer'i; enforcement EMAS.
- **WHY:** CLAUDE.md eskirgan — tuzatilgan muammolarni hali "critical" sanaydi.
- **ENFORCEMENT:** `scripts/check-docs-fresh.mjs` (CLAUDE.md'dagi fayl:qator havolalari mavjudligini tekshiradi) + qisqartirish.
- **DETECTION:** PR-CI.

---

## 3. GATE PROOF JADVALI (anti-theater)

| Gate | Hozir holat | Real findingda otiladi? | Blind-spot | CI-blocking (o'rnatilgach) |
|---|---|---|---|---|
| RULE ZERO | ❌ THEATER (`\|\| true`, max-warn 100) | ha (ci fayllar:54/116/144) | codecov fail_ci_if_error | ✅ |
| G1 const | o'rnatilmagan | ✅ ha (payroll:19, repo:13, ctrl:32) | import/parseFloat/sql`` → +test | ✅ |
| G3 db-in-service | qisman (eslint bor, CI ishlatmaydi) | ✅ ha (payroll.service, fifo.service) | this.db/alias → selector | ✅ |
| G4 schema-uniq | o'rnatilmagan | (script) | — | ✅ |
| G5 stub | qisman (check-no-new-stubs) | ✅ ha (pos-stub, hr-dashboard) | — | ✅ |
| G6 money-test | o'rnatilmagan | ✅ ha (2/17 E2E) | — | ✅ |
| G7 type/size | o'rnatilmagan | ✅ ha (Employee×3, 964-line) | — | ✅ |
| G10 enum-ssot | o'rnatilmagan | ✅ ha (role×3, status×4) | format farq → AST | ✅ |
| G11 fe-be-parity | o'rnatilmagan | ⚠️ script kerak (pension 10×) | inline hisob → AST | ✅ |
| G12 schema-default | o'rnatilmagan | ✅ ha (hr-lms:59-60) | — | ✅ |
| G14 idempotency | o'rnatilmagan | ✅ ha (posMovements:71) | — | ✅ |
| G13 dead-code | o'rnatilmagan | ✅ ha (knip) | dynamic import → knip config | ✅ |
| G15 secret | o'rnatilmagan | ⚠️ gitleaks kerak (.env commit) | — | ✅ |

> "THEATER/o'rnatilmagan" = gate HOZIR mavjud emas yoki CI-blocking emas → **o'rnatish kerak** (quyidagi tasklar).
> "Fires=ha" = gate logikasi mavjud findinglarda otiladi (theater emas, spec to'g'ri).

---

## 4. ENFORCEMENT SETUP TASKLARI (tartibli, ready-to-install)

### ⚡ TASK #1 — RULE ZERO (eng birinchi; busiz qolganlari bypass)
**`.github/workflows/code-quality.yml`**
```yaml
# :54  OLDIN:  run: pnpm --filter @workspace/db run push || true
#      KEYIN:  run: pnpm --filter @workspace/db run push
# :116 OLDIN:  node scripts/update-architecture-rules-doc.mjs || true
#      KEYIN:  node scripts/update-architecture-rules-doc.mjs
# :67,:91 codecov:  fail_ci_if_error: true
```
**`.github/workflows/ci.yml`**
```yaml
# :144 OLDIN: eslint src/ --ext .ts --max-warnings 100
#      KEYIN: eslint src/ --ext .ts --max-warnings 0
# + QO'SHISH (ESLint hozir CI'da to'liq emas): FE+BE lint step
- name: ESLint (BE+FE, gate)
  run: pnpm exec eslint --max-warnings 0 "apps/api/src/**/*.ts" "artifacts/erp-dashboard/src/**/*.{ts,tsx}"
```
**Mahalliy tekshirish:** `pnpm exec eslint --max-warnings 0 ...` → 0 xato bo'lishi kerak (avval mavjud xatolar tuzatilsin yoki ratchet).

### ⚡ TASK #2 — ESLint gate'lar (G3, G1, G7-size, G11)
**`apps/api/.eslintrc.cjs` (override `*.service.ts`):**
```js
// G3 — service'da db.* ban
{ files: ['**/*.service.ts'], rules: { 'no-restricted-syntax': ['error',
  { selector: "MemberExpression[object.name='db']", message: 'Service db.* chaqira olmaydi — repository ishlating (Qoida 15).' },
  { selector: "MemberExpression[property.name=/^(select|insert|update|delete|execute|transaction)$/][object.property.name='db']", message: 'this.db.* TAQIQ — repository orqali.' } ] } }
// G1 — soliq literal ban (service/controller/repo)
{ files: ['**/*.{service,controller,repository}.ts'], excludedFiles: ['**/business.constants.ts'],
  rules: { 'no-restricted-syntax': ['error', { selector: "Literal[value=0.08]", message:'Soliq stavka literal TAQIQ — business.constants import.' }] } }
// G7 — fayl hajmi
'max-lines': ['warn', 900], 'max-lines-per-function': ['warn', 150]
```
> ⚠️ Avval mavjud 17 db.* + soliq literallarni tuzating (Phase 1/5), keyin `error` ga o'tkazing — aks holda CI darhol qizil.

### TASK #3 — Yangi check skriptlari (CI step bilan)
| Script | Vazifa |
|---|---|
| `scripts/check-route-uniqueness.mjs` | @Controller+@Get/@Post path yig'ib dublikat (ratchet=0) |
| `scripts/check-schema-uniqueness.mjs` | pgTable nomi 1 marta + boot raw-DDL grep ban |
| `scripts/check-duplicate-types.mjs` | entity interfeys >1 def |
| `scripts/check-enum-ssot.mjs` | bir xil enum nomi turli qiymat/format |
| `scripts/check-fe-be-parity.mjs` | FE soliq konstanta = BE business.constants |
| `scripts/check-idempotency-guard.mjs` | pul/stok POST endpoint Idempotency-Key + UNIQUE |
> Har biri `ci.yml` ga step sifatida qo'shiladi (`node scripts/check-*.mjs`), exit 1 da merge bloklanadi.

### TASK #4 — Test gate'lar
- `apps/api/test/schema-payroll-defaults.spec.ts` (G12) — schema default = constant.
- `apps/api/test/business-constants.spec.ts` (G1 2-gate) — INPS=0.01, JSHD=0.12.
- Coverage threshold (G6) — gl-posting/payroll/pos-movement/auth path'lariga 80%.

### TASK #5 — Tooling gate'lar
- `knip.json` + `code-quality.yml` step (G13 dead-code).
- `.github/workflows/secrets-scan.yml` (gitleaks) + `.gitignore` `.env` (G15) + **secret rotatsiya (darhol)**.

**Tartib:** #1 (RULE ZERO) → #2 (ESLint, mavjud tuzatilgach) → #3/#4/#5 (parallel). ⚡ = soat ichida.

---

## 5. NEW-CODER RESILIENCE (kontekstsiz ham qaytmaydi)
- **Har gate CI'da server-side ishlaydi** — yangi dasturchi mashinasida hook bo'lmasa ham, GitHub Actions merge'ni bloklaydi.
- **Hech qanday gate inson xotirasiga bog'liq emas** (pre-commit qulaylik, lekin CI yagona haqiqat).
- **Onboarding:** CLAUDE.md faqat quyidagi pointer:

> ### Bu loyiha CI bilan himoyalangan (machine gates)
> Qoidalar hujjatda emas — CI'da. Red gate'ni quyidagicha tuzating:
> - `eslint` red → soliq literal/db.* service'da → `business.constants` import / repository ishlating.
> - `check-schema-uniqueness` red → pgTable dublikat → bitta kanonik ta'rif.
> - `check-fe-be-parity` red → FE soliq hisoblayapti → BE'dan oling.
> - `knip` red → dead kod → o'chiring.
> - `gitleaks` red → secret commit → olib tashlang + rotatsiya.
> To'liq ro'yxat: `.github/workflows/` va `scripts/check-*.mjs`.

**Xulosa:** machine-gate inson intizomidan uzoq yashaydi. RULE ZERO o'rnatilgach, 414 finding sinflari
QAYTA paydo bo'lolmaydi — kim yozishidan qat'iy nazar, CI bloklaydi.
