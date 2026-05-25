/**
 * @module funnel-helpers
 * @description Private helpers extracted from `funnel.aggregate.ts` to keep
 *   the aggregate file under the 300-line cap (Rule 16). Contains the
 *   state-machine graph and the shared transition / payload validators.
 */

import { Result, Ok, Err, AppErr } from '@common/types/result.type';
import type { FunnelStageValue } from '../value-objects/funnel-stage.vo';

/**
 * The state-machine graph. Source of truth for what counts as a legal
 * stage move. Lifted from the (now-removed) module constant
 * `VALID_TRANSITIONS` in `recruitment-funnel.service.ts`.
 */
export const VALID_TRANSITIONS: Record<FunnelStageValue, FunnelStageValue[]> = {
  NEW:                 ['QUESTIONNAIRE_SENT', 'PHONE_SCREENING', 'REJECTED'],
  QUESTIONNAIRE_SENT:  ['PHONE_SCREENING', 'REJECTED'],
  PHONE_SCREENING:     ['INTERVIEW_SCHEDULED', 'REJECTED'],
  INTERVIEW_SCHEDULED: ['INTERVIEWED', 'REJECTED'],
  INTERVIEWED:         ['TEST_SENT', 'REJECTED'],
  TEST_SENT:           ['TEST_ANALYSIS', 'REJECTED'],
  TEST_ANALYSIS:       ['REFERENCES_CHECK', 'REJECTED'],
  REFERENCES_CHECK:    ['PROBATION', 'OFFER_SENT', 'REJECTED'],
  PROBATION:           ['OFFER_SENT', 'REJECTED'],
  OFFER_SENT:          ['HIRED', 'REJECTED'],
  HIRED:               [],
  REJECTED:            [],
};

/** True if the funnel value is terminal (HIRED / REJECTED). */
export function isTerminalStage(stage: FunnelStageValue): boolean {
  return stage === 'HIRED' || stage === 'REJECTED';
}

/**
 * Assert the funnel is open. Returns Err with INVALID_TRANSITION when
 * the funnel is in a terminal stage.
 */
export function ensureNotClosed(
  currentStage: FunnelStageValue,
  message: string,
): Result<void> {
  if (isTerminalStage(currentStage)) {
    return Err(AppErr('INVALID_TRANSITION', message));
  }
  return Ok();
}

/**
 * Validate that `from → target` is allowed by VALID_TRANSITIONS. Returns
 * Err with INVALID_TRANSITION (including the legal targets) when it isn't.
 */
export function ensureTransitionAllowed(
  from: FunnelStageValue,
  target: FunnelStageValue,
  listAllowedInError = false,
): Result<void> {
  const allowed = VALID_TRANSITIONS[from] ?? [];
  if (allowed.includes(target)) return Ok();
  const detail = listAllowedInError
    ? ` Ruxsat etilgan: [${allowed.join(', ')}]`
    : '';
  return Err(AppErr(
    'INVALID_TRANSITION',
    `${from} bosqichidan ${target} bosqichiga o'tish mumkin emas.${detail}`,
  ));
}

// ─── Payload validators (used by makeOffer / hire / reject) ─────────────────

export function validateRejectReason(reason: unknown): Result<string> {
  if (typeof reason !== 'string' || reason.trim().length === 0) {
    return Err(AppErr('VALIDATION', "Rad etish sababi ko'rsatilishi shart"));
  }
  return Ok(reason);
}

export function validateOfferAmount(amount: unknown): Result<number> {
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
    return Err(AppErr('VALIDATION', `Offer summasi musbat son bo'lishi kerak (got ${amount})`));
  }
  return Ok(amount);
}

export function validateCurrency(currency: unknown): Result<string> {
  if (typeof currency !== 'string' || currency.length !== 3) {
    return Err(AppErr('VALIDATION', `Valyuta kodi 3 belgili bo'lishi kerak (got ${currency})`));
  }
  return Ok(currency.toUpperCase());
}

export function validateStartDate(startDate: unknown): Result<Date> {
  if (!(startDate instanceof Date) || Number.isNaN(startDate.getTime())) {
    return Err(AppErr('VALIDATION', "Ish boshlash sanasi noto'g'ri"));
  }
  return Ok(startDate);
}

export function validateEmployeeId(employeeId: unknown): Result<number> {
  if (
    typeof employeeId !== 'number' ||
    !Number.isInteger(employeeId) ||
    employeeId <= 0
  ) {
    return Err(AppErr('VALIDATION', `Employee id musbat butun son bo'lishi kerak (got ${employeeId})`));
  }
  return Ok(employeeId);
}
