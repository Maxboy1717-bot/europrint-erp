# P43 — KAN: 3-savat desktop + personal_tasks + production board + cronlar

> **Paket:** P43 | **Modul:** KAN | **To'lqin:** 3 | **DDL-darvozasi:** HA
> **Bog'liqlik:** P42 tugagan bo'lishi shart.
> **Sana:** 2026-06-19 | **Bajaruvchi:** Muslimbek | **Til:** Uzbek

---

## 0. ROL VA QOIDALAR

Sen **🟢 BAJARUVCHI**san. Har sessiya boshida `CLAUDE.md` + `docs/agent-constitution.md` o'qi.

**QOIDALAR BLOKI (Q-47):**

1. **Result\<T\>** — hamma repo/service metodi `Promise<Result<T>>` qaytaradi; `throw` / `return null` TAQIQ.
2. **@Body Zod** — har bir controller `@Body` qabul qilsa Zod schema bilan validate qiladi.
3. **Drizzle ORM** — asosiy ORM; raw SQL faqat Drizzle ifodalay olmaydigan murakkab so'rovlarda (`typedExecute<T>` bilan).
4. **Q-40: REAL INSERT + DB-proof** — echo/hardcoded/`[] as unknown` soxta javob TAQIQ. Har o'zgarish jonli DB'da isbotlanadi.
5. **Q-46: Ishlab turgan kod o'chmaydi; buzuq kod to'liq o'chiriladi** — yarim holatda qoldirish TAQIQ.
6. **FAYL IZOLYATSIYASI (Qoida 23/Q-31)** — faqat `§1`'dagi OWNED-FILE ro'yxatiga teg; boshqa fayl kerak bo'lsa TO'XTA + flag qil, supurma.
7. **DDL DARVOZASI (Q-35)** — migration faylida `-- APPROVED: <ism> <sana>` izoh bo'lmasa ishga tushmaydi; egasi stamp qiladi, paket emas.
8. **`git add <aniq-fayl>`** — `-A` TAQIQ (boshqa sessiyalar bir repoda ishlaydi).
9. **Q-45/Q-30** — log/secret commit qilinmaydi; JWT minting yo'q.
10. **Self-verify** — BE tsc 0, FE tsc 0, reviewerlar, jonli DB-proof (`SELECT` bilan tasdiq).
11. **"V2" terminologiya TAQIQ** — bitta kod bor, shu yerda tuzatiladi.
12. **To'g'rilik o'lchovi (Q-40)** — vizyon hujjati (`docs/XARITA-REJA-YONALISH` + `MUSLIMBEK-PROMT-19-KAN-2026-06-08.md`).

**WAVE 3** — bu paket 3-to'lqin. P42 (KAN Phase 1–2: task CRUD + assigner-confirm + CC basket bridge) tugaganidan keyin boshlanadi.

**dependsOn:** `["P42"]` — P42 commit hash tekshirilsin (`git log --oneline -5`).

---

## 1. IZOLYATSIYA MANIFESTI

### FAQAT shu fayllarga teg (OWNED FILES):

```
BE:
  apps/api/src/modules/kanban/application/kanban-desktop.service.ts         [YANGI]
  apps/api/src/modules/kanban/presentation/kanban-desktop.controller.ts     [YANGI]
  apps/api/src/modules/kanban/application/personal-program.service.ts       [YANGI]
  apps/api/src/modules/kanban/infrastructure/repositories/drizzle-personal-tasks.repo.ts [YANGI]
  apps/api/src/modules/kanban/presentation/personal-program.controller.ts   [YANGI]
  apps/api/src/modules/kanban/application/kanban-production.service.ts      [YANGI]
  apps/api/src/modules/kanban/presentation/kanban-production.controller.ts  [YANGI]
  apps/api/src/modules/kanban/application/event-handlers/order-created-kanban.handler.ts [MAVJUD — kichik kengaytma]
  apps/api/src/modules/kanban/infrastructure/repositories/kanban-boards.repo.ts          [MAVJUD — kichik kengaytma]
  apps/api/src/modules/kanban/infrastructure/seed/kanban-templates.seed.ts              [MAVJUD — kengaytma]

Migrations (DDL-GATED):
  apps/api/src/shared/db/migrations/kan-phase3-personal-tasks.sql           [YANGI — DARVOZA]

Crons (YANGI):
  apps/api/src/cron/personal-tasks-rollover.cron.ts                         [YANGI]
  apps/api/src/cron/kanban-escalation.cron.ts                               [YANGI]
  apps/api/src/cron/kanban-shift-relay.cron.ts                              [YANGI]

FE:
  artifacts/erp-dashboard/src/pages/kanban/KanbanDesktop.tsx                [YANGI]
  artifacts/erp-dashboard/src/pages/kanban/PersonalProgram.tsx              [YANGI]
  artifacts/erp-dashboard/src/pages/kanban/ProductionBoard.tsx              [YANGI]
  artifacts/erp-dashboard/src/locales/uz/kanban.json                        [MAVJUD — kengaytma]
  artifacts/erp-dashboard/src/locales/ru/kanban.json                        [MAVJUD — kengaytma]
```

**Boshqa fayl kerak bo'lsa — TO'XTA, egaga flag qil, o'z-o'zicha o'zgartirma.**

### DDL-DARVOZASI QOIDASI:

- `kan-phase3-personal-tasks.sql` faylida `-- APPROVED: <ism> <sana>` izoh bo'lishi SHART.
- Egasi "ha" demagunicha SQL ishga tushmaydi.
- P43 bajaruvchi migratsiyani yozadi, **faqat egasi stamp bosib ruxsat beradi**.
- Darvoza: faylni `migrations/` ga qo'y, lekin `db push` yoki `migrate` QILMA — faqat egasi farmoyishi bilan.

---

## 2. VIZYON (MUSLIMBEK-PROMT-19-KAN dan)

### 2.1 — 3-savat shaxsiy desktop (CC ko'prigi) — EP-KAN-001/005/006

**Maqsad:** `/api/kanban/my-desktop` endpoint — bitta so'rovda:
- CC savatlari (`cc_documents.basket_state` = inbox/pending/outbox, `basket_owner_user_id` = joriy foydalanuvchi) — **CC YAGONA MANBA** (E6 qoidasi).
- `kanban_tasks` — joriy foydalanuvchiga topshirilgan vazifalar.
- Birlashtirilgan, priority+deadline bo'yicha saralangan, paginated javob.

**Qabul mezoni:**
- `GET /api/kanban/my-desktop` → 3-savat (Kiruvchi/Kutilmoqda/Chiquvchi) + kanban vazifalar.
- Drag → `PUT /api/cc/basket/move` (CC tomonida — faqat o'qib chaqiriladi, bu paketda o'zgartirilmaydi).
- 24h SLA badge (CC `cc-sla.cron.ts` dan — ishlamoqda, faqat FE'da ko'rsatiladi).
- FE: BoardPage shablon, 3 ustun, har karta `isInboxOverdue` belgisi.
- **YANGI basket jadvali yaratish TAQIQ** — faqat CC'dan o'qiladi.

### 2.2 — personal_tasks DDL + xizmat + rollover cron — EP-KAN-007/008/009/049/063/064

**Maqsad:** Shaxsiy dastur (soat-grid) — 08:00–18:00 slot, har slot reja/fakt/farq, rollover cron.

**DDL (egasi tasdiqlashi kerak):**
```sql
personal_tasks (
  id SERIAL PK,
  user_id INT NOT NULL → users(id),
  title VARCHAR(300) NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,               -- soat slot (08:00, 09:00 ...)
  rollover_count INT DEFAULT 0,
  rolled_over_from DATE,             -- asl sana
  priority VARCHAR(20) DEFAULT 'medium', -- high/medium/low
  estimate_minutes INT,
  is_habit_template BOOL DEFAULT false,
  locked_at TIMESTAMPTZ,             -- kun oxiri qulflash
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
)
```

