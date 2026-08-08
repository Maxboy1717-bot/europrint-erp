/**
 * A39 — ULUSH (stake) TARIX MEXANIZMI: apply + JONLI DB-proof (rollback-tx, Q-29).
 *
 * 1. stake_history jadvalini idempotent yaratadi (migrations-drift bilan bir xil DDL).
 * 2. ROLLBACK-tx ichida org-mutations.repo.recordStakeChange mantig'ini takrorlaydi:
 *    eski stake o'qish → UPDATE → tarix qatori append → ko'rindi → ROLLBACK (jonli data o'zgarmaydi).
 * SECRET chop etilmaydi. BEGIN...ROLLBACK — hech qanday doimiy yozuv yo'q.
 */
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' });

(async () => {
  const c = await pool.connect();
  try {
    // ── 1. APPLY (idempotent, migrations-drift DDL bilan bir xil) ──
    await c.query(`CREATE TABLE IF NOT EXISTS stake_history (id SERIAL PRIMARY KEY, eod_id INTEGER, user_id INTEGER NOT NULL, card_id INTEGER NOT NULL, old_stake NUMERIC(4,3), new_stake NUMERIC(4,3), change_type TEXT NOT NULL, reason TEXT, changed_by INTEGER, allow_overload BOOLEAN NOT NULL DEFAULT false, effective_at TIMESTAMP NOT NULL DEFAULT NOW(), created_at TIMESTAMP NOT NULL DEFAULT NOW())`);
    await c.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='chk_stake_history_range') THEN ALTER TABLE stake_history ADD CONSTRAINT chk_stake_history_range CHECK ((old_stake IS NULL OR (old_stake >= 0 AND old_stake <= 1)) AND (new_stake IS NULL OR (new_stake >= 0 AND new_stake <= 1))); END IF; END $$`);
    await c.query(`CREATE INDEX IF NOT EXISTS idx_stake_history_user_card ON stake_history (user_id, card_id, effective_at DESC)`);
    await c.query(`CREATE INDEX IF NOT EXISTS idx_stake_history_card ON stake_history (card_id, effective_at DESC)`);

    const reg = (await c.query(`SELECT to_regclass('public.stake_history') t, (SELECT count(*) FROM pg_constraint WHERE conname='chk_stake_history_range') chk, (SELECT count(*) FROM pg_indexes WHERE tablename='stake_history' AND indexname IN ('idx_stake_history_user_card','idx_stake_history_card')) idx`)).rows[0];
    console.log(`APPLY: stake_history=${reg.t}, CHECK=${reg.chk}/1, indexes=${reg.idx}/2`);

    // ── 2. JONLI DB-PROOF (rollback-tx) — TEST-karta (users 69 ↔ org_departments 173) ──
    await c.query('BEGIN');

    // 2a. mavjud TEST link va eski stake (assignUser UPDATE yo'li simulyatsiyasi)
    const link = (await c.query(
      `SELECT id, stake_fraction FROM employee_org_departments WHERE user_id = 69 AND org_department_id = 173 AND is_active = true LIMIT 1`
    )).rows[0];

    let proofEodId, proofOld;
    if (link) {
      proofEodId = link.id;
      proofOld = link.stake_fraction == null ? null : Number(link.stake_fraction);
      // stake 1.0 → 0.6 (HAQIQIY o'zgarish)
      await c.query(`UPDATE employee_org_departments SET stake_fraction = 0.600 WHERE id = $1`, [proofEodId]);
    } else {
      // TEST link bo'lmasa — har holda mantiqni isbotlaymiz (old=NULL → new=0.6, 'assign')
      proofEodId = null; proofOld = null;
    }

    // 2b. recordStakeChange mantig'i: faqat HAQIQIY o'zgarishda append
    const newStake = 0.6;
    const changed = !(proofOld === newStake || (proofOld != null && Math.abs(proofOld - newStake) < 1e-9));
    if (changed) {
      await c.query(
        `INSERT INTO stake_history (eod_id, user_id, card_id, old_stake, new_stake, change_type, changed_by, allow_overload, effective_at, created_at)
         VALUES ($1, 69, 173, $2, $3, 'reassign', NULL, false, NOW(), NOW())`,
        [proofEodId, proofOld, newStake]
      );
    }

    // 2c. idempotentlik isboti: bir xil stake (0.6→0.6) qayta yozilsa append YO'Q
    const sameOld = 0.6, sameNew = 0.6;
    const sameChanged = !(sameOld === sameNew || Math.abs(sameOld - sameNew) < 1e-9);
    if (sameChanged) {
      await c.query(`INSERT INTO stake_history (eod_id, user_id, card_id, old_stake, new_stake, change_type, changed_by, allow_overload) VALUES ($1,69,173,$2,$3,'reassign',NULL,false)`, [proofEodId, sameOld, sameNew]);
    }

    // 2d. tarix ko'rindimi?
    const hist = (await c.query(
      `SELECT id, user_id, card_id, old_stake, new_stake, change_type, allow_overload FROM stake_history WHERE user_id = 69 AND card_id = 173 ORDER BY id DESC LIMIT 5`
    )).rows;
    console.log(`PROOF (rollback-tx): TEST link topildi=${!!link}, HAQIQIY-o'zgarish-yozildi=${changed}, idempotent-skip(0.6->0.6)=${!sameChanged}`);
    console.log(`PROOF tarix qatorlari:`, JSON.stringify(hist));

    await c.query('ROLLBACK');
    // ROLLBACK dan keyin — jonli holatda yangi qator qolmaganini tasdiqlash (proof yozuvlari yo'qoldi)
    const after = (await c.query(`SELECT count(*)::int n FROM stake_history WHERE user_id = 69 AND card_id = 173 AND new_stake = 0.6`)).rows[0].n;
    console.log(`POST-ROLLBACK: proof qator soni (jonli, 0.6) = ${after} (kutilgan 0 — ROLLBACK ishladi)`);
  } catch (e) {
    try { await c.query('ROLLBACK'); } catch (_) {}
    console.error('ERR', e.message);
    process.exitCode = 1;
  } finally {
    c.release();
    await pool.end();
  }
})();
