/**
 * @module recruiting/helpers
 * @description Barrel re-export. Actual content lives in
 *   `helpers-constants.tsx`, `helpers-atoms.tsx`, and `helpers-dialogs.tsx`
 *   so each file stays under 300 lines.
 */

export type { FunnelStage } from "./helpers-constants";
export {
  STAGES,
  NEXT_STAGE,
  TERMINAL_STAGES,
  HC_PHASES,
  getPhaseForStage,
  CHANNEL_COLORS,
  CHANNEL_LABELS,
  CHANNEL_STATUS_LABELS,
  ALL_CHANNELS,
} from "./helpers-constants";

export {
  DeadlineBadge,
  StatCard,
  HCMethodologyBanner,
  ChannelDots,
  ScoreBar,
  VacancyMarketBadge,
  ProbationCompleteButton,
} from "./helpers-atoms";

export { ChannelStatusPanel } from "./helpers-channel-status";
export { AIInterviewDialog } from "./helpers-dialogs";
