/**
 * iter-80 DB-PROOF (rollback-tx). createEmergencyContact (drift catalog #19).
 * BUGS: (1) INSERT wrote nonexistent `phone` (real col phone_number) → 42703; (2) NOT NULL
 *       user_id + phone_number omitted → 23502; (3) FE sends camelCase phoneNumber/contactName.
 * Proof: fixed INSERT..SELECT resolves user_id from employee → succeeds + reader sees it;
 *        old insert FAILS 42703. ROLLBACK count 0.
 */
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({
  host: process.env.PGHOST || '127.0.0.1', port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER || 'postgres', password: process.env.PGPASSWORD || 'postgres',
  database: process.env.PGDATABASE || 'europrint',
});
(async () => {
  const c = await pool.connect();
  try {
    const emp = (await c.query(`SELECT e.id FROM employees e JOIN users u ON u.employee_id = e.id LIMIT 1`)).rows[0];
    console.log('0) employee_id =', emp?.id);
    const eid = emp.id;
    const fe = { contactName: 'Otasi (ITER80)', relationship: 'Ota', phoneNumber: '+998901234567', alternativePhone: null };

    // (A) OLD insert (nonexistent `phone`, no user_id/phone_number) FAILS
    await c.query('BEGIN');
    try {
      await c.query(`INSERT INTO employee_emergency_contacts (employee_id, contact_name, relationship, phone) VALUES ($1,$2,$3,$4) RETURNING id`,
        [eid, fe.contactName, fe.relationship, fe.phoneNumber]);
      console.log('A) OLD insert: UNEXPECTEDLY SUCCEEDED');
    } catch (e) { console.log('A) OLD insert FAILS as expected:', e.code, e.message.slice(0, 50)); }
    await c.query('ROLLBACK');

    // (B) FIXED insert..select (resolves user_id)
    await c.query('BEGIN');
    const ins = await c.query(
      `INSERT INTO employee_emergency_contacts (user_id, employee_id, contact_name, relationship, phone_number, alternative_phone)
       SELECT u.id, $1, $2, $3, $4, $5 FROM users u WHERE u.employee_id = $1 LIMIT 1
       RETURNING id, user_id, employee_id, contact_name, relationship, phone_number`,
      [eid, fe.contactName, fe.relationship, fe.phoneNumber, fe.alternativePhone]);
    console.log('B) FIXED INSERT :', JSON.stringify(ins.rows[0]));

    const sel = await c.query(`SELECT id, user_id, contact_name, phone_number FROM employee_emergency_contacts WHERE id=$1`, [ins.rows[0].id]);
    console.log('B) reader SELECT :', JSON.stringify(sel.rows[0]));
    await c.query('ROLLBACK');

    const rem = await c.query(`SELECT count(*)::int AS n FROM employee_emergency_contacts WHERE contact_name='Otasi (ITER80)'`);
    console.log('C) ROLLBACK → remaining =', rem.rows[0].n, '(must be 0)');
  } catch (e) {
    try { await c.query('ROLLBACK'); } catch (_) {}
    console.error('ERROR:', e.message);
  } finally { c.release(); await pool.end(); }
})();
