/**
 * email.processor.ts — BullMQ 'email' navbat workeri.
 * SMTP orqali email yuborish (nodemailer).
 * concurrency: 3 — parallel 3 ta xabar yuborish mumkin.
 * Transporter lazily initialized and reused across jobs.
 */
import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { QUEUE_NAMES, backoffDelay } from '../queue.constants';

export interface EmailJobData {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  templateId?: string;
  variables?: Record<string, unknown>;
}

@Processor(QUEUE_NAMES.EMAIL, { concurrency: 3 })
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);
  private transporter: Transporter | null = null;

  constructor(private readonly cfg: ConfigService) {
    super();
  }

  async process(job: Job<EmailJobData>): Promise<void> {
    const delay = backoffDelay(job.attemptsMade);
    const recipient = Array.isArray(job.data.to) ? job.data.to.join(',') : job.data.to;
    this.logger.debug(
      `[email] Job #${job.id} — qabul: ${recipient}, urinish: ${job.attemptsMade}, backoff: ${delay}ms`,
    );

    try {
      await this.sendEmail(job.data);
      this.logger.log(`[email] Job #${job.id} muvaffaqiyatli yuborildi: ${recipient}`);
    } catch (err) {
      this.logger.error(`[email] Job #${job.id} xato: ${String(err)}`);
      throw err;
    }
  }

  private getTransporter(): Transporter {
    if (this.transporter) return this.transporter;

    const smtpHost = this.cfg.get<string>('SMTP_HOST');
    const smtpUser = this.cfg.get<string>('SMTP_USER');
    const smtpPass = this.cfg.get<string>('SMTP_PASS');

    if (!smtpHost || !smtpUser || !smtpPass) {
      throw new Error(
        '[email] SMTP sozlamalari yo\'q: SMTP_HOST, SMTP_USER, SMTP_PASS muhit o\'zgaruvchilari talab qilinadi',
      );
    }

    const smtpPort = Number(this.cfg.get<string>('SMTP_PORT') ?? '587');
    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
    });

    return this.transporter;
  }

  private async sendEmail(data: EmailJobData): Promise<void> {
    const fromAddress = this.cfg.get<string>('SMTP_FROM') ?? 'noreply@europrint.uz';
    const transport = this.getTransporter();
    const recipients = Array.isArray(data.to) ? data.to.join(',') : data.to;
    await transport.sendMail({
      from: `"EuroPrint ERP" <${fromAddress}>`,
      to: recipients,
      subject: data.subject,
      html: data.html,
      text: data.text,
    });
  }
}
