/**
 * @module error-catalog.controller
 * @description HTTP routes for XATO-KATALOG (`error_catalog`, T10-08, EP-ORG-097) — tipik
 *   xatolar / nuqson-sabablari CRUD. Tezkor nuqson-tasnif manbai (defect-dropdown): kunlik-hisobot /
 *   ЦКП-fakt / IoT-tablet formasidagi "Nima xato/sabab bo'ldi?" tanlovi. Zod-validated, Result-unwrapped.
 *   card_id NULL = umumiy xato; GET ?cardId= bo'lsa o'sha kartaga xos + umumiy qaytadi.
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
import { ErrorCatalogService } from './error-catalog.service';
import type { ErrorCatalogInput } from './error-catalog.repository';

const ErrorCreateSchema = z.object({
  /** NULL/omitted = umumiy xato (hamma kartaga); raqam = o'sha kartaga xos. */
  cardId:      z.number().int().positive().nullable().optional(),
  code:        z.string().min(1).max(100).optional(),
  name:        z.string().min(1).max(500),
  nameRu:      z.string().max(500).optional(),
  category:    z.string().max(100).optional(),
  severity:    z.string().max(50).optional(),
  description: z.string().max(5000).optional(),
  sortOrder:   z.number().int().optional(),
}).strict();

const ErrorUpdateSchema = ErrorCreateSchema.partial();

@Roles('admin', 'manager', 'hr_manager', 'director', 'super_admin', 'supervisor')
@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard)
@ApiTags('Org Error Catalog')
@ApiBearerAuth()
@Controller('org-structure/error-catalog')
export class ErrorCatalogController {
  private readonly logger = new Logger(ErrorCatalogController.name);
  constructor(private readonly service: ErrorCatalogService) {}

  @ApiOperation({ summary: 'List error catalog (tipik xatolar). ?cardId= bo\'lsa karta + umumiy' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get()
  async list(@Query('cardId') cardId?: string, @Query('includeArchived') includeArchived?: string) {
    const cid = cardId != null && cardId !== '' ? Number(cardId) : null;
    const data = unwrapOrInternal(await this.service.list(Number.isFinite(cid as number) ? cid : null, includeArchived === 'true'));
    const items = Array.isArray(data) ? data : [];
    return { items, total: items.length };
  }

  @ApiOperation({ summary: 'Get error catalog entry by id' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrThrow(await this.service.findById(id));
  }

  @ApiOperation({ summary: 'Create error catalog entry' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'Active entry with this code exists' })
  @Post()
  async create(@Body() body: unknown, @CurrentUser() user: AuthenticatedUser) {
    const dto = ErrorCreateSchema.parse(body) as ErrorCatalogInput;
    const createdBy = user?.id ?? user?.sub ?? null;
    this.logger.log('Creating error-catalog entry');
    return unwrapOrThrow(await this.service.create(dto, createdBy == null ? null : Number(createdBy)));
  }

  @ApiOperation({ summary: 'Update error catalog entry' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    const dto = ErrorUpdateSchema.parse(body) as ErrorCatalogInput;
    return unwrapOrThrow(await this.service.update(id, dto));
  }

  @ApiOperation({ summary: 'Soft-delete (archive) error catalog entry' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrThrow(await this.service.softDelete(id));
  }
}