**Rollover cron (EP-KAN-063/064):**
- Har kuni smena oxirida (19:00 Toshkent) ishlaydi.
- Tugallanmagan `personal_tasks` → `rollover_count + 1`, `scheduled_date = CURRENT_DATE + 1`.
- `rollover_count >= 3` → escalation event (manager_id zanjiri bo'yicha).
- `locked_at` o'rnatiladi — o'tgan kun o'zgartirib bo'lmaydi.
- Sana-bog'liq (`rolled_over_from IS NOT NULL AND rolled_over_from < scheduled_date`) → eskalatsiya, rollover emas.

**Qabul mezoni:**
- `POST /api/kanban/personal-tasks` → real INSERT, `scheduled_date` + `title` majburiy.
- `GET /api/kanban/personal-tasks?date=YYYY-MM-DD` → soat-grid uchun ro'yxat.
- Rollover cron DB'da ishlashi: `rollover_count` ortishi, `locked_at` o'rnatilishi — SELECT bilan isbotlanadi.

### 2.3 — Production order board + eskalatsiya + shift estafeta cron — EP-KAN-097/098/105/112

**Maqsad:** Har `sales_orders` yozuvi → ishlab chiqarish Kanban kartasi. Ustunlar = real texnologik bosqichlar.

**Texnologik bosqichlar (EuroPrint gofra/offset/flexi/karton):**
```
Yangi buyurtma → Fayl tayyorlash → Bosish (Флексо/Офсет) →
Кесиш → Лаkиминatsiya → Высечка → Qadoqlash → Bajarildi
```
> ⚠️ STOP POINT: Bosqichlar ro'yxatini egasi tasdiqlashi shart (CHAT-TARIXI-YANGI hujjatiga qarang).
> Seed qilishdan oldin egadan: "Texnologik bosqichlar ro'yxati to'g'rimi?"

**Brak → rework vazifa (EP-KAN-113 — E4 IoT-tablet):**
- QC/MES'dan brak event kelganda → `kanban_tasks` ga rework vazifa avtomatik yaratiladi (category='rework', assigner=QC operator).

**Shift estafeta cron (EP-KAN-112):**
- Smena oxirida (har 8/12 soat) — tugallanmagan kartalar ro'yxati → keyingi smena operatori tasdiqlashi uchun notification.

**Eskalatsiya cron (EP-KAN-040/042/043):**
- 24 ish-soati o'tgan tugallanmagan vazifa → assignee'ning direct manager'iga (manager_id zanjiri, Vysotskiy-7).
- Yana 24h → keyingi daraja, CEO'da to'xtaydi.
- `kanban_tasks.escalation_level` ustuni kerak (DDL-GATED).

**Qabul mezoni:**
- `GET /api/kanban/production-board` → `sales_orders` dan kartalar + texnologik bosqich ustunlari.
- `POST /api/kanban/production-board/move` → karta bosqich o'tkazish (real UPDATE).
- Eskalatsiya cron: 24h+ tugallanmagan vazifa → `escalation_level` ortishi DB'da isbotlanadi.
- Shift estafeta cron: smena oxiri logida "estafeta topshirildi: N karta" ko'rinadi.

### 2.4 — FE sahifalari

| Sahifa | Route (P50 wires) | Shablon | Tavsif |
|---|---|---|---|
| `KanbanDesktop.tsx` | `/kanban/desktop` | BoardPage | 3-savat + vazifalar |
| `PersonalProgram.tsx` | `/kanban/personal` | DashboardPage | Soat-grid + rollover badge |
| `ProductionBoard.tsx` | `/kanban/production` | BoardPage | Texnologik bosqich ustunlari |

**Barcha i18n kalit** → `uz/kanban.json` va `ru/kanban.json`'ga.

---

## 3. HOZIRGI HOLAT (re-audit natijalari)

### 3.1 — Mavjud infratuzilma (REAL ishlaydi)

| Narsa | Fayl | Holat |
|---|---|---|
| `kanban_tasks` jadvali | `@shared/db` → `drizzle-kanban.repo.ts:14` | MAVJUD, `kanban_tasks` Drizzle export qilingan |
| `kanban_boards` | `kanban-boards.repo.ts:1-161` | REAL CRUD — Result\<T\>, to'liq |
| `kanban_columns` / `kanban_cards` | `kanban-columns.repo.ts`, `kanban-cards.repo.ts` | MAVJUD, delegatsiya pattern |
| `KanbanBoardsRepository` | `kanban-boards.repo.ts:34` | REAL — boards/columns/cards CRUD |
| `OrderCreatedKanbanHandler` | `order-created-kanban.handler.ts:22` | REAL — `OrderCreatedEvent` → `createKanbanForOrder()` |
| `KanbanRecurringCron` | `cron/kanban-recurring.cron.ts:12` | REAL — takrorlanuvchi kartalar har kuni 07:00 |
| Kanban seed | `kanban-templates.seed.ts:15-109` | REAL — 4 shablon, `onConflictDoNothing()` |
| CC baskets | `cc-baskets.repo.ts:27` | REAL — `listBasket(userId, basket)`, basket_state ustuni |
| `cc-sla.cron.ts` | `communication-center/cron/` | REAL — 24h/48h SLA badge |

### 3.2 — MAVJUD EMAS (P43 quradi)

| Narsa | Holat | Effort |
|---|---|---|
| `kanban-desktop.service.ts` | YO'Q — yaratiladi | O'rta |
| `kanban-desktop.controller.ts` | YO'Q — yaratiladi | Kichik |
| `personal_tasks` jadvali | YO'Q — DDL kerak (GATED) | O'rta |
| `personal-program.service.ts` | YO'Q — yaratiladi | O'rta |
| `drizzle-personal-tasks.repo.ts` | YO'Q — yaratiladi | O'rta |
| `personal-program.controller.ts` | YO'Q — yaratiladi | Kichik |
| `personal-tasks-rollover.cron.ts` | YO'Q — yaratiladi | O'rta |
| `kanban-production.service.ts` | YO'Q — yaratiladi | Katta |
| `kanban-production.controller.ts` | YO'Q — yaratiladi | O'rta |
| `kanban-escalation.cron.ts` | YO'Q — yaratiladi | O'rta |
| `kanban-shift-relay.cron.ts` | YO'Q — yaratiladi | O'rta |
| `KanbanDesktop.tsx` | YO'Q — yaratiladi | O'rta |
| `PersonalProgram.tsx` | YO'Q — yaratiladi | O'rta |
| `ProductionBoard.tsx` | YO'Q — yaratiladi | Katta |

### 3.3 — Muhim muammolar

| Muammo | Joyi | Harakat |
|---|---|---|
| `kanban_tasks.basket_type` ustuni bormi? | `drizzle-kanban.repo.ts` orqali tekshirilsin | Agar bor → E6 two-worlds: TO'XTA + egaga flag |
| `kanban_tasks.assigner_user_id` bormi? | P42 qo'shgan bo'lishi kerak | Tekshir, yo'q bo'lsa P42 tugamagan |
| `escalation_level` ustuni | `kanban_tasks`'da yo'q | DDL (GATED) — eskalatsiya cron uchun kerak |
| CC basket endpoint | `cc-baskets.repo.ts:35` REAL | Desktop service shunga murojaat qiladi |
| `kanban_tasks.basket_type` two-worlds | Tekshirilmagan | Phase 0 talab: jonli DB'dan `\d kanban_tasks` |
| ⚠️ **TUZATILDI (00-INTERVYU-MOSLIK):** `kanban-escalation.cron.ts` SQL `deadline` ustuni | `QADAM 8` kodi | **`deadline` → `due_date`** (kanonik ustun EP-KAN-047). Status filter ham tuzatildi: `'Bajarildi'` → `'bajarildi'` (enum lowercase). Assignee ustun: `assignee_user_id` → `assigned_to`. |

### 3.4 — Modul holati

`kanban.module.ts` da hozir ro'yxatda YO'Q:
- `KanbanDesktopService`, `KanbanDesktopController`
- `PersonalProgramService`, `PersonalProgramController`
- `KanbanProductionService`, `KanbanProductionController`
- `PersonalTasksRolloverCron`, `KanbanEscalationCron`, `KanbanShiftRelayCron`

P43 bajaruvchi ularni `kanban.module.ts`'ga qo'shishi kerak.
> ⚠️ `kanban.module.ts` OWNED FILES ro'yxatida emas — faqat import qo'shish uchun flag qil!

<!-- DAVOMI -->

---

## 4. ISH (qadam-baqadam)

### ⚠️ BOSHLASHDAN OLDIN — Phase 0 verifikatsiya

```bash
# 1. P42 tugaganini tekshir
git log --oneline -5   # P42 commit hash ko'rinishi kerak

# 2. kanban_tasks ustunlarini tekshir (jonli DB)
# _audit/q.cjs yoki psql:
# SELECT column_name FROM information_schema.columns
# WHERE table_name = 'kanban_tasks' ORDER BY ordinal_position;
# Natija: basket_type bor? assigner_user_id bor? escalation_level bor?

# 3. personal_tasks jadvali bormi?
# SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'personal_tasks';
```

Agar `basket_type` ustuni bor va `cc_documents.basket_state` ham bor → **TO'XTA**, egaga flag: "Two-worlds risk: kanban_tasks.basket_type LIVE. E6 bo'yicha CC yagona manba — basket_type ni qanday hal qilamiz?"

---

### QADAM 1 — `kanban-desktop.service.ts` (yangi fayl)

**Fayl:** `apps/api/src/modules/kanban/application/kanban-desktop.service.ts`

**Maqsad:** `GET /api/kanban/my-desktop` uchun CC + kanban_tasks birlashtirish.

```typescript
// OLDIN: fayl mavjud emas

// KEYIN: yangi fayl
@Injectable()
export class KanbanDesktopService {
  constructor(
    @Inject(CC_BASKETS_REPO) private readonly ccBasketsRepo: CcBasketsRepository,
    @Inject(KANBAN_REPO)     private readonly kanbanRepo: IKanbanRepo,
    private readonly logger: Logger,
  ) {}

  async getMyDesktop(userId: number, page = 1, limit = 20): Promise<Result<DesktopResponse>> {
    // 1. CC 3-savat: inbox, pending, outbox
    const [inboxR, pendingR, outboxR] = await Promise.all([
      this.ccBasketsRepo.listBasket(userId, 'inbox'),
      this.ccBasketsRepo.listBasket(userId, 'pending'),
      this.ccBasketsRepo.listBasket(userId, 'outbox'),
    ]);
    if (!inboxR.ok) return Err(inboxR.error);
    if (!pendingR.ok) return Err(pendingR.error);
    if (!outboxR.ok) return Err(outboxR.error);

    // 2. kanban_tasks — assignee = userId, aktiv
    const tasksR = await this.kanbanRepo.findAll({ assignedTo: String(userId), page, limit });
    if (!tasksR.ok) return Err(tasksR.error);

    this.logger.log(`code=EP-KAN-001 action=getMyDesktop userId=${userId}`);
    return Ok({
      baskets: {
        inbox:   inboxR.data,
        pending: pendingR.data,
        outbox:  outboxR.data,
      },
      tasks: tasksR.data,
    });
  }
}
```

**Pattern:** Result\<T\>, Inject, Logger, op-code EP-KAN-001.

---

### QADAM 2 — `kanban-desktop.controller.ts` (yangi fayl)

**Fayl:** `apps/api/src/modules/kanban/presentation/kanban-desktop.controller.ts`

```typescript
@Controller('kanban')
@UseGuards(JwtAuthGuard)
export class KanbanDesktopController {
  constructor(private readonly desktopService: KanbanDesktopService) {}

  @Get('my-desktop')
  async getMyDesktop(@Request() req: AuthRequest, @Query('page') page?: string) {
    const result = await this.desktopService.getMyDesktop(req.user.id, Number(page ?? 1));
    if (!result.ok) throw new InternalServerErrorException(result.error.message);
    return result.data;
  }
}
```

**Transport faqat** — biznes logika yo'q (Qoida 6).

---

### QADAM 3 — DDL: `kan-phase3-personal-tasks.sql` (DDL-GATED)

**Fayl:** `apps/api/src/shared/db/migrations/kan-phase3-personal-tasks.sql`

**⚠️ STOP: Egasi "ha" demagunicha `db migrate` YOKI `db push` qilma.**

```sql
-- APPROVED: <ism> <sana>
-- P43 KAN Phase 3: personal_tasks jadvali + kanban_tasks eskalatsiya ustuni

BEGIN;

-- personal_tasks: shaxsiy kun/soat rejalashtiruv
CREATE TABLE IF NOT EXISTS personal_tasks (
  id                SERIAL PRIMARY KEY,
  user_id           INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title             VARCHAR(300) NOT NULL,
  scheduled_date    DATE NOT NULL,
  scheduled_time    TIME,
  rollover_count    INTEGER NOT NULL DEFAULT 0,
  rolled_over_from  DATE,
  priority          VARCHAR(20) NOT NULL DEFAULT 'medium'
                      CHECK (priority IN ('high','medium','low')),
  estimate_minutes  INTEGER,
  is_habit_template BOOLEAN NOT NULL DEFAULT false,
  locked_at         TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_personal_tasks_user_date
  ON personal_tasks (user_id, scheduled_date)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_personal_tasks_rollover
  ON personal_tasks (user_id, rollover_count)
  WHERE deleted_at IS NULL AND completed_at IS NULL;

-- kanban_tasks: eskalatsiya darajasi (eskalatsiya cron uchun)
ALTER TABLE kanban_tasks
  ADD COLUMN IF NOT EXISTS escalation_level INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS escalated_at     TIMESTAMPTZ;

COMMIT;
```

---

### QADAM 4 — `drizzle-personal-tasks.repo.ts` (yangi fayl)

**Fayl:** `apps/api/src/modules/kanban/infrastructure/repositories/drizzle-personal-tasks.repo.ts`

```typescript
// KEYIN: personal_tasks uchun Result<T> repo
@Injectable()
export class DrizzlePersonalTasksRepo {
  private readonly logger = new Logger(DrizzlePersonalTasksRepo.name);

  async create(input: CreatePersonalTaskInput): Promise<Result<PersonalTask>> {
    // Zod validated before reaching here
    if (!input.scheduledDate || !input.title) {
      return Err({ code: 'VALIDATION', message: 'scheduledDate va title majburiy' });
    }
    try {
      const rows = await db.execute<PersonalTask>(sql`
        INSERT INTO personal_tasks
          (user_id, title, scheduled_date, scheduled_time,
           priority, estimate_minutes, is_habit_template, created_at, updated_at)
        VALUES
          (${input.userId}, ${input.title}, ${input.scheduledDate},
           ${input.scheduledTime ?? null}, ${input.priority ?? 'medium'},
           ${input.estimateMinutes ?? null}, ${input.isHabitTemplate ?? false},
           NOW(), NOW())
        RETURNING *
      `);
      const row = rows.rows[0];
      if (!row) return Err({ code: 'DB_ERROR', message: 'personal_task yaratilmadi' });
      return Ok(row as PersonalTask);
    } catch (e) {
      this.logger.error(`create personal_task: ${String(e)}`);
      return Err({ code: 'DB_ERROR', message: String(e) });
    }
  }

  async findByUserDate(userId: number, date: string): Promise<Result<PersonalTask[]>> {
    try {
      const rows = await db.execute<PersonalTask>(sql`
        SELECT * FROM personal_tasks
        WHERE user_id = ${userId}
          AND scheduled_date = ${date}::date
          AND deleted_at IS NULL
        ORDER BY scheduled_time ASC NULLS LAST, priority DESC
      `);
      return Ok(rows.rows as PersonalTask[]);
    } catch (e) {
      return Err({ code: 'DB_ERROR', message: String(e) });
    }
  }

  async rolloverIncomplete(beforeDate: string): Promise<Result<number>> {
    // Rollover cron uchun: tugallanmagan → rollover_count + 1, sana + 1
    try {
      const result = await db.execute(sql`
        UPDATE personal_tasks
        SET rollover_count   = rollover_count + 1,
            rolled_over_from = COALESCE(rolled_over_from, scheduled_date),
            scheduled_date   = scheduled_date + INTERVAL '1 day',
            locked_at        = CASE WHEN locked_at IS NULL THEN NOW() ELSE locked_at END,
            updated_at       = NOW()
        WHERE scheduled_date < ${beforeDate}::date
          AND completed_at IS NULL
          AND deleted_at   IS NULL
          AND locked_at    IS NULL
      `);
      return Ok((result as { rowCount?: number }).rowCount ?? 0);
    } catch (e) {
      return Err({ code: 'DB_ERROR', message: String(e) });
    }
  }
}
```

**Izoh:** DDL gate o'tgandan keyin bu fayl `personal_tasks` jadvaliga murojaat qiladi. DDL o'tmaguncha `drizzle-personal-tasks.repo.ts` fayli yoziladi lekin injektlanmaydi.

---

### QADAM 5 — `personal-program.service.ts` (yangi fayl)

**Fayl:** `apps/api/src/modules/kanban/application/personal-program.service.ts`

```typescript
@Injectable()
export class PersonalProgramService {
  constructor(
    private readonly personalTasksRepo: DrizzlePersonalTasksRepo,
    private readonly logger: Logger,
  ) {}

  async createTask(userId: number, dto: CreatePersonalTaskDto): Promise<Result<PersonalTask>> {
    this.logger.log(`code=EP-KAN-007 action=createPersonalTask userId=${userId}`);
    return this.personalTasksRepo.create({ userId, ...dto });
  }

  async getDayPlan(userId: number, date: string): Promise<Result<DayPlanResponse>> {
    const tasksR = await this.personalTasksRepo.findByUserDate(userId, date);
    if (!tasksR.ok) return Err(tasksR.error);
    const tasks = tasksR.data;
    // Soat-grid: 08:00–18:00 slot, har slot reja/fakt/farq
    const slots = this._buildSoatGrid(tasks);
    this.logger.log(`code=EP-KAN-050 action=getDayPlan userId=${userId} date=${date}`);
    return Ok({ date, slots, totalTasks: tasks.length });
  }

  private _buildSoatGrid(tasks: PersonalTask[]): SlotEntry[] {
    const hours = Array.from({ length: 11 }, (_, i) => `${String(8 + i).padStart(2,'0')}:00`);
    return hours.map(hour => ({
      hour,
      tasks: tasks.filter(t => t.scheduled_time?.startsWith(hour) ?? false),
      isLocked: tasks.some(t => t.locked_at && t.scheduled_time?.startsWith(hour)),
    }));
  }
}
```

---

### QADAM 6 — `personal-program.controller.ts` (yangi fayl)

**Fayl:** `apps/api/src/modules/kanban/presentation/personal-program.controller.ts`

```typescript
const CreatePersonalTaskSchema = z.object({
  title:           z.string().min(1).max(300),
  scheduledDate:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  scheduledTime:   z.string().regex(/^\d{2}:\d{2}$/).optional(),
  priority:        z.enum(['high','medium','low']).default('medium'),
  estimateMinutes: z.number().int().positive().optional(),
  isHabitTemplate: z.boolean().default(false),
});

@Controller('kanban/personal-tasks')
@UseGuards(JwtAuthGuard)
export class PersonalProgramController {
  constructor(private readonly service: PersonalProgramService) {}

  @Post()
  async create(@Request() req: AuthRequest, @Body() body: unknown) {
    const dto = CreatePersonalTaskSchema.parse(body);  // Zod — throw 400 on fail
    const result = await this.service.createTask(req.user.id, dto);
    if (!result.ok) throw new BadRequestException(result.error.message);
    return result.data;
  }

  @Get()
  async getDayPlan(@Request() req: AuthRequest, @Query('date') date: string) {
    if (!date) throw new BadRequestException('date parametri majburiy (YYYY-MM-DD)');
    const result = await this.service.getDayPlan(req.user.id, date);
    if (!result.ok) throw new InternalServerErrorException(result.error.message);
    return result.data;
  }
}
```

---

### QADAM 7 — `personal-tasks-rollover.cron.ts` (yangi fayl)

**Fayl:** `apps/api/src/cron/personal-tasks-rollover.cron.ts`

```typescript
@Injectable()
export class PersonalTasksRolloverCron {
  private readonly logger = new Logger(PersonalTasksRolloverCron.name);

  constructor(
    private readonly personalTasksRepo: DrizzlePersonalTasksRepo,
    private readonly eventBus: EventBus,
  ) {}

  /** Har kuni 19:00 Toshkent — smena oxirida */
  @Cron('0 19 * * *', { timeZone: 'Asia/Tashkent' })
  async rolloverIncompleteTasks(): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const rollR = await this.personalTasksRepo.rolloverIncomplete(today);
    if (!rollR.ok) {
      this.logger.error(`code=EP-KAN-063 rollover xato: ${rollR.error.message}`);
      return;
    }
    this.logger.log(`code=EP-KAN-063 action=rollover count=${rollR.data}`);

    // rollover_count >= 3 → eskalatsiya
    // Drizzle orqali overdue tasklarni topib EventBus'ga yuborish
    await this._escalateOverRolloverLimit();
  }

  private async _escalateOverRolloverLimit(): Promise<void> {
    try {
      const rows = await db.execute<{ id: number; user_id: number; rollover_count: number }>(sql`
        SELECT id, user_id, rollover_count
        FROM personal_tasks
        WHERE rollover_count >= 3
          AND completed_at IS NULL
          AND deleted_at   IS NULL
        LIMIT 100
      `);
      for (const row of rows.rows) {
        this.logger.warn(
          `code=EP-KAN-064 action=escalate personalTaskId=${row.id} ` +
          `userId=${row.user_id} rolloverCount=${row.rollover_count}`
        );
        // EventBus: PersonalTaskEscalatedEvent → manager bildirishnoma
        // (event klassi P42 yoki ushbu paket event-handlers/ ga qo'shiladi)
        this.eventBus.publish({ type: 'PersonalTaskEscalated', taskId: row.id, userId: row.user_id });
      }
    } catch (e) {
      this.logger.error(`_escalateOverRolloverLimit: ${String(e)}`);
    }
  }
}
```

---

### QADAM 8 — `kanban-escalation.cron.ts` (yangi fayl)

**Fayl:** `apps/api/src/cron/kanban-escalation.cron.ts`

**Maqsad:** `kanban_tasks` da 24 ish-soati o'tgan vazifalarni eskalatsiya qilish.

```typescript
@Injectable()
export class KanbanEscalationCron {
  private readonly logger = new Logger(KanbanEscalationCron.name);

  constructor(private readonly eventBus: EventBus) {}

  /** Har 4 soatda tekshiriladi */
  @Cron('0 */4 * * *', { timeZone: 'Asia/Tashkent' })
  async escalateOverdueTasks(): Promise<void> {
    try {
      // 24h ish-soati — deadline o'tgan, bajarilmagan, eskalatsiya darajasi 0
      // ⚠️ TUZATILDI (00-INTERVYU-MOSLIK §KAN): `deadline` ustuni YO'Q — kanonik = `due_date`
      // Avval: kt.deadline < NOW() - INTERVAL '24 hours'  ← XATO (ustun mavjud emas)
      // Keyin: kt.due_date < NOW() - INTERVAL '24 hours'  ← TO'G'RI (EP-KAN-047 kanonik ustun)
      const rows = await db.execute<{
        id: string; assigned_to: string; escalation_level: number;
      }>(sql`
        SELECT kt.id, kt.assigned_to, kt.escalation_level
        FROM kanban_tasks kt
        WHERE kt.due_date < NOW() - INTERVAL '24 hours'
          AND kt.status NOT IN ('bajarildi', 'bekor', 'rad')
          AND kt.deleted_at IS NULL
          AND kt.escalation_level < 5
        LIMIT 50
      `);

      for (const task of rows.rows) {
        // manager_id zanjiri — Vysotskiy-7
        const newLevel = (task.escalation_level ?? 0) + 1;
        await db.execute(sql`
          UPDATE kanban_tasks
          SET escalation_level = ${newLevel},
              escalated_at     = NOW(),
              updated_at       = NOW()
          WHERE id = ${task.id}
        `);
        // ⚠️ TUZATILDI: `assigned_to` kanonik ustun (uuid string); `assignee_user_id` emas
        this.logger.warn(
          `code=EP-KAN-040 action=escalate taskId=${task.id} ` +
          `assignee=${task.assigned_to} level=${newLevel}`
        );
        this.eventBus.publish({
          type: 'KanbanTaskEscalated',
          taskId: task.id,
          assigneeId: task.assigned_to,  // uuid string — NTF modul konvertatsiya qiladi
          escalationLevel: newLevel,
        });
      }
    } catch (e) {
      this.logger.error(`KanbanEscalationCron: ${String(e)}`);
    }
  }
}
```

---

### QADAM 9 — `kanban-shift-relay.cron.ts` (yangi fayl)

**Fayl:** `apps/api/src/cron/kanban-shift-relay.cron.ts`

**Maqsad:** Smena almashuvi (08:00 va 20:00) da tugallanmagan production kartalarni keyingi smenaga topshirish.

```typescript
@Injectable()
export class KanbanShiftRelayCron {
  private readonly logger = new Logger(KanbanShiftRelayCron.name);

  /** Smena boshi — 08:00 va 20:00 Toshkent */
  @Cron('0 8,20 * * *', { timeZone: 'Asia/Tashkent' })
  async shiftRelay(): Promise<void> {
    try {
      // Ishlab chiqarish boardidagi tugallanmagan kartalar
      const rows = await db.execute<{ id: string; title: string; column_id: string }>(sql`
        SELECT kc.id, kc.title, kc.column_id
        FROM kanban_cards kc
        JOIN kanban_boards kb ON kb.id = kc.board_id
        WHERE kb.type = 'production'
          AND kc.completed_at IS NULL
          AND kc.deleted_at   IS NULL
        LIMIT 100
      `);

      if (rows.rows.length === 0) {
        this.logger.log('code=EP-KAN-112 action=shiftRelay noCards');
        return;
      }

      // Har karta uchun: keyingi smena operatoriga notification (EventBus)
      this.logger.log(
        `code=EP-KAN-112 action=shiftRelay incompleteCards=${rows.rows.length}`
      );
      this.eventBus.publish({
        type: 'KanbanShiftRelayRequired',
        cards: rows.rows.map(r => ({ id: r.id, title: r.title })),
      });
    } catch (e) {
      this.logger.error(`KanbanShiftRelayCron: ${String(e)}`);
    }
  }
}
```

---

### QADAM 10 — `kanban-production.service.ts` (yangi fayl)

**Fayl:** `apps/api/src/modules/kanban/application/kanban-production.service.ts`

```typescript
@Injectable()
export class KanbanProductionService {
  private readonly logger = new Logger(KanbanProductionService.name);

  constructor(
    @Inject(KANBAN_BOARDS_REPO) private readonly boardsRepo: IKanbanBoardsRepo,
  ) {}

  /** sales_orders → production board kartalar */
  async getProductionBoard(): Promise<Result<ProductionBoardResponse>> {
    try {
      const rows = await db.execute<ProductionCardRow>(sql`
        SELECT
          so.id          AS order_id,
          so.order_number,
          so.customer_id,
          so.total_amount,
          so.delivery_date,
          so.status      AS order_status,
          kc.id          AS card_id,
          kc.column_id,
          kcc.name       AS stage_name,
          kc.completed_at,
          kc.created_at  AS card_created_at
        FROM sales_orders so
        LEFT JOIN kanban_cards  kc  ON kc.related_id   = so.id::text
                                    AND kc.related_type = 'sales_order'
                                    AND kc.deleted_at   IS NULL
        LEFT JOIN kanban_columns kcc ON kcc.id = kc.column_id
        WHERE so.deleted_at IS NULL
        ORDER BY so.delivery_date ASC NULLS LAST
        LIMIT 200
      `);
      this.logger.log(`code=EP-KAN-097 action=getProductionBoard count=${rows.rows.length}`);
      return Ok({ cards: rows.rows as ProductionCardRow[] });
    } catch (e) {
      return Err({ code: 'DB_ERROR', message: String(e) });
    }
  }

  /** Kartani texnologik bosqich ustuniga ko'chirish */
  async moveCard(cardId: string, columnId: string, userId: number): Promise<Result<void>> {
    const result = await this.boardsRepo.moveCard(cardId, { columnId });
    if (!result.ok) return Err(result.error);
    this.logger.log(
      `code=EP-KAN-098 action=moveProductionCard cardId=${cardId} ` +
      `columnId=${columnId} userId=${userId}`
    );
    return Ok(undefined);
  }

  /** Brak → rework vazifa (EP-KAN-113) */
  async createReworkTask(input: {
    orderId: number; quantity: number; reason: string; assigneeId: number;
  }): Promise<Result<void>> {
    // kanban_tasks ga INSERT — rework kategoriya
    try {
      // ⚠️ TUZATILDI (00-INTERVYU-MOSLIK §KAN):
      // - `assignee_user_id` ustuni yo'q → `assigned_to` (uuid string)
      // - `deadline` ustuni yo'q → `due_date` (kanonik EP-KAN-047)
      // - priority 'Shoshilinch' → 'urgent' (kanonik enum qiymati)
      // - status 'Yangi' → 'reja' (kanonik kanban_status_v2 EP-KAN-015)
      await db.execute(sql`
        INSERT INTO kanban_tasks
          (title, description, assigned_to, category, priority,
           due_date, status, created_at, updated_at)
        VALUES (
          ${'Rework: buyurtma #' + input.orderId},
          ${'Miqdor: ' + input.quantity + '. Sabab: ' + input.reason},
          ${String(input.assigneeId)}, 'rework', 'urgent',
          NOW() + INTERVAL '24 hours', 'reja', NOW(), NOW()
        )
      `);
      this.logger.log(`code=EP-KAN-113 action=createReworkTask orderId=${input.orderId}`);
      return Ok(undefined);
    } catch (e) {
      return Err({ code: 'DB_ERROR', message: String(e) });
    }
  }
}
```

---

### QADAM 11 — `kanban-production.controller.ts` (yangi fayl)

**Fayl:** `apps/api/src/modules/kanban/presentation/kanban-production.controller.ts`

```typescript
const MoveCardSchema = z.object({
  cardId:   z.string().min(1),
  columnId: z.string().min(1),
});

const ReworkSchema = z.object({
  orderId:    z.number().int().positive(),
  quantity:   z.number().int().positive(),
  reason:     z.string().min(1).max(500),
  assigneeId: z.number().int().positive(),
});

@Controller('kanban/production-board')
@UseGuards(JwtAuthGuard)
export class KanbanProductionController {
  constructor(private readonly service: KanbanProductionService) {}

  @Get()
  async getBoard() {
    const result = await this.service.getProductionBoard();
    if (!result.ok) throw new InternalServerErrorException(result.error.message);
    return result.data;
  }

  @Post('move')
  async moveCard(@Request() req: AuthRequest, @Body() body: unknown) {
    const dto = MoveCardSchema.parse(body);
    const result = await this.service.moveCard(dto.cardId, dto.columnId, req.user.id);
    if (!result.ok) throw new BadRequestException(result.error.message);
    return { ok: true };
  }

  @Post('rework')
  @Roles('qc_operator', 'mes_operator', 'super_admin')
  async createRework(@Body() body: unknown) {
    const dto = ReworkSchema.parse(body);
    const result = await this.service.createReworkTask(dto);
    if (!result.ok) throw new BadRequestException(result.error.message);
    return { ok: true };
  }
}
```

---

### QADAM 12 — `order-created-kanban.handler.ts` kengaytma

**Fayl:** `apps/api/src/modules/kanban/application/event-handlers/order-created-kanban.handler.ts`
**Joyi:** 29-qator — `createKanbanForOrder()` chaqiruvi

```typescript
// OLDIN (29-34 qator):
const result = await this.kanbanBoardsRepo.createKanbanForOrder({
  orderId:     event.orderId,
  orderNumber: event.orderNumber,
  totalAmount: event.totalAmount,
  companyId:   event.companyId,
});

// KEYIN: `related_type='sales_order'` ni aniq uzatamiz
const result = await this.kanbanBoardsRepo.createKanbanForOrder({
  orderId:     event.orderId,
  orderNumber: event.orderNumber,
  totalAmount: event.totalAmount,
  companyId:   event.companyId,
  relatedType: 'sales_order',  // production board uchun JOIN kaliti
});
```

**Natija:** `kanban_cards.related_type = 'sales_order'` — production board'dagi LEFT JOIN ishlaydi.

---

### QADAM 13 — `kanban-templates.seed.ts` kengaytma — production board shablon

**Fayl:** `apps/api/src/modules/kanban/infrastructure/seed/kanban-templates.seed.ts`

115-qatorgacha mavjud 4 shablon'dan keyin qo'shiladi:

```typescript
// DEFAULT_TEMPLATES massiviga qo'shish:
{
  name:          'Ishlab chiqarish jarayoni',
  description:   'EuroPrint gofra/offset/flexi/karton ishlab chiqarish bosqichlari',
  priority:      'urgent',
  checklistItems: ['Fayl tekshirish','Bosish','Sifat nazorati','Qadoqlash','Yetkazish'],
  columnsConfig: [
    { name: 'Yangi buyurtma',   color: '#A0AEC0', sortOrder: 0 },
    { name: 'Fayl tayyorlash',  color: '#5B9BD5', sortOrder: 1 },
    { name: 'Bosish',           color: '#F5C96A', sortOrder: 2 },
    { name: 'Kesish',           color: '#A78BFA', sortOrder: 3 },
    { name: 'Laminatsiya',      color: '#F08080', sortOrder: 4 },
    { name: 'Qadoqlash',        color: '#6DC5A0', sortOrder: 5 },
    { name: 'Bajarildi',        color: '#48BB78', sortOrder: 6 },
  ],
},
// ⚠️ STOP: bosqich nomlarini egasi tasdiqlash kerak (CHAT-TARIXI-YANGI hujjati)
```

---

### QADAM 14 — FE: `KanbanDesktop.tsx`

**Fayl:** `artifacts/erp-dashboard/src/pages/kanban/KanbanDesktop.tsx`

```tsx
// BoardPage shablon + 3 ustun (CC savat) + kanban vazifalar
export function KanbanDesktop() {
  const { t } = useTranslation('kanban');
  const { data, isLoading } = useQuery({
    queryKey: ['/api/kanban/my-desktop'],
    queryFn: () => apiRequest('GET', '/api/kanban/my-desktop'),
  });
  if (isLoading) return <Skeleton className="h-96" />;

  const baskets = data?.baskets ?? { inbox: [], pending: [], outbox: [] };

  return (
    <BoardPage title={t('desktop.title')} icon={<Inbox />}>
      <div className="grid grid-cols-3 gap-4">
        <BasketColumn
          title={t('desktop.inbox')}
          items={Array.isArray(baskets.inbox) ? baskets.inbox : []}
          basket="inbox"
        />
        <BasketColumn
          title={t('desktop.pending')}
          items={Array.isArray(baskets.pending) ? baskets.pending : []}
          basket="pending"
        />
        <BasketColumn
          title={t('desktop.outbox')}
          items={Array.isArray(baskets.outbox) ? baskets.outbox : []}
          basket="outbox"
        />
      </div>
    </BoardPage>
  );
}
```

**Token:** `var(--ep-*)`, `var(--mod-*)` — hardcoded rang TAQIQ (Qoida 21).
**Skeleton** — isLoading holati (F1 qoida).

---

### QADAM 15 — FE: `PersonalProgram.tsx`

**Fayl:** `artifacts/erp-dashboard/src/pages/kanban/PersonalProgram.tsx`

```tsx
export function PersonalProgram() {
  const { t } = useTranslation('kanban');
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);

  const { data, isLoading } = useQuery({
    queryKey: ['/api/kanban/personal-tasks', date],
    queryFn: () => apiRequest('GET', `/api/kanban/personal-tasks?date=${date}`),
  });

  const createMutation = useMutation({
    mutationFn: (body: CreatePersonalTaskBody) =>
      apiRequest('POST', '/api/kanban/personal-tasks', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/kanban/personal-tasks'] });
      toast({ title: t('personalProgram.saved') });
    },
    onError: () => toast({ title: t('error'), variant: 'destructive' }),
  });

  if (isLoading) return <Skeleton className="h-96" />;
  const slots = Array.isArray(data?.slots) ? data.slots : [];

  return (
    <DashboardPage title={t('personalProgram.title')}>
      {slots.map((slot: SlotEntry) => (
        <SoatGridSlot key={slot.hour} slot={slot} onAddTask={createMutation.mutate} />
      ))}
    </DashboardPage>
  );
}
```

---

### QADAM 16 — FE: `ProductionBoard.tsx`

**Fayl:** `artifacts/erp-dashboard/src/pages/kanban/ProductionBoard.tsx`

```tsx
export function ProductionBoard() {
  const { t } = useTranslation('kanban');
  const { data, isLoading } = useQuery({
    queryKey: ['/api/kanban/production-board'],
    queryFn: () => apiRequest('GET', '/api/kanban/production-board'),
  });

  const moveMutation = useMutation({
    mutationFn: (body: MoveCardBody) =>
      apiRequest('POST', '/api/kanban/production-board/move', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/kanban/production-board'] });
      toast({ title: t('productionBoard.moved') });
    },
    onError: () => toast({ title: t('error'), variant: 'destructive' }),
  });

  if (isLoading) return <Skeleton className="h-96" />;
  const cards = Array.isArray(data?.cards) ? data.cards : [];

  return (
    <BoardPage title={t('productionBoard.title')} icon={<Factory />}>
      <KanbanBoardColumns
        cards={cards}
        onMoveCard={(cardId, columnId) => moveMutation.mutate({ cardId, columnId })}
      />
    </BoardPage>
  );
}
```

---

### QADAM 17 — i18n kengaytma

**Fayl (UZ):** `artifacts/erp-dashboard/src/locales/uz/kanban.json`
**Fayl (RU):** `artifacts/erp-dashboard/src/locales/ru/kanban.json`

Qo'shiladigan kalitlar (mavjud kalitlar o'zgartirilmaydi — Q-46):

