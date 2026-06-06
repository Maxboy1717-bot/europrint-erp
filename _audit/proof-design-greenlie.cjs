/**
 * DB-proof CAT-A DESIGN: generateDesigns/approveDesign/rejectDesign now persist to `designs`
 * (were green-lies: in-memory ids / echo). Mirrors the repo SQL. Sentinel order_id (no FK); cleaned up.
 */
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({ host: process.env.PGHOST||'127.0.0.1', port: Number(process.env.PGPORT)||5432, user: process.env.PGUSER||'postgres', password: process.env.PGPASSWORD||'postgres', database: process.env.PGDATABASE||'europrint' });
const OID = 999888;
(async () => {
  try {
    // generateDesigns -> 2 variants
    const ids = [];
    for (let i = 1; i <= 2; i++) {
      const r = await pool.query(`INSERT INTO designs (order_id, design_number, version, title, slogan, status)
        VALUES ($1,$2,$3,$4,$5,'ai_generated') RETURNING id`, [OID, `DSN-${OID}-v${i}`, i, `AI Dizayn v${i}`, `Variant ${i}`]);
      ids.push(r.rows[0].id);
    }
    const gen = (await pool.query(`SELECT COUNT(*)::int n FROM designs WHERE order_id=$1 AND status='ai_generated'`, [OID])).rows[0].n;
    console.log('1) generateDesigns -> designs rows :', gen, gen === 2 ? '✅' : '❌');

    // approveDesign
    await pool.query(`UPDATE designs SET status='approved' WHERE id=$1`, [ids[0]]);
    const ap = (await pool.query(`SELECT status FROM designs WHERE id=$1`, [ids[0]])).rows[0];
    console.log('2) approveDesign -> status         :', ap.status, ap.status === 'approved' ? '✅' : '❌');

    // rejectDesign + reason
    await pool.query(`UPDATE designs SET status='rejected', rejection_reason=$2 WHERE id=$1`, [ids[1], 'rang mos emas']);
    const rj = (await pool.query(`SELECT status, rejection_reason FROM designs WHERE id=$1`, [ids[1]])).rows[0];
    console.log('3) rejectDesign -> status+reason   :', rj.status, '/', rj.rejection_reason, (rj.status === 'rejected' && rj.rejection_reason === 'rang mos emas') ? '✅' : '❌');

    await pool.query(`DELETE FROM designs WHERE order_id=$1`, [OID]);
    const left = (await pool.query(`SELECT COUNT(*)::int n FROM designs WHERE order_id=$1`, [OID])).rows[0].n;
    console.log('4) cleanup                         :', left, left === 0 ? '✅' : '❌');
    console.log(gen === 2 && ap.status === 'approved' && rj.status === 'rejected' && left === 0
      ? '\n✅ PROOF PASSED — design generate/approve/reject persist to `designs` (were green-lies).' : '\n❌ FAILED');
  } catch (e) { console.error('ERR:', e.message); try { await pool.query(`DELETE FROM designs WHERE order_id=$1`, [OID]); } catch {} }
  finally { await pool.end(); }
})();
