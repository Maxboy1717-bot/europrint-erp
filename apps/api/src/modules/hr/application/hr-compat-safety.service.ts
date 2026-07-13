/**
 * @module hr-compat-safety.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Inject, Injectable, Logger } from '@nestjs/common';
import { safeInt } from '../common/db-rows';
import { safeCall, Result, AppError, Ok } from '@common/result';
import { HR_COMPAT_SAFETY_REPO, type IHrCompatSafetyRepo } from '../domain/repositories/i-hr-compat-safety.repo';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

type Row = Record<string, unknown>;

@Injectable()
export class HrCompatSafetyService {
  private readonly logger = new Logger(HrCompatSafetyService.name);

  constructor(@Inject(HR_COMPAT_SAFETY_REPO) private readonly repo: IHrCompatSafetyRepo) {}

  async getBrandSettings(): Promise<Result<object | null, AppError>> {
    return this.repo.getBrandSettings();
  }

  async updateBrandSettings(body: Record<string, unknown>) {
    return this.repo.updateBrandSettings(JSON.stringify(body));
  }

  async getDocuments(docType?: string, status?: string) {
    return this.repo.getDocuments(docType, status);
  }

  async getDocumentWorkflowRoutes() {
    return this.repo.getDocumentWorkflowRoutes();
  }

  async archiveDocument(id: number) {
    return this.repo.archiveDocument(id);
  }

  // P1.23.1: list + delete safety incidents
  async getSafetyIncidents(statusFilter?: string) {
    return this.repo.getSafetyIncidents(statusFilter);
  }

  async deleteSafetyIncident(id: number): Promise<void> {
    return this.repo.deleteSafetyIncident(id);
  }

  async createSafetyIncident(incidentType: unknown, severity: unknown, description: unknown, locationDesc: unknown, departmentId: unknown, incidentDate: unknown) {
    return this.repo.createSafetyIncident(incidentType, severity, description, locationDesc, departmentId, incidentDate);
  }

  // P1.23.1: PDF export — generates a simple safety incidents report
  async generateSafetyIncidentReport(): Promise<Result<Buffer, AppError>> {
    return safeCall(async () => {
      const incidentsResult = await this.repo.getSafetyIncidents();
      const incidents = incidentsResult.ok ? (incidentsResult.data as Record<string, unknown>[]) : [];

      const pdf = await PDFDocument.create();
      const page = pdf.addPage([595, 842]);
      const font = await pdf.embedFont(StandardFonts.Helvetica);
      const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

      let y = 800;
      const draw = (text: string, opts?: { bold?: boolean; size?: number; color?: ReturnType<typeof rgb> }) => {
        page.drawText(text.substring(0, 85), { x: 50, y, size: opts?.size ?? 10, font: opts?.bold ? bold : font, color: opts?.color ?? rgb(0, 0, 0) });
        y -= (opts?.size ?? 10) + 5;
      };

      draw('EuroPrint — Xavfsizlik Hodisalari Hisoboti', { bold: true, size: 16 });
      draw(`Sana: ${new Date().toLocaleDateString('uz-UZ')}  Jami: ${incidents.length} ta hodisa`, { size: 10, color: rgb(0.4, 0.4, 0.4) });
      y -= 10;

      for (const inc of incidents.slice(0, 40)) {
        if (y < 80) break;
        draw(`#${inc['id']} | ${inc['incident_type'] ?? '-'} | ${inc['severity'] ?? '-'} | ${inc['incident_date'] ?? '-'}`, { bold: true, size: 9 });
        if (inc['description']) draw(`  ${String(inc['description']).substring(0, 80)}`, { size: 9, color: rgb(0.3, 0.3, 0.3) });
        y -= 4;
      }

      const bytes = await pdf.save();
      return Buffer.from(bytes);
    });
  }

  async getSafetyTrainings(employeeId?: string) {
    return safeCall(() => this.repo.getSafetyTrainings(employeeId ? safeInt(employeeId, 0) : undefined));
  }

  async createSafetyTraining(trainingId: unknown, employeeId: unknown, completedDate: unknown, expiryDate: unknown, score: unknown, isPassed: unknown, trainingName?: unknown) {
    return this.repo.createSafetyTraining(trainingId, employeeId, completedDate, expiryDate, score, isPassed, trainingName);
  }

  async getHazardZones(departmentId?: string) {
    return safeCall(() => this.repo.getHazardZones(departmentId ? safeInt(departmentId, 0) : undefined));
  }

  async createHazardZone(zoneName: unknown, zoneCode: unknown, departmentId: unknown, hazardLevel: unknown, requiredPpe: unknown, maxOccupancy: unknown, location?: unknown, hazardType?: unknown, description?: unknown) {
    return this.repo.createHazardZone(zoneName, zoneCode, departmentId, hazardLevel, requiredPpe, maxOccupancy, location, hazardType, description);
  }

  async getPpeCompliance(employeeId?: string) {
    return safeCall(() => this.repo.getPpeCompliance(employeeId ? safeInt(employeeId, 0) : undefined));
  }

  async createPpeCompliance(employeeId: unknown, ppeType: unknown, issueDate: unknown, expiryDate: unknown, isCompliant: unknown) {
    return this.repo.createPpeCompliance(employeeId, ppeType, issueDate, expiryDate, isCompliant);
  }

  async getLeaveRequests(employeeId?: string, status?: string) {
    return safeCall(() => this.repo.getLeaveRequests(employeeId ? safeInt(employeeId, 0) : undefined, status));
  }

  async createLeaveRequest(employeeId: unknown, startDate: unknown, endDate: unknown, reason: unknown, leaveType?: unknown, userId?: unknown) {
    return this.repo.createLeaveRequest(employeeId, startDate, endDate, reason, leaveType, userId);
  }

  async getGamLeaderboardMonthly() {
    return this.repo.getGamLeaderboardMonthly();
  }

  async getAdaptationMilestones(employeeId?: string) {
    return safeCall(() => this.repo.getAdaptationMilestones(employeeId ? safeInt(employeeId, 0) : undefined));
  }

  // ── 3.14: adaptatsiya (moslashuv) checklist — CRUD + status-flow ─────────

  async getAdaptationPrograms() {
    return this.repo.getAdaptationPrograms();
  }

  async createAdaptationProgram(data: Record<string, unknown>) {
    return this.repo.createAdaptationProgram(data);
  }

  async getAdaptationRecords(employeeId?: string, status?: string) {
    return this.repo.getAdaptationRecords(employeeId ? safeInt(employeeId, 0) : undefined, status);
  }

  async getAdaptationRecordByEmployee(employeeId: number) {
    return this.repo.getAdaptationRecordByEmployee(employeeId);
  }

  /**
   * Yangi xodim uchun adaptatsiya jarayoni ochish: record + 4 checklist
   * bosqichi (kun1/hafta1/oy1/oy3) avtomatik yaratiladi (lifecycle naqsh:
   * onboarding-adaptation-merge.sql'dagi kabi, faqat CRUD orqali).
   */
  async createAdaptationRecord(
    employeeId: number,
    programId: number | null,
    mentorId: number | null,
    startDate: string | null,
    createdBy: number | null,
  ): Promise<Result<Row, AppError>> {
    const recordResult = await this.repo.createAdaptationRecord(employeeId, programId, mentorId, startDate, createdBy);
    if (!recordResult.ok) return recordResult;
    const record = recordResult.data;
    const start = (record['start_date'] as string | null) ?? startDate ?? new Date().toISOString().slice(0, 10);
    await this.repo.createAdaptationMilestones(Number(record['id']), start);
    return recordResult;
  }

  async getAdaptationRecordMilestones(recordId: number) {
    return this.repo.getAdaptationRecordMilestones(recordId);
  }

  /**
   * Checklist bosqichini kuzatish: status o'zgarsa (pending→completed/skipped)
   * record'ning progress_percent/current_milestone/status avtomatik qayta hisoblanadi.
   */
  async updateAdaptationMilestoneStatus(
    milestoneId: number,
    status: string,
    notes: string | null,
    verifiedBy: number | null,
  ): Promise<Result<Row, AppError>> {
    const result = await this.repo.updateAdaptationMilestoneStatus(milestoneId, status, notes, verifiedBy);
    if (!result.ok) return result;
    const recordId = result.data['record_id'] as number | null;
    if (recordId) await this.repo.recomputeAdaptationProgress(recordId);
    return result;
  }
}
