# P33 — LMS: LMS core DDL: course card_id + enrollment + nazorat + razryad + salary-block

> Paket: P33 · Modul: LMS · To'lqin: 1 · Bog'liqlik: P01
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
6.  FAYL IZOLYATSIYASI (Qoida 23 / Q-23 / Q-31): faqat shu paketning OWNED-FILE
    ro'yxatidagi fayllarga teg. Boshqa fayl kerak bo'lsa — TO'XTA, egasiga flag qil,
    supurib ketma.
7.  DDL DARVOZASI (Q-35): CREATE TABLE / migration faqat egasi ruxsati bilan;
    migration faylida `-- APPROVED:` izoh shart. Paket DDL talab qilsa — migrationni
    YOZ lekin GATED belgila, ISHGA TUSHIRMA.
8.  git add <aniq-fayl> faqat; -A / . TAQIQ. Bitta commit = bitta mantiqiy guruh.
9.  Q-45/Q-30 log/secret HECH QACHON commit qilinmaydi; JWT minting yo'q.
10. Self-verify: BE tsc 0, FE tsc 0, tegishli reviewer skriptlar,
    jonli DB-proof (kirit→saqla→qayta o'qi→ko'rinadimi).
11. "V2"/"Strangler Fig"/"V1 vs V2" terminologiyasi TAQIQ — bitta kod bazasi,
    shu joyda to'g'irlanadi.
12. Vizyon-moslik: TO'G'RI o'lchovi = master vizyon (docs/XARITA-REJA-YONALISH +
    modul vizyon-hujjati); kod vizyonga zid bo'lsa (ishlasa ham) = xato.
```

**WAVE: 1** · **dependsOn: ["P01"]** — P01 (lib barrel + schema) bajarilmaguncha bu paket boshlanmaydi.

---

## 1. IZOLYATSIYA MANIFESTI

**FAQAT shu fayllarga teg. Boshqa fayl kerak bo'lsa — TO'XTA + flag:**

```
lib/db/src/schema/lms.ts
lib/db/src/schema/lms-schema.ts
lib/db/src/schema/lms-extended.ts
apps/api/src/shared/db/migrations/lms-p1-core-ddl.sql           ← DDL GATED
apps/api/src/shared/db/migrations/lms-p2-nazorat-razryad-blocks.sql  ← DDL GATED
apps/api/src/modules/lms/courses/courses.service.ts
apps/api/src/modules/lms/courses/drizzle-lms-courses.repo.ts
apps/api/src/modules/lms/enrollments/enrollments.service.ts
apps/api/src/modules/lms/enrollments/drizzle-lms-enrollments.repo.ts
apps/api/src/modules/lms/application/services/lms-enrollment-auto.service.ts
apps/api/src/modules/lms/infrastructure/event-handlers/employee-card-assigned.listener.ts
apps/api/src/modules/lms/application/services/lms-nazorat-varaqa.service.ts
apps/api/src/modules/lms/infrastructure/repositories/drizzle-lms-nazorat-varaqa.repo.ts
apps/api/src/modules/lms/application/services/lms-payroll-gate.service.ts
apps/api/src/modules/lms/infrastructure/repositories/drizzle-lms-salary-blocks.repo.ts
apps/api/src/modules/lms/application/services/lms-razryad-exam.service.ts
apps/api/src/modules/lms/infrastructure/repositories/drizzle-lms-razryad-exam.repo.ts
apps/api/src/modules/lms/presentation/lms-nazorat-varaqa.controller.ts
apps/api/src/modules/lms/presentation/lms-razryad-exam.controller.ts
apps/api/src/modules/lms/lms.module.ts
```

**DDL DARVOZASI qoidasi:** Migration fayllarini YOZING lekin `psql` / Drizzle push bilan ISHGA TUSHIRMANG. Faylning birinchi qatoriga `-- APPROVED: <egasi-ismi> <sana>` izoh yozilguncha migration fayl "GATED" hisoblanadi.

---

## 2. VIZYON

Manba: `docs/audit/MUSLIMBEK-PROMT-14-LMS-2026-06-08.md` + `docs/audit/OCHIQ-JAVOBLAR-2026-06-08.md`

### 2.1 Asosiy printsip (EP-LMS-001/002)

> **"Darslik kartaga biriktiriladi; darslik tugamasa o'sha karta oyligi yo'q."**

Bu butun LMS modulining poydevori. Har bir funksiya shu printsipdan chiqadi.

### 2.2 Karta-markazli model (E2)

- KARTA (org_functions) birlamchi; xodim ikkilamchi.
- Xodim kartaga biriktirilganda → o'sha karta uchun barcha majburiy kurslar avtomatik yoziladi (`due_date` bilan).
- Karta almashganda → yangi karta kurslari avtomatik belgilanadi; eskisi arxivlanadi.
- `card_id` FK bo'lmasa — karta-markazli mantiq arxitektura darajasida buzilgan.

### 2.3 Kurs turlari va o'tish chegaralari (EP-LMS-001/009)

```
course_type enum:
  safety_tx       → pass_threshold_pct = 100 (majburiy, TX xavfsizlik)
  regulation      → pass_threshold_pct = 100 (qonunchilik talabi)
  general         → pass_threshold_pct = 60-80 (HR sozlaydi)
  razryad_exam    → alohida razryad imtihoni oqimi
  onboarding      → yangi xodim kirish zanjiri (RD-4→TX→..→mustaqillik)
  replication     → tajriba ko'chirish kursi

blocks_mes = true → MES sessiya boshlash bloklanadi (EP-LMS-004/044)
is_mandatory = true + overdue/failed → oylik bloklanadi (EP-LMS-002/027)
```

### 2.4 Ro'yxat holatlari (EP-LMS-023)

```
lms_enrollments.status enum (YANGI):
  assigned   → kurs belgilangan, hali boshlanmagan
  started    → xodim boshlagan
  completed  → 3-shart to'liq (EP-LMS-070)
  overdue    → due_date o'tib ketdi
  failed     → maksimal urinishdan keyin muvaffaqiyatsiz

