/**
 * mes-breakdown-kanban.handler.ts
 *
 * MesBreakdownEvent → avtomatik Kanban karta yaratish (VISION 08-mes#37 completion;
 * owner decision 2026-07-13: QC/MES/Design barchasi Kanban karta yaratishi kerak).
 *
 * Emergency/breakdown downtime auto-opens a maintenance request+task
 * (record-downtime.handler.ts → MesMaintenanceRepository.createFromDowntime) — this
 * handler mirrors that into a Kanban card so the "avariya-ta'mirlash vazifasi" is
 * visible on the board, not just an internal mes_maintenance_requests/tasks row.
 * Logic lives in KanbanCardsRepository.createKanbanForMaintenanceRequest() — same
 * "board topilmasa jimgina o'tkazib yuborish" semantics as the sibling MES/QC/Design
 * handlers. Best-effort: Kanban xatosi downtime yozuvini yoki avariya vazifasini
 * to'xtatmaydi (allaqachon persisted).
 */
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { MesBreakdownEvent } from '../../../mes/domain/events/mes-breakdown.event';
import {
  IKanbanBoardsRepo,
  KANBAN_BOARDS_REPO,
} from '../../domain/repositories/i-kanban-boards.repo';

@Injectable()
@EventsHandler(MesBreakdownEvent)
export class MesBreakdownKanbanHandler implements IEventHandler<MesBreakdownEvent> {
  private readonly logger = new Logger(MesBreakdownKanbanHandler.name);

  constructor(
    @Inject(KANBAN_BOARDS_REPO) private readonly kanbanBoardsRepo: IKanbanBoardsRepo,
  ) {}

  async handle(event: MesBreakdownEvent): Promise<void> {
    const result = await this.kanbanBoardsRepo.createKanbanForMaintenanceRequest({
      requestId:   event.requestId,
      taskId:      event.taskId,
      equipmentId: event.equipmentId,
      reasonCode:  event.reasonCode,
      description: event.description,
    });

    if (!result.ok) {
      this.logger.error(
        `MesBreakdownKanbanHandler: requestId=${event.requestId} taskId=${event.taskId} — ${result.error.message}`,
      );
    }
  }
}
