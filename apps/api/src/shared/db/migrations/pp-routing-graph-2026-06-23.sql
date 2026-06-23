-- Wave 2 (500K_QURISH_REJA_PROMPT.md): PP nochiziqli routing graf + rework qaytishlar.
-- APPROVED: Claude (egasi vakolati) 2026-06-23
-- Additive, idempotent (IF NOT EXISTS). Bu STRUKTURA (graf-edge ustunlar + io-rules jadval);
-- qiymatlar (har sex kirish/chiqish/qaytish royxati) egasi-DATA (22-sex routing), keyin to'ldiriladi.

-- routing_operations: graf-navigatsiya (chiziqli sequence'dan tashqari predecessor/successor/return).
ALTER TABLE routing_operations ADD COLUMN IF NOT EXISTS predecessor_operation_id INTEGER;
ALTER TABLE routing_operations ADD COLUMN IF NOT EXISTS successor_operation_ids   JSONB;
ALTER TABLE routing_operations ADD COLUMN IF NOT EXISTS return_to_operation_id    INTEGER;
ALTER TABLE routing_operations ADD COLUMN IF NOT EXISTS routing_condition         VARCHAR(50);
COMMENT ON COLUMN routing_operations.predecessor_operation_id IS 'Graf: oldingi operatsiya (nochiziqli)';
COMMENT ON COLUMN routing_operations.successor_operation_ids IS 'Graf: keyingi operatsiyalar royxati (jsonb int[])';
COMMENT ON COLUMN routing_operations.return_to_operation_id IS 'Rework: brak/shart bilan qaysi operatsiyaga qaytadi';
COMMENT ON COLUMN routing_operations.routing_condition IS 'Shartli marshrut (defect/quality bilan)';

-- production_order_operations: rework qaytish tarixi (tisneniya->karton tigel qaytishi izlanadi).
ALTER TABLE production_order_operations ADD COLUMN IF NOT EXISTS returned_from_operation_id INTEGER;
ALTER TABLE production_order_operations ADD COLUMN IF NOT EXISTS rework_reason              TEXT;
ALTER TABLE production_order_operations ADD COLUMN IF NOT EXISTS rework_count               INTEGER NOT NULL DEFAULT 0;

-- work_center_io_rules: sex kirish/chiqish routing qoidalari (tigel->faqat packing; tisneniya->karton tigel/rezka/skleyka return).
CREATE TABLE IF NOT EXISTS work_center_io_rules (
  id                   SERIAL PRIMARY KEY,
  work_center_id       INTEGER NOT NULL REFERENCES work_centers(id) ON DELETE CASCADE,
  allowed_predecessors JSONB NOT NULL DEFAULT '[]'::jsonb,
  allowed_successors   JSONB NOT NULL DEFAULT '[]'::jsonb,
  rework_allowed_to    JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS work_center_io_rules_wc_idx ON work_center_io_rules(work_center_id);
COMMENT ON TABLE work_center_io_rules IS 'Sex kirish/chiqish routing qoidalari (nochiziqli graf). Qiymatlar egasi 22-sex routing royxatidan (Q-40 — soxta emas).';
