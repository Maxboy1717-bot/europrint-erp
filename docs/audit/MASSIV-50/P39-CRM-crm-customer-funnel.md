# P39 — CRM: CRM customer schema + funnel-stages DDL + RBAC scope + dashboard-drift fix

> **Agent:** P39 · **Modul:** CRM · **To'lqin (Wave):** 1 · **DependsOn:** P02
> **DDL darvozasi:** HA (egasi ruxsati talab qilinadi — migration faylga `-- APPROVED:` kiritilgunga qadar DDL ISHGA TUSHIRILMAYDI)
> **Fayl:** `docs/audit/MASSIV-50/P39-CRM-crm-customer-funnel.md`
> **Yozilgan:** 2026-06-19 · Vizyon: `docs/audit/MUSLIMBEK-PROMT-17-CRM-2026-06-08.md`

---

## 0. ROL VA QOIDALAR

Sen 🟢 **BAJARUVCHI**-san. Har sessiya boshida `CLAUDE.md` + `docs/agent-constitution.md` o'qi.
Bu agent **Wave 1**da ishlaydi. **DependsOn: P02** (Org/kartalar) — P02 migration tasdiqlangan bo'lishi kerak.

```
QOIDALAR BLOKI (Q-47 majburiy kiritish):
1.  Result<T> hamma repo/service metodida; throw/null/undefined TAQIQ.
2.  @Body Zod bilan validate; class-validator TAQIQ.
3.  Drizzle ORM; raw SQL faqat murakkab holatda (izoh + typedExecute<T>).
4.  Q-40 ishlaydi ≠ to'g'ri: REAL INSERT/UPDATE + DB-proof; echo/hardcoded/fake javob TAQIQ.
5.  Q-46 ishlab turgan kod O'CHIRILMAYDI; buzuq/o'lik/dublikat kod TO'LIQ o'chiriladi (chala emas).
6.  FAYL IZOLYATSIYASI (Qoida 23 / Q-23 / Q-31): faqat shu paketning OWNED-FILE ro'yxatidagi
    fayllarga teg. Boshqa fayl kerak bo'lsa — TO'XTA, egasiga flag qil, supurib ketma.
7.  DDL DARVOZASI (Q-35): CREATE TABLE / migration faqat egasi ruxsati bilan; migration faylida
    `-- APPROVED:` izoh shart. Paket DDL talab qilsa — migrationni YOZ lekin GATED belgila,
    ISHGA TUSHIRMA.
8.  git add <aniq-fayl> faqat; -A / . TAQIQ. Bitta commit = bitta mantiqiy guruh.
9.  Q-45/Q-30 log/secret HECH QACHON commit qilinmaydi; JWT minting yo'q.
10. Self-verify: BE tsc 0, FE tsc 0, tegishli reviewer skriptlar, jonli DB-proof
    (kirit → saqla → qayta o'qi → ko'rinadimi).
11. "V2"/"Strangler Fig"/"V1 vs V2" terminologiyasi TAQIQ — bitta kod bazasi, shu joyda to'g'irlanadi.
12. Vizyon-moslik: TO'G'RI o'lchovi = master vizyon (docs/XARITA-REJA-YONALISH +
    modul vizyon-hujjati); kod vizyonga zid bo'lsa (ishlasa ham) = xato.
```

---

## 1. IZOLYATSIYA MANIFESTI

**FAQAT shu fayllarga teg. Boshqa fayl kerak bo'lsa — TO'XTA + egasiga flag qil.**

| # | Fayl (to'liq yo'l) | Rol |
|---|---|---|
| 1 | `apps/api/src/modules/crm/presentation/crm-companies.controller.ts` | Controller — `deleteCompany` stub tuzatish + salesperson RBAC scope filter qo'shish |
| 2 | `apps/api/src/modules/crm/infrastructure/repositories/crm-companies.repository.ts` | Repo — `is_key_account` / `business_profile` ustunlari qo'shish, `listCompanies` scope filter |
| 3 | `apps/api/src/modules/crm/infrastructure/repositories/crm-extras-dashboard.repository.ts` | Repo — `getDashboardDeals()` `expected_amount`/`status` column drift tuzatish |
| 4 | `apps/api/src/shared/db/invariants/migrations-crm.ts` | Migration — `crm_funnel_stages` DDL + `crmCompanies` ALTER DDL (GATED) |
| 5 | `apps/api/src/modules/crm/presentation/dto/crm-companies.dto.ts` | DTO — `CreateCompanyDtoSchema`ga `is_key_account` / `business_profile` maydonlari |
| 6 | `apps/api/src/common/constants/business.constants.ts` | Konstantalar — CRM funnel/abandonment/followup konstantalari qo'shish |

**DDL darvozasi:** `migrations-crm.ts` ga yoziladigan barcha `CREATE TABLE` va `ALTER TABLE` iboralari faylga yoziladi, lekin egasi `-- APPROVED: <egasi ismi> <sana>` izohini qo'shgunga qadar migration run qilinmaydi. Migration faylini yozish — ruxsat; ishga tushirish — egasi ruxsati kerak.

---

## 2. VIZYON (EP-CRM maqsadlar)

Vizyon manba: `docs/audit/MUSLIMBEK-PROMT-17-CRM-2026-06-08.md`

### Ushbu P39 paketning vizyon qamrovi

| EP kodi | Tavsif | P39 ulushi |
|---|---|---|
| EP-CRM-054 | B2B mijoz profili: `is_key_account` flag (Indorama turi — katta hajmli, shartnomaviy) | `crmCompanies` ALTER DDL + DTO + repo |
| EP-CRM-053 | `business_profile` JSONB — nima qadoqlashadi, hajm, texnologiya (offset/gofra/silkscreen) | `crmCompanies` ALTER DDL + DTO + repo |
| EP-CRM-002 | Funnel bosqichlari konfiguratsiyali master-data (egasi keyinroq nomlaydi) — 5 bosqich: **Namuna → Klishe/STP tasdiq → Narx → Shartnoma → Buyurtma** | `crm_funnel_stages` jadval DDL + seed |
| EP-CRM-022 | Sotuvchi RBAC scope: salesperson faqat o'ziga tayinlangan kompaniyalarni ko'radi | `listCompanies` scope filter + controller `@Roles` |
| EP-CRM-030 | Manager barcha kompaniyalarni ko'radi; salesperson faqat assigned_to = o'zi | Repository scope parametri |
| EP-CRM-062 | Kontakt telefon/email boshqa sotuvchidan yashirin (field-level RBAC) | Hozircha controller darajasida scope filter (field-level keyingi fazaga) |
| ShVB GSD | Dashboard deals qatorini tuzatish — `expected_amount` / `status` ustunlari mavjud emas | `getDashboardDeals()` column drift fix |
| Qoida 10 | `deleteCompany` `return {}` stub — real `{ id, deleted: true }` qaytarishi kerak | Controller fix |
| Qoida 12 | CRM magik raqamlar (60 kun tashlab ketish, 30/60/90 follow-up) | `business.constants.ts` qo'shimcha |

### Qabul mezoni (vizyon-moslik tekshiruvi, Q-40)

