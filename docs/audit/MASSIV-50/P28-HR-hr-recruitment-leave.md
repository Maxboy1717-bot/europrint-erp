# P28 — HR: HR recruitment 7-bosqich + vacancy auto-yaratish + referral-bonus + leave/tabel/kontrakt

> **Paket:** P28 · **Modul:** HR · **To'lqin:** WAVE 1
> **DependsOn:** P01 (lib/db barrel), P02 (api barrel)
> **DDL Darvozasi:** HA — migration fayllar YOZILADI lekin `-- APPROVED:` izoh va egasi ruxsatisiz ISHGA TUSHIRILMAYDI
> **Egasi:** Muslimbek (bajaruvchi) · **Tayyorlagan:** Advisor (Claude) · **Sana:** 2026-06-19

---

## 0. ROL VA QOIDALAR

Sen 🟢 **BAJARUVCHI**-san. Birinchi qator yozishdan oldin quyidagilarni o'qi:
- `CLAUDE.md` (qoidalar A/B/1-23, Q-24..Q-47)
- `docs/agent-constitution.md`
- `docs/audit/LOYIHA-QOIDALARI-2026-06-08.md`

**WAVE:** 1 · **DependsOn:** ["P01", "P02"] — P01 va P02 merge bo'lganini tasdiqla (lib/db barrel va api barrel mavjud).

### Qoidalar bloki (har direktivaga kiritilsin — Q-47):

1. **Result<T>** hamma repo/service metodida; `throw/null/undefined` TAQIQ.
2. **@Body** Zod bilan validate; `class-validator` TAQIQ.
3. **Drizzle ORM**; raw SQL faqat murakkab holatda (izoh + `typedExecute<T>`).
4. **Q-40** ishlaydi ≠ to'g'ri: REAL INSERT/UPDATE + DB-proof; echo/hardcoded/fake javob TAQIQ.
5. **Q-46** ishlab turgan kod O'CHIRILMAYDI; buzuq/o'lik/dublikat kod TO'LIQ o'chiriladi (chala emas).
6. **FAYL IZOLYATSIYASI** (Qoida 23 / Q-23 / Q-31): faqat shu paketning OWNED-FILE ro'yxatidagi fayllarga teg. Boshqa fayl kerak bo'lsa — TO'XTA, egasiga flag qil, supurib ketma.
7. **DDL DARVOZASI** (Q-35): `CREATE TABLE` / migration faqat egasi ruxsati bilan; migration faylida `-- APPROVED:` izoh shart. Paket DDL talab qilsa — migrationni YOZ lekin GATED belgila, ISHGA TUSHIRMA.
8. `git add <aniq-fayl>` faqat; `-A` / `.` TAQIQ. Bitta commit = bitta mantiqiy guruh.
9. **Q-45/Q-30** log/secret HECH QACHON commit qilinmaydi; JWT minting yo'q.
10. **Self-verify:** BE tsc 0, FE tsc 0, tegishli reviewer skriptlar, jonli DB-proof (kirit → saqla → qayta o'qi → ko'rinadimi).
11. **"V2"/"Strangler Fig"/"V1 vs V2"** terminologiyasi TAQIQ — bitta kod bazasi, shu joyda to'g'irlanadi.
12. **Vizyon-moslik:** TO'G'RI o'lchovi = master vizyon (`docs/XARITA-REJA-YONALISH` + modul vizyon-hujjati); kod vizyonga zid bo'lsa (ishlasa ham) = xato.

---

## 1. IZOLYATSIYA MANIFESTI

**FAQAT quyidagi fayllarga teg. Boshqa fayl kerak bo'lsa — TO'XTA + egasiga flag qil.**

### DDL (GATED — egasi ruxsatisiz ISHGA TUSHIRMA):
1. `apps/api/src/shared/db/migrations/hr-referral-bonus-config-2026-06-19.sql`
2. `apps/api/src/shared/db/migrations/hr-leave-tabel-contract-2026-06-19.sql`

### Schema:
3. `lib/db/src/schema/hr-recruitment-ext.ts` — yangi fayl (agar yo'q bo'lsa yaratish ruxsat berilgan)

### Backend services:
4. `apps/api/src/modules/hr/recruitment/recruitment-funnel.service.ts`
5. `apps/api/src/modules/hr/recruitment/recruitment.service.ts`
6. `apps/api/src/modules/hr/recruitment/hr-vacancies.service.ts`
7. `apps/api/src/modules/hr/offboarding/hr-offboarding.service.ts`
8. `apps/api/src/modules/hr/events/hr-v2-events.ts`
9. `apps/api/src/modules/hr/leave/leave.service.ts`
10. `apps/api/src/modules/hr/leave/hr-leave.controller.ts` — mavjud: `apps/api/src/modules/hr/leave/` papkasida YO'Q; aslida bu `apps/api/src/modules/hr/presentation/hr-leave.controller.ts`
11. `apps/api/src/modules/hr/presentation/hr-leave.controller.ts`
12. `apps/api/src/modules/hr/career-path/career-path.service.ts`

### Frontend:
13. `artifacts/erp-dashboard/src/pages/HROffboarding.tsx`
14. `artifacts/erp-dashboard/src/pages/RecruitingKanban.tsx`
15. `artifacts/erp-dashboard/src/pages/HRVacationSick.tsx`

> ⚠️ DIQQAT: `apps/api/src/modules/hr/leave/hr-leave.controller.ts` fayli mavjud EMAS (tekshirildi). Shu nomli fayl sifatida `apps/api/src/modules/hr/leave/` papkasida yaratish yoki `presentation/hr-leave.controller.ts` ni o'zgartirish — egasi aniqlasin. **P28 bu qarorni egasiga flag qiladi va `presentation/hr-leave.controller.ts` ga teg.**

---

## 2. VIZYON (Qabul mezoni asosi)

**Manba:** `docs/audit/MUSLIMBEK-PROMT-11-HR-2026-06-08.md` + `docs/audit/CHAT-TARIXI-YANGI-2026-06-08.md`

### 2.1 Karta-markazli HR printsipi

Karta (org_functions) — ishni ta'riflaydi; xodim kartani to'ldiradi. Barcha oylik / reyting / onboarding kartadan keladi va xodim profiliga chiqadi. AI kuzatadi va taklif qiladi; SALBIY ta'sir (jarima / ball tushirish / bloklash / pasaytirish) FAQAT inson tasdiqlashi bilan — hech qachon avtomatik emas.

> ⭐ **Oylik tasdiq-zanjiri (CHAT-TARIXI: AI→HR→moliya→direktor→kassir-PIN)**
> Bu zanjir P27 paketida `hr_payroll_approval_log` jadvali va `§2.2a` bo'limida to'liq
> ta'riflanadi. P28 scope: `leave.service.ts` da `approve()` tabel yozuv yaratishi (EP-HR-069)
> shu zanjirning dastlabki ma'lumot manbasi hisoblanadi — tabeldan HR oyligi hisob qiladi.
> P28 `tabel_entries` yaratib, zanjirning birinchi halqasini to'ldiradi.
>
> ⭐ **Bonus % (OCHIQ EP-HR-014): hardcode TAQIQLANGAN**
> Rekrutment oqimida referral bonus (EP-HR-021) `referral_bonus_config` jadvalidan olinadi
> (bu fayl §5.1 da DDL GATED). Foiz egasi belgilamagan — `bonus_amount` ni egasi admin
> paneldan to'ldiradi (`EGASI QIYMATI KERAK` belgisi bilan yoziladi).

### 2.2 7-bosqichli rekrutment funnel (EP-HR-065)

Vizyon 7 bosqichi:
1. **Portret** — vakansiya portretini tuzish (card ga asoslanib)
2. **Qadoqlash** — vakansiya e'lonini tayyorlash
3. **Oqim** — nomzodlar to'plash (Telegram/HH/Linkedin)
4. **Tez jarayon** — tezkor saralash (skrinning + 10-savol)
5. **Baholash** — chuqur intervyu + test
6. **Karta tayinlash** — kartaga bog'lash (probatsiya boshlaydi)
7. **Kuchaytirish** — onboarding, mentor, 90-kun reja

**Hozirgi holat (tekshirildi):** `recruitment-funnel.service.ts:94-98` da mavjud bosqichlar:
```
'NEW', 'QUESTIONNAIRE_SENT', 'PHONE_SCREENING', 'INTERVIEW_SCHEDULED',
'INTERVIEWED', 'TEST_SENT', 'TEST_ANALYSIS', 'REFERENCES_CHECK',
'PROBATION', 'OFFER_SENT', 'HIRED', 'REJECTED'
```
Bu 12 bosqich — vizyon 7 bosqichiga MOS EMAS. Stage nomlari erkin matn sifatida qabul qilinmoqda, enum validatsiya yo'q.

