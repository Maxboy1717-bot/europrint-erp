/**
 * @module jwt.strategy
 * @description Passport strategy. Extracts and validates auth credentials from the request.
 */

import { Injectable, Logger, Inject, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { JwtPayload, AuthenticatedUser } from '../../domain/types';
import { IAuthRepo } from '../../domain/repositories/i-auth.repo';
import { AUTH_REPO } from '../../auth.tokens';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);
  constructor(
    @Inject(AUTH_REPO) private readonly authRepo: IAuthRepo,
    cfg: ConfigService,
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
      throw new UnauthorizedException('User not found');
    }

    if (!user.isAccountActive()) {
      this.logger.warn('JWT validation failed: account inactive');
      throw new UnauthorizedException('Account inactive');
    }

    return {
      id: user.getId(),
      username: user.getUsername(),
      email: user.getEmail(),
      role: user.getRole(),
    };
  }
}
