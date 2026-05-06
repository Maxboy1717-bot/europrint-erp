-- Migration: conflict-discipline-trigger.sql
--
-- Maqsad: Konflikt 'severity=high' bilan yoki 'unresolved' status'ga o'tsa,
-- avtomatik intizom yozuv (discipline_records) yaratiladi.
--
-- Biznes mantiqi:
--   - Konflikt → Mediator → Resolution (success/failed)
--   - Agar resolution muvaffaqiyatsiz bo'lsa → discipline avto-yaratiladi
--   - Yoki severity 'high'/'critical' bo'lsa darhol discipline ochiladi

-- Avval funksiyani yaratamiz
CREATE OR REPLACE FUNCTION escalate_conflict_to_discipline()
RETURNS TRIGGER AS $$
DECLARE
  party1_employee_id integer;
  party2_employee_id integer;
BEGIN
  -- Faqat konflikt yopiq bo'lganda va escalation kerak bo'lsa
  IF (NEW.severity IN ('high', 'critical') AND OLD.severity IS DISTINCT FROM NEW.severity)
     OR (NEW.status = 'unresolved' AND OLD.status IS DISTINCT FROM 'unresolved') THEN

    -- Party'lar employee_id'larini olamiz (party1/party2 user_id formatida bo'lishi kerak)
    -- Agar text bo'lsa, parse qilamiz
    BEGIN
      party1_employee_id := NEW.party1::int;
      party2_employee_id := NEW.party2::int;
    EXCEPTION WHEN OTHERS THEN
      RETURN NEW; -- parse qilolmasak, eskalatsiya qilmaymiz
    END;

    -- Party 1 uchun discipline yozuvi
    IF party1_employee_id IS NOT NULL THEN
      INSERT INTO discipline_records (
        employee_id, violation_type, severity, status,
        violation_date, description, reason, created_at
      ) VALUES (
        party1_employee_id,
        'conflict_escalation',
        NEW.severity,
        'open',
        CURRENT_DATE,
        'Konflikt #' || NEW.id || ' eskalatsiyasi: ' || COALESCE(NEW.description, ''),
        'Konflikt eskalatsiyasi (severity=' || NEW.severity || ')',
        NOW()
      )
      ON CONFLICT DO NOTHING;
    END IF;

    -- Party 2 uchun discipline yozuvi (agar boshqa xodim bo'lsa)
    IF party2_employee_id IS NOT NULL AND party2_employee_id != party1_employee_id THEN
      INSERT INTO discipline_records (
        employee_id, violation_type, severity, status,
        violation_date, description, reason, created_at
      ) VALUES (
        party2_employee_id,
        'conflict_escalation',
        NEW.severity,
        'open',
        CURRENT_DATE,
        'Konflikt #' || NEW.id || ' eskalatsiyasi: ' || COALESCE(NEW.description, ''),
        'Konflikt eskalatsiyasi (severity=' || NEW.severity || ')',
        NOW()
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
DROP TRIGGER IF EXISTS trigger_conflict_escalation ON hr_conflict_reports;

CREATE TRIGGER trigger_conflict_escalation
  AFTER UPDATE ON hr_conflict_reports
  FOR EACH ROW
  EXECUTE FUNCTION escalate_conflict_to_discipline();

-- Verify
SELECT 'Trigger created' AS status,
       (SELECT COUNT(*) FROM pg_trigger WHERE tgname = 'trigger_conflict_escalation') AS exists;
