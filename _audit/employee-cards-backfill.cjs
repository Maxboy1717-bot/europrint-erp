/**
 * A25 — EMPLOYEE↔CARD BACKFILL MEXANIZMI (data EMAS, mexanizm)
 * ============================================================================
 * Maqsad: xodim↔karta biriktirishni BIR ATOMIK transaksiyada UCH jadvalga izchil
 * yozadigan qayta-ishlatiladigan mexanizm:
 *
 *   1) employee_cards          — (employee_id, card_id, is_primary, is_active)  [login/oylik manbasi]
 *   2) employee_org_departments — (user_id, org_department_id, employee_id, is_primary, stake_fraction, is_active) [stake-ulush]
 *   3) users.card_id            — birlamchi (is_primary) karta to'g'ridan link (kanonik primary)
 *
 * NEGA bu mexanizm kerak:
 *   - `card.service.assignEmployeeToCard` faqat employee_cards'ga yozadi + employees.org_function_id
 *     mirror — u employee_org_departments (stake) yoki users.card_id'ni YOZMAYDI va 3 jadval
 *     bo'ylab ATOMIK emas (alohida exec'lar). Org-tomondan `employee_org_departments` yoziladi,
 *     lekin u employee_cards'ni yozmaydi. Ya'ni "biriktirish" ikki yarim-yo'ldan boradi.
 *   - Bu skript egasi REAL data berganda (xodim↔karta juftliklari) uchni BIR yo'lda to'ldiradi.
 *
 * FABRIKATSIYA TAQIQ (Q-40): bu skript SOXTA juftlik O'YLAB TOPMAYDI. Juftliklar faqat:
 *   (a) BACKFILL_PAIRINGS_FILE — egasi bergan JSON fayl (mexanizmga data SHU YERDAN keladi), yoki
 *   (b) --proof — jonli mavjud TEST-karta yozuvidan (ochiq 'TEST-' namuna) — ROLLBACK bilan,
 *       hech narsa saqlamasdan, 3-jadval izchilligini ISBOTLAYDI.
 *   Data yo'q bo'lsa → skript hech narsa yozmaydi va egasi-data kerakligini aytadi.
 *
 * JUFTLIK JSON SHAKLI (egasi to'ldiradi — har element BITTA biriktirish):
 *   [
 *     { "employeeId": 12, "cardId": 173, "isPrimary": true,  "stakeFraction": 1.0 },
 *     { "employeeId": 12, "cardId": 180, "isPrimary": false, "stakeFraction": 0.5 }
 *   ]
 *   - employeeId, cardId  : majburiy int (mavjud bo'lishi DB'da tekshiriladi)
 *   - isPrimary           : majburiy bool (xodim bo'yicha FAQAT BITTA true bo'lishi shart)
 *   - stakeFraction       : ixtiyoriy 0..1 (yo'q bo'lsa: solo karta=1.0, aks holda NULL → egasi belgilaydi)
 *
 * ATOMIKLIK + IDEMPOTENTLIK:
 *   - Har JUFTLIK GURUHI (bir employee'ning hamma kartalari) BITTA savepoint ichida yoziladi;
 *     biror yozuv qulasa — o'sha xodim juftliklari butunlay ortga qaytadi (yarim holat YO'Q).
 *   - employee_cards: uq_employee_cards_active_link (employee_id, card_id) WHERE is_active → ON CONFLICT DO UPDATE.
 *   - employee_org_departments: faol (user_id, org_department_id) bo'yicha SELECT-keyin-yoz (jadval'da
 *     unique yo'q) — dublikat yaratmaydi.
 *   - users.card_id: birlamchi karta bo'yicha UPDATE; primary almashganda eski primary tozalanadi.
 *
 * REJIMLAR:
 *   --proof        : ROLLBACK rejim. Jonli TEST-karta yozuvidan 1 xodimni olib, 3-jadval atomik
 *                    yozuvini bajaradi va ROLLBACK qiladi — DB o'zgarmaydi (Q-29 jonli isbot).
 *   --dry-run      : BACKFILL_PAIRINGS_FILE juftliklari bo'yicha hammasini bajaradi, lekin oxirida
 *                    ROLLBACK — nima yozilishini ko'rsatadi, saqlamaydi.
 *   (bayroqsiz)    : BACKFILL_PAIRINGS_FILE juftliklarini REAL COMMIT qiladi (egasi data bergach).
 *
 * ISHGA TUSHIRISH:
 *   node _audit/employee-cards-backfill.cjs --proof                          # jonli isbot (rollback)
 *   BACKFILL_PAIRINGS_FILE=pairings.json node _audit/employee-cards-backfill.cjs --dry-run
 *   BACKFILL_PAIRINGS_FILE=pairings.json node _audit/employee-cards-backfill.cjs   # real backfill
 * ============================================================================
 */
