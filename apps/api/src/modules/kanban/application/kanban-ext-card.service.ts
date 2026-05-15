/**
 * @module kanban-ext-card.service
 * @description Card-centric sub-service — Checklists, Comments, Watchers,
 *   Notifications, Results, Files, Accept/Complete, flat-card create.
 *   Split out of `KanbanExtService` so the parent facade file stays under 300
 *   lines (Rule 16). Returns Result<T>.
 */

import { Injectable } from '@nestjs/common';
import { Result } from '@common/result';
import { DrizzleKanbanExtRepository } from '../infrastructure/repositories/drizzle-kanban-ext.repo';

@Injectable()
export class KanbanExtCardService {
  constructor(private readonly repo: DrizzleKanbanExtRepository) {}

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

  // ─── Accept / Complete & flat card create ────────────────────────────────

  acceptCard(cardId: string, userId: number): Promise<Result<Record<string, unknown>>> {
    return this.repo.acceptCard(cardId, userId);
  }

  completeCard(cardId: string, userId: number, completionReport?: string): Promise<Result<Record<string, unknown>>> {
    return this.repo.completeCard(cardId, userId, completionReport);
  }

  createCardFlat(body: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    return this.repo.createCardFlat(body);
  }
}
