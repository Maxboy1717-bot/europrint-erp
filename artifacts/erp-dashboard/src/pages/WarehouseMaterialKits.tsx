import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest, getQueryFn } from "@/lib/queryClient";
import { formatDateTime } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  Package, Barcode, CheckCircle, Clock, AlertTriangle, 
  Calendar, Truck, Calculator, Printer, Search, 
  RefreshCw, Languages, Filter, Box, Palette, Droplets,
  Scissors, Sparkles, Layers
} from "lucide-react";
import { ErrorState } from "@/components/ui/error-state";

interface PapkaOrder {
  id: number;
  papkaNo: string;
  zakaz: string;
  naimenovanie: string;
  tiraj: number;
  formatA: number;
  formatB: number;
  status: string;
  prioritet: number;
  createdAt: string;
}

interface MaterialKit {
  id: number;
  orderId: number;
  kitNumber: string;
  status: string;
  preparedBy: string | null;
  preparedAt: string | null;
  deliveredBy: string | null;
  deliveredAt: string | null;
  barcode: string | null;
  notes: string | null;
  createdAt: string;
  order?: PapkaOrder;
}

interface MaterialKitItem {
  id: number;
  kitId: number;
  materialType: string;
  materialName: string;
  plannedQuantity: number;
  actualQuantity: number | null;
  unit: string;
  isScanned: boolean;
  scannedAt: string | null;
  barcode: string | null;
}

const MATERIAL_ICONS: Record<string, typeof Package> = {
  kraska: Palette,
  kley: Droplets,
  skotch: Layers,
  ip: Scissors,
  tozalash: Sparkles,
  begovka: Box,
};

const MATERIAL_COLORS: Record<string, string> = {
  kraska: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  kley: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  skotch: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  ip: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  tozalash: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  begovka: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
};

const STATUS_BADGES: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string; labelRu: string }> = {
  pending: { variant: "secondary", label: "Kutilmoqda", labelRu: "Ожидает" },
  preparing: { variant: "default", label: "Tayyorlanmoqda", labelRu: "Готовится" },
  ready: { variant: "outline", label: "Tayyor", labelRu: "Готов" },
  delivered: { variant: "default", label: "Yetkazildi", labelRu: "Доставлен" },
  consumed: { variant: "secondary", label: "Ishlatildi", labelRu: "Использован" },
};

