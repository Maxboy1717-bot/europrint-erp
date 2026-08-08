-- APPROVED: Critical-Correctness Fix Loop, item 1.7 (docs/audit/CRITICAL-CORRECTNESS-AUDIT-2026-07-06.md,
--   finding 1.7 "create-order.handler.ts's _generateOrderNumber() reads count()+1 then pads — a
--   read-max race under concurrent order creation. Collision is caught by sales_orders.order_number
--   UNIQUE (confirmed live: sales_orders_order_number_key), so it fails loudly rather than
--   corrupting data, but causes a spurious create failure under load").
--
-- Dry-run verified safe: sales_orders currently has 13 total rows, 0 using the 'SO-' prefix this
-- handler produces (existing data uses 'GT-'/'EP-' prefixes from a different generator) -- zero
-- collision risk starting the sequence at 1. Same proven pattern as invoice_number_seq (C4) and
-- doc-sequences.helper.ts's per-prefix sequences (PO/MES/KIRIM-AKT/etc).
--
-- FAQAT CREATE SEQUENCE (yangi jadval yo'q, destructive amal yo'q).

CREATE SEQUENCE IF NOT EXISTS sales_order_number_seq START WITH 1 INCREMENT BY 1;
