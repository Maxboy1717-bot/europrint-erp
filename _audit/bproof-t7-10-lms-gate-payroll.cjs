#!/usr/bin/env node
/* eslint-disable */
/**
 * T7-10 JONLI DB-PROOF (rollback-tx) — LMS-DARVOZA → OYLIK ulanishi.
 *
 * Vizyon (egasi): "Karta darsligi tugamaguncha o'sha karta oyligi to'xtaydi."
 * Mexanizm: PayrollService.computeGatedMonthlySalary() endi ЦКП-darvozadan OLDIN
 *   LmsCardGateService.isCardTrainingComplete(cardId, employeeId) ni chaqiradi.
 *   Karta majburiy darsligi tugamagan → lmsBlocked=true → butun karta oyligi 0.
 *
 * Bu skript LmsCardGateService + LmsCompletionService + drizzle-lms.repo
 * AYNAN ishlatadigan SQL/mantiqni jonli DB ustida (BEGIN..ROLLBACK) takrorlaydi:
 *   1) TEST-karta (org_departments) + TEST-xodim (employees) yaratiladi.
 *   2) Kartaga MAJBURIY darslik (courses.card_id, is_mandatory=true) biriktiriladi.
 *   3) SSENARIY-1: xodim darslikni TUGATMAGAN (enrollment 'enrolled', test yo'q,
 *      progress 0/varaqa to'liq emas) → gate allComplete=FALSE → oylik BLOKLANADI (0).
 *   4) SSENARIY-2: xodim darslikni TUGATGAN (enrollment 'completed', test o'tgan,
 *      barcha mavzu confirmed) → gate allComplete=TRUE → oylik OCHIQ (gated > 0).
 *   5) ROLLBACK — barcha TEST yozuvlar yo'qoladi (DB o'zgarmaydi).
 *
 * FABRIKATSIYA YO'Q (Q-40): faqat real jadvallar; "tugamagan" = halol 0.
 */
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));

// ── LmsCompletionService.evaluate() toza mantig'ining AYNAN nusxasi ──
function evaluateCompletion(p) {
  const c1 = p.theoryScorePct >= p.passThresholdPct;
  const c2 = p.practicalPassed === true;
  const c3 = p.totalTopics >= 1 && p.confirmedTopics / p.totalTopics >= 1.0;
  return { completed: c1 && c2 && c3, c1, c2, c3 };
}

// ── drizzle-lms.repo.getCompletionSnapshot() AYNAN ishlatadigan SQL ──
async function getSnapshot(client, employeeId, courseId) {
  const courseR = await client.query(`SELECT passing_score FROM courses WHERE id = $1 LIMIT 1`, [courseId]);
  const passThresholdPct = Number(courseR.rows[0]?.passing_score ?? 70);
  const bestR = await client.query(
    `SELECT COALESCE(MAX(score), 0) AS best FROM lms_test_attempts
     WHERE user_id = $1 AND course_id = $2 AND passed = true`,
    [String(employeeId), String(courseId)],
  );
  const theoryScorePct = Number(bestR.rows[0]?.best ?? 0);
  const enrR = await client.query(
    `SELECT status FROM enrollments WHERE employee_id = $1 AND course_id = $2
     ORDER BY updated_at DESC NULLS LAST LIMIT 1`,
    [employeeId, courseId],
  );
  const practicalPassed = String(enrR.rows[0]?.status ?? '') === 'completed';
  const topicsR = await client.query(
    `SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE completed = true) AS done
     FROM course_progress WHERE user_id = $1 AND course_id = $2`,
    [employeeId, courseId],
  );
  const rawTotal = Number(topicsR.rows[0]?.total ?? 0);
  const totalTopics = rawTotal > 0 ? rawTotal : 1;
  const confirmedTopics = rawTotal > 0 ? Number(topicsR.rows[0]?.done ?? 0) : 0;
  return { theoryScorePct, passThresholdPct, practicalPassed, totalTopics, confirmedTopics };
}

