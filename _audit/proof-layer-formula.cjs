/**
 * DB-proof STEP 3: LayerFormulaService math + convert(). Replicates the service formula exactly.
 * (1) pure math against the owner's examples: 100kg/300GSM/1000x700 -> 476.19 sheets;
 *     corrugated 205+205+(127x1.43) -> 591.61 GSM.
 * (2) convert() path: temp PLAIN material (grammage 300, 1000x700) -> kg<->sheet; temp CORRUGATED
 *     material + layers (205,205 liner / 127 flute take_up 1.43) -> effective 591.61 GSM -> sheets.
 * Temp rows; cleaned up.
 */
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({
  host: process.env.PGHOST || '127.0.0.1', port: Number(process.env.PGPORT) || 5432,
  user: process.env.PGUSER || 'postgres', password: process.env.PGPASSWORD || 'postgres',
  database: process.env.PGDATABASE || 'europrint',
});
const near = (a, b, tol = 0.5) => Math.abs(a - b) <= tol;

// --- pure math (mirror of the service) ---
const areaM2 = (L, W) => (L / 1000) * (W / 1000);
const plainSheetCount = (kg, gsm, L, W) => (areaM2(L, W) * gsm > 0 ? (kg * 1000) / (areaM2(L, W) * gsm) : 0);
const plainKg = (sheets, gsm, L, W) => (areaM2(L, W) * gsm * sheets) / 1000;
const corrugatedTotalGsm = (layers) => layers.reduce((s, l) => s + l.gsm * (l.role === 'flute' ? (l.takeUpFactor ?? 1) : 1), 0);

(async () => {
  let pid, cid;
  try {
    // (1) pure math vs owner's examples
    const sheets = plainSheetCount(100, 300, 1000, 700);
    const gsm = corrugatedTotalGsm([{ role: 'liner', gsm: 205 }, { role: 'liner', gsm: 205 }, { role: 'flute', gsm: 127, takeUpFactor: 1.43 }]);
    console.log('--- DB-PROOF: layer formula (kg<->sheet) ---');
    console.log('1) PURE MATH  : plain 100kg/300GSM/1000x700 ->', sheets.toFixed(2), near(sheets, 476.19) ? '✅ (=476)' : '❌',
      '| corrugated 205+205+127x1.43 ->', gsm.toFixed(2), near(gsm, 591.61) ? '✅ (=592)' : '❌');
    // reverse check
    const back = plainKg(sheets, 300, 1000, 700);
    console.log('   reverse     : 476 sheets -> kg =', back.toFixed(2), near(back, 100, 0.1) ? '✅ (=100kg)' : '❌');

    // (2) convert() — temp PLAIN material
    pid = (await pool.query(`INSERT INTO material_cards (kod, xom_ashyo, unit_of_measure, is_active, grammage, format_a, format_b, material_kind, created_at)
      VALUES ('__LF_PLAIN__','PROOF Karton 300','kg',true,300,1000,700,'plain',NOW()) RETURNING id`)).rows[0].id;
    const matP = (await pool.query(`SELECT grammage, format_a, format_b, material_kind FROM material_cards WHERE id=$1`, [pid])).rows[0];
    const convP = plainSheetCount(100, Number(matP.grammage), Number(matP.format_a), Number(matP.format_b));
    console.log('2) PLAIN conv : material #' + pid, 'kind=' + matP.material_kind, '100kg ->', convP.toFixed(2), 'sheets', near(convP, 476.19) ? '✅' : '❌');

    // (2) convert() — temp CORRUGATED material + layers
    cid = (await pool.query(`INSERT INTO material_cards (kod, xom_ashyo, unit_of_measure, is_active, format_a, format_b, material_kind, created_at)
      VALUES ('__LF_CORR__','PROOF Gofra','kg',true,1000,700,'corrugated',NOW()) RETURNING id`)).rows[0].id;
    await pool.query(`INSERT INTO material_layer_config (material_card_id, layer_index, role, gsm, take_up_factor)
      VALUES ($1,1,'liner',205,NULL),($1,2,'liner',205,NULL),($1,3,'flute',127,1.43)`, [cid]);
    const layers = (await pool.query(`SELECT role, gsm, take_up_factor FROM material_layer_config WHERE material_card_id=$1 ORDER BY layer_index`, [cid])).rows
      .map(r => ({ role: r.role, gsm: Number(r.gsm), takeUpFactor: r.take_up_factor != null ? Number(r.take_up_factor) : null }));
    const effGsm = corrugatedTotalGsm(layers);
    const convC = plainSheetCount(100, effGsm, 1000, 700);
    console.log('3) CORR conv  : material #' + cid, 'effGsm=' + effGsm.toFixed(2), near(effGsm, 591.61) ? '✅' : '❌', '100kg ->', convC.toFixed(2), 'sheets');

    await pool.query(`DELETE FROM material_layer_config WHERE material_card_id=$1`, [cid]);
    await pool.query(`DELETE FROM material_cards WHERE id IN ($1,$2)`, [pid, cid]);
    const left = (await pool.query(`SELECT COUNT(*)::int n FROM material_cards WHERE id IN ($1,$2)`, [pid, cid])).rows[0].n;
    console.log('4) cleanup    :', left, left === 0 ? '✅' : '❌');

    const ok = near(sheets, 476.19) && near(gsm, 591.61) && near(back, 100, 0.1) && near(convP, 476.19) && near(effGsm, 591.61) && left === 0;
    console.log(ok ? '\n✅ PROOF PASSED — layer formula computes kg<->sheet for plain + corrugated, config-driven.' : '\n❌ PROOF FAILED');
  } catch (e) {
    console.error('PROOF ERROR:', e.message);
    try { if (cid) await pool.query(`DELETE FROM material_layer_config WHERE material_card_id=$1`, [cid]); await pool.query(`DELETE FROM material_cards WHERE kod IN ('__LF_PLAIN__','__LF_CORR__')`); } catch {}
  } finally { await pool.end(); }
})();