**Qabul mezoni:** 7 vizyon bosqichi yangi `HrRecruitmentStage` enum sifatida `hr-recruitment-ext.ts` da ta'riflanadi; `RecruitmentFunnelService.getFunnelKanban()` ushbu enum dan foydalanadi.

### 2.3 Vacancy auto-yaratish offboarding da (EP-HR-065)

Xodim offboarding yakunlanganda (`OFFBOARDING_COMPLETED` event) — bo'sh qolgan karta uchun avtomatik vacancy yaratilishi kerak. Hozir `hr-offboarding.service.ts:134` da `HrV2Events.OFFBOARDING_COMPLETED` emit qilinadi lekin `hr-vacancies.service.ts` da bu eventga listener YO'Q.

**Qabul mezoni:** `HrOffboardingService.finalizeCase()` event emit qilganda `HrVacanciesService` listening qiladi va `createVacancyFromCard(employeeId, orgFunctionId)` chaqiradi → real DB INSERT → `VACANCY_CREATED` event.

### 2.4 Referral bonus konfiguratsiyasi (EP-HR-021)

Referral bonus ish o'rniga (org_function) bog'liq konfiguratsiya jadvalidan o'qilishi kerak (hozir FE dan to'g'ridan keladi). Bonus faqat probatsiya o'tgandan keyin to'lanadi.

**Qabul mezoni:** `referral_bonus_config` jadvali `org_function_id` FK bilan mavjud; referral yaratishda shu jadvaldan bonus_type/bonus_amount o'qiladi; `bonus_paid = true` faqat probatsiya tugaganda.

### 2.5 Leave approve → tabel yozish (EP-HR-069)

`LeaveService.approve()` (qator 50-58) hozir faqat `leave_requests.status = 'approved'` qilib qo'yadi. Tabel yozuv YARATILMAYDI. Vizyon: leave approved → tabel_entries da tegishli kunlar uchun 'leave' tipi yoziladi.

**Qabul mezoni:** `approve()` → `hrLeaveSvcRepo.approve(id)` BILAN BIRGA → tabel yozuv INSERT (employee_id, date_range, leave_type, leave_request_id).

### 2.6 Kontrakt 30-kunlik eslatma croni (EP-HR-058)

`employment_contracts` jadvali (lib/db/src/schema/employees.ts:88-113) mavjud, lekin `end_date` ga yaqinlashganda eslatma cron YO'Q.

**Qabul mezoni:** `CareerPathService` yoki yangi cron `@Cron('0 8 * * *')` — `employment_contracts` WHERE `end_date BETWEEN NOW() AND NOW() + 30 days` AND `status = 'active'` → `HrV2Events.CONTRACT_EXPIRY_WARNING` emit.

### 2.7 Business trip → Finance bog'lanish (EP-HR-024/025)

`business_trips` jadvali mavjud, lekin Finance advance/to'lov FK yoki GL yozuv yo'q.

**Qabul mezoni:** `leave.service.ts` da `create()` — leaveType='business_trip' bo'lsa → `BUSINESS_TRIP_FINANCE_LINK` event emit (Finance moduli ushlab oladi; P28 faqat eventni qo'shadi — Finance integratsiyasi Finance paketiga tegishli).

### 2.8 HROffboarding FE — EPComingSoon muammosi

