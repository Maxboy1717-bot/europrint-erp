import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { LmsRepository } from '../../infrastructure/repositories/drizzle-lms.repo';
import { Course } from '../../domain/repositories/i-lms.repo';
import { GetCoursesQuery } from './get-courses.query';
import { Result } from '@common/types/result.type';

@Injectable()
@QueryHandler(GetCoursesQuery)
export class GetCoursesHandler implements IQueryHandler<GetCoursesQuery> {
  private readonly logger = new Logger(GetCoursesHandler.name);

  constructor(private readonly lmsRepo: LmsRepository) {}

  async execute(query: GetCoursesQuery): Promise<Result<{ items: Course[]; total: number }>> {
      return await this.lmsRepo.findAllCourses({
        isMandatory: query.isMandatory,
        category: query.category,
        page: query.page,
        limit: query.limit,
      });
  }
}
