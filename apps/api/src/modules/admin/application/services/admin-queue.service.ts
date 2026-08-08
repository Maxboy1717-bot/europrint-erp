/**
 * @module admin-queue.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, Job } from 'bullmq';
import { Ok, Err, Result, AppError, AppErr } from '@common/result';
import { QUEUE_NAMES } from '../../../queue/queue.constants';
import { ADMIN_QUEUE_FAILED_JOBS_PAGE_SIZE, ADMIN_QUEUE_CLEAN_LIMIT } from '@common/constants/business.constants';

export interface QueueStatEntry {
  available: boolean;
  reason?: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

export interface FailedJobRow {
  id: string;
  name: string;
  data: unknown;
  failedReason: string;
  attemptsMade: number;
  timestamp: number;
  finishedOn?: number;
}

@Injectable()
export class AdminQueueService {
  private readonly queueMap: Map<string, Queue>;

  constructor(
    @InjectQueue(QUEUE_NAMES.EMAIL) private readonly emailQueue: Queue,
    @InjectQueue(QUEUE_NAMES.TELEGRAM) private readonly telegramQueue: Queue,
    @InjectQueue(QUEUE_NAMES.PDF_GENERATION) private readonly pdfQueue: Queue,
    @InjectQueue(QUEUE_NAMES.LABEL_PRINT) private readonly labelPrintQueue: Queue,
    @InjectQueue(QUEUE_NAMES.MRP_RUN) private readonly mrpQueue: Queue,
    @InjectQueue(QUEUE_NAMES.FORECAST_RECALC) private readonly forecastQueue: Queue,
    @InjectQueue(QUEUE_NAMES.KANBAN_CRON) private readonly kanbanCronQueue: Queue,
  ) {
    this.queueMap = new Map<string, Queue>([
      [QUEUE_NAMES.EMAIL, this.emailQueue],
      [QUEUE_NAMES.TELEGRAM, this.telegramQueue],
      [QUEUE_NAMES.PDF_GENERATION, this.pdfQueue],
      [QUEUE_NAMES.LABEL_PRINT, this.labelPrintQueue],
      [QUEUE_NAMES.MRP_RUN, this.mrpQueue],
      [QUEUE_NAMES.FORECAST_RECALC, this.forecastQueue],
      [QUEUE_NAMES.KANBAN_CRON, this.kanbanCronQueue],
    ]);
  }

  async getStatus(): Promise<Result<{ queues: Record<string, QueueStatEntry>; redisEnabled: boolean; updatedAt: string }, AppError>> {
    const queues: Record<string, QueueStatEntry> = {};
    let anyAvailable = false;
    for (const [name, queue] of this.queueMap) {
      try {
        const counts = await queue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed');
        queues[name] = {
          available: true,
          waiting: counts.waiting ?? 0,
          active: counts.active ?? 0,
          completed: counts.completed ?? 0,
          failed: counts.failed ?? 0,
          delayed: counts.delayed ?? 0,
        };
        anyAvailable = true;
      } catch (e) {
        queues[name] = {
          available: false,
          reason: e instanceof Error ? e.message : "Redis ulanmadi",
          waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0,
        };
      }
    }
    return Ok({ queues, redisEnabled: anyAvailable, updatedAt: _time.now().toISOString() });
  }

  private async mapFailedJobs(queue: Queue): Promise<{ total: number; jobs: FailedJobRow[] }> {
    const [jobs, total] = await Promise.all([
      queue.getFailed(0, ADMIN_QUEUE_FAILED_JOBS_PAGE_SIZE - 1),
      queue.getFailedCount(),
    ]);
    return {
      total,
      jobs: jobs.map((job: Job) => ({
        id: job.id ?? '',
        name: job.name,
        data: job.data,
        failedReason: job.failedReason ?? '',
        attemptsMade: job.attemptsMade,
        timestamp: job.timestamp,
        finishedOn: job.finishedOn,
      })),
    };
  }

  async getAllFailed(): Promise<Result<{ queues: Array<{ queue: string; total: number; jobs: FailedJobRow[] }> }, AppError>> {
    try {
      const results = [];
      for (const [name, queue] of this.queueMap) {
        const { total, jobs } = await this.mapFailedJobs(queue);
        results.push({ queue: name, total, jobs });
      }
      return Ok({ queues: results });
    } catch (e) {
      return Err(AppErr('INTERNAL', e instanceof Error ? e.message : String(e)));
    }
  }

  async getFailedByQueue(queueName: string): Promise<Result<{ queue: string; total: number; jobs: FailedJobRow[] }, AppError>> {
    const queue = this.queueMap.get(queueName);
    if (!queue) return Err(AppErr('NOT_FOUND', `Navbat topilmadi: ${queueName}`));
    try {
      const { total, jobs } = await this.mapFailedJobs(queue);
      return Ok({ queue: queueName, total, jobs });
    } catch (e) {
      return Err(AppErr('INTERNAL', e instanceof Error ? e.message : String(e)));
    }
  }

  async retryJob(queueName: string, jobId: string): Promise<Result<{ queue: string; jobId: string; status: string }, AppError>> {
    const queue = this.queueMap.get(queueName);
    if (!queue) return Err(AppErr('NOT_FOUND', `Navbat topilmadi: ${queueName}`));
    try {
      const job = await queue.getJob(jobId);
      if (!job) return Err(AppErr('NOT_FOUND', `Job topilmadi: ${jobId}`));
      await job.retry();
      return Ok({ queue: queueName, jobId, status: 'retried' });
    } catch (e) {
      return Err(AppErr('INTERNAL', e instanceof Error ? e.message : String(e)));
    }
  }

  async clearFailedJobs(queueName: string): Promise<Result<{ queue: string; cleared: number }, AppError>> {
    const queue = this.queueMap.get(queueName);
    if (!queue) return Err(AppErr('NOT_FOUND', `Navbat topilmadi: ${queueName}`));
    try {
      const removedIds = await queue.clean(0, ADMIN_QUEUE_CLEAN_LIMIT, 'failed');
      return Ok({ queue: queueName, cleared: removedIds.length });
    } catch (e) {
      return Err(AppErr('INTERNAL', e instanceof Error ? e.message : String(e)));
    }
  }
}
