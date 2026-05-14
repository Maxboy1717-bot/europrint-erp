/**
 * @module CalculatePayrollDialog
 * @description React page component. Route-level UI.
 */

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useTranslation } from "@/lib/i18n";
import { Plus, Eye, Info } from "lucide-react";
import type { PayrollContract, PayrollUser, CalculationFormValues } from "./types";
import { calculationFormSchema, payTypeKeys } from "./types";

interface CalculatePayrollDialogProps {
  contracts: PayrollContract[];
  employeeMap: Record<string, PayrollUser>;
  contractsByEmployee: Record<string, PayrollContract>;
  taxConstants: { INPS_RATE: number; JSHD_RATE: number; MIN_WAGE: number };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: React.ReactNode;
}

export function CalculatePayrollDialog({
  contracts,
  employeeMap,
  contractsByEmployee,
  taxConstants,
  open,
  onOpenChange,
  trigger,
}: CalculatePayrollDialogProps) {
  const { t } = useTranslation('hr');
  const { t: tFinance } = useTranslation('finance');
  const { t: tCommon } = useTranslation('common');
  const { toast } = useToast();

  const form = useForm<CalculationFormValues>({
    resolver: zodResolver(calculationFormSchema),
    defaultValues: {
      employeeId: "", workDays: 0, workHours: 0, productionUnits: 0,
      bonuses: 0, allowances: 0, advances: 0, loans: 0, otherDeductions: 0,
    },
  });

  const selectedEmployeeId = form.watch("employeeId");
  const selectedEmployeeContract = selectedEmployeeId ? contractsByEmployee[selectedEmployeeId] : null;

  const calculateMutation = useMutation({
    mutationFn: async (data: CalculationFormValues) => {
      return apiRequest("POST", "/api/finance-extended/payroll/calculate", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/finance-extended/payroll-calculations"] });
      toast({ title: tCommon('success'), description: tCommon('savedSuccessfully') });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({ title: tCommon('error'), description: error.message || tCommon('operationFailed'), variant: "destructive" });
    },
  });

  const calculatePreview = (values: CalculationFormValues) => {
    const contract = contractsByEmployee[values.employeeId];
    if (!contract) return null;
    let basePay = 0, hourlyPay = 0, pieceworkPay = 0;
    switch (contract.payType) {
      case "fixed": basePay = contract.baseSalary || 0; break;
      case "hourly": hourlyPay = (values.workHours || 0) * (contract.hourlyRate || 0); break;
      case "piecework": pieceworkPay = (values.productionUnits || 0) * (contract.pieceworkRate || 0); break;
    }
    const grossPay = basePay + hourlyPay + pieceworkPay + (values.bonuses || 0) + (values.allowances || 0);
    const taxInps = grossPay * taxConstants.INPS_RATE;
    const taxJshd = grossPay * taxConstants.JSHD_RATE;
    const totalTaxes = taxInps + taxJshd;
    const totalDeductions = totalTaxes + (values.advances || 0) + (values.loans || 0) + (values.otherDeductions || 0);
    let netPay = grossPay - totalDeductions;
    let minWageTopUp = 0;
    if (contract.minWageGuarantee && netPay < taxConstants.MIN_WAGE) {
      minWageTopUp = taxConstants.MIN_WAGE - netPay;
      netPay = taxConstants.MIN_WAGE;
    }
    return { basePay, hourlyPay, pieceworkPay, grossPay, taxInps, taxJshd, totalTaxes, totalDeductions, netPay, minWageTopUp };
  };

  const watchedValues = form.watch();
  const previewCalculation = useMemo(
    () => (watchedValues.employeeId ? calculatePreview(watchedValues) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [watchedValues.employeeId, watchedValues.workDays, watchedValues.workHours,
     watchedValues.productionUnits, watchedValues.bonuses, watchedValues.allowances,
     watchedValues.advances, watchedValues.loans, watchedValues.otherDeductions],
  );

  const onSubmit = (values: CalculationFormValues) => calculateMutation.mutate(values);

  const formFields = [
    { name: "bonuses" as const, label: tFinance('bonuses') },
    { name: "allowances" as const, label: tFinance('allowances') },
    { name: "advances" as const, label: tFinance('advances') },
    { name: "loans" as const, label: tFinance('loans') },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{tFinance('payrollCalculation')}</DialogTitle>
          <DialogDescription>{tFinance('payrollAutomation')}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField control={form.control} name="employeeId" render={({ field }) => (
              <FormItem>
                <FormLabel>{t('employee')}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-employee" className="h-9"><SelectValue placeholder={tCommon('select')} /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(Array.isArray(contracts) ? contracts : []).filter(c => c.status === "active").map((contract) => (
                      <SelectItem key={contract.employeeId} value={contract.employeeId}>
                        {employeeMap[contract.employeeId]?.fullName || contract.employeeId} - {tFinance(payTypeKeys[contract.payType])}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            {selectedEmployeeContract && (
              <Card className="bg-muted/50">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm flex items-center gap-2"><Info className="h-4 w-4" />{tFinance('contractDetails')}</CardTitle>
                </CardHeader>
                <CardContent className="py-2 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{tFinance('paymentType')}:</span>
                    <Badge variant="outline">{tFinance(payTypeKeys[selectedEmployeeContract.payType])}</Badge>
                  </div>
                  {selectedEmployeeContract.payType === "fixed" && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{tFinance('baseSalary')}:</span>
                      <span className="font-medium">{formatCurrency(selectedEmployeeContract.baseSalary || 0)}</span>
                    </div>
                  )}
                  {selectedEmployeeContract.payType === "hourly" && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{tFinance('hourlyRate')}:</span>
                      <span className="font-medium">{formatCurrency(selectedEmployeeContract.hourlyRate || 0)}</span>
                    </div>
                  )}
                  {selectedEmployeeContract.payType === "piecework" && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{tFinance('pieceworkRate')}:</span>
                        <span className="font-medium">{formatCurrency(selectedEmployeeContract.pieceworkRate || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{tFinance('unit')}:</span>
                        <span>{selectedEmployeeContract.pieceworkUnit || "dona"}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{tFinance('minWageGuarantee')}:</span>
                    <Badge variant={selectedEmployeeContract.minWageGuarantee ? "default" : "secondary"}>
                      {selectedEmployeeContract.minWageGuarantee ? "Ha" : "Yo'q"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-4 md:grid-cols-3">
              {(selectedEmployeeContract?.payType === "fixed" || !selectedEmployeeContract) && (
                <FormField control={form.control} name="workDays" render={({ field }) => (
                  <FormItem><FormLabel>{tFinance('workDays')}</FormLabel><FormControl><Input type="number" {...field} data-testid="input-work-days" /></FormControl><FormMessage /></FormItem>
                )} />
              )}
              {(selectedEmployeeContract?.payType === "hourly" || !selectedEmployeeContract) && (
                <FormField control={form.control} name="workHours" render={({ field }) => (
                  <FormItem><FormLabel>{tFinance('workHours')}</FormLabel><FormControl><Input type="number" {...field} data-testid="input-work-hours" /></FormControl><FormMessage /></FormItem>
                )} />
              )}
              {(selectedEmployeeContract?.payType === "piecework" || !selectedEmployeeContract) && (
                <FormField control={form.control} name="productionUnits" render={({ field }) => (
                  <FormItem><FormLabel>{tFinance('production')} ({selectedEmployeeContract?.pieceworkUnit || "dona"})</FormLabel><FormControl><Input type="number" {...field} data-testid="input-production-units" /></FormControl><FormMessage /></FormItem>
                )} />
              )}
            </div>

            <Separator />

            <div className="grid gap-4 md:grid-cols-2">
              {(Array.isArray(formFields) ? formFields : []).map(({ name, label }) => (
                <FormField key={name} control={form.control} name={name} render={({ field }) => (
                  <FormItem><FormLabel>{label}</FormLabel><FormControl><Input type="number" placeholder="0" {...field} data-testid={`input-${name}`} /></FormControl><FormMessage /></FormItem>
                )} />
              ))}
            </div>

            {previewCalculation && (
              <Card className="border-indigo-500/50 bg-indigo-500/10">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm flex items-center gap-2"><Eye className="h-4 w-4" />{tFinance('calculationPreview')}</CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{tFinance('grossSalary')}:</span>
                      <span className="font-medium">{formatCurrency(previewCalculation.grossPay)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-[var(--ep-primary)]"><span>INPS ({(taxConstants.INPS_RATE * 100).toFixed(0)}%):</span><span>- {formatCurrency(previewCalculation.taxInps)}</span></div>
                    <div className="flex justify-between text-[var(--ep-red)]"><span>JSHD ({(taxConstants.JSHD_RATE * 100).toFixed(0)}%):</span><span>- {formatCurrency(previewCalculation.taxJshd)}</span></div>
                    <div className="flex justify-between font-medium">
                      <span>{tFinance('totalTaxes')}:</span>
                      <span className="text-[var(--ep-red)]">- {formatCurrency(previewCalculation.totalTaxes)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{tFinance('totalDeductions')}:</span>
                      <span>- {formatCurrency(previewCalculation.totalDeductions)}</span>
                    </div>
                    {previewCalculation.minWageTopUp > 0 && (
                      <div className="flex justify-between text-[var(--ep-green)]">
                        <span>{tFinance('minWageTopUp')}:</span>
                        <span>+ {formatCurrency(previewCalculation.minWageTopUp)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>{tFinance('netSalary')}:</span>
                      <span className="text-[var(--ep-green)]">{formatCurrency(previewCalculation.netPay)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline">{tCommon('cancel')}</Button></DialogClose>
              <Button type="submit" disabled={calculateMutation.isPending} data-testid="button-calculate-submit">
                {calculateMutation.isPending ? tCommon('loading') : tCommon('save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
