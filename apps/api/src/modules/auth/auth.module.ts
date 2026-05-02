import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import type { SignOptions } from 'jsonwebtoken';

import { DatabaseModule } from '@/infrastructure/database/database.module';
import { AuthController } from './presentation/auth.controller';
import { LoginHandler } from './application/commands/login.handler';
import { LogoutHandler } from './application/commands/logout.handler';
import { ChangePasswordHandler } from './application/commands/change-password.handler';
import { VerifyOtpHandler } from './application/commands/verify-otp.handler';
import { ResendOtpHandler } from './application/commands/resend-otp.handler';
import { JwtStrategy } from './infrastructure/strategies/jwt.strategy';
import { DrizzleAuthRepo } from './infrastructure/repositories/drizzle-auth.repo';
import { OtpSessionRepository } from './infrastructure/repositories/otp-session.repository';
import { AuthSchemaService } from './infrastructure/auth-schema.service';
import { AuthSchemaRepository } from './infrastructure/auth-schema.repository';

import { AUTH_REPO } from './auth.tokens';
import { QUERY_TIMEOUT_MS } from '@common/constants/app.constants';
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
    ThrottlerModule.forRoot([
      {
        name: 'auth',
        ttl: QUERY_TIMEOUT_MS,
        limit: 5,
      },
    ]),
    DatabaseModule,
  ],
  controllers: [AuthController],
  providers: [
    LoginHandler,
    LogoutHandler,
    ChangePasswordHandler,
    VerifyOtpHandler,
    ResendOtpHandler,
    JwtStrategy,
    OtpSessionRepository,
    AuthSchemaRepository,
    AuthSchemaService,
    {
      provide: AUTH_REPO,
      useClass: DrizzleAuthRepo,
    },
  ],
  exports: [JwtStrategy, PassportModule, AUTH_REPO, JwtModule],
})
export class AuthModule {}
