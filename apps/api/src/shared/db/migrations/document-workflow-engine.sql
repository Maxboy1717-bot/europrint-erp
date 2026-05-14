-- ============================================================================
-- Migration: document-workflow-engine.sql
--
-- PRD Q78-81 ga muvofiq: Hujjat workflow engine
--
-- Talablar:
--   - Org-sxema bo'yicha vertikal (yuqoriga) va gorizontal (yonboshga) yuradi
--   - Hech bir bosqichni sakraymaydi
--   - Imzo tasdiqlash Telegram bot orqali
--   - Status: draft → review → signed → archived
--   - Reject sababi majburiy
-- ============================================================================

-- ─── 1. document_workflow_routes — har hujjat turi uchun yo'nalish ──────────
CREATE TABLE IF NOT EXISTS document_workflow_routes (
  id           SERIAL PRIMARY KEY,
  document_type VARCHAR(50) UNIQUE NOT NULL,  -- 'leave_request', 'advance', 'contract', ...
  name         VARCHAR(200) NOT NULL,
  name_ru      VARCHAR(200),
  -- Vertikal yo'nalish: pastdan yuqoriga, qaysi org-pozitsiyalar tasdiq qiladi
  vertical_steps JSONB DEFAULT '[]'::jsonb,
  -- Gorizontal: parallel yuboriladigan bo'limlar (HR, Finance...)
  horizontal_steps JSONB DEFAULT '[]'::jsonb,
  approval_timeout_hours INTEGER DEFAULT 24,
  is_active    BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 2. document_workflow_instances — har hujjat ishida xolat ───────────────
-- (hr_v2_documents'da current_step bor, lekin to'liq workflow uchun kengroq jadval)
CREATE TABLE IF NOT EXISTS document_workflow_instances (
  id              SERIAL PRIMARY KEY,
  document_id     INTEGER REFERENCES hr_v2_documents(id) ON DELETE CASCADE,
  document_type   VARCHAR(50) NOT NULL,
  initiator_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  current_step_index INTEGER DEFAULT 0,
  current_approver_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  status          VARCHAR(30) DEFAULT 'pending',  -- pending, approved, rejected, escalated, archived
  -- Steps history (har bosqich natijasi)
  steps_history   JSONB DEFAULT '[]'::jsonb,
  rejection_reason TEXT,
  started_at      TIMESTAMPTZ DEFAULT NOW(),
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doc_wf_status ON document_workflow_instances(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_doc_wf_approver ON document_workflow_instances(current_approver_id) WHERE status = 'pending';

-- ─── 3. document_signatures — fizik imzo tasdiqlash (Q78) ───────────────────
CREATE TABLE IF NOT EXISTS document_signatures (
  id              SERIAL PRIMARY KEY,
  document_id     INTEGER REFERENCES hr_v2_documents(id) ON DELETE CASCADE,
  workflow_instance_id INTEGER REFERENCES document_workflow_instances(id) ON DELETE CASCADE,
  signer_id       INTEGER REFERENCES users(id) ON DELETE SET NULL,
  signed_at       TIMESTAMPTZ,
  signature_type  VARCHAR(30) DEFAULT 'physical',  -- physical, digital
  -- Telegram bot orqali tasdiqlash
  telegram_message_id INTEGER,
  approval_status VARCHAR(20) DEFAULT 'pending',   -- pending, approved, rejected
  rejection_reason TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  approved_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_doc_signatures_signer ON document_signatures(signer_id, approval_status);

-- ─── 4. Standart workflow shablonlari ──────────────────────────────────────
INSERT INTO document_workflow_routes (document_type, name, name_ru, vertical_steps, horizontal_steps, approval_timeout_hours)
SELECT * FROM (VALUES
  ('leave_request',
   'Ta''til arizasi',
   'Заявление на отпуск',
   '["bo''lim_boshlig''i", "hr_menejer", "direktor"]'::jsonb,
   '[]'::jsonb,
   24),
  ('advance_request',
   'Avans arizasi',
   'Заявление на аванс',
   '["bo''lim_boshlig''i", "moliya_boshlig''i", "direktor"]'::jsonb,
   '["buxgalteriya"]'::jsonb,
   4),
  ('contract',
   'Mehnat shartnomasi',
   'Трудовой договор',
   '["hr_menejer", "yurist", "direktor"]'::jsonb,
   '[]'::jsonb,
   72),
  ('disciplinary_action',
   'Intizomiy chora',
   'Дисциплинарное взыскание',
   '["bo''lim_boshlig''i", "hr_menejer", "direktor"]'::jsonb,
   '[]'::jsonb,
   24),
  ('certificate_request',
   'Tasdiqnoma so''rovi',
   'Запрос справки',
   '["hr_menejer"]'::jsonb,
   '[]'::jsonb,
   24),
  ('purchase_request',
   'Xarid talabnomasi',
   'Заявка на покупку',
   '["bo''lim_boshlig''i", "ombor_boshlig''i", "moliya_boshlig''i"]'::jsonb,
   '[]'::jsonb,
   48)
) AS t(document_type, name, name_ru, vertical_steps, horizontal_steps, approval_timeout_hours)
WHERE NOT EXISTS (SELECT 1 FROM document_workflow_routes WHERE document_type = t.document_type);

-- ─── 5. Verify ──────────────────────────────────────────────────────────────
SELECT 'document_workflow_routes' AS t, COUNT(*) FROM document_workflow_routes
UNION ALL SELECT 'document_workflow_instances', COUNT(*) FROM document_workflow_instances
UNION ALL SELECT 'document_signatures', COUNT(*) FROM document_signatures
UNION ALL SELECT 'hr_v2_documents', COUNT(*) FROM hr_v2_documents
ORDER BY 1;
