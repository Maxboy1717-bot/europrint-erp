const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' }); // allow-secret
(async () => {
  const c = await pool.connect(); let id = null;
  try {
    // mirror DrizzleSensorRepo.saveReading INSERT (iot_sensor_readings)
    const ins = await c.query(`INSERT INTO iot_sensor_readings (device_id, sensor_id, value, status, recorded_at) VALUES (999999, 999999, 95, 'anomaly', NOW()) RETURNING id, sensor_id, value, status`);
    id = ins.rows[0].id;
    console.log('1) SAVED    : reading id', id, '(real persist -> fake-create fixed);', JSON.stringify(ins.rows[0]));
    const sel = (await c.query(`SELECT id, sensor_id, value, status FROM iot_sensor_readings WHERE id=$1`, [id])).rows[0];
    console.log('2) READBACK :', JSON.stringify(sel));
    await c.query(`DELETE FROM iot_sensor_readings WHERE id=$1`, [id]);
    const rem = (await c.query(`SELECT count(*)::int n FROM iot_sensor_readings WHERE id=$1`, [id])).rows[0].n;
    console.log('3) CLEANUP  : remaining', rem, '(must be 0)');
  } catch (e) { console.error('ERROR:', e.message); if (id) { try { await c.query(`DELETE FROM iot_sensor_readings WHERE id=$1`,[id]); } catch(_){} } process.exitCode=1; }
  finally { c.release(); await pool.end(); }
})();
