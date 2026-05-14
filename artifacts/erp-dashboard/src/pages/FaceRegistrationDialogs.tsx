/** @module FaceRegistrationDialogs @description AlertDialog component for confirming deletion of a registered face embedding. Isolated so the parent list component stays concise. */

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface DeleteFaceDialogProps {
  faceId: string;
  isPending: boolean;
  onConfirm: (id: string) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DeleteFaceDialog({ faceId, isPending, onConfirm }: DeleteFaceDialogProps) {
  const { t } = useTranslation("common");
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          disabled={isPending}
          data-testid={`button-delete-face-${faceId}`}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Yuz ma&apos;lumotini o&apos;chirishni tasdiqlang</AlertDialogTitle>
          <AlertDialogDescription>
            Ushbu xodimning yuz ro&apos;yxatdan o&apos;tishi o&apos;chiriladi.
            Kirish nazorati uchun qayta ro&apos;yxatdan o&apos;tish talab qilinadi.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => onConfirm(faceId)}
            className="bg-red-600 hover:bg-[var(--ep-red)]/90"
          >
            O&apos;chirish
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
