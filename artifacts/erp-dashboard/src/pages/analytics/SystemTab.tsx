import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, RefreshCw } from "lucide-react";
import type {
  MentorshipsStats, MentorInfo, EventsStats, EventTypeItem,
  ApplicationsStats, SurveysStats, BroadcastsStats,
  SkillsStats, SkillCategoryItem, EmployeeAnalyticsStats, AiAnalysis
} from "./analytics-types";
import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";

interface SystemTabProps {
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
      <Button variant="ghost" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api"] })} className="sr-only" aria-label="Yangilash"><RefreshCw className="h-4 w-4" /></Button>
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card data-testid="card-mentorships-stats">
          <CardHeader>
            <CardTitle className="text-lg">Mentorlik Dasturi</CardTitle>
            <CardDescription>Mentor va mentee statistikasi</CardDescription>
          </CardHeader>
          <CardContent>
            {mentorshipsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Jami mentorliklar:</span>
                  <span className="text-xl font-bold" data-testid="text-total-mentorships">{mentorshipsStats?.total || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Aktiv:</span>
                  <Badge variant="default" data-testid="badge-active-mentorships">{mentorshipsStats?.active || 0}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Tugallangan:</span>
                  <Badge variant="secondary" data-testid="badge-completed-mentorships">{mentorshipsStats?.completed || 0}</Badge>
                </div>
                {mentorshipsStats?.topMentors && mentorshipsStats.topMentors.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm font-medium mb-2">Top Mentorlar:</p>
                    {mentorshipsStats.topMentors.slice(0, 3).map((mentor: MentorInfo, idx: number) => (
                      <div key={idx} className="text-xs text-muted-foreground flex justify-between">
                        <span>{mentor.mentorName}</span>
                        <span>{mentor.menteeCount} ta o'quvchi</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-events-stats">
          <CardHeader>
            <CardTitle className="text-lg">Tadbirlar va E'lonlar</CardTitle>
            <CardDescription>Kalendar tadbirlari statistikasi</CardDescription>
          </CardHeader>
          <CardContent>
            {eventsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Jami tadbirlar:</span>
                  <span className="text-xl font-bold" data-testid="text-total-events">{eventsStats?.total || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Rejalashtirilgan:</span>
                  <Badge variant="default" data-testid="badge-scheduled-events">{eventsStats?.scheduled || 0}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Tugallangan:</span>
                  <Badge variant="secondary" data-testid="badge-completed-events">{eventsStats?.completed || 0}</Badge>
                </div>
                {eventsStats?.byType && eventsStats.byType.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm font-medium mb-2">Tur bo'yicha:</p>
                    {(Array.isArray(eventsStats.byType) ? eventsStats.byType : []).map((item: EventTypeItem, idx: number) => (
                      <div key={idx} className="text-xs text-muted-foreground flex justify-between">
                        <span>{item.type}</span>
                        <span>{item.count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-applications-stats">
          <CardHeader>
            <CardTitle className="text-lg">Arizalar</CardTitle>
            <CardDescription>Ariza tizimi statistikasi</CardDescription>
          </CardHeader>
          <CardContent>
            {applicationsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Jami shablonlar:</span>
                  <span className="text-xl font-bold" data-testid="text-total-applications">{applicationsStats?.totalApplications || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Yuborilgan arizalar:</span>
                  <span className="text-lg font-semibold" data-testid="text-total-responses">{applicationsStats?.totalResponses || 0}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3">
                  <div className="text-center">
                    <Badge variant="outline" className="w-full" data-testid="badge-pending-responses">{applicationsStats?.pendingResponses || 0}</Badge>
                    <p className="text-xs text-muted-foreground mt-1">Kutilmoqda</p>
                  </div>
                  <div className="text-center">
                    <Badge variant="default" className="w-full" data-testid="badge-approved-responses">{applicationsStats?.approvedResponses || 0}</Badge>
                    <p className="text-xs text-muted-foreground mt-1">Tasdiqlangan</p>
                  </div>
                  <div className="text-center">
                    <Badge variant="destructive" className="w-full" data-testid="badge-rejected-responses">{applicationsStats?.rejectedResponses || 0}</Badge>
                    <p className="text-xs text-muted-foreground mt-1">Rad etilgan</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-surveys-stats">
          <CardHeader>
            <CardTitle className="text-lg">So'rovnomalar</CardTitle>
            <CardDescription>So'rovnoma tizimi statistikasi</CardDescription>
          </CardHeader>
          <CardContent>
            {surveysLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Jami so'rovnomalar:</span>
                  <span className="text-xl font-bold" data-testid="text-total-surveys">{surveysStats?.total || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Aktiv:</span>
                  <Badge variant="default" data-testid="badge-active-surveys">{surveysStats?.active || 0}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Yopilgan:</span>
                  <Badge variant="secondary" data-testid="badge-closed-surveys">{surveysStats?.closed || 0}</Badge>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm text-muted-foreground">Javoblar:</span>
                  <span className="text-lg font-semibold" data-testid="text-survey-responses">{surveysStats?.totalResponses || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Javob darajasi:</span>
                  <Badge variant="outline" data-testid="badge-response-rate">{surveysStats?.responseRate || 0}%</Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-broadcasts-stats">
          <CardHeader>
            <CardTitle className="text-lg">Xabarlar</CardTitle>
            <CardDescription>Broadcast tizimi statistikasi</CardDescription>
          </CardHeader>
          <CardContent>
            {broadcastsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Jami xabarlar:</span>
                  <span className="text-xl font-bold" data-testid="text-total-broadcasts">{broadcastsStats?.total || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Qabul qiluvchilar:</span>
                  <span className="text-lg font-semibold" data-testid="text-total-recipients">{broadcastsStats?.totalRecipients || 0}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div className="text-center">
                    <Badge variant="default" className="w-full" data-testid="badge-total-success">{broadcastsStats?.totalSuccess || 0}</Badge>
                    <p className="text-xs text-muted-foreground mt-1">Muvaffaqiyatli</p>
                  </div>
                  <div className="text-center">
                    <Badge variant="destructive" className="w-full" data-testid="badge-total-failed">{broadcastsStats?.totalFailed || 0}</Badge>
                    <p className="text-xs text-muted-foreground mt-1">Xato</p>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm text-muted-foreground">Muvaffaqiyat darajasi:</span>
                  <Badge variant="outline" data-testid="badge-success-rate">{broadcastsStats?.successRate || 0}%</Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-skills-stats">
          <CardHeader>
            <CardTitle className="text-lg">Ko'nikmalar</CardTitle>
            <CardDescription>Ko'nikmalar matritsa statistikasi</CardDescription>
          </CardHeader>
          <CardContent>
            {skillsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Jami ko'nikmalar:</span>
                  <span className="text-xl font-bold" data-testid="text-total-skills">{skillsStats?.totalSkills || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Xodim ko'nikmalari:</span>
                  <span className="text-lg font-semibold" data-testid="text-total-user-skills">{skillsStats?.totalUserSkills || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Tasdiqlangan:</span>
                  <Badge variant="default" data-testid="badge-verified-skills">{skillsStats?.verifiedSkills || 0}</Badge>
                </div>
                {skillsStats?.byCategory && skillsStats.byCategory.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm font-medium mb-2">Kategoriya bo'yicha:</p>
                    {(Array.isArray(skillsStats.byCategory) ? skillsStats.byCategory : []).map((item: SkillCategoryItem, idx: number) => (
                      <div key={idx} className="text-xs text-muted-foreground flex justify-between">
                        <span>{item.category}</span>
                        <span>{item.count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-employee-stats">
          <CardHeader>
            <CardTitle className="text-lg">Xodimlar Tahlili</CardTitle>
            <CardDescription>Xodimlar harakati va statistikasi</CardDescription>
          </CardHeader>
          <CardContent>
            {employeeStatsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Yangi xodimlar (30 kun):</span>
                  <Badge variant="default" data-testid="badge-new-employees">{employeeStats?.newEmployees || 0}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Ketgan xodimlar:</span>
                  <Badge variant="destructive" data-testid="badge-departed-employees">{employeeStats?.departedEmployees || 0}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Aktiv xodimlar:</span>
                  <Badge variant="default" data-testid="badge-active-employees">{employeeStats?.activeEmployees || 0}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Qatnashmayotganlar:</span>
                  <Badge variant="secondary" data-testid="badge-non-participating-employees">{employeeStats?.nonParticipatingEmployees || 0}</Badge>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm text-muted-foreground">O'qiyotgan xodimlar:</span>
                  <span className="text-lg font-semibold" data-testid="text-studying-employees">{employeeStats?.studyingEmployees || 0}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-ai-analysis" className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🤖 AI Tahlil
            {aiAnalysisLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          </CardTitle>
          <CardDescription>
            Tizim holatining sun'iy intellekt tomonidan tahlili
            {aiAnalysis?.generatedAt && (
              <span className="ml-2 text-xs">
                • Yaratilgan: {new Date(aiAnalysis.generatedAt).toLocaleString('uz-UZ')}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {aiAnalysisLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-5/6" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-2/3" />
            </div>
          ) : aiAnalysis?.analysis ? (
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap text-sm leading-relaxed" data-testid="text-ai-analysis">
                {aiAnalysis.analysis}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              AI tahlil mavjud emas
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </>
  );
}