1. `POST /api/crm/companies` → `is_key_account: true` + `business_profile: {...}` qabul qiladi → DB ga saqlaydi → `GET /api/crm/companies/:id` da ko'rinadi.
2. `GET /api/crm/companies` — `salesperson` roli bilan token → faqat `assigned_to = me.id` natijalar.
3. `GET /api/crm/companies` — `sales_manager` roli bilan token → barcha kompaniyalar.
4. `GET /api/crm/dashboard/deals` → 503 yoki noto'g'ri ma'lumot bermaydi (column drift tuzatilgan).
5. `DELETE /api/crm/companies/:id` → `{ id: N, deleted: true }` qaytaradi (eski `{}`emas).
6. `crm_funnel_stages` jadvali mavjud + 5 bosqich seed qilingan (APPROVED bo'lgandan keyin).
7. `business.constants.ts` da `CRM_ABANDONMENT_DAYS`, `CRM_FOLLOWUP_30_DAYS`, `CRM_FOLLOWUP_60_DAYS`, `CRM_FOLLOWUP_90_DAYS`, `CRM_PRICE_RISE_TRIGGER_PCT` konstantalari mavjud.

---

## 3. HOZIRGI HOLAT (exists / missing / brokenOrFake)

### 3.1 Mavjud (to'g'ri ishlaydi — Q-46: O'CHIRMA)

- **`crm-companies.controller.ts`** — to'liq wired, 14 endpoint, `JwtAuthGuard`+`RolesGuard` mavjud. `deleteCompanyContact` (qat. 242–244) to'g'ri `{ deleted: true }` qaytaradi. ✅
- **`crm-companies.repository.ts`** — `listCompanies`, `getCompany`, `getCompanyContacts`, `getCompanyDeals`, `getCompanyCredit`, `checkDuplicates`, `createCompany`, `updateCompany`, `updateCreditLimit`, `listLeadStages`, `getLeadStage`, `createLeadStage`, `updateLeadStage`, `deleteCompany`, `createCompanyContact`, `deleteCompanyContact` — barchasi `safeCall(async () => {...}, 'DB_ERROR')` bilan to'g'ri Result<T> qaytaradi. ✅
- **`crm-extras-dashboard.repository.ts`** — `getDashboardLeads`, `getDashboardActivities`, `getPipeline`, `getLeadStages` metodlari to'g'ri ishlaydi. ✅ Faqat `getDashboardDeals` buzuq.
- **`migrations-crm.ts`** — `crm_activities`, `crm_comments`, `crm_tasks`, warehouses seed, `pos_movement_types` seed — ishlayapti. ✅
- **`crm-companies.dto.ts`** — `CheckCompanyDuplicatesDtoSchema`, `CreateCompanyDtoSchema`, `UpdateCreditLimitDtoSchema`, `CreateLeadStageDtoSchema`, `UpdateLeadStageDtoSchema` — Zod bilan to'g'ri. ✅
- **`business.constants.ts`** — `CHURN_HIGH_DAYS=180`, `CHURN_MED_DAYS=90`, `COMMISSION_RATE=0.05`, `VIP_REVENUE_THRESHOLD_UZS`, `ABC_SCORE_WEIGHT` — mavjud. ✅

### 3.2 Buzuq / soxta (Q-46: TO'LIQ tuzat)

**A) `crm-companies.controller.ts` qat. 154–157 — `deleteCompany` stub:**
```typescript
// ❌ HOZIR (qat. 154–157) — Qoida 10 buzilishi
@Delete('companies/:id')
@UseGuards(RolesGuard)
@Roles(...CRM_WRITE_ROLES)
async deleteCompany(@Param('id') id: string) {
  await this.svc.deleteCompany(safeInt(id, 0));
  return {};  // ← STUB: hech qanday ma'lumot yo'q
}
```

**B) `crm-companies.controller.ts` — salesperson RBAC scope yo'q:**
```typescript
// ❌ HOZIR (qat. 53–56) — EP-CRM-022/030 buzilishi
@Get('companies')
async listCompanies(@Query('search') search?: string, @Query('limit') limit?: string, @Query('offset') offset?: string) {
  return unwrapOrThrow(await this.svc.listCompanies(search, safeInt(limit, 50), safeInt(offset, 0)));
  // ← assignedTo parametri yo'q: salesperson ham BARCHANI ko'radi
}
```

**C) `crm-extras-dashboard.repository.ts` qat. 40–45 — column drift:**
```typescript
// ❌ HOZIR (qat. 40–45) — crmDeals sxemasida MAVJUD EMAS
const rows = await db.select({
  total:    sql<number>`COUNT(*)::int`,
  pipeline: sql<number>`COALESCE(SUM(${crmDeals.expected_amount}), 0)`,  // ← YO'Q
})
  .from(crmDeals)
  .where(sql`${crmDeals.status} != 'won' AND ${crmDeals.status} != 'lost'`);  // ← YO'Q
```
`crmDeals` sxemasidagi haqiqiy ustunlar: `opportunity` (summa), `stageSemanticId` (holat string). `expected_amount` va `status` MAVJUD EMAS — bu 503 yoki noto'g'ri natija beradi.

### 3.3 Yo'q (missing — shu P39 tomonidan qo'shiladi)

- `crmCompanies.is_key_account` ustuni (EP-CRM-054) — DDL kerak (GATED)
- `crmCompanies.business_profile` JSONB ustuni (EP-CRM-053) — DDL kerak (GATED)
- `crm_funnel_stages` jadvali (EP-CRM-002) — DDL + 5 seed kerak (GATED)
- `listCompanies` da `assignedTo` scope filter — repo + controller darajasida yo'q
- `business.constants.ts` da CRM-specific konstantalar: `CRM_ABANDONMENT_DAYS`, `CRM_FOLLOWUP_30_DAYS`, `CRM_FOLLOWUP_60_DAYS`, `CRM_FOLLOWUP_90_DAYS`, `CRM_PRICE_RISE_TRIGGER_PCT`
- `CreateCompanyDtoSchema` da `is_key_account` va `business_profile` maydonlari yo'q

### 3.4 Boshqa mavjud — bu P39 tegmaydi (izolyatsiya)

- `crm-activities.controller.ts:131` — DELETE `return {}` stub: **P39 tegmaydi** (owned fayl emas — bu P39 izolyatsiyasidan tashqarida; flag: CRM Activities controlleri egasiga xabar qilinsin)
- `crm-followup-compat.controller.ts:98` — `return {}` stub: **P39 tegmaydi**
- `crm-ai-extended.service.ts` — barcha 8 metod stub: **P39 tegmaydi** (CRM AI fazasi)
- `deal-won.listener.ts` — golden-thread stub: **P39 tegmaydi** (alohida paket)
- `drizzle-crm-analytics.repo.ts:143-173` — funnel JOIN xatosi: **P39 tegmaydi** (analytics repo)

---

## 4. ISH (qadam-baqadam)

### QADAM 1 — `business.constants.ts`: CRM konstantalar qo'shish

