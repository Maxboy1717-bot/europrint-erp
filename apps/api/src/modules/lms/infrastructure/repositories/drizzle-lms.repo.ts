/**
 * @module drizzle-lms.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable, Logger } from '@nestjs/common';
import { db , runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { Result, Err, Ok } from '@common/types/result.type';
import { ILmsRepo, Course, Enrollment } from '../../domain/repositories/i-lms.repo';
import { LmsCertRepo } from './drizzle-lms-cert.repo';

type Row = Record<string, unknown>;
const exec = async (q: Parameters<typeof db.execute>[0]): Promise<Row[]> => {
  return (await runQuery<Row>(q)).rows as Row[];
};

function mapCourse(row: Row): Course {
  return {
    id: String(row.id),
    title: String(row.title_uz ?? row.title ?? ''),
    description: row.description != null ? String(row.description) : undefined,
    category: row.category != null ? String(row.category) : undefined,
    is_mandatory: Boolean(row.is_mandatory ?? false),
    passing_score: Number(row.passing_score ?? row.passingScore ?? 70),
    created_by: String(row.author_id ?? row.created_by ?? ''),
    created_at: row.created_at instanceof Date ? row.created_at : new Date(String(row.created_at)),
  };
}

function mapEnrollment(row: Row): Enrollment {
  return {
    id: String(row.id),
    course_id: String(row.course_id ?? row.courseId),
    user_id: String(row.employee_id ?? row.user_id),
    status: String(row.status ?? 'enrolled'),
    score: row.score !== null && row.score !== undefined ? Number(row.score) : undefined,
    completed_at: row.completed_at ? new Date(String(row.completed_at)) : undefined,
    certificate_expires_at: row.certificate_expires_at ? new Date(String(row.certificate_expires_at)) : undefined,
    created_at: row.created_at instanceof Date ? row.created_at : new Date(String(row.created_at)),
  };
}

@Injectable()
export class LmsRepository implements ILmsRepo {
  private readonly logger = new Logger(LmsRepository.name);

  constructor(private readonly certRepo: LmsCertRepo) {}

  async findCourseById(id: string): Promise<Result<Course>> {
    try {
      const r = await exec(sql`SELECT * FROM courses WHERE id = ${parseInt(id, 10)} LIMIT 1`);
      if (!r[0]) return Err('Course not found');
      return Ok(mapCourse(r[0]));
    } catch (error: unknown) {
      this.logger.error(`findCourseById: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  async findAllCourses(filters?: { isMandatory?: boolean; category?: string; page?: number; limit?: number }): Promise<Result<{ items: Course[]; total: number }>> {
    try {
      const page = filters?.page ?? 1;
      const limit = filters?.limit ?? 20;
      const offset = (page - 1) * limit;
      const [rows, countRows] = await Promise.all([
        filters?.isMandatory !== undefined && filters?.category
          ? exec(sql`SELECT * FROM courses WHERE is_active = true AND is_mandatory = ${filters.isMandatory} AND category = ${filters.category} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`)
          : filters?.isMandatory !== undefined
          ? exec(sql`SELECT * FROM courses WHERE is_active = true AND is_mandatory = ${filters.isMandatory} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`)
          : filters?.category
          ? exec(sql`SELECT * FROM courses WHERE is_active = true AND category = ${filters.category} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`)
          : exec(sql`SELECT * FROM courses WHERE is_active = true ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`),
        runQuery<{ cnt: number }>(sql`SELECT COUNT(*) AS cnt FROM courses WHERE is_active = true`),
      ]);
      return Ok({ items: (Array.isArray(rows) ? rows : []).map(mapCourse), total: Number(countRows.rows[0]?.cnt ?? 0) });
    } catch (error: unknown) {
      this.logger.error(`findAllCourses: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  async saveCourse(course: Course): Promise<Result<Course>> {
    try {
      const r = await exec(sql`INSERT INTO courses (title_uz, description, category, is_mandatory, passing_score, is_active, created_at) VALUES (${course.title}, ${course.description ?? null}, ${course.category ?? null}, ${course.is_mandatory}, ${course.passing_score}, true, NOW()) RETURNING *`);
      return Ok(mapCourse(r[0]));
    } catch (error: unknown) {
      this.logger.error(`saveCourse: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  async findEnrollmentByUserAndCourse(userId: string, courseId: string): Promise<Result<Enrollment>> {
    try {
      const r = await exec(sql`SELECT e.*, c.title_uz AS course_title FROM enrollments e JOIN courses c ON c.id = e.course_id WHERE e.employee_id = ${parseInt(userId, 10)} AND e.course_id = ${parseInt(courseId, 10)} LIMIT 1`);
      if (!r[0]) return Err('Enrollment not found');
      return Ok(mapEnrollment(r[0]));
    } catch (error: unknown) {
      this.logger.error(`findEnrollmentByUserAndCourse: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  async findEnrollmentsByUser(userId: string, filters?: { status?: string; page?: number; limit?: number }): Promise<Result<{ items: Enrollment[]; total: number }>> {
    try {
      const page = filters?.page ?? 1;
      const limit = filters?.limit ?? 20;
      const offset = (page - 1) * limit;
      const [rows, countRows] = await Promise.all([
        filters?.status
          ? exec(sql`SELECT e.*, c.title_uz AS course_title, c.category, cert.expiry_date AS certificate_expires_at, cert.is_active AS cert_active FROM enrollments e JOIN courses c ON c.id = e.course_id LEFT JOIN certificates cert ON cert.employee_id = e.employee_id AND cert.course_id = e.course_id WHERE e.employee_id = ${parseInt(userId, 10)} AND e.status = ${filters.status} ORDER BY e.created_at DESC LIMIT ${limit} OFFSET ${offset}`)
          : exec(sql`SELECT e.*, c.title_uz AS course_title, c.category, cert.expiry_date AS certificate_expires_at, cert.is_active AS cert_active FROM enrollments e JOIN courses c ON c.id = e.course_id LEFT JOIN certificates cert ON cert.employee_id = e.employee_id AND cert.course_id = e.course_id WHERE e.employee_id = ${parseInt(userId, 10)} ORDER BY e.created_at DESC LIMIT ${limit} OFFSET ${offset}`),
        runQuery<{ cnt: number }>(sql`SELECT COUNT(*) AS cnt FROM enrollments WHERE employee_id = ${parseInt(userId, 10)}`),
      ]);
      return { ok: true, data: { items: (Array.isArray(rows) ? rows : []).map((row) => ({ ...mapEnrollment(row), course_title: row.course_title as string | undefined, certificate_expires_at: row.certificate_expires_at ? new Date(String(row.certificate_expires_at)) : undefined })) as Enrollment[], total: Number(countRows.rows[0]?.cnt ?? 0) } };
    } catch (error: unknown) {
      this.logger.error(`findEnrollmentsByUser: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  async saveEnrollment(enrollment: Enrollment): Promise<Result<Enrollment>> {
    try {
      const r = await exec(sql`INSERT INTO enrollments (employee_id, course_id, status, enrolled_at, created_at, updated_at) VALUES (${parseInt(enrollment.user_id, 10)}, ${parseInt(enrollment.course_id, 10)}, ${enrollment.status ?? 'enrolled'}, NOW(), NOW(), NOW()) ON CONFLICT (employee_id, course_id) DO UPDATE SET status = EXCLUDED.status, updated_at = NOW() RETURNING *`);
      return Ok(mapEnrollment(r[0]));
    } catch (error: unknown) {
      this.logger.error(`saveEnrollment: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  async updateEnrollment(id: string, data: Partial<Enrollment>): Promise<Result<Enrollment>> {
    try {
      const r = await exec(sql`UPDATE enrollments SET status = COALESCE(${data.status ?? null}, status), progress_percent = COALESCE(${data.score !== undefined ? Math.min(100, data.score) : null}, progress_percent), completed_at = COALESCE(${data.completed_at ?? null}, completed_at), updated_at = NOW() WHERE id = ${parseInt(id, 10)} RETURNING *`);
      if (!r[0]) return Err('Enrollment not found');
      return Ok(mapEnrollment(r[0]));
    } catch (error: unknown) {
      this.logger.error(`updateEnrollment: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  async deleteCourse(id: string): Promise<Result<{ deleted: boolean }>> {
    try {
      const existing = await exec(sql`SELECT id FROM courses WHERE id = ${parseInt(id, 10)} AND (is_active IS NULL OR is_active = true) LIMIT 1`);
      if (!existing[0]) return Err('Course not found');
      await exec(sql`UPDATE courses SET is_active = false, updated_at = NOW() WHERE id = ${parseInt(id, 10)}`);
      return Ok({ deleted: true });
    } catch (error: unknown) {
      this.logger.error(`deleteCourse: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  findExpiringCertificates(d: number) { return this.certRepo.findExpiringCertificates(d) as Promise<Result<Enrollment[]>>; }
  saveCertificate(cert: Record<string, unknown>, issuedBy?: number) { return this.certRepo.saveCertificate(cert, issuedBy); }
  findCertificatesByEmployee(empId: number) { return this.certRepo.findCertificatesByEmployee(empId); }
  checkOperatorCertForMes(empId: number, courseId: number) { return this.certRepo.checkOperatorCertForMes(empId, courseId); }
  findByOperatorAndCourse(opId: number, courseId: number) { return this.certRepo.findByOperatorAndCourse(opId, courseId); }
  findByOperatorId(opId: number) { return this.certRepo.findByOperatorId(opId); }
  findEnrollment(empId: number, courseId: number) { return this.certRepo.findEnrollment(empId, courseId); }
  saveEnrollmentLegacy(e: Record<string, unknown>) { return this.certRepo.saveEnrollmentLegacy(e as Parameters<typeof this.certRepo.saveEnrollmentLegacy>[0]); }
  saveCertificateLegacy(cert: Record<string, unknown>, issuedBy: number) { return this.certRepo.saveCertificateLegacy(cert, issuedBy); }
  updateCertificateStatus(certId: number, status: string) { return this.certRepo.updateCertificateStatus(certId, status); }
}
