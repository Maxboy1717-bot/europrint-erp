/**
 * @module HRAssetManagementActionsDialogs
 * @description Asset-lifecycle dialog components for the HR Asset Management page:
 * Return-asset, Report-problem, and Asset-detail (history) dialogs.
 * Add/Assign dialogs live in HRAssetManagementDialogs.tsx.
 */

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertTriangle, CheckCircle, UserCheck } from "lucide-react";
import {
  Asset, ReturnForm, ReportForm, ReportType,
  CATEGORY_LABELS, STATUS_LABELS, STATUS_VARIANTS, CONDITION_LABELS,
} from "./HRAssetManagementTypes";

// ---------------------------------------------------------------------------
// Return-asset dialog
// ---------------------------------------------------------------------------

interface ReturnDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  asset: Asset | null;
  form: ReturnForm;
  onFormChange: (f: ReturnForm) => void;
  onSubmit: () => void;
  isPending: boolean;
}

export function ReturnDialog({ open, onOpenChange, asset, form, onFormChange, onSubmit, isPending }: ReturnDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">Jihoz qaytarish</DialogTitle>
          <DialogDescription>{asset?.name} — {asset?.assigned_employee_name}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Qaytarish sanasi</Label>
            <Input
              type="date"
              value={form.return_date}
              onChange={e => onFormChange({ ...form, return_date: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Qaytarishdagi holat</Label>
            <Select
              value={form.condition_on_return}
              onValueChange={v => onFormChange({ ...form, condition_on_return: v })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(CONDITION_LABELS).map(([v, l]) => (
                  <SelectItem key={v} value={v}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Izoh</Label>
            <Textarea
              value={form.notes}
              onChange={e => onFormChange({ ...form, notes: e.target.value })}
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Bekor qilish</Button>
          <Button onClick={onSubmit} disabled={isPending}>
            {isPending ? "..." : "Qaytarish"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Report-problem dialog
// ---------------------------------------------------------------------------

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  asset: Asset | null;
  form: ReportForm;
  onFormChange: (f: ReportForm) => void;
  onSubmit: () => void;
  isPending: boolean;
}

export function ReportDialog({ open, onOpenChange, asset, form, onFormChange, onSubmit, isPending }: ReportDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[var(--ep-red)]">
            <AlertTriangle className="w-5 h-5" />
            Muammo haqida xabar berish
          </DialogTitle>
          <DialogDescription>{asset?.name}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Muammo turi *</Label>
            <Select
              value={form.report_type}
              onValueChange={v => onFormChange({ ...form, report_type: v as ReportType })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="broken">Buzilgan</SelectItem>
                <SelectItem value="damaged">Shikastlangan</SelectItem>
                <SelectItem value="lost">Yo'qolgan</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Tavsif</Label>
            <Textarea
              value={form.description}
              onChange={e => onFormChange({ ...form, description: e.target.value })}
              rows={3}
              placeholder="Muammo haqida batafsil ma'lumot..."
            />
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg text-sm text-[var(--ep-yellow)] dark:text-amber-400 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            Yo'qolgan yoki shikastlangan jihoz uchun maosh chegirmasi navbatga qo'shiladi.
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Bekor qilish</Button>
          <Button variant="destructive" onClick={onSubmit} disabled={isPending}>
            {isPending ? "..." : "Xabar berish"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Asset-detail dialog (read-only, shows assignment history)
// ---------------------------------------------------------------------------

interface DetailDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  asset: Asset | null;
}

export function DetailDialog({ open, onOpenChange, asset }: DetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{asset?.name}</DialogTitle>
          <DialogDescription>Serial: {asset?.serial_number ?? "—"}</DialogDescription>
        </DialogHeader>
        {asset && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Tur</p>
                <p className="font-medium">{CATEGORY_LABELS[asset.category] ?? asset.category}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Holat</p>
                <Badge variant={STATUS_VARIANTS[asset.status] ?? "outline"}>
                  {STATUS_LABELS[asset.status] ?? asset.status}
                </Badge>
              </div>
              <div>
                <p className="text-muted-foreground">Qiymati</p>
                <p className="font-medium">{Number(asset.value).toLocaleString()} UZS</p>
              </div>
              <div>
                <p className="text-muted-foreground">Xarid sanasi</p>
                <p className="font-medium">{asset.purchase_date ?? "—"}</p>
              </div>
              {asset.assigned_employee_name && (
                <div className="col-span-2">
                  <p className="text-muted-foreground">Hozirgi foydalanuvchi</p>
                  <p className="font-medium text-primary">{asset.assigned_employee_name}</p>
                </div>
              )}
            </div>

            {Array.isArray(asset.history) && asset.history.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Topshiriq tarixi</p>
                <div className="space-y-2">
                  {asset.history.map((h, i) => (
                    <div
                      key={`hist-${i}`}
                      className="flex items-center gap-3 p-2 rounded-lg bg-muted/40 text-sm"
                    >
                      {h.return_date
                        ? <CheckCircle className="w-4 h-4 text-[var(--ep-green)] shrink-0" />
                        : <UserCheck className="w-4 h-4 text-[var(--ep-blue)] shrink-0" />}
                      <div className="flex-1">
                        <p className="font-medium">{h.employee_name ?? h.employee_id}</p>
                        <p className="text-muted-foreground">
                          {h.assigned_date} → {h.return_date ?? "Hozir"}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {h.return_date
                          ? (CONDITION_LABELS[h.condition_on_return ?? ""] ?? h.condition_on_return)
                          : (CONDITION_LABELS[h.condition_on_assign] ?? h.condition_on_assign)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
