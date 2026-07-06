/**
 * @module lms-certificates-standalone.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
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
  Res,
  UsePipes,
  UseGuards,
  UseInterceptors
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { db, rawSql } from '@shared/db';
import { sql } from 'drizzle-orm';
type Rows = { rows?: unknown[] };
import { unwrapOrInternal } from '@common/http-result';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { AuthenticatedUser } from '@common/types/user.types';
import { LmsCertificatesStandaloneService } from '../application/services/lms-certificates-standalone.service';
import { CreateCertificateSchema, CreateCertificateDto } from './dto/lms-questionnaire.dto';
import type { FastifyReply } from 'fastify';

@ApiThrottle()
@Controller('certificates')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class LmsCertificatesStandaloneController {
  constructor(
    private readonly svc: LmsCertificatesStandaloneService,
    private readonly i18n: I18nService,
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
  async createCertificate(@Body() dto: CreateCertificateDto, @CurrentUser() user: AuthenticatedUser) {
    const result = await this.svc.createCertificate(dto, String(user?.id ?? 0));
    const data = unwrapOrInternal(result);
    return { message: 'Sertifikat yaratildi', data };
  }

  @Get(':id')
  @Roles('EMPLOYEE', 'HR_SPECIALIST', 'HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  async getCertificateById(@Param('id') id: string) {
    const r = await rawSql(sql`
      SELECT id::text AS id, status, certificate_number AS "certificateNumber",
             cert_number AS "certNumber", name, issued_at AS "issuedAt",
             expires_at AS "expiresAt", is_active AS "isActive", created_at AS "createdAt"
      FROM certificates WHERE id = ${parseInt(id, 10)}
    `);
    const row = (r as { rows?: Record<string, unknown>[] }).rows?.[0];
    if (!row) throw new NotFoundException(await this.i18n.t('errors.certificateNotFoundWithId', { args: { id } }));
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
  async downloadCertificate(@Param('id') id: string, @Res() res: FastifyReply) {
    const html = [
      '<!DOCTYPE html><html lang="uz"><head><meta charset="UTF-8">',
      `<title>Sertifikat #${id}</title></head>`,
      '<body style="font-family:sans-serif;text-align:center;padding:60px">',
      '<h1>EuroPrint ERP Sertifikati</h1>',
      `<p>Sertifikat raqami: <strong>${id}</strong></p>`,
      `<p>Sana: ${_time.now().toLocaleDateString('uz-UZ')}</p>`,
      '</body></html>',
    ].join('');
    res.header('Content-Type', 'text/html');
    res.header('Content-Disposition', `attachment; filename="certificate-${id}.html"`);
    return res.send(html);
  }
}
