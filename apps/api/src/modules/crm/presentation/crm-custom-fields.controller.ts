import { assertFound, assertRequired } from '@common/assertions';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { safeInt } from '../../hr/common/db-rows';
import {
  BadRequestException, Body, Controller, Delete, Get, Logger, NotFoundException,
  Param, Patch, Post, Query, UseGuards, UseInterceptors, InternalServerErrorException, UsePipes } from '@nestjs/common';
import { throwFromError, unwrapOrThrow, assertOk } from '@common/http-result';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { CrmCustomFieldsService } from '../application/crm-custom-fields.service';
import {
  CreateCustomFieldDtoSchema, CreateCustomFieldDto,
  ReorderCustomFieldsDtoSchema, ReorderCustomFieldsDto,
} from './dto/crm-custom-fields.dto';

const CRM_ADMIN_ROLES = ['super_admin', 'director', 'crm_manager'];

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@Controller('crm/custom-fields')
export class CrmCustomFieldsController {
  private readonly logger = new Logger(CrmCustomFieldsController.name);

  constructor(private readonly svc: CrmCustomFieldsService) {}

  @Get()
  async list(@Query('entityType') entityType?: string) {
    return unwrapOrThrow(await this.svc.list(entityType ?? null));
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(...CRM_ADMIN_ROLES)
  @UsePipes(new ZodValidationPipe(CreateCustomFieldDtoSchema))
  async create(@Body() body: CreateCustomFieldDto) {
    assertRequired(body.name, 'name and label required');
    assertRequired(body.label, 'name and label required');
    return unwrapOrThrow(await this.svc.create(body));
  }

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

  @Post('reorder')
  @UseGuards(RolesGuard)
  @Roles(...CRM_ADMIN_ROLES)
  @UsePipes(new ZodValidationPipe(ReorderCustomFieldsDtoSchema))
  async reorder(@Body() body: ReorderCustomFieldsDto) {
    assertRequired(body.items?.length, 'items required');
    return unwrapOrThrow(await this.svc.reorder(body.items));
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(...CRM_ADMIN_ROLES)
  async delete(@Param('id') id: string) {
    return unwrapOrThrow(await this.svc.delete(safeInt(id, 0)));
  }
}
