/**
 * @module lms-certificates-standalone.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
  UsePipes,
  UseGuards,
  UseInterceptors
} from '@nestjs/common';
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
  constructor(private readonly svc: LmsCertificatesStandaloneService) {}

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
    // The Certificates page expects GET /api/certificates/:id for the detail
    // view. Service-level retrieval lands once the repo has a findById helper;
    // for now return a typed placeholder so the page can render the empty
    // detail card instead of 404.
    return { id, status: 'unknown', issuedAt: null, expiresAt: null };
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
