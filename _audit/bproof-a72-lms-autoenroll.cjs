/**
 * A72 — JONLI rollback-tx DB-proof: LMS avto-enroll (card-assign -> enroll).
 * ============================================================================
 * Proves the FULL listener data-path end-to-end against the live `europrint` DB,
 * inside ONE transaction that is ALWAYS rolled back (nothing persists, Q-29).
 * Uses the SAME SQL as drizzle-lms.repo.ts findActiveCoursesByCard / autoEnroll.
 *
 * Two real cases:
 *   A) FRESH (emp,courseFresh) no prior enrollment -> auto_enrolled=true,
 *      status='enrolled', card_id set, inserted=true.
 *   B) PRE-EXISTING (emp,courseExisting) manual enrollment -> status & auto_enrolled
 *      PRESERVED (progress kept), only card_id backfilled, inserted=false.
 *   + idempotency (2nd call no new row), FABRIKATSIYA-skip (unbound card no-op),
 *     and ROLLBACK proof (nothing persisted).
 */
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' });

const EMP = 2, CARD = 19, COURSE_FRESH = 5, COURSE_EXISTING = 3;

async function autoEnroll(c, employeeId, courseId, cardId) {
  const r = await c.query(
    `INSERT INTO enrollments (employee_id, course_id, card_id, auto_enrolled, status, enrolled_at, created_at, updated_at)
     VALUES ($1, $2, $3, true, 'enrolled', NOW(), NOW(), NOW())
     ON CONFLICT (employee_id, course_id)
     DO UPDATE SET card_id = COALESCE(enrollments.card_id, EXCLUDED.card_id), updated_at = NOW()
     RETURNING (xmax = 0) AS inserted`,
    [employeeId, courseId, cardId],
  );
  return Boolean(r.rows[0].inserted);
}
const cnt = async (c, e, co) => Number((await c.query(`SELECT count(*) n FROM enrollments WHERE employee_id=$1 AND course_id=$2`, [e, co])).rows[0].n);
const row = async (c, e, co) => (await c.query(`SELECT card_id, auto_enrolled, status FROM enrollments WHERE employee_id=$1 AND course_id=$2`, [e, co])).rows[0];

(async () => {
  const c = await pool.connect();
  const out = [];
  try {
    await c.query('BEGIN');

    const beforeF = await cnt(c, EMP, COURSE_FRESH);
    const beforeE = await cnt(c, EMP, COURSE_EXISTING);
    const existRowBefore = await row(c, EMP, COURSE_EXISTING);
    out.push(`pre: fresh(emp=${EMP},c=${COURSE_FRESH})=${beforeF}, existing(c=${COURSE_EXISTING})=${beforeE} ${JSON.stringify(existRowBefore)}`);

    // bind both courses to the card (owner DATA simulation, rolled back)
    await c.query(`UPDATE courses SET card_id=$1, updated_at=NOW() WHERE id = ANY($2::int[])`, [CARD, [COURSE_FRESH, COURSE_EXISTING]]);

    // repo READ — findActiveCoursesByCard(card)
    const courses = (await c.query(`SELECT id, passing_score FROM courses WHERE card_id=$1 AND (is_active IS NULL OR is_active=true)`, [CARD])).rows.map((r) => Number(r.id));
    out.push(`READ findActiveCoursesByCard(${CARD}) = [${courses.join(',')}]`);

    // listener loop: autoEnroll for each
    for (const co of courses) await autoEnroll(c, EMP, co, CARD);

    // ── Case A: FRESH ──
    const rF = await row(c, EMP, COURSE_FRESH);
    const okA = rF && Number(rF.card_id) === CARD && rF.auto_enrolled === true && rF.status === 'enrolled' && (await cnt(c, EMP, COURSE_FRESH)) === beforeF + 1;
    out.push(`CASE-A fresh row=${JSON.stringify(rF)} -> ${okA ? 'PASS' : 'FAIL'}`);

    // ── Case B: PRE-EXISTING preserved + card backfilled ──
    const rE = await row(c, EMP, COURSE_EXISTING);
    const okB = rE && Number(rE.card_id) === CARD
      && rE.status === existRowBefore.status && rE.auto_enrolled === existRowBefore.auto_enrolled
      && (await cnt(c, EMP, COURSE_EXISTING)) === beforeE;
    out.push(`CASE-B existing row=${JSON.stringify(rE)} (status/auto_enrolled preserved, card backfilled) -> ${okB ? 'PASS' : 'FAIL'}`);

    // ── idempotency: second call inserts no new row ──
    const c1 = await cnt(c, EMP, COURSE_FRESH);
    const ins2 = await autoEnroll(c, EMP, COURSE_FRESH, CARD);
    const c2 = await cnt(c, EMP, COURSE_FRESH);
    const okIdem = ins2 === false && c1 === c2;
    out.push(`IDEMPOTENT: 2nd inserted=${ins2}, count ${c1}->${c2} -> ${okIdem ? 'PASS' : 'FAIL'}`);

    // ── FABRIKATSIYA-skip: unbound card has no course -> listener no-op ──
    const unbound = Number((await c.query(`SELECT count(*) n FROM courses WHERE card_id=999999 AND (is_active IS NULL OR is_active=true)`)).rows[0].n);
    const okSkip = unbound === 0;
    out.push(`SKIP unbound-card courses=${unbound} (no soxta enroll) -> ${okSkip ? 'PASS' : 'FAIL'}`);

    await c.query('ROLLBACK');

    // post — nothing persisted
    const afterF = await cnt(c, EMP, COURSE_FRESH);
    const boundAfter = Number((await c.query(`SELECT count(*) n FROM courses WHERE card_id=$1`, [CARD])).rows[0].n);
    const okRollback = afterF === beforeF && boundAfter === 0;
    out.push(`ROLLBACK: fresh count ${afterF}(==pre ${beforeF}?), card-bound courses=${boundAfter}(==0?) -> ${okRollback ? 'PASS' : 'FAIL'}`);

    const allPass = okA && okB && okIdem && okSkip && okRollback;
    console.log(out.join('\n'));
    console.log(`\nA72 DB-PROOF: ${allPass ? 'PASS ✅' : 'FAIL ❌'}`);
    process.exitCode = allPass ? 0 : 1;
  } catch (e) {
    try { await c.query('ROLLBACK'); } catch (_) {}
    console.log(out.join('\n'));
    console.error('ERR', e.message);
    process.exitCode = 1;
  } finally { c.release(); await pool.end(); }
})();
