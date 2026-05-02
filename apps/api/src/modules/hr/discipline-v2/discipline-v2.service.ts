import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { errMsg } from "../hr-v2-error";
import { EventEmitter2 } from '@nestjs/event-emitter';
import { HrV2Events } from '../events/hr-v2-events';
import { safeCall, Result, AppError } from '@common/result';
import { DisciplineV2Repository } from './discipline-v2.repository';

@Injectable()
export class DisciplineV2Service {
  private readonly logger = new Logger(DisciplineV2Service.name);

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly repo: DisciplineV2Repository,
  ) {}

  async getViolationCatalog(): Promise<Result<object, AppError>> {
    return this.repo.getViolationCatalog();
  }

  async createCatalogEntry(dto: {
    code: string; name: string; category: string; severity: string;
    pointsDeducted?: number; defaultFineAmount?: number; description?: string;
  }) {
    return this.repo.createCatalogEntry({
      code: dto.code,
      name: dto.name,
      category: dto.category,
      severity: dto.severity,
      defaultFineAmount: dto.defaultFineAmount,
      description: dto.description,
    });
  }

  async updateCatalogEntry(code: string, dto: {
    name?: string; category?: string; severity?: string;
    pointsDeducted?: number; defaultFineAmount?: number; description?: string; isActive?: boolean;
  }) {
    return this.repo.updateCatalogEntry(code, dto);
  }

  async deleteCatalogEntry(code: string) {
    return safeCall(async () => {
      const row = await this.repo.softDeleteCatalogEntry(code);
      if (!row || !row.ok || !row.data) throw new InternalServerErrorException(`Catalog entry ${code} not found`);
      return { deleted: true, code, name: row.data.name };
    });
  }

  async addViolation(dto: {
    employeeId: number;
    catalogCode: string;
    violationDate: string;
    description: string;
    issuedBy: number;
    fineAmount?: number;
  }) {
    return safeCall(async () => {
      this.logger.log(`Intizom buzilishi qayd etilmoqda: xodim #${dto.employeeId}, kod=${dto.catalogCode}`);
      const catR = await this.repo.getCatalogEntry(dto.catalogCode);
      const cat = (catR.ok ? catR.data : null) as Record<string, unknown> | null;
      const countR = await this.repo.getPreviousViolationCount(dto.employeeId, dto.catalogCode);
      const count = countR.ok ? (countR.data as number) : 0;

      const severities = ['warning', 'reprimand', 'severe_reprimand', 'fine', 'dismissal'];
      const baseSeverity = String(cat?.severity ?? 'warning');
      const baseIdx = severities.indexOf(baseSeverity);
      const effectiveIdx = Math.min(baseIdx + count, severities.length - 1);
      const severity = severities[effectiveIdx];

      const row = await this.repo.createViolationRecord({
        employeeId: dto.employeeId,
        catalogCode: dto.catalogCode,
        violationType: String(cat?.name || dto.catalogCode),
        disciplineType: severity,
        severity,
        violationDate: dto.violationDate,
        description: dto.description,
        issuedBy: dto.issuedBy,
        fineAmount: dto.fineAmount ?? Number(cat?.default_fine_amount ?? 0),
        violationCountThisCategory: count + 1,
        isFirstWarning: count === 0,
      });

      this.eventEmitter.emit(HrV2Events.DISCIPLINE_ISSUED, {
        employeeId: dto.employeeId,
        catalogCode: dto.catalogCode,
        severity,
      });

      return row;
    });
  }

  async blockEmployee(employeeId: number, reason: string, blockedBy: number) {
    return safeCall(async () => {
      this.logger.warn(`Xodim #${employeeId} bloklandi: ${reason} (blokladigan: #${blockedBy})`);
      await this.repo.deactivatePreviousBlocks(employeeId);
      await this.repo.createBlock(employeeId, reason, blockedBy);
      await this.repo.setEmployeeBlocked(employeeId, true, reason);
      this.eventEmitter.emit(HrV2Events.EMPLOYEE_BLOCKED, { employeeId, reason, blockedBy });
      return { success: true, employeeId, reason };
    });
  }

  async unblockEmployee(employeeId: number, unblockedBy: number, reason: string) {
    return safeCall(async () => {
      await this.repo.unblockRecord(employeeId, unblockedBy);
      await this.repo.setEmployeeBlocked(employeeId, false, null);
      this.eventEmitter.emit(HrV2Events.EMPLOYEE_UNBLOCKED, { employeeId, unblockedBy });
      return { success: true, employeeId };
    });
  }

  async getEmployeeViolations(employeeId: number) {
    const r = await this.repo.getEmployeeViolations(employeeId);
    if (!r.ok) throw new InternalServerErrorException('getEmployeeViolations failed');
    return r.data ?? [];
  }

  async acknowledgeViolation(id: number) {
    const r = await this.repo.acknowledgeViolation(id);
    if (!r.ok) throw new InternalServerErrorException('acknowledgeViolation failed');
    return r.data;
  }

  async approveViolation(id: number, approvedBy?: number) {
    const r = await this.repo.approveViolation(id, approvedBy);
    if (!r.ok) throw new InternalServerErrorException('approveViolation failed');
    return r.data;
  }

  async checkDisciplineStatus(employeeId: number) {
    return this.repo.checkDisciplineStatus(employeeId);
  }

  async excuseAbsence(id: number, dto: { excuseReason: string }) {
    const r = await this.repo.excuseAbsence(id, dto);
    if (!r.ok) throw new InternalServerErrorException('excuseAbsence failed');
    return r.data;
  }
}
