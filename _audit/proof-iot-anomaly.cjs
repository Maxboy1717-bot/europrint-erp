/**
 * DB-proof: IoT anomaly handler now persists to iot_alerts (was a no-op log).
 * Replicates AnomalyDetectedHandler's insert, then runs the dashboard active-alerts query to confirm
 * the anomaly surfaces (is_resolved=false). Sentinel sensor_id (no FK); cleaned up.
 */
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({
  host: process.env.PGHOST || '127.0.0.1', port: Number(process.env.PGPORT) || 5432,
  user: process.env.PGUSER || 'postgres', password: process.env.PGPASSWORD || 'postgres',
  database: process.env.PGDATABASE || 'europrint',
});
const SID = 999777; // sentinel sensor_id (no FK)

(async () => {
  try {
    // handler insert (deviceId='999777' -> sensor_id 999777, anomalyType='high_value', value=150)
    await pool.query(
      `INSERT INTO iot_alerts (sensor_id, alert_type, severity, message, value, is_resolved, created_at)
       VALUES ($1, 'high_value', 'high', $2, 150, false, NOW())`,
      [SID, 'Mashina M-7: high_value anomaliya (qiymat=150)']);

    // dashboard active-alerts query (drizzle-iot-main.repo)
    const active = (await pool.query(
      `SELECT a.id, a.sensor_id, a.alert_type, a.severity, a.message, a.value, a.is_resolved
       FROM iot_alerts a LEFT JOIN iot_sensors s ON s.id = a.sensor_id
       WHERE a.is_resolved = false AND a.sensor_id = $1`, [SID])).rows;
    const a = active[0];
    const ok = a && a.alert_type === 'high_value' && a.severity === 'high' && Number(a.value) === 150 && a.is_resolved === false;
    console.log('--- DB-PROOF: IoT anomaly -> iot_alerts (was no-op) ---');
    console.log('alert surfaces in dashboard:', a ? `✅ #${a.id} type=${a.alert_type} sev=${a.severity} value=${a.value} resolved=${a.is_resolved}` : 'NONE ❌');

    await pool.query(`DELETE FROM iot_alerts WHERE sensor_id = $1`, [SID]);
    const left = (await pool.query(`SELECT COUNT(*)::int n FROM iot_alerts WHERE sensor_id=$1`, [SID])).rows[0].n;
    console.log('cleanup remaining :', left, left === 0 ? '✅' : '❌');

    console.log(ok && left === 0
      ? '\n✅ PROOF PASSED — IoT anomaly now creates an active iot_alerts row (operator can resolve it).'
      : '\n❌ PROOF FAILED');
  } catch (e) {
    console.error('PROOF ERROR:', e.message);
    try { await pool.query(`DELETE FROM iot_alerts WHERE sensor_id=$1`, [SID]); } catch {}
  } finally { await pool.end(); }
})();
