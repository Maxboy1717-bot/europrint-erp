# FAZA 07 — Darslik / LMS kartaga (EP-ORG-027 / 028 / 029 / 088 / 116 / 122 / Q552 / Q562)

> **BAJARUVCHI:** Muslimbek. **ROL:** 🟢 Bajaruvchi (ruxsat darvozasi, Qoida 23).
> **MANBA-REJA:** `docs/audit/MASSIV-100/00-MASTER-REJA.md` (FAZA 07 satr 100-105).
> **BO'SHLIQ-MANBA:** `docs/audit/ORGSXEMA-INTERVYU-VS-HOLAT-2026-06-25.md` (mavzu "darslik" = **20%**, satr 16, 276-295).
> **SPEC:** `docs/audit/decisions/01-org-kartalar.md` (EP-ORG-027/028/029/088/091/116/122/129).
> **BOG'LIQLIK:** FAZA 0 (org_departments yagona karta + FK re-point), FAZA 1 (employee_cards M:N), FAZA 4 (payroll kartaga ulangan). **Bu faza Faza 4 ochgan oylik-gate chaqirish nuqtasiga ulanadi.**
> **Q-47:** Bu direktiva ≥1000 qator — to'liq, batafsil, noaniqliksiz.

---

## § 0. MUNDARIJA

1. Kontekst + maqsad
2. Qoidalar-bloki (cross-cutting, MAJBURIY)
3. Joriy holat (fayl:satr + DB-fakt — JONLI tasdiqlangan)
4. Bosqichma-bosqich ijro (B1–B9)
5. DB migration (APPROVED SQL)
6. Zod / Result / Drizzle namunalari
7. FE + dizayn (EP token/shablon/komponent)
8. Qabul-mezoni
9. Edge-holatlar
10. Self-verify (tsc + rollback-tx DB-proof + jonli isbot)
11. Owner-DATA reestri
12. Commit tartibi

---

## § 1. KONTEKST + MAQSAD

### 1.1 Vizyon (egasi)
EP-ORG-027/028 (decisions/01, satr 197-209):
- **EP-ORG-027:** "Karta darsligi tugamaguncha o'sha karta oyligi to'xtaydi" (LMS → Payroll gate).
- **EP-ORG-028:** "Darslik **kartaga** biriktiriladi (xodimga emas); xodim almashsa ham qoladi."
- **EP-ORG-088:** "Darslik kartaga bog'lanadi; xodim kelganda darslikni ko'radi" (avto-ko'rinish).
- **EP-ORG-116:** Onboarding davrida kartaga **mentor** biriktiriladi.
- **EP-ORG-122:** Karta "talab qilinadigan domen-bilim" ro'yxatiga ega; LMS darsligi shunga bog'lanadi.
- **Q552:** Karta arxivlanganda yarim darslik progress muzlatiladi; voris boshidan oladi.
- **Q562:** Universal kurs bir kartada tugatilsa boshqa kartaga "bajarildi" (cross-card credit) — `lms_cross_card_credits` jadval.

### 1.2 Markaziy printsip
**Darslik = KARTA atributi, xodim emas.** Bugun ERP'da darslik xodimga (enrollment) biriktiriladi, kartaga emas. Vizyon: kurs `org_departments` (kanonik karta, Faza 0) kartasiga `card_id` bilan bog'lanadi; xodim shu kartaga `employee_cards` orqali kelganda — kursni AVTO oladi (enrollment); kurs (3-shartli gate) tugamaguncha — o'sha karta oyligi gate'da to'xtaydi (Faza 4 payroll).

### 1.3 Bu fazaning maqsadi (MEXANIZM 100%, Q2)
1. **Kurs↔karta bind** — `courses.card_id` ustuni (BOR) ni real ishlatuvchi to'liq oqim: bind/unbind endpoint + by-card list + FE "Darslik" tab kartada (`OrgNodeDetail`).
2. **Avto-biriktirish** — xodim kartaga `employee_cards` orqali ulanganda (Faza 1 `assignUser`), o'sha kartaning barcha `card_id` kurslariga avto-enroll (`CardEmployeeAssignedEvent` listener).
3. **Oylik-gate ulanish** — `LmsCompletionService` (PURE gate, BOR) ga **DB-tomonli** wrapper (`LmsCardGateService`) yoziladi: kartaning kurslari tugaganmi? Faza 4 payroll handler shu wrapper'ni chaqiradi ("DO NOT touch payroll" izohi Faza 4'da olib tashlanadi — bu fazada FAQAT gate-funksiya tayyorlanadi va ulanish nuqtasi ochiladi).
4. **Mentor** — `lms_card_mentors` jadval (kartaga mentor) + assign/revoke endpoint.
5. **Skill-matrix bog'lanish** — kurs tugaganda `employee_skills`ga avto-yozuv (gap-analysis manbasi).
6. **Cross-card-credit** — `lms_cross_card_credits` jadval (Q562) — universal kurs bir kartada tugaganda boshqa kartaga kredit.

### 1.4 Bu faza NIMA QILMAYDI (ko'lam chegarasi, Q-36 yaxlit lekin chegaralangan)
- ❌ Payroll handler ichidagi hisob-kitobni o'zgartirmaydi — bu **Faza 4** ishi. Bu faza FAQAT `LmsCardGateService.isCardTrainingComplete(cardId, employeeId)` ni quradi va export qiladi.
- ❌ Razryad imtihon oqimini (EP-ORG-010/SPEC-6) qurmaydi — bu **Faza 3**.
- ❌ AI darslik-tekshirish (EP-ORG-029 "AI tekshiradi") — bu **Faza 10** (AI-kalit gated). Bu fazada FAQAT 3-bosqichli **inson** tasdiq (o'quv bo'limi → HR → rahbar) struktura-darvozasi.
- ❌ Glossariy/domen-bilim to'liq UI (EP-ORG-129) — STRUKTURA quriladi (jadval + endpoint), boy UI keyingi pass.

---

## § 2. QOIDALAR-BLOKI (CROSS-CUTTING — HAR BOSQICHDA MAJBURIY)

> Manba: `00-MASTER-REJA.md` §2 + `CLAUDE.md` Qoida A,B,1-23 + Q-24..Q-47.

### 2.1 Kod uslubi
- **Result<T>** — har repo/service metodi `Promise<Result<T>>` (CLAUDE.md Qoida 1). `throw`/`return null` TAQIQ. Import: `@common/result` (`AppErr, Err, Ok, Result`).
- **Zod** — har `@Body()` Zod schema bilan validate (Qoida 3). `class-validator` TAQIQ.
- **Drizzle** — oddiy CRUD Drizzle ORM; raw SQL faqat murakkab + izoh (Qoida 4). Mavjud LMS repo `sql\`...\`` ishlatadi (parametrli — SQL-injection xavfsiz, Qoida B); yangi kod imkon qadar Drizzle `db.select().from()`.
- **Fayl ≤900 qator, funksiya ≤150** (Qoida 13).
- **Konstantalar** — threshold/foiz `lms-completion.constants.ts`ga (Qoida 12) — hardcode TAQIQ.

### 2.2 Regress-himoya (Q-39 / Q-46) 🔴
- **Ishlab turgan + to'g'ri kod O'CHMAYDI.** `LmsCompletionService.evaluate()` PURE gate — JONLI ishlaydi, testi bor (`test/lms/lms-completion.service.spec.ts`). **TEGMA** — faqat ustiga DB-wrapper qo'shasan.
- Mavjud `findCoursesByCard` / `setCourseCard` / `by-card/:cardId` / `:id/card` endpointlar JONLI (drizzle-lms.repo.ts:98-121, lms-courses.controller.ts:79-158) — **O'CHIRMA, KENGAYTIR.** Bular Faza 0'dan oldin yozilgan va izohda "logical ref to org_functions.id" deydi — bu fazada `org_departments.id` ga qayta-yo'naltiriladi (FK Faza 0'da qo'yiladi).
- **Buzuq/o'lik/dublikat TO'LIQ o'chiriladi** (chala emas). O'chirishdan oldin: (a) Q-29 verify ishlamasligini tasdiqla, (b) import-yo'qligini `grep` bilan tekshir.

### 2.3 Fabrikatsiya TAQIQ (Q-40 / Q2) 🔴
- DATA yo'q (kurs↔karta = 0/5) → **STRUKTURA + GATE** qur, egasi-DATA ro'yxatiga yoz (§11). **SOXTA qiymat YOZMA.**
- "Yashil lekin noto'g'ri" (echo/hardcoded/fake-create) TAQIQ. Forma REAL saqlaydi (Q-43): FE mutation → BE endpoint → real INSERT/UPDATE → DB → qayta-yuklashda ko'rinadi.

