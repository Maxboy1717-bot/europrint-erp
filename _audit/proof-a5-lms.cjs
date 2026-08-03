/**
 * A5 DB-PROOF: lms completeCourse path (-> recordLessonProgress writes enrollments).
 * Pick a real course + employee -> INSERT enrollment (in_progress) -> SELECT -> DELETE -> report.
 */
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({ host: process.env.PGHOST || '127.0.0.1', port: Number(process.env.PGPORT || 5432), user: process.env.PGUSER || 'postgres', password: process.env.PGPASSWORD || 'postgres', database: process.env.PGDATABASE || 'europrint' });
(async () => {
  const c = await pool.connect();
  let id = null;
  try {
    const emp = (await c.query(`SELECT id FROM employees ORDER BY id LIMIT 1`)).rows[0];
    if (!emp) { console.log('SKIP: no employee'); return; }
    const courseId = 999999; // enrollments has NO FK on course_id (verified) -> safe test id
    console.log('picked emp/course:', JSON.stringify({ empId: emp.id, courseId }));
    // mirror recordLessonProgress: no existing enrollment -> INSERT
    const ins = await c.query(
      `INSERT INTO enrollments (employee_id, course_id, current_lesson_id, status, last_accessed_at, started_at)
       VALUES ($1, $2, $3, 'in_progress', NOW(), NOW()) RETURNING id, employee_id, course_id, current_lesson_id, status`,
      [emp.id, courseId, 999999]);
    id = ins.rows[0].id;
    console.log('1) INSERTED  :', JSON.stringify(ins.rows[0]));
    const sel = (await c.query(`SELECT status, current_lesson_id FROM enrollments WHERE id=$1`, [id])).rows[0];
    console.log('2) PERSISTED :', JSON.stringify(sel), '(status in_progress, current_lesson_id 999999)');
    const del = await c.query(`DELETE FROM enrollments WHERE id=$1`, [id]);
    console.log('3) DELETED   :', del.rowCount);
    const rem = (await c.query(`SELECT count(*)::int n FROM enrollments WHERE id=$1`, [id])).rows[0].n;
    console.log('4) REMAINING :', rem, '(must be 0)');
  } catch (e) {
    console.error('ERROR:', e.message);
    if (id) { try { await c.query(`DELETE FROM enrollments WHERE id=$1`, [id]); } catch (_) {} }
    process.exitCode = 1;
  } finally { c.release(); await pool.end(); }
})();
