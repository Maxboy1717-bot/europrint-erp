/**
 * design-requested-kanban.handler.ts
 *
 * DesignRequestedEvent → avtomatik Kanban karta yaratish (owner decision
 * 2026-07-13, chat: QC/MES/Design/waste-tracking barchasi Kanban karta
 * yaratishi kerak).
 *
 * Yangi dizayn vazifasi so'ralganda (request-design.handler.ts, Trigger 3)
 * haqiqiy DesignRequestedEvent chiqadi — bu handler shu eventni tinglaydi va
 * dizayn-belgilangan board'ga karta qo'shadi. Logika
 * KanbanCardsRepository.createKanbanForDesignTask() ichida.
 *
 * event.designOrderId — DesignOrder aggregate'ning UUID'i
 * (request-design.handler.ts:51 dagi `design.id`), `design_orders`
 * jadvalining haqiqiy integer PK EMAS: aggregate konstruktorida `uuid()`
 * bilan yaratiladi va DrizzleDesignRepository.save() dan qaytgan haqiqiy DB
 * qatoridagi id (`toDomain()` ichida qayta yoziladi) alohida obyektga
 * yoziladi — chaqiruvchi handler'dagi `design` o'zgaruvchisi mutatsiya
 * qilinmaydi. Bu mavjud ikki-dunyo drift (design module); ushbu draft buni
 * TUZATMAYDI — faqat mavjud holatga moslashadi. Shu sabab related_id
 * (INTEGER ustun) o'rniga aynan UUID-manbalar uchun mo'ljallangan
 * related_ref (TEXT, G4 konvensiyasi — bkl. kanban_cards.related_ref_idx
 * sharhi) ishlatiladi; related_id = null. event.salesOrderId esa haqiqiy
 * sales_orders.id — shu qiymat title/description ichida ko'rinadi va
 * amaliy izlash uchun ishlatiladi.
 */
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { DesignRequestedEvent } from '../../../design/domain/events';
import {
  IKanbanBoardsRepo,
  KANBAN_BOARDS_REPO,
} from '../../domain/repositories/i-kanban-boards.repo';

@Injectable()
@EventsHandler(DesignRequestedEvent)
export class DesignRequestedKanbanHandler implements IEventHandler<DesignRequestedEvent> {
  private readonly logger = new Logger(DesignRequestedKanbanHandler.name);

  constructor(
    @Inject(KANBAN_BOARDS_REPO) private readonly kanbanBoardsRepo: IKanbanBoardsRepo,
  ) {}

  async handle(event: DesignRequestedEvent): Promise<void> {
    const result = await this.kanbanBoardsRepo.createKanbanForDesignTask({
      designOrderId: event.designOrderId,
      salesOrderId:  event.salesOrderId,
      customerId:    event.customerId,
    });

    if (!result.ok) {
      this.logger.error(
        `DesignRequestedKanbanHandler: designOrderId=${event.designOrderId} salesOrderId=${event.salesOrderId} — ${result.error.message}`,
      );
    }
  }
}
