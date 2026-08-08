/**
 * iter-79 DB-PROOF (rollback-tx). discipline-records-compat createDisciplineRecord (drift catalog #11).
 * BUGS: (1) FE sends camelCase (userId/type/amount/reason/reasonRu/givenBy) via passthrough DTO, but
 *       service read snake_case → employee_id/violation_type undefined → guard 400 before INSERT.
 *       (2) reason + given_by NOT NULL (no default) never written → 23502.
 * Proof: simulate the FIXED mapping from a real FE payload → INSERT works + reader SELECT sees it;
 *        also prove OLD insert (no reason/given_by) FAILS 23502. ROLLBACK count 0.
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
    const emps = (await c.query(`SELECT id FROM employees ORDER BY id LIMIT 2`)).rows;
    const empId = emps[0]?.id, hrId = emps[1]?.id ?? emps[0]?.id;
    console.log('0) employee_id =', empId, '| given_by =', hrId);

    // The real FE payload (AddDisciplineDialog formData)
    const fe = { userId: empId, type: 'penalty', amount: 50000, reason: 'Kech keldi (ITER79)', reasonRu: 'Опоздал', givenBy: hrId };
    // Service mapping (mirror of the fix)
    const m = {
      employee_id: fe.userId, given_by: fe.givenBy, reason: fe.reason, reason_ru: fe.reasonRu,
      discipline_type: fe.type, violation_type: 'general', severity: 'minor',
      violation_date: null, description: fe.reason, fine_amount: fe.amount,
    };

    // (A) OLD insert (no reason/given_by) must FAIL
    await c.query('BEGIN');
    try {
      await c.query(
        `INSERT INTO discipline_records (employee_id, violation_type, discipline_type, severity, violation_date, issued_date, description, fine_amount, status)
         VALUES ($1,$2,$3,$4,$5::date,NOW()::date,$6,$7,'issued') RETURNING id`,
        [m.employee_id, m.violation_type, m.discipline_type, m.severity, m.violation_date, m.description, m.fine_amount],
      );
      console.log('A) OLD insert: UNEXPECTEDLY SUCCEEDED');
    } catch (e) { console.log('A) OLD insert FAILS as expected:', e.code, e.message.slice(0, 50)); }
    await c.query('ROLLBACK');

    // (B) FIXED insert
    await c.query('BEGIN');
    const ins = await c.query(
      `INSERT INTO discipline_records (employee_id, violation_type, discipline_type, severity, violation_date, issued_date, description, reason, reason_ru, given_by, fine_amount, status)
       VALUES ($1,$2,$3,$4,$5::date,NOW()::date,$6,$7,$8,$9,$10,'issued')
       RETURNING id, employee_id, violation_type, reason, given_by, fine_amount, status`,
      [m.employee_id, m.violation_type, m.discipline_type, m.severity, m.violation_date, m.description, m.reason, m.reason_ru, m.given_by, m.fine_amount],
    );
    console.log('B) FIXED INSERT :', JSON.stringify(ins.rows[0]));

    const sel = await c.query(
      `SELECT dr.id, dr.reason, dr.given_by, (e.first_name||' '||e.last_name) AS employee_name
       FROM discipline_records dr LEFT JOIN employees e ON e.id = dr.employee_id WHERE dr.id = $1`,
      [ins.rows[0].id],
    );
    console.log('B) reader SELECT :', JSON.stringify(sel.rows[0]));
    await c.query('ROLLBACK');

    const rem = await c.query(`SELECT count(*)::int AS n FROM discipline_records WHERE reason='Kech keldi (ITER79)'`);
    console.log('C) ROLLBACK → remaining =', rem.rows[0].n, '(must be 0)');
  } catch (e) {
    try { await c.query('ROLLBACK'); } catch (_) {}
    console.error('ERROR:', e.message);
  } finally {
    c.release();
    await pool.end();
  }
})();
