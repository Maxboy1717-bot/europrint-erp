/**
 * @module drizzle-klishe-retention.repo
 * @description Raw-SQL repo (typedExecute) — klishe/forma ~3 yil saqlash + hisobdan chiqarish akti
 *   (vision 06-sd#14). Kanonik `ow_molds` ALTER (owner_type/retention_until/archived_at) +
 *   `ow_mold_writeoff_acts` akt jadvali. Drizzle jadval-obyekti import qilinmaydi (stale-dist
 *   rebuild'dan qochish uchun) — parametrlangan `sql` template. Result<T>; throw taqiq (Qoida 1/15).
 * @layer Infrastructure (SD)
 */

import { Injectable, Logger } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { typedExecute } from '@shared/db/typed-execute';
import { Ok, Err, AppErr, Result, safeCall } from '@common/result';
import {
  IKlisheRetentionRepo, KlisheMoldRow, KlisheWriteoffActRow, WriteOffInput,
} from '../../domain/repositories/i-klishe-retention.repo';

@Injectable()
export class DrizzleKlisheRetentionRepository implements IKlisheRetentionRepo {
  private readonly logger = new Logger(DrizzleKlisheRetentionRepository.name);

  async listDue(warnDays: number): Promise<Result<KlisheMoldRow[]>> {
    return safeCall(async () => {
      return typedExecute<KlisheMoldRow>(sql`
        SELECT id, order_id, vendor, status, owner_type,
               received_at, retention_until, archived_at
          FROM ow_molds
         WHERE archived_at IS NULL
           AND retention_until IS NOT NULL
           AND retention_until <= (CURRENT_DATE + make_interval(days => ${warnDays}))
         ORDER BY retention_until ASC
         LIMIT 500
      `);
    }, 'DB_ERROR');
  }

  async listActs(): Promise<Result<KlisheWriteoffActRow[]>> {
    return safeCall(async () => {
      return typedExecute<KlisheWriteoffActRow>(sql`
        SELECT id, mold_id, act_number, owner_type, received_at,
               retention_until, reason, status, acted_by, created_at
          FROM ow_mold_writeoff_acts
         ORDER BY created_at DESC, id DESC
         LIMIT 500
      `);
    }, 'DB_ERROR');
  }

  async backfillRetention(retentionDays: number): Promise<Result<{ updated: number }>> {
    return safeCall(async () => {
      const rows = await typedExecute<{ id: string }>(sql`
        UPDATE ow_molds
           SET retention_until = (received_at + make_interval(days => ${retentionDays}))::date
         WHERE received_at IS NOT NULL AND retention_until IS NULL AND archived_at IS NULL
         RETURNING id
      `);
      return { updated: rows.length };
    }, 'DB_ERROR');
  }

  async writeOff(moldId: string, input: WriteOffInput): Promise<Result<KlisheWriteoffActRow>> {
    try {
      const found = await typedExecute<{
        archived_at: string | null; owner_type: string; received_at: string | null; retention_until: string | null;
      }>(sql`
        SELECT archived_at, owner_type, received_at, retention_until
          FROM ow_molds WHERE id = ${moldId} LIMIT 1
      `);
      const mold = found[0];
      if (!mold) return Err(AppErr('NOT_FOUND', 'Klishe/forma topilmadi'));
      if (mold.archived_at) return Err(AppErr('CONFLICT', 'Klishe allaqachon hisobdan chiqarilgan'));

      // Guarded archive — WHERE archived_at IS NULL prevents a double write-off race.
      const archived = await typedExecute<{ id: string }>(sql`
        UPDATE ow_molds SET archived_at = now()
         WHERE id = ${moldId} AND archived_at IS NULL
         RETURNING id
      `);
      if (!archived[0]) return Err(AppErr('CONFLICT', 'Klishe allaqachon hisobdan chiqarilgan'));

      const seq = await typedExecute<{ n: string | number }>(sql`SELECT nextval('ow_mold_writeoff_acts_id_seq') AS n`);
      const n = Number(seq[0]?.n ?? 0);
      const actNumber = `KLW-${new Date().getFullYear()}-${String(n).padStart(5, '0')}`;

      const rows = await typedExecute<KlisheWriteoffActRow>(sql`
        INSERT INTO ow_mold_writeoff_acts
          (id, mold_id, act_number, owner_type, received_at, retention_until, reason, acted_by)
        VALUES (
          ${n}, ${moldId}, ${actNumber}, ${mold.owner_type},
          ${mold.received_at}, ${mold.retention_until}, ${input.reason ?? null}, ${input.actedBy}
        )
        RETURNING id, mold_id, act_number, owner_type, received_at,
                  retention_until, reason, status, acted_by, created_at
      `);
      const row = rows[0];
      if (!row) return Err(AppErr('DB_ERROR', 'Write-off akti yaratilmadi'));
      return Ok(row);
    } catch (e) {
      this.logger.error('writeOff failed', e as Error);
      return Err(AppErr('DB_ERROR', (e as Error)?.message ?? 'Write-off failed'));
    }
  }
}
