/**
 * @module card-template.controller
 * @description HTTP routes for KARTA shabloni (`card_templates`) — lavozim-turi shablon CRUD +
 *   POST :id/apply-template (shablondan yangi org_departments kartasini urug'lash). Karta-markaz
 *   vizyoni: shablon = standart karta-maydon qiymatlari. Zod-validated, Result-unwrapped.
 */

import {
  Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query,
  UseGuards, UseInterceptors, Logger,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@common/types/user.types';
import { unwrapOrThrow, unwrapOrInternal } from '@common/http-result';
import { z } from 'zod';
import { CardTemplateService } from './card-template.service';
import type { CardTemplateInput } from './card-template.repository';

const TemplateCreateSchema = z.object({
  positionType: z.string().min(1).max(100),
  name:         z.string().min(1).max(500),
  nameRu:       z.string().max(500).optional(),
  description:  z.string().max(5000).optional(),
  /** Standart KARTA-maydon qiymatlari. Permissive — apply-template'da whitelist bilan filtrlanadi. EGASI-DATA. */
  fieldDefaults: z.record(z.unknown()).optional(),
}).strict();

const TemplateUpdateSchema = TemplateCreateSchema.partial();

/** apply-template body: ixtiyoriy override (shablon qiymatini ustidan yozadi). Bo'sh bo'lishi mumkin. */
const ApplyTemplateSchema = z.record(z.unknown());

@Roles('admin', 'manager', 'hr_manager', 'director', 'super_admin')
@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard)
@ApiTags('Org Card Templates')
@ApiBearerAuth()
@Controller('org-structure/card-templates')
export class CardTemplateController {
  private readonly logger = new Logger(CardTemplateController.name);
  constructor(private readonly service: CardTemplateService) {}

  @ApiOperation({ summary: 'List card templates (lavozim-turi shablonlar)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get()
  async list(@Query('includeArchived') includeArchived?: string) {
    const data = unwrapOrInternal(await this.service.list(includeArchived === 'true'));
    const items = Array.isArray(data) ? data : [];
    return { items, total: items.length };
  }

  @ApiOperation({ summary: 'Get card template by id' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrThrow(await this.service.findById(id));
  }

  @ApiOperation({ summary: 'Create card template' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'Active template for this position_type exists' })
  @Post()
  async create(@Body() body: unknown, @CurrentUser() user: AuthenticatedUser) {
    const dto = TemplateCreateSchema.parse(body) as CardTemplateInput;
    const createdBy = user?.id ?? user?.sub ?? null;
    this.logger.log('Creating card template');
    return unwrapOrThrow(await this.service.create(dto, createdBy));
  }

  @ApiOperation({ summary: 'Update card template' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    const dto = TemplateUpdateSchema.parse(body) as CardTemplateInput;
    return unwrapOrThrow(await this.service.update(id, dto));
  }

  @ApiOperation({ summary: 'Soft-delete (archive) card template' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrThrow(await this.service.softDelete(id));
  }

  @ApiOperation({ summary: 'Apply a template → seed a new org card (org_departments) from field_defaults + override' })
  @ApiResponse({ status: 201, description: 'OK — new card created' })
  @ApiResponse({ status: 400, description: 'Bad request (e.g. positionName missing)' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  @Post(':id/apply-template')
  async applyTemplate(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    const override = ApplyTemplateSchema.parse(body ?? {});
    this.logger.log(`Applying card template #${id}`);
    return unwrapOrThrow(await this.service.applyTemplate(id, override));
  }
}
