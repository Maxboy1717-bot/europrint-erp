/**
 * @module start-session.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { Ok, Err, AppErr } from '@common/result';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { Result } from '@common/result';
import { IMesRepository, MES_REPO, DrizzleExecutor } from '../../domain/repositories/mes.repository';
import { ProductionSession } from '../../domain/aggregates/production-session.aggregate';

export class StartSessionCommand {
  constructor(public sessionId: number,
    public workCenterId: number,
    public operatorId: number,
    public courseId: number = 0) {}
}

@CommandHandler(StartSessionCommand)
export class StartSessionHandler implements ICommandHandler<StartSessionCommand> {
  private readonly logger = new Logger(StartSessionHandler.name);
  constructor(
    @Inject(MES_REPO) private mesRepo: IMesRepository
  ) {}

  async execute(command: StartSessionCommand): Promise<Result<void>> {
    this.logger.log(
      { sessionId: command.sessionId, operatorId: command.operatorId },
      'Starting MES session',
    );

    // PP#3 — bitta stanokda parallel sessiya to'qnashuvini oldini olish. Butun start
    // oqimi bitta tranzaksiyada; work_center bo'yicha advisory xact-lock parallel start'larni
    // serializatsiya qiladi va faol sessiya bo'lsa ikkinchisini rad etadi (poyga oynasi yo'q).
    return this.mesRepo.withTransaction(async (tx) => this.startWithinTx(command, tx));
  }

  private async startWithinTx(
    command: StartSessionCommand,
    tx: DrizzleExecutor,
  ): Promise<Result<void>> {
    const activeResult = await this.mesRepo.lockWorkCenterAndCountActive(
      command.workCenterId,
      command.sessionId,
      tx,
    );
    if (!activeResult.ok) return Err(activeResult.error);
    if (activeResult.data > 0) {
      const msg = `Stanok ${command.workCenterId} band: boshqa sessiya allaqachon ishlamoqda (parallel start rad etildi)`;
      this.logger.warn({ workCenterId: command.workCenterId, sessionId: command.sessionId }, msg);
      return Err(AppErr('CONFLICT', msg));
    }

    const sessionResult = await this.mesRepo.getSession(command.sessionId, tx);
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

      // Real LMS sertifikat dalili (T8-05): mesRepo.checkOperatorCertification
      // operator_certifications ledgerini YOKI haqiqiy dalilni (lms_test_attempts
      // testdan o'tgan + course_progress mavzular tugagan) tekshiradi. Bo'sh = bloklanadi.
      const certResult = await this.mesRepo.checkOperatorCertification(
        command.operatorId,
        command.courseId,
      );

      const certData = certResult.ok ? certResult.data as { valid?: boolean; courseName?: string; expiresAt?: string } : null;
      if (!certResult.ok || !certData?.valid) {
        const errorMsg = `LMS sertifikati kerak: ${certData?.courseName || 'Noma\'lum kurs'}. Muddati: ${certData?.expiresAt || 'tugagan'}`;
        this.logger.warn({ operatorId: command.operatorId }, errorMsg);
        return Err(AppErr('FORBIDDEN', errorMsg));
      }
    }

    // TB-safety / smena-readiness gate (Q-40 — real enforcement, no silent flip):
    // load REQUIRED checklist items from setup_checklists/checklist_items and BLOCK
    // start unless every required item is completed.
    const checklistStatusResult = await this.mesRepo.getChecklistStatus(command.sessionId, tx);
    if (!checklistStatusResult.ok) {
      return Err(checklistStatusResult.error);
    }

    const checklistResult = session.passChecklist(checklistStatusResult.data);
    if (!checklistResult.ok) {
      this.logger.warn(
        { sessionId: command.sessionId, error: checklistResult.error },
        'MES session start BLOCKED — checklist incomplete',
      );
      return checklistResult;
    }

    // Start session
    const startResult = session.start();
    if (!startResult.ok) {
      return startResult;
    }

    const saveResult = await this.mesRepo.saveSession(session, tx);
    if (!saveResult.ok) {
      return Err(saveResult.error);
    }

    // 08-mes #4 — Sessiya boshlanganda amaldagi norma versiyasini muzlatib snapshot qilamiz
    // (retro-buzilmaslik). started_at endi saveSession orqali yozilgan; shu sanada amalda
    // bo'lgan (effective_date <= started_at) versiya production_sessions.norma_version ga
    // yoziladi. Snapshot xatosi/NULL START'ni BLOKLAMAYDI (norma qatori bo'lmasligi mumkin) —
    // faqat log qilinadi, sessiya ishlashda davom etadi (Q-46 regressiya himoyasi).
    const normaSnapshot = await this.mesRepo.snapshotNormaVersion(command.sessionId, tx);
    if (!normaSnapshot.ok) {
      this.logger.warn(
        { sessionId: command.sessionId, error: normaSnapshot.error },
        'Norma versiya snapshot xatoligi (start bloklanmadi)',
      );
    } else {
      this.logger.log(
        { sessionId: command.sessionId, normaVersion: normaSnapshot.data },
        'Norma versiyasi snapshot qilindi',
      );
    }

    this.logger.log('MES session started');
    return Ok(undefined);
  }
}
