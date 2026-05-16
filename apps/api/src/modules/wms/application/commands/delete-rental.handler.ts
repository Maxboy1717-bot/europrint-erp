/**
 * @module delete-rental.handler
 * @description CQRS handler — soft-deletes a rental record. Thin wrapper over
 * WmsCrudRepository.softDeleteRentalRecord so the controller can dispatch
 * writes through the CommandBus (PA1-11 — one path per write).
 */

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Result } from '@common/result';
import { WMS_CRUD_REPO, type IWmsCrudRepo } from '../../domain/repositories/i-wms-crud.repo';

export class DeleteRentalCommand {
  constructor(
    public readonly id: number,
    public readonly userId: number | null,
  ) {}
}

@Injectable()
@CommandHandler(DeleteRentalCommand)
export class DeleteRentalHandler implements ICommandHandler<DeleteRentalCommand> {
  private readonly logger = new Logger(DeleteRentalHandler.name);

  constructor(@Inject(WMS_CRUD_REPO) private readonly repo: IWmsCrudRepo) {}

  async execute(command: DeleteRentalCommand): Promise<Result<Record<string, unknown>>> {
    this.logger.log({ msg: 'Soft-deleting rental record', id: command.id, userId: command.userId });
    return this.repo.softDeleteRentalRecord(command.id, command.userId);
  }
}
