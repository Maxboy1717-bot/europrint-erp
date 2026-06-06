'use strict';
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg')); // allow-secret
const p = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' }); // allow-secret

async function main() {
  // All objects dependent on orders using pg_depend
  const deps = await p.query(`
    SELECT
      dep.classid::regclass AS dep_class,
      dep.objid,
      obj.relname AS dep_name,
      dep.deptype
    FROM pg_depend dep
    JOIN pg_class obj ON obj.oid = dep.objid
    JOIN pg_class ref ON ref.oid = dep.refobjid
    WHERE ref.relname = 'orders'
      AND ref.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
      AND dep.deptype != 'i'
    ORDER BY dep.deptype, obj.relname
  `);
  console.log('Dependents on orders:');
  deps.rows.forEach(r => console.log(' ', r.dep_name, '| type:', r.deptype));

  await p.end();
}

main().catch(e => { console.error(e.message); process.exit(1); });
