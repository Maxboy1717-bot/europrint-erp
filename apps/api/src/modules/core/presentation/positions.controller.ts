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
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Throttle } from '@nestjs/throttler';
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

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@Controller('core/positions')
@UseGuards(RolesGuard)
export class PositionsController {
  private readonly logger = new Logger(PositionsController.name);

  constructor(private commandBus: CommandBus, private queryBus: QueryBus) {}

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

  @Get(':id')
  async getOne(@Param('id') id: string) {
    const res = await this.queryBus.execute(new GetPositionsQuery());
    return unwrapOrThrow(res);
  }

  @Post()
  @Roles('SUPER_ADMIN', 'HR_MANAGER')
  async create(@Body() dto: CreatePositionDto, @CurrentUser() user: AuthenticatedUser) {
    this.logger.log(`Create position requested by ${user.id}`);
    const parsed = CreatePositionDtoSchema.safeParse(dto);
    assertValidated(parsed.success, "Noto'g'ri ma'lumotlar");
    const res = await this.commandBus.execute(new CreatePositionCommand(dto));
    return unwrapOrThrow(res);
  }

  @Put(':id')
  @Roles('SUPER_ADMIN', 'HR_MANAGER')
  async update(@Param('id') id: string, @Body() dto: UpdatePositionDto, @CurrentUser() user: AuthenticatedUser) {
    this.logger.log(`Update position ${id} requested by ${user.id}`);
    const parsed = UpdatePositionDtoSchema.safeParse(dto);
    assertValidated(parsed.success, "Noto'g'ri ma'lumotlar");
    const res = await this.commandBus.execute(new UpdatePositionCommand(id, dto));
    return unwrapOrThrow(res);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  async delete(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    this.logger.log(`Delete position ${id} requested by ${user.id}`);
    const res = await this.commandBus.execute(new DeletePositionCommand(id));
    return unwrapOrThrow(res);
  }
}
