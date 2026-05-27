/**
 * order-cancelled-kanban.handler.ts
 *
 * Buyurtma bekor qilinganda bog'liq kanban kartalarni "bekor" ustuniga
 * ko'chiradi yoki soft-delete qiladi.
 *
 * Endi raw SQL handler ichida emas — barcha DB ishlari
 * KanbanBoardsRepository.moveOrderCardToCancelled() ichida (transaction
 * ichida). Bu handler faqat eventni repo'ga uzatadi.
 */
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { OrderCancelledEvent } from '../../../sd/domain/events/order-cancelled.event';
import {
  IKanbanBoardsRepo,
  KANBAN_BOARDS_REPO,
} from '../../domain/repositories/i-kanban-boards.repo';

export { OrderCancelledEvent };

@Injectable()
@EventsHandler(OrderCancelledEvent)
export class OrderCancelledKanbanHandler implements IEventHandler<OrderCancelledEvent> {
  private readonly logger = new Logger(OrderCancelledKanbanHandler.name);

  constructor(
    @Inject(KANBAN_BOARDS_REPO) private readonly kanbanBoardsRepo: IKanbanBoardsRepo,
  ) {}

  async handle(event: OrderCancelledEvent): Promise<void> {
    const result = await this.kanbanBoardsRepo.moveOrderCardToCancelled(
      event.orderId,
      event.orderNumber,
    );

    if (!result.ok) {
      this.logger.error(
        `OrderCancelledKanbanHandler: orderId=${event.orderId} — ${result.error.message}`,
      );
    }
  }
}
