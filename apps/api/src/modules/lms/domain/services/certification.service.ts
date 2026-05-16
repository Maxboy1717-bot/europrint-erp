/**
 * @module certification.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Inject, Logger } from '@nestjs/common';
import { Result, AppError, safeCall } from '@common/result';
import type { ILmsRepo } from '../repositories/i-lms.repo';
import { LMS_REPO } from '../repositories/i-lms.repo';

export interface CertCheckResult {
  valid: boolean;
  reason?: string;
  expiresAt?: Date;
  courseName?: string;
}

// Local row contract for the cert lookups used here. The concrete repo's
// LMS_REPO provider (LmsRepository) exposes findByOperatorAndCourse /
// findByOperatorId via delegation to LmsCertRepo. Keep the shape flexible —
// only the four fields below are touched by this service.
interface CertLookupRow {
  status?: string;
  expiresAt?: Date | null;
  courseName?: string | null;
}

interface IOperatorCertRepo {
  findByOperatorAndCourse(operatorId: number, courseId: number): Promise<CertLookupRow | null>;
  findByOperatorId(operatorId: number): Promise<Record<string, unknown>[]>;
}

@Injectable()
export class CertificationService {
  private readonly logger = new Logger(CertificationService.name);

  constructor(
    @Inject(LMS_REPO) private readonly lmsRepo: ILmsRepo & IOperatorCertRepo,
  ) {}

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
