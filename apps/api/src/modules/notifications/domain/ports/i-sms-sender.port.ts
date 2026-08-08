/**
 * @module i-sms-sender.port
 * @description Domain port for SMS delivery. The infrastructure layer provides
 * concrete adapters (EskizSmsAdapter, InfobipSmsAdapter, etc.) that satisfy
 * this contract — domain code only depends on the interface, never on the
 * provider SDK or transport details.
 */

import { Result } from '@common/result';

export const SMS_SENDER = Symbol('SMS_SENDER');

export interface SmsInput {
  to: string;
  text: string;
}

export interface ISmsSender {
  /**
   * Send a plain-text SMS to a single recipient. The phone number should be
   * supplied in any format accepted by the adapter (it normalizes internally).
   * When the adapter is unconfigured (missing token) it logs and returns
   * `Err(EXTERNAL_SERVICE)` — missing required config is a delivery failure,
   * not a silent no-op (Q-40 fake-success ban).
   *
   * Two-argument legacy form `send(phone, text)` is also accepted by the
   * concrete adapter for backward compatibility with out-of-scope callers
   * (pos / ai-agents / design). New code SHOULD use the object form.
   */
  send(input: SmsInput): Promise<Result<void>>;
  send(phone: string, text: string): Promise<Result<void>>;
}
