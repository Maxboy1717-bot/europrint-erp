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

export const QUEUE_LABELS: Record<string, string> = {
  payroll: "Maosh (Payroll)",
  mrp: "MRP",
  "gl-post": "GL Posting",
  notify: "Bildirishnomalar",
  ai: "AI Tahlil",
  reports: "Hisobotlar",
  "payroll-dlq": "Payroll DLQ",
};
