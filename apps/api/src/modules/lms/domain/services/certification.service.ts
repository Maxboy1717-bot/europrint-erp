import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger } from '@nestjs/common';
import { Result, AppError, safeCall } from '@common/result';
import { LmsRepository } from '../../infrastructure/repositories/drizzle-lms.repo';

export interface CertCheckResult {
  valid: boolean;
  reason?: string;
  expiresAt?: Date;
  courseName?: string;
}

@Injectable()
export class CertificationService {
  private readonly logger = new Logger(CertificationService.name);

  constructor(private lmsRepo: LmsRepository) {}

  async checkOperatorCertification(
    operatorId: number,
    courseId: number
  ): Promise<Result<object, AppError>> {
      return safeCall(async () => {
        this.logger.debug(
          `Checking certification for operator ${operatorId}, Course: ${courseId}`
        );
  
        const cert = await this.lmsRepo.findByOperatorAndCourse(operatorId, courseId);
  
        if (!cert) {
          this.logger.warn(
            `Certificate not found - Operator: ${operatorId}, Course: ${courseId}`
          );
          return { valid: false, reason: 'Sertifikat topilmadi' };
        }
  
        if (cert.status !== 'active') {
          this.logger.warn(`Certificate revoked - Operator: ${operatorId}`);
          return {
            valid: false,
            reason: 'Sertifikat bekor qilindi',
            expiresAt: cert.expiresAt as Date | undefined,
            courseName: cert.courseName as string | undefined,
          };
        }
  
        if (cert.expiresAt && _time.now() > (cert.expiresAt as Date)) {
          this.logger.warn(`Certificate expired - Operator: ${operatorId}`);
          return {
            valid: false,
            reason: 'Sertifikat muddati tugagan',
            expiresAt: cert.expiresAt as Date | undefined,
            courseName: cert.courseName as string | undefined,
          };
        }
  
        this.logger.debug(
          `Certificate valid - Operator: ${operatorId}, Expires: ${cert.expiresAt}`
        );
        return {
          valid: true,
          expiresAt: cert.expiresAt as Date | undefined,
          courseName: cert.courseName as string | undefined,
        };
      });
  }

  async getAllOperatorCertifications(operatorId: number): Promise<CertCheckResult[]> {
      const certs = await this.lmsRepo.findByOperatorId(operatorId);
      return (Array.isArray(certs) ? certs : []).map((cert: Record<string, unknown>) => ({
        valid: cert.status === 'active' && (!cert.expiresAt || _time.now() < (cert.expiresAt as Date)),
        expiresAt: cert.expiresAt as Date | undefined,
        courseName: cert.courseName as string | undefined,
      }));
  }
}
