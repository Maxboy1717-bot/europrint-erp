#!/usr/bin/env node
/* eslint-disable */
/**
 * A11 JONLI DB-PROOF (rollback-tx) — ЦКП-gate QATTIQ-0 (Egasi-qaror Q6).
 *
 * Isbot (BEGIN ... ROLLBACK — DB o'zgarmaydi):
 *   1) TEST-karta + 3 kunlik ssenariy (ckp_fact_values) yaratiladi.
 *   2) Har kun uchun `ckp-gate.ts` `CkpGateService.evaluateDay` AYNAN ishlatadigan
 *      SELECT (org_departments LEFT JOIN ckp_fact_values) jonli bajariladi.
 *   3) Qatorlar `applyCkpGate` toza funksiyasiga beriladi va kutilgan natija tekshiriladi:
 *        - Kun A: fakt bor + deadline ICHIDA      → OPEN  (factor 1, oylik bor)
 *        - Kun B: fakt YO'Q                        → BLOCKED (factor 0, oylik yo'q)
 *        - Kun C: fakt bor + deadline O'TGAN       → BLOCKED (factor 0, oylik yo'q)
 *   4) ROLLBACK — barcha TEST yozuvlar yo'qoladi.
 */
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));

// ── ckp-gate.ts toza mantig'ining AYNAN nusxasi (proof self-contained bo'lishi uchun) ──
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_PER_HOUR = 60 * 60 * 1000;
function computeCkpDeadline(deadlineHours, factDate) {
  const h = deadlineHours == null ? null : Number(deadlineHours);
  if (h == null || !Number.isFinite(h) || h <= 0) return null;
  const dayStart = new Date(`${factDate}T00:00:00.000Z`);
  if (Number.isNaN(dayStart.getTime())) return null;
  return new Date(dayStart.getTime() + MS_PER_DAY + h * MS_PER_HOUR).toISOString();
}
function applyCkpGate(d) {
  if (!d.hasFact) return { open: false, reason: 'NO_FACT', factor: 0, deadlineAt: null };
  const deadlineAt = computeCkpDeadline(d.deadlineHours, d.factDate);
  if (deadlineAt == null) return { open: true, reason: 'OK', factor: 1, deadlineAt: null };
  if (d.submittedAt == null) return { open: false, reason: 'DEADLINE_PASSED', factor: 0, deadlineAt };
  const passed = d.submittedAt.getTime() > new Date(deadlineAt).getTime();
  return passed
    ? { open: false, reason: 'DEADLINE_PASSED', factor: 0, deadlineAt }
    : { open: true, reason: 'OK', factor: 1, deadlineAt };
}

// AYNAN CkpGateService.evaluateDay ichidagi SELECT (parametrlangan).
const EVAL_SQL = `
  SELECT f.id AS fact_id, f.submitted_at AS submitted_at, f.status AS status,
         d.ckp_report_deadline_hours AS deadline_hours
  FROM org_departments d
  LEFT JOIN ckp_fact_values f ON f.card_id = d.id AND f.fact_date = $2::date
  WHERE d.id = $1 LIMIT 1
`;

async function evaluateDay(client, cardId, factDate) {
  const res = await client.query(EVAL_SQL, [cardId, factDate]);
  const row = res.rows[0] ?? null;
  const hasFact = !!(row && row.fact_id != null);
  const deadlineHours = row && row.deadline_hours != null ? Number(row.deadline_hours) : null;
  const subRaw = row ? row.submitted_at : null;
  const submittedAt = subRaw == null ? null : subRaw instanceof Date ? subRaw : new Date(String(subRaw));
  return applyCkpGate({
    hasFact, deadlineHours, factDate,
    submittedAt: submittedAt && !Number.isNaN(submittedAt.getTime()) ? submittedAt : null,
  });
}

const DAY_BASE = 100000; // o'sha kun bazasi (baza×razryad×ЦКП%×stake natijasi) — gate ko'paytiradi

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

