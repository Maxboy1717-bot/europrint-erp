# Modul 12 — LMS / Darslik — Mustaqil Tekshiruv (2026-06-27)

**Auditor:** adversarial verifier (kod + jonli DB bilan tasdiq)
**Savollar:** 85 | **Doc da'vosi:** vizyon 52%
**Doc flag taqsimi:** ✅ bor=9, 🟡 qisman=43, ❌ yo'q=25, 🔑 egasi-data=8
**Qayta hisoblangan realPct (verifiable=77):** ~40% (bor=9, qisman=43, yoq=25)

## Umumiy xulosa
Doc 12-modul bo'yicha **g'ayrioddiy halol** — aksariyat Isbot da'volari aniq fayl:satr / jadval / ustun / endpointni to'g'ri ko'rsatadi va ular jonli mavjud. Mexanizm-skelet (oylik-gate, auto-enroll, exam→razryad, card-mentor CRUD, completion 3-mezon, video/micro-modul, kaizen CRUD) REAL. Vizyonning "kitob" qismi (12-mavzu shablon, nazorat varaqasi obyekti, glossariy, amaliy rubrika, RD-4/instruktaj qadamlari, qatlamlash, maxsus kurslar) haqiqatan QURILMAGAN — doc buni to'g'ri ❌ deb belgilagan.

## REFUTED CLAIMS (overstated/noto'g'ri)
- **12.22** — Isbot "kaizen_suggestions'da impact/bonus ustuni YO'Q" deydi, lekin `expected_impact` ustuni JONLI MAVJUD (\d kaizen_suggestions). Bonus-mexanizm yo'qligi to'g'ri (flag yoq o'rinli), ammo "impact ustuni yo'q" da'vosi noto'g'ri.
- **12.5 / 12.79** — Isbot `lms_tests`/`lms_questions`ni "jadval" deydi; jonli DB'da ular **VIEW** (relkind=v), INSERT rule yo'q. LmsTests/LmsQuestionsController CRUD mavjud, lekin write-yo'li view ustidan (ishlashi shubhali). Flag qisman o'rinli, ammo "jadval" atamasi va to'liq CRUD ishlashi overstated.

## Naming nuance (refute emas, lekin qayd)
`lms_enrollments`, `lms_certificates`, `lms_modules`, `lms_assignments` — bularning hammasi **VIEW** (baza: enrollments/certificates/modules/assignments). Doc ularni "jadval" deb ataydi; relation mavjud bo'lgani uchun hard-refute emas, lekin terminologik aniq emas.

---

## 12.1 — EP-LMS-001 [DOC: bor] → [VERIFIED: bor] (CLAIM: confirmed)
- Savol: Darslik kartaga biriktiriladimi?
- Doc Isbot: courses.card_id + index; by-card/:cardId (lms-courses.controller.ts:79); FE CardCoursesDialog
- Tekshiruv: `\d courses` → card_id integer + `idx_courses_card_id`. lms-courses.controller.ts:79 `@Get('by-card/:cardId')` → findCoursesByCard. FE CardCoursesDialog.tsx mavjud. courses.card_id=0/5 (egasi-data). TASDIQ.

## 12.2 — EP-LMS-002 [DOC: bor] → [VERIFIED: bor] (CLAIM: confirmed)
- Savol: Darslik tugamasa karta oyligi to'xtaydimi?
- Doc Isbot: payroll.service.ts:438 isCardTrainingComplete; fail-closed; LmsCardGateService 267 qator
- Tekshiruv: payroll.service.ts:438 `lmsGate.isCardTrainingComplete(cardId, employeeId)`; 433 FAIL-CLOSED izoh; 441/444 lmsBlocked=true. lms-card-gate.service.ts = 267 qator. TASDIQ.

## 12.3 — EP-LMS-003 [DOC: bor] → [VERIFIED: bor] (CLAIM: confirmed)
- Savol: Ishga olinganda majburiy kurslar avto-tayinlanadimi?
- Doc Isbot: card-employee-assigned.handler @OnEvent('org.card.employee.assigned') → autoEnroll ON CONFLICT
- Tekshiruv: card-employee-assigned.handler.ts:37 `CARD_EMPLOYEE_ASSIGNED_EVENT='org.card.employee.assigned'`; :99 autoEnroll. drizzle-lms.repo.ts:263 `ON CONFLICT (employee_id, course_id)`. Idempotent. TASDIQ.

