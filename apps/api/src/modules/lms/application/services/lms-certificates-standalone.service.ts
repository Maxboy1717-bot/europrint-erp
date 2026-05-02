import { Injectable } from '@nestjs/common';
import { castTo } from '@common/db-rows';
import { Result } from '@common/result';
import { LmsCoursesExtendedRepository } from '../../infrastructure/repositories/drizzle-lms-courses-extended.repo';
import { CreateCertificateDto } from '../../presentation/dto/lms-questionnaire.dto';

const PRIVILEGED_ROLES = new Set([
  'hr_manager', 'training_officer', 'super_admin', 'director', 'hr_specialist',
]);

function isPrivileged(role: string): boolean {
  return PRIVILEGED_ROLES.has(role.toLowerCase());
}

@Injectable()
export class LmsCertificatesStandaloneService {
  constructor(private readonly repo: LmsCoursesExtendedRepository) {}

  async getExpiringCertificates(days: number): Promise<Result<object[]>> {
    return this.repo.findExpiringCertificates(days);
  }

  async listCertificates(
    filters: { page: number; limit: number; employeeId?: string },
    user: { id: number; role: string },
  ): Promise<Result<{ items: unknown[]; total: number }>> {
    const restrictToOwn = !isPrivileged(user.role);
    const effectiveEmployeeId = restrictToOwn ? String(user.id) : filters.employeeId;
    return this.repo.findAllCertificates({ ...filters, employeeId: effectiveEmployeeId });
  }

  async createCertificate(
    dto: CreateCertificateDto,
    userId: string,
  ): Promise<Result<Record<string, unknown>>> {
    return this.repo.saveCertificate(castTo<Record<string, unknown>>(dto), userId);
  }
}
