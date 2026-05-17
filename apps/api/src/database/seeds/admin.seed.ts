/**
 * @module admin.seed
 * @description Database seeder. Runs idempotent fixture inserts.
 */

import 'dotenv/config';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
// SECURITY: PA-S5 — share the bcrypt cost factor with the runtime hasher
// (`apps/api/src/modules/auth/infrastructure/security/bcrypt-password-hasher.ts`).
import { BCRYPT_ROUNDS } from '../../common/constants/security.constants';

const ADMIN_USERNAME = 'admin';
// SECURITY: PA-S1 — no fallback default password. Hard-fail if env is missing.
const RAW_ADMIN_PASSWORD = process.env.ADMIN_SEED_PASSWORD;
if (!RAW_ADMIN_PASSWORD) {
  throw new Error('ADMIN_SEED_PASSWORD env required — set it in .env before seeding');
}
const ADMIN_PASSWORD: string = RAW_ADMIN_PASSWORD;
const ADMIN_ROLE = 'super_admin';
const ADMIN_EMAIL = 'admin@europrint.uz';

const log   = (msg: string) => process.stdout.write(msg + '\n');
const logErr = (msg: string, err: unknown) => process.stderr.write(`${msg} ${String(err)}\n`);

async function seed(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL muhit o\'zgaruvchisi o\'rnatilmagan');
  }
  const pool = new Pool({ connectionString });

  try {
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, BCRYPT_ROUNDS);

    const existing = await pool.query<{ id: number }>(
      'SELECT id FROM users WHERE username = $1 LIMIT 1',
      [ADMIN_USERNAME],
    );

    if ((existing.rowCount ?? 0) > 0) {
      await pool.query(
        `UPDATE users
         SET password_hash          = $1,
             role                   = $2,
             is_active              = TRUE,
             failed_login_attempts  = 0,
             locked_until           = NULL,
             updated_at             = NOW()
         WHERE username = $3`,
        [passwordHash, ADMIN_ROLE, ADMIN_USERNAME],
      );
      log(`Admin foydalanuvchi yangilandi (id=${existing.rows[0].id}): parol va qulfsizlik tiklandi.`);
      return;
    }

    await pool.query(
      `INSERT INTO users
         (username, email, password_hash, role, status, is_active,
          first_name, last_name, failed_login_attempts, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'active', TRUE, $5, $6, 0, NOW(), NOW())`,
      [ADMIN_USERNAME, ADMIN_EMAIL, passwordHash, ADMIN_ROLE, 'Admin', 'User'],
    );

    log(`Admin foydalanuvchi yaratildi: login="${ADMIN_USERNAME}", rol="${ADMIN_ROLE}".`);
  } finally {
    await pool.end();
  }
}

seed().catch((err: unknown) => {
  logErr('Seeder xatosi:', err);
  process.exit(1);
});
