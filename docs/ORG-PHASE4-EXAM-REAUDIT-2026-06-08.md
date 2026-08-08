# ORG Phase 4 — EXAM / SERTIFIKAT RE-AUDIT (read-only) — 2026-06-08

> Modul #02, Faza 4. Dublikat xavfi YUQORI → avval xarita, keyin reuse (org_exams/org_certificates QURMA — C6/printsip #6).
> Metod: jonli DB (`_audit/q.cjs`) + kod o'qish. Hech narsa o'zgartirilmadi — faqat shu hisobot. `.claude/worktrees/*` eski nusxalar e'tiborsiz.
> ⛔ STOP nuqta: bu hisobotni egasi ko'rib "davom" demaguncha KOD YOZILMAYDI.

---

## 1. MAVJUD INFRATUZILMA (jonli tasdiqlangan — hammasi BO'SH = qurilish bosqichi)

| Jadval | Qator | Karta-bog' (`org_function_id`) | BE | FE |
|---|---|---|---|---|
| `ai_exam_attempts` | 0 | ✅ **BOR** | `ai-exam.controller` (REAL, `AiExamService`) — 6 route | ✅ `AIExams.tsx` (`/api/ai-exam/attempts`) |
| `lms_exams` (+`lms_exam_questions`/`_attempts`) | 0 | ❌ (course orqali) | `lms-tests.controller` REAL (4 db-signal, 11 route) | ✅ `AllExams.tsx` |
| `certificates` | 0 | ❌ (employee_id/exam_id) | `/api/certificates` REAL (GET/POST/DELETE) | ✅ `Certificates.tsx` (+Dialogs/Sections) |
| `lms_certificates` | 0 | ❌ | `lms-certificates.controller` (5 route, 0 db-signal — yupqa) | — |
| `qc_certificates` | 0 | ❌ | QC domeni | `qc/QCCertificateGenerator.tsx` |
| `hr_question_bank` | 0 | ✅ **BOR** | — (tekshirilsin) | — |
| `hr_tz2_ai_question_banks` | 0 | ✅ **BOR** | — | — |
| `lms_tests` | 0 | ✅ **BOR** | lms-tests.controller | AllExams |

**Generic `exams`/`exam_questions` jadvallari YO'Q** (yaxshi — universal dublikat yo'q). Karta↔imtihon/savol bog'i **allaqachon sxemada bor** (`org_function_id` 4 jadvalda).

## 2. ⭐ KANONIK TANLOV (tavsiya — egasi tasdiqlasin)

- **Per-karta AI imtihon = `ai_exam_attempts`** (org_function_id karta-bog'i bor; `ai-exam.controller`+`AiExamService`+`AIExams.tsx` to'liq tirik). EP-ORG "har kartada o'z AI imtihoni" shunga to'g'ri keladi. ⚠️ `assignExam(userId, positionId)` hozir `positionId` oladi — kartaga ulash = `org_function_id` qabul qilsin.
- **Rasmiy imtihon = `lms_exams`** (`passing_score`/`pass_score` = sozlanadigan chegara EP-ORG-055 ✅; lms_exam_questions/attempts ekotizimi + 2 FK). Karta↔imtihon = course orqali (`lms_exams.course_id` ← `position_required_courses` ← karta).
- **Sertifikat = `certificates`** (eng boy ustun to'plami: `expires_at`/`expiry_date` EP-ORG-047, `employee_id`, `exam_id`, `name`, `document_url`; REAL BE+FE). `lms_certificates`/`qc_certificates` = bir xil ustunli leaf-dublikatlar (0 FK, 0 qator) → **tegmaymiz** (qc o'z domeni; lms ichki). Kanonik = `certificates`.
- **Savol-bank = `hr_question_bank`** (org_function_id karta-bog'i; question_uz/ru, expected_keywords, difficulty). EP-ORG-053 "karta-turi + razryad" → karta-turi ✅, **razryad GAP** (ustun yo'q).

