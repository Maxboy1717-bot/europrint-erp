'use strict';
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg')); // allow-secret
const p = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' }); // allow-secret

async function run() {
  let qId;
  try {
    // test_questions INSERT
    const r1 = await p.query(
      `INSERT INTO test_questions (test_id, question_text, question_type, options, weight, sort_order, created_at)
       VALUES (0, 'Proof question?', 'text', '[]'::jsonb, 1, 0, NOW()) RETURNING id`
    );
    qId = r1.rows[0].id;
    console.log('test_questions INSERT OK id=', qId);

    // test_questions UPDATE
    await p.query(`UPDATE test_questions SET question_text='Updated Q?' WHERE id=$1`, [qId]);
    const r2 = await p.query(`SELECT question_text FROM test_questions WHERE id=$1`, [qId]);
    console.log('test_questions PATCH OK text=', r2.rows[0].question_text);

    // ai_interview_sessions SELECT (5 existing rows)
    const r3 = await p.query(`SELECT COUNT(*)::int AS cnt FROM ai_interview_sessions`);
    console.log('ai_interview_sessions COUNT=', r3.rows[0].cnt);

    // production_orders SELECT
    const r4 = await p.query(`SELECT COUNT(*)::int AS cnt FROM production_orders`);
    console.log('production_orders COUNT=', r4.rows[0].cnt);

    console.log('ALL CHECKS PASSED');
  } finally {
    if (qId) await p.query('DELETE FROM test_questions WHERE id=$1', [qId]);
    console.log('Cleanup done');
    p.end();
  }
}
run().catch(e => { console.error('FAIL', e.message); p.end(); process.exit(1); });
