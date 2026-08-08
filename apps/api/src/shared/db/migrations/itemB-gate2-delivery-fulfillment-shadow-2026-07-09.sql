-- APPROVED: egasi (owner, Muslimbek) 2026-07-09 — Batch 3 Item B, GATE 2 (SHADOW-only, stock'siz).
--   Tasdiqlangan DELIVERY_REQUEST zayavka POS Monitorda "bajarildi" deb belgilanganda, YANGI ALOHIDA
--   capture faqat SHU shadow jadvaliga yozadi — warehouse_stock ga TEGMAYDI, #51 listener'ga TEGMAYDI,
--   mavjud stock-kamaytiruvchi endpointlarni (pos/operations/issue, pos/movements) qayta ISHLATMAYDI.
--   Gate 3 (shadow-compare) shu jadvaldagi "would_decrement_qty" ni #51 ning haqiqiy kamayishi bilan solishtiradi.
--
--   Havola: document_id -> cc_documents.id (zayavka), document_ref -> cc_documents.document_number.
--   material_card_id -> material_cards.id (integer). warehouse_id -> ombor. gate='shadow' (haqiqiy decrement EMAS).
--
-- Yangi jadval (egasi-tasdiqlangan Gate 2 qurilishi qismi). Idempotent (IF NOT EXISTS). Boshqa jadvallarga tegmaydi.

CREATE TABLE IF NOT EXISTS delivery_request_fulfillment_shadow (
  id                    serial PRIMARY KEY,
  document_id           uuid NOT NULL,                          -- cc_documents.id (tasdiqlangan DELIVERY_REQUEST)
  document_ref          varchar(100),                           -- cc_documents.document_number (inson-o'qiydigan havola)
  warehouse_id          integer,                                -- qaysi ombordan (kelajakda shu yerdan kamayadi — Gate 4)
  material_card_id      integer,                                -- nima (material_cards.id)
  would_decrement_qty   numeric(18,4) NOT NULL DEFAULT 0,       -- qancha (Gate 3 shuni #51 haqiqiysi bilan solishtiradi)
  captured_by           integer,                                -- kim (foydalanuvchi)
  captured_at           timestamptz NOT NULL DEFAULT now(),     -- qachon
  gate                  varchar(20) NOT NULL DEFAULT 'shadow'   -- 'shadow' = HAQIQIY decrement EMAS (Gate 2/3)
);

CREATE INDEX IF NOT EXISTS idx_delivery_request_fulfillment_shadow_document
  ON delivery_request_fulfillment_shadow (document_id);
