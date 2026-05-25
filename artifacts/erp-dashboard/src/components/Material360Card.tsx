/**
 * @module Material360Card
 * @description React UI component.
 */

import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Package, ArrowLeft, Clock, DollarSign,
  ShoppingCart, Box, Hash, Calendar, Boxes, Pencil,
} from "lucide-react";

import {
  fmtQty, fmtMoney, fmtDate,
  type Material360CardResponse,
} from "./wms/material360/types";

import { BasicTab } from "./wms/material360/BasicTab";
import { StockTab } from "./wms/material360/StockTab";
import { MovementsTab } from "./wms/material360/MovementsTab";
import { FinanceTab } from "./wms/material360/FinanceTab";
import { SuppliersTab } from "./wms/material360/SuppliersTab";
import { ProductionTab } from "./wms/material360/ProductionTab";
import { QualityTab } from "./wms/material360/QualityTab";
import { ForecastTab } from "./wms/material360/ForecastTab";
import { StorageTab } from "./wms/material360/StorageTab";
import { InventoryTab } from "./wms/material360/InventoryTab";
import { StockStatusBadge } from "./wms/material360/StockStatusBadge";
import { useTranslation } from '@/lib/i18n';

const TABS = [
  { value: "basic", label: "Asosiy" }, { value: "stock", label: "Ombor" },
  { value: "movements", label: "Harakatlar" }, { value: "finance", label: "Moliya" },
  { value: "suppliers", label: "Yetkazib beruvchilar" }, { value: "production", label: "Ishlab chiqarish" },
  { value: "quality", label: "Sifat" }, { value: "forecast", label: "Prognoz" },
  { value: "storage", label: "Saqlash" }, { value: "inventory", label: "Inventarizatsiya" },
];

