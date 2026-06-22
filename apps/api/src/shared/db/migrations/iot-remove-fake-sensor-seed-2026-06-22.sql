-- ============================================================
-- FILE: apps/api/src/shared/db/migrations/iot-remove-fake-sensor-seed-2026-06-22.sql
-- APPROVED: Claude (egasi vakolati) 2026-06-22
-- IoT HONEST telemetry (owner instruction, audit line 65): the owner stated the
-- physical sensors are NOT installed yet, so IoT must NOT return fabricated sensor
-- readings as if they were real. The build was returning 576 fabricated readings
-- (Q-40 "ishlaydi != to'g'ri" violation). The cause was NOT code — the IoT read
-- repos already run honest real SELECTs — it was DEMO SEED rows from
-- docs/migration/seed/seed-demo-02-mes-iot.sql (its own header: "demo data (real
-- emas)"), which RANDOM()-generated 96 readings x 6 machine sensors.
--
-- This removes ONLY that fake IoT-sensor seed (SNS-% sensors + their readings +
-- DEMO: alerts) — verified scope: 12 SNS-% sensors, 576 readings (= 100% of
-- iot_sensor_readings), 2 DEMO alerts (= 100% of iot_alerts), no FK references
-- to iot_sensors. After this, /api/iot/* honestly returns empty (the FE pages
-- render a "no sensor data yet" empty state). Idempotent + reversible (re-run the
-- seed to restore demo data). Order: readings -> alerts -> sensors.
--
-- NOT touched (separate, broader owner decision): the demo seed's MES/production
-- rows (production_sessions / mes_sessions / equipment / machine_status_logs /
-- mes_shift_stats) that feed /api/iot/oee/live and the golden-thread baseline.
-- The demo seed file itself should not be run against production.
-- ============================================================

DELETE FROM iot_sensor_readings WHERE sensor_id IN (SELECT id FROM iot_sensors WHERE sensor_code LIKE 'SNS-%');
DELETE FROM iot_alerts          WHERE message LIKE 'DEMO:%';
DELETE FROM iot_sensors         WHERE sensor_code LIKE 'SNS-%';
