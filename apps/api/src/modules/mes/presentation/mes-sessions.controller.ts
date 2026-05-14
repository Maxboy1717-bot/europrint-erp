/**
 * @module mes-sessions.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Controller, Get, Post, Body, Param, Query, UseGuards, UseInterceptors, Logger, UsePipes, InternalServerErrorException } from '@nestjs/common';
import { unwrapOrThrow } from '@common/http-result';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { CommandBus } from '@nestjs/cqrs';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { AuditInterceptor } from 'src/common/interceptors/audit.interceptor';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { AuthenticatedUser } from 'src/common/types/user.types';
import { StartSessionCommand } from '../application/commands/start-session.handler';
import { CompleteSessionCommand } from '../application/commands/complete-session.handler';
import { RecordDowntimeCommand } from '../application/commands/record-downtime.handler';
import {
  MesCreateSessionSchema, MesCreateSessionDto,
  MesStartSessionSchema, MesStartSessionDto,
  MesCompleteSessionSchema, MesCompleteSessionDto,
  MesSessionDowntimeSchema, MesSessionDowntimeDto,
} from '../dto/mes.dto';
import { MesProductionSessionsService } from '../application/mes-production-sessions.service';

enum Role {
  OPERATOR = 'operator',
  SUPER_ADMIN = 'super_admin',
  TECHNOLOGIST = 'technologist',
}

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('mes/sessions')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class MesSessionsController {
  private readonly logger = new Logger(MesSessionsController.name);

  constructor(
    private commandBus: CommandBus,
    private readonly sessionsSvc: MesProductionSessionsService,
  ) {}

  @Get()
  @Roles(Role.OPERATOR, Role.SUPER_ADMIN, Role.TECHNOLOGIST)
  async listSessions(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    this.logger.log('Getting MES sessions list');
    const result = await this.sessionsSvc.listSessions(
      Number(page ?? 1),
      Number(limit ?? 20),
      status,
    );
    const items = unwrapOrThrow(result);
    return { items: Array.isArray(items) ? items : [], total: Array.isArray(items) ? items.length : 0 };
  }

  @Get(':id')
  @Roles(Role.OPERATOR, Role.SUPER_ADMIN, Role.TECHNOLOGIST)
  async getSession(@Param('id') id: number){
    this.logger.log(`Getting MES session id=${id}`);
    const result = await this.sessionsSvc.getSession(Number(id));
    return unwrapOrThrow(result);
  }

  @Post()
  @Roles(Role.OPERATOR, Role.SUPER_ADMIN, Role.TECHNOLOGIST)
  @UsePipes(new ZodValidationPipe(MesCreateSessionSchema))
  async createSession(
    @Body() dto: MesCreateSessionDto,
  ){
    this.logger.log('Creating MES session');
    const result = await this.sessionsSvc.createSession(dto as Record<string, unknown>);
    return unwrapOrThrow(result);
  }

  @Post(':id/start')
  @Roles(Role.OPERATOR, Role.TECHNOLOGIST, Role.SUPER_ADMIN)
  @UsePipes(new ZodValidationPipe(MesStartSessionSchema))
  async startSession(
    @Param('id') id: number,
    @Body() dto: MesStartSessionDto,
  ){
    const command = new StartSessionCommand(id, dto.workCenterId ?? 0, dto.operatorId ?? 0, dto.courseId ?? 0);
    const res = await this.commandBus.execute(command);
    return unwrapOrThrow(res);
  }

  @Post(':id/complete')
  @Roles(Role.OPERATOR, Role.TECHNOLOGIST, Role.SUPER_ADMIN)
  @UsePipes(new ZodValidationPipe(MesCompleteSessionSchema))
  async completeSession(@Param('id') id: number, @Body() _dto: MesCompleteSessionDto){
    const command = new CompleteSessionCommand(id);
    const res = await this.commandBus.execute(command);
    return unwrapOrThrow(res);
  }

  @Post(':id/downtime')
  @Roles(Role.OPERATOR, Role.TECHNOLOGIST, Role.SUPER_ADMIN)
  @UsePipes(new ZodValidationPipe(MesSessionDowntimeSchema))
  async recordDowntime(
    @Param('id') id: number,
    @Body() dto: MesSessionDowntimeDto,
    @CurrentUser() user: AuthenticatedUser,
  ){
    const actor = user?.id ? String(user.id) : 'system';
    const command = new RecordDowntimeCommand(String(id), 'downtime', dto.reason, actor);
    const res = await this.commandBus.execute(command);
    return unwrapOrThrow(res);
  }
}
