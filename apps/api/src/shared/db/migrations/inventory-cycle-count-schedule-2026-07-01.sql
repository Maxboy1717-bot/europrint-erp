-- APPROVED: egasi vizyon-qurish 2026-07-01, FAZA E (Inventarizatsiya)
-- Maqsad: "Davriy (rejalashtirilgan)" inventarizatsiya oqimi — hozirgacha FE'dagi
--   `scheduledFor` maydoni jim tashlab yuborilardi (DTO'da yo'q, ustun yo'q — Q-40 xato).
--   Bu migratsiya kanonik `inventory_counts` (BASE TABLE) ga 3 ustun qo'shadi:
--     scheduled_for      — rejalashtirilgan sana (FE "New Plan" formasi endi haqiqatan saqlaydi)
--     auto_generated     — TRUE = ABC-chastota cron tomonidan avtomatik yaratilgan cycle-count
--     cycle_abc_segment  — qaysi ABC segment (A/B/C) uchun avto-generatsiya qilingani (audit/trace)
-- FAQAT ADDITIV: ADD COLUMN IF NOT EXISTS. DESTRUCTIVE amal YO'Q. Idempotent.
-- `pos_inventory_counts` / `wms_inventory_counts` VIEW'lari (kanonik `inventory_counts` ustidan,
--   information_schema orqali tasdiqlangan oddiy 1:1 view) ham CREATE OR REPLACE bilan yangilanadi —
--   yangi ustunlar OXIRIGA qo'shiladi (mavjud ustun tartibi buzilmaydi — Postgres view-ustun qoidasi).

-- ---------------------------------------------------------------------------
-- inventory_counts — rejalashtirish + avto-generatsiya ustunlari
-- ---------------------------------------------------------------------------
ALTER TABLE inventory_counts ADD COLUMN IF NOT EXISTS scheduled_for DATE;
ALTER TABLE inventory_counts ADD COLUMN IF NOT EXISTS auto_generated BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE inventory_counts ADD COLUMN IF NOT EXISTS cycle_abc_segment VARCHAR(1);

COMMENT ON COLUMN inventory_counts.scheduled_for IS 'Rejalashtirilgan sanash sanasi (FE New Plan formasi, ilgari jim tashlab yuborilardi)';
COMMENT ON COLUMN inventory_counts.auto_generated IS 'TRUE = ABC-chastota davriy cron tomonidan avtomatik yaratilgan (wms-cycle-count-generator.cron.ts)';
COMMENT ON COLUMN inventory_counts.cycle_abc_segment IS 'Avto-generatsiya qilingan bo''lsa qaysi ABC segment (A/B/C) uchun ekanini bildiradi';

-- ---------------------------------------------------------------------------
-- Defense-in-depth: count_type NOT NULL (default yo'q edi) — jonli tekshiruvda
-- POS `createCount` (pos-inventory-count.service.ts) bu ustunni sxemada umuman
-- ta'riflamagani aniqlandi (Drizzle sxemasi to'ldirildi + servis endi aniq
-- qiymat yuboradi), lekin DB darajasida DEFAULT xavfsizlik-to'ri sifatida ham
-- qo'shiladi — kelajakdagi shunga o'xshash NOT NULL xatosini oldini oladi.
-- ---------------------------------------------------------------------------
ALTER TABLE inventory_counts ALTER COLUMN count_type SET DEFAULT 'spot';

-- ---------------------------------------------------------------------------
-- pos_inventory_counts VIEW — yangi ustunlar oxiriga qo'shildi (mavjud tartib saqlanadi)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW pos_inventory_counts AS
 SELECT id,
    count_number,
    count_date,
    warehouse_id,
    count_type,
    status,
    total_items,
    counted_items,
    variance_items,
    total_book_value,
    total_counted_value,
    total_variance,
    assigned_to,
    approved_by,
    notes,
    created_at,
    completed_at,
    approved_at,
    counted_by,
    updated_at,
    material_id,
    counted_qty,
    system_qty,
    started_by,
    is_warehouse_locked,
    system_snapshot_at,
    total_variance_value,
    gl_document_id,
    pdf_path,
    conducted_by,
    scheduled_for,
    auto_generated,
    cycle_abc_segment
   FROM inventory_counts;

-- ---------------------------------------------------------------------------
-- wms_inventory_counts VIEW — bir xil kanonik baza, bir xil qo'shimcha ustunlar
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW wms_inventory_counts AS
 SELECT id,
    count_number,
    count_date,
    warehouse_id,
    count_type,
    status,
    total_items,
    counted_items,
    variance_items,
    total_book_value,
    total_counted_value,
    total_variance,
    assigned_to,
    approved_by,
    notes,
    created_at,
    completed_at,
    approved_at,
    counted_by,
    updated_at,
    material_id,
    counted_qty,
    system_qty,
    started_by,
    is_warehouse_locked,
    system_snapshot_at,
    total_variance_value,
    gl_document_id,
    pdf_path,
    conducted_by,
    scheduled_for,
    auto_generated,
    cycle_abc_segment
   FROM inventory_counts;