```json
// uz/kanban.json ga QO'SHIMCHA (oxirga)
{
  "desktop": {
    "title": "Mening ish stoligim",
    "inbox": "Kiruvchi",
    "pending": "Kutilmoqda",
    "outbox": "Chiquvchi",
    "overdueLabel": "Muddati o'tgan",
    "slaWarning": "SLA ogohlantirish"
  },
  "personalProgram": {
    "title": "Shaxsiy dastur",
    "saved": "Vazifa saqlandi",
    "rolledOver": "Ko'chirildi",
    "rolloverCount": "Ko'chirish soni",
    "locked": "Qulflangan",
    "addTask": "Vazifa qo'shish",
    "dayPlan": "Kun rejasi"
  },
  "productionBoard": {
    "title": "Ishlab chiqarish doskalari",
    "moved": "Karta ko'chirildi",
    "techStage": "Texnologik bosqich",
    "rework": "Qayta ishlash",
    "reworkReason": "Qayta ishlash sababi"
  }
}

// ru/kanban.json ga QO'SHIMCHA
{
  "desktop": {
    "title": "Мой рабочий стол",
    "inbox": "Входящие",
    "pending": "Ожидание",
    "outbox": "Исходящие",
    "overdueLabel": "Просрочено",
    "slaWarning": "Предупреждение SLA"
  },
  "personalProgram": {
    "title": "Личная программа",
    "saved": "Задача сохранена",
    "rolledOver": "Перенесено",
    "rolloverCount": "Количество переносов",
    "locked": "Заблокировано",
    "addTask": "Добавить задачу",
    "dayPlan": "План дня"
  },
  "productionBoard": {
    "title": "Производственная доска",
    "moved": "Карточка перемещена",
    "techStage": "Технологический этап",
    "rework": "Переделка",
    "reworkReason": "Причина переделки"
  }
}
```

