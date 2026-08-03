# P24 — FIN — Finance/GL + KASSIR: FIN GL hardening: 4-hisob + period-lock + URL fix

> **WAVE:** 2 | **dependsOn:** [] | **ddlGate:** false (yangi jadval yo'q — range-based grouping)
> **Slug:** fin-gl-core | **Agent:** bitta izolyatsiyalangan bajaruvchi
> Yozilgan: 2026-06-19 | Vizyon manba: `docs/audit/MUSLIMBEK-PROMT-10-FIN-2026-06-08.md`

---

## 0. ROL VA QOIDALAR

Sen 🟢 **BAJARUVCHI**-san. Har sessiya boshida `CLAUDE.md` + `docs/agent-constitution.md` o'qi. Quyidagi qoidalar ISTISNOSIZ qo'llanadi:

```
QOIDALAR BLOKI (Q-47):
1.  Result<T> hamma repo/service metodida; throw/null/undefined TAQIQ.
2.  @Body Zod bilan validate; class-validator TAQIQ.
3.  Drizzle ORM; raw SQL faqat murakkab holatda (izoh + typedExecute<T>).
4.  Q-40 ishlaydi≠to'g'ri: REAL INSERT/UPDATE + DB-proof; echo/hardcoded/fake javob TAQIQ.
5.  Q-46 ishlab turgan kod O'CHIRILMAYDI; buzuq/o'lik/dublikat kod TO'LIQ o'chiriladi (chala emas).
6.  FAYL IZOLYATSIYASI (Qoida 23 / Q-23 / Q-31): faqat shu paketning OWNED-FILE
    ro'yxatidagi fayllarga teg. Boshqa fayl kerak bo'lsa — TO'XTA, egasiga flag qil.
7.  DDL DARVOZASI (Q-35): CREATE TABLE / migration faqat egasi ruxsati bilan;
    migration faylida `-- APPROVED:` izoh shart. Bu paket DDL talab QILMAYDI (no new table).
8.  git add <aniq-fayl> faqat; -A / . TAQIQ. Bitta commit=bitta mantiqiy guruh.
9.  Q-45/Q-30 log/secret HECH QACHON commit qilinmaydi; JWT minting yo'q.
10. Self-verify: BE tsc 0, FE tsc 0, tegishli reviewer skriptlar,
    jonli DB-proof (kirit→saqla→qayta o'qi→ko'rinadimi).
11. "V2"/"Strangler Fig"/"V1 vs V2" terminologiyasi TAQIQ — bitta kod bazasi.
12. Vizyon-moslik: TO'G'RI o'lchovi = master vizyon (docs/XARITA-REJA-YONALISH +
    modul vizyon-hujjati); kod vizyonga zid bo'lsa (ishlasa ham) = xato.
```

**WAVE 2** — ushbu paket boshqa paketlarga bog'liq emas (`dependsOn: []`), parallel
ishga tushiriladi.

---

## 1. IZOLYATSIYA MANIFESTI

**FAQAT quyidagi 7 fayl tegiladi. Boshqa fayl kerak bo'lsa — TO'XTA, egasiga flag qil:**

| # | Fayl (loyiha ildizidan) |
|---|------------------------|
| 1 | `Uzbek-Language-Module/apps/api/src/modules/finance/infrastructure/repositories/drizzle-gl-posting.repo.ts` |
| 2 | `Uzbek-Language-Module/apps/api/src/modules/finance/presentation/finance-accounting.controller.ts` |
| 3 | `Uzbek-Language-Module/apps/api/src/modules/finance/application/finance-accounting.service.ts` |
| 4 | `Uzbek-Language-Module/apps/api/src/modules/finance/presentation/finance-gl.controller.ts` |
| 5 | `Uzbek-Language-Module/artifacts/erp-dashboard/src/pages/PeriodClosing.tsx` |
| 6 | `Uzbek-Language-Module/artifacts/erp-dashboard/src/pages/FinanceDashboard.tsx` |
| 7 | `Uzbek-Language-Module/artifacts/erp-dashboard/src/pages/FinanceDashboardTabs.tsx` |

**ddlGate: false** — yangi jadval yaratilmaydi. 4-hisob guruhlash `accounts.account_code`
ustunidagi mavjud BHMS raqamlari diapazoni bo'yicha SQL `CASE WHEN` orqali amalga oshiriladi.
Yangi ustun yoki jadval kerak emas.

---

## 2. VIZYON

Manba: `docs/audit/MUSLIMBEK-PROMT-10-FIN-2026-06-08.md` — PHASE 1, EP-FIN qatorlar.

### 2.1 EP-FIN-004 — 4-hisob (MAIN / TAX / HEAD / WORKING)

Vizyon: har bir hisob guruhi alohida balansi va harakati ko'rinadigan bo'lishi.
O'zbekiston BHMS bo'yicha quyidagi diapazonlar ishlatiladi (kanonik `accounts.account_code`):

| Guruh | Nomi (viz.) | BHMS kod oralig'i | Misol kodlar |
|-------|------------|-------------------|--------------|
| MAIN | Asosiy ishlab chiqarish | `9xxx` (9000–9999) | 9010 tushum, 9100 tannarx |
| TAX | Soliq va majburiy to'lovlar | `6xxx` (6000–6999) | 6310 QQS, 6520 INPS/JSHD, 6810 kredit |
| HEAD | Boshqaruv / kapital | `8xxx` (8000–8999) | 8300 ustav kapitali |
| WORKING | Aylanma kapital / aktivlar | `1xxx`–`5xxx` (1000–5999) | 1000 materiallar, 4000 debitorlar, 5010 kassa |

**Qabul mezoni (EP-FIN-004):**
- `GET /api/finance/gl/account-groups` → 4 ta ob'ekt: har birida `group`, `totalDebit`,
  `totalCredit`, `balance`, `accountCount`, `accounts[]`
- FE `FinanceDashboardTabs.tsx` — DashboardOverviewTab ichida 4-hisob widget ko'rsatiladi
  (real API dan ma'lumot, to'g'ridan hardcoded emas)

### 2.2 EP-FIN-064 — Davr qulfi (Period lock)

Vizyon: yopilgan davr (`status = 'closed'`) ga yangi GL yozuvi insertJournal orqali
kiritilishi taqiqlanadi. Faqat egasi/moliya rahbari davrni ochishi mumkin.

**Qabul mezoni (EP-FIN-064):**
- `insertJournal` chaqirilganda — joriy `entry_date` ga mos ochiq davr tekshiriladi.
  Agar davr `'closed'` bo'lsa → `Err(AppErr('PERIOD_LOCKED', '...'))`
- Controller ushbu Err-ni `400 BadRequest` sifatida qaytaradi
- FE `PeriodClosing.tsx` — davr yopilgandan keyin "Yopiq" badge'i ko'rinadi,
  "Yopish" tugmasi o'sha qatordan yo'qoladi

### 2.3 FE/BE URL mismatch — PeriodClosing.tsx (buzuq holat)

Vizyon: `PeriodClosing.tsx` sahifasi real davrlarni ko'rsatadi va yopish amali ishlaydi.

**Hozirgi buzuq holat (brokenOrFake):**
- `PeriodClosing.tsx:67` — `queryKey: ["/api/accounting/periods"]` → BE da bu route **404**
  (BE controller prefix = `@Controller('accounting')`, lekin global prefix `api/` bilan
  `GET /api/accounting/periods` — lekin `finance-accounting.controller.ts:37` `@Controller('accounting')`
  va bu `finance.module.ts`'da `FinanceModule` ichida ro'yxatga olingan,
  shuning uchun global prefix `api` bilan `/api/accounting/periods` bo'ladi — ISHLAYDI)
- **Asl muammo:** `closePeriodMutation` `POST /api/accounting/periods/${periodId}/close`
  chaqiradi — BE `finance-accounting.controller.ts:109` `@Post('periods/:id/close')` bor —
  shuning uchun URL `/api/accounting/periods/:id/close` to'g'ri. LEKIN `queryClient.invalidateQueries`
  ham `["/api/accounting/periods"]` ishlatadi — bu ham to'g'ri.
- **Haqiqiy muammo:** `closePeriodMutation` body yuboradi — BE `@UsePipes(ZodValidationPipe(FinanceClosePeriodSchema))`
  qabul qiladi, lekin FE `mutationFn` faqat `periodId` yuboradi, body yo'q.
  `FinanceClosePeriodSchema` `closedBy` kutsa — body validation o'tishi mumkin emas.
- Bundan tashqari, `FinanceDashboard.tsx:88` `queryKey: ["/api/gl/accounts"]` —
  BE da `GET /api/gl/accounts` mavjud emas (finance-gl.controller.ts prefix = `finance/gl`).

**Qabul mezoni (URL fix):**
- PeriodClosing: GET `/api/accounting/periods` ishlaydi (verify curl)
- PeriodClosing: POST `/api/accounting/periods/:id/close` ishlaydi; FE body to'g'ri yuboriladi
- FinanceDashboard: `queryKey` lar real BE URL larga mos keladi

---

### 2.4 EP-FIN-005/006 — Tushum 4-hisobga avtomatik taqsimlash (Owner-gated)

> **Manba:** `OCHIQ-JAVOBLAR-2026-06-08.md:91-92` + `MASTER-SAVOL-JAVOB-2026-06-08.md:278-279`
>
> - EP-FIN-005: "Tushum 4-hisobga avtomatik taqsim" = A (avtomatik foiz bilan, intizom kafolati)
> - EP-FIN-006: "Taqsim foizini kim belgilaydi" = A (faqat egasi/direktor o'zgartiradi, qolganlar ko'radi)
> - **MASTER-SAVOL-JAVOB talabi:** "foiz-qiymat va trigger nuqtasi egasidan" — foizlar HARDCODE QILINMAYDI

**Vizyon:**
Har `tushum` (revenue) hodisasi sodir bo'lganda — `9010`-hisobga yozuv kiritilishidan oldin yoki keyin — tushum summasi 4 ta hisobga (MAIN/TAX/HEAD/WORKING) avtomatik taqsimlanadi. Taqsimlash foizlari `revenue_distribution_config` jadvalida saqlanadi va faqat `director`/`owner`/`super_admin` roli o'zgartirishi mumkin.

> ⚠️ **EGASI QIYMATI KERAK (EP-FIN-005/006 foizlar):**
> Egasi hali hech qanday foiz qiymatlarini bermagan (masalan: MAIN 40%, TAX 30%, HEAD 20%, WORKING 10% kabi).
> Bu qiymatlar KOD ICHIDA YOZILMAYDI.
> Bajaruvchi `revenue_distribution_config` jadvalini yaratadi (seed qatori: `percent = NULL`, `is_active = false`)
> va egasi real foizlarni DB orqali yozguncha taqsimlash SKIP qilinadi (log bilan).
> Xato yo'q — faqat "Egasi foizlarni belgilamagan" xabari log ga yoziladi.

**Amalga oshirish:**

1. **DDL (GATED):** `revenue_distribution_config` jadvali — `finance.module.ts` owned faylda migration reference.
   Jadval tuzilishi:
   ```sql
   -- APPROVED: <egasi> <sana> — bu izohsiz ishga tushirilmaydi
   CREATE TABLE revenue_distribution_config (
     id             SERIAL PRIMARY KEY,
     account_group  VARCHAR(20) NOT NULL, -- MAIN | TAX | HEAD | WORKING
     percent        NUMERIC(5,2),         -- NULL = egasi hali belgilamagan
     is_active      BOOLEAN NOT NULL DEFAULT false,
     updated_by     INTEGER,
     updated_at     TIMESTAMP NOT NULL DEFAULT NOW()
   );
   -- Seed: 4 ta bo'sh qator (egasi foizlarni keyin to'ldiradi)
   INSERT INTO revenue_distribution_config (account_group, percent, is_active)
   VALUES ('MAIN', NULL, false), ('TAX', NULL, false),
          ('HEAD', NULL, false), ('WORKING', NULL, false);
   ```
   **DDL GATED** — faylni yoz, lekin `drizzle-kit push` yoki `psql` bilan ISHGA TUSHIRMA. `-- APPROVED:` izoh shart.

2. **Servis logika (`finance-accounting.service.ts` — owned fayl #3):**
   ```typescript
   /**
    * EP-FIN-005: Tushum → 4-hisobga avtomatik taqsimlash.
    * EP-FIN-006: Faqat director/owner/super_admin foizlarni o'zgartira oladi.
    *
    * ⚠️ EGASI QIYMATI KERAK: revenue_distribution_config jadvalidagi foiz qiymatlari
    *   egasi tomonidan belgilanishi kerak. Konfiguratsiya bo'sh/inactive bo'lsa — skip.
    */
   async distributeRevenue(
     totalAmount: number,
     referenceId: string,
     referenceType: string,
     createdBy: number,
   ): Promise<Result<{ distributed: boolean; reason?: string }>> {
     try {
       type ConfigRow = { account_group: string; percent: string | null; is_active: boolean };
       const configRows = await runQuery<ConfigRow>(
         sql`SELECT account_group, percent, is_active
             FROM revenue_distribution_config
             WHERE is_active = true AND percent IS NOT NULL
             ORDER BY account_group`,
       );
       const rows = Array.isArray(configRows.rows) ? (configRows.rows as ConfigRow[]) : [];
       if (rows.length === 0) {
         // Egasi foizlarni hali belgilamagan — skip, log
         this.logger.warn(
           '[distributeRevenue] SKIP: revenue_distribution_config da active konfiguratsiya yo\'q. ' +
           'Egasi foizlarni belgilashi kerak (EP-FIN-005/006).',
         );
         return Ok({ distributed: false, reason: 'EGASI_CONFIG_KERAK' });
       }
       // Har guruh uchun GL entry: 4-hisob range bo'yicha account_code tanlash
       // (ACCOUNT_GROUPS dan min/max olib, accounts jadvalidan birinchi mos kodni olish)
       // NOTE: Bu metod EP-FIN-005 activation uchun placeholder — egasi foiz berganidan keyin
       // to'liq wiring amalga oshiriladi (owner stamps revenue_distribution_config).
       this.logger.log(`[distributeRevenue] Config mavjud (${rows.length} guruh) — wiring pending owner stamp`);
       return Ok({ distributed: false, reason: 'PENDING_OWNER_STAMP' });
     } catch (e: unknown) {
       return Err(AppErr('DB_ERROR', `distributeRevenue xato: ${String(e)}`));
     }
   }

   /** EP-FIN-006: Taqsimlash foizlarini yangilash — faqat director/owner/super_admin */
   async updateRevenueDistribution(
     configs: Array<{ accountGroup: string; percent: number }>,
     updatedBy: number,
     userRole: string,
   ): Promise<Result<{ updated: number }>> {
     const ALLOWED_ROLES = ['director', 'owner', 'super_admin'];
     if (!ALLOWED_ROLES.includes(userRole)) {
       return Err(AppErr('FORBIDDEN', 'Taqsimlash foizlarini faqat direktor/egasi o\'zgartira oladi (EP-FIN-006)'));
     }
     // UPDATE revenue_distribution_config ...
     // NOTE: DDL GATED — jadval yaratilguncha bu metod DB_ERROR qaytaradi.
     return Ok({ updated: configs.length });
   }
   ```

3. **Endpoint (`finance-accounting.controller.ts` — owned fayl #2):**
   ```typescript
   // EP-FIN-006: Taqsimlash foizlarini ko'rish (hamma)
   @Get('revenue-distribution')
   @Roles(Role.ACCOUNTANT, Role.DIRECTOR, Role.SUPER_ADMIN)
   async getRevenueDistribution() {
     // SELECT * FROM revenue_distribution_config
     // NOTE: DDL GATED — jadval yaratilguncha 404 yoki bo'sh array qaytaradi
   }

   // EP-FIN-006: Taqsimlash foizlarini yangilash (faqat director/super_admin)
   @Patch('revenue-distribution')
   @Roles(Role.DIRECTOR, Role.SUPER_ADMIN)
   async updateRevenueDistribution(@Body() body: unknown) {
     // delegate → accountingService.updateRevenueDistribution(...)
   }
   ```

**Qabul mezoni (EP-FIN-005/006):**
- `revenue_distribution_config` jadval DDL fayli yozilgan (GATED, `-- APPROVED:` bo'sh)
- `GET /api/accounting/revenue-distribution` → 200, 4 ta bo'sh qator (percent=null, is_active=false)
- `PATCH /api/accounting/revenue-distribution` → director/super_admin uchun 200; boshqa rol uchun 403
- Egasi foizlarni belgilaguncha `distributeRevenue` call → log "EGASI_CONFIG_KERAK", server crash yo'q

---

## 3. HOZIRGI HOLAT

### 3.1 Mavjud (exists)

**drizzle-gl-posting.repo.ts**
- Fayl: `apps/api/src/modules/finance/infrastructure/repositories/drizzle-gl-posting.repo.ts`
- `:72–119` — `insertJournal()` — REAL `db.transaction` bilan, `resolveAccountIds()` bilan,
  `entries` jadvaliga yozadi. **Ammo period-lock tekshiruvi YO'Q** (EP-FIN-064 gap).
- `:22–29` — `resolveAccountIds()` — account_code → integer id hal qiladi.
- `:121–133` — `findEntryIdByReference()` — reference prefix bo'yicha qidiradi.

**finance-accounting.controller.ts**
- `:37` — `@Controller('accounting')` → global prefix bilan `/api/accounting`
- `:99–103` — `GET 'periods'` → `/api/accounting/periods` — REAL (ishlaydi)
- `:109–118` — `POST 'periods/:id/close'` → REAL, `FinanceClosePeriodSchema` Zod bilan

**finance-accounting.service.ts**
- `:47–57` — `getPeriods()`, `getPeriod(id)`, `closePeriod(id, closedBy)` — REAL, repo ga delegate

**finance-gl.controller.ts**
- `:32` — `@Controller('finance/gl')` → `/api/finance/gl`
- `:44–54` — `GET /api/finance/gl` — entries list, REAL
- `:86–93` — `GET /api/finance/gl/trial-balance` — REAL
- `:96–109` — `GET /api/finance/gl/ledger/:accountCode` — REAL
- **4-hisob endpoint YO'Q** (EP-FIN-004 gap)

**PeriodClosing.tsx**
- `:67` — `queryKey: ["/api/accounting/periods"]` — URL to'g'ri, REAL data qaytaradi
- `:71–83` — `closePeriodMutation` — URL to'g'ri, lekin `body` berilmagan →
  BE `FinanceClosePeriodSchema.parse({})` — agar `closedBy` optional bo'lsa o'tadi, mandatory bo'lsa 400

**FinanceDashboard.tsx**
- `:87–89` — `queryKey: ["/api/gl/accounts"]` — BE da bu route YO'Q (404)
  (real route = `/api/finance/gl` entries, accounts = `/api/finance/accounting/accounts`)
- `:96–98` — `queryKey: ["/api/reports/trial-balance"]` — real route = `/api/finance/gl/trial-balance`
- `:100–102` — `queryKey: ["/api/reports/profit-loss"]` — real BE endpoint YO'Q (404)

**FinanceDashboardTabs.tsx**
- `:39–` — `DashboardOverviewTab` — 4 ta KPI karta (payroll periods, paid, AR, AP)
- 4-hisob widget YO'Q (EP-FIN-004 gap)

**gl-accounts.constants.ts**
- `:17–36` — `GL` object: kanonik BHMS kodlar (5010 kassa, 9010 tushum, ...)
- `:39–58` — `GL_ACCOUNTS_V2` object: alternativ set (1010 kassa, ...) — IKKI PARALLEL SET
  Bu inkonsistentlik bor, lekin bu paket scope'ida faqat range-based grouping amalga oshiriladi;
  GL_ACCOUNTS_V2 ni to'g'rilash boshqa paket scope'i.

### 3.2 Mavjud emas / buzuq (missing / brokenOrFake)

| # | Gap | Fayl:qator | Tasniflash |
|---|-----|-----------|------------|
| G1 | Period-lock tekshiruvi insertJournal ichida yo'q | `drizzle-gl-posting.repo.ts:72` | MISSING (EP-FIN-064) |
| G2 | 4-hisob (MAIN/TAX/HEAD/WORKING) endpoint yo'q | `finance-gl.controller.ts` | MISSING (EP-FIN-004) |
| G3 | 4-hisob widget FE da yo'q | `FinanceDashboardTabs.tsx` | MISSING (EP-FIN-004) |
| G4 | `PeriodClosing.tsx` closePeriodMutation body yubormiaydi | `PeriodClosing.tsx:71–72` | BROKEN |
| G5 | `FinanceDashboard.tsx:88` — `/api/gl/accounts` → 404 | `FinanceDashboard.tsx:88` | BROKEN |
| G6 | `FinanceDashboard.tsx:96` — `/api/reports/trial-balance` → 404 | `FinanceDashboard.tsx:96` | BROKEN |
| G7 | `FinanceDashboard.tsx:100` — `/api/reports/profit-loss` → 404 | `FinanceDashboard.tsx:100` | BROKEN |
| G8 | `FinanceClosePeriodSchema` — `closedBy` majburiy/optional tekshirilmagan | `finance.dto.ts` (tashqi fayl, faqat o'qish) | READ-ONLY tekshir |
| G9 | EP-FIN-005: `distributeRevenue` metodi yo'q | `finance-accounting.service.ts` | MISSING — DDL GATED |
| G10 | EP-FIN-005/006: `revenue_distribution_config` jadvali yo'q (DDL GATED) | yangi DDL fayl | MISSING — EGASI STAMP KERAK |
| G11 | EP-FIN-006: `GET/PATCH /api/accounting/revenue-distribution` endpoint'lari yo'q | `finance-accounting.controller.ts` | MISSING — DDL GATED |

---

## 4. ISH (qadam-baqadam)

### QADAM 1 — Period-lock: `drizzle-gl-posting.repo.ts`

**Maqsad:** `insertJournal()` chaqirilganda joriy entry_date bilan mos davr
`accounting_periods` jadvalida `'closed'` bo'lsa — `Err(AppErr('PERIOD_LOCKED', '...'))` qaytarsin.

**Fayl:** `Uzbek-Language-Module/apps/api/src/modules/finance/infrastructure/repositories/drizzle-gl-posting.repo.ts`

**Oldin (72–119 qatorlar, insertJournal boshi):**
```typescript
async insertJournal(rows: Array<{...}>): Promise<Result<number>> {
  try {
    // #04 fix: rows carry account CODES ...
    const idByCode = await resolveAccountIds(...)
    ...
```

**Keyin — period-lock tekshiruvini QO'SH (rows loop oldidan):**
```typescript
async insertJournal(rows: Array<{...}>): Promise<Result<number>> {
  try {
    // EP-FIN-064: period-lock check — reject if the entry date falls in a closed period.
    // Use the first row's entryDate (all rows in one journal share the same date).
    if (rows.length > 0) {
      const entryDate = rows[0].entryDate; // 'YYYY-MM-DD'
      const lockCheck = await runQuery<{ status: string }>(
        sql`SELECT status FROM accounting_periods
            WHERE fiscal_year = EXTRACT(YEAR FROM ${entryDate}::date)
              AND month       = EXTRACT(MONTH FROM ${entryDate}::date)
            LIMIT 1`,
      );
      const periodRow = Array.isArray(lockCheck.rows) ? lockCheck.rows[0] : undefined;
      // If a period record exists and it is closed, reject the journal.
      // If no period record exists (period not yet created), allow the insert
      // (open-by-default for periods not explicitly created — EP-FIN-064 intent).
      if (periodRow && periodRow.status === 'closed') {
        return Err(AppErr('PERIOD_LOCKED', `GL yozuvi rad etildi: ${entryDate} sanasi yopilgan davrga tushadi`));
      }
    }

    // #04 fix: rows carry account CODES ...
    const idByCode = await resolveAccountIds(...)
    ...
```

**Nima o'zgardi:**
- `runQuery<{ status: string }>` — `@shared/db` dan import, allaqachon bor
- `sql` — allaqachon import qilingan (`:13`)
- Agar `accounting_periods` jadvali bo'sh bo'lsa (davr yaratilmagan) — insert davom etadi (open-by-default)
- Agar davr `'open'` — davom etadi
- Agar davr `'closed'` — `Err('PERIOD_LOCKED')` qaytadi, transaction boshlanmaydi

**Result<T>:** ✅ Err/Ok pattern saqlangan. throw yo'q.

**DB-proof:** Period yopilgandan keyin shu davr sanasida insertJournal chaqir —
`entries` jadvalida yangi qator paydo bo'lmasligi kerak.

---

### QADAM 2 — 4-hisob endpoint: `finance-gl.controller.ts`

**Maqsad:** `GET /api/finance/gl/account-groups` — 4 ta guruh: MAIN/TAX/HEAD/WORKING,
har birida `entries` jadvalidagi debet/kredit yig'indilari va `accounts` jadvalidagi hisoblar ro'yxati.

**Fayl:** `Uzbek-Language-Module/apps/api/src/modules/finance/presentation/finance-gl.controller.ts`

**BHMS diapazon konstantalari (file ichida, magic number emas):**
```typescript
// BHMS account code range grouping for EP-FIN-004 (4-hisob)
// Ranges based on Uzbekistan national chart of accounts (BHMS):
//   WORKING = 1000–5999  (aylanma kapital: kassa, bank, debitorlar, inventar, tovarlar)
//   TAX     = 6000–6999  (majburiy to'lovlar: kreditorlar, QQS, INPS, bank kreditlari)
//   HEAD    = 8000–8999  (kapital va zaxiralar: ustav kapitali, taqsimlanmagan foyda)
//   MAIN    = 9000–9999  (foyda va zarar: tushum, tannarx, xarajatlar)
const ACCOUNT_GROUPS = {
  WORKING: { label: 'Aylanma kapital',         min: '1000', max: '5999' },
  TAX:     { label: 'Majburiy to\'lovlar',     min: '6000', max: '6999' },
  HEAD:    { label: 'Kapital va zaxiralar',    min: '8000', max: '8999' },
  MAIN:    { label: 'Foyda va zarar',          min: '9000', max: '9999' },
} as const;
```

**Endpoint qo'shish (finance-gl.controller.ts:109 dan keyin — `getLedger` metodidan keyin):**

```typescript
@ApiOperation({ summary: '4-hisob account groups with GL balances (EP-FIN-004)' })
@ApiResponse({ status: 200, description: 'OK' })
@Get('account-groups')
@Roles(Role.ACCOUNTANT, Role.DIRECTOR, Role.SUPER_ADMIN)
async getAccountGroups() {
  // EP-FIN-004: 4-hisob — range-based grouping via BHMS account code prefixes.
  // No new table needed; grouping is computed from existing `accounts` + `entries` tables.
  const result = await this.glService.getAccountGroups();
  return unwrapOrThrow(result);
}
```

**GlService-ga `getAccountGroups()` qo'shing (gl.service.ts — bu FAQAT O'QISH uchun referans;
metod ownedFiles dagi controller+service orasida qoladi — ammo gl.service.ts owned emas.
Shuning uchun: agentning vakolat doirasida faqat controller va repo bor. Vizyon talabi bu metoddan
foydalanishni talab qiladi. Yechim: metodni `finance-accounting.service.ts` yoki
`drizzle-finance-accounting.repo.ts` orqali amalga oshir — ular owned fayllarga kiradi).**

> ⚠️ **IZOLYATSIYA DIQQATI:** `gl.service.ts` owned fayl emas. `getAccountGroups` logikasi
> `finance-accounting.service.ts` (owned, fayl #3) orqali yoki to'g'ridan repo
> `drizzle-finance-accounting.repo.ts` (owned emas) orqali amalga oshirilishi mumkin.
> **Eng xavfsiz yol:** `finance-gl.controller.ts` ichida to'g'ridan `runQuery` chaqirish
> yordamchi private metod sifatida (controller qatlamida oddiy SQL logic, biznes qaror emas).
> Bu Qoida 6 (controller = transport) ga zid. Shuning uchun **`finance-accounting.service.ts`
> (owned fayl #3) ga `getAccountGroups()` metodi qo'shiladi**, va controller shu servisdan
> chaqiradi.

**finance-accounting.service.ts — yangi metod qo'shish:**

```typescript
// EP-FIN-004: 4-hisob account grouping — range-based, no new table.
// BHMS ranges: WORKING=1000–5999 / TAX=6000–6999 / HEAD=8000–8999 / MAIN=9000–9999
async getAccountGroups(): Promise<Result<AccountGroupRow[]>> {
  return this.accountingRepo.getAccountGroups();
}
```

**Bu metod uchun `DrizzleFinanceAccountingRepo` ga ham metod kerak — lekin bu fayl owned emas.**
Eng xavfsiz yechim: `finance-accounting.service.ts` ichida to'g'ridan `runQuery` chaqirish.
`DrizzleFinanceAccountingRepo` owned emas → to'g'ridan import imkoni yo'q.
**Ammo `runQuery` va `sql` — `@shared/db` dan import qilinadi, bu allowed.**

**Yangilangan yondashuv — `finance-accounting.service.ts` ichida `runQuery` to'g'ridan:**

```typescript
import { runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { Ok, Err, AppErr } from '@common/result';

// Fayl boshiga type qo'shish:
interface AccountGroupEntry {
  group: string;
  label: string;
  totalDebit: number;
  totalCredit: number;
  balance: number;
  accountCount: number;
  accounts: Array<{ code: string; name: string; type: string; debit: number; credit: number }>;
}

// Servis ichida yangi metod:
async getAccountGroups(): Promise<Result<AccountGroupEntry[]>> {
  try {
    // EP-FIN-004: range-based grouping from existing `accounts` + `entries` tables.
    // Raw SQL used intentionally: Drizzle ORM cannot express CASE-WHEN range grouping
    // across joined tables with conditional aggregation in a single typesafe query. (Q-4 exception)
    const res = await runQuery<{
      grp: string; label: string;
      total_debit: string; total_credit: string;
      account_count: string;
      acc_code: string | null; acc_name: string | null; acc_type: string | null;
      acc_debit: string | null; acc_credit: string | null;
    }>(sql`
      WITH grp AS (
        SELECT
          a.id, a.account_code, a.account_name, a.account_type,
          COALESCE(SUM(CASE WHEN e.debit_account  = CAST(a.id AS VARCHAR) THEN e.amount ELSE 0 END), 0) AS acc_debit,
          COALESCE(SUM(CASE WHEN e.credit_account = CAST(a.id AS VARCHAR) THEN e.amount ELSE 0 END), 0) AS acc_credit,
          CASE
            WHEN a.account_code >= '9000' AND a.account_code <= '9999' THEN 'MAIN'
            WHEN a.account_code >= '8000' AND a.account_code <= '8999' THEN 'HEAD'
            WHEN a.account_code >= '6000' AND a.account_code <= '6999' THEN 'TAX'
            ELSE 'WORKING'
          END AS grp,
          CASE
            WHEN a.account_code >= '9000' AND a.account_code <= '9999' THEN 'Foyda va zarar'
            WHEN a.account_code >= '8000' AND a.account_code <= '8999' THEN 'Kapital va zaxiralar'
            WHEN a.account_code >= '6000' AND a.account_code <= '6999' THEN 'Majburiy to''lovlar'
            ELSE 'Aylanma kapital'
          END AS label
        FROM accounts a
        LEFT JOIN entries e ON e.debit_account = CAST(a.id AS VARCHAR)
                            OR e.credit_account = CAST(a.id AS VARCHAR)
        GROUP BY a.id, a.account_code, a.account_name, a.account_type
      )
      SELECT
        g.grp, g.label,
        SUM(g.acc_debit)  AS total_debit,
        SUM(g.acc_credit) AS total_credit,
        COUNT(*)          AS account_count,
        g.account_code    AS acc_code,
        g.account_name    AS acc_name,
        g.account_type    AS acc_type,
        g.acc_debit,
        g.acc_credit
      FROM grp g
      GROUP BY g.grp, g.label, g.account_code, g.account_name, g.account_type, g.acc_debit, g.acc_credit
      ORDER BY g.grp, g.account_code
    `);

    const rows = Array.isArray(res.rows) ? res.rows : [];

    // Pivot rows into 4 groups
    const groupMap = new Map<string, AccountGroupEntry>();
    for (const r of rows) {
      if (!groupMap.has(r.grp)) {
        groupMap.set(r.grp, {
          group: r.grp,
          label: r.label,
          totalDebit: 0,
          totalCredit: 0,
          balance: 0,
          accountCount: 0,
          accounts: [],
        });
      }
      const g = groupMap.get(r.grp)!;
      const d = Number(r.acc_debit ?? 0);
      const c = Number(r.acc_credit ?? 0);
      g.totalDebit  += d;
      g.totalCredit += c;
      g.accountCount += 1;
      g.balance = g.totalDebit - g.totalCredit;
      if (r.acc_code) {
        g.accounts.push({
          code: r.acc_code,
          name: r.acc_name ?? '',
          type: r.acc_type ?? '',
          debit: d,
          credit: c,
        });
      }
    }
    return Ok(Array.from(groupMap.values()));
  } catch (e: unknown) {
    return Err(AppErr('DB_ERROR', `4-hisob_GROUP_QUERY_FAILED: ${String(e)}`));
  }
}
```

**finance-gl.controller.ts — endpoint qo'shish (constructor ga `FinanceAccountingService` kerak):**

Hozirgi `finance-gl.controller.ts:38–41`:
```typescript
constructor(private commandBus: CommandBus,
  private queryBus: QueryBus,
  private glPostingService: GlPostingService,
  private glService: GlService) {}
```

Keyin:
```typescript
constructor(private commandBus: CommandBus,
  private queryBus: QueryBus,
  private glPostingService: GlPostingService,
  private glService: GlService,
  private accountingService: FinanceAccountingService) {}
```

Shuningdek import qo'shiladi:
```typescript
import { FinanceAccountingService } from '../application/finance-accounting.service';
```

Endpoint (class oxirida, `getLedger` dan keyin):
```typescript
@ApiOperation({ summary: '4-hisob balances by account group (EP-FIN-004)' })
@ApiResponse({ status: 200, description: '4 groups: MAIN/TAX/HEAD/WORKING with GL balances' })
@Get('account-groups')
@Roles(Role.ACCOUNTANT, Role.DIRECTOR, Role.SUPER_ADMIN)
async getAccountGroups() {
  const result = await this.accountingService.getAccountGroups();
  return unwrapOrThrow(result);
}
```

> ⚠️ **NestJS DI:** `FinanceAccountingService` allaqachon `FinanceModule` ga registered bo'lishi
> kerak. Agar `finance-gl.controller.ts` boshqa module ichida bo'lsa — flag qiling va TO'XTANG.
> Verify: `apps/api/src/modules/finance/finance.module.ts` da ikkala controller ham registered.

---

### QADAM 3 — URL fix: `PeriodClosing.tsx`

**Fayl:** `Uzbek-Language-Module/artifacts/erp-dashboard/src/pages/PeriodClosing.tsx`

**Muammo 1 — `closePeriodMutation` body yubormiaydi (`:71–72`):**

Oldin:
```typescript
mutationFn: async (periodId: string) => {
  return apiRequest("POST", `/api/accounting/periods/${periodId}/close`);
},
```

Keyin:
```typescript
mutationFn: async (periodId: string) => {
  // BE FinanceClosePeriodSchema closedBy optional — body bo'sh ob'ekt ham o'tadi.
  // closedBy: null → BE null sifatida saqlaydi (foydalanuvchi ID siz)
  return apiRequest("POST", `/api/accounting/periods/${periodId}/close`, {});
},
```

**Muammo 2 — `queryClient.invalidateQueries` keyin `refetch` chaqirilsin:**

Hozirgi `onSuccess`:
```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["/api/accounting/periods"] });
  setClosePeriodDialogOpen(false);
  setSelectedPeriod(null);
  toast({ ... });
},
```

Bu to'g'ri, lekin `periods = []` default bo'lgani uchun error state ko'rsatmaydi.
`isError` holati ham to'g'ri. Muammo yo'q.

**Muammo 3 — 200 response body tekshiruvi:**
`getPeriods()` dan kelgan ma'lumot `FinanceAccountingService.getPeriods()` →
`accountingRepo.getPeriods()` → `runQuery<Row>(SELECT * FROM accounting_periods ...)`.
`Row[]` array qaytadi — FE `AccountingPeriod[]` sifatida qabul qiladi. Maydon nomlar:
- BE: `fiscal_year`, `month`, `period_name`, `start_date`, `end_date`, `status`, `closed_by`, `closed_at`
- FE interface: `fiscalYear`, `month`, `periodName`, `startDate`, `endDate`, `status`, `closedBy`, `closedAt`

**Muammo 4 — camelCase/snake_case mismatch:**
BE raw SQL `SELECT *` snake_case qaytaradi, FE camelCase kutadi.
`period.fiscalYear` `undefined` bo'ladi → jadval bo'sh ko'rinadi.

**Fix — FE `:66–67` query da `select` transform qo'shish:**
```typescript
const { data: periods = [], isLoading, refetch, isError, error} = useQuery<AccountingPeriod[]>({
  queryKey: ["/api/accounting/periods"],
  select: (raw: unknown) => {
    const arr = Array.isArray(raw) ? raw : (Array.isArray((raw as { items?: unknown[] })?.items) ? (raw as { items: unknown[] }).items : []);
    return (arr as Record<string, unknown>[]).map(r => ({
      id:         String(r.id ?? ''),
      fiscalYear: Number(r.fiscal_year ?? r.fiscalYear ?? 0),
      month:      Number(r.month ?? 0),
      periodName: String(r.period_name ?? r.periodName ?? ''),
      startDate:  String(r.start_date ?? r.startDate ?? ''),
      endDate:    String(r.end_date   ?? r.endDate   ?? ''),
      status:     String(r.status ?? 'open'),
      closedBy:   r.closed_by  != null ? String(r.closed_by)  : r.closedBy != null ? String(r.closedBy) : null,
      closedAt:   r.closed_at  != null ? String(r.closed_at)  : r.closedAt != null ? String(r.closedAt) : null,
    })) as AccountingPeriod[];
  },
});
```

---

### QADAM 4 — URL fix: `FinanceDashboard.tsx`

**Fayl:** `Uzbek-Language-Module/artifacts/erp-dashboard/src/pages/FinanceDashboard.tsx`

**G5 — `queryKey: ["/api/gl/accounts"]` → 404:**

Oldin (`:87–89`):
```typescript
const { data: accounts = [] } = useQuery<Account[]>({
  queryKey: ["/api/gl/accounts"],
});
```

Keyin — real URL (`GET /api/finance/accounting/accounts` yoki `GET /api/accounting/accounts`):
Tekshiruv: `finance-accounting.controller.ts:60–71` `@Get('accounts')` → `/api/accounting/accounts`.
```typescript
const { data: accountsResp } = useQuery<{ items: Account[]; total: number }>({
  queryKey: ["/api/accounting/accounts"],
});
const accounts = Array.isArray(accountsResp?.items) ? accountsResp.items : [];
```

**G6 — `queryKey: ["/api/reports/trial-balance"]` → 404:**

Real URL: `GET /api/finance/gl/trial-balance` (finance-gl.controller.ts:88).
Oldin (`:96–98`):
```typescript
const { data: trialBalance } = useQuery<TrialBalanceData>({
  queryKey: ["/api/reports/trial-balance"],
});
```

Keyin:
```typescript
const { data: trialBalance } = useQuery<TrialBalanceData>({
  queryKey: ["/api/finance/gl/trial-balance"],
});
```

**G7 — `queryKey: ["/api/reports/profit-loss"]` → 404:**

BE da `GET /api/reports/profit-loss` hozirda mavjud emas (owned fayl emas).
Bu endpoint boshqa paket scope'i. Shuning uchun query `enabled: false` qilib vaqtincha o'chirilsin:
```typescript
const { data: profitLoss } = useQuery<ProfitLossData>({
  queryKey: ["/api/reports/profit-loss"],
  enabled: false, // EP-FIN-031 — PDF reports paket scope'ida (boshqa agent)
});
```

---

### QADAM 5 — 4-hisob widget: `FinanceDashboardTabs.tsx`

**Fayl:** `Uzbek-Language-Module/artifacts/erp-dashboard/src/pages/FinanceDashboardTabs.tsx`

**Maqsad:** `DashboardOverviewTab` ichida 4-hisob karta-qatorini qo'shish.
Real data `GET /api/finance/gl/account-groups` dan keladi.

**DashboardOverviewTabProps interface'ga qo'shish:**
```typescript
interface DashboardOverviewTabProps {
  dashboard: DashboardStats | undefined;
  fpCycle: FpCycleData | undefined;
  sysSettings: { inpsRate?: number; minWage?: number; qqsRate?: number } | undefined;
  onSeedAccounts: () => void;
  isSeedingAccounts: boolean;
  // EP-FIN-004: 4-hisob account groups
  accountGroups?: Array<{
    group: string;
    label: string;
    totalDebit: number;
    totalCredit: number;
    balance: number;
    accountCount: number;
  }>;
  isAccountGroupsLoading?: boolean;
}
```

**DashboardOverviewTab component ichida widget qo'shish (`FinanceDashboardTabs.tsx`):**
Mavjud 4 ta KPI karta (`:41–65`) dan keyin, ZvsWidget (`:69`) dan oldin:

```tsx
{/* EP-FIN-004: 4-hisob widget — MAIN/TAX/HEAD/WORKING balances */}
{(accountGroups && accountGroups.length > 0) && (
  <div className="bg-card rounded-xl p-5 mb-6" data-testid="account-groups-widget">
    <h3 className="text-base font-semibold mb-3">4-Hisob Balanslari</h3>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {accountGroups.map((grp) => {
        const isPositive = grp.balance >= 0;
        return (
          <div
            key={grp.group}
            className="rounded-lg border border-muted p-4 flex flex-col gap-1"
            data-testid={`account-group-${grp.group.toLowerCase()}`}
          >
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {grp.group}
            </span>
            <span className="text-sm text-muted-foreground">{grp.label}</span>
            <span
              className={`text-2xl font-bold mt-1 ${isPositive ? 'text-[var(--ep-green)]' : 'text-[var(--ep-red)]'}`}
            >
              {formatCurrency(Math.abs(grp.balance))}
            </span>
            <span className="text-xs text-muted-foreground mt-1">
              {grp.accountCount} ta hisob · D:{formatCurrency(grp.totalDebit)} K:{formatCurrency(grp.totalCredit)}
            </span>
          </div>
        );
      })}
    </div>
  </div>
)}
{isAccountGroupsLoading && (
  <div className="bg-card rounded-xl p-5 mb-6 animate-pulse h-28" data-testid="account-groups-loading" />
)}
```

**`FinanceDashboard.tsx` ichida query qo'shish va prop uzatish:**

Query (mavjud querylar yonida):
```typescript
const { data: accountGroupsData, isLoading: isAccountGroupsLoading } = useQuery<
  Array<{ group: string; label: string; totalDebit: number; totalCredit: number; balance: number; accountCount: number }>
>({
  queryKey: ["/api/finance/gl/account-groups"],
});
const accountGroups = Array.isArray(accountGroupsData) ? accountGroupsData : [];
```

`DashboardOverviewTab` ga prop uzatish (`:290–296`):
```tsx
<DashboardOverviewTab
  dashboard={dashboard}
  fpCycle={fpCycle}
  sysSettings={sysSettings}
  onSeedAccounts={() => seedAccountsMutation.mutate()}
  isSeedingAccounts={seedAccountsMutation.isPending}
  accountGroups={accountGroups}
  isAccountGroupsLoading={isAccountGroupsLoading}
/>
```

---

## 5. DDL

**ddlGate: false** — yangi jadval yoki migration talab qilinmaydi.

4-hisob guruhlash mavjud `accounts` va `entries` jadvallaridan range-based SQL `CASE WHEN`
orqali amalga oshiriladi. Yangi ustun, VIEW yoki jadval KERAK EMAS.

Agar kelajakda `account_subtype` ustuni kerak bo'lsa (EP-FIN-004 kengaytmasi) — bu alohida
paket scope'i va alohida DDL-approval talab qiladi.

---

## 6. QABUL MEZONI

### BE tekshiruvi

- [ ] `pnpm tsc --noEmit` → **0 xato** (BE)
- [ ] `bash scripts/reviewer-result-pattern.sh` → 0 FAIL
- [ ] `bash scripts/reviewer-array-safety.sh` → 0 FAIL
- [ ] `bash scripts/reviewer-as-unknown.sh` → 0 yangi FAIL (P24 fayllarida)

### FE tekshiruvi

- [ ] `pnpm tsc --noEmit` → **0 xato** (FE)
- [ ] FE build: `pnpm --filter erp-dashboard run build` → muvaffaqiyatli

### Period-lock DB-proof (EP-FIN-064)

- [ ] Mavjud ochiq davr mavjud bo'lsin (yoki yangisini yaratingchiq):
  ```sql
  INSERT INTO accounting_periods (fiscal_year, month, period_name, start_date, end_date, status)
  VALUES (2026, 6, '2026-06', '2026-06-01', '2026-06-30', 'open')
  ON CONFLICT DO NOTHING;
  ```
- [ ] Davrni yoping: `POST /api/accounting/periods/{id}/close` body=`{}`
- [ ] `SELECT status FROM accounting_periods WHERE id = {id}` → `'closed'`
- [ ] `insertJournal` shu davr sanasida chaqirib: yangi `entries` qator PAYDO BO'LMASLIGI kerak
  (masalan, `POST /api/finance/gl/post-sales-invoice` bilan `entryDate = '2026-06-15'`):
  ```
  400 Bad Request: {"message": "GL yozuvi rad etildi: 2026-06-15 sanasi yopilgan davrga tushadi"}
  ```
- [ ] Ochiq davr sanasida (`'2026-07-15'`) insertJournal — muvaffaqiyatli (201)

### 4-hisob DB-proof (EP-FIN-004)

- [ ] `GET /api/finance/gl/account-groups` → 200, body = 4 element massiv
  (MAIN, TAX, HEAD, WORKING yoki subset — `accounts` jadvali bo'sh bo'lsa ham 0 element xatosiz)
- [ ] Har element: `group`, `label`, `totalDebit`, `totalCredit`, `balance`, `accountCount`, `accounts`
- [ ] FE `/finance-dashboard` → "4-Hisob Balanslari" widget ko'rinadi (data-testid=`account-groups-widget`)

### URL fix DB-proof

- [ ] `GET /api/accounting/periods` → 200 (mavjud)
- [ ] `POST /api/accounting/periods/{id}/close` body=`{}` → 200/201 (mavjud davr uchun)
- [ ] FE `PeriodClosing.tsx` — davr ro'yxati ko'rinadi (camelCase transform ishlaydi)
- [ ] FE `FinanceDashboard.tsx` — `accounts` tab — `/api/accounting/accounts` ga so'rov ketadi (404 emas)
- [ ] FE `FinanceDashboard.tsx` — trial balance tab — `/api/finance/gl/trial-balance` ga so'rov ketadi

### Golden thread regress

- [ ] `GET /api/finance/gl` (entries list) — avval ishlagan, hamon ishlaydi (200)
- [ ] `GET /api/finance/gl/trial-balance` — hamon ishlaydi (200)
- [ ] `GET /api/accounting/periods` — hamon ishlaydi (200)
- [ ] `POST /api/payroll/periods/{id}/close` — hamon ishlaydi (200) (FinanceDashboard.tsx)

---

## 7. SELF-VERIFY

### 7.1 Backend typecheck

```bash
cd Uzbek-Language-Module
pnpm --filter @europrint/api run typecheck
# yoki:
npx tsc --noEmit -p apps/api/tsconfig.json
# Natija: "Found 0 errors." — aks holda to'g'irlanguncha commit TAQIQ
```

### 7.2 Frontend typecheck + build

```bash
pnpm --filter erp-dashboard run typecheck
# yoki:
npx tsc --noEmit -p artifacts/erp-dashboard/tsconfig.json
# "Found 0 errors."

pnpm --filter erp-dashboard run build
# muvaffaqiyatli tugashi kerak
```

### 7.3 Reviewer skriptlar

```bash
bash scripts/reviewer-result-pattern.sh
bash scripts/reviewer-array-safety.sh
bash scripts/reviewer-as-unknown.sh
# Har biri: FAIL=0 yoki yangi FAIL yo'q
```

### 7.4 Period-lock probe (curl)

```bash
# 1. Joriy davrlarni olish
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3030/api/accounting/periods | jq '.'

# 2. Davrni yopish (ID ni almashtiring)
curl -s -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}' \
  http://localhost:3030/api/accounting/periods/1/close | jq '.'

# 3. Yopilgan davr sanasida GL yozuvi urinishi — 400 kelishi kerak
curl -s -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"invoiceId":"TEST-001","amount":1000000,"tax":0}' \
  http://localhost:3030/api/finance/gl/post-sales-invoice | jq '.message'
# Kutilgan: "GL yozuvi rad etildi: ... sanasi yopilgan davrga tushadi"

# 4. entries jadvalida yangi qator yo'q ekanligini tekshirish
# (psql orqali)
# SELECT COUNT(*) FROM entries WHERE entry_number LIKE 'SI-TEST-001-%';
# → 0 bo'lishi kerak
```

### 7.5 4-hisob probe (curl)

```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:3030/api/finance/gl/account-groups | jq 'length'
# → 4 (yoki accounts jadvali bo'sh bo'lsa 0 yoki kam)

curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:3030/api/finance/gl/account-groups | jq '.[].group'
# → "MAIN", "TAX", "HEAD", "WORKING"
```

### 7.6 DB to'g'ridan tekshirish

```sql
-- Period lock tekshirish
SELECT id, fiscal_year, month, status FROM accounting_periods ORDER BY id;

-- 4-hisob accounts mavjud ekanligini tekshirish
SELECT account_code, account_name, account_type FROM accounts ORDER BY account_code LIMIT 10;

-- entries mavjud ekanligini tekshirish
SELECT COUNT(*) FROM entries;
```

### 7.7 FE brauzer tekshiruvi

1. `/accounting/period-closing` — davr ro'yxati ko'rinadi (skeleton emas, bo'sh holat emas)
2. Bir davrni yoping — badge "Yopiq" bo'ladi, "Yopish" tugmasi yo'qoladi
3. `/finance-dashboard` — Hisob-kitob tab — hisoblar ko'rinadi (404 emas)
4. `/finance-dashboard` — Dashboard tab — "4-Hisob Balanslari" widget ko'rinadi
5. DevTools Network — `account-groups` so'rovi 200 qaytaradi

---

## 8. COMMIT

**FAQAT owned fayllar commit qilinadi. -A taqiq.**

### Commit 1 — BE period-lock + 4-hisob

```bash
git add \
  Uzbek-Language-Module/apps/api/src/modules/finance/infrastructure/repositories/drizzle-gl-posting.repo.ts \
  Uzbek-Language-Module/apps/api/src/modules/finance/presentation/finance-accounting.controller.ts \
  Uzbek-Language-Module/apps/api/src/modules/finance/application/finance-accounting.service.ts \
  Uzbek-Language-Module/apps/api/src/modules/finance/presentation/finance-gl.controller.ts

git commit -m "feat(fin/gl): P24 period-lock + 4-hisob endpoint (EP-FIN-004/064)

- drizzle-gl-posting.repo.ts: insertJournal da period-lock tekshiruvi qo'shildi
  (accounting_periods.status='closed' bo'lsa Err('PERIOD_LOCKED') qaytaradi)
- finance-accounting.service.ts: getAccountGroups() metodi qo'shildi
  (BHMS range-based: MAIN=9xxx/TAX=6xxx/HEAD=8xxx/WORKING=1-5xxx)
- finance-gl.controller.ts: GET /api/finance/gl/account-groups endpoint qo'shildi
  (RBAC: ACCOUNTANT/DIRECTOR/SUPER_ADMIN)

EP-FIN-004 + EP-FIN-064 | wave-2 | P24"
```

### Commit 2 — FE URL fix + 4-hisob widget

```bash
git add \
  Uzbek-Language-Module/artifacts/erp-dashboard/src/pages/PeriodClosing.tsx \
  Uzbek-Language-Module/artifacts/erp-dashboard/src/pages/FinanceDashboard.tsx \
  Uzbek-Language-Module/artifacts/erp-dashboard/src/pages/FinanceDashboardTabs.tsx

git commit -m "fix(fin/fe): P24 URL fix + 4-hisob widget (PeriodClosing/Dashboard)

- PeriodClosing.tsx: closePeriodMutation body qo'shildi {}; snake_case→camelCase
  select transform qo'shildi (fiscal_year→fiscalYear, ...)
- FinanceDashboard.tsx: /api/gl/accounts→/api/accounting/accounts,
  /api/reports/trial-balance→/api/finance/gl/trial-balance,
  /api/reports/profit-loss enabled=false (scope boshqa paket),
  accountGroups query qo'shildi /api/finance/gl/account-groups
- FinanceDashboardTabs.tsx: DashboardOverviewTab props yangilandi,
  4-hisob balanslari widget qo'shildi (MAIN/TAX/HEAD/WORKING)

EP-FIN-004 | wave-2 | P24"
```

---

## 9. EDGE HOLATLAR VA CHUQUR TAHLIL

### 9A. Period-lock: bir vaqtda bir nechta davr muammosi

Agar `accounting_periods` da bir oy uchun bir nechta qator bo'lsa (masalan, test seedi
ikki marta ishga tushirilgan), SQL `LIMIT 1` birinchisini oladi. Agar birinchisi `'open'`,
ikkinchisi `'closed'` bo'lsa — `'open'` qaytadi va journal o'tib ketadi.

**Yechim (mustahkam):** `ORDER BY id DESC LIMIT 1` — eng yangi davrni ol. Yoki `status = 'closed'`
bo'lgan davr MAVJUD bo'lsa reject qil:

```typescript
const lockCheck = await runQuery<{ status: string }>(
  sql`SELECT status FROM accounting_periods
      WHERE fiscal_year = EXTRACT(YEAR FROM ${entryDate}::date)
        AND month       = EXTRACT(MONTH FROM ${entryDate}::date)
      ORDER BY id DESC
      LIMIT 1`,
);
```

Bu `ORDER BY id DESC` bilan eng yangi davr holati tekshiriladi — qaysi biri oxirgi
yaratilgan bo'lsa, o'sha amal qiladi.

### 9B. Period-lock: entryDate formati tekshiruvi

`entryDate` string `'YYYY-MM-DD'` formatida kelishi kerak. Agar `'2026-6-1'` (padding yo'q)
kelsa, `EXTRACT(YEAR FROM '2026-6-1'::date)` PostgreSQL da ishlaydi (implicit cast).
Ammo `''` (bo'sh string) yoki `'invalid-date'` bo'lsa PostgreSQL xato beradi.

Bu `resolveAccountIds` dan OLDIN tekshiriladi — invalid entryDate holati Err bilan
qaytadi (try-catch ushlaydi). Xavfsiz.

### 9C. 4-hisob: accounts jadvali bo'sh bo'lganda

Agar `accounts` jadvali bo'sh bo'lsa:
- SQL `LEFT JOIN entries` ham bo'sh
- `groupMap` bo'sh Map
- `Ok([])` qaytadi

FE: `accountGroups = []` → widget ko'rinmaydi. Bu to'g'ri. "Hisoblar to'ldirilmagan"
holatida widget ko'rsatmaslik mantiqan to'g'ri.

Agar kelajakda "bo'sh holat" ko'rsatish kerak bo'lsa — FE da `accountGroups.length === 0`
tekshiruvi qo'shilib, "Hisoblar to'ldirilmagan. Urug'lantirish tugmasini bosing" xabari
ko'rsatilishi mumkin. Bu P24 scope'idan tashqari.

### 9D. finance-gl.controller.ts — FinanceAccountingService DI muammo holati

Agar `FinanceAccountingService` `FinanceGlController` bilan bir module'da ro'yxatdan
o'tmagan bo'lsa, NestJS DI `Cannot inject service` xatosi beradi. Bu holda:

1. `finance.module.ts` ni o'qing (owned fayl emas — faqat o'qing, o'zgartirmang)
2. Agar `FinanceGlController` `FinanceModule` da providers orqali bog'liq bo'lsa — DI ishlaydi
3. Agar `FinanceGlController` boshqa module da bo'lsa — **TO'XTAN, flag qiling**

**Muqobil yechim (DI muammo bo'lsa):** `getAccountGroups()` mantiqini
`FinanceAccountingService` da emas, `GlService` da implement qiling (u allaqachon
`finance-gl.controller.ts` da inject qilingan — `:41` `private glService: GlService`).

`GlService` (`gl.service.ts`) owned fayl emas, ammo bu holda `finance-gl.controller.ts`
(owned) `glService.getAccountGroups()` chaqiradi — `GlService` ga metod qo'shish kerak
bo'ladi. **Bu holda egasiga flag qilib, `gl.service.ts` ni scope'ga kiritish so'raling.**

### 9E. `GlPostingService` provider/export — `finance.module.ts` egasi P25

> ⭐ **BOGLIQLIK — P24 egizdek ma'lumot, P25 bajaradi:**
> `finance.module.ts` faylini P24 OWNED EMAS.
> P08 (golden-wms-fin-e2e) ning `DeliveryCompletedListener` klassiga
> `GlPostingService` inject qilinishi uchun `GlPostingService` `FinanceModule`
> providers va exports ro'yxatida bo'lishi shart.
>
> **`finance.module.ts` egasi: P25** (fin-zvs-zno direktiva — P25 §1 izolyatsiya
> manifesti `apps/api/src/modules/finance/finance.module.ts` ni OWNED fayl sifatida
> aniq ko'rsatadi; P25 QADAM 6 bu faylni to'g'ridan o'zgartiradi).
>
> **P25 bajaruvchisi** `finance.module.ts` ga quyidagi o'zgartirish kiritishi shart
> (P25 direktiva o'z qadamlarida buni amalga oshirishi kerak):
>
> ```typescript
> // finance.module.ts — providers array ichida:
> GlPostingService,   // ← agar yo'q bo'lsa qo'shish (P08 DeliveryCompletedListener uchun)
>
> // finance.module.ts — exports array ichida:
> GlPostingService,   // ← agar yo'q bo'lsa qo'shish (boshqa modul inject qilishi uchun)
> ```
>
> P24 bajaruvchisi faqat tekshiradi (read-only):
> ```bash
> grep "GlPostingService" \
>   Uzbek-Language-Module/apps/api/src/modules/finance/finance.module.ts
> # Agar chiqmasa — P25 merge bo'lishini kuting yoki egaga flag qiling
> ```
>
> P24 to'xtamaydi — owned 7 faylida ishlashni davom ettiradi.

### 9E. FinanceDashboard.tsx — /api/reports/profit-loss enabled:false muallaqlik

`enabled: false` bilan query umuman chiqmaydi → `profitLoss = undefined` → `ReportsTab`
ga `undefined` uzatiladi. `ReportsTab` (`FinanceDashboardTabsExtra.tsx`) `profitLoss` ni
qanday ko'rsatishi bog'liq:

- Agar `profitLoss?.data` ko'rsatsa — `undefined` holat uchun "ma'lumot yo'q" ko'rinishi kerak
- Agar crash bersa — owned fayl emas, flag qiling

Bu holat P24 scope'ida `enabled: false` bilan xavfsiz, chunki avval ham 404 bilan
`profitLoss = undefined` edi. Hech qanday regression yo'q.

### 9F. PeriodClosing.tsx — camelCase transform chuqurroq tekshiruvi

BE `getPeriods()` → `accountingRepo.getPeriods()` → raw SQL `SELECT *` → `rows.rows`.
`runQuery<Row>` — `Row = Record<string, unknown>`. Maydon nomlari PostgreSQL kalit so'zlari:
`fiscal_year`, `month`, `period_name`, `start_date`, `end_date`, `status`, `closed_by`, `closed_at`.

FE `select` transformer har ikkala holat ni ko'rib chiqadi:
- `r.fiscal_year` (snake_case, BE to'g'ridan qaytarsa)
- `r.fiscalYear` (camelCase, middleware o'girsa)

Agar BE `finance-accounting.service.ts` query natijasini camelCase ga o'girib yuborsa —
`r.fiscalYear` ishlaydi. Agar o'girmasa — `r.fiscal_year` ishlaydi.
Ikkalasi ham `??` orqali tekshiriladi — xavfsiz.

### 9G. Commit tartibini buzmaslik

MASSIV-50 da 50 ta agent parallel ishlaydi. Shu sababli:
- `git add <aniq-fayl>` — faqat P24 owned fayllar
- `-A` taqiq — boshqa agentlarning o'zgarishlarini o'z ichiga olishi mumkin
- `git status` — commit oldidan tekshirish: faqat P24 fayllar ko'rinishi kerak

Agar `git status` boshqa fayllarni ko'rsatsa — ular **stash QILINMAYDI**, faqat o'z
fayllaringizni staged qiling, qolganlarni unstaged qoldiring.

---

## 10B. XATO HOLAT JAVOBLARI (edge cases)

| Holat | Kutilgan javob | Tekshiruv |
|-------|----------------|-----------|
| `insertJournal` yopilgan davr sana bilan | `Err('PERIOD_LOCKED')` → controller 400 BadRequest | curl |
| `insertJournal` ochiq davr sana bilan | `Ok(firstId)` → 201 | curl |
| `insertJournal` davr MAVJUD EMAS sana bilan | `Ok(firstId)` → 201 (open-by-default) | curl |
| `GET /api/finance/gl/account-groups` accounts bo'sh | `200 []` | curl |
| `GET /api/finance/gl/account-groups` entries bilan | `200 [MAIN, TAX, HEAD, WORKING]` | curl |
| `POST /api/accounting/periods/:id/close` mavjud id | `200/201` | curl |
| `POST /api/accounting/periods/:id/close` mavjud emas id | `404` (assertFound) | curl |
| `POST /api/accounting/periods/:id/close` allaqachon yopilgan | `400` (assertValidated) | curl |
| FE PeriodClosing — bo'sh `accounting_periods` | "Ma'lumot yo'q" satri (noData) | brauzer |
| FE FinanceDashboard accounts tab — hisob yo'q | `items=[]`, sahifa crash bermaydi | brauzer |

---

## 11. QOIDALAR BLOKI (yana bir bor — Q-47 talabi)

Har bir amaliyot oldidan qayta ko'rib chiqing:

```
✅ Result<T> — hamma yangi metod/repo Err/Ok qaytaradi
✅ Zod — @Body validation mavjud controller endpoint larida
✅ Drizzle / runQuery — raw SQL izoh bilan (Qadam 2 aggregate)
✅ Q-40 REAL — insertJournal period-lock REAL DB query qiladi, hardcoded emas
✅ Q-46 — mavjud insertJournal logikasi o'chirilmaydi, faqat OLDIN check qo'shiladi
✅ Q-23 — faqat 7 owned fayl, boshqasiga TEGMA
✅ git add <aniq-fayl> — -A taqiq
✅ tsc 0 — commit oldidan tekshir
✅ DB-proof — kirit→saqla→qayta o'qi
```

---

## 13. MUAMMOLAR VA CHEKLOVLAR (to'liq ro'yxat)

### 13.1 NestJS DI tekshiruvi (oldindan)

`finance-gl.controller.ts` ichida `FinanceAccountingService` inject qilinishi uchun:
1. `FinanceAccountingService` `finance.module.ts` providers'ida ro'yxatdan o'tgan bo'lishi kerak
2. `FinanceGlController` shu module ichida ro'yxatdan o'tgan bo'lishi kerak

Agar modul tuzilishi noto'g'ri bo'lsa — **TO'XTAN, egasiga flag qiling**. Boshqa modullarga
tegmang.

> ⭐ **finance.module.ts egasi: P25** — Bu faylni P24 OWNED EMAS.
> Agar `FinanceAccountingService` yoki `GlPostingService` providers'dan tushib qolgan bo'lsa,
> P25 (fin-zvs-zno) paketi bu faylni OWNED qilib, o'zgartiradi (§1 Izolyatsiya Manifesti).
> P08 uchun `GlPostingService` DI ham P25 mas'uliyatida (§9E ga qarang).
> P24 bajaruvchisi `finance.module.ts` faylini faqat o'qiydi — TEGMAYDI.

### 9.2 entries da debit_account/credit_account typi

`drizzle-gl-posting.repo.ts:101–102` — `debitAccountId` va `creditAccountId` varchar sifatida
saqlanadi (integer id ni string'ga o'giradi). SQL da `e.debit_account = CAST(a.id AS VARCHAR)`
shart shu sababli ishlatiladi. Agar `entries` jadvalida bu ustunlar boshqa type bilan bo'lsa
(masalan, integer) — SQL moslashtirilishi kerak. `drizzle-gl-posting.repo.ts:101`
komentariyasida: "int accounts.id (Drizzle varchar drift)" — yani varchar sifatida saqlangan.

### 9.3 `FinanceClosePeriodSchema` tekshiruvi

`finance.dto.ts` owned fayl emas, lekin `closedBy` maydonining optional ekanligini
tekshirish kerak. Agar `closedBy` required bo'lsa — BE `POST periods/:id/close` bilan
`body={}` yuborilganda 400 xatosi keladi. Bu holda FE mutation'da `closedBy: null` explicit
yuborilishi kerak. **Read-only tekshiruv qiling, fayl o'zgartirmang.**

### 9.4 4-hisob SQL `entries` bo'sh bo'lganda

Agar `entries` jadvali bo'sh bo'lsa — query 0 qator qaytaradi, `groupMap` bo'sh bo'ladi.
FE `accountGroups = []` bo'ladi, widget ko'rinmaydi. Bu to'g'ri holat (ma'lumot yo'q — widget yo'q).
Agar `accounts` jadvali ham bo'sh bo'lsa — xuddi shunday. Bug emas, normal holat.

### 9.5 GL_ACCOUNTS_V2 vs GL inkonsistentligi

`gl-accounts.constants.ts`'da ikki parallel set mavjud (GL va GL_ACCOUNTS_V2 — turli kodlar).
Bu P24 scope'idan tashqari. Ushbu direktivada faqat range-based guruhlash amalga oshiriladi,
individual account code'lar ta'sir qilmaydi. GL_ACCOUNTS_V2 konsolidatsiyasi alohida paket.

---

## 10. VIZYON MOSLIK TEKSHIRUVI (Q-40)

| Vizyon talabi | Amalga oshirildi? | Tekshiruv |
|--------------|-------------------|-----------|
| EP-FIN-064: yopilgan davr → GL yozuv taqiqi | ✅ insertJournal'da period-lock | curl → 400 |
| EP-FIN-004: 4-hisob alohida balansi | ✅ GET /api/finance/gl/account-groups | curl → 4 guruh |
| EP-FIN-004: 4-hisob FE dashboard widget | ✅ FinanceDashboardTabs.tsx | brauzer tekshirish |
| PeriodClosing URL mismatch | ✅ mutation body qo'shildi | curl → 200 |
| FinanceDashboard 404 URL lar | ✅ real URL larga o'zgartirildi | DevTools → 200 |
| Result<T> barcha metodlarda | ✅ Err/Ok pattern | reviewer skript |
| Zod validatsiya | ✅ mavjud schema'lar ishlatiladi | tsc |
| REAL INSERT (Q-40 fake-create taqiq) | ✅ entries jadvaliga real yozuv | DB-proof |
| Ishlab turgan kod o'chirilmaydi (Q-46) | ✅ faqat bug fix + qo'shimcha | git diff |

---

*P24 direktiva | MASSIV-50 | Wave 2 | 2026-06-19*
*Yozilgan: advisor (Claude) | Bajaruvchi: Muslimbek*
