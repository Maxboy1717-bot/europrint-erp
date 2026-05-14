/**
 * @module FinancialReports
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { exportToCSV } from "@/lib/export-utils";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  FileText,
  Calendar,
  Download,
  BarChart3,
  Target,
  Factory,
  FileSpreadsheet,
} from "lucide-react";
// Sub-components
import { WeeklyOverview } from "@/components/finance/reports/WeeklyOverview";
import { CashFlowARAP } from "@/components/finance/reports/CashFlowARAP";
import { WeeklyRevenueChart } from "@/components/finance/reports/WeeklyRevenueChart";
import { IncomeStatement } from "@/components/finance/reports/IncomeStatement";
import { BalanceSheet } from "@/components/finance/reports/BalanceSheet";
import { MonthlyCashFlow } from "@/components/finance/reports/MonthlyCashFlow";
import { MonthlyTrendChart } from "@/components/finance/reports/MonthlyTrendChart";
import { RatioAnalysis } from "@/components/finance/reports/RatioAnalysis";
import { KPITrendChart } from "@/components/finance/reports/KPITrendChart";
import { ProductionStats } from "@/components/finance/reports/ProductionStats";
import { ProductionAnalysis } from "@/components/finance/reports/ProductionAnalysis";

// Types
import { WeeklySummary, MonthlySummary, KPIDashboard, ProductionEfficiency } from "@/components/finance/reports/types";
import { EPErrorState } from "@/components/ep";

export default function FinancialReports() {
  const [activeTab, setActiveTab] = useState("weekly");
  const [selectedPeriod, setSelectedPeriod] = useState("current-week");

  const { data: weeklySummary, isLoading: weeklyLoading, isError, refetch } = useQuery<WeeklySummary>({
    queryKey: ["/api/reports/weekly-summary", selectedPeriod],
  });

  const { data: monthlySummary, isLoading: monthlyLoading } = useQuery<MonthlySummary>({
    queryKey: ["/api/reports/monthly-summary"],
  });

  const { data: kpiDashboard, isLoading: kpiLoading } = useQuery<KPIDashboard>({
    queryKey: ["/api/reports/kpi-dashboard"],
  });

  const { data: productionEfficiency, isLoading: productionLoading } = useQuery<ProductionEfficiency>({
    queryKey: ["/api/reports/production-efficiency"],
  });

  const handleExportPDF = () => {
    const reportData = [];
    if (weeklySummary) {
      reportData.push({
        hisobot: "Haftalik",
        daromad: weeklySummary.revenue,
        xarajat: weeklySummary.expenses,
        sof_foyda: weeklySummary.netProfit,
        daromad_ozgarish: weeklySummary.revenueChange + "%",
      });
    }
    if (monthlySummary) {
      reportData.push({
        hisobot: "Oylik",
        daromad: monthlySummary.profitLoss?.revenue || 0,
        xarajat: monthlySummary.profitLoss?.operatingExpenses || 0,
        sof_foyda: monthlySummary.profitLoss?.operatingIncome || 0,
        daromad_ozgarish: "",
      });
    }
    exportToCSV(reportData, "moliyaviy_hisobot", [
      { key: "hisobot", label: "Hisobot turi" },
      { key: "daromad", label: "Daromad" },
      { key: "xarajat", label: "Xarajat" },
      { key: "sof_foyda", label: "Sof foyda" },
      { key: "daromad_ozgarish", label: "O'zgarish" },
    ]);
  };

  const handleExportExcel = () => {
    handleExportPDF();
  };

  if (isError) {
    return <EPErrorState onRetry={refetch} />;
  }

  return (
    <div data-testid="financial-reports">
      <div className="-mx-4 -mt-4 lg:-mx-6 lg:-mt-6 border-b from-primary to-amber-500 text-white">
        <div className="px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8" />
              <div>
                <h1 className="text-2xl font-bold">Moliyaviy Hisobotlar</h1>
                <p className="text-white/75 text-sm">Haftalik, oylik va KPI hisobotlari</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button 
                variant="outline" 
                className="bg-card/10 border-white/30 text-white hover:bg-card/20 gap-2"
                onClick={handleExportPDF}
                data-testid="button-export-pdf"
              >
                <Download className="h-4 w-4" />
                PDF yuklab olish
              </Button>
              <Button 
                variant="outline" 
                className="bg-card/10 border-white/30 text-white hover:bg-card/20 gap-2"
                onClick={handleExportExcel}
                data-testid="button-export-excel"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Excel yuklab olish
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="weekly" data-testid="tab-weekly">
              <Calendar className="h-4 w-4 mr-2" />
              Haftalik
            </TabsTrigger>
            <TabsTrigger value="monthly" data-testid="tab-monthly">
              <BarChart3 className="h-4 w-4 mr-2" />
              Oylik
            </TabsTrigger>
            <TabsTrigger value="kpi" data-testid="tab-kpi">
              <Target className="h-4 w-4 mr-2" />
              KPI Dashboard
            </TabsTrigger>
            <TabsTrigger value="production" data-testid="tab-production">
              <Factory className="h-4 w-4 mr-2" />
              Ishlab chiqarish
            </TabsTrigger>
          </TabsList>

          <TabsContent value="weekly" className="space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <h2 className="text-xl font-semibold">Haftalik Moliyaviy Xulosa</h2>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-full sm:w-[200px] h-9" data-testid="select-period">
                  <SelectValue placeholder="Davrni tanlang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current-week">Joriy hafta</SelectItem>
                  <SelectItem value="last-week">O'tgan hafta</SelectItem>
                  <SelectItem value="two-weeks-ago">2 hafta oldin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <WeeklyOverview data={weeklySummary} isLoading={weeklyLoading} />
            <CashFlowARAP data={weeklySummary} isLoading={weeklyLoading} />
            <WeeklyRevenueChart data={weeklySummary} isLoading={weeklyLoading} />
          </TabsContent>

          <TabsContent value="monthly" className="space-y-6">
            <h2 className="text-xl font-semibold">Oylik Moliyaviy Hisobot</h2>
            <div className="grid gap-6 lg:grid-cols-2">
              <IncomeStatement data={monthlySummary} isLoading={monthlyLoading} />
              <BalanceSheet data={monthlySummary} isLoading={monthlyLoading} />
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <MonthlyCashFlow data={monthlySummary} isLoading={monthlyLoading} />
              <MonthlyTrendChart data={monthlySummary} isLoading={monthlyLoading} />
            </div>
          </TabsContent>

          <TabsContent value="kpi" className="space-y-6">
            <h2 className="text-xl font-semibold">Moliyaviy KPI Tahlili</h2>
            <RatioAnalysis data={kpiDashboard} isLoading={kpiLoading} />
            <KPITrendChart data={kpiDashboard} isLoading={kpiLoading} />
          </TabsContent>

          <TabsContent value="production" className="space-y-6">
            <h2 className="text-xl font-semibold">Ishlab chiqarish samaradorligi</h2>
            <ProductionStats data={productionEfficiency} isLoading={productionLoading} />
            <ProductionAnalysis data={productionEfficiency} isLoading={productionLoading} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
