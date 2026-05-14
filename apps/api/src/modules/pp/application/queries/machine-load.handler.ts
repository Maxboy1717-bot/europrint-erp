/**
 * @module machine-load.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { Result } from '@common/result';
import { IPpRepository } from '../../domain/repositories/pp.repository';

export class MachineLoadQuery {
  constructor(public workCenterId: number) {}
}

@QueryHandler(MachineLoadQuery)
export class MachineLoadHandler implements IQueryHandler<MachineLoadQuery> {
  private readonly logger = new Logger(MachineLoadHandler.name);
  constructor(
    @Inject('IPpRepository') private ppRepo: IPpRepository
  ) {}

  async execute(query: MachineLoadQuery): Promise<Result<object[]>> {
    this.logger.log('Getting machine load');

    return this.ppRepo.getMachineLoad(query.workCenterId);
  }
}
