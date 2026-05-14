/**
 * @module hr-leave.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import {
  Body, Controller, Delete, Get, HttpCode, HttpStatus, Inject, Param, Patch, Post, Query,
  UseGuards, UseInterceptors, InternalServerErrorException, NotFoundException,
} from '@nestjs/common';
import { assertOk, unwrapOrDefault, unwrapOrThrow } from '@common/http-result';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { ApproveLeaveCommand } from '../application/commands/approve-leave.handler';
import { RejectLeaveCommand } from '../application/commands/reject-leave.command';
import { CancelLeaveCommand } from '../application/commands/cancel-leave.command';
import { CreateLeaveRequestCommand } from '../application/commands/create-leave-request.command';
import { GetLeavesQuery } from '../application/queries/get-leaves.query';
import { GetLeaveBalanceQuery } from '../application/queries/get-leave-balance.query';
import { HR_REPO, IHrRepo } from '../domain/repositories/i-hr.repo';
import {
  CreateLeaveRequestDtoSchema,
  ApproveLeaveDtoSchema,
  RejectLeaveDtoSchema,
  GetLeavesDtoSchema,
} from './dto/leave.dto';

interface AuthenticatedUser { id: number; sub?: number; }

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('hr/leave')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles('EMPLOYEE', 'HR_MANAGER', 'HR_SPECIALIST', 'SUPER_ADMIN', 'DIRECTOR')
export class HrLeaveController {
  constructor(
    private commandBus: CommandBus,
    private queryBus: QueryBus,
    @Inject(HR_REPO) private readonly hrRepo: IHrRepo,
  ) {}

  @Get()
  @Roles('HR_MANAGER', 'SUPER_ADMIN', 'DIRECTOR')
  async getLeaves(@Query() query: Record<string, unknown>) {
    const validated = GetLeavesDtoSchema.parse(query);
    const result = await this.queryBus.execute(
      new GetLeavesQuery(validated.employeeId, validated.status, validated.leaveType, validated.page, validated.limit),
    );
    return unwrapOrDefault(result, { items: [], total: 0 });
  }

  @Get('stats')
  @Roles('HR_MANAGER', 'SUPER_ADMIN', 'DIRECTOR')
  async getLeaveStats() {
    const result = await this.hrRepo.getLeaveStats();
    return unwrapOrDefault(result, { byStatus: {}, byType: {}, currentlyOnLeave: 0 });
  }

  @Get('balance/:employeeId')
  @Roles('HR_MANAGER', 'SUPER_ADMIN', 'DIRECTOR')
  async getLeaveBalance(@Param('employeeId') employeeId: string) {
    const result = await this.queryBus.execute(new GetLeaveBalanceQuery(employeeId));
    return unwrapOrDefault(result, { data: null });
  }

  @Get(':id')
  @Roles('HR_MANAGER', 'SUPER_ADMIN', 'DIRECTOR')
  async getLeaveById(@Param('id') id: string) {
    const result = await this.hrRepo.findLeaveById(id);
    if (!result.ok || result.data == null) {
      throw new NotFoundException(`Ta'til so'rovi topilmadi: ${id}`);
    }
    return result.data;
  }

  @Post()
  @Roles('EMPLOYEE', 'HR_MANAGER', 'SUPER_ADMIN', 'DIRECTOR')
  async createLeaveRequest(@Body() body: Record<string, unknown>, @CurrentUser() user: AuthenticatedUser) {
    const validated = CreateLeaveRequestDtoSchema.parse(body);
    const userId = String(user.id);
    const result = await this.commandBus.execute(
      new CreateLeaveRequestCommand(
        validated.employeeId, userId,
        validated.leaveType, validated.startDate, validated.endDate, validated.reason,
      ),
    );
    assertOk(result);
    return result.data;
  }

  @Patch(':id/approve')
  @Roles('HR_MANAGER', 'SUPER_ADMIN', 'DIRECTOR')
  async approveLeave(
    @Param('id') leaveId: string,
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const validated = ApproveLeaveDtoSchema.parse(body || {});
    const userId = String(user.id);
    const result = await this.commandBus.execute(
      new ApproveLeaveCommand(leaveId, userId, validated.notes),
    );
    assertOk(result);
    return result.data;
  }

  @Patch(':id/reject')
  @Roles('HR_MANAGER', 'SUPER_ADMIN', 'DIRECTOR')
  async rejectLeave(
    @Param('id') leaveId: string,
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const validated = RejectLeaveDtoSchema.parse(body);
    const userId = String(user.id);
    const result = await this.commandBus.execute(
      new RejectLeaveCommand(leaveId, userId, validated.reason),
    );
    assertOk(result);
    return result.data;
  }

  @Patch(':id/cancel')
  @Roles('EMPLOYEE', 'HR_MANAGER', 'SUPER_ADMIN', 'DIRECTOR')
  async cancelLeave(@Param('id') leaveId: string, @CurrentUser() user: AuthenticatedUser) {
    const userId = String(user.id);
    return unwrapOrThrow(await this.commandBus.execute(new CancelLeaveCommand(leaveId, userId)));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles('HR_MANAGER', 'SUPER_ADMIN', 'DIRECTOR')
  async deleteLeave(@Param('id') id: string) {
    const check = await this.hrRepo.findLeaveById(id);
    if (!check.ok || check.data == null) {
      throw new NotFoundException(`Ta'til so'rovi topilmadi: ${id}`);
    }
    const result = await this.hrRepo.updateLeave(id, { status: 'deleted', deleted_at: new Date().toISOString() });
    if (!result.ok) throw new NotFoundException(`Ta'til so'rovini o'chirib bo'lmadi: ${id}`);
    return { deleted: true, id };
  }
}
