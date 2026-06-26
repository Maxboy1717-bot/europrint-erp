/**
 * @module razryad.controller
 * @description HTTP routes for razryad (grade) master-data (`razryad_levels`). Mirrors CardController.
 *   Soft-delete = is_active=false. UNIQUE(level) → 409 (clean). EP-ORG-009 (create) / 043 (master).
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
import { unwrapOrThrow, unwrapOrInternal } from '@common/http-result';
import { z } from 'zod';
import { RazryadService } from './razryad.service';
import type { RazryadInput, RazryadSettingsInput } from './razryad.repository';

const RazryadCreateSchema = z.object({
  level:              z.number().int(),
  name:               z.string().min(1).max(200),
  minRequirement:     z.string().max(2000).optional(),
  salaryMin:          z.number().optional(),
  salaryMax:          z.number().optional(),
  examType:           z.string().max(100).optional(),
  certificate:        z.string().max(500).optional(),
  description:        z.string().max(2000).optional(),
  /** EP-ORG-055: imtihon o'tish chegarasi (foizda). EGASI QIYMATI KERAK — global default yo'q. */
  examPassThreshold:  z.number().min(0).max(100).optional(),
  /** EP-ORG-056: qayta topshirish maksimal soni. EGASI QIYMATI KERAK — global default yo'q. */
  maxRetakes:         z.number().int().min(0).max(10).optional(),
  /** Razryad oylik-koeffitsiyenti (base × coefficient = oylik). Egasi sozlaydi. */
  coefficient:        z.number().positive().max(20).optional(),
  /** EP-ORG-011: keyingi razryadga o'tishdan oldin minimal oylar (≥3 oy oraliq). Egasi belgilaydi. */
  minMonths:          z.number().int().min(0).max(120).optional(),
}).strict();

const RazryadUpdateSchema = RazryadCreateSchema.partial();

/**
 * EP-ORG-055/056/011 — razryad o'sish-siyosati sozlamasi (PATCH .../:id/settings).
 * Generic update'dan ajratilgan: faqat 3 sozlama, intention-revealing (Q-40).
 * - examPassThreshold/maxRetakes `.nullable()` — egasi ataylab tozalashi mumkin.
 * - minMonths `.nullable()` EMAS — DB'da NOT NULL (null yuborilsa 400).
 * - `.refine` — bo'sh PATCH (hech bir kalit yo'q) → 400 (no-op so'rovni rad et).
 * QIYMATLAR EGASIDAN: default yozilmaydi (FABRIKATSIYA TAQIQ, Q-40).
 */
const RazryadSettingsSchema = z
  .object({
    examPassThreshold: z.number().min(0).max(100).nullable().optional(),
    minMonths:         z.number().int().min(0).max(120).optional(),
    maxRetakes:        z.number().int().min(0).max(10).nullable().optional(),
  })
  .strict()
  .refine(
    (o) => o.examPassThreshold !== undefined || o.minMonths !== undefined || o.maxRetakes !== undefined,
    { message: 'Kamida bitta sozlama (examPassThreshold/minMonths/maxRetakes) kerak' },
  );

@Roles('admin', 'manager', 'hr_manager', 'director', 'super_admin')
@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard)
@ApiTags('Org Razryad Levels')
@ApiBearerAuth()
@Controller('org-structure/razryad-levels')
export class RazryadController {
  private readonly logger = new Logger(RazryadController.name);
  constructor(private readonly service: RazryadService) {}

  @ApiOperation({ summary: 'List razryad levels' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get()
  async list(@Query('all') all?: string) {
    const includeArchived = all === 'true' || all === '1';
    const data = unwrapOrInternal(await this.service.list(includeArchived));
    const items = Array.isArray(data) ? data : [];
    return { items, total: items.length };
  }

  @ApiOperation({ summary: 'Get razryad by id' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrThrow(await this.service.findById(id));
  }

  @ApiOperation({ summary: 'Create razryad level' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'Level already exists' })
  @Post()
  async create(@Body() body: unknown) {
    const dto = RazryadCreateSchema.parse(body) as RazryadInput;
    this.logger.log('Creating razryad level');
    return unwrapOrThrow(await this.service.create(dto));
  }

  @ApiOperation({ summary: 'Update razryad level' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 409, description: 'Level already exists' })
  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    const dto = RazryadUpdateSchema.parse(body) as RazryadInput;
    return unwrapOrThrow(await this.service.update(id, dto));
  }

  @ApiOperation({
    summary: 'Update razryad growth-policy settings (exam_pass_threshold / min_months / max_retakes)',
    description:
      'EP-ORG-055/056/011: razryad o\'sish-siyosati sozlamasi. Razryad-history (2-imzo o\'sish) ' +
      'shu qiymatlarni o\'qiydi; NULL bo\'lsa o\'sish RAD bo\'ladi. Qiymatlar egasidan — default yo\'q.',
  })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request (bo\'sh PATCH yoki noto\'g\'ri qiymat)' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch(':id/settings')
  async updateSettings(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    const dto = RazryadSettingsSchema.parse(body) as RazryadSettingsInput;
    this.logger.log(`Updating razryad #${id} growth-policy settings`);
    return unwrapOrThrow(await this.service.updateSettings(id, dto));
  }

  @ApiOperation({ summary: 'Soft-delete (archive) razryad level' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrThrow(await this.service.softDelete(id));
  }
}
