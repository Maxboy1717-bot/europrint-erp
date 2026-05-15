/**
 * @module LMSDashboard
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatsCardSkeleton } from "@/components/ui/stats-card";
import { BookOpen, Users, Award, TrendingUp, BarChart3, Activity, Clock, CheckCircle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ModulePage } from "@/components/ui/module-page";
import { useTranslation } from "@/lib/i18n";
import { GamificationTab } from "./lms-dashboard/GamificationTab";
import { SkillsGapTab } from "./lms-dashboard/SkillsGapTab";
import { EPErrorState, EPPageHeader } from "@/components/ep";

interface Course { id: string; name: string; enrolledCount: number; completionRate: number; }
interface Certificate { id: string; userId: string; courseId: string; issuedDate: string; userName: string; courseName: string; }
interface User { id: string; fullName: string; completedCourses?: number; }
interface ActivityRecord { id: string; type: "enrollment" | "completion" | "test"; description: string; timestamp: string; userName: string; }
interface LMSLeaderboardEntry { userId: string; fullName: string; completedLessons: number; completedCourses: number; averageScore: number; passedTests: number; overallScore: number; }
interface LmsExam { id: string; title: string; courseId: number | null; durationMinutes: number; passingScore: number; isActive: boolean; }
interface LmsProgress { completedCourses: number; totalCourses: number; averageScore: number; examsPassed: number; examsFailed: number; }

export default function LMSDashboard() {
  const { t, language, setLanguage } = useTranslation('lms');
  const { t: tCommon } = useTranslation('common');
  const [activeTab, setActiveTab] = useState("overview");

  const { data: courses = [], isLoading: isLoadingCourses, isError, error, refetch } = useQuery<Course[]>({ queryKey: ["/api/courses"], select: (data: unknown) => Array.isArray(data) ? data : ((data as { data?: Course[] })?.data ?? []) });
  const { data: certificates = [], isLoading: isLoadingCertificates } = useQuery<Certificate[]>({ queryKey: ["/api/certificates"], select: (data: unknown) => Array.isArray(data) ? data : ((data as { data?: Certificate[] })?.data ?? []) });
  const { data: users = [], isLoading: isLoadingUsers } = useQuery<User[]>({ queryKey: ["/api/users"], select: (data: unknown) => Array.isArray(data) ? data : ((data as { data?: User[] })?.data ?? []) });
  const { data: completionTrend = [] } = useQuery<{ month: string; completed: number; enrolled: number }[]>({ queryKey: ["/api/courses/completion-trend", language] });
  const { data: recentActivity = [] } = useQuery<ActivityRecord[]>({ queryKey: ["/api/lms/recent-activity", language] });
  const { data: lmsLeaderboard = [], isLoading: isLoadingLeaderboard } = useQuery<LMSLeaderboardEntry[]>({ queryKey: ["/api/analytics/leaderboard/employees"], select: (data: unknown) => Array.isArray(data) ? data : [] });
  const { data: lmsExams = [] } = useQuery<LmsExam[]>({
    queryKey: ["/api/lms/exams"],
    select: (data: unknown) => Array.isArray(data) ? data : [],
  });
  const { data: myProgress } = useQuery<LmsProgress>({
    queryKey: ["/api/lms/progress/my"],
    select: (data: unknown) => (data && typeof data === 'object') ? data as LmsProgress : undefined,
  });

  const submitExamMutation = useMutation({
    mutationFn: ({ examId, answers }: { examId: string; answers: unknown[] }) =>
      apiRequest("POST", `/api/lms/exams/${examId}/submit`, { answers }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lms/progress/my"] });
      queryClient.invalidateQueries({ queryKey: ["/api/lms/recent-activity"] });
    },
  });


  const isLoading = isLoadingCourses || isLoadingCertificates || isLoadingUsers;
  const totalCourses = courses.length;
  const activeStudents = users.length;
  const completedCertificates = certificates.length;
  const averageTestScore = courses.length > 0 ? Math.round((Array.isArray(courses) ? courses : []).reduce((sum, c) => sum + c.completionRate, 0) / courses.length) : 0;
  const topPerformers = [...users].sort((a, b) => (a.fullName || "").localeCompare(b.fullName || "")).slice(0, 5);

  if (isError) return <EPErrorState onRetry={refetch}  error={error} />;

  if (isLoading) {
    return (
      <ModulePage module="default" title={t('lms')} subtitle={t('dashboard')} icon={<BookOpen className="h-5 w-5" />} actions={<div className="flex items-center gap-2"><Skeleton className="h-9 w-12 rounded-lg" /><Skeleton className="h-9 w-12 rounded-lg" /></div>}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">{([1,2,3,4]).map(i => <StatsCardSkeleton key={`k-${i}`} />)}</div>
        <Skeleton className="h-10 w-96 mb-4 rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">{([1,2]).map(i => <Card key={`k-${i}`}><CardHeader><Skeleton className="h-6 w-48 rounded-lg" /></CardHeader><CardContent><div className="space-y-3">{[1,2,3,4,5].map(j => <Skeleton key={j} className="h-12 w-full rounded-lg" />)}</div></CardContent></Card>)}</div>
      </ModulePage>
    );
  }

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <div className="flex items-center justify-between mb-6">
        <EPPageHeader
        breadcrumb={<>{t("dashboard9")}<b className="text-foreground">{t("oquvMarkazi")}</b></>}
        title={t("oquvMarkazi")}
      />
        <div className="flex items-center gap-2">
          {(["uz", "ru"] as const).map(lang => (
            <Button key={lang} variant={language === lang ? "default" : "outline"} size="sm" onClick={() => setLanguage(lang)} data-testid={`button-lang-${lang}`} className={language === lang ? "bg-primary text-white" : ""}>{lang.toUpperCase()}</Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {([{ label: t('courses'), value: totalCourses, testId: "card-total-courses" }, { label: t('students'), value: activeStudents, testId: "card-active-students" }, { label: t('certificates'), value: completedCertificates, testId: "card-completed-certificates" }, { label: t('score'), value: `${averageTestScore}%`, testId: "card-average-score" }]).map(item => (
          <div key={item.testId} className="bg-card rounded-lg p-5 shadow-sm" data-testid={item.testId}>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{item.label}</p>
            <p className="text-4xl font-bold tracking-tight text-foreground">{item.value}</p>
          </div>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4 flex-wrap h-auto bg-muted/40 p-1 rounded-lg">
          {([{ v: "overview", l: tCommon('view') }, { v: "trends", l: tCommon('report') }, { v: "activity", l: t('progress') }, { v: "performers", l: t('skillMatrix') }, { v: "gamification", l: "Reyting" }, { v: "skills-gap", l: "Skills Gap" }, { v: "exams", l: "Imtihonlar" }]).map(tab => (
            <TabsTrigger key={tab.v} value={tab.v} data-testid={`tab-${tab.v}`} className="data-[state=active]:bg-card">{tab.l}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card border-border shadow-none">
              <CardHeader><CardTitle className="flex items-center gap-2 text-foreground"><BookOpen className="h-4 w-4 text-primary" />{t('courses')}</CardTitle></CardHeader>
              <CardContent>
                <div className="ep-table-scroll"><Table>
                  <TableHeader><TableRow className="border-none hover:bg-transparent">{(["#", t('course'), t('enrollment'), t('completionRate')]).map((h,i) => <TableHead key={h} className={`bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6 ${i===0?"rounded-l-lg":""} ${i===3?"rounded-r-lg":""}`}>{h}</TableHead>)}</TableRow></TableHeader>
                  <TableBody>
                    {courses.length === 0 ? <TableRow className="hover:bg-transparent"><TableCell colSpan={4} className="text-center text-muted-foreground py-8" data-testid="text-no-courses">{tCommon('noData')}</TableCell></TableRow>
                    : (Array.isArray(courses) ? courses : []).slice(0, 5).map((course, idx) => (
                      <TableRow key={course.id} data-testid={`row-course-${course.id}`} className="hover:bg-muted/40 transition-colors border-none">
                        <TableCell className="font-medium px-6">{idx + 1}</TableCell>
                        <TableCell className="px-6">{course.name}</TableCell>
                        <TableCell className="px-6">{course.enrolledCount}</TableCell>
                        <TableCell className="px-6"><Badge className="bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-semibold">{course.completionRate}%</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table></div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border shadow-none">
              <CardHeader><CardTitle className="flex items-center gap-2 text-foreground"><Award className="h-5 w-5 text-[var(--ep-green)]" />{t('certificates')}</CardTitle></CardHeader>
              <CardContent>
                {certificates.length === 0 ? <div className="text-center text-muted-foreground py-8" data-testid="text-no-certificates">{tCommon('noData')}</div>
                : (Array.isArray(certificates) ? certificates : []).slice(0, 5).map(cert => (
                  <div key={cert.id} className="flex items-center justify-between p-3 bg-muted/40 rounded-lg mb-2" data-testid={`item-certificate-${cert.id}`}>
                    <div><p className="font-medium text-sm text-foreground">{cert.userName}</p><p className="text-xs text-muted-foreground">{cert.courseName}</p></div>
                    <CheckCircle className="h-5 w-5 text-[var(--ep-green)]" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends">
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-[var(--ep-purple)]" />{t('completionRate')} - {tCommon('monthly')}</CardTitle></CardHeader>
            <CardContent><div className="h-80">
              {completionTrend.length === 0 ? <div className="flex items-center justify-center h-full text-muted-foreground" data-testid="text-no-trend-data">{tCommon('noData')}</div> : (
                <ResponsiveContainer width="100%" height="100%"><LineChart data={completionTrend}><XAxis dataKey="month" /><YAxis /><Tooltip /><Legend /><Line type="monotone" dataKey="completed" stroke="#22c55e" name={t('completion')} strokeWidth={2} /><Line type="monotone" dataKey="enrolled" stroke="#3b82f6" name={t('enrollment')} strokeWidth={2} /></LineChart></ResponsiveContainer>
              )}
            </div></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5 text-[var(--ep-primary)]" />{t('progress')} - {tCommon('recent')}</CardTitle></CardHeader>
            <CardContent><div className="space-y-4">
              {recentActivity.length === 0 ? <div className="text-center text-muted-foreground py-8" data-testid="text-no-activity">{tCommon('noData')}</div>
              : (Array.isArray(recentActivity) ? recentActivity : []).slice(0, 10).map(activity => (
                <div key={activity.id} className="flex items-start gap-4 p-3 border rounded-lg" data-testid={`item-activity-${activity.id}`}>
                  <div className="pt-1">
                    {activity.type === "completion" && <CheckCircle className="h-5 w-5 text-[var(--ep-green)]" />}
                    {activity.type === "enrollment" && <Users className="h-5 w-5 text-[var(--ep-blue)]" />}
                    {activity.type === "test" && <Clock className="h-5 w-5 text-[var(--ep-primary)]" />}
                  </div>
                  <div className="flex-1"><p className="font-medium text-sm">{activity.userName}</p><p className="text-xs text-muted-foreground">{activity.description}</p><p className="text-xs text-muted-foreground mt-1">{new Date(activity.timestamp).toLocaleString(language === 'uz' ? 'uz-UZ' : 'ru-RU')}</p></div>
                </div>
              ))}
            </div></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performers">
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-[var(--ep-green)]" />{t('skillMatrix')}</CardTitle></CardHeader>
            <CardContent>
              <div className="ep-table-scroll"><Table>
                <TableHeader><TableRow><TableHead>#</TableHead><TableHead>{t('students')}</TableHead><TableHead>{t('coursesCompleted')}</TableHead><TableHead>{t('certificatesEarned')}</TableHead></TableRow></TableHeader>
                <TableBody>
                  {topPerformers.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8" data-testid="text-no-performers">{tCommon('noData')}</TableCell></TableRow>
                  : (Array.isArray(topPerformers) ? topPerformers : []).map((performer, idx) => (
                    <TableRow key={performer.id} data-testid={`row-performer-${performer.id}`} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="font-medium">{idx + 1}</TableCell>
                      <TableCell>{performer.fullName}</TableCell>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell><Badge variant="outline">{performer.completedCourses || 0}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table></div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gamification"><GamificationTab leaderboard={lmsLeaderboard} isLoading={isLoadingLeaderboard} /></TabsContent>
        <TabsContent value="skills-gap"><SkillsGapTab /></TabsContent>

        <TabsContent value="exams">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <Card className="bg-card border-border shadow-none">
              <CardContent className="pt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t("yakunlanganKurslar")}</p>
                <p className="text-3xl font-bold text-foreground">{myProgress?.completedCourses ?? 0} / {myProgress?.totalCourses ?? 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border shadow-none">
              <CardContent className="pt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t("ortachaBall1")}</p>
                <p className="text-3xl font-bold text-primary">{myProgress?.averageScore ?? 0}%</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border shadow-none">
              <CardContent className="pt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">O'tgan / Qoqilgan</p>
                <p className="text-3xl font-bold text-foreground"><span className="text-[var(--ep-green)]">{myProgress?.examsPassed ?? 0}</span> / <span className="text-[var(--ep-red)]">{myProgress?.examsFailed ?? 0}</span></p>
              </CardContent>
            </Card>
          </div>
          <Card className="bg-card border-border shadow-none">
            <CardHeader><CardTitle className="flex items-center gap-2"><Award className="h-5 w-5 text-primary" />{t("mavjudImtihonlar")}</CardTitle></CardHeader>
            <CardContent>
              <div className="ep-table-scroll"><Table>
                <TableHeader>
                  <TableRow className="border-none hover:bg-transparent">
                    {(["#", "Nomi", "Davomiyligi", "O'tish bali", "action"]).map((h) => (
                      <TableHead key={h} className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-4">{h === "action" ? "" : h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!Array.isArray(lmsExams) || lmsExams.length === 0
                    ? <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">{t("imtihonlarMavjudEmas")}</TableCell></TableRow>
                    : (Array.isArray(lmsExams) ? lmsExams : []).map((exam, idx) => (
                      <TableRow key={exam.id} data-testid={`row-exam-${exam.id}`} className="hover:bg-muted/40 transition-colors">
                        <TableCell className="font-medium">{idx + 1}</TableCell>
                        <TableCell>{exam.title}</TableCell>
                        <TableCell>{exam.durationMinutes} daqiqa</TableCell>
                        <TableCell><Badge variant="outline">{exam.passingScore}%</Badge></TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={submitExamMutation.isPending}
                            onClick={() => submitExamMutation.mutate({ examId: exam.id, answers: [] })}
                            data-testid={`button-submit-exam-${exam.id}`}
                          >
                            {submitExamMutation.isPending ? "Yuborilmoqda..." : "Topshirish"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  }
                </TableBody>
              </Table></div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
