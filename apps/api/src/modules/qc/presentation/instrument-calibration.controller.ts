/**
 * @module instrument-calibration.controller
 * @description QC o'lchov asboblari kalibrovkasi boshqaruvi (modul 09, 09.36). Ro'yxat
 *   (due_soon/overdue bayroqlari bilan), yaratish, tahrir, kalibrovka yozish, o'chirish.
 *   Zod (Qoida 3) + Result (Qoida 1) + guard.
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
import { InstrumentCalibrationRepository } from '../infrastructure/repositories/instrument-calibration.repository';

const nz = <T extends z.ZodTypeAny>(s: T) => s.nullable().optional().transform(v => v ?? null);

const CreateSchema = z.object({
  instrumentName:    z.string().min(1).max(200),
  instrumentCode:    nz(z.string().max(100)),
  location:          nz(z.string().max(200)),
  responsibleUserId: nz(z.number().int().positive()),
  intervalDays:      z.number().int().min(1).max(3650).optional().transform(v => v ?? 365),
});
const UpdateSchema = z.object({
  instrumentName:    z.string().min(1).max(200).optional(),
  instrumentCode:    z.string().max(100).optional(),
  location:          z.string().max(200).optional(),
  responsibleUserId: z.number().int().positive().optional(),
  intervalDays:      z.number().int().min(1).max(3650).optional(),
  status:            z.enum(['active', 'retired']).optional(),
  notes:             z.string().max(2000).optional(),
});
const CalibrateSchema = z.object({
  certificateNumber: nz(z.string().max(100)),
  calibratedAt:      nz(z.string().datetime()),
});

@ApiThrottle()
@ApiTags('QC — Instrument Calibration')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Roles('admin', 'super_admin', 'director', 'manager', 'qc_manager', 'supervisor')
@UseInterceptors(AuditInterceptor)
@Controller('qc/calibrations')
export class InstrumentCalibrationController {
  constructor(private readonly repo: InstrumentCalibrationRepository) {}

  @ApiOperation({ summary: 'List instrument calibrations (?dueSoon=true)' })
  @Get()
  async list(@Query('dueSoon') dueSoon?: string | boolean) {
    // query 'true' string yoki coerce qilingan boolean — ikkalasini ham qamrab olamiz
    const dueSoonOnly = String(dueSoon) === 'true' || String(dueSoon) === '1';
    const r = await this.repo.list(dueSoonOnly);
    assertOk(r); return r.data;
  }

  @ApiOperation({ summary: 'Get calibration' })
  @Get(':id')
  async get(@Param('id') id: string) { const r = await this.repo.getById(Number(id)); assertOk(r); return r.data; }

  @ApiOperation({ summary: 'Register instrument' })
  @Post()
  async create(@Body() body: unknown) {
    const d = CreateSchema.parse(body);
    const r = await this.repo.create(d); assertOk(r); return r.data;
  }

  @ApiOperation({ summary: 'Update instrument' })
  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: unknown) {
    const d = UpdateSchema.parse(body);
    const r = await this.repo.update(Number(id), d); assertOk(r); return { success: true };
  }

  @ApiOperation({ summary: 'Record calibration (advances next due)' })
  @Post(':id/calibrate')
  async calibrate(@Param('id') id: string, @Body() body: unknown) {
    const d = CalibrateSchema.parse(body);
    const r = await this.repo.calibrate(Number(id), d.certificateNumber, d.calibratedAt);
    assertOk(r); return r.data;
  }

  @ApiOperation({ summary: 'Delete instrument' })
  @Delete(':id')
  async remove(@Param('id') id: string) { const r = await this.repo.remove(Number(id)); assertOk(r); return { success: true }; }
}