`artifacts/erp-dashboard/src/pages/HROffboarding.tsx:141-142`:
```tsx
{isError && isNotImplementedError(error)
  ? <EPComingSoon />
```
BE REAL ishlaydi (offboarding cases/stats endpoint'lar real DB) lekin FE 501 xato ko'rsa `EPComingSoon` ko'rsatadi. Bu xato — 501 bo'lmagan holda foydalanuvchi "tez orada" ko'radi.

**Qabul mezoni:** `isNotImplementedError` tekshiruvi olib tashlanadi; to'g'ri xato holati ko'rsatiladi; checklist detail panel real render qiladi.

### 2.9 RecruitingKanban — vizyon bosqichlari ko'rinishi

`RecruitingKanban.tsx` da `STAGES` konstanti `@/components/recruiting/helpers` dan keladi. Vizyon 7 bosqichiga mos kelmasa — `helpers` da yangilash kerak (lekin bu fayl OWNED emas). P28 `RecruitingKanban.tsx` ichida vizyon bosqich labellarini to'g'ri ko'rsatishga moslashtiradi.

### 2.10 HRVacationSick — approve/reject amaliyoti yo'q

`HRVacationSick.tsx` faqat `createLeave` mutation mavjud (qator 73-82). HR manager uchun pending so'rovlarni tasdiqlash/rad etish tugmalari YO'Q.

**Qabul mezoni:** `approveLeaveMutation` (`PATCH /api/hr/leave/:id/approve`) va `rejectLeaveMutation` (`PATCH /api/hr/leave/:id/reject`) qo'shiladi; pending so'rovlar uchun tugmalar ko'rsatiladi.

---

## 3. HOZIRGI HOLAT (file:line asosida)

### 3.1 Mavjud (EXISTS)

| Fayl | Qator | Holat |
|------|-------|-------|
| `apps/api/src/modules/hr/recruitment/recruitment-funnel.service.ts` | 1-262 | REAL — funnel CRUD, stage move, websocket emit. Lekin: 12 stage (vizyon 7 emas) |
| `apps/api/src/modules/hr/recruitment/recruitment.service.ts` | 1-53 | REAL — delegation wrapper |
| `apps/api/src/modules/hr/recruitment/hr-vacancies.service.ts` | 1-80+ | REAL — vacancy CRUD, pipeline, channel publish |
| `apps/api/src/modules/hr/offboarding/hr-offboarding.service.ts` | 1-161 | REAL — case create/checklist/exit interview/finalize/cancel |
| `apps/api/src/modules/hr/events/hr-v2-events.ts` | 1-89 | REAL — event constants. `VACANCY_OPENED` event YO'Q |
| `apps/api/src/modules/hr/leave/leave.service.ts` | 1-69 | REAL — findAll/findOne/create/approve/reject. Tabel yozuv YO'Q |
| `apps/api/src/modules/hr/presentation/hr-leave.controller.ts` | 1-179 | REAL — CQRS CommandBus, full CRUD, Zod validate |
| `apps/api/src/modules/hr/career-path/career-path.service.ts` | 1-50+ | REAL — path/progress/cron |
| `artifacts/erp-dashboard/src/pages/HROffboarding.tsx` | 1-161+ | REAL list + stats. Detail panel: `EPComingSoon` xatosi (141-142) |
| `artifacts/erp-dashboard/src/pages/RecruitingKanban.tsx` | 1-80+ | REAL kanban + DnD. Vizyon bosqich nomlari mos emas |
| `artifacts/erp-dashboard/src/pages/HRVacationSick.tsx` | 1-160+ | REAL create. Approve/reject amaliyoti YO'Q |
| `lib/db/src/schema/recruitment.ts` | 12-70 | `vacancies` jadval mavjud, `orgFunctionId` FK bor |
| `lib/db/src/schema/leave.ts` | 12-60 | `leaveRequests` jadval to'liq |
| `lib/db/src/schema/employees.ts` | 88-113 | `employmentContracts` jadval mavjud, `end_date` bor |

### 3.2 Yo'q (MISSING)

| Muammo | Manba | Jiddiylik |
|--------|-------|-----------|
| `referral_bonus_config` jadvali yo'q | EP-HR-021 | P0 |
| Offboarding → VacancyOpenedEvent yo'q | EP-HR-065 | P0 |
| `leave.approve()` → tabel yozuv yo'q | EP-HR-069 | P0 |
| Kontrakt 30-kun eslatma cron yo'q | EP-HR-058 | P1 |
| Business trip → Finance event yo'q | EP-HR-024 | P1 |
| `HrV2Events.VACANCY_OPENED` konstantasi yo'q | hr-v2-events.ts | P0 |
| `HrV2Events.CONTRACT_EXPIRY_WARNING` yo'q | hr-v2-events.ts | P1 |
| `HrV2Events.BUSINESS_TRIP_FINANCE_LINK` yo'q | hr-v2-events.ts | P1 |
| `tabel_entries` jadvali yo'q (leave tabel uchun) | EP-HR-069 | P0 (DDL) |
| Vizyon 7 bosqich enum yo'q (12 mavjud) | EP-HR qadam 2.2 | P1 |
| **YANGI (moslik-audit):** `referral_bonus_config.bonus_amount` egasi qiymati yo'q | OCHIQ EP-HR-021 — EGASI QIYMATI KERAK | P1 |
| **YANGI (moslik-audit, P27 bilan birgalikda):** Oylik tasdiq-zanjiri (AI→HR→moliya→direktor→kassir-PIN) | CHAT-TARIXI — `hr_payroll_approval_log` P27 da | xabar-ref |

### 3.3 Buzuq/Soxta (BROKEN/FAKE)

| Fayl:qator | Muammo | EP |
|------------|--------|-----|
| `recruitment-funnel.service.ts:94-98` | 12 bosqich ro'yxati vizyon 7 dan farqli; FE Kanban noto'g'ri bosqich nomlari ko'rsatadi | EP-HR-065 |
| `HROffboarding.tsx:141-142` | `isNotImplementedError` → `EPComingSoon` — BE real ishlaydi, lekin FE har qanday xatoda "tez orada" ko'rsatadi; foydalanuvchi real xatoni ko'rmaydi | Q-40 |
| `hr-offboarding.service.ts:134` | `OFFBOARDING_COMPLETED` emit — vacancy auto-yaratish listener YO'Q; bo'sh karta zamonaviy rekrutmentga chiqmaydi | EP-HR-065 |
| `leave.service.ts:50-58` | `approve()` — status yangilanadi, tabel yozuv yo'q; oylik hisob tabel asosida bo'lishi kerak | EP-HR-069 |
| `hr-v2-events.ts` | `VACANCY_OPENED` event yo'q; offboarding → vacancy zanjiri uzilgan | — |

---

## 4. ISH (Qadam-baqadam)

> Har qadam: fayl → aniq o'zgarish → oldin/keyin sketch → verifikatsiya.
> DDL qadamlari `§5` da — egasi ruxsatisiz migration ISHGA TUSHIRILMAYDI.

---

### QADAM 1: `hr-v2-events.ts` — Yangi event konstantalari qo'shish

**Fayl:** `apps/api/src/modules/hr/events/hr-v2-events.ts`

**Oldin (qator 54-56):**
```typescript
OFFBOARDING_STARTED: 'offboarding.started',
OFFBOARDING_COMPLETED: 'offboarding.completed',
OFFBOARDING_AUTO_BLOCK: 'offboarding.auto_block',
```

**Keyin (qator 54-60):**
```typescript
OFFBOARDING_STARTED: 'offboarding.started',
OFFBOARDING_COMPLETED: 'offboarding.completed',
OFFBOARDING_AUTO_BLOCK: 'offboarding.auto_block',

VACANCY_OPENED: 'recruitment.vacancy_opened',
CONTRACT_EXPIRY_WARNING: 'hr.contract.expiry_warning',
BUSINESS_TRIP_FINANCE_LINK: 'hr.business_trip.finance_link',
TABEL_ENTRY_CREATED: 'hr.tabel.entry_created',
```

**Tekshiruv:** `tsc` da xato yo'q; event nomlar `snake_case` da, modul.entity.amal formatida (NOMLASHTIRISH_QOIDALARI).

---

### QADAM 2: `hr-recruitment-ext.ts` — Vizyon 7-bosqich enum + referral_bonus_config schema

**Fayl:** `lib/db/src/schema/hr-recruitment-ext.ts` (yangi fayl)

```typescript
/**
 * @module hr-recruitment-ext
 * @description HR recruitment extension: 7-stage vision enum + referral bonus config schema.
 * EP-HR-021 (referral bonus per position), EP-HR-065 (7-stage funnel).
 * DDL: apps/api/src/shared/db/migrations/hr-referral-bonus-config-2026-06-19.sql
 */

import {
  pgTable, serial, integer, varchar, decimal, boolean,
  timestamp, text, check, index, pgEnum,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

/**
 * Vizyon 7-bosqich rekrutment funnel (EP-HR-065 / CHAT-TARIXI).
 * 1=Portret, 2=Qadoqlash, 3=Oqim, 4=Tez-jarayon, 5=Baholash,
 * 6=Karta-tayinlash, 7=Kuchaytirish.
 * REJECTED va HIRED terminal holatlar sifatida saqlanadi.
 */
export const hrRecruitmentStageEnum = pgEnum('hr_recruitment_stage', [
  'PORTRET',        // 1 — vakansiya portretini tuzish (card dan)
  'QADOQLASH',      // 2 — e'lon tayyorlash
  'OQIM',           // 3 — nomzodlar to'plash
  'TEZ_JARAYON',    // 4 — tezkor saralash (10-savol skrinning)
  'BAHOLASH',       // 5 — chuqur intervyu + test
  'KARTA_TAYINLASH', // 6 — kartaga bog'lash, probatsiya boshlaydi
  'KUCHAYTIRISH',   // 7 — onboarding, mentor, 90-kun
  'HIRED',          // terminal: yollandi
  'REJECTED',       // terminal: rad etildi
]);

export type HrRecruitmentStage = typeof hrRecruitmentStageEnum.enumValues[number];

/**
 * Vizyon bosqich tartibi (Kanban uchun).
 * EP-HR-065: 7 bosqich ketma-ketligi.
 */
export const HR_RECRUITMENT_STAGE_ORDER: HrRecruitmentStage[] = [
  'PORTRET',
  'QADOQLASH',
  'OQIM',
  'TEZ_JARAYON',
  'BAHOLASH',
  'KARTA_TAYINLASH',
  'KUCHAYTIRISH',
];

export const HR_RECRUITMENT_TERMINAL_STAGES: HrRecruitmentStage[] = [
  'HIRED',
  'REJECTED',
];

/**
 * Referral bonus konfiguratsiyasi (EP-HR-021).
 * Har bir lavozim (org_function) uchun alohida referral bonus miqdori.
 * Bonus faqat probatsiya o'tgandan keyin to'lanadi (probation_days_required).
 * DDL: hr-referral-bonus-config-2026-06-19.sql — GATED.
 */
export const referralBonusConfig = pgTable('referral_bonus_config', {
  id: serial('id').primaryKey(),
  // FK to org_functions — canonik jadval (ADR-001)
  orgFunctionId: integer('org_function_id').notNull(),
  bonusType: varchar('bonus_type', { length: 20 }).notNull().default('sum'),
  // sum = pul miqdori (UZS), leave = qo'shimcha ta'til kunlari
  // ⚠️ EGASI QIYMATI KERAK: bonusAmount ni egasi har lavozim uchun admin paneldan belgilaydi.
  // Hardcode/default miqdor TAQIQLANGAN (OCHIQ EP-HR-021).
  bonusAmount: decimal('bonus_amount', { precision: 12, scale: 2 }).notNull(),
  // Probatsiya tugaganidan so'ng necha kun o'tib bonus to'lanadi
  probationDaysRequired: integer('probation_days_required').notNull().default(90),
  isActive: boolean('is_active').notNull().default(true),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  check(
    'referral_bonus_config_type_chk',
    sql`${t.bonusType} IN ('sum', 'leave')`,
  ),
  check(
    'referral_bonus_config_amount_chk',
    sql`${t.bonusAmount} > 0`,
  ),
  check(
    'referral_bonus_config_probation_chk',
    sql`${t.probationDaysRequired} >= 0`,
  ),
  index('idx_referral_bonus_config_org_function_id').on(t.orgFunctionId),
  index('idx_referral_bonus_config_active').on(t.isActive),
]);

/**
 * Tabel yozuvlari (EP-HR-069).
 * Leave approve → tabel_entries da kunlik yozuv yaratiladi.
 * DDL: hr-leave-tabel-contract-2026-06-19.sql — GATED.
 */
export const tabelEntries = pgTable('tabel_entries', {
  id: serial('id').primaryKey(),
  employeeId: integer('employee_id').notNull(),
  entryDate: varchar('entry_date', { length: 10 }).notNull(), // ISO 'YYYY-MM-DD'
  entryType: varchar('entry_type', { length: 30 }).notNull(),
  // 'worked','leave','sick','business_trip','absent','holiday','otgul'
  leaveRequestId: integer('leave_request_id'),
  // Leave dan kelgan bo'lsa FK
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  createdBy: integer('created_by'),
  // Tabel qo'lda kiritilgan bo'lsa kim kiritdi
}, (t) => [
  check(
    'tabel_entries_type_chk',
    sql`${t.entryType} IN (
      'worked','leave','sick','business_trip','absent','holiday','otgul','late'
    )`,
  ),
  index('idx_tabel_entries_employee_id').on(t.employeeId),
  index('idx_tabel_entries_date').on(t.entryDate),
  index('idx_tabel_entries_leave_request_id').on(t.leaveRequestId),
]);

export type TabelEntryInsert = typeof tabelEntries.$inferInsert;
export type ReferralBonusConfigInsert = typeof referralBonusConfig.$inferInsert;
```

**Tekshiruv:** `pnpm --filter @europrint/db build` — 0 xato. Yangi enum va jadvallar exported.

---

### QADAM 3: Migration fayllari (GATED — egasi ruxsatisiz ISHGA TUSHIRILMAYDI)

Ikki migration fayliga qarang `§5` — bu bo'limda faqat MOCK ko'rinish:

- `hr-referral-bonus-config-2026-06-19.sql` → `referral_bonus_config` jadvali + enum
- `hr-leave-tabel-contract-2026-06-19.sql` → `tabel_entries` jadvali + kontrakt indekslari

---

### QADAM 4: `hr-vacancies.service.ts` — Offboarding → VacancyOpened listener

**Fayl:** `apps/api/src/modules/hr/recruitment/hr-vacancies.service.ts`

**Muammo:** `OFFBOARDING_COMPLETED` event emit bo'ladi lekin hech kim ushlamaydi; bo'sh karta uchun vacancy avtomatik yaratilmaydi (EP-HR-065).

**Oldin (mavjud import bloki, qator 1-11):**
```typescript
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DrizzleHrVacanciesRepository } from './repos/drizzle-hr-vacancies.repo';
import { Result, safeCall } from '@common/result';
```

**Keyin:**
```typescript
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { DrizzleHrVacanciesRepository } from './repos/drizzle-hr-vacancies.repo';
import { Result, safeCall, Ok, Err, AppErr } from '@common/result';
import { HrV2Events } from '../events/hr-v2-events';
```

**Yangi metod qo'shish** (mavjud `findCandidateStats` dan keyin, fayl oxiriga yaqin):

```typescript
  /**
   * Offboarding yakunlanganda bo'sh karta uchun vacancy auto-yaratish.
   * EP-HR-065: xodim ketsa karta bo'sh qoladi → rekrutment boshlaydi.
   * Listener: HrV2Events.OFFBOARDING_COMPLETED
   */
  @OnEvent(HrV2Events.OFFBOARDING_COMPLETED)
  async onOffboardingCompleted(payload: {
    caseId: number;
    employeeId: number;
    orgFunctionId?: number | null;
  }): Promise<void> {
    // orgFunctionId mavjud bo'lsa vacancy yaratamiz
    if (!payload.orgFunctionId) {
      this.logger.warn(
        `Offboarding case #${payload.caseId}: orgFunctionId yo'q — vacancy yaratilmaydi`,
      );
      return;
    }

    const result = await safeCall(async () => {
      const created = await this.repo.create({
        title: `Avtomatik — karta #${payload.orgFunctionId} (offboarding #${payload.caseId})`,
        status: 'draft',
        orgFunctionId: payload.orgFunctionId ?? undefined,
        description: `Xodim #${payload.employeeId} offboarding yakunlangandan so'ng avtomatik yaratildi`,
      });
      if (!created.ok) throw new Error(String(created.error));
      this.events.emit(HrV2Events.VACANCY_CREATED, {
        vacancyId: (created.data as Record<string, unknown>)['id'],
        orgFunctionId: payload.orgFunctionId,
        source: 'offboarding_auto',
        createdAt: new Date(),
      });
      this.events.emit(HrV2Events.VACANCY_OPENED, {
        vacancyId: (created.data as Record<string, unknown>)['id'],
        orgFunctionId: payload.orgFunctionId,
        triggeredByOffboardingCase: payload.caseId,
      });
      return created.data;
    });

    if (!result.ok) {
      this.logger.error(
        `Offboarding #${payload.caseId} → vacancy auto-yaratishda xato: ${String(result.error)}`,
      );
    } else {
      this.logger.log(
        `Offboarding #${payload.caseId} → vacancy auto-yaratildi: orgFunctionId=${payload.orgFunctionId}`,
      );
    }
  }
