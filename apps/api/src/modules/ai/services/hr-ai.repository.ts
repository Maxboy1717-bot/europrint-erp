/**
 * @module hr-ai.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { hrToolTestResults, candidates, vacancies } from '@europrint/schemas';
import { eq } from 'drizzle-orm';
import { safeCall, Result } from '@common/result';

@Injectable()
export class HrAiRepository {
  async getToolTestById(toolTestId: number): Promise<Result<Record<string, unknown> | null>> {
    return safeCall(async () => {
      const [test] = (await db.select().from(hrToolTestResults)
        .where(eq(hrToolTestResults.id, toolTestId)).limit(1)) as Array<Record<string, unknown>>;
      return test ?? null;
      }, 'DB_ERROR');
  }

  async getCandidateById(candidateId: number): Promise<Result<Record<string, unknown> | null>> {
    return safeCall(async () => {
      const [row] = (await db.select().from(candidates)
        .where(eq(candidates.id, candidateId)).limit(1)) as Array<Record<string, unknown>>;
      return row ?? null;
      }, 'DB_ERROR');
  }

  async getVacancyById(vacancyId: number): Promise<Result<{ title: unknown; description: unknown } | null>> {
    return safeCall(async () => {
      const [row] = await db.select({ title: vacancies.title, description: vacancies.description })
        .from(vacancies).where(eq(vacancies.id, vacancyId)).limit(1);
      return row ?? null;
      }, 'DB_ERROR');
  }
}
