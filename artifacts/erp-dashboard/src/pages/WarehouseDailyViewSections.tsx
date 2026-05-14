/**
 * @module WarehouseDailyViewSections
 * @description Section components for WarehouseDailyView page.
 */

import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Package, Barcode, CheckCircle, AlertTriangle,
  Calendar as CalendarIcon, Truck,
  RefreshCw, Box, ChevronLeft, ChevronRight,
  PackagePlus
} from "lucide-react";
import type { DailyOrder, MaterialKit } from "./WarehouseDailyViewTypes";
import { STATUS_COLORS } from "./WarehouseDailyViewTypes";
import { EPStatusPill } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

interface DateNavigatorProps {
  selectedDate: Date;
  dateLocale: Locale;
  showCalendar: boolean;
  setShowCalendar: (v: boolean) => void;
  onDateSelect: (d: Date) => void;
  navigateDay: (dir: 'prev' | 'next') => void;
  orders: DailyOrder[];
  totalKits: number;
  readyKits: number;
  t: (uz: string, ru: string) => string;
}

export function DateNavigator({
  selectedDate, dateLocale, showCalendar, setShowCalendar,
  onDateSelect, navigateDay, orders, totalKits, readyKits, t,
}: DateNavigatorProps) {
  const { t } = useTranslation("common");
  return (
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
              onSelect={(date) => { if (date) { onDateSelect(date); } }}
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
          <EPStatusPill tone="neutral">{orders.length}</EPStatusPill>
          <span className="text-muted-foreground">{t("buyurtma", "заказов")}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <EPStatusPill tone="neutral">{totalKits}</EPStatusPill>
          <span className="text-muted-foreground">{t("komplekt", "комплектов")}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <EPStatusPill tone="success">{readyKits}</EPStatusPill>
          <span className="text-muted-foreground">{t("tayyor", "готово")}</span>
        </div>
      </div>
    </div>
  );
}

interface OrderCardProps {
  order: DailyOrder;
  onCreateKit: (order: DailyOrder) => void;
  onOpenKitDetails: (kit: MaterialKit) => void;
  onUpdateKitStatus: (kitId: string, status: string) => void;
  t: (uz: string, ru: string) => string;
}

export function OrderCard({ order, onCreateKit, onOpenKitDetails, onUpdateKitStatus, t }: OrderCardProps) {
  return (
    <Card className="overflow-hidden" data-testid={`card-order-${order.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2 text-[14px] font-semibold">
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
              <div className="text-muted-foreground">{order.formatA} × {order.formatB} mm</div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {order.kits.length === 0 ? (
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-4 w-4 text-[var(--ep-yellow)]" />
              <span className="text-sm">{t("Material komplekti yaratilmagan", "Комплект материалов не создан")}</span>
            </div>
            <Button
              size="sm"
              onClick={() => onCreateKit(order)}
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
                  onClick={() => onOpenKitDetails(kit)}
                  data-testid={`card-kit-${kit.id}`}
                >
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                      <Barcode className="h-4 w-4" />
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
                          onClick={(e) => { e.stopPropagation(); onUpdateKitStatus(kit.id, 'preparing'); }}
                          data-testid={`button-start-preparing-${kit.id}`}
                        >
                          {t("Tayyorlashni boshlash", "Начать подготовку")}
                        </Button>
                      )}
                      {kit.status === 'preparing' && (
                        <Button
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); onUpdateKitStatus(kit.id, 'ready'); }}
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
                          onClick={(e) => { e.stopPropagation(); onUpdateKitStatus(kit.id, 'delivered'); }}
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
              onClick={() => onCreateKit(order)}
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
  );
}

interface OrdersListProps {
  orders: DailyOrder[];
  ordersLoading: boolean;
  onCreateKit: (order: DailyOrder) => void;
  onOpenKitDetails: (kit: MaterialKit) => void;
  onUpdateKitStatus: (kitId: string, status: string) => void;
  t: (uz: string, ru: string) => string;
}

export function OrdersList({ orders, ordersLoading, onCreateKit, onOpenKitDetails, onUpdateKitStatus, t }: OrdersListProps) {
  if (ordersLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-20">
          <Box className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">{t("Bu kunga buyurtmalar yo'q", "Нет заказов на этот день")}</p>
          <p className="text-sm text-muted-foreground">
            {t("Boshqa sanani tanlang yoki yangi komplekt yarating", "Выберите другую дату или создайте новый комплект")}
          </p>
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="grid gap-4">
      {(Array.isArray(orders) ? orders : []).map((order) => (
        <OrderCard
          key={order.id}
          order={order}
          onCreateKit={onCreateKit}
          onOpenKitDetails={onOpenKitDetails}
          onUpdateKitStatus={onUpdateKitStatus}
          t={t}
        />
      ))}
    </div>
  );
}
