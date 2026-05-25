/**
 * @module list-users.service
 * @description Application service (formerly list-users.handler). Never implemented
 *   `IQueryHandler<T>` and never registered with the CQRS bus — the controller injects
 *   it directly. Renamed handler→service so the location matches its real role (audit P0-7).
 */

import { AppError } from '@common/result';
import { Injectable, Inject, Logger } from '@nestjs/common';
import { IUserRepo, PaginatedResult, UserFilters } from '../../domain/repositories/i-user.repo';
import { USER_REPO } from '../../admin.tokens';
import { UserAggregate } from '../../domain/aggregates/user.aggregate';

export interface ListUsersQuery {
  filters: UserFilters;
}

export type ListUsersQueryResult =
  | { ok: true; data: PaginatedResult<UserAggregate> }
  | { ok: false; error: AppError };

@Injectable()
export class ListUsersService {
  private readonly logger = new Logger(ListUsersService.name);

  constructor(
    @Inject(USER_REPO) private readonly userRepo: IUserRepo,
  ) {}

  async execute(query: ListUsersQuery): Promise<ListUsersQueryResult> {
      const filters: UserFilters = {
        ...query.filters,
        page: query.filters.page || 1,
        limit: query.filters.limit || 20,
      };

      if ((filters.limit ?? 0) > 100) {
        filters.limit = 100;
      }

      const result = await this.userRepo.findAll(filters);

      this.logger.debug(`List users: page=${filters.page} limit=${filters.limit} total=${result.total}`);

      return { ok: true, data: result };
  }
}
