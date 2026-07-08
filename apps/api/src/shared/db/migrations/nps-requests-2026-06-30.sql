-- APPROVED: egasi 2026-06-30 "vizyon bo'yicha to'liq"
-- Modul 14 (Marketing) — NPS avto-yig'ish so'rovi (vizyon 14.60: buyurtma/yetkazib berish
-- yopilgach NPS AVTOMATIK yig'iladi). Tekshiruv (2026-06-27): POST /nps qo'lda ishlardi,
-- lekin avto-trigger yo'q edi. nps_responses.score NOT NULL (haqiqiy javob uchun) — shuning
-- uchun pending so'rovlar alohida jadvalda. Listener: logistics.delivery.completed → pending so'rov.
CREATE TABLE IF NOT EXISTS nps_requests (
  id              SERIAL PRIMARY KEY,
  delivery_id     INTEGER,
  sales_order_id  INTEGER,
  customer_id     INTEGER,
  customer_name   TEXT,
  status          TEXT        NOT NULL DEFAULT 'pending',   -- pending|responded|skipped
  nps_response_id INTEGER,
  requested_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at    TIMESTAMPTZ,
  CONSTRAINT ck_nps_req_status CHECK (status IN ('pending','responded','skipped'))
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_nps_req_delivery ON nps_requests (delivery_id) WHERE delivery_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_nps_req_pending ON nps_requests (status) WHERE status = 'pending';
