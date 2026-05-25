/**
 * @module delete-leave.handler
 * @description CQRS handler — soft-deletes a leave request through the HR repo.
 * PA1-11 — moves the previous direct `hrRepo.updateLeave({ status:'deleted' })`
 * write out of the controller and behind the CommandBus.
 */

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { Result, Ok, Err } from '@common/types/result.type';
import { DeleteLeaveCommand } from './delete-leave.command';
import { HR_REPO, IHrRepo } from '../../domain/repositories/i-hr.repo';

@CommandHandler(DeleteLeaveCommand)
export class DeleteLeaveHandler implements ICommandHandler<DeleteLeaveCommand> {
  private readonly logger = new Logger(DeleteLeaveHandler.name);

  constructor(@Inject(HR_REPO) private readonly repo: IHrRepo) {}

  async execute(command: DeleteLeaveCommand): Promise<Result<{ deleted: true; id: string }>> {
    this.logger.log(`Soft-deleting leave request: ${command.leaveId}`);

    const findResult = await this.repo.findLeaveById(command.leaveId);
    if (!findResult.ok || findResult.data == null) {
      return Err(`Ta'til so'rovi topilmadi: ${command.leaveId}`);
    }

    const updateResult = await this.repo.updateLeave(command.leaveId, {
      status: 'deleted',
      deleted_at: new Date().toISOString(),
    });
    if (!updateResult.ok) {
      return Err(`Ta'til so'rovini o'chirib bo'lmadi: ${command.leaveId}`);
    }

    return Ok({ deleted: true as const, id: command.leaveId });
  }
}
