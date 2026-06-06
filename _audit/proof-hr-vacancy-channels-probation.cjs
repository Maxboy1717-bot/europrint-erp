/**
 * DB-proof: patchVacancyChannels → hr_vacancy_profiles.channels
 *           patchProbationDates  → hr_vacancy_profiles.probation_start/end via funnel JOIN
 */
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({ host: process.env.PGHOST||'127.0.0.1', port: Number(process.env.PGPORT)||5432, user: process.env.PGUSER||'postgres', password: process.env.PGPASSWORD||'postgres', database: process.env.PGDATABASE||'europrint' });
(async () => {
  let vacId, profId, funnelId;
  try {
    // Setup: create sentinel vacancy + profile + funnel
    const vr = await pool.query(`INSERT INTO vacancies (title, status) VALUES ('PROOF-VAC', 'open') RETURNING id`);
    vacId = vr.rows[0].id;
    const pr = await pool.query(`INSERT INTO hr_vacancy_profiles (vacancy_id, is_active) VALUES ($1, true) RETURNING id`, [vacId]);
    profId = pr.rows[0].id;
    const fr = await pool.query(
      `INSERT INTO hr_candidate_funnels (vacancy_id, funnel_stage, is_quick_rejected, is_active, checklist_data, created_at, updated_at)
       VALUES ($1, 'applied', false, true, '{}', NOW(), NOW()) RETURNING id`, [vacId]);
    funnelId = fr.rows[0].id;

    // 1) patchVacancyChannels
    const channels = ['telegram', 'hh.uz'];
    await pool.query(
      `UPDATE hr_vacancy_profiles SET channels=$1::jsonb, updated_at=NOW() WHERE vacancy_id=$2`,
      [JSON.stringify(channels), vacId]
    );
    const c1 = await pool.query(`SELECT channels FROM hr_vacancy_profiles WHERE vacancy_id=$1`, [vacId]);
    const saved = c1.rows[0].channels;
    const ch_ok = Array.isArray(saved) && saved[0] === 'telegram' && saved[1] === 'hh.uz';
    console.log('1) patchVacancyChannels channels:', JSON.stringify(saved), ch_ok ? '✅' : '❌');

    // 2) patchProbationDates via funnel JOIN
    await pool.query(`
      UPDATE hr_vacancy_profiles hvp
      SET probation_start = COALESCE($1::date, hvp.probation_start),
          probation_end   = COALESCE($2::date, hvp.probation_end),
          updated_at      = NOW()
      FROM hr_candidate_funnels hcf
      WHERE hcf.id = $3
        AND hvp.vacancy_id = hcf.vacancy_id
    `, ['2026-07-01', '2026-09-30', funnelId]);
    const c2 = await pool.query(`SELECT probation_start::text AS ps, probation_end::text AS pe FROM hr_vacancy_profiles WHERE vacancy_id=$1`, [vacId]);
    const ps = String(c2.rows[0].ps ?? '');
    const pe = String(c2.rows[0].pe ?? '');
    const pb_ok = ps === '2026-07-01' && pe === '2026-09-30';
    console.log('2) patchProbationDates start/end:', ps, '/', pe, pb_ok ? '✅' : '❌');

    const all_ok = ch_ok && pb_ok;
    console.log(all_ok ? '\n✅ PROOF PASSED — channels + probation dates persist to hr_vacancy_profiles.' : '\n❌ FAILED');
  } catch (e) {
    console.error('ERR:', e.message);
  } finally {
    if (funnelId) await pool.query(`DELETE FROM hr_candidate_funnels WHERE id=$1`, [funnelId]).catch(()=>{});
    if (profId)   await pool.query(`DELETE FROM hr_vacancy_profiles WHERE id=$1`, [profId]).catch(()=>{});
    if (vacId)    await pool.query(`DELETE FROM vacancies WHERE id=$1`, [vacId]).catch(()=>{});
    await pool.end();
  }
})();
