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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" data-testid="button-templates">
          <Star className="w-4 h-4 mr-2" />
          Shablonlar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">Tayyor shablonlarni tanlang</DialogTitle>
          <DialogDescription>
            Quyidagi shablonlardan birini tanlang va o'zingizga moslashtiring
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
            <div className="text-xs text-muted-foreground">Kirish va tanishish</div>
          </Button>
          <Button
            variant="outline"
            className="h-auto flex-col items-start p-4"
            onClick={() => onUseTemplate("1-week")}
            data-testid="template-1-week"
          >
            <div className="font-semibold">1 haftalik</div>
            <div className="text-xs text-muted-foreground">Asosiy jarayonlar</div>
          </Button>
          <Button
            variant="outline"
            className="h-auto flex-col items-start p-4"
            onClick={() => onUseTemplate("1-month")}
            data-testid="template-1-month"
          >
            <div className="font-semibold">1 oylik</div>
            <div className="text-xs text-muted-foreground">To'liq adaptatsiya</div>
          </Button>
          <Button
            variant="outline"
            className="h-auto flex-col items-start p-4"
            onClick={() => onUseTemplate("3-month")}
            data-testid="template-3-month"
          >
            <div className="font-semibold">3 oylik</div>
            <div className="text-xs text-muted-foreground">Keng qamrovli dastur</div>
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
  return (
    <AlertDialog open={!!deleteId} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Dasturni o'chirish</AlertDialogTitle>
          <AlertDialogDescription>
            Bu dasturni o'chirishni istaysizmi? Bu amal bekor qilinmaydi.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} data-testid="button-confirm-delete">
            O'chirish
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