## 12.4 — EP-LMS-004 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Kurs tugamasa MES bloklanadimi?
- Doc Isbot: lms-cert-expired-block.service REAL UPDATE (deactivateSkill→mes); kurs-tugatish→ish-boshlash gate ko'rinmadi
- Tekshiruv: lms-cert-expired-block.service.ts:52 deactivateSkill → `UPDATE employee_skills`. Cert-muddat asosida blok REAL; enrollment-incomplete→MES start-gate yo'q. Doc halol qisman. TASDIQ.

## 12.5 — EP-LMS-005 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: refuted)
- Savol: Reglament test banki bormi?
- Doc Isbot: lms_tests/lms_questions jadval + LmsTestsController CRUD (lms-tests.controller.ts:41-137), data 0
- Tekshiruv: lms-tests.controller.ts:35 @Controller('tests') + :83 @Controller('questions') CRUD mavjud. LEKIN lms_tests/lms_questions = **VIEW** (relkind=v), INSERT rule 0 — "jadval" da'vosi noto'g'ri, write-CRUD shubhali. Data=0. Flag qisman o'rinli, Isbot overstated.

## 12.6 — EP-LMS-006 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Reglament testi 7-kun muddat?
- Doc Isbot: started_at/certificate_expires_at bor; 7-kunlik cron yo'q
- Tekshiruv: enrollments.started_at + certificate_expires_at mavjud. 7-kun deadline cron LMS'da topilmadi. TASDIQ (halol qisman).

## 12.7 — EP-LMS-007 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: 7-kun o'tib bosqichli oqibat?
- Doc Isbot: oylik/MES-gate bor, lekin kun1/kun3 eskalatsiya cron yo'q
- Tekshiruv: Gate mexanizmlari (12.2/12.4) bor; bosqichli eskalatsiya cron yo'q. TASDIQ.

## 12.8 — EP-LMS-008 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Test yiqilsa 2 marta qayta-test?
- Doc Isbot: courses.max_attempts; lms_exam_attempts/lms_test_attempts (0 qator); 2-urinish AI-trigger yo'q
- Tekshiruv: courses.max_attempts ustun mavjud. lms_exam_attempts=0, lms_test_attempts=0. Auto-qayta-o'qish AI-trigger kodi yo'q. TASDIQ.

