/**
 * @module hr-safety.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import {
Controller, Get, Patch, Post, Delete, Body, Param, ParseIntPipe, Res,
  UseGuards, UseInterceptors, UsePipes, NotFoundException, InternalServerErrorException,
} from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { I18nService } from 'nestjs-i18n';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { HrSafetyService } from './hr-safety.service';
import { HrCompatSafetyService } from '../application/hr-compat-safety.service';
import {
  HrSafetyUpdateIncidentSchema, HrSafetyUpdateIncidentDto,
  HrSafetyUpdateHazardZoneSchema, HrSafetyUpdateHazardZoneDto,
  HrSafetyExportPdfSchema, HrSafetyExportPdfDto,
} from './dto/hr-safety.dto';

const HR_ROLES = ['SUPER_ADMIN', 'DIRECTOR', 'HR_MANAGER', 'HR_SPECIALIST', 'SAFETY_OFFICER', 'admin'] as const;

@ApiThrottle()
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...HR_ROLES)
@ApiTags('Hr Safety')
@ApiBearerAuth()
@Controller('hr/safety')
export class HrSafetyController {
  constructor(
    private readonly svc: HrSafetyService,
    private readonly i18n: I18nService,
    private readonly compatSafetySvc: HrCompatSafetyService,
  ) {}

  @ApiOperation({ summary: 'Get department summary' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('department-summary')
  async getDepartmentSummary() {
    const r = await this.svc.getDepartmentSummary();
    const rows = r.ok && Array.isArray(r.data) ? r.data : [];
    return { items: rows, total: rows.length };
  }

  @ApiOperation({ summary: 'Get incident' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('incidents/:id')
  async getIncident(@Param('id', ParseIntPipe) id: number) {
    const r = await this.svc.getIncidentById(id);
    const row = r.ok ? (r.data ?? {}) : {};
    return { data: row };
  }

  // NOTE: safety_incidents jadvalida soft-delete ustuni (deleted_at) yo'q —
  // jismoniy DELETE audit-trailni yo'q qiladi, shu sabab bu endpoint incidentni
  // "closed" holatiga o'tkazadi (yopish), jismoniy o'chirish EMAS. Mavjud
  // bo'lmagan id uchun endi 404 qaytaradi (avval soxta {deleted:true} edi).
  @ApiOperation({ summary: 'Close incident (soft-close, not a physical delete)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Delete('incidents/:id')
  async deleteIncident(@Param('id', ParseIntPipe) id: number) {
    const r = await this.svc.updateIncident(id, { status: 'closed' } as HrSafetyUpdateIncidentDto);
    if (!r.ok) throw new NotFoundException(await this.i18n.t('errors.incidentNotFoundWithId', { args: { id } }));
    return { data: { closed: true, id, incident: r.data } };
  }

  @ApiOperation({ summary: 'Update incident' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Patch('incidents/:id')
  @UsePipes(new ZodValidationPipe(HrSafetyUpdateIncidentSchema))
  async updateIncident(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: HrSafetyUpdateIncidentDto,
  ) {
    const r = await this.svc.updateIncident(id, body);
    const row = r.ok ? (r.data ?? {}) : {};
    return { data: row };
  }

  @ApiOperation({ summary: 'Get hazard zone' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('hazard-zones/:id')
  async getHazardZone(@Param('id', ParseIntPipe) id: number) {
    const r = await this.svc.getHazardZoneById(id);
    const row = r.ok ? (r.data ?? {}) : {};
    return { data: row };
  }

  @ApiOperation({ summary: 'Update hazard zone' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Patch('hazard-zones/:id')
  @UsePipes(new ZodValidationPipe(HrSafetyUpdateHazardZoneSchema))
  async updateHazardZone(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: HrSafetyUpdateHazardZoneDto,
  ) {
    const r = await this.svc.updateHazardZone(id, body);
    const row = r.ok ? (r.data ?? {}) : {};
    return { data: row };
  }

  // NOTE (2026-07-13, HR Nazorat fix): this endpoint used to fake success — it returned
  // { exported: true, count, format: 'pdf' } as JSON instead of an actual PDF binary
  // (Q-10 no-fake-success violation). GET /api/hr/safety/export/pdf (HrCompatSafetyController
  // .exportSafetyPdf) already builds a REAL pdf-lib report from the same safety_incidents
  // table — reused here (rather than duplicating the pdf-lib layout code) so this POST
  // variant returns a genuine PDF binary too, following the same @Res()+FastifyReply
  // Content-Type/Content-Disposition pattern used by finance reports.controller.ts
  // exportTrialBalancePdf and org-export.service consumers.
  @ApiOperation({ summary: 'Export pdf' })
  @ApiResponse({ status: 200, description: 'application/pdf' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('export/pdf')
  @UsePipes(new ZodValidationPipe(HrSafetyExportPdfSchema))
  async exportPdf(@Body() _body: HrSafetyExportPdfDto, @Res() res: FastifyReply) {
    const result = await this.compatSafetySvc.generateSafetyIncidentReport();
    if (!result.ok) {
      // Matches the message used by the GET counterpart (hr-compat-safety.controller.ts
      // exportSafetyPdf) — no dedicated i18n key exists for this yet (out of scope to add).
      throw new InternalServerErrorException('PDF yaratishda xatolik');
    }
    const buffer = result.data;
    res
      .header('Content-Type', 'application/pdf')
      .header('Content-Disposition', 'attachment; filename="safety-incidents.pdf"')
      .header('Content-Length', buffer.length)
      .send(buffer);
  }
}
