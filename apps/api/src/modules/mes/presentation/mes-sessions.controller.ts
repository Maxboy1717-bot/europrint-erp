import { Controller, Get, Post, Body, Param, UseGuards, UseInterceptors, Logger, UsePipes, InternalServerErrorException } from '@nestjs/common';
import { unwrapOrThrow } from '@common/http-result';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { CommandBus } from '@nestjs/cqrs';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { AuditInterceptor } from 'src/common/interceptors/audit.interceptor';
import { StartSessionCommand } from '../application/commands/start-session.handler';
import { CompleteSessionCommand } from '../application/commands/complete-session.handler';
import { RecordDowntimeCommand } from '../application/commands/record-downtime.handler';
import {
  MesCreateSessionSchema, MesCreateSessionDto,
  MesStartSessionSchema, MesStartSessionDto,
  MesCompleteSessionSchema, MesCompleteSessionDto,
  MesSessionDowntimeSchema, MesSessionDowntimeDto,
} from '../dto/mes.dto';

enum Role {
  OPERATOR = 'operator',
  SUPER_ADMIN = 'super_admin',
  TECHNOLOGIST = 'technologist',
}

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('mes/sessions')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
export class MesSessionsController {
  private readonly logger = new Logger(MesSessionsController.name);

  constructor(private commandBus: CommandBus) {}

  @Get(':id')
  @Roles(Role.OPERATOR, Role.SUPER_ADMIN, Role.TECHNOLOGIST)
  async getSession(@Param('id') id: number){
    this.logger.log('Getting MES session');
    return {};
  }

  @Post()
  @UsePipes(new ZodValidationPipe(MesCreateSessionSchema))
  async createSession(
    @Body() _dto: MesCreateSessionDto,
  ){
    this.logger.log('Creating MES session');
    return 0;
  }

  @Post(':id/start')
  @UsePipes(new ZodValidationPipe(MesStartSessionSchema))
  async startSession(
    @Param('id') id: number,
    @Body() dto: MesStartSessionDto,
  ){
    const command = new StartSessionCommand(id, dto.workCenterId ?? 0, dto.operatorId ?? 0);
    const res = await this.commandBus.execute(command);
    return unwrapOrThrow(res);
  }

  @Post(':id/complete')
  @UsePipes(new ZodValidationPipe(MesCompleteSessionSchema))
  async completeSession(@Param('id') id: number, @Body() _dto: MesCompleteSessionDto){
    const command = new CompleteSessionCommand(id);
    const res = await this.commandBus.execute(command);
    return unwrapOrThrow(res);
  }

  @Post(':id/downtime')
  @UsePipes(new ZodValidationPipe(MesSessionDowntimeSchema))
  async recordDowntime(
    @Param('id') id: number,
    @Body() dto: MesSessionDowntimeDto,
  ){
    const command = new RecordDowntimeCommand(String(id), 'downtime', dto.reason, 'system');
    const res = await this.commandBus.execute(command);
    return unwrapOrThrow(res);
  }
}
