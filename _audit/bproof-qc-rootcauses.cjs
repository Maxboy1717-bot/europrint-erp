/**
 * iter-75 DB-PROOF + APPLY. qc_root_causes katalog-model konvergatsiya.
 * BUG: entity_type/entity_id NOT NULL (eski 5-Why dizayn) → repo INSERT(name,description,category)
 *      ularni yozmaydi → POST /qc/root-causes 23502 not-null violation bilan tushardi.
 * (A) Rollback-tx isbot: ALTER DROP NOT NULL + INSERT(name/desc/cat) ishlaydi, keyin ROLLBACK.
 * (B) APPROVED idempotent ALTER ni COMMIT qiladi (jadval 0 qator → xavfsiz).
 * (C) Tirik sxemada repo INSERT shaklini rollback-tx bilan isbot (kirit→oqdi→ROLLBACK count=0).
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
const MARK = 'ITER75 Material brak';
(async () => {
  const c = await pool.connect();
  try {
    // pre: confirm the bug (entity_type NOT NULL)
    const pre = await c.query(`SELECT is_nullable FROM information_schema.columns WHERE table_name='qc_root_causes' AND column_name='entity_type'`);
    console.log('0) PRE entity_type is_nullable =', pre.rows[0]?.is_nullable, '(NO = bug bor)');

    // (A) rollback-tx: ALTER + INSERT proves it unblocks
    await c.query('BEGIN');
    await c.query(`ALTER TABLE qc_root_causes ALTER COLUMN entity_type DROP NOT NULL`);
    await c.query(`ALTER TABLE qc_root_causes ALTER COLUMN entity_id DROP NOT NULL`);
    const insA = await c.query(
      `INSERT INTO qc_root_causes (name, description, category) VALUES ($1,$2,$3) RETURNING id, name, category, status`,
      [MARK, 'Xom-ashyo sifati past', 'material'],
    );
    console.log('A) ALTER+INSERT (tx) :', JSON.stringify(insA.rows[0]));
    await c.query('ROLLBACK');
    const stillNN = await c.query(`SELECT is_nullable FROM information_schema.columns WHERE table_name='qc_root_causes' AND column_name='entity_type'`);
    console.log('A) ROLLBACK → entity_type is_nullable =', stillNN.rows[0]?.is_nullable, '(NO = tx transactional ✓)');

    // (B) APPLY committed (idempotent)
    await c.query(`ALTER TABLE IF EXISTS qc_root_causes ALTER COLUMN entity_type DROP NOT NULL`);
    await c.query(`ALTER TABLE IF EXISTS qc_root_causes ALTER COLUMN entity_id DROP NOT NULL`);
    const post = await c.query(`SELECT is_nullable FROM information_schema.columns WHERE table_name='qc_root_causes' AND column_name IN ('entity_type','entity_id') ORDER BY column_name`);
    console.log('B) APPLIED → is_nullable =', post.rows.map(r => r.is_nullable).join(','), '(YES,YES = fixed)');

    // (C) live-schema rollback-tx: repo INSERT shape now works
    await c.query('BEGIN');
    const insC = await c.query(
      `INSERT INTO qc_root_causes (name, description, category) VALUES ($1,$2,$3) RETURNING id, name, category, status, is_active`,
      [MARK, 'Operator xatosi', 'operator'],
    );
    console.log('C) INSERTED (live) :', JSON.stringify(insC.rows[0]));
    const sel = await c.query(`SELECT id, name, category FROM qc_root_causes WHERE name=$1 ORDER BY name`, [MARK]);
    console.log('C) SELECTED (list) :', JSON.stringify(sel.rows));
    await c.query('ROLLBACK');
    const rem = await c.query(`SELECT count(*)::int AS n FROM qc_root_causes WHERE name=$1`, [MARK]);
    console.log('C) ROLLBACK → remaining =', rem.rows[0].n, '(must be 0)');
  } catch (e) {
    try { await c.query('ROLLBACK'); } catch (_) {}
    console.error('ERROR:', e.message);
  } finally {
    c.release();
    await pool.end();
  }
})();
