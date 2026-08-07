# LMS / Ta'lim — Yagona Vizyon Registri (EP-LMS) — 2026-08-07

> **Manbalar:** `decisions/12-lms.md` (85 qaror) · `FULL-ITEM-LEVEL [Module-12]` (85 item) · `FULL-VISION-EXTRACTION` QISM A (50 qaror, `891-964`) / QISM C (TASDIQ-2146 §12, `3685-3811`, 85 qator) / QISM D (V/VERIFY cross-ref, `5422-5472`, 42 qator) · `vision-1000-answers/12-lms.md` (50)
> **Holat sanasi:** qurilish-holati 2026-07-11 tekshiruviga asoslanadi; 2026-07-11→2026-08-07 oralig'ida LMS kodiga tegan **8 commit** qayta tekshirildi va tegishli bandlarda `Δ` qatorida belgilandi (jonli kodda spot-verify qilindi).

## Xulosa

| Ko'rsatkich | Son |
|---|---|
| **Jami band (EP-LMS-001..085)** | **85** |
| **Qaror holati:** ✅ javoblangan | 75 |
| **Qaror holati:** 🔵 ochiq | 10 |
| **Qurilish:** Ha | 9 |
| **Qurilish:** Qisman | 47 |
| **Qurilish:** Yo'q | 29 |
| **Qurilish:** STALE-DOC (manbadagi 5 tasi jonli kodda tuzatildi) | 0 |
| **Qurilish:** — (mos item topilmadi) | 0 |
| 2026-07-11 dan beri o'zgargan (Δ) | 9 EP + 1 VR |
| ⚠️ Manbalar orasida ziddiyat | 10 EP + 1 VR |
| **II QISM — EP-kodsiz talab (VR-LMS-I01..I07)** | **7** (Ha 1 / Qisman 3 / Yo'q 3) |

> **Eslatma (qurilish ≠ qaror):** ikki o'q **mustaqil**. Masalan EP-LMS-072 (davriy qayta-tasdiq) qaror bo'yicha hamon 🔵 **OCHIQ** (egasi davriylikni — yil/chorak — tasdiqlamagan), lekin qurilish bo'yicha **Qisman** — `certificate_expires_at` + `GET expiring` real. Teskarisi ham bor: EP-LMS-033 (12 universal mavzu shabloni) qaror bo'yicha ✅ **JAVOBLANGAN** (kitobda 12 mavzu aniq sanalgan), qurilish bo'yicha **Yo'q** — `topic_template` jadval/seed umuman yo'q.

> **Eslatma (raqamlash — bu modulda siljish YO'Q):** `TASDIQ-2146 §12 #1..#85` **aynan** `EP-LMS-001..085` ga to'g'ri keladi (1:1). `FULL-ITEM-LEVEL [Module-12]` da esa **ikki xil manba aralashgan**: `Item #1..#50` = `vision-1000-answers/12-lms.md #1..#50` (EP-kodsiz granular javoblar → mavzu bo'yicha ulanadi, `(taxminiy)` belgisi bilan), `Item #51..#85` = `TASDIQ-2146 §12 #51..#85` = **EP-LMS-051..085** (1:1). Shu sababli EP-LMS-001..050 uchun "Dalil (kod)" QISM C (2026-06-27) + QISM D (2026-07-07) + mavzuga mos `Item #M` (2026-07-11) dan yig'ildi; EP-LMS-051..085 uchun to'g'ridan-to'g'ri `Item #51..#85` (2026-07-11).

> **Eslatma (modul-darajali gigiyena Δ):** `3405c39e` — 2 ta o'lik `notImplemented` import olib tashlandi; `16d7bed4` — 4 ta hech qayerdan chaqirilmaydigan servis o'chirildi (`CoursesService`, `EnrollmentsService`, dublikat `CertificationService`, `GetMyEnrollmentsHandler`). Men tasdiqladim: `find apps/api/src/modules/lms -iname "*courses.service*"` / `"*enrollments.service*"` / `"*get-my-enrollments*"` → **0 fayl**; `domain/services/certification.service.ts` (kanonik) joyida qoldi. Bu ikki commit hech bir vizyon-bandiga funksional o'zgarish keltirmaydi.

> **Eslatma (butun modul ustidan turuvchi 5 ta blokirovka):** (1) `courses.card_id` = **0/5**, `enrollments.card_id` = **0/15** → karta-darslik bog'lanishiga tayangan HAR bir band jonli ma'lumotsiz; (2) `courses.version` ustuni **YO'Q** → versiya/diff-asosli barcha oqim (EP-LMS-019/065/072) qurilishi mumkin emas; (3) **birinchi-darajali "mavzu" (topic) jadvali yo'q** → 12-mavzu shabloniga tayangan 8+ band (EP-LMS-033/034/046/047/048/049/051/052/053/054/083) asossiz; (4) **AI-kalit yo'q** → EP-LMS-013/014/080/081 va "xavfli savol"/"AI hisobot" qismlar; (5) **`TRAINING_OFFICER` (НО-14) rolida 0 ta foydalanuvchi** (`SELECT DISTINCT role FROM users` → `manager, director, super_admin, employee`) → НО-14 gate'iga tayangan barcha band amalda ishlamaydi.

---

## I QISM — EP-kodli qarorlar (EP-LMS-001..085)

### EP-LMS-001 · Darslik kimga biriktiriladi — kartaga yoki xodimga
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** Kartaga biriktiriladi — xodim almashsa darslik karta bilan qoladi, voris avtomatik o'sha darslikni oladi (A).
- **Manba:** KARTALAR Q28 ("Darslik kartaga = A; xodim emas, yangi xodim avto-oladi") + karta-model vizyon
- **Dalil (kod):** `courses.card_id` ustun + index real (`lms-course-card-link-2026-06-22.sql`), `lms-courses.controller.ts:79` `by-card/:cardId` endpoint jonli. `LmsCardGateService.isCardTrainingComplete(cardId, employeeId)` gate'ni **qat'iy karta-ma-karta** baholaydi (fail-closed), `payroll.service.ts:454-461` dan chaqiriladi. `node _audit/q.cjs "SELECT count(*) total, count(card_id) filled FROM courses"` → **{total:5, filled:0}**.
- **Nima yetishmaydi:** mexanizm to'liq, lekin `courses.card_id` **0/5** to'ldirilgan — jonli tizimda hech bir darslik hech bir kartaga bog'lanmagan (egasi-data bo'shlig'i, kod bo'shlig'i emas).
- **Bog'liqlik:** EP-LMS-063 (lavozim o'zgarganda varaqa), EP-LMS-071 (arxiv), EP-LMS-084 (ko'p karta)
- **action:** CREATE
- **⤳ Ta'sir:** Org-karta (darslik karta atributi), HR (voris avto-oladi)
- **Xoch-havolalar:** `EXTRACTION QISM C §12 #1` · `[Module-12] Item #1` *(taxminiy)* · `[Module-12] Item #32` *(card_id data-gap dalili)*
- **Δ 2026-07-11→08-07:** —

### EP-LMS-002 · Darslik tugamaguncha oylik yo'q
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** Ha, bloklaydi — karta darsligi 100% tugamasa o'sha karta oyligi to'xtaydi (ogohlantirish bilan) (A).
- **Manba:** KARTALAR Q27 ("Darslik tugamasa oylik yo'q = A; o'sha karta oyligi to'xtaydi") + vizyon bo'lim 7/9
- **Dalil (kod):** `payroll.service.ts:438` `isCardTrainingComplete` → `lmsBlocked` gross-ni gate qiladi; `LmsCardGateService` REAL 267 qator, fail-closed. `payroll.service.ts:454-461` `isCardTrainingCompleteWithPrefetch` bilan karta-ma-karta baholanadi.
- **Nima yetishmaydi:** —
- **Bog'liqlik:** EP-LMS-001 (`courses.card_id` 0/5 → gate hozircha bo'sh to'plamni tekshiradi), EP-LMS-026 (`is_mandatory`), EP-LMS-084
- **action:** EVENT
- **⤳ Ta'sir:** Payroll (oylik-gate), Org-karta, HR
- **Xoch-havolalar:** `EXTRACTION QISM C §12 #2` · `[Module-12] Item #1` *(taxminiy)* · `[Module-12] Item #84`
- **Δ 2026-07-11→08-07:** —

### EP-LMS-003 · Ishga olinganda kurs avto-tayinlash
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** Avtomatik — kartaga biriktirish bo'lishi bilan kartaning barcha majburiy kurslari xodimga tushadi + muddat boshlanadi (A).
- **Manba:** SHvB YO'NALISH 27 ("Yangi xodim qabul qilinganda → lavozimga biriktirilgan barcha majburiy kurslar avtomatik tayinlanadi") + KARTALAR Q28
- **Dalil (kod):** `org-structure/card.service.ts:147-160` — `assignEmployee` commit bo'lgach real `eventEmitter.emit(CARD_EMPLOYEE_ASSIGNED_EVENT, payload)`; `lms/infrastructure/event-handlers/card-employee-assigned.handler.ts` — real `@OnEvent` listener, `findActiveCoursesByCard` + `autoEnroll`, `ON CONFLICT (employee_id, course_id)` bilan idempotent. Zanjir uchidan-uchiga simlangan.
- **Nima yetishmaydi:** —
- **Bog'liqlik:** EP-LMS-001 (`courses.card_id` 0/5 → listener amalda no-op), EP-LMS-048 (muddat boshlanishi)
- **action:** EVENT
- **⤳ Ta'sir:** HR (onboarding), Org-karta (majburiy kurslar)
- **Xoch-havolalar:** `EXTRACTION QISM C §12 #3` · `[Module-12] Item #32` *(taxminiy)* · `EXTRACTION QISM A #32`
- **Δ 2026-07-11→08-07:** —

### EP-LMS-004 · Kurs tugamaguncha MES (mashinaga) bloklash
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** Ha, qattiq blok — majburiy xavfsizlik/operatsiya kursi tugamasa MES o'sha xodimga ishni boshlatmaydi (`blocks_mes` ustuni allaqachon bor) (A).
- **Manba:** vizyon (blocks_mes ulanishi) + kitob ("Техника хавфсизлиги бўйича йўриқномадан ўтиш" majburiy) + ERP-SIFAT 7 (avtomatlashtirish)
- **Dalil (kod):** `mes/infrastructure/event-handlers/lms-cert-expired-block.service.ts` REAL — `deactivateSkill` `employee_skills.is_active=false` ga real UPDATE qiladi; `lms/infrastructure/event-handlers/cert-expiry.handler.ts:57` kunlik cron `CertificateExpiredEvent` publish qiladi. Blok **sertifikat-muddati** asosida ishlaydi.
- **Nima yetishmaydi:** blok faqat *sertifikat muddati tugashi* orqali keladi — "enrollment tugallanmagan → MES gate" yo'li topilmadi; ya'ni kursni **boshlamagan** xodim uchun MES bloki yo'q.
- **Bog'liqlik:** EP-LMS-044 (TX birinchi modul), EP-LMS-019 (sertifikat muddati)
- **action:** EVENT
- **⤳ Ta'sir:** MES (ish-boshlash gate), Org-karta, HR (xavfsizlik jurnali)
- **Xoch-havolalar:** `EXTRACTION QISM C §12 #4` · `[Module-12] Item #6` *(taxminiy)* · `EXTRACTION QISM D #6`
- **Δ 2026-07-11→08-07:** —

### EP-LMS-005 · Reglament testlari (yangi feature)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** To'liq — har reglament uchun test banki + topshirish + ball + qayd ("o'qidim" tugmasi yetarli emas) (A).
- **Manba:** SHvB YO'NALISH 28 ("Регламент Testlari": testFromRegulation, testPassRequired, testPassScore) + Director/GSD integratsiya ("Har yangi reglament → avto LMS test")
- **Dalil (kod):** `lms-tests.controller.ts:41-137` `LmsTestsController` to'liq CRUD real; `lms-tests.service.ts:16-22` `PRIVILEGED_ROLES` RBAC real. `node _audit/q.cjs "SELECT count(*) FROM lms_tests"` → **0 qator**, `lms_questions` → **0 qator**.
- **Nima yetishmaydi:** reglament↔test avtomatik bog'lash yo'q (`policy_id`/`regulation_id` FK yo'q); jadvallar bo'sh — bironta test banki mavjud emas.
- **Bog'liqlik:** EP-LMS-073 (ОРГПОЛИТИКА bog'lash), EP-LMS-028 (kimni qamraydi), EP-LMS-079 (savol muallifi)
- **action:** CREATE
- **⤳ Ta'sir:** Director (reglament/GSD), Hujjat boshqaruvi, AI (test generatsiya)
- **Xoch-havolalar:** `EXTRACTION QISM C §12 #5` · `[Module-12] Item #73` · `[Module-12] Item #36` *(taxminiy)*
- **Δ 2026-07-11→08-07:** —

### EP-LMS-006 · Reglament testi uchun 7-kunlik muddat
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** 7 kun — standart muddat, hammaga bir xil, sanagich avtomatik (A).
- **Manba:** SHvB YO'NALISH 28 ("Kechikish: 7 kun ichida o'tmasa — rahbarga bildirishnoma")
- **Dalil (kod):** `enrollments` da `started_at` + `certificate_expires_at` ustunlari real (`information_schema.columns` bilan tasdiqlangan). `grep -rn "Cron(" apps/api/src/modules/lms` → yagona cron = `cert-expiry.handler.ts` (kunlik, yarim tunda).
- **Nima yetishmaydi:** reglament-testiga xos 7-kunlik sanagich/cron ulanmagan — mavjud yagona cron sertifikat-muddati sweep'i, deadline hisoblagichi emas.
- **Bog'liqlik:** EP-LMS-007 (eskalatsiya), EP-LMS-069 (eslatma kanali)
- **action:** CRON
- **⤳ Ta'sir:** Notifications (deadline), HR
- **Xoch-havolalar:** `EXTRACTION QISM C §12 #6` · `[Module-12] Item #42` *(taxminiy)* · `EXTRACTION QISM D #42`
- **Δ 2026-07-11→08-07:** —

### EP-LMS-007 · 7-kun o'tib test topshirilmasa nima bo'ladi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** Bosqichma-bosqich — avval ogohlantirish, keyin rahbar/HR'ga raport, keyin o'sha kartaning oyligi/MES bloklanadi (A).
- **Manba:** SHvB YO'NALISH 28 (kechikish → rahbarga bildirishnoma) + KARTALAR Q27 (oylik-gate) + EP-LMS-002/004
- **Dalil (kod):** zanjirning **oxirgi** halqasi real — oylik-gate (`payroll.service.ts:438` `LmsCardGateService`) va MES blok (`lms-cert-expired-block.service.ts`). `grep -rn "Cron(" apps/api/src/modules/lms apps/api/src/modules/hr/onboarding` → faqat `cert-expiry.handler.ts`; kun-1 / kun-3 bosqichli eskalatsiya handler'i topilmadi. `grep -rln "uzr\b" apps/api/src/modules/lms` → 0 (uzr-sababi oqimi ham yo'q).
- **Nima yetishmaydi:** bosqichli zinapoya (ogohlantirish → rahbar → HR) yo'q; faqat oxirgi (blok) bosqichi mavjud va u ham deadline'ga emas, sertifikat-muddatiga bog'langan.
- **Bog'liqlik:** EP-LMS-006 (7-kun sanagich), EP-LMS-002 (oylik-gate), EP-LMS-004 (MES blok)
- **action:** EVENT
- **⤳ Ta'sir:** Payroll (oylik-gate), MES (blok), Notifications, Coordination
- **Xoch-havolalar:** `EXTRACTION QISM C §12 #7` · `[Module-12] Item #42` *(taxminiy)* · `EXTRACTION QISM D #42`
- **Δ 2026-07-11→08-07:** —

### EP-LMS-008 · Test yiqilganda qayta-test
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** Cheklangan qayta — masalan 2 marta qayta, keyin majburiy qayta-o'qish + rahbar/HR aralashuvi (A).
- **Manba:** SHvB YO'NALISH 28 ("testRetake, testHistory") + vizyon yo'n.28 (qayta-test); qayta-urinish soni granular → A-default 2
- **Dalil (kod):** `courses.max_attempts` ustuni real; `lms_exam_attempts` / `lms_test_attempts` jadvallari mavjud (0 qator); `lms-tests.service.ts:80 findRetakeAttempts` faqat qayta-urinish ro'yxatini qaytaruvchi query. `grep -rln "fail_count|failCount|reTeach|re_study" apps/api/src/modules/lms` → **0**; `lms_test_attempts` ustunlari = `id,user_id,test_id,course_id,score,passed,created_at` — 2-marta-yiqilish qoidasini yondiradigan hisoblagich ustuni yo'q. **Δ:** `52eb84cb` real FE imtihon-topshirish yo'lini `lms.exam.passed` chiqaradigan qildi (`lms-core.service.ts:46-60`), avval faqat `lms-exams.service.ts:70` yo'li emit qilardi.
- **Nima yetishmaydi:** yiqilish-hisoblagichi va "2 martadan keyin avto qayta-o'qish + murabbiy/HR xabari" trigger'i yo'q; `max_attempts` faqat ustun sifatida mavjud, uni tekshiruvchi qaror-nuqtasi topilmadi.
- **Bog'liqlik:** EP-LMS-081 (murabbiy/AI eskalatsiya), EP-LMS-082 (murabbiy reytingi)
- **action:** UPDATE
- **⤳ Ta'sir:** HR, Coordination, AI
- **Xoch-havolalar:** `EXTRACTION QISM C §12 #8` · `[Module-12] Item #3` *(taxminiy)* · `EXTRACTION QISM D #3`
- **Δ 2026-07-11→08-07:** `52eb84cb` — real FE imtihon-topshirish yo'li `lms.exam.passed` ni **hech qachon** chiqarmasdi; endi chiqaradi. Bu yiqilish-hisoblagichini qurmaydi, lekin imtihon natijasi hodisa sifatida umuman yo'q edi — endi bor.

### EP-LMS-009 · O'tish bali (necha foiz = o'tdi)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-06-27)*
- **Talab:** Kurs turiga qarab — xavfsizlik/TX kursi 100%, oddiy bilim kursi 60-80% (HR/Settings sozlaydi); master-data sifatida (B variant tavsiya — adolatli + xavfsizlik qattiq).
- **Manba:** SHvB YO'NALISH 28 ("testPassScore" maydon bor, qiymat egasi sozlovi); aniq foiz egasi tomonidan belgilanmagan
- **Dalil (kod):** `lms-completion.constants.ts` da `GENERAL=70` / `TX=100` konstantalari real; `courses.passing_score` ustuni real. AMMO `courses.course_type` ustuni **YO'Q** (VISION-3340 SB0112/0148 STILL-OPEN) → dinamik "kurs turiga qarab" tanlov ishlamaydi.
- **Nima yetishmaydi:** `course_type` ustuni yo'qligi sababli TX=100 / oddiy=70 ajratmasi jonli ma'lumotda hech qachon qo'llanmaydi; aniq foiz qiymatlari egasi-data.
- **Bog'liqlik:** EP-LMS-070 (o'zlashtirish mezoni), EP-LMS-048 (TX ustuvorligi ham `course_type` ga bog'liq), EP-LMS-072 (qisqartirilgan test foizi)
- **action:** CREATE
- **⤳ Ta'sir:** HR/Settings (master-data), QC (xavfsizlik chegarasi)
- **Xoch-havolalar:** `EXTRACTION QISM C §12 #9` · `EXTRACTION QISM A Step-3 (course_type YO'Q)` · `[Module-12] Item #48` *(taxminiy)*
- **Δ 2026-07-11→08-07:** —

### EP-LMS-010 · Micro-modullar (qisqa o'quv bo'laklari)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** Ha — har kurs micro-modullarga bo'linadi, har biri alohida o'tiladi va belgilanadi (smena oralig'ida o'tadi) (A).
- **Manba:** SHvB YO'NALISH 27 ("gsdTrainingModule") + AI (yo'riqnomadan micro-modul generatsiyasi, v2 Q40) + stub `/micro-modules` ulanishi
- **Dalil (kod):** `LmsMicroModulesController` (`lms-misc.controller.ts:94`) real; `drizzle-lms-misc.repo.ts:28-32 recordMicroModuleView` real `INSERT ... ON CONFLICT (micro_module_id, employee_id) DO UPDATE SET viewed_at = NOW()`; `lms_modules` = **9 qator**; FE marshrut jonli — `StubRoutes.tsx:75` `/video-progress → LessonPlayerPage` (stub emas, simlangan).
- **Nima yetishmaydi:** `recordMicroModuleView` faqat `viewed_at` yozadi — micro-modul uchun `last_position`/resume holati yo'q; tashlab ketilgan modul uchun 24-soatlik eslatma cron'i yo'q.
- **Bog'liqlik:** EP-LMS-011 (ketma-ketlik), EP-LMS-024 (video), EP-LMS-085 (qurilma)
- **action:** CREATE
- **⤳ Ta'sir:** POS Monitor (sex tableti ekran), AI (modulga bo'lish)
- **Xoch-havolalar:** `EXTRACTION QISM C §12 #10` · `[Module-12] Item #28` *(taxminiy)* · `EXTRACTION QISM D #28`
- **Δ 2026-07-11→08-07:** —

