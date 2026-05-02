import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { Result, Ok } from '@common/result';
import { StopMachineCommand } from './stop-machine.command';
import { MroMaintenanceStopEvent } from '../../domain/events';

@Injectable()
@CommandHandler(StopMachineCommand)
export class StopMachineHandler implements ICommandHandler<StopMachineCommand> {
  private readonly logger = new Logger(StopMachineHandler.name);

  constructor(
    private readonly eventBus: EventBus,
      ) {}

  async execute(command: StopMachineCommand): Promise<Result<string>> {
      this.eventBus.publish(
        new MroMaintenanceStopEvent(command.maintenanceId, command.machineId),
      );

      this.logger.log(
        { machineId: command.machineId, maintenanceId: command.maintenanceId },
        'Machine stopped for maintenance - Trigger 18: PP reschedules',
      );
      return Ok(command.maintenanceId);
    
  }
}
