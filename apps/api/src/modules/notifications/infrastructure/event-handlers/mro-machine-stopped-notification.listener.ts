/**
 * @module mro-machine-stopped-notification.listener
 * @description PA2-18 Wave 6: canonical CQRS @EventsHandler form for the
 *   notifications side of `MroMaintenanceStopEvent`. Extracted from
 *   erp-events.listener.ts so the notification fan-out can subscribe
 *   directly to the event class rather than the legacy string topic.
 */

import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Notification } from '../../domain/aggregates/notification.aggregate';
import { INotificationRepo, NOTIFICATION_REPO } from '../../domain/repositories/i-notification.repo';
import { NotificationRoutingRepository } from '../notification-routing.repository';
import { MroMaintenanceStopEvent } from '@modules/mro/domain/events';

/** notification_routing_rules.event_type — config-driven qilib qo'yiladi (FAZA Bildirishnoma, 2026-07-01). */
const MRO_STOPPED_EVENT_TYPE = 'mro.machine_stopped';
/** Jadvalda qator bo'lmasa qaytiladigan avvalgi hardcoded rol (regressiya yo'q, Q-39). */
const MRO_STOPPED_FALLBACK_ROLE = 'director';

@Injectable()
@EventsHandler(MroMaintenanceStopEvent)
export class MroMachineStoppedNotificationListener
  implements IEventHandler<MroMaintenanceStopEvent>
{
  private readonly logger = new Logger(MroMachineStoppedNotificationListener.name);

  constructor(
    @Inject(NOTIFICATION_REPO) private readonly notificationRepo: INotificationRepo,
    private readonly routing: NotificationRoutingRepository,
  ) {}

  async handle(event: MroMaintenanceStopEvent): Promise<void> {
    this.logger.log('Machine stopped event received - resolving notification targets via routing rules');

    try {
      // TODO PA2-18: event only carries {maintenanceId, machineId}; equipmentName /
      // issueDescription / priority should be looked up from the maintenance record
      // once StopMachineCommand carries that context.
      const userIds = await this.routing.resolveUserIds(MRO_STOPPED_EVENT_TYPE, MRO_STOPPED_FALLBACK_ROLE);

      await Promise.all(
        userIds.map((id) => {
          const notification = Notification.createForUser(
            String(id),
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
