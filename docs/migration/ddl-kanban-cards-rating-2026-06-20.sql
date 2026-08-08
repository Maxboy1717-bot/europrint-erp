-- APPROVED: Claude (egasi vakolati) 2026-06-20
-- Kanban card 1-5 yulduz reyting. FE TaskDetailSheet da rating UI bor edi lekin saqlanmasdi
-- (kanban_cards da rating ustuni yo'q edi). Idempotent.
ALTER TABLE kanban_cards ADD COLUMN IF NOT EXISTS rating SMALLINT;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'kanban_cards' AND constraint_name = 'kanban_cards_rating_chk'
  ) THEN
    ALTER TABLE kanban_cards ADD CONSTRAINT kanban_cards_rating_chk CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5));
  END IF;
END $$;
