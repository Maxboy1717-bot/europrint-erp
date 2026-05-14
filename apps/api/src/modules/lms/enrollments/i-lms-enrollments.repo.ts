/**
 * @module i-lms-enrollments.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Result } from '@common/result';
type Row = Record<string, unknown>;
export interface ILmsEnrollmentsRepository {
  findCourseById(courseId: number): Promise<Result<any | null>>;
  findExistingEnrollment(userId: number, courseId: number): Promise<Result<any | null>>;
  enroll(dto: { userId: number; courseId: number; dueAt?: Date | null }): Promise<Result<Record<string, unknown>>>;
  findAll(limit: number, offset: number): Promise<Result<{ data: Row[]; count: number }>>;
  findById(id: number): Promise<Result<any | null>>;
  update(id: number, dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>>;
  remove(id: number): Promise<Result<void>>;
}
export const LMS_ENROLLMENTS_REPO = 'ILmsEnrollmentsRepository';
