/**
 * @module drizzle-kanban-analytics.repo
 * @description Analytics kanban repository facade — delegates to two sub-repos
 *   to keep this file under 300 lines (Rule 16). Public method names + signatures
 *   are unchanged so existing consumers (`drizzle-kanban-ext.repo`,
 *   `kanban.module`) need no modifications.
 *
 *   Sub-repos:
 *     - DrizzleKanbanResultsFilesRepository — Results + Files CRUD
 *     - DrizzleKanbanStatsRepository       — Analytics, stats, legacy helpers
 */

import { Injectable } from '@nestjs/common';
import { Result } from '@common/result';
import { DrizzleKanbanResultsFilesRepository } from './drizzle-kanban-results-files.repo';
import { DrizzleKanbanStatsRepository } from './drizzle-kanban-stats.repo';

@Injectable()
export class DrizzleKanbanAnalyticsRepository {
  constructor(
    private readonly resultsFiles: DrizzleKanbanResultsFilesRepository,
    private readonly stats: DrizzleKanbanStatsRepository,
  ) {}

  // ─── Results ──────────────────────────────────────────────────────────────

  getCardResults(cardId: string): Promise<Result<Record<string, unknown>[]>> {
    return this.resultsFiles.getCardResults(cardId);
  }

  createResult(cardId: string, createdById: number, description?: string): Promise<Result<Record<string, unknown>>> {
    return this.resultsFiles.createResult(cardId, createdById, description);
  }

  getResultFiles(resultId: string): Promise<Result<Record<string, unknown>[]>> {
    return this.resultsFiles.getResultFiles(resultId);
  }

  deleteResultFile(fileId: string): Promise<Result<void>> {
    return this.resultsFiles.deleteResultFile(fileId);
  }

  addResultFile(resultId: string, data: {
    fileName: string; fileUrl: string; fileSize?: number; mimeType?: string;
  }): Promise<Result<Record<string, unknown>>> {
    return this.resultsFiles.addResultFile(resultId, data);
  }

  // ─── Files ────────────────────────────────────────────────────────────────

  getCardFiles(cardId: string): Promise<Result<Record<string, unknown>[]>> {
    return this.resultsFiles.getCardFiles(cardId);
  }

  createFile(data: {
    cardId: string; fileName: string; fileUrl: string;
    fileSize?: number; mimeType?: string; uploadedById?: number;
  }): Promise<Result<Record<string, unknown>>> {
    return this.resultsFiles.createFile(data);
  }

  deleteFile(fileId: string): Promise<Result<void>> {
    return this.resultsFiles.deleteFile(fileId);
  }

  // ─── Analytics & Stats ────────────────────────────────────────────────────

  getTaskStats(boardId?: string): Promise<Result<Record<string, unknown>>> {
    return this.stats.getTaskStats(boardId);
  }

  getTeamMetrics(boardId?: string): Promise<Result<Record<string, unknown>>> {
    return this.stats.getTeamMetrics(boardId);
  }

  getOverdueInbox(boardId?: string): Promise<Result<Record<string, unknown>[]>> {
    return this.stats.getOverdueInbox(boardId);
  }

  getEmployees(): Promise<Result<Record<string, unknown>[]>> {
    return this.stats.getEmployees();
  }

  getResourceAllocation(boardId?: string): Promise<Result<Record<string, unknown>[]>> {
    return this.stats.getResourceAllocation(boardId);
  }

  // ─── Legacy helpers (keeping for backward compatibility) ──────────────────

  getSprintInfo(): Promise<Result<Record<string, unknown>>> {
    return this.stats.getSprintInfo();
  }

  getMembers(): Promise<Result<Record<string, unknown>[]>> {
    return this.stats.getMembers();
  }

  getOverdueCards(): Promise<Result<Record<string, unknown>[]>> {
    return this.stats.getOverdueCards();
  }

  getCardsByEmployee(employeeId: string): Promise<Result<Record<string, unknown>[]>> {
    return this.stats.getCardsByEmployee(employeeId);
  }

  getProductivityReport(): Promise<Result<Record<string, unknown>>> {
    return this.stats.getProductivityReport();
  }

  getOverdueReport(): Promise<Result<Record<string, unknown>>> {
    return this.stats.getOverdueReport();
  }

  getAnalyticsSummary(): Promise<Result<Record<string, unknown>>> {
    return this.stats.getAnalyticsSummary();
  }

  getEmployeePerformance(): Promise<Result<Record<string, unknown>[]>> {
    return this.stats.getEmployeePerformance();
  }
}
