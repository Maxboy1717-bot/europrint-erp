# MODUL 11 — HR (Kadrlar) — TO'LIQ TAHLIL (egasi uchun sodda tilda)
> Sana: 2026-06-03 | TAHLILCHI (Agent 2) | FAQAT O'QIDIM — hech narsa o'zgartirmadim
> Eng katta modul (210 vizyon javobi). Hududlar bo'yicha guruhlangan. Dalil (fayl:qator) qavs ichida.

> **Bu modul nima:** 400+ xodim, 30+ bo'lim uchun odamlar tizimi — xodim yozuvlari, tashkiliy sxema
> (kim kimga bo'ysunadi), davomat, ta'til, oylik, ishga olish (vakansiya→nomzod), samaradorlik, o'qitish.

> ⭐⭐ **BIR JUMLALI XULOSA:** HR — katta va asosan ISHLAYDIGAN modul (xodim, org-sxema, ta'til,
> ishga olish, PIP, onboarding/offboarding REAL). LEKIN ko'p joyda BO'LINISH bor (3 davomat jadvali,
> 2 oylik, 2 ta'til) va zanjirlar uzilgan (davomat→oylik, oylik→moliya ulanmagan). Asoslar mustahkam,
> lekin qismlar bir-biriga to'liq ulanmagan.

> **DB holati:** employees=**30**, org_departments=**142** (DATA bor!); lekin davomat/oylik/ta'til jadvallari
> deyarli BO'SH (qurilish bosqichi).

---

# HUDUD 1 — XODIM YOZUVLARI + ORG-SXEMA 🟢🟡

**Sahifalar:** Employees (/employees), EmployeeProfile (/employees/:id), OrgStructureHierarchy (/org-structure/hierarchy), OrgDepartmentsPage, OrgNodeDetail, HRMap (/hr-map), EmployeeFilesPage.

**Nima ishlaydi (REAL):**
- Xodim ro'yxati + kartochka (16 ichki bo'lim: pasport, manzil, oila, jarima, ta'til...) → **REAL CRUD** (hr-employees.controller.ts:49; employees-compat-sub.controller.ts real INSERT). 30 xodim jonli.
- Tashkiliy daraxt → **REAL** (142 bo'lim, daraxt tuzilgan, org-structure.controller.ts:86).
- Maosh ko'rib chiqish → **REAL** (tranzaksiyali, hr-employees.controller.ts:183).

**⭐ ORG-SXEMA "kim kimga bo'ysunadi" — muhim nuance:**
- `employees.manager_id` = 30/30 BO'SH — LEKIN bu **o'lik ustun**, org-sxema buni ishlatmaydi. Rahbar `org_departments` daraxti + `head_user_id` orqali topiladi (org-queries.repo.ts:190).
- **Asl muammo:** bo'lim rahbari faqat **18/142 bo'limda** tayinlangan. Daraxt ulangan, lekin **87% bo'limda rahbar ko'rsatilmagan** → ko'p bo'lim uchun "to'g'ridan-to'g'ri rahbar" topilmaydi.

**🔴 FAYL YUKLASH BUZUQ:**
- Xodim hujjati/shartnoma yuklash → FE fayl yuboradi (`POST /api/employees/:id/files`), lekin **bu manzilda backend tugmasi YO'Q** (faqat GET/DELETE, employees-compat-sub.controller.ts:168). Yuklash 404 → fayl saqlanmaydi.
- "Profil rasm" ham faqat tayyor URL qabul qiladi (binary fayl emas, hr-employees-ext.controller.ts:42).

**Vizyon: ~75%.** **Foydalanuvchi nima qila olmaydi:** Xodim hujjati/shartnoma faylini yuklay olmaydi (tugma bor, backend yo'q); ko'p bo'limda org-sxemada rahbar ko'rsatilmagan.

---

# HUDUD 2 — DAVOMAT 🟡 (kod real, lekin 3 olam + oylikка ulanmagan)

**Sahifalar:** AttendancePage (/daily-attendance), AttendanceMonitorPage (/attendance-monitor), EmployeeProductivityPage, EmployeeTrackingReport, camera-employee-ratings.

**⭐ Eski "davomat soxta (Date.now)" da'vosi TUZATILGAN** — endi haqiqiy yozadi (legacy-attendance.helpers.ts:96).

**⚠️ 3 ta ALOHIDA davomat olami (har biri real, lekin har xil jadvalga):**
| Sahifa | Jadval | Holat |
|---|---|---|
| AddAttendanceDialog | attendance_records | REAL |
| HRDashboard check-in | attendance | REAL |
| EmployeeTrackingReport | employee_daily_kpi | REAL |
| AttendanceMonitorPage "jonli" | — | 🔴 endpoint YO'Q (`/hr/attendance/live` yo'q → 404) |

**🔴 ZANJIR — Davomat → Oylik ULANMAGAN:** Oylik hisoblash davomatni (ishlangan soat) **o'qimaydi** — standart `monthlyHours` ishlatadi, `attendanceConfidence:50` qattiq yozilgan (finance-extended-payroll.service.ts:289,355). Xodim kech kelsa/kelmasa, oyligi avtomatik kamaymaydi.

**Vizyon: ~40%.** **Foydalanuvchi nima qila olmaydi:** Jonli davomat ko'rinishi ishlamaydi; davomat oylikni avtomatik hisoblamaydi (qo'lda); qaysi jadval "haqiqiy" davomat ekani noaniq (3 ta).

---

# HUDUD 3 — OYLIK 🟡 (2 parallel olam, GL-ulanish sim yo'q)

**Sahifalar:** PayrollAutomation (/accounting/payroll-automation), EmployeeDailyKPIPanel.

**Nima ishlaydi (REAL):**
- Oylik hisoblash/run/tasdiqlash → **REAL** (FinanceExtendedPayrollService, payroll_calculations, idempotent).

**🔴 2 ESKI DA'VO TUZATILDI:**
1. **INPS/JSHD HISOBLANMAYDI** (eski "INPS/JSHD real" XATO) — bu **ataylab gross-only** (soliq 1C'da hisoblanadi, finance-extended-payroll.service.ts:17). ⚠️ Controller izohi hali "real INPS/JSHD" deydi — bu yolg'on/eskirgan izoh.
2. **`payroll_contracts` = 0** → "Hisoblash" tugmasi 0 ta xodimni qayta ishlaydi (xato bermaydi, natija bo'sh).

**⭐ ZANJIR — Oylik → Moliya (GL):**
- **Foydalanuvchi yo'li** (`/finance-extended/payroll/run`) → GL'ga **O'TMAYDI** (faqat payroll_calculations).
- **Alohida HR yopish yo'li** (`/hr/payroll/closure/.../close`) → GL'ga **REAL O'TADI** (gl_journal_entries insert, drizzle-hr-payroll.repo.ts:97) — LEKIN **FE buni chaqirmaydi** (FE `/hr/payroll/lock` chaqiradi, u yo'q). Kod tayyor, sim ulanmagan.

**Vizyon: ~55%.** **Foydalanuvchi nima qila olmaydi:** Oylikni moliyaga avtomatik o'tkaza olmaydi; shartnomasiz "Hisoblash" hech narsa chiqarmaydi; INPS/JSHD bu yerda yo'q.

---

# HUDUD 4 — TA'TIL / DAM OLISH 🟢 (yaratish+balans real, tasdiq tugmasi yo'q)

**Sahifalar:** HRVacationSick (/hr/vacation-sick), HRBirthdays (/hr/birthdays).

**Nima ishlaydi (REAL):**
- Ta'til so'rovi yaratish → **REAL** (29 qator jonli, drizzle-leave.repo.ts:68). Balans (24 kundan ayirib) real. Tug'ilgan kunlar real.
- Tasdiqlash/rad backend bor (hr-leave.controller.ts:115 real UPDATE).

**🔴 Muammolar:**
- **HRVacationSick sahifasida "Tasdiqlash" tugmasi YO'Q** — sahifa faqat holatni ko'rsatadi. Tasdiq boshqa kontrollerda, sahifa uni chaqirmaydi → tasdiq faqat Telegram/admin orqali.
- **2 ta'til jadvali** (leave_requests=0, hr_leave_requests=29) — bo'linish.

**Vizyon: ~75%.** **Foydalanuvchi nima qila olmaydi:** Ta'til so'rovini bu sahifadan tasdiqlay olmaydi (tugma yo'q).

---

# HUDUD 5 — ISHGA OLISH (recruitment) 🟡 (yadro real, periferiya soxta)

**Sahifalar:** CandidatesPage, RecruitingKanban (/hr/recruiting), RecruiterKPIPage, ReferralPage, HROnboarding, HROffboarding, HRAlumni, CandidateReport.

**Nima ishlaydi (REAL):**
- Pipeline/nomzod/bosqich ko'chirish → **REAL** (candidates 11, funnels 11). Vakansiya yaratish, referral (15), onboarding (boy: reja/progress/probation/buddy), offboarding (case/checklist/exit-interview) — hammasi REAL.

**🔴 Soxta tugmalar:**
- Vakansiya yaratishda **maosh/tur/muddat SAQLANMAYDI** — controller o'zi tan oladi (hr-vacancies.controller.ts:177).
- Echo tugmalar (DB yozmaydi): kanal sozlash, portret, market-tahlil (hr-vacancies.controller.ts:229,242,252).

**⭐ ZANJIR Q172 (vakansiya → marketing kanali): ~30%** (eski "0%" yaxshilangan):
- Telegram boomerang REAL — vakansiya e'lon qilinganda eski nomzodlarga haqiqiy Telegram DM + SMS (telegram-bots-cron-recruitment.service.ts:94).
- LEKIN **ommaviy kanalga** (LinkedIn/HH.uz/ochiq Telegram) avtomatik joylash YO'Q (API kreds yo'q, hr-vacancies.service.ts:136).

**Vizyon: ~65%.** **Foydalanuvchi nima qila olmaydi:** Vakansiyani LinkedIn/HH.uz'ga avtomatik joylay olmaydi; vakansiya maoshini saqlay olmaydi.

---

# HUDUD 6 — SAMARADORLIK / BAHOLASH 🟡 (PIP real, eNPS buzuq)

**Sahifalar:** HRPip (/hr/pip), HREnps (/hr/enps), HRGamification, HRMilestones, HRCareerPath, HRSuccessionPlanning, HRCapitalTests.

**Nima ishlaydi (REAL):**
- **PIP** (yaxshilash rejasi) → **REAL** (4 reja, yaratish/qabul/progress). eNPS so'rovnoma yaratish/yopish → real.
- ⭐ **Xavfsizlik TUZATILGAN:** PIP/eNPS endi `@Roles` HR bilan himoyalangan (pip.controller.ts:40) — eski "@Roles yo'q" eskirgan. Oddiy manager maxfiy PIP'ni ko'ra olmaydi.

**🔴 eNPS javob BUZUQ:** Xodim ball yuborganda **survey_id=0 qattiq yozilgan** (enps.controller.ts:89) → ball saqlanadi, lekin hech qaysi so'rovnomaga ulanmaydi (yetim yozuv). eNPS natijasini so'rovnoma bo'yicha hisoblab bo'lmaydi.

**🟡 Read-only sahifalar:** Gamification, Milestones, CareerPath, Alumni — hech narsa saqlamaydi (faqat dashboard).

**Vizyon: ~55%.** **Foydalanuvchi nima qila olmaydi:** eNPS natijasini ishonchli tahlil qila olmaydi (survey_id=0); 4 sahifada hech narsa yarata olmaydi.

---

# HUDUD 7 — O'QITISH (LMS bog'lanishi) 🟡 (faqat o'qish)

**Sahifalar:** HRLMSSkills (/integration/hr-lms), HRBrandPage.

**Nima ishlaydi:** HR↔LMS ko'prik bor, lekin **faqat O'QISH** — ko'nikma kamomadi, muddati tugayotgan sertifikatlar (integration-extended-hr.controller.ts:37).

**⭐ ZANJIR (O'qitish → LMS): ~25%** — ko'nikma kamomadidan kursga avtomatik **yozish (enroll) YO'Q** (drizzle-hr-base.repo.ts:105 "mapping unknown, safe 0"). Tizim "ko'nikma yetishmayapti" deydi, lekin kursga biriktirmaydi.

**Vizyon: ~25%.** **Foydalanuvchi nima qila olmaydi:** Ko'nikma kamomadidan xodimni avtomatik kursga yoza olmaydi (qo'lda LMS'da).

---

# UMUMIY XULOSA

## Hudud jadvali
| Hudud | Holat | Vizyon% | Asosiy muammo |
|---|---|---|---|
| 1. Xodim + Org | 🟢/🟡 | 75 | Fayl yuklash yo'q; rahbar 18/142 |
| 2. Davomat | 🟡 | 40 | 3 jadval; oylikka ulanmagan |
| 3. Oylik | 🟡 | 55 | GL-ulanish sim yo'q; 2 olam |
| 4. Ta'til | 🟢 | 75 | tasdiq tugmasi yo'q; 2 jadval |
| 5. Ishga olish | 🟡 | 65 | vakansiya periferiyasi echo |
| 6. Samaradorlik | 🟡 | 55 | eNPS buzuq; 4 read-only |
| 7. O'qitish→LMS | 🟡 | 25 | faqat o'qish, enroll yo'q |

**Jami: 2 🟢 · 5 🟡 · 0 🔴 → taxminan ~58% haqiqatan ishlaydi.** (Eng katta modul, asoslar real, lekin bo'linish va uzilgan zanjirlar ko'p.)

## ⭐ ZANJIR MUAMMOLARI (sodda)
| Zanjir | Holat |
|---|---|
| **Davomat → Oylik** | 🔴 ULANMAGAN (oylik davomatni o'qimaydi) |
| **Oylik → Moliya (GL)** | 🟡 KOD REAL, FE SIM YO'Q (yopish yo'li GL yozadi, lekin FE chaqirmaydi) |
| **Vakansiya → Marketing (Q172)** | 🟡 ~30% (Telegram DM real, ommaviy kanal yo'q) |
| **O'qitish → LMS** | 🟡 ~25% (o'qiydi, auto-enroll yo'q) |

## DB MUAMMOLARI (sodda)
- ⚠️ **3 davomat jadvali** (attendance/attendance_records/employee_daily_kpi) — kanonik tanlanmagan
- ⚠️ **2 oylik jadvali** (payroll_calculations/payroll) + **2 ta'til jadvali** (leave_requests/hr_leave_requests)
- ❌ Xodim-fayl yuklash backend tugmasi yo'q (POST /employees/:id/files)
- ❌ `/hr/payroll/lock`, `/hr/attendance/live` — FE chaqiradi, BE'da yo'q (404)
- ⚠️ `org_departments.head_user_id` faqat 18/142; `employees.manager_id` o'lik ustun (30/30 NULL)
- 🐛 eNPS respond survey_id=0 (yetim yozuv)

## ⭐ ENG MUHIM 5 MUAMMO (egasi birinchi shularni hal qilsin)
1. 🔴 **Davomat → Oylik ulanmagan** — ish vaqti oylikni avtomatik hisoblamaydi (zavod uchun muhim)
2. 🟡 **Oylik → Moliya sim yo'q** — oylik buxgalteriyaga avtomatik o'tmaydi (kod tayyor, ulash kerak)
3. ⚠️ **Ko'p bo'linish** — 3 davomat + 2 oylik + 2 ta'til jadvali (qaysi haqiqiy noaniq)
4. 🔴 **Fayl yuklash yo'q** — xodim hujjati/shartnoma yuklab bo'lmaydi
5. 🐛 **eNPS buzuq + vakansiya maoshi saqlanmaydi** — kichik, lekin aldamchi

---

## XULOSA (egasiga)
HR — eng katta va asosan **ishlaydigan** modul: xodim yozuvlari, org-sxema (142 bo'lim), ta'til, ishga olish (pipeline/onboarding/offboarding), PIP — bularning hammasi haqiqatan ishlaydi va data bor (30 xodim, 142 bo'lim). Xavfsizlik (PIP/eNPS) ham tuzatilgan.

LEKIN ikki muammo bor: (1) ko'p joyda **bir narsa uchun 2-3 jadval** (davomat, oylik, ta'til) — qaysi haqiqiy ekani chalkash; (2) **zanjirlar uzilgan** — davomat oylikni hisoblamaydi, oylik moliyaga o'tmaydi, vakansiya ommaviy kanalga joylanmaydi.

Metafora: bu — katta, yaxshi jihozlangan idora. Har xona (xodim, ta'til, ishga olish) alohida ishlaydi. Lekin xonalar orasidagi quvurlar ulanmagan — davomat xonasidagi soat oylik xonasiga, oylik xonasidagi raqam buxgalteriyaga o'z-o'zidan oqmaydi.

> Hech narsa o'zgartirmadim (faqat o'qidim). Yagona yozuv: bu hujjat. Tuzatish — Agent 1 (keyin), egasi qaroridan so'ng.
