/**
 * @module drizzle-kanban-ext.repo
 * @description Facade repository — delegates all methods to the three
 * focused sub-repositories. Kept so that kanban-ext.service.ts and
 * kanban.module.ts do not need to change.
 *
 * Sub-repos:
 *   DrizzleKanbanCoreRepository       — Flows, Robots, Board, Checklists, Comments, Watchers, Card creation, Accept/Complete
 *   DrizzleKanbanEngagementRepository — Notifications, Templates, Time Tracking, Tags, Observers, Co-Executors
 *   DrizzleKanbanAnalyticsRepository  — Results, Files, Analytics & Stats, Legacy helpers
 */

import { Injectable } from '@nestjs/common';
import { Result } from '@common/result';
import { DrizzleKanbanCoreRepository } from './drizzle-kanban-core.repo';
import { DrizzleKanbanEngagementRepository } from './drizzle-kanban-engagement.repo';
import { DrizzleKanbanAnalyticsRepository } from './drizzle-kanban-analytics.repo';

export { DrizzleKanbanCoreRepository } from './drizzle-kanban-core.repo';
export { DrizzleKanbanEngagementRepository } from './drizzle-kanban-engagement.repo';
export { DrizzleKanbanAnalyticsRepository } from './drizzle-kanban-analytics.repo';

@Injectable()
export class DrizzleKanbanExtRepository {
  constructor(
    private readonly core: DrizzleKanbanCoreRepository,
    private readonly engagement: DrizzleKanbanEngagementRepository,
    private readonly analytics: DrizzleKanbanAnalyticsRepository,
  ) {}

  // ─── Flows ────────────────────────────────────────────────────────────────

  getFlowsByBoard(boardId: string) { return this.core.getFlowsByBoard(boardId); }
  createFlow(data: { boardId: string; name: string; description?: string; assignmentType?: string; userIds?: string[] }) { return this.core.createFlow(data); }
  getFlowById(id: string) { return this.core.getFlowById(id); }
  updateFlow(id: string, name: string, description: string) { return this.core.updateFlow(id, name, description); }
  deleteFlow(id: string) { return this.core.deleteFlow(id); }

  // ─── Robots ───────────────────────────────────────────────────────────────

  getRobotsByBoard(boardId: string) { return this.core.getRobotsByBoard(boardId); }
  createRobot(data: { boardId: string; name: string; trigger: string; actions: unknown[] }) { return this.core.createRobot(data); }
  getRobotById(id: string) { return this.core.getRobotById(id); }
  updateRobot(id: string, name: string, isActive: boolean) { return this.core.updateRobot(id, name, isActive); }
  deleteRobot(id: string) { return this.core.deleteRobot(id); }

  // ─── Board board-level ────────────────────────────────────────────────────

  updateBoardFlows(boardId: string, name: string) { return this.core.updateBoardFlows(boardId, name); }
  deleteBoardFlows(boardId: string) { return this.core.deleteBoardFlows(boardId); }

  // ─── Checklists ───────────────────────────────────────────────────────────

  getCardChecklists(cardId: string) { return this.core.getCardChecklists(cardId); }
  createChecklist(cardId: string, title: string) { return this.core.createChecklist(cardId, title); }
  updateChecklist(id: string, title: string) { return this.core.updateChecklist(id, title); }
  deleteChecklist(id: string) { return this.core.deleteChecklist(id); }
  getChecklistItems(checklistId: string) { return this.core.getChecklistItems(checklistId); }
  createChecklistItem(checklistId: string, title: string) { return this.core.createChecklistItem(checklistId, title); }
  updateChecklistItem(checklistId: string, itemId: string, title: string, isCompleted: boolean) { return this.core.updateChecklistItem(checklistId, itemId, title, isCompleted); }
  deleteChecklistItem(checklistId: string, itemId: string) { return this.core.deleteChecklistItem(checklistId, itemId); }
  toggleChecklistItem(itemId: string) { return this.core.toggleChecklistItem(itemId); }

  // ─── Comments ─────────────────────────────────────────────────────────────

  getCardComments(cardId: string) { return this.core.getCardComments(cardId); }
  addComment(cardId: string, userId: number, content: string) { return this.core.addComment(cardId, userId, content); }

  // ─── Watchers ─────────────────────────────────────────────────────────────

  getCardWatchers(cardId: string) { return this.core.getCardWatchers(cardId); }
  addWatcher(cardId: string, userId: number) { return this.core.addWatcher(cardId, userId); }

  // ─── Card creation ────────────────────────────────────────────────────────

  createCardFlat(data: Record<string, unknown>) { return this.core.createCardFlat(data); }

  // ─── Accept / Complete ────────────────────────────────────────────────────

  acceptCard(cardId: string, userId: number) { return this.core.acceptCard(cardId, userId); }
  completeCard(cardId: string, userId: number, completionReport?: string) { return this.core.completeCard(cardId, userId, completionReport); }

  // ─── Notifications ────────────────────────────────────────────────────────

