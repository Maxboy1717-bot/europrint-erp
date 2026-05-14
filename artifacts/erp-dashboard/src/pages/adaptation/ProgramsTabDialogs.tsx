/** @module ProgramsTabDialogs @description Auxiliary dialog components for the ProgramsTab feature: TemplatesDialog and DeleteConfirmDialog. The ProgramFormDialog lives in ProgramsTabFormDialog.tsx. */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { useTranslation } from '@/lib/i18n';

// Re-export for convenience
export { ProgramFormDialog } from "./ProgramsTabFormDialog";

// ---------------------------------------------------------------------------
// TemplatesDialog
// ---------------------------------------------------------------------------

interface TemplatesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUseTemplate: (key: string) => void;
}

export function TemplatesDialog({
  open,
  onOpenChange,
  onUseTemplate,
}: TemplatesDialogProps) {
  const { t } = useTranslation("common");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" data-testid="button-templates">
          <Star className="w-4 h-4 mr-2" />
          {t("shablonlar")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t("tayyorShablonlarniTanlang")}</DialogTitle>
          <DialogDescription>
            {t("quyidagiShablonlardanBiriniTanlangVa")}
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Button
            variant="outline"
            className="h-auto flex-col items-start p-4"
            onClick={() => onUseTemplate("1-day")}
            data-testid="template-1-day"
          >
            <div className="font-semibold">1 kunlik</div>
            <div className="text-xs text-muted-foreground">{t("kirishVaTanishish")}</div>
          </Button>
          <Button
            variant="outline"
            className="h-auto flex-col items-start p-4"
            onClick={() => onUseTemplate("1-week")}
            data-testid="template-1-week"
          >
            <div className="font-semibold">1 haftalik</div>
            <div className="text-xs text-muted-foreground">{t("asosiyJarayonlar")}</div>
          </Button>
          <Button
            variant="outline"
            className="h-auto flex-col items-start p-4"
            onClick={() => onUseTemplate("1-month")}
            data-testid="template-1-month"
          >
            <div className="font-semibold">1 oylik</div>
            <div className="text-xs text-muted-foreground">{t("toliqAdaptatsiya")}</div>
          </Button>
          <Button
            variant="outline"
            className="h-auto flex-col items-start p-4"
            onClick={() => onUseTemplate("3-month")}
            data-testid="template-3-month"
          >
            <div className="font-semibold">3 oylik</div>
            <div className="text-xs text-muted-foreground">{t("kengQamrovliDastur")}</div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// DeleteConfirmDialog
// ---------------------------------------------------------------------------

interface DeleteConfirmDialogProps {
  deleteId: string | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function DeleteConfirmDialog({
  deleteId,
  onOpenChange,
  onConfirm,
}: DeleteConfirmDialogProps) {
  const { t } = useTranslation("common");
  return (
    <AlertDialog open={!!deleteId} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("dasturniOchirish")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("buDasturniOchirishniIstaysizmiBu")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} data-testid="button-confirm-delete">
            {t("delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
