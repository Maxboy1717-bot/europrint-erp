-- APPROVED: egasi 2026-07-02, QC-birlashtirish
-- Modul 09 (QC) — qc_braks (POST /qc/braks -> QcDefectsExtendedController.createBrak)
-- va qc_defects (POST /qc/defects -> ReportDefectCommand CQRS) ikkita alohida yozuvchi
-- edi (ikki-dunyo). Birlashtirish: qc_braks-ga xos 6 ustun qc_defects-ga additive
-- ALTER TABLE bilan qo'shiladi -- endi brak yozuvi ham CQRS ReportDefectCommand
-- oqimidan qc_defects jadvaliga yoziladi. qc_braks jadvali DROP QILINMAYDI (Q-39/Q-46) --
-- tarixiy yozuvlar saqlanadi, o'quvchilar ikkala jadvalni ham birlashtirib o'qiydi.
ALTER TABLE qc_defects ADD COLUMN IF NOT EXISTS papka_order_id INTEGER;
ALTER TABLE qc_defects ADD COLUMN IF NOT EXISTS stage          TEXT;
ALTER TABLE qc_defects ADD COLUMN IF NOT EXISTS cost_impact    NUMERIC;
ALTER TABLE qc_defects ADD COLUMN IF NOT EXISTS is_reworkable  BOOLEAN;
ALTER TABLE qc_defects ADD COLUMN IF NOT EXISTS reworked       BOOLEAN;
ALTER TABLE qc_defects ADD COLUMN IF NOT EXISTS brak_date      DATE;

CREATE INDEX IF NOT EXISTS idx_qc_defects_papka_order_id ON qc_defects (papka_order_id) WHERE papka_order_id IS NOT NULL;