export default function WarehouseMaterialKits() {
  const [lang, setLang] = useState<"uz" | "ru">("uz");
  const [selectedTab, setSelectedTab] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKit, setSelectedKit] = useState<MaterialKit | null>(null);
  const [kitItems, setKitItems] = useState<MaterialKitItem[]>([]);
  const [showKitDialog, setShowKitDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const { toast } = useToast();

  const t = useCallback((uz: string, ru: string) => lang === "uz" ? uz : ru, [lang]);

  const { data: ordersData = [], isLoading: ordersLoading, refetch: refetchOrders, isError} = useQuery({
    queryKey: ["/api/iot-enhanced/orders-for-kits"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    refetchInterval: 60000,
  });
  const orders = ordersData as PapkaOrder[];

  const { data: kitsData = [], isLoading: kitsLoading, refetch: refetchKits } = useQuery({
    queryKey: ["/api/iot-enhanced/material-kits"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    refetchInterval: 30000,
  });
  const kits = kitsData as MaterialKit[];

  const { data: selectedKitDetail } = useQuery({
    queryKey: [`/api/warehouse/material-kits/${selectedKit?.id}`],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!selectedKit?.id,
  });

  const calculateBom = useMutation({
    mutationFn: async (orderId: number) => {
      const res = await apiRequest("POST", `/api/iot-enhanced/orders/${orderId}/calculate-bom`);
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: t("Material to'plami yaratildi!", "Комплект материалов создан!") });
      refetchKits();
      setShowCreateDialog(false);
    },
    onError: () => {
      toast({ title: t("Xatolik yuz berdi", "Произошла ошибка"), variant: "destructive" });
    },
  });

  const prepareKit = useMutation({
    mutationFn: async (kitId: number) => {
      const res = await apiRequest("PATCH", `/api/iot/material-kits/${kitId}/prepare`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: t("To'plam tayyorlanmoqda", "Комплект готовится") });
      refetchKits();
    },
  });

  const markReady = useMutation({
    mutationFn: async (kitId: number) => {
      const res = await apiRequest("PATCH", `/api/iot/material-kits/${kitId}/ready`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: t("To'plam tayyor!", "Комплект готов!") });
      refetchKits();
    },
  });

  const fetchKitItems = async (kitId: number) => {
    try {
      const res = await fetch(`/api/iot-enhanced/material-kits/${kitId}/items`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setKitItems(data);
      }
    } catch {
      setKitItems([]);
    }
  };

  const openKitDetails = async (kit: MaterialKit) => {
    setSelectedKit(kit);
    await fetchKitItems(kit.id);
    setShowKitDialog(true);
  };

  const filteredKits = (Array.isArray(kits) ? kits : []).filter(kit => {
    const matchesStatus = selectedTab === "all" || kit.status === selectedTab;
    const matchesSearch = !searchQuery || 
      kit.kitNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      kit.order?.papkaNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      kit.order?.naimenovanie?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const pendingOrders = (Array.isArray(orders) ? orders : []).filter(o => 
    !(Array.isArray(kits) ? kits : []).some(k => k.orderId === o.id) && 
    (o.status === "yangi" || o.status === "tasdiqlangan")
  );


  const getMaterialIcon = (type: string) => {
    const Icon = MATERIAL_ICONS[type.toLowerCase()] || Package;
    return Icon;
  };

  if (isError) {
    return <ErrorState onRetry={refetchOrders} />;
  }

  return (
    <div className="min-h-screen bg-background p-6" data-testid="warehouse-material-kits">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-7 w-7 text-primary" />
            {t("Ombor Material To'plamlari", "Складские комплекты материалов")}
          </h1>
          <p className="text-muted-foreground">
            {t("Ishlab chiqarish uchun material to'plamlarini tayyorlash", "Подготовка комплектов материалов для производства")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => { refetchKits(); refetchOrders(); }}
            data-testid="button-refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setLang(l => l === "uz" ? "ru" : "uz")}
            data-testid="button-lang"
          >
            <Languages className="h-5 w-5" />
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button data-testid="button-new-kit">
                <Calculator className="h-4 w-4 mr-2" />
                {t("Yangi to'plam", "Новый комплект")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{t("Buyurtma uchun material to'plami yaratish", "Создать комплект материалов для заказа")}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {t("Buyurtmani tanlang va AI avtomatik ravishda kerakli materiallarni hisoblaydi", "Выберите заказ и AI автоматически рассчитает необходимые материалы")}
                </p>
                {pendingOrders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {t("Barcha buyurtmalar uchun to'plam yaratilgan", "Для всех заказов созданы комплекты")}
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-auto">
                    {(Array.isArray(pendingOrders) ? pendingOrders : []).map(order => (
                      <Card 
                        key={order.id} 
                        className={`cursor-pointer transition-all hover-elevate ${selectedOrderId === order.id ? "ring-2 ring-primary" : ""}`}
                        onClick={() => setSelectedOrderId(order.id)}
                        data-testid={`order-select-${order.id}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{order.papkaNo}</p>
                              <p className="text-sm text-muted-foreground">{order.naimenovanie}</p>
                            </div>
                            <div className="text-right">
                              <Badge variant="outline">{order.tiraj?.toLocaleString()} {t("dona", "шт")}</Badge>
                              <p className="text-xs text-muted-foreground mt-1">
                                {order.formatA} x {order.formatB} mm
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  {t("Bekor qilish", "Отмена")}
                </Button>
                <Button 
                  onClick={() => selectedOrderId && calculateBom.mutate(selectedOrderId)}
                  disabled={!selectedOrderId || calculateBom.isPending}
                  data-testid="button-calculate-bom"
                >
                  {calculateBom.isPending ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Calculator className="h-4 w-4 mr-2" />
                  )}
                  {t("AI bilan hisoblash", "Рассчитать с AI")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card data-testid="card-pending-count">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              {t("Kutilmoqda", "Ожидает")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{(Array.isArray(kits) ? kits : []).filter(k => k.status === "pending").length}</p>
          </CardContent>
        </Card>
        <Card data-testid="card-preparing-count">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="h-4 w-4 text-blue-500" />
              {t("Tayyorlanmoqda", "Готовится")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{(Array.isArray(kits) ? kits : []).filter(k => k.status === "preparing").length}</p>
          </CardContent>
        </Card>
        <Card data-testid="card-ready-count">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              {t("Tayyor", "Готов")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{(Array.isArray(kits) ? kits : []).filter(k => k.status === "ready").length}</p>
          </CardContent>
        </Card>
        <Card data-testid="card-delivered-count">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Truck className="h-4 w-4 text-purple-500" />
              {t("Yetkazildi", "Доставлен")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{(Array.isArray(kits) ? kits : []).filter(k => k.status === "delivered").length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList>
                <TabsTrigger value="pending" data-testid="tab-pending">{t("Kutilmoqda", "Ожидает")}</TabsTrigger>
                <TabsTrigger value="preparing" data-testid="tab-preparing">{t("Tayyorlanmoqda", "Готовится")}</TabsTrigger>
                <TabsTrigger value="ready" data-testid="tab-ready">{t("Tayyor", "Готов")}</TabsTrigger>
                <TabsTrigger value="delivered" data-testid="tab-delivered">{t("Yetkazildi", "Доставлен")}</TabsTrigger>
                <TabsTrigger value="all" data-testid="tab-all">{t("Barchasi", "Все")}</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("Qidirish...", "Поиск...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {kitsLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredKits.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t("To'plamlar topilmadi", "Комплекты не найдены")}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("To'plam raqami", "Номер комплекта")}</TableHead>
                  <TableHead>{t("Buyurtma", "Заказ")}</TableHead>
                  <TableHead>{t("Mahsulot", "Продукция")}</TableHead>
                  <TableHead>{t("Tiraj", "Тираж")}</TableHead>
                  <TableHead>{t("Holat", "Статус")}</TableHead>
                  <TableHead>{t("Yaratilgan", "Создан")}</TableHead>
                  <TableHead className="text-right">{t("Amallar", "Действия")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(Array.isArray(filteredKits) ? filteredKits : []).map(kit => {
                  const statusInfo = STATUS_BADGES[kit.status] || STATUS_BADGES.pending;
                  return (
                    <TableRow key={kit.id} data-testid={`kit-row-${kit.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Barcode className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono font-medium">{kit.kitNumber}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{kit.order?.papkaNo || "-"}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{kit.order?.naimenovanie || "-"}</TableCell>
                      <TableCell>{kit.order?.tiraj?.toLocaleString() || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={statusInfo.variant}>
                          {lang === "uz" ? statusInfo.label : statusInfo.labelRu}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDateTime(kit.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {kit.status === "pending" && (
                            <Button 
                              size="sm" 
                              onClick={() => prepareKit.mutate(kit.id)}
                              disabled={prepareKit.isPending}
                              data-testid={`button-prepare-${kit.id}`}
                            >
                              {t("Tayyorlash", "Готовить")}
                            </Button>
                          )}
                          {kit.status === "preparing" && (
                            <Button 
                              size="sm" 
                              onClick={() => markReady.mutate(kit.id)}
                              disabled={markReady.isPending}
                              data-testid={`button-ready-${kit.id}`}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              {t("Tayyor", "Готов")}
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => openKitDetails(kit)}
                            data-testid={`button-details-${kit.id}`}
                          >
                            {t("Batafsil", "Подробнее")}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showKitDialog} onOpenChange={setShowKitDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {t("Material to'plami", "Комплект материалов")}: {selectedKit?.kitNumber}
            </DialogTitle>
          </DialogHeader>
          {selectedKit && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">{t("Buyurtma", "Заказ")}</Label>
                  <p className="font-medium">{selectedKit.order?.papkaNo}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{t("Mahsulot", "Продукция")}</Label>
                  <p className="font-medium">{selectedKit.order?.naimenovanie}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{t("Tiraj", "Тираж")}</Label>
                  <p className="font-medium">{selectedKit.order?.tiraj?.toLocaleString()} {t("dona", "шт")}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{t("O'lcham", "Размер")}</Label>
                  <p className="font-medium">{selectedKit.order?.formatA} x {selectedKit.order?.formatB} mm</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Box className="h-4 w-4" />
                  {t("Materiallar ro'yxati", "Список материалов")}
                </h4>
                {kitItems.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    {t("Materiallar yuklanmoqda...", "Загрузка материалов...")}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {(Array.isArray(kitItems) ? kitItems : []).map(item => {
                      const Icon = getMaterialIcon(item.materialType);
                      const colorClass = MATERIAL_COLORS[item.materialType.toLowerCase()] || "bg-surface-container-low text-on-surface";
                      const progress = item.actualQuantity ? (item.actualQuantity / item.plannedQuantity) * 100 : 0;
                      return (
                        <div 
                          key={item.id} 
                          className="flex items-center justify-between p-3 border rounded-lg"
                          data-testid={`kit-item-${item.id}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${colorClass}`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-medium">{item.materialName}</p>
                              <p className="text-sm text-muted-foreground capitalize">{item.materialType}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="font-medium">
                                {item.actualQuantity || 0} / {item.plannedQuantity} {item.unit}
                              </p>
                              <Progress value={progress} className="h-2 w-24" />
                            </div>
                            {item.isScanned ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <AlertTriangle className="h-5 w-5 text-yellow-500" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {selectedKit.barcode && (
                <div className="border-t pt-4">
                  <Label className="text-muted-foreground">{t("Shtrix kod", "Штрих-код")}</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="bg-muted px-3 py-2 rounded font-mono text-lg">{selectedKit.barcode}</code>
                    <Button size="sm" variant="outline">
                      <Printer className="h-4 w-4 mr-1" />
                      {t("Chop etish", "Печать")}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowKitDialog(false)}>
              {t("Yopish", "Закрыть")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
