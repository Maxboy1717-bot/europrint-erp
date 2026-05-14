/**
 * @module RecruitingKanbanDialogs
 * @description All dialog/modal components used by the RecruitingKanban page.
 */

import React from "react";
import type { PipelineEntry, Vacancy } from "@/components/recruiting/types";
import { VacancyPortretDialog } from "./VacancyPortretDialog";
import { ProductivityInterviewDialog } from "./ProductivityInterviewDialog";
import { JobOfferDialog } from "@/components/hr/JobOfferDialog";
import { LaborMarketSheet } from "@/components/hr/LaborMarketSheet";
import { CandidateReportDialog } from "./CandidateReportDialog";
import { OnboardingRoadmapDialog } from "@/components/hr/OnboardingRoadmapDialog";

interface RecruitingKanbanDialogsProps {
  portretVacancy: Vacancy | null;
  setPortretVacancy: (v: Vacancy | null) => void;

  interviewEntry: PipelineEntry | null;
  setInterviewEntry: (entry: PipelineEntry | null) => void;

  jobOfferEntry: PipelineEntry | null;
  setJobOfferEntry: (entry: PipelineEntry | null) => void;

  marketVacancy: Vacancy | null;
  setMarketVacancy: (v: Vacancy | null) => void;

  reportEntry: PipelineEntry | null;
  setReportEntry: (entry: PipelineEntry | null) => void;

  roadmapEntry: PipelineEntry | null;
  setRoadmapEntry: (entry: PipelineEntry | null) => void;
}

export function RecruitingKanbanDialogs({
  portretVacancy,
  setPortretVacancy,
  interviewEntry,
  setInterviewEntry,
  jobOfferEntry,
  setJobOfferEntry,
  marketVacancy,
  setMarketVacancy,
  reportEntry,
  setReportEntry,
  roadmapEntry,
  setRoadmapEntry,
}: RecruitingKanbanDialogsProps) {
  return (
    <>
      {portretVacancy && (
        <VacancyPortretDialog
          vacancyId={portretVacancy.id}
          vacancyTitle={portretVacancy.title}
          isUrgent={portretVacancy.is_urgent}
          open={!!portretVacancy}
          onClose={() => setPortretVacancy(null)}
        />
      )}

      {interviewEntry && (
        <ProductivityInterviewDialog
          candidateId={interviewEntry.candidate_id}
          candidateName={interviewEntry.candidate_name}
          funnelId={interviewEntry.id}
          open={!!interviewEntry}
          onClose={() => setInterviewEntry(null)}
        />
      )}

      {jobOfferEntry && (
        <JobOfferDialog
          open={!!jobOfferEntry}
          onOpenChange={(open) => { if (!open) setJobOfferEntry(null); }}
          candidateId={jobOfferEntry.candidate_id}
          candidateName={jobOfferEntry.candidate_name}
          funnelId={jobOfferEntry.id}
          vacancyTitle={jobOfferEntry.vacancy_title}
        />
      )}

      {marketVacancy && (
        <LaborMarketSheet
          vacancyId={marketVacancy.id}
          vacancyTitle={marketVacancy.title}
          open={!!marketVacancy}
          onOpenChange={(open) => { if (!open) setMarketVacancy(null); }}
        />
      )}

      {reportEntry && (
        <CandidateReportDialog
          open={!!reportEntry}
          onClose={() => setReportEntry(null)}
          pipelineEntryId={reportEntry.id}
          candidateName={reportEntry.candidate_name}
        />
      )}

      {roadmapEntry && (
        <OnboardingRoadmapDialog
          open={!!roadmapEntry}
          onClose={() => setRoadmapEntry(null)}
          pipelineEntryId={roadmapEntry.id}
          candidateName={roadmapEntry.candidate_name}
          vacancyTitle={roadmapEntry.vacancy_title}
        />
      )}
    </>
  );
}
