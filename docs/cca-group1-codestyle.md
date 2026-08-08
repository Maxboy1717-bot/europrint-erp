# CCA Guruh-1 — Kod-uslubi qoidalari (CLAUDE.md A,B,1-23,F1-F4) buzilishlari katalogi

> **Rol:** 🔵 Tahlilchi (QAT'IY READ-ONLY) — hech narsa o'zgartirilmadi, faqat shu hisobot.
> **Sana:** 2026-06-03
> **Loyiha:** `Uzbek-Language-Module` (BE `apps/api/src` · FE `artifacts/erp-dashboard/src`)
> **Metod:** avtoritativ `scripts/reviewer-*.sh` + qo'lda `grep` (har qoida ostida ko'rsatilgan).

---

## ⭐ ASOSIY XULOSA — reviewer raqamlari CLAUDE.md dan ANCHA past (kodbaza tuzatilgan)

CLAUDE.md dagi "Hozirgi holat" raqamlari **ESKIRGAN**. Avtoritativ reviewer skriptlari bugun quyidagini beradi:

| Qoida | CLAUDE.md da yozilgan | Reviewer (bugun, 2026-06-03) | Holat |
|-------|----------------------|------------------------------|-------|
| 1 — Result pattern | **FAIL: 143** | `reviewer-result-pattern.sh` → **PASS 182 / WARN 6 / FAIL 2** | ⬇️ keskin tushgan |
| 2 — Array safety | **FAIL: 678** | `reviewer-array-safety.sh` → **PASS 1168 / FAIL 6** | ⬇️ keskin tushgan |
| 5 — as unknown stub | FAIL: 3 | `reviewer-as-unknown.sh` → **PASS 1 / WARN 1 / FAIL 0** | ✅ |
| 6 — controller logic | (yomon fayllar) | `reviewer-controller-logic.sh` → **PASS 0 violation** | ✅ |
| 7 — process.env | ✅ PASS | `reviewer-process-env.sh` → **PASS 1 / FAIL 0** | ✅ |
| 8/JWT guard | ✅ PASS | `reviewer-jwt-guard.sh` → **PASS / FAIL 0** | ✅ |
| 9 — non-null `!` | 9 ta fayl | `reviewer-non-null.sh` → **PASS 0 assertions** | ✅ |
| 13 — fayl 900+ | `drizzle-kanban-ext.repo.ts` 964 | `reviewer-file-size.sh` → **PASS 0 oversize** | ✅ |
| 15 — db.* service | 4 ta fayl | `reviewer-repository-layer.sh` → **PASS 0 violation** | ✅ |

**Sabab:** raw `grep` reviewer skriptdan "ko'proq" topadi, chunki reviewerlar (a) generated/data fayllarni, (b) thin Drizzle query'larni, (c) `safeCall`/`Result` wrapper'ni, (d) izohli (`NOTE: P3-30`, `LEGACY_NOOP`, `RULE4_EXCEPTION`) joylarni hisobga oladi. **Tasdiq: CLAUDE.md raqamlari (143/678/3) eskirgan — yangi raqamlar yuqorida.**

---

## TOP-LEVEL JADVAL — qoida → sanoq → severity → fix-type

