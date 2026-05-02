import {
Controller, Get, Patch, Post, Body, Param, ParseIntPipe,
  UseGuards, UseInterceptors, UsePipes,
} from '@nestjs/common';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { Throttle } from '@nestjs/throttler';
import { HrSafetyService } from './hr-safety.service';
import {
  HrSafetyUpdateIncidentSchema, HrSafetyUpdateIncidentDto,
  HrSafetyUpdateHazardZoneSchema, HrSafetyUpdateHazardZoneDto,
  HrSafetyExportPdfSchema, HrSafetyExportPdfDto,
} from './dto/hr-safety.dto';

const HR_ROLES = ['SUPER_ADMIN', 'DIRECTOR', 'HR_MANAGER', 'HR_SPECIALIST', 'SAFETY_OFFICER', 'admin'] as const;

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...HR_ROLES)
@Controller('hr/safety')
export class HrSafetyController {
  constructor(private readonly svc: HrSafetyService) {}

  @Get('department-summary')
  async getDepartmentSummary() {
    const r = await this.svc.getDepartmentSummary();
    const rows = r.ok && Array.isArray(r.data) ? r.data : [];
    return { items: rows, total: rows.length };
  }

  @Get('incidents/:id')
  async getIncident(@Param('id', ParseIntPipe) id: number) {
    const r = await this.svc.getIncidentById(id);
    const row = r.ok ? (r.data ?? {}) : {};
    return { data: row };
  }

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

  @Get('hazard-zones/:id')
  async getHazardZone(@Param('id', ParseIntPipe) id: number) {
    const r = await this.svc.getHazardZoneById(id);
    const row = r.ok ? (r.data ?? {}) : {};
    return { data: row };
  }

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

  @Post('export/pdf')
  @UsePipes(new ZodValidationPipe(HrSafetyExportPdfSchema))
  async exportPdf(@Body() _body: HrSafetyExportPdfDto) {
    const r = await this.svc.getAllIncidents();
    const rows = r.ok && Array.isArray(r.data) ? r.data : [];
    return { data: { exported: true, count: rows.length, format: 'pdf' } };
  }
}
