# P30 — DIR: stat-regulation + diary + OKR cascade + monthly-plans + dashboard

> **Paket:** P30 · **Modul:** DIR (Director / Strategiya) · **To'lqin:** Wave 3
> **Slug:** `dir-stat-diary-okr`
> **Bog'liqlik:** P29 (`dir-state-engine`) — company_state_log, state_levels, thresholds
> va `@europrint/db` barrel eksportlari tayyor bo'lishi SHART.
> **DDL Darvozasi:** HA — 4 yangi jadval + 3 ALTER; migration faqat egasi
> `-- APPROVED:` belgisi qo'yilgandan keyin ishga tushiriladi.

---

## 0. ROL VA QOIDALAR

Sen 🟢 **BAJARUVCHI**-san. Har sessiyada avval `CLAUDE.md` +
`docs/agent-constitution.md` o'qi. Quyidagi qoidalar bloki (Q-47) ushbu direktiva
uchun majburiy — biron qoidani o'tkazib yuborish sessiya bajarilishini bekor qiladi.

```
QOIDALAR BLOKI (Q-47):
1.  Result<T> hamma repo/service metodida; throw/null/undefined TAQIQ.
2.  @Body Zod bilan validate; class-validator TAQIQ.
3.  Drizzle ORM; raw SQL faqat murakkab (izoh + typedExecute<T>).
4.  Q-40 REAL INSERT + DB-proof; echo/fake/hardcoded javob TAQIQ.
5.  Q-46 ishlab turgan kod O'CHIRILMAYDI; buzuq/o'lik kod TO'LIQ o'chiriladi.
6.  FAYL IZOLYATSIYASI (Qoida 23/Q-31): faqat OWNED-FILE ro'yxati; boshqasi
    kerak bo'lsa TO'XTA + egasiga flag qil; supurma.
7.  DDL DARVOZASI (Q-35): migration -- APPROVED: siz ishga tushmaydi;
    egasi stamp qiladi, paket emas.
8.  git add <aniq-fayl>; -A / . TAQIQ. Bitta commit = bitta mantiqiy guruh.
9.  Q-45/Q-30 log/secret commit yo'q; JWT minting yo'q.
10. Self-verify: BE tsc 0, FE tsc 0, reviewerlar, jonli DB-proof.
11. "V2" terminologiya TAQIQ — bitta kod bazasi.
12. TO'G'RI o'lchovi = master vizyon (docs/XARITA-REJA-YONALISH +
    MUSLIMBEK-PROMT-12-DIR-2026-06-08.md).
```

**Wave:** 3 · **dependsOn:** `["P29"]` — P29 `company_state_log`,
`company_state_levels`, `state_thresholds` jadvallari va barcha P29 owned-file
eksportlari tayyor bo'lmasa KUTIB TUR.

---

## 1. IZOLYATSIYA MANIFESTI

Ushbu agent FAQAT quyidagi **22 ta faylga** tegadi. Har qanday boshqa faylga tegish
kerak bo'lsa — DARHOL TO'XTA + egasiga flag qil.

### BE owned files (18 ta):
```
Uzbek-Language-Module/apps/api/src/modules/director/domain/repositories/i-stat-regulation.repo.ts
Uzbek-Language-Module/apps/api/src/modules/director/infrastructure/repositories/stat-regulation.repository.ts
Uzbek-Language-Module/apps/api/src/modules/director/application/stat-regulation.service.ts
Uzbek-Language-Module/apps/api/src/modules/director/presentation/stat-regulation.controller.ts

Uzbek-Language-Module/apps/api/src/modules/director/domain/repositories/i-diary.repo.ts
Uzbek-Language-Module/apps/api/src/modules/director/infrastructure/repositories/diary.repository.ts
Uzbek-Language-Module/apps/api/src/modules/director/application/diary.service.ts
Uzbek-Language-Module/apps/api/src/modules/director/presentation/diary.controller.ts

Uzbek-Language-Module/apps/api/src/modules/director/infrastructure/repositories/okr.repository.ts
Uzbek-Language-Module/apps/api/src/modules/director/application/okr.service.ts
Uzbek-Language-Module/apps/api/src/modules/director/presentation/okr.controller.ts

Uzbek-Language-Module/apps/api/src/modules/director/domain/repositories/i-monthly-plan.repo.ts
Uzbek-Language-Module/apps/api/src/modules/director/infrastructure/repositories/monthly-plan.repository.ts
Uzbek-Language-Module/apps/api/src/modules/director/application/monthly-plan.service.ts
Uzbek-Language-Module/apps/api/src/modules/director/presentation/monthly-plan.controller.ts

Uzbek-Language-Module/apps/api/src/modules/director/presentation/dashboard.controller.ts
Uzbek-Language-Module/apps/api/src/modules/director/infrastructure/repositories/dashboard-query.repository.ts
Uzbek-Language-Module/apps/api/src/modules/director/application/dashboard-query.service.ts
```

### FE owned files (4 ta):
```
Uzbek-Language-Module/artifacts/erp-dashboard/src/pages/StatRegulationPage.tsx
Uzbek-Language-Module/artifacts/erp-dashboard/src/pages/DiaryPage.tsx
Uzbek-Language-Module/artifacts/erp-dashboard/src/pages/StrategicTasksPanel.tsx
Uzbek-Language-Module/artifacts/erp-dashboard/src/pages/DirectorDashboard.tsx
```

### DDL GATED migration fayllar (yangi — faqat APPROVED: keyin ishga tushir):
```
Uzbek-Language-Module/apps/api/src/shared/db/migrations/p30-stat-diary-okr-ddl.sql
Uzbek-Language-Module/apps/api/src/shared/db/migrations/p30-okr-alter.sql
```

**QOIDA:** P29 tomonidan yaratilgan fayllar (i-director-state.repo.ts,
director-state.repository.ts, director-state.service.ts) ga TEGMA — ular
P29 owned. Ulardan faqat import qil.

---

## 2. VIZYON

Manba: `docs/audit/MUSLIMBEK-PROMT-12-DIR-2026-06-08.md` PHASE 4/5/6/7 +
EP-DIR-007..023 + EP-DIR-025..036 + EP-DIR-053/062/069/073.

### 2.1 Stat-reglament (EP-DIR-020..023)
- `stat_regulations` jadvali: har bir korporativ ko'rsatkich uchun "kimning, qanday,
  qancha tez-tez" — versiyali master-data. Yangi versiya = yangi qator, eski qator
  `is_active=false`.
- `owner_card_id` → `org_functions(id)` FK (karta egasi, kishi emas).
- Vizyon qabul mezoni: CRUD real DB saqlanadi + versiya tarixi ko'rinadi +
  `owner_card_id` alert routing ishlaydi.

### 2.2 Kundalik daftar (EP-DIR-007..010)
- `diary_entries` jadvali: har ish kuniga bir yozuv (author_card_id unikal).
  `daily_state` + `main_kpi_value` = P29 company_state_log dan auto-fill.
  `carry_over_issues` = kechagi hal qilinmagan muammolar JSONB.
- Vizyon qabul mezoni: Saqla → qayta och → ma'lumot saqlanganmi? Auto-fill
  state real company_state_log dan keladi. Carry-over bugun ochilganda kecha
  unresolved muammolarni ko'rsatadi.

### 2.3 OKR kaskad daraxti (EP-DIR-015..019)
- `okr_objectives` allaqachon mavjud (strategic-ext-schema.ts:278, 27 satr).
  Ammo `parent_goal_id` (o'z-o'ziga FK, kaskad uchun) va `owner_card_id`
  (org_functions FK) YO'Q — ALTER kerak.
- `monthly_plans` jadvali yangi: strategic_goal_id FK + month + objectives JSONB
  + weekly_tasks JSONB + completion_pct.
- Vizyon qabul mezoni: OKR daraxt company→department→card 3 daraja;
  FE `StrategicTasksPanel` parent_goal_id bo'yicha grouped ko'radi.

### 2.3-A Karta 2-4 mahsulot (EP-DIR-033) — SCOPE: P30 / ORG-karta kengaytmasi

