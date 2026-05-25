/**
 * @module DepartmentDialog
 * @description Add / Edit department dialog form.
 * Split from Departments.tsx (Rule 16).
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface DeptForm {
  name: string;
  name_uz: string;
  name_ru: string;
  code: string;
  description: string;
  is_active: boolean;
}

interface DepartmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: { id: string } | null;
  form: DeptForm;
  setForm: (updater: (f: DeptForm) => DeptForm) => void;
  onSave: () => void;
  isPending: boolean;
  t: (key: string) => string;
  tCommon: (key: string) => string;
}

export function DepartmentDialog({
  open, onOpenChange, editing, form, setForm, onSave, isPending, t, tCommon,
}: DepartmentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">
            {editing ? t("departments.editTitle") : t("departments.addNew")}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="ep-label">{t("departments.nameUzRequired")}</Label>
              <Input
                value={form.name_uz}
                onChange={(e) => setForm((f) => ({ ...f, name_uz: e.target.value, name: e.target.value }))}
                placeholder={t("departments.namePlaceholder")}
              />
            </div>
            <div className="space-y-1">
              <Label className="ep-label">{t("departments.nameRu")}</Label>
              <Input
                value={form.name_ru}
                onChange={(e) => setForm((f) => ({ ...f, name_ru: e.target.value }))}
                placeholder={t("departments.nameRuPlaceholder")}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="ep-label">{t("departments.code")}</Label>
            <Input
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              placeholder="DEPT-001"
              className="uppercase ep-mono"
            />
          </div>
          <div className="space-y-1">
            <Label className="ep-label">{t("departments.descriptionLabel")}</Label>
            <Input
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder={t("departments.descriptionPlaceholder")}
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={form.is_active}
              onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
              id="dept-active"
            />
            <Label htmlFor="dept-active" className="ep-label">{t("departments.active")}</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{tCommon("cancel")}</Button>
          <Button
            onClick={onSave}
            disabled={!form.name_uz || isPending}
            className="ep-btn-primary-shimmer"
          >
            {isPending ? t("departments.saving") : editing ? t("departments.saveChanges") : tCommon("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
