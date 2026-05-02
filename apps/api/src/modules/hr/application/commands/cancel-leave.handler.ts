import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { Result, Err , Ok } from '@common/types/result.type';
import { CancelLeaveCommand } from './cancel-leave.command';
import { LeaveRequest } from '../../domain/aggregates/leave-request.aggregate';
import { HR_REPO } from '../../domain/repositories/i-hr.repo';
import { IHrRepo } from '../../domain/repositories/i-hr.repo';

@CommandHandler(CancelLeaveCommand)
export class CancelLeaveHandler implements ICommandHandler<CancelLeaveCommand> {
  private readonly logger = new Logger(CancelLeaveHandler.name);

  constructor(@Inject(HR_REPO) private readonly repo: IHrRepo) {}

  async execute(command: CancelLeaveCommand): Promise<Result<LeaveRequest>> {
      this.logger.log(`Cancelling leave request: ${command.leaveId}`);

      const findResult = await this.repo.findLeaveById(command.leaveId);

      if (!findResult.ok) {
        return Err('Leave request not found');
      }

      const leaveData = findResult.data;
      if (!leaveData) return Err('Leave request not found');

      if (
        String(leaveData['userId']) !== command.cancellerId &&
        !['HR_MANAGER', 'SUPER_ADMIN', 'DIRECTOR'].includes(
          command.cancellerId,
        )
      ) {
        return Err('Only the leave owner or HR manager can cancel this leave');
      }

      const leaveRequest = new LeaveRequest(
        String(leaveData['id']),
        String(leaveData['employeeId']),
        String(leaveData['userId']),
        String(leaveData['leaveType']) as import('../../domain/aggregates/leave-request.aggregate').LeaveType,
        leaveData['startDate'] as Date,
        leaveData['endDate'] as Date,
        leaveData['daysRequested'] as number,
        String(leaveData['status']) as import('../../domain/aggregates/leave-request.aggregate').LeaveStatus,
        String(leaveData['reason'] ?? ''),
        leaveData['approvedBy'] != null ? String(leaveData['approvedBy']) : null,
        leaveData['approvedAt'] instanceof Date ? leaveData['approvedAt'] : leaveData['approvedAt'] != null ? new Date(String(leaveData['approvedAt'])) : null,
        leaveData['rejectedBy'] != null ? String(leaveData['rejectedBy']) : null,
        leaveData['rejectionReason'] != null ? String(leaveData['rejectionReason']) : null,
        leaveData['createdAt'] as Date,
        leaveData['updatedAt'] as Date,
      );

      leaveRequest.cancel();

      const updateResult = await this.repo.updateLeave(command.leaveId, {
        status: leaveRequest.status,
        updatedAt: leaveRequest.updatedAt,
      });

      if (!updateResult.ok) {
        return Err(`Failed to update leave request: ${updateResult.error}`);
      }

      return Ok(leaveRequest);
  }
}
