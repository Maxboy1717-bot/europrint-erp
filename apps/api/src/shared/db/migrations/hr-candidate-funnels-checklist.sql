-- Add checklist_data JSONB column to hr_candidate_funnels
-- Stores: { [key]: { done, done_at, done_by, note } }
-- Applied: 2026-05-19

ALTER TABLE hr_candidate_funnels
  ADD COLUMN IF NOT EXISTS checklist_data JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS hr_candidate_funnels_checklist_gin_idx
  ON hr_candidate_funnels USING GIN (checklist_data);
