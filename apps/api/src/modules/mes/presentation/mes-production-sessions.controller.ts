/**
 * @module mes-production-sessions.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import {
Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  Logger,
  InternalServerErrorException, UsePipes,
} from '@nestjs/common';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { throwFromError, unwrapOrThrow } from '@common/http-result';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { MesProductionSessionsService } from '../application/mes-production-sessions.service';
import { safeInt } from '../../hr/common/db-rows';
import {
  MesCreateProductionSessionSchema, MesCreateProductionSessionDto,
  MesRecordDowntimeSchema, MesRecordDowntimeDto,
} from '../dto/mes.dto';

const MES_ROLES = ['super_admin', 'director', 'production_manager', 'operator', 'technologist'];
const MES_WRITE = ['super_admin', 'director', 'production_manager', 'technologist', 'operator'];

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@Controller('mes/production-sessions')
@UseGuards(RolesGuard)
@Roles(...MES_ROLES)
export class MesProductionSessionsController {
  private readonly logger = new Logger(MesProductionSessionsController.name);

  constructor(private readonly svc: MesProductionSessionsService) {}

  @Get()
  async list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return unwrapOrThrow(await this.svc.listSessions(safeInt(page, 1), safeInt(limit, 20), status));
  }

  @Post()
  @UsePipes(new ZodValidationPipe(MesCreateProductionSessionSchema))
  async create(@Body() body: MesCreateProductionSessionDto) {
    return unwrapOrThrow(await this.svc.createSession(body));
  }

  @Get(':sessionId')
  async getSession(@Param('sessionId') sessionId: string) {
    return unwrapOrThrow(await this.svc.getSession(safeInt(sessionId, 0)));
  }

  @Post(':sessionId/downtime')
  @UsePipes(new ZodValidationPipe(MesRecordDowntimeSchema))
  async recordDowntime(
    @Param('sessionId') sessionId: string,
    @Body() body: MesRecordDowntimeDto,
  ) {
    return unwrapOrThrow(await this.svc.recordDowntimeForSession(safeInt(sessionId, 0), body));
  }

  @Get(':sessionId/downtime-events')
  async listDowntimeEvents(@Param('sessionId') sessionId: string) {
    return unwrapOrThrow(await this.svc.listDowntimeEvents(safeInt(sessionId, 0)));
  }
}
