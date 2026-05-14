/**
 * @module WarehouseDailyView
 * @description React page component. Route-level UI.
 */

import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest, getQueryFn } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { format, addDays } from "date-fns";
import { uz, ru } from "date-fns/locale";
import { Package, RefreshCw, Languages } from "lucide-react";
import type { DailyOrder, MaterialKit, MaterialKitItem, Equipment } from "./WarehouseDailyViewTypes";
import { DateNavigator, OrdersList } from "./WarehouseDailyViewSections";
import { CreateKitDialog, KitDetailsDialog } from "./WarehouseDailyViewDialogs";
import { EPErrorState } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

export default function WarehouseDailyView() {
  const { t } = useTranslation("common");
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

  const { data: ordersData = [], isLoading: ordersLoading, refetch: refetchOrders, isError } = useQuery({
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
      return apiRequest("POST", "/api/warehouse/material-kits", data);
    },
    onSuccess: () => {
      toast({ title: t("Material komplekti yaratildi!", "Комплект материалов создан!") });
      queryClient.invalidateQueries({ queryKey: ['/api/warehouse/orders-by-date'] });
      setShowCreateKitDialog(false);
    },
    onError: (error: Error) => {
      toast({ title: t("Xatolik", "Ошибка"), description: error.message, variant: "destructive" });
    },
  });

  const updateKitStatusMutation = useMutation({
    mutationFn: async (data: { kitId: string; status: string }) => {
      return apiRequest("PATCH", `/api/warehouse/material-kits/${data.kitId}/status`, { status: data.status });
    },
    onSuccess: () => {
      toast({ title: t("Status yangilandi", "Статус обновлён") });
      queryClient.invalidateQueries({ queryKey: ['/api/warehouse/orders-by-date'] });
      refetchOrders();
    },
  });

  const fetchKitItems = async (kit: MaterialKit) => {
    try {
      const res = await apiRequest('GET', `/api/warehouse/material-kits/${kit.id}/items`);
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
      equipmentId: selectedEquipmentId,
    });
  };

  const navigateDay = (direction: 'prev' | 'next') => {
    setSelectedDate(prev => addDays(prev, direction === 'next' ? 1 : -1));
  };

  const totalKits = (Array.isArray(orders) ? orders : []).reduce((sum, o) => sum + o.kits.length, 0);
  const readyKits = (Array.isArray(orders) ? orders : []).reduce(
    (sum, o) => sum + o.kits.filter(k => k.status === 'ready' || k.status === 'delivered').length, 0
  );

  if (isError) {
    return <EPErrorState onRetry={refetchOrders} />;
  }

  return (
    <div>
      <header className="-mx-4 -mt-4 lg:-mx-6 lg:-mt-6 border-b bg-card">
        <div className="px-4 lg:px-6 py-4">
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

      <main className="pt-6">
        <DateNavigator
          selectedDate={selectedDate}
          dateLocale={dateLocale}
          showCalendar={showCalendar}
          setShowCalendar={setShowCalendar}
          onDateSelect={(date) => { setSelectedDate(date); setShowCalendar(false); }}
          navigateDay={navigateDay}
          orders={orders}
          totalKits={totalKits}
          readyKits={readyKits}
          t={t}
        />
        <OrdersList
          orders={orders}
          ordersLoading={ordersLoading}
          onCreateKit={(order) => { setSelectedOrder(order); setShowCreateKitDialog(true); }}
          onOpenKitDetails={openKitDetails}
          onUpdateKitStatus={(kitId, status) => updateKitStatusMutation.mutate({ kitId, status })}
          t={t}
        />
      </main>

      <CreateKitDialog
        open={showCreateKitDialog}
        onOpenChange={setShowCreateKitDialog}
        selectedOrder={selectedOrder}
        scheduledTime={scheduledTime}
        setScheduledTime={setScheduledTime}
        selectedEquipmentId={selectedEquipmentId}
        setSelectedEquipmentId={setSelectedEquipmentId}
        equipment={equipment}
        onConfirm={handleCreateKit}
        isPending={createKitMutation.isPending}
        t={t}
      />

      <KitDetailsDialog
        open={showKitDetailsDialog}
        onOpenChange={setShowKitDetailsDialog}
        selectedKit={selectedKit}
        kitItems={kitItems}
        t={t}
      />
    </div>
  );
}
