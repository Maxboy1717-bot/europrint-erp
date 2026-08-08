/** DB-PROOF (rollback-tx): FAZA-05 ЦКП fakt — norma=100, bajarilgan=80 -> achievement=80%; idempotent upsert. */
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' });
function calc(ft, t, a){ if(ft==='boolean') return a>0?100:0; if(!(t>0)) return 0; return Math.round((a/t)*10000)/100; }
(async () => {
  const c = await pool.connect();
  try {
    const card = (await c.query(`SELECT id FROM org_departments WHERE node_type='position' AND is_active ORDER BY id LIMIT 1`)).rows[0].id;
    await c.query('BEGIN');
    await c.query(`UPDATE org_departments SET tskp_target=100, ckp_formula_type='quantity_pct' WHERE id=$1`, [card]);
    const ach = calc('quantity_pct', 100, 80);
    // upsert fakt
    await c.query(`INSERT INTO ckp_fact_values (card_id, fact_date, target_value, actual_value, achievement_pct, source, formula_type, status, submitted_at, created_at) VALUES ($1, CURRENT_DATE, 100, 80, $2, 'MANUAL', 'quantity_pct', 'submitted', NOW(), NOW()) ON CONFLICT (card_id, fact_date, COALESCE(employee_id,0), COALESCE(product_id,0)) DO UPDATE SET actual_value=EXCLUDED.actual_value, achievement_pct=EXCLUDED.achievement_pct`, [card, ach]);
    const f1 = (await c.query(`SELECT actual_value, target_value, achievement_pct FROM ckp_fact_values WHERE card_id=$1 AND fact_date=CURRENT_DATE`, [card])).rows[0];
    console.log(`1) Fakt yozildi: bajarilgan=${f1.actual_value}/norma=${f1.target_value} -> achievement=${f1.achievement_pct}% (80 kutilgan)`);
    // idempotent: qayta yozish (bajarilgan=90)
    const ach2 = calc('quantity_pct', 100, 90);
    await c.query(`INSERT INTO ckp_fact_values (card_id, fact_date, target_value, actual_value, achievement_pct, source, formula_type, status, submitted_at, created_at) VALUES ($1, CURRENT_DATE, 100, 90, $2, 'MANUAL', 'quantity_pct', 'submitted', NOW(), NOW()) ON CONFLICT (card_id, fact_date, COALESCE(employee_id,0), COALESCE(product_id,0)) DO UPDATE SET actual_value=EXCLUDED.actual_value, achievement_pct=EXCLUDED.achievement_pct`, [card, ach2]);
    const cnt = (await c.query(`SELECT count(*)::int n, MAX(achievement_pct) a FROM ckp_fact_values WHERE card_id=$1 AND fact_date=CURRENT_DATE`, [card])).rows[0];
    console.log(`2) Idempotent qayta-yozish: qator=${cnt.n} (1 kutilgan — dublikat yo'q), achievement=${cnt.a}% (90 yangilandi)`);
    await c.query('ROLLBACK');
    console.log('ROLLBACK -> jonli DB tegilmadi');
  } catch (e) { try { await c.query('ROLLBACK'); } catch {} console.error('ERR', e.message); }
  finally { c.release(); await pool.end(); }
})();