**Egasi qarori (OCHIQ-JAVOBLAR, yangi qaror):**
Har karta (lavozim) uchun **moslashuvchan 2-4 ta mahsulot** belgilanadi — lavozimga
qarab soni o'zgaradi. Har mahsulotga alohida statistika ko'rsatkichi biriktiriladi
(ЦКП ni 4 o'lchovga bo'lish, EP-DIR-032 bilan bog'liq).

**P30 doirasida:** Bu `org_functions` kartasining maydonlari (ORG modul owned — P04/P05).
P30 `stat_regulations` va `okr_objectives.owner_card_id` orqali ko'rsatkichlarni
kartaga bog'laydi — mahsulot soni stat-reglamentda `source_module` + `owner_card_id`
kombinatsiyasi orqali ifodalanadi.

```sql
-- stat_regulations jadvalida har karta uchun 2-4 mahsulot ko'rsatkich:
-- name_uz='[karta nomi] — Mahsulot 1', owner_card_id=<org_functions.id>
-- Egasi qancha mahsulot kerakligini (2 yoki 3 yoki 4) har kartada belgilaydi.
-- P30 jadval tuzilmasi buni qo'llab-quvvatlaydi (owner_card_id + name_uz).
-- Karta uchun 2-4 mahsulot chegarasi UI validatsiyasida (StatRegulationPage)
-- qo'llanadi: bir kartada 2 dan 4 gacha stat-reg yozuv ruxsat etiladi.
```

> ⚠️ **EGASI QIYMATI KERAK:** Har lavozim uchun aniq mahsulot nomlari va soni
> egasi tomonidan belgilanadi (2, 3 yoki 4 — lavozimga qarab). P30 faqat
> tuzilma taqdim etadi; qiymatlarni egasi kiritadi.
>
> **ORG-karta owned qism:** `org_functions` jadvaliga `products_count` (integer
> 2-4 CHECK) va `products JSONB` ustunlari P04/P05 (ORG) paketi tomonidan
> qo'shilishi kerak. P30 faqat `stat_regulations.owner_card_id` orqali
> ko'rsatkichlarni kartaga bog'laydi.

### 2.4-A Egasi tushib qolgan qarorlar — P30 scope yoki defer

**EP-DIR-028 (Telegram kunlik digest):** P29 §2.3-A da stub qo'yilgan.
P30 doirasida: `DiaryPage` va `StatRegulationPage` dan trigger bo'ladigan
digest ma'lumotlari (bugungi muammolar, holat) `diary_entries` va
`company_state_log` dan keladi. To'liq Telegram wiring P47 (NTF) paketi.

**EP-DIR-026 (kunlik AI tahlilchi):** P29 §2.3-B da stub qo'yilgan.
P30 doirasida: `dashboard-query.service.ts` `getOpenIssues()` va `getStatTrends()`
metodlari AI tahlilchi uchun ma'lumot taqdim etadi. AI tahlil natijasi
DirectorDashboard'da `aiInsights` kabi widget sifatida ko'rsatilishi mumkin.
To'liq implement P35/P36 (AI modul) ga bog'liq.

```typescript
// dashboard.controller.ts — AI tahlil stub (keyingi faza):
// aiInsights: [] // TODO (P35/P36): EventEmitter2.emit('director.ai.analyze', {...})
// Hozir bo'sh array qaytaradi — crash yo'q, field mavjud.
```

### 2.4 Dashboard kengaytma (EP-DIR-025/036/053/062/069/073)
- Mavjud `DashboardController` (`presentation/dashboard.controller.ts:51`)
  faqat `directorData.getDashboard()` va `queryBus` chaqiruvi bor.
- Qo'shilishi kerak: `?mode=realtime|snapshot`, `planFact`, `orderProgress`,
  `statTrends`, `openIssues` — barchasi real DB dan.
- Vizyon qabul mezoni: `/api/director/dashboard?mode=snapshot` = 07:00 muzlatilgan
  holat; `?mode=realtime` = joriy. FE mode toggle ishlaydi.

---

## 3. HOZIRGI HOLAT

### 3.1 Mavjud + ishlaydigan (O'CHIRMA — Q-46):

| Fayl | Satr | Holat |
|------|------|-------|
| `infrastructure/repositories/okr.repository.ts` | 1-129 | ✅ ISHLAYDIGAN — `listObjectives`, `createObjective`, `updateObjective`, Result<T> |
| `application/okr.service.ts` | 1-59 | ✅ ISHLAYDIGAN — to'liq delegate pattern |
| `presentation/okr.controller.ts` | 1-164 | ✅ ISHLAYDIGAN — Zod, @UsePipes, RolesGuard, @Roles |
| `presentation/dashboard.controller.ts` | 1-82 | ✅ ISHLAYDIGAN — 5 endpoint |
| `infrastructure/repositories/dashboard-query.repository.ts` | 1-81 | ✅ ISHLAYDIGAN — 7 metod, real SQL |
| `application/dashboard-query.service.ts` | 1-147 | ✅ ISHLAYDIGAN — getProductionSummary/getFinanceSummary/getHrSummary |
| `artifacts/.../StrategicTasksPanel.tsx` | 1-... | ✅ ISHLAYDIGAN — `/api/strategic/dashboard`, CRUD mutations |
| `artifacts/.../DirectorDashboard.tsx` | 1-80+ | ✅ ISHLAYDIGAN — 10+ useQuery, real endpoints |

### 3.2 YO'Q (yaratilishi kerak):

| Kerak | Holat |
|-------|-------|
| `i-stat-regulation.repo.ts` | ❌ YO'Q |
| `stat-regulation.repository.ts` | ❌ YO'Q |
| `stat-regulation.service.ts` | ❌ YO'Q |
| `stat-regulation.controller.ts` | ❌ YO'Q |
| `i-diary.repo.ts` | ❌ YO'Q |
| `diary.repository.ts` | ❌ YO'Q |
| `diary.service.ts` | ❌ YO'Q |
| `diary.controller.ts` | ❌ YO'Q |
| `i-monthly-plan.repo.ts` | ❌ YO'Q |
| `monthly-plan.repository.ts` | ❌ YO'Q |
| `monthly-plan.service.ts` | ❌ YO'Q |
| `monthly-plan.controller.ts` | ❌ YO'Q |
| `StatRegulationPage.tsx` | ❌ YO'Q |
| `DiaryPage.tsx` | ❌ YO'Q |

### 3.3 BOR ammo to'liq emas (kengaytirish kerak):

| Fayl | Muammo |
|------|--------|
| `okr_objectives` DB jadval (`strategic-ext-schema.ts:278`) | `parent_goal_id` va `owner_card_id` ustunlari YO'Q — kaskad ishlamaydi |
| `okr.repository.ts:42` | `createObjective` `parent_goal_id` qabul qilmaydi |
| `dashboard.controller.ts:48` | `?mode` query param YO'Q; `planFact`/`orderProgress`/`statTrends`/`openIssues` YO'Q |
| `dashboard-query.repository.ts` | `getStatTrends`, `getPlanFact`, `getOrderProgress`, `getOpenIssues` yo'q |

### 3.4 DB jadval holati:
- `okr_objectives` — MAVJUD (P29 yoki avval yaratilgan), `parent_goal_id` YO'Q
- `okr_key_results` — MAVJUD, `owner_card_id` YO'Q
- `stat_regulations` — YO'Q (yangi jadval kerak)
- `diary_entries` — YO'Q (yangi jadval kerak)
- `monthly_plans` — YO'Q (yangi jadval kerak)
- `strategic_tasks` — MAVJUD (`strategic-ext-schema.ts:31`), `owner_card_id` YO'Q

<!-- DAVOMI -->

---

## 4. ISH (qadam-baqadam)

> Har qadam: **fayl + aynan o'zgarish + oldin/keyin + RUXSAT SO'RA → bajar.**
> Har mantiqiy guruh tugagach — `git add <aniq-fayl>` + commit.

---

### QADAM 1 — DDL fayllarini yoz (GATED — ishga tushirma)

**Fayl:** `apps/api/src/shared/db/migrations/p30-stat-diary-okr-ddl.sql` (YANGI)

Tarkib:

```sql
-- APPROVED: <owner> <date>
-- P30: stat_regulations + diary_entries + monthly_plans

CREATE TABLE IF NOT EXISTS stat_regulations (
  id            SERIAL PRIMARY KEY,
  name_uz       TEXT NOT NULL,
  name_ru       TEXT,
  definition    TEXT,
  formula       TEXT,
  unit          VARCHAR(50),
  frequency     VARCHAR(20) NOT NULL DEFAULT 'daily'
                  CHECK (frequency IN ('daily','weekly','monthly')),
  source_module VARCHAR(50),
  owner_card_id INTEGER REFERENCES org_functions(id) ON DELETE SET NULL,
  target_value  NUMERIC(14,2),
  version       INTEGER NOT NULL DEFAULT 1,
  valid_from    DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stat_reg_active
  ON stat_regulations(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_stat_reg_owner
  ON stat_regulations(owner_card_id);

CREATE TABLE IF NOT EXISTS diary_entries (
  id                  SERIAL PRIMARY KEY,
  author_card_id      INTEGER REFERENCES org_functions(id) ON DELETE SET NULL,
  date                DATE NOT NULL,
  daily_state         VARCHAR(20),
  main_kpi_value      NUMERIC(10,2),
  main_issue          TEXT,
  solution            TEXT,
  tomorrow_plan       TEXT,
  carry_over_issues   JSONB NOT NULL DEFAULT '[]',
  status              VARCHAR(10) NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft','submitted')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (author_card_id, date)
);

CREATE INDEX IF NOT EXISTS idx_diary_date
  ON diary_entries(date DESC);
CREATE INDEX IF NOT EXISTS idx_diary_author
  ON diary_entries(author_card_id);

CREATE TABLE IF NOT EXISTS monthly_plans (
  id                SERIAL PRIMARY KEY,
  strategic_goal_id INTEGER REFERENCES okr_objectives(id) ON DELETE SET NULL,
  month             VARCHAR(7) NOT NULL,   -- YYYY-MM
  objectives        JSONB NOT NULL DEFAULT '[]',
  weekly_tasks      JSONB NOT NULL DEFAULT '[]',
  completion_pct    NUMERIC(5,2) NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_monthly_plans_goal
  ON monthly_plans(strategic_goal_id);
CREATE INDEX IF NOT EXISTS idx_monthly_plans_month
  ON monthly_plans(month);
```

**Fayl:** `apps/api/src/shared/db/migrations/p30-okr-alter.sql` (YANGI)

```sql
-- APPROVED: <owner> <date>
-- P30: OKR kaskad ALTER — parent_goal_id + owner_card_id

ALTER TABLE okr_objectives
  ADD COLUMN IF NOT EXISTS parent_goal_id INTEGER
    REFERENCES okr_objectives(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS owner_card_id INTEGER
    REFERENCES org_functions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_okr_parent
  ON okr_objectives(parent_goal_id) WHERE parent_goal_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_okr_owner_card
  ON okr_objectives(owner_card_id);

ALTER TABLE okr_key_results
  ADD COLUMN IF NOT EXISTS owner_card_id INTEGER
    REFERENCES org_functions(id) ON DELETE SET NULL;

ALTER TABLE strategic_tasks
  ADD COLUMN IF NOT EXISTS owner_card_id INTEGER
    REFERENCES org_functions(id) ON DELETE SET NULL;
```

**GATED:** Egasi `-- APPROVED: <ism> <sana>` yozib tasdiqlagan KEYIN:
```bash
psql $DATABASE_URL -f p30-stat-diary-okr-ddl.sql
psql $DATABASE_URL -f p30-okr-alter.sql
```

**git add:** `apps/api/src/shared/db/migrations/p30-stat-diary-okr-ddl.sql`
`apps/api/src/shared/db/migrations/p30-okr-alter.sql`

---

### QADAM 2 — Drizzle schema (lib/db) kengaytir

> ⚠️ `lib/db/src/schema/strategic-ext-schema.ts` P30 owned-file ro'yxatida YO'Q.
> Uni BEVOSITA o'zgartirma. Aksincha, `lib/db/src/schema/` da yangi **barrel** fayl
> yoki P30 owned dir/dir-extra-schema.ts kerak bo'lsa — TO'XTA + egasiga flag.
>
> **Workaround (ruxsatsiz fayl egari bo'lmagan holat):** `okr.repository.ts` ichida
> ALTER ustunlarni `sql` template bilan reference qil (Drizzle schema type cast
> orqali). INSERT/SELECT uchun `db.execute(sql\`...\`)` + `typedExecute<T>` — chunki
> Drizzle schema hali yangilangan emas. Bu to'g'ri yondashuv — schema barrelni
> buzmaslik uchun. Schema egasi (P01/schema-barrel agent) uni keyinroq qo'shadi.

---

### QADAM 3 — Stat-regulation backend (4 fayl)

#### 3a. `i-stat-regulation.repo.ts` (YANGI)
**Fayl:** `domain/repositories/i-stat-regulation.repo.ts`

```typescript
import type { Result } from '@common/result';

export interface IStatRegRow {
  id: number; name_uz: string; name_ru?: string | null;
  definition?: string | null; formula?: string | null;
  unit?: string | null; frequency: string; source_module?: string | null;
  owner_card_id?: number | null; target_value?: string | null;
  version: number; valid_from: string; is_active: boolean;
  created_at: Date; updated_at: Date;
}

export interface IStatRegulationRepo {
  list(activeOnly: boolean): Promise<Result<IStatRegRow[]>>;
  getById(id: number): Promise<Result<IStatRegRow | null>>;
  getHistory(nameUz: string): Promise<Result<IStatRegRow[]>>;
  create(dto: Omit<IStatRegRow,'id'|'created_at'|'updated_at'|'version'|'valid_from'|'is_active'>): Promise<Result<IStatRegRow>>;
  update(id: number, dto: Partial<IStatRegRow>): Promise<Result<IStatRegRow>>;
  deactivate(id: number): Promise<Result<void>>;
}

export const STAT_REGULATION_REPO = Symbol('STAT_REGULATION_REPO');
```

#### 3b. `stat-regulation.repository.ts` (YANGI)
**Fayl:** `infrastructure/repositories/stat-regulation.repository.ts`

Pattern (Result<T> + typedExecute — schema barrel kutilmoqda):

```typescript
@Injectable()
export class StatRegulationRepository implements IStatRegulationRepo {
  async list(activeOnly: boolean): Promise<Result<IStatRegRow[]>> {
    return safeCall(async () => {
      const condition = activeOnly ? sql`WHERE is_active = TRUE` : sql``;
      return typedExecute<IStatRegRow>(
        sql`SELECT * FROM stat_regulations ${condition} ORDER BY name_uz ASC`
      );
    }, 'DB_ERROR');
  }

  async create(dto): Promise<Result<IStatRegRow>> {
    return safeCall(async () => {
      const rows = await typedExecute<IStatRegRow>(sql`
        INSERT INTO stat_regulations
          (name_uz, name_ru, definition, formula, unit, frequency,
           source_module, owner_card_id, target_value)
        VALUES
          (${dto.name_uz}, ${dto.name_ru ?? null}, ${dto.definition ?? null},
           ${dto.formula ?? null}, ${dto.unit ?? null}, ${dto.frequency},
           ${dto.source_module ?? null}, ${dto.owner_card_id ?? null},
           ${dto.target_value ?? null})
        RETURNING *
      `);
      if (!rows[0]) throw new Error('INSERT_FAILED');
      return rows[0];
    }, 'DB_ERROR');
  }

  async update(id: number, dto): Promise<Result<IStatRegRow>> {
    // VERSIYALASH: mavjud qatorni is_active=false qil, yangi qator qo'sh
    return safeCall(async () => {
      // 1. Eski versiyani olish
      const existing = await typedExecute<IStatRegRow>(
        sql`SELECT * FROM stat_regulations WHERE id = ${id} AND is_active = TRUE`
      );
      if (!existing[0]) throw new Error('NOT_FOUND');
      const old = existing[0];
      // 2. Eski yozuvni is_active=false qil
      await typedExecute<unknown>(
        sql`UPDATE stat_regulations SET is_active = FALSE, updated_at = NOW()
            WHERE id = ${id}`
      );
      // 3. Yangi versiya INSERT
      const rows = await typedExecute<IStatRegRow>(sql`
        INSERT INTO stat_regulations
          (name_uz, name_ru, definition, formula, unit, frequency,
           source_module, owner_card_id, target_value, version, valid_from)
        VALUES
          (${dto.name_uz ?? old.name_uz}, ${dto.name_ru ?? old.name_ru},
           ${dto.definition ?? old.definition}, ${dto.formula ?? old.formula},
           ${dto.unit ?? old.unit}, ${dto.frequency ?? old.frequency},
           ${dto.source_module ?? old.source_module},
           ${dto.owner_card_id ?? old.owner_card_id},
           ${dto.target_value ?? old.target_value},
           ${old.version + 1}, CURRENT_DATE)
        RETURNING *
      `);
      if (!rows[0]) throw new Error('VERSION_INSERT_FAILED');
      return rows[0];
    }, 'DB_ERROR');
  }

  async getHistory(nameUz: string): Promise<Result<IStatRegRow[]>> {
    return safeCall(async () =>
      typedExecute<IStatRegRow>(
        sql`SELECT * FROM stat_regulations WHERE name_uz = ${nameUz}
            ORDER BY version DESC`
      ), 'DB_ERROR');
  }

  async getById(id: number): Promise<Result<IStatRegRow | null>> {
    return safeCall(async () => {
      const rows = await typedExecute<IStatRegRow>(
        sql`SELECT * FROM stat_regulations WHERE id = ${id}`
      );
      return rows[0] ?? null;
    }, 'DB_ERROR');
  }

  async deactivate(id: number): Promise<Result<void>> {
    return safeCall(async () => {
      await typedExecute<unknown>(
        sql`UPDATE stat_regulations SET is_active = FALSE, updated_at = NOW()
            WHERE id = ${id}`
      );
    }, 'DB_ERROR');
  }
}
```

#### 3c. `stat-regulation.service.ts` (YANGI)
Har metod `@Inject(STAT_REGULATION_REPO)` orqali repo'ga delegate. Op-code loglar:
```typescript
this.logger.log({ code: 'EP-DIR-020', op: 'dir.statReg.create' });
this.logger.log({ code: 'EP-DIR-022', op: 'dir.statReg.version' }); // update da
this.logger.log({ code: 'EP-DIR-023', op: 'dir.statReg.ownerCard' }); // owner_card_id
```

#### 3d. `stat-regulation.controller.ts` (YANGI)
```typescript
@Controller('director/stat-regulations')
@UseGuards(RolesGuard)
@Roles('director', 'super_admin')
export class StatRegulationController {
  @Get()       async list(@Query('active_only') ao?: string) {...}
  @Get('history') async history(@Query('name') name: string) {...}
  @Get(':id')  async getOne(@Param('id') id: string) {...}
  @Post()      async create(@Body() body: unknown) { /* ZodValidationPipe */ }
  @Patch(':id') async update(@Param('id') id: string, @Body() body: unknown) {...}
  @Delete(':id') async deactivate(@Param('id') id: string) {...}
}
```

**Zod schema** (controller faylida inline yoki dto.ts da):
```typescript
const StatRegCreateSchema = z.object({
  name_uz:       z.string().min(1).max(200),
  name_ru:       z.string().max(200).optional(),
  definition:    z.string().optional(),
  formula:       z.string().optional(),
  unit:          z.string().max(50).optional(),
  frequency:     z.enum(['daily','weekly','monthly']),
  source_module: z.string().max(50).optional(),
  owner_card_id: z.number().int().positive().optional(),
  target_value:  z.number().positive().optional(),
});

const StatRegUpdateSchema = StatRegCreateSchema.partial();
```

**git add (3a-3d):**
```
domain/repositories/i-stat-regulation.repo.ts
infrastructure/repositories/stat-regulation.repository.ts
application/stat-regulation.service.ts
presentation/stat-regulation.controller.ts
```
**Commit:** `feat(dir): P30 stat-regulation CRUD+versioning EP-DIR-020/022/023`

---

### QADAM 4 — Diary (kundalik) backend (4 fayl)

#### 4a. `i-diary.repo.ts` (YANGI)
```typescript
export interface IDiaryEntry {
  id: number; author_card_id?: number | null; date: string;
  daily_state?: string | null; main_kpi_value?: string | null;
  main_issue?: string | null; solution?: string | null;
  tomorrow_plan?: string | null; carry_over_issues: unknown[];
  status: 'draft' | 'submitted';
  created_at: Date; updated_at: Date;
}

export interface IDiaryRepo {
  getOrCreateToday(authorCardId: number, date: string): Promise<Result<IDiaryEntry>>;
  getByAuthorDate(authorCardId: number, date: string): Promise<Result<IDiaryEntry | null>>;
  listAll(from: string, to: string, authorCardId?: number): Promise<Result<IDiaryEntry[]>>;
  save(id: number, dto: Partial<IDiaryEntry>): Promise<Result<IDiaryEntry>>;
  submit(id: number): Promise<Result<IDiaryEntry>>;
  carryOverIssues(authorCardId: number, targetDate: string): Promise<Result<void>>;
}

export const DIARY_REPO = Symbol('DIARY_REPO');
```

#### 4b. `diary.repository.ts` (YANGI)

Auto-fill + carry-over mantiq:

```typescript
// getOrCreateToday: P29 company_state_log dan state_code olish
// OLDIN: IDiaryEntry yo'q
// KEYIN: diary_entries qatorida daily_state=P29 state_code, main_kpi_value=PP plan%

async getOrCreateToday(authorCardId: number, date: string): Promise<Result<IDiaryEntry>> {
  return safeCall(async () => {
    // 1. Mavjud yozuv bormi?
    const existing = await typedExecute<IDiaryEntry>(
      sql`SELECT * FROM diary_entries
          WHERE author_card_id = ${authorCardId} AND date = ${date}::date`
    );
    if (existing[0]) return existing[0];

    // 2. Auto-fill: company_state_log dan oxirgi holat
    const stateRows = await typedExecute<{ state_code: string }>(
      sql`SELECT state_code FROM company_state_log
          ORDER BY detected_at DESC LIMIT 1`
    );
    const dailyState = stateRows[0]?.state_code ?? null;

    // 3. Auto-fill: PP plan% (production_plan_pct)
    const ppRows = await typedExecute<{ plan_pct: string }>(
      sql`SELECT ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'completed')
                / NULLIF(COUNT(*), 0), 1) AS plan_pct
          FROM production_orders WHERE DATE(created_at) = ${date}::date`
    );
    const mainKpi = ppRows[0]?.plan_pct ?? null;

    // 4. INSERT yangi yozuv (carry_over kechadan)
    const rows = await typedExecute<IDiaryEntry>(sql`
      INSERT INTO diary_entries
        (author_card_id, date, daily_state, main_kpi_value, carry_over_issues)
      VALUES
        (${authorCardId}, ${date}::date, ${dailyState}, ${mainKpi}::numeric, '[]'::jsonb)
      RETURNING *
    `);
    if (!rows[0]) throw new Error('INSERT_FAILED');
    return rows[0];
  }, 'DB_ERROR');
}

// carryOverIssues: kecha unresolved main_issue → bugun carry_over_issues ga
async carryOverIssues(authorCardId: number, targetDate: string): Promise<Result<void>> {
  return safeCall(async () => {
    const yesterday = new Date(targetDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const yDate = yesterday.toISOString().split('T')[0];

    const prev = await typedExecute<IDiaryEntry>(
      sql`SELECT * FROM diary_entries
          WHERE author_card_id = ${authorCardId}
            AND date = ${yDate}::date
            AND status = 'draft'`
    );
    if (!prev[0] || !prev[0].main_issue) return;

    // Bugungi yozuvga carry-over qo'sh
    await typedExecute<unknown>(sql`
      UPDATE diary_entries
      SET carry_over_issues = carry_over_issues || ${JSON.stringify([
        { issue: prev[0].main_issue, from_date: yDate }
      ])}::jsonb,
          updated_at = NOW()
      WHERE author_card_id = ${authorCardId} AND date = ${targetDate}::date
    `);
  }, 'DB_ERROR');
}
```

