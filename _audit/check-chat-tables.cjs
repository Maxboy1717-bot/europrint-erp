'use strict';
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg')); // allow-secret
const p = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' }); // allow-secret
async function run() {
  const r = await p.query(`SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE '%chat%' ORDER BY table_name`);
  console.log('chat tables:', r.rows.map(x=>x.table_name).join(', '));
  // Check chat_rooms columns
  const r2 = await p.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name='chat_rooms' AND table_schema='public' ORDER BY ordinal_position`);
  if (r2.rows.length) {
    console.log('chat_rooms cols:', r2.rows.map(x=>x.column_name).join(', '));
  }
  // Check chat_messages columns for is_pinned
  const r3 = await p.query(`SELECT column_name FROM information_schema.columns WHERE table_name='chat_messages' AND table_schema='public' AND column_name IN ('is_pinned','pinned','pinned_at','pinned_by')`);
  console.log('chat_messages pin cols:', r3.rows.map(x=>x.column_name).join(', '));
  p.end();
}
run().catch(e => { console.error('FAIL', e.message); p.end(); process.exit(1); });
