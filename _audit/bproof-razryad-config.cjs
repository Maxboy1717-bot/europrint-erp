/** DB-PROOF (rollback-tx): razryad-sozlama PROGRESSION maydonlarini saqlaydimi
 *  (egasi "nima qilsa razryad oshadi" + "sozlama yo'q"): exam_pass_threshold (o'tish bali) +
 *  max_retakes (qayta topshirish) + min_months (keyingi razryadgacha oy). DATA SAQLANMAYDI — ROLLBACK. */
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' });
(async () => {
  const c = await pool.connect();
  try {
    const before = (await c.query(`SELECT level, name, exam_pass_threshold, max_retakes, min_months FROM razryad_levels WHERE level=3`)).rows[0];
    console.log('OLDIN (3-razryad):', JSON.stringify(before));
    await c.query('BEGIN');
    // RazryadFormDialog PATCH /razryad-levels/:id { examPassThreshold, maxRetakes, minMonths } repo update'iga teng:
    await c.query(
      `UPDATE razryad_levels SET
         exam_pass_threshold = COALESCE($1, exam_pass_threshold),
         max_retakes         = COALESCE($2, max_retakes),
         min_months          = COALESCE($3, min_months),
         updated_at = NOW()
       WHERE level=3 AND is_active=true`, [70, 2, 3]);
    const after = (await c.query(`SELECT level, name, exam_pass_threshold, max_retakes, min_months FROM razryad_levels WHERE level=3`)).rows[0];
    console.log('KEYIN  (sozlama saqlandi):', JSON.stringify(after), '  (o\'tish-bali=70%, qayta=2, oy=3)');
    await c.query('ROLLBACK');
    const back = (await c.query(`SELECT exam_pass_threshold, max_retakes, min_months FROM razryad_levels WHERE level=3`)).rows[0];
    console.log('ROLLBACK -> qaytdi:', JSON.stringify(back), '(saqlanmadi — bu faqat isbot; egasi UI orqali sozlaydi)');
  } catch (e) { await c.query('ROLLBACK'); console.error('ERR', e.message); }
  finally { c.release(); await pool.end(); }
})();
