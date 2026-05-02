import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AppErr, Err, isErr, Ok, Result, safeCall } from '@common/result';
import { ApprovalRequest } from '../../domain/aggregates/approval-request.aggregate';
import { APPROVAL_REPO, IApprovalRepo } from '../../domain/repositories/i-approval.repo';
import { ApproveRequestCommand } from './approve-request.command';
import { ERP_EVENTS } from '@common/constants/erp-events.constants';

@CommandHandler(ApproveRequestCommand)
export class ApproveRequestHandler implements ICommandHandler<ApproveRequestCommand> {
  private readonly logger = new Logger(ApproveRequestHandler.name);

  constructor(
    @Inject(APPROVAL_REPO) private readonly approvalRepo: IApprovalRepo,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(command: ApproveRequestCommand): Promise<Result<ApprovalRequest>> {
    const findResult = await this.approvalRepo.findById(command.id);
    if (!findResult.ok) return Err(AppErr('NOT_FOUND', String(findResult.error)));

    const approval = findResult.data;
    const approveResult = await safeCall(async () => { approval.approve(command.userId, command.notes); }, 'FORBIDDEN');
    if (isErr(approveResult)) return Err(AppErr('FORBIDDEN', approveResult.error.message));

    const updateResult = await this.approvalRepo.update(command.id, {
      status: approval.status,
      approvedBy: approval.approvedBy,
      approvedAt: approval.approvedAt,
      updatedAt: approval.updatedAt,
    });
    if (!updateResult.ok) return Err(AppErr('INTERNAL', String(updateResult.error)));

    this.eventEmitter.emit(ERP_EVENTS.HITL_APPROVED, {
      id: approval.id,
      documentType: approval.documentType,
      documentId: approval.documentId,
      approvedBy: command.userId,
      approvedAt: approval.approvedAt,
      notes: command.notes,
    });

    this.logger.log(`Tasdiqlash so'rovi tasdiqlandi: ${approval.id}`);
    return Ok(updateResult.data);
  }
}