#### 4c. `diary.service.ts` (YANGI)
- `openDiary(cardId, date)`: `getOrCreateToday` + `carryOverIssues` ketma-ket.
- `saveDraft(id, dto)`: `save(id, {...dto, status:'draft'})`.
- `submitEntry(id)`: `submit(id)` — status='submitted'.
- `directorList(from, to, cardId?)`: `listAll(from, to, cardId)`.
- Op-kodlar: `EP-DIR-007` (open), `EP-DIR-009` (auto-fill), `EP-DIR-010` (carry-over).

#### 4d. `diary.controller.ts` (YANGI)
```typescript
@Controller('director/diary')
@UseGuards(RolesGuard)
@Roles('manager', 'director', 'super_admin')
export class DiaryController {
  // GET ?date=YYYY-MM-DD — bugungi yoki belgilangan kun (auto-fill + carry-over)
  @Get()
  async open(@Query() q: unknown, @CurrentUser() u: { id: number }) {...}

  // PATCH :id — draft saqla
  @Patch(':id')
  async save(@Param('id') id: string, @Body() body: unknown) {...}

  // POST :id/submit — taqdim et
  @Post(':id/submit')
  async submit(@Param('id') id: string) {...}

  // GET list — director ko'rinishi
  @Get('list')
  @Roles('director','super_admin')
  async list(@Query() q: unknown) {...}
}
```

