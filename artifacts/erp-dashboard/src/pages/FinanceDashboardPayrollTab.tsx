/**
 * @module FinanceDashboardPayrollTab
 * @description PayrollTab component for FinanceDashboard.
 */

import { UseFormReturn } from "react-hook-form";
import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useTranslation } from "@/lib/i18n";
import { formatDate, formatCurrency } from "@/lib/format";
import { FileText, Plus, RefreshCw, Lock } from "lucide-react";
import type { PayrollPeriod, PayrollRow, PayrollPeriodFormData } from "./FinanceDashboardTypes";

interface PayrollTabProps {
  periods: PayrollPeriod[];
  periodsLoading: boolean;
  periodRows: PayrollRow[];
  selectedPeriod: string | null;
  newPeriodOpen: boolean;
  periodForm: UseFormReturn<PayrollPeriodFormData>;
  isCreatingPeriod: boolean;
  isCalculatingPayroll: boolean;
  isClosingPeriod: boolean;
  onSetNewPeriodOpen: (open: boolean) => void;
  onCreatePeriod: (values: PayrollPeriodFormData) => void;
  onCalculatePayroll: (periodId: string) => void;
  onClosePeriod: (periodId: string) => void;
  onSelectPeriod: (periodId: string | null) => void;
  getStatusBadge: (status: string) => React.ReactNode;
}

export function PayrollTab({
  periods,
  periodsLoading,
  periodRows,
  selectedPeriod,
  newPeriodOpen,
  periodForm,
  isCreatingPeriod,
  isCalculatingPayroll,
  isClosingPeriod,
  onSetNewPeriodOpen,
  onCreatePeriod,
  onCalculatePayroll,
  onClosePeriod,
  onSelectPeriod,
  getStatusBadge,
}: PayrollTabProps) {
  const { t } = useTranslation('finance');
  const { t: tCommon } = useTranslation('common');

  return (
    <TabsContent value="payroll">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">{t('fiscalPeriod')}</h2>
        <Dialog open={newPeriodOpen} onOpenChange={onSetNewPeriodOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-period">
              <Plus className="h-4 w-4 mr-2" />
              {tCommon('create')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={periodForm.handleSubmit(onCreatePeriod)}>
              <DialogHeader>
                <DialogTitle className="text-[18px] font-semibold">{t('fiscalPeriod')}</DialogTitle>
                <DialogDescription>{t('payrollCalculation')}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="periodName">{t('period')}</Label>
                  <Input id="periodName" {...periodForm.register("periodName")} placeholder={t("yanvar2024")} data-testid="input-period-name" />
                  {periodForm.formState.errors.periodName && (
                    <p className="text-sm text-destructive mt-1">{periodForm.formState.errors.periodName.message}</p>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">{tCommon('startDate')}</Label>
                    <Input id="startDate" type="date" {...periodForm.register("startDate")} data-testid="input-start-date" />
                    {periodForm.formState.errors.startDate && (
                      <p className="text-sm text-destructive mt-1">{periodForm.formState.errors.startDate.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="endDate">{tCommon('endDate')}</Label>
                    <Input id="endDate" type="date" {...periodForm.register("endDate")} data-testid="input-end-date" />
                    {periodForm.formState.errors.endDate && (
                      <p className="text-sm text-destructive mt-1">{periodForm.formState.errors.endDate.message}</p>
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isCreatingPeriod} data-testid="button-submit-period">
                  {tCommon('create')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {periodsLoading ? (
          <Card><CardContent className="p-8 text-center">{tCommon('loading')}</CardContent></Card>
        ) : periods.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">{tCommon('noData')}</CardContent></Card>
        ) : (
          (Array.isArray(periods) ? periods : []).map((period) => (
            <Card key={period.id} data-testid={`card-period-${period.id}`}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {period.periodName}
                    {getStatusBadge(period.status)}
                  </CardTitle>
                  <CardDescription>
                    {formatDate(period.startDate)} - {formatDate(period.endDate)}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {period.status === "open" && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => onCalculatePayroll(period.id)}
                        disabled={isCalculatingPayroll}
                        data-testid={`button-calculate-${period.id}`}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        {t('payrollCalculation')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onClosePeriod(period.id)}
                        disabled={isClosingPeriod}
                        data-testid={`button-close-${period.id}`}
                      >
                        <Lock className="h-4 w-4 mr-2" />
                        {t('closePeriod')}
                      </Button>
                    </>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onSelectPeriod(selectedPeriod === period.id ? null : period.id)}
                    data-testid={`button-view-${period.id}`}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    {selectedPeriod === period.id ? tCommon('close') : tCommon('view')}
                  </Button>
                </div>
              </CardHeader>
              {period.totalAmount && (
                <CardContent>
                  <div className="text-2xl font-bold text-[var(--ep-green)]">{formatCurrency(period.totalAmount)}</div>
                  <p className="text-sm text-muted-foreground">{t('totalGross')}</p>
                </CardContent>
              )}
              {selectedPeriod === period.id && (
                <CardContent>
                  <div className="ep-table-scroll"><Table data-testid={`table-rows-${period.id}`}>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{tCommon('name')}</TableHead>
                        <TableHead>{t('costCenter')}</TableHead>
                        <TableHead className="text-right">{t('workDays')}</TableHead>
                        <TableHead className="text-right">{t('baseSalary')}</TableHead>
                        <TableHead className="text-right">{t('bonuses')}</TableHead>
                        <TableHead className="text-right">{t('totalDeductions')}</TableHead>
                        <TableHead className="text-right">{t('netSalary')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(Array.isArray(periodRows) ? periodRows : []).map((row) => (
                        <TableRow key={row.id} className="hover:bg-muted/40 transition-colors">
                          <TableCell className="font-medium">{row.employeeName || row.employeeId}</TableCell>
                          <TableCell>{row.departmentId || "-"}</TableCell>
                          <TableCell className="text-right">{row.workDays}</TableCell>
                          <TableCell className="text-right">{formatCurrency(row.baseSalary)}</TableCell>
                          <TableCell className="text-right text-[var(--ep-green)]">+{formatCurrency(row.bonuses)}</TableCell>
                          <TableCell className="text-right text-[var(--ep-red)]">-{formatCurrency(row.deductions)}</TableCell>
                          <TableCell className="text-right font-bold">{formatCurrency(row.totalSalary)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table></div>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>
    </TabsContent>
  );
}
