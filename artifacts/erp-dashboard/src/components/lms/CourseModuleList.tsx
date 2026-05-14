/**
 * @module CourseModuleList
 * @description React UI component.
 */

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Plus, Trash2, GripVertical, Video, FileText } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface Lesson {
  id: string;
  title: string;
  type: string;
  duration: number | null;
}

interface Module {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
}

interface CourseModuleListProps {
  modules: Module[];
  onAddModule: () => void;
  onAddLesson: (moduleId: string) => void;
  onDeleteModule: (moduleId: string) => void;
  onDeleteLesson: (lessonId: string) => void;
}

function getLessonIcon(type: string) {
  switch (type) {
    case "video": return <Video className="w-4 h-4" />;
    case "pdf":   return <FileText className="w-4 h-4" />;
    default:      return <BookOpen className="w-4 h-4" />;
  }
}

export function CourseModuleList({
  modules,
  onAddModule,
  onAddLesson,
  onDeleteModule,
  onDeleteLesson,
}: CourseModuleListProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
        <div>
          <CardTitle>Modullar va Darslar</CardTitle>
          <CardDescription>Kurs tarkibini boshqaring</CardDescription>
        </div>
        <Button onClick={onAddModule} data-testid="button-add-module">
          <Plus className="w-4 h-4 mr-2" />
          Modul qo'shish
        </Button>
      </CardHeader>
      <CardContent>
        {modules.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Modullar mavjud emas</h3>
            <p className="text-muted-foreground mb-4">Kursga birinchi modulni qo'shing</p>
            <Button onClick={onAddModule}>
              <Plus className="w-4 h-4 mr-2" />
              Modul qo'shish
            </Button>
          </div>
        ) : (
          <Accordion type="single" collapsible className="w-full">
            {modules.map((module, index) => (
              <AccordionItem key={module.id} value={module.id}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3 flex-1">
                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{index + 1}. {module.title}</span>
                    <Badge variant="secondary" className="ml-auto mr-4">
                      {module.lessons?.length ?? 0} dars
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pt-4">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm text-muted-foreground">{module.description}</p>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => onAddLesson(module.id)}
                          data-testid={`button-add-lesson-${module.id}`}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Dars qo'shish
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onDeleteModule(module.id)}
                          data-testid={`button-delete-module-${module.id}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    {module.lessons?.length > 0 ? (
                      <div className="space-y-2">
                        {module.lessons.map((lesson, lessonIndex) => (
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
                                <p className="text-xs text-muted-foreground">{lesson.duration} daqiqa</p>
                              )}
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {lesson.type === "video" ? "Video" : lesson.type === "pdf" ? "PDF" : "Matn"}
                            </Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onDeleteLesson(lesson.id)}
                              data-testid={`button-delete-lesson-${lesson.id}`}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 border rounded-md bg-muted/30">
                        <p className="text-sm text-muted-foreground">Bu modulda hali darslar yo'q</p>
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
  );
}
