/** DB-PROOF (rollback-tx): T10-08 XATO-KATALOG (error_catalog).
 *  1) umumiy (card_id NULL) + karta-xos INSERT; 2) list(cardId) = karta-xos + umumiy;
 *  3) unique active code violation (23505); 4) soft-delete -> faol ro'yxatdan chiqadi.
 *  ROLLBACK -> jonli DB tegilmaydi. */
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' });
(async () => {
  const c = await pool.connect();
  try {
    const card = (await c.query(`SELECT id FROM org_departments WHERE node_type='position' AND is_active ORDER BY id LIMIT 1`)).rows[0].id;
    await c.query('BEGIN');

    // 1) umumiy xato (card_id NULL) + karta-xos xato
    const gen = (await c.query(
      `INSERT INTO error_catalog (card_id, code, name, name_ru, category, severity, sort_order, created_at, updated_at)
       VALUES (NULL, 'T10-08-GEN', 'Deadline o''tkazib yuborildi', 'Просрочен дедлайн', 'deadline', 'high', 1, NOW(), NOW()) RETURNING id`)).rows[0].id;
    const spec = (await c.query(
      `INSERT INTO error_catalog (card_id, code, name, category, severity, sort_order, created_at, updated_at)
       VALUES ($1, 'T10-08-CARD', 'Bo''yoq rangi mos kelmadi', 'sifat', 'medium', 2, NOW(), NOW()) RETURNING id`, [card])).rows[0].id;
    console.log(`1) INSERT: umumiy #${gen} (card_id NULL), karta-xos #${spec} (card_id=${card})`);

    // 2) list(cardId): o'sha kartaga xos + umumiy (operator dropdown)
    const forCard = (await c.query(
      `SELECT id, card_id, name FROM error_catalog
       WHERE is_active AND deleted_at IS NULL AND (card_id = $1 OR card_id IS NULL)
       ORDER BY card_id NULLS FIRST, sort_order`, [card])).rows;
    console.log(`2) list(cardId=${card}) -> ${forCard.length} qator (umumiy + karta-xos): ` +
      forCard.map(r => `[${r.card_id ?? 'UMUMIY'}] ${r.name}`).join(' | '));

    // 3) unique active code violation (SAVEPOINT — tx davom etishi uchun)
    let dup = 'YO\'Q';
    await c.query('SAVEPOINT sp_dup');
    try {
      await c.query(`INSERT INTO error_catalog (code, name, created_at, updated_at) VALUES ('T10-08-GEN', 'dublikat', NOW(), NOW())`);
      await c.query('RELEASE SAVEPOINT sp_dup');
    } catch (e) { dup = e.code === '23505' ? '23505 (kutilgan)' : e.code; await c.query('ROLLBACK TO SAVEPOINT sp_dup'); }
    console.log(`3) unique active code: dublikat 'T10-08-GEN' -> ${dup}`);

    // 4) soft-delete -> faol ro'yxatdan chiqadi, qator saqlanadi
    await c.query(`UPDATE error_catalog SET deleted_at=NOW(), is_active=false, updated_at=NOW() WHERE id=$1`, [gen]);
    const activeCnt = (await c.query(`SELECT count(*)::int n FROM error_catalog WHERE is_active AND deleted_at IS NULL AND card_id IS NULL`)).rows[0].n;
    const stillThere = (await c.query(`SELECT count(*)::int n FROM error_catalog WHERE id=$1`, [gen])).rows[0].n;
    console.log(`4) soft-delete #${gen}: umumiy-faol=${activeCnt} (0 kutilgan), qator-saqlandi=${stillThere} (1 — hard-delete EMAS)`);

    await c.query('ROLLBACK');
    console.log("ROLLBACK -> jonli DB tegilmadi");
  } catch (e) { try { await c.query('ROLLBACK'); } catch {} console.error('ERR', e.message); }
  finally { c.release(); await pool.end(); }
})();
