/**
 * @deprecated 2026-05-27
 * This file is a compatibility shim. Do NOT add new features here.
 * Canonical replacement: `apps/api/src/modules/hr/application/hr-employees-ext.service.ts`
 * Existing consumers continue to work. New code must import from the canonical file.
 * See: docs/modules/hr-employees.md
 */
/**
 * @module employees-compat-profile.service
 * @description Business-logic facade. Delegates to two sub-services to keep
 *   this file under 300 lines (Rule 16):
 *     - EmployeesCompatProfileRawService — career, capital, org, salary, sick,
 *       emergency contacts, passport (complex JOINs / aggregates as raw SQL).
 *     - EmployeesCompatProfileOrmService — monthly report, contracts, leaves,
 *       corporate inventory, files (simple Drizzle ORM CRUD).
 *   The public surface (method names + signatures) is unchanged; downstream
 *   consumers (compatibility module + sub-controller + spec) need no edits.
 *   Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable } from '@nestjs/common';
import { Result, AppError } from '@common/result';
import { EmployeesCompatProfileRawService } from './employees-compat-profile-raw.service';
import { EmployeesCompatProfileOrmService } from './employees-compat-profile-orm.service';

type Row = Record<string, unknown>;

@Injectable()
export class EmployeesCompatProfileService {
  constructor(
    private readonly raw: EmployeesCompatProfileRawService,
    private readonly orm: EmployeesCompatProfileOrmService,
  ) {}

  // ─── Raw-SQL surface (delegated) ───────────────────────────────────────────

  getCareer(id: string): Promise<Result<{ history: Row[]; goals: Row[] }, AppError>> {
    return this.raw.getCareer(id);
  }

  getCapitalProfile(id: string): Promise<Result<Row | null, AppError>> {
    return this.raw.getCapitalProfile(id);
  }

  getOrgStructure(id: string): Promise<Result<{ manager: Row | null; subordinates: Row[]; peers: Row[] }, AppError>> {
    return this.raw.getOrgStructure(id);
  }

  getSalaryHistory(id: string): Promise<Result<Row[], AppError>> {
    return this.raw.getSalaryHistory(id);
  }

  getPayrollSummary(id: string): Promise<Result<Row | null, AppError>> {
    return this.raw.getPayrollSummary(id);
  }

  getSickLeaves(id: string): Promise<Result<Row[], AppError>> {
    return this.raw.getSickLeaves(id);
  }

  createCareer(employeeId: string, body: Row): Promise<Result<Row, AppError>> {
    return this.raw.createCareer(employeeId, body);
  }

  createCapitalProfile(employeeId: string, body: Row): Promise<Result<Row, AppError>> {
    return this.raw.createCapitalProfile(employeeId, body);
  }

  createEmergencyContact(employeeId: string, body: Row): Promise<Result<Row, AppError>> {
    return this.raw.createEmergencyContact(employeeId, body);
  }

  createPassport(employeeId: string, body: Row): Promise<Result<Row, AppError>> {
    return this.raw.createPassport(employeeId, body);
  }

  createSalaryHistory(employeeId: string, body: Row): Promise<Result<Row, AppError>> {
    return this.raw.createSalaryHistory(employeeId, body);
  }

  getEmergencyContacts(id: string): Promise<Result<Row[], AppError>> {
    return this.raw.getEmergencyContacts(id);
  }

  // ─── Drizzle-ORM surface (delegated) ───────────────────────────────────────

  getPassport(id: string): Promise<Result<Row | null, AppError>> {
    return this.orm.getPassport(id);
  }

  getMonthlyReport(id: string): Promise<Result<Row | null, AppError>> {
    return this.orm.getMonthlyReport(id);
  }

  getContracts(id: string): Promise<Result<Row[], AppError>> {
    return this.orm.getContracts(id);
  }

  getLeaveRequests(id: string): Promise<Result<Row[], AppError>> {
    return this.orm.getLeaveRequests(id);
  }

  getCorporateInventory(id: string): Promise<Result<Row[], AppError>> {
    return this.orm.getCorporateInventory(id);
  }

  getFiles(id: string): Promise<Result<Row[], AppError>> {
    return this.orm.getFiles(id);
  }

  createContract(employeeId: string, body: Row): Promise<Result<Row, AppError>> {
    return this.orm.createContract(employeeId, body);
  }

  createCorporateInventory(employeeId: string, body: Row): Promise<Result<Row, AppError>> {
    return this.orm.createCorporateInventory(employeeId, body);
  }

  patchCorporateInventoryReturn(employeeId: string, itemId: string): Promise<Result<Row, AppError>> {
    return this.orm.patchCorporateInventoryReturn(employeeId, itemId);
  }

  patchCorporateInventorySign(employeeId: string, itemId: string): Promise<Result<Row, AppError>> {
    return this.orm.patchCorporateInventorySign(employeeId, itemId);
  }

  createLeaveRequest(employeeId: string, body: Row): Promise<Result<Row, AppError>> {
    return this.orm.createLeaveRequest(employeeId, body);
  }

  createSickLeave(employeeId: string, body: Row): Promise<Result<Row, AppError>> {
    return this.orm.createSickLeave(employeeId, body);
  }
}
