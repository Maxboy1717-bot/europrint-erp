import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Result, Err } from '@common/result';
import { DowntimeEvent } from '../../domain/aggregates/downtime-event.aggregate';
import { DrizzleDowntimeRepository } from '../../infrastructure/repositories/drizzle-downtime.repo';
import { EndDowntimeCommand } from './end-downtime.command';

@Injectable()
@CommandHandler(EndDowntimeCommand)
export class EndDowntimeHandler implements ICommandHandler<EndDowntimeCommand> {
  private readonly logger = new Logger(EndDowntimeHandler.name);

  constructor(
    @Inject('IDowntimeRepository')
    private readonly downtimeRepo: DrizzleDowntimeRepository,
  ) {}

  async execute(command: EndDowntimeCommand): Promise<Result<DowntimeEvent>> {
    const endedAt = command.endedAt || _time.now();

    const endResult = await this.downtimeRepo.endDowntime(command.id, endedAt);
    if (!endResult.ok) {
      this.logger.error(`Failed to end downtime: ${endResult.error}`);
      return Err(endResult.error);
    }

    this.logger.log(
      `Downtime event ended: ${command.id}, duration: ${endResult.data?.durationMinutes} minutes`,
    );
    return { ok: true, data: endResult.data };
  }
}
