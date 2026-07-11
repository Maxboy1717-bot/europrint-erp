/**
 * @module i-klishe-retention.repo
 * @description Repository port — klishe/forma ~3 yil saqlash muddati + hisobdan chiqarish akti
 *   (vision 06-sd#14). Kanonik `ow_molds` jadvali ustidan; alohida `ow_mold_writeoff_acts` akt jadvali.
 */

import { Result } from '@common/result';

export interface KlisheMoldRow {
  id: string;
  order_id: number;
  vendor: string;
  status: string;
  owner_type: string;
  received_at: string | null;
  retention_until: string | null;
  archived_at: string | null;
}

export interface KlisheWriteoffActRow {
  id: number;
  mold_id: string;
  act_number: string;
  owner_type: string;
  received_at: string | null;
  retention_until: string | null;
  reason: string | null;
  status: string;
  acted_by: number | null;
  created_at: string;
}

export interface WriteOffInput {
  reason?: string | null;
  actedBy: number;
}

export const KLISHE_RETENTION_REPO = Symbol('KLISHE_RETENTION_REPO');

export interface IKlisheRetentionRepo {
  /** Molds at/near the ~3yr retention edge (not yet written off). */
  listDue(warnDays: number): Promise<Result<KlisheMoldRow[]>>;
  /** All issued write-off acts (newest first). */
  listActs(): Promise<Result<KlisheWriteoffActRow[]>>;
  /** Cron: set retention_until = received_at + retentionDays for received molds missing it. */
  backfillRetention(retentionDays: number): Promise<Result<{ updated: number }>>;
  /** Issue a write-off act for one mold: guarded-archive + act insert. */
  writeOff(moldId: string, input: WriteOffInput): Promise<Result<KlisheWriteoffActRow>>;
}
