/**
 * @module mro-stop.listener
 * @description PA2-18: canonical CQRS @EventsHandler form. Listens for
 *   MroMaintenanceStopEvent (published by mro/stop-machine.handler) and
 *   triggers PP rescheduling. Trigger 18.
 */

import { Injectable, Logger, Inject } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { IPpRepository, PP_REPO } from '../../domain/repositories/pp.repository';
import { MroMaintenanceStopEvent } from '@modules/mro/domain/events';
import { PpFailoverService } from '../../application/services/pp-failover.service';

@Injectable()
@EventsHandler(MroMaintenanceStopEvent)
export class MroStopListener implements IEventHandler<MroMaintenanceStopEvent> {
  private readonly logger = new Logger(MroStopListener.name);

  constructor(
    @Inject(PP_REPO) private readonly ppRepo: IPpRepository,
    private readonly failover: PpFailoverService,
  ) {}

  async handle(event: MroMaintenanceStopEvent): Promise<void> {
    const workCenterIdNum = Number(event.machineId);
    this.logger.log(
      { workCenterId: workCenterIdNum, maintenanceId: event.maintenanceId },
      'Trigger 18: MRO maintenance stop - Rescheduling PP',
    );

    if (!Number.isFinite(workCenterIdNum)) {
      this.logger.warn(
        { machineId: event.machineId },
        'Trigger 18: machineId is not numeric — skip reschedule',
      );
      return;
    }

    const plan = await this.ppRepo.getMachineLoad(workCenterIdNum);
    if (!plan.ok) {
      this.logger.error(plan.error, 'Failed to get machine load for rescheduling');
      return;
    }

    this.logger.log(
      { workCenterId: workCenterIdNum, affectedOperations: plan.data.length },
      'PP rescheduling initiated',
    );

    // 07-pp#24: machine down -> re-route ops that declare an alternative work-center,
    // then recompute CRP so the planner sees the new capacity picture immediately.
    const failed = await this.failover.failoverOnDowntime(workCenterIdNum);
    if (!failed.ok) {
      this.logger.error(failed.error, 'Trigger 18: alternative-work-center fail-over failed');
      return;
    }
    this.logger.log(
      { workCenterId: workCenterIdNum, reroutedOperations: failed.data.reroutedCount },
      'Trigger 18: fail-over to alternative work-centers + CRP recompute complete',
    );
  }
}
