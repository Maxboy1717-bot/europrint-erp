/**
 * @module webhook-signature.guard
 * @description Authenticates external webhook/service calls via an HMAC-SHA256
 * signature header, WITHOUT requiring an ERP JWT session. Used on routes marked
 * `@Public()` (to bypass the global `JwtAuthGuard`) that still need to reject
 * unauthenticated traffic — e.g. CRM auto-lead ingestion from an external web
 * form / Telegram bot / call-center dialer / website widget.
 *
 * Contract (mirrors `cc-webhook.controller.ts`'s inline HMAC check, extracted
 * here so it can be reused as a declarative `@UseGuards(...)` on any public
 * ingestion route):
 *   Header: `X-Webhook-Signature: HMAC-SHA256(secret, JSON.stringify(body))` hex
 *   Secret: `<PREFIX>_WEBHOOK_SECRET_<SOURCE>` (per-source override) falling
 *           back to `<PREFIX>_WEBHOOK_SECRET` (shared secret), read via
 *           ConfigService — never hardcoded (Qoida A).
 *
 * `:source` is taken from the route param named `source` when present,
 * otherwise from the last non-empty URL path segment (e.g. `/crm/auto-lead/website`
 * → `website`), uppercased for the env-var lookup.
 *
 * NOTE (same caveat as cc-webhook.controller.ts): the app does not enable
 * NestJS `rawBody`, so the signature is computed over the re-serialized
 * `JSON.stringify(body)`, not the sender's original bytes. Callers must send
 * canonical (single-pass-serializable) JSON. If byte-exact verification is
 * required later, enable `rawBody: true` in `NestFactory.create` and read
 * `req.rawBody` here instead.
 */

import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class WebhookSignatureGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const headers = request.headers as Record<string, string | string[] | undefined> | undefined;
    const rawSignature = headers?.['x-webhook-signature'];
    const signature = Array.isArray(rawSignature) ? rawSignature[0] : rawSignature;

    if (typeof signature !== 'string' || signature.length === 0) {
      throw new UnauthorizedException('X-Webhook-Signature header majburiy');
    }

    const source = this.resolveSource(request);
    const secret = this.resolveSecret(source);
    if (!secret) {
      throw new UnauthorizedException(`Webhook secret sozlanmagan (source=${source})`);
    }

    const raw = JSON.stringify(request.body ?? {});
    const expected = crypto.createHmac('sha256', secret).update(raw, 'utf8').digest('hex');
    if (!this.timingSafeEqual(signature, expected)) {
      throw new UnauthorizedException("Webhook imzosi noto'g'ri");
    }

    return true;
  }

  private resolveSource(request: { params?: Record<string, string>; url?: string; path?: string }): string {
    const paramSource = request.params?.['source'];
    if (typeof paramSource === 'string' && paramSource.length > 0) return paramSource;

    const path = request.path ?? request.url ?? '';
    const segments = path.split('?')[0]?.split('/').filter((s) => s.length > 0) ?? [];
    return segments[segments.length - 1] ?? 'default';
  }

  private resolveSecret(source: string): string | undefined {
    const perSource = this.config.get<string>(`CRM_WEBHOOK_SECRET_${source.toUpperCase()}`);
    if (perSource) return perSource;
    return this.config.get<string>('CRM_WEBHOOK_SECRET');
  }

  private timingSafeEqual(a: string, b: string): boolean {
    try {
      const bufA = Buffer.from(a, 'utf8');
      const bufB = Buffer.from(b, 'utf8');
      if (bufA.length !== bufB.length) return false;
      return crypto.timingSafeEqual(bufA, bufB);
    } catch {
      return false;
    }
  }
}
