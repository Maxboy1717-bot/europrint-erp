import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { HrOffboardingRepository } from './hr-offboarding.repository';
import {
  OffboardingWorkflowService,
  type OffboardingCaseState,
  type OffboardingStatus,
} from './offboarding-workflow.service';
import { HrV2Events } from '../events/hr-v2-events';
import { Result, Ok, Err, AppErr } from '@common/result';

type Row = Record<string, unknown>;

interface CreateCaseInput {
  employeeId: number;
  dismissalType?: string;
  lastWorkingDay?: string;
  initiatedBy?: number;
}

interface ExitInterviewInput {
  // Live-UI shape (HROffboardingInterview.tsx / OffboardingTabDialogs.tsx EXIT_QUESTIONS).
  answers?: Record<string, string>;
  // Explicit "skip" — vision: exit interview is OPTIONAL, not blocking.
  skipped?: boolean;
  // Legacy flat shape (back-compat API callers).
  rating?: number;
  wouldReturn?: boolean;
  mainReason?: string;
  feedback?: string;
  improvements?: string;
}

/** Mirrors the frontend's EXIT_QUESTIONS (HROffboardingTypes.ts). */
const REQUIRED_EXIT_ANSWER_KEYS = [
  'reason_for_leaving', 'management_rating', 'environment_rating', 'would_recommend',
];

/** Fallback "did not respond" turnover category — vision-required (2026-07-13). */
const NO_RESPONSE_REASON = 'Javob bermadi';

@Injectable()
export class HrOffboardingService {
  private readonly logger = new Logger(HrOffboardingService.name);

