import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { UseFormReturn } from "react-hook-form";
import type { InsertPlanningOperation, InsertProductionPlanHeader, InsertProductionFact } from "@shared/schema";
import type { PapkaOrder, Equipment, WorkCenter, Product, MRPRun, MRPResult, PlanningTranslations } from "./planning-types";

interface OperationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingOperation: boolean;
  form: UseFormReturn<InsertPlanningOperation>;
  onSubmit: (data: InsertPlanningOperation) => void;
  isSaving: boolean;
  papkaOrdersList: PapkaOrder[];
  equipmentList: Equipment[];
  lang: "uz" | "ru";
  t: PlanningTranslations;
}

export function OperationFormDialog({
  open, onOpenChange, editingOperation, form, onSubmit, isSaving,
  papkaOrdersList, equipmentList, lang, t,
}: OperationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editingOperation ? t.editTitle : t.createTitle}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="papkaOrderId" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.papkaNo}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-form-papka"><SelectValue placeholder={t.papkaNo} /></SelectTrigger>
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
                  <FormLabel>{t.operationNo}</FormLabel>
                  <FormControl><Input {...field} data-testid="input-form-op-code" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="operationName" render={({ field }) => (
                <FormItem>
                  <FormLabel>{lang === "uz" ? "Operatsiya nomi" : "Название операции"}</FormLabel>
                  <FormControl><Input {...field} data-testid="input-form-op-name" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="equipmentId" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.workCenter}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-form-equipment"><SelectValue placeholder={t.workCenter} /></SelectTrigger>
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
                  <FormLabel>{lang === "uz" ? "Sana" : "Дата"}</FormLabel>
                  <FormControl><Input type="date" {...field} data-testid="input-form-date" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-2">
                <FormField control={form.control} name="plannedStartTime" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.plannedStart}</FormLabel>
                    <FormControl><Input type="time" {...field} data-testid="input-form-start-time" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="plannedEndTime" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.plannedEnd}</FormLabel>
                    <FormControl><Input type="time" {...field} data-testid="input-form-end-time" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="plannedQuantity" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.plannedQty}</FormLabel>
                  <FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} data-testid="input-form-qty" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.status}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-form-status"><SelectValue placeholder={t.status} /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="planned">{t.planned}</SelectItem>
                      <SelectItem value="in_progress">{t.inProgress}</SelectItem>
                      <SelectItem value="completed">{t.completed}</SelectItem>
                      <SelectItem value="cancelled">{t.cancelled}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t.cancel}</Button>
              <Button type="submit" disabled={isSaving} data-testid="button-save-operation">{t.save}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

interface PlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingPlan: boolean;
  planForm: UseFormReturn<InsertProductionPlanHeader>;
  onSubmit: (data: InsertProductionPlanHeader) => void;
  isSaving: boolean;
  workCenters: WorkCenter[];
  lang: "uz" | "ru";
  t: PlanningTranslations;
}