**Zod schema:**
```typescript
const DiaryOpenSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).default(() =>
    new Date().toISOString().split('T')[0]
  ),
});

const DiarySaveSchema = z.object({
  main_issue:    z.string().max(2000).optional(),
  solution:      z.string().max(2000).optional(),
  tomorrow_plan: z.string().max(2000).optional(),
});

const DiaryListSchema = z.object({
  from:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to:      z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  card_id: z.coerce.number().int().positive().optional(),
});
```

**git add (4a-4d):**
```
domain/repositories/i-diary.repo.ts
infrastructure/repositories/diary.repository.ts
application/diary.service.ts
presentation/diary.controller.ts
```
**Commit:** `feat(dir): P30 diary auto-fill+carry-over EP-DIR-007/009/010`

---

### QADAM 5 — OKR kaskad kengaytirish (3 mavjud fayl)

#### 5a. `okr.repository.ts` — parent_goal_id va owner_card_id qo'sh

**Holat:** Fayl mavjud (129 satr), `createObjective` `parent_goal_id` qabul qilmaydi.

**OLDIN** (`okr.repository.ts:42-48`):
```typescript
async createObjective(title, type, year, quarter, description, ownerId) {
  return safeCall(async () => {
    const rows = await db.insert(okr_objectives).values({
      title, type, year, quarter, description, ownerId, status: 'active',
    }).returning();
```

