-- APPROVED: owner 2026-06-06 — layer-formula config (kg<->sheet, vision #7).
-- material_kind distinguishes plain vs corrugated; material_layer_config holds the corrugated
-- layer spec (liner/flute GSMs + take-up). Nullable / no data change to the existing 21 material_cards.
-- take_up_factor is intentionally LEFT NULL (owner fills per material — "joy qoldirib"). Idempotent.

ALTER TABLE material_cards
  ADD COLUMN IF NOT EXISTS material_kind varchar(20);  -- 'plain' | 'corrugated'

CREATE TABLE IF NOT EXISTS material_layer_config (
  id               serial PRIMARY KEY,
  material_card_id integer NOT NULL REFERENCES material_cards(id) ON DELETE CASCADE,
  layer_index      integer NOT NULL,            -- 1, 2, 3 ...
  role             varchar(10) NOT NULL,        -- 'liner' | 'flute'
  gsm              numeric NOT NULL,            -- layer grammage
  flute_type       varchar(2),                  -- A/B/C/E (flute only, nullable)
  take_up_factor   numeric,                     -- owner-edited per material (nullable by design)
  created_at       timestamp NOT NULL DEFAULT now(),
  updated_at       timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_material_layer_config_card ON material_layer_config(material_card_id);
