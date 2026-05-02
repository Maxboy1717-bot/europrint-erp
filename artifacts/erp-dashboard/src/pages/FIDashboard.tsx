import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/page-header";
import { KpiCard } from "@/components/ui/kpi-card";
import { BlueCTACard } from "@/components/ui/blue-cta-card";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  FileText,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Receipt,
} from "lucide-react";
import { Link } from "wouter";
import { useTranslation } from "@/lib/i18n";
import { ErrorState } from "@/components/ui/error-state";

export default function FIDashboard() {
  const { t } = useTranslation("finance");
  const { t: tCommon } = useTranslation("common");

  const { data: stats, isLoading, isError, refetch } = useQuery<{
    revenue: number; expenses: number; unpaidInvoices?: number; unpaidAmount?: number;
  }>({
    queryKey: ["/api/fi/stats"],
  });

  const { data: recentTransactions = [] } = useQuery<Array<{
    id: string; transactionType: string; description: string | null;
    counterpartyName: string | null; amount: number; transactionDate: string; status: string;
  }>>({
    queryKey: ["/api/fi/recent-transactions"],
  });

  if (isError) return <ErrorState onRetry={refetch} />;

  const totalRevenue = stats?.revenue ?? 0;
  const totalExpenses = stats?.expenses ?? 0;
  const profit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? ((profit / totalRevenue) * 100).toFixed(1) : "0.0";
  const unpaidInvoices = stats?.unpaidInvoices ?? 0;
  const unpaidAmount = stats?.unpaidAmount ?? 0;

  const indicators = [
    { label: t("revenuePlan"), pct: totalRevenue > 0 ? Math.min(100, Math.round((totalRevenue / 3000000000) * 100)) : 0, color: "bg-green-500" },
    { label: t("expenseBudget"), pct: totalExpenses > 0 ? Math.min(100, Math.round((totalExpenses / 2500000000) * 100)) : 0, color: "bg-red-500" },
    { label: t("accountsReceivable"), pct: unpaidAmount > 0 ? Math.min(100, Math.round((unpaidAmount / 500000000) * 100)) : 0, color: "bg-orange-500" },
    { label: t("accountsPayable"), pct: unpaidInvoices > 0 ? Math.min(100, Math.round((unpaidInvoices / 100) * 100)) : 0, color: "bg-purple-500" },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        label="Europrint ERP · Moliya bo'limi"
        title="Moliya"
        boldWord="Boshqaruvi"
        subtitle="Daromad, xarajat, soliq va to'lov tahlili"
        data-testid="text-fi-dashboard-title"
      >
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild className="bg-surface-container text-on-surface rounded-lg px-4 py-2 text-sm font-medium hover:bg-surface-container-high border-none">
            <Link href="/fi-finance" data-testid="link-finance">
              <DollarSign className="h-3.5 w-3.5 mr-1.5" />
              {t("finance")}
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="bg-surface-container text-on-surface rounded-lg px-4 py-2 text-sm font-medium hover:bg-surface-container-high border-none">
            <Link href="/erp-analytics" data-testid="link-analytics">
              <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
              {t("analytics")}
            </Link>
          </Button>
        </div>
      </PageHeader>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest rounded-lg p-5" data-testid="card-stat-total-revenue">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">{t("totalRevenue")}</p>
          <p className="text-4xl font-bold tracking-tight text-on-surface">{isLoading ? "..." : formatCurrency(totalRevenue)}</p>
          <p className="text-xs text-on-surface-variant mt-2 font-medium">{totalRevenue > 0 ? "Joriy ma'lumot" : "Ma'lumot yo'q"}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-lg p-5" data-testid="card-stat-total-expenses">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">{t("totalExpenses")}</p>
          <p className="text-4xl font-bold tracking-tight text-on-surface">{isLoading ? "..." : formatCurrency(totalExpenses)}</p>
          <p className="text-xs text-on-surface-variant mt-2 font-medium">{totalExpenses > 0 ? "Joriy ma'lumot" : "Ma'lumot yo'q"}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-lg p-5" data-testid="card-stat-net-profit">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">{t("netProfit")}</p>
          <p className="text-4xl font-bold tracking-tight text-on-surface">{isLoading ? "..." : formatCurrency(profit)}</p>
          <p className="text-xs text-on-surface-variant mt-2 font-medium">{totalRevenue > 0 ? `${profitMargin}% margin` : "Ma'lumot yo'q"}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-lg p-5" data-testid="card-stat-unpaid">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">{t("unpaidInvoices")}</p>
          <p className="text-4xl font-bold tracking-tight text-on-surface">{isLoading ? "..." : unpaidInvoices}</p>
          <p className="text-xs text-amber-600 mt-2 font-medium">{unpaidAmount > 0 ? formatCurrency(unpaidAmount) : "—"}</p>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {/* Recent Transactions */}
        <Card className="bg-surface-container-lowest border-none rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-on-surface-variant">
              <Wallet className="h-4 w-4 text-primary" />
              {t("recentTransactions")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {([1, 2, 3, 4]).map((i) => <Skeleton key={`k-${i}`} className="h-12 w-full" />)}
              </div>
            ) : recentTransactions.length === 0 ? (
              <p className="text-center text-sm text-on-surface-variant py-8">Tranzaksiyalar yo'q</p>
            ) : (
              <div className="space-y-2">
                {(Array.isArray(recentTransactions) ? recentTransactions : []).slice(0, 6).map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-container-low transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${tx.transactionType === "income" ? "bg-green-100" : "bg-red-100"}`}>
                        {tx.transactionType === "income"
                          ? <ArrowDownRight className="h-4 w-4 text-green-800" />
                          : <ArrowUpRight className="h-4 w-4 text-red-800" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-on-surface">{tx.description || tx.counterpartyName || "Tranzaksiya"}</p>
                        <p className="text-[11px] text-on-surface-variant">{tx.transactionDate}</p>
                      </div>
                    </div>
                    <p className={`text-sm font-bold ${tx.transactionType === "income" ? "text-primary font-semibold" : "text-error font-semibold"}`}>
                      {tx.transactionType === "income" ? "+" : "-"}{Number(tx.amount).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Financial Indicators */}
        <div className="space-y-4">
          <Card className="bg-surface-container-lowest border-none rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-on-surface-variant">
                <PieChart className="h-4 w-4 text-primary" />
                {t("financialIndicators")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(Array.isArray(indicators) ? indicators : []).map((ind, i) => (
                  <div key={`k-${i}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-on-surface-variant">{ind.label}</span>
                      <span className="text-xs font-bold text-on-surface">{ind.pct}%</span>
                    </div>
                    <div className="h-1.5 bg-surface-container rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${ind.color.replace('green-500', 'primary').replace('red-500', 'error')}`} style={{ width: `${ind.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions Blue Card */}
          <div className="bg-gradient-to-br from-primary to-primary-dim text-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5" />
              <h3 className="font-bold">Tezkor Amallar</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {([
                { label: t("createInvoice"), href: "/fi-finance", icon: FileText },
                { label: t("enterExpense"), href: "/fi-finance", icon: CreditCard },
                { label: t("financialReport"), href: "/erp-analytics", icon: BarChart3 },
                { label: t("dailyReport"), href: "/erp-daily-reports", icon: PieChart },
              ]).map((action) => (
                <Link key={action.label} href={action.href}>
                  <button className="w-full flex items-center gap-2 p-2.5 rounded-lg bg-surface-container-lowest/10 hover:bg-surface-container-lowest/20 transition-colors text-left border-none outline-none">
                    <action.icon className="h-3.5 w-3.5 text-white shrink-0" />
                    <span className="text-xs font-semibold text-white">{action.label}</span>
                  </button>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
