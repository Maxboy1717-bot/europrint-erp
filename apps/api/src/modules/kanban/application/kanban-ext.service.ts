/**
 * @module kanban-ext.service
 * @description Business-logic facade. Delegates to two sub-services to keep
 *   this file under 300 lines (Rule 16). Public method names + signatures
 *   are unchanged so existing controllers and `kanban.module` need no edits.
 *
 *   Sub-services:
 *     - KanbanExtFlowService  — Flows / Robots / Templates / Time / Tags /
 *                               Observers / Co-Execs / Board / Reporting /
 *                               Analytics
 *     - KanbanExtCardService  — Checklists / Comments / Watchers /
 *                               Notifications / Results / Files /
 *                               Accept-Complete / flat card create
 */

import { Injectable, Logger } from '@nestjs/common';
import { Result } from '@common/result';
import { KanbanExtFlowService } from './kanban-ext-flow.service';
import { KanbanExtCardService } from './kanban-ext-card.service';

@Injectable()
export class KanbanExtService {
  private readonly logger = new Logger(KanbanExtService.name);

  constructor(
    private readonly flow: KanbanExtFlowService,
    private readonly card: KanbanExtCardService,
  ) {}

  // ─── Flows ────────────────────────────────────────────────────────────────

  getFlowsByBoard(boardId: string): Promise<Result<Record<string, unknown>[]>> {
    return this.flow.getFlowsByBoard(boardId);
  }
  createFlow(data: { boardId: string; name: string; description?: string; assignmentType?: string; userIds?: string[] }): Promise<Result<Record<string, unknown>>> {
    return this.flow.createFlow(data);
  }
  getFlowById(id: string): Promise<Result<Record<string, unknown> | null>> { return this.flow.getFlowById(id); }
  updateFlow(id: string, data: Record<string, unknown>): Promise<Result<Record<string, unknown>>> { return this.flow.updateFlow(id, data); }
  deleteFlow(id: string): Promise<Result<void>> { return this.flow.deleteFlow(id); }

  // ─── Robots ───────────────────────────────────────────────────────────────

  getRobotsByBoard(boardId: string): Promise<Result<Record<string, unknown>[]>> { return this.flow.getRobotsByBoard(boardId); }
  createRobot(boardId: string, data: Record<string, unknown>): Promise<Result<Record<string, unknown>>> { return this.flow.createRobot(boardId, data); }
  getRobotById(id: string): Promise<Result<Record<string, unknown> | null>> { return this.flow.getRobotById(id); }
  updateRobot(id: string, data: Record<string, unknown>): Promise<Result<Record<string, unknown>>> { return this.flow.updateRobot(id, data); }
  deleteRobot(id: string): Promise<Result<void>> { return this.flow.deleteRobot(id); }

  // ─── Checklists ───────────────────────────────────────────────────────────

  getCardChecklists(cardId: string): Promise<Result<Record<string, unknown>[]>> { return this.card.getCardChecklists(cardId); }
  createChecklist(cardId: string, title: string): Promise<Result<Record<string, unknown>>> { return this.card.createChecklist(cardId, title); }
  updateChecklist(id: string, data: Record<string, unknown>): Promise<Result<Record<string, unknown>>> { return this.card.updateChecklist(id, data); }
  deleteChecklist(id: string): Promise<Result<void>> { return this.card.deleteChecklist(id); }
  getChecklistItems(checklistId: string): Promise<Result<Record<string, unknown>[]>> { return this.card.getChecklistItems(checklistId); }
  createChecklistItem(checklistId: string, title: string): Promise<Result<Record<string, unknown>>> { return this.card.createChecklistItem(checklistId, title); }
  updateChecklistItem(checklistId: string, itemId: string, data: Record<string, unknown>): Promise<Result<Record<string, unknown>>> { return this.card.updateChecklistItem(checklistId, itemId, data); }
  deleteChecklistItem(checklistId: string, itemId: string): Promise<Result<void>> { return this.card.deleteChecklistItem(checklistId, itemId); }
  toggleChecklistItem(itemId: string): Promise<Result<Record<string, unknown>>> { return this.card.toggleChecklistItem(itemId); }

