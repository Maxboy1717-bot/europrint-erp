-- APPROVED: Claude(egasi vakolati) 2026-06-20
-- seed-02b-razryad-native-schema.sql
-- WHY: The LIVE backend (node dist/main, DATABASE_URL=localhost:5432/europrint) connects to a
--   NATIVE Windows postgres on host port 5432 — NOT the Docker `europrint-db` container. The
--   container ALSO publishes 5432, but the native server owns the host port first, so every
--   host-side connection (localhost/127.0.0.1) lands on the native DB. The earlier foundation
--   seed (seed-00-foundation-canonical) was applied to the CONTAINER via `docker exec`, so the
--   backend never saw the 6 razryad rows -> GET /api/org-structure/razryad-levels returned [].
--
-- This seed targets the NATIVE schema, which differs from the container/idealized schema:
--   native razryad_levels = (level, name, min_requirement, salary_min, salary_max, exam_type,
--                            certificate, description, is_active, ...)  -- NO name_uz/coefficient/min_months
-- Apply against the DB the backend actually reads:
--   psql postgresql://postgres:postgres@127.0.0.1:5432/europrint -f docs/migration/seed/seed-02b-razryad-native-schema.sql
-- Idempotent: ON CONFLICT (level) DO UPDATE.

BEGIN;

INSERT INTO razryad_levels (level, name, description, is_active, created_at, updated_at) VALUES
  (1, '1-razryad', 'Boshlang''ich daraja. Yangi xodim, 0-3 oy tajriba.',           true, NOW(), NOW()),
  (2, '2-razryad', 'Assistent. Asosiy vazifalarni mustaqil bajaradi. 3+ oy.',      true, NOW(), NOW()),
  (3, '3-razryad', 'Mutaxassis. Barcha standart vazifalar. 6+ oy.',                true, NOW(), NOW()),
  (4, '4-razryad', 'Katta mutaxassis. Murakkab vazifalar, mentor. 12+ oy.',        true, NOW(), NOW()),
  (5, '5-razryad', 'Yetakchi. Jarayon va standart yaratadi. 18+ oy.',              true, NOW(), NOW()),
  (6, '6-razryad', 'Ekspert/Master. Yuqori malaka, strategiya. 24+ oy.',          true, NOW(), NOW())
ON CONFLICT (level) DO UPDATE SET
  name        = EXCLUDED.name,
  description = EXCLUDED.description,
  is_active   = true,
  updated_at  = NOW();

COMMIT;

-- Tekshirish:
-- SELECT level, name, is_active FROM razryad_levels ORDER BY level;  -- 6 qator, hammasi is_active=true