---

### QADAM 18 — `kanban.module.ts` kengaytma (⚠️ OWNED emas — flag!)

> ⚠️ `kanban.module.ts` OWNED FILES ro'yxatida emas. **TO'XTA** — egaga flag:
> "kanban.module.ts'ga yangi provayderlar/kontrollerlar qo'shish kerak.
> Ruxsat berish uchun: 'ha, modul faylini qo'sh' deya tasdiqlang."

Egasi "ha" degach — `kanban.module.ts`'ga qo'shiladigan import va provider'lar:

```typescript
// providers[] ga:
KanbanDesktopService,
PersonalProgramService,
KanbanProductionService,
DrizzlePersonalTasksRepo,

// controllers[] ga:
KanbanDesktopController,
PersonalProgramController,
KanbanProductionController,
```

Cronlar `app.module.ts` yoki alohida `cron.module.ts`'da ro'yxatga olinadi — bu ham OWNED EMAS, flag qilish kerak.

---

## 5. DDL (egasi tasdiqlashi kerak)

**Fayl:** `apps/api/src/shared/db/migrations/kan-phase3-personal-tasks.sql`

```sql
-- APPROVED: <ism> <sana>
-- P43 KAN Wave 3: personal_tasks + kanban_tasks eskalatsiya ustunlari
-- Egasi stamp bosib ruxsat bergandan keyin `pnpm db:migrate` qilinadi

BEGIN;

-- ═══════════════════════════════════════════════════
-- 1. personal_tasks jadvali
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS personal_tasks (
  id                SERIAL PRIMARY KEY,
  user_id           INTEGER NOT NULL
                      REFERENCES users(id) ON DELETE CASCADE,
  title             VARCHAR(300) NOT NULL,
  scheduled_date    DATE NOT NULL,
  scheduled_time    TIME,
  rollover_count    INTEGER NOT NULL DEFAULT 0,
  rolled_over_from  DATE,
  priority          VARCHAR(20) NOT NULL DEFAULT 'medium'
                      CHECK (priority IN ('high','medium','low')),
  estimate_minutes  INTEGER CHECK (estimate_minutes > 0),
  is_habit_template BOOLEAN NOT NULL DEFAULT false,
  locked_at         TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ
);

COMMENT ON TABLE personal_tasks IS
  'Shaxsiy kun/soat vazifalar (PersonalProgram soat-grid). EP-KAN-007/049.';

CREATE INDEX IF NOT EXISTS idx_personal_tasks_user_date
  ON personal_tasks (user_id, scheduled_date)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_personal_tasks_rollover
  ON personal_tasks (user_id, rollover_count)
  WHERE deleted_at IS NULL AND completed_at IS NULL;

-- ═══════════════════════════════════════════════════
-- 2. kanban_tasks: eskalatsiya ustunlari
-- ═══════════════════════════════════════════════════
ALTER TABLE kanban_tasks
  ADD COLUMN IF NOT EXISTS escalation_level INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS escalated_at     TIMESTAMPTZ;

COMMENT ON COLUMN kanban_tasks.escalation_level IS
  'Eskalatsiya darajasi (0=yo'q, 1=birinchi manager, 2=keyingi...). EP-KAN-040/042/043.';

-- ═══════════════════════════════════════════════════
-- 3. Idempotent test
-- ═══════════════════════════════════════════════════
DO $$ BEGIN
  ASSERT (SELECT COUNT(*) FROM information_schema.tables
          WHERE table_name = 'personal_tasks') > 0,
    'personal_tasks jadvali yaratilmadi!';
  ASSERT (SELECT COUNT(*) FROM information_schema.columns
          WHERE table_name = 'kanban_tasks'
            AND column_name = 'escalation_level') > 0,
    'kanban_tasks.escalation_level ustuni qo''shilmadi!';
END $$;

COMMIT;
```

