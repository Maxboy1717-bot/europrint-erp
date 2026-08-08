-- APPROVED: egasi 'Ombor+POS vizyon-build' 2026-06-27
--
-- W1-INTRANSIT — Import xom-ashyo YO'LDA kuzatuvi + bojxona/import hujjatlari.
-- Vizyon: jo'natildi → bojxona → keldi (in-transit holat-mashinasi) + import
-- partiyasiga GTD/invoys/sertifikat biriktirish + import lead-time/valyuta.
-- ADDITIVE faqat (Q-46): yangi jadvallar; mavjud WMS yo'liga tegmaydi.
-- "Arrived" bo'lganda mavjud karantin darvozasi (mm_goods_receipts DRAFT →
-- KARANTIN → QC → MAIN) orqali kirim qilinadi (kod tomonida ulanadi).

-- 1) In-transit jo'natma (import partiyasi yo'lda).
CREATE TABLE IF NOT EXISTS wms_in_transit_shipments (
  id                  serial PRIMARY KEY,
  shipment_number     varchar(64) NOT NULL,
  -- supplier_id: mm_vendors VIEW ustidan (FK qo'yib bo'lmaydi — VIEW); wms_supplier_traceability bilan bir xil yondashuv.
  supplier_id         integer,
  supplier_name       text,
  purchase_order_id   integer,
  warehouse_id        integer,
  -- Holat-mashinasi: shipped → customs → arrived (yoki cancelled).
  status              varchar(20) NOT NULL DEFAULT 'shipped'
                        CHECK (status IN ('shipped', 'customs', 'arrived', 'cancelled')),
  -- Import lead-time / valyuta (egasi-DATA bo'lmasa NULL — fabrikatsiya yo'q).
  origin_country      varchar(80),
  eta                 date,
  shipped_date        date,
  customs_date        date,
  arrived_date        date,
  currency            varchar(10),
  declared_value      numeric(15,2),
  incoterm            varchar(16),
  customs_doc_url     text,
  -- Karantin ulanishi: arrived bo'lganda yaratilgan qabul (mm_goods_receipts.id).
  goods_receipt_id    integer,
  notes               text,
  created_by          integer,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wms_in_transit_status
  ON wms_in_transit_shipments (status);
CREATE INDEX IF NOT EXISTS idx_wms_in_transit_supplier
  ON wms_in_transit_shipments (supplier_id);

-- 2) Import hujjatlari (GTD/invoys/sertifikat) — jo'natmaga biriktiriladi.
CREATE TABLE IF NOT EXISTS wms_import_documents (
  id            serial PRIMARY KEY,
  shipment_id   integer NOT NULL REFERENCES wms_in_transit_shipments(id) ON DELETE CASCADE,
  doc_type      varchar(20) NOT NULL
                  CHECK (doc_type IN ('GTD', 'invoice', 'cert', 'packing_list', 'other')),
  doc_number    varchar(120),
  file_url      text,
  issued_date   date,
  notes         text,
  uploaded_by   integer,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wms_import_documents_shipment
  ON wms_import_documents (shipment_id);
