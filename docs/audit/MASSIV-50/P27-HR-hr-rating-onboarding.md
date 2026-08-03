# P27 — HR: HR 7-factor rating + dual-mentor/control-sheet/NDA onboarding DDL + BE

> **Paket:** P27 · **Modul:** HR · **To'lqin (Wave):** 1
> **Bog'liqlik:** P01 (lib barrel), P02 (api barrel) tayyor bo'lganidan keyin ishga tushiriladi.
> **DDL darvozasi:** HA — migration fayllar yoziladi, lekin ISHGA TUSHIRILMAYDI egasi ruxsatisiz.
> **Fayl yo'li:** `docs/audit/MASSIV-50/P27-HR-hr-rating-onboarding.md`
> **Vizyon manba:** `docs/audit/MUSLIMBEK-PROMT-11-HR-2026-06-08.md` §PHASE 2-3 + CHAT-TARIXI

---

## 0. ROL VA QOIDALAR

Sen **BAJARUVCHI (🟢 EXECUTOR)**. Ushbu bloK har sessiyada qayta o'qiladi.

**To'lqin (Wave):** 1 | **Bog'liqlik:** ["P01", "P02"]

```
QOIDALAR BLOKI (Q-47 — har direktivaga kiritilsin):
 1. Result<T> hamma repo/service metodida; throw/null/undefined TAQIQ.
 2. @Body Zod bilan validate; class-validator TAQIQ.
 3. Drizzle ORM; raw SQL faqat murakkab holatda (izoh + typedExecute<T>).
 4. Q-40 ishlaydi ≠ to'g'ri: REAL INSERT/UPDATE + DB-proof; echo/hardcoded/fake javob TAQIQ.
 5. Q-46 ishlab turgan kod O'CHIRILMAYDI; buzuq/o'lik/dublikat kod TO'LIQ o'chiriladi (chala emas).
 6. FAYL IZOLYATSIYASI (Qoida 23 / Q-23 / Q-31): faqat shu paketning OWNED-FILE ro'yxatidagi
    fayllarga teg. Boshqa fayl kerak bo'lsa — TO'XTA, egasiga flag qil, supurib ketma.
 7. DDL DARVOZASI (Q-35): CREATE TABLE / migration faqat egasi ruxsati bilan; migration faylida
    `-- APPROVED:` izoh shart. Paket DDL talab qilsa — migrationni YOZ lekin GATED belgila,
    ISHGA TUSHIRMA.
 8. git add <aniq-fayl> faqat; -A / . TAQIQ. Bitta commit = bitta mantiqiy guruh.
 9. Q-45/Q-30 log/secret HECH QACHON commit qilinmaydi; JWT minting yo'q.
10. Self-verify: BE tsc 0, FE tsc 0, tegishli reviewer skriptlar, jonli DB-proof
    (kirit → saqla → qayta o'qi → ko'rinadimi).
11. "V2"/"Strangler Fig"/"V1 vs V2" terminologiyasi TAQIQ — bitta kod bazasi, shu joyda to'g'irlanadi.
12. Vizyon-moslik: TO'G'RI o'lchovi = master vizyon (docs/XARITA-REJA-YONALISH + modul vizyon-hujjati);
    kod vizyonga zid bo'lsa (ishlasa ham) = xato.
```

**Muhim xabarlar (sessiya boshida bajarilsin):**
```bash
# 1. Hozirgi holat tekshiruvi
git status && git log -5 --oneline && git branch
# 2. Backend salomatligi
curl -s http://localhost:3030/api/auth/health | jq .
# 3. Parallel agent bormi?
ls /tmp/*.agent.lock 2>/dev/null || echo "boshqa agent yo'q"
# 4. TypeScript sinovdan oldin
cd Uzbek-Language-Module && npx tsc -p apps/api/tsconfig.json --noEmit 2>&1 | tail -5
```

---

## 1. IZOLYATSIYA MANIFESTI

**FAQAT quyidagi fayllarga teg. Boshqa fayl kerak bo'lsa — TO'XTA va egasiga flag qil:**

### Backend (BE) — yangi fayllar:
```
apps/api/src/shared/db/migrations/hr-rating-7factor-2026-06-19.sql    [DDL-GATED]
apps/api/src/shared/db/migrations/hr-onboarding-gaps-2026-06-19.sql   [DDL-GATED]
lib/db/src/schema/hr-rating.ts                                          [YANGI]
lib/db/src/schema/hr-onboarding-extended.ts                             [YANGI]
apps/api/src/modules/hr/rating/hr-rating.controller.ts                  [YANGI]
apps/api/src/modules/hr/rating/hr-rating.service.ts                     [YANGI]
apps/api/src/modules/hr/rating/hr-rating.repository.ts                  [YANGI]
apps/api/src/modules/hr/rating/dto/hr-rating.dto.ts                     [YANGI]
```

### Backend — mavjud fayllar (O'ZGARTIRISH):
```
apps/api/src/modules/hr/hr.module.ts                                    [TAHRIRLASH]
apps/api/src/modules/hr/hr.providers.ts                                 [TAHRIRLASH]
apps/api/src/modules/hr/onboarding/onboarding.service.ts                [TAHRIRLASH]
apps/api/src/modules/hr/onboarding/onboarding.controller.ts             [TAHRIRLASH]
apps/api/src/modules/hr/daily-report/daily-report.service.ts            [TAHRIRLASH]
```

### Frontend (FE):
```
artifacts/erp-dashboard/src/pages/EmployeeRating.tsx                    [TO'LIQ QAYTA YOZISH]
artifacts/erp-dashboard/src/pages/HROnboarding.tsx                      [TAHRIRLASH]
artifacts/erp-dashboard/src/pages/HROnboardingDialogs.tsx               [TAHRIRLASH]
```

### DDL darvozasi qoidasi:
Migration fayllarini yoz, lekin `-- GATED: egasi ruxsatisiz ishga tushirilmaydi` deb belgilab qo'y.
Faylda `-- APPROVED: <egasi-ismi> <sana>` izoh bo'lgandagina migration ishga tushiriladi.
Egasi ruxsatisiz `psql` yoki `\i migration.sql` TAQIQ.

---

## 2. VIZYON

### 2.1 Karta-markazli HR (Card-centric HR)
Vizyon manba: `docs/audit/MUSLIMBEK-PROMT-11-HR-2026-06-08.md` §PHASE 2-3

**Asosiy prinsip:** Karta (org_functions) ishni belgilaydi; xodim kartani to'ldiradi.
Barcha oylik/reyting/onboarding oqimi kartadan xodim profiliga ko'tariladi.
AI kuzatadi va signal beradi; insonlar barcha salbiy ta'sirlarni (jarima, ball pasayishi,
bloklash, razryad tushirish) tasdiqlaydi.

### 2.2 7-faktor reyting (EP-HR-012/013/014)
Vizyon manba: `docs/audit/CHAT-TARIXI-YANGI-2026-06-08.md` → HR/Oylik bo'limi

**7 faktor (vaznlar SOZLANUVCHI — admin panelda, DB `hr_rating_config` jadvalida; Q65):**
| # | Faktor | Ma'lumot manbai (TIZIMDAN OLINADI) | Izoh |
|---|--------|-------------------------------------|------|
| 1 | **Norma %** | `production_sessions` (MES) / `tabel_entries` | Bajarilgan ish vs norma; raw API-input EMAS |
| 2 | **Davomat** | `attendance_records` / AI kamera tasdiqlangani | Yo'qlama foizi; raw API-input EMAS |
| 3 | **Sifat/brak** | `qc_results` / `qc_reclamations` (QC moduli) | EP-HR-057: insoniy tasdiq shart; QC'dan pull |
| 4 | **Staj** | `employees.hire_date` → avtohisob | Ishga kirish sanasidan avtomatik hisob |
| 5 | **Intizom** | `hr_discipline_logs` (intizom jurnali) | EP-HR-054/055; HR kiritgan yozuvlar |
| 6 | **O'zaro baho** | `hr_peer_reviews` (xizmat zanjiri bo'yicha) | FAQAT kim kimga xizmat qilsa — umumiy peer emas |
| 7 | **AI kunlik KPI** | `employee_daily_kpi` / ЦКП bajarilish → `daily_reports` | ЦКП natijalari + LMS progress + AI tahlili; raw API-input EMAS |

> ⚠️ **MUHIM — Score manba qoidasi (VISION-1000 Q65 / OCHIQ EP-HR-012/013):**
> Har bir faktor bali **TIZIM JADVALLARIDAN avto-olinadi** (pull pattern).
> Bajaruvchi `CreateRatingDto` da `normaPercent/davomatScore/.../aiKpiScore` maydonlarini
> **ixtiyoriy (optional)** qoldiradi — ular faqat qo'lda to'ldirish uchun fallback.
> Asosiy yo'l: `HrRatingService.computeFromSources(employeeId, year, month)` metodi
> MES/QC/Tabel/HR-jurnal/LMS jadvallaridan fakt ma'lumotlarini tortib, ballni hisoblaydi.
> API-input orqali to'g'ridan raw ball qabul qilish FAQAT tizim manbasi mavjud bo'lmagan
> holatda (masalan: yangi xodim, MES ulanmagan) fallback sifatida ruxsat etiladi.

**Chegara (SOZLANUVCHI, EP-HR-012 egasi qarori):**
- A = 85+ ball (yashil)
- B = 70–84 ball (sariq)
- C < 70 ball (qizil)

**Bonus oqimi (EP-HR-014 egasi qarori):**
Tizim → bonus % taklif → HR/menejer TASDIQLAYDI → Payroll qabul qiladi
(avtomatik emas; inson tasdiqsiz payroll'ga hech narsa o'tkazilmaydi)

**Kassir navbat (CHAT-TARIXI):**
7-faktor reyting → oylik/avans TO'LOV TARTIBINI (kassir navbatini) belgilaydi.
Yuqori reyting = navbatda birinchi.

### 2.2a Oylik tasdiq-zanjiri (CHAT-TARIXI aniq — MISSING, shu paketda qo'shiladi)

Manba: `docs/audit/CHAT-TARIXI-YANGI-2026-06-08.md` → HR/Oylik bo'limi:
> "oyiga 1 marta; tasdiq **AI→HR→moliya→direktor→kassir(PIN)**"

OCHIQ-JAVOBLAR KAS-2: "Oylik/avans tarqatish kassir orqali; har operatsiya PIN bilan tasdiq."

**Tasdiq bosqichlari (hr_payroll_approval_log jadvali):**

| # | Bosqich | Ruxsatchi | Amal | Holat |
|---|---------|-----------|------|-------|
| 1 | **AI tekshiruv** | Tizim (`system`) | Reyting/tabel/brak avto-tekshir; anomaliya bo'lsa flag | `ai_checked` |
| 2 | **HR tasdiq** | `hr_manager` roli | Oylik to'g'riligini ko'radi, imzolaydi | `hr_approved` |
| 3 | **Moliya tasdiq** | `finance_manager` roli | GL yozuv va byudjet nazorati | `finance_approved` |
| 4 | **Direktor tasdiq** | `director` roli | Yakuniy ruxsat | `director_approved` |
| 5 | **Kassir PIN** | `cashier` roli | Har operatsiya PIN bilan tasdiq (KAS-2) | `cashier_pin_confirmed` |