export function PlanFormDialog({
  open, onOpenChange, editingPlan, planForm, onSubmit, isSaving, workCenters, lang, t,
}: PlanDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{editingPlan ? (lang === "uz" ? "Rejani tahrirlash" : "Редактировать план") : (lang === "uz" ? "Yangi reja" : "Новый план")}</DialogTitle>
        </DialogHeader>
        <Form {...planForm}>
          <form onSubmit={planForm.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={planForm.control} name="planNumber" render={({ field }) => (
                <FormItem>
                  <FormLabel>{lang === "uz" ? "Reja raqami" : "№ плана"}</FormLabel>
                  <FormControl><Input {...field} data-testid="input-plan-number" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={planForm.control} name="planDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>{lang === "uz" ? "Sana" : "Дата"}</FormLabel>
                  <FormControl><Input type="date" {...field} data-testid="input-plan-date" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={planForm.control} name="planType" render={({ field }) => (
                <FormItem>
                  <FormLabel>{lang === "uz" ? "Reja turi" : "Тип плана"}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger data-testid="select-plan-type"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="daily">{lang === "uz" ? "Kunlik" : "Дневной"}</SelectItem>
                      <SelectItem value="weekly">{lang === "uz" ? "Haftalik" : "Недельный"}</SelectItem>
                      <SelectItem value="monthly">{lang === "uz" ? "Oylik" : "Месячный"}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={planForm.control} name="workCenterId" render={({ field }) => (
                <FormItem>
                  <FormLabel>{lang === "uz" ? "Ish markazi" : "Рабочий центр"}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl><SelectTrigger data-testid="select-plan-work-center"><SelectValue /></SelectTrigger></FormControl>
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
            <div className="grid grid-cols-2 gap-4">
              <FormField control={planForm.control} name="shift" render={({ field }) => (
                <FormItem>
                  <FormLabel>{lang === "uz" ? "Smena" : "Смена"}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl><SelectTrigger data-testid="select-plan-shift"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="1-smena">1-smena</SelectItem>
                      <SelectItem value="2-smena">2-smena</SelectItem>
                      <SelectItem value="3-smena">3-smena</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={planForm.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.status}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger data-testid="select-plan-status"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="draft">{lang === "uz" ? "Qoralama" : "Черновик"}</SelectItem>
                      <SelectItem value="approved">{lang === "uz" ? "Tasdiqlangan" : "Утверждён"}</SelectItem>
                      <SelectItem value="in_progress">{lang === "uz" ? "Bajarilmoqda" : "В процессе"}</SelectItem>
                      <SelectItem value="completed">{lang === "uz" ? "Yakunlandi" : "Завершён"}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={planForm.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>{lang === "uz" ? "Izoh" : "Примечание"}</FormLabel>
                <FormControl><Textarea {...field} data-testid="input-plan-notes" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="submit" disabled={isSaving} data-testid="button-save-plan">{t.save}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

interface FactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  factForm: UseFormReturn<InsertProductionFact>;
  onSubmit: (data: InsertProductionFact) => void;
  isSaving: boolean;
  workCenters: WorkCenter[];
  products: Product[];
  lang: "uz" | "ru";
  t: PlanningTranslations;
}

export function FactFormDialog({
  open, onOpenChange, factForm, onSubmit, isSaving, workCenters, products, lang, t,
}: FactDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{lang === "uz" ? "Yangi hisobot" : "Новый отчёт"}</DialogTitle>
        </DialogHeader>
        <Form {...factForm}>
          <form onSubmit={factForm.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={factForm.control} name="factDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>{lang === "uz" ? "Sana" : "Дата"}</FormLabel>
                  <FormControl><Input type="date" {...field} data-testid="input-fact-date" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={factForm.control} name="shift" render={({ field }) => (
                <FormItem>
                  <FormLabel>{lang === "uz" ? "Smena" : "Смена"}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl><SelectTrigger data-testid="select-fact-shift"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="1-smena">1-smena</SelectItem>
                      <SelectItem value="2-smena">2-smena</SelectItem>
                      <SelectItem value="3-smena">3-smena</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={factForm.control} name="workCenterId" render={({ field }) => (
                <FormItem>
                  <FormLabel>{lang === "uz" ? "Ish markazi" : "Рабочий центр"}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger data-testid="select-fact-work-center"><SelectValue /></SelectTrigger></FormControl>
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
                  <FormLabel>{lang === "uz" ? "Mahsulot" : "Продукт"}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger data-testid="select-fact-product"><SelectValue /></SelectTrigger></FormControl>
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
            <div className="grid grid-cols-3 gap-4">
              <FormField control={factForm.control} name="factQuantity" render={({ field }) => (
                <FormItem>
                  <FormLabel>{lang === "uz" ? "Jami" : "Всего"}</FormLabel>
                  <FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} data-testid="input-fact-qty" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={factForm.control} name="goodQuantity" render={({ field }) => (
                <FormItem>
                  <FormLabel>{lang === "uz" ? "Yaroqli" : "Годные"}</FormLabel>
                  <FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} data-testid="input-good-qty" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={factForm.control} name="scrapQuantity" render={({ field }) => (
                <FormItem>
                  <FormLabel>{lang === "uz" ? "Brak" : "Брак"}</FormLabel>
                  <FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} data-testid="input-scrap-qty" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={factForm.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>{lang === "uz" ? "Izoh" : "Примечание"}</FormLabel>
                <FormControl><Textarea {...field} data-testid="input-fact-notes" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="submit" disabled={isSaving} data-testid="button-save-fact">{t.save}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

interface MRPRunDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  runForm: { runName: string; planningHorizon: number; description: string };
  onFormChange: (form: MRPRunDialogProps["runForm"]) => void;
  onCreateRun: () => void;
  isCreating: boolean;
  lang: "uz" | "ru";
  t: PlanningTranslations;
}

export function MRPRunDialog({ open, onOpenChange, runForm, onFormChange, onCreateRun, isCreating, lang, t }: MRPRunDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="dialog-create-run">
        <DialogHeader>
          <DialogTitle>{lang === "uz" ? "Yangi MRP Run" : "Новый MRP Run"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>{lang === "uz" ? "Run nomi" : "Название"} *</Label>
            <Input value={runForm.runName} onChange={(e) => onFormChange({ ...runForm, runName: e.target.value })} placeholder="MRP Run - 2024-01" data-testid="input-run-name" />
          </div>
          <div className="space-y-2">
            <Label>Planning Horizon (days)</Label>
            <Input type="number" value={runForm.planningHorizon} onChange={(e) => onFormChange({ ...runForm, planningHorizon: parseInt(e.target.value) })} data-testid="input-horizon" />
          </div>
          <div className="space-y-2">
            <Label>{lang === "uz" ? "Izoh" : "Описание"}</Label>
            <Input value={runForm.description} onChange={(e) => onFormChange({ ...runForm, description: e.target.value })} data-testid="input-description" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t.cancel}</Button>
          <Button onClick={onCreateRun} disabled={isCreating} data-testid="button-submit">{isCreating ? t.loading : t.save}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface MRPResultsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedRun: MRPRun | null;
  results: { result: MRPResult; material: Product | undefined }[];
  t: PlanningTranslations;
}

export function MRPResultsDialog({ open, onOpenChange, selectedRun, results, t }: MRPResultsDialogProps) {
  if (!selectedRun) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]" data-testid="dialog-results">
        <DialogHeader>
          <DialogTitle>{selectedRun.runName} - {t.results}</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto max-h-96 space-y-2">
          {results.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">{t.noData}</p>
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
                      <Badge variant="destructive">Shortage: {item.result.shortageQuantity}</Badge>
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