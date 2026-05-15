/**
 * @module Analytics
 * @description React page component. Route-level UI.
 */

import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OutcomesTab } from "./analytics/OutcomesTab";
import { SystemTab } from "./analytics/SystemTab";
import { LeaderboardTab } from "./analytics/LeaderboardTab";
import { EngagementTab } from "./analytics/EngagementTab";
import { AssessmentTab } from "./analytics/AssessmentTab";
import { CoursesTab, UsersTab, TestsTab, HrTab } from "./analytics/RemainingTabs";
import { AnalyticsKpiBar, AnalyticsLegacyStats } from "./AnalyticsSections";
import { ANALYTICS_COLORS } from "./AnalyticsTypes";
import type {
  AnalyticsStats, CourseProgressItem, UserActivityItem, TestResultItem,
  LearningOutcomes, FunnelData, DepartmentStat, PositionStat,
  LeaderboardEmployee, DepartmentRanking, TopCourse,
  ActiveUsersData, RetentionData, SessionStatsData,
  DifficultyAnalysis, DiscriminationData, ReliabilityData, ItemAnalysisData,
  HrStats, ExpiringCert, AttendanceStat, RetakeNeeded,
  MentorshipsStats, EventsStats, ApplicationsStats, SurveysStats,
  BroadcastsStats, SkillsStats, EmployeeAnalyticsStats, AiAnalysis,
  ScoreDistribution, SkillsMatrixItem
} from "./analytics/analytics-types";
import { EPPageHeader, EPErrorState } from "@/components/ep";

