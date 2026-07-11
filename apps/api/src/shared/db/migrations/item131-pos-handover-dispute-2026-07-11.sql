-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) -- Q-35
-- 19-pos #131 -- "Yuk topshirishda nomuvofiqlik (topshir<->qabul nizo)"
--   (Handover dispute state -- handed-over vs received qty mismatch).
--   Vision: TASDIQ-2146 Sec19 #81 (EP-POS-081) / docs/audit/_SCHEMA-BUILD-QUEUE-2026-07-11.md #131 /
--   docs/audit/_PHASE2-OWNER-DECISIONS-2026-07-11.md #131 -- farq->nizo->boshliq.
--   Routing to dept-head reuses the ALREADY-EXISTING role-based Telegram routing
--   (eventRepo.findByRoles) -- that part is NOT rebuilt here, only the state.
--
-- pos_movement_confirmations.decision (pos_confirm_decision_enum) currently
-- only has APPROVED/REJECTED/REWORK (verified live via
-- SELECT enumlabel FROM pg_enum WHERE enumtypid = 'pos_confirm_decision_enum'::regtype).
-- Add 'DISPUTED' (uppercase -- matches the existing casing convention of the
-- other three values) + two nullable NUMERIC(18,4) columns (matching
-- numericMoney's DB type) to record the compared quantities.
--
-- No tolerance/threshold specified by the owner grant -- ANY mismatch is a
-- dispute, so no business_settings threshold is fabricated here (Q-40).
--
-- Additive & idempotent: ADD VALUE IF NOT EXISTS / ADD COLUMN IF NOT EXISTS.
-- Existing rows are unaffected -- both new columns are NULL until a caller
-- supplies them (StockLedgerService.recordConfirmation only compares/forces
-- DISPUTED when BOTH handedOverQty and receivedQty are passed; all existing
-- call sites pass neither, so their behavior is unchanged).

ALTER TYPE pos_confirm_decision_enum ADD VALUE IF NOT EXISTS 'DISPUTED';

ALTER TABLE pos_movement_confirmations ADD COLUMN IF NOT EXISTS handed_over_qty numeric(18,4);
ALTER TABLE pos_movement_confirmations ADD COLUMN IF NOT EXISTS received_qty    numeric(18,4);
