/**
 * @module applications.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { assertFound } from '@common/assertions';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { safeInt } from '../hr/common/db-rows';
import {
  Body, Controller, Delete, Get, Logger, NotFoundException,
  Param, Post, Put, Query, UseGuards, UseInterceptors, UsePipes } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { ApplicationsService } from './applications.service';
import { throwFromError, unwrapOrThrow, assertOk } from '@common/http-result';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import {
  ApplicationCreateSchema, ApplicationCreateDto,
  ApplicationUpdateSchema, ApplicationUpdateDto,
} from './dto/applications.dto';

const HR_ROLES = ['hr_manager', 'hr_specialist', 'director', 'super_admin'];

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@UseGuards(RolesGuard)
@Roles(...HR_ROLES)
@Controller('applications')
export class ApplicationsController {
  private readonly logger = new Logger(ApplicationsController.name);

  constructor(private readonly svc: ApplicationsService) {}

  @Get()
  async list(
    @Query('status') status?: string, @Query('positionId') positionId?: string,
    @Query('limit') limit?: string, @Query('offset') offset?: string,
  ) {
    const r = await this.svc.list(
      status ?? null,
      positionId ? safeInt(positionId, 0) : null,
      safeInt(limit, 50), safeInt(offset, 0),
    );
    assertOk(r);
    return r.data;
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const r = await this.svc.getById(safeInt(id, 0));
    assertOk(r);
    const data = r.data as Record<string, unknown>;
    assertFound(data, 'Application not found');
    return data;
  }

  @Post()
  @UsePipes(new ZodValidationPipe(ApplicationCreateSchema))
  async create(@Body() body: ApplicationCreateDto) {
    return unwrapOrThrow(await this.svc.create(body));
  }

  @Put(':id')
  @UsePipes(new ZodValidationPipe(ApplicationUpdateSchema))
  async update(@Param('id') id: string, @Body() body: ApplicationUpdateDto) {
    const r = await this.svc.update(safeInt(id, 0), body);
    assertOk(r);
    const data = r.data as Record<string, unknown>;
    assertFound(data, 'Application not found');
    return data;
  }

  @Delete(':id')
  @Roles('super_admin', 'director')
  async delete(@Param('id') id: string) {
    return unwrapOrThrow(await this.svc.delete(safeInt(id, 0)));
  }
}
