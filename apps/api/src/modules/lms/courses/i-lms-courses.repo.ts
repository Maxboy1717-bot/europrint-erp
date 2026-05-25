/**
 * @module i-lms-courses.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Result } from '@common/result';
type Row = Record<string, unknown>;
export interface ILmsCoursesRepository {
  findAll(limit: number, offset: number): Promise<Result<{ data: Row[]; count: number }>>;
  findById(id: number): Promise<Result<any | null>>;
  findModulesByCourseId(courseId: number): Promise<Result<object[]>>;
  findTestsByCourseId(courseId: number): Promise<Result<object[]>>;
  create(dto: Record<string, unknown>, createdBy?: number): Promise<Result<Record<string, unknown>>>;
  update(id: number, dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>>;
  softDelete(id: number): Promise<Result<void>>;
}
export const LMS_COURSES_REPO = 'ILmsCoursesRepository';
