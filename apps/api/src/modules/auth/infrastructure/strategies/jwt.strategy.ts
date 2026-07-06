/**
 * @module jwt.strategy
 * @description Passport strategy. Extracts and validates auth credentials from the request.
 */

import { Injectable, Logger, Inject, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { I18nService } from 'nestjs-i18n';
import { JwtPayload, AuthenticatedUser } from '../../domain/types';
import { IAuthRepo } from '../../domain/repositories/i-auth.repo';
import { AUTH_REPO } from '../../auth.tokens';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);
  constructor(
    @Inject(AUTH_REPO) private readonly authRepo: IAuthRepo,
    cfg: ConfigService,
    private readonly i18n: I18nService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: cfg.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.authRepo.findById(payload.sub);

    if (!user) {
      this.logger.warn('JWT validation failed: user not found');
      throw new UnauthorizedException(await this.i18n.t('errors.userNotFound'));
    }

    if (!user.isAccountActive()) {
      this.logger.warn('JWT validation failed: account inactive');
      throw new UnauthorizedException(await this.i18n.t('errors.accountInactive'));
    }

    return {
      id: user.getId(),
      username: user.getUsername(),
      email: user.getEmail(),
      role: user.getRole(),
      // Phase 2 / Task 2.1 — propagate tenant from JWT claim so the
      // TenantContextInterceptor can pick it up. Optional; falls back
      // to DEFAULT_TENANT_ID downstream when missing.
      tenantId: payload.tenantId,
      // EP-ORG-023 (T12-07) — KARTA-claim'larni JWT'dan request.user'ga ko'chiramiz.
      // login.service ularni imzolaydi (resolveCardGate'dan), lekin shu yergacha
      // ko'chirilmasa guard'lardagi tier-derive yo'li (RolesGuard A5 / PermissionGuard
      // A6) hech qachon ishlamasdi. Additiv: kartasiz user/eski tokenda undefined →
      // guard'lar eski role/position yo'liga toza fallback qiladi (regress yo'q, Q-39).
      cardId: payload.cardId ?? null,
      rbacTier: payload.rbacTier ?? null,
      positionId: payload.positionId ?? null,
    };
  }
}
