/**
 * @module RACIMatrixPageDialogs
 * @description Dialog components for RACIMatrixPage.
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTranslation } from '@/lib/i18n';

interface AddTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskName: string;
  onTaskNameChange: (value: string) => void;
  taskCategory: string;
  onTaskCategoryChange: (value: string) => void;
  onConfirm: () => void;
  isPending: boolean;
}

export function AddTaskDialog({
  open,
  onOpenChange,
  taskName,
  onTaskNameChange,
  taskCategory,
  onTaskCategoryChange,
  onConfirm,
  isPending,
}: AddTaskDialogProps) {
  const { t } = useTranslation("common");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t("yangiVazifaQoshish")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("vazifaNomi1")}</label>
            <Input
              value={taskName}
              onChange={(e) => onTaskNameChange(e.target.value)}
              placeholder={t("vazifaNominiKiriting")}
              data-testid="input-task-name"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("category")}</label>
            <Select value={taskCategory} onValueChange={onTaskCategoryChange}>
              <SelectTrigger data-testid="select-task-category" className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="production">{t("ishlabChiqarish2")}</SelectItem>
                <SelectItem value="sales">{t("sotuv")}</SelectItem>
                <SelectItem value="hr">HR</SelectItem>
                <SelectItem value="finance">{t("moliya")}</SelectItem>
                <SelectItem value="logistics">{t("logistika")}</SelectItem>
                <SelectItem value="quality">{t("sifatNazorati1")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button onClick={onConfirm} disabled={isPending} data-testid="button-create-task">
            {isPending ? "..." : "Yaratish"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
