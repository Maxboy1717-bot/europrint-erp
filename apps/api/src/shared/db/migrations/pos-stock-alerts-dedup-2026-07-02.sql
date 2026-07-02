-- APPROVED: egasi 2026-07-02 "hamma muammolarni to'g'irlash — vizyon bo'yicha"
-- pos_stock_alerts FLOOD tozalash (G9-2, OMBOR TAKSONOMIYA + DATA-GIGIYENA):
--   Muammo: soatlik cron (stock-ledger.service evaluateStockAlerts) har safar yangi
--   LOW_STOCK qatori yozgan — 1078 ta BIR XIL ochiq alert (material_id=1, warehouse_id=16).
--   Yechim: (1) har (material_id, warehouse_id, alert_type) uchun faqat ENG SO'NGGI ochiq
--   alert qoladi, qolgan duplikatlar o'chiriladi; (2) UNIQUE partial index flood qaytishini
--   DB darajasida bloklaydi (kod-darajali dedup stock-ledger.repository'da qo'shildi).
-- Idempotent: qayta ishga tushirish xavfsiz.

BEGIN;

-- 1) Duplikat ochiq alertlarni tozalash — har (material, ombor, tur) uchun eng so'nggisi qoladi.
DELETE FROM pos_stock_alerts a
USING pos_stock_alerts b
WHERE a.material_id  = b.material_id
  AND a.warehouse_id = b.warehouse_id
  AND a.alert_type   = b.alert_type
  AND a.resolved     = false
  AND b.resolved     = false
  AND (a.created_at < b.created_at OR (a.created_at = b.created_at AND a.id < b.id));

-- 2) UNIQUE partial index — bitta (material, ombor, tur) uchun faqat bitta OCHIQ alert.
CREATE UNIQUE INDEX IF NOT EXISTS uq_pos_stock_alerts_open
  ON pos_stock_alerts (material_id, warehouse_id, alert_type)
  WHERE resolved = false;

COMMIT;
