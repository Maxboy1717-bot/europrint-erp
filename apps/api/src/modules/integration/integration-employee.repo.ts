import { Injectable, Logger } from '@nestjs/common';
import { db , runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { safeCall, Result } from '@common/result';

import { MAX_QUERY_LIMIT } from '@common/constants/app.constants';
type Row = Record<string, unknown>;
const exec = async (q: Parameters<typeof db.execute>[0]): Promise<Row[]> => {
  return (await runQuery<Row>(q)).rows as Row[];
};

@Injectable()
export class IntegrationEmployeeRepository {
  private readonly logger = new Logger(IntegrationEmployeeRepository.name);

  findEmployeeComplaints(employeeId: string): Promise<Result<Row[]>> {
    return safeCall(async () => exec(sql`SELECT id, title, description, status, priority, created_at, resolved_at FROM sd_customer_complaints WHERE employee_id = ${employeeId} ORDER BY created_at DESC LIMIT 50`));
  }

  findEmployeeAssessmentSkips(employeeId: string): Promise<Result<Row[]>> {
    return safeCall(async () => exec(sql`SELECT id, assessment_id, reason, skipped_at, created_at FROM assessment_skips WHERE employee_id = ${employeeId} ORDER BY skipped_at DESC LIMIT 50`));
  }

  findSwapRequests(requestedBy?: string, status?: string): Promise<Result<Row[]>> {
    return safeCall(async () =>
      requestedBy && status
        ? exec(sql`SELECT id, requested_by, target_employee_id, original_shift_id, target_shift_id, status, reason, created_at FROM shift_swap_requests WHERE requested_by = ${requestedBy} AND status = ${status} ORDER BY created_at DESC LIMIT 100`)
        : requestedBy
        ? exec(sql`SELECT id, requested_by, target_employee_id, original_shift_id, target_shift_id, status, reason, created_at FROM shift_swap_requests WHERE requested_by = ${requestedBy} ORDER BY created_at DESC LIMIT 100`)
        : status
        ? exec(sql`SELECT id, requested_by, target_employee_id, original_shift_id, target_shift_id, status, reason, created_at FROM shift_swap_requests WHERE status = ${status} ORDER BY created_at DESC LIMIT 100`)
        : exec(sql`SELECT id, requested_by, target_employee_id, original_shift_id, target_shift_id, status, reason, created_at FROM shift_swap_requests ORDER BY created_at DESC LIMIT 100`)
    );
  }

  findSkillGap(employeeId: string): Promise<Result<Row[]>> {
    return safeCall(async () => exec(sql`SELECT sg.id, sg.skill_name, sg.required_level, sg.current_level, sg.gap_score, sg.recommended_course, sg.created_at FROM skill_gap_analysis sg WHERE sg.employee_id = ${employeeId} ORDER BY sg.gap_score DESC LIMIT 50`));
  }

  findMentorshipsAsMentor(employeeId: string): Promise<Result<Row[]>> {
    return safeCall(async () => exec(sql`SELECT m.id, m.mentee_id, m.status, m.start_date, m.end_date, u.full_name AS mentee_name FROM mentorships m LEFT JOIN users u ON u.id = m.mentee_id WHERE m.mentor_id = ${employeeId} ORDER BY m.created_at DESC LIMIT 50`));
  }

  findMentorshipsAsMentee(employeeId: string): Promise<Result<Row[]>> {
    return safeCall(async () => exec(sql`SELECT m.id, m.mentor_id, m.status, m.start_date, m.end_date, u.full_name AS mentor_name FROM mentorships m LEFT JOIN users u ON u.id = m.mentor_id WHERE m.mentee_id = ${employeeId} ORDER BY m.created_at DESC LIMIT 50`));
  }

  findMesProduction(employeeId: string, months: number): Promise<Result<Row[]>> {
    return safeCall(async () => exec(sql`SELECT pf.id, pf.date, pf.quantity, pf.plan_quantity, pf.machine_id, pf.shift, pf.quality_grade FROM production_facts pf WHERE pf.operator_id = ${employeeId} AND pf.date >= NOW() - (${months} || ' months')::interval ORDER BY pf.date DESC LIMIT ${MAX_QUERY_LIMIT}`));
  }

  findWmsTransactions(employeeId: string): Promise<Result<Row[]>> {
    return safeCall(async () => exec(sql`SELECT id, operation_type, quantity, item_code, warehouse_id, created_at FROM wms_transactions WHERE performed_by = ${employeeId} ORDER BY created_at DESC LIMIT 100`));
  }
}