const path = require('path');
const fs = require('fs');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));

const pool = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' });

const ARGS = process.argv.slice(2);
const MODE_PROOF = ARGS.includes('--proof');
const MODE_DRY = ARGS.includes('--dry-run');

/** employees.id → users.id (employee_id link). user yo'q bo'lsa null (stake linki user_id talab qiladi). */
async function resolveUserId(c, employeeId) {
  const r = (await c.query(
    `SELECT id FROM users WHERE employee_id = $1 AND deleted_at IS NULL ORDER BY id LIMIT 1`,
    [employeeId],
  )).rows[0];
  return r ? Number(r.id) : null;
}

/** Juftlik validatsiyasi: employee + card DB'da mavjud + faolmi. Soxta id'larni rad etadi (Q-40). */
async function validatePairing(c, p) {
  if (!Number.isInteger(p.employeeId) || !Number.isInteger(p.cardId)) {
    return `employeeId/cardId int bo'lishi shart (oldi: ${JSON.stringify(p)})`;
  }
  if (typeof p.isPrimary !== 'boolean') return `isPrimary bool bo'lishi shart (employee=${p.employeeId})`;
  if (p.stakeFraction != null && (typeof p.stakeFraction !== 'number' || p.stakeFraction < 0 || p.stakeFraction > 1)) {
    return `stakeFraction 0..1 oralig'ida bo'lishi shart (employee=${p.employeeId})`;
  }
  const emp = (await c.query(`SELECT 1 FROM employees WHERE id = $1`, [p.employeeId])).rows[0];
  if (!emp) return `employee #${p.employeeId} topilmadi`;
  const card = (await c.query(`SELECT 1 FROM org_departments WHERE id = $1 AND is_active = true`, [p.cardId])).rows[0];
  if (!card) return `karta (org_departments) #${p.cardId} topilmadi yoki nofaol`;
  return null;
}

/**
 * BITTA biriktirishni 3 jadvalga yozadi (chaqiruvchi transaksiya/savepoint ichida bo'lishi shart).
 * Atomik bo'lak — chaqiruvchi xato bo'lsa savepoint'ni ortga qaytaradi.
 */
