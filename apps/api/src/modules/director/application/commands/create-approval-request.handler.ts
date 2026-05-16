/**
 * @module create-approval-request.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { Result } from '@common/types/result.type';
import { ApprovalRequest } from '../../domain/aggregates/approval-request.aggregate';
import { APPROVAL_REPO, IApprovalRepo } from '../../domain/repositories/i-approval.repo';
import { ApprovalStatus } from '../../domain/enums/hitl-document-type.enum';
import { CreateApprovalRequestCommand } from './create-approval-request.command';
import { HitlApprovalRequestedEvent } from '../../domain/events/hitl-approval-requested.event';

@CommandHandler(CreateApprovalRequestCommand)
export class CreateApprovalRequestHandler
  implements ICommandHandler<CreateApprovalRequestCommand>
{
  private readonly logger = new Logger(CreateApprovalRequestHandler.name);

  constructor(
    @Inject(APPROVAL_REPO) private readonly approvalRepo: IApprovalRepo,
    private readonly eventBus: EventBus,
  ) {}

  async execute(
    command: CreateApprovalRequestCommand,
  ): Promise<Result<ApprovalRequest>> {
    // Check idempotency: findExistingPending
    const existingResult = await this.approvalRepo.findExistingPending(
      command.documentType,
      command.documentId,
    );

    if (!existingResult.ok) {
      return existingResult as Result<ApprovalRequest>;
    }

    if (existingResult.data) {
      this.logger.warn(
        `Tasdiqlash so'rovi allaqachon mavjud: ${command.documentId}`,
      );
      return {
        ok: true,
        data: existingResult.data,
      };
    }

    // Save new approval request
    const approval = new ApprovalRequest(
      '',
      command.documentType,
      command.documentId,
      command.documentNumber,
      command.amount,
      command.currency,
      ApprovalStatus.PENDING,
      command.requestedBy,
      null,
      null,
      null,
      null,
      null,
      command.notes,
      _time.now(),
      _time.now(),
    );

    const saveResult = await this.approvalRepo.save(approval);

    if (!saveResult.ok) {
      return saveResult;
    }

    // Emit event
    await this.eventBus.publish(new HitlApprovalRequestedEvent(
      saveResult.data.id,
      saveResult.data.documentType,
      saveResult.data.documentId,
      saveResult.data.amount,
      saveResult.data.currency,
      saveResult.data.requestedBy,
      saveResult.data.createdAt,
    ));

    this.logger.log(
      `Tasdiqlash so'rovi yaratildi: ${saveResult.data.id} (${command.documentType})`,
    );

    return saveResult;
  }
}
