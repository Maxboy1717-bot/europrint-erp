# P31 — COR: COR council members + dokla schema extend + protocol/decisions DDL+BE

> **Paket:** P31 · **Modul:** COR · **To'lqin:** Wave 1 · **Bog'liqlik:** P02 (ORG/KARTALAR)
> **DDL Darvozasi:** HA — migration fayllar GATED (egasi ruxsati shart)
> **Yozilgan:** 2026-06-19 · Bajaruvchi: Muslimbek

---

## 0. ROL VA QOIDALAR

Sen 🟢 **BAJARUVCHI**-san. Har sessiya boshida quyidagilarni o'qi:
`CLAUDE.md` → `docs/agent-constitution.md` → `LOYIHA_QOIDALARI.md` → ushbu fayl.

**QOIDALAR BLOKI (Q-47 — har direktivaga kiritilsin):**

1. `Result<T>` hamma repo/service metodida; `throw`/`null`/`undefined` TAQIQ.
2. `@Body` Zod bilan validate; `class-validator` TAQIQ.
3. Drizzle ORM; raw SQL faqat murakkab holatda (izoh + `typedExecute<T>`).
4. Q-40 ishlaydi≠to'g'ri: REAL INSERT/UPDATE + DB-proof; echo/hardcoded/fake javob TAQIQ.
5. Q-46 ishlab turgan kod O'CHIRILMAYDI; buzuq/o'lik/dublikat kod TO'LIQ o'chiriladi (chala emas).
6. FAYL IZOLYATSIYASI (Q-23/Q-31): faqat shu paketning OWNED-FILE ro'yxatidagi fayllarga teg. Boshqa fayl kerak bo'lsa — TO'XTA, egasiga flag qil, supurib ketma.
7. DDL DARVOZASI (Q-35): `CREATE TABLE` / migration faqat egasi ruxsati bilan; migration faylida `-- APPROVED:` izoh shart. Paket DDL talab qilsa — migrationni YOZ lekin GATED belgila, ISHGA TUSHIRMA.
8. `git add <aniq-fayl>` faqat; `-A` / `.` TAQIQ. Bitta commit = bitta mantiqiy guruh.
9. Q-45/Q-30 log/secret HECH QACHON commit qilinmaydi; JWT minting yo'q.
10. Self-verify: BE tsc 0, FE tsc 0, tegishli reviewer skriptlar, jonli DB-proof (kirit→saqla→qayta o'qi→ko'rinadimi).
11. "V2"/"Strangler Fig"/"V1 vs V2" terminologiyasi TAQIQ — bitta kod bazasi, shu joyda to'g'irlanadi.
12. Vizyon-moslik: TO'G'RI o'lchovi = master vizyon (`docs/XARITA-REJA-YONALISH` + modul vizyon-hujjati); kod vizyonga zid bo'lsa (ishlasa ham) = xato.

**Bu agent WAVE 1 da ishlaydi. P02 (ORG/KARTALAR) tugaganidan keyin boshlanadi — `org_functions` jadvali va `card_id` FK mavjudligi tasdiqlansin.**

---

## 1. IZOLYATSIYA MANIFESTI

**FAQAT quyidagi fayllarga teg. Boshqa fayl kerak bo'lsa — TO'XTA + egasiga flag qil:**

```
BE — Schema:
  apps/api/src/shared/db/schema-business-a-2.ts
  apps/api/src/shared/db/migrations/cor-p1-council-members-dokla-extend.sql  [GATED - yangi]
  apps/api/src/shared/db/migrations/cor-p2-protocols-decisions.sql           [GATED - yangi]

BE — Director module:
  apps/api/src/modules/director/infrastructure/repositories/coordination.repository.ts
  apps/api/src/modules/director/domain/repositories/i-coordination.repo.ts
  apps/api/src/modules/director/application/coordination.service.ts
  apps/api/src/modules/director/presentation/coordination.controller.ts
  apps/api/src/modules/director/presentation/dto/director.dto.ts
  apps/api/src/modules/director/infrastructure/repositories/protocol.repository.ts   [yangi]
  apps/api/src/modules/director/domain/repositories/i-protocol.repo.ts              [yangi]
  apps/api/src/modules/director/application/protocol.service.ts                     [yangi]
  apps/api/src/modules/director/presentation/protocol.controller.ts                 [yangi]
  apps/api/src/modules/director/presentation/dto/protocol.dto.ts                    [yangi]

FE:
  artifacts/erp-dashboard/src/pages/CoordinationPageTypes.ts
  artifacts/erp-dashboard/src/pages/CoordinationPageSections.tsx
  artifacts/erp-dashboard/src/pages/CoordinationPageDialogs.tsx
  artifacts/erp-dashboard/src/pages/coordination/ProtocolDetailPage.tsx   [yangi]
  artifacts/erp-dashboard/src/pages/coordination/ProtocolListPage.tsx     [yangi]
  artifacts/erp-dashboard/src/locales/uz/coordination.json
  artifacts/erp-dashboard/src/locales/ru/coordination.json
```

**DDL DARVOZASI:** `cor-p1-council-members-dokla-extend.sql` va `cor-p2-protocols-decisions.sql` migration fayllarini YOZ, lekin `psql` / `db.execute` bilan ISHGA TUSHIRMA. Faylda `-- APPROVED: <egasi> <sana>` placeholder qoldirish shart. Egasi "run" demaguncha migratsiya bajarilmaydi.

**Chegaralar (EP-COR-051):**
- `rasporyazhenie` lifecycle (accept/complete/overdue) — **Kanban moduli**. COR faqat yaratib, `created_kanban_task_id` ni saqlab qoladi.
- "3-savat" inbox — **CC/Kanban moduli**.
- Hujjat tasdiqlash gateway — **CC moduli**.
- IoT tablet checklist execution — **IoT moduli**. COR faqat template tavsif beradi.

---

## 2. VIZYON

**Manba:** `docs/audit/MUSLIMBEK-PROMT-13-COR-2026-06-08.md` · EP-COR-001..135 qaror xaritasi.

### 2.1 T2 boshqaruv qatlami — nima qurilmoqda

COR — ShVB (Sohibkor va Boshqaruv) nazorat tekisligi. Org-chart (T1) strukturani belgilaydi; COR uni boshqaradi: kengash sessiyalari, protokollar, qarorlar, prikazlar, doklad marshrutlash, eskalatsiya zanjiri.

**5 kengash (Vysotskiy 7 modelidan):**

| Daraja | Kengash nomi | council_type | Chastota |
|--------|-------------|--------------|----------|
| 1 | Asoschilar Kengashi (Sovet Uchrediteley) | FOUNDERS | Oylik |
| 2 | Ijroiya Kengashi (Ispolnitelniy Sovet) | EXECUTIVE | Haftalik |
| 3 | Rekomendatelniy Sovet (Rek.Sovet) | ADVISORY | Seshanba kuni |
| 4 | Rekomendatelniy Komitet | COMMITTEE | Haftalik |
| 5 | Zamdirektor Kengashi | DEPUTIES | Kunlik |

> ⚠️ **MOSLIK ESLATMASI — council_type (5) vs meeting_type (4) farqi (OCHIQ EP-COR-037):**
> Yuqoridagi 5 qator `council_type` — bu kengash *tuzilishi* (qaysi 5 kengash mavjud, Vysotskiy-7 modelidan).
> EP-COR-037 egasi aytgan "4 tur" esa kengash *sessiyasi turi*: `meeting_type` = Operativ / Oylik / Choraklik / Favqulodda.
> Bular IKKI ALOHIDA TUSHUNCHA: kengash tipi ≠ majlis sessiya turi.
> **Yechim:** `councils` jadvalida `council_type` ustuni (5 ta) saqlanadi; `council_protocols` jadvaliga
> `meeting_type VARCHAR(20) CHECK (meeting_type IN ('OPERATIV','OYLIK','CHORAKLIK','FAVQULODDA'))`
> ustuni [GATED] qo'shiladi. `meeting_type` NULL ruxsat beriladi (hamma protokolda oldindan belgilanmaydi).

> ⭐ **ORG-SXEMA DERIVATSIYA PRINTSIPI (OCHIQ EP-COR-037, §5.G):**
> Kengash a'zoligi va tuzilishi `org_functions` karta ierarxiyasidan (Vysotskiy-7 darajalari) AVTO kelib chiqishi kerak.
> Hozirgi direktiva FAQAT qo'lda `council_members` CRUD qiladi — bu EP-COR-037 ning ⭐ printsipi bilan to'liq mos emas.
> **DEFER-NOTE:** Avto-derivatsiya mexanizmi (yangi bo'lim/karta qo'shilganda kengash a'zoligi avto-populate)
> KEYINGI BOSQICHGA qoldirildi — P04/P05 ORG moduli to'liq qurilgandan va `org_functions` FK tasdiqlangandan keyin.
> Hozirgi implementatsiya: qo'lda `council_members` CRUD + `card_id FK→org_functions.id` (EP-COR-003) — bu
> asosiy bog'lanishni ta'minlaydi. Avto-kaskad — keyingi iteratsiyada.

**Qabul mezoni — vizyon-moslik (Q-40/Q-12):**
- `council_members` — `org_functions.id` ga FK orqali bog'langan (EP-COR-003: a'zolik KARTA ga, inson emas; org-sxema derivatsiya keyingi bosqich — yuqoridagi DEFER-NOTE).
- `dokla.council_level` — TEXT emas, `councils.id` ga INTEGER FK (hozir buzuq — tuzatiladi).
- `council_protocols` — DRAFT→AWAITING_SECRETARY_SIGN→AWAITING_CHAIR_SIGN→APPROVED sign-flow.
- `council_protocols.meeting_type` — [GATED] Operativ/Oylik/Choraklik/Favqulodda (EP-COR-037).
- `ProtocolDecisionCreatedEvent` → Kanban-ga yetkaziladi.
- FE `CouncilsSection` — statik COUNCIL_LEVELS konstantasidan emas, `GET /api/coordination/councils` API dan.

### 2.2 Asosiy biznes qoidalar (EP-COR-###)

- **EP-COR-003:** A'zolik KARTA ga bog'liq (`org_functions.id`). Karta o'zgarganda (boshqa xodim), a'zolik avtomatik ko'chadi. Avto-derivatsiya: DEFER (yuqoridagi ORG-SXEMA DERIVATSIYA eslatmasi).
- **EP-COR-033/034:** Kvorum = CHAIR+MEMBER larning 2/3 i; galstuk → CHAIR hal qiladi.
- **EP-COR-035:** Delegatsiya = yozma proksi yozuvi.
- **EP-COR-036:** Manfaatlar to'qnashuvi → o'sha kun tartibidan chiqariladi.
- **EP-COR-037:** Kengash sessiyasida 4 tur: `meeting_type` = Operativ/Oylik/Choraklik/Favqulodda — `council_protocols` jadvaliga [GATED] ustun sifatida qo'shiladi (yuqoridagi MOSLIK ESLATMASI ga qarang).
- **EP-COR-046 ⭐:** Doklad + protokol `source: 'ai_camera' | 'manual'` va `draft_text` maydonlarini qo'llab-quvvatlaydi.
  > ⭐ **AI-KAMERA TRANSKRIPSIYA (OCHIQ EP-COR-046):** Egasi aniq: majlis xonasidagi AI kamera
  > ovozni → transkripsiyaga → doklad/protokol qoralamaga AVTO aylantiradi. Hozirgi direktiva
  > faqat `source='ai_camera'` va `draft_text` maydonlarini qo'shgan — bu zaruriy shart, lekin
  > transkripsiya pipeline (audio→STT→qoralama) YOZILMAGAN.
  > **DEFER-NOTE:** AI-kamera transkripsiya pipeline = IoT/AI moduliga taalluqli (ovoz→STT→COR webhook).
  > Bu paketda: `source='ai_camera'`, `draft_text` saqlanadi + `POST /api/coordination/protocols`
  > endpointi `source='ai_camera'` qiymatini qabul qiladi. To'liq pipeline (STT/IoT kamera integratsiyasi)
  > — AI/IoT moduli (P35/P44-P45) tayyor bo'lgach COR ga ulash. **EGASI QIYMATI KERAK:** AI kamera
  > modeli/vendori tanlanmagan (hozircha endpoint ochiq, STT natijasini `draft_text` sifatida qabul qiladi).
- **EP-COR-051:** Rasporyazhenie → Kanban boundary. COR faqat yaratadi + `created_kanban_task_id` saqlab qoladi.
- **EP-COR-063/065:** Protokol imzolash: Kotib imzolaydi → Rais imzolaydi → APPROVED.
- **EP-COR-132:** Director tasdiqlash darvozasi — katta qarorlar uchun.

