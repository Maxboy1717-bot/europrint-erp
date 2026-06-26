/**
 * @module qc-new.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Controller, Get, Post, Query, Param, Body, Res, UseGuards, UseInterceptors, NotFoundException } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { Roles } from '@common/decorators/roles.decorator';
import { Role } from '@common/constants/roles.constants';
import { unwrapOrInternal, unwrapOrNotFound, throwFromError } from '@common/http-result';
import { notImplemented } from '@common/exceptions/not-implemented';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';
import { QcNewService } from '../application/qc-new.service';
import { QcCertificatePdfService } from '../application/qc-certificate-pdf.service';
import { SpcService } from '../domain/services/spc.service';
import { QcAqlService } from '../domain/services/qc-aql.service';
import type { AqlInspectionLevel, AqlLevel } from '../constants/qc-aql.constants';
import { z } from 'zod';

const CheckpointDto = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  stage: z.enum(['incoming', 'in_process', 'final', 'dispatch']).default('in_process'),
  standard_id: z.number().optional(),
});

/**
 * Zod schema for GET /qc/aql/plan query parameters.
 * All three fields are required; defaults mirror the ISO 2859-1 owner defaults.
 */
const AqlPlanQuerySchema = z.object({
  lotSize: z.coerce.number().int().positive('lotSize must be a positive integer'),
  aql: z.coerce.number().refine(
    (v): v is AqlLevel => [0.65, 1.0, 1.5, 2.5, 4.0, 6.5].includes(v),
    { message: 'aql must be one of: 0.65, 1.0, 1.5, 2.5, 4.0, 6.5' },
  ).default(2.5),
  level: z.enum(['I', 'II', 'III']).default('II'),
});

const CertificateDto = z.object({
  certNumber: z.string().min(1),
  orderId: z.number().int().optional(),
  productName: z.string().optional(),
  issuedDate: z.string().optional(),
  status: z.enum(['active', 'draft', 'revoked']).default('active'),
  notes: z.string().max(2000).optional(),
  issuedBy: z.string().optional(),
});

/** T21-A2 (Gap #19): sertifikat PDF generatsiya kirish parametrlari (raqam serverda beriladi). */
const GenerateCertPdfDto = z.object({
  orderId: z.number().int().optional(),
  productName: z.string().max(300).optional(),
  issuedBy: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
});

const LabTestDto = z.object({
  order_id: z.number().optional(),
  parameter_name: z.string().min(1),
  value: z.number().optional(),
  unit: z.string().optional(),
  min_value: z.number().optional(),
  max_value: z.number().optional(),
  tested_by: z.string().optional(),
  notes: z.string().optional(),
});

const QC_ROLES = [Role.SUPER_ADMIN, Role.DIRECTOR, Role.QC_SPECIALIST, Role.PRODUCTION_MANAGER, 'qc_manager', 'qc_inspector'];

