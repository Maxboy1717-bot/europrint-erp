import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AppErr, Err, isErr, Ok, Result, safeCall } from '@common/result';
import { ApprovalRequest } from '../../domain/aggregates/approval-request.aggregate';
import { APPROVAL_REPO, IApprovalRepo } from '../../domain/repositories/i-approval.repo';
import { RejectRequestCommand } from './reject-request.command';
import { ERP_EVENTS } from '@common/constants/erp-events.constants';

@CommandHandler(RejectRequestCommand)
export class RejectRequestHandler implements ICommandHandler<RejectRequestCommand> {
  private readonly logger = new Logger(RejectRequestHandler.name);

  constructor(
    @Inject(APPROVAL_REPO) private readonly approvalRepo: IApprovalRepo,
    private readonly eventEmitter: EventEmitter2,
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

    this.eventEmitter.emit(ERP_EVENTS.HITL_REJECTED, {
      id: approval.id,
      documentType: approval.documentType,
      documentId: approval.documentId,
      rejectedBy: command.userId,
      rejectedAt: approval.rejectedAt,
      reason: command.reason,
    });

    this.logger.log(`Tasdiqlash so'rovi rad etildi: ${approval.id}`);
    return Ok(updateResult.data);
  }
}
