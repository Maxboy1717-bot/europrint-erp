import { Injectable, Logger } from '@nestjs/common';
import { Result, Err, AppErr } from '@common/result';

export interface ExamResult {
  score:   number;
  status:  'passed' | 'failed';
  correct: number;
  total:   number;
  passed:  boolean;
}

@Injectable()
export class LmsExamsService {
  private readonly logger = new Logger(LmsExamsService.name);

  async submitExam(attemptId: number, userId: number): Promise<Result<ExamResult>> {
    this.logger.warn(`submitExam called for attempt ${attemptId} user ${userId} — LMS exam tables not yet provisioned`);
    return Err(AppErr('NOT_FOUND', "LMS exam funksiyasi hali to'liq sozlanmagan"));
  }
}
