/**
 * POS Monitor uchun standart rol-ruxsatlar seed.
 *
 * 8 ta rol va ularning ruxsatlari:
 *   1. super_admin    — hamma narsa
 *   2. director       — barcha ko'rish, strategik hisobotlar
 *   3. warehouse_manager — ombor boshqaruvi
 *   4. warehouse_keeper  — ombor xodimi (chiqim, kirim)
 *   5. qc_inspector   — QC qarorlari
 *   6. department_manager — bo'lim menejer (so'rovlar)
 *   7. department_employee — bo'lim xodim (mening invertarim)
 *   8. finance        — GL posting, moliyaviy hisobotlar
 */
import pg from 'pg';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '..', '.env') });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();

// module_code → access_level (NONE/READ/READ_PLUS/WRITE/FULL)
const ROLE_PERMS = {
  super_admin: {
    'pos.movements':      'FULL',
    'pos.qc':             'FULL',
    'pos.reports':        'FULL',
    'pos.inventory':      'FULL',
    'pos.warehouses':     'FULL',
    'pos.employees':      'FULL',
    'pos.gl':             'FULL',
  },
  director: {
    'pos.movements':      'READ_PLUS',
    'pos.qc':             'READ_PLUS',
    'pos.reports':        'FULL',
    'pos.inventory':      'READ_PLUS',
    'pos.warehouses':     'READ_PLUS',
    'pos.employees':      'READ',
    'pos.gl':             'READ_PLUS',
  },
  warehouse_manager: {
    'pos.movements':      'WRITE',
    'pos.qc':             'READ',
    'pos.reports':        'READ_PLUS',
    'pos.inventory':      'WRITE',
    'pos.warehouses':     'WRITE',
    'pos.employees':      'WRITE',
    'pos.gl':             'READ',
  },
  warehouse_keeper: {
    'pos.movements':      'WRITE',
    'pos.qc':             'READ',
    'pos.reports':        'READ',
    'pos.inventory':      'READ_PLUS',
    'pos.warehouses':     'READ',
    'pos.employees':      'NONE',
    'pos.gl':             'NONE',
  },
  qc_inspector: {
    'pos.movements':      'READ_PLUS',
    'pos.qc':             'FULL',
    'pos.reports':        'READ',
    'pos.inventory':      'READ',
    'pos.warehouses':     'READ',
    'pos.employees':      'NONE',
    'pos.gl':             'NONE',
  },
  department_manager: {
    'pos.movements':      'READ_PLUS',
    'pos.qc':             'READ',
    'pos.reports':        'READ',
    'pos.inventory':      'READ_PLUS',
    'pos.warehouses':     'READ',
    'pos.employees':      'READ',
    'pos.gl':             'NONE',
  },
  department_employee: {
    'pos.movements':      'READ',
    'pos.qc':             'READ',
    'pos.reports':        'NONE',
    'pos.inventory':      'READ',
    'pos.warehouses':     'READ',
    'pos.employees':      'NONE',
    'pos.gl':             'NONE',
  },
  finance: {
    'pos.movements':      'READ_PLUS',
    'pos.qc':             'READ',
    'pos.reports':        'FULL',
    'pos.inventory':      'READ_PLUS',
    'pos.warehouses':     'READ',
    'pos.employees':      'READ',
    'pos.gl':             'FULL',
  },
};

try {
  console.log('═══════════════════════════════════════════════════');
  console.log('🔐 POS Monitor rol-ruxsatlar seed');
  console.log('═══════════════════════════════════════════════════\n');

  // Position permissions table tekshirish
  const tblR = await client.query(`
    SELECT 1 FROM information_schema.tables WHERE table_name = 'position_permissions'
  `);
  if (tblR.rows.length === 0) {
    console.log('⚠️  position_permissions jadval yo\'q — yaratiladi...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS position_permissions (
        id          SERIAL PRIMARY KEY,
        position_id INTEGER,
        role        VARCHAR(50),
        module_code VARCHAR(100) NOT NULL,
        access_level VARCHAR(20) NOT NULL DEFAULT 'NONE',
        created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE (role, module_code)
      )
    `);
    console.log('✅ position_permissions jadval yaratildi');
  }

  let totalAdded = 0;
  let totalUpdated = 0;

  for (const [role, perms] of Object.entries(ROLE_PERMS)) {
    console.log(`\n📌 ${role}:`);
    for (const [moduleCode, accessLevel] of Object.entries(perms)) {
      // Check exists
      const existsR = await client.query(
        `SELECT id FROM position_permissions WHERE role = $1 AND module_code = $2`,
        [role, moduleCode]
      );
      if (existsR.rows.length > 0) {
        await client.query(
          `UPDATE position_permissions SET access_level = $1, updated_at = NOW() WHERE role = $2 AND module_code = $3`,
          [accessLevel, role, moduleCode]
        );
        totalUpdated++;
      } else {
        await client.query(
          `INSERT INTO position_permissions (role, module_code, access_level) VALUES ($1, $2, $3)`,
          [role, moduleCode, accessLevel]
        );
        totalAdded++;
      }
      console.log(`   ${moduleCode.padEnd(20)} → ${accessLevel}`);
    }
  }

  console.log('\n═══════════════════════════════════════════════════');
  console.log(`📈 Natija: ${totalAdded} ta qo'shildi, ${totalUpdated} ta yangilandi`);
  console.log('═══════════════════════════════════════════════════');
} catch (err) {
  console.error('❌ Xato:', err.message);
  process.exit(1);
} finally {
  client.release();
  await pool.end();
}
