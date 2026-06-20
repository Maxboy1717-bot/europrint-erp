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
interface LmsLeaderboardEntry { userId: number; fullName: string; completedCourses: number; totalCourses: number; avgScore: number; certificatesEarned: number; }
interface LmsExam { id: string; title: string; courseId: number | null; durationMinutes: number; passingScore: number; isActive: boolean; }
interface LmsProgress { completedCourses: number; totalCourses: number; averageScore: number; examsPassed: number; examsFailed: number; }
interface LmsQuestion { id: number; question_text: string; options: string[] | Record<string, string>; order_index: number; }

export default function LMSDashboard() {
  const { t, language, setLanguage } = useTranslation('lms');
  const { t: tCommon } = useTranslation('common');
  const [activeTab, setActiveTab] = useState("overview");
  /** null = no exam in progress; string = exam id being taken */
  const [takingExamId, setTakingExamId] = useState<string | null>(null);
  /** questionId → selectedOption (0-based index into options array) */
  const [examAnswers, setExamAnswers] = useState<Record<number, number>>({});

  const { data: courses = [], isLoading: isLoadingCourses, isError, error, refetch } = useQuery<Course[]>({ queryKey: ["/api/courses"], select: (data: unknown) => Array.isArray(data) ? data : ((data as { data?: Course[] })?.data ?? []) });
  const { data: certificates = [], isLoading: isLoadingCertificates } = useQuery<Certificate[]>({ queryKey: ["/api/certificates"], select: (data: unknown) => Array.isArray(data) ? data : ((data as { data?: Certificate[] })?.data ?? []) });
  const { data: users = [], isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ["/api/hr/employees"],
    queryFn: () => apiRequest("GET", "/api/hr/employees"),
    select: (data: unknown) => {
      const d = data as Record<string, unknown>;
      return Array.isArray(d?.items) ? (d.items as User[]) : (Array.isArray(data) ? (data as User[]) : []);
    },
  });
  const { data: completionTrend = [] } = useQuery<{ month: string; completed: number; enrolled: number }[]>({ queryKey: ["/api/courses/completion-trend", language] });
  const { data: recentActivity = [] } = useQuery<ActivityRecord[]>({ queryKey: ["/api/lms/recent-activity", language] });
  const { data: lmsLeaderboard = [], isLoading: isLoadingLeaderboard } = useQuery<LMSLeaderboardEntry[]>({ queryKey: ["/api/analytics/leaderboard/employees"], select: (data: unknown) => Array.isArray(data) ? data : [] });
  const { data: lmsTopPerformers = [], isLoading: isLoadingTopPerformers } = useQuery<LmsLeaderboardEntry[]>({
    queryKey: ["/api/lms/leaderboard"],
    queryFn: () => apiRequest("GET", "/api/lms/leaderboard"),
    select: (data: unknown) => Array.isArray(data) ? (data as LmsLeaderboardEntry[]) : [],
  });
  const { data: lmsExams = [] } = useQuery<LmsExam[]>({
    queryKey: ["/api/lms/exams"],
    select: (data: unknown) => Array.isArray(data) ? data : [],
  });
  const { data: examQuestions = [], isLoading: isLoadingQuestions } = useQuery<LmsQuestion[]>({
    queryKey: ["/api/lms/exams", takingExamId, "questions"],
    queryFn: () => apiRequest("GET", `/api/lms/exams/${takingExamId}/questions`),
    enabled: takingExamId !== null,
    select: (data: unknown) => Array.isArray(data) ? data as LmsQuestion[] : [],
  });
  const { data: myProgress } = useQuery<unknown, Error, LmsProgress | undefined>({
    queryKey: ["/api/lms/progress/my"],
    select: (data) => (data && typeof data === 'object') ? data as LmsProgress : undefined,
  });

  const submitExamMutation = useMutation({
    mutationFn: ({ examId, answers }: { examId: string; answers: Array<{ questionId: number; selectedOption: number }> }) =>
      apiRequest("POST", `/api/lms/exams/${examId}/submit`, { answers }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lms/progress/my"] });
      queryClient.invalidateQueries({ queryKey: ["/api/lms/recent-activity"] });
      setTakingExamId(null);
      setExamAnswers({});
    },
  });


  const isLoading = isLoadingCourses || isLoadingCertificates || isLoadingUsers;
  const totalCourses = courses.length;
  const activeStudents = users.length;
  const completedCertificates = certificates.length;
  const averageTestScore = courses.length > 0 ? Math.round((Array.isArray(courses) ? courses : []).reduce((sum, c) => sum + c.completionRate, 0) / courses.length) : 0;

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
              {isLoadingTopPerformers ? (
                <div className="space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
              ) : (
                <div className="ep-table-scroll"><Table>
                  <TableHeader><TableRow><TableHead>#</TableHead><TableHead>{t('students')}</TableHead><TableHead>{t('coursesCompleted')}</TableHead><TableHead>{t('certificatesEarned')}</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {lmsTopPerformers.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8" data-testid="text-no-performers">{tCommon('noData')}</TableCell></TableRow>
                    : (Array.isArray(lmsTopPerformers) ? lmsTopPerformers : []).map((performer, idx) => (
                      <TableRow key={performer.userId} data-testid={`row-performer-${performer.userId}`} className="hover:bg-muted/40 transition-colors">
                        <TableCell className="font-medium">{idx + 1}</TableCell>
                        <TableCell>{performer.fullName}</TableCell>
                        <TableCell>{performer.completedCourses}</TableCell>
                        <TableCell><Badge variant="outline">{performer.certificatesEarned}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table></div>
              )}
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
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t("oTganQoqilgan")}</p>
                <p className="text-3xl font-bold text-foreground"><span className="text-[var(--ep-green)]">{myProgress?.examsPassed ?? 0}</span> / <span className="text-[var(--ep-red)]">{myProgress?.examsFailed ?? 0}</span></p>
              </CardContent>
            </Card>
          </div>

          {/* Step 2: Question UI — shown when user clicks "Boshlash" */}
          {takingExamId !== null && (
            <Card className="bg-card border-border shadow-none mb-6">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  {(Array.isArray(lmsExams) ? lmsExams : []).find(e => e.id === takingExamId)?.title ?? "Imtihon"}
                </CardTitle>
                <Button size="sm" variant="ghost" onClick={() => { setTakingExamId(null); setExamAnswers({}); }}>
                  Bekor qilish
                </Button>
              </CardHeader>
              <CardContent>
                {isLoadingQuestions ? (
                  <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}</div>
                ) : examQuestions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Bu imtihon uchun savollar mavjud emas</p>
                ) : (
                  <div className="space-y-6">
                    {examQuestions.map((q, qi) => {
                      const opts: string[] = Array.isArray(q.options)
                        ? (q.options as string[])
                        : Object.values(q.options as Record<string, string>);
                      const selected = examAnswers[q.id];
                      return (
                        <div key={q.id} className="p-4 rounded-lg bg-muted/40">
                          <p className="font-medium mb-3">{qi + 1}. {q.question_text}</p>
                          <div className="flex flex-col gap-2">
                            {opts.map((opt, oi) => (
                              <button
                                key={oi}
                                type="button"
                                onClick={() => setExamAnswers(prev => ({ ...prev, [q.id]: oi }))}
                                className={[
                                  "text-left px-4 py-2 rounded-md border text-sm transition-colors",
                                  selected === oi
                                    ? "border-primary bg-primary/10 text-primary font-semibold"
                                    : "border-border bg-background text-foreground hover:bg-muted/60",
                                ].join(" ")}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                    <div className="flex justify-end pt-2">
                      <Button
                        disabled={submitExamMutation.isPending || examQuestions.some(q => examAnswers[q.id] === undefined)}
                        onClick={() => {
                          const answers = examQuestions.map(q => ({
                            questionId: q.id,
                            selectedOption: examAnswers[q.id] ?? 0,
                          }));
                          submitExamMutation.mutate({ examId: takingExamId, answers });
                        }}
                        data-testid="button-submit-exam-answers"
                      >
                        {submitExamMutation.isPending ? "Yuborilmoqda..." : "Topshirish"}
                      </Button>
                    </div>
                    {submitExamMutation.isError && (
                      <p className="text-sm text-destructive text-right">{String((submitExamMutation.error as Error)?.message ?? "Xatolik yuz berdi")}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 1: Exam list — hidden while an exam is in progress */}
          {takingExamId === null && (
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
                              onClick={() => { setTakingExamId(exam.id); setExamAnswers({}); }}
                              data-testid={`button-start-exam-${exam.id}`}
                            >
                              Boshlash
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    }
                  </TableBody>
                </Table></div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
