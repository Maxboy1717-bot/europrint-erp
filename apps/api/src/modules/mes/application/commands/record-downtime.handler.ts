/**
 * @module record-downtime.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { createId } from '@paralleldrive/cuid2';
import { Result, Err } from '@common/result';
import { DowntimeEvent } from '../../domain/aggregates/downtime-event.aggregate';
import { DrizzleDowntimeRepository } from '../../infrastructure/repositories/drizzle-downtime.repo';
import { IMesRepository } from '../../domain/repositories/mes.repository';

export class RecordDowntimeCommand {
  constructor(public readonly sessionId: string,
    public readonly eventType: string,
    public readonly reasonCode: string,
    public readonly reportedBy: string,
    public readonly workCenterId?: string | null,
    public readonly notes?: string | null) {}
}

@Injectable()
@CommandHandler(RecordDowntimeCommand)
export class RecordDowntimeHandler implements ICommandHandler<RecordDowntimeCommand> {
  private readonly logger = new Logger(RecordDowntimeHandler.name);

  constructor(
    @Inject('IDowntimeRepository')
    private readonly downtimeRepo: DrizzleDowntimeRepository,
    @Inject('IMesRepository') private readonly mesRepo: IMesRepository,
  ) {}

  async execute(command: RecordDowntimeCommand): Promise<Result<DowntimeEvent>> {
      if (!command.reasonCode || command.reasonCode.trim().length === 0) {
        return Err('Sabab majburiy');
      }

      const now = _time.now();
      const event = new DowntimeEvent(
        createId(),
        command.sessionId,
        command.workCenterId || null,
        command.eventType,
        command.reasonCode,
        now,
        null,
        null,
        command.reportedBy,
        command.notes || null,
        now,
      );

      const saveResult = await this.downtimeRepo.save(event);
      if (!saveResult.ok) {
        this.logger.error(`Failed to save downtime event: ${saveResult.error}`);
        return Err(saveResult.error);
      }

      this.logger.log(`Downtime event recorded: ${saveResult.data?.id}`);
      return { ok: true, data: saveResult.data };
  }
}
