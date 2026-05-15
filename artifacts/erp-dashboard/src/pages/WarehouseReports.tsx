/**
 * @module WarehouseReports
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, TrendingUp, PieChartIcon, Clock, Calendar } from "lucide-react";
import { exportToCSV } from "@/lib/export-utils";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { translations, Lang, StockBalanceData, TurnoverData, AbcData } from "@/components/wms/reports/types";
import { ReportsHeader } from "@/components/wms/reports/ReportsHeader";
import { StockBalanceTab } from "@/components/wms/reports/StockBalanceTab";
import { TurnoverTab } from "@/components/wms/reports/TurnoverTab";
import { AbcAnalysisTab } from "@/components/wms/reports/AbcAnalysisTab";
import { AgingTab } from "@/components/wms/reports/AgingTab";
import { ExpiryTab } from "@/components/wms/reports/ExpiryTab";
import { EPErrorState } from "@/components/ep";
export default function WarehouseReports() {

  const [lang, setLang] = useState<Lang>("uz");
  const t = translations[lang] as unknown as typeof translations.uz & ((key: string) => string);

  const [activeTab, setActiveTab] = useState("stockBalance");
  const [category, setCategory] = useState("all");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [period, setPeriod] = useState("90");
  const [daysThreshold, setDaysThreshold] = useState("90");
  const [daysAhead, setDaysAhead] = useState("30");

  const { data: stockBalanceData, refetch: refetchStock, isError, error } = useQuery<StockBalanceData>({
    queryKey: ["/api/warehouse/reports/stock-balance", category, lowStockOnly],
    enabled: activeTab === "stockBalance",
  });

  const { data: turnoverData } = useQuery<TurnoverData>({
    queryKey: ["/api/warehouse/reports/turnover", dateFrom, dateTo],
    enabled: activeTab === "turnover",
  });

  const { data: abcData } = useQuery<AbcData>({
    queryKey: ["/api/warehouse/reports/abc-analysis", period],
    enabled: activeTab === "abcAnalysis",
  });

  const handleExport = () => {
    if (activeTab === "stockBalance" && stockBalanceData) {
      exportToCSV(stockBalanceData?.data || [], "ombor_qoldiq", [
        { key: "materialName", label: "Material" },
        { key: "category", label: "Kategoriya" },
        { key: "currentQuantity", label: "Joriy miqdor" },
        { key: "unitOfMeasure", label: "Birlik" },
        { key: "unitCost", label: "Narxi" },
        { key: "totalValue", label: "Umumiy qiymat" },
      ]);
    } else if (activeTab === "turnover" && turnoverData) {
      exportToCSV(turnoverData?.data || [], "ombor_aylanma", [
        { key: "materialName", label: "Material" },
        { key: "openingQty", label: "Ochilish" },
        { key: "inQty", label: "Kirim" },
        { key: "outQty", label: "Chiqim" },
        { key: "closingQty", label: "Yopilish" },
      ]);
    } else if (activeTab === "abcAnalysis" && abcData) {
      exportToCSV(abcData?.data || [], "abc_tahlil", [
        { key: "materialName", label: "Material" },
        { key: "class", label: "Sinf" },
        { key: "totalValue", label: "Qiymat" },
        { key: "percentage", label: "Foiz" },
      ]);
    }
  };

  if (isError) {
    return <EPErrorState onRetry={() => refetchStock()} />;
  }

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <div className="flex items-center justify-between gap-2">
        <ReportsHeader t={t} lang={lang} setLang={setLang} onExport={handleExport} />
        <Button variant="outline" size="sm" onClick={() => refetchStock()} className="shrink-0">
          <RefreshCw className="h-4 w-4 mr-2" />
          {"Yangilash"}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 mb-6">
          <TabsTrigger value="stockBalance" className="gap-2" data-testid="tab-stock-balance">
            <Package className="w-4 h-4" />
            <span className="hidden sm:inline">{t.tabs.stockBalance}</span>
          </TabsTrigger>
          <TabsTrigger value="turnover" className="gap-2" data-testid="tab-turnover">
            <TrendingUp className="w-4 h-4" />
            <span className="hidden sm:inline">{t.tabs.turnover}</span>
          </TabsTrigger>
          <TabsTrigger value="abcAnalysis" className="gap-2" data-testid="tab-abc">
            <PieChartIcon className="w-4 h-4" />
            <span className="hidden sm:inline">{t.tabs.abcAnalysis}</span>
          </TabsTrigger>
          <TabsTrigger value="aging" className="gap-2" data-testid="tab-aging">
            <Clock className="w-4 h-4" />
            <span className="hidden sm:inline">{t.tabs.aging}</span>
          </TabsTrigger>
          <TabsTrigger value="expiry" className="gap-2" data-testid="tab-expiry">
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">{t.tabs.expiry}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stockBalance">
          <StockBalanceTab
            t={t}
            category={category}
            setCategory={setCategory}
            lowStockOnly={lowStockOnly}
            setLowStockOnly={setLowStockOnly}
          />
        </TabsContent>

        <TabsContent value="turnover">
          <TurnoverTab
            t={t}
            dateFrom={dateFrom}
            setDateFrom={setDateFrom}
            dateTo={dateTo}
            setDateTo={setDateTo}
          />
        </TabsContent>

        <TabsContent value="abcAnalysis">
          <AbcAnalysisTab t={t} period={period} setPeriod={setPeriod} />
        </TabsContent>

        <TabsContent value="aging">
          <AgingTab t={t} daysThreshold={daysThreshold} setDaysThreshold={setDaysThreshold} />
        </TabsContent>

        <TabsContent value="expiry">
          <ExpiryTab t={t} daysAhead={daysAhead} setDaysAhead={setDaysAhead} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
