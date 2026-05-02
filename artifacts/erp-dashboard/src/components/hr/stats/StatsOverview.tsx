import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, CheckCircle2, Trophy, Award } from "lucide-react";

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
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Kurslar</CardTitle>
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
          <CardTitle className="text-sm font-medium">Testlar</CardTitle>
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
          <CardTitle className="text-sm font-medium">Darslar</CardTitle>
          <Trophy className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold" data-testid="stat-lessons">{completedLessons}</div>
          <p className="text-xs text-muted-foreground">
            Tugallangan darslar
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Sertifikatlar</CardTitle>
          <Award className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold" data-testid="stat-certificates">{totalCertificates}</div>
          <p className="text-xs text-muted-foreground">
            Olgan sertifikatlar
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
