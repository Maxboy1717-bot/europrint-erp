/**
 * A12 — TEST-KARTA JONLI SEED (vertikal-ip boshlanish nuqtasi)
 * ============================================================================
 * Bu YAGONA jonli-yozadigan (rollback EMAS) audit skripti. To'liq 'TEST-' belgili
 * karta-to'plamini `europrint` DB'ga PERSIST qiladi — keyingi agentlar (A13 SD
 * buyurtma, A20 golden-thread, A21/A22 FE) shu ID'larga tayanadi.
 *
 * EGASI 8-QARORI (qulflangan): birinchi ip = 'TEST-' belgili karta (Q8). Soxta emas —
 * OCHIQ 'TEST-' prefiks bilan namuna; egasi keyin real data bilan almashtiradi (Q-40
 * fabrikatsiya-taqiq: TEST ochiq belgilanadi, soxta qiymat yashirilmaydi).
 *
 * YARATADIGAN ZANJIR (card-markaz, A1-A3 poydevoriga mos):
 *   1) org_departments     — KARTA o'zi (name='TEST-Operator', node_type='position',
 *                            razryad_level_id=9 [5-razryad, coeff 2.30], rbac_tier=NULL,
 *                            ЦКП-norma: tskp_target + ckp_* deadline metadata)
 *   2) employees           — 'TEST-' xodim (kartaga biriktiriladigan shaxs)
 *   3) users               — 'TEST-' login (card_id = shu karta → A3 resolveCardGate
 *                            birlamchi kartani users.card_id'dan oladi; employee_id link)
 *   4) employee_cards       — (employee_id, card_id, is_primary, is_active) →
 *                            A3 activeCardCount shu jadvaldan sanaydi (≥1 bo'lishi shart)
 *   5) employee_org_departments — stake-ulush linki (stake_fraction=1.0, is_primary,
 *                            is_active) → A7/A11 oylik-formula stake'ni shundan o'qiydi
 *
 * IDEMPOTENT: har bosqich avval mavjudligini tekshiradi (TEST-belgili kalit bo'yicha) —
 * qayta ishlatilsa dublikat yaratmaydi, mavjud ID'larni qaytaradi.
 *
 * PAROL (Qoida A xavfsizlik): hardcoded default YO'Q. `TEST_KARTA_PASSWORD` env majburiy;
 * undan real bcrypt hash (12 round) generatsiya qilinadi. Secret CHOP ETILMAYDI (Q-30).
 *
 * ISHGA TUSHIRISH:
 *   TEST_KARTA_PASSWORD='...' node _audit/seed-test-karta.cjs
 *
 * QAYTARADI (stdout): har element ID + 'TEST-KARTA-IDS' JSON bloki (keyingi agentlar uchun).
 * ============================================================================
 */
const path = require('path');
const apiNm = path.join(__dirname, '..', 'apps', 'api', 'node_modules');
const { Pool } = require(path.join(apiNm, 'pg'));
const bcrypt = require(path.join(apiNm, 'bcrypt'));

// ── Konstantalar (TEST-belgili kalitlar — idempotency uchun) ────────────────
const CARD_NAME = 'TEST-Operator';        // org_departments.name (kanonik kalit)
const USERNAME = 'TEST-operator';          // users.username (UNIQUE)
const EMP_CODE = 'TEST-EMP-001';           // employees.employee_code (TEST belgisi)
const RAZRYAD_LEVEL_ID = 9;                // razryad_levels: 5-razryad (coeff 2.30)
const BCRYPT_ROUNDS = 12;                  // admin standarti (CLAUDE.md Qoida A)
// ЦКП-norma (struktura — soxta fakt EMAS, faqat norma ta'rifi):
const CKP_TARGET = 100;                     // org_departments.tskp_target (kunlik norma)
const CKP_FORMULA = 'quantity_pct';        // org_departments.ckp_formula_type
const CKP_FREQUENCY = 'daily';             // org_departments.ckp_frequency
const CKP_DEADLINE_HOURS = 24;             // org_departments.ckp_report_deadline_hours

const pool = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' });

async function ensureCard(c) {
  const found = (await c.query(`SELECT id FROM org_departments WHERE name = $1 LIMIT 1`, [CARD_NAME])).rows[0];
  if (found) {
    // Mavjud — ЦКП-norma metadata to'liqligini ta'minla (additiv, ishlab turgan qiymatni buzmaydi).
    await c.query(
      `UPDATE org_departments SET
         node_type = 'position', is_active = true, razryad_level_id = $2, rbac_tier = NULL,
         tskp_target = COALESCE(tskp_target, $3),
         ckp_formula_type = COALESCE(ckp_formula_type, $4),
         ckp_frequency = COALESCE(ckp_frequency, $5),
         ckp_report_deadline_hours = COALESCE(ckp_report_deadline_hours, $6)
       WHERE id = $1`,
      [found.id, RAZRYAD_LEVEL_ID, CKP_TARGET, CKP_FORMULA, CKP_FREQUENCY, CKP_DEADLINE_HOURS],
    );
    return { id: found.id, created: false };
  }
  const ins = (await c.query(
    `INSERT INTO org_departments
       (name, name_ru, description, node_type, is_active, razryad_level_id, rbac_tier,
        tskp_target, ckp_formula_type, ckp_frequency, ckp_report_deadline_hours, current_state)
     VALUES ($1, $2, $3, 'position', true, $4, NULL, $5, $6, $7, $8, 'active')
     RETURNING id`,
    [CARD_NAME, 'TEST-Оператор', 'TEST namuna karta (vertikal-ip) — egasi real data bilan almashtiradi',
     RAZRYAD_LEVEL_ID, CKP_TARGET, CKP_FORMULA, CKP_FREQUENCY, CKP_DEADLINE_HOURS],
  )).rows[0];
  return { id: ins.id, created: true };
}

