/**
 * @module LessonPlayer
 * @description React page component — state management, hooks, and orchestration only.
 * UI is delegated to LessonPlayerSections; types live in LessonPlayerTypes.
 */

import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { BookOpen } from "lucide-react";
import type { Course, Lesson, ProgressData } from "./LessonPlayerTypes";
import { LessonSidebar, LessonContentArea } from "./LessonPlayerSections";
import { useTranslation } from '@/lib/i18n';

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function LessonPlayer() {
  const { t } = useTranslation("common");
  const { id, lessonId } = useParams<{ id: string; lessonId?: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { user } = useAuth();

  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [openModules, setOpenModules] = useState<Set<number>>(new Set());

  // -------------------------------------------------------------------------
  // Queries
  // -------------------------------------------------------------------------

  const { data: course, isLoading: courseLoading } = useQuery<Course>({
    queryKey: ["/api/courses", id],
    queryFn: async () => {
      return await apiRequest('GET', `/api/courses/${id}`);
    },
  });

  const { data: progressData } = useQuery<ProgressData>({
    queryKey: ["/api/lms/progress/my", id],
    queryFn: async () => {
      try {
        return await apiRequest<ProgressData>('GET', `/api/lms/progress/my?courseId=${id}`);
      } catch {
        return {
          completedLessonIds: [],
          totalLessons: 0,
          completedLessons: 0,
          progressPercent: 0,
        };
      }
    },
    enabled: !!id,
  });

  const completedIds = new Set(
    (progressData?.completedLessonIds ?? []).map(String)
  );

  // -------------------------------------------------------------------------
  // Mutations
  // -------------------------------------------------------------------------

  type CompleteLessonResponse = { certificateIssued?: boolean };
  const completeLesson = useMutation<CompleteLessonResponse, Error, { lessonId: number; courseId: number }>({
    mutationFn: async ({
      lessonId: lId,
      courseId,
    }) => {
      return await apiRequest<CompleteLessonResponse>("POST", "/api/lms/progress/complete", {
        userId: user?.id,
        lessonId: lId,
        courseId,
      });
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["/api/lms/progress/my", id] });
      if (data.certificateIssued) {
        toast({
          title: t("tabriklaymizEmoji"),
          description: t("kursMuvaffaqiyatliYakunlandiSertifikat"),
        });
      } else {
        toast({ title: t("darsBajarildiToast"), description: t("progressSaqlandi") });
      }
    },
    onError: () => {
      toast({
        title: t("xatolikTitle"),
        description: t("progressniSaqlashdaXatolik"),
        variant: "destructive",
      });
    },
  });

  // -------------------------------------------------------------------------
  // Effects
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (course && !activeLesson) {
      const allLessons = course.modules?.flatMap((m) => m.lessons) ?? [];
      if (lessonId) {
        const found = (Array.isArray(allLessons) ? allLessons : []).find(
          (l) => String(l.id) === lessonId
        );
        if (found) setActiveLesson(found);
      } else if (allLessons.length > 0) {
        const firstIncomplete = (Array.isArray(allLessons)
          ? allLessons
          : []
        ).find((l) => !completedIds.has(String(l.id)));
        setActiveLesson(firstIncomplete ?? allLessons[0]);
      }
      setOpenModules(new Set(course.modules?.map((m) => m.id)));
    }
  }, [course, lessonId]);

  // -------------------------------------------------------------------------
  // Derived state
  // -------------------------------------------------------------------------

  const allLessons = course?.modules?.flatMap((m) => m.lessons) ?? [];
  const currentIndex = activeLesson
    ? (Array.isArray(allLessons) ? allLessons : []).findIndex(
        (l) => l.id === activeLesson.id
      )
    : -1;
  const nextLesson =
    currentIndex >= 0 && currentIndex < allLessons.length - 1
      ? allLessons[currentIndex + 1]
      : null;

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  const handleMarkComplete = () => {
    if (!activeLesson || !id) return;
    completeLesson.mutate({
      lessonId: activeLesson.id,
      courseId: parseInt(id),
    });
  };

  const handleNextLesson = () => {
    if (nextLesson) {
      setActiveLesson(nextLesson);
      navigate(`/courses/${id}/lessons/${nextLesson.id}`);
    }
  };

  const handleSelectLesson = (lesson: Lesson) => {
    setActiveLesson(lesson);
    navigate(`/courses/${id}/lessons/${lesson.id}`);
  };

  const handleToggleModule = (modId: number, open: boolean) => {
    const next = new Set(openModules);
    if (open) next.add(modId); else next.delete(modId);
    setOpenModules(next);
  };

  // -------------------------------------------------------------------------
  // Loading / error states
  // -------------------------------------------------------------------------

  if (courseLoading) {
    return (
      <div className="flex h-full">
        <div className="w-72 border-r p-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={`k-${i}`} className="h-12 w-full rounded-lg" />
          ))}
        </div>
        <div className="flex-1 p-6">
          <Skeleton className="h-8 w-64 mb-4 rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">{t("kursTopilmadi")}</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => navigate("/courses")}
          >
            {t("kurslargaQaytish")}
          </Button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="flex h-full overflow-hidden bg-background">
      <LessonSidebar
        course={course}
        progressData={progressData}
        completedIds={completedIds}
        activeLesson={activeLesson}
        openModules={openModules}
        courseId={id ?? ""}
        onToggleModule={handleToggleModule}
        onSelectLesson={handleSelectLesson}
        onBackToCourse={() => navigate(`/courses/${id}`)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <LessonContentArea
          activeLesson={activeLesson}
          completedIds={completedIds}
          nextLesson={nextLesson}
          isPending={completeLesson.isPending}
          onMarkComplete={handleMarkComplete}
          onNextLesson={handleNextLesson}
        />
      </div>
    </div>
  );
}
