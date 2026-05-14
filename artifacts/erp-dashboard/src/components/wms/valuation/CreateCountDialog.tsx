/**
 * @module CreateCountDialog
 * @description React UI component.
 */

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Warehouse } from "./types";
import { useTranslation } from '@/lib/i18n';

interface CreateCountDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  form: {
    countDate: string;
    warehouseId: string;
    countType: string;
    notes: string;
  };
  setForm: (form: { countDate: string; warehouseId: string; countType: string; notes: string }) => void;
  warehouses: Warehouse[];
  onSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
}

export function CreateCountDialog({
  isOpen,
  onOpenChange,
  form,
  setForm,
  warehouses,
  onSubmit,
  isPending
}: CreateCountDialogProps) {
  const { t } = useTranslation("common");
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t("yangiInventarizatsiya")}</DialogTitle>
          <DialogDescription>
            {t("materialVaMahsulotlarSanoviniBoshlash")}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-1">
          <Label htmlFor="countDate">{t("sana")}</Label>
            <Input 
              id="countDate" 
              type="date" 
              value={form.countDate}
              onChange={(e) => setForm({ ...form, countDate: e.target.value })}
              data-testid="input-count-date"
            />
          </div>
          <div className="space-y-1">
          <Label htmlFor="warehouse">{t("omborxona")}</Label>
            <Select 
              value={form.warehouseId} 
              onValueChange={(value) => setForm({ ...form, warehouseId: value })}
            >
              <SelectTrigger id="warehouse" data-testid="select-warehouse" className="h-9">
                <SelectValue placeholder={t("omborniTanlang")} />
              </SelectTrigger>
              <SelectContent>
                {(Array.isArray(warehouses) ? warehouses : []).map(wh => (
                  <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
          <Label htmlFor="countType">{t("hisoblashTuri")}</Label>
            <Select 
              value={form.countType} 
              onValueChange={(value) => setForm({ ...form, countType: value })}
            >
              <SelectTrigger id="countType" data-testid="select-count-type" className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">{t("toliq")}</SelectItem>
                <SelectItem value="cycle">{t("davriy")}</SelectItem>
                <SelectItem value="spot">{t("spot")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
          <Label htmlFor="notes">{t("Izoh")}</Label>
            <Textarea 
              id="notes" 
              placeholder={t("qoshimchaMalumotlar1")} 
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              data-testid="input-count-notes"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button 
            onClick={onSubmit}
            disabled={isPending || !form.warehouseId || !form.countDate}
            data-testid="button-submit-count"
          >
            {isPending ? "Yaratilmoqda..." : "Yaratish"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
