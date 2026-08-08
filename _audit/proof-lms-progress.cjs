/**
 * LMS DB-PROOF: /video-progress (video_progress.user_id INTEGER), /progress + /progress/user/:id
 * (lms_enrollments by employee_id INTEGER; user_id is uuid). Insert -> mirror queries -> cleanup.
 */
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' }); // allow-secret
(async () => {
  const c = await pool.connect();
  let vpId = null, enId = null;
  try {
    const vp = await c.query(
      `INSERT INTO video_progress (user_id, lesson_id, "current_time", duration, completed, last_watched_at, created_at)
       VALUES (999999, 888, 30, 120, false, NOW(), NOW()) RETURNING id`);
    vpId = vp.rows[0].id;
    const en = await c.query(
      `INSERT INTO lms_enrollments (employee_id, user_id, course_id, progress_percent, status, updated_at, created_at)
       VALUES (999999, gen_random_uuid(), 777, 50, 'in_progress', NOW(), NOW()) RETURNING id`);
    enId = en.rows[0].id;
    console.log('1) INSERTED   : video_progress', vpId, '+ lms_enrollments', enId);

    const vpr = (await c.query(`SELECT id, user_id, "current_time", duration FROM video_progress WHERE user_id = 999999`)).rows;
    console.log('2) VIDEO-PROG :', vpr.length, 'row(s);', JSON.stringify(vpr[0]));
    const pr = (await c.query(`SELECT id, employee_id, progress_percent, status FROM lms_enrollments WHERE employee_id = 999999`)).rows;
    console.log('3) USER-PROG  :', pr.length, 'enrollment(s);', JSON.stringify(pr[0]));

    await c.query(`DELETE FROM video_progress WHERE id=$1`, [vpId]);
    await c.query(`DELETE FROM lms_enrollments WHERE id=$1`, [enId]);
    const rem = (await c.query(`SELECT (SELECT count(*) FROM video_progress WHERE id=$1) + (SELECT count(*) FROM lms_enrollments WHERE id=$2) AS n`, [vpId, enId])).rows[0].n;
    console.log('4) CLEANUP    : remaining', rem, '(must be 0)');
  } catch (e) {
    console.error('ERROR:', e.message);
    if (vpId) { try { await c.query(`DELETE FROM video_progress WHERE id=$1`, [vpId]); } catch (_) {} }
    if (enId) { try { await c.query(`DELETE FROM lms_enrollments WHERE id=$1`, [enId]); } catch (_) {} }
    process.exitCode = 1;
  } finally { c.release(); await pool.end(); }
})();