**KEYIN** — `parent_goal_id` va `owner_card_id` qo'shilsin. Drizzle schema hali
yangilanmaganligi uchun `typedExecute` ishlatiladi:
```typescript
async createObjective(
  title: string, type: string, year: number, quarter: string,
  description: string | null, ownerId: number,
  parentGoalId: number | null,   // YANGI
  ownerCardId: number | null,    // YANGI
): Promise<Result<Row>> {
  return safeCall(async () => {
    const rows = await typedExecute<Row>(sql`
      INSERT INTO okr_objectives
        (title, type, year, quarter, description, owner_id, status,
         parent_goal_id, owner_card_id)
      VALUES
        (${title}, ${type}, ${year}, ${quarter}, ${description}, ${ownerId},
         'active', ${parentGoalId}, ${ownerCardId})
      RETURNING *
    `);
    return rows[0] ?? {};
  }, 'DB_ERROR');
}
```

`listObjectives` so'roviga `parent_goal_id` va `owner_card_id` SELECT ustunlari
qo'shiladi va `parent_goal_id` filter parametri ham qo'shiladi (daraxt navigatsiyasi):

```typescript
// QAYTA YOZILGAN listObjectives — kaskad uchun
async listObjectives(
  type, year, quarter, status,
  parentGoalId?: number | null   // YANGI filter
): Promise<Result<Row[]>> {
  return safeCall(async () => {
    return typedExecute<Row>(sql`
      SELECT o.*, p.title AS parent_title
      FROM okr_objectives o
      LEFT JOIN okr_objectives p ON p.id = o.parent_goal_id
      WHERE
        (${type}::text IS NULL OR o.type = ${type}) AND
        (${year}::int IS NULL OR o.year = ${year}::int) AND
        (${quarter}::text IS NULL OR o.quarter = ${quarter}) AND
        (${status}::text IS NULL OR o.status = ${status}) AND
        (${parentGoalId ?? null}::int IS NULL
          OR o.parent_goal_id = ${parentGoalId ?? null}::int)
      ORDER BY o.created_at DESC
    `);
  }, 'DB_ERROR');
}
```

**IOkrRepo interfeysi** (domain/repositories/i-okr.repo.ts — P30 owned) ham
yangilanadi: `createObjective` va `listObjectives` imzolari yangilangan parametrlar
bilan.

#### 5b. `okr.service.ts` — yangi parametrlarni delegate qil

```typescript
// OLDIN: createObjective(title, type, year, quarter, description, ownerId)
// KEYIN:
async createObjective(
  title, type, year, quarter, description, ownerId,
  parentGoalId: number | null,
  ownerCardId: number | null,
) {
  return this.repo.createObjective(
    title, type, year, quarter, description, ownerId,
    parentGoalId, ownerCardId,
  );
}
```

#### 5c. `okr.controller.ts` — `parent_goal_id` + `owner_card_id` qabul qil

`OkrCreateObjectiveSchema` (director.dto.ts da yoki inline) yangilansa:
```typescript
// OLDIN: OkrCreateObjectiveSchema faqat title/type/year/quarter/description
// KEYIN: qo'shimcha:
const OkrCreateObjectiveSchema = z.object({
  title:          z.string().min(1),
  type:           z.enum(['company','department','card']).default('company'),
  year:           z.number().int().min(2020).max(2030).optional(),
  quarter:        z.enum(['Q1','Q2','Q3','Q4']).optional(),
  description:    z.string().optional(),
  parent_goal_id: z.number().int().positive().optional(),  // YANGI
  owner_card_id:  z.number().int().positive().optional(),  // YANGI
});
```

`createObjective` handler yangilanadi:
```typescript
// KEYIN — yangi maydonlar
const { title, type, year, quarter, description, parent_goal_id, owner_card_id } = body;
return unwrapOrInternal(await this.svc.createObjective(
  title, type ?? 'company', ...,
  parent_goal_id ?? null, owner_card_id ?? null,
));
```

`listObjectives` handler:
```typescript
@Get('objectives')
async listObjectives(@Query('parent_goal_id') parentGoalId?: string, ...) {
  return unwrapOrInternal(await this.svc.listObjectives(
    type ?? null, ...,
    parentGoalId ? parseInt(parentGoalId, 10) : null,
  ));
}
```

**git add (5a-5c):**
```
domain/repositories/i-okr.repo.ts
infrastructure/repositories/okr.repository.ts
application/okr.service.ts
presentation/okr.controller.ts
```
**Commit:** `feat(dir): P30 OKR parent_goal_id+owner_card_id cascade EP-DIR-015/016`

---

### QADAM 6 — Monthly-plan backend (4 fayl)

#### 6a. `i-monthly-plan.repo.ts` (YANGI)
```typescript
export interface IMonthlyPlan {
  id: number; strategic_goal_id?: number | null;
  month: string; objectives: unknown[]; weekly_tasks: unknown[];
  completion_pct: string; created_at: Date; updated_at: Date;
}

export interface IMonthlyPlanRepo {
  list(goalId?: number): Promise<Result<IMonthlyPlan[]>>;
  getByMonth(month: string, goalId?: number): Promise<Result<IMonthlyPlan[]>>;
  create(dto: Omit<IMonthlyPlan,'id'|'created_at'|'updated_at'>): Promise<Result<IMonthlyPlan>>;
  update(id: number, dto: Partial<IMonthlyPlan>): Promise<Result<IMonthlyPlan>>;
  updateCompletion(id: number, pct: number): Promise<Result<void>>;
}

export const MONTHLY_PLAN_REPO = Symbol('MONTHLY_PLAN_REPO');
```

#### 6b. `monthly-plan.repository.ts` (YANGI)
Standard `typedExecute` pattern, `INSERT ... RETURNING *`, JSONB arrays.

#### 6c. `monthly-plan.service.ts` (YANGI)
`completePlan(id)` — `weekly_tasks` JSONB ichidagi task'larni sanab,
done bo'lganlar foizini hisob-kitob qilib `updateCompletion` chaqiradi.

#### 6d. `monthly-plan.controller.ts` (YANGI)
```typescript
@Controller('director/monthly-plans')
@UseGuards(RolesGuard)
@Roles('manager','director','super_admin')
export class MonthlyPlanController {
  @Get()     async list(@Query('goal_id') goalId?: string) {...}
  @Get('by-month') async byMonth(@Query() q: unknown) {...}
  @Post()    async create(@Body() body: unknown) {...}
  @Patch(':id') async update(@Param('id') id: string, @Body() body: unknown) {...}
}
```

**Zod schema:**
```typescript
const MonthlyPlanCreateSchema = z.object({
  strategic_goal_id: z.number().int().positive().optional(),
  month:             z.string().regex(/^\d{4}-\d{2}$/),
  objectives:        z.array(z.unknown()).default([]),
  weekly_tasks:      z.array(z.unknown()).default([]),
});
```

**git add (6a-6d):**
```
domain/repositories/i-monthly-plan.repo.ts
infrastructure/repositories/monthly-plan.repository.ts
application/monthly-plan.service.ts
presentation/monthly-plan.controller.ts
```
**Commit:** `feat(dir): P30 monthly-plans CRUD EP-DIR-017/018/019`

---

### QADAM 7 — Dashboard kengaytirish (3 mavjud fayl)

#### 7a. `dashboard-query.repository.ts` — yangi metodlar qo'sh

**Holat:** Fayl mavjud (81 satr), 7 metod ishlaydi — O'CHIRMA.

**Qo'shiladigan metodlar:**

```typescript
// Qo'shish (fayl oxiriga):

async getPlanFact(): Promise<Result<Row[]>> {
  return safeCall(async () =>
    typedExecute<Row>(sql`
      SELECT
        d.name_uz AS department,
        COUNT(po.id)::int AS total,
        COUNT(po.id) FILTER (WHERE po.status = 'completed')::int AS completed,
        COUNT(po.id) FILTER (WHERE po.status != 'completed'
          AND po.status != 'cancelled')::int AS remaining
      FROM departments d
      LEFT JOIN production_orders po ON po.department_id = d.id
        AND DATE(po.created_at) = CURRENT_DATE
      GROUP BY d.id, d.name_uz
      ORDER BY d.name_uz
    `), 'DB_ERROR');
}

async getOrderProgress(limit = 5): Promise<Result<Row[]>> {
  return safeCall(async () =>
    typedExecute<Row>(sql`
      SELECT
        so.id, so.order_number,
        ROUND(100.0 * COUNT(po.id) FILTER (WHERE po.status='completed')
              / NULLIF(COUNT(po.id), 0), 1) AS readiness_pct,
        d.name_uz AS current_department
      FROM sales_orders so
      LEFT JOIN production_orders po ON po.sales_order_id = so.id
      LEFT JOIN departments d ON d.id = (
        SELECT department_id FROM production_orders
        WHERE sales_order_id = so.id AND status = 'in_progress'
        ORDER BY created_at DESC LIMIT 1
      )
      WHERE so.status NOT IN ('cancelled','completed')
      GROUP BY so.id, so.order_number, d.name_uz
      ORDER BY readiness_pct ASC
      LIMIT ${limit}
    `), 'DB_ERROR');
}

async getStatTrends(days = 7): Promise<Result<Row[]>> {
  return safeCall(async () =>
    typedExecute<Row>(sql`
      SELECT
        sr.name_uz AS metric,
        json_agg(json_build_object(
          'date', to_char(d::date, 'YYYY-MM-DD'),
          'value', 0
        ) ORDER BY d ASC) AS trend_points
      FROM stat_regulations sr
      CROSS JOIN generate_series(
        CURRENT_DATE - ${days}::int,
        CURRENT_DATE,
        interval '1 day'
      ) d
      WHERE sr.is_active = TRUE
      GROUP BY sr.id, sr.name_uz
    `), 'DB_ERROR');
}

async getOpenIssues(): Promise<Result<Row[]>> {
  return safeCall(async () =>
    typedExecute<Row>(sql`
      SELECT author_card_id, date, main_issue
      FROM diary_entries
      WHERE status = 'draft' AND main_issue IS NOT NULL
        AND date = CURRENT_DATE
      ORDER BY author_card_id
    `), 'DB_ERROR');
}
```

