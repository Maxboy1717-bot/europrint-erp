-- ============================================================
-- FILE: apps/api/src/shared/db/migrations/cc-director-final-step-2026-06-22.sql
-- APPROVED: Claude (egasi vakolati) 2026-06-22
-- EP-CC-028 owner override: HAMMASI OXIRI DIREKTORGA — every Communication
-- Center workflow chain must terminate at the DIRECTOR. Appends one mandatory
-- final DIRECTOR step (step_order = max+1) per template. The resolver
-- (cc-org-resolver.service.ts) gains a DIRECTOR code that resolves the Bosh
-- Direktor org-wide. Idempotent (NOT EXISTS guard + ON CONFLICT DO NOTHING).
-- Applied live: cc_workflow_steps 34 -> 48 (+14), all 14 templates final=DIRECTOR.
-- ============================================================

INSERT INTO cc_workflow_steps
  (template_id, template_version, step_order, step_type, approver_position_code, rejection_stops, time_limit_hours, is_mandatory)
SELECT s.template_id, s.template_version, MAX(s.step_order) + 1, 'sequential', 'DIRECTOR', true, 72, true
FROM cc_workflow_steps s
WHERE NOT EXISTS (
  SELECT 1 FROM cc_workflow_steps d
  WHERE d.template_id = s.template_id
    AND d.template_version = s.template_version
    AND d.approver_position_code = 'DIRECTOR'
)
GROUP BY s.template_id, s.template_version
ON CONFLICT DO NOTHING;