  // ─── Comments ─────────────────────────────────────────────────────────────

  getCardComments(cardId: string): Promise<Result<Record<string, unknown>[]>> { return this.card.getCardComments(cardId); }
  addComment(cardId: string, userId: number, content: string): Promise<Result<Record<string, unknown>>> { return this.card.addComment(cardId, userId, content); }

  // ─── Watchers ─────────────────────────────────────────────────────────────

  getCardWatchers(cardId: string): Promise<Result<Record<string, unknown>[]>> { return this.card.getCardWatchers(cardId); }
  addWatcher(cardId: string, userId: number): Promise<Result<Record<string, unknown>>> { return this.card.addWatcher(cardId, userId); }

  // ─── Notifications ────────────────────────────────────────────────────────

  getUnreadCount(userId: number): Promise<Result<number>> { return this.card.getUnreadCount(userId); }
  getNotifications(userId: number, limit?: number, offset?: number): Promise<Result<Record<string, unknown>[]>> { return this.card.getNotifications(userId, limit, offset); }
  markNotificationRead(id: string, userId: number): Promise<Result<void>> { return this.card.markNotificationRead(id, userId); }
  markAllNotificationsRead(userId: number): Promise<Result<void>> { return this.card.markAllNotificationsRead(userId); }

  // ─── Templates ────────────────────────────────────────────────────────────

  getTemplates(boardId?: string): Promise<Result<Record<string, unknown>[]>> { return this.flow.getTemplates(boardId); }
  createTemplate(data: { name: string; description?: string; priority?: string; boardId?: string; checklistItems?: unknown[]; columnsConfig?: unknown[]; createdById?: number; }): Promise<Result<Record<string, unknown>>> { return this.flow.createTemplate(data); }
  updateTemplate(id: string, data: Record<string, unknown>): Promise<Result<Record<string, unknown>>> { return this.flow.updateTemplate(id, data); }
  deleteTemplate(id: string): Promise<Result<void>> { return this.flow.deleteTemplate(id); }

  // ─── Time Tracking ────────────────────────────────────────────────────────

  startTimeTracking(cardId: string, userId: number, description?: string): Promise<Result<Record<string, unknown>>> { return this.flow.startTimeTracking(cardId, userId, description); }
  stopTimeTracking(cardId: string, userId: number): Promise<Result<Record<string, unknown>>> { return this.flow.stopTimeTracking(cardId, userId); }
  getTimeEntries(cardId: string): Promise<Result<Record<string, unknown>[]>> { return this.flow.getTimeEntries(cardId); }

  // ─── Tags ─────────────────────────────────────────────────────────────────

  getCardTags(cardId: string): Promise<Result<Record<string, unknown>[]>> { return this.flow.getCardTags(cardId); }
  addTagToCard(cardId: string, tagData: { name: string; color?: string; boardId?: string }): Promise<Result<Record<string, unknown>>> { return this.flow.addTagToCard(cardId, tagData); }
  removeTagFromCard(cardId: string, tagId: string): Promise<Result<void>> { return this.flow.removeTagFromCard(cardId, tagId); }

  // ─── Observers ────────────────────────────────────────────────────────────

  getObservers(cardId: string): Promise<Result<Record<string, unknown>[]>> { return this.flow.getObservers(cardId); }
  addObserver(cardId: string, userId: number): Promise<Result<Record<string, unknown>>> { return this.flow.addObserver(cardId, userId); }
  removeObserver(cardId: string, observerId: string): Promise<Result<void>> { return this.flow.removeObserver(cardId, observerId); }

  // ─── Co-Executors ─────────────────────────────────────────────────────────

  getCoExecutors(cardId: string): Promise<Result<Record<string, unknown>[]>> { return this.flow.getCoExecutors(cardId); }
  addCoExecutor(cardId: string, userId: number): Promise<Result<Record<string, unknown>>> { return this.flow.addCoExecutor(cardId, userId); }
  removeCoExecutor(cardId: string, coExecutorId: string): Promise<Result<void>> { return this.flow.removeCoExecutor(cardId, coExecutorId); }

