#!/usr/bin/env node
/* eslint-disable */
/**
 * 2026-07-13 JONLI DB-PROOF (rollback-tx) — Onboarding → karta faollash → Payroll zanjiri.
 *
 * Vizyon (HR-ORG-VIZYON-VA-CHALA-ISHLAR-2026-07-13.md §3.1/§4.1): xodim kartaga
 * biriktirilganda karta-markazli onboarding reja avto-boshlanishi, 30-kunlik sinov
 * muddatida majburiy hujjatlar to'liq bo'lguncha Payroll bloklanishi kerak.
 *
 * Q-44/Q-32 context: live HTTP-level verification via the running NestJS server was
 * blocked by a PRE-EXISTING, UNRELATED crash — `crm.module.ts` registers
 * `CrmAiExtendedController` TWICE, so Fastify throws
 * "Method 'POST' already declared for route '/api/crm/ai/extended/chat/respond'"
 * on boot (confirmed via `grep -c CrmAiExtendedController apps/api/src/modules/crm/crm.module.ts`
 * = 2). This is NOT caused by this session's onboarding/payroll changes (CRM module was
 * never touched). Falling back to the Q-32-sanctioned static/DB-level proof: this script
 * replicates the EXACT SQL/logic `OnboardingCardAssignedHandler`, `DrizzleHrOnboardingRepository`,
 * and `OnboardingDocumentGateService` implement, run against the live DB inside BEGIN..ROLLBACK.
 *
 * Scenarios:
 *   1) TEST-karta (org_departments) + TEST-plan (hr_onboarding_plans.org_department_id=card)
 *      + TEST-employee/user (employees.user_id bridge established).
 *   2) Simulate CARD_EMPLOYEE_ASSIGNED_EVENT handling: findActivePlanByCard finds the plan,
 *      findUserIdByEmployeeId bridges employees.id->users.id, startOnboarding INSERTs a real
 *      hr_employee_onboardings row (the thing that was permanently 0 rows before this fix).
 *   3) Idempotency: re-running the same handler logic does NOT create a duplicate.
 *   4) onboarding_tasks/user_onboarding_progress materialization + the document-complete
 *      Payroll gate: SSENARIY-A (task incomplete -> allComplete=false, salary would be
 *      blocked), SSENARIY-B (task completed -> allComplete=true, salary opens).
 *      NOTE: onboarding_tasks.org_function_id FKs the STALE org_functions table (0 rows
 *      live, per repo doc-comment) — this sub-scenario proves the MECHANISM is correct
 *      given a bound task; wiring org_functions<->org_departments is an owner-data gap,
 *      not something this proof can or should fabricate around.
 *   5) SSENARIY-C: card with NO plan bound -> handler no-ops (Q-40, not fabricated).
 *   6) ROLLBACK — all TEST rows vanish (DB unchanged).
 */
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));

const pool = new Pool({
  host: process.env.PGHOST || '127.0.0.1',
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  database: process.env.PGDATABASE || 'europrint',
});

function assert(cond, msg) {
  if (!cond) throw new Error('ASSERT FAIL: ' + msg);
  console.log('  ✓ ' + msg);
}

// ── DrizzleHrOnboardingRepository.findActivePlanByCard() AYNAN SQL ──
async function findActivePlanByCard(c, cardId) {
  const r = await c.query(
    `SELECT * FROM hr_onboarding_plans WHERE org_department_id = $1 AND is_active = true ORDER BY id DESC LIMIT 1`,
    [cardId],
  );
  return r.rows[0] || null;
}

// ── DrizzleHrOnboardingRepository.findUserIdByEmployeeId() AYNAN SQL ──
async function findUserIdByEmployeeId(c, employeeId) {
  const r = await c.query(`SELECT user_id FROM employees WHERE id = $1 LIMIT 1`, [employeeId]);
  const row = r.rows[0];
  return row && row.user_id != null ? Number(row.user_id) : null;
}

