-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
-- ============================================================================
-- 08-mes #83 — 1 operator + N nomli yordamchi + hissa% (contribution share)
-- ============================================================================
-- Muammo: machine_crews jadvali qat'iy 4 ustunli rol modeliga ega
-- (master_id, polmaster_id, shogird_id, rokler_id) — N ta nomli yordamchini
-- yoki har a'zoning hissa foizini (share_percent) ifodalay olmaydi.
-- Yechim: machine_crew_members bola-jadvali — har sessiya uchun 1 operator +
-- N nomli a'zo, har biri role_label + share_percent bilan. Mavjud 4 rol
-- ustuni qatorlarga ko'chiriladi (backfill, idempotent). Jadval FAQAT
-- qo'shiladi; mavjud machine_crews ustunlari saqlanadi (regressiya yo'q —
-- Q-39/Q-46). share_percent NULL = teng-taqsim (MesCrewMembersService
-- hisoblaydi — fabrikatsiya emas, Q-40). session_id → production_sessions.id
-- (kanonik sessiya jadvali; mes_production_sessions u ustidan VIEW), employee_id
-- → employees.id — app-darajali FK (machine_crews ham DB-FK constraintsiz).
-- ============================================================================

CREATE TABLE IF NOT EXISTS machine_crew_members (
  id            SERIAL PRIMARY KEY,
  session_id    INTEGER NOT NULL,
  employee_id   INTEGER NOT NULL,
  role_label    TEXT,
  share_percent NUMERIC(5, 2),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS machine_crew_members_session_employee_uidx
  ON machine_crew_members (session_id, employee_id);

CREATE INDEX IF NOT EXISTS machine_crew_members_session_idx
  ON machine_crew_members (session_id);

-- Backfill: mavjud 4 qat'iy rol ustunini qatorlarga ko'chirish (idempotent).
-- Faqat haqiqiy xodim id (>0) ko'chiriladi; master_id=0 kabi to'ldirgichlar
-- tashlanadi. share_percent NULL::numeric = teng-taqsim.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'machine_crews' AND column_name = 'master_id') THEN
    INSERT INTO machine_crew_members (session_id, employee_id, role_label, share_percent)
      SELECT session_id, master_id,    'master',    NULL::numeric FROM machine_crews WHERE master_id    IS NOT NULL AND master_id    > 0
      UNION ALL
      SELECT session_id, polmaster_id, 'polmaster', NULL::numeric FROM machine_crews WHERE polmaster_id IS NOT NULL AND polmaster_id > 0
      UNION ALL
      SELECT session_id, shogird_id,   'shogird',   NULL::numeric FROM machine_crews WHERE shogird_id   IS NOT NULL AND shogird_id   > 0
      UNION ALL
      SELECT session_id, rokler_id,    'rokler',    NULL::numeric FROM machine_crews WHERE rokler_id    IS NOT NULL AND rokler_id    > 0
    ON CONFLICT (session_id, employee_id) DO NOTHING;
  END IF;
END $$;