**⚠️ DARVOZA:** Bu faylni `git add` qil, lekin `pnpm db:migrate` YOKI `db:push` QILMA — faqat egasi farmoyishi bilan.

---

## 6. QABUL MEZONI

### Majburiy tekshiruvlar (har biri "✅" bo'lishi shart)

- [ ] **BE tsc 0** — `pnpm tsc --noEmit` xatosiz
- [ ] **FE tsc 0** — `pnpm --filter erp-dashboard tsc --noEmit` xatosiz
- [ ] **Reviewerlar** — `bash scripts/run-all-reviewers.sh` — FAIL: 0 (yangi fayllar uchun)
- [ ] **DB-proof 1: desktop** — `GET /api/kanban/my-desktop` → 200, `baskets.inbox` massiv
- [ ] **DB-proof 2: personal task** — `POST /api/kanban/personal-tasks` → INSERT tasdiqlanadi:
  ```sql
  SELECT id, title, scheduled_date, rollover_count
  FROM personal_tasks WHERE user_id = <test_user_id>
  ORDER BY created_at DESC LIMIT 1;
  ```
- [ ] **DB-proof 3: rollover cron** — cron qo'lda chaqiriladi → `rollover_count` ortadi:
  ```sql
  -- Oldin: rollover_count = 0
  -- Cron → rollover_count = 1, locked_at IS NOT NULL
  SELECT rollover_count, locked_at FROM personal_tasks WHERE id = <test_id>;
  ```
