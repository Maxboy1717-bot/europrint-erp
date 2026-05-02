import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Warehouse, Package, DollarSign, AlertTriangle, Layers, Grid3X3, ArrowRightLeft, ClipboardList } from "lucide-react";
import { ErrorState } from "@/components/ui/error-state";
import { translations, WarehouseData, Lang } from "./warehouse/warehouse-types";
import { WarehousesTab } from "./warehouse/WarehousesTab";
import { ZonesTab } from "./warehouse/ZonesTab";
import { BinsTab } from "./warehouse/BinsTab";
import { TransfersTab } from "./warehouse/TransfersTab";
import { InventarizatsiyaPanel } from "./warehouse/InventarizatsiyaPanel";

export default function WarehouseDirectory() {
  const [lang, setLang] = useState<Lang>("uz");
  const [activeTab, setActiveTab] = useState("warehouses");
  const t = translations[lang];

  const { data: warehouses = [], isError, refetch } = useQuery<WarehouseData[]>({
    queryKey: ["/api/warehouse/warehouses"],
  });

  const { data: totalStats } = useQuery<{ totalMaterials: number; totalValue: number; lowStockCount: number }>({
    queryKey: ["/api/warehouse/stats/total"],
    queryFn: async () => {
      let totalMaterials = 0;
      let totalValue = 0;
      let lowStockCount = 0;
      for (const wh of warehouses) {
        try {
          const res = await fetch(`/api/warehouse/warehouses/${wh.id}/stats`, { credentials: "include" });
          if (res.ok) {
            const stats = await res.json();
            totalMaterials += stats.materialCount || 0;
            totalValue += stats.stockValue || 0;
            lowStockCount += stats.lowStockCount || 0;
          }
        } catch { /* ignore individual warehouse errors */ }
      }
      return { totalMaterials, totalValue, lowStockCount };
    },
    enabled: warehouses.length > 0,
  });

  if (isError) return <ErrorState onRetry={refetch} />;

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-foreground" data-testid="page-title">{t.title}</h1>
          <p className="text-sm text-muted-foreground">{t.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={lang === "uz" ? "default" : "outline"} size="sm" onClick={() => setLang("uz")} data-testid="btn-lang-uz">UZ</Button>
          <Button variant={lang === "ru" ? "default" : "outline"} size="sm" onClick={() => setLang("ru")} data-testid="btn-lang-ru">RU</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border-yellow-500/30">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t.stats.totalWarehouses}</CardTitle>
            <Warehouse className="h-5 w-5 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground" data-testid="stat-total-warehouses">{warehouses.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border-yellow-500/30">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t.stats.totalMaterials}</CardTitle>
            <Package className="h-5 w-5 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground" data-testid="stat-total-materials">{totalStats?.totalMaterials || 0}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border-yellow-500/30">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t.stats.stockValue}</CardTitle>
            <DollarSign className="h-5 w-5 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground" data-testid="stat-stock-value">{(totalStats?.totalValue || 0).toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-500/20 to-red-600/10 border-red-500/30">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t.stats.lowStock}</CardTitle>
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground" data-testid="stat-low-stock">{totalStats?.lowStockCount || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1 w-full max-w-2xl">
          <TabsTrigger value="warehouses" className="gap-2" data-testid="tab-warehouses">
            <Warehouse className="h-4 w-4" /><span className="hidden sm:inline">{t.warehouses}</span>
          </TabsTrigger>
          <TabsTrigger value="zones" className="gap-2" data-testid="tab-zones">
            <Layers className="h-4 w-4" /><span className="hidden sm:inline">{t.zones}</span>
          </TabsTrigger>
          <TabsTrigger value="bins" className="gap-2" data-testid="tab-bins">
            <Grid3X3 className="h-4 w-4" /><span className="hidden sm:inline">{t.bins}</span>
          </TabsTrigger>
          <TabsTrigger value="transfers" className="gap-2" data-testid="tab-transfers">
            <ArrowRightLeft className="h-4 w-4" /><span className="hidden sm:inline">{t.transfers}</span>
          </TabsTrigger>
          <TabsTrigger value="inventory" className="gap-2" data-testid="tab-inventory">
            <ClipboardList className="h-4 w-4" /><span className="hidden sm:inline">{lang === "uz" ? "Inventarizatsiya" : "Инвентаризация"}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="warehouses" className="space-y-4">
          <WarehousesTab lang={lang} t={t} />
        </TabsContent>
        <TabsContent value="zones" className="space-y-4">
          <ZonesTab lang={lang} t={t} />
        </TabsContent>
        <TabsContent value="bins" className="space-y-4">
          <BinsTab lang={lang} t={t} />
        </TabsContent>
        <TabsContent value="transfers" className="space-y-4">
          <TransfersTab lang={lang} t={t} />
        </TabsContent>
        <TabsContent value="inventory" className="space-y-4">
          <InventarizatsiyaPanel lang={lang} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