  // ─── Results ──────────────────────────────────────────────────────────────

  getCardResults(cardId: string): Promise<Result<Record<string, unknown>[]>> { return this.card.getCardResults(cardId); }
  createResult(cardId: string, createdById: number, description?: string): Promise<Result<Record<string, unknown>>> { return this.card.createResult(cardId, createdById, description); }
  getResultFiles(resultId: string): Promise<Result<Record<string, unknown>[]>> { return this.card.getResultFiles(resultId); }
  deleteResultFile(fileId: string): Promise<Result<void>> { return this.card.deleteResultFile(fileId); }
  addResultFile(resultId: string, data: { fileName: string; fileUrl: string; fileSize?: number; mimeType?: string; }): Promise<Result<Record<string, unknown>>> { return this.card.addResultFile(resultId, data); }

  // ─── Files ────────────────────────────────────────────────────────────────

  getCardFiles(cardId: string): Promise<Result<Record<string, unknown>[]>> { return this.card.getCardFiles(cardId); }
  createFile(data: { cardId: string; fileName: string; fileUrl: string; fileSize?: number; mimeType?: string; uploadedById?: number; }): Promise<Result<Record<string, unknown>>> { return this.card.createFile(data); }
  deleteFile(fileId: string): Promise<Result<void>> { return this.card.deleteFile(fileId); }

  // ─── Accept / Complete ────────────────────────────────────────────────────

  acceptCard(cardId: string, userId: number): Promise<Result<Record<string, unknown>>> { return this.card.acceptCard(cardId, userId); }
  completeCard(cardId: string, userId: number, completionReport?: string): Promise<Result<Record<string, unknown>>> { return this.card.completeCard(cardId, userId, completionReport); }

  // ─── Analytics ────────────────────────────────────────────────────────────

  getTaskStats(boardId?: string): Promise<Result<Record<string, unknown>>> { return this.flow.getTaskStats(boardId); }
  getTeamMetrics(boardId?: string): Promise<Result<Record<string, unknown>>> { return this.flow.getTeamMetrics(boardId); }
  getOverdueInbox(boardId?: string): Promise<Result<Record<string, unknown>[]>> { return this.flow.getOverdueInbox(boardId); }
  getEmployees(): Promise<Result<Record<string, unknown>[]>> { return this.flow.getEmployees(); }

  // ─── Board operations ─────────────────────────────────────────────────────

  updateBoard(boardId: string, data: Record<string, unknown>): Promise<Result<Record<string, unknown>>> { return this.flow.updateBoard(boardId, data); }
  deleteBoard(boardId: string): Promise<Result<void>> { return this.flow.deleteBoard(boardId); }

  // ─── Reporting ────────────────────────────────────────────────────────────

  getSprintInfo(): Promise<Result<Record<string, unknown>>> { return this.flow.getSprintInfo(); }
  getMembers(): Promise<Result<Record<string, unknown>[]>> { return this.flow.getMembers(); }
  getAnalyticsSummary(): Promise<Result<Record<string, unknown>>> { return this.flow.getAnalyticsSummary(); }
  getOverdueCards(): Promise<Result<Record<string, unknown>[]>> { return this.flow.getOverdueCards(); }
  getCardsByEmployee(employeeId: string): Promise<Result<Record<string, unknown>[]>> { return this.flow.getCardsByEmployee(employeeId); }
  createCardFlat(body: Record<string, unknown>, _userId: number): Promise<Result<Record<string, unknown>>> { return this.card.createCardFlat(body); }
  getProductivityReport(): Promise<Result<Record<string, unknown>>> { return this.flow.getProductivityReport(); }
  getOverdueReport(): Promise<Result<Record<string, unknown>>> { return this.flow.getOverdueReport(); }
  getEmployeePerformance(): Promise<Result<Record<string, unknown>>> { return this.flow.getEmployeePerformance(); }
}