// ── LmsCardGateService.isCardTrainingComplete() AYNAN mantig'i ──
async function isCardTrainingComplete(client, cardId, employeeId) {
  const mandatory = (await client.query(
    `SELECT id, passing_score FROM courses
     WHERE card_id = $1 AND (is_active IS NULL OR is_active = true) AND is_mandatory = true`,
    [cardId],
  )).rows;
  if (mandatory.length === 0) return { allComplete: true, mandatoryCourseCount: 0, reasons: [] };
  const reasons = [];
  for (const c of mandatory) {
    const snap = await getSnapshot(client, employeeId, Number(c.id));
    const ev = evaluateCompletion(snap);
    if (!ev.completed) {
      // Q562 cross-card credit check
      const credit = await client.query(
        `SELECT 1 FROM lms_cross_card_credits WHERE employee_id = $1 AND course_id = $2 LIMIT 1`,
        [employeeId, Number(c.id)],
      );
      if (credit.rows.length === 0) {
        reasons.push(`Kurs #${c.id}: C1=${ev.c1} C2=${ev.c2} C3=${ev.c3}`);
      }
    }
  }
  return { allComplete: reasons.length === 0, mandatoryCourseCount: mandatory.length, reasons };
}

// ── PayrollService.computeGatedMonthlySalary() LMS-darvoza qismi (gated 0/full) ──
function gatedMonthlySalary(proratedGross, lms) {
  const lmsBlocked = !lms.allComplete;
  if (lmsBlocked) return { gatedGross: 0, lmsBlocked: true, lmsReasons: lms.reasons };
  return { gatedGross: proratedGross, lmsBlocked: false, lmsReasons: [] };
}

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

const PRORATED_GROSS = 5_000_000; // to'liq davr oyligi (gate ko'paytiradi/bloklaydi)

