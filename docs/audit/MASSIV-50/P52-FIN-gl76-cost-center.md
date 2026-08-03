# P52 — FIN — GL #76 Per-Sex Alohida Hisob + Cost-Center (org_departments node)

> **WAVE:** 2 | **dependsOn:** P24 (GL core hardening) | **ddlGate:** TRUE — yangi ustun kerak (egasi ruxsati shart)
> **Slug:** fin-gl76-cost-center | **Agent:** bitta izolyatsiyalangan bajaruvchi
> Yozilgan: 2026-06-19 | Vizyon manba: `docs/XARITA-REJA-YONALISH-2026-06-07.md §2.3 + §2.7`
> **Egasi manzili:** `docs/audit/MUSLIMBEK-PROMT-10-FIN-2026-06-08.md` §Phase 4 EP-FIN-078

---

## ⚠️ EGASI QARORI KERAK (HARD BOUNDARY — §2.7)

```
╔══════════════════════════════════════════════════════════════════╗
║  EGASI QARORI KERAK — BU PAKET BAJARILIB BO'LMAYDI             ║
║                                                                  ║
║  Masala 1 (ARXITEKTURA): Cost-center modeli                      ║
║  ─────────────────────────────────────────────────────────────   ║
║  Vizyon §2.3 deydi: cost_center_id = org_departments node        ║
║  (parallel master EMAS; SAP cost_centers jadvali bor).           ║
║                                                                  ║
║  Hozir tizimda IKKITA narsa mavjud:                              ║
║    A) cost_centers jadvali (lib/db/src/schema/fi-gl.ts:89)       ║
║       — departments.id FK bor, lekin mustaqil master             ║
║    B) org_departments jadvali (core-schema.ts:294)               ║
║       — Vysotskiy 7-node daraxt, hozir 142 node                  ║
║                                                                  ║
║  Egasi tasdiqlashi kerak:                                         ║
║    [ ] entries.cost_center_id → org_departments.id FK (to'g'ridan) ║
║        YA                                                         ║
║    [ ] entries.cost_center_id → cost_centers.id FK (mavjud jadval) ║
║                                                                  ║
║  §2.3 aniq deydi: org_departments node — LEKIN                   ║
║  "SAP cost-center bor" → bu cost_centers jadvali mavjud          ║
║  demoq. Vizyon = org_departments, lekin tekshirish kerak.        ║
║                                                                  ║
║  Masala 2 (DDL): entries jadvali kengaytirish                    ║
║  ─────────────────────────────────────────────────────────────   ║
║  entries jadvali kanonik GL. Unga cost_center_id va              ║
║  sex_category ustunlari qo'shish kerak.                           ║
║  Q-35: DDL faqat egasi "APPROVED:" izoh bilan.                   ║
║                                                                  ║
║  Masala 3 (SEMANTIKA): "sex bo'yicha alohida hisob" [Q3]         ║
║  ─────────────────────────────────────────────────────────────   ║
║  §2.3 Q3: GL #76 = "sex bo'yicha alohida hisob".                  ║
║  Bu nimani anglatadi aniq:                                        ║
║    a) Erkak/ayol xodimlarga oid GL yozuvlarini aniqlash           ║
║       (payroll/bonus segmentatsiya uchun)?                        ║
║    b) entries jadvali darajasida sex_category text ustuni?        ║
║    c) Faqat hisobot darajasida (employees.gender JOIN)?           ║
║                                                                  ║
║  EGASI JAVOBI KERAK: a/b/c dan birini tasdiqlang.               ║
║                                                                  ║
║  Javobi kerak bo'lgan savollar:                                   ║
║  1. cost_center_id → org_departments.id mi yoki cost_centers.id? ║
║  2. sex_category ustuni entries jadvali darajasidami?            ║
║  3. DDL migratsiyaga "APPROVED:" berasizmi?                      ║
║                                                                  ║
║  QAROR KELGUNCHA bu paket bajarilmaydi.                          ║
╚══════════════════════════════════════════════════════════════════╝
```

---

## 0. ROL VA QOIDALAR

Sen 🟢 **BAJARUVCHI**-san. Har sessiya boshida `CLAUDE.md` + `docs/agent-constitution.md` o'qi.
Quyidagi qoidalar ISTISNOSIZ qo'llanadi (Q-47):

```
QOIDALAR BLOKI:
1.  Result<T> hamma repo/service metodida; throw/null/undefined TAQIQ.
2.  @Body Zod bilan validate; class-validator TAQIQ.
3.  Drizzle ORM; raw SQL faqat murakkab holatda: typedExecute<T> yoki runQuery<T> (izoh shart).
4.  Q-40 ishlaydi≠to'g'ri: REAL INSERT/UPDATE + DB-proof; echo/hardcoded/fake TAQIQ.
5.  Q-46 ishlab turgan kod O'CHIRILMAYDI; buzuq/o'lik kod TO'LIQ o'chiriladi.
6.  FAYL IZOLYATSIYASI (Q-31): faqat OWNED-FILE ro'yxatidagi fayllar.
    Boshqa fayl kerak bo'lsa → TO'XTA, egaga flag qil.
7.  DDL DARVOZASI (Q-35): CREATE TABLE / ALTER TABLE faqat egasi ruxsati bilan.
    Migration faylida "-- APPROVED: [egasi ismi] [sana]" izoh shart.
    Bu paket DDL TALAB QILADI → egasi APPROVED: berishini kuting.
8.  git add <aniq-fayl> faqat; -A / . TAQIQ.
9.  Q-45 log/secret HECH QACHON commit qilinmaydi; JWT minting yo'q.
10. Self-verify: BE tsc 0, FE tsc 0, reviewer skriptlar,
    jonli DB-proof (kirit→saqla→qayta o'qi→ko'rinadimi).
11. "V2"/"Strangler Fig"/"V1 vs V2" terminologiyasi TAQIQ.
12. Vizyon-moslik: TO'G'RI o'lchovi = master vizyon (docs/XARITA-REJA-YONALISH + modul vizyon);
    kod vizyonga zid bo'lsa (ishlasa ham) = xato.
13. gl_journal_entries va gl_lines TEGMA — SAP #76 forbidden list.
    FAQAT kanonik entries jadvali.
14. GATED paket: egasi APPROVED: berguncha DDL bajariLMASIN.
    Section 5 (Migration) draft sifatida yozilgan — egasi stamp bosguncha qo'llash TAQIQ.
```

**WAVE 2** — bu paket `dependsOn: P24` (GL core hardening). P24 commitdan keyin boshlanadi.

---

## 1. VIZYON (manba §2.3 + §2.7 + EP-FIN-078)

### 1.1 GL #76 — Per-Sex Alohida Hisob (§2.3 [Q3])

Master vizyon `docs/XARITA-REJA-YONALISH-2026-06-07.md §2.3`:

> "GL #76 = sex bo'yicha ALOHIDA hisob [Q3] → cost-center = org_departments node
> (parallel master EMAS; SAP cost-center bor) + entries kengaytirish/repoint. DDL."

