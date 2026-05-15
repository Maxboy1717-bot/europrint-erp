/**
 * NOTE: Raw SQL retained intentionally — Drizzle ORM cannot express:
 *   Multi-predicate fuzzy board lookup using LOWER(name) LIKE '%...%' across
 *   multiple OR'd patterns combined with type='sales' and deleted_at IS NULL,
 *   plus dependent inserts into kanban_columns/kanban_cards using sub-selects
 *   on dynamically discovered board/column IDs.
 *   See ARCHITECTURE_RULES.md Rule 4: complex SQL is permitted with documentation.
 */
/**
 * order-created-kanban.handler.ts
 *
 * OrderCreatedEvent → avtomatik Kanban karta yaratish.
 *
 * Qanday ishlaydi:
 *  1. type='sales' yoki nomi 'buyurtma/order/sotuv' bo'lgan birinchi board topiladi.
 *  2. O'sha board'ning birinchi ustuniga (sort_order ASC) yangi karta qo'shiladi.
 *  3. Karta: sarlavha = buyurtma raqami, related_type = 'sales_order', related_id = orderId.
 *
 * Agar mos board/ustun topilmasa — xato log'ga yoziladi, lekin dastur ishini davom ettiradi.
 */
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { OrderCreatedEvent } from '../../../sd/domain/events/order-created.event';

@Injectable()
@EventsHandler(OrderCreatedEvent)
export class OrderCreatedKanbanHandler implements IEventHandler<OrderCreatedEvent> {
  private readonly logger = new Logger(OrderCreatedKanbanHandler.name);

  async handle(event: OrderCreatedEvent): Promise<void> {
    try {
      // 1. Savdo/Buyurtmalar board'ini qidirish (type='sales' yoki nomi mos)
      const boardRows = await runQuery<{ id: number }>(sql`
        SELECT id FROM kanban_boards
        WHERE deleted_at IS NULL
          AND (
            type = 'sales'
            OR LOWER(name) LIKE '%buyurtma%'
            OR LOWER(name) LIKE '%order%'
            OR LOWER(name) LIKE '%sotuv%'
          )
        ORDER BY created_at ASC
        LIMIT 1
      `);

      const boardId = boardRows.rows[0]?.id;
      if (!boardId) {
        this.logger.warn(
          `OrderCreatedKanbanHandler: Savdo board'i topilmadi. ` +
          `Yangi board yaratish uchun type='sales' qilib board oching. ` +
          `orderId=${event.orderId}`,
        );
        return;
      }

      // 2. Birinchi ustunni olish (kiruvchi/inbox)
      const colRows = await runQuery<{ id: number }>(sql`
        SELECT id FROM kanban_columns
        WHERE board_id = ${boardId} AND deleted_at IS NULL
        ORDER BY sort_order ASC
        LIMIT 1
      `);

      const columnId = colRows.rows[0]?.id;
      if (!columnId) {
        this.logger.warn(
          `OrderCreatedKanbanHandler: Board ${boardId} da ustun topilmadi. orderId=${event.orderId}`,
        );
        return;
      }

      // 3. Karta yaratish
      const cardTitle = `📦 ${event.orderNumber}`;
      const description =
        `Buyurtma summasi: ${event.totalAmount.toLocaleString('uz-UZ')} so'm\n` +
        `Kompaniya ID: ${event.companyId}`;

      await runQuery(sql`
        INSERT INTO kanban_cards
          (board_id, column_id, title, description, priority, related_type, related_id, sort_order)
        VALUES
          (${boardId}, ${columnId}, ${cardTitle}, ${description}, 'normal', 'sales_order', ${event.orderId}, 0)
      `);

      this.logger.log(
        `OrderCreatedKanbanHandler: Karta yaratildi — ` +
        `orderId=${event.orderId}, boardId=${boardId}, columnId=${columnId}`,
      );
    } catch (err) {
      // Kanban xatosi buyurtma yaratishni to'xtatmasligi kerak
      this.logger.error(
        `OrderCreatedKanbanHandler: Xato — ${(err as Error).message}`,
        (err as Error).stack,
      );
    }
  }
}
