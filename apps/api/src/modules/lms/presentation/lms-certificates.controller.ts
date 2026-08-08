/**
 * @module lms-certificates.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import {
Body,
  Controller,
  Get,
  InternalServerErrorException,
  Logger,
  Param,
  Post,
  Req,
  UseGuards,
  UseInterceptors, UsePipes,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { throwFromError, unwrapOrThrow, assertOk } from '@common/http-result';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { LmsRepository } from '../infrastructure/repositories/drizzle-lms.repo';
import { IssueCertificateCommand } from '../application/commands/issue-certificate.handler';
import { OperatorCertificationsQuery } from '../application/queries/operator-certifications.handler';
import { AuthenticatedUser } from '@auth/types';
import {
  LmsIssueCertificateSchema, LmsIssueCertificateDto,
  LmsRevokeCertificateSchema, LmsRevokeCertificateDto,
  LmsCheckCertForMesSchema, LmsCheckCertForMesDto,
} from '../dto/lms.dto';

@ApiThrottle()
@ApiTags('Lms Certificates')
@ApiBearerAuth()
@Controller('lms/certificates')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class LmsCertificatesController {
  private readonly logger = new Logger(LmsCertificatesController.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly lmsRepo: LmsRepository,
  ) {}

  @ApiOperation({ summary: 'Issue certificate' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('issue')
  @UsePipes(new ZodValidationPipe(LmsIssueCertificateSchema))
  @Roles('TRAINING_OFFICER', 'HR_MANAGER', 'SUPER_ADMIN')
  async issueCertificate(
    @Body() body: LmsIssueCertificateDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: FastifyRequest,
  ) {
    this.logger.log(`Issuing certificate - Employee: ${body.employeeId}, Course: ${body.courseId}`);
    // LMS-12 #30 (legal-minimal cert fields, vision docs/audit/vision-1000-answers/12-lms.md
    // #30): capture the issuing IP at issuance time — same pattern as
    // auth-account.controller.ts resendOtp().
    const issuedIp = (req.ip as string) || 'unknown';
    const result = await this.commandBus.execute(
      new IssueCertificateCommand(
        body.employeeId,
        body.courseId,
        body.courseName ?? String(body.courseId),
        body.validityMonths ?? 12,
        user?.employeeId ?? user?.sub ?? 0,
        issuedIp,
      ),
    );
    assertOk(result);
    return { message: 'Sertifikat berildi', data: result.data };
  }

  @ApiOperation({ summary: 'Get operator certificates' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('operator/:operatorId')
  @Roles('TRAINING_OFFICER', 'HR_MANAGER', 'DIRECTOR', 'SUPER_ADMIN')
  async getOperatorCertificates(@Param('operatorId') operatorId: string) {
    return unwrapOrThrow(await this.queryBus.execute(new OperatorCertificationsQuery(parseInt(operatorId, 10))));
  }

  @ApiOperation({ summary: 'Get employee certificates' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get(':employeeId')
  @Roles('EMPLOYEE', 'TRAINING_OFFICER', 'HR_MANAGER', 'SUPER_ADMIN', 'DIRECTOR')
  async getEmployeeCertificates(@Param('employeeId') employeeId: string) {
    return unwrapOrThrow(await this.lmsRepo.findCertificatesByEmployee(parseInt(employeeId, 10)));
  }

  @ApiOperation({ summary: 'Revoke certificate' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Post(':certificateId/revoke')
  @UsePipes(new ZodValidationPipe(LmsRevokeCertificateSchema))
  @Roles('HR_MANAGER', 'DIRECTOR', 'SUPER_ADMIN')
  async revokeCertificate(@Param('certificateId') certificateId: string, @Body() _body: LmsRevokeCertificateDto) {
    this.logger.log(`Revoking certificate ${certificateId}`);
    await this.lmsRepo.updateCertificateStatus(parseInt(certificateId, 10), 'revoked');
    return { message: 'Sertifikat bekor qilindi', certificateId };
  }

  @ApiOperation({ summary: 'Check cert for mes' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('check-mes')
  @UsePipes(new ZodValidationPipe(LmsCheckCertForMesSchema))
  @Roles('EMPLOYEE', 'OPERATOR', 'HR_SPECIALIST', 'SUPER_ADMIN')
  async checkCertForMes(@Body() body: LmsCheckCertForMesDto) {
    const check = await this.lmsRepo.checkOperatorCertForMes(body.employeeId, body.courseId);
    return { data: check, blocked: !check.valid };
  }
}
