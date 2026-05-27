/**
 * @module CourseDetail
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Plus, Trash2, Play } from "lucide-react";
import { AddModuleDialog } from "@/components/AddModuleDialog";
import { AddLessonDialog } from "@/components/AddLessonDialog";
import { AssignCourseDialog } from "@/components/AssignCourseDialog";
import { CourseModuleList } from "@/components/lms/CourseModuleList";
import { CourseDeleteDialogs } from "@/components/lms/CourseDeleteDialogs";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { EPErrorState, EPPageHeader, EPStatusPill } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';
export default function CourseDetail() {
  const { t } = useTranslation("common");
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [showAddModule, setShowAddModule] = useState(false);
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [showAssignCourse, setShowAssignCourse] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [deleteCourseOpen, setDeleteCourseOpen] = useState(false);
  const [deleteModuleId, setDeleteModuleId] = useState<string | null>(null);
  const [deleteLessonId, setDeleteLessonId] = useState<string | null>(null);

  const { data: course, isLoading, isError, error, refetch } = useQuery<{
    id: string;
    title: string;
    description: string;
    mentorId: string | null;
    isRequired: boolean;
    code?: string;
    level?: string;
    modules: Array<{
      id: string;
      title: string;
      description: string;
      lessons: Array<{
        id: string;
        title: string;
        type: string;
        duration: number | null;
      }>;
    }>;
  }>({
    queryKey: ["/api/courses", id],
  });

  const { data: employeesResponse } = useQuery<{ data: Array<{ id: string; fullName: string; departmentId: string | null }> }>({
    queryKey: ["/api/hr/employees"],
  });
  const employees = employeesResponse?.data ?? [];

  const { data: mentors = [] } = useQuery<Array<{ id: string; userId: string | null; fullName: string; name?: string; bio?: string; source?: string; experience?: string; expertise?: string; achievements?: string }>>({
    queryKey: ["/api/mentors"],
  });

  const deleteModuleMutation = useMutation({
    mutationFn: async (moduleId: string) => {
      return await apiRequest("DELETE", `/api/modules/${moduleId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", id] });
      toast({ title: "Modul o'chirildi" });
    },
    onError: () => {
      toast({ title: "Xatolik", description: "Modulni o'chirishda xatolik yuz berdi", variant: "destructive" });
    },
  });

  const deleteLessonMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      return await apiRequest("DELETE", `/api/lessons/${lessonId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", id] });
      toast({ title: "Dars o'chirildi" });
    },
    onError: () => {
      toast({ title: "Xatolik", description: "Darsni o'chirishda xatolik yuz berdi", variant: "destructive" });
    },
  });

  const deleteCourseMutation = useMutation({
    mutationFn: async (courseId: string) => {
      return await apiRequest("DELETE", `/api/courses/${courseId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({ title: "Kurs o'chirildi", description: "Kurs muvaffaqiyatli o'chirildi" });
      navigate("/courses");
    },
    onError: () => {
      toast({ title: "Xatolik", description: "Kursni o'chirishda xatolik yuz berdi", variant: "destructive" });
    },
  });

  if (isError) {
    return <EPErrorState onRetry={refetch}  error={error} />;
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-8 w-64 rounded-lg" />
            <Skeleton className="h-4 w-96 rounded-lg" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-40 rounded-lg" />
            <Skeleton className="h-10 w-48 rounded-lg" />
          </div>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40 rounded-lg" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20 rounded-lg" />
                <Skeleton className="h-5 w-32 rounded-lg" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-16 rounded-lg" />
                <Skeleton className="h-5 w-24 rounded-lg" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
            <div className="space-y-2">
              <Skeleton className="h-6 w-48 rounded-lg" />
              <Skeleton className="h-4 w-64 rounded-lg" />
            </div>
            <Skeleton className="h-10 w-36 rounded-lg" />
          </CardHeader>
          <CardContent className="space-y-3">
            {([1, 2, 3]).map((i) => (
              <div key={`k-${i}`} className="flex items-center gap-3 p-4 border rounded-md">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-5 flex-1 rounded-lg" />
                <Skeleton className="h-6 w-16 rounded-lg" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">{t("kursTopilmadi")}</p>
        <Button onClick={() => navigate("/courses")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t("back")}
        </Button>
      </div>
    );
  }

  const modules = course.modules ?? [];
  const mentor = (Array.isArray(mentors) ? mentors : []).find(m => m.id === course.mentorId);
  const mentorEmployee = mentor?.userId
    ? (Array.isArray(employees) ? employees : []).find(emp => emp.id === mentor.userId)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/courses")}
          data-testid="button-back"
          className="hover:bg-muted text-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <EPPageHeader
        breadcrumb={<>{t("dashboardLms")}<b className="text-foreground">{course.title}</b></>}
        title={course.title}
      />
            {course.isRequired && (
              <Badge className="bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-none">
                {t("majburiy")}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">{course.description}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="destructive"
            onClick={() => setDeleteCourseOpen(true)}
            disabled={deleteCourseMutation.isPending}
            data-testid="button-delete-course"
            className="bg-red-100 text-red-800 hover:bg-red-200 border-none shadow-none rounded-lg px-4 py-2"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {deleteCourseMutation.isPending ? "O'chirilmoqda..." : "Kursni o'chirish"}
          </Button>
          <Button
            onClick={() => navigate(`/courses/${id}/lessons`)}
            data-testid="button-start-course"
            variant="outline"
            className="rounded-lg px-4 py-2"
          >
            <Play className="w-4 h-4 mr-2" />
            {t("oqishniBoshlash")}
          </Button>
          <Button
            onClick={() => setShowAssignCourse(true)}
            data-testid="button-assign-course"
            className="bg-primary text-white rounded-lg px-5 py-2.5 text-sm font-semibold shadow-none"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t("xodimlargaTayinlash")}
          </Button>
        </div>
      </div>

      <Card className="bg-card border-border shadow-none">
        <CardHeader>
          <CardTitle className="text-foreground">{t("kursMalumotlari")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t("kursKodi1")}</p>
              <p className="text-xl font-bold tracking-tight text-foreground">{course.code}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t("daraja")}</p>
              <p className="text-xl font-bold tracking-tight text-foreground">
                {course.level === "beginner" ? "Boshlang'ich"
                  : course.level === "intermediate" ? "O'rta"
                  : "Ilg'or"}
              </p>
            </div>
          </div>

          {mentor && (
            <div className="pt-4 border-t border-border">
              <p className="text-sm font-semibold text-foreground mb-3">{t("mentorHaqida")}</p>
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t("ism1")}</p>
                  <p className="font-medium text-foreground">{mentor.name}</p>
                  {mentorEmployee && (
                    <EPStatusPill tone="neutral" className="mt-1 bg-muted/60 text-foreground shadow-none border-none">
                      Kompaniya xodimi: {mentorEmployee.fullName}
                    </EPStatusPill>
                  )}
                </div>
                {mentor.bio && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{t("kim1")}</p>
                    <p className="text-sm">{mentor.bio}</p>
                  </div>
                )}
                {mentor.source && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{t("qayerdan")}</p>
                    <p className="text-sm">{mentor.source}</p>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {mentor.experience && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{t("tajriba")}</p>
                      <p className="text-sm">{mentor.experience}</p>
                    </div>
                  )}
                  {mentor.expertise && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{t("mutaxassislik")}</p>
                      <p className="text-sm">{mentor.expertise}</p>
                    </div>
                  )}
                </div>
                {mentor.achievements && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{t("yutuqlar")}</p>
                    <p className="text-sm">{mentor.achievements}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <CourseModuleList
        modules={modules}
        onAddModule={() => setShowAddModule(true)}
        onAddLesson={(moduleId) => {
          setSelectedModuleId(moduleId);
          setShowAddLesson(true);
        }}
        onDeleteModule={(moduleId) => setDeleteModuleId(moduleId)}
        onDeleteLesson={(lessonId) => setDeleteLessonId(lessonId)}
      />

      <AddModuleDialog
        open={showAddModule}
        onOpenChange={setShowAddModule}
        courseId={id!}
      />

      <AddLessonDialog
        open={showAddLesson}
        onOpenChange={setShowAddLesson}
        moduleId={selectedModuleId!}
        onClose={() => setSelectedModuleId(null)}
      />

      <AssignCourseDialog
        open={showAssignCourse}
        onOpenChange={setShowAssignCourse}
        courseId={id!}
        courseTitle={course.title}
      />

      <CourseDeleteDialogs
        courseId={id!}
        deleteCourseOpen={deleteCourseOpen}
        onDeleteCourseOpenChange={setDeleteCourseOpen}
        onConfirmDeleteCourse={() => deleteCourseMutation.mutate(id!)}
        deleteModuleId={deleteModuleId}
        onDeleteModuleIdChange={setDeleteModuleId}
        onConfirmDeleteModule={(moduleId) => deleteModuleMutation.mutate(moduleId)}
        deleteLessonId={deleteLessonId}
        onDeleteLessonIdChange={setDeleteLessonId}
        onConfirmDeleteLesson={(lessonId) => deleteLessonMutation.mutate(lessonId)}
      />
    </div>
  );
}
