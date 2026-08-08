/**
 * iter-74 DB-PROOF (no HTTP, no JWT). Rollback-tx: mirrors qc-extended-in-process.repository.ts
 * createInProcessInspection() INSERT + listInProcess() SELECT (with inspector JOIN).
 * Proves END-TO-END: kirit -> oqdi (JOIN inspector_name) -> ko'rindi -> ROLLBACK (count=0).
 * Uses a real session_id + inspector_id (employee) so the JOIN resolves a real name.
 */
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({
  host: process.env.PGHOST || '127.0.0.1',
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  database: process.env.PGDATABASE || 'europrint',
});
(async () => {
  const c = await pool.connect();
  try {
    await c.query('BEGIN');

    // real session + inspector to prove the JOIN
    const sid = (await c.query(`SELECT id FROM production_sessions ORDER BY id DESC LIMIT 1`)).rows[0]?.id ?? null;
    const emp = (await c.query(`SELECT id, first_name, last_name FROM employees WHERE first_name IS NOT NULL ORDER BY id LIMIT 1`)).rows[0] ?? null;
    console.log('0) session_id =', sid, '| inspector =', emp ? `${emp.id} (${emp.first_name} ${emp.last_name})` : 'none');

    // status derive (service.deriveInspectionStatus): defects>0 → fail else pass (mirror)
    const sample = 50, defects = 3;
    const status = defects > 0 ? 'fail' : 'pass';

    const ins = await c.query(
      `INSERT INTO qc_in_process_inspections (session_id, inspector_id, check_point, sample_size, defects_found, status, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [sid, emp?.id ?? null, 'Bosma sifati (ITER74)', sample, defects, status, 'rollback-tx proof'],
    );
    const id = ins.rows[0].id;
    console.log('1) INSERTED   : id =', id, '| status =', status, `(${defects}/${sample})`);

    // mirror listInProcess() SELECT with inspector JOIN
    const sel = await c.query(
      `SELECT ip.id, ip.session_id, ip.check_point, ip.sample_size, ip.defects_found, ip.status,
              CONCAT(e.first_name, ' ', e.last_name) AS inspector_name
       FROM qc_in_process_inspections ip
       LEFT JOIN employees e ON e.id = ip.inspector_id
       WHERE ip.id = $1`, [id],
    );
    console.log('2) PERSISTED  :', JSON.stringify(sel.rows[0]));

    await c.query('ROLLBACK');
    const rem = await c.query(`SELECT count(*)::int AS n FROM qc_in_process_inspections WHERE check_point = 'Bosma sifati (ITER74)'`);
    console.log('3) ROLLBACK   : remaining =', rem.rows[0].n, '(must be 0)');
  } catch (e) {
    try { await c.query('ROLLBACK'); } catch (_) {}
    console.error('ERROR:', e.message);
  } finally {
    c.release();
    await pool.end();
  }
})();
