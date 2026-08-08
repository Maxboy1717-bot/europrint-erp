/**
 * @module PlanningDialogsB
 * @description FactFormDialog, MRPRunDialog, and MRPResultsDialog for the planning module.
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { UseFormReturn } from "react-hook-form";
import type { InsertProductionFact } from "@shared/schema";
import type { WorkCenter, Product, MRPRun, MRPResult } from "./planning-types";

import { EPStatusPill } from "@/components/ep";

type TFunc = (key: string, params?: Record<string, string | number>) => string;

// ─── Fact Form Dialog ─────────────────────────────────────────────────────────

interface FactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  factForm: UseFormReturn<InsertProductionFact>;
  onSubmit: (data: InsertProductionFact) => void;
  isSaving: boolean;
  workCenters: WorkCenter[];
  products: Product[];
  t: TFunc;
}

export function FactFormDialog({open, onOpenChange, factForm, onSubmit, isSaving, workCenters, products, t,
}: FactDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t("PlanningBoard.newFactTitle")}</DialogTitle>
        </DialogHeader>
        <Form {...factForm}>
          <form onSubmit={factForm.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={factForm.control} name="factDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("PlanningBoard.date")}</FormLabel>
                  <FormControl><Input type="date" {...field} data-testid="input-fact-date" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={factForm.control} name="shift" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("shift")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl><SelectTrigger data-testid="select-fact-shift" className="h-9"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="1-smena">{t("PlanningBoard.shift1")}</SelectItem>
                      <SelectItem value="2-smena">{t("PlanningBoard.shift2")}</SelectItem>
                      <SelectItem value="3-smena">{t("PlanningBoard.shift3")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={factForm.control} name="workCenterId" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("workCenter")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger data-testid="select-fact-work-center" className="h-9"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {(Array.isArray(workCenters) ? workCenters : []).map((wc: WorkCenter) => (
                        <SelectItem key={wc.id} value={wc.id}>{wc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={factForm.control} name="productId" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("product")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger data-testid="select-fact-product" className="h-9"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {(Array.isArray(products) ? products : []).map((p: Product) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField control={factForm.control} name="factQuantity" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("PlanningBoard.total")}</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} data-testid="input-fact-qty" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={factForm.control} name="goodQuantity" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("PlanningBoard.good")}</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} data-testid="input-good-qty" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={factForm.control} name="scrapQuantity" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("PlanningBoard.scrap")}</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} data-testid="input-scrap-qty" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={factForm.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("PlanningBoard.notes")}</FormLabel>
                <FormControl><Textarea {...field} data-testid="input-fact-notes" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="submit" disabled={isSaving} data-testid="button-save-fact">{t("PlanningBoard.save")}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ─── MRP Run Dialog ───────────────────────────────────────────────────────────

interface MRPRunDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  runForm: { runName: string; planningHorizon: number; description: string };
  onFormChange: (form: MRPRunDialogProps["runForm"]) => void;
  onCreateRun: () => void;
  isCreating: boolean;
  t: TFunc;
}

export function MRPRunDialog({ open, onOpenChange, runForm, onFormChange, onCreateRun, isCreating, t }: MRPRunDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="dialog-create-run" className="p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t("PlanningBoard.newMRPRunTitle")}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-1">
          <Label>{t("PlanningBoard.runName")} *</Label>
            <Input
              value={runForm.runName}
              onChange={(e) => onFormChange({ ...runForm, runName: e.target.value })}
              placeholder={t("PlanningBoard.runNamePlaceholder")}
              data-testid="input-run-name"
            />
          </div>
          <div className="space-y-1">
          <Label>{t("PlanningBoard.planningHorizon")}</Label>
            <Input
              type="number"
              value={runForm.planningHorizon}
              onChange={(e) => onFormChange({ ...runForm, planningHorizon: parseInt(e.target.value) })}
              data-testid="input-horizon"
            />
          </div>
          <div className="space-y-1">
          <Label>{t("PlanningBoard.description")}</Label>
            <Input
              value={runForm.description}
              onChange={(e) => onFormChange({ ...runForm, description: e.target.value })}
              data-testid="input-description"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("PlanningBoard.cancel")}</Button>
          <Button onClick={onCreateRun} disabled={isCreating} data-testid="button-submit">
            {isCreating ? t("PlanningBoard.loading") : t("PlanningBoard.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── MRP Results Dialog ───────────────────────────────────────────────────────

interface MRPResultsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedRun: MRPRun | null;
  results: { result: MRPResult; material: Product | undefined }[];
  t: TFunc;
}

export function MRPResultsDialog({ open, onOpenChange, selectedRun, results, t }: MRPResultsDialogProps) {
  if (!selectedRun) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] p-6" data-testid="dialog-results">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{selectedRun.runName} - {t("PlanningBoard.results")}</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto max-h-96 space-y-2">
          {results.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">{t("noDataFound")}</p>
          ) : (
            (Array.isArray(results) ? results : []).map((item, idx) => (
              <div key={idx} className="p-3 border rounded-md" data-testid={`result-item-${idx}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{item.material?.name || 'Unknown Material'}</p>
                    <p className="text-sm text-muted-foreground">Code: {item.material?.code}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Gross: {item.result.grossRequirement}</Badge>
                    <Badge variant="outline">On Hand: {item.result.onHandInventory}</Badge>
                    {item.result.shortageQuantity > 0 && (
                      <EPStatusPill tone="danger">Shortage: {item.result.shortageQuantity}</EPStatusPill>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
