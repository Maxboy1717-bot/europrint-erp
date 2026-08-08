# P34 — LMS: LMS onboarding/mentor + kaizen PDCA + FE card-folder Ta'lim tab

> Paket: P34 · Modul: LMS · To'lqin: 3 · Bog'liqlik: P33
> Yozilgan: 2026-06-19 · Egasi tasdiqlamagunicha DDL ISHGA TUSHIRILMAYDI.

---

## 0. ROL VA QOIDALAR

**Siz 🟢 BAJARUVCHI agentsiz.** Har sessiya boshida `CLAUDE.md` + `docs/agent-constitution.md` o'qing. Quyidagi qoidalar QAT'IY:

```
QOIDALAR BLOKI (Q-47):
1.  Result<T> hamma repo/service metodida; throw/null/undefined TAQIQ.
2.  @Body Zod bilan validate; class-validator TAQIQ.
3.  Drizzle ORM; raw SQL faqat murakkab holatda (izoh + typedExecute<T>).
4.  Q-40 ishlaydi≠to'g'ri: REAL INSERT/UPDATE + DB-proof; echo/hardcoded/fake javob TAQIQ.
5.  Q-46 ishlab turgan kod O'CHIRILMAYDI; buzuq/o'lik/dublikat kod TO'LIQ o'chiriladi (chala emas).
6.  FAYL IZOLYATSIYASI (Qoida 23 / Q-31): faqat shu paketning OWNED-FILE ro'yxatidagi
    fayllarga teg. Boshqa fayl kerak bo'lsa — TO'XTA, egasiga flag qil, supurib ketma.
7.  DDL DARVOZASI (Q-35): CREATE TABLE / migration faqat egasi ruxsati bilan;
    migration faylida `-- APPROVED:` izoh shart. Bu paketning GATED migration fayllari:
      apps/api/src/shared/db/migrations/lms-p3-onboarding-mentor-kaizen.sql
    Faylni YOZ, lekin `-- APPROVED:` stampini egasi qo'yadi — siz QO'YMASIZ.
8.  git add <aniq-fayl> faqat; -A / . TAQIQ. Bitta commit = bitta mantiqiy guruh.
9.  Q-45/Q-30 log/secret HECH QACHON commit qilinmaydi; JWT minting yo'q.
10. Self-verify: BE tsc 0, FE tsc 0, tegishli reviewer skriptlar,
    jonli DB-proof (kirit → saqla → qayta o'qi → ko'rinadimi).
11. "V2"/"Strangler Fig"/"V1 vs V2" terminologiyasi TAQIQ — bitta kod bazasi.
12. Vizyon-moslik: TO'G'RI o'lchovi = master vizyon
    (docs/XARITA-REJA-YONALISH + docs/audit/MUSLIMBEK-PROMT-14-LMS-2026-06-08.md).
```

**WAVE: 3** · **dependsOn: ["P33"]** — P33 (LMS core DDL + salary-block) bajarilmaguncha bu paket boshlanmaydi.

---

## 1. IZOLYATSIYA MANIFESTI

**FAQAT quyidagi fayllarga teg. Ro'yxatdan tashqari fayl kerak bo'lsa — TO'XTA + flag:**

### BE fayllari (yangi — hali mavjud emas)
```
apps/api/src/shared/db/migrations/lms-p3-onboarding-mentor-kaizen.sql   ← DDL GATED
apps/api/src/modules/lms/application/services/lms-onboarding.service.ts
apps/api/src/modules/lms/infrastructure/repositories/drizzle-lms-onboarding.repo.ts
apps/api/src/modules/lms/application/services/lms-mentor.service.ts
apps/api/src/modules/lms/infrastructure/repositories/drizzle-lms-mentor.repo.ts
apps/api/src/modules/lms/application/services/lms-independence-order.service.ts
apps/api/src/modules/lms/presentation/lms-onboarding.controller.ts
apps/api/src/modules/lms/presentation/lms-mentor.controller.ts
```

### Director/kaizen fayllari (ALTER mavjudlarga)
```
apps/api/src/modules/director/infrastructure/repositories/kaizen.repository.ts
apps/api/src/modules/director/application/kaizen.service.ts
lib/db/src/schema/kaizen-schema.ts
```

### FE fayllari (yangi)
```
artifacts/erp-dashboard/src/components/hr/org/CardDetailDialog-lms-tab.tsx
artifacts/erp-dashboard/src/pages/LMSCourseList.tsx
artifacts/erp-dashboard/src/pages/LMSNazoratVaraqa.tsx
artifacts/erp-dashboard/src/pages/LMSOnboarding.tsx
```

### i18n fayllari (kengaytirish)
```
artifacts/erp-dashboard/src/locales/uz/lms.json
artifacts/erp-dashboard/src/locales/ru/lms.json
artifacts/erp-dashboard/src/locales/uz-cyr/lms.json
```

### DDL DARVOZASI
`lms-p3-onboarding-mentor-kaizen.sql` — bu migration egasi `-- APPROVED: <ism> <sana>`
stampini qo'yguncha **`psql` bilan ISHGA TUSHIRILMAYDI**. Faylni yoz, stampini kutib tur.

**PayrollService GL path TEGILMAYDI** — bu paketnin scope'idan tashqari.

---

## 2. VIZYON

Manba: `docs/audit/MUSLIMBEK-PROMT-14-LMS-2026-06-08.md` PHASE 4 + PHASE 6 (kaizen).

### 2.1 Onboarding zanjiri (EP-LMS-030/038/039/040/041/042/043/045/067)
EuroPrint qoidasiga ko'ra har bir yangi xodim **"Mustaqil ishga qo'yish tartibini"** (kitob manba) to'liq o'tishi shart:

```
RD-4 suhbat → TX instruktaj → Maydon instruktaj →
2-oy amaliyot → Nazariy imtihon → Amaliy imtihon →
RD-4 yozma xulosa → Mustaqil ish buyrug'i → Mustaqil status
```

- Har bir qadam ketma-ket QULFLANGAN — oldingi qadam tasdiqlanmaguncha keyingisi ochilmaydi (EP-LMS-038).
- 2-oylik taymer: `practical_end_date = started_at + 60 kun`; 7 kun qolganida mentor + RD-4 menejeriga xabar (EP-LMS-040).
- Ikki imtihon ikkisi ham o'tilishi shart: nazariy (LMS test) + amaliy (rubrik) (EP-LMS-041).
- RD-4 yozma xulosa: inson tomonidan tasdiqlangan (E1 qoidasi — avtomatik emas) (EP-LMS-042).
- Mustaqil ish buyrug'i HR tomonidan tasdiqlanadi → xodimning to'liq oylik huquqi ochiladi (EP-LMS-043).

**Qabul mezoni (PHASE 4):** Onboarding workflow yaratildi → 1-qadam (RD-4) bajarildi → 2-qadam ochildi → barcha qadam zanjiri to'liqlanishi → mustaqil buyruq DB'ga yozildi va HR tasdiqlaganini ifodalovchi `status='order_issued'` satrida ko'rinadi.

