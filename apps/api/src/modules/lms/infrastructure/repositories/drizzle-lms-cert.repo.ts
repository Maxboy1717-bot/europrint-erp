/**
 * @module drizzle-lms-cert.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { createHash } from 'crypto';
import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger } from '@nestjs/common';
import { db , runQuery } from '@shared/db';
import { SQL, SQLWrapper, sql } from 'drizzle-orm';
import { Result, Err , Ok } from '@common/types/result.type';
import { execLmsCertificateStatusUpdate } from '@common/database/queries-remaining';

type Row = Record<string, unknown>;
const exec = async (q: SQL | SQLWrapper): Promise<Row[]> => {
  return (await runQuery<Row>(q)).rows as Row[];
};

@Injectable()
export class LmsCertRepo {
  private readonly logger = new Logger(LmsCertRepo.name);

  async findExpiringCertificates(daysUntilExpiry: number): Promise<Result<object[]>> {
    try {
      const r = await exec(sql`SELECT e.id, e.employee_id, e.course_id, e.status, e.completed_at, cert.expiry_date AS certificate_expires_at, e.created_at FROM enrollments e JOIN certificates cert ON cert.employee_id = e.employee_id AND cert.course_id = e.course_id WHERE cert.is_active = true AND cert.expiry_date IS NOT NULL AND cert.expiry_date BETWEEN NOW() AND NOW() + INTERVAL '1 day' * ${daysUntilExpiry} ORDER BY cert.expiry_date ASC`);
      return Ok(r);
    } catch (error: unknown) {
      this.logger.error(`findExpiringCertificates: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  /**
   * Trigger 17 daily-sweep source: certificates that are GENUINELY EXPIRED
   * (expiry_date < NOW()), still active, and not yet flagged 'expired'. Each row
   * becomes a CertificateExpiredEvent so the MES skill-block + notification
   * listeners fire. Returns the fields the event needs (id/employee/course/name).
   */
  async findExpiredToFlag(): Promise<Result<object[]>> {
    try {
      const r = await exec(sql`SELECT cert.id AS certificate_id, cert.employee_id, cert.course_id, c.title_uz AS course_name, cert.expiry_date AS expires_at FROM certificates cert JOIN courses c ON c.id = cert.course_id WHERE cert.is_active = true AND cert.expiry_date IS NOT NULL AND cert.expiry_date < NOW() AND COALESCE(cert.status, '') <> 'expired' ORDER BY cert.expiry_date ASC`);
      return Ok(r);
    } catch (error: unknown) {
      this.logger.error(`findExpiredToFlag: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  async saveCertificate(certificate: Row, issuedBy?: number): Promise<Result<Row>> {
    try {
      // certificates: user_id + certificate_number are NOT NULL (no default); the old insert wrote only
      // the legacy employee_id and omitted both -> 23502. user_id := employee, certificate_number generated.
      const emp = certificate.employeeId ?? certificate.employee_id;
      const courseId = certificate.courseId ?? certificate.course_id;
      const expiresAt = certificate.expiresAt ?? certificate.expiry_date ?? null;
      const certNumber = 'CERT-' + Date.now();
      // LMS-12 #30 (legal-minimal cert fields, vision docs/audit/vision-1000-answers/12-lms.md
      // #30): issued_ip captures the requester IP at issuance time; cert_hash is a SHA-256
      // digest over the immutable cert payload — digital-signature substitute (F5 principle),
      // not a secret, so a plain digest (no HMAC key) is sufficient here.
      const issuedIp = certificate.issuedIp ? String(certificate.issuedIp) : null;
      const certHash = createHash('sha256')
        .update(`${emp}|${courseId}|${certNumber}|${expiresAt ?? ''}|${issuedBy ?? ''}`)
        .digest('hex');
      const r = await exec(sql`INSERT INTO certificates (employee_id, user_id, course_id, certificate_number, issued_date, expiry_date, score, is_active, created_at, issued_ip, cert_hash) VALUES (${emp}, ${emp}, ${courseId}, ${certNumber}, NOW(), ${expiresAt}, ${certificate.score ?? null}, true, NOW(), ${issuedIp}, ${certHash}) ON CONFLICT DO NOTHING RETURNING *`);
      return Ok(r[0]);
    } catch (error: unknown) {
      this.logger.error(`saveCertificate: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  async findCertificatesByEmployee(employeeId: number): Promise<Result<object[]>> {
    try {
      const r = await exec(sql`SELECT cert.*, c.title_uz AS course_name, c.category FROM certificates cert JOIN courses c ON c.id = cert.course_id WHERE cert.employee_id = ${employeeId} ORDER BY cert.issued_date DESC`);
      return Ok(r);
    } catch (error: unknown) {
      this.logger.error(`findCertificatesByEmployee: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  async checkOperatorCertForMes(employeeId: number, courseId: number): Promise<{ valid: boolean; reason?: string; expiresAt?: Date }> {
    try {
      const rows = await exec(sql`SELECT expiry_date, is_active FROM certificates WHERE employee_id = ${employeeId} AND course_id = ${courseId} ORDER BY issued_date DESC LIMIT 1`);
      const row = rows[0];
      if (!row) return { valid: false, reason: "Sertifikat topilmadi — MES seansiga ruxsat yo'q" };
      if (!row.is_active) return { valid: false, reason: 'Sertifikat bekor qilingan' };
      if (row.expiry_date && new Date(String(row.expiry_date)) < _time.now()) return { valid: false, reason: 'Sertifikat muddati tugagan', expiresAt: new Date(String(row.expiry_date)) };
      return { valid: true, expiresAt: row.expiry_date ? new Date(String(row.expiry_date)) : undefined };
    } catch (error: unknown) {
      this.logger.error(`checkOperatorCertForMes: ${(error as Error).message}`);
      return { valid: false, reason: (error as Error).message };
    }
  }

  async findByOperatorAndCourse(operatorId: number, courseId: number) {
    try {
      const r = await exec(sql`SELECT cert.*, c.title_uz AS "courseName", cert.expiry_date AS "expiresAt" FROM certificates cert JOIN courses c ON c.id = cert.course_id WHERE cert.employee_id = ${operatorId} AND cert.course_id = ${courseId} ORDER BY cert.issued_date DESC LIMIT 1`);
      const row = r[0];
      if (!row) return null;
      return { id: row.id, status: row.is_active ? 'active' : 'revoked', expiresAt: row.expiresAt ? new Date(String(row.expiresAt)) : undefined, courseName: row.courseName };
    } catch (error: unknown) {
      this.logger.error(`findByOperatorAndCourse: ${(error as Error).message}`);
      return null;
    }
  }

  async findByOperatorId(operatorId: number) {
    try {
      const r = await exec(sql`SELECT cert.id, cert.course_id AS "courseId", c.title_uz AS "courseName", cert.issued_date AS "issuedAt", cert.expiry_date AS "expiresAt", CASE WHEN cert.is_active AND (cert.expiry_date IS NULL OR cert.expiry_date > NOW()) THEN 'active' ELSE 'expired' END AS status FROM certificates cert JOIN courses c ON c.id = cert.course_id WHERE cert.employee_id = ${operatorId} ORDER BY cert.issued_date DESC`);
      return (Array.isArray(r) ? r : []).map((row) => ({
        id: row.id, courseId: row.courseId, courseName: row.courseName,
        issuedAt: row.issuedAt ? new Date(String(row.issuedAt)) : _time.now(),
        expiresAt: row.expiresAt ? new Date(String(row.expiresAt)) : undefined,
        status: row.status,
      }));
    } catch (error: unknown) {
      this.logger.error(`findByOperatorId: ${(error as Error).message}`);
      throw error;
    }
  }

  async findEnrollment(employeeId: number, courseId: number) {
    try {
      const rows = await exec(sql`SELECT id FROM enrollments WHERE employee_id = ${employeeId} AND course_id = ${courseId} LIMIT 1`);
      return rows[0] ?? null;
    } catch (error: unknown) {
      this.logger.error(`findEnrollment (legacy): ${(error as Error).message}`);
      return null;
    }
  }

  async saveEnrollmentLegacy(enrollment: { employeeId: number; courseId: number; courseName: string; enrolledAt: Date; status: string; enrolledBy: number }): Promise<number> {
    try {
      const r = await exec(sql`INSERT INTO enrollments (employee_id, course_id, status, enrolled_at, created_at, updated_at) VALUES (${enrollment.employeeId}, ${enrollment.courseId}, ${enrollment.status}, ${enrollment.enrolledAt}, NOW(), NOW()) ON CONFLICT (employee_id, course_id) DO UPDATE SET status = EXCLUDED.status, updated_at = NOW() RETURNING id`);
      return Number(r[0]?.id ?? 0);
    } catch (error: unknown) {
      this.logger.error(`saveEnrollmentLegacy: ${(error as Error).message}`);
      throw error;
    }
  }

  async saveCertificateLegacy(certificate: Row, issuedBy: number): Promise<number> {
    try {
      // user_id + certificate_number NOT NULL (no default) — supply both (was omitted -> 23502).
      const emp = certificate.employeeId ?? certificate['employeeId'];
      const r = await exec(sql`INSERT INTO certificates (employee_id, user_id, course_id, certificate_number, issued_date, expiry_date, is_active, created_at) VALUES (${emp}, ${emp}, ${certificate.courseId ?? certificate['courseId']}, ${'CERT-' + Date.now()}, NOW(), ${certificate.expiresAt ?? null}, true, NOW()) ON CONFLICT DO NOTHING RETURNING id`);
      return Number(r[0]?.id ?? 0);
    } catch (error: unknown) {
      this.logger.error(`saveCertificateLegacy: ${(error as Error).message}`);
      throw error;
    }
  }

  async updateCertificateStatus(certificateId: number, status: string): Promise<void> {
    try {
      await execLmsCertificateStatusUpdate(certificateId, status);
    } catch (error: unknown) {
      this.logger.error(`updateCertificateStatus: ${(error as Error).message}`);
    }
  }
}