async function ensureEmployee(c, cardId) {
  const found = (await c.query(`SELECT id, user_id FROM employees WHERE employee_code = $1 LIMIT 1`, [EMP_CODE])).rows[0];
  if (found) {
    await c.query(`UPDATE employees SET org_department_id = COALESCE(org_department_id, $2), is_active = true, status = 'active' WHERE id = $1`, [found.id, cardId]);
    return { id: found.id, created: false, userId: found.user_id };
  }
  const ins = (await c.query(
    `INSERT INTO employees
       (first_name, last_name, full_name, employee_code, status, is_active,
        org_department_id, hire_date, tenant_id)
     VALUES ('TEST', 'Operator', 'TEST Operator', $1, 'active', true, $2, CURRENT_DATE, 1)
     RETURNING id`,
    [EMP_CODE, cardId],
  )).rows[0];
  return { id: ins.id, created: true, userId: null };
}

async function ensureUser(c, employeeId, cardId, passwordHash) {
  const found = (await c.query(`SELECT id, card_id, employee_id FROM users WHERE username = $1 LIMIT 1`, [USERNAME])).rows[0];
  if (found) {
    // card_id (A1-A3 kanonik link) + employee_id'ni ta'minla (additiv; parolni qayta yozMAYMIZ).
    await c.query(
      `UPDATE users SET card_id = $2, employee_id = COALESCE(employee_id, $3), is_active = true, status = 'active' WHERE id = $1`,
      [found.id, cardId, employeeId],
    );
    return { id: found.id, created: false };
  }
  const ins = (await c.query(
    `INSERT INTO users
       (username, password_hash, first_name, last_name, full_name, role, status,
        is_active, employee_id, card_id, language)
     VALUES ($1, $2, 'TEST', 'Operator', 'TEST Operator', 'employee', 'active', true, $3, $4, 'uz')
     RETURNING id`,
    [USERNAME, passwordHash, employeeId, cardId],
  )).rows[0];
  return { id: ins.id, created: true };
}

async function ensureEmployeeCard(c, employeeId, cardId) {
  // uq_employee_cards_active_link UNIQUE (employee_id, card_id) WHERE is_active
  const found = (await c.query(
    `SELECT id FROM employee_cards WHERE employee_id = $1 AND card_id = $2 AND is_active = true LIMIT 1`,
    [employeeId, cardId],
  )).rows[0];
  if (found) return { id: found.id, created: false };
  const ins = (await c.query(
    `INSERT INTO employee_cards (employee_id, card_id, is_primary, is_active)
     VALUES ($1, $2, true, true) RETURNING id`,
    [employeeId, cardId],
  )).rows[0];
  return { id: ins.id, created: true };
}

async function ensureStakeLink(c, userId, cardId, employeeId) {
  // employee_org_departments = stake-ulush linki (A7/A11 oylik-formula manbasi).
  const found = (await c.query(
    `SELECT id, stake_fraction FROM employee_org_departments
     WHERE user_id = $1 AND org_department_id = $2 AND is_active = true LIMIT 1`,
    [userId, cardId],
  )).rows[0];
  if (found) {
    await c.query(`UPDATE employee_org_departments SET stake_fraction = COALESCE(stake_fraction, 1.0), is_primary = true, is_active = true WHERE id = $1`, [found.id]);
    return { id: found.id, created: false };
  }
  const ins = (await c.query(
    `INSERT INTO employee_org_departments
       (user_id, org_department_id, employee_id, is_primary, is_active, stake_fraction, assigned_at, created_at)
     VALUES ($1, $2, $3, true, true, 1.0, NOW(), NOW())
     RETURNING id`,
    [userId, cardId, employeeId],
  )).rows[0];
  return { id: ins.id, created: true };
}