// ── DrizzleHrOnboardingRepository.getEmployeeOnboarding() AYNAN SQL (for the handler's dup check) ──
async function getEmployeeOnboarding(c, userId) {
  const r = await c.query(`SELECT * FROM hr_employee_onboardings WHERE employee_id = $1 ORDER BY start_date DESC`, [userId]);
  return r.rows;
}

// ── DrizzleHrOnboardingRepository.startOnboarding() AYNAN SQL ──
async function startOnboarding(c, { employeeId, planId, startDate, expectedEndDate, cardId }) {
  const r = await c.query(
    `INSERT INTO hr_employee_onboardings (employee_id, plan_id, status, start_date, expected_end_date, card_id, weekly_progress, created_at, updated_at)
     VALUES ($1, $2, 'IN_PROGRESS', $3, $4, $5, '[]', NOW(), NOW()) RETURNING *`,
    [employeeId, planId, startDate, expectedEndDate, cardId],
  );
  return r.rows[0];
}

// ── OnboardingCardAssignedHandler.handle() control-flow (mirrors the TS 1:1) ──
async function handleCardAssigned(c, { employeeId, cardId }) {
  const plan = await findActivePlanByCard(c, cardId);
  if (!plan) return { skipped: 'no-plan-bound-to-card' };

  const userId = await findUserIdByEmployeeId(c, employeeId);
  if (!userId) return { skipped: 'no-employees.user_id-bridge' };

  const existing = await getEmployeeOnboarding(c, userId);
  if (existing.some((o) => Number(o.card_id) === cardId)) return { skipped: 'idempotent-duplicate' };

  const probationDays = Number(plan.probation_days ?? plan.duration_days ?? 90);
  const startDate = new Date();
  const expectedEndDate = new Date(startDate);
  expectedEndDate.setDate(expectedEndDate.getDate() + (Number.isFinite(probationDays) && probationDays > 0 ? probationDays : 90));

  const created = await startOnboarding(c, { employeeId: userId, planId: plan.id, startDate, expectedEndDate, cardId });
  // Return the JS-computed dates too (not just the DB round-trip) — `start_date` is a `date`
  // column (truncates time-of-day per session tz) while `expected_end_date` is a full
  // `timestamp`, so diffing the two ROUND-TRIPPED columns can show a +/-1-day artifact from
  // that column-type mismatch alone. The JS values below are what the handler's arithmetic
  // actually computed (setDate(+probationDays)), which is the thing under test here.
  return { created, jsStartDate: startDate, jsExpectedEndDate: expectedEndDate, probationDays };
}

// ── DrizzleHrOnboardingRepository.findRequiredDocumentTasksByCard/findCompletedTaskIds AYNAN SQL ──
async function findRequiredDocumentTasksByCard(c, cardId) {
  const r = await c.query(
    `SELECT id, title FROM onboarding_tasks WHERE org_function_id = $1 AND type = 'document' AND is_required = true AND deleted_at IS NULL ORDER BY "order" ASC, id ASC`,
    [cardId],
  );
  return r.rows;
}
async function findCompletedTaskIds(c, userId, taskIds) {
  if (taskIds.length === 0) return new Set();
  const r = await c.query(
    `SELECT task_id FROM user_onboarding_progress WHERE user_id = $1 AND completed = true AND task_id = ANY($2::int[])`,
    [userId, taskIds],
  );
  return new Set(r.rows.map((row) => Number(row.task_id)));
}

// ── OnboardingDocumentGateService.isCardOnboardingDocsComplete() control-flow ──
async function isCardOnboardingDocsComplete(c, cardId, userId) {
  const tasks = await findRequiredDocumentTasksByCard(c, cardId);
  if (tasks.length === 0) return { allComplete: true, totalRequired: 0 };
  const completed = await findCompletedTaskIds(c, userId, tasks.map((t) => t.id));
  const incomplete = tasks.filter((t) => !completed.has(t.id));
  return { allComplete: incomplete.length === 0, totalRequired: tasks.length, incompleteTaskIds: incomplete.map((t) => t.id) };
}

