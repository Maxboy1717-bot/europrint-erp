'use strict';
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg')); // allow-secret
const p = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' }); // allow-secret
p.query("SELECT column_name FROM information_schema.columns WHERE table_name='adaptation_records' ORDER BY ordinal_position")
  .then(r => { console.log(r.rows.map(x => x.column_name).join(', ')); p.end(); })
  .catch(e => { console.error(e.message); p.end(); process.exit(1); });
