/**
 * @module sms.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Result, Ok, Err } from '@common/result';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly eskizToken: string | undefined;
  private readonly infobipApiKey: string | undefined;
  private readonly infobipBaseUrl: string | undefined;

  constructor(private readonly cfg: ConfigService) {
    this.eskizToken    = this.cfg.get<string>('ESKIZ_TOKEN');
    this.infobipApiKey = this.cfg.get<string>('INFOBIP_API_KEY');
    this.infobipBaseUrl = this.cfg.get<string>('INFOBIP_BASE_URL');
  }

  async send(phoneNumber: string, message: string): Promise<Result<void>> {
    if (!phoneNumber) {
      this.logger.warn('SMS: telefon raqami ko\'rsatilmagan');
      return Ok(undefined);
    }

    const normalized = this.normalizePhone(phoneNumber);

    if (this.eskizToken) {
      return this.sendViaEskiz(normalized, message);
    } else if (this.infobipApiKey) {
      return this.sendViaInfobip(normalized, message);
    } else {
      this.logger.warn('SMS: ESKIZ_TOKEN yoki INFOBIP_API_KEY o\'rnatilmagan — SMS yuborilmadi');
      return Ok(undefined);
    }
  }

  private async sendViaEskiz(phone: string, message: string): Promise<Result<void>> {
    let res: Response;
    try {
      res = await fetch('https://notify.eskiz.uz/api/message/sms/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.eskizToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mobile_phone: phone, message, from: 'EuroPrint' }),
      });
    } catch (err: unknown) {
      this.logger.error(`Eskiz SMS tarmoq xatolik: ${phone} — ${String(err)}`);
      return Err(`Eskiz SMS tarmoq xatolik: ${phone}`);
    }

    if (!res.ok) {
      this.logger.warn(`Eskiz SMS xatolik: ${res.status}`);
      return Err(`Eskiz SMS xatolik: ${res.status}`);
    }

    this.logger.log(`SMS (Eskiz) yuborildi: ${phone}`);
    return Ok(undefined);
  }

  private async sendViaInfobip(phone: string, message: string): Promise<Result<void>> {
    let res: Response;
    try {
      res = await fetch(`${this.infobipBaseUrl}/sms/2/text/advanced`, {
        method: 'POST',
        headers: {
          'Authorization': `App ${this.infobipApiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ from: 'EuroPrint', destinations: [{ to: phone }], text: message }],
        }),
      });
    } catch (err: unknown) {
      this.logger.error(`Infobip SMS tarmoq xatolik: ${phone} — ${String(err)}`);
      return Err(`Infobip SMS tarmoq xatolik: ${phone}`);
    }

    if (!res.ok) {
      this.logger.warn(`Infobip SMS xatolik: ${res.status}`);
      return Err(`Infobip SMS xatolik: ${res.status}`);
    }

    this.logger.log(`SMS (Infobip) yuborildi: ${phone}`);
    return Ok(undefined);
  }

  private normalizePhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('998')) return digits;
    if (digits.startsWith('0')) return '998' + digits.slice(1);
    return '998' + digits;
  }
}
