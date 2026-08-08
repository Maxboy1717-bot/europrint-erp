-- =============================================================================
-- DEMO SEED: MES / IoT namuna ma'lumotlari
-- Fayl: docs/migration/seed/seed-demo-02-mes-iot.sql
-- Maqsad: Dashboard vizyonini korsatish uchun demo data (real emas)
-- Idempotent: ON CONFLICT DO NOTHING yoki oldin tekshirish
-- Qollash: psql "<DATABASE_URL>" -f seed-demo-02-mes-iot.sql
-- DRIFT eslatmalar:
--   iot_sensor_readings = VIEW over sensor_readings (device_id NOT NULL)
--   mes_production_sessions = VIEW over production_sessions (production_order_id, equipment_id, worker_id NOT NULL)
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. IoT DEVICES  (6 ta mashina, turli sexlar)
-- ---------------------------------------------------------------------------
INSERT INTO iot_devices (device_code, device_type, name, location, status, last_seen_at, thresholds)
VALUES
  ('DEV-OFFSET-1',   'machine', 'Offset Bosma 1 (Ryobi 3302)',    'Bosma sexi, joy 1',     'active',  NOW() - INTERVAL '3 minutes',  '{"temp_max":75,"vibr_max":5.0}'::jsonb),
  ('DEV-OFFSET-2',   'machine', 'Offset Bosma 2 (Heidelberg SM)', 'Bosma sexi, joy 2',     'active',  NOW() - INTERVAL '5 minutes',  '{"temp_max":75,"vibr_max":5.0}'::jsonb),
  ('DEV-FLEXO-1',    'machine', 'Flexoprint 1 (qadoqlash)',       'Qadoqlash sexi, joy 1', 'active',  NOW() - INTERVAL '2 minutes',  '{"temp_max":70,"vibr_max":4.5}'::jsonb),
  ('DEV-CUTTING-1',  'machine', 'Qirqish dastgohi 1 (Polar 115)','Finishing sexi, joy 1',  'active',  NOW() - INTERVAL '7 minutes',  '{"temp_max":60,"vibr_max":3.0}'::jsonb),
  ('DEV-LAMINATE-1', 'machine', 'Laminatsiya mashinasi',          'Finishing sexi, joy 2',  'warning', NOW() - INTERVAL '35 minutes', '{"temp_max":80,"vibr_max":6.0}'::jsonb),
  ('DEV-DIGITAL-1',  'machine', 'Raqamli bosma (Konica Minolta)', 'Raqamli sexi, joy 1',   'active',  NOW() - INTERVAL '1 minutes',  '{"temp_max":65,"vibr_max":2.5}'::jsonb)
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2. IoT SENSORS  (machine-type OEE uchun + muhit sensorlari)
-- ---------------------------------------------------------------------------
INSERT INTO iot_sensors
  (sensor_code, name, type, location, unit, min_threshold, max_threshold,
   is_active, last_reading, last_reading_at, status)
