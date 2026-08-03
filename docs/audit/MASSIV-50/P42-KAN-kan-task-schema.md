# P42 — KAN — Kanban + Vazifalar: KAN task schema DDL + assigner-confirm + status enum + WIP fix

> **WAVE 1** | **Paket ID:** P42 | **Slug:** kan-task-schema
> **Bog'liqlik:** P03 (WMS/op-codes registry) — op-kodlar P03 dan keyin ro'yxatdan o'tkaziladi.
> **DDL DARVOZASI:** HA — bu paket DDL talab qiladi; migrationni yoz lekin egasi ruxsatisiz ISHGA TUSHIRMA.
> Yozilgan: 2026-06-19 | Executor: Muslimbek | Advisor: Claude

---

## 0. ROL VA QOIDALAR

Sen 🟢 **BAJARUVCHI (EXECUTOR)**. Har sessiya boshida `CLAUDE.md` + `docs/agent-constitution.md` o'qi. Quyidagi qoidalar bloki bu direktiva uchun qat'iy amal qiladi:

```
QOIDALAR BLOKI (Q-47):
1. Result<T> hamma repo/service metodida; throw/null/undefined TAQIQ.
2. @Body Zod bilan validate; class-validator TAQIQ.
3. Drizzle ORM; raw SQL faqat murakkab holatda (izoh + typedExecute<T>).
4. Q-40 ishlaydi≠to'g'ri: REAL INSERT/UPDATE + DB-proof; echo/hardcoded/fake javob TAQIQ.
5. Q-46 ishlab turgan kod O'CHIRILMAYDI; buzuq/o'lik/dublikat kod TO'LIQ o'chiriladi (chala emas).
6. FAYL IZOLYATSIYASI (Qoida 23 / Q-23 / Q-31): faqat shu paketning OWNED-FILE ro'yxatidagi fayllarga teg.
   Boshqa fayl kerak bo'lsa — TO'XTA, egasiga flag qil, supurib ketma.
7. DDL DARVOZASI (Q-35): CREATE TABLE / migration faqat egasi ruxsati bilan; migration faylida
   `-- APPROVED:` izoh shart. Paket DDL talab qilsa — migrationni YOZ lekin GATED belgila, ISHGA TUSHIRMA.
8. git add <aniq-fayl> faqat; -A / . TAQIQ. Bitta commit=bitta mantiqiy guruh.
9. Q-45/Q-30 log/secret HECH QACHON commit qilinmaydi; JWT minting yo'q.
10. Self-verify: BE tsc 0, FE tsc 0, tegishli reviewer skriptlar, jonli DB-proof (kirit→saqla→qayta o'qi→ko'rinadimi).
11. "V2"/"Strangler Fig"/"V1 vs V2" terminologiyasi TAQIQ — bitta kod bazasi, shu joyda to'g'irlanadi.
12. Vizyon-moslik: TO'G'RI o'lchovi = master vizyon (docs/XARITA-REJA-YONALISH + modul vizyon-hujjati);
    kod vizyonga zid bo'lsa (ishlasa ham) = xato.
```

**WAVE:** 1 | **dependsOn:** ["P03"] — P03 op-codes registry birinchi bo'lishi kerak, P42 EP-KAN-### kodlarni shu registryga ro'yxatdan o'tkazadi.

---

## 1. IZOLYATSIYA MANIFESTI

**FAQAT quyidagi fayllarga teg. Boshqa fayl kerak bo'lsa — TO'XTA + egasiga flag qil:**

| # | Fayl (Uzbek-Language-Module/ dan nisbiy) | Holat |
|---|------------------------------------------|-------|
| 1 | `apps/api/src/shared/db/migrations/kan-phase1-task-columns.sql` | YANGI (yaratiladi) |
| 2 | `apps/api/src/shared/db/schema-misc.ts` | MAVJUD — kanban_tasks qatori o'zgaradi |
| 3 | `apps/api/src/modules/kanban/domain/enums/task-status.enum.ts` | MAVJUD — enum nomi o'zgaradi |
| 4 | `apps/api/src/modules/kanban/presentation/dto/kanban.dto.ts` | MAVJUD — Zod enum qiymatlari o'zgaradi |
| 5 | `apps/api/src/modules/kanban/presentation/kanban.dto.ts` | MAVJUD — Zod enum qiymatlari o'zgaradi |
| 6 | `apps/api/src/modules/kanban/application/kanban.service.ts` | MAVJUD — WIP limit + assigner-confirm metod |
| 7 | `apps/api/src/modules/kanban/domain/aggregates/kanban-task.aggregate.ts` | MAVJUD — yangi maydonlar + confirm metod |
| 8 | `apps/api/src/modules/kanban/infrastructure/repositories/drizzle-kanban.repo.ts` | MAVJUD — yangi ustunlar uchun save/update |
| 9 | `apps/api/src/modules/kanban/presentation/kanban-boards.controller.ts` | MAVJUD — assigner-confirm endpoint |
| 10 | `apps/api/src/modules/kanban/kanban.module.ts` | MAVJUD — KanbanController ro'yxatga qo'shiladi |
| 11 | `apps/api/src/modules/kanban/presentation/kanban-rasporyajenie-bridge.controller.ts` | YANGI — COR-051/054 ko'prigi |
| 12 | `apps/api/src/modules/kanban/application/kanban-rasporyajenie-bridge.service.ts` | YANGI — farmoyish→task map logikasi |

> **DDL GATED FAYL:** `kan-phase1-task-columns.sql` — yoziladi lekin `-- APPROVED: <ism> <sana>` qatori
> bo'lmaguncha PostgreSQL da ISHGA TUSHIRILMAYDI. Egasi ruxsat berguncha migration faylda saqliq turadi.