- [ ] **DB-proof 4: production board** — `GET /api/kanban/production-board` → `sales_orders` bilan birlashtirilgan kartalar
- [ ] **DB-proof 5: eskalatsiya** — 24h+ o'tgan vazifa → `escalation_level = 1`
- [ ] **FE persist round-trip** — PersonalProgram: vazifa kirit → saqlash → sahifani qayta oч → ko'rinadimi?
- [ ] **i18n** — `KanbanDesktop`, `PersonalProgram`, `ProductionBoard` sahifalari UZ va RU'da ko'rinadi
- [ ] **Golden-thread no-regress** — mavjud `KanbanBoardsController` endpointlari ishlashda davom etadi
- [ ] **CC basket no-regress** — `cc-sla.cron.ts` hamon ishlamoqda (docker logs tekshiruvi)
- [ ] **Oltin zanjir** — `OrderCreatedEvent` → `createKanbanForOrder()` → `kanban_cards.related_type='sales_order'` → `getProductionBoard()` kartada ko'rinadi
- [ ] **E6 two-worlds yo'q** — `kanban_tasks.basket_type` ustuni tekshirilgan: yo'q (yoki egasi hal qilgan)
- [ ] **DDL darvoza** — `kan-phase3-personal-tasks.sql` faylida `-- APPROVED:` izoh bor va egasi stamp bosgan

