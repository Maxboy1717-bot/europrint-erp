import { Injectable, Logger, Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { IPpRepository } from '../../domain/repositories/pp.repository';

export interface MroStopEvent {
  workCenterId: number;
  maintenanceId: number;
  startDate: Date;
  endDate: Date;
}

@Injectable()
export class MroStopListener {
  private readonly logger = new Logger(MroStopListener.name);

  constructor(@Inject('IPpRepository') private readonly ppRepo: IPpRepository) {}

  @OnEvent('MRO_MAINTENANCE_STOP')
  async handle(event: MroStopEvent) {
    this.logger.log(
      { workCenterId: event.workCenterId, maintenanceId: event.maintenanceId },
      'Trigger 18: MRO maintenance stop - Rescheduling PP',
    );

    const plan = await this.ppRepo.getMachineLoad(event.workCenterId);
    if (!plan.ok) {
      this.logger.error(plan.error, 'Failed to get machine load for rescheduling');
      return;
    }

    this.logger.log(
      { workCenterId: event.workCenterId, affectedOperations: plan.data.length },
      'PP rescheduling initiated',
    );
  }
}
