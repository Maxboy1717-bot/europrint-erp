-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) -- Q-35 (INSERT-only, no CREATE TABLE)
-- IoT-16 #60 -- vision docs/vision/_parts/B-16-iot.md line 16.10/16.30:
--   16.10 | "переделка" (kayta urildi) brak sabab kodi | defect_catalog | "Qisman (/defect REAL @iot-tablet.controller.ts:477, seed yo'q) -- Endpoint bor, sabab seed emas"
--   16.30 | Defekt sababini operator tayyor ro'yxatdan tanlasin | defect_catalog | tayyor sabab ro'yxati seed
-- Verified live DB before writing this file (node _audit/q.cjs): defect_catalog has 23 rows
-- (DEF-U-001..004 / DEF-G-001..006 / DEF-O-001..007 / DEF-S-001..003 / DEF-F-001..003,
-- see docs/migration/seed/seed-05-defects.sql) and none of them represent rework/pereedelka.
-- This migration adds exactly ONE additive, idempotent row -- it does not touch the 23
-- existing rows and does not alter the table shape (columns match p18-d1-defect-catalog.sql
-- / apps/api/src/shared/db/schema-misc-qc.ts exactly: code, name_uz, name_ru, direction,
-- severity, auto_reject, description_uz, corrective_action_uz, created_at, updated_at).
--
-- Column value rationale:
--   code      = 'DEF-U-005' -- next free number in the existing universal DEF-U-00x series
--               (DEF-U-001..004 already taken; confirmed free via node _audit/q.cjs).
--   direction = 'universal' -- rework is not tied to one print process (gofra/offset/
--               silkscreen/flexi); it can be raised from any of them, matching the existing
--               DEF-U-* rows (Noto'g'ri o'lcham / Dog' / Yirtilish / Noto'g'ri miqdor) which
--               are likewise process-agnostic.
--   severity  = 'MAJOR' -- rework is a real production-cost event (batch goes back through
--               PP) but is explicitly NOT a scrap/auto-reject outcome, so CRITICAL (which in
--               every existing row implies auto_reject=true) would misrepresent it; MINOR
--               would understate the rework cost. MAJOR is the closest existing severity used
--               by comparable "needs extra handling but not scrapped" rows (e.g. DEF-G-003
--               Qiya kesim, DEF-O-002 Siyoh ko'p) -- same auto_reject=false pattern.
--   auto_reject = false -- mirrors the codebase's existing 3-way QC decision (pass/fail/
--               rework: submit-inspection.handler.ts, QcReworkEvent) where rework returns the
--               batch to production instead of auto-rejecting it.

BEGIN;

INSERT INTO defect_catalog (
  code,
  name_uz,
  name_ru,
  direction,
  severity,
  auto_reject,
  description_uz,
  corrective_action_uz,
  created_at,
  updated_at
)
VALUES (
  'DEF-U-005',
  'Qayta ishlash (pereedelka)',
  'Переделка',
  'universal',
  'MAJOR',
  false,
  'Mahsulot yakuniy QC dan o''tmadi, lekin brak/scrap emas -- qayta ishlov (pereedelka) orqali to''g''irlanishi mumkin.',
  'QC rework qarori: buyurtmani PP''ga qayta ishlov uchun qaytarish (QcReworkEvent). Sabab tavsifini operator kiritishi majburiy.',
  NOW(), NOW()
)
ON CONFLICT (code) DO NOTHING;

COMMIT;

-- Tekshirish:
-- SELECT code, name_uz, name_ru, direction, severity, auto_reject FROM defect_catalog WHERE code = 'DEF-U-005';
