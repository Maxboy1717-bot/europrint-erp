import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { sanitizeHtml } from "@/lib/sanitize";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  CheckCircle,
  Circle,
  BookOpen,
  Video,
  FileText,
  Award,
  Play,
  Download,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Lesson {
  id: number;
  moduleId: string;
  title: string;
  titleRu?: string;
  type: string;
  content?: string;
  contentRu?: string;
  filePath?: string;
  videoUrl?: string;
  duration?: number;
  order: number;
}

interface Module {
  id: number;
  courseId: number;
  title: string;
  titleRu?: string;
  order: number;
  lessons: Lesson[];
  lessonCount?: number;
}

interface Course {
  id: number;
  title: string;
  titleRu?: string;
  description?: string;
  level?: string;
  duration?: number;
  modules: Module[];
}

interface ProgressData {
  completedLessonIds: string[];
  totalLessons: number;
  completedLessons: number;
  progressPercent: number;
}

function getLessonIcon(type: string) {
  if (type === "video") return <Video className="h-4 w-4" />;
  if (type === "pdf") return <FileText className="h-4 w-4" />;
  return <BookOpen className="h-4 w-4" />;
}

export default function LessonPlayer() {
  const { id, lessonId } = useParams<{ id: string; lessonId?: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { user } = useAuth();

  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [openModules, setOpenModules] = useState<Set<number>>(new Set());

  const { data: course, isLoading: courseLoading } = useQuery<Course>({
    queryKey: ["/api/courses", id],
    queryFn: async () => {
      const res = await fetch(`/api/courses/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Kurs topilmadi");
      return res.json();
    },
  });

  const { data: progressData, isLoading: progressLoading } = useQuery<ProgressData>({
    queryKey: ["/api/lms/progress/my", id],
    queryFn: async () => {
      const res = await fetch(`/api/lms/progress/my?courseId=${id}`, { credentials: "include" });
      if (!res.ok) return { completedLessonIds: [], totalLessons: 0, completedLessons: 0, progressPercent: 0 };
      return res.json();
    },
    enabled: !!id,
  });

  const completedIds = new Set((progressData?.completedLessonIds || []).map(String));

  const completeLesson = useMutation({
    mutationFn: async ({ lessonId: lId, courseId }: { lessonId: number; courseId: number }) => {
      const res = await apiRequest("POST", "/api/lms/progress/complete", {
        userId: user?.id,
        lessonId: lId,
        courseId,
      });
      return res.json();
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["/api/lms/progress/my", id] });
      if (data.certificateIssued) {
        toast({
          title: "🎉 Tabriklaymiz!",
          description: "Kurs muvaffaqiyatli yakunlandi! Sertifikat berildi.",
        });
      } else {
        toast({ title: "Dars bajarildi", description: "Progress saqlandi" });
      }
    },
    onError: () => {
      toast({ title: "Xatolik", description: "Progressni saqlashda xatolik", variant: "destructive" });
    },
  });

  // Set initial active lesson
  useEffect(() => {
    if (course && !activeLesson) {
      const allLessons = course.modules?.flatMap((m) => m.lessons);
      if (lessonId) {
        const found = (Array.isArray(allLessons) ? allLessons : []).find((l) => String(l.id) === lessonId);
        if (found) setActiveLesson(found);
      } else if (allLessons.length > 0) {
        // Find first incomplete lesson
        const firstIncomplete = (Array.isArray(allLessons) ? allLessons : []).find((l) => !completedIds.has(String(l.id)));
        setActiveLesson(firstIncomplete || allLessons[0]);
      }
      // Open all modules by default
      setOpenModules(new Set(course.modules?.map((m) => m.id)));
    }
  }, [course, lessonId]);

  const allLessons = course?.modules?.flatMap((m) => m.lessons) || [];
  const currentIndex = activeLesson ? (Array.isArray(allLessons) ? allLessons : []).findIndex((l) => l.id === activeLesson.id) : -1;
  const nextLesson = currentIndex >= 0 && currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  const handleMarkComplete = () => {
    if (!activeLesson || !id) return;
    completeLesson.mutate({ lessonId: activeLesson.id, courseId: parseInt(id) });
  };

  const handleNextLesson = () => {
    if (nextLesson) {
      setActiveLesson(nextLesson);
      navigate(`/courses/${id}/lessons/${nextLesson.id}`);
    }
  };

  if (courseLoading) {
    return (
      <div className="flex h-full">
        <div className="w-72 border-r p-4 space-y-3">
          {([1, 2, 3]).map((i) => <Skeleton key={`k-${i}`} className="h-12 w-full" />)}
        </div>
        <div className="flex-1 p-6">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <BookOpen className="h-12 w-12 text-on-surface-variant mx-auto mb-3" />
          <p className="text-on-surface-variant">Kurs topilmadi</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/courses")}>
            Kurslarga qaytish
          </Button>
        </div>
      </div>
    );
  }

  const progressPercent = progressData?.progressPercent || 0;

  return (
    <div className="flex h-full overflow-hidden bg-surface">
      {/* Sidebar */}
      <div className="w-80 border-r border-outline-variant bg-surface-container-low flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-outline-variant">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/courses/${id}`)}
            className="mb-3 text-on-surface-variant hover:text-on-surface -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Kursga qaytish
          </Button>
          <h2 className="font-semibold text-on-surface text-sm leading-tight line-clamp-2">{course.title}</h2>
          <div className="mt-3">
            <div className="flex justify-between text-xs text-on-surface-variant mb-1">
              <span>Progress</span>
              <span>{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} className="h-1.5" />
            <p className="text-xs text-on-surface-variant mt-1">
              {progressData?.completedLessons || 0} / {progressData?.totalLessons || 0} dars
            </p>
          </div>
        </div>

        {/* Module/Lesson list */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {(Array.isArray(course.modules) ? course.modules : []).map((mod) => (
              <Collapsible
                key={mod.id}
                open={openModules.has(mod.id)}
                onOpenChange={(open) => {
                  const next = new Set(openModules);
                  open ? next.add(mod.id) : next.delete(mod.id);
                  setOpenModules(next);
                }}
              >
                <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg hover:bg-surface-container text-sm font-medium text-on-surface text-left">
                  <span className="flex-1 mr-2 line-clamp-1">{mod.title}</span>
                  <ChevronDown className={`h-4 w-4 text-on-surface-variant shrink-0 transition-transform ${openModules.has(mod.id) ? "rotate-180" : ""}`} />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="ml-3 mt-1 space-y-0.5">
                    {(Array.isArray(mod.lessons) ? mod.lessons : []).map((lesson) => {
                      const isCompleted = completedIds.has(String(lesson.id));
                      const isActive = activeLesson?.id === lesson.id;
                      return (
                        <button
                          key={lesson.id}
                          onClick={() => {
                            setActiveLesson(lesson);
                            navigate(`/courses/${id}/lessons/${lesson.id}`);
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                            isActive
                              ? "bg-primary-container text-on-primary-container font-medium"
                              : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                          ) : (
                            <Circle className={`h-4 w-4 shrink-0 ${isActive ? "text-primary" : "text-on-surface-variant"}`} />
                          )}
                          <span className="flex-1 line-clamp-2 leading-tight">{lesson.title}</span>
                          {getLessonIcon(lesson.type)}
                        </button>
                      );
                    })}
                    {mod.lessons.length === 0 && (
                      <p className="px-3 py-2 text-xs text-on-surface-variant italic">Darslar yo'q</p>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </ScrollArea>

        {/* Certificate section */}
        {progressPercent >= 100 && (
          <div className="p-4 border-t border-outline-variant">
            <div className="bg-green-50 rounded-lg p-3 flex items-center gap-2">
              <Award className="h-5 w-5 text-green-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-green-800">Kurs yakunlandi!</p>
                <p className="text-xs text-green-600">Sertifikat berildi</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeLesson ? (
          <>
            {/* Lesson header */}
            <div className="border-b border-outline-variant px-6 py-4 flex items-center justify-between bg-surface">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {getLessonIcon(activeLesson.type)}
                  <Badge variant="outline" className="text-xs capitalize">{activeLesson.type}</Badge>
                  {completedIds.has(String(activeLesson.id)) && (
                    <Badge className="bg-green-100 text-green-700 text-xs border-0">
                      <CheckCircle className="h-3 w-3 mr-1" />Bajarilgan
                    </Badge>
                  )}
                </div>
                <h1 className="text-xl font-semibold text-on-surface">{activeLesson.title}</h1>
              </div>
              <div className="flex gap-2">
                {!completedIds.has(String(activeLesson.id)) && (
                  <Button
                    onClick={handleMarkComplete}
                    disabled={completeLesson.isPending}
                    className="bg-gradient-to-br from-primary to-primary-dim text-white"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Bajarildi deb belgilash
                  </Button>
                )}
                {nextLesson && (
                  <Button variant="outline" onClick={handleNextLesson}>
                    Keyingi dars
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                )}
              </div>
            </div>

            {/* Lesson content */}
            <ScrollArea className="flex-1">
              <div className="p-6 max-w-4xl mx-auto">
                {/* Video lesson */}
                {activeLesson.type === "video" && (activeLesson.videoUrl || activeLesson.filePath) && (
                  <div className="mb-6 rounded-xl overflow-hidden bg-black aspect-video">
                    <video
                      key={activeLesson.id}
                      controls
                      className="w-full h-full"
                      src={activeLesson.videoUrl || (activeLesson.filePath ? `/uploads/${activeLesson.filePath}` : undefined)}
                      onEnded={handleMarkComplete}
                    >
                      Brauzeringiz video formatini qo'llab-quvvatlamaydi.
                    </video>
                  </div>
                )}

                {/* PDF lesson */}
                {activeLesson.type === "pdf" && activeLesson.filePath && (
                  <div className="mb-6">
                    <div className="rounded-xl overflow-hidden border border-outline-variant" style={{ height: "600px" }}>
                      <iframe
                        src={`/uploads/${activeLesson.filePath}`}
                        className="w-full h-full"
                        title={activeLesson.title}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => window.open(`/uploads/${activeLesson.filePath}`, "_blank")}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      PDF yuklab olish
                    </Button>
                  </div>
                )}

                {/* Video without URL placeholder */}
                {activeLesson.type === "video" && !activeLesson.videoUrl && !activeLesson.filePath && (
                  <div className="mb-6 rounded-xl bg-surface-container aspect-video flex items-center justify-center border border-outline-variant">
                    <div className="text-center">
                      <Play className="h-12 w-12 text-on-surface-variant mx-auto mb-2" />
                      <p className="text-on-surface-variant text-sm">Video fayli yuklanmagan</p>
                    </div>
                  </div>
                )}

                {/* Text content */}
                {activeLesson.content && (
                  <div className="prose prose-sm max-w-none">
                    <div
                      className="text-on-surface leading-relaxed text-base whitespace-pre-wrap"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(activeLesson.content) }}
                    />
                  </div>
                )}

                {/* No content fallback */}
                {!activeLesson.content && !activeLesson.videoUrl && !activeLesson.filePath && activeLesson.type === "text" && (
                  <div className="text-center py-16">
                    <BookOpen className="h-12 w-12 text-on-surface-variant mx-auto mb-3" />
                    <p className="text-on-surface-variant">Mazmun hali qo'shilmagan</p>
                  </div>
                )}

                {/* Bottom actions */}
                <div className="flex gap-3 mt-8 pt-6 border-t border-outline-variant">
                  {!completedIds.has(String(activeLesson.id)) ? (
                    <Button
                      onClick={handleMarkComplete}
                      disabled={completeLesson.isPending}
                      className="bg-gradient-to-br from-primary to-primary-dim text-white"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {completeLesson.isPending ? "Saqlanmoqda..." : "Darsni yakunlash"}
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">Bajarilgan</span>
                    </div>
                  )}
                  {nextLesson && (
                    <Button variant="outline" onClick={handleNextLesson}>
                      Keyingi: {nextLesson.title}
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            </ScrollArea>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <BookOpen className="h-16 w-16 text-on-surface-variant mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-on-surface mb-2">Dars tanlang</h2>
              <p className="text-on-surface-variant">Chap paneldan darsni bosing</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
