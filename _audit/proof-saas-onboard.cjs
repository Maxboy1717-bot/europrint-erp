const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' }); // allow-secret
(async () => {
  const c = await pool.connect(); let id = null;
  try {
    const ins = await c.query(`INSERT INTO saas_tenants (name, domain, status) VALUES ('__PROOF_T__','__proof.local','trial') RETURNING id`);
    id = ins.rows[0].id; const idStr = String(id);
    console.log('0) TENANT    :', id, '(status=trial)');
    // onboard mirror: activate + enable modules
    await c.query(`UPDATE saas_tenants SET status='active', updated_at=NOW() WHERE id=$1`, [id]);
    await c.query(`DELETE FROM saas_tenant_modules WHERE tenant_id=$1`, [idStr]);
    for (const k of ['hr','crm']) await c.query(`INSERT INTO saas_tenant_modules (tenant_id, module_key, is_enabled, enabled_at) VALUES ($1,$2,true,NOW())`, [idStr, k]);
    const st = (await c.query(`SELECT status FROM saas_tenants WHERE id=$1`, [id])).rows[0].status;
    const mods = (await c.query(`SELECT module_key FROM saas_tenant_modules WHERE tenant_id=$1 ORDER BY module_key`, [idStr])).rows.map(r=>r.module_key);
    console.log('1) ONBOARDED : status=', st, '| modules=', JSON.stringify(mods));
    // cleanup
    await c.query(`DELETE FROM saas_tenant_modules WHERE tenant_id=$1`, [idStr]);
    await c.query(`DELETE FROM saas_tenants WHERE id=$1`, [id]);
    const rem = (await c.query(`SELECT count(*)::int n FROM saas_tenants WHERE id=$1`, [id])).rows[0].n;
    console.log('2) CLEANUP   : remaining', rem, '(must be 0)');
  } catch (e) { console.error('ERROR:', e.message); if (id) { try { await c.query(`DELETE FROM saas_tenant_modules WHERE tenant_id=$1`,[String(id)]); await c.query(`DELETE FROM saas_tenants WHERE id=$1`,[id]); } catch(_){} } process.exitCode=1; }
  finally { c.release(); await pool.end(); }
})();
