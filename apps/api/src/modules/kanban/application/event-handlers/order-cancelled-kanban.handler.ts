/**
 * NOTE: Raw SQL retained intentionally — Drizzle ORM cannot express:
 *   the "bekor" column lookup uses an INNER JOIN from kanban_columns back to
 *   kanban_cards (board_id ↔ board_id) with LOWER(c.name) LIKE '%bekor%' OR
 *   '%cancel%' fuzzy match, and the subsequent UPDATE appends to description
 *   via `description = COALESCE(description,'') || E'\n[Bekor qilindi: ...]'`
 *   string-concat with E'...' escape literal — neither is reachable through
 *   Drizzle column expressions.
 *   See ARCHITECTURE_RULES.md Rule 4: complex SQL is permitted with documentation.
 */

/**
 * order-cancelled-kanban.handler.ts
 *
 * Buyurtma bekor qilinganda bog'liq kanban kartalarni
 * "bekor" ustuniga ko'chiradi yoki soft-delete qiladi.
 */
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';

export class OrderCancelledEvent {
  readonly aggregateName = 'SalesOrder';
  readonly eventName     = 'OrderCancelled';
  constructor(
    public readonly orderId:     number,
    public readonly orderNumber: string,
  ) {}
}

@Injectable()
@EventsHandler(OrderCancelledEvent)
export class OrderCancelledKanbanHandler implements IEventHandler<OrderCancelledEvent> {
  private readonly logger = new Logger(OrderCancelledKanbanHandler.name);

  async handle(event: OrderCancelledEvent): Promise<void> {
    try {
      // "Bekor" ustunini qidirish — kartaning board'i bilan bir xil board'da
      const cancelColRows = await runQuery<{ id: number }>(sql`
        SELECT c.id FROM kanban_columns c
        INNER JOIN kanban_cards kc
          ON kc.board_id = c.board_id
          AND kc.related_type = 'sales_order'
          AND kc.related_id::text = ${String(event.orderId)}
          AND kc.deleted_at IS NULL
        WHERE c.deleted_at IS NULL
          AND (LOWER(c.name) LIKE '%bekor%' OR LOWER(c.name) LIKE '%cancel%')
        ORDER BY c.created_at ASC
        LIMIT 1
      `);

      const cancelColId = cancelColRows.rows[0]?.id;

      if (cancelColId) {
        // Bekor ustuni topildi — kartani u yerga ko'chirish
        await runQuery(sql`
          UPDATE kanban_cards
          SET column_id   = ${cancelColId},
              description = COALESCE(description, '') ||
                            E'\n[Bekor qilindi: ' || ${event.orderNumber} || ']',
              updated_at  = NOW()
          WHERE related_type   = 'sales_order'
            AND related_id::text = ${String(event.orderId)}
            AND deleted_at IS NULL
        `);
      } else {
        // Bekor ustun topilmasa — soft delete
        await runQuery(sql`
          UPDATE kanban_cards
          SET deleted_at = NOW(), updated_at = NOW()
          WHERE related_type   = 'sales_order'
            AND related_id::text = ${String(event.orderId)}
            AND deleted_at IS NULL
        `);
      }

      this.logger.log(
        `OrderCancelledKanbanHandler: orderId=${event.orderId} kartalar yangilandi ` +
        `(cancelColId=${cancelColId ?? 'soft-deleted'})`,
      );
    } catch (err) {
      this.logger.error(`OrderCancelledKanbanHandler: ${(err as Error).message}`);
    }
  }
}
