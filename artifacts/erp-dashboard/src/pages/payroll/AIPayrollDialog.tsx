/**
 * @module AIPayrollDialog
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useTranslation } from "@/lib/i18n";
import { Sparkles, Brain, CheckCircle2, RefreshCw, AlertTriangle, ThumbsUp } from "lucide-react";
import type { AIPayrollResult, PayrollContract, PayrollUser } from "./types";

interface AIPayrollDialogProps {
  contracts: PayrollContract[];
  employeeMap: Record<string, PayrollUser>;
  trigger: React.ReactNode;
}

export function AIPayrollDialog({ contracts, employeeMap, trigger }: AIPayrollDialogProps) {
  const { t } = useTranslation('hr');
  const { t: tFinance } = useTranslation('finance');
  const { t: tCommon } = useTranslation('common');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAIEmployee, setSelectedAIEmployee] = useState<string>("");
  const [selectedPeriod, setSelectedPeriod] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [aiResult, setAiResult] = useState<AIPayrollResult | null>(null);
  const { toast } = useToast();

  const aiCalculateMutation = useMutation({
    mutationFn: async ({ employeeId, periodMonth }: { employeeId: string; periodMonth: string }) => {
      return await apiRequest<AIPayrollResult>("POST", "/api/finance-extended/payroll/ai-calculate", { employeeId, periodMonth });
    },
    onSuccess: (data) => {
      setAiResult(data);
      queryClient.invalidateQueries({ queryKey: ["/api/finance-extended/payroll-calculations"] });
      toast({
        title: tCommon('success'),
        description: `${data.employeeName} - AI. ${tCommon('confidence')}: ${data.confidence}%`,
      });
    },
    onError: (error: Error) => {
      toast({ title: tCommon('error'), description: error.message || tCommon('operationFailed'), variant: "destructive" });
    },
  });

  const handleAICalculate = () => {
    if (!selectedAIEmployee || !selectedPeriod) {
      toast({ title: tCommon('error'), description: tCommon('fillRequiredFields'), variant: "destructive" });
      return;
    }
    aiCalculateMutation.mutate({ employeeId: selectedAIEmployee, periodMonth: selectedPeriod });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) setAiResult(null); }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-[var(--ep-purple)]" />
            {tFinance('aiCalculation')}
          </DialogTitle>
          <DialogDescription>{tFinance('payrollAutomation')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('employee')}</label>
              <Select value={selectedAIEmployee} onValueChange={setSelectedAIEmployee}>
                <SelectTrigger data-testid="select-ai-employee" className="h-9">
                  <SelectValue placeholder={tCommon('select')} />
                </SelectTrigger>
                <SelectContent>
                  {(Array.isArray(contracts) ? contracts : []).filter(c => c.status === "active").map((contract) => (
                    <SelectItem key={contract.employeeId} value={contract.employeeId}>
                      {employeeMap[contract.employeeId]?.fullName || contract.employeeId}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{tFinance('period')}</label>
              <Input type="month" value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)} data-testid="input-ai-period" />
            </div>
          </div>

          <Button
            onClick={handleAICalculate}
            disabled={aiCalculateMutation.isPending || !selectedAIEmployee}
            className="w-full bg-purple-500 hover:from-purple-600 hover:to-pink-600"
            data-testid="button-run-ai-calculation"
          >
            {aiCalculateMutation.isPending ? (
              <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />{tCommon('loading')}</>
            ) : (
              <><Sparkles className="h-4 w-4 mr-2" />{tFinance('aiCalculation')}</>
            )}
          </Button>

          {aiResult && (
            <Card className="border-purple-200 bg-purple-50/50 dark:bg-purple-950/20">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-[14px] font-semibold flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[var(--ep-green)]" />
                    {tFinance('aiCalculation')}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant={aiResult.dataQuality === "high" ? "default" : aiResult.dataQuality === "medium" ? "secondary" : "destructive"}>
                      {aiResult.dataQuality === "high" ? tCommon('high') : aiResult.dataQuality === "medium" ? tCommon('medium') : tCommon('low')}
                    </Badge>
                    <Badge variant="outline">{aiResult.confidence}%</Badge>
                  </div>
                </div>
                <CardDescription>{aiResult.employeeName} - {aiResult.periodMonth}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-muted-foreground">{tFinance('workData')}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between p-2 bg-background rounded">
                        <span>{tFinance('workDays')}:</span>
                        <span className="font-medium">{aiResult.workDays}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-background rounded">
                        <span>{tFinance('workHours')}:</span>
                        <span className="font-medium">{aiResult.workHours.toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-background rounded">
                        <span>{tFinance('overtime')}:</span>
                        <span className="font-medium">{aiResult.overtimeHours.toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-background rounded">
                        <span>{tFinance('production')}:</span>
                        <span className="font-medium">{aiResult.productionUnits}</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-muted-foreground">{tFinance('salaryDetails')}</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>{tFinance('baseSalary')}:</span>
                        <span>{formatCurrency(aiResult.basePay + aiResult.hourlyPay + aiResult.pieceworkPay)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{tFinance('overtime')}:</span>
                        <span>{formatCurrency(aiResult.overtimePay)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-medium">
                        <span>{tFinance('grossSalary')}:</span>
                        <span className="text-[var(--ep-green)]">{formatCurrency(aiResult.grossPay)}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>{t("inps12")}</span>
                        <span>-{formatCurrency(aiResult.taxInps)}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>{t("jshd12")}</span>
                        <span>-{formatCurrency(aiResult.taxJshd)}</span>
                      </div>
                      {aiResult.minWageTopUp > 0 && (
                        <div className="flex justify-between text-[var(--ep-blue)]">
                          <span>{tFinance('minWageTopUp')}:</span>
                          <span>+{formatCurrency(aiResult.minWageTopUp)}</span>
                        </div>
                      )}
                      <Separator />
                      <div className="flex justify-between text-lg font-bold">
                        <span>{tFinance('netSalary')}:</span>
                        <span className="text-[var(--ep-purple)]">{formatCurrency(aiResult.netPay)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {aiResult.recommendations.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                      <Brain className="h-4 w-4" />
                      {tFinance('aiRecommendations')}
                    </h4>
                    <div className="space-y-2">
                      {(Array.isArray(aiResult.recommendations) ? aiResult.recommendations : []).map((rec, idx) => (
                        <Card key={idx} className={`p-3 ${
                          rec.type === "bonus" ? "border-green-200 bg-green-50/50 dark:bg-green-950/20" :
                          rec.type === "warning" ? "border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/20" :
                          rec.type === "optimization" ? "border-blue-200 bg-blue-50/50 dark:bg-blue-950/20" :
                          "border-border/30"
                        }`}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2">
                              {rec.type === "bonus" && <ThumbsUp className="h-4 w-4 text-[var(--ep-green)] mt-0.5" />}
                              {rec.type === "warning" && <AlertTriangle className="h-4 w-4 text-[var(--ep-yellow)] mt-0.5" />}
                              {rec.type === "optimization" && <Sparkles className="h-4 w-4 text-[var(--ep-blue)] mt-0.5" />}
                              <div>
                                <p className="font-medium text-sm">{rec.title}</p>
                                <p className="text-xs text-muted-foreground">{rec.description}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              {rec.suggestedAmount && (
                                <span className="text-sm font-medium text-[var(--ep-green)]">+{formatCurrency(rec.suggestedAmount)}</span>
                              )}
                              <Badge variant="outline" className="ml-2 text-xs">{rec.confidence}%</Badge>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">{tCommon('close')}</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
