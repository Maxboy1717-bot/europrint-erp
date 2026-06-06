'use strict';
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg')); // allow-secret
const p = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' }); // allow-secret

async function run() {
  let employeeId, adaptationId, sessionId;
  try {
    // Verify employee_career_profiles table exists and is queryable by employee_id
    const r1 = await p.query(`
      SELECT id FROM employees ORDER BY id LIMIT 1
    `);
    if (r1.rows.length > 0) {
      employeeId = r1.rows[0].id;
      const r1b = await p.query(`
        SELECT * FROM employee_career_profiles WHERE employee_id = $1 LIMIT 1
      `, [employeeId]);
      console.log('employee_career_profiles SELECT by employee_id OK rows=', r1b.rows.length);
    } else {
      // No employees — just verify table structure
      const r1c = await p.query(`SELECT column_name FROM information_schema.columns WHERE table_name='employee_career_profiles' AND column_name='employee_id'`);
      console.log('employee_career_profiles.employee_id column exists=', r1c.rows.length > 0);
    }

    // PATCH /hr/adaptation/:id → UPDATE adaptation_records
    const r2 = await p.query(`
      INSERT INTO adaptation_records (user_id, employee_id, start_date, status, current_phase, created_at, updated_at)
      VALUES (1, 1, CURRENT_DATE, 'planned', 'day1', NOW(), NOW())
      RETURNING id
    `);
    adaptationId = r2.rows[0].id;
    const r2b = await p.query(`
      UPDATE adaptation_records SET
        status        = COALESCE($1::text, status),
        current_phase = COALESCE($2::text, current_phase),
        updated_at    = NOW()
      WHERE id = $3 AND deleted_at IS NULL
      RETURNING id, status, current_phase
    `, ['in_progress', 'week1', adaptationId]);
    console.log('adaptation_records UPDATE OK status=', r2b.rows[0].status, 'phase=', r2b.rows[0].current_phase);
    await p.query(`DELETE FROM adaptation_records WHERE id = $1`, [adaptationId]);
    adaptationId = null;

    // PATCH /hr/ai-interview/session/:id/review → UPDATE ai_interview_sessions
    const r3 = await p.query(`
      INSERT INTO ai_interview_sessions (candidate_id, interview_type, language, current_stage, status, started_at)
      VALUES (1, 'structured', 'uz', 1, 'active', NOW())
      RETURNING id
    `);
    sessionId = r3.rows[0].id;
    await p.query(`
      UPDATE ai_interview_sessions SET
        status = COALESCE($1::text, status)
      WHERE id = $2
    `, ['reviewed', sessionId]);
    const r3b = await p.query(`SELECT status FROM ai_interview_sessions WHERE id = $1`, [sessionId]);
    console.log('ai_interview_sessions status=', r3b.rows[0].status);
    await p.query(`DELETE FROM ai_interview_sessions WHERE id = $1`, [sessionId]);
    sessionId = null;

    console.log('ALL CHECKS PASSED');
  } finally {
    if (adaptationId) await p.query(`DELETE FROM adaptation_records WHERE id=$1`, [adaptationId]);
    if (sessionId) await p.query(`DELETE FROM ai_interview_sessions WHERE id=$1`, [sessionId]);
    p.end();
  }
}
run().catch(e => { console.error('FAIL', e.message); p.end(); process.exit(1); });
