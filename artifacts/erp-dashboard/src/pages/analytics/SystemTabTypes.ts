/**
 * @module SystemTabTypes
 * @description Types and interfaces for SystemTab.
 */

export interface MentorInfo {
  mentorName: string;
  menteeCount: number;
}

export interface MentorshipsStats {
  total: number;
  active: number;
  completed: number;
  topMentors?: MentorInfo[];
}

export interface EventTypeItem {
  type: string;
  count: number;
}

export interface EventsStats {
  total: number;
  scheduled: number;
  completed: number;
  byType?: EventTypeItem[];
}

export interface ApplicationsStats {
  totalApplications: number;
  totalResponses: number;
  pendingResponses: number;
  approvedResponses: number;
  rejectedResponses: number;
}

export interface SurveysStats {
  total: number;
  active: number;
  closed: number;
  totalResponses: number;
  responseRate: number;
}

export interface BroadcastsStats {
  total: number;
  totalRecipients: number;
  totalSuccess: number;
  totalFailed: number;
  successRate: number;
}

export interface SkillCategoryItem {
  category: string;
  count: number;
}

export interface SkillsStats {
  totalSkills: number;
  totalUserSkills: number;
  verifiedSkills: number;
  byCategory?: SkillCategoryItem[];
}

export interface EmployeeAnalyticsStats {
  newEmployees: number;
  departedEmployees: number;
  activeEmployees: number;
  nonParticipatingEmployees: number;
  studyingEmployees: number;
}

export interface AiAnalysis {
  analysis?: string;
  generatedAt?: string;
}

export interface SystemTabProps {
  mentorshipsStats: MentorshipsStats | undefined;
  mentorshipsLoading: boolean;
  eventsStats: EventsStats | undefined;
  eventsLoading: boolean;
  applicationsStats: ApplicationsStats | undefined;
  applicationsLoading: boolean;
  surveysStats: SurveysStats | undefined;
  surveysLoading: boolean;
  broadcastsStats: BroadcastsStats | undefined;
  broadcastsLoading: boolean;
  skillsStats: SkillsStats | undefined;
  skillsLoading: boolean;
  employeeStats: EmployeeAnalyticsStats | undefined;
  employeeStatsLoading: boolean;
  aiAnalysis: AiAnalysis | undefined;
  aiAnalysisLoading: boolean;
}
