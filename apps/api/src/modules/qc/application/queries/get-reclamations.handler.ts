/**
 * @module get-reclamations.handler
 * @description CQRS query handler. Lists qc_reclamations via the canonical
 *   integer-PK repository (DrizzleQcReclamationRepo). Previously this handler
 *   queried `quality_defects_camera` — a copy/paste from GetDefectsHandler that
 *   never touched the reclamations table (Q-46 dead/broken-code fix).
 */

import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { DrizzleQcReclamationRepo } from '../../infrastructure/repositories/drizzle-qc-reclamation.repo';
import { GetReclamationsQuery } from './get-reclamations.query';

type ReclamationsResponse = { ok: boolean; data: { data: Record<string, unknown>[]; pagination: { page: number; limit: number; total: number; totalPages: number } } };

@Injectable()
@QueryHandler(GetReclamationsQuery)
export class GetReclamationsHandler implements IQueryHandler<GetReclamationsQuery, ReclamationsResponse> {
  private readonly logger = new Logger(GetReclamationsHandler.name);

  constructor(private readonly reclamationRepo: DrizzleQcReclamationRepo) {}

  async execute(query: GetReclamationsQuery): Promise<ReclamationsResponse> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const result = await this.reclamationRepo.findReclamations({
      status: query.status,
      severity: query.severity,
      from: query.from,
      to: query.to,
      page,
      limit,
    });
    if (!result.ok) {
      this.logger.error('Failed to list reclamations');
      return { ok: false, data: { data: [], pagination: { page, limit, total: 0, totalPages: 0 } } };
    }
    const { data, total } = result.data;
    this.logger.log({ page, limit, total }, 'Reclamations retrieved');
    return { ok: true, data: { data: data as unknown as Record<string, unknown>[], pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } } };
  }
}
