-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
-- ============================================================
-- FILE: apps/api/src/shared/db/migrations/qc-dispatch-conclusions-2026-07-11.sql
-- Vision 09-qc #26 — Yakuniy sifat xulosasi: PP buyurtma "Yopildi" da bitta
--   yakuniy xulosa; qisman yetkazishda har dispatch tasdiqlanganda bitta
--   per-dispatch xulosa — jami N+1 yozuv (N ta dispatch + 1 yakuniy).
--   delivery_id NULL = yagona yakuniy (final) PP-close xulosasi.
--   delivery_id SET  = bitta per-partial-shipment (dispatch) xulosasi.
-- Partial unique index'lar N+1 shaklini kafolatlaydi: buyurtmaga ko'pi bilan
--   1 ta 'final', (buyurtma, dispatch) juftligiga ko'pi bilan 1 ta xulosa.
-- FK targets live-verified with integer PK: production_orders(id), deliveries(id), users(id).
-- Idempotent (IF NOT EXISTS). Yangi jadval — mavjud yozuvlarga ta'sir qilmaydi.
-- ============================================================

CREATE TABLE IF NOT EXISTS qc_dispatch_conclusions (
  id                  SERIAL PRIMARY KEY,
  production_order_id INTEGER NOT NULL REFERENCES production_orders(id) ON DELETE CASCADE,
  delivery_id         INTEGER REFERENCES deliveries(id) ON DELETE SET NULL,
  conclusion_type     VARCHAR(20) NOT NULL DEFAULT 'dispatch',
  total_inspected     INTEGER NOT NULL DEFAULT 0,
  total_passed        INTEGER NOT NULL DEFAULT 0,
  total_defects       INTEGER NOT NULL DEFAULT 0,
  defect_rate         NUMERIC(18,4),
  verdict             VARCHAR(20) NOT NULL DEFAULT 'pending',
  summary             JSONB,
  notes               TEXT,
  concluded_by        INTEGER REFERENCES users(id) ON DELETE SET NULL,
  concluded_at        TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT qc_dispatch_conclusions_type_chk    CHECK (conclusion_type IN ('dispatch','final')),
  CONSTRAINT qc_dispatch_conclusions_verdict_chk CHECK (verdict IN ('pending','passed','conditional_pass','failed')),
  CONSTRAINT qc_dispatch_conclusions_final_no_delivery_chk
    CHECK ((conclusion_type = 'final') = (delivery_id IS NULL))
);

-- N+1 kafolat: har PP buyurtmaga ko'pi bilan bitta yakuniy (delivery_id IS NULL).
CREATE UNIQUE INDEX IF NOT EXISTS uq_qc_dispatch_conclusions_final
  ON qc_dispatch_conclusions (production_order_id)
  WHERE delivery_id IS NULL;

-- ...va (buyurtma, dispatch) juftligiga ko'pi bilan bitta xulosa.
CREATE UNIQUE INDEX IF NOT EXISTS uq_qc_dispatch_conclusions_dispatch
  ON qc_dispatch_conclusions (production_order_id, delivery_id)
  WHERE delivery_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_qc_dispatch_conclusions_order
  ON qc_dispatch_conclusions (production_order_id);
