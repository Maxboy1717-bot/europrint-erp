/**
 * @module RecruitingKanbanTypes
 * @description Local types, interfaces, and constants for the RecruitingKanban page.
 */

import type { PipelineEntry, Vacancy } from "@/components/recruiting/types";
import type { FunnelStage } from "@/components/recruiting/helpers";

/** Shape of the new-candidate form state. */
export interface NewCandidateForm {
  fullName: string;
  phone: string;
  email: string;
  source: string;
  notes: string;
  vacancyId: string;
}

/** Shape of the new-vacancy form state. */
export interface NewVacancyForm {
  title: string;
  vacancy_type: string;
  deadline_working_days: number;
}

/** Props passed to the kanban board section. */
export interface KanbanBoardProps {
  isLoading: boolean;
  byStage: (stage: FunnelStage) => PipelineEntry[];
  counts: Record<FunnelStage, number>;
  aiSessions: import("@/components/recruiting/types").AIInterviewSession[];
  vacancyMap: Record<number, Vacancy>;
  expandedCard: number | null;
  setExpandedCard: (id: number | null) => void;
  cpPanelOpen: Set<number>;
  setCpPanelOpen: (val: Set<number>) => void;
  updateMutation: import("@tanstack/react-query").UseMutationResult<unknown, unknown, { id: number; funnel_stage: FunnelStage }, unknown>;
  rejectMutation: import("@tanstack/react-query").UseMutationResult<unknown, unknown, number, unknown>;
  setInterviewEntry: (entry: PipelineEntry | null) => void;
  setJobOfferEntry: (entry: PipelineEntry | null) => void;
  setReportEntry: (entry: PipelineEntry | null) => void;
  setRoadmapEntry: (entry: PipelineEntry | null) => void;
  setPortretVacancy: (v: Vacancy | null) => void;
}

/** Props for the vacancy panel section. */
export interface VacancyPanelProps {
  openVacancies: Vacancy[];
  filterVacancy: string;
  setFilterVacancy: (id: string) => void;
  vacancyPanelOpen: boolean;
  setVacancyPanelOpen: (open: boolean) => void;
  entries: PipelineEntry[];
  channelPanelVacancyId: number | null;
  setChannelPanelVacancyId: (id: number | null) => void;
  setPortretVacancy: (v: Vacancy | null) => void;
  openingContextRoom: number | null;
  handleOpenVacancyChat: (vacancyId: number, vacancyTitle: string) => void;
}

/** Props for the stats bar. */
export interface StatsBarProps {
  entries: PipelineEntry[];
  activeCount: number;
  hiredCount: number;
  rejectedCount: number;
  conversionRate: number;
  openVacancies: Vacancy[];
  urgentVacancies: Vacancy[];
  aiSessionsCount: number;
  probationCount: number;
}

/** Props for the filter bar (probation toggle + active-filter badge). */
export interface FilterBarProps {
  showProbationOnly: boolean;
  setShowProbationOnly: (updater: (prev: boolean) => boolean) => void;
  probationTotalCount: number;
  filterVacancy: string;
  setFilterVacancy: (id: string) => void;
  openVacancies: Vacancy[];
}
