/**
 * @module lms-certificates-standalone.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  Res,
  UsePipes,
  UseGuards,
  UseInterceptors
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { db, rawSql } from '@shared/db';
import { sql } from 'drizzle-orm';
type Rows = { rows?: unknown[] };
import { unwrapOrInternal, throwFromError } from '@common/http-result';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { AuthenticatedUser } from '@common/types/user.types';
import { DocumentAccessLogService } from '@common/document-control/document-access-log.service';
import { LmsCertificatesStandaloneService } from '../application/services/lms-certificates-standalone.service';
import { LmsCertificatePdfService } from '../application/services/lms-certificate-pdf.service';
import { CreateCertificateSchema, CreateCertificateDto } from './dto/lms-questionnaire.dto';
import type { FastifyReply, FastifyRequest } from 'fastify';

@ApiThrottle()
@Controller('certificates')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class LmsCertificatesStandaloneController {
  constructor(
    private readonly svc: LmsCertificatesStandaloneService,
    private readonly i18n: I18nService,
    private readonly accessLog: DocumentAccessLogService,
    private readonly certPdfSvc: LmsCertificatePdfService,
  ) {}

  @Get('expiring')
  @Roles('HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  async getExpiringCertificates(@Query('days') days?: string) {
    const result = await this.svc.getExpiringCertificates(days ? parseInt(days, 10) : 30);
    return unwrapOrInternal(result);
  }

  @Get()
  @Roles('EMPLOYEE', 'HR_SPECIALIST', 'HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  async listCertificates(
    @Query() query: { employeeId?: string; page?: string; limit?: string },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const result = await this.svc.listCertificates(
      { page: parseInt(query.page ?? '1', 10), limit: parseInt(query.limit ?? '20', 10), employeeId: query.employeeId },
      { id: user.id, role: user.role },
    );
    return unwrapOrInternal(result);
  }

  @Post()
  @Roles('TRAINING_OFFICER', 'HR_MANAGER', 'SUPER_ADMIN', 'DIRECTOR')
  @UsePipes(new ZodValidationPipe(CreateCertificateSchema))
  async createCertificate(
    @Body() dto: CreateCertificateDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: FastifyRequest,
  ) {
    // LMS-12 #30 (legal-minimal cert fields, vision docs/audit/vision-1000-answers/12-lms.md
    // #30): capture the issuing IP at issuance time — same pattern as
    // auth-account.controller.ts resendOtp().
    const issuedIp = (req.ip as string) || 'unknown';
    const result = await this.svc.createCertificate(dto, String(user?.id ?? 0), issuedIp);
    const data = unwrapOrInternal(result);
    return { message: 'Sertifikat yaratildi', data };
  }

  // Single source of truth for a certificate row. NB: certificates has BOTH `expires_at`
  // (always NULL — no writer) and `expiry_date` (the real column every insert/sweep uses); read
  // the real one. `name` is likewise never written, so the holder name comes from the employee
  // join. LEFT JOINs so a cert with a missing employee/course link is still viewable.
  private async _fetchCertificate(id: string): Promise<Record<string, unknown> | null> {
    const r = await rawSql(sql`
      SELECT cert.id::text AS id, cert.status,
             cert.certificate_number AS "certificateNumber", cert.cert_number AS "certNumber",
             cert.name, COALESCE(cert.issued_at, cert.issued_date) AS "issuedAt",
             cert.expiry_date AS "expiresAt", cert.is_active AS "isActive", cert.created_at AS "createdAt",
             NULLIF(TRIM(COALESCE(emp.first_name,'') || ' ' || COALESCE(emp.last_name,'')), '') AS "holderName",
             c.title_uz AS "courseTitle"
      FROM certificates cert
      LEFT JOIN employees emp ON emp.id = cert.employee_id
      LEFT JOIN courses c ON c.id = cert.course_id
      WHERE cert.id = ${parseInt(id, 10)}
    `);
    return (r as { rows?: Record<string, unknown>[] }).rows?.[0] ?? null;
  }

  @Get(':id')
  @Roles('EMPLOYEE', 'HR_SPECIALIST', 'HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  async getCertificateById(@Param('id') id: string, @Req() req: FastifyRequest) {
    const row = await this._fetchCertificate(id);
    if (!row) throw new NotFoundException(await this.i18n.t('errors.certificateNotFoundWithId', { args: { id } }));
    // STEP 3.10 roll-out — log the single-certificate view.
    await this.accessLog.logFromReq(req, { documentType: 'lms_certificate', documentId: id, action: 'view' });
    return row;
  }

  @Delete(':id')
  @Roles('TRAINING_OFFICER', 'HR_MANAGER', 'SUPER_ADMIN', 'DIRECTOR')
  @HttpCode(HttpStatus.OK)
  async deleteCertificate(@Param('id') id: string) {
    await db.execute(sql`DELETE FROM certificates WHERE id = ${parseInt(id, 10)}`);
    return { deleted: true, id };
  }

  @Get(':id/download')
  @Roles('EMPLOYEE', 'HR_SPECIALIST', 'HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  async downloadCertificate(@Param('id') id: string, @Res({ passthrough: true }) res: FastifyReply, @Req() req: FastifyRequest): Promise<Buffer> {
    // Item #64: was HTML (green-lie stub predecessor was hardcoded, then a follow-up fix made it
    // real-data HTML — still not a document a certificate is supposed to be). Now a real PDF via
    // LmsCertificatePdfService (mirrors the QC/Razryad certificate-PDF pattern, same as
    // razryad-history.controller.ts's certificatePdf()).
    const result = await this.certPdfSvc.generateForCertificate(parseInt(id, 10));
    if (!result.ok) throwFromError(result.error);
    const { certNumber, pdf } = result.data;
    // STEP 3.10 roll-out — certificate download is a print-class event.
    await this.accessLog.logFromReq(req, { documentType: 'lms_certificate', documentId: id, action: 'print' });
    void res
      .header('Content-Type', 'application/pdf')
      .header('Content-Disposition', `attachment; filename="${certNumber}.pdf"`)
      .header('X-Certificate-Number', certNumber);
    return pdf;
  }
}
