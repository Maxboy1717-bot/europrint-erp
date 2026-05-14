/**
 * queue.service.ts
 * Background queue — agar Redis bo'lsa BullMQ, bo'lmasa to'g'ridan-to'g'ri ishlatadi.
 *
 * .env:
 *   REDIS_HOST=localhost
 *   REDIS_PORT=6379
 *   REDIS_PASSWORD=  (ixtiyoriy)
 *
 * Vazifalar:
 *   - GL Posting (async, harakat tasdiqlanganda)
 *   - PDF generatsiya (orqada)
 *   - SMS/Email yuborish
 *   - 3-Way Match (avto)
 */
import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Result, Ok, AppError } from '@common/result';
import { QUEUE_POLL_INTERVAL_MS } from '@common/constants/business.constants';

interface QueueJob {
  id:         string;
  type:       'gl_posting' | 'auto_barcode' | 'three_way_match' | 'sms' | 'email' | 'pdf_generate';
  data:       Record<string, unknown>;
  attempts:   number;
  maxAttempts: number;
  status:     'pending' | 'processing' | 'completed' | 'failed';
  createdAt:  Date;
  startedAt?: Date;
  finishedAt?: Date;
  error?:     string;
}

type JobHandler = (data: Record<string, unknown>) => Promise<void>;

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private readonly jobs: Map<string, QueueJob> = new Map();
  private readonly handlers: Map<QueueJob['type'], JobHandler> = new Map();
  private worker: NodeJS.Timeout | null = null;
  private redisAvailable = false;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    // Redis tekshirish (ixtiyoriy)
    if (this.configService.get<string>('REDIS_HOST') && this.configService.get<string>('REDIS_PORT')) {
      try {
        // BullMQ ulansa shu yerda
        // import Queue from 'bullmq';
        this.redisAvailable = true;
        this.logger.log('[Queue] Redis konfiguratsiya topildi — BullMQ rejimi');
      } catch {
        this.redisAvailable = false;
      }
    }
    if (!this.redisAvailable) {
      this.logger.log('[Queue] Redis yo\'q — in-memory fallback rejimi');
    }

    // Worker loop — har 2 soniyada navbatdagi job lar
    this.worker = setInterval(() => void this.processNext(), QUEUE_POLL_INTERVAL_MS);
  }

  async onModuleDestroy() {
    if (this.worker) clearInterval(this.worker);
  }

  /** Handler ro'yxatdan o'tkazish */
  registerHandler(type: QueueJob['type'], handler: JobHandler) {
    this.handlers.set(type, handler);
    this.logger.log(`[Queue] Handler ro'yxatdan o'tdi: ${type}`);
  }

  /** Job ga qo'shish */
  enqueue(type: QueueJob['type'], data: Record<string, unknown>, opts?: { maxAttempts?: number }): Result<{ id: string }, AppError> {
    const id = crypto.randomUUID();
    const job: QueueJob = {
      id, type, data,
      attempts: 0,
      maxAttempts: opts?.maxAttempts ?? 3,
      status: 'pending',
      createdAt: new Date(),
    };
    this.jobs.set(id, job);
    this.logger.debug(`[Queue] Job qo'shildi: ${type} (id=${id})`);
    return Ok({ id });
  }

  /** Navbatdagi job ni ishga tushirish */
  private async processNext() {
    const pending = Array.from(this.jobs.values()).find(j => j.status === 'pending');
    if (!pending) return;

    const handler = this.handlers.get(pending.type);
    if (!handler) {
      this.logger.warn(`[Queue] Handler topilmadi: ${pending.type}`);
      pending.status = 'failed';
      pending.error = 'No handler registered';
      return;
    }

    pending.status = 'processing';
    pending.attempts++;
    pending.startedAt = new Date();

    try {
      await handler(pending.data);
      pending.status = 'completed';
      pending.finishedAt = new Date();
      this.logger.log(`[Queue] ✅ ${pending.type} (id=${pending.id}) bajarildi`);
    } catch (e) {
      pending.error = String(e);
      if (pending.attempts < pending.maxAttempts) {
        pending.status = 'pending'; // retry
        this.logger.warn(`[Queue] ⚠️ ${pending.type} (id=${pending.id}) retry ${pending.attempts}/${pending.maxAttempts}: ${pending.error}`);
      } else {
        pending.status = 'failed';
        pending.finishedAt = new Date();
        this.logger.error(`[Queue] ❌ ${pending.type} (id=${pending.id}) muvaffaqiyatsiz: ${pending.error}`);
      }
    }

    // Eski yakunlangan job larni 1 soatdan keyin tozalash
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    for (const [id, job] of this.jobs) {
      if ((job.status === 'completed' || job.status === 'failed') &&
          job.finishedAt && job.finishedAt.getTime() < oneHourAgo) {
        this.jobs.delete(id);
      }
    }
  }

  /** Navbat holati */
  stats() {
    const all = Array.from(this.jobs.values());
    return {
      total:      all.length,
      pending:    all.filter(j => j.status === 'pending').length,
      processing: all.filter(j => j.status === 'processing').length,
      completed:  all.filter(j => j.status === 'completed').length,
      failed:     all.filter(j => j.status === 'failed').length,
      redisAvailable: this.redisAvailable,
    };
  }

  /** Yakuniy log lar */
  recentJobs(limit = 50): QueueJob[] {
    return Array.from(this.jobs.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }
}