  getUnreadCount(userId: number) { return this.engagement.getUnreadCount(userId); }
  getNotifications(userId: number, limit?: number, offset?: number) { return this.engagement.getNotifications(userId, limit, offset); }
  markNotificationRead(id: string, userId: number) { return this.engagement.markNotificationRead(id, userId); }
  markAllNotificationsRead(userId: number) { return this.engagement.markAllNotificationsRead(userId); }
  createNotification(data: { userId: number; cardId?: string; boardId?: string; type: string; title: string; message?: string }) { return this.engagement.createNotification(data); }

  // ─── Templates ────────────────────────────────────────────────────────────

  getTemplates(boardId?: string) { return this.engagement.getTemplates(boardId); }
  createTemplate(data: { name: string; description?: string; priority?: string; boardId?: string; checklistItems?: unknown[]; columnsConfig?: unknown[]; createdById?: number }) { return this.engagement.createTemplate(data); }
  updateTemplate(id: string, data: { name?: string; description?: string; priority?: string; checklistItems?: unknown[]; columnsConfig?: unknown[] }) { return this.engagement.updateTemplate(id, data); }
  deleteTemplate(id: string) { return this.engagement.deleteTemplate(id); }

  // ─── Time Tracking ────────────────────────────────────────────────────────

  startTimeTracking(cardId: string, userId: number, description?: string) { return this.engagement.startTimeTracking(cardId, userId, description); }
  stopTimeTracking(cardId: string, userId: number) { return this.engagement.stopTimeTracking(cardId, userId); }
  getTimeEntries(cardId: string) { return this.engagement.getTimeEntries(cardId); }

  // ─── Tags ─────────────────────────────────────────────────────────────────

  getCardTags(cardId: string) { return this.engagement.getCardTags(cardId); }
  addTagToCard(cardId: string, tagData: { name: string; color?: string; boardId?: string }) { return this.engagement.addTagToCard(cardId, tagData); }
  removeTagFromCard(cardId: string, tagId: string) { return this.engagement.removeTagFromCard(cardId, tagId); }

  // ─── Observers ────────────────────────────────────────────────────────────

  getObservers(cardId: string) { return this.engagement.getObservers(cardId); }
  addObserver(cardId: string, userId: number) { return this.engagement.addObserver(cardId, userId); }
  removeObserver(cardId: string, observerId: string) { return this.engagement.removeObserver(cardId, observerId); }

  // ─── Co-Executors ─────────────────────────────────────────────────────────

  getCoExecutors(cardId: string) { return this.engagement.getCoExecutors(cardId); }
  addCoExecutor(cardId: string, userId: number) { return this.engagement.addCoExecutor(cardId, userId); }
  removeCoExecutor(cardId: string, coExecutorId: string) { return this.engagement.removeCoExecutor(cardId, coExecutorId); }

  // ─── Results ──────────────────────────────────────────────────────────────

  getCardResults(cardId: string) { return this.analytics.getCardResults(cardId); }
  createResult(cardId: string, createdById: number, description?: string) { return this.analytics.createResult(cardId, createdById, description); }
  getResultFiles(resultId: string) { return this.analytics.getResultFiles(resultId); }
  deleteResultFile(fileId: string) { return this.analytics.deleteResultFile(fileId); }
  addResultFile(resultId: string, data: { fileName: string; fileUrl: string; fileSize?: number; mimeType?: string }) { return this.analytics.addResultFile(resultId, data); }

  // ─── Files ────────────────────────────────────────────────────────────────

  getCardFiles(cardId: string) { return this.analytics.getCardFiles(cardId); }
  createFile(data: { cardId: string; fileName: string; fileUrl: string; fileSize?: number; mimeType?: string; uploadedById?: number }) { return this.analytics.createFile(data); }
  deleteFile(fileId: string) { return this.analytics.deleteFile(fileId); }

  // ─── Analytics & Stats ────────────────────────────────────────────────────

  getTaskStats(boardId?: string) { return this.analytics.getTaskStats(boardId); }
  getTeamMetrics(boardId?: string) { return this.analytics.getTeamMetrics(boardId); }
  getOverdueInbox(boardId?: string) { return this.analytics.getOverdueInbox(boardId); }
  getEmployees() { return this.analytics.getEmployees(); }

  // ─── Legacy helpers ───────────────────────────────────────────────────────

  getSprintInfo() { return this.analytics.getSprintInfo(); }
  getMembers() { return this.analytics.getMembers(); }
  getOverdueCards() { return this.analytics.getOverdueCards(); }
  getCardsByEmployee(employeeId: string) { return this.analytics.getCardsByEmployee(employeeId); }
  getProductivityReport() { return this.analytics.getProductivityReport(); }
  getOverdueReport() { return this.analytics.getOverdueReport(); }
  getAnalyticsSummary() { return this.analytics.getAnalyticsSummary(); }
  getEmployeePerformance() { return this.analytics.getEmployeePerformance(); }
}
