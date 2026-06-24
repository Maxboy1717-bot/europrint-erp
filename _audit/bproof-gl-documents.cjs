/**
 * iter-78 DB-PROOF (rollback-tx). fi.repository createGlDocument repair (drift catalog #2).
 * BUG: gl_documents.document_date is NOT NULL (no default) but the INSERT omitted it (only wrote
 *      posting_date) → every createGlDocument raised 23502. GLDocuments.tsx create form silently dead.
 * Proof: (A) OLD insert (no document_date) FAILS 23502; (B) FIXED insert succeeds + reader SELECT
 *        sees it; (C) ROLLBACK count 0.
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
const DN = 'ITER78-GL-PROOF';
(async () => {
  const c = await pool.connect();
  try {
    // (A) OLD insert (no document_date) must FAIL
    await c.query('BEGIN');
    try {
      await c.query(
        `INSERT INTO gl_documents (document_number, document_type, posting_date, status, created_at, updated_at)
         VALUES ($1,$2,$3,$4,NOW(),NOW()) RETURNING id`,
        [DN, 'journal', '2026-06-24', 'draft'],
      );
      console.log('A) OLD insert: UNEXPECTEDLY SUCCEEDED');
    } catch (e) {
      console.log('A) OLD insert FAILS as expected:', e.code, e.message.slice(0, 55));
    }
    await c.query('ROLLBACK');

    // (B) FIXED insert (with document_date) succeeds
    await c.query('BEGIN');
    const ins = await c.query(
      `INSERT INTO gl_documents (document_number, document_type, document_date, posting_date, reference, description, currency, total_debit, total_credit, status, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW(),NOW())
       RETURNING id, document_number, document_type, document_date, posting_date, status`,
      [DN, 'journal', '2026-06-24', '2026-06-24', 'REF-1', 'iter78 proof', 'UZS', 0, 0, 'draft'],
    );
    console.log('B) FIXED INSERT :', JSON.stringify(ins.rows[0]));

    const sel = await c.query(
      `SELECT id, document_number, document_type, document_date, status FROM gl_documents WHERE document_number = $1`,
      [DN],
    );
    console.log('B) reader SELECT :', sel.rows.length, 'row(s):', JSON.stringify(sel.rows[0] ?? null));
    await c.query('ROLLBACK');

    const rem = await c.query(`SELECT count(*)::int AS n FROM gl_documents WHERE document_number=$1`, [DN]);
    console.log('C) ROLLBACK → remaining =', rem.rows[0].n, '(must be 0)');
  } catch (e) {
    try { await c.query('ROLLBACK'); } catch (_) {}
    console.error('ERROR:', e.message);
  } finally {
    c.release();
    await pool.end();
  }
})();
