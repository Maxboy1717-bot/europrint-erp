/** @module EmployeeDailyKPIPanelDialog @description KPI evaluation creation dialog with form, sliders, and live score preview for EmployeeDailyKPIPanel. */

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
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
import { Plus } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import type { InsertEmployeeDailyKpi } from "@shared/schema";
import { getScoreColor, getScoreBg } from "./EmployeeDailyKPIPanelTypes";

const SCORE_SLIDERS = [
  { name: "attendanceScore" as const, label: "Davomad (Attendance)", testId: "slider-attendance" },
  { name: "taskCompletionScore" as const, label: "Vazifalar (Task Completion)", testId: "slider-tasks" },
  { name: "qualityScore" as const, label: "Sifat (Quality)", testId: "slider-quality" },
  { name: "productivityScore" as const, label: "Samaradorlik (Productivity)", testId: "slider-productivity" },
  { name: "teamworkScore" as const, label: "Jamoa ishi (Teamwork)", testId: "slider-teamwork" },
  { name: "disciplineScore" as const, label: "Intizom (Discipline)", testId: "slider-discipline" },
] as const;

interface Employee {
  id: string;
  fullName: string;
  departmentId: string | null;
}

interface KpiEvaluationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<InsertEmployeeDailyKpi>;
  employees: Employee[];
  selectedDate: string;
  overallPreview: number;
  netPreview: number;
  isPending: boolean;
  onSubmit: (data: InsertEmployeeDailyKpi) => void;
}

export function KpiEvaluationDialog({
  open,
  onOpenChange,
  form,
  employees,
  selectedDate,
  overallPreview,
  netPreview,
  isPending,
  onSubmit,
}: KpiEvaluationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          data-testid="button-add-evaluation"
          onClick={() =>
            form.reset({
              userId: "",
              evaluationDate: selectedDate,
              departmentId: null,
              attendanceScore: 70,
              taskCompletionScore: 70,
              qualityScore: 70,
              productivityScore: 70,
              teamworkScore: 70,
              disciplineScore: 70,
              bonusPercent: 0,
              penaltyPercent: 0,
              notes: "",
            })
          }
        >
          <Plus className="h-4 w-4 mr-2" />
          Baholash qo'shish
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">Yangi KPI Baholash</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="userId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Xodim</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger data-testid="select-employee" className="h-9">
                          <SelectValue placeholder="Xodim tanlang" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(Array.isArray(employees) ? employees : []).map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.fullName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="evaluationDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sana</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-form-date" />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              {SCORE_SLIDERS.map((item) => (
                <FormField
                  key={item.testId}
                  control={form.control}
                  name={item.name}
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>{item.label}</FormLabel>
                        <span className={`text-sm font-bold ${getScoreColor(field.value ?? 70)}`}>
                          {field.value ?? 70}
                        </span>
                      </div>
                      <FormControl>
                        <Slider
                          min={0}
                          max={100}
                          step={1}
                          value={[field.value ?? 70]}
                          onValueChange={(val) => field.onChange(val[0])}
                          data-testid={item.testId}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="bonusPercent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bonus %</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={field.value ?? 0}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        data-testid="input-bonus"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="penaltyPercent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jarima %</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={field.value ?? 0}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        data-testid="input-penalty"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Izohlar</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ""}
                      placeholder="Qo'shimcha izohlar..."
                      rows={3}
                      data-testid="textarea-notes"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <Card className={getScoreBg(overallPreview)}>
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Umumiy ball</span>
                  <span
                    className={`text-lg font-bold ${getScoreColor(overallPreview)}`}
                    data-testid="text-overall-preview"
                  >
                    {overallPreview}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm text-muted-foreground">
                    Sof ball (bonus/jarima bilan)
                  </span>
                  <span
                    className={`text-lg font-bold ${getScoreColor(netPreview)}`}
                    data-testid="text-net-preview"
                  >
                    {netPreview}
                  </span>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel"
              >
                Bekor qilish
              </Button>
              <Button type="submit" disabled={isPending} data-testid="button-submit-evaluation">
                {isPending ? "Saqlanmoqda..." : "Saqlash"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
