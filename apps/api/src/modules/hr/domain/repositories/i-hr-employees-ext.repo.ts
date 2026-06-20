/**
 * @module i-hr-employees-ext.repo
 * @description Domain repository interface for HR employees extended ops
 *   (profile image, org assignment, import, assets, swap requests,
 *   complaints, assessment skips, paged list).
 *   Concrete implementation lives at
 *   `infrastructure/repositories/hr-employees-ext.repository.ts`.
 * @layer Domain (HR)
 */

import type { Result } from '@common/result';

type Row = Record<string, unknown>;

export interface IHrEmployeesExtRepo {
  updateProfileImage(id: number, imageUrl: string): Promise<Result<Row>>;
  assignOrgFunctions(
    id: number,
    departmentId?: string,
    positionId?: string,
  ): Promise<Result<Row>>;
  importEmployee(emp: Row): Promise<void>;
  getEmployeeAssets(id: number): Promise<Result<Row[]>>;
  assignAsset(
    id: number,
    assetType: unknown,
    assetName: unknown,
    assetCode: unknown,
    assignedDate: unknown,
    notes: unknown,
  ): Promise<Result<Row>>;
  getEmployeeSwapRequests(employeeId: number, status?: string): Promise<Result<Row[]>>;
  getEmployeeComplaints(employeeId: string): Promise<Result<Row[]>>;
  createComplaint(
    employeeId: string,
    party2: unknown,
    description: unknown,
    severity: unknown,
  ): Promise<Result<Row>>;
  getAssessmentSkips(id: number): Promise<Result<Row[]>>;
  getEmployeesList(limit?: number, offset?: number): Promise<Result<Row[]>>;
  getEmployeeDocuments(employeeId: number): Promise<Result<Row[]>>;
  getEmployeeDocumentById(employeeId: number, docId: number): Promise<Result<Row | null>>;
  deleteEmployeeDocument(employeeId: number, docId: number): Promise<Result<boolean>>;
  /** Assign employee to an org_function (karta). Razryad flows: employee→karta→razryad_level. */
  assignCard(employeeId: number, orgFunctionId: number): Promise<Result<Row>>;
  /** Returns all hr_documents with status='pending', newest first, limit 100. */
  getPendingDocuments(): Promise<Result<Row[]>>;
}

export const HR_EMPLOYEES_EXT_REPO = Symbol('HR_EMPLOYEES_EXT_REPO');
