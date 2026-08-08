/**
 * @module qc-norm-versions.controller
 * @description QC norma snapshot-versiyalash (modul 09, 09.39). Norma o'zgarganda yangi
 *   versiya ochish (snapshot), norm_ref bo'yicha versiyalar ro'yxati, va berilgan sanada
 *   faol bo'lgan versiyani aniqlash (eski buyurtma -> eski norma). Zod (Qoida 3) + Result
 *   (Qoida 1) + guard.
 * @layer Controller (QC)
 */
import {
  Body, Controller, Get, Param, Post, Query, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { z } from 'zod';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { assertOk } from '@common/http-result';
import { QcNormVersionsRepository } from '../infrastructure/repositories/qc-norm-versions.repository';

const nz = <T extends z.ZodTypeAny>(s: T) => s.nullable().optional().transform(v => v ?? null);

const SnapshotSchema = z.object({
  normRef:  z.string().min(1).max(200),
  snapshot: z.record(z.unknown()).optional().transform(v => v ?? {}),
  note:     nz(z.string().max(2000)),
});

@ApiThrottle()
@ApiTags('QC — Norm Versions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Roles('admin', 'super_admin', 'director', 'manager', 'qc_manager', 'supervisor')
@UseInterceptors(AuditInterceptor)
@Controller('qc/norm-versions')
export class QcNormVersionsController {
  constructor(private readonly repo: QcNormVersionsRepository) {}

  @ApiOperation({ summary: 'List norm versions for a norm_ref (?normRef=CODE)' })
  @Get()
  async list(@Query('normRef') normRef?: string) {
    const ref = z.string().min(1).max(200).parse(normRef);
    const r = await this.repo.listByRef(ref); assertOk(r); return r.data;
  }

  @ApiOperation({ summary: 'Resolve the norm version active at a date (?normRef=CODE&at=ISO); at omitted = now' })
  @Get('active')
  async active(@Query('normRef') normRef?: string, @Query('at') at?: string) {
    const ref = z.string().min(1).max(200).parse(normRef);
    const atIso = at ? z.string().datetime().parse(at) : null;
    const r = await this.repo.getActiveAt(ref, atIso); assertOk(r); return r.data;
  }

  @ApiOperation({ summary: 'Get norm version by id' })
  @Get(':id')
  async get(@Param('id') id: string) { const r = await this.repo.getById(Number(id)); assertOk(r); return r.data; }

  @ApiOperation({ summary: 'Snapshot a new norm version (supersedes the currently-open one)' })
  @Post()
  async snapshot(@Body() body: unknown) {
    const d = SnapshotSchema.parse(body);
    const r = await this.repo.snapshot({ normRef: d.normRef, snapshotJson: d.snapshot, note: d.note, createdBy: null });
    assertOk(r); return r.data;
  }
}
