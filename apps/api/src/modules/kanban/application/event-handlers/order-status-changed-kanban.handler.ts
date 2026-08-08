/**
 * order-status-changed-kanban.handler.ts
 *
 * Oltin-zanjir sinxronizatsiyasi (§15 #127 / vizyon #22): SD har bir buyurtma
 * holati o'zgarishida `OrderStatusChangedEvent` chiqaradi. Kanban ilgari faqat
 * OrderCreated + OrderCancelled ni tinglagan — shu sabab buyurtma uchun karta
 * yaratilgach, buyurtma holati o'zgarsa karta "jimgina" eskirar edi (Q-40/Q-43).
 * Bu handler logistics/pp/sd allaqachon obuna bo'lgan aynan shu
 * `OrderStatusChangedEvent` ni iste'mol qiladi va bog'liq karta(lar)ga sanali
 * holat-o'zgarishi izohini qo'shadi — ko'rinadigan/auditlanadigan qilib.
 *
 * KO'LAM: faqat izoh-sinxronizatsiyasi. Karta ustunini AVTOMATIK ko'chirmaydi —
 * holat→ustun moslashuvi egasi-siyosati qarori (Guruh-B).
 *
 * Barcha DB ishi KanbanBoardsRepository.appendOrderStatusNote() ichida; bu
 * handler faqat eventni repo'ga uzatadi (best-effort: sinxronizatsiya xatosi
 * loglanadi, hech qachon otilmaydi — SD holat o'zgarishini buza olmaydi).
 */
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { OrderStatusChangedEvent } from '../../../sd/domain/events/order-status-changed.event';
import {
  IKanbanBoardsRepo,
  KANBAN_BOARDS_REPO,
} from '../../domain/repositories/i-kanban-boards.repo';

export { OrderStatusChangedEvent };

@Injectable()
@EventsHandler(OrderStatusChangedEvent)
export class OrderStatusChangedKanbanHandler
  implements IEventHandler<OrderStatusChangedEvent>
{
  private readonly logger = new Logger(OrderStatusChangedKanbanHandler.name);

  constructor(
    @Inject(KANBAN_BOARDS_REPO) private readonly kanbanBoardsRepo: IKanbanBoardsRepo,
  ) {}

  async handle(event: OrderStatusChangedEvent): Promise<void> {
    try {
      const result = await this.kanbanBoardsRepo.appendOrderStatusNote(
        event.orderId,
        event.previousStatus,
        event.newStatus,
      );

      if (!result.ok) {
        this.logger.error(
          `OrderStatusChangedKanbanHandler: orderId=${event.orderId} — ${result.error.message}`,
        );
      }

      // ADDITIONAL (owner-decisions batch item 4, Guruh-B): status→column auto-move.
      // INERT until the owner seeds kanban_status_column_map — with no rule this is a
      // no-op. Runs ALONGSIDE the note-append above (note-append stays unchanged) and
      // is equally best-effort: a move failure is logged, never thrown, and never
      // undoes the note or breaks the SD status change.
      const moveResult = await this.kanbanBoardsRepo.moveOrderCardByStatusMap(
        event.orderId,
        event.newStatus,
      );

      if (!moveResult.ok) {
        this.logger.error(
          `OrderStatusChangedKanbanHandler(move): orderId=${event.orderId} — ${moveResult.error.message}`,
        );
      }
    } catch (e) {
      // Best-effort: kanban sinxronizatsiya xatosi SD holat o'zgarishini buzmasin.
      this.logger.error(
        `OrderStatusChangedKanbanHandler: orderId=${event.orderId} — ${(e as Error).message}`,
      );
    }
  }
}
