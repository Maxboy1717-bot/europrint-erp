/**
 * @module machine-stopped.listener
 * @description Source module. See exports for details.
 */

import { Injectable, Inject, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { MroMaintenanceStopEvent } from '../../domain/events';
import { MaintenanceOrder } from '../../domain/aggregates/maintenance-order.aggregate';
import { IMaintenanceRepo, MAINTENANCE_REPO } from '../../domain/repositories/i-maintenance.repo';

/**
 * PA2-18 Wave 6: converted from string-keyed @OnEvent(ERP_EVENTS.MRO_MACHINE_STOPPED)
 *   to canonical @EventsHandler(MroMaintenanceStopEvent). The MRO event class is
 *   the single source of truth; the EventBridge re-emits to any straggler
 *   @OnEvent listeners.
 *
 *   The previous payload shape carried richer fields (equipmentName,
 *   issueDescription, priority, productionOrderId) that the publisher
 *   (stop-machine.handler.ts) doesn't actually emit yet. This handler now
 *   creates a stub maintenance order keyed on machineId; richer fields are
 *   left as TODO until StopMachineCommand carries them.
 */
@Injectable()
@EventsHandler(MroMaintenanceStopEvent)
export class MachineStoppedListener implements IEventHandler<MroMaintenanceStopEvent> {
  private readonly logger = new Logger(MachineStoppedListener.name);

  constructor(
    @Inject(MAINTENANCE_REPO) private readonly maintenanceRepo: IMaintenanceRepo,
  ) {}

  async handle(event: MroMaintenanceStopEvent): Promise<void> {
    this.logger.log('Machine stopped event received - auto-creating maintenance order');

    // TODO PA2-18: MroMaintenanceStopEvent only carries {maintenanceId, machineId};
    // backfill equipmentName/issueDescription/priority from the maintenance record
    // looked up by maintenanceId once StopMachineCommand carries that context.
    const order = MaintenanceOrder.createForEquipment(
      event.machineId,
      event.machineId,
      'Auto-generated maintenance order from MroMaintenanceStopEvent',
      'high',
    );

    const saveResult = await this.maintenanceRepo.save(order);

    if (!saveResult.ok) {
      this.logger.error(
        { equipmentId: event.machineId, error: saveResult.error },
        'Failed to create maintenance order',
      );
      return;
    }

    this.logger.log(
      {
        maintenanceOrderId: saveResult.data.id,
        equipmentId: event.machineId,
        maintenanceId: event.maintenanceId,
      },
      'Maintenance order auto-created from machine stopped event',
    );
  }
}