### 2.2 Mentor malaka va ikki tomonlama javobgarlik (EP-LMS-057/082)
- Mentor tayinlanishdan oldin: `mentor.razryad >= karta talab razryadi` VA `mentor shu karta uchun sertifikatga ega` — ikkisi ham bajarilishi shart. Aks holda: blok + munosib mentorlar ro'yxati (EP-LMS-057).
- **Ikkiy tomonlama reyting** (egasi override): yaxshi shogird → mentor bonus hovuziga +N ball; yomon natija → −N ball. Bu HR uchun TAKLIF (E1: inson tasdiqlaydi, avtomatik to'lov emas) (EP-LMS-082).

**Qabul mezoni:** Malakasiz mentorni tayinlashga urinilganda `400 + EP-LMS-057` xatosi qaytadi; imtihon natijasidan keyin `lms_mentor_ratings` jadvalida yangi satr ko'rinadi.

### 2.3 Kaizen PDCA + bonus (EP-LMS-020/021/022)
`kaizen_suggestions` jadvali mavjud (`lib/db/src/schema/kaizen-schema.ts:16`) lekin PDCA ustunlari yo'q. ALTER qilinadi:
- `pdca_plan`, `pdca_do`, `pdca_check`, `pdca_act` (text, nullable)
- `pdca_responsible_id` (integer FK → employees.id)
- `pdca_due_date` (date)
- `impact_measured` (boolean, default false)
- `bonus_proposed` (numeric(10,2))
- `bonus_approved_by` (integer FK → users.id)
- `response_text`, `responded_by`, `responded_at` (mavjud emas → qo'shiladi)
- `card_id` (integer FK → org_functions.id — E2: kaizen kartaga biriktiriladi)

**Qabul mezoni:** Taklif qabul qilinadi → PDCA 4 bosqichi to'ldiriladi → bonus taklifi DB'da → HR tasdiqlaydi → `bonus_approved_by` set.

### 2.4 FE: Card folder Ta'lim tab (CHAT-TARIXI section 6)
`CardDetailDialog.tsx:125-135` — hozir 8 tab: Asosiy/Xodimlar/Farzandlar/Vakant/Papka/Statistika/Portret/Tarix. **Ta'lim** 9-tab sifatida qo'shiladi.

- Alohida komponent: `CardDetailDialog-lms-tab.tsx`
- Ko'rsatadi: karta uchun yozilgan kurslar + status (assigned/started/completed/overdue)
- Onboarding progressi (aktiv workflow bo'lsa — stepper)
- Sertifikatlar ro'yxati (muddati bilan)

### 2.5 LMSCourseList sahifasi
Hozirgi holatda `LMSDashboard.tsx` mavjud, lekin `LMSCourseList.tsx` yo'q. Yangi ListPage:
- Kurslar ro'yxati karta bo'yicha filter bilan
- Har kurs uchun: nom, tur, majburiy/ixtiyoriy, yozilganlar soni, tugatish %

### 2.6 LMSNazoratVaraqa sahifasi
12-mavzuli nazorat varaqasi (P33 bilan qo'shma — P33 jadvallarni yaratadi, P34 FE'sini quradi):
- Mavzu ro'yxati + har mavzu uchun "O'qib chiqdim" tasdiqlash tugmasi
- Progress bar: N/12
- Har mavzu: `confirmed_at` belgilanganda checkmark

### 2.7 LMSOnboarding sahifasi
Onboarding stepper UI:
- 10 qadam vizual holati (locked/current/completed)
- Har qadam uchun: mas'ul shaxs, bajarilgan sana, hujjat biriktirish
- RD-4 xulosa matn maydoni (PATCH endpoint)
- Mustaqil buyruq chiqarish tugmasi (HR roli)

---

## 3. HOZIRGI HOLAT

### 3.1 Mavjud LMS BE tuzilmasi
```
apps/api/src/modules/lms/
  application/services/lms-core.service.ts          ← stub/partial
  application/services/lms-exams.service.ts         ← test engine
  application/services/lms-certificates-standalone.service.ts
  infrastructure/repositories/drizzle-lms-exams.repo.ts
  presentation/lms-onboarding.controller.ts         ← YO'Q (owned, yangi yoziladi)
  presentation/lms-mentor.controller.ts             ← YO'Q (owned, yangi yoziladi)
  lms.module.ts                                      ← import'lash uchun o'zgartiriladi*
```
> *`lms.module.ts` owned-files ro'yxatida emas. Yangi controller/service'larni lms.module.ts'ga
> import qilish kerak bo'ladi → bu SCOPE FLAG. Bajaruvchi: lms.module.ts'ga tegishda egasidan
> ruxsat so'ra (Q-28), keyin qo'sh.

### 3.2 Kaizen hozirgi holat
`lib/db/src/schema/kaizen-schema.ts:16-32`:
```ts
// MAVJUD ustunlar:
id, employeeId, departmentId, title, description, expectedImpact,
status (submitted|review|approved|rejected|implementing|completed),
approvedBy, implementedAt, resultMeasured, rejectionReason, createdAt, updatedAt
```
**YO'Q ustunlar (P34 qo'shadi):** `pdca_plan/do/check/act`, `pdca_responsible_id`,
`pdca_due_date`, `impact_measured`, `bonus_proposed`, `bonus_approved_by`,
`response_text`, `responded_by`, `responded_at`, `card_id`.

`apps/api/src/modules/director/infrastructure/repositories/kaizen.repository.ts:20-68`:
- `createSuggestion` — real INSERT ✅ (raw SQL, lekin parametrli ✅)
- `updateSuggestion:52` — `review_comment` va `implementation_notes` ustunlari DB'da yo'q (DRIFT) → UPDATE xato beradi
- `getStats:62` — `status='implemented'` ishlatadi, lekin CHECK constraint `'implementing'/'completed'` ruxsat beradi → stat hisob noto'g'ri (Q-40 bug)

`apps/api/src/modules/director/application/kaizen.service.ts:11-33` — thin wrapper, Result<T> ✅.

### 3.3 FE hozirgi holat
```
artifacts/erp-dashboard/src/pages/LMSDashboard.tsx   ← mavjud, katta sahifa
artifacts/erp-dashboard/src/pages/LMSExtended.tsx    ← mavjud
artifacts/erp-dashboard/src/pages/LMSSupport.tsx     ← mavjud
artifacts/erp-dashboard/src/components/hr/org/CardDetailDialog.tsx:125-135
  ← 8 tab mavjud, 9-chi "Ta'lim" yo'q
```

**Owned new pages (hali YO'Q):**
- `LMSCourseList.tsx` — yo'q
- `LMSNazoratVaraqa.tsx` — yo'q
- `LMSOnboarding.tsx` — yo'q
- `CardDetailDialog-lms-tab.tsx` — yo'q

### 3.4 i18n hozirgi holat
`artifacts/erp-dashboard/src/locales/uz/lms.json` — 89+ kalit mavjud (courses, enrollment,
certificates, mentor, progress...). **Qo'shilishi kerak:** onboarding, pdca, mentor-rating,
independence-order, nazorat-varaqa kalitlari.

### 3.5 Mavjud migration holati
`apps/api/src/shared/db/migrations/fix-onboarding-tables.sql` — HR onboarding plans va
job descriptions (boshqa modul). LMS onboarding workflow jadvallar (`lms_onboarding_workflows`,
`lms_onboarding_steps`, `lms_practical_exam_rubrics`) **hali yo'q** → P34 DDL yaratadi.

### 3.6 Kritik kamchiliklar (to'g'irlanishi kerak)
| Muammo | Fayl:satr | Tur |
|--------|-----------|-----|
| `updateSuggestion` `review_comment` ustuni DB'da yo'q | `kaizen.repository.ts:52` | DRIFT → xato |
| `getStats` `implemented` filter — constraint `completing` | `kaizen.repository.ts:62` | Q-40 noto'g'ri hisob |
| Onboarding workflow jadvallari yo'q | migration | MISSING |
| `lms_mentor_ratings` jadvali yo'q | migration | MISSING |
| `CardDetailDialog.tsx` Ta'lim tab yo'q | `CardDetailDialog.tsx:125` | UI gap |

<!-- DAVOMI -->

---

## 4. ISH (qadam-baqadam)

> Har qadam: fayl aniq ko'rsatilgan, oldin/keyin sketch, Result<T>/Zod/Drizzle, real INSERT.
> Har qadamdan keyin `git add <aniq-fayl> && git commit -m "..."`.

---

### Qadam 1 — DDL: lms-p3-onboarding-mentor-kaizen.sql YOZISH (GATED)

**Fayl:** `apps/api/src/shared/db/migrations/lms-p3-onboarding-mentor-kaizen.sql`

Faylni yoz, `-- APPROVED:` satrini bo'sh qoldirasan (egasi to'ldiradi). Tarkib §5'da to'liq.

```sql
-- APPROVED: _____________________ (egasi to'ldiradi, siz yo'q)
-- Bu migratsiyani egasi tasdiqlagunicha psql bilan ishga tushirmang.
```

**git add:** `apps/api/src/shared/db/migrations/lms-p3-onboarding-mentor-kaizen.sql`
**commit:** `feat(lms-p34): DDL lms_onboarding_workflows + lms_mentor_ratings [GATED]`

---

### Qadam 2 — kaizen-schema.ts: PDCA + bonus ustunlari qo'shish

**Fayl:** `lib/db/src/schema/kaizen-schema.ts`

**Oldin (satr 16-32):**
```ts
export const kaizenSuggestions = pgTable("kaizen_suggestions", {
  id: serial("id").primaryKey(),
  employeeId: varchar("employee_id").references(() => users.id, ...),
  departmentId: integer("department_id"),
  title: varchar("title", { length: 300 }).notNull(),
  description: text("description").notNull(),
  expectedImpact: text("expected_impact"),
  status: varchar("status", { length: 30 }).notNull().default("submitted"),
  approvedBy: varchar("approved_by").references(() => users.id, ...),
  implementedAt: timestamp("implemented_at"),
  resultMeasured: text("result_measured"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at"),
}, ...);
```

**Keyin (yangi ustunlar qo'shiladi, mavjudlari O'CHIRILMAYDI Q-46):**
```ts
import { pgTable, serial, integer, varchar, text, timestamp,
         boolean, check, numeric, date } from "drizzle-orm/pg-core";
import { employees } from "./hr-schema"; // yoki mavjud import yo'li

export const kaizenSuggestions = pgTable("kaizen_suggestions", {
  // --- mavjud ustunlar (o'zgarishsiz) ---
  id: serial("id").primaryKey(),
  employeeId: varchar("employee_id").references(() => users.id, { onDelete: "restrict" }).notNull(),
  departmentId: integer("department_id"),
  cardId: integer("card_id"),                // E2: kartaga biriktiriladi — FK §5 migration
  title: varchar("title", { length: 300 }).notNull(),
  description: text("description").notNull(),
  expectedImpact: text("expected_impact"),
  status: varchar("status", { length: 30 }).notNull().default("submitted"),
  approvedBy: varchar("approved_by").references(() => users.id, { onDelete: "set null" }),
  implementedAt: timestamp("implemented_at"),
  resultMeasured: text("result_measured"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at"),
  // --- P34 qo'shimchalar ---
  responseText: text("response_text"),
  respondedBy: integer("responded_by"),
  respondedAt: timestamp("responded_at"),
  pdcaPlan: text("pdca_plan"),
  pdcaDo: text("pdca_do"),
  pdcaCheck: text("pdca_check"),
  pdcaAct: text("pdca_act"),
  pdcaResponsibleId: integer("pdca_responsible_id"),
  pdcaDueDate: date("pdca_due_date"),
  impactMeasured: boolean("impact_measured").default(false),
  bonusProposed: numeric("bonus_proposed", { precision: 10, scale: 2 }),
  bonusApprovedBy: integer("bonus_approved_by"),
}, (t) => [
  check("kaizen_suggestions_status_chk",
    sql`${t.status} IN ('submitted','review','approved','rejected','implementing','completed')`),
]);
```

**Zod schema yangilanadi:**
```ts
export const updateKaizenPdcaSchema = z.object({
  pdcaPlan: z.string().min(1).optional(),
  pdcaDo: z.string().min(1).optional(),
  pdcaCheck: z.string().min(1).optional(),
  pdcaAct: z.string().min(1).optional(),
  pdcaResponsibleId: z.number().int().positive().optional(),
  pdcaDueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  impactMeasured: z.boolean().optional(),
  bonusProposed: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
});

export const approveBonusSchema = z.object({
  bonusApprovedBy: z.number().int().positive(),
});
```

**git add:** `lib/db/src/schema/kaizen-schema.ts`
**commit:** `feat(lms-p34): kaizen-schema PDCA + bonus + card_id columns [GATED DDL]`

---

### Qadam 3 — kaizen.repository.ts: PDCA metodlari + drift tuzatish

**Fayl:** `apps/api/src/modules/director/infrastructure/repositories/kaizen.repository.ts`

**Bug 1 tuzatish — `updateSuggestion:52` (drift `review_comment` → mavjud emas):**

Oldin:
```ts
const r = await exec(sql`UPDATE kaizen_suggestions SET status = COALESCE(${status}, status),
  review_comment = COALESCE(${reviewComment}, review_comment),
  implementation_notes = COALESCE(${implementationNotes}, implementation_notes),
  ...`);
```

Keyin (mavjud ustunlar ishlatiladi: `result_measured`, `rejection_reason`):
```ts
const r = await exec(sql`
  UPDATE kaizen_suggestions
  SET status            = COALESCE(${status}, status),
      response_text     = COALESCE(${reviewComment}, response_text),
      result_measured   = COALESCE(${implementationNotes}, result_measured),
      responded_by      = CASE WHEN ${reviewedBy}::int > 0 THEN ${reviewedBy} ELSE responded_by END,
      responded_at      = CASE WHEN ${reviewedBy}::int > 0 THEN NOW() ELSE responded_at END,
      updated_at        = NOW()
  WHERE id = ${id}
  RETURNING *
`);
return Ok(r[0] ?? { message: 'Yangilandi' });
```

**Bug 2 tuzatish — `getStats:62` (`implemented` → to'g'ri status):**

Oldin: `COUNT(*) FILTER (WHERE status = 'implemented') AS implemented`
Keyin: `COUNT(*) FILTER (WHERE status = 'completed') AS completed`

**Yangi metodlar qo'shish:**
```ts
async updatePdca(id: number, dto: {
  pdcaPlan?: string; pdcaDo?: string; pdcaCheck?: string; pdcaAct?: string;
  pdcaResponsibleId?: number; pdcaDueDate?: string; impactMeasured?: boolean;
}): Promise<Result<Row>> {
  try {
    const r = await exec(sql`
      UPDATE kaizen_suggestions
      SET pdca_plan           = COALESCE(${dto.pdcaPlan ?? null}, pdca_plan),
          pdca_do             = COALESCE(${dto.pdcaDo ?? null}, pdca_do),
          pdca_check          = COALESCE(${dto.pdcaCheck ?? null}, pdca_check),
          pdca_act            = COALESCE(${dto.pdcaAct ?? null}, pdca_act),
          pdca_responsible_id = COALESCE(${dto.pdcaResponsibleId ?? null}, pdca_responsible_id),
          pdca_due_date       = COALESCE(${dto.pdcaDueDate ?? null}::date, pdca_due_date),
          impact_measured     = COALESCE(${dto.impactMeasured ?? null}, impact_measured),
          updated_at          = NOW()
      WHERE id = ${id}
      RETURNING *
    `);
    if (!r[0]) return Err('Topilmadi');
    return Ok(r[0]);
  } catch (_e) { return Err(String(_e)); }
}

async proposeBonus(id: number, bonusProposed: string): Promise<Result<Row>> {
  try {
    const r = await exec(sql`
      UPDATE kaizen_suggestions
      SET bonus_proposed = ${bonusProposed}::numeric, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `);
    if (!r[0]) return Err('Topilmadi');
    return Ok(r[0]);
  } catch (_e) { return Err(String(_e)); }
}

async approveBonus(id: number, approvedBy: number): Promise<Result<Row>> {
  try {
    const r = await exec(sql`
      UPDATE kaizen_suggestions
      SET bonus_approved_by = ${approvedBy}, updated_at = NOW()
      WHERE id = ${id} AND bonus_proposed IS NOT NULL
      RETURNING *
    `);
    if (!r[0]) return Err('Bonus taklifi topilmadi yoki belgilanmagan');
    return Ok(r[0]);
  } catch (_e) { return Err(String(_e)); }
}
```

**git add:** `apps/api/src/modules/director/infrastructure/repositories/kaizen.repository.ts`
**commit:** `fix(lms-p34): kaizen repo drift fix + PDCA + bonus methods`

---

### Qadam 4 — kaizen.service.ts: yangi metodlar ekspozitsiya

**Fayl:** `apps/api/src/modules/director/application/kaizen.service.ts`

Yangi metodlarni delegate qilib qo'shish (mavjud metodlar O'CHIRILMAYDI):
```ts
async updatePdca(id: number, dto: {
  pdcaPlan?: string; pdcaDo?: string; pdcaCheck?: string; pdcaAct?: string;
  pdcaResponsibleId?: number; pdcaDueDate?: string; impactMeasured?: boolean;
}): Promise<Result<object, AppError>> {
  return this.repo.updatePdca(id, dto);
}

async proposeBonus(id: number, bonusProposed: string): Promise<Result<object, AppError>> {
  return this.repo.proposeBonus(id, bonusProposed);
}

async approveBonus(id: number, approvedBy: number): Promise<Result<object, AppError>> {
  return this.repo.approveBonus(id, approvedBy);
}
```

**git add:** `apps/api/src/modules/director/application/kaizen.service.ts`
**commit:** `feat(lms-p34): kaizen service PDCA + bonus expose`

---

### Qadam 5 — lms-onboarding.service.ts: yaratish

**Fayl:** `apps/api/src/modules/lms/application/services/lms-onboarding.service.ts`

To'liq yangi fayl. P33 migration'dan keyin (`lms_onboarding_workflows`, `lms_onboarding_steps`
jadvallari mavjud deb taxmin qilinadi — DDL GATED, shuning uchun bu servis DDL approved bo'lgach ishga tushiriladi).

```ts
/**
 * @module lms-onboarding.service
 * @description Onboarding workflow orqali xodimni mustaqil ishga qo'yish zanjiri.
 *   EP-LMS-030/038/039/040/041/042/043/045/067
 * @layer Application
 */
import { Injectable, Inject } from '@nestjs/common';
import { Ok, Err, Result, AppError } from '@common/result';
import { ILmsOnboardingRepo, LMS_ONBOARDING_REPO } from
  '../../infrastructure/repositories/drizzle-lms-onboarding.repo';

export const ONBOARDING_STEP_KEYS = [
  'rd4_interview', 'tx_instruction', 'field_instruction',
  'practical_training', 'theory_exam', 'practical_exam',
  'rd4_conclusion', 'order_issued', 'independent',
] as const;
export type OnboardingStepKey = typeof ONBOARDING_STEP_KEYS[number];

@Injectable()
export class LmsOnboardingService {
  constructor(
    @Inject(LMS_ONBOARDING_REPO) private readonly repo: ILmsOnboardingRepo,
  ) {}

  /** Yangi onboarding workflow va 9 ta ketma-ket qadam yaratish */
  async createWorkflow(dto: {
    employeeId: number;
    cardId: number;
    mentorEmployeeId: number;
    rd4ManagerId: number;
    startedAt?: Date;
  }): Promise<Result<{ workflowId: number }, AppError>> {
    const started = dto.startedAt ?? new Date();
    const practicalEnd = new Date(started);
    practicalEnd.setDate(practicalEnd.getDate() + 60); // EP-LMS-040
    const r = await this.repo.createWorkflow({
      ...dto,
      startedAt: started,
      practicalEndDate: practicalEnd,
      status: 'rd4_interview',
    });
    if (!r.ok) return Err(r.error);
    // 9 ta qadam avto-yaratish, faqat birinchisi unlocked
    const steps = ONBOARDING_STEP_KEYS.map((key, idx) => ({
      workflowId: r.data.id,
      stepKey: key,
      isLocked: idx !== 0,
    }));
    const stepsR = await this.repo.createSteps(steps);
    if (!stepsR.ok) return Err(stepsR.error);
    return Ok({ workflowId: r.data.id });
  }

  /** Qadam bajarilgani belgilanadi + keyingi qadam ochiladi (EP-LMS-038) */
  async completeStep(dto: {
    workflowId: number;
    stepKey: OnboardingStepKey;
    responsibleId: number;
    note?: string;
    documentUrl?: string;
  }): Promise<Result<{ nextStep: OnboardingStepKey | null }, AppError>> {
    const r = await this.repo.completeStep(dto);
    if (!r.ok) return Err(r.error);
    const currentIdx = ONBOARDING_STEP_KEYS.indexOf(dto.stepKey);
    const nextKey = ONBOARDING_STEP_KEYS[currentIdx + 1] ?? null;
    if (nextKey) {
      const unlock = await this.repo.unlockStep(dto.workflowId, nextKey);
      if (!unlock.ok) return Err(unlock.error);
    }
    // Status sinxronizatsiya
    const newStatus = nextKey ?? 'independent';
    await this.repo.updateWorkflowStatus(dto.workflowId, newStatus);
    return Ok({ nextStep: nextKey });
  }

  async getWorkflow(workflowId: number): Promise<Result<object, AppError>> {
    return this.repo.getWorkflow(workflowId);
  }

  async listByEmployee(employeeId: number): Promise<Result<object[], AppError>> {
    return this.repo.listByEmployee(employeeId);
  }

  /** HR buyruq tasdiqlash — mustaqil status + oylik gate ochiladi (EP-LMS-043) */
  async issueIndependenceOrder(workflowId: number, hrUserId: number): Promise<Result<object, AppError>> {
    const r = await this.repo.issueOrder(workflowId, hrUserId);
    if (!r.ok) return Err(r.error);
    return Ok(r.data);
  }
}
```

**git add:** `apps/api/src/modules/lms/application/services/lms-onboarding.service.ts`
**commit:** `feat(lms-p34): LmsOnboardingService sequential workflow EP-LMS-038/039/043`

---

### Qadam 6 — drizzle-lms-onboarding.repo.ts: yaratish

**Fayl:** `apps/api/src/modules/lms/infrastructure/repositories/drizzle-lms-onboarding.repo.ts`

```ts
/**
 * @module drizzle-lms-onboarding.repo
 * @description Onboarding workflow + steps repository. Result<T> hamma metodda.
 * @layer Infrastructure
 */
import { Injectable } from '@nestjs/common';
import { Ok, Err, Result } from '@common/result';
import { db, runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import type { OnboardingStepKey } from '../application/services/lms-onboarding.service';

type Row = Record<string, unknown>;
export const LMS_ONBOARDING_REPO = 'LMS_ONBOARDING_REPO';

export interface ILmsOnboardingRepo {
  createWorkflow(data: {
    employeeId: number; cardId: number; mentorEmployeeId: number;
    rd4ManagerId: number; startedAt: Date; practicalEndDate: Date; status: string;
  }): Promise<Result<{ id: number }>>;
  createSteps(steps: { workflowId: number; stepKey: string; isLocked: boolean }[]): Promise<Result<void>>;
  completeStep(dto: { workflowId: number; stepKey: string; responsibleId: number; note?: string; documentUrl?: string }): Promise<Result<Row>>;
  unlockStep(workflowId: number, stepKey: string): Promise<Result<void>>;
  updateWorkflowStatus(workflowId: number, status: string): Promise<Result<void>>;
  getWorkflow(workflowId: number): Promise<Result<object>>;
  listByEmployee(employeeId: number): Promise<Result<object[]>>;
  issueOrder(workflowId: number, hrUserId: number): Promise<Result<Row>>;
}

@Injectable()
export class DrizzleLmsOnboardingRepo implements ILmsOnboardingRepo {
  async createWorkflow(data: {
    employeeId: number; cardId: number; mentorEmployeeId: number;
    rd4ManagerId: number; startedAt: Date; practicalEndDate: Date; status: string;
  }): Promise<Result<{ id: number }>> {
    try {
      const r = await (await runQuery<Row>(sql`
        INSERT INTO lms_onboarding_workflows
          (employee_id, card_id, mentor_employee_id, rd4_manager_id,
           started_at, practical_end_date, status)
        VALUES
          (${data.employeeId}, ${data.cardId}, ${data.mentorEmployeeId},
           ${data.rd4ManagerId}, ${data.startedAt.toISOString()},
           ${data.practicalEndDate.toISOString()}, ${data.status})
        RETURNING id
      `)).rows as Row[];
      return Ok({ id: Number(r[0]?.id) });
    } catch (_e) { return Err(String(_e)); }
  }

  async createSteps(steps: { workflowId: number; stepKey: string; isLocked: boolean }[]): Promise<Result<void>> {
    try {
      for (const s of steps) {
        await runQuery(sql`
          INSERT INTO lms_onboarding_steps (workflow_id, step_key, is_locked)
          VALUES (${s.workflowId}, ${s.stepKey}, ${s.isLocked})
        `);
      }
      return Ok(undefined);
    } catch (_e) { return Err(String(_e)); }
  }

  async completeStep(dto: { workflowId: number; stepKey: string; responsibleId: number; note?: string; documentUrl?: string }): Promise<Result<Row>> {
    try {
      const r = await (await runQuery<Row>(sql`
        UPDATE lms_onboarding_steps
        SET responsible_employee_id = ${dto.responsibleId},
            completed_at            = NOW(),
            note                    = ${dto.note ?? null},
            document_url            = ${dto.documentUrl ?? null},
            is_locked               = false
        WHERE workflow_id = ${dto.workflowId} AND step_key = ${dto.stepKey}
        RETURNING *
      `)).rows as Row[];
      if (!r[0]) return Err('Qadam topilmadi');
      return Ok(r[0]);
    } catch (_e) { return Err(String(_e)); }
  }

  async unlockStep(workflowId: number, stepKey: string): Promise<Result<void>> {
    try {
      await runQuery(sql`
        UPDATE lms_onboarding_steps
        SET is_locked = false
        WHERE workflow_id = ${workflowId} AND step_key = ${stepKey}
      `);
      return Ok(undefined);
    } catch (_e) { return Err(String(_e)); }
  }

  async updateWorkflowStatus(workflowId: number, status: string): Promise<Result<void>> {
    try {
      await runQuery(sql`
        UPDATE lms_onboarding_workflows SET status = ${status}, updated_at = NOW()
        WHERE id = ${workflowId}
      `);
      return Ok(undefined);
    } catch (_e) { return Err(String(_e)); }
  }

  async getWorkflow(workflowId: number): Promise<Result<object>> {
    try {
      const rows = await (await runQuery<Row>(sql`
        SELECT w.*,
               json_agg(s ORDER BY s.id) AS steps
        FROM lms_onboarding_workflows w
        LEFT JOIN lms_onboarding_steps s ON s.workflow_id = w.id
        WHERE w.id = ${workflowId}
        GROUP BY w.id
      `)).rows as Row[];
      if (!rows[0]) return Err('Topilmadi');
      return Ok(rows[0]);
    } catch (_e) { return Err(String(_e)); }
  }

  async listByEmployee(employeeId: number): Promise<Result<object[]>> {
    try {
      const rows = await (await runQuery<Row>(sql`
        SELECT w.*, COUNT(s.id) FILTER (WHERE s.completed_at IS NOT NULL) AS completed_steps
        FROM lms_onboarding_workflows w
        LEFT JOIN lms_onboarding_steps s ON s.workflow_id = w.id
        WHERE w.employee_id = ${employeeId}
        GROUP BY w.id ORDER BY w.started_at DESC
      `)).rows as Row[];
      return Ok(rows);
    } catch (_e) { return Err(String(_e)); }
  }

  async issueOrder(workflowId: number, hrUserId: number): Promise<Result<Row>> {
    try {
      const r = await (await runQuery<Row>(sql`
        UPDATE lms_onboarding_workflows
        SET status = 'order_issued', order_issued_by = ${hrUserId},
            order_issued_at = NOW(), updated_at = NOW()
        WHERE id = ${workflowId} AND status = 'rd4_conclusion'
        RETURNING *
      `)).rows as Row[];
      if (!r[0]) return Err('Workflow rd4_conclusion holatida emas yoki topilmadi');
      return Ok(r[0]);
    } catch (_e) { return Err(String(_e)); }
  }
}
```

**git add:** `apps/api/src/modules/lms/infrastructure/repositories/drizzle-lms-onboarding.repo.ts`
**commit:** `feat(lms-p34): DrizzleLmsOnboardingRepo Result<T> all methods`

---

### Qadam 7 — lms-mentor.service.ts + drizzle-lms-mentor.repo.ts: yaratish

**Fayl A:** `apps/api/src/modules/lms/application/services/lms-mentor.service.ts`

```ts
/**
 * @module lms-mentor.service
 * @description Mentor malaka tekshiruvi (EP-LMS-057) + ikki tomonlama reyting (EP-LMS-082).
 * @layer Application
 */
import { Injectable, Inject } from '@nestjs/common';
import { Ok, Err, Result, AppError } from '@common/result';
import { ILmsMentorRepo, LMS_MENTOR_REPO } from
  '../../infrastructure/repositories/drizzle-lms-mentor.repo';

@Injectable()
export class LmsMentorService {
  constructor(@Inject(LMS_MENTOR_REPO) private readonly repo: ILmsMentorRepo) {}

  /**
   * Mentor malakasini tekshirish (EP-LMS-057):
   * 1) mentor.razryad >= karta talab razryadi
   * 2) mentor shu karta uchun sertifikatga ega
   * Agar ikkisi ham bajarilmasa → Err + munosib mentorlar ro'yxati
   */
  async qualifyMentor(mentorId: number, cardId: number): Promise<Result<{
    qualified: boolean;
    reason?: string;
    alternatives?: object[];
  }, AppError>> {
    const check = await this.repo.checkMentorQualification(mentorId, cardId);
    if (!check.ok) return Err(check.error);
    const { hasRazryad, hasCertificate } = check.data;
    if (!hasRazryad || !hasCertificate) {
      const alts = await this.repo.findQualifiedMentors(cardId);
      return Ok({
        qualified: false,
        reason: !hasRazryad
          ? 'EP-LMS-057: Mentor razryadi yetarli emas'
          : 'EP-LMS-057: Mentor bu karta uchun sertifikatga ega emas',
        alternatives: alts.ok ? alts.data : [],
      });
    }
    return Ok({ qualified: true });
  }

  /**
   * Imtihon natijasi bo'yicha ikki tomonlama reyting yangilash (EP-LMS-082).
   * Bu HR uchun TAKLIF — avtomatik to'lov emas (E1).
   */
  async recordMentorRating(dto: {
    mentorId: number;
    apprenticeId: number;
    workflowId: number;
    examPassed: boolean;
    deltaPoints: number; // HR master-data'dan keladi
  }): Promise<Result<{ proposalId: number }, AppError>> {
    const direction = dto.examPassed ? 'bonus' : 'deduction';
    const r = await this.repo.createRatingProposal({
      mentorId: dto.mentorId,
      apprenticeId: dto.apprenticeId,
      workflowId: dto.workflowId,
      direction,
      deltaPoints: dto.deltaPoints,
      status: 'pending_hr',
    });
    if (!r.ok) return Err(r.error);
    return Ok({ proposalId: r.data.id });
  }

  async getMentorApprentices(mentorId: number): Promise<Result<object[], AppError>> {
    return this.repo.getMentorApprentices(mentorId);
  }
}
```

**Fayl B:** `apps/api/src/modules/lms/infrastructure/repositories/drizzle-lms-mentor.repo.ts`

```ts
/**
 * @module drizzle-lms-mentor.repo
 * @description Mentor qualification + two-way rating repository.
 * @layer Infrastructure
 */
import { Injectable } from '@nestjs/common';
import { Ok, Err, Result } from '@common/result';
import { runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';

type Row = Record<string, unknown>;
export const LMS_MENTOR_REPO = 'LMS_MENTOR_REPO';

export interface ILmsMentorRepo {
  checkMentorQualification(mentorId: number, cardId: number): Promise<Result<{ hasRazryad: boolean; hasCertificate: boolean }>>;
  findQualifiedMentors(cardId: number): Promise<Result<object[]>>;
  createRatingProposal(dto: { mentorId: number; apprenticeId: number; workflowId: number; direction: string; deltaPoints: number; status: string }): Promise<Result<{ id: number }>>;
  getMentorApprentices(mentorId: number): Promise<Result<object[]>>;
}

@Injectable()
export class DrizzleLmsMentorRepo implements ILmsMentorRepo {
  async checkMentorQualification(mentorId: number, cardId: number): Promise<Result<{ hasRazryad: boolean; hasCertificate: boolean }>> {
    try {
      // Razryad tekshiruvi: mentor razryadi >= karta talab razryadi
      const rzRows = await (await runQuery<Row>(sql`
        SELECT e.razryad_level_id AS mentor_rzd,
               f.razryad_level_id AS required_rzd
        FROM employees e
        JOIN org_functions f ON f.id = ${cardId}
        WHERE e.id = ${mentorId}
      `)).rows as Row[];
      const hasRazryad = rzRows[0]
        ? Number(rzRows[0].mentor_rzd ?? 0) >= Number(rzRows[0].required_rzd ?? 0)
        : false;
      // Sertifikat tekshiruvi: lms_certificates jadvalida
      const certRows = await (await runQuery<Row>(sql`
        SELECT 1 FROM lms_certificates
        WHERE employee_id = ${mentorId} AND card_id = ${cardId}
          AND (expires_at IS NULL OR expires_at > NOW())
        LIMIT 1
      `)).rows as Row[];
      return Ok({ hasRazryad, hasCertificate: certRows.length > 0 });
    } catch (_e) { return Err(String(_e)); }
  }

  async findQualifiedMentors(cardId: number): Promise<Result<object[]>> {
    try {
      const rows = await (await runQuery<Row>(sql`
        SELECT e.id, e.first_name || ' ' || e.last_name AS full_name,
               e.razryad_level_id,
               lc.certificate_number
        FROM employees e
        JOIN lms_certificates lc ON lc.employee_id = e.id AND lc.card_id = ${cardId}
        JOIN org_functions f ON f.id = ${cardId}
        WHERE e.razryad_level_id >= f.razryad_level_id
          AND (lc.expires_at IS NULL OR lc.expires_at > NOW())
        ORDER BY e.razryad_level_id DESC
        LIMIT 10
      `)).rows as Row[];
      return Ok(rows);
    } catch (_e) { return Err(String(_e)); }
  }

  async createRatingProposal(dto: {
    mentorId: number; apprenticeId: number; workflowId: number;
    direction: string; deltaPoints: number; status: string;
  }): Promise<Result<{ id: number }>> {
    try {
      const r = await (await runQuery<Row>(sql`
        INSERT INTO lms_mentor_ratings
          (mentor_id, apprentice_id, workflow_id, direction, delta_points, status, created_at)
        VALUES
          (${dto.mentorId}, ${dto.apprenticeId}, ${dto.workflowId},
           ${dto.direction}, ${dto.deltaPoints}, ${dto.status}, NOW())
        RETURNING id
      `)).rows as Row[];
      return Ok({ id: Number(r[0]?.id) });
    } catch (_e) { return Err(String(_e)); }
  }

  async getMentorApprentices(mentorId: number): Promise<Result<object[]>> {
    try {
      const rows = await (await runQuery<Row>(sql`
        SELECT w.id AS workflow_id,
               w.employee_id AS apprentice_id,
               e.first_name || ' ' || e.last_name AS apprentice_name,
               w.status, w.practical_end_date,
               COUNT(s.id) FILTER (WHERE s.completed_at IS NOT NULL) AS done_steps,
               COUNT(s.id) AS total_steps
        FROM lms_onboarding_workflows w
        JOIN employees e ON e.id = w.employee_id
        LEFT JOIN lms_onboarding_steps s ON s.workflow_id = w.id
        WHERE w.mentor_employee_id = ${mentorId}
        GROUP BY w.id, e.first_name, e.last_name
        ORDER BY w.started_at DESC
      `)).rows as Row[];
      return Ok(rows);
    } catch (_e) { return Err(String(_e)); }
  }
}
```

**git add:** ikkala fayl ham
**commit:** `feat(lms-p34): LmsMentorService + repo qualification + two-way rating EP-LMS-057/082`

---

### Qadam 8 — lms-independence-order.service.ts: yaratish

**Fayl:** `apps/api/src/modules/lms/application/services/lms-independence-order.service.ts`

```ts
/**
 * @module lms-independence-order.service
 * @description HR mustaqil ish buyrug'i tasdiqlash. E1: inson (HR) tasdiqlaydi.
 *   EP-LMS-043/045
 * @layer Application
 */
import { Injectable, Inject } from '@nestjs/common';
import { Ok, Err, Result, AppError } from '@common/result';
import { ILmsOnboardingRepo, LMS_ONBOARDING_REPO } from
  '../../infrastructure/repositories/drizzle-lms-onboarding.repo';

@Injectable()
export class LmsIndependenceOrderService {
  constructor(
    @Inject(LMS_ONBOARDING_REPO) private readonly repo: ILmsOnboardingRepo,
  ) {}

  /** HR mustaqil ish buyrug'ini tasdiqlaydi (EP-LMS-043).
   *  Shart: workflow.status = 'rd4_conclusion' va yozma xulosa tasdiqlangan.
   *  Natija: status='order_issued', employee oylik gate ochiladi (event emit).
   */
  async issueOrder(workflowId: number, hrUserId: number): Promise<Result<{
    message: string;
    workflowId: number;
    orderedAt: string;
  }, AppError>> {
    const r = await this.repo.issueOrder(workflowId, hrUserId);
    if (!r.ok) return Err(r.error);
    return Ok({
      message: 'Mustaqil ish buyrug\'i chiqarildi. Xodim to\'liq oylik huquqiga ega.',
      workflowId,
      orderedAt: new Date().toISOString(),
    });
  }

  /** HR ro'yxati: tasdiqlash kutilayotgan buyruqlar */
  async pendingOrders(): Promise<Result<object[], AppError>> {
    return this.repo.listByStatus('rd4_conclusion');
  }
}
```

`drizzle-lms-onboarding.repo.ts`'ga `listByStatus` metodi qo'shish:
```ts
async listByStatus(status: string): Promise<Result<object[]>> {
  try {
    const rows = await (await runQuery<Row>(sql`
      SELECT w.*, e.first_name || ' ' || e.last_name AS employee_name,
             f.position_name AS card_name
      FROM lms_onboarding_workflows w
      JOIN employees e ON e.id = w.employee_id
      JOIN org_functions f ON f.id = w.card_id
      WHERE w.status = ${status}
      ORDER BY w.started_at DESC
    `)).rows as Row[];
    return Ok(rows);
  } catch (_e) { return Err(String(_e)); }
}
```

**git add:** `lms-independence-order.service.ts` + repo update
**commit:** `feat(lms-p34): LmsIndependenceOrderService HR approval EP-LMS-043`

---

### Qadam 9 — lms-onboarding.controller.ts + lms-mentor.controller.ts: yaratish

**Fayl A:** `apps/api/src/modules/lms/presentation/lms-onboarding.controller.ts`

```ts
/**
 * @module lms-onboarding.controller
 * @description Onboarding workflow endpoints. Route: /api/lms/onboarding
 * @layer Presentation
 */
import { Controller, Post, Get, Patch, Param, Body, ParseIntPipe, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { z } from 'zod';
import { LmsOnboardingService } from '../application/services/lms-onboarding.service';
import { LmsIndependenceOrderService } from '../application/services/lms-independence-order.service';
import { unwrapOrThrow } from '@common/result';

const CreateWorkflowSchema = z.object({
  employeeId:       z.number().int().positive(),
  cardId:           z.number().int().positive(),
  mentorEmployeeId: z.number().int().positive(),
  rd4ManagerId:     z.number().int().positive(),
});

const CompleteStepSchema = z.object({
  stepKey:         z.enum(['rd4_interview','tx_instruction','field_instruction',
                           'practical_training','theory_exam','practical_exam',
                           'rd4_conclusion','order_issued','independent']),
  responsibleId:   z.number().int().positive(),
  note:            z.string().optional(),
  documentUrl:     z.string().url().optional(),
});

@Controller('lms/onboarding')
@UseGuards(JwtAuthGuard)
export class LmsOnboardingController {
  constructor(
    private readonly onboarding: LmsOnboardingService,
    private readonly orderSvc: LmsIndependenceOrderService,
  ) {}

  @Post()
  async create(@Body() body: unknown) {
    const dto = CreateWorkflowSchema.parse(body);
    return unwrapOrThrow(await this.onboarding.createWorkflow(dto));
  }

  @Get('employee/:id')
  async byEmployee(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrThrow(await this.onboarding.listByEmployee(id));
  }

  @Get(':id')
  async getOne(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrThrow(await this.onboarding.getWorkflow(id));
  }

  @Patch(':id/step')
  async completeStep(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    const dto = CompleteStepSchema.parse(body);
    return unwrapOrThrow(await this.onboarding.completeStep({ workflowId: id, ...dto }));
  }

  @Post(':id/issue-order')
  async issueOrder(@Param('id', ParseIntPipe) id: number, @Req() req: { user: { sub: number } }) {
    return unwrapOrThrow(await this.orderSvc.issueOrder(id, req.user.sub));
  }

  @Get('pending-orders')
  async pendingOrders() {
    return unwrapOrThrow(await this.orderSvc.pendingOrders());
  }
}
```

**Fayl B:** `apps/api/src/modules/lms/presentation/lms-mentor.controller.ts`

```ts
/**
 * @module lms-mentor.controller
 * @description Mentor qualification + rating endpoints. Route: /api/lms/mentor
 * @layer Presentation
 */
import { Controller, Post, Get, Param, Body, ParseIntPipe, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { z } from 'zod';
import { LmsMentorService } from '../application/services/lms-mentor.service';
import { unwrapOrThrow } from '@common/result';

const QualifySchema = z.object({
  mentorId: z.number().int().positive(),
  cardId:   z.number().int().positive(),
});

const RatingSchema = z.object({
  mentorId:     z.number().int().positive(),
  apprenticeId: z.number().int().positive(),
  workflowId:   z.number().int().positive(),
  examPassed:   z.boolean(),
  deltaPoints:  z.number().int().nonnegative(),
});

@Controller('lms/mentor')
@UseGuards(JwtAuthGuard)
export class LmsMentorController {
  constructor(private readonly svc: LmsMentorService) {}

  @Post('qualify')
  async qualify(@Body() body: unknown) {
    const dto = QualifySchema.parse(body);
    return unwrapOrThrow(await this.svc.qualifyMentor(dto.mentorId, dto.cardId));
  }

  @Post('rating')
  async recordRating(@Body() body: unknown) {
    const dto = RatingSchema.parse(body);
    return unwrapOrThrow(await this.svc.recordMentorRating(dto));
  }

  @Get(':mentorId/apprentices')
  async apprentices(@Param('mentorId', ParseIntPipe) mentorId: number) {
    return unwrapOrThrow(await this.svc.getMentorApprentices(mentorId));
  }
}
```

**SCOPE FLAG (Q-28 to'xtash nuqtasi):**
Bu controller'lar `lms.module.ts`'ga import qilinishi kerak. `lms.module.ts` owned-files
ro'yxatida yo'q. Egasidan ruxsat so'ra:
> "lms.module.ts'ga LmsOnboardingService, DrizzleLmsOnboardingRepo, LmsOnboardingController,
> LmsMentorService, DrizzleLmsMentorRepo, LmsMentorController, LmsIndependenceOrderService
> qo'shishim kerak. Ruxsat berasizmi?"

Ruxsat kelganidan keyin qo'sh.

**git add:** ikkala controller ham
**commit:** `feat(lms-p34): onboarding + mentor controllers /api/lms/onboarding /api/lms/mentor`

---

### Qadam 10 — FE: CardDetailDialog-lms-tab.tsx: yaratish

**Fayl:** `artifacts/erp-dashboard/src/components/hr/org/CardDetailDialog-lms-tab.tsx`

```tsx
/**
 * @module CardDetailDialog-lms-tab
 * @description Ta'lim tab — karta uchun enrollments + onboarding progress + sertifikatlar.
 *   CardDetailDialog.tsx 9-tab sifatida import qilinadi (mavjud 8 tab O'CHIRILMAYDI Q-46).
 *   EP-LMS-025/E2
 */
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Award, GraduationCap } from "lucide-react";
import { EPLoader, EPEmptyState, EPStatusPill, EPComingSoon } from "@/components/ep";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useTranslation } from "@/lib/i18n";

type Row = Record<string, unknown>;
const listOf = (d: unknown): Row[] =>
  Array.isArray((d as { items?: Row[] })?.items)
    ? (d as { items: Row[] }).items
    : Array.isArray(d) ? (d as Row[]) : [];

const STATUS_TONE: Record<string, "brand" | "success" | "warning" | "error" | "neutral"> = {
  assigned:  "neutral",
  started:   "brand",
  completed: "success",
  overdue:   "error",
  failed:    "error",
};

interface Props { cardId: number; enabled: boolean; }

export function CardLmsTab({ cardId, enabled }: Props) {
  const { t } = useTranslation("lms");

  const enrollments = useQuery<{ items: Row[] }>({
    queryKey: [`/api/lms/enrollments/by-card/${cardId}`],
    enabled,
  });
  const onboarding = useQuery<{ items: Row[] }>({
    queryKey: [`/api/lms/onboarding/by-card/${cardId}`],
    enabled,
  });
  const certs = useQuery<{ items: Row[] }>({
    queryKey: [`/api/org-structure/cards/${cardId}/certificates`],
    enabled,
  });

  return (
    <div className="space-y-6">
      {/* Kurslar */}
      <section>
        <h3 className="text-[14px] font-semibold mb-2 flex items-center gap-2">
          <BookOpen className="h-4 w-4" style={{ color: "var(--mod-lms)" }} />
          {t("courses")}
        </h3>
        {enrollments.isLoading ? (
          <EPLoader />
        ) : listOf(enrollments.data).length === 0 ? (
          <EPEmptyState icon={BookOpen} title={t("enrollment")} />
        ) : (
          <div className="rounded-lg border border-border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("course")}</TableHead>
                  <TableHead>{t("mandatory")}</TableHead>
                  <TableHead>{t("progress")}</TableHead>
                  <TableHead>{t("deadline")}</TableHead>
                  <TableHead>{t("completion")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listOf(enrollments.data).map((e) => (
                  <TableRow key={String(e.id)}>
                    <TableCell className="font-medium">{String(e.course_title_uz ?? e.course_title ?? "")}</TableCell>
                    <TableCell>
                      {e.is_mandatory
                        ? <EPStatusPill tone="error">{t("mandatory")}</EPStatusPill>
                        : <EPStatusPill tone="neutral">{t("optional")}</EPStatusPill>}
                    </TableCell>
                    <TableCell>{`${String(e.progress_pct ?? 0)}%`}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {e.due_date ? String(e.due_date).substring(0, 10) : "—"}
                    </TableCell>
                    <TableCell>
                      <EPStatusPill tone={STATUS_TONE[String(e.status)] ?? "neutral"}>
                        {t(String(e.status) || "enrollment")}
                      </EPStatusPill>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      {/* Onboarding */}
      <section>
        <h3 className="text-[14px] font-semibold mb-2 flex items-center gap-2">
          <GraduationCap className="h-4 w-4" style={{ color: "var(--mod-lms)" }} />
          {t("onboarding.title")}
        </h3>
        {onboarding.isLoading ? (
          <EPLoader />
        ) : listOf(onboarding.data).length === 0 ? (
          <EPEmptyState icon={GraduationCap} title={t("onboarding.empty")} />
        ) : (
          <div className="space-y-2">
            {listOf(onboarding.data).slice(0, 3).map((w) => (
              <div key={String(w.id)} className="rounded border border-border p-3 text-[13px]">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{String(w.employee_name ?? "")}</span>
                  <EPStatusPill tone={w.status === 'independent' ? 'success' : 'brand'}>
                    {String(w.status ?? "")}
                  </EPStatusPill>
                </div>
                <div className="text-muted-foreground mt-1">
                  {t("onboarding.steps")}: {String(w.completed_steps ?? 0)}/9
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Sertifikatlar */}
      <section>
        <h3 className="text-[14px] font-semibold mb-2 flex items-center gap-2">
          <Award className="h-4 w-4" style={{ color: "var(--mod-lms)" }} />
          {t("certificates")}
        </h3>
        {certs.isLoading ? (
          <EPLoader />
        ) : listOf(certs.data).length === 0 ? (
          <EPEmptyState icon={Award} title={t("certificate.title")} />
        ) : (
          <div className="space-y-1">
            {listOf(certs.data).map((c) => (
              <div key={String(c.id)} className="flex justify-between text-[13px] border-b border-border py-2">
                <span>{String(c.employee_name ?? "")}</span>
                <span className="text-muted-foreground">
                  {c.expiring_soon
                    ? <EPStatusPill tone="warning">{t("certificate.status.expired")}</EPStatusPill>
                    : <EPStatusPill tone="success">{t("certificate.status.valid")}</EPStatusPill>}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
```

**CardDetailDialog.tsx'ga tab qo'shish (SCOPE FLAG Q-28):**
`CardDetailDialog.tsx` owned-files'da yo'q. Egasidan ruxsat so'ra:
> "CardDetailDialog.tsx:125-135'dagi TabsList'ga `<TabsTrigger value='talim'>{t('talim')}</TabsTrigger>`
> va `<TabsContent value='talim'><CardLmsTab .../></TabsContent>` qo'shish uchun ruxsat kerak."

**git add:** `artifacts/erp-dashboard/src/components/hr/org/CardDetailDialog-lms-tab.tsx`
**commit:** `feat(lms-p34): CardLmsTab enrollments + onboarding + certs`

---

### Qadam 11 — LMSCourseList.tsx: yaratish

**Fayl:** `artifacts/erp-dashboard/src/pages/LMSCourseList.tsx`

```tsx
/**
 * @module LMSCourseList
 * @description LMS kurslar ro'yxati. ListPage template. Karta bo'yicha filter.
 * @design EP Linear Soft — var(--mod-lms) token, ListPage shablon
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookOpen } from "lucide-react";
import { EPPageHeader, EPLoader, EPErrorState, EPEmptyState, EPStatusPill } from "@/components/ep";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/lib/i18n";

type Course = {
  id: number; title_uz: string; course_type: string;
  is_mandatory: boolean; enrolled_count: number; completion_pct: number;
  card_name?: string;
};

export default function LMSCourseList() {
  const { t } = useTranslation("lms");
  const [search, setSearch] = useState("");

  const { data, isLoading, isError, refetch } = useQuery<{ items: Course[] }>({
    queryKey: ["/api/lms/courses"],
  });

  const courses = Array.isArray(data?.items) ? data!.items : [];
  const filtered = search
    ? courses.filter((c) =>
        c.title_uz.toLowerCase().includes(search.toLowerCase()) ||
        (c.card_name ?? "").toLowerCase().includes(search.toLowerCase())
      )
    : courses;

  return (
    <div className="space-y-4 p-4">
      <EPPageHeader
        title={t("course.list")}
        subtitle={t("title")}
        icon={<BookOpen style={{ color: "var(--mod-lms)" }} />}
      />
      <div className="flex items-center gap-3">
        <Input
          placeholder={`${t("course.title")}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
      </div>
      {isLoading ? (
        <EPLoader />
      ) : isError ? (
        <EPErrorState onRetry={() => refetch()} />
      ) : filtered.length === 0 ? (
        <EPEmptyState icon={BookOpen} title={t("course.list")} />
      ) : (
        <div className="rounded-lg border border-border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("course.title")}</TableHead>
                <TableHead>{t("category")}</TableHead>
                <TableHead>{t("mandatory")}</TableHead>
                <TableHead>{t("students")}</TableHead>
                <TableHead>{t("completionRate")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">
                    <div>{c.title_uz}</div>
                    {c.card_name ? (
                      <div className="text-[11px] text-muted-foreground">{c.card_name}</div>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <EPStatusPill tone="neutral">{c.course_type}</EPStatusPill>
                  </TableCell>
                  <TableCell>
                    {c.is_mandatory
                      ? <EPStatusPill tone="error">{t("mandatory")}</EPStatusPill>
                      : <EPStatusPill tone="neutral">{t("optional")}</EPStatusPill>}
                  </TableCell>
                  <TableCell>{c.enrolled_count}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 rounded bg-muted overflow-hidden">
                        <div
                          className="h-full rounded"
                          style={{
                            width: `${Math.min(c.completion_pct, 100)}%`,
                            background: "var(--mod-lms)",
                          }}
                        />
                      </div>
                      <span className="text-[12px]">{c.completion_pct}%</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
```

**git add:** `artifacts/erp-dashboard/src/pages/LMSCourseList.tsx`
**commit:** `feat(lms-p34): LMSCourseList page ListPage template EP-LMS-025`

---

### Qadam 12 — LMSNazoratVaraqa.tsx: yaratish

**Fayl:** `artifacts/erp-dashboard/src/pages/LMSNazoratVaraqa.tsx`

```tsx
/**
 * @module LMSNazoratVaraqa
 * @description 12-mavzuli nazorat varaqasi. DetailPage template.
 *   Har mavzu "O'qib chiqdim" tugmasi — real PATCH endpoint. EP-LMS-031/034.
 * @design EP Linear Soft — var(--mod-lms)
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import { CheckCircle2, BookOpen } from "lucide-react";
import { EPPageHeader, EPLoader, EPErrorState, EPEmptyState, EPStatusPill } from "@/components/ep";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useTranslation } from "@/lib/i18n";

type Topic = {
  id: number; topic_number: number; topic_key: string;
  content_uz: string; confirmed_at: string | null; confirmed_by: number | null;
};

export default function LMSNazoratVaraqa() {
  const { t } = useTranslation("lms");
  const { enrollmentId } = useParams<{ enrollmentId: string }>();
  const { toast } = useToast();
  const qc = useQueryClient();
  const qk = [`/api/lms/nazorat-varaqa/${enrollmentId}`];

  const { data, isLoading, isError, refetch } = useQuery<{ items: Topic[] }>({ queryKey: qk });

  const confirmMutation = useMutation({
    mutationFn: (topicId: number) =>
      apiRequest("PATCH", `/api/lms/nazorat-varaqa/${enrollmentId}/topics/${topicId}/confirm`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk });
      toast({ title: t("nazorat.confirmed") });
    },
    onError: () => toast({ title: t("Xatolik"), variant: "destructive" }),
  });

  const topics = Array.isArray(data?.items) ? data!.items : [];
  const confirmed = topics.filter((t) => t.confirmed_at !== null).length;
  const total = topics.length || 12;
  const pct = Math.round((confirmed / total) * 100);

  return (
    <div className="space-y-4 p-4 max-w-3xl mx-auto">
      <EPPageHeader
        title={t("nazorat.title")}
        subtitle={`${t("progress")}: ${confirmed}/${total}`}
        icon={<BookOpen style={{ color: "var(--mod-lms)" }} />}
      />

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-[12px] text-muted-foreground">
          <span>{t("nazorat.confirmed_topics")}: {confirmed}/{total}</span>
          <span>{pct}%</span>
        </div>
        <div className="h-2 rounded bg-muted overflow-hidden">
          <div
            className="h-full rounded transition-all"
            style={{ width: `${pct}%`, background: "var(--mod-lms)" }}
          />
        </div>
      </div>

      {isLoading ? (
        <EPLoader />
      ) : isError ? (
        <EPErrorState onRetry={() => refetch()} />
      ) : topics.length === 0 ? (
        <EPEmptyState icon={BookOpen} title={t("nazorat.empty")} />
      ) : (
        <div className="space-y-3">
          {topics.map((topic) => (
            <div
              key={topic.id}
              className="rounded-lg border border-border p-4 space-y-2"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[12px] font-mono text-muted-foreground">
                      {topic.topic_number}/12
                    </span>
                    <EPStatusPill tone="neutral">{topic.topic_key}</EPStatusPill>
                    {topic.confirmed_at && (
                      <CheckCircle2
                        className="h-4 w-4"
                        style={{ color: "var(--mod-lms)" }}
                      />
                    )}
                  </div>
                  <p className="text-[13px]">{topic.content_uz || "—"}</p>
                  {topic.confirmed_at && (
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {t("nazorat.confirmed_at")}: {topic.confirmed_at.substring(0, 10)}
                    </p>
                  )}
                </div>
                {!topic.confirmed_at && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => confirmMutation.mutate(topic.id)}
                    disabled={confirmMutation.isPending}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    {t("nazorat.confirm_btn")}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

**git add:** `artifacts/erp-dashboard/src/pages/LMSNazoratVaraqa.tsx`
**commit:** `feat(lms-p34): LMSNazoratVaraqa 12-topic per-confirm UI EP-LMS-031/034`

---

### Qadam 13 — LMSOnboarding.tsx: yaratish

**Fayl:** `artifacts/erp-dashboard/src/pages/LMSOnboarding.tsx`

```tsx
/**
 * @module LMSOnboarding
 * @description Onboarding workflow stepper sahifasi. DetailPage template.
 *   10-qadam vizual holat: locked/current/completed. EP-LMS-038/039/042/043.
 * @design EP Linear Soft — var(--mod-lms)
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import { CheckCircle2, Lock, GraduationCap, ChevronRight } from "lucide-react";
import { EPPageHeader, EPLoader, EPErrorState, EPEmptyState, EPStatusPill } from "@/components/ep";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useTranslation } from "@/lib/i18n";
import { useState } from "react";

type Step = {
  id: number; step_key: string; is_locked: boolean;
  completed_at: string | null; responsible_employee_id: number | null;
  note: string | null;
};

type Workflow = {
  id: number; status: string; employee_name?: string;
  card_name?: string; practical_end_date?: string;
  steps?: Step[];
};

const STEP_LABELS: Record<string, string> = {
  rd4_interview:      "RD-4 Suhbat",
  tx_instruction:     "TX Instruktaj",
  field_instruction:  "Maydon Instruktaj",
  practical_training: "2-Oy Amaliyot",
  theory_exam:        "Nazariy Imtihon",
  practical_exam:     "Amaliy Imtihon",
  rd4_conclusion:     "RD-4 Yozma Xulosa",
  order_issued:       "Mustaqil Buyruq",
  independent:        "Mustaqil Status",
};

export default function LMSOnboarding() {
  const { t } = useTranslation("lms");
  const { workflowId } = useParams<{ workflowId: string }>();
  const { toast } = useToast();
  const qc = useQueryClient();
  const qk = [`/api/lms/onboarding/${workflowId}`];
  const [noteMap, setNoteMap] = useState<Record<string, string>>({});

  const { data, isLoading, isError, refetch } = useQuery<Workflow>({ queryKey: qk });

  const completeMutation = useMutation({
    mutationFn: ({ stepKey, note }: { stepKey: string; note?: string }) =>
      apiRequest("PATCH", `/api/lms/onboarding/${workflowId}/step`, {
        stepKey,
        responsibleId: 0, // current user ID — real app'da auth context'dan
        note,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk });
      toast({ title: t("onboarding.step_completed") });
    },
    onError: () => toast({ title: t("Xatolik"), variant: "destructive" }),
  });

  const issueOrderMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/lms/onboarding/${workflowId}/issue-order`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk });
      toast({ title: t("onboarding.order_issued") });
    },
    onError: () => toast({ title: t("Xatolik"), variant: "destructive" }),
  });

  const steps: Step[] = Array.isArray(data?.steps) ? data!.steps : [];
  const activeStepIdx = steps.findIndex((s) => !s.completed_at && !s.is_locked);

  return (
    <div className="space-y-4 p-4 max-w-3xl mx-auto">
      <EPPageHeader
        title={t("onboarding.title")}
        subtitle={data?.employee_name ?? ""}
        icon={<GraduationCap style={{ color: "var(--mod-lms)" }} />}
      />

      {data && (
        <div className="flex flex-wrap gap-3 text-[13px] text-muted-foreground">
          <span>{t("onboarding.card")}: <b>{data.card_name ?? "—"}</b></span>
          {data.practical_end_date && (
            <span>{t("onboarding.practical_end")}: <b>{data.practical_end_date.substring(0, 10)}</b></span>
          )}
          <EPStatusPill tone="brand">{data.status}</EPStatusPill>
        </div>
      )}

      {isLoading ? (
        <EPLoader />
      ) : isError ? (
        <EPErrorState onRetry={() => refetch()} />
      ) : steps.length === 0 ? (
        <EPEmptyState icon={GraduationCap} title={t("onboarding.empty")} />
      ) : (
        <div className="space-y-3">
          {steps.map((step, idx) => {
            const isActive = idx === activeStepIdx;
            const isDone = !!step.completed_at;
            const isLocked = step.is_locked && !isDone;

            return (
              <div
                key={step.id}
                className={`rounded-lg border p-4 transition-colors ${
                  isDone
                    ? "border-green-200 bg-green-50/30"
                    : isActive
                    ? "border-[var(--mod-lms)] bg-blue-50/20"
                    : "border-border opacity-60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    {isDone ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : isLocked ? (
                      <Lock className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-5 w-5" style={{ color: "var(--mod-lms)" }} />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[13px] font-mono text-muted-foreground">
                        {idx + 1}/9
                      </span>
                      <span className="text-[14px] font-medium">
                        {STEP_LABELS[step.step_key] ?? step.step_key}
                      </span>
                    </div>
                    {isDone && step.completed_at && (
                      <p className="text-[12px] text-muted-foreground">
                        {t("onboarding.completed_at")}: {step.completed_at.substring(0, 10)}
                        {step.note ? ` · ${step.note}` : ""}
                      </p>
                    )}
                  </div>

                  {isActive && (
                    <div className="flex flex-col gap-2 items-end min-w-[180px]">
                      <Textarea
                        placeholder={t("onboarding.note_placeholder")}
                        className="text-[12px] h-16 resize-none"
                        value={noteMap[step.step_key] ?? ""}
                        onChange={(e) =>
                          setNoteMap((prev) => ({ ...prev, [step.step_key]: e.target.value }))
                        }
                      />
                      <Button
                        size="sm"
                        onClick={() =>
                          completeMutation.mutate({
                            stepKey: step.step_key,
                            note: noteMap[step.step_key],
                          })
                        }
                        disabled={completeMutation.isPending}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        {t("onboarding.complete_step")}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* HR mustaqil buyruq chiqarish */}
      {data?.status === "rd4_conclusion" && (
        <div className="rounded-lg border border-border p-4 bg-muted/30">
          <p className="text-[13px] mb-3">{t("onboarding.order_ready")}</p>
          <Button
            onClick={() => issueOrderMutation.mutate()}
            disabled={issueOrderMutation.isPending}
          >
            {t("onboarding.issue_order")}
          </Button>
        </div>
      )}
    </div>
  );
}
```

**git add:** `artifacts/erp-dashboard/src/pages/LMSOnboarding.tsx`
**commit:** `feat(lms-p34): LMSOnboarding stepper EP-LMS-038/039/042/043`

---

### Qadam 14 — i18n kalitlari qo'shish

**Fayl A:** `artifacts/erp-dashboard/src/locales/uz/lms.json`

Mavjud kalitlar O'CHIRILMAYDI. Oxiriga qo'shiladi:
```json
{
  "onboarding.title":          "Mustaqillik onboarding",
  "onboarding.empty":          "Onboarding topilmadi",
  "onboarding.step_completed": "Qadam bajarildi",
  "onboarding.order_issued":   "Mustaqil buyruq chiqarildi",
  "onboarding.card":           "Karta",
  "onboarding.practical_end":  "Amaliyot tugashi",
  "onboarding.completed_at":   "Bajarilgan",
  "onboarding.complete_step":  "Qadam bajarildi deb belgilash",
  "onboarding.note_placeholder":"Izoh (ixtiyoriy)...",
  "onboarding.order_ready":    "RD-4 xulosa tasdiqlandi. Mustaqil buyruq chiqarilishi mumkin.",
  "onboarding.issue_order":    "Mustaqil buyruq chiqarish",
  "onboarding.steps":          "Qadamlar",
  "nazorat.title":             "Nazorat varaqasi",
  "nazorat.confirm_btn":       "O'qib chiqdim",
  "nazorat.confirmed":         "Tasdiqlandi",
  "nazorat.confirmed_at":      "Tasdiqlangan vaqt",
  "nazorat.confirmed_topics":  "Tasdiqlangan mavzular",
  "nazorat.empty":             "Mavzular topilmadi",
  "mentor.qualify":            "Mentor malakasini tekshirish",
  "mentor.qualified":          "Malakali",
  "mentor.not_qualified":      "Malakasiz",
  "mentor.alternatives":       "Munosib mentorlar",
  "mentor.rating":             "Mentor reytingi",
  "kaizen.pdca":               "PDCA sikli",
  "kaizen.plan":               "P: Reja",
  "kaizen.do":                 "D: Bajar",
  "kaizen.check":              "C: Tekshir",
  "kaizen.act":                "A: Harakatlan",
  "kaizen.bonus_proposed":     "Taklif etilgan bonus",
  "kaizen.bonus_approved":     "Bonus tasdiqlandi",
  "independence.order":        "Mustaqil ish buyrug'i"
}
```

**Fayl B:** `artifacts/erp-dashboard/src/locales/ru/lms.json` — rus tarjimasini qo'sh:
```json
{
  "onboarding.title":          "Онбординг до самостоятельной работы",
  "onboarding.empty":          "Онбординг не найден",
  "onboarding.step_completed": "Шаг выполнен",
  "onboarding.order_issued":   "Приказ о самостоятельной работе выдан",
  "onboarding.card":           "Карта",
  "onboarding.practical_end":  "Окончание практики",
  "onboarding.completed_at":   "Выполнено",
  "onboarding.complete_step":  "Отметить шаг выполненным",
  "onboarding.note_placeholder":"Примечание (необязательно)...",
  "onboarding.order_ready":    "Заключение РД-4 подтверждено. Можно выдать приказ.",
  "onboarding.issue_order":    "Выдать приказ о самостоятельной работе",
  "onboarding.steps":          "Шаги",
  "nazorat.title":             "Контрольный лист",
  "nazorat.confirm_btn":       "Прочитал(а)",
  "nazorat.confirmed":         "Подтверждено",
  "nazorat.confirmed_at":      "Подтверждено в",
  "nazorat.confirmed_topics":  "Подтверждённые темы",
  "nazorat.empty":             "Темы не найдены",
  "mentor.qualify":            "Проверка квалификации ментора",
  "mentor.qualified":          "Квалифицирован",
  "mentor.not_qualified":      "Не квалифицирован",
  "mentor.alternatives":       "Подходящие менторы",
  "mentor.rating":             "Рейтинг ментора",
  "kaizen.pdca":               "Цикл PDCA",
  "kaizen.plan":               "P: Планируй",
  "kaizen.do":                 "D: Делай",
  "kaizen.check":              "C: Проверяй",
  "kaizen.act":                "A: Действуй",
  "kaizen.bonus_proposed":     "Предложенный бонус",
  "kaizen.bonus_approved":     "Бонус подтверждён",
  "independence.order":        "Приказ о самостоятельной работе"
}
```

**Fayl C:** `artifacts/erp-dashboard/src/locales/uz-cyr/lms.json` — lotin→kirill (deterministik):
```json
{
  "onboarding.title":          "Мустақиллик онбординг",
  "onboarding.empty":          "Онбординг топилмади",
  "onboarding.step_completed": "Қадам бажарилди",
  "onboarding.order_issued":   "Мустақил буйруқ чиқарилди",
  "onboarding.card":           "Карта",
  "onboarding.practical_end":  "Амалиёт тугаши",
  "onboarding.completed_at":   "Бажарилган",
  "onboarding.complete_step":  "Қадам бажарилди деб белгилаш",
  "onboarding.note_placeholder":"Изоҳ (ихтиёрий)...",
  "onboarding.order_ready":    "РД-4 хулоса тасдиқланди. Мустақил буйруқ чиқарилиши мумкин.",
  "onboarding.issue_order":    "Мустақил буйруқ чиқариш",
  "onboarding.steps":          "Қадамлар",
  "nazorat.title":             "Назорат варақаси",
  "nazorat.confirm_btn":       "Ўқиб чиқдим",
  "nazorat.confirmed":         "Тасдиқланди",
  "nazorat.confirmed_at":      "Тасдиқланган вақт",
  "nazorat.confirmed_topics":  "Тасдиқланган мавзулар",
  "nazorat.empty":             "Мавзулар топилмади",
  "mentor.qualify":            "Ментор малакасини текшириш",
  "mentor.qualified":          "Малакали",
  "mentor.not_qualified":      "Малакасиз",
  "mentor.alternatives":       "Муносиб менторлар",
  "mentor.rating":             "Ментор рейтинги",
  "kaizen.pdca":               "PDCA сикли",
  "kaizen.plan":               "P: Режа",
  "kaizen.do":                 "D: Бажар",
  "kaizen.check":              "C: Текшир",
  "kaizen.act":                "A: Ҳаракатлан",
  "kaizen.bonus_proposed":     "Таклиф этилган бонус",
  "kaizen.bonus_approved":     "Бонус тасдиқланди",
  "independence.order":        "Мустақил иш буйруғи"
}
```

**git add:** uchala i18n fayli ham
**commit:** `feat(lms-p34): i18n onboarding + mentor + kaizen + nazorat kalitlari`

---

## 5. DDL (GATED — egasi stampini kutadi)

**Fayl:** `apps/api/src/shared/db/migrations/lms-p3-onboarding-mentor-kaizen.sql`

```sql
-- APPROVED: _____________________ (egasi to'ldiradi)
-- P34 LMS onboarding workflow + mentor rating + kaizen PDCA columns
-- Wave 3, dependsOn P33 (lms_certificates, lms_enrollments, org_functions mavjud bo'lishi shart)
-- ISHGA TUSHIRISH: psql -U europrint -d europrint -f lms-p3-onboarding-mentor-kaizen.sql

-- ============================================================
-- BLOK 1: lms_onboarding_workflows
-- ============================================================
CREATE TABLE IF NOT EXISTS lms_onboarding_workflows (
  id                   SERIAL PRIMARY KEY,
  employee_id          INTEGER NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
  card_id              INTEGER NOT NULL REFERENCES org_functions(id) ON DELETE RESTRICT,
  mentor_employee_id   INTEGER NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
  rd4_manager_id       INTEGER NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
  started_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  practical_end_date   TIMESTAMPTZ NOT NULL, -- started_at + 60 kun (EP-LMS-040)
  status               VARCHAR(40) NOT NULL DEFAULT 'rd4_interview'
                         CHECK (status IN ('rd4_interview','tx_instruction',
                                           'field_instruction','practical_training',
                                           'theory_exam','practical_exam',
                                           'rd4_conclusion','order_issued','independent')),
  order_issued_by      INTEGER REFERENCES users(id) ON DELETE SET NULL,
  order_issued_at      TIMESTAMPTZ,
  updated_at           TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT lms_onboarding_wf_unique UNIQUE (employee_id, card_id, started_at)
);

CREATE INDEX IF NOT EXISTS idx_lms_onboarding_employee
  ON lms_onboarding_workflows(employee_id);
CREATE INDEX IF NOT EXISTS idx_lms_onboarding_mentor
  ON lms_onboarding_workflows(mentor_employee_id);
CREATE INDEX IF NOT EXISTS idx_lms_onboarding_status
  ON lms_onboarding_workflows(status);

-- ============================================================
-- BLOK 2: lms_onboarding_steps
-- ============================================================
CREATE TABLE IF NOT EXISTS lms_onboarding_steps (
  id                       SERIAL PRIMARY KEY,
  workflow_id              INTEGER NOT NULL
                             REFERENCES lms_onboarding_workflows(id) ON DELETE CASCADE,
  step_key                 VARCHAR(40) NOT NULL
                             CHECK (step_key IN ('rd4_interview','tx_instruction',
                                                 'field_instruction','practical_training',
                                                 'theory_exam','practical_exam',
                                                 'rd4_conclusion','order_issued','independent')),
  is_locked                BOOLEAN NOT NULL DEFAULT TRUE,
  responsible_employee_id  INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  completed_at             TIMESTAMPTZ,
  note                     TEXT,
  document_url             TEXT,
  CONSTRAINT lms_onboarding_step_unique UNIQUE (workflow_id, step_key)
);

CREATE INDEX IF NOT EXISTS idx_lms_onboarding_steps_workflow
  ON lms_onboarding_steps(workflow_id);

-- ============================================================
-- BLOK 3: lms_practical_exam_rubrics (EP-LMS-062)
-- ============================================================
CREATE TABLE IF NOT EXISTS lms_practical_exam_rubrics (
  id            SERIAL PRIMARY KEY,
  workflow_id   INTEGER NOT NULL
                  REFERENCES lms_onboarding_workflows(id) ON DELETE CASCADE,
  criterion_uz  VARCHAR(500) NOT NULL,
  score         SMALLINT NOT NULL DEFAULT 0 CHECK (score BETWEEN 0 AND 5),
  examiner_note TEXT,
  evaluated_by  INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  evaluated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lms_rubrics_workflow
  ON lms_practical_exam_rubrics(workflow_id);

-- ============================================================
-- BLOK 4: lms_mentor_ratings (EP-LMS-082)
-- ============================================================
CREATE TABLE IF NOT EXISTS lms_mentor_ratings (
  id             SERIAL PRIMARY KEY,
  mentor_id      INTEGER NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
  apprentice_id  INTEGER NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
  workflow_id    INTEGER NOT NULL
                   REFERENCES lms_onboarding_workflows(id) ON DELETE CASCADE,
  direction      VARCHAR(10) NOT NULL CHECK (direction IN ('bonus','deduction')),
  delta_points   INTEGER NOT NULL DEFAULT 0 CHECK (delta_points >= 0),
  status         VARCHAR(20) NOT NULL DEFAULT 'pending_hr'
                   CHECK (status IN ('pending_hr','approved','rejected')),
  hr_reviewer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lms_mentor_ratings_mentor
  ON lms_mentor_ratings(mentor_id);
CREATE INDEX IF NOT EXISTS idx_lms_mentor_ratings_status
  ON lms_mentor_ratings(status);

-- ============================================================
-- BLOK 5: kaizen_suggestions ALTER — PDCA + bonus ustunlari
-- (E6: mavjud jadvalga ALTER, DROP+CREATE emas — Q-46)
-- ============================================================
ALTER TABLE kaizen_suggestions
  ADD COLUMN IF NOT EXISTS card_id           INTEGER,
  ADD COLUMN IF NOT EXISTS response_text     TEXT,
  ADD COLUMN IF NOT EXISTS responded_by      INTEGER,
  ADD COLUMN IF NOT EXISTS responded_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pdca_plan         TEXT,
  ADD COLUMN IF NOT EXISTS pdca_do           TEXT,
  ADD COLUMN IF NOT EXISTS pdca_check        TEXT,
  ADD COLUMN IF NOT EXISTS pdca_act          TEXT,
  ADD COLUMN IF NOT EXISTS pdca_responsible_id INTEGER,
  ADD COLUMN IF NOT EXISTS pdca_due_date     DATE,
  ADD COLUMN IF NOT EXISTS impact_measured   BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS bonus_proposed    NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS bonus_approved_by INTEGER;

-- FK qo'shish (org_functions.id mavjud bo'lsa):
ALTER TABLE kaizen_suggestions
  ADD CONSTRAINT IF NOT EXISTS fk_kaizen_card
    FOREIGN KEY (card_id) REFERENCES org_functions(id) ON DELETE SET NULL;

-- ============================================================
-- VERIFY
-- ============================================================
SELECT 'lms_onboarding_workflows' AS tbl, COUNT(*) FROM lms_onboarding_workflows
UNION ALL
SELECT 'lms_onboarding_steps',     COUNT(*) FROM lms_onboarding_steps
UNION ALL
SELECT 'lms_practical_exam_rubrics', COUNT(*) FROM lms_practical_exam_rubrics
UNION ALL
SELECT 'lms_mentor_ratings',        COUNT(*) FROM lms_mentor_ratings
UNION ALL
SELECT 'kaizen_suggestions_pdca_check',
       COUNT(*) FILTER (WHERE pdca_plan IS NOT NULL) FROM kaizen_suggestions;
```

---

## 6. QABUL MEZONI

### Funksional tekshiruv (har biri jonli DB-proof talab qiladi)

- [ ] **K-1 Kaizen PDCA:** `POST /api/kaizen/{id}/pdca` → `pdca_plan/do/check/act` DB'ga yoziladi →
      `SELECT pdca_plan FROM kaizen_suggestions WHERE id={id}` — NULL emas.
- [ ] **K-2 Kaizen stats:** `GET /api/kaizen/stats` → `completed` count (eski `implemented` emas) to'g'ri.
- [ ] **K-3 Kaizen bonus:** `PATCH /api/kaizen/{id}/bonus/propose` → `bonus_proposed` yoziladi;
      `PATCH /api/kaizen/{id}/bonus/approve` → `bonus_approved_by` set.
- [ ] **W-1 Workflow yaratish:** `POST /api/lms/onboarding` → `lms_onboarding_workflows` va
      9 ta `lms_onboarding_steps` satri yaratiladi. DB: `SELECT COUNT(*) FROM lms_onboarding_steps WHERE workflow_id={id}` = 9.
- [ ] **W-2 Qadam bajarish:** `PATCH /api/lms/onboarding/{id}/step` `{stepKey:'rd4_interview'}` →
      `completed_at` set, keyingi qadam (`tx_instruction`) `is_locked=false` bo'ladi.
- [ ] **W-3 Qulf:** `rd4_interview` bajarilmay turib `tx_instruction` ga PATCH → `Qadam topilmadi` yoki `is_locked` xatosi.
- [ ] **M-1 Mentor malaka:** `POST /api/lms/mentor/qualify` malakasiz mentor → `{ qualified: false, alternatives: [...] }`.
- [ ] **M-2 Mentor malaka:** `POST /api/lms/mentor/qualify` malakali mentor → `{ qualified: true }`.
- [ ] **M-3 Mentor reyting:** Imtihon o'tgach `POST /api/lms/mentor/rating` `{examPassed:true}` →
      `lms_mentor_ratings` da `direction='bonus'` satr.
- [ ] **O-1 Mustaqil buyruq:** `workflow.status='rd4_conclusion'` bo'lgan workflow uchun
      `POST /api/lms/onboarding/{id}/issue-order` → status `order_issued`.
- [ ] **FE-1 Ta'lim tab:** CardDetailDialog'da Ta'lim tab ochilganda `enrollments` + `certs` so'rovlari chaqiriladi.
- [ ] **FE-2 Nazorat varaqasi:** `PATCH /api/lms/nazorat-varaqa/{id}/topics/{topicId}/confirm` →
      `confirmed_at` set → progress bar yangilanadi (round-trip).
- [ ] **FE-3 Onboarding stepper:** Locked qadamlar kulrang + Lock icon; faol qadam tugma bilan.
- [ ] **FE-4 i18n:** `uz`, `ru`, `uz-cyr` da yangi kalitlar `t('onboarding.title')` to'g'ri qiymat qaytaradi.

### Texnik tekshiruv
- [ ] BE `tsc 0` — `pnpm --filter @europrint/api run typecheck`
- [ ] FE `tsc 0` — `pnpm --filter erp-dashboard run typecheck`
- [ ] `bash scripts/reviewer-result-pattern.sh` — yangi fayllarda FAIL = 0
- [ ] `bash scripts/reviewer-array-safety.sh` — FAIL = 0
- [ ] `bash scripts/reviewer-jwt-guard.sh` — yangi controller'lar guard bilan himoyalangan
- [ ] Golden thread regressiya yo'q: `GET /api/lms/courses` va mavjud endpoint'lar 200 qaytaradi

### Vizyon moslik
- [ ] Ta'lim tab: karta asosiy (E2), xodim ikkilamchi — enrollments `card_id` orqali filtrlanadi.
- [ ] Mustaqil buyruq: HR inson tasdiqlaydi (E1) — avtomatik emas.
- [ ] Mentor reyting: HR uchun TAKLIF (E1) — `status='pending_hr'`.
- [ ] PayrollService GL path TEGILMAGAN (scope tashqarida).

---

## 7. SELF-VERIFY

Har qadam bajarilgach quyidagi komandalarni ishga tushir:

```bash
# 1. Backend typecheck
pnpm --filter @europrint/api run typecheck
# Kutilgan natija: 0 error

# 2. Frontend typecheck
pnpm --filter erp-dashboard run typecheck
# Kutilgan natija: 0 error

# 3. Result<T> pattern
bash scripts/reviewer-result-pattern.sh
# Kutilgan: FAIL = 0

# 4. Array safety
bash scripts/reviewer-array-safety.sh
# Kutilgan: FAIL = 0

# 5. JWT Guard
bash scripts/reviewer-jwt-guard.sh
# Kutilgan: yangi controller'lar ro'yxatda

# 6. Kaizen stats bug to'g'irlandimi?
# API server ishlab tursa:
curl -H "Authorization: Bearer $TOKEN" http://localhost:3030/api/kaizen/stats
# "completed" kalit ko'rinishi kerak (eski "implemented" emas)

# 7. Onboarding workflow yaratish (DDL approved + migrated bo'lsa):
curl -s -X POST http://localhost:3030/api/lms/onboarding \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"employeeId":1,"cardId":1,"mentorEmployeeId":2,"rd4ManagerId":3}'
# Kutilgan: { "workflowId": <N> }

# 8. Onboarding steps soni tekshirish (psql):
# psql -U europrint -d europrint -c "SELECT COUNT(*) FROM lms_onboarding_steps WHERE workflow_id=<N>;"
# Kutilgan: 9

# 9. Qadam bajarish:
curl -s -X PATCH http://localhost:3030/api/lms/onboarding/<N>/step \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"stepKey":"rd4_interview","responsibleId":3,"note":"RD-4 suhbat o'\''tdi"}'
# Kutilgan: { "nextStep": "tx_instruction" }

# 10. Keyingi qadam qulfi tekshirish (psql):
# SELECT step_key, is_locked, completed_at FROM lms_onboarding_steps WHERE workflow_id=<N> ORDER BY id;
# rd4_interview: completed_at=NOW, is_locked=false
# tx_instruction: is_locked=false (ochilgan)
# boshqalar: is_locked=true

# 11. Mentor qualify tekshirish:
curl -s -X POST http://localhost:3030/api/lms/mentor/qualify \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"mentorId":999,"cardId":1}'
# Kutilgan: { "qualified": false, "reason": "EP-LMS-057:...", "alternatives": [...] }

# 12. Kaizen PDCA (mavjud suggestion bilan):
curl -s -X PATCH http://localhost:3030/api/kaizen/1/pdca \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"pdcaPlan":"Muammo: ishlab chiqarish chiqindisi 5%","pdcaDo":"Yangi kontrol nuqta joriy etildi"}'
# Kutilgan: { "id":1, "pdca_plan":"Muammo:...", ... }

# 13. FE build tekshirish
pnpm --filter erp-dashboard run build
# Kutilgan: 0 error, bundle success
```

---

## 8. COMMIT

### Commit tartibi (har qadam alohida commit)

```bash
# Qadam 1 — DDL GATED
git add apps/api/src/shared/db/migrations/lms-p3-onboarding-mentor-kaizen.sql
git commit -m "feat(lms-p34): DDL lms_onboarding_workflows+steps+rubrics+mentor_ratings+kaizen-pdca [GATED] EP-LMS-030/038/039/040/042/082"

# Qadam 2 — Kaizen schema
git add lib/db/src/schema/kaizen-schema.ts
git commit -m "feat(lms-p34): kaizen-schema PDCA+bonus+card_id cols EP-LMS-020/021/022"

# Qadam 3+4 — Kaizen repo + service (drift fix ichida)
git add apps/api/src/modules/director/infrastructure/repositories/kaizen.repository.ts
git add apps/api/src/modules/director/application/kaizen.service.ts
git commit -m "fix(lms-p34): kaizen repo drift fix updateSuggestion+getStats + PDCA+bonus methods"

# Qadam 5 — Onboarding service
git add apps/api/src/modules/lms/application/services/lms-onboarding.service.ts
git commit -m "feat(lms-p34): LmsOnboardingService sequential lock EP-LMS-038/039/043"

# Qadam 6 — Onboarding repo
git add apps/api/src/modules/lms/infrastructure/repositories/drizzle-lms-onboarding.repo.ts
git commit -m "feat(lms-p34): DrizzleLmsOnboardingRepo Result<T> all methods"

# Qadam 7 — Mentor service + repo
git add apps/api/src/modules/lms/application/services/lms-mentor.service.ts
git add apps/api/src/modules/lms/infrastructure/repositories/drizzle-lms-mentor.repo.ts
git commit -m "feat(lms-p34): LmsMentorService+repo qualify+two-way-rating EP-LMS-057/082"

# Qadam 8 — Independence order service
git add apps/api/src/modules/lms/application/services/lms-independence-order.service.ts
git commit -m "feat(lms-p34): LmsIndependenceOrderService HR approval EP-LMS-043"

# Qadam 9 — Controllers
git add apps/api/src/modules/lms/presentation/lms-onboarding.controller.ts
git add apps/api/src/modules/lms/presentation/lms-mentor.controller.ts
git commit -m "feat(lms-p34): lms-onboarding+mentor controllers /api/lms/onboarding /api/lms/mentor"

# Qadam 10 — FE LMS tab
git add artifacts/erp-dashboard/src/components/hr/org/CardDetailDialog-lms-tab.tsx
git commit -m "feat(lms-p34): CardLmsTab enrollments+onboarding+certs E2 card-centric"

# Qadam 11 — LMSCourseList
git add artifacts/erp-dashboard/src/pages/LMSCourseList.tsx
git commit -m "feat(lms-p34): LMSCourseList page ListPage template"

# Qadam 12 — LMSNazoratVaraqa
git add artifacts/erp-dashboard/src/pages/LMSNazoratVaraqa.tsx
git commit -m "feat(lms-p34): LMSNazoratVaraqa 12-topic per-confirm EP-LMS-031/034"

# Qadam 13 — LMSOnboarding
git add artifacts/erp-dashboard/src/pages/LMSOnboarding.tsx
git commit -m "feat(lms-p34): LMSOnboarding stepper locked/unlocked EP-LMS-038/039/042/043"

# Qadam 14 — i18n
git add artifacts/erp-dashboard/src/locales/uz/lms.json
git add artifacts/erp-dashboard/src/locales/ru/lms.json
git add artifacts/erp-dashboard/src/locales/uz-cyr/lms.json
git commit -m "feat(lms-p34): i18n uz+ru+uz-cyr onboarding+mentor+kaizen+nazorat kalitlari"
```

### TAQIQLANGAN
```bash
# HECH QACHON qilma:
git add -A                           # supurib ketadi
git add .                            # supurib ketadi
git commit --amend                   # tarix buziladi
psql ... -f lms-p3-onboarding-mentor-kaizen.sql  # APPROVED: stampsiz
```

### SCOPE FLAG'lar (egasidan ruxsat kutilmoqda)
1. `lms.module.ts` — yangi provider/controller'larni ro'yxatga olish uchun.
2. `CardDetailDialog.tsx` — 9-tab "Ta'lim" qo'shish uchun.

Bu ikki faylga tegishdan OLDIN egasidan Q-28 ruxsatini ol.

---

> **Holat hisoboti (har commit'dan keyin Uzbekcha yoz):**
> "Bajarildi: [nima] · Deferred: [nima] · Commit: [hash] · tsc: [0/xato] · DB-proof: [ha/yo'q]"

---

## 9. P34 ENFORCEMENT DARVOZALARI VA MOSLIK AUDITI DEFER RO'YXATI

> ⚠️ Bu bo'lim 2026-06-19 moslik auditi (00-INTERVYU-MOSLIK.md §2 LMS + §3-F) natijasida
> qo'shildi. P33 ning §9 bilan juft holda o'qiling.

---

### 9.1 P34 Holatidagi Enforcement Darvozalari

| Darvoza | P34 da holati | Izoh |
|---------|--------------|------|
| Onboarding ketma-ket qulf (EP-LMS-038) | ✅ WIRED | `LmsOnboardingService.completeStep()` → `unlockStep()` zanjiri real ishlaydi. Qadam bajarilmay keyingisi ochilmaydi. |
| HR mustaqil buyruq (E1, EP-LMS-043) | ✅ WIRED | `LmsIndependenceOrderService.issueOrder()` HR `user_id` talab qiladi — avtomatik emas. |
| Mentor malaka tekshiruvi (EP-LMS-057) | ✅ WIRED | `LmsMentorService.qualifyMentor()` → razryad + sertifikat ikki tekshiruv, malakasiz mentor bloklanadi. |
| Ikki tomonlama mentor reytingi (EP-LMS-082) | ✅ WIRED (E1) | `recordMentorRating()` → `status='pending_hr'` — HR tasdiqlash kutadi, avtomatik emas. |
| Kaizen PDCA (EP-LMS-020/021/022) | ✅ WIRED | `updatePdca()` + `proposeBonus()` + `approveBonus()` real DB yozadi. |
| 3-shart completion (EP-LMS-070) | ❌ DEFER | P33 §9.1 ga qarang — P3-fazaga qoldirilgan. |
| PayrollService wiring (EP-LMS-002) | 🔶 QISMAN | P33 §9.2 ga qarang — `LmsPayrollGateService` eksport qilingan, import P34 scope dan tashqari. |
| MES canStart (EP-LMS-004/044) | ❌ DEFER | P33 §9.3 ga qarang — MES paketiga qoldirilgan. |
| Micro-modul ketma-ket qulf | ❌ DEFER | P33 §9.4 ga qarang. |
| Karta-transfer re-enroll | ❌ DEFER | P33 §9.5 ga qarang. |
| Sertifikat expiry (EP-LMS-018) | ❌ DEFER | P33 §9.6 ga qarang. |

---

### 9.2 P34 FE Enforcement Muhimligi

**FE tarafdan bloklanish ko'rinishi (UX):**

P34 FE komponentlari (`LMSOnboarding.tsx`, `CardDetailDialog-lms-tab.tsx`) hozir
API javobini ko'rsatadi. Quyidagi UX darvozalari BE dan keluvchi ma'lumotga bog'liq:

1. **Onboarding locked qadam:** `step.is_locked = true` → FE Lock icon + tugma yo'q.
   ✅ `LMSOnboarding.tsx:1643` da `isLocked` holatida tugma render qilinmaydi.

2. **Enrollment status rangi:** `status='overdue'` → qizil `EPStatusPill`.
   ✅ `CardDetailDialog-lms-tab.tsx` `STATUS_TONE` xaritalash to'g'ri.

3. **3-shart completion BE tomonidan bajarilgunicha** (DEFER): FE enrollment
   `status='completed'` ga faqat BE yozganda o'tadi — FE tarafdan majburiylik yo'q.
   Xodim "Bajarildi" tugmasini ko'rmaydi chunki bu P33 da endpoint mavjud emas.

4. **Oylik blok FE ko'rinishi (❌ DEFER):** `LMSCourseList.tsx` va `CardLmsTab` da
   `is_blocked` belgisi ko'rsatilmaydi — BE wiring bo'lgandan keyin qo'shiladi.
   > **Kelgusi FE vazifa:** `enrollment.salary_blocked: boolean` maydonini API javobiga
   > qo'shish va `EPStatusPill tone="error"` bilan ko'rsatish.

5. **MES bloki FE ko'rinishi (❌ DEFER):** `blocks_mes=true` bo'lgan kurslar uchun
   alohida ogohlantirish belgisi ko'rsatilmaydi hozir.
   > **Kelgusi FE vazifa:** Kurs kartoчкasida `blocks_mes` true bo'lsa
   > `<EPStatusPill tone="warning">MES blok</EPStatusPill>` qo'shish.

---

### 9.3 Kaizen Bonus "Sozlanadigan" Qiymat Eslatmasi

> **⚠️ EGASI QIYMATI KERAK — hardcode taqiq (00-INTERVYU-MOSLIK.md §4-C):**
>
> `LmsMentorService.recordMentorRating()` da `deltaPoints` parametri chaqiruvchi tomonidan
> uzatiladi. Bu qiymat qayerdan kelishi kerak:
>
> - Agar `deltaPoints` FE dan to'g'ridan kiritilsa — bu hardcode xavfi.
> - **To'g'ri yondashuv:** `lms_config` yoki `hr_payroll_config` kabi master-data jadvalida
>   `mentor_bonus_delta` va `mentor_deduction_delta` qatorlari bo'lishi kerak.
> - **Hozir:** `deltaPoints` controller `RatingSchema` da `z.number().int().nonnegative()`
>   — ya'ni har qanday son qabul qilinadi. Egasi raqamini belgilaguncha bu maqbul.
> - **Kelgusi:** Master-data jadvalidan o'qib `deltaPoints` ni server tarafda belgilash.

---

### 9.4 Moslik Auditi Xulosasi (P34 uchun)

> **Manba:** `docs/audit/MASSIV-50/00-INTERVYU-MOSLIK.md` §2 LMS + §3-F
>
> - ✅ WIRED (P34 tomonidan): Onboarding 9-qadam ketma-ket, HR mustaqil buyruq (E1),
>   mentor malaka darvozasi, ikki-tomonlama reyting (E1 HR-tasdiq), kaizen PDCA CRUD
> - 🔶 QISMAN: PayrollService wiring (eksport bor, import deferred), 3-shart completion
>   FE side deferred to BE enforcement
> - ❌ DEFER (aniq yozildi §9.1 jadvalda): MES canStart, micro-modul qulf,
>   karta-transfer re-enroll, sertifikat expiry, blok FE ko'rinishi, MES blok FE ko'rinishi
> - **Umumiy hukm:** P34 asosiy onboarding va mentor enforcement darvozalari WIRED.
>   Qolgan deferlar P33 §9 da batafsil yozilgan, P34 ularga havola beradi.

