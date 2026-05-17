/**
 * @module create-user.service
 * @description Application service (formerly create-user.handler) for the create-user use-case.
 *   The class never implemented `ICommandHandler<T>` and was never registered with the
 *   NestJS CQRS bus — the controller injects it directly and calls `execute()`. Renamed
 *   from handler→service so the file location matches its real role (audit P0-7).
 */

import { AppErr, AppError, Err } from '@common/result';
import { Injectable, Inject, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
// SECURITY: PA-S5 — canonical bcrypt cost factor.
import { BCRYPT_ROUNDS } from '@common/constants/security.constants';
import { IUserRepo } from '../../domain/repositories/i-user.repo';
import { USER_REPO } from '../../admin.tokens';
import { UserAggregate, UserRole } from '../../domain/aggregates/user.aggregate';

export interface CreateUserCommand {
  username: string;
  email: string;
  password: string;
  role: UserRole;
  departmentId?: number;
  positionId?: number;
}

export type CreateUserCommandResult =
  | { ok: true; data: UserAggregate }
  | { ok: false; error: AppError };

@Injectable()
export class CreateUserService {
  private readonly logger = new Logger(CreateUserService.name);

  constructor(
    @Inject(USER_REPO) private readonly userRepo: IUserRepo,
  ) {}

  private async validateUniqueness(command: CreateUserCommand): Promise<CreateUserCommandResult | null> {
    const existingUser = await this.userRepo.findByUsername(command.username);
    if (existingUser) {
      this.logger.warn('Username already exists: ' + command.username);
      return Err(AppErr('CONFLICT', 'Username already exists'));
    }
    const existingEmail = await this.userRepo.findByEmail(command.email);
    if (existingEmail) {
      this.logger.warn('Email already exists: ' + command.email);
      return Err(AppErr('CONFLICT', 'Email already exists'));
    }
    return null;
  }

  private async buildUserAggregate(command: CreateUserCommand): Promise<UserAggregate> {
    const passwordHash = await bcrypt.hash(command.password, BCRYPT_ROUNDS);
    const user = UserAggregate.create(
      command.username,
      command.email,
      passwordHash,
      command.role,
    );
    if (command.departmentId) user.assignDepartment(command.departmentId);
    if (command.positionId) user.assignPosition(command.positionId);
    return user;
  }

  async execute(command: CreateUserCommand): Promise<CreateUserCommandResult> {
    const conflict = await this.validateUniqueness(command);
    if (conflict) return conflict;
    const user = await this.buildUserAggregate(command);
    const savedUser = await this.userRepo.create(user);
    this.logger.log('User created: ' + command.username);
    return { ok: true, data: savedUser };
  }
}
