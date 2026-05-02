import { Injectable, Inject, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ERP_EVENTS } from '@common/constants/erp-events.constants';
import { MaintenanceOrder } from '../../domain/aggregates/maintenance-order.aggregate';
import { IMaintenanceRepo, MAINTENANCE_REPO } from '../../domain/repositories/i-maintenance.repo';

@Injectable()
export class MachineStoppedListener {
  private readonly logger = new Logger(MachineStoppedListener.name);

  constructor(
    @Inject(MAINTENANCE_REPO) private readonly maintenanceRepo: IMaintenanceRepo,
    private readonly eventEmitter: EventEmitter2,
      ) {}

  @OnEvent(ERP_EVENTS.MRO_MACHINE_STOPPED)
  async handleMachineStopped(payload: {
    equipmentId: string;
    equipmentName: string;
    issueDescription: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    productionOrderId?: string;
  }) {
    this.logger.log('Machine stopped event received - auto-creating maintenance order');

    // Determine priority: high if production is blocked
    let priority = payload.priority;
    if (payload.productionOrderId) {
      priority = 'high';
    }

    // Create new maintenance order
    const order = MaintenanceOrder.createForEquipment(
      payload.equipmentId,
      payload.equipmentName,
      payload.issueDescription,
      priority,
    );

    if (payload.productionOrderId) {
      order.productionOrderAffected = payload.productionOrderId;
    }

    // Save to database
    const saveResult = await this.maintenanceRepo.save(order);

    if (!saveResult.ok) {
      this.logger.error(
        { equipmentId: payload.equipmentId, error: saveResult.error },
        'Failed to create maintenance order',
      );
      return;
    }

    this.logger.log(
      {
        maintenanceOrderId: saveResult.data.id,
        equipmentId: payload.equipmentId,
        productionOrderId: payload.productionOrderId,
      },
      'Maintenance order auto-created from machine stopped event',
    );
  }
}
