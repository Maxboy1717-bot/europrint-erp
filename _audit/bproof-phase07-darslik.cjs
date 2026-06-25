/** APPLY+DB-PROOF: FAZA-07 lms_cross_card_credits (apply) + kurs↔karta bind (rollback-tx) kanonik kartaga. */
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' });
(async () => {
  const c = await pool.connect();
  try {
    await c.query(`CREATE TABLE IF NOT EXISTS lms_cross_card_credits (id SERIAL PRIMARY KEY, course_id INTEGER NOT NULL, employee_id INTEGER NOT NULL, source_card_id INTEGER, target_card_id INTEGER NOT NULL, credited_by INTEGER, credited_at TIMESTAMP NOT NULL DEFAULT NOW(), created_at TIMESTAMP NOT NULL DEFAULT NOW())`);
    await c.query(`CREATE UNIQUE INDEX IF NOT EXISTS uq_lms_credit ON lms_cross_card_credits (course_id, employee_id, target_card_id)`);
    console.log(`QO'LLANDI: lms_cross_card_credits =`, (await c.query(`SELECT to_regclass('public.lms_cross_card_credits') t`)).rows[0].t);
    const card = (await c.query(`SELECT id FROM org_departments WHERE node_type='position' AND is_active ORDER BY id LIMIT 1`)).rows[0].id;
    const course = (await c.query(`SELECT id, title FROM courses ORDER BY id LIMIT 1`)).rows[0];
    await c.query('BEGIN');
    // setCourseCard logikasi: kursni org_departments-kartaga bog'lash
    await c.query(`UPDATE courses SET card_id=$1 WHERE id=$2`, [card, course.id]);
    // findCoursesByCard: kartaning kurslari
    const bound = (await c.query(`SELECT id, title, card_id FROM courses WHERE card_id=$1`, [card])).rows;
    console.log(`Kurs "${course.title}" (#${course.id}) -> org_departments karta #${card}ga bog'landi. findCoursesByCard(${card}): ${bound.length} kurs (1 kutilgan)`);
    await c.query('ROLLBACK');
    console.log('ROLLBACK -> bind qaytdi (jonli DB tegilmadi)');
  } catch (e) { try { await c.query('ROLLBACK'); } catch {} console.error('ERR', e.message); }
  finally { c.release(); await pool.end(); }
})();
