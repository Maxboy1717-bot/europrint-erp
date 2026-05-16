/**
 * @module i-email-sender.port
 * @description Domain port for email delivery. The infrastructure layer provides
 * concrete adapters (SmtpEmailAdapter, SendgridAdapter, etc.) that satisfy
 * this contract — domain code only depends on the interface, never on the
 * provider SDK or transport details.
 */

import { Result } from '@common/result';

export const EMAIL_SENDER = Symbol('EMAIL_SENDER');

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface IEmailSender {
  /**
   * Send an email with rendered HTML body (and optional plain-text fallback).
   * When SMTP credentials are missing the adapter logs and returns Ok — the
   * absence of credentials is treated as a no-op, not an error.
   */
  send(options: EmailOptions): Promise<Result<void>>;

  /**
   * Convenience wrapper that renders a standard EuroPrint-branded HTML email
   * around the supplied title + message + optional follow-up link.
   */
  sendNotification(
    to: string,
    title: string,
    message: string,
    link?: string,
  ): Promise<Result<void>>;
}
