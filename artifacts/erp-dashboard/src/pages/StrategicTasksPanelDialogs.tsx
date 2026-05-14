/**
 * @module StrategicTasksPanelDialogs
 * @description CategoryDialog component and re-export of TaskDialog.
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FolderPlus } from "lucide-react";

export { TaskDialog } from "./StrategicTasksPanelTaskDialog";

// ---------------------------------------------------------------------------
// CategoryDialog
// ---------------------------------------------------------------------------

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryName: string;
  categoryCode: string;
  onNameChange: (value: string) => void;
  onCodeChange: (value: string) => void;
  onSave: () => void;
  isPending: boolean;
}

export function CategoryDialog({
  open,
  onOpenChange,
  categoryName,
  categoryCode,
  onNameChange,
  onCodeChange,
  onSave,
  isPending,
}: CategoryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" data-testid="button-add-category">
          <FolderPlus className="h-4 w-4 mr-2" />
          Kategoriya qo'shish
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">Yangi kategoriya</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Nomi</label>
            <Input
              data-testid="input-category-name"
              value={categoryName}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Kategoriya nomi"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Kod</label>
            <Input
              data-testid="input-category-code"
              value={categoryCode}
              onChange={(e) => onCodeChange(e.target.value)}
              placeholder="kategoriya_kodi"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Bekor qilish
            </Button>
            <Button
              data-testid="button-save-category"
              onClick={onSave}
              disabled={!categoryName || !categoryCode || isPending}
            >
              Saqlash
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