**DDL (GATED — `hr-rating-7factor-2026-06-19.sql` migratsiyasiga qo'shiladi):**
```sql
-- GATED: egasi ruxsatisiz ishga tushirilmaydi
-- APPROVED: <egasi-ismi> <sana>
-- P27: Oylik tasdiq-zanjiri jadvali (CHAT-TARIXI AI→HR→moliya→direktor→kassir-PIN)

CREATE TABLE IF NOT EXISTS hr_payroll_approval_log (
  id               SERIAL PRIMARY KEY,
  payroll_period_id INTEGER NOT NULL,          -- payroll_periods(id) — FIN paketida boshqariladi
  employee_id      INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  stage            VARCHAR(30) NOT NULL
                   CHECK (stage IN (
                     'ai_checked','hr_approved','finance_approved',
                     'director_approved','cashier_pin_confirmed'
                   )),
  status           VARCHAR(20) NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','approved','rejected')),
  approved_by      INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  approved_at      TIMESTAMPTZ,
  rejection_reason TEXT,
  pin_hash         VARCHAR(64),               -- kassir bosqichi uchun PIN hash (SHA-256); plain PIN saqlanmaydi
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hr_payroll_approval_emp_period
  ON hr_payroll_approval_log(employee_id, payroll_period_id);
CREATE INDEX IF NOT EXISTS idx_hr_payroll_approval_stage_status
  ON hr_payroll_approval_log(stage, status);

COMMENT ON TABLE hr_payroll_approval_log IS
  'CHAT-TARIXI: Oylik tasdiq-zanjiri — AI→HR→moliya→direktor→kassir(PIN). '
  'KAS-2: har operatsiya PIN bilan. Stage ketma-ketligi majburiy (prev stage approved bo''lmasa keyingisi ochilmaydi).';
```

**Drizzle schema** (`lib/db/src/schema/hr-rating.ts` ga qo'shiladi):
```typescript
// hr_payroll_approval_log — CHAT-TARIXI: AI→HR→moliya→direktor→kassir-PIN (KAS-2)
export const hrPayrollApprovalLog = pgTable('hr_payroll_approval_log', {
  id:             serial('id').primaryKey(),
  payrollPeriodId: integer('payroll_period_id').notNull(),
  employeeId:     integer('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
  stage:          varchar('stage', { length: 30 }).notNull(),
  status:         varchar('status', { length: 20 }).notNull().default('pending'),
  approvedBy:     integer('approved_by').references(() => employees.id, { onDelete: 'set null' }),
  approvedAt:     timestamp('approved_at'),
  rejectionReason: text('rejection_reason'),
  pinHash:        varchar('pin_hash', { length: 64 }),   // Q-30: plain PIN HECH QACHON saqlanmaydi
  notes:          text('notes'),
  createdAt:      timestamp('created_at').notNull().defaultNow(),
  updatedAt:      timestamp('updated_at').notNull().defaultNow(),
}, (t) => [
  index('idx_hr_payroll_approval_emp_period').on(t.employeeId, t.payrollPeriodId),
  index('idx_hr_payroll_approval_stage_status').on(t.stage, t.status),
  check('hr_payroll_approval_stage_chk',
    sql`${t.stage} IN ('ai_checked','hr_approved','finance_approved','director_approved','cashier_pin_confirmed')`),
  check('hr_payroll_approval_status_chk',
    sql`${t.status} IN ('pending','approved','rejected')`),
]);
export type HrPayrollApprovalLog = typeof hrPayrollApprovalLog.$inferSelect;
```

**Muhim arxitektura eslatmalari:**
- Bosqichlar KETMA-KET: `ai_checked` tasdiqlanmasa `hr_approved` ochilmaydi (service darajasida nazorat).
- PIN hash: kassir PIN ni bcrypt yoki SHA-256 bilan hash qilib `pin_hash` da saqlanadi; plain PIN `notes`/log ga HECH QACHON yozilmaydi (Q-30/Q-45).
- `payroll_period_id` → `payroll_periods` jadvali FIN paketida boshqariladi (P24); shu FK shart — lekin P27 scope dan tashqari jadval.
- AI bosqichi avtomatik (`approved_by = NULL`, tizim yozadi); inson bosqichlari `approved_by = ruxsatchi.id`.
- **EGASI QIYMATI KERAK:** Kassir PIN uzunligi/formati (4 raqam vs 6 raqam) — owner belgilaydi.

**Qabul mezoni:**
- `hr_payroll_approval_log` jadval mavjud: `\d hr_payroll_approval_log`
- Bosqich ketma-ketligi tekshiruvi: `ai_checked` → `hr_approved` → `finance_approved` → `director_approved` → `cashier_pin_confirmed`
- Kassir bosqichida PIN hash saqlanadi, plain PIN log/response ga CHIQMAYDI (Q-30)
- `payroll_period_id` FK ishlaydi (payroll_periods yaratilganda)

**Qabul mezoni:**
- `hr_rating_factors` jadvalga REAL INSERT → SELECT bilan tasdiqlash
- `hr_rating_config` da A=85/B=70 saklanadi, admin o'zgartira oladi
- `hr_bonus_suggestions` ga taklif yoziladi, status 'pending'
- BE tsc 0, FE tsc 0
- EmployeeRating.tsx — faqat GET emas, useMutation bor (Qoida 19)

### 2.3 Ikki-mentor onboarding (EP-HR-018/019)
**Vizyon:** Har xodimga 2 ta mentor tayinlanadi:
- **Adaptatsiya mentori** — umumiy integratsiya, madaniyat, normalar
- **Professional usta** — kasb bo'yicha amaliy vazifalar

Hozirgi `hr_mentorship_pairings` jadvalida faqat bitta `mentor_id` bor → vizyon buzilishi.
**Yechim:** yangi `hr_mentor_assignments` jadvali — `adaptation_mentor_id` + `professional_mentor_id`.

**Qabul mezoni:**
- `hr_mentor_assignments` ga xodim uchun 2 mentor yoziladi
- ikkala mentor FK `employees.id` ga ishora qiladi
- onboarding.service.ts → mentor tayinlash metodi 2 mentor qabul qiladi

### 2.4 Nazorat varaqasi / Control sheet (EP-HR-043/044/045/046)
**Vizyon:** Har instruksiya to'plami (karta bo'yicha) uchun elektron chek-list:
- Xodim o'qidim → tasdiqlaydi + sana
- Mentor tekshiradi + mini-test
- Boshlash + tugash sanasi; kech qolsa → menejer/HR ga ogohlantirish (cron)

**Jadvallar kerak:**
- `hr_control_sheet_templates` — karta bo'yicha shablon (JSONB item ro'yxati)
- `hr_control_sheet_records` — xodim-template juftlik, mentor tasdiqi, mini-test bali

**Qabul mezoni:**
- Template yaratiladi (card_id bo'yicha)
- Xodim assigned bo'lganda record avtomatik ochiladi
- mentor_confirmed, mini_test_score yoziladi → qayta o'qiladi → saqlanadi

### 2.5 NDA (EP-HR-041)
**Vizyon:** Onboarding da NDA imzolash + har yili + o'zgarishda qayta imzolash.
Hozirda `offboarding_cases.nda_signed` boolean mavjud — bu faqat offboarding uchun.
Onboarding NDA alohida zanjir talab qiladi.

**Jadval kerak:** `hr_nda_records` — employee_id, nda_version, signed_at, signature_hash,
signed_by (xodim), witnessed_by (HR), document_url, type (onboarding/annual/change).

**Qabul mezoni:**
- POST `/api/hr/onboarding/nda` → `hr_nda_records` ga REAL INSERT
- Annual cron mavjud (har yil employees bilan yuboriladi)
- BE tsc 0

### 2.6 Kunlik hisobot deadline to'g'irlash (EP-HR-006)
**Vizyon (CHAT-TARIXI aniq):** 16:00 gacha topshirilmasa → o'sha kun hisoblanmaydi.
**Hozirgi holat:**
- `daily-report.service.ts:179` — `@Cron('0 17 * * 1-6')` → 17:00 eslatma (emas 16:00)
- `daily-report.service.ts:205` — `@Cron('0 20 * * 1-6')` → 20:00 da "yo'q" deb belgilash

**Kerakli holat:**
- `@Cron('0 16 * * 1-6')` → 16:00 da deadline: topshirilmaganlar "missed" deb belgilanadi
- `@Cron('0 15 * * 1-6')` → 15:00 da eslatma (deadline dan 1 soat oldin)
- 20:00 cron olib tashlanadi yoki logga yoziladi (salbiy ta'sir allaqachon 16:00 da qo'llanildi)

**Qabul mezoni:**
- Cron '0 16 * * 1-6' → markAbsentForDate() chaqiriladi
- Cron '0 15 * * 1-6' → eslatma yuboriladi (avval 17:00 edi)
- BE tsc 0

### 2.7 Bonus taklif jadvali + referral-bonus config (EP-HR-014/021)
**Vizyon:** Tizim → bonus % taklif (hr_bonus_suggestions) → HR tasdiqlaydi.
Referral bonus = lavozim bo'yicha sozlanuvchi (referral_bonus_config jadvali).

### 2.8 employee_ratings CHECK to'g'irlash
**Hozirgi holat:** `lib/db/src/schema/kpi.ts:72` — `overallRating` CHECK 0–5 (noto'g'ri shkala).
**Kerakli holat:** 0–100 (vizyon A=85+/B=70–84/C<70 foiz shkalasi).
Migration bilan `ALTER TABLE employee_ratings DROP CONSTRAINT ... ADD CONSTRAINT ...` kerak.

---

## 3. HOZIRGI HOLAT

### 3.1 MAVJUD (EXISTS)

| Fayl | Qator | Holat |
|------|-------|-------|
| `lib/db/src/schema/kpi.ts:55` | 73 | `employee_ratings` — 4 ta umumiy faktor, CHECK 0–5 (NOTO'G'RI shkala) |
| `lib/db/src/schema/kpi.ts:12` | 30 | `employee_daily_kpi` — 7 ustun, lekin vizyon 7-faktordan farqli semantika |
| `apps/api/src/modules/hr/daily-report/daily-report.service.ts:179` | — | `@Cron('0 17 * * 1-6')` eslatma — vizyon 15:00 talab qiladi |
| `apps/api/src/modules/hr/daily-report/daily-report.service.ts:205` | — | `@Cron('0 20 * * 1-6')` yo'q belgisi — vizyon 16:00 talab qiladi |
| `lib/db/src/schema/hr-v2-schema.ts:383` | — | `offboarding_cases.nda_signed` boolean — onboarding NDA EMAS |
| `lib/db/src/schema/hr-architecture-additions.ts:58` | — | Bitta `mentor_id` — ikki-mentor yo'q |
| `lib/db/src/schema/adaptation.ts:29` | — | Bitta `mentor_id` — ikki-mentor yo'q |
| `artifacts/erp-dashboard/src/pages/EmployeeRating.tsx:1` | — | `@deprecated` — faqat useQuery, useMutation YO'Q |
| `artifacts/erp-dashboard/src/pages/EmployeeRating.tsx:64` | — | `queryKey: ["/api/integration/employee-rating/ratings"]` — noto'g'ri endpoint |
| `apps/api/src/modules/hr/onboarding/onboarding.service.ts:37` | — | REAL `createPlan/listPlans/startEmployeeOnboarding` mavjud |
| `apps/api/src/modules/hr/onboarding/onboarding.controller.ts:50` | — | `@Controller('hr/onboarding')` mavjud, ISOlyatsiya saqlangan |
| `apps/api/src/modules/hr/hr.module.ts:50` | — | `HrModule` app.module.ts:134 da ro'yxatdan o'tgan |
| `apps/api/src/modules/hr/hr.providers.ts:218` | — | `HR_ONBOARDING_REPO` bilan `DrizzleHrOnboardingRepository` bog'langan |

### 3.2 YO'Q (MISSING)

| ID | Gap |
|----|-----|
| EP-HR-012 | `hr_rating_config` — sozlanuvchi chegara va vazn jadvali yo'q |
| EP-HR-013 | `hr_rating_factors` — 7-faktor reyting jadvali yo'q (faqat 4-faktorli generic mavjud) |
| EP-HR-014 | `hr_bonus_suggestions` — taklif oqimi jadvali yo'q |
| EP-HR-018 | `hr_mentor_assignments` — ikki-mentor jadvali yo'q (adaptation + professional) |
| EP-HR-021 | `referral_bonus_config` — lavozim bo'yicha referral bonus konfiguratsiyasi yo'q |
| EP-HR-041 | `hr_nda_records` — NDA imzolash jadvali yo'q |
| EP-HR-043 | `hr_control_sheet_templates` — instruksiya to'plami shabloni yo'q |
| EP-HR-044 | `hr_control_sheet_records` — xodim nazorat varaqasi yo'q |
| Cron fix | 16:00 deadline cron yo'q; 20:00 deadline cron vizyon bilan zid |
| Rating rating/ | `apps/api/src/modules/hr/rating/` papkasi umuman yo'q |
| Schema files | `lib/db/src/schema/hr-rating.ts` yo'q |
| Schema files | `lib/db/src/schema/hr-onboarding-extended.ts` yo'q |
| **YANGI (moslik-audit):** Oylik tasdiq-zanjiri | `hr_payroll_approval_log` jadvali yo'q (CHAT-TARIXI: AI→HR→moliya→direktor→kassir-PIN) |
| **YANGI (moslik-audit):** Bonus % config | `hr_bonus_pct_config` jadvali yo'q — bonus foizi hardcode emas, DB master-data bo'lishi kerak (EGASI QIYMATI KERAK) |
| **YANGI (moslik-audit):** Score manba | `HrRatingService.computeFromSources()` metodi yo'q — faktor ballari tizim jadvallaridan (MES/QC/Tabel/LMS) pull qilinishi kerak; raw API-input faqat fallback |

### 3.3 BUZUQ / SOXTA (BROKEN / FAKE)

| Fayl:qator | Muammo |
|------------|--------|
| `artifacts/erp-dashboard/src/pages/EmployeeRating.tsx:1` | `@deprecated` — read-only stub, useMutation yo'q (Qoida 19 buzilishi) |
| `artifacts/erp-dashboard/src/pages/EmployeeRating.tsx:64-66` | noto'g'ri endpoint `/api/integration/employee-rating/ratings` — 7-faktor emas, 4-faktor schema |
| `lib/db/src/schema/kpi.ts:72` | `overallRating` CHECK 0–5 — vizyon 0–100 foiz shkalasi talab qiladi |
| `apps/api/src/modules/hr/daily-report/daily-report.service.ts:179` | `@Cron('0 17 * * 1-6')` — vizyon 15:00 eslatma; 17:00 to'g'ri emas |
| `apps/api/src/modules/hr/daily-report/daily-report.service.ts:205` | `@Cron('0 20 * * 1-6')` — vizyon 16:00 deadline; 20:00 to'g'ri emas |
| `lib/db/src/schema/adaptation.ts:29` | Bitta `mentor_id` — vizyon 2 mentor talab qiladi (EP-HR-018) |

---

## 4. ISH (qadam-baqadam)

> Har qadam: (a) fayl:qator ko'rsatilgan o'zgarish, (b) oldin/keyin misol, (c) DB-proof.
> Har bosqich tugagach: `git add <aniq-fayl> && git commit -m "P27: ..."`.

---

### QADAM 1 — `hr-rating-7factor-2026-06-19.sql` migration yoz (DDL-GATED)

**Fayl:** `apps/api/src/shared/db/migrations/hr-rating-7factor-2026-06-19.sql`

Migration quyidagilarni o'z ichiga olsin (FAQAT `CREATE TABLE IF NOT EXISTS` — DROP yo'q):

