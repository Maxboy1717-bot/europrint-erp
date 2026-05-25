/**
 * order-created-kanban.handler.ts
 *
 * OrderCreatedEvent → avtomatik Kanban karta yaratish.
 *
 * Logikasi (board/column lookup + card insert, transaction ichida) endi
 * KanbanBoardsRepository.createKanbanForOrder() ichida joylashgan — bu handler
 * faqat eventni repo'ga uzatadi va xatolarni log qiladi. CQRS IEventHandler
 * shartnomasi `void` qaytaradi, shuning uchun Result xato bo'lsa ham
 * throw qilinmaydi.
 */
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { OrderCreatedEvent } from '../../../sd/domain/events/order-created.event';
import {
  IKanbanBoardsRepo,
  KANBAN_BOARDS_REPO,
} from '../../domain/repositories/i-kanban-boards.repo';

@Injectable()
@EventsHandler(OrderCreatedEvent)
export class OrderCreatedKanbanHandler implements IEventHandler<OrderCreatedEvent> {
  private readonly logger = new Logger(OrderCreatedKanbanHandler.name);

  constructor(
    @Inject(KANBAN_BOARDS_REPO) private readonly kanbanBoardsRepo: IKanbanBoardsRepo,
  ) {}

  async handle(event: OrderCreatedEvent): Promise<void> {
    const result = await this.kanbanBoardsRepo.createKanbanForOrder({
      orderId:     event.orderId,
      orderNumber: event.orderNumber,
      totalAmount: event.totalAmount,
      companyId:   event.companyId,
    });

    if (!result.ok) {
      // Kanban xatosi buyurtma yaratishni to'xtatmasligi kerak — faqat log.
      this.logger.error(
        `OrderCreatedKanbanHandler: orderId=${event.orderId} — ${result.error.message}`,
      );
    }
  }
}
