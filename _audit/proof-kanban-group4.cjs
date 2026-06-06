'use strict';
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg')); // allow-secret
const p = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' }); // allow-secret

async function run() {
  let fileId;
  try {
    // #7 task_chat_message_files INSERT (message_id=0 - no FK constraint)
    const r1 = await p.query(
      `INSERT INTO task_chat_message_files (message_id, file_name, file_url, created_at)
       VALUES (0, 'proof.pdf', 'https://example.com/proof.pdf', NOW()) RETURNING id`
    );
    fileId = r1.rows[0].id;
    console.log('task_chat_message_files INSERT OK id=', fileId);

    // task_chat_message_files SELECT
    const r2 = await p.query(`SELECT file_name, file_url FROM task_chat_message_files WHERE id=$1`, [fileId]);
    console.log('task_chat_message_files SELECT OK:', r2.rows[0]);

    // #8 task_projects SELECT
    const r3 = await p.query(`SELECT COUNT(*)::int AS cnt FROM task_projects WHERE deleted_at IS NULL`);
    console.log('task_projects SELECT OK count=', r3.rows[0].cnt);

    console.log('ALL CHECKS PASSED');
  } finally {
    if (fileId) await p.query('DELETE FROM task_chat_message_files WHERE id=$1', [fileId]);
    console.log('Cleanup done');
    p.end();
  }
}
run().catch(e => { console.error('FAIL', e.message); p.end(); process.exit(1); });
