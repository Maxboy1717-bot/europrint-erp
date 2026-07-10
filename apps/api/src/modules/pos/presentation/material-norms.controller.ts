/**
 * @module material-norms.controller
 * @description FAZA J (Bo'lim ombori + AI norma) — material_norms CRUD +
 *   AI-norma qayta hisoblash endpointlari.
 *
 *   - GET    /api/pos/material-norms              — ro'yxat (material/bo'lim/faollik filtri)
 *   - GET    /api/pos/material-norms/:id            — bitta norma (detal)
 *   - POST   /api/pos/material-norms                — qo'lda norma yaratish
 *   - PATCH  /api/pos/material-norms/:id             — norma yangilash
 *   - DELETE /api/pos/material-norms/:id             — deaktivatsiya (soft-delete)
 *   - POST   /api/pos/material-norms/ai-recalculate  — haqiqiy tarixiy iste'moldan
 *     AI-norma hisoblash + upsert (material + ixtiyoriy bo'lim doirasi)
 *
 *   Q-40: AI-recalculate namuna kam bo'lsa VALIDATION xato qaytaradi — soxta
 *   qiymat yozilmaydi.
 * @layer Presentation (POS)
 */

import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  UseGuards, UseInterceptors, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { z } from 'zod';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { PermissionGuard } from '@common/guards/permission.guard';
import { RequirePermission } from '@common/decorators/require-permission.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@common/types/user.types';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { unwrapOrThrow } from '@common/http-result';
import { MaterialNormsService } from '../application/services/material-norms.service';

const ListQuerySchema = z.object({
  materialId: z.coerce.number().int().positive().optional(),
  departmentCode: z.string().trim().min(1).max(50).optional(),
  isActive: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

const DeviationQuerySchema = z.object({
  materialId: z.coerce.number().int().positive(),
  departmentCode: z.string().trim().min(1).max(50).nullable().optional(),
});

const CreateSchema = z.object({
  materialId: z.coerce.number().int().positive().nullable().optional(),
  materialName: z.string().trim().min(1).max(300),
  normQuantityPer1000: z.coerce.number().positive(),
  unit: z.string().trim().min(1).max(20),
  wastePercentage: z.coerce.number().min(0).max(100).nullable().optional(),
  safetyStockPercentage: z.coerce.number().min(0).max(100).nullable().optional(),
  departmentCode: z.string().trim().min(1).max(50).nullable().optional(),
  formula: z.string().trim().max(2000).nullable().optional(),
});

const UpdateSchema = z.object({
  materialName: z.string().trim().min(1).max(300).optional(),
  normQuantityPer1000: z.coerce.number().positive().optional(),
  unit: z.string().trim().min(1).max(20).optional(),
  wastePercentage: z.coerce.number().min(0).max(100).nullable().optional(),
  safetyStockPercentage: z.coerce.number().min(0).max(100).nullable().optional(),
  departmentCode: z.string().trim().min(1).max(50).nullable().optional(),
  formula: z.string().trim().max(2000).nullable().optional(),
  isActive: z.boolean().optional(),
});

const AiRecalculateSchema = z.object({
  materialId: z.coerce.number().int().positive(),
  departmentCode: z.string().trim().min(1).max(50).nullable().optional(),
});

@ApiTags('POS — Material normalari')
@ApiBearerAuth()
@UseGuards(PermissionGuard)
@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@Controller('pos/material-norms')
export class MaterialNormsController {
  constructor(private readonly service: MaterialNormsService) {}

  @Get()
  @RequirePermission('pos.material_norms.read')
  @ApiOperation({ summary: "Material normalari ro'yxati (material/bo'lim filtri)" })
  @ApiResponse({ status: 200, description: 'OK' })
  async list(@Query() query: unknown) {
    const dto = ListQuerySchema.parse(query ?? {});
    return unwrapOrThrow(await this.service.list({
      materialId: dto.materialId ?? null,
      departmentCode: dto.departmentCode ?? null,
      isActive: dto.isActive ?? null,
      limit: dto.limit,
      offset: dto.offset,
    }));
  }

  @Get('deviation')
  @RequirePermission('pos.material_norms.read')
  @ApiOperation({ summary: "Norma og'ish tahlili (norma/fakt %) — bitta material" })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Faol norma topilmadi' })
  async deviation(@Query() query: unknown) {
    const dto = DeviationQuerySchema.parse(query ?? {});
    return unwrapOrThrow(await this.service.getDeviation(dto.materialId, dto.departmentCode ?? null));
  }

  @Get(':id')
  @RequirePermission('pos.material_norms.read')
  @ApiOperation({ summary: 'Bitta material normasi (detal)' })
  @ApiResponse({ status: 404, description: 'Norma topilmadi' })
  async getOne(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrThrow(await this.service.getById(id));
  }

  @Post()
  @RequirePermission('pos.material_norms.write')
  @ApiOperation({ summary: "Qo'lda material normasi yaratish" })
  async create(@Body() body: unknown, @CurrentUser() user: AuthenticatedUser) {
    const dto = CreateSchema.parse(body);
    return unwrapOrThrow(await this.service.create({
      materialId: dto.materialId ?? null,
      materialName: dto.materialName,
      normQuantityPer1000: dto.normQuantityPer1000,
      unit: dto.unit,
      wastePercentage: dto.wastePercentage ?? null,
      safetyStockPercentage: dto.safetyStockPercentage ?? null,
      departmentCode: dto.departmentCode ?? null,
      formula: dto.formula ?? null,
      calculatedByAI: false,
    }, user.id));
  }

  @Patch(':id')
  @RequirePermission('pos.material_norms.write')
  @ApiOperation({ summary: 'Material normasini yangilash' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    const dto = UpdateSchema.parse(body);
    return unwrapOrThrow(await this.service.update(id, dto));
  }

  @Delete(':id')
  @RequirePermission('pos.material_norms.write')
  @ApiOperation({ summary: 'Material normasini deaktivatsiya qilish (soft-delete)' })
  async deactivate(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthenticatedUser) {
    return unwrapOrThrow(await this.service.deactivate(id, user.id));
  }

  @Post('ai-recalculate')
  @RequirePermission('pos.material_norms.write')
  @ApiOperation({ summary: "AI-norma haqiqiy tarixiy iste'moldan qayta hisoblash" })
  @ApiResponse({ status: 400, description: "Yetarli tarixiy ma'lumot yo'q (namuna kam)" })
  async aiRecalculate(@Body() body: unknown) {
    const dto = AiRecalculateSchema.parse(body);
    return unwrapOrThrow(await this.service.recalculateAi(dto.materialId, dto.departmentCode ?? null));
  }
}
