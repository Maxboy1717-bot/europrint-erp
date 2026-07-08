-- org-razryad-exam-config-2026-06-19.sql
-- razryad_levels exam configurability — EP-ORG-055 (pass threshold) + EP-ORG-056 (max retakes).
-- Source: docs/audit/MUSLIMBEK-PROMT-02-ORG-BUILD-2026-06-08.md Phase 2 + Phase 4.
--
-- GATED: owner approval required before running.
-- APPROVED: Claude (egasi vakolati) 2026-06-20
--
-- ⚠ EGASI QIYMATI KERAK: DEFAULT NULL (hardcoded 70%/3 TAQIQ — egasi "default yo'q" degan).
--    Mavjud 6 ta razryad yozuvi uchun egasi quyidagi UPDATE orqali qiymat kiritadi:
--      UPDATE razryad_levels SET exam_pass_threshold = <foiz>, max_retakes = <son> WHERE level = <N>;
--    LMS/imtihon mantiq bu ustunlardan o'qiydi — NULL holat = "egasi hali kiritgani yo'q".
--
-- exam_pass_threshold: NUMERIC(5,2) NULL — 0.00–100.00 foiz (egasi belgilaydi)
-- max_retakes:         INTEGER NULL       — qayta topshirish maks soni (egasi belgilaydi)

ALTER TABLE public.razryad_levels
  ADD COLUMN IF NOT EXISTS exam_pass_threshold NUMERIC(5,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS max_retakes         INTEGER       DEFAULT NULL;

-- CHECK constraints for data integrity (idempotent — guarded by DO block so re-run is safe).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_razryad_exam_pass_threshold') THEN
    ALTER TABLE public.razryad_levels
      ADD CONSTRAINT chk_razryad_exam_pass_threshold
      CHECK (exam_pass_threshold IS NULL OR exam_pass_threshold BETWEEN 0 AND 100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_razryad_max_retakes') THEN
    ALTER TABLE public.razryad_levels
      ADD CONSTRAINT chk_razryad_max_retakes
      CHECK (max_retakes IS NULL OR max_retakes >= 0);
  END IF;
END $$;

-- DB-proof: after running
-- SELECT id, level, name, exam_pass_threshold, max_retakes FROM razryad_levels ORDER BY level;
-- Expected: all 6 rows with exam_pass_threshold=NULL, max_retakes=NULL (egasi kiritishni kutadi).
