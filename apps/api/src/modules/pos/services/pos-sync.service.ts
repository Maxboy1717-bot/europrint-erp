import { Injectable, Logger, ConflictException } from '@nestjs/common';
import { Result, AppError, safeCall } from '@common/result';
import { PosSyncRepository } from '../repositories/pos-sync.repository';
import { PosMovementService } from './pos-movement.service';
import { CreateMovementSchema } from '../dto/movement.dto';
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
  ) {}

  async push(payload: PushPayload): Promise<Result<{ synced: number; conflicts: number }, AppError>> {
    return safeCall(async () => {
      const existing = await this.repo.findByClientUuid(payload.clientUuid);
      if (existing.ok && existing.data) {
        if (!payload.forceClientVersion) {
          throw new ConflictException(`Duplicate sync: ${payload.clientUuid}`);
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
      if (!entryR.ok) throw new Error(entryR.error.message);
      const entry = entryR.data;

      let synced = 0;
      let conflicts = 0;
      for (const mv of (Array.isArray(payload.movements) ? payload.movements : [])) {
        const parsed = CreateMovementSchema.safeParse(mv);
        if (!parsed.success) {
          conflicts++;
          this.logger.warn(`[SYNC] Invalid movement payload for clientUuid=${payload.clientUuid}: ${parsed.error.message}`);
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
          this.logger.warn(`[SYNC] Conflict for clientUuid=${payload.clientUuid}`);
        }
      }
      return { synced, conflicts };
    });
  }

  /**
   * Pull: returns server-side confirmed/completed movements since `since`.
   * Clients apply these as authoritative server changes (delta sync pattern).
   */
  async pull(req: PullRequest): Promise<Result<{ id: number; movementNumber: string; status: string; movementType: string | null; updatedAt: Date | null }[], AppError>> {
    return safeCall(async () => {
      const since = req.since ? new Date(req.since) : undefined;
      const r = await this.repo.getServerDelta(since, req.userId);
      if (!r.ok) throw new Error(r.error.message);
      return r.data ?? [];
    });
  }

  async getStatus(): Promise<Result<{ total: number; pending: number; synced: number; conflict: number }, AppError>> {
    return safeCall(async () => {
      const r = await this.repo.getSyncStatus();
      if (!r.ok) throw new Error(r.error.message);
      return r.data;
    });
  }
}