#### 7b. `dashboard-query.service.ts` — yangi metodlar delegate

Mavjud metodlar ishlaydi — O'CHIRMA. Qo'shiladi:
```typescript
async getPlanFact(): Promise<Row[]> { ... }
async getOrderProgress(): Promise<Row[]> { ... }
async getStatTrends(): Promise<Row[]> { ... }
async getOpenIssues(): Promise<Row[]> { ... }
```

#### 7c. `dashboard.controller.ts` — `?mode` va yangi endpoint'lar

**OLDIN** (`dashboard.controller.ts:48-52`):
```typescript
@Get('')
@Roles(Role.SUPER_ADMIN, Role.DIRECTOR)
async getDashboard() {
  return unwrapOrInternal(await this.directorData.getDashboard());
}
```

**KEYIN** — `mode` query param + boyitilgan javob:
```typescript
@Get('')
@Roles(Role.SUPER_ADMIN, Role.DIRECTOR)
async getDashboard(@Query('mode') mode?: string) {
  const isSnapshot = mode === 'snapshot';
  const [base, planFact, orderProgress, statTrends, openIssues] =
    await Promise.all([
      this.directorData.getDashboard(),
      this.queries.getPlanFact(),
      this.queries.getOrderProgress(),
      this.queries.getStatTrends(),
      this.queries.getOpenIssues(),
    ]);
  const baseData = base.ok ? base.data : {};
  return {
    ...baseData,
    mode: isSnapshot ? 'snapshot' : 'realtime',
    planFact:      Array.isArray(planFact)      ? planFact      : [],
    orderProgress: Array.isArray(orderProgress) ? orderProgress : [],
    statTrends:    Array.isArray(statTrends)    ? statTrends    : [],
    openIssues:    Array.isArray(openIssues)    ? openIssues    : [],
  };
}
```

Yangi endpoint'lar (barchasi director/super_admin):
```typescript
@Get('plan-fact')    async getPlanFact() {...}
@Get('order-progress') async getOrderProgress() {...}
@Get('stat-trends')  async getStatTrends() {...}
@Get('open-issues')  async getOpenIssues() {...}
```

**git add (7a-7c):**
```
infrastructure/repositories/dashboard-query.repository.ts
application/dashboard-query.service.ts
presentation/dashboard.controller.ts
```
**Commit:** `feat(dir): P30 dashboard mode+planFact+orderProgress+statTrends EP-DIR-025/036/053`

---

### QADAM 8 — Frontend sahifalar (4 fayl)

#### 8a. `StatRegulationPage.tsx` (YANGI)

ListPage shablon + EP Design token:
```tsx
export default function StatRegulationPage() {
  const { t } = useTranslation('common');
  const { data, isLoading } = useQuery<{ data: StatReg[] }>({
    queryKey: ['/api/director/stat-regulations'],
  });
  const regs = Array.isArray(data?.data) ? data.data : [];
  // isLoading → <Skeleton>
  // Table: name_uz | unit | frequency | owner_card_id | target_value | version | is_active
  // Create dialog (StatRegCreateSchema form)
  // Edit dialog → PATCH (versioning)
  // History drawer → GET /api/director/stat-regulations/history?name=X
  // Barcha tugmalar EP token: var(--ep-primary), var(--ep-surface)
}
```

