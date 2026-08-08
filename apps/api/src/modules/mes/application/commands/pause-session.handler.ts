/**
 * @module pause-session.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 *
 * Cross-module bridge target: other modules dispatch this via CommandBus
 * instead of writing to production_sessions directly -- same convention as
 * QC's ReportDefectCommand (see IotTabletController.reportProductionDefect).
 * First consumer: iot's AnomalyDetectedHandler, on a critical sensor
 * threshold breach.
 *
 * Reuses MesShiftsStatsRepository.pauseSession(), the same atomic
 * status='paused' + stage-clock-freeze UPDATE the MES shift-stats
 * pause/resume endpoints already use (only matches status IN
 * ('running','in_progress')) -- no duplicated SQL, no new table.
 */

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { Result, Ok, Err, AppErr } from '@common/result';
import { MesShiftsStatsRepository } from '../../infrastructure/repositories/mes-shifts-stats.repo';
import { PauseSessionCommand } from './pause-session.command';

type Row = Record<string, unknown>;

@Injectable()
@CommandHandler(PauseSessionCommand)
export class PauseSessionHandler implements ICommandHandler<PauseSessionCommand> {
  private readonly logger = new Logger(PauseSessionHandler.name);

  constructor(private readonly repo: MesShiftsStatsRepository) {}

  async execute(command: PauseSessionCommand): Promise<Result<Row | null>> {
    try {
      const rows = await this.repo.pauseSession(command.sessionId, command.reason);
      const paused = Array.isArray(rows) ? (rows[0] ?? null) : null;

      if (!paused) {
        // Not an error: the session may already be paused/completed, or the
        // id may not exist. pauseSession() only matches running/in_progress
        // rows, so 0 rows back is a legitimate no-op, not a failure.
        this.logger.warn(
          { sessionId: command.sessionId },
          'PauseSessionCommand: no running/in_progress session matched -- nothing paused',
        );
      } else {
        this.logger.warn(
          { sessionId: command.sessionId, reason: command.reason },
          'Production session paused via PauseSessionCommand',
        );
      }
      return Ok(paused);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error({ sessionId: command.sessionId, cause: message }, 'PauseSessionCommand failed');
      return Err(AppErr('INTERNAL', message));
    }
  }
}
