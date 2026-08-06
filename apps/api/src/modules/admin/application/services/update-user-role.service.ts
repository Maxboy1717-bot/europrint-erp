/**
 * @module update-user-role.service
 * @description Application service (formerly update-user-role.handler). Never implemented
 *   `ICommandHandler<T>` and never registered with the CQRS bus — the controller injects
 *   it directly. Renamed handler→service so the location matches its real role (audit P0-7).
 */

import { AppErr, AppError, Err } from '@common/result';
import { Injectable, Inject, Logger } from '@nestjs/common';
import { IUserRepo } from '../../domain/repositories/i-user.repo';
import { USER_REPO } from '../../admin.tokens';
import { UserRole } from '../../domain/aggregates/user.aggregate';

export interface UpdateUserRoleCommand {
  userId: number;
  newRole: UserRole;
  executorId: number;
  executorRole: UserRole | string | undefined;
}

export type UpdateUserRoleCommandResult =
  | { ok: true; data: void }
  | { ok: false; error: AppError };

@Injectable()
export class UpdateUserRoleService {
  private readonly logger = new Logger(UpdateUserRoleService.name);

  constructor(
    @Inject(USER_REPO) private readonly userRepo: IUserRepo,
  ) {}

  async execute(command: UpdateUserRoleCommand): Promise<UpdateUserRoleCommandResult> {
      // SECURITY (audit 2026-08-06 T2): @Roles(SUPER_ADMIN) on the controller is
      // bypassed by RolesGuard's admin/director shortcut, so enforce it here too
      // (same second-layer pattern as update-settings.service.ts).
      if (String(command.executorRole ?? '').toLowerCase() !== UserRole.SUPER_ADMIN) {
        this.logger.warn('Role-change blocked: non-super_admin executor ' + command.executorId);
        return Err(AppErr('FORBIDDEN', "Faqat SUPER_ADMIN foydalanuvchi rolini o'zgartira oladi"));
      }
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
