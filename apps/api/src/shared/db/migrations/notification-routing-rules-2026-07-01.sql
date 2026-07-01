-- APPROVED: egasi vizyon-qurish 2026-07-01, FAZA Bildirishnoma (config-driven)
-- Modul 18 (Bildirishnoma) — hodisa-turi → nishon(rol/xodim) marshrutlash jadvali.
-- Vizyon (docs/audit/decisions/18-notifications.md EP-NTF-007/EP-NTF-079): egasi/admin
-- "qaysi hodisa kimga (rol/xodim) borishi"ni sozlay olishi kerak — kod ichidagi
-- hardcoded rol (masalan qc-failed-notification.listener.ts 'production_manager',
-- pos-low-stock.job.ts 'pos_manager', mro-machine-stopped-notification.listener.ts
-- 'director') o'rniga markazlashgan, admin boshqaradigan jadval.
-- Tekshiruv (2026-07-01 audit): bu jadval UMUMAN yo'q edi — real hodisa-detektorlar
-- rolni kodda qattiq yozgan edi.
-- Iste'mol qiluvchi: notification-routing.repository.ts (resolveTargets/resolveUserIds/resolveRoles).
-- Bir event_type uchun bir nechta qator bo'lishi mumkin (fan-out — bir nechta rol/xodimga).
-- Qator topilmasa — chaqiruvchi kod eski hardcoded rolga qaytadi (regressiya yo'q, Q-39).
CREATE TABLE IF NOT EXISTS notification_routing_rules (
  id              SERIAL PRIMARY KEY,
  event_type      TEXT        NOT NULL,                  -- masalan 'wms.low_stock', 'qc.failed', 'wms.lot_expiring'
  target_role     TEXT,                                  -- NULL bo'lsa target_user_id ishlatiladi
  target_user_id  INTEGER REFERENCES users(id) ON DELETE CASCADE,
  is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT notification_routing_rules_target_chk
    CHECK (target_role IS NOT NULL OR target_user_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_notification_routing_rules_event_type
  ON notification_routing_rules (event_type) WHERE is_active = TRUE;

-- Boshlang'ich (default) qatorlar — hozirgi hardcoded xatti-harakatni AYNAN aks ettiradi
-- (regressiya yo'q); egasi keyin FE/CRUD orqali o'zgartira oladi.
INSERT INTO notification_routing_rules (event_type, target_role, notes)
SELECT v.event_type, v.target_role, v.notes
FROM (VALUES
  ('wms.low_stock',     'pos_manager',        'Ombor past qoldiq — avval pos-low-stock.job.ts da qattiq yozilgan edi'),
  ('qc.failed',         'production_manager', 'QC rad — avval qc-failed-notification.listener.ts da qattiq yozilgan edi'),
  ('mro.machine_stopped','director',          'Uskuna to''xtashi — avval mro-machine-stopped-notification.listener.ts da qattiq yozilgan edi'),
  ('wms.lot_expiring',  'director',           'Ombor lot/partiya muddati tugashi — yangi (avval hech qanday trigger yo''q edi)')
) AS v(event_type, target_role, notes)
WHERE NOT EXISTS (
  SELECT 1 FROM notification_routing_rules r WHERE r.event_type = v.event_type AND r.target_role = v.target_role
);
