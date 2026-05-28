/**
 * @module PayrollAutomation
 * @description React page component. Route-level UI.
 */

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "@/lib/i18n";
import { Calculator, FileText, Plus, Sparkles, Play } from "lucide-react";
import type { PayrollContract, PayrollCalculation, PayrollTaxRule, PayrollUser } from "./payroll/types";
import { AIPayrollDialog } from "./payroll/AIPayrollDialog";
import { CalculatePayrollDialog } from "./payroll/CalculatePayrollDialog";
import { PayrollStatsCards } from "./payroll/PayrollStatsCards";
import { ContractsTab } from "./payroll/ContractsTab";
import { CalculationsTab } from "./payroll/CalculationsTab";
import { TaxRulesSidebar } from "./payroll/TaxRulesSidebar";
import { EPErrorState } from "@/components/ep";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { tLabel } from "@/lib/i18n/tLabel";

export default function PayrollAutomation() {
  const { t } = useTranslation('hr');
  const { t: tFinance } = useTranslation('finance');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("contracts");
  const [isCalculateDialogOpen, setIsCalculateDialogOpen] = useState(false);
  const [isRunPayrollOpen, setIsRunPayrollOpen] = useState(false);
  const [payrollPeriod, setPayrollPeriod] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const runPayrollMutation = useMutation({
    mutationFn: (period: string) => apiRequest("POST", "/api/finance-extended/payroll/run", { period }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/finance-extended/payroll-calculations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/finance-extended/payroll-contracts"] });
      setIsRunPayrollOpen(false);
      toast({ title: tLabel('payroll.runPayroll.success', "Maosh hisoblandi"), description: tLabel('payroll.runPayroll.successDesc', `${payrollPeriod} davri uchun hisoblash boshlandi`) });
    },
    onError: (error: Error) => toast({
      title: tLabel('payroll.runPayroll.error', "Server xatosi"),
      description: error?.message || tLabel('payroll.runPayroll.errorDesc', "Maosh hisoblashda xatolik yuz berdi"),
      variant: "destructive",
    }),
  });

  const { data: sysSettings } = useQuery<{ inpsRate?: number; jshdRate?: number; jshirdRate?: number; minWage?: number; qqsRate?: number }>({
    queryKey: ["/api/system-settings"],
  });

  const TAX_CONSTANTS = useMemo(() => ({
    INPS_RATE: sysSettings?.inpsRate ?? 0.08,
    JSHD_RATE: sysSettings?.jshdRate ?? sysSettings?.jshirdRate ?? 0.12,
    MIN_WAGE: sysSettings?.minWage ?? 1120000,
  }), [sysSettings]);

  const { data: contracts = [], isLoading: contractsLoading, isError, error, refetch } = useQuery<PayrollContract[]>({
    queryKey: ["/api/finance-extended/payroll-contracts"],
  });

  const { data: calculations = [], isLoading: calculationsLoading } = useQuery<PayrollCalculation[]>({
    queryKey: ["/api/finance-extended/payroll-calculations"],
  });

  const { data: taxRules = [], isLoading: taxRulesLoading } = useQuery<PayrollTaxRule[]>({
    queryKey: ["/api/finance-extended/payroll-tax-rules"],
  });

  const { data: employees = [] } = useQuery<PayrollUser[]>({
    queryKey: ["/api/hr/employees"],
    queryFn: () => apiRequest("GET", "/api/hr/employees"),
    select: (data: unknown) => {
      const d = data as Record<string, unknown>;
      return Array.isArray(d?.items) ? (d.items as PayrollUser[]) : (Array.isArray(data) ? (data as PayrollUser[]) : []);
    },
  });

  const employeeMap = useMemo(() => {
    return (Array.isArray(employees) ? employees : []).reduce((map, emp) => { map[emp.id] = emp; return map; }, {} as Record<string, PayrollUser>);
  }, [employees]);

  const contractsByEmployee = useMemo(() => {
    return (Array.isArray(contracts) ? contracts : []).reduce((map, c) => { map[c.employeeId] = c; return map; }, {} as Record<string, PayrollContract>);
  }, [contracts]);

  const kpiStats = useMemo(() => {
    const activeContracts = (Array.isArray(contracts) ? contracts : []).filter(c => c.status === "active").length;
    const pendingCalcs = (Array.isArray(calculations) ? calculations : []).filter(c => c.status === "calculated").length;
    const approvedCalcs = (Array.isArray(calculations) ? calculations : []).filter(c => c.status === "approved").length;
    const totalGross = (Array.isArray(calculations) ? calculations : []).reduce((sum, c) => sum + c.grossPay, 0);
    return { activeContracts, pendingCalcs, approvedCalcs, totalGross };
  }, [contracts, calculations]);

  if (isError) {
    return <EPErrorState onRetry={refetch}  error={error} />;
  }

  return (
    <div data-testid="payroll-automation-page">
      <div className="-mx-4 -mt-4 lg:-mx-6 lg:-mt-6 border-b from-primary to-amber-500 text-white">
        <div className="px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <Calculator className="h-8 w-8" />
              <div>
                <h1 className="text-2xl font-bold">{tFinance('payrollCalculation')}</h1>
                <p className="text-white/75 text-sm">{tFinance('payrollAutomation')}</p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="secondary"
                className="bg-green-600 hover:bg-green-700 text-white border-0 gap-2"
                onClick={() => setIsRunPayrollOpen(true)}
                data-testid="button-run-payroll"
              >
                <Play className="h-4 w-4" />
                {tLabel('payroll.runPayroll.button', "Maosh hisoblash")}
              </Button>
              <AIPayrollDialog
                contracts={contracts}
                employeeMap={employeeMap}
                trigger={
                  <Button variant="secondary" className="bg-[var(--ep-purple)] hover:from-purple-600 hover:to-pink-600 text-white border-0 gap-2" data-testid="button-ai-calculation">
                    <Sparkles className="h-4 w-4" />
                    {tFinance('aiCalculation')}
                  </Button>
                }
              />
              <CalculatePayrollDialog
                contracts={contracts}
                employeeMap={employeeMap}
                contractsByEmployee={contractsByEmployee}
                taxConstants={TAX_CONSTANTS}
                open={isCalculateDialogOpen}
                onOpenChange={setIsCalculateDialogOpen}
                trigger={
                  <Button variant="secondary" className="bg-card/10 hover:bg-card/20 text-white border-white/30 gap-2" data-testid="button-new-calculation">
                    <Plus className="h-4 w-4" />
                    {tFinance('newCalculation')}
                  </Button>
                }
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6 pt-6">
        <PayrollStatsCards
          activeContracts={kpiStats.activeContracts}
          pendingCalcs={kpiStats.pendingCalcs}
          approvedCalcs={kpiStats.approvedCalcs}
          totalGross={kpiStats.totalGross}
          contractsLoading={contractsLoading}
          calculationsLoading={calculationsLoading}
        />

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList>
                <TabsTrigger value="contracts" data-testid="tab-contracts">
                  <FileText className="h-4 w-4 mr-2" />
                  {tFinance('contracts')}
                </TabsTrigger>
                <TabsTrigger value="calculations" data-testid="tab-calculations">
                  <Calculator className="h-4 w-4 mr-2" />
                  {tFinance('calculations')}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="contracts" className="space-y-4">
                <ContractsTab contracts={contracts} employeeMap={employeeMap} loading={contractsLoading} />
              </TabsContent>
              <TabsContent value="calculations" className="space-y-4">
                <CalculationsTab
                  calculations={calculations}
                  employeeMap={employeeMap}
                  loading={calculationsLoading}
                  onNewCalculation={() => setIsCalculateDialogOpen(true)}
                />
              </TabsContent>
            </Tabs>
          </div>
          <TaxRulesSidebar taxRules={taxRules} taxRulesLoading={taxRulesLoading} minWage={TAX_CONSTANTS.MIN_WAGE} />
        </div>
      </div>

      {/* Maosh hisoblash davri dialog */}
      <Dialog open={isRunPayrollOpen} onOpenChange={setIsRunPayrollOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tLabel('payroll.runPayroll.title', "Maosh hisoblash")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="payroll-period">{tLabel('payroll.runPayroll.period', "Hisoblash davri (YYYY-MM)")}</Label>
              <Input
                id="payroll-period"
                type="month"
                value={payrollPeriod}
                onChange={(e) => setPayrollPeriod(e.target.value)}
                data-testid="input-payroll-period"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {tLabel('payroll.runPayroll.hint', "Belgilangan davr uchun barcha faol shartnomalar bo'yicha maosh hisoblanadi.")}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRunPayrollOpen(false)}>
              {tLabel('payroll.runPayroll.cancel', "Bekor")}
            </Button>
            <Button
              onClick={() => runPayrollMutation.mutate(payrollPeriod)}
              disabled={!payrollPeriod || runPayrollMutation.isPending}
              data-testid="button-confirm-run-payroll"
            >
              <Play className="h-4 w-4 mr-2" />
              {tLabel('payroll.runPayroll.confirm', "Hisoblashni boshlash")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