### Edge-case'lar

- `POST /api/kanban/personal-tasks` — `scheduledDate` yo'q → 400 Zod xato (Qoida 2)
- `POST /api/kanban/personal-tasks` — `title` bo'sh → 400 Zod xato
- `rollover_count >= 3` → escalation event log'da ko'rinadi: `code=EP-KAN-064`
- `POST /api/kanban/production-board/rework` — QC_OPERATOR roli yo'q user → 403
- Production board: `sales_orders` bo'sh → `cards: []`, xato emas

---

## 7. SELF-VERIFY

### 7.1 — BE typecheck

```bash
cd Uzbek-Language-Module
pnpm --filter @europrint/api tsc --noEmit 2>&1 | tail -20
# Kutiladi: 0 xato
```

### 7.2 — FE typecheck

```bash
pnpm --filter erp-dashboard tsc --noEmit 2>&1 | tail -20
# Kutiladi: 0 xato
```

### 7.3 — Reviewerlar

```bash
bash scripts/run-all-reviewers.sh 2>&1 | grep -E 'FAIL|PASS|WARN'
# Kutiladi: yangi fayllar uchun FAIL: 0
```

### 7.4 — Backend boot

```bash
pnpm --filter @europrint/api run dev:unsafe &
sleep 15
curl -s http://localhost:3030/api/auth/health | jq .
# Kutiladi: {"status":"ok"} yoki {"status":"healthy"}
```

