import { useQuery } from "@tanstack/react-query";
import { ErrorState } from "@/components/ui/error-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, BookOpen, Award, TrendingUp, RefreshCw } from "lucide-react";
import { StatsCard, StatsCardSkeleton } from "@/components/ui/stats-card";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { OutcomesTab } from "./analytics/OutcomesTab";
import { SystemTab } from "./analytics/SystemTab";
import { LeaderboardTab } from "./analytics/LeaderboardTab";
import { EngagementTab } from "./analytics/EngagementTab";
import { AssessmentTab } from "./analytics/AssessmentTab";
import { CoursesTab, UsersTab, TestsTab, HrTab } from "./analytics/RemainingTabs";
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

export default function Analytics() {
  const { data: stats, isLoading: statsLoading, isError: statsError, refetch: refetchStats } = useQuery<AnalyticsStats>({
    queryKey: ["/api/analytics/stats"],
  });

  const { data: courseProgress = [], isLoading: courseProgressLoading } = useQuery<CourseProgressItem[]>({
    queryKey: ["/api/analytics/course-progress"],
  });

  const { data: userActivity = [], isLoading: userActivityLoading } = useQuery<UserActivityItem[]>({
    queryKey: ["/api/analytics/user-activity"],
  });

  const { data: testResults = [], isLoading: testResultsLoading } = useQuery<TestResultItem[]>({
    queryKey: ["/api/analytics/test-results"],
  });

  const { data: learningOutcomes, isLoading: outcomesLoading } = useQuery<LearningOutcomes>({
    queryKey: ["/api/analytics/learning-outcomes"],
  });

  const { data: funnelData, isLoading: funnelLoading } = useQuery<FunnelData>({
    queryKey: ["/api/analytics/funnel"],
  });

  const { data: departmentStats = [], isLoading: deptStatsLoading } = useQuery<DepartmentStat[]>({
    queryKey: ["/api/analytics/by-department"],
  });

  const { data: positionStats = [], isLoading: posStatsLoading } = useQuery<PositionStat[]>({
    queryKey: ["/api/analytics/by-position"],
  });

  const { data: topEmployees = [], isLoading: topEmpLoading } = useQuery<LeaderboardEmployee[]>({
    queryKey: ["/api/analytics/leaderboard/employees"],
  });

  const { data: departmentRankings = [], isLoading: deptRankLoading } = useQuery<DepartmentRanking[]>({
    queryKey: ["/api/analytics/leaderboard/departments"],
  });

  const { data: topCourses = [], isLoading: topCoursesLoading } = useQuery<TopCourse[]>({
    queryKey: ["/api/analytics/leaderboard/courses"],
  });

  const { data: activeUsers, isLoading: activeUsersLoading } = useQuery<ActiveUsersData>({
    queryKey: ["/api/analytics/engagement/active-users"],
  });

  const { data: activityTrend = [], isLoading: trendLoading } = useQuery<UserActivityItem[]>({
    queryKey: ["/api/analytics/engagement/activity-trend"],
  });

  const { data: retention, isLoading: retentionLoading } = useQuery<RetentionData>({
    queryKey: ["/api/analytics/engagement/retention"],
  });

  const { data: sessionStats, isLoading: sessionLoading } = useQuery<SessionStatsData>({
    queryKey: ["/api/analytics/engagement/sessions"],
  });

  const { data: difficultyData, isLoading: difficultyLoading } = useQuery<DifficultyAnalysis>({
    queryKey: ["/api/analytics/assessment/difficulty"],
  });

  const { data: discriminationData, isLoading: discriminationLoading } = useQuery<DiscriminationData>({
    queryKey: ["/api/analytics/assessment/discrimination"],
  });

  const { data: reliabilityData, isLoading: reliabilityLoading } = useQuery<ReliabilityData>({
    queryKey: ["/api/analytics/assessment/reliability"],
  });

  const { data: itemAnalysis, isLoading: itemAnalysisLoading } = useQuery<ItemAnalysisData>({
    queryKey: ["/api/analytics/assessment/item-analysis"],
  });

  const { data: hrStats, isLoading: hrStatsLoading } = useQuery<HrStats>({
    queryKey: ["/api/hr/dashboard-stats"],
  });

  const { data: expiringCerts = [], isLoading: expiringCertsLoading } = useQuery<ExpiringCert[]>({
    queryKey: ["/api/certificates/expiring", 30],
  });

  const { data: attendanceStats = [], isLoading: attendanceStatsLoading } = useQuery<AttendanceStat[]>({
    queryKey: ["/api/attendance/stats"],
  });

  const { data: retakesNeeded = [], isLoading: retakesLoading } = useQuery<RetakeNeeded[]>({
    queryKey: ["/api/attempts/retakes"],
  });

  const { data: mentorshipsStats, isLoading: mentorshipsLoading } = useQuery<MentorshipsStats>({
    queryKey: ["/api/analytics/mentorships-stats"],
  });

  const { data: eventsStats, isLoading: eventsLoading } = useQuery<EventsStats>({
    queryKey: ["/api/analytics/events-stats"],
  });

  const { data: applicationsStats, isLoading: applicationsLoading } = useQuery<ApplicationsStats>({
    queryKey: ["/api/analytics/applications-stats"],
  });

  const { data: surveysStats, isLoading: surveysLoading } = useQuery<SurveysStats>({
    queryKey: ["/api/analytics/surveys-stats"],
  });

  const { data: broadcastsStats, isLoading: broadcastsLoading } = useQuery<BroadcastsStats>({
    queryKey: ["/api/analytics/broadcasts-stats"],
  });

  const { data: skillsStats, isLoading: skillsLoading } = useQuery<SkillsStats>({
    queryKey: ["/api/analytics/skills-stats"],
  });

  const { data: employeeStats, isLoading: employeeStatsLoading } = useQuery<EmployeeAnalyticsStats>({
    queryKey: ["/api/analytics/employee-stats"],
  });

  const { data: aiAnalysis, isLoading: aiAnalysisLoading } = useQuery<AiAnalysis>({
    queryKey: ["/api/analytics/ai-general-analysis"],
  });

  const { data: scoreDistribution, isLoading: scoreDistLoading } = useQuery<ScoreDistribution>({
    queryKey: ["/api/analytics/score-distribution"],
  });

  const { data: skillsMatrix = [], isLoading: skillsMatrixLoading } = useQuery<SkillsMatrixItem[]>({
    queryKey: ["/api/analytics/skills-matrix"],
  });

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

  if (statsError) {
    return (
      <div className="space-y-6">
        <PageHeader
          label="Europrint ERP · LMS Analitika"
          title="Statistika &"
          boldWord="Analitika"
          subtitle="Xodimlar natijalarini, kurs o'zlashtirish va testlar bo'yicha ma'lumotlar tahlili"
        />
        <ErrorState onRetry={refetchStats} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <PageHeader
          label="Europrint ERP · LMS Analitika"
          title="Statistika &"
          boldWord="Analitika"
          subtitle="Xodimlar natijalarini, kurs o'zlashtirish va testlar bo'yicha ma'lumotlar tahlili"
        />
        <Button variant="outline" size="sm" onClick={() => refetchStats()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Yangilash
        </Button>
      </div>

      {/* ─── Unified KPI Bar ─── */}
      <div
        className="glass-kpi overflow-hidden"
        style={{ boxShadow: "0 2px 12px rgba(15,23,42,0.06)" }}
      >
        {statsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4  md:divide-y-0 divide-x-0 md:divide-x  dark:divide-slate-800">
            {([0,1,2,3]).map(i => (
              <div key={`k-${i}`} className="p-6 space-y-3">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-9 w-28" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4  md:divide-y-0 divide-x-0 md:divide-x  dark:divide-slate-800">
            {([
              { label: "Jami Xodimlar", value: stats?.totalUsers || 0, desc: "Aktiv foydalanuvchilar", icon: Users, accent: "text-blue-500", testId: "stat-card-users" },
              { label: "Kurslar", value: stats?.totalCourses || 0, desc: "Ta'lim resurslari", icon: BookOpen, accent: "text-purple-500", testId: "stat-card-courses" },
              { label: "Testlar", value: stats?.totalTests || 0, desc: "Baholash tizimi", icon: Award, accent: "text-green-500", testId: "stat-card-tests" },
              { label: "O'rtacha Ball", value: `${(stats?.avgTestScore || 0).toFixed(1)}%`, desc: "Test natijalari", icon: TrendingUp, accent: "text-amber-500", testId: "stat-card-avg" },
            ]).map((item, i) => (
              <div key={`k-${i}`} className="p-6" data-testid={item.testId}>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-on-surface-variant dark:text-on-surface-variant leading-none mb-4">
                  {item.label}
                </p>
                <p className="text-4xl font-extrabold text-on-surface dark:text-slate-50 leading-none tracking-tight mb-2">
                  {item.value}
                </p>
                <div className="flex items-center gap-2">
                  <item.icon className={`w-3.5 h-3.5 ${item.accent}`} />
                  <span className="text-xs text-on-surface-variant dark:text-on-surface-variant">{item.desc}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Legacy stats cards — hidden on mobile, shown as fallback */}
      <div className="hidden">
        {statsLoading ? (
          <>
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </>
        ) : (
          <>
            <StatsCard
              title="Jami Xodimlar"
              value={stats?.totalUsers || 0}
              subtitle="Aktiv foydalanuvchilar"
              icon={Users}
              variant="hr"
              data-testid="stat-card-users-hidden"
            />
            <StatsCard
              title="Kurslar"
              value={stats?.totalCourses || 0}
              subtitle={`${stats?.activeCourses || 0} ta aktiv`}
              icon={BookOpen}
              variant="sd"
              data-testid="stat-card-courses"
            />
            <StatsCard
              title="Tugatilgan Kurslar"
              value={stats?.completedCourses || 0}
              subtitle={`${stats?.completionRate || 0}% yakunlangan`}
              icon={Award}
              variant="pp"
              trend={{ value: stats?.completionRate || 0, positive: true }}
              data-testid="stat-card-completed"
            />
            <StatsCard
              title="O'rtacha Ball"
              value={`${stats?.averageScore || 0}%`}
              subtitle="Test natijalari"
              icon={TrendingUp}
              variant="warehouse"
              data-testid="stat-card-score"
            />
          </>
        )}
      </div>

      <Tabs defaultValue="outcomes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="outcomes" data-testid="tab-outcomes">Learning Outcomes</TabsTrigger>
          <TabsTrigger value="system" data-testid="tab-system">Tizim Statistikasi</TabsTrigger>
          <TabsTrigger value="leaderboard" data-testid="tab-leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="engagement" data-testid="tab-engagement">Engagement</TabsTrigger>
          <TabsTrigger value="assessment" data-testid="tab-assessment">Test Sifati</TabsTrigger>
          <TabsTrigger value="hr" data-testid="tab-hr">HR Dashboard</TabsTrigger>
          <TabsTrigger value="courses" data-testid="tab-courses">Kurslar</TabsTrigger>
          <TabsTrigger value="users" data-testid="tab-users">Xodimlar</TabsTrigger>
          <TabsTrigger value="tests" data-testid="tab-tests">Testlar</TabsTrigger>
        </TabsList>

        <TabsContent value="outcomes" className="space-y-4">
          <OutcomesTab
            learningOutcomes={learningOutcomes}
            outcomesLoading={outcomesLoading}
            funnelData={funnelData}
            funnelLoading={funnelLoading}
            scoreDistribution={scoreDistribution}
            scoreDistLoading={scoreDistLoading}
            activityTrend={activityTrend}
            trendLoading={trendLoading}
            departmentStats={departmentStats}
            deptStatsLoading={deptStatsLoading}
            positionStats={positionStats}
            posStatsLoading={posStatsLoading}
            skillsMatrix={skillsMatrix}
            skillsMatrixLoading={skillsMatrixLoading}
          />
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <SystemTab
            mentorshipsStats={mentorshipsStats}
            mentorshipsLoading={mentorshipsLoading}
            eventsStats={eventsStats}
            eventsLoading={eventsLoading}
            applicationsStats={applicationsStats}
            applicationsLoading={applicationsLoading}
            surveysStats={surveysStats}
            surveysLoading={surveysLoading}
            broadcastsStats={broadcastsStats}
            broadcastsLoading={broadcastsLoading}
            skillsStats={skillsStats}
            skillsLoading={skillsLoading}
            employeeStats={employeeStats}
            employeeStatsLoading={employeeStatsLoading}
            aiAnalysis={aiAnalysis}
            aiAnalysisLoading={aiAnalysisLoading}
          />
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-4">
          <LeaderboardTab
            topEmployees={topEmployees}
            topEmpLoading={topEmpLoading}
            departmentRankings={departmentRankings}
            deptRankLoading={deptRankLoading}
            topCourses={topCourses}
            topCoursesLoading={topCoursesLoading}
          />
        </TabsContent>

        <TabsContent value="engagement" className="space-y-4">
          <EngagementTab
            activeUsers={activeUsers}
            activeUsersLoading={activeUsersLoading}
            activityTrend={activityTrend}
            trendLoading={trendLoading}
            retention={retention}
            retentionLoading={retentionLoading}
            sessionStats={sessionStats}
            sessionLoading={sessionLoading}
          />
        </TabsContent>

        <TabsContent value="assessment" className="space-y-4">
          <AssessmentTab
            difficultyData={difficultyData}
            difficultyLoading={difficultyLoading}
            discriminationData={discriminationData}
            discriminationLoading={discriminationLoading}
            reliabilityData={reliabilityData}
            reliabilityLoading={reliabilityLoading}
            itemAnalysis={itemAnalysis}
            itemAnalysisLoading={itemAnalysisLoading}
            COLORS={COLORS}
          />
        </TabsContent>

        <TabsContent value="hr" className="space-y-4">
          <HrTab
            hrStats={hrStats}
            attendanceStats={attendanceStats}
          />
        </TabsContent>

        <TabsContent value="courses" className="space-y-4">
          <CoursesTab
            stats={stats}
            courseProgress={courseProgress}
            activityTrend={activityTrend}
            COLORS={COLORS}
          />
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <UsersTab
            stats={stats}
            learningOutcomes={learningOutcomes}
            userActivity={userActivity}
          />
        </TabsContent>

        <TabsContent value="tests" className="space-y-4">
          <TestsTab
            stats={stats}
            testResults={testResults}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
