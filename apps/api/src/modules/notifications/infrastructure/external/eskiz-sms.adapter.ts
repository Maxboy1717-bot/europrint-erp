/**
 * @module eskiz-sms.adapter
 * @description Infrastructure adapter for SMS delivery. Implements the domain
 *   `ISmsSender` port using the Eskiz (https://notify.eskiz.uz) and Infobip
 *   HTTP APIs. When neither token is configured `send()` returns an
 *   `Err(EXTERNAL_SERVICE)` — the caller must see delivery as failed
 *   (`sent:false`), not a fabricated success (Q-40 fake-success ban).
 *
 *   Each HTTP call is wrapped in `withRetry` (P2-23): 3 attempts with
 *   exponential backoff 100ms / 300ms / 1000ms and a 30s timeout per
 *   attempt. On final failure we map to `EXTERNAL_TIMEOUT` or `EXTERNAL_5XX`.
 *
 *   Moved from `domain/services/sms.service.ts` — this file's `fetch()`
 *   network call is infrastructure, not domain logic.
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Result, Ok, Err, AppErr } from '@common/result';
import { withRetry, classifyRetryError } from '@common/retry/with-retry';
import { ISmsSender, SmsInput } from '../../domain/ports/i-sms-sender.port';

@Injectable()
export class EskizSmsAdapter implements ISmsSender {
  private readonly logger = new Logger(EskizSmsAdapter.name);
  private readonly eskizToken: string | undefined;
  private readonly infobipApiKey: string | undefined;
  private readonly infobipBaseUrl: string | undefined;

  constructor(private readonly cfg: ConfigService) {
    this.eskizToken    = this.cfg.get<string>('ESKIZ_TOKEN');
    this.infobipApiKey = this.cfg.get<string>('INFOBIP_API_KEY');
    this.infobipBaseUrl = this.cfg.get<string>('INFOBIP_BASE_URL');
  }

  /**
   * Overload supports both the new port shape `send({to, text})` and the
   * legacy two-arg `send(phoneNumber, message)` used by pos/ai-agents/design
   * out-of-scope callers. Once those migrate the legacy overload can be
   * removed.
   */
  async send(phoneNumber: string, message: string): Promise<Result<void>>;
  async send(input: SmsInput): Promise<Result<void>>;
  async send(arg1: SmsInput | string, arg2?: string): Promise<Result<void>> {
    const phoneNumber = typeof arg1 === 'string' ? arg1 : arg1.to;
    const message     = typeof arg1 === 'string' ? (arg2 ?? '') : arg1.text;
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
      return Err(AppErr('EXTERNAL_SERVICE', 'SMS provider sozlanmagan (ESKIZ_TOKEN yoki INFOBIP_API_KEY yo\'q)'));
    }
  }

  private async sendViaEskiz(phone: string, message: string): Promise<Result<void>> {
    try {
      const res = await withRetry<Response>(async () =>
        fetch('https://notify.eskiz.uz/api/message/sms/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.eskizToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ mobile_phone: phone, message, from: 'EuroPrint' }),
        }),
      );
      if (!res.ok) {
        const msg = `Eskiz HTTP ${res.status}`;
        this.logger.error(`Eskiz SMS xatolik (EXTERNAL_5XX): ${phone} — ${msg}`);
        return Err(AppErr('EXTERNAL_5XX', `Eskiz SMS xatolik: ${msg}`));
      }
    } catch (err) {
      const code = classifyRetryError(err);
      const msg  = err instanceof Error ? err.message : String(err);
      this.logger.error(`Eskiz SMS xatolik (${code}): ${phone} — ${msg}`);
      return Err(AppErr(code, `Eskiz SMS xatolik: ${msg}`));
    }
    this.logger.log(`SMS (Eskiz) yuborildi: ${phone}`);
    return Ok(undefined);
  }

  private async sendViaInfobip(phone: string, message: string): Promise<Result<void>> {
    try {
      const res = await withRetry<Response>(async () =>
        fetch(`${this.infobipBaseUrl}/sms/2/text/advanced`, {
          method: 'POST',
          headers: {
            'Authorization': `App ${this.infobipApiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            messages: [{ from: 'EuroPrint', destinations: [{ to: phone }], text: message }],
          }),
        }),
      );
      if (!res.ok) {
        const msg = `Infobip HTTP ${res.status}`;
        this.logger.error(`Infobip SMS xatolik (EXTERNAL_5XX): ${phone} — ${msg}`);
        return Err(AppErr('EXTERNAL_5XX', `Infobip SMS xatolik: ${msg}`));
      }
    } catch (err) {
      const code = classifyRetryError(err);
      const msg  = err instanceof Error ? err.message : String(err);
      this.logger.error(`Infobip SMS xatolik (${code}): ${phone} — ${msg}`);
      return Err(AppErr(code, `Infobip SMS xatolik: ${msg}`));
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