### EP-LMS-011 · Micro-modul ketma-ketligi majburiymi
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** Ketma-ket — keyingisi oldingisi tugamaguncha ochilmaydi (xavfsizlik/operatsiya uchun); kitob "Назорат варақаси кетма-кетликда бажарилади" deydi (A).
- **Manba:** kitob (НАЗОРАТ ВАРАҚАСИ "кетма-кетликда бажарилади"); granular tartib qoidasi egasi tomonidan aniq belgilanmagan
- **Dalil (kod):** `lms_modules` ustunlari = `id, course_id, title, title_ru, order, created_at, deleted_at, description, order_index, updated_at, sort_order` — **uchta** alohida tartiblash ustuni bor (`order` / `order_index` / `sort_order`, o'zi kichik dublikat-drift), lekin qulflash/gate ustuni yo'q. Kurs darajasida `courses.prerequisite_course_id` mavjud.
- **Nima yetishmaydi:** tartib **ko'rsatiladi**, lekin majburlanmaydi — oldingi modul tugamasa keyingisini bloklovchi qattiq gate yo'q.
- **Bog'liqlik:** EP-LMS-060 (bo'lim-yakun gate — bir xil ildiz), EP-LMS-010
- **action:** UPDATE
- **⤳ Ta'sir:** LMS progress logikasi
- **Xoch-havolalar:** `EXTRACTION QISM C §12 #11` · `[Module-12] Item #60` *(bir xil gate-bo'shlig'i)*
- **Δ 2026-07-11→08-07:** —

### EP-LMS-012 · Kursni kim tayyorlaydi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** O'quv bo'limi yaratadi → AI nazorat/tekshiruv → HR qaror → rahbar tasdiq (vizyon oqimi) (A).
- **Manba:** KARTALAR Q29 ("Darslik o'quv-bo'limi→AI→HR+rahbar = A") + kitob НО-14 (o'quv bo'limi) + vizyon bo'lim 9
- **Dalil (kod):** `lms-courses.controller.ts:187-206` — `submitCourse`/`approveCourse` real: `TRAINING_OFFICER` topshiradi → `HR_MANAGER`/`DIRECTOR`/`SUPER_ADMIN` tasdiqlaydi (fayl izohi "3-bosqich kurs-tasdiq workflow (draft → review → approved), 2-imzo" ni tasdiqlaydi). `courses.author_id`/`created_by` real.
- **Nima yetishmaydi:** zanjirdagi **AI-nazorat** bosqichi umuman yo'q (LMS'da bironta LLM chaqiruvi yo'q — `agents/lms-agent.service.ts` 55 qator, faqat progress-sanoq + cert-cron); `TRAINING_OFFICER` rolida 0 ta foydalanuvchi.
- **Bog'liqlik:** EP-LMS-056 (НО-14 roli), EP-LMS-079 (savol tasdig'i), EP-LMS-076 (rahbar-muallif kanali)
- **action:** APPROVE
- **⤳ Ta'sir:** Org (o'quv bo'limi НО-14), AI, Coordination, HR
- **Xoch-havolalar:** `EXTRACTION QISM C §12 #12` · `[Module-12] Item #24` *(taxminiy)* · `[Module-12] Item #79`
- **Δ 2026-07-11→08-07:** —

### EP-LMS-013 · AI kurs/o'qish nazorati
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** Ha — AI o'qish holatini kuzatadi + PDF hisobot (xodim/rahbar/HR'ga); kim o'qidi/kim qoldi/tushundimi (A).
- **Manba:** vizyon bo'lim 9/10 (AI nazorat + hisobot) + ERP-SIFAT 30/70 (70% tahlil+AI) + KARTALAR Q30 (markaziy AI manbasi: LMS)
- **Dalil (kod):** `agents/lms-agent.service.ts` to'liq o'qildi (55 qator) — yagona rejalashtirilgan ish `@Cron('0 8 * * *')` bo'lib, u faqat `checkCertificateExpiry()` ni chaqiradi; **bironta AI chaqiruvi yo'q**, PDF generatsiya yo'q. `GET progress/summary` (`lms-misc.controller.ts:324-334`) jonli agregat (total/completed/in_progress), lekin qo'lda tortiladigan endpoint — tarqatiladigan hisobot emas.
- **Nima yetishmaydi:** —
- **Bog'liqlik:** ⚠️ AI-kalit (egasi-data) — EP-LMS-014/080/081 bilan bir xil blokirovka; EP-LMS-029 (dashboard ma'lumot manbai)
- **action:** AI
- **⤳ Ta'sir:** AI (markaziy), Reports, Director
- **Xoch-havolalar:** `EXTRACTION QISM C §12 #13` · `[Module-12] Item #33` *(taxminiy)* · `[Module-12] Item #27` · `EXTRACTION QISM D #33`
- **Δ 2026-07-11→08-07:** —
- **⚠️ ZIDDIYAT:** QISM C §12 #13 "Qisman" deydi (`agents/lms-agent.service.ts` + `progress/summary` borligi uchun), FULL-ITEM-LEVEL Item #33/#27 esa o'sha faylni **to'liq o'qib** "hech qanday AI yo'q, PDF kutubxonasi yo'q" deb **Yo'q** ga tushiradi. Kod-dalili kuchliroq → **Yo'q** qabul qilindi.

### EP-LMS-014 · AI chatbot orqali o'qitish/savol berish
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** Ha — AI chatbot darslikni tushuntiradi va kichik savollar beradi (telegram/ilovada); savodi past/mashinasiz ishchiga (A).
- **Manba:** vizyon bo'lim 10 ("Chatbot o'qitish") + KARTALAR Q16 (mashinasiz ЦКП = AI-chatbot kunlik) + kitob glossariy-uslubi
- **Dalil (kod):** `agents/lms-agent.service.ts` to'liq o'qildi — chatbot yo'q, so'rov/javob ishlovi yo'q, LLM integratsiyasi umuman yo'q. `telegram/handlers/lms.handler.ts` 84 qator, faqat 3 ta **chiquvchi** metod (`onCourseCompleted`, `onCertificateIssued`, `onCertificateExpiringSoon`) — kiruvchi javobni qayta ishlovchi kod yo'q. RBAC qamrovini o'rashga chatbot yo'q.
- **Nima yetishmaydi:** —
- **Bog'liqlik:** ⚠️ AI-kalit (egasi-data); EP-LMS-037 (glossariy — chatbot manbai), EP-LMS-081 (savol kanali)
- **action:** AI
- **⤳ Ta'sir:** AI Integratsiya, Telegram bot, Notifications
- **Xoch-havolalar:** `EXTRACTION QISM C §12 #14` · `[Module-12] Item #43` *(taxminiy)* · `EXTRACTION QISM D #43`
- **Δ 2026-07-11→08-07:** —
- **⚠️ ZIDDIYAT:** QISM C §12 #14 "Qisman" deydi; FULL-ITEM-LEVEL Item #43 to'liq fayl o'qib "chatbot umuman yo'q" deydi → **Yo'q**.

### EP-LMS-015 · Razryad imtihoni LMS ichida
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-08-07 Δ)*
- **Talab:** Ha — razryad imtihoni LMS test sifatida, o'tsa HR'ga signal + ichki sertifikat (A).
- **Manba:** KARTALAR Q8 ("Razryad har kartada → LMS imtihon") + Q10 (imtihon→HR+rahbar) + Q13 (o'zgarsa sertifikat) + vizyon bo'lim 6
- **Dalil (kod):** `lms/infrastructure/event-handlers/exam-passed.contract.ts:12` `EXAM_PASSED_EVENT = 'lms.exam.passed'`; `lms-exams.service.ts:70` emit; `org-structure/exam-passed-razryad.listener.ts` real `@OnEvent` → `aiSuggested: true` bilan razryad-so'rov yaratadi. **Δ:** `52eb84cb` — real FE topshirish yo'li (`lms-core.service.ts:46-60`) endi ham emit qiladi; ilgari faqat `lms-exams.service.ts` yo'li emit qilardi va FE bu yo'ldan yurmasdi → zanjir jonli tizimda **hech qachon** yonmagan.
- **Nima yetishmaydi:** —
- **Bog'liqlik:** EP-LMS-017 (2-imzo), EP-LMS-016 (interval), EP-LMS-018 (sertifikat)
- **action:** CREATE
- **⤳ Ta'sir:** HR (razryad), Payroll (razryad→oylik), Coordination (tasdiq)
- **Xoch-havolalar:** `EXTRACTION QISM C §12 #15` · `[Module-12] Item #50` *(taxminiy)* · `EXTRACTION QISM D #50`
- **Δ 2026-07-11→08-07:** `52eb84cb` — jonli FE imtihon-topshirish yo'li `lms.exam.passed` ni chiqarmasdi; endi chiqaradi. Zanjir 2026-07-11 da "Ha" deb belgilangan bo'lsa-da, **amalda ishlamas edi** — bu Δ uni haqiqatan yondirdi.

### EP-LMS-016 · Razryad imtihonining 3 oylik oralig'i
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** 3 oy — standart, tizim oxirgi imtihondan 3 oy o'tmaguncha yangisini ochmaydi (xodim o'zi murojaat qiladi) (A).
- **Manba:** KARTALAR Q11 ("Imtihon min 3 oy = A; 2 imtihon orasi ≥3 oy, xodim o'zi murojaat") + vizyon bo'lim 6
- **Dalil (kod):** `org-structure/razryad-history.service.ts` `checkInterval(cardId, minMonths)` (~88-100 qator) real gate: `if (monthsPassed < minMonths) return Err(...)`, `createRequest` dan oldin chaqiriladi (EP-ORG-011).
- **Nima yetishmaydi:** interval **oxirgi razryad o'zgarishidan** o'lchanadi, "ariza qabul sanasidan 90 kun" emas; `razryad_levels.min_months` egasi-data (default NULL → egasi sozlamaguncha so'rov rad etiladi); nazariy/amaliy uchun alohida interval yo'q.
- **Bog'liqlik:** EP-LMS-041 (nazariy+amaliy), EP-LMS-015, ⚠️ `razryad_levels.min_months` = egasi-data
- **action:** CRON
- **⤳ Ta'sir:** HR, LMS
- **Xoch-havolalar:** `EXTRACTION QISM C §12 #16` · `[Module-12] Item #7` *(taxminiy)* · `[Module-12] Item #25` · `EXTRACTION QISM D #7`
- **Δ 2026-07-11→08-07:** —

### EP-LMS-017 · Razryad o'sishi avtomatikmi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** Tasdiq bilan — test o'tsa ham, razryad faqat HR + yuqori rahbar tasdig'idan keyin ko'tariladi (avtomatik EMAS) (A).
- **Manba:** KARTALAR Q10 ("Razryad o'sishi imtihon→HR+rahbar tasdiq = A") + vizyon bo'lim 6
- **Dalil (kod):** `org-structure/exam-passed-razryad.listener.ts` to'liq o'qildi — real `@OnEvent(EXAM_PASSED_EVENT)`, `aiSuggested: true` bilan razryad-**oshirish so'rovi** yaratadi (avtomatik ko'tarmaydi); faylning o'z izohiga ko'ra 2-imzo (HR + bevosita rahbar) tasdig'i `razryad-history.service` da "ALLAQACHON tayyor".
- **Nima yetishmaydi:** —
- **Bog'liqlik:** EP-LMS-015 (imtihon hodisasi), EP-LMS-050 (domen-bilim) — yo'q; asosiy: 48-soatlik eskalatsiya taymeri yo'q (`grep -n "48|escalat" razryad-history.service.ts` → 0), razryad-**pasaytirish** yo'li umuman yo'q (`requestType: 'increase'` yagona).
- **action:** APPROVE
- **⤳ Ta'sir:** HR, Coordination (tasdiq), Payroll
- **Xoch-havolalar:** `EXTRACTION QISM C §12 #17` · `[Module-12] Item #50` *(taxminiy)* · `[Module-12] Item #31` · `EXTRACTION QISM D #50`
- **Δ 2026-07-11→08-07:** `52eb84cb` bilvosita — hodisa manbai tuzatilgach bu zanjir birinchi marta amalda yonadigan bo'ldi (kodning o'zi o'zgarmadi).

### EP-LMS-018 · Ichki sertifikat berish
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-08-07 Δ)*
- **Talab:** Ha — avtomatik PDF sertifikat (kurs nomi, sana, razryad, raqam) + arxivga saqlanadi (A).
- **Manba:** KARTALAR Q13 ("O'zgarsa HR hujjat+ichki sertifikat majburiy = A") + BARCHA_JAVOBLAR Q170 (sertifikatlar HR bilan = Hammasi) + vizyon bo'lim 6
- **Dalil (kod):** `lms_certificates` jadval + `lms-certificates.controller.ts:55` `issue` real; `lms-certificates.controller.ts:94-105` `revokeCertificate` (`@Roles('HR_MANAGER','DIRECTOR','SUPER_ADMIN')` + `AuditInterceptor`) real. **Δ:** `06f77edc` — yuklab olish endi **haqiqiy PDF** (`lms-certificate-pdf.service.ts`, `pdf-lib` + `qrcode` + `toPdfSafeText()`; QR `cert_hash` ni kodlaydi), ilgari HTML edi. **Δ:** `6d5a40b1` — `issued_ip` + SHA-256 `cert_hash` yozuvchi yo'llar real (`drizzle-lms-cert.repo.ts:59-66` `createHash('sha256')` + `INSERT ... issued_ip, cert_hash`; `drizzle-lms-courses-extended.repo.ts:124` ikkinchi yo'l). **Δ:** `97942ff7` — sertifikat ro'yxati/hisoblagichi doim 0 o'qirdi (envelope `{items,total}` unwrap qilinmagan + `userName`/`courseName` alias yo'q edi).
- **Nima yetishmaydi:** —
- **Bog'liqlik:** EP-LMS-064 (nazorat varaqasi PDF — hamon yo'q), EP-LMS-019 (muddat), EP-LMS-075 (tashqi sertifikat)
- **action:** CREATE
- **⤳ Ta'sir:** CC/Hujjat (arxiv), HR
- **Xoch-havolalar:** `EXTRACTION QISM C §12 #18` · `[Module-12] Item #30` *(taxminiy)* · `[Module-12] Item #38` · `[Module-12] Item #64`
- **Δ 2026-07-11→08-07:** `06f77edc` (real PDF), `6d5a40b1` (issued_ip + SHA-256 cert_hash), `97942ff7` (ro'yxat/hisoblagich 0 bug'i), `63c93b87` (ko'rish/chop-etish audit-log). 2026-07-11 da "Qisman + hardcoded HTML stub" edi → endi **Ha**.

### EP-LMS-019 · Sertifikatning amal qilish muddati (qayta-sertifikatlash)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** Muddatli — masalan 1 yil, muddat tugashidan oldin qayta-test eslatmasi keladi (xavfsizlik/reglament bilimi eskiradi) (A); aniq muddat HR sozlovi.
- **Manba:** vizyon (davriy qayta-test mantig'i) + v2 Q52 (davriy qayta-tasdiq); aniq muddat egasi tomonidan belgilanmagan
- **Dalil (kod):** `enrollments.certificate_expires_at` ustuni real; `lms-certificates-standalone.controller.ts:49-54` `GET expiring` real query; `cert-expiry.handler.ts` `@Cron(EVERY_DAY_AT_MIDNIGHT)` real `CertificateExpiredEvent` publish qiladi → MES blok (`lms-cert-expired-block.service.ts`, grace period yo'q).
- **Nima yetishmaydi:** 7/5/3-kunlik oldindan-ogohlantirish pog'onalari **yo'q** (`grep -n "7.*kun|5.*kun|3.*kun"` ikkala faylda ham 0) — faqat tugash-kuni sweep'i; aniq muddat (1 yil?) egasi-data.
- **Bog'liqlik:** EP-LMS-072 (davriy qayta-tasdiq), EP-LMS-044 (TX), EP-LMS-004 (MES blok)
- **action:** CRON
- **⤳ Ta'sir:** Notifications (eslatma), HR
- **Xoch-havolalar:** `EXTRACTION QISM C §12 #19` · `[Module-12] Item #6` *(taxminiy)* · `[Module-12] Item #19` · `EXTRACTION QISM D #6`
- **Δ 2026-07-11→08-07:** —

### EP-LMS-020 · Kaizen taklif kiritish
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** Ha, to'liq — taklif kiritish + holat (yangi/ko'rilmoqda/qabul/rad) + javob xodimga (`kaizen_suggestions` jadval bor) (A).
- **Manba:** SHvB YO'NALISH 34 ("kaizen-idea.entity: status, KaizenBoard: taklif/ko'rilayotgan/amalga oshirilgan") + vizyon yo'n.34
- **Dalil (kod):** `kaizen_suggestions` ustunlari = `id, employee_id, department_id, title, description, expected_impact, status, approved_by, implemented_at, result_measured, rejection_reason, created_at, updated_at` (1 qator); `director/presentation/kaizen.controller.ts` `create`/`list`/`updateSuggestion` REAL.
- **Nima yetishmaydi:** —
- **Bog'liqlik:** EP-LMS-021 (PDCA), EP-LMS-022 (bonus). Eslatma: Kaizen jonli kodda **Director** modulida, LMS'da emas.
- **action:** CREATE
- **⤳ Ta'sir:** AI, HR, Coordination
- **Xoch-havolalar:** `EXTRACTION QISM C §12 #20` · `[Module-12] Item #10` *(taxminiy)* · `EXTRACTION QISM D #10`
- **Δ 2026-07-11→08-07:** —

### EP-LMS-021 · Kaizen uchun rasmiy PDCA tsikli
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** To'liq PDCA — har taklif 4 bosqichdan (Reja-Bajar-Tekshir-Harakat) o'tadi, mas'ul + muddat + natija qayd qilinadi (A).
- **Manba:** SHvB YO'NALISH 34 ("pdcaCycle, plan, do, check, act"; kaizen.service: create/review/implement/measureImpact)
- **Dalil (kod):** `kaizen_suggestions` ustunlari = `id, employee_id, department_id, title, description, expected_impact, status, approved_by, implemented_at, result_measured, rejection_reason, created_at, updated_at`. `pdca_stage`/`plan`/`do`/`check`/`act` ustunlari **umuman yo'q**. `grep "KaizenCheckFailed|PDCA"` LMS = 0.
- **Nima yetishmaydi:** —
- **Bog'liqlik:** EP-LMS-020 (asosiy jadval), EP-LMS-022 (bonus "Act" da to'lanishi shu bosqich ustuniga bog'liq)
- **action:** UPDATE
- **⤳ Ta'sir:** Coordination (mas'ul/muddat), AI (ta'sir o'lchovi)
- **Xoch-havolalar:** `EXTRACTION QISM C §12 #21` · `[Module-12] Item #10` *(taxminiy)* · `EXTRACTION QISM D #10`
- **Δ 2026-07-11→08-07:** —

### EP-LMS-022 · Kaizen rag'bati (mukofot)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** Ha — qabul qilingan kaizen kartaning bonus tizimiga ulanadi (HR/rahbar belgilaydi) (A); aniq bonus shkalasi egasi sozlovi.
- **Manba:** SHvB YO'NALISH 34 ("kaizenImpact") + karta-model bo'lim 7 (bonus tizimi); aniq rag'bat miqdori belgilanmagan
- **Dalil (kod):** `kaizen_suggestions` da `bonus`/`impact` raqamli ustuni **yo'q**, `card_id` ustuni ham yo'q (yuqoridagi ustun ro'yxati). `grep -rln "kaizen.*payroll|payroll.*kaizen" apps/api/src` → **0** — Payroll↔kaizen ulanishi umuman yo'q.
- **Nima yetishmaydi:** —
- **Bog'liqlik:** EP-LMS-021 (PDCA bosqich ustuni avval kerak — bonus faqat "Act" da), ⚠️ bonus miqdori/formulasi = egasi-data
- **action:** UPDATE
- **⤳ Ta'sir:** Payroll (bonus), HR, Org-karta
- **Xoch-havolalar:** `EXTRACTION QISM C §12 #22` · `[Module-12] Item #22` *(taxminiy)* · `EXTRACTION QISM D #22`
- **Δ 2026-07-11→08-07:** —

### EP-LMS-023 · Kurs holati ro'yxati (master-data)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** Tayinlandi → Boshlandi → Tugatildi → Muddati o'tdi → Yiqildi (to'liq, real holat) (A).
- **Manba:** `status-catalog-2026-06-07.md` (master-data status ro'yxati standartlashtirish) + ERP-SIFAT (modullararo bitta haqiqat)
- **Dalil (kod):** `lms_enrollments.status` + `started_at`/`completed_at` real (**15 qator** jonli ma'lumot). `enrollments` to'liq ustun ro'yxati: `id, employee_id, course_id, enrolled_at, started_at, completed_at, progress_percent, last_accessed_at, status, current_module_id, current_lesson_id, created_at, updated_at, user_id, score, certificate_expires_at, card_id, auto_enrolled`.
- **Nima yetishmaydi:** —
- **Bog'liqlik:** EP-LMS-029 (dashboard rang/foiz), EP-LMS-071 (arxiv — `deleted_at` ustuni `enrollments` da **yo'q**)
- **action:** CREATE
- **⤳ Ta'sir:** Reports (rang/foiz), barcha LMS ekran
- **Xoch-havolalar:** `EXTRACTION QISM C §12 #23` · `[Module-12] Item #71` *(ustun ro'yxati dalili)*
- **Δ 2026-07-11→08-07:** —

### EP-LMS-024 · Video darslik va ko'rilganlik nazorati
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** Ha — video qancha ko'rilgani kuzatiladi, oxirigacha ko'rmasa "tugatildi" bo'lmaydi (stub `/video-progress` ulanadi) (A).
- **Manba:** BARCHA_JAVOBLAR Q197 ("Majburiy: ko'rmasdan ishlatib bo'lmaydi") + KARTALAR Q7 (papka: video) + ERP-SIFAT 7 (avtomatlashtirish)
- **Dalil (kod):** `drizzle-lms-misc.repo.ts:44-60 saveVideoProgress` — `video_progress` ga real UPDATE/INSERT (`current_time`/`duration`/`completed`); FE marshrut jonli (`StubRoutes.tsx:75 /video-progress → LessonPlayerPage`). `grep -rln "playbackRate|playback_rate" apps/api/src/modules/lms artifacts/erp-dashboard/src` → **0**.
- **Nima yetishmaydi:** 2x tezlik / real-vaqt 80% chegarasi majburlanmaydi — `completed` mijoz yuboradigan payload'dan keladi, server tomonda "real o'tgan vaqt" tekshiruvi yo'q; `saveVideoProgress` izohi (repo:46-47) unique-index yo'qligini va qo'lda upsert ekanini tasdiqlaydi.
- **Bog'liqlik:** EP-LMS-010 (micro-modul), EP-LMS-070 (tugatish mezoni)
- **action:** UPDATE
- **⤳ Ta'sir:** POS Monitor, Storage (video)
- **Xoch-havolalar:** `EXTRACTION QISM C §12 #24` · `[Module-12] Item #14` *(taxminiy)* · `EXTRACTION QISM D #14`
- **Δ 2026-07-11→08-07:** —

### EP-LMS-025 · Lavozim papkasi (position folder) bilan bog'lanish
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-06-27)*
- **Talab:** Ha — har karta papkasida darslik+video+test bir joyda, xodim shu yerdan o'qiydi (papkaning 6-bo'limi = Ta'lim → LMS) (A).
- **Manba:** BARCHA_JAVOBLAR Q32 ("Har lavozim uchun ERP virtual papka: hujjatlar, video, testlar") + KARTALAR Q7 (6-bo'lim ta'lim) + SHvB YO'NALISH (papka 6-bo'lim → LMS)
- **Dalil (kod):** FE `CardFolderDialog` + `CardCoursesDialog` real; `courses.card_id` ustuni real; `lms-courses.controller.ts:79 by-card/:cardId` jonli.
- **Nima yetishmaydi:** papkaning 6-bo'limi (Ta'lim) to'liq integratsiya emas — video/test papka ichida yagona ko'rinishda birlashtirilmagan; `courses.card_id` 0/5 → papka amalda bo'sh.
- **Bog'liqlik:** EP-LMS-001, EP-LMS-083 (namuna fayllar), EP-LMS-085 (qurilma)
- **action:** CREATE
- **⤳ Ta'sir:** Org-karta (lavozim papkasi), HR
- **Xoch-havolalar:** `EXTRACTION QISM C §12 #25` · `[Module-12] Item #83` *(qisman)* · `[Module-12] Item #32` *(card_id data-gap)*
- **Δ 2026-07-11→08-07:** —

### EP-LMS-026 · O'qish kim majburiyligini belgilaydi (majburiy vs ixtiyoriy)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** Kartada belgilanadi — HR har karta uchun qaysi kurs majburiy/ixtiyoriy ekanini kartada sozlaydi (`is_mandatory` ustuni bor) (A).
- **Manba:** SHvB YO'NALISH 27 ("mandatoryCourse, optionalCourse; course.entity ga is_mandatory field") + KARTALAR Q28 (kartaga biriktirish)
- **Dalil (kod):** `courses.is_mandatory` ustuni real; `LmsCardGateService` faqat majburiylarni gate qiladi; FE'da `grep -rln "is_mandatory|isMandatory" artifacts/erp-dashboard/src` → **6 fayl** (`CardCoursesDialog.tsx`, `DarslikTab.tsx`, `profile-types.ts`, `RemainingTabsLearningExtras.tsx`, `HRLMSSkills.tsx`, `SkillsGapTab.tsx`) — dekorativ emas, haqiqatan iste'mol qilinadi.
- **Nima yetishmaydi:** —
- **Bog'liqlik:** EP-LMS-002 (oylik-gate), EP-LMS-029 (dashboard foizi)
- **action:** UPDATE
- **⤳ Ta'sir:** Org-karta, Payroll (majburiy→oylik-gate)
- **Xoch-havolalar:** `EXTRACTION QISM C §12 #26` · `[Module-12] Item #39` *(taxminiy)*
- **Δ 2026-07-11→08-07:** —

### EP-LMS-027 · O'qish davomati 3-kun blokiga ta'sir qiladimi
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** Faqat eslatma — o'qish tashlansa AI eslatadi; profil bloki davomat (3-kun yo'qlik) bilan bog'liq, o'qish kursi bilan emas — o'qish kechikishi alohida oylik-gate orqali boshqariladi (A).
- **Manba:** vizyon bo'lim 10 (3-kun davomat bloki) — bu davomat bloki, o'qish-kechikish EP-LMS-002/007 oylik-gate orqali; granular bog'lanish egasi tomonidan aniq belgilanmagan
- **Dalil (kod):** oylik-gate real (`LmsCardGateService` + `payroll.service.ts:438`) va u davomatdan **mustaqil** — bu vizyon-talabga (ayri boshqarilsin) mos. `grep -rln "sick.*leave|leave.*pause" apps/api/src/modules/lms` → **0**; `LmsCardGateService`/`LmsCompletionService` to'liq o'qildi — ta'til/kasallik holatidan xabari yo'q.
- **Nima yetishmaydi:** ikkalasi ayri bo'lgani to'g'ri, lekin **kasallik/ta'til paytida o'qish taymerini to'xtatish** (vision-answer #11) mexanizmi yo'q — muddat kasallikda ham sanaydi; "AI eslatadi" qismi ham yo'q (AI-kalit).
- **Bog'liqlik:** ⚠️ granular bog'lanish = egasi-qaror; HR `leave_requests`/`attendance` bilan cross-wiring tasdiqlanmagan
- **action:** EVENT
- **⤳ Ta'sir:** HR (davomat ayri), Notifications
- **Xoch-havolalar:** `EXTRACTION QISM C §12 #27` · `[Module-12] Item #11` *(taxminiy)* · `EXTRACTION QISM D #11`
- **Δ 2026-07-11→08-07:** —

### EP-LMS-028 · Yangi reglament chiqqanda kimni qamrab oladi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** Kartaga bog'lab — reglament qaysi kartalarga tegishli bo'lsa, faqat o'sha xodimlarga test tushadi (A).
- **Manba:** SHvB YO'NALISH 28 ("Reglament yangilanganda: tegishli xodimlar qayta test topshiradi") + karta-model (kartaga bog'lash)
- **Dalil (kod):** `courses.card_id` + `card-employee-assigned.handler.ts` avto-enroll zanjiri real (EP-LMS-003 dalili). AMMO `grep -rln "reglament_matrix|reglamentMatrix" apps/api/src` → **0**; `courses` da `department_id`/`org_department_id`/`card_id` ustunlari xom qurilish bloklari sifatida bor, lekin matritsa/tayinlash-versiyalash jadvali yoki retroaktiv-saqlash mantig'i yo'q.
- **Nima yetishmaydi:** (karta + razryad + departament) kombinatsiyali tegishlilik matritsasi yo'q; matritsa o'zgarganda eski tayinlovlarni saqlash/retroaktiv qayta-tayinlash qoidasi qurilmagan.
- **Bog'liqlik:** EP-LMS-005 (reglament testi), EP-LMS-065 (yo'riqnoma o'zgarishi), EP-LMS-068 (3 qatlam)
- **action:** EVENT
- **⤳ Ta'sir:** Director (reglament tegishliligi), Org-karta, Notifications
- **Xoch-havolalar:** `EXTRACTION QISM C §12 #28` · `[Module-12] Item #20` *(taxminiy)* · `EXTRACTION QISM D #20`
- **Δ 2026-07-11→08-07:** —