async function writeAssignment(c, p, userId) {
  const primary = p.isPrimary === true;
  // solo karta uchun stake default 1.0; ko'p-karta bo'lsa egasi belgilamaguncha NULL (fabrikatsiya YO'Q).
  const stake = p.stakeFraction != null ? p.stakeFraction : (primary ? 1.0 : null);

  // 1) employee_cards — faol (employee_id, card_id) bo'yicha upsert (uq_employee_cards_active_link).
  await c.query(
    `INSERT INTO employee_cards (employee_id, card_id, is_primary, is_active, assigned_at, created_at, updated_at)
     VALUES ($1, $2, $3, true, NOW(), NOW(), NOW())
     ON CONFLICT (employee_id, card_id) WHERE is_active
     DO UPDATE SET is_primary = EXCLUDED.is_primary, updated_at = NOW()`,
    [p.employeeId, p.cardId, primary],
  );

  // 2) employee_org_departments — stake linki (jadval'da unique yo'q → SELECT-keyin-yoz).
  if (userId != null) {
    const existing = (await c.query(
      `SELECT id FROM employee_org_departments
       WHERE user_id = $1 AND org_department_id = $2 AND is_active = true LIMIT 1`,
      [userId, p.cardId],
    )).rows[0];
    if (existing) {
      await c.query(
        `UPDATE employee_org_departments
           SET is_primary = $2, employee_id = $3,
               stake_fraction = COALESCE($4, stake_fraction)
         WHERE id = $1`,
        [existing.id, primary, p.employeeId, stake],
      );
    } else {
      await c.query(
        `INSERT INTO employee_org_departments
           (user_id, org_department_id, employee_id, is_primary, is_active, stake_fraction, assigned_at, created_at)
         VALUES ($1, $2, $3, $4, true, $5, NOW(), NOW())`,
        [userId, p.cardId, p.employeeId, primary, stake],
      );
    }
  }

  // 3) users.card_id — FAQAT birlamchi karta uchun (kanonik primary link).
  if (primary && userId != null) {
    await c.query(`UPDATE users SET card_id = $2, updated_at = NOW() WHERE id = $1`, [userId, p.cardId]);
  }
}

/**
 * Bir xodimning hamma juftliklarini izchillashtirib BITTA savepoint ichida yozadi.
 * Izchillik qoidalari:
 *   - employee_cards: shu xodimning boshqa kartalarida is_primary=false qilinadi (faqat bitta primary).
 *   - employee_org_departments: shu user boshqa kartalarida is_primary=false.
 *   - users.card_id: yangi primary kartaga (yoki primary yo'q bo'lsa o'zgarmaydi).
 */
async function backfillEmployeeGroup(c, employeeId, pairings) {
  const userId = await resolveUserId(c, employeeId);
  const primaries = pairings.filter((p) => p.isPrimary === true);
  if (primaries.length > 1) {
    throw new Error(`employee #${employeeId}: faqat BITTA karta is_primary=true bo'lishi mumkin (oldi: ${primaries.length})`);
  }

  await c.query(`SAVEPOINT emp_grp`);
  try {
    // Avval shu xodim/userning hozirgi primary bayroqlarini tozalaymiz (yangi primary o'rnatiladi).
    if (primaries.length === 1) {
      await c.query(`UPDATE employee_cards SET is_primary = false, updated_at = NOW() WHERE employee_id = $1 AND is_active`, [employeeId]);
      if (userId != null) {
        await c.query(`UPDATE employee_org_departments SET is_primary = false WHERE user_id = $1 AND is_active`, [userId]);
      }
    }
    for (const p of pairings) {
      await writeAssignment(c, p, userId);
    }
    await c.query(`RELEASE SAVEPOINT emp_grp`);
  } catch (e) {
    await c.query(`ROLLBACK TO SAVEPOINT emp_grp`);
    throw new Error(`employee #${employeeId} biriktirish qaytarildi (atomik): ${e.message}`);
  }
  return { employeeId, userId, count: pairings.length, hasPrimary: primaries.length === 1 };
}

