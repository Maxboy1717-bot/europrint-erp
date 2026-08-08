/**
 * @module ProductProfitability
 * @description React page component. Route-level UI — state management,
 * data-fetching hooks, and orchestration only.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon, BarChart3, Download, RefreshCw } from "lucide-react";
import {
  OrderCosting,
  DateRange,
  buildProfitableChartData,
  buildLossChartData,
  buildDistributionData,
} from "./ProductProfitabilityTypes";
import { KpiSummaryCards, DistributionSection } from "./ProductProfitabilitySections";
import { TopProfitableSection, TopLossSection } from "./ProductProfitabilityCharts";
import { EPErrorState, EPPageHeader } from "@/components/ep";

import { useTranslation } from '@/lib/i18n';
export default function ProductProfitability() {
  const { t } = useTranslation('common');
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState<DateRange>({
    from: undefined,
    to: undefined,
  });

  const recalculateMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/finance/profitability/recalculate", {}),
    onSuccess: () => {
      toast({ title: "Muvaffaqiyatli", description: "Rentabellik qayta hisoblandi." });
    },
    onError: () => {
      toast({ title: "Xatolik", description: "Qayta hisoblashda xatolik yuz berdi.", variant: "destructive" });
    },
  });

  const exportMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/reports/profitability/export", {}),
    onSuccess: () => {
      toast({ title: "Export muvaffaqiyatli", description: "Hisobot eksport qilindi." });
    },
    onError: () => {
      toast({ title: "Xatolik", description: "Export qilishda xatolik yuz berdi.", variant: "destructive" });
    },
  });

  const { data: topProfitable = [], isLoading: profitableLoading, isError, error, refetch } = useQuery<OrderCosting[]>({
    queryKey: ["/api/order-costing/top-profitable"],
  });

  const { data: topLoss = [], isLoading: lossLoading } = useQuery<OrderCosting[]>({
    queryKey: ["/api/order-costing/top-loss"],
  });

  const { data: allCostings = [] } = useQuery<OrderCosting[]>({
    queryKey: ["/api/order-costing"],
  });

  const isLoading = profitableLoading || lossLoading;

  // Derived summary values
  const totalProducts = allCostings.length;
  const avgMargin =
    allCostings.length > 0
      ? (Array.isArray(allCostings) ? allCostings : []).reduce((sum, c) => sum + (c.profitMargin || 0), 0) /
        allCostings.length
      : 0;
  const totalProfitLoss = (Array.isArray(allCostings) ? allCostings : []).reduce(
    (sum, c) => sum + (c.grossProfit || 0),
    0,
  );

  // Chart data derived from query results
  const profitableChartData = buildProfitableChartData(topProfitable);
  const lossChartData = buildLossChartData(topLoss);
  const distributionData = buildDistributionData(allCostings);

  if (isError) {
    return <EPErrorState onRetry={refetch}  error={error} />;
  }

  return (
    <div className="space-y-6" data-testid="product-profitability-page">
      <EPPageHeader
        icon={<BarChart3 className="h-5 w-5" />}
        title={t("mahsulotRentabelligi")}
        subtitle={t('productProfitabilityAnalysis')}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportMutation.mutate()}
              disabled={exportMutation.isPending}
              data-testid="button-export-csv"
            >
              <Download className={`h-4 w-4 mr-2 ${exportMutation.isPending ? "animate-spin" : ""}`} />
              Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => recalculateMutation.mutate()}
              disabled={recalculateMutation.isPending}
              data-testid="button-recalculate"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${recalculateMutation.isPending ? "animate-spin" : ""}`} />
              {t("qaytaHisoblash")}
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2" data-testid="button-date-filter">
                  <CalendarIcon className="h-4 w-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "dd.MM.yyyy")} - {format(dateRange.to, "dd.MM.yyyy")}
                      </>
                    ) : (
                      format(dateRange.from, "dd.MM.yyyy")
                    )
                  ) : (
                    "Sana tanlang"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange.from}
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
        }
      />

      {/* Page body */}
      <div className="space-y-6 pt-6">
        <KpiSummaryCards
          isLoading={isLoading}
          totalProducts={totalProducts}
          avgMargin={avgMargin}
          totalProfitLoss={totalProfitLoss}
        />

        <div className="grid gap-6 lg:grid-cols-2">
          <TopProfitableSection
            isLoading={isLoading}
            topProfitable={topProfitable}
            chartData={profitableChartData}
          />
          <TopLossSection
            isLoading={isLoading}
            topLoss={topLoss}
            chartData={lossChartData}
          />
        </div>

        <DistributionSection
          isLoading={isLoading}
          distributionData={distributionData}
        />
      </div>
    </div>
  );
}