@ApiTags('QC')
@ApiBearerAuth()
@ApiThrottle()
@Controller('qc')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class QcNewController {
  constructor(
    private readonly svc: QcNewService,
    private readonly spcSvc: SpcService,
    private readonly aqlSvc: QcAqlService,
    private readonly certPdfSvc: QcCertificatePdfService,
  ) {}

  @Get('dashboard')
  @Roles(...QC_ROLES)
  @ApiOperation({ summary: 'QC comprehensive dashboard' })
  async getDashboard() {
    return unwrapOrInternal(await this.svc.getDashboard());
  }

  @Get('checkpoints')
  @Roles(...QC_ROLES)
  @ApiOperation({ summary: 'List QC checkpoints' })
  async getCheckpoints(@Query('stage') stage?: string) {
    return unwrapOrInternal(await this.svc.getCheckpoints(stage));
  }

  @Post('checkpoints')
  @Roles(...QC_ROLES)
  @ApiOperation({ summary: 'Create QC checkpoint' })
  async createCheckpoint(@Body() body: unknown) {
    const dto = CheckpointDto.parse(body);
    return unwrapOrInternal(await this.svc.createCheckpoint(dto));
  }

  @Get('ai-trend')
  @Roles(...QC_ROLES)
  @ApiOperation({ summary: 'AI-powered QC trend analysis' })
  async getAiTrend() {
    return unwrapOrInternal(await this.svc.getAiTrend());
  }

  @Get('certificates')
  @Roles(...QC_ROLES)
  @ApiOperation({ summary: 'List quality certificates' })
  async getCertificates(@Query('status') status?: string) {
    return unwrapOrInternal(await this.svc.getCertificates(status));
  }

  @Post('certificates')
  @Roles(...QC_ROLES)
  @ApiOperation({ summary: 'Create quality certificate' })
  async createCertificate(@Body() body: unknown) {
    const dto = CertificateDto.parse(body);
    return unwrapOrInternal(await this.svc.createCertificate(dto));
  }

  /**
   * POST /qc/certificates/generate-pdf
   * T21-A2 (Gap #19): SF-<YYYY>-NNNNN raqam ketma-ket + sertifikat yozuvi + PDF.
   * PDF binar javob (application/pdf) sifatida qaytariladi (yuklab olish/ko'rish).
   */
  @Post('certificates/generate-pdf')
  @Roles(...QC_ROLES)
  @ApiOperation({ summary: 'T21-A2: Sertifikat PDF (SF-YYYY-NNNNN) generatsiya + saqlash + yuklash' })
  async generateCertificatePdf(
    @Body() body: unknown,
    @Res({ passthrough: true }) res: FastifyReply,
  ): Promise<Buffer> {
    const dto = GenerateCertPdfDto.parse(body);
    const result = await this.certPdfSvc.generate({
      orderId: dto.orderId ?? null,
      productName: dto.productName ?? null,
      issuedBy: dto.issuedBy ?? null,
      notes: dto.notes ?? null,
    });
    if (!result.ok) throwFromError(result.error);
    const { certNumber, pdf } = result.data;
    void res
      .header('Content-Type', 'application/pdf')
      .header('Content-Disposition', `attachment; filename="${certNumber}.pdf"`)
      .header('X-Certificate-Number', certNumber);
    return pdf;
  }

  /**
   * GET /qc/certificates/next-number
   * Keyingi sertifikat raqamini ko'rsatish (NEXTVAL — raqamni sarflaydi/oldindan ajratadi).
   */
  @Get('certificates/next-number')
  @Roles(...QC_ROLES)
  @ApiOperation({ summary: 'T21-A2: Keyingi sertifikat raqami (SF-YYYY-NNNNN) — sekvens nextval' })
  async getNextCertificateNumber() {
    const r = await this.certPdfSvc.nextCertificateNumber();
    if (!r.ok) throwFromError(r.error);
    return { certNumber: r.data };
  }

  @Get('lab-tests')
  @Roles(...QC_ROLES)
  @ApiOperation({ summary: 'List lab tests' })
  async getLabTests(@Query('orderId') orderId?: string) {
    return unwrapOrInternal(await this.svc.getLabTests(orderId));
  }

  @Post('lab-tests')
  @Roles(...QC_ROLES)
  @ApiOperation({ summary: 'Create lab test result' })
  async createLabTest(@Body() body: unknown) {
    const dto = LabTestDto.parse(body);
    return unwrapOrInternal(await this.svc.createLabTest(dto));
  }

  @Get('spc/control-chart')
  @Roles(...QC_ROLES)
  @ApiOperation({ summary: 'SPC control chart data' })
  async getSpcControlChart(@Query('parameterId') parameterId?: string) {
    const pid = parameterId ? parseInt(parameterId, 10) : undefined;
    return unwrapOrInternal(await this.svc.getSpcControlChart(pid));
  }

  @Get('control-charts')
  @Roles(...QC_ROLES)
  @ApiOperation({ summary: 'SPC control charts aggregated per parameter' })
  async getControlCharts() {
    const r = await db.execute(sql`
      SELECT parameter_id,
        COUNT(*)::int AS data_points,
        AVG(value)::numeric AS mean,
        MIN(value)::numeric AS min_val,
        MAX(value)::numeric AS max_val,
        MAX(measured_at) AS last_measured_at
      FROM qc_spc_data
      GROUP BY parameter_id ORDER BY last_measured_at DESC NULLS LAST
    `);
    const items = ((r as { rows?: unknown[] }).rows) ?? [];
    return { items, total: items.length };
  }

  @Get('control-charts/:processId')
  @Roles(...QC_ROLES)
  @ApiOperation({ summary: 'SPC control chart with UCL/LCL computation' })
  async getControlChart(
    @Param('processId') processId: string,
    @Query('n') n?: string,
  ) {
    const lastN = n ? Math.min(parseInt(n, 10) || 30, 100) : 30;
    const result = await this.spcSvc.getControlChart(parseInt(processId, 10), lastN);
    return unwrapOrNotFound(result);
  }

  @Get('supplier-quality/ratings')
  @Roles(...QC_ROLES)
  @ApiOperation({ summary: 'Supplier quality ratings aggregated' })
  async getSupplierQualityRatings() {
    return unwrapOrInternal(await this.svc.getSupplierQualityRatings());
  }

  // ─────────────────────────────────────────────────────────────────────────
  // AQL sampling-plan endpoints
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * GET /qc/aql/plan?lotSize=<n>&aql=<aql>&level=<I|II|III>
   *
   * Returns the ISO 2859-1 single-sampling plan for the supplied lot-size and
   * AQL/level parameters.  No DB access — the QcAqlService is pure compute.
   *
   * 400 when lotSize ≤ 0 / non-integer / below ISO minimum (2), or when the
   * AQL value is not supported for the resolved code letter.
   */
  @Get('aql/plan')
  @Roles(...QC_ROLES)
  @ApiOperation({ summary: 'ISO 2859-1 AQL sampling plan for a given lot size (pure compute)' })
  @ApiQuery({ name: 'lotSize', type: Number, required: true, description: 'Lot size (integer ≥ 2)' })
  @ApiQuery({ name: 'aql', type: Number, required: false, description: 'AQL level (default 2.5)' })
  @ApiQuery({ name: 'level', enum: ['I', 'II', 'III'], required: false, description: 'Inspection level (default II)' })
  getAqlPlan(@Query() query: unknown) {
    const parsed = AqlPlanQuerySchema.safeParse(query);
    if (!parsed.success) {
      // Zod error → 400 with first issue message
      const msg = parsed.error.issues[0]?.message ?? 'Invalid query parameters';
      throwFromError({ code: 'VALIDATION', message: msg });
    }
    const { lotSize, aql, level } = (parsed as { success: true; data: { lotSize: number; aql: AqlLevel; level: AqlInspectionLevel } }).data;
    const result = this.aqlSvc.plan(lotSize, aql, level);
    if (!result.ok) throwFromError(result.error);
    return result.data;
  }

  /**
   * GET /qc/inspections/:id/aql-plan
   *
   * Reads the qc_inspections row for the given id, uses items_checked as the
   * lot size (the count written at create time), and returns the ISO 2859-1
   * sampling plan.
   *
   * Accepts optional ?aql= and ?level= overrides; defaults to AQL 2.5 / Level II.
   * 404 when no inspection row exists.
   * 400 when items_checked is 0 / null (no lot size recorded yet).
   */
  @Get('inspections/:id/aql-plan')
  @Roles(...QC_ROLES)
  @ApiOperation({ summary: 'ISO 2859-1 AQL plan derived from an existing inspection\'s lot size' })
  @ApiQuery({ name: 'aql', type: Number, required: false, description: 'AQL override (default 2.5)' })
  @ApiQuery({ name: 'level', enum: ['I', 'II', 'III'], required: false, description: 'Inspection level override (default II)' })
  async getInspectionAqlPlan(
    @Param('id') id: string,
    @Query() query: unknown,
  ) {
    // Parse optional overrides (lotSize is not accepted here — it comes from the DB)
    const overrideSchema = z.object({
      aql: z.coerce.number().refine(
        (v): v is AqlLevel => [0.65, 1.0, 1.5, 2.5, 4.0, 6.5].includes(v),
        { message: 'aql must be one of: 0.65, 1.0, 1.5, 2.5, 4.0, 6.5' },
      ).default(2.5),
      level: z.enum(['I', 'II', 'III']).default('II'),
    });
    const parsedOverride = overrideSchema.safeParse(query);
    if (!parsedOverride.success) {
      const msg = parsedOverride.error.issues[0]?.message ?? 'Invalid query parameters';
      throwFromError({ code: 'VALIDATION', message: msg });
    }
    const { aql, level } = (parsedOverride as { success: true; data: { aql: AqlLevel; level: AqlInspectionLevel } }).data;

    // Fetch the inspection row — uses the existing service/repo (no new DB access)
    const inspResult = await this.svc.getInspectionById(id);
    if (!inspResult.ok) throwFromError(inspResult.error);
    const row = inspResult.data as Record<string, unknown> | null;
    if (row == null) {
      throwFromError({ code: 'NOT_FOUND', message: `Inspection ${id} topilmadi` });
    }

    // items_checked is the lot-size column that exists in both the Drizzle schema
    // and the live DB.  Graceful degrade: if the column is absent or zero → 400.
    const rawLotSize = (row as Record<string, unknown>)['items_checked'];
    const lotSize = rawLotSize != null ? Number(rawLotSize) : 0;
    if (!Number.isFinite(lotSize) || lotSize < 2) {
      throwFromError({
        code: 'VALIDATION',
        message: `Inspection ${id} da items_checked=${rawLotSize ?? 'null'} — AQL hisoblash uchun kamida 2 bo'lishi kerak`,
      });
    }

    const planResult = this.aqlSvc.plan(lotSize, aql, level);
    if (!planResult.ok) throwFromError(planResult.error);
    return { inspectionId: id, lotSize, aql, level, plan: planResult.data };
  }
}
