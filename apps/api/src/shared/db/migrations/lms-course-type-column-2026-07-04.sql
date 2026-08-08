-- APPROVED: additiv ALTER (Q-35 pre-approved), Phase-2 audit SB0112/SB0148 (03-lms-darslik).
-- Maqsad: courses.course_type — LmsCompletionService.defaultThreshold() allaqachon shu
--   enum'ni kutadi ('safety_tx' | 'regulation' | 'general' | 'razryad_exam' | 'onboarding' |
--   'replication') lekin DB'da mos ustun yo'q edi (o'sha helper hozircha chaqirilmaydi —
--   passing_score bevosita ishlatiladi, fallback DEFAULT 70). Ustun qo'shilgach LMS moduli
--   har kursni turi bo'yicha tasniflab, kelajakda defaultThreshold()'ni ulashi mumkin.
-- FAQAT ADDITIV: ADD COLUMN IF NOT EXISTS + CHECK constraint (yangi qator), DROP/TYPE-change
--   yo'q. NULLABLE (mavjud 5 ta kurs buzilmaydi, NULL = "tasniflanmagan" holat h.).
-- lms_courses (VIEW over courses, explicit column list) ham yangilanadi shu ustunni ko'rsatish
--   uchun (CREATE OR REPLACE VIEW — destructive emas, faqat qo'shimcha column).

ALTER TABLE courses ADD COLUMN IF NOT EXISTS course_type VARCHAR(30);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'courses_course_type_check'
  ) THEN
    ALTER TABLE courses ADD CONSTRAINT courses_course_type_check
      CHECK (course_type IS NULL OR course_type IN (
        'safety_tx', 'regulation', 'general', 'razryad_exam', 'onboarding', 'replication'
      ));
  END IF;
END $$;

CREATE OR REPLACE VIEW lms_courses AS
SELECT
  id, code, title, title_ru, description, description_ru, thumbnail, is_required, duration,
  level, department_id, mentor_id, start_date, end_date, created_at, deleted_at,
  org_department_id, course_code, title_uz, category, difficulty_level, duration_hours,
  passing_score, max_attempts, is_mandatory, prerequisite_course_id, thumbnail_url,
  author_id, is_active, published_at, updated_at, created_by, course_type
FROM courses;
