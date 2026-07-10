/**
 * @module drizzle-kanban-core.repo
 * @description Core kanban repository facade — delegates to two sub-repos to
 *   keep this file under 300 lines (Rule 16). Public method names + signatures
 *   are unchanged so existing consumers (kanban-ext.repo, kanban.module) need
 *   no modifications.
 *
 *   Sub-repos:
 *     - DrizzleKanbanFlowsRobotsRepository — Flows, Robots, Board-level ops
 *     - DrizzleKanbanCardsRepository       — Checklists, Comments, Watchers,
 *                                            Card create / Accept / Complete
 */

import { Injectable } from '@nestjs/common';
import { Result } from '@common/result';
import { DrizzleKanbanFlowsRobotsRepository } from './drizzle-kanban-flows-robots.repo';
import { DrizzleKanbanCardsRepository } from './drizzle-kanban-cards.repo';

@Injectable()
export class DrizzleKanbanCoreRepository {
  constructor(
    private readonly flowsRobots: DrizzleKanbanFlowsRobotsRepository,
    private readonly cards: DrizzleKanbanCardsRepository,
  ) {}

  // ─── Flows ────────────────────────────────────────────────────────────────

  getFlowsByBoard(boardId: string): Promise<Result<Record<string, unknown>[]>> {
    return this.flowsRobots.getFlowsByBoard(boardId);
  }

  createFlow(data: {
    boardId: string; name: string; description?: string;
    assignmentType?: string; userIds?: string[];
  }): Promise<Result<Record<string, unknown>>> {
    return this.flowsRobots.createFlow(data);
  }

  getFlowById(id: string): Promise<Result<Record<string, unknown> | null>> {
    return this.flowsRobots.getFlowById(id);
  }

  updateFlow(id: string, name: string, description: string): Promise<Result<Record<string, unknown>>> {
    return this.flowsRobots.updateFlow(id, name, description);
  }

  deleteFlow(id: string): Promise<Result<void>> {
    return this.flowsRobots.deleteFlow(id);
  }

  // ─── Robots ───────────────────────────────────────────────────────────────

  getRobotsByBoard(boardId: string): Promise<Result<Record<string, unknown>[]>> {
    return this.flowsRobots.getRobotsByBoard(boardId);
  }

  createRobot(data: {
    boardId: string; name: string; trigger: string; actions: unknown[];
  }): Promise<Result<Record<string, unknown>>> {
    return this.flowsRobots.createRobot(data);
  }

  getRobotById(id: string): Promise<Result<Record<string, unknown> | null>> {
    return this.flowsRobots.getRobotById(id);
  }

  updateRobot(id: string, name: string, isActive: boolean): Promise<Result<Record<string, unknown>>> {
    return this.flowsRobots.updateRobot(id, name, isActive);
  }

  deleteRobot(id: string): Promise<Result<void>> {
    return this.flowsRobots.deleteRobot(id);
  }

  // ─── Board board-level ────────────────────────────────────────────────────

  updateBoardFlows(boardId: string, name: string): Promise<Result<Record<string, unknown>>> {
    return this.flowsRobots.updateBoardFlows(boardId, name);
  }

  deleteBoardFlows(boardId: string): Promise<Result<void>> {
    return this.flowsRobots.deleteBoardFlows(boardId);
  }

  // ─── Checklists ───────────────────────────────────────────────────────────

  getCardChecklists(cardId: string): Promise<Result<Record<string, unknown>[]>> {
    return this.cards.getCardChecklists(cardId);
  }

  createChecklist(cardId: string, title: string): Promise<Result<Record<string, unknown>>> {
    return this.cards.createChecklist(cardId, title);
  }

  updateChecklist(id: string, title: string): Promise<Result<Record<string, unknown>>> {
    return this.cards.updateChecklist(id, title);
  }

  deleteChecklist(id: string): Promise<Result<void>> {
    return this.cards.deleteChecklist(id);
  }

  getChecklistItems(checklistId: string): Promise<Result<Record<string, unknown>[]>> {
    return this.cards.getChecklistItems(checklistId);
  }

  createChecklistItem(checklistId: string, title: string): Promise<Result<Record<string, unknown>>> {
    return this.cards.createChecklistItem(checklistId, title);
  }

  updateChecklistItem(
    checklistId: string, itemId: string, title: string, isCompleted: boolean,
  ): Promise<Result<Record<string, unknown>>> {
    return this.cards.updateChecklistItem(checklistId, itemId, title, isCompleted);
  }

  deleteChecklistItem(checklistId: string, itemId: string): Promise<Result<void>> {
    return this.cards.deleteChecklistItem(checklistId, itemId);
  }

  toggleChecklistItem(itemId: string): Promise<Result<Record<string, unknown>>> {
    return this.cards.toggleChecklistItem(itemId);
  }

  // ─── Comments ─────────────────────────────────────────────────────────────

  getCardComments(cardId: string): Promise<Result<Record<string, unknown>[]>> {
    return this.cards.getCardComments(cardId);
  }

  addComment(cardId: string, userId: number, content: string): Promise<Result<Record<string, unknown>>> {
    return this.cards.addComment(cardId, userId, content);
  }

  // ─── Watchers ─────────────────────────────────────────────────────────────

  getCardWatchers(cardId: string): Promise<Result<Record<string, unknown>[]>> {
    return this.cards.getCardWatchers(cardId);
  }

  addWatcher(cardId: string, userId: number): Promise<Result<Record<string, unknown>>> {
    return this.cards.addWatcher(cardId, userId);
  }

  // ─── Card creation / Accept / Complete ────────────────────────────────────

  createCardFlat(data: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    return this.cards.createCardFlat(data);
  }

  acceptCard(cardId: string, userId: number): Promise<Result<Record<string, unknown>>> {
    return this.cards.acceptCard(cardId, userId);
  }

  completeCard(cardId: string, userId: number, completionReport?: string): Promise<Result<Record<string, unknown>>> {
    return this.cards.completeCard(cardId, userId, completionReport);
  }

  rejectCard(cardId: string, userId: number, reason: string): Promise<Result<Record<string, unknown>>> {
    return this.cards.rejectCard(cardId, userId, reason);
  }

  bulkAssignCards(cardIds: number[], ownerUserId: number | null): Promise<Result<{ updated: number; ids: number[] }>> {
    return this.cards.bulkAssignCards(cardIds, ownerUserId);
  }
}
