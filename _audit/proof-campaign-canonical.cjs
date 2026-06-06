/**
 * DB-proof: full campaign lifecycle on the CANONICAL marketing_campaigns (owner 2026-06-05).
 * Mirrors campaigns.repository.ts raw SQL exactly — casts (budget::numeric, *_date::timestamp,
 * created_by::integer), camelCase aliases (startDate/createdAt), COALESCE update, soft-delete.
 * Proves: create persists + camelCase shape; created_by string->integer; update keeps untouched
 * fields; soft-delete hides from the list (deleted_at IS NULL). Read-then-hard-delete (no residue).
 */
const path = require('path');
const crypto = require('crypto');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({
  host: process.env.PGHOST || '127.0.0.1', port: Number(process.env.PGPORT) || 5432,
  user: process.env.PGUSER || 'postgres', password: process.env.PGPASSWORD || 'postgres',
  database: process.env.PGDATABASE || 'europrint',
});
const COLS = `id, name, description, type, platform, status, budget,
  spent_amount AS "spentAmount", start_date AS "startDate", end_date AS "endDate",
  target_audience AS "targetAudience", created_by AS "createdBy",
  created_at AS "createdAt", updated_at AS "updatedAt", deleted_at AS "deletedAt"`;

(async () => {
  const id = crypto.randomUUID();
  let ok = true;
  try {
    // CREATE (repo.create SQL: explicit uuid + casts + aliased RETURNING)
    const ins = await pool.query(
      `INSERT INTO marketing_campaigns
         (id, name, description, type, platform, status, budget, start_date, end_date, target_audience, created_by, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7::numeric,$8::timestamp,$9::timestamp,$10,$11::integer,NOW(),NOW())
       RETURNING ${COLS}`,
      [id, 'PROOF Kampaniya', 'tavsif', 'digital', 'telegram', 'draft', '5000', '2026-07-01', '2026-08-01', null, '30']);
    const c = ins.rows[0];
    const createOk = c && c.startDate instanceof Date && c.createdBy === 30 && c.type === 'digital' && c.platform === 'telegram';
    console.log('1) CREATE  :', createOk ? '✅' : '❌', `camelCase startDate=${c && c.startDate && c.startDate.toISOString().slice(0,10)} createdBy=${c && c.createdBy}(int)`);
    ok = ok && createOk;

    // UPDATE (repo.update SQL: COALESCE — change status+budget only, keep name/platform)
    const upd = await pool.query(
      `UPDATE marketing_campaigns SET
         name=COALESCE($2,name), status=COALESCE($3,status), budget=COALESCE($4::numeric,budget),
         platform=COALESCE($5,platform), updated_at=NOW()
       WHERE id=$1 AND deleted_at IS NULL RETURNING ${COLS}`,
      [id, null, 'active', '7777', null]);
    const u = upd.rows[0];
    const updOk = u && u.status === 'active' && Number(u.budget) === 7777 && u.name === 'PROOF Kampaniya' && u.platform === 'telegram';
    console.log('2) UPDATE  :', updOk ? '✅' : '❌', `status=${u && u.status} budget=${u && u.budget} (name/platform preserved=${u && u.name==='PROOF Kampaniya' && u.platform==='telegram'})`);
    ok = ok && updOk;

    // LIST sees it (deleted_at IS NULL)
    const before = await pool.query(`SELECT COUNT(*)::int n FROM marketing_campaigns WHERE id=$1 AND deleted_at IS NULL`, [id]);
    console.log('3) IN LIST :', before.rows[0].n === 1 ? '✅' : '❌');
    ok = ok && before.rows[0].n === 1;

    // SOFT-DELETE -> hidden from list
    await pool.query(`UPDATE marketing_campaigns SET deleted_at=NOW() WHERE id=$1`, [id]);
    const after = await pool.query(`SELECT COUNT(*)::int n FROM marketing_campaigns WHERE id=$1 AND deleted_at IS NULL`, [id]);
    console.log('4) SOFTDEL :', after.rows[0].n === 0 ? '✅ hidden from list' : '❌');
    ok = ok && after.rows[0].n === 0;

    // CLEANUP (hard delete the proof row)
    await pool.query(`DELETE FROM marketing_campaigns WHERE id=$1`, [id]);
    const gone = await pool.query(`SELECT COUNT(*)::int n FROM marketing_campaigns WHERE id=$1`, [id]);
    console.log('5) CLEANUP :', gone.rows[0].n === 0 ? '✅' : '❌');
    ok = ok && gone.rows[0].n === 0;

    console.log(ok ? '\n✅ PROOF PASSED — full campaign lifecycle works on canonical marketing_campaigns.' : '\n❌ PROOF FAILED');
  } catch (e) {
    console.error('PROOF ERROR:', e.message);
    try { await pool.query(`DELETE FROM marketing_campaigns WHERE id=$1`, [id]); } catch {}
  } finally {
    await pool.end();
  }
})();
