/**
 * @module StrategicTasksPanelTaskDialog
 * @description TaskDialog component for creating a new strategic task.
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { UseFormReturn } from "react-hook-form";
import type { StrategicCategory, InsertStrategicTask } from "@shared/schema";
import { Plus } from "lucide-react";
import { STATUS_OPTIONS, PRIORITY_OPTIONS } from "./StrategicTasksPanelTypes";
import { useTranslation } from '@/lib/i18n';

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<InsertStrategicTask>;
  categories: StrategicCategory[];
  onSubmit: (data: InsertStrategicTask) => void;
  isPending: boolean;
}

export function TaskDialog({
  open,
  onOpenChange,
  form,
  categories,
  onSubmit,
  isPending,
}: TaskDialogProps) {
  const { t } = useTranslation("common");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button data-testid="button-add-task" onClick={() => form.reset()}>
          <Plus className="h-4 w-4 mr-2" />
          {t("vazifaQoshish")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t("yangiStrategikVazifa")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="taskNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("vazifaRaqami")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        data-testid="input-task-number"
                        type="number"
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("category")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger data-testid="select-task-category" className="h-9">
                          <SelectValue placeholder={t("tanlang")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(Array.isArray(categories) ? categories : []).map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("sarlavhaUz")}</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-task-title" placeholder={t("vazifaSarlavhasi")} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="titleRu"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("sarlavhaRu")}</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} data-testid="input-task-title-ru" placeholder={t("untitled")} />
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
                    <Textarea {...field} value={field.value || ""} data-testid="input-task-description" placeholder={t("batafsilTavsif")} rows={3} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("priority")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-task-priority" className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(Array.isArray(PRIORITY_OPTIONS) ? PRIORITY_OPTIONS : []).map((p) => (
                          <SelectItem key={p.value} value={p.value}>
                            {p.label}
                          </SelectItem>
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
                        <SelectTrigger data-testid="select-task-status" className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(Array.isArray(STATUS_OPTIONS) ? STATUS_OPTIONS : []).map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phase"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("milestone1")}</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} data-testid="input-task-phase" placeholder={t("masalanQ1Q2")} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="targetModule"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("maqsadliModul")}</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} data-testid="input-task-module" placeholder={t("masalanHrCrm")} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("startDate")}</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} type="date" data-testid="input-task-start-date" />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="targetDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("maqsadSanasi")}</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} type="date" data-testid="input-task-target-date" />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="estimatedHours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("taxminiySoatlar1")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      type="number"
                      data-testid="input-task-hours"
                      placeholder="0"
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="isAutomatable"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Checkbox
                        data-testid="checkbox-automatable"
                        checked={field.value || false}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">{t("avtomatlashtirilishiMumkin")}</FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="industryAdaptable"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Checkbox
                        data-testid="checkbox-industry-adaptable"
                        checked={field.value ?? true}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">{t("sanoatgaMoslashuvchan")}</FormLabel>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t("cancel")}
              </Button>
              <Button type="submit" data-testid="button-save-task" disabled={isPending}>
                {isPending ? "Saqlanmoqda..." : "Saqlash"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
