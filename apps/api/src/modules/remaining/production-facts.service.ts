/**
 * @module production-facts.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { safeCall, Result, AppError, Ok } from '@common/result';
import { ProductionFactsRepository } from './production-facts.repository';

@Injectable()
export class ProductionFactsService {
  private readonly logger = new Logger(ProductionFactsService.name);

  constructor(private readonly repo: ProductionFactsRepository) {}

  async getAll(q: Record<string, string>): Promise<Result<object, AppError>> {
    const r = await safeCall(() => this.repo.getAll(
      q['startDate'] ?? null, q['endDate'] ?? null,
      q['papkaNo'] ?? null, q['operatorId'] ?? null, q['workCenterId'] ?? null,
    ));
    if (!r.ok) { this.logger.warn(`getAll: ${r.error}`); return Ok([]); }
    return Ok(r.data);
  }

  async getVariance(q: Record<string, string>) {
    const r = await safeCall(() => this.repo.getVariance(q['startDate'] ?? null, q['endDate'] ?? null));
    if (!r.ok) { this.logger.warn(`getVariance: ${r.error}`); throw new InternalServerErrorException(String(r.error)); }
    return r.data;
  }

  async getOperators() {
    const r = await safeCall(() => this.repo.getOperators());
    if (!r.ok) { this.logger.warn(`getOperators: ${r.error}`); throw new InternalServerErrorException(String(r.error)); }
    return r.data;
  }

  /** 3.3-norma-reja-fakt: kunlik reja-fakt % — production_fact vs work_centers norma. */
  async getPlanFactDashboard(q: Record<string, string>): Promise<Result<object, AppError>> {
    const r = await safeCall(() => this.repo.getPlanFactDashboard(
      q['startDate'] ?? null, q['endDate'] ?? null, q['workCenterId'] ?? null,
    ));
    if (!r.ok) { this.logger.warn(`getPlanFactDashboard: ${r.error}`); return Ok([]); }
    return Ok(r.data);
  }

  async create(body: Record<string, unknown>) {
    const r = await safeCall(() => this.repo.create(body));
    if (!r.ok) { this.logger.error(`create: ${r.error}`); throw new InternalServerErrorException('Ishlab chiqarish fakti yaratishda xatolik'); }
    return r.data;
  }
}