```

**DB-proof:** `INSERT INTO vacancies (title, status, org_function_id) VALUES (...)` real bajarilishini tekshir: `SELECT id, title, status FROM vacancies WHERE title LIKE 'Avtomatik%' ORDER BY id DESC LIMIT 1;`

---

### QADAM 5: `leave.service.ts` — Approve → tabel yozuv

**Fayl:** `apps/api/src/modules/hr/leave/leave.service.ts`

**Muammo:** `approve()` (qator 50-58) faqat `leave_requests.status` ni yangilaydi. Tabel yozuvi yaratilmaydi (EP-HR-069).

**Oldin (qator 50-58):**
```typescript
async approve(id: number){
  const onlyPendingMsg = await this.i18n.t('errors.onlyPendingApprovable');
  return safeCall(async () => {
    const leave = await this.findOne(id);
    if (leave.status !== 'pending') throw new BadRequestException(onlyPendingMsg);
    const result = await this.hrLeaveSvcRepo.approve(id);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
  });
}
```

**Keyin:**
```typescript
async approve(id: number): Promise<Result<object, AppError>> {
  const onlyPendingMsg = await this.i18n.t('errors.onlyPendingApprovable');
  return safeCall(async () => {
    const leave = await this.findOne(id);
    if (leave.status !== 'pending') throw new BadRequestException(onlyPendingMsg);

    const result = await this.hrLeaveSvcRepo.approve(id);
    if (!result.ok) throw new InternalServerErrorException(result.error);

    // EP-HR-069: leave approve → tabel yozuv (har kun uchun bitta yozuv)
    const startDate = new Date(String(leave.startDate ?? leave.start_date ?? ''));
    const endDate   = new Date(String(leave.endDate   ?? leave.end_date   ?? ''));
    const employeeId = Number(leave.employeeId ?? leave.employee_id ?? 0);
    const leaveType  = String(leave.leaveType ?? leave.leave_type ?? 'leave');

    if (employeeId > 0 && !isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
      const tabelResult = await this.hrLeaveSvcRepo.createTabelEntries({
        employeeId,
        leaveRequestId: id,
        startDate,
        endDate,
        entryType: leaveType === 'sick' ? 'sick'
          : leaveType === 'business_trip' ? 'business_trip'
          : 'leave',
      });
      if (!tabelResult.ok) {
        // Tabel xatosi leave approve ni bloklamaydi — log va davom
        this.logger.warn(
          `Leave #${id} tasdiqlandi lekin tabel yozuv yaratilmadi: ${String(tabelResult.error)}`,
        );
      }
    }

    // EP-HR-024: Business trip → Finance event
    if (leaveType === 'business_trip') {
      // Finance moduli shu eventni ushlab GL yozuv yaratadi (P28 faqat emit)
      // Finance integratsiyasi Finance paketida (owned file emas — event orqali)
    }

    return result.data;
  });
}
```

**DIQQAT:** `hrLeaveSvcRepo.createTabelEntries()` metodi `IHrLeaveSvcRepository` interfeys va `DrizzleHrLeaveSvcRepository` da qo'shilishi kerak. Lekin bu fayl OWNED emas (`i-hr-leave-svc.repo.ts`, `drizzle-hr-leave-svc.repo.ts`). **TO'XTA → Egasiga flag:** `apps/api/src/modules/hr/leave/i-hr-leave-svc.repo.ts` va `drizzle-hr-leave-svc.repo.ts` fayllari P28 OWNED list da yo'q. Shu fayllarni o'zgartirish uchun egasi ruxsat berishi kerak YOKI `createTabelEntries` ni to'g'ridan `leave.service.ts` ichida `@Inject(DATABASE_CONNECTION)` orqali Drizzle bilan amalga oshirish.

**Agent qadam:** Agar egasi ruxsat bermasa — `leave.service.ts` da `@Inject('DRIZZLE')` qo'shib to'g'ridan insert qilish (tabelga yozuv oddiy INSERT, murakkab logika yo'q):

```typescript
// leave.service.ts konstruktorga qo'shish (egasi ruxsati bilan):
import { DRIZZLE_TOKEN } from '@shared/db/drizzle.module';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { tabelEntries } from '@db/schema/hr-recruitment-ext';
import { eq, and, gte, lte } from 'drizzle-orm';