```sql
-- GATED: egasi ruxsatisiz ishga tushirilmaydi
-- APPROVED: <egasi-ismi> <sana> — bu qator egasi to'ldirib, ruxsat beradi
-- P27: HR 7-factor rating DDL
-- Depends on: employees (id), org_functions (id)

-- 1. hr_rating_config — sozlanuvchi chegara va vazn jadvali (EP-HR-012)
CREATE TABLE IF NOT EXISTS hr_rating_config (
  id            SERIAL PRIMARY KEY,
  threshold_a   NUMERIC(5,2) NOT NULL DEFAULT 85.00,   -- A=85+ (foiz)
  threshold_b   NUMERIC(5,2) NOT NULL DEFAULT 70.00,   -- B=70-84 (foiz)
  w_norma       NUMERIC(5,4) NOT NULL DEFAULT 0.2000,  -- Norma %
  w_davomat     NUMERIC(5,4) NOT NULL DEFAULT 0.2000,  -- Davomat
  w_sifat       NUMERIC(5,4) NOT NULL DEFAULT 0.2000,  -- Sifat/brak
  w_staj        NUMERIC(5,4) NOT NULL DEFAULT 0.1000,  -- Staj
  w_intizom     NUMERIC(5,4) NOT NULL DEFAULT 0.1000,  -- Intizom
  w_ozaro       NUMERIC(5,4) NOT NULL DEFAULT 0.1000,  -- O'zaro baho
  w_ai_kpi      NUMERIC(5,4) NOT NULL DEFAULT 0.1000,  -- AI kunlik KPI
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  updated_by    INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT hr_rating_config_weights_sum_chk CHECK (
    ABS((w_norma + w_davomat + w_sifat + w_staj + w_intizom + w_ozaro + w_ai_kpi) - 1.0) < 0.001
  ),
  CONSTRAINT hr_rating_config_threshold_order_chk CHECK (threshold_a > threshold_b AND threshold_b > 0)
);

-- Standart konfiguratsiya (idempotent seed)
INSERT INTO hr_rating_config (threshold_a, threshold_b,
  w_norma, w_davomat, w_sifat, w_staj, w_intizom, w_ozaro, w_ai_kpi)
SELECT 85.00, 70.00, 0.2, 0.2, 0.2, 0.1, 0.1, 0.1, 0.1
WHERE NOT EXISTS (SELECT 1 FROM hr_rating_config WHERE is_active = TRUE);

-- 2. hr_rating_factors — 7-faktor reyting yozuvi (EP-HR-013)
CREATE TABLE IF NOT EXISTS hr_rating_factors (
  id                  SERIAL PRIMARY KEY,
  employee_id         INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  period_year         SMALLINT NOT NULL,
  period_month        SMALLINT NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  norma_percent       NUMERIC(5,2) CHECK (norma_percent BETWEEN 0 AND 150),    -- >100 = ortiqcha ish
  davomat_score       NUMERIC(5,2) CHECK (davomat_score BETWEEN 0 AND 100),
  sifat_score         NUMERIC(5,2) CHECK (sifat_score BETWEEN 0 AND 100),
  staj_score          NUMERIC(5,2) CHECK (staj_score BETWEEN 0 AND 100),
  intizom_score       NUMERIC(5,2) CHECK (intizom_score BETWEEN 0 AND 100),
  ozaro_baho_score    NUMERIC(5,2) CHECK (ozaro_baho_score BETWEEN 0 AND 100),
  ai_kpi_score        NUMERIC(5,2) CHECK (ai_kpi_score BETWEEN 0 AND 100),
  total_score         NUMERIC(5,2) CHECK (total_score BETWEEN 0 AND 100),
  rating_class        VARCHAR(1) CHECK (rating_class IN ('A','B','C')),
  config_id           INTEGER REFERENCES hr_rating_config(id) ON DELETE SET NULL,
  calculated_by       VARCHAR(20) NOT NULL DEFAULT 'system',  -- 'system' | 'manual'
  calculated_at       TIMESTAMPTZ,
  confirmed_by        INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  confirmed_at        TIMESTAMPTZ,
  status              VARCHAR(20) NOT NULL DEFAULT 'draft'
                      CHECK (status IN ('draft','confirmed','archived')),
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (employee_id, period_year, period_month)
);

CREATE INDEX IF NOT EXISTS idx_hr_rating_factors_emp_period
  ON hr_rating_factors(employee_id, period_year, period_month);
CREATE INDEX IF NOT EXISTS idx_hr_rating_factors_class
  ON hr_rating_factors(rating_class, period_year, period_month);

-- 3. hr_bonus_suggestions — bonus taklif oqimi (EP-HR-014)
CREATE TABLE IF NOT EXISTS hr_bonus_suggestions (
  id                  SERIAL PRIMARY KEY,
  employee_id         INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  period_year         SMALLINT NOT NULL,
  period_month        SMALLINT NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  rating_id           INTEGER REFERENCES hr_rating_factors(id) ON DELETE SET NULL,
  suggested_bonus_pct NUMERIC(5,2) NOT NULL CHECK (suggested_bonus_pct >= 0 AND suggested_bonus_pct <= 200),
  suggested_by        VARCHAR(20) NOT NULL DEFAULT 'system',  -- 'system' | 'ai' | 'manager'
  status              VARCHAR(20) NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','confirmed','rejected')),
  confirmed_by        INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  confirmed_at        TIMESTAMPTZ,
  payroll_period_id   INTEGER,           -- FK payroll_periods(id) — P24 FIN tomonidan boshqariladi
  rejection_reason    TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. referral_bonus_config — lavozim bo'yicha referral bonus (EP-HR-021)
CREATE TABLE IF NOT EXISTS referral_bonus_config (
  id                  SERIAL PRIMARY KEY,
  org_function_id     INTEGER NOT NULL REFERENCES org_functions(id) ON DELETE CASCADE,
  bonus_type          VARCHAR(20) NOT NULL CHECK (bonus_type IN ('sum','leave')),
  bonus_amount        NUMERIC(12,2) NOT NULL DEFAULT 0,  -- sum bo'lsa UZS, leave bo'lsa kunlar
  probation_days_req  INTEGER NOT NULL DEFAULT 90,        -- probation o'tgandan keyin to'lanadi
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (org_function_id)
);

-- 5. employee_ratings shkala tuzatish (0-5 → 0-100)
-- EHTIYOT: avvalgi ma'lumotlar bor bo'lsa 20 ga ko'paytirish kerak (5*20=100)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'employee_ratings_overall_chk'
  ) THEN
    ALTER TABLE employee_ratings DROP CONSTRAINT employee_ratings_overall_chk;
  END IF;
END $$;
ALTER TABLE employee_ratings
  ADD CONSTRAINT employee_ratings_overall_chk
  CHECK (overall_rating IS NULL OR (overall_rating >= 0 AND overall_rating <= 100));

-- 6. hr_bonus_pct_config — toifa bo'yicha sozlanuvchi bonus foizi (OCHIQ EP-HR-014)
-- ⚠️ EGASI QIYMATI KERAK: qatorlarni egasi admin panelda to'ldiradi (A/B/C foizlari)
-- Hardcode TAQIQLANGAN: OCHIQ-JAVOBLAR EP-HR-014 = "foiz TAKLIF, HR tasdiqlaydi"
CREATE TABLE IF NOT EXISTS hr_bonus_pct_config (
  id             SERIAL PRIMARY KEY,
  rating_class   VARCHAR(1) NOT NULL CHECK (rating_class IN ('A','B','C')),
  suggested_pct  NUMERIC(5,2) NOT NULL CHECK (suggested_pct >= 0 AND suggested_pct <= 200),
  description    TEXT,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  updated_by     INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (rating_class)
);
-- Seed: EGASI QIYMATI KERAK — quyidagi placeholder qatorlar ISHGA TUSHIRILMAYDI
-- egasi admin paneldan o'zi to'ldiradi (foizlar o'ylab topilmagan)
-- INSERT INTO hr_bonus_pct_config (rating_class, suggested_pct, description)
-- VALUES ('A', <EGASI_KIRITADI>, 'A toifa bonus foizi (egasi belgilaydi)'),
--        ('B', <EGASI_KIRITADI>, 'B toifa bonus foizi (egasi belgilaydi)'),
--        ('C', 0, 'C toifa bonus yo''q');

-- 7. hr_payroll_approval_log — Oylik tasdiq-zanjiri (CHAT-TARIXI: AI→HR→moliya→direktor→kassir-PIN)
CREATE TABLE IF NOT EXISTS hr_payroll_approval_log (
  id               SERIAL PRIMARY KEY,
  payroll_period_id INTEGER NOT NULL,
  employee_id      INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  stage            VARCHAR(30) NOT NULL
                   CHECK (stage IN (
                     'ai_checked','hr_approved','finance_approved',
                     'director_approved','cashier_pin_confirmed'
                   )),
  status           VARCHAR(20) NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','approved','rejected')),
  approved_by      INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  approved_at      TIMESTAMPTZ,
  rejection_reason TEXT,
  pin_hash         VARCHAR(64),  -- KAS-2: kassir PIN SHA-256 hash; plain PIN saqlanmaydi (Q-30)
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_hr_payroll_approval_emp_period
  ON hr_payroll_approval_log(employee_id, payroll_period_id);
CREATE INDEX IF NOT EXISTS idx_hr_payroll_approval_stage_status
  ON hr_payroll_approval_log(stage, status);

COMMENT ON TABLE hr_rating_config IS 'EP-HR-012: sozlanuvchi 7-faktor reyting vaznlari va chegara ballari';
COMMENT ON TABLE hr_rating_factors IS 'EP-HR-013: xodim 7-faktor oylik reyting yozuvlari';
COMMENT ON TABLE hr_bonus_suggestions IS 'EP-HR-014: tizim bonus taklifi → HR tasdiqlash oqimi';
COMMENT ON TABLE referral_bonus_config IS 'EP-HR-021: lavozim bo''yicha sozlanuvchi referral bonus';
COMMENT ON TABLE hr_bonus_pct_config IS 'OCHIQ EP-HR-014: toifa A/B/C uchun sozlanuvchi bonus foizi — EGASI QIYMATI KERAK';
COMMENT ON TABLE hr_payroll_approval_log IS 'CHAT-TARIXI: oylik tasdiq-zanjiri AI→HR→moliya→direktor→kassir(PIN); KAS-2 per-operatsiya PIN';
```

**TEKSHIRUV (egasi ruxsatidan keyin):**
```sql
\d hr_rating_config
\d hr_rating_factors
SELECT constraint_name FROM information_schema.table_constraints
  WHERE table_name = 'employee_ratings' AND constraint_name LIKE '%overall%';
```

---

### QADAM 2 — `hr-onboarding-gaps-2026-06-19.sql` migration yoz (DDL-GATED)

**Fayl:** `apps/api/src/shared/db/migrations/hr-onboarding-gaps-2026-06-19.sql`

```sql
-- GATED: egasi ruxsatisiz ishga tushirilmaydi
-- APPROVED: <egasi-ismi> <sana>
-- P27: HR onboarding gaps DDL (mentor, control-sheet, NDA)
-- Depends on: employees (id), org_functions (id)

-- 1. hr_mentor_assignments — ikki-mentor tayinlash (EP-HR-018)
-- Eslatma: adaptation.ts va hr-architecture-additions.ts da bitta mentor_id bor —
-- bu yangi jadval ikkala mentor uchun alohida yozuv saqlaydi; eski jadvallar O'ZGARTIRILMAYDI
-- (Q-46: ishlab turgan kod saqlanadi)
CREATE TABLE IF NOT EXISTS hr_mentor_assignments (
  id                      SERIAL PRIMARY KEY,
  employee_id             INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  adaptation_mentor_id    INTEGER REFERENCES employees(id) ON DELETE SET NULL,   -- madaniyat/norma
  professional_mentor_id  INTEGER REFERENCES employees(id) ON DELETE SET NULL,   -- kasb bo'yicha
  assigned_by             INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  assigned_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status                  VARCHAR(20) NOT NULL DEFAULT 'active'
                          CHECK (status IN ('active','completed','cancelled')),
  adaptation_notes        TEXT,
  professional_notes      TEXT,
  completed_at            TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (employee_id)    -- bir xodim uchun bitta aktiv tayinlash
);

CREATE INDEX IF NOT EXISTS idx_hr_mentor_assignments_emp
  ON hr_mentor_assignments(employee_id);
CREATE INDEX IF NOT EXISTS idx_hr_mentor_assignments_adapt_mentor
  ON hr_mentor_assignments(adaptation_mentor_id);
CREATE INDEX IF NOT EXISTS idx_hr_mentor_assignments_prof_mentor
  ON hr_mentor_assignments(professional_mentor_id);

-- 2. hr_control_sheet_templates — instruksiya to'plami shabloni (EP-HR-043)
CREATE TABLE IF NOT EXISTS hr_control_sheet_templates (
  id              SERIAL PRIMARY KEY,
  card_id         INTEGER NOT NULL REFERENCES org_functions(id) ON DELETE CASCADE,
  title           VARCHAR(300) NOT NULL,
  instruction_band VARCHAR(100),                -- instruksiya to'plami nomi
  version         SMALLINT NOT NULL DEFAULT 1,
  items           JSONB NOT NULL DEFAULT '[]',  -- [{label: str, requires_test: bool, order: int}]
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_by      INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hr_ctrl_sheet_tpl_card
  ON hr_control_sheet_templates(card_id, is_active);

-- 3. hr_control_sheet_records — xodim nazorat varaqasi (EP-HR-044/045/046)
CREATE TABLE IF NOT EXISTS hr_control_sheet_records (
  id                  SERIAL PRIMARY KEY,
  employee_id         INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  template_id         INTEGER NOT NULL REFERENCES hr_control_sheet_templates(id) ON DELETE CASCADE,
  started_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  due_date            DATE,
  completed_at        TIMESTAMPTZ,
  status              VARCHAR(20) NOT NULL DEFAULT 'in_progress'
                      CHECK (status IN ('in_progress','completed','overdue','cancelled')),
  items_progress      JSONB NOT NULL DEFAULT '[]',
                      -- [{item_idx: int, read_confirmed: bool, confirmed_at: str, notes: str}]
  mentor_confirmed    BOOLEAN DEFAULT FALSE,
  mentor_confirmed_at TIMESTAMPTZ,
  mentor_confirmed_by INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  mini_test_score     NUMERIC(5,2) CHECK (mini_test_score BETWEEN 0 AND 100),
  mini_test_taken_at  TIMESTAMPTZ,
  case_study_comment  TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (employee_id, template_id)
);

CREATE INDEX IF NOT EXISTS idx_hr_ctrl_sheet_rec_emp
  ON hr_control_sheet_records(employee_id, status);
CREATE INDEX IF NOT EXISTS idx_hr_ctrl_sheet_rec_due
  ON hr_control_sheet_records(due_date) WHERE status = 'in_progress';

-- 4. hr_nda_records — NDA imzolash jadvali (EP-HR-041)
CREATE TABLE IF NOT EXISTS hr_nda_records (
  id              SERIAL PRIMARY KEY,
  employee_id     INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  nda_version     VARCHAR(20) NOT NULL DEFAULT '1.0',
  type            VARCHAR(20) NOT NULL DEFAULT 'onboarding'
                  CHECK (type IN ('onboarding','annual','change')),
  signed_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  signature_hash  VARCHAR(64),         -- SHA-256 hash of signature data
  signed_by       INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  witnessed_by    INTEGER REFERENCES employees(id) ON DELETE SET NULL,  -- HR vakili
  document_url    TEXT,                -- storage URL
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hr_nda_records_emp
  ON hr_nda_records(employee_id, type, signed_at DESC);

COMMENT ON TABLE hr_mentor_assignments IS 'EP-HR-018: ikki-mentor tayinlash (adaptatsiya + professional)';
COMMENT ON TABLE hr_control_sheet_templates IS 'EP-HR-043: karta bo''yicha instruksiya to''plami shabloni';
COMMENT ON TABLE hr_control_sheet_records IS 'EP-HR-044/045/046: xodim nazorat varaqasi yozuvi';
COMMENT ON TABLE hr_nda_records IS 'EP-HR-041: NDA imzolash (onboarding/annual/change)';
```