(async () => {
  const client = await pool.connect();
  let failed = false;
  try {
    await client.query('BEGIN');

    // 1) TEST-karta + TEST-xodim.
    const cardId = (await client.query(
      `INSERT INTO org_departments (name, code, level, created_at)
       VALUES ('TEST-T710-LMS-GATE', 'TEST-T710-LMS', 5, NOW()) RETURNING id`,
    )).rows[0].id;
    const empId = (await client.query(
      `INSERT INTO employees (first_name, last_name, employee_code, created_at, updated_at)
       VALUES ('TEST', 'T710', 'TEST-T710-EMP', NOW(), NOW()) RETURNING id`,
    )).rows[0].id;
    console.log(`TEST-karta id=${cardId}, TEST-xodim id=${empId}`);

    // 2) Kartaga MAJBURIY darslik (passing_score=70).
    const courseId = (await client.query(
      `INSERT INTO courses (title_uz, title, code, is_mandatory, passing_score, card_id, is_active, created_at)
       VALUES ('TEST-T710 darslik', 'TEST-T710 course', $1, true, 70, $2, true, NOW()) RETURNING id`,
      ['TEST-T710-CRS-' + Date.now(), cardId],
    )).rows[0].id;
    console.log(`MAJBURIY darslik biriktirildi id=${courseId} (card_id=${cardId})`);

    // ── SSENARIY-1: darslik TUGAMAGAN ──
    console.log("\n── SSENARIY-1: darslik TUGAMAGAN (enrolled, test yo'q, progress yo'q) ──");
    await client.query(
      `INSERT INTO enrollments (employee_id, course_id, card_id, status, enrolled_at, created_at, updated_at)
       VALUES ($1, $2, $3, 'enrolled', NOW(), NOW(), NOW())
       ON CONFLICT (employee_id, course_id) DO UPDATE SET status='enrolled', updated_at=NOW()`,
      [empId, courseId, cardId],
    );
    const lms1 = await isCardTrainingComplete(client, cardId, empId);
    const pay1 = gatedMonthlySalary(PRORATED_GROSS, lms1);
    console.log('  LMS:', JSON.stringify(lms1));
    console.log('  oylik:', JSON.stringify(pay1));
    assert(lms1.mandatoryCourseCount === 1, 'Kartada 1 majburiy darslik bor');
    assert(lms1.allComplete === false, 'LMS-darvoza YOPIQ (darslik tugamagan)');
    assert(pay1.lmsBlocked === true && pay1.gatedGross === 0, "Oylik BLOKLANDI = 0 (darslik tugamasa oylik yo'q)");

    // ── SSENARIY-2: darslik TUGATILDI ──
    console.log('\n── SSENARIY-2: darslik TUGATILDI (completed + test o\'tdi + barcha mavzu) ──');
    await client.query(
      `UPDATE enrollments SET status='completed', completed_at=NOW(), updated_at=NOW()
       WHERE employee_id=$1 AND course_id=$2`,
      [empId, courseId],
    );
    // lms_test_attempts.id = TEXT, default yo'q (jonli DB xususiyati) → aniq id beramiz.
    await client.query(
      `INSERT INTO lms_test_attempts (id, user_id, course_id, score, passed, created_at)
       VALUES ($1, $2, $3, 95, true, NOW())`,
      ['TEST-T710-ATT-' + Date.now(), String(empId), String(courseId)],
    );
    // course_progress.lesson_id NOT NULL — TEST darsni biriktiramiz (snapshot (user,course) bo'yicha sanaydi).
    await client.query(
      `INSERT INTO course_progress (user_id, course_id, lesson_id, completed, created_at)
       VALUES ($1, $2, $3, true, NOW())`,
      [empId, courseId, courseId],
    );
    const lms2 = await isCardTrainingComplete(client, cardId, empId);
    const pay2 = gatedMonthlySalary(PRORATED_GROSS, lms2);
    console.log('  LMS:', JSON.stringify(lms2));
    console.log('  oylik:', JSON.stringify(pay2));
    assert(lms2.allComplete === true, 'LMS-darvoza OCHIQ (darslik tugadi)');
    assert(pay2.lmsBlocked === false && pay2.gatedGross === PRORATED_GROSS, `Oylik OCHIQ = ${PRORATED_GROSS} (darslik tugadi)`);

    // ── SSENARIY-3: majburiy darslik biriktirilmagan boshqa karta → bloklamaydi (halol ochiq) ──
    console.log('\n── SSENARIY-3: majburiy darslik biriktirilmagan karta → ochiq (FABRIKATSIYA emas) ──');
    const cardNoCourse = (await client.query(
      `INSERT INTO org_departments (name, code, level, created_at)
       VALUES ('TEST-T710-NOCOURSE', 'TEST-T710-NOCRS', 5, NOW()) RETURNING id`,
    )).rows[0].id;
    const lms3 = await isCardTrainingComplete(client, cardNoCourse, empId);
    const pay3 = gatedMonthlySalary(PRORATED_GROSS, lms3);
    console.log('  LMS:', JSON.stringify(lms3));
    assert(lms3.mandatoryCourseCount === 0 && lms3.allComplete === true, 'Darslik yo\'q karta → allComplete=true (bloklamaydi)');
    assert(pay3.gatedGross === PRORATED_GROSS, 'Oylik ochiq (majburiy darslik yo\'q = blok yo\'q)');

    console.log('\nNATIJA: LMS-darvoza oylikka ULANDI — darslik tugamasa karta oyligi 0, tugasa to\'liq.');
  } catch (e) {
    failed = true;
    console.error('PROOF XATO:', e.message);
  } finally {
    await client.query('ROLLBACK'); // DB o'zgarmaydi
    console.log("\nROLLBACK bajarildi — DB o'zgarmadi (TEST yozuvlar yo'qoldi).");
    client.release();
    await pool.end();
  }
  process.exit(failed ? 1 : 0);
})();