**Talqin (egasi tasdiqlashidan oldin):**
- Har GL yozuvi (entries qatori) qaysi `org_departments` nodiga (bo'limga) tegishli ekanini bilishi
- Agar yozuv xodimga tegishli bo'lsa (payroll/bonus) — xodimning jinsi (gender) bo'yicha hisobot
- Natija: moliya bo'limi "Erkaklar/Ayollar bo'yicha xarajat qancha?" savoliga javob beradi

**EP-FIN-078** (master-savol-javob.md):
> "Xarajat-markazi (bo'lim/uchastkaga bo'yicha xarajat) — har xarajat
> xarajat-markaziga (bo'limga) bog'lanadi → bo'lim-bo'yicha hisobot (javobgarlik).
> Kitobda bo'limlar aniq (Flekso/Ofset); karta-model."

### 1.2 Cost-Center Model — org_departments node (§2.3)

Vizyon bo'yicha:
- Cost-center = `org_departments` node (parallel master EMAS)
- SAP `cost_centers` jadvali bor — lekin bu vizyon uni bypass qiladi
- `entries.cost_center_id` → `org_departments.id` FK

**Hozirgi holat (verify-don't-trust):**

| Jadval | Fayl | Holat |
|--------|------|-------|
| `entries` | `lib/db/src/schema/fi-gl.ts:51` | Mavjud, lekin `cost_center_id` ustuni YO'Q |
| `cost_centers` | `lib/db/src/schema/fi-gl.ts:89` | Mavjud — `departments.id` FK bor |
| `org_departments` | `lib/db/src/schema/core-schema.ts:294` | Mavjud — 142 node, Vysotskiy 7-daraxt |
| `glLines.cost_center_id` | `fi-gl.ts:199` | `cost_centers.id` FK bor — bu SAP #76 (**TEGMA**) |

**Kanonik jadval `entries` da `cost_center_id` ustuni YO'Q** — bu gap (G1).

### 1.3 Per-Sex GL Reporting modeli

Jins (sex) ma'lumoti manba:
- `users` jadvali → `employees` jadvali → `gender` yoki biologik belgi
- Yoki `entries.sex_category` tekst ustuni (erkak/ayol/belgilanmagan)

**Ikkita yondashuv (egasi tanlaydi):**

**Yondashuv A — entries darajasida ustun:**
```sql
-- entries jadvali ga qo'shiladi:
ALTER TABLE entries ADD COLUMN cost_center_id INTEGER REFERENCES org_departments(id) ON DELETE SET NULL;
ALTER TABLE entries ADD COLUMN sex_category VARCHAR(10) CHECK (sex_category IN ('male','female','mixed','unset'));
```
Afzalligi: to'g'ridan query, JOIN kerak emas.
Kamchiligi: insertJournal har chaqiruvda sex_category talab qiladi.

**Yondashuv B — faqat cost_center_id, sex hisobot darajasida JOIN:**
```sql
-- entries jadvali ga faqat cost_center_id qo'shiladi:
ALTER TABLE entries ADD COLUMN cost_center_id INTEGER REFERENCES org_departments(id) ON DELETE SET NULL;
-- sex_category entries da yo'q, hisobot vaqtida employees.gender JOIN bilan olinadi
```
Afzalligi: entries sof saqlaydi, hisobot flexibli.
Kamchiligi: hisobot sekinroq (JOIN kerak).

**Vizyon §2.3 aniq** — "sex bo'yicha alohida hisob" → Yondashuv A ko'proq mos,
lekin egasi tasdiqlaydi.

---

## 2. COST-CENTER MODEL (BATAFSIL)

### 2.1 org_departments — Kanonik Cost-Center

Vizyon bo'yicha `org_departments` jadvali cost-center uchun ishlatiladi.
Bu jadval `lib/db/src/schema/core-schema.ts:294` da:

```typescript
export const orgDepartments = pgTable("org_departments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),           // Bo'lim nomi (Flekso, Ofset, HR, Moliya...)
  nameRu: text("name_ru"),
  description: text("description"),
  headUserId: integer("head_user_id"),    // Bo'lim boshlig'i
  parentId: integer("parent_id"),         // Ota-bo'lim (Vysotskiy daraxt)
  hierarchyLevel: integer("level"),       // Daraja (0=top, 1=otdeleniye, 2=otdel...)
  nodeType: varchar("node_type", { length: 50 }), // department/section/sector
  isActive: boolean("is_active").default(true),
  // ... boshqa ustunlar
});
```

142 ta node mavjud. Har bir GL yozuvi shu nodlardan biriga bog'lanadi.

**Mapping misoli:**
| org_departments.name | GL yozuv turi |
|---------------------|---------------|
| Flekso bo'limi | Flekso ishlab chiqarish xarajatlari |
| Ofset bo'limi | Ofset материal xarajatlari |
| HR bo'limi | Oylik xarajatlari |
| Moliya bo'limi | ZVS/ZNO xarajatlari |
| Oshxona | Ovqatlanish kompensatsiya |

### 2.2 Kanonik entries Jadvali — Talab Qilinadigan Kengaytma

**Hozirgi holat (`lib/db/src/schema/fi-gl.ts:51–73`):**
```typescript
export const entries = pgTable("entries", {
  id: serial("id").primaryKey(),
  entryNumber: varchar("entry_number", { length: 50 }).notNull().unique(),
  entryDate: varchar("entry_date", { length: 10 }).notNull(),
  documentType: varchar("document_type", { length: 50 }).notNull(),
  documentId: varchar("document_id"),
  debitAccountId: varchar("debit_account_id").references(() => accounts.id, { onDelete: "set null" }),
  creditAccountId: varchar("credit_account_id").references(() => accounts.id, { onDelete: "set null" }),
  amount: numericMoney("amount").notNull(),
  description: text("description"),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  debitAccount: text("debit_account"),
  creditAccount: text("credit_account"),
  referenceId: varchar("reference_id"),
  referenceType: varchar("reference_type", { length: 30 }),
  postedBy: integer("posted_by"),
  postedAt: timestamp("posted_at"),
  currency: varchar("currency", { length: 10 }).notNull().default('UZS'),
  // ↑ cost_center_id YO'Q — bu G1 gap
  // ↑ sex_category YO'Q — bu G2 gap (agar Yondashuv A tanlansa)
});
```

**Kerakli kengaytma (egasi APPROVED: bergandan keyin):**
```typescript
  // EP-FIN-078 / GL #76: cost-center va per-sex hisobot uchun — APPROVED: [egasi] [sana]
  costCenterId: integer("cost_center_id").references(() => orgDepartments.id, { onDelete: "set null" }),
  sexCategory: varchar("sex_category", { length: 10 }),
  // CHECK constraint migration'da: CHECK (sex_category IN ('male','female','mixed','unset'))
```

### 2.3 Per-Sex GL Reporting — Ikkita Qatlam

**Qatlam 1 — entries darajasida tag:**
Payroll/bonus yozuvi insertJournal'dan chaqirilganda `sex_category` beriladi:
- Payroll erkak xodim → `sex_category: 'male'`
- Payroll ayol xodim → `sex_category: 'female'`
- ZVS/ZNO (bo'lim uchun) → `sex_category: 'mixed'`
- Manual yozuv → `sex_category: 'unset'`

**Qatlam 2 — hisobot query:**
`GET /api/financial-reports/gl-by-sex` — `entries` + `org_departments` JOIN:
```sql
SELECT
  od.name                         AS department,
  e.sex_category,
  SUM(CASE WHEN e.debit_account  IS NOT NULL THEN e.amount ELSE 0 END) AS total_debit,
  SUM(CASE WHEN e.credit_account IS NOT NULL THEN e.amount ELSE 0 END) AS total_credit,
  COUNT(*)                        AS entry_count
FROM entries e
LEFT JOIN org_departments od ON od.id = e.cost_center_id
WHERE e.entry_date BETWEEN $1 AND $2
GROUP BY od.name, e.sex_category
ORDER BY od.name, e.sex_category;
```

### 2.4 Cost-Center Query Service — Yangi Fayl

Yangi fayl: `apps/api/src/modules/finance/financial-reports/services/cost-center-gl.service.ts`

Bu fayl:
- `getCostCenterReport(dateFrom, dateTo)` — bo'lim bo'yicha GL yig'indisi
- `getGlBySex(dateFrom, dateTo, costCenterId?)` — jins bo'yicha GL hisobot
- `getCostCenterBalance(costCenterId)` — bitta bo'lim uchun debet/kredit balans

---

## 3. HOZIRGI HOLAT (RE-AUDIT)

### 3.1 Mavjud (exists)

| # | Komponent | Fayl | Holat |
|---|-----------|------|-------|
| E1 | `entries` jadvali | `lib/db/src/schema/fi-gl.ts:51` | Mavjud, KANONIK — tegish mumkin, lekin ALTER = DDL approval |
| E2 | `org_departments` jadvali | `lib/db/src/schema/core-schema.ts:294` | Mavjud, 142 node |
| E3 | `cost_centers` jadvali | `lib/db/src/schema/fi-gl.ts:89` | Mavjud — `departments.id` FK (ESKI model, vizyon bypass qiladi) |
| E4 | `DrizzleGlPostingRepository.insertJournal` | `infrastructure/repositories/drizzle-gl-posting.repo.ts:72` | REAL — db.transaction bilan |
| E5 | `FinancialReportsController` | `financial-reports/presentation/financial-reports.controller.ts:25` | Mavjud, ko'plab endpoint |
| E6 | `FinancialReportsQueryService` | `financial-reports/services/financial-reports-query.service.ts` | Mavjud, real DB queries |
| E7 | `financial-reports-query.helpers.ts` | `financial-reports/services/` | Mavjud — helper queries |
| E8 | `glLines.cost_center_id` | `lib/db/src/schema/fi-gl.ts:199` | `cost_centers.id` FK — SAP #76 **TEGMA** |

### 3.2 Mavjud emas / Gap (missing)

| # | Gap | Tegishli vizyon | Tasniflash |
|---|-----|----------------|------------|
| G1 | `entries.cost_center_id` ustuni yo'q | EP-FIN-078 / §2.3 | MISSING — DDL kerak |
| G2 | `entries.sex_category` ustuni yo'q | GL #76 §2.3 | MISSING — DDL kerak (agar Yondashuv A) |
| G3 | `insertJournal` `cost_center_id` parametr qabul qilmaydi | EP-FIN-078 | MISSING — repo kengaytirish |
| G4 | GL-by-sex endpoint yo'q | GL #76 §2.3 | MISSING — yangi endpoint |
| G5 | Cost-center GL hisobot endpoint yo'q | EP-FIN-078 | MISSING — yangi endpoint |
| G6 | FE cost-center hisobot sahifasi yo'q | EP-FIN-078 | MISSING — yangi sahifa |
| G7 | Drizzle schema `entries` da `cost_center_id` deklaratsiyasi yo'q | §2.3 | MISSING — schema update |

### 3.3 Nima tegilmaydi (SAP #76 forbidden)

```
❌ gl_journal_entries  — SAP #76, TEGMA
❌ gl_lines            — SAP #76, TEGMA
❌ glLines.cost_center_id — SAP #76 cost_centers FK, TEGMA
```

---

## 4. IZOLYATSIYA MANIFESTI

**FAQAT quyidagi 7 fayl tegiladi. Boshqa fayl kerak bo'lsa — TO'XTA, egaga flag qil:**

| # | Fayl (loyiha ildizidan) | Harakat |
|---|------------------------|---------|
| 1 | `Uzbek-Language-Module/lib/db/src/schema/fi-gl.ts` | `entries` jadvali kengaytirish (cost_center_id + sex_category) — DDL APPROVED: shart |
| 2 | `Uzbek-Language-Module/apps/api/src/modules/finance/infrastructure/repositories/drizzle-gl-posting.repo.ts` | `insertJournal` parametr kengaytirish (cost_center_id, sex_category qo'shish) |
| 3 | `Uzbek-Language-Module/apps/api/src/modules/finance/financial-reports/services/cost-center-gl.service.ts` | YANGI fayl — cost-center GL query service |
| 4 | `Uzbek-Language-Module/apps/api/src/modules/finance/financial-reports/presentation/financial-reports.controller.ts` | Yangi 2 endpoint qo'shish (gl-by-sex, cost-center-report) |
| 5 | `Uzbek-Language-Module/apps/api/src/modules/finance/financial-reports/financial-reports.module.ts` | Yangi service ni register qilish |
| 6 | `Uzbek-Language-Module/apps/api/src/shared/db/migrations/p52-entries-cost-center.sql` | YANGI migration fayl (draft — egasi APPROVED: bergandan keyin qo'llanadi) |
| 7 | `Uzbek-Language-Module/artifacts/erp-dashboard/src/pages/CostCenterGlReport.tsx` | YANGI FE sahifasi — cost-center GL hisobot |

**ddlGate: TRUE** — `entries` jadvali o'zgartirish = kanonik GL jadval.
Q-35: egasi `-- APPROVED: [ism] [sana]` izoh bermasa migration QOLLANMAYDI.

---

## 5. GATED MIGRATION (DRAFT — QOLLASH TAQIQ)

```sql
-- FILE: apps/api/src/shared/db/migrations/p52-entries-cost-center.sql
-- DRAFT — DO NOT RUN until owner stamps: "-- APPROVED: [ism] [sana]" here
-- Vizyon manba: docs/XARITA-REJA-YONALISH-2026-06-07.md §2.3 / EP-FIN-078
-- GL #76: entries jadvali kanonik — org_departments node = cost-center
-- SAP cost_centers jadvali bypass qilinadi (vizyon bo'yicha).

-- APPROVED: [EGASI ISM] [SANA]   ← egasi shu qatorni to'ldiradi, aks holda run TAQIQ

BEGIN;

-- G1: cost_center_id ustuni qo'shish (org_departments.id FK)
ALTER TABLE entries
  ADD COLUMN IF NOT EXISTS cost_center_id INTEGER
    REFERENCES org_departments(id) ON DELETE SET NULL;

-- G2: sex_category ustuni qo'shish (Yondashuv A — egasi tasdiqlaydi)
-- Agar egasi Yondashuv B tanlasa — bu qatorni SKIP qiling.
ALTER TABLE entries
  ADD COLUMN IF NOT EXISTS sex_category VARCHAR(10)
    CONSTRAINT entries_sex_category_chk
    CHECK (sex_category IN ('male', 'female', 'mixed', 'unset'));

-- Index: hisobot query tezligi uchun
CREATE INDEX IF NOT EXISTS idx_entries_cost_center_id
  ON entries(cost_center_id)
  WHERE cost_center_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_entries_sex_category
  ON entries(sex_category)
  WHERE sex_category IS NOT NULL;

-- Index: bo'lim+sana kombinatsiyali hisobot uchun
CREATE INDEX IF NOT EXISTS idx_entries_cc_date
  ON entries(cost_center_id, entry_date)
  WHERE cost_center_id IS NOT NULL;

COMMIT;

-- Rollback (agar kerak bo'lsa):
-- ALTER TABLE entries DROP COLUMN IF EXISTS cost_center_id;
-- ALTER TABLE entries DROP COLUMN IF EXISTS sex_category;
-- DROP INDEX IF EXISTS idx_entries_cost_center_id;
-- DROP INDEX IF EXISTS idx_entries_sex_category;
-- DROP INDEX IF EXISTS idx_entries_cc_date;
```

---

## 6. ISH (QADAM-BAQADAM)

> **BOSHLASHDAN OLDIN:** Egasi §2.7 HARD BOUNDARY bo'yicha qaror berishi kerak.
> Qaror yo'q → bu seksiyani bajarmang. Section 0 EGASI QARORI KERAK blokini ko'rsating.

### QADAM 1 — Re-audit: entries jadvali jonli holat tekshirish

**Maqsad:** entries jadvali live DB da qanday ko'rinishini tekshirish.

**Fayl:** FAQAT o'qish (`_audit/q.cjs` yoki psql):
```sql
-- 1. entries ustunlar ro'yxati:
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'entries'
ORDER BY ordinal_position;

-- 2. entries satrlar soni:
SELECT COUNT(*) FROM entries;

-- 3. org_departments satrlar soni:
SELECT COUNT(*) FROM org_departments;

-- 4. cost_centers satrlar soni:
SELECT COUNT(*) FROM cost_centers;

-- 5. entries.cost_center_id bor-yo'qligini tekshir:
SELECT column_name FROM information_schema.columns
WHERE table_name = 'entries' AND column_name = 'cost_center_id';
-- Agar 0 qator → G1 tasdiqlandi
```

**Natijani egaga ko'rsating. Davom eting faqat egasi ruxsati bilan.**

---

### QADAM 2 — Migration fayli yozish (DRAFT)

**Maqsad:** Migration fayl yoziladi, lekin egasi APPROVED: berguncha `psql` bilan qo'llanmaydi.

**Fayl:** `apps/api/src/shared/db/migrations/p52-entries-cost-center.sql`

Section 5 dagi SQL to'liq ko'chiriladi. `-- APPROVED:` qatori bo'sh qoladi.
Egasi yozuv qo'shadi — shundan keyin `psql -f p52-entries-cost-center.sql` qo'llanadi.

**DB-proof (APPROVED: olgandan keyin):**
```bash
# Migration qo'llaganidan keyin tekshirish:
psql -c "SELECT column_name FROM information_schema.columns
         WHERE table_name='entries' AND column_name IN ('cost_center_id','sex_category');"
# Natija: 2 qator (yoki 1, agar Yondashuv B tanlansa)
```

---

### QADAM 3 — Drizzle Schema Kengaytirish

**Fayl:** `Uzbek-Language-Module/lib/db/src/schema/fi-gl.ts`

**Import qo'shish (fayl boshi, mavjud import'lardan keyin):**
```typescript
// Existing import at line 11:
import { Position, approvalRequests, departments, users } from "./core-schema";
// ADD (after existing imports):
import { orgDepartments } from "./core-schema";
```

> ⚠️ `orgDepartments` allaqachon `core-schema.ts`'dan eksport qilingan (line 294).
> Circular import yo'q: fi-gl.ts → core-schema.ts bir yo'nalishli.

**entries jadvali kengaytirish (`fi-gl.ts:51–73`, ADD-ONLY — mavjud ustunlar O'CHIRILMAYDI):**

```typescript
export const entries = pgTable("entries", {
  id: serial("id").primaryKey(),
  entryNumber: varchar("entry_number", { length: 50 }).notNull().unique(),
  entryDate: varchar("entry_date", { length: 10 }).notNull(),
  documentType: varchar("document_type", { length: 50 }).notNull(),
  documentId: varchar("document_id"),
  debitAccountId: varchar("debit_account_id").references(() => accounts.id, { onDelete: "set null" }),
  creditAccountId: varchar("credit_account_id").references(() => accounts.id, { onDelete: "set null" }),
  amount: numericMoney("amount").notNull(),
  description: text("description"),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  debitAccount: text("debit_account"),
  creditAccount: text("credit_account"),
  referenceId: varchar("reference_id"),
  referenceType: varchar("reference_type", { length: 30 }),
  postedBy: integer("posted_by"),
  postedAt: timestamp("posted_at"),
  currency: varchar("currency", { length: 10 }).notNull().default('UZS'),
  // EP-FIN-078 / GL #76: cost-center (org_departments node) + per-sex tag
  // APPROVED: [egasi sana] — migration p52-entries-cost-center.sql
  costCenterId: integer("cost_center_id").references(() => orgDepartments.id, { onDelete: "set null" }),
  sexCategory: varchar("sex_category", { length: 10 }),
}, (t) => [
  check("entries_amount_chk", sql`${t.amount} > 0`),
  // EP-FIN-078 sex_category constraint (mirrors migration CHECK):
  check("entries_sex_cat_chk", sql`${t.sexCategory} IS NULL OR ${t.sexCategory} IN ('male','female','mixed','unset')`),
]);
```

**Verify:** `tsc` — 0 xato. `lib/db` build o'tishi kerak.

---

### QADAM 4 — insertJournal Kengaytirish

**Fayl:** `apps/api/src/modules/finance/infrastructure/repositories/drizzle-gl-posting.repo.ts`

**Maqsad:** `insertJournal` har qator uchun `costCenterId` va `sexCategory` optional parametr qabul qilsin.

**Oldin (`:72`, insertJournal imzosi):**
```typescript
async insertJournal(rows: Array<{
  entryNumber: string;
  entryDate: string;
  documentType: string;
  documentId?: string;
  debitAccountId: string;
  creditAccountId: string;
  amount: number;
  description?: string;
  createdBy?: number;
}>): Promise<Result<number>> {
```

**Keyin (optional field qo'shish — mavjud parametrlar O'CHIRILMAYDI):**
```typescript
async insertJournal(rows: Array<{
  entryNumber: string;
  entryDate: string;
  documentType: string;
  documentId?: string;
  debitAccountId: string;
  creditAccountId: string;
  amount: number;
  description?: string;
  createdBy?: number;
  // EP-FIN-078 / GL #76: optional cost-center + sex tag
  costCenterId?: number | null;
  sexCategory?: 'male' | 'female' | 'mixed' | 'unset' | null;
}>): Promise<Result<number>> {
```

**Transaction blokida insertValues kengaytirish (`:95–113` atrofida):**

Oldin:
```typescript
const insertValues: typeof entries.$inferInsert = {
  entryNumber: row.entryNumber,
  entryDate: row.entryDate,
  documentType: row.documentType,
  documentId: row.documentId ?? null,
  debitAccountId: String(idByCode.get(row.debitAccountId)),
  creditAccountId: String(idByCode.get(row.creditAccountId)),
  debitAccount: row.debitAccountId,
  creditAccount: row.creditAccountId,
  amount: row.amount,
  description: row.description ?? null,
  createdBy: row.createdBy ?? null,
};
```

Keyin (ADD-ONLY — mavjud maydonlar O'CHIRILMAYDI):
```typescript
const insertValues: typeof entries.$inferInsert = {
  entryNumber: row.entryNumber,
  entryDate: row.entryDate,
  documentType: row.documentType,
  documentId: row.documentId ?? null,
  debitAccountId: String(idByCode.get(row.debitAccountId)),
  creditAccountId: String(idByCode.get(row.creditAccountId)),
  debitAccount: row.debitAccountId,
  creditAccount: row.creditAccountId,
  amount: row.amount,
  description: row.description ?? null,
  createdBy: row.createdBy ?? null,
  // EP-FIN-078 / GL #76: cost-center + sex tag (optional — null if caller doesn't provide)
  costCenterId: row.costCenterId ?? null,
  sexCategory: row.sexCategory ?? null,
};
```

**Verify:** `tsc 0` — TypeScript `$inferInsert` tip o'zgarishi xatolarni ko'rsatadi,
ularni to'g'irlang. Mavjud callerlar optional `costCenterId`/`sexCategory` bermagani uchun
backward-compatible (ular null bo'ladi).

---

### QADAM 5 — Cost-Center GL Query Service (yangi fayl)

**Fayl:** `apps/api/src/modules/finance/financial-reports/services/cost-center-gl.service.ts`

```typescript
/**
 * @module cost-center-gl.service
 * @description Cost-center (org_departments node) va per-sex GL hisobot service.
 * EP-FIN-078 / GL #76 vizyon: entries.cost_center_id → org_departments.id.
 * Raw SQL: Drizzle ORM CASE-WHEN + multi-GROUP-BY conditional aggregate ifoda qilolmaydi.
 * @layer Application (Finance / Financial-Reports)
 */

import { Injectable, Logger } from '@nestjs/common';
import { Result, Ok, Err, AppErr } from '@common/result';
import { runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CostCenterGlRow {
  costCenterId: number | null;
  departmentName: string;
  departmentLevel: number;
  totalDebit: number;
  totalCredit: number;
  balance: number;
  entryCount: number;
}

export interface GlBySexRow {
  costCenterId: number | null;
  departmentName: string;
  sexCategory: string;
  totalDebit: number;
  totalCredit: number;
  entryCount: number;
}

export interface CostCenterGlReportResult {
  dateFrom: string;
  dateTo: string;
  departments: CostCenterGlRow[];
  grandTotalDebit: number;
  grandTotalCredit: number;
  uncategorised: { totalDebit: number; totalCredit: number; entryCount: number };
}

export interface GlBySexReportResult {
  dateFrom: string;
  dateTo: string;
  rows: GlBySexRow[];
  summary: { male: number; female: number; mixed: number; unset: number };
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class CostCenterGlService {
  private readonly logger = new Logger(CostCenterGlService.name);

  /**
   * EP-FIN-078: Bo'lim bo'yicha GL yig'indisi (cost-center hisobot).
   * Har org_departments node uchun debet/kredit yig'indisi va balans.
   * cost_center_id NULL bo'lgan entries "Tasniflanmagan" guruhiga tushadi.
   *
   * Raw SQL: GROUP BY + LEFT JOIN + COALESCE kombinatsiyasi Drizzle'da
   * type-safe ifodalanmaydi — Q-4 exception, izoh bilan.
   */
  async getCostCenterReport(
    dateFrom: string,
    dateTo: string,
    costCenterId?: number,
  ): Promise<Result<CostCenterGlReportResult>> {
    try {
      // Validate dates (Zod done at controller — double-check here)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateFrom) || !/^\d{4}-\d{2}-\d{2}$/.test(dateTo)) {
        return Err(AppErr('VALIDATION', 'dateFrom va dateTo YYYY-MM-DD formatida bo\'lishi kerak'));
      }
      if (dateFrom > dateTo) {
        return Err(AppErr('VALIDATION', 'dateFrom dateTo dan kichik bo\'lishi kerak'));
      }

      // Optional: filter by specific cost center
      const ccFilter = costCenterId
        ? sql`AND e.cost_center_id = ${costCenterId}`
        : sql``;

      const res = await runQuery<{
        cost_center_id: number | null;
        department_name: string | null;
        department_level: number | null;
        total_debit: string;
        total_credit: string;
        entry_count: string;
      }>(sql`
        SELECT
          e.cost_center_id,
          od.name        AS department_name,
          od.level       AS department_level,
          COALESCE(SUM(e.amount::numeric), 0)::text AS total_debit,
          COALESCE(SUM(e.amount::numeric), 0)::text AS total_credit,
          COUNT(*)::text AS entry_count
        FROM entries e
        LEFT JOIN org_departments od ON od.id = e.cost_center_id
        WHERE e.entry_date BETWEEN ${dateFrom} AND ${dateTo}
          ${ccFilter}
        GROUP BY e.cost_center_id, od.name, od.level
        ORDER BY od.level NULLS LAST, od.name
      `);

      const rows = Array.isArray(res.rows) ? res.rows : [];

      let grandTotalDebit = 0;
      let grandTotalCredit = 0;
      const uncategorised = { totalDebit: 0, totalCredit: 0, entryCount: 0 };

      const departments: CostCenterGlRow[] = rows.map((r) => {
        const totalDebit  = Number(r.total_debit ?? 0);
        const totalCredit = Number(r.total_credit ?? 0);
        grandTotalDebit  += totalDebit;
        grandTotalCredit += totalCredit;
        if (r.cost_center_id === null) {
          uncategorised.totalDebit  += totalDebit;
          uncategorised.totalCredit += totalCredit;
          uncategorised.entryCount  += Number(r.entry_count ?? 0);
        }
        return {
          costCenterId: r.cost_center_id,
          departmentName: r.department_name ?? 'Tasniflanmagan',
          departmentLevel: Number(r.department_level ?? 0),
          totalDebit,
          totalCredit,
          balance: totalDebit - totalCredit,
          entryCount: Number(r.entry_count ?? 0),
        };
      });

      return Ok({
        dateFrom,
        dateTo,
        departments,
        grandTotalDebit,
        grandTotalCredit,
        uncategorised,
      });
    } catch (e: unknown) {
      this.logger.error(`getCostCenterReport: ${String(e)}`);
      return Err(AppErr('DB_ERROR', `Cost-center hisobot xatosi: ${String(e)}`));
    }
  }

  /**
   * GL #76: Jins (sex) bo'yicha GL yig'indisi.
   * entries.sex_category bo'yicha guruhlanadi, org_departments JOIN bilan.
   * Natija: har bo'lim × har jins kombinatsiyasi uchun debet/kredit.
   *
   * Raw SQL: conditional GROUP BY + NULL handling — Q-4 exception.
   */
  async getGlBySex(
    dateFrom: string,
    dateTo: string,
    costCenterId?: number,
  ): Promise<Result<GlBySexReportResult>> {
    try {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateFrom) || !/^\d{4}-\d{2}-\d{2}$/.test(dateTo)) {
        return Err(AppErr('VALIDATION', 'dateFrom va dateTo YYYY-MM-DD formatida bo\'lishi kerak'));
      }

      const ccFilter = costCenterId
        ? sql`AND e.cost_center_id = ${costCenterId}`
        : sql``;

      const res = await runQuery<{
        cost_center_id: number | null;
        department_name: string | null;
        sex_category: string | null;
        total_debit: string;
        total_credit: string;
        entry_count: string;
      }>(sql`
        SELECT
          e.cost_center_id,
          od.name                         AS department_name,
          COALESCE(e.sex_category, 'unset') AS sex_category,
          COALESCE(SUM(e.amount::numeric), 0)::text AS total_debit,
          COALESCE(SUM(e.amount::numeric), 0)::text AS total_credit,
          COUNT(*)::text AS entry_count
        FROM entries e
        LEFT JOIN org_departments od ON od.id = e.cost_center_id
        WHERE e.entry_date BETWEEN ${dateFrom} AND ${dateTo}
          ${ccFilter}
        GROUP BY e.cost_center_id, od.name, COALESCE(e.sex_category, 'unset')
        ORDER BY od.name NULLS LAST, sex_category
      `);

      const rows = Array.isArray(res.rows) ? res.rows : [];

      const summary = { male: 0, female: 0, mixed: 0, unset: 0 };
      const mapped: GlBySexRow[] = rows.map((r) => {
        const cat = (r.sex_category ?? 'unset') as keyof typeof summary;
        const debit = Number(r.total_debit ?? 0);
        if (cat in summary) summary[cat] += debit;
        return {
          costCenterId: r.cost_center_id,
          departmentName: r.department_name ?? 'Tasniflanmagan',
          sexCategory: r.sex_category ?? 'unset',
          totalDebit: debit,
          totalCredit: Number(r.total_credit ?? 0),
          entryCount: Number(r.entry_count ?? 0),
        };
      });

      return Ok({ dateFrom, dateTo, rows: mapped, summary });
    } catch (e: unknown) {
      this.logger.error(`getGlBySex: ${String(e)}`);
      return Err(AppErr('DB_ERROR', `GL jins hisobot xatosi: ${String(e)}`));
    }
  }

  /**
   * Bitta cost-center (org_departments node) uchun joriy balans.
   * Barcha vaqt bo'yicha (date filter yo'q) debet/kredit yig'indisi.
   */
  async getCostCenterBalance(costCenterId: number): Promise<Result<{
    costCenterId: number;
    departmentName: string;
    totalDebit: number;
    totalCredit: number;
    balance: number;
    lastEntryDate: string | null;
  }>> {
    try {
      if (!Number.isInteger(costCenterId) || costCenterId <= 0) {
        return Err(AppErr('VALIDATION', 'costCenterId musbat butun son bo\'lishi kerak'));
      }

      const res = await runQuery<{
        department_name: string | null;
        total_debit: string;
        total_credit: string;
        last_entry_date: string | null;
      }>(sql`
        SELECT
          od.name                          AS department_name,
          COALESCE(SUM(e.amount::numeric), 0)::text AS total_debit,
          COALESCE(SUM(e.amount::numeric), 0)::text AS total_credit,
          MAX(e.entry_date)                AS last_entry_date
        FROM entries e
        LEFT JOIN org_departments od ON od.id = e.cost_center_id
        WHERE e.cost_center_id = ${costCenterId}
        GROUP BY od.name
      `);

      const row = Array.isArray(res.rows) ? res.rows[0] : undefined;
      if (!row) {
        return Err(AppErr('NOT_FOUND', `Cost-center #${costCenterId} uchun GL yozuvi topilmadi`));
      }

      const totalDebit  = Number(row.total_debit ?? 0);
      const totalCredit = Number(row.total_credit ?? 0);
      return Ok({
        costCenterId,
        departmentName: row.department_name ?? 'Noma\'lum bo\'lim',
        totalDebit,
        totalCredit,
        balance: totalDebit - totalCredit,
        lastEntryDate: row.last_entry_date ?? null,
      });
    } catch (e: unknown) {
      this.logger.error(`getCostCenterBalance(${costCenterId}): ${String(e)}`);
      return Err(AppErr('DB_ERROR', `Balans xatosi: ${String(e)}`));
    }
  }
}
```

---

### QADAM 6 — Controller Endpointlari

**Fayl:** `apps/api/src/modules/finance/financial-reports/presentation/financial-reports.controller.ts`

**Import qo'shish (fayl boshiga mavjud importlar orasiga):**
```typescript
import { CostCenterGlService } from '../services/cost-center-gl.service';
```

**Constructor'ga inject qo'shish:**
```typescript
constructor(
  private readonly query: FinancialReportsQueryService,
  private readonly analytics: FinancialReportsAnalyticsService,
  private readonly dailyCron: FinancialReportsDailyCron,
  private readonly costCenterGl: CostCenterGlService,  // EP-FIN-078 / GL #76
) {}
```

**Yangi endpointlar (controller oxiriga qo'shish):**

```typescript
// ─── EP-FIN-078: Cost-center GL hisobot ────────────────────────────────────

private readonly CostCenterQuerySchema = z.object({
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD formatida bo\'lishi kerak'),
  dateTo:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD formatida bo\'lishi kerak'),
  costCenterId: z.coerce.number().int().positive().optional(),
});

@ApiOperation({ summary: 'EP-FIN-078: Cost-center (bo\'lim) bo\'yicha GL hisobot' })
@ApiResponse({ status: 200, description: 'OK' })
@ApiResponse({ status: 400, description: 'Sana formati noto\'g\'ri' })
@Get('cost-center-report')
async getCostCenterReport(@Query() rawQuery: unknown) {
  const dto = this.CostCenterQuerySchema.parse(rawQuery);
  const result = await this.costCenterGl.getCostCenterReport(
    dto.dateFrom,
    dto.dateTo,
    dto.costCenterId,
  );
  return unwrapOrInternal(result);
}

// ─── GL #76: Per-sex GL hisobot ────────────────────────────────────────────

@ApiOperation({ summary: 'GL #76: Jins (sex) bo\'yicha GL hisobot' })
@ApiResponse({ status: 200, description: 'OK' })
@ApiResponse({ status: 400, description: 'Sana formati noto\'g\'ri' })
@Get('gl-by-sex')
async getGlBySex(@Query() rawQuery: unknown) {
  const dto = this.CostCenterQuerySchema.parse(rawQuery);
  const result = await this.costCenterGl.getGlBySex(
    dto.dateFrom,
    dto.dateTo,
    dto.costCenterId,
  );
  return unwrapOrInternal(result);
}

// ─── Cost-center balans (bitta bo'lim) ──────────────────────────────────────

@ApiOperation({ summary: 'EP-FIN-078: Bitta cost-center balans' })
@ApiResponse({ status: 200, description: 'OK' })
@ApiResponse({ status: 404, description: 'Topilmadi' })
@Get('cost-center-balance/:id')
async getCostCenterBalance(@Param('id') id: string) {
  const costCenterId = parseInt(id, 10);
  if (!Number.isInteger(costCenterId) || costCenterId <= 0) {
    throw new BadRequestException('ID musbat butun son bo\'lishi kerak');
  }
  const result = await this.costCenterGl.getCostCenterBalance(costCenterId);
  return unwrapOrInternal(result);
}
```

**Import qo'shish (agar yo'q bo'lsa):**
```typescript
import { z } from 'zod';
import { Param, BadRequestException } from '@nestjs/common';
```

---

### QADAM 7 — Module Registration

**Fayl:** `apps/api/src/modules/finance/financial-reports/financial-reports.module.ts`

**Mavjud modulni o'qing.** Keyin `CostCenterGlService` ni providers ro'yxatiga qo'shing:

```typescript
// Import qo'shish:
import { CostCenterGlService } from './services/cost-center-gl.service';

// @Module providers ga qo'shish:
providers: [
  // ... mavjud providers (O'CHIMAYDI)
  CostCenterGlService,  // EP-FIN-078 / GL #76
],
exports: [
  // ... mavjud exports (O'CHIMAYDI)
  CostCenterGlService,
],
```

---

### QADAM 8 — Frontend Sahifasi (FE)

**Fayl:** `artifacts/erp-dashboard/src/pages/CostCenterGlReport.tsx`

Bu yangi sahifa. EP Linear Soft design system, `ListPage` shablon, `var(--mod-fin-*)` tokenlar.

```tsx
/**
 * @page CostCenterGlReport
 * @description EP-FIN-078 / GL #76: Cost-center (bo'lim) bo'yicha GL hisobot
 * va jins bo'yicha GL segmentatsiya sahifasi.
 * Template: ListPage (existing pattern)
 * Design: EP Linear Soft, var(--mod-fin-*) tokenlar
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api-request';
import { EPPageHeader } from '@/components/ep/EPPageHeader';
import { EPCard } from '@/components/ep/EPCard';
import { EPKpiCard } from '@/components/ep/EPKpiCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from 'react-i18next';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CostCenterGlRow {
  costCenterId: number | null;
  departmentName: string;
  departmentLevel: number;
  totalDebit: number;
  totalCredit: number;
  balance: number;
  entryCount: number;
}

interface GlBySexRow {
  costCenterId: number | null;
  departmentName: string;
  sexCategory: string;
  totalDebit: number;
  totalCredit: number;
  entryCount: number;
}

interface CostCenterReport {
  dateFrom: string;
  dateTo: string;
  departments: CostCenterGlRow[];
  grandTotalDebit: number;
  grandTotalCredit: number;
  uncategorised: { totalDebit: number; totalCredit: number; entryCount: number };
}

interface GlBySexReport {
  dateFrom: string;
  dateTo: string;
  rows: GlBySexRow[];
  summary: { male: number; female: number; mixed: number; unset: number };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMoney(n: number): string {
  return new Intl.NumberFormat('uz-UZ', { style: 'decimal', minimumFractionDigits: 0 }).format(n) + ' so\'m';
}

function sexBadgeColor(cat: string): string {
  const map: Record<string, string> = {
    male: 'bg-blue-100 text-blue-800',
    female: 'bg-pink-100 text-pink-800',
    mixed: 'bg-purple-100 text-purple-800',
    unset: 'bg-gray-100 text-gray-600',
  };
  return map[cat] ?? 'bg-gray-100 text-gray-600';
}

function sexLabel(cat: string): string {
  const map: Record<string, string> = {
    male: 'Erkak',
    female: 'Ayol',
    mixed: 'Aralash',
    unset: 'Belgilanmagan',
  };
  return map[cat] ?? cat;
}

// ─── Page Component ───────────────────────────────────────────────────────────

export function CostCenterGlReport() {
  const today = new Date().toISOString().slice(0, 10);
  const firstOfMonth = today.slice(0, 8) + '01';

  const [dateFrom, setDateFrom] = useState(firstOfMonth);
  const [dateTo, setDateTo] = useState(today);
  const [applied, setApplied] = useState({ dateFrom: firstOfMonth, dateTo: today });

  const handleApply = () => {
    setApplied({ dateFrom, dateTo });
  };

  // ─ Cost-center hisobot query ──────────────────────────────────────────────
  const ccQuery = useQuery<CostCenterReport>({
    queryKey: ['/api/financial-reports/cost-center-report', applied.dateFrom, applied.dateTo],
    queryFn: async () => {
      const res = await apiRequest(
        'GET',
        `/api/financial-reports/cost-center-report?dateFrom=${applied.dateFrom}&dateTo=${applied.dateTo}`,
      );
      return res as CostCenterReport;
    },
    enabled: !!applied.dateFrom && !!applied.dateTo,
  });

  // ─ GL-by-sex query ────────────────────────────────────────────────────────
  const sexQuery = useQuery<GlBySexReport>({
    queryKey: ['/api/financial-reports/gl-by-sex', applied.dateFrom, applied.dateTo],
    queryFn: async () => {
      const res = await apiRequest(
        'GET',
        `/api/financial-reports/gl-by-sex?dateFrom=${applied.dateFrom}&dateTo=${applied.dateTo}`,
      );
      return res as GlBySexReport;
    },
    enabled: !!applied.dateFrom && !!applied.dateTo,
  });

  const ccData = ccQuery.data;
  const sexData = sexQuery.data;
  const departments = Array.isArray(ccData?.departments) ? ccData.departments : [];
  const sexRows = Array.isArray(sexData?.rows) ? sexData.rows : [];
  const summary = sexData?.summary ?? { male: 0, female: 0, mixed: 0, unset: 0 };

  return (
    <div className="space-y-6">
      <EPPageHeader
        title="Cost-Center GL Hisobot"
        subtitle="Bo'lim va jins bo'yicha GL yozuvlari (EP-FIN-078 / GL #76)"
        breadcrumbs={[
          { label: 'Moliya', href: '/finance' },
          { label: 'Hisobotlar', href: '/finance/reports' },
          { label: 'Cost-Center' },
        ]}
      />

      {/* Filter qator */}
      <EPCard className="p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Boshlanish sana</label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-40"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Tugash sana</label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-40"
            />
          </div>
          <Button onClick={handleApply} style={{ background: 'var(--mod-fin-accent)' }}>
            Qo'llash
          </Button>
        </div>
      </EPCard>

      {/* KPI kartalari */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <EPKpiCard
          label="Jami Debet"
          value={ccQuery.isLoading ? '—' : formatMoney(ccData?.grandTotalDebit ?? 0)}
          trend={undefined}
        />
        <EPKpiCard
          label="Jami Kredit"
          value={ccQuery.isLoading ? '—' : formatMoney(ccData?.grandTotalCredit ?? 0)}
          trend={undefined}
        />
        <EPKpiCard
          label="Erkak / Ayol xarajat"
          value={sexQuery.isLoading ? '—' : `${formatMoney(summary.male)} / ${formatMoney(summary.female)}`}
          trend={undefined}
        />
      </div>

      {/* Ikki tab: Bo'lim hisobot | Jins hisobot */}
      <Tabs defaultValue="departments">
        <TabsList>
          <TabsTrigger value="departments">Bo'lim bo'yicha</TabsTrigger>
          <TabsTrigger value="sex">Jins bo'yicha (GL #76)</TabsTrigger>
        </TabsList>

        {/* Bo'lim tab */}
        <TabsContent value="departments">
          <EPCard>
            {ccQuery.isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : ccQuery.isError ? (
              <p className="text-destructive p-4">Xatolik yuz berdi. Qaytadan urinib ko'ring.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bo'lim</TableHead>
                    <TableHead>Daraja</TableHead>
                    <TableHead className="text-right">Debet</TableHead>
                    <TableHead className="text-right">Kredit</TableHead>
                    <TableHead className="text-right">Balans</TableHead>
                    <TableHead className="text-right">Yozuvlar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Ushbu davr uchun ma'lumot yo'q
                      </TableCell>
                    </TableRow>
                  ) : (
                    departments.map((row, i) => (
                      <TableRow key={`${row.costCenterId ?? 'null'}-${i}`}>
                        <TableCell>
                          <span
                            style={{ paddingLeft: `${row.departmentLevel * 16}px` }}
                            className="inline-block"
                          >
                            {row.departmentName}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">L{row.departmentLevel}</TableCell>
                        <TableCell className="text-right font-mono">{formatMoney(row.totalDebit)}</TableCell>
                        <TableCell className="text-right font-mono">{formatMoney(row.totalCredit)}</TableCell>
                        <TableCell className={`text-right font-mono ${row.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatMoney(row.balance)}
                        </TableCell>
                        <TableCell className="text-right">{row.entryCount}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </EPCard>
        </TabsContent>

        {/* Jins tab (GL #76) */}
        <TabsContent value="sex">
          <EPCard>
            {/* Summary satri */}
            {!sexQuery.isLoading && (
              <div className="flex gap-2 flex-wrap p-4 border-b">
                {(['male', 'female', 'mixed', 'unset'] as const).map((cat) => (
                  <span key={cat} className={`px-2 py-1 rounded text-xs font-medium ${sexBadgeColor(cat)}`}>
                    {sexLabel(cat)}: {formatMoney(summary[cat])}
                  </span>
                ))}
              </div>
            )}

            {sexQuery.isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : sexQuery.isError ? (
              <p className="text-destructive p-4">Xatolik yuz berdi.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bo'lim</TableHead>
                    <TableHead>Jins</TableHead>
                    <TableHead className="text-right">Debet</TableHead>
                    <TableHead className="text-right">Kredit</TableHead>
                    <TableHead className="text-right">Yozuvlar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sexRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        Ushbu davr uchun ma'lumot yo'q
                      </TableCell>
                    </TableRow>
                  ) : (
                    sexRows.map((row, i) => (
                      <TableRow key={`${row.costCenterId ?? 'null'}-${row.sexCategory}-${i}`}>
                        <TableCell>{row.departmentName}</TableCell>
                        <TableCell>
                          <Badge className={sexBadgeColor(row.sexCategory)}>
                            {sexLabel(row.sexCategory)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">{formatMoney(row.totalDebit)}</TableCell>
                        <TableCell className="text-right font-mono">{formatMoney(row.totalCredit)}</TableCell>
                        <TableCell className="text-right">{row.entryCount}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </EPCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default CostCenterGlReport;
```

---

## 7. SELF-VERIFY (QABUL MEZONLARI)

Har qadam bajarilgandan keyin tekshiring:

### 7.1 Tsc tekshiruv
```bash
# Backend:
pnpm --filter @europrint/api run typecheck
# Frontend:
pnpm --filter erp-dashboard run typecheck
# lib/db:
pnpm --filter @workspace/db run build
```
Natija: 0 xato.

### 7.2 Migration DB-proof (faqat APPROVED: olgandan keyin)
```bash
# Migration qo'llash:
psql -d europrint -f apps/api/src/shared/db/migrations/p52-entries-cost-center.sql

# Tekshirish — yangi ustunlar mavjudmi:
psql -d europrint -c "
  SELECT column_name, data_type
  FROM information_schema.columns
  WHERE table_name = 'entries'
    AND column_name IN ('cost_center_id', 'sex_category')
  ORDER BY column_name;
"
# Natija: 2 qator (yoki 1, agar sex_category skip)
```

### 7.3 Endpoint probe
```bash
# Backend ishga tushirilgandan keyin:
TOKEN="..."  # login orqali oling

# Cost-center hisobot:
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3030/api/financial-reports/cost-center-report?dateFrom=2026-01-01&dateTo=2026-06-30"
# Natija: { dateFrom, dateTo, departments: [...], grandTotalDebit, grandTotalCredit }

# GL-by-sex hisobot:
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3030/api/financial-reports/gl-by-sex?dateFrom=2026-01-01&dateTo=2026-06-30"
# Natija: { dateFrom, dateTo, rows: [...], summary: { male, female, mixed, unset } }
```

### 7.4 insertJournal kengaytma DB-proof
```bash
# Test: cost_center_id bilan insertJournal chaqirish
# Testdan keyin entries jadvalida cost_center_id NULL EMAS qatorlar ko'rinishi kerak:
psql -d europrint -c "
  SELECT id, entry_number, cost_center_id, sex_category
  FROM entries
  WHERE cost_center_id IS NOT NULL
  ORDER BY id DESC
  LIMIT 5;
"
```

### 7.5 FE round-trip
1. Browser: `http://localhost:20806/finance/cost-center-report`
2. Sana filtrlari o'rnatish → "Qo'llash" tugmasi bosish
3. Jadval yuklangandan keyin: Bo'lim bo'yicha tab ma'lumot ko'rsatishi kerak
4. "Jins bo'yicha" tab: erkak/ayol/aralash/belgilanmagan Badge'lar ko'rinishi kerak

### 7.6 Reviewer skriptlar
```bash
bash scripts/reviewer-result-pattern.sh   # 0 FAIL saqlanishi kerak
bash scripts/reviewer-array-safety.sh      # 0 FAIL saqlanishi kerak
bash scripts/reviewer-jwt-guard.sh         # 0 FAIL
```

---

## 8. DoD (QABUL SHARTLARI)

Barcha 6 shart o'tishi kerak:

| # | Shart | Tekshiruv usuli |
|---|-------|----------------|
| D1 | `entries.cost_center_id` live DB da mavjud | `psql` column query → 1 qator |
| D2 | `insertJournal` optional `costCenterId` qabul qiladi, DB ga yozadi | DB-proof: cost_center_id bilan insert → `SELECT` da ko'rinadi |
| D3 | `GET /api/financial-reports/cost-center-report` real data qaytaradi | curl → 200, `departments` array bo'sh emas (agar entries mavjud) |
| D4 | `GET /api/financial-reports/gl-by-sex` real data qaytaradi | curl → 200, `summary` 4 kalit bor |
| D5 | FE `CostCenterGlReport.tsx` render bo'ladi, tab ishlaydi | Browser → sahifa yuklanadi, 2 tab ko'rinadi |
| D6 | tsc 0 BE + FE + lib/db | `pnpm run typecheck` → 0 xato |

---

## 9. COMMIT TARTIBI

```bash
# Qadam 1: Migration fayl
git add apps/api/src/shared/db/migrations/p52-entries-cost-center.sql
git commit -m "feat(fin): p52 GL#76 cost-center migration draft (egasi APPROVED: kutilmoqda)"

# Qadam 2: Schema kengaytma (egasi APPROVED: bergandan keyin migration qo'llangandan keyin)
git add lib/db/src/schema/fi-gl.ts
git commit -m "feat(fin): p52 entries.cost_center_id + sex_category Drizzle schema (EP-FIN-078)"

# Qadam 3: insertJournal kengaytma
git add apps/api/src/modules/finance/infrastructure/repositories/drizzle-gl-posting.repo.ts
git commit -m "feat(fin): p52 insertJournal optional cost_center_id + sex_category (GL #76)"

# Qadam 4: Yangi service + controller + module
git add apps/api/src/modules/finance/financial-reports/services/cost-center-gl.service.ts
git add apps/api/src/modules/finance/financial-reports/presentation/financial-reports.controller.ts
git add apps/api/src/modules/finance/financial-reports/financial-reports.module.ts
git commit -m "feat(fin): p52 cost-center GL service + endpoints (EP-FIN-078 / GL #76)"

# Qadam 5: FE sahifasi
git add artifacts/erp-dashboard/src/pages/CostCenterGlReport.tsx
git commit -m "feat(fin): p52 CostCenterGlReport FE sahifasi (EP-FIN-078 / GL #76)"
```

`git add -A` yoki `git add .` TAQIQ — faqat aniq fayllar.

---

## 10. HOLAT HISOBOTI SHABLONI (Egaga Uzbek lotin)

Har qadam bajarilgandan keyin egaga yuboring:

```
P52 HOLAT HISOBOTI — [qadam nomi]

✅ Nima qilindi:
- [aniq bajarilgan narsa]

📊 DB isboti:
- [psql natijasi yoki curl natijasi]

🔍 tsc holati:
- BE: 0 xato / FE: 0 xato / lib/db: build PASS

📋 Yopilgan vizyon qoidalar:
- EP-FIN-078 (cost-center hisobot) — [holat: qisman/to'liq]
- GL #76 per-sex (§2.3) — [holat: qisman/to'liq]

⏭️ Keyingi qadam:
- [faqat egasi ruxsati bilan]
```

---

## XULOSA

Bu P52 paket ikki kanonik vizyon talabini yopadi:

1. **EP-FIN-078** (§2.3): `entries.cost_center_id → org_departments.id` FK orqali har GL yozuvi
   aniq bo'limga bog'lanadi. `getCostCenterReport()` — bo'lim bo'yicha debet/kredit hisobot.

2. **GL #76** (§2.3 [Q3]): `entries.sex_category` orqali payroll/bonus yozuvlari jins bo'yicha
   teglanadi. `getGlBySex()` — erkak/ayol/aralash/belgilanmagan xarajat hisobot.

**DDL DARVOZASI qo'llanadi** — `entries` kanonik jadval, har qanday ALTER = egasi APPROVED: shart.
**SAP #76 chegarasi qo'llanadi** — `gl_journal_entries` va `gl_lines` tegitilmaydi.
**Wave 2** — P24 commitdan keyin boshlanadi.