---

### QADAM 3 — `lib/db/src/schema/hr-rating.ts` yaratish

**Fayl:** `lib/db/src/schema/hr-rating.ts` (yangi fayl)

```typescript
/**
 * @module hr-rating
 * @description Drizzle ORM schema: 7-factor rating tables.
 * EP-HR-012 (config), EP-HR-013 (factors), EP-HR-014 (bonus suggestions),
 * EP-HR-021 (referral bonus config).
 * DDL: apps/api/src/shared/db/migrations/hr-rating-7factor-2026-06-19.sql
 */

import {
  pgTable, serial, integer, smallint, numeric, varchar,
  boolean, text, timestamp, unique, check, index,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { employees } from './employees';
// org_functions import — P01/P02 barrel dan keladi
// Bu import path P01 barrel tayyor bo'lgandan keyin sozlanadi.
// Hozircha lazy import bilan yoki string reference ishlatiladi.

export const hrRatingConfig = pgTable('hr_rating_config', {
  id:          serial('id').primaryKey(),
  thresholdA:  numeric('threshold_a', { precision: 5, scale: 2 }).notNull().default('85.00'),
  thresholdB:  numeric('threshold_b', { precision: 5, scale: 2 }).notNull().default('70.00'),
  wNorma:      numeric('w_norma',   { precision: 5, scale: 4 }).notNull().default('0.2000'),
  wDavomat:    numeric('w_davomat', { precision: 5, scale: 4 }).notNull().default('0.2000'),
  wSifat:      numeric('w_sifat',   { precision: 5, scale: 4 }).notNull().default('0.2000'),
  wStaj:       numeric('w_staj',    { precision: 5, scale: 4 }).notNull().default('0.1000'),
  wIntizom:    numeric('w_intizom', { precision: 5, scale: 4 }).notNull().default('0.1000'),
  wOzaro:      numeric('w_ozaro',   { precision: 5, scale: 4 }).notNull().default('0.1000'),
  wAiKpi:      numeric('w_ai_kpi',  { precision: 5, scale: 4 }).notNull().default('0.1000'),
  isActive:    boolean('is_active').notNull().default(true),
  updatedBy:   integer('updated_by').references(() => employees.id, { onDelete: 'set null' }),
  createdAt:   timestamp('created_at').notNull().defaultNow(),
  updatedAt:   timestamp('updated_at').notNull().defaultNow(),
}, (t) => [
  check('hr_rating_config_weights_sum_chk',
    sql`ABS((${t.wNorma} + ${t.wDavomat} + ${t.wSifat} + ${t.wStaj} + ${t.wIntizom} + ${t.wOzaro} + ${t.wAiKpi}) - 1.0) < 0.001`),
  check('hr_rating_config_threshold_order_chk',
    sql`${t.thresholdA} > ${t.thresholdB} AND ${t.thresholdB} > 0`),
]);

export const hrRatingFactors = pgTable('hr_rating_factors', {
  id:               serial('id').primaryKey(),
  employeeId:       integer('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
  periodYear:       smallint('period_year').notNull(),
  periodMonth:      smallint('period_month').notNull(),
  normaPercent:     numeric('norma_percent',    { precision: 5, scale: 2 }),
  davomatScore:     numeric('davomat_score',    { precision: 5, scale: 2 }),
  sifatScore:       numeric('sifat_score',      { precision: 5, scale: 2 }),
  stajScore:        numeric('staj_score',       { precision: 5, scale: 2 }),
  intizomScore:     numeric('intizom_score',    { precision: 5, scale: 2 }),
  ozaroBahoScore:   numeric('ozaro_baho_score', { precision: 5, scale: 2 }),
  aiKpiScore:       numeric('ai_kpi_score',     { precision: 5, scale: 2 }),
  totalScore:       numeric('total_score',      { precision: 5, scale: 2 }),
  ratingClass:      varchar('rating_class', { length: 1 }),
  configId:         integer('config_id').references(() => hrRatingConfig.id, { onDelete: 'set null' }),
  calculatedBy:     varchar('calculated_by', { length: 20 }).notNull().default('system'),
  calculatedAt:     timestamp('calculated_at'),
  confirmedBy:      integer('confirmed_by').references(() => employees.id, { onDelete: 'set null' }),
  confirmedAt:      timestamp('confirmed_at'),
  status:           varchar('status', { length: 20 }).notNull().default('draft'),
  notes:            text('notes'),
  createdAt:        timestamp('created_at').notNull().defaultNow(),
  updatedAt:        timestamp('updated_at').notNull().defaultNow(),
}, (t) => [
  unique('uq_hr_rating_factors_emp_period').on(t.employeeId, t.periodYear, t.periodMonth),
  index('idx_hr_rating_factors_emp_period').on(t.employeeId, t.periodYear, t.periodMonth),
  index('idx_hr_rating_factors_class').on(t.ratingClass, t.periodYear, t.periodMonth),
  check('hr_rating_factors_class_chk',
    sql`${t.ratingClass} IS NULL OR ${t.ratingClass} IN ('A','B','C')`),
  check('hr_rating_factors_status_chk',
    sql`${t.status} IN ('draft','confirmed','archived')`),
  check('hr_rating_factors_month_chk',
    sql`${t.periodMonth} BETWEEN 1 AND 12`),
]);

export const hrBonusSuggestions = pgTable('hr_bonus_suggestions', {
  id:                 serial('id').primaryKey(),
  employeeId:         integer('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
  periodYear:         smallint('period_year').notNull(),
  periodMonth:        smallint('period_month').notNull(),
  ratingId:           integer('rating_id').references(() => hrRatingFactors.id, { onDelete: 'set null' }),
  suggestedBonusPct:  numeric('suggested_bonus_pct', { precision: 5, scale: 2 }).notNull(),
  suggestedBy:        varchar('suggested_by', { length: 20 }).notNull().default('system'),
  status:             varchar('status', { length: 20 }).notNull().default('pending'),
  confirmedBy:        integer('confirmed_by').references(() => employees.id, { onDelete: 'set null' }),
  confirmedAt:        timestamp('confirmed_at'),
  payrollPeriodId:    integer('payroll_period_id'),
  rejectionReason:    text('rejection_reason'),
  createdAt:          timestamp('created_at').notNull().defaultNow(),
  updatedAt:          timestamp('updated_at').notNull().defaultNow(),
}, (t) => [
  check('hr_bonus_suggestions_status_chk',
    sql`${t.status} IN ('pending','confirmed','rejected')`),
  check('hr_bonus_suggestions_pct_chk',
    sql`${t.suggestedBonusPct} >= 0 AND ${t.suggestedBonusPct} <= 200`),
]);

// Eksport (lib/db barrel da ro'yxatga olinadi — bu P01/P02 ishi)
export type HrRatingConfig   = typeof hrRatingConfig.$inferSelect;
export type HrRatingFactors  = typeof hrRatingFactors.$inferSelect;
export type HrBonusSuggestion = typeof hrBonusSuggestions.$inferSelect;
export type NewHrRatingFactors = typeof hrRatingFactors.$inferInsert;
```

---

### QADAM 4 — `lib/db/src/schema/hr-onboarding-extended.ts` yaratish

**Fayl:** `lib/db/src/schema/hr-onboarding-extended.ts` (yangi fayl)

```typescript
/**
 * @module hr-onboarding-extended
 * @description Drizzle ORM schema: dual-mentor, control-sheet, NDA tables.
 * EP-HR-018 (mentors), EP-HR-041 (NDA), EP-HR-043/044/045/046 (control sheet).
 * DDL: apps/api/src/shared/db/migrations/hr-onboarding-gaps-2026-06-19.sql
 */

import {
  pgTable, serial, integer, varchar, boolean, text,
  timestamp, date, numeric, jsonb, unique, check, index,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { employees } from './employees';

// org_functions FK — lazy string ref (P01 barrel undan keyin wire qiladi)
export const hrMentorAssignments = pgTable('hr_mentor_assignments', {
  id:                     serial('id').primaryKey(),
  employeeId:             integer('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
  adaptationMentorId:     integer('adaptation_mentor_id').references(() => employees.id, { onDelete: 'set null' }),
  professionalMentorId:   integer('professional_mentor_id').references(() => employees.id, { onDelete: 'set null' }),
  assignedBy:             integer('assigned_by').references(() => employees.id, { onDelete: 'set null' }),
  assignedAt:             timestamp('assigned_at').notNull().defaultNow(),
  status:                 varchar('status', { length: 20 }).notNull().default('active'),
  adaptationNotes:        text('adaptation_notes'),
  professionalNotes:      text('professional_notes'),
  completedAt:            timestamp('completed_at'),
  createdAt:              timestamp('created_at').notNull().defaultNow(),
  updatedAt:              timestamp('updated_at').notNull().defaultNow(),
}, (t) => [
  unique('uq_hr_mentor_assign_emp').on(t.employeeId),
  index('idx_hr_mentor_assign_emp').on(t.employeeId),
  index('idx_hr_mentor_assign_adapt').on(t.adaptationMentorId),
  index('idx_hr_mentor_assign_prof').on(t.professionalMentorId),
  check('hr_mentor_assignments_status_chk',
    sql`${t.status} IN ('active','completed','cancelled')`),
]);

export const hrControlSheetTemplates = pgTable('hr_control_sheet_templates', {
  id:               serial('id').primaryKey(),
  cardId:           integer('card_id').notNull(),  // org_functions.id — P04 tomonidan boshqariladi
  title:            varchar('title', { length: 300 }).notNull(),
  instructionBand:  varchar('instruction_band', { length: 100 }),
  version:          integer('version').notNull().default(1),
  items:            jsonb('items').notNull().default(sql`'[]'::jsonb`),
                    // [{label: str, requires_test: bool, order: int}]
  isActive:         boolean('is_active').notNull().default(true),
  createdBy:        integer('created_by').references(() => employees.id, { onDelete: 'set null' }),
  createdAt:        timestamp('created_at').notNull().defaultNow(),
  updatedAt:        timestamp('updated_at').notNull().defaultNow(),
}, (t) => [
  index('idx_hr_ctrl_sheet_tpl_card').on(t.cardId, t.isActive),
]);

export const hrControlSheetRecords = pgTable('hr_control_sheet_records', {
  id:                   serial('id').primaryKey(),
  employeeId:           integer('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
  templateId:           integer('template_id').notNull().references(() => hrControlSheetTemplates.id, { onDelete: 'cascade' }),
  startedAt:            timestamp('started_at').notNull().defaultNow(),
  dueDate:              date('due_date'),
  completedAt:          timestamp('completed_at'),
  status:               varchar('status', { length: 20 }).notNull().default('in_progress'),
  itemsProgress:        jsonb('items_progress').notNull().default(sql`'[]'::jsonb`),
  mentorConfirmed:      boolean('mentor_confirmed').default(false),
  mentorConfirmedAt:    timestamp('mentor_confirmed_at'),
  mentorConfirmedBy:    integer('mentor_confirmed_by').references(() => employees.id, { onDelete: 'set null' }),
  miniTestScore:        numeric('mini_test_score', { precision: 5, scale: 2 }),
  miniTestTakenAt:      timestamp('mini_test_taken_at'),
  caseStudyComment:     text('case_study_comment'),
  createdAt:            timestamp('created_at').notNull().defaultNow(),
  updatedAt:            timestamp('updated_at').notNull().defaultNow(),
}, (t) => [
  unique('uq_hr_ctrl_sheet_rec_emp_tpl').on(t.employeeId, t.templateId),
  index('idx_hr_ctrl_sheet_rec_emp').on(t.employeeId, t.status),
  index('idx_hr_ctrl_sheet_rec_due').on(t.dueDate),
  check('hr_ctrl_sheet_records_status_chk',
    sql`${t.status} IN ('in_progress','completed','overdue','cancelled')`),
  check('hr_ctrl_sheet_records_score_chk',
    sql`${t.miniTestScore} IS NULL OR (${t.miniTestScore} >= 0 AND ${t.miniTestScore} <= 100)`),
]);

export const hrNdaRecords = pgTable('hr_nda_records', {
  id:             serial('id').primaryKey(),
  employeeId:     integer('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
  ndaVersion:     varchar('nda_version', { length: 20 }).notNull().default('1.0'),
  type:           varchar('type', { length: 20 }).notNull().default('onboarding'),
  signedAt:       timestamp('signed_at').notNull().defaultNow(),
  signatureHash:  varchar('signature_hash', { length: 64 }),
  signedBy:       integer('signed_by').notNull().references(() => employees.id, { onDelete: 'cascade' }),
  witnessedBy:    integer('witnessed_by').references(() => employees.id, { onDelete: 'set null' }),
  documentUrl:    text('document_url'),
  notes:          text('notes'),
  createdAt:      timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  index('idx_hr_nda_records_emp').on(t.employeeId, t.type),
  check('hr_nda_records_type_chk',
    sql`${t.type} IN ('onboarding','annual','change')`),
]);

export type HrMentorAssignment     = typeof hrMentorAssignments.$inferSelect;
export type HrControlSheetTemplate = typeof hrControlSheetTemplates.$inferSelect;
export type HrControlSheetRecord   = typeof hrControlSheetRecords.$inferSelect;
export type HrNdaRecord            = typeof hrNdaRecords.$inferSelect;
export type NewHrNdaRecord         = typeof hrNdaRecords.$inferInsert;
```

