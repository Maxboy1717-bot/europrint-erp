/**
 * @deprecated 2026-05-27
 * This file is a compatibility shim. Do NOT add new features here.
 * Canonical replacement: `apps/api/src/modules/hr/application/hr-employees-ext.service.ts (documents)`
 * Existing consumers continue to work. New code must import from the canonical file.
 * See: docs/modules/hr-employees.md
 */
/**
 * @module employee-files-compat.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { db,
  rawSql} from '@shared/db';
import { sql } from 'drizzle-orm';
import { dbRows } from '../hr/common/db-rows';
import { safeCall, Result, AppError } from '@common/result';

const si = (v: unknown, d = 0) => parseInt(String(v ?? ''), 10) || d;

@Injectable()
export class EmployeeFilesCompatService {
  constructor(private readonly i18n: I18nService) {}

  async listFiles(employeeId?: string, type?: string) {
    return safeCall(async () => {
      const empFilter = employeeId ? sql`AND ef.employee_id = ${si(employeeId)}` : sql``;
      const typeFilter = type ? sql`AND ef.file_type = ${type}` : sql``;
      const r = await rawSql(sql`
        SELECT ef.id, ef.employee_id, ef.file_name, ef.file_type, ef.file_url,
               ef.file_size, ef.uploaded_by, ef.created_at,
               e.first_name || ' ' || e.last_name AS employee_name
        FROM employee_files ef
        LEFT JOIN employees e ON e.id = ef.employee_id
        WHERE ef.deleted_at IS NULL ${empFilter} ${typeFilter}
        ORDER BY ef.created_at DESC LIMIT 100
      `);
      return dbRows(r);
    });
  }

  async createFile(body: Record<string, unknown>, userId: number | null) {
    return safeCall(async () => {
      const { employee_id, file_name, file_type, file_url, file_size } = body;
      if (!employee_id || !file_name) throw new BadRequestException(await this.i18n.t('validation.employeeIdAndFileNameRequired'));
      const r = await rawSql(sql`
        INSERT INTO employee_files (employee_id, file_name, file_type, file_url, file_size, uploaded_by)
        VALUES (${employee_id ?? null}, ${file_name ?? ''}, ${file_type ?? 'document'},
                ${file_url ?? null}, ${file_size ?? null}, ${userId})
        RETURNING id, file_name, file_type, created_at
      `);
      return dbRows(r)[0];
    });
  }

  async getFile(fileId: string) {
    return safeCall(async () => {
      const r = await rawSql(sql`
        SELECT ef.id, ef.employee_id, ef.file_name, ef.file_type, ef.file_url,
               ef.file_size, ef.uploaded_by, ef.created_at,
               e.first_name || ' ' || e.last_name AS employee_name
        FROM employee_files ef
        LEFT JOIN employees e ON e.id = ef.employee_id
        WHERE ef.id = ${si(fileId)} AND ef.deleted_at IS NULL
      `);
      const found = dbRows(r)[0];
      if (!found) throw new NotFoundException(await this.i18n.t('errors.fileNotFoundWithId', { args: { id: fileId } }));
      return found;
    });
  }

  async updateFile(fileId: string, body: Record<string, unknown>) {
    return safeCall(async () => {
      const check = await rawSql(sql`
        SELECT id FROM employee_files WHERE id = ${si(fileId)} AND deleted_at IS NULL
      `);
      if (!dbRows(check)[0]) throw new NotFoundException(await this.i18n.t('errors.fileNotFoundWithId', { args: { id: fileId } }));
      const { file_name, file_type, file_url, file_size } = body;
      const r = await rawSql(sql`
        UPDATE employee_files
        SET file_name  = COALESCE(${file_name  ?? null}, file_name),
            file_type  = COALESCE(${file_type  ?? null}, file_type),
            file_url   = COALESCE(${file_url   ?? null}, file_url),
            file_size  = COALESCE(${file_size  ?? null}, file_size),
            updated_at = NOW()
        WHERE id = ${si(fileId)}
        RETURNING id, file_name, file_type, file_url, file_size, updated_at
      `);
      return dbRows(r)[0];
    });
  }

  async deleteFile(fileId: string): Promise<Result<{ deleted: boolean }, AppError>> {
    return safeCall(async () => {
      const check = await rawSql(sql`
        SELECT id FROM employee_files WHERE id = ${si(fileId)} AND deleted_at IS NULL
      `);
      if (!dbRows(check)[0]) throw new NotFoundException(await this.i18n.t('errors.fileNotFoundWithId', { args: { id: fileId } }));
      await rawSql(sql`
        UPDATE employee_files SET deleted_at = NOW() WHERE id = ${si(fileId)}
      `);
      return { deleted: true };
    });
  }
}
