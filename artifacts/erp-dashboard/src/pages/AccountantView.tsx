/**
 * @module AccountantView
 * @description React page component. Route-level UI.
 */

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
import { ErpRoadmapCard } from "./accountant/ErpRoadmapCard";
import { AuditConsole } from "./accountant/AuditConsole";
import { EPErrorState, EPPageHeader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

import { tLabel } from "@/lib/i18n/tLabel";
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
  { color: "text-[var(--ep-green)]", bgColor: "bg-green-500/10" },
  { color: "text-[var(--ep-red)]", bgColor: "bg-red-500/10" },
  { color: "text-[var(--ep-blue)]", bgColor: "bg-blue-500/10" },
  { color: "text-[var(--ep-primary)]", bgColor: "bg-orange-500/10" }
];

export default function AccountantView() {
  const { t } = useTranslation("common");
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
    toast({ title: tLabel('common.csvEksport', "CSV eksport"), description: tLabel('common.auditLoglarCsvFormatdaYuklandi', "Audit loglar CSV formatda yuklandi") });
  };

  const handleExportExcel = () => {
    const csvContent = "data:text/csv;charset=utf-8,Sana,Foydalanuvchi,Amal,Jadval,Hujjat\n";
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `audit_log_${new Date().toISOString().slice(0, 10)}.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: tLabel('common.excelEksport', "Excel eksport"), description: tLabel('common.auditLoglarExcelFormatdaYuklandi', "Audit loglar Excel formatda yuklandi") });
  };

  const handleExportPDF = () => {
    window.print();
    toast({ title: tLabel('common.pdfHisobot2', "PDF hisobot"), description: tLabel('common.pdfHisobotTayyorlanmoqda', "PDF hisobot tayyorlanmoqda") });
  };

  const { data: widgets = [], isError, error, refetch} = useQuery<RoleDashboardWidget[]>({
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
    return <EPErrorState onRetry={refetch}  error={error} />;
  }

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-8">
      <div className="flex items-center justify-between">
        <div>
          <EPPageHeader
        breadcrumb={<>{t("dashboard9")}<b className="text-foreground">{t("buxgalterKorinishi")}</b></>}
        title={t("buxgalterKorinishi")}
        subtitle={t("byudjetNazoratiVaTolovlarBoshqaruvi")}
      />
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="bg-muted/60 text-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-muted border-none gap-2" onClick={() => { window.print(); toast({ title: "Hisobot", description: tLabel('common.hisobotTayyorlanmoqda', "Hisobot tayyorlanmoqda") }); }} data-testid="button-report">
            <FileText className="h-4 w-4" />
            {t("report")}
          </Button>
          <Button className="bg-primary text-white rounded-lg px-5 py-2.5 text-sm font-semibold gap-2" onClick={() => setLocation("/income-expense")} data-testid="button-enter-payment">
            <CreditCard className="h-4 w-4" />
            {t("tolovKiritish1")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryLoading ? (
          <>
            {([1, 2, 3, 4]).map((i) => (
              <div key={`k-${i}`} className="bg-card rounded-lg p-6 animate-pulse h-32" />
            ))}
          </>
        ) : (
          (Array.isArray(financialSummary) ? financialSummary : []).map((item, index) => {
            const Icon = summaryIcons[index] || Clock;
            const colors = summaryColors[index] || summaryColors[0];
            return (
              <div key={`k-${index}`} className="bg-card rounded-lg p-6" data-testid={`finance-card-${index}`}>
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-lg ${colors.bgColor}`}>
                    <Icon className={`h-6 w-6 ${colors.color}`} />
                  </div>
                  <Badge className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold border-none",
                    item.trend === "down" ? "bg-green-100 text-green-800" : item.trend === "up" ? "bg-red-100 text-red-800" : "bg-muted/60 text-foreground"
                  )}>
                    {item.change}
                  </Badge>
                </div>
                <div className="mt-4">
                  <p className="text-3xl font-bold text-foreground tracking-tight">{item.value}</p>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-1">{item.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-2 leading-tight">{item.description}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl p-6">
          <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
            <PieChart className="h-4 w-4 text-primary" />
            {t("byudjetNazorati")}
          </h3>
          <div className="space-y-6">
            {budgetsLoading ? (
              <div className="space-y-4">
                {([1, 2, 3, 4, 5]).map((i) => (
                  <div key={`k-${i}`} className="space-y-2">
                    <Skeleton className="h-4 w-full rounded-lg" />
                    <Skeleton className="h-2 w-full rounded-lg" />
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
                      <span className="text-sm font-bold text-foreground">{budget.name}</span>
                      <div className="flex items-center gap-2">
                        {isOverBudget && <AlertTriangle className="h-4 w-4 text-[var(--ep-red)]" />}
                        <span className={`text-sm font-bold ${
                          isOverBudget ? "text-[var(--ep-red)]" : isWarning ? "text-[var(--ep-yellow)]" : "text-[var(--ep-green)]"
                        }`}>
                          {percentage}%
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-muted/60 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all",
                          isOverBudget ? "bg-red-500" : isWarning ? "bg-amber-500" : "bg-primary"
                        )}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <span>Sarflangan: {formatCurrency(budget.used)}</span>
                      <span>Qoldi: {formatCurrency(budget.allocated - budget.used)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-card rounded-xl p-6">
          <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            {t("kutilayotganTolovlar")}
          </h3>
          <div className="space-y-3">
            {paymentsLoading ? (
              <div className="space-y-3">
                {([1, 2, 3, 4]).map((i) => (
                  <div key={`k-${i}`} className="h-16 bg-background rounded-lg animate-pulse" />
                ))}
              </div>
            ) : pendingPayments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground" data-testid="empty-pending-payments">
                <CreditCard className="h-12 w-12 mb-4" />
                <p className="text-lg font-bold text-foreground">{t("kutilayotganTolovlarYoq")}</p>
                <p className="text-sm">{t("hozirchaHechQandayTolovKutilmayapti")}</p>
              </div>
            ) : (
              (Array.isArray(pendingPayments) ? pendingPayments : []).map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-4 bg-background rounded-lg hover:bg-muted/40 transition-colors" data-testid={`payment-${payment.id}`}>
                  <div>
                    <p className="font-bold text-foreground">{payment.vendor}</p>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1">
                      <Clock className="h-3 w-3" />
                      Muddat: {new Date(payment.dueDate).toLocaleDateString("uz-UZ")}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-foreground">{formatCurrency(payment.amount)}</p>
                    <Badge className={cn("mt-2 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border-none",
                      payment.status === "urgent" ? "bg-red-100 text-red-800" : 
                      payment.status === "pending" ? "bg-amber-100 text-amber-800" : "bg-primary/10 text-primary"
                    )}>
                      {payment.status === "urgent" ? "Shoshilinch" : 
                       payment.status === "pending" ? "Kutilmoqda" : "Rejalashtirilgan"}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
          <Button variant="outline" className="w-full mt-6 bg-muted/60 text-foreground rounded-lg py-2 text-sm font-medium hover:bg-muted border-none" onClick={() => setLocation("/income-expense")} data-testid="button-view-all-payments">
            {t("barchaTolovlarniKorish")}
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-xl p-6">
        <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          {t("moliyaviyKpi")}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpisLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={`k-${i}`} className="h-24 bg-background rounded-lg animate-pulse" />
            ))
          ) : (
            (Array.isArray(kpis) ? kpis : []).map((kpi) => {
              const isGood = kpi.kpiCode === "RECEIVABLES_DAYS" ? kpi.currentValue < kpi.targetValue :
                            kpi.kpiCode === "BUDGET_USAGE" ? kpi.currentValue < kpi.warningThreshold : 
                            kpi.currentValue >= kpi.targetValue;
              
              return (
                <div key={kpi.id} className="p-5 bg-background rounded-lg" data-testid={`finance-kpi-${kpi.kpiCode}`}>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{kpi.kpiName}</span>
                    {isGood ? (
                      <CheckCircle className="h-4 w-4 text-[var(--ep-green)]" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-[var(--ep-yellow)]" />
                    )}
                  </div>
                  <p className="text-3xl font-bold text-foreground tracking-tight">{kpi.currentValue} {kpi.unit}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mt-3">
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