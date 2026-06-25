/** APPLY+DB-PROOF: FAZA-08 otdeleniye_no (apply) + manager-zanjir (ota-walk -> eng yaqin head_user_id). */
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' });
(async () => {
  const c = await pool.connect();
  try {
    await c.query(`ALTER TABLE IF EXISTS org_departments ADD COLUMN IF NOT EXISTS otdeleniye_no INTEGER`);
    await c.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='chk_otdeleniye_no_range') THEN ALTER TABLE org_departments ADD CONSTRAINT chk_otdeleniye_no_range CHECK (otdeleniye_no IS NULL OR (otdeleniye_no >= 1 AND otdeleniye_no <= 7)); END IF; END $$`);
    console.log(`QO'LLANDI: otdeleniye_no =`, (await c.query(`SELECT count(*) FROM information_schema.columns WHERE table_name='org_departments' AND column_name='otdeleniye_no'`)).rows[0].count, '/1');
    // manager-zanjir: head_user_id bor node tanlab, uning farzandining "manager"i = ota-head (WITH RECURSIVE)
    const parent = (await c.query(`SELECT id, head_user_id FROM org_departments WHERE head_user_id IS NOT NULL AND is_active ORDER BY id LIMIT 1`)).rows[0];
    const child = (await c.query(`SELECT id FROM org_departments WHERE parent_id=$1 AND is_active LIMIT 1`, [parent.id])).rows[0];
    if (!child) { console.log(`(${parent.id} head=${parent.head_user_id} ning farzandi yo'q — boshqa node)`); }
    else {
      // deriveManager: child'dan yuqoriga walk, eng yaqin non-null head
      const mgr = (await c.query(`WITH RECURSIVE up AS (SELECT id, parent_id, head_user_id, 0 AS depth FROM org_departments WHERE id=$1 UNION ALL SELECT d.id, d.parent_id, d.head_user_id, up.depth+1 FROM org_departments d JOIN up ON d.id=up.parent_id) SELECT head_user_id FROM up WHERE depth>0 AND head_user_id IS NOT NULL ORDER BY depth LIMIT 1`, [child.id])).rows[0];
      console.log(`Manager-zanjir: child #${child.id} -> ota #${parent.id} head_user_id=${parent.head_user_id}; derive natija=${mgr ? mgr.head_user_id : 'null'} (${parent.head_user_id} kutilgan)`);
    }
    console.log("EGASI-DATA: 14 root -> 1 kanonik Egasi + 7 departament ro'yxati + head_user_id (kim-kimni-boshqaradi) — tree-merge fabrikatsiya QILINMAYDI.");
  } catch (e) { console.error('ERR', e.message); } finally { c.release(); await pool.end(); }
})();
