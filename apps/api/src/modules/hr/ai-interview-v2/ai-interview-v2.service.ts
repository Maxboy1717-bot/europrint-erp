/**
 * @module ai-interview-v2.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { HrV2Events } from '../events/hr-v2-events';
import { randomBytes } from 'crypto';
import { Result, safeCall, Ok } from '@common/result';
import { AiInterviewV2Repository } from './ai-interview-v2.repository';
import { aiInterviewGetQuestionsForJob, aiInterviewListQuestions, aiInterviewCreateQuestion, aiInterviewDeleteQuestion } from './ai-interview-v2-questions.helper';

import { MS_PER_DAY } from '@common/constants/app.constants';
@Injectable()
export class AiInterviewV2Service {
  private readonly logger = new Logger(AiInterviewV2Service.name);

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly repo: AiInterviewV2Repository,
    private readonly cfg: ConfigService,
  ) {}

  async createSession(dto: {
    candidateId?: number;
    vacancyId?: number;
    candidateName: string;
    candidateLanguage?: string;
    scheduledAt?: string;
    createdBy: number;
  }) {
    return safeCall(async () => {
      this.logger.log(`AI intervyu sessiyasi yaratilmoqda: "${dto.candidateName}" (vacancyId=${dto.vacancyId ?? 'none'})`);
      const token = randomBytes(16).toString('hex');
      const expiresAt = new Date(Date.now() + MS_PER_DAY).toISOString();
      const baseUrl = this.cfg.get<string>('ERP_BASE_URL') || this.cfg.get<string>('FRONTEND_URL') || 'https://erp.europrint.uz';

      const rowResult = await this.repo.createSession({
        token,
        expiresAt,
        candidateName: dto.candidateName,
        candidateLanguage: dto.candidateLanguage || 'uz',
        candidateId: dto.candidateId,
        vacancyId: dto.vacancyId,
        createdBy: dto.createdBy,
      });
      if (!rowResult.ok) throw new Error(rowResult.error.message);
      const row = rowResult.data as Record<string, unknown>;

      return { ...row, interview_link: `${baseUrl}/ai-interview/${token}`, expires_at: expiresAt };
    });
  }

  async validateToken(token: string) {
    return safeCall(async () => {
      const sessionResult = await this.repo.findSessionByToken(token);
      if (!sessionResult.ok) throw new Error(sessionResult.error.message);
      if (!sessionResult.data) return { valid: false, error: 'Session not found' };
      const session = sessionResult.data as Record<string, unknown>;

      const now = _time.now();
      const expires = new Date(session['expires_at'] as string);
      if (now > expires) {
        await this.repo.markSessionExpired(token);
        return { valid: false, error: 'Link expired' };
      }

      if (session['status'] === 'completed') return { valid: false, error: 'Interview already completed' };
      if (session['status'] === 'cancelled') return { valid: false, error: 'Interview cancelled' };

      return {
        valid: true,
        session_id: session['id'] as number,
        candidate_name: session['candidate_name'] as string,
        candidate_language: session['candidate_language'] as string,
        job_title: session['job_title'] as string | undefined,
        status: session['status'] as string,
        expires_at: session['expires_at'],
        camera_rejections: (session['camera_rejections'] as number) || 0,
      };
    });
  }

  async startSession(sessionId: number) {
    return safeCall(async () => {
      const rowResult = await this.repo.startSession(sessionId);
      if (!rowResult.ok) throw new Error(rowResult.error.message);
      const row = rowResult.data as Record<string, unknown>;
      this.eventEmitter.emit(HrV2Events.AI_INTERVIEW_STARTED, {
        sessionId,
        candidateName: row['candidate_name'],
      });
      return row;
    });
  }

  async completeSession(sessionId: number, results: {
    communicationScore?: number; confidenceScore?: number; problemSolvingScore?: number;
    bodyLanguageScore?: number; emotionalStateScore?: number; professionalAppearanceScore?: number;
    overallScore?: number; recommendation?: string; aiSummary?: string; transcript?: string;
  }) {
    return safeCall(async () => {
      const rowResult = await this.repo.completeSession(sessionId, results);
      if (!rowResult.ok) throw new Error(rowResult.error.message);
      this.eventEmitter.emit(HrV2Events.AI_INTERVIEW_COMPLETED, {
        sessionId,
        recommendation: results.recommendation,
      });
      return rowResult.data;
    });
  }

  async cancelSession(sessionId: number, reason: string) {
    return this.repo.cancelSession(sessionId, reason);
  }

  /**
   * Public token-based submit — packages the raw candidate answers into the
   * service-internal result shape (transcript, ai summary, default
   * recommendation) so the controller only forwards `{ token, answers }`.
   * Rule 6: keeps array-iteration and template-string assembly out of
   * the HTTP layer.
   */
  async submitPublicAnswers(token: string, answers: readonly string[]) {
    return safeCall(async () => {
      const validationResult = await this.validateToken(token);
      if (!validationResult.ok) throw new Error(validationResult.error.message);
      const validation = validationResult.data;
      if (!validation?.valid) throw new Error('Validation failed');
      const sessionId = validation.session_id ?? 0;
      const safeAnswers = Array.isArray(answers) ? answers : [];
      const transcript = safeAnswers.map((a, i) => `Q${i + 1}: ${a}`).join('\n');
      const aiSummary = `Submitted ${safeAnswers.length} answers`;
      const r = await this.completeSession(sessionId, {
        aiSummary,
        transcript,
        recommendation: 'CONSIDER',
      });
      if (!r.ok) throw new Error(r.error.message);
      return { submitted: true };
    });
  }

  async getQuestionsForJob(jobTitle?: string, language: string = 'uz') {
    return aiInterviewGetQuestionsForJob(jobTitle, language);
  }

  async reportCameraRejection(token: string): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const sessionResult = await this.repo.findSessionForCameraReport(token);
      if (!sessionResult.ok) throw new Error(sessionResult.error.message);
      if (!sessionResult.data) return { cancelled: false, rejections: 0 };
      const session = sessionResult.data as Record<string, unknown>;

      if (session['status'] === 'cancelled' || session['status'] === 'completed') {
        return { cancelled: false, rejections: 0 };
      }

      const newCount = ((session['camera_rejections'] as number) || 0) + 1;

      if (newCount >= 3) {
        await this.repo.cancelByCameraRejection(token, newCount);
        this.eventEmitter.emit(HrV2Events.AI_INTERVIEW_CANCELLED, {
          sessionId: session['id'],
          reason: 'camera_rejected_3_times',
        });
        return { cancelled: true, rejections: newCount };
      }

      await this.repo.updateCameraRejectionCount(token, newCount);
      return { cancelled: false, rejections: newCount };
    });
  }

  async listQuestions(jobTitle?: string) { return aiInterviewListQuestions(jobTitle); }

  async createQuestion(dto: {
    jobTitle?: string; question: string; questionUz?: string; questionRu?: string;
    questionEn?: string; category?: string; difficulty?: string;
    expectedKeywords?: string; maxScore?: number; createdBy?: number;
  }) { return aiInterviewCreateQuestion(dto); }

  async deleteQuestion(id: number) { return aiInterviewDeleteQuestion(id); }

  async listSessions(status?: string) {
    const r = await safeCall(async () => {
      const rowsResult = await this.repo.listSessions();
      if (!rowsResult.ok) throw new Error(rowsResult.error.message);
      const rows = rowsResult.data as Array<Record<string, unknown>>;
      return status ? (Array.isArray(rows) ? rows : []).filter(row => row['status'] === status) : rows;
    });
    if (!r.ok) { this.logger.warn(`listSessions: ${r.error.message}`); return Ok([]); }
    return r;
  }

  async getSession(id: number) {
    return this.repo.getSession(id);
  }

  async getPipelineStats() {
    const r = await this.repo.getPipelineStats();
    if (!r.ok) { this.logger.warn(`getPipelineStats: ${r.error.message}`); return Ok({ pending_count: 0, active_count: 0, completed_count: 0, expired_count: 0, today_count: 0 }); }
    return r;
  }
}