---

### QADAM 5 — DTO faylini yoz

**Fayl:** `apps/api/src/modules/hr/rating/dto/hr-rating.dto.ts` (yangi fayl)

```typescript
/**
 * @module hr-rating.dto
 * @description Zod schemas for HR rating endpoints (EP-HR-012/013/014).
 */
import { z } from 'zod';

export const CreateRatingSchema = z.object({
  employeeId:       z.number().int().positive(),
  periodYear:       z.number().int().min(2020).max(2100),
  periodMonth:      z.number().int().min(1).max(12),
  normaPercent:     z.number().min(0).max(150).optional(),
  davomatScore:     z.number().min(0).max(100).optional(),
  sifatScore:       z.number().min(0).max(100).optional(),
  stajScore:        z.number().min(0).max(100).optional(),
  intizomScore:     z.number().min(0).max(100).optional(),
  ozaroBahoScore:   z.number().min(0).max(100).optional(),
  aiKpiScore:       z.number().min(0).max(100).optional(),
  notes:            z.string().max(1000).optional(),
});
export type CreateRatingDto = z.infer<typeof CreateRatingSchema>;

export const ConfirmRatingSchema = z.object({
  confirmedBy: z.number().int().positive(),
  notes:       z.string().max(500).optional(),
});
export type ConfirmRatingDto = z.infer<typeof ConfirmRatingSchema>;

export const UpdateConfigSchema = z.object({
  thresholdA: z.number().min(50).max(100).optional(),
  thresholdB: z.number().min(30).max(90).optional(),
  wNorma:     z.number().min(0).max(1).optional(),
  wDavomat:   z.number().min(0).max(1).optional(),
  wSifat:     z.number().min(0).max(1).optional(),
  wStaj:      z.number().min(0).max(1).optional(),
  wIntizom:   z.number().min(0).max(1).optional(),
  wOzaro:     z.number().min(0).max(1).optional(),
  wAiKpi:     z.number().min(0).max(1).optional(),
}).refine((d) => {
  const sum = (d.wNorma ?? 0) + (d.wDavomat ?? 0) + (d.wSifat ?? 0) +
              (d.wStaj ?? 0)  + (d.wIntizom ?? 0) + (d.wOzaro ?? 0) +
              (d.wAiKpi ?? 0);
  // Agar hamma vaznlar berilgan bo'lsa — jami 1.0 bo'lishi shart
  const allProvided = d.wNorma !== undefined && d.wDavomat !== undefined &&
    d.wSifat !== undefined && d.wStaj !== undefined && d.wIntizom !== undefined &&
    d.wOzaro !== undefined && d.wAiKpi !== undefined;
  if (allProvided) return Math.abs(sum - 1.0) < 0.001;
  return true;
}, { message: 'Barcha 7 vazn berilgan bo\'lsa jami 1.0 bo\'lishi kerak' });
export type UpdateConfigDto = z.infer<typeof UpdateConfigSchema>;

export const ConfirmBonusSchema = z.object({
  status:          z.enum(['confirmed', 'rejected']),
  confirmedBy:     z.number().int().positive(),
  rejectionReason: z.string().max(500).optional(),
});
export type ConfirmBonusDto = z.infer<typeof ConfirmBonusSchema>;

export const RatingQuerySchema = z.object({
  year:     z.coerce.number().int().min(2020).optional(),
  month:    z.coerce.number().int().min(1).max(12).optional(),
  status:   z.enum(['draft','confirmed','archived']).optional(),
  page:     z.coerce.number().int().min(1).default(1),
  limit:    z.coerce.number().int().min(1).max(100).default(20),
});
export type RatingQueryDto = z.infer<typeof RatingQuerySchema>;

// Onboarding DDL DTO
export const AssignMentorsSchema = z.object({
  adaptationMentorId:   z.number().int().positive().optional(),
  professionalMentorId: z.number().int().positive().optional(),
  adaptationNotes:      z.string().max(1000).optional(),
  professionalNotes:    z.string().max(1000).optional(),
}).refine(d => d.adaptationMentorId || d.professionalMentorId, {
  message: 'Kamida bitta mentor (adaptatsiya yoki professional) talab qilinadi',
});
export type AssignMentorsDto = z.infer<typeof AssignMentorsSchema>;

export const SignNdaSchema = z.object({
  employeeId:    z.number().int().positive(),
  ndaVersion:    z.string().min(1).max(20).default('1.0'),
  type:          z.enum(['onboarding','annual','change']).default('onboarding'),
  witnessedBy:   z.number().int().positive().optional(),
  documentUrl:   z.string().url().optional(),
  signatureHash: z.string().length(64).optional(),
  notes:         z.string().max(1000).optional(),
});
export type SignNdaDto = z.infer<typeof SignNdaSchema>;
```

---

### QADAM 6 — Repository yoz

**Fayl:** `apps/api/src/modules/hr/rating/hr-rating.repository.ts` (yangi fayl)

Quyidagi shablonni to'liq yoz (oldin/keyin misol):

**OLDIN:** Jadval yo'q, endpoint yo'q.
**KEYIN:**

```typescript
/**
 * @module hr-rating.repository
 * @description Drizzle ORM repository for 7-factor rating tables.
 * Returns Result<T> — never throws. Q-40: real DB only.
 */
import { Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@common/drizzle';
import type { DrizzleDb } from '@common/drizzle';
import { safeCall, Result, AppError } from '@common/result';
import { eq, and, desc, asc } from 'drizzle-orm';
// NOTE: jadvallar P01/P02 barrel deploy bo'lgandan keyin import qilinadi.
// Hozircha path: lib/db/src/schema/hr-rating
import {
  hrRatingConfig,
  hrRatingFactors,
  hrBonusSuggestions,
  type NewHrRatingFactors,
  type HrRatingConfig,
  type HrRatingFactors,
} from '../../../../../shared/db/schema-imports/hr-rating';
// ↑ Bu import path P01/P02 dan keyin lib/db canonical barrel ga o'tkaziladi.

// === REYTING KONFIGURATSIYA ===

export const HR_RATING_REPO = Symbol('HR_RATING_REPO');

@Injectable()
export class HrRatingRepository {
  constructor(@InjectDrizzle() private readonly db: DrizzleDb) {}

  async getActiveConfig(): Promise<Result<HrRatingConfig, AppError>> {
    return safeCall(async () => {
      const rows = await this.db
        .select()
        .from(hrRatingConfig)
        .where(eq(hrRatingConfig.isActive, true))
        .orderBy(desc(hrRatingConfig.createdAt))
        .limit(1);
      if (!rows[0]) {
        throw new Error('Aktiv reyting konfiguratsiyasi topilmadi');
      }
      return rows[0];
    });
  }

  async updateConfig(
    id: number,
    patch: Partial<HrRatingConfig>,
  ): Promise<Result<HrRatingConfig, AppError>> {
    return safeCall(async () => {
      const rows = await this.db
        .update(hrRatingConfig)
        .set({ ...patch, updatedAt: new Date() })
        .where(eq(hrRatingConfig.id, id))
        .returning();
      if (!rows[0]) throw new Error(`Config #${id} topilmadi`);
      return rows[0];
    });
  }

  // === 7-FAKTOR REYTING ===

  async upsertRating(
    data: NewHrRatingFactors,
  ): Promise<Result<HrRatingFactors, AppError>> {
    return safeCall(async () => {
      // Agar shu oy uchun draft mavjud bo'lsa — yangilash
      const existing = await this.db
        .select({ id: hrRatingFactors.id, status: hrRatingFactors.status })
        .from(hrRatingFactors)
        .where(and(
          eq(hrRatingFactors.employeeId, data.employeeId),
          eq(hrRatingFactors.periodYear,  data.periodYear),
          eq(hrRatingFactors.periodMonth, data.periodMonth),
        ))
        .limit(1);

      if (existing[0]) {
        if (existing[0].status === 'confirmed') {
          throw new Error('Tasdiqlangan reyting o\'zgartirilmaydi');
        }
        const updated = await this.db
          .update(hrRatingFactors)
          .set({ ...data, updatedAt: new Date() })
          .where(eq(hrRatingFactors.id, existing[0].id))
          .returning();
        return updated[0];
      }

      const inserted = await this.db
        .insert(hrRatingFactors)
        .values(data)
        .returning();
      return inserted[0];
    });
  }

  async findById(id: number): Promise<Result<HrRatingFactors, AppError>> {
    return safeCall(async () => {
      const rows = await this.db
        .select()
        .from(hrRatingFactors)
        .where(eq(hrRatingFactors.id, id))
        .limit(1);
      if (!rows[0]) throw new Error(`Rating #${id} topilmadi`);
      return rows[0];
    });
  }

  async findByEmployeePeriod(
    employeeId: number,
    year: number,
    month: number,
  ): Promise<Result<HrRatingFactors | null, AppError>> {
    return safeCall(async () => {
      const rows = await this.db
        .select()
        .from(hrRatingFactors)
        .where(and(
          eq(hrRatingFactors.employeeId, employeeId),
          eq(hrRatingFactors.periodYear, year),
          eq(hrRatingFactors.periodMonth, month),
        ))
        .limit(1);
      return rows[0] ?? null;
    });
  }

  async listRatings(
    opts: { year?: number; month?: number; status?: string; page: number; limit: number },
  ): Promise<Result<{ items: HrRatingFactors[]; total: number }, AppError>> {
    return safeCall(async () => {
      const conditions = [];
      if (opts.year)   conditions.push(eq(hrRatingFactors.periodYear, opts.year));
      if (opts.month)  conditions.push(eq(hrRatingFactors.periodMonth, opts.month));
      if (opts.status) conditions.push(eq(hrRatingFactors.status, opts.status));

      const where = conditions.length > 0 ? and(...conditions) : undefined;
      const offset = (opts.page - 1) * opts.limit;

      const [items, countRows] = await Promise.all([
        this.db.select().from(hrRatingFactors)
          .where(where)
          .orderBy(desc(hrRatingFactors.periodYear), desc(hrRatingFactors.periodMonth))
          .limit(opts.limit)
          .offset(offset),
        this.db.$count(hrRatingFactors, where),
      ]);

      return { items, total: Number(countRows) };
    });
  }

  async confirmRating(
    id: number,
    confirmedBy: number,
    notes?: string,
  ): Promise<Result<HrRatingFactors, AppError>> {
    return safeCall(async () => {
      const rows = await this.db
        .update(hrRatingFactors)
        .set({
          status: 'confirmed',
          confirmedBy,
          confirmedAt: new Date(),
          notes: notes ?? undefined,
          updatedAt: new Date(),
        })
        .where(and(
          eq(hrRatingFactors.id, id),
          eq(hrRatingFactors.status, 'draft'),
        ))
        .returning();
      if (!rows[0]) throw new Error(`Rating #${id} draft holatda emas`);
      return rows[0];
    });
  }

  // === BONUS TAKLIF ===

  async createBonusSuggestion(data: {
    employeeId: number;
    periodYear: number;
    periodMonth: number;
    ratingId?: number;
    suggestedBonusPct: number;
    suggestedBy?: string;
  }): Promise<Result<typeof hrBonusSuggestions.$inferSelect, AppError>> {
    return safeCall(async () => {
      const inserted = await this.db
        .insert(hrBonusSuggestions)
        .values({
          ...data,
          suggestedBy: data.suggestedBy ?? 'system',
          status: 'pending',
        })
        .returning();
      return inserted[0];
    });
  }

  async confirmBonus(
    id: number,
    dto: { status: 'confirmed' | 'rejected'; confirmedBy: number; rejectionReason?: string },
  ): Promise<Result<typeof hrBonusSuggestions.$inferSelect, AppError>> {
    return safeCall(async () => {
      const rows = await this.db
        .update(hrBonusSuggestions)
        .set({
          status: dto.status,
          confirmedBy: dto.confirmedBy,
          confirmedAt: new Date(),
          rejectionReason: dto.rejectionReason ?? undefined,
          updatedAt: new Date(),
        })
        .where(and(
          eq(hrBonusSuggestions.id, id),
          eq(hrBonusSuggestions.status, 'pending'),
        ))
        .returning();
      if (!rows[0]) throw new Error(`Bonus taklifi #${id} pending holatda emas`);
      return rows[0];
    });
  }

  async listPendingBonuses(): Promise<Result<(typeof hrBonusSuggestions.$inferSelect)[], AppError>> {
    return safeCall(async () =>
      this.db.select()
        .from(hrBonusSuggestions)
        .where(eq(hrBonusSuggestions.status, 'pending'))
        .orderBy(asc(hrBonusSuggestions.createdAt)),
    );
  }
}
```

---

### QADAM 7 — Service yoz

**Fayl:** `apps/api/src/modules/hr/rating/hr-rating.service.ts` (yangi fayl)

```typescript
/**
 * @module hr-rating.service
 * @description 7-factor rating business logic. Result<T> pattern.
 * Never touches payroll GL (PayrollService/PayrollClosureService — Q-46).
 */
import { Injectable, Logger } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { HrRatingRepository } from './hr-rating.repository';
import type { CreateRatingDto, ConfirmRatingDto, UpdateConfigDto, ConfirmBonusDto, RatingQueryDto } from './dto/hr-rating.dto';

