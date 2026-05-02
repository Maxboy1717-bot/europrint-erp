import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { LmsRepository } from '../../infrastructure/repositories/drizzle-lms.repo';
import { Result, Ok } from '@common/result';

import { MS_PER_DAY } from '@common/constants/app.constants';
export class OperatorCertificationsQuery {
  private readonly logger = new Logger(OperatorCertificationsQuery.name);

  constructor(public readonly operatorId: number) {}
}

export interface CertificationInfo {
  certificateId: number;
  courseId: number;
  courseName: string;
  issuedAt: Date;
  expiresAt?: Date;
  status: string;
  isValid: boolean;
  daysUntilExpiry?: number;
}

@QueryHandler(OperatorCertificationsQuery)
export class OperatorCertificationsHandler implements IQueryHandler<OperatorCertificationsQuery> {
  private logger = new Logger('OperatorCertificationsHandler');

  constructor(private lmsRepo: LmsRepository) {}

  async execute(query: OperatorCertificationsQuery): Promise<Result<CertificationInfo[]>> {
      this.logger.debug(`Fetching certifications for operator ${query.operatorId}`);

      const certs = await this.lmsRepo.findByOperatorId(query.operatorId);

      const certInfos = (certs as Record<string, unknown>[]).map((cert: Record<string, unknown>) => {
        const isValid = cert.status === 'active' && (!cert.expiresAt || _time.now() < cert.expiresAt);
        let daysUntilExpiry: number | undefined;

        if (cert.expiresAt) {
          const now = _time.now();
          const diffTime = (cert.expiresAt as Date).getTime() - now.getTime();
          daysUntilExpiry = Math.ceil(diffTime / MS_PER_DAY);
        }

        return {
          certificateId: cert.id,
          courseId: cert.courseId,
          courseName: cert.courseName,
          issuedAt: cert.issuedAt,
          expiresAt: cert.expiresAt,
          status: cert.status,
          isValid,
          daysUntilExpiry,
        };
      });

      this.logger.log(
        `Certifications retrieved - Operator: ${query.operatorId}, Count: ${certInfos.length}`
      );

      return Ok(certInfos as CertificationInfo[]);
  }
}
