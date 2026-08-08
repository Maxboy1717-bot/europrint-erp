/** APPLY (jonli, FAZA-00 D6): org_node_portret.card_id FK org_functions->org_departments.
 *  GUARDED idempotent. 0 qator -> trivial. */
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' });
(async () => {
  const c = await pool.connect();
  try {
    const cur = (await c.query(`SELECT confrelid::regclass::text ref FROM pg_constraint WHERE conname='org_node_portret_card_id_fkey'`)).rows[0];
    if (!cur || cur.ref !== 'org_functions') { console.log("O'TKAZIB YUBORILDI: FK ->", cur ? cur.ref : '(yo\'q)'); return; }
    await c.query(`ALTER TABLE org_node_portret DROP CONSTRAINT IF EXISTS org_node_portret_card_id_fkey`);
    await c.query(`ALTER TABLE org_node_portret ADD CONSTRAINT org_node_portret_card_id_fkey FOREIGN KEY (card_id) REFERENCES org_departments(id)`);
    const after = (await c.query(`SELECT confrelid::regclass::text ref FROM pg_constraint WHERE conname='org_node_portret_card_id_fkey'`)).rows[0].ref;
    console.log('QO\'LLANDI: org_node_portret.card_id FK ->', after, '(org_departments kutilgan)');
  } catch (e) { console.error('ERR', e.message); }
  finally { c.release(); await pool.end(); }
})();
