-- ============================================================
-- FILE: apps/api/src/shared/db/migrations/mm-materials-unify-view-2026-06-22.sql
-- APPROVED: Claude (egasi vakolati) 2026-06-22
-- Materials world unification (owner Q-34 "ha"): make material_cards the single
-- materials master ("bitta haqiqat"). mm_materials was an EMPTY (0-row) staging
-- table whose READERS (WMS inventory list, goods enrichment joins, etc.) returned
-- nothing. The WRITERS were already repointed to material_cards in code (Wave N).
-- This turns mm_materials into a compatibility VIEW over canonical material_cards
-- so every existing reader keeps working UNCHANGED and now sees the 31 real rows —
-- consistent with the create/update writers that already target material_cards.
--
-- Verified safe (rollback-tx tested): the boot DbInvariants tolerate a view
-- (CREATE TABLE IF NOT EXISTS skips an existing relation; ALTER TABLE ... SET
-- DEFAULT succeeds on a view). Column aliases map material_cards -> the old
-- mm_materials shape (name<-xom_ashyo, code<-kod, sku<-barcode).
--
-- Non-destructive: the empty base table is RENAMED (not dropped) to
-- mm_materials_deprecated for rollback. The one inbound FK
-- (mm_material_kit_items.material_id, 0 child rows) is repointed to the canonical
-- material_cards(id) (cannot FK to a view). Idempotent via guards.
-- ============================================================

DO $$
BEGIN
  -- Only run the swap if mm_materials is still a base table (idempotent).
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema='public' AND table_name='mm_materials' AND table_type='BASE TABLE') THEN

    -- 1) Drop the inbound FK (mm_material_kit_items.material_id -> mm_materials), 0 child rows.
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname='mm_material_kit_items_material_id_fkey') THEN
      ALTER TABLE mm_material_kit_items DROP CONSTRAINT mm_material_kit_items_material_id_fkey;
    END IF;

    -- 2) Preserve the empty base table under a deprecated name (rollback-safe).
    ALTER TABLE mm_materials RENAME TO mm_materials_deprecated;

    -- 3) Compatibility VIEW over the canonical master.
    CREATE VIEW mm_materials AS
      SELECT id,
             xom_ashyo       AS name,
             kod             AS code,
             category,
             unit_of_measure,
             barcode,
             barcode         AS sku,
             is_active,
             created_at,
             updated_at
      FROM material_cards;

    -- 4) Repoint the FK to the canonical table (material_cards(id); both serial int).
    ALTER TABLE mm_material_kit_items
      ADD CONSTRAINT mm_material_kit_items_material_id_material_cards_fkey
      FOREIGN KEY (material_id) REFERENCES material_cards(id) ON DELETE RESTRICT;

  END IF;
END $$;
