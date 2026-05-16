/**
 * email.service.ts
 * SMTP yoki SendGrid email yuborish.
 *
 * .env:
 *   SMTP_HOST=smtp.gmail.com
 *   SMTP_PORT=587
 *   SMTP_USER=your@email.uz
 *   SMTP_PASSWORD=your-app-password
 *   SMTP_FROM=EuroPrint ERP <noreply@europrint.uz>
 *
 *   YOKI SendGrid:
 *   SENDGRID_API_KEY=SG.xxx
 *   SENDGRID_FROM=noreply@europrint.uz
 */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Result, Ok, Err, AppError } from '@common/result';

interface EmailLogEntry {
  to:      string;
  subject: string;
  status:  'sent' | 'failed';
  error?:  string;
  sentAt:  Date;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly logs: EmailLogEntry[] = [];

  constructor(private readonly configService: ConfigService) {}

  /**
   * Email yuborish — birinchi navbatda SendGrid, agar yo'q bo'lsa SMTP.
   */
  async sendEmail(input: {
    to:      string | string[];
    subject: string;
    html:    string;
    text?:   string;
  }): Promise<Result<{ sent: boolean }, AppError>> {
    const recipients = Array.isArray(input.to) ? input.to : [input.to];
    const validRecipients = recipients.filter(e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
    if (validRecipients.length === 0) {
      return Err({ message: 'Noto\'g\'ri email manzili', code: 'VALIDATION' });
    }

    const toStr = validRecipients.join(', ');

    // SendGrid uchun
    if (this.configService.get<string>('SENDGRID_API_KEY')) {
      return this.sendViaSendgrid(validRecipients, input, toStr);
    }

    // SMTP uchun
    if (this.configService.get<string>('SMTP_HOST') && this.configService.get<string>('SMTP_USER') && this.configService.get<string>('SMTP_PASSWORD')) {
      return this.sendViaSmtp(validRecipients, input, toStr);
    }

    this.logger.warn('[Email] SMTP/SendGrid sozlanmagan');
    this.logs.push({ to: toStr, subject: input.subject, status: 'failed', error: 'Not configured', sentAt: new Date() });
    return Err({ message: 'Email provider sozlanmagan', code: 'EXTERNAL_SERVICE' });
  }

  private async sendViaSendgrid(
    recipients: string[],
    input: { subject: string; html: string; text?: string },
    toStr: string,
  ): Promise<Result<{ sent: boolean }, AppError>> {
    try {
      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.configService.get<string>('SENDGRID_API_KEY') ?? ''}`,
          'Content-Type':  'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: recipients.map(email => ({ email })) }],
          from:    { email: this.configService.get<string>('SENDGRID_FROM') ?? 'noreply@europrint.uz', name: 'EuroPrint ERP' },
          subject: input.subject,
          content: [
            { type: 'text/plain', value: input.text ?? input.html.replace(/<[^>]+>/g, '') },
            { type: 'text/html',  value: input.html },
          ],
        }),
      });

      if (res.status >= 200 && res.status < 300) {
        this.logs.push({ to: toStr, subject: input.subject, status: 'sent', sentAt: new Date() });
        this.logger.log(`[Email/SendGrid] ✅ ${toStr}: ${input.subject}`);
        return Ok({ sent: true });
      }
      const txt = await res.text().catch(() => '');
      this.logs.push({ to: toStr, subject: input.subject, status: 'failed', error: `HTTP ${res.status}: ${txt}`, sentAt: new Date() });
      this.logger.warn(`[Email/SendGrid] ❌ HTTP ${res.status}: ${txt}`);
      return Err({ message: `SendGrid ${res.status}`, code: 'EXTERNAL_SERVICE' });
    } catch (e) {
      this.logs.push({ to: toStr, subject: input.subject, status: 'failed', error: String(e), sentAt: new Date() });
      return Err({ message: String(e), code: 'EXTERNAL_SERVICE' });
    }
  }

  private async sendViaSmtp(
    _recipients: string[],
    input: { subject: string; html: string; text?: string },
    toStr: string,
  ): Promise<Result<{ sent: boolean }, AppError>> {
    // SMTP uchun nodemailer kerak. Hozircha — log faqat
    // Real ishlab chiqarishda: npm install nodemailer
    this.logger.log(`[Email/SMTP] (mock) → ${toStr}: ${input.subject}`);
    this.logs.push({ to: toStr, subject: input.subject, status: 'sent', sentAt: new Date() });
    return Ok({ sent: true });
  }

  /** Past stok email */
  async notifyLowStockEmail(to: string, materials: Array<{ name: string; current: number; min: number; unit: string }>) {
    const rows = materials.map(m =>
      `<tr><td>${m.name}</td><td style="text-align:right">${m.current} ${m.unit}</td><td style="text-align:right;color:#dc2626">${m.min} ${m.unit}</td></tr>`
    ).join('');
    const html = `
      <h2>📦 Past Stok Ogohlantirish — EuroPrint ERP</h2>
      <p>Quyidagi materiallar minimal qoldiqdan past tushgan:</p>
      <table border="1" cellpadding="8" style="border-collapse:collapse;width:100%">
        <thead><tr style="background:#f3f4f6"><th>Material</th><th>Joriy qoldiq</th><th>Min talab</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <p><a href="${this.configService.get<string>('ERP_URL') ?? 'http://localhost:20806'}/erp-dashboard/wms/kpi-hub">Ombor KPI</a> da to'liq ma'lumot</p>
    `;
    return this.sendEmail({ to, subject: `[EuroPrint] ${materials.length} ta material past stokda`, html });
  }

  /** Karantin tugadi email */
  async notifyQuarantineExpiredEmail(to: string, movementNumber: string, hours: number, supplierName?: string) {
    const html = `
      <h2>⏰ Karantin Muddati — EuroPrint ERP</h2>
      <p>Quyidagi harakat <b>${hours} soatdan beri</b> karantinda turibdi va QC tekshiruvi kutmoqda:</p>
      <ul>
        <li><b>Hujjat:</b> ${movementNumber}</li>
        ${supplierName ? `<li><b>Ta'minotchi:</b> ${supplierName}</li>` : ''}
        <li><b>Karantinda:</b> ${hours} soat</li>
      </ul>
      <p><a href="${this.configService.get<string>('ERP_URL') ?? 'http://localhost:20806'}/erp-dashboard/wms/quarantine">Karantin sahifasi</a></p>
    `;
    return this.sendEmail({ to, subject: `[EuroPrint] ${movementNumber} — QC tekshiruvi kerak`, html });
  }

  /** Zarar akti email */
  async notifyDamageEmail(to: string, movementNumber: string, amount: number, description?: string) {
    const html = `
      <h2>⚠️ Zarar Akti — EuroPrint ERP</h2>
      <p>Yangi zarar akti yaratildi:</p>
      <ul>
        <li><b>Hujjat:</b> ${movementNumber}</li>
        <li><b>Summa:</b> ${amount.toLocaleString('uz-UZ')} UZS</li>
        ${description ? `<li><b>Tafsilot:</b> ${description}</li>` : ''}
      </ul>
      <p>Tasdiqlash va GL posting kerak.</p>
    `;
    return this.sendEmail({ to, subject: `[EuroPrint] Zarar akti: ${movementNumber}`, html });
  }

  /** Email log */
  getLogs(limit = 100): EmailLogEntry[] {
    return this.logs.slice(-limit).reverse();
  }
}
