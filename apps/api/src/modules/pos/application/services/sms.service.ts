/**
 * sms.service.ts
 * Eskiz.uz SMS provider integratsiya.
 *
 * .env:
 *   ESKIZ_EMAIL=your@email.uz
 *   ESKIZ_PASSWORD=your-password
 *   ESKIZ_FROM=4546  (Eskiz nick)
 *
 * Token avtomatik olinadi va 29 kun saqlanadi (xotirada).
 */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Result, Ok, Err, AppError } from '@common/result';

const ESKIZ_BASE = 'https://notify.eskiz.uz/api';

interface SmsLogEntry {
  phone:    string;
  text:     string;
  status:   'sent' | 'failed';
  response: string;
  sentAt:   Date;
}

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private token: string | null = null;
  private tokenExpiry: Date | null = null;
  private readonly logs: SmsLogEntry[] = [];

  constructor(private readonly configService: ConfigService) {}

  private get config() {
    return {
      email:    this.configService.get<string>('ESKIZ_EMAIL'),
      password: this.configService.get<string>('ESKIZ_PASSWORD'),
      from:     this.configService.get<string>('ESKIZ_FROM') ?? '4546',
    };
  }

  private async getToken(): Promise<string | null> {
    // Token mavjud va eski emas
    if (this.token && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.token;
    }

    const { email, password } = this.config;
    if (!email || !password) {
      this.logger.warn('[SMS] ESKIZ_EMAIL/ESKIZ_PASSWORD .env da sozlanmagan');
      return null;
    }

    try {
      const res = await fetch(`${ESKIZ_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ email, password }).toString(),
      });
      const data = await res.json() as { data?: { token: string }; message?: string };
      if (!data?.data?.token) {
        this.logger.error(`[SMS] Token olinmadi: ${data?.message ?? 'unknown'}`);
        return null;
      }
      this.token = data.data.token;
      this.tokenExpiry = new Date(Date.now() + 29 * 24 * 60 * 60 * 1000);
      this.logger.log('[SMS] Eskiz token olindi (29 kun amal qiladi)');
      return this.token;
    } catch (e) {
      this.logger.error(`[SMS] Eskiz auth xato: ${String(e)}`);
      return null;
    }
  }

  /**
   * SMS yuborish.
   * @param phone — telefon (998901234567 yoki +998901234567 formati)
   * @param text — xabar (160 belgi cheklov)
   */
  async sendSms(phone: string, text: string): Promise<Result<{ sent: boolean }, AppError>> {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 9) {
      return Err({ message: 'Noto\'g\'ri telefon raqami', code: 'VALIDATION' });
    }
    // 998 prefiks majburiy
    const finalPhone = cleanPhone.startsWith('998') ? cleanPhone : `998${cleanPhone}`;

    const token = await this.getToken();
    if (!token) {
      this.logs.push({ phone: finalPhone, text, status: 'failed', response: 'No token', sentAt: new Date() });
      return Err({ message: 'SMS provider sozlanmagan', code: 'EXTERNAL_SERVICE' });
    }

    try {
      const res = await fetch(`${ESKIZ_BASE}/message/sms/send`, {
        method:  'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type':  'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          mobile_phone: finalPhone,
          message:      text,
          from:         this.config.from,
        }).toString(),
      });
      const data = await res.json() as { status?: string; message?: string };
      const sent = data?.status === 'waiting' || data?.status === 'sent';
      this.logs.push({
        phone: finalPhone, text, sentAt: new Date(),
        status: sent ? 'sent' : 'failed',
        response: JSON.stringify(data),
      });
      if (sent) {
        this.logger.log(`[SMS] ✅ ${finalPhone}: ${text.substring(0, 50)}`);
      } else {
        this.logger.warn(`[SMS] ❌ ${finalPhone}: ${data?.message ?? 'unknown'}`);
      }
      return Ok({ sent });
    } catch (e) {
      this.logs.push({ phone: finalPhone, text, status: 'failed', response: String(e), sentAt: new Date() });
      this.logger.error(`[SMS] yuborish xato: ${String(e)}`);
      return Err({ message: String(e), code: 'EXTERNAL_SERVICE' });
    }
  }

  /**
   * Past stok ogohlantirishi — ombor menejeriga SMS.
   */
  async notifyLowStock(phone: string, materialName: string, currentQty: number, minStock: number, unit: string) {
    const text = `[EuroPrint] PAST STOK: ${materialName} — joriy ${currentQty}${unit}, minimum ${minStock}${unit}. To'ldirish kerak.`;
    return this.sendSms(phone, text);
  }

  /**
   * Karantin muddati tugashi ogohlantirishi — QC bo'limga SMS.
   */
  async notifyQuarantineExpired(phone: string, movementNumber: string, hours: number) {
    const text = `[EuroPrint] KARANTIN: ${movementNumber} ${hours} soatdan beri kutmoqda. QC tekshiruvi kerak.`;
    return this.sendSms(phone, text);
  }

  /**
   * Zarar akti — moliya va direktorga SMS.
   */
  async notifyDamage(phone: string, movementNumber: string, amount: number) {
    const text = `[EuroPrint] ZARAR AKTI: ${movementNumber}, summa: ${amount} UZS. Tasdiqlash kerak.`;
    return this.sendSms(phone, text);
  }

  /** SMS yuborish tarixi (xotirada saqlanadi, oxirgi 1000) */
  getLogs(limit = 100): SmsLogEntry[] {
    return this.logs.slice(-limit).reverse();
  }

  /** Test SMS — sozlamani tekshirish */
  async testSms(phone: string): Promise<Result<{ sent: boolean }, AppError>> {
    return this.sendSms(phone, '[EuroPrint] Test SMS — tizim ishlamoqda.');
  }
}
