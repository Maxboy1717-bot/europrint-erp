/**
 * @module admin-queue.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { Ok, Result, AppError } from '@common/result';

const QUEUE_NAMES = ['email', 'sms', 'report', 'sync'] as const;
type QueueName = typeof QUEUE_NAMES[number];

function mockQueueStats(name: QueueName) {
  return { name, waiting: 0, active: 0, completed: 100, failed: 0, delayed: 0, paused: false };
}

@Injectable()
export class AdminQueueService {

  getStatus(): Result<object, AppError> {
    return Ok({ queues: QUEUE_NAMES.map(mockQueueStats), updatedAt: _time.now().toISOString() });
  }

  getAllFailed() {
    return { queues: QUEUE_NAMES.map((n) => ({ queue: n, failedJobs: [] })), total: 0 };
  }

  getFailedByQueue(queue: string) {
    return { queue, failedJobs: [], total: 0 };
  }

  retryJob(queue: string, jobId: string) {
    return { queue, jobId, status: 'retried', retriedAt: _time.now().toISOString() };
  }
}
