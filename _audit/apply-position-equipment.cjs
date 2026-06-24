const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' });
(async () => {
  const c = await pool.connect();
  try {
    await c.query(`CREATE TABLE IF NOT EXISTS position_equipment (
      id SERIAL PRIMARY KEY, org_department_id INTEGER NOT NULL, equipment_name TEXT NOT NULL,
      equipment_type VARCHAR, quantity INTEGER DEFAULT 1, is_required BOOLEAN DEFAULT true,
      auto_request BOOLEAN DEFAULT false, asset_item_id INTEGER, notes TEXT, created_at TIMESTAMP DEFAULT now())`);
    const cols = (await c.query(`SELECT string_agg(column_name, ', ' ORDER BY ordinal_position) AS c FROM information_schema.columns WHERE table_name='position_equipment'`)).rows[0].c;
    console.log('position_equipment created:', cols);
  } catch (e) { console.error('ERR', e.message); } finally { c.release(); await pool.end(); }
})();
