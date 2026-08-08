-- APPROVED: owner 2026-06-08
-- D1: mes_shift_handovers is an auto-updatable VIEW over base table shift_handovers.
--     shiftHandover INSERT sends `notes` (DTO field) but neither base nor view had it.
--     Add notes to the BASE table, then recreate the view to expose it (appended at end,
--     so the view stays auto-updatable and the INSERT through the view persists notes).
ALTER TABLE shift_handovers ADD COLUMN IF NOT EXISTS notes text;

CREATE OR REPLACE VIEW mes_shift_handovers AS
  SELECT id, from_shift_id, to_shift_id, handover_date, department, machine_status,
         pending_tasks, quality_issues, safety_notes, material_status, handed_over_by,
         received_by, signature_data, status, created_at, outgoing_supervisor, issues,
         handover_time, pending_tasks_count, notes
    FROM shift_handovers;