| Qoida | Mavzu | Sanoq (bugun) | Severity | Fix-type | Reviewer/Metod |
|-------|-------|---------------|----------|----------|----------------|
| **A** | Hardcoded secret | **0** (admin.seed tuzatilgan) | — | — | grep `env ?? \|`, `Admin123` |
| **B** | `sql.raw(VAR)` SQL-inj | **0 ekspluatatsion** (11 ta guard'langan) | LOW (defense-in-depth bor) | — (audit-qoldir) | grep `sql.raw(` |
| **1** | Result pattern | **FAIL 2** + 3 `return null` + 3 `throw` | MEDIUM | code-fix (annotate) | reviewer-result-pattern |
| **2** | Array safety | **FAIL 6** | MEDIUM | code-fix (`Array.isArray`) | reviewer-array-safety |
| **3** | Zod DTO | ✅ PASS | — | — | — |
| **4** | Raw SQL cheklov | ~bor (izohli) | LOW | — | — |
| **5** | `as unknown[]` stub | **FAIL 0** (9 ta `as unknown[]` cast, stub emas) | LOW | code-fix (typedExecute) | reviewer-as-unknown |
| **6** | Controller transport-only | **0 violation** (6 fayl thin `db.*`) | LOW | move (ixtiyoriy) | reviewer-controller-logic |
| **7** | process.env→ConfigService | ✅ PASS (33 ta bootstrap/infra) | LOW | — | reviewer-process-env |
| **8** | JWT guard | ✅ PASS | — | — | reviewer-jwt-guard |
| **9** | Non-null `!` | ✅ PASS 0 | — | — | reviewer-non-null |
| **10** | Soxta javob `{}`/`ok:true`/`[]` | **23** (asosan izohli/guard) | MEDIUM | code-fix | grep controllers |
| **13** | Fayl 900+ / funksiya 150+ | **0** (2 generated istisno) | — | — | reviewer-file-size |
| **15** | `db.*` service ichida | **0 violation** (13 fayl, reviewer kechiradi) | LOW | move (ixtiyoriy) | reviewer-repository-layer |
| **16** | `as unknown as T` → typedExecute | **121** | MEDIUM | code-fix (typedExecute) | grep `as unknown as` |
| **17** | `notImplemented()` stub | **121** (mavjud; guard faqat YANGI'ni bloklaydi) | LOW-MED | code-fix (real impl) | grep `notImplemented(` |
| **21/F** | FE inline xom rang | **275** (diff-guard PASS — barchasi pre-existing) | MEDIUM | code-fix (token) | grep `style={{...#/rgba}}` |

> Severity izohi: KRITIK=ekspluatatsion xavf yo'q (B guard'langan, A tuzatilgan). Eng katta **AKTIV** texnik qarz = Qoida 21 (275 inline rang) va Qoida 16 (121 cast) va Qoida 17 (121 stub).

---

## QOIDA A — Hardcoded secret (🔴 KRITIK) → **TUZATILGAN, PASS**

**Sanoq:** 0 ta haqiqiy secret-fallback. **Severity:** — | **Fix-type:** —

- `admin.seed.ts:15-17` — CLAUDE.md `'Admin123!'` fallback **endi yo'q**:
  ```ts
  const RAW_ADMIN_PASSWORD = process.env.ADMIN_SEED_PASSWORD;
  if (...) throw new Error('ADMIN_SEED_PASSWORD env required — set it in .env before seeding');
  ```
  `env.schema.ts:17` Zod bilan `min(8)` majburlaydi. ✅
- `grep "process.env.X ?? | ||"` = **51 ta**, lekin BARCHASI non-secret config default:
  throttle limitlar (`app.module.ts:74-78`), pool min/max (`database.ts:25-27`), log level (`logger.util.ts:14`), redis port (`redis.config.ts:22-24`), JWT `expiresIn` (muddat, secret emas). **Secret fallback YO'Q.**

**Metod:** `grep -rnE "process\.env\.[A-Z_]+ *(\?\?|\|\|)"` + `grep "Admin123\|ADMIN_SEED"`.

---

## QOIDA B — `sql.raw(VAR)` SQL-injection (🔴 KRITIK) → **0 ekspluatatsion**

**Sanoq:** 11 ta `sql.raw(<o'zgaruvchi>)`, **hammasi guard'langan** (literal/whitelist/DDL-prefix). **Severity:** LOW. **Fix-type:** audit-qoldir (kod o'zgartirish shart emas).

Har biri (metod: `grep -rn "sql.raw(" | grep -v literal`):

