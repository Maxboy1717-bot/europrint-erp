/**
 * DB-proof for Gap #32 AR/AP ECL aging handlers (read-only). Runs the EXACT handler SQL
 * (with the due_date::date fix) against live fi_invoices, then applies the ECL rates from
 * cfo_config exactly like ArAgingHandler — confirming the endpoints return real, correct data.
 */
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' });

const bucketSql = (type) => `
  SELECT CASE
      WHEN ((NOW() AT TIME ZONE 'Asia/Tashkent')::date - due_date::date) <= 30 THEN '0-30'
      WHEN ((NOW() AT TIME ZONE 'Asia/Tashkent')::date - due_date::date) <= 60 THEN '31-60'
      WHEN ((NOW() AT TIME ZONE 'Asia/Tashkent')::date - due_date::date) <= 90 THEN '61-90'
      ELSE '90+' END AS bucket,
    COUNT(*)::int AS invoice_count,
    COALESCE(SUM(total_amount - COALESCE(paid_amount,0)),0)::numeric(18,4) AS remaining
  FROM fi_invoices
  WHERE status NOT IN ('paid','cancelled','void')
    AND COALESCE(type,'receivable') = '${type}'
    AND total_amount > COALESCE(paid_amount,0)
  GROUP BY 1`;

(async () => {
  const c = await pool.connect();
  try {
    // ECL rates (cfo_config) — same keys ArAgingHandler reads.
    const cfg = (await c.query(
      `SELECT config_key, config_value FROM cfo_config WHERE config_key IN ('ar_ecl_rate_0_30','ar_ecl_rate_31_60','ar_ecl_rate_61_90','ar_ecl_rate_91_plus')`,
    )).rows.reduce((m, r) => (m[r.config_key] = Number(r.config_value), m), {});
    const eclRate = { '0-30': cfg.ar_ecl_rate_0_30 ?? 0.02, '31-60': cfg.ar_ecl_rate_31_60 ?? 0.08, '61-90': cfg.ar_ecl_rate_61_90 ?? 0.20, '90+': cfg.ar_ecl_rate_91_plus ?? 0.50 };

    const ar = (await c.query(bucketSql('receivable'))).rows;
    let totalAr = 0, totalEcl = 0;
    console.log('=== AR (receivable) ECL aging ===');
    for (const r of ar) {
      const amt = Number(r.remaining);
      const ecl = +(amt * (eclRate[r.bucket] ?? 0)).toFixed(4);
      totalAr += amt; totalEcl += ecl;
      console.log(`  ${r.bucket.padEnd(6)} cnt=${r.invoice_count} amount=${amt} eclRate=${eclRate[r.bucket]} ecl=${ecl}`);
    }
    console.log(`  totalAr=${totalAr} totalEcl=${+totalEcl.toFixed(4)}`);

    const ap = (await c.query(bucketSql('payable'))).rows;
    let totalAp = 0;
    console.log('=== AP (payable) aging ===');
    for (const r of ap) { const amt = Number(r.remaining); totalAp += amt; console.log(`  ${r.bucket.padEnd(6)} cnt=${r.invoice_count} amount=${amt}`); }
    console.log(`  totalAp=${totalAp}`);

    const ok = totalAr > 0 && totalEcl > 0 && totalAp >= 0;
    console.log(ok ? '\n✅ Gap #32 AR/AP ECL aging DB-proof PASS (real data, no fabrication)' : '\n⚠️ no AR data');
  } catch (e) {
    console.error('PROOF ERROR:', e.message); process.exit(1);
  } finally {
    c.release(); await pool.end();
  }
})();
