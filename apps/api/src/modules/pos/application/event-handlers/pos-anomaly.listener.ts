/**
 * @module pos-anomaly.listener
 * @description POS Monitor — anomaliya aniqlash listeneri (ADDITIVE, Q-46).
 *
 *   `pos.movement.data.completed` string-topic'iga ulanadi (emitter:
 *   pos-movement-status.service.ts:89). Harakat yakunlangach qoida-asosli
 *   anomaliya tekshiruvini ishga tushiradi. Side-effect — asosiy stock/ledger
 *   yo'liga (Q-46) hech qanday ta'sir qilmaydi; xato bo'lsa faqat log.
 *
 *   `pos.movement.data.cancelled` ham tinglanadi — bekor/prostoy signali uchun.
 *
 *   Mavjud `PosEventHandler.onMovementCompleted` (pos.events.ts) bilan parallel
 *   ishlaydi; alohida fayl (Q-31 izolyatsiya), idempotent (DB unique index).
 */

import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PosAnomalyService } from '../services/pos-anomaly.service';
import type { MovementStatusChangedEvent } from '../../domain/events/pos.events.types';

@Injectable()
export class PosAnomalyListener {
  private readonly logger = new Logger(PosAnomalyListener.name);

  constructor(private readonly anomaly: PosAnomalyService) {}

  @OnEvent('pos.movement.data.completed')
  async onMovementCompleted(payload: MovementStatusChangedEvent): Promise<void> {
    await this.run(payload, 'completed');
  }

  @OnEvent('pos.movement.data.cancelled')
  async onMovementCancelled(payload: MovementStatusChangedEvent): Promise<void> {
    await this.run(payload, 'cancelled');
  }

  private async run(payload: MovementStatusChangedEvent, source: string): Promise<void> {
    const movementId = Number(payload?.movementId);
    if (!Number.isFinite(movementId) || movementId <= 0) return;
    try {
      const r = await this.anomaly.evaluateMovement(movementId);
      if (r.ok && r.data.flagged > 0) {
        this.logger.log(`[Anomaly:${source}] ${payload.movementNumber ?? movementId}: ${r.data.flagged} flag`);
      } else if (!r.ok) {
        this.logger.warn(`[Anomaly:${source}] xato (movId=${movementId}): ${r.error.message}`);
      }
    } catch (e) {
      // Q-46: anomaliya tekshiruvi hech qachon asosiy oqimni buzmaydi
      this.logger.warn(`[Anomaly:${source}] kutilmagan xato (movId=${movementId}): ${String(e)}`);
    }
  }
}