| Fayl:satr | Argument manbai | Himoya | Verdikt |
|-----------|-----------------|--------|---------|
| `shared/db/schema.ts:120` (`ddlRun`) | `q: string` | `DDL_PREFIX_RE` runtime check (114-119) — DDL keyword bo'lmasa `throw` | ✅ guard'langan |
| `shared/db/invariants.ts:86` | `m.sql` | static `*_MIGRATIONS` massiv + prefix regex check (82-84) | ✅ guard'langan |
| `common/database/ddl-migrations.ts:150,157,241` | `m`/`ddl` | static migration string'lar, `ddlRun` orqali | ✅ literal manba |
| `infrastructure/database/crm-migration.service.ts:92` | `ddl` | static massiv, `ddlRun` | ✅ literal |
| `infrastructure/database/sprint6-migration.service.ts:257` | `ddl` | static massiv, `ddlRun` | ✅ literal |
| `infrastructure/database/sprint2-migration.service.ts:185` | `table/name/definition` | `SPRINT2_CONSTRAINT_DEFINITIONS` static ReadonlyArray; private metod, public caller yo'q (NOTE P3-30 satr 181) | ✅ whitelist |
| `modules/admin/.../admin-extra.repo.ts:122` | (yo'q) | to'liq literal `SELECT DISTINCT ...` string, 0 interpolatsiya (NOTE P3-30 satr 121) | ✅ literal |
| `modules/aisha/.../compare-periods.tool.ts:76,78` | `meta.column/meta.table` | yopiq `ALLOWED` whitelist (revenue/production/defects → fixed jadval/ustun); sanalar `ISO_DATE_RE` + `sql\`${}\`` parametr (60-79) | ✅ whitelist + param |

`legacy.service.ts:28` — bu faqat **izoh** (`SECURITY: PA-S4a — historic sql.raw(rawQuery) refactored away`); endi thin facade, raw-string qabul qiluvchi public metod YO'Q. ✅

**Xulosa:** CLAUDE.md ko'rsatgan 3 ta KRITIK joy (`legacy.service.ts:27`, `schema.ts:86,91`) **tuzatilgan** — endi prefix-guard yoki refactor bilan. Hech bir `sql.raw` foydalanuvchi-kiritgan xom SQL qabul qilmaydi.

---

## QOIDA 1 — Result pattern → reviewer **FAIL 2** (+ kichik qoldiq)

**Sanoq:** reviewer FAIL **2** / WARN 6. Qo'lda: 3 ta `return null` repo + 3 ta `throw new Error` service. **Severity:** MEDIUM. **Fix-type:** code-fix (annotatsiya yoki `Result`ga o'rash).

