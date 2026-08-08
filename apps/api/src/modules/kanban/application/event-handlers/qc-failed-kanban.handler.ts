/**
 * qc-failed-kanban.handler.ts
 *
 * QcFailedEvent → avtomatik Kanban karta yaratish (owner decision 2026-07-13,
 * chat: QC/MES/Design/waste-tracking barchasi Kanban karta yaratishi kerak —
 * hozirgacha faqat SD order eventlari karta yaratardi, ko'ring
 * order-created-kanban.handler.ts / order-cancelled-kanban.handler.ts /
 * order-status-changed-kanban.handler.ts).
 *
 * QC inspection FAILED bo'lganda (submit-inspection.handler.ts,
 * SubmitInspectionHandler.execute — decision === 'fail') haqiqiy QcFailedEvent
 * chiqadi — bu handler shu eventni tinglaydi va QC-belgilangan board'ga
 * (type='qc' yoki mos nomli board) karta qo'shadi. Logika (board/column
 * lookup + card insert, transaction ichida)
 * KanbanCardsRepository.createKanbanForQcInspection() ichida —
 * createKanbanForOrder bilan bir xil "board topilmasa jimgina o'tkazib
 * yuborish" semantikasi bilan. Bu handler faqat eventni repo'ga uzatadi va
 * xatolarni log qiladi. CQRS IEventHandler shartnomasi `void` qaytaradi,
 * shuning uchun Result xato bo'lsa ham throw qilinmaydi — QC oqimini
 * to'xtatmasin.
 */
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { QcFailedEvent } from '../../../qc/domain/events';
import {
  IKanbanBoardsRepo,
  KANBAN_BOARDS_REPO,
} from '../../domain/repositories/i-kanban-boards.repo';

@Injectable()
@EventsHandler(QcFailedEvent)
export class QcFailedKanbanHandler implements IEventHandler<QcFailedEvent> {
  private readonly logger = new Logger(QcFailedKanbanHandler.name);

  constructor(
    @Inject(KANBAN_BOARDS_REPO) private readonly kanbanBoardsRepo: IKanbanBoardsRepo,
  ) {}

  async handle(event: QcFailedEvent): Promise<void> {
    const result = await this.kanbanBoardsRepo.createKanbanForQcInspection({
      inspectionId: event.inspectionId,
      orderId:      event.orderId,
      reason:       event.reason,
    });

    if (!result.ok) {
      this.logger.error(
        `QcFailedKanbanHandler: inspectionId=${event.inspectionId} orderId=${event.orderId} — ${result.error.message}`,
      );
    }
  }
}
