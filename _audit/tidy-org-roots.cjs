/** Egasi 2026-06-24: org-daraxtni TARTIBGA SOLISH (rebuild emas). 17 osilgan ildiz → 1.
 *  Faqat parent_id ulanadi (o'chirish/merge YO'Q). Egasi(19)=ildiz, CEO(20) ostiga osilganlar ulanadi.
 *  Idempotent + qaytariladigan (eski parent_id'lar logga yoziladi). */
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' });
(async () => {
  const c = await pool.connect();
  try {
    const ROOT = 19;   // Egasi (owner "Ma'muriyat")
    const CEO  = 20;    // Bosh Direktor ofisi (ceo), parent=19
    // sanity: CEO 19 ostida ekanini tasdiqla
    const ceo = (await c.query(`SELECT id, parent_id, node_type FROM org_departments WHERE id=$1`, [CEO])).rows[0];
    if (!ceo || ceo.parent_id !== ROOT) { console.log('ABORT: CEO topology kutilgandek emas:', JSON.stringify(ceo)); await pool.end(); return; }

    const orphans = (await c.query(
      `SELECT id, name, node_type FROM org_departments WHERE is_active=true AND parent_id IS NULL AND id <> $1 ORDER BY id`, [ROOT])).rows;
    console.log('OSILGAN ILDIZLAR (ulanadi → CEO 20):', orphans.length);
    orphans.forEach(o => console.log('  ', o.id, o.name, `(${o.node_type})`));

    await c.query(`UPDATE org_departments SET parent_id=$1, updated_at=now() WHERE is_active=true AND parent_id IS NULL AND id <> $2`, [CEO, ROOT]);

    const roots = (await c.query(`SELECT COUNT(*)::int AS n FROM org_departments WHERE is_active=true AND parent_id IS NULL`)).rows[0].n;
    const rootRow = (await c.query(`SELECT id, name, node_type FROM org_departments WHERE is_active=true AND parent_id IS NULL`)).rows;
    console.log('NATIJA: ildizlar =', roots, '→', JSON.stringify(rootRow));
  } catch (e) { console.error('ERR', e.message); }
  finally { c.release(); await pool.end(); }
})();
