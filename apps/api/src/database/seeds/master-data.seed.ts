/**
 * Master Data seed runner — ARCHITECTURE.md §39.16.
 *
 * Idempotent: ON CONFLICT DO UPDATE — qayta ishga tushirish xavfsiz.
 *
 * Ishga tushirish:
 *   pnpm tsx apps/api/src/database/seeds/master-data.seed.ts
 *   YOKI
 *   pnpm --filter @europrint/api run seed:master-data
 */
import 'dotenv/config';
import { Pool, PoolClient } from 'pg';
import { DEPARTMENTS_SEED, type DepartmentSeed } from './data/departments.data';
import { POSITIONS_SEED, type PositionSeed } from './data/positions.data';
import { POSITION_PERMISSIONS_SEED, type PositionPermissionSeed } from './data/position-permissions.data';
import { FEATURE_FLAGS_SEED, type FeatureFlagSeed } from './data/position-feature-flags.data';

const log = (msg: string) => process.stdout.write(`[seed:master-data] ${msg}\n`);
const logErr = (msg: string, err: unknown) =>
  process.stderr.write(`[seed:master-data] ${msg} ${String(err)}\n`);

interface SeedStats {
  departments: { inserted: number; updated: number };
  positions: { inserted: number; updated: number };
  permissions: { inserted: number; updated: number };
  flags: { inserted: number; updated: number };
}

/**
 * Master Data Qoida 1: code UNIQUE biznes kalit (ARCHITECTURE.md §39).
 *
 * Schema da `.unique()` belgilangan, lekin drizzle-kit migration generate
 * qilganda chiqarilmagan. ON CONFLICT (code) DO UPDATE ishlash uchun zarur.
 *
 * Idempotent: agar constraint mavjud bo'lsa o'tkazib yuboradi.
 * Pre-check: duplicate'lar bo'lsa aniq xato xabar beradi (admin tozalashi kerak).
 */
async function ensureUniqueConstraints(client: PoolClient): Promise<void> {
  const tables: ReadonlyArray<{ name: string; constraintName: string }> = [
    { name: 'departments', constraintName: 'departments_code_unique' },
    { name: 'positions', constraintName: 'positions_code_unique' },
  ];

  for (const t of tables) {
    // 1. Duplicate code'larni tekshirish (UNIQUE qo'shishdan oldin xavfsizlik)
    const dupRes = await client.query<{ code: string; cnt: string }>(
      `SELECT code, COUNT(*)::text AS cnt FROM ${t.name}
        WHERE code IS NOT NULL
        GROUP BY code
       HAVING COUNT(*) > 1`,
    );
    const dupRows = Array.isArray(dupRes.rows) ? dupRes.rows : [];
    if (dupRows.length > 0) {
      const samples = dupRows.slice(0, 5).map((r) => `${r.code} (${r.cnt}x)`).join(', ');
      throw new Error(
        `${t.name}.code da ${dupRows.length} ta duplicate topildi: ${samples}` +
          `${dupRows.length > 5 ? ' va boshqa...' : ''}. ` +
          `UNIQUE constraint qo'shishdan oldin duplicate'larni qo'lda tozalang.`,
      );
    }

    // 2. Constraint mavjudligini tekshirish va yo'q bo'lsa qo'shish
    const existsRes = await client.query<{ exists: boolean }>(
      `SELECT EXISTS (
         SELECT 1 FROM information_schema.table_constraints
         WHERE table_schema = 'public'
           AND table_name = $1
           AND constraint_name = $2
       ) AS exists`,
      [t.name, t.constraintName],
    );

    if (!existsRes.rows[0]?.exists) {
      await client.query(
        `ALTER TABLE ${t.name} ADD CONSTRAINT ${t.constraintName} UNIQUE (code)`,
      );
      log(`  ✅ ${t.constraintName} qo'shildi`);
    }
  }
}

async function seedDepartments(client: PoolClient, rows: ReadonlyArray<DepartmentSeed>) {
  let inserted = 0;
  let updated = 0;
  // 1-bosqich: bog'liqliksiz INSERT (parent_id keyin set qilamiz)
  for (const d of rows) {
    const res = await client.query<{ inserted: boolean }>(
      `INSERT INTO departments
         (code, name_uz, name_ru, vysotskiy_function, level, sort_order, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, TRUE, NOW(), NOW())
       ON CONFLICT (code) DO UPDATE
         SET name_uz = EXCLUDED.name_uz,
             name_ru = EXCLUDED.name_ru,
             vysotskiy_function = EXCLUDED.vysotskiy_function,
             level = EXCLUDED.level,
             sort_order = EXCLUDED.sort_order,
             updated_at = NOW()
       RETURNING (xmax = 0) AS inserted`,
      [d.code, d.nameUz, d.nameRu, String(d.vysotskiyFunction), d.level, d.sortOrder],
    );
    if (res.rows[0]?.inserted) inserted++;
    else updated++;
  }
  // 2-bosqich: parent_id ni code asosida o'rnatish
  for (const d of rows) {
    if (!d.parentCode) continue;
    await client.query(
      `UPDATE departments
         SET parent_id = (SELECT id FROM departments WHERE code = $2)
       WHERE code = $1 AND parent_id IS DISTINCT FROM
             (SELECT id FROM departments WHERE code = $2)`,
      [d.code, d.parentCode],
    );
  }
  return { inserted, updated };
}

