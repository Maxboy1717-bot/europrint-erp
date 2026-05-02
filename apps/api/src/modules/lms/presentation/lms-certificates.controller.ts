import {
Body,
  Controller,
  Get,
  InternalServerErrorException,
  Logger,
  Param,
  Post,
  UseGuards,
  UseInterceptors, UsePipes,
} from '@nestjs/common';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { throwFromError, unwrapOrThrow, assertOk } from '@common/http-result';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Throttle } from '@nestjs/throttler';
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

@Throttle({ default: { limit: 100, ttl: 60_000 } })
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

  @Post('issue')
  @UsePipes(new ZodValidationPipe(LmsIssueCertificateSchema))
  @Roles('TRAINING_OFFICER', 'HR_MANAGER', 'SUPER_ADMIN')
  async issueCertificate(
    @Body() body: LmsIssueCertificateDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    this.logger.log(`Issuing certificate - Employee: ${body.employeeId}, Course: ${body.courseId}`);
    const result = await this.commandBus.execute(
      new IssueCertificateCommand(
        body.employeeId,
        body.courseId,
        body.courseName ?? String(body.courseId),
        body.validityMonths ?? 12,
        user?.employeeId ?? user?.sub ?? 0,
      ),
    );
    assertOk(result);
    return { message: 'Sertifikat berildi', data: result.data };
  }

  @Get('operator/:operatorId')
  @Roles('TRAINING_OFFICER', 'HR_MANAGER', 'DIRECTOR', 'SUPER_ADMIN')
  async getOperatorCertificates(@Param('operatorId') operatorId: string) {
    return unwrapOrThrow(await this.queryBus.execute(new OperatorCertificationsQuery(parseInt(operatorId, 10))));
  }

  @Get(':employeeId')
  @Roles('EMPLOYEE', 'TRAINING_OFFICER', 'HR_MANAGER', 'SUPER_ADMIN', 'DIRECTOR')
  async getEmployeeCertificates(@Param('employeeId') employeeId: string) {
    return unwrapOrThrow(await this.lmsRepo.findCertificatesByEmployee(parseInt(employeeId, 10)));
  }

  @Post(':certificateId/revoke')
  @UsePipes(new ZodValidationPipe(LmsRevokeCertificateSchema))
  @Roles('HR_MANAGER', 'DIRECTOR', 'SUPER_ADMIN')
  async revokeCertificate(@Param('certificateId') certificateId: string, @Body() _body: LmsRevokeCertificateDto) {
    this.logger.log(`Revoking certificate ${certificateId}`);
    await this.lmsRepo.updateCertificateStatus(parseInt(certificateId, 10), 'revoked');
    return { message: 'Sertifikat bekor qilindi', certificateId };
  }

  @Post('check-mes')
  @UsePipes(new ZodValidationPipe(LmsCheckCertForMesSchema))
  @Roles('EMPLOYEE', 'OPERATOR', 'HR_SPECIALIST', 'SUPER_ADMIN')
  async checkCertForMes(@Body() body: LmsCheckCertForMesDto) {
    const check = await this.lmsRepo.checkOperatorCertForMes(body.employeeId, body.courseId);
    return { data: check, blocked: !check.valid };
  }
}