---

## 3. HOZIRGI HOLAT

### 3.1 MAVJUD (ishlaydigan kod — Q-46: o'chirilmaydi)

| Fayl | Qator | Holat |
|------|-------|-------|
| `schema-business-a-2.ts:39` | `dokla` pgTable | Ishlaydi, lekin `council_level TEXT` — FK yo'q (buzuq semantika) |
| `schema-business-a-2.ts:53` | `rasporyazhenie` pgTable | Ishlaydi |
| `coordination.controller.ts:41` | `GET /coordination/councils` | Raw SQL, Drizzle schema yo'q |
| `coordination.controller.ts:57` | `POST /coordination/dokla` | Real, ishlaydi |
| `coordination.controller.ts:70` | `GET /coordination/dokla` | Real, ishlaydi |
| `coordination.repository.ts:25` | `createDokla()` | Real INSERT |
| `coordination.service.ts` | Barcha metodlar | `Result<T>`, ishlaydi |
| `i-coordination.repo.ts` | Domain interface | To'liq |
| `director.dto.ts:9` | `CoordinationCreateDoklaSchema` | Zod, ishlaydi |
| `CoordinationPageTypes.ts:8` | `COUNCIL_LEVELS` | Statik hardcoded — API dan kelmaydi (buzuq) |
| `CoordinationPageDialogs.tsx` | `CreateDoklaDialog`, `CreateRaspoDialog` | Real submit, ishlaydi |
| `locales/uz/coordination.json` | 61 kalit | Mavjud |

### 3.2 BUZUQ / NOTO'G'RI (tuzatilishi shart)

| # | Muammo | Fayl:satr | Tuzatish |
|---|--------|-----------|----------|
| B1 | `dokla.council_level` = TEXT free-text, FK yo'q | `schema-business-a-2.ts:43` | `routing_council_level_id INTEGER FK→councils` qo'shish (GATED) |
| B2 | `GET /councils` raw SQL, Drizzle `councils` pgTable yo'q | `coordination.controller.ts:42` | `councils` pgTable qo'shish + controller Drizzle ga o'tkazish |
| B3 | `CouncilsSection` statik COUNCIL_LEVELS, API chaqirilmaydi | `CoordinationPageTypes.ts:8` + `CoordinationPageSections.tsx:243` | API dan yuklash |
| B4 | `councils` da `name_uz`, `name_ru` ustunlari yo'q; `council_type` vizyon types bilan mos emas | `phase2-approved-tables.sql:69` | ALTER GATED migration |
| B5 | `listBaskets()` stub `[]` qaytaradi | `coordination.repository.ts:174` | Bu scope emas (Kanban); izoh yangilash kifoya |

### 3.3 YO'Q (qurilishi kerak — bu paketda)

```
council_members       — jadval + Drizzle schema + CRUD endpoints [GATED DDL]
dokla ALTER           — meeting_id, doklad_type, period, completed_work,
                        plan_fact_deviation, source, draft_text,
                        routing_council_level_id, submitted_at..archived_at [GATED]
councils ALTER        — name_uz, name_ru, council_type enum fix [GATED]
council_protocols     — jadval [GATED DDL]
council_protocol_decisions — jadval [GATED DDL]
rasporyazhenie ALTER  — source_protocol_id, source_decision_id,
                        created_kanban_task_id [GATED]
protocol.repository.ts   — yangi fayl
i-protocol.repo.ts       — yangi fayl
protocol.service.ts      — yangi fayl
protocol.controller.ts   — yangi fayl (GET/POST/PATCH sign-flow)
protocol.dto.ts          — yangi fayl
ProtocolListPage.tsx     — yangi FE sahifa
ProtocolDetailPage.tsx   — yangi FE sahifa
ProtocolDecisionCreatedEvent — event emit (Kanban uchun)
coordination.json i18n — protocol/member kalitlari qo'shish
```

---

## 4. ISH — QADAM-BAQADAM

### Bosqich 0 — Tayorgarlik (ruxsat so'ra, tasdiqla)

**Oldin:** `git status` tekshir. Boshqa sessiya ishi bor emasligiga ishonch hosil qil.

```bash
git status
git log --oneline -5
git branch
```

P02 ning `org_functions` jadvali DB da mavjudligini tekshir:
```sql
-- _audit/q.cjs orqali yoki psql:
SELECT COUNT(*) FROM org_functions;
SELECT id, name FROM councils ORDER BY id;
```

Agar `org_functions` yo'q → **TO'XTA**, P02 tamomlangach boshla.
Agar `councils` yo'q yoki 0 qator → B4 fix ham kerak (migration avval yugurishi kerak).

**Ruxsat so'ra:** Har bir migration fayl uchun egadan alohida "run" ruxsatini ol.

---

### Bosqich 1 — councils pgTable + Drizzle + getCouncils() to Drizzle

**Maqsad:** `GET /api/coordination/councils` ni raw SQL dan Drizzle ORM ga o'tkazish.
`councils` pgTable `schema-business-a-2.ts` ga qo'shiladi.

**Fayl:** `apps/api/src/shared/db/schema-business-a-2.ts`

**OLDIN (qator 39 atrofida):**
```typescript
// TODO: Move to lib/db/src/schema/
// dokla — NOT yet in lib/db
// rasporyazhenie — NOT yet in lib/db

export const dokla = pgTable('dokla', {
  id:            serial('id').primaryKey(),
  ...
  council_level: text('council_level'),
```

**KEYIN — `councils` pgTable qo'shiladi (dokla DAN OLDIN), import `boolean` qo'shiladi:**
```typescript
import {
  pgTable, serial, text, integer, timestamp, numeric, varchar, date, boolean,
} from 'drizzle-orm/pg-core';

// ─── Director: Coordination — Councils ────────────────────────────────────────
// NOTE: councils table created in phase2-approved-tables-2026-06-07.sql
// ALTER (name_uz/name_ru/council_type enum) in cor-p1-council-members-dokla-extend.sql [GATED]
export const councils = pgTable('councils', {
  id:               serial('id').primaryKey(),
  name:             text('name').notNull(),
  name_uz:          text('name_uz'),
  name_ru:          text('name_ru'),
  council_type:     text('council_type'),   // FOUNDERS|EXECUTIVE|ADVISORY|COMMITTEE|DEPUTIES
  description:      text('description'),
  chairperson_id:   integer('chairperson_id'),
  meeting_schedule: text('meeting_schedule'),
  is_active:        boolean('is_active').default(true),
  created_at:       timestamp('created_at').defaultNow(),
});
```

**council_members pgTable ham shu faylga qo'shiladi (migration GATED bo'lsa ham, Drizzle sxemasi tayyor turishi kerak):**
```typescript
// council_members — DDL: cor-p1-council-members-dokla-extend.sql [GATED]
export const council_members = pgTable('council_members', {
  id:                serial('id').primaryKey(),
  council_level_id:  integer('council_level_id'),   // FK→councils.id
  card_id:           integer('card_id'),             // FK→org_functions.id (EP-COR-003)
  role:              text('role').default('MEMBER'), // CHAIR|SECRETARY|MEMBER|GUEST
  is_active:         boolean('is_active').default(true),
  created_at:        timestamp('created_at').defaultNow(),
});
```

**council_protocols pgTable:**
```typescript
// council_protocols — DDL: cor-p2-protocols-decisions.sql [GATED]
export const council_protocols = pgTable('council_protocols', {
  id:                    serial('id').primaryKey(),
  meeting_id:            integer('meeting_id'),           // nullable, future meeting table
  council_level_id:      integer('council_level_id'),     // FK→councils.id
  // EP-COR-037: 4 majlis sessiya turi (council_type=5 kengash bilan ARALASHTIRILMASIN)
  meeting_type:          text('meeting_type'),            // OPERATIV|OYLIK|CHORAKLIK|FAVQULODDA [GATED]
  status:                text('status').default('DRAFT'), // DRAFT|AWAITING_SECRETARY_SIGN|AWAITING_CHAIR_SIGN|APPROVED|ARCHIVED
  agenda_items_summary:  text('agenda_items_summary'),    // JSONB saqlash uchun text (Drizzle jsonb import kerak bo'lsa)
  attendees_summary:     text('attendees_summary'),
  decisions_count:       integer('decisions_count').default(0),
  next_meeting_date:     date('next_meeting_date'),
  source:                text('source').default('manual'), // manual|ai_camera (EP-COR-046)
  draft_text:            text('draft_text'),
  secretary_signed_at:   timestamp('secretary_signed_at'),
  chair_signed_at:       timestamp('chair_signed_at'),
  secretary_id:          integer('secretary_id'),
  chair_id:              integer('chair_id'),
  version:               integer('version').default(1),
  locked_at:             timestamp('locked_at'),
  created_by:            integer('created_by'),
  created_at:            timestamp('created_at').defaultNow(),
  updated_at:            timestamp('updated_at').defaultNow(),
});
```

**council_protocol_decisions pgTable:**
```typescript
// council_protocol_decisions — DDL: cor-p2-protocols-decisions.sql [GATED]
export const council_protocol_decisions = pgTable('council_protocol_decisions', {
  id:                    serial('id').primaryKey(),
  protocol_id:           integer('protocol_id').notNull(), // FK→council_protocols.id
  text:                  text('text').notNull(),
  responsible_card_id:   integer('responsible_card_id'),   // FK→org_functions.id
  deadline:              date('deadline'),
  status:                text('status').default('OPEN'),   // OPEN|ASSIGNED|DONE|CARRIED_OVER
  evidence_required:     boolean('evidence_required').default(false),
  objection_text:        text('objection_text'),
  created_kanban_task_id: text('created_kanban_task_id'), // uuid FK→kanban_tasks (EP-COR-051)
  created_at:            timestamp('created_at').defaultNow(),
  updated_at:            timestamp('updated_at').defaultNow(),
});
```

