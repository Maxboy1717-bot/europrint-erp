-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
-- pp-material-reservations-priority-fifo-2026-07-11.sql
-- Vision 07-pp #30 (EP-PP-068) — Material rezerv prioriteti:
--   ustuvorlik darajasi (Shoshilinch/Yuqori/Oddiy/Past) = asosiy mezon;
--   teng ustuvorlikda kelish tartibi (FIFO); faqat direktor/egasi qo'lda
--   prioritetni o'zgartira oladi (YOZMA + sabab, audit); ikkinchi rejaga
--   "material yetarli emas — kutish" + taxminiy sana ko'rsatiladi.
--
-- pp_material_reservations = PP-owned MRP priority-reservation ledger. This is
-- NOT a duplicate of the WMS physical reservation ledger (stock_reservations) or
-- the POS one (pos_stock_reservations): those record physical-stock HOLDS per
-- warehouse (issued/remaining qty). This records the PP planning DECISION of which
-- production order gets first claim on a scarce material, ranked by priority then
-- FIFO, with a director-only manual override. Module boundary (MODUL_SHARTNOMASI):
-- PP owns this table; it never writes WMS's stock_reservations. `pp_material_reservations`
-- confirmed ABSENT live before this migration (to_regclass NULL).
--
-- FK types verified live (information_schema): production_orders.id INTEGER (serial),
-- material_cards.id INTEGER, users.id INTEGER — every INTEGER FK is type-correct.
-- qty NUMERIC(18,4) matches lib/db numericMoney().
--
-- Additive / idempotent: CREATE TABLE IF NOT EXISTS + CREATE INDEX IF NOT EXISTS,
-- a brand-new table — no existing row is touched (Q-39/Q-46 non-regression).
--
-- Qo'llash: psql postgresql://postgres:postgres@localhost:5432/europrint -f pp-material-reservations-priority-fifo-2026-07-11.sql

CREATE TABLE IF NOT EXISTS pp_material_reservations (
  id                        SERIAL PRIMARY KEY,
  production_order_id       INTEGER       NOT NULL REFERENCES production_orders(id) ON DELETE CASCADE,
  material_id               INTEGER       NOT NULL REFERENCES material_cards(id)    ON DELETE RESTRICT,
  qty                       NUMERIC(18,4) NOT NULL,
  -- Allocation priority: 1=Shoshilinch(urgent) 2=Yuqori(high) 3=Oddiy(normal) 4=Past(low).
  -- Default 3 mirrors production_orders.priority default; lower value = allocated first.
  priority                  INTEGER       NOT NULL DEFAULT 3,
  -- FIFO tie-break: on equal priority the earlier reserved_at is allocated first.
  reserved_at               TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  status                    VARCHAR(20)   NOT NULL DEFAULT 'reserved',
  -- "material yetarli emas — kutish": estimated availability date shown to a waiting reservation.
  estimated_available_date  DATE,
  -- Director/owner manual-override audit (YOZMA + sabab) — NULL until an override happens.
  priority_overridden_by    INTEGER       REFERENCES users(id) ON DELETE SET NULL,
  override_reason           TEXT,
  overridden_at             TIMESTAMPTZ,
  released_at               TIMESTAMPTZ,
  created_at                TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_pp_material_reservations_priority CHECK (priority BETWEEN 1 AND 4),
  CONSTRAINT chk_pp_material_reservations_status   CHECK (status IN ('reserved','waiting','released','issued'))
);

-- Allocation-ranking index: the priority -> FIFO queue reads (material_id, priority ASC, reserved_at ASC).
CREATE INDEX IF NOT EXISTS idx_pp_material_reservations_alloc  ON pp_material_reservations (material_id, priority, reserved_at);
CREATE INDEX IF NOT EXISTS idx_pp_material_reservations_order  ON pp_material_reservations (production_order_id);
CREATE INDEX IF NOT EXISTS idx_pp_material_reservations_status ON pp_material_reservations (status);
