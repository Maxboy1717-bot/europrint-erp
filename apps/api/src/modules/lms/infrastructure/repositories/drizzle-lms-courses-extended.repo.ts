/**
 * @module drizzle-lms-courses-extended.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { createHash } from 'crypto';
import { Injectable, Logger } from '@nestjs/common';
import { db , runQuery } from '@shared/db';
import { SQL, SQLWrapper, sql, eq, count } from 'drizzle-orm';
import { courses_table, certificates_table } from '@shared/db';
import { Result, Ok, Err } from '@common/result';
import { execLmsCourseDeactivate } from '@common/database/queries-remaining';

type Row = Record<string, unknown>;
const exec = async (q: SQL | SQLWrapper): Promise<Row[]> => {
  return (await runQuery<Row>(q)).rows as Row[];
};

@Injectable()
export class LmsCoursesExtendedRepository {
  private readonly logger = new Logger(LmsCoursesExtendedRepository.name);

  async findAll(filters?: { category?: string; isMandatory?: boolean; page?: number; limit?: number }): Promise<Result<{ items: unknown[]; total: number }>> {
    try {
      const page = filters?.page ?? 1;
      const limit = filters?.limit ?? 20;
      const offset = (page - 1) * limit;
      const [items, countRows] = await Promise.all([
        filters?.isMandatory !== undefined && filters?.category
          ? exec(sql`SELECT c.*, COUNT(e.id)::int AS enrolled_count, COALESCE(ROUND(AVG(CASE WHEN e.status = 'completed' THEN 100 ELSE COALESCE(e.progress_percent, 0) END)), 0)::int AS completion_rate FROM courses c LEFT JOIN enrollments e ON e.course_id = c.id WHERE c.is_active = true AND c.is_mandatory = ${filters.isMandatory} AND c.category = ${filters.category} GROUP BY c.id ORDER BY c.created_at DESC LIMIT ${limit} OFFSET ${offset}`)
          : filters?.isMandatory !== undefined
          ? exec(sql`SELECT c.*, COUNT(e.id)::int AS enrolled_count, COALESCE(ROUND(AVG(CASE WHEN e.status = 'completed' THEN 100 ELSE COALESCE(e.progress_percent, 0) END)), 0)::int AS completion_rate FROM courses c LEFT JOIN enrollments e ON e.course_id = c.id WHERE c.is_active = true AND c.is_mandatory = ${filters.isMandatory} GROUP BY c.id ORDER BY c.created_at DESC LIMIT ${limit} OFFSET ${offset}`)
          : filters?.category
          ? exec(sql`SELECT c.*, COUNT(e.id)::int AS enrolled_count, COALESCE(ROUND(AVG(CASE WHEN e.status = 'completed' THEN 100 ELSE COALESCE(e.progress_percent, 0) END)), 0)::int AS completion_rate FROM courses c LEFT JOIN enrollments e ON e.course_id = c.id WHERE c.is_active = true AND c.category = ${filters.category} GROUP BY c.id ORDER BY c.created_at DESC LIMIT ${limit} OFFSET ${offset}`)
          : exec(sql`SELECT c.*, COUNT(e.id)::int AS enrolled_count, COALESCE(ROUND(AVG(CASE WHEN e.status = 'completed' THEN 100 ELSE COALESCE(e.progress_percent, 0) END)), 0)::int AS completion_rate FROM courses c LEFT JOIN enrollments e ON e.course_id = c.id WHERE c.is_active = true GROUP BY c.id ORDER BY c.created_at DESC LIMIT ${limit} OFFSET ${offset}`),
        db.select({ cnt: count() }).from(courses_table).where(eq(courses_table.is_active, true)),
      ]);
      return Ok({ items, total: Number(countRows[0]?.cnt ?? 0) });
    } catch (error) { this.logger.error(`findAll: ${(error as Error).message}`); return Err((error as Error).message); }
  }

  async findById(id: string): Promise<Result<Row>> {
    try {
      const r = await exec(sql`SELECT c.*, COUNT(DISTINCT e.id) AS enrolled_count FROM courses c LEFT JOIN enrollments e ON e.course_id = c.id WHERE c.id = ${parseInt(id, 10)} GROUP BY c.id LIMIT 1`);
      if (!r.length) return Err('Kurs topilmadi');
      return Ok(r[0] as Row);
    } catch (error) { this.logger.error(`findById: ${(error as Error).message}`); return Err((error as Error).message); }
  }

  async create(data: Row, userId: string): Promise<Result<Row>> {
    try {
      // courses: code + title are NOT NULL (no default); the old insert wrote only title_uz -> 23502.
      // title := title_uz value, code generated.
      const t = String(data.title);
      // SB0120 (EP-LMS-001): cardId -> courses.card_id (karta-markazli darslik biriktiruvi).
      const cardId = data.cardId != null ? parseInt(String(data.cardId), 10) : null;
      // SB0112/SB0148: courseType -> courses.course_type (CHECK-constraint enum, nullable).
      const courseType = data.courseType != null ? String(data.courseType) : null;
      const r = await exec(sql`INSERT INTO courses (title_uz, title, code, description, category, is_mandatory, passing_score, is_active, author_id, card_id, course_type, created_at) VALUES (${t}, ${t}, ${'CRS-' + Date.now()}, ${data.description ? String(data.description) : null}, ${data.category ? String(data.category) : null}, ${Boolean(data.isMandatory)}, ${data.passingScore ? parseInt(String(data.passingScore), 10) : 70}, true, ${parseInt(userId, 10)}, ${cardId}, ${courseType}, NOW()) RETURNING *`);
      return Ok((r[0] ?? data) as Row);
    } catch (error) { this.logger.error(`create: ${(error as Error).message}`); return Err((error as Error).message); }
  }

  async update(id: string, data: Row): Promise<Result<Row>> {
    try {
      // SB0120: cardId undefined -> leave unchanged (COALESCE); cardId explicitly null -> unbind (handled via has-own-prop check).
      const hasCardId = Object.prototype.hasOwnProperty.call(data, 'cardId');
      const cardIdValue = data.cardId != null ? parseInt(String(data.cardId), 10) : null;
      // SB0112/SB0148: same has-own-prop pattern for courseType (explicit null clears the classification).
      const hasCourseType = Object.prototype.hasOwnProperty.call(data, 'courseType');
      const courseTypeValue = data.courseType != null ? String(data.courseType) : null;
      const r = await exec(sql`UPDATE courses SET title_uz = COALESCE(${data.title ? String(data.title) : null}, title_uz), description = COALESCE(${data.description ? String(data.description) : null}, description), category = COALESCE(${data.category ? String(data.category) : null}, category), is_mandatory = COALESCE(${data.isMandatory !== undefined ? Boolean(data.isMandatory) : null}, is_mandatory), passing_score = COALESCE(${data.passingScore ? parseInt(String(data.passingScore), 10) : null}, passing_score), card_id = CASE WHEN ${hasCardId} THEN ${cardIdValue}::integer ELSE card_id END, course_type = CASE WHEN ${hasCourseType} THEN ${courseTypeValue} ELSE course_type END, updated_at = NOW() WHERE id = ${parseInt(id, 10)} RETURNING *`);
      if (!r.length) return Err('Kurs topilmadi');
      return Ok(r[0] as Row);
    } catch (error) { this.logger.error(`update: ${(error as Error).message}`); return Err((error as Error).message); }
  }

  async remove(id: string): Promise<Result<void>> {
    try {
      await execLmsCourseDeactivate(parseInt(id, 10));
      return Ok();
    } catch (error) { this.logger.error(`remove: ${(error as Error).message}`); return Err((error as Error).message); }
  }

  async completionTrend(months = 6): Promise<Result<object[]>> {
    const safeMonths = Math.max(1, Math.min(36, Math.floor(Number(months) || 6)));
    try {
      const rows = await exec(sql`SELECT DATE_TRUNC('month', completed_at) AS month, COUNT(*) AS completed_count FROM enrollments WHERE status = 'completed' AND completed_at >= NOW() - (${safeMonths} * INTERVAL '1 month') GROUP BY month ORDER BY month ASC`);
      return Ok(rows);
    } catch (error) { this.logger.error(`completionTrend: ${(error as Error).message}`); return Err((error as Error).message); }
  }

  async findExpiringCertificates(days = 30): Promise<Result<object[]>> {
    const safeDays = Math.max(1, Math.min(365, Math.floor(Number(days) || 30)));
    try {
      const r = await exec(sql`SELECT cert.*, COALESCE(emp.first_name,'') || ' ' || COALESCE(emp.last_name,'') AS employee_name, c.title_uz AS course_title FROM certificates cert JOIN employees emp ON emp.id = cert.employee_id JOIN courses c ON c.id = cert.course_id WHERE cert.expiry_date BETWEEN NOW() AND NOW() + (${safeDays} * INTERVAL '1 day') AND cert.is_active = true ORDER BY cert.expiry_date ASC`);
      return Ok(r);
    } catch (error) { this.logger.error(`findExpiringCertificates: ${(error as Error).message}`); return Err((error as Error).message); }
  }

  async findAllCertificates(filters?: { employeeId?: string; page?: number; limit?: number }): Promise<Result<{ items: unknown[]; total: number }>> {
    try {
      const page = filters?.page ?? 1;
      const limit = filters?.limit ?? 20;
      const offset = (page - 1) * limit;
      const [items, countRows] = await Promise.all([
        filters?.employeeId
          ? exec(sql`SELECT cert.*, COALESCE(emp.first_name,'') || ' ' || COALESCE(emp.last_name,'') AS employee_name, c.title_uz AS course_title FROM certificates cert JOIN employees emp ON emp.id = cert.employee_id JOIN courses c ON c.id = cert.course_id WHERE cert.employee_id = ${parseInt(filters.employeeId, 10)} ORDER BY cert.issued_at DESC LIMIT ${limit} OFFSET ${offset}`)
          : exec(sql`SELECT cert.*, COALESCE(emp.first_name,'') || ' ' || COALESCE(emp.last_name,'') AS employee_name, c.title_uz AS course_title FROM certificates cert JOIN employees emp ON emp.id = cert.employee_id JOIN courses c ON c.id = cert.course_id ORDER BY cert.issued_at DESC LIMIT ${limit} OFFSET ${offset}`),
        db.select({ cnt: count() }).from(certificates_table),
      ]);
      return Ok({ items, total: Number(countRows[0]?.cnt ?? 0) });
    } catch (error) { this.logger.error(`findAllCertificates: ${(error as Error).message}`); return Err((error as Error).message); }
  }

  async saveCertificate(data: Row, userId: string): Promise<Result<Row>> {
    try {
      // user_id + certificate_number NOT NULL (no default) — supply both (was omitted -> 23502).
      const emp = parseInt(String(data.employeeId), 10);
      const courseId = parseInt(String(data.courseId), 10);
      const expiryDate = data.expiryDate ? String(data.expiryDate) : null;
      const certNumber = 'CERT-' + Date.now();
      // LMS-12 #30 (legal-minimal cert fields, vision docs/audit/vision-1000-answers/12-lms.md
      // #30): issued_ip captures the requester IP at issuance time; cert_hash is a SHA-256
      // digest over the immutable cert payload — digital-signature substitute (F5 principle).
      const issuedIp = data.issuedIp ? String(data.issuedIp) : null;
      const certHash = createHash('sha256')
        .update(`${emp}|${courseId}|${certNumber}|${expiryDate ?? ''}|${userId}`)
        .digest('hex');
      const r = await exec(sql`INSERT INTO certificates (employee_id, user_id, course_id, certificate_number, issued_at, expiry_date, issued_by, is_active, created_at, issued_ip, cert_hash) VALUES (${emp}, ${emp}, ${courseId}, ${certNumber}, NOW(), ${expiryDate}, ${parseInt(userId, 10)}, true, NOW(), ${issuedIp}, ${certHash}) RETURNING *`);
      return Ok((r[0] ?? data) as Row);
    } catch (error) { this.logger.error(`saveCertificate: ${(error as Error).message}`); return Err((error as Error).message); }
  }
}
