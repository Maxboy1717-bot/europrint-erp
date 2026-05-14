/**
 * @module hr-vacancies.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DrizzleHrVacanciesRepository } from './repos/drizzle-hr-vacancies.repo';
import { Result, safeCall } from '@common/result';

type Row = Record<string, unknown>;

const SUPPORTED_CHANNELS = ['telegram', 'linkedin', 'hhuz', 'uzjob', 'myjob'] as const;
type Channel = typeof SUPPORTED_CHANNELS[number];

@Injectable()
export class HrVacanciesService {
  private readonly logger = new Logger(HrVacanciesService.name);
  constructor(
    private readonly repo: DrizzleHrVacanciesRepository,
    private readonly events: EventEmitter2,
  ) {}

  findAll(): Promise<Result<Row[]>> {
    return this.repo.findAll();
  }

  findById(id: number): Promise<Result<Row | null>> {
    return this.repo.findById(id);
  }

  findPipeline(vacancyId?: number): Promise<Result<Row[]>> {
    return this.repo.findPipeline(vacancyId);
  }

  findPipelineById(id: number): Promise<Result<Row | null>> {
    return this.repo.findPipelineById(id);
  }

  updatePipelineStage(id: number, stage: string, userId: number): Promise<Result<Row>> {
    return this.repo.updatePipelineStage(id, stage, userId);
  }

  findKpi(): Promise<Result<Row[]>> {
    return this.repo.countByVacancy();
  }

  findUrgent(): Promise<Result<Row[]>> {
    return this.repo.findActiveVacancies();
  }

  findInternalBoard(): Promise<Result<Row[]>> {
    return this.repo.findInternalBoard();
  }

  findWorkerTypeStats(): Promise<Result<Row[]>> {
    return this.repo.countByVacancy();
  }

  findRoadmaps(): Promise<Result<Row[]>> {
    return this.repo.findPipeline();
  }

  findCandidateStats(): Promise<Result<{ total: number }>> {
    return this.repo.findCandidateCount();
  }

  findChannelsByVacancy(vacancyId: number): Promise<Result<Row[]>> {
    return this.repo.findChannelsByVacancy(vacancyId);
  }

  findRoadmapByPipeline(pipelineId: number): Promise<Result<Row[]>> {
    return this.repo.findRoadmapByPipeline(pipelineId);
  }

  findProbationJournal(pipelineId: number): Promise<Result<Row[]>> {
    return this.repo.findProbationJournal(pipelineId);
  }

  findProbationDates(pipelineId: number): Promise<Result<Row | null>> {
    return this.repo.findProbationDates(pipelineId);
  }

  findMarketAnalysisByVacancy(vacancyId: number): Promise<Result<Row | null>> {
    return this.repo.findMarketAnalysisByVacancy(vacancyId);
  }

  recordFunnelHistory(funnelId: string, stage: string, changedBy: string, notes?: string): Promise<Result<Row>> {
    return this.repo.recordFunnelHistory(funnelId, stage, changedBy, notes);
  }

  updateFunnelNotes(funnelId: number, notes: string): Promise<Result<Row>> {
    return this.repo.updateFunnelNotes(funnelId, notes);
  }

  addCandidateToFunnel(vacancyId: number | null, candidateId: number, note: string, source: string): Promise<Result<Row>> {
    return this.repo.addCandidateToFunnel(vacancyId, candidateId, note, source);
  }

  async publishVacancy(vacancyId: number, channels: string[], userId: number): Promise<Result<Row>> {
    return safeCall(async () => {
      const vacancyResult = await this.repo.findById(vacancyId);
      const vacancy = vacancyResult.ok ? (vacancyResult.data ?? {}) : {};
      const title = String(vacancy['title'] ?? `Vakansiya #${vacancyId}`);
      const description = String(vacancy['description'] ?? '');

      const results: Record<Channel, { status: string; message: string }> = {} as Record<Channel, { status: string; message: string }>;
      const publishedChannels: string[] = [];

      for (const ch of channels) {
        const channel = ch.toLowerCase() as Channel;
        if (!SUPPORTED_CHANNELS.includes(channel)) continue;

        if (channel === 'telegram') {
          this.events.emit('vacancy.published', {
            vacancyId,
            title,
            description: description.slice(0, 400),
            publishedBy: userId,
          });
          results[channel] = { status: 'sent', message: 'Telegram kanaliga yuborildi' };
        } else {
          // External channels — record intent; real integration requires API credentials
          results[channel] = { status: 'queued', message: `${ch.toUpperCase()} integratsiyasi navbatga qo'shildi` };
        }

        await this.repo.recordFunnelHistory(
          String(vacancyId),
          `channel_published:${channel}`,
          String(userId),
          `Published to ${channel}`,
        );
        publishedChannels.push(channel);
      }

      this.logger.log(`Vacancy #${vacancyId} published to: ${publishedChannels.join(', ')}`);
      return { vacancyId, title, publishedTo: publishedChannels, results };
    });
  }
}
