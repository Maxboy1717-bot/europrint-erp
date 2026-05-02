import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { formatCurrency } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  TrendingUp, 
  CreditCard,
  FileText,
  PieChart,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { ErrorState } from "@/components/ui/error-state";
import { ErpRoadmapCard } from "./accountant/ErpRoadmapCard";
import { AuditConsole } from "./accountant/AuditConsole";

interface RoleDashboardWidget {
  id: string;
  widgetCode: string;
  widgetName: string;
  widgetType: string;
}

interface KpiWithValue {
  id: string;
  kpiCode: string;
  kpiName: string;
  category: string;
  targetValue: number;
  warningThreshold: number;
  criticalThreshold: number;
  unit: string;
  currentValue: number;
}

interface FinancialSummaryItem {
  title: string;
  value: string;
  rawValue: number;
  change: string;
  trend: string;
  description: string;
}

interface BudgetItem {
  code: string;
  name: string;
  allocated: number;
  used: number;
}

interface PendingPayment {
  id: string;
  vendor: string;
  amount: number;
  dueDate: string;
  status: string;
}

const summaryIcons = [ArrowDownRight, ArrowUpRight, PieChart, Clock];
const summaryColors = [
  { color: "text-green-500", bgColor: "bg-green-500/10" },
  { color: "text-red-500", bgColor: "bg-red-500/10" },
  { color: "text-blue-500", bgColor: "bg-blue-500/10" },
  { color: "text-orange-500", bgColor: "bg-orange-500/10" }
];

