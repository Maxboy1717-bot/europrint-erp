/**
 * @module approve-leave.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Result, Err , Ok } from '@common/types/result.type';
import { LeaveRequest } from '../../domain/aggregates/leave-request.aggregate';
import { HR_REPO } from '../../domain/repositories/i-hr.repo';
import { IHrRepo } from '../../domain/repositories/i-hr.repo';

export class ApproveLeaveCommand {
  constructor(public readonly leaveId: string,
    public readonly approverId: string,
    public readonly notes?: string) {}
}

@CommandHandler(ApproveLeaveCommand)
export class ApproveLeaveHandler
  implements ICommandHandler<ApproveLeaveCommand>
{
  private readonly logger = new Logger(ApproveLeaveHandler.name);

  constructor(
    @Inject(HR_REPO) private readonly repo: IHrRepo,
    private eventEmitter: EventEmitter2,
  ) {}

  async execute(
    command: ApproveLeaveCommand,
  ): Promise<Result<LeaveRequest>> {
      this.logger.log(`Approving leave request: ${command.leaveId}`);

      const findResult = await this.repo.findLeaveById(command.leaveId);

      if (!findResult.ok) {
        return Err('Leave request not found');
      }

      const leaveData = findResult.data;
      if (!leaveData) return Err('Leave request not found');

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

      leaveRequest.approve(command.approverId);

      const updateResult = await this.repo.updateLeave(command.leaveId, {
        status: leaveRequest.status,
        approvedBy: leaveRequest.approvedBy,
        approvedAt: leaveRequest.approvedAt,
        updatedAt: leaveRequest.updatedAt,
      });

      if (!updateResult.ok) {
        return Err(`Failed to update leave request: ${updateResult.error}`);
      }

      this.eventEmitter.emit('leave.approved', {
        leaveId: leaveRequest.id,
        employeeId: leaveRequest.employeeId,
        approverId: command.approverId,
        approvedAt: leaveRequest.approvedAt,
      });

      return Ok(leaveRequest);
  }
}