// constructor ichida:
@Inject(DRIZZLE_TOKEN) private readonly db: NodePgDatabase,
```

**DB-proof:** Leave approve qilingandan so'ng:
```sql
SELECT * FROM tabel_entries WHERE leave_request_id = <id>;
-- Natija: start_date dan end_date gacha har kun uchun bir qator
```

---

### QADAM 6: `hr-offboarding.service.ts` — Offboarding orgFunctionId payload ga qo'shish

**Fayl:** `apps/api/src/modules/hr/offboarding/hr-offboarding.service.ts`

**Muammo:** `OFFBOARDING_COMPLETED` emit (qator 134-138) da `orgFunctionId` yuborilmaydi. `HrVacanciesService` listener bu ma'lumotni bilmaydi.

**Oldin (qator 133-138):**
```typescript
if (finalized.ok) {
  this.eventEmitter.emit(HrV2Events.OFFBOARDING_COMPLETED, {
    caseId,
    employeeId: Number(row['employee_id'] ?? 0),
  });
}
```

**Keyin:**
```typescript
if (finalized.ok) {
  // EP-HR-065: orgFunctionId ni ham yuboramiz — vacancy auto-yaratish uchun
  // org_function_id employees jadvalidan olinadi (xodim profili)
  const empFunctionId = (row['org_function_id'] as number | null) ?? null;
  this.eventEmitter.emit(HrV2Events.OFFBOARDING_COMPLETED, {
    caseId,
    employeeId: Number(row['employee_id'] ?? 0),
    orgFunctionId: empFunctionId,
  });
}
```

**DIQQAT:** `row['org_function_id']` — offboarding_cases jadvalida bu ustun bo'lmasligi mumkin. Repository `findCaseById` so'rovida employees JOIN bilan kelishi kerak. Bu ham owned fayl EMAS (`hr-offboarding.repository.ts`). **Flag:** repo ni JOIN bilan yangilash egasi ruxsatini talab qiladi.

**Muqobil yechim (owned fayl ichida):** Agar repo JOIN qilmasa — `row['org_function_id']` `null` bo'ladi; `HrVacanciesService.onOffboardingCompleted()` listener null ni log qilib o'tadi (QADAM 4 da ko'rsatilgan). Funksionallik degredatsiya bilan ishlaydi — vacancy auto-yaratilmaydi, log keladi. Egasi repo JOIN ni keyinroq qo'shishi mumkin.

---

### QADAM 7: `recruitment-funnel.service.ts` — Vizyon bosqichlari (Kanban display)

**Fayl:** `apps/api/src/modules/hr/recruitment/recruitment-funnel.service.ts`

**Muammo:** `getFunnelKanban()` (qator 89-105) 12 eski bosqich ro'yxatini ishlatadi. Vizyon 7 bosqich + 2 terminal = 9 holat.

**Oldin (qator 94-98):**
```typescript
const stages: FunnelStage[] = [
  'NEW', 'QUESTIONNAIRE_SENT', 'PHONE_SCREENING', 'INTERVIEW_SCHEDULED',
  'INTERVIEWED', 'TEST_SENT', 'TEST_ANALYSIS', 'REFERENCES_CHECK',
  'PROBATION', 'OFFER_SENT', 'HIRED', 'REJECTED',
];
```

**Keyin:**
```typescript
// EP-HR-065: Vizyon 7-bosqich + 2 terminal holat (HIRED/REJECTED)
// Eski DB yozuvlari (NEW/QUESTIONNAIRE_SENT/...) legacy map orqali vizyon bosqichiga o'giriladi
const stages: FunnelStage[] = [
  'NEW',                 // portret bosqichi ekvivalenti (legacy compat)
  'QUESTIONNAIRE_SENT',  // qadoqlash ekvivalenti
  'PHONE_SCREENING',     // oqim bosqichi
  'INTERVIEW_SCHEDULED', // tez-jarayon bosqichi
  'INTERVIEWED',         // baholash bosqichi
  'PROBATION',           // karta-tayinlash bosqichi
  'HIRED',               // kuchaytirish + yollandi
  'REJECTED',            // rad etildi
];
// NOTE: Vizyon bosqich nomlari (PORTRET/QADOQLASH/OQIM va h.k.) enum sifatida
// hr-recruitment-ext.ts da mavjud. DB migration yozilgandan va egasi ruxsat bergandan
// so'ng yangi enum ga to'liq o'tish mumkin. Hozir: legacy stage nomlari saqlanadi,
// lekin Kanban to'g'ri label bilan ko'rsatadi (FE RecruitingKanban.tsx da).
```

**Vizyon label map** qo'shish (funnel service yoki FE helpers da):

```typescript
// Eski DB stage → Vizyon label mapping (FE uchun)
export const STAGE_VISION_LABEL: Record<string, string> = {
  'NEW':                 'Portret',
  'QUESTIONNAIRE_SENT':  'Qadoqlash',
  'PHONE_SCREENING':     'Oqim',
  'INTERVIEW_SCHEDULED': 'Tez jarayon',
  'INTERVIEWED':         'Baholash',
  'TEST_SENT':           'Baholash',
  'TEST_ANALYSIS':       'Baholash',
  'REFERENCES_CHECK':    'Baholash',
  'PROBATION':           'Karta tayinlash',
  'OFFER_SENT':          'Kuchaytirish',
  'HIRED':               'Yollandi',
  'REJECTED':            'Rad etildi',
};
```

**Export qilish:** `recruitment-funnel.service.ts` dan export qilinadi — FE import qiladi.

---

### QADAM 8: `career-path.service.ts` — Kontrakt 30-kun eslatma croni

**Fayl:** `apps/api/src/modules/hr/career-path/career-path.service.ts`

**Muammo:** `employment_contracts.end_date` ga yaqinlashganda eslatma yo'q (EP-HR-058).

**Yangi import qo'shish:**
```typescript
import { Cron, CronExpression } from '@nestjs/schedule';
import { HrV2Events } from '../events/hr-v2-events';
```

**Yangi metod qo'shish** (mavjud `@Cron` metodlaridan keyin):

```typescript
  /**
   * EP-HR-058: Kontrakt 30-kunlik eslatma.
   * Har kuni 08:00 da employment_contracts WHERE end_date <= NOW() + 30 days
   * va status='active' — har bir uchun CONTRACT_EXPIRY_WARNING event emit.
   * Payroll/HR dashboard shu eventni ushlab eslatma ko'rsatadi.
   */
  @Cron('0 8 * * *')
  async checkContractExpiry(): Promise<void> {
    const result = await safeCall(async () => {
      return this.repo.findContractsExpiringInDays(30);
    });

    if (!result.ok) {
      this.logger.error(`Kontrakt eslatma cron xato: ${String(result.error)}`);
      return;
    }

    const contracts = Array.isArray(result.data) ? result.data : [];
    for (const contract of contracts) {
      const row = contract as Record<string, unknown>;
      this.eventEmitter.emit(HrV2Events.CONTRACT_EXPIRY_WARNING, {
        contractId: Number(row['id'] ?? 0),
        employeeId: Number(row['employee_id'] ?? 0),
        endDate: String(row['end_date'] ?? ''),
        daysRemaining: Number(row['days_remaining'] ?? 30),
      });
      this.logger.log(
        `Kontrakt #${row['id']} eslatma: xodim #${row['employee_id']}, tugash: ${row['end_date']}`,
      );
    }
  }
```

**DIQQAT:** `this.repo.findContractsExpiringInDays(30)` — `CareerPathRepository` da bu metod YO'Q. Lekin `career-path.repository.ts` owned fayl emas. **Flag egasiga:** `CareerPathRepository` ga yangi metod qo'shish ruxsatini so'rang. Muqobil: `CareerPathService` da `@Inject(DRIZZLE_TOKEN)` orqali to'g'ridan query:

```typescript
// Muqobil yechim — repo o'zgartirish kerak emas:
import { employmentContracts } from '@db/schema/employees';
import { lte, gte, eq, sql as drizzleSql } from 'drizzle-orm';

// constructor da:
@Inject(DRIZZLE_TOKEN) private readonly db: NodePgDatabase,

// checkContractExpiry ichida:
const rows = await this.db
  .select({
    id: employmentContracts.id,
    employeeId: employmentContracts.employeeId,
    endDate: employmentContracts.endDate,
    daysRemaining: drizzleSql<number>`
      EXTRACT(day FROM (${employmentContracts.endDate}::date - CURRENT_DATE))
    `.as('days_remaining'),
  })
  .from(employmentContracts)
  .where(
    and(
      eq(employmentContracts.status, 'active'),
      lte(
        employmentContracts.endDate,
        drizzleSql`(CURRENT_DATE + INTERVAL '30 days')::date`,
      ),
      gte(employmentContracts.endDate, drizzleSql`CURRENT_DATE`),
    ),
  );
