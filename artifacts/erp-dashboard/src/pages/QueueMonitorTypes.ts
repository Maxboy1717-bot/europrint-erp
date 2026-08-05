/**
 * @module QueueMonitorTypes
 * @description Interfaces, types, and constants for QueueMonitor.
 */

export interface QueueStat {
  available: boolean;
  reason?: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

export interface QueueStatusResponse {
  queues: Record<string, QueueStat>;
  redisEnabled: boolean;
}

export interface FailedJob {
  id: string;
  name: string;
  data: unknown;
  failedReason: string;
  attemptsMade: number;
  timestamp: number;
  finishedOn?: number;
}

export interface FailedJobsResponse {
  queue: string;
  total: number;
  jobs: FailedJob[];
}

// Item #118: labels referenced a fictitious queue-name set that never matched any real
// BullMQ queue in the backend — corrected to the 7 real queues (queue.constants.ts).
export const QUEUE_LABELS: Record<string, string> = {
  email: "Email",
  telegram: "Telegram",
  "pdf-generation": "PDF Generatsiya",
  "label-print": "Etiketka Chop Etish",
  "mrp-run": "MRP Qayta Hisoblash",
  "forecast-recalc": "Talab Bashorati",
  "kanban-cron": "Kanban Davriy Vazifalar",
};
