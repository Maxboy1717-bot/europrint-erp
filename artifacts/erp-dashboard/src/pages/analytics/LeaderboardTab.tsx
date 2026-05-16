/**
 * @module LeaderboardTab
 * @description React page component. Route-level UI.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Award, Target, Trophy, Star, Medal, Brain, Zap, Flame, CheckCircle, RefreshCw } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { LeaderboardEmployee, DepartmentRanking, TopCourse } from "./analytics-types";
import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";
import { EPStatusPill } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

import { tLabel } from '@/lib/i18n/tLabel';
interface LeaderboardTabProps {
  topEmployees: LeaderboardEmployee[];
  topEmpLoading: boolean;
  departmentRankings: DepartmentRanking[];
  deptRankLoading: boolean;
  topCourses: TopCourse[];
  topCoursesLoading: boolean;
}

export function LeaderboardTab({
  topEmployees,
  departmentRankings,
  topCourses,
}: LeaderboardTabProps) {
  const { t } = useTranslation("common");
  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api"] })} className="sr-only" aria-label={t("refresh")}><RefreshCw className="h-4 w-4" /></Button>
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(Array.isArray(topEmployees) ? topEmployees : []).slice(0, 3).map((employee, index) => (
          <Card key={employee.userId} className={`relative overflow-hidden ${
            index === 0 ? 'ring-2 ring-yellow-500 dark:ring-yellow-600' :
            index === 1 ? 'ring-2 ring-gray-400' :
            'ring-2 ring-orange-500'
          }`}>
            <div className={`absolute top-0 right-0 w-16 h-16 ${
              index === 0 ? 'bg-yellow-500' :
              index === 1 ? 'bg-slate-500' :
              'bg-primary'
            } rounded-bl-full flex items-start justify-end p-2`}>
              {index === 0 ? <Trophy className="w-6 h-6 text-white" /> :
               index === 1 ? <Medal className="w-6 h-6 text-white" /> :
               <Star className="w-6 h-6 text-white" />}
            </div>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className={`flex items-center justify-center w-14 h-14 rounded-full font-bold text-2xl ${
                  index === 0 ? 'bg-yellow-100 text-[var(--ep-yellow)] dark:bg-yellow-900 dark:text-yellow-200' :
                  index === 1 ? 'bg-muted/40 text-foreground dark:bg-gray-800 dark:text-gray-200' :
                  'bg-orange-100 text-[var(--ep-primary)] dark:bg-orange-900 dark:text-orange-200'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <CardTitle className="text-[14px] font-semibold">{employee.fullName}</CardTitle>
                  <CardDescription className="text-xs">{employee.positionName}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t("umumiyBall1")}</span>
                  <span className="text-2xl font-bold text-primary">{Math.round(employee.overallScore)}</span>
                </div>
                <Progress value={Math.min((employee.overallScore / 1000) * 100, 100)} className="h-3" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <BookOpen className="w-3 h-3 text-muted-foreground" />
                    <span>{employee.completedCourses} kurs</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Award className="w-3 h-3 text-muted-foreground" />
                    <span>{employee.passedTests} test</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Target className="w-3 h-3 text-muted-foreground" />
                    <span>{employee.averageScore} ball</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-muted-foreground" />
                    <span>{employee.totalBonus} so'm</span>
                  </div>
                </div>
                {index === 0 && (
                  <Badge className="w-full justify-center bg-yellow-500">
                    {t("yilningEngYaxshiOquvchisi")}
                  </Badge>
                )}
                {index === 1 && (
                  <EPStatusPill tone="neutral" className="w-full justify-center">
                    {t("ikkinchiOrin")}
                  </EPStatusPill>
                )}
                {index === 2 && (
                  <EPStatusPill tone="neutral" className="w-full justify-center">
                    {t("uchinchiOrin")}
                  </EPStatusPill>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("top10XodimlarReytingi")}</CardTitle>
          <CardDescription>{t("engYaxshiNatijalarKorsatganXodimlar")}</CardDescription>
        </CardHeader>
        <CardContent>
          {topEmployees.length > 0 ? (
            <div className="space-y-2">
              {(Array.isArray(topEmployees) ? topEmployees : []).slice(3, 10).map((employee, idx) => {
                const index = idx + 3;
                return (
                  <div
                    key={employee.userId}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover-elevate"
                    data-testid={`leaderboard-employee-${index}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full font-bold bg-muted text-muted-foreground text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-semibold">{employee.fullName}</div>
                        <div className="text-xs text-muted-foreground">
                          {employee.positionName} • {employee.departmentName}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-primary">{Math.round(employee.overallScore)}</div>
                      <div className="text-xs text-muted-foreground">
                        {employee.completedCourses} kurs • {employee.passedTests} test
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-[13px] text-muted-foreground">
              {t("noData")}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("yutuqlarVaMukofotlar")}</CardTitle>
          <CardDescription>{t("turliKategoriyalardaEngYaxshiNatijalar")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg border bg-blue-500 dark:from-blue-950 dark:to-blue-900">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-5 h-5 text-[var(--ep-blue)] dark:text-blue-400" />
                <span className="font-semibold text-sm">{t("engKopOrganuvchi")}</span>
              </div>
              <div className="text-lg font-bold text-[var(--ep-blue)] dark:text-blue-300">
                {topEmployees[0]?.fullName?.split(' ')[0] || '-'}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {topEmployees[0]?.completedCourses || 0} ta kurs tugatgan
              </div>
            </div>

            <div className="p-4 rounded-lg border bg-green-500 dark:from-green-950 dark:to-green-900">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-[var(--ep-green)] dark:text-green-400" />
                <span className="font-semibold text-sm">{t("engYuqoriBall")}</span>
              </div>
              <div className="text-lg font-bold text-[var(--ep-green)] dark:text-green-300">
                {topEmployees[0]?.fullName?.split(' ')[0] || '-'}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {topEmployees[0]?.averageScore || 0} o'rtacha ball
              </div>
            </div>

            <div className="p-4 rounded-lg border bg-purple-500 dark:from-purple-950 dark:to-purple-900">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="w-5 h-5 text-[var(--ep-purple)] dark:text-purple-400" />
                <span className="font-semibold text-sm">{t("engTezkor")}</span>
              </div>
              <div className="text-lg font-bold text-[var(--ep-purple)] dark:text-purple-300">
                {topEmployees[1]?.fullName?.split(' ')[0] || '-'}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {t("minimalVaqtdaTugatgan")}
              </div>
            </div>

            <div className="p-4 rounded-lg border bg-primary dark:from-orange-950 dark:to-orange-900">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-5 h-5 text-[var(--ep-primary)] dark:text-orange-400" />
                <span className="font-semibold text-sm">{t("ustoz")}</span>
              </div>
              <div className="text-lg font-bold text-[var(--ep-primary)] dark:text-orange-300">
                {topEmployees[2]?.fullName?.split(' ')[0] || '-'}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {t("kopYordamBergan")}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{t("bolimlarReytingi")}</CardTitle>
            <CardDescription>{t("engSamaraliBolimlar")}</CardDescription>
          </CardHeader>
          <CardContent>
            {departmentRankings.length > 0 ? (
              <div className="space-y-2">
                {(Array.isArray(departmentRankings) ? departmentRankings : []).map((dept, index) => (
                  <div
                    key={dept.departmentId}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                    data-testid={`department-rank-${index}`}
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant={index < 3 ? "default" : "outline"}>{index + 1}</Badge>
                      <div>
                        <div className="font-medium">{dept.departmentName}</div>
                        <div className="text-xs text-muted-foreground">
                          {dept.userCount} xodim • {dept.completedAssignments}/{dept.totalAssignments} bajarilgan
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-primary">{dept.completionRate}%</div>
                      <div className="text-xs text-muted-foreground">Ball: {dept.averageScore}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[13px] text-muted-foreground">
                {t("noData")}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("bolimlarTaqqoslash")}</CardTitle>
            <CardDescription>{t("tugatishFoiziVaOrtachaBall")}</CardDescription>
          </CardHeader>
          <CardContent>
            {departmentRankings.length > 0 ? (
              <div className="glass-chart">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={departmentRankings}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="departmentName" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="completionRate" fill="hsl(var(--primary))" name={tLabel('analytics.LeaderboardTab.tugatish', "Tugatish %")} />
                  <Bar dataKey="averageScore" fill="hsl(var(--secondary))" name={tLabel('analytics.LeaderboardTab.ortachaBall', "O'rtacha ball")} />
                </BarChart>
              </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                {t("noData")}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("engSamaraliKurslar")}</CardTitle>
          <CardDescription>{t("yuqoriTugatishVaOtishFoiziga")}</CardDescription>
        </CardHeader>
        <CardContent>
          {topCourses.length > 0 ? (
            <div className="space-y-2">
              {(Array.isArray(topCourses) ? topCourses : []).slice(0, 8).map((course, index) => (
                <div
                  key={course.courseId}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover-elevate"
                  data-testid={`top-course-${index}`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <Badge variant={index < 3 ? "default" : "secondary"}>{index + 1}</Badge>
                    <div className="flex-1">
                      <div className="font-medium">{course.title}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {course.enrolled} xodim • {course.completed} tugatgan • {course.certificatesIssued} sertifikat
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">{t("tugatish")}</div>
                      <div className="font-semibold text-[var(--ep-green)]">{course.completionRate}%</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">{t("otish")}</div>
                      <div className="font-semibold text-[var(--ep-blue)]">{course.passRate}%</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">{t("samaradorlik")}</div>
                      <Badge variant={course.effectivenessScore >= 80 ? "default" : "secondary"}>
                        {course.effectivenessScore}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-[13px] text-muted-foreground">
              {t("noData")}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </>
  );
}
