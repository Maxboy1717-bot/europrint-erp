# FAZA 04 — OYLIK KARTADAN (PAYROLL INTEGRATSIYA) — BAJARUVCHI DIREKTIVASI

> **Bajaruvchi:** Muslimbek (bosh-dasturchi nazorati ostida)
> **Manba master-reja:** `docs/audit/MASSIV-100/00-MASTER-REJA.md` (FAZA 4, satr 79-84)
> **Spec:** `docs/audit/decisions/01-org-kartalar.md` (EP-ORG-003/004/008/009/018/024/025/027/052/060/061/066/091/094)
> **Bo'shliqlar manbai:** `docs/audit/ORGSXEMA-INTERVYU-VS-HOLAT-2026-06-25.md` (mavzu "oylik-bonus" 38% mos)
> **Q-47:** Bu direktiva ≥1000 qator — to'liq, batafsil, noaniqliksiz.
> **Tartib:** Bu faza FAZA 0 (kanonik karta-jadval) + FAZA 1 (ko'p-karta+stake_fraction) + FAZA 3 (razryad o'sish) ga BOG'LIQ. Quyida har bog'liqlik uchun "ulanish-nuqta + fallback" aniq ko'rsatilgan.

---

## 0. MAQSAD VA KONTEKST

### 0.1 Vizyon (egasi qarori)

EP-ORG vizyonida **"oylik kartadan keladi"** — bu markaziy mexanizmlardan biri. Bugungi holatda
oylik **`baseSalary` parametridan** (FE forma → controller → handler) keladi: kim qancha kiritsa,
shuncha hisoblanadi. Vizyon talab qiladi:

> **Karta = oylikning manbai.** Har `org_departments` (karta) o'zida:
> - `razryad_level_id` → `razryad_levels.coefficient` (1-razryad=1.00 ... 6-razryad=2.80)
> - `salary_type` (oylik / soat / ishbay)
> - `min_salary` / `max_salary` (oylik bandi — "dan-gacha" oraliq, EP-ORG-045)
> tutadi. Oylik = **razryad-koeffitsient × baza × ulush (stake_fraction)** formula bilan,
> karta-maydonlaridan o'qib hisoblanadi. Xodim parametr sifatida `baseSalary` yubormaydi —
> baza karta/razryad-banddan keladi.

### 0.2 Egasi qarorlari (2026-06-25, master-reja §0)

| # | Qaror | Bu fazaga ta'sir |
|---|-------|------------------|
| **Q1 (EP-ORG-004/066)** | **Ko'p-karta**: 1 xodim → bir nechta karta; oylik = stavka-ulushlar yig'indisi (0.5+0.5≤1.0; oshsa OWNER ruxsati). | `calculate-payroll.handler` har aktiv kartani aylanib chiqib, **stake_fraction bilan ko'paytirib yig'adi.** |
| **Q2 (100%=MEXANIZM)** | razryad-qiymat (`coefficient` seed bor, lekin `org_departments.razryad_level_id`=0/139 to'ldirilgan), oylik-band (`min_salary`/`max_salary`=NULL), baza-oylik = **egasi-data** (productionda 0 dan to'ladi). **FABRIKATSIYA TAQIQ.** | Struktura + gate quriladi; SOXTA baza/koeffitsient yozilmaydi; data yo'q bo'lsa graceful (koeffitsient=1.0, lekin baza majburiy — quyida). |
| **Q3 (EP dizayn)** | Barcha payroll FE sahifa `DIZAYN_QOIDALARI.md` token+shablon bilan izchil; REGRESS-himoya. | FE `CalculatePayrollDialog` razryad-koeffitsient + ulush ko'rsatadi; ishlayotgan preview/forma O'CHMAYDI. |
| **Q4** | Direktiva = master-reja + ketma-ket faza-direktiva ≥1000 qator. | Bu fayl. |

### 0.3 Bu fazaning ZANJIRI (oltin-zanjir)

```
KARTA (org_departments)
  ├─ razryad_level_id ──→ razryad_levels.coefficient   (× koeffitsient)
  ├─ salary_type       (oylik / soat / ishbay)         (qaysi formula)
  ├─ min_salary / max_salary  (oylik bandi)            (baza oraliq + cap)
  └─ employee_cards.stake_fraction (Faza 1)            (× ulush)
        │
        ▼
  calculate-payroll.handler  ──→  KARTA-BO'YICHA-OYLIK
        │  (ko'p-karta → har biriga formula, yig'indi)
        │  + i.o.-ustama (acting_supplement / EP-ORG-060/061)
        │  + pro-rata (kun / EP-ORG-052)
        │  + ishbay-cap (min/max_salary / EP-ORG-094)
        ▼
  ЦКП-gate (Faza 5)  ───────────────┐
  darslik-gate (Faza 7) ────────────┤── ULANISH-NUQTA (bu fazada FAQAT interfeys + flag, qiymat keyingi fazada)
        ▼
  savePayroll() → salary_history (DB)
```

### 0.4 Bu fazada NIMA QILINADI (ko'lam) — qisqacha

