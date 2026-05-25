/**
 * @module get-materials.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Injectable, Inject, Logger } from '@nestjs/common';
import { Result, Ok, Err } from '@common/result';
import { GetMaterialsQuery } from './get-materials.query';
import { Material } from '../../domain/aggregates/material.aggregate';
import { IMmMaterialRepository, MM_MATERIAL_REPO } from '../../infrastructure/repositories/drizzle-material.repo';

@Injectable()
@QueryHandler(GetMaterialsQuery)
export class GetMaterialsHandler implements IQueryHandler<GetMaterialsQuery> {
  private readonly logger = new Logger(GetMaterialsHandler.name);

  constructor(
    @Inject(MM_MATERIAL_REPO) private readonly materialRepository: IMmMaterialRepository,
      ) {}

  async execute(query: GetMaterialsQuery): Promise<Result<{ data: Material[]; pagination: Record<string, unknown> }>> {
      const result = await this.materialRepository.findAll({
        category: query.category,
        isActive: query.isActive,
        lowStock: query.lowStock,
        page: query.page,
        limit: query.limit,
      });

      if (!result.ok || !result.data) {
        this.logger.error('Failed to fetch materials');
        return Err(result.error ?? { code: 'INTERNAL' as const, message: 'Failed to fetch materials' });
      }

      const { data, total } = result.data;
      return Ok({
        data,
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages: Math.ceil(total / query.limit),
        },
      });
  }
}
