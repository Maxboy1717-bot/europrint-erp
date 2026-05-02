import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable, Inject, Logger } from '@nestjs/common';
import { Result, PaginatedResult , Ok } from '@common/types/result.type';
import { GetNotificationsQuery } from './get-notifications.query';
import { Notification } from '../../domain/aggregates/notification.aggregate';
import { INotificationRepo, NOTIFICATION_REPO } from '../../domain/repositories/i-notification.repo';

@Injectable()
@QueryHandler(GetNotificationsQuery)
export class GetNotificationsHandler implements IQueryHandler<GetNotificationsQuery> {
  private readonly logger = new Logger(GetNotificationsHandler.name);

  constructor(
    @Inject(NOTIFICATION_REPO) private readonly notificationRepo: INotificationRepo,
      ) {}

  async execute(query: GetNotificationsQuery): Promise<Result<PaginatedResult<Notification>>> {
    const result = await this.notificationRepo.findByUserId({
      userId: query.userId,
      isRead: query.filters.isRead,
      page: query.filters.page,
      limit: query.filters.limit,
    });

    if (!result.ok) {
      this.logger.error('Failed to fetch notifications');
      return result;
    }

    const page = query.filters.page || 1;
    const limit = query.filters.limit || 10;

    const paginatedResult: PaginatedResult<Notification> = {
      items: result.data.items,
      total: result.data.total,
      page,
      limit,
    };

    this.logger.log('Notifications fetched');

    return Ok(paginatedResult);
  }
}