VALUES
  ('SNS-M-OFFSET1',   'Offset 1 samaradorlik',      'machine',     'Bosma sexi, joy 1',     '%',    60, 100, true,  87.5,  NOW() - INTERVAL '3 min',  'active'),
  ('SNS-M-OFFSET2',   'Offset 2 samaradorlik',      'machine',     'Bosma sexi, joy 2',     '%',    60, 100, true,  82.0,  NOW() - INTERVAL '5 min',  'active'),
  ('SNS-M-FLEXO1',    'Flexo 1 samaradorlik',       'machine',     'Qadoqlash sexi, joy 1', '%',    60, 100, true,  91.3,  NOW() - INTERVAL '2 min',  'active'),
  ('SNS-M-CUTTING1',  'Qirqish 1 samaradorlik',     'machine',     'Finishing sexi, joy 1', '%',    60, 100, true,  78.6,  NOW() - INTERVAL '7 min',  'active'),
  ('SNS-M-LAMINATE1', 'Laminatsiya samaradorlik',   'machine',     'Finishing sexi, joy 2', '%',    60, 100, false, 45.0,  NOW() - INTERVAL '35 min', 'warning'),
  ('SNS-M-DIGITAL1',  'Raqamli bosma samaradorlik', 'machine',     'Raqamli sexi, joy 1',   '%',    60, 100, true,  94.2,  NOW() - INTERVAL '1 min',  'active'),
  ('SNS-T-BOSMA',     'Harorat bosma sexi',         'temperature', 'Bosma sexi',            'C',    15,  35, true,  24.3,  NOW() - INTERVAL '2 min',  'active'),
  ('SNS-T-PACKING',   'Harorat qadoqlash sexi',     'temperature', 'Qadoqlash sexi',        'C',    15,  35, true,  26.1,  NOW() - INTERVAL '4 min',  'active'),
  ('SNS-H-BOSMA',     'Namlik bosma sexi',          'humidity',    'Bosma sexi',            '%RH',  40,  70, true,  52.4,  NOW() - INTERVAL '2 min',  'active'),
  ('SNS-H-PACKING',   'Namlik qadoqlash sexi',      'humidity',    'Qadoqlash sexi',        '%RH',  40,  70, true,  48.7,  NOW() - INTERVAL '4 min',  'active'),
  ('SNS-E-MAIN',      'Elektr sarfi umumiy',        'energy',      'Bosh taqsimlash',       'kWh',   0, 500, true, 187.3,  NOW() - INTERVAL '1 min',  'active'),
  ('SNS-V-OFFSET1',   'Tebranish offset 1',         'vibration',   'Bosma sexi, joy 1',     'mm/s',  0, 5.0, true,   2.1,  NOW() - INTERVAL '3 min',  'active')
ON CONFLICT (sensor_code) DO UPDATE
  SET last_reading    = EXCLUDED.last_reading,
      last_reading_at = EXCLUDED.last_reading_at,
      status          = EXCLUDED.status;

-- ---------------------------------------------------------------------------
-- 3. SENSOR READINGS  (kanonik jadval: sensor_readings; device_id NOT NULL)
--    iot_sensor_readings = VIEW over sensor_readings
--    value = samaradorlik % (OEE: value > 80 = active/available)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  s_offset1   int;  d_offset1   int;
  s_offset2   int;  d_offset2   int;
  s_flexo     int;  d_flexo     int;
  s_cutting   int;  d_cutting   int;
  s_laminate  int;  d_laminate  int;
  s_digital   int;  d_digital   int;
  i           int;
  t           timestamptz;
  v           numeric;
