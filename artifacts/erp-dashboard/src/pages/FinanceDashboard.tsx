/**
 * @module FinanceDashboard
 * @description React page component. Route-level UI.
 */

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useTranslation } from "@/lib/i18n";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Calculator, Users, BookOpen, PieChart, BarChart3 } from "lucide-react";
import {
  payrollPeriodSchema,
  type PayrollPeriodFormData,
  type DashboardStats,
  type PayrollPeriod,
  type PayrollRow,
  type Account,
  type TrialBalanceData,
  type ProfitLossData,
  type FpCycleData,
} from "./FinanceDashboardTypes";
import { DashboardOverviewTab } from "./FinanceDashboardTabs";
import { PayrollTab } from "./FinanceDashboardPayrollTab";
import { AccountsTab, ReportsTab } from "./FinanceDashboardTabsExtra";
import { EPErrorState, EPPageHeader, EPStatusPill } from "@/components/ep";

export default function FinanceDashboard() {
  const { t } = useTranslation('finance');
  const { t: tCommon } = useTranslation('common');
  const { toast } = useToast();
  const searchString = useSearch();
  const [, setLocation] = useLocation();

  // Parse URL tab parameter
  const getInitialTab = () => {
    const params = new URLSearchParams(searchString);
    const tab = params.get("tab");
    if (tab && ["dashboard", "payroll", "accounting", "reports"].includes(tab)) {
      return tab;
    }
    return "dashboard";
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const [newPeriodOpen, setNewPeriodOpen] = useState(false);

  const periodForm = useForm<PayrollPeriodFormData>({
    resolver: zodResolver(payrollPeriodSchema),
    defaultValues: { periodName: "", startDate: "", endDate: "" },
  });
  const [taxCalcOpen, setTaxCalcOpen] = useState(false);
  const [grossSalary, setGrossSalary] = useState("");

  // Sync tab with URL
  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const urlTab = params.get("tab");
    if (urlTab && ["dashboard", "payroll", "accounting", "reports"].includes(urlTab) && urlTab !== activeTab) {
      setActiveTab(urlTab);
    }
  }, [searchString]);

  // Queries
  const { data: sysSettings } = useQuery<{ inpsRate?: number; minWage?: number; qqsRate?: number }>({
    queryKey: ["/api/system-settings"],
  });

  const { data: dashboard, isLoading: dashboardLoading, isError, error: dashboardError, refetch: refetchDashboard } = useQuery<DashboardStats>({
    queryKey: ["/api/finance/dashboard"],
  });

  const { data: periods = [], isLoading: periodsLoading } = useQuery<PayrollPeriod[]>({
    queryKey: ["/api/payroll/periods"],
  });

  const { data: accounts = [] } = useQuery<Account[]>({
    queryKey: ["/api/gl/accounts"],
  });

  const { data: periodRows = [] } = useQuery<PayrollRow[]>({
    queryKey: ["/api/payroll/periods", selectedPeriod, "rows"],
    enabled: !!selectedPeriod,
  });

  const { data: trialBalance } = useQuery<TrialBalanceData>({
    queryKey: ["/api/reports/trial-balance"],
  });

  const { data: profitLoss } = useQuery<ProfitLossData>({
    queryKey: ["/api/reports/profit-loss"],
  });

  const { data: fpCycle } = useQuery<FpCycleData>({
    queryKey: ["/api/hr/fp-cycle"],
    refetchInterval: 60000,
  });

  // Mutations
  const createPeriodMutation = useMutation({
    mutationFn: async (data: PayrollPeriodFormData) => {
      return apiRequest("POST", "/api/payroll/periods", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payroll/periods"] });
      queryClient.invalidateQueries({ queryKey: ["/api/finance/dashboard"] });
      setNewPeriodOpen(false);
      periodForm.reset();
      toast({ title: tCommon('success'), description: tCommon('createdSuccessfully') });
    },
    onError: () => {
      toast({ title: tCommon('error'), description: tCommon('operationFailed'), variant: "destructive" });
    },
  });

  const calculatePayrollMutation = useMutation({
    mutationFn: async (periodId: string) => {
      return apiRequest("POST", `/api/payroll/periods/${periodId}/calculate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payroll/periods"] });
      queryClient.invalidateQueries({ queryKey: ["/api/finance/dashboard"] });
      toast({ title: tCommon('success'), description: tCommon('savedSuccessfully') });
    },
    onError: () => {
      toast({ title: tCommon('error'), description: tCommon('operationFailed'), variant: "destructive" });
    },
  });

  const closePeriodMutation = useMutation({
    mutationFn: async (periodId: string) => {
      return apiRequest("POST", `/api/payroll/periods/${periodId}/close`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payroll/periods"] });
      queryClient.invalidateQueries({ queryKey: ["/api/finance/dashboard"] });
      toast({ title: tCommon('success'), description: t('periodClosed') });
    },
    onError: () => {
      toast({ title: tCommon('error'), description: tCommon('operationFailed'), variant: "destructive" });
    },
  });

  const seedAccountsMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/gl/seed-accounts");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gl/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/finance/dashboard"] });
      toast({ title: tCommon('success'), description: tCommon('createdSuccessfully') });
    },
    onError: () => {
      toast({ title: tCommon('error'), description: tCommon('operationFailed'), variant: "destructive" });
    },
  });

  const calculateTaxMutation = useMutation({
    mutationFn: async (grossSalary: number) => {
      return apiRequest("POST", "/api/payroll/calculate-tax", { grossSalary });
    },
  });

  const handleCreatePeriod = (values: PayrollPeriodFormData) => {
    createPeriodMutation.mutate(values);
  };

  const handleCalculateTax = () => {
    const amount = parseFloat(grossSalary);
    if (!isNaN(amount) && amount > 0) {
      calculateTaxMutation.mutate(amount);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge className="bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-semibold">{t('periodOpen')}</Badge>;
      case "processing":
        return <Badge className="bg-amber-100 text-amber-800 rounded-full px-2.5 py-0.5 text-xs font-semibold">{tCommon('inProgress')}</Badge>;
      case "closed":
        return <EPStatusPill tone="success">{t('periodClosed')}</EPStatusPill>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (dashboardError) {
    return (
      <div className="flex flex-col h-full p-5 lg:p-6 gap-5" data-testid="finance-dashboard">
        <EPErrorState onRetry={refetchDashboard} />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="finance-dashboard">
      <div className="flex items-center justify-between mb-8">
        <div>
          <EPPageHeader
        breadcrumb={<>{t("dashboard9")}<b className="text-foreground">Moliya {t('dashboard1')}</b></>}
        title="Moliya {t('dashboard1')}"
      />
          <p className="text-muted-foreground mt-1">{t('financialReport')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={taxCalcOpen} onOpenChange={setTaxCalcOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-tax-calc">
                <Calculator className="h-4 w-4 mr-2" />
                {t('tax')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-[18px] font-semibold">{t('tax')}</DialogTitle>
                <DialogDescription>
                  {t('taxRules')}: INPS 12%, JSHD 12%
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>{t('grossSalary')} (UZS)</Label>
                  <Input
                    type="number"
                    value={grossSalary}
                    onChange={(e) => setGrossSalary(e.target.value)}
                    placeholder="10000000"
                    data-testid="input-gross-salary"
                  />
                </div>
                <Button onClick={handleCalculateTax} disabled={calculateTaxMutation.isPending} data-testid="button-calculate-tax">
                  {t('payrollCalculation')}
                </Button>
                {calculateTaxMutation.data && (
                  <div className="p-4 bg-muted rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span>{t('grossSalary')}:</span>
                      <span className="font-medium">{formatCurrency(calculateTaxMutation.data.grossSalary)}</span>
                    </div>
                    <div className="flex justify-between text-[var(--ep-red)]">
                      <span>INPS (12%):</span>
                      <span>-{formatCurrency(calculateTaxMutation.data.inpsAmount)}</span>
                    </div>
                    <div className="flex justify-between text-[var(--ep-red)]">
                      <span>JSHD (12%):</span>
                      <span>-{formatCurrency(calculateTaxMutation.data.jshdAmount)}</span>
                    </div>
                    <hr />
                    <div className="flex justify-between font-bold text-[var(--ep-green)]">
                      <span>{t('netSalary')}:</span>
                      <span>{formatCurrency(calculateTaxMutation.data.netSalary)}</span>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="dashboard" data-testid="tab-dashboard">
              <PieChart className="h-4 w-4 mr-2" />
              {tCommon('dashboard')}
            </TabsTrigger>
            <TabsTrigger value="payroll" data-testid="tab-payroll">
              <Users className="h-4 w-4 mr-2" />
              {t('payrollCalculation')}
            </TabsTrigger>
            <TabsTrigger value="accounts" data-testid="tab-accounts">
              <BookOpen className="h-4 w-4 mr-2" />
              {t('chartOfAccounts')}
            </TabsTrigger>
            <TabsTrigger value="reports" data-testid="tab-reports">
              <BarChart3 className="h-4 w-4 mr-2" />
              {tCommon('reports')}
            </TabsTrigger>
          </TabsList>

          <DashboardOverviewTab
            dashboard={dashboard}
            fpCycle={fpCycle}
            sysSettings={sysSettings}
            onSeedAccounts={() => seedAccountsMutation.mutate()}
            isSeedingAccounts={seedAccountsMutation.isPending}
          />

          <PayrollTab
            periods={Array.isArray(periods) ? periods : []}
            periodsLoading={periodsLoading}
            periodRows={Array.isArray(periodRows) ? periodRows : []}
            selectedPeriod={selectedPeriod}
            newPeriodOpen={newPeriodOpen}
            periodForm={periodForm}
            isCreatingPeriod={createPeriodMutation.isPending}
            isCalculatingPayroll={calculatePayrollMutation.isPending}
            isClosingPeriod={closePeriodMutation.isPending}
            onSetNewPeriodOpen={setNewPeriodOpen}
            onCreatePeriod={handleCreatePeriod}
            onCalculatePayroll={(id) => calculatePayrollMutation.mutate(id)}
            onClosePeriod={(id) => closePeriodMutation.mutate(id)}
            onSelectPeriod={setSelectedPeriod}
            getStatusBadge={getStatusBadge}
          />

          <AccountsTab
            accounts={Array.isArray(accounts) ? accounts : []}
            onSeedAccounts={() => seedAccountsMutation.mutate()}
            isSeedingAccounts={seedAccountsMutation.isPending}
          />

          <ReportsTab
            trialBalance={trialBalance}
            profitLoss={profitLoss}
          />
        </Tabs>
      </div>
    </div>
  );
}