export default function AccountantView() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8,Sana,Foydalanuvchi,Amal,Jadval,Hujjat\n";
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `audit_log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "CSV eksport", description: "Audit loglar CSV formatda yuklandi" });
  };

  const handleExportExcel = () => {
    const csvContent = "data:text/csv;charset=utf-8,Sana,Foydalanuvchi,Amal,Jadval,Hujjat\n";
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `audit_log_${new Date().toISOString().slice(0, 10)}.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Excel eksport", description: "Audit loglar Excel formatda yuklandi" });
  };

  const handleExportPDF = () => {
    window.print();
    toast({ title: "PDF hisobot", description: "PDF hisobot tayyorlanmoqda" });
  };

  const { data: widgets = [], isError, refetch} = useQuery<RoleDashboardWidget[]>({
    queryKey: ["/api/europrint-control/dashboard/accountant"],
  });

  const { data: kpis = [], isLoading: kpisLoading } = useQuery<KpiWithValue[]>({
    queryKey: ["/api/europrint-control/accountant/kpi-values"],
  });

  const { data: financialSummary = [], isLoading: summaryLoading } = useQuery<FinancialSummaryItem[]>({
    queryKey: ["/api/europrint-control/accountant/financial-summary"],
  });

  const { data: budgets = [], isLoading: budgetsLoading } = useQuery<BudgetItem[]>({
    queryKey: ["/api/europrint-control/accountant/budgets"],
  });

  const { data: pendingPayments = [], isLoading: paymentsLoading } = useQuery<PendingPayment[]>({
    queryKey: ["/api/europrint-control/accountant/pending-payments"],
  });


  if (isError) {
    return <ErrorState onRetry={refetch} />;
  }

  return (
    <div className="p-6 space-y-8 bg-surface min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-light tracking-tight text-on-surface">
            Buxgalter <span className="font-bold text-primary">Ko'rinishi</span>
          </h1>
          <p className="text-on-surface-variant mt-2">
            Byudjet nazorati va to'lovlar boshqaruvi
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="bg-surface-container text-on-surface rounded-lg px-4 py-2 text-sm font-medium hover:bg-surface-container-high border-none gap-2" onClick={() => { window.print(); toast({ title: "Hisobot", description: "Hisobot tayyorlanmoqda" }); }} data-testid="button-report">
            <FileText className="h-4 w-4" />
            Hisobot
          </Button>
          <Button className="bg-gradient-to-br from-primary to-primary-dim text-white rounded-lg px-5 py-2.5 text-sm font-semibold gap-2" onClick={() => setLocation("/income-expense")} data-testid="button-enter-payment">
            <CreditCard className="h-4 w-4" />
            To'lov Kiritish
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryLoading ? (
          <>
            {([1, 2, 3, 4]).map((i) => (
              <div key={`k-${i}`} className="bg-surface-container-lowest rounded-lg p-6 animate-pulse h-32" />
            ))}
          </>
        ) : (
          (Array.isArray(financialSummary) ? financialSummary : []).map((item, index) => {
            const Icon = summaryIcons[index] || Clock;
            const colors = summaryColors[index] || summaryColors[0];
            return (
              <div key={`k-${index}`} className="bg-surface-container-lowest rounded-lg p-6" data-testid={`finance-card-${index}`}>
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-lg ${colors.bgColor}`}>
                    <Icon className={`h-6 w-6 ${colors.color}`} />
                  </div>
                  <Badge className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold border-none",
                    item.trend === "down" ? "bg-green-100 text-green-800" : item.trend === "up" ? "bg-red-100 text-red-800" : "bg-surface-container text-on-surface"
                  )}>
                    {item.change}
                  </Badge>
                </div>
                <div className="mt-4">
                  <p className="text-3xl font-bold text-on-surface tracking-tight">{item.value}</p>
                  <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mt-1">{item.title}</p>
                  <p className="text-[10px] text-on-surface-variant mt-2 leading-tight">{item.description}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface-container-lowest rounded-xl p-6">
          <h3 className="text-lg font-bold text-on-surface mb-6 flex items-center gap-2">
            <PieChart className="h-5 w-5 text-primary" />
            Byudjet Nazorati
          </h3>
          <div className="space-y-6">
            {budgetsLoading ? (
              <div className="space-y-4">
                {([1, 2, 3, 4, 5]).map((i) => (
                  <div key={`k-${i}`} className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-2 w-full" />
                  </div>
                ))}
              </div>
            ) : (
              (Array.isArray(budgets) ? budgets : []).map((budget) => {
                const percentage = Math.round((budget.used / (budget.allocated || 1)) * 100);
                const isOverBudget = percentage > 90;
                const isWarning = percentage > 75 && percentage <= 90;
                
                return (
                  <div key={budget.code} className="space-y-3" data-testid={`budget-${budget.code}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-on-surface">{budget.name}</span>
                      <div className="flex items-center gap-2">
                        {isOverBudget && <AlertTriangle className="h-4 w-4 text-red-500" />}
                        <span className={`text-sm font-bold ${
                          isOverBudget ? "text-red-600" : isWarning ? "text-amber-600" : "text-green-600"
                        }`}>
                          {percentage}%
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-surface-container rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all",
                          isOverBudget ? "bg-red-500" : isWarning ? "bg-amber-500" : "bg-primary"
                        )}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                      <span>Sarflangan: {formatCurrency(budget.used)}</span>
                      <span>Qoldi: {formatCurrency(budget.allocated - budget.used)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-6">
          <h3 className="text-lg font-bold text-on-surface mb-6 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Kutilayotgan To'lovlar
          </h3>
          <div className="space-y-3">
            {paymentsLoading ? (
              <div className="space-y-3">
                {([1, 2, 3, 4]).map((i) => (
                  <div key={`k-${i}`} className="h-16 bg-surface rounded-lg animate-pulse" />
                ))}
              </div>
            ) : pendingPayments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-on-surface-variant" data-testid="empty-pending-payments">
                <CreditCard className="h-12 w-12 mb-4" />
                <p className="text-lg font-bold text-on-surface">Kutilayotgan to'lovlar yo'q</p>
                <p className="text-sm">Hozircha hech qanday to'lov kutilmayapti</p>
              </div>
            ) : (
              (Array.isArray(pendingPayments) ? pendingPayments : []).map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-4 bg-surface rounded-lg hover:bg-surface-container-low transition-colors" data-testid={`payment-${payment.id}`}>
                  <div>
                    <p className="font-bold text-on-surface">{payment.vendor}</p>
                    <div className="flex items-center gap-1 text-[10px] text-on-surface-variant mt-1">
                      <Clock className="h-3 w-3" />
                      Muddat: {new Date(payment.dueDate).toLocaleDateString("uz-UZ")}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-on-surface">{formatCurrency(payment.amount)}</p>
                    <Badge className={cn("mt-2 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border-none",
                      payment.status === "urgent" ? "bg-red-100 text-red-800" : 
                      payment.status === "pending" ? "bg-amber-100 text-amber-800" : "bg-primary-container text-on-primary-container"
                    )}>
                      {payment.status === "urgent" ? "Shoshilinch" : 
                       payment.status === "pending" ? "Kutilmoqda" : "Rejalashtirilgan"}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
          <Button variant="outline" className="w-full mt-6 bg-surface-container text-on-surface rounded-lg py-2 text-sm font-medium hover:bg-surface-container-high border-none" onClick={() => setLocation("/income-expense")} data-testid="button-view-all-payments">
            Barcha to'lovlarni ko'rish
          </Button>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl p-6">
        <h3 className="text-lg font-bold text-on-surface mb-6 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Moliyaviy KPI
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpisLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={`k-${i}`} className="h-24 bg-surface rounded-lg animate-pulse" />
            ))
          ) : (
            (Array.isArray(kpis) ? kpis : []).map((kpi) => {
              const isGood = kpi.kpiCode === "RECEIVABLES_DAYS" ? kpi.currentValue < kpi.targetValue :
                            kpi.kpiCode === "BUDGET_USAGE" ? kpi.currentValue < kpi.warningThreshold : 
                            kpi.currentValue >= kpi.targetValue;
              
              return (
                <div key={kpi.id} className="p-5 bg-surface rounded-lg" data-testid={`finance-kpi-${kpi.kpiCode}`}>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{kpi.kpiName}</span>
                    {isGood ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                    )}
                  </div>
                  <p className="text-3xl font-bold text-on-surface tracking-tight">{kpi.currentValue} {kpi.unit}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant mt-3">
                    Maqsad: {kpi.targetValue} {kpi.unit}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>

      <ErpRoadmapCard />

      <AuditConsole onExportCSV={handleExportCSV} onExportExcel={handleExportExcel} onExportPDF={handleExportPDF} />
    </div>
  );
}