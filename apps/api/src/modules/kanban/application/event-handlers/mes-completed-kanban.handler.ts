/**
 * mes-completed-kanban.handler.ts
 *
 * MesCompletedEvent → avtomatik Kanban karta yaratish (owner decision
 * 2026-07-13, chat: QC/MES/Design/waste-tracking barchasi Kanban karta
 * yaratishi kerak).
 *
 * MES production session tugaganda (complete-session.handler.ts, Trigger 10
 * — MES→QC) haqiqiy MesCompletedEvent chiqadi — bu handler shu eventni
 * tinglaydi va production/MES-belgilangan board'ga karta qo'shadi. Logika
 * KanbanCardsRepository.createKanbanForMesSession() ichida —
 * createKanbanForOrder bilan bir xil "board topilmasa jimgina o'tkazib
 * yuborish" semantikasi bilan. Best-effort: Kanban xatosi MES sessiya
 * yakunlanishini yoki QC'ga o'tishni to'xtatmaydi.
 */
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { MesCompletedEvent } from '../../../mes/domain/events/mes-completed.event';
import {
  IKanbanBoardsRepo,
  KANBAN_BOARDS_REPO,
} from '../../domain/repositories/i-kanban-boards.repo';

@Injectable()
@EventsHandler(MesCompletedEvent)
export class MesCompletedKanbanHandler implements IEventHandler<MesCompletedEvent> {
  private readonly logger = new Logger(MesCompletedKanbanHandler.name);

  constructor(
    @Inject(KANBAN_BOARDS_REPO) private readonly kanbanBoardsRepo: IKanbanBoardsRepo,
  ) {}

  async handle(event: MesCompletedEvent): Promise<void> {
    const result = await this.kanbanBoardsRepo.createKanbanForMesSession({
      sessionId: event.sessionId,
      ppId:      event.ppId,
    });

    if (!result.ok) {
      this.logger.error(
        `MesCompletedKanbanHandler: sessionId=${event.sessionId} ppId=${event.ppId} — ${result.error.message}`,
      );
    }
  }
}
