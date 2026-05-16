/**
 * @module positions.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { assertValidated } from '@common/assertions';
import { unwrapOrThrow } from '@common/http-result';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import {
  Body, Controller, Delete, Get, Logger, Param, Post, Put, Query,
  UseGuards, UseInterceptors, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@auth/guards/roles.guard';
import { Roles } from '@auth/decorators/roles.decorator';
import { CurrentUser } from '@auth/decorators/current-user.decorator';

import { CreatePositionCommand } from '../application/commands/create-position.command';
import { UpdatePositionCommand } from '../application/commands/update-position.command';
import { DeletePositionCommand } from '../application/commands/delete-position.command';
import { GetPositionsQuery } from '../application/queries/get-positions.query';
import {
  CreatePositionDto, CreatePositionDtoSchema,
  UpdatePositionDto, UpdatePositionDtoSchema,
} from './dto/core.dto';
import { Position } from '../domain/aggregates/position.aggregate';

@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@ApiTags('Positions')
@Controller('core/positions')
@UseGuards(RolesGuard)
export class PositionsController {
  private readonly logger = new Logger(PositionsController.name);

  constructor(private commandBus: CommandBus, private queryBus: QueryBus) {}

  @ApiOperation({ summary: 'List' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get()
  async list(@Query('departmentId') departmentId?: string, @Query('isActive') isActive?: boolean) {
    const res = await this.queryBus.execute(
      new GetPositionsQuery({
        departmentId,
        isActive: isActive ? isActive === true || isActive === 'true' : undefined,
      }),
    );
    return unwrapOrThrow(res);
  }

  @ApiOperation({ summary: 'Get one' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get(':id')
  async getOne(@Param('id') id: string) {
    const res = await this.queryBus.execute(new GetPositionsQuery());
    return unwrapOrThrow(res);
  }

  @ApiOperation({ summary: 'Create' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post()
  @Roles('SUPER_ADMIN', 'HR_MANAGER')
  async create(@Body() dto: CreatePositionDto, @CurrentUser() user: AuthenticatedUser) {
    this.logger.log(`Create position requested by ${user.id}`);
    const parsed = CreatePositionDtoSchema.safeParse(dto);
    assertValidated(parsed.success, "Noto'g'ri ma'lumotlar");
    const res = await this.commandBus.execute(new CreatePositionCommand(dto));
    return unwrapOrThrow(res);
  }

  @ApiOperation({ summary: 'Update' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Put(':id')
  @Roles('SUPER_ADMIN', 'HR_MANAGER')
  async update(@Param('id') id: string, @Body() dto: UpdatePositionDto, @CurrentUser() user: AuthenticatedUser) {
    this.logger.log(`Update position ${id} requested by ${user.id}`);
    const parsed = UpdatePositionDtoSchema.safeParse(dto);
    assertValidated(parsed.success, "Noto'g'ri ma'lumotlar");
    const res = await this.commandBus.execute(new UpdatePositionCommand(id, dto));
    return unwrapOrThrow(res);
  }

  @ApiOperation({ summary: 'Delete' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Delete(':id')
  @Roles('SUPER_ADMIN')
  async delete(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    this.logger.log(`Delete position ${id} requested by ${user.id}`);
    const res = await this.commandBus.execute(new DeletePositionCommand(id));
    return unwrapOrThrow(res);
  }
}