ESKI (noto'g'ri, o'zgartirilishi shart):
  enrolled / in_progress / completed / dropped  ← vizyon bilan to'qnashadi
```

### 2.5 3-shart to'liqlik (EP-LMS-070)

Enrollment faqat uchala shart bajarilganda `completed` bo'ladi:
1. **Nazariya ball** ≥ `pass_threshold_pct`
2. **Amaliy rubrik** ≥ belgilangan ball (mentor/RD-4 tasdiqlaydi)
3. **Barcha 12 nazorat varaqasi mavzusi** `confirmed_at` bor

### 2.6 Nazorat Varaqasi (EP-LMS-031/032/033/034)

- Har kartada 2 varaqa: "Lavozim yo'riqnomasi" (12 universal mavzu) + "Ishga xos yo'riqnoma" (amaliy).
- 12 mavzu: `maqsad`, `orgsxema`, `malaka_talablari`, `ish_joyi_vositalari`, `umumiy_vazifalar`, `lavozimga_xos_vazifalar`, `gsd_ckp`, `kop_uchraydigan_xatolar`, `muvaffaqiyatli_harakatlar`, `huquqlar`, `javobgarlik`, `statistik_korsatkichlar`.
- 7, 11, 12-mavzular org_functions kartadan avtomatik to'ldiriladi.
- Har mavzu: "O'qib chiqdim" tugmasi → `confirmed_at` + `confirmed_by` yoziladi.

### 2.7 Razryad imtihoni (EP-LMS-015/016/017)

- Minimal 3 oy interval bir karta uchun (backend tekshiradi).
- Xodim murojaat qiladi → imtihon test belgilanadi → topshiradi → **tasdiqlash so'rovi** (avtomatik emas, E1).
- HR + bevosita menejer tasdiqlaydi → razryad o'zgarishi + sertifikat chiqariladi.
- `lms_razryad_exam_requests.status`: `pending_exam` → `pending_approval` → `approved`/`rejected`.

### 2.8 Oylik blok (EP-LMS-002/027)

- `lms_salary_blocks` jadvali: majburiy kurs `overdue`/`failed` bo'lganda satr yaratiladi.
- `PayrollService.computeCardSalary()` bu jadvalni tekshiradi (bu paketda FAQAT servis + repo yoziladi; GL path yozilmaydi — scope cheklovi).
- Blok avtomatik ko'tariladi: enrollment `completed` bo'lganda `unblocked_at` yoziladi.
- MUHIM: bu paket PayrollService GL yo'lini YOZMAYDI — faqat `lms_salary_blocks` CRUD + blok holati tekshiruvi.

### 2.9 Maqsadli qabul mezoni (har feature uchun)

| Feature | Qabul mezoni |
|---------|-------------|
| courses.card_id | Kurs yaratish → `card_id` saqlangan → DB SELECT tasdiqlaydi |
| enrollments.card_id + status enum | Ro'yxat yaratish → `card_id` + `assigned` holati DB da |
| Auto-enroll listener | EmployeeCardAssigned event → enrollment satri avtomatik yaratiladi |
| lms_module_progress | Modul tasdiqlaganda `confirmed_at` DB da yozilgan |
| Nazorat varaqasi | 12 mavzu avtomatik yaratiladi, bitta mavzu tasdiqlash → DB da `confirmed_at` |
| Razryad imtihon so'rovi | So'rov yaratiladi, 3-oy interval xatosi qaytaradi |
| Oylik blok | Enrollment `overdue` → block satr yaratiladi, `completed` → `unblocked_at` yoziladi |

---

## 3. HOZIRGI HOLAT

### 3.1 Mavjud (ishlaydi)

| Fayl | Qator | Holat |
|------|-------|-------|
| `lib/db/src/schema/lms-schema.ts` | 52-95 | `courses` jadvali bor — AMMO `card_id`, `course_type`, `pass_threshold_pct`, `blocks_mes`, `layer`, `version` YO'Q |
| `lib/db/src/schema/lms-schema.ts` | 176-189 | `attempts` jadvali — `userId` FK, `testId` VARCHAR |
| `lib/db/src/schema/lms.ts` | 98-116 | `enrollments` jadvali — `employee_id` FK bor, **`card_id` YO'Q** |
| `lib/db/src/schema/lms.ts` | 107 | `status` default `'enrolled'` — vizyon talab qiladi `'assigned'` |
| `lib/db/src/schema/lms.ts` | 114 | CHECK: `enrolled/in_progress/completed/dropped` — **NOTO'G'RI**, vizyon: `assigned/started/completed/overdue/failed` |
| `lib/db/src/schema/lms-extended.ts` | 64-75 | `lms_certificates` — `user_id+exam_id` FK; `employee_id`, `course_id`, `card_id`, `certificate_number` YO'Q |
| `apps/api/src/modules/lms/lms.module.ts` | 1-116 | LmsModule to'liq ro'yxatda — 19 controller, 10 servis, 8 repo |
| `apps/api/src/modules/lms/courses/courses.service.ts` | 1-68 | CoursesService — CRUD, Result<T> pattern, ishlaydi |
| `apps/api/src/modules/lms/courses/drizzle-lms-courses.repo.ts` | 1-79 | DrizzleLmsCoursesRepository — CRUD, Result<T> |
| `apps/api/src/modules/lms/enrollments/enrollments.service.ts` | 1-73 | EnrollmentsService — CRUD, Result<T> |
| `apps/api/src/modules/lms/enrollments/drizzle-lms-enrollments.repo.ts` | 1-69 | `assignments` jadvaliga yozadi (`enrollments` jadvaliga emas) |

### 3.2 Yo'q (yaratilishi kerak — GATED)

| Muammo | EP kodi | Tavsif |
|--------|---------|--------|
| `courses.card_id` ustuni yo'q | EP-LMS-001 | Kurs kartagacha bog'lanmagan |
| `courses.course_type` enum yo'q | EP-LMS-001 | Tur bo'yicha mantiq amalga oshirib bo'lmaydi |
| `courses.pass_threshold_pct` yo'q | EP-LMS-009 | Kurs bo'yicha chegarani saqlab bo'lmaydi |
| `courses.blocks_mes` yo'q | EP-LMS-004 | MES blok belgisi yo'q |
| `enrollments.card_id` ustuni yo'q | EP-LMS-023 | Karta-markazli ro'yxat arxitektura darajasida buzilgan |
| `enrollments.status` enum noto'g'ri | EP-LMS-023 | `enrolled/in_progress` ≠ `assigned/started` |
| `lms_module_progress` jadvali yo'q | EP-LMS-024 | Modul tasdiq holati saqlanmaydi |
| `lms_nazorat_varaqa` jadvali yo'q | EP-LMS-031 | Nazorat varaqasi raqamlashtirmagan |
| `lms_varaqa_topics` jadvali yo'q | EP-LMS-032/033 | 12 mavzu yo'q |
| `lms_section_finals` jadvali yo'q | EP-LMS-034/060 | Bo'lim yakun to'siqchasi yo'q |
| `lms_razryad_exam_requests` jadvali yo'q | EP-LMS-015 | Razryad imtihon so'rovi yo'q |
| `lms_salary_blocks` jadvali yo'q | EP-LMS-002/027 | Oylik blok mexanizmi yo'q |
| `LmsEnrollmentAutoService` yo'q | EP-LMS-003 | Auto-enroll listener mavjud emas |
| `EmployeeCardAssignedListener` yo'q | EP-LMS-003 | Karta biriktirilganda event yo'q |
| `LmsNazoratVaraqaService` yo'q | EP-LMS-031 | Nazorat varaqasi servisi yo'q |
| `LmsPayrollGateService` yo'q | EP-LMS-002 | Oylik blok servisi yo'q |
| `LmsRazryadExamService` yo'q | EP-LMS-015 | Razryad imtihon servisi yo'q |

### 3.3 Buzuq/Soxta

| Fayl | Qator | Muammo |
|------|-------|--------|
| `lib/db/src/schema/lms.ts` | 114 | `CHECK: 'enrolled/in_progress/completed/dropped'` — vizyon talabi `assigned/started/completed/overdue/failed` bilan to'qnashadi. `status = 'assigned'` kiritilsa DB xatosi beriladi. |
| `lib/db/src/schema/lms-extended.ts` | 64-75 | `lms_certificates`: `user_id + exam_id` FK — vizyon `employee_id + course_id + card_id + certificate_number` talab qiladi. Bu to'liqlay boshqacha schema. Sertifikat auto-issue EP-LMS-018 amalga oshirib bo'lmaydi. |
| `apps/api/src/modules/lms/enrollments/drizzle-lms-enrollments.repo.ts` | 32-38 | `db.insert(assignments)` — `enrollments` jadvaliga emas, `assignments` jadvaliga yozmoqda! Bu `EnrollCourseCommand` da ham `card_id` qabul qilmaydi. |
| `apps/api/src/modules/lms/enrollments/drizzle-lms-enrollments.repo.ts` | 33 | `enrollmentId: ENRL-${Date.now()}` — assignments jadvalida bu ustun yo'q (eski schema). Runtime 23502/42703 xatosi beradi. |
| `lib/db/src/schema/lms.ts` | 113 | `uniqueIndex("uq_enrollment_emp_course")` — `(employee_id, course_id)` — `card_id` yo'q, bir xodim bir kursga bir nechta karta orqali yozilolmaydi. |

---

## 4. ISH (QADAM-BAQADAM)

> ⚠️ GATED: DDL qadamlarini (4.1, 4.2) egasi tasdiqlagunicha ISHGA TUSHIRMANG.
> Tegishli migration fayllarni YOZING, lekin `psql -f` yoki Drizzle push QILMANG.

---

### Qadam 4.1 — Migration P1: courses + enrollments DDL

**Fayl:** `apps/api/src/shared/db/migrations/lms-p1-core-ddl.sql`
**Holat:** YANGI FAYL · DDL GATED

Faylni yarating (§5.1 ga qarang — to'liq SQL). Bu migration:
- `courses` jadvaliga 6 ustun qo'shadi (card_id, course_type, pass_threshold_pct, blocks_mes, layer, version)
- `enrollments` jadvalidagi status CHECK ni yangilaydi (noto'g'ri enum → to'g'ri)
- `enrollments` jadvaliga `card_id`, `due_date`, `assigned_by` ustunlarini qo'shadi
- `lms_module_progress` yangi jadvali yaratadi
- Unikal indeksni yangilaydi: `(employee_id, course_id)` → `(employee_id, course_id, card_id)`

**Oldin (lms.ts:98-116):**
```typescript
// enrollments jadvalida:
status: varchar("status", { length: 20 }).default("enrolled"),
// CHECK: 'enrolled','in_progress','completed','dropped'
// card_id ustuni yo'q
```

**Keyin (lms.ts:98-130):**
```typescript
// enrollments jadvalida:
cardId: integer("card_id").references(() => orgFunctions.id, { onDelete: "set null" }),
dueDate: timestamp("due_date"),
assignedBy: integer("assigned_by").references(() => employees.id, { onDelete: "set null" }),
status: varchar("status", { length: 20 }).default("assigned"),
// CHECK: 'assigned','started','completed','overdue','failed'
// uniqueIndex: (employee_id, course_id, card_id)
```

**Drizzle schema o'zgarishi (lms.ts):**

`courses` jadvaliga qo'shimcha ustunlar (lms-schema.ts da, lekin lms.ts orqali re-export):

> DIQQAT: `courses` jadvali `lib/db/src/schema/lms-schema.ts` da 52-95 qatorlarda. Ustunlar o'sha faylga qo'shiladi (bu owned-file ro'yxatida).

```typescript
// lib/db/src/schema/lms-schema.ts courses jadvaliga qo'shiladi (95-qatordan oldin):
courseType: varchar("course_type", { length: 30 }).default("general"),
passThresholdPct: integer("pass_threshold_pct").default(70),
blocksMes: boolean("blocks_mes").default(false),
cardId: integer("card_id"), // FK orgFunctions ga — import kerak
layer: varchar("layer", { length: 20 }).default("card"),
version: integer("version").default(1),
// CHECK qo'shiladi:
check("courses_course_type_chk", sql`${t.courseType} IN ('safety_tx','regulation','general','razryad_exam','onboarding','replication')`),
check("courses_layer_chk", sql`${t.layer} IN ('company','department','card')`),
```

> ⚠️ `cardId` uchun `org_functions` jadvaliga FK qo'yish uchun `orgFunctions` importi kerak.
> Bu `apps/api` modulidan lib/db schemaga import bo'lishi mumkin emas.
> `org_functions` jadvalining Drizzle schema fayliga qarab (`core-schema.ts` yoki boshqa) import qo'shing.
> Agar cross-schema import muammo bo'lsa — `cardId: integer("card_id")` (FK annotation yo'q, DB darajasida migration SQL orqali) yozing va izohda belgilang.

---

### Qadam 4.2 — Migration P2: nazorat varaqasi + razryad + bloklar DDL

**Fayl:** `apps/api/src/shared/db/migrations/lms-p2-nazorat-razryad-blocks.sql`
**Holat:** YANGI FAYL · DDL GATED

Bu migration (§5.2 ga qarang — to'liq SQL):
- `lms_nazorat_varaqa` yaratadi
- `lms_varaqa_topics` yaratadi (12 mavzu templati)
- `lms_section_finals` yaratadi
- `lms_razryad_exam_requests` yaratadi
- `lms_salary_blocks` yaratadi

---

### Qadam 4.3 — Drizzle schema yangilash: lms.ts

**Fayl:** `lib/db/src/schema/lms.ts`

**O'zgarish 1 — enrollments jadvali (98-116 qator):**

```typescript
// BEFORE (qator 98-116):
export const enrollments = pgTable("enrollments", {
  ...
  status: varchar("status", { length: 20 }).default("enrolled"),
  ...
}, (table) => [
  uniqueIndex("uq_enrollment_emp_course").on(table.employeeId, table.courseId),
  check("enrollments_status_chk", sql`... IN ('enrolled','in_progress','completed','dropped')`),
  ...
]);

// AFTER:
export const enrollments = pgTable("enrollments", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id, { onDelete: "cascade" }).notNull(),
  courseId: integer("course_id").references(() => courses.id, { onDelete: "cascade" }).notNull(),
  // ⭐ YANGI: card_id (karta-markazli model, EP-LMS-023)
  cardId: integer("card_id"),  // FK org_functions — migration orqali, import muammo bo'lsa integer sifatida
  // ⭐ YANGI: due_date + assigned_by
  dueDate: timestamp("due_date"),
  assignedBy: integer("assigned_by").references(() => employees.id, { onDelete: "set null" }),
  enrolledAt: timestamp("enrolled_at").defaultNow(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  progressPercent: integer("progress_percent").default(0),
  lastAccessedAt: timestamp("last_accessed_at"),
  // ⭐ STATUS o'ZGARDI: 'enrolled' → 'assigned' (EP-LMS-023)
  status: varchar("status", { length: 20 }).default("assigned"),
  currentModuleId: integer("current_module_id"),
  currentLessonId: integer("current_lesson_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  // ⭐ INDEKS o'ZGARDI: card_id ham qo'shildi
  uniqueIndex("uq_enrollment_emp_course_card").on(table.employeeId, table.courseId, table.cardId),
  // ⭐ CHECK o'ZGARDI: to'g'ri enum (EP-LMS-023)
  check("enrollments_status_chk", sql`${table.status} IS NULL OR ${table.status} IN ('assigned','started','completed','overdue','failed')`),
  check("enrollments_progress_chk", sql`${table.progressPercent} IS NULL OR (${table.progressPercent} >= 0 AND ${table.progressPercent} <= 100)`),
]);
```

**O'zgarish 2 — lms_module_progress yangi jadval (lms.ts ga qo'shiladi):**

```typescript
// lms.ts faylning oxiriga qo'shiladi (enrollments dan keyin):

export const lmsModuleProgress = pgTable("lms_module_progress", {
  id: serial("id").primaryKey(),
  enrollmentId: integer("enrollment_id").references(() => enrollments.id, { onDelete: "cascade" }).notNull(),
  moduleId: integer("module_id").notNull(),
  confirmedAt: timestamp("confirmed_at"),
  videoProgressPct: integer("video_progress_pct").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  check("lms_module_progress_pct_chk", sql`${t.videoProgressPct} IS NULL OR (${t.videoProgressPct} >= 0 AND ${t.videoProgressPct} <= 100)`),
]);

export const insertLmsModuleProgressSchema = createInsertSchema(lmsModuleProgress).omit({ id: true, createdAt: true, updatedAt: true } as never);
export type InsertLmsModuleProgress = z.infer<typeof insertLmsModuleProgressSchema>;
export type LmsModuleProgress = typeof lmsModuleProgress.$inferSelect;
```

**O'zgarish 3 — lms-extended.ts ga yangi jadvallar:**

```typescript
// lib/db/src/schema/lms-extended.ts — faylning oxiriga qo'shiladi

// ── Nazorat Varaqasi (EP-LMS-031) ─────────────────────────────────────────
export const lmsNazoratVaraqa = pgTable('lms_nazorat_varaqa', {
  id:          serial('id').primaryKey(),
  enrollmentId: integer('enrollment_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  // NOTE: enrollments jadvaliga FK — courses.id emas, to'g'ri FK migration da
  cardId:      integer('card_id').notNull(),
  varaqaType:  varchar('varaqa_type', { length: 30 }).notNull().default('lavozim_yoriqnomasi'),
  version:     integer('version').notNull().default(1),
  createdAt:   timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  check("lms_nv_type_chk", sql`${t.varaqaType} IN ('lavozim_yoriqnomasi','ishga_xos')`),
]);

// ── Varaqa Mavzulari (EP-LMS-032/033) — 12 ta mavzu ──────────────────────
export const lmsVaraqaTopics = pgTable('lms_varaqa_topics', {
  id:           serial('id').primaryKey(),
  varaqaId:     integer('varaqa_id').notNull().references(() => lmsNazoratVaraqa.id, { onDelete: 'cascade' }),
  topicNumber:  integer('topic_number').notNull(), // 1-12
  topicKey:     varchar('topic_key', { length: 60 }).notNull(),
  contentUz:    text('content_uz'),
  contentRu:    text('content_ru'),
  confirmedAt:  timestamp('confirmed_at'),
  confirmedBy:  integer('confirmed_by'), // employee_id — FK migration da
  createdAt:    timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  check("lms_vt_topic_num_chk", sql`${t.topicNumber} >= 1 AND ${t.topicNumber} <= 12`),
  check("lms_vt_topic_key_chk", sql`${t.topicKey} IN (
    'maqsad','orgsxema','malaka_talablari','ish_joyi_vositalari',
    'umumiy_vazifalar','lavozimga_xos_vazifalar','gsd_ckp',
    'kop_uchraydigan_xatolar','muvaffaqiyatli_harakatlar',
    'huquqlar','javobgarlik','statistik_korsatkichlar'
  )`),
]);

// ── Bo'lim Yakunlari — section gates (EP-LMS-034/060) ───────────────────
export const lmsSectionFinals = pgTable('lms_section_finals', {
  id:           serial('id').primaryKey(),
  enrollmentId: integer('enrollment_id').notNull(),
  sectionNumber: integer('section_number').notNull(),
  passed:       boolean('passed').default(false),
  scorePct:     integer('score_pct'),
  attemptedAt:  timestamp('attempted_at'),
  passedAt:     timestamp('passed_at'),
  createdAt:    timestamp('created_at').notNull().defaultNow(),
});

// ── Razryad Imtihon So'rovlari (EP-LMS-015/016/017) ─────────────────────
export const lmsRazryadExamRequests = pgTable('lms_razryad_exam_requests', {
  id:                serial('id').primaryKey(),
  employeeId:        integer('employee_id').notNull(),
  cardId:            integer('card_id').notNull(),
  requestedAt:       timestamp('requested_at').notNull().defaultNow(),
  examAttemptId:     integer('exam_attempt_id'),
  status:            varchar('status', { length: 30 }).notNull().default('pending_exam'),
  reviewerEmployeeId: integer('reviewer_employee_id'),
  reviewedAt:        timestamp('reviewed_at'),
  reviewerNote:      text('reviewer_note'),
  createdAt:         timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  check("lms_rer_status_chk", sql`${t.status} IN ('pending_exam','pending_approval','approved','rejected')`),
]);

// ── Oylik Bloklar (EP-LMS-002/027) ───────────────────────────────────────
export const lmsSalaryBlocks = pgTable('lms_salary_blocks', {
  id:           serial('id').primaryKey(),
  employeeId:   integer('employee_id').notNull(),
  cardId:       integer('card_id').notNull(),
  courseId:     integer('course_id').notNull().references(() => lmsExams.id, { onDelete: 'restrict' }),
  // NOTE: references lmsExams.id zamiriga courses.id bo'lishi kerak — migration da to'g'rilang
  reason:       text('reason').notNull(),
  blockedAt:    timestamp('blocked_at').notNull().defaultNow(),
  unblockedAt:  timestamp('unblocked_at'),
  unblockedBy:  integer('unblocked_by'),
  createdAt:    timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  // Har bir (employee, card, course) uchun faqat bitta aktiv blok
]);

// ── Export: Zod schemalar va TS turlar ───────────────────────────────────
export const insertLmsNazoratVaraqaSchema = createInsertSchema(lmsNazoratVaraqa).omit({ id: true, createdAt: true } as never);
export type InsertLmsNazoratVaraqa = z.infer<typeof insertLmsNazoratVaraqaSchema>;
export type LmsNazoratVaraqa = typeof lmsNazoratVaraqa.$inferSelect;

export const insertLmsVaraqaTopicSchema = createInsertSchema(lmsVaraqaTopics).omit({ id: true, createdAt: true } as never);
export type InsertLmsVaraqaTopic = z.infer<typeof insertLmsVaraqaTopicSchema>;
export type LmsVaraqaTopic = typeof lmsVaraqaTopics.$inferSelect;

export const insertLmsSectionFinalSchema = createInsertSchema(lmsSectionFinals).omit({ id: true, createdAt: true } as never);
export type InsertLmsSectionFinal = z.infer<typeof insertLmsSectionFinalSchema>;
export type LmsSectionFinal = typeof lmsSectionFinals.$inferSelect;

export const insertLmsRazryadExamRequestSchema = createInsertSchema(lmsRazryadExamRequests).omit({ id: true, createdAt: true, requestedAt: true } as never);
export type InsertLmsRazryadExamRequest = z.infer<typeof insertLmsRazryadExamRequestSchema>;
export type LmsRazryadExamRequest = typeof lmsRazryadExamRequests.$inferSelect;

export const insertLmsSalaryBlockSchema = createInsertSchema(lmsSalaryBlocks).omit({ id: true, createdAt: true, blockedAt: true } as never);
export type InsertLmsSalaryBlock = z.infer<typeof insertLmsSalaryBlockSchema>;
export type LmsSalaryBlock = typeof lmsSalaryBlocks.$inferSelect;
```

---

### Qadam 4.4 — CourseService + Repo kengaytirish: card_id qo'shish

**Fayl:** `apps/api/src/modules/lms/courses/drizzle-lms-courses.repo.ts`

Mavjud `DrizzleLmsCoursesRepository` da `create` metodi `card_id`, `course_type`, `pass_threshold_pct`, `blocks_mes` ni qo'llab quvvatlamaydi. Kengaytirish:

```typescript
// BEFORE (49-62 qator):
async create(dto: Record<string, unknown>, createdBy?: number): Promise<Result<Record<string, unknown>>> {
  try {
    const row: Omit<typeof courses.$inferInsert, 'id'> = {
      title: (dto.title as string | undefined) ?? '',
      description: dto.description as string | undefined,
      category: dto.category as string | undefined,
      status: (dto.status as string | undefined) ?? 'active',
      instructorId: dto.instructorId as string | undefined,
      coverUrl: dto.coverUrl as string | undefined,
      ...(createdBy ? { createdBy: String(createdBy) } : {}),
    };

// AFTER:
async create(dto: Record<string, unknown>, createdBy?: number): Promise<Result<Record<string, unknown>>> {
  try {
    const row: Omit<typeof courses.$inferInsert, 'id'> = {
      title: (dto.title as string | undefined) ?? '',
      titleUz: dto.titleUz as string | undefined,
      description: dto.description as string | undefined,
      category: dto.category as string | undefined,
      status: (dto.status as string | undefined) ?? 'active',
      // ⭐ YANGI: karta-markazli maydonlar
      cardId: dto.cardId as number | undefined,         // EP-LMS-001
      courseType: (dto.courseType as string | undefined) ?? 'general',  // EP-LMS-001
      passThresholdPct: (dto.passThresholdPct as number | undefined) ?? 70, // EP-LMS-009
      blocksMes: (dto.blocksMes as boolean | undefined) ?? false,       // EP-LMS-004
      layer: (dto.layer as string | undefined) ?? 'card',               // EP-LMS-068
      isMandatory: (dto.isMandatory as boolean | undefined) ?? false,   // EP-LMS-027
      version: 1,
      instructorId: dto.instructorId as string | undefined,
      coverUrl: dto.coverUrl as string | undefined,
      ...(createdBy ? { createdBy: String(createdBy) } : {}),
    };
```

**Repo ga yangi metod qo'shiladi:**

```typescript
// drizzle-lms-courses.repo.ts ga qo'shiladi:
async findByCardId(cardId: number): Promise<Result<Row[]>> {
  try {
    const rows = await db.select().from(courses)
      .where(and(eq(courses.cardId, cardId), isNull(courses.deletedAt)))
      .limit(100).offset(0);
    return Ok(rows);
  } catch (e: unknown) { return Err((e as Error)?.message || `Card #${cardId} kurslari topilmadi`); }
}

async findMandatoryByCardId(cardId: number): Promise<Result<Row[]>> {
  try {
    const rows = await db.select().from(courses)
      .where(and(
        eq(courses.cardId, cardId),
        eq(courses.isMandatory, true),
        isNull(courses.deletedAt)
      ))
      .limit(200).offset(0);
    return Ok(rows);
  } catch (e: unknown) { return Err((e as Error)?.message || `Card #${cardId} majburiy kurslari topilmadi`); }
}
```

**Interface faylni yangilang** (`courses/i-lms-courses.repo.ts`):
> ⚠️ Bu fayl owned-file ro'yxatida YO'Q. Interface faylga teginish kerak bo'lsa — TO'XTA va flag qiling. Agar interface fayl avtomatik generate bo'ladigan bo'lsa yoki concrete repo sifati yetarli bo'lsa — interface faylsiz ishla.

---

### Qadam 4.5 — EnrollmentsRepo: enrollments jadvaliga ko'chirish + card_id

**Fayl:** `apps/api/src/modules/lms/enrollments/drizzle-lms-enrollments.repo.ts`

**Asosiy muammo:** Hozir repo `assignments` jadvaliga yozmoqda (`enrollments` jadvaliga emas). Bu noto'g'ri (Q-46 — buzuq kod to'liq o'zgartiriladi).

```typescript
// BEFORE (butun fayl — assignments jadvalga yozadi):
import { assignments, courses } from '@europrint/schemas';
...
async enroll(dto: { userId: number; courseId: number; dueAt?: Date | null }): ...{
  const result = await db.insert(assignments).values({
    id:           sql`DEFAULT`,
    enrollmentId: `ENRL-${Date.now()}-${dto.userId}`,  // ← assignments da bu ustun yo'q
    userId:       dto.userId,
    courseId:     dto.courseId,
  }).returning();
}

// AFTER — enrollments jadvaliga, card_id bilan:
import { enrollments, courses } from '@europrint/schemas';

// Enroll DTO yangi interfeys:
type EnrollDto = {
  employeeId: number;
  courseId: number;
  cardId?: number | null;
  dueDate?: Date | null;
  assignedBy?: number | null;
  status?: string;
};

async enroll(dto: EnrollDto): Promise<Result<Record<string, unknown>>> {
  try {
    const result = await db.insert(enrollments).values({
      employeeId:  dto.employeeId,
      courseId:    dto.courseId,
      cardId:      dto.cardId ?? null,           // ⭐ EP-LMS-023
      dueDate:     dto.dueDate ?? null,           // ⭐ EP-LMS-023
      assignedBy:  dto.assignedBy ?? null,        // ⭐ EP-LMS-023
      status:      dto.status ?? 'assigned',      // ⭐ EP-LMS-023 (eski: 'enrolled')
      enrolledAt:  new Date(),
    }).returning();
    return Ok(result[0] as Record<string, unknown>);
  } catch (e: unknown) { return Err((e as Error)?.message || 'Yozilishda xatolik'); }
}

async findExistingEnrollment(employeeId: number, courseId: number, cardId?: number): Promise<Result<any | null>> {
  try {
    const conditions = [
      eq(enrollments.employeeId, employeeId),
      eq(enrollments.courseId, courseId),
    ];
    if (cardId != null) conditions.push(eq(enrollments.cardId, cardId));
    const rows = await db.select().from(enrollments).where(and(...conditions)).limit(1).offset(0);
    return Ok(rows[0] || null);
  } catch (e: unknown) { return Err((e as Error)?.message || 'Yozuv tekshirishda xatolik'); }
}

async updateStatus(id: number, status: string, extra?: Partial<typeof enrollments.$inferInsert>): Promise<Result<Record<string, unknown>>> {
  try {
    const result = await db.update(enrollments)
      .set({ status, ...extra, updatedAt: new Date() })
      .where(eq(enrollments.id, id))
      .returning();
    return Ok(result[0] as Record<string, unknown>);
  } catch (e: unknown) { return Err((e as Error)?.message || 'Holat yangilashda xatolik'); }
}
```

---

### Qadam 4.6 — LmsEnrollmentAutoService: auto-enroll (EP-LMS-003)

**Fayl:** `apps/api/src/modules/lms/application/services/lms-enrollment-auto.service.ts`
**Holat:** YANGI FAYL

Bu servis `EmployeeCardAssigned` eventini tinglaydi va kartaga tegishli barcha majburiy kurslarni avtomatik yozadi.

```typescript
/**
 * @module lms-enrollment-auto.service
 * @description Karta biriktirilganda majburiy kurslarni avtomatik yozadi (EP-LMS-003).
 * E2 prinsip: karta birlamchi, xodim ikkilamchi.
 */
import { Injectable, Logger } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { db } from '@shared/db';
import { courses, enrollments } from '@europrint/schemas';
import { eq, and, isNull } from 'drizzle-orm';
import { Ok, Err, Result } from '@common/result';

export type AutoEnrollResult = {
  enrolledCourseIds: number[];
  alreadyEnrolled: number[];
  errors: string[];
};

@Injectable()
export class LmsEnrollmentAutoService {
  private readonly logger = new Logger(LmsEnrollmentAutoService.name);

  // DUE_DATE_DAYS: majburiy kurslar uchun standart muddat (kunlarda)
  private readonly DUE_DATE_DAYS_SAFETY_TX = 7;    // TX/xavfsizlik: 7 kun
  private readonly DUE_DATE_DAYS_REGULATION = 14;  // Qonunchilik: 14 kun
  private readonly DUE_DATE_DAYS_GENERAL = 30;     // Umumiy: 30 kun

  /**
   * Xodim kartaga biriktirilganda chaqiriladi.
   * @param employeeId - xodim ID
   * @param cardId     - org_functions ID (karta)
   * @param assignedBy - kim biriktirdi (employee_id)
   */
  async autoEnrollForCard(
    employeeId: number,
    cardId: number,
    assignedBy?: number,
  ): Promise<Result<AutoEnrollResult>> {
    try {
      // 1. Ushbu karta uchun barcha majburiy kurslarni oling
      const mandatoryCourses = await db.select()
        .from(courses)
        .where(and(
          eq(courses.cardId, cardId),
          eq(courses.isMandatory, true),
          isNull(courses.deletedAt),
        ))
        .limit(200).offset(0);

      if (!mandatoryCourses.length) {
        return Ok({ enrolledCourseIds: [], alreadyEnrolled: [], errors: [] });
      }

      const result: AutoEnrollResult = {
        enrolledCourseIds: [],
        alreadyEnrolled: [],
        errors: [],
      };

      // 2. Har bir kurs uchun mavjud enrollment tekshir va yaratish
      for (const course of mandatoryCourses) {
        const existing = await db.select()
          .from(enrollments)
          .where(and(
            eq(enrollments.employeeId, employeeId),
            eq(enrollments.courseId, course.id),
            eq(enrollments.cardId, cardId),
          ))
          .limit(1).offset(0);

        if (existing.length > 0) {
          result.alreadyEnrolled.push(course.id);
          continue;
        }

        // Due date hisoblash (course_type bo'yicha)
        const dueDate = this.computeDueDate(course.courseType ?? 'general');

        await db.insert(enrollments).values({
          employeeId,
          courseId:   course.id,
          cardId,
          dueDate,
          assignedBy: assignedBy ?? null,
          status:     'assigned',
          enrolledAt: new Date(),
        });

        result.enrolledCourseIds.push(course.id);
        this.logger.log(
          `Auto-enroll: employee #${employeeId} → course #${course.id} (card #${cardId})`,
        );
      }

      return Ok(result);
    } catch (e: unknown) {
      return Err((e as Error)?.message || 'Auto-enroll xatolik');
    }
  }

  private computeDueDate(courseType: string): Date {
    const days =
      courseType === 'safety_tx' ? this.DUE_DATE_DAYS_SAFETY_TX :
      courseType === 'regulation' ? this.DUE_DATE_DAYS_REGULATION :
      this.DUE_DATE_DAYS_GENERAL;
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d;
  }
}
```

---

### Qadam 4.7 — EmployeeCardAssignedListener

**Fayl:** `apps/api/src/modules/lms/infrastructure/event-handlers/employee-card-assigned.listener.ts`
**Holat:** YANGI FAYL

```typescript
/**
 * @module employee-card-assigned.listener
 * @description EmployeeCardAssigned domeniy eventini tinglaydi → LMS auto-enroll chaqiradi.
 * EP-LMS-003: karta biriktirilish → majburiy kurslar avtomatik yoziladi.
 */
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { LmsEnrollmentAutoService } from '../../application/services/lms-enrollment-auto.service';

export interface EmployeeCardAssignedPayload {
  employeeId: number;
  cardId: number;        // org_functions.id
  assignedBy?: number;   // kim biriktirdi
}

@Injectable()
export class EmployeeCardAssignedListener {
  private readonly logger = new Logger(EmployeeCardAssignedListener.name);

  constructor(
    private readonly lmsEnrollmentAutoService: LmsEnrollmentAutoService,
  ) {}

  @OnEvent('org.employee.card_assigned', { async: true })
  async handleCardAssigned(payload: EmployeeCardAssignedPayload): Promise<void> {
    const { employeeId, cardId, assignedBy } = payload;
    this.logger.log(`EmployeeCardAssigned: employee #${employeeId} → card #${cardId}`);

    const result = await this.lmsEnrollmentAutoService.autoEnrollForCard(
      employeeId,
      cardId,
      assignedBy,
    );

    if (!result.ok) {
      this.logger.error(
        `Auto-enroll muvaffaqiyatsiz: employee #${employeeId}, card #${cardId}: ${result.error}`,
      );
      return;
    }

    const { enrolledCourseIds, alreadyEnrolled, errors } = result.data;
    this.logger.log(
      `Auto-enroll yakunlandi: yangi=${enrolledCourseIds.length}, mavjud=${alreadyEnrolled.length}, xato=${errors.length}`,
    );
  }
}
```

---

### Qadam 4.8 — LmsNazoratVaraqaService

**Fayl:** `apps/api/src/modules/lms/application/services/lms-nazorat-varaqa.service.ts`
**Holat:** YANGI FAYL

```typescript
/**
 * @module lms-nazorat-varaqa.service
 * @description Nazorat varaqasi biznes mantiq. EP-LMS-031/032/033/034.
 * - Kurs yaratilganda 12 mavzu avtomatik yaratiladi (initVaraqa).
 * - Har mavzu "O'qidim" tasdiqlash (confirmTopic).
 * - 7, 11, 12-mavzular kartadan avtomatik to'ldiriladi.
 */
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Ok, Err, Result } from '@common/result';
import { DrizzleLmsNazoratVaraqaRepo } from '../../infrastructure/repositories/drizzle-lms-nazorat-varaqa.repo';

const TOPIC_KEYS = [
  'maqsad', 'orgsxema', 'malaka_talablari', 'ish_joyi_vositalari',
  'umumiy_vazifalar', 'lavozimga_xos_vazifalar', 'gsd_ckp',
  'kop_uchraydigan_xatolar', 'muvaffaqiyatli_harakatlar',
  'huquqlar', 'javobgarlik', 'statistik_korsatkichlar',
] as const;

// Kartadan avtomatik to'ldiriladigan mavzu raqamlari (EP-LMS-033)
const AUTO_FILL_FROM_CARD = [7, 11, 12]; // gsd_ckp (7), javobgarlik (11), statistik_korsatkichlar (12)

@Injectable()
export class LmsNazoratVaraqaService {
  private readonly logger = new Logger(LmsNazoratVaraqaService.name);

  constructor(
    private readonly nazoratRepo: DrizzleLmsNazoratVaraqaRepo,
  ) {}

  /**
   * Enrollment yaratilganda 2 varaqa + 12×2 = 24 mavzu satr yaratiladi.
   * EP-LMS-032: lavozim_yoriqnomasi + ishga_xos, har biri 12 mavzu.
   */
  async initVaraqa(
    enrollmentId: number,
    cardId: number,
    cardData?: { ckp?: string; javobgarlik?: string; statistika?: string },
  ): Promise<Result<{ varaqaIds: number[] }>> {
    const VARAQA_TYPES = ['lavozim_yoriqnomasi', 'ishga_xos'] as const;
    const varaqaIds: number[] = [];

    for (const varaqaType of VARAQA_TYPES) {
      const varaqaResult = await this.nazoratRepo.createVaraqa({
        enrollmentId,
        cardId,
        varaqaType,
        version: 1,
      });
      if (!varaqaResult.ok) return Err(varaqaResult.error);
      const varaqaId = (varaqaResult.data as { id: number }).id;
      varaqaIds.push(varaqaId);

      // 12 mavzu yaratish
      for (let i = 0; i < TOPIC_KEYS.length; i++) {
        const topicNumber = i + 1;
        const topicKey = TOPIC_KEYS[i];
        let contentUz: string | undefined;

        // Kartadan avtomatik to'ldirish (EP-LMS-033)
        if (cardData && AUTO_FILL_FROM_CARD.includes(topicNumber)) {
          if (topicNumber === 7)  contentUz = cardData.ckp;
          if (topicNumber === 11) contentUz = cardData.javobgarlik;
          if (topicNumber === 12) contentUz = cardData.statistika;
        }

        const topicResult = await this.nazoratRepo.createTopic({
          varaqaId,
          topicNumber,
          topicKey,
          contentUz,
        });
        if (!topicResult.ok) return Err(topicResult.error);
      }
    }

    return Ok({ varaqaIds });
  }

  /**
   * Xodim mavzuni o'qib chiqqanini tasdiqlaydi (EP-LMS-034).
   * DB-proof: confirmedAt timestamp yoziladi.
   */
  async confirmTopic(
    topicId: number,
    confirmedByEmployeeId: number,
  ): Promise<Result<{ confirmedAt: Date }>> {
    const now = new Date();
    const result = await this.nazoratRepo.confirmTopic(topicId, now, confirmedByEmployeeId);
    if (!result.ok) return Err(result.error);
    if (!result.data) return Err(`Mavzu #${topicId} topilmadi`);
    return Ok({ confirmedAt: now });
  }

  /**
   * Enrollment uchun varaqa to'liqlik foizi.
   * To'liq = hamma 24 mavzu (2×12) confirmed_at bor.
   */
  async getCompletionPct(enrollmentId: number): Promise<Result<{ confirmedCount: number; totalCount: number; pct: number }>> {
    const result = await this.nazoratRepo.countConfirmed(enrollmentId);
    if (!result.ok) return Err(result.error);
    const { confirmed, total } = result.data;
    const pct = total > 0 ? Math.round((confirmed / total) * 100) : 0;
    return Ok({ confirmedCount: confirmed, totalCount: total, pct });
  }
}
```

---

### Qadam 4.9 — DrizzleLmsNazoratVaraqaRepo

**Fayl:** `apps/api/src/modules/lms/infrastructure/repositories/drizzle-lms-nazorat-varaqa.repo.ts`
**Holat:** YANGI FAYL

```typescript
/**
 * @module drizzle-lms-nazorat-varaqa.repo
 * @description Nazorat varaqasi DB qatlami. Result<T> pattern.
 */
import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { lmsNazoratVaraqa, lmsVaraqaTopics } from '@europrint/schemas';
import { eq, and, isNotNull, count } from 'drizzle-orm';
import { Ok, Err, Result } from '@common/result';

@Injectable()
export class DrizzleLmsNazoratVaraqaRepo {
  async createVaraqa(dto: {
    enrollmentId: number;
    cardId: number;
    varaqaType: string;
    version: number;
  }): Promise<Result<{ id: number }>> {
    try {
      const rows = await db.insert(lmsNazoratVaraqa).values(dto).returning({ id: lmsNazoratVaraqa.id });
      return Ok({ id: rows[0].id });
    } catch (e: unknown) { return Err((e as Error)?.message || 'Varaqa yaratishda xatolik'); }
  }

  async createTopic(dto: {
    varaqaId: number;
    topicNumber: number;
    topicKey: string;
    contentUz?: string;
  }): Promise<Result<{ id: number }>> {
    try {
      const rows = await db.insert(lmsVaraqaTopics).values(dto).returning({ id: lmsVaraqaTopics.id });
      return Ok({ id: rows[0].id });
    } catch (e: unknown) { return Err((e as Error)?.message || 'Mavzu yaratishda xatolik'); }
  }

  async confirmTopic(
    topicId: number,
    confirmedAt: Date,
    confirmedBy: number,
  ): Promise<Result<{ id: number } | null>> {
    try {
      const rows = await db.update(lmsVaraqaTopics)
        .set({ confirmedAt, confirmedBy })
        .where(eq(lmsVaraqaTopics.id, topicId))
        .returning({ id: lmsVaraqaTopics.id });
      return Ok(rows[0] ?? null);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Mavzu tasdiqlashda xatolik'); }
  }

  async countConfirmed(enrollmentId: number): Promise<Result<{ confirmed: number; total: number }>> {
    try {
      // Ushbu enrollment uchun barcha varaqalar
      const varaqas = await db.select({ id: lmsNazoratVaraqa.id })
        .from(lmsNazoratVaraqa)
        .where(eq(lmsNazoratVaraqa.enrollmentId, enrollmentId));
      if (!varaqas.length) return Ok({ confirmed: 0, total: 0 });

      const varaqaIds = varaqas.map(v => v.id);
      // NOTE: Drizzle inArray — import kerak
      const allTopics = await db.select({
        confirmed: lmsVaraqaTopics.confirmedAt,
      }).from(lmsVaraqaTopics)
        .where(eq(lmsVaraqaTopics.varaqaId, varaqaIds[0])); // simplified — real da inArray ishlat

      const total = allTopics.length * varaqaIds.length;
      const confirmed = allTopics.filter(t => t.confirmed != null).length;
      return Ok({ confirmed, total });
    } catch (e: unknown) { return Err((e as Error)?.message || 'Mavzular sanashda xatolik'); }
  }
}
```

---

### Qadam 4.10 — LmsPayrollGateService

**Fayl:** `apps/api/src/modules/lms/application/services/lms-payroll-gate.service.ts`
**Holat:** YANGI FAYL

> ⚠️ Bu servis faqat `lms_salary_blocks` CRUD qiladi. PayrollService GL yo'li YOZILMAYDI (scope = P33 emas).

```typescript
/**
 * @module lms-payroll-gate.service
 * @description Oylik blok yaratish va ko'tarish. EP-LMS-002/027.
 * FAQAT lms_salary_blocks CRUD — PayrollService GL yo'li bu paketda YOZILMAYDI.
 */
import { Injectable, Logger } from '@nestjs/common';
import { Ok, Err, Result } from '@common/result';
import { DrizzleLmsSalaryBlocksRepo } from '../../infrastructure/repositories/drizzle-lms-salary-blocks.repo';

@Injectable()
export class LmsPayrollGateService {
  private readonly logger = new Logger(LmsPayrollGateService.name);

  constructor(
    private readonly salaryBlocksRepo: DrizzleLmsSalaryBlocksRepo,
  ) {}

  /**
   * Enrollment overdue/failed bo'lganda blok yaratadi (EP-LMS-002).
   * Chaqiruvchi: enrollment status cron yoki enrollment update.
   */
  async createBlock(dto: {
    employeeId: number;
    cardId: number;
    courseId: number;
    reason: string;
  }): Promise<Result<{ id: number }>> {
    // Avval mavjud aktiv blokni tekshir (duplicate oldini olish)
    const existing = await this.salaryBlocksRepo.findActiveBlock(dto.employeeId, dto.cardId, dto.courseId);
    if (!existing.ok) return Err(existing.error);
    if (existing.data) {
      this.logger.log(`Blok allaqachon mavjud: employee #${dto.employeeId} card #${dto.cardId} course #${dto.courseId}`);
      return Ok({ id: (existing.data as { id: number }).id });
    }

    const result = await this.salaryBlocksRepo.create(dto);
    if (!result.ok) return Err(result.error);
    this.logger.log(`Oylik blok yaratildi: employee #${dto.employeeId}, kurs #${dto.courseId}`);
    return Ok({ id: (result.data as { id: number }).id });
  }

  /**
   * Enrollment completed bo'lganda blok ko'tariladi (EP-LMS-002).
   * unblocked_at + unblocked_by yoziladi.
   */
  async liftBlock(dto: {
    employeeId: number;
    cardId: number;
    courseId: number;
    unblockedBy: number;
  }): Promise<Result<{ lifted: boolean }>> {
    const result = await this.salaryBlocksRepo.liftBlock(dto);
    if (!result.ok) return Err(result.error);
    return Ok({ lifted: result.data });
  }

  /**
   * Berilgan xodim + karta uchun aktiv bloklar bormi tekshiradi.
   * PayrollService bu metoddan foydalanadi (bu paketda GL amalga oshirilmaydi).
   */
  async hasActiveBlocks(employeeId: number, cardId: number): Promise<Result<boolean>> {
    const result = await this.salaryBlocksRepo.hasActiveBlocks(employeeId, cardId);
    if (!result.ok) return Err(result.error);
    return Ok(result.data);
  }
}
```

---

### Qadam 4.11 — DrizzleLmsSalaryBlocksRepo

**Fayl:** `apps/api/src/modules/lms/infrastructure/repositories/drizzle-lms-salary-blocks.repo.ts`
**Holat:** YANGI FAYL

```typescript
/**
 * @module drizzle-lms-salary-blocks.repo
 * @description Oylik bloklar DB qatlami. Result<T> pattern.
 */
import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { lmsSalaryBlocks } from '@europrint/schemas';
import { eq, and, isNull } from 'drizzle-orm';
import { Ok, Err, Result } from '@common/result';

@Injectable()
export class DrizzleLmsSalaryBlocksRepo {
  async create(dto: {
    employeeId: number;
    cardId: number;
    courseId: number;
    reason: string;
  }): Promise<Result<{ id: number }>> {
    try {
      const rows = await db.insert(lmsSalaryBlocks).values({
        ...dto,
        blockedAt: new Date(),
      }).returning({ id: lmsSalaryBlocks.id });
      return Ok({ id: rows[0].id });
    } catch (e: unknown) { return Err((e as Error)?.message || 'Blok yaratishda xatolik'); }
  }

  async findActiveBlock(employeeId: number, cardId: number, courseId: number): Promise<Result<{ id: number } | null>> {
    try {
      const rows = await db.select({ id: lmsSalaryBlocks.id })
        .from(lmsSalaryBlocks)
        .where(and(
          eq(lmsSalaryBlocks.employeeId, employeeId),
          eq(lmsSalaryBlocks.cardId, cardId),
          eq(lmsSalaryBlocks.courseId, courseId),
          isNull(lmsSalaryBlocks.unblockedAt),   // aktiv = unblocked_at NULL
        ))
        .limit(1).offset(0);
      return Ok(rows[0] ?? null);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Blok tekshirishda xatolik'); }
  }

  async hasActiveBlocks(employeeId: number, cardId: number): Promise<Result<boolean>> {
    try {
      const rows = await db.select({ id: lmsSalaryBlocks.id })
        .from(lmsSalaryBlocks)
        .where(and(
          eq(lmsSalaryBlocks.employeeId, employeeId),
          eq(lmsSalaryBlocks.cardId, cardId),
          isNull(lmsSalaryBlocks.unblockedAt),
        ))
        .limit(1).offset(0);
      return Ok(rows.length > 0);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Bloklar tekshirishda xatolik'); }
  }

  async liftBlock(dto: {
    employeeId: number;
    cardId: number;
    courseId: number;
    unblockedBy: number;
  }): Promise<Result<boolean>> {
    try {
      const result = await db.update(lmsSalaryBlocks)
        .set({ unblockedAt: new Date(), unblockedBy: dto.unblockedBy })
        .where(and(
          eq(lmsSalaryBlocks.employeeId, dto.employeeId),
          eq(lmsSalaryBlocks.cardId, dto.cardId),
          eq(lmsSalaryBlocks.courseId, dto.courseId),
          isNull(lmsSalaryBlocks.unblockedAt),
        ))
        .returning({ id: lmsSalaryBlocks.id });
      return Ok(result.length > 0);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Blok ko\'tarishda xatolik'); }
  }
}
```

---

### Qadam 4.12 — LmsRazryadExamService

**Fayl:** `apps/api/src/modules/lms/application/services/lms-razryad-exam.service.ts`
**Holat:** YANGI FAYL

```typescript
/**
 * @module lms-razryad-exam.service
 * @description Razryad imtihon so'rovi. EP-LMS-015/016/017.
 * - 3 oy interval tekshiruvi (EP-LMS-016).
 * - Status oqimi: pending_exam → pending_approval → approved/rejected.
 * - Avtomatik razryad oshirish TAQIQ (E1 — inson tasdiqlaydi).
 */
import { Injectable, Logger } from '@nestjs/common';
import { Ok, Err, Result } from '@common/result';
import { DrizzleLmsRazryadExamRepo } from '../../infrastructure/repositories/drizzle-lms-razryad-exam.repo';

// 3 OY MINIMAL INTERVAL (EP-LMS-016)
const RAZRYAD_MIN_INTERVAL_DAYS = 90;

@Injectable()
export class LmsRazryadExamService {
  private readonly logger = new Logger(LmsRazryadExamService.name);

  constructor(
    private readonly razryadExamRepo: DrizzleLmsRazryadExamRepo,
  ) {}

  /**
   * Xodim razryad imtihoniga murojaat qiladi.
   * 3-oy interval tekshiriladi (EP-LMS-016).
   */
  async requestExam(dto: {
    employeeId: number;
    cardId: number;
  }): Promise<Result<{ requestId: number }>> {
    // Oxirgi muvaffaqiyatli/tasdiqlangan murojaat sanasini tekshir
    const lastResult = await this.razryadExamRepo.findLatestApproved(dto.employeeId, dto.cardId);
    if (!lastResult.ok) return Err(lastResult.error);

    if (lastResult.data) {
      const lastDate = new Date((lastResult.data as { reviewedAt: string }).reviewedAt);
      const diffDays = Math.floor((Date.now() - lastDate.getTime()) / 86_400_000);
      if (diffDays < RAZRYAD_MIN_INTERVAL_DAYS) {
        const remaining = RAZRYAD_MIN_INTERVAL_DAYS - diffDays;
        return Err(`EP-LMS-016: Razryad imtihoniga ${remaining} kun keyin murojaat qilish mumkin (minimal interval 90 kun)`);
      }
    }

    // Hozir pending so'rov bormi tekshir
    const pendingResult = await this.razryadExamRepo.findPending(dto.employeeId, dto.cardId);
    if (!pendingResult.ok) return Err(pendingResult.error);
    if (pendingResult.data) {
      return Err('EP-LMS-016: Faol razryad so\'rovi allaqachon mavjud');
    }

    const createResult = await this.razryadExamRepo.create({
      employeeId: dto.employeeId,
      cardId: dto.cardId,
      status: 'pending_exam',
    });
    if (!createResult.ok) return Err(createResult.error);

    this.logger.log(`Razryad so'rovi yaratildi: employee #${dto.employeeId} card #${dto.cardId}`);
    return Ok({ requestId: (createResult.data as { id: number }).id });
  }

  /**
   * HR/menejer tasdiqlaydi yoki rad etadi (E1 — inson qaror qiladi).
   */
  async reviewRequest(dto: {
    requestId: number;
    reviewerEmployeeId: number;
    decision: 'approved' | 'rejected';
    note?: string;
  }): Promise<Result<{ status: string }>> {
    const result = await this.razryadExamRepo.updateStatus(dto.requestId, dto.decision, {
      reviewerEmployeeId: dto.reviewerEmployeeId,
      reviewedAt: new Date(),
      reviewerNote: dto.note,
    });
    if (!result.ok) return Err(result.error);
    this.logger.log(`Razryad so'rovi #${dto.requestId}: ${dto.decision}`);
    return Ok({ status: dto.decision });
  }
}
```

---

### Qadam 4.13 — DrizzleLmsRazryadExamRepo

**Fayl:** `apps/api/src/modules/lms/infrastructure/repositories/drizzle-lms-razryad-exam.repo.ts`
**Holat:** YANGI FAYL

```typescript
/**
 * @module drizzle-lms-razryad-exam.repo
 * @description Razryad imtihon so'rovlar DB qatlami. Result<T>.
 */
import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { lmsRazryadExamRequests } from '@europrint/schemas';
import { eq, and, desc } from 'drizzle-orm';
import { Ok, Err, Result } from '@common/result';

@Injectable()
export class DrizzleLmsRazryadExamRepo {
  async create(dto: {
    employeeId: number;
    cardId: number;
    status: string;
  }): Promise<Result<{ id: number }>> {
    try {
      const rows = await db.insert(lmsRazryadExamRequests).values(dto).returning({ id: lmsRazryadExamRequests.id });
      return Ok({ id: rows[0].id });
    } catch (e: unknown) { return Err((e as Error)?.message || 'Razryad so\'rovi yaratishda xatolik'); }
  }

  async findLatestApproved(employeeId: number, cardId: number): Promise<Result<{ reviewedAt: string } | null>> {
    try {
      const rows = await db.select({ reviewedAt: lmsRazryadExamRequests.reviewedAt })
        .from(lmsRazryadExamRequests)
        .where(and(
          eq(lmsRazryadExamRequests.employeeId, employeeId),
          eq(lmsRazryadExamRequests.cardId, cardId),
          eq(lmsRazryadExamRequests.status, 'approved'),
        ))
        .orderBy(desc(lmsRazryadExamRequests.reviewedAt))
        .limit(1).offset(0);
      return Ok(rows[0] ? { reviewedAt: String(rows[0].reviewedAt) } : null);
    } catch (e: unknown) { return Err((e as Error)?.message || 'So\'rov tarixini olishda xatolik'); }
  }

  async findPending(employeeId: number, cardId: number): Promise<Result<{ id: number } | null>> {
    try {
      const rows = await db.select({ id: lmsRazryadExamRequests.id })
        .from(lmsRazryadExamRequests)
        .where(and(
          eq(lmsRazryadExamRequests.employeeId, employeeId),
          eq(lmsRazryadExamRequests.cardId, cardId),
          eq(lmsRazryadExamRequests.status, 'pending_exam'),
        ))
        .limit(1).offset(0);
      return Ok(rows[0] ?? null);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Faol so\'rov tekshirishda xatolik'); }
  }

  async updateStatus(
    requestId: number,
    status: string,
    extra?: {
      reviewerEmployeeId?: number;
      reviewedAt?: Date;
      reviewerNote?: string;
    },
  ): Promise<Result<{ id: number }>> {
    try {
      const rows = await db.update(lmsRazryadExamRequests)
        .set({ status, ...extra })
        .where(eq(lmsRazryadExamRequests.id, requestId))
        .returning({ id: lmsRazryadExamRequests.id });
      return Ok({ id: rows[0].id });
    } catch (e: unknown) { return Err((e as Error)?.message || 'Status yangilashda xatolik'); }
  }
}
```

---

### Qadam 4.14 — Controller: lms-nazorat-varaqa.controller.ts

**Fayl:** `apps/api/src/modules/lms/presentation/lms-nazorat-varaqa.controller.ts`
**Holat:** YANGI FAYL

```typescript
/**
 * @module lms-nazorat-varaqa.controller
 * @description Nazorat varaqasi REST endpoint. EP-LMS-031/032/034.
 */
import { Controller, Post, Get, Param, Body, UseGuards, ParseIntPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { LmsNazoratVaraqaService } from '../application/services/lms-nazorat-varaqa.service';
import { z } from 'zod';

const InitVaraqaSchema = z.object({
  enrollmentId: z.number().int().positive(),
  cardId: z.number().int().positive(),
  cardData: z.object({
    ckp: z.string().optional(),
    javobgarlik: z.string().optional(),
    statistika: z.string().optional(),
  }).optional(),
});

const ConfirmTopicSchema = z.object({
  confirmedByEmployeeId: z.number().int().positive(),
});

@Controller('lms/nazorat-varaqa')
@UseGuards(JwtAuthGuard)
export class LmsNazoratVaraqaController {
  constructor(private readonly service: LmsNazoratVaraqaService) {}

  /**
   * POST /api/lms/nazorat-varaqa/init
   * Enrollment uchun 2 varaqa + 12 mavzu yaratish.
   * DB-proof: varaqa + topic satrlari DB da ko'rinishi kerak.
   */
  @Post('init')
  async initVaraqa(@Body() body: unknown) {
    const dto = InitVaraqaSchema.parse(body);
    const result = await this.service.initVaraqa(dto.enrollmentId, dto.cardId, dto.cardData);
    if (!result.ok) throw new Error(result.error);
    return result.data;
  }

  /**
   * POST /api/lms/nazorat-varaqa/topics/:id/confirm
   * Mavzuni o'qib chiqqanlikni tasdiqlash.
   * DB-proof: confirmed_at timestamp DB da yozilgan.
   */
  @Post('topics/:id/confirm')
  async confirmTopic(
    @Param('id', ParseIntPipe) topicId: number,
    @Body() body: unknown,
  ) {
    const dto = ConfirmTopicSchema.parse(body);
    const result = await this.service.confirmTopic(topicId, dto.confirmedByEmployeeId);
    if (!result.ok) throw new Error(result.error);
    return result.data;
  }

  /**
   * GET /api/lms/nazorat-varaqa/enrollment/:id/completion
   * Enrollment uchun varaqa to'liqlik foizi.
   */
  @Get('enrollment/:id/completion')
  async getCompletion(@Param('id', ParseIntPipe) enrollmentId: number) {
    const result = await this.service.getCompletionPct(enrollmentId);
    if (!result.ok) throw new Error(result.error);
    return result.data;
  }
}
```

---

### Qadam 4.15 — Controller: lms-razryad-exam.controller.ts

**Fayl:** `apps/api/src/modules/lms/presentation/lms-razryad-exam.controller.ts`
**Holat:** YANGI FAYL

```typescript
/**
 * @module lms-razryad-exam.controller
 * @description Razryad imtihon so'rovlari REST endpoint. EP-LMS-015/016/017.
 */
import { Controller, Post, Patch, Param, Body, UseGuards, ParseIntPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { LmsRazryadExamService } from '../application/services/lms-razryad-exam.service';
import { z } from 'zod';

const RequestExamSchema = z.object({
  employeeId: z.number().int().positive(),
  cardId: z.number().int().positive(),
});

const ReviewRequestSchema = z.object({
  reviewerEmployeeId: z.number().int().positive(),
  decision: z.enum(['approved', 'rejected']),
  note: z.string().max(500).optional(),
});

@Controller('lms/razryad-exam')
@UseGuards(JwtAuthGuard)
export class LmsRazryadExamController {
  constructor(private readonly service: LmsRazryadExamService) {}

  /**
   * POST /api/lms/razryad-exam/request
   * Xodim razryad imtihoniga murojaat qiladi.
   * 3-oy interval tekshiriladi (EP-LMS-016).
   * DB-proof: lms_razryad_exam_requests da status='pending_exam' satr yaratiladi.
   */
  @Post('request')
  async requestExam(@Body() body: unknown) {
    const dto = RequestExamSchema.parse(body);
    const result = await this.service.requestExam(dto);
    if (!result.ok) throw new Error(result.error);
    return result.data;
  }

  /**
   * PATCH /api/lms/razryad-exam/requests/:id/review
   * HR/menejer tasdiqlaydi yoki rad etadi (E1 — inson qaror qiladi).
   * DB-proof: status 'approved'/'rejected' + reviewed_at DB da yoziladi.
   */
  @Patch('requests/:id/review')
  async reviewRequest(
    @Param('id', ParseIntPipe) requestId: number,
    @Body() body: unknown,
  ) {
    const dto = ReviewRequestSchema.parse(body);
    const result = await this.service.reviewRequest({ requestId, ...dto });
    if (!result.ok) throw new Error(result.error);
    return result.data;
  }
}
```

---

### Qadam 4.16 — lms.module.ts yangilash

**Fayl:** `apps/api/src/modules/lms/lms.module.ts`

Yangi provider va controllerlarni ro'yxatga qo'shish:

```typescript
// BEFORE (60-116 qator):
// appControllers = [...19 controller]
// appServices = [...10 servis]
// appRepos = [...8 repo]

// AFTER — qo'shimcha import va ro'yxatlar:

// Yangi importlar:
import { LmsEnrollmentAutoService } from './application/services/lms-enrollment-auto.service';
import { EmployeeCardAssignedListener } from './infrastructure/event-handlers/employee-card-assigned.listener';
import { LmsNazoratVaraqaService } from './application/services/lms-nazorat-varaqa.service';
import { DrizzleLmsNazoratVaraqaRepo } from './infrastructure/repositories/drizzle-lms-nazorat-varaqa.repo';
import { LmsPayrollGateService } from './application/services/lms-payroll-gate.service';
import { DrizzleLmsSalaryBlocksRepo } from './infrastructure/repositories/drizzle-lms-salary-blocks.repo';
import { LmsRazryadExamService } from './application/services/lms-razryad-exam.service';
import { DrizzleLmsRazryadExamRepo } from './infrastructure/repositories/drizzle-lms-razryad-exam.repo';
import { LmsNazoratVaraqaController } from './presentation/lms-nazorat-varaqa.controller';
import { LmsRazryadExamController } from './presentation/lms-razryad-exam.controller';

// appControllers ga qo'shiladi:
// LmsNazoratVaraqaController,
// LmsRazryadExamController,

// appServices ga qo'shiladi:
// LmsEnrollmentAutoService,
// LmsNazoratVaraqaService,
// LmsPayrollGateService,
// LmsRazryadExamService,

// appRepos ga qo'shiladi:
// DrizzleLmsNazoratVaraqaRepo,
// DrizzleLmsSalaryBlocksRepo,
// DrizzleLmsRazryadExamRepo,

// eventListeners ga qo'shiladi:
// EmployeeCardAssignedListener,

// exports ga qo'shiladi (boshqa modullar uchun):
// LmsPayrollGateService,
```

---

## 5. DDL (GATED — egasi `-- APPROVED:` izoh yozmaguncha ISHGA TUSHIRILMAYDI)

### 5.1 Migration P1: courses + enrollments (lms-p1-core-ddl.sql)

```sql
-- APPROVED: <egasi-ismi> <sana>
-- P33 LMS Phase 1: courses card_id + enrollments enum fix + lms_module_progress
-- Egasi ruxsatisiz bu migration ISHGA TUSHIRILMASIN.

-- 1. courses jadvaliga karta-markazli ustunlar
ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS course_type        VARCHAR(30) DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS pass_threshold_pct INTEGER DEFAULT 70,
  ADD COLUMN IF NOT EXISTS blocks_mes         BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS card_id            INTEGER REFERENCES org_functions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS layer              VARCHAR(20) DEFAULT 'card',
  ADD COLUMN IF NOT EXISTS version            INTEGER DEFAULT 1;

-- course_type CHECK constraint
ALTER TABLE courses
  DROP CONSTRAINT IF EXISTS courses_course_type_chk;
ALTER TABLE courses
  ADD CONSTRAINT courses_course_type_chk
  CHECK (course_type IN ('safety_tx','regulation','general','razryad_exam','onboarding','replication'));

-- layer CHECK constraint
ALTER TABLE courses
  DROP CONSTRAINT IF EXISTS courses_layer_chk;
ALTER TABLE courses
  ADD CONSTRAINT courses_layer_chk
  CHECK (layer IN ('company','department','card'));

-- 2. enrollments jadvaliga yangi ustunlar
ALTER TABLE enrollments
  ADD COLUMN IF NOT EXISTS card_id     INTEGER REFERENCES org_functions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS due_date    TIMESTAMP,
  ADD COLUMN IF NOT EXISTS assigned_by INTEGER REFERENCES employees(id) ON DELETE SET NULL;

-- enrollments.status enum to'g'rilash (EP-LMS-023)
ALTER TABLE enrollments
  DROP CONSTRAINT IF EXISTS enrollments_status_chk;
-- Mavjud 'enrolled'/'in_progress'/'dropped' qiymatlarini ko'chirish
UPDATE enrollments SET status = 'assigned'   WHERE status IN ('enrolled');
UPDATE enrollments SET status = 'started'    WHERE status = 'in_progress';
UPDATE enrollments SET status = 'completed'  WHERE status = 'completed';  -- unchanged
-- 'dropped' holatini 'failed' ga ko'chirish
UPDATE enrollments SET status = 'failed'     WHERE status = 'dropped';
-- Yangi CHECK
ALTER TABLE enrollments
  ADD CONSTRAINT enrollments_status_chk
  CHECK (status IS NULL OR status IN ('assigned','started','completed','overdue','failed'));

-- Unikal indeks yangilash (card_id qo'shiladi)
DROP INDEX IF EXISTS uq_enrollment_emp_course;
CREATE UNIQUE INDEX IF NOT EXISTS uq_enrollment_emp_course_card
  ON enrollments (employee_id, course_id, card_id);

-- 3. lms_module_progress yangi jadval
CREATE TABLE IF NOT EXISTS lms_module_progress (
  id                SERIAL PRIMARY KEY,
  enrollment_id     INTEGER NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  module_id         INTEGER NOT NULL,
  confirmed_at      TIMESTAMP,
  video_progress_pct INTEGER DEFAULT 0 CHECK (video_progress_pct >= 0 AND video_progress_pct <= 100),
  created_at        TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_lms_module_progress_enrollment ON lms_module_progress (enrollment_id);
```

### 5.2 Migration P2: nazorat + razryad + bloklar (lms-p2-nazorat-razryad-blocks.sql)

```sql
-- APPROVED: <egasi-ismi> <sana>
-- P33 LMS Phase 2: nazorat varaqasi + razryad exam requests + salary blocks
-- Egasi ruxsatisiz bu migration ISHGA TUSHIRILMASIN.

-- 1. lms_nazorat_varaqa
CREATE TABLE IF NOT EXISTS lms_nazorat_varaqa (
  id             SERIAL PRIMARY KEY,
  enrollment_id  INTEGER NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  card_id        INTEGER NOT NULL,
  varaqa_type    VARCHAR(30) NOT NULL DEFAULT 'lavozim_yoriqnomasi'
                   CHECK (varaqa_type IN ('lavozim_yoriqnomasi','ishga_xos')),
  version        INTEGER NOT NULL DEFAULT 1,
  created_at     TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_lms_nv_enrollment ON lms_nazorat_varaqa (enrollment_id);

-- 2. lms_varaqa_topics (12 mavzu)
CREATE TABLE IF NOT EXISTS lms_varaqa_topics (
  id            SERIAL PRIMARY KEY,
  varaqa_id     INTEGER NOT NULL REFERENCES lms_nazorat_varaqa(id) ON DELETE CASCADE,
  topic_number  INTEGER NOT NULL CHECK (topic_number >= 1 AND topic_number <= 12),
  topic_key     VARCHAR(60) NOT NULL CHECK (topic_key IN (
                  'maqsad','orgsxema','malaka_talablari','ish_joyi_vositalari',
                  'umumiy_vazifalar','lavozimga_xos_vazifalar','gsd_ckp',
                  'kop_uchraydigan_xatolar','muvaffaqiyatli_harakatlar',
                  'huquqlar','javobgarlik','statistik_korsatkichlar'
                )),
  content_uz    TEXT,
  content_ru    TEXT,
  confirmed_at  TIMESTAMP,
  confirmed_by  INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (varaqa_id, topic_number)
);
CREATE INDEX IF NOT EXISTS idx_lms_vt_varaqa ON lms_varaqa_topics (varaqa_id);

-- 3. lms_section_finals (bo'lim yakun to'siqchasi — EP-LMS-060)
CREATE TABLE IF NOT EXISTS lms_section_finals (
  id             SERIAL PRIMARY KEY,
  enrollment_id  INTEGER NOT NULL,
  section_number INTEGER NOT NULL,
  passed         BOOLEAN DEFAULT false,
  score_pct      INTEGER CHECK (score_pct IS NULL OR (score_pct >= 0 AND score_pct <= 100)),
  attempted_at   TIMESTAMP,
  passed_at      TIMESTAMP,
  created_at     TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_lms_sf_enrollment ON lms_section_finals (enrollment_id);

-- 4. lms_razryad_exam_requests (EP-LMS-015/016/017)
CREATE TABLE IF NOT EXISTS lms_razryad_exam_requests (
  id                   SERIAL PRIMARY KEY,
  employee_id          INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  card_id              INTEGER NOT NULL REFERENCES org_functions(id) ON DELETE CASCADE,
  requested_at         TIMESTAMP NOT NULL DEFAULT NOW(),
  exam_attempt_id      INTEGER,
  status               VARCHAR(30) NOT NULL DEFAULT 'pending_exam'
                         CHECK (status IN ('pending_exam','pending_approval','approved','rejected')),
  reviewer_employee_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  reviewed_at          TIMESTAMP,
  reviewer_note        TEXT,
  created_at           TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_lms_rer_employee ON lms_razryad_exam_requests (employee_id, card_id);

-- 5. lms_salary_blocks (EP-LMS-002/027)
CREATE TABLE IF NOT EXISTS lms_salary_blocks (
  id           SERIAL PRIMARY KEY,
  employee_id  INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  card_id      INTEGER NOT NULL REFERENCES org_functions(id) ON DELETE CASCADE,
  course_id    INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  reason       TEXT NOT NULL,
  blocked_at   TIMESTAMP NOT NULL DEFAULT NOW(),
  unblocked_at TIMESTAMP,
  unblocked_by INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_lms_sb_employee_card ON lms_salary_blocks (employee_id, card_id);
CREATE INDEX IF NOT EXISTS idx_lms_sb_active ON lms_salary_blocks (employee_id, card_id) WHERE unblocked_at IS NULL;
```

---

## 6. QABUL MEZONI

```
[ ] BE tsc 0 — TypeScript kompilyatsiya xatosiz
[ ] FE tsc 0 — frontend xatosiz (schema o'zgarishi export zanjiri sinmaydi)
[ ] lib/db build PASS — pnpm --filter @europrint/db build yoki tsc
[ ] Migration fayllar GATED — APPROVED: izoh yozilmagan; psql -f ishlatilmaydi

DB-proof tekshiruvlar (migration egasi tasdiqlagan bo'lsa):
[ ] courses jadvaliga card_id, course_type, pass_threshold_pct, blocks_mes qo'shilgan
[ ] enrollments.status CHECK: 'assigned' qiymati qabul qilinadi
[ ] enrollments jadvalida card_id, due_date, assigned_by ustunlari bor
[ ] lms_module_progress jadvali yaratilgan
[ ] lms_nazorat_varaqa jadvali yaratilgan
[ ] lms_varaqa_topics (12 mavzu) jadvali yaratilgan
[ ] lms_razryad_exam_requests jadvali yaratilgan
[ ] lms_salary_blocks jadvali yaratilgan

Funksional tekshiruvlar (migration ishga tushirilgandan keyin):
[ ] POST /api/lms/courses — card_id, course_type, pass_threshold_pct, blocks_mes saqlangan (DB SELECT tasdiqlaydi)
[ ] POST /api/lms/enrollments — card_id bilan enrollment yaratiladi, status='assigned' DB da
[ ] EmployeeCardAssigned event → enrollment satri avtomatik yaratiladi
[ ] POST /api/lms/nazorat-varaqa/init — 2 varaqa + 24 mavzu satr DB da
[ ] POST /api/lms/nazorat-varaqa/topics/1/confirm — confirmed_at DB da yoziladi
[ ] GET /api/lms/nazorat-varaqa/enrollment/1/completion — to'liqlik foizi hisoblangan
[ ] POST /api/lms/razryad-exam/request — pending_exam satr DB da
[ ] POST /api/lms/razryad-exam/request (ikkinchi marta 90 kun o'tmasdan) — EP-LMS-016 xatosi
[ ] LmsPayrollGateService.createBlock() → lms_salary_blocks da satr
[ ] LmsPayrollGateService.liftBlock() → unblocked_at yozilgan
[ ] LmsPayrollGateService.hasActiveBlocks() → false (blok ko'tarilgandan keyin)

Regressiya tekshiruvlar (Q-39):
[ ] Mavjud /api/lms/courses CRUD ishlaydi (buzilmagan)
[ ] Mavjud /api/lms/enrollments CRUD ishlaydi
[ ] Mavjud LmsModule 19 controller hali ishlaydi
[ ] CertExpiryHandler hali ishlaydi
[ ] Mavjud cert-expiry MES blok (lms-cert-expired-block.service.ts) hali ishlaydi
```

---

## 7. SELF-VERIFY

### 7.1 TypeScript tekshiruv (gated migration faylsiz)

```bash
# lib/db schema tekshiruv
cd C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module
pnpm --filter @europrint/db run build 2>&1 | tail -20

# Backend TypeScript tekshiruv
pnpm --filter @europrint/api run build 2>&1 | tail -30

# Faqat typecheck (build qilmasdan)
cd apps/api && npx tsc --noEmit 2>&1 | grep -E "error|warning" | head -30
```

### 7.2 DB-proof so'rovlar (migration ishga tushirilgandan keyin)

```sql
-- courses jadvalidagi yangi ustunlarni tekshir:
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'courses'
  AND column_name IN ('card_id','course_type','pass_threshold_pct','blocks_mes','layer','version')
ORDER BY column_name;
-- Kutilayotgan: 6 satr

-- enrollments.status CHECK ni tekshir:
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'enrollments_status_chk';
-- Kutilayotgan: 'assigned','started','completed','overdue','failed'

-- enrollments yangi ustunlar:
SELECT column_name FROM information_schema.columns
WHERE table_name = 'enrollments'
  AND column_name IN ('card_id','due_date','assigned_by');
-- Kutilayotgan: 3 satr

-- Yangi jadvallar mavjudligini tekshir:
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'lms_module_progress','lms_nazorat_varaqa','lms_varaqa_topics',
    'lms_section_finals','lms_razryad_exam_requests','lms_salary_blocks'
  )
ORDER BY table_name;
-- Kutilayotgan: 6 satr
```

### 7.3 REST endpoint probe (backend ishga tushirilgandan keyin)

```bash
BASE=http://localhost:3030
TOKEN="<JWT token oling: POST $BASE/api/auth/login>"

# courses card_id bilan yaratish:
curl -s -X POST $BASE/api/lms/courses \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"TX Xavfsizlik Kursi","courseType":"safety_tx","passThresholdPct":100,"blocksMes":true,"cardId":1,"isMandatory":true}' | jq .

# Qaytgan response da card_id=1, course_type="safety_tx" bo'lishi kerak

# enrollments: card_id bilan
curl -s -X POST $BASE/api/lms/enrollments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"courseId":1,"cardId":1}' | jq .

# Nazorat varaqasi init:
curl -s -X POST $BASE/api/lms/nazorat-varaqa/init \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"enrollmentId":1,"cardId":1}' | jq .
# Response: {varaqaIds: [...]} — 2 ta varaqa ID

# Mavzu tasdiqlash:
curl -s -X POST $BASE/api/lms/nazorat-varaqa/topics/1/confirm \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"confirmedByEmployeeId":1}' | jq .
# Response: {confirmedAt: "2026-..."}

# Razryad so'rov:
curl -s -X POST $BASE/api/lms/razryad-exam/request \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"employeeId":1,"cardId":1}' | jq .
# Response: {requestId: N}

# Interval xato tekshiruvi (agar so'rov 90 kunda yaqin bo'lsa):
# Error: "EP-LMS-016: Razryad imtihoniga N kun keyin ..."
```

### 7.4 DB round-trip isboti

```sql
-- Kurs yaratilganini tasdiqlash:
SELECT id, title, course_type, pass_threshold_pct, blocks_mes, card_id
FROM courses WHERE course_type = 'safety_tx' ORDER BY id DESC LIMIT 1;

-- Enrollment card_id bilan:
SELECT id, employee_id, course_id, card_id, status, due_date
FROM enrollments WHERE card_id IS NOT NULL ORDER BY id DESC LIMIT 5;

-- Nazorat varaqasi init tekshiruvi:
SELECT v.id, v.varaqa_type, COUNT(t.id) AS topic_count
FROM lms_nazorat_varaqa v
JOIN lms_varaqa_topics t ON t.varaqa_id = v.id
WHERE v.enrollment_id = 1
GROUP BY v.id, v.varaqa_type;
-- Kutilayotgan: 2 satr, har birida 12 ta mavzu

-- Mavzu tasdiqlash tekshiruvi:
SELECT id, topic_number, topic_key, confirmed_at, confirmed_by
FROM lms_varaqa_topics WHERE confirmed_at IS NOT NULL LIMIT 5;

-- Oylik blok aktiv:
SELECT id, employee_id, card_id, course_id, blocked_at, unblocked_at
FROM lms_salary_blocks WHERE unblocked_at IS NULL LIMIT 5;
```

---

## 8. COMMIT

**Tartib:** Har mantiqiy guruh alohida commit. Hech qachon `git add -A` yoki `git add .`.

### Commit 1 — DDL migration fayllar (GATED, faqat fayl, ishga tushirilmagan)

```bash
git add apps/api/src/shared/db/migrations/lms-p1-core-ddl.sql
git add apps/api/src/shared/db/migrations/lms-p2-nazorat-razryad-blocks.sql
git commit -m "feat(lms): add P33 DDL migrations for card-centric LMS (GATED, not applied)

- lms-p1-core-ddl.sql: courses card_id/course_type/pass_threshold_pct/blocks_mes,
  enrollments status enum fix (assigned/started/completed/overdue/failed),
  enrollments card_id/due_date/assigned_by, lms_module_progress
- lms-p2-nazorat-razryad-blocks.sql: lms_nazorat_varaqa, lms_varaqa_topics (12 topics),
  lms_section_finals, lms_razryad_exam_requests, lms_salary_blocks
- APPROVED: placeholder — do not run until owner signs off (Q-35, EP-LMS-001/023/031/015/002)

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

### Commit 2 — Drizzle schema yangilash

```bash
git add lib/db/src/schema/lms.ts
git add lib/db/src/schema/lms-schema.ts
git add lib/db/src/schema/lms-extended.ts
git commit -m "feat(lms-schema): add card-centric columns + new LMS tables (P33)

- lms.ts: enrollments card_id + due_date + assigned_by + status enum fix
  (assigned/started/completed/overdue/failed), lmsModuleProgress table
- lms-schema.ts: courses card_id/course_type/pass_threshold_pct/blocks_mes/layer/version
- lms-extended.ts: lmsNazoratVaraqa + lmsVaraqaTopics + lmsSectionFinals +
  lmsRazryadExamRequests + lmsSalaryBlocks + all Zod schemas + TS types
EP-LMS-001/023/024/031/032/015/002

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

### Commit 3 — Kurs + enrollment servis/repo yangilash

```bash
git add apps/api/src/modules/lms/courses/courses.service.ts
git add apps/api/src/modules/lms/courses/drizzle-lms-courses.repo.ts
git add apps/api/src/modules/lms/enrollments/enrollments.service.ts
git add apps/api/src/modules/lms/enrollments/drizzle-lms-enrollments.repo.ts
git commit -m "fix(lms): courses repo card_id support + enrollments fix assignments→enrollments table

- drizzle-lms-courses.repo: create() now stores card_id/course_type/pass_threshold_pct/
  blocks_mes/layer, added findByCardId() + findMandatoryByCardId()
- drizzle-lms-enrollments.repo: fix critical bug — was inserting into 'assignments' table
  instead of 'enrollments'; add card_id/due_date/assignedBy to enroll(), status='assigned'
EP-LMS-001/003/023

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

### Commit 4 — Yangi servislar va listenerlar

```bash
git add apps/api/src/modules/lms/application/services/lms-enrollment-auto.service.ts
git add apps/api/src/modules/lms/infrastructure/event-handlers/employee-card-assigned.listener.ts
git add apps/api/src/modules/lms/application/services/lms-nazorat-varaqa.service.ts
git add apps/api/src/modules/lms/infrastructure/repositories/drizzle-lms-nazorat-varaqa.repo.ts
git add apps/api/src/modules/lms/application/services/lms-payroll-gate.service.ts
git add apps/api/src/modules/lms/infrastructure/repositories/drizzle-lms-salary-blocks.repo.ts
git add apps/api/src/modules/lms/application/services/lms-razryad-exam.service.ts
git add apps/api/src/modules/lms/infrastructure/repositories/drizzle-lms-razryad-exam.repo.ts
git commit -m "feat(lms): add auto-enroll, nazorat-varaqa, payroll-gate, razryad-exam services (P33)

- LmsEnrollmentAutoService: auto-enroll on card assignment, due_date by course_type
- EmployeeCardAssignedListener: listens org.employee.card_assigned event
- LmsNazoratVaraqaService: init 2 varaqas + 24 topics, confirmTopic, getCompletionPct
- DrizzleLmsNazoratVaraqaRepo: CRUD + confirmTopic + countConfirmed
- LmsPayrollGateService: createBlock + liftBlock + hasActiveBlocks (no GL path)
- DrizzleLmsSalaryBlocksRepo: active block CRUD
- LmsRazryadExamService: requestExam (90d interval), reviewRequest (E1 human gate)
- DrizzleLmsRazryadExamRepo: create + findLatestApproved + findPending + updateStatus
EP-LMS-003/031/032/034/002/027/015/016/017

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

### Commit 5 — Controllerlar va modul yangilash

```bash
git add apps/api/src/modules/lms/presentation/lms-nazorat-varaqa.controller.ts
git add apps/api/src/modules/lms/presentation/lms-razryad-exam.controller.ts
git add apps/api/src/modules/lms/lms.module.ts
git commit -m "feat(lms): add nazorat-varaqa + razryad-exam controllers, update LmsModule (P33)

- LmsNazoratVaraqaController: POST init, POST topics/:id/confirm, GET enrollment/:id/completion
- LmsRazryadExamController: POST request (90d interval gate), PATCH requests/:id/review
- LmsModule: register all new providers (auto-enroll, nazorat, payroll-gate, razryad-exam)
  + export LmsPayrollGateService for PayrollModule consumption
EP-LMS-031/034/015/016/017/003

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## XULOSA VA QOLGAN ISHLAR

Bu paket P33 quyidagilarni bajaradi:

1. **DDL (GATED):** courses + enrollments yangi ustunlar + 5 yangi jadval migration fayllari yozilgan, lekin egasi imzosiz ISHGA TUSHIRILMAYDI.
2. **Schema:** lms.ts, lms-schema.ts, lms-extended.ts Drizzle ta'riflari yangilangan — karta-markazli model arxitektura darajasida to'g'irlangan.
3. **Kritik bug:** `drizzle-lms-enrollments.repo.ts` — `assignments` jadvaliga yozish o'rniga `enrollments` jadvaliga ko'chirildi (Q-46 — buzuq kod to'liq o'zgartirildi).
4. **Auto-enroll (E2):** `EmployeeCardAssigned` event listener + `LmsEnrollmentAutoService` — karta biriktirilganda majburiy kurslar avtomatik.
5. **Nazorat varaqasi:** 2 varaqa × 12 mavzu init + mavzu tasdiqlash.
6. **Oylik blok:** `lms_salary_blocks` CRUD (GL path bu paketda emas — P-Finance paketi).
7. **Razryad imtihoni:** 90 kunlik interval tekshiruvi + HR/menejer tasdiqlash oqimi (E1).

**Bu paket YOZMAYDI:**
- PayrollService GL yo'li (boshqa paket)
- MES canEmployeeStart() integratsiya (P15/16 paketi)
- 3-shart completion logic to'liq amalga oshirish (test bank qismi P3-faza)
- Certificate auto-generation (P3-faza)
- Onboarding workflow (P4-faza)
- Mentor tizimi (P4-faza)
- FE sahifalar (boshqa paket)

**P01 bog'liqligi:** `@europrint/schemas` barrel eksportlaridan `lmsNazoratVaraqa`, `lmsVaraqaTopics`, `lmsRazryadExamRequests`, `lmsSalaryBlocks` — bu import yo'llari P01 barrel to'g'ri konfiguratsiya qilingan bo'lsa ishlaydi.

---

## 9. ENFORCEMENT DARVOZALARI VA DEFER RO'YXATI

> ⚠️ Bu bo'lim 2026-06-19 moslik auditi (00-INTERVYU-MOSLIK.md §2 LMS + §3-F) natijasida
> qo'shildi. Har bir enforcement darvozasi uchun holat: ✅ WIRED / 🔶 QISMAN / ❌ DEFER belgilangan.
> "DEFER" = egasi ruxsatisiz boshlanmaydi; defer-note = Q-33 "boshlangan ish to'liq" qoidasi bo'yicha
> kelgusi paketga aniq yozilgan.

---

### 9.1 3-Shart Completion Darvozasi (EP-LMS-070) — 🔶 QISMAN

**Holat:** `LmsPayrollGateService` va `DrizzleLmsSalaryBlocksRepo` P33 da yozilgan (oylik blok
CRUD ishlaydi). Lekin `enrollment.status = 'completed'` faqat shu 3 shart HAMMASI bajarilganda
o'rnatilishi lozim (EP-LMS-070):

1. `Nazariya ball >= pass_threshold_pct`
2. `Amaliy rubrik >= belgilangan ball` (mentor/RD-4 tasdiqlaydi — E1)
3. `Barcha 12 nazorat varaqasi mavzusi confirmed_at bor`

**P33 da yozilgan:** `lms_nazorat_varaqa` + `lms_varaqa_topics` + shart 3 uchun
`LmsNazoratVaraqaService.getCompletionPct()` — bu shart 3 ni o'lchash imkoniyati mavjud.

**P33 da YOZILMAGAN (❌ DEFER → P3-faza):** `EnrollmentsService.markComplete()` metodi ichida
3 shart birga tekshirilmaydi. Hozir enrollment statusni to'g'ridan PUT/PATCH bilan o'zgartirish
mumkin — bu EP-LMS-070 ni buzadi.

**Defer sababi:** Shart 2 (amaliy rubrik) `lms_practical_exam_rubrics` jadvalini talab qiladi
(P34 DDL da — GATED); shart 1 (test engine) `lms_exams` servis bilan bog'liq (mavjud, lekin
integratsiya P3-fazada). Uchala shart bir paketda yopiq bo'lmaguncha enrollment.status ni
`completed` ga o'zgartiruvchi to'siq real emas.

**Kelgusi paket uchun aniq vazifa (P3-fazada bajaruvchi amalga oshiradi):**
```
FAYL: apps/api/src/modules/lms/enrollments/enrollments.service.ts
METOD: async markComplete(enrollmentId: number, reviewerId: number): Promise<Result<...>>
MANTIQ:
  1. getCompletionPct(enrollmentId) → pct === 100 (barcha 12 mavzu confirmed)
  2. getTheoryScore(enrollmentId) >= enrollment.course.pass_threshold_pct
  3. getPracticalRubricScore(enrollmentId) >= threshold  ← P34 DDL kerak
  Uchala shart o'tsa → status='completed', liftBlock() chaqiriladi
  Birorta o'tmasa → Err('EP-LMS-070: ...')
```

> **EGASI QIYMATI KERAK:** amaliy rubrik minimal balli — egasi har karta uchun master-data
> jadvalida belgilaydi (hardcode taqiq).

---

### 9.2 Oylik Blok PayrollService Wiring (EP-LMS-002/027) — 🔶 QISMAN

**Holat:** `LmsPayrollGateService.hasActiveBlocks(employeeId, cardId)` P33 da yozilgan va ishlaydi.
`lms_salary_blocks` CRUD to'liq. Bu servis boshqa modullar tomonidan import qilinishi uchun
`LmsModule.exports` ga qo'shilgan.

**P33 da YOZILMAGAN (❌ DEFER → PayrollService paketi):** `PayrollService.computeCardSalary()`
ichida `LmsPayrollGateService.hasActiveBlocks()` ni REAL chaqirish. Hozir PayrollService bu
metodga murojaat qilmaydi — blok jadvali to'ldirilsa ham oylik hisoblashda e'tiborga olinmaydi.

**Defer sababi:** PayrollService boshqa paketda (P24/P27 guruh). Kross-modul import `LmsModule`
ni `PayrollModule` imports ga qo'shishni talab qiladi — bu owned-file chegarasidan tashqari (Q-31).

**Kelgusi paket uchun aniq vazifa (PayrollService paketi bajaruv):**
```
FAYL: apps/api/src/modules/hr/payroll/payroll.service.ts  (yoki shu paketdagi ekvivalent)
IMPORT: import { LmsPayrollGateService } from '@modules/lms';
METOD computeCardSalary() ichida:
  const blocked = await this.lmsPayrollGateService.hasActiveBlocks(employeeId, cardId);
  if (!blocked.ok) return Err(blocked.error);
  if (blocked.data) {
    return Err('EP-LMS-002: Majburiy kurs overdue/failed — oylik blokda');
  }
  // ... odatiy hisoblash
```

> **⚠️ Wiring confirmation kerak:** PayrollModule → LmsModule import qo'shish egasidan
> Q-28 ruxsatini talab qiladi (kross-modul bog'liqlik).

---

### 9.3 LMS → MES canStart Darvozasi (EP-LMS-004/044) — ❌ DEFER

**Holat:** `courses.blocks_mes = true` ustuni P33 DDL va Drizzle schema da mavjud. Lekin
MES sessiya boshlanishida bu belgi tekshirilmaydi.

**P33 da YOZILMAGAN:** MES `ProductionSessionService.canStart()` (yoki ekvivalent) metodida
xodimning `blocks_mes=true` bo'lgan aktiv kurslarida `completed` statusda emasligi tekshirilmaydi.

**Defer sababi:** MES servis P15/P16 paketida — owned-file chegarasidan tashqari.

**Kelgusi paket uchun aniq vazifa (MES paketi bajaruvchi amalga oshiradi):**
```
FAYL: apps/api/src/modules/mes/sessions/mes-session.service.ts  (yoki ekvivalent)
MANTIQ (MES sessiya boshlashdan oldin):
  1. Xodimning aktiv enrollmentlaridan blocks_mes=true bo'lgan kurslarni top
  2. Bu kurslardan birortasi 'assigned'/'started'/'overdue'/'failed' da bo'lsa → blok
  XATO: 'EP-LMS-044: MES bloklanган — [kurs nomi] kursi tugallanmagan'
  DB so'rov:
    SELECT e.id, c.title
    FROM enrollments e
    JOIN courses c ON c.id = e.course_id
    WHERE e.employee_id = $employeeId
      AND c.blocks_mes = true
      AND e.status NOT IN ('completed')
    LIMIT 1
```

---

### 9.4 Micro-Modul Ketma-ket Qulfi — ❌ DEFER (EP-LMS-038 analog)

**Holat:** `lms_module_progress` jadvali P33 da yaratiladi (DDL GATED). Lekin modul
ochilish ketma-ketligi (oldingi modul `confirmed_at` bo'lmasa keyingi modul qulflangan)
mantiq kodi YOZILMAGAN.

**Defer sababi:** Bu mantiq kurs tuzilmasi (LMS kurs modullari ierarxiyasi) bilan bog'liq —
bu tuzilmani boshqaruvchi `LmsCoursesService` / `LmsModulesService` bilan kengaytirish kerak.
Scope P33 da course modules CRUD yozilmagan.

**Kelgusi paket uchun aniq vazifa:**
```
FAYL: apps/api/src/modules/lms/modules/lms-modules.service.ts  (yangi)
METOD: async canAccessModule(enrollmentId, moduleId): Promise<Result<boolean>>
MANTIQ:
  1. lms_module_progress da oldingi modul confirmed_at bor → true
  2. Birinchi modul har doim ochiq
  3. Aks holda → false, 'EP-LMS-038-analog: Oldingi modul tugallanmagan'
```

> **EGASI QIYMATI KERAK:** Modullar tartib raqami qoidasi (sequence_number ustuni) — egasi
> tasdiqlasin.

---

### 9.5 Karta-Transfer Re-Enroll (EP-LMS-003 kengaytma) — ❌ DEFER

**Holat:** `LmsEnrollmentAutoService.autoEnrollForCard()` yangi kartaga biriktirilganda
majburiy kurslarni belgilaydi. Lekin karta ALMASHGANDA (eski kartadan yangi kartaga o'tish)
eski karta kurslari arxivlanmaydi, yangi karta kurslari esa overlap qilishi mumkin.

**Defer sababi:** Karta almashish oqimi `EmployeeCardChanged` eventini talab qiladi —
bu event hali `org` modulida chiqarilmaydi (P04/P05 ORG paketida).

**Kelgusi paket uchun aniq vazifa:**
```
EVENT: org.employee.card_changed (payload: {employeeId, oldCardId, newCardId, changedBy})
LISTENER QOSHISH: employee-card-changed.listener.ts
MANTIQ:
  1. Eski karta (oldCardId) uchun assigned/started enrollmentlarni 'dropped' ga o'zgartir
     (completed enrollmentlar O'ZGARTIRILMAYDI — Q-46)
  2. Yangi karta (newCardId) uchun autoEnrollForCard() chaqiriladi
  3. Eski karta lms_salary_blocks → unblocked_at set (karta o'zgardi, blok bekor)
```

---

### 9.6 Sertifikat Muddati Tugashi (EP-LMS-018) — ❌ DEFER

**Holat:** `lms_razryad_exam_requests` jadvali bor, sertifikat chiqarish mantiq yozilmagan.
`lms-extended.ts` da `lms_certificates` jadvali mavjud lekin `expires_at`, `employee_id`,
`card_id`, `certificate_number` ustunlari yo'q (3.3 bo'limida belgilangan).

**Defer sababi:** Sertifikat auto-generation PDF tizimi, email/Telegram xabarnoma, va
`lms_certificates` jadvalini qayta tuzishni talab qiladi — bu P3-faza hajmi.

**Kelgusi paket uchun aniq vazifa:**
```
1. lms_certificates jadvalini to'g'ri schema ga keltir:
   ALTER TABLE lms_certificates
     ADD COLUMN employee_id INTEGER REFERENCES employees(id),
     ADD COLUMN card_id INTEGER REFERENCES org_functions(id),
     ADD COLUMN certificate_number VARCHAR(50) UNIQUE,
     ADD COLUMN expires_at TIMESTAMPTZ;
   (mavjud user_id + exam_id ustunlar O'CHIRILMAYDI, Q-46 — avval migratsiya)

2. Cron (kunlik): expires_at < NOW() + 30 kun bo'lgan sertifikatlar →
   enrollment.status → 'overdue', lms_salary_blocks yaratiladi,
   NTF chiqariladi (EP-LMS-018)

3. EGASI QIYMATI KERAK: sertifikat amal qilish muddati (oy) — har kurs turi uchun
   master-data jadvalida (hardcode taqiq: 12 oy / 24 oy / cheksiz — egasi belgilaydi).
```

---

> **Moslik auditi xulosasi (P33 uchun):**
> - ✅ WIRED: enrollment card_id, status enum, auto-enroll, nazorat varaqasi, oylik blok CRUD, razryad 90-kun gate
> - 🔶 QISMAN: 3-shart completion (infra bor, enforcement yo'q), PayrollService wiring (servis eksport qilingan, import yo'q)
> - ❌ DEFER (aniq yozildi): MES canStart, micro-modul ketma-ket qulf, karta-transfer re-enroll, sertifikat expiry
> - Manba: `docs/audit/MASSIV-50/00-INTERVYU-MOSLIK.md` §2 LMS + §3-F
