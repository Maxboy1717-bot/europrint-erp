'use strict';
/**
 * T8-05 DB-PROOF: MES checkOperatorCertification real cert-gate (stub -> real).
 * Mirrors drizzle-mes.repo.ts checkOperatorCertification SQL inside ONE rollback tx.
 * Proves: empty=closed; passed-test+completed-topics=valid; partial=closed;
 *         active operator_certifications ledger=valid. Nothing persists (ROLLBACK).
 */
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' });

// Mirror of repo logic for a given (operatorId, courseId) within the same tx/client.
async function gate(c, operatorId, courseId) {
  const certR = await c.query(
    `SELECT course_name, expires_at, status FROM operator_certifications
     WHERE operator_id=$1 AND course_id=$2 AND deleted_at IS NULL LIMIT 1`, [operatorId, courseId]);
  const cert = certR.rows[0];
  if (cert) {
    const notExpired = cert.expires_at ? new Date(cert.expires_at) > new Date() : false;
    const active = String(cert.status || '') === 'active';
    return { valid: active && notExpired, courseName: cert.course_name, src: 'ledger' };
  }
  const courseR = await c.query(`SELECT title, passing_score FROM courses WHERE id=$1 LIMIT 1`, [courseId]);
  const courseRow = courseR.rows[0];
  if (!courseRow) return { valid: false, courseName: 'Unknown Course', src: 'no-course' };
  const passThresholdPct = Number(courseRow.passing_score ?? 70);
  const attemptR = await c.query(
    `SELECT COALESCE(MAX(score),0) AS best FROM lms_test_attempts
     WHERE user_id=$1 AND course_id=$2 AND passed=true`, [String(operatorId), String(courseId)]);
  const bestScorePct = Number(attemptR.rows[0]?.best ?? 0);
  const theoryPassed = bestScorePct >= passThresholdPct;
  const topicR = await c.query(
    `SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE completed=true) AS done FROM course_progress
     WHERE user_id=$1 AND course_id=$2`, [operatorId, courseId]);
  const total = Number(topicR.rows[0]?.total ?? 0);
  const done = Number(topicR.rows[0]?.done ?? 0);
  const topicsCompleted = total > 0 && done >= total;
  return { valid: theoryPassed && topicsCompleted, courseName: courseRow.title, src: 'evidence',
           bestScorePct, passThresholdPct, total, done };
}

(async () => {
  const c = await pool.connect();
  try {
    await c.query('BEGIN');
    const course = (await c.query(`SELECT id, COALESCE(passing_score,70) ps FROM courses ORDER BY id LIMIT 1`)).rows[0];
    if (!course) { console.log('SKIP: no courses'); await c.query('ROLLBACK'); return; }
    const courseId = Number(course.id);
    const ps = Number(course.ps);
    const op = 990001; // synthetic operator id (rolled back)
    console.log('picked course:', JSON.stringify({ courseId, passing_score: ps }), 'operator:', op);

    console.log('\nA) EMPTY (no cert, no attempt, no progress) -> expect valid=false');
    console.log('   ', JSON.stringify(await gate(c, op, courseId)));

    console.log('\nB) PARTIAL: passed test but topics NOT all completed -> expect valid=false');
    await c.query(`INSERT INTO lms_test_attempts (id,user_id,test_id,course_id,score,passed,created_at)
                   VALUES ($1,$2,$3,$4,$5,true,NOW())`,
                  ['t8-'+op, String(op), 't', String(courseId), Math.max(ps, 100)]);
    await c.query(`INSERT INTO course_progress (user_id,lesson_id,course_id,video_position,completed,last_accessed_at,created_at)
                   VALUES ($1,$2,$3,0,false,NOW(),NOW())`, [op, 990011, courseId]); // 1 topic incomplete
    console.log('   ', JSON.stringify(await gate(c, op, courseId)));

    console.log('\nC) FULL EVIDENCE: passed test + all topics completed -> expect valid=true');
    await c.query(`UPDATE course_progress SET completed=true, completed_at=NOW() WHERE user_id=$1 AND course_id=$2`, [op, courseId]);
    console.log('   ', JSON.stringify(await gate(c, op, courseId)));

    console.log('\nD) LEDGER active+future-expiry -> expect valid=true (fast path)');
    const op2 = 990002;
    await c.query(`INSERT INTO operator_certifications (operator_id,course_id,course_name,issued_at,expires_at,status,created_at)
                   VALUES ($1,$2,'Press 101',NOW(),NOW()+INTERVAL '365 days','active',NOW())`, [op2, courseId]);
    console.log('   ', JSON.stringify(await gate(c, op2, courseId)));

    console.log('\nE) LEDGER expired -> expect valid=false (hard block, no evidence fallthrough)');
    const op3 = 990003;
    await c.query(`INSERT INTO operator_certifications (operator_id,course_id,course_name,issued_at,expires_at,status,created_at)
                   VALUES ($1,$2,'Press 101',NOW()-INTERVAL '400 days',NOW()-INTERVAL '1 day','active',NOW())`, [op3, courseId]);
    console.log('   ', JSON.stringify(await gate(c, op3, courseId)));

    await c.query('ROLLBACK');
    console.log('\nROLLBACK done — no data persisted.');
  } catch (e) {
    try { await c.query('ROLLBACK'); } catch (_) {}
    console.error('ERROR:', e.message);
    process.exitCode = 1;
  } finally { c.release(); await pool.end(); }
})();
