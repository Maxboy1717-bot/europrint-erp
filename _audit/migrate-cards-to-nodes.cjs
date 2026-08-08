/** VISION (egasi 2026-06-24): node=karta. org_functions(eski karta) data'sini nom-mos org_departments
 *  position-node'larga KO'CHIRADI (COALESCE — faqat bo'sh maydonlarni to'ldiradi, qaytariladi).
 *  1-bosqich: karta-MAYDONLARI ko'chadi. (employee_cards FK re-point = keyingi tasdiqlangan bosqich.) */
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' }); // allow-secret
(async () => {
  const c = await pool.connect();
  try {
    const before = (await c.query(`SELECT COUNT(*) FILTER (WHERE razryad_level_id IS NOT NULL) AS rz, COUNT(*) FILTER (WHERE tskp IS NOT NULL AND tskp<>'') AS tk FROM org_departments WHERE node_type='position' AND is_active`)).rows[0];
    console.log('OLDIN (position-node): razryad=', before.rz, 'tskp=', before.tk);
    const r = await c.query(`
      UPDATE org_departments d SET
        razryad_level_id      = COALESCE(d.razryad_level_id, f.razryad_level_id),
        salary_type           = COALESCE(d.salary_type, f.salary_type),
        min_salary            = COALESCE(d.min_salary, f.min_salary),
        max_salary            = COALESCE(d.max_salary, f.max_salary),
        rbac_tier             = COALESCE(d.rbac_tier, f.rbac_tier),
        tskp                  = COALESCE(NULLIF(d.tskp,''), f.tskp),
        tskp_ru               = COALESCE(NULLIF(d.tskp_ru,''), f.tskp_ru),
        tskp_target           = COALESCE(d.tskp_target, f.tskp_target),
        tskp_measurement_unit = COALESCE(d.tskp_measurement_unit, f.tskp_measurement_unit),
        statistics_type       = COALESCE(d.statistics_type, f.statistics_type),
        ai_exam_enabled       = COALESCE(d.ai_exam_enabled, f.ai_exam_enabled),
        description           = COALESCE(NULLIF(d.description,''), f.function_description),
        updated_at            = now()
      FROM org_functions f
      WHERE d.is_active AND d.node_type='position' AND f.deleted_at IS NULL
        AND lower(trim(d.name)) = lower(trim(f.position_name))`);
    console.log('KOCHIRILDI (UPDATE rowCount):', r.rowCount);
    const after = (await c.query(`SELECT COUNT(*) FILTER (WHERE razryad_level_id IS NOT NULL) AS rz, COUNT(*) FILTER (WHERE tskp IS NOT NULL AND tskp<>'') AS tk FROM org_departments WHERE node_type='position' AND is_active`)).rows[0];
    console.log('KEYIN  (position-node): razryad=', after.rz, 'tskp=', after.tk);
  } catch (e) { console.error('ERR', e.message); }
  finally { c.release(); await pool.end(); }
})();
