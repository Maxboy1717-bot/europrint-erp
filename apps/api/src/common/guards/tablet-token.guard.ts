/**
 * @module tablet-token.guard
 * @description Authenticates IoT-tablet PWA requests via the `x-tablet-token` header.
 *
 * The tablet PWA logs in at POST /iot/tablet/login, which issues a short-lived (8h) JWT
 * (see iot-tablet.service.ts) carrying `{ sub, userId, tabel, role, tablet: true }`. The PWA
 * sends it back in the `x-tablet-token` header (NOT the ERP access_token cookie / Authorization
 * bearer), so the global JwtAuthGuard cannot see it. These tablet data routes therefore keep
 * `@Public()` (to bypass the cookie/bearer JwtAuthGuard) and add THIS guard to enforce a valid
 * tablet token — closing the prior unauthenticated-read hole while keeping the PWA working.
 *
 * Least privilege: the tablet token is only accepted here, not promoted to a general ERP
 * session.
 */

import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class TabletTokenGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly i18n: I18nService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const raw = request.headers?.['x-tablet-token'];
    const token = Array.isArray(raw) ? raw[0] : raw;
    if (typeof token !== 'string' || token.length === 0) {
      throw new UnauthorizedException(await this.i18n.t('errors.tabletTokenRequired'));
    }
    try {
      const decoded = this.jwtService.verify(token) as Record<string, unknown>;
      if (decoded?.['tablet'] !== true) {
        throw new UnauthorizedException(await this.i18n.t('errors.tabletTokenInvalid'));
      }
      request.user = { ...decoded, id: decoded['sub'] ?? decoded['userId'] };
      return true;
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException(await this.i18n.t('errors.tabletTokenInvalid'));
    }
  }
}
