'use strict';
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg')); // allow-secret
const p = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' }); // allow-secret
(async()=>{
  const r1 = await p.query("SELECT column_name, data_type, column_default FROM information_schema.columns WHERE table_name='nps_responses' ORDER BY ordinal_position");
  console.log('nps_responses:', JSON.stringify(r1.rows));
  const r2 = await p.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='sd_payments' ORDER BY ordinal_position");
  console.log('sd_payments:', JSON.stringify(r2.rows));
  await p.end();
})().catch(e=>{ console.error(e.message); process.exit(1); });
