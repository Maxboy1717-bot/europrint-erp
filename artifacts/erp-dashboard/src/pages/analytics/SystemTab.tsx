/**
 * @module SystemTab
 * @description React page component. Route-level UI.
 */

import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import type { SystemTabProps } from "./SystemTabTypes";
import {
  MentorshipsCard,
  EventsCard,
  ApplicationsCard,
  SurveysCard,
  BroadcastsCard,
  SkillsCard,
  EmployeeStatsCard,
  AiAnalysisCard,
} from "./SystemTabSections";

export function SystemTab({
  mentorshipsStats, mentorshipsLoading,
  eventsStats, eventsLoading,
  applicationsStats, applicationsLoading,
  surveysStats, surveysLoading,
  broadcastsStats, broadcastsLoading,
  skillsStats, skillsLoading,
  employeeStats, employeeStatsLoading,
  aiAnalysis, aiAnalysisLoading,
}: SystemTabProps) {
  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => queryClient.invalidateQueries({ queryKey: ["/api"] })}
        className="sr-only"
        aria-label="Yangilash"
      >
        <RefreshCw className="h-4 w-4" />
      </Button>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <MentorshipsCard stats={mentorshipsStats} loading={mentorshipsLoading} />
          <EventsCard stats={eventsStats} loading={eventsLoading} />
          <ApplicationsCard stats={applicationsStats} loading={applicationsLoading} />
          <SurveysCard stats={surveysStats} loading={surveysLoading} />
          <BroadcastsCard stats={broadcastsStats} loading={broadcastsLoading} />
          <SkillsCard stats={skillsStats} loading={skillsLoading} />
          <EmployeeStatsCard stats={employeeStats} loading={employeeStatsLoading} />
        </div>

        <AiAnalysisCard aiAnalysis={aiAnalysis} loading={aiAnalysisLoading} />
      </div>
    </>
  );
}
