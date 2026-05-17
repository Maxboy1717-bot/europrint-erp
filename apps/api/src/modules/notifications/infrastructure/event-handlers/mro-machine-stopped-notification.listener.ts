/**
 * @module mro-machine-stopped-notification.listener
 * @description PA2-18 Wave 6: canonical CQRS @EventsHandler form for the
 *   notifications side of `MroMaintenanceStopEvent`. Extracted from
 *   erp-events.listener.ts so the notification fan-out can subscribe
 *   directly to the event class rather than the legacy string topic.
 */

import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { Notification } from '../../domain/aggregates/notification.aggregate';
import { INotificationRepo, NOTIFICATION_REPO } from '../../domain/repositories/i-notification.repo';
import { MroMaintenanceStopEvent } from '@modules/mro/domain/events';

@Injectable()
@EventsHandler(MroMaintenanceStopEvent)
export class MroMachineStoppedNotificationListener
  implements IEventHandler<MroMaintenanceStopEvent>
{
  private readonly logger = new Logger(MroMachineStoppedNotificationListener.name);

  constructor(
    @Inject(NOTIFICATION_REPO) private readonly notificationRepo: INotificationRepo,
  ) {}

  async handle(event: MroMaintenanceStopEvent): Promise<void> {
    this.logger.log('Machine stopped event received - creating notification for director');

    try {
      // TODO PA2-18: event only carries {maintenanceId, machineId}; equipmentName /
      // issueDescription / priority should be looked up from the maintenance record
      // once StopMachineCommand carries that context.
      const result = await runQuery<{ id: number }>(
        sql`SELECT id FROM users WHERE role = ${'director'} AND is_active = true LIMIT 50`,
      );

      await Promise.all(
        result.rows.map((u) => {
          const notification = Notification.createForUser(
            String(u.id),
            'Equipment Stopped',
            `Machine ${event.machineId} has stopped (maintenance #${event.maintenanceId})`,
            'mro_stopped',
          );
          notification.referenceId = event.maintenanceId;
          notification.referenceType = 'maintenance_order';
          return this.notificationRepo.save(notification);
        }),
      );
    } catch (err: unknown) {
      this.logger.warn(`MroMachineStoppedNotificationListener failed: ${String(err)}`);
    }
  }
}