### 2.4 Verify (Q-29 / Q-32 / Q-40)
Har bosqich oxiri:
1. `tsc` GREEN (o'z fayllarda 0 xato).
2. END-TO-END **rollback-tx DB-proof** (`_audit/bproof-*.cjs`: kirit → oqdi → ko'rindi → ROLLBACK).
3. Jonli isbot (server :3030 + login + curl). Server tushsa (Q-44 Windows nest-watch) → static fallback (tsc + DB-proof), jonli keyin.

### 2.5 Dizayn (Q3 / Qoida 21/41/42/43)
- EP token `var(--ep-*)` / `var(--mod-*)`; xom rang (`#fff`, `rgba(...)`) / inline-style TAQIQ.
- Yangi tab = mavjud shablon + props; OrgNodeDetail tab-strukturasidan keladi (≤2 daraja tab, Qoida 42).
- Komponent manbasi: `src/components/ep/`, `src/components/ui/`.
- Pre-commit: `scripts/check-design-tokens.mjs` (inline xom rang BLOK).

### 2.6 Migration (Q-35)
- `migrations-drift.ts` (yoki yangi `apps/api/src/shared/db/migrations/`) idempotent: `CREATE TABLE IF NOT EXISTS`, `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`.
- `CREATE TABLE` / `DROP` faqat `-- APPROVED:` izoh bilan.

### 2.7 Commit (Qoida 23 / GIT_QOIDALARI)
- Faqat o'z fayl: `git add <aniq-fayl>` — **HECH QACHON `git add -A`/`.`**.
- `git commit --no-verify` (sabab bilan, agar pre-commit bloklasa).
- Har commit oxirida: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

### 2.8 KARTA atamasi
Muloqotda doim **"karta"** (node/tugun/lavozim EMAS). Kod izohlarida ham "card" / "karta".

---

## § 3. JORIY HOLAT (fayl:satr + DB-fakt — JONLI TASDIQLANGAN)

> Barchasi `node _audit/q.cjs "..."` va Read/Grep bilan tekshirildi (2026-06-25). TAXMIN YO'Q.

### 3.1 Backend — mavjud (ishlaydi, TEGMA / KENGAYTIR)

| Fayl:satr | Nima | Holat |
|---|---|---|
| `apps/api/src/modules/lms/application/services/lms-completion.service.ts:118-256` | `LmsCompletionService.evaluate()` — PURE 3-shartli gate (C1 nazariy, C2 amaliy, C3 mavzu-tasdiq). Result<T>, testlangan. | ✅ JONLI, PURE. Izoh satr 16: "DO NOT touch PayrollService here". TEGMA. |
| `lms-completion.service.ts:265-267` | `static defaultThreshold(courseType)` — TX=100%, general=70%. | ✅ JONLI. |
| `application/constants/lms-completion.constants.ts:1-55` | Threshold konstantalar (`LMS_GENERAL_PASS_THRESHOLD_PCT=70`, `LMS_TX_PASS_THRESHOLD_PCT=100`, `LMS_TOPIC_CONFIRM_REQUIRED_FRACTION=1.0`, `LMS_MIN_TOPIC_COUNT=1`). | ✅ JONLI. Yangi konstanta shu yerga. |
| `infrastructure/repositories/drizzle-lms.repo.ts:98-109` | `findCoursesByCard(cardId)` — `SELECT * FROM courses WHERE card_id = ${cardId}`. | ✅ JONLI. |
| `drizzle-lms.repo.ts:112-121` | `setCourseCard(id, cardId)` — `UPDATE courses SET card_id`. | ✅ JONLI (bind/unbind). |
| `drizzle-lms.repo.ts:85-95` | `saveCourse()` — INSERT `card_id` bilan. | ✅ JONLI. |
| `drizzle-lms.repo.ts:19-31` | `mapCourse()` — `card_id` map qiladi. | ✅ JONLI. |
| `presentation/lms-courses.controller.ts:79-84` | `GET lms/courses/by-card/:cardId`. | ✅ JONLI (route :id'dan oldin). |
| `lms-courses.controller.ts:151-158` | `PATCH lms/courses/:id/card` — `LmsSetCourseCardSchema`. | ✅ JONLI. |
| `lms-courses.controller.ts:177-192` | `POST lms/courses/enroll` → `EnrollCourseCommand`. | ✅ JONLI. |
| `application/commands/enroll-course.handler.ts:33-62` | `EnrollCourseHandler` — duplicate-check + `saveEnrollment` + emit `lms.course.enrolled`. | ✅ JONLI. |
| `dto/lms.dto.ts:21-24` | `LmsSetCourseCardSchema = { cardId: number.nullable() }`. | ✅ JONLI. |
| `dto/lms.dto.ts:8-17` | `LmsCreateCourseSchema` — `cardId` optional. | ✅ JONLI. |
| `lms.module.ts:110-116` | LmsModule — `LmsCompletionService` REGISTRATSIYA QILINMAGAN (providers ro'yxatida YO'Q). | ⚠️ Qo'shilishi kerak (B3). |

### 3.2 Backend — YO'Q (quriladi)

| Nima | Dalil (grep/q.cjs) |
|---|---|
| `LmsCardGateService` (DB-wrapper gate) | grep = 0; PURE service'ni DB'ga ulovchi yo'q. |
| `CardEmployeeAssignedEvent` listener (avto-enroll) | grep "auto-enroll/CardEmployeeAssigned" lms = 0. |
| `lms_card_mentors` jadval | `to_regclass('lms_card_mentors')` = NULL. |
| `lms_cross_card_credits` jadval (Q562) | `to_regclass('lms_cross_card_credits')` = NULL. |
| `card_required_knowledge` (EP-ORG-122 domen-bilim) | grep "required_knowledge/domain" card = 0. |
| 3-bosqichli kurs tasdiq (EP-ORG-029) | `courses` da `approval_status` ustuni YO'Q. |
| FE "Darslik" tab `OrgNodeDetail`da | `OrgNodeDetail.tsx:120-139` tabs: main/razryad/employees/children/vacant/folder/stats/portret/history — **darslik YO'Q**. |

### 3.3 DB-faktlar (JONLI)

```
courses_total = 5
courses_with_card (card_id IS NOT NULL) = 0      ← EGASI-DATA (§11)
enrollments_total = 15
courses.card_id = integer (BOR)
courses.title_uz = varchar, courses.is_active = boolean, courses.passing_score = numeric,
courses.duration_hours = integer, courses.is_mandatory = boolean, courses.updated_at = timestamp
courses.course_type ustuni = YO'Q  ← defaultThreshold uchun 'category' yoki yangi ustun kerak
enrollments cols = id, employee_id, course_id, enrolled_at, started_at, completed_at,
   progress_percent, last_accessed_at, status, current_module_id, current_lesson_id,
   created_at, updated_at, user_id, score, certificate_expires_at
lms_test_attempts = BOR (id, user_id, test_id, course_id, score, passed, created_at)   ← C1 manbasi
course_progress = BOR (id, user_id, lesson_id, course_id, video_position, completed, completed_at, ...) ← C3 manbasi
mentors = BOR (lekin org-kartaga bog'lanmagan, 0 qator)
skill_catalog / employee_skills / position_skill_requirements = BOR  ← skill-matrix
employee_cards cols = id, employee_id, card_id, is_primary, is_active, assigned_at, ended_at,
   created_at, updated_at, is_acting, acting_supplement   ← Faza 1 M:N link
org_departments: razryad_level_id, salary_type, max_salary, min_salary = BOR (Faza 4 payroll manbasi)
razryad_levels: id, level, coefficient, salary_min, salary_max, exam_type, ... = BOR
lms_cross_card_credits = YO'Q (Q562 quriladi)
lms_card_mentors = YO'Q (EP-ORG-116 quriladi)
```

### 3.4 FE — mavjud

| Fayl | Holat |
|---|---|
| `artifacts/erp-dashboard/src/pages/Courses.tsx` | ✅ JONLI; EP komponentlar (`EPPageHeader/EPLoader/EPErrorState` satr 30), `apiRequest`, `useMutation` deleteMutation (satr 100). |
| `artifacts/erp-dashboard/src/pages/LMSDashboard.tsx` | ✅ JONLI; `useQuery`/`useMutation`, `EPPageHeader`, ModulePage. card_id chaqiruvi YO'Q. |
| `artifacts/erp-dashboard/src/components/AssignCourseDialog.tsx` | ✅ JONLI (xodimga enroll dialog). |
| `artifacts/erp-dashboard/src/pages/OrgNodeDetail.tsx:120-139` | ✅ JONLI; 9 tab; "Darslik" tab YO'Q (B7'da qo'shiladi). |
| `artifacts/erp-dashboard/src/components/hr/orgnode/FolderTab.tsx` | ✅ JONLI namuna (kartaga bog'liq tab pattern). |

---

## § 4. BOSQICHMA-BOSQICH IJRO (B1–B9)

> Har bosqich: **fayl · OLDIN · KEYIN · sabab.** Har bosqich oxirida tsc + commit.
> **TARTIB MAJBURIY** (bog'liqlik): B1(migration) → B2(repo) → B3(gate-service) → B4(controller bind) → B5(avto-enroll listener) → B6(mentor) → B7(FE tab) → B8(cross-card) → B9(skill-matrix).

---

### B1 — DB migration (jadval + ustun) — APPROVED

**FAYL:** `apps/api/src/shared/db/migrations/phase07-lms-card.sql` (YANGI) + `migrations-drift.ts`ga idempotent blok.

**Nima qo'shiladi:**
1. `courses.course_type` ustun (TX/safety threshold tanlash uchun) — `ADD COLUMN IF NOT EXISTS`.
2. `courses.approval_status` + `courses.approved_by` + `courses.approved_at` (EP-ORG-029 3-bosqich) — `ADD COLUMN IF NOT EXISTS`.
3. `enrollments.card_id` ustun (qaysi karta orqali avto-enroll bo'lgani — Q599 tarix) — `ADD COLUMN IF NOT EXISTS`.
4. `enrollments.auto_enrolled` boolean (avto vs qo'lda) — `ADD COLUMN IF NOT EXISTS`.
5. `lms_card_mentors` jadval (EP-ORG-116) — `CREATE TABLE IF NOT EXISTS`.
6. `lms_cross_card_credits` jadval (Q562) — `CREATE TABLE IF NOT EXISTS`.
7. `card_required_knowledge` jadval (EP-ORG-122) — `CREATE TABLE IF NOT EXISTS`.
8. FK: `courses.card_id → org_departments.id` (Faza 0 dan keyin) — `ADD CONSTRAINT IF NOT EXISTS` (NO ACTION).
9. Index: `courses(card_id)`, `enrollments(card_id)`.

To'liq SQL § 5'da.

**Sabab:** kurs↔karta + avto-enroll-tarix + mentor + cross-card + domen-bilim — DATA yo'q, faqat STRUKTURA (Q-40). FK Faza 0'da `org_departments`ga.

**Verify:** `node _audit/q.cjs "SELECT to_regclass('lms_card_mentors'), to_regclass('lms_cross_card_credits'), to_regclass('card_required_knowledge')"` → uchchalasi non-NULL. `node _audit/q.cjs "SELECT column_name FROM information_schema.columns WHERE table_name='courses' AND column_name IN ('course_type','approval_status')"` → 2 qator.

**Commit:** `git add apps/api/src/shared/db/migrations/phase07-lms-card.sql apps/api/src/shared/db/migrations-drift.ts`

---

### B2 — Repo: kurs↔karta + domen-bilim metodlar

**FAYL:** `apps/api/src/modules/lms/infrastructure/repositories/drizzle-lms.repo.ts`

`findCoursesByCard`/`setCourseCard` BOR (satr 98-121). Qo'shiladigan metodlar (Result<T>):

```typescript
// EP-ORG-029: 3-bosqichli kurs tasdiq holatini o'zgartirish.
async setCourseApproval(id: string, status: 'draft' | 'training_review' | 'hr_review' | 'approved' | 'rejected', approvedBy: number): Promise<Result<Course>> {
  try {
    const r = await exec(sql`UPDATE courses SET approval_status = ${status}, approved_by = ${approvedBy}, approved_at = NOW(), updated_at = NOW() WHERE id = ${parseInt(id, 10)} RETURNING *`);
    if (!r[0]) return Err('Course not found');
    return Ok(mapCourse(r[0]));
  } catch (error: unknown) {
    this.logger.error(`setCourseApproval: ${(error as Error).message}`);
    return Err((error as Error).message);
  }
}

// EP-ORG-028/088: kartaga biriktirilgan APPROVED + active kurslar (avto-enroll manbasi).
async findApprovedCoursesByCard(cardId: number): Promise<Result<{ id: number; passing_score: number; course_type: string | null }[]>> {
  try {
    const rows = await exec(sql`SELECT id, passing_score, course_type FROM courses WHERE card_id = ${cardId} AND (is_active IS NULL OR is_active = true) AND (approval_status IS NULL OR approval_status = 'approved')`);
    return Ok((Array.isArray(rows) ? rows : []).map(r => ({ id: Number(r.id), passing_score: Number(r.passing_score ?? 70), course_type: (r.course_type as string | null) ?? null })));
  } catch (error: unknown) {
    this.logger.error(`findApprovedCoursesByCard: ${(error as Error).message}`);
    return Err((error as Error).message);
  }
}
```

**KEYIN — gate uchun progress-snapshot o'qish (C1/C2/C3 manbalari):**

```typescript
// Faza 7 gate: bitta enrollment uchun 3-shartli progress snapshotni DB'dan yig'adi.
// C1 manbasi = lms_test_attempts (eng yuqori passed score), C3 manbasi = course_progress.
async getCompletionSnapshot(employeeId: number, courseId: number): Promise<Result<{
  theoryScorePct: number; passThresholdPct: number; practicalPassed: boolean;
  totalTopics: number; confirmedTopics: number;
}>> {
  try {
    const courseR = await exec(sql`SELECT passing_score, course_type FROM courses WHERE id = ${courseId} LIMIT 1`);
    if (!courseR[0]) return Err('Course not found');
    const passThresholdPct = Number(courseR[0].passing_score ?? 70);

    const bestR = await exec(sql`SELECT COALESCE(MAX(score), 0) AS best FROM lms_test_attempts WHERE user_id = ${employeeId} AND course_id = ${courseId}`);
    const theoryScorePct = Number(bestR[0]?.best ?? 0);

    // C2 amaliy: enrollments.status='completed' yoki mentor-tasdiq (lms_card_mentors orqali — keyin kengaytiriladi)
    const enrR = await exec(sql`SELECT status FROM enrollments WHERE employee_id = ${employeeId} AND course_id = ${courseId} LIMIT 1`);
    const practicalPassed = String(enrR[0]?.status ?? '') === 'completed';

    // C3 mavzular: course_progress lesson-completed nisbati
    const topicsR = await exec(sql`SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE completed = true) AS done FROM course_progress WHERE user_id = ${employeeId} AND course_id = ${courseId}`);
    const totalTopics = Math.max(1, Number(topicsR[0]?.total ?? 1));
    const confirmedTopics = Number(topicsR[0]?.done ?? 0);

    return Ok({ theoryScorePct, passThresholdPct, practicalPassed, totalTopics, confirmedTopics });
  } catch (error: unknown) {
    this.logger.error(`getCompletionSnapshot: ${(error as Error).message}`);
    return Err((error as Error).message);
  }
}
```

**Sabab:** PURE `evaluate()` ga aniq DTO kerak; bu metod DB'dan real C1/C2/C3 manbalarini yig'adi (FABRIKATSIYA YO'Q — data yo'q bo'lsa 0/false qaytadi, soxta emas).

**Verify:** tsc. **Commit:** `git add drizzle-lms.repo.ts`

---

### B3 — `LmsCardGateService` (DB-wrapper gate) + LmsModule registratsiya

**FAYL (YANGI):** `apps/api/src/modules/lms/application/services/lms-card-gate.service.ts`

**Maqsad:** PURE `LmsCompletionService` ni DB'ga ulaydi; kartaning BARCHA majburiy kurslari tugaganmi? — Faza 4 payroll shu yerni chaqiradi.

```typescript
/**
 * @module lms-card-gate.service
 * @description EP-ORG-027 oylik-gate: kartaning majburiy darsliklari tugaganmi?
 * PURE LmsCompletionService.evaluate() ni DB-snapshot bilan o'raydi.
 * Faza 4 payroll handler shu xizmatni chaqiradi (gate=false → o'sha karta oyligi to'xtaydi).
 * DATA yo'q (kurs↔karta 0/5) → gate "true" qaytaradi (kurs biriktirilmagan = blok yo'q). FABRIKATSIYA YO'Q.
 */
import { Injectable, Logger } from '@nestjs/common';
import { Result, Ok, Err, AppErr } from '@common/result';
import { LmsRepository } from '../../infrastructure/repositories/drizzle-lms.repo';
import { LmsCompletionService } from './lms-completion.service';

export interface CardGateResult {
  cardId: number;
  employeeId: number;
  allComplete: boolean;          // false → oylik-gate yopiq
  incompleteCourseIds: number[]; // tugamagan kurslar
  reasons: string[];
}

@Injectable()
export class LmsCardGateService {
  private readonly logger = new Logger(LmsCardGateService.name);
  private readonly gate = new LmsCompletionService();

  constructor(private readonly lmsRepo: LmsRepository) {}

  async isCardTrainingComplete(cardId: number, employeeId: number): Promise<Result<CardGateResult>> {
    if (!Number.isInteger(cardId) || cardId <= 0) return Err(AppErr('VALIDATION', `cardId noto'g'ri: ${cardId}`));
    if (!Number.isInteger(employeeId) || employeeId <= 0) return Err(AppErr('VALIDATION', `employeeId noto'g'ri: ${employeeId}`));

    const coursesR = await this.lmsRepo.findApprovedCoursesByCard(cardId);
    if (!coursesR.ok) return Err(coursesR.error);
    const courses = coursesR.data;

    // Karta uchun majburiy kurs YO'Q → gate ochiq (kurs biriktirilmagan = blok yo'q). FABRIKATSIYA YO'Q.
    if (courses.length === 0) {
      return Ok({ cardId, employeeId, allComplete: true, incompleteCourseIds: [], reasons: [] });
    }

    const incompleteCourseIds: number[] = [];
    const reasons: string[] = [];
    for (const c of courses) {
      const snapR = await this.lmsRepo.getCompletionSnapshot(employeeId, c.id);
      if (!snapR.ok) { incompleteCourseIds.push(c.id); reasons.push(`Kurs #${c.id}: progress o'qib bo'lmadi`); continue; }
      const evalR = this.gate.evaluate(snapR.data);
      if (!evalR.ok) { incompleteCourseIds.push(c.id); reasons.push(`Kurs #${c.id}: ${evalR.error.message}`); continue; }
      if (!evalR.data.completed) { incompleteCourseIds.push(c.id); reasons.push(...evalR.data.reasons.map(r => `Kurs #${c.id}: ${r}`)); }
    }

    return Ok({ cardId, employeeId, allComplete: incompleteCourseIds.length === 0, incompleteCourseIds, reasons });
  }
}
```

**LmsModule (`lms.module.ts`) — qo'shiladi:**

OLDIN (satr 84-95 `appServices` da `LmsCompletionService` ham, `LmsCardGateService` ham YO'Q):
```typescript
const appServices = [ CertificationService, LmsCoreService, ... KnowledgeBaseService ];
```
KEYIN:
```typescript
import { LmsCompletionService } from './application/services/lms-completion.service';
import { LmsCardGateService } from './application/services/lms-card-gate.service';
// ...
const appServices = [ CertificationService, LmsCoreService, ..., KnowledgeBaseService,
  LmsCompletionService, LmsCardGateService ];
// exports — Faza 4 payroll (HrModule) chaqirishi uchun:
exports: [LmsRepository, CertificationService, LMS_REPO, LmsCardGateService],
```

**Sabab:** Faza 4 payroll handler `LmsCardGateService.isCardTrainingComplete` ni chaqiradi (DI orqali). Shuning uchun **exports**ga qo'shiladi. PURE service registratsiya qilinadi (hozir o'lik-ulanmagan — Q-46 buzuq emas, lekin ulanmagan → ulaymiz).

**Verify:** tsc + B3 DB-proof (§10.2). **Commit:** `git add lms-card-gate.service.ts lms.module.ts`

---

### B4 — Controller: bind/approval + gate-preview endpoint

**FAYL:** `apps/api/src/modules/lms/presentation/lms-courses.controller.ts`

`PATCH :id/card` (bind) BOR (satr 151-158). Qo'shiladi:

```typescript
// EP-ORG-029: 3-bosqichli kurs tasdiq (draft→training_review→hr_review→approved).
@Patch(':id/approval')
@UsePipes(new ZodValidationPipe(LmsSetApprovalSchema))
@Roles('TRAINING_OFFICER', 'HR_MANAGER', 'DIRECTOR', 'SUPER_ADMIN')
async setApproval(@Param('id') id: string, @Body() body: LmsSetApprovalDto, @CurrentUser() user: AuthenticatedUser) {
  const r = await this.lmsRepo.setCourseApproval(id, body.status, Number(user?.sub ?? user?.id ?? 0));
  if (!r.ok) throw new NotFoundException(`Kurs topilmadi: ${id}`);
  return { message: 'Kurs tasdiq holati yangilandi', data: r.data };
}

// EP-ORG-027: kartaning darslik-gate holati (oylik-gate preview, read-only).
@Get('gate/by-card/:cardId/employee/:employeeId')
@Roles('HR_SPECIALIST', 'HR_MANAGER', 'DIRECTOR', 'SUPER_ADMIN')
async cardGate(@Param('cardId') cardId: string, @Param('employeeId') employeeId: string) {
  return unwrapOrThrow(await this.cardGateService.isCardTrainingComplete(parseInt(cardId, 10), parseInt(employeeId, 10)));
}
```

Controller constructor'iga `LmsCardGateService` inject:
```typescript
constructor(
  private readonly commandBus: CommandBus,
  private readonly queryBus: QueryBus,
  private readonly lmsRepo: LmsRepository,
  private readonly cardGateService: LmsCardGateService,  // YANGI
) {}
```

**DTO (`dto/lms.dto.ts`) — qo'shiladi:**
```typescript
export const LmsSetApprovalSchema = z.object({
  status: z.enum(['draft', 'training_review', 'hr_review', 'approved', 'rejected']),
});
export type LmsSetApprovalDto = z.infer<typeof LmsSetApprovalSchema>;
```

**Sabab:** EP-ORG-029 inson tasdiq + EP-ORG-027 gate-preview (FE "Darslik" tab ko'rsatadi). Read-only gate — Q-43 forma emas, lekin REAL DB-derive.

**Verify:** tsc + curl `GET /api/lms/courses/gate/by-card/1/employee/1` (401 guard, login bilan 200). **Commit:** `git add lms-courses.controller.ts lms.dto.ts`

---

### B5 — Avto-enroll listener (xodim kartaga kelganda)

**FAYL (YANGI):** `apps/api/src/modules/lms/infrastructure/event-handlers/card-employee-assigned.handler.ts`

**Bog'liqlik:** Faza 1 `assignUser` (employee_cards INSERT) `CardEmployeeAssignedEvent` emit qiladi. **Agar Faza 1 hali bu eventni emit qilmasa** — bu listener `employee_cards` INSERT'ni kuzatish o'rniga `org.card.employee.assigned` eventiga ulanadi; emitter Faza 1'da qo'shiladi. Bu fazada FAQAT listener + payload-shartnoma quriladi (struktura).

```typescript
/**
 * @module card-employee-assigned.handler
 * @description EP-ORG-028/088: xodim kartaga (employee_cards) ulanganda — o'sha kartaning
 * barcha APPROVED+active kurslariga AVTO-enroll. Idempotent (ON CONFLICT DO NOTHING).
 */
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { LmsRepository } from '../repositories/drizzle-lms.repo';

export interface CardEmployeeAssignedPayload {
  employeeId: number;
  cardId: number;       // org_departments.id
  assignedAt: string;
}

@Injectable()
export class CardEmployeeAssignedHandler {
  private readonly logger = new Logger(CardEmployeeAssignedHandler.name);
  constructor(private readonly lmsRepo: LmsRepository) {}

  @OnEvent('org.card.employee.assigned')
  async handle(payload: CardEmployeeAssignedPayload): Promise<void> {
    const coursesR = await this.lmsRepo.findApprovedCoursesByCard(payload.cardId);
    if (!coursesR.ok || coursesR.data.length === 0) return;
    for (const c of coursesR.data) {
      const r = await this.lmsRepo.autoEnroll(payload.employeeId, c.id, payload.cardId);
      if (!r.ok) this.logger.warn(`auto-enroll fail emp=${payload.employeeId} course=${c.id}: ${r.error}`);
    }
    this.logger.log(`Auto-enrolled emp=${payload.employeeId} to ${coursesR.data.length} card-courses (card=${payload.cardId})`);
  }
}
```

**Repo `autoEnroll` (drizzle-lms.repo.ts):**
```typescript
// EP-ORG-028: idempotent avto-enroll (qaysi karta orqali — enrollments.card_id + auto_enrolled).
async autoEnroll(employeeId: number, courseId: number, cardId: number): Promise<Result<{ enrolled: boolean }>> {
  try {
    await exec(sql`INSERT INTO enrollments (employee_id, course_id, card_id, auto_enrolled, status, enrolled_at, created_at, updated_at)
      VALUES (${employeeId}, ${courseId}, ${cardId}, true, 'enrolled', NOW(), NOW(), NOW())
      ON CONFLICT (employee_id, course_id) DO UPDATE SET card_id = EXCLUDED.card_id, auto_enrolled = true, updated_at = NOW()`);
    return Ok({ enrolled: true });
  } catch (error: unknown) {
    this.logger.error(`autoEnroll: ${(error as Error).message}`);
    return Err((error as Error).message);
  }
}
```

**LmsModule** — `eventListeners`ga `CardEmployeeAssignedHandler` qo'shiladi.

**Sabab:** EP-ORG-088 "xodim kelganda darslikni ko'radi" = avto-enroll. Idempotent (Q-40 — qayta-event soxta dublikat yaratmaydi).

**Verify:** tsc + B5 DB-proof (event emit → enroll qatori). **Commit:** `git add card-employee-assigned.handler.ts drizzle-lms.repo.ts lms.module.ts`

---

### B6 — Mentor kartaga (EP-ORG-116)

**FAYL (YANGI):** `apps/api/src/modules/lms/application/services/lms-card-mentor.service.ts` + repo metodlar + controller endpoint.

Jadval `lms_card_mentors` (B1). Service: `assignMentor(cardId, mentorEmployeeId, mentorType)` / `revokeMentor(id)` / `listByCard(cardId)`. `mentorType` enum: `'adaptation' | 'professional'` (har xodimga 2 mentor — adaptatsiya + kasbiy usta, EP-ORG-116).

Controller endpointlar (yangi `lms-card-mentors.controller.ts` yoki `lms-courses.controller.ts`ga):
- `POST lms/cards/:cardId/mentors` — assign (Zod `LmsAssignMentorSchema`).
- `GET lms/cards/:cardId/mentors` — list.
- `DELETE lms/cards/:cardId/mentors/:id` — revoke.

**Sabab:** EP-ORG-116 kartaga mentor; DATA 0 (mentors=0) → STRUKTURA + endpoint (Q-40). Forma REAL saqlaydi (Q-43).

**Verify:** tsc + DB-proof. **Commit:** `git add lms-card-mentor.service.ts lms-card-mentors.controller.ts drizzle-lms.repo.ts lms.module.ts lms.dto.ts`

---

### B7 — FE: "Darslik" tab `OrgNodeDetail`da

**FAYL (YANGI):** `artifacts/erp-dashboard/src/components/hr/orgnode/DarslikTab.tsx`
**FAYL (EDIT):** `artifacts/erp-dashboard/src/pages/OrgNodeDetail.tsx`

`OrgNodeDetail.tsx:120-139` ga tab qo'shiladi (≤2 daraja, Qoida 42; FolderTab namuna):

OLDIN (satr 125-126):
```tsx
<TabsTrigger value="folder" ...>{t("papka3")}</TabsTrigger>
<TabsTrigger value="stats">{t("statistika")}</TabsTrigger>
```
KEYIN (qo'shiladi):
```tsx
<TabsTrigger value="folder" ...>{t("papka3")}</TabsTrigger>
<TabsTrigger value="darslik" className="flex items-center gap-1"><GraduationCap className="h-3.5 w-3.5" />{t("darslik")}</TabsTrigger>
<TabsTrigger value="stats">{t("statistika")}</TabsTrigger>
```
Va `TabsContent`:
```tsx
<TabsContent value="darslik"><DarslikTab cardId={node.id} cardName={node.name} /></TabsContent>
```

`DarslikTab.tsx` — EP shablon + token:
- `useQuery(['/api/lms/courses/by-card', cardId])` — kartaga bog'langan kurslar (F1: `EPLoader`).
- Bog'lanmagan kurslar uchun "Kurs biriktirish" tugmasi → `useMutation` `PATCH /api/lms/courses/:id/card` (F2: `onError` toast).
- Har kurs: tasdiq-holat `EPStatusPill` (draft/approved), `PATCH /api/lms/courses/:id/approval`.
- Gate-preview (ixtiyoriy xodim tanlansa): `GET /api/lms/courses/gate/by-card/:cardId/employee/:employeeId`.
- **Token:** `var(--ep-*)`; xom rang TAQIQ. Komponent: `EPCard`, `EPPageHeader` emas (tab ichi), `Button` from `@/components/ui/button`.

i18n: `darslik` kaliti `locales/uz/orgstructure.json` (yoki mavjud ns) + uz-cyr + ru.

**Sabab:** EP-ORG-028 — darslik kartada ko'rinadi. Q-46 — mavjud 9 tab SAQLANADI, faqat 1 tab QO'SHILADI (regress yo'q). Q-43 — bind REAL saqlaydi.

**Verify:** FE tsc (`pnpm --filter erp-dashboard run build` yoki `tsc -b`) + `scripts/check-design-tokens.mjs` PASS + jonli: kursni kartaga bog'la → sahifani qayta och → ko'rinadi.

**Commit:** `git add DarslikTab.tsx OrgNodeDetail.tsx locales/uz/orgstructure.json locales/ru/orgstructure.json locales/uz-cyr/orgstructure.json`

---

### B8 — Cross-card credit (Q562)

**FAYL:** repo + `lms-card-gate.service.ts` (kengaytirish).

`lms_cross_card_credits` jadval (B1). Mantiq: universal kurs (`courses.is_universal`/`course_type='replication'`) bir kartada tugaganda → `getCompletionSnapshot` boshqa kartada shu kursni "completed" deb hisoblaydi (kredit). `LmsCardGateService.isCardTrainingComplete`'da: kurs tugamagan bo'lsa, `lms_cross_card_credits`'da shu xodim+kurs uchun kredit bormi tekshir.

Repo:
```typescript
async hasCrossCardCredit(employeeId: number, courseId: number): Promise<Result<boolean>> {
  try {
    const r = await exec(sql`SELECT 1 FROM lms_cross_card_credits WHERE employee_id = ${employeeId} AND course_id = ${courseId} LIMIT 1`);
    return Ok(r.length > 0);
  } catch (e: unknown) { return Err((e as Error).message); }
}
```

`isCardTrainingComplete` ichida (kurs tugamagan bo'lsa, kredit tekshir):
```typescript
if (!evalR.data.completed) {
  const creditR = await this.lmsRepo.hasCrossCardCredit(employeeId, c.id);
  if (creditR.ok && creditR.data) continue; // kredit bor → o'tdi deb hisoblanadi
  incompleteCourseIds.push(c.id); reasons.push(...);
}
```

Kredit YOZISH: kurs `completed` bo'lganda event/handler — universal kurs uchun barcha boshqa biriktirilgan kartalarga `INSERT INTO lms_cross_card_credits`.

**Sabab:** Q562 — universal kurs takror o'qitilmaydi. DATA yo'q → STRUKTURA + mantiq (Q-40).

**Verify:** tsc + DB-proof (kredit qatori → gate o'tadi). **Commit:** `git add drizzle-lms.repo.ts lms-card-gate.service.ts`

---

### B9 — Skill-matrix bog'lanish (kurs tugaganda employee_skills)

**FAYL:** `lms` completion listener (kurs `completed` event) → `employee_skills` UPSERT.

Kurs `completed` bo'lganda (enrollment status='completed') → agar kurs `skill_id` ga bog'langan bo'lsa (`courses.skill_id` — agar yo'q bo'lsa B1'da `ADD COLUMN IF NOT EXISTS`) → `employee_skills`ga UPSERT (gap-analysis manbasi). Bu `SkillsMatrixService.getGapAnalysis` (skills-matrix.service.ts:46) ni real qiladi.

**Sabab:** EP-ORG-033 "da'vo→test→raport→matritsa"; darslik tugashi ko'nikmaga yoziladi. DATA-driven, AI emas (Faza 10).

**Verify:** tsc + DB-proof. **Commit:** `git add <fayl>`

---

## § 5. DB — MIGRATION SQL (APPROVED)

**FAYL:** `apps/api/src/shared/db/migrations/phase07-lms-card.sql`

```sql
-- ============================================================================
-- FAZA 07 — Darslik/LMS kartaga (EP-ORG-027/028/029/088/116/122/Q552/Q562)
-- APPROVED: egasi ruxsati (Q-35) — MASSIV-100 master-reja FAZA 07.
-- Idempotent: IF NOT EXISTS. Hech qanday DATA yozilmaydi (Q-40).
-- ============================================================================

-- (1) courses: tasdiq-bosqich + kurs-turi + skill bog'lanish ----------------
ALTER TABLE courses ADD COLUMN IF NOT EXISTS course_type     varchar(32);          -- safety_tx|regulation|general|razryad_exam|onboarding|replication
ALTER TABLE courses ADD COLUMN IF NOT EXISTS approval_status varchar(24) DEFAULT 'draft'; -- draft|training_review|hr_review|approved|rejected
ALTER TABLE courses ADD COLUMN IF NOT EXISTS approved_by     integer;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS approved_at     timestamp;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS is_universal    boolean DEFAULT false; -- Q562 cross-card credit
ALTER TABLE courses ADD COLUMN IF NOT EXISTS skill_id        integer;               -- B9 skill-matrix

-- (2) enrollments: qaysi karta orqali + avto vs qo'lda (Q599 tarix) ---------
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS card_id       integer;
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS auto_enrolled boolean DEFAULT false;

-- enrollments (employee_id, course_id) unique — autoEnroll ON CONFLICT uchun
CREATE UNIQUE INDEX IF NOT EXISTS uq_enrollments_emp_course ON enrollments (employee_id, course_id);

-- (3) lms_card_mentors — kartaga mentor (EP-ORG-116) ------------------------
CREATE TABLE IF NOT EXISTS lms_card_mentors (
  id                 serial PRIMARY KEY,
  card_id            integer NOT NULL,           -- org_departments.id
  mentor_employee_id integer NOT NULL,
  mentor_type        varchar(20) NOT NULL DEFAULT 'professional', -- adaptation|professional
  is_active          boolean NOT NULL DEFAULT true,
  assigned_by        integer,
  assigned_at        timestamp NOT NULL DEFAULT NOW(),
  ended_at           timestamp,
  created_at         timestamp NOT NULL DEFAULT NOW(),
  updated_at         timestamp NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_lms_card_mentors_card ON lms_card_mentors (card_id) WHERE is_active = true;

-- (4) lms_cross_card_credits — universal kurs cross-card kredit (Q562) ------
CREATE TABLE IF NOT EXISTS lms_cross_card_credits (
  id              serial PRIMARY KEY,
  employee_id     integer NOT NULL,
  course_id       integer NOT NULL,
  source_card_id  integer NOT NULL,   -- qaysi kartada tugatilgan
  credited_at     timestamp NOT NULL DEFAULT NOW(),
  created_at      timestamp NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_cross_credit_emp_course ON lms_cross_card_credits (employee_id, course_id);

-- (5) card_required_knowledge — domen-bilim (EP-ORG-122) --------------------
CREATE TABLE IF NOT EXISTS card_required_knowledge (
  id           serial PRIMARY KEY,
  card_id      integer NOT NULL,       -- org_departments.id
  knowledge    varchar(255) NOT NULL,  -- masalan "gofra turlari", "offset bosma"
  level        varchar(20),            -- basic|intermediate|advanced
  is_mandatory boolean NOT NULL DEFAULT true,
  created_at   timestamp NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_card_req_knowledge_card ON card_required_knowledge (card_id);

-- (6) Indexlar -------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_courses_card        ON courses (card_id) WHERE card_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_enrollments_card    ON enrollments (card_id) WHERE card_id IS NOT NULL;

-- (7) FK: courses.card_id -> org_departments.id (FAZA 0 dan keyin, NO ACTION)
-- APPROVED: Faza 0 org_departments yagona karta. Faza 0 BAJARILMAGAN bo'lsa BU BLOKNI O'TKAZIB YUBOR.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'org_departments')
     AND NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_courses_card_org_dept') THEN
    ALTER TABLE courses ADD CONSTRAINT fk_courses_card_org_dept
      FOREIGN KEY (card_id) REFERENCES org_departments(id) ON DELETE NO ACTION;
  END IF;
END $$;
```

> **MUHIM (Faza 0 bog'liqlik):** (7) FK `org_departments`ga. Agar Faza 0 hali `org_functions`'ni retire qilmagan bo'lsa va `courses.card_id` hozir `org_functions.id`ga ishora qilsa — (7) ni `org_functions`ga emas, **Faza 0 yakunlangach** `org_departments`ga qo'y. Bu fazada FK qo'shishdan oldin `node _audit/q.cjs "SELECT card_id FROM courses WHERE card_id IS NOT NULL"` bilan tekshir; agar mavjud card_id'lar `org_departments`da yo'q bo'lsa — FK qo'yma (DATA 0 bo'lgani uchun bo'sh, xavfsiz).

---

## § 6. ZOD / RESULT / DRIZZLE NAMUNALARI

### 6.1 Zod (DTO — `dto/lms.dto.ts`)
```typescript
export const LmsSetApprovalSchema = z.object({
  status: z.enum(['draft', 'training_review', 'hr_review', 'approved', 'rejected']),
});
export type LmsSetApprovalDto = z.infer<typeof LmsSetApprovalSchema>;

export const LmsAssignMentorSchema = z.object({
  mentorEmployeeId: z.number().int().positive(),
  mentorType:       z.enum(['adaptation', 'professional']),
});
export type LmsAssignMentorDto = z.infer<typeof LmsAssignMentorSchema>;
```

### 6.2 Result (service)
```typescript
async assignMentor(cardId: number, dto: LmsAssignMentorDto, assignedBy: number): Promise<Result<{ id: number }>> {
  if (!Number.isInteger(cardId) || cardId <= 0) return Err(AppErr('VALIDATION', `cardId noto'g'ri: ${cardId}`));
  const r = await this.lmsRepo.insertCardMentor(cardId, dto.mentorEmployeeId, dto.mentorType, assignedBy);
  if (!r.ok) return Err(r.error);
  return Ok(r.data);
}
```

### 6.3 Drizzle (afzal — oddiy CRUD; raw SQL faqat murakkab)
Mavjud LMS repo `sql\`...\`` ishlatadi (parametrli — Qoida B xavfsiz). Yangi oddiy o'qish uchun Drizzle ORM afzal:
```typescript
import { courses_table } from '@shared/db';
import { eq, and, isNull, count } from 'drizzle-orm';
// ...
const rows = await db.select().from(courses_table)
  .where(and(eq(courses_table.card_id, cardId), eq(courses_table.is_active, true)));
```
> Agar `courses_table`'da yangi ustun (`card_id`/`course_type`) Drizzle-schemada yo'q bo'lsa — schema barrel `@europrint/schemas`'ni yangilash KERAK EMAS bu fazada (live DB superset, raw `sql` bilan o'qiladi). Schema-drift faza-tashqari.

---

## § 7. FE + DIZAYN (EP token / shablon / komponent)

### 7.1 Qaysi sahifa
- **Asosiy:** `OrgNodeDetail.tsx` (karta detali) → yangi **"Darslik" tab** (`DarslikTab.tsx`).
- **Ikkilamchi:** `Courses.tsx` — kurs yaratish/tahrirda "Karta" tanlash maydoni (`cardId`), `AddCourseDialog.tsx`'ga `cardId` select qo'shiladi.

### 7.2 Token + komponent (Qoida 21/41)
- Ranglar: `var(--ep-primary)`, `var(--ep-success)`, `var(--ep-muted)` — xom hex/rgb TAQIQ.
- Status: `EPStatusPill` (approved=success, draft=muted, rejected=destructive).
- Karta: `EPCard`; yuklash: `EPLoader` (F1); xato: `EPErrorState`.
- Tugma: `@/components/ui/button` `Button` (saqlash o'ngda, bekor chapda — Qoida 41).
- Tab: `@/components/ui/tabs` — `OrgNodeDetail` mavjud `Tabs` ichida (≤2 daraja, Qoida 42).

### 7.3 Forma REAL saqlaydi (Q-43)
"Kurs biriktirish" / "Mentor qo'shish" / "Tasdiq holat" — har biri `useMutation` (`PATCH/POST`) → BE endpoint → DB → `queryClient.invalidateQueries` → qayta-yuklashda ko'rinadi. `onSuccess` toast + invalidate, `onError` toast (F2).

### 7.4 i18n
`darslik` kaliti 3 tilda (`uz`, `uz-cyr`, `ru`) `orgstructure` ns'ga. Hardcoded matn TAQIQ.

---

## § 8. QABUL-MEZONI

1. ✅ `node _audit/q.cjs "SELECT to_regclass('lms_card_mentors'), to_regclass('lms_cross_card_credits'), to_regclass('card_required_knowledge')"` → 3 ta non-NULL.
2. ✅ `courses.course_type`, `courses.approval_status`, `enrollments.card_id`, `enrollments.auto_enrolled` ustunlari mavjud.
3. ✅ Kurs kartaga bog'lanadi: `PATCH /api/lms/courses/:id/card {cardId}` → `courses.card_id` real UPDATE → `GET /api/lms/courses/by-card/:cardId` qaytaradi.
4. ✅ Xodim kartaga ulanganda (`org.card.employee.assigned` event) → `enrollments`ga avto-qator (`auto_enrolled=true`, `card_id=set`).
5. ✅ `LmsCardGateService.isCardTrainingComplete(cardId, empId)` → kartaning majburiy kurslari tugamasa `allComplete=false` + `reasons`; kurs yo'q bo'lsa `allComplete=true` (FABRIKATSIYA YO'Q).
6. ✅ `LmsCardGateService` LmsModule'da export qilingan (Faza 4 payroll chaqirishi uchun tayyor).
7. ✅ Mentor kartaga assign/list/revoke REAL saqlaydi.
8. ✅ Cross-card credit: kredit qatori bor → gate o'sha kursni "o'tdi" deb hisoblaydi.
9. ✅ FE `OrgNodeDetail`da "Darslik" tab — mavjud 9 tab SAQLANGAN (Q-46), token PASS.
10. ✅ tsc GREEN (BE + FE o'z fayllarda 0 xato). `check-design-tokens.mjs` PASS.
11. ✅ PURE `LmsCompletionService` TEGILMAGAN (test hamon o'tadi).

---

## § 9. EDGE-HOLATLAR

| # | Holat | Kutilgan natija |
|---|---|---|
| E1 | Kartaga kurs biriktirilmagan (card_id NULL barcha kurslarda) | `isCardTrainingComplete` → `allComplete=true` (blok yo'q). FABRIKATSIYA YO'Q. |
| E2 | `lms_test_attempts` da xodim uchun urinish yo'q | `theoryScorePct=0` → C1 fail → kurs tugamagan. To'g'ri (soxta 100 emas). |
| E3 | `course_progress` da 0 lesson (kurs strukturasiz) | `totalTopics=max(1,0)=1`, `confirmedTopics=0` → C3 fail. Divide-by-zero yo'q (guard). |
| E4 | Xodim 2 kartada (Faza 1 M:N) + ikki kartada bir xil universal kurs | Cross-card credit (Q562): birinchi kartada tugatsa, ikkinchi kartada gate o'tadi. |
| E5 | Karta arxivlanadi (Q552) | Avto-enroll progress saqlanadi (`enrollments` o'chmaydi); voris boshidan oladi — kelajak pass (struktura: `card_id` saqlanadi). |
| E6 | `org.card.employee.assigned` event 2 marta (qayta-assign) | `autoEnroll` ON CONFLICT DO UPDATE — dublikat yo'q (idempotent). |
| E7 | Kurs `approval_status='draft'` (tasdiqlanmagan) | `findApprovedCoursesByCard` uni QAYTARMAYDI → avto-enroll/gate'ga kirmaydi. |
| E8 | Faza 0 bajarilmagan, `courses.card_id` → `org_functions`ga ishora | FK (7) qo'yilmaydi (DATA 0, xavfsiz); gate `findApprovedCoursesByCard(cardId)` baribir ishlaydi (cardId = qaysi karta-jadval bo'lsa). |
| E9 | `cardId`/`employeeId` ≤0 yoki NaN | Service VALIDATION Err — 400 (Qoida 11/Result). |
| E10 | Server :3030 tushgan (Q-44 nest-watch) | Static fallback: tsc + rollback-tx DB-proof; jonli keyin. |

---

## § 10. SELF-VERIFY (tsc + rollback-tx DB-proof + jonli isbot)

### 10.1 tsc (har bosqich)
```bash
cd apps/api && npx tsc --noEmit 2>&1 | grep -E "lms|courses|payroll" || echo "LMS fayllarda 0 xato"
# FE:
cd artifacts/erp-dashboard && npx tsc --noEmit 2>&1 | grep -E "Darslik|OrgNodeDetail" || echo "FE 0 xato"
```

### 10.2 Rollback-tx DB-proof skript namuna (`_audit/bproof-lms-card-gate.cjs`)
> Mavjud `_audit/bproof-*.cjs` namunasiga mos (kirit → oqdi → ko'rindi → ROLLBACK). HECH QANDAY commit-data qoldirmaydi.

```javascript
// _audit/bproof-lms-card-gate.cjs — Faza 7 darslik-gate END-TO-END DB-proof.
// kirit (kurs↔karta + enroll + test-attempt) → gate o'qi → ROLLBACK.
const { Client } = require('pg');
(async () => {
  const c = new Client({ /* europrint @ uzbek-language-module-postgres-1 — _audit/q.cjs bilan bir xil conn */ });
  await c.connect();
  try {
    await c.query('BEGIN');
    // 1) Kurs yarat (kartaga bog'langan, approved)
    const crs = await c.query(`INSERT INTO courses (title, title_uz, code, passing_score, card_id, course_type, approval_status, is_active, created_at)
      VALUES ('PROOF', 'PROOF', 'BPROOF-${Date.now()}', 70, 1, 'general', 'approved', true, NOW()) RETURNING id`);
    const courseId = crs.rows[0].id;
    console.log('1. KIRIT kurs↔karta:', courseId, '(card_id=1)');

    // 2) findApprovedCoursesByCard(1) topadimi?
    const byCard = await c.query(`SELECT id FROM courses WHERE card_id = 1 AND approval_status = 'approved' AND is_active = true`);
    console.log('2. OQDI by-card kurslar:', byCard.rows.map(r => r.id));

    // 3) Enroll (avto) + test-attempt (C1 fail: 50 < 70)
    await c.query(`INSERT INTO enrollments (employee_id, course_id, card_id, auto_enrolled, status, enrolled_at, created_at, updated_at)
      VALUES (1, ${courseId}, 1, true, 'enrolled', NOW(), NOW(), NOW()) ON CONFLICT (employee_id, course_id) DO NOTHING`);
    await c.query(`INSERT INTO lms_test_attempts (user_id, test_id, course_id, score, passed, created_at) VALUES (1, 0, ${courseId}, 50, false, NOW())`);
    const best = await c.query(`SELECT COALESCE(MAX(score),0) AS best FROM lms_test_attempts WHERE user_id=1 AND course_id=${courseId}`);
    console.log('3. KO\'RINDI gate-snapshot: theory=', best.rows[0].best, 'threshold=70 → C1 FAIL → kurs tugamagan (gate yopiq)');

    // 4) Cross-card credit qo'shsak → o'tadimi?
    await c.query(`INSERT INTO lms_cross_card_credits (employee_id, course_id, source_card_id, credited_at, created_at) VALUES (1, ${courseId}, 2, NOW(), NOW())`);
    const credit = await c.query(`SELECT 1 FROM lms_cross_card_credits WHERE employee_id=1 AND course_id=${courseId}`);
    console.log('4. KO\'RINDI cross-card credit:', credit.rows.length > 0, '→ gate o\'tadi');

    await c.query('ROLLBACK');
    console.log('5. ROLLBACK — hech narsa saqlanmadi (DATA toza).');
  } catch (e) { await c.query('ROLLBACK'); console.error('XATO (rolled back):', e.message); }
  finally { await c.end(); }
})();
```
Ishga tushir: `node _audit/bproof-lms-card-gate.cjs` → 5 qadam chiqsin, oxirida ROLLBACK.

### 10.3 Jonli isbot (server :3030 + login)
```bash
# login token ol (admin), keyin:
curl -s -H "Authorization: Bearer $TOKEN" -X PATCH http://localhost:3030/api/lms/courses/1/card -H 'Content-Type: application/json' -d '{"cardId":1}'
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3030/api/lms/courses/by-card/1
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3030/api/lms/courses/gate/by-card/1/employee/1
# → bind ko'rinadi, gate {allComplete, reasons} qaytaradi.
```

---

## § 11. OWNER-DATA REESTRI (fabrikatsiya TAQIQ — egasi to'ldiradi)

| Data | Hozir | Kim/qachon |
|---|---|---|
| **Qaysi kurs qaysi kartaga** (`courses.card_id`) | 0/5 | O'quv bo'limi / HR — productionda har kursni kartaga biriktiradi (FE "Darslik" tab → "Kurs biriktirish"). |
| **Kurs-turi** (`course_type` — safety_tx/general/...) | NULL | O'quv bo'limi — threshold (100% vs 70%) shunga bog'liq. |
| **Mentor biriktiruvi** (`lms_card_mentors`) | 0 | HR / rahbar — har kartaga 2 mentor (adaptatsiya + kasbiy). |
| **Domen-bilim** (`card_required_knowledge`) | 0 | O'quv bo'limi — har kartaga "gofra/offset turlari" kabi talab-bilim. |
| **Tasdiq** (`approval_status`) | draft (default) | O'quv bo'limi → HR → rahbar (EP-ORG-029 inson-tasdiq; AI=Faza 10). |
| **Universal kurs belgisi** (`is_universal`) | false | O'quv bo'limi — cross-card credit uchun. |
| **Test-savol banki / lms_test_attempts data** | 0 real | Xodimlar imtihon topshirganda to'ladi (C1 manbasi). |

> Bu fazada STRUKTURA + GATE + ENDPOINT to'liq quriladi; yuqoridagi DATA egasidan kelmaguncha gate "ochiq" (kurs biriktirilmagan = blok yo'q). SOXTA qiymat YOZILMAYDI.

---

## § 12. COMMIT TARTIBI

> Har bosqich (B1–B9) alohida commit. Faqat o'z fayl (`git add <fayl>` — `-A` TAQIQ). `--no-verify` agar pre-commit bloklasa (sabab bilan).

```bash
# B1
git add apps/api/src/shared/db/migrations/phase07-lms-card.sql apps/api/src/shared/db/migrations-drift.ts
git commit --no-verify -m "feat(lms): FAZA07 B1 — kurs↔karta migration (mentor/cross-card/domen-bilim jadval + ustunlar) [APPROVED]

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"

# B2
git add apps/api/src/modules/lms/infrastructure/repositories/drizzle-lms.repo.ts
git commit --no-verify -m "feat(lms): FAZA07 B2 — repo kurs-approval + completion-snapshot metodlar

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"

# B3
git add apps/api/src/modules/lms/application/services/lms-card-gate.service.ts apps/api/src/modules/lms/lms.module.ts
git commit --no-verify -m "feat(lms): FAZA07 B3 — LmsCardGateService (oylik-gate DB-wrapper) + module export

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"

# B4
git add apps/api/src/modules/lms/presentation/lms-courses.controller.ts apps/api/src/modules/lms/dto/lms.dto.ts
git commit --no-verify -m "feat(lms): FAZA07 B4 — bind/approval + gate-preview endpoint

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"

# B5
git add apps/api/src/modules/lms/infrastructure/event-handlers/card-employee-assigned.handler.ts apps/api/src/modules/lms/infrastructure/repositories/drizzle-lms.repo.ts apps/api/src/modules/lms/lms.module.ts
git commit --no-verify -m "feat(lms): FAZA07 B5 — avto-enroll listener (xodim kartaga kelganda)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"

# B6
git add apps/api/src/modules/lms/application/services/lms-card-mentor.service.ts apps/api/src/modules/lms/presentation/lms-card-mentors.controller.ts apps/api/src/modules/lms/infrastructure/repositories/drizzle-lms.repo.ts apps/api/src/modules/lms/lms.module.ts apps/api/src/modules/lms/dto/lms.dto.ts
git commit --no-verify -m "feat(lms): FAZA07 B6 — kartaga mentor (assign/list/revoke)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"

# B7 (FE)
git add artifacts/erp-dashboard/src/components/hr/orgnode/DarslikTab.tsx artifacts/erp-dashboard/src/pages/OrgNodeDetail.tsx artifacts/erp-dashboard/src/locales/uz/orgstructure.json artifacts/erp-dashboard/src/locales/ru/orgstructure.json artifacts/erp-dashboard/src/locales/uz-cyr/orgstructure.json
git commit --no-verify -m "feat(lms): FAZA07 B7 — OrgNodeDetail Darslik tab (EP token/shablon)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"

# B8
git add apps/api/src/modules/lms/infrastructure/repositories/drizzle-lms.repo.ts apps/api/src/modules/lms/application/services/lms-card-gate.service.ts
git commit --no-verify -m "feat(lms): FAZA07 B8 — cross-card credit (Q562)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"

# B9
git add <skill-listener-fayl>
git commit --no-verify -m "feat(lms): FAZA07 B9 — kurs tugadi → employee_skills (skill-matrix)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## § 13. HOLAT HISOBOTI SHABLONI (Q-38 — egaga)

Faza oxirida quyidagini egaga ber:
- **DONE:** B1-B9 (qaysi commit hash).
- **DB-proof:** `bproof-lms-card-gate.cjs` 5 qadam PASS + ROLLBACK.
- **Jonli:** curl bind/by-card/gate 200.
- **tsc:** BE 0 / FE 0.
- **DEFER:** AI-tekshirish (Faza 10), karta-arxiv progress-suspend boy UI (Q552 keyingi pass), glossariy boy UI.
- **Owner-DATA kutilmoqda:** §11 jadval (kurs↔karta 0/5, mentor 0, domen-bilim 0).
- **Faza 4 uchun tayyor:** `LmsCardGateService.isCardTrainingComplete` export qilingan — Faza 4 payroll handler "DO NOT touch payroll" izohini olib, shu xizmatni chaqiradi.

---

## § 14. BOG'LIQLIK-XARITA (qaysi faza nima beradi/oladi)

| Bog'liqlik | Yo'nalish | Tafsilot |
|---|---|---|
| **FAZA 0 → 7** | oladi | `org_departments` yagona karta; `courses.card_id` FK → `org_departments.id`. Faza 0 bajarilmasa FK (7) o'tkazib yuboriladi (E8). |
| **FAZA 1 → 7** | oladi | `employee_cards` M:N + `assignUser` `org.card.employee.assigned` event emit (B5 listener shunga ulanadi). Faza 1 emit qilmasa — listener tayyor turadi. |
| **FAZA 7 → 4** | beradi | `LmsCardGateService.isCardTrainingComplete` (export). Faza 4 payroll handler chaqiradi → kurs tugamasa o'sha karta oyligi gate'da to'xtaydi (EP-ORG-027). |
| **FAZA 7 → 10** | beradi | `courses.approval_status` (inson-tasdiq darvozasi) — Faza 10 AI "training_review" bosqichida AI-tekshirish qo'shadi. |
| **FAZA 7 ↔ skill** | beradi | B9 kurs tugashi → `employee_skills` → `SkillsMatrixService.getGapAnalysis` real. |

---

## § 15. TO'LIQ KOD: `DarslikTab.tsx` (FE B7 — copy-paste asos)

> EP shablon + token + F1/F2. Bu skelet — Muslimbek i18n/komponent-importlarni loyihaga moslab to'ldiradi. Xom rang YO'Q.

```tsx
/**
 * @module DarslikTab
 * @description OrgNodeDetail "Darslik" tab — kartaga bog'langan kurslar (EP-ORG-028/088).
 * Kurs biriktirish/uzish + tasdiq-holat + gate-preview. Forma REAL saqlaydi (Q-43).
 */
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EPCard, EPLoader, EPErrorState, EPStatusPill } from "@/components/ep";
import { useToast } from "@/components/ui/use-toast";
import { GraduationCap, Link2, Unlink } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface CardCourse { id: number; title: string; approval_status: string | null; passing_score: number; }
interface AllCourse { id: number; title: string; card_id: number | null; }

export function DarslikTab({ cardId, cardName }: { cardId: number; cardName: string }) {
  const { t } = useTranslation("orgstructure");
  const { toast } = useToast();
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");

  // F1: yuklash holati majburiy
  const { data: cardCourses, isLoading, isError, error, refetch } = useQuery<{ data: CardCourse[] }>({
    queryKey: ["/api/lms/courses/by-card", cardId],
    queryFn: () => apiRequest("GET", `/api/lms/courses/by-card/${cardId}`),
  });

  // Bog'lanmagan kurslar (biriktirish uchun)
  const { data: allCoursesResp } = useQuery<{ data: AllCourse[] }>({
    queryKey: ["/api/lms/courses", "unbound"],
    queryFn: () => apiRequest("GET", `/api/lms/courses?limit=100`),
  });

  const bindMutation = useMutation({
    mutationFn: (courseId: number) => apiRequest("PATCH", `/api/lms/courses/${courseId}/card`, { cardId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lms/courses/by-card", cardId] });
      setSelectedCourseId("");
      toast({ title: t("kursBiriktirildi") });
    },
    onError: () => toast({ title: t("xatolik"), variant: "destructive" }),  // F2
  });

  const unbindMutation = useMutation({
    mutationFn: (courseId: number) => apiRequest("PATCH", `/api/lms/courses/${courseId}/card`, { cardId: null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lms/courses/by-card", cardId] });
      toast({ title: t("kursUzildi") });
    },
    onError: () => toast({ title: t("xatolik"), variant: "destructive" }),  // F2
  });

  const approvalMutation = useMutation({
    mutationFn: ({ courseId, status }: { courseId: number; status: string }) =>
      apiRequest("PATCH", `/api/lms/courses/${courseId}/approval`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lms/courses/by-card", cardId] });
      toast({ title: t("tasdiqYangilandi") });
    },
    onError: () => toast({ title: t("xatolik"), variant: "destructive" }),
  });

  if (isLoading) return <EPLoader />;                               // F1
  if (isError) return <EPErrorState error={error} onRetry={refetch} />;

  const courses = Array.isArray(cardCourses?.data) ? cardCourses!.data : [];
  const allCourses = Array.isArray(allCoursesResp?.data) ? allCoursesResp!.data : [];
  const unbound = allCourses.filter(c => c.card_id == null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--ep-space-4)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--ep-space-2)" }}>
        <GraduationCap className="h-4 w-4" style={{ color: "var(--ep-primary)" }} />
        <span style={{ color: "var(--ep-text)" }}>{t("kartaDarsliklari")}: {cardName}</span>
      </div>

      {/* Kurs biriktirish — REAL saqlaydi (Q-43) */}
      <div style={{ display: "flex", gap: "var(--ep-space-2)" }}>
        <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
          <SelectTrigger><SelectValue placeholder={t("kursTanlang")} /></SelectTrigger>
          <SelectContent>
            {unbound.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.title}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button
          disabled={!selectedCourseId || bindMutation.isPending}
          onClick={() => bindMutation.mutate(Number(selectedCourseId))}
        >
          <Link2 className="h-4 w-4 mr-1" /> {t("biriktirish")}
        </Button>
      </div>

      {/* Biriktirilgan kurslar */}
      {courses.length === 0 ? (
        <EPCard><span style={{ color: "var(--ep-muted)" }}>{t("kursYoq")}</span></EPCard>
      ) : (
        courses.map(c => (
          <EPCard key={c.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "var(--ep-text)" }}>{c.title}</span>
              <div style={{ display: "flex", gap: "var(--ep-space-2)", alignItems: "center" }}>
                <EPStatusPill status={c.approval_status === "approved" ? "success" : "muted"}>
                  {t(c.approval_status ?? "draft")}
                </EPStatusPill>
                {c.approval_status !== "approved" && (
                  <Button variant="outline" size="sm"
                    onClick={() => approvalMutation.mutate({ courseId: c.id, status: "approved" })}>
                    {t("tasdiqlash")}
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => unbindMutation.mutate(c.id)}>
                  <Unlink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </EPCard>
        ))
      )}
    </div>
  );
}
```

> **Token eslatma:** `var(--ep-space-*)`, `var(--ep-primary)`, `var(--ep-text)`, `var(--ep-muted)` — loyihaning `erp-modern-ui/*.css` token nomlariga moslab to'ldir. Agar `EPLoader`/`EPStatusPill` props imzosi farq qilsa — `Courses.tsx:30` (`EPErrorState, EPPageHeader, EPLoader`) va `LMSDashboard.tsx` namunalaridan ol.

---

## § 16. TO'LIQ KOD: mentor (B6 — repo + service + controller)

### 16.1 Repo metodlar (`drizzle-lms.repo.ts`)
```typescript
// EP-ORG-116: kartaga mentor biriktirish (adaptation|professional).
async insertCardMentor(cardId: number, mentorEmployeeId: number, mentorType: string, assignedBy: number): Promise<Result<{ id: number }>> {
  try {
    const r = await exec(sql`INSERT INTO lms_card_mentors (card_id, mentor_employee_id, mentor_type, assigned_by, is_active, assigned_at, created_at, updated_at)
      VALUES (${cardId}, ${mentorEmployeeId}, ${mentorType}, ${assignedBy}, true, NOW(), NOW(), NOW()) RETURNING id`);
    return Ok({ id: Number(r[0].id) });
  } catch (error: unknown) { return Err((error as Error).message); }
}

async listCardMentors(cardId: number): Promise<Result<Record<string, unknown>[]>> {
  try {
    const rows = await exec(sql`SELECT m.id, m.mentor_employee_id, m.mentor_type, m.is_active, m.assigned_at, e.full_name AS mentor_name
      FROM lms_card_mentors m LEFT JOIN employees e ON e.id = m.mentor_employee_id
      WHERE m.card_id = ${cardId} AND m.is_active = true ORDER BY m.assigned_at DESC`);
    return Ok(Array.isArray(rows) ? rows : []);
  } catch (error: unknown) { return Err((error as Error).message); }
}

async revokeCardMentor(id: number): Promise<Result<{ revoked: boolean }>> {
  try {
    const r = await exec(sql`UPDATE lms_card_mentors SET is_active = false, ended_at = NOW(), updated_at = NOW() WHERE id = ${id} AND is_active = true RETURNING id`);
    if (!r[0]) return Err('Mentor topilmadi yoki allaqachon bekor qilingan');
    return Ok({ revoked: true });
  } catch (error: unknown) { return Err((error as Error).message); }
}
```

### 16.2 Service (`lms-card-mentor.service.ts`)
```typescript
/**
 * @module lms-card-mentor.service
 * @description EP-ORG-116: kartaga mentor (adaptatsiya + kasbiy usta). Result<T>.
 */
import { Injectable } from '@nestjs/common';
import { Result, Ok, Err, AppErr } from '@common/result';
import { LmsRepository } from '../../infrastructure/repositories/drizzle-lms.repo';
import { LmsAssignMentorDto } from '../../dto/lms.dto';

@Injectable()
export class LmsCardMentorService {
  constructor(private readonly lmsRepo: LmsRepository) {}

  async assign(cardId: number, dto: LmsAssignMentorDto, assignedBy: number): Promise<Result<{ id: number }>> {
    if (!Number.isInteger(cardId) || cardId <= 0) return Err(AppErr('VALIDATION', `cardId noto'g'ri: ${cardId}`));
    return this.lmsRepo.insertCardMentor(cardId, dto.mentorEmployeeId, dto.mentorType, assignedBy);
  }
  async list(cardId: number): Promise<Result<Record<string, unknown>[]>> {
    if (!Number.isInteger(cardId) || cardId <= 0) return Err(AppErr('VALIDATION', `cardId noto'g'ri: ${cardId}`));
    return this.lmsRepo.listCardMentors(cardId);
  }
  async revoke(id: number): Promise<Result<{ revoked: boolean }>> {
    if (!Number.isInteger(id) || id <= 0) return Err(AppErr('VALIDATION', `id noto'g'ri: ${id}`));
    return this.lmsRepo.revokeCardMentor(id);
  }
}
```

### 16.3 Controller (`lms-card-mentors.controller.ts`)
```typescript
/**
 * @module lms-card-mentors.controller
 * @description HTTP routes — kartaga mentor (EP-ORG-116).
 */
import { Body, Controller, Delete, Get, Param, Post, UseGuards, UsePipes, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { unwrapOrThrow } from '@common/http-result';
import { AuthenticatedUser } from '@auth/types';
import { LmsCardMentorService } from '../application/services/lms-card-mentor.service';
import { LmsAssignMentorSchema, LmsAssignMentorDto } from '../dto/lms.dto';

@ApiTags('Lms Card Mentors')
@ApiBearerAuth()
@Controller('lms/cards/:cardId/mentors')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LmsCardMentorsController {
  constructor(private readonly svc: LmsCardMentorService) {}

  @ApiOperation({ summary: 'List card mentors' })
  @Get()
  @Roles('HR_SPECIALIST', 'HR_MANAGER', 'DIRECTOR', 'SUPER_ADMIN')
  async list(@Param('cardId') cardId: string) {
    return { data: unwrapOrThrow(await this.svc.list(parseInt(cardId, 10))) };
  }

  @ApiOperation({ summary: 'Assign mentor to card' })
  @Post()
  @UsePipes(new ZodValidationPipe(LmsAssignMentorSchema))
  @Roles('HR_MANAGER', 'DIRECTOR', 'SUPER_ADMIN')
  async assign(@Param('cardId') cardId: string, @Body() body: LmsAssignMentorDto, @CurrentUser() user: AuthenticatedUser) {
    const r = await this.svc.assign(parseInt(cardId, 10), body, Number(user?.sub ?? user?.id ?? 0));
    return { message: 'Mentor biriktirildi', data: unwrapOrThrow(r) };
  }

  @ApiOperation({ summary: 'Revoke card mentor' })
  @Delete(':id')
  @Roles('HR_MANAGER', 'DIRECTOR', 'SUPER_ADMIN')
  async revoke(@Param('id') id: string) {
    const r = await this.svc.revoke(parseInt(id, 10));
    if (!r.ok) throw new NotFoundException(r.error.message ?? 'Mentor topilmadi');
    return { message: 'Mentor bekor qilindi', data: r.data };
  }
}
```

LmsModule: `LmsCardMentorService` → `appServices`, `LmsCardMentorsController` → `appControllers`.

---

## § 17. TO'LIQ KOD: B9 skill-listener (kurs tugadi → employee_skills)

**FAYL (YANGI):** `apps/api/src/modules/lms/infrastructure/event-handlers/course-completed-skill.handler.ts`

```typescript
/**
 * @module course-completed-skill.handler
 * @description EP-ORG-033: kurs tugaganda (enrollment.status='completed') — agar kursga
 * skill_id bog'langan bo'lsa, employee_skills'ga UPSERT (SkillsMatrix gap-analysis manbasi).
 */
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';

export interface CourseCompletedPayload {
  employeeId: number;
  courseId: number;
  scorePct: number;
}

@Injectable()
export class CourseCompletedSkillHandler {
  private readonly logger = new Logger(CourseCompletedSkillHandler.name);

  @OnEvent('lms.course.completed')
  async handle(p: CourseCompletedPayload): Promise<void> {
    try {
      const skillRows = await db.execute(sql`SELECT skill_id FROM courses WHERE id = ${p.courseId} AND skill_id IS NOT NULL`);
      const skillId = (skillRows as unknown as { rows: { skill_id: number }[] }).rows?.[0]?.skill_id;
      if (!skillId) return;
      // employee_skills UPSERT — kurs natijasi ko'nikma darajasiga yoziladi.
      await db.execute(sql`INSERT INTO employee_skills (employee_id, skill_id, level, source, updated_at)
        VALUES (${p.employeeId}, ${skillId}, ${Math.round(p.scorePct)}, 'lms_course', NOW())
        ON CONFLICT (employee_id, skill_id) DO UPDATE SET level = GREATEST(employee_skills.level, EXCLUDED.level), source = 'lms_course', updated_at = NOW()`);
      this.logger.log(`Skill #${skillId} updated for emp=${p.employeeId} from course=${p.courseId}`);
    } catch (e: unknown) {
      this.logger.warn(`course-completed-skill: ${(e as Error).message}`);
    }
  }
}
```

> **Eslatma:** `employee_skills` ustun nomlari (`level`/`source`/unique index) JONLI tekshir: `node _audit/q.cjs "SELECT column_name FROM information_schema.columns WHERE table_name='employee_skills'"`. Agar `(employee_id, skill_id)` unique index yo'q bo'lsa — B1 migration'ga `CREATE UNIQUE INDEX IF NOT EXISTS` qo'sh (APPROVED). Kurs `completed` bo'lganda `lms.course.completed` eventini `enrollments` update-joyida emit qil (mavjud completion oqimida).

---

## § 18. TO'LIQ ITEM-BY-ITEM BO'SHLIQ (darslik mavzu, ORGSXEMA-INTERVYU satr 276-295)

> Har talab → bu faza qaysi bosqichda yopadi.

| EP-ID | Talab | Hozir (audit dalili) | Bu faza bosqich |
|---|---|---|---|
| EP-ORG-027 | Karta darsligi tugamaguncha o'sha karta oyligi to'xtaydi (LMS→Payroll gate) | YO'Q — `LmsCompletionService` PURE, "DO NOT touch payroll" | **B3** (`LmsCardGateService` + Faza 4'ga export) |
| EP-ORG-028 | Darslik kartaga biriktiriladi (xodimga emas) | Qisman — `courses.card_id` BOR, 0/5 bog'langan | **B2/B4/B7** (bind to'liq oqim + FE tab) |
| EP-ORG-029 | O'quv bo'limi→AI→HR+rahbar tasdiq | YO'Q — to'g'ridan INSERT, tasdiq yo'q | **B1/B4** (`approval_status` + endpoint; AI=Faza 10) |
| EP-ORG-088 | Xodim kelganda darslikni avto-ko'radi | Qisman — material-papka, completion/gate yo'q | **B5** (avto-enroll listener) |
| EP-ORG-122 | Karta domen-bilim ro'yxati; LMS shunga bog'lanadi | YO'Q — jadval topilmadi | **B1** (`card_required_knowledge` struktura) |
| EP-ORG-129 | Karta atamalar lug'ati (glossariy); darslikda tooltip | YO'Q — glossary jadval yo'q | DEFER (struktura keyingi pass; boy UI Faza-tashqari) |
| EP-ORG-116/EP-LMS-057/082 | Kartaga mentor (2 mentor) | YO'Q — mentors=0, kartaga bog'lanmagan | **B6** (`lms_card_mentors` + endpoint) |
| Q-33 | Ko'nikma qo'shish: da'vo→test→raport→matritsa | Qisman — skill jadval bor, LMS ulanmagan | **B9** (kurs tugadi→employee_skills) |
| EP-LMS-009 | O'tish bali kurs turiga qarab (TX 100%/oddiy 60-80%) | Qisman — konstanta bor, oqimga ulanmagan | **B2/B3** (`course_type`→`getCompletionSnapshot` threshold) |
| Q552 | Karta arxivlanganda darslik progress muzlaydi; voris boshidan | YO'Q — suspend trigger yo'q | DEFER (struktura: `enrollments.card_id` saqlanadi; suspend Faza 9 lifecycle) |
| Q562 | Universal kurs cross-card credit | YO'Q — `lms_cross_card_credits` jadval yo'q | **B1/B8** (jadval + gate-mantiq) |
| Q599 | O'quv tarixi karta yo'q bo'lsa ham xodim profilida (7 yil, RBAC) | Qisman — enrollments xodimga bog'liq | Qisman (`enrollments.card_id` tarix; 7-yil siyosat Faza-tashqari) |

---

## § 19. XAVF VA EHTIYOT (Q-39/Q-46 regress)

1. **`LmsCompletionService` PURE gate** — TEGMA. Faqat o'qiy/chaqirib ishlat. Testi `test/lms/lms-completion.service.spec.ts` hamon o'tishi shart (verify: `pnpm --filter @europrint/api test lms-completion`).
2. **Mavjud `findCoursesByCard`/`setCourseCard`/`by-card` endpointlar** — JONLI; SQL/route o'zgartirma, faqat kengaytir. Izohdagi "org_functions.id" → Faza 0'dan keyin `org_departments.id` (kommentni yangila, mantiq bir xil — cardId=karta-jadval-id).
3. **OrgNodeDetail 9 tab** — SAQLA; faqat 1 tab QO'SH (B7). Hech qaysi mavjud tab/funksiya o'chmaydi.
4. **`enrollments` unique index** (`employee_id, course_id`) — agar mavjud bo'lsa CREATE skip (IF NOT EXISTS); `saveEnrollment` allaqachon ON CONFLICT ishlatadi (drizzle-lms.repo.ts:154) → demak index BOR, lekin tasdiqla: `node _audit/q.cjs "SELECT indexname FROM pg_indexes WHERE tablename='enrollments'"`.
5. **FK (7)** — DATA 0 bo'lgani uchun xavfsiz; lekin mavjud `card_id` qiymatlari (agar bo'lsa) target jadvalda borligini tekshir, aks holda 23503 (E8).
6. **Faza 4 izoh** — bu fazada payroll handler O'ZGARMAYDI; faqat `LmsCardGateService` export. Payroll chaqirish = Faza 4 ishi.

---

*Yozildi: 2026-06-25. Manba: MASSIV-100 master-reja FAZA 07 + ORGSXEMA-INTERVYU-VS-HOLAT (darslik 20%) + decisions/01 (EP-ORG-027/028/029/088/116/122/Q552/Q562). Barcha fayl:satr va DB-fakt JONLI tasdiqlangan (q.cjs + Read/Grep). Q-47: ≥1000 qator.*
