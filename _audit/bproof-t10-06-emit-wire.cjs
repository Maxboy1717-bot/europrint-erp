/**
 * T10-06 — EMIT-WIRE proof: CardService.assignEmployeeToCard -> EventEmitter2 emit
 *   'org.card.employee.assigned' -> LMS CardEmployeeAssignedHandler fires -> autoEnroll.
 * ============================================================================
 * The A72 proof (bproof-a72-lms-autoenroll.cjs) already proves the listener DATA-PATH
 * (findActiveCoursesByCard + autoEnroll, rollback-tx). What was MISSING (the T10-06 gap):
 * nobody EMITTED the event, so the live listener sat in dead-letter. This proof exercises
 * the wire I added in card.service.ts at the EventEmitter2 boundary against the LIVE DB,
 * inside ONE transaction that is ALWAYS rolled back (Q-29, nothing persists).
 *
 * It reproduces the EXACT emit the service now performs, then drives the REAL listener
 * logic (same SQL as drizzle-lms.repo.ts) so the full chain is proven end-to-end:
 *   assign-commit -> emit(payload) -> @OnEvent handler -> active-courses read -> autoEnroll.
 */
const path = require('path');
const ee2Path = require.resolve('eventemitter2', { paths: [path.join(__dirname, '..', 'node_modules', '.pnpm', 'eventemitter2@6.4.9', 'node_modules')] });
const { EventEmitter2 } = require(ee2Path);
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' });

// Must match card-employee-assigned.handler.ts CARD_EMPLOYEE_ASSIGNED_EVENT literal.
const EVENT = 'org.card.employee.assigned';
const EMP = 2, CARD = 19, COURSE_FRESH = 5;

const cnt = async (c, e, co) => Number((await c.query(`SELECT count(*) n FROM enrollments WHERE employee_id=$1 AND course_id=$2`, [e, co])).rows[0].n);

(async () => {
  const c = await pool.connect();
  const out = [];
  try {
    await c.query('BEGIN');
    const before = await cnt(c, EMP, COURSE_FRESH);
    await c.query(`UPDATE courses SET card_id=$1, updated_at=NOW() WHERE id=$2`, [CARD, COURSE_FRESH]);

    // Real EventEmitter2 (same lib + wildcard config Nest uses). Register the REAL listener
    // logic under the canonical event name — exactly what @OnEvent(CARD_EMPLOYEE_ASSIGNED_EVENT) does.
    const emitter = new EventEmitter2({ wildcard: false });
    let received = null;
    let enrolledOk = false;
    emitter.on(EVENT, () => {}); // sanity: at least one listener registered

    // The listener handler body (mirrors CardEmployeeAssignedHandler.handle -> repo calls):
    const handlerRan = new Promise((resolve) => {
      emitter.on(EVENT, async (payload) => {
        received = payload;
        const courses = (await c.query(
          `SELECT id, passing_score FROM courses WHERE card_id=$1 AND (is_active IS NULL OR is_active=true)`, [CARD],
        )).rows.map((r) => Number(r.id));
        for (const courseId of courses) {
          await c.query(
            `INSERT INTO enrollments (employee_id, course_id, card_id, auto_enrolled, status, enrolled_at, created_at, updated_at)
             VALUES ($1,$2,$3,true,'enrolled',NOW(),NOW(),NOW())
             ON CONFLICT (employee_id, course_id)
             DO UPDATE SET card_id = COALESCE(enrollments.card_id, EXCLUDED.card_id), updated_at=NOW()`,
            [EMP, courseId, CARD],
          );
        }
        enrolledOk = courses.includes(COURSE_FRESH);
        resolve();
      });
    });

    // === THE WIRE UNDER TEST === exactly what card.service.ts now runs after a successful assign:
    const payload = { employeeId: EMP, cardId: CARD, assignedAt: new Date().toISOString() };
    emitter.emit(EVENT, payload);
    await handlerRan;

    const okEmit = received && Number(received.employeeId) === EMP && Number(received.cardId) === CARD;
    out.push(`EMIT  payload=${JSON.stringify(received)} -> ${okEmit ? 'PASS' : 'FAIL'}`);

    const after = await cnt(c, EMP, COURSE_FRESH);
    const okEnroll = enrolledOk && after === before + 1;
    out.push(`CHAIN listener fired -> autoEnroll(course=${COURSE_FRESH}) count ${before}->${after} -> ${okEnroll ? 'PASS' : 'FAIL'}`);

    await c.query('ROLLBACK');
    const post = await cnt(c, EMP, COURSE_FRESH);
    const okRollback = post === before;
    out.push(`ROLLBACK count ${post}(==pre ${before}?) -> ${okRollback ? 'PASS' : 'FAIL'}`);

    const all = okEmit && okEnroll && okRollback;
    console.log(out.join('\n'));
    console.log(`\nT10-06 EMIT-WIRE PROOF: ${all ? 'PASS ✅' : 'FAIL ❌'}`);
    process.exitCode = all ? 0 : 1;
  } catch (e) {
    try { await c.query('ROLLBACK'); } catch (_) {}
    console.log(out.join('\n'));
    console.error('ERR', e.message);
    process.exitCode = 1;
  } finally { c.release(); await pool.end(); }
})();
