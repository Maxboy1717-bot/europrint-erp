import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest, getQueryFn } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { format, addDays } from "date-fns";
import { uz, ru } from "date-fns/locale";
import { 
  Package, Barcode, CheckCircle, Clock, AlertTriangle, 
  Calendar as CalendarIcon, Truck, Calculator, Printer, 
  RefreshCw, Languages, Box, Layers, ArrowRight, ChevronLeft, ChevronRight,
  PackagePlus, ClipboardCheck, Timer, Factory, Scan
} from "lucide-react";
import { ErrorState } from "@/components/ui/error-state";

interface DailyOrder {
  id: string;
  papkaNo: string;
  mijozNomi: string;
  mahsulotNomi: string;
  tiraj: number;
  formatA: number;
  formatB: number;
  mahsulotTuri: string;
  status: string;
  kits: MaterialKit[];
  totalMaterials: number;
  preparedMaterials: number;
}

interface MaterialKit {
  id: string;
  kitNumber: string;
  orderId: string;
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'confirmed' | 'consumed';
  barcode: string;
  scheduledDate: string;
  scheduledTime: string;
  preparedBy: string | null;
  preparedAt: string | null;
  deliveredBy: string | null;
  deliveredAt: string | null;
  createdAt: string;
}

interface MaterialKitItem {
  id: string;
  kitId: string;
  materialName: string;
  requiredQuantity: number;
  actualQuantity: number | null;
  unit: string;
  isScanned: boolean;
  scannedAt: string | null;
  itemBarcode: string;
}

