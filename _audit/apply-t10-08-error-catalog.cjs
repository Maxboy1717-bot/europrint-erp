/** T10-08 — XATO-KATALOG (error_catalog) jonli apply. ADDITIV, IF NOT EXISTS (idempotent).
 *  migrations-drift.ts T10-08 bloki bilan AYNAN bir xil DDL. Jadval BO'SH tug'iladi (Q-40). */
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' });
(async () => {
  const c = await pool.connect();
  try {
    await c.query(`
      CREATE TABLE IF NOT EXISTS error_catalog (
        id            SERIAL PRIMARY KEY,
        card_id       INTEGER,
        code          TEXT,
        name          TEXT NOT NULL,
        name_ru       TEXT,
        category      TEXT,
        severity      TEXT,
        description   TEXT,
        sort_order    INTEGER NOT NULL DEFAULT 0,
        is_active     BOOLEAN NOT NULL DEFAULT TRUE,
        created_by    INTEGER,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at    TIMESTAMPTZ
      )`);
    await c.query(`CREATE INDEX IF NOT EXISTS idx_error_catalog_card_id ON error_catalog (card_id)`);
    await c.query(`CREATE INDEX IF NOT EXISTS idx_error_catalog_category ON error_catalog (category)`);
    await c.query(`CREATE UNIQUE INDEX IF NOT EXISTS uq_error_catalog_code_active ON error_catalog (code) WHERE code IS NOT NULL AND is_active = TRUE AND deleted_at IS NULL`);
    const r = (await c.query(`
      SELECT to_regclass('public.error_catalog') t,
             (SELECT count(*)::int FROM information_schema.columns WHERE table_name='error_catalog') cols,
             (SELECT count(*)::int FROM error_catalog) rows,
             (SELECT count(*)::int FROM pg_indexes WHERE tablename='error_catalog') idx`)).rows[0];
    console.log(`QO'LLANDI: error_catalog=${r.t}, ustun=${r.cols} (14 kutilgan), qator=${r.rows} (0 — BO'SH tug'iladi), index=${r.idx}`);
  } catch (e) { console.error('ERR', e.message); } finally { c.release(); await pool.end(); }
})();
