/**
 * OffboardingWorkflowService — pure domain logic for offboarding case lifecycle.
 *
 * Responsibilities:
 *   - Validate state transitions (active → exit_interviewed → completed / cancelled)
 *   - Generate the standard 8-item checklist on case creation
 *   - Compute completion percentage
 *   - Decide whether finalize is allowed (all required checklist items done)
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

/**
 * Standard 8-item exit checklist (EuroPrint policy).
 *
 * 2026-07-13 (owner vision fix): `exit_interview` is now OPTIONAL
 * (required: false). Prior behaviour made the exit interview mandatory to
 * finalize a case, contradicting the vision that HR may skip it (recorded
 * as a "javob bermadi" / no-response turnover category — see
 * HrOffboardingService.recordExitInterview). The checklist ITEM still
 * exists (HR can still record it), it just no longer blocks settlement.
 */
export const STANDARD_OFFBOARDING_CHECKLIST: ReadonlyArray<OffboardingChecklistItem> = [
  { item_key: 'return_laptop',       label: 'Noutbuk topshirish',            required: true,  order_num: 1 },
  { item_key: 'return_badge',        label: 'Korxona propusk topshirish',    required: true,  order_num: 2 },
  { item_key: 'return_keys',         label: 'Ofis kalitlari topshirish',     required: true,  order_num: 3 },
  { item_key: 'revoke_access',       label: 'Tizim accesslarini bekor qilish', required: true,  order_num: 4 },
  { item_key: 'final_payroll',       label: 'So\'ngi maosh hisoblash',       required: true,  order_num: 5 },
  { item_key: 'handover_documents',  label: 'Vazifalarni topshirish',        required: true,  order_num: 6 },
  { item_key: 'exit_interview',      label: 'Exit interview o\'tkazish',     required: false, order_num: 7 },
  { item_key: 'archive_documents',   label: 'Hujjatlarni arxivlash',         required: false, order_num: 8 },
];

// 2026-07-13: 'active' may now transition directly to 'completed' — the exit
// interview is optional, so a case must be finalizable without ever passing
// through 'exit_interviewed' (HR simply never calls recordExitInterview, or
// calls it with `skipped: true`, and finalizes straight from 'active').
const VALID_TRANSITIONS: Record<OffboardingStatus, OffboardingStatus[]> = {
  active:            ['exit_interviewed', 'completed', 'cancelled'],
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
   *   - status must be 'active' or 'exit_interviewed' (not already
   *     completed/cancelled)
   *   - completed_items must be >= number of required checklist items
   *
   * 2026-07-13 (owner vision fix): the exit interview is OPTIONAL and no
   * longer gates finalize. Previously this required status==='exit_interviewed'
   * AND exit_interview_recorded===true, which made the interview mandatory —
   * contradicting the vision (interview optional, "javob bermadi" fallback
   * when skipped). The CONFIRMED-WORKING part of this gate — required
   * checklist items must all be done before settlement — is unchanged.
   */
  canFinalize(
    state: OffboardingCaseState,
    requiredItemsCount = STANDARD_OFFBOARDING_CHECKLIST.filter((i) => i.required).length,
  ): Result<{ progressPercent: number }> {
    if (state.status !== 'active' && state.status !== 'exit_interviewed') {
      return Err(
        AppErr(
          'INVALID_TRANSITION',
          `Faqat active yoki exit_interviewed holatdagi keys yakunlanishi mumkin (joriy: ${state.status})`,
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
   *
   * 2026-07-13 BUG FIX: this list was missing 'resignation' — which is the
   * DEFAULT selection in the live CreateCaseDialog (HROffboardingDialogs.tsx
   * `useState({ dismissalType: "resignation" })`) — and 'contract_end' /
   * 'relocation' / 'other' from the dropdown's DISMISSAL_MAP. Since the Zod
   * DTO (hr-offboarding.dto.ts `_dismissalEnum`) already accepted all of
   * these, this second validation layer silently re-rejected the DTO's own
   * default value: starting a new offboarding case with the default reason
   * (or any of the 3 missing dropdown options) always failed with
   * VALIDATION, even though nothing on screen indicated why.
   */
  validateDismissalType(t: string | undefined): Result<string | undefined> {
    if (!t) return Ok(undefined);
    const allowed = [
      'voluntary', 'termination', 'retirement', 'end_of_contract', 'mutual',
      'resignation', 'contract_end', 'relocation', 'other',
    ];
    if (!allowed.includes(t)) {
      return Err(AppErr('VALIDATION', `dismissal_type qiymati noto'g'ri: ${t}`));
    }
    return Ok(t);
  }
}
