-- APPROVED: Q12 fix — POST /api/hr/recruitment/vacancies/:id/market-analysis parsed the
-- request body then discarded it (read-only echo of an unrelated candidate-count aggregate).
-- Additive ALTER only — new nullable JSONB column to actually persist the submitted
-- market-analysis payload (region, salary benchmarks, competitor data, etc.) per vacancy.
ALTER TABLE hr_vacancy_profiles ADD COLUMN IF NOT EXISTS market_analysis JSONB;
