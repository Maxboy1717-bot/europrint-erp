/**
 * @module razryad.repository
 * @description Data-access for razryad (competency grade) master-data (`razryad_levels`).
 *   Mirrors CardRepository. Soft-delete = is_active=false (table has NO deleted_at — no new DDL).
 *   UNIQUE(level) violations are mapped to a clean CONFLICT, never a raw 500. Returns Result<T>.
 */

import { Ok, Err, Result, AppErr, safeCall } from '@common/result';
import { Injectable } from '@nestjs/common';
import { runQuery } from '@shared/db';
import { SQL, SQLWrapper, sql } from 'drizzle-orm';

type Row = Record<string, unknown>;

export interface RazryadInput {
  level?: number;
  name?: string;
  minRequirement?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  examType?: string | null;
  certificate?: string | null;
  description?: string | null;
  /** EP-ORG-055: per-card-type configurable exam pass threshold (%). NULL = egasi belgilaydi (EGASI QIYMATI KERAK). */
  examPassThreshold?: number | null;
  /** EP-ORG-056: per-card-type configurable max retake count. NULL = egasi belgilaydi (EGASI QIYMATI KERAK). */
  maxRetakes?: number | null;
  /** Razryad oylik-koeffitsiyenti (base × coefficient = oylik). Egasi sozlaydi (1.00→...). */
  coefficient?: number | null;
}

/** Detect the razryad_levels UNIQUE(level) violation (constraint razryad_levels_level_key / SQLSTATE 23505). */
const isUniqueLevel = (e: unknown): boolean => {
  const msg = String((e as { message?: string })?.message ?? e);
  return (e as { code?: string })?.code === '23505'
    || msg.includes('razryad_levels_level_key')
    || msg.includes('duplicate key');
};

@Injectable()
export class RazryadRepository {
  private exec(q: SQL | SQLWrapper): Promise<Result<Row[]>> {
    return safeCall(async () => (await runQuery<Row>(q)).rows as Row[]);
  }

  async list(includeArchived: boolean): Promise<Result<Row[]>> {
    return this.exec(sql`
      SELECT * FROM razryad_levels
      WHERE (${includeArchived}::boolean IS TRUE OR is_active = true)
      ORDER BY level ASC
    `);
  }

  async findById(id: number): Promise<Result<Row | null>> {
    const r = await this.exec(sql`SELECT * FROM razryad_levels WHERE id = ${id}`);
    return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);
  }

  async create(dto: RazryadInput): Promise<Result<Row | null>> {
    try {
      const rows = await runQuery<Row>(sql`
        INSERT INTO razryad_levels
          (level, name, min_requirement, salary_min, salary_max, exam_type, certificate, description,
           exam_pass_threshold, max_retakes, coefficient, is_active, created_at, updated_at)
        VALUES
          (${dto.level}, ${dto.name ?? ''}, ${dto.minRequirement ?? null}, ${dto.salaryMin ?? null},
           ${dto.salaryMax ?? null}, ${dto.examType ?? null}, ${dto.certificate ?? null}, ${dto.description ?? null},
           ${dto.examPassThreshold ?? null}, ${dto.maxRetakes ?? null}, ${dto.coefficient ?? 1.0},
           true, NOW(), NOW())
        RETURNING *
      `);
      return Ok((rows.rows[0] ?? null) as Row | null);
    } catch (e) {
      return isUniqueLevel(e)
        ? Err(AppErr('CONFLICT', `${dto.level}-razryad allaqachon mavjud`))
        : Err(AppErr('INTERNAL', String((e as Error)?.message ?? e)));
    }
  }

  async update(id: number, dto: RazryadInput): Promise<Result<Row | null>> {
    try {
      const rows = await runQuery<Row>(sql`
        UPDATE razryad_levels SET
          level                = COALESCE(${dto.level ?? null}, level),
          name                 = COALESCE(${dto.name ?? null}, name),
          min_requirement      = COALESCE(${dto.minRequirement ?? null}, min_requirement),
          salary_min           = COALESCE(${dto.salaryMin ?? null}, salary_min),
          salary_max           = COALESCE(${dto.salaryMax ?? null}, salary_max),
          exam_type            = COALESCE(${dto.examType ?? null}, exam_type),
          certificate          = COALESCE(${dto.certificate ?? null}, certificate),
          description          = COALESCE(${dto.description ?? null}, description),
          exam_pass_threshold  = COALESCE(${dto.examPassThreshold ?? null}, exam_pass_threshold),
          max_retakes          = COALESCE(${dto.maxRetakes ?? null}, max_retakes),
          coefficient          = COALESCE(${dto.coefficient ?? null}, coefficient),
          updated_at           = NOW()
        WHERE id = ${id} AND is_active = true
        RETURNING *
      `);
      return Ok((rows.rows[0] ?? null) as Row | null);
    } catch (e) {
      return isUniqueLevel(e)
        ? Err(AppErr('CONFLICT', `${dto.level}-razryad allaqachon mavjud`))
        : Err(AppErr('INTERNAL', String((e as Error)?.message ?? e)));
    }
  }

  /** Soft-delete via is_active=false (EP-ORG-005 style; table uses is_active, not deleted_at). */
  async softDelete(id: number): Promise<Result<Row | null>> {
    const r = await this.exec(sql`
      UPDATE razryad_levels SET is_active = false, updated_at = NOW()
      WHERE id = ${id} AND is_active = true
      RETURNING id, level, is_active
    `);
    return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);
  }
}
