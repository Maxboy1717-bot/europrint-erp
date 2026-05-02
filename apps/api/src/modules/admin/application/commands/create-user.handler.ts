import { AppErr, AppError, Err } from '@common/result';
import { Injectable, Inject, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
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
export class CreateUserHandler {
  private readonly logger = new Logger(CreateUserHandler.name);

  constructor(
    @Inject(USER_REPO) private readonly userRepo: IUserRepo,
  ) {}

  async execute(command: CreateUserCommand): Promise<CreateUserCommandResult> {
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

      const passwordHash = await bcrypt.hash(command.password, 10);

      let user = UserAggregate.create(
        command.username,
        command.email,
        passwordHash,
        command.role,
      );

      if (command.departmentId) {
        user.assignDepartment(command.departmentId);
      }

      if (command.positionId) {
        user.assignPosition(command.positionId);
      }

      const savedUser = await this.userRepo.create(user);

      this.logger.log('User created: ' + command.username);

      return { ok: true, data: savedUser };
  }
}
