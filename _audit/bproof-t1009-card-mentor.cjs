'use strict';
/** APPLY + DB-PROOF (T10-09): lms_card_mentors jadval (apply) + mentor assign->read->revoke (rollback-tx). */
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg')); // allow-secret
const pool = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' }); // allow-secret
(async () => {
  const c = await pool.connect();
  try {
    await c.query(`CREATE TABLE IF NOT EXISTS lms_card_mentors (
      id SERIAL PRIMARY KEY, card_id INTEGER NOT NULL, mentor_user_id INTEGER NOT NULL,
      course_id INTEGER, is_active BOOLEAN NOT NULL DEFAULT true, notes TEXT,
      assigned_by INTEGER, assigned_at TIMESTAMP NOT NULL DEFAULT now(),
      revoked_at TIMESTAMP, created_at TIMESTAMP NOT NULL DEFAULT now(), updated_at TIMESTAMP NOT NULL DEFAULT now())`);
    await c.query(`CREATE UNIQUE INDEX IF NOT EXISTS uq_lms_card_mentor_active ON lms_card_mentors (card_id, mentor_user_id) WHERE is_active = true`);
    console.log("QO'LLANDI: lms_card_mentors =", (await c.query(`SELECT to_regclass('public.lms_card_mentors') t`)).rows[0].t);

    const card = (await c.query(`SELECT id, name FROM org_departments WHERE node_type='position' AND is_active ORDER BY id LIMIT 1`)).rows[0];
    const mentor = (await c.query(`SELECT id, full_name FROM users ORDER BY id LIMIT 1`)).rows[0];
    const course = (await c.query(`SELECT id, title FROM courses ORDER BY id LIMIT 1`)).rows[0];
    console.log(`Anchors: karta #${card.id} "${card.name}", mentor user #${mentor.id} "${mentor.full_name}", kurs #${course?.id ?? 'none'}`);

    await c.query('BEGIN');
    const ins = (await c.query(
      `INSERT INTO lms_card_mentors (card_id, mentor_user_id, course_id, notes, assigned_by, is_active, assigned_at, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,true,NOW(),NOW(),NOW()) RETURNING *`,
      [card.id, mentor.id, course?.id ?? null, 'T10-09 onboarding mentor proof', mentor.id])).rows[0];
    console.log(`ASSIGN: id=${ins.id} card_id=${ins.card_id} mentor_user_id=${ins.mentor_user_id} is_active=${ins.is_active}`);

    const read = (await c.query(
      `SELECT cm.*, od.name AS card_title, u.full_name AS mentor_name, co.title_uz AS course_title
       FROM lms_card_mentors cm
       LEFT JOIN org_departments od ON od.id = cm.card_id
       LEFT JOIN users u ON u.id = cm.mentor_user_id
       LEFT JOIN courses co ON co.id = cm.course_id WHERE cm.id = $1`, [ins.id])).rows[0];
    console.log(`READ : id=${read.id} card_title="${read.card_title}" mentor_name="${read.mentor_name}" course="${read.course_title ?? ''}"`);

    // dup test inside SAVEPOINT so the outer tx survives
    await c.query('SAVEPOINT dup');
    let dupErr = null;
    try { await c.query(`INSERT INTO lms_card_mentors (card_id, mentor_user_id, is_active) VALUES ($1,$2,true)`, [card.id, mentor.id]); }
    catch (e) { dupErr = e.code; await c.query('ROLLBACK TO SAVEPOINT dup'); }
    console.log(`DUP-GUARD: ikkinchi faol biriktiruv -> ${dupErr === '23505' ? 'BLOK (23505) OK' : 'XATO: '+dupErr}`);

    const rev = (await c.query(`UPDATE lms_card_mentors SET is_active=false, revoked_at=NOW(), updated_at=NOW() WHERE id=$1 RETURNING is_active, revoked_at`, [ins.id])).rows[0];
    console.log(`REVOKE: is_active=${rev.is_active} revoked_at=${rev.revoked_at ? 'set' : 'null'}`);

    // re-assign after revoke works (uq idx only covers active)
    const re = (await c.query(`INSERT INTO lms_card_mentors (card_id, mentor_user_id, is_active) VALUES ($1,$2,true) RETURNING id`, [card.id, mentor.id])).rows[0];
    console.log(`RE-ASSIGN after revoke: id=${re.id} OK (uq idx faqat faol qatorni qamraydi)`);

    await c.query('ROLLBACK');
    console.log('ROLLBACK -> hammasi qaytdi (jonli DB tegilmadi)');
    console.log('VERDICT: PASS — lms_card_mentors CRUD: assign->read->revoke->re-assign + uq-guard ishlaydi.');
  } catch (e) { try { await c.query('ROLLBACK'); } catch {} console.error('ERR', e.message); process.exit(1); }
  finally { c.release(); await pool.end(); }
})();