  constructor(
    private readonly repo: HrOffboardingRepository,
    private readonly workflow: OffboardingWorkflowService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /** Create a new offboarding case + seed the standard checklist. */
  async createCase(input: CreateCaseInput): Promise<Result<Row>> {
    const dismissalCheck = this.workflow.validateDismissalType(input.dismissalType);
    if (!dismissalCheck.ok) return dismissalCheck as Result<Row>;

    // Guard against two concurrent active cases for the same employee — the
    // live CreateCaseDialog already has an onError branch for this ("Bu
    // xodim uchun faol offboarding jarayoni mavjud"), but nothing produced
    // the error before this fix.
    const existing = await this.repo.findActiveCaseByEmployee(input.employeeId);
    if (existing.ok && existing.data) {
      return Err(AppErr('CONFLICT', 'Bu xodim uchun faol offboarding jarayoni already exists'));
    }

    const checklist = this.workflow.defaultChecklist();
    const created = await this.repo.createCase({
      employeeId:      input.employeeId,
      dismissalType:   input.dismissalType,
      lastWorkingDay:  input.lastWorkingDay,
      totalItems:      checklist.length,
      initiatedBy:     input.initiatedBy,
    });
    if (!created.ok) return created;

    const caseRow = created.data as Row;
    const caseId  = Number(caseRow['id'] ?? 0);
    if (caseId <= 0) {
      return Err(AppErr('INTERNAL', "Yangi case id qaytarilmadi"));
    }

    const seeded = await this.repo.insertChecklistItems(caseId, checklist);
    if (!seeded.ok) return seeded as unknown as Result<Row>;

    this.eventEmitter.emit(HrV2Events.OFFBOARDING_STARTED, {
      caseId,
      employeeId:    input.employeeId,
      dismissalType: input.dismissalType,
      initiatedBy:   input.initiatedBy,
    });

    return Ok({ ...caseRow, checklist_items: seeded.data, checklist: seeded.data });
  }

  async listCases(
    filters: { status?: string; employeeId?: number; search?: string } = {},
  ): Promise<Result<Row[]>> {
    return this.repo.listCases(filters);
  }

  async getCaseDetail(caseId: number): Promise<Result<Row | null>> {
    const caseR = await this.repo.findCaseDetailById(caseId);
    if (!caseR.ok) return caseR;
    if (!caseR.data) return Ok(null);
    const items = await this.repo.listChecklistItems(caseId);
    const itemsArr = items.ok && Array.isArray(items.data) ? items.data : [];
    const total = Number((caseR.data as Row)['total_items'] ?? itemsArr.length);
    const completed = Number((caseR.data as Row)['completed_items'] ?? 0);
    const progress = this.workflow.computeProgress({ total_items: total, completed_items: completed });
    // `checklist` is what the live UI reads (HROffboardingSteps.tsx / OffboardingTab.tsx);
    // `checklist_items` kept alongside for any back-compat callers.
    return Ok({ ...caseR.data, checklist: itemsArr, checklist_items: itemsArr, progress_percent: progress });
  }

  updateChecklistItem(
    caseId: number,
    itemId: number,
    done: boolean,
    opts: { notes?: string; returnStatus?: string; doneBy?: number } = {},
  ): Promise<Result<Row>> {
    return this.repo.updateChecklistItem(caseId, itemId, done, opts);
  }

  /**
   * Record the exit interview — or an explicit skip. Transitions
   * active → exit_interviewed either way.
   *
   * Vision fix (2026-07-13): the exit interview is OPTIONAL. It no longer
   * blocks `finalizeCase` (see OffboardingWorkflowService.canFinalize).
   * When skipped (or no answers at all were given), the turnover "reason"
   * is recorded as "Javob bermadi" (did not respond) instead of being left
   * null/absent — a real, queryable turnover category rather than a gap.
   */
  async recordExitInterview(caseId: number, input: ExitInterviewInput): Promise<Result<Row>> {
    const ratingCheck = this.workflow.validateInterviewRating(input.rating);
    if (!ratingCheck.ok) return ratingCheck as Result<Row>;

    const caseR = await this.repo.findCaseById(caseId);
    if (!caseR.ok) return caseR as Result<Row>;
    if (!caseR.data) return Err(AppErr('NOT_FOUND', `Offboarding case #${caseId} topilmadi`));
    const status = String((caseR.data as Row)['status'] ?? 'active') as OffboardingStatus;

    const trans = this.workflow.assertTransition(status, 'exit_interviewed');
    if (!trans.ok) return trans as unknown as Result<Row>;

    const answers = input.answers && typeof input.answers === 'object' ? input.answers : {};
    const hasAnyAnswer = Object.values(answers).some((v) => String(v ?? '').trim() !== '');
    const skipped = input.skipped === true || (!hasAnyAnswer && !input.mainReason);

    const missingAnswers = REQUIRED_EXIT_ANSWER_KEYS.filter(
      (k) => String(answers[k] ?? '').trim() === '',
    );
    const answersComplete = !skipped && missingAnswers.length === 0;
    // Informational only now (Q-40 vision fix) — no longer a hard finalize gate.
    const blocksSettlement = !skipped && !answersComplete;

    const reason = skipped
      ? NO_RESPONSE_REASON
      : (answers['reason_for_leaving']?.trim() || input.mainReason?.trim() || NO_RESPONSE_REASON);

    const notes = JSON.stringify({
      answers,
      skipped,
      rating: ratingCheck.data ?? null,
      would_return: input.wouldReturn ?? null,
      main_reason: input.mainReason ?? null,
      feedback: input.feedback ?? null,
      improvements: input.improvements ?? null,
    });

    const recorded = await this.repo.recordExitInterview(caseId, { notes, reason, blocksSettlement });
    if (!recorded.ok) return recorded;

    // Mark the (now-optional) 'exit_interview' checklist item done — HR
    // addressed it either way (answered or explicitly skipped).
    const item = await this.repo.findChecklistItemByKey(caseId, 'exit_interview');
    if (item.ok && item.data) {
      const itemId = Number((item.data as Row)['id'] ?? 0);
      if (itemId > 0) {
        await this.repo.updateChecklistItem(caseId, itemId, true, {
          notes: skipped ? NO_RESPONSE_REASON : undefined,
        });
      }
    }

    return Ok({ ...(recorded.data as Row), answersComplete, blocksSettlement, missingAnswers });
  }

  /** Finalize the case: completed_items must cover all required items. Exit interview is optional. */
  async finalizeCase(caseId: number): Promise<Result<Row>> {
    const caseR = await this.repo.findCaseById(caseId);
    if (!caseR.ok) return caseR as Result<Row>;
    if (!caseR.data) return Err(AppErr('NOT_FOUND', `Offboarding case #${caseId} topilmadi`));

    const row = caseR.data as Row;
    const state: OffboardingCaseState = {
      id: Number(row['id'] ?? 0),
      status: String(row['status'] ?? 'active') as OffboardingStatus,
      total_items: Number(row['total_items'] ?? 0),
      completed_items: Number(row['completed_items'] ?? 0),
      exit_interview_recorded: String(row['status'] ?? '') === 'exit_interviewed',
    };
    const eligible = this.workflow.canFinalize(state);
    if (!eligible.ok) return eligible as unknown as Result<Row>;

    const finalized = await this.repo.finalizeCase(caseId);
    if (finalized.ok) {
      this.eventEmitter.emit(HrV2Events.OFFBOARDING_COMPLETED, {
        caseId,
        employeeId: Number(row['employee_id'] ?? 0),
      });
    }
    return finalized;
  }

  /** Cancel an offboarding case (allowed only from active / exit_interviewed). */
  async cancelCase(caseId: number, reason?: string): Promise<Result<Row>> {
    const caseR = await this.repo.findCaseById(caseId);
    if (!caseR.ok) return caseR as Result<Row>;
    if (!caseR.data) return Err(AppErr('NOT_FOUND', `Offboarding case #${caseId} topilmadi`));
    const status = String((caseR.data as Row)['status'] ?? 'active') as OffboardingStatus;
    const trans = this.workflow.assertTransition(status, 'cancelled');
    if (!trans.ok) return trans as unknown as Result<Row>;

    const result = await this.repo.updateStatus(caseId, 'cancelled');
    if (result.ok && reason) {
      this.logger.log(`Offboarding case #${caseId} cancelled: ${reason}`);
    }
    return result;
  }

  getStats(): Promise<Result<{ active: number; completed: number; cancelled: number }>> {
    return this.repo.stats();
  }
}
