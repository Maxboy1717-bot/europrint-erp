import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import { ErrorState } from "@/components/ui/error-state";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useTranslation } from "@/lib/i18n";
import { formatDate, formatCurrency } from "@/lib/format";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Calculator, 
  FileText, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Calendar,
  Plus,
  Play,
  CheckCircle,
  Lock,
  RefreshCw,
  Download,
  BookOpen,
  PieChart,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Banknote,
  Building2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

interface PayrollPeriod {
  id: string;
  periodName: string;
  startDate: string;
  endDate: string;
  status: string;
  totalAmount: number | null;
  createdAt: string;
}

interface PayrollRow {
  id: string;
  periodId: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  departmentId: string;
  workDays: number;
  baseSalary: number;
  bonuses: number;
  deductions: number;
  totalSalary: number;
  notes: string;
}

interface Account {
  id: string;
  accountCode: string;
  accountName: string;
  accountNameRu: string;
  accountType: string;
  isActive: boolean;
}

interface DashboardStats {
  payroll: {
    totalPeriods: number;
    openPeriods: number;
    closedPeriods: number;
    totalPaid: number;
  };
  gl: {
    totalDocuments: number;
    postedDocuments: number;
    draftDocuments: number;
  };
  accounts: {
    totalAccounts: number;
    assetAccounts: number;
    liabilityAccounts: number;
    equityAccounts: number;
    revenueAccounts: number;
    expenseAccounts: number;
  };
  receivables: number;
  payables: number;
  taxConstants: {
    INPS_RATE: number;
    JSHD_RATE: number;
    MIN_WAGE: number;
  };
}

interface TrialBalanceData {
  asOfDate?: string;
  accounts?: { accountCode: string; accountName: string; debitBalance: number; creditBalance: number }[];
  totals?: { debitBalance?: number; creditBalance?: number };
}
interface ProfitLossData {
  period?: { startDate: string; endDate: string };
  revenues?: { accountName: string; amount: number }[];
  expenses?: { accountName: string; amount: number }[];
  totalRevenue?: number;
  totalExpense?: number;
  netProfit?: number;
}

const payrollPeriodSchema = z.object({
  periodName: z.string().min(1, "Davr nomi majburiy"),
  startDate: z.string().min(1, "Boshlanish sanasi majburiy"),
  endDate: z.string().min(1, "Tugash sanasi majburiy"),
});

