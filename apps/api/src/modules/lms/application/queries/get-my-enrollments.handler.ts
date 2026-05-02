import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { LmsRepository } from '../../infrastructure/repositories/drizzle-lms.repo';
import { Enrollment } from '../../domain/repositories/i-lms.repo';
import { GetMyEnrollmentsQuery } from './get-my-enrollments.query';
import { Result } from '@common/types/result.type';

@Injectable()
@QueryHandler(GetMyEnrollmentsQuery)
export class GetMyEnrollmentsHandler implements IQueryHandler<GetMyEnrollmentsQuery> {
  private readonly logger = new Logger(GetMyEnrollmentsHandler.name);

  constructor(private readonly lmsRepo: LmsRepository) {}

  async execute(query: GetMyEnrollmentsQuery): Promise<Result<{ items: Enrollment[]; total: number }>> {
      return await this.lmsRepo.findEnrollmentsByUser(query.userId, {
        status: query.status,
        page: query.page,
        limit: query.limit,
      });
  }
}
