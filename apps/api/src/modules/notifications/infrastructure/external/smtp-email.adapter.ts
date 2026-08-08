/**
 * @module smtp-email.adapter
 * @description Infrastructure adapter for transactional email. Implements the
 *   domain `IEmailSender` port using nodemailer + an SMTP relay (host/port/
 *   credentials from ConfigService). When SMTP env is unset `send()` returns
 *   an `Err(EXTERNAL_SERVICE)` — the caller must see delivery as failed
 *   (`sent:false`), not a fabricated success (Q-40 fake-success ban).
 *
 *   Each SMTP attempt is wrapped in `withRetry` (P2-23): 3 attempts with
 *   exponential backoff 100ms / 300ms / 1000ms and a 30s timeout per
 *   attempt. On final failure we map to `EXTERNAL_TIMEOUT` or `EXTERNAL_5XX`.
 *
 *   Moved from `domain/services/email-notification.service.ts` — the
 *   nodemailer dynamic import is infrastructure, not domain logic.
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Result, Ok, Err, AppErr } from '@common/result';
import { withRetry, classifyRetryError } from '@common/retry/with-retry';
import { IEmailSender, EmailOptions } from '../../domain/ports/i-email-sender.port';

@Injectable()
export class SmtpEmailAdapter implements IEmailSender {
  private readonly logger = new Logger(SmtpEmailAdapter.name);

  private readonly smtpHost: string | undefined;
  private readonly smtpPort: number;
  private readonly smtpUser: string | undefined;
  private readonly smtpPass: string | undefined;
  private readonly fromAddress: string;
  private readonly frontendUrl: string;

  constructor(private readonly cfg: ConfigService) {
    this.smtpHost    = this.cfg.get<string>('SMTP_HOST');
    this.smtpPort    = Number(this.cfg.get<string>('SMTP_PORT') ?? '587');
    this.smtpUser    = this.cfg.get<string>('SMTP_USER');
    this.smtpPass    = this.cfg.get<string>('SMTP_PASS');
    this.fromAddress = this.cfg.get<string>('SMTP_FROM') ?? 'noreply@europrint.uz';
    this.frontendUrl = this.cfg.get<string>('FRONTEND_URL') ?? 'https://europrint.uz';
  }

  async send(options: EmailOptions): Promise<Result<void>> {
    if (!this.smtpHost || !this.smtpUser || !this.smtpPass) {
      this.logger.warn('SMTP sozlamalari yo\'q — email yuborilmadi');
      return Err(AppErr('EXTERNAL_SERVICE', 'Email provider sozlanmagan (SMTP_HOST/SMTP_USER/SMTP_PASS yo\'q)'));
    }

    const nodemailer = await import('nodemailer').catch((): null => null);
    if (!nodemailer) return Err('nodemailer yuklanmadi');

    const transporter = nodemailer.createTransport({
      host: this.smtpHost,
      port: this.smtpPort,
      secure: this.smtpPort === 465,
      auth: { user: this.smtpUser, pass: this.smtpPass },
    });

    try {
      await withRetry<void>(async () => {
        await transporter.sendMail({
          from: `"EuroPrint ERP" <${this.fromAddress}>`,
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text,
          attachments: options.attachments?.map((a) => ({
            filename: a.filename,
            content: a.content,
            contentType: a.contentType,
          })),
        });
      });
    } catch (err) {
      const code = classifyRetryError(err);
      const msg  = err instanceof Error ? err.message : String(err);
      this.logger.error(`Email yuborishda xatolik (${code}): ${options.to} — ${msg}`);
      return Err(AppErr(code, `SMTP xatolik: ${msg}`));
    }

    this.logger.log(`Email yuborildi: ${options.to}`);
    return Ok(undefined);
  }

  async sendNotification(
    to: string,
    title: string,
    message: string,
    link?: string,
  ): Promise<Result<void>> {
    const html = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #1a1a2e; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="color: #ff5d2e; margin: 0; font-size: 24px;">EuroPrint ERP</h1>
        </div>
        <div style="background: #fff; border: 1px solid #e5e7eb; padding: 24px; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1a1a2e; margin-top: 0;">${title}</h2>
          <p style="color: #374151; line-height: 1.6;">${message}</p>
          ${
            link
              ? `<a href="${this.frontendUrl}${link}"
                   style="display: inline-block; background: #ff5d2e; color: white;
                          padding: 12px 24px; border-radius: 6px; text-decoration: none;
                          margin-top: 16px;">Ko'rish →</a>`
              : ''
          }
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin-top: 24px;" />
          <p style="color: #9ca3af; font-size: 12px; margin-bottom: 0;">
            EuroPrint LLC • Ushbu xabar avtomatik yuborilgan
          </p>
        </div>
      </body>
      </html>
    `;

    return this.send({ to, subject: title, html });
  }
}
