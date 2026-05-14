/**
 * @module issue-certificate.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Result, Err } from '@common/result';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LmsRepository } from '../../infrastructure/repositories/drizzle-lms.repo';

export class IssueCertificateCommand {
  constructor(public readonly employeeId: number,
    public readonly courseId: number,
    public readonly courseName: string,
    public readonly validityMonths: number,
    public readonly issuedBy: number) {}
}

@CommandHandler(IssueCertificateCommand)
export class IssueCertificateHandler implements ICommandHandler<IssueCertificateCommand> {
  private readonly logger = new Logger(IssueCertificateHandler.name);

  constructor(
    private readonly lmsRepo: LmsRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(command: IssueCertificateCommand): Promise<Result<Record<string, unknown>>> {
      this.logger.debug(`Issuing certificate - Employee: ${command.employeeId}, Course: ${command.courseName}`);

      const expiresAt = _time.now();
      expiresAt.setMonth(expiresAt.getMonth() + command.validityMonths);

      const result = await this.lmsRepo.saveCertificate(
        {
          employeeId: command.employeeId,
          courseId: command.courseId,
          expiresAt,
          score: null,
        },
        command.issuedBy,
      );

      if (!result.ok) {
        return Err(result.error);
      }

      this.logger.log(`Certificate issued - Employee: ${command.employeeId}, Expires: ${expiresAt.toISOString().split('T')[0]}`);

      this.eventEmitter.emit('lms.certificate.issued', {
        employeeId: command.employeeId,
        courseId: command.courseId,
        expiresAt,
        issuedAt: _time.now(),
      });

      return { ok: true, data: result.data };
  }
}