interface Equipment {
  id: string;
  equipmentNumber: string;
  name: string;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string; labelRu: string }> = {
  pending: { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-800 dark:text-yellow-200", label: "Kutilmoqda", labelRu: "Ожидает" },
  preparing: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-800 dark:text-blue-200", label: "Tayyorlanmoqda", labelRu: "Готовится" },
  ready: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-800 dark:text-green-200", label: "Tayyor", labelRu: "Готов" },
  delivered: { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-800 dark:text-purple-200", label: "Yetkazildi", labelRu: "Доставлен" },
  confirmed: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-800 dark:text-emerald-200", label: "Tasdiqlangan", labelRu: "Подтверждён" },
  consumed: { bg: "bg-surface-container-low dark:bg-gray-900/30", text: "text-on-surface dark:text-gray-200", label: "Ishlatildi", labelRu: "Использован" },
};

export default function WarehouseDailyView() {
  const [lang, setLang] = useState<"uz" | "ru">("uz");
  const [selectedDate, setSelectedDate] = useState<Date>(addDays(new Date(), 1));
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<DailyOrder | null>(null);
  const [showCreateKitDialog, setShowCreateKitDialog] = useState(false);
  const [showKitDetailsDialog, setShowKitDetailsDialog] = useState(false);
  const [selectedKit, setSelectedKit] = useState<MaterialKit | null>(null);
  const [kitItems, setKitItems] = useState<MaterialKitItem[]>([]);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>("");
  const [scheduledTime, setScheduledTime] = useState("08:00");
  const { toast } = useToast();

  const t = useCallback((uz: string, ru: string) => lang === "uz" ? uz : ru, [lang]);
  const dateLocale = lang === "uz" ? uz : ru;
  const formattedDate = format(selectedDate, "yyyy-MM-dd");

  const { data: ordersData = [], isLoading: ordersLoading, refetch: refetchOrders, isError} = useQuery({
    queryKey: ['/api/warehouse/orders-by-date', formattedDate],
    queryFn: getQueryFn({ on401: "returnNull" }),
    refetchInterval: 30000,
  });
  const orders = ordersData as DailyOrder[];

  const { data: equipmentData = [] } = useQuery({
    queryKey: ['/api/equipment'],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });
  const equipment = equipmentData as Equipment[];

  const createKitMutation = useMutation({
    mutationFn: async (data: { orderId: string; scheduledDate: string; scheduledTime: string; equipmentId: string }) => {
      const res = await apiRequest("POST", "/api/warehouse/material-kits", data);
      return res;
    },
    onSuccess: () => {
      toast({ title: t("Material komplekti yaratildi!", "Комплект материалов создан!") });
      queryClient.invalidateQueries({ queryKey: ['/api/warehouse/orders-by-date'] });
      setShowCreateKitDialog(false);
    },
    onError: (error: Error) => {
      toast({ title: t("Xatolik", "Ошибка"), description: error.message, variant: "destructive" });
    }
  });

  const updateKitStatusMutation = useMutation({
    mutationFn: async (data: { kitId: string; status: string }) => {
      const res = await apiRequest("PATCH", `/api/warehouse/material-kits/${data.kitId}/status`, { status: data.status });
      return res;
    },
    onSuccess: () => {
      toast({ title: t("Status yangilandi", "Статус обновлён") });
      queryClient.invalidateQueries({ queryKey: ['/api/warehouse/orders-by-date'] });
      refetchOrders();
    }
  });

  const fetchKitItems = async (kit: MaterialKit) => {
    try {
      const res = await fetch(`/api/warehouse/material-kits/${kit.id}/items`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setKitItems(data);
      }
    } catch {
      setKitItems([]);
    }
  };

  const openKitDetails = (kit: MaterialKit) => {
    setSelectedKit(kit);
    fetchKitItems(kit);
    setShowKitDetailsDialog(true);
  };

  const handleCreateKit = () => {
    if (!selectedOrder) return;
    createKitMutation.mutate({
      orderId: selectedOrder.id,
      scheduledDate: formattedDate,
      scheduledTime,
      equipmentId: selectedEquipmentId
    });
  };

  const navigateDay = (direction: 'prev' | 'next') => {
    setSelectedDate(prev => addDays(prev, direction === 'next' ? 1 : -1));
  };

  const totalKits = (Array.isArray(orders) ? orders : []).reduce((sum, o) => sum + o.kits.length, 0);
  const readyKits = (Array.isArray(orders) ? orders : []).reduce((sum, o) => sum + o.kits.filter(k => k.status === 'ready' || k.status === 'delivered').length, 0);

  if (isError) {
    return <ErrorState onRetry={refetchOrders} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold">{t("Ombor Kunlik Rejasi", "Складской Дневной План")}</h1>
                <p className="text-sm text-muted-foreground">
                  {t("1 kun oldin materiallarni tayyorlash", "Подготовка материалов за 1 день")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => refetchOrders()} data-testid="button-refresh">
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setLang(l => l === "uz" ? "ru" : "uz")}
                data-testid="button-language"
              >
                <Languages className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => navigateDay('prev')} data-testid="button-prev-day">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Popover open={showCalendar} onOpenChange={setShowCalendar}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="min-w-[200px] justify-start gap-2" data-testid="button-calendar">
                  <CalendarIcon className="h-4 w-4" />
                  {format(selectedDate, "PPP", { locale: dateLocale })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (date) {
                      setSelectedDate(date);
                      setShowCalendar(false);
                    }
                  }}
                  locale={dateLocale}
                />
              </PopoverContent>
            </Popover>
            <Button variant="outline" size="icon" onClick={() => navigateDay('next')} data-testid="button-next-day">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="secondary">{orders.length}</Badge>
              <span className="text-muted-foreground">{t("buyurtma", "заказов")}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="secondary">{totalKits}</Badge>
              <span className="text-muted-foreground">{t("komplekt", "комплектов")}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="default">{readyKits}</Badge>
              <span className="text-muted-foreground">{t("tayyor", "готово")}</span>
            </div>
          </div>
        </div>

        {ordersLoading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-20">
              <Box className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">{t("Bu kunga buyurtmalar yo'q", "Нет заказов на этот день")}</p>
              <p className="text-sm text-muted-foreground">
                {t("Boshqa sanani tanlang yoki yangi komplekt yarating", "Выберите другую дату или создайте новый комплект")}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {(Array.isArray(orders) ? orders : []).map((order) => (
              <Card key={order.id} className="overflow-hidden" data-testid={`card-order-${order.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <span className="font-mono text-primary">{order.papkaNo}</span>
                        <Badge variant="outline">{order.status}</Badge>
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {order.mijozNomi} • {order.mahsulotNomi}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right text-sm">
                        <div className="font-medium">{order.tiraj?.toLocaleString()} {t("dona", "шт")}</div>
                        <div className="text-muted-foreground">
                          {order.formatA} × {order.formatB} mm
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {order.kits.length === 0 ? (
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        <span className="text-sm">{t("Material komplekti yaratilmagan", "Комплект материалов не создан")}</span>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowCreateKitDialog(true);
                        }}
                        data-testid={`button-create-kit-${order.id}`}
                      >
                        <PackagePlus className="h-4 w-4 mr-2" />
                        {t("Komplekt yaratish", "Создать комплект")}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(Array.isArray(order.kits) ? order.kits : []).map((kit) => {
                        const statusInfo = STATUS_COLORS[kit.status] || STATUS_COLORS.pending;
                        return (
                          <div 
                            key={kit.id} 
                            className={`p-4 border rounded-lg ${statusInfo.bg} cursor-pointer hover-elevate`}
                            onClick={() => openKitDetails(kit)}
                            data-testid={`card-kit-${kit.id}`}
                          >
                            <div className="flex items-center justify-between gap-4 flex-wrap">
                              <div className="flex items-center gap-3">
                                <Barcode className="h-5 w-5" />
                                <div>
                                  <div className="font-mono font-medium">{kit.kitNumber}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {kit.scheduledTime && `${kit.scheduledTime} •`} {format(new Date(kit.createdAt), "dd.MM.yyyy HH:mm")}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className={`${statusInfo.bg} ${statusInfo.text}`}>
                                  {t(statusInfo.label, statusInfo.labelRu)}
                                </Badge>
                                {kit.status === 'pending' && (
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateKitStatusMutation.mutate({ kitId: kit.id, status: 'preparing' });
                                    }}
                                    data-testid={`button-start-preparing-${kit.id}`}
                                  >
                                    {t("Tayyorlashni boshlash", "Начать подготовку")}
                                  </Button>
                                )}
                                {kit.status === 'preparing' && (
                                  <Button 
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateKitStatusMutation.mutate({ kitId: kit.id, status: 'ready' });
                                    }}
                                    data-testid={`button-mark-ready-${kit.id}`}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    {t("Tayyor", "Готов")}
                                  </Button>
                                )}
                                {kit.status === 'ready' && (
                                  <Button 
                                    size="sm" 
                                    variant="secondary"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateKitStatusMutation.mutate({ kitId: kit.id, status: 'delivered' });
                                    }}
                                    data-testid={`button-deliver-${kit.id}`}
                                  >
                                    <Truck className="h-4 w-4 mr-2" />
                                    {t("Yetkazish", "Доставить")}
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowCreateKitDialog(true);
                        }}
                        data-testid={`button-add-kit-${order.id}`}
                      >
                        <PackagePlus className="h-4 w-4 mr-2" />
                        {t("Qo'shimcha komplekt", "Добавить комплект")}
                      </Button>
                    </div>
                  )}
                </CardContent>
                {order.kits.length > 0 && (
                  <CardFooter className="border-t pt-4">
                    <div className="flex items-center gap-4 w-full">
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-muted-foreground">{t("Material tayyor", "Материалы готовы")}</span>
                          <span className="font-medium">{order.preparedMaterials} / {order.totalMaterials}</span>
                        </div>
                        <Progress 
                          value={order.totalMaterials > 0 ? (order.preparedMaterials / order.totalMaterials) * 100 : 0} 
                          className="h-2"
                        />
                      </div>
                    </div>
                  </CardFooter>
                )}
              </Card>
            ))}
          </div>
        )}
      </main>

      <Dialog open={showCreateKitDialog} onOpenChange={setShowCreateKitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Material Komplekti Yaratish", "Создание Комплекта Материалов")}</DialogTitle>
            <DialogDescription>
              {selectedOrder && (
                <span className="font-mono">{selectedOrder.papkaNo} - {selectedOrder.mahsulotNomi}</span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t("Ishlab chiqarish vaqti", "Время производства")}</Label>
              <Input 
                type="time" 
                value={scheduledTime} 
                onChange={(e) => setScheduledTime(e.target.value)}
                data-testid="input-scheduled-time"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("Uskuna", "Оборудование")}</Label>
              <Select value={selectedEquipmentId} onValueChange={setSelectedEquipmentId}>
                <SelectTrigger data-testid="select-equipment">
                  <SelectValue placeholder={t("Uskunani tanlang", "Выберите оборудование")} />
                </SelectTrigger>
                <SelectContent>
                  {(Array.isArray(equipment) ? equipment : []).map((eq) => (
                    <SelectItem key={eq.id} value={eq.id}>{eq.equipmentNumber} - {eq.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <Calculator className="h-4 w-4" />
                <span>{t("AI avtomatik materiallarni hisoblaydi", "AI автоматически рассчитает материалы")}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateKitDialog(false)}>
              {t("Bekor qilish", "Отмена")}
            </Button>
            <Button 
              onClick={handleCreateKit}
              disabled={createKitMutation.isPending}
              data-testid="button-confirm-create-kit"
            >
              {createKitMutation.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <PackagePlus className="h-4 w-4 mr-2" />
              )}
              {t("Yaratish", "Создать")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showKitDetailsDialog} onOpenChange={setShowKitDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {selectedKit?.kitNumber}
            </DialogTitle>
            <DialogDescription>
              {t("Material komplekti tafsilotlari", "Детали комплекта материалов")}
            </DialogDescription>
          </DialogHeader>
          {selectedKit && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="text-sm text-muted-foreground">{t("Status", "Статус")}</div>
                  <Badge className={`mt-1 ${STATUS_COLORS[selectedKit.status]?.bg} ${STATUS_COLORS[selectedKit.status]?.text}`}>
                    {t(STATUS_COLORS[selectedKit.status]?.label, STATUS_COLORS[selectedKit.status]?.labelRu)}
                  </Badge>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-sm text-muted-foreground">{t("Shtrix-kod", "Штрих-код")}</div>
                  <div className="font-mono font-bold mt-1 flex items-center gap-2">
                    <Barcode className="h-4 w-4" />
                    {selectedKit.barcode}
                  </div>
                </div>
              </div>

              <div className="border rounded-lg">
                <div className="p-3 border-b bg-muted/50">
                  <h4 className="font-medium flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    {t("Materiallar", "Материалы")} ({kitItems.length})
                  </h4>
                </div>
                <ScrollArea className="h-[300px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("Material", "Материал")}</TableHead>
                        <TableHead className="text-right">{t("Kerakli", "Требуется")}</TableHead>
                        <TableHead className="text-center">{t("Shtrix-kod", "Штрих-код")}</TableHead>
                        <TableHead className="text-center">{t("Skanerlangan", "Отсканирован")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(Array.isArray(kitItems) ? kitItems : []).map((item) => (
                        <TableRow key={item.id} className={item.isScanned ? "bg-green-50 dark:bg-green-950/20" : ""}>
                          <TableCell className="font-medium">{item.materialName}</TableCell>
                          <TableCell className="text-right">{item.requiredQuantity} {item.unit}</TableCell>
                          <TableCell className="text-center font-mono text-xs">{item.itemBarcode}</TableCell>
                          <TableCell className="text-center">
                            {item.isScanned ? (
                              <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                            ) : (
                              <Clock className="h-5 w-5 text-yellow-500 mx-auto" />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {kitItems.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                            {t("Materiallar yuklanmoqda...", "Загрузка материалов...")}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>

              <div className="flex items-center gap-2 p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/30">
                <Printer className="h-5 w-5 text-blue-500" />
                <span className="text-sm flex-1">{t("Shtrix-kodni chop etish uchun bosing", "Нажмите для печати штрих-кода")}</span>
                <Button size="sm" variant="outline" onClick={() => window.print()} data-testid="button-print-barcode">
                  <Printer className="h-4 w-4 mr-2" />
                  {t("Chop etish", "Печать")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
