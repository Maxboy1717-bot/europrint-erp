/**
 * @module panels.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { assertValidated } from '@common/assertions';
import { unwrapOrThrow } from '@common/http-result';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import {
  Body,
  Controller,
  Get,
  Logger,
  Post,
  Query,
  UseGuards,
  UseInterceptors, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard } from '@auth/guards/roles.guard';
import { Roles } from '@auth/decorators/roles.decorator';
import { CurrentUser } from '@auth/decorators/current-user.decorator';
import { Result } from '@common/types/result.type';
import { SavePanelCommand } from '../application/commands/save-panel.command';
import { GetMyPanelQuery } from '../application/queries/get-my-panel.query';
import { SavePanelDto, SavePanelDtoSchema } from './dto/core.dto';
import { Panel } from '../domain/aggregates/panel.aggregate';

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@Controller('core/panels')
@Roles('admin', 'manager', 'supervisor', 'operator', 'employee', 'viewer', 'director')
@UseGuards(RolesGuard)
export class PanelsController {
  private readonly logger = new Logger(PanelsController.name);

  constructor(private commandBus: CommandBus, private queryBus: QueryBus) {}

  @Get('my')
  async getMyPanel(@CurrentUser() user: AuthenticatedUser): Promise<Panel> {
    this.logger.log(`Get panel for user ${user.id}`);
    const res = await this.queryBus.execute(new GetMyPanelQuery(String(user.id)));
    return unwrapOrThrow(res);
  }

  @Post('my')
  async saveMyPanel(@Body() dto: SavePanelDto, @CurrentUser() user: AuthenticatedUser): Promise<Panel> {
    this.logger.log(`Save panel for user ${user.id}`);
    const parsed = SavePanelDtoSchema.safeParse(dto);
    assertValidated(parsed.success, "Noto'g'ri ma'lumotlar");
    const res = await this.commandBus.execute(new SavePanelCommand(String(user.id), dto));
    return unwrapOrThrow(res);
  }

  @Get('default')
  async getDefaultPanel(): Promise<Panel | null> {
    this.logger.log('Get default panel');
    const res = await this.queryBus.execute(new GetMyPanelQuery(''));
    return unwrapOrThrow(res);
  }
}
