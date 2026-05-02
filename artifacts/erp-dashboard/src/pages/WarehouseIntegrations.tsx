import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Factory,
  Package,
  DollarSign,
  Truck,
  AlertTriangle,
  ArrowRightLeft,
  FileCheck,
  ClipboardList,
  RefreshCw,
  Play,
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Warehouse as WarehouseIcon,
  Languages,
} from "lucide-react";
import { ErrorState } from "@/components/ui/error-state";

interface IntegrationSummary {
  pp: { ordersNeedingMaterials: number; label: { uz: string; ru: string } };
  mm: { pendingDeliveries: number; lowStockAlerts: number; label: { uz: string; ru: string } };
  fi: { recentTransactions: number; label: { uz: string; ru: string } };
}

interface PendingDelivery {
  id: string;
  poNumber: string;
  vendorName: string;
  orderDate: string;
  deliveryDate: string;
  status: string;
  totalAmount: number;
  itemCount: number;
}

interface ReorderSuggestion {
  id: string;
  kod: string;
  xomAshyo: string;
  currentStock: number;
  minStock: number;
  suggestedQuantity: number;
  estimatedCost: number;
  severity: "critical" | "high" | "medium";
  unitOfMeasure: string;
}

interface StockValuation {
  totalValue: number;
  totalItems: number;
  valuationMethod: string;
  valuationDate: string;
  byCategory: Record<string, { totalValue: number; itemCount: number }>;
}

const translations = {
  uz: {
    title: "Ombor Integratsiyalari",
    subtitle: "PP, MM va FI modullari bilan bog'lanish",
    languageToggle: "Tilni almashtirish",
    refresh: "Yangilash",
    
    pp: {
      title: "PP - Ishlab Chiqarish",
      description: "Buyurtmalar uchun materiallar boshqaruvi",
      ordersNeedingMaterials: "Material talab qiluvchi buyurtmalar",
      reserveMaterials: "Materiallarni zaxiralash",
      issueMaterials: "Ishlab chiqarishga berish",
      receiveGoods: "Tayyor mahsulot qabul qilish",
      noOrders: "Hozircha material talab qiluvchi buyurtmalar yo'q",
      viewDetails: "Batafsil ko'rish",
    },
    
    mm: {
      title: "MM - Taminot",
      description: "Xarid buyurtmalari va qayta buyurtma",
      pendingDeliveries: "Kutilayotgan yetkazib berishlar",
      reorderSuggestions: "Qayta buyurtma tavsiyalari",
      lowStockAlerts: "Kam qoldiq ogohlantirishlari",
      receiveFromPO: "POdan qabul qilish",
      createPO: "Yangi PO yaratish",
      noPending: "Kutilayotgan yetkazib berishlar yo'q",
      noSuggestions: "Qayta buyurtma tavsiyalari yo'q",
      critical: "Kritik",
      high: "Yuqori",
      medium: "O'rtacha",
    },
    
    fi: {
      title: "FI - Moliya",
      description: "Ombor qiymati va buxgalteriya",
      stockValuation: "Zaxira baholash",
      totalValue: "Jami qiymat",
      postMovements: "GL ga kiritish",
      inventoryVariance: "Inventarizatsiya farqlari",
      recentPostings: "So'nggi GL yozuvlari",
      postAll: "Hammasini kiritish",
      valuationMethod: "Baholash usuli",
      weightedAvg: "O'rtacha og'irlik",
      fifo: "FIFO",
    },
    
    status: {
      success: "Muvaffaqiyatli",
      error: "Xatolik",
      pending: "Kutilmoqda",
      ordered: "Buyurtma qilingan",
      approved: "Tasdiqlangan",
      received: "Qabul qilingan",
    },
  },
  ru: {
    title: "Интеграции Склада",
    subtitle: "Связь с модулями PP, MM и FI",
    languageToggle: "Переключить язык",
    refresh: "Обновить",
    
    pp: {
      title: "PP - Производство",
      description: "Управление материалами для заказов",
      ordersNeedingMaterials: "Заказы, требующие материалы",
      reserveMaterials: "Резервировать материалы",
      issueMaterials: "Выдать в производство",
      receiveGoods: "Принять готовую продукцию",
      noOrders: "Нет заказов, требующих материалы",
      viewDetails: "Подробнее",
    },
    
    mm: {
      title: "MM - Закупки",
      description: "Заказы на закупку и повторные заказы",
      pendingDeliveries: "Ожидающие поставки",
      reorderSuggestions: "Рекомендации по заказу",
      lowStockAlerts: "Предупреждения о низком запасе",
      receiveFromPO: "Принять из заказа",
      createPO: "Создать новый заказ",
      noPending: "Нет ожидающих поставок",
      noSuggestions: "Нет рекомендаций по заказу",
      critical: "Критический",
      high: "Высокий",
      medium: "Средний",
    },
    
    fi: {
      title: "FI - Финансы",
      description: "Оценка склада и бухгалтерия",
      stockValuation: "Оценка запасов",
      totalValue: "Общая стоимость",
      postMovements: "Провести в ГК",
      inventoryVariance: "Расхождения инвентаризации",
      recentPostings: "Последние проводки",
      postAll: "Провести все",
      valuationMethod: "Метод оценки",
      weightedAvg: "Средневзвешенный",
      fifo: "FIFO",
    },
    
    status: {
      success: "Успешно",
      error: "Ошибка",
      pending: "Ожидание",
      ordered: "Заказано",
      approved: "Одобрено",
      received: "Получено",
    },
  },
};