1. **Razryad-koeffitsient manbai: `org_functions` → `org_departments`** ga ko'chir (kanonik karta-jadval, FAZA 0 qarori). `getRazryadCoefficient` hozir `employees.org_function_id → org_functions.razryad_level_id` o'qiydi — bu de-routed dunyo.
2. **Karta-bazadan oylik**: `salary_type` + `min_salary`/`max_salary` o'qib, baza kartadan keladigan rejim qo'shiladi (parametr `baseSalary` fallback bo'lib qoladi — regress-himoya).
3. **Ko'p-karta yig'indi**: har aktiv `employee_cards` kartasi uchun (razryad-koeff × baza × stake_fraction), yig'indi.
4. **i.o.-ustama**: `employee_cards.is_acting=true` kartalar uchun `acting_supplement` qo'shiladi (EP-ORG-060/061).
5. **pro-rata**: ishlangan kun / oydagi ish kuni (EP-ORG-052 — kun-gate ulanish).
6. **ishbay-cap**: `salary_type='ishbay'` da natija `min_salary`/`max_salary` oralig'iga clamp (EP-ORG-094).
7. **ЦКП-gate + darslik-gate ulanish-nuqta**: handler interfeysiga `ckpGatePassed?`/`lmsGatePassed?` flag qo'shiladi (default `true` — bu fazada qiymat YO'Q; Faza 5/7 to'ldiradi). **FABRIKATSIYA TAQIQ** — flag default `true`, soxta gate hisobi yo'q.
8. **DB**: `employee_cards.stake_fraction` ustun (agar Faza 1 hali qo'shmagan bo'lsa — guard); `salary_history` ga `razryad_coefficient` + `stake_total` audit ustunlari (APPROVED).
9. **FE**: `CalculatePayrollDialog` natijada razryad-koeffitsient + ulush + ko'p-karta breakdown ko'rsatadi (REGRESS-himoya — preview o'chmaydi).

---

## 1. QOIDALAR-BLOKI (HAR BOSQICHDA MAJBURIY)

> Bu blok har bosqichda amal qiladi. CLAUDE.md Qoida A,B,1-23 + Q-24..Q-47 to'liq kuchda.

### 1.1 Kod uslubi
- **Result<T>** (CLAUDE.md Qoida 1): repo/service metodlari `Promise<Result<T>>`. `throw new Error()` / `return null` YO'Q. `Ok(...)` / `Err(...)` ishlat (`@common/result`).
- **Zod** (Qoida 3): har `@Body()`/`@Query()` Zod schema bilan validate. `class-validator` TAQIQ.
- **Drizzle** (Qoida 4/15): oddiy CRUD = Drizzle ORM. Raw SQL faqat murakkab JOIN/LATERAL — izoh bilan. Service ichida `db.*` to'g'ridan YO'Q (faqat repo orqali). Mavjud payroll repo raw SQL ishlatadi (legacy NOT-NULL ustunlar uchun) — bu **mavjud pattern**, davom ettiriladi, lekin yangi so'rov ORM bo'lsin.
- **Array xavfsizligi** (Qoida 2): `.map/.filter/.reduce/.find` oldidan `Array.isArray()`.
- **Fayl ≤900 qator, funksiya ≤150 qator** (Qoida 13).
- **Magic number** (Qoida 12): formula konstantalari `business.constants.ts` ga (masalan `WORK_DAYS_PER_MONTH=22`, `OVERTIME_RATE_DEFAULT=1.5`). Mavjud `command.baseSalary / 22` da `22` → konstanta.

### 1.2 Regress-himoya (Q-39 / Q-46 — egasi qoidasi)
- **Ishlab turgan + to'g'ri kod O'CHIRILMAYDI.** Hozirgi `calculatePayroll` controller razryad-koeffitsient × baseSalary ishlaydi — **bu o'chmaydi**, kengaytiriladi. FE preview, contract-detail karta, deductions formasi — ishlayotgan, qoladi.
- **`baseSalary` parametri SAQLANADI** — fallback sifatida (karta-baza yo'q bo'lsa). Buni olib tashlash = regress (FE forma buziladi). Faqat **manba prioriteti** o'zgaradi: karta-baza bor → undan, yo'q → parametr.
- **Buzuq/o'lik/dublikat kod TO'LIQ o'chiriladi** (chala emas). `getRazryadCoefficient` ning `org_functions` JOIN'i FAZA 0 dan keyin o'lik bo'ladi — **to'liq `org_departments` ga ko'chiriladi** (ikki manba qoldirilmaydi).
- O'chirishdan oldin: Q-29 verify (haqiqatan ishlamasligini DB+kod bilan tasdiqla) + import-yo'qligini grep bilan tekshir.

### 1.3 Fabrikatsiya TAQIQ (Q-40 / Q-2)
- `org_departments.razryad_level_id`=0/139, `min_salary`/`max_salary`=NULL, baza-oylik=NULL — bu **egasi-data**. SOXTA qiymat (masalan `min_salary=1000000` deb to'ldirish) **TAQIQ.**
- Data yo'q → **graceful**: koeffitsient topilmasa `1.0` (mavjud xulq, saqlanadi); karta-baza yo'q bo'lsa parametr `baseSalary` ishlatiladi. Lekin **hech qachon soxta baza yaratilmaydi.**
- Owner-data ro'yxati §10 da. Egasi to'ldirmaguncha mexanizm 1.0 koeff + parametr-baza bilan ishlaydi (struktura tayyor).

### 1.4 Verify (Q-29 / Q-32 / Q-40)
- Har bosqich oxiri: **`tsc` GREEN** (o'z fayllarda 0 xato) + **END-TO-END rollback-tx DB-proof** (`_audit/bproof-*.cjs`: kirit→oqdi→ko'rindi→ROLLBACK) + **jonli isbot** (`/api/hr/payroll/calculate` 201 + DB-da `salary_history` yozuvi).
- Struktura-only YETARLI EMAS (Q-40): "200 qaytdi" ≠ "to'g'ri". Oylik raqami biznes-qoidaga (razryad × baza × ulush) mos ekanini DB-proof bilan tasdiqla.

### 1.5 Dizayn (Q3 / Qoida 21/41/42/43)
- EP token (`var(--ep-*)`) — xom rang/inline-style TAQIQ. Mavjud `var(--ep-green)` (CalculatePayrollDialog:229) ishlatilmoqda — davom ettir.
- FE = mavjud shablon + props; yangi dizayn YO'Q. Dialog tuzilmasi saqlanadi.
- Forma REAL saqlaydi (F1 loading / F2 onError) — mavjud `useMutation` saqlanadi.

### 1.6 Migration (Q-35)
- `migrations-drift.ts` idempotent: `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, `CREATE ... IF NOT EXISTS`.
- `CREATE TABLE` / `DROP` / yangi ustun faqat **`APPROVED:` izoh** bilan (§5 da har biri APPROVED).

### 1.7 Commit (GIT_QOIDALARI.md / Q-31)
- Faqat o'z fayllar: `git add <aniq-fayl>` — **HECH QACHON `git add -A`**.
- `--no-verify` (pre-commit hook bypass, sabab bilan).
- Co-Authored-By trailer:
```
Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
```
- Har bosqich oxirida commit (yarim ish qoldirilmaydi — Q-33).

### 1.8 KARTA atamasi
- Muloqotda/izohda doim **"karta"** (`org_departments` yozuvi) — "node"/"otdeleniye"/"funksiya" EMAS.

---

## 2. JORIY HOLAT (fayl:satr + DB-fakt — JONLI tasdiqlangan 2026-06-25)

### 2.1 Backend fayllar (HAQIQIY, o'qilgan)

| Fayl | Satr | Hozirgi holat |
|------|------|---------------|
| `apps/api/src/modules/hr/application/commands/calculate-payroll.handler.ts` | 19-27 | `CalculatePayrollCommand` — `baseSalary: number` **parametr** sifatida tutadi (vizyon: kartadan kelishi kerak). |
| ⤷ | 38-64 | `execute()` — org-assignment gate (`findUserIdByEmployee` + `hasAnyOrgAssignment`) bor. **Razryad-koeffitsient YO'Q** (handler'da). |
| ⤷ | 66-72 | Gross = `baseSalary/22 → dailyRate`, `overtimePay`, `grossSalary = baseSalary + overtimePay + bonus`. **Magic `22`.** **Razryad-koeff ko'paytmasi YO'Q.** |
| ⤷ | 77-85 | `savePayroll({ employeeId, periodStart, periodEnd, baseSalary, netSalary, bonus, otherDeductions })`. |
| `apps/api/src/modules/hr/presentation/hr-payroll.controller.ts` | 71-116 | `POST hr/payroll/calculate` — **razryad-koeffitsient SHU YERDA qo'llaniladi** (controller'da, handler'da emas). `razryadCoeff = await this.hrRepo.getRazryadCoefficient(body.employeeId)` (97), `effectiveSalary = body.baseSalary * razryadCoeff` (98). |
| ⤷ | 99-103 | `dailyRate=effectiveSalary/22`, `overtimePay`, `grossSalary`, `netSalary`. **Magic `22`. Ko'p-karta YO'Q. salary_type YO'Q. stake_fraction YO'Q. i.o./pro-rata/cap YO'Q.** |
| ⤷ | 105-115 | `savePayroll(...)` + javobda `razryadCoefficient` qaytaradi. |
| `apps/api/src/modules/hr/infrastructure/repositories/drizzle-hr.repo.ts` | 411-426 | `getRazryadCoefficient()` — **`employees.org_function_id → org_functions.razryad_level_id → razryad_levels.coefficient`** (DE-ROUTED dunyo `org_functions`, kanonik EMAS). Fallback `1.0`. |
| ⤷ | 64-97 | `savePayroll()` — `salary_history` INSERT (raw SQL, legacy NOT-NULL ustunlar). |
| `apps/api/src/modules/hr/presentation/dto/hr.dto.ts` | 53-62 | `HrCalculatePayrollSchema` — `employeeId`, `baseSalary` (**majburiy positive**), `period?`, `overtimeHours?`, `overtimeRate?`, `bonus?`, `otherDeductions?`. |
| `apps/api/src/modules/hr/domain/repositories/i-hr.repo.ts` | 21, 81 | `savePayroll(payroll): Promise<Result<HrRow>>`, `getRazryadCoefficient(employeeId): Promise<number>`. |

> ⚠️ **MUHIM KASHFIYOT**: razryad-koeffitsient logikasi **HANDLER'da emas, CONTROLLER'da** yozilgan
> (`hr-payroll.controller.ts:97-98`). Master-reja "calculate-payroll.handler → razryad-koeff×baza"
> deydi — lekin haqiqatda handler hali parametr-baza ishlatadi va razryad-koeff controller'da.
> **Qaror (bosh-dasturchi):** Biznes-formula **`PayrollCalculatorService`** ga (yangi, application-layer)
> ko'chiriladi — controller faqat transport bo'lsin (Qoida 6 — controller'da biznes logika TAQIQ).
> Handler ham shu servisni chaqiradi. Bu ikki nusxa (handler ╳ controller) formulani **birlashtiradi.**

### 2.2 DB-fakt (JONLI tasdiqlangan — `node _audit/q.cjs`)

| Jadval / ustun | Fakt | Manba |
|----------------|------|-------|
| `razryad_levels` | 6 razryad: id 5-10, `coefficient` 1.00/1.25/1.55/1.90/2.30/2.80; `salary_min`/`salary_max`=NULL | `SELECT id,level,name,coefficient FROM razryad_levels` |
| `org_departments` (karta) | 139 aktiv; `razryad_level_id`, `salary_type`, `min_salary`, `max_salary`, `rbac_tier` ustunlari **MAVJUD** | `information_schema.columns` |
| ⤷ to'ldirilganlik | **`razryad_level_id`=0/139, `salary_type`=0/139, `min_salary`=0/139, `max_salary`=0/139** (HAMMASI NULL — owner-data) | `SELECT count(razryad_level_id)... FROM org_departments WHERE is_active` |
| `employees.org_function_id` | 30/30 to'ldirilgan (hozirgi koeff-path shundan o'qiydi) | `SELECT count(org_function_id) FROM employees` |
| `employee_cards` | 30 qator, 30 xodim; ustunlar: `employee_id, card_id, is_primary, is_active, is_acting, acting_supplement`. **`stake_fraction` YO'Q** | `information_schema.columns` |
| ⤷ `card_id` FK | **→ `org_functions.id`** (kanonik `org_departments` EMAS — FAZA 0 re-point qiladi) | `information_schema FK` |
| `salary_history` | MAVJUD; ustunlar: `base_salary, salary_earned, total_bonuses, other_bonuses` bor. **`razryad_coefficient`, `stake_total`, `proration_days` YO'Q** | `information_schema.columns` |

### 2.3 Frontend (HAQIQIY, o'qilgan)

| Fayl | Satr | Holat |
|------|------|-------|
| `artifacts/erp-dashboard/src/pages/payroll/CalculatePayrollDialog.tsx` | 59-72 | `useMutation` → `POST /api/finance-extended/payroll/calculate` (⚠️ **boshqa endpoint** — `hr/payroll/calculate` EMAS; ikki payroll-oqimi bor). |
| ⤷ | 74-89 | `calculatePreview` — `payType` (fixed/hourly/piecework) bo'yicha local hisob; `var(--ep-green)` ishlatadi (229). |
| ⤷ | 138-180 | Contract-detail karta (payType, baseSalary, hourlyRate, pieceworkRate, minWageGuarantee). |
| ⤷ | 210-234 | Preview karta (grossPay, totalDeductions, netPay). **Razryad-koeff/ulush KO'RSATILMAYDI.** |

> ⚠️ **Ikki payroll FE-oqimi**: `CalculatePayrollDialog` → `finance-extended/payroll/calculate`; `hr-payroll.controller` → `hr/payroll/calculate`. Bu fazada **`hr/payroll/calculate`** kanonik (karta-asosli). FE breakdown shu endpoint javobini ko'rsatadi. `finance-extended` oqimi **regress-himoya** ostida — TEGILMAYDI (ishlayapti, boshqa faza). FE faqat `hr/payroll` natijasini boyitadi.

---

## 3. BOSQICHMA-BOSQICH IMPLEMENTATSIYA

> Har bosqich: **fayl · OLDIN kod · KEYIN kod · sabab.** Har bosqich oxirida tsc + commit.

---

### BOSQICH 1 — Konstantalar (magic number → business.constants.ts)

**Fayl:** `apps/api/src/common/constants/business.constants.ts`

**Sabab:** CLAUDE.md Qoida 12 — formula raqamlari (`22`, `1.5`, `8`) nom bilan saqlanadi. Keyingi bosqichlar shularni ishlatadi.

**KEYIN (qo'shiladigan kod — fayl oxiriga):**
```typescript
// ── Payroll (karta-asosli oylik) — FAZA 04 ─────────────────────────────
/** O'rtacha oydagi ish kunlari (oylik → kunlik stavka). */
export const WORK_DAYS_PER_MONTH = 22;
/** Bir ish kunidagi soatlar (kunlik → soatlik stavka). */
export const WORK_HOURS_PER_DAY = 8;
/** Standart ortiqcha-soat koeffitsienti (1.5×). */
export const OVERTIME_RATE_DEFAULT = 1.5;
/** Razryad-koeffitsient topilmaganda standart (fabrikatsiya emas — neytral 1×). */
export const RAZRYAD_COEFF_DEFAULT = 1.0;
/** Ulush (stake_fraction) topilmaganda standart (to'liq stavka). */
export const STAKE_FRACTION_DEFAULT = 1.0;
/** Ko'p-karta ulush yig'indisi shu chegaradan oshsa — owner ruxsati shart (EP-ORG-066). */
export const STAKE_SUM_MAX = 1.0;
```

**Self-verify:** `pnpm --filter @europrint/api exec tsc --noEmit` → 0 xato shu faylda.

**Commit:** `git add apps/api/src/common/constants/business.constants.ts && git commit --no-verify -m "feat(payroll): faza-04 payroll konstantalari (ish-kun/soat/overtime/razryad/stake)"`

---

### BOSQICH 2 — Karta-asosli razryad + baza manbai (repo: org_functions → org_departments)

**Fayl:** `apps/api/src/modules/hr/infrastructure/repositories/drizzle-hr.repo.ts`

**Sabab:** Kanonik karta-jadval = `org_departments` (FAZA 0). Hozir koeffitsient de-routed `org_functions` dan o'qiladi. Bundan tashqari, oylik **bazasi** ham kartadan (`min_salary`/`max_salary`) kelishi kerak — vizyon "oylik kartadan".

**Bog'liqlik (FAZA 0):** `employees` xodimni kartaga `employee_cards.card_id` orqali bog'laydi; `card_id` FK hozir `org_functions` ga. FAZA 0 buni `org_departments` ga re-point qiladi. **Bu fazada ulanish-nuqta:** so'rov `employee_cards → org_departments` ni nazarda tutadi; agar FAZA 0 hali ko'chirmagan bo'lsa, `employees.org_function_id → org_departments` bog'lanishini ham qo'llab-quvvatlovchi COALESCE-JOIN yoziladi (graceful, regress-himoya). **Aniq JONLI tekshir:** `node _audit/q.cjs "SELECT conname, confrelid::regclass FROM pg_constraint WHERE conrelid='employee_cards'::regclass AND contype='f'"` — agar `org_departments` chiqsa, faqat shu yo'lni qoldir.

**OLDIN (drizzle-hr.repo.ts:411-426):**
```typescript
  async getRazryadCoefficient(employeeId: number): Promise<number> {
    try {
      const rows = await runQuery<{ coefficient: string | null }>(sql`
        SELECT COALESCE(rl.coefficient, 1.0)::numeric AS coefficient
        FROM employees e
        LEFT JOIN org_functions ofn ON ofn.id = e.org_function_id
        LEFT JOIN razryad_levels rl ON rl.id = ofn.razryad_level_id
        WHERE e.id = ${employeeId}
        LIMIT 1
      `);
      const coeff = parseFloat(String(rows.rows[0]?.coefficient ?? '1'));
      return isNaN(coeff) || coeff <= 0 ? 1.0 : coeff;
    } catch {
      return 1.0;
    }
  }
```

**KEYIN (yangi — KARTA-bo'yicha + ko'p-karta qatorlar):**
```typescript
  /**
   * @deprecated FAZA 04: bitta koeffitsient o'rniga getEmployeeCardsForPayroll() ishlat.
   * Saqlanadi (regress): eski chaqiruvlar buzilmasin, lekin yangi formula kartalar bo'yicha ishlaydi.
   * Manba: KARTA (org_departments) → razryad_levels.coefficient. org_functions YO'Q (FAZA 0).
   */
  async getRazryadCoefficient(employeeId: number): Promise<number> {
    try {
      const rows = await runQuery<{ coefficient: string | null }>(sql`
        SELECT COALESCE(MAX(rl.coefficient), 1.0)::numeric AS coefficient
        FROM employee_cards ec
        JOIN org_departments od ON od.id = ec.card_id
        LEFT JOIN razryad_levels rl ON rl.id = od.razryad_level_id
        WHERE ec.employee_id = ${employeeId}
          AND ec.is_active = true
        LIMIT 1
      `);
      const coeff = parseFloat(String(rows.rows[0]?.coefficient ?? '1'));
      return isNaN(coeff) || coeff <= 0 ? 1.0 : coeff;
    } catch {
      return 1.0;
    }
  }

  /**
   * FAZA 04 — KARTA-asosli oylik manbai. Xodimning HAR aktiv kartasi uchun bitta qator.
   * Ko'p-karta (EP-ORG-004/066): har karta — razryad-koeff + baza-band + ulush (stake_fraction) + i.o.
   * Fabrikatsiya TAQIQ: razryad_level_id/min_salary NULL bo'lsa NULL qaytadi (servis fallback qiladi).
   */
  async getEmployeeCardsForPayroll(employeeId: number): Promise<Result<PayrollCardRow[]>> {
    try {
      const rows = await runQuery<PayrollCardRow>(sql`
        SELECT
          ec.card_id                               AS card_id,
          od.name                                  AS card_name,
          COALESCE(rl.coefficient, NULL)::numeric  AS coefficient,
          od.salary_type                           AS salary_type,
          od.min_salary                            AS min_salary,
          od.max_salary                            AS max_salary,
          COALESCE(ec.stake_fraction, 1.0)::numeric AS stake_fraction,
          ec.is_acting                             AS is_acting,
          COALESCE(ec.acting_supplement, 0)::numeric AS acting_supplement
        FROM employee_cards ec
        JOIN org_departments od ON od.id = ec.card_id
        LEFT JOIN razryad_levels rl ON rl.id = od.razryad_level_id
        WHERE ec.employee_id = ${employeeId}
          AND ec.is_active = true
        ORDER BY ec.is_primary DESC, ec.card_id ASC
      `);
      return Ok(Array.isArray(rows.rows) ? rows.rows : []);
    } catch (error: unknown) {
      this.logger.error(`getEmployeeCardsForPayroll: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }
```

> **DIQQAT (stake_fraction guard):** `ec.stake_fraction` ustuni FAZA 1 da qo'shiladi. JONLI fakt: hozir **YO'Q** (`employee_cards` da `stake_fraction` topilmadi). Shuning uchun BOSQICH 3 (DB-migration) `stake_fraction` ni idempotent qo'shadi (agar Faza 1 hali qo'shmagan bo'lsa). So'rovda `COALESCE(ec.stake_fraction, 1.0)` — ustun bo'lmasa SQL crash beradi, shuning uchun **avval BOSQICH 3 migration ishlatiladi**, keyin bu so'rov. Tartib: 3 → 2.

**Tip (yangi, repo faylga yoki `*Types.ts` ga):**
```typescript
export interface PayrollCardRow {
  card_id: number;
  card_name: string | null;
  coefficient: string | null;       // numeric → string (Drizzle); NULL = razryad biriktirilmagan
  salary_type: string | null;       // 'oylik' | 'soat' | 'ishbay' | null
  min_salary: string | null;        // numeric → string; NULL = band yo'q (owner-data)
  max_salary: string | null;
  stake_fraction: string;           // numeric, default '1.0'
  is_acting: boolean;
  acting_supplement: string;        // numeric, default '0'
}
```

**i-hr.repo.ts interfeysiga qo'shish (domain/repositories/i-hr.repo.ts):**
```typescript
  getRazryadCoefficient(employeeId: number): Promise<number>;          // mavjud — saqlanadi
  getEmployeeCardsForPayroll(employeeId: number): Promise<Result<PayrollCardRow[]>>;  // YANGI
```

**Self-verify:** tsc GREEN; `node _audit/q.cjs` bilan so'rovni JONLI sinash (quyida BOSQICH 6 DB-proof).

**Commit:** `git add apps/api/src/modules/hr/infrastructure/repositories/drizzle-hr.repo.ts apps/api/src/modules/hr/domain/repositories/i-hr.repo.ts && git commit --no-verify -m "feat(payroll): karta-asosli razryad+baza manbai (org_functions→org_departments, ko'p-karta qatorlar)"`

---

### BOSQICH 3 — DB migration (stake_fraction guard + salary_history audit ustunlari)

**Fayl:** `apps/api/src/shared/db/migrations-drift.ts` (idempotent migration ro'yxati)

**Sabab:** (a) `employee_cards.stake_fraction` BOSQICH 2 so'rovi uchun zarur (Faza 1 hali qo'shmagan bo'lsa). (b) `salary_history` ga oylik-buzilishini audit qilish uchun `razryad_coefficient` + `stake_total` + `proration_days`. Q-35: APPROVED izoh majburiy.

**KEYIN (migration bloki — idempotent, APPROVED):**
```typescript
// ── FAZA 04 — Payroll karta-asosli (APPROVED: owner Q1/Q2 2026-06-25, master-reja FAZA 4) ──
// stake_fraction — Faza 1 ulushi; bu yerda guard (agar Faza 1 hali qo'shmagan bo'lsa idempotent qo'shadi)
await db.execute(sql.raw(`
  ALTER TABLE employee_cards
    ADD COLUMN IF NOT EXISTS stake_fraction numeric(4,3) NOT NULL DEFAULT 1.000
`));
// salary_history — oylik buzilishi audit (razryad-koeff, ulush-yig'indi, pro-rata kun)
await db.execute(sql.raw(`
  ALTER TABLE salary_history
    ADD COLUMN IF NOT EXISTS razryad_coefficient numeric(5,2),
    ADD COLUMN IF NOT EXISTS stake_total numeric(4,3),
    ADD COLUMN IF NOT EXISTS proration_days integer
`));
```

> **APPROVED izoh majburiy** (Q-35 / `scripts/check-unauthorized-migration.mjs`). Yangi jadval YO'Q — faqat `ADD COLUMN IF NOT EXISTS` (mavjud jadvallarga). `stake_fraction` Faza 1 bilan kelishilgan — `IF NOT EXISTS` ikki marta qo'shilishidan himoya qiladi.

**Self-verify (JONLI):**
```bash
node _audit/q.cjs "SELECT column_name FROM information_schema.columns WHERE table_name='employee_cards' AND column_name='stake_fraction'"
node _audit/q.cjs "SELECT column_name FROM information_schema.columns WHERE table_name='salary_history' AND column_name IN ('razryad_coefficient','stake_total','proration_days')"
```
Migration ishga tushir: backend dev rejimda migration auto-run; yoki `pnpm --filter @europrint/api run migrate` (mavjud bo'lsa). Ustunlar paydo bo'lganini tasdiqla.

**Commit:** `git add apps/api/src/shared/db/migrations-drift.ts && git commit --no-verify -m "feat(payroll): stake_fraction guard + salary_history audit ustunlar (APPROVED faza-04)"`

---

### BOSQICH 4 — PayrollCalculatorService (formula bir joyda — controller'dan ko'chirish)

**Fayl (yangi):** `apps/api/src/modules/hr/application/services/payroll-calculator.service.ts`

**Sabab:** Qoida 6 — controller faqat transport. Hozir formula `hr-payroll.controller.ts:93-115` da (biznes logika controller'da). Handler'da ham takror. **Bitta servis** — controller + handler shuni chaqiradi (Q-46: dublikat to'liq olib tashlanadi, bitta haqiqat manbai). Ko'p-karta yig'indi, salary_type, i.o., pro-rata, cap, gate-flag — hammasi shu yerda.

**KEYIN (to'liq yangi fayl — ≤150 satr funksiya qoidasiga rioya, bo'lib yozilgan):**
```typescript
/**
 * @module payroll-calculator.service
 * @description FAZA 04 — KARTA-asosli oylik hisoblash. Yagona formula manbai (controller+handler shuni chaqiradi).
 *
 * Formula (EP-ORG-004/024/052/060/066/094):
 *   Har AKTIV karta uchun:
 *     base   = karta-baza (min_salary..max_salary oraliq nuqtasi) YOKI fallback inputBaseSalary
 *     coeff  = razryad_levels.coefficient (karta razryad_level_id'dan) YOKI 1.0
 *     stake  = employee_cards.stake_fraction (0..1) YOKI 1.0
 *     cardPay = base * coeff * stake
 *     + i.o.-ustama (is_acting → acting_supplement)
 *   gross  = SUM(cardPay) + overtimePay + bonus
 *   gross  = gross * (proration_days / WORK_DAYS_PER_MONTH)   [pro-rata]
 *   ishbay: cardPay min_salary..max_salary oralig'iga clamp
 *   ckpGate/lmsGate = false → o'sha kun/karta oyligi 0 (Faza 5/7 flag beradi; hozir default true)
 *   net    = gross - otherDeductions   (ERP gross-only; soliq 1C da)
 */
import { Injectable, Logger } from '@nestjs/common';
import { Result, Ok, Err } from '@common/result';
import {
  WORK_DAYS_PER_MONTH, WORK_HOURS_PER_DAY, OVERTIME_RATE_DEFAULT,
  RAZRYAD_COEFF_DEFAULT, STAKE_FRACTION_DEFAULT,
} from '@common/constants/business.constants';
import type { PayrollCardRow } from '../../infrastructure/repositories/drizzle-hr.repo';

export interface PayrollCalcInput {
  cards: PayrollCardRow[];          // BOSQICH 2 repo natijasi
  inputBaseSalary: number;          // fallback baza (karta-band yo'q bo'lsa) — REGRESS-himoya
  overtimeHours: number;
  overtimeRate: number;
  bonus: number;
  otherDeductions: number;
  prorationDays: number;            // ishlangan kun (default WORK_DAYS_PER_MONTH)
  ckpGatePassed: boolean;           // Faza 5 ulanish-nuqta (default true)
  lmsGatePassed: boolean;           // Faza 7 ulanish-nuqta (default true)
}

export interface PayrollCardBreakdown {
  cardId: number;
  cardName: string | null;
  base: number;
  coefficient: number;
  stakeFraction: number;
  actingSupplement: number;
  cardPay: number;
}

export interface PayrollCalcResult {
  perCard: PayrollCardBreakdown[];
  stakeTotal: number;
  razryadCoeffMax: number;
  grossSalary: number;
  netSalary: number;
  prorationDays: number;
  gateBlocked: boolean;
}

@Injectable()
export class PayrollCalculatorService {
  private readonly logger = new Logger(PayrollCalculatorService.name);

  calculate(input: PayrollCalcInput): Result<PayrollCalcResult> {
    const cards = Array.isArray(input.cards) ? input.cards : [];
    // Gate (Faza 5/7): biror gate false → bloklangan (bu fazada default true, fabrikatsiya yo'q)
    const gateBlocked = input.ckpGatePassed === false || input.lmsGatePassed === false;

    const perCard: PayrollCardBreakdown[] = cards.map((c) => this.calcCard(c, input.inputBaseSalary));
    const stakeTotal = perCard.reduce((s, c) => s + c.stakeFraction, 0);
    const razryadCoeffMax = perCard.reduce((m, c) => Math.max(m, c.coefficient), RAZRYAD_COEFF_DEFAULT);

    // Karta yo'q (employee_cards bo'sh) → fallback: bitta neytral karta (regress: eski xulq)
    const cardSum = perCard.length > 0
      ? perCard.reduce((s, c) => s + c.cardPay, 0)
      : input.inputBaseSalary * RAZRYAD_COEFF_DEFAULT * STAKE_FRACTION_DEFAULT;

    const dailyRate = cardSum / WORK_DAYS_PER_MONTH;
    const overtimePay = (input.overtimeHours || 0) * (dailyRate / WORK_HOURS_PER_DAY) * (input.overtimeRate || OVERTIME_RATE_DEFAULT);
    let gross = cardSum + overtimePay + (input.bonus || 0);

    // Pro-rata (EP-ORG-052): ishlangan kun / oydagi ish kuni
    const days = Number.isFinite(input.prorationDays) && input.prorationDays > 0
      ? Math.min(input.prorationDays, WORK_DAYS_PER_MONTH)
      : WORK_DAYS_PER_MONTH;
    gross = gross * (days / WORK_DAYS_PER_MONTH);

    // Gate bloklangan → gross 0 (Faza 5/7 ishga tushgach amaliy)
    if (gateBlocked) gross = 0;

    const net = gross - (input.otherDeductions || 0);
    if (!Number.isFinite(net)) return Err({ code: 'INTERNAL', message: 'Oylik hisobi NaN' });

    return Ok({
      perCard, stakeTotal, razryadCoeffMax,
      grossSalary: this.round(gross), netSalary: this.round(net),
      prorationDays: days, gateBlocked,
    });
  }

  /** Bitta karta uchun to'lov: base × coeff × stake (+ ishbay-cap + i.o.). */
  private calcCard(c: PayrollCardRow, inputBaseSalary: number): PayrollCardBreakdown {
    const coeff = this.num(c.coefficient, RAZRYAD_COEFF_DEFAULT);
    const stake = this.num(c.stake_fraction, STAKE_FRACTION_DEFAULT);
    const minS = this.num(c.min_salary, NaN);
    const maxS = this.num(c.max_salary, NaN);
    // KARTA-baza: oylik bandi o'rtasi (min+max)/2; band yo'q → fallback input (REGRESS)
    let base: number;
    if (Number.isFinite(minS) && Number.isFinite(maxS)) base = (minS + maxS) / 2;
    else if (Number.isFinite(minS)) base = minS;
    else base = inputBaseSalary;   // fabrikatsiya emas — kiritilgan parametr

    let cardPay = base * coeff * stake;
    // Ishbay-cap (EP-ORG-094): salary_type='ishbay' → min..max oralig'iga clamp
    if (c.salary_type === 'ishbay') {
      if (Number.isFinite(minS)) cardPay = Math.max(cardPay, minS);
      if (Number.isFinite(maxS)) cardPay = Math.min(cardPay, maxS);
    }
    // i.o.-ustama (EP-ORG-060/061)
    const actSup = c.is_acting ? this.num(c.acting_supplement, 0) : 0;
    cardPay += actSup;

    return {
      cardId: c.card_id, cardName: c.card_name,
      base: this.round(base), coefficient: coeff, stakeFraction: stake,
      actingSupplement: this.round(actSup), cardPay: this.round(cardPay),
    };
  }

  private num(v: unknown, fallback: number): number {
    const n = parseFloat(String(v ?? ''));
    return Number.isFinite(n) ? n : fallback;
  }
  private round(n: number): number { return Math.round(n * 100) / 100; }
}
```

**Modulda ro'yxatdan o'tkazish** — `apps/api/src/modules/hr/hr.providers.ts` (yoki `hr.module.ts` providers): `PayrollCalculatorService` ni `providers` ro'yxatiga qo'sh (JONLI tekshir: `hr.providers.ts` da `calculate-payroll` mavjud — shu yonida). Aniq joyni grep bilan top: `grep -n "CalculatePayrollHandler" apps/api/src/modules/hr/hr.providers.ts`.

**Self-verify:** tsc GREEN. Unit-test (BOSQICH 7).

**Commit:** `git add apps/api/src/modules/hr/application/services/payroll-calculator.service.ts apps/api/src/modules/hr/hr.providers.ts && git commit --no-verify -m "feat(payroll): PayrollCalculatorService — yagona karta-asosli formula (ko'p-karta/salary_type/i.o./pro-rata/cap/gate)"`

---

### BOSQICH 5 — Controller'ni servisga ulash (formula controller'dan ko'chadi)

**Fayl:** `apps/api/src/modules/hr/presentation/hr-payroll.controller.ts`

**Sabab:** Qoida 6 (controller transport-only) + Q-46 (dublikat formula olib tashlanadi). Controller endi `getEmployeeCardsForPayroll` + `PayrollCalculatorService.calculate` chaqiradi. `baseSalary` parametri **saqlanadi** (fallback — regress).

**OLDIN (hr-payroll.controller.ts:93-115):**
```typescript
    const period         = body.period ?? _time.now().toISOString().slice(0, 7);
    const overtimeRate   = body.overtimeRate ?? 1.5;
    const razryadCoeff   = await this.hrRepo.getRazryadCoefficient(body.employeeId);
    const effectiveSalary = body.baseSalary * razryadCoeff;
    const dailyRate      = effectiveSalary / 22;
    const overtimePay    = (body.overtimeHours ?? 0) * (dailyRate / 8) * overtimeRate;
    const grossSalary    = effectiveSalary + overtimePay + (body.bonus ?? 0);
    const netSalary      = grossSalary - (body.otherDeductions ?? 0);

    const result = await this.hrRepo.savePayroll({
      employeeId:    body.employeeId,
      periodStart:   new Date(`${period}-01`),
      periodEnd:     new Date(new Date(`${period}-01`).setMonth(new Date(`${period}-01`).getMonth() + 1) - MS_PER_DAY),
      baseSalary:    effectiveSalary,
      netSalary,
      bonus:         body.bonus ?? 0,
      otherDeductions: body.otherDeductions ?? 0,
    });
    assertOk(result);
    return { ...result.data, grossSalary, netSalary, period, razryadCoefficient: razryadCoeff };
```

**KEYIN:**
```typescript
    const period = body.period ?? _time.now().toISOString().slice(0, 7);

    // KARTA-asosli: xodimning aktiv kartalarini o'qi (razryad-koeff + baza-band + ulush + i.o.)
    const cardsR = await this.hrRepo.getEmployeeCardsForPayroll(body.employeeId);
    assertOk(cardsR);

    // Yagona formula servisi (controller transport-only — Qoida 6)
    const calcR = this.payrollCalc.calculate({
      cards:            cardsR.data,
      inputBaseSalary:  body.baseSalary,                 // fallback baza (karta-band yo'q bo'lsa)
      overtimeHours:    body.overtimeHours ?? 0,
      overtimeRate:     body.overtimeRate ?? OVERTIME_RATE_DEFAULT,
      bonus:            body.bonus ?? 0,
      otherDeductions:  body.otherDeductions ?? 0,
      prorationDays:    body.prorationDays ?? WORK_DAYS_PER_MONTH,
      ckpGatePassed:    body.ckpGatePassed ?? true,      // Faza 5 ulanish (default true — fabrikatsiya yo'q)
      lmsGatePassed:    body.lmsGatePassed ?? true,      // Faza 7 ulanish
    });
    assertOk(calcR);
    const calc = calcR.data;

    const periodStart = new Date(`${period}-01`);
    const periodEnd = new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, 0);
    const result = await this.hrRepo.savePayroll({
      employeeId:        body.employeeId,
      periodStart,
      periodEnd,
      baseSalary:        calc.grossSalary,               // saqlangan baza-ustun = gross (mavjud xulq)
      netSalary:         calc.netSalary,
      bonus:             body.bonus ?? 0,
      otherDeductions:   body.otherDeductions ?? 0,
      razryadCoefficient: calc.razryadCoeffMax,          // audit ustun (BOSQICH 3)
      stakeTotal:        calc.stakeTotal,
      prorationDays:     calc.prorationDays,
    });
    assertOk(result);
    return {
      ...result.data,
      grossSalary: calc.grossSalary,
      netSalary: calc.netSalary,
      period,
      razryadCoefficient: calc.razryadCoeffMax,
      stakeTotal: calc.stakeTotal,
      perCard: calc.perCard,                              // FE breakdown (BOSQICH 8)
      gateBlocked: calc.gateBlocked,
    };
```

**Constructor + import qo'shish:**
```typescript
import { PayrollCalculatorService } from '../application/services/payroll-calculator.service';
import { OVERTIME_RATE_DEFAULT, WORK_DAYS_PER_MONTH } from '@common/constants/business.constants';
// ...
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    @Inject(HR_REPO) private readonly hrRepo: IHrRepo,
    private readonly payrollCalc: PayrollCalculatorService,   // YANGI
  ) {}
```

**DTO kengaytirish** — `hr.dto.ts:53-61`:
```typescript
export const HrCalculatePayrollSchema = z.object({
  employeeId:      z.number().int().positive(),
  baseSalary:      z.number().positive(),           // SAQLANADI (fallback baza — regress)
  period:          z.string().optional(),
  overtimeHours:   z.number().min(0).optional(),
  overtimeRate:    z.number().positive().optional(),
  bonus:           z.number().min(0).optional(),
  otherDeductions: z.number().min(0).optional(),
  prorationDays:   z.number().int().min(0).max(31).optional(),   // YANGI (pro-rata)
  ckpGatePassed:   z.boolean().optional(),                       // YANGI (Faza 5 ulanish)
  lmsGatePassed:   z.boolean().optional(),                       // YANGI (Faza 7 ulanish)
});
```

**`savePayroll` HrRow tip kengaytirish** — `razryadCoefficient`/`stakeTotal`/`prorationDays` audit maydonlari `salary_history` INSERT'ga yoziladi. `drizzle-hr.repo.ts:81-91` INSERT'ni kengaytir:
```typescript
        INSERT INTO salary_history
          (user_id, employee_id, effective_date, change_type, new_salary,
           salary_period_start, salary_period_end, base_salary, salary_earned,
           total_bonuses, other_bonuses, razryad_coefficient, stake_total, proration_days)
        VALUES
          (..., ${String(payrollRecord.razryadCoefficient ?? '')}::numeric,
                ${String(payrollRecord.stakeTotal ?? '')}::numeric,
                ${payrollRecord.prorationDays ?? null})
```
> ⚠️ NULL-safe: agar audit qiymat yo'q bo'lsa `NULL` (regress — eski chaqiruvlar buzilmasin). `''::numeric` crash beradi — `NULLIF(${...}, '')::numeric` ishlat yoki qiymatni `?? null` bilan yubor.

**Sabab:** Formula bir joyda; controller faqat o'qi→hisobla→saqla→qaytar. `getRazryadCoefficient` controller'dan olib tashlanadi (servis kartalarni o'zi o'qiydi).

**Self-verify:** tsc GREEN; jonli `POST /api/hr/payroll/calculate` (BOSQICH 6).

**Commit:** `git add apps/api/src/modules/hr/presentation/hr-payroll.controller.ts apps/api/src/modules/hr/presentation/dto/hr.dto.ts apps/api/src/modules/hr/infrastructure/repositories/drizzle-hr.repo.ts && git commit --no-verify -m "feat(payroll): controller→PayrollCalculatorService (karta-asosli, ko'p-karta yig'indi, audit ustun)"`

---

### BOSQICH 6 — Handler ham servisga (dublikat formula olib tashlanadi)

**Fayl:** `apps/api/src/modules/hr/application/commands/calculate-payroll.handler.ts`

**Sabab:** Handler `baseSalary/22` formula ishlatadi (controller'dan boshqa nusxa). Q-46: dublikat formula TO'LIQ olib tashlanadi — handler ham `PayrollCalculatorService` chaqiradi. Bitta haqiqat manbai.

**OLDIN (calculate-payroll.handler.ts:66-72):**
```typescript
      const dailyRate = command.baseSalary / 22;
      const overtimePay = command.overtimeHours * (dailyRate / 8) * 1.5;
      const grossSalary = command.baseSalary + overtimePay + command.bonus;
      const netSalary = grossSalary - command.otherDeductions;
```

**KEYIN:**
```typescript
      // KARTA-asosli (yagona formula servisi — controller bilan bir xil manba)
      const cardsR = await this.hrRepo.getEmployeeCardsForPayroll(command.employeeId);
      if (!cardsR.ok) return Err(cardsR.error);
      const calcR = this.payrollCalc.calculate({
        cards: cardsR.data,
        inputBaseSalary: command.baseSalary,
        overtimeHours: command.overtimeHours,
        overtimeRate: OVERTIME_RATE_DEFAULT,
        bonus: command.bonus,
        otherDeductions: command.otherDeductions,
        prorationDays: WORK_DAYS_PER_MONTH,
        ckpGatePassed: true,
        lmsGatePassed: true,
      });
      if (!calcR.ok) return Err(calcR.error);
      const grossSalary = calcR.data.grossSalary;
      const netSalary = calcR.data.netSalary;
```

**Constructor:**
```typescript
import { PayrollCalculatorService } from '../services/payroll-calculator.service';
import { OVERTIME_RATE_DEFAULT, WORK_DAYS_PER_MONTH } from '@common/constants/business.constants';
// ...
  constructor(
    @Inject(HR_REPO) private readonly hrRepo: IHrRepo,
    private readonly eventEmitter: EventEmitter2,
    private readonly payrollCalc: PayrollCalculatorService,   // YANGI
  ) {}
```

> ⚠️ **Test ta'siri** (`test/hr/calculate-payroll.handler.spec.ts:30-44`): `makeRepo()` ga `getEmployeeCardsForPayroll` mock qo'shilishi kerak; handler constructor'iga 3-argument `PayrollCalculatorService` (real — pure, mock kerak emas). BOSQICH 7 da yangilanadi.

**Self-verify:** tsc GREEN.

**Commit:** `git add apps/api/src/modules/hr/application/commands/calculate-payroll.handler.ts && git commit --no-verify -m "feat(payroll): handler→PayrollCalculatorService (dublikat formula olib tashlandi)"`

---

### BOSQICH 7 — Unit test (formula to'g'riligini qotirish)

**Fayl (yangi):** `apps/api/test/hr/payroll-calculator.service.spec.ts` + mavjud `test/hr/calculate-payroll.handler.spec.ts` yangilash.

**Sabab:** Q-40 — "ishlaydi ≠ to'g'ri". Formula raqamlari biznes-qoidaga mos ekanini qotiramiz.

**KEYIN (yangi spec — namuna):**
```typescript
import { PayrollCalculatorService } from '../../src/modules/hr/application/services/payroll-calculator.service';
import type { PayrollCardRow } from '../../src/modules/hr/infrastructure/repositories/drizzle-hr.repo';

const svc = new PayrollCalculatorService();
const card = (o: Partial<PayrollCardRow>): PayrollCardRow => ({
  card_id: 1, card_name: 'Mashinist', coefficient: '1.90', salary_type: 'oylik',
  min_salary: '4000000', max_salary: '6000000', stake_fraction: '1.0',
  is_acting: false, acting_supplement: '0', ...o,
});

describe('PayrollCalculatorService', () => {
  it('bitta karta: base=(min+max)/2 × coeff × stake', () => {
    const r = svc.calculate({ cards: [card({})], inputBaseSalary: 0, overtimeHours: 0,
      overtimeRate: 1.5, bonus: 0, otherDeductions: 0, prorationDays: 22,
      ckpGatePassed: true, lmsGatePassed: true });
    expect(r.ok).toBe(true);
    // base=(4000000+6000000)/2=5000000; ×1.90×1.0=9500000
    if (r.ok) expect(r.data.grossSalary).toBe(9_500_000);
  });

  it('ko\'p-karta: ulush-yig\'indi (0.5+0.5)', () => {
    const r = svc.calculate({
      cards: [card({ card_id: 1, stake_fraction: '0.5' }), card({ card_id: 2, stake_fraction: '0.5' })],
      inputBaseSalary: 0, overtimeHours: 0, overtimeRate: 1.5, bonus: 0, otherDeductions: 0,
      prorationDays: 22, ckpGatePassed: true, lmsGatePassed: true });
    if (r.ok) { expect(r.data.stakeTotal).toBe(1.0);
      expect(r.data.grossSalary).toBe(9_500_000); } // 5M×1.9×0.5 ×2 = 9.5M
  });

  it('gate bloklangan → gross 0', () => {
    const r = svc.calculate({ cards: [card({})], inputBaseSalary: 0, overtimeHours: 0,
      overtimeRate: 1.5, bonus: 0, otherDeductions: 0, prorationDays: 22,
      ckpGatePassed: false, lmsGatePassed: true });
    if (r.ok) expect(r.data.grossSalary).toBe(0);
  });

  it('pro-rata: 11/22 kun → yarmi', () => {
    const r = svc.calculate({ cards: [card({})], inputBaseSalary: 0, overtimeHours: 0,
      overtimeRate: 1.5, bonus: 0, otherDeductions: 0, prorationDays: 11,
      ckpGatePassed: true, lmsGatePassed: true });
    if (r.ok) expect(r.data.grossSalary).toBe(4_750_000);
  });

  it('karta yo\'q → fallback inputBaseSalary (regress)', () => {
    const r = svc.calculate({ cards: [], inputBaseSalary: 3_000_000, overtimeHours: 0,
      overtimeRate: 1.5, bonus: 0, otherDeductions: 0, prorationDays: 22,
      ckpGatePassed: true, lmsGatePassed: true });
    if (r.ok) expect(r.data.grossSalary).toBe(3_000_000);
  });

  it('i.o.-ustama qo\'shiladi', () => {
    const r = svc.calculate({
      cards: [card({ is_acting: true, acting_supplement: '500000' })],
      inputBaseSalary: 0, overtimeHours: 0, overtimeRate: 1.5, bonus: 0, otherDeductions: 0,
      prorationDays: 22, ckpGatePassed: true, lmsGatePassed: true });
    if (r.ok) expect(r.data.grossSalary).toBe(10_000_000); // 9.5M + 0.5M
  });

  it('ishbay-cap: max_salary dan oshmaydi', () => {
    const r = svc.calculate({
      cards: [card({ salary_type: 'ishbay', coefficient: '2.80' })], // 5M×2.8=14M → cap 6M
      inputBaseSalary: 0, overtimeHours: 0, overtimeRate: 1.5, bonus: 0, otherDeductions: 0,
      prorationDays: 22, ckpGatePassed: true, lmsGatePassed: true });
    if (r.ok) expect(r.data.grossSalary).toBe(6_000_000);
  });
});
```

**handler.spec.ts yangilash** — `makeRepo()` ga qo'sh:
```typescript
    getEmployeeCardsForPayroll: jest.fn().mockResolvedValue(Ok([])),  // bo'sh → fallback baza
```
va handler instansini `new CalculatePayrollHandler(makeRepo(), makeBus(), new PayrollCalculatorService())` qil.

**Self-verify:** `pnpm --filter @europrint/api exec jest test/hr/payroll-calculator.service.spec.ts` → barcha PASS.

**Commit:** `git add apps/api/test/hr/payroll-calculator.service.spec.ts apps/api/test/hr/calculate-payroll.handler.spec.ts && git commit --no-verify -m "test(payroll): karta-asosli formula unit-test (ko'p-karta/gate/pro-rata/i.o./cap)"`

---

### BOSQICH 8 — FE: razryad-koeff + ulush breakdown (REGRESS-himoya)

**Fayl:** `artifacts/erp-dashboard/src/pages/payroll/CalculatePayrollDialog.tsx` (yoki `hr/payroll` natija ko'rsatadigan komponent — JONLI tekshir: bu dialog `finance-extended` endpoint'iga uradi; `hr/payroll/calculate` natija qaytaradigan joyni grep bilan top: `grep -rn "hr/payroll/calculate" artifacts/erp-dashboard/src`).

**Sabab:** Q3 (EP dizayn) + vizyon "oylik kartadan ko'rinadi". Hozir preview faqat gross/net ko'rsatadi. Endi razryad-koeffitsient + ko'p-karta breakdown qo'shiladi. **REGRESS-himoya (Q-46):** mavjud preview, contract-detail, deductions formasi — O'CHMAYDI, faqat yangi blok QO'SHILADI.

**KEYIN (preview kartaga qo'shiladigan blok — CalculatePayrollDialog:210-234 ichida, mavjud gross/net dan keyin):**
```tsx
{/* FAZA 04: KARTA-asosli breakdown (razryad-koeff + ulush). REGRESS: mavjud preview saqlanadi. */}
{Array.isArray(calcResult?.perCard) && calcResult.perCard.length > 0 && (
  <div className="mt-3 rounded-md border border-[var(--ep-border)] bg-[var(--ep-surface)] p-3">
    <div className="mb-2 text-xs font-semibold text-[var(--ep-text-muted)]">
      {tFinance('cardBreakdown')}  {/* "Karta bo'yicha taqsimot" */}
    </div>
    {calcResult.perCard.map((pc) => (
      <div key={pc.cardId} className="flex justify-between text-sm py-1">
        <span className="text-[var(--ep-text-muted)]">
          {pc.cardName ?? `Karta #${pc.cardId}`} · ×{pc.coefficient} · {Math.round(pc.stakeFraction * 100)}%
        </span>
        <span className="font-medium">{formatCurrency(pc.cardPay)}</span>
      </div>
    ))}
    <Separator className="my-1" />
    <div className="flex justify-between text-sm">
      <span className="text-[var(--ep-text-muted)]">{tFinance('razryadCoefficient')}</span>
      <span>×{calcResult.razryadCoefficient}</span>
    </div>
    {calcResult.gateBlocked && (
      <div className="mt-1 text-xs text-[var(--ep-red)]">
        {tFinance('payrollGateBlocked')}  {/* "ЦКП/darslik gate — oylik to'xtatilgan" */}
      </div>
    )}
  </div>
)}
```

**Qoidalar:**
- Faqat `var(--ep-*)` token (Qoida 21) — xom hex/inline rang YO'Q.
- `Array.isArray` guard (Qoida 2).
- i18n kalit (`tFinance(...)`) — hardcoded matn YO'Q; yangi kalitlar 3 til faylga (`uz`/`uz-cyr`/`ru` finance.json): `cardBreakdown`, `razryadCoefficient`, `payrollGateBlocked`.
- `formatCurrency` mavjud (import bor).
- Mavjud preview (grossPay/netPay/totalDeductions) — **O'ZGARMAYDI** (regress).

**Self-verify:** `pnpm --filter erp-dashboard exec tsc --noEmit` GREEN; `node scripts/check-design-tokens.mjs` PASS (xom rang yo'q).

**Commit:** `git add artifacts/erp-dashboard/src/pages/payroll/CalculatePayrollDialog.tsx artifacts/erp-dashboard/src/locales/uz/finance.json artifacts/erp-dashboard/src/locales/uz-cyr/finance.json artifacts/erp-dashboard/src/locales/ru/finance.json && git commit --no-verify -m "feat(payroll-fe): karta breakdown (razryad-koeff+ulush) + gate ogohlantirish (EP token)"`

---

## 4. DB-MIGRATION SQL (TO'LIQ, APPROVED)

> Q-35: har DDL `APPROVED:` izoh bilan. Idempotent. Yangi jadval YO'Q — faqat `ADD COLUMN IF NOT EXISTS`.

```sql
-- APPROVED: owner Q1/Q2 (2026-06-25), master-reja FAZA 4 — payroll karta-asosli
-- (1) employee_cards.stake_fraction — ko'p-karta ulushi (Faza 1 bilan kelishilgan, guard)
ALTER TABLE employee_cards
  ADD COLUMN IF NOT EXISTS stake_fraction numeric(4,3) NOT NULL DEFAULT 1.000;

-- (2) salary_history audit ustunlar — oylik buzilishi (razryad-koeff, ulush-yig'indi, pro-rata kun)
ALTER TABLE salary_history
  ADD COLUMN IF NOT EXISTS razryad_coefficient numeric(5,2),
  ADD COLUMN IF NOT EXISTS stake_total         numeric(4,3),
  ADD COLUMN IF NOT EXISTS proration_days      integer;
```

> **Owner-data NULL — fabrikatsiya TAQIQ:** Bu migration ustun **qo'shadi**, qiymat **to'ldirmaydi**. `org_departments.razryad_level_id`/`min_salary`/`max_salary` egasi tomonidan to'ldiriladi (§10). `stake_fraction` default `1.000` (to'liq stavka — bu fabrikatsiya emas, neytral default; ko'p-karta bo'lganda egasi/HR taqsimlaydi).

---

## 5. ZOD / RESULT / DRIZZLE NAMUNA (uslub mos)

### 5.1 Zod (DTO)
```typescript
// hr.dto.ts — yangi maydonlar optional (regress: eski FE buzilmaydi)
prorationDays: z.number().int().min(0).max(31).optional(),
ckpGatePassed: z.boolean().optional(),
lmsGatePassed: z.boolean().optional(),
```

### 5.2 Result<T> (servis/repo)
```typescript
// servis — pure, lekin Result qaytaradi (Qoida 1)
calculate(input: PayrollCalcInput): Result<PayrollCalcResult> {
  if (!Number.isFinite(net)) return Err({ code: 'INTERNAL', message: 'Oylik NaN' });
  return Ok({ ... });
}
// repo
async getEmployeeCardsForPayroll(employeeId: number): Promise<Result<PayrollCardRow[]>> {
  try { ...; return Ok(rows); } catch (e) { return Err((e as Error).message); }
}
// controller — unwrap
const calcR = this.payrollCalc.calculate({...});
assertOk(calcR);   // @common/http-result — Result.error → HttpException
```

### 5.3 Drizzle (ORM ustun, raw faqat murakkab JOIN)
```typescript
// Murakkab 3-jadval JOIN (employee_cards × org_departments × razryad_levels) — raw SQL maqbul (izoh bilan)
const rows = await runQuery<PayrollCardRow>(sql`
  SELECT ec.card_id, od.salary_type, rl.coefficient, ...
  FROM employee_cards ec
  JOIN org_departments od ON od.id = ec.card_id
  LEFT JOIN razryad_levels rl ON rl.id = od.razryad_level_id
  WHERE ec.employee_id = ${employeeId} AND ec.is_active = true
`);
// Parametr ${employeeId} — SQL injection yo'q (Drizzle sql tag). sql.raw() ISHLATILMAYDI.
```

---

## 6. FE + DIZAYN (EP token / shablon / komponent)

| Element | Qoida | Aniq |
|---------|-------|------|
| Sahifa | `CalculatePayrollDialog.tsx` (mavjud) — yangi sahifa YO'Q | breakdown bloki QO'SHILADI |
| Token | `var(--ep-border)`, `var(--ep-surface)`, `var(--ep-text-muted)`, `var(--ep-green)`, `var(--ep-red)` | xom hex TAQIQ (Qoida 21) |
| Komponent | mavjud `Card`/`Separator`/`Badge` (`@/components/ui`) | yangi komponent YO'Q |
| i18n | `tFinance('cardBreakdown')`, `tFinance('razryadCoefficient')`, `tFinance('payrollGateBlocked')` | 3 til (uz/uz-cyr/ru) finance.json |
| F1 loading | mavjud `calculateMutation.isPending` → "loading" tugma | saqlanadi |
| F2 onError | mavjud `onError` toast | saqlanadi |
| Tab | dialog — tab YO'Q (Qoida 42 ≤2 daraja — N/A) | — |
| Regress | preview/contract-detail/deductions — **O'ZGARMAYDI** | Q-46 |

> Dizayn-tekshiruv: `node scripts/check-design-tokens.mjs` — diff-aware, xom rang BLOK.

---

## 7. QABUL-MEZONI (Definition of Done)

1. ✅ `getRazryadCoefficient` + `getEmployeeCardsForPayroll` **`org_departments`** (karta) dan o'qiydi — `org_functions` JOIN kodda YO'Q (`grep -n "org_functions" drizzle-hr.repo.ts` → payroll bo'limida 0).
2. ✅ Oylik = **razryad-koeff × karta-baza × ulush** (formula `PayrollCalculatorService` da, bitta joyda).
3. ✅ Ko'p-karta: 2 aktiv karta → ikkala kartaning (koeff×baza×stake) yig'indisi; `stakeTotal` javobda.
4. ✅ i.o.-ustama: `is_acting=true` karta → `acting_supplement` qo'shiladi.
5. ✅ pro-rata: `prorationDays=11/22` → gross yarmi.
6. ✅ ishbay-cap: `salary_type='ishbay'` → `min_salary`..`max_salary` clamp.
7. ✅ Gate ulanish-nuqta: `ckpGatePassed=false` → gross 0 (Faza 5/7 flag; default true — fabrikatsiya yo'q).
8. ✅ `baseSalary` parametri fallback bo'lib SAQLANADI (karta-band NULL → parametr; regress).
9. ✅ Controller transport-only (formula servisda); handler ham servisni chaqiradi (dublikat YO'Q).
10. ✅ `salary_history` ga `razryad_coefficient`/`stake_total`/`proration_days` audit yoziladi.
11. ✅ FE breakdown (razryad-koeff + ulush + gate) ko'rsatadi; mavjud preview saqlanadi; EP token; tsc + design-tokens PASS.
12. ✅ tsc GREEN (BE+FE), unit-test PASS, rollback-tx DB-proof PASS, jonli `/api/hr/payroll/calculate` 201.

---

## 8. EDGE-HOLATLAR

| Holat | Kutilgan xulq |
|-------|---------------|
| Xodimda 0 aktiv karta | `getEmployeeCardsForPayroll` → `[]`; servis fallback `inputBaseSalary × 1.0` (regress — eski xulq). Lekin controller'dagi `hasAnyOrgAssignment` gate avval ushlaydi (employee_org_departments). Ikkalasi mos: karta yo'q lekin org-assignment bor → fallback baza. |
| `razryad_level_id` NULL (0/139 hozir) | `coefficient` NULL → servis `RAZRYAD_COEFF_DEFAULT=1.0` (fabrikatsiya emas, neytral). |
| `min_salary`/`max_salary` NULL (hozirgi holat) | karta-baza yo'q → fallback `inputBaseSalary`. SOXTA band yaratilmaydi. |
| `stake_fraction` yig'indi > 1.0 | `STAKE_SUM_MAX=1.0` — servis hisoblaydi, lekin **bloklamaydi** (owner-override EP-ORG-066; bu fazada faqat `stakeTotal` qaytariladi, ogohlantirish Faza 1/owner). Hisob davom etadi (regress: oylik yozilishi shart). |
| `prorationDays=0` | gross 0 (kun ishlamagan). |
| `prorationDays > 22` | `Math.min(days, WORK_DAYS_PER_MONTH)` — 22 ga clamp (ortiqcha kun overtime'da). |
| Ikkala gate false | gross 0 (Faza 5/7). |
| `salary_type='ishbay'` + `min_salary` NULL | clamp o'tkazib yuboriladi (`Number.isFinite` guard) — base×coeff×stake qoladi. |
| NaN natija | `Err({code:'INTERNAL'})` — 500 emas, toza xato. |
| `card_id` FK hali `org_functions` (FAZA 0 kelmagan) | JOIN `org_departments od ON od.id = ec.card_id` — agar `card_id` qiymati `org_departments.id` ga mos kelmasa, JOIN qator bermaydi → bo'sh kartalar → fallback baza. **FAZA 0 dan KEYIN to'g'ri ishlaydi** (bog'liqlik §0.3). JONLI tekshir: BOSQICH 2 dan oldin FK holatini `node _audit/q.cjs` bilan tasdiqla. |

---

## 9. SELF-VERIFY (tsc + rollback-tx DB-proof + jonli isbot)

### 9.1 Typecheck
```bash
pnpm --filter @europrint/api exec tsc --noEmit       # BE — 0 xato (o'z fayllarda)
pnpm --filter erp-dashboard exec tsc --noEmit        # FE — 0 xato
node scripts/check-design-tokens.mjs                 # FE — xom rang yo'q
```

### 9.2 Unit-test
```bash
pnpm --filter @europrint/api exec jest test/hr/payroll-calculator.service.spec.ts
pnpm --filter @europrint/api exec jest test/hr/calculate-payroll.handler.spec.ts
```

### 9.3 Rollback-tx DB-proof (namuna skript — `_audit/bproof-payroll-karta.cjs`)

> Pattern: `_audit/bproof-razryad-coeff.cjs` (mavjud) asosida. **kirit → oqdi → ko'rindi → ROLLBACK → o'zgarmaganini tasdiq.**

```javascript
/** VISION DB-PROOF (rollback-tx). FAZA 04 — oylik karta-razryad-bazadan oqadimi. */
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' });
(async () => {
  const c = await pool.connect();
  try {
    await c.query('BEGIN');
    // 1) KIRIT: bir kartaga razryad (4=koeff 1.90) + oylik-band + stake biriktir (test, rollback bo'ladi)
    const cardId = (await c.query(`SELECT id FROM org_departments WHERE is_active=true ORDER BY id LIMIT 1`)).rows[0].id;
    await c.query(`UPDATE org_departments SET razryad_level_id=8, salary_type='oylik', min_salary=4000000, max_salary=6000000 WHERE id=$1`, [cardId]);
    const empId = (await c.query(`SELECT employee_id FROM employee_cards WHERE card_id=$1 AND is_active=true LIMIT 1`, [cardId])).rows[0]?.employee_id;
    // stake_fraction guard
    await c.query(`UPDATE employee_cards SET stake_fraction=1.000 WHERE card_id=$1 AND employee_id=$2`, [cardId, empId]);
    // 2) OQDI: payroll so'rovini takrorlaydigan JOIN
    const r = (await c.query(`
      SELECT od.min_salary, od.max_salary, rl.coefficient, ec.stake_fraction
      FROM employee_cards ec
      JOIN org_departments od ON od.id = ec.card_id
      LEFT JOIN razryad_levels rl ON rl.id = od.razryad_level_id
      WHERE ec.employee_id=$1 AND ec.is_active=true`, [empId])).rows[0];
    const base = (Number(r.min_salary) + Number(r.max_salary)) / 2;       // 5,000,000
    const gross = base * Number(r.coefficient) * Number(r.stake_fraction); // 5M × 1.90 × 1.0 = 9,500,000
    console.log('KO\'RINDI: base=', base, 'coeff=', r.coefficient, 'stake=', r.stake_fraction, '=> gross=', gross, '(kutilgan 9500000:', gross === 9500000, ')');
    // 3) ROLLBACK
    await c.query('ROLLBACK');
    const after = (await c.query(`SELECT razryad_level_id, min_salary FROM org_departments WHERE id=$1`, [cardId])).rows[0];
    console.log('ROLLBACK -> razryad_level_id=', after.razryad_level_id, 'min_salary=', after.min_salary, '(o\'zgarmadi:', after.razryad_level_id === null, ')');
  } catch (e) { await c.query('ROLLBACK'); console.error('ERR', e.message); }
  finally { c.release(); await pool.end(); }
})();
```
```bash
node _audit/bproof-payroll-karta.cjs
# Kutilgan: "KO'RINDI ... gross= 9500000 (kutilgan 9500000: true)"
#           "ROLLBACK -> ... (o'zgarmadi: true)"
```

### 9.4 Jonli isbot (server qaytgach + login)
```bash
# 1. Token ol (mavjud login)
TOKEN=$(curl -s -X POST http://127.0.0.1:3030/api/auth/login -H 'Content-Type: application/json' \
  -d '{"username":"<owner>","password":"<parol>"}' | node -e "process.stdin.on('data',d=>console.log(JSON.parse(d).data?.accessToken||JSON.parse(d).accessToken))")
# 2. Oylik hisobla (kartali xodim)
curl -s -X POST http://127.0.0.1:3030/api/hr/payroll/calculate \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"employeeId":30,"baseSalary":3000000,"period":"2026-06"}' | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d)))"
# Kutilgan 201 + javobda razryadCoefficient, stakeTotal, perCard[], grossSalary, netSalary
# 3. DB-da yozuvni tasdiq
node _audit/q.cjs "SELECT id, base_salary, salary_earned, razryad_coefficient, stake_total FROM salary_history WHERE employee_id=30 ORDER BY id DESC LIMIT 1"
```
> Q-44: agar `:3030` 000 qaytarsa (Windows nest-watch crash) → dev-serverni qayta ishga tushir (`pnpm --filter @europrint/api run dev:unsafe`); static fallback (tsc + DB-proof) bilan tasdiqla, jonli-HTTP server qaytgach.

---

## 10. OWNER-DATA (FABRIKATSIYA TAQIQ — egasi to'ldiradi)

> Bu mexanizm tayyor, lekin **qiymatlarni egasi beradi**. Agent SOXTA qiymat yozmaydi (Q-2/Q-40).

| Data | Hozirgi holat (JONLI) | Kim/qachon | Mexanizm holati |
|------|----------------------|-----------|------------------|
| `org_departments.razryad_level_id` (har karta razryadi) | **0/139** | HR/egasi (Faza 3 razryad-config + qo'lda biriktiruv) | Struktura tayyor; NULL → koeff 1.0 |
| `org_departments.salary_type` (oylik/soat/ishbay) | **0/139** | HR/egasi | NULL → 'oylik' xulqi (fallback baza) |
| `org_departments.min_salary` / `max_salary` (oylik bandi) | **0/139 (NULL)** | egasi (EP-ORG-045 — dan-gacha oraliq) | NULL → fallback `baseSalary` parametr |
| baza-oylik (band markazi) | band NULL = parametrdan | egasi band to'ldirgach kartadan | tayyor |
| `employee_cards.stake_fraction` (ulush) | ustun YO'Q → migration default 1.000 | HR (ko'p-karta bo'lganda taqsimlaydi) | default 1.0 |
| `acting_supplement` (i.o.-ustama) | NULL (0 xulq) | HR (i.o. tayinlaganda — EP-ORG-061) | tayyor |
| ЦКП-gate qiymati (`ckpGatePassed`) | flag default `true` | **Faza 5** (ckp_fact_values + deadline) | ulanish-nuqta tayyor |
| darslik-gate qiymati (`lmsGatePassed`) | flag default `true` | **Faza 7** (LmsCompletionService) | ulanish-nuqta tayyor |
| `prorationDays` (ishlangan kun) | default 22 | **Faza 5** (kun-gate / davomat) | ulanish-nuqta tayyor |

> **Egasiga aniq savol (data so'rovi):**
> 1. Razryad oylik-bandi: har razryad (1-6) uchun `min_salary`/`max_salary` so'm qiymatlari? (yoki kartaga bevosita?)
> 2. `salary_type` standart: aksariyat kartalar 'oylik'mi yoki kartaga qarab har xilmi?
> 3. i.o.-ustama: foiz (% baza)mi yoki qat'iy summa? (EP-ORG-061 — hozir summa `acting_supplement`).
> 4. Ko'p-karta ulush yig'indisi >1.0 bo'lsa: bloklash yoki ogohlantirish? (EP-ORG-066 — hozir ogohlantirish, hisob davom etadi).

---

## 11. COMMIT TARTIBI (xulosa)

| # | Bosqich | Fayllar | Commit xabari (qisqa) |
|---|---------|---------|----------------------|
| 1 | Konstantalar | `business.constants.ts` | `feat(payroll): faza-04 payroll konstantalari` |
| 2 | Repo karta-manba | `drizzle-hr.repo.ts`, `i-hr.repo.ts` | `feat(payroll): karta-asosli razryad+baza manbai` |
| 3 | DB migration | `migrations-drift.ts` | `feat(payroll): stake_fraction+audit ustun (APPROVED)` |
| 4 | Calculator servis | `payroll-calculator.service.ts`, `hr.providers.ts` | `feat(payroll): PayrollCalculatorService yagona formula` |
| 5 | Controller→servis | `hr-payroll.controller.ts`, `hr.dto.ts`, `drizzle-hr.repo.ts` | `feat(payroll): controller→servis (ko'p-karta yig'indi)` |
| 6 | Handler→servis | `calculate-payroll.handler.ts` | `feat(payroll): handler→servis (dublikat olib tashlandi)` |
| 7 | Unit-test | `payroll-calculator.service.spec.ts`, `calculate-payroll.handler.spec.ts` | `test(payroll): karta-asosli formula` |
| 8 | FE breakdown | `CalculatePayrollDialog.tsx`, 3 finance.json | `feat(payroll-fe): karta breakdown + gate` |

> Har commit: `git add <aniq-fayllar>` (HECH QACHON `-A`) + `--no-verify` + Co-Authored-By trailer.
> Tartib MAJBURIY: **3 (migration) avval** — `stake_fraction` ustuni BOSQICH 2 so'rovi uchun kerak (aks holda SQL crash). Amaliy tartib: 1 → 3 → 2 → 4 → 5 → 6 → 7 → 8.

---

## 12. BOG'LIQLIK XULOSASI (boshqa fazalar bilan)

| Faza | Bog'liqlik | Bu fazada nima qilamiz |
|------|-----------|------------------------|
| **FAZA 0** (kanonik karta) | `employee_cards.card_id` FK → `org_departments` (hozir `org_functions`) | JOIN `org_departments` ga yoziladi; FK kelmaguncha bo'sh karta → fallback baza (graceful). FAZA 0 dan keyin to'liq ishlaydi. |
| **FAZA 1** (ko'p-karta + stake) | `employee_cards.stake_fraction` | BOSQICH 3 guard bilan idempotent qo'shadi (Faza 1 hali qo'shmagan bo'lsa). |
| **FAZA 3** (razryad o'sish) | `org_departments.razryad_level_id` to'ldiruvi | Bu faza faqat O'QIYDI; yozish Faza 3/owner. |
| **FAZA 5** (ЦКП) | `ckpGatePassed` flag | Ulanish-nuqta (default true). Faza 5 real qiymat beradi. |
| **FAZA 7** (darslik) | `lmsGatePassed` flag | Ulanish-nuqta (default true). Faza 7 real qiymat beradi. |

---

*Direktiva tugadi. Q-47: ≥1000 qator. Har bosqich: fayl:satr + oldin/keyin kod + sabab + self-verify + commit. FABRIKATSIYA TAQIQ — owner-data §10. REGRESS-himoya — Q-46. Yagona formula manbai — Q-46 dublikat olib tashlash.*
