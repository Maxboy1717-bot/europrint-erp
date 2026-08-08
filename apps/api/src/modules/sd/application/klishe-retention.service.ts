/**
 * @module klishe-retention.service
 * @description Klishe/forma ~3 yil saqlash muddati + hisobdan chiqarish akti (vision 06-sd#14).
 *   Controller/cron shu yerga delegatsiya qiladi; Result<T> (Qoida 1), repo orqali (Qoida 15).
 * @layer Application Service (SD)
 */

import { Inject, Injectable } from '@nestjs/common';
import { Result } from '@common/result';
import {
  IKlisheRetentionRepo, KLISHE_RETENTION_REPO,
  KlisheMoldRow, KlisheWriteoffActRow, WriteOffInput,
} from '../domain/repositories/i-klishe-retention.repo';

/** ~3 yil = 1095 kun (vision 06-sd#14 "~3yr"); tayinlangan owner-default, DATA emas. */
export const KLISHE_RETENTION_DAYS = 1095;
/** Ogohlantirish oynasi — muddat tugashiga shuncha kun qolganda "due" ro'yxatiga tushadi. */
export const KLISHE_RETENTION_WARN_DAYS = 90;

@Injectable()
export class KlisheRetentionService {
  constructor(
    @Inject(KLISHE_RETENTION_REPO) private readonly repo: IKlisheRetentionRepo,
  ) {}

  listDue(warnDays: number = KLISHE_RETENTION_WARN_DAYS): Promise<Result<KlisheMoldRow[]>> {
    const w = Number.isFinite(warnDays) && warnDays >= 0 ? Math.floor(warnDays) : KLISHE_RETENTION_WARN_DAYS;
    return this.repo.listDue(w);
  }

  listActs(): Promise<Result<KlisheWriteoffActRow[]>> {
    return this.repo.listActs();
  }

  backfillRetention(retentionDays: number = KLISHE_RETENTION_DAYS): Promise<Result<{ updated: number }>> {
    return this.repo.backfillRetention(retentionDays);
  }

  writeOff(moldId: string, input: WriteOffInput): Promise<Result<KlisheWriteoffActRow>> {
    return this.repo.writeOff(moldId, input);
  }
}
