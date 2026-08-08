const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' }); // allow-secret
(async () => {
  const c = await pool.connect();
  const T = '__PROOF_TENANT__';
  try {
    // mirror setTenantModules (DELETE + INSERT replace-set)
    await c.query(`BEGIN`);
    await c.query(`DELETE FROM saas_tenant_modules WHERE tenant_id=$1`, [T]);
    for (const k of ['hr','finance','crm']) {
      await c.query(`INSERT INTO saas_tenant_modules (tenant_id, module_key, is_enabled, enabled_at) VALUES ($1,$2,true,NOW())`, [T, k]);
    }
    await c.query(`COMMIT`);
    // mirror getTenantModules (read)
    const r = (await c.query(`SELECT module_key, is_enabled FROM saas_tenant_modules WHERE tenant_id=$1 ORDER BY module_key`, [T])).rows;
    console.log('1) SET+READ :', r.length, 'module(s);', JSON.stringify(r));
    // cleanup
    const del = await c.query(`DELETE FROM saas_tenant_modules WHERE tenant_id=$1`, [T]);
    console.log('2) CLEANUP  :', del.rowCount, 'deleted');
    const rem = (await c.query(`SELECT count(*)::int n FROM saas_tenant_modules WHERE tenant_id=$1`, [T])).rows[0].n;
    console.log('3) REMAINING:', rem, '(must be 0)');
  } catch (e) { console.error('ERROR:', e.message); try { await c.query(`ROLLBACK`); await c.query(`DELETE FROM saas_tenant_modules WHERE tenant_id=$1`, [T]); } catch(_){} process.exitCode=1; }
  finally { c.release(); await pool.end(); }
})();
