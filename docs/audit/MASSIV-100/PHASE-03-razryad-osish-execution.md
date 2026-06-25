# PHASE 03 — RAZRYAD O'SISH / PASAYISH EXECUTION (Bajaruvchi direktivasi — Muslimbek)

> **Direktiva turi:** BAJARUVCHI-AGENT (Muslimbek) uchun to'liq, batafsil ijro hujjati (Q-47 ≥1000 qator).
> **Faza:** MASSIV-100 → FAZA 03 (`00-MASTER-REJA.md` §3 FAZA 3).
> **Bog'liqlik:** FAZA 0 (kanonik karta = `org_departments`) + FAZA 1 (`employee_cards` M:N) + FAZA 2 (login/RBAC kartadan) BAJARILGAN deb taxmin qilinadi. Agar ular hali bajarilmagan bo'lsa — `razryad_history.employee_id` FK `employee_cards`'dan emas, to'g'ridan-to'g'ri `employees`/`users`'dan olinadi (quyida edge-holatda izohlangan).
> **Manba-spec:** `decisions/01-org-kartalar.md` EP-ORG-008..013, EP-ORG-043..056, EP-ORG-091, EP-ORG-092; `ORGSXEMA-INTERVYU-VS-HOLAT-2026-06-25.md` (razryad mavzusi 38% mos).
> **Rol:** 🟢 BAJARUVCHI (ruxsat darvozasi). Bu direktiva = egasi-tasdiqlangan ish ko'lami. Ko'lam ICHIDA o'zboshimcha kengaytirish YO'Q (Q-28, no-scope-creep).

---

## § 0. ATAMALAR (KARTA terminologiyasi — majburiy)

- **KARTA** = org-tuzilma elementi = `org_departments` jadvalidagi qator (node EMAS — muloqotda doim "karta"). Egasi qoidasi: "karta degani bu node".
- **RAZRYAD** = kartaning malaka-darajasi (`razryad_levels` master-data); kartaga `org_departments.razryad_level_id` orqali biriktiriladi.
- **O'SISH (повышение)** = kartaning razryad darajasi yuqoriroq darajaga ko'tarilishi (imtihon → 2-imzo tasdiq → UPDATE).
- **PASAYISH (понижение)** = kartaning razryad darajasi pastroqqa tushirilishi (HR + rahbar + sabab).
- **2-IMZO TASDIQ** = razryad o'zgarishi uchun ikki tasdiq talab qilinadi: (1) HR (`hr_manager`), (2) bevosita rahbar (kartaning ota-kartasining `head_user_id` — `getDirectManager` zanjiridan). Egasi modeli (EP-ORG-010): "Imtihon o'tadi → HR + yuqori rahbar tasdiq → razryad o'zgaradi".
- **3-OY GUARD** = ikki razryad o'zgarishi orasida minimal oraliq (EP-ORG-011: ≥3 oy). Manba: `razryad_levels.min_months` + `razryad_history`'dan oxirgi o'zgarish sanasi.
- **ICHKI SERTIFIKAT** = razryad o'zgarsa avtomatik yoziladigan hujjat (EP-ORG-013): "Razryad o'zgarsa HR hujjati + ichki sertifikat majburiy".

---

## § 1. KONTEKST VA MAQSAD

### 1.1 Vizyon (egasi modeli)
EP-ORG-008..013 + EP-ORG-091 zanjiri: **razryad → talab → o'sish → oylik**. Razryad faqat statik master-data EMAS — u **dinamik** bo'lishi kerak:

1. Xodim (kartaga biriktirilgan) imtihon topshiradi.
2. Imtihon o'tadi (`exam_pass_threshold`'dan yuqori ball).
3. HR + bevosita rahbar 2-imzo tasdiqlaydi.
4. Oxirgi razryad o'zgarishidan ≥3 oy o'tgan bo'lsa (EP-ORG-011).
5. Karta razryadi yuqoriga ko'tariladi (`org_departments.razryad_level_id` UPDATE).
6. O'zgarish `razryad_history`'ga yoziladi (eski/yangi razryad, sabab, kim, qachon, sertifikat).
7. Ichki sertifikat yoziladi (EP-ORG-013).
8. Oylik avtomatik o'zgaradi (FAZA 4 — `coefficient × baza`; bu fazada ULAMAYMIZ, FAZA 4 ulaydi).

Pasayish ham mumkin (EP-ORG-012): HR + rahbar + **majburiy sabab** bilan.

### 1.2 Bu fazaning MAQSADI
Razryad o'sish/pasayish EXECUTION zanjirini **mexanizm darajasida 100%** ishga tushirish (Q2):
- `razryad_history` jadval (audit-immutable, EP-ORG-067/070).
- O'sish-so'rovi workflow: so'rov → imtihon-natija → 2-imzo tasdiq → UPDATE + history + sertifikat.
- 3-oy oraliq guard.
- Pasayish workflow (HR+rahbar+sabab).
- `RazryadTab.tsx`'ga "O'sish so'rovi" + tarix bo'limi.
- **AI faqat TAKLIF** — bu fazada AI o'zi razryad o'zgartirmaydi (AI EXECUTION = FAZA 10). Bu fazada AI-ulanish nuqtasi (placeholder) qoldiriladi.

### 1.3 NIMA YO'Q (ko'lamdan TASHQARI — Q-28)
- Oylik hisoblashga ulash (FAZA 4).
- ЦКП/darslik-gate (FAZA 5/7).
- AI moslik-baho execution (FAZA 10) — bu fazada faqat `ai_suggested` ustun + "AI taklif qildi" badge struktura.
- Attestatsiya cron (EP-ORG-092) — DDL'da `next_attestation_date` ustun qoldiramiz, lekin cron EXECUTION FAZA-keyingisida (bu fazada faqat struktura).
- Imtihon savol-banki UI (EP-ORG-053) — imtihon natijasi `score` raqam sifatida qabul qilinadi; savol-bank UI alohida faza.

---

## § 2. QOIDALAR-BLOKI (har bosqichda MAJBURIY — buzilsa ish RAD)

> Bu blok `00-MASTER-REJA.md` §2 + `CLAUDE.md` (Qoida A,B,1-23 + Q-24..Q-47) dan ko'chirilgan. Har bosqichda amal qil.

### 2.1 Kod uslubi
- **Result<T>** (`@common/result` — `Ok`, `Err`, `Result`, `AppErr`, `safeCall`): har repo/service metodi `Promise<Result<T>>` qaytaradi. `throw new Error()`, `return null`, `return undefined` TAQIQ (Qoida 1).
- **Zod**: har `@Body()`/`@Query()` controller metodi Zod schema bilan `.parse()` qiladi. `class-validator` TAQIQ (Qoida 3). `.strict()` allow-list afzal.
- **Drizzle ORM**: oddiy CRUD = Drizzle. Raw SQL faqat murakkab (cross-module/LATERAL) + izoh bilan (Qoida 4). `sql.raw(variable)` TAQIQ (Qoida B). Parametrlangan `sql\`...\`` ruxsat.
- **Fayl ≤900 qator, funksiya ≤150 qator** (Qoida 13). Razryad history fayllari yangi bo'lsa, mavjud `razryad.*.ts` shablonini ko'chir (mirror CardController/RazryadController).
- **Konstantlar**: magic number TAQIQ (Qoida 12) — `MIN_MONTHS_DEFAULT` kabi qiymatlarni hardcode QILMA; egasi-data NULL bo'lsa gate qaytaradi (fabrikatsiya taqiq).
- **`process.env` TAQIQ** — faqat `ConfigService` (Qoida 7). Bu fazada env kerak emas.
- **Array.isArray()** har `.map/.filter/.reduce/.find` oldidan (Qoida 2).
- **Non-null `!` TAQIQ** (Qoida 9). `as unknown` stub TAQIQ (Qoida 5).

