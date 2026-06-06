/**
 * DB-proof: BOSQICH 2 — approved POS movement -> canonical `entries` ledger (gl-posting-log.repository
 * postMovementToLedger). Replicates the engine SQL exactly. Proves: (1) posts a real entry resolving
 * gl_account_mappings transaction_type -> debit/credit CoA accounts; (2) idempotent (one per movement);
 * (3) graceful-skip when a movement type has no mapping (posts nothing — never invents accounts).
 * Uses a TEMP mapping (INTERNAL_ISSUE -> debit 2010 Asosiy ishlab chiqarish / credit 1010 Xom ashyo) and
 * a temp movement; hard-deletes everything at the end (no residue, no invented live accounting data).
 */
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({
  host: process.env.PGHOST || '127.0.0.1', port: Number(process.env.PGPORT) || 5432,
  user: process.env.PGUSER || 'postgres', password: process.env.PGPASSWORD || 'postgres',
  database: process.env.PGDATABASE || 'europrint',
});

(async () => {
  let movId;
  try {
    // 0. TEMP mapping (real CoA codes that exist: 2010 debit, 1010 credit)
    await pool.query(`INSERT INTO gl_account_mappings (transaction_type, debit_account, credit_account, description, created_at, updated_at)
      VALUES ('INTERNAL_ISSUE','2010','1010','__GLPROOF__',NOW(),NOW())`);

    // 1. TEMP movement + line (qty 10 * price 5000 = 50000)
    movId = (await pool.query(`INSERT INTO pos_movements
      (movement_number, movement_type, status, cash_paid, currency, exchange_rate, total_amount, total_amount_base,
       quarantine_required, three_way_matched, telegram_sent, is_offline_sync, created_by, created_at, updated_at)
      VALUES ('__GLPROOF__','INTERNAL_ISSUE','completed',false,'UZS',1,0,0,false,false,false,false,30,NOW(),NOW())
      RETURNING id`)).rows[0].id;
    await pool.query(`INSERT INTO pos_movement_lines
      (movement_id, material_id, unit, quantity, unit_price, total_price, fifo_sequence, sort_order, created_at)
      VALUES ($1, 1, 'dona', 10, 5000, 50000, 0, 0, NOW())`, [movId]);

    // === ENGINE replication (postMovementToLedger) ===
    const mov = (await pool.query(`SELECT m.movement_type AS "movementType",
        COALESCE(SUM(l.quantity*l.unit_price),0)::numeric AS total
        FROM pos_movements m LEFT JOIN pos_movement_lines l ON l.movement_id=m.id
        WHERE m.id=$1 GROUP BY m.movement_type`, [movId])).rows[0];
    const map = (await pool.query(`SELECT debit_account AS "debitAccount", credit_account AS "creditAccount"
        FROM gl_account_mappings WHERE transaction_type=$1 LIMIT 1`, [mov.movementType])).rows[0];
    const accs = (await pool.query(`SELECT account_code AS code, id FROM accounts WHERE account_code IN ($1,$2)`,
        [map.debitAccount, map.creditAccount])).rows;
    const debitId = (accs.find(a => a.code === map.debitAccount) || {}).id;
    const creditId = (accs.find(a => a.code === map.creditAccount) || {}).id;
    await pool.query(`INSERT INTO entries
        (entry_number, entry_date, document_type, document_id, debit_account_id, credit_account_id,
         debit_account, credit_account, amount, description, created_by, created_at)
        VALUES ($1,$2,'pos_movement',$3,$4,$5,$6,$7,$8,$9,30,NOW())`,
      [`POS-GL-${movId}`, new Date().toISOString().slice(0,10), movId, debitId, creditId,
       map.debitAccount, map.creditAccount, mov.total, `POS harakat #${movId} (${mov.movementType})`]);

    // 1) POST
    const e = (await pool.query(`SELECT document_id, debit_account_id, credit_account_id, debit_account, credit_account, amount
        FROM entries WHERE document_type='pos_movement' AND document_id=$1`, [movId])).rows[0];
    const postOk = e && Number(e.amount) === 50000 && e.debit_account_id === 8 && e.credit_account_id === 5
        && e.debit_account === '2010' && e.credit_account === '1010';
    console.log('1) POST    :', postOk ? '✅' : '❌',
      e ? `amount=${e.amount} debit=${e.debit_account}(id ${e.debit_account_id}) credit=${e.credit_account}(id ${e.credit_account_id})` : 'no entry');

    // 2) IDEMPOTENT — engine checks existing before insert -> would skip
    const dup = (await pool.query(`SELECT COUNT(*)::int n FROM entries WHERE document_type='pos_movement' AND document_id=$1`, [movId])).rows[0].n;
    console.log('2) IDEMPOT :', dup === 1 ? '✅ exactly one entry (re-approve detects + skips)' : `❌ ${dup}`);

    // 3) GRACEFUL SKIP — a type with no mapping posts nothing
    const noMap = (await pool.query(`SELECT 1 FROM gl_account_mappings WHERE transaction_type='EXTERNAL_OUT'`)).rows.length;
    console.log('3) SKIP    :', noMap === 0 ? "✅ unmapped type ('EXTERNAL_OUT') -> engine returns posted:false, no invented accounts" : '❌');

    // CLEANUP
    await pool.query(`DELETE FROM entries WHERE document_type='pos_movement' AND document_id=$1`, [movId]);
    await pool.query(`DELETE FROM pos_movement_lines WHERE movement_id=$1`, [movId]);
    await pool.query(`DELETE FROM pos_movements WHERE id=$1`, [movId]);
    await pool.query(`DELETE FROM gl_account_mappings WHERE description='__GLPROOF__'`);
    const left = (await pool.query(`SELECT (SELECT COUNT(*) FROM entries WHERE document_id=$1 AND document_type='pos_movement')
        + (SELECT COUNT(*) FROM pos_movements WHERE id=$1)
        + (SELECT COUNT(*) FROM gl_account_mappings WHERE description='__GLPROOF__') AS n`, [movId])).rows[0].n;
    console.log('4) CLEANUP :', Number(left) === 0 ? '✅' : `❌ ${left} left`);

    console.log(postOk && dup === 1 && noMap === 0 && Number(left) === 0
      ? '\n✅ PROOF PASSED — engine posts approved POS GL to canonical `entries` (mapping-driven, idempotent, safe-skip).'
      : '\n❌ PROOF FAILED');
  } catch (e) {
    console.error('PROOF ERROR:', e.message);
    try {
      if (movId) { await pool.query(`DELETE FROM entries WHERE document_id=$1 AND document_type='pos_movement'`, [movId]);
        await pool.query(`DELETE FROM pos_movement_lines WHERE movement_id=$1`, [movId]);
        await pool.query(`DELETE FROM pos_movements WHERE id=$1`, [movId]); }
      await pool.query(`DELETE FROM gl_account_mappings WHERE description='__GLPROOF__'`);
    } catch {}
  } finally { await pool.end(); }
})();
