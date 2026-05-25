/**
 * @module CourseDeleteDialogs
 * @description React UI component.
 */

import { useTranslation } from '@/lib/i18n';
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
  const { t } = useTranslation("common");
  return (
    <>
      <AlertDialog open={deleteCourseOpen} onOpenChange={onDeleteCourseOpenChange}>
        <AlertDialogContent data-testid="dialog-confirm-delete-course">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("ochirishniTasdiqlash")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("kursniOchirishniTasdiqlaysizmiBuAmal")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-course">{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              data-testid="button-confirm-delete-course"
              onClick={() => {
                onConfirmDeleteCourse();
                onDeleteCourseOpenChange(false);
              }}
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteModuleId} onOpenChange={() => onDeleteModuleIdChange(null)}>
        <AlertDialogContent data-testid="dialog-confirm-delete-module">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("ochirishniTasdiqlash")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("haqiqatanHamModulniOchirmoqchimisiz")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-module">{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              data-testid="button-confirm-delete-module"
              onClick={() => {
                if (deleteModuleId) {
                  onConfirmDeleteModule(deleteModuleId);
                  onDeleteModuleIdChange(null);
                }
              }}
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteLessonId} onOpenChange={() => onDeleteLessonIdChange(null)}>
        <AlertDialogContent data-testid="dialog-confirm-delete-lesson">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("ochirishniTasdiqlash")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("haqiqatanHamDarsniOchirmoqchimisiz")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-lesson">{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              data-testid="button-confirm-delete-lesson"
              onClick={() => {
                if (deleteLessonId) {
                  onConfirmDeleteLesson(deleteLessonId);
                  onDeleteLessonIdChange(null);
                }
              }}
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