Reviewer FAIL (metod: `reviewer-result-pattern.sh`):
1. `modules/finance/.../auto-gl-posting.repository.ts:93,104` — `listForMovement`/`getJournal` `Promise<unknown[]>` qaytaradi, `Promise<Result<>>` emas. → **code-fix** (return type'ni Result'ga o'rash).
2. `modules/finance/.../three-way-match.repository.ts:38,69,102` — `update`/`insert`/`listVariances` `Promise<Result<>>` annotatsiyasiz (`Promise<unknown[]>`). → **code-fix**.

Qo'shimcha `return null` repolarda (metod: `grep return null --include=*.repository.ts` = **3**):
- `modules/ai/services/ai-data.repository.ts:67` — `if (!row) return null;`
- `modules/ecommerce/website/website.repository.ts:37` — `if (!existing) return null;`
- `modules/sd/.../sd-quotations.repository.ts:143` — `if (!order) return null;`
  → uchchovi `T | null` qaytaradi (NOT_FOUND uchun `err()` o'rniga); MINOR — Result'ga ko'chirilsa toza.

`throw new Error` service'larda (metod: `grep --include=*.service.ts` = **3**, asosan legit):
- `common/database/drizzle.service.ts:20` — `DATABASE_URL ... required` (bootstrap-fatal, **legit**).
- `infrastructure/database/sprint4-migration.service.ts:40` — migration infra (**legit**).
- `finance-extended/finance-extended-payroll.service.ts:172` — `insert returned no rows` (`safeCall` ichida → Result'ga aylanadi, **borderline**).

---

## QOIDA 2 — Array safety → reviewer **FAIL 6**

**Sanoq:** reviewer FAIL **6** (BE 2 + FE 4). **Severity:** MEDIUM (crash-xavf). **Fix-type:** code-fix (`Array.isArray()` guard).

Backend §1 (metod: `reviewer-array-safety.sh`):
1. `modules/.../warehouse-config.service.ts:84` — `stock.reduce((s,r)=>...)` guard yo'q.
2. `modules/.../weekly-plan.service.ts:61` — `plans.map((p)=>...)` guard yo'q.

Frontend §2:
3. `pages/ProcurementPage.tsx:218` — `worklist.map(...)` (2 satr).
4. `pages/SDDashboard.tsx:166,172` — `segments.reduce(...)` + `segments.map(...)` (4 satr).
5. `pages/WarehouseDashboardPage.tsx:111` — `data.lowStock.map(...)`.
6. `components/ThreeBasketsPanel.tsx:75` — `baskets.map(...)`.

Tuzatish namunasi: `const rows = Array.isArray(x) ? x : []; rows.map(...)`.

---

## QOIDA 5 — `as unknown[]` stub → reviewer **FAIL 0** (9 ta cast, stub EMAS)

**Sanoq:** reviewer FAIL **0**. Qo'lda 9 ta `as unknown[]`, lekin hammasi **real DB natijani cast** (soxta `[] as unknown[]` stub emas). **Severity:** LOW. **Fix-type:** code-fix (typedExecute, ixtiyoriy).

Metod `grep "as unknown\[\]|\[\] as unknown"` — namunalar:
- `modules/compatibility/org-compat.repository.ts:27,45,80,102,126` — `(result.rows ?? result) as unknown[]` (haqiqiy `db.execute` natijasi).
- `modules/hr/.../hr-dashboard.controller.ts:138` — `(items as unknown[]).length` (real `items`).
- `modules/kanban/.../kanban-boards.controller.ts:216,217` — `body.checklistItems as unknown[]` (Zod-validated body).
- `modules/qc/.../qc-defects-extended.controller.ts:55` — `unwrapOrThrow(...) as unknown[]` (real service natijasi).

⭐ Hech biri `[] as unknown[]` soxta-bo'sh stub EMAS — Qoida 5 ruhi (DB'ga bormaydigan soxta data) buzilmagan. CLAUDE.md ko'rsatgan 3 ta (gamification, crm-extended×2) **tuzatilgan**.

---

## QOIDA 6 — Controller transport-only → reviewer **PASS 0 violation**

**Sanoq:** reviewer **0**. Qo'lda 6 fayl `db.*` ishlatadi, lekin **thin query** (biznes-logika/`.reduce` zanjiri emas). **Severity:** LOW. **Fix-type:** move (ixtiyoriy, servisga).

Metod `grep --include=*.controller.ts`:
- `lms-core.controller.ts:142` — `db.insert(lms_support_tickets)` (oddiy insert).
- `mm-purchase-orders.controller.ts:50,73` — `db.select().from(...).limit(50)` (oddiy list).
- `sd-contracts.controller.ts:41` — `db.select().from(sd_contracts)` (oddiy list).
- `pos/employee.controller.ts`, `pp-intelligence.controller.ts`, `sd-customers.controller.ts` — thin select/delegate.

Reviewer bularni kechiradi (qoida `.reduce()` biznes-hisobotni nishonga oladi). Toza arxitektura uchun servisga ko'chirish mumkin, lekin **buzilish emas**.

---

## QOIDA 7 — process.env → ConfigService → reviewer **PASS**

**Sanoq:** reviewer FAIL **0**. Qo'lda 33 ta (bootstrap/infra exclude bilan), lekin reviewer-allowlist'da. **Severity:** LOW. **Fix-type:** —

Qolgan `process.env` joylar **bootstrap/infra qatlam** (ConfigService hali ulanmagan): `main-bootstrap.ts` (CORS/rate-limit/swagger), `sentry.config.ts`, `db-cqrs.ts` (master/slave URL), `shared/db/schema.ts:77` (DB connection), telegram handler'lar (`DIRECTOR_CHAT_ID`, `HR_PORTAL_URL`), `pos.gateway.ts:58` (reviewer "ruxsat berilgan fayl" deydi). Bular ConfigService-dan oldin ishlaydi — qoida ularni istisno qiladi.

---

## QOIDA 10 — Soxta javob → **23 ta** (asosan izohli/guard-early-return)

**Sanoq:** 23 ta `return {}` / `return { ok: true }` / `return { data: [] }` controllerlarda. **Severity:** MEDIUM. **Fix-type:** code-fix (real natija yoki `NOT_IMPLEMENTED`).

Metod `grep "return { ok: true }|return {};|return { data: [] }" --include=*.controller.ts`. Kategoriyalar:
- **Izohli LEGACY_NOOP (legit):** `sd-customers.controller.ts:224,281,331,363` — har biri `// LEGACY_NOOP` + "service.softDelete() does real work; only response shape empty; frontend does not read response" (P3-26 audit tasdiqlagan). Bu **soxta emas** — real ish bajariladi, faqat javob bo'sh.
- **Guard early-return (legit, 3 ta):** `bot-gateway.controller.ts:77,128` (`if (!botSvc) return {}`), `hr-employees-ext.controller.ts:169` (`if (!result.ok) return { data: [] }`) — xato holatda himoya.
- **Tekshirish kerak (potensial soxta):** `chat-uploads.controller.ts:96,107,159` (`return { ok: true }`), `cc-documents.controller.ts:146`, `crm-activities.controller.ts:131`, `crm-companies.controller.ts:156`, `crm-followup-compat.controller.ts:98`, `telegram-bots.controller.ts:79,93,107`, `kanban-boards.controller.ts:107,140` — bular `return { ok: true }`/`{}` haqiqatan ish bajaradimi yoki soxta-muvaffaqiyatmi — har birini alohida tekshirish kerak.

⭐ CLAUDE.md ko'rsatgan `chat.controller.ts:307,315,369` va `sd-customers:111,152,184,204` endi shu satrlarda emas (refactor/izoh qo'shilgan).

---

## QOIDA 13 — Fayl 900+ / funksiya 150+ → reviewer **PASS 0 oversize**

**Sanoq:** reviewer **0**. **Severity:** — | **Fix-type:** —

Qo'lda 2 ta BE fayl >900 topildi, lekin ikkalasi ham **generated/data** (reviewer-allowlist):
- `shared/db/invariants/migrations-drift.ts` — **3632 satr** (auto-gen drift-migration data, logika emas).
- `shared/db/schema-db-only-generated.ts` — **1088 satr** (auto-gen schema, `-generated` suffiks).

FE (`.tsx`/`.ts`): **0 ta fayl >900**. ⭐ CLAUDE.md ko'rsatgan `drizzle-kanban-ext.repo.ts` (964) endi <900 — **bo'lingan/tuzatilgan**.

---

## QOIDA 15 — `db.*` service ichida → reviewer **PASS 0 violation**

**Sanoq:** reviewer **0**. Qo'lda 13 fayl `db.*` ishlatadi. **Severity:** LOW. **Fix-type:** move (ixtiyoriy, repository'ga).

