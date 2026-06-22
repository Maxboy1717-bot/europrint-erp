/**
 * @module mes-operations.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Controller, Get, Post, Patch, Body, Param, UseGuards, UseInterceptors, Query, Logger } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { throwFromError, unwrapOrThrow } from '@common/http-result';
import { GetOeeQuery } from '../application/queries/get-oee.query';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { GetSessionsQuery } from '../application/queries/get-sessions.query';
import { DOWNTIME_REASON_CODES } from '../domain/aggregates/downtime-event.aggregate';
import { RecordDowntimeCommand } from '../application/commands/record-downtime.handler';
import { EndDowntimeCommand } from '../application/commands/end-downtime.command';
import { GetDowntimeQuery } from '../application/queries/get-downtime.query';
import { GetDowntimeSummaryQuery } from '../application/queries/get-downtime-summary.query';
import {
  CreateDowntimeDto,
  CreateDowntimeDtoSchema,
  EndDowntimeDto,
  EndDowntimeDtoSchema,
  GetDowntimeDto,
  GetDowntimeDtoSchema,
  GetDowntimeSummaryDtoSchema,
} from './dto/mes-operations.dto';
import { z } from 'zod';

const SessionDowntimeSchema = z.object({
  eventType: z.string().max(50).optional(),
  reasonCode: z.string().max(100).optional(),
  reason: z.string().max(100).optional(),
  workCenterId: z.union([z.string(), z.number()]).optional(),
  notes: z.string().max(2000).optional(),
}).passthrough();

enum Role {
  SUPER_ADMIN = 'super_admin',
  PRODUCTION_MANAGER = 'production_manager',
  OPERATOR = 'operator',
}

@ApiThrottle()
@ApiTags('Mes Operations')
@Controller('mes/operations')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
export class MesOperationsController {
  private readonly logger = new Logger(MesOperationsController.name);

  constructor(
    private commandBus: CommandBus,
    private queryBus: QueryBus,
  ) {}

  @ApiOperation({ summary: 'List sessions' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get()
  @Roles(Role.SUPER_ADMIN, Role.PRODUCTION_MANAGER, Role.OPERATOR)
  async listSessions(@Query('status') status?: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    return unwrapOrThrow(await this.queryBus.execute(new GetSessionsQuery({ status, page: Number(page), limit: Number(limit) })));
  }

  @ApiOperation({ summary: 'Get downtime' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('downtime')
  @Roles(Role.SUPER_ADMIN, Role.PRODUCTION_MANAGER, Role.OPERATOR)
  async getDowntime(@Query() query?: GetDowntimeDto) {
    const validatedQuery = GetDowntimeDtoSchema.parse(query || {});
    this.logger.log('Getting downtime events');
    return unwrapOrThrow(await this.queryBus.execute(new GetDowntimeQuery(validatedQuery)));
  }

  @ApiOperation({ summary: 'Record downtime' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('downtime')
  @Roles(Role.SUPER_ADMIN, Role.PRODUCTION_MANAGER, Role.OPERATOR)
  async recordDowntime(@Body() dto: CreateDowntimeDto) {
    const validatedDto = CreateDowntimeDtoSchema.parse(dto);
    this.logger.log('Recording downtime event');
    const command = new RecordDowntimeCommand(
      validatedDto.sessionId,
      validatedDto.eventType,
      validatedDto.reasonCode,
      'operator',
      validatedDto.workCenterId,
      validatedDto.notes,
    );
    return unwrapOrThrow(await this.commandBus.execute(command));
  }

  @ApiOperation({ summary: 'End downtime' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch('downtime/:id/end')
  @Roles(Role.SUPER_ADMIN, Role.PRODUCTION_MANAGER, Role.OPERATOR)
  async endDowntime(@Param('id') id: string, @Body() dto: EndDowntimeDto) {
    const validatedDto = EndDowntimeDtoSchema.parse(dto);
    this.logger.log('Ending downtime event');
    const command = new EndDowntimeCommand(id, validatedDto.endedAt);
    return unwrapOrThrow(await this.commandBus.execute(command));
  }

  @ApiOperation({ summary: 'Get downtime summary' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('downtime/summary')
  @Roles(Role.SUPER_ADMIN, Role.PRODUCTION_MANAGER)
  async getDowntimeSummary(@Query() query?: Record<string, unknown>) {
    const from = query?.from ? new Date(String(query.from ?? '')) : this.getFirstDayOfMonth();
    const to = query?.to ? new Date(String(query.to ?? '')) : _time.now();
    const validatedQuery = GetDowntimeSummaryDtoSchema.parse({ from, to });
    this.logger.log('Getting downtime summary');
    return unwrapOrThrow(await this.queryBus.execute(new GetDowntimeSummaryQuery(validatedQuery.from, validatedQuery.to)));
  }

  @ApiOperation({ summary: 'Get reason codes' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('reason-codes')
  @Roles(Role.SUPER_ADMIN, Role.PRODUCTION_MANAGER, Role.OPERATOR)
  async getReasonCodes() {
    this.logger.log('Getting downtime reason codes');
    return DOWNTIME_REASON_CODES;
  }

  @ApiOperation({ summary: 'Get oee' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('oee')
  @Roles(Role.SUPER_ADMIN, Role.PRODUCTION_MANAGER)
  async getOee(@Query() query?: Record<string, unknown>) {
    const from = query?.from ? new Date(String(query.from ?? '')) : this.getFirstDayOfMonth();
    const to = query?.to ? new Date(String(query.to ?? '')) : _time.now();
    this.logger.log('Getting OEE');
    return unwrapOrThrow(await this.queryBus.execute(new GetOeeQuery({ from, to })));
  }

  @ApiOperation({ summary: 'Record session downtime' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post(':sessionId/downtime')
  @Roles(Role.SUPER_ADMIN, Role.PRODUCTION_MANAGER, Role.OPERATOR)
  async recordSessionDowntime(
    @Param('sessionId') sessionId: string,
    @Body() body: unknown,
  ) {
    const dto = SessionDowntimeSchema.parse(body);
    this.logger.log(`Recording downtime for session ${sessionId}`);
    const command = new RecordDowntimeCommand(
      sessionId,
      String(dto.eventType ?? 'unplanned'),
      String(dto.reasonCode ?? dto.reason ?? 'OTHER'),
      'operator',
      dto.workCenterId ? String(dto.workCenterId) : undefined,
      dto.notes ? String(dto.notes) : undefined,
    );
    return unwrapOrThrow(await this.commandBus.execute(command));
  }

  private getFirstDayOfMonth(): Date {
    const now = _time.now();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
}