// Reyting sinfi hisobi (konfiguratsiya bo'yicha)
function computeRatingClass(totalScore: number, thresholdA: number, thresholdB: number): 'A' | 'B' | 'C' {
  if (totalScore >= thresholdA) return 'A';
  if (totalScore >= thresholdB) return 'B';
  return 'C';
}

// 7-faktor vaznli yig'indi hisobi
function computeTotalScore(dto: CreateRatingDto, config: {
  wNorma: string; wDavomat: string; wSifat: string; wStaj: string;
  wIntizom: string; wOzaro: string; wAiKpi: string;
}): number {
  const n = (v?: number) => v ?? 0;
  const w = (s: string) => parseFloat(s);
  return (
    n(dto.normaPercent)   * Math.min(n(dto.normaPercent) / 100, 1) * w(config.wNorma)   * 100 +
    n(dto.davomatScore)   * w(config.wDavomat)  +
    n(dto.sifatScore)     * w(config.wSifat)    +
    n(dto.stajScore)      * w(config.wStaj)     +
    n(dto.intizomScore)   * w(config.wIntizom)  +
    n(dto.ozaroBahoScore) * w(config.wOzaro)    +
    n(dto.aiKpiScore)     * w(config.wAiKpi)
  );
}

// Reyting bo'yicha tavsiya etilgan bonus foizi
// ⚠️ OWNER-GATED: OCHIQ-JAVOBLAR EP-HR-014 — bonus % egasi TASDIQLAMAGAN hardcode qilinmaydi.
// "toifa bonus foizini TAKLIF qiladi, HR/rahbar tasdiqlaydi → Payroll"
// Foiz = hr_bonus_config jadvalidan (master-data) yoki egasi belgilagunicha NULL.
// EGASI QIYMATI KERAK: A toifa uchun necha %, B toifa uchun necha % — owner admin panelda sozlaydi.
//
// TAQIQLANGAN naqsh (olib tashlandi):
//   if (ratingClass === 'A') return Math.min(30 + (totalScore - 85) * 2, 50); // 30-50% — o'ylab topilgan
//   if (ratingClass === 'B') return Math.min(10 + (totalScore - 70) * 1.5, 30); // 10-30% — o'ylab topilgan
//
// TO'G'RI naqsh (quyida):
async function fetchBonusPctFromConfig(
  db: DrizzleDb,
  ratingClass: 'A' | 'B' | 'C',
): Promise<number | null> {
  // hr_bonus_pct_config jadvalidan olish (agar mavjud bo'lsa)
  // Jadval: id, rating_class VARCHAR(1), suggested_pct NUMERIC(5,2), is_active BOOLEAN
  // Agar jadval/qator yo'q bo'lsa — null qaytaradi, HR o'zi belgilaydi
  // EGASI QIYMATI KERAK: hr_bonus_pct_config jadvalini qaysi foizlar bilan to'ldirish — owner
  try {
    const rows = await db.execute(
      sql`SELECT suggested_pct FROM hr_bonus_pct_config
          WHERE rating_class = ${ratingClass} AND is_active = true
          LIMIT 1`
    );
    const row = (rows as unknown as { rows: Array<{ suggested_pct: string }> }).rows[0];
    return row ? parseFloat(row.suggested_pct) : null;
  } catch {
    return null; // jadval yo'q yoki xato — HR qo'lda kiritadi
  }
}

@Injectable()
export class HrRatingService {
  private readonly logger = new Logger(HrRatingService.name);

  constructor(
    private readonly repo: HrRatingRepository,
    // NOTE: db injeksiyasi computeFromSources va fetchBonusPctFromConfig uchun
    // DRIZZLE_TOKEN import path P01/P02 barrel dan keyin sozlanadi
    @Inject('DRIZZLE') private readonly db: DrizzleDb,
  ) {}

  async getConfig(): Promise<Result<object, AppError>> {
    return this.repo.getActiveConfig();
  }

  /**
   * SCORE MANBA: faktor ballarini tizim jadvallaridan pull qilish.
   * VISION-1000 Q65: faktor ballari API-input emas, DB jadvallaridan olinadi.
   * Manba: MES (norma%), attendance (davomat), QC (sifat/brak), hire_date (staj),
   *        hr_discipline_logs (intizom), hr_peer_reviews (ozaro), employee_daily_kpi/CKP (ai_kpi).
   *
   * @returns CreateRatingDto — barcha faktor ballari tizimdan hisoblangan.
   * @note Agar manba jadval mavjud bo'lmasa yoki ma'lumot yo'q bo'lsa — null qaytaradi
   *       (fallback: caller API-input ishlatadi).
   *
   * EGASI QIYMATI KERAK: normativ qiymatlar (max norma, peer review weightings).
   */
  async computeFromSources(
    employeeId: number,
    year: number,
    month: number,
  ): Promise<Result<Partial<CreateRatingDto>, AppError>> {
    return safeCall(async () => {
      // Manba 1: Norma % — MES production_sessions (o'sha oy)
      // Manba 2: Davomat — attendance_records
      // Manba 3: Sifat/brak — qc_results / qc_reclamations
      // Manba 4: Staj — employees.hire_date
      // Manba 5: Intizom — hr_discipline_logs
      // Manba 6: O'zaro baho — hr_peer_reviews
      // Manba 7: AI KPI — employee_daily_kpi / ЦКП bajarilish (daily_reports)
      //
      // TODO: har bir manba so'rovi P27 executor tomonidan yoziladi.
      // Hozircha skeleton — barcha balllar null qaytariladi, fallback API-input.
      this.logger.log(`computeFromSources: emp#${employeeId} ${year}/${month} — skeleton, TODO`);
      return {
        employeeId,
        periodYear:  year,
        periodMonth: month,
        // normaPercent, davomatScore, ... — manba so'rovlar yozilgandan keyin to'ldiriladi
      };
    });
  }

  async updateConfig(
    configId: number,
    dto: UpdateConfigDto,
    updatedBy: number,
  ): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const configR = await this.repo.getActiveConfig();
      if (!configR.ok) throw new Error(configR.error.message);
      const config = configR.data;

      const patch = {
        thresholdA: dto.thresholdA?.toString() ?? config.thresholdA,
        thresholdB: dto.thresholdB?.toString() ?? config.thresholdB,
        wNorma:     dto.wNorma?.toString()    ?? config.wNorma,
        wDavomat:   dto.wDavomat?.toString()  ?? config.wDavomat,
        wSifat:     dto.wSifat?.toString()    ?? config.wSifat,
        wStaj:      dto.wStaj?.toString()     ?? config.wStaj,
        wIntizom:   dto.wIntizom?.toString()  ?? config.wIntizom,
        wOzaro:     dto.wOzaro?.toString()    ?? config.wOzaro,
        wAiKpi:     dto.wAiKpi?.toString()    ?? config.wAiKpi,
        updatedBy,
      };
      return this.repo.updateConfig(configId, patch);
    });
  }

  async createOrUpdateRating(
    dto: CreateRatingDto,
  ): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const configR = await this.repo.getActiveConfig();
      if (!configR.ok) throw new Error('Reyting konfiguratsiyasi topilmadi');
      const config = configR.data;

      const totalScore = Math.min(100, Math.max(0, computeTotalScore(dto, config)));
      const ratingClass = computeRatingClass(
        totalScore,
        parseFloat(config.thresholdA),
        parseFloat(config.thresholdB),
      );

      const upsertR = await this.repo.upsertRating({
        ...dto,
        normaPercent:     dto.normaPercent?.toString(),
        davomatScore:     dto.davomatScore?.toString(),
        sifatScore:       dto.sifatScore?.toString(),
        stajScore:        dto.stajScore?.toString(),
        intizomScore:     dto.intizomScore?.toString(),
        ozaroBahoScore:   dto.ozaroBahoScore?.toString(),
        aiKpiScore:       dto.aiKpiScore?.toString(),
        totalScore:       totalScore.toFixed(2),
        ratingClass,
        configId:         config.id,
        calculatedAt:     new Date(),
        status:           'draft',
      });

      if (!upsertR.ok) throw new Error(upsertR.error.message);
      const rating = upsertR.data;

      // Bonus taklifi avtomatik yaratish (EP-HR-014: tizim taklif → HR tasdiqlaydi)
      // ⚠️ OWNER-GATED: bonus foizi hr_bonus_pct_config dan olinadi (hardcode EMAS).
      // Agar config yo'q → bonusPct=null → HR qo'lda belgilaydi (suggestedBonusPct=0, status='pending').
      // EGASI QIYMATI KERAK: A/B/C toifa foizini hr_bonus_pct_config da sozlash.
      const bonusPct = await fetchBonusPctFromConfig(this.db, ratingClass);
      // bonusPct null bo'lsa ham suggestion yaratiladi — HR tasdiq bilan foiz belgilanadi
      {
        await this.repo.createBonusSuggestion({
          employeeId:        dto.employeeId,
          periodYear:        dto.periodYear,
          periodMonth:       dto.periodMonth,
          ratingId:          rating.id,
          suggestedBonusPct: bonusPct ?? 0, // EGASI QIYMATI KERAK — null=0 fallback
          suggestedBy:       'system',
        });
        this.logger.log(`Bonus taklifi: xodim #${dto.employeeId} uchun ${bonusPct}% — HR tasdiqlashi kerak`);
      }

      return rating;
    });
  }

  async confirmRating(
    id: number,
    dto: ConfirmRatingDto,
  ): Promise<Result<object, AppError>> {
    return this.repo.confirmRating(id, dto.confirmedBy, dto.notes);
  }

  async listRatings(query: RatingQueryDto): Promise<Result<object, AppError>> {
    return this.repo.listRatings(query);
  }

  async getRatingById(id: number): Promise<Result<object, AppError>> {
    return this.repo.findById(id);
  }

  async getPendingBonuses(): Promise<Result<object, AppError>> {
    return this.repo.listPendingBonuses();
  }

  async confirmBonus(
    id: number,
    dto: ConfirmBonusDto,
  ): Promise<Result<object, AppError>> {
    return this.repo.confirmBonus(id, dto);
  }
}
```

---

### QADAM 8 — Controller yoz

**Fayl:** `apps/api/src/modules/hr/rating/hr-rating.controller.ts` (yangi fayl)

```typescript
/**
 * @module hr-rating.controller
 * @description REST controller for 7-factor rating.
 * Route prefix: /api/hr/rating
 * EP-HR-012/013/014.
 */
import {
  Controller, Get, Post, Patch, Param, Body, Query,
  ParseIntPipe, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@common/types/user.types';
import { unwrapOrThrow } from '@common/http-result';
import { HrRatingService } from './hr-rating.service';
import {
  CreateRatingSchema,
  ConfirmRatingSchema,
  UpdateConfigSchema,
  ConfirmBonusSchema,
  RatingQuerySchema,
} from './dto/hr-rating.dto';

@ApiTags('HR Rating (7-factor)')
@ApiBearerAuth()
@Controller('hr/rating')
export class HrRatingController {
  constructor(private readonly svc: HrRatingService) {}

  // --- Konfiguratsiya ---

  @Get('config')
  @ApiOperation({ summary: 'Aktiv reyting konfiguratsiyasini olish (EP-HR-012)' })
  async getConfig() {
    return unwrapOrThrow(await this.svc.getConfig());
  }

  @Patch('config/:id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr_manager')
  @ApiOperation({ summary: 'Reyting konfiguratsiyasini yangilash (vaznlar, chegara) (EP-HR-012)' })
  async updateConfig(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const dto = UpdateConfigSchema.parse(body);
    return unwrapOrThrow(await this.svc.updateConfig(id, dto, user.id));
  }

  // --- 7-faktor reyting CRUD ---

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr_manager', 'hr')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Xodim uchun 7-faktor reyting hisoblash / yangilash (EP-HR-013)' })
  async createRating(@Body() body: unknown) {
    const dto = CreateRatingSchema.parse(body);
    return unwrapOrThrow(await this.svc.createOrUpdateRating(dto));
  }

  @Get()
  @ApiOperation({ summary: 'Reyting ro\'yxati (yil/oy/status bo\'yicha filter)' })
  async listRatings(@Query() query: unknown) {
    const dto = RatingQuerySchema.parse(query);
    return unwrapOrThrow(await this.svc.listRatings(dto));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Reyting yozuvini ID bo\'yicha olish' })
  async getOne(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrThrow(await this.svc.getRatingById(id));
  }

  @Patch(':id/confirm')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr_manager', 'manager')
  @ApiOperation({ summary: 'Reytingni tasdiqlash (menejer/HR) (EP-HR-013)' })
  async confirmRating(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
  ) {
    const dto = ConfirmRatingSchema.parse(body);
    return unwrapOrThrow(await this.svc.confirmRating(id, dto));
  }

  // --- Bonus taklif (EP-HR-014) ---

  @Get('bonus/pending')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr_manager', 'hr')
  @ApiOperation({ summary: 'Tasdiqlanmagan bonus takliflar ro\'yxati (EP-HR-014)' })
  async pendingBonuses() {
    return unwrapOrThrow(await this.svc.getPendingBonuses());
  }

  @Patch('bonus/:id/confirm')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr_manager', 'manager')
  @ApiOperation({ summary: 'Bonus taklifini tasdiqlash yoki rad etish → Payroll ga uzatiladi (EP-HR-014)' })
  async confirmBonus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
  ) {
    const dto = ConfirmBonusSchema.parse(body);
    return unwrapOrThrow(await this.svc.confirmBonus(id, dto));
  }
}
```

---

### QADAM 9 — `onboarding.service.ts` ga mentor + NDA metodlarini qo'sh

**Fayl:** `apps/api/src/modules/hr/onboarding/onboarding.service.ts`

Mavjud service ga quyidagi metodlarni QO'SH (mavjud metodlarni O'CHIRMA — Q-46):

**OLDIN (qator 37 atrofida):**
```typescript
@Injectable()
export class OnboardingService {
  constructor(
    private readonly jobSvc: OnboardingJobService,
    @Inject(HR_ONBOARDING_REPO) private readonly hrOnboardingRepo: IHrOnboardingRepository,
    private readonly progressSvc: OnboardingProgressService,
  ) {}
```

**KEYIN:**
```typescript
import { DrizzleService } from '@shared/db/drizzle.service';           // mavjud import bo'lsa
import { hrMentorAssignments, hrNdaRecords } from '../../../shared/db/schema-imports/hr-onboarding-extended';
import type { AssignMentorsDto, SignNdaDto } from '../rating/dto/hr-rating.dto';
import { eq } from 'drizzle-orm';

@Injectable()
export class OnboardingService {
  constructor(
    private readonly jobSvc: OnboardingJobService,
    @Inject(HR_ONBOARDING_REPO) private readonly hrOnboardingRepo: IHrOnboardingRepository,
    private readonly progressSvc: OnboardingProgressService,
    @InjectDrizzle() private readonly db: DrizzleDb,  // qo'shildi
  ) {}