### EP-LMS-029 · O'quv hisoboti va dashboard
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** Ha — bo'lim/karta kesimida tugatish foizi + orqadagilar ro'yxati + AI tahlil; HR dashboard mini-widget (A).
- **Manba:** SHvB YO'NALISH 27 ("LMSDashboard: kurs bo'yicha progress, eng ko'p kechikkan kurslar; HRDashboard mini widget: tugallanmagan majburiy kurslar soni") + ERP-SIFAT 30/70
- **Dalil (kod):** `GET stats` (`lms-enrollments.controller.ts:184`) + `GET progress/summary` (`lms-misc.controller.ts:324-334`) jonli agregat; `drizzle-lms-courses-extended.repo.ts:22-31 findAll` real `is_mandatory` + `category` + `completion_rate` filtri; FE `Courses.tsx`/`LMSDashboard.tsx`. **Δ:** `97942ff7` — `LMSDashboard.tsx` sertifikat ro'yxati/hisoblagichi **doim 0** o'qirdi (`/api/certificates` `{items,total}` konvertini ochmasdi + `userName`/`courseName` alias yo'q edi); `00ecedd1` — `AllExams.tsx` bitta qator bo'lsayoq oq ekran berardi (`started_at` alias qilinmagan; endi `AllExams.tsx:24,34,131,210` `startedAt` ishlatadi).
- **Nima yetishmaydi:** dept/karta/tur/sana ko'p-filtri yo'q; rahbarni **o'z bo'limi** bilan cheklovchi RBAC-scoping yo'q (`GET stats`/`progress/summary` chaqiruvchi rolidan kelib chiqadigan parametr olmaydi); haftalik avto-hisobot va AI-tahlil yo'q (yagona cron = cert-expiry).
- **Bog'liqlik:** EP-LMS-013 (AI tahlil — AI-kalit), EP-LMS-026 (`is_mandatory`), EP-LMS-059 (murabbiy paneli)
- **action:** READ
- **⤳ Ta'sir:** Reports, Director, HR dashboard, AI
- **Xoch-havolalar:** `EXTRACTION QISM C §12 #29` · `[Module-12] Item #39` *(taxminiy)* · `[Module-12] Item #27` · `EXTRACTION QISM D #39`
- **Δ 2026-07-11→08-07:** `97942ff7` (sertifikat ro'yxati/hisoblagichi doim 0), `00ecedd1` (`AllExams.tsx` oq ekran). Ikkalasi ham **ko'rsatish** bug'lari edi — filtr/RBAC/AI bo'shliqlari o'zgarmadi.

### EP-LMS-030 · Onboarding (90 kun) o'qish rejasi bilan bog'lanish
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** Ha — onboarding bosqichlari LMS kurslari bilan bog'lanadi, mentor o'qishni kuzatadi (A).
- **Manba:** SHvB YO'NALISH 27 ("onboardingCourse") + BARCHA_JAVOBLAR Q14/Q169 (onboarding milestone) + EP-HR-001/002 (onboarding reja kartaga)
- **Dalil (kod):** `hr_onboarding_processes` = **30 qator**, `hr_onboarding_milestones` = **90 qator** (skelet real); ustunlari `id, employee_id, plan_id, adaptation_program_id, mentor_id, status, start_date, expected_end_date, actual_end_date, current_milestone, progress_percent, weekly_evaluations, checklist, notes, created_at, updated_at`. `mentorship_pairings` = **0 qator**.
- **Nima yetishmaydi:** onboarding bosqichi ↔ LMS kursi to'g'ridan-to'g'ri bog'lanish (FK/mapping) topilmadi; bosqich-muddat eskalatsiya cron'i yo'q (`grep -rn "Cron(" .../hr/onboarding` → 0).
- **Bog'liqlik:** EP-LMS-038 (mustaqil ishga qo'yish zanjiri), EP-LMS-061 (sinov muddati), EP-LMS-067 (hujjatlar to'plami)
- **action:** CREATE
- **⤳ Ta'sir:** HR (onboarding), Mentorlik, Org-karta
- **Xoch-havolalar:** `EXTRACTION QISM C §12 #30` · `[Module-12] Item #35` *(taxminiy)* · `[Module-12] Item #67`
- **Δ 2026-07-11→08-07:** —

### EP-LMS-031 · "Nazorat varaqasi" raqamli artefakt sifatida
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** Ha — har kartaga "Nazorat varaqasi" obyekti: FIO + sana + mavzular ro'yxati + har biriga raqamli tasdiq (kitob struktura aynan ko'chiriladi); imzo o'rniga raqamli tasdiq tugmasi (vaqt+xodim qayd) — A1 (A).
- **Manba:** kitob (`ЎҚУВ ЖАРАЁНИНИНГ НАЗОРАТ ВАРАҚАСИ` — FIO/sana/mavzu-mavzu тасдиқ) + BARCHA_JAVOBLAR Q75 ("erp tizimini shu asosda qurish") + Q71 (LMS integratsiya)
- **Dalil (kod):** `node _audit/q.cjs "SELECT table_name FROM information_schema.tables WHERE table_name ILIKE '%nazorat%'"` → **bo'sh natija** — `nazorat_varaqa` jadvali umuman yo'q. "Mavzular" `getCompletionSnapshot` ichida `course_progress` qatorlaridan ad-hoc hosil qilinadi (`drizzle-lms.repo.ts:389-395`), birinchi-darajali obyekt emas. Audit tomoni qisman bor: har bir LMS kontrolleri `@UseInterceptors(AuditInterceptor)` bilan qoplangan (`audit.interceptor.ts:55,114` qator-persist), lekin `grep -rln "click_hash|clickHash" apps/api/src/modules/lms` → **0**.
- **Nima yetishmaydi:** —
- **Bog'liqlik:** EP-LMS-032/033/034/063/064 — hammasi shu yo'q obyektga tayanadi (modulning 3-raqamli ildiz-blokirovkasi)
- **action:** CREATE
- **⤳ Ta'sir:** HR (onboarding hujjati), Org-karta (har karta o'z varaqasi)
- **Xoch-havolalar:** `EXTRACTION QISM C §12 #31` · `[Module-12] Item #63` · `[Module-12] Item #64` · `[Module-12] Item #23` *(audit qatlami)*
- **Δ 2026-07-11→08-07:** `63c93b87` — `docctl` ko'rish/chop-etish jurnali `lms-certificate` ga ham yoyildi (audit izining kengayishi; varaqa-obyektini yaratmaydi).

### EP-LMS-032 · Ikki xil nazorat varaqasi — Lavozim + Ishga xos
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-06-27)*
- **Talab:** Ha, ikkita — har kartada 2 varaqa: "Lavozim yo'riqnomasi" (umumiy 12 mavzu) + "Ishga xos yo'riqnoma" (amaliy), ikkalasi alohida tugatiladi (A).
- **Manba:** kitob (ЛАВОЗИМ ЙЎРИҚНОМАСИ БЎЙИЧА + ЛАВОЗИМГА ХОС ikkita varaqa) + Q75
- **Dalil (kod):** ikki-varaqa ajratmasi topilmadi; `courses` jadvalida varaqa-turi ustuni yo'q (`course_type` ustuni ham umuman yo'q — VISION-3340 SB0112 STILL-OPEN).
- **Nima yetishmaydi:** —
- **Bog'liqlik:** EP-LMS-031 (varaqa obyekti yo'q), EP-LMS-009 (`course_type` ustuni yo'q — bir xil ildiz)
- **action:** CREATE
- **⤳ Ta'sir:** Org-karta (2 varaqa atributi)
- **Xoch-havolalar:** `EXTRACTION QISM C §12 #32` · `[Module-12] Item #63` *(varaqa obyekti yo'qligi)*
- **Δ 2026-07-11→08-07:** —

### EP-LMS-033 · 12 universal mavzu shabloni
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** Ha — yangi kurs ochilganda 12 mavzu bo'sh qolip bo'lib chiqadi (maqsad, orgsxema joylashuv, malaka talablari, ish joyi/vositalar, umumiy vazifalar, lavozimga xos vazifalar, ЦКП, ko'p uchraydigan xatolar, muvaffaqiyatli harakatlar, huquqlar, javobgarlik, statistik ko'rsatkichlar), o'quv bo'limi faqat kontentni to'ldiradi (A).
- **Manba:** kitob ("12 та мавзу" aniq ro'yxat + "мақсадимиз мазкур 12 та мавзу бўйича ... тушунча шакллантириш") + Q75
- **Dalil (kod):** `grep twelveTopic|topic_template` → **0**; shablon jadvali/seed'i yo'q. Birinchi-darajali "mavzu" (topic) entitesi umuman mavjud emas — mavzular `course_progress` dan derive qilinadi (`drizzle-lms.repo.ts:389-395`).
- **Nima yetishmaydi:** —
- **Bog'liqlik:** ⭐ **ildiz-blokirovka** — EP-LMS-046/047/048/049/051/052/053/054/083 bandlarining hammasi shu shablonga tayanadi
- **action:** CREATE
- **⤳ Ta'sir:** Org-karta (ЦКП/malaka talablari kartadan), HR (statistik ko'rsatkichlar=KPI), AI (12-qolipdan generatsiya)
- **Xoch-havolalar:** `EXTRACTION QISM C §12 #33` · `[Module-12] Item #51` *(shablon yo'qligi tasdig'i)* · `[Module-12] Item #63`
- **Δ 2026-07-11→08-07:** —

### EP-LMS-034 · Mavzu-mavzu tasdiq ("o'qib chiqqaningizni tasdiqlang")
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** Ha — har mavzu yonida tasdiq, progress mavzular bo'yicha hisoblanadi (masalan 7/12) (A).
- **Manba:** kitob ("___ ўқиб чиққанингизни тасдиқланг" har 12 mavzuga alohida qator)
- **Dalil (kod):** `lms-completion.service.ts` ning C3 sharti (`C3_TOPICS_CONFIRMED`) `confirmed_at` ni **KUTADI** va `getCompletionSnapshot` (`drizzle-lms.repo.ts:359-402`) uni `course_progress` sanog'idan oladi (qator bo'lmasa 1 total / 0 done — "halol yopilgan"). `drizzle-lms.repo.ts:258-274 autoEnroll` real `INSERT ... ON CONFLICT (employee_id, course_id) DO UPDATE` (idempotent upsert, `uq_enrollments_emp_course`).
- **Nima yetishmaydi:** mavzu-tasdiq **jadvali yo'q** — 7/12 ko'rinishi generik `course_progress` sanog'idan derive qilinadi; konflikt kaliti `(employee_id, course_id)`, vizyonda aytilgan `(user_id, card_id)` emas; optimistic-lock versiya ustuni yo'q.
- **Bog'liqlik:** EP-LMS-031 (varaqa obyekti), EP-LMS-033 (12-mavzu shabloni), EP-LMS-070 (C3 mezoni)
- **action:** UPDATE
- **⤳ Ta'sir:** LMS progress, Nazorat varaqasi
- **Xoch-havolalar:** `EXTRACTION QISM C §12 #34` · `[Module-12] Item #37` *(taxminiy)* · `[Module-12] Item #70` · `EXTRACTION QISM D #37`
- **Δ 2026-07-11→08-07:** —

### EP-LMS-035 · Har mavzu oxiridagi vaziyat-savol (А/Б/В + izohlang)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-06-27)*
- **Talab:** Ha, ikki qismli — har savol: variant tanlash (avto-baholanadi) + ochiq izoh (AI birlamchi baho + rahbar tasdiq — A1) (A).
- **Manba:** kitob ("А)... Б)... В)... Танловингизни изоҳланг" — ЯКУНИЙ ТОПШИРИҚЛАР format) + ERP-SIFAT 30/70 (AI tahlil)
- **Dalil (kod):** `lms_exam_questions` da `options` + `correct_option` real (variant qismi ishlaydi); `explanation` / `open_answer` / `ai_review` maydonlari = **0** (`q.cjs` bilan tasdiqlangan) — izoh-baholash umuman yo'q.
- **Nima yetishmaydi:** ochiq izoh maydoni va uni baholovchi (AI birlamchi + rahbar tasdiq) oqimi yo'q; AI-kalit blokirovkasi ham amal qiladi.
- **Bog'liqlik:** EP-LMS-060 (yakuniy topshiriqlar), EP-LMS-062 (amaliy rubrika), ⚠️ AI-kalit
- **action:** CREATE
- **⤳ Ta'sir:** AI (izoh baholash), Coordination (rahbar tasdiq)
- **Xoch-havolalar:** `EXTRACTION QISM C §12 #35` · `[Module-12] Item #62` *(rubrika bo'shlig'i)*
- **Δ 2026-07-11→08-07:** —

### EP-LMS-036 · "Сборник упражнений" (amaliy mashqlar) alohida bo'lim
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-06-27)*
- **Talab:** Ha — har kursda ayrim "Amaliy mashqlar" bloki (ochiq javob, murabbiy baholaydi); nazorat varaqasi="o'qidingmi", mashqlar="qo'llay olasanmi" (A).
- **Manba:** kitob (Сборник упражнений — nazorat varaqasidan alohida ochiq-javobli mashqlar)
- **Dalil (kod):** `exercises` jadvali topilmadi; `lms_assignments` mavjud lekin **0 qator** va ajratilgan (mashq/nazorat) strukturasi yo'q.
- **Nima yetishmaydi:** —
- **Bog'liqlik:** EP-LMS-062 (amaliy baholash varaqasi), EP-LMS-070 (C2 mezoni — rubrika manbai yo'q)
- **action:** CREATE
- **⤳ Ta'sir:** Murabbiy baholash, LMS test banki
- **Xoch-havolalar:** `EXTRACTION QISM C §12 #36` · `[Module-12] Item #62`
- **Δ 2026-07-11→08-07:** —

