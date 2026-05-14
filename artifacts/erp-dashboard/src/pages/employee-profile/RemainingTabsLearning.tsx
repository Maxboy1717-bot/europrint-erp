/**
 * @module RemainingTabsLearning
 * @description LearningTab component for the Employee Profile page.
 * Renders summary stats, course-progress grid, and certificates table.
 * Skill-gap analysis and mentorship sections are delegated to
 * RemainingTabsLearningExtras to keep this file under 300 lines.
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GraduationCap, Award, BookOpen, Target } from "lucide-react";
import type { Certificate, CourseProgressRecord } from "./profile-types";
import type { LearningTabProps } from "./RemainingTabsTypes";
import { SkillGapCard, MentorshipCard } from "./RemainingTabsLearningExtras";
import { EPStatusPill } from "@/components/ep";
import { useTranslation } from "@/lib/i18n";

// ---------------------------------------------------------------------------
// LearningTab
// ---------------------------------------------------------------------------

export function LearningTab({ tCommon, loadingCertificates, loadingProgress, certificatesData, courseProgress, skillGapData, loadingSkillGap, mentorshipData, loadingMentorship, }: LearningTabProps) {
  const { t } = useTranslation("common");
  return (
    <div className="space-y-6">
      {loadingCertificates || loadingProgress ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-24 rounded-lg" />
            <Skeleton className="h-24 rounded-lg" />
            <Skeleton className="h-24 rounded-lg" />
          </div>
          <Skeleton className="h-64 rounded-lg" />
        </div>
      ) : (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="from-blue-500/10 to-blue-600/10 border-blue-500/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t("kurslar")}</p>
                    <p className="text-3xl font-bold text-[var(--ep-blue)]">{courseProgress?.length || 0}</p>
                  </div>
                  <BookOpen className="h-8 w-8 text-[var(--ep-blue)]" />
                </div>
              </CardContent>
            </Card>

            <Card className="from-green-500/10 to-green-600/10 border-green-500/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t("sertifikatlar")}</p>
                    <p className="text-3xl font-bold text-[var(--ep-green)]">{certificatesData?.length || 0}</p>
                  </div>
                  <Award className="h-8 w-8 text-[var(--ep-green)]" />
                </div>
              </CardContent>
            </Card>

            <Card className="from-purple-500/10 to-purple-600/10 border-purple-500/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t("ortachaBall1")}</p>
                    <p className="text-3xl font-bold text-[var(--ep-purple)]">
                      {certificatesData && certificatesData.length > 0
                        ? Math.round(
                            (Array.isArray(certificatesData) ? certificatesData : [])
                              .reduce((sum, c) => sum + (c.score || 0), 0) / certificatesData.length
                          )
                        : 0}%
                    </p>
                  </div>
                  <Target className="h-8 w-8 text-[var(--ep-purple)]" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Course progress grid */}
          {courseProgress && courseProgress.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  {t("kursTaraqqiyoti")}
                </CardTitle>
                <CardDescription>{t("davomEtayotganVaTugatilganKurslar")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(Array.isArray(courseProgress) ? courseProgress : []).map((progress: CourseProgressRecord) => {
                    const progressPercent =
                      progress.completedLessons > 0 && progress.totalLessons > 0
                        ? Math.round((progress.completedLessons / progress.totalLessons) * 100)
                        : 0;
                    return (
                      <Card key={progress.id} className="border" data-testid={`card-progress-${progress.id}`}>
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{progress.course?.title || "Kurs"}</h4>
                            {progress.isCompleted ? (
                              <EPStatusPill tone="success">{t("tugatildi")}</EPStatusPill>
                            ) : (
                              <Badge variant="outline">{progressPercent}%</Badge>
                            )}
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${progress.isCompleted ? 'bg-green-500' : 'bg-blue-500'}`}
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">
                            {progress.completedLessons || 0}/{progress.totalLessons || 0} darslar
                          </p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Certificates table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                {t("sertifikatlar")}
              </CardTitle>
              <CardDescription>{t("olinganSertifikatlarVaUlarningHolati")}</CardDescription>
            </CardHeader>
            <CardContent>
              {certificatesData && certificatesData.length > 0 ? (
                <div className="ep-table-scroll"><Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("sertifikatNomi")}</TableHead>
                      <TableHead>{t("beruvchi")}</TableHead>
                      <TableHead>{t("berilganSana")}</TableHead>
                      <TableHead>{t("amalQilish")}</TableHead>
                      <TableHead>{t("status28")}</TableHead>
                      <TableHead>{t("ball")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(Array.isArray(certificatesData) ? certificatesData : []).map((cert: Certificate) => {
                      const isExpired = cert.expiryDate && new Date(cert.expiryDate) < new Date();
                      return (
                        <TableRow key={cert.id} data-testid={`row-certificate-${cert.id}`} className="hover:bg-muted/40 transition-colors">
                          <TableCell className="font-medium">
                            {cert.name || cert.certificateNumber || "-"}
                          </TableCell>
                          <TableCell>{cert.issuer || cert.course?.title || "-"}</TableCell>
                          <TableCell>
                            {cert.issueDate
                              ? new Date(cert.issueDate).toLocaleDateString('uz-UZ')
                              : cert.issuedAt
                                ? new Date(cert.issuedAt).toLocaleDateString('uz-UZ')
                                : "-"}
                          </TableCell>
                          <TableCell>
                            {cert.expiryDate
                              ? new Date(cert.expiryDate).toLocaleDateString('uz-UZ')
                              : "Muddatsiz"}
                          </TableCell>
                          <TableCell>
                            {isExpired ? (
                              <EPStatusPill tone="danger">{t("muddatiOtgan")}</EPStatusPill>
                            ) : (
                              <EPStatusPill tone="success">{t("amalda")}</EPStatusPill>
                            )}
                          </TableCell>
                          <TableCell>
                            {cert.score ? <Badge variant="outline">{cert.score}%</Badge> : "-"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table></div>
              ) : (
                <p className="text-muted-foreground text-center py-8">{tCommon('noData')}</p>
              )}
            </CardContent>
          </Card>

          {/* Delegated: skill-gap and mentorship */}
          <SkillGapCard skillGapData={skillGapData} loadingSkillGap={loadingSkillGap} />
          <MentorshipCard mentorshipData={mentorshipData} loadingMentorship={loadingMentorship} />
        </>
      )}
    </div>
  );
}
