import { Ok, Err } from '@common/result';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, ForbiddenException, Logger } from '@nestjs/common';
import { Result } from '@common/result';
import { IMesRepository } from '../../domain/repositories/mes.repository';
import { ProductionSession } from '../../domain/aggregates/production-session.aggregate';

export class StartSessionCommand {
  constructor(public sessionId: number,
    public workCenterId: number,
    public operatorId: number) {}
}

@CommandHandler(StartSessionCommand)
export class StartSessionHandler implements ICommandHandler<StartSessionCommand> {
  private readonly logger = new Logger(StartSessionHandler.name);
  constructor(
    @Inject('IMesRepository') private mesRepo: IMesRepository
  ) {}

  async execute(command: StartSessionCommand): Promise<Result<void>> {
    this.logger.log(
      { sessionId: command.sessionId, operatorId: command.operatorId },
      'Starting MES session',
    );

    const sessionResult = await this.mesRepo.getSession(command.sessionId);
    if (!sessionResult.ok) {
      return Err(sessionResult.error);
    }

    const session = sessionResult.data;

    // §8.3 LMS SERTIFIKAT TEKSHIRUVI — HARD BLOCK
    if (session.getCertificationRequired()) {
      this.logger.log(
        { operatorId: command.operatorId, workCenterId: command.workCenterId },
        'Checking LMS certification',
      );

      // In real implementation, fetch workCenter and check certification
      // For now, we assume certification is required for certain work centers
      const certResult = await this.mesRepo.checkOperatorCertification(
        command.operatorId,
        1, // course id placeholder
      );

      const certData = certResult.ok ? certResult.data as { valid?: boolean; courseName?: string; expiresAt?: string } : null;
      if (!certResult.ok || !certData?.valid) {
        const errorMsg = `LMS sertifikati kerak: ${certData?.courseName || 'Noma\'lum kurs'}. Muddati: ${certData?.expiresAt || 'tugagan'}`;
        this.logger.warn({ operatorId: command.operatorId }, errorMsg);
        throw new ForbiddenException(errorMsg);
      }
    }

    // Pass checklist
    const checklistResult = session.passChecklist();
    if (!checklistResult.ok) {
      return checklistResult;
    }

    // Start session
    const startResult = session.start();
    if (!startResult.ok) {
      return startResult;
    }

    const saveResult = await this.mesRepo.saveSession(session);
    if (!saveResult.ok) {
      return Err(saveResult.error);
    }

    this.logger.log('MES session started');
    return Ok(undefined);
  }
}
