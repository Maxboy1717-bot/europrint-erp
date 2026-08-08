/**
 * HR Conflict Reports DB-PROOF:
 * 1. INSERT with generated ID (CR-NNN pattern)
 * 2. SELECT with employee JOIN (party1_name/party2_name)
 * 3. Rollback → verify count unchanged
 */
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' });
(async () => {
  const c = await pool.connect();
  try {
    // Baseline count
    const before = await c.query('SELECT COUNT(*)::int AS total FROM hr_conflict_reports');
    console.log('1) BASELINE   : count =', before.rows[0].total);

    // Test JOIN query (party names)
    const joined = await c.query(`
      SELECT cr.id, cr.party1, cr.party2, cr.severity, cr.status,
             COALESCE(e1.first_name || ' ' || e1.last_name, cr.party1) AS party1_name,
             COALESCE(e2.first_name || ' ' || e2.last_name, cr.party2) AS party2_name
      FROM hr_conflict_reports cr
      LEFT JOIN employees e1 ON e1.id::text = cr.party1
      LEFT JOIN employees e2 ON e2.id::text = cr.party2
      ORDER BY cr.created_at DESC LIMIT 3
    `);
    console.log('2) JOIN RESULT:', joined.rows.map(r => `${r.id}: ${r.party1_name} vs ${r.party2_name}`).join(' | '));

    // Test INSERT inside TX
    await c.query('BEGIN');
    const ins = await c.query(`
      INSERT INTO hr_conflict_reports (id, party1, party2, description, severity, status)
      VALUES (
        'CR-' || LPAD(CAST((SELECT COUNT(*)+1 FROM hr_conflict_reports) AS TEXT), 3, '0'),
        '5', '12', 'DB-proof test conflict', 'high', 'open'
      )
      RETURNING id, party1, party2, severity, status
    `);
    console.log('3) INSERT OK  :', JSON.stringify(ins.rows[0]));

    const inside = await c.query('SELECT COUNT(*)::int AS total FROM hr_conflict_reports');
    console.log('4) COUNT IN TX:', inside.rows[0].total);

    await c.query('ROLLBACK');

    const after = await c.query('SELECT COUNT(*)::int AS total FROM hr_conflict_reports');
    console.log('5) AFTER ROLLBACK:', after.rows[0].total, '(should equal baseline)');
    console.log('PROOF PASS:', before.rows[0].total === after.rows[0].total ? 'YES' : 'NO');
  } catch (e) {
    await c.query('ROLLBACK').catch(() => {});
    console.error('PROOF FAIL:', e.message);
    process.exit(1);
  } finally {
    c.release();
    await pool.end();
  }
})();
