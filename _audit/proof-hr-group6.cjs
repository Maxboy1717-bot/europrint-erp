'use strict';
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg')); // allow-secret
const p = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' }); // allow-secret

async function run() {
  let sessionId;
  try {
    // #14 hr_tool_test_results SELECT
    const r1 = await p.query(`SELECT COUNT(*)::int AS cnt FROM hr_tool_test_results WHERE candidate_id = 0`);
    console.log('hr_tool_test_results SELECT OK count=', r1.rows[0].cnt);

    // #15 hr_interview_sessions INSERT
    const r2 = await p.query(
      `INSERT INTO hr_interview_sessions (session_type, status, created_at)
       VALUES ('hrc', 'pending', NOW()) RETURNING id`
    );
    sessionId = r2.rows[0].id;
    console.log('hr_interview_sessions INSERT OK id=', sessionId);

    // #17a hrc_iq_questions SELECT
    const r3 = await p.query(`SELECT COUNT(*)::int AS cnt FROM hrc_iq_questions`);
    console.log('hrc_iq_questions SELECT OK count=', r3.rows[0].cnt);

    // #17b hr_interview_sessions stats
    const r4 = await p.query(`SELECT COUNT(*)::int AS cnt FROM hr_interview_sessions`);
    console.log('hr_interview_sessions stats OK count=', r4.rows[0].cnt);

    // #18 employee_360_assessments
    const r5 = await p.query(`SELECT COUNT(*)::int AS cnt FROM employee_360_assessments`);
    console.log('employee_360_assessments SELECT OK count=', r5.rows[0].cnt);

    // #19 enps_surveys + enps_survey_responses
    const r6 = await p.query(`SELECT COUNT(*)::int AS cnt FROM enps_surveys`);
    console.log('enps_surveys SELECT OK count=', r6.rows[0].cnt);

    // #20 employee_career_profiles
    const r7 = await p.query(`SELECT COUNT(*)::int AS cnt FROM employee_career_profiles`);
    console.log('employee_career_profiles SELECT OK count=', r7.rows[0].cnt);

    // #21 offboarding_checklist_items
    const r8 = await p.query(`SELECT COUNT(*)::int AS cnt FROM offboarding_checklist_items`);
    console.log('offboarding_checklist_items SELECT OK count=', r8.rows[0].cnt);

    // #22 hr_candidate_funnels (checklist_data)
    const r9 = await p.query(`SELECT COUNT(*)::int AS cnt FROM hr_candidate_funnels WHERE checklist_data IS NOT NULL`);
    console.log('hr_candidate_funnels SELECT OK count=', r9.rows[0].cnt);

    console.log('ALL CHECKS PASSED');
  } finally {
    if (sessionId) await p.query('DELETE FROM hr_interview_sessions WHERE id=$1', [sessionId]);
    console.log('Cleanup done');
    p.end();
  }
}
run().catch(e => { console.error('FAIL', e.message); p.end(); process.exit(1); });