```

---

### QADAM 9: `HROffboarding.tsx` — EPComingSoon muammosini tuzatish

**Fayl:** `artifacts/erp-dashboard/src/pages/HROffboarding.tsx`

**Muammo (qator 141-144):**
```tsx
{isError && isNotImplementedError(error)
  ? <EPComingSoon />
  : isError
    ? <EPErrorState onRetry={refetch} />
```

BE REAL ishlaydi — 501 bo'lmagan xatolarda ham `EPComingSoon` ko'rsatilishi xato (Q-40, Q-46).

**Keyin:**
```tsx
{isError
  ? <EPErrorState onRetry={refetch} />
  : (
```

`isNotImplementedError` importi ham o'chiriladi (yetakchi import blokidan):
```tsx
// O'chiriladi:
import { isNotImplementedError } from "@/hooks/useNotImplemented";
```

**DB-proof:** `/api/hr/offboarding/cases` → 200 qaytarish kerak; checklist detail panel real ma'lumot ko'rsatadi.

---

### QADAM 10: `HRVacationSick.tsx` — Approve/Reject mutationlar qo'shish

**Fayl:** `artifacts/erp-dashboard/src/pages/HRVacationSick.tsx`

**Muammo:** Faqat `createLeave` mutation mavjud. HR manager pending so'rovlarni tasdiqlay/rad eta olmaydi.

**Import qo'shish** (mavjud import qatoriga qo'shish):
```tsx
import { useQueryClient } from "@tanstack/react-query";
// (allaqachon qator 7 da bor — tekshir)
```

**Yangi mutation qo'shish** (mavjud `createLeave` mutationdan keyin, qator 82+ da):

```tsx
  const approveLeaveMutation = useMutation({
    mutationFn: (leaveId: number) =>
      apiRequest("PATCH", `/api/hr/leave/${leaveId}/approve`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/leave-requests"] });
      toast({ title: "Ta'til so'rovi tasdiqlandi" });
    },
    onError: () => toast({ title: "Tasdiqlashda xatolik", variant: "destructive" }),
  });

  const rejectLeaveMutation = useMutation({
    mutationFn: (leaveId: number) =>
      apiRequest("PATCH", `/api/hr/leave/${leaveId}/reject`, { reason: "HR tomonidan rad etildi" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/leave-requests"] });
      toast({ title: "Ta'til so'rovi rad etildi" });
    },
    onError: () => toast({ title: "Rad etishda xatolik", variant: "destructive" }),
  });
```

**Jadval qatoriga tugmalar qo'shish** (mavjud holat `Badge` yoniga):

```tsx
// Status ustunini kengaytirish:
<TableCell>
  <div className="flex items-center gap-1.5">
    <Badge variant={
      v.status === "approved" ? "default" :
      v.status === "rejected" ? "destructive" : "secondary"
    }>
      {v.status === "approved" ? "Tasdiqlangan"
        : v.status === "rejected" ? "Rad etilgan"
        : "Kutilmoqda"}
    </Badge>
    {v.status === "pending" && (
      <>
        <Button
          size="xs"
          variant="outline"
          className="h-6 text-[11px] text-green-600 border-green-300"
          onClick={() => approveLeaveMutation.mutate(Number(v.id))}
          disabled={approveLeaveMutation.isPending}
          data-testid={`btn-approve-${v.id}`}
        >
          ✓
        </Button>
        <Button
          size="xs"
          variant="outline"
          className="h-6 text-[11px] text-red-600 border-red-300"
          onClick={() => rejectLeaveMutation.mutate(Number(v.id))}
          disabled={rejectLeaveMutation.isPending}
          data-testid={`btn-reject-${v.id}`}
        >
          ✗
        </Button>
      </>
    )}
  </div>
</TableCell>
```

**DB-proof:** Pending so'rov ni `✓` bosgach → `PATCH /api/hr/leave/:id/approve` → 200; jadval yangilanadi → status "Tasdiqlangan".

---

### QADAM 11: `presentation/hr-leave.controller.ts` — Leave-requests compat route

**Fayl:** `apps/api/src/modules/hr/presentation/hr-leave.controller.ts`

**Muammo:** `HRVacationSick.tsx` `/api/hr/leave-requests` URL ga so'rov yuboradi (qator 70 da):
```tsx
queryKey: ["/api/hr/leave-requests"],
```
Lekin `hr-leave.controller.ts` `@Controller('hr/leave')` → `/api/hr/leave` da. FE va BE URL mos emas (Q-18 / Qoida 18).

**Tekshirish:** `presentation/hr-leave.controller.ts` da `@Get('requests-compat')` yoki `/api/hr/leave-requests` route bormi?

Agar yo'q bo'lsa — **GET /leave-requests → /leave redirect alias** qo'shish:

```typescript
// hr-leave.controller.ts ga qo'shish (mavjud @Get() metodidan oldin):
@ApiOperation({ summary: 'Get leave requests (FE compat alias)' })
@Get('requests')
@Roles('HR_MANAGER', 'SUPER_ADMIN', 'DIRECTOR')
async getLeaveRequestsAlias(@Query() query: Record<string, unknown>) {
  const validated = GetLeavesDtoSchema.parse(query);
  const result = await this.queryBus.execute(
    new GetLeavesQuery(
      validated.employeeId, validated.status, validated.leaveType,
      validated.page, validated.limit,
    ),
  );
  return unwrapOrDefault(result, { items: [], total: 0 });
}
```

**YOKI** `HRVacationSick.tsx` da URL ni to'g'irlash:
```tsx
// Eski:
queryKey: ["/api/hr/leave-requests"],
// Yangi:
queryKey: ["/api/hr/leave"],
queryFn: () => apiRequest("GET", "/api/hr/leave"),
```

**Tavsiya:** FE URL ni to'g'irlash (FE owned file) — BE route o'zgartirmasdan.

---

### QADAM 12: `RecruitingKanban.tsx` — Vizyon label ko'rsatish

**Fayl:** `artifacts/erp-dashboard/src/pages/RecruitingKanban.tsx`

**Muammo:** Kanban ustunlari `STAGES` konstantidan label oladi (`@/components/recruiting/helpers` — owned emas). P28 faqat `RecruitingKanban.tsx` ichida label overrideini qo'sha oladi.

**Qo'shish (yangi import):**
```tsx
import { STAGE_VISION_LABEL } from '@/modules/hr/recruitment/recruitment-funnel.types';
// YOKI:
// recruitment-funnel.service.ts dan export qilingan STAGE_VISION_LABEL ni
// FE types fayliga ham qo'yish kerak — bu owned file emas (flag).
```

**Muqobil:** `RecruitingKanban.tsx` ichida lokal label map:

```tsx
const VISION_LABELS: Record<string, string> = {
  'NEW':                 'Portret (1/7)',
  'QUESTIONNAIRE_SENT':  'Qadoqlash (2/7)',
  'PHONE_SCREENING':     'Oqim (3/7)',
  'INTERVIEW_SCHEDULED': 'Tez jarayon (4/7)',
  'INTERVIEWED':         'Baholash (5/7)',
  'PROBATION':           'Karta tayinlash (6/7)',
  'OFFER_SENT':          'Kuchaytirish (7/7)',
  'HIRED':               'Yollandi ✓',
  'REJECTED':            'Rad etildi ✗',
  'TEST_SENT':           'Baholash (test)',
  'TEST_ANALYSIS':       'Baholash (tahlil)',
  'REFERENCES_CHECK':    'Baholash (nazorat)',
};
```

Kanban header da `VISION_LABELS[stage] ?? stage` ishlatish.

---

## 5. DDL (Egasi ruxsati GATED)

> **Quyidagi SQL fayllar YOZILADI lekin `-- APPROVED:` bilan to'ldirilmaguncha ISHGA TUSHIRILMAYDI.**
> Har fayl `apps/api/src/shared/db/migrations/` da joylashadi.

### 5.1 `hr-referral-bonus-config-2026-06-19.sql`

```sql
-- MIGRATION: hr-referral-bonus-config-2026-06-19
-- EP-HR-021: Referral bonus per-position configurable table
-- APPROVED: <EGASI_ISMI> <SANA>
-- DDL DARVOZASI: Bu faylni faqat egasi ruxsati bilan ishga tushiring!

BEGIN;

-- referral_bonus_config jadval
CREATE TABLE IF NOT EXISTS referral_bonus_config (
    id                     SERIAL PRIMARY KEY,
    org_function_id        INTEGER NOT NULL
                               REFERENCES org_functions(id) ON DELETE CASCADE,
    bonus_type             VARCHAR(20)      NOT NULL DEFAULT 'sum'
                               CHECK (bonus_type IN ('sum','leave')),
    -- ⚠️ EGASI QIYMATI KERAK: bonus_amount ni egasi har lavozim uchun admin paneldan belgilaydi.
    -- Hardcode/default miqdor TAQIQLANGAN (OCHIQ EP-HR-021 / OCHIQ EP-HR-014).
    bonus_amount           NUMERIC(12,2)    NOT NULL
                               CHECK (bonus_amount > 0),
    probation_days_required INTEGER         NOT NULL DEFAULT 90
                               CHECK (probation_days_required >= 0),
    is_active              BOOLEAN          NOT NULL DEFAULT true,
    notes                  TEXT,
    created_at             TIMESTAMPTZ      NOT NULL DEFAULT now(),
    updated_at             TIMESTAMPTZ      NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_referral_bonus_config_org_function_id
    ON referral_bonus_config(org_function_id);
CREATE INDEX IF NOT EXISTS idx_referral_bonus_config_active
    ON referral_bonus_config(is_active);

COMMENT ON TABLE referral_bonus_config IS
    'EP-HR-021: Har bir lavozim (org_function) uchun referral bonus konfiguratsiyasi. '
    'bonus_type=sum → UZS miqdori; bonus_type=leave → qo`shimcha ta`til kunlari. '
    'Bonus faqat probation_days_required kundan so`ng to`lanadi.';

COMMIT;
```

### 5.2 `hr-leave-tabel-contract-2026-06-19.sql`

```sql
-- MIGRATION: hr-leave-tabel-contract-2026-06-19
-- EP-HR-069: Tabel entries (leave approve → tabel write)
-- EP-HR-058: Contract expiry index
-- APPROVED: <EGASI_ISMI> <SANA>
-- DDL DARVOZASI: Bu faylni faqat egasi ruxsati bilan ishga tushiring!

BEGIN;

-- tabel_entries jadval (EP-HR-069)
CREATE TABLE IF NOT EXISTS tabel_entries (
    id               SERIAL PRIMARY KEY,
    employee_id      INTEGER     NOT NULL
                         REFERENCES employees(id) ON DELETE CASCADE,
    entry_date       DATE        NOT NULL,
    entry_type       VARCHAR(30) NOT NULL
                         CHECK (entry_type IN (
                             'worked','leave','sick','business_trip',
                             'absent','holiday','otgul','late'
                         )),
    leave_request_id INTEGER     REFERENCES leave_requests(id) ON DELETE SET NULL,
    notes            TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by       INTEGER
);

CREATE UNIQUE INDEX IF NOT EXISTS uix_tabel_entries_employee_date
    ON tabel_entries(employee_id, entry_date);
-- Bir kunda bir xodimga faqat bitta tabel yozuvi
-- (agar ikki yo'naltirish to'qnashsa — keyingisi XATO beradi, biznes qaror kerak)

CREATE INDEX IF NOT EXISTS idx_tabel_entries_employee_id
    ON tabel_entries(employee_id);
CREATE INDEX IF NOT EXISTS idx_tabel_entries_date
    ON tabel_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_tabel_entries_leave_request_id
    ON tabel_entries(leave_request_id);

COMMENT ON TABLE tabel_entries IS
    'EP-HR-069: Xodim tabelasi. Leave approve → avtomatik yozuv. '
    'Oylik hisob uchun asosiy manba. entry_type per da"m olish katalog. '
    'Unikal (employee_id, entry_date) — bir kunda bitta holat.';

-- employment_contracts: expiry indeks (EP-HR-058 cron uchun)
CREATE INDEX IF NOT EXISTS idx_emp_contracts_end_date_status
    ON employment_contracts(end_date, status)
    WHERE status = 'active';

COMMENT ON INDEX idx_emp_contracts_end_date_status IS
    'EP-HR-058: Faol kontraktlar expiry cron uchun partial index. '
    'SELECT FROM employment_contracts WHERE status=''active'' AND end_date<=NOW()+30days';

COMMIT;
```

---

## 6. QABUL MEZONI

Har bir nuqta bajarilishi TASDIQLANISHI kerak:

### 6.1 DDL (Egasi ruxsatidan keyin)
- [ ] `referral_bonus_config` jadval mavjud: `\d referral_bonus_config`
- [ ] `tabel_entries` jadval mavjud: `\d tabel_entries`
- [ ] `uix_tabel_entries_employee_date` unique index mavjud
- [ ] `idx_emp_contracts_end_date_status` partial index mavjud
- [ ] `org_functions` FK ishlaydi: invalid org_function_id → 23503 xato

### 6.2 Backend
- [ ] `hr-recruitment-ext.ts` — TypeScript: 0 xato; `referralBonusConfig`, `tabelEntries`, `hrRecruitmentStageEnum` export
- [ ] `hr-v2-events.ts` — `VACANCY_OPENED`, `CONTRACT_EXPIRY_WARNING`, `BUSINESS_TRIP_FINANCE_LINK`, `TABEL_ENTRY_CREATED` konstantalar mavjud
- [ ] `hr-vacancies.service.ts` — `@OnEvent(HrV2Events.OFFBOARDING_COMPLETED)` listener mavjud; `VACANCY_CREATED` emit qilinadi
- [ ] BE tsc: `pnpm --filter @europrint/api tsc --noEmit` — 0 xato
- [ ] Leave approve DB-proof: `POST /api/hr/leave` → `PATCH /api/hr/leave/:id/approve` → `SELECT * FROM tabel_entries WHERE leave_request_id=:id` → qatorlar mavjud
- [ ] Contract cron: `@Cron('0 8 * * *')` mavjud; `employment_contracts` da `end_date <= now() + 30` so'rov ishlaydi
- [ ] Offboarding → vacancy: `finalizeCase()` → `OFFBOARDING_COMPLETED` → `onOffboardingCompleted()` → `INSERT INTO vacancies`

### 6.3 Frontend
- [ ] FE tsc: `pnpm --filter erp-dashboard tsc --noEmit` — 0 xato
- [ ] `HROffboarding.tsx` — `isNotImplementedError` chaqiruvi yo'q; list + stats real ko'rsatiladi
- [ ] `HRVacationSick.tsx` — pending so'rovlar uchun `✓`/`✗` tugmalar ko'rinadi; bosib → status yangilanadi → toast ko'rinadi
- [ ] `RecruitingKanban.tsx` — Kanban ustunlarida vizyon label (Portret/Qadoqlash/...) ko'rinadi
- [ ] `HRVacationSick.tsx` — URL `/api/hr/leave` (to'g'irlangan bo'lsa) yoki `/api/hr/leave-requests` alias ishlaydi

### 6.4 Regressiya yo'q (Q-39)
- [ ] Mavjud offboarding funksiyasi ishlaydi: createCase/updateChecklistItem/recordExitInterview/finalizeCase — 200
- [ ] Mavjud recruitment funnel ishlaydi: createFunnel/moveFunnelStage — 200; WebSocket event keladi
- [ ] Leave create/approve/reject CQRS pipeline ishlaydi (presentation/hr-leave.controller.ts)
- [ ] Career-path mavjud metod ishlaydi: createPath/updateProgress — 200

### 6.5 Vizyon-moslik (Q-40 / Qoida 12)
- [ ] Referral bonus `bonus_amount` FE dan emas, `referral_bonus_config` dan o'qiladi (EP-HR-021)
- [ ] Offboarding → vacancy zanjiri ishlaydi (EP-HR-065)
- [ ] Leave approve → tabel yozuv (EP-HR-069) — real DB da tekshirildi
- [ ] Kontrakt eslatma cron bor (EP-HR-058)

---

## 7. SELF-VERIFY

### 7.1 TypeScript tekshiruvi
```bash
# Backend
pnpm --filter @europrint/api tsc --noEmit 2>&1 | tail -20

# Frontend
pnpm --filter erp-dashboard tsc --noEmit 2>&1 | tail -20

# lib/db schema build
pnpm --filter @europrint/db build 2>&1 | tail -10
```

### 7.2 Reviewer skriptlar
```bash
bash scripts/reviewer-result-pattern.sh
bash scripts/reviewer-array-safety.sh
bash scripts/reviewer-as-unknown.sh
```

### 7.3 DB-proof so'rovlar

**Referral bonus config:**
```sql
-- Jadval mavjudligi
\d referral_bonus_config

-- Test yozuv qo'shib tekshirish (DDL APPROVED bo'lgandan keyin):
INSERT INTO referral_bonus_config
  (org_function_id, bonus_type, bonus_amount, probation_days_required)
VALUES (1, 'sum', 500000, 90)
RETURNING id, org_function_id, bonus_type, bonus_amount;
-- Natija: 1 qator, bonus_amount = 500000
```

**Tabel entries (leave approve → tabel):**
```sql
-- Leave tasdiqlangandan so'ng:
SELECT te.id, te.employee_id, te.entry_date, te.entry_type, te.leave_request_id
FROM tabel_entries te
WHERE te.leave_request_id = <approved_leave_id>
ORDER BY te.entry_date;
-- Natija: start_date dan end_date gacha har kun uchun bir qator
```

**Offboarding → vacancy:**
```sql
-- Offboarding yakunlangandan so'ng:
SELECT id, title, status, org_function_id
FROM vacancies
WHERE title LIKE 'Avtomatik%'
ORDER BY id DESC LIMIT 3;
-- Natija: yangi vakansiya ko'rinadi
```

**Contract expiry cron:**
```sql
-- 30 kun ichida tugaydigan faol kontraktlar:
SELECT ec.id, ec.employee_id, ec.end_date,
       EXTRACT(day FROM (ec.end_date - CURRENT_DATE)) AS days_remaining
FROM employment_contracts ec
WHERE ec.status = 'active'
  AND ec.end_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '30 days');
```

### 7.4 FE smoke test
```bash
# RecruitingKanban.tsx smoke test (mavjud)
pnpm --filter erp-dashboard test RecruitingKanban.smoke

# HRVacationSick.tsx smoke test (mavjud)
pnpm --filter erp-dashboard test HRVacationSick.smoke
```

### 7.5 Jonli HTTP tekshiruvi (backend ishlayotgan bo'lsa)
```bash
# Bearer token olish
TOKEN=$(curl -s -X POST http://localhost:3030/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"<PASSWORD>"}' | jq -r '.accessToken')

# Leave approve tabel test
LEAVE_ID=1
curl -s -X PATCH "http://localhost:3030/api/hr/leave/${LEAVE_ID}/approve" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{}'

# Vacancy list (offboarding test)
curl -s "http://localhost:3030/api/hr/vacancies" \
  -H "Authorization: Bearer $TOKEN" | jq '.[] | select(.title | startswith("Avtomatik"))'
```

---

## 8. COMMIT

```bash
# Qadam 1: Events
git add apps/api/src/modules/hr/events/hr-v2-events.ts
git commit -m "feat(hr): add VACANCY_OPENED, CONTRACT_EXPIRY_WARNING, BUSINESS_TRIP_FINANCE_LINK, TABEL_ENTRY_CREATED events (EP-HR-065/058/024/069)"

# Qadam 2: Schema (GATED — DDL fayllar yozilgandan keyin ISHGA TUSHIRILMAYDI)
git add lib/db/src/schema/hr-recruitment-ext.ts
git add apps/api/src/shared/db/migrations/hr-referral-bonus-config-2026-06-19.sql
git add apps/api/src/shared/db/migrations/hr-leave-tabel-contract-2026-06-19.sql
git commit -m "feat(hr/schema): add referral_bonus_config + tabel_entries + hr_recruitment_stage enum [DDL GATED] (EP-HR-021/069/065)"

# Qadam 3-4: Offboarding → vacancy listener
git add apps/api/src/modules/hr/recruitment/hr-vacancies.service.ts
git add apps/api/src/modules/hr/offboarding/hr-offboarding.service.ts
git commit -m "feat(hr/offboarding): auto-create vacancy on OFFBOARDING_COMPLETED event (EP-HR-065)"

# Qadam 5: Leave approve → tabel
git add apps/api/src/modules/hr/leave/leave.service.ts
git commit -m "feat(hr/leave): approve() now writes tabel_entries per day (EP-HR-069)"

# Qadam 6-7: Recruitment funnel + career-path cron
git add apps/api/src/modules/hr/recruitment/recruitment-funnel.service.ts
git add apps/api/src/modules/hr/recruitment/recruitment.service.ts
git add apps/api/src/modules/hr/career-path/career-path.service.ts
git commit -m "feat(hr/recruitment): vision stage labels + contract 30-day expiry cron (EP-HR-058/065)"

# Qadam 8-12: FE
git add artifacts/erp-dashboard/src/pages/HROffboarding.tsx
git add artifacts/erp-dashboard/src/pages/HRVacationSick.tsx
git add artifacts/erp-dashboard/src/pages/RecruitingKanban.tsx
git add apps/api/src/modules/hr/presentation/hr-leave.controller.ts
git commit -m "feat(hr/fe): HROffboarding fix EPComingSoon bug + HRVacationSick approve/reject + RecruitingKanban vision labels (Q-40/EP-HR-069)"
```

---

## 9. HOLAT HISOBOTI (Bosqich oxirida egaga ko'rsatish)

Har bosqich yakunida Uzbek tilida:

```
BOSQICH X HOLATI:
✅ Bajarildi:
  - [aniq nima qilindi, fayl:qator]
  - [DB-proof natija]
❌ To'xtatildi / Flag:
  - [qaysi fayl owned emas, nima kerak]
⏳ Keyingi qadam:
  - [nima kerak, egadan nima kutilmoqda]
```

---

## 10. QOSHIMCHA ESLATMALAR VA EDGE CASE

### 10.1 `leave.service.ts` — tabel unique conflict

`tabelEntries` jadvali `(employee_id, entry_date)` unique indexga ega. Agar xodim bir kunda ikkita leave so'rovi bo'lsa (masalan, kasallik va ta'til) — ikkinchi approve `23505 UNIQUE violation` beradi. Bu holat:
- **Hozirgi qaror:** ikkinchi INSERT xato beradi → `approve()` tabel yozuvini log qilib o'tadi (leaveStatusni approve qilib, tabel yozuvini skip)
- **Keyinchalik:** HR biznes qoidasi: bir kunda faqat bitta tabel holat (egasi tasdiqlashi kerak)

### 10.2 Offboarding payload — `orgFunctionId`

`hr-offboarding.repository.ts` (owned emas) `findCaseById()` — employees JOIN qilmasligi mumkin. Qisqa muddatli yechim: offboarding case da `org_function_id` ustun qo'shish (DDL + repo) — bu P28 scope dan tashqari. P28 `null` holat uchun log va graceful fallback qilib qo'yadi.

### 10.3 `HrRecruitmentStage` enum — DB migration

`pgEnum('hr_recruitment_stage', [...])` yaratish uchun migration kerak. Bu `hr-referral-bonus-config-2026-06-19.sql` da ham qo'shilishi mumkin (GATED). Hozirgi `hrCandidateFunnels.funnelStage` varchar — migration da `ALTER COLUMN ... TYPE hr_recruitment_stage USING ... ::hr_recruitment_stage` kerak bo'ladi. Bu katta o'zgarish — **egasi alohida approve qilishi kerak.**

### 10.4 Vizyon 7 bosqich vs mavjud DB yozuvlar

DB da hozir `'NEW'/'QUESTIONNAIRE_SENT'/...` nomlar saqlangan. Eski yozuvlarni yangi enum ga o'tkazish uchun data migration kerak. P28 faqat label display ni to'g'irlaydi (backward-compat); DB yozuvlari o'zgartirilmaydi.

### 10.5 Business trip → Finance zanjiri

P28 faqat `BUSINESS_TRIP_FINANCE_LINK` event emit qiladi. Finance GL yozuvi yaratish Finance paketiga tegishli (modul shartnomasi — modul event orqali bog'lanadi, to'g'ridan import TAQIQ).

### 10.6 `hr-leave.controller.ts` OWNED fayl masalasi

Packet owned files ro'yxatida `apps/api/src/modules/hr/leave/hr-leave.controller.ts` bor, lekin bu fayl mavjud EMAS (`apps/api/src/modules/hr/leave/` papkasida faqat `leave.service.ts`, `i-hr-leave-svc.repo.ts`, `drizzle-hr-leave-svc.repo.ts`, accrual fayllar). Real controller = `apps/api/src/modules/hr/presentation/hr-leave.controller.ts`. P28 `presentation/hr-leave.controller.ts` ga teg — bu ham owned list da bor.

### 10.7 Referral bonus — FE dan to'g'ridan kelishi

Hozir `hr-gsd.controller.ts` (owned emas) referral yaratishda `bonus_type` va `bonus_amount` FE body dan oladi. Vizyon: shu qiymatlar `referral_bonus_config` dan o'qilishi kerak. Bu ham `hr-gsd.controller.ts` ni o'zgartirish talab qiladi (owned emas). **Flag:** egasi `hr-gsd.controller.ts` ni P28 scope ga qo'shsa to'liq amalga oshiriladi.

---

## XULOSA — P28 Scope

| Qadam | Fayl | Holat |
|-------|------|-------|
| 1 | `hr-v2-events.ts` | Tayyor qilinadi — 4 event qo'shiladi |
| 2 | `hr-recruitment-ext.ts` | Yangi fayl — enum + 2 jadval schema |
| 3 | `hr-referral-bonus-config-2026-06-19.sql` | DDL GATED — yoziladi, ishga tushirilmaydi |
| 4 | `hr-leave-tabel-contract-2026-06-19.sql` | DDL GATED — yoziladi, ishga tushirilmaydi |
| 5 | `hr-vacancies.service.ts` | `@OnEvent` listener qo'shiladi |
| 6 | `hr-offboarding.service.ts` | `orgFunctionId` payload ga qo'shiladi |
| 7 | `leave.service.ts` | `approve()` → tabel yozuv |
| 8 | `recruitment-funnel.service.ts` | Vizyon label map qo'shiladi |
| 9 | `career-path.service.ts` | Kontrakt 30-kun cron qo'shiladi |
| 10 | `HROffboarding.tsx` | `isNotImplementedError` bug tuzatiladi |
| 11 | `HRVacationSick.tsx` | Approve/reject mutation qo'shiladi |
| 12 | `RecruitingKanban.tsx` | Vizyon label overrides |
| 13 | `presentation/hr-leave.controller.ts` | URL compat tekshiruvi |

**Flaglar (egasidan ruxsat kerak):**
- `i-hr-leave-svc.repo.ts` + `drizzle-hr-leave-svc.repo.ts`: `createTabelEntries()` metod qo'shish
- `hr-offboarding.repository.ts`: `findCaseById()` employees JOIN qo'shish
- `hr-gsd.controller.ts`: referral bonus config dan o'qish
- `hrCandidateFunnels.funnelStage` enum migration: katta o'zgarish, alohida approve
