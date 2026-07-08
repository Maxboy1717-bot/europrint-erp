/**
 * @module question-bank.repository
 * @description Data-access for AI-imtihon savollar banki (`hr_question_bank`, EP-ORG-046).
 *   Karta-turi (org_function_id) + razryad (razryad_level_id, ixtiyoriy) bo'yicha savol havzasi —
 *   `AiExamService.assignExamToCard` shu jadvaldan SELECT qiladi (drizzle-ai-exam.repo.ts). Bu
 *   repo yagona YOZUV yo'li (jadval avval faqat o'qilardi, HR to'ldira olmasdi). Mirrors
 *   RazryadRepository/ErrorCatalogRepository: parametrized SQL, soft-delete = is_active=false
 *   (table has NO deleted_at — no new DDL). Returns Result<T>.
 */

import { Ok, Err, Result, AppErr, safeCall } from '@common/result';
import { Injectable } from '@nestjs/common';
import { runQuery } from '@shared/db';
import { SQL, SQLWrapper, sql } from 'drizzle-orm';

type Row = Record<string, unknown>;

export interface QuestionBankInput {
  /** NULL = karta-turidan mustaqil (umumiy savol); raqam = o'sha org_function (karta-turi)ga xos. */
  orgFunctionId?: number | null;
  category?: string;
  questionUz?: string;
  questionRu?: string | null;
  expectedKeywords?: string[];
  difficulty?: number;
  lang?: string;
  /** NULL = razryaddan mustaqil (barcha razryadga ko'rinadi). */
  razryadLevelId?: number | null;
}

/** Postgres FK-violation (SQLSTATE 23503) — org_function_id/razryad_level_id mavjud emas. */
const isForeignKeyViolation = (e: unknown): boolean => {
  const msg = String((e as { message?: string })?.message ?? e);
  return (e as { code?: string })?.code === '23503'
    || msg.includes('hr_question_bank_org_function_id_fkey')
    || msg.includes('hr_question_bank_razryad_level_id_fkey');
};

/** Postgres CHECK-violation (SQLSTATE 23514) — category/difficulty ruxsat etilgan qiymatdan tashqari. */
const isCheckViolation = (e: unknown): boolean => {
  const msg = String((e as { message?: string })?.message ?? e);
  return (e as { code?: string })?.code === '23514'
    || msg.includes('hr_question_bank_category_check')
    || msg.includes('hr_question_bank_difficulty_check');
};

function mapWriteError(e: unknown): Result<never> {
  if (isForeignKeyViolation(e)) {
    return Err(AppErr('VALIDATION', "org_function_id yoki razryad_level_id mavjud emas"));
  }
  if (isCheckViolation(e)) {
    return Err(AppErr('VALIDATION', "category yoki difficulty ruxsat etilgan qiymatdan tashqarida"));
  }
  return Err(AppErr('INTERNAL', String((e as Error)?.message ?? e)));
}

@Injectable()
export class QuestionBankRepository {
  private exec(q: SQL | SQLWrapper): Promise<Result<Row[]>> {
    return safeCall(async () => (await runQuery<Row>(q)).rows as Row[]);
  }

  /**
   * Ro'yxat. `orgFunctionId` berilsa faqat o'sha karta-turi savollari; aks holda hammasi.
   * `includeArchived` true bo'lsa is_active=false yozuvlar ham (boshqaruv ekrani).
   */
  async list(orgFunctionId: number | null, includeArchived: boolean): Promise<Result<Row[]>> {
    return this.exec(sql`
      SELECT * FROM hr_question_bank
      WHERE (${includeArchived}::boolean IS TRUE OR is_active = true)
        AND (${orgFunctionId}::int IS NULL OR org_function_id = ${orgFunctionId}::int)
      ORDER BY org_function_id NULLS FIRST, category ASC, difficulty ASC, id ASC
    `);
  }

  async findById(id: number): Promise<Result<Row | null>> {
    const r = await this.exec(sql`SELECT * FROM hr_question_bank WHERE id = ${id}`);
    return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);
  }

  async create(dto: QuestionBankInput): Promise<Result<Row | null>> {
    try {
      // Postgres array literal — `${arr}::text[]` mis-binds a JS array as a row-tuple in this
      // driver (see notification-routing.repository.ts NOTE); `ARRAY[${sql.join(...)}]::text[]`
      // is the codebase's established-correct pattern (drizzle-crm-analytics.repo.ts:72,80).
      const keywordsSql = sql.join((dto.expectedKeywords ?? []).map((k) => sql`${k}`), sql`, `);
      const rows = await runQuery<Row>(sql`
        INSERT INTO hr_question_bank
          (org_function_id, category, question_uz, question_ru, expected_keywords, difficulty, lang,
           razryad_level_id, is_active, created_at, updated_at)
        VALUES
          (${dto.orgFunctionId ?? null}, ${dto.category ?? 'technical'}, ${dto.questionUz ?? ''},
           ${dto.questionRu ?? null}, ARRAY[${keywordsSql}]::text[],
           ${dto.difficulty ?? 3}, ${dto.lang ?? 'uz'}, ${dto.razryadLevelId ?? null}, true, NOW(), NOW())
        RETURNING *
      `);
      return Ok((rows.rows[0] ?? null) as Row | null);
    } catch (e) {
      return mapWriteError(e);
    }
  }

  async update(id: number, dto: QuestionBankInput): Promise<Result<Row | null>> {
    try {
      // org_function_id/razryad_level_id: undefined = tegmaslik; null = ataylab tozalash.
      const orgFnSql   = dto.orgFunctionId  === undefined ? sql`org_function_id`  : sql`${dto.orgFunctionId}`;
      const razryadSql = dto.razryadLevelId === undefined ? sql`razryad_level_id` : sql`${dto.razryadLevelId}`;
      const keywordsSql = dto.expectedKeywords === undefined
        ? sql`expected_keywords`
        : sql`ARRAY[${sql.join(dto.expectedKeywords.map((k) => sql`${k}`), sql`, `)}]::text[]`;
      const rows = await runQuery<Row>(sql`
        UPDATE hr_question_bank SET
          org_function_id    = ${orgFnSql},
          category           = COALESCE(${dto.category ?? null}, category),
          question_uz        = COALESCE(${dto.questionUz ?? null}, question_uz),
          question_ru        = COALESCE(${dto.questionRu ?? null}, question_ru),
          expected_keywords  = ${keywordsSql},
          difficulty         = COALESCE(${dto.difficulty ?? null}, difficulty),
          lang               = COALESCE(${dto.lang ?? null}, lang),
          razryad_level_id   = ${razryadSql},
          updated_at         = NOW()
        WHERE id = ${id} AND is_active = true
        RETURNING *
      `);
      return Ok((rows.rows[0] ?? null) as Row | null);
    } catch (e) {
      return mapWriteError(e);
    }
  }

  /** Soft-delete via is_active=false (table has NO deleted_at, mirrors RazryadRepository). */
  async softDelete(id: number): Promise<Result<Row | null>> {
    const r = await this.exec(sql`
      UPDATE hr_question_bank SET is_active = false, updated_at = NOW()
      WHERE id = ${id} AND is_active = true
      RETURNING id, category, question_uz, is_active
    `);
    return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);
  }
}
