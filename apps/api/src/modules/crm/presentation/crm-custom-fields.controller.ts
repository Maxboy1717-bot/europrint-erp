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

  @ApiOperation({ summary: 'List by entity type (path param alias)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get(':entityType')
  async listByType(@Param('entityType') entityType: string) {
    return unwrapOrThrow(await this.svc.list(entityType));
  }

  @ApiOperation({ summary: 'Create' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post()
  @UseGuards(RolesGuard)
  @Roles(...CRM_ADMIN_ROLES)
  @UsePipes(new ZodValidationPipe(CreateCustomFieldDtoSchema))
  async create(@Body() body: CreateCustomFieldDto) {
    // Accept camelCase (FE: fieldName/fieldLabel) or snake_case (API: name/label) keys.
    const nameVal  = (body as Record<string, unknown>)['fieldName']  ?? body.name;
    const labelVal = (body as Record<string, unknown>)['fieldLabel'] ?? body.label;
    assertRequired(nameVal,  'fieldName (or name) required');
    assertRequired(labelVal, 'fieldLabel (or label) required');
    return unwrapOrThrow(await this.svc.create(body as Record<string, unknown>));
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
    // Normalize: FE sends { orderedIds: number[] }; canonical API sends { items: [{id, order_index}] }
    let items = body.items;
    if ((!items || items.length === 0) && Array.isArray((body as Record<string, unknown>)['orderedIds'])) {
      const orderedIds = (body as Record<string, unknown>)['orderedIds'] as number[];
      items = orderedIds.map((id, index) => ({ id, order_index: index }));
    }
    assertRequired(items?.length, 'items or orderedIds required');
    return unwrapOrThrow(await this.svc.reorder(items!));
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