### 7.5 — DB-proof: my-desktop

```bash
# Login olib JWT token olish:
TOKEN=$(curl -s -X POST http://localhost:3030/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"<test_email>","password":"<pwd>"}' | jq -r '.access_token')

curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:3030/api/kanban/my-desktop | jq '.baskets | keys'
# Kutiladi: ["inbox","outbox","pending"]
```

### 7.6 — DB-proof: personal task CREATE + SELECT

```bash
# 1. CREATE
curl -s -X POST http://localhost:3030/api/kanban/personal-tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"title":"Test vazifa","scheduledDate":"2026-06-20","priority":"high"}' | jq .

# 2. DB SELECT (psql yoki _audit/q.cjs orqali):
# SELECT id, title, scheduled_date, rollover_count
# FROM personal_tasks WHERE user_id = <id> ORDER BY created_at DESC LIMIT 1;
# Kutiladi: yangi qator
```

### 7.7 — DB-proof: production board

```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:3030/api/kanban/production-board | jq '.cards | length'
# Kutiladi: raqam (0 bo'lishi mumkin agar sales_orders bo'sh bo'lsa)
```

### 7.8 — Rollover cron qo'lda tekshirish

```bash
# Testdan oldin: personal_task yarating (scheduled_date = kecha)
# Cronni qo'lda chaqirish (NestJS REPL yoki alohida script):
# PersonalTasksRolloverCron.rolloverIncompleteTasks()
# Keyin DB'da tekshirish:
# SELECT rollover_count, locked_at, scheduled_date FROM personal_tasks WHERE id = <id>;
# Kutiladi: rollover_count=1, locked_at IS NOT NULL, scheduled_date = bugun
```

### 7.9 — CC basket no-regress

```bash
docker logs uzbek-language-module-api-1 2>&1 | grep 'cc-sla\|EP-CC' | tail -5
# Kutiladi: sla cron log ko'rinishi
```

### 7.10 — Golden-thread

```bash
# 1. sales_orders'ga test buyurtma qo'shish (mavjud SD API orqali)
# 2. OrderCreatedEvent chiqishi → KanbanCard yaratilishi
# 3. Production board'da ko'rinishi:
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:3030/api/kanban/production-board | jq '.cards[] | .order_number'
```

---

## 8. COMMIT

### Commit tartibi (har qadam alohida commit)

```bash
# Qadam 1-2: Desktop service + controller
git add \
  Uzbek-Language-Module/apps/api/src/modules/kanban/application/kanban-desktop.service.ts \
  Uzbek-Language-Module/apps/api/src/modules/kanban/presentation/kanban-desktop.controller.ts
git commit -m "feat(kan): kanban-desktop service+controller GET /api/kanban/my-desktop EP-KAN-001"

# Qadam 3: DDL migration (GATED — faqat egasi stamp bosganidan keyin git add)
git add \
  Uzbek-Language-Module/apps/api/src/shared/db/migrations/kan-phase3-personal-tasks.sql
git commit -m "feat(kan): [DDL-GATED] personal_tasks migration + escalation_level col EP-KAN-007"

# Qadam 4-6: PersonalProgram repo + service + controller
git add \
  Uzbek-Language-Module/apps/api/src/modules/kanban/infrastructure/repositories/drizzle-personal-tasks.repo.ts \
  Uzbek-Language-Module/apps/api/src/modules/kanban/application/personal-program.service.ts \
  Uzbek-Language-Module/apps/api/src/modules/kanban/presentation/personal-program.controller.ts
git commit -m "feat(kan): personal-program service+repo+controller EP-KAN-007/050"

# Qadam 7-9: Cronlar
git add \
  Uzbek-Language-Module/apps/api/src/cron/personal-tasks-rollover.cron.ts \
  Uzbek-Language-Module/apps/api/src/cron/kanban-escalation.cron.ts \
  Uzbek-Language-Module/apps/api/src/cron/kanban-shift-relay.cron.ts
git commit -m "feat(kan): rollover+escalation+shift-relay crons EP-KAN-063/040/112"

# Qadam 10-12: Production service + controller + handler kengaytma
git add \
  Uzbek-Language-Module/apps/api/src/modules/kanban/application/kanban-production.service.ts \
  Uzbek-Language-Module/apps/api/src/modules/kanban/presentation/kanban-production.controller.ts \
  Uzbek-Language-Module/apps/api/src/modules/kanban/application/event-handlers/order-created-kanban.handler.ts
git commit -m "feat(kan): production board service+controller+handler EP-KAN-097/098/113"

# Qadam 13: Seed kengaytma
git add \
  Uzbek-Language-Module/apps/api/src/modules/kanban/infrastructure/seed/kanban-templates.seed.ts
git commit -m "feat(kan): production board template seed EP-KAN-097"

# Qadam 14-16: FE sahifalar
git add \
  Uzbek-Language-Module/artifacts/erp-dashboard/src/pages/kanban/KanbanDesktop.tsx \
  Uzbek-Language-Module/artifacts/erp-dashboard/src/pages/kanban/PersonalProgram.tsx \
  Uzbek-Language-Module/artifacts/erp-dashboard/src/pages/kanban/ProductionBoard.tsx
git commit -m "feat(kan): KanbanDesktop+PersonalProgram+ProductionBoard FE pages"

# Qadam 17: i18n
git add \
  Uzbek-Language-Module/artifacts/erp-dashboard/src/locales/uz/kanban.json \
  Uzbek-Language-Module/artifacts/erp-dashboard/src/locales/ru/kanban.json
git commit -m "feat(kan): i18n desktop/personalProgram/productionBoard UZ+RU"
```

### Commit format qoidasi

```
feat(kan): <tavsif> [EP-KAN-###]
```

- Kichik harf, `feat(kan):` prefiksi, op-code ko'rsatiladi.
- `git add -A` TAQIQ — faqat yuqoridagi aniq fayllar.
- Har commit'dan keyin: `git status` tekshir — boshqa o'zgartirilgan fayl bo'lmasligi kerak.

### STOP POINT'lar (commit qilishdan oldin)

1. **DDL commit'dan oldin** — egasi "ha" degan `APPROVED:` stamp bormi?
2. **kanban.module.ts o'zgarishi** — OWNED EMAS — egadan alohida ruxsat.
3. **Production board texnologik bosqichlar seed** — egasi "tasdiqlangan" degan roʻyxatmi?
4. **Har qadam self-verify** — BE tsc 0 + FE tsc 0 + DB-proof.