(async () => {
  const client = await pool.connect();
  let failed = false;
  try {
    await client.query('BEGIN');

    // 1) TEST-karta (deadline 3 soat) — ochiq 'TEST-' belgili (FABRIKATSIYA YO'Q).
    const card = await client.query(
      `INSERT INTO org_departments (name, code, level, ckp_report_deadline_hours, created_at)
       VALUES ('TEST-A11-CKP-GATE', 'TEST-A11-CKP', 5, 3, NOW()) RETURNING id`,
    );
    const cardId = card.rows[0].id;
    console.log(`TEST-karta yaratildi id=${cardId} (deadline_hours=3)`);

    const DAY_A = '2026-06-20'; // fakt bor + deadline ichida
    const DAY_B = '2026-06-21'; // fakt YO'Q
    const DAY_C = '2026-06-22'; // fakt bor + deadline o'tgan

    // Kun A: deadline = A ertangi 00:00 + 3h = 2026-06-21T03:00Z. submitted 02:00 (ICHIDA).
    await client.query(
      `INSERT INTO ckp_fact_values
        (card_id, fact_date, target_value, actual_value, achievement_pct, source, status, submitted_at, created_at)
       VALUES ($1, $2::date, 100, 90, 90, 'TEST', 'submitted', '2026-06-21T02:00:00.000Z', NOW())`,
      [cardId, DAY_A],
    );
    // Kun B: fakt YO'Q (ataylab kiritilmaydi).
    // Kun C: deadline = C ertangi 00:00 + 3h = 2026-06-23T03:00Z. submitted 10:00 (O'TGAN).
    await client.query(
      `INSERT INTO ckp_fact_values
        (card_id, fact_date, target_value, actual_value, achievement_pct, source, status, submitted_at, created_at)
       VALUES ($1, $2::date, 100, 90, 90, 'TEST', 'submitted', '2026-06-23T10:00:00.000Z', NOW())`,
      [cardId, DAY_C],
    );

    console.log('\n── Kun A (fakt bor, deadline ICHIDA) ──');
    const a = await evaluateDay(client, cardId, DAY_A);
    console.log('  decision:', JSON.stringify(a), '→ kun-oylik =', DAY_BASE * a.factor);
    assert(a.open === true && a.factor === 1, 'Kun A: darvoza OCHIQ (oylik to\'liq)');
    assert(DAY_BASE * a.factor === DAY_BASE, `Kun A: oylik = ${DAY_BASE} (gate ta'sir qilmadi)`);

    console.log('\n── Kun B (fakt YO\'Q) ──');
    const b = await evaluateDay(client, cardId, DAY_B);
    console.log('  decision:', JSON.stringify(b), '→ kun-oylik =', DAY_BASE * b.factor);
    assert(b.open === false && b.reason === 'NO_FACT' && b.factor === 0, 'Kun B: darvoza YOPIQ (NO_FACT)');
    assert(DAY_BASE * b.factor === 0, 'Kun B: oylik = 0 (QATTIQ-0)');

    console.log('\n── Kun C (fakt bor, deadline O\'TGAN) ──');
    const c = await evaluateDay(client, cardId, DAY_C);
    console.log('  decision:', JSON.stringify(c), '→ kun-oylik =', DAY_BASE * c.factor);
    assert(c.open === false && c.reason === 'DEADLINE_PASSED' && c.factor === 0, 'Kun C: darvoza YOPIQ (DEADLINE_PASSED)');
    assert(DAY_BASE * c.factor === 0, 'Kun C: oylik = 0 (QATTIQ-0)');

    console.log('\nNATIJA: ЦКП-gate QATTIQ-0 ishladi — fakt bor+ichida=oylik, fakt yo\'q/o\'tgan=0.');
  } catch (e) {
    failed = true;
    console.error('PROOF XATO:', e.message);
  } finally {
    await client.query('ROLLBACK'); // DB o'zgarmaydi
    console.log('\nROLLBACK bajarildi — DB o\'zgarmadi (TEST yozuvlar yo\'qoldi).');
    client.release();
    await pool.end();
  }
  process.exit(failed ? 1 : 0);
})();
