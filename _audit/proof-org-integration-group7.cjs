'use strict';
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg')); // allow-secret
const p = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' }); // allow-secret

async function run() {
  try {
    // #23 node_hr_requests (org-structure nodes/:nodeId/history)
    const r1 = await p.query(`
      SELECT COUNT(*)::int AS cnt FROM node_hr_requests WHERE node_id = 0
    `);
    console.log('node_hr_requests SELECT OK count=', r1.rows[0].cnt);

    // Verify columns exist
    const r2 = await p.query(`
      SELECT id, node_id, request_type, priority, status, comment, node_name, requester_id, created_at, updated_at
      FROM node_hr_requests
      ORDER BY created_at DESC
      LIMIT 3
    `);
    console.log('node_hr_requests columns OK rows=', r2.rows.length, r2.rows[0] ?? '(empty OK)');

    // #25 employee_skill_scores (integration/skill-gap list)
    const r3 = await p.query(`
      SELECT id, employee_id, skill_code, current_level, assessed_by, last_assessed_at, created_at
      FROM employee_skill_scores
      ORDER BY employee_id ASC, last_assessed_at DESC NULLS LAST
      LIMIT 5
    `);
    console.log('employee_skill_scores SELECT OK rows=', r3.rows.length, r3.rows[0] ?? '(empty OK)');

    console.log('ALL CHECKS PASSED');
  } finally {
    p.end();
  }
}
run().catch(e => { console.error('FAIL', e.message); p.end(); process.exit(1); });
