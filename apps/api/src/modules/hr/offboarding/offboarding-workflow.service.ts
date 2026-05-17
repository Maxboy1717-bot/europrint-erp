/**
 * OffboardingWorkflowService — pure domain logic for offboarding case lifecycle.
 *
 * Responsibilities:
 *   - Validate state transitions (active → exit_interviewed → completed / cancelled)
 *   - Generate the standard 8-item checklist on case creation
 *   - Compute completion percentage
 *   - Decide whether finalize is allowed (all required items done + interview recorded)
 *
 * No DB / HTTP dependencies — fully unit-testable.
 */
import { Injectable } from '@nestjs/common';
import { Result, Ok, Err, AppErr } from '@common/result';

export type OffboardingStatus =
  | 'active'
  | 'exit_interviewed'
  | 'completed'
  | 'cancelled';

export interface OffboardingChecklistItem {
  item_key: string;
  label: string;
  required: boolean;
  order_num: number;
}

export interface OffboardingCaseState {
  id?: number;
  status: OffboardingStatus;
  total_items: number;
  completed_items: number;
  exit_interview_recorded: boolean;
}

/** Standard 8-item exit checklist (EuroPrint policy). */
export const STANDARD_OFFBOARDING_CHECKLIST: ReadonlyArray<OffboardingChecklistItem> = [
  { item_key: 'return_laptop',       label: 'Noutbuk topshirish',            required: true,  order_num: 1 },
  { item_key: 'return_badge',        label: 'Korxona propusk topshirish',    required: true,  order_num: 2 },
  { item_key: 'return_keys',         label: 'Ofis kalitlari topshirish',     required: true,  order_num: 3 },
  { item_key: 'revoke_access',       label: 'Tizim accesslarini bekor qilish', required: true,  order_num: 4 },
  { item_key: 'final_payroll',       label: 'So\'ngi maosh hisoblash',       required: true,  order_num: 5 },
  { item_key: 'handover_documents',  label: 'Vazifalarni topshirish',        required: true,  order_num: 6 },
  { item_key: 'exit_interview',      label: 'Exit interview o\'tkazish',     required: true,  order_num: 7 },
  { item_key: 'archive_documents',   label: 'Hujjatlarni arxivlash',         required: false, order_num: 8 },
];

const VALID_TRANSITIONS: Record<OffboardingStatus, OffboardingStatus[]> = {
  active:            ['exit_interviewed', 'cancelled'],
  exit_interviewed:  ['completed', 'cancelled'],
  completed:         [],
  cancelled:         [],
};

@Injectable()
export class OffboardingWorkflowService {
  /** Returns the default checklist for a new offboarding case. */
  defaultChecklist(): readonly OffboardingChecklistItem[] {
    return STANDARD_OFFBOARDING_CHECKLIST;
  }

  /**
   * Returns true if the requested transition is allowed for the given status.
   */
  canTransition(from: OffboardingStatus, to: OffboardingStatus): boolean {
    const allowed = VALID_TRANSITIONS[from] ?? [];
    return Array.isArray(allowed) && allowed.includes(to);
  }

  /**
   * Assert a transition is permitted; returns Result<void>.
   */
  assertTransition(
    from: OffboardingStatus,
    to: OffboardingStatus,
  ): Result<{ from: OffboardingStatus; to: OffboardingStatus }> {
    if (!this.canTransition(from, to)) {
      return Err(
        AppErr(
          'INVALID_TRANSITION',
          `Offboarding holatini ${from} dan ${to} ga o'zgartirib bo'lmaydi`,
        ),
      );
    }
    return Ok({ from, to });
  }

  /**
   * Compute the percentage of completed checklist items (0..100, integer).
   * Returns 0 when total_items <= 0.
   */
  computeProgress(state: Pick<OffboardingCaseState, 'total_items' | 'completed_items'>): number {
    const total = Number(state.total_items) || 0;
    const done  = Number(state.completed_items) || 0;
    if (total <= 0) return 0;
    const clamped = Math.min(Math.max(done, 0), total);
    return Math.round((clamped / total) * 100);
  }

  /**
   * Check whether the case is eligible to be finalized:
   *   - status must be exit_interviewed
   *   - exit_interview_recorded must be true
   *   - completed_items must be >= number of required checklist items
   */
  canFinalize(
    state: OffboardingCaseState,
    requiredItemsCount = STANDARD_OFFBOARDING_CHECKLIST.filter((i) => i.required).length,
  ): Result<{ progressPercent: number }> {
    if (state.status !== 'exit_interviewed') {
      return Err(
        AppErr(
          'INVALID_TRANSITION',
          `Faqat exit_interviewed holatdagi keys yakunlanishi mumkin (joriy: ${state.status})`,
        ),
      );
    }
    if (!state.exit_interview_recorded) {
      return Err(
        AppErr(
          'BUSINESS_RULE_VIOLATION',
          'Exit interview yozib olinmagan',
        ),
      );
    }
    if (state.completed_items < requiredItemsCount) {
      return Err(
        AppErr(
          'BUSINESS_RULE_VIOLATION',
          `Majburiy checklist items to'liq emas: ${state.completed_items}/${requiredItemsCount}`,
        ),
      );
    }
    return Ok({ progressPercent: this.computeProgress(state) });
  }

  /**
   * Validate exit interview rating: 1..10, optional but if provided must be in range.
   */
  validateInterviewRating(rating: number | undefined): Result<number | undefined> {
    if (rating === undefined || rating === null) return Ok(undefined);
    if (!Number.isInteger(rating) || rating < 1 || rating > 10) {
      return Err(AppErr('VALIDATION', "rating qiymati 1..10 oraligida bo'lishi kerak"));
    }
    return Ok(rating);
  }

  /**
   * Validate dismissal_type against the allowed enum.
   */
  validateDismissalType(t: string | undefined): Result<string | undefined> {
    if (!t) return Ok(undefined);
    const allowed = ['voluntary', 'termination', 'retirement', 'end_of_contract', 'mutual'];
    if (!allowed.includes(t)) {
      return Err(AppErr('VALIDATION', `dismissal_type qiymati noto'g'ri: ${t}`));
    }
    return Ok(t);
  }
}
