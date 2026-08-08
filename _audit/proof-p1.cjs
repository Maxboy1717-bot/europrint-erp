const { Client } = require(require('path').join(__dirname,'..','apps','api','node_modules','pg')) ;
(async () => {
  const c = new Client({ host:'127.0.0.1', port:5432, user:'postgres', password:'postgres', database:'europrint' }); // allow-secret
  await c.connect();
  try {
    await c.query('BEGIN');
    // qc createFinalInspection (new INSERT shape)
    const qc = await c.query(`INSERT INTO qc_final_inspections (papka_order_id, inspected_by, result, status, notes, passed)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, papka_order_id, result, status`,
      [999999, null, 'pending', 'pending', 'P1 proof', false]);
    console.log('QC INSERT ok →', JSON.stringify(qc.rows[0]));
    // finance recordPayment (new INSERT shape)
    const fp = await c.query(`INSERT INTO finance_payments (invoice_id, amount, status, payment_date, notes)
      VALUES ($1,$2,$3,$4,$5) RETURNING id, invoice_id, amount, status, notes`,
      [999999, 100.50, 'pending', new Date(), 'Recorded by user #1']);
    console.log('FINANCE INSERT ok →', JSON.stringify(fp.rows[0]));
    await c.query('ROLLBACK');
    console.log('ROLLBACK done — no data persisted.');
  } catch (e) {
    await c.query('ROLLBACK').catch(()=>{});
    console.log('PROOF FAILED:', e.message);
    process.exitCode = 1;
  } finally { await c.end(); }
})();
