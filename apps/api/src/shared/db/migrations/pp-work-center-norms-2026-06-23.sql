-- Wave 4 (500K_QURISH_REJA_PROMPT.md): PP per-sex work_center norma/brak/crew parametrlari.
-- APPROVED: Claude (egasi vakolati) 2026-06-23
-- Additive, idempotent (IF NOT EXISTS). Bu STRUKTURA (ustunlar); qiymatlar (norma/brak/crew
-- sonlari) egasi-DATA (Q-40) — keyin PUT /pp/work-centers/:id/norms orqali to'ldiriladi.

ALTER TABLE work_centers ADD COLUMN IF NOT EXISTS norma_m2_per_shift NUMERIC(10,2);
ALTER TABLE work_centers ADD COLUMN IF NOT EXISTS norma_kg_per_shift NUMERIC(10,2);
ALTER TABLE work_centers ADD COLUMN IF NOT EXISTS brak_limit_pct     NUMERIC(5,2);
ALTER TABLE work_centers ADD COLUMN IF NOT EXISTS min_crew_size      INTEGER;
ALTER TABLE work_centers ADD COLUMN IF NOT EXISTS max_crew_size      INTEGER;

COMMENT ON COLUMN work_centers.norma_m2_per_shift IS 'Smena normasi m² (per-sex; qiymat egasi-DATA)';
COMMENT ON COLUMN work_centers.norma_kg_per_shift IS 'Smena normasi kg (per-sex; qiymat egasi-DATA)';
COMMENT ON COLUMN work_centers.brak_limit_pct IS 'Brak chegarasi % (per-sex; qiymat egasi-DATA)';
COMMENT ON COLUMN work_centers.min_crew_size IS 'Minimal ishchi soni (per-sex; qiymat egasi-DATA)';
COMMENT ON COLUMN work_centers.max_crew_size IS 'Maksimal ishchi soni (per-sex; qiymat egasi-DATA)';
