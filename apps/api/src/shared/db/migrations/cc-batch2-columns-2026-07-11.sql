-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
-- 20-cc#5/#10/#47/#31/#117 — clean-additive columns, no owner decision needed.
ALTER TABLE cc_documents
  ADD COLUMN IF NOT EXISTS ai_draft BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS source_stale BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS viewed_via TEXT,
  ADD COLUMN IF NOT EXISTS manager_summary JSONB NOT NULL DEFAULT '[]'::jsonb;
COMMENT ON COLUMN cc_documents.ai_draft IS '20-cc#5: hujjat AI-intervyu orqali yaratilganmi (o''zgarmas belgi).';
COMMENT ON COLUMN cc_documents.source_stale IS '20-cc#10: ota-hujjat rad/bekor bo''lganda bola-hujjat "eskirgan" deb belgilanadi (avto-bekor emas).';
COMMENT ON COLUMN cc_documents.viewed_at IS '20-cc#47: ERP web GET orqali birinchi ko''rilgan vaqt (huquqiy belgi — Telegram bot bu ustunni yozmaydi).';
COMMENT ON COLUMN cc_documents.viewed_via IS '20-cc#47: "erp_web" — faqat ERP orqali ko''rilganda to''ldiriladi.';
COMMENT ON COLUMN cc_documents.manager_summary IS '20-cc#31/#117: har tasdiq bosqichida qo''shiladigan, o''zgarmas (append-only) rahbar-xulosalar ro''yxati.';

ALTER TABLE cc_approvals
  ADD COLUMN IF NOT EXISTS reference_document_number TEXT;
COMMENT ON COLUMN cc_approvals.reference_document_number IS '20-cc#89: tasdiqlash/rad etishda majburiy — qaysi hujjatga asoslanib qaror qilinganini yozadi.';
