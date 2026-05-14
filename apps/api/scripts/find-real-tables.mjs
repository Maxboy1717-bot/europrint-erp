/**
 * pos_movements va pos_movement_lines aslida qaerga ishora qiladi?
 * View bo'lsa — view ta'rifini ko'rsatadi.
 * Table bo'lsa — table ekanligini tasdiqlaydi.
 */
import pg from 'pg';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '..', '.env') });
dotenv.config({ path: resolve(__dirname, '..', '..', '..', '.env') });

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  try {
    const objects = ['pos_movements', 'pos_movement_lines', 'pos_movement_types', 'warehouses', 'material_cards'];

    for (const obj of objects) {
      console.log(`\n═══ ${obj} ═══`);

      const typeRes = await client.query(`
        SELECT table_type
          FROM information_schema.tables
         WHERE table_name = $1
      `, [obj]);

      if (typeRes.rows.length === 0) {
        console.log(`   ❌ ${obj} mavjud emas`);
        continue;
      }

      const tt = typeRes.rows[0].table_type;
      console.log(`   Turi: ${tt}`);

      if (tt === 'VIEW') {
        const viewDef = await client.query(`
          SELECT pg_get_viewdef($1::regclass, true) AS def
        `, [obj]);
        console.log(`   📜 VIEW ta'rifi:`);
        console.log(viewDef.rows[0].def.split('\n').map(l => '      ' + l).join('\n'));
      }
    }

    // Mavjud barcha pos_* va movement* jadvallar/viewlar
    console.log('\n\n═══ Barcha tegishli relation lar ═══');
    const allRes = await client.query(`
      SELECT c.relname AS name,
             CASE c.relkind
               WHEN 'r' THEN 'TABLE'
               WHEN 'v' THEN 'VIEW'
               WHEN 'm' THEN 'MATVIEW'
               WHEN 'p' THEN 'PART_TABLE'
               ELSE c.relkind::text
             END AS kind
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
       WHERE n.nspname = 'public'
         AND (c.relname LIKE '%movement%' OR c.relname LIKE '%pos_%')
       ORDER BY c.relname
    `);
    for (const r of allRes.rows) {
      console.log(`   [${r.kind.padEnd(10)}] ${r.name}`);
    }
  } catch (err) {
    console.error('❌ Xato:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
