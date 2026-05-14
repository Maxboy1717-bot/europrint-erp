/**
 * @module RACIMatrixPageDialogs
 * @description Dialog components for RACIMatrixPage.
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">Yangi vazifa qo'shish</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Vazifa nomi *</label>
            <Input
              value={taskName}
              onChange={(e) => onTaskNameChange(e.target.value)}
              placeholder="Vazifa nomini kiriting"
              data-testid="input-task-name"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Kategoriya</label>
            <Select value={taskCategory} onValueChange={onTaskCategoryChange}>
              <SelectTrigger data-testid="select-task-category" className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="production">Ishlab chiqarish</SelectItem>
                <SelectItem value="sales">Sotuv</SelectItem>
                <SelectItem value="hr">HR</SelectItem>
                <SelectItem value="finance">Moliya</SelectItem>
                <SelectItem value="logistics">Logistika</SelectItem>
                <SelectItem value="quality">Sifat nazorati</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Bekor qilish
          </Button>
          <Button onClick={onConfirm} disabled={isPending} data-testid="button-create-task">
            {isPending ? "..." : "Yaratish"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
