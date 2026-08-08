/**
 * @module PlanningDialogsA
 * @description OperationFormDialog and PlanFormDialog for the planning module.
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { UseFormReturn } from "react-hook-form";
import type { InsertPlanningOperation, InsertProductionPlanHeader } from "@shared/schema";
import type { PapkaOrder, Equipment, WorkCenter } from "./planning-types";

type TFunc = (key: string, params?: Record<string, string | number>) => string;

// ─── Operation Form Dialog ────────────────────────────────────────────────────

interface OperationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingOperation: boolean;
  form: UseFormReturn<InsertPlanningOperation>;
  onSubmit: (data: InsertPlanningOperation) => void;
  isSaving: boolean;
  papkaOrdersList: PapkaOrder[];
  equipmentList: Equipment[];
  t: TFunc;
}

export function OperationFormDialog({
  open, onOpenChange, editingOperation, form, onSubmit, isSaving,
  papkaOrdersList, equipmentList, t,
}: OperationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{editingOperation ? t("PlanningBoard.editTitle") : t("PlanningBoard.createTitle")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="papkaOrderId" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("PlanningBoard.papkaNo")}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-form-papka" className="h-9"><SelectValue placeholder={t("PlanningBoard.papkaNo")} /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(Array.isArray(papkaOrdersList) ? papkaOrdersList : []).map((p: PapkaOrder) => (
                        <SelectItem key={p.id} value={p.id}>{p.papkaNo}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="operationCode" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("PlanningBoard.operationNo")}</FormLabel>
                  <FormControl><Input {...field} data-testid="input-form-op-code" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="operationName" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("PlanningBoard.operationName")}</FormLabel>
                  <FormControl><Input {...field} data-testid="input-form-op-name" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="equipmentId" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("workCenter")}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-form-equipment" className="h-9"><SelectValue placeholder={t("workCenter")} /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(Array.isArray(equipmentList) ? equipmentList : []).map((e: Equipment) => (
                        <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="plannedDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("PlanningBoard.date")}</FormLabel>
                  <FormControl><Input type="date" {...field} data-testid="input-form-date" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <FormField control={form.control} name="plannedStartTime" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("PlanningBoard.plannedStart")}</FormLabel>
                    <FormControl><Input type="time" {...field} data-testid="input-form-start-time" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="plannedEndTime" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("PlanningBoard.plannedEnd")}</FormLabel>
                    <FormControl><Input type="time" {...field} data-testid="input-form-end-time" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="plannedQuantity" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("PlanningBoard.plannedQty")}</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} data-testid="input-form-qty" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("PlanningBoard.status")}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-form-status" className="h-9"><SelectValue placeholder={t("PlanningBoard.status")} /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="planned">{t("PlanningBoard.planned")}</SelectItem>
                      <SelectItem value="in_progress">{t("inProcess")}</SelectItem>
                      <SelectItem value="completed">{t("PlanningBoard.completed")}</SelectItem>
                      <SelectItem value="cancelled">{t("PlanningBoard.cancelled")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t("PlanningBoard.cancel")}</Button>
              <Button type="submit" disabled={isSaving} data-testid="button-save-operation">{t("PlanningBoard.save")}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Plan Form Dialog ─────────────────────────────────────────────────────────

interface PlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingPlan: boolean;
  planForm: UseFormReturn<InsertProductionPlanHeader>;
  onSubmit: (data: InsertProductionPlanHeader) => void;
  isSaving: boolean;
  workCenters: WorkCenter[];
  t: TFunc;
}

export function PlanFormDialog({
  open, onOpenChange, editingPlan, planForm, onSubmit, isSaving, workCenters, t,
}: PlanDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold"> {editingPlan
              ? t("PlanningBoard.editPlanTitle")
              : t("PlanningBoard.newPlanTitle")}</DialogTitle>
        </DialogHeader>
        <Form {...planForm}>
          <form onSubmit={planForm.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={planForm.control} name="planNumber" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("PlanningBoard.planNumber")}</FormLabel>
                  <FormControl><Input {...field} data-testid="input-plan-number" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={planForm.control} name="planDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("PlanningBoard.date")}</FormLabel>
                  <FormControl><Input type="date" {...field} data-testid="input-plan-date" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={planForm.control} name="planType" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("PlanningBoard.planType")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger data-testid="select-plan-type" className="h-9"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="daily">{t("PlanningBoard.planTypeDaily")}</SelectItem>
                      <SelectItem value="weekly">{t("PlanningBoard.planTypeWeekly")}</SelectItem>
                      <SelectItem value="monthly">{t("PlanningBoard.planTypeMonthly")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={planForm.control} name="workCenterId" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("workCenter")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl><SelectTrigger data-testid="select-plan-work-center" className="h-9"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {(Array.isArray(workCenters) ? workCenters : []).map((wc: WorkCenter) => (
                        <SelectItem key={wc.id} value={wc.id}>{wc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={planForm.control} name="shift" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("shift")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl><SelectTrigger data-testid="select-plan-shift" className="h-9"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="1-smena">{t("PlanningBoard.shift1")}</SelectItem>
                      <SelectItem value="2-smena">{t("PlanningBoard.shift2")}</SelectItem>
                      <SelectItem value="3-smena">{t("PlanningBoard.shift3")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={planForm.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("PlanningBoard.status")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger data-testid="select-plan-status" className="h-9"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="draft">{t("PlanningBoard.planStatusDraft")}</SelectItem>
                      <SelectItem value="approved">{t("PlanningBoard.planStatusApproved")}</SelectItem>
                      <SelectItem value="in_progress">{t("PlanningBoard.planStatusInProgress")}</SelectItem>
                      <SelectItem value="completed">{t("PlanningBoard.planStatusCompleted")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={planForm.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("PlanningBoard.notes")}</FormLabel>
                <FormControl><Textarea {...field} data-testid="input-plan-notes" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="submit" disabled={isSaving} data-testid="button-save-plan">{t("PlanningBoard.save")}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
