import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Controller, Get, Post, Patch, Body, Param, UseGuards, UseInterceptors, Query, Logger } from '@nestjs/common';
import { throwFromError, unwrapOrThrow } from '@common/http-result';
import { GetOeeQuery } from '../application/queries/get-oee.query';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { GetSessionsQuery } from '../application/queries/get-sessions.query';
import { DOWNTIME_REASON_CODES } from '../domain/aggregates/downtime-event.aggregate';
import { RecordDowntimeCommand } from '../application/commands/record-downtime.handler';
import { EndDowntimeCommand } from '../application/commands/end-downtime.command';
import { GetDowntimeQuery } from '../application/queries/get-downtime.query';
import { GetDowntimeSummaryQuery } from '../application/queries/get-downtime-summary.query';
import { GetOeeHandler } from '../application/queries/get-oee.handler';
import {
  CreateDowntimeDto,
  CreateDowntimeDtoSchema,
  EndDowntimeDto,
  EndDowntimeDtoSchema,
  GetDowntimeDto,
  GetDowntimeDtoSchema,
  GetDowntimeSummaryDtoSchema,
} from './dto/mes-operations.dto';

enum Role {
  SUPER_ADMIN = 'super_admin',
  PRODUCTION_MANAGER = 'production_manager',
  OPERATOR = 'operator',
}

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('mes/operations')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
export class MesOperationsController {
  private readonly logger = new Logger(MesOperationsController.name);

  constructor(
    private commandBus: CommandBus,
    private queryBus: QueryBus,
  ) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.PRODUCTION_MANAGER, Role.OPERATOR)
  async listSessions(@Query('status') status?: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    return unwrapOrThrow(await this.queryBus.execute(new GetSessionsQuery({ status, page: Number(page), limit: Number(limit) })));
  }

  @Get('downtime')
  @Roles(Role.SUPER_ADMIN, Role.PRODUCTION_MANAGER, Role.OPERATOR)
  async getDowntime(@Query() query?: GetDowntimeDto) {
    const validatedQuery = GetDowntimeDtoSchema.parse(query || {});
    this.logger.log('Getting downtime events');
    return unwrapOrThrow(await this.queryBus.execute(new GetDowntimeQuery(validatedQuery)));
  }

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

  @Patch('downtime/:id/end')
  @Roles(Role.SUPER_ADMIN, Role.PRODUCTION_MANAGER, Role.OPERATOR)
  async endDowntime(@Param('id') id: string, @Body() dto: EndDowntimeDto) {
    const validatedDto = EndDowntimeDtoSchema.parse(dto);
    this.logger.log('Ending downtime event');
    const command = new EndDowntimeCommand(id, validatedDto.endedAt);
    return unwrapOrThrow(await this.commandBus.execute(command));
  }

  @Get('downtime/summary')
  @Roles(Role.SUPER_ADMIN, Role.PRODUCTION_MANAGER)
  async getDowntimeSummary(@Query() query?: Record<string, unknown>) {
    const from = query?.from ? new Date(String(query.from ?? '')) : this.getFirstDayOfMonth();
    const to = query?.to ? new Date(String(query.to ?? '')) : _time.now();
    const validatedQuery = GetDowntimeSummaryDtoSchema.parse({ from, to });
    this.logger.log('Getting downtime summary');
    return unwrapOrThrow(await this.queryBus.execute(new GetDowntimeSummaryQuery(validatedQuery.from, validatedQuery.to)));
  }

  @Get('reason-codes')
  @Roles(Role.SUPER_ADMIN, Role.PRODUCTION_MANAGER, Role.OPERATOR)
  async getReasonCodes() {
    this.logger.log('Getting downtime reason codes');
    return DOWNTIME_REASON_CODES;
  }

  @Get('oee')
  @Roles(Role.SUPER_ADMIN, Role.PRODUCTION_MANAGER)
  async getOee(@Query() query?: Record<string, unknown>) {
    const from = query?.from ? new Date(String(query.from ?? '')) : this.getFirstDayOfMonth();
    const to = query?.to ? new Date(String(query.to ?? '')) : _time.now();
    this.logger.log('Getting OEE');
    const oeeHandler = new GetOeeHandler();
    return unwrapOrThrow(await oeeHandler.execute(new GetOeeQuery({ from, to })));
  }

  @Post(':sessionId/downtime')
  @Roles(Role.SUPER_ADMIN, Role.PRODUCTION_MANAGER, Role.OPERATOR)
  async recordSessionDowntime(
    @Param('sessionId') sessionId: string,
    @Body() body: Record<string, unknown>,
  ) {
    this.logger.log(`Recording downtime for session ${sessionId}`);
    const command = new RecordDowntimeCommand(
      sessionId,
      String(body.eventType ?? 'unplanned'),
      String(body.reasonCode ?? body.reason ?? 'OTHER'),
      'operator',
      body.workCenterId ? String(body.workCenterId) : undefined,
      body.notes ? String(body.notes) : undefined,
    );
    return unwrapOrThrow(await this.commandBus.execute(command));
  }

  private getFirstDayOfMonth(): Date {
    const now = _time.now();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
}
