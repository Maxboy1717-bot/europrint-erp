'use strict';
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg')); // allow-secret
const p = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' }); // allow-secret
async function run() {
  const tables = ['micro_modules', 'learning_progress', 'course_progress', 'lms_course_enrollments', 'certificates'];
  for (const t of tables) {
    const r = await p.query(`SELECT COUNT(*)::int AS n FROM information_schema.tables WHERE table_name=$1 AND table_schema='public'`, [t]);
    if (r.rows[0].n) {
      const c = await p.query(`SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name=$1 AND table_schema='public' ORDER BY ordinal_position LIMIT 10`, [t]);
      console.log(t + ': ' + c.rows.map(x => x.column_name + '(' + (x.is_nullable==='NO'?'NN':'') + ')').join(', '));
    } else {
      console.log(t + ': NOT FOUND');
    }
  }
  p.end();
}
run().catch(e => { console.error('FAIL', e.message); p.end(); process.exit(1); });
