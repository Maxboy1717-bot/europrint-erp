# EUROPRINT ERP — VIZYON-TASDIQ (Egasi intervyu+rejalari, har nuqta SAVOL + jonli javob)

> Egasi: "mani intervyularim va rejalarni hammasini qayta savol qilib bering — loyihada shundaymi yo'qmi".
> Manba = egasining O'Z javoblari (vision-1000-answers/01..20 + decisions + intervyular). Har javob JONLI tekshirilgan (kod + DB q.cjs, Q-29). Soxta yo'q (Q-40).
> Sana: 2026-06-27. Jami savol: 419. O'rtacha vizyon-moslik: **56%**.

**Belgilar:** ✅ bor (to'liq jonli) · 🟡 qisman (struktura bor, data/oqim yetishmaydi) · ❌ yo'q (umuman yo'q) · 🔑 egasi-data (kod tayyor, qiymat kutadi)

**Yig'indi:** ✅ 103  ·  🟡 196  ·  ❌ 98  ·  🔑 22

---

## MODUL-JADVAL (umumiy)

| # | Modul | Vizyon% | ✅ | 🟡 | ❌ | 🔑 | Savol |
|---|---|---|---|---|---|---|---|
| 01 | Org / Kartalar (karta-markazlilik) | 37% | 1 | 10 | 7 | 2 | 20 |
| 02 | HR / Xodim-karta | 62% | 4 | 14 | 3 | 2 | 23 |
| 03 | Finance / GL / Kassir | 68% | 9 | 10 | 0 | 1 | 20 |
| 04 | Coordination / Council | 52% | 6 | 11 | 7 | 1 | 25 |
| 05 | Director / Hisobot / Holat | 62% | 5 | 10 | 2 | 4 | 21 |
| 06 | SD / Sotuv-buyurtma | 62% | 8 | 9 | 6 | 1 | 24 |
| 07 | PP / Rejalashtirish | 52% | 4 | 14 | 3 | 1 | 22 |
| 08 | MES / Ishlab chiqarish | 62% | 7 | 10 | 3 | 0 | 20 |
| 09 | QC / Sifat | 58% | 5 | 11 | 5 | 1 | 22 |
| 10 | Warehouse / Ombor | 62% | 7 | 8 | 1 | 1 | 17 |
| 11 | MM / Material master | 52% | 2 | 11 | 5 | 1 | 19 |
| 12 | LMS / Darslik | 62% | 5 | 10 | 1 | 0 | 16 |
| 13 | CRM | 62% | 6 | 8 | 5 | 0 | 19 |
| 14 | Marketing | 62% | 7 | 6 | 5 | 2 | 20 |
| 15 | Kanban / Vazifa | 34% | 1 | 10 | 11 | 1 | 23 |
| 16 | IoT / Telemetriya | 52% | 5 | 12 | 5 | 1 | 23 |
| 17 | AI / Aisha | 68% | 8 | 7 | 3 | 1 | 19 |
| 18 | Notifications / Botlar | 42% | 2 | 5 | 10 | 1 | 18 |
| 19 | POS / Kassa-monitor | 58% | 4 | 11 | 9 | 1 | 25 |
| 20 | CC / Hujjat-shartnoma | 52% | 7 | 9 | 7 | 0 | 23 |

---

## 01 — Org / Kartalar (karta-markazlilik)  (vizyon 37%, 20 savol)

> Egasining karta-markazli vizyoni POYDEVOR darajasida real: node=karta yagona faol manba (org_departments=145, 7-qatlam), razryad master-data CRUD (razryad_levels=6), 1-seat guard, soft-delete, interaktiv daraxt+drag-reparent, vertikal approval-chain, create-cascade (ombor+RBAC), Excel/PDF eksport, AiFitService markaziy AI (jonli), 4-bosqichli payout-approval — barchasi jonli ishlaydi. SESSIYADAN BERI ILGARILAGAN (2026-06-25 auditdan keyin): users.card_id ustuni qo'shildi, login card-gate QURILDI (resolveCardGate+blok mantiq, lekin CARD_LOGIN_GATE_ENABLED='true' bilan, default OFF), razryad_history+card_templates jadvallari yaratildi, payroll computeGatedMonthlySalary (LMS-gate+ЦКП-gate kartaga ulangan) yozildi. AMMO vizyonning eng chuqur qatlamlari hamon YO'Q yoki ULANMAGAN: (1) karta-oylik gated formula ORPHAN — hech bir endpoint chaqirmaydi, jonli payroll razryad-koeffdan nariga o'tmaydi; (2) razryad o'sish/pasayish EXECUTION (imtihon→tasdiq→o'zgarish) yo'q, razryad_history 0 qator; (3) ЦКП avto-tizimi (AI-bot kunlik savol, IoT/MES feed, kaskad-agregat) deyarli butunlay yo'q (ckp_fact_values 0, ai_ckp_scores 0); (4) YAGONA DDL emas — org_departments(145)+org_functions(97)+departments(18)+positions(96) parallel base jadvallar, payroll/RBAC eski org_functions'ga keyed; (5) 5-holat lifecycle/muzlatish/merge/split/shablon-import yo'q. Eng katta DATA-bo'shliq: razryad_level_id 1/145, tskp_measurement_unit 0/145, salary_type 0/145, head_user_id 18/145 — egasi qiymat kiritmaguncha karta-oylik ishlamaydi.

**01.1  🟡 qisman**  — ❓ Siz 'kartaga bog'lanmagan xodim ERPga kira olmaydi (card_id NULL → login yo'q)' dedingiz — bu bloklash hozir ishlayaptimi?
- Siz: Karta = master-data; butun ERP card_id orqali ulanadi (EP-ORG-001)
- Isbot: org_departments=145 (q.cjs node_type: position 93/department 20/otdeleniye 14/director 11/section 5/ceo 1/owner 1) faol manba; 28 jadval FK qiladi. AMMO org_functions(97)+departments(18)+positions(96) parallel base jadval (pg_class relkind='r' hammada) — yagona DDL emas.

**01.2  🔑 egasi-data**  — ❓ 
- Siz: card_id NULL → login YO'Q (qattiq tartib, EP-ORG-003)
- Isbot: login.service.ts:126-133 resolveCardGate+blok mantiq QURILGAN (NO_ACTIVE_CARD), lekin :127 CARD_LOGIN_GATE_ENABLED flag default OFF; users.card_id ustuni bor (q.cjs) lekin 1/32 to'lgan. Yoqish=egasi HR-binding qurgach.

**01.3  ❌ yo'q**  — ❓ 
- Siz: card_id NULL → oylik YO'Q (EP-ORG-003 oylik-gate)
- Isbot: payroll.service.ts computeGatedMonthlySalary (LMS+ЦКП gate kartaga ulangan) yozilgan-u, lekin :502 izoh 'hech qaysi endpoint/servisdan CHAQIRILMASdi (orphan)'; controller'da grep computeAllGatedForPeriod=0. Jonli closePeriod xom base_salary yig'adi.

**01.4  🟡 qisman**  — ❓ 
- Siz: Oylik kartadan; ko'p-karta yig'indi; salary_type kartada (EP-ORG-024/142)
- Isbot: Sxema bor (org_departments.salary_type/min/max/bonus_config) + FORMULA A SUM jonli render (card.repository.ts:344 employeeSalaryTotal). AMMO salary_type 0/145 to'lgan (q.cjs); calculate-payroll.handler baseSalary param'dan hisoblaydi, kartadan emas; ishbay/soatbay farqlanmaydi.

**01.5  ✅ bor**  — ❓ 
- Siz: Razryad master-data, qo'lda sozlanadi (EP-ORG-009)
- Isbot: razryad.controller/repository real CRUD + RazryadFormDialog/RazryadLevelsPanel FE; razryad_levels=6 qator (q.cjs, level 1-6 coeff 1.00-2.80); org ichida tab+badge (alohida Razryadlar sahifasi yo'q — Q-RAZRYAD-INSIDE-ORG mos).

**01.6  ❌ yo'q**  — ❓ 
- Siz: Razryad o'sish EXECUTION: imtihon→2-imzo→o'zgarish (EP-ORG-010)
- Isbot: razryad_history jadval endi YARATILGAN (to_regclass non-null) lekin 0 qator; imtihon→tasdiq→razryad-UPDATE zanjiri grep=0; razryad faqat qo'lda PATCH bilan o'zgaradi (tasdiqsiz); ai_exam grading score NULL.

**01.7  ❌ yo'q**  — ❓ 
- Siz: Razryad pasayish + appeal + freeze (EP-ORG-012/Q9)
- Isbot: Demotion/downgrade BE+FE grep=0; GradeDowngraded event EVENT_KATALOGI'da yo'q; e'tiroz (5 kun)+muzlatish mantiq yo'q. Faqat node PATCH har qiymatga (tasdiq-zanjirsiz).

**01.8  ❌ yo'q**  — ❓ 
- Siz: ЦКП kartada + AI-bot kunlik savol + IoT/MES avto-feed (EP-ORG-014/016/017)
- Isbot: tskp matn+SON/FOIZ/VAQT enum sxema bor, lekin tskp_measurement_unit 0/145 (q.cjs); ai_ckp_chat_logs jadval bor 0 qator+unwired; ckp_fact_values 0 qator; operator-hourly-invoice.cron UNREGISTERED + pp_production_facts yo'q; kaskad CkpReported grep=0. Mavzu jonli ~12%.

**01.9  🟡 qisman**  — ❓ 
- Siz: Darslik kartaga; LMS oylik-gate (EP-ORG-027/028)
- Isbot: LmsCardGateService.isCardTrainingComplete (lms-card-gate.service.ts:127) QURILGAN + courses.card_id ustuni bor; payroll.service:438 chaqiradi. AMMO bu computeGatedMonthlySalary ichida — orphan (jonli endpoint chaqirmaydi); kurs-karta bind 0/5.

**01.10  🟡 qisman**  — ❓ 
- Siz: Markaziy AI moslik bahosi (EP-ORG-030)
- Isbot: AiFitService.evaluate (ai-fit.service.ts:59) AiRouter orqali markaziy AI'ga real prompt+ai_fit_scores yozadi (DB id=3 jonli, ANTHROPIC kalit len=108). AMMO faqat QO'LDA POST /ai/fit/evaluate chaqiriladi (cron/event yo'q); manba CKP/MES/QC avto-yig'ilmaydi; PDF-tarqatish yo'q.

**01.11  🟡 qisman**  — ❓ 
- Siz: AI kuzatadi, bloklamaydi; salbiy faqat inson tasdig'i (EP-ORG-093/PRINSIP-AI)
- Isbot: AiFitService hech qachon avto-jarima/blok qilmaydi (E1 mos). AMMO assign vaqtida fit-skor 'past moslik warn+sabab' chaqirilmaydi (card.service.ts:102 faqat seat-guard CONFLICT bloklaydi); past-moslik-warn yo'q.

**01.12  🟡 qisman**  — ❓ 
- Siz: Karta=RBAC manbai (EP-ORG-023)
- Isbot: RBAC guard-poydevor jonli (permission.guard + position_permissions=1380 qator). AMMO positionId (user.position_id→positions) bo'yicha keyed, org_departments EMAS; JWT endi cardId/rbacTier tashiydi (login.service:211) lekin guard hali eski positions o'qiydi.

**01.13  ❌ yo'q**  — ❓ 
- Siz: Maxfiy maydon BE-projection (EP-ORG-042)
- Isbot: org-structure.controller.ts:162 findOne to'liq node qaytaradi — rol bo'yicha maydon-filtri yo'q; klass @Roles barcha rol (admin/manager/supervisor/viewer/director) bir xil ko'radi; salary/AI-score projection yo'q.

**01.14  ❌ yo'q**  — ❓ 
- Siz: 5-holat state-machine + freeze/restore (EP-ORG-083/084/086)
- Isbot: Aktiv org_departments'da faqat boolean is_active (5-holat enum yo'q); current_state 144 NULL; muzlatish (frozen+sabab+muddat) grep=0; restore/unarchive endpoint yo'q. 5-holat faqat de-routed card-world'da (FE'ga ulanmagan).

**01.15  🟡 qisman**  — ❓ 
- Siz: Xodim↔karta M:N + stake-ulush cap (EP-ORG-004/066/142)
- Isbot: employee_cards M:N backend bor + EmployeeCardsSummary jonli render (FORMULA A SUM, card.repository.ts:344). AMMO stake/share/percent ustuni 0 (information_schema), 1.0 cap yo'q, allow-overload yo'q; jonli assignUser 1:1 (oldingi kartani o'chiradi).

**01.16  🟡 qisman**  — ❓ 
- Siz: Muddatli i.o. + acting supplement + avto-revert (EP-ORG-060/061)
- Isbot: employee_cards.is_acting/acting_supplement/ended_at + assignEmployee acting + acting-revert.cron (@Cron '0 1 * * *') + on-read revert QURILGAN (card.repository.ts:332). AMMO de-routed card-world'da (data 0); granular i.o.-huquq (kunlik ha/pul yo'q) yo'q.

**01.17  ❌ yo'q**  — ❓ 
- Siz: Excel ommaviy import (EP-ORG-075/076)
- Isbot: excel_import_batches/rows jadvallari bor (0 qator) lekin org-modul ishlatmaydi; org-structure controller'da import endpoint yo'q (faqat export/excel+export/pdf); FE import UI yo'q. (card_templates jadval endi bor lekin 0 qator, shablon-avto-to'ldirish yo'q.)

**01.18  🟡 qisman**  — ❓ 
- Siz: Org-o'zgarish kaskadlari (EP-ORG-041)
- Isbot: create()→DepartmentCreatedEvent→org-cascade.listener warehouse INSERT+grantRole JONLI (idempotent, unit-test). AMMO: faqat ombor+RBAC; adaptatsiya/shartnoma kaskadi yo'q; transfer (move) HECH event emit qilmaydi (faqat create'da).

**01.19  🟡 qisman**  — ❓ 
- Siz: Yagona karta-daraxt + vertikal approval-chain (EP-ORG-021/022)
- Isbot: Interaktiv daraxt+drag-reparent + WITH RECURSIVE approval-chain + no-skip eskalatsiya + manager-chain derive JONLI (/approval-chain 200). AMMO YAGONA-DARAXT invariant buzilgan (14 ildiz, dublikat otdeleniye-to'plam); otdeleniye_no 1-7 majburiy emas; manager_id 0/30 NULL (backfill DATA-gated).

**01.20  🔑 egasi-data**  — ❓ 
- Siz: Karta-DATA: razryad+oylik+ЦКП+rahbar qiymatlari (egasi-data)
- Isbot: q.cjs: razryad_level_id 1/145, tskp_measurement_unit 0/145, salary_type 0/145, head_user_id 18/145. Mexanizm (RazryadTab/EditDialog/head-picker) qurilgan — faqat egasi/HR qiymat kiritmaguncha karta-oylik=0 va manager-backfill yopiq.

---

## 02 — HR / Xodim-karta  (vizyon 62%, 23 savol)

> HR moduli — eng yirik modul: 39 ta controller ro'yxatdan o'tgan (hr.providers.ts:163), ~140 ta HR-jadval, ko'p mexanizm CHIN qurilgan. KUCHLI tomonlar: razryad 2-imzo EXECUTION (HR→rahbar→tarix, bir tranzaksiyada), oylik formula (baza×razryad×ЦКП%×stake×gate), ЦКП-darvoza (qattiq 0), kunlik hisobot cron+eskalsiya (6930 real yozuv), davomat→intizom avto-klassifikator (3→ogohlantirish/5→tanbeh/8→bo'shatish), login karta-darvoza (to'liq simli, lekin OFF), karta-AI moslik scorer (ai-fit.service, real AI router → ai_fit_scores), 8-bandli offboarding checklist+holat-mashina, ko'p-karta model (employee_cards.is_primary + stake_fraction). BO'SHLIQLAR: ko'p kalit-jadval BO'SH (razryad_requests=0, mentorship=0, employee_360=0, contracts=0, business_trips=0, monthly_cards=0, internal_job_postings=0, ckp_fact_values=0) — mexanizm bor, lekin oqim oxirigacha tekshirilmagan/ishlatilmagan. YETISHMAYDI: referral_bonus event-zanjiri (ProbationCompletedEvent yo'q), 360 unique-constraint (PK dan boshqa yo'q), business-trip→debt avto-zanjir, kunlik-hisobot ko'p-bosqichli eskalsiya (manager→shift→HR→direktor faqat HR ga soddalashgan), inventar-qaytarish→to'lov-blok qattiq WMS-trigger. Egasi-DATA kutadi: AI-kalit, ЦКП-norma+deadline, razryad-qiymat, oylik-band.

**02.1  🟡 qisman**  — ❓ Siz dedingiz: LMS darsligini tugallamagan xodim ikkinchi kartaga to'liq biriktirilmaydi (onboarding-binding bloki). Shu blok mantiqi qurilganmi?
- Siz: Ikkinchi karta oyligi to'lanmaydi; HR onboarding-service karta-binding event handler bloklaydi (EP-HR-001/003)
- Isbot: Onboarding service+cron bor (onboarding.service.ts, hr_onboarding_processes=30). employee_cards.is_primary+stake_fraction model bor. Lekin 'darslik tugamasa 2-karta blok' aniq karta-binding gate kodda topilmadi; lms_card_mentors=0, employee_monthly_cards=0

**02.2  🟡 qisman**  — ❓ Siz dedingiz: kunlik hisobot eslatmasi 09:00 da, keyin manager→smenaboshli→HR→direktor ko'p-bosqichli eskalsiya. Shu zanjir to'liqmi?
- Siz: 1-eslatma rahbar, 2-smenaboshli, 3-HR, 3 dan keyin direktorga avto-eskalsiya (EP-HR-002)
- Isbot: daily-report.service.ts:179 @Cron('30 15')→DAILY_REPORT_REMINDER, :205 @Cron('0 16')→DAILY_REPORT_OVERDUE→HR. 6930 real hisobot. Lekin eskalsiya faqat HR ga (manager→smenaboshli→direktor ko'p-bosqich yo'q)

**02.3  🔑 egasi-data**  — ❓ Siz dedingiz: kartaga biriktirilmagan xodim ERP ga kira olmaydi (login-gate + 'HR bilan bog'laning' modal). Shu darvoza ishlaydimi?
- Siz: JwtAuthGuard+RolesGuard bloklaydi, modal xabar, HR 24s Telegram (EP-HR-003)
- Isbot: login.service.ts:126-128 resolveCardGate + CARD_LOGIN_GATE_ENABLED flag to'liq simli; card-gate-precheck.service.ts blast-radius hisoblaydi. Egasi YOQISHi kerak (hozir OFF=regress-himoya, memory A4)

**02.4  ✅ bor**  — ❓ Siz dedingiz: razryad o'sishi imtihon+HR+rahbar tasdiq (2-imzo) bilan, keyin oylik o'zgaradi. Shu 2-imzo execution bormi?
- Siz: Attestatsiya+rahbar tasdiq→razryad→oylik avto (EP-HR-027/073)
- Isbot: razryad-history.repository.ts:195-236 hr-approve→manager-approve→history bir tranzaksiyada (status pending→hr_approved→approved); razryad-history.controller.ts:95,104 ikki endpoint. Data bo'sh (razryad_requests=0) lekin mexanizm to'liq

**02.5  ✅ bor**  — ❓ Siz dedingiz: oylik = baza × razryad-koeff × ЦКП% × stake; ЦКП fakt yo'q/deadline o'tsa kun oyligi 0. Shu formula+gate qurilganmi?
- Siz: Karta-oylik formula + ЦКП qattiq-0 darvoza (EP-HR-051/069 + 8-qaror)
- Isbot: ckp-gate.ts applyCkpGate (NO_FACT/DEADLINE_PASSED→factor 0); hr-payroll-closure.controller.ts:17 previewCardSalary baza×razryad×ЦКП%×stake×proratsiya×gate; drizzle-hr-payroll.repo.ts:124 razryad_levels JOIN. ckp_fact_values=0, payroll=0 (egasi-norma kutadi)

**02.6  🟡 qisman**  — ❓ Siz dedingiz: davomat AI kamera orqali (turniket o'rnini bosadi), kech kelish avto-hujjat, zona→karta. Shu qurilganmi?
- Siz: AI kamera davomat, unikal ish vaqti, zona-karta, kech kelish avto (EP-HR-049/050/31)
- Isbot: attendance-face.controller.ts, face-recognition.service.ts, territory-log.service.ts, zone-tracking jadval bor. classifyAttendanceStatus (late grace) real. Lekin camera_employee_reports=0, employee_zone_tracking=0, hr_tz2_daily_attendance=0 — jonli kamera oqimi ishlamagan

**02.7  ✅ bor**  — ❓ Siz dedingiz: kech kelish kumulyativ — 3→ogohlantirish, 5→tanbeh, 8→bo'shatish; tanbeh 6 oy keyin avto-arxiv. Shu klassifikator bormi?
- Siz: Bosqichli intizom, kumulyativ (1 dan boshlanmaydi), 6 oy soft-archive (EP-HR-055 + javob #9)
- Isbot: record-attendance.handler.ts:51 disciplineTypeForLateCount (warning/reprimand/discharge thresholds); discipline_records: is_first/second/final_warning, previous_warning_id, violation_count_this_category, is_expired. discipline_records=32 real yozuv

**02.8  🟡 qisman**  — ❓ Siz dedingiz: jarima tasdiqlanmasa oylikka yozilmaydi (E1 — inson tasdig'i), tasdiqlanganda avto-kamayadi. Shu E1-printsip kuchdami?
- Siz: Jarima hujjatlangan, tasdiq bilan→oylik kamayadi; tasdiqlanmasa HISOBLANMAYDI (EP-HR-056 + javob #42)
- Isbot: discipline_records approved_by/approved_at/fine_amount/fine_percent ustunlari bor. Lekin jarima→payroll avto-chegirish zanjiri (payroll=0, payroll_deductions o'qiydigan listener) jonli tasdiqlanmadi

**02.9  🔑 egasi-data**  — ❓ Siz dedingiz: har lavozim kartasi o'z AI'siga ega — xodim faktini yo'riqnoma talabi bilan solishtirib moslik hisoboti chiqaradi. Shu karta-AI bormi?
- Siz: Har kartada AI, xodim↔karta moslik hisoboti, AI'lar o'zaro (EP-HR-028/070/077)
- Isbot: ai-fit.service.ts real: profil+karta-talab prompt→AiRouterService→ai_fit_scores (fit_score, bonus, succession). ai_fit_scores=1 (mexanizm isbotlangan). Egasi AI-kalit kiritsa to'liq ishlaydi

**02.10  🟡 qisman**  — ❓ Siz dedingiz: har xodimga 2 mentor (adaptatsiya+kasbiy usta), mentor ERP da tasdiqlaydi, tasdiqsiz keyingi bosqich yo'q. Shu mentorlik bormi?
- Siz: 2 mentor biriktirish + ERP tasdiq majburiy (EP-HR-018/019/029-javob)
- Isbot: Onboarding service mentorni eslatadi (onboarding.controller.ts), mentors/mentorships/hr_mentorship_pairings jadvallari bor. Lekin HAMMASI BO'SH (mentorships=0, mentors=0, hr_mentorship_pairings=0, lms_card_mentors=0) — biriktirish oqimi ishlatilmagan

**02.11  ❌ yo'q**  — ❓ Siz dedingiz: tavsiya qilingan nomzod sinovdan o'tsa referral-bonus avto-Payroll (ProbationCompletedEvent). Shu zanjir bormi?
- Siz: ProbationCompletedEvent→referral_bonus Payroll komponenti (EP-HR-020 + javob #12)
- Isbot: employee_referrals=15 (hired/pending/interviewing) data bor. Lekin grep ProbationCompletedEvent/referral_bonus/ReferralBonus = HECH NARSA topmadi — event-zanjir qurilmagan

**02.12  🟡 qisman**  — ❓ Siz dedingiz: 360° baho faqat yaqin hamkasblar, anonim, bir xodim bir marta (DB unique: baholovchi+baholanuvchi+davr). Shu unique-constraint bormi?
- Siz: 360 anonim + unique constraint (baholovchi_id+baholanuvchi_id+davr) (EP-HR-041)
- Isbot: employee_360_assessments/responses + record-360-feedback.handler.ts bor. Lekin employee_360_assessments=0 (data yo'q) VA pg_constraint da PK dan boshqa unique YO'Q (indexdef: faqat _pkey) — bir-marta kafolati DB darajada yo'q

**02.13  🟡 qisman**  — ❓ Siz dedingiz: ta'til arizasi rahbar (manager_id)→24 soat→HR→tabel→Payroll avto. Shu ariza-zanjir ishlaydimi?
- Siz: Ta'til ariza→rahbar 24s→HR→Payroll avto (EP-HR-060/061 + javob #14)
- Isbot: leave/drizzle-hr-leave-svc.repo.ts:63 approve + balance accrual; approve-leave/cancel-leave/reject-leave handlerlar bor. hr_leave_requests=29 real. Lekin org-sxema vert+goriz avto-marshrut routing va Payroll avto-aks zanjiri jonli tasdiqlanmadi

**02.14  🟡 qisman**  — ❓ Siz dedingiz: offboarding — ERP blok+oxirgi to'lov+inventar qaytarish cheklisti+Exit interview; inventar qaytarilmasa to'lov avto-blok (WMS trigger). Shu bormi?
- Siz: To'liq offboarding + inventar-return→final-payment avto-blok (EP-HR-063 + javob #20)
- Isbot: offboarding-workflow.service.ts: 8-bandli checklist (laptop/badge/keys/exit) + holat-mashina (active→exit_interviewed→completed). Lekin employee_separation=0 va inventar-return→to'lov qattiq WMS-blok trigger topilmadi (faqat checklist-band)

**02.15  🟡 qisman**  — ❓ Siz dedingiz: AI rekruter ishni 80% bajaradi — kartaga ko'ra ballaydi/saralaydi, yakuniy qaror odam (Gemini LIVE). Shu recruitment-AI bormi?
- Siz: AI 80% nomzod baholash, 7-bosqich kanban, yakuniy odam (EP-HR-015/016/034)
- Isbot: recruitment/ ko'p controller+service (hr-vacancies, recruitment-assessment, ai-interview-v2); hr_candidate_funnels=11, hr_interview_sessions=5. Lekin AI-scoring real Gemini-chaqiruv kodda recruitment-assessment.service.ts da topilmadi (faqat CRUD log); ai_hr_interviews=0, hr_applications=0

**02.16  ✅ bor**  — ❓ Siz dedingiz: bir xodim ko'p karta/operatsiya (universal ishchi), oylik = kartalar yig'indisi, har karta o'z normasi. Shu ko'p-karta model bormi?
- Siz: Xodim↔karta many, oylik=kartalar yig'indisi, stake (EP-HR-067 + karta-model)
- Isbot: employee_cards (employee_id, card_id, is_primary, is_active, ended_at) + employee_org_departments.stake_fraction. employee_cards=1, employee_org_departments=31. Payroll repo stake_fraction o'qiydi (i-hr-payroll.repo.ts). Model to'liq, data minimal

**02.17  🟡 qisman**  — ❓ Siz dedingiz: profil tahriri to'liq audit-logga tushadi (kim/qachon/eski/yangi), 7 yil arxiv, faqat HR+direktor ko'radi. Shu audit bormi?
- Siz: Profil field-level audit-log + 7 yil arxiv + RBAC (EP-HR-036/javob)
- Isbot: audit_logs + hr_daily_report_audit + hr_documents_archive jadvallari bor. Lekin xodim-profil field-level (eski→yangi qiymat) audit yozuvi HR employees servisida topilmadi — umumiy audit_logs bor, profil-maxsus emas

**02.18  ❌ yo'q**  — ❓ Siz dedingiz: shartnoma turlari (muddatli/muddatsiz/sinov/loyiha), tugashiga 30 kun→ogohlantirish, 7 kun→ERP-kirish chekla. Shu shartnoma-hayot-sikli bormi?
- Siz: Shartnoma turlari + 30 kun ogohlantirish + muddat-blok (EP-HR-058/059 + javob #26)
- Isbot: employee_contracts/employment_contracts/hr_tz2_contract_versions jadvallari bor LEKIN HAMMASI BO'SH (=0). Shartnoma-muddati cron-ogohlantirish/ERP-blok oqimi data bilan tasdiqlanmadi

**02.19  🟡 qisman**  — ❓ Siz dedingiz: lavozim yo'riqnomasi 13-bandli standart shablon (ta'rif/ЦКП/talab/javobgarlik/glossariy), versiyalash, o'zgarganda qayta-imzo. Shu yo'riqnoma-karta bormi?
- Siz: 13-bo'lim yo'riqnoma + versiyalash + qayta-tanishuv (EP-HR-031/066)
- Isbot: hr_job_descriptions=20 real (version, is_current_version, content, org_function_id, ckp_code, checkpoints ustunlari). Versiya-tarix struktura bor. Lekin 13-bo'lim strukturali-maydon emas (content JSONB/matn), o'zgarganda avto-qayta-imzo zanjiri tasdiqlanmadi

**02.20  🟡 qisman**  — ❓ Siz dedingiz: ichki vakansiya (Internal Job Posting) faqat tegishli razryad/bo'lim xodimlariga ko'rinadi, parallel pipeline. Shu bormi?
- Siz: Internal Job Posting + razryad/bo'lim filtr + parallel ariza (EP-HR-073 + javob #45)
- Isbot: hr_tz2_internal_job_postings + hr_tz2_internal_applications jadvallari bor (struktura). Lekin BO'SH (=0) va razryad/bo'lim-filtr ko'rinish mantig'i jonli tasdiqlanmadi

**02.21  ❌ yo'q**  — ❓ Siz dedingiz: xizmat safari ariza→rahbar tasdiq→moliya (avans/qarz xodim kartochkasida→oylikdan chegiriladi); safar bekor→TravelCancelledEvent→qarz. Shu bormi?
- Siz: Safar→finance avans/qarz→oylik chegirish + TravelCancelledEvent (EP-HR-024/025 + javob #37)
- Isbot: employee_business_trips=0, employee_debt=0. grep TravelCancelledEvent topmadi. Safar→moliya→qarz avto-zanjir va bekor-event qurilmagan

**02.22  🟡 qisman**  — ❓ Siz dedingiz: smena = guruh (kunduz/tun+boshliq+a'zolar), tabel smenaga bog'lanadi, smenaboshchi org-sxemada. Shu smena-model bormi?
- Siz: Smena guruh + smenaboshchi + 2-smena ustama (EP-HR-068 + javob #7)
- Isbot: shift_schedules=30, shift_assignments=30 real data; shift/ moduli (shift_types, shift_handovers, shift_swap_requests). Lekin 2-smena ustama-koeff payroll-zanjiri va smenaboshchi org-sxema roli jonli tasdiqlanmadi

**02.23  🟡 qisman**  — ❓ Siz dedingiz: tabel davri yopiladi (qulf, idempotent)→oylikka uzatiladi→keyin faqat tuzatma; barcha komponent avto-Payroll (oltin ip→moliya). Shu yopilish bormi?
- Siz: Tabel davri qulf + idempotent Payroll + oltin-ip moliyaga (EP-HR-069 + javob #17)
- Isbot: payroll-closure.service.ts + hr-payroll-closure.controller.ts (oylik yopilish) bor; payroll_periods/payroll_periods_hr jadvallar. Lekin payroll=0, employee_monthly_cards=0 — yopilish→GL/moliya jonli oltin-ip tasdiqlanmadi

---

## 03 — Finance / GL / Kassir  (vizyon 68%, 20 savol)

> Finance moduli EuroPrint'da eng chuqur qurilgan modullardan biri: yagona kanonik GL dvigateli (entries jadvali, gl_entries=VIEW), ikki-tomonlama balans tekshiruvi, idempotentlik, davr-lock — hammasi REAL kod va jonli ishlaydi. ZVS/ZNO (3-darajali 500k/5M matritsa), FP-tsikl cron (4 kun), kassir-hub (smena+PIN+GL), podotchet/avans, AP/AR aging, amortizatsiya (SL/DB/SYD), variance, 3-way match, payroll GL — barchasi kod sifatida bor va ko'pi jonli entries'ga yozadi (POS/SD_INVOICE/COGS/VAT/PAYROLL yozuvlari jonli ko'rindi). ASOSIY BO'SHLIQLAR: (1) deyarli barcha operatsion jadvallar BO'SH (zvs/zno/budgets/cash_*/bank_accounts/accounting_periods=0 — qurilish bosqichi, egasi-data kutadi); (2) EP-FIN-005 4-hisobga AVTOMATIK taqsimlash event'ga ULANMAGAN — faqat qo'lda GL endpoint orqali (income-split.service real, lekin CashReceived/SdOrderPaid listener YO'Q, golden-thread faqat delivery→GL ulangan); (3) payroll soliq legi (INPS/JSHD) GL'da ataylab kesilgan ("1C hal qiladi") — bu EP-FIN-056 vizyoniga QISMAN zid; (4) valyuta kurs-feed (MB/CBU API) yo'q — multi-currency strukturasi bor lekin avto-konvertatsiya yo'q. Halol baho: dvigatel va mexanizmlar ~80% qurilgan, lekin oqim-ulanish + egasi-data ~50%, shu sabab umumiy ~68%.

**03.1  ✅ bor**  — ❓ EP-FIN-022: butun ERP bitta kanonik GL daftariga yozadimi (entries, gl_journal_entries/gl_lines EMAS)?
- Siz: Yagona kanonik GL — kassa, ZNO, payroll, SD, POS hammasi shunga yozadi; uzilishsiz oltin-ip.
- Isbot: gl-posting.service.ts:198 insertJournal→entries; gl_entries=VIEW over entries (q.cjs); jonli: entries 6 qator (POS-GL, SD_INVOICE 4000/9010, PAYROLL); gl_journal_entries=0, gl_lines=0 (ishlatilmaydi).

**03.2  ✅ bor**  — ❓ EP-FIN-023: har yozuv majburiy ikki-tomonlama (debet=kredit), balanslashmasa rad etiladimi?
- Siz: Doim debet/kredit; balanslashmasa yozuv qabul qilinmaydi (buxgalteriya asosiy qonuni).
- Isbot: gl-posting.service.ts:154 — Math.abs(totalDebit-totalCredit)>0.01 → Err('Double-entry validation failed'); balanslangan juft-qator decompose (179-196).

**03.3  ✅ bor**  — ❓ EP-FIN-024: COA = milliy BHMS hisoblar rejasi seed qilinganmi?
- Siz: Milliy BHMS reja + ShVB 4-hisob ustiga; CoA 42 BHMS seed.
- Isbot: accounts jadvali jonli 42 qator (q.cjs); account_code/account_type bor (0100 Asosiy vositalar ASSET, 1010 Xom-ashyo, 9010 Tushum, 6310 QQS).

**03.4  🟡 qisman**  — ❓ EP-FIN-005 + EP-FIN-001/004: tushum 4-hisobga (MAIN/TAX/HEAD/WORKING) AVTOMATIK foiz bilan taqsimlanadimi (CashReceived/SdOrderPaid trigger ichida atomik)?
- Siz: POS/SD to'lovi event'i trigger → tranzaksiya ichida atomik avtomatik taqsim; foiz versiyali konfiguratsiya.
- Isbot: income-split.service.ts REAL (computeSplit+splitAndPost→entries, default 50/20/15/15). LEKIN faqat finance-gl.controller orqali QO'LDA chaqiriladi — CashReceived/SdOrderPaid @EventsHandler YO'Q (event-handlers/ da faqat delivery/wms/tech listener); avtomatik trigger uzuq.

**03.5  ✅ bor**  — ❓ EP-FIN-007/009: tasdiqlash matritsasi summalik 3 bosqich (≤500k bo'lim / ≤5M kengash / >5M direktor), kartaga/rolga bog'liqmi?
- Siz: Summa avtomatik bosqich tanlaydi; tasdiqlovchi=karta/rol; muddat o'tsa eskalatsiya.
- Isbot: director/zvs.service.ts:17 computeLevel — amount<=500_000→L1, <=5_000_000→L2, else→L3; canApproveLevel rol-matritsa (L1/L2/L3 roles).

**03.6  🟡 qisman**  — ❓ EP-FIN-001/002/029: ZVS (haftalik byudjet so'rovi) va ZNO (to'lov so'rovi) entity'lari, statuslar oqimi bilan bormi?
- Siz: To'liq ZVS+ZNO ekran/entity, 6-holatli oqim (Yangi→Bo'lim→Kengash→Direktor→To'langan→Rad).
- Isbot: zvs/zno jadval+ustun (amount, level, status, reviewed_by) + director/zvs.service+zno.service+controller REAL. LEKIN jonli zvs=0, zno=0 qator — hech qachon ishlatilmagan (qurilish bosqichi, egasi/foydalanuvchi data kutadi).

**03.7  ✅ bor**  — ❓ EP-FIN-011/013: haftalik FP-tsikl (Se/Ch/Pa/Du) cron eslatmalari ishlaydimi?
- Siz: 4 kunlik aniq tsikl, har bosqich o'z kuni + Telegram+ERP eslatma.
- Isbot: fp-cycle-cron.service.ts — @Cron Seshanba(ZVS)/Chorshanba(FP)/Payshanba(bank)/Dushanba(naqd) Asia/Tashkent; notifyRoles→CreateNotificationCommand (ERP bildirishnoma; Telegram routing notification orqali).

**03.8  🟡 qisman**  — ❓ EP-FIN-020/021: kassa (naqd) hisobi to'liq ERP ichida — smena ochish/yopish, har kirim/chiqim GL'ga avtomatik?
- Siz: Kassa to'liq ERP; POS/ombor harakati kassa+GL ga avtomatik yoziladi; PIN bilan.
- Isbot: cashier-hub.service.ts:78/100/262 openShift/closeShift/recordMovement REAL + postGl→entries + verifyPin (371); FE CashierHub.tsx bor. LEKIN cash_sessions/cash_registers/cash_transactions=0 jonli — hali ishlatilmagan.

**03.9  ✅ bor**  — ❓ EP-FIN-049/073: avans (podotchet) — naqd berildi→xodim chek bilan hisob→qoldiq, hisob bermasa oylikdan chegirma?
- Siz: To'liq avans tsikli (issueAdvance→submitReport→qoldiq); muddat o'tsa oylikdan avtomatik chegirma.
- Isbot: cashier-podotchet.service.ts:65 issueAdvance (KAS-1 cash-out Dr 4000 AR/Cr 5010, PIN-gated, GL) + submitAdvanceReport; cash_advances jadval bor.

**03.10  🟡 qisman**  — ❓ EP-FIN-014/015: to'lanmagan schyotlar aging (0-30/31-60/61-90/90+), debitor (AR) va kreditor (AP) alohida?
- Siz: To'liq 4-guruh aging, debitor/kreditor alohida ekran.
- Isbot: ap-aging.handler.ts + ar-aging.handler.ts REAL (4 bucket NOW-due_date, source fi_invoices). LEKIN ar/ap_aging_buckets=0 va fi_invoices ehtimol bo'sh — data yo'q, faqat hisoblash mexanizmi tayyor.

**03.11  ✅ bor**  — ❓ EP-FIN-064: davr yopilishi (oy) — qulflangan davrga yangi GL yozuvi taqiqlanadimi?
- Siz: Davr yopilganda qulflanadi, faqat egasi/moliya rahbari ocha oladi; immutable.
- Isbot: gl-posting.service.ts:166 findClosedPeriodForDate → closed period'ga yozuv Err('Davr yopilgan EP-FIN-064'); repo:147 WHERE status='closed' OR is_closed=true; closePeriod (finance-accounting.service.ts:235).

**03.12  ✅ bor**  — ❓ EP-FIN-084 + EP-FIN-038: faktura-to'lov-yetkazish 3-way match — mos kelmasa to'lov bloklanadimi?
- Siz: Zakaz=faktura=kirim bo'lmasa to'lov bloklanadi, ortiqcha to'lov oldi olinadi; qisman yetkazishda ulush.
- Isbot: mm/goods-receipt.handler.ts:40 validateThreeWayMatch (tx ichida atomik); mos kelmasa ThreeWayMatchFailedEvent + 'Purchase manager approval required' (47-53).

**03.13  🟡 qisman**  — ❓ EP-FIN-052/023(amort): stanok amortizatsiyasi — asosiy vositalar kartochkasi, oylik amortizatsiya hisoblanadimi?
- Siz: Har stanok asosiy vosita kartochkasi (qiymat/muddat/oylik amortizatsiya); pro-rata.
- Isbot: depreciation.service.ts REAL 4 metod (SL/DB/SYD/units, buildSchedule, rounding-drift handling). LEKIN fixed_assets jadval YO'Q (q.cjs ERR) — reestr-jadval ulanmagan, faqat kalkulyator.

**03.14  🟡 qisman**  — ❓ EP-FIN-056: payroll soliqlari (INPS/JSHD) payroll yopilganda avtomatik GL'ga (xarajat + kreditor-soliq) yoziladimi?
- Siz: Payroll yopilganda avtomatik GL: ish haqi xarajat + soliq kreditor (xodim); hamma komponent avto.
- Isbot: ZIDDIYAT: gl-posting.service.ts:74-78 postPayroll faqat gross (Dr Salary Exp/Cr Salary Payable) — izoh: 'INPS/JSHD GL legs posted in 1C, not here'. PayrollTaxService rate'lari bor (INPS 12%/JSHD 1%) lekin GL legi ataylab kesilgan = vizyonga qisman zid.

**03.15  🟡 qisman**  — ❓ EP-FIN-053/011: import xom-ashyo valyutada — ko'p valyuta + kun kursi avtomatik so'mga, kurs farqi alohida?
- Siz: Ko'p valyuta + MB kun kursi→so'mda avtomatik; kurs API'dan olinmasa oxirgi kurs+audit.
- Isbot: bank_accounts.currency + invoice.currency ustunlari bor (struktura). LEKIN MB/CBU kurs-feed servisi (getRate/exchange_rate fetch) topilmadi — avtomatik konvertatsiya + 'offline kurs' mexanizmi yo'q.

**03.16  🟡 qisman**  — ❓ EP-FIN-067/068/029(sort): har buyurtma rentabelligi + tannarxdan/minimal-narxdan past sotuvda blok/tasdiq?
- Siz: Har buyurtma yopilganda rentabellik (daromad−to'liq tannarx); minimal chegaradan past→blok/egasi tasdig'i; sort koeff.
- Isbot: variance-analysis.service.ts analyzeOrder (standard vs actual, price variance) + tiered-pricing.service calculatePrice/upsertTier REAL. LEKIN sort-koeff minimal-narx avtomatik bloki (EP-FIN-068) kod sifatida ko'rinmadi — narx hisoblash bor, qattiq blok-darvoza qisman.

**03.17  🟡 qisman**  — ❓ EP-FIN-059/081: to'lov kalendari + pul aylanma davri (cash-flow forecast) AI bilan prognoz?
- Siz: Kun bo'yicha kirim/chiqim kalendari + qoldiq prognozi; mavsumiylik+trend (forecastCashFlow).
- Isbot: cashflow-forecast.service.ts forecastWeeks REAL (loadWeeklyData, DEFAULT_WEEKS) + ar/ap-aging + cashflow.handler. LEKIN data bo'sh (entries 6 qator) — prognoz tarixiy data yetishmasa zaif; mavsumiylik chuqurligi tasdiqlanmadi.

**03.18  🔑 egasi-data**  — ❓ EP-FIN-026/048: har to'lov so'roviga hujjat majburiy — og'zaki ma'lumot qaror asosi emas?
- Siz: Hujjat biriktirish majburiy (ma'lum summadan yuqori); bo'lmasa tasdiqlash bloklanadi.
- Isbot: ZNO/ZVS entity bor (comment, document maydonlari mavjud emas — zno cols: purpose, payment_date, status). Hujjat-biriktirish majburiy darvozasi kod sifatida tasdiqlanmadi; egasi/ijro to'ldirishi kerak.

**03.19  🟡 qisman**  — ❓ EP-FIN-082/027: egasi uchun moliyaviy dashboard (qoldiq+7-kun prognoz+qarzlar+foyda) + kompaniya holatiga ulanish?
- Siz: Egaga 1-ekran moliya dashboard; moliya ko'rsatkichlari holat formulasiga (kam kassa/katta qarz=XAVF) kiradi.
- Isbot: FE finance/reports (BalanceSheet/IncomeStatement/CashFlowARAP/KPITrendChart) + director/FinanceCard.tsx + financial-reports cron (daily/weekly/monthly/alerts) REAL. Holat-formulaga ulanish bor (memory: company-state). LEKIN data bo'sh → ko'rsatkichlar 0; jonli to'liqlik past.

**03.20  ✅ bor**  — ❓ EP-FIN-031: hisobotlar to'plami (kunlik kassa/haftalik FP/oylik P&L/aging) PDF eksport bilan?
- Siz: To'liq hisobot to'plami + PDF/Excel eksport; P&L real-vaqt 'hisoblangan'/'tasdiqlangan' belgisi.
- Isbot: financial-reports moduli: query/analytics/snapshot/telegram servislar + 4 cron + reports-hub.controller + reports.controller; FE IncomeStatement/BalanceSheet/MonthlyCashFlow komponentlari.

---

## 04 — Coordination / Council  (vizyon 52%, 25 savol)

> Koordinatsiya vizyoni IKKI joyda qurilgan: (1) director/coordination — Доклад+Распоряжение+5 kengash+3-karzina (cc_documents ustidan) — REAL CRUD, jonli ulangan; (2) communication-center (cc_*) — to'liq hujjat-workflow dvigateli: ko'p-bosqichli tasdiq (org-tree vertikal yo'naltirish, "hammasi oxiri direktorga"), PIN-imzo (signature_hash, bcrypt), rad/qayta-yuborish (versiya o'sishi), bekor, shikoyat, print-log, SLA-cron (24h overdue + 48h avto-rad + eskalatsiya + audit-trail), Telegram bot (Telegraf), CC→Kanban ko'prik. Master-data SEEDED (5 kengash, 14 shablon, 48 workflow-bosqich). LEKIN egasi vizyonining UCHTA ASOSIY STOLBI YETISHMAYDI: Протокол moduli (majlis protokoli, kun tartibi, action-item avto-Rasporyajeniye) UMUMAN YO'Q; Приказлар registri (PR-YYYY-NNN, kategoriya, immutable arxiv) jadval bor (orders_registry, bo'sh) lekin koordinatsiya bilan ULANMAGAN, kod yo'q; Кенгаш sessiyasi/kvorum/ovoz/Рек.Совет(ЗВС) — kengash faqat master-data qatori, sessiya/ovoz/kvorum entity YO'Q. Transaksion data deyarli BO'SH (dokla=2, rasporyazhenie=0, cc_documents=0, signatures=0) = qurilish bosqichi. Golden-thread (boshqa modul→cc.spawn avto-hujjat) PLUMBING bor lekin hech kim emit qilmaydi (o'lik). visionPct~52% (poydevor+workflow-dvigatel kuchli, lekin Protokol+Prikaz+Sessiya/kvorum 3 katta blok yo'q, data bo'sh).

**04.1  ✅ bor**  — ❓ Siz 5 kengash (Boshqaruv/Sifat/Moliya/HR/Texnik/Рек.Совет) master-data sifatida bo'lishini dedingiz — shundaymi? Loyihada 5 kengash bormi?
- Siz: EP-COR-001: 5 kengash council_levels jadvalida (nom/tur/tavsif/faollik), kengaytirsa bo'ladi
- Isbot: q.cjs: councils=5 qator (Boshqaruv/Sifat/Moliya/HR/Texnik); GET /coordination/councils jonli SELECT (coordination.controller.ts:41-55)

**04.2  ❌ yo'q**  — ❓ Kengash a'zoligi lavozim KARTASIga bog'lanib, xodim almashsa avtomatik o'tishini dedingiz — shundaymi? card_id orqali a'zolik bormi?
- Siz: EP-COR-003/031/084: a'zolik kartaga bog'lanadi, xodim almashsa avto o'tadi; CEO+7 otdeleniye boshlig'i doimiy a'zo
- Isbot: councils da faqat chairperson_id (emp FK) bor; a'zolik/a'zolar jadvali (council_members) YO'Q — q.cjs: %council%member% jadval topilmadi; karta-bog'lash kodi yo'q

**04.3  ✅ bor**  — ❓ Доклад 4 maydon (Mavzu/Muammo/Natija/Taklif) alohida bo'lishini dedingiz — shundaymi?
- Siz: EP-COR-004: subject/problem/result/proposal 4 maydon alohida, ShVB blankiga mos
- Isbot: dokla jadvali: subject,problem,result,proposal ustunlari bor (q.cjs); createDokla repo 4 maydonni yozadi (coordination.repository.ts:28-42)

**04.4  ✅ bor**  — ❓ Доклад holatlari oqimi (Yuborildi→O'qildi→Hal qilindi→Arxiv) bo'lishini dedingiz — shundaymi, jonli ishlaydimi?
- Siz: EP-COR-005/048: sent→read→resolved→archived status oqimi
- Isbot: PATCH /dokla/:id/read va /resolved endpoint, status='sent' default; getStatsDokla sent/read/resolved sanaydi (coordination.repository.ts:166-176)

**04.5  🟡 qisman**  — ❓ Распоряжение muddat+ustuvorlik bilan, kechiksa avto 'overdue' belgilanishini dedingiz — shundaymi?
- Siz: EP-COR-008/009/050: deadline majburiy + 4 ustuvorlik; cron muddati o'tganni overdue qiladi
- Isbot: rasporyazhenie: deadline,priority bor; listda CASE...deadline<CURRENT_DATE→'overdue' (repo:111). LEKIN bu read-vaqti hisob, alohida CRON avto-belgilash+rahbarga ogohlantirish YO'Q (director modulda cron yo'q)

**04.6  🟡 qisman**  — ❓ Распоряжение 2-bosqich tasdiq (Bajardim→Qabul qildim, izoh bilan) bo'lishini dedingiz — shundaymi?
- Siz: EP-COR-010/072: qabul→bajardi (done_at,note); bajaruvchi 'Bajardim'→beruvchi/Rais 'Qabul qildim'
- Isbot: markRaspDone done_at/done_by/done_note yozadi (repo:140-150). LEKIN bu 1-bosqich (faqat 'done'); beruvchining alohida 'Qabul qildim' tasdig'i alohida holat sifatida YO'Q (Tekshiruvda/Yopildi holatlari yo'q)

**04.7  ❌ yo'q**  — ❓ Majlis Протокол moduli (kun tartibi + ishtirokchilar + qarorlar + PDF eksport) bo'lishini dedingiz — shundaymi? Protokol bormi?
- Siz: EP-COR-011/012/062-066: to'liq protokol, kotib avto-shablon, PDF (zavod blanki), immutable+versiya
- Isbot: protocol/protokol jadval YO'Q (q.cjs); BE'da protocol/generateProtocol kodi yo'q (grep 0 mos); FE CoordinationPage'da Protokol tab yo'q (faqat overview/dokla/raspo/baskets/councils)

**04.8  ❌ yo'q**  — ❓ Protokol qaroridan avtomatik Распоряжение (action-item: mas'ul+muddat) ochilishini dedingiz — shundaymi?
- Siz: EP-COR-013/068: har qarordan avto Rasporyajeniye, mas'ul+muddat bilan
- Isbot: action_item kodi/jadvali YO'Q; protokol bo'lmagani uchun qaror→topshiriq avto-zanjiri umuman qurilmagan (grep action_item=0)

**04.9  🟡 qisman**  — ❓ Приказлар registri (PR-YYYY-NNN avto-raqam, kategoriya, kuchga kirish sanasi, imzo, immutable PDF arxiv) bo'lishini dedingiz — shundaymi?
- Siz: EP-COR-019-024/056-061: kategoriyali приказ, avto-raqam, effective_date, imzo bosqichi, immutable, PDF
- Isbot: orders_registry jadvali bor (number/category/title/content/status/department_ids) LEKIN bo'sh (count=0) va koordinatsiya controllerига ULANMAGAN — приказ endpoint/service/raqamlash kodi YO'Q; immutable-qulf yo'q

**04.10  🟡 qisman**  — ❓ Приказ imzosi 2-imzo modeli (fizik imzo + yozgan xodim tasdig'i + imzolovchiga Telegram tasdiq) bo'lishini dedingiz — shundaymi?
- Siz: EP-COR-023/063/064: fizik imzo+xodim belgisi+imzolovchi tasdig'i; tizim ichida PIN/Tasdiqlash (kim/qachon/IP audit)
- Isbot: cc-module'da PIN-imzo dvigateli REAL (verifyAndSign→signature_hash, bcrypt, document_signatures.ip_address/signed_at). LEKIN bu cc_documents (ariza-workflow) uchun; aynan Приказ entity'siga ulanmagan (приказ yo'q). document_signatures count=0

**04.11  ✅ bor**  — ❓ Hujjat org-tuzilma zanjiri bo'yicha avto-yo'naltirilishi (vertikal, sakramaydi, hammasi oxiri direktorga) ni dedingiz — shundaymi? Bu jonli ishlaydimi?
- Siz: EP-COR-028/089: org-tuzilma (Vysotskiy 7) avto-routing; MANAGER_OF_SENDER→DEPT_HEAD→CEO→DIRECTOR; vertikal, sakramaydi
- Isbot: cc-org-resolver.service.ts: MANAGER_OF_SENDER/DEPT_HEAD/CEO/DIRECTOR/POSITION resolverlari org_departments rekursiv-tree bo'yicha; 48 workflow-bosqich seed (har zanjir DIRECTOR bilan tugaydi) (q.cjs cc_workflow_steps)

**04.12  🟡 qisman**  — ❓ Tasdiqlangan hujjat IMMUTABLE bo'lib, o'zgartirish faqat yangi tuzatish-hujjat bilan bo'lishini dedingiz — shundaymi?
- Siz: EP-COR-024/061/066/077: tasdiqlangan immutable, qulflanadi, o'chirilmaydi, versiya tarixi (parent_document_id)
- Isbot: cc_documents: version/parent_document_id/cancelled ustunlari bor; reject→resubmit version+1 (cc-workflow.service.ts:201). LEKIN aniq 'approved→qulf' (yozish-taqiq) tekshiruvi alohida ko'rinmaydi; rasmiy immutable-gate kod sifatida tasdiqlanmadi (data bo'sh, jonli isbot yo'q)

**04.13  🟡 qisman**  — ❓ Eskalatsiya org bo'yicha yuqoriga (2x eslatma→eskalatsiya→HR) avto bo'lishini dedingiz — shundaymi, cron bormi?
- Siz: EP-COR-027/045/053/065: 2x eslatma→bevosita boshliq→otdeleniye→CEO; muddat o'tsa eskalatsiya+HR
- Isbot: cc-sla.cron.ts REAL: 30daq SLA, 48h avto-rad, escalateApprovals (deadline_at<NOW→'escalated'+audit), delegatsiya. LEKIN bu cc_approvals uchun; ko'p-bosqichli '2x eslatma→HR' zinapoyasi to'liq emas, director Доклад/Распоряжение uchun cron YO'Q

**04.14  🟡 qisman**  — ❓ Telegram orqali koordinatsiya buyruqlari (dokladlarim/topshiriqlarim/bajardim) bo'lishini dedingiz — shundaymi, real bot bormi?
- Siz: EP-COR-007/029/080: Telegram bot buyruqlari + bildirishnoma (ERP ichi + Telegram)
- Isbot: cc-bot.service.ts REAL Telegraf bot (sendBasketList/sendDocumentDetail/savat/rad-sabab). LEKIN bu cc hujjat-workflow uchun; aynan dokla/rasporyazhenie 'topshiriqlarim/bajardim' Telegram buyruqlari ko'rinmaydi

**04.15  ✅ bor**  — ❓ 3-karzina (kiruvchi/chiquvchi savat) Kanban'dan alohida, faqat COR-hujjatlar ko'rinishini dedingiz — shundaymi?
- Siz: EP-COR-024(v2-Q49): 3-karzina COR-specific hujjatlar; Kanban holati faqat % widget; izolyatsiya
- Isbot: GET /coordination/baskets → cc_documents (basket_state/is_inbox_overdue) jonli (coordination.repository.ts:178-202); cc_basket_history jadvali bor; CC→Kanban bir tomonlama ko'prik (cc-event.listener.ts:95-137)

**04.16  ❌ yo'q**  — ❓ Kvorum (2/3 a'zo) va ovoz berish (oddiy ko'pchilik, teng bo'lsa Rais) bo'lishini tavsiya qildingiz — loyihada kvorum/ovoz bormi?
- Siz: EP-COR-033/034/036: kvorum 66%, ovoz berish, manfaat-to'qnashuvi chetlashtirish, kvorum qayta hisob
- Isbot: council_session_members / votes / quorum jadval YO'Q (q.cjs); kvorum/ovoz kodi yo'q (grep quorum/vote=0 mos). Bu OCHIQ-default edi, lekin hatto sessiya entity ham qurilmagan

**04.17  ❌ yo'q**  — ❓ Рек.Совет (ЗВС) sessiyasi — ochiladi→ЗВС qo'shiladi→to'liq/qisman/rad qaror→yopiladi+hisobot — bo'lishini dedingiz — shundaymi?
- Siz: EP-COR-015/016/018: Рек.Совет sessiyasi, 3-xil qaror (to'liq/qisman summa/rad), Seshanba 08:45 cron, avto-hisobot, Finance'ga
- Isbot: rec-council session/ЗВС jadvali yoki kodi YO'Q; cc shablonlar ichida ZRS_ZVS bor (template) lekin sessiya/qaror/summa-tasdiq oqimi qurilmagan; Seshanba 08:45 cron yo'q

**04.18  🟡 qisman**  — ❓ Koordinatsiya boshqa modulga avto signal/vazifa (qaror→Production/Finance/HR/Warehouse, oltin ip) yuborishini dedingiz — shundaymi?
- Siz: EP-COR-083/050: qaror turi bo'yicha tegishli modulga avto vazifa; ProtocolSigned/RaspStatusChanged eventlar
- Isbot: cc.spawn event-listener REAL (boshqa modul→avto draft+kanban karta). LEKIN HECH BIR domen modul cc.spawn emit qilmaydi (faqat event-bridge plumbing) — golden-thread o'lik; ProtocolSigned eventi yo'q (protokol yo'q)

**04.19  🟡 qisman**  — ❓ Hujjat raqamlash DB-sequence bilan teshiksiz (race-condition himoyasi) bo'lishini dedingiz — shundaymi?
- Siz: EP-COR-005(decisions)/020/056: nextval SEQUENCE bilan atomik, takror/bo'sh bo'lmaydi (PR-YYYY-NNN)
- Isbot: cc-document-number.service.ts mavjud (generate, number_format bo'yicha) — cc_documents uchun. LEKIN приказ raqamlash (orders_registry.number) uchun kod yo'q; SEQUENCE ishlatilishi jonli tasdiqlanmadi (data bo'sh)

**04.20  🟡 qisman**  — ❓ Bajarish dalili (pruf fayl, 10MB, jpg/png/pdf/mp4) yuklash bo'lishini dedingiz — shundaymi?
- Siz: EP-COR-071/decisions-16: dalil fayl yuklash, proof_status, missing bo'lsa qizil ogohlantirish
- Isbot: cc_attachments jadvali bor; lekin Распоряжение markRaspDone faqat done_note (matn) yozadi, fayl-pruf maydoni/yuklash YO'Q (rasporyazhenie jadvalida attachment ustuni yo'q)

**04.21  🟡 qisman**  — ❓ Arxiv (har majlisga to'liq paket, o'chirilmaydi, audit izi, RBAC maxfiy/ochiq) bo'lishini dedingiz — shundaymi?
- Siz: EP-COR-074-078: to'liq arxiv, immutable, har ko'rish/yuklash audit, maxfiy faqat a'zolar+CEO
- Isbot: cc_audit_trail (har amal: sent/escalated/auto_rejected yoziladi, cc-sla.cron.ts:83), cc_print_log, AuditInterceptor controllerда. LEKIN majlis-arxivi paketi YO'Q (protokol yo'q); maxfiy-RBAC server-filtri ko'rinmaydi; audit_trail count=0

**04.22  ❌ yo'q**  — ❓ Doklad raqamlari ERP'dan avto keladi (30% kiritish/70% tahlil, manipulyatsiyasiz) ni dedingiz — shundaymi?
- Siz: EP-COR-047/030: doklad raqamlari Production/Finance/Warehouse'dan avto; karta-AI tahlil qiladi
- Isbot: dokla qo'lda kiritiladi (createDokla faqat matn maydonlari); ERP'dan avto-raqam tortish yoki karta-AI tahlil ulanishi YO'Q; cc_ai_sessions bor lekin doklad-raqam manbasi emas

**04.23  ❌ yo'q**  — ❓ Maxfiy/ochiq majlis va kim ko'rishi RBAC kartadan (server-side filter) bo'lishini dedingiz — shundaymi?
- Siz: EP-COR-076/decisions-34/40: Ochiq/Maxfiy belgisi, server-side rbac_visible, created_at>assignment_date
- Isbot: councils/dokla/rasporyazhenie da maxfiylik (is_confidential/visibility) ustuni YO'Q; CoordinationController faqat rol-guard (admin/manager/director), maydon-darajali maxfiy filter yo'q

**04.24  ✅ bor**  — ❓ Kengash konfiguratsiyasi (rais/tavsif/jadval) admin paneldan o'zgartirilishini dedingiz — shundaymi, real saqlaydimi?
- Siz: EP-COR-001/decisions: kengash master-data, rais tayinlash, meeting_schedule
- Isbot: PATCH /coordination/councils/:id → updateCouncil (chairperson_id/description/meeting_schedule real UPDATE+RETURNING, coordination.repository.ts:213-234); director/ceo gate

**04.25  🔑 egasi-data**  — ❓ Koordinatsiya jonli ma'lumot bilan ishlaydimi yoki bo'sh (qurilish bosqichi)mi? — egasi-data: kim qaysi kengash a'zosi, kim rais.
- Siz: Vizyon: real majlis/doklad/qaror oqimi; CEO+7 otdeleniye boshlig'i a'zo (egasi org-data beradi)
- Isbot: Transaksion data deyarli bo'sh: dokla=2, rasporyazhenie=0, cc_documents=0, document_signatures=0, cc_audit_trail=0. Master-data seeded (kengash=5, shablon=14, bosqich=48). Rais/a'zo biriktiruvi egasidan kutiladi

---

## 05 — Director / Hisobot / Holat  (vizyon 62%, 21 savol)

> Director moduli — eng chuqur qurilgan modullardan biri. YADRO VIZYON JONLI: 5-ko'rsatkichli vaznli holat formulasi (cash_flow/production/orders/hr/quality) sozlanadigan DB master-datadan (state_thresholds=25 qator, vaznlar real: cash_flow 0.25/hr 0.15), 5-darajali holat (OSISH/NORMAL/EHTIYOT/XAVF/INQIROZ seed=5), kundalik daftar (auto-fill+carryover+karta-markaz), ideal-rasm gap, OKR kaskad (recursive parent_goal rolled-up), oylik→haftalik reja, stat-reglament versiyalash (immutable version+1), strategik AI tahlilchi (real AI-router chaqiruv + 07:30 cron brifing), boy dashboard (CompanyStateWidget, IdealVsActual, 20-modul health, brak%, kechikkan buyurtma). YETISHMAYDI: (1) ko'pchilik jadval BO'SH — company_state_log=0 (snapshot cron 06:00 hali ishlamagan→tarix grafigi bo'sh), ideal_rasm/okr/monthly_plan/stat_regulations=0 (egasi-data); (2) VIP/ustuvor buyurtma PP ga EVENT chiqarMAYDI (EP-DIR-054 oltin-ip uzuq — faqat flag); (3) Telegram bot /kpi /summary ishlatadi, vizyon /holat /kundalik /ideal_rasm emas; (4) v2 kitob-asosli operatsion panellar (kechikish counter, sutkalik reja, energiya, paddon, info-so'rov, nazorat varaqasi, 5S) asosan vizyon-hali yoki boshqa modul mulki — director-aniq ulanish yo'q. Cron 06:00 (vizyon 07:00 degan — kichik chetlanish, sozlanadigan).

**05.1  ✅ bor**  — ❓ Kompaniya holati 5 ko'rsatkich (pul/ishlab chiqarish/buyurtma/xodim/sifat) birga, sozlanadigan vaznli o'rtacha bilan hisoblanadimi? (EP-DIR-001)
- Siz: To'liq formula — 5 ko'rsatkich birga, state_weights JSONB sozlanadigan master-data, ziddiyatli signal vaznli o'rtacha bilan hal.
- Isbot: company-state.service.ts:96-102 5 metric→buildWeights(DB)→holat.computeHolat; director-holat.service.ts vazn-yig'indisi 1.0±ε validatsiya, NaN→Err. state_thresholds=25 qator (cash_flow 0.25/hr 0.15).

**05.2  ✅ bor**  — ❓ Holat chegaralari (vaznlar + daraja-ostonalari) boshliq sozlaydigan DB master-datadanmi, hardcoded emasmi? (EP-DIR-002)
- Siz: Boshliq o'zi belgilaydi — har ko'rsatkichga sozlanuvchi chegara, seed sifatida standart keyin egasi tuzatadi.
- Isbot: company-state.repository.ts:68 getStateThresholds DB'dan o'qiydi; buildWeights yig'indi 1.0 emas bo'lsa default'ga fallback. FE: CompanyStateThresholdConfig.tsx sozlash sahifasi mavjud.

**05.3  🟡 qisman**  — ❓ Holat har kuni avtomatik (07:00 cron) qayta hisoblanib IMMUTABLE arxivga (company_state_log) tushadimi? (EP-DIR-003/004)
- Siz: Har kuni ertalab 07:00 avtomatik; har kunlik holat immutable arxivga (overwrite yo'q) + 30-kun mini-grafik.
- Isbot: company-state-snapshot.cron.ts:40 @Cron('0 6 * * *') — 06:00 (vizyon 07:00), kunlik idempotent INSERT into company_state_log. LEKIN company_state_log=0 qator (q.cjs) — hali yozilmagan, trend grafigi bo'sh.

**05.4  🟡 qisman**  — ❓ Holat yomonlashganda Telegram + tizim ichida darhol alert (sababchi bo'lim rahbariga) yuboriladimi? (EP-DIR-005/006)
- Siz: Telegram + tizim ichida darhol; alert sababchi ko'rsatkich egasi kartasiga + boshliqqa boradi.
- Isbot: director-agent.service.ts:209 morningBriefing AlertService.send + bus.emit('director.briefing_sent'). LEKIN bu kunlik brifing; holat-O'ZGARISHIDA darhol alert (state-change trigger) + sababchi-karta marshrutlash company-state cron'da ko'rinmaydi.

**05.5  ✅ bor**  — ❓ Bajarish kundaligi (Dnevnik) 5 bo'lim (holat/KPI/muammo/yechim/ertangi reja) bilan, holat+KPI avtomatik to'lib, har bo'lim rahbari o'z kartasidan yozadimi? (EP-DIR-007/008/009)
- Siz: To'liq 5-bo'lim kundalik; holat+KPI avtomatik to'ladi, boshliq faqat muammo/yechim/reja yozadi; muallif=karta (org_functions), bo'lim rahbarlari ham yozadi.
- Isbot: diary.service.ts:29 openDiaryForUser→resolveAuthorCard (karta-markaz)→getOrCreateToday (auto-fill daily_state)→carryOverIssues. FE DirectorDiaryPage.tsx. diary_entries=2 qator (jonli yozuv).

**05.6  🟡 qisman**  — ❓ Hal qilinmagan muammolar keyingi kunga "ochiq" deb avtomatik o'tadimi (carry-over)? (EP-DIR-010)
- Siz: Yechilmagan muammo "ochiq" deb keyingi kunga o'tadi; 3 kun ketma-ket="surunkali" eskalatsiya.
- Isbot: diary.repository.ts carryOverIssues real (EP-DIR-010 log). LEKIN 3-kun "surunkali" eskalatsiya (dir_chronic_days, sababchi-bo'lim+director marshrut) topilmadi — faqat oddiy carry-over.

**05.7  🟡 qisman**  — ❓ Ideal kartina (foyda/daromad/filial/xodim) + ideal-vs-haqiqat gap (maqsad/haqiqat/farq/%) ko'rsatiladimi, haqiqiy raqamlar avtomatik (moliya/HR) olinadimi? (EP-DIR-011/012/013)
- Siz: To'liq ideal kartina seed (100M foyda/800M daromad/15 filial/500 xodim) + gap analysis + updateCurrent avtomatik.
- Isbot: ideal-rasm.service.ts:18 getAll: ensureSeeded + getWeeklyRevenue/getActiveEmployeesCount (real DB) + achievementPct hisob. FE IdealRasmPage+IdealVsActualPanel. LEKIN ideal_rasm_targets=0 qator (q.cjs) — seed hali yozilmagan; filial=hardcoded 1.

**05.8  🔑 egasi-data**  — ❓ Strategik reja OKR (Objective→Key Results) kompaniya→bo'lim→karta kaskad (oltin ip) bilan, rolled-up progress bilanmi? (EP-DIR-015/016)
- Siz: Klassik OKR, 3 daraja kaskad (kompaniya→bo'lim→karta), har lavozim katta maqsadga hissa.
- Isbot: okr.service.ts:61 getCascade; okr.repository.ts:77 WITH RECURSIVE parent_goal_id rolled-up progress + owner_card_id + department_id. Kod TO'LIQ. okr_objectives=0/okr_key_results=0 — egasi maqsad kiritishi kerak.

**05.9  🔑 egasi-data**  — ❓ Taktik reja strategiyadan oylikka, oylikdan haftalikga dekompozitsiya + hafta oxirida bajarilish % bilanmi? (EP-DIR-017/018)
- Siz: Strategiya→oylik taktik vazifa→4 hafta dekompozitsiya, weekly_tasks bajarilish % avtomatik.
- Isbot: monthly-plan.service.ts:18 computeCompletionPct (weekly_tasks done/jami %) + completePlan qayta hisoblaydi. Kod real. monthly_plans=0 qator — egasi reja kiritishi kerak.

**05.10  🔑 egasi-data**  — ❓ Statistika reglamenti (har ko'rsatkich: ta'rif/formula/birlik/chastota/egasi-karta) versiyalanib (immutable, eski hisobot to'g'ri qoladi) saqlanadimi? (EP-DIR-020/022/023)
- Siz: To'liq stat-reglament + versioning (har o'zgarish yangi versiya+amal sanasi) + egasi kartaga biriktiriladi.
- Isbot: stat-regulation.repository.ts:104 update=yangi qator version+1+valid_from (immutable); getHistory ORDER BY version DESC; owner_card_id maydon. Kod real. stat_regulations=0 — egasi ko'rsatkich kiritishi kerak.

**05.11  ✅ bor**  — ❓ Director dashboard to'liq qo'mondonlik markazi — holat+ideal-gap+bugungi muammo+alert+6 modul KPI bir ekranda (Q123)? (EP-DIR-025)
- Siz: Hammasi va to'liq bir ekranda — har modul asosiy ko'rsatkichlari, to'liq qo'mondonlik markazi.
- Isbot: DirectorDashboard.tsx: CompanyStateWidget+IdealVsActualPanel+AISummary+20-modul ModuleHealthGrid+5 MetricCard (brak%/kechikkan/SLA)+OverdueOrders+HR/Production/Warehouse/Finance/Alerts kartalari+KpiScorecard. Boy, real useQuery'lar.

**05.12  🟡 qisman**  — ❓ Strategik AI tahlilchi har kuni qisqa tahlil + tavsiya beradimi (KPI tushuntirish/risk baholash/ijroiya xulosa, real AI)? (EP-DIR-026/079)
- Siz: AI har kuni holat-sabab tahlil + 1-2 tavsiya; karta-AI agregat → qaysi lavozim maqsadga yetmayapti.
- Isbot: director-ai.service.ts:73 AiRouterService.call real prompt (explainKpi/assessRisks/executiveSummary, JSON parse, fallback). director-agent.service.ts:194 07:30 cron brifing+emit. LEKIN AI-kalit egasi-data; karta-AI agregat (EP-DIR-079 "qaysi lavozim") ulanmagan.

**05.13  🟡 qisman**  — ❓ Holat va kundalik Telegram bot orqali (/holat /kundalik /ideal_rasm buyruqlari + 07:00 digest) olinadimi? (EP-DIR-027/028)
- Siz: /holat /kundalik /ideal_rasm buyruqlari + har ertalabki avtomatik digest (Telegram+tizim); /holat 07:00 cron'dan oxirgi saqlangani.
- Isbot: director.bot.ts: /kpi, /ai, /summary buyruqlari (real SQL). LEKIN vizyon /holat /kundalik /ideal_rasm YO'Q. owner-summary.service.ts digest real (Telegram) lekin endpoint-trigger; avtomatik 07:00 digest-cron topilmadi.

**05.14  🟡 qisman**  — ❓ Director "zarur/ustuvor buyurtma" navbatini o'zgartirsa PP rejalashtirishga REAL-VAQT EVENT orqali ta'sir qiladimi? (EP-DIR-054/21)
- Siz: Director ustuvorlik o'zgartirsa EP-DIR-054 event PP ga uzatiladi — keyingi qo'lda qayta rejalashtirishni kutmaydi.
- Isbot: director-extended.controller.ts:56 POST orders/:id/vip → markOrderVip → executeMarkVip (director-state.repository.ts:104 faqat sales_order VIP flag). HECH QANDAY emit/event PP ga — oltin-ip uzuq.

**05.15  ✅ bor**  — ❓ Holat darajalari 5 ta (O'SISH/NORMAL/EHTIYOT/XAVF/INQIROZ) + rang, sozlanadigan master-data sifatida saqlanadimi? (EP-DIR-029)
- Siz: 5 daraja + rang (egasi 4 emas 5-darajaga moyil — EHTIYOT qo'shimcha).
- Isbot: company_state_levels=5 qator (q.cjs): OSISH(rank5)/NORMAL/EHTIYOT/XAVF/INQIROZ(rank1)+label_uz+color_hex. Egasining aynan 5-darajali tanlovi seed qilingan.

**05.16  ❌ yo'q**  — ❓ Org-sxema joylashuvi (5-Departament/13-bo'lim/Sektsiya) + 5-departament drill-down + 2-o'q (departament╳operatsiya) ko'rinadimi? (EP-DIR-034/035/068)
- Siz: department_no/unit_no/section_name 3 maydon + 5-dept drill-down (eng murakkab zona) + 2 o'q (vertikal departament + gorizontal operatsiya turi).
- Isbot: Director-aniq 5-dept drill-down yoki 2-o'q (departament╳operatsiya) navigatsiya FE/BE topilmadi. Org joylashuvi org_departments'da (boshqa modul), lekin director-dashboard'da bu drill yo'q.

**05.17  🟡 qisman**  — ❓ Director reja-bajarilish % + kechikishlar/og'ish counter (root-cause drill) + downtime (soat+sabab) ko'radimi? (EP-DIR-036/037/038/074)
- Siz: Reja% fabrika agregat+bo'lim breakdown + 2 counter (delay/deviation, majburiy sabab) + downtime + og'ishdan tomir-kesish drill.
- Isbot: production_plan metrik holat-formulada (orders%) + prod.delayedOrders FE'da. downtime_events/downtime_logs jadval bor (MES mulki). LEKIN director-aniq delay_count/plan_deviation_count counter + root-cause drill zanjiri topilmadi.

**05.18  🟡 qisman**  — ❓ Brak 3 kategoriya alohida (QC/MES/yetkazish) + director brak% trend + yo'qotish (entries GL) ko'rinadimi? (EP-DIR-025/055/047)
- Siz: Brak 3 kategoriya ALOHIDA + jami; chiqindi farqi GL'ga 'yo'qotish'.
- Isbot: DirectorDashboard.tsx:142 brakFoizi MetricCard (prod.defectPct). defect_reports/qc_defects jadval bor. LEKIN 3-kategoriya ajratish (QC qaytargan/MES/yetkazish) + chiqindi→entries GL bog'lanish director'da ko'rinmaydi.

**05.19  ❌ yo'q**  — ❓ Sutkalik reja, energiya (suv/gaz/svet), paddon zaxirasi, info-so'rov (bo'limlararo), nazorat varaqasi (o'quv), 5S — direktor panelida bormi? (EP-DIR-040/045/051/078/047/085)
- Siz: Sutkalik 24h reja + energiya trend + paddon aylanishi (→downtime) + ma'lumot so'rovi workflow + nazorat varaqasi (darslik kartaga) + 5S tozalik.
- Isbot: q.cjs: daily_plan/energy/pallet(faqat ow_pallet_recoveries)/info_request/control_sheet jadvallari YO'Q yoki director-bog'lanmagan. Bu v2 kitob-asosli panellar vizyonда (decisions: 76 ochiq) — qurilmagan.

**05.20  🟡 qisman**  — ❓ Maxfiy ma'lumot kirishi audit-log (faqat Super Admin/Director) + 'tijorat siri' javobgarligi kuzatiladimi? (EP-DIR-044/Q144)
- Siz: Maxfiy ma'lumot (narx/mijoz/formula) kirishi audit-log; faqat Super Admin (IT/Direktor) ko'radi (Q144).
- Isbot: AuditInterceptor diary/director controller'larda qo'llanilgan (audit yozadi). LEKIN director-aniq "maxfiy kirish logini real-time ko'rish" (EP-DIR-034 RBAC scope) ekrani + tijorat-sir javobgarlik tasnifi topilmadi.

**05.21  🔑 egasi-data**  — ❓ Director milestone 'bajarildi' belgilash (RBAC, undo, audit) + strategiya yutuqlari ko'rsatiladimi? (EP-DIR-030/042)
- Siz: Yetilgan maqsad 'bajarildi'+completedAt saqlanadi; faqat director/vakolatli karta belgilaydi, undo+audit.
- Isbot: strategic.service.ts:50 createMilestone/updateMilestone (status) real; strategic_milestones=4 qator (jonli). FE StrategicTasksPanel. Mexanizm bor — egasi maqsad/milestone to'ldirishi kerak; aniq undo/RBAC-gate verify qilinmadi.

---

## 06 — SD / Sotuv-buyurtma  (vizyon 62%, 24 savol)

> SD moduli STRUKTURA jihatdan eng kuchli modullardan: to'liq DDD (aggregate + CQRS + outbox), jonli golden-thread (buyurtma→avans→3-darvoza→fanout→PP/MM/MES), narx-dvigatel, ABC-Pareto, lead→order, leaderboard/forecast — barchasi REAL kod, stub emas. Jonli data ham bor (13 buyurtma, 15 mijoz, 7 faktura, 1 narx-formula). LEKIN egasining bir nechta aniq biznes-qoidasi YO'Q: chegirma-shift (checkDiscountCap), bekor-jarima jadvali (order_cancellation_rules), davalcheskoe material (owner_type), ombor-saqlash to'lovi mantig'i, prosrochka-tasdiq darvozasi (Даромадлар bo'limi), mavsumiy signal, gate_status JSONB. Leaderboard oylik (vizyon: haftalik Dush-Yaksh). Reklamatsiya QC'da bor lekin SD'dan "ochish" tugmasi ulanmagan. Kotirovka oqimi qurilgan lekin jonli ishlatilmagan (sd_quotations=0). Halol baho: ~62% — yadro va oltin-ip jonli, lekin sotuv-spetsifik qoidalar (chegirma/jarima/davalcheskoe/debitor-gate) yetishmaydi.

**06.1  ✅ bor**  — ❓ Tasdiqlangan buyurtma AVTOMATIK ishlab chiqarishga (PP/MES) oltin-ip raqamini saqlab o'tadimi — buyurtma=butun zanjir triggeri (EP-SD-020/137)?
- Siz: Buyurtma ID = oltin-ip; status 'ready_for_planning'ga o'tganda PP avto ishga tushadi, har bosqich shu ID ga yoziladi
- Isbot: update-order-status.handler.ts:72-98 — status UPDATE + ERP_EVENTS.ORDER_STATUS_CHANGED outbox bitta tx'da; advance-approved-fanout.listener.ts:43-108 mold/design/cliche/logistics/warehouse/production job + SD→MM signal yaratadi

**06.2  🟡 qisman**  — ❓ Uch darvoza (kredit/to'lov/maket) KETMA-KET baholanib, hammasi 'ok' bo'lmaguncha buyurtma ishlab chiqarishga o'tmaydimi (EP-SD-003/055)?
- Siz: 1-kredit→2-avans→3-maket ketma-ket; bitta failed bo'lsa zanjir to'xtaydi; har shart ok|pending|failed
- Isbot: sales-order.aggregate.ts:146-159 checkAdvanceAndBlock() + isThreeCheckpointPassed() REAL; LEKIN vizyon 'gate_status JSONB (har shart ok|pending|failed)' YO'Q — alohida boolean flaglar (techBom/Routing/Card + advanceStatus); kredit-limit darvozasi alohida tekshirilmaydi

**06.3  ✅ bor**  — ❓ Avans to'lovi (70%) tasdiqlanmaguncha buyurtma bloklanadimi, va avans tasdiqlangach bo'limlarga avto-tarqatiladimi (EP-SD-011/055)?
- Siz: Avans bank tasdig'ini kutadi; PaymentConfirmedEvent → SD bloki ochiladi; bo'limlarga ish ketadi
- Isbot: sales-order.aggregate.ts:182-221 confirmAdvancePayment (idempotent, AdvancePaymentConfirmed event); advance-approved-fanout.listener.ts AdvanceApprovedEvent'ni tinglab 6 bo'limga job tarqatadi

**06.4  ✅ bor**  — ❓ Narx FORMULA orqali hisoblanadimi (xomashyo+bo'yoq+ish+die+yetkazish + ustama% + QQS) — har qator ko'rinadimi (EP-SD-037)?
- Siz: To'liq kalkulyatsiya, FIFO partiya narxi, har komponent ko'rinadi; QQS alohida; narx NDS'siz saqlanadi
- Isbot: sd-quotations.service.ts:73-126 calculatePrice — sd_price_formulas jonli o'qiydi, RSC blank-yuza geometriyasi, paper/print/die/labour/delivery + markup% + vat% (jonli 1 formula-row bor)

**06.5  ✅ bor**  — ❓ Mijoz A/B/C avtomatik (yillik xarid hajmi, Pareto 80/15/5) toifalanib sd_customers'ga yoziladimi (EP-SD-007/048)?
- Siz: ABC avto: A≤80% B≤95% C; jonli sales_orders'dan, nol-daromad→C; event-based qayta hisob
- Isbot: customer-abc.service.ts:48-103 computeAbc kümülatif-share Pareto, getAnnualRevenue jonli o'qiydi, persistAbc → sd_customers.abc_class; CUSTOMER_ABC_CUMULATIVE konstantasi

**06.6  ✅ bor**  — ❓ Lead → kotirovka → buyurtma voronkasi bormi, lead bir tugma bilan buyurtmaga aylanadimi (EP-SD-001/115)?
- Siz: Har sotuv lead'dan; lead→KP→buyurtma; konversiya %; lead butun zanjirga bog'lanadi
- Isbot: sd-leads.service.ts:50-66 convert → convertLeadToOrderAtomic (order INSERT + lead status UPDATE bitta tx); getFunnelReport conversion_rate hisoblaydi

**06.7  🟡 qisman**  — ❓ Menejer leaderboard'i HAFTALIK (Dushanba–Yakshanba izolyatsiya) hisoblanadimi, ta'til kunlari KPI'dan chiqariladimi (EP-SD-016/021)?
- Siz: Leaderboard dushanba-yakshanba; HR LeaveApprovedEvent → o'sha kunlar KPI'dan chiqariladi (proporsional)
- Isbot: sales.repository.ts:70-76 getLeaderboard REAL (RANK() jonli) LEKIN DATE_TRUNC('month') — OYLIK, vizyon haftalik Dush-Yaksh; ta'til-kvota proporsional qisqarish YO'Q

**06.8  ✅ bor**  — ❓ Faktura raqami DB SEQUENCE orqali (race-condition'siz) generatsiya qilinadimi (EP-SD-037/073)?
- Siz: invoices_number_seq DB sequence, atomic, application-darajada emas; SO-2026-NNNNNN
- Isbot: create-invoice.handler.ts:72 nextval('invoice_number_seq') — DB sequence; create-order.handler.ts:170 order_number SO-YYYY-NNNNNN format

**06.9  ❌ yo'q**  — ❓ Barcha chegirmalar UMUMIY shift'ga (~15%) bo'ysunadimi — checkDiscountCap() bloklaydimi (EP-SD-013/045)?
- Siz: Tiraj+avans+doimiy chegirma birga 15%dan oshsa tizim bloklaydi; sd-quotations.service.ts::checkDiscountCap()
- Isbot: Grep checkDiscountCap|discount_cap butun sd modulida 0 natija; sd-quotations.service.ts'da chegirma-shift logikasi yo'q (faqat narx-dvigatel bor)

**06.10  ❌ yo'q**  — ❓ Buyurtmani bekor qilishda bosqichga qarab jarima (maket30%/bosildi70%/tayyor100%) order_cancellation_rules jadvalidan olinadimi (EP-SD-008/069)?
- Siz: Jarima % order_cancellation_rules jadvalida (faqat egasi o'zgartiradi); jarima GL entries'ga Debit/Credit
- Isbot: order_cancellation_rules jadval DB'da yo'q (information_schema 0); cancelOrder (sd-quotations.service.ts:240) faqat status='cancelled' qiladi, jarima hisobi yo'q

**06.11  ❌ yo'q**  — ❓ Davalcheskoe (mijoz materiali) owner_type='client' belgisi bilan ombor balansisiz qabul qilinadimi (EP-SD-006/105)?
- Siz: Mijoz materiali warehouse_stock'ga owner_type='client' bilan; ombor balansiga ta'sir qilmaydi; QC karantin
- Isbot: Grep owner_type|davalch|materialy_zakazchika butun sd modulida 0 natija; 'material: kompaniya/mijoz' belgisi modelda yo'q

**06.12  🟡 qisman**  — ❓ Buyurtma qoldiq qarzi (Сумма/To'langan/Осталось) real-vaqt ko'rinadimi, отгрузка+N kun to'lov muddati avto-sanaladimi (EP-SD-022/120/129)?
- Siz: Jami/To'langan/Qoldiq avto to'lovlardan; отгрузка+5 kun = to'lov muddati (sd_customers.payment_delay_days); OrderShippedEvent
- Isbot: sales_orders'da paid_amount/balance_due_amount/advance_paid_amount ustunlari bor + toJSON balanceDueAmount; LEKIN отгрузка+N kun avto-sanog'i (payment_delay_days reader) SD kodida ko'rinmaydi

**06.13  🟡 qisman**  — ❓ Reklamatsiya buyurtmadan 'ochish' tugmasi bilan QC moduliga ulanadimi (ReclamationOpenedEvent) (EP-SD-020/081/134)?
- Siz: Buyurtmadan reklamatsiya ochish → ReclamationOpenedEvent → QC'da yozuv; hal → GL kredit-nota + WMS qaytarish
- Isbot: qc_reclamations jadval + create-reclamation.handler.ts QC'da REAL bor; LEKIN SD modulida ReclamationOpened emitter/tugma yo'q (Grep sd/ = 0) — ulanish uzuq

**06.14  🟡 qisman**  — ❓ Kotirovka (КП) rasmiy hujjat sifatida versiyalanadi, har update yangi revision-snapshot yaratadimi (EP-SD-003/033/050)?
- Siz: КП alohida raqamlangan hujjat, versiyalanadi, immutable eski versiyalar, buyurtmaga avto-aylanadi, PDF
- Isbot: sd-quotations.service.ts:193-216 updateQuotation snapshot+version, getRevisions REAL; sd_quotation_revisions jadval bor LEKIN sd_quotations=0 (jonli ishlatilmagan); PDF (internal/external) render SD'da topilmadi

**06.15  🟡 qisman**  — ❓ Buyurtma har bir o'zgarishi (tiraj/muddat/narx — kim/qachon/eski→yangi) audit-jurnalga yoziladimi (EP-SD-029/079/132)?
- Siz: Har narx/tiraj/muddat o'zgarishi jurnalga; nizo himoyasi; to'liq versiya tarixi
- Isbot: sales_orders.changed_by ustuni + quotation revisions bor; sd_order_timeline jadval mavjud (0 qator); LEKIN buyurtma-darajadagi maydon-o'zgarish diff jurnali kodi ko'rinmaydi

**06.16  ❌ yo'q**  — ❓ Muddati o'tgan prosrochka bo'yicha yangi buyurtma Даромадлар bo'limi boshlig'i tasdig'iga boradimi (avto-bayroq) (EP-SD-046/062/112)?
- Siz: Prosrochka qarz bo'lsa yangi buyurtma tasdiqqa; Даромадлар boshlig'i (razryad-RBAC) 24s SLA → Moliya direktori eskalatsiya
- Isbot: Grep overdue.*approv|prosrochka|debtor-gate sd modulida 0; debitor KPI ko'rsatkichi bor (sales.repository) lekin yangi-buyurtma-bloklash darvozasi yo'q

**06.17  ❌ yo'q**  — ❓ Mahsulot tex-spetsifikatsiyasi (Марка Т22/профиль С, ламинация, тиснение золото/серебро, слой 2/3/5) strukturalangan maydon sifatida buyurtmada bormi (EP-SD-083..097)?
- Siz: Marka/profil/ламинация/лак/высечка/склейка/слой markaziy lug'atdan qattiq ro'yxat → narx+ombor avto
- Isbot: sales_order_items va sales_orders ustunlarida marka/profil/слой/ламинация/тиснение maydonlari yo'q; bu gofra/offset tex-atributlar SD sxemasida modellashtirilmagan (faqat narx-dvigatel dims+colors oladi)

**06.18  ❌ yo'q**  — ❓ Menejer ketsa (HR EmployeeDeactivated) mijozlari rahbar tanlagan yangi menejerga o'tadimi (baza kompaniyaники) (EP-SD-010/018/114)?
- Siz: EmployeeDeactivated → menejer mijozlari rahbar tanlagan yangiga; ochiq buyurtmalar davom; mijozga xabar
- Isbot: deal-won.listener.ts bor lekin EmployeeDeactivated→mijoz qayta-biriktirish listeneri SD'da topilmadi; sd_customers'da menejer biriktirish ustuni bor lekin avto-transfer oqimi yo'q

**06.19  🟡 qisman**  — ❓ Tannarx/margin RBAC bilan himoyalanadimi — menejer faqat sotuv narxini, rahbar+ margin ko'radimi (EP-SD-043/127)?
- Siz: Margin → @Roles(director,sales_manager_senior); menejer rolida DB query SELECT'dan margin_pct chiqariladi (projection)
- Isbot: sd-customers.controller'da @Roles/RolesGuard bor (delete director-only); LEKIN SdOrderProjection::forRole(role) margin-maskalash kodi topilmadi — calculatePrice hammaga margin qaytaradi

**06.20  ✅ bor**  — ❓ Yetkazish (dostavka) alohida bosqich sifatida (sana+haydovchi+mashina) qayd qilinadimi (EP-SD-021/138)?
- Siz: Yetkazish alohida bosqich; haydovchi+mashina+vaqt qayd (isbot+postoplata sanog'i); to'lov muddatini ishga tushiradi
- Isbot: deliveries.service.ts + drizzle-sd-deliveries.repo.ts findAll/create/updateStatus REAL; sd-deliveries.controller.ts wired; SDDeliveries.tsx FE sahifa bor

**06.21  🟡 qisman**  — ❓ Buyurtma tannarx muzlatilib (FIFO snapshot) buyurtma davomida o'zgarmaydimi (EP-SD-004/038/126)?
- Siz: FIFO partiya narxi tasdiqlash vaqtida muzlatiladi (unit_cost_snapshot); GL'da snapshot↔joriy farq inventory_variance'ga
- Isbot: narx-dvigatel FIFO-tayyor (sd_price_formulas o'qiydi) LEKIN sales_order_items'da unit_cost_snapshot ustuni yo'q (Grep snapshot=0); narx muzlatish hozir bajarilmaydi

**06.22  🟡 qisman**  — ❓ Ombor-saqlash to'lovi (tayyor mahsulot ushlanib qolsa N kundan keyin tarif) hisoblanadimi (sales_orders.storage_*)?
- Siz: storage_free_days dan keyin storage_tariff_per_m2 bo'yicha storage_accrued_amount yig'iladi
- Isbot: sales_orders'da storage_free_days/storage_tariff_per_m2/storage_accrued_amount ustunlari + sd_storage_fees jadval BOR (0 qator) LEKIN hisoblash/accrual kodi yo'q (Grep StorageFee=0) — struktura tayyor, mantiq yo'q

**06.23  ✅ bor**  — ❓ Outbox pattern bilan distributed-transaction himoyasi (har bosqich domain_events'ga, kompensatsiya) bormi (EP-SD-050)?
- Siz: Har bosqich (GL/WMS/MES/HR) domain_events'ga; biri fail → kompensatsiya event; idempotent handlerlar
- Isbot: create-order.handler.ts:93-118 save+outbox bitta db.transaction (fail→rollback); update-order-status.handler.ts:72-98 atomic outbox; OutboxRepository.insertBatch; listenerlar idempotent (NOT EXISTS guard)

**06.24  🔑 egasi-data**  — ❓ Sotuv-spetsifik aniq FOIZ/QIYMATLAR (chegirma-shift %, MOQ, bo'yoq-tarif, jarima %, debitor-limit, toifa-paket) kiritilganmi?
- Siz: decisions/06-sd.md'da 24 OCHIQ band: EP-SD-033/036/039/045/049/060/068/069 va h.k. — egasi aniq raqam beradi
- Isbot: decisions/06-sd.md:10 — 24 OCHIQ band sanab o'tilgan; ko'pchiligi 'tamoyil tasdiq, faqat aniq RAQAM/FOIZ egasidan' (sd_price_formulas'da 1 namuna-row bor, qolgan qiymatlar kutilmoqda)

---

## 07 — PP / Rejalashtirish  (vizyon 52%, 22 savol)

> PP moduli arxitektura jihatidan ENG kuchli qurilgan modullardan biri: DDD tuzilma to'liq (aggregate/repo/handler/controller hammasi wired). Sof-mantiq dvigatellar HAQIQIY va vizyonga sodiq — navbat/frozen-zona/ZARUR/no-preempt (production-priority.service), gofra 3-formula (gofra-conversion.service), MPS-ATP (kümülatif balans), MRP, CRP (OEE-efficiency), AI 7-qadam (halol skelet, 7-qadam kalit-gate). Texkarta 6-elementi (material_type/print_params/kesim/qolip/post_press/ish_tartibi) + lab/maket gate flaglari + versiya + BOM + marshrut REAL. Smena hisoboti (4 raqam: reja/fakt/brak/prostoy) REAL CRUD. Trigger-5 (dizayn+lab→PP oltin-ip) wired. AMMO: vizyonning JONLI ishlashi DATA bo'shligidan to'xtagan — boms=0, pp_routing=0, pp_routing_operations=0, technology_cards=1. Lab-gate FLAG bor lekin release'da MAJBURIY emas (EP-PP-091/124 yarim). Sutkalik reja croni (EP-PP-080) UMUMAN yo'q (@Cron topilmadi). Manager-notify (EP-PP-098) faqat ustun, event yo'q. 5-sabab kod katalogi (EP-PP-055) generic enum, kitobning aniq 5-guruhi master-data EMAS. Xulosa: poydevor ~80%, data/ulanish/oqim ~25% — "dvigatel qurilgan, yoqilg'i quyilmagan".

**07.1  ✅ bor**  — ❓ Egasi: texkarta KITOBDAGI aniq 6 element (material turi / bosma parametrlari / kesim / qolip / qo'shimcha ishlovlar / ish tartibi) ni saqlasinmi? (EP-PP-090)
- Siz: Texkarta 6 element bayt-ma-bayt kitob bilan; BOM/MRP/narx shundan o'qiydi
- Isbot: technology_cards ustunlari: material_type, print_params(jsonb), kesim(jsonb), qolip_id, post_press(jsonb), ish_tartibi(jsonb) + direction/gofra_profile — q.cjs tasdiqladi. CRUD: technology.service.ts createCard/updateCard

**07.2  🟡 qisman**  — ❓ Egasi: faqat LAB «Одобрена» muhrli texkarta ishlab chiqarishga o'tadi — lab tasdiqsiz reja 'Tasdiqlangan'ga o'ta olmaydi (qattiq 403 blok)? (EP-PP-091/124)
- Siz: Lab gate majburiy; tasdiqsiz reja ishga tushmaydi; sifat rejadan ustun
- Isbot: lab_approved/maket_approved ustunlari + labApprove() bor (technology.repository.ts:258), AMMO release-production-order.handler.ts po.release() lab_approved'ni TEKSHIRMAYDI — gate flag bor, lekin majburiy darvoza sifatida ulanmagan

**07.3  ✅ bor**  — ❓ Egasi: parallel buyurtmalar ustuvorlik = 4-band (Shoshilinch/Yuqori/Oddiy/Past) + ZARUR butun navbatdan oshib o'tadi, deadline asosiy mezon? (EP-PP-010/058/059/097)
- Siz: ZARUR=flag (5-band emas), deadline→band tartib, ZARUR har band ustidan
- Isbot: production-priority.service.ts: PoPriority 4-band + isUrgent flag, compareFlexible (ZARUR→deadline→band→id). pp/queue endpoint live production_orders'dan o'qiydi (get-production-queue.handler.ts:42)

**07.4  ✅ bor**  — ❓ Egasi: muzlatilgan zona (~1-2 kun) — boshlangan/frozen ishlar yangi shoshilinch tomonidan UZILMAYDI (no-preempt: 'har zakaz 100% tugamaguncha keyingiga o'tilmaydi')? (EP-PP-025/061/081)
- Siz: Frozen segment hech qachon re-rank qilinmaydi; preemption taqiq
- Isbot: production-priority.service.ts buildQueue: frozen segment (sequence asc, hech qachon interleave emas) + flexible. findInsertionSlot frozen ustidan o'tmaydi. production_orders.is_frozen/frozen_until ustunlari mavjud

**07.5  ❌ yo'q**  — ❓ Egasi: sutkalik reja croni — smena almashuvidan keyin avtomatik ishga tushadi, frozen-zona tegmaydi, faqat bo'sh slotlar to'ldiriladi? (EP-PP-080)
- Siz: Kunlik avtomatik qayta rejalash (kechasi cron) + frozen himoya
- Isbot: grep '@Cron' apps/api/src/modules/pp → 0 natija. pp.plan.dailyReplan cron umuman qurilmagan; faqat sof-mantiq frozen helper bor lekin uni chaqiradigan cron yo'q

**07.6  🟡 qisman**  — ❓ Egasi: MRP — reja tuzilganda avtomatik 'X material yetmaydi, Y kun kerak' ogohlantirish + reorder point + lead time? (EP-PP-006/007/064/065)
- Siz: Material yo'q→avto zayavka+surish; reorder-point+lead-time majburiy
- Isbot: MRP dvigatel REAL: pp-intelligence runMrp + formatMrpResponse netReq/plannedOrders/safetyStock/leadTime hisoblaydi (pp-intelligence.controller.ts:98). AMMO boms=0, bom_items=0 → jonli MRP bo'sh; reorder-point→purchaseRequest avto-zanjir ulanmagan

**07.7  🟡 qisman**  — ❓ Egasi: ATP — buyurtma kelganda avtomatik xom-ashyo+quvvat tekshiruvi, yetmasa qizil + taxminiy sana? (EP-PP-024/066)
- Siz: Buyurtma kiritishda ATP tekshiruvi; va'da sanasi hisoblanadi
- Isbot: mps-atp.handler.ts kümülatif MPS-ATP REAL (cumMPS-cumCO, canPromise, firstNegativePeriod). /pp/intelligence/mps endpoint wired. AMMO SD buyurtma kiritish oqimiga avto-ulanmagan, master data bo'sh (sales_orders/mps demand)

**07.8  🟡 qisman**  — ❓ Egasi: CRP — stanok quvvati yetmasligi 'bu hafta 120% yuklama' qizil + OEE/efficiency koeffitsienti? (EP-PP-008/051)
- Siz: Yuklama foizi + samaradorlik koeffitsienti (efficiency_rate) reja qo'llaydi
- Isbot: pp-crp.service.ts REAL: work_centers.efficiency_rate (OEE) × hours, utilizationPct, isOverloaded/isBottleneck. work_centers.efficiency_rate ustuni mavjud. AMMO pp_routing_operations=0 → jonli yuklama hisoblanmaydi (demand yo'q)

**07.9  🔑 egasi-data**  — ❓ Egasi: AI 7-qadam zanjir (talab→texkarta/BOM→MRP→CRP→ketma-ketlik→smena→AI optimizatsiya), 7-qadam egasi kalitisiz soxta reja yozmaydi? (E3, EP-PP-130/131)
- Siz: AI 7-qadam orkestratsiya; AI tavsiya, inson tasdiqlaydi; kalit egasi beradi
- Isbot: pp-ai-planning.service.ts: 1-6 qadam REAL (MPS/MRP/CRP'dan jonli o'qiydi), 7-qadam pending_ai_key (GEMINI/OPENAI/ANTHROPIC kaliti kutadi, soxta reja yo'q). /pp/intelligence/ai-plan/skeleton wired

**07.10  ✅ bor**  — ❓ Egasi: gofra/sloy 3-formula konversiya (kg↔m²↔list) — markazlashgan, take-up/waste/GSM koeffitsienti bilan? (CHAT §29, gofra vizyon)
- Siz: Gofra qatlam aralashtirish muammosi → markaziy konversiya dvigateli
- Isbot: gofra-conversion.service.ts sof 3-formula dvigatel (Formula 1+2+3, waste/take-up/GSM param, ÷0→Err, NaN himoya). pp_flute_types=5 qator (take_up_factor). GofraConversionController wired

**07.11  🟡 qisman**  — ❓ Egasi: smena hisobotida 4 raqam (План/Факт выработка / Остал.сд-ть / Брак сони) — har smena yopilishida kiritiladi? (EP-PP-092)
- Siz: Real 25-04.xlsx 4 maydon; smena oxirida majburiy hisobot
- Isbot: production-shift-reports.controller.ts REAL CRUD+close+downtime; DTO: planned_qty/actual_output/reject_qty(brak)/downtime_min. AMMO mes_shift_handovers=0, jonli hisobot kiritilmagan; 'Остал.сд-ть'(qolgan) maydoni aniq emas

**07.12  ❌ yo'q**  — ❓ Egasi: brak kiritilganda qayta-chiqarish vazifasi avtomatik rejaga qo'shiladi (yetishmovchilik=buyurtma−(fakt−brak))? (EP-PP-093)
- Siz: Brak→butun partiya qayta ishlash→reja avto qayta-chiqarish vazifa
- Isbot: grep 'reproduce|brak.reproduce|scrapNorm' PP module'da pp.brak.reproduce avtomatik vazifa yaratish logikasi topilmadi; production_orders.scrap_quantity/defective_qty ustun bor lekin reproduce-trigger yo'q

**07.13  🟡 qisman**  — ❓ Egasi: reja-fakt og'ish sababi MAJBURIY kodli — kitobning aniq 5 guruhi (material yo'qligi/dastgoh buzilishi/kadr/texno-xato/reja noto'g'ri)? (EP-PP-055)
- Siz: Izohsiz yopilgan reja=bajarilmagan; 5-sabab guruhi master-data
- Isbot: production.dto.ts downtime category enum = ['mechanical','electrical','material','operator','other'] — generic, kitobning AYNAN 5-guruhi EMAS; alohida reason_code master-data jadval/seed topilmadi

**07.14  🟡 qisman**  — ❓ Egasi: har buyurtma menejerga bog'lanadi, tayyorlik/kechikish o'zgarishida menejerga avtomatik xabar (u mijozga aytadi)? (EP-PP-098)
- Siz: Менеджер buyurtmaga bog'lanadi; kechikishda avto-xabar→CRM/Telegram
- Isbot: production_orders.responsible_manager_id ustuni bor (bog'lanish mumkin), AMMO pp.order.managerNotify event/listener PP'da topilmadi — kechikishda avto-xabar zanjiri qurilmagan

**07.15  🟡 qisman**  — ❓ Egasi: smena rejasi — har slotda operator + yordamchi (2 rol), norma/fakt ikkisiga hisoblanadi? (EP-PP-072/073)
- Siz: Smena×stanok×buyurtma×ishchi; Оператор+Помошник 2 alohida rol
- Isbot: employee_work_centers + erp_shift_calendars + work-centers.service bor; shift report worker_id bog'laydi. AMMO operator+yordamchi 2-rol slot strukturasi aniq qurilmagan; smena rejasi jadvali bo'sh

**07.16  🟡 qisman**  — ❓ Egasi: norma avtomatik kalibrlash — reja davomiyligi (norma×tiraj+setup) vs fakt og'ishi >X% bo'lsa tizim normani qayta ko'rishni tavsiya qiladi? (EP-PP-041/135)
- Siz: Reja-fakt tahlili → o'z-o'zini kalibrlash → keyingi oy normalari
- Isbot: learning-curve.service.ts + scheduling capacity bor; update-work-center-norms.command mavjud. AMMO avtomatik kalibrlash (og'ish>X%→tavsiya) cron/event topilmadi; fakt data (mes sessions=8) yetarli emas

**07.17  🟡 qisman**  — ❓ Egasi: stanok master-data — aniq 22+ stanok (flekso/ofset/post-press) nom+tur+format+quvvat bilan? (EP-PP-046/121)
- Siz: Real Bandlik.xlsx 22+ stanok aniq kiritiladi
- Isbot: pp_work_centers=12 qator (kod/nom/tur/capacity/cost_per_hour/required_skill). Struktura REAL, lekin 22+ to'liq stanok ro'yxati kiritilmagan (12<22); format chegarasi/OEE ustuni pp_work_centers'da yo'q

**07.18  🟡 qisman**  — ❓ Egasi: buyurtma statuslari to'liq sikl (Reja→Tasdiqlangan→Ishga tushgan→Jarayonda→Sifatda→Tugadi→Yopildi + Bekor/To'xtatilgan)? (EP-PP-026/082/118)
- Siz: To'liq hayotiy sikl + har o'tish kim/qachon jurnal
- Isbot: production_orders.status jonli faqat 3 qiymat (completed/paused/in_progress); production-order.aggregate'da release/holat bor lekin to'liq 7-bosqich sikl + o'tish jurnali kanonik master sifatida tasdiqlanmadi

**07.19  🟡 qisman**  — ❓ Egasi: papka № avtomatik (2024-0499 format: yil-ketma-ket), yil prefiksi bilan, qidiruv/arxivga mos? (EP-PP-103)
- Siz: Tizim avto papka № beradi; yil almashuvida prefiks yangilanadi
- Isbot: papka_orders + mes_papka_orders jadvallari mavjud (memory: messaging-conflated VIEW); production_orders.order_number bor. AMMO yil-ketma-ket avto-raqamlash (yil prefiks) generatori PP'da tasdiqlanmadi

**07.20  🟡 qisman**  — ❓ Egasi: 3 avtomatik taymer (ketgan kun / qolgan kun / boshlanmagan kun) + buyurtma tayyorligi % (bajarilgan bo'limlar÷jami)? (EP-PP-099/100)
- Siz: Real Bandlik/ketgan kun.xlsx 3 maydon avtomatlashtiriladi
- Isbot: production_orders.progress ustuni bor (tayyorlik %); planned/actual start/end ustunlari taymer hisobiga zamin. AMMO 3 ta avto-taymer (ketgan/qolgan/boshlanmagan kun) hisoblash logikasi alohida tasdiqlanmadi

**07.21  🟡 qisman**  — ❓ Egasi: kutish zonasi — boshlanmagan buyurtmalar sabab bilan (material/maket/qolip/tasdiq), sabab o'zgarganda audit+menejer xabar? (EP-PP-101/124)
- Siz: Reja boshlash gate: maket+texkarta+material uchchasi yashil
- Isbot: production_orders status (paused) + maket_approved/lab_approved gate flaglari bor; mro-stop/wms-goods-issued/design-approved listenerlar wired. AMMO 'kutish zonasi' + sabab-bilan dashboard + 3-shart startGate majburiy darvoza sifatida to'liq ulanmagan

**07.22  ❌ yo'q**  — ❓ Egasi: takror buyurtma (повтор) eski texkartani chaqiradi, faqat tiraj/muddat yangilanadi; o'tgan yil fakti tarixdan ATP tavsiya? (EP-PP-104/106)
- Siz: Katalogdan eski texkarta chaqiriladi; tarix-asosli ATP
- Isbot: technology_cards.based_on_orders_count/average_actual_duration ustunlari bor (zamin), AMMO takror-buyurtma chaqirish (pp.order.repeat) + o'tgan-fakt-tavsiya (pp.history.factSuggest) logikasi topilmadi; technology_cards=1 qator

---

## 08 — MES / Ishlab chiqarish  (vizyon 62%, 20 savol)

> MES dvigateli kuchli qurilgan: REAL OEE (mes_sessions+downtime_events, "yashil-yolg'on" tuzatilgan), hop3 bosqich (setup/main/teardown production_sessions'da), LMS-sertifikat HARD-BLOCK, TB chek-list darvozasi (sozlanmagan=BLOK fail-safe), SOS org-zanjir eskalatsiya cron (parent_id bo'ylab usta→bo'lim→direktor), MES→QC/HR-360/WMS-FG/ЦКП event listenerlari HAMMASI real (no-op emas, idempotent), downtime sabab kodlari seed (7), tablet operator oqimi to'liq (login/sessiya/crew/material-kit/inline-QC/handover/defect/downtime). ENG KATTA BO'SHLIQ = MASTER-DATA va DATA: stansiya/mashina normasi (норма штук 1час/12час, EP-MES-034/072) bo'sh — work_center_capacity=0, material_norms faqat sarf-normasi; faqat 7 DEMO jihoz (kitobdagi ~30 mashina YO'Q); operator×mashina malaka matritsasi (EP-MES-054) yo'q; norma versiya+2-imzo (РД-4+direktor, EP-MES-055/056) jadval yo'q; handover/SOS/evaluation jadvallari 0-qator (mexanizm bor, data yo'q); "operator" roli rollarda yo'q. Egasi-data: norma qiymatlari, mashina ro'yxati, НО-mas'ullar, smena vazn-koeffitsiyentlari.

**08.1  ✅ bor**  — ❓ Siz dedingiz: OEE har mashina/smena uchun REAL hisoblanadi (soxta ~100% emas) — A×P×Q, downtime chegirilib. Shundaymi?
- Siz: Real OEE = Availability×Performance×Quality, setup/downtime productive vaqtdan chegiriladi; ilgari hammasi ≈100% soxta edi.
- Isbot: get-oee.handler.ts:138-145 runTime=planned−downtime, ratio() clamp[0,1], div-by-zero guard; mes.gateway.ts WS oee:update cron push.

**08.2  ✅ bor**  — ❓ Sessiya 3-bosqich (tayyorgarlik/sozlash→asosiy→yakunlash) alohida vaqt o'lchaydimi (EP-MES-001/048)?
- Siz: hop3 — setup/main/teardown alohida soniyalar, OEE Availability to'g'ri bo'lishi uchun.
- Isbot: production-session.aggregate.ts:85-87 GsdStage SETUP/MAIN/TEARDOWN, advanceStage(); DB production_sessions setup_seconds/main_seconds/teardown_seconds/current_stage ustunlar.

**08.3  ✅ bor**  — ❓ Mustaqil ishlash ruxsati (LMS sertifikat) bo'lmasa sessiya BLOKLANADIMI (EP-MES-052/15)?
- Siz: Faqat 'mustaqil ruxsat' bayrog'i bor xodim sessiya ochadi; attestatsiya o'tmagan = blok, HR ogohlantirish.
- Isbot: start-session.handler.ts:41-60 getCertificationRequired→checkOperatorCertification→Err FORBIDDEN; lms_test_attempts+course_progress real dalil.

**08.4  ✅ bor**  — ❓ TB/smena-tayyorlik chek-listi to'liq to'ldirilmasa sessiya mutlaqo bloklanadimi (EP-MES-008/tav.8)?
- Siz: Chek-list to'liq bo'lmasa sessiya mutlaqo bloklanadi; sozlanmagan ham blok.
- Isbot: iot-tablet.controller.ts:327-348 majburiy checklist_items, items.length===0→422 BLOCKED (fail-safe), incomplete>0→422; start-session.handler.ts:66-78 passChecklist gate.

**08.5  ✅ bor**  — ❓ MES sessiya yakunida QC final-inspection event-driven (real-time event) ochiladimi, cron emas (EP-MES-041)?
- Siz: MES event → QC final gate'ga push; trigger real-time MES event, QC cron emas.
- Isbot: complete-session.handler.ts:71 eventBus MesCompletedEvent; qc/mes-completed.listener.ts:99-113 REAL INSERT qc_inspections (pending, idempotent NOT-EXISTS) — ilgari no-op edi.

**08.6  🟡 qisman**  — ❓ Sessiya natijasi operator KARTASIGA / ЦКП'ga yoziladimi (karta-model, EP-MES-019/020)?
- Siz: Har sessiya natijasi operator kartasiga (GSD/ЦКП); yozilmasa oylik/reyting ishlamaydi; yaroqli=umumiy−brak.
- Isbot: ckp-mes-feed.listener.ts:118 recordFact(goodQty=actual−defect) REAL ulangan; LEKIN cardId NULL=skip (operator↔karta/work-center↔karta bog'lanmagan=egasi-data) — mexanizm bor, real karta-linki yo'q.

**08.7  ✅ bor**  — ❓ SOS javob kelmasa org-sxema bo'ylab (usta→bo'lim→direktor) avto-eskalatsiya bo'ladimi (EP-MES-009/018)?
- Siz: Bosqichli eskalatsiya, vaqt o'tsa avto org-zanjir (vertikal, sakramaydi); 15daq→usta, 30daq→direktor.
- Isbot: mes-sos-escalation.cron.ts:25 @Cron('*/2') escalateOverdue, org_departments.parent_id bo'ylab keyingi darajaga, escalation_due_at deadline; SosAlertRaisedEvent emit+bridge.

**08.8  🟡 qisman**  — ❓ Downtime sabab kodlari boy master-data (rejali/rejasiz/sifat ajratilgan) bormi (EP-MES-010/011/012)?
- Siz: Karton/qadoq sexiga xos 15-25 kod (настройка/переделка/ремонт/колиб/иш-йук), har kodga rejali/rejasiz/sifat turi.
- Isbot: mes_downtime_reasons=7 qator (DT-MECH/MAT/SETUP/MAINT/QUAL/SHIFT, category+is_planned bor) — struktura+ajratish to'g'ri, lekin kitobdagi to'liq 15-25 kod (qolib/переделка/иш-йук) seed qilinmagan.

**08.9  🟡 qisman**  — ❓ Smena handover ikki taraf imzolamaguncha smena 'yopiq' bo'lmaydimi (EP-MES-023/046)?
- Siz: Rasmiy handover yozuvi, keyingi smena tasdiqlamaguncha smena rasmiy yopilmaydi; arbitr=smena boshlig'i.
- Isbot: mes/shifts/handover + iot tablet/handover REAL INSERT shift_handovers; close-evaluation bor; LEKIN shift_handovers=0 qator, 'ikki-imzo bo'lmaguncha yopiq' invariant kodda ko'rinmadi — forma bor, oqim/data yo'q.

**08.10  🟡 qisman**  — ❓ Smena bali vaznli (OEE+reja-fakt+brak+sarf) hisoblanib bonus/reyting/Payroll'ga ulanadimi (EP-MES-026/027/030)?
- Siz: Vaznli ball→A/B/C toifa→bonus avto-hisob (HR tasdiq→Payroll); bonus A=belgilangan X so'm.
- Isbot: shifts/close-evaluation production/quality/safety_score saqlaydi, gamification/leaderboard bor; LEKIN shift_evaluations=0, vazn-koeff egasi-data, Payroll-bonus zanjiri MES'da tasdiqlanmadi.

**08.11  ❌ yo'q**  — ❓ Stansiya unum-normasi (норма штук 1час+12час, м2/лист/удар birlik, pog'onali) master-data'mi (EP-MES-034/035/072)?
- Siz: Станоклар норма: har stansiyaga soatlik+12-soatlik norma, o'z birligi (м2/лист/штук/удар), pog'onali (400-3000).
- Isbot: work_center_capacity (shifts/hours/machines struktura bor) = 0 qator; material_norms = SARF-normasi (per_1000), stansiya unum-normasi EMAS; getWorkCenterNorms endpoint bor lekin data yo'q.

**08.12  🟡 qisman**  — ❓ Aniq mashina ro'yxati (~30: Гф/SM-52/KBA-105/Тигель 1-10/ФСМ...) master-data'mi (EP-MES-039/040)?
- Siz: Kitobdagi to'liq ~30 mashina, Тигель 1-10 alohida birlik, mashina+bo'lim birikmasi.
- Isbot: equipment=7 qator, hammasi DEMO (Ofset #1 DEMO, Offset 1/2, Flexo 1, Qirqish, Laminatsiya, Raqamli) — kitobdagi ~30 mashina/Тигель 1-10/ФСМ kiritilmagan.

**08.13  ❌ yo'q**  — ❓ Operator×mashina malaka matritsasi bor-yo'qligi tekshiriladimi (faqat mos mashinaga, EP-MES-054)?
- Siz: Operator×mashina matritsasi (ishlay oladi/o'rganmoqda/yo'q); noto'g'ri mashina=texkarta bloki+ogohlantirish.
- Isbot: skill/operator-matrix jadval topilmadi; sessiya ochishda mashina-malaka tekshiruvi yo'q (faqat LMS); 'operator' roli roles'da umuman yo'q (IOT_READ=super_admin/director/.../technologist).

**08.14  ❌ yo'q**  — ❓ Norma o'zgarishi РД-4+direktor tasdig'idan o'tib versiyalanib saqlanadimi (EP-MES-055/056/029)?
- Siz: Norma 2-bosqichli imzo (РД-4+Ген.Директор)+sana versiya; o'tgan smena o'sha paytdagi norma bilan baholanadi; faqat keyingi smenadan kuch.
- Isbot: norma versiya/imzo-zanjir jadvali (station_norms_version/mes_norms) topilmadi; work_center_capacity'da valid_from/valid_to bor lekin imzo-tasdiq oqimi va data yo'q.

**08.15  🟡 qisman**  — ❓ Material sarfi real-time WMS'dan chegirilib GL'ga yoziladimi, akt 2-imzosiz blok (EP-MES-006/013/49-akt)?
- Siz: Avto-hisob+operator tasdiq→WMS real-time chegirma+GL; akt 2 imzosiz material chiqmaydi=blok.
- Isbot: mes/material-consumption + tablet/material-return REAL INSERT (mes_material_consumption=1, material_movements); LEKIN WMS real-time chegirma+GL tannarx yozuvi va 2-imzo-blok MES tomonida tasdiqlanmadi.

**08.16  🟡 qisman**  — ❓ AI kunlik smena xulosasi (top yo'qotish+brigada reyting+takror sabab, darajaga moslashgan) bormi (EP-MES-079/028/045)?
- Siz: AI kunlik xulosa+anomaliya; kamera 20daq to'xtashni MES'siz aniqlasa anomaliya belgilaydi; direktorga qisqa/bo'lim o'rta/smena to'liq.
- Isbot: ai-agents/mes/mes-monitor.service.ts REAL (OEE z-score anomaliya, AI_AUTO_STOP, AiDecisionLog)+agents/production-agent.service.ts bor; LEKIN darajaga-moslashtirilgan kunlik hisobot va kamera↔MES nomoslik-anomaliyasi to'liq tasdiqlanmadi.

**08.17  🟡 qisman**  — ❓ Materiallar partiyasi (lot/rulon, FIFO/FEFO, foiz-hissa) har sessiyada kuzatiladimi (EP-MES-029/065/066)?
- Siz: Har sessiyada ishlatilgan partiya/rulon+format+gramm; har partiyaga alohida satr+foiz hissa; brak→qaysi partiya/yetkazuvchi.
- Isbot: recordMaterialConsumption(batch_number, unit) qabul qiladi; LEKIN Заявка бумаги↔sarf taqqos, per-partiya foiz-hissa, format/gramm/kg ustunlari MES sessiyada yo'q.

**08.18  🟡 qisman**  — ❓ Buyurtma PP rejadan avto-tushadimi (ro'yxatdan tanlash, SD FK), reja-fakt 4 maydon vaqt bog'liq (EP-MES-024/032/057)?
- Siz: Reja PP'dan avto, operator ro'yxatdan oladi (qo'lda termaydi), SD sales_orders FK, 4 maydon reja/fakt vaqt.
- Isbot: production_sessions.production_order_id→production_orders→work_center; getOrders/getProductionOrderById bor; LEKIN tablet createSession production_order_id=0 hardcode (ba'zi yo'l), SD sales_orders FK+4-maydon reja/fakt MES'da to'liq emas.

**08.19  🟡 qisman**  — ❓ Jonli sex tablosi (mashina rangli holat+jonli OEE) va 'kim qaysi mashinada' bandlik bormi (EP-MES-016/043)?
- Siz: To'liq jonli tablo (mashina rangli holat+jonli OEE/miqdor)+operator→mashina jonli jadval; har 1-5 daq yangilanish.
- Isbot: mes.gateway.ts WS oee:update/shift:handover push REAL; FE IoTProductionDashboard+ERPProduction+MESDowntimes bor; LEKIN sex-wide rangli tablo + operator↔mashina jonli matritsa ekrani tasdiqlanmadi.

**08.20  ✅ bor**  — ❓ IoT'siz (faqat operator qo'lda kiritishi) bugundan ishlaydimi, keyin IoT qo'shilsa avto (EP-MES-080/002)?
- Siz: To'liq qo'lda kiritish (sensor shart emas), bosqich operator tugmasi bilan; IoT qo'shilsa avto.
- Isbot: iot-tablet.controller.ts to'liq qo'lda oqim: start/stop/defect/downtime/crew/inline-qc hammasi operator-input; mes_telemetry=384 (kanal bor), sensor majburiy emas.

---

## 09 — QC / Sifat  (vizyon 58%, 22 savol)

> QC — EuroPrint'dagi eng KO'P qurilgan modul (struktura jihatdan): 9 controller / 87 endpoint, 30+ jadval, REAL domen-xizmatlar (AQL ISO 2859-1, Delta-E CIEDE2000, DPMO/Six Sigma, SPC Cp/Cpk, grade-pricing, FMEA, sertifikat PDF pdf-lib) va REAL oltin-ip event-ulanishi (MES→QC inspeksiya ochish, QC-passed→WMS FG kirim nav-narx bilan, QC-rework→PP, QC-fail→MM supplier + notifications). LEKIN data deyarli BO'SH (qurilish bosqichi): qc_inspections=4, reclamations=1, defects=0, aql_config=0, parameter_definitions=0, severity_weights=0, standards=0, certificates=0 — ya'ni 3-way qaror/AQL/grade kodda tayyor, lekin master-data (AQL darajasi, parametr-tolerans, koeffitsient qiymatlari) EGASIDAN kutadi. ❌ JONLI YO'Q: oziq-ovqat/makulatura bloki (EP-QC-016/092 — QC modulida umuman yo'q), kalibrovka jadvali (EP-QC-073/131), qc_material_scan_log (EP-QC-011/114), CAPA-ish-oqimi (EP-QC-127 — faqat Cp/Cpk "capability", korrektiv CAPA emas), qc_norm_versions (EP-QC-115/039-snapshot), qc_internal_audits (EP-QC-128), 4-nuqta checkpoint-strukturasi (yassi bitta inspeksiya qatori). 🟡 supplier-reyting formula placeholder (currentRating=5 hardcode). Halol baho: poydevor/dvigatel kuchli (~80%), data+ba'zi vizyon-jadvallar yetishmaydi → umumiy ~58%.

**09.1  🟡 qisman**  — ❓ Siz 4 nuqtada (kirim→bosma→biriktirish→final) bosqichma-bosqich QC darvozasi dedingiz (EP-QC-001) — har bosqich alohida ushlab qoladimi?
- Siz: РД-5 босқичма-босқич: har bosqichda alohida inspeksiya + gate; faqat tayyor mahsulotda emas
- Isbot: qc_inspections yassi bitta qator (id,order_id,status,reference_type) — 4-bosqich checkpoint-strukturasi YO'Q; reference_type bilan farqlanadi, gate-bosqich emas

**09.2  ✅ bor**  — ❓ Siz har brakka 3 qaror dedingiz: QABUL / REWORK→MES / CHIQARISH (EP-QC-010/041) — kodda ishlaydimi?
- Siz: POS Q31: QABUL→ombor, REWORK→MES qayta ishlash, CHIQARISH→ta'minotchiga; har biri sabab+ruxsat bilan
- Isbot: submit-inspection.handler.ts:26-77 — pass/rework/fail 3-yo'l, har biri QcPassedEvent/QcReworkEvent/QcFailedEvent publish (atomik tranzaksiyada)

**09.3  ✅ bor**  — ❓ Siz 'final o'tdi→WMS/SD jo'natish ochiladi, o'tmasa karantin' dedingiz (EP-QC-008/029/065) — event-driven ulanganmi?
- Siz: QC darvozasi: o'tdi→keyingi bosqich/ombor; sertifikat/QC tasdiqsiz chiqim blok
- Isbot: wms/qc-passed.listener.ts:40-172 — QcPassedEvent→ReceiveFgCommand (FG warehouse_stock UPSERT + rental timer). Sertifikatsiz-chiqim qattiq-blok (065) alohida tasdiqlanmadi

**09.4  ✅ bor**  — ❓ Siz MES 'tayyor' bo'lsa avtomatik QC inspeksiyasi ochiladi dedingiz (EP-QC-012/029) — MES→QC no-op stub edi, qurildimi?
- Siz: MesOperationCompleted→QC pending inspeksiya; chetlash qilinsa ogohlantirish
- Isbot: mes-completed.listener.ts:99-113 — MesCompletedEvent→qc_inspections PENDING INSERT (idempotent NOT EXISTS), production_card_id ulanadi; +onModuleInit backfill. Avval no-op edi (memory)

**09.5  🔑 egasi-data**  — ❓ Siz AQL (ISO 2859) namuna olish + Ac/Re qabul/rad chegarasi dedingiz (EP-QC-003/054/056) — hisoblanadimi?
- Siz: Standart AQL jadvali: partiya hajmiga qarab namuna + Ac/Re; AQL darajasi egasidan
- Isbot: qc-aql.service.ts — ISO 2859-1 to'liq AQL_SAMPLING_TABLE real hisoblash kodi bor; lekin qc_aql_config=0 qator (egasi AQL darajasi/tolerans bermagan)

**09.6  🟡 qisman**  — ❓ Siz 2-sort qarorida narx koeffitsienti (0.7 yoki sozlanadigan) AVTOMATIK qo'llanadi dedingiz (EP-QC-018/072) — ishlaydimi?
- Siz: Sort darajalari (1/2/3/brak) + narx koeffitsienti; menejer qo'lda emas, avtomatik
- Isbot: grade-pricing.service.ts + qc-passed.listener.ts:142 graded=base×koeff REAL qo'llanadi; qc_grade_price_coefficients=4 qator. Lekin kredit-nota/entries avto-yozish (018) tasdiqlanmadi

**09.7  ✅ bor**  — ❓ Siz har QC qaror imzo + lab natijasi → sertifikat PDF (raqamli kod) dedingiz (EP-QC-014/060/111) — chiqadimi?
- Siz: Avtomatik sertifikat: SF-YYYY-NNNNN ketma-ket, lab natijalari jadvali, QR, imzo bloki
- Isbot: qc-certificate-pdf.service.ts — pdf-lib real PDF, SF-<YYYY>-NNNNN qc_certificate_seq atomar nextval, qc_lab_tests dan real o'qish. qc_certificates=0 (hali ishlatilmagan)

**09.8  ❌ yo'q**  — ❓ Siz oziq-ovqat buyurtmasiga makulatura-asosli material tanlansa QATTIQ BLOK dedingiz (EP-QC-016/092/116) — bormi?
- Siz: крафт макулатура→озиқ-овқатга ЭМАС; целлюлоза→mos; texkarta darvozasi + QC takror tekshiradi
- Isbot: QC modulida 'food/oziq/makulatura/recycled' bo'yicha 0 fayl (grep); faqat remaining/waste.* (aloqasiz). Bu vizyon-qoida JONLI qurilmagan

**09.9  ❌ yo'q**  — ❓ Siz kalibrovka muddati o'tgan asbob bilan o'lchov bloklanadi + bayroq dedingiz (EP-QC-020/073/131) — bormi?
- Siz: Har asbob: kalibrovka sanasi+muddat; muddat o'tsa keyingi natija blok, eski natija bekor emas
- Isbot: q.cjs: kalibrovka jadvali topilmadi (faqat ai_calibration_runs — AI model, asbob emas); instrument_calibration_expired bayrog'i yo'q

**09.10  ❌ yo'q**  — ❓ Siz har rulon scan→qc_material_scan_log, reklamatsiyada aybdor lot avto-aniqlanadi dedingiz (EP-QC-011/032/114) — bormi?
- Siz: qc_material_scan_log {order_id,material_lot_id,stanok_id,smena_id,scan_ts}; FIFO-skan ildiz-lot
- Isbot: q.cjs: qc_material_scan_log jadvali yo'q; traceability uchun wms_supplier_traceability bor lekin rulon-scan log emas

**09.11  ❌ yo'q**  — ❓ Siz takrorlanuvchi defekt chegaradan oshsa AVTOMATIK CAPA ishi (Совершенствование Kanban) ochiladi dedingiz (EP-QC-013/127) — bormi?
- Siz: Takror→тизимли муаммо→CAPA Kanban 'Yangi' ustun, mas'ul+muddat, 3 rollover→direktor eskalatsiya
- Isbot: qc da 'capa' hitlari faqat process-CAPABILITY (Cp/Cpk, spc/fmea); korrektiv-CAPA ish-oqimi/jadvali yo'q; qc_root_causes=0 qator

**09.12  🟡 qisman**  — ❓ Siz Pareto + DPMO/sigma sifat trendi avtomatik dedingiz (EP-QC-018/020/077) — hisoblanadimi?
- Siz: DPMO+sigma (modul/smena/mahsulot kesim) + Pareto (eng ko'p brak sababi)
- Isbot: dpmo.service.ts + qc-dpmo.controller.ts REAL DPMO/Six-Sigma/Cp-Cpk; lekin defects=0/spc_data=0 (data yo'q), Pareto-endpoint alohida tasdiqlanmadi

**09.13  🟡 qisman**  — ❓ Siz AI VLM kamera har 2 soat etalon↔rasm: >0.85 avto-o'tdi, 0.60-0.85 inson, <0.60 anomaliya dedingiz (EP-QC-024/030/126) — bormi?
- Siz: VLM confidence praglari (sozlanadigan) + Delta-E>3 anomaliya + Telegram bildirishnoma
- Isbot: ai-agents/qc/vision-qc.service.ts REAL (AiRouter+confidence threshold+verdict) + delta-e.service.ts CIEDE2000 REAL; lekin camera_quality_defects=0, har-2-soat cron + Telegram alohida tasdiqlanmadi

**09.14  🟡 qisman**  — ❓ Siz yetkazib beruvchi reyting (sifat 40%+muddat 30%+narx 20%+hujjat 10%, 6oy oyna) real-time dedingiz (EP-QC-004/078/098) — bormi?
- Siz: QcIncomingInspectionCompleted→supplier reyting, sliding window 6 oy, 4-faktor formula
- Isbot: mm/supplier-quality-fail.listener.ts bor lekin currentRating=5 // placeholder (formula yo'q); qc_supplier_quality=0 qator. 6oy-oyna 4-faktor formula qurilmagan

**09.15  🟡 qisman**  — ❓ Siz reklamatsiya to'liq kartasi (mijoz+buyurtma+partiya+defekt+ildiz+yopilish) + SLA timer dedingiz (EP-QC-011/043/045) — bormi?
- Siz: qc_reclamations to'liq forma + status zanjiri + SLA (1/3/10 kun) + eskalatsiya
- Isbot: qc_reclamations jadval + create-reclamation.handler + qc-reclamations.controller REAL (CRUD); lekin data=1 qator, SLA-timer/eskalatsiya cron alohida tasdiqlanmadi

**09.16  🟡 qisman**  — ❓ Siz operator o'z-nazorat checklisti + pre-production checklist to'ldirilmaguncha MES boshlanmaydi (hard block) dedingiz (EP-QC-022/105) — bormi?
- Siz: Operator o'z-tekshiruv + pre-production checklist (material+qolip+fayl+namuna+грамаж) to'ldirilmaguncha ishlab chiqarish ochilmaydi
- Isbot: qc_checkpoints jadval bor lekin=0 qator; checklist→MES-gate hard-block ulanishi JONLI tasdiqlanmadi (data yo'q, blok-listener ko'rinmadi)

**09.17  🟡 qisman**  — ❓ Siz brak% operator GSD/oyligiga ulanadi (miqdor+sifat birga) dedingiz (EP-QC-023/121) — ulanganmi?
- Siz: Oylik=norma%+brak%; yuqori brak bonusni kamaytiradi; karta GSD'ga oqadi
- Isbot: qc_braks jadval bor; lekin brak→GSD→payroll event-ulanishi QC modulida tasdiqlanmadi (defects=0, GSD-event listener ko'rinmadi) — egasi-data + ulanish kutadi

**09.18  🟡 qisman**  — ❓ Siz buyurtma '100% tayyor' faqat final QC 'o'tdi' bilan + yopilishda yakuniy xulosa dedingiz (EP-QC-117/124) — sinxronmi?
- Siz: Yolg'on tayyorlik yo'q; buyurtma yopilishida avtomatik yakuniy sifat xulosasi
- Isbot: QcPassedEvent oqimi bor; lekin tayyorlik%↔final-QC qattiq-sinxron va buyurtma-yopilish yakuniy-xulosa event-trigger alohida tasdiqlanmadi

**09.19  ✅ bor**  — ❓ Siz defekt lug'ati ko'p-tilli (UZ lotin+kirill+RU, fabrika atamasi) klassifikator master-data dedingiz (EP-QC-004/037/110/130) — bormi?
- Siz: Tasniflangan kodli defekt ro'yxati (delaminatsiya/намлик/грамаж og'ish...) 3-tilda, kitobdan import
- Isbot: defect_catalog=23 qator (seed bor — gofra/offset/silkscreen/flexi, CLAUDE.md seed). Klassifikator REAL to'ldirilgan

**09.20  🟡 qisman**  — ❓ Siz tekshiruvni o'tkazib yuborish (override) faqat sifat boshlig'i/direktor + RBAC qc:override + skip-aniqlash dedingiz (EP-QC-082/119) — bormi?
- Siz: qc:override permission kodi, kunlik limit 3, skip avto-aniqlash (kim sababchi)
- Isbot: Controllerlarda RequirePermission('qc.*') + PermissionGuard REAL; lekin qc:override permission kodi, kunlik-limit-3 va skip-aniqlash event JONLI tasdiqlanmadi

**09.21  🟡 qisman**  — ❓ Siz karantin (har kirim/tayyor partiya→karantin→QC tasdiqi→yaroqli/brak/2-sort) dedingiz (EP-QC-009/068/071) — bormi?
- Siz: EXTERNAL_IN→karantin→QC chiqarsa asosiy ombor; QUARANTINE/QC/DEFECTIVE zona
- Isbot: POS/WMS QUARANTINE/DEFECTIVE ombor-turlari modeli bor (memory); lekin QC-qaror↔karantin-status avtomatik o'tish QC modulida JONLI tasdiqlanmadi

**09.22  ❌ yo'q**  — ❓ Siz sertifikat amal muddati cron kuzatiladi + tugashda SD-buyurtma bloklanadi dedingiz (EP-QC-128/134) — bormi?
- Siz: Cron tunda tekshiradi; muddat o'tsa o'sha sertifikat-kerakli mahsulot buyurtmasi blok; SD da ham
- Isbot: Sertifikat-muddat cron + SD-buyurtma blok JONLI topilmadi; qc_certificates=0, muddat-kuzatuv-cron ko'rinmadi; qc_internal_audits jadvali ham yo'q

---

## 10 — Warehouse / Ombor  (vizyon 62%, 17 savol)

> WMS modulning DVIGATEL (mantiq) qatlami egasi vizyoniga juda mos qurilgan: karantin darvozasi (QC_PASS dan keyin MAIN), FIFO/FEFO partiya tanlash (muddati o'tgan BLOK), atomik chiqim+ledger+event, texkarta/gofra-qavat hard-gate, manfiy qoldiq SQL-darajada blok, og'irlik tolerantligi ±2% — barchasi REAL, sof domen servislari + Result<T> + tranzaksiya bilan yozilgan va goods-issue oqimiga ulangan. 48 controller ro'yxatga olingan. LEKIN: (1) DATA bo'sh — rulon_cards=0, batch_lots=21 (faqat test), tech_card_bom=0 (texkarta-gate amalda fail-open), warehouse_rolls=0, low_stock_alerts=0, rental=0 → mexanizm bor, biznes-data yo'q (qurilish bosqichi). (2) Vizyonning ba'zi model-tanlovlari boshqacha: EP-WMS-021 "material_reservations alohida jadval + trigger sync" YO'Q — o'rniga warehouse_stock.available_quantity to'g'ridan tranzaksiyada yangilanadi (oqibat to'g'ri, lekin model farq). (3) GL POS movements uchun pos_gl_postings ga (o'z ledgeri, balanced Dr/Cr, idempotent) yoziladi, kanonik entries ga emas — memory'dagi "ikki GL dunyo" nuance. (4) Ko'p OCHIQ qaror (59/134) egasi-data kutadi: tolerantlik %, reorder formula, ijara tarif, IoT chegara, razryad-matritsa. Xulosa: poydevor-mantiq ~80% mos, real-data ~10%, halol o'rtacha ~62%.

**10.1  ✅ bor**  — ❓ EP-WMS-001/112 — Kanonik zaxira bitta jadval (warehouse_stock), qolgani view; POS Monitor ╳ WMS bir DB?
- Siz: Bitta haqiqat manbai: warehouse_stock kanonik, current_stock = view; POS Monitor va WMS bir xil DB ga yozadi (real-time).
- Isbot: warehouse_stock=37 qator JONLI; current_stock=view mavjud; drizzle-wms.repo.ts:53 reserve/issue warehouse_stock CANONICAL ga yozadi. Memory bilan mos.

**10.2  ✅ bor**  — ❓ EP-WMS-002 — Ombor turlari master-data (MAIN/QUARANTINE/QC/FINISHED/DEPARTMENT...)
- Siz: 6+ standart ombor turi, har biri quarantine/qc bayroqlari bilan.
- Isbot: warehouse_types=9 qator (raw_material/paper_rolls/finished_goods... needs_quarantine,needs_qc,inbound_flow ustunlari to'ldirilgan) JONLI.

**10.3  ✅ bor**  — ❓ EP-WMS-003/016/048 — Kirim oqimi: barcha EXTERNAL_IN avval KARANTIN → QC PASS → MAIN; karantin bloklanadi
- Siz: 5-bosqich: DRAFT→KARANTIN→QC→OMBOR→GL; karantindagi material MAIN ga faqat QC_PASS dan o'tadi, bloklangan.
- Isbot: quarantine-gate.service.ts:85 canPostToMain() — QC_PASS bo'lmasa BUSINESS_RULE_VIOLATION; validateTransition() holat-mashinasi REAL. Sof domen + Result<T>.

**10.4  ✅ bor**  — ❓ EP-WMS-017/070/071 — Karantindan chiqish QC 3-qaror (QABUL/REWORK/CHIQARISH)
- Siz: Faqat QC roli qaror; OK→MAIN, REWORK→MES, CHIQARISH→ta'minotchiga.
- Isbot: quarantine-gate.service.ts:107 resolveQcDecision() QC_DECISION_TO_STATUS mapping bilan har qarorni holatga aylantiradi + o'tish ruxsatini tekshiradi.

**10.5  ✅ bor**  — ❓ EP-WMS-055/018/079 — Chiqimda FIFO/FEFO; muddatli→FEFO, muddatsiz→FIFO; muddati o'tgan BLOK
- Siz: FIFO standart, kley/bo'yoq FEFO; muddati o'tgan partiya chiqarib bo'lmaydi.
- Isbot: batch-selection.service.ts:56 resolveStrategy (anyDated→FEFO), buildPlan:124 muddati o'tgan partiya BUSINESS_RULE_VIOLATION BLOK; goods-issue.handler.ts:123 ulangan. batch_lots=21 (test-data).

**10.6  🟡 qisman**  — ❓ EP-WMS-084/085 — Texkarta-material mosligi + gofra qavat (3╳5) aralashmasligi chiqimda BLOK
- Siz: Texkarta kodi ≠ chiqarilayotgan kod → BLOK; BOM qavat ≠ material qavat → BLOK (топлайнер╳местный, 3/5 qavat).
- Isbot: outbound-enforcement.service.ts to'liq qurilgan (tech_card_bom solishtirish, BLOCK_TECH_CARD/GOFRA_LAYER) + goods-issue.handler.ts:63 ulangan. LEKIN tech_card_bom=0 qator → amalda HAR DOIM fail-open, hech narsa bloklanmaydi (data yo'q).

**10.7  ✅ bor**  — ❓ EP-WMS-056/117 — Manfiy qoldiqdan himoya; brak/karantin material sexga chiqishi qattiq blok
- Siz: Aktivlar→to'liq blok, iste'mol→ogohlantirish; brak status chiqimda tizim ruxsat bermaydi.
- Isbot: drizzle-wms.repo.ts:57 'AND available_quantity >= delta' — SQL-darajada atomik, manfiyga tushmaydi; quarantine-gate canPostToMain blok. FE/API emas, BE+DB darajada.

**10.8  🟡 qisman**  — ❓ EP-WMS-100/021/069 — Material rezervatsiyasi (mavjud−band=erkin); alohida material_reservations jadval + trigger sync
- Siz: Rezerv alohida material_reservations jadvalida, DB trigger warehouse_stock.reserved_qty ni sinxronlaydi; PP/MRP erkin qoldiqni real-time ko'radi.
- Isbot: Rezerv MANTIG'I bor (reserve-material.handler.ts + drizzle-wms.repo.ts:45 reserved↑/available↓ bir tranzaksiyada). LEKIN material_reservations jadvali YO'Q; trigger YO'Q; available_quantity is_generated=NEVER. Model vizyondan farq (tranzaksiya-ichi yangilash, trigger emas).

**10.9  🟡 qisman**  — ❓ EP-WMS-014/032/036 — Rulon kartochkasi (kenglik/diametr/gramaj/og'irlik/uzunlik), noyob ID, qoldiq qayta hisob
- Siz: Har rulon alohida birlik+QR; og'irlik o'zgarsa uzunlik avto-hisob (karton zavodi yadrosi).
- Isbot: rulon-card.service.ts + WmsRollCalcService + RulonCardController to'liq qurilgan (qoldiq qayta hisob, status full→opened→remnant). LEKIN rulon_cards=0 va warehouse_rolls=0 qator → JONLI ishlatilmayapti (data yo'q).

**10.10  🟡 qisman**  — ❓ EP-WMS-109 — Ombor harakatining GL ga avtomatik o'tishi (zaxira Dr/Cr)
- Siz: Har harakat GL provodkasi; AI hisoblaydi (5-bosqich). Memory: kanonik = gl_entries/entries.
- Isbot: POS auto-gl-posting.repository.ts:109 insertPostingsAtomic — balanced Dr/Cr, idempotent, tranzaksiya REAL. LEKIN pos_gl_postings (o'z ledgeri) ga yozadi, kanonik entries(6 qator) ga emas → memory 'ikki GL dunyo' nuance saqlanib qolgan.

**10.11  🟡 qisman**  — ❓ EP-WMS-007/058/131 — Inventarizatsiya: aylanma sanoq + ABC chastota; ish to'xtatilmaydi
- Siz: Tunda/dam olishda, ABC bo'yicha chastota (A-haftalik...); ko'r sanoq.
- Isbot: WmsCountsController + wms-counts.service.ts + inventory_counts=6 qator JONLI. ABC servisi (abc-xyz.service.ts) bor. Ko'r-sanoq/zona-muzlatish ko'p qismi OCHIQ (EP-WMS-059/062) egasi-data.

**10.12  🟡 qisman**  — ❓ EP-WMS-010/064/065 — Min/max/reorder darajalari + avto-ogohlantirish + reorder formula
- Siz: Har materialga 3 daraja, sarfga qarab avto-hisob; reorder = sarf×lead time.
- Isbot: warehouse_stock.reorder_point/max_stock ustunlari bor; rop.service.ts/safety-stock.service.ts/eoq-calculator domen servislari REAL. LEKIN low_stock_alerts=0, min_stock_alerts mavjud lekin formula/chegara OCHIQ (EP-WMS-065 egasi-data).

**10.13  🟡 qisman**  — ❓ EP-WMS-019/020/133 — Ombor-ijara (mijoz moli/davalcheskiy): maydon×tarif oylik schyot, GL daromad
- Siz: To'liq ijara moduli (ijarachi/maydon/shartnoma/oylik haq) Finance ga; mijoz moli qiymatsiz (bizniki emas).
- Isbot: warehouse-rental.service.ts + WarehouseRentalController + warehouse_rental_records/settings jadvallari qurilgan. LEKIN warehouse_rental_records=0 va settings=0 qator; tarif modeli OCHIQ → mexanizm bor, data+tarif yo'q.

**10.14  🔑 egasi-data**  — ❓ EP-WMS-022/094 — Yetkazib beruvchi ishonchlilik reytingi (kechikdi/brak avto-ta'sir)
- Siz: Har kirim avtomatik reytingga ta'sir; past reytingda PO ogohlantirish+signal.
- Isbot: wms_supplier_traceability jadvali mavjud; reyting formulasi (og'irlikli o'rtacha) decisions'da yozilgan lekin kod-tasdiq topilmadi va beruvchi-reyting jonli data yo'q → egasi-data + qurish kerak.

**10.15  🟡 qisman**  — ❓ EP-WMS-013/107/076 — Kunlik stok hisoboti rahbarga avtomatik (CRON); director KPI/aniqlik trend
- Siz: Ertalab avtomatik kunlik hisobot CC orqali; ombor aniqlik% <95 da darhol signal.
- Isbot: dashboard.service.ts + WmsAnalyticsController + warehouse_kpi_cache jadvali + daily_warehouse_plans jadvali bor. LEKIN daily_warehouse_plans=0; kunlik CRON jo'natma jonli tasdiqlanmadi (signal-oluvchi OCHIQ).

**10.16  ❌ yo'q**  — ❓ EP-WMS-127/006/096 — IoT namlik/harorat buzilsa signal; zonadagi zaxira xavf ostida
- Siz: IoT datchik chegaradan chiqsa signal+log; o'sha zonadagi butun zaxira xavf-ostida belgilanadi.
- Isbot: IotEnhancedController + iot-enhanced.service.ts mavjud, lekin memory: IoT anomaly handler no-op; namlik chegara OCHIQ (EP-WMS-127 egasi-data). Zona-xavf belgilash mantig'i jonli topilmadi.

**10.17  ✅ bor**  — ❓ EP-WMS-022/044/027 — ABC tahlil avtomatik (aylanma×qiymat) sanoq chastotasiga bog'lanadi
- Siz: ABC avtomatik (yillik sarf×narx), tsiklik sanash chastotasini belgilaydi.
- Isbot: analytics/abc-xyz.service.ts + inventory-turnover.service.ts REAL domen hisob; wms-catalog ABC; WmsAnalyticsController ulangan.

---

## 11 — MM / Material master  (vizyon 52%, 19 savol)

> MM moduli EuroPrint'dagi eng to'liq qurilgan modullardan biri: 7 controller + 5 listener + CQRS handlerlar feature-modules.ts'da ro'yxatdan o'tgan. JONLI ISHLAYDI: yetkazuvchi master CRUD (mm_vendors=20 qator), PO hayot-tsikli (create/approve/goods-receipt CQRS orqali), 3-way match (rollback + event bilan), direktor-tasdiq darvozasi (>50M UZS → hitl_approvals INSERT), reyting formulasi 40/30/20/10 (toza service + DB'ga yoziladi), QC→MM reyting event-zanjiri (SupplierQualityFailEvent submit-inspection.handler'da publish → MM listener consume), layer-formula (gofra/sloy take-up real matematik), fleet mashina/yoqilg'i CRUD, MRP read+run, narx-tarix (PO qatorlaridan). LEKIN: deyarli barcha jadval BO'SH (requisitions=0, goods_receipts=0, batches=0, price_history=0, vehicles=0, fuel=0, routes=0) — qurilgan-lekin-ma'lumotsiz; ko'p endpoint 501-gated (vendor-invoices, to'liq 3-way UI, fleet deliveries/maintenance/locations, driver expenses, material-suppliers); reyting shkalasi NOIZCHIL (eski demo 1-5 ╳ yangi formula 0-100); umuman jadval YO'Q: tender/RFQ, vendor_communications, requisite_history, price_lists, contracts, substitutes/analog, etalon, klishe, MSDS, laboratoriya (РД-5 namlik/граммаж/ECT). To'lov/avans/aging Finance'da (bu yerda 501). Asosiy P2P karkas tirik, lekin vizyonning yarmi (laboratoriya darvozasi, tender, transport-yoqilg'i ma'lumoti, narx-list/shartnoma) hali ma'lumotsiz yoki yo'q.

**11.1  ✅ bor**  — ❓ Yetkazuvchi reytingi avto sifat40%+muddat30%+narx20%+hujjat10% formulasi bilan hisoblanadimi (EP-MM-002/040)?
- Siz: Reyting 4 mezon og'irlik bilan (sifat 40, muddat 30, narx 20, hujjat 10), avto hisoblanadi, menejer faqat izoh.
- Isbot: mm-vendor-rating.service.ts:81-98 toza weighted hisob; mm-dashboard.controller.ts:271-325 POST /mm/vendor-performance computeRating + INSERT mm_vendor_ratings; document_score notes JSON'da.

**11.2  🟡 qisman**  — ❓ Reyting avto har qabul/braktan keyin yangilanadimi — QC braki yetkazuvchi reytingiga ulanadimi (EP-MM-041/071/098)?
- Siz: QC brak → yetkazuvchi reytingi avto tushadi (event-driven).
- Isbot: supplier-quality-fail.listener.ts:25-43 SupplierQualityFailEvent'ni consume qiladi (submit-inspection.handler.ts:70 publish) — ZANJIR ULANGAN; LEKIN currentRating=5 hardcoded placeholder (satr 32 'until rating lookup is wired'), haqiqiy reyting o'qilmaydi.

**11.3  ❌ yo'q**  — ❓ Past reytingli/qora ro'yxat yetkazuvchiga buyurtma bloklanadimi, 5-status modeli bormi (EP-MM-003/004/039)?
- Siz: 5 status (Faol/Yangi-tekshiruvda/To'xtatilgan/Qora ro'yxat/Arxiv); qora ro'yxatga buyurtma butunlay blok; past reytingga direktor tasdiq.
- Isbot: mm_vendors jadvalda faqat is_active (bool), status/blacklist ustuni YO'Q; PO yaratishda reyting/status tekshiruvi yo'q (create-purchase-order.handler.ts faqat summa>50M tekshiradi).

**11.4  🟡 qisman**  — ❓ Xarid buyurtmasi to'liq hayot-tsikli (yaratish/tasdiq/qabul) ishlaydimi, holatlar bormi (EP-MM-023/031/050)?
- Siz: PO 7 holat (Qoralama..Yopildi), to'liq P2P zanjir, har bosqich oldingisidan keladi.
- Isbot: mm-purchase-orders.controller.ts: create/approve/goods-receipt/delete/update REAL (CQRS), mm_purchase_orders=6 qator; LEKIN status enum cheklanmagan, 'Qisman keldi'/'Yopildi' avto-o'tish to'liq emas; mm_purchase_requisitions=0.

**11.5  🟡 qisman**  — ❓ >50 mln UZS buyurtma direktor tasdig'iga avto o'tadimi (EP-MM-024/047)?
- Siz: Summa pog'onasi: <5M ta'minot boshlig'i, 5-50M moliya, >50M direktor.
- Isbot: create-purchase-order.handler.ts:54-57 totalAmount>PO_MAX_AMOUNT_UZS → PoRequiresDirectorApprovalEvent; po-requires-director-approval.listener.ts:21-23 hitl_approvals'ga INSERT REAL; LEKIN faqat 1 chegara (>50M), <5M/5-50M pog'onalari yo'q.

**11.6  🟡 qisman**  — ❓ Mol qabuli 3-way match (PO+qabul+schyot) bilan tekshiriladimi, farq bo'lsa bloklanadimi (EP-MM-018/052/138)?
- Siz: PO+qabul+schyot mos kelmasa to'lov blok, farqni menejer hal qiladi (tolerans %).
- Isbot: goods-receipt.handler.ts:40-54 validateThreeWayMatch tx ichida, mos kelmasa rollback + ThreeWayMatchFailedEvent publish — REAL; LEKIN goods_receipts/invoice jadvallar BO'SH (mm_goods_receipts=0), to'liq 3-way UI endpointlari 501-gated (mm-dashboard.controller.ts:197-207).

**11.7  🟡 qisman**  — ❓ Narx-tarix material bo'yicha saqlanadi va ko'rinadimi (EP-MM-007/053)?
- Siz: Har xariddan keyin narx avto tarixga (sana/narx/yetkazuvchi/miqdor) + grafik.
- Isbot: GET /mm/materials/:id/price-history ishlaydi LEKIN purchase_order_items'dan o'qiydi (mm-dashboard.repository.ts:103), material_price_history jadval BO'SH (0 qator) va hech kim YOZMAYDI — alohida narx-tarix yozuvi yo'q.

**11.8  🟡 qisman**  — ❓ MRP/texkartadan avto material talab → avto xarid arizasi yaratiladimi (EP-MM-009/069/129)?
- Siz: Min zaxiradan past/texkarta sarf × buyurtma → avto ariza qoralamasi, ta'minotchi tasdiqlaydi.
- Isbot: POST /mm/mrp-run runMrp() mm_mrp_results'ga yozadi (mm-dashboard.repository.ts:46-49), getMrpResults o'qiydi; LEKIN avto purchase_requisition yaratish ko'rinmaydi, mm_purchase_requisitions=0, min-zaxira→ariza event yo'q.

**11.9  ✅ bor**  — ❓ Layer (gofra/sloy) formulasi — kg↔list, ECT/qavat, take-up koeffitsienti ishlaydimi (EP-MM-094, vizyon #7)?
- Siz: Material konfiguratsiyasidan (GSM, o'lcham, flute take-up) kg↔list aylantirish; gofra Σliner+Σ(flute×take_up).
- Isbot: layer-formula.service.ts:44-92 corrugatedTotalGsm + convert() material_cards (grammage/format_a/format_b/material_kind) + material_layer_config o'qiydi, hardcoded yo'q; mm.module.ts:86 ro'yxatda.

**11.10  ❌ yo'q**  — ❓ Yetkazuvchilarni tender/so'rovnoma orqali taqqoslash (3+ taklif, 5-ustun) bormi (EP-MM-019/056/057)?
- Siz: So'rovnoma 3+ yetkazuvchiga, javoblar bitta jadvalda (narx/muddat/to'lov/reyting/masofa), umumiy ball, odam tanlaydi.
- Isbot: tenders/rfq_requests jadvallari YO'Q (q.cjs NO_TABLE); price-comparison endpoint bor (mm-goods.controller.ts:175) lekin tender workflow/so'rovnoma yo'q.

**11.11  ❌ yo'q**  — ❓ Mijoz materiali (давальческое) owner_type bilan ajratiladimi, tannarxga kirmaydimi (EP-MM-108)?
- Siz: warehouse_stock/material kartasida 'egasi: zavod/mijoz'; mijoznikiga PO yo'q, tannarxga kirmaydi.
- Isbot: material_cards ustunlarida owner_type/owner YO'Q (q.cjs ustun ro'yxati: faqat raw_material_id/supplier_name...); davalchestvo belgisi qurilmagan.

**11.12  🟡 qisman**  — ❓ Material muddati (срок годности) FEFO + karantin + xavfli kimyo MSDS bormi (EP-MM-115/116/016)?
- Siz: Muddatli materialga срок годности + FEFO chiqim + ogohlantirish; xavfli kimyo alohida ombor + MSDS.
- Isbot: material_cards'da shelf_life_days + storage_conditions ustuni BOR (struktura), LEKIN material_batches=0 (partiya-darajada muddat yo'q), FEFO chiqim mantiq mm'da yo'q, MSDS fayl/xavf-sinf jadval yo'q.

**11.13  🟡 qisman**  — ❓ Transport/yo'l-varaqasi, yoqilg'i normativ vs fakt, talon nazorati ishlaydimi (EP-MM-059/062/063/064)?
- Siz: Har tashishga yo'l-varaqasi (mashina/haydovchi/km/yoqilg'i), normativ l/100km vs fakt, talon balansi oy oxirida.
- Isbot: Fleet vehicle/fuel-log CRUD endpoint REAL (mm-dashboard.controller.ts:107-145), mm_vehicles/mm_drivers/mm_vehicle_fuel_logs jadval BOR; LEKIN hammasi BO'SH (=0), logistics_routes=0, deliveries/maintenance/locations/driver-expenses 501-gated.

**11.14  ❌ yo'q**  — ❓ Laboratoriya (РД-5) darvozasi — namlik/граммаж/ECT tasdig'isiz PP'ga chiqarmaslik bormi (EP-MM-090/091/092)?
- Siz: Har qabul partiyaga laboratoriya holati (kutilmoqda/o'tdi/o'tmadi), namlik/граммаж/ECT o'lchovi, o'tmaguncha PP'ga bermaslik.
- Isbot: MM tomonida laboratoriya/namlik/граммаж partiya-tekshiruv jadval yoki endpoint YO'Q; qc_inspections QC modulida (vizyon E6 bir-haqiqat), lekin material_cards'da lab-holat/etalon ulanishi ko'rinmaydi; material_batches=0.

**11.15  ❌ yo'q**  — ❓ Yetkazuvchi muloqot jurnali, shartnoma/prays-list, rekvizit-tarix saqlanadimi (EP-MM-042/074/085/089)?
- Siz: Kartochkada muloqot jurnali; shartnoma raqam/muddat/skan; kelishilgan prays-list; rekvizit o'zgarishi tarixda + tasdiq.
- Isbot: vendor_communications / supplier_contracts / price_lists / vendor_requisite_history jadvallari YO'Q (q.cjs NO_TABLE hammasiga); mm_vendors'da payment_terms/contact_person bor lekin shartnoma fayl/tarix yo'q.

**11.16  🟡 qisman**  — ❓ Mol qabuli kanonik warehouse_stock'ga yoziladimi (xarid→kirim ulanishi) (EP-MM-011/051)?
- Siz: Qabul qilingan miqdor real omborga (warehouse_stock) tushadi, PO bilan solishtiriladi.
- Isbot: mm-goods.service.ts:44-47 postGoodsReceipt() 'post received quantities into canonical warehouse_stock' — kod BOR; LEKIN mm_goods_receipts=0 (hech qachon ishlatilmagan), jonli oqim isbotlanmagan (bo'sh).

**11.17  🟡 qisman**  — ❓ Ta'minotchi KPI/ЦКП paneli (vaqtida%/narx-tejovi/brak%/qarz aylanishi) bormi (EP-MM-027/028/137)?
- Siz: Ta'minotchi kartasida ЦКП + KPI panel: vaqtida % / narx tejovi / brak % / qarz aylanishi / faol PO soni.
- Isbot: GET /mm/supplier-performance REAL (avg_delay_days/total_spend/completed_orders, mm-dashboard.repository.ts:91-95); VendorPerformance.tsx FE bor; LEKIN narx-tejovi/brak%/qarz-aylanishi to'liq emas, ЦКП karta-bog'lanish ko'rinmaydi, ma'lumot kam (po=6).

**11.18  🔑 egasi-data**  — ❓ Reyting/oylik chegaralar/og'irliklar egasi tomonidan konfiguratsiyadan o'zgartiriladimi (EP-MM-025/040)?
- Siz: Og'irlik (40/30/20/10) va summa chegaralari sozlamalardan, egasi dasturchisiz o'zgartiradi.
- Isbot: mm-vendor-rating.service.ts:65-68 weights override qabul qiladi (Partial<Weights>), default MM_VR_DEFAULT_WEIGHTS; LEKIN UI/settings sahifasidan override ulanishi ko'rinmaydi — kod tayyor, egasi qiymat/sozlama kutadi.

**11.19  🟡 qisman**  — ❓ Reyting shkalasi izchilmi (1-5 ╳ 0-100 aralashmaganmi)?
- Siz: Yagona izchil reyting o'lchovi (formula 0-100 ball).
- Isbot: mm_vendor_ratings jonli: id 1-6 demo 1-5 shkala (quality_score 4.50), id 7 yangi formula 0-100 (80.00, grade B) — ikki XIL shkala bir jadvalda, hisobot buziladi.

---

## 12 — LMS / Darslik  (vizyon 62%, 16 savol)

> LMS modulning MEXANIZMI kuchli qurilgan, lekin DATA bo'sh va ba'zi vizyon-artefaktlar yo'q. ✅ TO'LIQ qurilgan: 3-shartli tugatish-gate (nazariy test + amaliy + nazorat-varaqasi mavzulari — lms-completion.service.ts pure+test), karta-oylik gate (LmsCardGateService, fail-closed), darslik→kartaga biriktirish (courses.card_id + findMandatoryCoursesByCard), xodim→kartaga ulanganda AVTO-enroll (golden-thread TO'LIQ ulangan: card.service.ts:148 emit → CardEmployeeAssignedHandler @OnEvent → enrollments.card_id+auto_enrolled), imtihon→razryad avto-zanjir (lms.exam.passed emit→org-structure listener REAL), cross-card kredit (is_universal+lms_cross_card_credits+handler), micro-modul/video-progress/test-bank/savol CRUD real DB, karta-mentor + card-knowledge CRUD, kaizen jadval. 🟡 QISMAN/yetishmaydi: 12-universal-mavzu shabloni alohida jadval YO'Q (mavzular course_progress/lessons orqali, 0 qator), nazorat-varaqasi alohida artefakt-jadval YO'Q (mantiq gate ichida), kaizen PDCA 4-bosqich (Plan/Do/Check/Act) alohida ustun/jadval YO'Q (faqat status+expected_impact+result_measured), KaizenPage FE PDCA-siz oddiy. 🔑 EGASI-DATA (eng katta bo'shliq): courses.card_id = barcha 5 kursda NULL (kursni kartaga BOG'LAMAGAN), lms_exams/lms_tests/lms_test_attempts/certificates/lms_card_mentors = 0 qator — mexanizm bor lekin egasi kontent kiritmagan, shuning uchun gate amalda hech narsa bloklamaydi (halol "ochiq" holat).

**12.1  🟡 qisman**  — ❓ Darslik KARTAGA biriktiriladimi (xodimga emas), karta o'zgarsa darslik karta bilan qoladimi?
- Siz: EP-LMS-001/071: darslik kartaga biriktiriladi; xodim almashsa voris o'sha darslikni avtomatik oladi.
- Isbot: courses.card_id ustuni BOR + findMandatoryCoursesByCard kartadan o'qiydi; LEKIN barcha 5 kursda card_id=NULL (q.cjs) — mexanizm tayyor, bog'lanish bo'sh.

**12.2  ✅ bor**  — ❓ Karta darsligi 100% tugamasa o'sha kartaning oyligi to'xtaydimi (oylik-gate)?
- Siz: EP-LMS-002: darslik tugamaguncha oylik yo'q — o'sha karta oyligi to'xtaydi.
- Isbot: LmsCardGateService.isCardTrainingComplete + isCardTrainingCompleteBool (fail-closed), module exports LmsCardGateService HR-payroll/razryad uchun; lms-card-gate.service.ts:181.

**12.3  ✅ bor**  — ❓ Tugatish 3 shart bilan baholanadimi: nazariy test + amaliy imtihon + nazorat-varaqasi mavzulari 100%?
- Siz: EP-LMS-070: uch mezon — nazariy (o'tish bali) + amaliy (murabbiy) + mavzu-tasdiqlar 100%.
- Isbot: lms-completion.service.ts evaluate() C1_THEORY/C2_PRACTICAL/C3_TOPICS, pure+guarded, test-spec bilan; constants TX=100/general 60-80.

**12.4  ✅ bor**  — ❓ Xodim kartaga ulanganda kartaning majburiy kurslari AVTO tayinlanadimi?
- Siz: EP-LMS-003: kartaga biriktirish bilan barcha majburiy kurslar avto-tayinlanadi.
- Isbot: Golden-thread TO'LIQ: card.service.ts:148 emit(CARD_EMPLOYEE_ASSIGNED) → CardEmployeeAssignedHandler @OnEvent → autoEnroll INSERT enrollments(card_id, auto_enrolled) idempotent ON CONFLICT.

**12.5  ✅ bor**  — ❓ Razryad imtihoni LMS ichida bo'lib, o'tsa avtomatik razryad-so'rov zanjiri ishlaydimi?
- Siz: EP-LMS-015/017: razryad imtihoni LMS test, o'tsa HR+rahbar tasdiq zanjiri.
- Isbot: lms-exams.service.ts:69 emit(EXAM_PASSED_EVENT) → org-structure/exam-passed-razryad.listener.ts:41 @OnEvent → RazryadHistoryService.createRequest (ai_suggested).

**12.6  🟡 qisman**  — ❓ Universal kurs cross-karta kredit beradimi (bir kartada o'qisa boshqasiga hisoblanadi)?
- Siz: EP-LMS-012/Q562: universal kurs cross-karta kredit, lms_cross_card_credits jadvalda qayd.
- Isbot: courses.is_universal ustuni + lms_cross_card_credits jadval + hasCrossCardCredit/CourseCompletedCreditHandler REAL; lekin lms_cross_card_credits=0 qator, is_universal hech kursda yoqilmagan.

**12.7  ✅ bor**  — ❓ Kurs majburiy/ixtiyoriy ekani kartada belgilanadimi + o'tish bali sozlanadimi?
- Siz: EP-LMS-026/009: is_mandatory kartada; passing_score kurs turiga qarab (TX=100, oddiy 60-80).
- Isbot: courses.is_mandatory + passing_score + max_attempts ustunlari mavjud (q.cjs); LMS_TX_PASS_THRESHOLD_PCT/GENERAL constants gate ichida.

**12.8  ❌ yo'q**  — ❓ 12 universal mavzu shabloni (maqsad, orgsxema, ЦКП, ko'p-xatolar, huquq...) yangi kursga qolip bo'lib chiqadimi?
- Siz: EP-LMS-033: 12-mavzu bo'sh qolip; o'quv bo'limi faqat kontent to'ldiradi.
- Isbot: 12-mavzu shabloni uchun alohida jadval/seed topilmadi; mavzular course_progress (0 qator) + lessons orqali, qolip-generator yo'q.

**12.9  🟡 qisman**  — ❓ Nazorat varaqasi raqamli artefakt sifatida (FIO+mavzu-mavzu tasdiq+PDF eksport) mavjudmi?
- Siz: EP-LMS-031/064: har kartaga nazorat varaqasi obyekti, mavzu-mavzu raqamli tasdiq, kitob formatida PDF.
- Isbot: Tugatish-gate ichida 'nazorat varaqasi mavzulari' MANTIQ bor (C3 confirmedTopics/totalTopics), lekin alohida nazorat_varaqasi jadvali + PDF-eksport endpoint topilmadi.

**12.10  🟡 qisman**  — ❓ Kaizen taklif PDCA 4-bosqich (Reja-Bajar-Tekshir-Harakat) bilan ishlaydimi, bonus 'Act' tugagach to'lanadimi?
- Siz: EP-LMS-020/021/022: to'liq PDCA tsikli, har bosqich mas'ul+muddat+natija, bonus faqat Act yakunlangach.
- Isbot: kaizen_suggestions jadval + status/expected_impact/result_measured/approved_by/implemented_at bor (q.cjs), KaizenPage FE bor; lekin alohida plan/do/check/act ustun/jadval YO'Q, FE PDCA-bosqich UI yo'q (faqat status).

**12.11  🟡 qisman**  — ❓ Micro-modul (qisqa o'quv bo'laklari) + video ko'rilganlik nazorati real saqlanadimi?
- Siz: EP-LMS-010/024: micro-modullar smena oralig'ida, video oxirigacha ko'rilmasa tugatildi bo'lmaydi.
- Isbot: micro_modules + video_progress jadvallar REAL CRUD (lms-misc.repo INSERT/SELECT, controller real); lekin micro_modules=1 qator, video 80%-vaqt-chegarasi logikasi ko'rinmaydi (faqat completed flag saqlash).

**12.12  🟡 qisman**  — ❓ Reglament/kurs versiyasi yangilanganda tegishli kartadagi xodimlarga qayta-o'qish + qisqa test tushadimi?
- Siz: EP-LMS-005/028/065: yangi reglament kartaga bog'lab tegishli xodimlarga test; versiya o'zgarsa qayta-o'qish.
- Isbot: courses.status/approval_status + versiya ustunlar bor, reglament-test mexanizmi LmsTests CRUD bor; lekin 'versiya o'zgarsa avto-qayta-tayinlash' event-handler topilmadi, lms_tests=0 qator.

**12.13  🟡 qisman**  — ❓ Kursni o'quv bo'limi yaratib → AI → HR+rahbar tasdiq oqimi (test/savol CRUD) bormi?
- Siz: EP-LMS-012/079: o'quv bo'limi(НО-14) yaratadi → AI → HR+rahbar tasdiq; test bankini faqat НО-14 tahrirlaydi.
- Isbot: LmsTestsController + LmsQuestionsController to'liq CRUD (GET/POST/PUT/DELETE), courses.approved_by/approval_status, TRAINING_OFFICER roli; lekin test/savol data=0, AI-generatsiya oqimi bu modulda ko'rinmaydi.

**12.14  🟡 qisman**  — ❓ Ichki sertifikat (PDF, muddat, qayta-sertifikatlash eslatmasi) beriladimi?
- Siz: EP-LMS-018/019: avto PDF sertifikat + amal qilish muddati + tugashga yaqin qayta-test eslatma.
- Isbot: lms_certificates/certificates jadvallar + IssueCertificateHandler + CertExpiryHandler (certificate-expired event) + certification.service REAL; lekin certificates=0 qator, sertifikat data yo'q.

**12.15  🟡 qisman**  — ❓ O'qish telefon + sex tableti (POS Monitor)da, kartaga kerakli domen-bilim (gofra/qog'oz turlari) bog'lanadimi?
- Siz: EP-LMS-050/053/085: domen-bilim material katalogiga bog'lanadi; o'qish mobil/POS tabletda.
- Isbot: CardRequiredKnowledgeController (/lms/card-knowledge by-card CRUD) + lms_knowledge jadval REAL; lekin material-katalog (gofra/qog'oz) avto-bog'lanish event yo'q, POS-tablet LMS ekran ulanishi tasdiqlanmadi.

**12.16  🟡 qisman**  — ❓ Murabbiy o'z shogirdlari progressini real vaqtda ko'radimi, kartaga mentor biriktiriladimi?
- Siz: EP-LMS-059/057: murabbiyda 'mening shogirdlarim' paneli; mentor KARTAga biriktiriladi.
- Isbot: LmsMentorsController + lms_card_mentors jadval + karta-mentor CRUD (cards GET/POST/PUT/DELETE) REAL; lekin lms_card_mentors=0 qator, 'shogirdlar paneli' agregatsiya endpoint to'liq tasdiqlanmadi.

---

## 13 — CRM  (vizyon 62%, 19 savol)

> CRM moduli KOD bo'yicha eng to'liq qurilgan modullardan biri: to'liq DDD (CQRS handlerlar, 25+ jadval, lead-scoring 5-mezon formula, churn/RFM/CLV/cohort/funnel analitika, 360° ko'rinish 10 tab FE, golden-thread DealWon→sales_order ikki tomonlama link). LEKIN: (1) golden-thread JONLI hech qachon ishlamagan — WON holatdagi bitim ham sales_order_id=NULL, 0 ta bog'langan SO; (2) kitob-asosli НО-2 vizyon talablari (korporativ raqam abonent-doirasi, Инспекция qo'ng'iroq nazorati, Папка №, ГП-kod qayta-buyurtma, чиқимли/чиқимсиз, qisqartirish-jadval) CRM modulida QURILMAGAN — faqat HR inspection (boshqa kontekst) bor; (3) field-level RBAC, debtor-block gate, telefoniya integratsiyasi yo'q/qisman. Decisions doci 73/85 "javoblangan" deydi, lekin javoblangan = vizyon-qaror qabul qilingan, qurilgan EMAS. Qurilish bosqichi: poydevor kuchli, kitob-spetsifik T1 qatlam va jonli data oqimi yetishmaydi.

**13.1  🟡 qisman**  — ❓ EP-CRM-001/016 — Golden thread: bitim 'yutdik' bo'lsa → sales_order avtomatik yaratiladi (oltin ip)?
- Siz: Bitim yutilsa bir tugma bilan sotuv buyurtmasi avtomatik yaratiladi; to'liq oltin ip (lead→deal→SO→PP).
- Isbot: Kod TO'LIQ: mark-deal-won.handler.ts DealWonEvent emit qiladi → sd/.../deal-won.listener.ts CreateOrderCommand + ikki tomonlama link (deals.sales_order_id, sales_orders.deal_id). LEKIN jonli: q.cjs 'SELECT...sales_order_id IS NOT NULL'=[] (0 qator), WON stage'dagi bitim ham sales_order_id=NULL → zanjir hech qachon ishlamagan.

**13.2  ✅ bor**  — ❓ EP-CRM-012 — Lid baholash (lead scoring) 5-mezon vaznli formula bilan?
- Siz: Avtomatik ballash; qiziqish/faollik/javob-tezligi/summa mezonlari vaznli; real-time qayta hisob.
- Isbot: crm-lead-scoring.service.ts: 5 normalizator (budget log1p, engagement cap, recency decay, source-map, firmographic-fit), vaznlar yig'indi=1 validatsiya, hot/warm/cold tier; +lead-scorer-v2 SGD model. Toza pure-domain servis.

**13.3  🟡 qisman**  — ❓ EP-CRM-005 — Lid avtomatik sotuvchiga biriktiriladi (round-robin)?
- Siz: Avtomatik navbat (round-robin) yoki hudud/mahsulot qoidasi; SELECT FOR UPDATE SKIP LOCKED bilan race-hal.
- Isbot: website-lead.repository.ts pickNextSalesManager(): 'ORDER BY COUNT(l.id) ASC, e.id ASC' (eng kam yuklangan menejer) — real round-robin. LEKIN SKIP LOCKED/FOR UPDATE yo'q (race-condition kafolati vizyonda talab qilingan).

**13.4  ✅ bor**  — ❓ EP-CRM-004 — Vebsayt/Telegramdan avtomatik lid yaratish + darhol bildirishnoma?
- Siz: Avtomatik lid + sotuvchiga darhol Telegram bildirishnoma.
- Isbot: website-contact-lead.listener.ts (@EventsHandler WebsiteContactSubmittedEvent) + website-order-lead.listener.ts → WebsiteLeadService insert + notifySalesGroup(Telegram). crm_leads source='website' real INSERT.

**13.5  ✅ bor**  — ❓ EP-CRM-006/068 — To'liq faollik (activity) jurnali + audit?
- Siz: Qo'ng'iroq/xat/uchrashuv/eslatma sana+kim bilan; har harakat audit jurnalida.
- Isbot: crm_activities BASE TABLE (jonli 3 qator), crm-activities.repository.ts:111 real db.insert(crm_activities).values(...); crm-activities.controller.ts CRUD. crm_history/crm_entity_history jadvallar ham bor.

**13.6  ✅ bor**  — ❓ EP-CRM-015 — Mijoz 360° ko'rinish (buyurtma+to'lov+qarz+yozishma+shikoyat) bir kartada?
- Siz: To'liq 360° bir kartada, ERP modullari bilan bog'langan; parallel skeleton yuklash.
- Isbot: Customer360View.tsx 10 tab: basic/orders/finance/communications/complaints/segmentation/growth/competitors/contracts/ltv. +Customer360Page.tsx, DetailSheetCustomer360.tsx. Modul-bog'langan tablar mavjud.

**13.7  ✅ bor**  — ❓ EP-CRM-014/019 — Churn bashorati + RFM/CLV tahlili?
- Siz: AI ketish-xavfi mijozlarni ro'yxatga chiqaradi + qaytarish vazifasi; RFM+CLV panelga.
- Isbot: analytics/: churn.service.ts (predictChurn + predictWithActiveModel db/default), rfm.service.ts, clv.service.ts (calculateSimple+calculateDcf), cohort.service.ts, kmeans.service.ts. FE CrmRfmClusters/CrmCohortAnalysis/CrmFunnelAnalytics.

**13.8  🟡 qisman**  — ❓ EP-CRM-013 — AI Keyingi eng yaxshi harakat (NBA) sotuvchi tasdig'i bilan?
- Siz: AI taklif beradi, sotuvchi tasdiqlab bajaradi; churn vazifasi CRM ichida yaratiladi.
- Isbot: crm-ai.controller.ts: nba/:entityType/:entityId, suggest-action; crm-ai-extended nba/create-task, churn-rescue (buildRescuePlan real heuristic). LEKIN churn-rescue POST 'requires ML model (not configured)' — model ulanmagan; NBA ko'pi heuristic/echo, haqiqiy AI-kalit yo'q.

**13.9  🟡 qisman**  — ❓ EP-CRM-021 — KP (kommercheskiy taklif) tizim ichida tayyorlash+yuborish+holat (ko'rildi)?
- Siz: Tizim ichida KP tayyorlash, yuborish, holat kuzatish (ko'rildi/qabul/rad); email pixel+Telegram.
- Isbot: crm_proposals/crm_proposal_products jadvallar + crm-bitrix-compat-proposals.repository.ts bor (struktura). LEKIN 'ko'rildi' email-pixel/Telegram tracking webhook (vizyon EP-CRM-005) kod topilmadi — holat-kuzatish qurilmagan.

**13.10  ❌ yo'q**  — ❓ EP-CRM-022/030/067 — Karta-model field-level RBAC (sotuvchi faqat o'z mijozini, kontakt yashirin)?
- Siz: Har sotuvchi faqat o'z mijozini; o'zganiki faqat nomi, kontakt/qarz/narx maydon-darajada yashirin; ko'rish urinishi loglanadi.
- Isbot: crm_leads.manager_id ustuni bor (egalik), lekin WHERE assigned_to=current_user filtri yoki field-level mask (kontakt yashirish) CRM repozitoriyalarda topilmadi. Global guardlar bor, lekin vizyon talab qilgan maydon-darajali RBAC qurilmagan.

**13.11  ❌ yo'q**  — ❓ EP-CRM-031/032/035 — Korporativ raqam menejer kartasiga, abonent-doirasi cheklovi (НО-2)?
- Siz: Korporativ raqam kartaga biriktiriladi, menejer ketsa raqam+baza o'tadi; faqat tasdiqlangan abonent doirasi, tashqari raqam flaglanadi.
- Isbot: users jadvalida faqat 'phone' (korporativ-raqam/abonent-doira ustuni yo'q). НО-2 abonent-doirasi/korporativ-akkaunt kod CRM modulida topilmadi; 'inspeksiya' faqat HR room-analysis (boshqa kontekst).

**13.12  ❌ yo'q**  — ❓ EP-CRM-033/028 — Qo'ng'iroqlar nazorati Инспекция bo'limi paneliga (telefoniya/ATS)?
- Siz: Qo'ng'iroq jurnali avtomatik Инспекция paneliga (kim/qachon/davomiylik/mijoz); telefoniya webhook real-time.
- Isbot: Telefoniya/ATS integratsiyasi, qo'ng'iroq-yozuvi, Инспекция qo'ng'iroq-paneli CRM kodida yo'q (decisions doc o'zi 🔵 OCHIQ deydi: provayder egasidan). Faqat crm_activities'ga qo'lda 'call' tur kiritish mumkin.

**13.13  ❌ yo'q**  — ❓ EP-CRM-039/040/041 — Папка №, 'Прошло (дней)', qog'oz Заявка profili CRMda?
- Siz: Har bitim Папка № bilan; o'tgan kun avtomatik; mijoz qog'oz spetsifikatsiyasi yangi bitimga pre-fill.
- Isbot: Grep 'papka/Папка/Прошло/zayavka' CRM modulida topilmadi (faqat custom-fields generik). Kitob-spetsifik Папка/Прошло(дней)/Заявка-profil ustun/jadval qurilmagan.

**13.14  ❌ yo'q**  — ❓ EP-CRM-043/044/045 — ГП-kod tarixi + 'qayta buyurtma' tugmasi + konstruksiya parametrlari/maket?
- Siz: Kartada ГП-kod tarixi + qayta-buyurtma tugmasi (eski spetsifikatsiya); sloy/o'lcham/model/brend-yozuv profili.
- Isbot: 'gp_code/reorder/qayta-buyurtma' CRM kodida topilmadi. ГП-kod (kitob ГП-2026-0187 va h.k.) tarixi va qayta-buyurtma oqimi qurilmagan.

**13.15  🟡 qisman**  — ❓ EP-CRM-024/036/069 — Qarzdorlik gate: kredit-limitdan oshsa yangi bitim bloklanadi (Даромадлар tasdig'i)?
- Siz: Qarz limitidan oshsa avtomatik ogohlantirish + boshliq/Даромадлар ruxsatisiz yangi bitim ochilmaydi; qarz Finance'dan keshlanadi.
- Isbot: crm_companies.credit_limit+used_credit ustunlar + updateCreditLimit() bor (saqlash). LEKIN bitim-yaratishda limit-tekshirib-bloklash gate (APPROVE oqimi) kod topilmadi — faqat ma'lumot saqlanadi, ijro qilinmaydi. Decisions doc o'zi 🔵 OCHIQ.

**13.16  🟡 qisman**  — ❓ EP-CRM-018 — Mijoz turlari/segmentlari (VIP/asosiy) ABC avto-toifa bilan?
- Siz: Segment ro'yxati (oborot/sodiqlik); ABC avto-toifa; segment har buyurtmadan keyin trigger bilan qayta hisob.
- Isbot: Customer360View SegmentationTab (ABC) + sd ABC repo mavjud (struktura). LEKIN aniq segment ro'yxati va per-order trigger qayta-hisob egasidan (decisions 🔵 OCHIQ); jonli sd_customers segment CHECK (vip/regular/new/potential) bor lekin to'liq oqim emas.

**13.17  🟡 qisman**  — ❓ EP-CRM-020/037 — Yutqazilgan bitim sababi (majburiy ro'yxat) + 'yutdik' bekor bo'lsa KPI avto-tuzatish?
- Siz: Majburiy sabab (tayyor ro'yxat) → hisobot; bitim bekor bo'lsa KPI avtomatik ochiladi (event).
- Isbot: mark-deal-lost.handler.ts sabab MAJBURIY (reason param) + DealLostEvent emit. LEKIN DealLostEvent'ni iste'mol qiluvchi KPI-autocorrect listener topilmadi (faqat emit); sabab tayyor-ro'yxati egasidan (🔵 OCHIQ).

**13.18  ✅ bor**  — ❓ EP-CRM-017 — Yagona kanonik mijoz bazasi (sd_customers), barcha modul shundan oladi?
- Siz: Yagona ishonchli mijoz bazasi; lead yutilsa sd_customers'ga konversiya.
- Isbot: lead-converted-customer.listener.ts (@EventsHandler LeadConvertedEvent) → sd_customers'ga idempotent INSERT (segment/status CHECK bilan). Jonli sd_customers=15 qator, crm_leads=13. Kanonik baza ulangan.

**13.19  🟡 qisman**  — ❓ EP-CRM-027/045 — Boshliq dashboard (voronka+leaderboard+churn/hot+kechikkan vazifa); leaderboard 'Yutdik' asosida?
- Siz: To'liq panel bir ekranda; leaderboard haftalik faqat 'Yutdik' bitimlar asosida; forecast ajratiladi.
- Isbot: CRMWorkspace.tsx + CRMKpiCards + funnel.service.ts + LeaderboardTab.tsx (FE) bor. LEKIN leaderboard director/analytics'da (employees/departments/courses), CRM-spetsifik sotuvchi-leaderboard 'won-only haftalik reset' (EP-CRM-045) aniq isboti topilmadi — qisman.

---

## 14 — Marketing  (vizyon 62%, 20 savol)

> Marketing moduli KENG QURILGAN va asosan jonli DB ga ulangan: kampaniya CRUD+launch (marketing_campaigns kanonik, 6 qator, CampaignCreatedEvent eventBus.publish bilan), leads, NPS (9 javob), churn-risk, hot-leads, kanal-ROI dvigatel (marketing-roi.service — EP-MKT-051/052/053 foyda-asosli ROI+CAC, 8 kanal), exhibitions (1), content, budget, calendar, social-inbox, A/B test, settings — hammasi real Drizzle/SQL (controller nomi "stubs" lekin ICHI real). FE 19+ sahifa to'liq. LEKIN egasi-vizyonidagi bir qancha ANIQ qoida YO'Q yoki boshqa modulda: (1) telefon normalizatsiya+dublikat-birlashtirish marketing'da emas (CRM'da), (2) lid-eskirish faqat READ so'rov (7 kun) — @Cron + avto-qayta-tayinlash YO'Q, (3) round-robin taqsimlash marketing'da YO'Q (CRM website-lead'da bor), (4) NPS-ni QC-reklamatsiyada keyinga surish YO'Q, (5) lid→SD EventEmitter2 ikki-event handshake YO'Q (faqat to'g'ridan crm_leads ga INSERT — convert-to-SD umuman yo'q), (6) promo-kod YO'Q, (7) diler AR-balans maydon-darajali RBAC YO'Q, (8) decision-doc da'vo qilgan marketing-ai.analyzeCampaignEfficiency() metodi MAVJUD EMAS (AI faqat kontent/ad-copy/sentiment/SEO), (9) AI-inbox/assistant 'ai_provider: pending' placeholder qaytaradi (haqiqiy AI ulanmagan — egasi AI-kalit beradi). Master-data jadvallar deyarli bo'sh (leads=0, marketing_leads=14, content/budget/calendar/settings=0) — qurilish bosqichi, egasi-data kutadi.

**14.1  ✅ bor**  — ❓ EP-MKT-001/002: Barcha kanaldan kelgan lid yagona ro'yxatga + 4 kanal (SMM/reklama/tavsiya/ko'rgazma) alohida belgilanadimi?
- Siz: Har kanal alohida belgilanadi + statistika; oltin-ip lead'dan boshlanadi; yagona ro'yxat.
- Isbot: marketing_leads jadval (channel/source ustun), leads.repository.ts:58 INSERT channel bilan; getLeadsSourcesSummary kanal-bo'yicha guruh (drizzle-marketing-ext.repo.ts:506). Jonli: marketing_leads=14 qator.

**14.2  ❌ yo'q**  — ❓ EP-MKT-002 telefon normalizatsiya (+998XXXXXXXXX) + dublikat aniqlash birlashtirish marketing'da bormi?
- Siz: BE-da avto +998 standart; dublikat telefon bo'yicha birinchi=kanonik, marketing boshlig'i tasdiqlaydi.
- Isbot: Grep normalizePhone/+998 marketing modulida natija yo'q — faqat CRM dto/spec da. Marketing leads.repository.ts INSERT telefonni xom saqlaydi, normalize/dedup logikasi yo'q.

**14.3  ✅ bor**  — ❓ EP-MKT-006/038: Kampaniya kartochkasi (byudjet+muddat+maqsad+status hayot-tsikli) to'liqmi va launch ishlaydimi?
- Siz: To'liq kartochka + 6-holat (Reja→Tasdiqlangan→Faol→To'xtatilgan→Tugadi→Bekor) + launch.
- Isbot: marketing.controller.ts:95-149 create/update/delete/launch (campaignsSvc real, marketing_campaigns kanonik); create-campaign.handler.ts:34 eventBus.publish(CampaignCreatedEvent). Jonli: marketing_campaigns=6 qator.

**14.4  ✅ bor**  — ❓ EP-MKT-007/051/052/053: Kampaniya ROI/CPL/CAC avtomatik (foyda-asosli) hisoblanadimi, kanal kesimida?
- Siz: ROI=(sotuv foydasi−xarajat)/xarajat foyda-asosli; CPL=xarajat/lid; CAC=xarajat/yangi mijoz; kanal kesimida.
- Isbot: marketing-roi.service.ts (PURE engine, roi()+channelEffectiveness(), EP-MKT-051/052/053 kodlangan, division-guard); marketing-ext.service.ts:77 getChannelRoi real campaign data dan; controller analytics/channel-roi:198.

**14.5  🟡 qisman**  — ❓ EP-MKT-021: Marketing AI kanal/kampaniya samaradorligini tahlil qilib tavsiya beradimi (analyzeCampaignEfficiency)?
- Siz: AI lid/kanal/kampaniya ma'lumotini tahlil qiladi; ShVB 'qaysi kanal eng samarali' — marketing-ai analyzeCampaignEfficiency().
- Isbot: decision-doc da'vo qilgan analyzeCampaignEfficiency() MAVJUD EMAS (grep=0). marketing-ai.service.ts faqat generateContent/generateAdCopy/analyzeSentiment/optimizeSeo. 'Qaysi kanal samarali' o'rniga ROI-engine channelEffectiveness (AI emas, deterministik) bajaradi.

**14.6  🟡 qisman**  — ❓ EP-MKT-015/016: Buyurtma yopilgach NPS so'rovi (0-10) + past ball (0-6) ogohlantirish/vazifa?
- Siz: Buyurtma yopilgach NPS avtomatik; past ball avto-ogohlantirish + mas'ulga vazifa.
- Isbot: nps_responses jadval (papka_order_id/customer_id/score linkli, 9 qator); POST nps real INSERT (stubs.controller.ts:160); getNpsStats real. LEKIN buyurtma-yopilganda AVTO-yuborish event/cron yo'q (qo'lda POST); past-ball ogohlantirish/vazifa yaratish logikasi topilmadi.

**14.7  ❌ yo'q**  — ❓ EP-MKT-007 (decisions): Aktiv QC reklamatsiyasida NPS so'rovi keyinga suriladimi (noto'g'ri vaqt bayrog'i)?
- Siz: QC reklamatsiyasi bo'lsa NPS 'noto'g'ri vaqt' bilan keyinga suriladi, reklamatsiya yopilgach avto-yuboriladi.
- Isbot: Grep reklamatsiya/complaint/wrong-time marketing modulida natija yo'q. NPS POST shartsiz INSERT qiladi (stubs.controller.ts:154), QC holatini tekshirmaydi.

**14.8  🟡 qisman**  — ❓ EP-MKT-012/062/063/065: Ijtimoiy inbox (yagona oyna, lid yarat, SLA, javob shablonlari)?
- Siz: Barcha tarmoq xabari bitta inbox; suhbatdan lid yarat; javob vaqti SLA; tayyor shablonlar.
- Isbot: social_conversations/social_messages jadval + GET/reply/status real INSERT/UPDATE (stubs.controller.ts:318-386); getInboxStats real. LEKIN provayder (Instagram/FB/Telegram API) ulanmagan — xabar kelmaydi; ai-reply 'ai_provider:pending' placeholder (:366); SLA-soat metrikasi cron yo'q.

**14.9  ❌ yo'q**  — ❓ EP-MKT-047/037: Lidni sotuvchiga avto-taqsimlash (round-robin, ta'tildagi=ABSENT o'tkazib)?
- Siz: Mahsulot turi+hudud bo'yicha, bo'lmasa round-robin; HR status=ABSENT bo'lsa keyingiga.
- Isbot: Marketing modulida round-robin/assignLead yo'q (grep faqat CRM website-lead.repository.ts:34 va kanban). Marketing lead taqsimlash logikasi mavjud emas.

**14.10  🟡 qisman**  — ❓ EP-MKT-048/003 (decisions): Lid eskirish croni (javobsiz N-soat→rahbar signal→24s keyin boshqa sotuvchiga)?
- Siz: Belgilangan soat javobsiz→rahbarga signal+24s keyin boshqa sotuvchiga; cron ABSENT tekshiradi.
- Isbot: getOverdueLeads bor (drizzle-ext.repo.ts:483, 7-kun cutoff READ so'rov) + endpoint leads/automation/overdue-leads. LEKIN @Cron YO'Q, avto-qayta-tayinlash/eskalatsiya/ABSENT-tekshiruv YO'Q — faqat ro'yxatni ko'rsatadi.

**14.11  ✅ bor**  — ❓ EP-MKT-029/050: Yo'qotilgan lid sababi ro'yxatdan saqlanadi + statistika?
- Siz: Rad sababi tanlanadi + statistika (narx/raqobatchi/miqdor...).
- Isbot: leads.repository.ts:93 getLossAnalysis — marketing_leads.lost_reason bo'yicha guruh + percent; status='lost' filter; endpoint analytics/leads/loss-analysis:223 real.

**14.12  ❌ yo'q**  — ❓ EP-MKT-042: Kampaniyaga promo-kod/chegirma biriktirilib sotuvda kuzatiladimi?
- Siz: Kampaniyaga promo-kod biriktiriladi, sotuvda kuzatiladi (EXPO2026); 1 mijoz/1 kampaniya limit.
- Isbot: Grep promo_code/promoCode/promo-code butun apps/api/src da natija=0. Kampaniya jadvalida promo-kod ustuni/logikasi yo'q.

**14.13  🟡 qisman**  — ❓ EP-MKT-049/005: Lid SD ga o'tkazilganda EventEmitter2 ikki-event handshake (transfer→accepted)?
- Siz: Lid SD ga→darhol 'o'tkazildi'; SD mijoz kartochkasi yaratilgach 'bog'langan' event→marketing lead yopiladi (2 event handshake).
- Isbot: convertLeadToCrm (stubs.controller.ts:280) to'g'ridan crm_leads ga INSERT + marketing_leads.status='converted'. LEKIN SD (sd_customers/sales_order) ga o'tkazish YO'Q (grep=0); EventEmitter2 ikki-event handshake YO'Q — sinxron INSERT, event emas.

**14.14  ✅ bor**  — ❓ EP-MKT-009: Marketing KPI panosi (lid soni, konversiya%, CPL, ROI, byudjet) avtomatik yangilanadimi?
- Siz: To'liq KPI paneli (11 ShVB ko'rsatkich) avtomatik yangilanadi.
- Isbot: getDashboardStats (drizzle-ext.repo.ts:101) jonli DB dan: totalCampaigns/activeCampaigns/totalLeads/convertedLeads/conversionRate/totalBudget/recentLeads hisoblaydi; endpoint dashboard/stats real. FE MarketingDashboard.tsx+Panels mavjud.

**14.15  ✅ bor**  — ❓ EP-MKT-010/057/058: Ko'rgazma kartochkasi + tezkor lid yig'ish + QR?
- Siz: Ko'rgazma kartochkasi (xarajat/sana/joy/stend); telefondagi tezkor forma; QR.
- Isbot: exhibitions+exhibition_leads jadval; GET/POST/PATCH/DELETE exhibitions + POST exhibitions/:id/leads + QR endpoint (stubs.controller.ts:420-536) real DB. Jonli: exhibitions=1 qator.

**14.16  ❌ yo'q**  — ❓ EP-MKT-029/030 (decisions): Diler AR balansi faqat moliya+marketing-boshliqqa (maydon-darajali RBAC)?
- Siz: AR balans faqat moliya xodimi+marketing boshliq ko'radi; oddiy menejerga faqat 'to'lov kechikmoqda' belgisi (maydon RBAC).
- Isbot: Grep AR.?balance/to'lov-intizom/payment-discipline marketing modulida natija=0. Maydon-darajali RBAC (rolega qarab ustun yashirish) marketing'da implement qilinmagan.

**14.17  ✅ bor**  — ❓ EP-MKT-068/017/018: Kontent boshqaruvi + kalendar + raqobatchi kartochkasi?
- Siz: To'liq kontent ro'yxati/holati/kanal/natija; kalendar; raqobatchi kartochkasi.
- Isbot: marketing_content/marketing_content_posts/marketing_calendar_events jadval; marketing-group2.controller.ts website/blog + calendar + competitors CRUD real (DELETE/POST/PATCH). FE MarketingContent/Calendar.tsx mavjud.

**14.18  🔑 egasi-data**  — ❓ EP-MKT-003/031: Kanal ro'yxati master-data (marketing boshlig'i qo'shadi/o'chiradi)?
- Siz: Sozlamalarda kanal ro'yxati, marketing boshlig'i o'zi boshqaradi (8 kanal + boshqa).
- Isbot: marketing_settings jadval (key/value/category) + GET/POST settings endpoint (stubs.controller.ts:608-619) real. Kanonik 8 kanal MKT_CHANNELS (marketing-roi.constants.ts) kodda. Jonli: marketing_settings=0 qator — egasi yakuniy ro'yxat+kanal master-data kiritishi kerak.

**14.19  🔑 egasi-data**  — ❓ EP-MKT-021/AI-inbox: Marketing AI haqiqatan ulanganmi (kontent generatsiya, inbox avto-javob)?
- Siz: 70% AI-tahlil; AI kontent yaratadi, inbox avto-javob, churn signal.
- Isbot: marketing-ai.service.ts AiRouterService orqali real AI-chaqiruv (generateContent prompt+JSON parse). LEKIN inbox/assistant/content-ai-generate 'ai_provider: pending' placeholder qaytaradi (stubs.controller.ts:130,234,366) — AI-kalit/provayder ulanmagan (egasi beradi).

**14.20  🟡 qisman**  — ❓ EP-MKT-022/044: Issiq lid skoring (avto-ball, daraja issiq/iliq/sovuq)?
- Siz: Belgilar bo'yicha avto-baholanadi; 5 mezon→ball→daraja; har oy AI re-kalibrovka.
- Isbot: recalculateLeadScores (stubs.controller.ts:258) real UPDATE: base 30 + channel-bonus + status-bonus → marketing_leads.score; getHotLeads real. LEKIN egasi-vizyonidagi 5-mezon-vazn (buyurtma hajmi 40%...) yo'q — soddalashtirilgan formula; AI oylik re-kalibrovka yo'q.

---

## 15 — Kanban / Vazifa  (vizyon 34%, 23 savol)

> Kanban moduli ASOSAN doska-markazli CRUD sifatida qurilgan (board/column/card, drag-drop=ustun ko'chirish), egasi-vizyonining "shaxsiy ish stoli + 3-savat + soatlik dastur + intizom dvigatel" qismi esa deyarli YO'Q. JONLI ISHLAYDIGAN: 4-bosqich status-modeli (kanban-status.ts derived from column name), assigner-confirm darvozasi (faqat topshiruvchi "Bajarildi"ga o'tkazadi — REAL kod, kanban-boards.service.ts:187-229), karta CRUD + tayinlash + qabul (accept) + yakunlash (complete+report) + 1-5 reyting, kuzatuvchi/hamijrochi/teg/checklist/chat/fayl(25MB upload)/vaqt-log(jonli 48 qator) jadval+endpoint, takrorlanuvchi karta cron (kanban-recurring.cron — registratsiyalangan), OrderCreated→karta event-handler (wired) + OrderCancelled→bekor ustuni, overdue-inbox(24h) + overdue/productivity/employee hisobotlar + Excel/PDF eksport. YETISHMAYDI (egasi-vizyonining yadrosi): (1) WIP limit (max 3) — kod YO'Q; (2) eskalatsiya zanjiri (24h→boshliq→48h→keyingi→CEO→Owner, manager_id bo'ylab) — YO'Q, faqat passiv overdue ro'yxati bor; (3) shaxsiy SOATLIK dastur (09:00-18:00 grid + reja/fakt + qotirilgan slot tushlik/namoz) — YO'Q (MyPlanView faqat bugun/hafta/keyin guruhlash, soat-grid emas); (4) rollover (ertangi kunga ko'chish + sanagich) — kod YO'Q (jadvalda rolled_over ustuni ham yo'q); (5) CC 3-savat birlashtirish (basket_state/unified) — Kanbanda umuman YO'Q; (6) ishlab chiqarish kartasi (Тираж/progress-bar/Сумма осталось/stansiya-operator/texnologik ustunlar/bosqich bog'liqligi) — YO'Q; (7) karta-markazli ulanish (vazifa→lavozim-karta→GSD, ism emas) — YO'Q (faqat owner_user_id, position-card FK yo'q); (8) maxfiy/intizom vazifa (confidential+disciplinary RBAC) — ustun ham, kod ham YO'Q; (9) norma-vaqt taqqos, ta'til-handover, jarayon-shablon zanjiri (cascade-freeze), Telegram-orqali yopish — YO'Q yoki faqat ustun bor. Jonli data BO'SH/junk: yagona board (id=2 "EUROPRINT") ustunlari "Salom/savol/1231322" — kanonik 4-bosqich emas; kanban_tasks(0)/templates(0)/checklists(0). 137 qarordan 128 OCHIQ (A-default, egasi tasdig'i kutadi) — bu modul vizyon-spetsifikatsiyasi asosan TASDIQLANMAGAN holatda, ijro ~1/3.

**15.1  🟡 qisman**  — ❓ Siz dedingiz: doska aynan 4 qotirilgan bosqich — Reja → Jarayonda → Tekshiruvda → Bajarildi (EP-KAN-015). Loyihada shu 4-bosqich modeli bormi?
- Siz: Standart 4 ustun hamma doskaga, bo'lim qo'sha oladi; karta bosqichma-bosqich o'tadi.
- Isbot: kanban-status.ts:23-36 KanbanStatus enum (REJA/JARAYONDA/TEKSHIRUVDA/BAJARILDI) REAL + statusFromColumnName() derived; LEKIN status ustuni jadvalda YO'Q — ustun nomidan chiqariladi, jonli board id=2 ustunlari 'Salom/savol/1231322' (q.cjs) = 4-bosqich emas, junk.

**15.2  ✅ bor**  — ❓ Siz dedingiz: 'Bajarildi'ga faqat topshiruvchi (assigner) o'tkazadi, ijrochi o'zi tasdiqlay olmaydi (EP-KAN-027/032). Shu darvoza ishlaydimi?
- Siz: Yuqori/topshiriq vazifa boshliq tasdig'i bilan yopiladi; ijrochi faqat Tekshiruvdaga suradi.
- Isbot: kanban-boards.service.ts:187-229 assertCanMoveTo() — terminal BAJARILDI'ga acting!==assigner bo'lsa Err(FORBIDDEN); ijrochi o'zi=403 'avval Tekshiruvdaga'. moveCard() wired (kanban-boards.controller.ts:131).

**15.3  ❌ yo'q**  — ❓ Siz dedingiz: bir paytda ko'pi bilan 3 ta 'Jarayonda' (WIP limit, EP-KAN-038), boshliq shoshilinch uchun bir martaga override (logga). Loyihada WIP limit bormi?
- Siz: WIP=3 service qatlamida tekshiriladi; navbat(queue), override log + oylik hisobot.
- Isbot: Grep 'wip|WIP' kanban modulida 0 natija; moveCard/addCard hech qanday WIP tekshiruvi yo'q; queued status ham yo'q.

**15.4  ❌ yo'q**  — ❓ Siz dedingiz: muddat o'tib 24h → boshliqqa eskalatsiya, yana 48h → keyingi yuqori daraja, CEO→Owner gacha (manager_id zanjiri, EP-KAN-040..043, 021). Shu eskalatsiya dvigateli bormi?
- Siz: Bosqichli eskalatsiya org-struktura bo'ylab, task_escalations qaydi, CEO/Owner gacha.
- Isbot: Grep 'escalat' kanban modulida 0; task_escalations jadval yo'q; faqat passiv overdue-inbox endpoint (kanban-reports.controller.ts:247) 24h ro'yxat qaytaradi — avtomatik xabar/eskalatsiya YO'Q.

**15.5  ❌ yo'q**  — ❓ Siz dedingiz: shaxsiy dastur — kunlik SOATLIK grid (09:00…18:00), har vazifaga vaqt, reja/fakt taqqos, tushlik/namoz 'qotirilgan slot' (EP-KAN-007, 048-055, K3). Shu soatlik dastur bormi?
- Siz: PersonalProgram.tsx soat-grid + rang + qotirilgan band slot; HR smena jadvalidan slot.
- Isbot: Grep 'personalProgram|personal-program' = 0 (faqat OEE false-match); MyPlanView.tsx faqat bugun/hafta/keyin guruhlash (satr 28-49), soat-grid/reja-fakt/qotirilgan slot YO'Q. ShVB Y20 build-prompt qurilmagan.

**15.6  ❌ yo'q**  — ❓ Siz dedingiz: bajarilmagan vazifa avtomat ertangi kunga ko'chadi + 'necha marta ko'chgan' sanagich, 3 dan oshsa boshliqqa (EP-KAN-008/064, K33). Rollover bormi?
- Siz: Avtomat rollover + rolledOverFrom sanagich + 3 marta chegara → intizom signal.
- Isbot: kanban_cards jonli ustunlarida rolled_over/rollover_count YO'Q (q.cjs information_schema); rollover cron/logika yo'q. Bor cron faqat kanban-recurring.cron.ts (takrorlanuvchi shablon, rollover emas).

**15.7  ❌ yo'q**  — ❓ Siz dedingiz: 3-savat (Kiruvchi/Kutilmoqda/Chiquvchi) CC ustidan BIRLASHGAN ko'rinish — bitta /api/basket/unified, ikki dunyo emas (KAN tavsiya 1, EP-KAN-001..006). Kanban CC savatiga ulanganmi?
- Siz: CC basket_state kanonik; Kanban shu ustidan birlashgan ko'rinish, yangi savat-jadval qurilmaydi.
- Isbot: Grep 'basket_state|unified|/api/basket' kanban BE+FE = 0; CC cc-baskets.repo.ts alohida yashaydi, Kanban modulida hech qanday ulanish/birlashgan endpoint yo'q.

**15.8  ❌ yo'q**  — ❓ Siz dedingiz: vazifa lavozim-KARTAGA beriladi (ism emas), xodim ketsa karta qoladi, bajarilsa GSD ga avtomat hissa (EP-KAN-014/108/132/137). Karta-markazli ulanish bormi?
- Siz: Vazifa→lavozim-karta→GSD; barqaror adres; karta-markazli model bilan izchil.
- Isbot: kanban_cards faqat owner_user_id (q.cjs) — org_functions/lavozim-karta FK YO'Q; GSD-hissa ulanishi yo'q; assign endpoint owner_user_id (user) yozadi (kanban-cards.controller.ts:171).

**15.9  🟡 qisman**  — ❓ Siz dedingiz: yangi buyurtma = ishlab chiqarish doskasida karta, Дата готовности=muddat, holat ustun bo'ylab siljiydi (EP-KAN-097, K12). Buyurtma→karta oqimi bormi?
- Siz: Har buyurtma ishlab chiqarish taxtasida karta, Excel o'rniga jonli taxta.
- Isbot: createKanbanForOrder() REAL transaction (kanban-cards.repo.ts:133-209) + OrderCreatedKanbanHandler wired (kanban.module.ts:40); LEKIN 'sales' type board topilmasa faqat warn+skip (satr 186); jonli sales-board yo'q, kanban_cards=2 test qator.

**15.10  ❌ yo'q**  — ❓ Siz dedingiz: kartada Тираж + progress-bar (7000/10000) + 'Сумма осталось' + stansiya-operator + texnologik bosqich ustunlari (EP-KAN-098..101, K13-K16). Ishlab chiqarish kartasi boy maydonlari bormi?
- Siz: Karta yuzida tiraj/progress/to'lov qoldig'i/operator/texnologik marshrut.
- Isbot: kanban_cards ustunlarida quantity/progress/payment_balance/station_operator/tech_stage YO'Q (q.cjs); board ustunlari texnologik bosqich (Флексо/Высечка) emas — junk.

**15.11  ❌ yo'q**  — ❓ Siz dedingiz: bosqich bog'liqligi (Ламинация Печать tugamasdan boshlanmaydi) — karta 'X tugaguncha bloklangan', cascade-freeze (EP-KAN-122, K9/K37). Bosqich-blok bormi?
- Siz: Karta blockedBy ko'rsatiladi, oldingi yopilsa avtomat ochiladi; shablon zanjir cascade-freeze.
- Isbot: Grep 'blockedBy|cascade|blocked' kanban=0; kanban_cards blocked_by/depends_on ustuni yo'q; jarayon-shablon zanjiri logikasi yo'q (kanban_templates=0 jonli).

**15.12  ❌ yo'q**  — ❓ Siz dedingiz: maxfiy vazifa (inspeksiya/intizom) faqat beruvchi+ijrochi+boshliq ko'radi, taxtada ko'rinmaydi; hayfa discipline_records jadvalida (EP-KAN-120/126, K35/K41). Maxfiy+intizom bormi?
- Siz: task.confidential RBAC + disciplinary alohida jadval, KAN taxtasida ko'rinmaydi.
- Isbot: kanban_cards confidential/is_disciplinary ustuni YO'Q (q.cjs); RBAC filtri yo'q; kanban hayfa yozuvi yo'q (discipline.cron alohida HR-da, KAN ulanmagan).

**15.13  🟡 qisman**  — ❓ Siz dedingiz: vazifaga checklist; hammasi belgilanmaguncha yopilmaydi (sifat darvozasi, EP-KAN-080, K23-Telegram blok). Checklist bormi va yopish darvozasi ishlaydimi?
- Siz: Karta ichida checklist, to'liq belgilanmasa yopilmaydi.
- Isbot: kanban_checklists/items jadval + KanbanChecklistController wired (kanban.module.ts:33); LEKIN completeCard checklist to'liqligini TEKSHIRMAYDI (kanban-cards.controller.ts:193 — faqat report); jonli kanban_checklists=0.

**15.14  🟡 qisman**  — ❓ Siz dedingiz: bajarilgach boshliq 1-5 sifat-baho + izoh, GSD ga o'rtacha (EP-KAN-123, K38). Reyting+yakunlash oqimi bormi?
- Siz: Yopilishda sifat-baho 1-5, GSD reyting bilan ulanadi.
- Isbot: rateCard 1-5 REAL UPDATE (kanban-cards.controller.ts:135-146, rating ustuni jonli bor) + completeCard(report); LEKIN GSD/KPI ga ulanish yo'q — reyting yakka qoladi.

**15.15  🟡 qisman**  — ❓ Siz dedingiz: kartaga fayl+izoh tasmasi (kim qachon), rasm/fayl 10-25MB, virus-scan (EP-KAN-029/083/048-rule). Fayl+chat biriktirish ishlaydimi?
- Siz: Fayl + izoh tasmasi karta ichida; hajm chegara + xavfsizlik qatlami.
- Isbot: kanban-card-files.controller.ts:33-38 REAL upload 25MB + ext whitelist; kanban_files jonli=1 qator, kanban_card_comments REAL endpoint; LEKIN virus-scan(ClamAV) YO'Q, faqat ext-filter.

**15.16  🟡 qisman**  — ❓ Siz dedingiz: kuzatuvchi (observer) ko'p, faqat o'qiydi+izoh, yuqori ustuvorlikda boshliq avtomat kuzatuvchi (EP-KAN-017/018/070-074). Observer roli bormi?
- Siz: Ko'p kuzatuvchi (read+izoh), boshliq avtomat qo'shiladi, maxfiyda himoya.
- Isbot: kanban_observers + kanban_co_executors jadval + add/remove endpoint REAL (kanban-cards.controller.ts:294-338), jonli=4 qator; LEKIN avtomat-boshliq-observer va maxfiy-filtr YO'Q.

**15.17  🟡 qisman**  — ❓ Siz dedingiz: takrorlanuvchi vazifa (kunlik/haftalik/oylik) belgilangan kunda avtomat tushadi (EP-KAN-022/054/063, K-rollover). Takror-cron ishlaydimi?
- Siz: Bir marta sozlanadi, har kuni/hafta avtomat paydo bo'ladi.
- Isbot: kanban-recurring.cron.ts REAL (07:00, daily/weekly/monthly, INSERT yangi karta) + cron.module.ts:96 registratsiyalangan + recurrence_pattern jonli ustun; LEKIN jonli takrorlanuvchi karta=0, hech qachon ishlamagan.

**15.18  🟡 qisman**  — ❓ Siz dedingiz: vaqt-logi (boshladim/tugatdim) normaga taqqoslanadi, vaqtbay ish haqiga ulanadi (EP-KAN-134/093, K8/K49). Vaqt-log + norma-taqqos bormi?
- Siz: boshladim/tugatdim tugmasi vaqt yozadi, norma-vaqt master-data bilan taqqos.
- Isbot: kanban_time_tracks jadval (startedAt/endedAt/durationMinutes/targetMinutes) + jonli 48 qator REAL; LEKIN norma-vaqt master-data va vaqtbay-payroll ulanishi YO'Q (targetMinutes qo'lda).

**15.19  🟡 qisman**  — ❓ Siz dedingiz: Telegramdan vazifa ochish/yopish/izoh, ERP bilan sinxron (EP-KAN-085, K-Telegram blok). Telegram-orqali vazifa ishlaydimi?
- Siz: Telegram bot orqali ochish/yopish/izoh, checklist majburiy, fayl card_files ga.
- Isbot: kanban_cards jonli telegram_message_id/telegram_chat_id/source ustunlari BOR (q.cjs) — infratuzilma tayyor; LEKIN kanban modulida Telegram-handler/webhook YO'Q (CC cc-bot alohida, KAN ga ulanmagan).

**15.20  ❌ yo'q**  — ❓ Siz dedingiz: ta'tilda ochiq vazifalar uchun o'rinbosar tanlanmaguncha ta'til tasdiqlanmaydi, bulk-handover, qaytganda avtomat qaytadi (EP-KAN-090/091, K5/K6). Ta'til-handover bormi?
- Siz: Ta'til oldidan handover majburiy bosqich; o'rinbosar; qaytganda avtomat qaytish.
- Isbot: Grep 'handover|vacation' kanban=0; ta'til-handover logikasi, bulk-assign UI, qaytarish cron — hech biri yo'q.

**15.21  ❌ yo'q**  — ❓ Siz dedingiz: vazifa muddati cho'zilsa TaskDeadlineChangedEvent → SD(delivery_date)/PP(Gantt) avtomat yangilanadi, manual drift taqiq (EP-KAN-022-decision/117/127). Deadline-event integratsiyasi bormi?
- Siz: Muddat o'zgarsa event-driven SD/PP yangilanadi; deadline cho'zish boshliq tasdig'i.
- Isbot: Grep 'TaskDeadlineChanged|extendDeadline' kanban=0; deadline o'zgartirish faqat oddiy updateCard (kanban-boards.service.ts:82), event chiqarmaydi, SD/PP ga ulanmaydi.

**15.22  🟡 qisman**  — ❓ Siz dedingiz: hamma KAN cronlar (rollover/eskalatsiya/arxiv/estafeta) BullMQ orqali ishonchli, missed-job qayta tushadi (EP-KAN tavsiya 50). Cronlar BullMQ-persistent mi?
- Siz: BullMQ queue (EventEmitter emas), removeOnFail=false, attempts=3, offline drain.
- Isbot: Yagona mavjud kanban-recurring.cron @Cron (in-process @nestjs/schedule) — BullMQ EMAS; rollover/eskalatsiya/estafeta cronlari umuman yo'q (faqat 1/6 cron mavjud).

**15.23  🔑 egasi-data**  — ❓ Egasi-data: 137 qarordan 128 tasi A-default (egasi tasdig'i kutilmoqda). Bu Kanban vizyon-spetsifikatsiyasi qaror sifatida qotirilganmi yoki tasdiqsizmi?
- Siz: WIP=3, eskalatsiya CEO'da to'xtaydi, rollover 3-chegara, savat-manba (CC vs kanban_tasks), kategoriya/ustuvorlik master-data — egasi tasdig'i kerak.
- Isbot: decisions/15-kanban.md:9 'javoblangan 9, ochiq 128'; eslatma 3: 'egasi qaysi savat-manbasi kanonik ekanini tasdiqlasin (CC ╳ kanban_tasks.basket_type — ikki dunyo riski)' — qaror qotirilmagan.

---

## 16 — IoT / Telemetriya  (vizyon 52%, 23 savol)

> IoT modul "ikki yuzli": (1) AI-KAMERA + OPERATOR-TABLET yo'nalishi — KOD jihatdan boy va REAL ulangan (tablet login→sessiya→checklist-gate→OEE→golden-thread MES→QC/HR/WMS/ЦКП), bu egasi 460 javobida ✅ deb belgilangan qism. (2) MASHINA-SENSOR yo'nalishi (energiya/kompressor/RUL/idle-tok/namlik) — kod-skelet bor lekin SENSOR YO'Q (egasining o'z chekloved: "IoT hali O'RNATILMAGAN"), shuning uchun deyarli barcha telemetriya jadvallari BO'SH (iot_sensors=0, iot_alerts=0, camera_*=0, room_references=0). Eng katta jonli bo'shliq: AI-kamera infra to'liq qurilgan-u, BIRORTA kamera ro'yxatdan o'tmagan + ideal-xona "har 2 soatda" taqqoslash CRON YO'Q (faqat jadval). Mashina "норма штук/час" reestri equipment kartasida saqlanMAYDI (faqat work_centers smena-normasi bor). OEE 3-omilli real, golden-thread tablet-stop→QC haqiqiy. Halol baho: struktura ~75%, jonli data ~10-15%, vizyon-moslik ~52% (chunki vizyon yadrosi = AI-kamera nazorat + sensor-OEE, ikkalasi ham data-siz turibdi).

**16.1  ✅ bor**  — ❓ Har mashinada operator tableti bo'lib, login→jihoz/buyurtma→checklist→faol sessiya→brak/downtime/QC→smena topshirish→stop oqimi REAL ishlaydimi?
- Siz: EP-IOT-022: har mashina yonida tablet — holat+to'xtash+defekt+smena hisoboti; floor markazi (E4)
- Isbot: iot-tablet.controller.ts: /tablet/login, /production-sessions/:id/start|stop|defect|inline-qc|crew, /downtime-events, /tablet/handover — hammasi real db.execute INSERT/UPDATE; production_sessions=8 qator jonli

**16.2  ✅ bor**  — ❓ Sessiya boshlashda tayyorlik/TB-xavfsizlik chek-listi to'ldirilmasa MES sessiyasi ochilmaydi (dasturiy blok)?
- Siz: EP-IOT-080 + EP-IOT-008: checklist to'ldirilmasa ish ochilmaydi (E4 dasturiy blok)
- Isbot: iot-tablet.controller.ts:327-348 start() — setup_checklists/checklist_items majburiy bandlarni tekshiradi, bo'lmasa yoki bajarilmasa 422 UnprocessableEntity (fail-safe)

**16.3  ✅ bor**  — ❓ OEE 3 omil (Availability×Performance×Quality) avtomatik hisoblanadi va trend bilan ko'rsatiladimi?
- Siz: EP-IOT-014: to'liq OEE 3 omil avtomatik + trend; норма(tezlik)+брак%(sifat)+соат(vaqt)
- Isbot: oee-calculator.service.ts:118-130 real 3-omilli hisob, Zod-validatsiya + clamp[0,1]; tablet stop() OEE'ni production_sessions ga yozadi (availability/performance/quality/oee ustunlari)

**16.4  🟡 qisman**  — ❓ Mashina 5 holatda ko'rsatiladimi (Ishlayapti/To'xtagan/Sozlanmoqda/Nosoz/O'chiq)?
- Siz: EP-IOT-002: 5 holat master-ro'yxat (yashil/qizil/sariq/qora/kulrang)
- Isbot: machine_status_logs jadvali (status/previous_status/stop_reason ustunlari) mavjud va 9 qator bor; lekin 5-holat enum kanonik master-ro'yxat sifatida seed/validatsiya tasdiqlanmadi — log bor, master-ro'yxat enforcement yo'q

**16.5  ✅ bor**  — ❓ Tablet'da sessiya tugaganda golden-thread (MES→QC) ishlab, QC inspeksiyasi avto ochiladimi?
- Siz: Oltin-ip yadrosi: MES bajarildi→QC; tablet-stop CQRS bilan bir xil event chiqarishi kerak
- Isbot: iot-tablet.controller.ts:440 stop() MesCompletedEvent publish qiladi; jonli listener'lar bor: qc/.../mes-completed.listener.ts + hr + wms + org-structure ckp-mes-feed.listener.ts

**16.6  🟡 qisman**  — ❓ Downtime (to'xtash) sababi tayyor ro'yxatdan tanlanib, иш йук/колиб/переделка/настройка alohida kodlar bilan yoziladimi?
- Siz: EP-IOT-004/005/036-039: tayyor sabab ro'yxati; kitob real sabablari (иш йук, колиб тайёр эмас, переделка, настройка) majburiy
- Isbot: downtime-events POST real INSERT qiladi (downtime_events=2 qator); LEKIN downtime_reason_codes=0 (seed YO'Q), mes_downtime_reasons=7 lekin reason_code ustuni mos kelmaydi — kitob sabablari (иш йук/колиб) kodga seed qilinMAGAN

**16.7  ✅ bor**  — ❓ SOS/panik tugma sessiyasiz ham, anonim bo'lsa ham ishlab, hech qachon fail-closed bo'lmaydimi (xavfsizlik)?
- Siz: EP-IOT-011/077/078: hayot xavfi joyda signal kechiktirilmaydi; @Public
- Isbot: iot-tablet.controller.ts:177-193 /tablet/sos-alert @Public, workerId=0 anonim ham qabul qiladi, sos_alerts ga INSERT (kod izohi: 'safety button cannot fail closed')

**16.8  🟡 qisman**  — ❓ AI-kamera har bo'lim/xona ideal-rasm bilan HAR 2 SOATDA taqqoslab, ball+anomaliya beradimi?
- Siz: EP-IOT-010 + Q97/Q98: ideal-xona AI taqqoslash har 2 soatda, ball+anomaliya
- Isbot: room_references jadvali (reference_image_url) + camera_ai_configs + camera-ai.controller.ts real Drizzle so'rovlar bor; LEKIN room_references=0, cameras=0, camera_detections=0 — birorta ideal-rasm yo'q va 'har 2 soat' CRON taqqoslash topilmadi (faqat skelet)

**16.9  🟡 qisman**  — ❓ AI-kamera himoya vositasi (qo'lqop/ko'zoynak) va xavfli zonada odam yo'qligini real-time tekshiradimi?
- Siz: EP-IOT-077/078 + Q56/Q57: AI kamera himoya vositasi + xavfli zona real-time nazorat
- Isbot: camera_safety_violations jadvali + camera-ai.service getSafetyTrends real DB; LEKIN camera_safety_violations=0, cameras=0 — kod tayyor, jonli kamera/aniqlash YO'Q (egasi: AI-kamera = boshlang'ich, lekin hali ulanmagan)

**16.10  🟡 qisman**  — ❓ Anomaliya aniqlanganda iot_alerts ga yozilib, sex ekrani + Telegram'ga signal ketadimi?
- Siz: EP-IOT-006/028: anomaliya→darhol ogohlantirish (sex ekrani + Telegram bot)
- Isbot: AnomalyDetectedHandler (iot.module.ts:65 registered) iot_alerts ga real INSERT; record-sensor-reading.handler.ts AnomalyDetectedEvent emit qiladi. LEKIN Telegram dispatch IoT'da YO'Q (faqat string izoh); iot_alerts=0 (sensor data yo'q)

**16.11  🟡 qisman**  — ❓ Yagona mashinalar reestri bor bo'lib, har IoT/ta'mir/defekt shunga bog'lanadimi?
- Siz: EP-IOT-029/031: yagona reestr (Станоклар норма nomlari bilan), barcha IoT shunga bog'lanadi
- Isbot: equipment jadvali=7 qator (kanonik reestr, work_center_id+status+maintenance ustunlar); LEKIN 'Станоклар норма' aniq nomlari (SM-72/KBA-105/Гофра/Тигель/ФСМ) bilan 1:1 seed tasdiqlanmadi — reestr bor, kitob-nomlari to'liq seed emas

**16.12  ❌ yo'q**  — ❓ Har mashina kartasida 'норма штук 1 час' + 12 soatlik norma saqlanib, IoT haqiqiy bilan solishtiradimi?
- Siz: EP-IOT-032: har mashina kartasida норма/soat + норма/12 soat; performance% avto
- Isbot: equipment jadvalida norma/per_hour ustuni YO'Q; norma faqat work_centers (norma_m2_per_shift/norma_kg_per_shift) + tech_card_routes.norm_per_hour da — MASHINA kartasida 'штук/час' norma saqlanMAYDI

**16.13  ❌ yo'q**  — ❓ O'lchov birligi mashinaga qarab (Гофра=м2, ofset=лист, Тигель=удар, qolgan=штук) ajratiladimi?
- Siz: EP-IOT-033: har mashinada o'z birligi; aralashtirilsa gofra/tigel xato
- Isbot: equipment jadvalida birlik (м2/лист/удар/штук) ustuni topilmadi; work_centers da norma_m2/norma_kg bor lekin mashina-birlik-mapping (Тигель=удар) saqlanMAGAN

**16.14  🔑 egasi-data**  — ❓ Norma o'zgarishi Согласовано РД4→Утверждено Ген.Директор imzo-zanjiri (audit) bilan tasdiqlanadimi?
- Siz: EP-IOT-054: norma o'zgarishi РД→Direktor tasdig'idan o'tadi, faqat tasdiqlangani amal qiladi
- Isbot: action:APPROVE deb belgilangan, kitobda imzo-zanjir real (Yulchiev M./Pozilov A.); lekin mashina-norma jadvali YO'Q bo'lgani uchun (yuqorida) norma-approval workflow ulanadigan joy ham yo'q — avval norma-reestr kerak

**16.15  ❌ yo'q**  — ❓ иш йук soatlarida muqobil ishga (арчиш/паддон) o'tkazib, vaqt alohida sanaladi va oylik kamaymaydimi?
- Siz: EP-IOT-036/059/082: иш йук=tashkiliy kamchilik (operator aybi emas), muqobil ish alohida, tarif kamaymaydi
- Isbot: Kod ichida иш йук/арчиш/паддон muqobil-ish toifasi yoki HR tabel kodi topilmadi (grep: faqat i18n/errors.json); muqobil-ish vaqtini alohida sanash mexanizmi YO'Q

**16.16  🟡 qisman**  — ❓ Mashina OEE/uptime→operator/mexanik kartasi GSD'ga avto kirib, ShVB (Vysotskiy 7) statistikasiga uzatiladimi?
- Siz: EP-IOT-025/081: mashina ЦКП/GSD avto ShVB GSD'ga; egasi 'mashina ЦКП IoT/MES'dan keyin avto'
- Isbot: org-structure/ckp-mes-feed.listener.ts MesCompletedEvent'ni eshitadi (ЦКП-feed ulangan, golden-thread orqali); LEKIN IoT'dan to'g'ridan GSD'ga uptime/норма% push qiluvchi kod yo'q — faqat MES-event orqali bilvosita, IoT-GSD avto-feed jonli isbotlanmadi

**16.17  🟡 qisman**  — ❓ Predictive maintenance (RUL — qolgan resurs) sensor telemetriyasidan prognoz qiladimi?
- Siz: EP-IOT-015: ish soati/sikl bo'yicha prognoz; udar-resurs (Тигель)
- Isbot: predictive-maintenance.service.ts to'liq real hisob (degradation/RUL/healthScore, least-squares trend) yozilgan; LEKIN kod o'zi izohlaydi: 'telemetry tables empty in this build phase' — iot_sensor_readings=0, hech qanday jonli prognoz yo'q

**16.18  ❌ yo'q**  — ❓ Energiya iste'moli mashina darajasida o'lchanib, Finance tannarxiga avto qo'shiladimi?
- Siz: EP-IOT-018/030: mashina darajasida kVt o'lchash → tannarxga avto (Finance bilan ulanadi)
- Isbot: IoT modulida energy/kwh/tannarx/gl_ ulanishi topilmadi (grep faqat enum/controller string); energiya-sensor YO'Q (egasining o'z chekloved: sensorsiz) — fazaviy

**16.19  ❌ yo'q**  — ❓ Gofra liniyasida ishlab chiqarilgan m² ↔ sarflangan material m² avto solishtirilib, farq (isrof/o'g'irlik) ogohlantiriladimi?
- Siz: EP-IOT-043 + EP-IOT-009: m² farqi 3%dan oshsa QC+ombor signal, material 'tekshirish kutilmoqda'
- Isbot: Гофра м2-sensor YO'Q (egasi: sensorsiz); kodda m²-balans solishtirish handler topilmadi — fazaviy (EVENT-default reja, qurilmagan)

**16.20  🟡 qisman**  — ❓ Sensor signal yo'qolsa 'aloqa yo'q/noma'lum' alohida toifa bo'lib, OEE maxrajiga kirmaydimi (halol hisob)?
- Siz: EP-IOT-012/023/071: 'aloqa yo'q' alohida toifa, uptime'ga ham downtime'ga ham qo'shilmaydi
- Isbot: sensor-status.enum.ts da holatlar bor; OEE calculator plannedProductionTime ni aniq oladi (signal-gap'ni avtomatik chiqarib tashlash mantiqi alohida emas); jonli sensor yo'qligi sabab toifa-ajratish ishlab sinab ko'rilmagan

**16.21  🟡 qisman**  — ❓ Har mashina ishi 'Папка №' + buyurtma kodiga bog'lanib, costing/savdo topa oladimi?
- Siz: EP-IOT-070/013: har ish Папка №+buyurtma kodiga bog'lanadi (kitob: 18660, 19868)
- Isbot: production_sessions da production_order_id/order_id ustunlari bor va stop()'da ppId MesCompletedEvent payload'iga uzatiladi; LEKIN mes_papka_orders=0, jonli Папка№↔sessiya bog'lanishi data bilan tasdiqlanmadi

**16.22  🟡 qisman**  — ❓ IoT smena hisoboti avtomatik yaratilib, uskuna xodimi uchun rasmiy invoys PDF (ishlagani/oylik/avans) chiqadimi?
- Siz: EP-IOT-027 + Q116/Q119: avto smena hisoboti → rasmiy invoys PDF Telegram'ga
- Isbot: stop() completion report (production/time/metrics) qaytaradi (FE CompletionReportData); camera_employee_reports jadvali bor lekin =0; rasmiy invoys-PDF generatsiya + Telegram yuborish IoT'da topilmadi

**16.23  🟡 qisman**  — ❓ Smena А/Б/С bo'yicha alohida ko'rsatkich + smena boshlig'iga biriktirib, operator+yordamchi ekipaji yoziladimi?
- Siz: EP-IOT-040/042: А/Б/С smena ajratish + operator/ёрдамчи biriktirish (kitob tabeli)
- Isbot: machine_crews POST/GET real (master_id/polmaster_id/shogird_id/rokler_id), production_sessions.shift_id bor, machine_crews=2 qator; LEKIN А/Б/С smena-bo'yicha statistik ajratish/taqqoslash hisoboti tasdiqlanmadi

---

## 17 — AI / Aisha  (vizyon 68%, 19 savol)

> AI/Aisha modulining VIZYON-POYDEVORI juda mustahkam qurilgan: Markaziy AI (central-ai.service → ai-router 3-provayder Claude/OpenAI/Gemini + budget + PII-mask), Aisha alohida modul (futuristik immersiv UI, /aisha route+sidebar, direktor-dashboarddan ajratilgan), HITL tool-loop (E1: yuqori xavfli tool→inson tasdig'i, approve/reject real ishlaydi, pending_approvals persist), karta↔xodim fit-scorer (ai_fit_scores real INSERT), ЦКП-gate (QATTIQ-0, jonli ckp_fact_values, fabrikatsiya YO'Q), kunlik ЦКП chatbot (mashinasiz xodim→AI ajratadi→golden-thread), provider-config GET/PATCH (limit/sozlama), forecast (Holt-Winters/Croston/ensemble), succession_plans, behavioral-analyzer (Gemini Vision). ~95 ta vizyon-talab uchun jadval+kod-struktura mavjud (90+ ai_* jadval). LEKIN: (1) DATA ~10% — deyarli barcha ai_* jadval BO'SH (ai_ckp_scores/block_log/decision_log/calibration_runs/burnout=0), chunki ANTHROPIC/GEMINI API-KALIT egasi-data; (2) ai_decision_log immutability (SHA-256 hash trigger, append-only) QURILMAGAN — vizyon EP-AI-rec44 talab qilgan; (3) ai_camera_cross_check jadval bor lekin YOZUVCHI kod YO'Q (EP-AI-028 kross-tekshiruv); (4) AI↔AI bottom-up agregatsiya (EP-AI-031) kod sifatida topilmadi; (5) budget hardcoded konstanta (config-driven emas). Verdikt: kuchli skelet + ko'p real oqim, ammo jonli data va bir nechta mexanizm yetishmaydi.

**17.1  ✅ bor**  — ❓ EP-AI-001: Bitta MARKAZIY AI bormi (har modul shunga ulanadi, tarqoq AI yo'q)?
- Siz: Bitta markaziy AI — barcha modul ulanadi, ichida director/finance/hr ko'rinishlari (KARTALAR Q30=A).
- Isbot: central-ai.service.ts:38-71

**17.2  🟡 qisman**  — ❓ EP-AI-002: AI xodimni login(JWT)→card_id orqali taniydimi?
- Siz: Login(JWT) orqali avtomatik, kartasi ma'lumotidan ishlaydi (kartasiz login yo'q).
- Isbot: central-ai.service.ts:17-21 cardId param mavjud; lekin izoh 'kelajakda karta bo'yicha xarajat hisobi' (54-q) — cardId hozir metadata sifatida uzatiladi, AI-kontekst to'liq kartadan qurilmaydi.

**17.3  🟡 qisman**  — ❓ EP-AI-003: Karta↔xodim moslik bahosi ko'p-manbali (ЦКП+test+davomat+sifat+rahbar) AI scorer bormi?
- Siz: AI har karta↔xodim mosligini baholaydi, % + hisobot (KARTALAR Q30).
- Isbot: ai-fit.service.ts:59 evaluate()→ai_fit_scores real INSERT (fitScore/report/succession). LEKIN profil/talab DTO'dan keladi, ko'p-manba (MES/QC/LMS) avto-yig'ish ko'rinmaydi; jonli ai_fit_scores=1 qator (test).

**17.4  🟡 qisman**  — ❓ EP-AI-005/006: AI hisoboti 3-tomonga (xodim+rahbar+HR) PDF sifatida boradimi?
- Siz: Uchchalasiga mos qism + rasmiy PDF (KARTALAR Q31, ShVB Q116/Q119).
- Isbot: ai-daily-report.service.ts real chatbot ekstraksiya bor; succession/fit report persist. PDF eksport va 3-tomon marshrutlash to'liq oqimi (route-to-manager) jonli tasdiqlanmadi — daily_reports jadval bor, PDF-generator kodi alohida tekshiruv talab qiladi.

**17.5  ✅ bor**  — ❓ EP-AI-008/009: ЦКП chatbot — mashinasiz xodimdan kunlik so'raydimi, AI savol tuzadimi?
- Siz: AI ЦКП tavsif/formuladan savol tuzadi, kunlik so'raydi; HR tasdiqlaydi.
- Isbot: ai-daily-report.service.ts:1-50 mashinasiz xodim erkin matn→AI tarkibiy ЦКП-fakt ajratadi→golden-thread POST /org-structure/ckp/fact; AI yo'q bo'lsa needsManualValue (fabrikatsiya yo'q).

**17.6  ✅ bor**  — ❓ EP-AI-010: Kunlik hisobot bermaslik = oylik gate (QATTIQ 0) bormi?
- Siz: Belgilangan vaqtda bermasa o'sha kun oyligi yozilmaydi; HR raport→direktor qo'shadi.
- Isbot: hr/payroll/ckp-gate.ts applyCkpGate — jonli ckp_fact_values o'qiydi, NO_FACT/DEADLINE_PASSED→factor 0 (ikkilik). Fabrikatsiya yo'q, payroll.service.ts import qiladi.

**17.7  🟡 qisman**  — ❓ EP-AI-032/055: AI provayder + limit/ostona markazda sozlanadimi (settings)?
- Siz: Markazda sozlanadigan limit + qaysi vazifaga AI yoqilgani; provayder Gemini API.
- Isbot: ai-provider-config.controller.ts GET/PATCH provider-configs (upsert) real; ai-router Gemini(GOOGLE_API_KEY) qo'llaydi. LEKIN budget=DAILY_BUDGET_USD HARDCODED konstanta (router.service.ts:102), DB provider-config'dan enable/limit o'qilmaydi — sozlama jadval↔router uzilgan.

**17.8  ✅ bor**  — ❓ EP-AI-033/052: AI faqat tavsiya beradi, qaror inson tasdig'ida (E1: AI belgilaydi→inson qaror) + override+sabab?
- Siz: AI faqat tavsiya; har muhim qaror odam tasdig'i; override sabab bilan yoziladi.
- Isbot: aisha-conversation.service.ts:20,95 HIGH_STAKE_TOOLS (email/telegram/meeting) auto-run YO'Q→pending_approval; aisha-history.controller approve/reject real UPDATE+tool resume; ai_overrides jadval (override_reason/approved_by).

**17.9  ✅ bor**  — ❓ Aisha ALOHIDA MODUL bo'ldimi (o'z route/sahifa/sidebar, direktor-dashboarddan ajratilgan)?
- Siz: Direktor dashboardga ulanib qolgan→ALOHIDA MODUL; futuristik immersiv UI (AISHA-JARVIS vizyon).
- Isbot: AppRouter.tsx:40,204 /aisha route lazy AishaPage; sidebar/constants.ts:563 'AIsha (AI Yordamchi)'; AishaPage.tsx aisha-immersive.css orb+reaktiv animatsiya, 'Moved here from DirectorDashboard #15 P1'.

**17.10  ✅ bor**  — ❓ Layer A miya — 30 tool real ishlaydimi (tool-execution loop, nafaqat ta'rif)?
- Siz: Claude + ~30 tool, pending-approval, SSE; tool'lar to'liqlash.
- Isbot: aisha/application/tools/ — 25+ tool fayl (camera/KPI/alerts/email/telegram); aisha-conversation.service.ts:109 registry.execute REAL bajaradi (read tool darhol, high-stake pause), persist tool_calls.

**17.11  🟡 qisman**  — ❓ EP-AI-013/016/023: Markaziy forecast (sotuv/cashflow/material/GSD) bormi?
- Siz: Keyingi hafta/oy prognozi + ishonch darajasi; yagona prognoz markazi.
- Isbot: ai/forecast/ — forecast.service.ts(251q)+holt-winters+croston+ensemble+nelder-mead real algoritmlar; forecast_series/sales_forecasts jadval. LEKIN cashflow/GSD/material yagona markazga to'liq ulanishi va jonli data tasdiqlanmadi.

**17.12  🟡 qisman**  — ❓ EP-AI-029: Ko'nikma-matritsa→vorislar ro'yxati (succession) AI chiqaradimi?
- Siz: Skill-matrix + AI vorislar ro'yxati sabab bilan (KARTALAR Q32).
- Isbot: succession_plans jadval (readiness_level/development_plan/candidate_id); ai-fit.service.ts successionCandidate (fitScore>=85). Lekin to'liq skill-matrix→succession AI-pipeline va vacancy-event trigger kod jonli tasdiqlanmadi.

**17.13  ❌ yo'q**  — ❓ EP-AI-028: AI-kamera hisoboti ↔ haqiqat kross-tekshiruv bormi?
- Siz: Hisobot↔kamera kross-tekshiruv; nomoslik→rahbar/HR signal.
- Isbot: ai_camera_cross_check jadval MAVJUD (0 qator) lekin grep: apps/api/src da hech qaysi kod bu jadvalga yozmaydi — yozuvchi/servis YO'Q. Mexanizm qurilmagan.

**17.14  ❌ yo'q**  — ❓ EP-AI-rec44: Qaror jurnali immutability (append-only, SHA-256 hash, UPDATE/DELETE taqiq)?
- Siz: ai_decision_log appending-only DB trigger + har yozuvga hash; o'zgartirish xatoga.
- Isbot: ai_decision_log jadval bor (0 qator), ai-agents/common/ai-decision-log.service.ts yozadi; LEKIN pg_trigger ai_decision_log da NOT-internal trigger YO'Q — immutability/hash qurilmagan (jonli tekshirildi).

**17.15  ❌ yo'q**  — ❓ EP-AI-031: AI↔AI o'zaro ishlash (quyi karta AI→yuqori rahbar AI bottom-up agregatsiya)?
- Siz: Quyi kartalar AI'lari→yuqori rahbar AI'siga yig'iladi; yaxlit bo'lim xulosasi.
- Isbot: grep 'bottomUp/aggregateBottom/child ai' apps/api/src/modules/ai = natija YO'Q. ai-agents/ ichida modul-agentlar bor (mes/qc/sales) lekin karta-daraxti bo'yicha pastdan-yuqoriga AI agregatsiya kodi topilmadi.

**17.16  🟡 qisman**  — ❓ EP-AI-027: Qoida-buzilish AI aniqlash (kamera+tahlil) + ai_violations bormi?
- Siz: AI-kamera + AI tahlil buzilishni aniqlaydi, ro'yxatlaydi (ShVB Q108/Q128).
- Isbot: ai_violations jadval + detect-safety-violations.tool.ts + detect-workers-in-area.tool.ts (Aisha VLM tool) mavjud; behavioral-analyzer.service.ts Gemini Vision real. Lekin jonli data=0, kamera-stream integratsiya jonli emas (kalit/IoT kerak).

**17.17  ✅ bor**  — ❓ EP-AI-026/051: AI 3-til (UZ-lotin/UZ-kirill/RU) javob+o'qish?
- Siz: Uch til; xodim profilidan til; kirill+rus+lotin birdek o'qiydi.
- Isbot: locales/uz|uz-cyr|ru/aisha.json 3-til mavjud; aisha-i18n.test.ts; chat.controller SYSTEM_PROMPT o'zbek; Gemini ko'p-tilli. i18n 3-til config (MEMORY).

**17.18  ✅ bor**  — ❓ EP-AI-065: AI ishlamay qolsa ERP davom etadimi (graceful degrade)?
- Siz: AI qulasa ERP ishlaydi; AI-bog'liq qaror kechiktiriladi/qo'lda.
- Isbot: ai-router.service.ts:71 hech kalit yo'q→Err (soxta javob YO'Q); ai-fit fallback row (50); ai-daily-report needsManualValue; chat.controller notConfiguredReply — hammasi graceful, crash yo'q.

**17.19  🔑 egasi-data**  — ❓ EP-AI-032: AI provayder kaliti (ANTHROPIC/GEMINI) sozlanganmi — jonli ishlamoqdami?
- Siz: Provayder = Gemini API (Google AI Studio kaliti, ShVB Q150/Q151).
- Isbot: ai-router resolveProviderKey ANTHROPIC/OPENAI/GEMINI|GOOGLE_API_KEY ConfigService'dan o'qiydi; kalit yo'q=barcha AI oqim Err/fallback. ai_usage_logs=0, ai_ckp_scores=0 → AI jonli chaqirilmagan. KALIT = EGASI beradi.

---

## 18 — Notifications / Botlar  (vizyon 42%, 18 savol)

> Per-modul bot karkasi JONLI bor va ERP'ga ulangan: bot-gateway 9 ta modul-bot (crm/mes/hr/logistics/fin/qc/director/ombor/pos), webhook controller (sendMessage-reply pattern), RBAC ruxsat-reestri, ShVB komandalar (/zvs_status /company_state /weekly_digest real SQL bilan), 4 ta FP-tsikl cron (Se/Ch/Pa/Du), markaziy NotificationsModule + bir nechta REAL @OnEvent listener (qc-failed/order-created/mro-machine-stopped notifications jadvalga yozadi). LEKIN egasi-vizyonining yadrosi YO'Q: (1) ntf_notifications kanonik jadval yo'q — mavjud `notifications` jadvalida ack_at/escalated_at/module_code/op_code/channel/immutable ustunlar yetishmaydi; (2) inline keyboard ACK tugmasi BUTUNLAY yo'q (EP-NTF-016/013 markaziy mexanizmi) — bot-gateway faqat callback_query'ni o'qiydi, ACK tugma generatsiya qilmaydi; (3) manager_id zanjiri bo'yicha eskalatsiya YO'Q; (4) BullMQ queue/outbox/dead-letter/debounce — hech qaysi yo'q (paket ham import qilinmagan); (5) notification_schedules/templates master-data jadval yo'q (Q140 vaqt-sozlash); (6) deep-link onboarding (t.me/bot?start=TOKEN) yo'q; (7) ntf_bot_health monitoring yo'q (faqat cfo_bot_health_logs CFO-maxsus). ENG MUHIM DATA-BLOKER: users.telegram_id bog'langan = 0 (count=0) → bot HECH KIMGA yetkaza olmaydi; notification_logs=0. Org-politika/RD-5 hujjat-grounded qoidalar (15daq/1soat taymer, tungi protokol, uchlik yig'ilish, immutable arxiv) kod sifatida qurilmagan. Xulosa: signal-yuborish karkasi ~42% bor, lekin masъuliyat-zanjiri (ACK→eskalatsiya→immutable-qayd) va vaqt-sozlash — egasi vizyonining asosi — qurilmagan + jonli ulanish data'si 0.

**18.1  ✅ bor**  — ❓ Siz har ERP moduli uchun alohida Telegram bot, hammasi bitta ERP'ga ulangan dedingiz (Q50/Q101/Q102, EP-NTF-019) — shundaymi?
- Siz: Per-modul bot: Ombor boti, Moliya boti, HR boti... hammasi umumiy ERP-yadro orqali ulangan.
- Isbot: bot-gateway/bots/ 9 ta bot (crm/mes/hr/logistics/fin/qc/director/ombor/pos); bot-gateway.module.ts providers+exports; app.module.ts:149 BotGatewayModule ro'yxatda.

**18.2  🔑 egasi-data**  — ❓ Botlar haqiqatda ERP'ga ulanganmi — telegram_id orqali xodimga yetkaza oladimi?
- Siz: Bot ERP'ga ulangan, xodimga (kartaga) yo'naltirilgan xabar yetkaziladi.
- Isbot: JONLI: SELECT count(*) FROM users WHERE telegram_id IS NOT NULL = 0; notification_logs=0. Kod tayyor, lekin hech kim ulanmagan → yetkazib bo'lmaydi.

**18.3  🟡 qisman**  — ❓ ShVB 4 komanda (/zvs_status, /my_gsd, /company_state, /weekly_digest) qurilganmi (EP-NTF-001, YO'NALISH 38)?
- Siz: To'rttala ShVB komandasi — holatim, haftalik GSD, kompaniya holati, haftalik xulosa.
- Isbot: bot.helpers.ts: buildZvsStatusReply/buildCompanyStateReply/buildWeeklyDigestReply REAL SQL (zvs/cash_registers/cash_transactions). LEKIN /my_gsd alohida topilmadi; jonli token+webhook ro'yxatdan o'tkazilmagan.

**18.4  🟡 qisman**  — ❓ Bitta ntf_notifications kanonik jadval (module_code, op_code, ack_at, escalated_at, channel, immutable) bormi (EP-NTF #2)?
- Siz: Bitta ntf_notifications jadval majburiy ustunlar bilan; module_code WHERE filter; immutable flag.
- Isbot: ntf_notifications YO'Q. Mavjud `notifications` jadvalda priority/sent_via_telegram/telegram_message_id/metadata bor, lekin module_code/op_code/ack_at/escalated_at/channel/recipient_card_id/immutable YO'Q.

**18.5  ❌ yo'q**  — ❓ Muhim xabarda inline keyboard ACK tugmasi ("o'qidim/tasdiqla") bormi — "ko'rilmadi" = ACK bosilmadi (EP-NTF-016/013)?
- Siz: Inline keyboard ACK tugmasi PRIMARY; callback_query = masъuliyat tasdig'i, immutable audit-log'ga yoziladi (yuridik kuch).
- Isbot: grep inline_keyboard/reply_markup notifications+bot-gateway+telegram-bots = 0 natija. bot-gateway.controller faqat kelgan callback_query'ni O'QIYDI, ACK tugma GENERATSIYA qilmaydi.

**18.6  ❌ yo'q**  — ❓ Javob bermasa manager_id zanjiri bo'yicha keyingi yuqori darajaga avtomatik eskalatsiya bormi (EP-NTF-017/012, maks 5 daraja)?
- Siz: Vaqt o'tsa avtomatik keyingi rahbarga; NULL manager_id o'tkazib yuborib birinchi non-NULL; 5-darajada owner.
- Isbot: grep escalat manager_id chain notifications = faqat orphan-events.listener (log-only) + telegram-bots.service onDailyReportOverdue (matn ko'rsatadi, real zanjir kechmaydi).

**18.7  ❌ yo'q**  — ❓ BullMQ queue (rate-limit, delayed job, debounce, dead-letter, outbox) bormi (EP-NTF-004/008/022/023/049)?
- Siz: BullMQ: 1/soniya Telegram limit queue, digest_window debounce, ntf_outbox offline, dead-letter retry 3x.
- Isbot: grep BullModule/bullmq/Queue/Processor notifications+bot-gateway = 0; package.json'da bullmq dependency yo'q; ntf_outbox jadval yo'q.

**18.8  ❌ yo'q**  — ❓ Egasi har modul uchun bildirishnoma vaqtini o'zi sozlay oladimi — notification_schedules cron master-data (Q140, EP-NTF-003/007/009)?
- Siz: notification_schedules jadvalda cron; egasi UI'dan o'zgartirsa CronService.updateJob real-time; chegaralar ham egasi.
- Isbot: notification_schedules jadval YO'Q (information_schema). Cron'lar hardcoded @Cron('0 9 * * 2') fp-cycle.cron.ts'da; UI'dan sozlash mexanizmi yo'q.

**18.9  🟡 qisman**  — ❓ Markaziy NotificationsModule REAL @OnEvent listenerlar bilan event'lardan xabar yaratadimi (EP-NTF-021/024/029)?
- Siz: NTF @OnEvent bilan ERP eventlarni ushlab notification yaratadi (loose coupling, service import yo'q).
- Isbot: qc-failed/order-created/mro-machine-stopped listenerlar REAL — runQuery + notificationRepo.save (DB'ga yozadi). LEKIN orphan-events.listener'da kanban.task.*/iot/email handlerlar log-only + TODO stub.

**18.10  ❌ yo'q**  — ❓ Yangi xodim deep-link (t.me/bot?start=TOKEN, 24soat) orqali ulanadimi, telegram_id UNIQUE (EP-NTF-023/007)?
- Siz: HR onboarding deep-link/OTP 24soat; telegram_id DB UNIQUE; HR "qayta yuborish" tugmasi.
- Isbot: grep deep.link/t.me/start=/linkTelegram = tegishli kod yo'q. users.telegram_id ustun bor lekin onboarding/UNIQUE-link oqimi qurilmagan; 0 ulanган.

**18.11  🟡 qisman**  — ❓ Shablonlarni egasi/admin ERP ichidan kodga tegmasdan tahrirlay oladimi (EP-NTF-028, TelegramBotAdmin)?
- Siz: Egasi/admin ERP UI'dan shablonni tahrirlaydi, i18n-aware, Zod placeholder validate.
- Isbot: FE TelegramBotAdmin.tsx mavjud (useMutation/useQuery=6) lekin asosan bot-status/connected ko'rsatadi; notification-templates.ts kodda HARD-CODED (DB notification_templates jadval yo'q) → UI'dan tahrir oqimi to'liq emas.

**18.12  ❌ yo'q**  — ❓ Tex-kartada xato → 15 daqiqalik signal taymer + 1 soatlik tuzatish taymeri qurilganmi (EP-NTF-033/034, RD-5)?
- Siz: Xato → bosh texnologga darrov + 15daq taymer; ACK → 1 soatlik countdown; 45/60-daqiqada eskalatsiya.
- Isbot: grep techcard.error15min/fix1hour/15daq taymer notifications = yo'q. TechCardErrorDetectedEvent listener + taymer cron qurilmagan.

**18.13  ❌ yo'q**  — ❓ Tungi smena telefon-eskalatsiyasi + tungi yakka qaror belgisi qurilganmi (EP-NTF-035/036/072, RD-5)?
- Siz: Tungi muammo: telefon qildim/javob berdi qayd; tungi yakka qaror belgisi ertalab digestда; RD-4 tunda javob shart.
- Isbot: ntf.night.phoneEscalation/call.log/soloDecision implementatsiyasi topilmadi; tungi protokol kodi yo'q. mes-sos-escalation.cron bor lekin bu tungi-telefon protokoli emas.

**18.14  ❌ yo'q**  — ❓ Har xabar immutable arxivga tushadimi, o'chirilmaydi (DELETE trigger), "ma'lumot yo'qolmaydi" kafolati (EP-NTF-010/080)?
- Siz: ntf_notifications DELETE trigger RAISE EXCEPTION; immutable=true; arxiv o'chirilmaydi, faqat yashiriladi.
- Isbot: JONLI: information_schema.triggers event_object_table='notifications' = [] (trigger yo'q). immutable ustun yo'q; soft-cancel/arxiv mexanizmi qurilmagan.

**18.15  ❌ yo'q**  — ❓ Har bot health holati (ntf_bot_health, ping, /api/ntf/health 20 bot) kuzatiladimi (EP-NTF-050)?
- Siz: ntf_bot_health (bot_module, last_ping, status); 30soniyada ping; crash → admin signal + restart; /api/ntf/health.
- Isbot: ntf_bot_health jadval yo'q (faqat cfo_bot_health_logs — CFO-maxsus, universal emas). /api/ntf/health endpoint yo'q.

**18.16  ❌ yo'q**  — ❓ Digestда leaderboard (top-3 guruhda, past-3 faqat rahbarga shaxsiy) bormi (EP-NTF-012/030)?
- Siz: Top-3 ijobiy guruhda, past-3 faqat rahbarga shaxsiy (avtomatik guruh-sheyming TAQIQ).
- Isbot: grep leaderboard/top-3 notifications/digest da bildirishnoma kontekstida implementatsiya yo'q; report-bot.service haftalik digest yuboradi lekin top-3/past-3 mantiqi yo'q.

**18.17  ✅ bor**  — ❓ Bot komandalariga org-daraja/RBAC ruxsat (kim nimani so'ray oladi) bormi (EP-NTF-022)?
- Siz: Org-daraja RBAC: operator butun moliyani ko'rmaydi; har kim o'z huquqidagini.
- Isbot: bot.helpers.ts BOT_PERMISSIONS reestri (har bot uchun ruxsat-rollar) + hasBotPermission/hasPermission (super_admin bypass, case-insensitive); telegram-auth.guard botLinked tekshiradi.

**18.18  🟡 qisman**  — ❓ Email + Telegram ikkala tashqi kanal (Q59) + kanal sozlamasi (shaxsiy/guruh) (EP-NTF-008) bormi?
- Siz: Email + Telegram ikkalasi; shaxsiy natija shaxsiy chatga, bo'lim xulosasi guruhga.
- Isbot: notifications/infrastructure/external/ smtp-email + telegram-bot + eskiz-sms adapter mavjud (port/adapter). LEKIN shaxsiy↔guruh kanal-routing + org_nodes.telegram_chat_id bog'lash oqimi qurilmagan (telegram_group_id ustun bor).

---

## 19 — POS / Kassa-monitor  (vizyon 58%, 25 savol)

> POS Monitor moduli VIZYON SKELETI to'liq qurilgan — 30+ pos_ jadval, 24 controller, ~50 servis, event-driven oqim (movement→quarantine→QC→approve→GL→entries), FIFO/FEFO, balans-guard (asset-blok/consumable-warn), kassir retail sub-modul, offline-sync CONFLICT, AI-GL mapping. Golden-thread JONLI ISHLAYDI: gl_account_mappings 8 qator seed → entries jadvaliga 1 ta real POS GL yozuv tushgan. LEKIN: (1) DATA bo'sh (qurilish bosqichi — 2 movement, 0 reservation, 0 cash). (2) Egasi-vizyonining NOZIK talablari KO'PI YO'Q: texkarta-material mosligi guard (eng qimmat xato — EP-POS-032) UMUMAN yo'q; foto-dalil/override-audit/AI-flag↔penalty-ajratish/is_unplanned/iot_job_ref/supplier_tin/davalcheskoye(ownership_type)/gl_skip ustunlari pos_movements'da YO'Q; smena topshirish 2-imzo akti yo'q; AI anomaliya-detektor yo'q; FIFO servisi mavjud bo'lmagan pos_batches jadvaliga so'rov yuboradi (jonli ishlamaydi); MES→FG-kirim va EXTERNAL_OUT→SD-dispatch listenerlari POS tomonida ulanmagan; director materialized-view yo'q. ⚠️ KRITIK: egasi 2026-06-08 da AYNAN dedi "POS Monitor hozirgi holati = man xohlagan narsa EMAS, to'liq qayta loyihalash kerak" — bu hukm hali ham kuchda (interfeys/oqim qurilgan, lekin kassir-podotchet/har-som-hisobli/profil-qarz vizyoni Finance-Kassir'da, POS'da emas).

**19.1  ✅ bor**  — ❓ Siz dedingiz: 6 ta harakat turi qat'iy belgilangan (EXTERNAL_IN/OUT, INTERNAL_ISSUE/RETURN/TRANSFER, DAMAGE) — shu turlar kodda bormi?
- Siz: Harakat turlari kod-darajada qat'iy; INTERNAL_RETURN sabab majburiy; EXTERNAL_OUT faqat tayyor mahsulot omboridan (decisions EP-POS-005/028)
- Isbot: pos_movement_types=7 qator (jonli); pos-movement.service.ts:70 INTERNAL_RETURN sabab majburiy, :74-79 EXTERNAL_OUT faqat finished_goods bloki

**19.2  🟡 qisman**  — ❓ Siz dedingiz: EXTERNAL_IN 5-bosqichli oqim (DRAFT→KARANTIN→QC→MENEJER→AI_GL) — bu oqim ishlaydimi?
- Siz: Har tashqi material avval karantinga, QC tasdiqlasa asosiy omborga (decisions EP-POS-004/034)
- Isbot: pos.events.ts:64-93 EXTERNAL_IN→auto moveToQuarantine+barkod+QC-notify REAL; quarantine-workflow.service.ts:32 moveToQuarantine bor; lekin jonli faqat 2 movement test-data, oqim uchidan-uchiga sinalmagan

**19.3  ❌ yo'q**  — ❓ Siz dedingiz: chiqimdan oldin texkarta materiali skan bilan solishtiriladi, mos kelmasa QATIY BLOK (eng qimmat xato) — bu guard bormi?
- Siz: EP-POS-032: buyurtma tanlanadi→texkarta materiali EAN-13 skan bilan solishtiriladi→mos kelmasa hech kim o'tkaza olmaydi (override smena boshlig'i)
- Isbot: grep texkarta/tech_card/material_norm/routing → POS modulida 0 real natija (faqat request-number false-hit pos-mini-app.repository.ts:46); movement.dto.ts'da orderId/techCard maydon yo'q

**19.4  ✅ bor**  — ❓ Siz dedingiz: balans-guard differensial — aktiv TO'LIQ BLOK, iste'mol material OGOHLANTIRISH+ruxsat — shunday ishlayaptimi?
- Siz: EP-POS-010: aktivlar qoldiqdan ortiq chiqarib bo'lmaydi; iste'mol → warn + menejer override
- Isbot: pos-balance-guard.service.ts:7-8 ASSET→BadRequestException blok, CONSUMABLE→warning+override; pos-movement.service.ts:97-118 guardResult.blocks/warnings + 409 overrideReason oqimi

**19.5  🟡 qisman**  — ❓ Siz dedingiz: FIFO partiya narxi (muddatli→FEFO, muddatsiz→FIFO) — bu hisoblanadimi?
- Siz: EP-POS-014/025/060: FIFO partiya narxi; expiry_tracked→FEFO, aks holda FIFO; muddati o'tgan blok
- Isbot: pos-fifo.service.ts:46-72 FEFO/FIFO ORDER BY + allocate() REAL kod; LEKIN so'rov pos_batches jadvaliga — bu jadval JONLI YO'Q (information_schema=0) → runtime'da ishlamaydi

**19.6  ✅ bor**  — ❓ Siz dedingiz: har harakatda avto GL-yozuv (Debit/Credit) entries jadvaliga real-time tushadi — bu zanjir ulanganmi?
- Siz: GL H3 kanon: EXTERNAL_IN→Dr Inventar/Cr Kreditor, EXTERNAL_OUT→Dr Debitor/Cr Inventar va h.k.; AI hisoblaydi (decisions EP-POS-012/013)
- Isbot: gl-posting-log.repository.ts:160-167 INSERT INTO entries (idempotent, mapping-driven); jonli: gl_account_mappings=8 qator, entries WHERE document_type='pos_movement' = 1 ta REAL yozuv tushgan

**19.7  🔑 egasi-data**  — ❓ Siz dedingiz: GL mapping har harakat turiga to'g'ri hisob juftligini beradi — mapping to'g'rimi?
- Siz: Vizyon Q2: aniq Debit/Credit juftliklari har movement turi uchun
- Isbot: pos-gl-auto.service.ts:27-74 GL_PAIRS hard-coded juftlik (8 tur); gl_account_mappings=8 qator seed; aniq hisob raqamlari (1410/2110/9010...) egasi-buxgalter tasdig'iga muhtoj

**19.8  🟡 qisman**  — ❓ Siz dedingiz: har harakat warehouse_stock (kanonik) ga real-time yoziladi — inventar yagona haqiqat bormi?
- Siz: EP-POS-030: kanonik jadval=warehouse_stock, real-time PostgreSQL
- Isbot: pos-wms-sync-created.listener.ts → warehouse_transactions DRAFT insert (warehouse_stock'ga to'g'ridan emas); warehouse_stock=37 qator mavjud (reserved_quantity/available_quantity ustunlar bor), lekin POS→stock yangilanish drafti orqali

**19.9  🟡 qisman**  — ❓ Siz dedingiz: buyurtma rezervi — reja material band qiladi, erkin qoldiq alohida ko'rinadi — bormi?
- Siz: EP-POS-066: reserved_qty + available_qty alohida; PP confirmed event→reserved yangilanadi
- Isbot: stock-reservation.service.ts:25 reserve() pos_stock_reservations jadvaliga REAL yozadi, available=onHand-reserved hisoblaydi; LEKIN PP event listener (pp.production_plan.confirmed→reserve) ulanmagan, jonli 0 reservation

**19.10  🟡 qisman**  — ❓ Siz dedingiz: offline rejim to'liq ishlaydi, sinxronda to'qnashuv 'tekshirilsin' (CONFLICT) holatiga o'tadi — bu bormi?
- Siz: EP-POS-021/070: PWA offline + idempotency key; konflikt→boshliq hal qiladi
- Isbot: pos-sync.repository.ts:106-122 getSyncStatus CONFLICT holatini sanaydi (pos_offline_queue/pos_sync_events jadvali bor); to'liq SELECT FOR UPDATE konflikt-rezolyutsiya oqimi tasdiqlanmadi

**19.11  🟡 qisman**  — ❓ Siz dedingiz: minimal qoldiqdan tushsa AI avto sotib-olish talabi MM/snabjeniyega yuboradi — bu ulanganmi?
- Siz: EP-POS-011/065: AI rejalashtirish→avto PR MM'ga (idempotency material_id+date)
- Isbot: procurement-request.service.ts:81 INSERT procurement_requests + :108 procurement_approvals (org-chain) REAL; pos-low-stock.job.ts cron bor; lekin AI_AUTO idempotency unique-constraint va jonli oqim sinalmagan

**19.12  ✅ bor**  — ❓ Siz dedingiz: DAMAGE harakati QC moduliga avtomatik o'tadi + GL zarar hisobiga — bu zanjir bormi?
- Siz: EP-POS-023: DAMAGE→QC avto + Dr Zarar/Cr Inventar
- Isbot: pos-movement.service.ts:206-227 createDamageAct→insertDamageQcLink + emit('pos.damage.qc_required'); GL_PAIRS.DAMAGE → 8910 Zarar/1410 Ombor; pos_damage_qc_links jadval mavjud

**19.13  ❌ yo'q**  — ❓ Siz dedingiz: shubhali harakat AI belgilaydi (flagged_by_ai) — penalty FAQAT boshliq tasdiqlaganda (penalty_confirmed) alohida ustun — bu ajratish bormi?
- Siz: Vizyon Q15: flagged_by_ai (avto) ╳ penalty_confirmed (boshliq) alohida ustun; AI anomaliya formula (smena-tashqari YOKI miqdor>norma×1.5)
- Isbot: pos_movements ustunlari: flagged_by_ai/penalty_confirmed JONLI YO'Q (information_schema count=0); AI anomaliya-detektor kodi modulda yo'q (faqat README.md eslatma)

**19.14  ❌ yo'q**  — ❓ Siz dedingiz: kirim/brak/inventar-farqida foto-dalil planshet kamerasidan olinib harakatga bog'lanadi — bu bormi?
- Siz: Vizyon Q8 / EP-POS-069: evidence_urls JSONB[] da foto saqlanadi, da'vo hujjatida ko'rsatiladi
- Isbot: pos_movements.evidence_urls ustuni JONLI YO'Q (count=0); movement.dto.ts'da evidence maydon yo'q

**19.15  ❌ yo'q**  — ❓ Siz dedingiz: smenadan smenaga material topshirish akti (2 imzo: topshiruvchi/qabul qiluvchi) — bu bormi?
- Siz: EP-POS-050: smena topshirish akti PDF + PIN imzo, imzolanmasa keyingi smena bloklanadi (⚠️ Q11 audit-log bilan ziddiyat — egasi hal qilishi kerak)
- Isbot: pos_shift_audit jadval bor (audit-log), lekin 2-imzoli topshirish akti yo'q; grep handover/signedBy → faqat warehouse-employees assign (boshqa narsa); shift_handovers POS bilan ulanmagan

**19.16  ❌ yo'q**  — ❓ Siz dedingiz: mijoz materiali (давальческое) ownership_type='CLIENT' bilan ajratiladi, qiymat zavod GL'ga tushmaydi (gl_skip) — bu bormi?
- Siz: EP-POS-062 / Vizyon Q19: ownership_type='CLIENT'+client_id, GL chiqarilmaydi (gl_skip=true)
- Isbot: pos_movements'da ownership_type/gl_skip/client_id ustunlari JONLI YO'Q (count=0); warehouse_stock'da ownership_type yo'q

**19.17  ❌ yo'q**  — ❓ Siz dedingiz: STIR/TIN majburiy maydon (9-raqam regex) MM vendor kartasidan avto to'ldiriladi — bu validatsiya bormi?
- Siz: Vizyon Q33: pos_movements.supplier_tin z.string().regex(/^d{9}$/) BE validatsiya
- Isbot: pos_movements'da supplier_tin ustuni JONLI YO'Q (count=0); movement DTO'da tin/TIN regex validatsiya yo'q (supplier_name/supplier_id bor xolos)

**19.18  ❌ yo'q**  — ❓ Siz dedingiz: EXTERNAL_OUT tasdiqlanganda SD sales_orders status avto-yangilanadi (pos.movement.dispatched event) — bu zanjir bormi?
- Siz: Vizyon Q39: pos.movement.dispatched→SD subscribe→sales_orders.status='Yetkazildi', AI_GL revenue yozadi
- Isbot: grep pos.movement.dispatched / sd.order / sales_orders.status → POS modulida 0 natija; EXTERNAL_OUT→SD listener ulanmagan (golden-thread uzuq)

**19.19  ❌ yo'q**  — ❓ Siz dedingiz: MES production_session yopilganda FG-kirim harakati avto yaratiladi (mes.production_session.completed) — bu ulanganmi?
- Siz: Vizyon Q31 / EP-POS-024: MES sessiya→FG-kirim DRAFT→QC_PENDING→qc.final_check.approved→APPROVED
- Isbot: grep mes.production_session / @OnEvent('mes → POS modulida 0 natija; POS faqat OUTGOING mes signal beradi (pos.events.ts:123 broadcast mes.material_received), lekin MES→POS FG-kirim listener yo'q

**19.20  🟡 qisman**  — ❓ Siz dedingiz: tasdiqlangan harakatni bekor qilish = teskari (storno) harakat, GL teskari yozuv avto, ikki marta storno taqiq (409) — bu bormi?
- Siz: EP-POS-022 / Vizyon Q29: DRAFT bekor; tasdiqlangan→storno; original_movement_id FK; reversed=true ikkinchi storno 409
- Isbot: pos.events.ts:187 onMovementCancelled handler bor; lekin pos_movements'da original_movement_id/reversed ustunlari yo'q (cancelled_at/cancel_reason bor); avto teskari-GL va 409-double-storno guard tasdiqlanmadi

**19.21  🟡 qisman**  — ❓ Siz dedingiz: kassir har som hisobli — xodim pul olsa profilga qarz, omborga kirim bo'lmaguncha qarz turadi — bu POS'da bormi?
- Siz: OMBOR-KASSIR §8: 1 kassir, podotchet, profil-qarz, chek-AI, kunlik-PDF, reyting-navbat (egasi: eng muhim)
- Isbot: decisions EP-POS-001: kassa Finance'da, POS Monitor scope-dan tashqari. POS'da cash-register.controller.ts (retail products/transactions/refund) bor, lekin podotchet/profil-qarz/chek-AI Finance-Kassir sub-modul (jonli cash_registers=0, employee_balances=0). Egasi: bu Finance modulida bo'lishi kerak

**19.22  🟡 qisman**  — ❓ Siz dedingiz: POS Monitor login=ERP SSO/JWT, har harakat shaxsga bog'lanadi, faqat o'z bo'lim ombori ko'rinadi (RBAC) — bu bormi?
- Siz: EP-POS-002/003/038: SSO login, rol avto, MovementOwnershipGuard 403
- Isbot: pos-auth.service.ts + pos_warehouse_access jadval bor; mini-app.repository.ts:46 department_code IN (SELECT department FROM users WHERE id=...) bo'lim-scoping REAL; lekin MovementOwnershipGuard (URL-fetch 403) alohida tasdiqlanmadi

**19.23  🟡 qisman**  — ❓ Siz dedingiz: POS Monitor hozirgi holati = man xohlaganim EMAS, to'liq qayta loyihalash kerak — bu hukm bajarildimi?
- Siz: OMBOR-KASSIR §0 (2026-06-08): BE+FE to'liq tahlil + qayta loyihalash; Excel-jadval ko'rinish, pres-kirim, AI-nazorat chiqim
- Isbot: PosMonitorPage.tsx (FE) + 24 controller + 30+ jadval qurilgan (eski sodda holatdan ancha boy); LEKIN egasining nozik vizyon-talablari (texkarta-guard, foto-dalil, AI-anomaliya, davalcheskoye, smena-akt) hali yo'q — qayta loyihalash YARIM

**19.24  🟡 qisman**  — ❓ Siz dedingiz: har harakatda akt (PDF) + invoys (alohida PDF), raqam=Ombor+harakat-turi+yil+ketma-ket — bu bormi?
- Siz: EP-POS-051/073 / OMBOR §13: harakat akti PDF + invoys, raqamlash HOM-KIRIM-2026-00001 formati, imzo=ERP login
- Isbot: pos-pdf.service.ts + pos_pdf_templates jadval bor; pos_movements.act_pdf_path/invoice_pdf_path ustunlari bor; movement_number=POS-{yil}-{00001} (pos-movement.service.ts:138) — lekin Ombor+harakat-turi prefiksi (HOM-KIRIM) emas, generic POS- prefiks

**19.25  ❌ yo'q**  — ❓ Siz dedingiz: director dashboardi POS aggregatlarini ko'radi, drill-down GL entries'gacha boradi — bu bormi?
- Siz: Vizyon Q50: pos_director_summary materialized view (5-daq cron refresh), drill-down→entries
- Isbot: pos_director_summary yoki director_summary materialized view JONLI YO'Q (information_schema.views count=0); pos-reports.service.ts bor lekin director mat-view + drill-down zanjiri qurilmagan

---

## 20 — CC / Hujjat-shartnoma  (vizyon 52%, 23 savol)

> CC modulining YADROSI jonli va haqiqiy qurilgan: 17 cc_ jadval, 14 shablon (seed), 48 workflow-bosqich, to'liq 5-operatsiya workflow engine (createDraft/send/approve/reject/resubmit/cancel), org-sxema resolver (MANAGER_OF_SENDER + recursive org-tree fallback + DEPT_HEAD + POSITION + delegatsiya), bcrypt PIN-imzo (signature_hash), SLA cron (24h overdue + 48h + escalation), real Claude AI-intervyu (cc_ai_sessions=4), Telegram bot (inline approve/reject + PIN oqimi), pdf-lib PDF generatsiya, yil-reset advisory-lock raqamlash, version-snapshot. Modul app.module.ts:152 ro'yxatdan o'tgan. AMMO bu HR-ariza darajasidagi engine — egasining ShVB-vizyonining KATTA qismi YO'Q: (1) golden-thread Finance/GL-ga outbox event YO'Q (cc_outbox jadval yo'q, finance listener=0) — EP-CC-012/027/049 absent; (2) тех карта/Одобрена/опросный лист/orgpolitika/таъминот/хом-ашё/режа-қоғози shablon-oqimlari YO'Q (templates faqat avans/ta'til/transfer); (3) 'tanishdim'/НАЗОРАТ ВАРАҚАСИ (cc_policy_acknowledgments) YO'Q; (4) ai_draft AI-vs-xodim farqi YO'Q; (5) fayl-biriktirish upload endpoint YO'Q; (6) full-text tsvector qidiruv YO'Q; (7) muammo→orgpolitika kaskad va zanjir ota-bola bog'lanish YO'Q. 2 ZIDDIYAT: 48h auto-reject (cc-sla.cron.ts:115) vizyon 'avto-rad-etilmaydi' (Q30) ga zid; raqam createDraft'da beriladi (vizyon final-approve deydi). cc_documents=0 — qurilish bosqichi (jonli hujjat oqimi hali sinalmagan). Halol baho: poydevor-engine kuchli (~52%), lekin ShVB-ishlab-chiqarish hujjat-oqimi va golden-thread integratsiyasi qurilmagan.

**20.1  ✅ bor**  — ❓ EP-CC-001: Barcha rasmiy murojaat bitta 'Yangi hujjat yarat' → shablon tanlash orqali kiradi (yagona kirish nuqtasi)?
- Siz: ZNO/ZVS/доклад/распоряжение/ariza/buyruq — hammasi bitta yagona kirish: shablon tanlanadi, AI intervyu yoki qo'lda to'ldiriladi.
- Isbot: cc-workflow.service.ts:48 createDraft(templateId) + cc_document_templates=14 shablon (ADVANCE/DOKLAD/ORDER/ZRS_ZVS...); cc-documents.controller.ts:160 POST documents/draft.

**20.2  ✅ bor**  — ❓ EP-CC-003: AI to'liq intervyu o'tkazib (savol→javob→rasmiy matn) hujjatni tuzadimi?
- Siz: Xodim 'qanday yozishni' bilmaydi — AI savol beradi, javoblardan rasmiy matn tuzadi.
- Isbot: cc-ai-interview.service.ts:213 callClaude('cc.generate_document') real Claude chaqiruv; cc_ai_sessions=4 jonli sessiya; finalize() draft saqlaydi.

**20.3  ✅ bor**  — ❓ EP-CC-005: Marshrut org-sxemadan AVTO aniqlanadimi (manager_id zanjiri, vertikal sakramaydi)?
- Siz: Shablonda bosqichlar (1=boshliq, 2=moliya...) belgilanadi, tizim org-sxemadan o'zi topadi; vertikal→gorizontal, sakramaydi.
- Isbot: cc-org-resolver.service.ts:39 resolveApprover: MANAGER_OF_SENDER/CEO/DIRECTOR/DEPT_HEAD/POSITION:<CODE>; cc_workflow_steps=48 qator real bosqich konfiguratsiyasi.

**20.4  ✅ bor**  — ❓ EP-CC-006: Manager topilmasa (manager_id NULL/0) zaxira marshrut ishlaydimi (hech qachon yo'qolmaydi)?
- Siz: Manager yo'q bo'lsa DEPT_HEAD, u ham yo'q bo'lsa direktorga — hech qachon yo'qolmaydi.
- Isbot: cc-org-resolver.service.ts:126-168 resolveManagerOfSender: direct manager_id 0 qaytarsa org-tree bo'ylab WITH RECURSIVE yuqoriga yuradi, Result<number> qaytaradi (throw emas).

**20.5  ✅ bor**  — ❓ EP-CC-007: Har imzo PIN-kod bilan tasdiqlanadimi (isbotli imzo)?
- Siz: PIN-kod har imzoga; qulay+isbotli; ERP tasdig'ini isbotlaydi.
- Isbot: cc-pin.service.ts:55 verifyAndSign bcrypt.compare + sha256 signature_hash; send/approve/reject/cancel har biri pin.verifyAndSign chaqiradi (cc-workflow.service.ts:84,162).

**20.6  ✅ bor**  — ❓ EP-CC-008/009: Imzo ketma-ket bosqichli, rad→sabab majburiy→resubmit ishlaydimi?
- Siz: Bosqichli oqim (1-bosqich tugagach 2-bosqich); rad → yuboruvchiga sabab bilan → tuzatib resubmit.
- Isbot: cc-workflow-approve.helpers.ts:43-95 stepOrder bo'yicha keyingi bosqichga o'tish; reject() RejectDto.comment, resubmit() faqat 'rejected' holatdan, version+1 (cc-workflow.service.ts:173-208).

**20.7  🟡 qisman**  — ❓ EP-CC-010/013: SLA eskalatsiya CRON ishlaydimi (24h→qizil/eslatma, kechiksa eskalatsiya)?
- Siz: 24 soat → qizil + egasiga eslatma; 48 soat → boshliqqa; 2x eslatma → eskalatsiya → HR.
- Isbot: cc-sla.cron.ts:37 EVERY_30_MIN: markInboxOverdue(inbox_sla_hours), escalateApprovals(deadline_at). YETISHMAYDI: HR-ga eskalatsiya yo'q; cron jonli ishlovчisi cc_documents=0 (data yo'q).

**20.8  🟡 qisman**  — ❓ EP-CC-030: 48 soatda direktor javob bermasa hujjat 'overdue' belgisi oladimi (avtomatik rad ETILMAYDI)?
- Siz: Hujjat avtomatik tasdiqlanmaydi yoki rad etilmaydi — faqat 'overdue' belgisi; eslatmalar davom etadi.
- Isbot: ZIDDIYAT: cc-sla.cron.ts:115 autoRejectOverdue48h hujjatni workflow_state='rejected' qiladi — vizyon (decisions Q30/EP-CC-030) 'avto rad ETILMAYDI' deydi. Kod vizyonga zid.

**20.9  ❌ yo'q**  — ❓ EP-CC-012/027/049: Tasdiqlangach outbox orqali Finance/GL-ga event uzatiladimi (golden-thread)?
- Siz: ZVS tasdiqlangach transactional outbox → Finance handler; oxirgi imzoda GL yozuvi trigger bilan, reference_document=ZVS raqami.
- Isbot: cc-workflow-approve.helpers.ts:48 final approve faqat workflow_state='approved'+basket='outbox' qiladi — hech qanday event/publish yo'q. cc_outbox jadval YO'Q; finance/ ichida cc listener=0 (grep bo'sh).

**20.10  🟡 qisman**  — ❓ EP-CC-015/043: Hujjat raqami avto, yil boshida noldan, FINAL tasdiqda beriladimi?
- Siz: Avto-raqam (ZVS-2026-0042), yil boshida noldan; raqam faqat oxirgi bosqich imzosi tugagach beriladi.
- Isbot: cc-document-number.service.ts:46 nextSequence yil bo'yicha (EXTRACT(YEAR)), advisory-lock atomik — bu BOR. AMMO raqam createDraft paytida beriladi (line 53), vizyon final-approve da deydi — vaqt nuqtasi zid.

**20.11  🟡 qisman**  — ❓ EP-CC-016/074: Tasdiqlangan hujjat immutable, o'chmaydi, faqat arxivga ko'chadimi?
- Siz: Tasdiqlangan hujjat/qayd immutable — o'chmaydi, faqat arxivga; tuzatish=yangi versiya.
- Isbot: cc-baskets.repo.ts:146 archived_at belgilanadi (soft-archive), cc_document_versions writer bor (write.repo.ts:201 resubmit snapshot). YETISHMAYDI: DB-darajada UPDATE/DELETE bloklovchi trigger/constraint yo'q — faqat application-level.

**20.12  🟡 qisman**  — ❓ EP-CC-018: Har tasdiqlangan hujjat PDF chiqadimi (logotip+raqam+imzo zanjiri+sana)?
- Siz: Har qanday hujjat PDF: logotip + raqam + imzo zanjiri + sana, rasmiy ko'rinish.
- Isbot: cc-pdf.service.ts:47 generate() pdf-lib bilan real A4 PDF (signature_hash:97 imzolar chiqadi); GET documents/:id/pdf:88 endpoint bor. BullMQ queue (decisions Q26) yo'q — sinxron render.

**20.13  🟡 qisman**  — ❓ EP-CC-021/040: Marshrut/mas'uliyat lavozim-kartasiga bog'lanadimi (xodim emas)?
- Siz: Marshrut lavozim kartasiga bog'lanadi; xodim almashsa ham ishlaydi; mas'uliyat lavozimga.
- Isbot: cc-org-resolver.service.ts:192 POSITION:<CODE> positions.code bo'yicha resolve — lavozimga bog'liq. AMMO MANAGER_OF_SENDER employees.manager_id (xodim) ishlatadi; karta-model (card_id) bevosita ulanmagan.

**20.14  ✅ bor**  — ❓ EP-CC-023: Telegram orqali PIN bilan tasdiqlash/rad qilish ishlaydimi?
- Siz: Telegramga xabar + tasdiq/rad tugmasi (PIN bilan); imzolovchiga Telegram+ERP boradi.
- Isbot: cc-bot.service.ts:169 bot.action approve:<docId> → awaiting_pin_approve → PIN so'raydi → workflow.approve; reject:184 reason+PIN oqimi; inline keyboard list:inbox/pending/outbox (104-107).

**20.15  🟡 qisman**  — ❓ EP-CC-031: Qoralama avto-saqlanib davom ettiriladimi (AI-intervyu uzilsa ish yo'qolmaydi)?
- Siz: Qoralama avto-saqlanadi, keyin davom ettiriladi; uzun AI-intervyu uzilsa ish yo'qolmaydi.
- Isbot: cc-ai-interview.service.ts:167 findCachedDraft draft_document_id qayta ishlatadi (idempotent finalize); cc_ai_sessions jadval javoblarni saqlaydi. 30s interval avto-save (decisions Q4) topilmadi — finalize-da saqlanadi.

**20.16  ❌ yo'q**  — ❓ EP-CC-033/035/080: 'Yozma majburiy 6 tur' / og'zaki=qaror emas qoidasi tizimda bormi?
- Siz: 6 tur (qaror/reja o'zgarish/vazifa/тех карта o'zgarish/sifat xulosa/ogohlantirish) majburiy hujjat; og'zaki rasmiy emas — UI'da ogohlantirish.
- Isbot: cc_document_templates=14 lekin asosan HR-ariza (avans/ta'til/transfer); 'yozma-majburiy 6 tur' tegi/flagi yo'q. Kanban/chat→'rasmiy emas' toast bloklov logikasi topilmadi.

**20.17  ❌ yo'q**  — ❓ EP-CC-052/053/054/055: Muammo→orgpolitika kaskad + 'tanishdim' qayd (НАЗОРАТ ВАРАҚАСИ) bormi?
- Siz: Muammo-hujjat→orgpolitika avto tug'iladi→adaptatsiya menejeriga o'qitish (1 kun)→har xodim 'tanishdim' (PIN); НАЗОРАТ ВАРАҚАСИ raqamli imzo-qatorlari.
- Isbot: cc_policy_acknowledgments jadval YO'Q; orgpolitika shabloni cc_document_templates'da yo'q; muammo→orgpolitika kaskad va НАЗОРАТ ВАРАҚАСИ kodi topilmadi (grep bo'sh).

**20.18  ❌ yo'q**  — ❓ EP-CC-056/057/082: тех карта 'Одобрена' muhri + опросный лист moslik + zanjir-bog'lanish (ota-bola) bormi?
- Siz: тех карта oqimi: опросный лист→тех карта moslik→Лаборатория 'Одобрена' muhri→ишлаб чиқариш; hujjatlar zanjir (ota-bola) bo'lib bog'lanadi.
- Isbot: тех карта/опросный лист/Одобрена shablon-oqimi CC'da yo'q (templates=14 ariza-fokus); cc_documents'da parent_document_id/zanjir-bog'lanish ustuni va MES-darvoza topilmadi.

**20.19  ❌ yo'q**  — ❓ EP-CC-058/059/060: Taъминот/хом-ашё заявка + Режа қоғози (fakt vazn) shablonlari bormi?
- Siz: Taъминот заявкаси, smena хом-ашё заявкаси (2 soat SLA), рулон режа қоғози (reja+fakt vazn→buxgalteriya).
- Isbot: cc_document_templates ro'yxatida taъминот/хом-ашё/режа-қоғози shablon YO'Q (faqat ADVANCE/VACATION/ORDER/ZRS_ZVS...); rulon fakt-vazn→Finance oqimi topilmadi.

**20.20  ❌ yo'q**  — ❓ EP-CC-005(decision)/043: AI asl varianti alohida 'ai_draft' versiyasi sifatida saqlanadimi (AI vs xodim tahriri farqi)?
- Siz: AI tuzgan asl variant alohida ai_draft versiyasi; audit izida 'AI tavsiya' vs 'xodim o'zgartirishi' farqi ko'rinadi; AI asl o'chirilmaydi.
- Isbot: grep ai_draft/aiDraft/ai_version = bo'sh; cc-ai-interview.service.ts faqat bitta aiBody saqlaydi, AI-asl vs xodim-tahrir farqlovchi versiya yo'q.

**20.21  🟡 qisman**  — ❓ EP-CC-017/020: Arxivdan ko'p-mezonli + full-text (tsvector) qidiruv bormi?
- Siz: Tur+sana+yuboruvchi+holat+matn ichidan full-text qidiruv (PostgreSQL tsvector, kirill+lotin, GIN, <200ms).
- Isbot: cc-documents-read.repo.ts category/subject/status bo'yicha bazaviy filter bor; AMMO tsvector/to_tsvector/GIN full-text indeks YO'Q (grep infrastructure bo'sh) — matn-ichidan qidiruv yetishmaydi.

**20.22  ❌ yo'q**  — ❓ EP-CC-025: Hujjatga bir nechta fayl/rasm (asos hujjat — schyot/shartnoma) biriktirish bormi?
- Siz: Bir nechta fayl (PDF/rasm) biriktirish; ZNO/ZVS ga hujjat-asos kerak; UUID+hujjat-raqam nomlash, ERP serverda saqlash.
- Isbot: cc_attachments jadval bor lekin upload endpoint YO'Q (cc-documents.controller.ts'da @Post upload yo'q; :93 'attachment' faqat PDF Content-Disposition); cc_attachments=0 qator.

**20.23  🟡 qisman**  — ❓ EP-CC-019/032/075: Hujjat turlari master-data + 3 til (kirill ustuvor) qo'llab-quvvatlanadimi?
- Siz: To'liq ShVB to'plami master-data; hujjat 3 yozuvda (lotin/kirill/ru), default kirill (haqiqiy hujjatlar kirillda).
- Isbot: cc_document_templates master-data (name_uz, category) bor; createDraft language 'uz'/'ru' qabul qiladi (cc-workflow.types). AMMO uz-cyr alohida nusxa/kirill-default va to'liq ShVB to'plami (тех карта/orgpolitika) yetishmaydi.

---