### EP-LMS-037 · Glossariy (lug'at) har kursga + matn ichida atama izohi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** Ha — har kursning lug'ati + matnda atama bosilganda izoh chiqadi (kitob uslubi) (A).
- **Manba:** kitob ("ГЛОССАРИЙ (ЛУҒАТ)" har material oxirida + "атаманинг маъносига ишонч ҳосил қилмаса ... глоссарийга мурожаат қилиши шарт")
- **Dalil (kod):** `grep -in "glossar" -r apps/api/src apps/api/drizzle` → **0 hit**. `knowledge_base` jadvali bor, lekin u kurs-glossariysi emas.
- **Nima yetishmaydi:** —
- **Bog'liqlik:** EP-LMS-014 (chatbot lug'atdan tushuntiradi), EP-LMS-080 (AI glossariy generatsiyasi), EP-LMS-081
- **action:** CREATE
- **⤳ Ta'sir:** AI chatbot (lug'atdan tushuntirish)
- **Xoch-havolalar:** `EXTRACTION QISM C §12 #37` · `[Module-12] Item #45` *(glossariy yo'qligi tasdig'i)* · `[Module-12] Item #80`
- **Δ 2026-07-11→08-07:** —

### EP-LMS-038 · Mustaqil ishga qo'yish tartibi — bosqichli buyruq zanjiri
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** Ha, to'liq workflow — har bosqich (mas'ul + vaqt) tizimda kuzatiladi, oldingisi tugamasa keyingisi ochilmaydi: suhbat(НО-1) → РД-4 lavozim aniqlash+murabbiy+muddat → TX yo'riqnoma → buyruq → o'quv bo'limi → ish joyida instruktaj → 2 oy amaliy → imtihon → yozma xulosa → mustaqil ishga ruxsat (A).
- **Manba:** kitob ("Ходимни мустақил иш фаолиятига қўйиш тартиби" — aniq bosqich+mas'ul+vaqt jadvali) + BARCHA_JAVOBLAR Q71 (LMS integratsiya)
- **Dalil (kod):** `hr_onboarding_processes` (30) + `hr_onboarding_milestones` (90) skelet real; `onboarding.service.ts:163 completeProbation` kartani faollashtiradi. `grep -rn "Cron(" apps/api/src/modules/hr/onboarding` → **0** — bosqich-timeout eskalatsiyasi yo'q; `grep -rn "RD-4|RD4" apps/api/src` → faqat 4 hit, hammasi `lms-completion.service.ts` izohi/satrida ("mentor yoki RD-4 tasdig'i kerak") — РД-4 alohida rol/bosqich sifatida qurilmagan.
- **Nima yetishmaydi:** aniq 10-bosqichli ketma-ket qattiq gate yo'q (generic milestone'lar); mas'ul+vaqt jadvali yo'q; bosqich muddati o'tganda 0-4/4-8/8+ soatlik eskalatsiya yo'q.
- **Bog'liqlik:** EP-LMS-039 (РД-4 qadami), EP-LMS-042 (yozma xulosa), EP-LMS-043 (buyruq), EP-LMS-045 (instruktaj)
- **action:** CREATE
- **⤳ Ta'sir:** HR (onboarding), Org (РД-4), MES (ruxsatsiz mashina yo'q)
- **Xoch-havolalar:** `EXTRACTION QISM C §12 #38` · `[Module-12] Item #35` *(taxminiy)* · `[Module-12] Item #4` · `EXTRACTION QISM D #35`
- **Δ 2026-07-11→08-07:** —

### EP-LMS-039 · РД-4 lavozim aniqlash suhbati onboarding boshida
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** Ha — onboardingda "РД-4 suhbati" qadami: karta + murabbiy + o'qish muddati + sinov muddati shu yerda kiritiladi (A).
- **Manba:** kitob ("РД-4 га лавазимини аниқлаш учун сухбатга юбориш. РД-4 қарори, Мураббий ... ўқиш муддати ва синов муддати")
- **Dalil (kod):** `grep -rn "RD-4|RD4" apps/api/src` → 4 hit, hammasi `lms-completion.service.ts` da **matn yorlig'i** sifatida — `practicalPassed` ni kim tasdiqlaydi degan izoh; hech qanday РД-4 qadami, qarori yoki zaxira-baholovchi qidiruvi yo'q. `hr_onboarding_processes` da `mentor_id` bor, lekin РД-4 qarori maydoni yo'q.
- **Nima yetishmaydi:** —
- **Bog'liqlik:** EP-LMS-038 (zanjir), EP-LMS-042 (РД-4 yozma xulosasi), EP-LMS-058 (zaxira murabbiy); ⚠️ `org_departments.manager_id` zanjiri to'ldirilmagan → vertikal-zanjir bo'yicha zaxira baholovchi topilmaydi
- **action:** CREATE
- **⤳ Ta'sir:** Org (РД-4 = uchastka rahbari roli), HR
- **Xoch-havolalar:** `EXTRACTION QISM C §12 #39` · `[Module-12] Item #4` *(taxminiy)* · `EXTRACTION QISM D #4`
- **Δ 2026-07-11→08-07:** —

### EP-LMS-040 · 2 oylik amaliy o'qish muddati taymeri
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-06-27)*
- **Talab:** Ha — o'qish boshlanish sanasidan 2 oy sanaladi, tugashga yaqin murabbiy+РД-4 ga imtihon eslatmasi (A).
- **Manba:** kitob ("Янги ходим учун амалий машғулотлар — 2 ой")
- **Dalil (kod):** `hr_onboarding_processes.expected_end_date` / `actual_end_date` skelet real. 2-oylik taymer va imtihon-eslatma cron'i topilmadi (LMS'dagi yagona cron = `cert-expiry.handler.ts`).
- **Nima yetishmaydi:** taymer avtomatik sanamaydi; murabbiy/РД-4 ga imtihon-eslatmasi yo'q; kasallik/ta'tilda pauza yo'q.
- **Bog'liqlik:** EP-LMS-041 (imtihon), EP-LMS-027 (kasallik pauzasi), EP-LMS-069 (eslatma kanali)
- **action:** CRON
- **⤳ Ta'sir:** Notifications (imtihon eslatma), HR
- **Xoch-havolalar:** `EXTRACTION QISM C §12 #40` · `[Module-12] Item #11` *(taxminiy)* · `[Module-12] Item #35`
- **Δ 2026-07-11→08-07:** —

### EP-LMS-041 · Mustaqil ishga o'tishdan oldin ikki imtihon (nazariy + amaliy)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** Ha — ikkalasi ham o'tilishi shart: nazariy (tizim testi) + amaliy (murabbiy/РД-4 baholaydi) (A).
- **Manba:** kitob ("Мустақил ишлашга ўтишдан олдин амалий ва назарий имтихонлардан ўтиш")
- **Dalil (kod):** `lms-completion.service.ts` to'liq o'qildi — `C1_THEORY_SCORE` + `C2_PRACTICAL_PASSED` real modellashtirilgan, ikkalasi ham majburiy (`completed = c1Passed && c2Passed && c3Passed`). C1 real `lms_test_attempts.score` dan keladi; C2 `enrollments.status='completed'` boolean proksi. **Δ:** `52eb84cb` — real FE imtihon-topshirish yo'li endi `lms.exam.passed` chiqaradi; `00ecedd1` — `AllExams.tsx` (imtihon-urinishlari ekrani) bitta qatorda oq ekran berardi, tuzatildi.
- **Nima yetishmaydi:** amaliy imtihon (C2) — bu `practicalPassed: boolean`, rubrika/mezon ma'lumot-manbai yo'q (EP-LMS-062); nazariy natijani 6 oy saqlash / amaliy yiqilishda 3 oy qayta sanash qoidasi yo'q.
- **Bog'liqlik:** EP-LMS-062 (rubrika), EP-LMS-070 (3-mezon), EP-LMS-016 (interval), EP-LMS-042 (yozma xulosa)
- **action:** CREATE
- **⤳ Ta'sir:** HR, Murabbiy, MES (gate)
- **Xoch-havolalar:** `EXTRACTION QISM C §12 #41` · `[Module-12] Item #70` · `[Module-12] Item #25` *(taxminiy)* · `[Module-12] Item #62`
- **Δ 2026-07-11→08-07:** `52eb84cb` (imtihon hodisasi jonli yo'lda chiqmasdi), `00ecedd1` (`AllExams.tsx` oq ekran). Rubrika/interval bo'shliqlari o'zgarmadi.

### EP-LMS-042 · РД-4 ning yozma xulosasi ("yozma xulosa")
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-06-27)*
- **Talab:** Ha — imtihondan keyin РД-4 (uchastka rahbari) yozma xulosa + tasdiq, shundan keyingina "mustaqil ishga ruxsat" (A).
- **Manba:** kitob ("Мустақил иш бошлаш учун участка рахбарининг ёзма хулосаси — РД-4")
- **Dalil (kod):** yozma-xulosa artefakti topilmadi; `approve` generik. `lms-completion.service.ts:56-61` da amaliy natija butunlay `practicalPassed: boolean` bilan ifodalanadi ("Whether the practical exam has been confirmed by the mentor or RD-4 examiner") — matnli xulosa maydoni yo'q.
- **Nima yetishmaydi:** —
- **Bog'liqlik:** EP-LMS-039 (РД-4 roli), EP-LMS-062 (baholash varaqasi), EP-LMS-043 (buyruq)
- **action:** APPROVE
- **⤳ Ta'sir:** Org (РД-4), HR (mas'uliyatli qaror)
- **Xoch-havolalar:** `EXTRACTION QISM C §12 #42` · `[Module-12] Item #62` · `[Module-12] Item #4` *(taxminiy)*
- **Δ 2026-07-11→08-07:** —

### EP-LMS-043 · Mustaqil ishga ruxsat = buyruq bilan rasmiylashtirish
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** Ha — barcha bosqich tugagach tizim buyruq loyihasini chiqaradi (HR tasdiqlaydi) + razryad/oylik faollashadi (A).
- **Manba:** kitob ("Буйруқ чиқариш (лавозим, унвон, фамилия ... устози, ўқиш даври)" + "Мустақил ишлашга рухсат") + KARTALAR Q3 (kartaga bog'lansa oylik+ERP)
- **Dalil (kod):** `hr/onboarding/onboarding.service.ts:163 completeProbation` kartani faollashtiradi (oylik-gate faollashishi real). `grep -rln "DocumentCreated" apps/api/src/modules/lms apps/api/src/modules/hr/onboarding` → **0** — avtomatik buyruq loyihasi (prikaz) generatsiyasi va CC ga hodisa yuborish yo'q.
- **Nima yetishmaydi:** onboarding yopilganda avto-prikaz loyihasi chiqmaydi; `DocumentCreated → CC` zanjiri yo'q; HR-ning yakuniy imzosi generik `approve` dan iborat.
- **Bog'liqlik:** EP-LMS-038 (zanjir), EP-LMS-067 (hujjatlar to'plami); ⚠️ CC modulidagi prikaz-yaratish endpointi mavjudligi bu o'tishda tekshirilmadi
- **action:** CREATE
- **⤳ Ta'sir:** HR (buyruq arxivi), Payroll (to'liq oylik), Org-karta (rasman bog'lanish)
- **Xoch-havolalar:** `EXTRACTION QISM C §12 #43` · `[Module-12] Item #41` *(taxminiy)* · `EXTRACTION QISM D #41`
- **Δ 2026-07-11→08-07:** —

### EP-LMS-044 · Texnika xavfsizligi (TX instruktaj) o'qishga kirish sharti
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** Ha — TX instruktaji birinchi majburiy modul, tasdiqlanmaguncha boshqa o'qish/MES ochilmaydi (A).
- **Manba:** kitob ("Техника хавфсизлиги бўйича йўриқномадан ўтиш — Менеджер секции ТХ, 20 минут" — buyruqdan oldin) + EP-LMS-004 (MES gate)
- **Dalil (kod):** `courses` da `LMS-OHS-01` (mehnat muhofazasi) seed qilingan; `mes/.../lms-cert-expired-block.service.ts` TX→MES blokni real bajaradi (cert-muddat asosida). AMMO `card-employee-assigned.handler.ts` (to'liq o'qildi) kartaning **BARCHA** faol kurslariga bitta siklda yozadi — kurs turiga qarab tartiblash yo'q; `grep -rln "priority.*queue|PriorityQueue" apps/api/src/modules/lms` → **0**.
- **Nima yetishmaydi:** "TX birinchi, tugamaguncha boshqasi ochilmaydi" ustuvorlik-gate'i yo'q; blok faqat sertifikat-muddati orqali ishlaydi, "hali boshlamagan" holat orqali emas; tartiblash kaliti `courses.course_type` ustuni umuman yo'q.
- **Bog'liqlik:** EP-LMS-004 (MES gate), EP-LMS-009 (`course_type` yo'q), EP-LMS-019 (muddat), EP-LMS-011 (ketma-ketlik)
- **action:** EVENT
- **⤳ Ta'sir:** MES (TX'siz mashina yo'q), HR (xavfsizlik jurnali)
- **Xoch-havolalar:** `EXTRACTION QISM C §12 #44` · `[Module-12] Item #48` *(taxminiy)* · `[Module-12] Item #6` · `EXTRACTION QISM D #6`
- **Δ 2026-07-11→08-07:** —

### EP-LMS-045 · Ish joyida birinchi instruktaj qayd qilinishi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-06-27)*
- **Talab:** Ha — "ish joyida instruktaj" qadami (mas'ul: РД-4/sex menejeri, sana, tasdiq) (A).
- **Manba:** kitob ("Иш жойида биринчи инструктаждан ўтказиш — РД-4, секция менеджери, 30 минут")
- **Dalil (kod):** maxsus instruktaj-qayd qadami topilmadi; faqat generik `hr_onboarding_milestones` qatorlari (90 ta) mavjud, ularda mas'ul-rol/sana/tasdiq ajratmasi yo'q.
- **Nima yetishmaydi:** —
- **Bog'liqlik:** EP-LMS-038 (zanjir qadami), EP-LMS-039 (РД-4), EP-LMS-067 (hujjat to'plami)
- **action:** UPDATE
- **⤳ Ta'sir:** Org (РД-4/sex menejeri), HR
- **Xoch-havolalar:** `EXTRACTION QISM C §12 #45` · `[Module-12] Item #35` *(taxminiy)* · `[Module-12] Item #67`
- **Δ 2026-07-11→08-07:** —

### EP-LMS-046 · ЦКП har kursda, kartadan keladi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-06-27)*
- **Talab:** Ha — kursning ЦКП mavzusi kartaning ЦКП maydonidan avtomatik keladi (yagona manba) (A).
- **Manba:** kitob ("Лавозимнинг ЦКП си" 12-mavzudan biri) + KARTALAR Q14 (GSD/ЦКП kartaga) + Q40 (bitta DDL/yagona manba)
- **Dalil (kod):** ЦКП karta atributi sifatida `org_departments` da mavjud; `courses.card_id` ustuni mavjud (0/5 to'ldirilgan). Kartadan ЦКП ni O'QIB kursda ko'rsatuvchi kod qurilmagan.
- **Nima yetishmaydi:** READ-ulanish yo'q — kurs ЦКП mavzusi kartadan avtomatik kelmaydi; birinchi-darajali "mavzu" obyekti bo'lmagani uchun bog'lash joyi ham yo'q.
- **Bog'liqlik:** EP-LMS-033 (12-mavzu shabloni — ildiz), EP-LMS-001 (`card_id` 0/5), EP-LMS-051 (KPI mavzusi — bir xil naqsh)
- **action:** READ
- **⤳ Ta'sir:** Org-karta (ЦКП atribut), AI (xodim-karta mosligi)
- **Xoch-havolalar:** `EXTRACTION QISM C §12 #46` · `[Module-12] Item #51` *(bir xil ildiz)* · `[Module-12] Item #32`
- **Δ 2026-07-11→08-07:** —

### EP-LMS-047 · "Ko'p uchraydigan xatolar" bloki + jonli yangilanish
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** Ha + jonli — kursda "ko'p uchraydigan xatolar" bloki, sifat/MES'dan kelgan real xatolar bilan boyitiladi (A).
- **Manba:** kitob ("Кўп учрайдиган хатолар" 12-mavzudan biri) + ERP-SIFAT 30/70 (AI tahlil) + Sifat moduli (brak/reklamatsiya)
- **Dalil (kod):** `grep -rn "defect.*event|xatolar.*blok" apps/api/src/modules/lms` → **0**; QC/MES nuqson-hodisasini tinglovchi listener yo'q. 12-mavzu shabloni ham yo'q (EP-LMS-033).
- **Nima yetishmaydi:** —
- **Bog'liqlik:** EP-LMS-033 (shablon — ildiz); ⚠️ qaysi QC/MES nuqson-signali qaysi LMS mavzusiga tegishli ekani = **egasi-qarori** (mapping jadvali yo'q); QC/MES tomonida hodisa chiqarilishi bu o'tishda tekshirilmadi
- **action:** AI
- **⤳ Ta'sir:** Sifat/QC (brak sabablari → xatolar bloki), AI
- **Xoch-havolalar:** `EXTRACTION QISM C §12 #47` · `[Module-12] Item #13` *(taxminiy)* · `EXTRACTION QISM D #13`
- **Δ 2026-07-11→08-07:** —

