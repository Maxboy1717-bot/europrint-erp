/**
 * @module backup-database.cron
 * @description Scheduled DB backup via pg_dump. Runs daily at 03:00.
 *
 * Env vars:
 *   DATABASE_URL          — connection string (required)
 *   BACKUP_DIR            — local dir for dumps (default: /var/backups/europrint)
 *   BACKUP_RETENTION_DAYS — older dumps deleted (default: 30)
 *   PG_DUMP_PATH          — pg_dump executable (default: 'pg_dump' from PATH)
 *
 * Requires pg_dump to be installed on the host (apt: postgresql-client-15).
 * Outputs gzipped SQL dump: `${BACKUP_DIR}/europrint-YYYY-MM-DD-HHmmss.sql.gz`
 *
 * Production hardening (not yet implemented; add as ops needs grow):
 *   - Upload to S3/GCS with server-side encryption
 *   - Integrity verification via pg_restore --list
 *   - Pager/Telegram notification on failure
 *   - Differential backups every 6h between full daily dumps
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { spawn } from 'node:child_process';
import { mkdir, readdir, stat, unlink } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { createGzip } from 'node:zlib';
import { join } from 'node:path';
import { pipeline } from 'node:stream/promises';

const DEFAULT_BACKUP_DIR = '/var/backups/europrint';
const DEFAULT_RETENTION_DAYS = 30;
const SECONDS_PER_DAY = 86_400;
const MS_PER_SECOND = 1_000;

@Injectable()
export class BackupDatabaseCron {
  private readonly logger = new Logger(BackupDatabaseCron.name);

  /** Daily at 03:00 server time. */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async run(): Promise<void> {
    const startedAt = Date.now();
    const dbUrl = process.env['NEON_DATABASE_URL'] || process.env['DATABASE_URL'];
    if (!dbUrl) {
      this.logger.error('Backup skipped — DATABASE_URL not set');
      return;
    }

    const backupDir = process.env['BACKUP_DIR'] || DEFAULT_BACKUP_DIR;
    const retentionDays = Number(process.env['BACKUP_RETENTION_DAYS'] || DEFAULT_RETENTION_DAYS);
    const pgDumpPath = process.env['PG_DUMP_PATH'] || 'pg_dump';

    try {
      await mkdir(backupDir, { recursive: true });

      const ts = new Date().toISOString().replace(/[T:]/g, '-').replace(/\..+$/, '');
      const outFile = join(backupDir, `europrint-${ts}.sql.gz`);

      await this.dumpAndCompress(pgDumpPath, dbUrl, outFile);
      const fileStat = await stat(outFile);
      const elapsedMs = Date.now() - startedAt;

      this.logger.log(
        `✅ Backup ${outFile} (${(fileStat.size / 1024 / 1024).toFixed(2)} MB, ${elapsedMs} ms)`,
      );

      const deleted = await this.deleteOldBackups(backupDir, retentionDays);
      if (deleted > 0) this.logger.log(`Pruned ${deleted} old backup(s) > ${retentionDays} days`);
    } catch (err) {
      this.logger.error(`❌ Backup failed: ${String(err)}`);
      // In production: emit metric / page on-call here.
    }
  }

  private dumpAndCompress(pgDump: string, dbUrl: string, outFile: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // -Fp = plain SQL (gzip ourselves for portability)
      // --no-owner, --no-privileges = portable restore across role names
      const proc = spawn(pgDump, ['-Fp', '--no-owner', '--no-privileges', dbUrl], {
        env: { ...process.env, PGSSLMODE: process.env['PGSSLMODE'] || 'prefer' },
      });

      let stderr = '';
      proc.stderr.on('data', (chunk: Buffer) => (stderr += chunk.toString()));

      const gz = createGzip({ level: 6 });
      const fileStream = createWriteStream(outFile);

      pipeline(proc.stdout, gz, fileStream)
        .then(() => {
          if (stderr.trim() && !/^WARNING:/m.test(stderr)) {
            reject(new Error(`pg_dump stderr: ${stderr.trim()}`));
            return;
          }
          resolve();
        })
        .catch(reject);

      proc.on('error', reject);
      proc.on('exit', (code) => {
        if (code !== 0) reject(new Error(`pg_dump exited with code ${code}: ${stderr.trim()}`));
      });
    });
  }

  private async deleteOldBackups(dir: string, retentionDays: number): Promise<number> {
    const cutoffMs = Date.now() - retentionDays * SECONDS_PER_DAY * MS_PER_SECOND;
    let deleted = 0;
    try {
      const entries = await readdir(dir);
      const candidates = entries.filter((f) => f.startsWith('europrint-') && f.endsWith('.sql.gz'));
      for (const f of candidates) {
        const full = join(dir, f);
        const s = await stat(full);
        if (s.mtimeMs < cutoffMs) {
          await unlink(full);
          deleted += 1;
        }
      }
    } catch (e) {
      this.logger.warn(`Retention sweep error: ${String(e)}`);
    }
    return deleted;
  }
}
