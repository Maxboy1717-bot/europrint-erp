/**
 * @module i-lms.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Result } from '@common/types/result.type';

export interface Course {
  id: string;
  title: string;
  description?: string;
  category?: string;
  is_mandatory: boolean;
  passing_score: number;
  created_by: string;
  created_at: Date;
  // Card-centric LMS (EP-LMS-001): logical ref to the org-CARD (org_functions.id) the darslik binds to.
  card_id?: number | null;
}

export interface Enrollment {
  id: string;
  course_id: string;
  user_id: string;
  status: string;
  score?: number;
  completed_at?: Date;
  certificate_expires_at?: Date;
  created_at: Date;
  course_title?: string;
}

export interface ILmsRepo {
  findCourseById(id: string): Promise<Result<Course>>;
  findAllCourses(filters?: {
    isMandatory?: boolean;
    category?: string;
    page?: number;
    limit?: number;
  }): Promise<Result<{ items: Course[]; total: number }>>;
  findEnrollmentByUserAndCourse(userId: string, courseId: string): Promise<Result<Enrollment>>;
  findEnrollmentsByUser(userId: string, filters?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<Result<{ items: Enrollment[]; total: number }>>;
  findExpiringCertificates(daysUntilExpiry: number): Promise<Result<Enrollment[]>>;
  findCoursesByCard(cardId: number): Promise<Result<{ items: Course[]; total: number }>>;
  saveCourse(course: Course): Promise<Result<Course>>;
  setCourseCard(id: string, cardId: number | null): Promise<Result<Course>>;
  saveEnrollment(enrollment: Enrollment): Promise<Result<Enrollment>>;
  updateEnrollment(id: string, data: Partial<Enrollment>): Promise<Result<Enrollment>>;
}

export const LMS_REPO = Symbol('LMS_REPO');
