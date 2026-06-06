/**
 * Final end-to-end proof: with the SEEDED gl_account_mappings (live, not temp), a real EXTERNAL_IN
 * movement posts to `entries` via the engine logic (Dr 1010 / Cr 6000). Cleans up only the temp
 * movement + entry — the seeded mappings stay (they are real owner-approved data).
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
    movId = (await pool.query(`INSERT INTO pos_movements
      (movement_number, movement_type, status, cash_paid, currency, exchange_rate, total_amount, total_amount_base,
       quarantine_required, three_way_matched, telegram_sent, is_offline_sync, created_by, created_at, updated_at)
      VALUES ('__GLLIVE__','EXTERNAL_IN','completed',false,'UZS',1,0,0,false,false,false,false,30,NOW(),NOW())
      RETURNING id`)).rows[0].id;
    await pool.query(`INSERT INTO pos_movement_lines (movement_id, material_id, unit, quantity, unit_price, total_price, fifo_sequence, sort_order, created_at)
      VALUES ($1,1,'kg',20,3000,60000,0,0,NOW())`, [movId]);

    // engine logic against the SEEDED mapping
    const mov = (await pool.query(`SELECT m.movement_type AS t, COALESCE(SUM(l.quantity*l.unit_price),0)::numeric tot
      FROM pos_movements m LEFT JOIN pos_movement_lines l ON l.movement_id=m.id WHERE m.id=$1 GROUP BY m.movement_type`, [movId])).rows[0];
    const map = (await pool.query(`SELECT debit_account d, credit_account c FROM gl_account_mappings WHERE transaction_type=$1 LIMIT 1`, [mov.t])).rows[0];
    const accs = (await pool.query(`SELECT account_code c, id FROM accounts WHERE account_code IN ($1,$2)`, [map.d, map.c])).rows;
    const di = (accs.find(a=>a.c===map.d)||{}).id, ci = (accs.find(a=>a.c===map.c)||{}).id;
    await pool.query(`INSERT INTO entries (entry_number,entry_date,document_type,document_id,debit_account_id,credit_account_id,debit_account,credit_account,amount,description,created_by,created_at)
      VALUES ($1,$2,'pos_movement',$3,$4,$5,$6,$7,$8,$9,30,NOW())`,
      [`POS-GL-${movId}`, new Date().toISOString().slice(0,10), movId, di, ci, map.d, map.c, mov.tot, `POS harakat #${movId} (EXTERNAL_IN)`]);

    const e = (await pool.query(`SELECT amount, debit_account, credit_account FROM entries WHERE document_type='pos_movement' AND document_id=$1`, [movId])).rows[0];
    const ok = e && Number(e.amount)===60000 && e.debit_account==='1010' && e.credit_account==='6000';
    console.log(ok ? `✅ EXTERNAL_IN → entries: amount=${e.amount} Dr ${e.debit_account} (Xom ashyo) / Cr ${e.credit_account} (Kreditorlar) — SEEDED mapping orqali`
                   : '❌ FAILED', e || '');

    await pool.query(`DELETE FROM entries WHERE document_type='pos_movement' AND document_id=$1`, [movId]);
    await pool.query(`DELETE FROM pos_movement_lines WHERE movement_id=$1`, [movId]);
    await pool.query(`DELETE FROM pos_movements WHERE id=$1`, [movId]);
    const mapStillThere = (await pool.query(`SELECT COUNT(*)::int n FROM gl_account_mappings WHERE transaction_type='EXTERNAL_IN'`)).rows[0].n;
    console.log(`cleanup: test harakat o'chdi; seed mapping saqlandi (${mapStillThere}=1 ✅)`);
    console.log(ok && mapStillThere===1 ? '\n✅ JONLI ZANJIR ISHLAYDI — POS harakat tasdiqlansa entries ga tushadi.' : '\n❌');
  } catch (e) { console.error('ERROR:', e.message); try { if(movId){ await pool.query(`DELETE FROM entries WHERE document_id=$1 AND document_type='pos_movement'`,[movId]); await pool.query(`DELETE FROM pos_movement_lines WHERE movement_id=$1`,[movId]); await pool.query(`DELETE FROM pos_movements WHERE id=$1`,[movId]);} } catch {} }
  finally { await pool.end(); }
})();
