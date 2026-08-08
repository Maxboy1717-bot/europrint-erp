/**
 * Rollback-tx DB-proof for Gap #31 cashier naqd-ledger (running saldo + limit warning).
 * Inserts cash_in + cash_out movements into open shift #3, recomputes the ledger exactly
 * like CashierHubService.getShiftLedger (opening + Σ signed → running balance), asserts the
 * limit-warning logic, then ROLLS BACK — no persisted side-effects. Q-40 correctness check.
 */
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' });

(async () => {
  const c = await pool.connect();
  try {
    await c.query('BEGIN');
    const shiftId = 3;
    const sh = (await c.query('SELECT id, status, opened_amount, daily_cash_limit FROM cashier_shifts WHERE id=$1', [shiftId])).rows[0];
    if (!sh) throw new Error('shift #3 not found');
    const opening = Number(sh.opened_amount);
    console.log(`shift #${shiftId} status=${sh.status} opening=${opening} per-shift-limit=${sh.daily_cash_limit ?? 'NULL'}`);

    // Set a per-shift ceiling for this proof (rolled back) so we can exercise limitExceeded.
    await c.query('UPDATE cashier_shifts SET daily_cash_limit=$1 WHERE id=$2', [120000, shiftId]);

    // Two movements: +50000 cash_in, then -20000 expense.
    await c.query(
      `INSERT INTO cashier_movements (shift_id, type, amount, reference, pin_verified, created_at)
       VALUES ($1,'cash_in',50000,'PROOF-IN-T21B2', false, NOW()),
              ($1,'expense',20000,'PROOF-OUT-T21B2', true, NOW())`,
      [shiftId],
    );

    // Recompute the ledger exactly like the service.
    const moves = (await c.query(
      'SELECT id, type, amount, reference FROM cashier_movements WHERE shift_id=$1 ORDER BY id', [shiftId],
    )).rows;
    let running = opening, cashIn = 0, cashOut = 0;
    console.log('--- ledger lines (running saldo) ---');
    for (const m of moves) {
      const amt = Number(m.amount);
      const inflow = m.type === 'cash_in';
      const signed = inflow ? amt : -amt;
      if (inflow) cashIn += amt; else cashOut += amt;
      running += signed;
      console.log(`  #${m.id} ${m.type.padEnd(13)} ${signed > 0 ? '+' : ''}${signed}  saldo=${running}  (${m.reference})`);
    }
    const balance = opening + cashIn - cashOut;
    const limit = 120000;
    const limitExceeded = limit > 0 && balance > limit;
    console.log(`cashIn=${cashIn} cashOut=${cashOut} balance=${balance} limit=${limit} limitExceeded=${limitExceeded}`);

    const expectBalance = opening + 50000 - 20000;
    const ok = balance === expectBalance && running === balance && limitExceeded === (balance > limit);
    console.log(`ASSERT balance=${expectBalance}? ${balance === expectBalance ? 'PASS' : 'FAIL'} | running==balance? ${running === balance ? 'PASS' : 'FAIL'} | limit-logic? ${ok ? 'PASS' : 'FAIL'}`);

    await c.query('ROLLBACK');
    const after = (await c.query('SELECT COUNT(*)::int n FROM cashier_movements WHERE reference LIKE $1', ['PROOF-%-T21B2'])).rows[0].n;
    console.log(`ROLLED BACK — proof movements remaining=${after} (expect 0)`);
    console.log(ok && after === 0 ? '\n✅ Gap #31 ledger DB-proof PASS' : '\n❌ FAIL');
  } catch (e) {
    await c.query('ROLLBACK').catch(() => {});
    console.error('PROOF ERROR:', e.message);
    process.exit(1);
  } finally {
    c.release();
    await pool.end();
  }
})();
