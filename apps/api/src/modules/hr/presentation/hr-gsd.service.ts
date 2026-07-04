/**
 * @module hr-gsd.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable } from '@nestjs/common';
import { Result, AppError } from '@common/result';
import { HrGsdRepository } from './hr-gsd.repository';

type Row = Record<string, unknown>;

@Injectable()
export class HrGsdService {
  constructor(private readonly repo: HrGsdRepository) {}

  getEmployee(id: number): Promise<Result<Row | null, AppError>> {
    return this.repo.findEmployee(id);
  }

  getEmployeeHistory(id: number): Promise<Result<Row[], AppError>> {
    return this.repo.findEmployeeHistory(id);
  }

  // Q9: real UPDATE delegate
  updateEmployee(id: number, dto: Parameters<typeof this.repo.updateEmployee>[1]): Promise<Result<Row, AppError>> {
    return this.repo.updateEmployee(id, dto);
  }

  getReferrals(): Promise<Result<Row[], AppError>> {
    return this.repo.findReferrals();
  }

  // P1.26.1: real insert
  createReferral(dto: {
    referrerId?: number | string | null;
    candidateName?: string;
    candidateEmail?: string;
    candidatePhone?: string;
    positionTitle?: string;
    hrNotes?: string;
  }): Promise<Result<Row, AppError>> {
    return this.repo.createReferral(dto);
  }

  // P1.26.1: update status/bonus
  updateReferral(id: number, dto: {
    status?: string;
    bonusAmount?: number;
    bonusPaid?: boolean;
    hrNotes?: string;
  }): Promise<Result<Row, AppError>> {
    return this.repo.updateReferral(id, dto);
  }

  getBoomerangs(): Promise<Result<Row[], AppError>> {
    return this.repo.findBoomerangs();
  }

  getSkills(): Promise<Result<Row[], AppError>> {
    return this.repo.findSkills();
  }

  getMilestone(id: number): Promise<Result<Row | null, AppError>> {
    return this.repo.findMilestone(id);
  }

  completeMilestone(id: number): Promise<Result<Row, AppError>> {
    return this.repo.completeMilestone(id);
  }

  // P1.15.1: mentorship pairings
  getMentorshipPairings(mentorId?: number, status?: string): Promise<Result<Row[], AppError>> {
    return this.repo.findMentorshipPairings(mentorId, status);
  }

  createMentorshipPairing(dto: Parameters<typeof this.repo.createMentorshipPairing>[0]): Promise<Result<Row, AppError>> {
    return this.repo.createMentorshipPairing(dto);
  }

  updateMentorshipPairing(id: number, dto: Parameters<typeof this.repo.updateMentorshipPairing>[1]): Promise<Result<Row, AppError>> {
    return this.repo.updateMentorshipPairing(id, dto);
  }

  async getEmployeesList(limit = 100, offset = 0): Promise<Row[]> {
    const r: Result<Row[], AppError> = await this.repo.findEmployeesList(limit, offset);
    return r.ok && Array.isArray(r.data) ? r.data : [];
  }
}
