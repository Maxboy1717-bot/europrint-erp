/**
 * @module i-hr-compat-a.repo
 * @description Domain repository interface for HR legacy compat layer "A".
 *   Concrete implementation lives at
 *   `infrastructure/repositories/hr-compat-a.repository.ts`.
 * @layer Domain (HR)
 */

import type { Result } from '@common/result';

type Row = Record<string, unknown>;

export interface IHrCompatARepo {
  get360Reviews(employeeId?: string): Promise<Result<Row[]>>;
  create360Review(
    employeeId: unknown,
    assessmentPeriod: unknown,
    assessmentYear: number,
    selfRating: unknown,
    managerRating: unknown,
    peerRating: unknown,
    avg: number,
  ): Promise<Result<Row>>;
  get360DeptSummary(departmentId?: string): Promise<Result<Row[]>>;
  getConflictReports(status?: string): Promise<Result<Row[]>>;
  createConflictReport(
    party1: unknown,
    party2: unknown,
    description: unknown,
    severity: unknown,
  ): Promise<Result<Row>>;
  getEmployeeSkills(employeeId?: string): Promise<Result<Row[]>>;
  createEmployeeSkill(
    employeeId: unknown,
    skillName: unknown,
    skillCategory: unknown,
    proficiencyLevel: unknown,
    proficiencyScore: unknown,
    certifiedDate: unknown,
    notes?: unknown,
  ): Promise<Result<Row>>;
  deleteEmployeeSkill(id: number): Promise<Result<{ deleted: number }>>;
  getEmployeeSkillsById(employeeId: number): Promise<Result<Row[]>>;
  // Skills catalog (hr/skills)
  getSkillsCatalog(): Promise<Result<{ items: Row[]; total: number }>>;
  createSkillCatalog(data: { code: string; name: string; nameRu?: string; category?: string; description?: string }): Promise<Result<Row>>;
  updateSkillCatalog(id: number, data: { name?: string; nameRu?: string; category?: string; description?: string }): Promise<Result<Row>>;
  deleteSkillCatalog(id: number): Promise<Result<{ deleted: number }>>;
  createHealthCheckup(
    departmentId: unknown,
    departmentName: unknown,
    totalEmployees: unknown,
    examinedCount: unknown,
    lastCheckupDate: unknown,
    nextCheckupDate: unknown,
    checkupType?: unknown,
    notes?: unknown,
    status?: unknown,
  ): Promise<Result<Row>>;
  getHrcTestSessions(): Promise<Result<Row[]>>;
  getHrcTestQuestions(category?: string): Promise<Result<Row[]>>;
  createDisciplineRecord(
    employeeId: unknown,
    violationType: unknown,
    disciplineType: unknown,
    severity: unknown,
    violationDate: unknown,
    description: unknown,
    fineAmount: unknown,
    issuedBy?: unknown,
  ): Promise<Result<Row>>;
  getDepartments(isActive?: boolean): Promise<Result<Row[]>>;
  getPositions(departmentId?: number, isActive?: boolean): Promise<Result<Row[]>>;
  getVacancies(status?: string, isActive?: boolean): Promise<Result<Row[]>>;
}

export const HR_COMPAT_A_REPO = Symbol('HR_COMPAT_A_REPO');