## 12.9 — EP-LMS-009 [DOC: egasi-data] → [VERIFIED: egasi-data] (CLAIM: confirmed)
- Savol: O'tish bali kurs turiga qarab?
- Doc Isbot: lms-completion.constants.ts GENERAL=70, TX=100; courses.passing_score
- Tekshiruv: lms-completion.constants.ts:17 `LMS_GENERAL_PASS_THRESHOLD_PCT=70`, :22 `LMS_TX_PASS_THRESHOLD_PCT=100` (yo'l application/constants/, doc "services/" degan — minor drift, simbol to'g'ri). courses.passing_score mavjud. egasi-data. TASDIQ.

## 12.10 — EP-LMS-010 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Micro-modullar?
- Doc Isbot: LmsMicroModulesController + recordMicroModuleView (lms-misc.service.ts:18); modules=9
- Tekshiruv: lms-misc.service.ts:18 recordMicroModuleView REAL (repo delegate). modules=9, micro_modules=1, micro_module_views=1. Resume/timer yengil. TASDIQ.

## 12.11 — EP-LMS-011 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Micro-modul ketma-ketligi majburiymi?
- Doc Isbot: order/order_index/sort_order bor; qattiq-gate yo'q; courses.prerequisite_course_id
- Tekshiruv: courses.prerequisite_course_id mavjud (\d courses). Modul-darajada sequential hard-gate yo'q. TASDIQ.

## 12.12 — EP-LMS-012 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Kurs o'quv bo'limi→AI→HR+rahbar?
- Doc Isbot: author_id/created_by + POST/PATCH/approve (lms-courses.controller.ts:98,125,198)
- Tekshiruv: courses.author_id + created_by mavjud. lms-courses.controller.ts:98 @Post, :125 @Patch, :184 @Post submit, :198 @Post approve (2-imzo, approver!=submitter). Multi-stage AI→HR→rahbar yo'q. TASDIQ.

## 12.13 — EP-LMS-013 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: AI o'qish nazorati + PDF hisobot?
- Doc Isbot: agents/lms-agent.service.ts; progress/summary (lms-misc.controller.ts:290); PDF generator yo'q
- Tekshiruv: lms-agent.service.ts mavjud (55 qator). lms-misc.controller.ts:290 @Get('summary'), :282 user/:id. PDF AI-hisobot generatori yo'q. TASDIQ.

## 12.14 — EP-LMS-014 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: AI chatbot o'qitish?
- Doc Isbot: lms-agent.service; telegram/lms.handler.ts (83) faqat bildirishnoma
- Tekshiruv: telegram/handlers/lms.handler.ts = 83 qator (notification). Interaktiv chatbot tushuntirish kanali yo'q. TASDIQ.

## 12.15 — EP-LMS-015 [DOC: bor] → [VERIFIED: bor] (CLAIM: confirmed)
- Savol: Razryad imtihoni LMS ichida, o'tsa HR signal+sertifikat?
- Doc Isbot: exam-passed.contract EXAM_PASSED_EVENT='lms.exam.passed'; ExamPassedRazryadHandler ai_suggested
- Tekshiruv: exam-passed.contract.ts:12 `EXAM_PASSED_EVENT='lms.exam.passed'`. org-structure/exam-passed-razryad.listener.ts:33 ExamPassedRazryadListener @OnEvent → RazryadHistoryService.createRequest(ai_suggested=true). Zanjir ulangan. TASDIQ.

## 12.16 — EP-LMS-016 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Razryad imtihoni 3 oylik oraliq?
- Doc Isbot: exam-zanjir bor, 3 oy interval cron yo'q
- Tekshiruv: exam-passed zanjir bor (12.15). 3-oy minimal interval gate LMS'da topilmadi. TASDIQ.

## 12.17 — EP-LMS-017 [DOC: bor] → [VERIFIED: bor] (CLAIM: confirmed)
- Savol: Razryad o'sishi tasdiq bilanmi?
- Doc Isbot: ai_suggested=true (avto-ko'tarmaydi); 2-imzo qulflangan
- Tekshiruv: listener createRequest ai_suggested=true (faqat pending so'rov, qo'lda tasdiq). Tasdiq-darvoza printsipi REAL. TASDIQ.

## 12.18 — EP-LMS-018 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Ichki sertifikat PDF avto?
- Doc Isbot: lms_certificates+certificates + issue (lms-certificates.controller.ts:55); PDF=HTML stub (standalone:98)
- Tekshiruv: lms-certificates.controller.ts:55 @Post('issue'). certificates=0 (lms_certificates=VIEW over certificates). standalone:98 download → hardcoded HTML stub (raqam+sana). TASDIQ.

## 12.19 — EP-LMS-019 [DOC: egasi-data] → [VERIFIED: egasi-data] (CLAIM: confirmed)
- Savol: Sertifikat amal muddati?
- Doc Isbot: enrollments.certificate_expires_at + expiring-certificates (lms-enrollments.controller.ts:199)
- Tekshiruv: enrollments.certificate_expires_at mavjud. lms-enrollments.controller.ts:199 @Get('expiring-certificates'). Muddat qiymati egasi. TASDIQ.

## 12.20 — EP-LMS-020 [DOC: bor] → [VERIFIED: bor] (CLAIM: confirmed)
- Savol: Kaizen taklif + holat?
- Doc Isbot: kaizen_suggestions (1) + createSuggestion/updateSuggestion(status,reviewComment) REAL
- Tekshiruv: kaizen.service.ts:14 createSuggestion, :26 updateSuggestion(status,reviewComment). kaizen_suggestions=1 qator. \d → status, expected_impact, approved_by. TASDIQ.

## 12.21 — EP-LMS-021 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Kaizen PDCA tsikli?
- Doc Isbot: plan/do/check/act/pdca_stage ustunlari YO'Q
- Tekshiruv: \d kaizen_suggestions → faqat status (+expected_impact/approved_by). plan/do/check/act/pdca YO'Q. TASDIQ.

## 12.22 — EP-LMS-022 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: refuted)
- Savol: Kaizen bonus rag'bati?
- Doc Isbot: "impact/bonus ustuni YO'Q"; payroll↔kaizen bonus ulanishi yo'q
- Tekshiruv: `expected_impact` ustuni JONLI MAVJUD (\d kaizen_suggestions) — "impact ustuni yo'q" NOTO'G'RI. createSuggestion expectedBenefit param oladi. Bonus/payroll ulanishi haqiqatan yo'q (flag yoq o'rinli), lekin Isbot detali noto'g'ri.

## 12.23 — EP-LMS-023 [DOC: bor] → [VERIFIED: bor] (CLAIM: confirmed)
- Savol: Kurs holati ro'yxati?
- Doc Isbot: enrollments.status + started_at/completed_at; 15 qator
- Tekshiruv: \d enrollments → status (default 'enrolled'), started_at, completed_at. enrollments=15 qator. (lms_enrollments=VIEW). TASDIQ.

## 12.24 — EP-LMS-024 [DOC: bor] → [VERIFIED: bor] (CLAIM: confirmed)
- Savol: Video ko'rilganlik nazorati?
- Doc Isbot: video_progress + saveVideoProgress REAL upsert (drizzle-lms-misc.repo.ts:44)
- Tekshiruv: drizzle-lms-misc.repo.ts:44 saveVideoProgress → real UPDATE/INSERT (current_time, duration, completed, user_id, lesson_id). video_progress=0 qator, lekin yozuvchi REAL. FE video-progress ulangan. TASDIQ.

## 12.25 — EP-LMS-025 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Lavozim papkasi bilan bog'lanish?
- Doc Isbot: FE CardFolderDialog + CardCoursesDialog; courses.card_id
- Tekshiruv: FE CardFolderDialog.tsx + CardCoursesDialog.tsx mavjud. position_folders jadval jonli mavjud. 6-bo'lim to'liq integratsiya qisman. TASDIQ.

## 12.26 — EP-LMS-026 [DOC: bor] → [VERIFIED: bor] (CLAIM: confirmed)
- Savol: is_mandatory kartada?
- Doc Isbot: courses.is_mandatory; LmsCardGateService faqat majburiyni gate; FE ko'rsatadi
- Tekshiruv: \d courses → is_mandatory boolean default false. Gate-service majburiy kurslarni gate qiladi. TASDIQ.

## 12.27 — EP-LMS-027 [DOC: egasi-data] → [VERIFIED: egasi-data] (CLAIM: confirmed)
- Savol: O'qish davomati 3-kun blokiga ta'sir?
- Doc Isbot: oylik-gate bor; davomat↔o'qish granular bog'lanish egasi-OCHIQ
- Tekshiruv: Gate asoslari bor (12.2); granular qoida belgilanmagan. egasi-data. TASDIQ.

## 12.28 — EP-LMS-028 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Yangi reglament kartaga bog'lab xodimlarni qamraydimi?
- Doc Isbot: courses.card_id + auto-enroll event; reglament→karta→test event-zanjiri qisman
- Tekshiruv: card_id + auto-enroll (12.3) bor. Reglament-hujjat→test avto-tushish to'liq event-zanjiri yo'q. TASDIQ.

## 12.29 — EP-LMS-029 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: O'quv hisoboti/dashboard?
- Doc Isbot: GET stats (lms-enrollments.controller.ts:184) + progress/summary; FE Courses.tsx
- Tekshiruv: lms-enrollments.controller.ts:184 @Get('stats'). progress/summary (12.13). FE Courses.tsx mavjud. RBAC-filtrli+AI-tahlil qisman. TASDIQ.

## 12.30 — EP-LMS-030 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Onboarding (90 kun) LMS bog'lanish?
- Doc Isbot: hr_onboarding_processes=30/milestones=90; hr_mentorship_pairings (0)
- Tekshiruv: hr_onboarding_processes=30, hr_onboarding_milestones=90, hr_mentorship_pairings=0 (jonli count). Onboarding↔LMS-kurs to'g'ridan bog'lanish qisman. TASDIQ.

## 12.31 — EP-LMS-031 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Nazorat varaqasi raqamli artefakt?
- Doc Isbot: alohida nazorat_varaqa jadval YO'Q; topics course_progress'dan derive (drizzle-lms.repo.ts:348)
- Tekshiruv: nazorat_varaqa jadval yo'q. drizzle-lms.repo.ts:348 topics COUNT(*) FROM course_progress derive. Mustaqil varaqa-obyekt yo'q. TASDIQ.

## 12.32 — EP-LMS-032 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Ikki varaqa (lavozim+ishga xos)?
- Doc Isbot: ikki turdagi varaqa ajratmasi yo'q; courses'da tur yo'q
- Tekshiruv: courses'da lavozim-vs-ishga-xos turi ustuni yo'q. Struktura yo'q. TASDIQ.

## 12.33 — EP-LMS-033 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: 12 universal mavzu shabloni?
- Doc Isbot: grep 12 mavzu/twelveTopic/standardTopics = 0
- Tekshiruv: grep twelveTopic|standardTopics|topic_template|12 mavzu modules/lms/ → 0 natija. Shablon yo'q. TASDIQ.

## 12.34 — EP-LMS-034 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Mavzu-mavzu tasdiq (7/12)?
- Doc Isbot: confirmed_at KUTADI lekin mavzu-tasdiq jadvali YO'Q; course_progress derive (drizzle-lms.repo.ts:353)
- Tekshiruv: drizzle-lms.repo.ts:353 confirmedTopics = course_progress.done. Mustaqil mavzu-tugma jadvali yo'q. TASDIQ.

## 12.35 — EP-LMS-035 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Vaziyat-savol ikki qismli?
- Doc Isbot: lms_exam_questions options+correct_option bor; explanation/open_answer/ai_review YO'Q; answers faqat selected_option
- Tekshiruv: \d lms_exam_questions → options(jsonb)+correct_option(int), explanation/open_answer/ai_review YO'Q. \d lms_exam_answers → selected_option faqat. TASDIQ.

## 12.36 — EP-LMS-036 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Сборник упражнений alohida blok?
- Doc Isbot: exercises alohida jadval yo'q; lms_assignments (0) lekin ajratilmagan
- Tekshiruv: assignments=0 (lms_assignments=VIEW). Amaliy-mashqlar ajratilgan struktura yo'q. TASDIQ.

## 12.37 — EP-LMS-037 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Glossariy har kursga?
- Doc Isbot: grep glossar LMS = 0; knowledge_base bor lekin kurs-glossariy emas
- Tekshiruv: grep glossar|lug'at modules/lms/ → 0 natija. knowledge_base=0. Glossariy mexanizmi yo'q. TASDIQ.

## 12.38 — EP-LMS-038 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Mustaqil ishga qo'yish bosqichli zanjir?
- Doc Isbot: hr_onboarding_processes(30)+milestones(90) skelet; 10-bosqichli aniq gate emas
- Tekshiruv: 30/90 jonli. Generic milestone; NO-1/RD-4/TX/buyruq aniq ketma-ket gate yo'q. TASDIQ.

## 12.39 — EP-LMS-039 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: RD-4 lavozim aniqlash suhbati?
- Doc Isbot: RD-4 qadami yo'q; mentor_id bor lekin RD-4 qaror qadami yo'q
- Tekshiruv: Onboarding-da RD-4 maxsus qadam topilmadi. TASDIQ.

## 12.40 — EP-LMS-040 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: 2 oylik amaliy taymer?
- Doc Isbot: expected_end_date/actual_end_date bor; 2 oy taymer+imtihon-eslatma cron yo'q
- Tekshiruv: onboarding muddat ustunlari skeleti bor; aniq 2-oy taymer cron yo'q. TASDIQ.

## 12.41 — EP-LMS-041 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: 2 imtihon (nazariy+amaliy)?
- Doc Isbot: lms-completion.service C1(theory)+C2(practical) modellashtirilgan; amaliy rubrika data-manbai yo'q
- Tekshiruv: lms-completion.service.ts:8-10 C1 theory + C2 practical + C3 topics. practicalPassed = status==='completed' derive (drizzle-lms.repo.ts:346). Rubrika data yo'q. TASDIQ.

## 12.42 — EP-LMS-042 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: RD-4 yozma xulosa qadami?
- Doc Isbot: yozma xulosa onboarding qadami/maydoni yo'q
- Tekshiruv: Yozma-xulosa artefakt topilmadi. TASDIQ.

## 12.43 — EP-LMS-043 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Ruxsat = avto buyruq + razryad/oylik faollashish?
- Doc Isbot: oylik-gate faollashish bor; avto mustaqil-ish buyrug'i (DocumentCreated) zanjiri yo'q
- Tekshiruv: Gate bor (12.2). Onboarding-yopilgach avto-buyruq event yo'q. TASDIQ.

## 12.44 — EP-LMS-044 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: TX birinchi majburiy modul?
- Doc Isbot: cert-expired→MES blok REAL; TX birinchi-modul gate aniq emas
- Tekshiruv: lms-cert-expired-block.service REAL (12.4). TX-birinchi sequential gate yo'q (cert-muddat asosida). TASDIQ.

## 12.45 — EP-LMS-045 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Ish joyida birinchi instruktaj qaydi?
- Doc Isbot: instruktaj alohida qadam/qayd yo'q
- Tekshiruv: Maxsus instruktaj-qayd topilmadi. TASDIQ.

## 12.46 — EP-LMS-046 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: ЦКП kursda kartadan keladimi?
- Doc Isbot: ЦКП karta atributi (org_departments); courses.card_id bog'lanish; kurs-mavzu READ yo'q
- Tekshiruv: \d org_departments → tskp, tskp_target, ckp_formula_type, ckp_frequency JONLI. courses.card_id bor. Kurs-mavzu sifatida ЦКП READ-ko'rsatish yo'q (12-mavzu shablonsiz). TASDIQ.

## 12.47 — EP-LMS-047 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Ko'p xatolar bloki + jonli QC/MES?
- Doc Isbot: xatolar bloki + defect-event→LMS yo'q
- Tekshiruv: Mavzu-blok va jonli yangilanish topilmadi. TASDIQ.

## 12.48 — EP-LMS-048 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Muvaffaqiyatli harakatlar blanka?
- Doc Isbot: blanka jadval/endpoint yo'q; NO-14 oqimi yo'q
- Tekshiruv: Blanka strukturasi topilmadi. TASDIQ.

## 12.49 — EP-LMS-049 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Malaka talablari kursda/kartada?
- Doc Isbot: card_required_knowledge + CardRequiredKnowledgeController CRUD (0 qator)
- Tekshiruv: card-required-knowledge.controller.ts:42 @Controller('lms/card-knowledge') by-card/:cardId + POST + DELETE. card_required_knowledge=0. Avto-generatsiya yo'q. TASDIQ.

## 12.50 — EP-LMS-050 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Domen-bilim modullari katalogga bog'liq?
- Doc Isbot: card_required_knowledge CRUD bor; MaterialAdded→LMS event yo'q
- Tekshiruv: card_required_knowledge CRUD (12.49). Material-katalog↔kurs avto-yangilanish event yo'q. TASDIQ.

## 12.51 — EP-LMS-051 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Statistik ko'rsatkichlar = karta KPI?
- Doc Isbot: KPI'dan READ kurs-mavzu yo'q (shablon yo'q)
- Tekshiruv: Kurs-mavzu sifatida KPI READ topilmadi. TASDIQ.

## 12.52 — EP-LMS-052 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Lavozim huquq/javobgarlik o'qitilishi?
- Doc Isbot: huquq/javobgarlik kurs-mavzulari yo'q
- Tekshiruv: Topilmadi (shablon yo'q). TASDIQ.

## 12.53 — EP-LMS-053 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Ish joyi vositalari jihozlar katalogiga?
- Doc Isbot: card_required_knowledge CRUD; aktivlar-modul avto-bog'lanish yo'q
- Tekshiruv: card_required_knowledge bor (12.49). Jihoz-o'zgarsa-review event yo'q. TASDIQ.

## 12.54 — EP-LMS-054 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Org-chartdagi joylashuv mavzusi?
- Doc Isbot: jonli org-chart kurs-mavzu yo'q
- Tekshiruv: LMS-kurs-mavzuga org-chart ulanish yo'q. TASDIQ.

## 12.55 — EP-LMS-055 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: 7 departament umumiy kursi?
- Doc Isbot: courses=5; departament-tuzilma kursi seed yo'q
- Tekshiruv: courses=5 qator (jonli). Maxsus 7-dept kurs yo'q. TASDIQ.

## 12.56 — EP-LMS-056 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: NO-14 o'quv dasturi hajmini aniqlash?
- Doc Isbot: TRAINING_OFFICER roli RBAC'da; dastur-hajm endpoint/jadval yo'q
- Tekshiruv: TRAINING_OFFICER @Roles ishlatiladi (lms controllerlar). Dastur-hajm rejasi maxsus jadval yo'q. TASDIQ.

## 12.57 — EP-LMS-057 [DOC: egasi-data] → [VERIFIED: egasi-data] (CLAIM: confirmed)
- Savol: Murabbiy malakali ekanini tekshirish?
- Doc Isbot: lms_card_mentors CRUD; malaka-tekshiruv qoidasi egasi-OCHIQ
- Tekshiruv: lms-misc.controller.ts:223 POST cards, :243 PUT, :256 DELETE (mentor CRUD). Malaka-validatsiya kodi yo'q (egasi). TASDIQ.

## 12.58 — EP-LMS-058 [DOC: egasi-data] → [VERIFIED: egasi-data] (CLAIM: confirmed)
- Savol: Murabbiy bo'lmasa zaxira tartib?
- Doc Isbot: lms_card_mentors + AI-agent; zaxira fallback qoidasi belgilanmagan
- Tekshiruv: lms_card_mentors CRUD bor. Fallback avto-tayinlash kodi yo'q (egasi). TASDIQ.

## 12.59 — EP-LMS-059 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Murabbiy progressni real-time ko'radimi?
- Doc Isbot: lms_card_mentors + progress/by-user (lms-misc.controller.ts:282)
- Tekshiruv: lms-misc.controller.ts:282 @Get('user/:id') progress. Alohida mentor-shogird real-time panel to'liq emas. TASDIQ.

## 12.60 — EP-LMS-060 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Yakuniy yig'ma test (bo'lim-gate)?
- Doc Isbot: bo'lim-yakun test + gate yo'q; modules.order bor
- Tekshiruv: Bo'lim-yakun yig'ma test gate topilmadi. TASDIQ.

## 12.61 — EP-LMS-061 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Sinov muddati LMS bilan bog'liq?
- Doc Isbot: onboarding + completion-gate bor; sinov↔LMS yig'ish event yo'q
- Tekshiruv: Onboarding(30) + completion-gate bor. Probation-decision feed event yo'q. TASDIQ.

## 12.62 — EP-LMS-062 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Amaliy imtihon baholash varaqasi (rubrika)?
- Doc Isbot: rubrika jadvali yo'q; practicalPassed faqat boolean
- Tekshiruv: completion-service practicalPassed boolean (status derive). Rubrika manbai yo'q. TASDIQ.

## 12.63 — EP-LMS-063 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Lavozim o'zgarganda varaqa avto-tayinlash?
- Doc Isbot: card-employee-assigned auto-enroll bor; varaqa-obyekt yo'q
- Tekshiruv: auto-enroll (12.3) bor. Nazorat-varaqa obyekt yo'qligi sababli varaqa-avto-tayinlash yo'q. TASDIQ.

## 12.64 — EP-LMS-064 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Nazorat varaqasi kitob-PDF eksport?
- Doc Isbot: cert download = HTML stub (standalone:98); to'liq PDF emas
- Tekshiruv: standalone:98 hardcoded HTML stub. Kitob-formatli to'liq PDF + nazorat-varaqa eksport yo'q. TASDIQ.

## 12.65 — EP-LMS-065 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Yo'riqnoma o'zgarsa qayta-o'qish?
- Doc Isbot: versiya-diff→qayta-o'qish event yo'q; courses.updated_at bor
- Tekshiruv: courses.updated_at mavjud, lekin versiya-diff qayta-enroll mexanizmi yo'q. TASDIQ.

## 12.66 — EP-LMS-066 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: ERP-da ishlash majburiy modul?
- Doc Isbot: courses=5; bunday kurs seed yo'q
- Tekshiruv: courses=5, maxsus ERP-kurs yo'q. TASDIQ.

## 12.67 — EP-LMS-067 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Onboarding hujjatlar to'plami?
- Doc Isbot: hr_onboarding_checklists bor; to'liq yig'ma hujjat-to'plam yo'q
- Tekshiruv: hr_onboarding_checklists=0 (jonli, jadval mavjud). To'liq hujjat-to'plam yig'ma yo'q. TASDIQ.

## 12.68 — EP-LMS-068 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: 3 qatlamli o'quv qatlamlash?
- Doc Isbot: courses.department_id/org_department_id + card_id bor; 3-qatlam logikasi yo'q
- Tekshiruv: \d courses → department_id, org_department_id, card_id mavjud. Avto-qatlamlash logikasi yo'q. TASDIQ.

## 12.69 — EP-LMS-069 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Telegram bot eslatma?
- Doc Isbot: telegram/lms.handler.ts (83) faqat course-completed/cert; eslatma-oqim yo'q
- Tekshiruv: lms.handler.ts=83 qator (notification). Muddat-tugayapti/qayta-test eslatma oqimi yo'q. TASDIQ.

## 12.70 — EP-LMS-070 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: 3-mezon to'liq o'zlashtirish?
- Doc Isbot: completion.service 3-condition gate REAL; C3 course_progress derive, C2 rubrika data yo'q
- Tekshiruv: lms-completion.service.ts pure 3-mezon C1/C2/C3 (validatsiya bilan). C3=course_progress derive, C2=status derive. Mantiq bor, data-iplari chala. TASDIQ.

## 12.71 — EP-LMS-071 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: O'quv tarixi arxivi?
- Doc Isbot: enrollments + soft-delete; card_id orqali karta bilan qoladi; 7-yil retention to'liq emas
- Tekshiruv: enrollments + card_id bog'lanish bor. Nazorat-varaqa obyekt yo'q; retention oqimi qisman. TASDIQ.

## 12.72 — EP-LMS-072 [DOC: egasi-data] → [VERIFIED: egasi-data] (CLAIM: confirmed)
- Savol: Davriy qayta-tasdiq?
- Doc Isbot: certificate_expires_at + expiring endpoint; yillik cron yo'q (egasi)
- Tekshiruv: certificate_expires_at + expiring-certificates endpoint bor. Yillik cron yo'q. egasi-data. TASDIQ.

## 12.73 — EP-LMS-073 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: ОРГПОЛИТИКА hujjatlar testga?
- Doc Isbot: siyosat-hujjat→test bog'lanishi yo'q; lms_tests=0
- Tekshiruv: Siyosat-hujjat↔reglament-test ulanishi yo'q. TASDIQ.

## 12.74 — EP-LMS-074 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Tijorat siri/NDA majburiy modul?
- Doc Isbot: maxfiylik majburiy kurs + yozma-tasdiq yo'q
- Tekshiruv: Bunday modul seed yo'q. TASDIQ.

## 12.75 — EP-LMS-075 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Tashqi sertifikatni ichki kurs o'rniga?
- Doc Isbot: tashqi-import→ichki-kredit yo'q; cross_card_credits ichki-ichki
- Tekshiruv: lms_cross_card_credits=0 (ichki). Tashqi-import HR-tasdiq mexanizmi yo'q. TASDIQ.

## 12.76 — EP-LMS-076 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Replication testi (rahbar dars yaratadi)?
- Doc Isbot: courses.author_id + POST courses asoslari bor; maxsus Replication kanali yo'q
- Tekshiruv: courses.author_id + POST (12.12). Replication maxsus modul ajratilmagan. TASDIQ.

## 12.77 — EP-LMS-077 [DOC: yo'q] → [VERIFIED: yoq] (CLAIM: confirmed)
- Savol: Leadership/Origin testi?
- Doc Isbot: grep leadership/origin = maxsus jadval/kod yo'q
- Tekshiruv: Liderlik-test moduli topilmadi. TASDIQ.

## 12.78 — EP-LMS-078 [DOC: egasi-data] → [VERIFIED: egasi-data] (CLAIM: confirmed)
- Savol: Interaktiv simulyatsiya rejimi?
- Doc Isbot: simulyatsiya mexanizmi yo'q; ko'lam egasi (OCHIQ)
- Tekshiruv: Qaror→oqibat simulyatsiya kodi yo'q. egasi-data. TASDIQ.

## 12.79 — EP-LMS-079 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: refuted)
- Savol: Imtihon savollarini kim tuzadi?
- Doc Isbot: LmsQuestionsController CRUD + TRAINING_OFFICER RBAC + approve endpoint
- Tekshiruv: LmsQuestionsController (@Controller('questions')) + approve (lms-courses:198) bor. AMMO lms_questions=VIEW (relkind=v) insert-rulesiz — write-CRUD shubhali. Workflow AI-draft→tasdiq qisman. Isbot CRUD-ishlashini overstate qiladi.

## 12.80 — EP-LMS-080 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: AI yo'riqnomadan avto test/glossariy/micro-modul?
- Doc Isbot: lms-agent.service bor; drafting oqimi to'liq emas (glossariy yo'q)
- Tekshiruv: lms-agent.service.ts mavjud. Avto-drafting oqimi to'liq emas; glossariy umuman yo'q (12.37). TASDIQ.

## 12.81 — EP-LMS-081 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: O'qish davomida savol berish?
- Doc Isbot: lms_support_tickets + support/tickets POST (lms-core.controller.ts:166)
- Tekshiruv: lms-core.controller.ts:166 @Post('support/tickets') → db.insert(lms_support_tickets). lms_support_tickets jadval (relkind=r, 0 qator). AI-birlamchi+eskalatsiya qisman. TASDIQ.

## 12.82 — EP-LMS-082 [DOC: egasi-data] → [VERIFIED: egasi-data] (CLAIM: confirmed)
- Savol: Imtihon natijasi murabbiy reytingiga?
- Doc Isbot: lms_card_mentors bor; reyting-vazn egasi-OCHIQ
- Tekshiruv: lms_card_mentors CRUD bor. Murabbiy-reyting↔shogird-natija KPI-vazn kodi yo'q (egasi). TASDIQ.

## 12.83 — EP-LMS-083 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Kursga namuna fayl/rasm?
- Doc Isbot: courses.thumbnail/thumbnail_url + Storage moduli; mavzu-darajada namuna ajratilmagan
- Tekshiruv: \d courses → thumbnail + thumbnail_url mavjud. Mavzu-darajada to'g'ri/noto'g'ri misol struktura yo'q. TASDIQ.

## 12.84 — EP-LMS-084 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: Ko'p kartali xodim o'quv navbati?
- Doc Isbot: courses.card_id + LmsCardGateService har kartani mustaqil gate; birlamchi-birinchi tartib yo'q
- Tekshiruv: card_id + gate per-card bor. Birlamchi-karta-birinchi navbat logikasi yo'q. TASDIQ.

## 12.85 — EP-LMS-085 [DOC: qisman] → [VERIFIED: qisman] (CLAIM: confirmed)
- Savol: O'qish qurilmasi (POS Monitor/telefon)?
- Doc Isbot: POS Monitor + micro-modul/video-progress endpoint (mobil-mos); LMS-ekran integratsiyasi qisman
- Tekshiruv: micro-modules + video-progress endpointlar mavjud. POS Monitor'ga to'g'ridan LMS-o'quv-ekran integratsiyasi qisman. TASDIQ.

---
*Tekshiruv tugadi: 83 confirmed / 2 refuted (12.22, 12.5+12.79 family). realPct ~40% (doc 52% vizyon-bahosi yuqoriroq).*