export function Material360Card({ materialId, onBack, onEdit }: { materialId: string; onBack: () => void; onEdit?: () => void }) {
  const { t } = useTranslation("common");
  const { data, isLoading } = useQuery<Material360CardResponse>({
    queryKey: ["/api/inventory/materials", materialId, "360-card"],
    enabled: !!materialId,
    queryFn: () => apiRequest("GET", `/api/inventory/materials/${materialId}/360-card`)
  });

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <div className="flex items-center gap-3"><Skeleton className="h-9 w-9 rounded-full" /><Skeleton className="h-6 w-48 rounded-lg" /></div>
        <Skeleton className="h-40 w-full rounded-lg" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{([...Array(4)]).map((_, i) => <Skeleton key={`k-${i}`} className="h-24 rounded-lg" />)}</div>
      </div>
    );
  }

  if (!data?.basic) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p className="text-base font-medium mb-1">{t("materialTopilmadi")}</p>
        <p className="text-sm mb-4">ID: {materialId}</p>
        <Button variant="outline" size="sm" onClick={onBack}><ArrowLeft className="h-4 w-4 mr-1" /> {t("back")}</Button>
      </div>
    );
  }

  const { basic, stock, movements, finance, suppliers, productionUsage, quality, forecast, storage, inventory } = data;
  const stockStatus = stock?.stockStatus || basic.stockStatus || "normal";

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-shrink-0">
        <Card className="border-0 rounded-none border-b overflow-hidden">
          <CardContent className="p-0">
            <div className="flex flex-col sm:flex-row">
              <div
                className="relative flex-shrink-0 sm:w-44 flex flex-col items-center justify-center"
                style={{ background: "var(--ep-primary)" }}
              >
                <div className="absolute inset-0 overflow-hidden opacity-10 pointer-events-none">
                  <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full border-2 border-white" />
                  <div className="absolute top-4 right-4 w-16 h-16 rounded-full border border-white" />
                </div>
                <div className="relative py-5 px-4 flex flex-col items-center gap-3">
                  <Button size="icon" variant="ghost" onClick={onBack}
                    className="absolute top-2 left-2 h-7 w-7 text-white/80 hover:text-white hover:bg-white/10"
                    data-testid="button-360-back">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div className="w-20 h-20 rounded-md border-2 border-white/30 shadow-lg bg-white/10 flex items-center justify-center mt-4">
                    <Boxes className="h-10 w-10 text-white" />
                  </div>
                  <div className="bg-white/15 rounded px-3 py-1 flex items-center gap-1.5">
                    <Hash className="h-3 w-3 text-white/70" />
                    <span className="text-white text-xs font-mono font-semibold tracking-wider">{basic.kod}</span>
                  </div>
                  {basic.abcSegment && (
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border-2 border-white/30 ${basic.abcSegment === "A" ? "bg-green-400/90 text-white" : basic.abcSegment === "B" ? "bg-blue-300/90 text-white" : "bg-amber-400/90 text-white"}`}>
                      <span className="text-sm font-black leading-none">{basic.abcSegment}</span>
                      <span>{basic.abcSegment === "A" ? "Yuqori" : basic.abcSegment === "B" ? "O'rtacha" : "Past"}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1 min-w-0 flex flex-col">
                <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-4 pb-3">
                  <div className="min-w-0">
                    <h2 className="text-xl font-bold leading-tight tracking-tight text-foreground" data-testid="text-material-name">
                      {basic.xomAshyo}
                    </h2>
                    {basic.xomAshyoRu && <p className="text-sm text-muted-foreground mt-0.5">{basic.xomAshyoRu}</p>}
                    <div className="flex flex-wrap gap-2 mt-2">
                      <StockStatusBadge status={stockStatus} />
                      {basic.isActive !== false && <Badge className="bg-green-100 text-green-800 border-none">{t("aktiv")}</Badge>}
                      {basic.category && <Badge variant="outline">{basic.category}</Badge>}
                      {basic.materialType && <Badge variant="outline">{basic.materialType}</Badge>}
                    </div>
                  </div>
                  {onEdit && (
                    <Button size="sm" variant="outline" onClick={onEdit} data-testid="button-material-edit" className="flex-shrink-0 mt-1">
                      <Pencil className="h-3.5 w-3.5 mr-1.5" />
                      {t("edit")}
                    </Button>
                  )}
                </div>
                <div className="px-5 pb-4 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Box className="h-3.5 w-3.5 text-primary" />
                    <span>{t("olchov")}<strong className="text-foreground">{basic.unitOfMeasure}</strong></span>
                  </span>
                  {stock?.totalQty != null && (
                    <span className="flex items-center gap-1.5">
                      <Package className="h-3.5 w-3.5 text-primary" />
                      <span>{t("zaxira")}<strong className="text-foreground">{fmtQty(stock.totalQty, basic.unitOfMeasure)}</strong></span>
                    </span>
                  )}
                  {basic.lastPurchaseDate && (
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-primary" />
                      <span>{t("oxirgiXarid")}<strong className="text-foreground">{fmtDate(basic.lastPurchaseDate)}</strong></span>
                    </span>
                  )}
                  {basic.supplierName && (
                    <span className="flex items-center gap-1.5"><ShoppingCart className="h-3.5 w-3.5" /><span>{basic.supplierName}</span></span>
                  )}
                  {stock?.daysRemaining != null && (
                    <span className={`flex items-center gap-1.5 ${stock.daysRemaining < 7 ? "text-destructive" : ""}`}>
                      <Clock className="h-3.5 w-3.5" />
                      <span>{t("yetadi")}<strong>{stock.daysRemaining} kun</strong></span>
                    </span>
                  )}
                  {finance?.currentAvgPrice ? (
                    <span className="flex items-center gap-1.5">
                      <DollarSign className="h-3.5 w-3.5" />
                      <span>{t("narx")}<strong className="text-foreground">{fmtMoney(finance.currentAvgPrice, finance.currency)}/{basic.unitOfMeasure}</strong></span>
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">
        <Tabs defaultValue="basic" className="flex flex-col h-full">
          <div className="overflow-x-auto shrink-0 border-b bg-background">
            <TabsList className="h-9 w-max min-w-full rounded-none bg-transparent border-0 px-0">
              {(Array.isArray(TABS) ? TABS : []).map(({ value, label }) => (
                <TabsTrigger key={value} value={value}
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none px-3 text-xs whitespace-nowrap">
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="p-4">
              <TabsContent value="basic" className="m-0"><BasicTab basic={basic} /></TabsContent>
              <TabsContent value="stock" className="m-0"><StockTab stock={stock} basic={basic} /></TabsContent>
              <TabsContent value="movements" className="m-0"><MovementsTab movements={movements} basic={basic} /></TabsContent>
              <TabsContent value="finance" className="m-0"><FinanceTab finance={finance} basic={basic} /></TabsContent>
              <TabsContent value="suppliers" className="m-0"><SuppliersTab suppliers={suppliers} basic={basic} /></TabsContent>
              <TabsContent value="production" className="m-0"><ProductionTab productionUsage={productionUsage} basic={basic} /></TabsContent>
              <TabsContent value="quality" className="m-0"><QualityTab quality={quality} basic={basic} /></TabsContent>
              <TabsContent value="forecast" className="m-0"><ForecastTab forecast={forecast} basic={basic} /></TabsContent>
              <TabsContent value="storage" className="m-0"><StorageTab storage={storage} basic={basic} /></TabsContent>
              <TabsContent value="inventory" className="m-0"><InventoryTab inventory={inventory} basic={basic} /></TabsContent>
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
