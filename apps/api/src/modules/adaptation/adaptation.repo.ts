import { Injectable, Logger } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { db , runQuery } from '@shared/db';
import { safeCall } from '@common/result';

type Row = Record<string, unknown>;
const exec = async (q: Parameters<typeof db.execute>[0]): Promise<Row[]> => {
  return (await runQuery<Row>(q)).rows as Row[];
};

@Injectable()
export class AdaptationRepository {
  private readonly logger = new Logger(AdaptationRepository.name);

  async findPrograms(limit = 50, offset = 0) {
    return safeCall(async () =>
      exec(sql`SELECT id, program_name, position_id, department_id, duration_days, description, is_active, created_at FROM adaptation_programs ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`)
    );
  }

  async findRecords(status?: string, limit = 50, offset = 0) {
    return safeCall(async () =>
      status
        ? exec(sql`SELECT ar.id, ar.employee_id, ar.program_id, ar.status, ar.progress_percent, ar.start_date, ar.end_date, ar.current_milestone, ar.total_milestones, ap.program_name FROM adaptation_records ar LEFT JOIN adaptation_programs ap ON ap.id = ar.program_id WHERE ar.status = ${status} ORDER BY ar.created_at DESC LIMIT ${limit} OFFSET ${offset}`)
        : exec(sql`SELECT ar.id, ar.employee_id, ar.program_id, ar.status, ar.progress_percent, ar.start_date, ar.end_date, ar.current_milestone, ar.total_milestones, ap.program_name FROM adaptation_records ar LEFT JOIN adaptation_programs ap ON ap.id = ar.program_id ORDER BY ar.created_at DESC LIMIT ${limit} OFFSET ${offset}`)
    );
  }

  async getDashboardStats() {
    return safeCall(async () => {
      const rows = await exec(sql`SELECT (SELECT COUNT(*) FROM adaptation_records WHERE status = 'in_progress') AS in_progress, (SELECT COUNT(*) FROM adaptation_records WHERE status = 'completed') AS completed, (SELECT COUNT(*) FROM adaptation_records WHERE status = 'extended') AS extended, (SELECT COALESCE(AVG(progress_percent), 0) FROM adaptation_records WHERE status = 'in_progress') AS avg_progress, (SELECT COUNT(*) FROM adaptation_programs WHERE is_active = true) AS active_programs`);
      return (rows[0] ?? {}) as Row;
    });
  }

  async findCases(limit = 50, offset = 0) {
    return safeCall(async () =>
      exec(sql`SELECT * FROM hr_adaptation_cases ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`)
    );
  }

  async findRecordById(id: number) {
    return safeCall(async () => {
      const rows = await exec(
        sql`SELECT ar.id, ar.employee_id, ar.program_id, ar.status, ar.progress_percent, ar.start_date, ar.end_date, ar.current_milestone, ar.total_milestones, ap.program_name
            FROM adaptation_records ar
            LEFT JOIN adaptation_programs ap ON ap.id = ar.program_id
            WHERE ar.id = ${id} OR ar.employee_id = ${id}
            LIMIT 1`
      );
      return (rows[0] ?? null) as Row | null;
    });
  }
}