Metod `grep -c --include=*.service.ts` (top):
- `employees-compat-profile-orm.service.ts` (11), `legacy-iot.service.ts` (8), `finance-extended-payroll.service.ts` (7), `ai-decision-log.service.ts` (5), `ai-alerts.service.ts` (4), `interview-link.service.ts` (3), `employee-monthly-card.service.ts` (2), `behavioral-analyzer.service.ts` (2), `mes-monitor.service.ts` (2) ...

Reviewer bularni kechiradi (ko'pi compat/AI-agent/migration servis — repository-pattern istisnosi). CLAUDE.md ko'rsatgan `financial-reports-query.service.ts` (9), `employees-compat-profile.service.ts` (12) endi reviewerda chiqmaydi (refactor yoki repo-ga ko'chirilgan). Toza DDD uchun repository'ga ko'chirilishi mumkin.

---

## QOIDA 16 — `as unknown as T` → `typedExecute<T>` → **121 ta**

**Sanoq:** **121** ta `as unknown as` cast (BE). **Severity:** MEDIUM. **Fix-type:** code-fix (`typedExecute<T>` helper bilan almashtirish — helper `shared/db/typed-execute.ts` da mavjud).

Metod `grep "as unknown as " --include=*.ts | grep -v spec`. Top fayllar:
- `common/database/queries-mm-goods.ts` (9), `modules/hr/payroll/payroll.service.ts` (7), `common/database/queries-technology.ts` (7), `modules/storage/storage.controller.ts` (4), `modules/hr/offboarding/hr-offboarding.service.ts` (4), `marketing-group2.controller.ts` (3), `crm/.../drizzle-lead.repo.ts` (3) ...

CLAUDE.md `pos/repositories/` klasteri (15+) — pos-da hali bir nechta bor (`pos-inventory-passport.service.ts`), lekin asosiy massa endi `common/database/queries-*.ts` da. **Eng katta bitta texnik-qarz nuqtasi.**

---

## QOIDA 17 — `notImplemented()` stub → **121 ta** (mavjud; guard YANGI'ni bloklaydi)

**Sanoq:** **121** ta `notImplemented()` chaqiruvi. **Severity:** LOW-MEDIUM. **Fix-type:** code-fix (real impl) — lekin Qoida 17 mavjudlarini **ruxsat etadi**, faqat `check-no-new-stubs.mjs` YANGI qo'shishni bloklaydi.

Metod `grep "notImplemented(" | grep -v import/function/exceptions`. Fayllar (honest stub — `NOT_IMPLEMENTED` qaytaradi, soxta data EMAS):
- `modules/ai/presentation/ai.controller.ts` (forecast/demand, rush-orders ...), `ai-agents.controller.ts:252`, `design/presentation/design.controller.ts` (notifications/tooling/wear-forecast/messages ...), `compatibility/saas.controller.ts` (tenants/modules/onboard/orders-registry), `europrint-control-director.controller.ts:124`, `warehouse-catalog.controller.ts:92`, `finance-main.controller.ts`, `finance-extended-payroll.controller.ts`, `reports.controller.ts`, `hr.providers.ts` ...

⭐ Bu **halol stub** (Qoida 10 soxta-javobidan farqli — `HttpStatus.NOT_IMPLEMENTED` qaytaradi, soxta `200` emas). Qoida 17 bular bo'yicha "yangi qo'shma" deydi — mavjudlar texnik-qarz, lekin qoidaga zid EMAS.

---

## QOIDA 21 / F — FE inline xom rang → **275 ta** (diff-guard PASS, hammasi pre-existing)

**Sanoq:** **275** ta `style={{ ...#hex / rgba() }}` (`.tsx`). **Severity:** MEDIUM (eng katta AKTIV FE qarz). **Fix-type:** code-fix (`var(--ep-*)` token / semantic Tailwind).

⚠️ `check-design-tokens.mjs` **diff-aware** (`git diff --cached`, satr 57) — faqat YANGI staged xom rangni bloklaydi. To'liq skanda: **"✅ no NEW inline hardcoded colors"** — ya'ni 275 ta **pre-existing**, guard'dan o'tadi, lekin qoida-ruhini buzadi.

Metod `grep "style={{...color/background/rgba:#}}" --include=*.tsx`. Top fayllar (klaster = **POS Monitor sahifalari**):

| Fayl | Inline rang soni |
|------|------------------|
| `pos-monitor/pages/PosKpiDashboard.tsx` | 23 |
| `pos-monitor/pages/PosGoodsReceipts.tsx` | 22 |
| `pos-monitor/pages/PosWarehouses.tsx` | 19 |
| `pos-monitor/pages/PosLotTraceability.tsx` | 16 |
| `pos-monitor/pages/PosReservations.tsx` | 14 |
| `pos-monitor/pages/PosMaterials.tsx` | 14 |
| `pages/crm/EntityCardSections.tsx` | 14 |
| `pos-monitor/pages/PosMaterialBalance.tsx` | 12 |
| `pos-monitor/pages/PosMaterial360.tsx` | 12 |
| `components/aisha/TransparencyPanel.tsx` | 11 |
| `pos-monitor/pages/PosMovements.tsx` | 10 |
| `pages/kanban/KanbanColumn.tsx` + `KanbanCard.tsx` | 9 + 9 |
| `components/aisha/AishaPanel.tsx` | 7 |

⭐ ~60% `pos-monitor/pages/*` da — bitta modul (POS Monitor) tokenlashtirilsa katta qism yopiladi. Qolgani: `aisha/*`, `crm/*`, `kanban/*`.

---

## REVIEWER vs CLAUDE.md — RAQAM MOSLIGI TASDIQI

| CLAUDE.md da | Bugun reviewer | Mos? |
|--------------|----------------|------|
| Result FAIL **143** | **FAIL 2** | ❌ ESKIRGAN — yangi: 2 |
| Array FAIL **678** | **FAIL 6** | ❌ ESKIRGAN — yangi: 6 |
| as-unknown FAIL **3** | **FAIL 0** | ❌ ESKIRGAN — yangi: 0 |

**Yakuniy tasdiq:** CLAUDE.md "Hozirgi holat" jadvali (143/678/3) **ESKIRGAN**. Kodbaza bu raqamlar yozilgandan beri ancha tuzatilgan. Avtoritativ joriy raqamlar: **Result FAIL 2, Array FAIL 6, as-unknown FAIL 0**.

---

## TUZATISH USTUVORLIGI (severity bo'yicha)

1. **🟠 MEDIUM — Qoida 21 (275 inline rang):** eng katta aktiv FE qarz; POS Monitor sahifalaridan boshla (~60%). Token (`var(--ep-*)`)ga ko'chir.
2. **🟠 MEDIUM — Qoida 16 (121 `as unknown as`):** `typedExecute<T>` (mavjud helper) bilan almashtir; `queries-mm-goods.ts`/`payroll.service.ts`/`queries-technology.ts` dan boshla.
3. **🟡 MEDIUM — Qoida 2 (FAIL 6):** 6 ta aniq joyga `Array.isArray()` guard (BE 2 + FE 4) — tez fix.
4. **🟡 MEDIUM — Qoida 1 (FAIL 2):** `auto-gl-posting.repository.ts` + `three-way-match.repository.ts` return type'ni `Result`ga annotate.
5. **🟡 MEDIUM — Qoida 10 (23, ~10 tekshirish):** `chat-uploads`/`crm-*`/`telegram-bots`/`kanban-boards` `return {}` — real ish bajaradimi tekshir; soxta bo'lsa real qil yoki `NOT_IMPLEMENTED`.
6. **🟢 LOW — Qoida 17 (121 stub):** halol stub; vaqt bo'lsa real impl (qoidaga zid emas).
7. **🟢 LOW — Qoida 6/15 (thin db.*):** ixtiyoriy DDD tozalash; reviewer PASS.

> **A va B (KRITIK)** — ekspluatatsion xavf YO'Q: secret-fallback tuzatilgan, `sql.raw` barchasi guard'langan. Aktiv ish talab qilmaydi.

---

*Tahlilchi sessiyasi — READ-ONLY. Faqat shu fayl yozildi (`docs/cca-group1-codestyle.md`). Boshqa hech narsa o'zgartirilmadi.*