### 2.2 Regress-himoya (Q-39 / Q-46 — egasi qoidasi)
- ✅ Ishlab turgan + to'g'ri kod/funksiya/element **HECH QACHON o'chirilmaydi** (razryad CRUD, RazryadTab mavjud kartochkalar, RazryadLevelsPanel — barchasi QOLADI).
- ❌ Buzuq/o'lik/dublikat kod TO'LIQ o'chiriladi (chala emas). Bu fazada o'chiriladigan narsa YO'Q — faqat QO'SHISH (history jadval, endpoint, FE bo'lim).
- O'chirishdan oldin: Q-29 verify (ishlamasligi) + Q-39 import-yo'qligi tekshir.

### 2.3 Fabrikatsiya TAQIQ (Q-40 / Q2 — 100% = MEXANIZM)
- Data/AI yo'q → **STRUKTURA + GATE** qur, egasi-data ro'yxatiga yoz (§ Owner-DATA).
- SOXTA qiymat YOZMA: `exam_pass_threshold` NULL bo'lsa → "o'tish chegarasi sozlanmagan" deb RAD qaytar (default 60% hardcode QILMA).
- `min_months` NULL bo'lsa → guard "oraliq sozlanmagan" RAD qaytar.
- Imtihon natijasi (`score`) — bu fazada API'dan kelgan qiymat (HR/AI kiritadi). Soxta `score=85` generatsiya QILMA.

### 2.4 Verify (Q-29 / Q-32 / Q-40)
Har faza oxiri:
1. `tsc` GREEN (o'z fayllarda 0 xato).
2. END-TO-END rollback-tx DB-proof (`_audit/bproof-razryad-execution.cjs` — kirit→oqdi→ko'rindi→ROLLBACK).
3. Jonli isbot (HTTP — login → POST so'rov → PATCH tasdiq → GET tarix).
Struktura-only YETARLI EMAS.

### 2.5 Dizayn (Q3, Qoida 21/41/42/43)
- EP token (`var(--ep-*)`) + EP shablon (DetailPage tab) + komponent (`components/ep`, `components/ui`).
- Xom rang / inline-style TAQIQ. RazryadTab'da mavjud `border-amber-400 bg-amber-300/10` pattern — Tailwind semantic class, qoidaga muvofiq (token-bridged). YANGI xom hex QO'SHMA.
- Tab ≤2 daraja. RazryadTab Karta-detal ichidagi tab (1-daraja). Ichida yangi sub-tab QO'SHMA — bo'limlarni `Card` bilan ajrat.
- Har forma REAL saqlaydi (F1 loading / F2 onError + DB INSERT). "O'sish so'rovi" tugmasi → real POST → DB → qayta yuklashda ko'rinadi.

### 2.6 Migration (Q-35)
- `migrations-drift.ts` idempotent: `CREATE TABLE IF NOT EXISTS` / `ALTER ... ADD COLUMN IF NOT EXISTS`.
- `CREATE TABLE` faqat `APPROVED:` izoh bilan (quyida § DB'da izoh tayyor).

### 2.7 Commit (Git_Qoidalari)
- Faqat o'z fayllar: `git add <aniq-fayl>` (HECH QACHON `-A`/`.`).
- `--no-verify` (pre-commit hook bypass, sabab bilan).
- Co-Authored-By: Claude Opus 4.8.
- Har bosqich oxirida commit.

---

## § 3. JORIY HOLAT (fayl:satr + DB-fakt — JONLI tasdiqlangan 2026-06-25)

### 3.1 Backend mavjud fayllar (razryad master-data — QOLADI, regress-himoya)
| Fayl | Holat | Izoh |
|------|-------|------|
| `apps/api/src/modules/org-structure/razryad.controller.ts` | ✅ MAVJUD (100 qator) | `org-structure/razryad-levels` CRUD: GET list / GET :id / POST / PATCH :id / DELETE :id. Roles: admin,manager,hr_manager,director,super_admin. Zod `RazryadCreateSchema` (level/name/coefficient/minMonths/examPassThreshold/maxRetakes/...). |
| `apps/api/src/modules/org-structure/razryad.service.ts` | ✅ MAVJUD (45 qator) | Result<T>, 404 on missing, CONFLICT bubble. |
| `apps/api/src/modules/org-structure/razryad.repository.ts` | ✅ MAVJUD (119 qator) | `razryad_levels` SQL CRUD. `RazryadInput` interface. `isUniqueLevel` 23505 mapper. Soft-delete = `is_active=false`. |
| `apps/api/src/modules/org-structure/org-structure.module.ts` | ✅ MAVJUD (34 qator) | `RazryadController` controllers[]; `RazryadService`/`RazryadRepository` providers[] (satr 30-31). YANGI provider shu yerga qo'shiladi. |

### 3.2 Razryadni kartaga biriktirish (mavjud — QOLADI)
- `apps/api/src/modules/org-structure/org-structure.controller.ts:180` — `@Patch('nodes/:id')` → `UpdateNodeSchema` (satr 59: `razryadLevelId: z.union([z.number().int().positive(), z.null()]).optional()`).
- `apps/api/src/modules/org-structure/org-structure/org-mutations.repo.ts:66` — `applyUnitFields`: `if (dto.razryadLevelId !== undefined) sets.push(sql\`razryad_level_id = ${...}\`)` → `org_departments.razryad_level_id` UPDATE.
- **MUHIM:** hozir razryad **to'g'ridan-to'g'ri PATCH** bilan o'zgaradi (tasdiqsiz, history'siz). Bu fazada bu yo'l QOLADI (admin tezkor o'rnatish uchun), LEKIN yangi **o'sish-so'rovi** workflow tasdiq + history + 3-oy guard bilan ishlaydi. Egasi modeli: dinamik o'sish = workflow orqali; qo'lda PATCH = admin/seed.

### 3.3 Frontend mavjud (QOLADI)
- `artifacts/erp-dashboard/src/components/hr/orgnode/RazryadTab.tsx` (177 qator) — Karta-detal "Razryad" tab. Mavjud:
  - Razryad TANLASH (Select → PATCH `razryadLevelId`).
  - Razryad ma'nosi (koeff/oylik-band/talab/imtihon/sertifikat/keyingi-razryadgacha).
  - "Razryad narvoni" (1→6 o'sish yo'li, joriy razryad amber bilan ajratilgan).
  - Satr 157-159: matn placeholder — "O'sish: imtihon → HR + rahbar tasdig'i → razryad o'zgaradi (≥3 oy oraliq). **Tasdiq-zanjir keyingi bosqichda.**" → BU FAZADA real bo'limga almashtiriladi.
  - "Darajalarni sozlash" dialog → `RazryadLevelsPanel`.
- `artifacts/erp-dashboard/src/components/hr/org/RazryadLevelsPanel.tsx` — master-data CRUD panel (QOLADI).

### 3.4 DB JONLI fakt (`node _audit/q.cjs` bilan tasdiqlangan, READ ONLY tx)
| Fakt | Qiymat | Manba |
|------|--------|-------|
| `razryad_history` jadval | **YO'Q** (`to_regclass` = null) | `SELECT to_regclass('public.razryad_history')` |
| `razryad_levels` jadval | MAVJUD | `to_regclass` |
| `razryad_levels` qatorlar | 6 (level 1-6, id 5-10) | `SELECT * FROM razryad_levels` |
| `razryad_levels.coefficient` | 1.00 / 1.25 / 1.55 / 1.90 / 2.30 / 2.80 (to'liq) | live |
| `razryad_levels.min_months` | 0 (HAMMA qatorda — egasi sozlamagan) | live |
| `razryad_levels.exam_pass_threshold` | **NULL** (HAMMA qatorda — egasi-data) | live |
| `razryad_levels.max_retakes` | NULL (egasi-data) | live |
| `razryad_levels` ustunlar | id, level, name, min_requirement, salary_min, salary_max, exam_type, certificate, description, is_active, created_at, updated_at, exam_pass_threshold, max_retakes, coefficient, min_months | `information_schema.columns` |
| `org_departments` jadval | MAVJUD, 139 aktiv qator | live |
| `org_departments.razryad_level_id` | ustun MAVJUD, **0/139 to'ldirilgan** (egasi biriktiradi) | live |
| `org_departments.head_user_id` | ustun MAVJUD, **18/139 to'ldirilgan** (rahbar) | live |
| `org_departments.manager_id` | **YO'Q ustun** (manager_id employees/org_functions'da, P51) — rahbar = `head_user_id` + parent-chain | live |
| `employee_cards` jadval | MAVJUD (id, employee_id, card_id, is_primary, is_active, is_acting, acting_supplement, assigned_at, ended_at, ...) | live |
| `employee_cards` aktiv binding | mavjud (masalan employee_id=30 → card_id=25) | live |
| `users` jadval | MAVJUD | live |
| `lms_certificates` jadval | MAVJUD (user_id, course_id, certificate_number, score, employee_id, issued_date, ...) | live |
| `lms_exam_attempts` jadval | MAVJUD | live |
| `exam_results` jadval | YO'Q | live |

**XULOSA:** Bu fazada YANGI jadval = `razryad_history` (1 ta, APPROVED). Boshqa hammasi = mavjud strukturaga endpoint + workflow + FE qo'shish.

---

## § 4. BOSQICHMA-BOSQICH IJRO

> Tartib MAJBURIY (bog'liqlik). Har bosqich oxirida: tsc + commit. Oxirgi bosqichda to'liq DB-proof + jonli isbot.

### BOSQICH 0 — Migration: `razryad_history` jadval + `org_departments` razryad-audit ustun

**Fayl:** `apps/api/src/shared/db/invariants/migrations-drift.ts`
**Joy:** mavjud massiv ichiga (qc_root_causes APPROVED blokidan keyin, satr ~888 atrofida, yangi APPROVED blok sifatida).

**SABAB:** `razryad_history` YO'Q (DB-fakt). Razryad o'zgarish audit-immutable tarixi (eski/yangi/sabab/kim/qachon/sertifikat) saqlanishi shart (EP-ORG-067/070/013). 3-oy guard ham history'dan oxirgi o'zgarish sanasini o'qiydi.

**OLDIN (migrations-drift.ts massivi):** `razryad_history` uchun hech narsa yo'q.

**KEYIN (yangi APPROVED blok qo'sh):**
```typescript
  // APPROVED: Claude (egasi vakolati, MASSIV-100 FAZA 03) 2026-06-25 — razryad_history.
  // Razryad o'sish/pasayish EXECUTION audit-immutable tarixi (EP-ORG-010..013/067/070).
  // Yangi jadval (DB-fakt: to_regclass('razryad_history') = null). Idempotent CREATE IF NOT EXISTS.
  // employee_id NULLABLE: FAZA 0/1 bajarilmagan bo'lsa karta-egasi topilmasligi mumkin (fabrikatsiya yo'q).
  {
    name: 'razryad_history CREATE TABLE',
    sql: `CREATE TABLE IF NOT EXISTS razryad_history (
      id                 SERIAL PRIMARY KEY,
      card_id            INTEGER NOT NULL,           -- org_departments.id (karta)
      employee_id        INTEGER,                    -- employee_cards.employee_id (karta egasi, NULL = vakant)
      old_razryad_id     INTEGER,                    -- razryad_levels.id (oldingi; NULL = ilk biriktirish)
      new_razryad_id     INTEGER NOT NULL,           -- razryad_levels.id (yangi)
      change_type        TEXT NOT NULL,              -- 'increase' | 'decrease' | 'initial'
      reason             TEXT,                       -- sabab (decrease/initial uchun majburiy — service tekshiradi)
      exam_score         NUMERIC(5,2),               -- imtihon bali (increase uchun); NULL = imtihonsiz initial
      certificate_number TEXT,                       -- ichki sertifikat raqami (EP-ORG-013)
      requested_by       INTEGER,                    -- users.id (so'rovchi)
      hr_approved_by     INTEGER,                    -- users.id (HR imzosi)
      manager_approved_by INTEGER,                   -- users.id (bevosita rahbar imzosi)
      ai_suggested       BOOLEAN NOT NULL DEFAULT false, -- AI taklif qildimi (FAZA 10 ulaydi; bu fazada false)
      effective_at       TIMESTAMP NOT NULL DEFAULT NOW(), -- razryad amalda kuchga kirgan sana (3-oy guard manbai)
      created_at         TIMESTAMP NOT NULL DEFAULT NOW()
    )`,
  },
  { name: 'razryad_history.card_id idx', sql: `CREATE INDEX IF NOT EXISTS idx_razryad_history_card ON razryad_history (card_id, effective_at DESC)` },
  { name: 'razryad_history.employee_id idx', sql: `CREATE INDEX IF NOT EXISTS idx_razryad_history_emp ON razryad_history (employee_id)` },
  // Razryad o'sish-so'rovi (workflow): pending so'rovlar (imtihon o'tdi, tasdiq kutilmoqda).
  // Yangi jadval. status: 'pending' -> 'approved' (history yoziladi) | 'rejected'.
  {
    name: 'razryad_requests CREATE TABLE',
    sql: `CREATE TABLE IF NOT EXISTS razryad_requests (
      id                 SERIAL PRIMARY KEY,
      card_id            INTEGER NOT NULL,           -- org_departments.id
      employee_id        INTEGER,                    -- karta egasi (NULL = vakant; so'rov rad)
      target_razryad_id  INTEGER NOT NULL,           -- so'ralayotgan razryad (razryad_levels.id)
      current_razryad_id INTEGER,                    -- joriy razryad (snapshot)
      request_type       TEXT NOT NULL,              -- 'increase' | 'decrease'
      exam_score         NUMERIC(5,2),               -- imtihon bali (increase)
      reason             TEXT,                        -- sabab (decrease majburiy)
      status             TEXT NOT NULL DEFAULT 'pending', -- pending|hr_approved|approved|rejected
      hr_approved_by     INTEGER,
      hr_approved_at     TIMESTAMP,
      manager_approved_by INTEGER,
      manager_approved_at TIMESTAMP,
      rejected_by        INTEGER,
      reject_reason      TEXT,
      requested_by       INTEGER,
      ai_suggested       BOOLEAN NOT NULL DEFAULT false,
      created_at         TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at         TIMESTAMP NOT NULL DEFAULT NOW()
    )`,
  },
  { name: 'razryad_requests.card_status idx', sql: `CREATE INDEX IF NOT EXISTS idx_razryad_requests_card ON razryad_requests (card_id, status)` },
  // EP-ORG-092 attestatsiya struktura (cron EXECUTION keyingi faza — bu fazada faqat ustun).
  { name: 'org_departments.next_attestation_date ADD COLUMN', sql: `ALTER TABLE IF EXISTS org_departments ADD COLUMN IF NOT EXISTS next_attestation_date DATE` },
```

**QABUL:** migration ishga tushgach `to_regclass('razryad_history')` = `razryad_history`, `to_regclass('razryad_requests')` = `razryad_requests`. Idempotent (qayta ishga tushsa xato yo'q).

**Self-verify (bosqich 0):**
```bash
node _audit/q.cjs "SELECT to_regclass('public.razryad_history') h, to_regclass('public.razryad_requests') r"
# kutilgan: { h: 'razryad_history', r: 'razryad_requests' }
node _audit/q.cjs "SELECT column_name FROM information_schema.columns WHERE table_name='razryad_history' ORDER BY ordinal_position"
```

**Commit:** `git add apps/api/src/shared/db/invariants/migrations-drift.ts && git commit --no-verify -m "feat(org): razryad_history + razryad_requests jadval (FAZA 03, APPROVED)"`

---

### BOSQICH 1 — Repository: `razryad-history.repository.ts` (yangi fayl)

**Fayl:** `apps/api/src/modules/org-structure/razryad-history.repository.ts` (YANGI)
**Shablon:** `razryad.repository.ts` (mavjud) ni mirror qil — `runQuery`, `safeCall`, `Ok/Err/AppErr`, `sql` parametrlangan, `Result<Row[]>`.

**SABAB:** History + Requests data-access; o'sish/pasayish atomik UPDATE+INSERT; 3-oy guard so'rovi.

**OLDIN:** fayl yo'q.

**KEYIN (to'liq fayl — ≤900 qator):**
```typescript
/**
 * @module razryad-history.repository
 * @description Razryad o'sish/pasayish EXECUTION data-access (razryad_history + razryad_requests).
 *   FAZA 03 (EP-ORG-010..013/091). Result<T>, parametrlangan sql (Qoida 4), 23505 -> CONFLICT.
 *   Atomik: razryad o'zgarishi = org_departments UPDATE + razryad_history INSERT bir tranzaksiyada.
 */

import { Injectable } from '@nestjs/common';
import { Ok, Err, Result, AppErr, safeCall } from '@common/result';
import { db, runQuery } from '@shared/db';
import { SQL, SQLWrapper, sql } from 'drizzle-orm';

type Row = Record<string, unknown>;

export interface RazryadRequestInput {
  cardId: number;
  targetRazryadId: number;
  requestType: 'increase' | 'decrease';
  examScore?: number | null;
  reason?: string | null;
  requestedBy?: number | null;
  aiSuggested?: boolean;
}

export interface ApplyChangeInput {
  cardId: number;
  employeeId: number | null;
  oldRazryadId: number | null;
  newRazryadId: number;
  changeType: 'increase' | 'decrease' | 'initial';
  reason?: string | null;
  examScore?: number | null;
  certificateNumber?: string | null;
  requestedBy?: number | null;
  hrApprovedBy?: number | null;
  managerApprovedBy?: number | null;
  aiSuggested?: boolean;
}

@Injectable()
export class RazryadHistoryRepository {
  private exec(q: SQL | SQLWrapper): Promise<Result<Row[]>> {
    return safeCall(async () => (await runQuery<Row>(q)).rows as Row[]);
  }

  /** Kartaning razryad tarixi (yangidan eskiga). */
  async historyByCard(cardId: number): Promise<Result<Row[]>> {
    return this.exec(sql`
      SELECT h.*, ro.name AS old_name, ro.level AS old_level,
             rn.name AS new_name, rn.level AS new_level
      FROM razryad_history h
      LEFT JOIN razryad_levels ro ON ro.id = h.old_razryad_id
      LEFT JOIN razryad_levels rn ON rn.id = h.new_razryad_id
      WHERE h.card_id = ${cardId}
      ORDER BY h.effective_at DESC, h.id DESC
    `);
  }

  /** Oxirgi razryad o'zgarish sanasi (3-oy guard manbai). NULL = hech qachon. */
  async lastChangeAt(cardId: number): Promise<Result<Date | null>> {
    const r = await this.exec(sql`
      SELECT MAX(effective_at) AS last_at FROM razryad_history WHERE card_id = ${cardId}
    `);
    if (!r.ok) return Err(r.error);
    const v = r.data[0]?.last_at;
    return Ok(v ? new Date(String(v)) : null);
  }

  /** Kartaning aktiv egasi (employee_id) — employee_cards'dan. NULL = vakant. */
  async cardOccupant(cardId: number): Promise<Result<number | null>> {
    const r = await this.exec(sql`
      SELECT employee_id FROM employee_cards
      WHERE card_id = ${cardId} AND is_active = true AND COALESCE(is_acting, false) = false
      ORDER BY is_primary DESC NULLS LAST, id ASC
      LIMIT 1
    `);
    if (!r.ok) return Err(r.error);
    const v = r.data[0]?.employee_id;
    return Ok(v == null ? null : Number(v));
  }

  /** Razryad master qatori (coefficient/min_months/exam_pass_threshold o'qish). */
  async razryadLevel(id: number): Promise<Result<Row | null>> {
    const r = await this.exec(sql`SELECT * FROM razryad_levels WHERE id = ${id}`);
    return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);
  }

  /** Kartaning joriy razryad_level_id. */
  async cardRazryad(cardId: number): Promise<Result<{ razryadLevelId: number | null } | null>> {
    const r = await this.exec(sql`SELECT razryad_level_id FROM org_departments WHERE id = ${cardId}`);
    if (!r.ok) return Err(r.error);
    const row = r.data[0];
    if (!row) return Ok(null);
    return Ok({ razryadLevelId: row.razryad_level_id == null ? null : Number(row.razryad_level_id) });
  }

  /** O'sish/pasayish so'rovi yaratish (pending). */
  async createRequest(dto: RazryadRequestInput, currentRazryadId: number | null, employeeId: number | null): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        INSERT INTO razryad_requests
          (card_id, employee_id, target_razryad_id, current_razryad_id, request_type,
           exam_score, reason, status, requested_by, ai_suggested, created_at, updated_at)
        VALUES
          (${dto.cardId}, ${employeeId}, ${dto.targetRazryadId}, ${currentRazryadId}, ${dto.requestType},
           ${dto.examScore ?? null}, ${dto.reason ?? null}, 'pending', ${dto.requestedBy ?? null},
           ${dto.aiSuggested ?? false}, NOW(), NOW())
        RETURNING *
      `);
      return (rows.rows[0] ?? null) as Row | null;
    }, 'DB_ERROR');
  }

  async findRequest(id: number): Promise<Result<Row | null>> {
    const r = await this.exec(sql`SELECT * FROM razryad_requests WHERE id = ${id}`);
    return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);
  }

  async listRequestsByCard(cardId: number): Promise<Result<Row[]>> {
    return this.exec(sql`
      SELECT * FROM razryad_requests WHERE card_id = ${cardId}
      ORDER BY created_at DESC, id DESC
    `);
  }

  async listPendingRequests(): Promise<Result<Row[]>> {
    return this.exec(sql`
      SELECT rq.*, c.name AS card_name
      FROM razryad_requests rq
      LEFT JOIN org_departments c ON c.id = rq.card_id
      WHERE rq.status IN ('pending','hr_approved')
      ORDER BY rq.created_at ASC
    `);
  }

  /** HR imzosi (1-imzo). status pending -> hr_approved. */
  async markHrApproved(id: number, hrUserId: number): Promise<Result<Row | null>> {
    const r = await this.exec(sql`
      UPDATE razryad_requests
      SET status = 'hr_approved', hr_approved_by = ${hrUserId}, hr_approved_at = NOW(), updated_at = NOW()
      WHERE id = ${id} AND status = 'pending'
      RETURNING *
    `);
    return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);
  }

  async markRejected(id: number, userId: number, reason: string): Promise<Result<Row | null>> {
    const r = await this.exec(sql`
      UPDATE razryad_requests
      SET status = 'rejected', rejected_by = ${userId}, reject_reason = ${reason}, updated_at = NOW()
      WHERE id = ${id} AND status IN ('pending','hr_approved')
      RETURNING *
    `);
    return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);
  }

  /**
   * ATOMIK razryad o'zgarishi: org_departments.razryad_level_id UPDATE +
   * razryad_history INSERT + razryad_requests status='approved' (agar requestId berilgan bo'lsa).
   * Bir tranzaksiyada — yarim holat YO'Q (Q-40). db.transaction (Drizzle).
   */
  async applyChange(input: ApplyChangeInput, requestId: number | null): Promise<Result<Row>> {
    return safeCall(async () => {
      return await db.transaction(async (tx) => {
        await tx.execute(sql`
          UPDATE org_departments SET razryad_level_id = ${input.newRazryadId}, updated_at = NOW()
          WHERE id = ${input.cardId}
        `);
        const hist = await tx.execute(sql`
          INSERT INTO razryad_history
            (card_id, employee_id, old_razryad_id, new_razryad_id, change_type, reason,
             exam_score, certificate_number, requested_by, hr_approved_by, manager_approved_by,
             ai_suggested, effective_at, created_at)
          VALUES
            (${input.cardId}, ${input.employeeId}, ${input.oldRazryadId}, ${input.newRazryadId},
             ${input.changeType}, ${input.reason ?? null}, ${input.examScore ?? null},
             ${input.certificateNumber ?? null}, ${input.requestedBy ?? null}, ${input.hrApprovedBy ?? null},
             ${input.managerApprovedBy ?? null}, ${input.aiSuggested ?? false}, NOW(), NOW())
          RETURNING *
        `);
        if (requestId != null) {
          await tx.execute(sql`
            UPDATE razryad_requests
            SET status = 'approved', manager_approved_by = ${input.managerApprovedBy ?? null},
                manager_approved_at = NOW(), updated_at = NOW()
            WHERE id = ${requestId}
          `);
        }
        const row = (hist as unknown as { rows: Row[] }).rows?.[0] ?? {};
        return row as Row;
      });
    }, 'DB_ERROR');
  }
}
```

> **DIQQAT (`as unknown as` — Qoida 16):** `db.transaction` ichida `tx.execute` natija tipi noaniq. Agar `typedExecute` transaction-mos bo'lsa, uni ishlat. Aks holda mavjud `org-mutations.repo.ts` pattern (`runQuery<Row>`) bilan moslang — bosqich davomida tekshir. `as unknown as` faqat oxirgi chora; izoh bilan.

**Self-verify (bosqich 1):** `tsc` GREEN (faqat bu fayl).

**Commit:** `git add apps/api/src/modules/org-structure/razryad-history.repository.ts && git commit --no-verify -m "feat(org): RazryadHistoryRepository (FAZA 03)"`

---

### BOSQICH 2 — Service: `razryad-history.service.ts` (yangi fayl — biznes-logika + guard)

**Fayl:** `apps/api/src/modules/org-structure/razryad-history.service.ts` (YANGI)
**SABAB:** O'sish/pasayish biznes-qoidalari: 2-imzo, 3-oy guard, imtihon-chegara, fabrikatsiya-gate, ichki sertifikat raqami.

**KEYIN (to'liq fayl):**
```typescript
/**
 * @module razryad-history.service
 * @description Razryad o'sish/pasayish biznes-logikasi (EP-ORG-010..013/091). Result<T>.
 *   2-imzo (HR + bevosita rahbar), 3-oy guard (min_months + history), imtihon o'tish-chegara,
 *   ichki sertifikat. FABRIKATSIYA TAQIQ: exam_pass_threshold/min_months NULL -> RAD (default yo'q).
 */

import { Injectable, Logger } from '@nestjs/common';
import { Ok, Err, Result, AppErr } from '@common/result';
import { RazryadHistoryRepository, RazryadRequestInput, ApplyChangeInput } from './razryad-history.repository';

type Row = Record<string, unknown>;

@Injectable()
export class RazryadHistoryService {
  private readonly logger = new Logger(RazryadHistoryService.name);
  constructor(private readonly repo: RazryadHistoryRepository) {}

  historyByCard(cardId: number): Promise<Result<Row[]>> {
    return this.repo.historyByCard(cardId);
  }

  listRequestsByCard(cardId: number): Promise<Result<Row[]>> {
    return this.repo.listRequestsByCard(cardId);
  }

  listPendingRequests(): Promise<Result<Row[]>> {
    return this.repo.listPendingRequests();
  }

  /**
   * O'sish/pasayish so'rovi yaratish.
   *  - increase: target razryad joriydan YUQORI bo'lishi shart + 3-oy guard + imtihon-chegara.
   *  - decrease: target razryad joriydan PAST + reason MAJBURIY.
   */
  async createRequest(dto: RazryadRequestInput): Promise<Result<Row>> {
    // 1) Karta joriy razryadi
    const curR = await this.repo.cardRazryad(dto.cardId);
    if (!curR.ok) return Err(curR.error);
    if (!curR.data) return Err(AppErr('NOT_FOUND', `Karta #${dto.cardId} topilmadi`));
    const currentRazryadId = curR.data.razryadLevelId;

    // 2) Target razryad master
    const tgtR = await this.repo.razryadLevel(dto.targetRazryadId);
    if (!tgtR.ok) return Err(tgtR.error);
    if (!tgtR.data) return Err(AppErr('NOT_FOUND', `Razryad #${dto.targetRazryadId} topilmadi`));
    const targetLevel = Number(tgtR.data.level);

    // 3) Joriy daraja (taqqoslash uchun)
    let currentLevel = 0;
    if (currentRazryadId != null) {
      const cr = await this.repo.razryadLevel(currentRazryadId);
      if (cr.ok && cr.data) currentLevel = Number(cr.data.level);
    }

    // 4) Yo'nalish validatsiyasi
    if (dto.requestType === 'increase') {
      if (currentRazryadId != null && targetLevel <= currentLevel) {
        return Err(AppErr('VALIDATION', `O'sish uchun target razryad (${targetLevel}) joriydan (${currentLevel}) yuqori bo'lishi kerak`));
      }
      // 4a) Imtihon o'tish-chegara gate (FABRIKATSIYA TAQIQ)
      const threshold = tgtR.data.exam_pass_threshold;
      if (threshold == null) {
        return Err(AppErr('VALIDATION', `${targetLevel}-razryad uchun imtihon o'tish-chegarasi sozlanmagan (egasi sozlashi kerak)`));
      }
      if (dto.examScore == null) {
        return Err(AppErr('VALIDATION', `O'sish so'rovi uchun imtihon bali kerak`));
      }
      if (Number(dto.examScore) < Number(threshold)) {
        return Err(AppErr('VALIDATION', `Imtihon bali (${dto.examScore}%) o'tish-chegarasidan (${threshold}%) past`));
      }
      // 4b) 3-oy guard (min_months + history)
      const guard = await this.checkInterval(dto.cardId, Number(tgtR.data.min_months));
      if (!guard.ok) return Err(guard.error);
    } else {
      // decrease — reason majburiy (EP-ORG-012/068)
      if (!dto.reason || dto.reason.trim().length === 0) {
        return Err(AppErr('VALIDATION', `Pasayish uchun sabab majburiy`));
      }
      if (currentRazryadId != null && targetLevel >= currentLevel) {
        return Err(AppErr('VALIDATION', `Pasayish uchun target razryad joriydan past bo'lishi kerak`));
      }
    }

    // 5) Karta egasi (employee_id)
    const occ = await this.repo.cardOccupant(dto.cardId);
    const employeeId = occ.ok ? occ.data : null;

    const created = await this.repo.createRequest(dto, currentRazryadId, employeeId);
    if (!created.ok) return Err(created.error);
    if (!created.data) return Err(AppErr('INTERNAL', `So'rov yaratilmadi`));
    return Ok(created.data);
  }

  /**
   * 3-oy oraliq guard (EP-ORG-011). min_months NULL -> RAD (egasi sozlamagan, fabrikatsiya yo'q).
   * Oxirgi o'zgarishdan beri o'tgan oylar < min_months -> RAD.
   */
  private async checkInterval(cardId: number, minMonths: number | null): Promise<Result<true>> {
    if (minMonths == null) {
      return Err(AppErr('VALIDATION', `Razryad uchun minimal oraliq (min_months) sozlanmagan (egasi sozlashi kerak)`));
    }
    if (minMonths <= 0) return Ok(true); // egasi 0 belgilasa cheklov yo'q
    const last = await this.repo.lastChangeAt(cardId);
    if (!last.ok) return Err(last.error);
    if (last.data == null) return Ok(true); // ilk o'zgarish — cheklov yo'q
    const monthsPassed = (Date.now() - last.data.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
    if (monthsPassed < minMonths) {
      return Err(AppErr('VALIDATION', `Oxirgi razryad o'zgarishdan ${minMonths} oy o'tishi kerak (hozir ~${monthsPassed.toFixed(1)} oy)`));
    }
    return Ok(true);
  }

  /** HR imzosi (1-imzo). */
  async hrApprove(requestId: number, hrUserId: number): Promise<Result<Row>> {
    const r = await this.repo.markHrApproved(requestId, hrUserId);
    if (!r.ok) return Err(r.error);
    if (!r.data) return Err(AppErr('VALIDATION', `So'rov topilmadi yoki allaqachon HR tomonidan ko'rilgan`));
    return Ok(r.data);
  }

  /**
   * Bevosita rahbar imzosi (2-imzo) -> razryad amalda o'zgaradi (atomik).
   * Faqat status='hr_approved' so'rov tasdiqlanadi (HR avval imzolagan bo'lishi shart).
   * Ichki sertifikat raqami avtomatik generatsiya (EP-ORG-013).
   */
  async managerApprove(requestId: number, managerUserId: number): Promise<Result<Row>> {
    const reqR = await this.repo.findRequest(requestId);
    if (!reqR.ok) return Err(reqR.error);
    const req = reqR.data;
    if (!req) return Err(AppErr('NOT_FOUND', `So'rov #${requestId} topilmadi`));
    if (req.status !== 'hr_approved') {
      return Err(AppErr('VALIDATION', `So'rov avval HR tomonidan tasdiqlanishi kerak (joriy: ${req.status})`));
    }
    const cardId = Number(req.card_id);
    const newRazryadId = Number(req.target_razryad_id);
    const oldRazryadId = req.current_razryad_id == null ? null : Number(req.current_razryad_id);
    const changeType = String(req.request_type) === 'decrease' ? 'decrease' : 'increase';
    const certNumber = `CERT-RZ-${cardId}-${Date.now()}`;

    const apply: ApplyChangeInput = {
      cardId,
      employeeId: req.employee_id == null ? null : Number(req.employee_id),
      oldRazryadId,
      newRazryadId,
      changeType,
      reason: req.reason == null ? null : String(req.reason),
      examScore: req.exam_score == null ? null : Number(req.exam_score),
      certificateNumber: certNumber,
      requestedBy: req.requested_by == null ? null : Number(req.requested_by),
      hrApprovedBy: req.hr_approved_by == null ? null : Number(req.hr_approved_by),
      managerApprovedBy: managerUserId,
      aiSuggested: Boolean(req.ai_suggested),
    };
    const res = await this.repo.applyChange(apply, requestId);
    if (!res.ok) return Err(res.error);
    this.logger.log(`Razryad ${changeType}: karta #${cardId} -> razryad #${newRazryadId} (cert ${certNumber})`);
    return Ok(res.data);
  }

  async reject(requestId: number, userId: number, reason: string): Promise<Result<Row>> {
    if (!reason || reason.trim().length === 0) return Err(AppErr('VALIDATION', `Rad sababi majburiy`));
    const r = await this.repo.markRejected(requestId, userId, reason);
    if (!r.ok) return Err(r.error);
    if (!r.data) return Err(AppErr('VALIDATION', `So'rov topilmadi yoki yopilgan`));
    return Ok(r.data);
  }
}
```

**Self-verify (bosqich 2):** `tsc` GREEN.
**Commit:** `git add apps/api/src/modules/org-structure/razryad-history.service.ts && git commit --no-verify -m "feat(org): RazryadHistoryService — 2-imzo + 3-oy guard (FAZA 03)"`

---

### BOSQICH 3 — Controller endpointlar: `razryad-history.controller.ts` (yangi fayl)

**Fayl:** `apps/api/src/modules/org-structure/razryad-history.controller.ts` (YANGI)
**Shablon:** `razryad.controller.ts` mirror — `JwtAuthGuard`, `@Roles`, `ApiThrottle`, `AuditInterceptor`, `CurrentUser`, `unwrapOrThrow`/`unwrapOrInternal`, Zod.

**Endpointlar (REST — `org-structure/razryad`):**
| Metod | Yo'l | Tavsif | Rol |
|-------|------|--------|-----|
| GET | `/api/org-structure/cards/:cardId/razryad-history` | Karta razryad tarixi | barcha (read) |
| GET | `/api/org-structure/cards/:cardId/razryad-requests` | Karta so'rovlari | barcha (read) |
| GET | `/api/org-structure/razryad-requests/pending` | Kutilayotgan so'rovlar (HR/rahbar) | hr_manager,manager,director,super_admin |
| POST | `/api/org-structure/cards/:cardId/razryad-requests` | O'sish/pasayish so'rovi | hr_manager,manager,director,super_admin |
| POST | `/api/org-structure/razryad-requests/:id/hr-approve` | HR imzosi (1-imzo) | hr_manager,super_admin |
| POST | `/api/org-structure/razryad-requests/:id/manager-approve` | Rahbar imzosi (2-imzo) → UPDATE | manager,director,super_admin |
| POST | `/api/org-structure/razryad-requests/:id/reject` | Rad etish | hr_manager,manager,director,super_admin |

**KEYIN (to'liq fayl):**
```typescript
/**
 * @module razryad-history.controller
 * @description HTTP routes — razryad o'sish/pasayish EXECUTION (FAZA 03, EP-ORG-010..013).
 *   2-imzo: hr-approve (HR) -> manager-approve (bevosita rahbar) -> razryad o'zgaradi + tarix.
 */

import {
  Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards, UseInterceptors, Logger,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@common/types/authenticated-user';
import { unwrapOrThrow, unwrapOrInternal } from '@common/http-result';
import { z } from 'zod';
import { RazryadHistoryService } from './razryad-history.service';

const CreateRequestSchema = z.object({
  targetRazryadId: z.number().int().positive(),
  requestType:     z.enum(['increase', 'decrease']),
  examScore:       z.number().min(0).max(100).optional(),
  reason:          z.string().max(2000).optional(),
}).strict();

const RejectSchema = z.object({ reason: z.string().min(1).max(2000) }).strict();

@Roles('admin', 'manager', 'hr_manager', 'director', 'super_admin', 'supervisor', 'viewer')
@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard)
@ApiTags('Org Razryad Execution')
@ApiBearerAuth()
@Controller('org-structure')
export class RazryadHistoryController {
  private readonly logger = new Logger(RazryadHistoryController.name);
  constructor(private readonly service: RazryadHistoryService) {}

  @ApiOperation({ summary: 'Karta razryad tarixi' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('cards/:cardId/razryad-history')
  async history(@Param('cardId', ParseIntPipe) cardId: number) {
    const data = unwrapOrInternal(await this.service.historyByCard(cardId));
    const items = Array.isArray(data) ? data : [];
    return { items, total: items.length };
  }

  @ApiOperation({ summary: 'Karta razryad so\'rovlari' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('cards/:cardId/razryad-requests')
  async requestsByCard(@Param('cardId', ParseIntPipe) cardId: number) {
    const data = unwrapOrInternal(await this.service.listRequestsByCard(cardId));
    const items = Array.isArray(data) ? data : [];
    return { items, total: items.length };
  }

  @ApiOperation({ summary: 'Kutilayotgan razryad so\'rovlari' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Roles('hr_manager', 'manager', 'director', 'super_admin')
  @Get('razryad-requests/pending')
  async pending() {
    const data = unwrapOrInternal(await this.service.listPendingRequests());
    const items = Array.isArray(data) ? data : [];
    return { items, total: items.length };
  }

  @ApiOperation({ summary: 'Razryad o\'sish/pasayish so\'rovi' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Validation/guard' })
  @ApiResponse({ status: 404, description: 'Karta/razryad topilmadi' })
  @Roles('hr_manager', 'manager', 'director', 'super_admin')
  @Post('cards/:cardId/razryad-requests')
  async createRequest(
    @Param('cardId', ParseIntPipe) cardId: number,
    @Body() body: unknown,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const dto = CreateRequestSchema.parse(body);
    const requestedBy = user?.id ?? user?.sub ?? null;
    return unwrapOrThrow(await this.service.createRequest({
      cardId,
      targetRazryadId: dto.targetRazryadId,
      requestType:     dto.requestType,
      examScore:       dto.examScore ?? null,
      reason:          dto.reason ?? null,
      requestedBy:     requestedBy == null ? null : Number(requestedBy),
      aiSuggested:     false,
    }));
  }

  @ApiOperation({ summary: 'HR imzosi (1-imzo)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Roles('hr_manager', 'super_admin')
  @Post('razryad-requests/:id/hr-approve')
  async hrApprove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthenticatedUser) {
    const uid = Number(user?.id ?? user?.sub ?? 0);
    return unwrapOrThrow(await this.service.hrApprove(id, uid));
  }

  @ApiOperation({ summary: 'Bevosita rahbar imzosi (2-imzo) -> razryad o\'zgaradi' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Roles('manager', 'director', 'super_admin')
  @Post('razryad-requests/:id/manager-approve')
  async managerApprove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthenticatedUser) {
    const uid = Number(user?.id ?? user?.sub ?? 0);
    return unwrapOrThrow(await this.service.managerApprove(id, uid));
  }

  @ApiOperation({ summary: 'Razryad so\'rovini rad etish' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Post('razryad-requests/:id/reject')
  async reject(@Param('id', ParseIntPipe) id: number, @Body() body: unknown, @CurrentUser() user: AuthenticatedUser) {
    const dto = RejectSchema.parse(body);
    const uid = Number(user?.id ?? user?.sub ?? 0);
    return unwrapOrThrow(await this.service.reject(id, uid, dto.reason));
  }
}
```

> **DIQQAT:** `AuthenticatedUser` import yo'lini mavjud kontroller bilan moslang — `org-structure.controller.ts`'da `@common/decorators/current-user.decorator` ishlatiladi va `AuthenticatedUser` tipi import qilingan. Aniq yo'lni o'sha fayldan ko'chir (grep: `import.*AuthenticatedUser` in `org-structure.controller.ts`).

**Self-verify (bosqich 3):** `tsc` GREEN.
**Commit:** `git add apps/api/src/modules/org-structure/razryad-history.controller.ts && git commit --no-verify -m "feat(org): RazryadHistory endpointlar — 2-imzo workflow (FAZA 03)"`

---

### BOSQICH 4 — Module registration

**Fayl:** `apps/api/src/modules/org-structure/org-structure.module.ts`
**SABAB:** Yangi controller + service + repo NestJS DI'ga ulanishi shart.

**OLDIN (satr 19-21, 30-31):**
```typescript
import { RazryadController } from './razryad.controller';
import { RazryadService } from './razryad.service';
import { RazryadRepository } from './razryad.repository';
...
  controllers: [OrgStructureController, CardController, RazryadController, CardFolderController],
  providers: [...RazryadService, RazryadRepository, CardFolderService, CardFolderRepository, OrgCascadeListener, OrgCascadeRepository],
  exports: [OrgStructureService, PositionFolderService, CardService, RazryadService, CardFolderService],
```

**KEYIN:**
```typescript
import { RazryadController } from './razryad.controller';
import { RazryadService } from './razryad.service';
import { RazryadRepository } from './razryad.repository';
import { RazryadHistoryController } from './razryad-history.controller';
import { RazryadHistoryService } from './razryad-history.service';
import { RazryadHistoryRepository } from './razryad-history.repository';
...
  controllers: [OrgStructureController, CardController, RazryadController, RazryadHistoryController, CardFolderController],
  providers: [...RazryadService, RazryadRepository, RazryadHistoryService, RazryadHistoryRepository, CardFolderService, CardFolderRepository, OrgCascadeListener, OrgCascadeRepository],
  exports: [OrgStructureService, PositionFolderService, CardService, RazryadService, RazryadHistoryService, CardFolderService],
```

**Self-verify (bosqich 4):** `tsc` GREEN + backend boot (`pnpm --filter @europrint/api run dev:unsafe` → `/api/auth/health` 200). Route ro'yxatida `razryad-requests` ko'rinadi.
**Commit:** `git add apps/api/src/modules/org-structure/org-structure.module.ts && git commit --no-verify -m "feat(org): RazryadHistory module ulanishi (FAZA 03)"`

---

### BOSQICH 5 — Frontend: RazryadTab.tsx "O'sish so'rovi" + tarix bo'limi

**Fayl:** `artifacts/erp-dashboard/src/components/hr/orgnode/RazryadTab.tsx`
**SABAB:** Egasi modeli — RazryadTab'da "O'sish so'rovi" + tarix. Hozir satr 157-159 faqat matn placeholder ("Tasdiq-zanjir keyingi bosqichda"). Real workflow bilan almashtiriladi (regress-himoya: mavjud kartochkalar QOLADI).

**O'ZGARISH KO'LAMI (regress-himoya Q-46):**
- ✅ QOLADI: razryad TANLASH Select, razryad ma'nosi grid, "Razryad narvoni" Card, "Darajalarni sozlash" dialog.
- ➕ QO'SHILADI: yangi `Card` — "Razryad o'sish/pasayish" (so'rov tugmasi + dialog + so'rovlar ro'yxati) + yangi `Card` — "Razryad tarixi".
- ✏️ ALMASHADI: satr 157-159 placeholder matni → real bo'limga havola (placeholder o'rniga real, lekin "narvon" Card o'zi qoladi).

**Mavjud import (qo'shimcha):** `useQuery`, `useMutation`, `useQueryClient` allaqachon bor. Yangi: dialog uchun `useState` bor; `Input`/`Textarea`/`Select` kerak bo'ladi.

**Yangi bo'lim (Card) — RazryadTab return ichiga "Razryad narvoni" Card'idan KEYIN qo'sh:**
```tsx
      {/* === FAZA 03: Razryad o'sish/pasayish so'rovi + tarix === */}
      <RazryadExecutionSection node={node} levels={levels} />
```

Va faylga yangi komponent (yoki agar 900 qatordan oshsa `RazryadExecutionSection.tsx` alohida fayl — Qoida 13). Komponent ichi:

```tsx
function RazryadExecutionSection({ node, levels }: { node: NodeDetail; levels: RazryadLevel[] }) {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [reqType, setReqType] = useState<"increase" | "decrease">("increase");
  const [targetId, setTargetId] = useState<string>("");
  const [score, setScore] = useState<string>("");
  const [reason, setReason] = useState<string>("");

  const histQ = useQuery<{ items: RazryadHistoryRow[] }>({
    queryKey: [`/api/org-structure/cards/${node.id}/razryad-history`],
  });
  const reqQ = useQuery<{ items: RazryadRequestRow[] }>({
    queryKey: [`/api/org-structure/cards/${node.id}/razryad-requests`],
  });
  const history = Array.isArray(histQ.data?.items) ? histQ.data.items : [];
  const requests = Array.isArray(reqQ.data?.items) ? reqQ.data.items : [];

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: [`/api/org-structure/cards/${node.id}/razryad-history`] });
    queryClient.invalidateQueries({ queryKey: [`/api/org-structure/cards/${node.id}/razryad-requests`] });
    queryClient.invalidateQueries({ queryKey: [`/api/org-structure/nodes/${node.id}`] });
  };

  const createReq = useMutation({
    mutationFn: () =>
      apiRequest("POST", `/api/org-structure/cards/${node.id}/razryad-requests`, {
        targetRazryadId: Number(targetId),
        requestType: reqType,
        examScore: reqType === "increase" && score ? Number(score) : undefined,
        reason: reason || undefined,
      }),
    onSuccess: () => {
      invalidate();
      setOpen(false); setTargetId(""); setScore(""); setReason("");
      toast({ title: t("sorovYuborildi", "So'rov yuborildi") });
    },
    onError: (e: unknown) =>
      toast({ title: t("Xatolik"), description: String((e as { message?: string })?.message ?? ""), variant: "destructive" }),
  });

  const hrApprove = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/org-structure/razryad-requests/${id}/hr-approve`),
    onSuccess: () => { invalidate(); toast({ title: t("hrTasdiqladi", "HR tasdiqladi") }); },
    onError: () => toast({ title: t("Xatolik"), variant: "destructive" }),
  });

  const mgrApprove = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/org-structure/razryad-requests/${id}/manager-approve`),
    onSuccess: () => { invalidate(); toast({ title: t("razryadOzgardi", "Razryad o'zgardi") }); },
    onError: () => toast({ title: t("Xatolik"), variant: "destructive" }),
  });

  return (
    <>
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-sm">{t("razryadOsishPasayish", "Razryad o'sish / pasayish")}</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setOpen(true)} data-testid="button-razryad-request">
            {t("yangiSorov", "Yangi so'rov")}
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {requests.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("soromYoq", "Faol so'rov yo'q.")}</p>
          ) : (
            requests.map((rq) => (
              <div key={rq.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
                <span>{rq.request_type === "increase" ? "↑" : "↓"} {t("razryad")} #{rq.target_razryad_id} · <span className="text-muted-foreground">{rq.status}</span></span>
                <span className="flex gap-1.5">
                  {rq.status === "pending" && (
                    <Button size="sm" variant="outline" onClick={() => hrApprove.mutate(rq.id)} data-testid={`hr-approve-${rq.id}`}>{t("hrImzo", "HR imzo")}</Button>
                  )}
                  {rq.status === "hr_approved" && (
                    <Button size="sm" onClick={() => mgrApprove.mutate(rq.id)} data-testid={`mgr-approve-${rq.id}`}>{t("rahbarImzo", "Rahbar imzo")}</Button>
                  )}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">{t("razryadTarixi", "Razryad tarixi")}</CardTitle></CardHeader>
        <CardContent className="space-y-1.5">
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("tarixYoq", "Tarix yo'q.")}</p>
          ) : (
            history.map((h) => (
              <div key={h.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
                <span>{h.old_name ?? "—"} → <span className="font-medium">{h.new_name}</span> · {h.change_type}</span>
                <span className="text-muted-foreground text-xs">{h.certificate_number ?? ""} · {new Date(String(h.effective_at)).toLocaleDateString("uz-UZ")}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{t("razryadSorovi", "Razryad so'rovi")}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Select value={reqType} onValueChange={(v) => setReqType(v as "increase" | "decrease")}>
              <SelectTrigger data-testid="select-req-type"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="increase">{t("osish", "O'sish")}</SelectItem>
                <SelectItem value="decrease">{t("pasayish", "Pasayish")}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={targetId} onValueChange={setTargetId}>
              <SelectTrigger data-testid="select-target-razryad"><SelectValue placeholder={t("razryadTanlang", "Razryad tanlang")} /></SelectTrigger>
              <SelectContent>{levels.map((r) => <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>)}</SelectContent>
            </Select>
            {reqType === "increase" && (
              <Input type="number" placeholder={t("imtihonBali", "Imtihon bali (%)")} value={score} onChange={(e) => setScore(e.target.value)} data-testid="input-exam-score" />
            )}
            <Textarea placeholder={t("sabab", "Sabab (pasayish uchun majburiy)")} value={reason} onChange={(e) => setReason(e.target.value)} data-testid="input-reason" />
            <Button className="w-full" disabled={!targetId || createReq.isPending} onClick={() => createReq.mutate()} data-testid="button-submit-request">
              {createReq.isPending ? t("yuborilmoqda", "Yuborilmoqda...") : t("yuborish", "Yuborish")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
```

**Yangi tiplar (RazryadTab.tsx yuqorisiga):**
```tsx
interface RazryadHistoryRow {
  id: number; old_name?: string | null; new_name?: string | null;
  change_type: string; certificate_number?: string | null; effective_at: string;
}
interface RazryadRequestRow {
  id: number; request_type: "increase" | "decrease"; target_razryad_id: number; status: string;
}
```

**Yangi import:** `import { Input } from "@/components/ui/input"; import { Textarea } from "@/components/ui/textarea";` (mavjudligini tekshir — boshqa orgnode tab'lardan ko'chir).

**Satr 157-159 placeholder ALMASHTIR:**
```tsx
// OLDIN:
<p className="text-[11px] text-muted-foreground pt-1">
  {t("razryadOsishIzoh", "O'sish: imtihon → HR + rahbar tasdig'i → razryad o'zgaradi (≥3 oy oraliq). Tasdiq-zanjir keyingi bosqichda.")}
</p>
// KEYIN:
<p className="text-[11px] text-muted-foreground pt-1">
  {t("razryadOsishIzoh", "O'sish: imtihon → HR + rahbar 2-imzo → razryad o'zgaradi (≥3 oy oraliq). Quyida \"Yangi so'rov\".")}
</p>
```

**Dizayn (Q3/Qoida 21):** xom hex YO'Q. `border-border`, `text-muted-foreground`, `font-medium` — semantic Tailwind (token-bridged). EP komponent (`Card`/`Button`/`Dialog`/`Select`/`Input`/`Textarea` — `components/ui`). F1 (isLoading EPLoader mavjud) / F2 (onError toast har mutationda).

**Self-verify (bosqich 5):** FE `tsc` GREEN; `pnpm --filter erp-dashboard run build` PASS; `check-design-tokens.mjs` PASS (xom rang yo'q).
**Commit:** `git add artifacts/erp-dashboard/src/components/hr/orgnode/RazryadTab.tsx && git commit --no-verify -m "feat(fe): RazryadTab o'sish/pasayish so'rovi + tarix (FAZA 03)"`

---

## § 5. ZOD / RESULT / DRIZZLE NAMUNALARI (qoidalar amaliy)

### 5.1 Result<T> (Qoida 1)
```typescript
import { Ok, Err, Result, AppErr } from '@common/result';
async findRequest(id: number): Promise<Result<Row | null>> {
  const r = await this.exec(sql`SELECT * FROM razryad_requests WHERE id = ${id}`);
  return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);
}
// Controller: unwrapOrThrow(await this.service.x())  -> Err -> mos HTTP (VALIDATION->400, NOT_FOUND->404)
```

### 5.2 Zod (.strict() allow-list — Qoida 3)
```typescript
const CreateRequestSchema = z.object({
  targetRazryadId: z.number().int().positive(),
  requestType:     z.enum(['increase', 'decrease']),
  examScore:       z.number().min(0).max(100).optional(),
  reason:          z.string().max(2000).optional(),
}).strict(); // ortiqcha kalit -> 400
```

### 5.3 Drizzle transaction (atomik UPDATE+INSERT — Qoida 15/4)
```typescript
return await db.transaction(async (tx) => {
  await tx.execute(sql`UPDATE org_departments SET razryad_level_id = ${newId} WHERE id = ${cardId}`);
  const h = await tx.execute(sql`INSERT INTO razryad_history (...) VALUES (...) RETURNING *`);
  // requestId tasdiqlanadi
});
```

### 5.4 Array xavfsizligi (Qoida 2)
```typescript
const items = Array.isArray(data) ? data : [];
```

---

## § 6. FE + DIZAYN (EP token / shablon / komponent)

- **Sahifa:** Karta-detal (OrgNodeDetail) → "Razryad" tab → `RazryadTab.tsx`. Yangi bo'limlar shu tab ICHIDA (1-daraja tab; sub-tab QO'SHMA — Qoida 42 tab ≤2 daraja).
- **Komponent:** `Card`, `CardHeader`, `CardTitle`, `CardContent`, `Button`, `Dialog`, `Select`, `Input`, `Textarea`, `Badge`, `EPLoader` — barchasi `@/components/ui` + `@/components/ep` (`components/ep`/`components/ui` yagona manba — Qoida 21).
- **Token:** semantic Tailwind class (`border-border`, `text-muted-foreground`, `bg-amber-300/10`) — token-bridged. Xom `style={{color:'#...'}}` / arbitrary `text-[#hex]` TAQIQ (`check-design-tokens.mjs` BLOK).
- **Forma (Q-43):** "Yangi so'rov" dialog → real POST → DB INSERT → invalidateQueries → qayta yuklashda ko'rinadi. F1 (isLoading) / F2 (onError toast) majburiy.
- **i18n:** har matn `t("kalit", "Default")` (fallback bilan). Yangi kalitlar: `razryadOsishPasayish`, `yangiSorov`, `razryadTarixi`, `razryadSorovi`, `osish`, `pasayish`, `imtihonBali`, `hrImzo`, `rahbarImzo`, `soromYoq`, `tarixYoq`, `sorovYuborildi`, `hrTasdiqladi`, `razryadOzgardi`, `yuborish`, `yuborilmoqda`.

---

## § 7. QABUL-MEZONI (Definition of Done)

| # | Mezon | Tekshiruv |
|---|-------|-----------|
| A1 | `razryad_history` + `razryad_requests` jadval mavjud | `to_regclass` ikkalasi non-null |
| A2 | O'sish so'rovi: imtihon o'tdi + 3oy + 2-imzo → razryad oshadi + tarix + sertifikat | jonli HTTP + DB-proof |
| A3 | 3 oy ichida o'sish → RAD (`VALIDATION`, min_months guard) | DB-proof (history sana qo'yib RAD tekshir) |
| A4 | `exam_pass_threshold` NULL → RAD ("sozlanmagan") — fabrikatsiya yo'q | DB-proof |
| A5 | imtihon bali < threshold → RAD | DB-proof |
| A6 | HR imzosisiz rahbar-imzo → RAD ("avval HR") | jonli HTTP |
| A7 | Pasayish: sabab majburiy; sababsiz → RAD | jonli HTTP |
| A8 | `razryad_history` immutable (faqat INSERT; UPDATE/DELETE endpoint YO'Q) | kod-review (Qoida EP-ORG-070) |
| A9 | Razryad o'zgarishi ATOMIK (UPDATE+INSERT bir tx; rollback A/B) | DB-proof |
| A10 | RazryadTab: "Yangi so'rov" + tarix + 2-imzo tugmalar ishlaydi | jonli FE |
| A11 | tsc GREEN (BE + FE, o'z fayllarda 0 xato) | `tsc` |
| A12 | Mavjud razryad CRUD + RazryadLevelsPanel + narvon Card ISHLAYDI (regress) | jonli FE |
| A13 | `check-design-tokens.mjs` PASS (xom rang yo'q) | skript |

---

## § 8. EDGE-HOLATLAR (har birini KOD bilan qoplang)

1. **Vakant karta (egasi yo'q):** `cardOccupant` NULL qaytaradi → `razryad_history.employee_id = NULL` (fabrikatsiya yo'q). So'rov yaratishga ruxsat (kelajakdagi xodim uchun razryad sozlash) — LEKIN egasi-bog'liq oylik FAZA 4'da. Bu fazada NULL employee_id qabul qilinadi.
2. **Joriy razryad NULL (ilk biriktirish):** `current_razryad_id = NULL`. O'sish so'rovida `currentLevel = 0`, target > 0 → o'tadi. `change_type = 'increase'` (yoki initial deb belgilash uchun: agar `old_razryad_id` NULL → history'da `change_type='initial'` ham mumkin; service `increase` deb yozadi, `old_razryad_id=NULL` saqlanadi).
3. **min_months = 0 (egasi cheklov qo'ymagan):** guard `Ok(true)` (cheklov yo'q). NULL bilan farqi: NULL = sozlanmagan → RAD; 0 = atayin cheklovsiz → ruxsat.
4. **exam_pass_threshold NULL:** RAD (A4). Egasi har razryadga sozlamaguncha o'sish ishlamaydi — bu TO'G'RI (vizyon: 100%=mexanizm, data egasidan).
5. **Pasayish + imtihon bali:** decrease'da `examScore` e'tiborga olinmaydi; faqat `reason` majburiy.
6. **Bir karta uchun ikkita pending so'rov:** ruxsat (lekin UI faqat oxirgini ko'rsatishi mumkin). Manager-approve faqat `hr_approved` so'rovni o'zgartiradi — race yo'q (status guard).
7. **HR va rahbar bir shaxs (kichik tashkilot):** ikki imzo bir userId bo'lishi mumkin — egasi modeli buni taqiqlamaydi (RBAC rol bo'lsa kifoya). Agar egasi "har xil shaxs" desa → keyingi fazada qo'shiladi (hozir TAQIQ qo'shilmaydi — fabrikatsiya/over-engineering yo'q).
8. **Karta o'chirilgan/arxivlangan:** `cardRazryad` NOT_FOUND (org_departments topilmasa) → 404.
9. **`manager_id` ustun yo'q (DB-fakt):** bevosita rahbarni `head_user_id` + parent-chain'dan oling (`getDirectManager` mavjud). Bu fazada RBAC rol (`manager`/`director`) yetarli; aniq head_user_id moslik FAZA 8 (manager-zanjir). Soxta manager_id YOZMA.
10. **AI taklif:** `ai_suggested` ustun bor, lekin bu fazada har doim `false`. FAZA 10 AI so'rov yaratganda `true` qo'yadi. Bu fazada AI endpoint QO'SHILMAYDI.

---

## § 9. SELF-VERIFY (tsc + rollback-tx DB-proof + jonli isbot)

### 9.1 Typecheck
```bash
cd Uzbek-Language-Module
pnpm --filter @europrint/api exec tsc --noEmit   # BE o'z fayllarda 0 xato
pnpm --filter erp-dashboard exec tsc --noEmit     # FE 0 xato
```

### 9.2 Rollback-tx DB-proof skript (YANGI: `_audit/bproof-razryad-execution.cjs`)
> `_audit/bproof-razryad-config.cjs` shablonini ko'chir. Kirit→oqdi→ko'rindi→ROLLBACK (data SAQLANMAYDI).

```javascript
/** DB-PROOF (rollback-tx): razryad o'sish EXECUTION — so'rov -> 2-imzo -> UPDATE + history + sertifikat.
 *  Atomik tx ichida simulyatsiya; ROLLBACK -> hech narsa saqlanmaydi (faqat isbot). */
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' });
(async () => {
  const c = await pool.connect();
  try {
    // Tayyorgarlik: test-karta + razryad (1->2). exam_pass_threshold'ni vaqtincha 60 qil (rollback bilan qaytadi).
    const card = (await c.query(`SELECT id, razryad_level_id FROM org_departments WHERE node_type='position' AND is_active IS NOT FALSE LIMIT 1`)).rows[0];
    const r1 = (await c.query(`SELECT id FROM razryad_levels WHERE level=1`)).rows[0];
    const r2 = (await c.query(`SELECT id FROM razryad_levels WHERE level=2`)).rows[0];
    console.log('Test karta:', card.id, '| razryad 1->2:', r1.id, '->', r2.id);
    await c.query('BEGIN');
    // egasi-data simulyatsiya (exam_pass_threshold/min_months) — faqat tx ichida
    await c.query(`UPDATE razryad_levels SET exam_pass_threshold=60, min_months=3 WHERE id=$1`, [r2.id]);
    await c.query(`UPDATE org_departments SET razryad_level_id=$1 WHERE id=$2`, [r1.id, card.id]);
    // 1) So'rov (imtihon bali 75 > 60)
    const req = (await c.query(
      `INSERT INTO razryad_requests (card_id, target_razryad_id, current_razryad_id, request_type, exam_score, status, created_at, updated_at)
       VALUES ($1,$2,$3,'increase',75,'pending',NOW(),NOW()) RETURNING id`, [card.id, r2.id, r1.id])).rows[0];
    console.log('So\'rov yaratildi #', req.id, '(status=pending, bal=75)');
    // 2) HR imzo
    await c.query(`UPDATE razryad_requests SET status='hr_approved', hr_approved_by=1, hr_approved_at=NOW() WHERE id=$1`, [req.id]);
    console.log('HR imzo -> status=hr_approved');
    // 3) Rahbar imzo -> ATOMIK UPDATE + history
    await c.query(`UPDATE org_departments SET razryad_level_id=$1 WHERE id=$2`, [r2.id, card.id]);
    const cert = `CERT-RZ-${card.id}-TEST`;
    await c.query(
      `INSERT INTO razryad_history (card_id, old_razryad_id, new_razryad_id, change_type, exam_score, certificate_number, manager_approved_by, effective_at, created_at)
       VALUES ($1,$2,$3,'increase',75,$4,2,NOW(),NOW())`, [card.id, r1.id, r2.id, cert]);
    await c.query(`UPDATE razryad_requests SET status='approved', manager_approved_by=2, manager_approved_at=NOW() WHERE id=$1`, [req.id]);
    // KEYIN: ko'rindi
    const after = (await c.query(`SELECT razryad_level_id FROM org_departments WHERE id=$1`, [card.id])).rows[0];
    const hist = (await c.query(`SELECT old_razryad_id, new_razryad_id, change_type, certificate_number FROM razryad_history WHERE card_id=$1 ORDER BY id DESC LIMIT 1`, [card.id])).rows[0];
    console.log('KEYIN karta razryad:', after.razryad_level_id, '(=', r2.id, '?)');
    console.log('KEYIN history:', JSON.stringify(hist), '(cert=', cert, ')');
    await c.query('ROLLBACK');
    const back = (await c.query(`SELECT razryad_level_id FROM org_departments WHERE id=$1`, [card.id])).rows[0];
    console.log('ROLLBACK -> karta razryad qaytdi:', back.razryad_level_id, '(saqlanmadi — bu faqat isbot)');
  } catch (e) { try { await c.query('ROLLBACK'); } catch {} console.error('ERR', e.message); }
  finally { c.release(); await pool.end(); }
})();
```
```bash
node _audit/bproof-razryad-execution.cjs
# Kutilgan: KEYIN razryad = r2.id; history old->new + cert; ROLLBACK -> qaytdi.
```

### 9.3 3-oy guard RAD isboti (qo'shimcha skript yoki yuqoriga qo'sh)
```javascript
// effective_at = 1 oy oldin qo'y -> monthsPassed (~1) < min_months (3) -> service RAD qaytarishi kerak.
// DB-proof: history'ga effective_at=NOW()-INTERVAL '1 month' INSERT (tx) -> service.createRequest -> Err VALIDATION.
```

### 9.4 Jonli isbot (HTTP — backend qaytgach + login)
```bash
# 1) login -> token
TOKEN=$(curl -s -X POST http://127.0.0.1:3030/api/auth/login -H 'Content-Type: application/json' -d '{"username":"...","password":"..."}' | python -c "import sys,json;print(json.load(sys.stdin)['data']['accessToken'])")
# 2) so'rov yarat
curl -s -X POST http://127.0.0.1:3030/api/org-structure/cards/<CARD_ID>/razryad-requests -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"targetRazryadId":<R2_ID>,"requestType":"increase","examScore":75}'
# 3) HR imzo -> 4) rahbar imzo -> 5) tarix GET
curl -s http://127.0.0.1:3030/api/org-structure/cards/<CARD_ID>/razryad-history -H "Authorization: Bearer $TOKEN"
```
> **Q-44:** Agar `/api/auth/health` 000 (butun server tushgan, Windows nest-watch bug) — bu KOD xatosi EMAS. Dev-serverni qayta ishga tushir; static fallback (tsc + DB-proof) bilan tasdiqla, jonli HTTP server qaytgach.

---

## § 10. OWNER-DATA (FABRIKATSIYA TAQIQ — egasi to'ldiradi, productionda 0 dan)

| Data | Hozir (JONLI) | Kim/qachon | Bu faza ta'siri |
|------|---------------|-----------|-----------------|
| `razryad_levels.exam_pass_threshold` (har razryad o'tish-chegarasi %) | NULL (6/6 qatorda) | Egasi/HR, RazryadLevelsPanel orqali | NULL → o'sish so'rovi RAD (A4) — to'ldirilmaguncha o'sish ishlamaydi (TO'G'RI: mexanizm tayyor, data kutilmoqda) |
| `razryad_levels.min_months` (≥3 oy oraliq) | 0 (6/6 — atayin yoki sozlanmagan?) | Egasi/HR | 0 = cheklovsiz; egasi 3 qo'ysa guard ishlaydi |
| `razryad_levels.max_retakes` | NULL | Egasi/HR | Bu fazada ishlatilmaydi (qayta-topshirish UI alohida faza) |
| `org_departments.razryad_level_id` (karta razryadi) | 0/139 | Egasi/HR, RazryadTab Select orqali | Karta razryadsiz bo'lsa o'sish = initial (NULL→target) |
| `org_departments.head_user_id` (bevosita rahbar) | 18/139 | Egasi (kim-kimni-boshqaradi) | 2-imzo rahbar moslik FAZA 8; bu fazada RBAC rol yetarli |
| Imtihon natijasi (`exam_score`) | — | HR/usta kiritadi (yoki FAZA 10 AI-grading) | API'dan keladi; soxta generatsiya YO'Q |

> **MUHIM:** Bu fazada hech qanday owner-data SOXTA to'ldirilmaydi. `bproof-*.cjs` ichidagi `exam_pass_threshold=60` faqat ROLLBACK-tx isbot uchun (DB'ga saqlanmaydi). Productionda egasi RazryadLevelsPanel orqali kiritadi.

---

## § 11. COMMIT TARTIBI (har bosqich — faqat o'z fayl, --no-verify, Co-Authored-By)

```bash
# Bosqich 0 (migration)
git add apps/api/src/shared/db/invariants/migrations-drift.ts
git commit --no-verify -m "$(cat <<'EOF'
feat(org): razryad_history + razryad_requests jadval (FAZA 03, APPROVED)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"

# Bosqich 1 (repo)
git add apps/api/src/modules/org-structure/razryad-history.repository.ts
git commit --no-verify -m "feat(org): RazryadHistoryRepository (FAZA 03)..."

# Bosqich 2 (service)
git add apps/api/src/modules/org-structure/razryad-history.service.ts
git commit --no-verify -m "feat(org): RazryadHistoryService 2-imzo+3-oy guard (FAZA 03)..."

# Bosqich 3 (controller)
git add apps/api/src/modules/org-structure/razryad-history.controller.ts
git commit --no-verify -m "feat(org): RazryadHistory endpointlar (FAZA 03)..."

# Bosqich 4 (module)
git add apps/api/src/modules/org-structure/org-structure.module.ts
git commit --no-verify -m "feat(org): RazryadHistory DI ulanishi (FAZA 03)..."

# Bosqich 5 (FE)
git add artifacts/erp-dashboard/src/components/hr/orgnode/RazryadTab.tsx
# (agar alohida fayl: git add .../RazryadExecutionSection.tsx)
git commit --no-verify -m "feat(fe): RazryadTab o'sish/pasayish+tarix (FAZA 03)..."

# DB-proof skript (ixtiyoriy commit — _audit/)
git add _audit/bproof-razryad-execution.cjs
git commit --no-verify -m "test(org): razryad execution DB-proof (FAZA 03)..."
```

> `git add -A` / `git add .` TAQIQ (Qoida 23). Faqat aniq fayllar. Log fayl HECH QACHON commit qilinmaydi (Q-45).

---

## § 12. YAKUNIY HOLAT HISOBOTI (egasiga — Q-38)

Faza oxirida quyidagi formatda hisobot ber:
- **DONE:** razryad_history + razryad_requests jadval; RazryadHistory repo/service/controller; module ulanishi; RazryadTab o'sish/pasayish+tarix; 2-imzo workflow; 3-oy guard; fabrikatsiya-gate.
- **DB-PROOF:** `bproof-razryad-execution.cjs` natija (o'sish kuchga kirdi+history+cert; rollback qaytdi).
- **JONLI:** HTTP login→so'rov→HR-imzo→rahbar-imzo→tarix natija (yoki Q-44 fallback sababi).
- **DEFER (keyingi faza):** oylik ulanishi (FAZA 4), attestatsiya cron (`next_attestation_date` ustun tayyor), AI taklif (FAZA 10, `ai_suggested` tayyor), savol-bank UI, qayta-topshirish UI (`max_retakes`).
- **OWNER-DATA kutilmoqda:** `exam_pass_threshold` (6/6 NULL), `min_months` (0→egasi 3 qo'yadi), `razryad_level_id` biriktirish (0/139).
- **COMMIT'lar:** har bosqich hash ro'yxati.

---

## § 13. XULOSA — VIZYON MOSLIK (Q-40)

Bu faza tugagach, razryad mavzusi 38% → mexanizm-100% ga yetadi:
- EP-ORG-010 (imtihon→HR+rahbar tasdiq→o'zgarish) ✅ MEXANIZM
- EP-ORG-011 (≥3 oy oraliq) ✅ guard
- EP-ORG-012 (pasayish HR+rahbar+sabab) ✅
- EP-ORG-013 (HR hujjat + ichki sertifikat) ✅ certificate_number
- EP-ORG-067/070 (audit immutable) ✅ history INSERT-only
- EP-ORG-091 (karyera yo'li) ✅ narvon (mavjud) + o'sish workflow
- Data (threshold/min_months/biriktirish) = egasi to'ldiradi (fabrikatsiya yo'q, Q2).

**TUGADI.**
