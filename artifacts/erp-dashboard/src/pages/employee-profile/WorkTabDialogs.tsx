/**
 * @module WorkTabDialogs
 * @description SalarySection component: renders the salary-history card with
 * the "Add salary change" dialog trigger.  The read-only history table is
 * delegated to SalaryHistoryTable from WorkTabTables.
 */

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TrendingUp, Plus } from "lucide-react";
import type { UseMutationResult } from "@tanstack/react-query";
import type { SalaryHistoryRecord, SalaryForm, TranslationFn } from "./WorkTabTypes";
import { SalaryHistoryTable } from "./WorkTabTables";

interface SalarySectionProps {
  t: TranslationFn;
  tCommon: TranslationFn;
  salaryDialogOpen: boolean;
  setSalaryDialogOpen: (open: boolean) => void;
  salaryForm: SalaryForm;
  setSalaryForm: (form: SalaryForm) => void;
  saveSalaryChangeMutation: UseMutationResult<unknown, Error, SalaryForm, unknown>;
  loadingSalaryHistory: boolean;
  salaryHistory: SalaryHistoryRecord[] | undefined;
}

export function SalarySection({ t, tCommon, salaryDialogOpen, setSalaryDialogOpen, salaryForm, setSalaryForm, saveSalaryChangeMutation, loadingSalaryHistory, salaryHistory, }: SalarySectionProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {t("salaryHistory")}
          </CardTitle>
          <CardDescription>{t("employeeDetails")}</CardDescription>
        </div>

        <Dialog open={salaryDialogOpen} onOpenChange={setSalaryDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" data-testid="button-add-salary-change">
              <Plus className="h-4 w-4 mr-2" />
              {tCommon("add")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg p-6">
            <DialogHeader>
              <DialogTitle className="text-[18px] font-semibold">{t("salaryHistory")}</DialogTitle>
              <DialogDescription>{t("employeeDetails")}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
          <Label>{t("effectiveDate")}</Label>
                  <Input
                    type="date"
                    value={salaryForm.effectiveDate}
                    onChange={(e) =>
                      setSalaryForm({ ...salaryForm, effectiveDate: e.target.value })
                    }
                    data-testid="input-salary-date"
                  />
                </div>
                <div className="space-y-1">
          <Label>{t("changeType")}</Label>
                  <Select
                    value={salaryForm.changeType}
                    onValueChange={(value) =>
                      setSalaryForm({ ...salaryForm, changeType: value })
                    }
                  >
                    <SelectTrigger data-testid="select-salary-type" className="h-9">
                      <SelectValue placeholder={tCommon("select")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="promotion">{t("promotion")}</SelectItem>
                      <SelectItem value="annual_review">{t("annualReview")}</SelectItem>
                      <SelectItem value="adjustment">{t("adjustment")}</SelectItem>
                      <SelectItem value="probation_end">{t("probationEnd")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
          <Label>{t("previousSalary")}</Label>
                  <Input
                    type="number"
                    value={salaryForm.previousSalary}
                    onChange={(e) =>
                      setSalaryForm({ ...salaryForm, previousSalary: e.target.value })
                    }
                    placeholder="4000000"
                    data-testid="input-previous-salary"
                  />
                </div>
                <div className="space-y-1">
          <Label>{t("newSalary")}</Label>
                  <Input
                    type="number"
                    value={salaryForm.newSalary}
                    onChange={(e) =>
                      setSalaryForm({ ...salaryForm, newSalary: e.target.value })
                    }
                    placeholder="5000000"
                    data-testid="input-new-salary"
                  />
                </div>
              </div>
              <div className="space-y-1">
          <Label>{tCommon("note")}</Label>
                <Input
                  value={salaryForm.notes}
                  onChange={(e) =>
                    setSalaryForm({ ...salaryForm, notes: e.target.value })
                  }
                  placeholder={t("qoshimchaMalumot")}
                  data-testid="input-salary-notes"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => saveSalaryChangeMutation.mutate(salaryForm)}
                disabled={
                  saveSalaryChangeMutation.isPending ||
                  !salaryForm.effectiveDate ||
                  !salaryForm.newSalary
                }
                data-testid="button-save-salary"
              >
                {saveSalaryChangeMutation.isPending
                  ? tCommon("loading")
                  : tCommon("save")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        <SalaryHistoryTable
          t={t}
          tCommon={tCommon}
          loadingSalaryHistory={loadingSalaryHistory}
          salaryHistory={salaryHistory}
        />
      </CardContent>
    </Card>
  );
}
