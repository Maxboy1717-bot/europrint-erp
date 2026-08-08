/**
 * @module reference-sample.controller
 * @description QC etalon (arxiv) namunalari boshqaruvi (modul 09, 09#67). Ro'yxat
 *   (expiring_soon/is_expired bayroqlari), yaratish (6 oy default saqlash), tahrir,
 *   utilizatsiya (dispose), o'chirish. Zod (Qoida 3) + Result (Qoida 1) + guard.
 * @layer Controller (QC)
 */
import {
  Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { z } from 'zod';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { assertOk } from '@common/http-result';
import { ReferenceSampleRepository } from '../infrastructure/repositories/reference-sample.repository';

const nz = <T extends z.ZodTypeAny>(s: T) => s.nullable().optional().transform(v => v ?? null);

const CreateSchema = z.object({
  sampleRef:         z.string().min(1).max(200),
  productId:         nz(z.number().int().positive()),
  orderId:           nz(z.number().int().positive()),
  inspectionId:      nz(z.number().int().positive()),
  description:       nz(z.string().max(2000)),
  storageLocation:   nz(z.string().max(200)),
  responsibleUserId: nz(z.number().int().positive()),
  retentionMonths:   z.number().int().min(1).max(120).optional().transform(v => v ?? 6),
  metadata:          z.record(z.unknown()).optional().transform(v => v ?? {}),
});
const UpdateSchema = z.object({
  sampleRef:         z.string().min(1).max(200).optional(),
  description:       z.string().max(2000).optional(),
  storageLocation:   z.string().max(200).optional(),
  responsibleUserId: z.number().int().positive().optional(),
  notes:             z.string().max(2000).optional(),
});

@ApiThrottle()
@ApiTags('QC — Reference Samples')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Roles('admin', 'super_admin', 'director', 'manager', 'qc_manager', 'supervisor')
@UseInterceptors(AuditInterceptor)
@Controller('qc/reference-samples')
export class ReferenceSampleController {
  constructor(private readonly repo: ReferenceSampleRepository) {}

  @ApiOperation({ summary: 'List reference samples (?expiringSoon=true&includeDisposed=true)' })
  @Get()
  async list(@Query('expiringSoon') expiringSoon?: string, @Query('includeDisposed') includeDisposed?: string) {
    const expiringSoonOnly = String(expiringSoon) === 'true' || String(expiringSoon) === '1';
    const includeDisp = String(includeDisposed) === 'true' || String(includeDisposed) === '1';
    const r = await this.repo.list({ expiringSoonOnly, includeDisposed: includeDisp });
    assertOk(r); return r.data;
  }

  @ApiOperation({ summary: 'Get reference sample' })
  @Get(':id')
  async get(@Param('id') id: string) { const r = await this.repo.getById(Number(id)); assertOk(r); return r.data; }

  @ApiOperation({ summary: 'Archive a reference sample (default 6-month retention)' })
  @Post()
  async create(@Body() body: unknown) {
    const d = CreateSchema.parse(body);
    const r = await this.repo.create(d); assertOk(r); return r.data;
  }

  @ApiOperation({ summary: 'Update reference sample' })
  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: unknown) {
    const d = UpdateSchema.parse(body);
    const r = await this.repo.update(Number(id), d); assertOk(r); return { success: true };
  }

  @ApiOperation({ summary: 'Dispose reference sample (retention elapsed)' })
  @Post(':id/dispose')
  async dispose(@Param('id') id: string) { const r = await this.repo.dispose(Number(id)); assertOk(r); return { success: true }; }

  @ApiOperation({ summary: 'Delete reference sample' })
  @Delete(':id')
  async remove(@Param('id') id: string) { const r = await this.repo.remove(Number(id)); assertOk(r); return { success: true }; }
}
