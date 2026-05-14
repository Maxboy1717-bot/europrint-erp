/**
 * @module crm-activities.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { assertFound, assertRequired } from '@common/assertions';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { safeInt } from '../../hr/common/db-rows';
import {
  BadRequestException, Body, Controller, Delete, Get, Logger, NotFoundException,
  Param, Patch, Post, Query, UseGuards,
  UseInterceptors, InternalServerErrorException, UsePipes } from '@nestjs/common';
import { throwFromError, unwrapOrThrow, assertOk } from '@common/http-result';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CrmActivitiesService } from '../application/crm-activities.service';
import {
  CreateActivityDtoSchema, CreateActivityDto,
  CompleteActivityDtoSchema, CompleteActivityDto,
  UpdateActivityDtoSchema, UpdateActivityDto,
} from './dto/crm-activities.dto';

const CRM_ROLES = ['sales_manager', 'super_admin', 'director', 'crm_manager', 'SALES'];

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard)
@Controller('crm/activities')
export class CrmActivitiesController {
  private readonly logger = new Logger(CrmActivitiesController.name);

  constructor(private readonly svc: CrmActivitiesService) {}

  @Get()
  async list(
    @Query('leadId') leadId?: string, @Query('dealId') dealId?: string,
    @Query('assignedTo') assignedTo?: string, @Query('type') type?: string,
    @Query('status') status?: string, @Query('limit') limit?: string, @Query('offset') offset?: string,
  ) {
    const _rList = await this.svc.list(
      leadId ? safeInt(leadId, 0) : null,
      dealId ? safeInt(dealId, 0) : null,
      assignedTo ? safeInt(assignedTo, 0) : null,
      type, status, safeInt(limit, 50), safeInt(offset, 0),
    );
    assertOk(_rList);
    return _rList.data;
  }

  @Get('today')
  async today() {
    return unwrapOrThrow(await this.svc.today());
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const _rGetById = await this.svc.getById(safeInt(id, 0));
    assertOk(_rGetById);
    const r = _rGetById.data as Record<string, unknown>;
    assertFound(r, 'Activity not found');
    return r;
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(...CRM_ROLES)
  @UsePipes(new ZodValidationPipe(CreateActivityDtoSchema))
  async create(@Body() body: CreateActivityDto) {
    assertRequired(body.type, 'type and subject required');
    assertRequired(body.subject, 'type and subject required');
    return unwrapOrThrow(await this.svc.create(body.type, body.subject, body.lead_id, body.deal_id, body.assigned_to, body.due_date, body.notes, body.status));
  }

  @Patch(':id/complete')
  @UseGuards(RolesGuard)
  @Roles(...CRM_ROLES)
  @UsePipes(new ZodValidationPipe(CompleteActivityDtoSchema))
  async complete(@Param('id') id: string, @Body() body: CompleteActivityDto) {
    const _rComplete = await this.svc.complete(safeInt(id, 0), body.outcome);
    assertOk(_rComplete);
    const r = _rComplete.data as Record<string, unknown>;
    assertFound(r, 'Activity not found');
    return r;
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(...CRM_ROLES)
  @UsePipes(new ZodValidationPipe(UpdateActivityDtoSchema))
  async update(@Param('id') id: string, @Body() body: UpdateActivityDto) {
    const _rUpdate = await this.svc.update(safeInt(id, 0), body);
    assertOk(_rUpdate);
    const r = _rUpdate.data as Record<string, unknown>;
    assertFound(r, 'Activity not found');
    return r;
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(...CRM_ROLES)
  async delete(@Param('id') id: string) {
    await this.svc.delete(safeInt(id, 0));
    return {};
  }
}
