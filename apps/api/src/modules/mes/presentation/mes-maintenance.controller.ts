/**
 * @module mes-maintenance.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { assertFound } from '@common/assertions';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { safeInt } from '../../hr/common/db-rows';
import {
BadRequestException, Body, Controller, Get, Logger, NotFoundException, Param, Patch, Post, Query, UseGuards, UseInterceptors, UsePipes,
} from '@nestjs/common';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { throwFromError, unwrapOrThrow, assertOk } from '@common/http-result';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { MesMaintenanceService } from '../application/mes-maintenance.service';
import {
  MesCreateMaintenanceRequestSchema, MesCreateMaintenanceRequestDto,
  MesUpdateMaintenanceRequestSchema, MesUpdateMaintenanceRequestDto,
  MesUpdateTaskProgressSchema, MesUpdateTaskProgressDto,
  MesCreateSosSchema, MesCreateSosDto,
  MesCreateDowntimeEventSchema, MesCreateDowntimeEventDto,
} from '../dto/mes.dto';

const MES_WRITE_ROLES  = ['production_manager', 'shift_supervisor', 'mro_manager', 'super_admin', 'director'];
const MES_FLOOR_ROLES  = ['operator', 'worker', 'shift_supervisor', 'production_manager', 'super_admin', 'director'];

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard)
@Controller('mes')
export class MesMaintenanceController {
  private readonly logger = new Logger(MesMaintenanceController.name);

  constructor(private readonly svc: MesMaintenanceService) {}

  @Get('maintenance-requests')
  async listMaintenanceRequests(@Query('status') status?: string, @Query('limit') limit?: string, @Query('offset') offset?: string) {
    return unwrapOrThrow(await this.svc.listMaintenanceRequests(status, safeInt(limit, 50), safeInt(offset, 0)));
  }

  @Post('maintenance-requests')
  @UsePipes(new ZodValidationPipe(MesCreateMaintenanceRequestSchema))
  @Roles(...MES_FLOOR_ROLES)
  async createMaintenanceRequest(@Body() body: MesCreateMaintenanceRequestDto, @CurrentUser() user: AuthenticatedUser) {
    const _rR = await this.svc.createMaintenanceRequest(body.title, body.description ?? null, body.work_center_id ?? null, body.priority ?? 'medium', user?.id ?? null);
    const r = unwrapOrThrow(_rR);
    return r[0];
  }

  @Patch('maintenance-requests/:id')
  @UsePipes(new ZodValidationPipe(MesUpdateMaintenanceRequestSchema))
  @Roles(...MES_WRITE_ROLES)
  async updateMaintenanceRequest(@Param('id') id: string, @Body() body: MesUpdateMaintenanceRequestDto) {
    const _rR = await this.svc.updateMaintenanceRequest(safeInt(id, 0), body.status ?? null, body.assigned_to ?? null, body.notes ?? null, body.resolved_at ?? null);
    const r = unwrapOrThrow(_rR);
    assertFound(r, 'Maintenance request not found');
    return r[0];
  }

  @Get('tasks')
  async listTasks(@Query('sessionId') sessionId?: string, @Query('status') status?: string, @Query('limit') limit?: string) {
    return unwrapOrThrow(await this.svc.listTasks(sessionId ? safeInt(sessionId, 0) : null, status, safeInt(limit, 50)));
  }

  @Patch('tasks/:id/progress')
  @UsePipes(new ZodValidationPipe(MesUpdateTaskProgressSchema))
  @Roles(...MES_FLOOR_ROLES)
  async updateTaskProgress(@Param('id') id: string, @Body() body: MesUpdateTaskProgressDto) {
    const _rProg = await this.svc.updateTaskProgress(safeInt(id, 0), body.progress ?? 0, body.notes);
    const r = unwrapOrThrow(_rProg) as Record<string, unknown>[];
    assertFound(r, 'Task not found');
    return r[0];
  }

  @Post('sos')
  @UsePipes(new ZodValidationPipe(MesCreateSosSchema))
  @Roles(...MES_FLOOR_ROLES)
  async createSos(@Body() body: MesCreateSosDto, @CurrentUser() user: AuthenticatedUser) {
    const _rR = await this.svc.createSos(body.session_id ?? null, body.reason, body.work_center_id ?? null, user?.id ?? null);
    const r = unwrapOrThrow(_rR);
    return r[0];
  }

  @Get('sos/history')
  async getSosHistory(@Query('limit') limit?: string) {
    return unwrapOrThrow(await this.svc.getSosHistory(safeInt(limit, 50)));
  }

  @Get('downtime-reasons')
  async getDowntimeReasons() {
    return unwrapOrThrow(await this.svc.getDowntimeReasons());
  }

  @Get('downtime-events')
  async listDowntimeEvents(@Query('limit') limit?: string) {
    return unwrapOrThrow(await this.svc.getDowntimeEvents(0));
  }

  @Post('downtime-events')
  @UsePipes(new ZodValidationPipe(MesCreateDowntimeEventSchema))
  @Roles(...MES_FLOOR_ROLES)
  async createDowntimeEvent(@Body() body: MesCreateDowntimeEventDto) {
    const _rR = await this.svc.createDowntimeEvent(body.session_id, body.reason_id ?? null, body.notes ?? null);
    const r = unwrapOrThrow(_rR);
    return r[0];
  }

  @Get('downtime-events/:sessionId')
  async getDowntimeEvents(@Param('sessionId') sessionId: string) {
    return unwrapOrThrow(await this.svc.getDowntimeEvents(safeInt(sessionId, 0)));
  }
}
