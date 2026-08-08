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
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { I18nService } from 'nestjs-i18n';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@auth/guards/roles.guard';
import { Roles } from '@auth/decorators/roles.decorator';
import { CurrentUser } from '@auth/decorators/current-user.decorator';
import { Result } from '@common/types/result.type';
import { SavePanelCommand } from '../application/commands/save-panel.command';
import { GetMyPanelQuery } from '../application/queries/get-my-panel.query';
import { SavePanelDto, SavePanelDtoSchema } from './dto/core.dto';
import { Panel } from '../domain/aggregates/panel.aggregate';

@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@ApiTags('Panels')
@Controller('core/panels')
@Roles('admin', 'manager', 'supervisor', 'operator', 'employee', 'viewer', 'director')
@UseGuards(RolesGuard)
export class PanelsController {
  private readonly logger = new Logger(PanelsController.name);

  constructor(private commandBus: CommandBus, private queryBus: QueryBus, private readonly i18n: I18nService) {}

  @ApiOperation({ summary: 'Get my panel' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('my')
  async getMyPanel(@CurrentUser() user: AuthenticatedUser): Promise<Panel> {
    this.logger.log(`Get panel for user ${user.id}`);
    const res = await this.queryBus.execute(new GetMyPanelQuery(String(user.id)));
    return unwrapOrThrow(res);
  }

  @ApiOperation({ summary: 'Save my panel' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('my')
  async saveMyPanel(@Body() dto: SavePanelDto, @CurrentUser() user: AuthenticatedUser): Promise<Panel> {
    this.logger.log(`Save panel for user ${user.id}`);
    const parsed = SavePanelDtoSchema.safeParse(dto);
    assertValidated(parsed.success, await this.i18n.t('validation.invalidInputData'));
    const res = await this.commandBus.execute(new SavePanelCommand(String(user.id), dto));
    return unwrapOrThrow(res);
  }

  @ApiOperation({ summary: 'Get default panel' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('default')
  async getDefaultPanel(): Promise<Panel | null> {
    this.logger.log('Get default panel');
    const res = await this.queryBus.execute(new GetMyPanelQuery(''));
    return unwrapOrThrow(res);
  }
}
