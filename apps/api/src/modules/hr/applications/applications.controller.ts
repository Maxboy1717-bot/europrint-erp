/**
 * @module applications.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { assertFound } from '@common/assertions';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { safeInt } from '../common/db-rows';
import {
  Body, Controller, Delete, Get, Logger, NotFoundException,
  Param, Post, Put, Query, UseGuards, UseInterceptors, UsePipes } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
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

@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@UseGuards(RolesGuard)
@Roles(...HR_ROLES)
@ApiTags('Applications')
@Controller('applications')
export class ApplicationsController {
  private readonly logger = new Logger(ApplicationsController.name);

  constructor(private readonly svc: ApplicationsService) {}

  @ApiOperation({ summary: 'List' })
  @ApiResponse({ status: 200, description: 'OK' })
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

  @ApiOperation({ summary: 'Get by id' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get(':id')
  async getById(@Param('id') id: string) {
    const r = await this.svc.getById(safeInt(id, 0));
    assertOk(r);
    const data = r.data as Record<string, unknown>;
    assertFound(data, 'Application not found');
    return data;
  }

  @ApiOperation({ summary: 'Create' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post()
  @UsePipes(new ZodValidationPipe(ApplicationCreateSchema))
  async create(@Body() body: ApplicationCreateDto) {
    return unwrapOrThrow(await this.svc.create(body));
  }

  @ApiOperation({ summary: 'Update' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Put(':id')
  @UsePipes(new ZodValidationPipe(ApplicationUpdateSchema))
  async update(@Param('id') id: string, @Body() body: ApplicationUpdateDto) {
    const r = await this.svc.update(safeInt(id, 0), body);
    assertOk(r);
    const data = r.data as Record<string, unknown>;
    assertFound(data, 'Application not found');
    return data;
  }

  @ApiOperation({ summary: 'Delete' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Delete(':id')
  @Roles('super_admin', 'director')
  async delete(@Param('id') id: string) {
    return unwrapOrThrow(await this.svc.delete(safeInt(id, 0)));
  }
}
