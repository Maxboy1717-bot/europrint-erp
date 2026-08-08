-- APPROVED: egasi (Bilim Grafi Faza B, 2026-08-08) — kg-staleness.cron.ts uchun
-- "QC jimlik" chegarasi. Threshold qiymat CHAT'DA SO'RALMAYDI — mavjud
-- alert_thresholds jadvaliga sezilarli default bilan qo'shiladi, mavjud Admin
-- CRUD orqali sozlanadi (alert-thresholds.reader.ts naqshi, wms.lot_expiring/
-- wms.low_stock bilan bir xil). Idempotent (ON CONFLICT DO NOTHING).
INSERT INTO alert_thresholds (alert_type, threshold_value, unit, is_active, description, created_at, updated_at)
VALUES (
  'kg.qc_silence_hours', 24, 'hours', true,
  'Bilim Grafigi: ishlab chiqarish buyurtmasi MES tugagandan keyin shuncha soat ichida QC tekshiruvi kelmasa, bog''lanish "uzilgan" deb belgilanadi (AI-overlay signali).',
  NOW(), NOW()
)
ON CONFLICT (alert_type) DO NOTHING;
