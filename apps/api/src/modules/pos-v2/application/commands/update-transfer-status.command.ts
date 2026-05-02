import { Injectable, Logger, Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Result, Ok as ok, Err as err, isErr, Err } from '@common/result';
import { TransferRequest, RequestStatus } from '../../domain/aggregates/transfer-request.aggregate';
import { IPosV2Repo, POS_V2_REPO } from '../../domain/repositories/i-pos-v2.repo';

export class UpdateTransferStatusCommand {
  constructor(public readonly requestId: string,
    public readonly newStatus: RequestStatus,
    public readonly userId?: string) {}
}

@CommandHandler(UpdateTransferStatusCommand)
@Injectable()
export class UpdateTransferStatusHandler implements ICommandHandler<UpdateTransferStatusCommand> {
  private readonly logger = new Logger(UpdateTransferStatusHandler.name);

  constructor(@Inject(POS_V2_REPO) private readonly repo: IPosV2Repo) {}

  async execute(command: UpdateTransferStatusCommand): Promise<Result<TransferRequest>> {
    try {
      // Get the current request
      const requestResult = await this.repo.findRequestById(command.requestId);

      if (isErr(requestResult)) {
        this.logger.error('Request not found', command.requestId);
        return err(requestResult.error);
      }

      const request = requestResult.data;

      // Validate status transition
      const validTransitions: Record<RequestStatus, RequestStatus[]> = {
        [RequestStatus.PENDING]: [RequestStatus.APPROVED, RequestStatus.REJECTED],
        [RequestStatus.APPROVED]: [RequestStatus.IN_TRANSIT, RequestStatus.REJECTED],
        [RequestStatus.IN_TRANSIT]: [RequestStatus.COMPLETED],
        [RequestStatus.COMPLETED]: [],
        [RequestStatus.REJECTED]: [],
      };

      if (!validTransitions[request.status].includes(command.newStatus)) {
        return err({
          message: `Cannot transition from ${request.status} to ${command.newStatus}`,
          code: 'INVALID_TRANSITION',
        });
      }

      // Update status based on new status
      if (command.newStatus === RequestStatus.APPROVED) {
        request.approve(command.userId || 'system');
      } else if (command.newStatus === RequestStatus.IN_TRANSIT) {
        request.startTransit();
      } else if (command.newStatus === RequestStatus.COMPLETED) {
        request.complete();
      } else if (command.newStatus === RequestStatus.REJECTED) {
        request.reject();
      }

      // Update in database
      const result = await this.repo.updateRequestStatus(
        command.requestId,
        command.newStatus,
        command.newStatus === RequestStatus.APPROVED ? command.userId : undefined,
      );

      if (isErr(result)) {
        this.logger.error('Failed to update request status', result.error);
        return err(result.error);
      }

      this.logger.log(
        `Transfer request ${request.requestNumber} status updated to ${command.newStatus}`,
      );

      return ok(result.data);
    } catch (error: unknown) {
      this.logger.error('Failed to update transfer status:', error);
      return err({
        message: 'Failed to update transfer status',
        code: 'UPDATE_STATUS_ERROR',
      });
    }
  }
}
