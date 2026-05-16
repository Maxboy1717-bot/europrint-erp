/**
 * @module auth.module
 * @description NestJS @Module() definition. Providers, controllers, and imports for this feature slice.
 */

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import type { SignOptions } from 'jsonwebtoken';

import { DatabaseModule } from '@/infrastructure/database/database.module';
import { AuthController } from './presentation/auth.controller';
import { MePermissionsController } from './presentation/me-permissions.controller';
import { LoginService } from './application/services/login.service';
import { LogoutService } from './application/services/logout.service';
import { ChangePasswordService } from './application/services/change-password.service';
import { VerifyOtpService } from './application/services/verify-otp.service';
import { ResendOtpService } from './application/services/resend-otp.service';
import { GetMyPermissionsService } from './application/services/get-my-permissions.service';
import { JwtStrategy } from './infrastructure/strategies/jwt.strategy';
import { DrizzleAuthRepo } from './infrastructure/repositories/drizzle-auth.repo';
import { DrizzleMyPermissionsRepository } from './infrastructure/repositories/drizzle-my-permissions.repo';
import { OtpSessionRepository } from './infrastructure/repositories/otp-session.repository';
import { AuthSchemaService } from './infrastructure/auth-schema.service';
import { AuthSchemaRepository } from './infrastructure/auth-schema.repository';
import { BcryptPasswordHasher } from './infrastructure/security/bcrypt-password-hasher';
import { PASSWORD_HASHER } from './domain/ports/i-password-hasher.port';

import { AUTH_REPO } from './auth.tokens';
export { AUTH_REPO } from './auth.tokens';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        secret: cfg.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: (cfg.get<string>('JWT_ACCESS_TOKEN_TTL') ?? cfg.get<string>('JWT_EXPIRES_IN') ?? '24h') as SignOptions['expiresIn'],
        },
      }),
    }),
    DatabaseModule,
  ],
  controllers: [AuthController, MePermissionsController],
  providers: [
    LoginService,
    LogoutService,
    ChangePasswordService,
    VerifyOtpService,
    ResendOtpService,
    GetMyPermissionsService,
    JwtStrategy,
    OtpSessionRepository,
    AuthSchemaRepository,
    AuthSchemaService,
    DrizzleMyPermissionsRepository,
    {
      provide: AUTH_REPO,
      useClass: DrizzleAuthRepo,
    },
    {
      provide: PASSWORD_HASHER,
      useClass: BcryptPasswordHasher,
    },
  ],
  exports: [JwtStrategy, PassportModule, AUTH_REPO, JwtModule, PASSWORD_HASHER],
})
export class AuthModule {}
