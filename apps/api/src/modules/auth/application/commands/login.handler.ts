import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { AppError, AppErr, Err } from '@common/result';
import { Injectable, Inject, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { IAuthRepo } from '../../domain/repositories/i-auth.repo';
import { AUTH_REPO } from '../../auth.tokens';
import { AuthResult, AuthErrorCode } from '../../domain/types';
import { UserLoggedInEvent } from '../../domain/events/user-logged-in.event';
export interface LoginCommand {
  username: string;
  password: string;
  ipAddress: string;
  userAgent: string;
}
export type LoginCommandResult =
  | { ok: true; data: AuthResult }
  | { ok: false; error: AppError };
@Injectable()
export class LoginHandler {
  private readonly logger = new Logger(LoginHandler.name);
  constructor(
    @Inject(AUTH_REPO) private readonly authRepo: IAuthRepo,
    private readonly jwtService: JwtService,
  ) {}
  async execute(command: LoginCommand): Promise<LoginCommandResult> {
      const user = await this.authRepo.findByUsername(command.username);
      if (!user) {
        this.logger.warn({ username: command.username }, 'User not found');
        const event = UserLoggedInEvent.create(0, command.ipAddress, command.userAgent, false);
        await this.auditLog(event);
        return Err(AppErr('UNAUTHORIZED', AuthErrorCode.USER_NOT_FOUND));
      }
      if (user.isAccountLocked()) {
        this.logger.warn({ userId: user.getId() }, 'Account locked');
        const event = UserLoggedInEvent.create(user.getId(), command.ipAddress, command.userAgent, false);
        await this.auditLog(event);
        return Err(AppErr('UNAUTHORIZED', AuthErrorCode.ACCOUNT_LOCKED));
      }
      if (!user.isAccountActive()) {
        this.logger.warn({ userId: user.getId() }, 'Account inactive');
        const event = UserLoggedInEvent.create(user.getId(), command.ipAddress, command.userAgent, false);
        await this.auditLog(event);
        return Err(AppErr('UNAUTHORIZED', AuthErrorCode.ACCOUNT_INACTIVE));
      }
      const isPasswordValid = await user.verifyPassword(command.password);
      if (!isPasswordValid) {
        user.incrementFailedAttempts();
        await this.authRepo.incrementFailedAttempts(user.getId());
        if (user.getFailedLoginAttempts() >= 5) {
          user.lockAccount(30);
          await this.authRepo.lockUserAccount(user.getId(), 30);
          this.logger.warn({ userId: user.getId() }, 'Account locked due to failed attempts');
        }
        const event = UserLoggedInEvent.create(user.getId(), command.ipAddress, command.userAgent, false);
        await this.auditLog(event);
        return Err(AppErr('UNAUTHORIZED', AuthErrorCode.INVALID_CREDENTIALS));
      }
      user.resetFailedAttempts();
      user.updateLastLogin(_time.now());
      await this.authRepo.resetFailedAttempts(user.getId());
      await this.authRepo.updateLastLogin(user.getId(), command.ipAddress, _time.now());
      const payload = {
        sub: user.getId(),
        username: user.getUsername(),
        email: user.getEmail(),
        role: user.getRole(),
      };
      const accessToken = this.jwtService.sign(payload);
      const event = UserLoggedInEvent.create(user.getId(), command.ipAddress, command.userAgent, true);
      await this.auditLog(event);
      this.logger.log(`User logged in: ${user.getUsername()} from ${command.ipAddress}`);
      return {
        ok: true,
        data: {
          accessToken,
          user: {
            id: user.getId(),
            username: user.getUsername(),
            email: user.getEmail(),
            role: user.getRole(),
          },
        },
      };
  }
  private async auditLog(event: UserLoggedInEvent): Promise<void> {
    this.logger.log(
      `Auth audit: userId=${event.userId} ip=${event.ipAddress} success=${event.success}`,
    );
  }
}