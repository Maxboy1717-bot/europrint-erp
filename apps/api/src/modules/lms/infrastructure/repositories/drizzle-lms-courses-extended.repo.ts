import { Injectable, Logger } from '@nestjs/common';
import { db , runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { Result, Ok, Err } from '@common/result';
import { execLmsCourseDeactivate } from '@common/database/queries-remaining';

type Row = Record<string, unknown>;
const exec = async (q: Parameters<typeof db.execute>[0]): Promise<Row[]> => {
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
          ? exec(sql`SELECT * FROM courses WHERE is_active = true AND is_mandatory = ${filters.isMandatory} AND category = ${filters.category} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`)
          : filters?.isMandatory !== undefined
          ? exec(sql`SELECT * FROM courses WHERE is_active = true AND is_mandatory = ${filters.isMandatory} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`)
          : filters?.category
          ? exec(sql`SELECT * FROM courses WHERE is_active = true AND category = ${filters.category} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`)
          : exec(sql`SELECT * FROM courses WHERE is_active = true ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`),
        runQuery<{ cnt: number }>(sql`SELECT COUNT(*) AS cnt FROM courses WHERE is_active = true`),
      ]);
      return Ok({ items, total: Number(countRows.rows[0]?.cnt ?? 0) });
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
      const r = await exec(sql`INSERT INTO courses (title_uz, description, category, is_mandatory, passing_score, is_active, author_id, created_at) VALUES (${String(data.title)}, ${data.description ? String(data.description) : null}, ${data.category ? String(data.category) : null}, ${Boolean(data.isMandatory)}, ${data.passingScore ? parseInt(String(data.passingScore), 10) : 70}, true, ${parseInt(userId, 10)}, NOW()) RETURNING *`);
      return Ok((r[0] ?? data) as Row);
    } catch (error) { this.logger.error(`create: ${(error as Error).message}`); return Err((error as Error).message); }
  }

  async update(id: string, data: Row): Promise<Result<Row>> {
    try {
      const r = await exec(sql`UPDATE courses SET title_uz = COALESCE(${data.title ? String(data.title) : null}, title_uz), description = COALESCE(${data.description ? String(data.description) : null}, description), category = COALESCE(${data.category ? String(data.category) : null}, category), is_mandatory = COALESCE(${data.isMandatory !== undefined ? Boolean(data.isMandatory) : null}, is_mandatory), passing_score = COALESCE(${data.passingScore ? parseInt(String(data.passingScore), 10) : null}, passing_score), updated_at = NOW() WHERE id = ${parseInt(id, 10)} RETURNING *`);
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
        runQuery<{ cnt: number }>(sql`SELECT COUNT(*) AS cnt FROM certificates`),
      ]);
      return Ok({ items, total: Number(countRows.rows[0]?.cnt ?? 0) });
    } catch (error) { this.logger.error(`findAllCertificates: ${(error as Error).message}`); return Err((error as Error).message); }
  }

  async saveCertificate(data: Row, userId: string): Promise<Result<Row>> {
    try {
      const r = await exec(sql`INSERT INTO certificates (employee_id, course_id, issued_at, expiry_date, issued_by, is_active, created_at) VALUES (${parseInt(String(data.employeeId), 10)}, ${parseInt(String(data.courseId), 10)}, NOW(), ${data.expiryDate ? String(data.expiryDate) : null}, ${parseInt(userId, 10)}, true, NOW()) RETURNING *`);
      return Ok((r[0] ?? data) as Row);
    } catch (error) { this.logger.error(`saveCertificate: ${(error as Error).message}`); return Err((error as Error).message); }
  }
}
