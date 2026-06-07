/**
 * @module pp-work-centers.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { assertRequired } from '@common/assertions';
import { Controller, Get, Post, Put, Patch, Body, Param, UseGuards, UseInterceptors, Query, Logger, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { throwFromError, unwrapOrThrow, assertOk } from '@common/http-result';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { CreateWorkCenterCommand } from '../application/commands/create-work-center.command';
import { UpdateWorkCenterCommand } from '../application/commands/update-work-center.command';
import { GetWorkCentersQuery } from '../application/queries/get-work-centers.query';
import { GetWorkCentersStatsQuery } from '../application/queries/get-work-centers-stats.query';
import {
  CreateWorkCenterDto,
  CreateWorkCenterDtoSchema,
  UpdateWorkCenterDto,
  UpdateWorkCenterDtoSchema,
  GetWorkCentersDto,
  GetWorkCentersDtoSchema,
} from './dto/work-center.dto';

enum Role {
  SUPER_ADMIN = 'super_admin',
  PRODUCTION_MANAGER = 'production_manager',
}

@ApiThrottle()
@ApiTags('Pp Work Centers')
@Controller('pp/work-centers')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
export class PpWorkCentersController {
  private readonly logger = new Logger(PpWorkCentersController.name);

  constructor(
    private commandBus: CommandBus,
    private queryBus: QueryBus,
  ) {}

  @ApiOperation({ summary: 'Get all' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get()
  @Roles(Role.SUPER_ADMIN, Role.PRODUCTION_MANAGER)
  async getAll(@Body() dto?: GetWorkCentersDto) {
    const validatedDto = GetWorkCentersDtoSchema.parse(dto || {});
    this.logger.log('Getting work centers');
    return unwrapOrThrow(await this.queryBus.execute(new GetWorkCentersQuery(validatedDto)));
  }

  @ApiOperation({ summary: 'Get stats' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('/stats')
  @Roles(Role.SUPER_ADMIN, Role.PRODUCTION_MANAGER)
  async getStats() {
    this.logger.log('Getting work center stats');
    return unwrapOrThrow(await this.queryBus.execute(new GetWorkCentersStatsQuery()));
  }

  @ApiOperation({ summary: 'Get by id' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.PRODUCTION_MANAGER)
  async getById(@Param('id') id: string) {
    this.logger.log('Getting work center by ID');
    const result = await this.queryBus.execute(new GetWorkCentersQuery({}));
    assertOk(result);
    const workCenter = result.data?.find((wc: Record<string, unknown>) => String(wc.id) === id);
    assertRequired(workCenter, 'Work center topilmadi');
    return workCenter;
  }

  @ApiOperation({ summary: 'Create' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post()
  @Roles(Role.SUPER_ADMIN, Role.PRODUCTION_MANAGER)
  async create(@Body() dto: CreateWorkCenterDto) {
    const validatedDto = CreateWorkCenterDtoSchema.parse(dto);
    this.logger.log('Creating work center');
    const command = new CreateWorkCenterCommand(
      validatedDto.code,
      validatedDto.name,
      validatedDto.type,
      validatedDto.capacity,
      validatedDto.costPerHour,
      validatedDto.certificationLmsCourseId,
      validatedDto.department,
    );
    return unwrapOrThrow(await this.commandBus.execute(command));
  }

  @ApiOperation({ summary: 'Update' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Put(':id')
  @Roles(Role.SUPER_ADMIN, Role.PRODUCTION_MANAGER)
  async update(@Param('id') id: string, @Body() dto: UpdateWorkCenterDto) {
    const validatedDto = UpdateWorkCenterDtoSchema.parse(dto);
    this.logger.log('Updating work center');
    const command = new UpdateWorkCenterCommand(
      id,
      validatedDto.code,
      validatedDto.name,
      validatedDto.type,
      validatedDto.capacity,
      validatedDto.costPerHour,
      validatedDto.certificationLmsCourseId,
      validatedDto.department,
    );
    return unwrapOrThrow(await this.commandBus.execute(command));
  }

  @ApiOperation({ summary: 'Toggle active' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch(':id/toggle-active')
  @Roles(Role.SUPER_ADMIN)
  async toggleActive(@Param('id') id: string, @Body() dto: { isActive: boolean }) {
    this.logger.log('Toggling work center active status');
    const result = await this.queryBus.execute(new GetWorkCentersQuery({}));
    assertOk(result);
    const existing = result.data?.find((wc: Record<string, unknown>) => String(wc.id) === id);
    assertRequired(existing, 'Work center topilmadi');
    const command = new UpdateWorkCenterCommand(id);
    return unwrapOrThrow(await this.commandBus.execute(command));
  }
}