(async () => {
  const pwd = process.env.TEST_KARTA_PASSWORD;
  if (!pwd || pwd.length < 8) {
    console.error("BLOK: TEST_KARTA_PASSWORD env o'rnatilmagan yoki <8 belgi. Misol: TEST_KARTA_PASSWORD='...' node _audit/seed-test-karta.cjs");
    process.exitCode = 2;
    return;
  }
  const passwordHash = await bcrypt.hash(pwd, BCRYPT_ROUNDS);

  const c = await pool.connect();
  try {
    await c.query('BEGIN');

    const card = await ensureCard(c);
    const emp = await ensureEmployee(c, card.id);
    const user = await ensureUser(c, emp.id, card.id, passwordHash);
    const empCard = await ensureEmployeeCard(c, emp.id, card.id);
    const stake = await ensureStakeLink(c, user.id, card.id, emp.id);

    await c.query('COMMIT');

    // ── Tekshiruv: A3 resolveCardGate mantig'ini takrorlab, gate qiymatini chop et ──
    const gate = (await c.query(`
      WITH usr AS (SELECT id, employee_id, card_id FROM users WHERE id = $1),
      prim AS (SELECT COALESCE((SELECT card_id FROM usr),
                 (SELECT ec.card_id FROM employee_cards ec
                  WHERE ec.employee_id = (SELECT employee_id FROM usr) AND ec.is_active = true
                  ORDER BY ec.is_primary DESC, ec.assigned_at DESC NULLS LAST LIMIT 1)) AS card_id)
      SELECT
        (SELECT COUNT(*) FROM employee_cards ec WHERE ec.employee_id = (SELECT employee_id FROM usr) AND ec.is_active = true)::int AS active_card_count,
        (SELECT card_id FROM prim) AS primary_card_id,
        (SELECT od.rbac_tier FROM org_departments od WHERE od.id = (SELECT card_id FROM prim)) AS rbac_tier,
        (SELECT rl.name FROM org_departments od LEFT JOIN razryad_levels rl ON rl.id = od.razryad_level_id WHERE od.id = (SELECT card_id FROM prim)) AS razryad_name,
        (SELECT rl.coefficient FROM org_departments od LEFT JOIN razryad_levels rl ON rl.id = od.razryad_level_id WHERE od.id = (SELECT card_id FROM prim)) AS razryad_coeff,
        (SELECT eod.stake_fraction FROM employee_org_departments eod WHERE eod.user_id = (SELECT id FROM usr) AND eod.org_department_id = (SELECT card_id FROM prim) AND eod.is_active LIMIT 1) AS stake,
        (SELECT od.tskp_target FROM org_departments od WHERE od.id = (SELECT card_id FROM prim)) AS ckp_target,
        (SELECT od.ckp_report_deadline_hours FROM org_departments od WHERE od.id = (SELECT card_id FROM prim)) AS ckp_deadline_hours
    `, [user.id])).rows[0];

    console.log('=== TEST-KARTA SEED — JONLI PERSIST QILINDI ===');
    console.log(`  karta (org_departments)      id=${card.id}   ${card.created ? '[YARATILDI]' : '[mavjud edi]'}  name='${CARD_NAME}'`);
    console.log(`  xodim (employees)            id=${emp.id}   ${emp.created ? '[YARATILDI]' : '[mavjud edi]'}  code='${EMP_CODE}'`);
    console.log(`  login (users)               id=${user.id}   ${user.created ? '[YARATILDI]' : '[mavjud edi]'}  username='${USERNAME}'  card_id=${card.id}`);
    console.log(`  employee_cards link          id=${empCard.id}   ${empCard.created ? '[YARATILDI]' : '[mavjud edi]'}  is_primary=true`);
    console.log(`  stake link (employee_org_*)  id=${stake.id}   ${stake.created ? '[YARATILDI]' : '[mavjud edi]'}  stake_fraction=1.0`);
    console.log('--- A3 card-gate tekshiruvi (jonli) ---');
    console.log(`  activeCardCount=${gate.active_card_count}  primaryCardId=${gate.primary_card_id}  rbacTier=${gate.rbac_tier === null ? 'NULL(razryaddan)' : gate.rbac_tier}`);
    console.log(`  razryad=${gate.razryad_name} (koeff ${gate.razryad_coeff})  stake=${gate.stake}`);
    console.log(`  ЦКП-norma: target=${gate.ckp_target}  deadline_hours=${gate.ckp_deadline_hours}`);
    console.log('--- KEYINGI AGENTLAR UCHUN ID BLOKI ---');
    console.log('TEST-KARTA-IDS ' + JSON.stringify({
      cardId: card.id, employeeId: emp.id, userId: user.id,
      employeeCardId: empCard.id, stakeLinkId: stake.id,
      razryadLevelId: RAZRYAD_LEVEL_ID, username: USERNAME,
    }));

    // Yakuniy tekshiruv: gate to'g'ri ulanganmi?
    if (gate.active_card_count < 1 || gate.primary_card_id !== card.id || gate.stake === null) {
      console.error("OGOHLANTIRISH: card-gate to'liq ulanmadi — tekshiring (activeCardCount/primaryCardId/stake).");
      process.exitCode = 1;
    }
  } catch (e) {
    try { await c.query('ROLLBACK'); } catch (_) {}
    console.error('ERR', e.message);
    process.exitCode = 1;
  } finally {
    c.release();
    await pool.end();
  }
})();
