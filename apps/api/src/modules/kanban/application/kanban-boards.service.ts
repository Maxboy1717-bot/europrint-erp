import { Inject, Injectable } from '@nestjs/common';
import { Result } from '@common/result';
import {
  IKanbanBoardsRepo,
  KANBAN_BOARDS_REPO,
  KanbanBoard,
  KanbanBoardDetail,
  KanbanCard,
  KanbanColumn,
} from '../domain/repositories/i-kanban-boards.repo';

@Injectable()
export class KanbanBoardsService {
  constructor(
    @Inject(KANBAN_BOARDS_REPO)
    private readonly boardsRepo: IKanbanBoardsRepo,
  ) {}

  getBoards(): Promise<Result<KanbanBoard[]>> {
    return this.boardsRepo.getBoards();
  }

  getBoardById(boardId: string): Promise<Result<KanbanBoardDetail>> {
    return this.boardsRepo.getBoardById(boardId);
  }

  createBoard(body: Record<string, unknown>): Promise<Result<KanbanBoard>> {
    return this.boardsRepo.createBoard({
      name: String(body.name || 'Yangi Doska'),
      type: String(body.type || 'custom'),
      description: body.description != null ? String(body.description) : null,
    });
  }

  async addColumn(boardId: string, body: Record<string, unknown>): Promise<Result<KanbanColumn>> {
    const maxOrderResult = await this.boardsRepo.getMaxColumnOrder(boardId);
    const maxOrder = maxOrderResult.ok ? maxOrderResult.data : 0;
    return this.boardsRepo.addColumn({
      board_id: boardId,
      name: String(body.name || 'Yangi Ustun'),
      sort_order: maxOrder + 1,
      color: body.color != null ? String(body.color) : null,
    });
  }

  updateColumn(boardId: string, columnId: string, body: Record<string, unknown>): Promise<Result<KanbanColumn>> {
    return this.boardsRepo.updateColumn(boardId, columnId, {
      name: body.name != null ? String(body.name) : null,
      color: body.color != null ? String(body.color) : null,
      sort_order: body.sort_order != null ? Number(body.sort_order) : null,
    });
  }

  deleteColumn(boardId: string, columnId: string): Promise<Result<void>> {
    return this.boardsRepo.deleteColumn(boardId, columnId);
  }

  addCard(boardId: string, body: Record<string, unknown>): Promise<Result<KanbanCard>> {
    return this.boardsRepo.addCard({
      board_id: boardId,
      column_id: body.columnId != null ? String(body.columnId) : body.column_id != null ? String(body.column_id) : null,
      title: String(body.title || 'Yangi vazifa'),
      description: body.description != null ? String(body.description) : null,
      priority: String(body.priority || 'normal'),
      due_date: (body.dueDate ?? body.due_date) != null ? String(body.dueDate ?? body.due_date) : null,
      owner_user_id: (body.ownerUserId ?? body.owner_user_id) != null ? String(body.ownerUserId ?? body.owner_user_id) : null,
    });
  }

  updateCard(id: string, body: Record<string, unknown>): Promise<Result<KanbanCard>> {
    return this.boardsRepo.updateCard(id, {
      title: body.title != null ? String(body.title) : null,
      description: body.description !== undefined && body.description != null ? String(body.description) : null,
      priority: body.priority != null ? String(body.priority) : null,
      due_date: (body.dueDate ?? body.due_date) != null ? String(body.dueDate ?? body.due_date) : null,
      owner_user_id: (body.ownerUserId ?? body.owner_user_id) != null ? String(body.ownerUserId ?? body.owner_user_id) : null,
    });
  }

  moveCard(id: string, body: Record<string, unknown>): Promise<Result<KanbanCard>> {
    return this.boardsRepo.moveCard(id, {
      column_id: (body.columnId ?? body.column_id) != null ? String(body.columnId ?? body.column_id) : null,
      sort_order: (body.sortOrder ?? body.sort_order) != null ? Number(body.sortOrder ?? body.sort_order) : null,
    });
  }

  deleteCard(id: string): Promise<Result<void>> {
    return this.boardsRepo.deleteCard(id);
  }
}
