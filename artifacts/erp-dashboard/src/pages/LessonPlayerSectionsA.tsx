/**
 * @module LessonPlayerSectionsA
 * @description Sidebar / navigation components for LessonPlayer:
 *   - getLessonIcon  — icon helper
 *   - LessonSidebar  — left navigation panel (modules + lessons + progress)
 */

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  ChevronDown,
  CheckCircle,
  Circle,
  BookOpen,
  Video,
  FileText,
  Award,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Course, Lesson, ProgressData } from "./LessonPlayerTypes";
import { useTranslation } from '@/lib/i18n';

// ---------------------------------------------------------------------------
// Icon helper
// ---------------------------------------------------------------------------

export function getLessonIcon(type: string) {
  if (type === "video") return <Video className="h-4 w-4" />;
  if (type === "pdf") return <FileText className="h-4 w-4" />;
  return <BookOpen className="h-4 w-4" />;
}

// ---------------------------------------------------------------------------
// Sidebar props
// ---------------------------------------------------------------------------

interface LessonSidebarProps {
  course: Course;
  progressData: ProgressData | undefined;
  completedIds: Set<string>;
  activeLesson: Lesson | null;
  openModules: Set<number>;
  courseId: string;
  onToggleModule: (id: number, open: boolean) => void;
  onSelectLesson: (lesson: Lesson) => void;
  onBackToCourse: () => void;
}

// ---------------------------------------------------------------------------
// Sidebar component
// ---------------------------------------------------------------------------

export function LessonSidebar({ course, progressData, completedIds, activeLesson, openModules, courseId, onToggleModule, onSelectLesson, onBackToCourse, }: LessonSidebarProps) {
  const { t } = useTranslation('common');
  const progressPercent = progressData?.progressPercent ?? 0;

  return (
    <div className="w-80 border-r border-border bg-muted/40 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBackToCourse}
          className="mb-3 text-muted-foreground hover:text-foreground -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          {t("kursgaQaytish")}
        </Button>
        <h2 className="font-semibold text-foreground text-sm leading-tight line-clamp-2">
          {course.title}
        </h2>
        <div className="mt-3">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>{t('progress4')}</span>
            <span>{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-1.5" />
          <p className="text-xs text-muted-foreground mt-1">
            {progressData?.completedLessons ?? 0} / {progressData?.totalLessons ?? 0} dars
          </p>
        </div>
      </div>

      {/* Module / Lesson list */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {(Array.isArray(course.modules) ? course.modules : []).map((mod) => (
            <Collapsible
              key={mod.id}
              open={openModules.has(mod.id)}
              onOpenChange={(open) => onToggleModule(mod.id, open)}
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg hover:bg-muted/60 text-sm font-medium text-foreground text-left">
                <span className="flex-1 mr-2 line-clamp-1">{mod.title}</span>
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${
                    openModules.has(mod.id) ? "rotate-180" : ""
                  }`}
                />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="ml-3 mt-1 space-y-0.5">
                  {(Array.isArray(mod.lessons) ? mod.lessons : []).map((lesson) => {
                    const isCompleted = completedIds.has(String(lesson.id));
                    const isActive = activeLesson?.id === lesson.id;
                    return (
                      <button
                        key={lesson.id}
                        onClick={() => onSelectLesson(lesson)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                          isActive
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle className="h-4 w-4 text-[var(--ep-green)] shrink-0" />
                        ) : (
                          <Circle
                            className={`h-4 w-4 shrink-0 ${
                              isActive ? "text-primary" : "text-muted-foreground"
                            }`}
                          />
                        )}
                        <span className="flex-1 line-clamp-2 leading-tight">{lesson.title}</span>
                        {getLessonIcon(lesson.type)}
                      </button>
                    );
                  })}
                  {mod.lessons.length === 0 && (
                    <p className="px-3 py-2 text-xs text-muted-foreground italic">
                      {t("darslarYoq")}
                    </p>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </ScrollArea>

      {/* Certificate section */}
      {progressPercent >= 100 && (
        <div className="p-4 border-t border-border">
          <div className="bg-green-50 rounded-lg p-3 flex items-center gap-2">
            <Award className="h-4 w-4 text-[var(--ep-green)] shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-green-800">{t("kursYakunlandi")}</p>
              <p className="text-xs text-[var(--ep-green)]">{t("sertifikatBerildi")}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
