-- ============================================================
-- FILE: apps/api/src/shared/db/migrations/fix-material-name-sync-trigger-2026-06-22.sql
-- APPROVED: Claude (egasi vakolati) 2026-06-22
-- Fix the broken material_cards name-sync trigger. trg_materials_name_sync fires
-- AFTER UPDATE OF xom_ashyo and calls sync_material_name(), which denormalizes the
-- new name into 5 tables — but it joined on `material_card_id = NEW.id` while ALL
-- FIVE tables actually have a `material_id` column (NOT material_card_id). So ANY
-- rename of a material (UPDATE material_cards SET xom_ashyo=...) threw SQLSTATE
-- 42703 'column material_card_id does not exist' — a latent break on every
-- material name edit (surfaced while unifying the materials world: the repointed
-- /inventory/materials + /mm/materials update paths write material_cards.xom_ashyo).
--
-- Fix: CREATE OR REPLACE the function with the correct join column (material_id).
-- Idempotent. No data change.
-- ============================================================

CREATE OR REPLACE FUNCTION public.sync_material_name()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.xom_ashyo IS DISTINCT FROM OLD.xom_ashyo THEN
    UPDATE material_consumption        SET material_name = NEW.xom_ashyo WHERE material_id = NEW.id;
    UPDATE material_movements          SET material_name = NEW.xom_ashyo WHERE material_id = NEW.id;
    UPDATE material_norms              SET material_name = NEW.xom_ashyo WHERE material_id = NEW.id;
    UPDATE production_material_balance SET material_name = NEW.xom_ashyo WHERE material_id = NEW.id;
    UPDATE inventory_valuation         SET material_name = NEW.xom_ashyo WHERE material_id = NEW.id;
  END IF;
  RETURN NEW;
END $function$;
