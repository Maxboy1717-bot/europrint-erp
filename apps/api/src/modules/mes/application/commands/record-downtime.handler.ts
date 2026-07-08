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
import { MesMaintenanceRepository } from '../../infrastructure/repositories/mes-maintenance.repo';
import { IMesRepository, MES_REPO, DOWNTIME_REPO } from '../../domain/repositories/mes.repository';

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
    @Inject(DOWNTIME_REPO)
    private readonly downtimeRepo: DrizzleDowntimeRepository,
    @Inject(MES_REPO) private readonly mesRepo: IMesRepository,
    private readonly maintenanceRepo: MesMaintenanceRepository,
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

      // VISION 08-mes#37 (Avariya remont): an emergency/breakdown downtime auto-opens
      // a maintenance task for the technician. Best-effort — the repo itself gates on
      // the breakdown marker and dedups, so a failure or a non-emergency reason here
      // must NEVER fail the (already persisted) downtime write.
      try {
        const wc = command.workCenterId;
        const auto = await this.maintenanceRepo.createFromDowntime({
          sessionId: Number(command.sessionId),
          workCenterId: wc != null && Number.isFinite(Number(wc)) ? Number(wc) : null,
          reasonCode: command.reasonCode,
          reasonText: command.notes ?? null,
        });
        if (auto.ok && auto.data.created) {
          this.logger.log(`Avariya remont vazifasi ochildi: task ${auto.data.taskId}`);
        }
      } catch (e) {
        this.logger.warn(`Avariya remont auto-open o'tkazib yuborildi (non-fatal): ${String(e)}`);
      }

      return { ok: true, data: saveResult.data };
  }
}
