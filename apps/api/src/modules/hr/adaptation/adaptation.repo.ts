/**
 * @module adaptation.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 *
 * Merged into hr module (PA3-17 Wave 3): originally lived in `modules/adaptation/`.
 */

import { Injectable, Logger } from '@nestjs/common';
import { SQL, SQLWrapper, sql } from 'drizzle-orm';
import { db , runQuery } from '@shared/db';
import { safeCall } from '@common/result';

type Row = Record<string, unknown>;
const exec = async (q: SQL | SQLWrapper): Promise<Row[]> => {
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

  async findNewEmployees(limit = 50, offset = 0) {
    return safeCall(async () =>
      exec(sql`
        SELECT
          ar.id, ar.employee_id AS "userId", ar.program_id AS "programId",
          ar.mentor_id AS "mentorId", ar.start_date AS "startDate",
          ar.end_date AS "endDate", ar.status, ar.progress_percent AS progress,
          ar.current_milestone AS "currentPhase", ar.hr_notes AS notes,
          ar.is_extended, ar.tasks_completed AS "tasksCompleted",
          COALESCE(e.full_name, '') AS "employeeName",
          d.name AS "employeeDepartment",
          pos.name AS "employeePosition",
          ap.program_name AS "programTitle",
          COALESCE(m.full_name, '') AS "mentorName"
        FROM adaptation_records ar
        LEFT JOIN employees e   ON e.id = ar.employee_id
        LEFT JOIN employees m   ON m.id = ar.mentor_id
        LEFT JOIN departments d ON d.id = e.department_id
        LEFT JOIN positions pos ON pos.id = e.position_id
        LEFT JOIN adaptation_programs ap ON ap.id = ar.program_id
        ORDER BY ar.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `)
    );
  }

  async createNewEmployee(data: Row) {
    return safeCall(async () => {
      const rows = await exec(sql`
        INSERT INTO adaptation_records (employee_id, program_id, mentor_id, start_date, end_date, status, progress_percent, current_milestone, hr_notes)
        VALUES (
          ${data['userId'] ?? null}, ${data['programId'] ?? null}, ${data['mentorId'] ?? null},
          ${data['startDate'] ?? null}, ${data['endDate'] ?? null},
          ${data['status'] ?? 'in_progress'}, 0, 1, ${data['notes'] ?? null}
        )
        RETURNING id
      `);
      return rows[0] ?? {};
    });
  }

  async updateNewEmployee(id: string, data: Row) {
    return safeCall(async () => {
      const rows = await exec(sql`
        UPDATE adaptation_records SET
          status = COALESCE(${data['status'] ?? null}, status),
          progress_percent = COALESCE(${data['progress'] ?? null}, progress_percent),
          hr_notes = COALESCE(${data['notes'] ?? null}, hr_notes),
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING id
      `);
      return rows[0] ?? {};
    });
  }

  async findFeedback(limit = 50, offset = 0) {
    return safeCall(async () =>
      exec(sql`
        SELECT
          af.id, af.new_employee_id AS "newEmployeeId",
          af.feedback_type AS "feedbackType",
          af.scheduled_date AS "scheduledDate",
          af.completed_date AS "completedDate",
          af.rating, af.satisfaction_level AS "satisfactionLevel",
          af.strengths, af.weaknesses, af.suggestions,
          af.employee_feedback AS "employeeFeedback",
          af.mentor_feedback AS "mentorFeedback",
          af.status, af.action_items AS "actionItems",
          af.conducted_by AS "conductedBy",
          COALESCE(e.full_name, '') AS "employeeName"
        FROM adaptation_feedback af
        LEFT JOIN adaptation_records ar ON ar.id = af.new_employee_id
        LEFT JOIN employees e ON e.id = ar.employee_id
        ORDER BY af.scheduled_date DESC
        LIMIT ${limit} OFFSET ${offset}
      `)
    );
  }

  async createFeedback(data: Row) {
    return safeCall(async () => {
      const rows = await exec(sql`
        INSERT INTO adaptation_feedback (new_employee_id, feedback_type, scheduled_date, status)
        VALUES (${data['newEmployeeId'] ?? null}, ${data['feedbackType'] ?? 'week1'}, ${data['scheduledDate'] ?? null}, 'scheduled')
        RETURNING id
      `);
      return rows[0] ?? {};
    });
  }

  async updateFeedback(id: string, data: Row) {
    return safeCall(async () => {
      const rows = await exec(sql`
        UPDATE adaptation_feedback SET
          status = COALESCE(${data['status'] ?? null}, status),
          rating = COALESCE(${data['rating'] ?? null}, rating),
          satisfaction_level = COALESCE(${data['satisfactionLevel'] ?? null}, satisfaction_level),
          strengths = COALESCE(${data['strengths'] ?? null}, strengths),
          weaknesses = COALESCE(${data['weaknesses'] ?? null}, weaknesses),
          suggestions = COALESCE(${data['suggestions'] ?? null}, suggestions),
          employee_feedback = COALESCE(${data['employeeFeedback'] ?? null}, employee_feedback),
          mentor_feedback = COALESCE(${data['mentorFeedback'] ?? null}, mentor_feedback),
          completed_date = CASE WHEN ${data['status'] ?? null} = 'completed' THEN NOW() ELSE completed_date END
        WHERE id = ${id}
        RETURNING id
      `);
      return rows[0] ?? {};
    });
  }

  async findWelcomeEvents(limit = 50, offset = 0) {
    return safeCall(async () =>
      exec(sql`
        SELECT id, event_name AS "eventName", event_type AS "eventType",
          scheduled_date AS "scheduledDate", location, description,
          max_participants AS "maxParticipants", current_participants AS "currentParticipants",
          organizer_id AS "organizerId", participants, agenda, status,
          created_at AS "createdAt"
        FROM welcome_events
        ORDER BY scheduled_date DESC
        LIMIT ${limit} OFFSET ${offset}
      `)
    );
  }

  async createWelcomeEvent(data: Row) {
    return safeCall(async () => {
      const rows = await exec(sql`
        INSERT INTO welcome_events (event_name, event_type, scheduled_date, location, description, max_participants, status)
        VALUES (
          ${data['eventName'] ?? null}, ${data['eventType'] ?? null},
          ${data['scheduledDate'] ?? null}, ${data['location'] ?? null},
          ${data['description'] ?? null}, ${data['maxParticipants'] ?? null},
          'planned'
        )
        RETURNING id
      `);
      return rows[0] ?? {};
    });
  }

  async updateWelcomeEvent(id: string, data: Row) {
    return safeCall(async () => {
      const rows = await exec(sql`
        UPDATE welcome_events SET
          status = COALESCE(${data['status'] ?? null}, status),
          location = COALESCE(${data['location'] ?? null}, location),
          description = COALESCE(${data['description'] ?? null}, description)
        WHERE id = ${id}
        RETURNING id
      `);
      return rows[0] ?? {};
    });
  }
}
