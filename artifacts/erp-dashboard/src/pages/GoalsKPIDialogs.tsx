/** @module GoalsKPIDialogs — Dialog components for GoalsKPI. */
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Plus } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import type { InsertGoal, Goal } from "@shared/schema";
import { CATEGORIES, TARGET_TYPES, PRIORITIES, STATUS_OPTIONS } from "./GoalsKPITypes";

import { useTranslation } from '@/lib/i18n';
interface GoalDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingGoal: Goal | null;
  form: UseFormReturn<InsertGoal>;
  onSubmit: (data: InsertGoal) => void;
  departments: Array<{ id: string; name: string }>;
  positions: Array<{ id: string; name: string }>;
  employees: Array<{ id: string; fullName: string }>;
  onResetForNew: () => void;
}

export function GoalDialog({isOpen,
  onOpenChange,
  editingGoal,
  form,
  onSubmit,
  departments,
  positions,
  employees,
  onResetForNew,
}: GoalDialogProps) {
  const { t } = useTranslation('common');
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button data-testid="button-create-goal" onClick={onResetForNew}>
          <Plus className="h-4 w-4 mr-2" />
          {t("maqsadQoshish")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{editingGoal ? "Maqsadni tahrirlash" : "Yangi maqsad"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("progress.title")}</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-goal-title" placeholder={t("maqsadSarlavhasi")} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("progress.description")}</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value || ""} placeholder={t("maqsadHaqidaBatafsil")} rows={3} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("category")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-goal-category" className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(Array.isArray(CATEGORIES) ? CATEGORIES : []).map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="targetType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("qollaniladi")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-target-type" className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(Array.isArray(TARGET_TYPES) ? TARGET_TYPES : []).map(type => (
                          <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>

            {form.watch("targetType") !== "global" && (
              <FormField
                control={form.control}
                name="targetId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {form.watch("targetType") === "department" && "Bo'lim"}
                      {form.watch("targetType") === "position" && "Lavozim"}
                      {form.watch("targetType") === "user" && "Xodim"}
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger data-testid="select-target-id" className="h-9">
                          <SelectValue placeholder={t("tanlang")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {form.watch("targetType") === "department" &&
                          (Array.isArray(departments) ? departments : []).map(d => (
                            <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                          ))}
                        {form.watch("targetType") === "position" &&
                          (Array.isArray(positions) ? positions : []).map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))}
                        {form.watch("targetType") === "user" &&
                          (Array.isArray(employees) ? employees : []).map(e => (
                            <SelectItem key={e.id} value={e.id}>{e.fullName}</SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="metric"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("metrika")}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t('completionRateAverageScore')} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="targetValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("maqsadQiymati")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("startDate")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        max="2099-12-31"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("endDate")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="date"
                        min={form.watch('startDate') || new Date().toISOString().split('T')[0]}
                        max="2099-12-31"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("priority")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-priority" className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(Array.isArray(PRIORITIES) ? PRIORITIES : []).map(p => (
                          <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("status28")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-status" className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(Array.isArray(STATUS_OPTIONS) ? STATUS_OPTIONS : []).map(s => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t("cancel")}
              </Button>
              <Button type="submit" data-testid="button-save-goal">
                {editingGoal ? "Yangilash" : "Saqlash"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
