/**
 * @module integration-employee.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { Ok, Result, AppError, safeCall } from '@common/result';
import { IntegrationEmployeeRepository } from './integration-employee.repo';

@Injectable()
export class IntegrationEmployeeService {
  constructor(private readonly repo: IntegrationEmployeeRepository) {}

  async getEmployeeComplaints(employeeId: string): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const r = await this.repo.findEmployeeComplaints(employeeId);
      if (!r.ok) return Ok({ complaints: [] });
      return Ok({ complaints: r.data });
    });
  }

  async getEmployeeAssessmentSkips(employeeId: string) {
    const r = await this.repo.findEmployeeAssessmentSkips(employeeId);
    if (!r.ok) return Ok({ skips: [] });
    return Ok({ skips: r.data });
  }

  async getSwapRequests(requestedBy?: string, status?: string) {
    const r = await this.repo.findSwapRequests(requestedBy, status);
    if (!r.ok) return Ok([]);
    return Ok(r.data);
  }

  async getSkillGap(employeeId: string) {
    const r = await this.repo.findSkillGap(employeeId);
    if (!r.ok) return Ok({ employeeId, skills: [], generatedAt: _time.now().toISOString() });
    return Ok({ employeeId, skills: r.data, generatedAt: _time.now().toISOString() });
  }

  async getEmployeeMentorships(employeeId: string) {
    const [mentor, mentee] = await Promise.all([
      this.repo.findMentorshipsAsMentor(employeeId),
      this.repo.findMentorshipsAsMentee(employeeId),
    ]);
    return Ok({
      asMentor: mentor.ok ? mentor.data : [],
      asMentee: mentee.ok ? mentee.data : [],
    });
  }

  async getEmployeeMesSummary(employeeId: string, months = 3) {
    const r = await this.repo.findMesProduction(employeeId, months);
    if (!r.ok) return Ok({ employeeId, months, totalProduced: 0, totalPlan: 0, records: [] });
    const data    = r.data;
    const total   = (Array.isArray(data) ? data : []).reduce((s, d) => s + Number(d['quantity'] ?? 0), 0);
    const plan    = (Array.isArray(data) ? data : []).reduce((s, d) => s + Number(d['plan_quantity'] ?? 0), 0);
    return Ok({ employeeId, months, totalProduced: total, totalPlan: plan, records: data });
  }

  async getEmployeeWmsSummary(employeeId: string) {
    const r = await this.repo.findWmsTransactions(employeeId);
    if (!r.ok) return Ok({ employeeId, totalOperations: 0, transactions: [] });
    return Ok({ employeeId, totalOperations: r.data.length, transactions: r.data });
  }
}
