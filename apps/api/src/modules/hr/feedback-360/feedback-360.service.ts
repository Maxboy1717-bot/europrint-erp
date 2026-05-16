/**
 * @module feedback-360.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 *
 * Merged into hr module (PA3-17 Wave 3): originally lived in `modules/feedback-360/`.
 */

import { Injectable, Logger } from '@nestjs/common';
import { Feedback360Repository } from './feedback-360.repo';
import { safeCall, Result, AppError } from '@common/result';

@Injectable()
export class Feedback360Service {
  private readonly logger = new Logger(Feedback360Service.name);

  constructor(private readonly repo: Feedback360Repository) {}

  async getAssessments(employeeId: number | undefined, year: number | undefined, limit: number, offset: number): Promise<Result<object, AppError>> {
    return safeCall(async () => {
    const r = await this.repo.findAssessments(employeeId, year, limit, offset);
    if (!r.ok) { this.logger.error('getAssessments failed', r.error); return { items: [], total: 0 }; }
    return { items: r.data, total: r.data.length };

    });}

  async getResponses(assessmentId: number | undefined, limit: number, offset: number){
    return safeCall(async () => {
    const r = await this.repo.findResponses(assessmentId, limit, offset);
    if (!r.ok) { this.logger.error('getResponses failed', r.error); return { items: [], total: 0 }; }
    return { items: r.data, total: r.data.length };

    });}

  async getDashboard(){
    return safeCall(async () => {
    const r = await this.repo.getDashboardStats();
    if (!r.ok) {
      this.logger.error('getDashboard failed', r.error);
      return { totalAssessments: 0, completed: 0, draft: 0, avgRating: 0, totalResponses: 0 };
    }
    const d = r.data;
    return {
      totalAssessments: Number(d['total_assessments']) || 0,
      completed:        Number(d['completed'])         || 0,
      draft:            Number(d['draft'])             || 0,
      avgRating:        Number(d['avg_rating'])        || 0,
      totalResponses:   Number(d['total_responses'])   || 0,
    };

    });}
}