/** 3-jadval izchilligini O'QIB tasdiqlaydi (yozgandan keyin). */
async function verifyConsistency(c, employeeId) {
  const userId = await resolveUserId(c, employeeId);
  const ec = (await c.query(
    `SELECT card_id, is_primary FROM employee_cards WHERE employee_id = $1 AND is_active ORDER BY is_primary DESC, card_id`,
    [employeeId],
  )).rows;
  const eod = userId == null ? [] : (await c.query(
    `SELECT org_department_id AS card_id, is_primary, stake_fraction FROM employee_org_departments
     WHERE user_id = $1 AND is_active ORDER BY is_primary DESC, org_department_id`,
    [userId],
  )).rows;
  const usr = userId == null ? null : (await c.query(`SELECT card_id FROM users WHERE id = $1`, [userId])).rows[0];

  const primaryCard = ec.find((r) => r.is_primary)?.card_id ?? null;
  const usersCardId = usr ? usr.card_id : null;
  // Izchillik: users.card_id == employee_cards primary AND har primary karta employee_org_departments'da ham bor.
  const cardIdMatch = userId == null || primaryCard == null ? true : Number(usersCardId) === Number(primaryCard);
  const eodHasPrimary = userId == null || primaryCard == null
    ? true
    : eod.some((r) => Number(r.card_id) === Number(primaryCard) && r.is_primary);
  return { employeeId, userId, employeeCards: ec, eod, usersCardId, primaryCard, cardIdMatch, eodHasPrimary };
}

function loadPairings() {
  const file = process.env.BACKFILL_PAIRINGS_FILE;
  if (!file) return null;
  if (!fs.existsSync(file)) {
    throw new Error(`BACKFILL_PAIRINGS_FILE topilmadi: ${file}`);
  }
  const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!Array.isArray(parsed)) throw new Error('Juftliklar JSON massiv bo\'lishi shart');
  return parsed;
}

/** --proof: jonli TEST-karta yozuvidan 1 xodimni olib, atomik 3-jadval yozuvini ROLLBACK bilan isbotlaydi. */
async function runProof(c) {
  // Eng yangi 'TEST-' xodim (ochiq namuna) — soxta emas, OCHIQ belgilangan.
  const emp = (await c.query(
    `SELECT e.id AS employee_id, ec.card_id
       FROM employees e
       JOIN employee_cards ec ON ec.employee_id = e.id AND ec.is_active
      WHERE e.employee_code LIKE 'TEST-%'
      ORDER BY e.id DESC LIMIT 1`,
  )).rows[0];
  if (!emp) {
    console.error("BLOK (proof): jonli 'TEST-' xodim+karta topilmadi. Avval: TEST_KARTA_PASSWORD='...' node _audit/seed-test-karta.cjs");
    process.exitCode = 2;
    return;
  }
  const pairing = { employeeId: Number(emp.employee_id), cardId: Number(emp.card_id), isPrimary: true, stakeFraction: 1.0 };

  await c.query('BEGIN');
  const valErr = await validatePairing(c, pairing);
  if (valErr) { await c.query('ROLLBACK'); console.error('BLOK (proof) validatsiya:', valErr); process.exitCode = 1; return; }

  // O'qishdan oldin holatni snapshot qilamiz (proof = idempotent ko'rsatish).
  const before = await verifyConsistency(c, pairing.employeeId);
  const res = await backfillEmployeeGroup(c, pairing.employeeId, [pairing]);
  const after = await verifyConsistency(c, pairing.employeeId);
  await c.query('ROLLBACK');

  console.log('=== A25 BACKFILL MEXANIZMI — JONLI PROOF (rollback) ===');
  console.log(`  test xodim employee_id=${pairing.employeeId}  card_id=${pairing.cardId}  (TEST-namuna, ochiq)`);
  console.log(`  user_id=${res.userId}  yozildi: ${res.count} biriktirish (atomik)`);
  console.log('  --- 3-jadval izchilligi (yozuvdan keyin, rollback ICHIDA o\'qildi) ---');
  console.log(`  employee_cards (primary): ${after.primaryCard}`);
  console.log(`  users.card_id           : ${after.usersCardId}`);
  console.log(`  employee_org_departments: ${JSON.stringify(after.eod.map((r) => ({ card: Number(r.card_id), primary: r.is_primary, stake: r.stake_fraction })))}`);
  console.log(`  IZCHIL? users.card_id==employee_cards.primary: ${after.cardIdMatch}  |  eod birlamchi karta bor: ${after.eodHasPrimary}`);
  console.log('  ROLLBACK bajarildi — DB o\'zgarmadi (proof).');

  const ok = after.cardIdMatch && after.eodHasPrimary && after.primaryCard === pairing.cardId
    && (after.userId == null || Number(after.usersCardId) === pairing.cardId);
  if (!ok) {
    console.error('OGOHLANTIRISH: 3-jadval izchil ulanmadi — tekshiring.');
    process.exitCode = 1;
  } else {
    console.log('NATIJA: MEXANIZM ISHLAYDI — bitta atomik yo\'l, 3-jadval izchil. (Data egasidan: BACKFILL_PAIRINGS_FILE)');
  }
}

