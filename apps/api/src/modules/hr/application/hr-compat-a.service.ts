import { Injectable, Inject, InternalServerErrorException } from '@nestjs/common';
import { HR_REPO, IHrRepo } from '../domain/repositories/i-hr.repo';
import { safeCall, Result, AppError } from '@common/result';
import { HrCompatARepository } from './hr-compat-a.repository';

@Injectable()
export class HrCompatAService {
  constructor(
    @Inject(HR_REPO) private readonly hrRepo: IHrRepo,
    private readonly repo: HrCompatARepository,
  ) {}

  async get360Reviews(employeeId?: string): Promise<Result<object, AppError>> {
    return safeCall(() => this.repo.get360Reviews(employeeId));
  }

  async create360Review(employeeId: unknown, assessmentPeriod: unknown, assessmentYear: number, selfRating: unknown, managerRating: unknown, peerRating: unknown, avg: number) {
    return safeCall(() => this.repo.create360Review(employeeId, assessmentPeriod, assessmentYear, selfRating, managerRating, peerRating, avg));
  }

  async get360DeptSummary(departmentId?: string) {
    return safeCall(() => this.repo.get360DeptSummary(departmentId));
  }

  async getConflictReports(status?: string) {
    return this.repo.getConflictReports(status);
  }

  async createConflictReport(party1: unknown, party2: unknown, description: unknown, severity: unknown) {
    return this.repo.createConflictReport(party1, party2, description, severity);
  }

  async getEmployeeSkills(employeeId?: string) {
    return this.repo.getEmployeeSkills(employeeId);
  }

  async createEmployeeSkill(employeeId: unknown, skillName: unknown, proficiencyLevel: unknown, proficiencyScore: unknown, certifiedDate: unknown) {
    return this.repo.createEmployeeSkill(employeeId, skillName, proficiencyLevel, proficiencyScore, certifiedDate);
  }

  async getEmployeeSkillsById(employeeId: number) {
    return this.repo.getEmployeeSkillsById(employeeId);
  }

  async getHealthCheckups(departmentId?: string) {
    return safeCall(async () => {
      const result = await this.hrRepo.findHealthCheckups(departmentId);
      if (!result.ok) throw new InternalServerErrorException(result.error);
      return result.data;
    });
  }

  async createHealthCheckup(departmentId: unknown, departmentName: unknown, totalEmployees: unknown, examinedCount: unknown, lastCheckupDate: unknown, nextCheckupDate: unknown) {
    return this.repo.createHealthCheckup(departmentId, departmentName, totalEmployees, examinedCount, lastCheckupDate, nextCheckupDate);
  }

  async getHrcTestSessions() {
    return this.repo.getHrcTestSessions();
  }

  async getHrcTestQuestions(category?: string) {
    return this.repo.getHrcTestQuestions(category);
  }

  async getVacancyCandidates(vacancyId?: string) {
    return safeCall(async () => {
      const result = await this.hrRepo.findVacancyCandidates(vacancyId);
      if (!result.ok) throw new InternalServerErrorException(result.error);
      return result.data;
    });
  }

  async getDiscipline(employeeId?: string) {
    return safeCall(async () => {
      const result = await this.hrRepo.findDisciplineRecords(employeeId);
      if (!result.ok) throw new InternalServerErrorException(result.error);
      return result.data;
    });
  }

  async createDisciplineRecord(employeeId: unknown, violationType: unknown, disciplineType: unknown, severity: unknown, violationDate: unknown, description: unknown, fineAmount: unknown) {
    return this.repo.createDisciplineRecord(employeeId, violationType, disciplineType, severity, violationDate, description, fineAmount);
  }

  async getPayrollRuns(period?: string) {
    return safeCall(async () => {
      const result = await this.hrRepo.findPayrollRuns(period);
      if (!result.ok) throw new InternalServerErrorException(result.error);
      return result.data;
    });
  }

  async getPayrollPeriods() {
    return safeCall(async () => {
      const result = await this.hrRepo.findPayrollPeriods();
      if (!result.ok) throw new InternalServerErrorException(result.error);
      return result.data;
    });
  }
}
