/**
 * @module reports-hub.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Logger, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { dbRows } from '../hr/common/db-rows';
import { safeCall, Result, AppError, Ok } from '@common/result';
import { ReportsHubRepository } from './reports-hub.repository';
import { MAX_QUERY_LIMIT } from '@common/constants/app.constants';

@Injectable()
export class ReportsHubService {
  private readonly logger = new Logger(ReportsHubService.name);

  constructor(
    private readonly repo: ReportsHubRepository,
    private readonly i18n: I18nService,
  ) {}

  async getDashboard(): Promise<Result<object, AppError>> {
    const [categoriesR, definitionsR, runsR, recentRunsR] = await Promise.all([
      safeCall(() => this.repo.getCategoryCount()),
      safeCall(() => this.repo.getDefinitionStats()),
      safeCall(() => this.repo.getRunStats()),
      safeCall(() => this.repo.getRecentRuns()),
    ]);
    if (!categoriesR.ok)  this.logger.warn(`getDashboard categories: ${categoriesR.error}`);
    if (!definitionsR.ok) this.logger.warn(`getDashboard definitions: ${definitionsR.error}`);
    if (!runsR.ok)        this.logger.warn(`getDashboard runs: ${runsR.error}`);
    if (!recentRunsR.ok)  this.logger.warn(`getDashboard recentRuns: ${recentRunsR.error}`);
    return Ok({
      categories:  categoriesR.ok  ? (dbRows(categoriesR.data)[0]  ?? null) : null,
      definitions: definitionsR.ok ? (dbRows(definitionsR.data)[0] ?? null) : null,
      runs:        runsR.ok        ? (dbRows(runsR.data)[0]        ?? null) : null,
      recentRuns:  recentRunsR.ok  ? dbRows(recentRunsR.data)              : [],
    });
  }

  async getCategories() {
    const r = await safeCall(() => this.repo.getCategories());
    if (!r.ok) { this.logger.warn(`getCategories: ${r.error}`); throw new InternalServerErrorException(String(r.error)); }
    return r.data;
  }

  async getDefinitions(q: Record<string, string>) {
    const categoryId  = q['categoryId'] ? parseInt(q['categoryId'], 10) : null;
    const schedule    = q['schedule'] ?? null;
    const isActiveStr = q['isActive'];
    const isActive: boolean | null = isActiveStr !== undefined ? isActiveStr === 'true' : null;
    const r = await safeCall(() => this.repo.getDefinitions(categoryId, schedule, isActive));
    if (!r.ok) { this.logger.warn(`getDefinitions: ${r.error}`); throw new InternalServerErrorException(String(r.error)); }
    return r.data;
  }

  async createDefinition(body: Record<string, unknown>) {
    const r = await safeCall(() => this.repo.createDefinition(body));
    if (!r.ok) { this.logger.error(`createDefinition: ${r.error}`); throw new InternalServerErrorException(String(r.error)); }
    return r.data;
  }

  async getRuns(q: Record<string, string>) {
    const reportId = q['reportId'] ? parseInt(q['reportId'], 10) : null;
    const status   = q['status'] ?? null;
    const limit    = Math.min(parseInt(q['limit'] ?? '50', 10), MAX_QUERY_LIMIT);
    const r = await safeCall(() => this.repo.getRuns(reportId, status, limit));
    if (!r.ok) { this.logger.warn(`getRuns: ${r.error}`); throw new InternalServerErrorException(String(r.error)); }
    return r.data;
  }

  async getRun(runId: string) {
    const r = await safeCall(() => this.repo.getRun(parseInt(runId, 10)));
    if (!r.ok) { this.logger.warn(`getRun(${runId}): ${r.error}`); throw new InternalServerErrorException(String(r.error)); }
    return r.data;
  }

  async generateReport(definitionId: string, userId: number) {
    const defId = parseInt(definitionId, 10);
    const defR  = await safeCall(() => this.repo.findDefinition(defId));
    if (!defR.ok) { this.logger.error(`generateReport def: ${defR.error}`); throw new NotFoundException(await this.i18n.t('errors.reportDefinitionNotFound')); }
    if (!defR.data) throw new NotFoundException(await this.i18n.t('errors.reportDefinitionNotFound'));
    const runR = await safeCall(() => this.repo.insertRun(defId, userId));
    if (!runR.ok) { this.logger.error(`generateReport run: ${runR.error}`); throw new InternalServerErrorException(String(runR.error)); }
    return runR.data;
  }

  async seedCategories() {
    const count = await this.repo.countCategories();
    if (!count.ok) { this.logger.warn(`seedCategories check: ${count.error}`); return { message: 'Seed check failed' }; }
    if ((count.data as number) > 0) return { message: 'Categories already seeded' };
    const r = await safeCall(() => this.repo.seedCategoriesData());
    if (!r.ok) { this.logger.error(`seedCategories insert: ${r.error}`); return { message: 'Seed failed' }; }
    return { message: 'Categories seeded successfully' };
  }

  async getSubscriptions(userId: number) {
    const r = await safeCall(() => this.repo.getSubscriptions(userId));
    if (!r.ok) { this.logger.warn(`getSubscriptions(${userId}): ${r.error}`); throw new InternalServerErrorException(String(r.error)); }
    return r.data;
  }

  async createSubscription(body: Record<string, unknown>, userId: number) {
    const r = await safeCall(() => this.repo.createSubscription(body, userId));
    if (!r.ok) { this.logger.error(`createSubscription: ${r.error}`); throw new InternalServerErrorException(String(r.error)); }
    return r.data;
  }

  async deleteSubscription(id: string, userId: number) {
    const r = await safeCall(() => this.repo.deleteSubscription(parseInt(id, 10), userId));
    if (!r.ok) this.logger.error(`deleteSubscription(${id}): ${r.error}`);
    return { success: r.ok };
  }
}