  // ... mavjud metodlar o'zgarishsiz qoladi ...

  // === MENTOR TAYINLASH (EP-HR-018) ===

  async assignMentors(
    employeeId: number,
    dto: AssignMentorsDto,
    assignedBy: number,
  ): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const existing = await this.db
        .select({ id: hrMentorAssignments.id })
        .from(hrMentorAssignments)
        .where(eq(hrMentorAssignments.employeeId, employeeId))
        .limit(1);

      if (existing[0]) {
        const updated = await this.db
          .update(hrMentorAssignments)
          .set({
            adaptationMentorId:   dto.adaptationMentorId ?? undefined,
            professionalMentorId: dto.professionalMentorId ?? undefined,
            adaptationNotes:      dto.adaptationNotes ?? undefined,
            professionalNotes:    dto.professionalNotes ?? undefined,
            updatedAt:            new Date(),
          })
          .where(eq(hrMentorAssignments.id, existing[0].id))
          .returning();
        return updated[0];
      }

      const inserted = await this.db
        .insert(hrMentorAssignments)
        .values({
          employeeId,
          adaptationMentorId:   dto.adaptationMentorId,
          professionalMentorId: dto.professionalMentorId,
          adaptationNotes:      dto.adaptationNotes,
          professionalNotes:    dto.professionalNotes,
          assignedBy,
          status: 'active',
        })
        .returning();
      return inserted[0];
    });
  }

  async getMentorAssignment(employeeId: number): Promise<Result<object | null, AppError>> {
    return safeCall(async () => {
      const rows = await this.db
        .select()
        .from(hrMentorAssignments)
        .where(eq(hrMentorAssignments.employeeId, employeeId))
        .limit(1);
      return rows[0] ?? null;
    });
  }

  // === NDA IMZOLASH (EP-HR-041) ===

  async signNda(dto: SignNdaDto): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const inserted = await this.db
        .insert(hrNdaRecords)
        .values({
          employeeId:    dto.employeeId,
          ndaVersion:    dto.ndaVersion,
          type:          dto.type,
          signedAt:      new Date(),
          signatureHash: dto.signatureHash,
          signedBy:      dto.employeeId,  // xodim o'zi imzolaydi
          witnessedBy:   dto.witnessedBy,
          documentUrl:   dto.documentUrl,
          notes:         dto.notes,
        })
        .returning();
      return inserted[0];
    });
  }

  async getNdaRecords(employeeId: number): Promise<Result<object[], AppError>> {
    return safeCall(async () =>
      this.db
        .select()
        .from(hrNdaRecords)
        .where(eq(hrNdaRecords.employeeId, employeeId))
        .orderBy(hrNdaRecords.signedAt),
    );
  }
```

---

### QADAM 10 — `onboarding.controller.ts` ga yangi yo'llarni qo'sh

**Fayl:** `apps/api/src/modules/hr/onboarding/onboarding.controller.ts`

Mavjud controller ga quyidagi metodlarni QO'SH (mavjud metodlarni O'CHIRMA):

```typescript
// ... mavjud import'lar saqlangan holda quyidagilarni qo'sh:
import {
  AssignMentorsSchema,
  SignNdaSchema,
} from '../rating/dto/hr-rating.dto';

// onboarding controller ichiga (mavjud metodlar oxiriga):

  // === MENTOR TAYINLASH (EP-HR-018) ===

  @Post('employees/:id/mentors')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr_manager', 'hr')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Xodimga 2 ta mentor tayinlash (EP-HR-018)' })
  async assignMentors(
    @Param('id', ParseIntPipe) employeeId: number,
    @Body() body: unknown,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const dto = AssignMentorsSchema.parse(body);
    return unwrapOrInternal(await this.onboardingService.assignMentors(employeeId, dto, user.id));
  }

  @Get('employees/:id/mentors')
  @ApiOperation({ summary: 'Xodim mentor tayinlanishini olish (EP-HR-018)' })
  async getMentorAssignment(@Param('id', ParseIntPipe) employeeId: number) {
    return unwrapOrInternal(await this.onboardingService.getMentorAssignment(employeeId));
  }

  // === NDA IMZOLASH (EP-HR-041) ===

  @Post('nda')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr_manager', 'hr')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'NDA imzolash yozuvini yaratish (EP-HR-041)' })
  async signNda(@Body() body: unknown) {
    const dto = SignNdaSchema.parse(body);
    return unwrapOrInternal(await this.onboardingService.signNda(dto));
  }

  @Get('employees/:id/nda')
  @ApiOperation({ summary: 'Xodim NDA tarixi (EP-HR-041)' })
  async getNdaRecords(@Param('id', ParseIntPipe) employeeId: number) {
    return unwrapOrInternal(await this.onboardingService.getNdaRecords(employeeId));
  }
