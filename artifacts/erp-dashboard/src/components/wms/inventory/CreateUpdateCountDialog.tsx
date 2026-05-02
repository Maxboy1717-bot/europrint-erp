import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { WarehouseData, UserData, InventoryCountFormValues } from "./types";
import { useInventoryCountTranslations } from "./useInventoryCountTranslations";

interface CreateUpdateCountDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isEditing: boolean;
  formData: InventoryCountFormValues;
  onFormChange: (data: Partial<InventoryCountFormValues>) => void;
  onSubmit: () => void;
  isPending: boolean;
  warehouses: WarehouseData[];
  users: UserData[];
}

export function CreateUpdateCountDialog({
  isOpen,
  onOpenChange,
  isEditing,
  formData,
  onFormChange,
  onSubmit,
  isPending,
  warehouses,
  users,
}: CreateUpdateCountDialogProps) {
  const t = useInventoryCountTranslations();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t.actions.edit : t.actions.create}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="countDate">{t.form.countDate}</Label>
            <Input
              id="countDate"
              type="date"
              value={formData.countDate}
              onChange={(e) => onFormChange({ countDate: e.target.value })}
              data-testid="input-date"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="warehouse">{t.form.warehouse}</Label>
            <Select
              value={formData.warehouseId}
              onValueChange={(val) => onFormChange({ warehouseId: val })}
            >
              <SelectTrigger id="warehouse" data-testid="select-warehouse">
                <SelectValue placeholder={t.form.selectWarehouse} />
              </SelectTrigger>
              <SelectContent>
                {(Array.isArray(warehouses) ? warehouses : []).map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="countType">{t.form.countType}</Label>
            <Select
              value={formData.countType}
              onValueChange={(val) => onFormChange({ countType: val })}
            >
              <SelectTrigger id="countType" data-testid="select-type">
                <SelectValue placeholder={t.form.selectType} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">{t.countTypes.full}</SelectItem>
                <SelectItem value="cycle">{t.countTypes.cycle}</SelectItem>
                <SelectItem value="spot">{t.countTypes.spot}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="assignedTo">{t.form.assignedTo}</Label>
            <Select
              value={formData.assignedTo}
              onValueChange={(val) => onFormChange({ assignedTo: val })}
            >
              <SelectTrigger id="assignedTo" data-testid="select-user">
                <SelectValue placeholder={t.form.selectUser} />
              </SelectTrigger>
              <SelectContent>
                {(Array.isArray(users) ? users : []).map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="notes">{t.form.notes}</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => onFormChange({ notes: e.target.value })}
              placeholder={t.form.notes}
              data-testid="input-notes"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel">
            {t.actions.cancel}
          </Button>
          <Button onClick={onSubmit} disabled={isPending} data-testid="button-save">
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {t.actions.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
