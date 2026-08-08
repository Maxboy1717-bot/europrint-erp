/**
 * @module pos-sync.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Logger, ConflictException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { Ok, Err, Result, AppError } from '@common/result';
import { PosSyncRepository } from '../../infrastructure/repositories/pos-sync.repository';
import { PosMovementService } from './pos-movement.service';
import { CreateMovementSchema } from '../../dto/movement.dto';
import { posOfflineQueue } from '@workspace/db';

export interface PushPayload {
  clientUuid: string;
  terminalId: string;
  userId: number;
  offlineCreatedAt: string;
  movements: unknown[];
  forceClientVersion?: boolean;
}

export interface PullRequest {
  terminalId: string;
  userId: number;
  since?: string;
}

@Injectable()
export class PosSyncService {
  private readonly logger = new Logger(PosSyncService.name);

  constructor(
    private readonly repo: PosSyncRepository,
    private readonly movementService: PosMovementService,
    private readonly i18n: I18nService,
  ) {}

  async push(payload: PushPayload): Promise<Result<{ synced: number; conflicts: number }, AppError>> {
    const existing = await this.repo.findByClientUuid(payload.clientUuid);
    if (existing.ok && existing.data) {
      if (!payload.forceClientVersion) {
        // NestJS HTTP exception — allowed to stay as throw per project rules
        throw new ConflictException(await this.i18n.t('errors.duplicateSync', { args: { clientUuid: payload.clientUuid } }));
      }
      this.logger.warn(`[SYNC] forceClientVersion=true — reprocessing clientUuid=${payload.clientUuid}`);
    }

    const entryR = await this.repo.insertOfflineEntry({
      terminalId: payload.terminalId,
      userId: payload.userId,
      syncStatus: 'PENDING',
      payload: { clientUuid: payload.clientUuid, movements: payload.movements },
      offlineCreatedAt: new Date(payload.offlineCreatedAt),
    });
    if (!entryR.ok) return Err(entryR.error);
    const entry = entryR.data;

    let synced = 0;
    let conflicts = 0;
    for (const mv of (Array.isArray(payload.movements) ? payload.movements : [])) {
      const parsed = CreateMovementSchema.safeParse(mv);
      if (!parsed.success) {
        conflicts++;
        const reason = `Invalid payload: ${parsed.error.message}`;
        this.logger.warn(`[SYNC] Invalid movement payload for clientUuid=${payload.clientUuid}: ${parsed.error.message}`);
        await this.repo.markConflict(entry.id, reason).catch(() => null);
        continue;
      }
      const result = await this.movementService.createMovement(
        parsed.data,
        payload.userId,
      );
      if (result.ok) {
        await this.repo.markSynced(entry.id, result.data.id);
        synced++;
      } else {
        conflicts++;
        // G2-5 (2026-07-04, SB0558): avval hech narsa yozilmasdi — entry
        // abadiy PENDING'da qolib ketardi. Endi CONFLICT + sabab saqlanadi
        // (admin/omborchi "tekshirilsin" ro'yxatida qayta ko'rib chiqadi).
        const reason = result.error.message ?? 'Movement yaratilmadi';
        this.logger.warn(`[SYNC] Conflict for clientUuid=${payload.clientUuid}: ${reason}`);
        await this.repo.markConflict(entry.id, reason).catch(() => null);
      }
    }
    return Ok({ synced, conflicts });
  }

  /**
   * Pull: returns server-side confirmed/completed movements since `since`.
   * Clients apply these as authoritative server changes (delta sync pattern).
   */
  async pull(req: PullRequest): Promise<Result<{ id: number; movementNumber: string; status: string; movementType: string | null; updatedAt: Date | null }[], AppError>> {
    const since = req.since ? new Date(req.since) : undefined;
    const r = await this.repo.getServerDelta(since, req.userId);
    if (!r.ok) return Err(r.error);
    return Ok(r.data ?? []);
  }

  async getStatus(): Promise<Result<{ total: number; pending: number; synced: number; conflict: number }, AppError>> {
    const r = await this.repo.getSyncStatus();
    if (!r.ok) return Err(r.error);
    return Ok(r.data);
  }
}
