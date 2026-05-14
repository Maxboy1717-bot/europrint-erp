/**
 * @module PositionsDialogs
 * @description Dialog components for the Positions page: Add/Edit and KPI template dialogs.
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Target } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { type Position, type Department, type PositionForm, KPI_TEMPLATES } from "./PositionsTypes";
import { useTranslation } from '@/lib/i18n';

// ---------------------------------------------------------------------------
// Add / Edit dialog
// ---------------------------------------------------------------------------

interface PositionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Position | null;
  form: PositionForm;
  setForm: React.Dispatch<React.SetStateAction<PositionForm>>;
  departments: Department[];
  isPending: boolean;
  onSave: () => void;
}

export function PositionFormDialog({
  open, onOpenChange, editing, form, setForm, departments, isPending, onSave,
}: PositionFormDialogProps) {
  const { t } = useTranslation("common");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{editing ? "Lavozimni tahrirlash" : "Yangi lavozim qo'shish"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Nomi (UZ) *</Label>
              <Input
                value={form.name_uz}
                onChange={(e) => setForm((f) => ({ ...f, name_uz: e.target.value, name: e.target.value }))}
                placeholder={t("lavozimNomi1")}
              />
            </div>
            <div className="space-y-1">
              <Label>Nomi (RU)</Label>
              <Input
                value={form.name_ru}
                onChange={(e) => setForm((f) => ({ ...f, name_ru: e.target.value }))}
                placeholder="Название должности"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>{t("code")}</Label>
              <Input
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                placeholder="POS-001"
              />
            </div>
            <div className="space-y-1">
              <Label>{t("daraja")}</Label>
              <Input
                type="number"
                min={1}
                max={10}
                value={form.level}
                onChange={(e) => setForm((f) => ({ ...f, level: Number(e.target.value) }))}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label>{t("bolim1")}</Label>
            <Select
              value={form.department_id || "none"}
              onValueChange={(v) => setForm((f) => ({ ...f, department_id: v === "none" ? "" : v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("bolimniTanlang")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("bolimsiz")}</SelectItem>
                {(Array.isArray(departments) ? departments : []).map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.name_uz || d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Min oylik (so'm)</Label>
              <Input
                type="number"
                value={form.min_salary}
                onChange={(e) => setForm((f) => ({ ...f, min_salary: e.target.value }))}
                placeholder="0"
              />
            </div>
            <div className="space-y-1">
              <Label>Max oylik (so'm)</Label>
              <Input
                type="number"
                value={form.max_salary}
                onChange={(e) => setForm((f) => ({ ...f, max_salary: e.target.value }))}
                placeholder="0"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label>{t("shtatSoni")}</Label>
            <Input
              type="number"
              min={1}
              value={form.headcount}
              onChange={(e) => setForm((f) => ({ ...f, headcount: Number(e.target.value) }))}
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={form.is_management}
                onCheckedChange={(v) => setForm((f) => ({ ...f, is_management: v }))}
                id="pos-mgmt"
              />
              <Label htmlFor="pos-mgmt">{t("boshqaruvLavozimi")}</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.is_active}
                onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
                id="pos-active"
              />
              <Label htmlFor="pos-active">{t("active")}</Label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("cancel")}</Button>
          <Button onClick={onSave} disabled={!form.name_uz || isPending}>
            {isPending ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Delete confirm dialog
// ---------------------------------------------------------------------------

interface PositionDeleteDialogProps {
  deleteId: string | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function PositionDeleteDialog({ deleteId, onOpenChange, onConfirm }: PositionDeleteDialogProps) {
  const { t } = useTranslation("common");
  return (
    <ConfirmDialog
      open={!!deleteId}
      onOpenChange={(open) => { if (!open) onOpenChange(false); }}
      title={t("lavozimniOchirish")}
      description={t("ushbuLavozimniOchirishniTasdiqlaysizmiBu")}
      confirmText="O'chirish"
      cancelText="Bekor qilish"
      variant="destructive"
      onConfirm={onConfirm}
    />
  );
}

// ---------------------------------------------------------------------------
// KPI template assignment dialog
// ---------------------------------------------------------------------------

interface KpiTemplateDialogProps {
  position: Position | null;
  selectedTemplate: string;
  setSelectedTemplate: (key: string) => void;
  isPending: boolean;
  onClose: () => void;
  onAssign: () => void;
}

export function KpiTemplateDialog({
  position, selectedTemplate, setSelectedTemplate, isPending, onClose, onAssign,
}: KpiTemplateDialogProps) {
  const { t } = useTranslation("common");
  return (
    <Dialog
      open={!!position}
      onOpenChange={(open) => { if (!open) onClose(); }}
    >
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            {t("kpiShabloniBiriktirish")}
          </DialogTitle>
        </DialogHeader>
        {position && (
          <div className="py-2 space-y-3">
            <p className="text-sm text-muted-foreground">
              <strong>{position.name_uz || position.name}</strong> lavozimi uchun KPI shablonini tanlang:
            </p>
            <div className="space-y-2">
              {KPI_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.key}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedTemplate === tpl.key
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/50"
                  }`}
                  onClick={() => setSelectedTemplate(tpl.key)}
                >
                  <div className="font-medium text-sm flex items-center gap-2">
                    <Target className="h-3.5 w-3.5 text-primary shrink-0" />
                    {tpl.label}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5 pl-5">{tpl.description}</div>
                </button>
              ))}
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button
            disabled={!selectedTemplate || isPending}
            onClick={onAssign}
          >
            {isPending ? "Saqlanmoqda..." : "Biriktirish"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