```

---

### QADAM 11 — `daily-report.service.ts` da cron to'g'irlash

**Fayl:** `apps/api/src/modules/hr/daily-report/daily-report.service.ts`

**OLDIN (qator 179):**
```typescript
  @Cron('0 17 * * 1-6')
  async sendDailyReportReminder() {
```

**KEYIN:**
```typescript
  @Cron('0 15 * * 1-6')   // 15:00 — deadline dan 1 soat oldin eslatma (EP-HR-006)
  async sendDailyReportReminder() {
```

**OLDIN (qator 205):**
```typescript
  @Cron('0 20 * * 1-6')
  async markAbsentReports() {
    return safeCall(async () => {
      const today = _time.now().toISOString().split('T')[0];
      await this.repo.markAbsentForDate(today);
      this.logger.log(`markAbsentReports: processed ${today}`);

      // 3-hour escalation: reminder was sent at 17:00; deadline is 20:00 (3h window).
```

**KEYIN:**
```typescript
  @Cron('0 16 * * 1-6')   // 16:00 — vizyon deadline (EP-HR-006): topshirilmasa = o'sha kun hisoblanmaydi
  async markAbsentReports() {
    return safeCall(async () => {
      const today = _time.now().toISOString().split('T')[0];
      await this.repo.markAbsentForDate(today);
      this.logger.log(`markAbsentReports: processed ${today}`);

      // EP-HR-006: 16:00 da topshirilmagan hisobotlar "absent" deb belgilanadi.
      // Vizyon: not submitted by 16:00 → that day not counted.
```

Qolgan kodni o'zgartirma. Faqat `@Cron` qiymatlarini va comment'ni o'zgartir.

---

### QADAM 12 — `hr.providers.ts` ga yangi providers qo'sh

**Fayl:** `apps/api/src/modules/hr/hr.providers.ts`

**OLDIN (faylning so'nggi eksport bloki `hrProviders` oxirida):**
```typescript
  // PA3-17 Wave 5: merged from modules/applications/
  ApplicationsRepository,
  ApplicationsService,
];
```

**KEYIN:**
```typescript
  // PA3-17 Wave 5: merged from modules/applications/
  ApplicationsRepository,
  ApplicationsService,
  // P27: 7-factor rating
  HrRatingRepository,
  HrRatingService,
];
```

**Import qo'shish (faylning yuqori qismiga):**
```typescript
import { HrRatingRepository } from './rating/hr-rating.repository';
import { HrRatingService } from './rating/hr-rating.service';
```

**hrControllers arrayiga qo'sh:**
```typescript
// OLDIN (oxirida):
  HrQuestionnaireController,
];

// KEYIN:
  HrQuestionnaireController,
  HrRatingController,   // P27: 7-factor rating
];
```

**Import qo'shish:**
```typescript
import { HrRatingController } from './rating/hr-rating.controller';
```

---

### QADAM 13 — `EmployeeRating.tsx` ni qayta yoz

**Fayl:** `artifacts/erp-dashboard/src/pages/EmployeeRating.tsx`

`@deprecated` ni o'chir, to'liq yangi 7-faktor rating sahifasini yoz.
Qoida 19: kamida bitta useMutation bo'lishi shart.

**Sahifa minimumi (to'liq yoz, qisqartma emas):**
- `useQuery` → `/api/hr/rating/config` (chegara va vaznlarni ko'rsatish)
- `useQuery` → `/api/hr/rating?year=...&month=...` (reyting ro'yxati)
- `useQuery` → `/api/hr/rating/bonus/pending` (tasdiqlanmagan bonus takliflar)
- `useMutation` → POST `/api/hr/rating` (yangi reyting kiritish)
- `useMutation` → PATCH `/api/hr/rating/:id/confirm` (reyting tasdiqlash)
- `useMutation` → PATCH `/api/hr/rating/bonus/:id/confirm` (bonus tasdiqlash/rad etish)

**Sahifa tuzilmasi:**
```
EPPageHeader — "Xodim Reytingi (7-faktor)"
Tabs:
  "Reyting ro'yxati"  — jadval + yaratish tugmasi
  "Bonus takliflar"   — pending bonuslar jadval + tasdiqlash
  "Konfiguratsiya"    — admin: chegara + vaznlar (faqat admin/hr_manager)
```

**Reyting kiritish dialog** (EPRatingCreateDialog):
```
7 ta input maydoni:
  Norma % (0-150), Davomat (0-100), Sifat (0-100),
  Staj (0-100), Intizom (0-100), O'zaro baho (0-100), AI KPI (0-100)
Xodim ID
Yil / Oy
```

**Reyting jadvali ustunlari:**
```
Xodim | Davr | Norma | Davomat | Sifat | Staj | Intizom | O'zaro | AI KPI | Jami | Sinf | Status | Amal
```

**Sinf badge ranglari:**
- A — yashil (`bg-green-100 text-green-800`)
- B — sariq (`bg-amber-100 text-amber-800`)
- C — qizil (`bg-red-100 text-red-800`)

**Design tokens:** `var(--ep-*)` ishlatish shart, inline `style={{color:'#xxx'}}` TAQIQ (Qoida 21).
**Sababa:** `EmployeeRating.tsx` hozir `@deprecated`, faqat GET, 4-faktor — TO'LIQ QAYTA YOZILADI (Q-46: buzuq/stub kod to'liq o'chiriladi).

---

### QADAM 14 — `HROnboarding.tsx` va `HROnboardingDialogs.tsx` yangilash

**Fayl 1:** `artifacts/erp-dashboard/src/pages/HROnboarding.tsx`

Mavjud sahifaga quyidagilarni QO'SH (mavjud kodlarni O'CHIRMA — Q-46):

```typescript
// Mentor tayinlash mutation
const assignMentorsMutation = useMutation({
  mutationFn: (data: { employeeId: number; adaptationMentorId?: number; professionalMentorId?: number }) =>
    apiRequest('POST', `/api/hr/onboarding/employees/${data.employeeId}/mentors`, data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['/api/hr/onboarding/employees'] });
    toast({ title: 'Mentorlar tayinlandi', variant: 'default' });
  },
  onError: () => toast({ title: 'Mentor tayinlashda xatolik', variant: 'destructive' }),
});

// NDA imzolash mutation
const signNdaMutation = useMutation({
  mutationFn: (data: { employeeId: number; type: 'onboarding' | 'annual' | 'change' }) =>
    apiRequest('POST', '/api/hr/onboarding/nda', data),
  onSuccess: () => {
    toast({ title: 'NDA imzolandi', variant: 'default' });
  },
  onError: () => toast({ title: 'NDA imzolashda xatolik', variant: 'destructive' }),
});
```

Sahifaga yangi `Tab` qo'sh: `"Mentor tayinlash"` — yangi xodimlar ro'yxati + mentor tayinlash tugmasi.

**Fayl 2:** `artifacts/erp-dashboard/src/pages/HROnboardingDialogs.tsx`

Mavjud `CreateOnboardingDialog` ni saqlagan holda `AssignMentorsDialog` qo'sh:

```typescript
interface AssignMentorsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: number;
  onSubmit: (data: { adaptationMentorId?: number; professionalMentorId?: number }) => void;
  isPending: boolean;
}

export function AssignMentorsDialog({...}: AssignMentorsDialogProps) {
  // adaptationMentorId, professionalMentorId numberInput'lar
  // kamida bittasi kiritilishi shart (Zod bilan tekshiriladi)
  // "Tayinlash" tugmasi (o'ngda, "Bekor" chapda — Q-41)
}
```

---

## 5. DDL (GATED)

**DDL fayllar YOZILDI lekin ISHGA TUSHIRILMAYDI** egasi ruxsatisiz.

### Migration 1: `hr-rating-7factor-2026-06-19.sql`
Quyidagi jadvallarni yaratadi:
- `hr_rating_config` — vaznlar + chegara (EP-HR-012)
- `hr_rating_factors` — 7-faktor reyting yozuvi (EP-HR-013)
- `hr_bonus_suggestions` — bonus taklif oqimi (EP-HR-014)
- `referral_bonus_config` — lavozim bo'yicha referral bonus (EP-HR-021)
- `employee_ratings` CHECK — 0–5 dan 0–100 ga o'zgartiriladi

**Tasdiqlash:** `-- APPROVED: <egasi-ismi> <sana>` qatorni migration fayliga qo'shilganda ishga tushiriladi.

### Migration 2: `hr-onboarding-gaps-2026-06-19.sql`
Quyidagi jadvallarni yaratadi:
- `hr_mentor_assignments` — ikki-mentor (EP-HR-018)
- `hr_control_sheet_templates` — shablon (EP-HR-043)
- `hr_control_sheet_records` — xodim yozuvi (EP-HR-044/045/046)
- `hr_nda_records` — NDA imzolash (EP-HR-041)

**Tasdiqlash:** `-- APPROVED: <egasi-ismi> <sana>` qatorni migration fayliga qo'shilganda ishga tushiriladi.

**Egasidan so'raladigan savollar (ruxsat berish uchun):**
1. `employee_ratings.overall_rating` CHECK 0–5 dan 0–100 ga o'zgartirilsin? (Mavjud ma'lumotlar bor bo'lsa 20 ga ko'paytiriladi)
2. `hr_mentor_assignments` — bir xodimga UNIQUE tayinlash (bitta aktiv yozuv) to'g'rimi?
3. `hr_rating_config` standart vaznlari (0.2/0.2/0.2/0.1/0.1/0.1/0.1) to'g'rimi?

---

## 6. QABUL MEZONI

Har bir quyidagi punkt tasdiqlanishi kerak:

### Backend:
- [ ] `npx tsc -p apps/api/tsconfig.json --noEmit` — 0 xato
- [ ] POST `/api/hr/rating` → `hr_rating_factors` ga REAL INSERT
- [ ] GET `/api/hr/rating/config` → `hr_rating_config` dan ma'lumot
- [ ] PATCH `/api/hr/rating/:id/confirm` → status 'confirmed' bo'ladi, qayta o'qilganda saqlanadi
- [ ] PATCH `/api/hr/rating/bonus/:id/confirm` → status 'confirmed'/'rejected' bo'ladi
- [ ] POST `/api/hr/onboarding/employees/:id/mentors` → `hr_mentor_assignments` ga INSERT
- [ ] POST `/api/hr/onboarding/nda` → `hr_nda_records` ga INSERT
- [ ] GET `/api/hr/onboarding/employees/:id/nda` → REAL select

### Cron:
- [ ] `@Cron('0 15 * * 1-6')` — 15:00 eslatma (avval 17:00 edi)
- [ ] `@Cron('0 16 * * 1-6')` — 16:00 absent belgilash (avval 20:00 edi)

### Frontend:
- [ ] `npx tsc --noEmit` (artifacts/erp-dashboard) — 0 xato
- [ ] `EmployeeRating.tsx` — `@deprecated` yo'q, useMutation mavjud (Qoida 19)
- [ ] Reyting kiritish → sahifani yangilaganda ko'rinadi (real saqlangan)
- [ ] Bonus taklif ro'yxati — real GET
- [ ] Mentor tayinlash dialog — real POST

### Vizyon-moslik:
- [ ] 7 ta faktor kiritiladi, jami avtomatik hisoblanadi
- [ ] Chegara A/B/C badge ko'rsatiladi
- [ ] Bonus tasdiqlash — HR/menejer tasdiqlashi kerak (avtomatik emas, EP-HR-014)
- [ ] 2 ta mentor tayinlanadi (adaptatsiya + professional, EP-HR-018)

### Regressiya tekshiruvi (GOLDEN THREAD):
- [ ] `/api/hr/employees` — avval ishlagan, hamon ishlaydi
- [ ] `/api/hr/onboarding/plans` — avval ishlagan, hamon ishlaydi
- [ ] `/api/hr/onboarding-checklists` — avval ishlagan, hamon ishlaydi
- [ ] Payroll GL — TEGILMAGAN (PayrollService/PayrollClosureService)
- [ ] bash scripts/reviewer-result-pattern.sh — FAIL: 0

---

## 7. SELF-VERIFY

### 7.1 TypeScript tekshiruvi:
```bash
# Backend
npx tsc -p Uzbek-Language-Module/apps/api/tsconfig.json --noEmit 2>&1 | grep -E "error|Error" | head -20

# Frontend
npx tsc --noEmit -p Uzbek-Language-Module/artifacts/erp-dashboard/tsconfig.json 2>&1 | grep "error" | head -20
```

### 7.2 DB-proof (migration ishga tushirilgandan keyin):
```sql
-- Konfiguratsiya mavjudmi?
SELECT id, threshold_a, threshold_b, w_norma, w_davomat, is_active
FROM hr_rating_config WHERE is_active = TRUE;

-- Test reyting yoz:
INSERT INTO hr_rating_factors (
  employee_id, period_year, period_month,
  norma_percent, davomat_score, sifat_score, staj_score,
  intizom_score, ozaro_baho_score, ai_kpi_score,
  total_score, rating_class, status
) VALUES (
  1, 2026, 6,
  95.0, 98.0, 90.0, 80.0, 95.0, 85.0, 88.0,
  91.5, 'A', 'draft'
) RETURNING id, total_score, rating_class;

-- Qayta o'qi (saqlanganmi?):
SELECT id, employee_id, period_year, period_month, total_score, rating_class, status
FROM hr_rating_factors WHERE employee_id = 1 AND period_year = 2026 AND period_month = 6;

-- Bonus taklif avtomatik yaratiladimi?
SELECT id, employee_id, suggested_bonus_pct, status
FROM hr_bonus_suggestions WHERE employee_id = 1 AND period_year = 2026;

-- NDA tekshiruvi:
INSERT INTO hr_nda_records (employee_id, nda_version, type, signed_by)
VALUES (1, '1.0', 'onboarding', 1) RETURNING id, signed_at, type;

-- Mentor tayinlash:
INSERT INTO hr_mentor_assignments (employee_id, adaptation_mentor_id, professional_mentor_id)
VALUES (1, 2, 3) RETURNING id, employee_id, adaptation_mentor_id, professional_mentor_id;
```

### 7.3 API probe (backend ishga tushirilgandan keyin):
```bash
# Token olish (test user bilan)
TOKEN=$(curl -s -X POST http://localhost:3030/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"..."}' | jq -r '.access_token')

# Config
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3030/api/hr/rating/config | jq .

# Reyting yaratish
curl -s -X POST http://localhost:3030/api/hr/rating \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"employeeId":1,"periodYear":2026,"periodMonth":6,"normaPercent":95,"davomatScore":98,"sifatScore":90,"stajScore":80,"intizomScore":95,"ozaroBahoScore":85,"aiKpiScore":88}' | jq .

# Bonus takliflari
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3030/api/hr/rating/bonus/pending | jq .

# Mentor tayinlash
curl -s -X POST http://localhost:3030/api/hr/onboarding/employees/1/mentors \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"adaptationMentorId":2,"professionalMentorId":3}' | jq .

# NDA imzolash
curl -s -X POST http://localhost:3030/api/hr/onboarding/nda \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"employeeId":1,"type":"onboarding","ndaVersion":"1.0"}' | jq .
```

### 7.4 Cron tekshiruvi:
```bash
# Cron qiymatlari to'g'rimi?
grep -n "@Cron" Uzbek-Language-Module/apps/api/src/modules/hr/daily-report/daily-report.service.ts
# Kutilayotgan natija:
# 179: @Cron('0 15 * * 1-6')   ← eslatma 15:00
# 205: @Cron('0 16 * * 1-6')   ← absent belgilash 16:00
```

### 7.5 Reviewer skriptlar:
```bash
bash Uzbek-Language-Module/scripts/reviewer-result-pattern.sh 2>&1 | tail -5
bash Uzbek-Language-Module/scripts/reviewer-array-safety.sh 2>&1 | tail -5
bash Uzbek-Language-Module/scripts/reviewer-as-unknown.sh 2>&1 | tail -5
```

---

## 8. COMMIT

**Commit tartib va aniq fayllar:**

### COMMIT 1 — Schema va migration fayllar:
```bash
git add \
  Uzbek-Language-Module/lib/db/src/schema/hr-rating.ts \
  Uzbek-Language-Module/lib/db/src/schema/hr-onboarding-extended.ts \
  Uzbek-Language-Module/apps/api/src/shared/db/migrations/hr-rating-7factor-2026-06-19.sql \
  Uzbek-Language-Module/apps/api/src/shared/db/migrations/hr-onboarding-gaps-2026-06-19.sql

git commit -m "P27: HR 7-factor rating schema + onboarding gaps DDL [GATED]"
```

### COMMIT 2 — Rating modul (controller/service/repo/dto):
```bash
git add \
  Uzbek-Language-Module/apps/api/src/modules/hr/rating/hr-rating.controller.ts \
  Uzbek-Language-Module/apps/api/src/modules/hr/rating/hr-rating.service.ts \
  Uzbek-Language-Module/apps/api/src/modules/hr/rating/hr-rating.repository.ts \
  Uzbek-Language-Module/apps/api/src/modules/hr/rating/dto/hr-rating.dto.ts

git commit -m "P27: HR rating module — 7-factor CRUD, bonus suggestion flow (EP-HR-012/013/014)"
```

### COMMIT 3 — HR module wiring + cron fix:
```bash
git add \
  Uzbek-Language-Module/apps/api/src/modules/hr/hr.module.ts \
  Uzbek-Language-Module/apps/api/src/modules/hr/hr.providers.ts \
  Uzbek-Language-Module/apps/api/src/modules/hr/daily-report/daily-report.service.ts

git commit -m "P27: hr.providers + HrRatingController wired; cron deadline 16:00 (EP-HR-006)"
```

### COMMIT 4 — Onboarding service/controller (mentor + NDA):
```bash
git add \
  Uzbek-Language-Module/apps/api/src/modules/hr/onboarding/onboarding.service.ts \
  Uzbek-Language-Module/apps/api/src/modules/hr/onboarding/onboarding.controller.ts

git commit -m "P27: onboarding service — dual-mentor assignMentors, NDA signNda endpoints (EP-HR-018/041)"
```

### COMMIT 5 — Frontend:
```bash
git add \
  Uzbek-Language-Module/artifacts/erp-dashboard/src/pages/EmployeeRating.tsx \
  Uzbek-Language-Module/artifacts/erp-dashboard/src/pages/HROnboarding.tsx \
  Uzbek-Language-Module/artifacts/erp-dashboard/src/pages/HROnboardingDialogs.tsx

git commit -m "P27: EmployeeRating 7-factor UI (useMutation, Qoida19); HROnboarding mentor/NDA dialogs"
```

**ESLATMA:** `git add -A` TAQIQ (Q-8, Qoida 8).
Faqat yuqorida ko'rsatilgan aniq fayllarni qo'sh.

---

## APPENDIX A — Edge-holatlar

| Holat | Xatti-harakat |
|-------|---------------|
| Tasdiqlangan reyting qayta o'zgartirilmoqda | 400 + "Tasdiqlangan reyting o'zgartirilmaydi" |
| Barcha 7 faktor berilmagan | Mavjud qiymatlar 0 deb hisoblanadi; total_score hisob qilinadi |
| Config vaznlari jami 1.0 emas (Zod validate) | 400 + "Barcha 7 vazn jami 1.0 bo'lishi kerak" |
| Xodim 2 marta NDA imzolaydi (bir turda) | Har safar yangi yozuv — tarixi saqlanadi |
| Mentor sifatida o'zi tayinlansa | Imlo: adaptationMentorId !== employeeId tekshiruvi qo'sh |
| Payroll GL | TEGILMAYDI — P24/P25 FIN tomonidan boshqariladi |

## APPENDIX B — Vizyon qoidalar (EP kodi bilan)

| Kod | Qoida | Ushbu paketda qayerda |
|-----|-------|-----------------------|
| EP-HR-006 | 16:00 deadline — topshirilmasa o'sha kun hisoblanmaydi | QADAM 11 (cron) |
| EP-HR-012 | Chegara SOZLANUVCHI (A=85+/B=70-84/C<70) | `hr_rating_config` + QADAM 7 |
| EP-HR-013 | 7-faktor reyting yozuvi | `hr_rating_factors` + QADAM 6-8 |
| EP-HR-014 | Tizim bonus TAKLIF → HR/menejer TASDIQLAYDI → Payroll | `hr_bonus_suggestions` + QADAM 7 |
| EP-HR-018 | Ikki-mentor (adaptatsiya + professional) | `hr_mentor_assignments` + QADAM 9-10 |
| EP-HR-019 | Mentor amaliy vazifalarni ERP da tasdiqlaydi | `hr_control_sheet_records.mentor_confirmed` |
| EP-HR-021 | Referral bonus lavozim bo'yicha sozlanuvchi | `referral_bonus_config` |
| EP-HR-041 | NDA onboarding + har yil + o'zgarishda | `hr_nda_records` + QADAM 9-10 |
| EP-HR-043 | Instruksiya to'plami shabloni (karta bo'yicha) | `hr_control_sheet_templates` |
| EP-HR-044 | Nazorat varaqasi xodim yozuvi | `hr_control_sheet_records` |
| EP-HR-045 | Mentor tasdiqi + mini-test | `hr_control_sheet_records.mentor_confirmed` |
| EP-HR-046 | Case-study oxirgi vazifa → adaptatsiya o'tganiga ta'sir | `hr_control_sheet_records.case_study_comment` |

## APPENDIX C — Payroll GL chegarasi (Q-46 + DontTouch)

Quyidagi fayllar bu paketda TEGILMAYDI:
- `apps/api/src/modules/hr/payroll/payroll.service.ts`
- `apps/api/src/modules/hr/payroll/payroll-closure.service.ts`
- `apps/api/src/modules/finance/` (barcha fayllar)
- GL entries yozish — P24/P25 FIN paketigadir

Bonus taklifi (`hr_bonus_suggestions`) yaratiladi, lekin PAYROLL GA YOZILMAYDI.
Payroll integratsiya = P24/P25 FIN paketi ishi (bu paket faqat `hr_bonus_suggestions.status='confirmed'` qiladi).