**Fayl:** `apps/api/src/common/constants/business.constants.ts`
**Maqsad:** Magic raqamlarni (60 kun, 30/60/90 follow-up, 5% narx ko'tarilishi) nomli konstantalarga chiqarish (Qoida 12).

**Hozirgi holat (qat. 137–139):**
```typescript
/** Customer churn risk: days since last order */
export const CHURN_HIGH_DAYS = 180;
export const CHURN_MED_DAYS  = 90;
```

**Keyin (qat. 139 dan keyin, yangi blok qo'shamiz):**
```typescript
// ---------------------------------------------------------------------------
// CRM — Follow-up / abandonment / price-trigger thresholds
// ---------------------------------------------------------------------------

/**
 * EP-CRM-063 owner override: customer inactive for this many days appears
 * in the manager's "reassign" panel (NOT auto-reassigned — manager acts).
 */
export const CRM_ABANDONMENT_DAYS = 60;

/**
 * EP-CRM-026 follow-up campaign windows (days of silence → suggested task).
 * Three thresholds: soft reminder, warm follow-up, escalate to manager.
 */
export const CRM_FOLLOWUP_30_DAYS = 30;
export const CRM_FOLLOWUP_60_DAYS = 60;
export const CRM_FOLLOWUP_90_DAYS = 90;

/**
 * EP-CRM-057 price recalculation trigger: if paper input cost rises by this
 * fraction or more, a "review pricing" task is generated for affected customers.
 * Owner override: ~5% rise (0.05).
 */
export const CRM_PRICE_RISE_TRIGGER_PCT = 0.05;

/**
 * EP-CRM-012 lead scoring: default configurable weights (sum = 1.0).
 * Owner/HR sets actual weights in admin panel; these are code-level defaults.
 */
export const CRM_LEAD_SCORE_WEIGHT = {
  interest:       0.35,
  activity:       0.30,
  response_speed: 0.20,
  deal_size:      0.15,
} as const;

/**
 * EP-CRM-002 funnel: number of canonical factory funnel stages (seed count).
 * Namuna / Klishe-STP tasdiq / Narx / Shartnoma / Buyurtma.
 */
export const CRM_FUNNEL_STAGE_COUNT = 5;
```

**Tekshiruv:** `grep -n "CRM_ABANDONMENT_DAYS" apps/api/src/common/constants/business.constants.ts` — mavjudligini tasdiqlaydi.

**Result<T> / Zod:** konstantalar fayl — hech qanday async yo'q, tekshiruv shart emas.

---

### QADAM 2 — `crm-companies.dto.ts`: `is_key_account` va `business_profile` maydonlari

**Fayl:** `apps/api/src/modules/crm/presentation/dto/crm-companies.dto.ts`
**Maqsad:** EP-CRM-053/054 uchun `CreateCompanyDtoSchema` ga yangi maydonlar.

**Hozirgi holat (qat. 18–25):**
```typescript
export const CreateCompanyDtoSchema = z.object({
  name: z.string().min(1).max(500).optional(),
  inn: z.string().max(20).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
  address: z.string().max(MAX_SHORT_TEXT).optional(),
}).passthrough();
export type CreateCompanyDto = z.infer<typeof CreateCompanyDtoSchema>;
```

**Keyin (to'liq almashtirish):**
```typescript
export const CreateCompanyDtoSchema = z.object({
  name:             z.string().min(1).max(500).optional(),
  inn:              z.string().max(20).optional(),
  phone:            z.string().max(20).optional(),
  email:            z.string().email().optional(),
  address:          z.string().max(MAX_SHORT_TEXT).optional(),
  /** EP-CRM-054: Indorama-type key account flag (high-volume, contract-based) */
  is_key_account:   z.boolean().optional(),
  /** EP-CRM-053: B2B profile — what they pack, volume, technology (offset/gofra/silkscreen).
   *  Free-form JSONB; no strict schema imposed at BE level (owner evolves fields). */
  business_profile: z.record(z.unknown()).optional(),
  /** EP-CRM-022/030: salesperson assigned to this company (FK to users.id) */
  assigned_to:      z.number().int().positive().optional(),
}).passthrough();
export type CreateCompanyDto = z.infer<typeof CreateCompanyDtoSchema>;
```

`UpdateCompanyDtoSchema` = `CreateCompanyDtoSchema` (qat. 27) — o'zgarishsiz qoladi, chunki u `CreateCompanyDtoSchema`ga murojaat qiladi va avtomatik yangilanadi.

**Edge case:** `business_profile` bo'sh `{}` yuborganida ham qabul qilinadi (`.optional()` + `z.record`). `is_key_account: null` — Zod `undefined` qaytaradi (`.optional()` null ni o'tkazmaydi) — repository `COALESCE` bilan ishlaydi.

**Tekshiruv:** `npx tsc --noEmit` — type xatosi yo'q bo'lishi kerak.

---

### QADAM 3 — `crm-companies.repository.ts`: scope filter + yangi ustunlar

**Fayl:** `apps/api/src/modules/crm/infrastructure/repositories/crm-companies.repository.ts`
**Maqsad:**
1. `listCompanies` metodiga `assignedTo?: number | null` parametri qo'shish (EP-CRM-022/030).
2. `createCompany` metodiga `is_key_account` + `business_profile` + `assigned_to` qo'shish (EP-CRM-053/054).
3. `updateCompany` metodiga ushbu yangi ustunlarni qo'shish.

**3.1 `listCompanies` imzosi o'zgartirish**

Hozirgi holat (qat. 21):
```typescript
async listCompanies(pat: string | null, lim: number, off: number): Promise<Result<Row[]>> {
```

Keyin:
```typescript
async listCompanies(
  pat: string | null,
  lim: number,
  off: number,
  assignedTo?: number | null,
): Promise<Result<Row[]>> {
```

**3.2 `listCompanies` body — scope filter qo'shish**

Hozirgi holat (qat. 22–42, `safeCall` ichida):
```typescript
return db.select({
  id:            crmCompanies.id,
  title:         crmCompanies.title,
  status:        crmCompanies.status,
  industry:      crmCompanies.industry,
  website:       crmCompanies.website,
  inn:           crmCompanies.inn,
  address:       crmCompanies.address,
  credit_limit:  crmCompanies.credit_limit,
  created_at:    crmCompanies.created_at,
  contact_count: sql<number>`COUNT(${crmContacts.id})::int`,
})
  .from(crmCompanies)
  .leftJoin(crmContacts, eq(crmContacts.company_id, crmCompanies.id))
  .where(sql`(${pat}::text IS NULL OR ${crmCompanies.title} ILIKE ${pat} OR ${crmCompanies.inn} ILIKE ${pat})`)
  .groupBy(crmCompanies.id)
  .orderBy(sql`${crmCompanies.created_at} DESC`)
  .limit(lim)
  .offset(off).then(r => castTo<Row[]>(r));
```

Keyin (`assignedTo` scope qo'shiladi):
```typescript
return db.select({
  id:              crmCompanies.id,
  title:           crmCompanies.title,
  status:          crmCompanies.status,
  industry:        crmCompanies.industry,
  website:         crmCompanies.website,
  inn:             crmCompanies.inn,
  address:         crmCompanies.address,
  credit_limit:    crmCompanies.credit_limit,
  created_at:      crmCompanies.created_at,
  is_key_account:  sql<boolean>`${crmCompanies.is_key_account}`,
  business_profile: sql<Record<string, unknown>>`${crmCompanies.business_profile}`,
  contact_count:   sql<number>`COUNT(${crmContacts.id})::int`,
})
  .from(crmCompanies)
  .leftJoin(crmContacts, eq(crmContacts.company_id, crmCompanies.id))
  .where(sql`
    (${pat}::text IS NULL OR ${crmCompanies.title} ILIKE ${pat} OR ${crmCompanies.inn} ILIKE ${pat})
    AND (${assignedTo ?? null}::int IS NULL OR ${crmCompanies.assigned_to} = ${assignedTo ?? null})
  `)
  .groupBy(crmCompanies.id)
  .orderBy(sql`${crmCompanies.created_at} DESC`)
  .limit(lim)
  .offset(off).then(r => castTo<Row[]>(r));
```

**Muhim:** `crmCompanies.is_key_account` va `crmCompanies.business_profile` va `crmCompanies.assigned_to` ustunlari hali Drizzle sxemasida yo'q (DDL GATED). Shu sababli ushbu ustunlarni reference qiluvchi qatorlarni `sql\`` ... \`` raw SQL sifatida yozamiz — bu Drizzle type mismatch xatosini oldini oladi. DDL APPROVED bo'lib, ustunlar qo'shilgandan keyin Drizzle sxemaga ham qo'shilishi kerak (P39 bundan tashqari — sxema fayli owned emas).

**Workaround (DDL GATED bo'lganda type xatosi oldini olish):**

Repository import qatoriga qo'shimcha:
```typescript
import { and, eq, sql, isNull, or } from 'drizzle-orm';
```

`listCompanies` `where` klauzi uchun DDL GATED bo'lganda `crmCompanies.assigned_to` ustuni Drizzle sxemasida yo'q bo'lishi mumkin. Shu sababli scope filterda:
```typescript
// NOTE: crmCompanies.assigned_to ustuni DDL APPROVED+sxema yangilangandan keyin
// Drizzle-typed bo'ladi. Hozirda sql`` literal bilan ishlaydi (type-safe emas lekin crash bermaydi).
.where(sql`
  (${pat}::text IS NULL
    OR ${crmCompanies.title} ILIKE ${pat}
    OR ${crmCompanies.inn} ILIKE ${pat})
  AND (${assignedTo ?? null}::int IS NULL
    OR (crm_companies.assigned_to)::int = ${assignedTo ?? null})
`)
```

**3.3 `createCompany` — yangi maydonlar**

Hozirgi holat (qat. 87–100):
```typescript
async createCompany(body: Row): Promise<Result<Row>> {
  return safeCall(async () => {
    const { name, title, inn, industry, address, website, credit_limit } = body;
    const payload = {
      title:        (title ?? name) as string,
      inn:          (inn as string) ?? undefined,
      industry:     (industry as string) ?? undefined,
      address:      (address as string) ?? undefined,
      website:      (website as string) ?? undefined,
      credit_limit: credit_limit ? String(credit_limit) : '0',
    };
    const rows = await db.insert(crmCompanies).values(payload as typeof crmCompanies.$inferInsert).returning();
    return (rows[0] ?? {}) as Row;
    }, 'DB_ERROR');
}
```

Keyin:
```typescript
async createCompany(body: Row): Promise<Result<Row>> {
  return safeCall(async () => {
    const { name, title, inn, industry, address, website, credit_limit,
            is_key_account, business_profile, assigned_to } = body;
    // NOTE: is_key_account / business_profile / assigned_to ustunlari DDL APPROVED+sxema
    // yangilangandan keyin Drizzle typed bo'ladi. sql literal orqali kiritiladi.
    const baseRow = await db.insert(crmCompanies).values({
      title:        (title ?? name) as string,
      inn:          (inn as string) ?? undefined,
      industry:     (industry as string) ?? undefined,
      address:      (address as string) ?? undefined,
      website:      (website as string) ?? undefined,
      credit_limit: credit_limit ? String(credit_limit) : '0',
    } as typeof crmCompanies.$inferInsert).returning();
    if (!baseRow[0]) return {} as Row;
    const insertedId = (baseRow[0] as Record<string, unknown>)['id'] as number;
    // Yangi ustunlarni UPDATE orqali kiritish (DDL APPROVED bo'lgunga qadar safe fallback)
    if (is_key_account !== undefined || business_profile !== undefined || assigned_to !== undefined) {
      await db.execute(sql`
        UPDATE crm_companies SET
          is_key_account   = COALESCE(${is_key_account ?? null}::boolean,   is_key_account),
          business_profile = COALESCE(${business_profile != null ? JSON.stringify(business_profile) : null}::jsonb, business_profile),
          assigned_to      = COALESCE(${assigned_to ?? null}::int,           assigned_to)
        WHERE id = ${insertedId}
      `);
    }
    const updated = await db.execute(sql`SELECT * FROM crm_companies WHERE id = ${insertedId}`);
    return ((updated.rows?.[0] ?? baseRow[0]) ?? {}) as Row;
    }, 'DB_ERROR');
}
```

**3.4 `updateCompany` — yangi maydonlar**

Hozirgi holat (qat. 103–117):
```typescript
async updateCompany(cid: number, body: Row): Promise<Result<Row | null>> {
  return safeCall(async () => {
    const { name, title, inn, industry, address, website, credit_limit } = body;
    const rows = await db.update(crmCompanies).set({
      title:        sql`COALESCE(${(title ?? name) ?? null}, ${crmCompanies.title})`,
      inn:          sql`COALESCE(${inn ?? null}, ${crmCompanies.inn})`,
      industry:     sql`COALESCE(${industry ?? null}, ${crmCompanies.industry})`,
      address:      sql`COALESCE(${address ?? null}, ${crmCompanies.address})`,
      website:      sql`COALESCE(${website ?? null}, ${crmCompanies.website})`,
      credit_limit: sql`COALESCE(${credit_limit ?? null}, ${crmCompanies.credit_limit})`,
      updated_at:   _time.now(),
    }).where(eq(crmCompanies.id, cid)).returning();
    return (rows[0] ?? null) as Row | null;
    }, 'DB_ERROR');
}
```

Keyin (yangi ustunlar qo'shiladi — DDL GATED, sql literal):
```typescript
async updateCompany(cid: number, body: Row): Promise<Result<Row | null>> {
  return safeCall(async () => {
    const { name, title, inn, industry, address, website, credit_limit,
            is_key_account, business_profile, assigned_to } = body;
    await db.update(crmCompanies).set({
      title:        sql`COALESCE(${(title ?? name) ?? null}, ${crmCompanies.title})`,
      inn:          sql`COALESCE(${inn ?? null}, ${crmCompanies.inn})`,
      industry:     sql`COALESCE(${industry ?? null}, ${crmCompanies.industry})`,
      address:      sql`COALESCE(${address ?? null}, ${crmCompanies.address})`,
      website:      sql`COALESCE(${website ?? null}, ${crmCompanies.website})`,
      credit_limit: sql`COALESCE(${credit_limit ?? null}, ${crmCompanies.credit_limit})`,
      updated_at:   _time.now(),
    }).where(eq(crmCompanies.id, cid));
    // Yangi ustunlar: DDL APPROVED bo'lguncha sql literal
    if (is_key_account !== undefined || business_profile !== undefined || assigned_to !== undefined) {
      await db.execute(sql`
        UPDATE crm_companies SET
          is_key_account   = COALESCE(${is_key_account ?? null}::boolean,   is_key_account),
          business_profile = COALESCE(${business_profile != null ? JSON.stringify(business_profile) : null}::jsonb, business_profile),
          assigned_to      = COALESCE(${assigned_to ?? null}::int,           assigned_to)
        WHERE id = ${cid}
      `);
    }
    const result = await db.execute(sql`SELECT * FROM crm_companies WHERE id = ${cid}`);
    return ((result.rows?.[0]) ?? null) as Row | null;
    }, 'DB_ERROR');
}
```

**Result<T> tekshiruvi:** `safeCall` barcha xatolarni ushlab `Result<T>` qaytaradi — `throw` yo'q. ✅

---

### QADAM 4 — `crm-companies.controller.ts`: stub tuzatish + RBAC scope

**Fayl:** `apps/api/src/modules/crm/presentation/crm-companies.controller.ts`
**Maqsad:**
1. `deleteCompany` (qat. 154–157) `return {}` stubni `{ id, deleted: true }` ga almashtirish.
2. `listCompanies` (qat. 53–56) ga `assignedTo` scope filter qo'shish.
3. Controller importiga `CurrentUser` dekorator qo'shish (RBAC scope uchun).

**4.1 Import qo'shimcha**

Hozirgi import (qat. 19–29) ga qo'shimcha:
```typescript
import { Request } from '@nestjs/common';  // Request dekorator
```

Yoki mavjud NestJS importlar qatoriga `Req` qo'shamiz:
```typescript
import {
  BadRequestException, Body, Controller, Delete, Get, Logger, NotFoundException,
  Param, Patch, Post, Query, UseGuards,
  UseInterceptors, InternalServerErrorException, UsePipes, Req } from '@nestjs/common';
```

Va `@common/decorators/current-user.decorator` import:
```typescript
import { CurrentUser } from '@common/decorators/current-user.decorator';
```

**4.2 `listCompanies` — RBAC scope filter**

Hozirgi holat (qat. 51–56):
```typescript
@ApiOperation({ summary: 'List companies' })
@ApiResponse({ status: 200, description: 'OK' })
@Get('companies')
async listCompanies(@Query('search') search?: string, @Query('limit') limit?: string, @Query('offset') offset?: string) {
  return unwrapOrThrow(await this.svc.listCompanies(search, safeInt(limit, 50), safeInt(offset, 0)));
}
```

Keyin (EP-CRM-022/030 — salesperson scope):
```typescript
@ApiOperation({ summary: 'List companies (salesperson sees only assigned; manager sees all)' })
@ApiResponse({ status: 200, description: 'OK' })
@Get('companies')
async listCompanies(
  @Query('search') search?: string,
  @Query('limit') limit?: string,
  @Query('offset') offset?: string,
  @CurrentUser() user?: { id: number; role: string },
) {
  // EP-CRM-022/030: salesperson faqat assigned_to = o'zi ko'radi
  // sales_manager / director / super_admin / crm_manager barcha ko'radi
  const SALESPERSON_ONLY_ROLES = ['salesperson'];
  const assignedTo = user && SALESPERSON_ONLY_ROLES.includes(user.role)
    ? user.id
    : null;   // null = hamma natijalar (manager)
  return unwrapOrThrow(
    await this.svc.listCompanies(search ?? null, safeInt(limit, 50), safeInt(offset, 0), assignedTo),
  );
}
```

**Muhim:** `CurrentUser` dekorator `apps/api/src/common/decorators/` da mavjudligini tekshir. Agar mavjud bo'lmasa yoki nom farq qilsa — `@Req() req: Request` bilan `req.user as { id: number; role: string }` ishlatamiz. Tekshirish:
```bash
ls apps/api/src/common/decorators/
```
Agar `current-user.decorator.ts` yo'q bo'lsa, `Req` varianti:
```typescript
async listCompanies(
  @Query('search') search?: string,
  @Query('limit') limit?: string,
  @Query('offset') offset?: string,
  @Req() req?: { user?: { id: number; role?: string } },
) {
  const user = req?.user;
  const SALESPERSON_ONLY_ROLES = ['salesperson'];
  const assignedTo = user && SALESPERSON_ONLY_ROLES.includes(user.role ?? '')
    ? user.id
    : null;
  return unwrapOrThrow(
    await this.svc.listCompanies(search ?? null, safeInt(limit, 50), safeInt(offset, 0), assignedTo),
  );
}
```

**4.3 `deleteCompany` stub tuzatish**

Hozirgi holat (qat. 147–157):
```typescript
@Delete('companies/:id')
@UseGuards(RolesGuard)
@Roles(...CRM_WRITE_ROLES)
async deleteCompany(@Param('id') id: string) {
  await this.svc.deleteCompany(safeInt(id, 0));
  return {};  // ← STUB
}
```

Keyin:
```typescript
@Delete('companies/:id')
@UseGuards(RolesGuard)
@Roles(...CRM_WRITE_ROLES)
async deleteCompany(@Param('id') id: string) {
  const numId = safeInt(id, 0);
  await this.svc.deleteCompany(numId);
  return { id: numId, deleted: true };
}
```

**Service metodi sinxronizatsiyasi:** `CrmCompaniesService.listCompanies` ham yangi `assignedTo` parametrini qabul qilishi kerak. Bu `apps/api/src/modules/crm/application/crm-companies.service.ts` faylidir — **owned fayl emas (P39)**. Shu sababli:

**STOP — FLAG:** `crm-companies.service.ts` P39 owned fayllar ro'yxatida **yo'q**. Service imzosini o'zgartirish shu faylga tegishli. Ikki variant:

- **Variant A (preferred):** Service faylini P39 ga qo'shishni egasiga so'ra — izolyatsiya kengaytirilsin.
- **Variant B (current boundary):** Repository `listCompanies` imzosini o'zgartir (owned ✅); controller ham `svc.listCompanies(...)` chaqiruviga `assignedTo` parametr uzatadi. Service esa repository'ga passthrough qiladi (ko'pincha shunday). Agar service `assignedTo` ni repo'ga uzatmasa — bu gap sifatida flaglanadi.

**P39 bu yerda Variant B bilan davom etadi:** controller service'ga `assignedTo` uzatadi, service repo'ga uzatadi. Agar service imzosi mos kelmasa — egasiga xabar qil va to'xta. **Tekshirish qadami (§7)** service imzosi mos kelishini tasdiqlaydi.

**4.4 `CrmCompaniesService` imzo tekshiruvi (owned emas — read-only tekshiruv)**

Ishni boshlashdan oldin tekshir:
```bash
grep -n "listCompanies" apps/api/src/modules/crm/application/crm-companies.service.ts
```
Agar `listCompanies(search, limit, offset)` — 3 parametrli bo'lsa: service faylini egasiga flag qil va `assignedTo` parametr qo'shishni so'ra. P39 service fayliga tegmaydi.

---

### QADAM 5 — `crm-extras-dashboard.repository.ts`: `getDashboardDeals` column drift tuzatish

**Fayl:** `apps/api/src/modules/crm/infrastructure/repositories/crm-extras-dashboard.repository.ts`
**Maqsad:** `expected_amount` / `status` column drift tuzatish — haqiqiy `crmDeals` sxema ustunlarini ishlatish.

**Hozirgi holat (qat. 37–52) — BUZUQ:**
```typescript
async getDashboardDeals(): Promise<Result<Row>> {
  return safeCall(async () => {
    try {
      const rows = await db.select({
        total:    sql<number>`COUNT(*)::int`,
        pipeline: sql<number>`COALESCE(SUM(${crmDeals.expected_amount}), 0)`,
        //                                    ^^^ MAVJUD EMAS (drift!)
      })
        .from(crmDeals)
        .where(sql`${crmDeals.status} != 'won' AND ${crmDeals.status} != 'lost'`);
        //              ^^^ MAVJUD EMAS (drift! haqiqiy = stageSemanticId)
      return (rows[0] ?? {}) as Row;
    } catch (err) {
      this.logger.warn(`getDashboardDeals: ${(err as Error).message}`);
      return {};
    }
    }, 'DB_ERROR');
}
```

**`crmDeals` sxemasidagi haqiqiy ustunlar** (`lib/db/src/schema/crm-pipelines.ts` dan):
- Summa ustuni: `opportunity` (yoki `forecast_amount` — `getPipeline` metodida `d.forecast_amount` ishlatilgan, demak `forecast_amount` to'g'ri)
- Holat ustuni: `stageSemanticId` (string: `'won'`, `'lost'`, `'C0:NEW'`, va h.k.)

**Keyin (tuzatilgan):**
```typescript
async getDashboardDeals(): Promise<Result<Row>> {
  return safeCall(async () => {
    try {
      // NOTE: crmDeals.forecast_amount = haqiqiy summa ustuni (expected_amount YO'Q — drift tuzatildi)
      // NOTE: crmDeals.stageSemanticId = holat ustuni (status YO'Q — drift tuzatildi)
      const rows = await db.select({
        total:    sql<number>`COUNT(*)::int`,
        pipeline: sql<number>`COALESCE(SUM(${crmDeals.opportunity}), 0)`,
      })
        .from(crmDeals)
        .where(sql`${crmDeals.stageSemanticId} NOT IN ('won', 'lost')`);
      return (rows[0] ?? { total: 0, pipeline: 0 }) as Row;
    } catch (err) {
      this.logger.warn(`getDashboardDeals: ${(err as Error).message}`);
      return { total: 0, pipeline: 0 } as Row;
    }
    }, 'DB_ERROR');
}
```

**Muhim tekshiruv:** `crmDeals` Drizzle sxemasida `opportunity` yoki `forecast_amount` qaysi nom bilan mavjudligini aniqla:
```bash
grep -n "opportunity\|forecast_amount\|stageSemanticId\|stage_semantic_id" lib/db/src/schema/crm-pipelines.ts
```
Natijaga qarab to'g'ri ustun nomini ishlat. Agar `opportunity` (camelCase), Drizzle SQL query da `crmDeals.opportunity` ishlatiladi. Agar `forecast_amount` (snake_case DB kolonn nomi lekin Drizzle camelCase bilan e'lon qilingan bo'lsa) — `crmDeals.forecastAmount` yoki `crmDeals.forecast_amount` bo'lishi mumkin.

**Fallback (noaniq bo'lsa):** `getPipeline` metodi (qat. 74–91) da `d.forecast_amount` raw SQL sifatida ishlatilgan — demak DB kolonn nomi `forecast_amount`. Drizzle select da:
```typescript
pipeline: sql<number>`COALESCE(SUM(crm_deals.forecast_amount), 0)`,
```

Va holat tekshiruvi uchun:
```typescript
.where(sql`crm_deals.stage_semantic_id NOT IN ('won', 'lost')`);
```

**Result<T> va try/catch:** mavjud `try/catch` ichida xato bo'lsa logger WARN + `{ total: 0, pipeline: 0 }` qaytaradi — `safeCall` ham ishlaydi. Ikki qatlam himoya. ✅

---

### QADAM 6 — `migrations-crm.ts`: DDL qo'shish (GATED)

**Fayl:** `apps/api/src/shared/db/invariants/migrations-crm.ts`
**Maqsad:** `crm_funnel_stages` DDL + seed (EP-CRM-002) va `crm_companies` ALTER DDL (EP-CRM-053/054) qo'shish.

**GATED — quyidagi migratsiyalar `CRM_MIGRATIONS` arrayning OXIRIGA qo'shiladi. Egasi `-- APPROVED:` izoh qo'shgunga qadar ISHGA TUSHIRILMAYDI.**

`migrations-crm.ts` oxiridagi `];` dan oldin quyidagi blokni kiritish:

```typescript
  // ══════════════════════════════════════════════════════════════════════════
  // DDL GATE — Quyidagi migratsiyalar egasi ruxsati bilan bajariladi.
  // Q-35: Egasi qo'yishi kerak bo'lgan izoh:
  //   -- APPROVED: <egasi ismi> <sana, masalan 2026-06-20>
  // Izoh yo'q bo'lsa — runner skip qilishi kerak (yoki egasi "yes" deydi).
  // ══════════════════════════════════════════════════════════════════════════

  // -- APPROVED: <egasi ismi> <sana> ← egasi shu qatorni to'ldiradi
  {
    name: 'crm_funnel_stages table (EP-CRM-002 — configurable 5-stage factory funnel)',
    sql: `
      CREATE TABLE IF NOT EXISTS crm_funnel_stages (
        id          SERIAL PRIMARY KEY,
        code        TEXT NOT NULL UNIQUE,
        name        TEXT NOT NULL,
        name_ru     TEXT,
        sort        INTEGER NOT NULL DEFAULT 0,
        is_active   BOOLEAN NOT NULL DEFAULT true,
        semantics   TEXT,
        created_at  TIMESTAMP DEFAULT now(),
        updated_at  TIMESTAMP DEFAULT now()
      )
    `,
  },
  {
    name: 'crm_funnel_stages seed: Namuna (1)',
    sql: `
      INSERT INTO crm_funnel_stages (code, name, name_ru, sort, is_active, semantics)
      SELECT 'NAMUNA', 'Namuna', 'Образец', 1, true, 'sample'
      WHERE NOT EXISTS (SELECT 1 FROM crm_funnel_stages WHERE code = 'NAMUNA')
    `,
  },
  {
    name: 'crm_funnel_stages seed: Klishe-STP tasdiq (2)',
    sql: `
      INSERT INTO crm_funnel_stages (code, name, name_ru, sort, is_active, semantics)
      SELECT 'KLISHE_STP', 'Klishe/STP tasdiq', 'Клише/STP подтверждение', 2, true, 'design_approval'
      WHERE NOT EXISTS (SELECT 1 FROM crm_funnel_stages WHERE code = 'KLISHE_STP')
    `,
  },
  {
    name: 'crm_funnel_stages seed: Narx (3)',
    sql: `
      INSERT INTO crm_funnel_stages (code, name, name_ru, sort, is_active, semantics)
      SELECT 'NARX', 'Narx', 'Цена', 3, true, 'pricing'
      WHERE NOT EXISTS (SELECT 1 FROM crm_funnel_stages WHERE code = 'NARX')
    `,
  },
  {
    name: 'crm_funnel_stages seed: Shartnoma (4)',
    sql: `
      INSERT INTO crm_funnel_stages (code, name, name_ru, sort, is_active, semantics)
      SELECT 'SHARTNOMA', 'Shartnoma', 'Договор', 4, true, 'contract'
      WHERE NOT EXISTS (SELECT 1 FROM crm_funnel_stages WHERE code = 'SHARTNOMA')
    `,
  },
  {
    name: 'crm_funnel_stages seed: Buyurtma (5)',
    sql: `
      INSERT INTO crm_funnel_stages (code, name, name_ru, sort, is_active, semantics)
      SELECT 'BUYURTMA', 'Buyurtma', 'Заказ', 5, true, 'order'
      WHERE NOT EXISTS (SELECT 1 FROM crm_funnel_stages WHERE code = 'BUYURTMA')
    `,
  },
  {
    name: 'crm_companies add is_key_account col (EP-CRM-054)',
    sql: `ALTER TABLE crm_companies ADD COLUMN IF NOT EXISTS is_key_account BOOLEAN DEFAULT false`,
  },
  {
    name: 'crm_companies add business_profile JSONB col (EP-CRM-053)',
    sql: `ALTER TABLE crm_companies ADD COLUMN IF NOT EXISTS business_profile JSONB`,
  },
  {
    name: 'crm_companies add assigned_to col (EP-CRM-022 salesperson scope)',
    sql: `ALTER TABLE crm_companies ADD COLUMN IF NOT EXISTS assigned_to INTEGER`,
  },
```

**Tekshiruv:** Barcha `INSERT` iboralari idempotent (`WHERE NOT EXISTS` bilan). Jadval allaqachon mavjud bo'lsa `CREATE TABLE IF NOT EXISTS` xatolik bermaydi. `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` — ham idempotent. ✅

---

## 5. DDL (GATED)

> **DDL DARVOZASI (Q-35):** Quyidagi barcha DDL faqat egasi ruxsati bilan bajariladi.
> Migration faylida `-- APPROVED: <egasi ismi> <sana>` izoh bo'lishi SHART.
> Hozirda `migrations-crm.ts` ga yoziladi, lekin runner tarafidan SKIP qilinadi.

### 5.1 `crm_funnel_stages` jadvali + 5 seed

```sql
-- APPROVED: <egasi ismi> <sana>  ← egasi to'ldiradi
CREATE TABLE IF NOT EXISTS crm_funnel_stages (
  id          SERIAL PRIMARY KEY,
  code        TEXT NOT NULL UNIQUE,         -- mashinalar uchun kalit (NAMUNA, KLISHE_STP, ...)
  name        TEXT NOT NULL,                -- uzbekcha nomi (egasi o'zgartiradi)
  name_ru     TEXT,                         -- ruscha nomi (ixtiyoriy)
  sort        INTEGER NOT NULL DEFAULT 0,  -- tartib raqami (drag-drop uchun)
  is_active   BOOLEAN NOT NULL DEFAULT true,
  semantics   TEXT,                         -- tizim ma'nosi: sample/design_approval/pricing/contract/order
  created_at  TIMESTAMP DEFAULT now(),
  updated_at  TIMESTAMP DEFAULT now()
);

-- Idempotent seed: 5 bosqich (EP-CRM-002 vizyon, egasi tomonidan tasdiqlangan)
INSERT INTO crm_funnel_stages (code, name, name_ru, sort, is_active, semantics)
SELECT 'NAMUNA', 'Namuna', 'Образец', 1, true, 'sample'
WHERE NOT EXISTS (SELECT 1 FROM crm_funnel_stages WHERE code = 'NAMUNA');

INSERT INTO crm_funnel_stages (code, name, name_ru, sort, is_active, semantics)
SELECT 'KLISHE_STP', 'Klishe/STP tasdiq', 'Клише/STP подтверждение', 2, true, 'design_approval'
WHERE NOT EXISTS (SELECT 1 FROM crm_funnel_stages WHERE code = 'KLISHE_STP');

INSERT INTO crm_funnel_stages (code, name, name_ru, sort, is_active, semantics)
SELECT 'NARX', 'Narx', 'Цена', 3, true, 'pricing'
WHERE NOT EXISTS (SELECT 1 FROM crm_funnel_stages WHERE code = 'NARX');

INSERT INTO crm_funnel_stages (code, name, name_ru, sort, is_active, semantics)
SELECT 'SHARTNOMA', 'Shartnoma', 'Договор', 4, true, 'contract'
WHERE NOT EXISTS (SELECT 1 FROM crm_funnel_stages WHERE code = 'SHARTNOMA');

INSERT INTO crm_funnel_stages (code, name, name_ru, sort, is_active, semantics)
SELECT 'BUYURTMA', 'Buyurtma', 'Заказ', 5, true, 'order'
WHERE NOT EXISTS (SELECT 1 FROM crm_funnel_stages WHERE code = 'BUYURTMA');
```

### 5.2 `crm_companies` ALTER — yangi ustunlar

```sql
-- APPROVED: <egasi ismi> <sana>
ALTER TABLE crm_companies ADD COLUMN IF NOT EXISTS is_key_account   BOOLEAN DEFAULT false;
ALTER TABLE crm_companies ADD COLUMN IF NOT EXISTS business_profile  JSONB;
ALTER TABLE crm_companies ADD COLUMN IF NOT EXISTS assigned_to       INTEGER;
-- Ixtiyoriy FK: egasi xohlasa REFERENCES users(id) ON DELETE SET NULL qo'shadi
```

### 5.3 Drizzle sxema yangilanishi (P39 owned EMAS — flag)

DDL approved bo'lgandan keyin `lib/db/src/schema/crm-contacts.ts` faylida `crmCompanies` Drizzle ta'rifiga quyidagi ustunlar qo'shilishi kerak:
```typescript
is_key_account:   boolean('is_key_account').default(false),
business_profile: jsonb('business_profile'),
assigned_to:      integer('assigned_to'),
```

Bu fayl P39 owned fayllar ro'yxatida EMAS — egasiga flag qilish kerak. P39 dan tashqaridagi bu o'zgarishni P39 bajarmaydi.

---

## 6. QABUL MEZONI

### 6.1 Funksional tekshiruvlar (Round-trip proof — Q-40 / C4)

- [ ] **is_key_account saqlash:** `POST /api/crm/companies` `{ name: "Test SA", is_key_account: true }` → `201` → `GET /api/crm/companies/:id` → `is_key_account: true` ko'rinadi. (DDL APPROVED bo'lgandan keyin)
- [ ] **business_profile saqlash:** `PATCH /api/crm/companies/:id` `{ business_profile: { product: "gofra", volume_ton: 50 } }` → `200` → `GET` → `business_profile.product == "gofra"`.
- [ ] **deleteCompany javob:** `DELETE /api/crm/companies/:id` → `{ id: N, deleted: true }` (eski `{}` emas).
- [ ] **RBAC scope — salesperson:** `JWT role=salesperson, id=5` + `GET /api/crm/companies` → faqat `assigned_to=5` kompaniyalar. (DDL `assigned_to` ustuni APPROVED bo'lgandan keyin to'liq ishlaydi)
- [ ] **RBAC scope — manager:** `JWT role=sales_manager` + `GET /api/crm/companies` → barcha kompaniyalar.
- [ ] **getDashboardDeals drift tuzatildi:** `GET /api/crm/dashboard/deals` → `{ total: N, pipeline: M }` (503 yoki NaN emas).
- [ ] **Funnel stages seed:** (DDL APPROVED bo'lgandan keyin) `SELECT * FROM crm_funnel_stages ORDER BY sort` → 5 qator: NAMUNA/KLISHE_STP/NARX/SHARTNOMA/BUYURTMA.
- [ ] **Konstantalar:** `grep CRM_ABANDONMENT_DAYS apps/api/src/common/constants/business.constants.ts` → `= 60` ko'rinadi.

### 6.2 Texnik tekshiruvlar

- [ ] `npx tsc --noEmit` — BE typecheck 0 xato.
- [ ] `pnpm --filter erp-dashboard exec tsc --noEmit` — FE typecheck 0 xato (P39 FE fayliga tegmaydi, lekin import zanjiri sinmaydi).
- [ ] `bash scripts/reviewer-result-pattern.sh` — 0 FAIL.
- [ ] `bash scripts/reviewer-array-safety.sh` — 0 FAIL.
- [ ] `bash scripts/reviewer-jwt-guard.sh` — PASS.
- [ ] Controller `@UseGuards(JwtAuthGuard, RolesGuard)` — o'zgarishsiz saqlanadi (mavjud).

### 6.3 Golden-thread regressiya tekshiruvi

- [ ] `POST /api/crm/companies` (mavjud) — hali ishlaydi (qat. 119–129 o'zgarishsiz).
- [ ] `GET /api/crm/companies/:id` — hali ishlaydi.
- [ ] `GET /api/crm/companies/:id/contacts` — hali ishlaydi.
- [ ] `GET /api/crm/companies/:id/deals` — hali ishlaydi.
- [ ] `GET /api/crm/lead-stages` — hali ishlaydi.
- [ ] `POST /api/crm/companies/:id/contacts` — hali ishlaydi.
- [ ] Backend boot: `:3030/api/auth/health` → `200 { status: "ok" }`.

### 6.4 Reviewer tekshiruvlari

```bash
bash scripts/reviewer-result-pattern.sh     # 0 FAIL
bash scripts/reviewer-array-safety.sh       # 0 FAIL
bash scripts/reviewer-dto-validation.sh     # PASS
bash scripts/reviewer-jwt-guard.sh          # PASS
bash scripts/reviewer-as-unknown.sh         # FAIL 3 dan oshmaydi (biz qo'shmaymiz)
```

---

## 7. SELF-VERIFY (aniq buyruqlar + DB-proof)

### 7.1 Typecheck

```bash
# Backend
cd C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module
npx tsc --noEmit -p apps/api/tsconfig.json 2>&1 | head -40

# Frontend (regressiya)
npx tsc --noEmit -p artifacts/erp-dashboard/tsconfig.json 2>&1 | head -40
```

Kutilgan natija: `0 xato`.

### 7.2 Service imzo tekshiruvi (BIRINCHI BAJARING — owned fayl emas)

```bash
grep -n "listCompanies" apps/api/src/modules/crm/application/crm-companies.service.ts
```

**Agar chiqdi:** `listCompanies(search, limit, offset)` (3 parametr) — service faylini egasiga flag qil va `assignedTo` 4-parametr sifatida qo'shishini so'ra. P39 service fayliga tegmaydi.

**Agar chiqdi:** `listCompanies(search, limit, offset, assignedTo)` (4 parametr) — davom eting.

### 7.3 crmDeals ustun nomini aniqlash

```bash
grep -n "opportunity\|forecast_amount\|stageSemanticId\|stage_semantic_id\|expected_amount" \
  lib/db/src/schema/crm-pipelines.ts
```

Natijaga qarab `getDashboardDeals` da to'g'ri Drizzle ustun nomini ishlating.

### 7.4 `@CurrentUser` dekorator mavjudligi

```bash
ls apps/api/src/common/decorators/ | grep -i "current\|user"
```

Agar `current-user.decorator.ts` mavjud: import yo'lini aniqlang.
Agar yo'q: `@Req()` + `req.user` varianti.

### 7.5 DB-proof (DDL APPROVED bo'lgandan keyin)

```bash
# crm_funnel_stages mavjudligi
docker exec uzbek-language-module-postgres-1 psql -U europrint europrint \
  -c "SELECT code, name, sort FROM crm_funnel_stages ORDER BY sort;"
# Kutilgan: 5 qator (NAMUNA/KLISHE_STP/NARX/SHARTNOMA/BUYURTMA)

# crm_companies yangi ustunlar
docker exec uzbek-language-module-postgres-1 psql -U europrint europrint \
  -c "SELECT column_name, data_type FROM information_schema.columns \
      WHERE table_name = 'crm_companies' \
        AND column_name IN ('is_key_account','business_profile','assigned_to');"
# Kutilgan: 3 qator

# is_key_account saqlash tekshiruvi
docker exec uzbek-language-module-postgres-1 psql -U europrint europrint \
  -c "SELECT id, title, is_key_account FROM crm_companies LIMIT 5;"
```

### 7.6 Dashboard drift tuzatilganini tekshirish

```bash
# getDashboardDeals endpoint (server ishlab turganida)
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:3030/api/crm/dashboard/deals | jq .
# Kutilgan: { "total": N, "pipeline": M } — 503/NaN EMAS
```

Yoki server ishlamasidan oldin static tekshiruv:
```bash
grep -n "expected_amount\|crmDeals.status" \
  apps/api/src/modules/crm/infrastructure/repositories/crm-extras-dashboard.repository.ts
# Kutilgan: ushbu qatorlar MAVJUD EMAS (o'chirilgan)
```

### 7.7 Stub tuzatilganini tekshirish

```bash
grep -n "return {}" apps/api/src/modules/crm/presentation/crm-companies.controller.ts
# Kutilgan: hech qanday natija yo'q (stub o'chirilgan)

grep -n "deleted: true" apps/api/src/modules/crm/presentation/crm-companies.controller.ts
# Kutilgan: qat. ~156 — "return { id: numId, deleted: true };"
```

### 7.8 Konstantalar tekshiruvi

```bash
grep -n "CRM_ABANDONMENT_DAYS\|CRM_FOLLOWUP\|CRM_PRICE_RISE" \
  apps/api/src/common/constants/business.constants.ts
# Kutilgan: 5 ta satr ko'rinadi
```

---

## 8. COMMIT

**Commit tartibi:**

```bash
# Qadam 1: Faqat konstantalar
git add apps/api/src/common/constants/business.constants.ts
git commit -m "feat(crm): add CRM followup/abandonment/price-trigger constants to business.constants"

# Qadam 2: DTO yangilash
git add apps/api/src/modules/crm/presentation/dto/crm-companies.dto.ts
git commit -m "feat(crm): add is_key_account + business_profile + assigned_to to CreateCompanyDtoSchema (EP-CRM-053/054/022)"

# Qadam 3: Repository o'zgarishlari
git add apps/api/src/modules/crm/infrastructure/repositories/crm-companies.repository.ts
git add apps/api/src/modules/crm/infrastructure/repositories/crm-extras-dashboard.repository.ts
git commit -m "fix(crm): listCompanies salesperson RBAC scope filter (EP-CRM-022/030); createCompany/updateCompany is_key_account+business_profile; getDashboardDeals column drift fix (expected_amount→opportunity, status→stageSemanticId)"

# Qadam 4: Controller tuzatish
git add apps/api/src/modules/crm/presentation/crm-companies.controller.ts
git commit -m "fix(crm): deleteCompany returns {id, deleted:true} not {} (Qoida 10); listCompanies RBAC assignedTo scope (EP-CRM-022)"

# Qadam 5: Migration DDL (GATED — approved bo'lsa)
git add apps/api/src/shared/db/invariants/migrations-crm.ts
git commit -m "feat(crm): add crm_funnel_stages DDL+seed (EP-CRM-002) + crm_companies ALTER is_key_account/business_profile/assigned_to (EP-CRM-053/054/022) — GATED: approved by owner"
```

**TAQIQ:**
- `git add -A` — TAQIQ
- `git add .` — TAQIQ
- Faqat yuqoridagi 6 fayl (owned fayl ro'yxati)
- Agar service fayli o'zgarishi kerak bo'lsa: alohida commit, egasi ruxsatidan keyin

---

## 9. EGAGA XABAR (holat hisoboti)

Har qadam bajarilgandan keyin egaga Uzbek (lotin) da hisobot:

```
Qadam N yakunlandi:
✅ <nima bajarildi>
⚠️ Flag: <nima keyin egasi hal qilishi kerak>
Commit: <hash>
```

**Kutilgan flaglar:**

1. **Service imzo flag:** `crm-companies.service.ts` da `listCompanies` 4-parametr (`assignedTo`) qo'shish kerak — P39 tegmaydi, egasi ruxsati kerak.
2. **Drizzle sxema flag:** `lib/db/src/schema/crm-contacts.ts` da `crmCompanies` ta'rifiga `is_key_account`, `business_profile`, `assigned_to` ustunlari qo'shish kerak (DDL APPROVED bo'lgandan keyin).
3. **DDL APPROVED flag:** `migrations-crm.ts` da `-- APPROVED: <egasi ismi> <sana>` izohini egasi qo'yishi kerak.
4. **crm-activities.controller.ts:131** — `return {}` stub P39 dan tashqarida; egasiga flag (alohida paket kerak).
5. **`crmDeals.opportunity` vs `forecast_amount`** — tekshirish natijasiga qarab (§7.3) to'g'ri nom ishlatiladi; agar har ikkisi ham yo'q bo'lsa — egasiga flag.

---

## 10. EDGE-CASE VA XAVF

| Xavf | Ehtimollik | Yechim |
|---|---|---|
| `CrmCompaniesService.listCompanies` 3-parametrli — 4-parametr qabul qilmaydi | O'rta | Service faylini egasiga flag qil; P39 tegmaydi |
| `crmDeals.opportunity` yoki `forecast_amount` — Drizzle sxemada noto'g'ri nom | O'rta | §7.3 grep bilan aniqlash; to'g'ri nomdan foydalanish |
| `is_key_account` / `business_profile` ustunlari DB da yo'q (DDL unapproved) — `createCompany` UPDATE qismi 503 berishi | Past | `UPDATE ... WHERE id = X` — agar ustun yo'q bo'lsa PostgreSQL xato beradi; `safeCall` bu xatoni `Result<T>` ga o'giradi (200 emas, 500 bo'ladi). DDL APPROVED bo'lgunga qadar bu yo'lni chaqirmang yoki `try/catch` bilan alohida himoya qiling |
| `@CurrentUser` dekorator yo'q | O'rta | `@Req()` variantiga o'tish (§4.2) |
| `deleteCompany` tuzatilgach caller tomonida `if (response.deleted)` check bo'lsa — mos kelishi kerak | Past | Response o'zgartirish backward-compatible: `{}` → `{id, deleted:true}` — ko'proq ma'lumot qaytarish, kam emas |
| Parallel agent (P02 va boshqalar) `migrations-crm.ts` ga tegishi | O'rta | `git add` faqat aniq fayllar; merge conflict bo'lsa — egasiga ayt |

---

## 11. IZOLYATSIYA ESLATMASI (takror)

Bu agentga tegishli EMAS — lekin P39 davomida ko'rinishi mumkin bo'lgan fayllar:

| Fayl | Sabab | P39 amal |
|---|---|---|
| `apps/api/src/modules/crm/application/crm-companies.service.ts` | `listCompanies` 4-parametr kerak | Flag → egasi hal qiladi |
| `lib/db/src/schema/crm-contacts.ts` | Drizzle sxema `crmCompanies` yangi ustunlar | Flag → egasi DDL APPROVED + sxema yangilaydi |
| `apps/api/src/modules/crm/presentation/crm-activities.controller.ts` | `return {}` stub (qat. 131) | Flag → alohida paket |
| `apps/api/src/modules/crm/presentation/crm-followup-compat.controller.ts` | `return {}` stub (qat. 98) | Flag → alohida paket |
| `apps/api/src/modules/crm/analytics/repositories/drizzle-crm-analytics.repo.ts` | funnel JOIN xatosi | Flag → analytics paket |

**Agar ushbu fayllardan biriga tegish kerak bo'lsa — TO'XTA. Egasiga flag qil. Davom etma.**

---

---

## QISM: 00-INTERVYU-MOSLIK §CRM ALOQASI (P39 ulushi)

> P39 ning 5 ta `00-INTERVYU-MOSLIK.md` §CRM teshigi ichidagi **ulushi**.
> To'liq tuzatiqlar P40 da amalga oshiriladi (P40 ownedfile ro'yxatida).

| Gap | P39 ulushi | P40 ulushi |
|-----|-----------|-----------|
| **FIX-1** 360° Finance-qarz + QC-shikoyat | Yo'q — P39 scope tashqarida | `QADAM 6c getCustomer360` — `finance_debt` + `open_complaints` qo'shildi |
| **FIX-2** Overdue NTF eskalatsiya | Yo'q — P39 scope tashqarida | `QADAM 4 markOverdueTasks` — `EventEmitter2.emit('ntf.send')` qo'shildi |
| **FIX-3** 30/60/90 followup | ✅ **P39 ULUSHI:** `CRM_FOLLOWUP_60_DAYS=60` va `CRM_FOLLOWUP_90_DAYS=90` konstantalari P39 QADAM 1 da qo'shiladi | `QADAM 4 createFollowupTasks` — 3 ta chegara aylanma |
| **FIX-4** NBA confirm-write | Yo'q — P39 scope tashqarida | `QADAM 5d+5e confirmNbaAction` + `POST /api/crm/ai/nba/confirm` |
| **FIX-5** salesTarget configurable | Yo'q — P39 scope tashqarida | `QADAM 1 DDL crm_sales_targets` (GATED) + `QADAM 6b getDashboardGsd` subquery |

**P39 ning asosiy moslik hissasi:**
- `CRM_FOLLOWUP_30_DAYS`, `CRM_FOLLOWUP_60_DAYS`, `CRM_FOLLOWUP_90_DAYS` konstantalari `business.constants.ts` da (QADAM 1) — FIX-3 uchun P40 bu konstantalarni ishlatadi.
- P39 boshqa 4 tuzatiq uchun owned fayl emas — faqat P40 da.

*P39 direktiva yakunlandi. Jami: 6 owned fayl · 1 DDL gated · 5 migration · 3 stub fix · 1 column drift fix · 1 RBAC scope · 7 yangi konstanta. + 00-INTERVYU-MOSLIK 5-gap ulushi qo'shildi.*