BEGIN
  SELECT id INTO s_offset1  FROM iot_sensors WHERE sensor_code = 'SNS-M-OFFSET1'   LIMIT 1;
  SELECT id INTO s_offset2  FROM iot_sensors WHERE sensor_code = 'SNS-M-OFFSET2'   LIMIT 1;
  SELECT id INTO s_flexo    FROM iot_sensors WHERE sensor_code = 'SNS-M-FLEXO1'    LIMIT 1;
  SELECT id INTO s_cutting  FROM iot_sensors WHERE sensor_code = 'SNS-M-CUTTING1'  LIMIT 1;
  SELECT id INTO s_laminate FROM iot_sensors WHERE sensor_code = 'SNS-M-LAMINATE1' LIMIT 1;
  SELECT id INTO s_digital  FROM iot_sensors WHERE sensor_code = 'SNS-M-DIGITAL1'  LIMIT 1;

  SELECT id INTO d_offset1  FROM iot_devices WHERE device_code = 'DEV-OFFSET-1'   LIMIT 1;
  SELECT id INTO d_offset2  FROM iot_devices WHERE device_code = 'DEV-OFFSET-2'   LIMIT 1;
  SELECT id INTO d_flexo    FROM iot_devices WHERE device_code = 'DEV-FLEXO-1'    LIMIT 1;
  SELECT id INTO d_cutting  FROM iot_devices WHERE device_code = 'DEV-CUTTING-1'  LIMIT 1;
  SELECT id INTO d_laminate FROM iot_devices WHERE device_code = 'DEV-LAMINATE-1' LIMIT 1;
  SELECT id INTO d_digital  FROM iot_devices WHERE device_code = 'DEV-DIGITAL-1'  LIMIT 1;

  -- 96 ta o'qish = 8 soat x 12 ta/soat (5 daqiqada bir)
  FOR i IN 0..95 LOOP
    t := NOW() - (i * INTERVAL '5 minutes');

    -- Offset 1: 80-95% (yuqori)
    v := 80 + (RANDOM() * 15)::int;
    INSERT INTO sensor_readings (device_id, sensor_id, value, status, recorded_at, pulse_count)
    VALUES (d_offset1, s_offset1, v, CASE WHEN v >= 80 THEN 'active' ELSE 'warning' END, t, 1);

    -- Offset 2: 75-90% (o'rta)
    v := 75 + (RANDOM() * 15)::int;
    INSERT INTO sensor_readings (device_id, sensor_id, value, status, recorded_at, pulse_count)
    VALUES (d_offset2, s_offset2, v, CASE WHEN v >= 80 THEN 'active' ELSE 'warning' END, t, 1);

    -- Flexo: 85-95% (yaxshi)
    v := 85 + (RANDOM() * 10)::int;
    INSERT INTO sensor_readings (device_id, sensor_id, value, status, recorded_at, pulse_count)
    VALUES (d_flexo, s_flexo, v, 'active', t, 1);

    -- Qirqish: 70-85% (biroz past)
    v := 70 + (RANDOM() * 15)::int;
    INSERT INTO sensor_readings (device_id, sensor_id, value, status, recorded_at, pulse_count)
    VALUES (d_cutting, s_cutting, v, CASE WHEN v >= 80 THEN 'active' ELSE 'warning' END, t, 1);

    -- Laminatsiya: 35-65% (nosozlik tufayli past) -- ANOMALIYA
    v := 35 + (RANDOM() * 30)::int;
    INSERT INTO sensor_readings (device_id, sensor_id, value, status, recorded_at, pulse_count)
    VALUES (d_laminate, s_laminate, v, 'warning', t, 1);

    -- Digital: 88-96% (eng yaxshi)
    v := 88 + (RANDOM() * 8)::int;
    INSERT INTO sensor_readings (device_id, sensor_id, value, status, recorded_at, pulse_count)
    VALUES (d_digital, s_digital, v, 'active', t, 1);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 4. MES TELEMETRY  (machine_id = text identifikator)
-- ---------------------------------------------------------------------------
INSERT INTO mes_telemetry (machine_id, metric_type, metric_value, value, recorded_at)
SELECT 'OFFSET-1', 'availability', 92.3, 92.3, NOW() - (n * INTERVAL '15 minutes')
FROM generate_series(0,31) AS n ON CONFLICT DO NOTHING;

INSERT INTO mes_telemetry (machine_id, metric_type, metric_value, value, recorded_at)
SELECT 'OFFSET-1', 'performance', 88.5, 88.5, NOW() - (n * INTERVAL '15 minutes')
FROM generate_series(0,31) AS n ON CONFLICT DO NOTHING;

INSERT INTO mes_telemetry (machine_id, metric_type, metric_value, value, recorded_at)
SELECT 'OFFSET-1', 'quality', 97.8, 97.8, NOW() - (n * INTERVAL '15 minutes')
FROM generate_series(0,31) AS n ON CONFLICT DO NOTHING;

INSERT INTO mes_telemetry (machine_id, metric_type, metric_value, value, recorded_at)
SELECT 'OFFSET-2', 'availability', 84.1, 84.1, NOW() - (n * INTERVAL '15 minutes')
FROM generate_series(0,31) AS n ON CONFLICT DO NOTHING;

INSERT INTO mes_telemetry (machine_id, metric_type, metric_value, value, recorded_at)
SELECT 'OFFSET-2', 'performance', 81.6, 81.6, NOW() - (n * INTERVAL '15 minutes')
FROM generate_series(0,31) AS n ON CONFLICT DO NOTHING;

INSERT INTO mes_telemetry (machine_id, metric_type, metric_value, value, recorded_at)
SELECT 'OFFSET-2', 'quality', 95.2, 95.2, NOW() - (n * INTERVAL '15 minutes')
FROM generate_series(0,31) AS n ON CONFLICT DO NOTHING;

INSERT INTO mes_telemetry (machine_id, metric_type, metric_value, value, recorded_at)
SELECT 'FLEXO-1', 'availability', 95.4, 95.4, NOW() - (n * INTERVAL '15 minutes')
FROM generate_series(0,31) AS n ON CONFLICT DO NOTHING;

INSERT INTO mes_telemetry (machine_id, metric_type, metric_value, value, recorded_at)
SELECT 'FLEXO-1', 'performance', 90.2, 90.2, NOW() - (n * INTERVAL '15 minutes')
FROM generate_series(0,31) AS n ON CONFLICT DO NOTHING;

INSERT INTO mes_telemetry (machine_id, metric_type, metric_value, value, recorded_at)
SELECT 'FLEXO-1', 'quality', 98.1, 98.1, NOW() - (n * INTERVAL '15 minutes')
FROM generate_series(0,31) AS n ON CONFLICT DO NOTHING;

INSERT INTO mes_telemetry (machine_id, metric_type, metric_value, value, recorded_at)
SELECT 'LAMINATE-1', 'availability', 48.3, 48.3, NOW() - (n * INTERVAL '15 minutes')
FROM generate_series(0,31) AS n ON CONFLICT DO NOTHING;

INSERT INTO mes_telemetry (machine_id, metric_type, metric_value, value, recorded_at)
SELECT 'LAMINATE-1', 'performance', 55.0, 55.0, NOW() - (n * INTERVAL '15 minutes')
FROM generate_series(0,31) AS n ON CONFLICT DO NOTHING;

INSERT INTO mes_telemetry (machine_id, metric_type, metric_value, value, recorded_at)
SELECT 'LAMINATE-1', 'quality', 72.5, 72.5, NOW() - (n * INTERVAL '15 minutes')
FROM generate_series(0,31) AS n ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 5. EQUIPMENT  (production_sessions.equipment_id FK manba)
--    equipment jadvalida data yo'q edi -- demo uchun 6 ta kiritamiz
-- ---------------------------------------------------------------------------
INSERT INTO equipment (equipment_number, name, category, work_center_id, status, is_active)
VALUES
  ('EQ-OFFSET-1',   'Offset Bosma Mashinasi 1',    'printing',  5,  'active', true),
  ('EQ-OFFSET-2',   'Offset Bosma Mashinasi 2',    'printing',  6,  'active', true),
  ('EQ-FLEXO-1',    'Flexoprint Mashinasi 1',       'printing',  11, 'active', true),
  ('EQ-CUTTING-1',  'Qirqish Dastgohi 1',           'cutting',   8,  'active', true),
  ('EQ-LAMINATE-1', 'Laminatsiya Mashinasi',        'finishing', 9,  'warning',true),
  ('EQ-DIGITAL-1',  'Raqamli Bosma Mashinasi',      'digital',   7,  'active', true)
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 6. PRODUCTION ORDERS  (production_sessions.production_order_id manba)
--    Demo uchun 6 ta buyurtma -- product_id = 1 (material_cards.id=1)
-- ---------------------------------------------------------------------------
INSERT INTO production_orders
  (order_number, product_id, planned_quantity, confirmed_quantity, scrap_quantity,
   order_type, status, planned_start_date, planned_end_date)
VALUES
  ('PP-2026-0001', 1, 5000, 4615, 102, 'standard', 'in_progress',
   TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD'), TO_CHAR(CURRENT_DATE + 1, 'YYYY-MM-DD')),
  ('PP-2026-0002', 1, 4500, 3785, 182, 'standard', 'in_progress',
   TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD'), TO_CHAR(CURRENT_DATE + 1, 'YYYY-MM-DD')),
  ('PP-2026-0003', 1, 8000, 7633, 147, 'standard', 'in_progress',
   TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD'), TO_CHAR(CURRENT_DATE + 1, 'YYYY-MM-DD')),
  ('PP-2026-0004', 1, 6000, 4716, 188, 'standard', 'in_progress',
   TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD'), TO_CHAR(CURRENT_DATE + 1, 'YYYY-MM-DD')),
  ('PP-2026-0005', 1, 3000, 1350, 283, 'standard', 'paused',
   TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD'), TO_CHAR(CURRENT_DATE + 1, 'YYYY-MM-DD')),
  ('PP-2026-0006', 1, 2000, 1884,  13, 'standard', 'in_progress',
   TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD'), TO_CHAR(CURRENT_DATE + 1, 'YYYY-MM-DD'))
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 7. MES PRODUCTION SESSIONS  (kanonik jadval: production_sessions)
--    OEE = availability x performance x quality / 10000
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  po1 int; po2 int; po3 int; po4 int; po5 int; po6 int;
  eq1 int; eq2 int; eq3 int; eq4 int; eq5 int; eq6 int;
  emp_id int;
BEGIN
  SELECT id INTO po1 FROM production_orders WHERE order_number='PP-2026-0001' LIMIT 1;
  SELECT id INTO po2 FROM production_orders WHERE order_number='PP-2026-0002' LIMIT 1;
  SELECT id INTO po3 FROM production_orders WHERE order_number='PP-2026-0003' LIMIT 1;
  SELECT id INTO po4 FROM production_orders WHERE order_number='PP-2026-0004' LIMIT 1;
  SELECT id INTO po5 FROM production_orders WHERE order_number='PP-2026-0005' LIMIT 1;
  SELECT id INTO po6 FROM production_orders WHERE order_number='PP-2026-0006' LIMIT 1;

  SELECT id INTO eq1 FROM equipment WHERE equipment_number='EQ-OFFSET-1'   LIMIT 1;
  SELECT id INTO eq2 FROM equipment WHERE equipment_number='EQ-OFFSET-2'   LIMIT 1;
  SELECT id INTO eq3 FROM equipment WHERE equipment_number='EQ-FLEXO-1'    LIMIT 1;
  SELECT id INTO eq4 FROM equipment WHERE equipment_number='EQ-CUTTING-1'  LIMIT 1;
  SELECT id INTO eq5 FROM equipment WHERE equipment_number='EQ-LAMINATE-1' LIMIT 1;
  SELECT id INTO eq6 FROM equipment WHERE equipment_number='EQ-DIGITAL-1'  LIMIT 1;

  SELECT id INTO emp_id FROM employees WHERE status='active' LIMIT 1;
  IF emp_id IS NULL THEN emp_id := 1; END IF;

  -- Offset 1: OEE = 0.923 x 0.885 x 0.978 = 79.9%
  INSERT INTO production_sessions
    (session_number, production_order_id, equipment_id, worker_id, status,
     target_quantity, actual_quantity, defect_quantity,
     started_at, ended_at, running_time_seconds, stopped_time_seconds,
     availability, performance, quality, oee,
     machine_id, session_date, produced_qty, defect_qty, start_time, end_time)
  VALUES
    ('SES-2026-0001', po1, eq1, emp_id, 'completed',
     5000, 4615, 102,
     NOW()-INTERVAL '8 hours', NOW()-INTERVAL '10 minutes', 26208, 2592,
     92.3, 88.5, 97.8, 79.9,
     5, CURRENT_DATE, 4615, 102, NOW()-INTERVAL '8 hours', NOW()-INTERVAL '10 minutes')
  ON CONFLICT DO NOTHING;

  -- Offset 2: OEE = 0.841 x 0.816 x 0.952 = 65.3%
  INSERT INTO production_sessions
    (session_number, production_order_id, equipment_id, worker_id, status,
     target_quantity, actual_quantity, defect_quantity,
     started_at, ended_at, running_time_seconds, stopped_time_seconds,
     availability, performance, quality, oee,
     machine_id, session_date, produced_qty, defect_qty, start_time, end_time)
  VALUES
    ('SES-2026-0002', po2, eq2, emp_id, 'completed',
     4500, 3785, 182,
     NOW()-INTERVAL '8 hours', NOW()-INTERVAL '15 minutes', 24192, 4608,
     84.1, 81.6, 95.2, 65.3,
     6, CURRENT_DATE, 3785, 182, NOW()-INTERVAL '8 hours', NOW()-INTERVAL '15 minutes')
  ON CONFLICT DO NOTHING;

  -- Flexo 1: OEE = 0.954 x 0.902 x 0.981 = 84.4%
  INSERT INTO production_sessions
    (session_number, production_order_id, equipment_id, worker_id, status,
     target_quantity, actual_quantity, defect_quantity,
     started_at, running_time_seconds, stopped_time_seconds,
     availability, performance, quality, oee,
     machine_id, session_date, produced_qty, defect_qty, start_time)
  VALUES
    ('SES-2026-0003', po3, eq3, emp_id, 'in_progress',
     8000, 7633, 147,
     NOW()-INTERVAL '8 hours', 27504, 1296,
     95.4, 90.2, 98.1, 84.4,
     11, CURRENT_DATE, 7633, 147, NOW()-INTERVAL '8 hours')
  ON CONFLICT DO NOTHING;

  -- Qirqish: OEE = 0.786 x 0.812 x 0.961 = 61.3%
  INSERT INTO production_sessions
    (session_number, production_order_id, equipment_id, worker_id, status,
     target_quantity, actual_quantity, defect_quantity,
     started_at, running_time_seconds, stopped_time_seconds,
     availability, performance, quality, oee,
     machine_id, session_date, produced_qty, defect_qty, start_time)
  VALUES
    ('SES-2026-0004', po4, eq4, emp_id, 'in_progress',
     6000, 4716, 188,
     NOW()-INTERVAL '8 hours', 22752, 6048,
     78.6, 81.2, 96.1, 61.3,
     8, CURRENT_DATE, 4716, 188, NOW()-INTERVAL '8 hours')
  ON CONFLICT DO NOTHING;

  -- Laminatsiya: OEE = 0.450 x 0.550 x 0.725 = 17.9% -- ANOMALIYA!
  INSERT INTO production_sessions
    (session_number, production_order_id, equipment_id, worker_id, status,
     target_quantity, actual_quantity, defect_quantity,
     started_at, running_time_seconds, stopped_time_seconds,
     availability, performance, quality, oee,
     machine_id, session_date, produced_qty, defect_qty, start_time)
  VALUES
    ('SES-2026-0005', po5, eq5, emp_id, 'paused',
     3000, 1350, 283,
     NOW()-INTERVAL '8 hours', 12960, 15840,
     45.0, 55.0, 72.5, 17.9,
     9, CURRENT_DATE, 1350, 283, NOW()-INTERVAL '8 hours')
  ON CONFLICT DO NOTHING;

  -- Raqamli: OEE = 0.942 x 0.921 x 0.993 = 86.1%
  INSERT INTO production_sessions
    (session_number, production_order_id, equipment_id, worker_id, status,
     target_quantity, actual_quantity, defect_quantity,
     started_at, running_time_seconds, stopped_time_seconds,
     availability, performance, quality, oee,
     machine_id, session_date, produced_qty, defect_qty, start_time)
  VALUES
    ('SES-2026-0006', po6, eq6, emp_id, 'in_progress',
     2000, 1884, 13,
     NOW()-INTERVAL '8 hours', 27504, 1296,
     94.2, 92.1, 99.3, 86.1,
     7, CURRENT_DATE, 1884, 13, NOW()-INTERVAL '8 hours')
  ON CONFLICT DO NOTHING;
END $$;

-- ---------------------------------------------------------------------------
-- 8. MES SHIFT STATS  (bugungi 1-smena)
-- ---------------------------------------------------------------------------
INSERT INTO mes_shift_stats
  (shift_date, shift_number, machine_id, produced_qty, defect_qty, downtime_min, oee)
VALUES
  (CURRENT_DATE, 1, 5,  4615, 102, 43,  79.9),
  (CURRENT_DATE, 1, 6,  3785, 182, 76,  65.3),
  (CURRENT_DATE, 1, 11, 7633, 147, 21,  84.4),
  (CURRENT_DATE, 1, 8,  4716, 188, 100, 61.3),
  (CURRENT_DATE, 1, 9,  1350, 283, 264, 17.9),
  (CURRENT_DATE, 1, 7,  1884,  13, 21,  86.1)
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 9. MES DOWNTIME REASONS  (sabab katalog)
-- ---------------------------------------------------------------------------
INSERT INTO mes_downtime_reasons (code, name, category, is_planned, is_active)
VALUES
  ('DT-MECH',   'Mexanik nosozlik',          'breakdown',     false, true),
  ('DT-ELECT',  'Elektr uzilishi',            'breakdown',     false, true),
  ('DT-MAT',    'Material tugashi',           'material',      false, true),
  ('DT-SETUP',  'Dastgoh sozlash',            'setup',         true,  true),
  ('DT-MAINT',  'Rejalashtirilgan TO',        'maintenance',   true,  true),
  ('DT-QUAL',   'Sifat tekshiruvi toxtatish', 'quality',       false, true),
  ('DT-SHIFT',  'Smena almashinuvi',          'organizational',true,  true)
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 10. MACHINE STATUS LOGS  (oxirgi 8 soat)
-- ---------------------------------------------------------------------------
INSERT INTO machine_status_logs
  (work_center_id, status, previous_status,
   status_started_at, status_ended_at, duration_minutes,
   stop_reason, ai_detected, ai_confidence)
VALUES
  -- Offset 1: 43 daqiqa tozatish, endi ishlaydi
  (5, 'running', 'stopped', NOW()-INTERVAL '7 hours 17 minutes', NULL, NULL, NULL, false, NULL),
  (5, 'stopped', 'running', NOW()-INTERVAL '8 hours', NOW()-INTERVAL '7 hours 17 minutes', 43, 'DT-SETUP', false, NULL),

  -- Offset 2: 2 marta tuxtatish
  (6, 'running', 'stopped', NOW()-INTERVAL '5 hours 10 minutes', NULL, NULL, NULL, false, NULL),
  (6, 'stopped', 'running', NOW()-INTERVAL '6 hours', NOW()-INTERVAL '5 hours 10 minutes', 50, 'DT-MAT', false, NULL),

  -- Laminatsiya: ko'p tuxtatish -- ANOMALIYA (AI aniqladi)
  (9, 'stopped', 'running', NOW()-INTERVAL '35 minutes', NULL, NULL, 'DT-MECH', true, 0.94),
  (9, 'running', 'stopped', NOW()-INTERVAL '2 hours 15 minutes', NOW()-INTERVAL '35 minutes', 100, NULL, false, NULL),
  (9, 'stopped', 'running', NOW()-INTERVAL '3 hours', NOW()-INTERVAL '2 hours 15 minutes', 45, 'DT-ELECT', true, 0.87),
  (9, 'running', 'stopped', NOW()-INTERVAL '4 hours', NOW()-INTERVAL '3 hours', 60, NULL, false, NULL),
  (9, 'stopped', NULL, NOW()-INTERVAL '4 hours 59 minutes', NOW()-INTERVAL '4 hours', 59, 'DT-MECH', true, 0.91)
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 11. MES SESSIONS  (mes-production-sessions endpoint uchun: mes_sessions jadval)
--     Bu jadval work_center_id=uuid (FK emas), machine_id=int; operator_id=int (FK yo'q)
-- ---------------------------------------------------------------------------
INSERT INTO mes_sessions (status, defect_qty, quality_passed, started_at, completed_at, machine_id, operator_id, notes)
SELECT 'completed', 102, true,  NOW()-INTERVAL '8 hours', NOW()-INTERVAL '10 minutes', 5,  e.id, 'DEMO: Offset 1 smena - OEE 79.9%' FROM (SELECT id FROM employees WHERE status=$$active$$ LIMIT 1) e
ON CONFLICT DO NOTHING;

INSERT INTO mes_sessions (status, defect_qty, quality_passed, started_at, completed_at, machine_id, operator_id, notes)
SELECT 'completed', 182, true,  NOW()-INTERVAL '8 hours', NOW()-INTERVAL '15 minutes', 6,  e.id, 'DEMO: Offset 2 smena - OEE 65.3%' FROM (SELECT id FROM employees WHERE status=$$active$$ LIMIT 1) e
ON CONFLICT DO NOTHING;

INSERT INTO mes_sessions (status, defect_qty, quality_passed, started_at, completed_at, machine_id, operator_id, notes)
SELECT 'active', 147, true, NOW()-INTERVAL '8 hours', NULL, 11, e.id, 'DEMO: Flexo 1 smena - OEE 84.4%' FROM (SELECT id FROM employees WHERE status=$$active$$ LIMIT 1) e
ON CONFLICT DO NOTHING;

INSERT INTO mes_sessions (status, defect_qty, quality_passed, started_at, completed_at, machine_id, operator_id, notes)
SELECT 'active', 188, true, NOW()-INTERVAL '8 hours', NULL, 8, e.id, 'DEMO: Qirqish smena - OEE 61.3%' FROM (SELECT id FROM employees WHERE status=$$active$$ LIMIT 1) e
ON CONFLICT DO NOTHING;

INSERT INTO mes_sessions (status, defect_qty, quality_passed, started_at, completed_at, machine_id, operator_id, notes)
SELECT 'paused', 283, false, NOW()-INTERVAL '8 hours', NULL, 9, e.id, 'DEMO: Laminatsiya ANOMALIYA OEE 17.9%' FROM (SELECT id FROM employees WHERE status=$$active$$ LIMIT 1) e
ON CONFLICT DO NOTHING;

INSERT INTO mes_sessions (status, defect_qty, quality_passed, started_at, completed_at, machine_id, operator_id, notes)
SELECT 'active', 13, true, NOW()-INTERVAL '8 hours', NULL, 7, e.id, 'DEMO: Raqamli bosma - OEE 86.1%' FROM (SELECT id FROM employees WHERE status=$$active$$ LIMIT 1) e
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 12. IOT ALERTS  (2 ta anomaliya)
-- ---------------------------------------------------------------------------
INSERT INTO iot_alerts (sensor_id, alert_type, severity, message, value, threshold, is_resolved)
SELECT
  s.id, 'threshold_exceeded', 'critical',
  'DEMO: Laminatsiya mashinasi samaradorligi kritik past: ' || s.last_reading || '%. Min chegara: ' || s.min_threshold || '%',
  s.last_reading, s.min_threshold, false
FROM iot_sensors s WHERE s.sensor_code = 'SNS-M-LAMINATE1';

INSERT INTO iot_alerts (sensor_id, alert_type, severity, message, value, threshold, is_resolved)
SELECT
  s.id, 'threshold_warning', 'warning',
  'DEMO: Qadoqlash sexi harorati yuqori: ' || s.last_reading || ' C. Maksimal: ' || s.max_threshold || ' C',
  s.last_reading, s.max_threshold, false
FROM iot_sensors s WHERE s.sensor_code = 'SNS-T-PACKING';

COMMIT;
