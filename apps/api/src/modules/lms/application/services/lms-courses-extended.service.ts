/**
 * @module lms-courses-extended.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable } from '@nestjs/common';
import { castTo } from '@common/db-rows';
import { Result } from '@common/result';
import { LmsCoursesExtendedRepository } from '../../infrastructure/repositories/drizzle-lms-courses-extended.repo';
import { CreateCourseDto, UpdateCourseDto, CreateLessonDto, UpdateLessonDto, CreateModuleDto } from '../../presentation/dto/courses.dto';
import { LmsMiscRepository } from '../../infrastructure/repositories/drizzle-lms-misc.repo';

@Injectable()
export class LmsCoursesExtendedService {
  constructor(
    private readonly coursesRepo: LmsCoursesExtendedRepository,
    private readonly miscRepo: LmsMiscRepository,
  ) {}

  async listCourses(filters: {
    category?: string;
    isMandatory?: boolean;
    page: number;
    limit: number;
  }): Promise<Result<{ items: unknown[]; total: number }>> {
    return this.coursesRepo.findAll(filters);
  }

  async getCourse(id: string): Promise<Result<Record<string, unknown>>> {
    return this.coursesRepo.findById(id);
  }

  async createCourse(dto: CreateCourseDto, userId: string): Promise<Result<Record<string, unknown>>> {
    return this.coursesRepo.create(castTo<Record<string, unknown>>(dto), userId);
  }

  async updateCourse(id: string, dto: UpdateCourseDto): Promise<Result<Record<string, unknown>>> {
    return this.coursesRepo.update(id, castTo<Record<string, unknown>>(dto));
  }

  async deleteCourse(id: string): Promise<Result<void>> {
    return this.coursesRepo.remove(id);
  }

  async completionTrend(months: number): Promise<Result<object[]>> {
    return this.coursesRepo.completionTrend(months);
  }

  async listLessons(courseId?: string): Promise<Result<object[]>> {
    return this.miscRepo.findAllLessons(courseId);
  }

  async getLessonById(id: string): Promise<Result<Record<string, unknown>>> {
    return this.miscRepo.findLessonById(id);
  }

  async createLesson(dto: CreateLessonDto): Promise<Result<Record<string, unknown>>> {
    return this.miscRepo.saveLessonRecord(castTo<Record<string, unknown>>(dto));
  }

  async updateLesson(id: string, dto: UpdateLessonDto): Promise<Result<Record<string, unknown>>> {
    return this.miscRepo.updateLessonRecord(id, castTo<Record<string, unknown>>(dto));
  }

  async deleteLesson(id: string): Promise<Result<void>> {
    return this.miscRepo.deleteLessonRecord(id);
  }

  async createModule(dto: CreateModuleDto): Promise<Result<Record<string, unknown>>> {
    return this.miscRepo.saveModule(castTo<Record<string, unknown>>(dto));
  }

  async getModule(id: string): Promise<Result<Record<string, unknown>>> {
    return this.miscRepo.findModuleById(id);
  }
}
