/**
 * @module patch-rental.handler
 * @description CQRS handler — partial update for a rental record. Thin wrapper
 * over WmsCrudRepository.patchRentalRecord so the controller can dispatch
 * writes through the CommandBus (PA1-11 — one path per write).
 */

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { Result } from '@common/result';
import { WmsCrudRepository } from '../wms-crud.repository';

export class PatchRentalCommand {
  constructor(
    public readonly id: number,
    public readonly body: Record<string, unknown>,
  ) {}
}

@Injectable()
@CommandHandler(PatchRentalCommand)
export class PatchRentalHandler implements ICommandHandler<PatchRentalCommand> {
  private readonly logger = new Logger(PatchRentalHandler.name);

  constructor(private readonly repo: WmsCrudRepository) {}

  async execute(command: PatchRentalCommand): Promise<Result<Record<string, unknown>>> {
    this.logger.log({ msg: 'Patching rental record', id: command.id });
    return this.repo.patchRentalRecord(command.id, command.body);
  }
}
