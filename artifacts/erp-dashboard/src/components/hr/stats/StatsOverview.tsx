/**
 * @module StatsOverview
 * @description React UI component.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, CheckCircle2, Trophy, Award } from "lucide-react";
import { useTranslation } from '@/lib/i18n';

interface StatsOverviewProps {
  totalCourses: number;
  completedCourses: number;
  totalTests: number;
  passedTests: number;
  completedLessons: number;
  totalCertificates: number;
}

export function StatsOverview({
  totalCourses,
  completedCourses,
  totalTests,
  passedTests,
  completedLessons,
  totalCertificates,
}: StatsOverviewProps) {
  const { t } = useTranslation("common");
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t("kurslar")}</CardTitle>
          <BookOpen className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold" data-testid="stat-courses">{totalCourses}</div>
          <p className="text-xs text-muted-foreground">
            {completedCourses} ta tugallangan
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t("testlar")}</CardTitle>
          <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold" data-testid="stat-tests">{totalTests}</div>
          <p className="text-xs text-muted-foreground">
            {passedTests} ta o'tdi
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t("darslar")}</CardTitle>
          <Trophy className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold" data-testid="stat-lessons">{completedLessons}</div>
          <p className="text-xs text-muted-foreground">
            {t("tugallanganDarslar")}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t("sertifikatlar")}</CardTitle>
          <Award className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold" data-testid="stat-certificates">{totalCertificates}</div>
          <p className="text-xs text-muted-foreground">
            {t("olganSertifikatlar")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
