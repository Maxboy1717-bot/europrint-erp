/**
 * @module get-reclamation-by-id.handler
 * @description CQRS query handler: fetch single qc_reclamations row by id via the
 *   canonical integer-PK repository. Returns Ok(null) when not found — controller
 *   uses unwrapOrNotFoundDefined to surface a 404 in that case.
 */

import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { Result } from '@common/types/result.type';
import { DrizzleQcReclamationRepo } from '../../infrastructure/repositories/drizzle-qc-reclamation.repo';
import { Reclamation } from '../../domain/aggregates/reclamation.aggregate';
import { GetReclamationByIdQuery } from './get-reclamation-by-id.query';

@Injectable()
@QueryHandler(GetReclamationByIdQuery)
export class GetReclamationByIdHandler implements IQueryHandler<GetReclamationByIdQuery> {
  private readonly logger = new Logger(GetReclamationByIdHandler.name);

  constructor(private readonly reclamationRepo: DrizzleQcReclamationRepo) {}

  async execute(query: GetReclamationByIdQuery): Promise<Result<Reclamation | null>> {
    const result = await this.reclamationRepo.findReclamationById(query.id);
    this.logger.log(`Reclamation id=${query.id} ${result.ok && result.data ? 'found' : 'not found'}`);
    return result;
  }
}