> **TAQIQLANGAN:** `kanban.controller.ts` ga tegma (o'zi to'g'ri ishlaydi, faqat modul ro'yxatiga qo'shilmagan).
> `schema-enums.ts` ga tegma (enum qiymatlarini SQL migration orqali yangilaymiz, Drizzle enum nomini saqlaymiz).
> Boshqa modul (CC, HR, MES, WMS) fayllari — TO'LIQICHA TAQIQLANGAN.

---

## 2. VIZYON

**Manba:** `docs/audit/MUSLIMBEK-PROMT-19-KAN-2026-06-08.md` — Phase 1 spetsifikatsiyasi.

### 2.1 KAN modulining roli
KAN = shaxsiy + jamoa vazifa boshqaruvchi + ishlab chiqarish order board (T3). U har bir halqani yopadi:
- rasporyajenie → task → **assigner-confirm** (topshiruvchi tasdiqlaydi, menejer emas)
- siyosat → task, nuqson → qayta ishlash task, order → board kartasi

### 2.2 Asosiy egasi overridelari (OCHIQ-JAVOBLAR)
- **EP-KAN-027/032 [KRITIK]:** "Bajarildi" tasdig'i = **assigner_user_id** (topshiruvchi), nafaqat menejer. Vazifa "Tekshiruvda" ga o'tadi → assigner tasdiqlaydi → "Bajarildi".
- **EP-KAN-015:** Board = aynan **4 ustun** (Reja / Jarayonda / Tekshiruvda / Bajarildi). Mavjud BACKLOG/TODO/IN_PROGRESS/REVIEW/DONE = NOTO'G'RI.
- **EP-KAN-038:** WIP chegarasi = hozirgi foydalanuvchi uchun **3 ta vazifa** "Jarayonda"da. Mavjud IN_PROGRESS=10, REVIEW=5 = NOTO'G'RI.
- **EP-KAN-047:** `due_date` (deadline) = **MAJBURIY**, hozir nullable = NOTO'G'RI.
- **EP-KAN-014:** `card_id` FK → lavozim-karta (org_functions.id), ixtiyoriy — karta-markazli model (E2).

### 2.3 Qabul mezoni (har xususiyat uchun)

| Xususiyat | Qabul mezoni |
|-----------|--------------|
| assigner_user_id ustun | `kanban_tasks` da ustun mavjud; CREATE keltiruvchi user = assigned_by_user_id, task beruvchi = assigner_user_id |
| Assigner-confirm oqim | PATCH `/kanban/:id/confirm-complete` → faqat assigner ID = current user → status "bajarildi"ga o'tadi; boshqasi → 403 |
| Status enum | DB + kod + Zod da: `reja`, `jarayonda`, `tekshiruvda`, `bajarildi`, `bekor`, `rad` |
| WIP=3 | `jarayonda` statusida 4 ta qo'shmoqchi bo'lsang → 400 "WIP chegarasi: 3 ta" |
| deadline majburiy | `due_date` yo'q → Zod 400 xato |
| **category MAJBURIY** | `category` yo'q → Zod 400 xato (EP-KAN-056 + OCHIQ-JAVOBLAR §KAN) |
| **assignedTo (mas'ul) MAJBURIY** | `assignedTo` yo'q → Zod 400 xato (EP-KAN-036: ijrochi to'ldirilmagan bo'lsa "Jarayonda"ga o'tib bo'lmaydi; yaratilishda ham majburiy) |
| **rasporyajenie→KAN ko'prigi** | `GET /api/kanban/from-rasporyajenie/:id` → COR dan kelgan farmoyish KAN taskga map qilinadi (EP-COR-051/054 + OCHIQ-JAVOBLAR §COR) |
| KanbanController registratsiyasi | `GET /api/kanban` → 200 (avval 404/unreachable edi) |
| phantom board yo'q | create task → `boardId` = haqiqiy UUID (null/`default-board` emas) |
| rollover_count | ustun mavjud, default 0, `PATCH /kanban/:id/rollover` → inkrementlaydi |
| card_id FK | `kanban_tasks.card_id` → `org_functions.id` ON DELETE SET NULL |
| is_confidential | ustun mavjud, default false |
| expected_outcome | text ustun mavjud |
| category | varchar(100) ustun mavjud |
| original_deadline / rolled_over_from | ustunlar mavjud |

---

## 3. HOZIRGI HOLAT

### 3.1 Mavjud (tasdiqlangan fayl:satr)

**kanban.module.ts:33-62** — `KanbanController` import qilingan lekin `controllers[]` massivida YO'Q:
```typescript
// kanban.module.ts:33 — import bor:
import { KanbanController } from './presentation/kanban.controller';
// kanban.module.ts:55-62 — lekin controllers[] da yo'q:
controllers: [
  KanbanBoardsController,
  KanbanCoreController,
  KanbanReportsController,
  KanbanCardsController,
  KanbanCardFilesController,
  KanbanChecklistController,
  // KanbanController — BU YO'Q! Routes GET/POST/PATCH/DELETE /kanban erishib bo'lmaydi.
],
```

**kanban.controller.ts:100** — phantom boardId hardcoded:
```typescript
const cmd = new CreateTaskCommand(
  dto.title,
  dto.description || '',
  'default-board',   // ← PHANTOM: haqiqiy board yo'q
  user.id,
  dto.priority,
);
```

**kanban.service.ts:24-27** — WIP chegarasi noto'g'ri:
```typescript
const DEFAULT_WIP_LIMITS: WipLimitConfig = {
  [TaskStatus.IN_PROGRESS]: 10,  // ← vizyon: 3 bo'lishi kerak
  [TaskStatus.REVIEW]: 5,        // ← vizyon: tekshiruvda chegarasi yo'q
};
```

**task-status.enum.ts:6-12** — 5 qiymat, vizyon 4 ustun bilan mos emas:
```typescript
export enum TaskStatus {
  BACKLOG = 'backlog',      // ← vizyon: yo'q
  TODO = 'todo',            // ← vizyon: 'reja'
  IN_PROGRESS = 'in_progress', // ← vizyon: 'jarayonda'
  REVIEW = 'review',        // ← vizyon: 'tekshiruvda'
  DONE = 'done',            // ← vizyon: 'bajarildi'
}
```

**presentation/dto/kanban.dto.ts:12** + **presentation/kanban.dto.ts:12** — eski enum qiymatlari Zod schemada:
```typescript
status: z.enum(['todo', 'in_progress', 'review', 'done', 'blocked']),
// ← vizyon: ['reja', 'jarayonda', 'tekshiruvda', 'bajarildi', 'bekor', 'rad']
```

**schema-misc.ts:90-107** — kanban_tasks mavjud, lekin quyidagi ustunlar YO'Q:
- `assigner_user_id` (EP-KAN-027 — KRITIK)
- `rollover_count` (EP-KAN-063)
- `original_deadline` (EP-KAN-065)
- `rolled_over_from` (EP-KAN-065)
- `is_confidential` (EP-KAN-120)
- `card_id` (EP-KAN-014 — karta-markazli model)
- `category` (EP-KAN-077)
- `expected_outcome` (EP-KAN-111)
- `due_date` nullable (EP-KAN-047 — majburiy bo'lishi kerak)

**kanban-task.aggregate.ts:45** — BACKLOG bilan boshlanadi (vizyon: 'reja'):
```typescript
this.status = TaskStatus.BACKLOG; // ← vizyon: TaskStatus.REJA
```

**drizzle-kanban.repo.ts:178** — phantom boardId saqlash:
```typescript
'default-board', // boardId not in schema ← haqiqiy boardId saqlanmaydi
```

### 3.2 Yo'q (MISSING)

- `assigner_user_id` ustuni `kanban_tasks` da — assigner-confirm imkonsiz
- `PATCH /kanban/:id/confirm-complete` endpoint — assigner-confirm oqim yo'q
- WIP=3 per user logikasi — hozir global 10/5
- `personal_tasks` jadvali (EP-KAN-007/049/055) — BUTUNLAY YO'Q (bu paket scopeidan tashqari, keyingi fazaga)
- `personal_tasks` rollover croni (EP-KAN-008/063) — yo'q

### 3.3 Buzuq/Soxta (BROKEN/FAKE)

| Fayl:satr | Muammo | Tasniflash |
|-----------|--------|------------|
| `kanban.module.ts:55-62` | KanbanController `controllers[]` da yo'q — GET/POST/PATCH/DELETE /kanban erishib bo'lmaydi | BROKEN |
| `kanban.controller.ts:100` | `'default-board'` hardcoded boardId — barcha create phantom boardga ketadi | FAKE |
| `kanban.service.ts:24-27` | WIP IN_PROGRESS=10, REVIEW=5 — vizyon EP-KAN-038 ga zid (=3) | BROKEN |
| `task-status.enum.ts:6-12` | 5 qiymat (backlog/todo/in_progress/review/done) — vizyon 4 ustun (reja/jarayonda/tekshiruvda/bajarildi) + bekor/rad | BROKEN |
| `presentation/dto/kanban.dto.ts:12` | Zod enum eski qiymatlar | BROKEN |
| `presentation/kanban.dto.ts:12` | Zod enum eski qiymatlar (ikkinchi DTO fayli) | BROKEN |
| `drizzle-kanban.repo.ts:178` | `toDomain()` da `'default-board'` hardcoded | BROKEN |

---

## 4. ISH (qadam-baqadam)

> **MUHIM:** Har qadam alohida commit. Qadam oxirida `BE tsc 0` tekshir. DDL qadami — faqat fayl yoz, DB da ishga tushirma.

---

### QADAM 1 — Migration fayl yoz (DDL GATED — ISHGA TUSHIRMA)

**Fayl:** `apps/api/src/shared/db/migrations/kan-phase1-task-columns.sql` (YANGI)

Bu faylni yoz, lekin `-- APPROVED:` qatorini egasi to'ldirguncha PostgreSQL da ishlatma.

**Nima qiladi:**
1. `kanban_tasks` jadvaliga 8 ta yangi ustun qo'shadi
2. `due_date` ni NOT NULL qiladi (mavjud NULL qiymatlar NOW() bilan to'ldirilgandan keyin)
3. Yangi Postgres ENUM tipi `kanban_status_v2` yaratadi
4. `kanban_tasks.status` ustunini yangi enum typega o'giradi

**Fayl mazmuni (to'liq):**
```sql
-- Migration: kan-phase1-task-columns.sql
-- Description: kanban_tasks jadvaliga vizyon maydonlari qo'shish + status enum yangilash
-- EP-KAN-027 (assigner_user_id), EP-KAN-063 (rollover_count), EP-KAN-065 (original_deadline/rolled_over_from),
--             EP-KAN-120 (is_confidential), EP-KAN-014 (card_id), EP-KAN-077 (category),
--             EP-KAN-111 (expected_outcome), EP-KAN-047 (due_date NOT NULL), EP-KAN-015 (status enum)
-- APPROVED: <egasi ismi> <sana>   ← egasi bu qatorni to'ldirguncha ISHGA TUSHIRMA

BEGIN;

-- ─── 1. Yangi ustunlar qo'shish ───────────────────────────────────────────────

ALTER TABLE kanban_tasks
  ADD COLUMN IF NOT EXISTS assigner_user_id INTEGER
    REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS rollover_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS original_deadline TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rolled_over_from DATE,
  ADD COLUMN IF NOT EXISTS is_confidential BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS card_id INTEGER
    REFERENCES org_functions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS category VARCHAR(100),
  ADD COLUMN IF NOT EXISTS expected_outcome TEXT;

-- ─── 2. due_date NOT NULL qilish (EP-KAN-047) ────────────────────────────────
-- Avval mavjud NULL qiymatlarni NOW() bilan to'ldiramiz
UPDATE kanban_tasks
  SET due_date = NOW()
  WHERE due_date IS NULL
    AND deleted_at IS NULL;

ALTER TABLE kanban_tasks
  ALTER COLUMN due_date SET NOT NULL;

-- ─── 3. Status ENUM yangilash (EP-KAN-015) ───────────────────────────────────
-- Yangi enum type yaratamiz (eski backlog/todo/in_progress/review/done → reja/jarayonda/tekshiruvda/bajarildi)
CREATE TYPE kanban_status_v2 AS ENUM (
  'reja',
  'jarayonda',
  'tekshiruvda',
  'bajarildi',
  'bekor',
  'rad'
);

-- Mavjud qiymatlarni yangi enumga map qilamiz
ALTER TABLE kanban_tasks
  ALTER COLUMN status TYPE kanban_status_v2
    USING (
      CASE status::text
        WHEN 'backlog'      THEN 'reja'::kanban_status_v2
        WHEN 'todo'         THEN 'reja'::kanban_status_v2
        WHEN 'in_progress'  THEN 'jarayonda'::kanban_status_v2
        WHEN 'review'       THEN 'tekshiruvda'::kanban_status_v2
        WHEN 'done'         THEN 'bajarildi'::kanban_status_v2
        WHEN 'blocked'      THEN 'bekor'::kanban_status_v2
        ELSE 'reja'::kanban_status_v2
      END
    );

-- Eski enum typeni o'chiramiz (faqat kanban_tasks ishlatgan bo'lsa)
-- DIQQAT: agar boshqa jadvallar ham shu enumni ishlatsa, bu DROP muvaffaqiyatsiz bo'ladi.
-- Bunday holda egasiga flag qiling va DROP ni alohida bajaring.
-- DROP TYPE IF EXISTS kanban_task_status;  ← xavfsizlik uchun comment qilingan, egasi qaror qilsin

-- ─── 4. Indekslar ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS kanban_tasks_assigner_user_id_idx ON kanban_tasks(assigner_user_id)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS kanban_tasks_card_id_idx ON kanban_tasks(card_id)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS kanban_tasks_rollover_count_idx ON kanban_tasks(rollover_count)
  WHERE deleted_at IS NULL AND rollover_count > 0;
CREATE INDEX IF NOT EXISTS kanban_tasks_due_date_idx ON kanban_tasks(due_date)
  WHERE deleted_at IS NULL;

COMMIT;
```

**STOP:** Bu faylni yozgandan keyin egasiga ko'rsat. Egasi `-- APPROVED:` qatoriga ism+sana yozib tasdiqlagunicha keyingi DDL qadamlarga o'tma. Ammo kod o'zgarishlarini (qadamlar 2-7) parallel boshlash mumkin.

---

### QADAM 2 — `task-status.enum.ts` ni vizyon bilan moslashtir

**Fayl:** `apps/api/src/modules/kanban/domain/enums/task-status.enum.ts`

**Oldin (satr 6-12):**
```typescript
export enum TaskStatus {
  BACKLOG = 'backlog',
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  REVIEW = 'review',
  DONE = 'done',
}
```

**Keyin:**
```typescript
/**
 * @module task-status.enum
 * @description KAN modul status enumlari — vizyon EP-KAN-015 (4 ustun + bekor/rad)
 * Qiymatlar PostgreSQL kanban_status_v2 ENUM bilan mos bo'lishi shart.
 */

export enum TaskStatus {
  REJA          = 'reja',         // Reja (backlog/todo → mapping)
  JARAYONDA     = 'jarayonda',    // Jarayonda (in_progress → mapping)
  TEKSHIRUVDA   = 'tekshiruvda',  // Tekshiruvda — assigner-confirm kutilmoqda
  BAJARILDI     = 'bajarildi',    // Bajarildi — assigner tasdiqladi
  BEKOR         = 'bekor',        // Bekor qilindi
  RAD           = 'rad',          // Rad etildi
}

export enum TaskPriority {
  LOW    = 'low',
  MEDIUM = 'medium',
  HIGH   = 'high',
  URGENT = 'urgent',
}

/** Assigner-confirm uchun ruxsat berilgan o'tishlar (EP-KAN-032) */
export const ALLOWED_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  [TaskStatus.REJA]:        [TaskStatus.JARAYONDA, TaskStatus.BEKOR],
  [TaskStatus.JARAYONDA]:   [TaskStatus.TEKSHIRUVDA, TaskStatus.REJA, TaskStatus.BEKOR],
  [TaskStatus.TEKSHIRUVDA]: [TaskStatus.BAJARILDI, TaskStatus.JARAYONDA, TaskStatus.RAD],
  [TaskStatus.BAJARILDI]:   [],                                      // yakuniy holat
  [TaskStatus.BEKOR]:       [TaskStatus.REJA],                       // qayta ochish
  [TaskStatus.RAD]:         [TaskStatus.REJA],                       // qayta ochish
};

/** TEKSHIRUVDA → BAJARILDI faqat assigner tasdiqlashi shart (EP-KAN-027) */
export const REQUIRES_ASSIGNER_CONFIRM = TaskStatus.BAJARILDI;
```

**Diqqat:** `ALLOWED_TRANSITIONS` va `REQUIRES_ASSIGNER_CONFIRM` ni aggregate va service ishlatadi — shu faylda saqlash qulay.

---

### QADAM 3 — Drizzle schema-misc.ts da kanban_tasks ustunlarini yangilash

**Fayl:** `apps/api/src/shared/db/schema-misc.ts`

Mavjud `kanban_tasks` blokini (satr 90-107) quyidagi kengaytirilgan versiya bilan almashtir.

**Oldin (satr 90-107):**
```typescript
export const kanban_tasks = pgTable('kanban_tasks', {
  id: uuid('id').primaryKey().$defaultFn(() => createId()),
  title: text('title').notNull(),
  description: text('description'),
  status: kanbanTaskStatusEnum('status').notNull().default('todo'),
  priority: kanbanPriorityEnum('priority').notNull().default('medium'),
  assigned_to: uuid('assigned_to').references(() => users.id, { onDelete: 'set null' }),
  due_date: timestamp('due_date', { withTimezone: true }),
  tags: text('tags').default('[]'),
  created_by: uuid('created_by').notNull().references(() => users.id, { onDelete: 'restrict' }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deleted_at: timestamp('deleted_at', { withTimezone: true }),
}, (table) => [
  index('kanban_tasks_status_idx').on(table.status),
  index('kanban_tasks_assigned_to_idx').on(table.assigned_to),
  index('kanban_tasks_priority_idx').on(table.priority),
]);
```

**Keyin** — quyidagi blok bilan almashtir (import qatorlariga `integer`, `varchar` qo'shilganini ham tekshir — ular `schema-misc.ts` da allaqachon import qilingan bo'lishi mumkin; yo'q bo'lsa qo'sh):

```typescript
// NOTE: org_functions import kerak (card_id FK uchun)
// Agar schema-misc.ts ichida org_functions import yo'q bo'lsa, qo'sh:
// import { org_functions } from './schema-org';  ← agar bunday import sikli yaratmasa

export const kanban_tasks = pgTable('kanban_tasks', {
  id: uuid('id').primaryKey().$defaultFn(() => createId()),
  title: text('title').notNull(),
  description: text('description'),
  // status: migration dan keyin kanban_status_v2 ENUM ishlatadi;
  // Drizzle schemada text sifatida saqlaymiz (DDL approved bo'lgunicha)
  status: text('status').notNull().default('reja'),
  priority: kanbanPriorityEnum('priority').notNull().default('medium'),

  // EP-KAN-027: Kim topshirdi (assigner) — assigner-confirm uchun KRITIK
  assigner_user_id: integer('assigner_user_id').references(() => users.id, { onDelete: 'set null' }),
  // Kim bajaradi (assignee)
  assigned_to: uuid('assigned_to').references(() => users.id, { onDelete: 'set null' }),

  // EP-KAN-047: deadline MAJBURIY (migration dan keyin NOT NULL bo'ladi)
  due_date: timestamp('due_date', { withTimezone: true }),

  // EP-KAN-063/065: Rollover hisobi
  rollover_count: integer('rollover_count').notNull().default(0),
  original_deadline: timestamp('original_deadline', { withTimezone: true }),
  rolled_over_from: text('rolled_over_from'), // DATE string 'YYYY-MM-DD'

  // EP-KAN-120: Maxfiylik
  is_confidential: boolean('is_confidential').notNull().default(false),

  // EP-KAN-014/108/132: Karta-markazli model — lavozim kartasiga bog'lash
  card_id: integer('card_id').references(() => users.id, { onDelete: 'set null' }),
  // DIQQAT: card_id references org_functions(id) bo'lishi kerak.
  // Agar schema-misc.ts da org_functions import sikl yaratsa — integer() ishlatib
  // FK ni faqat migration da qo'y, Drizzle da references() o'chirish mumkin.
  // Egasiga muammoni flag qil va quyidagi ikki variantdan birini tanlat:
  // (a) import { org_functions } from './schema-org' qo'sh → references(() => org_functions.id)
  // (b) Drizzle FK yo'q, faqat SQL migration FK

  // EP-KAN-077: Kategoriya (master data ref)
  category: text('category'),

  // EP-KAN-111: Kutilayotgan natija
  expected_outcome: text('expected_outcome'),

  tags: text('tags').default('[]'),
  created_by: uuid('created_by').notNull().references(() => users.id, { onDelete: 'restrict' }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deleted_at: timestamp('deleted_at', { withTimezone: true }),
}, (table) => [
  index('kanban_tasks_status_idx').on(table.status),
  index('kanban_tasks_assigned_to_idx').on(table.assigned_to),
  index('kanban_tasks_assigner_user_id_idx').on(table.assigner_user_id),
  index('kanban_tasks_priority_idx').on(table.priority),
  index('kanban_tasks_card_id_idx').on(table.card_id),
  index('kanban_tasks_due_date_idx').on(table.due_date),
  index('kanban_tasks_rollover_idx').on(table.rollover_count),
]);
```

**Edge case — import sikl:** agar `schema-misc.ts` → `schema-org.ts` import sikl yaratsa (Drizzle schemalar bir-birini import qilmaydi odatda), `card_id` uchun `.references()` qo'shma, faqat `integer('card_id')` qol. FK ni faqat SQL migration da saqlash etarli.

---

### QADAM 4 — Zod DTOlarni yangilash (ikkala fayl)

**Fayl 4a:** `apps/api/src/modules/kanban/presentation/dto/kanban.dto.ts`

Bu fayl `KanbanBoardsController` va boshqalar ishlatadi. Faqat task status qismini yangilash kerak.

**Oldin (satr 9-29):**
```typescript
export const CreateTaskDtoSchema = z.object({
  title: z.string().min(3).max(255),
  description: z.string().min(0).max(MAX_DESCRIPTION_LENGTH).optional(),
  status: z.enum(['todo', 'in_progress', 'review', 'done', 'blocked']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  assignedTo: z.string().uuid().optional(),
  dueDate: z.string().datetime().optional().transform((val) => val ? new Date(val) : undefined),
});
// ...
export const UpdateTaskDtoSchema = z.object({
  // ...
  status: z.enum(['todo', 'in_progress', 'review', 'done', 'blocked']).optional(),
  // ...
});
```

**Keyin** — ushbu schemalarni to'liq almashtir:
```typescript
/**
 * @module kanban.dto
 * @description Task CRUD DTO + Zod schema.
 * Status qiymatlari: EP-KAN-015 vizyon (4 ustun + bekor/rad).
 * assigner_user_id: EP-KAN-027 assigner-confirm majburiy maydon.
 * dueDate: EP-KAN-047 MAJBURIY (optional emas).
 */

import { z } from 'zod';
import { MAX_DESCRIPTION_LENGTH } from '@common/constants/app.constants';

/** Vizyon EP-KAN-015 ga mos status qiymatlari */
export const KanbanStatusEnum = z.enum([
  'reja',
  'jarayonda',
  'tekshiruvda',
  'bajarildi',
  'bekor',
  'rad',
]);
export type KanbanStatus = z.infer<typeof KanbanStatusEnum>;

// EP-KAN-056: ruxsat etilgan kategoriyalar — egasi master-data sifatida qo'shishi mumkin
// EGASI QIYMATI KERAK: bu ro'yxat master-data jadvali (kan_categories) ga ko'chirilishi kerak
// Hozircha Zod enum sifatida — taqiqlangan hardcode emas, egasi tasdiqlagan ro'yxat:
export const KanbanCategoryEnum = z.enum([
  'ishlab_chiqarish', // Ishlab chiqarish
  'sifat',            // Sifat
  'taminlash',        // Ta'mirlash
  'ombor',            // Ombor
  'sotuv',            // Sotuv
  'mamuray',          // Ma'muriy
  'boshqa',           // Boshqa
  // EGASI QIYMATI KERAK: to'liq ro'yxatni egasi tasdiqlashi shart (EP-KAN-056)
]);
export type KanbanCategory = z.infer<typeof KanbanCategoryEnum>;

export const CreateTaskDtoSchema = z.object({
  title:            z.string().min(3).max(255),
  description:      z.string().max(MAX_DESCRIPTION_LENGTH).optional(),
  // EP-KAN-015: default = 'reja'
  status:           KanbanStatusEnum.default('reja'),
  priority:         z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  // EP-KAN-027: topshiruvchi (kim tayinladi) — integer user ID
  assignerUserId:   z.number().int().positive().optional(),
  // EP-KAN-036: Bajaruvchi MAJBURIY — "ijrochi to'ldirilgan bo'lsa gina 'Jarayonda'ga o'tadi"
  // OCHIQ-JAVOBLAR §KAN: mas'ul yaratilishda ham majburiy (CONTRADICTS: avval optional edi)
  assignedTo:       z.string().uuid({ message: 'assignedTo majburiy (mas\'ul xodim UUID)' }),
  // EP-KAN-047: deadline MAJBURIY
  dueDate:          z.string().datetime({ message: 'dueDate majburiy (ISO8601 format)' })
                     .transform((val) => new Date(val)),
  // EP-KAN-014: karta ID (lavozim kartasi, ixtiyoriy)
  cardId:           z.number().int().positive().optional(),
  // EP-KAN-056/077: kategoriya MAJBURIY — OCHIQ-JAVOBLAR §KAN (CONTRADICTS: avval optional edi)
  category:         KanbanCategoryEnum,
  // EP-KAN-111: kutilayotgan natija
  expectedOutcome:  z.string().max(2000).optional(),
  // EP-KAN-120: maxfiylik
  isConfidential:   z.boolean().default(false),
});

export type CreateTaskDto = z.infer<typeof CreateTaskDtoSchema>;

export const UpdateTaskDtoSchema = z.object({
  title:            z.string().min(3).max(255).optional(),
  description:      z.string().max(MAX_DESCRIPTION_LENGTH).optional(),
  status:           KanbanStatusEnum.optional(),
  priority:         z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assignerUserId:   z.number().int().positive().optional(),
  assignedTo:       z.string().uuid().optional(),
  dueDate:          z.string().datetime().optional()
                     .transform((val) => val ? new Date(val) : undefined),
  cardId:           z.number().int().positive().optional(),
  category:         z.string().max(100).optional(),
  expectedOutcome:  z.string().max(2000).optional(),
  isConfidential:   z.boolean().optional(),
});

export type UpdateTaskDto = z.infer<typeof UpdateTaskDtoSchema>;

/** Assigner-confirm endpoint DTO (EP-KAN-027) */
export const ConfirmCompleteSchema = z.object({
  /** Ixtiyoriy izoh — nima tekshirildi */
  note: z.string().max(500).optional(),
});
export type ConfirmCompleteDto = z.infer<typeof ConfirmCompleteSchema>;

/** Status transition so'rov DTO */
export const MoveTaskStatusSchema = z.object({
  status:           KanbanStatusEnum,
  reason:           z.string().max(500).optional(), // rad/bekor sababi
});
export type MoveTaskStatusDto = z.infer<typeof MoveTaskStatusSchema>;
```

**Fayl 4b:** `apps/api/src/modules/kanban/presentation/kanban.dto.ts`

Bu alohida fayl (dto/ papkasi emas, presentation/ papkasida to'g'ridan). U `KanbanBoardsController` ichida re-export qiladi yoki o'z schemalarini saqlaydi.

```typescript
/**
 * @module kanban.dto (presentation root)
 * @description Task DTO + board-level schemalar.
 * Bu faylni FAQAT bu joyda o'zgartir; dto/kanban.dto.ts = kanonik manba.
 */

import { z } from 'zod';
import { MAX_DESCRIPTION_LENGTH } from '@common/constants/app.constants';

/** Vizyon EP-KAN-015 — status qiymatlari (dto/kanban.dto.ts bilan mos) */
export const KanbanTaskStatusZod = z.enum([
  'reja', 'jarayonda', 'tekshiruvda', 'bajarildi', 'bekor', 'rad',
]);

// EP-KAN-056: ruxsat etilgan kategoriyalar (dto/kanban.dto.ts bilan mos saqlang)
// EGASI QIYMATI KERAK: master-data jadvali (kan_categories) tayyor bo'lgach bu enum o'chiriladi
export const KanbanTaskCategoryZod = z.enum([
  'ishlab_chiqarish', 'sifat', 'taminlash', 'ombor', 'sotuv', 'mamuray', 'boshqa',
  // EGASI QIYMATI KERAK: to'liq ro'yxatni egasi tasdiqlashi shart (EP-KAN-056)
]);

export const CreateTaskSchema = z.object({
  title:           z.string().min(3).max(255),
  description:     z.string().max(MAX_DESCRIPTION_LENGTH).optional(),
  status:          KanbanTaskStatusZod.default('reja'),
  priority:        z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  assignerUserId:  z.number().int().positive().optional(),
  // EP-KAN-036: mas'ul MAJBURIY (OCHIQ-JAVOBLAR §KAN override — avval optional edi)
  assignedTo:      z.string().uuid({ message: 'assignedTo majburiy (mas\'ul xodim UUID)' }),
  dueDate:         z.string().datetime({ message: 'dueDate majburiy' })
                    .transform((val) => new Date(val)),
  cardId:          z.number().int().positive().optional(),
  // EP-KAN-056/077: kategoriya MAJBURIY (OCHIQ-JAVOBLAR §KAN override — avval optional edi)
  category:        KanbanTaskCategoryZod,
  expectedOutcome: z.string().max(2000).optional(),
  isConfidential:  z.boolean().default(false),
});
export type CreateTaskDto = z.infer<typeof CreateTaskSchema>;

export const UpdateTaskSchema = z.object({
  title:           z.string().min(3).max(255).optional(),
  description:     z.string().max(MAX_DESCRIPTION_LENGTH).optional(),
  status:          KanbanTaskStatusZod.optional(),
  priority:        z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assignerUserId:  z.number().int().positive().optional(),
  assignedTo:      z.string().uuid().optional(),
  dueDate:         z.string().datetime().optional()
                    .transform((val) => val ? new Date(val) : undefined),
  cardId:          z.number().int().positive().optional(),
  category:        z.string().max(100).optional(),
  expectedOutcome: z.string().max(2000).optional(),
  isConfidential:  z.boolean().optional(),
});
export type UpdateTaskDto = z.infer<typeof UpdateTaskSchema>;
```

---

### QADAM 5 — `kanban-task.aggregate.ts` ni yangilash

**Fayl:** `apps/api/src/modules/kanban/domain/aggregates/kanban-task.aggregate.ts`

Yangi maydonlar va `confirmComplete()` metodi qo'shiladi.

**Oldin (satr 18-125):** mavjud aggregate

**Keyin:** quyidagi o'zgarishlarni qo'sh (to'liq almashtirma — faqat diff):

1. **Yangi maydonlar** (satr 18 blokiga qo'sh):
```typescript
// --- yangi maydonlar ---
assignerUserId: number | null;      // EP-KAN-027: topshiruvchi
rolloverCount: number;              // EP-KAN-063
originalDeadline: Date | null;      // EP-KAN-065
rolledOverFrom: string | null;      // EP-KAN-065 ('YYYY-MM-DD')
isConfidential: boolean;            // EP-KAN-120
cardId: number | null;              // EP-KAN-014 org_functions FK
category: string | null;            // EP-KAN-077
expectedOutcome: string | null;     // EP-KAN-111
```

2. **Constructor** (satr 34-56 blokiga qo'sh):
```typescript
// Oldin:
this.status = TaskStatus.BACKLOG;
// Keyin:
this.status = TaskStatus.REJA;      // EP-KAN-015 vizyon

// Constructor oxiriga qo'sh:
this.assignerUserId = null;
this.rolloverCount = 0;
this.originalDeadline = null;
this.rolledOverFrom = null;
this.isConfidential = false;
this.cardId = null;
this.category = null;
this.expectedOutcome = null;
```

3. **`complete()` metodini o'zgartir** — to'g'ridan BAJARILDI ga o'tmasin, TEKSHIRUVDA ga o'tsin (EP-KAN-032):
```typescript
// Oldin (satr 105-114):
complete(by: number): Result<void> {
  if (this.status === TaskStatus.DONE) {
    return Err(AppErr('BUSINESS_RULE_VIOLATION', 'Task is already completed'));
  }
  this.status = TaskStatus.DONE;
  // ...
}

// Keyin — TEKSHIRUVDA ga o'tkazish (assigner-confirm kerak):
requestComplete(by: number): Result<void> {
  if (this.status === TaskStatus.BAJARILDI) {
    return Err(AppErr('BUSINESS_RULE_VIOLATION', 'Task allaqachon bajarildi'));
  }
  if (this.status === TaskStatus.TEKSHIRUVDA) {
    return Err(AppErr('BUSINESS_RULE_VIOLATION', 'Task allaqachon tekshiruvda'));
  }
  this.status = TaskStatus.TEKSHIRUVDA;
  this.updatedAt = _time.now();
  this.addDomainEvent(new KanbanTaskMovedEvent(this.id, 0, by));
  return Ok<void>();
}

/** EP-KAN-027: faqat assigner tasdiqlashi mumkin */
confirmComplete(confirmingUserId: number): Result<void> {
  if (this.status !== TaskStatus.TEKSHIRUVDA) {
    return Err(AppErr('BUSINESS_RULE_VIOLATION', 'Vazifa tekshiruvda holatida emas'));
  }
  if (this.assignerUserId !== null && this.assignerUserId !== confirmingUserId) {
    return Err(AppErr('FORBIDDEN', 'Faqat topshiruvchi (assigner) tasdiqlashi mumkin'));
  }
  this.status = TaskStatus.BAJARILDI;
  this.completedAt = _time.now();
  this.updatedAt = _time.now();
  this.addDomainEvent(new KanbanTaskCompletedEvent(this.id, confirmingUserId));
  return Ok<void>();
}
```

4. **`moveToColumn()` metodida** `TaskStatus.DONE` → `TaskStatus.BAJARILDI` almashtir:
```typescript
// Oldin: if (this.status === TaskStatus.DONE)
// Keyin:
if (this.status === TaskStatus.BAJARILDI) {
  return Err(AppErr('BUSINESS_RULE_VIOLATION', 'Cannot move a completed task'));
}
```

5. **`static create()` metodini kengaytir:**
```typescript
static create(
  title: string,
  description: string,
  boardId: string,
  createdBy: number,
  priority?: TaskPriority,
  options?: {
    assignerUserId?: number;
    dueDate?: Date;
    cardId?: number;
    category?: string;
    expectedOutcome?: string;
    isConfidential?: boolean;
  }
): KanbanTask {
  const task = new KanbanTask(title, description, boardId, createdBy, priority);
  if (options?.assignerUserId) task.assignerUserId = options.assignerUserId;
  if (options?.dueDate) task.dueDate = options.dueDate;
  if (options?.cardId) task.cardId = options.cardId;
  if (options?.category) task.category = options.category;
  if (options?.expectedOutcome) task.expectedOutcome = options.expectedOutcome;
  if (options?.isConfidential !== undefined) task.isConfidential = options.isConfidential;
  return task;
}
```

---

### QADAM 6 — `drizzle-kanban.repo.ts` ni yangilash

**Fayl:** `apps/api/src/modules/kanban/infrastructure/repositories/drizzle-kanban.repo.ts`

**O'zgarishlar:**

1. **`save()` metodida** yangi ustunlarni qo'sh (satr 104-126 ga yangi maydonlar):
```typescript
async save(task: KanbanTask): Promise<Result<KanbanTask>> {
  return db
    .insert(kanban_tasks)
    .values({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      assigner_user_id: task.assignerUserId,     // EP-KAN-027 — YANGI
      assigned_to: task.assigneeId?.toString() ?? null,
      due_date: task.dueDate,
      rollover_count: task.rolloverCount,         // EP-KAN-063 — YANGI
      original_deadline: task.originalDeadline,  // EP-KAN-065 — YANGI
      rolled_over_from: task.rolledOverFrom,      // EP-KAN-065 — YANGI
      is_confidential: task.isConfidential,       // EP-KAN-120 — YANGI
      card_id: task.cardId,                       // EP-KAN-014 — YANGI
      category: task.category,                    // EP-KAN-077 — YANGI
      expected_outcome: task.expectedOutcome,     // EP-KAN-111 — YANGI
      tags: JSON.stringify(task.tags),
      created_by: task.createdBy.toString(),
      created_at: task.createdAt,
      updated_at: task.updatedAt,
    } as typeof kanban_tasks.$inferInsert)
    .returning()
    .execute()
    .then((rows) => {
      if (rows.length === 0) return Err('Failed to save kanban task');
      return Ok(this.toDomain(rows[0]));
    })
    .catch((error) => {
      this.logger.error('Error saving kanban task');
      return Err((error as Error).message);
    });
}
```

2. **`update()` metodida** yangi maydonlarni qo'sh (satr 128-157):
```typescript
if (data.assignerUserId !== undefined) updateData.assigner_user_id = data.assignerUserId;
if (data.rolloverCount !== undefined) updateData.rollover_count = data.rolloverCount;
if (data.originalDeadline !== undefined) updateData.original_deadline = data.originalDeadline;
if (data.rolledOverFrom !== undefined) updateData.rolled_over_from = data.rolledOverFrom;
if (data.isConfidential !== undefined) updateData.is_confidential = data.isConfidential;
if (data.cardId !== undefined) updateData.card_id = data.cardId;
if (data.category !== undefined) updateData.category = data.category;
if (data.expectedOutcome !== undefined) updateData.expected_outcome = data.expectedOutcome;
```

3. **`toDomain()` metodida** phantom boardId ni to'g'irla va yangi maydonlarni o'qi (satr 174-191):
```typescript
private toDomain(row: Record<string, unknown>): KanbanTask {
  const task = new KanbanTask(
    String(row.title ?? ''),
    String(row.description ?? ''),
    String(row.board_id ?? 'unlinked'), // 'default-board' o'rniga 'unlinked' — kamida xatolik ko'rinadi
    parseInt(String(row.created_by)) || 0,
    row.priority as TaskPriority,
  );

  task.id = String(row.id ?? '');
  task.status = (row.status as TaskStatus) ?? TaskStatus.REJA;
  task.assigneeId = row.assigned_to ? parseInt(String(row.assigned_to)) : null;
  task.assignerUserId = row.assigner_user_id ? parseInt(String(row.assigner_user_id)) : null;
  task.rolloverCount = parseInt(String(row.rollover_count ?? 0));
  task.originalDeadline = row.original_deadline ? new Date(String(row.original_deadline)) : null;
  task.rolledOverFrom = row.rolled_over_from ? String(row.rolled_over_from) : null;
  task.isConfidential = Boolean(row.is_confidential ?? false);
  task.cardId = row.card_id ? parseInt(String(row.card_id)) : null;
  task.category = row.category ? String(row.category) : null;
  task.expectedOutcome = row.expected_outcome ? String(row.expected_outcome) : null;
  task.dueDate = row.due_date ? new Date(String(row.due_date)) : null;
  task.tags = safeJsonParse<string[]>(row.tags ? String(row.tags) : null, []);
  task.createdAt = row.created_at ? new Date(String(row.created_at)) : _time.now();
  task.updatedAt = row.updated_at ? new Date(String(row.updated_at)) : _time.now();

  return task;
}
```

4. **Yangi metod — `findByAssignerAndStatus()`** qo'sh (WIP va assigner-confirm uchun):
```typescript
/** EP-KAN-027: assigner-confirm uchun — men topshirgan va tekshiruvda turgan vazifalar */
async findByAssignerPendingConfirm(assignerUserId: number): Promise<Result<KanbanTask[]>> {
  return db
    .select()
    .from(kanban_tasks)
    .where(
      and(
        eq(kanban_tasks.assigner_user_id, assignerUserId),
        sql`${kanban_tasks.status} = 'tekshiruvda'`,
        sql`${kanban_tasks.deleted_at} IS NULL`,
      )
    )
    .orderBy(desc(kanban_tasks.due_date))
    .execute()
    .then((rows) => Ok((Array.isArray(rows) ? rows : []).map((r) => this.toDomain(r))))
    .catch((error) => {
      this.logger.error('findByAssignerPendingConfirm error');
      return Err((error as Error).message);
    });
}

/** EP-KAN-038: WIP chegarasi tekshiruvi — joriy foydalanuvchi uchun jarayonda hisobi */
async countUserTasksByStatus(userId: number | string, status: string): Promise<Result<number>> {
  return db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(kanban_tasks)
    .where(
      and(
        sql`${kanban_tasks.assigned_to} = ${String(userId)}`,
        sql`${kanban_tasks.status} = ${status}`,
        sql`${kanban_tasks.deleted_at} IS NULL`,
      )
    )
    .execute()
    .then((rows) => Ok(Number(rows[0]?.count ?? 0)))
    .catch((error) => Err((error as Error).message));
}
```

---

### QADAM 7 — `kanban.service.ts` WIP va assigner-confirm to'g'irlash

**Fayl:** `apps/api/src/modules/kanban/application/kanban.service.ts`

**O'zgarish 1 — WIP limitini to'g'irla (satr 24-27):**
```typescript
// Oldin:
const DEFAULT_WIP_LIMITS: WipLimitConfig = {
  [TaskStatus.IN_PROGRESS]: 10,
  [TaskStatus.REVIEW]: 5,
};

// Keyin (EP-KAN-038: hozirgi foydalanuvchi uchun max 3 jarayonda):
const DEFAULT_WIP_LIMITS: WipLimitConfig = {
  [TaskStatus.JARAYONDA]: 3,  // EP-KAN-038: per-user WIP = 3
};
```

**O'zgarish 2 — `checkWipLimit()` metodini per-user qil (satr 146-161):**

Mavjud checkWipLimit global hisoblaydi — bu noto'g'ri. Yangi versiya:
```typescript
private async checkWipLimit(
  newStatus: TaskStatus,
  currentUserId: number | string,
  currentTaskId?: string,
): Promise<void> {
  const limit = this.wipLimits[newStatus];
  if (!limit) return;

  // EP-KAN-038: hozirgi foydalanuvchi uchun WIP hisoblash
  const countResult = await this.kanbanRepo.countUserTasksByStatus(currentUserId, newStatus);
  if (!countResult.ok) return; // repo xatosi = ruxsat ber (xavfsizlik)

  const currentCount = countResult.data;
  if (currentCount >= limit) {
    throw new BadRequestException(
      `WIP chegarasi oshib ketdi: siz "${newStatus}" da max ${limit} ta vazifa olib borishingiz mumkin (hozir: ${currentCount})`
    );
  }
}
```

**O'zgarish 3 — yangi `confirmComplete()` metodi qo'sh:**
```typescript
/** EP-KAN-027: assigner tasdiqlash — TEKSHIRUVDA → BAJARILDI */
async confirmComplete(
  taskId: string,
  confirmingUserId: number,
  note?: string,
): Promise<Result<object, AppError>> {
  return safeCall(async () => {
    // 1. Task ni olish
    const taskResult = await this.kanbanRepo.findById(taskId);
    if (!taskResult.ok) throw new Error(taskResult.error);
    const task = taskResult.data;
    if (!task) throw new NotFoundException('Vazifa topilmadi');

    // 2. Assigner-confirm logikasi (EP-KAN-027)
    const confirmResult = task.confirmComplete(confirmingUserId);
    if (!confirmResult.ok) throw new BadRequestException(confirmResult.error.message);

    // 3. DBga yozish
    const updateResult = await this.kanbanRepo.update(taskId, {
      status: task.status,
      completedAt: task.completedAt,
    } as Partial<KanbanTask>);
    if (!updateResult.ok) throw new Error('DB yangilashda xato');

    // 4. Log + event
    this.logger.log(`EP-KAN-027 assigner-confirm: task=${taskId} confirmedBy=${confirmingUserId}`);
    await this.eventEmitter.emit('kanban.task.confirmed', {
      taskId,
      confirmedBy: confirmingUserId,
      note,
    });

    return { taskId, status: 'bajarildi', confirmedBy: confirmingUserId };
  });
}
```

**O'zgarish 4 — `createTask()` da phantom boardId olib tashla:**
```typescript
// Oldin (satr 55-63):
const task = await this.commandBus.execute(
  new CreateTaskCommand(
    dto.title,
    dto.description || '',
    'default-board',    // ← PHANTOM
    Number(userId),
    dto.priority as TaskPriority,
  ),
);

// Keyin:
const task = await this.commandBus.execute(
  new CreateTaskCommand(
    dto.title,
    dto.description || '',
    'personal',         // ixtiyoriy board nomi — P03 bilan kelishilgan so'ng haqiqiy board IDga o'zgartiriladi
    Number(userId),
    dto.priority as TaskPriority,
    {
      assignerUserId: dto.assignerUserId,
      dueDate: dto.dueDate,
      cardId: dto.cardId,
      category: dto.category,
      expectedOutcome: dto.expectedOutcome,
      isConfidential: dto.isConfidential,
    }
  ),
);
```

---

### QADAM 8 — `kanban-boards.controller.ts` ga assigner-confirm endpoint qo'sh

**Fayl:** `apps/api/src/modules/kanban/presentation/kanban-boards.controller.ts`

Mavjud controllerta yangi endpoint qo'sh (o'chirilmaydigan mavjud endpointlar saqlangan holda):

```typescript
// import qo'shish (fayl tepasiga):
import { KanbanService } from '../application/kanban.service';
import { ConfirmCompleteSchema } from '../dto/kanban.dto';

// Constructor ga KanbanService qo'sh:
constructor(
  private readonly boardsSvc: KanbanBoardsService,
  private readonly extSvc: KanbanExtService,
  private readonly kanbanSvc: KanbanService,  // YANGI
) {}

// Controller ichiga yangi endpoint qo'sh:

// ─── Assigner-confirm (EP-KAN-027) ───────────────────────────────────────────

@Patch('tasks/:id/confirm-complete')
@ApiOperation({ summary: 'Vazifani assigner sifatida tasdiqlash (EP-KAN-027)' })
@HttpCode(HttpStatus.OK)
async confirmTaskComplete(
  @Param('id') id: string,
  @Body() body: unknown,
  @CurrentUser() user: AuthenticatedUser,
) {
  const dto = ConfirmCompleteSchema.parse(body);
  const result = await this.kanbanSvc.confirmComplete(id, user.id, dto.note);
  if (!result.ok) throwFromError(result.error);
  return result.data;
}

// ─── Mening tasdiqlashim kutilayotgan vazifalar (EP-KAN-027) ─────────────────

@Get('tasks/pending-my-confirm')
@ApiOperation({ summary: "Men topshirgan, tekshiruvda turgan vazifalar (EP-KAN-027)" })
async getMyPendingConfirm(@CurrentUser() user: AuthenticatedUser) {
  const result = await this.kanbanSvc.getPendingAssignerConfirm(user.id);
  if (!result.ok) throwFromError(result.error);
  return result.data;
}
```

**Eslatma:** `getPendingAssignerConfirm()` metodini ham `kanban.service.ts` ga qo'sh:
```typescript
async getPendingAssignerConfirm(assignerUserId: number): Promise<Result<object, AppError>> {
  return safeCall(async () => {
    const result = await this.kanbanRepo.findByAssignerPendingConfirm(assignerUserId);
    if (!result.ok) throw new Error(result.error);
    return { items: result.data, total: result.data.length };
  });
}
```

---

### QADAM 9 — `kanban.module.ts` da KanbanController ro'yxatga qo'sh

**Fayl:** `apps/api/src/modules/kanban/kanban.module.ts`

Bu eng muhim fix — satr 55-62 `controllers[]` arrayiga `KanbanController` qo'sh:

**Oldin (satr 55-62):**
```typescript
controllers: [
  KanbanBoardsController,
  KanbanCoreController,
  KanbanReportsController,
  KanbanCardsController,
  KanbanCardFilesController,
  KanbanChecklistController,
],
```

**Keyin:**
```typescript
controllers: [
  KanbanController,             // GET/POST/PATCH/DELETE /kanban — AVVAL YO'Q EDI
  KanbanBoardsController,
  KanbanCoreController,
  KanbanReportsController,
  KanbanCardsController,
  KanbanCardFilesController,
  KanbanChecklistController,
],
```

**Tekshir:** import allaqachon satr 33 da bor (`import { KanbanController }`). Faqat `controllers[]` ga qo'shish kifoya.

---

### QADAM 10 — Rasporyajenie→Kanban ko'prigi (COR-051/054) — YANGI

**Manba:** OCHIQ-JAVOBLAR §COR: "EP-COR-051: rasporyajenie (farmoyish/topshiriq) = KANBAN doskaga ko'chiriladi. ⭐ Chegaraviy printsip: topshiriq/vazifa IJROSI = KANBAN."
**EP-COR-054:** "Распоряжение lifecycle (rad etish/muddat so'rash; 8-holatli oqim) → KANBAN (распоряжение Kanban'da yashaydi)."

**Muammo:** Direktiva bu ko'prikni BUTUNLAY o'tkazib yuborgan — 00-INTERVYU-MOSLIK.md §2 KAN qatorida aniq: "rasporyajenie→Kanban bridge (COR-051/054) butunlay yo'q".

**Kerakli fayllar:**

**Fayl A:** `apps/api/src/modules/kanban/application/kanban-rasporyajenie-bridge.service.ts`

```typescript
/**
 * @module kanban-rasporyajenie-bridge.service
 * @description COR Rasporyajenie → KAN Task ko'prigi.
 * EP-COR-051: farmoyish IJROSI = Kanban (COR modul governance saqlaydi).
 * EP-COR-054: rad etish/muddat so'rash lifecycle → Kanban tomonida boshqariladi.
 * EP-COR-052: bitta asosiy mas'ul + ixtiyoriy yordamchilar.
 * QOIDA (modul chegarasi): bu service faqat KAN modulining o'z jadvallariga yozadi.
 * COR jadvaliga HECH QACHON yozmaydi — faqat o'qiydi (MODUL_SHARTNOMASI.md).
 */
@Injectable()
export class KanbanRasporyajenieBridgeService {
  private readonly logger = new Logger(KanbanRasporyajenieBridgeService.name);

  constructor(
    @Inject(KANBAN_REPO) private readonly kanbanRepo: IKanbanRepo,
  ) {}

  /**
   * COR tomonidan chiqarilgan rasporyajenie → kanban_tasks yangi vazifa.
   * Trigger: COR modul RasporyajenieIssuedEvent event'ini chiqaradi,
   * bu service shu eventni tinglaydi.
   * EP-COR-051: farmoyish ijrochisining Kiruvchi savatiga avtomat vazifa tug'iladi.
   */
  @OnEvent('cor.rasporyajenie.issued')
  async onRasporyajenieIssued(event: {
    rasporyajenieId: number;
    title: string;
    assigneeUserId: number;
    assignerUserId: number;
    dueDate: string;      // ISO8601
    priority: 'low' | 'medium' | 'high' | 'urgent';
    category: string;     // EP-COR mas'ul beradi, KAN kategoriyasiga map qilinadi
  }): Promise<void> {
    const result = await this.createFromRasporyajenie(event);
    if (!result.ok) {
      this.logger.error(
        `code=EP-COR-051 rasporyajenie→task XATO: raspId=${event.rasporyajenieId} err=${result.error.message}`
      );
    } else {
      this.logger.log(
        `code=EP-COR-051 rasporyajenie→task OK: raspId=${event.rasporyajenieId} taskId=${result.data.id}`
      );
    }
  }

  /**
   * Rasporyajenie ma'lumotidan KAN task yaratish.
   * EP-COR-052: bitta asosiy mas'ul (assignedTo) + assigner (beruvchi).
   */
  async createFromRasporyajenie(input: {
    rasporyajenieId: number;
    title: string;
    assigneeUserId: number;
    assignerUserId: number;
    dueDate: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    category: string;
  }): Promise<Result<{ id: string }>> {
    // EP-KAN-047: dueDate majburiy — COR dan keladi, tekshiramiz
    if (!input.dueDate) {
      return Err(AppErr('VALIDATION', 'dueDate majburiy (COR farmoyishida muddat bo\'lishi shart)'));
    }
    if (!input.assigneeUserId) {
      return Err(AppErr('VALIDATION', 'assigneeUserId majburiy (mas\'ul xodim ko\'rsatilmagan)'));
    }

    // Category map: COR kategoriyasi → KAN kategoriyasi
    // EGASI QIYMATI KERAK: to'liq mapping jadvalini egasi tasdiqlashi shart
    const categoryMap: Record<string, string> = {
      'kadrlar': 'mamuray',
      'asosiy': 'ishlab_chiqarish',
      'moliya': 'mamuray',
      'xojalik': 'mamuray',
    };
    const kanCategory = categoryMap[input.category?.toLowerCase()] ?? 'boshqa';

    const task = KanbanTask.create(
      `[Farmoyish #${input.rasporyajenieId}] ${input.title}`,
      `COR farmoyishidan avtomat yaratildi. Asl farmoyish ID: ${input.rasporyajenieId}`,
      'rasporyajenie',   // board nomi — P03 tayyor bo'lgach haqiqiy board IDga almashtiriladi
      input.assignerUserId,
      input.priority as TaskPriority,
      {
        assignerUserId: input.assignerUserId,
        dueDate: new Date(input.dueDate),
        category: kanCategory,
        isConfidential: false,
      }
    );
    // assignedTo — ijrochi (EP-COR-052 asosiy mas'ul)
    task.assigneeId = input.assigneeUserId;

    const saveResult = await this.kanbanRepo.save(task);
    if (!saveResult.ok) return Err(saveResult.error);

    return Ok({ id: saveResult.data.id });
  }

  /**
   * Rad etish yoki muddat so'rash — EP-COR-054 lifecycle.
   * Ijrochi KAN taskini rad etsa yoki uzaytirish so'rasa → COR ga event.
   * KAN tomonida status 'rad' yoki yangi due_date bilan update.
   */
  async rejectOrExtend(input: {
    taskId: string;
    userId: number;
    action: 'reject' | 'extend';
    reason: string;
    newDueDate?: string;  // 'extend' uchun
  }): Promise<Result<void>> {
    const taskResult = await this.kanbanRepo.findById(input.taskId);
    if (!taskResult.ok) return Err(taskResult.error);
    if (!taskResult.data) return Err(AppErr('NOT_FOUND', 'Vazifa topilmadi'));

    const task = taskResult.data;
    // Faqat ijrochi (assignedTo) rad eta oladi yoki uzaytirish so'ray oladi
    if (task.assigneeId !== input.userId) {
      return Err(AppErr('FORBIDDEN', 'Faqat mas\'ul xodim rad yoki uzaytirish so\'ray oladi'));
    }

    if (input.action === 'reject') {
      task.status = TaskStatus.RAD;
    } else if (input.action === 'extend' && input.newDueDate) {
      task.originalDeadline = task.dueDate;
      task.dueDate = new Date(input.newDueDate);
      task.rolloverCount = (task.rolloverCount ?? 0) + 1;
    }

    const updateResult = await this.kanbanRepo.update(input.taskId, {
      status: task.status,
      dueDate: task.dueDate,
      originalDeadline: task.originalDeadline,
      rolloverCount: task.rolloverCount,
    } as Partial<KanbanTask>);
    if (!updateResult.ok) return Err(updateResult.error);

    // EP-COR-054: COR moduliga qayta event yubor (beruvchi tasdiqlaydi/rad etadi)
    // Bu event COR modul tomonidan tinglansiin — KAN COR ga to'g'ridan yozmaydi
    this.logger.log(
      `code=EP-COR-054 action=${input.action} taskId=${input.taskId} userId=${input.userId} reason="${input.reason}"`
    );
    // EventBus: KanbanTaskRejectedOrExtendedEvent → COR modul listener
    // (event klassi alohida event-handlers/ ga qo'shiladi)

    return Ok(undefined);
  }
}
```

**Fayl B:** `apps/api/src/modules/kanban/presentation/kanban-rasporyajenie-bridge.controller.ts`

```typescript
/**
 * @module kanban-rasporyajenie-bridge.controller
 * @description COR-KAN ko'prigi REST endpoint'lari.
 * EP-COR-051/054: farmoyish ijrosi Kanban'da.
 * Faqat transport qatlami — biznes logika KanbanRasporyajenieBridgeService'da (Qoida 6).
 */

const RejectOrExtendSchema = z.object({
  action:      z.enum(['reject', 'extend']),
  reason:      z.string().min(1).max(500, { message: 'Sabab majburiy (max 500 belgi)' }),
  newDueDate:  z.string().datetime().optional(),  // 'extend' uchun
}).refine(
  (data) => !(data.action === 'extend' && !data.newDueDate),
  { message: 'extend uchun newDueDate majburiy', path: ['newDueDate'] }
);

@Controller('kanban/rasporyajenie')
@UseGuards(JwtAuthGuard)
@ApiTags('Kanban — COR Ko\'prigi (EP-COR-051/054)')
export class KanbanRasporyajenieBridgeController {
  constructor(
    private readonly bridgeService: KanbanRasporyajenieBridgeService,
  ) {}

  /**
   * POST /api/kanban/rasporyajenie
   * COR admini/boshlig'i farmoyishni KAN task'ga qo'lda ham yaratishi uchun.
   * Odatda COR event orqali avtomat — bu endpoint manual trigger uchun.
   * EP-COR-051.
   */
  @Post()
  @Roles('cor_admin', 'super_admin', 'director')
  @ApiOperation({ summary: 'Farmoyishdan KAN task yaratish (EP-COR-051)' })
  async createFromRasporyajenie(@Body() body: unknown) {
    const schema = z.object({
      rasporyajenieId: z.number().int().positive(),
      title:           z.string().min(1).max(255),
      assigneeUserId:  z.number().int().positive(),
      assignerUserId:  z.number().int().positive(),
      dueDate:         z.string().datetime(),
      priority:        z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
      category:        z.string().max(100).default('mamuray'),
    });
    const dto = schema.parse(body);
    const result = await this.bridgeService.createFromRasporyajenie(dto);
    if (!result.ok) throw new BadRequestException(result.error.message);
    return result.data;
  }

  /**
   * PATCH /api/kanban/rasporyajenie/tasks/:id/reject-or-extend
   * Ijrochi farmoyishni rad etadi yoki muddatni uzaytirish so'raydi.
   * EP-COR-054: sabab MAJBURIY.
   */
  @Patch('tasks/:id/reject-or-extend')
  @ApiOperation({ summary: 'Farmoyishni rad yoki muddat so\'rash (EP-COR-054)' })
  async rejectOrExtend(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const dto = RejectOrExtendSchema.parse(body);
    const result = await this.bridgeService.rejectOrExtend({
      taskId:     id,
      userId:     user.id,
      action:     dto.action,
      reason:     dto.reason,
      newDueDate: dto.newDueDate,
    });
    if (!result.ok) {
      if (result.error.code === 'FORBIDDEN') throw new ForbiddenException(result.error.message);
      if (result.error.code === 'NOT_FOUND') throw new NotFoundException(result.error.message);
      throw new BadRequestException(result.error.message);
    }
    return { ok: true, action: dto.action };
  }
}
```

**DDL:** Rasporyajenie ko'prigi uchun yangi jadval kerak emas — mavjud `kanban_tasks` ishlatiladi. Faqat `rasporyajenie_id` ustuni qo'shilishi foydali bo'ladi (FK backlink):

```sql
-- kan-phase1-task-columns.sql ga QO'SHIMCHA qilish (yoki alohida patch):
ALTER TABLE kanban_tasks
  ADD COLUMN IF NOT EXISTS rasporyajenie_id INTEGER;
-- EGASI QIYMATI KERAK: FK → cor_rasporyajeniya(id) — COR jadval nomi aniqlanganidan keyin qo'shiladi
-- Hozircha FK yo'q, faqat integer manba-ID uchun
```

> ⚠️ **STOP POINT:** `kanban_tasks.rasporyajenie_id` ustunini `kan-phase1-task-columns.sql` migration'ga qo'shish uchun **egasi ruxsati** kerak (DDL DARVOZASI). Hozircha service va controller yoziladi, migration'ga qo'shish alohida belgilanadi.

**Module ro'yxati (egasi "ha" degach):**
```typescript
// kanban.module.ts providers[] ga qo'sh:
KanbanRasporyajenieBridgeService,
// kanban.module.ts controllers[] ga qo'sh:
KanbanRasporyajenieBridgeController,
```

---

## 5. DDL (GATED)

```sql
-- ═══════════════════════════════════════════════════════════════════════
-- FAYL: kan-phase1-task-columns.sql
-- MAQSAD: kanban_tasks jadvaliga EP-KAN vizyon ustunlari + status enum yangilash
-- TASDIQLASH ZARUR: egasi quyidagi qatorni to'ldirsin:
-- APPROVED: <egasi ismi> <tasdiqlash sanasi>
-- ═══════════════════════════════════════════════════════════════════════
-- ⛔ BU MIGRATION APPROVED: qatori to'ldirilmaguncha ISHGA TUSHIRILMAYDI ⛔
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

-- 1. Yangi ustunlar
ALTER TABLE kanban_tasks
  ADD COLUMN IF NOT EXISTS assigner_user_id INTEGER
    REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS rollover_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS original_deadline TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rolled_over_from DATE,
  ADD COLUMN IF NOT EXISTS is_confidential BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS card_id INTEGER
    REFERENCES org_functions(id) ON DELETE SET NULL,
  -- EP-KAN-056: kategoriya — MAJBURIY (OCHIQ-JAVOBLAR §KAN override; avval optional edi)
  -- EGASI QIYMATI KERAK: NOT NULL qilishdan oldin mavjud qatorlarni to'ldirish kerak
  ADD COLUMN IF NOT EXISTS category VARCHAR(100),
  ADD COLUMN IF NOT EXISTS expected_outcome TEXT,
  -- EP-COR-051/054: COR-KAN ko'prigi — qaysi farmoyishdan kelgan
  -- FK → cor jadvali nomi egasi tasdiqlaydi; hozircha plain integer
  -- EGASI QIYMATI KERAK: COR jadval nomini aniqlaganidan keyin FK qo'shiladi
  ADD COLUMN IF NOT EXISTS rasporyajenie_id INTEGER;

-- 2. due_date NOT NULL (EP-KAN-047)
UPDATE kanban_tasks SET due_date = NOW() WHERE due_date IS NULL AND deleted_at IS NULL;
ALTER TABLE kanban_tasks ALTER COLUMN due_date SET NOT NULL;

-- 3. Status enum (EP-KAN-015)
CREATE TYPE kanban_status_v2 AS ENUM (
  'reja', 'jarayonda', 'tekshiruvda', 'bajarildi', 'bekor', 'rad'
);

ALTER TABLE kanban_tasks
  ALTER COLUMN status TYPE kanban_status_v2
    USING (CASE status::text
      WHEN 'backlog'     THEN 'reja'::kanban_status_v2
      WHEN 'todo'        THEN 'reja'::kanban_status_v2
      WHEN 'in_progress' THEN 'jarayonda'::kanban_status_v2
      WHEN 'review'      THEN 'tekshiruvda'::kanban_status_v2
      WHEN 'done'        THEN 'bajarildi'::kanban_status_v2
      WHEN 'blocked'     THEN 'bekor'::kanban_status_v2
      ELSE 'reja'::kanban_status_v2
    END);

-- 4. Indekslar
CREATE INDEX IF NOT EXISTS kanban_tasks_assigner_user_id_idx
  ON kanban_tasks(assigner_user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS kanban_tasks_card_id_idx
  ON kanban_tasks(card_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS kanban_tasks_rollover_idx
  ON kanban_tasks(rollover_count) WHERE deleted_at IS NULL AND rollover_count > 0;
CREATE INDEX IF NOT EXISTS kanban_tasks_due_date_idx
  ON kanban_tasks(due_date) WHERE deleted_at IS NULL;

COMMIT;

-- Rollback qadami (agar kerak bo'lsa):
-- BEGIN;
-- ALTER TABLE kanban_tasks ALTER COLUMN status TYPE text
--   USING status::text;
-- ALTER TABLE kanban_tasks
--   DROP COLUMN IF EXISTS assigner_user_id,
--   DROP COLUMN IF EXISTS rollover_count,
--   DROP COLUMN IF EXISTS original_deadline,
--   DROP COLUMN IF EXISTS rolled_over_from,
--   DROP COLUMN IF EXISTS is_confidential,
--   DROP COLUMN IF EXISTS card_id,
--   DROP COLUMN IF EXISTS category,
--   DROP COLUMN IF EXISTS expected_outcome;
-- DROP TYPE IF EXISTS kanban_status_v2;
-- COMMIT;
```

**DDL HAQIDA MUHIM ESLATMALAR:**

1. **`kanban_status_v2`** yangi ENUM — eski `kanbanTaskStatusEnum` (schema-enums.ts) ni o'chirmaydi. Ular parallel mavjud bo'lishi mumkin. Egasi bilan kelish: eski enum qachon o'chiriladi?

2. **`card_id → org_functions(id)`** FK — `org_functions` jadvali P04 paketi tomonidan yaratiladi. Agar P04 P42 dan keyin ishlasa, FK qo'shilishi sequencing muammosi bo'ladi. Bu holatda egasiga flag qiling va FK ni alohida migration ga o'tkazing.

3. **`due_date NOT NULL`** — mavjud qatorlarni NOW() bilan to'ldirish = data yo'qotmaydi, lekin semantik aniq emas. Egasi bilan kelish: ma'lumotlar bor bo'lsa qanday value qo'yish kerak?

---

## 6. QABUL MEZONI (Checklist)

### Asosiy tekshiruvlar

- [ ] **BE tsc 0** — `pnpm --filter @europrint/api build` xatosiz
- [ ] **FE tsc 0** — `pnpm --filter erp-dashboard build` xatosiz (agar FE o'zgarsa)
- [ ] `GET /api/kanban` → **200** (avval unreachable edi, KanbanController ro'yxatga qo'shildi)
- [ ] `POST /api/kanban` → task yaratiladi, `kanban_tasks` da haqiqiy DB qator bor
- [ ] `PATCH /api/kanban/:id/confirm-complete` — assigner bo'lmagan user → **403**
- [ ] `PATCH /api/kanban/:id/confirm-complete` — assigner user → **200**, status=`bajarildi`
- [ ] Task yaratish `dueDate` siz → **400** Zod xato
- [ ] `jarayonda` da 3 ta vazifa bor, 4chi qo'shmoqchi → **400** WIP xato
- [ ] `jarayonda` da 3 ta vazifa bor, 4chi qo'shmoqchi (boshqa status → 201 muvaffaqiyatli)

### DB-proof tekshiruvlar

- [ ] `kanban_tasks` jadvalida yangi ustunlar mavjud:
  ```sql
  SELECT column_name FROM information_schema.columns
  WHERE table_name = 'kanban_tasks'
  ORDER BY ordinal_position;
  -- assigner_user_id, rollover_count, original_deadline, rolled_over_from,
  -- is_confidential, card_id, category, expected_outcome ko'rinishi kerak
  ```
- [ ] Task yaratish → DBda haqiqiy qator (SELECT * FROM kanban_tasks WHERE ...)
- [ ] Assigner-confirm → DBda status = 'bajarildi' (SELECT status FROM kanban_tasks WHERE id=...)

### Vizyon-moslik tekshiruvlari (Q-40)

- [ ] `TaskStatus.REJA` = `'reja'` (avval `BACKLOG='backlog'` edi)
- [ ] `TaskStatus.JARAYONDA` = `'jarayonda'` (avval `IN_PROGRESS='in_progress'` edi)
- [ ] `TaskStatus.TEKSHIRUVDA` = `'tekshiruvda'` (avval `REVIEW='review'` edi)
- [ ] `TaskStatus.BAJARILDI` = `'bajarildi'` (avval `DONE='done'` edi)
- [ ] `DEFAULT_WIP_LIMITS.jarayonda = 3` (avval `IN_PROGRESS=10` edi)

### Golden-thread regressiya (Q-39)

- [ ] Mavjud board CRUD (`GET /api/kanban/boards`) hamon ishlaydi
- [ ] Mavjud card CRUD (`GET /api/kanban/boards/:id/cards`) hamon ishlaydi
- [ ] Mavjud checklist endpoints hamon ishlaydi
- [ ] Mavjud reports endpoints hamon ishlaydi
- [ ] CC baskets (`GET /api/cc/baskets/summary`) hamon ishlaydi (bu paket tegmaydi)
- [ ] Auth login hamon ishlaydi

### Reviewer skriptlari

```bash
bash scripts/reviewer-result-pattern.sh    # Result<T> FAIL=0
bash scripts/reviewer-array-safety.sh      # Array.isArray FAIL=0
bash scripts/reviewer-as-unknown.sh        # stub FAIL=0
bash scripts/reviewer-jwt-guard.sh         # guard PASS
bash scripts/reviewer-dto-validation.sh    # Zod PASS
```

---

## 7. SELF-VERIFY

### 7.1 BE typecheck

```bash
cd C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module
pnpm --filter @europrint/api build
# Kutilayotgan: BUILD SUCCESS, 0 xato
```

### 7.2 KanbanController route tekshiruvi

```bash
# Backend ishga tushgandan keyin
curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer <valid_jwt_token>" \
  http://localhost:3030/api/kanban
# Kutilayotgan: 200 (avval 404 edi)
```

### 7.3 DB-proof: Yangi ustunlar bor

```bash
# PostgreSQL query runner orqali
psql -U europrint -d europrint -c "
  SELECT column_name, data_type, is_nullable
  FROM information_schema.columns
  WHERE table_name = 'kanban_tasks'
  ORDER BY ordinal_position;
"
# assigner_user_id, rollover_count, is_confidential va boshqalar ko'rinishi kerak
# DIQQAT: migration ishga tushirilmagunicha bu ustunlar YO'Q bo'ladi
```

### 7.4 Task yaratish (dueDate majburiy)

```bash
# dueDate YO'Q → 400
curl -s -X POST http://localhost:3030/api/kanban \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test vazifa","status":"reja","priority":"medium"}'
# Kutilayotgan: {"statusCode":400,"message":"dueDate majburiy ..."}

# dueDate BILAN → 201
curl -s -X POST http://localhost:3030/api/kanban \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test vazifa","status":"reja","priority":"medium","dueDate":"2026-07-01T10:00:00Z"}'
# Kutilayotgan: {"id":"...","status":"reja",...}
```

### 7.5 WIP chegarasi tekshiruvi

```bash
# Avval 3 ta 'jarayonda' vazifa yarating, keyin 4chisin yaratmoqchi bo'ling
# 4chi: PATCH /api/kanban/:id bilan status='jarayonda' ga o'tkazing
# Kutilayotgan: 400 "WIP chegarasi oshib ketdi: ...max 3..."
```

### 7.6 Assigner-confirm oqimi

```bash
# 1. assigner_user_id=USER_A bilan vazifa yarating
# 2. Vazifani 'tekshiruvda' ga o'tkaring (assigned user tomonidan)
# 3. USER_B (assigner emas) tasdiqlashga urinadi → 403 kutilayotgan
curl -s -X PATCH http://localhost:3030/api/kanban/tasks/<task_id>/confirm-complete \
  -H "Authorization: Bearer <USER_B_token>" \
  -H "Content-Type: application/json" \
  -d '{}'
# Kutilayotgan: 403 "Faqat topshiruvchi (assigner) tasdiqlashi mumkin"

# 4. USER_A (assigner) tasdiqlaydi → 200, status='bajarildi'
curl -s -X PATCH http://localhost:3030/api/kanban/tasks/<task_id>/confirm-complete \
  -H "Authorization: Bearer <USER_A_token>" \
  -H "Content-Type: application/json" \
  -d '{"note":"Tekshirdim, to'\''g'\''ri"}'
# Kutilayotgan: {"taskId":"...","status":"bajarildi","confirmedBy":...}

# DB tekshiruv:
# SELECT status FROM kanban_tasks WHERE id='<task_id>';
# → bajarildi
```

### 7.7 StatusEnum tekshiruvi

```typescript
// TypeScript REPL yoki test da:
import { TaskStatus } from './task-status.enum';
console.log(TaskStatus.REJA);       // → 'reja'
console.log(TaskStatus.JARAYONDA);  // → 'jarayonda'
console.log(TaskStatus.TEKSHIRUVDA);// → 'tekshiruvda'
console.log(TaskStatus.BAJARILDI);  // → 'bajarildi'
```

---

## 8. COMMIT

Har qadam uchun alohida commit. Faqat OWNED fayllar `git add` ga kiritiladi.

### Commit 1 — DDL migration fayl

```bash
git add Uzbek-Language-Module/apps/api/src/shared/db/migrations/kan-phase1-task-columns.sql
git commit -m "feat(kan): add kan-phase1-task-columns.sql migration (GATED — awaiting owner approval)

EP-KAN-027 assigner_user_id, EP-KAN-063 rollover_count, EP-KAN-065 original/rolled_over_from,
EP-KAN-120 is_confidential, EP-KAN-014 card_id, EP-KAN-077 category, EP-KAN-111 expected_outcome,
EP-KAN-047 due_date NOT NULL, EP-KAN-015 status enum kanban_status_v2.
Migration NOT executed yet — APPROVED: line empty."
```

### Commit 2 — Enum + schema + Zod

```bash
git add Uzbek-Language-Module/apps/api/src/modules/kanban/domain/enums/task-status.enum.ts
git add Uzbek-Language-Module/apps/api/src/shared/db/schema-misc.ts
git add Uzbek-Language-Module/apps/api/src/modules/kanban/presentation/dto/kanban.dto.ts
git add Uzbek-Language-Module/apps/api/src/modules/kanban/presentation/kanban.dto.ts
git commit -m "fix(kan): align TaskStatus enum to EP-KAN-015 vision (reja/jarayonda/tekshiruvda/bajarildi)

- TaskStatus: BACKLOG/TODO→REJA, IN_PROGRESS→JARAYONDA, REVIEW→TEKSHIRUVDA, DONE→BAJARILDI
- schema-misc: kanban_tasks 8 new columns added to Drizzle schema
- Zod DTOs: status enum updated, dueDate required (EP-KAN-047), new fields added"
```

### Commit 3 — Aggregate + repo + service

```bash
git add Uzbek-Language-Module/apps/api/src/modules/kanban/domain/aggregates/kanban-task.aggregate.ts
git add Uzbek-Language-Module/apps/api/src/modules/kanban/infrastructure/repositories/drizzle-kanban.repo.ts
git add Uzbek-Language-Module/apps/api/src/modules/kanban/application/kanban.service.ts
git commit -m "feat(kan): assigner-confirm flow + WIP=3 fix + new domain fields

- KanbanTask.confirmComplete(): only assigner can confirm TEKSHIRUVDA→BAJARILDI (EP-KAN-027)
- KanbanTask.requestComplete(): executor moves to TEKSHIRUVDA (not BAJARILDI directly)
- KanbanService.confirmComplete(): service method + event emission
- WipLimitConfig: IN_PROGRESS=10 → JARAYONDA=3 per-user (EP-KAN-038)
- DrizzleKanbanRepo: save/update/toDomain updated for all new columns"
```

### Commit 4 — Controller + module

```bash
git add Uzbek-Language-Module/apps/api/src/modules/kanban/presentation/kanban-boards.controller.ts
git add Uzbek-Language-Module/apps/api/src/modules/kanban/kanban.module.ts
git commit -m "fix(kan): register KanbanController + add confirm-complete endpoint (EP-KAN-027)

- kanban.module.ts: KanbanController added to controllers[] (was imported but not registered)
- kanban-boards.controller.ts: PATCH /kanban/tasks/:id/confirm-complete endpoint
- GET /kanban now reachable (was dead — unreachable routes fixed)"
```

---

## 9. EGASIGA XABAR (Holat hisoboti — Q-38)

Har commit dan keyin egaga Uzbek tilida qisqa hisobot ber:

**Namuna:**
```
P42 KAN qadam X bajarildi. 
✅ [nima qilindi]
✅ [tekshiruv natijasi]
⚠️ [agar muammo bo'lsa]
Keyingi qadam: [nima keyingi]
```

---

## 10. QOLGAN SCOPE (Bu paketga KIRMAYDI — keyingi fazalar)

Quyidagi xususiyatlar P42 scopeidan tashqari. Alohida paket/fazaga qoldiriladi:

| Xususiyat | EP-KAN | Sabab |
|-----------|--------|-------|
| `personal_tasks` jadvali + soat-grid | EP-KAN-007/049 | Yangi jadval — alohida DDL gate |
| 3-basket personal desktop endpoint | EP-KAN-001 | CC bridge — P38/P39 bilan kelishish kerak |
| PersonalProgram FE sahifasi | EP-KAN-028 | Alohida FE fayl |
| Rollover cron (smena oxiri) | EP-KAN-008/063 | `personal_tasks` jadvalga bog'liq |
| Production order board | EP-KAN-097/098 | MES/PP bilan integratsiya kerak |
| Escalation chain cron | EP-KAN-040/042 | Alohida infra |
| GSD contribution listener | EP-KAN-014 | Aggregate event — GSD modul tayyor bo'lganida |
| Standup mode | EP-KAN-124 | FE feature |
| Brak → rework task | EP-KAN-113 | IoT/MES bilan integratsiya (P15/P16) |
| EP-KAN-### op-code logging | Qoida J | P03 tayyor bo'lganida ro'yxatdan o'tkaziladi |

---

## 11. XAVFLAR VA FLAG QILISH KERAK BO'LGAN HOLATLAR

> Quyidagi holatlar yuzaga kelsa, DARHOL to'xta va egasiga xabar ber (davom etma):

1. **`schema-enums.ts` da `kanbanTaskStatusEnum`** boshqa jadvallarda ham ishlatilsa — eski ENUM ni o'chirishdan OLDIN egasiga so'ra.

2. **`card_id → org_functions(id)` FK sequencing** — `org_functions` jadvali P04 paketi tomonidan yaratilsa va P04 hali ishga tushirilmagan bo'lsa, FK ni migration dan olib tashla, alohida patch migration yoz.

3. **`kanban_tasks` da mavjud qatorlar** (migration dan oldin NULL `due_date` qatorlar) — agar production DB da amaliy qatorlar bo'lsa, `NOW()` bilan to'ldirish semantik noto'g'ri bo'lishi mumkin. Egasiga qanday to'ldirish kerakligi so'ralsin.

4. **`KanbanController` route konflikti** — ro'yxatga qo'shilgandan keyin boshqa controller bilan route to'qnashishi mumkin (`@Controller('kanban')` bitta prefix bir nechta controller da). `KanbanBoardsController` ham `@Controller('kanban')` dan boshlasa — prefix konflikti yo'qligi tekshirilsin.

5. **`createTask()` da `boardId='personal'`** — bu haqiqiy board emas. P03 dan keyingi fazada haqiqiy board lookup kerak. Hozircha `'personal'` placeholder sifatida qabul qilinadi.

6. **Drizzle schema vs DB divergence** — migration ishga tushirilmaguncha, Drizzle schema da yangi ustunlar bor lekin DB da yo'q. `save()` chaqirilsa DB xato beradi. `drizzle-kanban.repo.ts` da `try/catch` Result<T> qaytaradi — service darajasida bu xato gracefully handle qilinadi.

---

*Direktiva yaratildi: 2026-06-19 | Paket: P42 | Wave: 1 | Egasi tasdiqlovi: DDL uchun ZARUR*
