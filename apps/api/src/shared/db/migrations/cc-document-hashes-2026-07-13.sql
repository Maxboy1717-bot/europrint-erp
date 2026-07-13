-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
-- CC-COMPLETE-FRESH-ANALYSIS-2026-07-11.md item #12/#45/#50 ("Outbox + Finance reversal",
-- P0 finding #12, D-bosqich tavsiya #13-14): only the `document_hashes` half of that item is
-- built here — a SHA-256 (or later algorithm) fingerprint of the FINAL signed PDF export
-- (CcPdfService.generate(), apps/api/src/modules/communication-center/application/cc-pdf.service.ts)
-- so Finance can verify byte-for-byte integrity of a document before acting on a reversal
-- (the "#6 COR" use case the audit names). This is NOT the same artifact as the existing
-- cc_approvals.signature_hash (cc-pin.service.ts:69-73, format 'cc:v1:{ts}:{sha256}') — that
-- hash proves a specific PIN-signed approval STEP happened; document_hashes proves the
-- rendered PDF BYTES were not altered afterwards. Complementary, not duplicative.
--
-- MUHIM — the `cc_outbox` half of the same audit item is INTENTIONALLY NOT created here.
-- Verified live 2026-07-13: this repo already has a generic transactional-outbox
-- (`domain_events` table — apps/api/src/shared/db/schema-outbox.ts — plus
-- OutboxRepository / OutboxEventWriter / OutboxPublisher under
-- apps/api/src/modules/shared/outbox/, shipped commit 21d775de on 2026-06-26, i.e. BEFORE
-- this audit doc). `OutboxEventWriter.onModuleInit()` subscribes to the global CQRS EventBus
-- and durably persists EVERY `eventBus.publish(...)` call into `domain_events` with zero
-- extra per-module code. CC already publishes through that same EventBus
-- (CcSpawnRequestedEvent — cc-webhook.controller.ts:105; CcDocumentFullyApprovedEvent —
-- cc-workflow.service.ts:279), so both of CC's domain events ALREADY flow into the durable
-- outbox today. A second, CC-only `cc_outbox` table would duplicate `domain_events` exactly
-- as the sibling same-day migration
-- apps/api/src/shared/db/migrations/qc-brak-snapshot-2026-07-11.sql:6-10 already flagged for
-- QC ("Yangi `qc_outbox` YARATILMAYDI — u domain_events ni takrorlagan bo'lardi"). Also note:
-- `cc_documents.basket_state` already has a live value literally named `'outbox'` (the
-- "Outbox" basket of the Inbox/Pending/Outbox 3-basket UI) — a table named `cc_outbox` would
-- collide in meaning with that pre-existing concept. If a Finance-specific dispatcher/consumer
-- is later approved, it should drain the existing `domain_events` table (filtered by
-- aggregate_type/event_name), not a new duplicate queue. Flagged as a follow-up item — not
-- built here (out of scope for this schema-only draft, Q-31).

CREATE TABLE IF NOT EXISTS document_hashes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id   UUID NOT NULL REFERENCES cc_documents(id) ON DELETE CASCADE,
  hash          VARCHAR(128) NOT NULL,
  algorithm     VARCHAR(20) NOT NULL DEFAULT 'sha256',
  created_at    TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_document_hashes_document_id ON document_hashes (document_id);
