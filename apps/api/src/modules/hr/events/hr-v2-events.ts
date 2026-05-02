import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
export const HrV2Events = {
  DOCUMENT_SUBMITTED: 'document.submitted',
  DOCUMENT_APPROVED: 'document.approved',
  DOCUMENT_REJECTED: 'document.rejected',
  DOCUMENT_OVERDUE: 'document.overdue',

  DISCIPLINE_ISSUED: 'discipline.issued',
  DISCIPLINE_ACKNOWLEDGED: 'discipline.acknowledged',
  DISCIPLINE_AUTO_BLOCK: 'discipline.auto_block',
  ABSENCE_RECORDED: 'absence.recorded',
  EMPLOYEE_BLOCKED: 'employee.blocked',
  EMPLOYEE_UNBLOCKED: 'employee.unblocked',

  DAILY_REPORT_SUBMITTED: 'daily.report.submitted',
  DAILY_REPORT_OVERDUE: 'daily.report.overdue',
  DAILY_REPORT_REMINDER: 'daily.report.reminder',

  GAMIFICATION_POINTS_AWARDED: 'gamification.points.awarded',
  GAMIFICATION_BADGE_AWARDED: 'gamification.badge.awarded',
  GAMIFICATION_MONTHLY_CHAMPION: 'gamification.monthly.champion',

  CAREER_PATH_PROGRESS: 'career.path.progress_updated',
  CAREER_PATH_COMPLETED: 'career.path.completed',

  SKILL_UPDATED: 'skill.updated',
  SKILL_GAP_DETECTED: 'skill.gap_detected',
  CERTIFICATE_EARNED: 'training.certificate.earned',

  PIP_STARTED: 'pip.started',
  PIP_PROGRESS_UPDATED: 'pip.progress_updated',
  PIP_COMPLETED: 'pip.completed',
  PIP_FAILED: 'pip.failed',

  ENPS_SURVEY_SENT: 'enps.survey_sent',
  ENPS_SURVEY_REMINDER: 'enps.survey_reminder',
  ENPS_RESPONSE_SUBMITTED: 'enps.response_submitted',
  ENPS_RESULTS_READY: 'enps.results_ready',

  VISITOR_CHECKED_IN: 'visitor.checked_in',
  VISITOR_CHECKED_OUT: 'visitor.checked_out',

  SHIFT_ASSIGNED: 'shift.assigned',
  SHIFT_SWAP_REQUESTED: 'shift.swap_requested',
  SHIFT_SWAP_APPROVED: 'shift.swap_approved',
  SHIFT_REMINDER: 'shift.reminder',

  OFFBOARDING_STARTED: 'offboarding.started',
  OFFBOARDING_COMPLETED: 'offboarding.completed',
  OFFBOARDING_AUTO_BLOCK: 'offboarding.auto_block',

  AI_INTERVIEW_STARTED: 'ai.interview.started',
  AI_INTERVIEW_COMPLETED: 'ai.interview.completed',
  AI_INTERVIEW_CANCELLED: 'ai.interview.cancelled',

  VACANCY_CREATED: 'recruitment.vacancy_created',
  VACANCY_PUBLISHED: 'recruitment.vacancy_published',
  VACANCY_PUBLISHED_INTERNAL: 'recruitment.vacancy_published_internal',
  CANDIDATE_HIRED: 'recruitment.candidate_hired',
  CANDIDATE_ARCHIVED: 'recruitment.candidate_archived',

  TELEGRAM_SEND: 'telegram.send',
  TELEGRAM_BROADCAST: 'telegram.broadcast',

  ATTENDANCE_LATE: 'attendance.late',
  ADAPTATION_AT_RISK: 'adaptation.at_risk',
  ADAPTATION_COMPLETED: 'adaptation.completed',
} as const;

export type HrV2EventName = typeof HrV2Events[keyof typeof HrV2Events];

export class HrV2EventPayload<T = Record<string, unknown>> {
  constructor(
    public readonly event: HrV2EventName,
    public readonly data: T,
    public readonly employeeId?: number,
    public readonly triggeredAt: Date = _time.now(),
  ) {}
}
