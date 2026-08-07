/**
 * @module mro-machine-stopped-notification.listener
 * @description PA2-18 Wave 6: canonical CQRS @EventsHandler form for the
 *   notifications side of `MroMaintenanceStopEvent`. Extracted from
 *   erp-events.listener.ts so the notification fan-out can subscribe
 *   directly to the event class rather than the legacy string topic.
 */

import { Injectable, Logger } from '@nestjs/common';
import { CommandBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { CreateNotificationCommand } from '../../application/commands/create-notification.command';
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

  // Audit 2026-08-07: was `notificationRepo.save()` — an in-app row only, so "machine stopped"
  // waited for the director to open the app. Routed through CreateNotificationHandler, which
  // applies channel preferences and actually sends (Telegram/email/SMS) + records status.
  constructor(
    private readonly commandBus: CommandBus,
    private readonly routing: NotificationRoutingRepository,
  ) {}

  async handle(event: MroMaintenanceStopEvent): Promise<void> {
    this.logger.log('Machine stopped event received - resolving notification targets via routing rules');

    try {
      // TODO PA2-18: event only carries {maintenanceId, machineId}; equipmentName /
      // issueDescription / priority should be looked up from the maintenance record
      // once StopMachineCommand carries that context.
      const userIdsResult = await this.routing.resolveUserIds(MRO_STOPPED_EVENT_TYPE, MRO_STOPPED_FALLBACK_ROLE);
      const userIds = userIdsResult.ok ? userIdsResult.data : [];

      await Promise.allSettled(
        userIds.map((id) =>
          this.commandBus.execute(
            new CreateNotificationCommand(
              String(id),
              'Equipment Stopped',
              `Machine ${event.machineId} has stopped (maintenance #${event.maintenanceId})`,
              'mro_stopped',
              String(event.maintenanceId),
              'maintenance_order',
            ),
          ),
        ),
      );
    } catch (err: unknown) {
      this.logger.warn(`MroMachineStoppedNotificationListener failed: ${String(err)}`);
    }
  }
}