async function seedPositions(client: PoolClient, rows: ReadonlyArray<PositionSeed>) {
  let inserted = 0;
  let updated = 0;
  for (const p of rows) {
    const res = await client.query<{ inserted: boolean }>(
      `INSERT INTO positions
         (code, name_uz, name_ru, department_id, level, rbac_tier,
          is_management, headcount, sort_order, is_active, created_at, updated_at)
       VALUES ($1, $2, $3,
               (SELECT id FROM departments WHERE code = $4),
               $5, $6, $7, $8, $9, TRUE, NOW(), NOW())
       ON CONFLICT (code) DO UPDATE
         SET name_uz = EXCLUDED.name_uz,
             name_ru = EXCLUDED.name_ru,
             department_id = EXCLUDED.department_id,
             level = EXCLUDED.level,
             rbac_tier = EXCLUDED.rbac_tier,
             is_management = EXCLUDED.is_management,
             headcount = EXCLUDED.headcount,
             sort_order = EXCLUDED.sort_order,
             updated_at = NOW()
       RETURNING (xmax = 0) AS inserted`,
      [
        p.code, p.nameUz, p.nameRu, p.departmentCode,
        p.level, p.rbacTier, p.isManagement, p.headcount, p.sortOrder,
      ],
    );
    if (res.rows[0]?.inserted) inserted++;
    else updated++;
  }
  return { inserted, updated };
}

async function seedPermissions(
  client: PoolClient,
  rows: ReadonlyArray<PositionPermissionSeed>,
) {
  let inserted = 0;
  let updated = 0;
  for (const r of rows) {
    const res = await client.query<{ inserted: boolean }>(
      `INSERT INTO position_permissions
         (position_id, module_code, access_level, created_at)
       VALUES (
         (SELECT id FROM positions WHERE code = $1),
         $2, $3, NOW()
       )
       ON CONFLICT (position_id, module_code) DO UPDATE
         SET access_level = EXCLUDED.access_level
       RETURNING (xmax = 0) AS inserted`,
      [r.positionCode, r.moduleCode, r.accessLevel],
    );
    if (res.rows[0]?.inserted) inserted++;
    else updated++;
  }
  return { inserted, updated };
}

async function seedFeatureFlags(
  client: PoolClient,
  rows: ReadonlyArray<FeatureFlagSeed>,
) {
  let inserted = 0;
  let updated = 0;
  for (const r of rows) {
    const res = await client.query<{ inserted: boolean }>(
      `INSERT INTO position_feature_flags
         (position_id, feature_key, is_allowed, created_at)
       VALUES (
         (SELECT id FROM positions WHERE code = $1),
         $2, $3, NOW()
       )
       ON CONFLICT (position_id, feature_key) DO UPDATE
         SET is_allowed = EXCLUDED.is_allowed
       RETURNING (xmax = 0) AS inserted`,
      [r.positionCode, r.featureKey, r.isAllowed],
    );
    if (res.rows[0]?.inserted) inserted++;
    else updated++;
  }
  return { inserted, updated };
}

export async function runMasterDataSeed(): Promise<SeedStats> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL muhit o\'zgaruvchisi o\'rnatilmagan');
  const pool = new Pool({ connectionString });

  const stats: SeedStats = {
    departments: { inserted: 0, updated: 0 },
    positions: { inserted: 0, updated: 0 },
    permissions: { inserted: 0, updated: 0 },
    flags: { inserted: 0, updated: 0 },
  };

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    log("UNIQUE constraint'larni tekshirish (departments.code, positions.code)...");
    await ensureUniqueConstraints(client);

    log(`Departments (${DEPARTMENTS_SEED.length}) seedlanmoqda...`);
    stats.departments = await seedDepartments(client, DEPARTMENTS_SEED);
    log(`  ✅ inserted=${stats.departments.inserted}, updated=${stats.departments.updated}`);

    log(`Positions (${POSITIONS_SEED.length}) seedlanmoqda...`);
    stats.positions = await seedPositions(client, POSITIONS_SEED);
    log(`  ✅ inserted=${stats.positions.inserted}, updated=${stats.positions.updated}`);

    log(`Position permissions (${POSITION_PERMISSIONS_SEED.length}) seedlanmoqda...`);
    stats.permissions = await seedPermissions(client, POSITION_PERMISSIONS_SEED);
    log(`  ✅ inserted=${stats.permissions.inserted}, updated=${stats.permissions.updated}`);

    log(`Feature flags (${FEATURE_FLAGS_SEED.length}) seedlanmoqda...`);
    stats.flags = await seedFeatureFlags(client, FEATURE_FLAGS_SEED);
    log(`  ✅ inserted=${stats.flags.inserted}, updated=${stats.flags.updated}`);

    await client.query('COMMIT');
    log('✅ Master Data seed muvaffaqiyatli yakunlandi');
  } catch (err) {
    await client.query('ROLLBACK');
    logErr('❌ Master Data seed xato:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }

  return stats;
}

if (require.main === module) {
  runMasterDataSeed()
    .then((s) => {
      log(`Yakuniy: ${JSON.stringify(s)}`);
      process.exit(0);
    })
    .catch((e) => {
      logErr('FATAL:', e);
      process.exit(1);
    });
}