⛔ `org_exams`/`org_certificates` **YARATILMAYDI** (printsip #6 — bitta kanonik haqiqat).

## 3. GAP JADVALI — Faza 4 vizyoni × mavjud × reuse/build

| Vizyon (EP-ORG) | Mavjud? | Qayerda | Gap | Reuse/Build |
|---|---|---|---|---|
| Per-karta AI imtihon (046) | 🟢 KO'P | ai_exam_attempts.org_function_id + ai-exam.controller + AIExams.tsx | assign org_function_id qabul qilsin; kartada ko'rsatish | **REUSE** (yupqa ulash) |
| Imtihon = nazariy+amaliy (046) | 🟡 QISMAN | lms_exams (nazariy shell) | amaliy/nazariy ajratish maydoni yo'q | REUSE + (ehtimol kichik maydon) |
| Configurable o'tish chegarasi (055) | 🟢 BOR | lms_exams.passing_score | — | **REUSE** |
| Qayta-topshirish qoidasi (056) | 🔴 YO'Q | — | retake ustuni hech qayerda yo'q | build (config — owner qaror) |
| Savol-bank karta-turi+razryad (053) | 🟡 QISMAN | hr_question_bank.org_function_id | **razryad keying yo'q** | REUSE + kichik DDL (razryad_level_id) — owner |
| Kartada sertifikat ro'yxati + 30-kun ogohlantirish (047) | 🟡 QISMAN | certificates (expiry bor, employee bo'yicha) | "kartaga talab qilingan sertifikatlar" bog'i yo'q | build (yupqa bog' yoki matn — owner) |

## 4. REUSE-REJA (egasi tasdiqlasa — keyin bosqichma-bosqich)
1. **AI imtihon ↔ karta**: `ai-exam` assign'ga `org_function_id` qo'shish + karta papka/detalida shu kartaning AI-imtihon urinishlarini ko'rsatish (`ai_exam_attempts WHERE org_function_id=card`). Yangi jadval YO'Q.
2. **Sertifikat ↔ karta**: kanonik `certificates`'dan xodimning sertifikatlari + 30-kun expiry ogohlantirishini kartada ko'rsatish. "Talab qilingan sertifikatlar" = owner qaror (yupqa `card_required_certificates` bog' jadval ⟂ yoki kartada matn ro'yxat).
3. **Savol-bank ↔ karta+razryad**: `hr_question_bank` (org_function_id bor) + razryad keying uchun `razryad_level_id` ADD COLUMN (kichik DDL, Q-35 — owner SQL ko'rib tasdiqlaydi).
4. **Rasmiy imtihon**: `lms_exams.passing_score` (chegara) reuse; retake (056) = config qaror (owner).

## 5. ⛔ OWNER QAROR KUTILADI (qurishdan OLDIN)
1. **Kanonik tasdiq:** AI-imtihon=`ai_exam_attempts`, rasmiy=`lms_exams`, sertifikat=`certificates`, savol-bank=`hr_question_bank` — ha/yo'q?
2. **Sertifikat (3 jadval):** kanonik = `certificates`; `lms_certificates`/`qc_certificates` tegilmasin — to'g'rimi?
3. **"Talab qilingan sertifikatlar per karta" (047):** yupqa bog' jadval (`card_required_certificates`, DDL) yoki kartada matn ro'yxat?
4. **Razryad savol-keying (053):** `hr_question_bank`ga `razryad_level_id` ADD COLUMN (kichik DDL) — ruxsatmi?
5. **Retake qoidasi (056):** qayerda — `lms_exams`ga ustunmi yoki sozlama? (yoki keyinga qoldirilsinmi)
6. **Boshlash nuqtasi:** eng kam-xavfli + ko'p-qiymatli = AI-imtihon↔karta surface + sertifikat↔karta surface (yangi jadval yo'q). Shulardan boshlaymizmi?

## 6. KEYINGI QADAM
⛔ **STOP — hech narsa qurilmadi.** Egasi MASALA 1-6 bo'yicha qaror + "davom" → keyin bosqichma-bosqich (permission-gate, DB-proof, alohida commit). Yangi jadval faqat egasi SQL'ni ko'rib tasdiqlaganda (Q-35).

*Tayyorlandi: 2026-06-08 · Bajaruvchi (Faza 4 read-only re-audit) · git status'da faqat shu fayl ko'rinishi kerak.*
