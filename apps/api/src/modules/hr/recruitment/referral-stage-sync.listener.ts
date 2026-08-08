/**
 * @module referral-stage-sync.listener
 * @description Referral Tizimi completion (2026-07-13, vizyon docs/vision/_parts/
 * 02-hr.md #12/#20/#21, item #3 — "link PATCH to the recruiting-pipeline module
 * via candidate_id").
 *
 * Subscribes to the REAL, already-firing `CANDIDATE_STAGE_CHANGED_EVENT`
 * ('candidate.stage-changed', emitted by RecruitmentFunnelService.moveStage()/
 * hire()/reject()) and keeps `hr_referrals.status` in sync for any referral row
 * that has been linked to a `candidates.id` via `hr_referrals.candidate_id`
 * (set manually today by HR through `POST /hr/referrals` `candidateId` or
 * `PATCH /hr/referrals/:id` `candidateId` — see hr-gsd.controller.ts).
 *
 * NOTE on `HrV2Events.CANDIDATE_HIRED`: that constant exists
 * (hr-v2-events.ts) and has one dead consumer (telegram-bots-pip-events.service.ts)
 * but is never actually emitted anywhere in the codebase, and
 * `RecruitmentFunnelService`'s HIRED transition currently calls
 * `aggregate.hire(placeholderEmployeeId)` — a PLACEHOLDER, not the real
 * employees.id (recruitment-funnel.service.ts:184). Wiring `hired_employee_id`
 * off either of those would fabricate a link (Q-40) and is squarely the
 * recruiting-pipeline module's own fix (another agent's parallel scope) — not
 * duplicated here. Until that lands, HR sets `hired_employee_id` explicitly via
 * `PATCH /hr/referrals/:id` once the real employees row exists; this listener
 * only auto-syncs the funnel-stage-derived `status`, which needs no employeeId.
 *
 * Failures are caught + logged, never thrown back onto the event bus.
 */

import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { HrGsdRepository } from '../presentation/hr-gsd.repository';
import { CANDIDATE_STAGE_CHANGED_EVENT, type CandidateStageChangedPayload } from './recruitment-funnel.service';

/** recruitment_funnel_stage (lib/db/src/schema/hr-recruiter.ts) -> hr_referrals.status
 * (live hr_referrals_status_check: pending|contacted|interviewing|hired|rejected|bonus_paid). */
const STAGE_TO_REFERRAL_STATUS: Record<string, string> = {
  NEW:                  'contacted',
  QUESTIONNAIRE_SENT:   'contacted',
  PHONE_SCREENING:      'contacted',
  INTERVIEW_SCHEDULED:  'interviewing',
  INTERVIEWED:          'interviewing',
  TEST_SENT:            'interviewing',
  TEST_ANALYSIS:        'interviewing',
  REFERENCES_CHECK:     'interviewing',
  PROBATION:            'interviewing',
  OFFER_SENT:           'interviewing',
  HIRED:                'hired',
  REJECTED:             'rejected',
};

@Injectable()
export class ReferralStageSyncListener {
  private readonly logger = new Logger(ReferralStageSyncListener.name);

  constructor(private readonly repo: HrGsdRepository) {}

  @OnEvent(CANDIDATE_STAGE_CHANGED_EVENT)
  async onCandidateStageChanged(payload: CandidateStageChangedPayload): Promise<void> {
    try {
      if (!payload?.candidateId) return; // no candidate linkage possible
      const status = STAGE_TO_REFERRAL_STATUS[payload.toStage];
      if (!status) return; // unmapped stage — leave referral status untouched

      const r = await this.repo.updateReferralStatusByCandidateId(payload.candidateId, status);
      if (r.ok && r.data > 0) {
        this.logger.log(`Referral(s) for candidate #${payload.candidateId} synced to status='${status}' (funnel stage=${payload.toStage})`);
      }
    } catch (e) {
      this.logger.error(`ReferralStageSyncListener failed for candidateId=${payload?.candidateId}: ${String(e)}`);
    }
  }
}
