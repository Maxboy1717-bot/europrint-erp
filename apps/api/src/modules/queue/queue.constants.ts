/**
 * queue.constants.ts — TZ-60: BullMQ navbat nomlari va backoff formulasi.
 * Alohida fayl — queue.module.ts <→ processor.ts aylanma importini oldini oladi.
 */

export const QUEUE_NAMES = {
  EMAIL:            'email',
  TELEGRAM:         'telegram',
  PDF_GENERATION:   'pdf-generation',
  LABEL_PRINT:      'label-print',
  MRP_RUN:          'mrp-run',
  FORECAST_RECALC:  'forecast-recalc',
} as const;

export type QueueName = typeof QUEUE_NAMES[keyof typeof QUEUE_NAMES];

/**
 * Exponential backoff t_n hisoblash.
 * t_n = min(t_max, t_0 × 2^n + jitter)
 * t_0=1000ms, t_max=1800000ms=30min
 */
export function backoffDelay(attempt: number, t0 = 1000, tMax = 1_800_000): number {
  const jitter = Math.floor(Math.random() * t0);
  return Math.min(tMax, t0 * Math.pow(2, attempt) + jitter);
}
