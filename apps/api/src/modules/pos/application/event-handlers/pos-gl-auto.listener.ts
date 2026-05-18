/**
 * @module pos-gl-auto.listener
 * @description Wave 4 round-4 (PA2-18): canonical CQRS
 *   `@EventsHandler(PosMovementCompletedEvent)` form. Extracted from
 *   `pos-gl-auto.service.ts` so the GL auto-post side-effect subscribes
 *   directly to the typed event class rather than the legacy
 *   `pos.movement.data.completed` string topic.
 *
 *   EventBridge keeps re-emitting to the legacy string topic for any
 *   non-migrated consumers (e.g. `pos.events.ts:166` — 10-decorator file
 *   left untouched in this round) — see EVENT_NAME_MAP entry in
 *   event-bridge.service.ts.
 *
 *   POS — GL Auto-Posting: harakat turiga qarab GL yozuvlarini avtomatik
 *   hisoblaydi, so'ng gl_posting_log ga yozadi. Finance qo'lda tasdiqlashi
 *   kerak (status = AWAITING_REVIEW).
 *
 *   No production code currently publishes `pos.movement.data.completed` on
 *   either bus (no emit site exists today); the listener was therefore
 *   already a dead-letter prior to migration — same state as the legacy
 *   @OnEvent listener was previously in.
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { db, eq } from '@workspace/db';
import { posMovementLines, posMovements } from '@workspace/db';

import { GlPostingLogRepository } from '../../infrastructure/repositories/gl-posting-log.repository';
import { PosMovementCompletedEvent } from '../../domain/events/pos-movement-completed.event';
import { GL_PAIRS } from '../services/pos-gl-auto.service';

@Injectable()
@EventsHandler(PosMovementCompletedEvent)
export class PosGlAutoListener implements IEventHandler<PosMovementCompletedEvent> {
  private readonly logger = new Logger(PosGlAutoListener.name);

  constructor(
    private readonly glRepo:       GlPostingLogRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async handle(event: PosMovementCompletedEvent): Promise<void> {
    const { movementId, movementNumber } = event.props;
    this.logger.log(`[GL-AUTO] Harakat yakunlandi: id=${movementId} number=${movementNumber} — GL avtomatik hisoblanadi`);

    try {
      // 1. Harakat ma'lumotlarini olish
      const [movement] = await db
        .select({ movementType: posMovements.movementType })
        .from(posMovements)
        .where(eq(posMovements.id, movementId));

      if (!movement) {
        this.logger.warn(`[GL-AUTO] Harakat topilmadi: id=${movementId}`);
        return;
      }

      const movType = movement.movementType as string;

      // 2. Harakat qatorlarini olish va umumiy qiymatni hisoblash
      const lines = await db
        .select({
          quantity:  posMovementLines.quantity,
          unitPrice: posMovementLines.unitPrice,
        })
        .from(posMovementLines)
        .where(eq(posMovementLines.movementId, movementId));

      const totalValue = lines.reduce((sum, line) => {
        const qty   = Number(line.quantity  ?? 0);
        const price = Number(line.unitPrice ?? 0);
        return sum + qty * price;
      }, 0);

      // 3. Hisob juftliklarini tanlash
      const pairFn = GL_PAIRS[movType];
      if (!pairFn) {
        this.logger.warn(`[GL-AUTO] "${movType}" turi uchun GL juftligi topilmadi`);
        return;
      }

      const glEntries = pairFn(totalValue, movType);

      // 4. gl_posting_log ga yozish
      const result = await this.glRepo.insertLog({
        movementId,
        stage:       5,
        stageName:   'POST',
        status:      'AWAITING_REVIEW',
        glEntries,
        aiConfidence: null,
        processedAt: new Date(),
      });

      if (!result.ok) {
        this.logger.error(`[GL-AUTO] GL yozishda xato (movementId=${movementId}): ${result.error}`);
        return;
      }

      this.logger.log(
        `[GL-AUTO] GL yozildi: movementId=${movementId} type=${movType} ` +
        `total=${totalValue.toFixed(2)} entries=${glEntries.length} logId=${result.data.id}`,
      );

      // 5. Muvaffaqiyatli event emit qilish
      this.eventEmitter.emit('pos.gl.auto_posted', {
        movementId,
        movementNumber,
        movementType: movType,
        totalValue,
        glLogId: result.data.id,
      });

    } catch (err: unknown) {
      // Async, non-blocking — xatoni log qilamiz lekin throw qilmaymiz
      this.logger.error(
        `[GL-AUTO] Kutilmagan xato (movementId=${movementId}): ${(err as Error).message}`,
        (err as Error).stack,
      );
    }
  }
}