import { useTranslation } from '@/lib/i18n';
export default function Analytics() {
  const { t } = useTranslation('common');
  const { data: stats, isLoading: statsLoading, isError, error: statsError, refetch: refetchStats } = useQuery<AnalyticsStats>({ queryKey: ["/api/analytics/stats"] });
  const { data: courseProgress = [], isLoading: courseProgressLoading } = useQuery<CourseProgressItem[]>({ queryKey: ["/api/analytics/course-progress"] });
  const { data: userActivity = [], isLoading: userActivityLoading } = useQuery<UserActivityItem[]>({ queryKey: ["/api/analytics/user-activity"] });
  const { data: testResults = [], isLoading: testResultsLoading } = useQuery<TestResultItem[]>({ queryKey: ["/api/analytics/test-results"] });
  const { data: learningOutcomes, isLoading: outcomesLoading } = useQuery<LearningOutcomes>({ queryKey: ["/api/analytics/learning-outcomes"] });
  const { data: funnelData, isLoading: funnelLoading } = useQuery<FunnelData>({ queryKey: ["/api/analytics/funnel"] });
  const { data: departmentStats = [], isLoading: deptStatsLoading } = useQuery<DepartmentStat[]>({ queryKey: ["/api/analytics/by-department"] });
  const { data: positionStats = [], isLoading: posStatsLoading } = useQuery<PositionStat[]>({ queryKey: ["/api/analytics/by-position"] });
  const { data: topEmployees = [], isLoading: topEmpLoading } = useQuery<LeaderboardEmployee[]>({ queryKey: ["/api/analytics/leaderboard/employees"] });
  const { data: departmentRankings = [], isLoading: deptRankLoading } = useQuery<DepartmentRanking[]>({ queryKey: ["/api/analytics/leaderboard/departments"] });
  const { data: topCourses = [], isLoading: topCoursesLoading } = useQuery<TopCourse[]>({ queryKey: ["/api/analytics/leaderboard/courses"] });
  const { data: activeUsers, isLoading: activeUsersLoading } = useQuery<ActiveUsersData>({ queryKey: ["/api/analytics/engagement/active-users"] });
  const { data: activityTrend = [], isLoading: trendLoading } = useQuery<UserActivityItem[]>({ queryKey: ["/api/analytics/engagement/activity-trend"] });
  const { data: retention, isLoading: retentionLoading } = useQuery<RetentionData>({ queryKey: ["/api/analytics/engagement/retention"] });
  const { data: sessionStats, isLoading: sessionLoading } = useQuery<SessionStatsData>({ queryKey: ["/api/analytics/engagement/sessions"] });
  const { data: difficultyData, isLoading: difficultyLoading } = useQuery<DifficultyAnalysis>({ queryKey: ["/api/analytics/assessment/difficulty"] });
  const { data: discriminationData, isLoading: discriminationLoading } = useQuery<DiscriminationData>({ queryKey: ["/api/analytics/assessment/discrimination"] });
  const { data: reliabilityData, isLoading: reliabilityLoading } = useQuery<ReliabilityData>({ queryKey: ["/api/analytics/assessment/reliability"] });
  const { data: itemAnalysis, isLoading: itemAnalysisLoading } = useQuery<ItemAnalysisData>({ queryKey: ["/api/analytics/assessment/item-analysis"] });
  const { data: hrStats, isLoading: hrStatsLoading } = useQuery<HrStats>({ queryKey: ["/api/hr/dashboard-stats"] });
  const { data: expiringCerts = [], isLoading: expiringCertsLoading } = useQuery<ExpiringCert[]>({ queryKey: ["/api/certificates/expiring", 30] });
  const { data: attendanceStats = [], isLoading: attendanceStatsLoading } = useQuery<AttendanceStat[]>({ queryKey: ["/api/attendance/stats"] });
  const { data: retakesNeeded = [], isLoading: retakesLoading } = useQuery<RetakeNeeded[]>({ queryKey: ["/api/attempts/retakes"] });
  const { data: mentorshipsStats, isLoading: mentorshipsLoading } = useQuery<MentorshipsStats>({ queryKey: ["/api/analytics/mentorships-stats"] });
  const { data: eventsStats, isLoading: eventsLoading } = useQuery<EventsStats>({ queryKey: ["/api/analytics/events-stats"] });
  const { data: applicationsStats, isLoading: applicationsLoading } = useQuery<ApplicationsStats>({ queryKey: ["/api/analytics/applications-stats"] });
  const { data: surveysStats, isLoading: surveysLoading } = useQuery<SurveysStats>({ queryKey: ["/api/analytics/surveys-stats"] });
  const { data: broadcastsStats, isLoading: broadcastsLoading } = useQuery<BroadcastsStats>({ queryKey: ["/api/analytics/broadcasts-stats"] });
  const { data: skillsStats, isLoading: skillsLoading } = useQuery<SkillsStats>({ queryKey: ["/api/analytics/skills-stats"] });
  const { data: employeeStats, isLoading: employeeStatsLoading } = useQuery<EmployeeAnalyticsStats>({ queryKey: ["/api/analytics/employee-stats"] });
  const { data: aiAnalysis, isLoading: aiAnalysisLoading } = useQuery<AiAnalysis>({ queryKey: ["/api/analytics/ai-general-analysis"] });
  const { data: scoreDistribution, isLoading: scoreDistLoading } = useQuery<ScoreDistribution>({ queryKey: ["/api/analytics/score-distribution"] });
  const { data: skillsMatrix = [], isLoading: skillsMatrixLoading } = useQuery<SkillsMatrixItem[]>({ queryKey: ["/api/analytics/skills-matrix"] });

  const pageHeader = (
    <EPPageHeader
        breadcrumb={<>{t("dashboard9")}<b className="text-foreground">{t("statistikaAnalitika")}</b></>}
        title={t("statistikaAnalitika")}
        subtitle={t("xodimlarNatijalariniKursOzlashtirishVa")}
      />
  );

  if (statsError) {
    return (
      <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
        {pageHeader}
        <EPErrorState onRetry={refetchStats} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        {pageHeader}
        <Button variant="outline" size="sm" onClick={() => refetchStats()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          {t("refresh")}
        </Button>
      </div>

      <AnalyticsKpiBar stats={stats} statsLoading={statsLoading} />
      <AnalyticsLegacyStats stats={stats} statsLoading={statsLoading} />

      <Tabs defaultValue="outcomes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="outcomes" data-testid="tab-outcomes">{t("learningOutcomes")}</TabsTrigger>
          <TabsTrigger value="system" data-testid="tab-system">{t("tizimStatistikasi")}</TabsTrigger>
          <TabsTrigger value="leaderboard" data-testid="tab-leaderboard">{t("leaderboard")}</TabsTrigger>
          <TabsTrigger value="engagement" data-testid="tab-engagement">{t("engagement")}</TabsTrigger>
          <TabsTrigger value="assessment" data-testid="tab-assessment">{t("testSifati")}</TabsTrigger>
          <TabsTrigger value="hr" data-testid="tab-hr">{t('hrDashboard2')}</TabsTrigger>
          <TabsTrigger value="courses" data-testid="tab-courses">{t("kurslar")}</TabsTrigger>
          <TabsTrigger value="users" data-testid="tab-users">{t("xodimlar")}</TabsTrigger>
          <TabsTrigger value="tests" data-testid="tab-tests">{t("testlar")}</TabsTrigger>
        </TabsList>

        <TabsContent value="outcomes" className="space-y-4">
          <OutcomesTab
            learningOutcomes={learningOutcomes} outcomesLoading={outcomesLoading}
            funnelData={funnelData} funnelLoading={funnelLoading}
            scoreDistribution={scoreDistribution} scoreDistLoading={scoreDistLoading}
            activityTrend={activityTrend} trendLoading={trendLoading}
            departmentStats={departmentStats} deptStatsLoading={deptStatsLoading}
            positionStats={positionStats} posStatsLoading={posStatsLoading}
            skillsMatrix={skillsMatrix} skillsMatrixLoading={skillsMatrixLoading}
          />
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <SystemTab
            mentorshipsStats={mentorshipsStats} mentorshipsLoading={mentorshipsLoading}
            eventsStats={eventsStats} eventsLoading={eventsLoading}
            applicationsStats={applicationsStats} applicationsLoading={applicationsLoading}
            surveysStats={surveysStats} surveysLoading={surveysLoading}
            broadcastsStats={broadcastsStats} broadcastsLoading={broadcastsLoading}
            skillsStats={skillsStats} skillsLoading={skillsLoading}
            employeeStats={employeeStats} employeeStatsLoading={employeeStatsLoading}
            aiAnalysis={aiAnalysis} aiAnalysisLoading={aiAnalysisLoading}
          />
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-4">
          <LeaderboardTab
            topEmployees={topEmployees} topEmpLoading={topEmpLoading}
            departmentRankings={departmentRankings} deptRankLoading={deptRankLoading}
            topCourses={topCourses} topCoursesLoading={topCoursesLoading}
          />
        </TabsContent>

        <TabsContent value="engagement" className="space-y-4">
          <EngagementTab
            activeUsers={activeUsers} activeUsersLoading={activeUsersLoading}
            activityTrend={activityTrend} trendLoading={trendLoading}
            retention={retention} retentionLoading={retentionLoading}
            sessionStats={sessionStats} sessionLoading={sessionLoading}
          />
        </TabsContent>

        <TabsContent value="assessment" className="space-y-4">
          <AssessmentTab
            difficultyData={difficultyData} difficultyLoading={difficultyLoading}
            discriminationData={discriminationData} discriminationLoading={discriminationLoading}
            reliabilityData={reliabilityData} reliabilityLoading={reliabilityLoading}
            itemAnalysis={itemAnalysis} itemAnalysisLoading={itemAnalysisLoading}
            COLORS={ANALYTICS_COLORS}
          />
        </TabsContent>

        <TabsContent value="hr" className="space-y-4">
          <HrTab hrStats={hrStats} attendanceStats={attendanceStats} />
        </TabsContent>

        <TabsContent value="courses" className="space-y-4">
          <CoursesTab
            stats={stats} courseProgress={courseProgress}
            activityTrend={activityTrend} COLORS={ANALYTICS_COLORS}
          />
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <UsersTab stats={stats} learningOutcomes={learningOutcomes} userActivity={userActivity} />
        </TabsContent>

        <TabsContent value="tests" className="space-y-4">
          <TestsTab stats={stats} testResults={testResults} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