### EP-LMS-048 · "Muvaffaqiyatli harakatlar" bloki + blanka
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** Ha — "muvaffaqiyatli harakatlar" blankasi: rahbar real misol qo'shadi, kursga ulanadi (A).
- **Manba:** kitob ("Мувафаққиятли харакатлар" 12-mavzudan biri + rahbar muntazam to'ldiradigan blanka)
- **Dalil (kod):** kurs-tasdiq zanjiri real: `lms-courses.controller.ts:187-206` `submitCourse`/`approveCourse` (`TRAINING_OFFICER` → `HR_MANAGER`/`DIRECTOR`/`SUPER_ADMIN`, "draft → review → approved", 2-imzo). `grep -rln "blanka" apps/api/src/modules/lms` → **0** — maxsus "muvaffaqiyatli harakatlar" blanka jadvali/endpointi yo'q, tasdiq bosqichida 48-soatlik SLA taymeri ham yo'q.
- **Nima yetishmaydi:** blanka obyekti yo'q; rahbar → НО-14 (48 soat) maxsus oqimi yo'q; `TRAINING_OFFICER` rolida 0 foydalanuvchi.
- **Bog'liqlik:** EP-LMS-033 (shablon), EP-LMS-012 (tasdiq zanjiri), EP-LMS-056 (НО-14)
- **action:** UPDATE
- **⤳ Ta'sir:** Coordination (rahbar kiritadi), Org-karta
- **Xoch-havolalar:** `EXTRACTION QISM C §12 #48` · `[Module-12] Item #24` *(taxminiy)* · `EXTRACTION QISM D #24`
- **Δ 2026-07-11→08-07:** —

### EP-LMS-049 · "Lavozim bo'yicha malaka talablari" kursda va kartada
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** Ha — karta malaka talablari → kurs mavzulari shu talablardan kelib chiqadi (talab = o'rganish maqsadi) (A).
- **Manba:** kitob ("Лавозим бўйича малака талаблари" 12-mavzudan biri; misol: o'rta-maxsus/oliy, qog'oz/gofra turlari) + karta-model (malaka talablari atribut)
- **Dalil (kod):** `card-required-knowledge.controller.ts` to'liq o'qildi — real, to'liq CRUD (`by-card/:cardId`, `GET/POST/PATCH/DELETE :id`), yozish `HR_MANAGER, TRAINING_OFFICER, DIRECTOR, SUPER_ADMIN` bilan rol-qo'riqlangan. `node _audit/q.cjs "SELECT count(*) FROM card_required_knowledge"` → **0 qator**.
- **Nima yetishmaydi:** malaka-talabidan kurs mavzusini avto-generatsiya qilish yo'q; jadval bo'm-bo'sh (0 qator) — mexanizm bor, ma'lumot yo'q.
- **Bog'liqlik:** EP-LMS-050 (domen-bilim), EP-LMS-053 (jihozlar), EP-LMS-033 (shablon)
- **action:** READ
- **⤳ Ta'sir:** Org-karta (malaka talablari), Razryad (talab→razryad)
- **Xoch-havolalar:** `EXTRACTION QISM C §12 #49` · `[Module-12] Item #53` · `EXTRACTION QISM A Step-3 (card_required_knowledge UI-endpoint)`
- **Δ 2026-07-11→08-07:** —
- **⚠️ ZIDDIYAT:** `EXTRACTION QISM A` Step-3 ochiq savoli "card_required_knowledge / domen-bilim UI-endpoint yo'q (SB0116/0146 STILL-OPEN — jadval/endpoint topilmadi)" deydi. FULL-ITEM-LEVEL Item #53 esa `card-required-knowledge.controller.ts` ni **to'liq o'qib** endpoint real ekanini tasdiqlaydi. Kod-dalili kuchliroq → **endpoint bor, ma'lumot yo'q**.

### EP-LMS-050 · Konkret domen-bilim modullari — "qog'oz turlari", "gofra turlari"
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** Ha — domen-bilim modullari material/mahsulot katalogiga bog'lanadi (gofra turi o'zgarsa kurs ham yangilanadi) (A).
- **Manba:** kitob ("Қоғоз турларини билиши керак", "Гофра турларини билиши керак" — ichki logistika kartasi) + KARTALAR Q40 (yagona master-data)
- **Dalil (kod):** `card_required_knowledge` CRUD real (EP-LMS-049 dalili), 0 qator. `grep -rln "MaterialAdded" apps/api/src/modules/lms` → **0** — material-katalog ↔ kurs avto-yangilanish zanjiri yo'q.
- **Nima yetishmaydi:** `MaterialAdded` listener yo'q; yangi gofra turi qo'shilganda kurs mavzusi yangilanmaydi va tugatganlarga qisqa qayta-o'qish tushmaydi.
- **Bog'liqlik:** EP-LMS-049 (bir xil jadval); ⚠️ yangi material turini qaysi LMS mavzusiga ulash = **egasi-taksonomiyasi**; material-katalog moduli `MaterialAdded` chiqarishi tekshirilmadi
- **action:** CREATE
- **⤳ Ta'sir:** Ombor/Material katalogi (gofra/qog'oz turlari = master data)
- **Xoch-havolalar:** `EXTRACTION QISM C §12 #50` · `[Module-12] Item #46` *(taxminiy)* · `EXTRACTION QISM D #46`
- **Δ 2026-07-11→08-07:** —

### EP-LMS-051 · "Statistik ko'rsatkichlar" mavzusi = karta KPI
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** Ha — "statistik ko'rsatkichlar" mavzusi kartaning KPI/ЦКП o'lchovlaridan keladi (xodim qanday baholanishini biladi) (A).
- **Manba:** kitob ("Статистик кўрсаткичлар" 12-mavzudan biri) + KARTALAR Q14 (GSD o'lchov)
- **Dalil (kod):** `grep -rln "KPI.*mavzu|topic.*kpi" apps/api/src/modules/lms -i` → **0**; hech bir LMS mavzusi KPI manbaidan o'qimaydi. Mavzular hamon `course_progress` dan ad-hoc derive qilinadi — KPI-o'qishni biriktiradigan birinchi-darajali "mavzu" entitesi yo'q.
- **Nima yetishmaydi:** —
- **Bog'liqlik:** EP-LMS-063/EP-LMS-064 (mavzu/varaqa jadvali yo'q); ⚠️ 12-mavzu shabloni kontenti = egasi-materiali
- **action:** READ
- **⤳ Ta'sir:** HR (KPI), Org-karta (statistik ko'rsatkich atribut)
- **Xoch-havolalar:** `[Module-12] Item #51` · `EXTRACTION QISM C §12 #51`
- **Δ 2026-07-11→08-07:** —

### EP-LMS-052 · "Lavozim huquqlari" va "Lavozim javobgarligi" o'qitilishi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** Ha — "huquqlar" va "javobgarlik" alohida mavzular, kartadan keladi, test bilan tekshiriladi (A).
- **Manba:** kitob ("Хуқуқларингиз" + "Жавобгарлик" 12-mavzudan ikkitasi, alohida тасдиқ qatorlari bor)
- **Dalil (kod):** `grep -rln "huquq.*javobgarlik|rights.*responsibilit" apps/api/src/modules/lms -i` → **0**. EP-LMS-051 bilan bir xil ildiz — karta/lavozim ma'lumotidan mavzu-darajasida o'qish yo'li mavjud emas.
- **Nima yetishmaydi:** —
- **Bog'liqlik:** EP-LMS-051/063/064 (mavzu-jadval sharti); ⚠️ shablon kontenti = egasi-materiali
- **action:** READ
- **⤳ Ta'sir:** Org-karta (huquq/javobgarlik atributlari)
- **Xoch-havolalar:** `[Module-12] Item #52` · `EXTRACTION QISM C §12 #52`
- **Δ 2026-07-11→08-07:** —

### EP-LMS-053 · "Ish joyi va lavozim vositalari" — jihozlar katalogi bilan bog'lanish
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** Ha — "ish joyi vositalari" mavzusi aktivlar/jihozlar katalogiga bog'lanadi (kartaning "kerakli jihozlar"i) (A).
- **Manba:** kitob ("Иш жойи ва лавозим воситалари" 12-mavzudan biri) + memory (karta-model "kerakli jihozlar" hozir YO'Q → shu yerga ulanadi)
- **Dalil (kod):** `card-required-knowledge.controller.ts` to'liq o'qildi — real, to'liq CRUD (`by-card/:cardId`, `GET/POST/PATCH/DELETE :id`), yozish `HR_MANAGER, TRAINING_OFFICER, DIRECTOR, SUPER_ADMIN` bilan qo'riqlangan. `SELECT count(*) FROM card_required_knowledge` → **0 qator**. `grep -rln "asset.*card_required|equipment.*lms" apps/api/src` → **0**; `grep -rn "review_required" apps/api/src/modules/lms` → **0**.
- **Nima yetishmaydi:** aktivlar/jihozlar katalogidan avtomatik sinxronizatsiya yo'q — har qator qo'lda kiritilishi kerak va hozir 0 qator; jihoz yo'qolganda/eskirganda `review_required` bayrog'i va НО-14 xabari yo'q.
- **Bog'liqlik:** EP-LMS-049 (bir xil jadval); ⚠️ aktivlar moduli jihoz-holati hodisasini chiqarishi tekshirilmadi
- **action:** CREATE
- **⤳ Ta'sir:** Aktivlar/Jihozlar moduli, Org-karta ("kerakli jihozlar")
- **Xoch-havolalar:** `[Module-12] Item #53` · `EXTRACTION QISM C §12 #53` · `[Module-12] Item #47` · `EXTRACTION QISM D #47`
- **Δ 2026-07-11→08-07:** —

### EP-LMS-054 · "Orgsxemadagi joylashuvi" mavzusi org-chartdan keladi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** Ha — mavzu jonli org-chartdan keladi (xodim o'z kartasini, rahbarini, hamkor bo'limlarni ko'radi) (A).
- **Manba:** kitob ("Оргсхемадаги жойлашуви" 2-mavzu + "изоляцияда олиб бориши ... ахборот узилишига олиб келади") + Vysotskiy-7 org-model
- **Dalil (kod):** `grep -rln "org.chart.*topic|org.chart.*mavzu" apps/api/src/modules/lms -i` → **0**. Vysotskiy-7 org-tuzilma kod bazasining boshqa joyida bor, lekin hech bir LMS mavzusi jonli org-chart ma'lumotini o'qimaydi.
- **Nima yetishmaydi:** —
- **Bog'liqlik:** EP-LMS-051/063/064 (mavzu-jadval sharti), EP-LMS-055 (7 departament kursi)
- **action:** READ
- **⤳ Ta'sir:** Org (Vysotskiy-7 daraxti), Coordination (gorizontal hamkorlik)
- **Xoch-havolalar:** `[Module-12] Item #54` · `EXTRACTION QISM C §12 #54`
- **Δ 2026-07-11→08-07:** —

### EP-LMS-055 · 7 departament tuzilmasi umumiy kursda
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** Ha — barcha yangi xodimga majburiy "Korxona tuzilmasi (7 departament)" kursi (A).
- **Manba:** kitob (7 departament sanaladi: Ходимлар/Савдо/Бухгалтерия/Ишлаб чиқариш/ИЧ+сифат/Ривожлантириш/Администрация) + Vysotskiy-7 model + EP-LMS-068 (qatlamlash)
- **Dalil (kod):** `node _audit/q.cjs "SELECT id,code,title FROM courses ORDER BY id"` → seed qilingan 5 kurs: `LMS-OHS-01` (mehnat muhofazasi), `LMS-ERP-01` (ERP), `LMS-PRINT-01` (bosma texnologiya), `LMS-QC-01` (sifat), `LMS-LEAD-01` (rahbarlik) — hech biri "7 departament / Vysotskiy tuzilma" tanishuv kursi emas.
- **Nima yetishmaydi:** —
- **Bog'liqlik:** EP-LMS-054 (org-chart mavzusi), EP-LMS-068 (umumiy qatlam); ⚠️ kurs **kontenti** = egasi-materiali
- **action:** CREATE
- **⤳ Ta'sir:** Org (departament ierarxiyasi)
- **Xoch-havolalar:** `[Module-12] Item #55` · `EXTRACTION QISM C §12 #55` · `[Module-12] Item #40`
- **Δ 2026-07-11→08-07:** —
- **⚠️ ZIDDIYAT:** `FULL-ITEM-LEVEL Item #55` ning sarlavha-qatorida "Ha (re-verified as accurately Yo'q — no change from doc)" yozilgan, keyin o'zi "**Current status (corrected): Yo'q**" deb tuzatadi. Registrga tuzatilgan qiymat — **Yo'q** — kiritildi.

### EP-LMS-056 · O'quv bo'limi (НО-14) "o'quv dasturi hajmini aniqlash" roli
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** Ha — o'quv bo'limi har yangi xodim/karta uchun o'quv dasturi hajmini belgilaydi (qaysi kurslar, qancha vaqt) (A).
- **Manba:** kitob ("Ўқув дастурининг хажмини аниқлаш учун ўқув бўлимига йўналтириш — НО-1, НО-14") + KARTALAR Q29 (o'quv bo'limi yozadi)
- **Dalil (kod):** `TRAINING_OFFICER` roli deyarli har bir LMS yozish-endpointida RBAC dekorator sifatida ishlatiladi (kurslar, savollar, sertifikatlar, karta-murabbiylar, karta-talab-bilim). `node _audit/q.cjs "SELECT DISTINCT role FROM users"` → jonli rollar faqat `manager, director, super_admin, employee` — **`TRAINING_OFFICER` rolida 0 ta foydalanuvchi**. `grep -rln "dastur.*hajm|program.*scope" apps/api/src/modules/lms -i` → **0**.
- **Nima yetishmaydi:** hech bir foydalanuvchi bu rolda emas → bugun amalda ishlatib bo'lmaydi; "dastur hajmi" (qaysi kurslar / qancha vaqt) uchun alohida endpoint/jadval yo'q.
- **Bog'liqlik:** ⚠️ egasi haqiqiy НО-14 xodimiga `TRAINING_OFFICER` rolini berishi shart (EP-LMS-012/048/079 ham shu bloklovga tegishli)
- **action:** CREATE
- **⤳ Ta'sir:** Org (o'quv bo'limi=НО-14), HR (o'quv rejasi)
- **Xoch-havolalar:** `[Module-12] Item #56` · `EXTRACTION QISM C §12 #56` · `[Module-12] Item #36`
- **Δ 2026-07-11→08-07:** —

