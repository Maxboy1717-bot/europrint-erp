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
import { sql, eq } from 'drizzle-orm';
import { execHrBrandSettingsUpsert } from '@common/database/queries-remaining';
import { safeCall, Result } from '@common/result';
import {
  hr_brand_settings, hr_documents, document_templates,
  safety_incidents, safety_training_records, hazard_zones,
  ppe_compliance, hr_leave_requests, adaptation_milestones,
  adaptation_records, adaptation_programs, hrEmployees, hrDepartments,
  gamification_totals,
} from '@shared/db';
import type { IHrCompatSafetyRepo } from '../../domain/repositories/i-hr-compat-safety.repo';

type Row = Record<string, unknown>;

@Injectable()
export class HrCompatSafetyRepository implements IHrCompatSafetyRepo {
  async getBrandSettings(): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await db.select({ brand_data: hr_brand_settings.brand_data, updated_at: hr_brand_settings.updated_at })
        .from(hr_brand_settings)
        .where(eq(hr_brand_settings.company_id, 'default'))
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
        id:           hr_leave_requests.id,
        employee_id:  hr_leave_requests.employee_id,
        start_date:   hr_leave_requests.start_date,
        end_date:     hr_leave_requests.end_date,
        reason:       hr_leave_requests.reason,
        status:       hr_leave_requests.status,
        requested_at: hr_leave_requests.requested_at,
        reviewed_at:  hr_leave_requests.reviewed_at,
        notes:        hr_leave_requests.notes,
        employee_name: sql<string>`${hrEmployees.first_name} || ' ' || ${hrEmployees.last_name}`,
      })
        .from(hr_leave_requests)
        .leftJoin(hrEmployees, eq(hrEmployees.id, hr_leave_requests.employee_id))
        .where(sql`
          (${employeeId ?? null}::int IS NULL OR ${hr_leave_requests.employee_id} = ${employeeId ?? null}) AND
          (${status ?? null}::text IS NULL OR ${hr_leave_requests.status} = ${status ?? null})
        `)
        .orderBy(sql`${hr_leave_requests.requested_at} DESC`)
        .limit(100);
      return castTo<Row[]>(rows);
      }, 'DB_ERROR');
  }

  async createLeaveRequest(employeeId: unknown, startDate: unknown, endDate: unknown, reason: unknown): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.insert(hr_leave_requests).values({
        employee_id:  (employeeId ?? null) as number,
        start_date:   (startDate ?? null) as string,
        end_date:     (endDate ?? null) as string,
        reason:       (reason ?? null) as string,
        status:       'pending',
      }).returning();
      return castTo<Row>((rows[0] ?? {}));
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
}
