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
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { throwFromError, unwrapOrThrow } from '@common/http-result';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
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

@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@ApiTags('Mes Production Sessions')
@Controller('mes/production-sessions')
@UseGuards(RolesGuard)
@Roles(...MES_ROLES)
export class MesProductionSessionsController {
  private readonly logger = new Logger(MesProductionSessionsController.name);

  constructor(private readonly svc: MesProductionSessionsService) {}

  @ApiOperation({ summary: 'List' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get()
  async list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return unwrapOrThrow(await this.svc.listSessions(safeInt(page, 1), safeInt(limit, 20), status));
  }

  @ApiOperation({ summary: 'Create' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post()
  @UsePipes(new ZodValidationPipe(MesCreateProductionSessionSchema))
  async create(@Body() body: MesCreateProductionSessionDto) {
    return unwrapOrThrow(await this.svc.createSession(body));
  }

  @ApiOperation({ summary: 'Get session' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get(':sessionId')
  async getSession(@Param('sessionId') sessionId: string) {
    return unwrapOrThrow(await this.svc.getSession(safeInt(sessionId, 0)));
  }

  @ApiOperation({ summary: 'Advance GSD stage (setup→main→teardown→done)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Post(':sessionId/advance-stage')
  async advanceStage(@Param('sessionId') sessionId: string) {
    return unwrapOrThrow(await this.svc.advanceSessionStage(safeInt(sessionId, 0)));
  }

  @ApiOperation({ summary: 'Record downtime' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post(':sessionId/downtime')
  @UsePipes(new ZodValidationPipe(MesRecordDowntimeSchema))
  async recordDowntime(
    @Param('sessionId') sessionId: string,
    @Body() body: MesRecordDowntimeDto,
  ) {
    return unwrapOrThrow(await this.svc.recordDowntimeForSession(safeInt(sessionId, 0), body));
  }

  @ApiOperation({ summary: 'Stage-based OEE availability (main / setup+main+teardown)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get(':sessionId/stage-availability')
  async stageAvailability(@Param('sessionId') sessionId: string) {
    return unwrapOrThrow(await this.svc.getStageBasedAvailability(safeInt(sessionId, 0)));
  }

  @ApiOperation({ summary: 'List downtime events' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get(':sessionId/downtime-events')
  async listDowntimeEvents(@Param('sessionId') sessionId: string) {
    return unwrapOrThrow(await this.svc.listDowntimeEvents(safeInt(sessionId, 0)));
  }
}