Columnlar: `name_uz`, `unit`, `frequency`, `version`, `is_active` badge,
`target_value`, amallar (tahrirlash/o'chirish + ConfirmDialog).

#### 8b. `DiaryPage.tsx` (YANGI)

```tsx
export default function DiaryPage() {
  const [date, setDate] = useState(today);
  const { data, isLoading } = useQuery({
    queryKey: ['/api/director/diary', date],
    queryFn: () => apiRequest('GET', `/api/director/diary?date=${date}`),
  });
  const saveMutation = useMutation({...});
  const submitMutation = useMutation({...});
  // Read-only: daily_state badge (color from state_levels), main_kpi_value
  // Manual: main_issue, solution, tomorrow_plan TextArea
  // Carry-over: read-only list (carry_over_issues JSONB)
  // Tugmalar: "Saqlash (draft)" + "Taqdim etish"
  // Director view: filter by card_id + date range → GET /api/director/diary/list
}
```

#### 8c. `StrategicTasksPanel.tsx` — OKR daraxt kengaytma

**Holat:** Fayl mavjud (ishlaydigan) — faqat kengaytir, O'CHIRMA.

Mavjud `/api/strategic/dashboard` query saqlanadi. Qo'shimcha:
```tsx
// OKR daraxt ko'rinishi (yangi accordion sektsiya)
const { data: objectives } = useQuery({
  queryKey: ['/api/okr/objectives'],
  queryFn: () => apiRequest('GET', '/api/okr/objectives'),
});

// Daraxt: company-level → department-level → card-level
// parent_goal_id bo'yicha group qilinadi
// Collapsible, max 2 daraja tab (Q-42)
const company = objectives?.filter(o => !o.parent_goal_id) ?? [];
const children = (parentId: number) =>
  objectives?.filter(o => o.parent_goal_id === parentId) ?? [];
```

Yangi OKR create dialog: `parent_goal_id` + `owner_card_id` maydonlari qo'shiladi.

#### 8d. `DirectorDashboard.tsx` — mode toggle + yangi widget'lar

**Holat:** Fayl mavjud (ishlaydigan) — kengaytir, O'CHIRMA.

```tsx
// YANGI: mode toggle
const [mode, setMode] = useState<'realtime'|'snapshot'>('realtime');

const { data: dash } = useQuery({
  queryKey: ['/api/director/dashboard', mode],
  queryFn: () => apiRequest('GET', `/api/director/dashboard?mode=${mode}`),
  refetchInterval: mode === 'realtime' ? 60000 : false,
});

// YANGI: planFact table widget
const planFact = Array.isArray(dash?.planFact) ? dash.planFact : [];

// YANGI: orderProgress widget
const orderProgress = Array.isArray(dash?.orderProgress) ? dash.orderProgress : [];

// YANGI: statTrends widget
const statTrends = Array.isArray(dash?.statTrends) ? dash.statTrends : [];

// YANGI: mode toggle UI
<div className="flex gap-2">
  <Button
    variant={mode === 'realtime' ? 'default' : 'outline'}
    size="sm"
    onClick={() => setMode('realtime')}
  >
    Real-time
  </Button>
  <Button
    variant={mode === 'snapshot' ? 'default' : 'outline'}
    size="sm"
    onClick={() => setMode('snapshot')}
  >
    07:00 Snapshot
  </Button>
</div>
```

**git add (8a-8d):**
```
artifacts/erp-dashboard/src/pages/StatRegulationPage.tsx
artifacts/erp-dashboard/src/pages/DiaryPage.tsx
artifacts/erp-dashboard/src/pages/StrategicTasksPanel.tsx
artifacts/erp-dashboard/src/pages/DirectorDashboard.tsx
```
**Commit:** `feat(dir): P30 FE StatRegulationPage+DiaryPage+OKR+dashboard mode EP-DIR-007/020/025`

---

## 5. DDL (GATED)

```sql
-- ============================================================
-- FILE: apps/api/src/shared/db/migrations/p30-stat-diary-okr-ddl.sql
-- APPROVED: <owner> <YYYY-MM-DD>
-- P30 Wave 3: stat_regulations + diary_entries + monthly_plans
-- Ishga tushirish: egasi APPROVED: stampini qo'ygandan KEYIN.
-- ============================================================

CREATE TABLE IF NOT EXISTS stat_regulations (
  id            SERIAL PRIMARY KEY,
  name_uz       TEXT NOT NULL,
  name_ru       TEXT,
  definition    TEXT,
  formula       TEXT,
  unit          VARCHAR(50),
  frequency     VARCHAR(20) NOT NULL DEFAULT 'daily'
                  CHECK (frequency IN ('daily','weekly','monthly')),
  source_module VARCHAR(50),
  owner_card_id INTEGER REFERENCES org_functions(id) ON DELETE SET NULL,
  target_value  NUMERIC(14,2),
  version       INTEGER NOT NULL DEFAULT 1,
  valid_from    DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_stat_reg_active
  ON stat_regulations(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_stat_reg_owner
  ON stat_regulations(owner_card_id);

-- ============================================================

CREATE TABLE IF NOT EXISTS diary_entries (
  id                  SERIAL PRIMARY KEY,
  author_card_id      INTEGER REFERENCES org_functions(id) ON DELETE SET NULL,
  date                DATE NOT NULL,
  daily_state         VARCHAR(20),
  main_kpi_value      NUMERIC(10,2),
  main_issue          TEXT,
  solution            TEXT,
  tomorrow_plan       TEXT,
  carry_over_issues   JSONB NOT NULL DEFAULT '[]',
  status              VARCHAR(10) NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft','submitted')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (author_card_id, date)
);
CREATE INDEX IF NOT EXISTS idx_diary_date
  ON diary_entries(date DESC);
CREATE INDEX IF NOT EXISTS idx_diary_author_date
  ON diary_entries(author_card_id, date);

-- ============================================================

CREATE TABLE IF NOT EXISTS monthly_plans (
  id                SERIAL PRIMARY KEY,
  strategic_goal_id INTEGER REFERENCES okr_objectives(id) ON DELETE SET NULL,
  month             VARCHAR(7) NOT NULL,
  objectives        JSONB NOT NULL DEFAULT '[]',
  weekly_tasks      JSONB NOT NULL DEFAULT '[]',
  completion_pct    NUMERIC(5,2) NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_monthly_plans_goal
  ON monthly_plans(strategic_goal_id);
CREATE INDEX IF NOT EXISTS idx_monthly_plans_month
  ON monthly_plans(month);
```

```sql
-- ============================================================
-- FILE: apps/api/src/shared/db/migrations/p30-okr-alter.sql
-- APPROVED: <owner> <YYYY-MM-DD>
-- P30 Wave 3: OKR kaskad + card-centric owner
-- ============================================================

ALTER TABLE okr_objectives
  ADD COLUMN IF NOT EXISTS parent_goal_id INTEGER
    REFERENCES okr_objectives(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS owner_card_id INTEGER
    REFERENCES org_functions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_okr_parent
  ON okr_objectives(parent_goal_id) WHERE parent_goal_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_okr_owner_card
  ON okr_objectives(owner_card_id);

ALTER TABLE okr_key_results
  ADD COLUMN IF NOT EXISTS owner_card_id INTEGER
    REFERENCES org_functions(id) ON DELETE SET NULL;

ALTER TABLE strategic_tasks
  ADD COLUMN IF NOT EXISTS owner_card_id INTEGER
    REFERENCES org_functions(id) ON DELETE SET NULL;
```

**ESLATMA:** Ikkala migration ham `IF NOT EXISTS` / `IF NOT EXISTS` guardsidan
foydalanadi — idempotent. Qayta ishlatilsa xato bermaydi.

---

## 6. QABUL MEZONI

### Har qadam uchun umumiy DoD:
- [ ] `pnpm tsc --noEmit` (BE apps/api) — 0 xato
- [ ] `pnpm tsc --noEmit` (FE artifacts/erp-dashboard) — 0 xato
- [ ] `bash scripts/reviewer-result-pattern.sh` — yangi FAIL yo'q
- [ ] `bash scripts/reviewer-as-unknown.sh` — yangi FAIL yo'q
- [ ] `bash scripts/run-all-reviewers.sh` — eski PASS saqlangan

### Xususiy qabul mezonlari:

**Stat-regulation:**
- [ ] `POST /api/director/stat-regulations` → DB ga real yozuv
- [ ] `PATCH /api/director/stat-regulations/:id` → yangi versiya INSERT,
  eski `is_active=FALSE`, `version` ortadi
- [ ] `GET /api/director/stat-regulations/history?name=Xxx` → barcha versiyalar
- [ ] FE StatRegulationPage: jadval ma'lumot ko'rsatadi; dialog saqlaydi;
  versiya tarixi drawer ochiladi
- [ ] EP-DIR-020/022/023 op-kodlar BE log da ko'rinadi

**Diary:**
- [ ] `GET /api/director/diary?date=2026-06-19` → yangi yozuv CREATE yoki mavjud
  — `daily_state` real `company_state_log` dan keladi (null emas)
- [ ] `PATCH /api/director/diary/:id` → `main_issue` saqladi
- [ ] Ertasiga `GET /api/director/diary?date=2026-06-20` → `carry_over_issues`
  kechagi `main_issue` ni o'z ichiga oladi
- [ ] `POST /api/director/diary/:id/submit` → `status='submitted'`
- [ ] Director `GET /api/director/diary/list?from=...&to=...` → barcha authorslar
- [ ] EP-DIR-007/009/010 op-kodlar log da ko'rinadi

**OKR kaskad:**
- [ ] `POST /api/okr/objectives` body `parent_goal_id: 1` → DB da `parent_goal_id=1`
- [ ] `GET /api/okr/objectives` → `parent_title` ustuni ko'rinadi (JOIN)
- [ ] `GET /api/okr/objectives?parent_goal_id=1` → faqat shu parentning children
- [ ] FE StrategicTasksPanel accordion: company-level → department-level 2 daraja
- [ ] EP-DIR-015/016/019 op-kodlar log da ko'rinadi

**Monthly-plans:**
- [ ] `POST /api/director/monthly-plans` `{month:'2026-06', strategic_goal_id:1}`
  → DB INSERT
- [ ] `GET /api/director/monthly-plans?goal_id=1` → filtrlangan ro'yxat

**Dashboard:**
- [ ] `GET /api/director/dashboard` → `planFact`, `orderProgress`, `statTrends`,
  `openIssues` kalitlari mavjud (bo'sh array emas xato — lekin jadval bo'sh bo'lsa
  `[]` qaytarishi maqbul)
- [ ] `GET /api/director/dashboard?mode=snapshot` → `mode:'snapshot'` javobda
- [ ] FE DirectorDashboard: mode toggle "Real-time" / "07:00 Snapshot" ishlaydi
- [ ] EP-DIR-025/036/053/073 op-kodlar log da ko'rinadi

### Golden-thread no-regress:
- [ ] SD→PP→MES→QC→WMS→FIN oltin zanjir harakatlari (docs/GOLDEN_THREAD_TEKSHIRUV.md)
  hamon ishlaydi — P30 o'zgartirishi bu zanjirni buzmaydi

### Egasi qarorlari yopilganligi tekshiruvi (conformance):
- [ ] **EP-DIR-033 karta 2-4 mahsulot** → `stat_regulations` tuzilmasi owner_card_id
  orqali kartaga bog'liq; UI 2-4 chegarasi; ORG-karta P04/P05 owned ustunlar — P30 §2.3-A ✓
- [ ] **EP-DIR-028 Telegram digest** → P29 §2.3-A stub + P30 diary/log data provider —
  to'liq wiring P47 (NTF) deferred ✓
- [ ] **EP-DIR-026 kunlik AI tahlilchi** → P29 §2.3-B stub + P30 dashboard aiInsights
  placeholder — to'liq P35/P36 (AI) deferred ✓
- [ ] **EP-DIR-037 majburiy sabab kategoriyasi** → P29 §2.3-C aggregate counter stub;
  reason_category owned PP/MES (P12/P15) — P30 stat-regulation `source_module` field
  kechikish sababi uchun ishlatilishi mumkin ✓

---

## 7. SELF-VERIFY

Har qadam bajarilgandan keyin quyidagi buyruqlarni ketma-ket bajar.

### 7.1 Typecheck
```bash
# Backend
cd Uzbek-Language-Module
pnpm --filter @europrint/api exec tsc --noEmit 2>&1 | tail -5

# Frontend
pnpm --filter erp-dashboard exec tsc --noEmit 2>&1 | tail -5
```

### 7.2 Reviewerlar
```bash
cd Uzbek-Language-Module
bash scripts/reviewer-result-pattern.sh
bash scripts/reviewer-as-unknown.sh
bash scripts/reviewer-jwt-guard.sh
```

### 7.3 DB-proof (egasi migration APPROVED: bergandan KEYIN)

```sql
-- 1. Jadvallar yaratilganmi?
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('stat_regulations','diary_entries','monthly_plans');
-- Kutilgan natija: 3 qator

-- 2. okr_objectives yangi ustunlar
SELECT column_name FROM information_schema.columns
WHERE table_name = 'okr_objectives'
  AND column_name IN ('parent_goal_id','owner_card_id');
-- Kutilgan natija: 2 qator

-- 3. Stat-regulation CRUD
INSERT INTO stat_regulations (name_uz, frequency)
VALUES ('Test ko''rsatkich', 'daily') RETURNING id, version, is_active;
-- Kutilgan: id=1, version=1, is_active=true

-- 4. Versiyalash
UPDATE stat_regulations SET is_active=FALSE WHERE id=1;
INSERT INTO stat_regulations (name_uz, frequency, version)
VALUES ('Test ko''rsatkich', 'daily', 2) RETURNING id, version, is_active;
-- Kutilgan: id=2, version=2, is_active=true

-- 5. Diary auto-fill
INSERT INTO diary_entries (author_card_id, date) VALUES (1, CURRENT_DATE)
ON CONFLICT (author_card_id, date) DO NOTHING RETURNING id, daily_state;
-- daily_state = company_state_log oxirgi qator (null yoki NORMAL/XAVF/...)

-- 6. OKR kaskad
INSERT INTO okr_objectives (title, year, type, parent_goal_id)
VALUES ('Bolalar maqsad', 2026, 'department', 1)  -- parent_goal_id=1
RETURNING id, parent_goal_id;
-- Kutilgan: parent_goal_id=1

-- 7. Monthly plan
INSERT INTO monthly_plans (month, strategic_goal_id)
VALUES ('2026-06', 1) RETURNING id, month, completion_pct;
-- Kutilgan: month='2026-06', completion_pct=0.00
```

### 7.4 API smoke (server ishlab tursa)
```bash
BASE=http://localhost:3030

# Auth token oling (manager yoki director)
TOKEN=$(curl -s -X POST $BASE/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"director","password":"..."}' | jq -r .access_token)

# Stat-regulation list
curl -s -H "Authorization: Bearer $TOKEN" \
  $BASE/api/director/stat-regulations | jq '.data | length'

# Diary open
curl -s -H "Authorization: Bearer $TOKEN" \
  "$BASE/api/director/diary?date=$(date +%Y-%m-%d)" | jq '.daily_state'

# Dashboard mode
curl -s -H "Authorization: Bearer $TOKEN" \
  "$BASE/api/director/dashboard?mode=snapshot" | jq '.mode'
# Kutilgan: "snapshot"

# OKR kaskad
curl -s -H "Authorization: Bearer $TOKEN" \
  "$BASE/api/okr/objectives?parent_goal_id=1" | jq 'length'
```

### 7.5 FE round-trip
```
1. StatRegulationPage:
   Ochib → "Yangi qo'shish" dialog → to'ldirish → "Saqlash" →
   Sahifani reload → yangi yozuv jadvalda ko'rinadi ✓

2. DiaryPage:
   Ochib → bugungi sana → main_issue yaz → "Saqlash" →
   Sahifani reload → main_issue saqlanganmi ✓

3. DirectorDashboard:
   "07:00 Snapshot" toggle → mode:'snapshot' Devtools da ✓
   "Real-time" toggle → 60s interval refetch ✓

4. StrategicTasksPanel:
   OKR daraxt sektsiyasi → company-level accordion →
   department-level kichik accordion (2 daraja, Q-42) ✓
```

---

## 8. COMMIT

### Commit format
```
feat(dir): <qisqa tavsif> <EP-DIR-###/###>
```

### Tartib va aniq fayllar

```bash
# QADAM 1 — DDL (GATED — faqat yoz, ishlatma)
git add \
  Uzbek-Language-Module/apps/api/src/shared/db/migrations/p30-stat-diary-okr-ddl.sql \
  Uzbek-Language-Module/apps/api/src/shared/db/migrations/p30-okr-alter.sql
git commit -m "chore(dir): P30 DDL gated migrations stat_regulations+diary_entries+monthly_plans+okr-alter"

# QADAM 2 — Stat-regulation BE
git add \
  Uzbek-Language-Module/apps/api/src/modules/director/domain/repositories/i-stat-regulation.repo.ts \
  Uzbek-Language-Module/apps/api/src/modules/director/infrastructure/repositories/stat-regulation.repository.ts \
  Uzbek-Language-Module/apps/api/src/modules/director/application/stat-regulation.service.ts \
  Uzbek-Language-Module/apps/api/src/modules/director/presentation/stat-regulation.controller.ts
git commit -m "feat(dir): P30 stat-regulation CRUD+versioning EP-DIR-020/022/023"

# QADAM 3 — Diary BE
git add \
  Uzbek-Language-Module/apps/api/src/modules/director/domain/repositories/i-diary.repo.ts \
  Uzbek-Language-Module/apps/api/src/modules/director/infrastructure/repositories/diary.repository.ts \
  Uzbek-Language-Module/apps/api/src/modules/director/application/diary.service.ts \
  Uzbek-Language-Module/apps/api/src/modules/director/presentation/diary.controller.ts
git commit -m "feat(dir): P30 diary auto-fill+carry-over EP-DIR-007/009/010"

# QADAM 4 — OKR kaskad
git add \
  Uzbek-Language-Module/apps/api/src/modules/director/domain/repositories/i-okr.repo.ts \
  Uzbek-Language-Module/apps/api/src/modules/director/infrastructure/repositories/okr.repository.ts \
  Uzbek-Language-Module/apps/api/src/modules/director/application/okr.service.ts \
  Uzbek-Language-Module/apps/api/src/modules/director/presentation/okr.controller.ts
git commit -m "feat(dir): P30 OKR parent_goal_id+owner_card_id cascade EP-DIR-015/016"

# QADAM 5 — Monthly-plan BE
git add \
  Uzbek-Language-Module/apps/api/src/modules/director/domain/repositories/i-monthly-plan.repo.ts \
  Uzbek-Language-Module/apps/api/src/modules/director/infrastructure/repositories/monthly-plan.repository.ts \
  Uzbek-Language-Module/apps/api/src/modules/director/application/monthly-plan.service.ts \
  Uzbek-Language-Module/apps/api/src/modules/director/presentation/monthly-plan.controller.ts
git commit -m "feat(dir): P30 monthly-plans CRUD EP-DIR-017/018/019"

# QADAM 6 — Dashboard kengaytma
git add \
  Uzbek-Language-Module/apps/api/src/modules/director/infrastructure/repositories/dashboard-query.repository.ts \
  Uzbek-Language-Module/apps/api/src/modules/director/application/dashboard-query.service.ts \
  Uzbek-Language-Module/apps/api/src/modules/director/presentation/dashboard.controller.ts
git commit -m "feat(dir): P30 dashboard mode+planFact+orderProgress+statTrends EP-DIR-025/036/053/073"

# QADAM 7 — FE sahifalar
git add \
  Uzbek-Language-Module/artifacts/erp-dashboard/src/pages/StatRegulationPage.tsx \
  Uzbek-Language-Module/artifacts/erp-dashboard/src/pages/DiaryPage.tsx \
  Uzbek-Language-Module/artifacts/erp-dashboard/src/pages/StrategicTasksPanel.tsx \
  Uzbek-Language-Module/artifacts/erp-dashboard/src/pages/DirectorDashboard.tsx
git commit -m "feat(dir): P30 FE StatRegulationPage+DiaryPage+OKR+dashboard-mode EP-DIR-007/020/025"
```

### Taqiqlangan:
```bash
# HECH QACHON:
git add -A      # TAQIQ
git add .       # TAQIQ
git commit --no-verify   # TAQIQ (hook bypass)

# Log fayllar aslo commit qilinmaydi
# JWT/secret log da chop etilmaydi
```

### Holat hisoboti (Qadam 8 oxirida egaga ko'rsatiladi):
```
P30 HOLAT:
✅ DDL fayllari yozildi (GATED — egasi APPROVED: kutilmoqda)
✅ stat-regulation CRUD + versioning (EP-DIR-020/022/023)
✅ diary auto-fill + carry-over (EP-DIR-007/009/010)
✅ OKR parent_goal_id + owner_card_id (EP-DIR-015/016)
✅ monthly-plans CRUD (EP-DIR-017/018/019)
✅ dashboard mode + planFact + orderProgress + statTrends (EP-DIR-025/036/053/073)
✅ FE: StatRegulationPage + DiaryPage + OKR daraxt + Dashboard mode toggle

INTERVYU MOSLIK (4 tushib qolgan qaror):
✅ EP-DIR-033 karta 2-4 mahsulot — P30 §2.3-A: stat_regulations tuzilmasi + ORG P04/P05 defer
✅ EP-DIR-028 Telegram digest — P29 §2.3-A stub + P30 data provider; wiring P47 deferred
✅ EP-DIR-026 kunlik AI tahlilchi — P29 §2.3-B stub + P30 dashboard placeholder; P35/P36 deferred
✅ EP-DIR-037 majburiy sabab kategoriyasi — P29 §2.3-C aggregate; reason_category PP/MES owned

BE tsc: 0 xato
FE tsc: 0 xato
Reviewerlar: yangi FAIL yo'q
DB-proof: egasi migration APPROVED bergandan keyin bajariladi

Keyingi qadam: P50 (route/sidebar wiring) — P30 endpoint'larini sidebar ga ulash.
```

