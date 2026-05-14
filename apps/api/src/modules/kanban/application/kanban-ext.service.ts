/**
 * @module kanban-ext.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Logger } from '@nestjs/common';
import { Result } from '@common/result';
import { DrizzleKanbanExtRepository } from '../infrastructure/repositories/drizzle-kanban-ext.repo';

@Injectable()
export class KanbanExtService {
  private readonly logger = new Logger(KanbanExtService.name);

  constructor(private readonly repo: DrizzleKanbanExtRepository) {}

  // ─── Flows ────────────────────────────────────────────────────────────────

  getFlowsByBoard(boardId: string): Promise<Result<Record<string, unknown>[]>> {
    return this.repo.getFlowsByBoard(boardId);
  }

  createFlow(data: {
    boardId: string; name: string; description?: string;
    assignmentType?: string; userIds?: string[];
  }): Promise<Result<Record<string, unknown>>> {
    return this.repo.createFlow(data);
  }

  getFlowById(id: string): Promise<Result<Record<string, unknown> | null>> {
    return this.repo.getFlowById(id);
  }

  updateFlow(id: string, data: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    return this.repo.updateFlow(id, data.name as string, data.description as string);
  }

  deleteFlow(id: string): Promise<Result<void>> {
    return this.repo.deleteFlow(id);
  }

  // ─── Robots ───────────────────────────────────────────────────────────────

  getRobotsByBoard(boardId: string): Promise<Result<Record<string, unknown>[]>> {
    return this.repo.getRobotsByBoard(boardId);
  }

  createRobot(boardId: string, data: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    return this.repo.createRobot({
      boardId,
      name: String(data.name ?? 'Robot'),
      trigger: String(data.trigger ?? 'card_moved'),
      actions: Array.isArray(data.actions) ? data.actions : [],
    });
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

  // ─── Checklists ───────────────────────────────────────────────────────────

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

  // ─── Comments ─────────────────────────────────────────────────────────────

  getCardComments(cardId: string): Promise<Result<Record<string, unknown>[]>> {
    return this.repo.getCardComments(cardId);
  }

  addComment(cardId: string, userId: number, content: string): Promise<Result<Record<string, unknown>>> {
    return this.repo.addComment(cardId, userId, content);
  }

  // ─── Watchers ─────────────────────────────────────────────────────────────

  getCardWatchers(cardId: string): Promise<Result<Record<string, unknown>[]>> {
    return this.repo.getCardWatchers(cardId);
  }

  addWatcher(cardId: string, userId: number): Promise<Result<Record<string, unknown>>> {
    return this.repo.addWatcher(cardId, userId);
  }

  // ─── Notifications ────────────────────────────────────────────────────────

  getUnreadCount(userId: number): Promise<Result<number>> {
    return this.repo.getUnreadCount(userId);
  }

  getNotifications(userId: number, limit?: number, offset?: number): Promise<Result<Record<string, unknown>[]>> {
    return this.repo.getNotifications(userId, limit, offset);
  }

  markNotificationRead(id: string, userId: number): Promise<Result<void>> {
    return this.repo.markNotificationRead(id, userId);
  }

  markAllNotificationsRead(userId: number): Promise<Result<void>> {
    return this.repo.markAllNotificationsRead(userId);
  }

  // ─── Templates ────────────────────────────────────────────────────────────

  getTemplates(boardId?: string): Promise<Result<Record<string, unknown>[]>> {
    return this.repo.getTemplates(boardId);
  }

  createTemplate(data: {
    name: string; description?: string; priority?: string;
    boardId?: string; checklistItems?: unknown[]; columnsConfig?: unknown[];
    createdById?: number;
  }): Promise<Result<Record<string, unknown>>> {
    return this.repo.createTemplate(data);
  }

  updateTemplate(id: string, data: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    return this.repo.updateTemplate(id, data as Parameters<typeof this.repo.updateTemplate>[1]);
  }

  deleteTemplate(id: string): Promise<Result<void>> {
    return this.repo.deleteTemplate(id);
  }

  // ─── Time Tracking ────────────────────────────────────────────────────────

  startTimeTracking(cardId: string, userId: number, description?: string): Promise<Result<Record<string, unknown>>> {
    return this.repo.startTimeTracking(cardId, userId, description);
  }

  stopTimeTracking(cardId: string, userId: number): Promise<Result<Record<string, unknown>>> {
    return this.repo.stopTimeTracking(cardId, userId);
  }

  getTimeEntries(cardId: string): Promise<Result<Record<string, unknown>[]>> {
    return this.repo.getTimeEntries(cardId);
  }

  // ─── Tags ─────────────────────────────────────────────────────────────────

  getCardTags(cardId: string): Promise<Result<Record<string, unknown>[]>> {
    return this.repo.getCardTags(cardId);
  }

  addTagToCard(cardId: string, tagData: { name: string; color?: string; boardId?: string }): Promise<Result<Record<string, unknown>>> {
    return this.repo.addTagToCard(cardId, tagData);
  }

  removeTagFromCard(cardId: string, tagId: string): Promise<Result<void>> {
    return this.repo.removeTagFromCard(cardId, tagId);
  }

  // ─── Observers ────────────────────────────────────────────────────────────

  getObservers(cardId: string): Promise<Result<Record<string, unknown>[]>> {
    return this.repo.getObservers(cardId);
  }

  addObserver(cardId: string, userId: number): Promise<Result<Record<string, unknown>>> {
    return this.repo.addObserver(cardId, userId);
  }

  removeObserver(cardId: string, observerId: string): Promise<Result<void>> {
    return this.repo.removeObserver(cardId, observerId);
  }

  // ─── Co-Executors ─────────────────────────────────────────────────────────

  getCoExecutors(cardId: string): Promise<Result<Record<string, unknown>[]>> {
    return this.repo.getCoExecutors(cardId);
  }

  addCoExecutor(cardId: string, userId: number): Promise<Result<Record<string, unknown>>> {
    return this.repo.addCoExecutor(cardId, userId);
  }

  removeCoExecutor(cardId: string, coExecutorId: string): Promise<Result<void>> {
    return this.repo.removeCoExecutor(cardId, coExecutorId);
  }

  // ─── Results ──────────────────────────────────────────────────────────────

  getCardResults(cardId: string): Promise<Result<Record<string, unknown>[]>> {
    return this.repo.getCardResults(cardId);
  }

  createResult(cardId: string, createdById: number, description?: string): Promise<Result<Record<string, unknown>>> {
    return this.repo.createResult(cardId, createdById, description);
  }

  getResultFiles(resultId: string): Promise<Result<Record<string, unknown>[]>> {
    return this.repo.getResultFiles(resultId);
  }

  deleteResultFile(fileId: string): Promise<Result<void>> {
    return this.repo.deleteResultFile(fileId);
  }

  addResultFile(resultId: string, data: {
    fileName: string; fileUrl: string; fileSize?: number; mimeType?: string;
  }): Promise<Result<Record<string, unknown>>> {
    return this.repo.addResultFile(resultId, data);
  }

  // ─── Files ────────────────────────────────────────────────────────────────

  getCardFiles(cardId: string): Promise<Result<Record<string, unknown>[]>> {
    return this.repo.getCardFiles(cardId);
  }

  createFile(data: {
    cardId: string; fileName: string; fileUrl: string;
    fileSize?: number; mimeType?: string; uploadedById?: number;
  }): Promise<Result<Record<string, unknown>>> {
    return this.repo.createFile(data);
  }

  deleteFile(fileId: string): Promise<Result<void>> {
    return this.repo.deleteFile(fileId);
  }

  // ─── Accept / Complete ────────────────────────────────────────────────────

  acceptCard(cardId: string, userId: number): Promise<Result<Record<string, unknown>>> {
    return this.repo.acceptCard(cardId, userId);
  }

  completeCard(cardId: string, userId: number, completionReport?: string): Promise<Result<Record<string, unknown>>> {
    return this.repo.completeCard(cardId, userId, completionReport);
  }

  // ─── Analytics ────────────────────────────────────────────────────────────

  getTaskStats(boardId?: string): Promise<Result<Record<string, unknown>>> {
    return this.repo.getTaskStats(boardId);
  }

  getTeamMetrics(boardId?: string): Promise<Result<Record<string, unknown>>> {
    return this.repo.getTeamMetrics(boardId);
  }

  getOverdueInbox(boardId?: string): Promise<Result<Record<string, unknown>[]>> {
    return this.repo.getOverdueInbox(boardId);
  }

  getEmployees(): Promise<Result<Record<string, unknown>[]>> {
    return this.repo.getEmployees();
  }

  // ─── Board operations ─────────────────────────────────────────────────────

  updateBoard(boardId: string, data: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    return this.repo.updateBoardFlows(boardId, String(data.name ?? boardId));
  }

  deleteBoard(boardId: string): Promise<Result<void>> {
    return this.repo.deleteBoardFlows(boardId);
  }

  // ─── Reporting ────────────────────────────────────────────────────────────

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

  createCardFlat(body: Record<string, unknown>, _userId: number): Promise<Result<Record<string, unknown>>> {
    return this.repo.createCardFlat(body);
  }

  getProductivityReport(): Promise<Result<Record<string, unknown>>> {
    return this.repo.getProductivityReport();
  }

  getOverdueReport(): Promise<Result<Record<string, unknown>>> {
    return this.repo.getOverdueReport();
  }

  getEmployeePerformance(): Promise<Result<Record<string, unknown>>> {
    return this.repo.getEmployeePerformance();
  }
}
