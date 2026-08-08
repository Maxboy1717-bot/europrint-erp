#!/usr/bin/env node
/* eslint-disable */
/**
 * T12-02 DB-PROOF (rollback-tx): MES saveSession WRITER-wire fills operator_card_id.
 *
 * Replays the EXACT UPDATE from drizzle-mes.repo.ts saveSession() against a real
 * production_sessions row, proving:
 *   A) when the session's worker resolves to a KARTA (users.card_id / employee_cards /
 *      org_department_id chain), operator_card_id is filled with that real card;
 *   B) when the worker has NO card link, operator_card_id stays NULL (no fabrication, Q-40);
 *   C) an already-set operator_card_id is never clobbered to NULL.
 * Everything runs inside BEGIN ... ROLLBACK — no data is mutated.
 */
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({ host:'127.0.0.1', port:5432, user:'postgres', password:'postgres', database:'europrint' });

// saveSession() UPDATE, verbatim shape (params: status, sessionId).
const WRITER = `
  UPDATE production_sessions ps
  SET status = $1,
      operator_card_id = COALESCE(
        (SELECT COALESCE(u.card_id, ec.card_id, u.org_department_id)
           FROM users u
           LEFT JOIN employees emp ON emp.user_id = u.id
           LEFT JOIN employee_cards ec ON ec.employee_id = emp.id
             AND ec.is_active = true AND ec.is_primary = true
          WHERE u.id = ps.worker_id),
        ps.operator_card_id),
      updated_at = NOW()
  WHERE ps.id = $2
  RETURNING ps.id, ps.worker_id, ps.operator_card_id`;

(async () => {
  const c = await pool.connect();
  const checks = {};
  try {
    await client_begin(c);

    // Pick a real session to drive the proof.
    const sRes = await c.query(`SELECT id, worker_id, operator_card_id FROM production_sessions WHERE deleted_at IS NULL ORDER BY id DESC LIMIT 1`);
    const sess = sRes.rows[0];
    if (!sess) { console.log('SKIP: no sessions'); await c.query('ROLLBACK'); return; }
    const sessId = Number(sess.id);
    console.log('Target session:', JSON.stringify(sess));

    // --- CASE A: worker that RESOLVES to a card. Use user 34 → org_department_id 44. ---
    const wRes = await c.query(`
      SELECT u.id, COALESCE(u.card_id, ec.card_id, u.org_department_id) AS resolved
      FROM users u
      LEFT JOIN employees emp ON emp.user_id=u.id
      LEFT JOIN employee_cards ec ON ec.employee_id=emp.id AND ec.is_active AND ec.is_primary
      WHERE COALESCE(u.card_id, ec.card_id, u.org_department_id) IS NOT NULL
      ORDER BY u.id LIMIT 1`);
    const carded = wRes.rows[0];
    const expectedCard = Number(carded.resolved);
    // point the session at this worker (inside tx), clear its card, run writer
    await c.query(`UPDATE production_sessions SET worker_id=$1, operator_card_id=NULL WHERE id=$2`, [carded.id, sessId]);
    const a = await c.query(WRITER, ['running', sessId]);
    console.log('CASE A result:', JSON.stringify(a.rows[0]));
    checks['A: worker w/ card → operator_card_id filled'] = Number(a.rows[0].operator_card_id) === expectedCard;
    checks['A: filled card is non-NULL'] = a.rows[0].operator_card_id !== null;

    // --- CASE B: worker with NO card link → stays NULL (no fabrication). ---
    // Find a user that resolves to NULL (or use a non-existent worker id 0).
    await c.query(`UPDATE production_sessions SET worker_id=0, operator_card_id=NULL WHERE id=$1`, [sessId]);
    const b = await c.query(WRITER, ['running', sessId]);
    console.log('CASE B result:', JSON.stringify(b.rows[0]));
    checks['B: worker w/o card → operator_card_id stays NULL (no fabrication)'] = b.rows[0].operator_card_id === null;

    // --- CASE C: pre-set card must NOT be clobbered when worker resolves NULL. ---
    await c.query(`UPDATE production_sessions SET worker_id=0, operator_card_id=$1 WHERE id=$2`, [expectedCard, sessId]);
    const cc = await c.query(WRITER, ['sent_to_qc', sessId]);
    console.log('CASE C result:', JSON.stringify(cc.rows[0]));
    checks['C: existing card preserved (COALESCE keeps it)'] = Number(cc.rows[0].operator_card_id) === expectedCard;

    // FK integrity: the filled card id must exist in org_departments.
    const fk = await c.query(`SELECT 1 FROM org_departments WHERE id=$1`, [expectedCard]);
    checks['FK: filled card exists in org_departments'] = fk.rowCount === 1;

    await c.query('ROLLBACK');

    console.log('\n--- ASSERTIONS ---');
    let all = true;
    for (const [k,v] of Object.entries(checks)) { console.log(`${v?'PASS':'FAIL'}: ${k}`); if(!v) all=false; }
    console.log(`\n${all?'ALL PASS ✅ (rolled back, no data changed)':'SOME FAIL ❌'}`);
    process.exitCode = all ? 0 : 1;
  } catch (e) {
    try { await c.query('ROLLBACK'); } catch(_){}
    console.error('ERROR:', e.message); process.exitCode = 1;
  } finally { c.release(); await pool.end(); }
})();
async function client_begin(c){ await c.query('BEGIN'); }
