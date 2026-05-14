/**
 * @module CourseDeleteDialogs
 * @description React UI component.
 */

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

interface CourseDeleteDialogsProps {
  courseId: string;
  deleteCourseOpen: boolean;
  onDeleteCourseOpenChange: (open: boolean) => void;
  onConfirmDeleteCourse: () => void;
  deleteModuleId: string | null;
  onDeleteModuleIdChange: (id: string | null) => void;
  onConfirmDeleteModule: (id: string) => void;
  deleteLessonId: string | null;
  onDeleteLessonIdChange: (id: string | null) => void;
  onConfirmDeleteLesson: (id: string) => void;
}

export function CourseDeleteDialogs({
  deleteCourseOpen,
  onDeleteCourseOpenChange,
  onConfirmDeleteCourse,
  deleteModuleId,
  onDeleteModuleIdChange,
  onConfirmDeleteModule,
  deleteLessonId,
  onDeleteLessonIdChange,
  onConfirmDeleteLesson,
}: CourseDeleteDialogsProps) {
  return (
    <>
      <AlertDialog open={deleteCourseOpen} onOpenChange={onDeleteCourseOpenChange}>
        <AlertDialogContent data-testid="dialog-confirm-delete-course">
          <AlertDialogHeader>
            <AlertDialogTitle>O'chirishni tasdiqlash</AlertDialogTitle>
            <AlertDialogDescription>
              Kursni o'chirishni tasdiqlaysizmi? Bu amal qaytarilmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-course">Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              data-testid="button-confirm-delete-course"
              onClick={() => {
                onConfirmDeleteCourse();
                onDeleteCourseOpenChange(false);
              }}
            >
              O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteModuleId} onOpenChange={() => onDeleteModuleIdChange(null)}>
        <AlertDialogContent data-testid="dialog-confirm-delete-module">
          <AlertDialogHeader>
            <AlertDialogTitle>O'chirishni tasdiqlash</AlertDialogTitle>
            <AlertDialogDescription>
              Haqiqatan ham modulni o'chirmoqchimisiz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-module">Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              data-testid="button-confirm-delete-module"
              onClick={() => {
                if (deleteModuleId) {
                  onConfirmDeleteModule(deleteModuleId);
                  onDeleteModuleIdChange(null);
                }
              }}
            >
              O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteLessonId} onOpenChange={() => onDeleteLessonIdChange(null)}>
        <AlertDialogContent data-testid="dialog-confirm-delete-lesson">
          <AlertDialogHeader>
            <AlertDialogTitle>O'chirishni tasdiqlash</AlertDialogTitle>
            <AlertDialogDescription>
              Haqiqatan ham darsni o'chirmoqchimisiz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-lesson">Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              data-testid="button-confirm-delete-lesson"
              onClick={() => {
                if (deleteLessonId) {
                  onConfirmDeleteLesson(deleteLessonId);
                  onDeleteLessonIdChange(null);
                }
              }}
            >
              O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