type PayrollPeriodFormData = z.infer<typeof payrollPeriodSchema>;

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

  const { data: dashboard, isLoading: dashboardLoading, isError: dashboardError, refetch: refetchDashboard } = useQuery<DashboardStats>({
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

  const { data: fpCycle } = useQuery<{
    currentDay: number;
    activeCycle: { day: number; key: string; label: string; labelRu: string; event: string; color: string } | null;
    weekStart: string;
    cycleDays: Array<{ day: number; key: string; label: string; labelRu: string; event: string; color: string }>;
    pending: number;
    approvedTotal: number;
  }>({
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
        return <Badge className="bg-primary-container text-on-primary-container rounded-full px-2.5 py-0.5 text-xs font-semibold">{t('periodOpen')}</Badge>;
      case "processing":
        return <Badge className="bg-amber-100 text-amber-800 rounded-full px-2.5 py-0.5 text-xs font-semibold">{tCommon('inProgress')}</Badge>;
      case "closed":
        return <Badge className="bg-green-100 text-green-800 rounded-full px-2.5 py-0.5 text-xs font-semibold">{t('periodClosed')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (dashboardError) {
    return (
      <div className="min-h-screen bg-background p-6" data-testid="finance-dashboard">
        <ErrorState onRetry={refetchDashboard} />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-surface p-6" data-testid="finance-dashboard">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-light tracking-tight text-on-surface">
            Moliya <span className="font-bold text-primary">Dashboard</span>
          </h1>
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
                <DialogTitle>{t('tax')}</DialogTitle>
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
                    <div className="flex justify-between text-red-600">
                      <span>INPS (12%):</span>
                      <span>-{formatCurrency(calculateTaxMutation.data.inpsAmount)}</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>JSHD (12%):</span>
                      <span>-{formatCurrency(calculateTaxMutation.data.jshdAmount)}</span>
                    </div>
                    <hr />
                    <div className="flex justify-between font-bold text-green-600">
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

          {/* Dashboard Tab */}
          <TabsContent value="dashboard">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
              <div className="bg-surface-container-lowest rounded-lg p-5" data-testid="card-payroll-stats">
                <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{t('fiscalPeriod')}</p>
                <p className="text-4xl font-bold tracking-tight text-on-surface mt-1">{dashboard?.payroll?.totalPeriods || 0}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {dashboard?.payroll?.openPeriods || 0} {t('periodOpen')}, {dashboard?.payroll?.closedPeriods || 0} {t('periodClosed')}
                </p>
              </div>

              <div className="bg-surface-container-lowest rounded-lg p-5" data-testid="card-total-paid">
                <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{t('paid')}</p>
                <p className="text-4xl font-bold tracking-tight text-on-surface mt-1">{formatCurrency(dashboard?.payroll?.totalPaid || 0)}</p>
                <p className="text-xs text-muted-foreground mt-2">{t('periodClosed')}</p>
              </div>

              <div className="bg-surface-container-lowest rounded-lg p-5" data-testid="card-receivables">
                <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{t('accountsReceivable')}</p>
                <p className="text-4xl font-bold tracking-tight text-green-600 mt-1">{formatCurrency(dashboard?.receivables || 0)}</p>
                <p className="text-xs text-muted-foreground mt-2">{t('unpaid')}</p>
              </div>

              <div className="bg-surface-container-lowest rounded-lg p-5" data-testid="card-payables">
                <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{t('accountsPayable')}</p>
                <p className="text-4xl font-bold tracking-tight text-red-600 mt-1">{formatCurrency(dashboard?.payables || 0)}</p>
                <p className="text-xs text-muted-foreground mt-2">{t('unpaid')}</p>
              </div>
            </div>

            {/* ZvsWidget — ФП Tsikl Progress */}
            <div className="bg-surface-container-lowest rounded-xl p-5 mb-6" data-testid="zvs-widget">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold flex items-center gap-2">
                    <Banknote className="w-4 h-4 text-primary" />
                    ФП Tsikl — Haftalik Moliyaviy Reja
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Hafta: {fpCycle?.weekStart || "—"} · Kutayotgan ЗВС: <span className="font-semibold text-amber-600">{fpCycle?.pending ?? 0}</span>
                  </p>
                </div>
                <Link to="/coordination">
                  <button className="text-xs text-primary underline underline-offset-2 hover:opacity-70 transition-opacity">
                    Tasdiqlash navbati →
                  </button>
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(fpCycle?.cycleDays ?? [
                  { day: 2, label: "Seshanba",   event: "ЗВС — Рек.Совет",  color: "emerald" },
                  { day: 3, label: "Chorshanba", event: "ФП — Moliyaviy reja", color: "blue" },
                  { day: 4, label: "Payshanba",  event: "Bank to'lovlari",  color: "amber" },
                  { day: 1, label: "Dushanba",   event: "Naqd to'lovlar",   color: "rose" },
                ]).map((step: { day: number; key: string; label: string; labelRu?: string; event: string; color: string }) => {
                  const isActive = fpCycle?.currentDay === step.day;
                  const colorMap: Record<string, string> = {
                    emerald: "border-emerald-300 bg-emerald-50 text-emerald-800",
                    blue:    "border-blue-300 bg-blue-50 text-blue-800",
                    amber:   "border-amber-300 bg-amber-50 text-amber-800",
                    rose:    "border-rose-300 bg-rose-50 text-rose-800",
                  };
                  const activeCls = colorMap[step.color] ?? "border-muted bg-muted text-muted-foreground";
                  const inactiveCls = "border-border bg-surface text-muted-foreground";
                  return (
                    <div
                      key={step.day}
                      className={cn(
                        "rounded-xl border-2 p-3 flex flex-col gap-1 transition-all",
                        isActive ? activeCls : inactiveCls
                      )}
                    >
                      <div className="flex items-center gap-1.5">
                        {isActive && <span className="w-2 h-2 rounded-full bg-current shrink-0 animate-pulse" />}
                        <span className="text-xs font-bold">{step.label}</span>
                      </div>
                      <p className="text-[11px] leading-snug opacity-80">{step.event}</p>
                      {isActive && (
                        <span className="text-[10px] font-semibold bg-current/10 rounded px-1.5 py-0.5 mt-1 w-fit">
                          Faol
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              {(fpCycle?.pending ?? 0) > 0 && (
                <div className="mt-3 flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <p className="text-xs text-amber-800">
                    <span className="font-semibold">{fpCycle?.pending} ta ЗВС ariza</span> tasdiqlashni kutmoqda
                    {fpCycle?.approvedTotal ? ` · Tasdiqlangan: ${Number(fpCycle.approvedTotal).toLocaleString()} UZS` : ""}
                  </p>
                </div>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="bg-surface-container-lowest rounded-xl p-6">
                <div className="flex flex-col gap-1 mb-4">
                  <h3 className="text-lg font-semibold">{t('accountType')}</h3>
                  <p className="text-sm text-muted-foreground">{t('chartOfAccounts')}</p>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">{t('asset')}</span>
                    <Badge variant="outline">{dashboard?.accounts?.assetAccounts || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">{t('liability')}</span>
                    <Badge variant="outline">{dashboard?.accounts?.liabilityAccounts || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">{t('equity')}</span>
                    <Badge variant="outline">{dashboard?.accounts?.equityAccounts || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">{t('revenue')}</span>
                    <Badge variant="outline">{dashboard?.accounts?.revenueAccounts || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">{t('expenses')}</span>
                    <Badge variant="outline">{dashboard?.accounts?.expenseAccounts || 0}</Badge>
                  </div>
                  <hr />
                  <div className="flex justify-between items-center font-medium">
                    <span>{tCommon('total')}</span>
                    <Badge>{dashboard?.accounts?.totalAccounts || 0}</Badge>
                  </div>
                </div>
                {(dashboard?.accounts?.totalAccounts || 0) === 0 && (
                  <Button 
                    className="w-full mt-4" 
                    onClick={() => seedAccountsMutation.mutate()}
                    disabled={seedAccountsMutation.isPending}
                    data-testid="button-seed-accounts"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {tCommon('create')}
                  </Button>
                )}
              </div>

              <div className="bg-surface-container-lowest rounded-xl p-6">
                <div className="flex flex-col gap-1 mb-4">
                  <h3 className="text-lg font-semibold">{t('taxRules')}</h3>
                  <p className="text-sm text-muted-foreground">{t('taxReport')}</p>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">INPS</p>
                      <p className="text-sm text-muted-foreground">{t('pensionFund')}</p>
                    </div>
                    <span className="text-2xl font-bold text-blue-600">12%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">JSHD</p>
                      <p className="text-sm text-muted-foreground">{t('incomeTax')}</p>
                    </div>
                    <span className="text-2xl font-bold text-blue-600">12%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">{t('minimumWage')}</p>
                      <p className="text-sm text-muted-foreground">{t('fiscalYear')}</p>
                    </div>
                    <span className="text-lg font-bold">{formatCurrency(dashboard?.taxConstants?.MIN_WAGE || sysSettings?.minWage || 1120000)}</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Payroll Tab */}
          <TabsContent value="payroll">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{t('fiscalPeriod')}</h2>
              <Dialog open={newPeriodOpen} onOpenChange={setNewPeriodOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-new-period">
                    <Plus className="h-4 w-4 mr-2" />
                    {tCommon('create')}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={periodForm.handleSubmit(handleCreatePeriod)}>
                    <DialogHeader>
                      <DialogTitle>{t('fiscalPeriod')}</DialogTitle>
                      <DialogDescription>{t('payrollCalculation')}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label htmlFor="periodName">{t('period')}</Label>
                        <Input id="periodName" {...periodForm.register("periodName")} placeholder="Yanvar 2024" data-testid="input-period-name" />
                        {periodForm.formState.errors.periodName && (
                          <p className="text-sm text-destructive mt-1">{periodForm.formState.errors.periodName.message}</p>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
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
                      <Button type="submit" disabled={createPeriodMutation.isPending} data-testid="button-submit-period">
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
                              onClick={() => calculatePayrollMutation.mutate(period.id)}
                              disabled={calculatePayrollMutation.isPending}
                              data-testid={`button-calculate-${period.id}`}
                            >
                              <RefreshCw className="h-4 w-4 mr-2" />
                              {t('payrollCalculation')}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => closePeriodMutation.mutate(period.id)}
                              disabled={closePeriodMutation.isPending}
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
                          onClick={() => setSelectedPeriod(selectedPeriod === period.id ? null : period.id)}
                          data-testid={`button-view-${period.id}`}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          {selectedPeriod === period.id ? tCommon('close') : tCommon('view')}
                        </Button>
                      </div>
                    </CardHeader>
                    {period.totalAmount && (
                      <CardContent>
                        <div className="text-2xl font-bold text-green-600">{formatCurrency(period.totalAmount)}</div>
                        <p className="text-sm text-muted-foreground">{t('totalGross')}</p>
                      </CardContent>
                    )}
                    {selectedPeriod === period.id && (
                      <CardContent>
                        <Table data-testid={`table-rows-${period.id}`}>
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
                              <TableRow key={row.id}>
                                <TableCell className="font-medium">{row.employeeName || row.employeeId}</TableCell>
                                <TableCell>{row.departmentId || "-"}</TableCell>
                                <TableCell className="text-right">{row.workDays}</TableCell>
                                <TableCell className="text-right">{formatCurrency(row.baseSalary)}</TableCell>
                                <TableCell className="text-right text-green-600">+{formatCurrency(row.bonuses)}</TableCell>
                                <TableCell className="text-right text-red-600">-{formatCurrency(row.deductions)}</TableCell>
                                <TableCell className="text-right font-bold">{formatCurrency(row.totalSalary)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    )}
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Accounts Tab */}
          <TabsContent value="accounts">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{t('chartOfAccounts')}</h2>
              {accounts.length === 0 && (
                <Button 
                  onClick={() => seedAccountsMutation.mutate()}
                  disabled={seedAccountsMutation.isPending}
                  data-testid="button-seed-accounts-tab"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {tCommon('create')}
                </Button>
              )}
            </div>

            <Card>
              <Table data-testid="table-accounts">
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('accountCode')}</TableHead>
                    <TableHead>{t('accountName')}</TableHead>
                    <TableHead>{t('accountName')}</TableHead>
                    <TableHead>{t('accountType')}</TableHead>
                    <TableHead>{tCommon('status')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        {tCommon('noData')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    (Array.isArray(accounts) ? accounts : []).map((account) => (
                      <TableRow key={account.id}>
                        <TableCell className="font-mono font-bold">{account.accountCode}</TableCell>
                        <TableCell>{account.accountName}</TableCell>
                        <TableCell className="text-muted-foreground">{account.accountNameRu}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={
                            account.accountType === "asset" ? "bg-blue-50 text-blue-700" :
                            account.accountType === "liability" ? "bg-red-50 text-red-700" :
                            account.accountType === "equity" ? "bg-purple-50 text-purple-700" :
                            account.accountType === "revenue" ? "bg-green-50 text-green-700" :
                            "bg-orange-50 text-orange-700"
                          }>
                            {account.accountType === "asset" ? t('asset') :
                             account.accountType === "liability" ? t('liability') :
                             account.accountType === "equity" ? t('equity') :
                             account.accountType === "revenue" ? t('revenue') : t('expenses')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {account.isActive ? (
                            <Badge className="bg-green-100 text-green-700">{tCommon('active')}</Badge>
                          ) : (
                            <Badge variant="secondary">{tCommon('inactive')}</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {t('balanceSheet')}
                  </CardTitle>
                  <CardDescription>
                    {trialBalance?.asOfDate ? `${tCommon('date')}: ${formatDate(trialBalance.asOfDate)}` : tCommon('all')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {(trialBalance?.accounts?.length ?? 0) > 0 ? (
                    <div className="space-y-2 max-h-96 overflow-auto">
                      {trialBalance?.accounts?.map((acc: { accountCode: string; accountName: string; debitBalance: number; creditBalance: number }, idx: number) => (
                        <div key={idx} className="flex justify-between text-sm border-b pb-1">
                          <span className="font-mono">{acc.accountCode}</span>
                          <span className="flex-1 ml-2 truncate">{acc.accountName}</span>
                          <span className="text-green-600 w-24 text-right">{acc.debitBalance > 0 ? formatCurrency(acc.debitBalance) : "-"}</span>
                          <span className="text-red-600 w-24 text-right">{acc.creditBalance > 0 ? formatCurrency(acc.creditBalance) : "-"}</span>
                        </div>
                      ))}
                      <div className="flex justify-between font-bold pt-2 border-t-2">
                        <span>{tCommon('total')}</span>
                        <span className="text-green-600 w-24 text-right">{formatCurrency(trialBalance?.totals?.debitBalance || 0)}</span>
                        <span className="text-red-600 w-24 text-right">{formatCurrency(trialBalance?.totals?.creditBalance || 0)}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-4">{tCommon('noData')}</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    {t('incomeStatement')}
                  </CardTitle>
                  <CardDescription>
                    {profitLoss?.period ? `${formatDate(profitLoss.period.startDate)} - ${formatDate(profitLoss.period.endDate)}` : t('fiscalYear')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">{t('revenue')}</p>
                      {(profitLoss?.revenues?.length ?? 0) > 0 ? (
                        profitLoss?.revenues?.map((rev: { accountName: string; amount: number }, idx: number) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span>{rev.accountName}</span>
                            <span className="text-green-600">{formatCurrency(rev.amount)}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">-</p>
                      )}
                      <div className="flex justify-between font-medium pt-1 border-t mt-2">
                        <span>{t('revenue')}</span>
                        <span className="text-green-600">{formatCurrency(profitLoss?.totalRevenue || 0)}</span>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-2">{t('expenses')}</p>
                      {(profitLoss?.expenses?.length ?? 0) > 0 ? (
                        profitLoss?.expenses?.map((exp: { accountName: string; amount: number }, idx: number) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span>{exp.accountName}</span>
                            <span className="text-red-600">{formatCurrency(exp.amount)}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">-</p>
                      )}
                      <div className="flex justify-between font-medium pt-1 border-t mt-2">
                        <span>{t('expenses')}</span>
                        <span className="text-red-600">{formatCurrency(profitLoss?.totalExpense || 0)}</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-muted">
                      <div className="flex justify-between text-lg font-bold">
                        <span>{t('profit')}</span>
                        <span className={(profitLoss?.netProfit || 0) >= 0 ? "text-green-600" : "text-red-600"}>
                          {formatCurrency(profitLoss?.netProfit || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
