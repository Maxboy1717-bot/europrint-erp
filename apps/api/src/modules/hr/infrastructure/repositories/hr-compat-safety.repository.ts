/**
 * @module hr-compat-safety.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 * @layer Infrastructure (HR)
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { castTo } from '@common/db-rows';
import { db } from '@shared/db';
import { sql, eq, desc, isNull } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { execHrBrandSettingsUpsert } from '@common/database/queries-remaining';
import { safeCall, Result, AppErr, Err } from '@common/result';
import { ADAPTATION_MILESTONE_STEPS } from '@common/constants/business.constants';
import {
  hr_brand_settings, hr_documents, document_templates,
  safety_incidents, safety_training_records, hazard_zones,
  ppe_compliance, leaveRequestsApp, adaptation_milestones,
  adaptation_records, adaptation_programs, hrEmployees, hrDepartments,
  gamification_totals,
} from '@shared/db';
import type { IHrCompatSafetyRepo } from '../../domain/repositories/i-hr-compat-safety.repo';

type Row = Record<string, unknown>;

// 3.14: self-joins on employees for mentor / professional-master lookups
const mentorEmployees = alias(hrEmployees, 'adaptation_mentor');
const masterEmployees = alias(hrEmployees, 'adaptation_master');

@Injectable()
export class HrCompatSafetyRepository implements IHrCompatSafetyRepo {
  async getBrandSettings(): Promise<Result<Row | null>> {
    return safeCall(async () => {
      // Single-tenant singleton: EuroPrint is one company, so hr_brand_settings
      // has at most one row. No company_id/tenant filter here — that column
      // was a vestigial multi-tenant leftover (confirmed dead: no companies/
      // tenants table exists, every writer/reader used the same hardcoded
      // 'default' literal). Oldest row wins if more than one ever exists.
      const rows = await db.select({ brand_data: hr_brand_settings.brand_data, updated_at: hr_brand_settings.updated_at })
        .from(hr_brand_settings)
        .orderBy(hr_brand_settings.id)
        .limit(1);
      return castTo<Row | null>((rows[0] ?? null));
      }, 'DB_ERROR');
  }

  async updateBrandSettings(jsonData: string): Promise<void> {
    await execHrBrandSettingsUpsert(jsonData);
  }

  async getDocuments(docType?: string, status?: string): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await db.select({
        id:               hr_documents.id,
        doc_number:       hr_documents.id,
        doc_type:         hr_documents.documentType,
        title:            hr_documents.title,
        status:           hr_documents.status,
        total_steps:      hr_documents.totalSteps,
        completed_steps:  hr_documents.currentStep,
        created_at:       hr_documents.createdAt,
      })
        .from(hr_documents)
        .where(sql`
          (${docType ?? null}::text IS NULL OR ${hr_documents.documentType} = ${docType ?? null}) AND
          (${status ?? null}::text IS NULL OR ${hr_documents.status} = ${status ?? null})
        `)
        .orderBy(sql`${hr_documents.createdAt} DESC`)
        .limit(100);
      return castTo<Row[]>(rows);
      }, 'DB_ERROR');
  }

  async getDocumentWorkflowRoutes(): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await db.select({
        id:          document_templates.id,
        name:        document_templates.name,
        description: document_templates.description,
        steps:       document_templates.steps,
        is_active:   document_templates.is_active,
        created_at:  document_templates.created_at,
      }).from(document_templates).limit(50);
      return castTo<Row[]>(rows);
      }, 'DB_ERROR');
  }

  async archiveDocument(id: number): Promise<void> {
    await db.update(hr_documents)
      .set({ status: 'archived', updatedAt: _time.now() })
      .where(sql`${hr_documents.id} = ${id} AND is_immutable = false`);
  }

  // P1.23.1: list safety incidents (FE calls GET /api/hr/safety/incidents)
  async getSafetyIncidents(statusFilter?: string): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await db.select({
        id:                   safety_incidents.id,
        incident_type:        safety_incidents.incident_type,
        severity:             safety_incidents.severity,
        description:          safety_incidents.description,
        location_description: safety_incidents.location_description,
        department_id:        safety_incidents.department_id,
        incident_date:        safety_incidents.incident_date,
        investigation_status: safety_incidents.investigation_status,
        status:               safety_incidents.status,
        created_at:           safety_incidents.created_at,
      }).from(safety_incidents)
        .where(statusFilter ? sql`${safety_incidents.status} = ${statusFilter}` : sql`1=1`)
        .orderBy(sql`${safety_incidents.created_at} DESC`)
        .limit(200);
      return castTo<Row[]>(rows);
    }, 'DB_ERROR');
  }

  // P1.23.1: delete safety incident (FE calls DELETE /api/hr/safety/incidents/:id)
  async deleteSafetyIncident(id: number): Promise<void> {
    await db.delete(safety_incidents).where(sql`${safety_incidents.id} = ${id}`);
  }

  async createSafetyIncident(incidentType: unknown, severity: unknown, description: unknown, locationDesc: unknown, departmentId: unknown, incidentDate: unknown): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.insert(safety_incidents).values({
        incident_type:        (incidentType ?? 'near_miss') as string,
        severity:             (severity ?? 'low') as string,
        description:          (description ?? null) as string,
        location_description: (locationDesc ?? null) as string,
        department_id:        (departmentId ?? null) as number,
        incident_date:        (incidentDate ?? null) as string,
        investigation_status: 'open',
        status:               'reported',
      }).returning();
      return castTo<Row>((rows[0] ?? {}));
      }, 'DB_ERROR');
  }

  async getSafetyTrainings(employeeId?: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await db.select({
        id:              safety_training_records.id,
        training_id:     safety_training_records.training_id,
        employee_id:     safety_training_records.employee_id,
        completed_date:  safety_training_records.completed_date,
        expiry_date:     safety_training_records.expiry_date,
        score:           safety_training_records.score,
        is_passed:       safety_training_records.is_passed,
        certificate_url: safety_training_records.certificate_url,
        created_at:      safety_training_records.created_at,
        employee_name:   sql<string>`${hrEmployees.first_name} || ' ' || ${hrEmployees.last_name}`,
      })
        .from(safety_training_records)
        .leftJoin(hrEmployees, eq(hrEmployees.id, safety_training_records.employee_id))
        .where(sql`${employeeId ?? null}::int IS NULL OR ${safety_training_records.employee_id} = ${employeeId ?? null}`)
        .orderBy(sql`${safety_training_records.created_at} DESC`)
        .limit(100);
      return castTo<Row[]>(rows);
      }, 'DB_ERROR');
  }

  async createSafetyTraining(trainingId: unknown, employeeId: unknown, completedDate: unknown, expiryDate: unknown, score: unknown, isPassed: unknown): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.insert(safety_training_records).values({
        training_id:    (trainingId ?? null) as number,
        employee_id:    (employeeId ?? null) as number,
        completed_date: (completedDate ?? null) as string,
        expiry_date:    (expiryDate ?? null) as string,
        score:          score != null ? String(score) : null,
        is_passed:      (isPassed ?? false) as boolean,
      }).returning();
      return castTo<Row>((rows[0] ?? {}));
      }, 'DB_ERROR');
  }

  async getHazardZones(departmentId?: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await db.select({
        id:                   hazard_zones.id,
        zone_name:            hazard_zones.zone_name,
        zone_code:            hazard_zones.zone_code,
        department_id:        hazard_zones.department_id,
        hazard_level:         hazard_zones.hazard_level,
        required_ppe:         hazard_zones.required_ppe,
        max_occupancy:        hazard_zones.max_occupancy,
        is_active:            hazard_zones.is_active,
        last_inspection_date: hazard_zones.last_inspection_date,
        next_inspection_date: hazard_zones.next_inspection_date,
        created_at:           hazard_zones.created_at,
        department_name:      hrDepartments.name,
      })
        .from(hazard_zones)
        .leftJoin(hrDepartments, eq(hrDepartments.id, hazard_zones.department_id))
        .where(sql`
          ${hazard_zones.is_active} = true AND
          (${departmentId ?? null}::int IS NULL OR ${hazard_zones.department_id} = ${departmentId ?? null})
        `)
        .orderBy(sql`${hazard_zones.hazard_level} DESC, ${hazard_zones.zone_name}`)
        .limit(100);
      return castTo<Row[]>(rows);
      }, 'DB_ERROR');
  }

  async createHazardZone(zoneName: unknown, zoneCode: unknown, departmentId: unknown, hazardLevel: unknown, requiredPpe: unknown, maxOccupancy: unknown): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.insert(hazard_zones).values({
        zone_name:    (zoneName ?? '') as string,
        zone_code:    (zoneCode ?? null) as string,
        department_id: (departmentId ?? null) as number,
        hazard_level: (hazardLevel ?? 'low') as string,
        required_ppe: (requiredPpe ?? null) as string,
        max_occupancy: (maxOccupancy ?? null) as number,
        is_active:    true,
      }).returning();
      return castTo<Row>((rows[0] ?? {}));
      }, 'DB_ERROR');
  }

  async getPpeCompliance(employeeId?: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await db.select({
        id:          ppe_compliance.id,
        employee_id: ppe_compliance.employee_id,
        ppe_type:    ppe_compliance.ppe_type,
        issue_date:  ppe_compliance.issue_date,
        expiry_date: ppe_compliance.expiry_date,
        is_compliant: ppe_compliance.is_compliant,
        employee_name: sql<string>`${hrEmployees.first_name} || ' ' || ${hrEmployees.last_name}`,
      })
        .from(ppe_compliance)
        .leftJoin(hrEmployees, eq(hrEmployees.id, ppe_compliance.employee_id))
        .where(sql`${employeeId ?? null}::int IS NULL OR ${ppe_compliance.employee_id} = ${employeeId ?? null}`)
        .orderBy(sql`${ppe_compliance.issue_date} DESC`)
        .limit(100);
      return castTo<Row[]>(rows);
      }, 'DB_ERROR');
  }

  async createPpeCompliance(employeeId: unknown, ppeType: unknown, issueDate: unknown, expiryDate: unknown, isCompliant: unknown): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.insert(ppe_compliance).values({
        employee_id: (employeeId ?? null) as number,
        ppe_type:    (ppeType ?? '') as string,
        issue_date:  (issueDate ?? null) as string,
        expiry_date: (expiryDate ?? null) as string,
        is_compliant: (isCompliant ?? true) as boolean,
      }).returning();
      return castTo<Row>((rows[0] ?? {}));
      }, 'DB_ERROR');
  }

  async getLeaveRequests(employeeId?: number, status?: string): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await db.select({
        id:           leaveRequestsApp.id,
        employee_id:  leaveRequestsApp.employeeId,
        leave_type:   leaveRequestsApp.leaveType,
        start_date:   leaveRequestsApp.startDate,
        end_date:     leaveRequestsApp.endDate,
        reason:       leaveRequestsApp.reason,
        status:       leaveRequestsApp.status,
        created_at:   leaveRequestsApp.createdAt,
        updated_at:   leaveRequestsApp.updatedAt,
        employee_name: sql<string>`${hrEmployees.first_name} || ' ' || ${hrEmployees.last_name}`,
      })
        .from(leaveRequestsApp)
        .leftJoin(hrEmployees, eq(hrEmployees.id, leaveRequestsApp.employeeId))
        .where(sql`
          (${employeeId ?? null}::int IS NULL OR ${leaveRequestsApp.employeeId} = ${employeeId ?? null}) AND
          (${status ?? null}::text IS NULL OR ${leaveRequestsApp.status} = ${status ?? null}) AND
          ${leaveRequestsApp.deletedAt} IS NULL
        `)
        .orderBy(sql`${leaveRequestsApp.createdAt} DESC`)
        .limit(100);
      return castTo<Row[]>(rows);
      }, 'DB_ERROR');
  }

  async createLeaveRequest(employeeId: unknown, startDate: unknown, endDate: unknown, reason: unknown, leaveType?: unknown, userId?: unknown): Promise<Result<Row>> {
    return safeCall(async () => {
      const start = (startDate as string | null) ?? '';
      const end   = (endDate   as string | null) ?? '';
      // total_days is NOT NULL in live DB but absent from leaveRequestsApp Drizzle schema
      // (shared/db is frozen). Using parameterised raw SQL for INSERT only — Qoida 4 exception.
      let totalDays = 1;
      if (start && end) {
        const diff = new Date(end).getTime() - new Date(start).getTime();
        totalDays = Math.max(1, Math.round(diff / 86400000) + 1);
      }
      const rows = await db.execute(sql`
        INSERT INTO leave_requests
          (employee_id, user_id, leave_type, start_date, end_date, total_days, reason, status)
        VALUES
          (${(employeeId ?? null) as number | null},
           ${(userId ?? employeeId ?? 0) as number},
           ${(leaveType ?? 'annual') as string},
           ${start},
           ${end},
           ${totalDays},
           ${(reason ?? null) as string | null},
           'pending')
        RETURNING id, employee_id, leave_type, start_date, end_date, total_days, reason, status, created_at
      `);
      const inserted = (rows as unknown as { rows?: Row[] }).rows ?? (Array.isArray(rows) ? rows : []);
      return castTo<Row>((inserted[0] ?? {}));
      }, 'DB_ERROR');
  }

  async getGamLeaderboardMonthly(): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await db.select({
        id:              hrEmployees.id,
        employee_name:   sql<string>`${hrEmployees.first_name} || ' ' || ${hrEmployees.last_name}`,
        department_name: hrDepartments.name,
        total_points:    hrEmployees.total_points,
        rank:            sql<number>`RANK() OVER (ORDER BY ${hrEmployees.total_points} DESC)`,
      })
        .from(hrEmployees)
        .leftJoin(hrDepartments, eq(hrDepartments.id, hrEmployees.department_id))
        .where(sql`${hrEmployees.status} = 'active' AND ${hrEmployees.total_points} > 0`)
        .orderBy(sql`${hrEmployees.total_points} DESC`)
        .limit(20);
      return castTo<Row[]>(rows);
      }, 'DB_ERROR');
  }

  async getAdaptationMilestones(employeeId?: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await db.select({
        id:               adaptation_milestones.id,
        record_id:        adaptation_milestones.record_id,
        milestone_number: adaptation_milestones.milestone_number,
        milestone_title:  adaptation_milestones.milestone_title,
        description:      adaptation_milestones.description,
        due_date:         adaptation_milestones.due_date,
        status:           adaptation_milestones.status,
        created_at:       adaptation_milestones.created_at,
        employee_id:      adaptation_records.employee_id,
        program_name:     adaptation_programs.program_name,
      })
        .from(adaptation_milestones)
        .innerJoin(adaptation_records, eq(adaptation_records.id, adaptation_milestones.record_id))
        .innerJoin(adaptation_programs, eq(adaptation_programs.id, adaptation_records.program_id))
        .where(sql`${employeeId ?? null}::int IS NULL OR ${adaptation_records.employee_id} = ${employeeId ?? null}`)
        .orderBy(adaptation_milestones.milestone_number)
        .limit(50);
      return castTo<Row[]>(rows);
      }, 'DB_ERROR');
  }

  // ── 3.14: adaptatsiya (moslashuv) checklist — CRUD + status-flow ─────────

  async getAdaptationPrograms(): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await db.select({
        id:              adaptation_programs.id,
        title:           adaptation_programs.title,
        title_ru:        adaptation_programs.title_ru,
        description:     adaptation_programs.description,
        department_id:   adaptation_programs.department_id,
        duration:        adaptation_programs.duration,
        duration_type:   adaptation_programs.duration_type,
        mentor_required: adaptation_programs.mentor_required,
        status:          adaptation_programs.status,
        created_at:      adaptation_programs.created_at,
      })
        .from(adaptation_programs)
        .where(isNull(adaptation_programs.deleted_at))
        .orderBy(desc(adaptation_programs.created_at))
        .limit(100);
      return castTo<Row[]>(rows);
      }, 'DB_ERROR');
  }

  async createAdaptationProgram(data: Record<string, unknown>): Promise<Result<Row>> {
    return safeCall(async () => {
      const title = String(data['title'] ?? '');
      const rows = await db.insert(adaptation_programs).values({
        title,
        title_ru:        String(data['title_ru'] ?? title),
        description:     (data['description'] ?? null) as string | null,
        position_id:     (data['position_id'] ?? null) as number | null,
        department_id:   (data['department_id'] ?? null) as number | null,
        duration:        (data['duration'] ?? 90) as number,
        duration_type:   (data['duration_type'] ?? 'days') as string,
        duration_days:   (data['duration'] ?? 90) as number,
        tasks:           [],
        mentor_required: (data['mentor_required'] ?? true) as boolean,
        status:          'active',
        is_active:       true,
        created_by:      (data['created_by'] ?? null) as number | null,
      }).returning();
      return castTo<Row>(rows[0] ?? {});
      }, 'DB_ERROR');
  }

  async getAdaptationRecords(employeeId?: number, status?: string): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await db.select({
        id:                     adaptation_records.id,
        employee_id:            adaptation_records.employee_id,
        program_id:             adaptation_records.program_id,
        mentor_id:              adaptation_records.mentor_id,
        professional_master_id: adaptation_records.professional_master_id,
        start_date:             adaptation_records.start_date,
        end_date:               adaptation_records.end_date,
        status:                 adaptation_records.status,
        progress_percent:       adaptation_records.progress_percent,
        current_milestone:      adaptation_records.current_milestone,
        current_phase:          adaptation_records.current_phase,
        hr_notes:               adaptation_records.hr_notes,
        created_at:             adaptation_records.created_at,
        employee_name:          sql<string>`${hrEmployees.first_name} || ' ' || ${hrEmployees.last_name}`,
        program_title:          adaptation_programs.title,
      })
        .from(adaptation_records)
        .leftJoin(hrEmployees, eq(hrEmployees.id, adaptation_records.employee_id))
        .leftJoin(adaptation_programs, eq(adaptation_programs.id, adaptation_records.program_id))
        .where(sql`
          ${adaptation_records.deleted_at} IS NULL AND
          (${employeeId ?? null}::int IS NULL OR ${adaptation_records.employee_id} = ${employeeId ?? null}) AND
          (${status ?? null}::text IS NULL OR ${adaptation_records.status} = ${status ?? null})
        `)
        .orderBy(desc(adaptation_records.created_at))
        .limit(100);
      return castTo<Row[]>(rows);
      }, 'DB_ERROR');
  }

  async getAdaptationRecordByEmployee(employeeId: number): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await db.select({
        id:                     adaptation_records.id,
        employee_id:            adaptation_records.employee_id,
        program_id:             adaptation_records.program_id,
        mentor_id:              adaptation_records.mentor_id,
        professional_master_id: adaptation_records.professional_master_id,
        start_date:             adaptation_records.start_date,
        end_date:               adaptation_records.end_date,
        status:                 adaptation_records.status,
        progress_percent:       adaptation_records.progress_percent,
        current_milestone:      adaptation_records.current_milestone,
        current_phase:          adaptation_records.current_phase,
        hr_notes:               adaptation_records.hr_notes,
        mentor_feedback:        adaptation_records.mentor_feedback,
        created_at:             adaptation_records.created_at,
        program_title:          adaptation_programs.title,
        mentor_first_name:      mentorEmployees.first_name,
        mentor_last_name:       mentorEmployees.last_name,
        mentor_email:           mentorEmployees.email_work,
        mentor_phone:           mentorEmployees.phone_number,
        master_first_name:      masterEmployees.first_name,
        master_last_name:       masterEmployees.last_name,
        master_email:           masterEmployees.email_work,
        master_phone:           masterEmployees.phone_number,
      })
        .from(adaptation_records)
        .leftJoin(adaptation_programs, eq(adaptation_programs.id, adaptation_records.program_id))
        .leftJoin(mentorEmployees, eq(mentorEmployees.id, adaptation_records.mentor_id))
        .leftJoin(masterEmployees, eq(masterEmployees.id, adaptation_records.professional_master_id))
        .where(sql`${adaptation_records.employee_id} = ${employeeId} AND ${adaptation_records.deleted_at} IS NULL`)
        .orderBy(desc(adaptation_records.created_at))
        .limit(1);
      return castTo<Row | null>(rows[0] ?? null);
      }, 'DB_ERROR');
  }

  async createAdaptationRecord(
    employeeId: number,
    programId: number | null,
    mentorId: number | null,
    startDate: string | null,
    createdBy: number | null,
  ): Promise<Result<Row>> {
    const existing = await this.getAdaptationRecordByEmployee(employeeId);
    if (existing.ok && existing.data) {
      return Err(AppErr('VALIDATION', 'Bu xodim uchun adaptatsiya jarayoni allaqachon mavjud'));
    }
    // adaptation_records.user_id is NOT NULL live (legacy column) — resolve it
    // from employees.user_id so inserts don't violate the constraint (3.14 fix).
    const empRows = await db.select({ user_id: hrEmployees.user_id })
      .from(hrEmployees)
      .where(eq(hrEmployees.id, employeeId))
      .limit(1);
    const resolvedUserId = empRows[0]?.user_id;
    if (resolvedUserId == null) {
      return Err(AppErr('VALIDATION', 'Xodimga tizim foydalanuvchisi (user_id) bog\'lanmagan'));
    }
    return safeCall(async () => {
      const start = startDate ?? _time.now().toISOString().slice(0, 10);
      const rows = await db.insert(adaptation_records).values({
        employee_id:      employeeId,
        user_id:          resolvedUserId,
        program_id:       programId,
        mentor_id:        mentorId,
        start_date:       start,
        status:           'active',
        progress:         0,
        progress_percent: 0,
        current_milestone: 1,
        total_milestones: ADAPTATION_MILESTONE_STEPS.length,
        tasks_completed:  0,
        created_by:       createdBy,
      }).returning();
      return castTo<Row>(rows[0] ?? {});
      }, 'DB_ERROR');
  }

  async createAdaptationMilestones(recordId: number, startDate: string): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const base = new Date(startDate);
      const values = ADAPTATION_MILESTONE_STEPS.map(step => {
        const due = new Date(base);
        due.setDate(due.getDate() + step.dayOffset);
        return {
          record_id:        recordId,
          milestone_number: step.number,
          milestone_title:  step.title,
          description:      null,
          due_date:         due.toISOString().slice(0, 10),
          status:           'pending',
        };
      });
      const rows = await db.insert(adaptation_milestones).values(values).returning();
      return castTo<Row[]>(rows);
      }, 'DB_ERROR');
  }

  async getAdaptationRecordMilestones(recordId: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await db.select({
        id:               adaptation_milestones.id,
        record_id:        adaptation_milestones.record_id,
        milestone_number: adaptation_milestones.milestone_number,
        milestone_title:  adaptation_milestones.milestone_title,
        description:      adaptation_milestones.description,
        due_date:         adaptation_milestones.due_date,
        status:           adaptation_milestones.status,
        completed_date:   adaptation_milestones.completed_date,
        verified_by:      adaptation_milestones.verified_by,
        notes:            adaptation_milestones.notes,
        created_at:       adaptation_milestones.created_at,
      })
        .from(adaptation_milestones)
        .where(eq(adaptation_milestones.record_id, recordId))
        .orderBy(adaptation_milestones.milestone_number);
      return castTo<Row[]>(rows);
      }, 'DB_ERROR');
  }

  async updateAdaptationMilestoneStatus(
    milestoneId: number,
    status: string,
    notes: string | null,
    verifiedBy: number | null,
  ): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.update(adaptation_milestones)
        .set({
          status,
          notes:          notes ?? undefined,
          verified_by:    verifiedBy ?? undefined,
          completed_date: status === 'completed' ? _time.now().toISOString().slice(0, 10) : undefined,
        })
        .where(eq(adaptation_milestones.id, milestoneId))
        .returning();
      return castTo<Row>(rows[0] ?? {});
      }, 'DB_ERROR');
  }

  async recomputeAdaptationProgress(recordId: number): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const milestoneRows = await db.select({
        status: adaptation_milestones.status,
      }).from(adaptation_milestones).where(eq(adaptation_milestones.record_id, recordId));
      const total = milestoneRows.length;
      const completed = milestoneRows.filter(m => m.status === 'completed').length;
      const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;
      const currentMilestone = Math.min(completed + 1, Math.max(total, 1));
      const allDone = total > 0 && completed === total;
      const rows = await db.update(adaptation_records)
        .set({
          progress:          progressPercent,
          progress_percent:  progressPercent,
          tasks_completed:   completed,
          current_milestone: currentMilestone,
          status:            allDone ? 'completed' : undefined,
          completed_at:      allDone ? _time.now() : undefined,
          completed_date:    allDone ? _time.now().toISOString().slice(0, 10) : undefined,
        })
        .where(eq(adaptation_records.id, recordId))
        .returning();
      return castTo<Row | null>(rows[0] ?? null);
      }, 'DB_ERROR');
  }
}