export default function WarehouseIntegrations() {
  const [lang, setLang] = useState<"uz" | "ru">("uz");
  const t = translations[lang];
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: summary, isLoading: summaryLoading, refetch: refetchSummary, isError} = useQuery<IntegrationSummary>({
    queryKey: ["/api/warehouse/integration/summary"],
  });

  const { data: pendingDeliveries, isLoading: pendingLoading } = useQuery<{ pendingDeliveries: PendingDelivery[] }>({
    queryKey: ["/api/warehouse/integration/mm/pending-deliveries"],
  });

  const { data: reorderData, isLoading: reorderLoading } = useQuery<{ 
    suggestions: ReorderSuggestion[]; 
    criticalCount: number; 
    highCount: number;
  }>({
    queryKey: ["/api/warehouse/integration/mm/reorder-suggestions"],
  });

  const { data: valuationData, isLoading: valuationLoading } = useQuery<StockValuation>({
    queryKey: ["/api/warehouse/integration/fi/stock-valuation"],
  });

  const toggleLanguage = () => {
    setLang(prev => prev === "uz" ? "ru" : "uz");
  };

  const handleRefreshAll = () => {
    refetchSummary();
    queryClient.invalidateQueries({ queryKey: ["/api/warehouse/integration"] });
    toast({
      title: t.status.success,
      description: lang === "uz" ? "Ma'lumotlar yangilandi" : "Данные обновлены",
    });
  };


  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500/20 text-red-400 border-red-500/40";
      case "high":
        return "bg-orange-500/20 text-orange-400 border-orange-500/40";
      case "medium":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/40";
      default:
        return "bg-gray-500/20 text-on-surface-variant border-gray-500/40";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ordered":
      case "approved":
        return "bg-blue-500/20 text-blue-400 border-blue-500/40";
      case "received":
        return "bg-green-500/20 text-green-400 border-green-500/40";
      case "partial":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/40";
      default:
        return "bg-gray-500/20 text-on-surface-variant border-gray-500/40";
    }
  };

  if (isError) {
    return <ErrorState onRetry={refetchSummary} />;
  }

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-3" data-testid="text-page-title">
            <WarehouseIcon className="h-7 w-7 text-yellow-500" />
            {t.title}
          </h1>
          <p className="text-muted-foreground mt-1">{t.subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleLanguage}
            data-testid="button-toggle-language"
          >
            <Languages className="h-4 w-4 mr-2" />
            {lang === "uz" ? "RU" : "UZ"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshAll}
            data-testid="button-refresh-all"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {t.refresh}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="bg-gradient-to-br from-green-900/30 to-green-950/30 border-green-700/30">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-lg flex items-center gap-2 text-green-400">
                <Factory className="h-5 w-5" />
                {t.pp.title}
              </CardTitle>
              {summaryLoading ? (
                <Skeleton className="h-6 w-12" />
              ) : (
                <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/40">
                  {summary?.pp?.ordersNeedingMaterials || 0}
                </Badge>
              )}
            </div>
            <CardDescription className="text-green-300/70">{t.pp.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t.pp.ordersNeedingMaterials}</span>
              <span className="font-medium text-foreground">{summary?.pp?.ordersNeedingMaterials || 0}</span>
            </div>
            <Separator className="bg-green-700/30" />
            <div className="space-y-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start border-green-700/50 hover:bg-green-900/30"
                data-testid="button-pp-reserve"
                onClick={() => { toast({ title: t.pp.reserveMaterials, description: lang === "uz" ? "Material zaxiralash jarayoni boshlandi" : "Процесс резервирования материалов начат" }); }}
              >
                <ClipboardList className="h-4 w-4 mr-2 text-green-400" />
                {t.pp.reserveMaterials}
                <ChevronRight className="h-4 w-4 ml-auto" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start border-green-700/50 hover:bg-green-900/30"
                data-testid="button-pp-issue"
                onClick={() => { toast({ title: t.pp.issueMaterials, description: lang === "uz" ? "Ishlab chiqarishga berish jarayoni boshlandi" : "Процесс выдачи на производство начат" }); }}
              >
                <ArrowRightLeft className="h-4 w-4 mr-2 text-green-400" />
                {t.pp.issueMaterials}
                <ChevronRight className="h-4 w-4 ml-auto" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start border-green-700/50 hover:bg-green-900/30"
                data-testid="button-pp-receive"
                onClick={() => { toast({ title: t.pp.receiveGoods, description: lang === "uz" ? "Tayyor mahsulot qabul qilish boshlandi" : "Приёмка готовой продукции начата" }); }}
              >
                <FileCheck className="h-4 w-4 mr-2 text-green-400" />
                {t.pp.receiveGoods}
                <ChevronRight className="h-4 w-4 ml-auto" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-900/30 to-yellow-950/30 border-yellow-700/30">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-lg flex items-center gap-2 text-yellow-400">
                <Truck className="h-5 w-5" />
                {t.mm.title}
              </CardTitle>
              {summaryLoading ? (
                <Skeleton className="h-6 w-12" />
              ) : (
                <div className="flex gap-2">
                  <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/40">
                    {summary?.mm?.pendingDeliveries || 0}
                  </Badge>
                  {(summary?.mm?.lowStockAlerts || 0) > 0 && (
                    <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/40">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      {summary?.mm?.lowStockAlerts}
                    </Badge>
                  )}
                </div>
              )}
            </div>
            <CardDescription className="text-yellow-300/70">{t.mm.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t.mm.pendingDeliveries}</span>
              <span className="font-medium text-foreground">{pendingDeliveries?.pendingDeliveries?.length || 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t.mm.lowStockAlerts}</span>
              <span className="font-medium text-red-400">{reorderData?.criticalCount || 0}</span>
            </div>
            <Separator className="bg-yellow-700/30" />
            {pendingLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (pendingDeliveries?.pendingDeliveries?.length || 0) > 0 ? (
              <ScrollArea className="h-[120px]">
                <div className="space-y-2 pr-3">
                  {pendingDeliveries?.pendingDeliveries?.slice(0, 3).map((po) => (
                    <div 
                      key={po.id} 
                      className="flex items-center justify-between p-2 rounded-md bg-yellow-900/20 border border-yellow-700/30"
                      data-testid={`row-pending-po-${po.id}`}
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground">{po.poNumber}</span>
                        <span className="text-xs text-muted-foreground">{po.vendorName}</span>
                      </div>
                      <Badge className={getStatusColor(po.status)} variant="outline">
                        {po.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">{t.mm.noPending}</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-900/30 to-blue-950/30 border-blue-700/30">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-lg flex items-center gap-2 text-blue-400">
                <DollarSign className="h-5 w-5" />
                {t.fi.title}
              </CardTitle>
              {summaryLoading ? (
                <Skeleton className="h-6 w-12" />
              ) : (
                <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/40">
                  {summary?.fi?.recentTransactions || 0}
                </Badge>
              )}
            </div>
            <CardDescription className="text-blue-300/70">{t.fi.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t.fi.totalValue}</span>
              {valuationLoading ? (
                <Skeleton className="h-4 w-24" />
              ) : (
                <span className="font-medium text-foreground">
                  {formatCurrency(valuationData?.totalValue || 0)}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t.fi.valuationMethod}</span>
              <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
                {valuationData?.valuationMethod === "last_purchase" ? t.fi.fifo : t.fi.weightedAvg}
              </Badge>
            </div>
            <Separator className="bg-blue-700/30" />
            <div className="space-y-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start border-blue-700/50 hover:bg-blue-900/30"
                data-testid="button-fi-valuation"
                onClick={() => { toast({ title: t.fi.stockValuation, description: lang === "uz" ? `Umumiy qiymat: ${formatCurrency(valuationData?.totalValue || 0)}` : `Общая стоимость: ${formatCurrency(valuationData?.totalValue || 0)}` }); }}
              >
                <TrendingUp className="h-4 w-4 mr-2 text-blue-400" />
                {t.fi.stockValuation}
                <ChevronRight className="h-4 w-4 ml-auto" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start border-blue-700/50 hover:bg-blue-900/30"
                data-testid="button-fi-post"
                onClick={() => { toast({ title: t.fi.postMovements, description: lang === "uz" ? "Bosh kitobga o'tkazish boshlandi" : "Проводка в главную книгу начата" }); }}
              >
                <Play className="h-4 w-4 mr-2 text-blue-400" />
                {t.fi.postMovements}
                <ChevronRight className="h-4 w-4 ml-auto" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start border-blue-700/50 hover:bg-blue-900/30"
                data-testid="button-fi-variance"
                onClick={() => { toast({ title: t.fi.inventoryVariance, description: lang === "uz" ? "Inventarizatsiya farqlari tahlil qilinmoqda" : "Анализ расхождений инвентаризации" }); }}
              >
                <ArrowRightLeft className="h-4 w-4 mr-2 text-blue-400" />
                {t.fi.inventoryVariance}
                <ChevronRight className="h-4 w-4 ml-auto" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            {t.mm.reorderSuggestions}
          </CardTitle>
          <CardDescription>
            {lang === "uz" ? "Minimal qoldiqdan kam bo'lgan materiallar" : "Материалы ниже минимального запаса"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reorderLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (reorderData?.suggestions?.length || 0) > 0 ? (
            <ScrollArea className="h-[300px]">
              <div className="space-y-2 pr-3">
                {reorderData?.suggestions?.map((item) => (
                  <div 
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-md bg-card border hover-elevate"
                    data-testid={`row-reorder-${item.id}`}
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{item.xomAshyo}</span>
                        <Badge variant="outline" className={getSeverityColor(item.severity)}>
                          {item.severity === "critical" ? t.mm.critical : 
                           item.severity === "high" ? t.mm.high : t.mm.medium}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {item.kod} • {lang === "uz" ? "Qoldiq" : "Остаток"}: {item.currentStock} / {item.minStock} {item.unitOfMeasure}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm font-medium text-foreground">
                          {lang === "uz" ? "Tavsiya" : "Рекомендация"}: {item.suggestedQuantity} {item.unitOfMeasure}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ≈ {formatCurrency(item.estimatedCost)}
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="border-yellow-700/50 hover:bg-yellow-900/30"
                        data-testid={`button-create-po-${item.id}`}
                        onClick={() => { toast({ title: t.mm.createPO, description: `${item.xomAshyo}: ${item.suggestedQuantity} ${item.unitOfMeasure} (≈ ${formatCurrency(item.estimatedCost)})` }); }}
                      >
                        {t.mm.createPO}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-8">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <p className="text-muted-foreground">{t.mm.noSuggestions}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {valuationData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-500" />
              {t.fi.stockValuation}
            </CardTitle>
            <CardDescription>
              {lang === "uz" ? `Baholash sanasi: ${valuationData.valuationDate}` : `Дата оценки: ${valuationData.valuationDate}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="p-4 rounded-lg bg-blue-900/20 border border-blue-700/30">
                <div className="text-xs text-muted-foreground mb-1">{t.fi.totalValue}</div>
                <div className="text-xl font-semibold text-blue-400">{formatCurrency(valuationData.totalValue)}</div>
              </div>
              <div className="p-4 rounded-lg bg-card border">
                <div className="text-xs text-muted-foreground mb-1">
                  {lang === "uz" ? "Jami pozitsiyalar" : "Всего позиций"}
                </div>
                <div className="text-xl font-semibold text-foreground">{valuationData.totalItems}</div>
              </div>
              {Object.entries(valuationData.byCategory || {}).slice(0, 2).map(([category, data]) => (
                <div key={category} className="p-4 rounded-lg bg-card border">
                  <div className="text-xs text-muted-foreground mb-1">{category}</div>
                  <div className="text-xl font-semibold text-foreground">{formatCurrency(data.totalValue)}</div>
                  <div className="text-xs text-muted-foreground">{data.itemCount} {lang === "uz" ? "ta" : "шт."}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
