/**
 * @module QCFinalInspectionDialogs
 * @description Dialog components for QCFinalInspection: the final-inspection form dialog.
 */

import { UseMutationResult } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";
import { PapkaOrder } from "./QCFinalInspectionTypes";

import { useTranslation } from '@/lib/i18n';
export interface InspectDialogFormState {
  sampleQty: number;
  defectQty: number;
  visualOk: boolean;
  dimensionsOk: boolean;
  printOk: boolean;
  packagingOk: boolean;
  comments: string;
}

export interface InspectDialogSetters {
  setSampleQty: (v: number) => void;
  setDefectQty: (v: number) => void;
  setVisualOk: (v: boolean) => void;
  setDimensionsOk: (v: boolean) => void;
  setPrintOk: (v: boolean) => void;
  setPackagingOk: (v: boolean) => void;
  setComments: (v: string) => void;
}

interface InspectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedOrder: PapkaOrder | null;
  form: InspectDialogFormState;
  setters: InspectDialogSetters;
  inspectMutation: UseMutationResult<unknown, Error, void>;
}

export function InspectDialog({open,
  onOpenChange,
  selectedOrder,
  form,
  setters,
  inspectMutation,
}: InspectDialogProps) {
  const { t } = useTranslation('common');
  const defectRate = form.sampleQty > 0 ? (form.defectQty / form.sampleQty) * 100 : 0;
  const allChecked = form.visualOk && form.dimensionsOk && form.printOk && form.packagingOk;

  const checkItems = [
    { id: "visual",     label: "Vizual ko'rinish yaxshi",   value: form.visualOk,     set: setters.setVisualOk },
    { id: "dimensions", label: "O'lchamlar normaga mos",    value: form.dimensionsOk, set: setters.setDimensionsOk },
    { id: "print",      label: "Bosma sifati yaxshi",       value: form.printOk,      set: setters.setPrintOk },
    { id: "packaging",  label: "Qadoqlash to'g'ri",         value: form.packagingOk,  set: setters.setPackagingOk },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">Yakuniy tekshiruv — {selectedOrder?.papkaNo}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">{t("namunaSoni")}</label>
              <Input
                type="number"
                min={1}
                value={form.sampleQty}
                onChange={(e) => setters.setSampleQty(parseInt(e.target.value) || 1)}
                data-testid="input-sample-qty"
              />
            </div>
            <div>
              <label className="text-sm font-medium">{t("nuqsonliSoni")}</label>
              <Input
                type="number"
                min={0}
                max={form.sampleQty}
                value={form.defectQty}
                onChange={(e) => setters.setDefectQty(parseInt(e.target.value) || 0)}
                data-testid="input-defect-qty"
              />
            </div>
          </div>

          {form.defectQty > 0 && (
            <div
              className={`p-2 rounded-md flex items-center gap-2 ${
                defectRate > 5 ? "bg-red-50 dark:bg-red-900/20" : "bg-yellow-50 dark:bg-yellow-900/20"
              }`}
            >
              <AlertTriangle className={`h-4 w-4 ${defectRate > 5 ? "text-[var(--ep-red)]" : "text-[var(--ep-yellow)]"}`} />
              <span className="text-sm">
                {t("nuqsonDarajasi")}<strong>{defectRate.toFixed(1)}%</strong>{" "}
                {defectRate > 5 ? "(5% dan yuqori — RAD ETILADI)" : "(normal)"}
              </span>
            </div>
          )}

          <div className="space-y-2 border rounded-md p-3">
            <p className="text-sm font-medium text-muted-foreground">{t('chekList')}</p>
            {checkItems.map(item => (
              <div key={item.id} className="flex items-center gap-2">
                <Checkbox
                  id={item.id}
                  checked={item.value}
                  onCheckedChange={(v) => item.set(!!v)}
                  data-testid={`checkbox-final-${item.id}`}
                />
                <label htmlFor={item.id} className="text-sm cursor-pointer">{item.label}</label>
              </div>
            ))}
          </div>

          <Textarea
            placeholder={t("izohIxtiyoriy")}
            value={form.comments}
            onChange={(e) => setters.setComments(e.target.value)}
            data-testid="input-final-comments"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("cancel")}</Button>
          <Button
            onClick={() => inspectMutation.mutate()}
            disabled={inspectMutation.isPending || !allChecked}
            data-testid="btn-submit-inspection"
          >
            {inspectMutation.isPending ? "Saqlanmoqda..." : "Tekshiruvni saqlash"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
