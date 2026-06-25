/** APPLY (jonli, egasi tasdig'i A "0 dan", 2026-06-25): FAZA-00 FK re-point.
 *  GUARDED + IDEMPOTENT: faqat FK hali org_functions'ga bo'lsa ishlaydi (qayta-ishga tushsa o'tkazib yuboradi).
 *  Test-bindinglar (0 dan) tozalanadi -> employee_cards.card_id + card_folders.card_id FK -> org_departments. */
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' });
(async () => {
  const c = await pool.connect();
  try {
    const cur = (await c.query(`SELECT confrelid::regclass::text AS ref FROM pg_constraint WHERE conname='employee_cards_card_id_fkey'`)).rows[0];
    if (!cur || cur.ref !== 'org_functions') {
      console.log('O\'TKAZIB YUBORILDI: employee_cards FK allaqachon ->', cur ? cur.ref : '(yo\'q)', '(idempotent, qayta ishlamaydi)');
      return;
    }
    await c.query('BEGIN');
    const cf = (await c.query(`DELETE FROM card_folders RETURNING id`)).rowCount;
    const ec = (await c.query(`DELETE FROM employee_cards RETURNING id`)).rowCount;
    await c.query(`ALTER TABLE employee_cards DROP CONSTRAINT IF EXISTS employee_cards_card_id_fkey`);
    await c.query(`ALTER TABLE employee_cards ADD CONSTRAINT employee_cards_card_id_fkey FOREIGN KEY (card_id) REFERENCES org_departments(id)`);
    await c.query(`ALTER TABLE card_folders DROP CONSTRAINT IF EXISTS card_folders_card_id_fkey`);
    await c.query(`ALTER TABLE card_folders ADD CONSTRAINT card_folders_card_id_fkey FOREIGN KEY (card_id) REFERENCES org_departments(id)`);
    await c.query('COMMIT');
    const ec2 = (await c.query(`SELECT confrelid::regclass::text AS ref FROM pg_constraint WHERE conname='employee_cards_card_id_fkey'`)).rows[0].ref;
    const cf2 = (await c.query(`SELECT confrelid::regclass::text AS ref FROM pg_constraint WHERE conname='card_folders_card_id_fkey'`)).rows[0];
    console.log(`QO'LLANDI: tozalandi employee_cards=${ec}, card_folders=${cf}`);
    console.log(`employee_cards.card_id FK -> ${ec2}  |  card_folders.card_id FK -> ${cf2 ? cf2.ref : '(yo\'q)'}  (org_departments kutilgan)`);
  } catch (e) { try { await c.query('ROLLBACK'); } catch {} console.error('ERR', e.message); }
  finally { c.release(); await pool.end(); }
})();
