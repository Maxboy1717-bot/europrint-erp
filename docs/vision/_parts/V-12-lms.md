## [V/VERIFY] LMS/Darslik (12) — cross-ref hal qilindi

Search roots: `apps/api/src/modules/lms/**`, `lib/db/src/schema/lms*`, `apps/api/src/telegram/handlers/lms.handler.ts`, `artifacts/erp-dashboard/src/pages/lms-extended/**`.
Modul surface: `lms.module.ts` — 3 event-listener (CertExpiry, CardEmployeeAssigned, CourseCompletedCredit), 1 cron (cert-expiry).

| # | Savol (qisqa) | Oldingi | Hal qilingan status | Dalil (fayl:satr / jadval / grep) |
|---|---|---|---|---|
| 2 | Karta arxivlansa progress suspend (voris boshidan) | cross-ref kerak | **Yo'q** | grep `CardArchived\|suspend.*progress` LMS = 0; arxiv faqat `org-structure/card.controller.ts`da, LMS suspend-listener yo'q. `card-employee-assigned.handler` = teskarisi (assign→enroll) |
| 3 | 2 marta yiqilsa AI avto qayta-o'qish + murabbiy/HR xabar | cross-ref kerak | **Yo'q** | `lms-tests.service.ts:80 findRetakeAttempts` faqat retake-ro'yxat query; fail-count→auto-restudy trigger/notify yo'q. grep `fail.?count\|auto.?re` = 0 |
| 4 | RD-4 yo'q → zaxira baholovchi, 24s eskalatsiya | cross-ref kerak | **Yo'q** | grep `backup.?evaluator\|zaxira.*bahol\|escalat` LMS = 0 |
| 6 | TX sertifikat 7/5/3-kun eskalatsiya + tugash kuni MES blok | cross-ref kerak | **Qisman** | `cert-expiry.handler.ts:57` kunlik cron `CertificateExpiredEvent` publish → MES blok listener'lar (`mes/.../lms-cert-expired-block.service.ts`, `lms-cert-expired-mes.listener.ts`); LEKIN 7/5/3-kun oldindan-eskalatsiya YO'Q (faqat tugash-kuni sweep) |
| 7 | 3-oylik (90-kun) interval ariza-sanasiga qarab | cross-ref kerak | **Yo'q** | razryad-zanjir `lms-exams.service.ts:60` exam.passed event orqali; 90-kun interval tekshiruvi yo'q, grep `90\|interval` = 0 |
| 8 | AI "xavfli savol" flag (safety_risk) + НО-14 gate | cross-ref kerak | **Yo'q** | grep `safety_risk\|xavfli.?savol\|dangerous` = 0 (AI-kalit egasi-data) |
| 9 | Iste'fo → arxiv 7yr soft-delete + rehire restore | cross-ref kerak | **Yo'q** | grep `rehire\|restore.*progress\|iste'fo` LMS = 0 |
| 10 | PDCA Check salbiy → Reja (Kaizen) | cross-ref kerak | **Yo'q** | Kaizen LMS-area emas; grep `KaizenCheckFailed\|PDCA` LMS = 0 |
| 11 | Sick leave → o'qish timer PAUSE | cross-ref kerak | **Yo'q** | grep `sick.?leave\|leave.*pause\|timer.*pause` LMS = 0 |
| 13 | QC/MES xato → qisqa qayta-o'qish + mini-test | cross-ref kerak | **Yo'q** | grep `QC.*lms\|mes.*topic\|qayta-o'qish trigger` = 0 |
| 14 | Video 2x → real-vaqt 80% shart | cross-ref kerak | **Qisman** | `drizzle-lms-misc.repo.ts:44-61 saveVideoProgress` real (video_progress: current_time/duration/completed) + `/video-progress` controller; LEKIN 80% real-vaqt chegara enforcement YO'Q (istalgan progress saqlanadi) |
| 16 | Tashqi sertifikat HR tasdiqi bilan hisob | cross-ref kerak | **Yo'q** | grep `external.?cert\|tashqi.?sert` LMS = 0 |
| 17 | Zaxira rahbar → Leadership Development track | cross-ref kerak | **Yo'q** | grep `LeadershipTrack\|leadership.?track` = 0 |
| 18 | Simulyatsiya AI "xavfli qaror" + MES 3+ threshold | cross-ref kerak | **Yo'q** | grep `simulyatsiya\|simulation` LMS = 0 |
| 20 | Reglament matritsa karta+razryad+dept | cross-ref kerak | **Yo'q** | grep `reglament` LMS = 0 (matches boshqa modullarda) |
| 21 | Murabbiy dual-role + TX tugamasa zaxiraga | cross-ref kerak | **Yo'q** | `lms_card_mentors` CRUD bor (`drizzle-lms-misc.repo.ts:205 assignCardMentor`) LEKIN dual-role/rol-transfer mantiq qurilmagan; mentor rating column ham yo'q (repo:76 izoh) |
| 22 | Kaizen bonus "Act" → proposing card | cross-ref kerak | **Yo'q** | Kaizen LMS-area emas; grep = 0 |
| 23 | Immutable audit-log IP+device+click-hash + PDF | cross-ref kerak | **Qisman** | `AuditInterceptor` LMS controller'larga ulangan (`audit.interceptor.ts:55,114` audit-row persist); LEKIN immutable click-hash/device/IP layer + PDF eksport YO'Q |
| 24 | "Muvaffaqiyatli harakatlar" blanka → НО-14 (48s) | cross-ref kerak | **Yo'q** | grep `muvaffaqiyatli.?harakat\|blanka` = 0 |
| 25 | Razryad nazariy 6oy / amaliy 3oy qayta | cross-ref kerak | **Yo'q** | razryad exam.passed zanjir bor; nazariy-saqlash/interval logikasi yo'q, grep = 0 |
| 26 | Telegram bot javob holat o'zgartirmaydi (eslatma only) | cross-ref kerak | **Qisman** | `telegram/handlers/lms.handler.ts:37-82` faqat sendMessage (send-only, holat o'zgartirmaydi — vizyonga mos); LEKIN o'qidim/keyinroq callback + LMS-ichida-tasdiq audit oqimi alohida tasdiqlanmagan |
| 27 | Haftalik avto progress hisobot + AI orqadagilar | cross-ref kerak | **Yo'q** | LMS'da yagona cron = cert-expiry; grep `@Cron\|weekly\|haftalik` LMS = faqat cert-expiry.handler. Haftalik report/AI yo'q |
| 28 | Micro-modul resume last_position + 24s eslatma | cross-ref kerak | **Qisman** | video uchun resume bor (`drizzle-lms-misc.repo.ts:56 current_time`); LEKIN `recordMicroModuleView` (repo:28) faqat viewed_at yozadi — micro-modul last_position/24s eslatma YO'Q |
| 29 | ERP yangilansa НО-14 micro-modul (manual, karta-target) | cross-ref kerak | **Yo'q** | micro_modules CRUD bor (`lms-misc.controller.ts:94`) LEKIN ERP-update trigger + karta-targeting yo'q |
| 30 | Yuridik minimal PDF (IP/SHA-256 imzo) | cross-ref kerak | **Yo'q** | grep `sha.?256\|click.?hash\|pdf` LMS = 0 (QC-cert PDF alohida modul) |
| 31 | Razryad pasaysa GradeDowngraded → reassign | cross-ref kerak | **Yo'q** | grep `GradeDowngraded\|grade_downgrad\|downgrade` = 0 |
| 33 | AI PDF report (kim o'qidi/xavf-zona) kunlik+haftalik | cross-ref kerak | **Yo'q** | grep `AI.*report\|ai_report\|generateWeekly` LMS = 0 (AI-kalit egasi-data) |
| 34 | Tablet OFFLINE o'qish + BullMQ idempotent sync | cross-ref kerak | **Yo'q** | grep `offline\|sync_id\|BullMQ` LMS = 0 |
| 35 | Onboarding bosqich muddat 0-4/4-8/8+ eskalatsiya | cross-ref kerak | **Yo'q** | `hr/onboarding/onboarding.service.ts` = completeProbation (karta faollashtirish); bosqich-timeout eskalatsiya cron yo'q |
| 36 | Test bank RBAC: НО-14 tahrir + rahbar draft + eski natija | cross-ref kerak | **Qisman** | RBAC real: `lms-tests.service.ts:16-22 PRIVILEGED_ROLES` + controller `@Roles(TRAINING_OFFICER..)`; LEKIN rahbar-tavsiya(draft) + versiya-tag + eski-natija-saqlash YO'Q |
| 37 | Race yo'q: progress PK user+card, optimistic lock+upsert | cross-ref kerak | **Qisman** | `enrollments.card_id` ustuni real (SB0115); LEKIN (user_id,card_id) PK / optimistic-lock YO'Q — `saveVideoProgress` izohi (repo:46-47) unique-index yo'qligini, qo'lda upsert ekanini tasdiqlaydi |
| 38 | Test-bank xatosi → cert HR qo'lda revoke (audit) | cross-ref kerak | **Qisman** | schema `lms_certificates.status` 'revoked' qo'llab-quvvatlaydi (`lms-extended.ts:74 chk`) + `updateCertificateStatus`; LEKIN HR qo'lda-revoke endpoint/oqim + audit tasdiqlanmagan |
| 39 | Dashboard % faqat majburiy kurs + filtr + RBAC | cross-ref kerak | **Qisman** | is_mandatory filtr real: `drizzle-lms-courses-extended.repo.ts:22-31 findAll` (is_mandatory + category + completion_rate); LEKIN dept/karta/tur/sana filtr + rahbar-o'z-bo'lim RBAC scoping YO'Q |
| 41 | Onboarding yopilsa AVTO prikaz (DocumentCreated→CC) | cross-ref kerak | **Yo'q** | `onboarding.service.ts:163 completeProbation` kartani faollashtiradi; auto-prikaz→CC document generatsiya yo'q, grep = 0 |
| 42 | Reglament test 7-kun uzr + rahbar 24s → +7 kun | cross-ref kerak | **Yo'q** | grep `reglament\|uzr\|extend` LMS = 0 |
| 43 | AI chatbot RBAC (faqat kurs+ERP; oylik HECH QACHON) | cross-ref kerak | **Yo'q** | grep `chatbot` LMS = 0 (AI-kalit egasi-data) |
| 44 | Qisqartirilgan test 30-50% AI tanlaydi + HR gate | cross-ref kerak | **Yo'q** | grep `qisqartirilgan\|AI.?select\|30.*50` = 0 (foiz master-data egasi-data) |
| 45 | "Noto'g'ri izoh" nishon → НО-14 dashboard + lug'at | cross-ref kerak | **Yo'q** | `lms_support_tickets` generic ticket bor (`lms-core.controller.ts:166`); LEKIN chatbot-flag→НО-14→lug'at-update oqimi yo'q |
| 46 | Yangi gofra → MaterialAdded → LMS mavzu | cross-ref kerak | **Yo'q** | grep `MaterialAdded` listener LMS = 0 |
| 47 | Jihoz eskirsa "ish joyi vositalari" → review_required | cross-ref kerak | **Yo'q** | grep `inventar.*lms\|review_required` LMS = 0 |
| 48 | Ustuvorlik TX→onboarding→reglament (priority-queue) | cross-ref kerak | **Yo'q** | grep `priority.?queue\|navbat-tartib` LMS = 0 |
| 49 | O'quv tarixi karta yo'q bo'lsa ham xodim profiliga (7yr+RBAC) | cross-ref kerak | **Qisman** | xodim-daraja progress real: `drizzle-lms-misc.repo.ts:165-171 findProgressByUser` (employee_id bo'yicha) + FE `employee-profile/RemainingTabsLearningExtras.tsx`; LEKIN 7-yil arxiv + RBAC-ko'rish spec tasdiqlanmagan |
| 50 | Razryad natija 48s eskalatsiya + eski razryad qoladi (2-imzo) | cross-ref kerak | **Qisman** | razryad 2-imzo zanjir real: `lms-exams.service.ts:60-69` exam.passed → org-structure ExamPassedRazryadHandler (ai_suggested, 2-imzo); LEKIN 48s eskalatsiya taymeri YO'Q |