/** --dry-run / real: egasi bergan juftliklarni guruhlab yozadi. dry-run → ROLLBACK; aks holda COMMIT. */
async function runBackfill(c, pairings) {
  await c.query('BEGIN');
  try {
    // Validatsiya (soxta id rad). Bittasi noto'g'ri → butun backfill rad (Q-40).
    for (const p of pairings) {
      const e = await validatePairing(c, p);
      if (e) throw new Error('Juftlik validatsiya xatosi: ' + e);
    }
    // Xodim bo'yicha guruhlash.
    const byEmp = new Map();
    for (const p of pairings) {
      const k = p.employeeId;
      if (!byEmp.has(k)) byEmp.set(k, []);
      byEmp.get(k).push(p);
    }
    const summary = [];
    for (const [empId, ps] of byEmp.entries()) {
      const r = await backfillEmployeeGroup(c, empId, ps);
      const v = await verifyConsistency(c, empId);
      summary.push({ ...r, cardIdMatch: v.cardIdMatch, eodHasPrimary: v.eodHasPrimary });
    }
    const allConsistent = summary.every((s) => s.cardIdMatch && s.eodHasPrimary);
    if (!allConsistent) throw new Error('Izchillik tekshiruvi qulashi — backfill rad qilindi');

    if (MODE_DRY) {
      await c.query('ROLLBACK');
      console.log('=== A25 BACKFILL — DRY-RUN (rollback, saqlanmadi) ===');
    } else {
      await c.query('COMMIT');
      console.log('=== A25 BACKFILL — REAL COMMIT ===');
    }
    console.log(`  xodimlar: ${summary.length}, juftliklar: ${pairings.length}`);
    summary.forEach((s) => console.log(
      `  employee #${s.employeeId} (user ${s.userId}): ${s.count} karta, primary=${s.hasPrimary}, izchil=${s.cardIdMatch && s.eodHasPrimary}`,
    ));
  } catch (e) {
    try { await c.query('ROLLBACK'); } catch (_) {}
    console.error('BLOK: backfill rad (atomik, hech narsa saqlanmadi):', e.message);
    process.exitCode = 1;
  }
}

(async () => {
  const c = await pool.connect();
  try {
    if (MODE_PROOF) {
      await runProof(c);
      return;
    }
    const pairings = loadPairings();
    if (!pairings) {
      console.log('=== A25 EMPLOYEE↔CARD BACKFILL MEXANIZMI ===');
      console.log('Mexanizm tayyor, lekin DATA yo\'q (Q-40 fabrikatsiya taqiq).');
      console.log('  - Jonli isbot uchun:  node _audit/employee-cards-backfill.cjs --proof');
      console.log('  - Egasi juftlik bersa: BACKFILL_PAIRINGS_FILE=pairings.json node _audit/employee-cards-backfill.cjs [--dry-run]');
      console.log('EGASI-DATA KERAK: xodim↔karta juftliklari (employeeId, cardId, isPrimary, stakeFraction).');
      return;
    }
    if (pairings.length === 0) {
      console.log('Juftliklar bo\'sh — hech narsa yozilmadi.');
      return;
    }
    await runBackfill(c, pairings);
  } catch (e) {
    console.error('ERR', e.message);
    process.exitCode = 1;
  } finally {
    c.release();
    await pool.end();
  }
})();