### EP-LMS-057 · Murabbiyning o'zi malakali ekanini tekshirish
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** Ha — murabbiy bo'lish uchun min. razryad + o'sha karta sertifikati + (ixtiyoriy) "murabbiylik" moduli shart (A); aniq razryad chegarasi HR sozlovi.
- **Manba:** karta-model (razryad/sertifikat mavjud) + sifat mantig'i; egasi murabbiy-malaka qoidasini aniq belgilamagan
- **Dalil (kod):** `LmsMentorsController` / `lms_card_mentors` CRUD to'liq o'qildi (`lms-misc.controller.ts:189-297`) — `assignCardMentor` istalgan `mentorUserId` ni **hech qanday oldindan tekshiruvsiz** qabul qiladi (murabbiyning o'z razryadi/sertifikati holati tekshirilmaydi). `rateCardMentor` da `qualificationVerified`/`verifiedBy` maydonlari bor, lekin bu **qo'lda HR attestatsiyasi**, avtomatik min-razryad+sertifikat tekshiruvi emas.
- **Nima yetishmaydi:** —
- **Bog'liqlik:** EP-LMS-021 (PDCA) emas — EP-LMS-058 (zaxira tartib), EP-LMS-082 (reyting); ⚠️ minimal razryad/sertifikat chegarasi = egasi-master-data
- **action:** UPDATE
- **⤳ Ta'sir:** HR, Razryad
- **Xoch-havolalar:** `[Module-12] Item #57` · `EXTRACTION QISM C §12 #57` · `[Module-12] Item #21`
- **Δ 2026-07-11→08-07:** —

### EP-LMS-058 · Murabbiy bo'lmaganda (kichik bo'lim) — zaxira tartib
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** Zaxira tartib — murabbiy yo'q bo'lsa yuqori rahbar yoki yondosh karta egasi murabbiy bo'ladi; AI nazariyni qoplaydi (A).
- **Manba:** karta-model (vertikal yuqori rahbar) + AI-chatbot (EP-LMS-014); granular zaxira qoidasi egasi tomonidan aniq belgilanmagan
- **Dalil (kod):** o'sha `LmsMentorsController` o'qildi — hech qanday fallback/zaxira-tayinlash mantig'i yo'q; `assignCardMentor` aniq `mentorUserId` talab qiladi, "rahbar zanjiridan yoki yondosh kartadan avto-tanla" yo'li yo'q (QISM A Item #4 dagi zaxira-baholovchi yo'qligiga mos).
- **Nima yetishmaydi:** —
- **Bog'liqlik:** EP-LMS-039/EP-LMS-042 (РД-4 zaxirasi — bir xil naqsh); ⚠️ zaxira qoidasi/ustuvorlik tartibi = egasi-qarori; `org_departments.manager_id` zanjiri to'ldirilmagan
- **action:** UPDATE
- **⤳ Ta'sir:** Org (vertikal), AI
- **Xoch-havolalar:** `[Module-12] Item #58` · `EXTRACTION QISM C §12 #58` · `[Module-12] Item #4` · `EXTRACTION QISM D #4`
- **Δ 2026-07-11→08-07:** —

### EP-LMS-059 · Murabbiy shogird progressini real vaqtda ko'rishi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** Ha — murabbiyda "mening shogirdlarim" paneli (har birining mavzu/test holati) (A).
- **Manba:** BARCHA_JAVOBLAR Q72 (mentor amaliy topshiriq kuzatadi) + kitob (murabbiy mas'ul) + ERP-SIFAT 30/70 (tahlil panel)
- **Dalil (kod):** `lms_card_mentors` CRUD real; `lms-misc.controller.ts:316-320` `GET progress/user/:id` (`LmsProgressCompatController.getUserProgress`) real, jonli endpoint. AMMO `grep -n "by-user|byUser" lms-misc.controller.ts lms-core.controller.ts` → **0** — murabbiyning o'z `lms_card_mentors` tayinlovlari bo'yicha avto-filtrlanadigan "Shogirdlarim" paneli yo'q; o'qish huquqi bor har qanday rol istalgan `user_id` ni so'rashi mumkin.
- **Nima yetishmaydi:** murabbiy-qamrovli (mentor-scoped) panel yo'q; bu generik foydalanuvchi-progress qidiruvi, RBAC bilan cheklanmagan.
- **Bog'liqlik:** EP-LMS-029 (dashboard RBAC-scoping — bir xil bo'shliq), EP-LMS-062 (baholash oqimi)
- **action:** READ
- **⤳ Ta'sir:** Mentorlik panel, HR
- **Xoch-havolalar:** `[Module-12] Item #59` · `EXTRACTION QISM C §12 #59` · `[Module-12] Item #15`
- **Δ 2026-07-11→08-07:** —

### EP-LMS-060 · Yakuniy topshiriqlar — bo'lim oxiridagi yig'ma test
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** Ha — har bo'lim oxirida yakuniy topshiriqlar bloki (o'tilmasa keyingi bo'lim ochilmaydi) (A).
- **Manba:** kitob ("БИРИНЧИ/ИККИНЧИ БЎЛИМ БЎЙИЧА ЯКУНИЙ ТОПШИРИҚЛАР" — har bo'lim oxirida yig'ma savol+topshiriq)
- **Dalil (kod):** `node _audit/q.cjs "SELECT column_name FROM information_schema.columns WHERE table_name='lms_modules'"` → `id, course_id, title, title_ru, order, created_at, deleted_at, description, order_index, updated_at, sort_order` — uchta alohida tartiblash ustuni bor (`order`/`order_index`/`sort_order`, o'zi kichik dublikat-drift), lekin "bo'lim yakuniy testi" yoki gate/qulf ustuni yo'q.
- **Nima yetishmaydi:** —
- **Bog'liqlik:** EP-LMS-011 (micro-modul ketma-ketligi — bir xil gate bo'shlig'i), EP-LMS-035 (vaziyat-savol)
- **action:** CREATE
- **⤳ Ta'sir:** LMS progress (bo'lim-gate)
- **Xoch-havolalar:** `[Module-12] Item #60` · `EXTRACTION QISM C §12 #60`
- **Δ 2026-07-11→08-07:** —

### EP-LMS-061 · Sinov muddati natijasi LMS bilan bog'liqligi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** Ha — sinov muddati yakunida LMS natijasi (imtihon + murabbiy bahosi) qaror uchun yig'iladi (A).
- **Manba:** kitob (buyruqda "синов муддати" + imtihon natijasi) + BARCHA_JAVOBLAR Q91 (sinov: baholash+avtomatik o'tish) + EP-HR-003
- **Dalil (kod):** `hr_onboarding_processes` da `mentor_id`, `status`, `progress_percent`, `weekly_evaluations` — sinov-muddatiga yaqin skelet real; `LmsCompletionService` ning 3-shartli gate'i real tugatish-signali. `grep -rln "probation.*decision|sinov.*qaror" apps/api/src/modules/lms apps/api/src/modules/hr -i` → imtihon+murabbiy xulosasini sinov-qarori uchun **yig'uvchi alohida hodisa topilmadi**.
- **Nima yetishmaydi:** xom signallar bor va real, lekin "imtihon natijasi + murabbiy hukmi" ni sinov go/no-go qarori uchun paketlaydigan aniq hodisa/agregat yo'q.
- **Bog'liqlik:** EP-LMS-041 (ikki imtihon), EP-LMS-042 (yozma xulosa), EP-LMS-030 (onboarding), EP-LMS-043 (buyruq)
- **action:** EVENT
- **⤳ Ta'sir:** HR (probatsiya qarori), AI (xodim-karta mosligi)
- **Xoch-havolalar:** `[Module-12] Item #61` · `EXTRACTION QISM C §12 #61` · `[Module-12] Item #35`
- **Δ 2026-07-11→08-07:** —

### EP-LMS-062 · Amaliy imtihonni baholash varaqasi (murabbiy/РД-4)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** Ha — amaliy imtihon baholash varaqasi: mezonlar + ball + baholovchi izohi (murabbiy/РД-4) (A).
- **Manba:** kitob (amaliy imtihon РД-4 baholaydi) + BARCHA_JAVOBLAR Q175 ("Task+Rubrika+Real vaziyat") + EP-LMS-041
- **Dalil (kod):** `lms-completion.service.ts:56-61` — `practicalPassed: boolean` amaliy imtihon natijasining **BUTUN** ifodasi ("Whether the practical exam has been confirmed by the mentor or RD-4 examiner"). `grep -rln "rubric|rubrika" apps/api/src/modules/lms` → **0** — mezon/ball/izoh rubrika jadvali yo'q.
- **Nima yetishmaydi:** —
- **Bog'liqlik:** EP-LMS-041 (C2 mezoni), EP-LMS-070 (o'zlashtirish), EP-LMS-036 (amaliy mashqlar), EP-LMS-042; ⚠️ rubrika mezonlari = egasi-materiali
- **action:** CREATE
- **⤳ Ta'sir:** Murabbiy/РД-4 baholash, HR
- **Xoch-havolalar:** `[Module-12] Item #62` · `EXTRACTION QISM C §12 #62` · `[Module-12] Item #70`
- **Δ 2026-07-11→08-07:** —

### EP-LMS-063 · Lavozim o'zgarganda yangi nazorat varaqasi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** Ha — yangi kartaga o'tganda o'sha kartaning nazorat varaqasi avto-tayinlanadi (eski yopiladi, arxivda qoladi) (A).
- **Manba:** kitob (har lavozimning o'z yo'riqnoma+varaqasi) + KARTALAR Q28 (darslik kartaga) + EP-LMS-003 (avto-tayinlash)
- **Dalil (kod):** `card-employee-assigned.handler.ts` to'liq o'qildi — avto-enroll **har qanday** karta (qayta-)biriktirishida yonadi, ya'ni "lavozim o'zgarganda yangi yozilish" vazifasini bajaradi. `node _audit/q.cjs "SELECT table_name FROM information_schema.tables WHERE table_name ILIKE '%nazorat%'"` → **bo'sh** — `nazorat_varaqa` jadvali umuman yo'q; "mavzular" `getCompletionSnapshot` ichida `course_progress` qatorlaridan ad-hoc hosil qilinadi (`drizzle-lms.repo.ts:389-395`).
- **Nima yetishmaydi:** ochiladigan/yopiladigan mustaqil "nazorat varaqasi" obyekti yo'q — u `course_progress` sanoqlarining bilvosita natijasi, birinchi-darajali artefakt emas; "eskisini yopish + arxivlash" oqimi ham yo'q.
- **Bog'liqlik:** EP-LMS-031 (varaqa obyekti), EP-LMS-064 (PDF eksport), EP-LMS-071 (arxiv)
- **action:** EVENT
- **⤳ Ta'sir:** Org-karta (lavozim ko'chishi), HR (transfer)
- **Xoch-havolalar:** `[Module-12] Item #63` · `EXTRACTION QISM C §12 #63` · `[Module-12] Item #32`
- **Δ 2026-07-11→08-07:** —

### EP-LMS-064 · Nazorat varaqasini kitob formatida PDF eksport
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** Ha — tugatilgan varaqa kitob formatida PDF (FIO, tashkilot, sanalar, mavzu-tasdiqlar, imtihon natijasi) (A).
- **Manba:** kitob (НАЗОРАТ ВАРАҚАСИ qog'oz formati) + ERP-SIFAT (immutable hujjat/audit) + EP-LMS-018 (PDF sertifikat)
- **Dalil (kod):** **Δ:** `06f77edc` — `lms-certificate-pdf.service.ts` yaratildi: `pdf-lib` `PDFDocument`/`StandardFonts` + `qrcode` + `toPdfSafeText()` (kirill nomlar WinAnsi'da yiqilmasligi uchun), real `certificates JOIN employees JOIN courses` (`fetchRow`, 49-60 qator), QR `cert_hash` ni kodlaydi (99-101 qator), `issued_ip` chizadi (131-qator). Ya'ni **sertifikat** endi haqiqiy PDF. AMMO `nazorat_varaqa` obyekti hamon yo'q (EP-LMS-063) → varaqaning o'zi uchun eksport yo'q.
- **Nima yetishmaydi:** eksport qilinadigan **nazorat varaqasi obyekti mavjud emas**; PDF faqat sertifikat uchun; "kitob formati" (FIO+tashkilot+mavzu-tasdiqlar jadvali) tarkibi qurilmagan.
- **Bog'liqlik:** EP-LMS-063 (varaqa obyekti — asosiy blok), EP-LMS-031, EP-LMS-018 (PDF infratuzilmasi endi bor)
- **action:** EXPORT
- **⤳ Ta'sir:** HR (shaxsiy ish papkasi), CC/Hujjat
- **Xoch-havolalar:** `[Module-12] Item #64` · `EXTRACTION QISM C §12 #64` · `[Module-12] Item #30` · `[Module-12] Item #63`
- **Δ 2026-07-11→08-07:** `06f77edc` (real PDF generator — HTML stub o'rniga), `6d5a40b1` (`issued_ip` + SHA-256 `cert_hash` yuridik-minimal maydonlari), `63c93b87` (ko'rish/chop-etish jurnali). 2026-07-11 da STALE-DOC edi ("hardcoded HTML stub" iqtibosi eskirgan) → endi **PDF infratuzilmasi bor, varaqa obyekti yo'q**.
- **⚠️ ZIDDIYAT:** `EXTRACTION QISM C §12 #64` "cert download = hardcoded HTML stub (`lms-certificates-standalone.controller.ts:98`)" deydi. FULL-ITEM-LEVEL Item #64 buni 2026-07-11 da allaqachon STALE deb belgilagan (kontroller o'sha paytda ham real DB so'rovi qilardi), 2026-08-07 da esa `06f77edc` bilan haqiqiy PDF ham qo'shildi. Iqtibos **ikki marta eskirgan**.

### EP-LMS-065 · Lavozimga xos yo'riqnoma o'zgarsa — qayta-o'qish (kartadagi hammaga)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** Ha — yo'riqnoma versiyasi o'zgarsa, o'sha kartadagi xodimlarga "yangilangan qism" qayta-o'qish + qisqa test tushadi (A).
- **Manba:** SHvB YO'NALISH 28 ("Reglament yangilanganda: tegishli xodimlar qayta test") + kitob (ishga xos yo'riqnoma) + EP-LMS-028
- **Dalil (kod):** `courses.updated_at` ustuni bor, lekin `node _audit/q.cjs "SELECT column_name FROM information_schema.columns WHERE table_name='courses' AND column_name ILIKE '%version%'"` → **bo'sh natija**. `version`/`changed_topics` mexanizmi yo'qligi sababli ommaviy qayta-o'qish trigger'i qurilishi mumkin emas.
- **Nima yetishmaydi:** —
- **Bog'liqlik:** ⭐ `courses.version` ustuni (modulning 2-raqamli ildiz-blokirovkasi) — EP-LMS-019/072 ham shunga bog'liq; EP-LMS-028 (matritsa)
- **action:** EVENT
- **⤳ Ta'sir:** Hujjat boshqaruvi (versiya), MES (eski usul blok), Notifications
- **Xoch-havolalar:** `[Module-12] Item #65` · `EXTRACTION QISM C §12 #65` · `[Module-12] Item #5` · `[Module-12] Item #19`
- **Δ 2026-07-11→08-07:** —

### EP-LMS-066 · ERP/CRM tizimida ishlash ko'nikmasi alohida modul
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** Ha — "ERP tizimida ishlash" majburiy modul, kartaga qarab kerakli ekranlar (kanban, status, kartochka) o'rgatiladi (A).
- **Manba:** kitob (dizayn rahbari yo'riqnomasi Bitrix24 ishlash bloki → bizning ERP) + BARCHA_JAVOBLAR Q197 ("LMS da video qo'llanma + majburiy: ko'rmasdan ishlatib bo'lmaydi")
- **Dalil (kod):** `node _audit/q.cjs "SELECT id,code,title FROM courses WHERE id=4"` → `{id:4, code:"LMS-ERP-01", title:"ERP tizimida ishlash asoslari"}` — kurs **jonli `courses` jadvalida mavjud**. `grep -rln "erp.*update.*lms|ERP.*micro" apps/api/src/modules/lms` → **0** — ERP yangilanishiga bog'langan maqsadli micro-modul oqimi yo'q.
- **Nima yetishmaydi:** kurs uchun `is_mandatory`/`card_id` sozlangani bu o'tishda tasdiqlanmadi; "kartaga qarab ekranlar" (rol/ekran bo'yicha kontent-targetlash) dalili topilmadi; НО-14 yangi ERP moduliga qo'shimcha micro-modul qo'sha oladigan oqim yo'q.
- **Bog'liqlik:** EP-LMS-010 (micro-modul), EP-LMS-056 (НО-14 roli), EP-LMS-026 (`is_mandatory`)
- **action:** CREATE
- **⤳ Ta'sir:** Kanban, barcha modul (tizim savodxonligi)
- **Xoch-havolalar:** `[Module-12] Item #66` · `EXTRACTION QISM C §12 #66` · `[Module-12] Item #29`
- **Δ 2026-07-11→08-07:** —
- **⚠️ ZIDDIYAT:** `EXTRACTION QISM C §12 #66` "maxsus ERP kurs topilmadi; courses=5, seed qilinmagan" deydi — bu **noto'g'ri**: `LMS-ERP-01` (id=4) jonli bazada mavjud. FULL-ITEM-LEVEL Item #66 buni STALE-DOC deb belgilab **Qisman** ga tuzatgan; registrda tuzatilgan qiymat.

### EP-LMS-067 · Onboarding hujjatlar to'plami (ariza, buyruq, TX, varaqa, xulosa)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** Ha — har yangi xodim onboardingida hujjatlar checklist + har biri tizimda fayl/qayd sifatida (ariza, buyruq, TX instruktaj, nazorat varaqasi, yozma xulosa, mustaqil ish buyrug'i) (A).
- **Manba:** kitob (tartib bir nechta hujjat keltirib chiqaradi: ariza/buyruq/TX/varaqa/xulosa) + ERP-SIFAT (immutable hujjat)
- **Dalil (kod):** `node _audit/q.cjs "SELECT column_name FROM information_schema.columns WHERE table_name='hr_onboarding_checklists'"` → **faqat** `id, user_id, type, completed_items, total_items, updated_at` — generik "bajarilgan/jami" hisoblagichi; hujjat-turi yoki fayl-havolasi maydonlari yo'q.
- **Nima yetishmaydi:** checklist aniq hujjatlarga havola qilmaydi (`document_type`/`file_url` ustunlari yo'q) → "qaysi hujjat yig'majildda bor" ni kuzatib bo'lmaydi.
- **Bog'liqlik:** EP-LMS-038 (zanjir), EP-LMS-043 (buyruq), EP-LMS-064 (varaqa PDF), EP-LMS-042 (yozma xulosa); `apps/api/src/modules/storage` fayl-biriktirish uchun kengaytiriladi
- **action:** CREATE
- **⤳ Ta'sir:** HR (shaxsiy ish papkasi)
- **Xoch-havolalar:** `[Module-12] Item #67` · `EXTRACTION QISM C §12 #67` · `[Module-12] Item #35`
- **Δ 2026-07-11→08-07:** —

### EP-LMS-068 · Departament/sex bo'yicha o'quv qatlamlash
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** Uch qatlam — "umumiy korxona" + "departament/sex" + "lavozim-karta" kurslari qatlamlanadi (A).
- **Manba:** kitob (7 departament + sex/sektsiya) + Vysotskiy-7 org-model + EP-LMS-055 (umumiy korxona kursi)
- **Dalil (kod):** `courses` jadvalida `department_id`, `org_department_id`, `card_id` — uchta alohida qamrov ustuni real (`information_schema.columns`), ya'ni "umumiy / departament / karta" 3-qatlam modeli uchun xom ustunlar bor. `grep -rln "3.*qatlam|layer.*course" apps/api/src/modules/lms -i` → **0** — bularni avtomatik birlashtiruvchi kod yo'q.
- **Nima yetishmaydi:** "X xodimga qaysi kurslar tegishli" ni umumiy+departament+karta qatlamlarini birlashtirib hal qiluvchi servis mantig'i yo'q — bugun har bir ustunni qo'lda so'rab birlashtirish kerak.
- **Bog'liqlik:** EP-LMS-055 (umumiy qatlam kursi yo'q), EP-LMS-028 (matritsa), EP-LMS-001 (`card_id` 0/5)
- **action:** CREATE
- **⤳ Ta'sir:** Org (departament/sex ierarxiyasi)
- **Xoch-havolalar:** `[Module-12] Item #68` · `EXTRACTION QISM C §12 #68` · `[Module-12] Item #32`
- **Δ 2026-07-11→08-07:** —

### EP-LMS-069 · O'qish eslatmasi kanali — Telegram bot
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** Telegram bot + ilova ichi — asosiy Telegram bot orqali + ilovada belgi (operator ilovani har kuni ochmaydi) (A).
- **Manba:** BARCHA_JAVOBLAR Q197 ("Bot orqali xabar + link") + KARTALAR Q14/Q16 (telegram bot so'rov) + memory (telegram-bots cron mavjud)
- **Dalil (kod):** `apps/api/src/telegram/handlers/lms.handler.ts` to'liq o'qildi (84 qator) — aynan 3 ta **chiquvchi** metod: `onCourseCompleted`, `onCertificateIssued`, `onCertificateExpiringSoon`, har biri `telegramService.sendMessage` chaqiradi. Kiruvchi javob (reply) ishlovi **umuman yo'q**.
- **Nima yetishmaydi:** "muddatingiz yaqinlashdi" / "boshlanmagan majburiy kursingiz bor" kabi proaktiv eslatma metodi yo'q — faqat tugatish/sertifikat xabarnomalari. Ijobiy tomoni: bot konstruksiya bo'yicha holatni o'zgartira olmaydi (vizyonga mos), lekin "o'qidim/keyinroq" tugmalari ham yo'q.
- **Bog'liqlik:** EP-LMS-006/007 (deadline), EP-LMS-019 (muddat), EP-LMS-040 (imtihon eslatmasi)
- **action:** CRON
- **⤳ Ta'sir:** Telegram bot integratsiyasi, Notifications
- **Xoch-havolalar:** `[Module-12] Item #69` · `EXTRACTION QISM C §12 #69` · `[Module-12] Item #26` · `EXTRACTION QISM D #26`
- **Δ 2026-07-11→08-07:** —

### EP-LMS-070 · "Materialni to'liq o'zlashtirish" o'lchovi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** Uch mezon — nazariy test (o'tish bali) + amaliy imtihon (murabbiy) + mavzu-tasdiqlar 100% — uchalasi (A).
- **Manba:** kitob ("материални тўлиқ ўзлаштирилишини таъминлаш" maqsadi) + EP-LMS-034/036/041 (mavzu-tasdiq + amaliy + nazariy)
- **Dalil (kod):** `lms-completion.service.ts` to'liq o'qildi — haqiqiy, unit-test qilinadigan 3-shartli gate (`C1_THEORY_SCORE`, `C2_PRACTICAL_PASSED`, `C3_TOPICS_CONFIRMED`), uchalasi ham shart (`completed = c1Passed && c2Passed && c3Passed`), va payroll-blok yo'liga ulangan. `getCompletionSnapshot` (`drizzle-lms.repo.ts:359-402`): C1 real `lms_test_attempts.score` dan; C2 `enrollments.status='completed'` boolean proksi; C3 `course_progress` sanog'idan (qator bo'lmasa 1 total / 0 done — "halol yopilgan").
- **Nima yetishmaydi:** C2 xom boolean — rubrika ma'lumot-manbai yo'q (EP-LMS-062); C3 maxsus mavzu/varaqa jadvalidan emas, generik `course_progress` dan derive qilinadi (EP-LMS-063); o'tish bali `course_type` yo'qligi sababli dinamik emas (EP-LMS-009).
- **Bog'liqlik:** EP-LMS-062 (rubrika), EP-LMS-063/064 (varaqa obyekti), EP-LMS-009 (`course_type`), EP-LMS-002 (oylik-gate iste'molchisi)
- **action:** READ
- **⤳ Ta'sir:** LMS tugatish logikasi, Payroll (oylik-gate manbasi)
- **Xoch-havolalar:** `[Module-12] Item #70` · `EXTRACTION QISM C §12 #70` · `[Module-12] Item #62` · `[Module-12] Item #63`
- **Δ 2026-07-11→08-07:** —

### EP-LMS-071 · O'quv tarixi arxivi (xodim ketsa ham, karta varaqasi qoladi)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** Ha — o'quv tarixi xodim profilida doimiy arxiv + nazorat varaqasi karta tarkibida qoladi (voris o'sha varaqani oladi) (A).
- **Manba:** KARTALAR Q28 ("darslik kartaga") + ERP-SIFAT (7 yil retention, audit-log) + EP-LMS-001/063
- **Dalil (kod):** `enrollments` ustunlari (`information_schema.columns`): `id, employee_id, course_id, enrolled_at, started_at, completed_at, progress_percent, last_accessed_at, status, current_module_id, current_lesson_id, created_at, updated_at, user_id, score, certificate_expires_at, card_id, auto_enrolled` — `deleted_at` ustuni **YO'Q**. `employee_id` non-null FK, `card_id` nullable → yozuv karta yo'qolsa ham xodimga bog'lanib qoladi; hech narsa cascade-delete qilmaydi. FE tomonda `employee-profile/RemainingTabsLearningExtras.tsx` real; `drizzle-lms-misc.repo.ts:165-171 findProgressByUser` real.
- **Nima yetishmaydi:** `enrollments` da soft-delete/retention markeri yo'q; 7-yillik saqlash ishi (job) topilmadi; karta arxivlanganda progressni `suspended` ga o'tkazuvchi listener yo'q (`grep "CardArchived|suspend.*progress"` LMS → **0**); RBAC bilan qo'riqlangan "profil o'quv tarixi" endpointi alohida ajratilmagan.
- **Bog'liqlik:** EP-LMS-001 (darslik kartaga), EP-LMS-063 (varaqa), EP-LMS-023 (status katalogi)
- **action:** CREATE
- **⤳ Ta'sir:** Org-karta ("darslik kartaga" vizyoni), HR (arxiv)
- **Xoch-havolalar:** `[Module-12] Item #71` · `EXTRACTION QISM C §12 #71` · `[Module-12] Item #49` · `[Module-12] Item #9` · `[Module-12] Item #2` · `EXTRACTION QISM D #2/#9/#49`
- **Δ 2026-07-11→08-07:** —

### EP-LMS-072 · Davriy qayta-tasdiq (yo'riqnoma o'zgarmasa ham)
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** Ha — yiliga bir marta lavozim varaqasini qayta tasdiqlash (qisqartirilgan test bilan) (A); aniq davr (yil/chorak) egasi sozlovi.
- **Manba:** ERP-SIFAT (davriy nazorat) + EP-LMS-019 (qayta-sertifikatlash); aniq davriylik egasi tomonidan belgilanmagan
- **Dalil (kod):** `enrollments.certificate_expires_at` real; `lms-certificates-standalone.controller.ts:49-54` `GET expiring` real query. Yagona kunlik muddat-sweep cron mavjud (`cert-expiry.handler.ts`, `@Cron(EVERY_DAY_AT_MIDNIGHT)`) — kontent o'zgarmasa ham ishlaydigan alohida "yillik qayta-tasdiq" cron'i topilmadi. `grep -rn "qisqartirilgan|shortened.*test|randomize" apps/api/src/modules/lms -i` → faqat eski `tests.randomizeQuestions` boolean (`lib/db/src/schema/lms-schema.ts:134`, oddiy aralashtirish bayrog'i), 30-50% AI-tanlov emas.
- **Nima yetishmaydi:** "kontent o'zgarmasa ham yiliga bir marta qayta tasdiqla" cron'i yo'q — faqat muddat-asosli blok bor; "qisqartirilgan test" (30-50% savol) selektori yo'q; davr va foiz = egasi-master-data.
- **Bog'liqlik:** EP-LMS-019 (muddat), EP-LMS-065 (versiya-diff — boshqa yo'l), EP-LMS-009 (o'tish bali)
- **action:** CRON
- **⤳ Ta'sir:** Notifications, HR
- **Xoch-havolalar:** `[Module-12] Item #72` · `EXTRACTION QISM C §12 #72` · `[Module-12] Item #44` · `[Module-12] Item #19`
- **Δ 2026-07-11→08-07:** —

### EP-LMS-073 · Tashkiliy siyosat (ОРГПОЛИТИКА) hujjatlari ham testga bog'lanadimi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** Ha — tashkiliy siyosat hujjatlari "umumiy reglament" sifatida tegishli xodimlarga o'qish + tasdiq sifatida tushadi (A).
- **Manba:** kitob (ОРГПОЛИТИКА / ТАШКИЛИЙ СИЁСАТ hujjatlari mavjud) + SHvB YO'NALISH 28 (reglament testlari) + EP-LMS-005
- **Dalil (kod):** `node _audit/q.cjs "SELECT count(*) FROM lms_tests"` → **0 qator**; `grep -rln "ОРГПОЛИТИКА|siyosat.*test" apps/api/src/modules/lms -i` → **0**. Siyosat→reglament-test bog'lanishi yo'q va reglament-test jadvallarining o'zi bo'sh.
- **Nima yetishmaydi:** —
- **Bog'liqlik:** EP-LMS-005 (test banki bo'sh), EP-LMS-028 (matritsa); ⚠️ tashkiliy siyosat **hujjatlarining o'zi** egasi tomonidan yozilishi/yuklanishi shart
- **action:** EVENT
- **⤳ Ta'sir:** Hujjat boshqaruvi, HR
- **Xoch-havolalar:** `[Module-12] Item #73` · `EXTRACTION QISM C §12 #73`
- **Δ 2026-07-11→08-07:** —

### EP-LMS-074 · Tijorat siri / maxfiylik moduli majburiy
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** Ha — "tijorat siri va maxfiylik" majburiy modul + yozma tasdiq (NDA o'rnida iz qoladi) (A).
- **Manba:** kitob ("Корхона тижорат сирларини ошкор этганлик учун ... жиноят кодексига кўра жавобгар" + dizayn-fayllar himoyasi vazifasi) + ERP-SIFAT 5 (data shifrlangan/RBAC)
- **Dalil (kod):** `SELECT id,code,title FROM courses` → 5 seed kursning hech biri maxfiylik/NDA haqida emas (`LMS-OHS-01`, `LMS-ERP-01`, `LMS-PRINT-01`, `LMS-QC-01`, `LMS-LEAD-01`). `grep -rln "maxfiylik|NDA" apps/api/src/modules/lms -i` → **0**.
- **Nima yetishmaydi:** —
- **Bog'liqlik:** EP-LMS-026 (`is_mandatory` naqshi tayyor), EP-LMS-031 (yozma tasdiq izi); ⚠️ NDA huquqiy matni = egasi/yurist artefakti
- **action:** CREATE
- **⤳ Ta'sir:** HR (huquqiy himoya), Xavfsizlik/Security
- **Xoch-havolalar:** `[Module-12] Item #74` · `EXTRACTION QISM C §12 #74`
- **Δ 2026-07-11→08-07:** —

### EP-LMS-075 · Tashqi malaka/sertifikatni ichki kurs o'rniga hisoblash
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** Ha — tashqi sertifikat/diplom yuklanadi + HR tasdiqlaydi → tegishli ichki kurs/malaka-talab "qondirilgan" hisoblanadi (TX/xavfsizlikdan istisno yo'q) (A).
- **Manba:** BARCHA_JAVOBLAR Q176 (tashqi ta'lim: Ariza+Shartnoma+Natija) + Q177 (tugatgach hammasi) + kitob (malaka talablari "o'rta-maxsus/oliy")
- **Dalil (kod):** `grep -rln "external.*cert|tashqi.*sertifikat|externalCert" apps/api/src/modules/lms` → **0**. `lms_cross_card_credits` (VR-LMS-I01) faqat **ichki kurs → ichki karta** kreditlari uchun, tashqi import mexanizmi emas.
- **Nima yetishmaydi:** —
- **Bog'liqlik:** VR-LMS-I01 (cross-karta kredit — yaqin, lekin boshqa mexanizm), EP-LMS-049 (malaka talablari), EP-LMS-018 (sertifikat)
- **action:** APPROVE
- **⤳ Ta'sir:** HR (malaka tarixi), Razryad
- **Xoch-havolalar:** `[Module-12] Item #75` · `EXTRACTION QISM C §12 #75` · `[Module-12] Item #16` · `EXTRACTION QISM D #16`
- **Δ 2026-07-11→08-07:** —
- **⚠️ ZIDDIYAT (vizyon ichida):** `decisions/12-lms.md` EP-LMS-075 da "TX/xavfsizlikdan **istisno yo'q**" (ya'ni tashqi sertifikat TX uchun ham qabul qilinadi) deyilgan, `vision-1000-answers #16` esa aksincha — "ISTISNO: TX/xavfsizlik darsliklari **faqat ichki test** bilan qayta sertifikatlanadi (xavfsizlik talabi)". Ikki manba bir-biriga zid; qurilishdan oldin egasi tanlashi kerak.

### EP-LMS-076 · Replication testi — rahbar dars yaratadi, xodimlar o'qiydi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** Ha — LMS ichida modul sifatida: rahbar o'z yutuqlarini/metodologiyasini dars qilib yaratadi, jamoa o'qiydi (Replication metodologiyasi) (A).
- **Manba:** BARCHA_JAVOBLAR Q149 ("Replication testi → LMS ichida modul: rahbar dars yaratadi, xodimlar o'qiydi") — *EP-LMS-012 oqimidan farqli: bu rahbar-muallif kanali*
- **Dalil (kod):** `courses.author_id` ustuni real; `POST /lms/courses` (`lms-courses.controller.ts:101-103`) real, `@Roles('TRAINING_OFFICER', 'HR_MANAGER', 'DIRECTOR', 'SUPER_ADMIN')` — rahbar-darajali rol bugun kurs muallifi bo'la oladi. `grep -rln "replication" apps/api/src/modules/lms -i` → hujjat havolalaridan tashqari **0**.
- **Nima yetishmaydi:** rahbar-yaratgan metodika kurslarini standart katalogdan ajratuvchi alohida "Replication" kategoriyasi/UI kanali yo'q.
- **Bog'liqlik:** EP-LMS-012 (asosiy tasdiq zanjiri), EP-LMS-048 (muvaffaqiyatli harakatlar blankasi — yaqin g'oya)
- **action:** CREATE
- **⤳ Ta'sir:** Coordination (rahbar muallif), LMS kontent
- **Xoch-havolalar:** `[Module-12] Item #76` · `EXTRACTION QISM C §12 #76` · `[Module-12] Item #24`
- **Δ 2026-07-11→08-07:** —

### EP-LMS-077 · Leadership / Origin liderlik testi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** Ha — "liderlik salohiyati" baholash testi: yillik + zaxira (vorislik) + lavozim o'zgarishi holatlarida (A).
- **Manba:** BARCHA_JAVOBLAR Q148 ("liderlik salohiyati testi = Hammasi: yillik + zaxira + lavozim o'zgarish"; Origin Liderlik testi)
- **Dalil (kod):** `node _audit/q.cjs "SELECT id,code,title FROM courses ORDER BY id"` → id=7 `LMS-LEAD-01` "Jamoa boshqaruvi va rahbarlik" seed qilingan va mavjud. `grep -in "leadership" -r apps/api/src` → 4 hit, hech biri hodisa/track-tayinlash mexanizmi emas (bittasi `org-structure/question-bank.controller.ts:25` dagi bog'lanmagan `QUESTION_CATEGORIES` enum qiymati). `grep -rln "LeadershipTrackAssigned"` → **0**.
- **Nima yetishmaydi:** `LeadershipTrackAssigned` hodisasi yo'q, L3+ tasdiq gate'i yo'q, vorislik/zaxira-rahbar rejasi bilan bog'lanish yo'q, yillik davriylik yo'q — mavjud narsa faqat katalogdagi bitta mavzuli kurs.
- **Bog'liqlik:** ⚠️ HR vorislik (succession) ma'lumot-modeli bu o'tishda topilmadi; EP-LMS-057 (murabbiy malakasi — yaqin naqsh)
- **action:** CREATE
- **⤳ Ta'sir:** HR (vorislik/zaxira), Org-karta (rahbar kartalari), AI
- **Xoch-havolalar:** `[Module-12] Item #77` · `EXTRACTION QISM C §12 #77` · `[Module-12] Item #17` · `EXTRACTION QISM D #17`
- **Δ 2026-07-11→08-07:** —
- **⚠️ ZIDDIYAT:** `EXTRACTION QISM C §12 #77` "grep leadership/origin = 0 (faqat izohda); modul qurilmagan" → **Yo'q**. FULL-ITEM-LEVEL Item #77 esa jonli bazada `LMS-LEAD-01` (id=7) kursini topib **Qisman** ga ko'taradi. Kod/DB dalili kuchliroq → **Qisman**.

### EP-LMS-078 · "Ishdagi vaziyat" interaktiv simulyatsiya rejimi
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** Ha — vaziyat-mashqlar interaktiv (qaror tanla → oqibatni ko'r → izoh); operator xavfsiz muhitda xato qilib o'rganadi (A); to'liq simulyatsiya ko'lami egasi prioriteti.
- **Manba:** kitob ("Ишдаги вазият: ..." mashqlar) + ERP-SIFAT 30/70 (AI/tahlil); interaktiv simulyatsiya ko'lami egasi tomonidan aniq belgilanmagan
- **Dalil (kod):** `grep -rln "simulyats|simulation" apps/api/src/modules/lms` → **0**. Ustiga quriladigan bironta bazaviy CRUD ham yo'q — ssenariy→qaror→oqibat dvigateli noldan qurilishi kerak.
- **Nima yetishmaydi:** —
- **Bog'liqlik:** ⚠️ AI-kalit ("xavfli qaror" bahosi uchun) + ⚠️ simulyatsiya **ko'lami** = egasi-prioriteti; EP-LMS-035 (vaziyat-savol — sodda versiyasi)
- **action:** CREATE
- **⤳ Ta'sir:** AI (oqibat modellashtirish), LMS
- **Xoch-havolalar:** `[Module-12] Item #78` · `EXTRACTION QISM C §12 #78` · `[Module-12] Item #18` · `EXTRACTION QISM D #18`
- **Δ 2026-07-11→08-07:** —

### EP-LMS-079 · Imtihon savollarini kim tuzadi va tasdiqlaydi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** O'quv bo'limi tuzadi (AI yordamida) → rahbar/HR tasdiq (A).
- **Manba:** KARTALAR Q29 (o'quv bo'limi→AI→HR+rahbar) + kitob (НО-14 o'quv bo'limi) + EP-LMS-012
- **Dalil (kod):** `lms-tests.controller.ts:80-105` `LmsQuestionsController` to'liq o'qildi — real CRUD, `createQuestion` `@Roles('TRAINING_OFFICER', 'HR_MANAGER', 'SUPER_ADMIN', 'DIRECTOR')` bilan cheklangan. `SELECT DISTINCT role FROM users` → **`TRAINING_OFFICER` rolida 0 foydalanuvchi**. `grep -rln "safety_risk|xavfli" apps/api/src/modules/lms` → **0**.
- **Nima yetishmaydi:** alohida "AI-loyiha → odam tasdig'i" ikki qadamli oqim yo'q — yaratish bevosita bir qadamli yozuv (kurslardagi `submit`/`approve` dan farqli, savollarda alohida tasdiq harakati yo'q); rahbar-tavsiya (draft) holati yo'q; savol o'zgarganda eski natijalarni saqlash uchun versiya-tegi yo'q; "xavfli savol" bayrog'i yo'q.
- **Bog'liqlik:** EP-LMS-012 (kurs tasdiq zanjiri), EP-LMS-056 (`TRAINING_OFFICER` = 0 foydalanuvchi), EP-LMS-080 (AI drafting); ⚠️ semantik "xavfli savol" tekshiruvi = AI-kalit
- **action:** APPROVE
- **⤳ Ta'sir:** AI (yo'riqnomadan test generatsiya), Coordination
- **Xoch-havolalar:** `[Module-12] Item #79` · `EXTRACTION QISM C §12 #79` · `[Module-12] Item #36` · `[Module-12] Item #8`
- **Δ 2026-07-11→08-07:** —

### EP-LMS-080 · AI yo'riqnomadan avto test + glossariy + micro-modul generatsiyasi
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** Ha — AI yo'riqnomadan test/glossariy/micro-modul loyihasini chiqaradi, odam tasdiqlaydi (drafting) (A).
- **Manba:** BARCHA_JAVOBLAR Q75 ("erp tizimini shu asosda qurish" — yo'riqnoma matni tayyor) + ERP-SIFAT 30/70 + KARTALAR Q29/Q30 (AI)
- **Dalil (kod):** `agents/lms-agent.service.ts` to'liq o'qildi (55 qator — hujjatning o'zi "lms-agent.service.ts bor" deb iqtibos keltirgan fayl) — u aynan ikki ish qiladi: progress-sanoq query va sertifikat-muddati cron'i; **hech qanday kontent-drafting mantig'i yo'q** (test generatsiyasi yo'q, micro-modul generatsiyasi yo'q). `grep -in "glossar" -r apps/api/src` → **0** — glossariy nishoni ham mavjud emas.
- **Nima yetishmaydi:** —
- **Bog'liqlik:** ⚠️ AI-kalit (egasi-data); EP-LMS-037 (glossariy jadvali yo'q), EP-LMS-010 (micro-modul), EP-LMS-079 (tasdiq bosqichi)
- **action:** AI
- **⤳ Ta'sir:** AI Integratsiya moduli, O'quv bo'limi
- **Xoch-havolalar:** `[Module-12] Item #80` · `EXTRACTION QISM C §12 #80` · `[Module-12] Item #43` · `[Module-12] Item #45`
- **Δ 2026-07-11→08-07:** —
- **⚠️ ZIDDIYAT:** `EXTRACTION QISM C §12 #80` "lms-agent.service.ts bor" degan asosda **Qisman** deydi. FULL-ITEM-LEVEL Item #80 o'sha faylni to'liq o'qib "drafting mantig'i umuman yo'q" deb **Yo'q** ga tushiradi. Kod-dalili kuchliroq → **Yo'q**.

### EP-LMS-081 · O'qish davomida savol berish (murabbiy/AI'ga)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** Ha — har mavzuda "savol berish" tugmasi: AI birlamchi javob, murabbiy/rahbarga eskalatsiya (A).
- **Manba:** kitob (glossariy + murabbiy mas'ul) + EP-LMS-014 (AI chatbot) + ERP-SIFAT 7 (avtomatlashtirish)
- **Dalil (kod):** `lms-core.controller.ts:163-184` `createSupportTicket` (`POST support/tickets`) — real `db.insert(lms_support_tickets).values(...)`; jadval mavjud (`q.cjs`, hozir **0 qator**). Xuddi shu metodda AI-birlamchi-javob yoki eskalatsiya mantig'i yo'q — bu oddiy insert, keyingi avtomatik qadamsiz.
- **Nima yetishmaydi:** AI avto-javobi yo'q; odam-murabbiyga eskalatsiya yo'li qurilmagan — yaratilgan tiketning avtomatik keyingi qadami yo'q.
- **Bog'liqlik:** ⚠️ AI-kalit (javob qismi); EP-LMS-014 (chatbot), EP-LMS-037 (glossariy), EP-LMS-059 (murabbiy paneli)
- **action:** AI
- **⤳ Ta'sir:** AI chatbot, Mentorlik, Coordination
- **Xoch-havolalar:** `[Module-12] Item #81` · `EXTRACTION QISM C §12 #81` · `[Module-12] Item #45` · `[Module-12] Item #43`
- **Δ 2026-07-11→08-07:** —

### EP-LMS-082 · Imtihon natijasi murabbiy reytingiga ta'siri
- **Qaror holati:** 🔵 OCHIQ
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** Ijobiy bog'lash — shogird muvaffaqiyati murabbiy reytingi/bonusiga qo'shiladi (salbiy jazo yo'q, demotivatsiya bo'lmasin) (A); aniq vazn HR sozlovi.
- **Manba:** kitob (murabbiy mas'ul) + karta-model (KPI/bonus); murabbiy-reyting bog'lanishi egasi tomonidan aniq belgilanmagan
- **Dalil (kod):** `lms-misc.controller.ts:276-296` `RateCardMentorSchema`/`rateCardMentor` — `rating` **qo'lda** kiritiladigan 0..5 qiymat (`PATCH cards/:id/rating`); `EXAM_PASSED_EVENT`/`exam-passed-razryad.listener.ts` dan murabbiy-reytingini yangilashga hech qanday avtomatik ulanish topilmadi.
- **Nima yetishmaydi:** —
- **Bog'liqlik:** EP-LMS-015 (imtihon hodisasi — endi jonli, `52eb84cb`), EP-LMS-057 (murabbiy malakasi); ⚠️ vazn-formulasi = egasi-master-data
- **action:** UPDATE
- **⤳ Ta'sir:** HR (murabbiy KPI), Payroll
- **Xoch-havolalar:** `[Module-12] Item #82` · `EXTRACTION QISM C §12 #82` · `[Module-12] Item #50`
- **Δ 2026-07-11→08-07:** `52eb84cb` bilvosita — reytingni yangilash uchun kerak bo'ladigan `lms.exam.passed` hodisasi endi jonli yo'lda chiqadi (bog'lovchi listener hamon yo'q).

### EP-LMS-083 · Kursga namuna fayl/rasm ilova qilish (texkarta, maket, podpisnoy)
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** Ha — har mavzuga namuna fayl/rasm ilova (to'g'ri va noto'g'ri misol) (A).
- **Manba:** kitob (texkarta, podpisnoy list, maket atamalari + glossariy) + BARCHA_JAVOBLAR Q32 (papka: hujjatlar/video)
- **Dalil (kod):** `courses.thumbnail` / `thumbnail_url` / `cover_url` ustunlari real (`information_schema.columns`); `apps/api/src/modules/storage` katalogi mavjud (`find apps/api/src -iname "*storage*" -maxdepth 3 -type d`) — umumiy fayl-saqlash infratuzilmasi bor.
- **Nima yetishmaydi:** mavzu-darajasida (har mavzu uchun) "to'g'ri misol / noto'g'ri misol" biriktirish strukturasi yo'q — mavjud maydonlar bitta, butun kursga tegishli rasm.
- **Bog'liqlik:** EP-LMS-033/051/063/064 (birinchi-darajali mavzu entitesi yo'q), EP-LMS-025 (karta papkasi)
- **action:** CREATE
- **⤳ Ta'sir:** Storage (fayl/rasm), Org-karta (papka)
- **Xoch-havolalar:** `[Module-12] Item #83` · `EXTRACTION QISM C §12 #83` · `[Module-12] Item #51`
- **Δ 2026-07-11→08-07:** —

### EP-LMS-084 · Ko'p kartali xodim o'quvi navbati
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** Har karta alohida — birlamchi karta o'quvi birinchi (oylik unga bog'liq), qolganlar navbat bilan (A).
- **Manba:** KARTALAR Q4 ("1 xodim ko'p karta = A; oylik=kartalar yig'indisi") + Q2 (1 seat=1 oylik) + EP-LMS-002 (oylik-gate)
- **Dalil (kod):** `LmsCardGateService` to'liq o'qildi — `isCardTrainingComplete(cardId, employeeId)` qat'iy bitta karta bo'yicha baholanadi; `payroll.service.ts:454-461` uni gate siklida har karta uchun chaqiradi. `grep -rln "primaryCard.*first|birlamchi.*karta.*navbat" apps/api/src/modules/lms -i` → **0**.
- **Nima yetishmaydi:** xodimning bir nechta kartasini tartiblovchi mantiq yo'q — "birlamchi" karta o'quvi ikkilamchidan **oldin** talab qilinmaydi; hamma karta mustaqil va parallel gate qilinadi.
- **Bog'liqlik:** EP-LMS-001/002 (bir xil gate), EP-LMS-048 (ustuvorlik navbati — yaqin mavzu), VR-LMS-I01 (cross-karta kredit)
- **action:** CREATE
- **⤳ Ta'sir:** Org-karta (ko'p karta-xodim), Payroll
- **Xoch-havolalar:** `[Module-12] Item #84` · `EXTRACTION QISM C §12 #84` · `[Module-12] Item #1`
- **Δ 2026-07-11→08-07:** —

### EP-LMS-085 · O'qish qaysi qurilmada — sex tableti (POS Monitor) / telefon
- **Qaror holati:** ✅ JAVOBLANGAN
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** Ha — telefon + sex tableti (POS Monitor)da o'qish; smena oralig'ida qisqa modul (operator kompyuter oldida o'tirmaydi) (A).
- **Manba:** KARTALAR Q16 (mashinasiz operator → AI-chatbot/mobil) + memory (POS Monitor = sex tablet) + EP-LMS-010 (micro-modul)
- **Dalil (kod):** `find artifacts/erp-dashboard/src/pos-monitor -type f` → ~29 fayl (api/, components/, hooks/, pages/, layout/, lib/); `grep -rlin "micro" artifacts/erp-dashboard/src/pos-monitor` va `grep -rln "micro-module|lms|video-progress|Darslik" artifacts/erp-dashboard/src/pos-monitor` — ikkalasi ham **0 moslik**. POS Monitor modulining hech qayerida LMS/micro-modul/video-progress/darslik havolasi yo'q.
- **Nima yetishmaydi:** —
- **Bog'liqlik:** EP-LMS-010 (micro-modullar BE endpointlari real va tayyor), EP-LMS-024 (video-progress real); ⚠️ bu sof FE-integratsiya bo'shlig'i, ma'lumot/qaror blokirovkasi emas. Offline o'qish (VR-LMS-I03) alohida.
- **action:** READ
- **⤳ Ta'sir:** POS Monitor (sex tableti = o'quv ekrani ham), Mobile
- **Xoch-havolalar:** `[Module-12] Item #85` · `EXTRACTION QISM C §12 #85` · `[Module-12] Item #34`
- **Δ 2026-07-11→08-07:** —
- **⚠️ ZIDDIYAT:** `EXTRACTION QISM C §12 #85` "POS Monitor + micro-modul/video-progress (mobil-mos); POS-ekran LMS integratsiya qisman" → **Qisman**. FULL-ITEM-LEVEL Item #85 butun `pos-monitor` katalogini grep qilib **0 moslik** topgan va STALE-DOC deb belgilab **Yo'q** ga tuzatgan. Registrda tuzatilgan qiymat.

---

## II QISM — EP-kodsiz vizyon-talablar (VR-LMS-I01..I07)

> Bu bandlar `vision-1000-answers/12-lms.md` (= `FULL-ITEM-LEVEL Item #1..#50`) ichida **yangi** talab sifatida paydo bo'lgan, lekin `decisions/12-lms.md` ning 85 EP-savolidan birortasi bilan to'liq qoplanmaydi. Qolgan 43 ta javob mos EP-bandiga `(taxminiy)` xoch-havola sifatida biriktirildi.

### VR-LMS-I01 · Universal kurs uchun cross-karta kredit (`lms_cross_card_credits`)
- **Qaror holati:** ✅ JAVOBLANGAN *(vision-1000-answers #12)*
- **Qurilish holati:** Ha *(2026-07-11)*
- **Talab:** Universal kurslar (masalan TX instruktaj) cross-karta kredit tizimi bilan ishlaydi: xodim bir kartada o'qib tugatsa, boshqa kartaga ham "bajarildi" hisoblanadi — SHART: kurs bir xil versiyada bo'lishi (versiya farq bo'lsa qayta topshiriladi); kredit `lms_cross_card_credits` jadvalda qayd qilinadi.
- **Manba:** vision-1000-answers/12-lms.md #12
- **Dalil (kod):** `node _audit/q.cjs "SELECT count(*) FROM lms_cross_card_credits"` → jadval **mavjud** (0 qator). O'qish tomoni: `drizzle-lms.repo.ts:404-420 hasCrossCardCredit` real SELECT, `LmsCardGateService.evaluateCourse` dan ishlatiladi. Yozish tomoni: `infrastructure/event-handlers/course-completed-credit.handler.ts` — real `@OnEvent('lms.course.completed')`, `INSERT INTO lms_cross_card_credits ... ON CONFLICT DO NOTHING` (idempotent). Ikkala tomon ham real, simlangan kod.
- **Nima yetishmaydi:** —
- **Bog'liqlik:** `courses.is_universal` = egasi-data (5 seed kursning hech birida yoqilmagan) → mexanizm qurilgan, ma'lumot yo'q. Versiya-sharti (EP-LMS-065) `courses.version` yo'qligi sababli tekshirilmaydi.
- **action:** CREATE
- **⤳ Ta'sir:** Org-karta (ko'p karta), Payroll (oylik-gate), EP-LMS-084
- **Xoch-havolalar:** `[Module-12] Item #12` · `EXTRACTION QISM A #12`
- **Δ 2026-07-11→08-07:** —
- **⚠️ ZIDDIYAT:** `EXTRACTION QISM A #12` va Step-3 ochiq savoli "SB0145 STILL-OPEN: Cross-card credit logic **MAVJUD EMAS**" deydi. FULL-ITEM-LEVEL Item #12 buni STALE-DOC deb belgilab jadval + o'qish + yozish yo'llarining hammasi real ekanini ko'rsatadi. Kod-dalili kuchliroq → **Ha**.

### VR-LMS-I02 · Immutable yuridik audit-log (IP + qurilma + click-hash + PDF eksport)
- **Qaror holati:** ✅ JAVOBLANGAN *(vision-1000-answers #23 + #30)*
- **Qurilish holati:** Qisman *(2026-08-07 Δ)*
- **Talab:** Immutable audit-log saqlaydi: vaqt (timestamp) + IP manzil + qurilma identifikatori (user-agent) + xodim ID + tasdiq harakati (click event hash); bu ma'lumot PDF formatida yuridik eksport qilinishi mumkin (F5 printsipi). Yuridik minimal: to'liq ism, lavozim, tashkilot nomi, mavzu-mavzu tasdiq sanasi+vaqti, IP manzil, raqamli imzo hashi (SHA-256) — PDF generatsiyada o'chirib bo'lmaydigan qatlam sifatida.
- **Manba:** vision-1000-answers/12-lms.md #23 + #30
- **Dalil (kod):** Har bir LMS kontrolleri `@UseInterceptors(AuditInterceptor)` bilan qoplangan (`lms-certificates.controller.ts`, `card-required-knowledge.controller.ts`, `lms-misc.controller.ts`, `lms-certificates-standalone.controller.ts`; `audit.interceptor.ts:55,114` qator-persist) — generik audit real va keng qo'llangan. **Δ:** `6d5a40b1` — `drizzle-lms-cert.repo.ts:59-66` endi `createHash('sha256')` bilan `cert_hash` hisoblab, `issued_ip` bilan birga `INSERT INTO certificates (... issued_ip, cert_hash)` qiladi (ikkinchi yozish yo'li: `drizzle-lms-courses-extended.repo.ts:124`); migratsiya `lms-certificate-legal-fields-2026-07-11.sql` (Q-35 tasdiqlangan). **Δ:** `06f77edc` — `lms-certificate-pdf.service.ts` bu maydonlarni PDF'ga chizadi (`issuedIp` 131-qator, QR `certHash` 99-101). **Δ:** `63c93b87` — `docctl` ko'rish/chop-etish jurnali `lms-certificate` ga yoyildi.
- **Nima yetishmaydi:** `click_hash` / qurilma-barmoq izi (user-agent) qatlami hamon yo'q (`grep -rln "click_hash|clickHash" apps/api/src/modules/lms` → 0); audit **izining o'zini** PDF qilib eksport qilish yo'q (PDF faqat sertifikat uchun); mavzu-mavzu tasdiq sanasi immutable qatlamga yozilmaydi (mavzu jadvali yo'q — EP-LMS-063).
- **Bog'liqlik:** EP-LMS-018/064 (sertifikat PDF — bajarildi), EP-LMS-031 (varaqa raqamli tasdig'i), EP-LMS-063
- **action:** CREATE
- **⤳ Ta'sir:** HR (yuridik himoya), CC/Hujjat (arxiv), Security
- **Xoch-havolalar:** `[Module-12] Item #23` · `[Module-12] Item #30` · `EXTRACTION QISM D #23` · `EXTRACTION QISM A #23/#30`
- **Δ 2026-07-11→08-07:** `6d5a40b1` (issued_ip + SHA-256 cert_hash), `06f77edc` (PDF'da ko'rsatish), `63c93b87` (ko'rish/chop-etish jurnali). 2026-07-11 da "SHA-256 yo'q, PDF kutubxonasi yo'q" edi → endi **ikkalasi ham bor**; click-hash/qurilma qatlami qoldi.

### VR-LMS-I03 · Smena tabletida offline o'qish + idempotent sinxronizatsiya
- **Qaror holati:** ✅ JAVOBLANGAN *(vision-1000-answers #34)*
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** Smena tabletida internet uzilsa OFFLINE rejimda o'qish davom etadi (micro-modul lokal keshda); progress lokal saqlanadi; internet tiklanganda BullMQ queue orqali sinxronizatsiya (idempotent — takroriy yuklash xavfsiz, `sync_id` bilan deduplikatsiya).
- **Manba:** vision-1000-answers/12-lms.md #34
- **Dalil (kod):** `grep -rln "offline" apps/api/src/modules/lms` → **0**; `grep -rln "sync_id" ...` → **0**; `grep -rln "BullMQ|Bull" ...` → **0**. Uchala tekshiruv ham bo'sh.
- **Nima yetishmaydi:** —
- **Bog'liqlik:** EP-LMS-085 (POS Monitor integratsiyasi — avval kerak), EP-LMS-010 (micro-modul BE tayyor)
- **action:** CREATE
- **⤳ Ta'sir:** POS Monitor (sex tableti), Infra (BullMQ navbati)
- **Xoch-havolalar:** `[Module-12] Item #34` · `EXTRACTION QISM A #34`
- **Δ 2026-07-11→08-07:** —

### VR-LMS-I04 · Progress yozuvida poyga-xavfsizligi (PK + optimistic lock + event-driven agregat)
- **Qaror holati:** ✅ JAVOBLANGAN *(vision-1000-answers #37)*
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** Race condition xavfi yo'q: har xodim progress yozuvi alohida (`lms_progress.user_id + card_id` PK); "muvaffaqiyatli harakatlar" ro'yxati optimistic locking + DB-level upsert bilan yangilanadi; BullMQ queue orqali kurs-darajasidagi statistika event-driven hisoblanadi (real-time aggregate yo'q — eventual consistency).
- **Manba:** vision-1000-answers/12-lms.md #37
- **Dalil (kod):** `drizzle-lms.repo.ts:258-274 autoEnroll` — real `INSERT ... ON CONFLICT (employee_id, course_id) DO UPDATE ...` (idempotent upsert, `uq_enrollments_emp_course` unikal cheklovi fayl sarlavha-izohida keltirilgan). `enrollments.card_id` ustuni real (SB0115). `drizzle-lms-misc.repo.ts:46-47` izohi `saveVideoProgress` uchun unikal indeks **yo'qligini** va qo'lda upsert ekanini tan oladi.
- **Nima yetishmaydi:** konflikt kaliti `(employee_id, course_id)` — vizyonda aytilgan `(user_id, card_id)` emas; `enrollments` da optimistic-lock versiya ustuni yo'q; `video_progress` da unikal indeks yo'q; BullMQ orqali event-driven agregat yo'q (BullMQ LMS'da umuman ishlatilmaydi).
- **Bog'liqlik:** EP-LMS-034 (mavzu-tasdiq), VR-LMS-I03 (BullMQ bir xil yetishmovchilik)
- **action:** UPDATE
- **⤳ Ta'sir:** Infra (DB yaxlitligi), LMS progress
- **Xoch-havolalar:** `[Module-12] Item #37` · `EXTRACTION QISM D #37` · `EXTRACTION QISM A #37`
- **Δ 2026-07-11→08-07:** —

### VR-LMS-I05 · O'quv tarixini 7 yil saqlash + RBAC bilan ko'rish
- **Qaror holati:** ✅ JAVOBLANGAN *(vision-1000-answers #49 + #9)*
- **Qurilish holati:** Qisman *(2026-07-11)*
- **Talab:** O'quv tarixi karta mavjud bo'lmasa ham XODIM PROFILIGA biriktirilgan holda arxivlanadi (xodim.id asosiy kalit, karta.id ikkilamchi); 7 yil saqlash (F3 + A6); ko'ra oladiganlar: HR administrator, direktor, audit (RBAC); xodimning o'zi ham o'z tarixini ko'ra oladi. Xodim iste'foga ketganda nazorat varaqasi + amaliy imtihon natijalari profilga arxivlanadi (soft-delete), qayta kelganda progress tiklanadi.
- **Manba:** vision-1000-answers/12-lms.md #49 + #9
- **Dalil (kod):** `enrollments.employee_id` real non-null FK, `card_id` nullable → karta yo'qolsa ham yozuv xodimga bog'lanib qoladi; `drizzle-lms-misc.repo.ts:165-171 findProgressByUser` (`employee_id` bo'yicha) real; FE `employee-profile/RemainingTabsLearningExtras.tsx` real. `enrollments` da `deleted_at` ustuni **YO'Q** (to'liq ustun ro'yxati tekshirildi); `grep -rln "rehire|restore.*enroll" apps/api/src/modules/lms apps/api/src/modules/hr` → **0**; `grep -rln "7.*yil.*arxiv|learning.*history" apps/api/src/modules/lms` → **0**.
- **Nima yetishmaydi:** 7-yillik saqlash ishi (job) yo'q; `enrollments` da soft-delete markeri yo'q; iste'fo→arxiv va qayta-kelish→tiklash listener'lari yo'q; RBAC bilan qo'riqlangan alohida "profil o'quv tarixi" endpointi yo'q.
- **Bog'liqlik:** EP-LMS-071 (arxiv vizyoni), EP-LMS-023 (status), VR-LMS-I06 (karta arxivlanishi)
- **action:** CREATE
- **⤳ Ta'sir:** HR (arxiv), Audit/Compliance, Org-karta
- **Xoch-havolalar:** `[Module-12] Item #49` · `[Module-12] Item #9` · `EXTRACTION QISM D #9/#49`
- **Δ 2026-07-11→08-07:** —

### VR-LMS-I06 · Karta arxivlanganda progressni muzlatish (`CardArchived` → `suspended`)
- **Qaror holati:** ✅ JAVOBLANGAN *(vision-1000-answers #2 + #32)*
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** Karta arxivlanganda yarim tugallangan darslik progress MUZLATILADI (soft-delete, yo'qotilmaydi); yangi kartaga AVTOMATIK ko'chirilmaydi — voris yangi karta darsligini boshidan oladi; trigger: `CardArchived` event → `lms_progress.status = 'suspended'`. Departament o'zgarganda ham eski departament kurslari "tugatilmagan" qolsa muzlatiladi.
- **Manba:** vision-1000-answers/12-lms.md #2 + #32
- **Dalil (kod):** `grep -rln "CardArchived|card.*archived" apps/api/src/modules/lms` → **0**; `suspended` holatini yozuvchi kod ham, `CardArchived` listener ham LMS'da yo'q. Arxivlash faqat `org-structure/card.controller.ts` da; org tomonida chiqariladigan yagona hodisa = `org.card.employee.assigned` (teskari yo'nalish: assign→enroll).
- **Nima yetishmaydi:** —
- **Bog'liqlik:** Org-structure tomonida karta-arxiv hodisasi avval chiqarilishi shart (hozir yo'q); EP-LMS-063 (lavozim o'zgarishi), VR-LMS-I05 (arxiv)
- **action:** EVENT
- **⤳ Ta'sir:** Org-karta (arxivlash), HR (voris), Payroll (gate holati)
- **Xoch-havolalar:** `[Module-12] Item #2` · `[Module-12] Item #32` · `EXTRACTION QISM D #2` · `EXTRACTION QISM A #2`
- **Δ 2026-07-11→08-07:** —

### VR-LMS-I07 · Razryad pasayganda darslik avto qayta-tayinlash (`GradeDowngraded`)
- **Qaror holati:** ✅ JAVOBLANGAN *(vision-1000-answers #31)*
- **Qurilish holati:** Yo'q *(2026-07-11)*
- **Talab:** Razryad pasayganda pastlagan razryadga mos darslik kartalari AVTOMATIK qayta tayinlanadi (yangi razryad kurslari); Payroll `GradeDowngraded` event orqali darhol xabardor bo'ladi — yangi razryad oyligi HR + yuqori rahbar tasdig'idan keyin kuchga kiradi (E1 printsipi).
- **Manba:** vision-1000-answers/12-lms.md #31
- **Dalil (kod):** `grep -rln "GradeDowngraded" apps/api/src` → **0**. `org-structure/razryad-history.service.ts` faqat oshirish so'rovlarini boshqaradi (`createRequest({requestType: 'increase', ...})`) — pasaytirish yo'li ham, kurs-qayta-tayinlash trigger'i ham topilmadi.
- **Nima yetishmaydi:** —
- **Bog'liqlik:** razryad-**pasaytirish** so'rov-turi avval qurilishi shart (hozir faqat `increase`); EP-LMS-017 (razryad o'sishi zanjiri), EP-LMS-003 (avto-enroll naqshi tayyor)
- **action:** EVENT
- **⤳ Ta'sir:** Org-karta (razryad), Payroll (oylik), HR (2-imzo)
- **Xoch-havolalar:** `[Module-12] Item #31` · `EXTRACTION QISM D #31` · `EXTRACTION QISM A #31`
- **Δ 2026-07-11→08-07:** —

---

## III QISM — Manba-raqamlash xaritasi va tekshirish izohlari

### 1. Manbalar orasidagi xaritalash

| Manba | Diapazon | EP-LMS ga munosabat |
|---|---|---|
| `decisions/12-lms.md` | v1 #1..#30 → EP-LMS-001..030; v2 #1..#55 → EP-LMS-031..085 | **Kanonik EP-kod manbai** (85) |
| `EXTRACTION QISM C` (TASDIQ-2146 §12) | #1..#85 | **1:1 = EP-LMS-001..085** (siljish yo'q) |
| `FULL-ITEM-LEVEL [Module-12]` | Item #1..#50 | = `vision-1000-answers #1..#50` — **EP-kodsiz**, mavzu bo'yicha ulanadi *(taxminiy)*; qoplanmaganlari → II QISM `VR-LMS-I01..I07` |
| `FULL-ITEM-LEVEL [Module-12]` | Item #51..#85 | = `TASDIQ-2146 §12 #51..#85` → **1:1 = EP-LMS-051..085** |
| `EXTRACTION QISM A` | #1..#50 | = `vision-1000-answers #1..#50` (Item #1..#50 bilan bir xil) |
| `EXTRACTION QISM D` (V/VERIFY) | 42 qator, #2..#50 oralig'ida tanlab | = `vision-1000-answers` raqamlashi; 2026-07-07 cross-ref hal qilish |

> **Natija:** EP-LMS-051..085 uchun 2026-07-11 kod-dalili **to'g'ridan-to'g'ri** bor. EP-LMS-001..050 uchun to'g'ridan-to'g'ri 2026-07-11 item yo'q — dalil QISM C (2026-06-27) + QISM D (2026-07-07) + mavzuga mos `Item #1..#50` (2026-07-11) dan yig'ildi va har bandda `(taxminiy)` bilan belgilandi.

### 2. FULL-ITEM-LEVEL ning STALE-DOC tuzatishlari (2026-07-11 da qilingan)

| Item | Hujjat aytgan | Kod ko'rsatgan | Registrga kiritilgan |
|---|---|---|---|
| #12 (VR-LMS-I01) | "Cross-card credit MAVJUD EMAS" | jadval + `hasCrossCardCredit` + `course-completed-credit.handler` — hammasi real | **Ha** |
| #55 (EP-LMS-055) | sarlavhada "Ha", tanada "corrected: Yo'q" | 5 seed kursda 7-departament kursi yo'q | **Yo'q** |
| #64 (EP-LMS-064) | "hardcoded HTML stub" | kontroller allaqachon real DB so'rovi qilardi | **Qisman** (+ 2026-08-07 da real PDF) |
| #66 (EP-LMS-066) | "maxsus ERP kurs topilmadi, seed qilinmagan" | `LMS-ERP-01` (id=4) jonli bazada bor | **Qisman** |
| #85 (EP-LMS-085) | "POS-ekran LMS integratsiya qisman" | `pos-monitor` da 0 ta LMS havolasi | **Yo'q** |

### 3. Δ commit → band xaritasi (2026-07-11 → 2026-08-07)

| Commit | Nima qildi (jonli kodda tasdiqlangan) | Ta'sirlangan bandlar |
|---|---|---|
| `6d5a40b1` | `issued_ip` + SHA-256 `cert_hash` (migratsiya `lms-certificate-legal-fields-2026-07-11.sql`); `drizzle-lms-cert.repo.ts:59-66` `createHash('sha256')` + INSERT | EP-LMS-018, EP-LMS-064, **VR-LMS-I02** |
| `63c93b87` | `docctl` ko'rish/chop-etish jurnali `lms-certificate` ga yoyildi | EP-LMS-018, EP-LMS-031, VR-LMS-I02 |
| `06f77edc` | Real PDF sertifikat (`lms-certificate-pdf.service.ts`, `pdf-lib`+`qrcode`+`toPdfSafeText`), HTML o'rniga | EP-LMS-018, EP-LMS-064, VR-LMS-I02 |
| `3405c39e` | 2 ta o'lik `notImplemented` import olib tashlandi | — *(gigiyena, vizyon-ta'siri yo'q)* |
| `52eb84cb` | Real FE imtihon-topshirish yo'li `lms.exam.passed` chiqarmasdi → `lms-core.service.ts:46-60` da emit qo'shildi | EP-LMS-015, EP-LMS-017, EP-LMS-008, EP-LMS-041, EP-LMS-082 |
| `00ecedd1` | `AllExams.tsx` bitta qatorda oq ekran (`started_at` → `startedAt` alias) | EP-LMS-029, EP-LMS-041 |
| `97942ff7` | Sertifikat ro'yxati/hisoblagichi doim 0 (`{items,total}` konverti + `userName`/`courseName` alias) | EP-LMS-018, EP-LMS-029 |
| `16d7bed4` | 4 o'lik servis o'chirildi (`CoursesService`, `EnrollmentsService`, dublikat `CertificationService`, `GetMyEnrollmentsHandler`) — men tasdiqladim: fayllari yo'q, kanonik `domain/services/certification.service.ts` qoldi | — *(gigiyena, vizyon-ta'siri yo'q)* |

### 4. Ochiq egasi-qarorlari (10) va egasi-ma'lumotlari

**🔵 OCHIQ qarorlar (10):** EP-LMS-009 (o'tish bali %), 011 (micro-modul ketma-ketlik), 019 (sertifikat muddati), 022 (kaizen bonus miqdori), 027 (o'qish↔davomat blok), 057 (murabbiy malaka chegarasi), 058 (murabbiy zaxira tartib), 072 (davriy qayta-tasdiq davri), 078 (simulyatsiya ko'lami), 082 (murabbiy reyting vazni).

**Egasi-ma'lumoti (qaror emas, DATA):** AI provayder kaliti · `courses.card_id` (0/5) · `enrollments.card_id` (0/15) · `courses.is_universal` · `razryad_levels.min_months` · `TRAINING_OFFICER` (НО-14) rolidagi foydalanuvchi · 12-mavzu shabloni kontenti · NDA huquqiy matni · 7-departament kursi kontenti · amaliy-imtihon rubrika mezonlari · QC/MES nuqson → LMS mavzu taksonomiyasi · material turi → LMS mavzu taksonomiyasi.

