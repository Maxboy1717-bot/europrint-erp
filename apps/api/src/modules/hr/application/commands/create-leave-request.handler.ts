/**
 * @module create-leave-request.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { Result, Err , Ok } from '@common/types/result.type';
import { CreateLeaveRequestCommand } from './create-leave-request.command';
import { LeaveRequest, LeaveStatus, LeaveType } from '../../domain/aggregates/leave-request.aggregate';
import { HR_REPO } from '../../domain/repositories/i-hr.repo';
import { IHrRepo } from '../../domain/repositories/i-hr.repo';

@CommandHandler(CreateLeaveRequestCommand)
export class CreateLeaveRequestHandler
  implements ICommandHandler<CreateLeaveRequestCommand>
{
  private readonly logger = new Logger(CreateLeaveRequestHandler.name);

  constructor(@Inject(HR_REPO) private readonly repo: IHrRepo) {}

  async execute(
    command: CreateLeaveRequestCommand,
  ): Promise<Result<LeaveRequest>> {
      this.logger.log(
        `Creating leave request for employee: ${command.employeeId}`,
      );

      const daysRequested = LeaveRequest.calcWorkDays(
        command.startDate,
        command.endDate,
      );

      if (command.leaveType === LeaveType.ANNUAL) {
        const balanceResult = await this.repo.getLeaveBalance(
          command.employeeId,
        );

        if (!balanceResult.ok) {
          return Err('Could not check leave balance');
        }

        const remaining = balanceResult.data.annual.remaining;
        if (remaining < daysRequested) {
          return Err(`Insufficient annual leave. Remaining: ${remaining}, Requested: ${daysRequested}`);
        }
      }

      const leaveRequest = new LeaveRequest(
        crypto.randomUUID(),
        command.employeeId,
        command.userId,
        command.leaveType as LeaveType,
        command.startDate,
        command.endDate,
        daysRequested,
        LeaveStatus.PENDING,
        command.reason,
        null,
        null,
        null,
        null,
        _time.now(),
        _time.now(),
      );

      const saveResult = await this.repo.saveLeave({
        id: leaveRequest.id,
        employeeId: leaveRequest.employeeId,
        userId: leaveRequest.userId,
        leaveType: leaveRequest.leaveType,
        startDate: leaveRequest.startDate,
        endDate: leaveRequest.endDate,
        daysRequested: leaveRequest.daysRequested,
        status: leaveRequest.status,
        reason: leaveRequest.reason,
        approvedBy: leaveRequest.approvedBy,
        approvedAt: leaveRequest.approvedAt,
        rejectedBy: leaveRequest.rejectedBy,
        rejectionReason: leaveRequest.rejectionReason,
        createdAt: leaveRequest.createdAt,
        updatedAt: leaveRequest.updatedAt,
      });

      if (!saveResult.ok) {
        return Err(`Failed to save leave request: ${saveResult.error}`);
      }

      return Ok(leaveRequest);
  }
}
