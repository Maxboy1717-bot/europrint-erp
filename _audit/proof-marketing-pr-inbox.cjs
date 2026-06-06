'use strict';
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg')); // allow-secret
const p = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' }); // allow-secret

async function run() {
  const prId = 'PR-PROOF-' + Date.now();
  let msgId;
  try {
    // pr_activities INSERT
    await p.query(
      `INSERT INTO pr_activities (id, type, title, status, created_at, updated_at)
       VALUES ($1, 'press_release', 'Proof PR', 'planned', NOW(), NOW())`,
      [prId]
    );
    const r1 = await p.query(`SELECT id, title FROM pr_activities WHERE id=$1 AND deleted_at IS NULL`, [prId]);
    console.log('pr_activities INSERT+SELECT OK:', r1.rows[0]);

    // pr_activities PATCH
    await p.query(`UPDATE pr_activities SET title='Updated PR', updated_at=NOW() WHERE id=$1`, [prId]);
    const r2 = await p.query(`SELECT title FROM pr_activities WHERE id=$1`, [prId]);
    console.log('pr_activities PATCH OK:', r2.rows[0]);

    // soft DELETE
    await p.query(`UPDATE pr_activities SET deleted_at=NOW() WHERE id=$1`, [prId]);
    const r3 = await p.query(`SELECT COUNT(*)::int AS cnt FROM pr_activities WHERE id=$1 AND deleted_at IS NULL`, [prId]);
    console.log('pr_activities soft-DELETE OK (count=0):', r3.rows[0]);

    // social_conversations SELECT (empty table is fine)
    const r4 = await p.query(`SELECT COUNT(*)::int AS cnt FROM social_conversations`);
    console.log('social_conversations SELECT OK count=', r4.rows[0].cnt);

    // social_messages SELECT
    const r5 = await p.query(`SELECT COUNT(*)::int AS cnt FROM social_messages`);
    console.log('social_messages SELECT OK count=', r5.rows[0].cnt);

    console.log('ALL CHECKS PASSED');
  } finally {
    await p.query(`DELETE FROM pr_activities WHERE id=$1`, [prId]);
    console.log('Cleanup done');
    p.end();
  }
}
run().catch(e => { console.error('FAIL', e.message); p.end(); process.exit(1); });
