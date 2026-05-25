/**
 * @module crm-custom-fields.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { assertFound, assertRequired } from '@common/assertions';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { safeInt } from '@common/db/db-rows';
import {
  BadRequestException, Body, Controller, Delete, Get, Logger, NotFoundException,
  Param, Patch, Post, Query, UseGuards, UseInterceptors, InternalServerErrorException, UsePipes } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { throwFromError, unwrapOrThrow, assertOk } from '@common/http-result';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { CrmCustomFieldsService } from '../application/crm-custom-fields.service';
import {
  CreateCustomFieldDtoSchema, CreateCustomFieldDto,
  ReorderCustomFieldsDtoSchema, ReorderCustomFieldsDto,
} from './dto/crm-custom-fields.dto';

const CRM_ADMIN_ROLES = ['super_admin', 'director', 'crm_manager'];

@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@ApiTags('Crm Custom Fields')
@Controller('crm/custom-fields')
export class CrmCustomFieldsController {
  private readonly logger = new Logger(CrmCustomFieldsController.name);

  constructor(private readonly svc: CrmCustomFieldsService) {}

  @ApiOperation({ summary: 'List' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get()
  async list(@Query('entityType') entityType?: string) {
    return unwrapOrThrow(await this.svc.list(entityType ?? null));
  }

  @ApiOperation({ summary: 'Create' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post()
  @UseGuards(RolesGuard)
  @Roles(...CRM_ADMIN_ROLES)
  @UsePipes(new ZodValidationPipe(CreateCustomFieldDtoSchema))
  async create(@Body() body: CreateCustomFieldDto) {
    assertRequired(body.name, 'name and label required');
    assertRequired(body.label, 'name and label required');
    return unwrapOrThrow(await this.svc.create(body));
  }

  @ApiOperation({ summary: 'Update' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(...CRM_ADMIN_ROLES)
  @UsePipes(new ZodValidationPipe(CreateCustomFieldDtoSchema))
  async update(@Param('id') id: string, @Body() body: CreateCustomFieldDto) {
    const _rUpdate = await this.svc.update(safeInt(id, 0), body);
    assertOk(_rUpdate);
    const r = _rUpdate.data as Record<string, unknown>;
    assertFound(r, 'Custom field not found');
    return r;
  }

  @ApiOperation({ summary: 'Reorder' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('reorder')
  @UseGuards(RolesGuard)
  @Roles(...CRM_ADMIN_ROLES)
  @UsePipes(new ZodValidationPipe(ReorderCustomFieldsDtoSchema))
  async reorder(@Body() body: ReorderCustomFieldsDto) {
    assertRequired(body.items?.length, 'items required');
    return unwrapOrThrow(await this.svc.reorder(body.items));
  }

  @ApiOperation({ summary: 'Delete' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(...CRM_ADMIN_ROLES)
  async delete(@Param('id') id: string) {
    return unwrapOrThrow(await this.svc.delete(safeInt(id, 0)));
  }
}
