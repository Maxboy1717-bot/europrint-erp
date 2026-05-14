/**
 * @module HRCapitalCourses
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { ModulePage } from "@/components/ui/module-page";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen,
  GraduationCap,
  Brain,
  Clock,
  Users,
  Plus,
  ChevronRight,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { EPErrorState, EPStatusPill } from "@/components/ep";
interface HRCapitalCourse {
  id: string;
  title: string;
  sessionNumber: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  isActive: boolean;
}

interface HRCapitalStats {
  totalCourses: number;
  activeCourses: number;
  totalModules: number;
  totalAttempts: number;
}

const getDifficultyBadge = (difficulty: string) => {
  switch (difficulty) {
    case "beginner":
      return <Badge variant="outline">Boshlang'ich</Badge>;
    case "intermediate":
      return <EPStatusPill tone="neutral">O'rta</EPStatusPill>;
    case "advanced":
      return (
        <Badge className="bg-purple-500 hover:bg-[var(--ep-purple)]/90">Ilg'or</Badge>
      );
    default:
      return <Badge>{difficulty}</Badge>;
  }
};

const StatsSkeleton = () => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-4 w-24 mb-2 rounded-lg" />
          <Skeleton className="h-8 w-16 rounded-lg" />
        </div>
      </div>
    </CardContent>
  </Card>
);

const CourseCardSkeleton = () => (
  <Card>
    <CardContent className="p-6">
      <Skeleton className="h-6 w-full mb-4 rounded-lg" />
      <div className="space-y-3">
        <Skeleton className="h-4 w-24 rounded-lg" />
        <Skeleton className="h-4 w-32 rounded-lg" />
        <Skeleton className="h-8 w-20 mt-4 rounded-lg" />
      </div>
    </CardContent>
  </Card>
);

export default function HRCapitalCourses() {
  const { t } = useTranslation("hr");
  const [activeTab, setActiveTab] = useState("all");

  const { data: courses = [], isLoading: isLoadingCourses, isError, refetch} = useQuery<
    HRCapitalCourse[]
  >({
    queryKey: ["/api/hr-capital/courses"],
  });

  const { data: stats, isLoading: isLoadingStats } = useQuery<
    HRCapitalStats
  >({
    queryKey: ["/api/hr-capital/stats"],
  });

  const isLoading = isLoadingCourses || isLoadingStats;

  const filteredCourses = (Array.isArray(courses) ? courses : []).filter((course) => {
    if (activeTab === "active") return course.isActive;
    if (activeTab === "archive") return !course.isActive;
    return true;
  });

  const statsList = [
    {
      icon: <BookOpen className="h-8 w-8 text-[var(--ep-blue)]" />,
      label: "Jami kurslar",
      value: stats?.totalCourses || 0,
    },
    {
      icon: <GraduationCap className="h-8 w-8 text-[var(--ep-green)]" />,
      label: "Faol kurslar",
      value: stats?.activeCourses || 0,
    },
    {
      icon: <Brain className="h-8 w-8 text-[var(--ep-purple)]" />,
      label: "Jami modullar",
      value: stats?.totalModules || 0,
    },
    {
      icon: <Users className="h-8 w-8 text-[var(--ep-primary)]" />,
      label: "Test urinishlari",
      value: stats?.totalAttempts || 0,
    },
  ];

  if (isError) {
    return <EPErrorState onRetry={refetch} />;
  }

  if (isLoading) {
    return (
      <ModulePage
        module="hr"
        title="HR Capital - O'quv Kurslari"
        icon={<BookOpen className="h-5 w-5" />}
        actions={<Skeleton className="h-9 w-32 rounded-lg" />}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {([1, 2, 3, 4]).map((i) => (
            <StatsSkeleton key={`k-${i}`} />
          ))}
        </div>
        <Skeleton className="h-10 w-48 mb-6 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {([1, 2, 3, 4, 5, 6]).map((i) => (
            <CourseCardSkeleton key={`k-${i}`} />
          ))}
        </div>
      </ModulePage>
    );
  }

  return (
    <ModulePage
      module="hr"
      title="HR Capital - O'quv Kurslari"
      icon={<BookOpen className="h-5 w-5" />}
      actions={
        <Button
          data-testid="button-add-course"
          onClick={() => {
            // Handle add course
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Kurs qo'shish
        </Button>
      }
    >
      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {(Array.isArray(statsList) ? statsList : []).map((stat, idx) => (
          <Card key={idx}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                {stat.icon}
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p
                    className="text-2xl font-bold"
                    data-testid={`text-stat-${idx}`}
                  >
                    {stat.value}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs Section */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="all" data-testid="tab-all-courses">
            Barcha kurslar
          </TabsTrigger>
          <TabsTrigger value="active" data-testid="tab-active-courses">
            Faol
          </TabsTrigger>
          <TabsTrigger value="archive" data-testid="tab-archive-courses">
            Arxiv
          </TabsTrigger>
        </TabsList>

        {/* All Courses Tab */}
        <TabsContent value="all">
          {filteredCourses.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Hozircha kurslar mavjud emas
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(Array.isArray(filteredCourses) ? filteredCourses : []).map((course) => (
                <Card key={course.id} data-testid={`card-course-${course.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-[14px] font-semibold">{course.title}</CardTitle>
                      {getDifficultyBadge(course.difficulty)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Sessiya: {course.sessionNumber}</span>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full"
                      data-testid={`button-view-course-${course.id}`}
                    >
                      Ko'rish
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Active Courses Tab */}
        <TabsContent value="active">
          {filteredCourses.length === 0 ? (
            <div className="text-center py-12">
              <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Faol kurslar mavjud emas
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(Array.isArray(filteredCourses) ? filteredCourses : []).map((course) => (
                <Card key={course.id} data-testid={`card-course-${course.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-[14px] font-semibold">{course.title}</CardTitle>
                      {getDifficultyBadge(course.difficulty)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Sessiya: {course.sessionNumber}</span>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full"
                      data-testid={`button-view-course-${course.id}`}
                    >
                      Ko'rish
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Archive Tab */}
        <TabsContent value="archive">
          {filteredCourses.length === 0 ? (
            <div className="text-center py-12">
              <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Arxivlangan kurslar mavjud emas
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(Array.isArray(filteredCourses) ? filteredCourses : []).map((course) => (
                <Card key={course.id} data-testid={`card-course-${course.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-[14px] font-semibold">{course.title}</CardTitle>
                      {getDifficultyBadge(course.difficulty)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Sessiya: {course.sessionNumber}</span>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full"
                      data-testid={`button-view-course-${course.id}`}
                    >
                      Ko'rish
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </ModulePage>
  );
}
