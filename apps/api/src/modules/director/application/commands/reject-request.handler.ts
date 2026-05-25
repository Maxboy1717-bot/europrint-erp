/**
 * @module reject-request.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { AppErr, Err, isErr, Ok, Result, safeCall } from '@common/result';
import { ApprovalRequest } from '../../domain/aggregates/approval-request.aggregate';
import { APPROVAL_REPO, IApprovalRepo } from '../../domain/repositories/i-approval.repo';
import { RejectRequestCommand } from './reject-request.command';
import { HitlRejectedEvent } from '../../domain/events/hitl-rejected.event';

@CommandHandler(RejectRequestCommand)
export class RejectRequestHandler implements ICommandHandler<RejectRequestCommand> {
  private readonly logger = new Logger(RejectRequestHandler.name);

  constructor(
    @Inject(APPROVAL_REPO) private readonly approvalRepo: IApprovalRepo,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: RejectRequestCommand): Promise<Result<ApprovalRequest>> {
    const findResult = await this.approvalRepo.findById(command.id);
    if (!findResult.ok) return Err(AppErr('NOT_FOUND', String(findResult.error)));

    const approval = findResult.data;
    const rejectResult = await safeCall(async () => { approval.reject(command.userId, command.reason); }, 'FORBIDDEN');
    if (isErr(rejectResult)) return Err(AppErr('FORBIDDEN', rejectResult.error.message));

    const updateResult = await this.approvalRepo.update(command.id, {
      status: approval.status,
      rejectedBy: approval.rejectedBy,
      rejectedAt: approval.rejectedAt,
      rejectionReason: approval.rejectionReason,
      updatedAt: approval.updatedAt,
    });
    if (!updateResult.ok) return Err(AppErr('INTERNAL', String(updateResult.error)));

    await this.eventBus.publish(new HitlRejectedEvent(
      approval.id,
      approval.documentType,
      approval.documentId,
      command.userId,
      approval.rejectedAt,
      command.reason,
    ));

    this.logger.log(`Tasdiqlash so'rovi rad etildi: ${approval.id}`);
    return Ok(updateResult.data);
  }
}
