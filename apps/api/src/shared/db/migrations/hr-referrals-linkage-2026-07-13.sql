-- APPROVED: owner mandate (MENEJER "drive to vision non-stop", chat 2026-07-13) —
-- Referral Tizimi completion directive. Additive-only ALTER TABLE (Q-35): no new
-- CREATE TABLE. Builds on the existing real `hr_referrals` table (P1.26.1,
-- commit 3da92fb4) rather than a second parallel table.
--
-- Links hr_referrals to:
--   1. candidates(id)  — the real recruiting-pipeline candidate identity, so a
--      referral can be auto-tracked as the candidate moves through
--      hr_candidate_funnels stages (candidate.stage-changed event).
--   2. employees(id)   — the employee record created once the candidate is
--      actually hired, so ProbationCompleted (apps/api/src/modules/hr/onboarding/
--      onboarding.service.ts completeProbation()) can find the referral row and
--      trigger the real referral-bonus payroll line item (bonus_payments), per
--      vision docs/vision/_parts/02-hr.md #12/#20/#21 + E6 fairness principle
--      (bonus is owed even if the referring employee has since left).

ALTER TABLE hr_referrals
  ADD COLUMN IF NOT EXISTS candidate_id      INTEGER REFERENCES candidates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS hired_employee_id INTEGER REFERENCES employees(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS hr_referrals_candidate_idx      ON hr_referrals(candidate_id);
CREATE INDEX IF NOT EXISTS hr_referrals_hired_employee_idx ON hr_referrals(hired_employee_id);

-- Business-settings key for the referral bonus amount (CLAUDE.md rule: thresholds/
-- amounts are NEVER hardcoded and NEVER asked in chat — inserted with a sensible
-- default, owner adjusts later via the existing Business Settings CRUD screen).
INSERT INTO business_settings (module, setting_key, label, value_type, value_num, unit, description, is_active)
SELECT 'hr', 'hr.referral_bonus_amount',
       'Xodim tavsiyasi bonusi (ishga qabul + probatsiya)',
       'amount', 500000, 'som',
       'Xodim tavsiya qilgan nomzod ishga qabul qilinib, probatsiya (sinov) muddatini muvaffaqiyatli tugatgach, tavsiya qilgan xodimga to''lanadigan bir martalik bonus. Tavsiya qiluvchi xodim shu vaqtga qadar kompaniyadan ketgan bo''lsa ham to''lanadi (E6 — adolat tamoyili, vizyon docs/vision/_parts/02-hr.md #12/#20/#21).',
       true
WHERE NOT EXISTS (SELECT 1 FROM business_settings WHERE setting_key = 'hr.referral_bonus_amount');