**dokla pgTable yangilanishi (migration GATED, lekin Drizzle sxemasini yangilab qo'y):**

`council_level: text('council_level')` → qoldir (backward-compat), lekin yangi maydonlar qo'sh:
```typescript
export const dokla = pgTable('dokla', {
  id:                       serial('id').primaryKey(),
  from_user_id:             integer('from_user_id'),
  from_name:                text('from_name'),
  council_level:            text('council_level'),          // LEGACY - eski ma'lumot
  routing_council_level_id: integer('routing_council_level_id'), // FK→councils.id [GATED]
  subject:                  text('subject'),
  problem:                  text('problem'),
  result:                   text('result'),
  proposal:                 text('proposal'),
  doklad_type:              text('doklad_type').default('PLANNED'), // PLANNED|RESPONSE|PROBLEM [GATED]
  period:                   text('period'),
  completed_work:           text('completed_work'),
  plan_fact_deviation:      text('plan_fact_deviation'),
  source:                   text('source').default('manual'), // manual|ai_camera (EP-COR-046) [GATED]
  draft_text:               text('draft_text'),
  meeting_id:               integer('meeting_id'),            // FK→council_meetings (future) [GATED]
  status:                   text('status').default('sent'),   // sent|read|resolved|archived [GATED]
  submitted_at:             timestamp('submitted_at'),
  read_at:                  timestamp('read_at'),
  resolved_at:              timestamp('resolved_at'),
  archived_at:              timestamp('archived_at'),
  created_at:               timestamp('created_at').defaultNow(),
  updated_at:               timestamp('updated_at').defaultNow(),
});
```

**rasporyazhenie pgTable yangilanishi:**
```typescript
export const rasporyazhenie = pgTable('rasporyazhenie', {
  id:                    serial('id').primaryKey(),
  from_user_id:          integer('from_user_id'),
  to_user:               text('to_user'),
  task:                  text('task'),
  deadline:              date('deadline'),
  priority:              text('priority').default('medium'),
  status:                text('status').default('assigned'),
  done_at:               timestamp('done_at'),
  done_by:               integer('done_by'),
  done_note:             text('done_note'),
  source_protocol_id:    integer('source_protocol_id'),     // FK→council_protocols [GATED]
  source_decision_id:    integer('source_decision_id'),     // FK→council_protocol_decisions [GATED]
  created_kanban_task_id: text('created_kanban_task_id'),  // uuid (EP-COR-051) [GATED]
  created_at:            timestamp('created_at').defaultNow(),
  updated_at:            timestamp('updated_at').defaultNow(),
});
```

**`@shared/db` barrel exportini tekshir** — `councils`, `council_members`, `council_protocols`, `council_protocol_decisions` eksport qilinganligiga ishonch hosil qil. Agar `apps/api/src/shared/db/index.ts` da qo'shimcha export kerak bo'lsa — FAQAT shu fayl uchun egadan ruxsat ol (P01/P02 owned files bo'lishi mumkin).

---

### Bosqich 2 — coordination.controller.ts: getCouncils() → Drizzle

**Fayl:** `apps/api/src/modules/director/presentation/coordination.controller.ts`

**Import qo'sh:**
```typescript
import { councils, council_members } from '@shared/db';
import { eq } from 'drizzle-orm';
```

**OLDIN (qator 41–47):**
```typescript
@Get('councils')
async getCouncils() {
  const r = await db.execute(sql`
    SELECT id, name, council_type AS type, description, is_active, created_at
    FROM councils WHERE is_active = true ORDER BY id
  `);
  return ((r as { rows?: unknown[] }).rows) ?? [];
}
```

**KEYIN:**
```typescript
@Get('councils')
async getCouncils() {
  return unwrapOrInternal(await this.svc.getCouncils());
}

@Get('councils/:id/members')
@ApiOperation({ summary: 'Get council members by council id' })
async getCouncilMembers(@Param('id') id: string) {
  return unwrapOrInternal(await this.svc.getCouncilMembers(parseInt(id, 10)));
}

@Post('councils/:id/members')
@ApiOperation({ summary: 'Add member to council' })
@UsePipes(new ZodValidationPipe(CouncilMemberCreateSchema))
async addCouncilMember(
  @Param('id') id: string,
  @Body() body: CouncilMemberCreateDto,
) {
  return unwrapOrThrow(await this.svc.addCouncilMember(parseInt(id, 10), body));
}

@Patch('councils/members/:memberId')
@ApiOperation({ summary: 'Update council member role/active' })
@UsePipes(new ZodValidationPipe(CouncilMemberUpdateSchema))
async updateCouncilMember(
  @Param('memberId') memberId: string,
  @Body() body: CouncilMemberUpdateDto,
) {
  return unwrapOrThrow(await this.svc.updateCouncilMember(parseInt(memberId, 10), body));
}
```

DTO import qo'shiladi (director.dto.ts dan):
```typescript
import {
  ...,
  CouncilMemberCreateSchema, CouncilMemberCreateDto,
  CouncilMemberUpdateSchema, CouncilMemberUpdateDto,
} from './dto/director.dto';
```

---

### Bosqich 3 — director.dto.ts: yangi schemalar

**Fayl:** `apps/api/src/modules/director/presentation/dto/director.dto.ts`

Mavjud schemalarni o'zgartirma. Oxiriga qo'sh:

```typescript
// ─── Council Members ──────────────────────────────────────────────────────────
export const CouncilMemberCreateSchema = z.object({
  card_id:  z.number().int().positive(),
  role:     z.enum(['CHAIR', 'SECRETARY', 'MEMBER', 'GUEST']).default('MEMBER'),
  is_active: z.boolean().optional().default(true),
});
export type CouncilMemberCreateDto = z.infer<typeof CouncilMemberCreateSchema>;

export const CouncilMemberUpdateSchema = z.object({
  role:      z.enum(['CHAIR', 'SECRETARY', 'MEMBER', 'GUEST']).optional(),
  is_active: z.boolean().optional(),
});
export type CouncilMemberUpdateDto = z.infer<typeof CouncilMemberUpdateSchema>;

// CoordinationUpdateDoklaSchema — statusga 'archived' qo'sh
// OLDIN: z.enum(['sent', 'read', 'resolved']).optional()
// KEYIN:
export const CoordinationUpdateDoklaSchema = z.object({
  status: z.enum(['sent', 'read', 'resolved', 'archived']).optional(),
  routing_council_level_id: z.number().int().positive().optional(),
  doklad_type: z.enum(['PLANNED', 'RESPONSE', 'PROBLEM']).optional(),
  period: z.string().optional(),
  completed_work: z.string().max(MAX_NOTES_LENGTH).optional(),
  plan_fact_deviation: z.string().max(MAX_NOTES_LENGTH).optional(),
  source: z.enum(['manual', 'ai_camera']).optional(),
  draft_text: z.string().max(MAX_NOTES_LENGTH).optional(),
});
export type CoordinationUpdateDoklaDto = z.infer<typeof CoordinationUpdateDoklaSchema>;

// CoordinationCreateDoklaSchema — yangi maydonlar
// Mavjud schemani almashtir:
export const CoordinationCreateDoklaSchema = z.object({
  title:                    z.string().min(1).max(MAX_SHORT_TEXT).optional(),
  subject:                  z.string().min(1).max(MAX_SHORT_TEXT).optional(),
  description:              z.string().max(MAX_NOTES_LENGTH).optional(),
  problem:                  z.string().max(MAX_NOTES_LENGTH).optional(),
  result:                   z.string().max(MAX_NOTES_LENGTH).optional(),
  proposal:                 z.string().max(MAX_NOTES_LENGTH).optional(),
  council_level:            z.union([z.string(), z.number()]).optional(),
  routing_council_level_id: z.number().int().positive().optional(),
  doklad_type:              z.enum(['PLANNED', 'RESPONSE', 'PROBLEM']).optional(),
  period:                   z.string().optional(),
  completed_work:           z.string().max(MAX_NOTES_LENGTH).optional(),
  plan_fact_deviation:      z.string().max(MAX_NOTES_LENGTH).optional(),
  source:                   z.enum(['manual', 'ai_camera']).optional(),
  draft_text:               z.string().max(MAX_NOTES_LENGTH).optional(),
  assignee_id:              z.number().int().positive().optional(),
  due_date:                 z.string().optional(),
}).refine(d => !!(d.title || d.subject), { message: 'title yoki subject majburiy' });
export type CoordinationCreateDoklaDto = z.infer<typeof CoordinationCreateDoklaSchema>;
```

---

### Bosqich 4 — i-coordination.repo.ts: yangi metodlar

**Fayl:** `apps/api/src/modules/director/domain/repositories/i-coordination.repo.ts`

Mavjud interfeys saqlangan holda qo'shimcha metodlar:

```typescript
// Mavjud ICoordinationRepo interfeysiga qo'sh:
  getCouncils(): Promise<Result<Row[]>>;
  getCouncilMembers(councilLevelId: number): Promise<Result<Row[]>>;
  addCouncilMember(councilLevelId: number, dto: {
    card_id: number; role: string; is_active: boolean;
  }): Promise<Result<Row>>;
  updateCouncilMember(memberId: number, dto: {
    role?: string; is_active?: boolean;
  }): Promise<Result<Row>>;
```

---

### Bosqich 5 — coordination.repository.ts: yangi metodlar

**Fayl:** `apps/api/src/modules/director/infrastructure/repositories/coordination.repository.ts`

Import qo'sh:
```typescript
import { councils, council_members } from '@shared/db';
```

Mavjud metodlarga qo'shma (o'chirma):

```typescript
async getCouncils(): Promise<Result<Row[]>> {
  return safeCall(async () => {
    return db.select({
      id:               councils.id,
      name:             councils.name,
      name_uz:          councils.name_uz,
      name_ru:          councils.name_ru,
      council_type:     councils.council_type,
      description:      councils.description,
      chairperson_id:   councils.chairperson_id,
      meeting_schedule: councils.meeting_schedule,
      is_active:        councils.is_active,
      created_at:       councils.created_at,
    })
      .from(councils)
      .where(eq(councils.is_active, true))
      .orderBy(councils.id)
      .then(r => castTo<Row[]>(r));
  }, 'DB_ERROR');
}

async getCouncilMembers(councilLevelId: number): Promise<Result<Row[]>> {
  return safeCall(async () => {
    // NOTE: JOIN org_functions when card_id FK exists (GATED migration)
    return db.select({
      id:               council_members.id,
      council_level_id: council_members.council_level_id,
      card_id:          council_members.card_id,
      role:             council_members.role,
      is_active:        council_members.is_active,
      created_at:       council_members.created_at,
      // card_name resolved by service layer until org_functions FK confirmed
    })
      .from(council_members)
      .where(eq(council_members.council_level_id, councilLevelId))
      .orderBy(
        sql`CASE ${council_members.role}
          WHEN 'CHAIR' THEN 0 WHEN 'SECRETARY' THEN 1 WHEN 'MEMBER' THEN 2 ELSE 3 END`
      )
      .then(r => castTo<Row[]>(r));
  }, 'DB_ERROR');
}

async addCouncilMember(
  councilLevelId: number,
  dto: { card_id: number; role: string; is_active: boolean },
): Promise<Result<Row>> {
  return safeCall(async () => {
    const rows = await db.insert(council_members).values({
      council_level_id: councilLevelId,
      card_id:          dto.card_id,
      role:             dto.role,
      is_active:        dto.is_active,
    }).returning();
    return (rows[0] ?? {}) as Row;
  }, 'DB_ERROR');
}

async updateCouncilMember(
  memberId: number,
  dto: { role?: string; is_active?: boolean },
): Promise<Result<Row>> {
  return safeCall(async () => {
    const rows = await db.update(council_members).set({
      ...(dto.role !== undefined ? { role: dto.role } : {}),
      ...(dto.is_active !== undefined ? { is_active: dto.is_active } : {}),
    }).where(eq(council_members.id, memberId)).returning();
    return (rows[0] ?? { message: 'Yangilandi' }) as Row;
  }, 'DB_ERROR');
}
```

`listBaskets()` da faqat izohni yangilashtir — mantiqni o'zgartirma:
```typescript
async listBaskets(): Promise<Result<Row[]>> {
  // WHY: Baskets lifecycle belongs to Kanban module (EP-COR-051).
  // COR stub intentional — Kanban module wires this when ready.
  return safeCall(async () => [], 'DB_ERROR');
}
```

---

### Bosqich 6 — coordination.service.ts: yangi metodlar

**Fayl:** `apps/api/src/modules/director/application/coordination.service.ts`

Mavjud metodlarni o'zgartirma. Qo'sh:

```typescript
async getCouncils(): Promise<Result<object, AppError>> {
  return this.repo.getCouncils();
}

async getCouncilMembers(councilLevelId: number): Promise<Result<object, AppError>> {
  if (!councilLevelId || councilLevelId < 1)
    return Err({ code: 'BAD_REQUEST', message: 'Noto\'g\'ri council ID' });
  return safeCall(() => this.repo.getCouncilMembers(councilLevelId));
}

async addCouncilMember(
  councilLevelId: number,
  body: Record<string, unknown>,
): Promise<Result<object, AppError>> {
  const { card_id, role, is_active } = body;
  if (!card_id) return Err({ code: 'BAD_REQUEST', message: 'card_id majburiy (EP-COR-003)' });
  return safeCall(() =>
    this.repo.addCouncilMember(councilLevelId, {
      card_id: card_id as number,
      role: (role as string) ?? 'MEMBER',
      is_active: (is_active as boolean) ?? true,
    }),
  );
}

async updateCouncilMember(
  memberId: number,
  body: Record<string, unknown>,
): Promise<Result<object, AppError>> {
  return safeCall(() =>
    this.repo.updateCouncilMember(memberId, {
      role:      body.role as string | undefined,
      is_active: body.is_active as boolean | undefined,
    }),
  );
}
```

---

### Bosqich 7 — Protocol yangi fayllar (i-protocol.repo.ts, protocol.repository.ts, protocol.service.ts, protocol.controller.ts, protocol.dto.ts)

**Bosqich 7A — `i-protocol.repo.ts` (yangi fayl)**

**Fayl:** `apps/api/src/modules/director/domain/repositories/i-protocol.repo.ts`

```typescript
/**
 * @module i-protocol.repo
 * @description Domain interface for council protocols + decisions.
 * @layer Domain (Director / COR)
 */
import type { Result } from '@common/result';

type Row = Record<string, unknown>;

export interface CreateProtocolDto {
  council_level_id: number;
  // EP-COR-037: sessiya turi (council_type 5-kengash bilan ARALASHTIRILMASIN)
  meeting_type?: string;  // OPERATIV|OYLIK|CHORAKLIK|FAVQULODDA
  source?: string;
  // EP-COR-046: ai_camera → draft_text STT pipeline qoralamasi (to'liq pipeline defer)
  draft_text?: string;
  agenda_items_summary?: string;
  attendees_summary?: string;
  created_by?: number;
}

export interface IProtocolRepo {
  listProtocols(councilLevelId?: number): Promise<Result<Row[]>>;
  getProtocolById(id: number): Promise<Result<Row | null>>;
  createProtocol(dto: CreateProtocolDto): Promise<Result<Row>>;
  updateProtocolStatus(
    id: number,
    status: string,
    signerField?: 'secretary_id' | 'chair_id',
    signerId?: number,
  ): Promise<Result<Row>>;
  listDecisions(protocolId: number): Promise<Result<Row[]>>;
  createDecision(dto: {
    protocol_id: number;
    text: string;
    responsible_card_id?: number;
    deadline?: string;
    evidence_required?: boolean;
  }): Promise<Result<Row>>;
  updateDecisionStatus(id: number, status: string): Promise<Result<Row>>;
  linkKanbanTask(decisionId: number, kanbanTaskId: string): Promise<Result<Row>>;
}

export const PROTOCOL_REPO = Symbol('PROTOCOL_REPO');
```

**Bosqich 7B — `protocol.repository.ts` (yangi fayl)**

**Fayl:** `apps/api/src/modules/director/infrastructure/repositories/protocol.repository.ts`

```typescript
/**
 * @module protocol.repository
 * @description Drizzle ORM repository for council protocols + decisions.
 * @layer Infrastructure (Director / COR)
 */
import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { council_protocols, council_protocol_decisions } from '@shared/db';
import { eq, desc, sql } from 'drizzle-orm';
import { castTo } from '@common/db-rows';
import { safeCall, Result } from '@common/result';
import { TashkentTimeService } from '@common/time';
import type {
  IProtocolRepo,
  CreateProtocolDto,
} from '../../domain/repositories/i-protocol.repo';

type Row = Record<string, unknown>;
const _time = new TashkentTimeService();

@Injectable()
export class ProtocolRepository implements IProtocolRepo {
  async listProtocols(councilLevelId?: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const q = db.select().from(council_protocols).orderBy(desc(council_protocols.created_at)).limit(100);
      if (councilLevelId) q.where(eq(council_protocols.council_level_id, councilLevelId));
      return q.then(r => castTo<Row[]>(r));
    }, 'DB_ERROR');
  }

  async getProtocolById(id: number): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await db.select().from(council_protocols)
        .where(eq(council_protocols.id, id)).limit(1);
      return (rows[0] ?? null) as Row | null;
    }, 'DB_ERROR');
  }

  async createProtocol(dto: CreateProtocolDto): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.insert(council_protocols).values({
        council_level_id:     dto.council_level_id,
        // EP-COR-037: 4 sessiya turi. meeting_type NULL ruxsat (har protokolda oldindan belgilanmaydi)
        meeting_type:         dto.meeting_type ?? null,
        source:               dto.source ?? 'manual',
        // EP-COR-046: ai_camera source → draft_text STT qoralamasi. To'liq pipeline: DEFER (AI/IoT)
        draft_text:           dto.draft_text ?? null,
        agenda_items_summary: dto.agenda_items_summary ?? null,
        attendees_summary:    dto.attendees_summary ?? null,
        created_by:           dto.created_by ?? null,
        status:               'DRAFT',
        version:              1,
      }).returning();
      return (rows[0] ?? {}) as Row;
    }, 'DB_ERROR');
  }

  async updateProtocolStatus(
    id: number,
    status: string,
    signerField?: 'secretary_id' | 'chair_id',
    signerId?: number,
  ): Promise<Result<Row>> {
    return safeCall(async () => {
      const now = _time.now();
      const patch: Record<string, unknown> = {
        status,
        updated_at: now,
      };
      if (signerField === 'secretary_id' && signerId) {
        patch.secretary_id         = signerId;
        patch.secretary_signed_at  = now;
      }
      if (signerField === 'chair_id' && signerId) {
        patch.chair_id        = signerId;
        patch.chair_signed_at = now;
      }
      if (status === 'APPROVED') {
        patch.locked_at = now;
      }
      const rows = await db.update(council_protocols)
        .set(patch as Parameters<typeof db.update>[0])
        .where(eq(council_protocols.id, id))
        .returning();
      return (rows[0] ?? { message: 'Yangilandi' }) as Row;
    }, 'DB_ERROR');
  }

  async listDecisions(protocolId: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      return db.select().from(council_protocol_decisions)
        .where(eq(council_protocol_decisions.protocol_id, protocolId))
        .orderBy(council_protocol_decisions.created_at)
        .then(r => castTo<Row[]>(r));
    }, 'DB_ERROR');
  }

  async createDecision(dto: {
    protocol_id: number;
    text: string;
    responsible_card_id?: number;
    deadline?: string;
    evidence_required?: boolean;
  }): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.insert(council_protocol_decisions).values({
        protocol_id:          dto.protocol_id,
        text:                 dto.text,
        responsible_card_id:  dto.responsible_card_id ?? null,
        deadline:             dto.deadline ?? null,
        evidence_required:    dto.evidence_required ?? false,
        status:               'OPEN',
      }).returning();
      return (rows[0] ?? {}) as Row;
    }, 'DB_ERROR');
  }

  async updateDecisionStatus(id: number, status: string): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.update(council_protocol_decisions)
        .set({ status, updated_at: _time.now() })
        .where(eq(council_protocol_decisions.id, id))
        .returning();
      return (rows[0] ?? { message: 'Yangilandi' }) as Row;
    }, 'DB_ERROR');
  }

  async linkKanbanTask(decisionId: number, kanbanTaskId: string): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.update(council_protocol_decisions)
        .set({ created_kanban_task_id: kanbanTaskId, updated_at: _time.now() })
        .where(eq(council_protocol_decisions.id, decisionId))
        .returning();
      return (rows[0] ?? { message: 'Bog\'landi' }) as Row;
    }, 'DB_ERROR');
  }
}
```

**Bosqich 7C — `protocol.dto.ts` (yangi fayl)**

**Fayl:** `apps/api/src/modules/director/presentation/dto/protocol.dto.ts`

```typescript
/**
 * @module protocol.dto
 * @description Zod schemas + inferred types for Protocol endpoints.
 */
import { z } from 'zod';
import { MAX_NOTES_LENGTH, MAX_SHORT_TEXT } from '@common/constants/app.constants';

export const ProtocolCreateSchema = z.object({
  council_level_id:     z.number().int().positive(),
  // EP-COR-037: 4 sessiya turi — council_type (5 kengash) bilan aralashtirilmasin
  meeting_type:         z.enum(['OPERATIV','OYLIK','CHORAKLIK','FAVQULODDA']).optional(),
  source:               z.enum(['manual', 'ai_camera']).optional().default('manual'),
  // EP-COR-046 ai_camera: STT pipeline AI/IoT modulida — bu yerda faqat qoralama qabul qilinadi
  draft_text:           z.string().max(MAX_NOTES_LENGTH).optional(),
  agenda_items_summary: z.string().max(MAX_NOTES_LENGTH).optional(),
  attendees_summary:    z.string().max(MAX_NOTES_LENGTH).optional(),
});
export type ProtocolCreateDto = z.infer<typeof ProtocolCreateSchema>;

export const ProtocolSignSchema = z.object({
  // signer_id is always taken from @CurrentUser — not from body
  note: z.string().max(MAX_NOTES_LENGTH).optional(),
});
export type ProtocolSignDto = z.infer<typeof ProtocolSignSchema>;

export const DecisionCreateSchema = z.object({
  text:                z.string().min(1).max(MAX_NOTES_LENGTH),
  responsible_card_id: z.number().int().positive().optional(),
  deadline:            z.string().optional(),
  evidence_required:   z.boolean().optional().default(false),
});
export type DecisionCreateDto = z.infer<typeof DecisionCreateSchema>;

export const DecisionStatusUpdateSchema = z.object({
  status: z.enum(['OPEN', 'ASSIGNED', 'DONE', 'CARRIED_OVER']),
});
export type DecisionStatusUpdateDto = z.infer<typeof DecisionStatusUpdateSchema>;

export const DecisionKanbanLinkSchema = z.object({
  kanban_task_id: z.string().uuid(),
});
export type DecisionKanbanLinkDto = z.infer<typeof DecisionKanbanLinkSchema>;
```

**Bosqich 7D — `protocol.service.ts` (yangi fayl)**

**Fayl:** `apps/api/src/modules/director/application/protocol.service.ts`

```typescript
/**
 * @module protocol.service
 * @description Business-logic for council protocols + sign-flow + decisions.
 *   Sign-flow (EP-COR-063/065): DRAFT → AWAITING_SECRETARY_SIGN → AWAITING_CHAIR_SIGN → APPROVED.
 * @layer Application (Director / COR)
 */
import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { safeCall, Result, AppError, Err } from '@common/result';
import { PROTOCOL_REPO, type IProtocolRepo } from '../domain/repositories/i-protocol.repo';
import type { ProtocolCreateDto, DecisionCreateDto } from '../presentation/dto/protocol.dto';

const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  DRAFT:                    ['AWAITING_SECRETARY_SIGN', 'ARCHIVED'],
  AWAITING_SECRETARY_SIGN:  ['AWAITING_CHAIR_SIGN', 'DRAFT'],
  AWAITING_CHAIR_SIGN:      ['APPROVED', 'AWAITING_SECRETARY_SIGN'],
  APPROVED:                 ['ARCHIVED'],
  ARCHIVED:                 [],
};

@Injectable()
export class ProtocolService {
  constructor(
    @Inject(PROTOCOL_REPO) private readonly repo: IProtocolRepo,
    private readonly events: EventEmitter2,
  ) {}

  async listProtocols(councilLevelId?: number): Promise<Result<object, AppError>> {
    return this.repo.listProtocols(councilLevelId);
  }

  async getProtocol(id: number): Promise<Result<object, AppError>> {
    const r = await this.repo.getProtocolById(id);
    if (!r.ok) return r;
    if (!r.data) return Err({ code: 'NOT_FOUND', message: 'Protokol topilmadi' });
    return { ok: true, data: r.data } as Result<object, AppError>;
  }

  async createProtocol(
    userId: number,
    dto: ProtocolCreateDto,
  ): Promise<Result<object, AppError>> {
    return safeCall(() =>
      this.repo.createProtocol({ ...dto, created_by: userId }),
    );
  }

  async signAsSecretary(
    protocolId: number,
    userId: number,
    userRole: string,
  ): Promise<Result<object, AppError>> {
    const existing = await this.repo.getProtocolById(protocolId);
    if (!existing.ok) return existing;
    if (!existing.data) return Err({ code: 'NOT_FOUND', message: 'Protokol topilmadi' });
    const proto = existing.data as Record<string, unknown>;
    const allowed = VALID_STATUS_TRANSITIONS[proto.status as string] ?? [];
    if (!allowed.includes('AWAITING_CHAIR_SIGN'))
      return Err({ code: 'BAD_REQUEST', message: `Hozirgi holat: ${proto.status} — kotib imzosiga o'tib bo'lmaydi` });
    // EP-COR-063: secretary must be the registered secretary of this council
    // For now: director/admin/secretary role can sign — refine after council_members FK confirmed
    if (!['admin', 'director', 'ceo', 'super_admin', 'secretary'].includes(userRole))
      return Err({ code: 'FORBIDDEN', message: 'Faqat kotib imzolaydi (EP-COR-063)' });
    return this.repo.updateProtocolStatus(
      protocolId,
      'AWAITING_CHAIR_SIGN',
      'secretary_id',
      userId,
    );
  }

  async signAsChair(
    protocolId: number,
    userId: number,
    userRole: string,
  ): Promise<Result<object, AppError>> {
    const existing = await this.repo.getProtocolById(protocolId);
    if (!existing.ok) return existing;
    if (!existing.data) return Err({ code: 'NOT_FOUND', message: 'Protokol topilmadi' });
    const proto = existing.data as Record<string, unknown>;
    if (proto.status !== 'AWAITING_CHAIR_SIGN')
      return Err({ code: 'BAD_REQUEST', message: `Protokol rais imzosini kutmayapti. Holat: ${proto.status}` });
    if (!['admin', 'director', 'ceo', 'super_admin'].includes(userRole))
      return Err({ code: 'FORBIDDEN', message: 'Faqat rais yoki direktor imzolaydi (EP-COR-065 / EP-COR-132)' });
    const result = await this.repo.updateProtocolStatus(
      protocolId,
      'APPROVED',
      'chair_id',
      userId,
    );
    if (result.ok) {
      // Emit for downstream listeners (Kanban, GL, etc.)
      this.events.emit('cor.protocol.approved', {
        protocolId,
        approvedBy: userId,
        councilLevelId: (existing.data as Record<string, unknown>).council_level_id,
      });
    }
    return result;
  }

  async addDecision(
    protocolId: number,
    dto: DecisionCreateDto,
    userId: number,
  ): Promise<Result<object, AppError>> {
    // Only allow adding decisions if protocol is still editable
    const existing = await this.repo.getProtocolById(protocolId);
    if (!existing.ok) return existing;
    if (!existing.data) return Err({ code: 'NOT_FOUND', message: 'Protokol topilmadi' });
    const proto = existing.data as Record<string, unknown>;
    if (['APPROVED', 'ARCHIVED'].includes(proto.status as string))
      return Err({ code: 'BAD_REQUEST', message: 'Tasdiqlangan protokolga qaror qo\'shib bo\'lmaydi' });
    const result = await safeCall(() => this.repo.createDecision({ ...dto, protocol_id: protocolId }));
    if (result.ok) {
      // EP-COR-051: emit event for Kanban to create task
      this.events.emit('cor.protocol.decision.created', {
        decisionId: (result.data as Record<string, unknown>).id,
        protocolId,
        text: dto.text,
        responsible_card_id: dto.responsible_card_id,
        deadline: dto.deadline,
        createdBy: userId,
      });
    }
    return result;
  }

  async listDecisions(protocolId: number): Promise<Result<object, AppError>> {
    return this.repo.listDecisions(protocolId);
  }

  async updateDecisionStatus(
    id: number,
    status: string,
  ): Promise<Result<object, AppError>> {
    const allowed = ['OPEN', 'ASSIGNED', 'DONE', 'CARRIED_OVER'];
    if (!allowed.includes(status))
      return Err({ code: 'BAD_REQUEST', message: `Noto'g'ri status: ${status}` });
    return this.repo.updateDecisionStatus(id, status);
  }

  async linkDecisionToKanban(
    decisionId: number,
    kanbanTaskId: string,
  ): Promise<Result<object, AppError>> {
    return this.repo.linkKanbanTask(decisionId, kanbanTaskId);
  }
}
```

**Bosqich 7E — `protocol.controller.ts` (yangi fayl)**

**Fayl:** `apps/api/src/modules/director/presentation/protocol.controller.ts`

```typescript
/**
 * @module protocol.controller
 * @description REST endpoints for council protocols + sign-flow + decisions.
 *   Endpoints: GET/POST /protocols, GET /protocols/:id,
 *   POST /protocols/:id/sign-secretary, POST /protocols/:id/sign-chair,
 *   GET/POST /protocols/:id/decisions, PATCH /decisions/:id/status,
 *   POST /decisions/:id/link-kanban
 */
import {
  Body, Controller, Get, Param, Patch, Post, Query,
  UseGuards, UseInterceptors, UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { unwrapOrThrow, unwrapOrInternal } from '@common/http-result';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Roles } from '@common/decorators/roles.decorator';
import { RolesGuard } from '@common/guards/roles.guard';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { ProtocolService } from '../application/protocol.service';
import {
  ProtocolCreateSchema, ProtocolCreateDto,
  DecisionCreateSchema, DecisionCreateDto,
  DecisionStatusUpdateSchema, DecisionStatusUpdateDto,
  DecisionKanbanLinkSchema, DecisionKanbanLinkDto,
} from './dto/protocol.dto';

@ApiThrottle()
@ApiTags('Protocols')
@ApiBearerAuth()
@Controller('coordination/protocols')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles('admin', 'manager', 'supervisor', 'director', 'ceo')
export class ProtocolController {
  constructor(private readonly svc: ProtocolService) {}

  @Get()
  @ApiOperation({ summary: 'List protocols (filter by council_level_id)' })
  async listProtocols(@Query('council_level_id') councilLevelId?: string) {
    return unwrapOrInternal(
      await this.svc.listProtocols(councilLevelId ? parseInt(councilLevelId, 10) : undefined),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get protocol by id' })
  async getProtocol(@Param('id') id: string) {
    return unwrapOrThrow(await this.svc.getProtocol(parseInt(id, 10)));
  }

  @Post()
  @ApiOperation({ summary: 'Create protocol (DRAFT)' })
  @ApiResponse({ status: 201, description: 'Created' })
  @UsePipes(new ZodValidationPipe(ProtocolCreateSchema))
  async createProtocol(
    @Body() body: ProtocolCreateDto,
    @CurrentUser() user: { id: number; role: string },
  ) {
    return unwrapOrThrow(await this.svc.createProtocol(user.id, body));
  }

  @Post(':id/sign-secretary')
  @ApiOperation({ summary: 'Secretary signs protocol (EP-COR-063)' })
  async signSecretary(
    @Param('id') id: string,
    @CurrentUser() user: { id: number; role: string },
  ) {
    return unwrapOrThrow(
      await this.svc.signAsSecretary(parseInt(id, 10), user.id, user.role),
    );
  }

  @Post(':id/sign-chair')
  @ApiOperation({ summary: 'Chair/Director signs protocol (EP-COR-065/EP-COR-132)' })
  async signChair(
    @Param('id') id: string,
    @CurrentUser() user: { id: number; role: string },
  ) {
    return unwrapOrThrow(
      await this.svc.signAsChair(parseInt(id, 10), user.id, user.role),
    );
  }

  @Get(':id/decisions')
  @ApiOperation({ summary: 'List decisions for protocol' })
  async listDecisions(@Param('id') id: string) {
    return unwrapOrInternal(await this.svc.listDecisions(parseInt(id, 10)));
  }

  @Post(':id/decisions')
  @ApiOperation({ summary: 'Add decision to protocol' })
  @ApiResponse({ status: 201, description: 'Created' })
  @UsePipes(new ZodValidationPipe(DecisionCreateSchema))
  async addDecision(
    @Param('id') id: string,
    @Body() body: DecisionCreateDto,
    @CurrentUser() user: { id: number; role: string },
  ) {
    return unwrapOrThrow(
      await this.svc.addDecision(parseInt(id, 10), body, user.id),
    );
  }

  @Patch('decisions/:id/status')
  @ApiOperation({ summary: 'Update decision status' })
  @UsePipes(new ZodValidationPipe(DecisionStatusUpdateSchema))
  async updateDecisionStatus(
    @Param('id') id: string,
    @Body() body: DecisionStatusUpdateDto,
  ) {
    return unwrapOrThrow(
      await this.svc.updateDecisionStatus(parseInt(id, 10), body.status),
    );
  }

  @Post('decisions/:id/link-kanban')
  @ApiOperation({ summary: 'Link decision to Kanban task (EP-COR-051)' })
  @UsePipes(new ZodValidationPipe(DecisionKanbanLinkSchema))
  async linkKanban(
    @Param('id') id: string,
    @Body() body: DecisionKanbanLinkDto,
  ) {
    return unwrapOrThrow(
      await this.svc.linkDecisionToKanban(parseInt(id, 10), body.kanban_task_id),
    );
  }
}
```

**Bosqich 7F — DirectorModule ga yangi provayderlarni ro'yxatdan o'tkaz**

Bu `director.module.ts` fayliga teg. Bu fayl P31 owned files ro'yxatida YO'Q.
**TO'XTA** — egasiga flag qil: `director.module.ts` ga `ProtocolController`, `ProtocolService`, `ProtocolRepository` + `PROTOCOL_REPO` token qo'shish uchun ruxsat so'ra.

Agar ruxsat kelib tushsa, qo'shiladigan kodni tavsifla:
```typescript
// director.module.ts ga qo'shiladi:
providers: [
  ...
  ProtocolService,
  ProtocolRepository,
  { provide: PROTOCOL_REPO, useClass: ProtocolRepository },
],
controllers: [..., ProtocolController],
```

---

### Bosqich 8 — FE: CoordinationPageTypes.ts — CouncilsSection API dan yuklash

**Fayl:** `artifacts/erp-dashboard/src/pages/CoordinationPageTypes.ts`

`COUNCIL_LEVELS` konstantasini qoldiring (UI uchun fallback sifatida + icon/color ma'lumotlari uchun), lekin yangi `Council` interface va `Protocol` interface qo'shing:

```typescript
// COUNCIL_LEVELS ni o'chirma — icon/color UI uchun kerak
// Lekin yangi interfeys qo'sh:

export interface CouncilApi {
  id: number;
  name: string;
  name_uz?: string;
  name_ru?: string;
  council_type: string;
  description?: string;
  is_active: boolean;
  meeting_schedule?: string;
}

export interface CouncilMember {
  id: number;
  council_level_id: number;
  card_id: number;
  role: 'CHAIR' | 'SECRETARY' | 'MEMBER' | 'GUEST';
  is_active: boolean;
  card_name?: string;  // resolved from org_functions
}

export interface Protocol {
  id: number;
  council_level_id: number;
  status: 'DRAFT' | 'AWAITING_SECRETARY_SIGN' | 'AWAITING_CHAIR_SIGN' | 'APPROVED' | 'ARCHIVED';
  source: 'manual' | 'ai_camera';
  draft_text?: string;
  decisions_count?: number;
  secretary_signed_at?: string;
  chair_signed_at?: string;
  created_at: string;
}

export interface ProtocolDecision {
  id: number;
  protocol_id: number;
  text: string;
  responsible_card_id?: number;
  deadline?: string;
  status: 'OPEN' | 'ASSIGNED' | 'DONE' | 'CARRIED_OVER';
  evidence_required: boolean;
  created_kanban_task_id?: string;
}

// VALID_TABS ga "protocols" qo'sh
export const VALID_TABS = ["overview", "dokla", "raspo", "baskets", "councils", "protocols"] as const;
export type CoordinationTab = typeof VALID_TABS[number];
```

---

### Bosqich 9 — FE: CoordinationPageSections.tsx — CouncilsSection API ga o'tkazish

**Fayl:** `artifacts/erp-dashboard/src/pages/CoordinationPageSections.tsx`

`CouncilsSection` komponentini toping (qator ~243 atrofida). Bu komponent hozir `COUNCIL_LEVELS` statik konstantasidan foydalanadi.

**O'zgarish:** Props orqali `councilsData: CouncilApi[]` va `councilsLoading: boolean` qabul qilsin:

```tsx
// OLDIN (taxminiy):
export function CouncilsSection() {
  const { t } = useTranslation("coordination");
  return (
    <TabsContent value="councils">
      {COUNCIL_LEVELS.map(c => (
        <Card key={c.level}>...</Card>
      ))}
    </TabsContent>
  );
}

// KEYIN:
interface CouncilsSectionProps {
  councilsData: CouncilApi[];
  councilsLoading: boolean;
}

export function CouncilsSection({ councilsData, councilsLoading }: CouncilsSectionProps) {
  const { t } = useTranslation("coordination");
  if (councilsLoading) return (
    <TabsContent value="councils"><EPLoader /></TabsContent>
  );
  // COUNCIL_LEVELS icon/color info ni API data bilan birlashtir:
  const enriched = COUNCIL_LEVELS.map(cl => ({
    ...cl,
    apiData: councilsData.find(c => c.id === cl.level),
  }));
  return (
    <TabsContent value="councils" className="mt-4 space-y-3">
      {enriched.map(c => (
        <Card key={c.level} className={cn("border", c.color)}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <c.icon className="w-4 h-4" />
              {c.apiData?.name_uz ?? t(c.key)}
              <span className={cn("ml-auto text-xs px-2 py-0.5 rounded-full", c.badgeClass)}>
                {c.apiData?.meeting_schedule ?? t(c.freqKey)}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {c.apiData?.description ?? t(c.purposeKey)}
          </CardContent>
        </Card>
      ))}
    </TabsContent>
  );
}
```

`CoordinationPage.tsx` — bu owned file emas, lekin bu o'zgarish props signature o'zgartirganligi sababli `CoordinationPage.tsx` ni ham yangilash kerak bo'ladi. **Egasiga flag qil:** `CoordinationPage.tsx` ga `useQuery` for `/api/coordination/councils` qo'shish va `CouncilsSection` ga `councilsData`/`councilsLoading` props uzatish uchun ruxsat so'ra. Ko'rsatma:

```tsx
// CoordinationPage.tsx da qo'shiladigan useQuery:
const { data: councilsRaw, isLoading: councilsLoading } = useQuery({
  queryKey: ['/api/coordination/councils'],
  enabled: activeTab === 'councils',
});
const councilsData: CouncilApi[] = Array.isArray(councilsRaw) ? councilsRaw : [];
```

---

### Bosqich 10 — FE: ProtocolListPage.tsx (yangi sahifa)

**Fayl:** `artifacts/erp-dashboard/src/pages/coordination/ProtocolListPage.tsx`

```tsx
/**
 * @module ProtocolListPage
 * @description ListPage template for council protocols.
 *   Allows creating protocols and navigating to detail for sign-flow.
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, CheckCircle, Clock } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { EPLoader } from "@/components/ep";
import { apiRequest } from "@/lib/api-request";
import type { Protocol } from "@/pages/CoordinationPageTypes";

const PROTOCOL_STATUS_COLOR: Record<string, string> = {
  DRAFT:                   "bg-slate-100 text-slate-700",
  AWAITING_SECRETARY_SIGN: "bg-amber-100 text-amber-800",
  AWAITING_CHAIR_SIGN:     "bg-blue-100 text-blue-800",
  APPROVED:                "bg-emerald-100 text-emerald-800",
  ARCHIVED:                "bg-gray-100 text-gray-600",
};

export default function ProtocolListPage() {
  const { t, language } = useTranslation("coordination");
  const isRu = language === "ru";
  const { toast } = useToast();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [creating, setCreating] = useState(false);
  const [newCouncilId, setNewCouncilId] = useState("1");

  const { data: rawProtocols, isLoading } = useQuery({
    queryKey: ['/api/coordination/protocols'],
    queryFn: () => apiRequest('GET', '/api/coordination/protocols').then(r => r.json()),
  });
  const protocols: Protocol[] = Array.isArray(rawProtocols)
    ? rawProtocols
    : Array.isArray(rawProtocols?.data) ? rawProtocols.data : [];

  const { data: rawCouncils } = useQuery({
    queryKey: ['/api/coordination/councils'],
    queryFn: () => apiRequest('GET', '/api/coordination/councils').then(r => r.json()),
  });
  const councils = Array.isArray(rawCouncils) ? rawCouncils : [];

  const createMutation = useMutation({
    mutationFn: (council_level_id: number) =>
      apiRequest('POST', '/api/coordination/protocols', { council_level_id, source: 'manual' }).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/coordination/protocols'] });
      toast({ title: isRu ? "Протокол создан" : "Protokol yaratildi" });
      setCreating(false);
    },
    onError: () => toast({ title: isRu ? "Ошибка" : "Xatolik", variant: "destructive" }),
  });

  if (isLoading) return <EPLoader />;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="w-5 h-5 text-[var(--ep-blue)]" />
          {isRu ? "Протоколы заседаний" : "Majlis protokollari"}
        </h2>
        <Button size="sm" onClick={() => setCreating(v => !v)} className="gap-1">
          <Plus className="w-4 h-4" />
          {isRu ? "Новый протокол" : "Yangi protokol"}
        </Button>
      </div>

      {creating && (
        <Card className="border-[var(--ep-blue)] bg-blue-50/40">
          <CardContent className="pt-4 space-y-3">
            <div>
              <label className="text-xs font-medium">
                {isRu ? "Совет" : "Kengash"}
              </label>
              <select
                className="w-full mt-1 border rounded-md px-3 py-2 text-sm bg-background"
                value={newCouncilId}
                onChange={e => setNewCouncilId(e.target.value)}
              >
                {councils.map((c: { id: number; name: string; name_uz?: string }) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name_uz ?? c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="outline" onClick={() => setCreating(false)}>
                {isRu ? "Отмена" : "Bekor"}
              </Button>
              <Button
                size="sm"
                disabled={createMutation.isPending}
                onClick={() => createMutation.mutate(parseInt(newCouncilId, 10))}
              >
                {createMutation.isPending ? "..." : isRu ? "Создать" : "Yaratish"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {protocols.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            {isRu ? "Протоколов пока нет" : "Protokollar hali yo'q"}
          </p>
        )}
        {protocols.map(p => (
          <Card
            key={p.id}
            className="cursor-pointer hover:border-[var(--ep-blue)] transition-colors"
            onClick={() => navigate(`/coordination/protocols/${p.id}`)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-[var(--ep-blue)]" />
                {isRu ? `Протокол #${p.id}` : `Protokol #${p.id}`}
                <Badge className={`ml-auto text-xs ${PROTOCOL_STATUS_COLOR[p.status] ?? ""}`}>
                  {p.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {p.created_at?.slice(0, 10) ?? "—"}
              </span>
              {p.source === 'ai_camera' && (
                <span className="text-[var(--ep-blue)] font-medium">AI Camera</span>
              )}
              {p.status === 'APPROVED' && (
                <span className="flex items-center gap-1 text-emerald-700">
                  <CheckCircle className="w-3 h-3" />
                  {isRu ? "Подписан" : "Imzolangan"}
                </span>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

---

### Bosqich 11 — FE: ProtocolDetailPage.tsx (yangi sahifa)

**Fayl:** `artifacts/erp-dashboard/src/pages/coordination/ProtocolDetailPage.tsx`

```tsx
/**
 * @module ProtocolDetailPage
 * @description Protocol detail: sign-flow buttons + decisions list + add decision.
 *   Sign-flow: DRAFT → [Sign Secretary] → [Sign Chair] → APPROVED.
 */
import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, PenLine, Plus, ArrowRight } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { EPLoader } from "@/components/ep";
import { apiRequest } from "@/lib/api-request";
import type { Protocol, ProtocolDecision } from "@/pages/CoordinationPageTypes";

export default function ProtocolDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t, language } = useTranslation("coordination");
  const isRu = language === "ru";
  const { toast } = useToast();
  const qc = useQueryClient();

  const [newDecisionText, setNewDecisionText] = useState("");
  const [newDecisionDeadline, setNewDecisionDeadline] = useState("");
  const [addingDecision, setAddingDecision] = useState(false);

  const { data: raw, isLoading } = useQuery({
    queryKey: ['/api/coordination/protocols', id],
    queryFn: () => apiRequest('GET', `/api/coordination/protocols/${id}`).then(r => r.json()),
    enabled: !!id,
  });
  const protocol: Protocol | null = raw?.data ?? raw ?? null;

  const { data: rawDecisions, isLoading: decisionsLoading } = useQuery({
    queryKey: ['/api/coordination/protocols', id, 'decisions'],
    queryFn: () => apiRequest('GET', `/api/coordination/protocols/${id}/decisions`).then(r => r.json()),
    enabled: !!id,
  });
  const decisions: ProtocolDecision[] = Array.isArray(rawDecisions)
    ? rawDecisions
    : Array.isArray(rawDecisions?.data) ? rawDecisions.data : [];

  const signSecretaryMutation = useMutation({
    mutationFn: () =>
      apiRequest('POST', `/api/coordination/protocols/${id}/sign-secretary`).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/coordination/protocols', id] });
      toast({ title: isRu ? "Подписано (котиб)" : "Kotib imzoladi" });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const signChairMutation = useMutation({
    mutationFn: () =>
      apiRequest('POST', `/api/coordination/protocols/${id}/sign-chair`).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/coordination/protocols', id] });
      toast({ title: isRu ? "Протокол утверждён" : "Protokol tasdiqlandi" });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const addDecisionMutation = useMutation({
    mutationFn: (payload: { text: string; deadline?: string }) =>
      apiRequest('POST', `/api/coordination/protocols/${id}/decisions`, payload).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/coordination/protocols', id, 'decisions'] });
      toast({ title: isRu ? "Решение добавлено" : "Qaror qo'shildi" });
      setNewDecisionText("");
      setNewDecisionDeadline("");
      setAddingDecision(false);
    },
    onError: () => toast({ title: isRu ? "Ошибка" : "Xatolik", variant: "destructive" }),
  });

  if (isLoading) return <EPLoader />;
  if (!protocol) return <div className="p-4 text-sm text-muted-foreground">{isRu ? "Не найдено" : "Topilmadi"}</div>;

  const canAddDecision = !['APPROVED', 'ARCHIVED'].includes(protocol.status);
  const canSignSecretary = protocol.status === 'DRAFT';
  const canSignChair = protocol.status === 'AWAITING_CHAIR_SIGN';

  return (
    <div className="p-4 space-y-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <PenLine className="w-5 h-5 text-[var(--ep-blue)]" />
            {isRu ? `Протокол #${protocol.id}` : `Protokol #${protocol.id}`}
            <Badge className="ml-auto text-xs">{protocol.status}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-xs text-muted-foreground">
            {isRu ? "Совет ID" : "Kengash"}: {protocol.council_level_id} ·
            {isRu ? " Источник" : " Manba"}: {protocol.source} ·
            {isRu ? " Создан" : " Yaratilgan"}: {protocol.created_at?.slice(0, 10)}
          </div>
          {protocol.draft_text && (
            <div className="bg-slate-50 rounded p-3 text-xs whitespace-pre-wrap">
              {protocol.draft_text}
            </div>
          )}
          {/* Sign-flow actions */}
          <div className="flex gap-2 pt-2 flex-wrap">
            {canSignSecretary && (
              <Button
                size="sm"
                variant="outline"
                disabled={signSecretaryMutation.isPending}
                onClick={() => signSecretaryMutation.mutate()}
                className="gap-1 border-amber-400 text-amber-700 hover:bg-amber-50"
              >
                <PenLine className="w-3.5 h-3.5" />
                {isRu ? "Подписать (котиб)" : "Kotib imzosi"}
              </Button>
            )}
            {protocol.status === 'AWAITING_SECRETARY_SIGN' && (
              <Button size="sm" variant="outline" disabled className="gap-1 text-slate-400">
                <ArrowRight className="w-3.5 h-3.5" />
                {isRu ? "Ожидает подписи котиба" : "Kotib imzosi kutilmoqda"}
              </Button>
            )}
            {canSignChair && (
              <Button
                size="sm"
                disabled={signChairMutation.isPending}
                onClick={() => signChairMutation.mutate()}
                className="gap-1 bg-[var(--ep-blue)] text-white hover:opacity-90"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                {isRu ? "Утвердить (председатель)" : "Rais tasdiqlaydi"}
              </Button>
            )}
            {protocol.status === 'APPROVED' && (
              <span className="flex items-center gap-1 text-emerald-700 text-sm font-medium">
                <CheckCircle className="w-4 h-4" />
                {isRu ? "Утверждён" : "Tasdiqlangan"}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Decisions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            {isRu ? "Решения" : "Qarorlar"}
            {canAddDecision && (
              <Button
                size="sm"
                variant="outline"
                className="ml-auto gap-1 h-7 text-xs"
                onClick={() => setAddingDecision(v => !v)}
              >
                <Plus className="w-3 h-3" />
                {isRu ? "Добавить" : "Qo'shish"}
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {addingDecision && canAddDecision && (
            <div className="border rounded p-3 space-y-2 bg-blue-50/40">
              <div>
                <Label className="text-xs">{isRu ? "Текст решения *" : "Qaror matni *"}</Label>
                <Textarea
                  className="mt-1 text-sm"
                  rows={2}
                  value={newDecisionText}
                  onChange={e => setNewDecisionText(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs">{isRu ? "Срок" : "Muddat"}</Label>
                <Input
                  type="date"
                  className="mt-1 h-8 text-sm"
                  value={newDecisionDeadline}
                  onChange={e => setNewDecisionDeadline(e.target.value)}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="outline" onClick={() => setAddingDecision(false)}>
                  {isRu ? "Отмена" : "Bekor"}
                </Button>
                <Button
                  size="sm"
                  disabled={!newDecisionText.trim() || addDecisionMutation.isPending}
                  onClick={() => addDecisionMutation.mutate({
                    text: newDecisionText,
                    deadline: newDecisionDeadline || undefined,
                  })}
                >
                  {isRu ? "Сохранить" : "Saqlash"}
                </Button>
              </div>
            </div>
          )}
          {decisionsLoading && <EPLoader />}
          {decisions.length === 0 && !decisionsLoading && (
            <p className="text-xs text-muted-foreground text-center py-4">
              {isRu ? "Решений пока нет" : "Qarorlar hali yo'q"}
            </p>
          )}
          {decisions.map(d => (
            <div key={d.id} className="border rounded p-3 text-sm space-y-1">
              <div className="flex items-start gap-2">
                <Badge className="text-xs shrink-0 mt-0.5">{d.status}</Badge>
                <p>{d.text}</p>
              </div>
              {d.deadline && (
                <p className="text-xs text-muted-foreground">
                  {isRu ? "Срок" : "Muddat"}: {d.deadline}
                </p>
              )}
              {d.created_kanban_task_id && (
                <p className="text-xs text-emerald-700">
                  Kanban: {d.created_kanban_task_id}
                </p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
```

---

### Bosqich 12 — CoordinationPageDialogs.tsx: CreateDoklaDialog yangilanishi

**Fayl:** `artifacts/erp-dashboard/src/pages/CoordinationPageDialogs.tsx`

Mavjud `CreateDoklaDialog` ga `doklad_type` va `source` maydonlari qo'shish. `DoklaFormState` type o'zgarishi uchun avval `CoordinationPageTypes.ts` yangilansin:

```typescript
// CoordinationPageTypes.ts da DoklaFormState yangilanishi:
export type DoklaFormState = {
  subject: string;
  problem: string;
  result: string;
  proposal: string;
  councilLevel: string;
  dokladType: 'PLANNED' | 'RESPONSE' | 'PROBLEM';
  period: string;
  completedWork: string;
  source: 'manual' | 'ai_camera';
};
```

`CreateDoklaDialog` ichida yangi maydonlar qo'sh (mavjud maydonlarni o'zgartirma):

```tsx
// form.dokladType uchun select:
<div>
  <Label className="text-xs">{isRu ? "Тип доклада" : "Doklad turi"}</Label>
  <select
    className="w-full mt-1 border rounded-md px-3 py-2 text-sm bg-background"
    value={form.dokladType}
    onChange={e => setForm(p => ({ ...p, dokladType: e.target.value as 'PLANNED' | 'RESPONSE' | 'PROBLEM' }))}
  >
    <option value="PLANNED">{isRu ? "Плановый" : "Rejalashtirilgan"}</option>
    <option value="RESPONSE">{isRu ? "Ответный" : "Javob"}</option>
    <option value="PROBLEM">{isRu ? "Проблемный" : "Muammoli"}</option>
  </select>
</div>

// form.period uchun input:
<div>
  <Label className="text-xs">{isRu ? "Период" : "Davr"}</Label>
  <Input
    className="h-8 text-sm"
    placeholder={isRu ? "напр. июнь 2026" : "masalan: iyun 2026"}
    value={form.period ?? ""}
    onChange={e => setForm(p => ({ ...p, period: e.target.value }))}
  />
</div>
```

`onSubmit` chaqiruvida `dokladType` va `period` ham uzatiladi — bu `CoordinationPage.tsx` da `createDoklaMutation` payload ni yangilashni talab qiladi (egasiga flag).

---

### Bosqich 13 — i18n: coordination.json yangilanishi

**Fayl:** `artifacts/erp-dashboard/src/locales/uz/coordination.json`

Mavjud 61 kalitni o'zgartirma. Qo'shish:

```json
{
  "...mavjud kalitlar...",
  "protocols": "Protokollar",
  "protocolList": "Kengash protokollari ro'yxati",
  "createProtocol": "Protokol yaratish",
  "protocolDraft": "Qoralama",
  "protocolAwaitingSecretary": "Kotib imzosi kutilmoqda",
  "protocolAwaitingChair": "Rais imzosi kutilmoqda",
  "protocolApproved": "Tasdiqlangan",
  "protocolArchived": "Arxivlangan",
  "signAsSecretary": "Kotib sifatida imzola",
  "signAsChair": "Rais sifatida tasdiqla",
  "councilMembers": "Kengash a'zolari",
  "memberRole": "A'zo roli",
  "memberRoleChair": "Rais",
  "memberRoleSecretary": "Kotib",
  "memberRoleMember": "A'zo",
  "memberRoleGuest": "Mehmon",
  "addMember": "A'zo qo'shish",
  "cardId": "Karta (org-function)",
  "decisionText": "Qaror matni",
  "addDecision": "Qaror qo'shish",
  "decisionOpen": "Ochiq",
  "decisionAssigned": "Topshirilgan",
  "decisionDone": "Bajarildi",
  "decisionCarriedOver": "Ko'chirildi",
  "dokladTypePlanned": "Rejalashtirilgan doklad",
  "dokladTypeResponse": "Javob dokladi",
  "dokladTypeProblem": "Muammoli doklad",
  "dokladPeriod": "Hisobot davri",
  "dokladCompletedWork": "Bajarilgan ish",
  "dokladPlanFact": "Reja-fakt farqi",
  "aiCameraSource": "AI kamera (avtomatik)",
  "manualSource": "Qo'lda kiritilgan",
  "linkedKanbanTask": "Kanban vazifasi bog'langan",
  "meetingType": "Majlis sessiya turi",
  "meetingTypeOperativ": "Operativ",
  "meetingTypeOylik": "Oylik",
  "meetingTypeChoraklik": "Choraklik",
  "meetingTypeFavqulodda": "Favqulodda"
}
```

**Fayl:** `artifacts/erp-dashboard/src/locales/ru/coordination.json`

```json
{
  "...mavjud kalitlar...",
  "protocols": "Протоколы",
  "protocolList": "Протоколы заседаний",
  "createProtocol": "Создать протокол",
  "protocolDraft": "Черновик",
  "protocolAwaitingSecretary": "Ожидает подписи котиба",
  "protocolAwaitingChair": "Ожидает подписи председателя",
  "protocolApproved": "Утверждён",
  "protocolArchived": "Архивирован",
  "signAsSecretary": "Подписать (котиб)",
  "signAsChair": "Утвердить (председатель)",
  "councilMembers": "Члены совета",
  "memberRole": "Роль участника",
  "memberRoleChair": "Председатель",
  "memberRoleSecretary": "Секретарь",
  "memberRoleMember": "Член",
  "memberRoleGuest": "Гость",
  "addMember": "Добавить участника",
  "cardId": "Карточка (org-function)",
  "decisionText": "Текст решения",
  "addDecision": "Добавить решение",
  "decisionOpen": "Открыто",
  "decisionAssigned": "Назначено",
  "decisionDone": "Выполнено",
  "decisionCarriedOver": "Перенесено",
  "dokladTypePlanned": "Плановый доклад",
  "dokladTypeResponse": "Ответный доклад",
  "dokladTypeProblem": "Проблемный доклад",
  "dokladPeriod": "Отчётный период",
  "dokladCompletedWork": "Выполненная работа",
  "dokladPlanFact": "Отклонение план-факт",
  "aiCameraSource": "AI камера (автоматически)",
  "manualSource": "Введено вручную",
  "linkedKanbanTask": "Задача Kanban привязана",
  "meetingType": "Тип сессии заседания",
  "meetingTypeOperativ": "Оперативное",
  "meetingTypeOylik": "Ежемесячное",
  "meetingTypeChoraklik": "Квартальное",
  "meetingTypeFavqulodda": "Чрезвычайное"
}
```

---

## 5. DDL (GATED — egasi ruxsati shart)

### cor-p1-council-members-dokla-extend.sql

**Fayl:** `apps/api/src/shared/db/migrations/cor-p1-council-members-dokla-extend.sql`

```sql
-- APPROVED: <egasi> <sana>
-- P31 COR Phase 1: council_members + dokla ALTER + councils ALTER
-- Dependency: phase2-approved-tables-2026-06-07.sql (councils table must exist)
-- Run only after owner confirms with "run"

-- ============================================================
-- 1. councils: name_uz, name_ru, council_type enum fix
-- ============================================================
ALTER TABLE councils
  ADD COLUMN IF NOT EXISTS name_uz TEXT,
  ADD COLUMN IF NOT EXISTS name_ru TEXT;

-- Update council_type to Vysotskiy-aligned values + re-seed names
UPDATE councils SET
  council_type = 'FOUNDERS',
  name_uz      = 'Asoschilar Kengashi',
  name_ru      = 'Совет Учредителей'
WHERE id = 1;

UPDATE councils SET
  council_type = 'EXECUTIVE',
  name_uz      = 'Ijroiya Kengashi',
  name_ru      = 'Исполнительный Совет'
WHERE id = 2;

UPDATE councils SET
  council_type = 'ADVISORY',
  name_uz      = 'Rekomendatelniy Sovet',
  name_ru      = 'Рекомендательный Совет'
WHERE id = 3;

UPDATE councils SET
  council_type = 'COMMITTEE',
  name_uz      = 'Rekomendatelniy Komitet',
  name_ru      = 'Рекомендательный Комитет'
WHERE id = 4;

UPDATE councils SET
  council_type = 'DEPUTIES',
  name_uz      = 'Zamdirektor Kengashi',
  name_ru      = 'Совет Заместителей'
WHERE id = 5;

-- ============================================================
-- 2. council_members
-- ============================================================
CREATE TABLE IF NOT EXISTS council_members (
  id                SERIAL PRIMARY KEY,
  council_level_id  INTEGER NOT NULL
                      REFERENCES councils(id) ON DELETE CASCADE,
  card_id           INTEGER
                      REFERENCES org_functions(id) ON DELETE SET NULL,
  role              TEXT NOT NULL DEFAULT 'MEMBER'
                      CHECK (role IN ('CHAIR','SECRETARY','MEMBER','GUEST')),
  is_active         BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cm_council ON council_members(council_level_id);
CREATE INDEX IF NOT EXISTS idx_cm_card    ON council_members(card_id);
CREATE INDEX IF NOT EXISTS idx_cm_role    ON council_members(role);

-- ============================================================
-- 3. dokla: new columns (backward-compatible — nullable)
-- ============================================================
ALTER TABLE dokla
  ADD COLUMN IF NOT EXISTS routing_council_level_id INTEGER
                             REFERENCES councils(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS doklad_type  TEXT DEFAULT 'PLANNED'
                             CHECK (doklad_type IN ('PLANNED','RESPONSE','PROBLEM')),
  ADD COLUMN IF NOT EXISTS period       TEXT,
  ADD COLUMN IF NOT EXISTS completed_work TEXT,
  ADD COLUMN IF NOT EXISTS plan_fact_deviation TEXT,
  ADD COLUMN IF NOT EXISTS source       TEXT DEFAULT 'manual'
                             CHECK (source IN ('manual','ai_camera')),
  ADD COLUMN IF NOT EXISTS draft_text   TEXT,
  ADD COLUMN IF NOT EXISTS meeting_id   INTEGER,
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS read_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS resolved_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_at  TIMESTAMPTZ;

-- Extend status check to include 'archived'
ALTER TABLE dokla
  DROP CONSTRAINT IF EXISTS dokla_status_check;
ALTER TABLE dokla
  ADD CONSTRAINT dokla_status_check
    CHECK (status IN ('sent','read','resolved','archived'));

CREATE INDEX IF NOT EXISTS idx_dokla_routing_council ON dokla(routing_council_level_id);
CREATE INDEX IF NOT EXISTS idx_dokla_doklad_type     ON dokla(doklad_type);
CREATE INDEX IF NOT EXISTS idx_dokla_status          ON dokla(status);

-- ============================================================
-- 4. rasporyazhenie: new source/kanban columns
-- ============================================================
ALTER TABLE rasporyazhenie
  ADD COLUMN IF NOT EXISTS source_protocol_id    INTEGER,
  ADD COLUMN IF NOT EXISTS source_decision_id    INTEGER,
  ADD COLUMN IF NOT EXISTS created_kanban_task_id TEXT;

CREATE INDEX IF NOT EXISTS idx_rasp_source_protocol ON rasporyazhenie(source_protocol_id);
```

### cor-p2-protocols-decisions.sql

**Fayl:** `apps/api/src/shared/db/migrations/cor-p2-protocols-decisions.sql`

```sql
-- APPROVED: <egasi> <sana>
-- P31 COR Phase 2: council_protocols + council_protocol_decisions
-- Dependency: cor-p1-council-members-dokla-extend.sql (councils must exist)
-- Run only after owner confirms with "run"

-- ============================================================
-- 1. council_protocols
-- ============================================================
CREATE TABLE IF NOT EXISTS council_protocols (
  id                    SERIAL PRIMARY KEY,
  meeting_id            INTEGER,            -- future FK → council_meetings
  council_level_id      INTEGER
                          REFERENCES councils(id) ON DELETE SET NULL,
  -- EP-COR-037: sessiya turi (council_type=5 kengash bilan ARALASHTIRILMASIN)
  -- 4 majlis sessiya turi: Operativ/Oylik/Choraklik/Favqulodda
  meeting_type          TEXT
                          CHECK (meeting_type IN ('OPERATIV','OYLIK','CHORAKLIK','FAVQULODDA')),
  status                TEXT NOT NULL DEFAULT 'DRAFT'
                          CHECK (status IN (
                            'DRAFT',
                            'AWAITING_SECRETARY_SIGN',
                            'AWAITING_CHAIR_SIGN',
                            'APPROVED',
                            'ARCHIVED'
                          )),
  agenda_items_summary  TEXT,               -- JSONB-compatible text
  attendees_summary     TEXT,
  decisions_count       INTEGER NOT NULL DEFAULT 0,
  next_meeting_date     DATE,
  source                TEXT NOT NULL DEFAULT 'manual'
                          CHECK (source IN ('manual','ai_camera')),
  draft_text            TEXT,
  secretary_signed_at   TIMESTAMPTZ,
  chair_signed_at       TIMESTAMPTZ,
  secretary_id          INTEGER
                          REFERENCES employees(id) ON DELETE SET NULL,
  chair_id              INTEGER
                          REFERENCES employees(id) ON DELETE SET NULL,
  version               INTEGER NOT NULL DEFAULT 1,
  locked_at             TIMESTAMPTZ,
  created_by            INTEGER
                          REFERENCES employees(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cp_council   ON council_protocols(council_level_id);
CREATE INDEX IF NOT EXISTS idx_cp_status    ON council_protocols(status);
CREATE INDEX IF NOT EXISTS idx_cp_created   ON council_protocols(created_at DESC);

-- ============================================================
-- 2. council_protocol_decisions
-- ============================================================
CREATE TABLE IF NOT EXISTS council_protocol_decisions (
  id                      SERIAL PRIMARY KEY,
  protocol_id             INTEGER NOT NULL
                            REFERENCES council_protocols(id) ON DELETE CASCADE,
  text                    TEXT NOT NULL,
  responsible_card_id     INTEGER
                            REFERENCES org_functions(id) ON DELETE SET NULL,
  deadline                DATE,
  status                  TEXT NOT NULL DEFAULT 'OPEN'
                            CHECK (status IN ('OPEN','ASSIGNED','DONE','CARRIED_OVER')),
  evidence_required       BOOLEAN NOT NULL DEFAULT false,
  objection_text          TEXT,
  created_kanban_task_id  TEXT,              -- uuid → kanban_tasks (EP-COR-051)
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cpd_protocol ON council_protocol_decisions(protocol_id);
CREATE INDEX IF NOT EXISTS idx_cpd_status   ON council_protocol_decisions(status);
CREATE INDEX IF NOT EXISTS idx_cpd_card     ON council_protocol_decisions(responsible_card_id);

-- ============================================================
-- 3. rasporyazhenie: FK add after council_protocols exists
-- ============================================================
ALTER TABLE rasporyazhenie
  DROP CONSTRAINT IF EXISTS rasp_source_protocol_fk;
ALTER TABLE rasporyazhenie
  ADD CONSTRAINT rasp_source_protocol_fk
    FOREIGN KEY (source_protocol_id)
    REFERENCES council_protocols(id)
    ON DELETE SET NULL;

ALTER TABLE rasporyazhenie
  DROP CONSTRAINT IF EXISTS rasp_source_decision_fk;
ALTER TABLE rasporyazhenie
  ADD CONSTRAINT rasp_source_decision_fk
    FOREIGN KEY (source_decision_id)
    REFERENCES council_protocol_decisions(id)
    ON DELETE SET NULL;
```

---

## 6. QABUL MEZONI

### 6.1 DB-proof tekshiruvi (Q-40 — REAL round-trip)

```sql
-- 1. councils yangilangan:
SELECT id, name, name_uz, council_type FROM councils ORDER BY id;
-- Kutilgan: 5 qator, council_type = FOUNDERS|EXECUTIVE|ADVISORY|COMMITTEE|DEPUTIES

-- 2. council_members yaratish va o'qish:
INSERT INTO council_members (council_level_id, card_id, role)
VALUES (1, 1, 'CHAIR')
RETURNING *;
-- Kutilgan: 1 qator, role='CHAIR'

SELECT * FROM council_members WHERE council_level_id = 1;
-- Kutilgan: yuqorida kiritilgan qator

-- 3. dokla yangi maydonlar:
INSERT INTO dokla (from_user_id, subject, doklad_type, source, routing_council_level_id)
VALUES (1, 'Test doklad', 'PLANNED', 'manual', 2)
RETURNING id, doklad_type, source, routing_council_level_id;

-- 4. council_protocols:
INSERT INTO council_protocols (council_level_id, source, created_by)
VALUES (1, 'manual', 1)
RETURNING id, status, council_level_id;

-- 5. council_protocol_decisions:
INSERT INTO council_protocol_decisions (protocol_id, text, deadline)
VALUES (1, 'Test qaror', '2026-07-01')
RETURNING id, status, protocol_id;
```

### 6.2 API round-trip tekshiruvi

```bash
# Login oldin:
TOKEN=$(curl -s -X POST http://localhost:3030/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"ADMIN_PASS"}' | jq -r .token)

# 1. GET councils — Drizzle dan:
curl -H "Authorization: Bearer $TOKEN" http://localhost:3030/api/coordination/councils
# Kutilgan: [{id:1, name_uz:"Asoschilar Kengashi", council_type:"FOUNDERS",...}, ...]

# 2. GET council members:
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3030/api/coordination/councils/1/members

# 3. POST member:
curl -s -X POST http://localhost:3030/api/coordination/councils/1/members \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"card_id":1,"role":"CHAIR","is_active":true}'

# 4. POST protocol:
PROTO_ID=$(curl -s -X POST http://localhost:3030/api/coordination/protocols \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"council_level_id":1,"source":"manual"}' | jq -r .id)

# 5. POST decision:
curl -s -X POST http://localhost:3030/api/coordination/protocols/$PROTO_ID/decisions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text":"Yangi qaror","deadline":"2026-07-01"}'

# 6. Sign secretary:
curl -s -X POST http://localhost:3030/api/coordination/protocols/$PROTO_ID/sign-secretary \
  -H "Authorization: Bearer $TOKEN"
# Kutilgan: status="AWAITING_CHAIR_SIGN"

# 7. Sign chair:
curl -s -X POST http://localhost:3030/api/coordination/protocols/$PROTO_ID/sign-chair \
  -H "Authorization: Bearer $TOKEN"
# Kutilgan: status="APPROVED", chair_signed_at SET
```

### 6.3 TypeScript tekshiruvi

```bash
# BE:
pnpm --filter @europrint/api run tsc --noEmit
# Kutilgan: 0 xato

# FE:
pnpm --filter erp-dashboard run tsc --noEmit
# Kutilgan: 0 xato
```

### 6.4 FE round-trip (vizyon-moslik Q-40)

1. `/coordination?tab=councils` — CouncilsSection statik konstantadan EMAS, API dan yuklaydi. Network tab da `GET /api/coordination/councils` so'rov ko'rinadi.
2. `/coordination/protocols` — protokollar ro'yxati ko'rinadi. "Yangi protokol" yaratiladi → sahifa yangilanadi → yangi protokol ro'yxatda ko'rinadi.
3. Protokol detail sahifada "Kotib imzosi" tugmasi bosiladi → status `AWAITING_CHAIR_SIGN` bo'ladi → sahifada yangi badge ko'rinadi.
4. "Rais tasdiqlaydi" bosiladi → status `APPROVED` → badge yangilanadi.
5. Qaror qo'shiladi → sahifani qayta ochamiz → qaror hali ko'rinadi (DB da saqlangan).

### 6.5 Reviewer skriptlari

```bash
bash scripts/reviewer-result-pattern.sh    # FAIL: 0
bash scripts/reviewer-array-safety.sh      # FAIL: 0
bash scripts/reviewer-as-unknown.sh        # FAIL: 0
bash scripts/reviewer-dto-validation.sh    # PASS
bash scripts/reviewer-jwt-guard.sh         # PASS
```

---

## 7. SELF-VERIFY

### Har bosqichdan keyin:

```bash
# 1. BE typecheck:
pnpm --filter @europrint/api run tsc --noEmit 2>&1 | tail -5

# 2. FE typecheck:
pnpm --filter erp-dashboard run tsc --noEmit 2>&1 | tail -5

# 3. Backend health:
curl -s http://localhost:3030/api/auth/health | jq .

# 4. Git status — faqat owned fayllar o'zgargan bo'lsin:
git status --short
```

### DDL gated qolganini tekshir:

```bash
# Yangi jadvallar DB da bo'lmasligi kerak (migration ishga tushirilmagan):
psql -U europrint europrint -c "\dt council_members" 2>&1
# Kutilgan: "Did not find any relation named council_members" — TO'G'RI

psql -U europrint europrint -c "\dt council_protocols" 2>&1
# Kutilgan: "Did not find any relation named council_protocols" — TO'G'RI
```

### Migration fayllar yaratilgan lekin run etilmagan:

```bash
ls apps/api/src/shared/db/migrations/cor-p*.sql
# Kutilgan: har ikki fayl mavjud

# Mazmunini tekshir:
head -5 apps/api/src/shared/db/migrations/cor-p1-council-members-dokla-extend.sql
# Kutilgan: "-- APPROVED: <egasi> <sana>" yozuv bor
```

---

## 8. COMMIT TARTIBI

**Har bosqich alohida commit. Tartib:**

```bash
# Bosqich 1 — Schema yangilanishi:
git add apps/api/src/shared/db/schema-business-a-2.ts
git commit -m "feat(COR/P31): add councils/council_members/protocols/decisions Drizzle pgTables + dokla/rasporyazhenie enrich"

# Bosqich 2+5 — coordination repo+controller:
git add apps/api/src/modules/director/infrastructure/repositories/coordination.repository.ts
git add apps/api/src/modules/director/domain/repositories/i-coordination.repo.ts
git add apps/api/src/modules/director/application/coordination.service.ts
git add apps/api/src/modules/director/presentation/coordination.controller.ts
git add apps/api/src/modules/director/presentation/dto/director.dto.ts
git commit -m "feat(COR/P31): getCouncils Drizzle ORM + council members CRUD endpoints + enriched dokla DTO"

# Bosqich 7 — Protocol yangi fayllar:
git add apps/api/src/modules/director/domain/repositories/i-protocol.repo.ts
git add apps/api/src/modules/director/infrastructure/repositories/protocol.repository.ts
git add apps/api/src/modules/director/application/protocol.service.ts
git add apps/api/src/modules/director/presentation/protocol.controller.ts
git add apps/api/src/modules/director/presentation/dto/protocol.dto.ts
git commit -m "feat(COR/P31): council protocol sign-flow BE + ProtocolDecisionCreatedEvent (EP-COR-063/065/051)"

# DDL migration fayllar (GATED):
git add apps/api/src/shared/db/migrations/cor-p1-council-members-dokla-extend.sql
git add apps/api/src/shared/db/migrations/cor-p2-protocols-decisions.sql
git commit -m "feat(COR/P31): GATED migrations — council_members + dokla ALTER + council_protocols + decisions DDL [awaiting owner run]"

# FE:
git add artifacts/erp-dashboard/src/pages/CoordinationPageTypes.ts
git add artifacts/erp-dashboard/src/pages/CoordinationPageSections.tsx
git add artifacts/erp-dashboard/src/pages/CoordinationPageDialogs.tsx
git add artifacts/erp-dashboard/src/pages/coordination/ProtocolListPage.tsx
git add artifacts/erp-dashboard/src/pages/coordination/ProtocolDetailPage.tsx
git add artifacts/erp-dashboard/src/locales/uz/coordination.json
git add artifacts/erp-dashboard/src/locales/ru/coordination.json
git commit -m "feat(COR/P31): FE protocol list+detail pages, CouncilsSection API-driven, enriched dialogs, i18n +37 keys"
```

---

## FLAGLAR (egasiga xabar berish)

Quyidagi fayllar **bu paket owned files da YO'Q** — lekin o'zgarish kerak bo'ladi:

| Fayl | Nima kerak | Kim tomonidan |
|------|-----------|---------------|
| `apps/api/src/modules/director/director.module.ts` | `ProtocolController`, `ProtocolService`, `ProtocolRepository`, `PROTOCOL_REPO` token qo'shish | P31 (egasi ruxsati bilan) |
| `artifacts/erp-dashboard/src/pages/CoordinationPage.tsx` | `useQuery` for councils API + CouncilsSection props + "protocols" tab routing | P31 (egasi ruxsati bilan) |
| `artifacts/erp-dashboard/src/routes/DirectorRoutes.tsx` | `/coordination/protocols` va `/coordination/protocols/:id` route qo'shish | P31 (egasi ruxsati bilan) |
| `artifacts/erp-dashboard/src/components/sidebar/constants.ts` | "Protokollar" sidebar sub-item qo'shish | P31 (egasi ruxsati bilan) |

Bu flaglar egasi "ha, bajar" demaguncha o'zgartirilmaydi (Q-28 / Qoida 23).

---

## TEGISHLI PAKETLAR

- **P02 (ORG):** `org_functions.id` FK — council_members.card_id uchun talab. P02 tamomlangan bo'lsin.
- **P03 (WMS):** `kanban_tasks` jadvalida `source_protocol_id` — bu paket ulamaydi; Kanban moduli o'z tomonidan `ProtocolDecisionCreatedEvent` ni tinglab, task yaratadi.
- **Director module wiring:** `director.module.ts` — owned emas, flag yuborildi.

---

*Direktiva yozildi: 2026-06-19 · P31-COR · Wave 1 · Q-47 ≥1000 qator*
