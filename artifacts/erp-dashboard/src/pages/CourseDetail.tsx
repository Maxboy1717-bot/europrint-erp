import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Plus, BookOpen, Video, FileText, Trash2, Edit, GripVertical, Play } from "lucide-react";
import { AddModuleDialog } from "@/components/AddModuleDialog";
import { AddLessonDialog } from "@/components/AddLessonDialog";
import { AssignCourseDialog } from "@/components/AssignCourseDialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ErrorState } from "@/components/ui/error-state";

export default function CourseDetail() {
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

  const { data: course, isLoading, isError, refetch} = useQuery<{
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
    queryKey: ["/api/employees"],
  });
  const employees = employeesResponse?.data || [];

  const { data: mentors = [] } = useQuery<Array<{ id: string; userId: string | null; fullName: string; name?: string; bio?: string; source?: string; experience?: string; expertise?: string; achievements?: string }>>({
    queryKey: ["/api/mentors"],
  });

  const deleteModuleMutation = useMutation({
    mutationFn: async (moduleId: string) => {
      const response = await apiRequest("DELETE", `/api/modules/${moduleId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", id] });
      toast({ title: "Modul o'chirildi" });
    },
    onError: () => {
      toast({ 
        title: "Xatolik", 
        description: "Modulni o'chirishda xatolik yuz berdi",
        variant: "destructive" 
      });
    },
  });

  const deleteLessonMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      const response = await apiRequest("DELETE", `/api/lessons/${lessonId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", id] });
      toast({ title: "Dars o'chirildi" });
    },
    onError: () => {
      toast({ 
        title: "Xatolik", 
        description: "Darsni o'chirishda xatolik yuz berdi",
        variant: "destructive" 
      });
    },
  });

  const deleteCourseMutation = useMutation({
    mutationFn: async (courseId: string) => {
      const response = await apiRequest("DELETE", `/api/courses/${courseId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({ title: "Kurs o'chirildi", description: "Kurs muvaffaqiyatli o'chirildi" });
      navigate("/courses");
    },
    onError: () => {
      toast({ 
        title: "Xatolik", 
        description: "Kursni o'chirishda xatolik yuz berdi",
        variant: "destructive" 
      });
    },
  });

  if (isError) {
    return <ErrorState onRetry={refetch} />;
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-md" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-48" />
          </div>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-32" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-5 w-24" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-10 w-36" />
          </CardHeader>
          <CardContent className="space-y-3">
            {([1, 2, 3]).map((i) => (
              <div key={`k-${i}`} className="flex items-center gap-3 p-4 border rounded-md">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-5 flex-1" />
                <Skeleton className="h-6 w-16" />
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
        <p className="text-muted-foreground mb-4">Kurs topilmadi</p>
        <Button onClick={() => navigate("/courses")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Orqaga
        </Button>
      </div>
    );
  }

  const modules = course.modules || [];
  const mentor = (Array.isArray(mentors) ? mentors : []).find(m => m.id === course.mentorId);
  const mentorEmployee = mentor?.userId ? (Array.isArray(employees) ? employees : []).find(emp => emp.id === mentor.userId) : null;

  const getLessonIcon = (type: string) => {
    switch (type) {
      case "video": return <Video className="w-4 h-4" />;
      case "pdf": return <FileText className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/courses")} data-testid="button-back" className="hover:bg-surface-container-high text-on-surface">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-light tracking-tight text-on-surface">
              {course.title.split(' ')[0]} <span className="font-bold text-primary">{course.title.split(' ').slice(1).join(' ')}</span>
            </h1>
            {course.isRequired && (
              <Badge className="bg-primary-container text-on-primary-container rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-none">Majburiy</Badge>
            )}
          </div>
          <p className="text-on-surface-variant">{course.description}</p>
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
            O'qishni boshlash
          </Button>
          <Button 
            onClick={() => setShowAssignCourse(true)} 
            data-testid="button-assign-course"
            className="bg-gradient-to-br from-primary to-primary-dim text-white rounded-lg px-5 py-2.5 text-sm font-semibold shadow-none"
          >
            <Plus className="w-4 h-4 mr-2" />
            Xodimlarga tayinlash
          </Button>
        </div>
      </div>

      <Card className="bg-surface-container-lowest border-outline-variant shadow-none">
        <CardHeader>
          <CardTitle className="text-on-surface">Kurs ma'lumotlari</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">Kurs kodi</p>
              <p className="text-xl font-bold tracking-tight text-on-surface">{course.code}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">Daraja</p>
              <p className="text-xl font-bold tracking-tight text-on-surface">
                {course.level === "beginner" ? "Boshlang'ich" : 
                 course.level === "intermediate" ? "O'rta" : "Ilg'or"}
              </p>
            </div>
          </div>
          
          {mentor && (
            <div className="pt-4 border-t border-outline-variant">
              <p className="text-sm font-semibold text-on-surface mb-3">Mentor haqida</p>
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">Ism</p>
                  <p className="font-medium text-on-surface">{mentor.name}</p>
                  {mentorEmployee && (
                    <Badge variant="secondary" className="mt-1 bg-surface-container text-on-surface shadow-none border-none">
                      Kompaniya xodimi: {mentorEmployee.fullName}
                    </Badge>
                  )}
                </div>
                
                {mentor.bio && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Kim</p>
                    <p className="text-sm">{mentor.bio}</p>
                  </div>
                )}
                
                {mentor.source && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Qayerdan</p>
                    <p className="text-sm">{mentor.source}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  {mentor.experience && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Tajriba</p>
                      <p className="text-sm">{mentor.experience}</p>
                    </div>
                  )}
                  
                  {mentor.expertise && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Mutaxassislik</p>
                      <p className="text-sm">{mentor.expertise}</p>
                    </div>
                  )}
                </div>
                
                {mentor.achievements && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Yutuqlar</p>
                    <p className="text-sm">{mentor.achievements}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
          <div>
            <CardTitle>Modullar va Darslar</CardTitle>
            <CardDescription>Kurs tarkibini boshqaring</CardDescription>
          </div>
          <Button onClick={() => setShowAddModule(true)} data-testid="button-add-module">
            <Plus className="w-4 h-4 mr-2" />
            Modul qo'shish
          </Button>
        </CardHeader>
        <CardContent>
          {modules.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Modullar mavjud emas</h3>
              <p className="text-muted-foreground mb-4">
                Kursga birinchi modulni qo'shing
              </p>
              <Button onClick={() => setShowAddModule(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Modul qo'shish
              </Button>
            </div>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {(Array.isArray(modules) ? modules : []).map((module, index) => (
                <AccordionItem key={module.id} value={module.id}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3 flex-1">
                      <GripVertical className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">
                        {index + 1}. {module.title}
                      </span>
                      <Badge variant="secondary" className="ml-auto mr-4">
                        {module.lessons?.length || 0} dars
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pt-4">
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-sm text-muted-foreground">
                          {module.description}
                        </p>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedModuleId(module.id);
                              setShowAddLesson(true);
                            }}
                            data-testid={`button-add-lesson-${module.id}`}
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Dars qo'shish
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteModuleId(module.id)}
                            data-testid={`button-delete-module-${module.id}`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      {module.lessons && module.lessons.length > 0 ? (
                        <div className="space-y-2">
                          {(Array.isArray(module.lessons) ? module.lessons : []).map((lesson, lessonIndex) => (
                            <div
                              key={lesson.id}
                              className="flex items-center gap-3 p-3 rounded-md border hover-elevate"
                              data-testid={`lesson-${lesson.id}`}
                            >
                              <GripVertical className="w-4 h-4 text-muted-foreground" />
                              {getLessonIcon(lesson.type)}
                              <div className="flex-1">
                                <p className="font-medium text-sm">
                                  {lessonIndex + 1}. {lesson.title}
                                </p>
                                {lesson.duration && (
                                  <p className="text-xs text-muted-foreground">
                                    {lesson.duration} daqiqa
                                  </p>
                                )}
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {lesson.type === "video" ? "Video" : lesson.type === "pdf" ? "PDF" : "Matn"}
                              </Badge>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setDeleteLessonId(lesson.id)}
                                data-testid={`button-delete-lesson-${lesson.id}`}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 border rounded-md bg-muted/30">
                          <p className="text-sm text-muted-foreground">
                            Bu modulda hali darslar yo'q
                          </p>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>

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
        courseTitle={course?.title || ""}
      />

      <AlertDialog open={deleteCourseOpen} onOpenChange={setDeleteCourseOpen}>
        <AlertDialogContent data-testid="dialog-confirm-delete-course">
          <AlertDialogHeader>
            <AlertDialogTitle>O'chirishni tasdiqlash</AlertDialogTitle>
            <AlertDialogDescription>
              Kursni o'chirishni tasdiqlaysizmi? Bu amal qaytarilmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-course">Bekor qilish</AlertDialogCancel>
            <AlertDialogAction data-testid="button-confirm-delete-course"
              onClick={() => {
                deleteCourseMutation.mutate(id!);
                setDeleteCourseOpen(false);
              }}
            >
              O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteModuleId} onOpenChange={() => setDeleteModuleId(null)}>
        <AlertDialogContent data-testid="dialog-confirm-delete-module">
          <AlertDialogHeader>
            <AlertDialogTitle>O'chirishni tasdiqlash</AlertDialogTitle>
            <AlertDialogDescription>
              Haqiqatan ham modulni o'chirmoqchimisiz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-module">Bekor qilish</AlertDialogCancel>
            <AlertDialogAction data-testid="button-confirm-delete-module"
              onClick={() => {
                if (deleteModuleId) {
                  deleteModuleMutation.mutate(deleteModuleId);
                  setDeleteModuleId(null);
                }
              }}
            >
              O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteLessonId} onOpenChange={() => setDeleteLessonId(null)}>
        <AlertDialogContent data-testid="dialog-confirm-delete-lesson">
          <AlertDialogHeader>
            <AlertDialogTitle>O'chirishni tasdiqlash</AlertDialogTitle>
            <AlertDialogDescription>
              Haqiqatan ham darsni o'chirmoqchimisiz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-lesson">Bekor qilish</AlertDialogCancel>
            <AlertDialogAction data-testid="button-confirm-delete-lesson"
              onClick={() => {
                if (deleteLessonId) {
                  deleteLessonMutation.mutate(deleteLessonId);
                  setDeleteLessonId(null);
                }
              }}
            >
              O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
