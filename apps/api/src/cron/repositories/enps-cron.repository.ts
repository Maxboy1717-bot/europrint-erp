import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { enps_surveys, hrEmployees } from '@shared/db';
import { eq, and, isNull, isNotNull } from 'drizzle-orm';

export interface EnpsSurveyRow {
  id: number;
}

export interface EmployeeForNotificationRow {
  id: number;
  first_name: string;
  telegram_chat_id: string;
}

@Injectable()
export class EnpsCronRepository {
  async findSurveyByTitle(title: string): Promise<EnpsSurveyRow | null> {
    const rows = await db.select({ id: enps_surveys.id }).from(enps_surveys).where(eq(enps_surveys.title, title)).limit(1);
    return rows[0] ? { id: rows[0].id } : null;
  }

  async insertSurvey(
    title: string,
    description: string,
    questions: object,
    startDate: string,
    endDate: string,
  ): Promise<number> {
    const rows = await db.insert(enps_surveys).values({
      title,
      description,
      questions,
      period: 'quarterly',
      status: 'active',
      start_date: startDate,
      end_date: endDate,
    }).returning({ id: enps_surveys.id });
    return rows[0]?.id ?? 0;
  }

  async findActiveEmployeesWithTelegram(): Promise<EmployeeForNotificationRow[]> {
    const rows = await db
      .select({
        id:               hrEmployees.id,
        first_name:       hrEmployees.first_name,
        telegram_chat_id: hrEmployees.telegram_chat_id,
      })
      .from(hrEmployees)
      .where(
        and(
          eq(hrEmployees.status, 'active'),
          isNull(hrEmployees.deleted_at),
          isNotNull(hrEmployees.telegram_chat_id),
        ),
      );
    return rows
      .filter(r => r.telegram_chat_id)
      .map(r => ({
        id: r.id ?? 0,
        first_name: String(r.first_name ?? ''),
        telegram_chat_id: String(r.telegram_chat_id),
      }));
  }
}
