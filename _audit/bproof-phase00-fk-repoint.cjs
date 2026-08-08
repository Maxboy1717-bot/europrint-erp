/** DB-PROOF (rollback-tx): FAZA-00 FK re-point (A = "0 dan").
 *  employee_cards/card_folders test-bindinglarini tozalab, card_id FK ni org_functions->org_departments
 *  ga qaratish ISHLAYDImi + yangi FK org_departments id'ni majburlaydimi. HAMMASI ROLLBACK — jonli DB tegmaydi. */
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' });
(async () => {
  const c = await pool.connect();
  try {
    const fkBefore = (await c.query(`SELECT confrelid::regclass::text AS ref FROM pg_constraint WHERE conname='employee_cards_card_id_fkey'`)).rows[0];
    console.log('OLDIN: employee_cards.card_id FK ->', fkBefore ? fkBefore.ref : '(yo\'q)');
    const odId = (await c.query(`SELECT id FROM org_departments WHERE node_type='position' AND is_active ORDER BY id LIMIT 1`)).rows[0].id;
    const empId = (await c.query(`SELECT id FROM employees ORDER BY id LIMIT 1`)).rows[0].id;

    await c.query('BEGIN');
    // A: test-bindinglarni tozala (0 dan)
    const delCf = (await c.query(`DELETE FROM card_folders RETURNING id`)).rowCount;
    const delEc = (await c.query(`DELETE FROM employee_cards RETURNING id`)).rowCount;
    console.log(`Tozalandi: card_folders=${delCf}, employee_cards=${delEc}`);
    // FK ni org_departments ga qarat
    await c.query(`ALTER TABLE employee_cards DROP CONSTRAINT IF EXISTS employee_cards_card_id_fkey`);
    await c.query(`ALTER TABLE employee_cards ADD CONSTRAINT employee_cards_card_id_fkey FOREIGN KEY (card_id) REFERENCES org_departments(id)`);
    const fkAfter = (await c.query(`SELECT confrelid::regclass::text AS ref FROM pg_constraint WHERE conname='employee_cards_card_id_fkey'`)).rows[0];
    console.log('KEYIN: employee_cards.card_id FK ->', fkAfter.ref, '(org_departments kutilgan)');
    // Yangi FK org_departments id ni qabul qiladimi (to'g'ri) + noto'g'ri id ni rad etadimi
    await c.query(`INSERT INTO employee_cards (employee_id, card_id, is_primary, is_active, assigned_at, created_at, updated_at) VALUES ($2, $1, true, true, NOW(), NOW(), NOW())`, [odId, empId]);
    console.log(`OK: org_departments id=${odId} bilan binding QABUL qilindi`);
    let rejected = false;
    try { await c.query(`SAVEPOINT s1`); await c.query(`INSERT INTO employee_cards (employee_id, card_id, is_primary, is_active, assigned_at, created_at, updated_at) VALUES ($1, 999999, true, true, NOW(), NOW(), NOW())`, [empId]); }
    catch (e) { rejected = true; await c.query(`ROLLBACK TO s1`); }
    console.log(`FK-majburlash: mavjud-emas id=999999 ${rejected ? 'RAD etildi (to\'g\'ri)' : 'QABUL qilindi (XATO!)'}`);

    await c.query('ROLLBACK');
    const fkBack = (await c.query(`SELECT confrelid::regclass::text AS ref FROM pg_constraint WHERE conname='employee_cards_card_id_fkey'`)).rows[0];
    console.log('ROLLBACK -> FK qaytdi ->', fkBack ? fkBack.ref : '(yo\'q)', '(org_functions kutilgan — jonli DB tegilmadi)');
  } catch (e) { try { await c.query('ROLLBACK'); } catch {} console.error('ERR', e.message); }
  finally { c.release(); await pool.end(); }
})();
