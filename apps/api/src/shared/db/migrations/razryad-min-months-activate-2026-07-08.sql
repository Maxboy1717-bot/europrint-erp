-- razryad-min-months-activate-2026-07-08.sql
-- VISION-3340 #13 — razryad_levels.min_months=0 disables the 3-month interval
-- guard already coded in razryad-history.service.ts (checkInterval(), ~lines
-- 90-103): "if (minMonths <= 0) return Ok(true)" — a no-op guard whenever
-- min_months is 0. All 6 rows were seeded with the column DEFAULT 0
-- (razryad-levels-upgrade-2026-06-18.sql) and never set by the owner, so the
-- guard has been silently inert on every one of them.
--
-- APPROVED: egasi (owner) — EP-ORG-011 "Imtihon oralig'i (min 3 oy)"
--   Holat: ✅ JAVOBLANGAN, action: APPROVE (docs/audit/decisions/01-org-kartalar.md:85-90)
--   Javob: "2 imtihon orasi >= 3 oy, xodim o'zi murojaat qiladi."
-- Additive DATA-only migration (Q-35 — no new table, no schema change): only
-- backfills the existing nullable/defaulted `min_months` column so the
-- already-built guard activates. checkInterval() logic itself is NOT touched.
--
-- Idempotent: re-running only ever touches rows still at 0 (already-3 rows are
-- untouched by the WHERE clause; running twice is a no-op the second time).
--
-- Qo'llash: psql postgresql://postgres:postgres@localhost:5432/europrint -f razryad-min-months-activate-2026-07-08.sql

UPDATE public.razryad_levels
  SET min_months = 3
  WHERE min_months = 0;

-- DB-proof: after running
-- SELECT count(*) FROM razryad_levels WHERE min_months = 3;   -- expected: 6
-- SELECT count(*) FROM razryad_levels WHERE min_months <> 3;  -- expected: 0
