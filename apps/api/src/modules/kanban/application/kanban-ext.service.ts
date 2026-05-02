import { Injectable, Logger } from '@nestjs/common';
import { Result } from '@common/result';
import { DrizzleKanbanExtRepository } from '../infrastructure/repositories/drizzle-kanban-ext.repo';

@Injectable()
export class KanbanExtService {
  private readonly logger = new Logger(KanbanExtService.name);

  constructor(private readonly repo: DrizzleKanbanExtRepository) {}

  getFlowById(id: string): Promise<Result<Record<string, unknown> | null>> {
    return this.repo.getFlowById(id);
  }

  updateFlow(id: string, data: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    return this.repo.updateFlow(id, data.name as string, data.description as string);
  }

  deleteFlow(id: string): Promise<Result<void>> {
    return this.repo.deleteFlow(id);
  }

  getRobotById(id: string): Promise<Result<Record<string, unknown> | null>> {
    return this.repo.getRobotById(id);
  }

  updateRobot(id: string, data: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    return this.repo.updateRobot(id, data.name as string, data.isActive as boolean);
  }

  deleteRobot(id: string): Promise<Result<void>> {
    return this.repo.deleteRobot(id);
  }

  getEmployeePerformance(): Promise<Result<Record<string, unknown>>> {
    return this.repo.getEmployeePerformance();
  }

  getCardChecklists(cardId: string): Promise<Result<Record<string, unknown>[]>> {
    return this.repo.getCardChecklists(cardId);
  }

  createChecklist(cardId: string, title: string): Promise<Result<Record<string, unknown>>> {
    return this.repo.createChecklist(cardId, title);
  }

  updateChecklist(id: string, data: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    return this.repo.updateChecklist(id, data.title as string);
  }

  deleteChecklist(id: string): Promise<Result<void>> {
    return this.repo.deleteChecklist(id);
  }

  getChecklistItems(checklistId: string): Promise<Result<Record<string, unknown>[]>> {
    return this.repo.getChecklistItems(checklistId);
  }

  createChecklistItem(checklistId: string, title: string): Promise<Result<Record<string, unknown>>> {
    return this.repo.createChecklistItem(checklistId, title);
  }

  updateChecklistItem(
    checklistId: string, itemId: string, data: Record<string, unknown>,
  ): Promise<Result<Record<string, unknown>>> {
    return this.repo.updateChecklistItem(checklistId, itemId, data.title as string, data.isCompleted as boolean);
  }

  deleteChecklistItem(checklistId: string, itemId: string): Promise<Result<void>> {
    return this.repo.deleteChecklistItem(checklistId, itemId);
  }

  toggleChecklistItem(itemId: string): Promise<Result<Record<string, unknown>>> {
    return this.repo.toggleChecklistItem(itemId);
  }

  getCardComments(cardId: string): Promise<Result<Record<string, unknown>[]>> {
    return this.repo.getCardComments(cardId);
  }

  addComment(cardId: string, userId: number, content: string): Promise<Result<Record<string, unknown>>> {
    return this.repo.addComment(cardId, userId, content);
  }

  getCardWatchers(cardId: string): Promise<Result<Record<string, unknown>[]>> {
    return this.repo.getCardWatchers(cardId);
  }

  addWatcher(cardId: string, userId: number): Promise<Result<Record<string, unknown>>> {
    return this.repo.addWatcher(cardId, userId);
  }

  updateBoard(boardId: string, data: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    return this.repo.updateBoardFlows(boardId, String(data.name ?? boardId));
  }

  deleteBoard(boardId: string): Promise<Result<void>> {
    return this.repo.deleteBoardFlows(boardId);
  }

  getSprintInfo(): Promise<Result<Record<string, unknown>>> {
    return this.repo.getSprintInfo();
  }

  getMembers(): Promise<Result<Record<string, unknown>[]>> {
    return this.repo.getMembers();
  }

  getAnalyticsSummary(): Promise<Result<Record<string, unknown>>> {
    return this.repo.getAnalyticsSummary();
  }

  getOverdueCards(): Promise<Result<Record<string, unknown>[]>> {
    return this.repo.getOverdueCards();
  }

  getCardsByEmployee(employeeId: string): Promise<Result<Record<string, unknown>[]>> {
    return this.repo.getCardsByEmployee(employeeId);
  }

  getProductivityReport(): Promise<Result<Record<string, unknown>>> {
    return this.repo.getProductivityReport();
  }

  getOverdueReport(): Promise<Result<Record<string, unknown>>> {
    return this.repo.getOverdueReport();
  }
}