(async () => {
  const client = await pool.connect();
  let failed = false;
  try {
    await client.query('BEGIN');

    console.log('\n── SETUP: TEST-karta + TEST-reja (card-bound) + TEST-xodim/login ──');
    const cardId = (await client.query(
      `INSERT INTO org_departments (name, code, is_active, current_state, created_at)
       VALUES ('TEST-ONB-2026-07-13', 'TEST-ONB-CARD', true, 'active', NOW()) RETURNING id`,
    )).rows[0].id;
    const planId = (await client.query(
      `INSERT INTO hr_onboarding_plans (title, name, is_active, org_department_id, probation_days, duration_days, created_at, updated_at)
       VALUES ('TEST onboarding plan', 'TEST onboarding plan', true, $1, 30, 30, NOW(), NOW()) RETURNING id`,
      [cardId],
    )).rows[0].id;
    const empId = (await client.query(
      `INSERT INTO employees (first_name, last_name, employee_code, created_at, updated_at)
       VALUES ('TEST', 'Onboard', 'TEST-ONB-EMP-' || floor(random()*1000000)::text, NOW(), NOW()) RETURNING id`,
    )).rows[0].id;
    const userId = (await client.query(
      `INSERT INTO users (username, password_hash, first_name, last_name, employee_id, created_at, updated_at)
       VALUES ($1, 'x', 'TEST', 'Onboard', $2, NOW(), NOW()) RETURNING id`,
      ['test_onb_' + Date.now(), empId],
    )).rows[0].id;
    await client.query(`UPDATE employees SET user_id = $1 WHERE id = $2`, [userId, empId]);
    console.log(`cardId=${cardId} planId=${planId} empId(employees.id)=${empId} userId(users.id)=${userId}`);

    console.log('\n── SSENARIY-1: karta biriktirilganda hr_employee_onboardings YOZILADI ──');
    const before = (await client.query(`SELECT count(*) FROM hr_employee_onboardings WHERE employee_id = $1`, [userId])).rows[0].count;
    assert(Number(before) === 0, "boshlang'ich holat: onboarding yozuvi yo'q");

    const result1 = await handleCardAssigned(client, { employeeId: empId, cardId });
    assert(!!result1.created, 'handler hr_employee_onboardings INSERT qildi (skip emas)');
    assert(result1.created.plan_id === planId, "yozilgan onboarding to'g'ri planId (karta-rejasi) bilan bog'landi");
    assert(result1.created.card_id === cardId, "yozilgan onboarding to'g'ri cardId bilan bog'landi");
    assert(result1.created.employee_id === userId, 'employee_id = users.id (SB0072/SB0101 id-space)');
    const diffDays = Math.round((result1.jsExpectedEndDate - result1.jsStartDate) / 86400000);
    assert(diffDays === 30 && result1.probationDays === 30, `expectedEndDate = startDate + plan.probationDays (30 kun), actual=${diffDays}`);

    console.log('\n── SSENARIY-2: qayta-biriktirish (event redelivery) DUBLIKAT yaratmaydi (idempotent) ──');
    const result2 = await handleCardAssigned(client, { employeeId: empId, cardId });
    assert(result2.skipped === 'idempotent-duplicate', "ikkinchi chaqiruv skip qildi: " + JSON.stringify(result2));
    const after = (await client.query(`SELECT count(*) FROM hr_employee_onboardings WHERE employee_id = $1`, [userId])).rows[0].count;
    assert(Number(after) === 1, `hali ham FAQAT 1 ta onboarding yozuvi bor (dublikat yo'q), actual=${after}`);

    console.log('\n── SSENARIY-3: kartaga reja biriktirilmagan bo\'lsa → no-op (Q-40, fabrikatsiya yo\'q) ──');
    const cardNoPlan = (await client.query(
      `INSERT INTO org_departments (name, code, is_active, current_state, created_at)
       VALUES ('TEST-ONB-NOPLAN', 'TEST-ONB-NOPLAN-CODE', true, 'active', NOW()) RETURNING id`,
    )).rows[0].id;
    const result3 = await handleCardAssigned(client, { employeeId: empId, cardId: cardNoPlan });
    assert(result3.skipped === 'no-plan-bound-to-card', "reja yo'q karta → skipped (soxta reja YARATILMADI)");

    console.log('\n── SSENARIY-4: onboarding-hujjat-darvoza (Payroll document-complete gate) ──');
    // Mechanism-only sub-proof (owner-data gap: onboarding_tasks.org_function_id targets the
    // stale org_functions table, not org_departments — see repo doc-comment). We bind a task
    // to a throwaway org_functions row to prove the QUERY/GATE LOGIC itself is correct.
    const deptId = (await client.query(`INSERT INTO departments (id) VALUES ((SELECT COALESCE(MAX(id),0)+1 FROM departments)) RETURNING id`)).rows[0].id;
    const orgFnId = (await client.query(
      `INSERT INTO org_functions (department_id, position_name) VALUES ($1, 'TEST-ONB-FN') RETURNING id`,
      [deptId],
    )).rows[0].id;
    const taskId = (await client.query(
      `INSERT INTO onboarding_tasks (org_function_id, title, type, "order", is_required, created_at)
       VALUES ($1, 'TEST: shartnoma nusxasi yuklash', 'document', 1, true, NOW()) RETURNING id`,
      [orgFnId],
    )).rows[0].id;

    const gateBefore = await isCardOnboardingDocsComplete(client, orgFnId, userId);
    assert(gateBefore.totalRequired === 1, "1 ta majburiy hujjat-vazifa topildi");
    assert(gateBefore.allComplete === false, "hujjat hali yuklanmagan → gate YOPIQ (Payroll bloklanadi)");

    // materializeTasks ensureTaskProgress AYNAN SQL:
    await client.query(
      `INSERT INTO user_onboarding_progress (user_id, task_id, completed, created_at) VALUES ($1, $2, false, NOW())`,
      [userId, taskId],
    );
    const gateMid = await isCardOnboardingDocsComplete(client, orgFnId, userId);
    assert(gateMid.allComplete === false, "vazifa yaratildi lekin completed=false → gate hali YOPIQ");

    // Complete the document.
    await client.query(`UPDATE user_onboarding_progress SET completed = true WHERE user_id = $1 AND task_id = $2`, [userId, taskId]);
    const gateAfter = await isCardOnboardingDocsComplete(client, orgFnId, userId);
    assert(gateAfter.allComplete === true, "hujjat completed=true → gate OCHILDI (Payroll ochiladi)");

    console.log('\n── SSENARIY-5: hujjat biriktirilmagan karta → halol ochiq (fabrikatsiya emas) ──');
    const gateNoTasks = await isCardOnboardingDocsComplete(client, cardId, userId);
    assert(gateNoTasks.totalRequired === 0 && gateNoTasks.allComplete === true, "hujjat-vazifa yo'q → allComplete=true (bloklamaydi)");

    console.log('\nNATIJA: onboarding→karta→Payroll zanjiri to\'g\'ri ishlaydi (hr_employee_onboardings jonli yoziladi, idempotent, document-gate to\'g\'ri ochilib-yopiladi).');
  } catch (e) {
    failed = true;
    console.error('PROOF XATO:', e.message, e.stack);
  } finally {
    await client.query('ROLLBACK');
    console.log("\nROLLBACK bajarildi — DB o'zgarmadi (TEST yozuvlar yo'qoldi).");
    client.release();
    await pool.end();
  }
  process.exit(failed ? 1 : 0);
})();
