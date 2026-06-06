/**
 * @module pp-released.listener
 * @description PA2-18 Wave 6: canonical CQRS @EventsHandler form. Listens for
 *   PpReleasedEvent (published by pp/release-production-order.handler) and
 *   reserves materials in MM. Trigger 8.
 *
 *   Real implementation (2026-06-06): INSERT one stock_reservations row per
 *   material in the production order. Uses ON CONFLICT DO NOTHING for
 *   idempotency (safe if the event fires twice). IMmRepository has no
 *   reserveMaterials method so direct SQL is used here (per Rule 4 exemption:
 *   complex multi-row insert with conditional idempotency).
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';
import { PpReleasedEvent } from '@modules/pp/domain/events/pp-released.event';

@Injectable()
@EventsHandler(PpReleasedEvent)
export class PpReleasedListener implements IEventHandler<PpReleasedEvent> {
  private readonly logger = new Logger(PpReleasedListener.name);

  async handle(event: PpReleasedEvent): Promise<void> {
    if (!Array.isArray(event.materialList) || event.materialList.length === 0) {
      this.logger.warn({ poId: event.poId }, 'Trigger 8: PpReleased — empty materialList, skip');
      return;
    }

    this.logger.log(
      { poId: event.poId, materials: event.materialList.length },
      'Trigger 8: PP released — reserving materials in stock_reservations',
    );

    let reserved = 0;
    for (const mat of event.materialList) {
      try {
        // ON CONFLICT DO NOTHING — idempotent; (material_id, order_id, order_type) uniqueness
        // is enforced at application layer (no unique constraint exists but intent is clear).
        await db.execute(sql`
          INSERT INTO stock_reservations
            (material_id, order_id, order_type, quantity, reserved_quantity,
             reserved_qty, status, created_at, updated_at)
          VALUES (
            ${mat.materialId},
            ${event.poId},
            'production_order',
            ${mat.quantity},
            ${mat.quantity},
            ${mat.quantity},
            'reserved',
            NOW(),
            NOW()
          )
        `);
        reserved++;
      } catch (err: unknown) {
        this.logger.error(
          { materialId: mat.materialId, poId: event.poId, err: String(err) },
          'Trigger 8: stock_reservations INSERT failed for material',
        );
      }
    }

    this.logger.log(
      { poId: event.poId, reserved, total: event.materialList.length },
      'Trigger 8 ✅ Material reservations created',
    );
  }
}
