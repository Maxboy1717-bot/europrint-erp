import { AppErr, AppError, Err } from '@common/result';
import { Injectable, Inject, Logger } from '@nestjs/common';
import { IUserRepo } from '../../domain/repositories/i-user.repo';
import { USER_REPO } from '../../admin.tokens';
import { UserRole } from '../../domain/aggregates/user.aggregate';

export interface UpdateUserRoleCommand {
  userId: number;
  newRole: UserRole;
  executorId: number;
}

export type UpdateUserRoleCommandResult =
  | { ok: true; data: void }
  | { ok: false; error: AppError };

@Injectable()
export class UpdateUserRoleHandler {
  private readonly logger = new Logger(UpdateUserRoleHandler.name);

  constructor(
    @Inject(USER_REPO) private readonly userRepo: IUserRepo,
  ) {}

  async execute(command: UpdateUserRoleCommand): Promise<UpdateUserRoleCommandResult> {
      const user = await this.userRepo.findById(command.userId);

      if (!user) {
        this.logger.warn('User not found: ' + command.userId);
        return Err(AppErr('NOT_FOUND', 'User not found'));
      }

      const oldRole = user.getRole();
      user.changeRole(command.newRole);
      await this.userRepo.update(user);

      this.logger.log(`User role updated: userId=${command.userId} from=${oldRole} to=${command.newRole}`);

      return { ok: true, data: undefined };
  }
}
