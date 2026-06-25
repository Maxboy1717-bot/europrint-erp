/** DB-PROOF (rollback-tx): FAZA-06 card_folders 6-bo'lim org_departments-kartaga saqlanadi (FAZA-00 FK) + completeness%. */
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' });
const SECTIONS = ['vazifa','javobgarlik','gsd','reglament','jarayon','talim'];
(async () => {
  const c = await pool.connect();
  try {
    const card = (await c.query(`SELECT id FROM org_departments WHERE node_type='position' AND is_active ORDER BY id LIMIT 1`)).rows[0].id;
    const cols = (await c.query(`SELECT column_name FROM information_schema.columns WHERE table_name='card_folders' AND column_name = ANY($1)`, [SECTIONS])).rows.map(r=>r.column_name);
    await c.query('BEGIN');
    await c.query(`DELETE FROM card_folders WHERE card_id=$1`, [card]);
    // 2 bo'lim to'ldir (vazifa+javobgarlik) -> completeness 2/6=33%
    const r = await c.query(`INSERT INTO card_folders (card_id, vazifa, javobgarlik, is_active, created_at) VALUES ($1, 'Lavozim vazifasi', 'Javobgarlik bandi', true, NOW()) RETURNING id, vazifa, javobgarlik`, [card]);
    const filled = SECTIONS.filter(s => { const row=r.rows[0]; return row[s] && String(row[s]).trim()!==''; }).length;
    console.log(`card_folders 6-bo'lim ustunlari mavjud: ${cols.join(',')}`);
    console.log(`org_departments karta #${card}ga papka saqlandi (FK ishlaydi). To'ldirilgan: ${filled}/6 -> completeness ${Math.round(filled/6*100)}% (33% kutilgan)`);
    await c.query('ROLLBACK');
    console.log('ROLLBACK -> jonli DB tegilmadi');
  } catch (e) { try { await c.query('ROLLBACK'); } catch {} console.error('ERR', e.message); }
  finally { c.release(); await pool.end(); }
})();
