/**
 * @module taxonomy.controller
 * @description §2 Taksonomiya CRUD (OWNER-JAVOBLAR-2026-07-11). Nomli ro'yxatlar (mahsulot turi,
 *   chegirma, bezash, qadoqlash, aloqa turi, hujjat turi...). Transport-only (Qoida 6).
 *
 *   GET    /api/taxonomy/categories         — kategoriyalar + yozuv soni
 *   GET    /api/taxonomy/:category          — kategoriya yozuvlari
 *   POST   /api/taxonomy                    — yangi yozuv
 *   PATCH  /api/taxonomy/:id                — yozuvni yangilash
 *   DELETE /api/taxonomy/:id                — o'chirish
 */

import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { throwFromError, unwrapOrThrow } from '@common/http-result';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { Role } from '@common/constants/roles.constants';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { TaxonomyService } from './taxonomy.service';
import { ListTaxonomyQuerySchema, CreateTaxonomySchema, UpdateTaxonomySchema } from './taxonomy.dto';

const READ = [Role.SUPER_ADMIN, Role.DIRECTOR, Role.MANAGER, Role.PRODUCTION_MANAGER, Role.SALES_MANAGER];
const WRITE = [Role.SUPER_ADMIN, Role.DIRECTOR, Role.MANAGER];

@ApiThrottle()
@ApiTags('Taxonomy')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Controller('taxonomy')
export class TaxonomyController {
  constructor(private readonly svc: TaxonomyService) {}

  @Get('categories')
  @Roles(...READ)
  @ApiOperation({ summary: 'List taxonomy categories with counts' })
  @ApiResponse({ status: 200, description: 'OK' })
  async categories() {
    const items = unwrapOrThrow(await this.svc.listCategories());
    return { items, total: Array.isArray(items) ? items.length : 0 };
  }

  @Get(':category')
  @Roles(...READ)
  @ApiOperation({ summary: 'List entries of a taxonomy category' })
  @ApiResponse({ status: 200, description: 'OK' })
  async list(@Param('category') category: string, @Query() query: unknown) {
    const q = ListTaxonomyQuerySchema.parse(query);
    const items = unwrapOrThrow(await this.svc.list(category, q.includeInactive));
    return { items, total: Array.isArray(items) ? items.length : 0 };
  }

  @Post()
  @Roles(...WRITE)
  @ApiOperation({ summary: 'Create a taxonomy entry' })
  @ApiResponse({ status: 201, description: 'Created' })
  @ApiResponse({ status: 409, description: 'Code conflict' })
  async create(@Body() body: unknown) {
    const dto = CreateTaxonomySchema.parse(body);
    const r = await this.svc.create(dto);
    if (!r.ok) throwFromError(r.error);
    return r.data;
  }

  @Patch(':id')
  @Roles(...WRITE)
  @ApiOperation({ summary: 'Update a taxonomy entry' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    const dto = UpdateTaxonomySchema.parse(body);
    const r = await this.svc.update(id, dto);
    if (!r.ok) throwFromError(r.error);
    return r.data;
  }

  @Delete(':id')
  @Roles(...WRITE)
  @ApiOperation({ summary: 'Delete a taxonomy entry' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    const r = await this.svc.remove(id);
    if (!r.ok) throwFromError(r.error);
    return r.data;
  }
}
