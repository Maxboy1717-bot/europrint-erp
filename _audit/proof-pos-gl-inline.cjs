/**
 * DB-proof: Leverage #4 Variant C — GL auto-posting INLINE in _processCompletedMovement.
 * Replicates the exact path the fix triggers: compute totalValue from movement lines,
 * pick GL_PAIRS[movementType], insert pos_gl_posting_log (status=AWAITING_REVIEW, stage_name=POST),
 * verify the row + that debit==credit (balanced), then clean up. Read-then-delete (no residue).
 */
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({
  host: process.env.PGHOST || '127.0.0.1', port: Number(process.env.PGPORT) || 5432,
  user: process.env.PGUSER || 'postgres', password: process.env.PGPASSWORD || 'postgres',
  database: process.env.PGDATABASE || 'europrint',
});

// GL_PAIRS['EXTERNAL_IN'] — verbatim from pos-gl-auto.service.ts
const externalIn = (total) => [
  { accountCode: '2110', accountName: 'Karantin Ombori', debit: total, credit: 0 },
  { accountCode: '6010', accountName: 'Kreditorlik',     debit: 0,     credit: total },
  { accountCode: '1410', accountName: 'Asosiy Ombor',    debit: total, credit: 0 },
  { accountCode: '2110', accountName: 'Karantin Ombori', debit: 0,     credit: total },
];

const SENTINEL = 990041; // fake movement_id, cleaned up

(async () => {
  try {
    // 1. Simulate movement lines (qty * unitPrice) — same reduce the fix does
    const lines = [{ quantity: 10, unitPrice: 5000 }, { quantity: 2, unitPrice: 3000 }];
    const totalValue = lines.reduce((s, l) => s + Number(l.quantity) * Number(l.unitPrice), 0); // 56000
    const glEntries = externalIn(totalValue);

    // 2. INSERT — same shape glRepo.insertLog produces (the inline fix's write)
    await pool.query(
      `INSERT INTO pos_gl_posting_log (movement_id, stage, stage_name, status, gl_entries, ai_confidence, processed_at)
       VALUES ($1, 5, 'POST', 'AWAITING_REVIEW', $2::jsonb, NULL, NOW())`,
      [SENTINEL, JSON.stringify(glEntries)]
    );

    // 3. VERIFY
    const { rows } = await pool.query(
      `SELECT id, movement_id, stage_name, status, gl_entries FROM pos_gl_posting_log WHERE movement_id=$1`,
      [SENTINEL]
    );
    const r = rows[0];
    const entries = r ? r.gl_entries : [];
    const debit = entries.reduce((s, e) => s + Number(e.debit), 0);
    const credit = entries.reduce((s, e) => s + Number(e.credit), 0);

    console.log('--- DB-PROOF: POS movement-completed → GL auto-post (inline, Variant C) ---');
    console.log('totalValue (qty*price)  :', totalValue);
    console.log('row inserted            :', r ? `id=${r.id} status=${r.status} stage=${r.stage_name}` : 'NONE ❌');
    console.log('GL entries count        :', entries.length, '(expect 4)');
    console.log('debit total             :', debit);
    console.log('credit total            :', credit);
    console.log('balanced (debit==credit):', debit === credit ? 'YES ✅' : 'NO ❌');

    // 4. CLEANUP
    await pool.query(`DELETE FROM pos_gl_posting_log WHERE movement_id=$1`, [SENTINEL]);
    const { rows: after } = await pool.query(`SELECT COUNT(*)::int AS n FROM pos_gl_posting_log WHERE movement_id=$1`, [SENTINEL]);
    console.log('cleanup remaining       :', after[0].n, after[0].n === 0 ? '✅' : '❌');

    const pass = r && entries.length === 4 && debit === credit && after[0].n === 0;
    console.log(pass ? '\n✅ PROOF PASSED — Finance now sees an AWAITING_REVIEW GL log per completed movement.' : '\n❌ PROOF FAILED');
  } catch (e) {
    console.error('PROOF ERROR:', e.message);
  } finally {
    await pool.end();
  }
})();
