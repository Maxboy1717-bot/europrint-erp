/**
 * @module IoTSchedulePanel
 * @description React page component. Route-level UI.
 */

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Play, Languages, LogOut, Settings, Barcode, Calendar, ListTodo } from "lucide-react";
import { UseMutationResult } from "@tanstack/react-query";
import { ProductionOrder, Equipment, ProductionSession, IotLang } from "./iot-types";
import { EPPageHeader, EPLoader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

interface IoTSchedulePanelProps {
  lang: IotLang;
  setLang: (l: IotLang) => void;
  workerName: string;
  currentDate: string;
  currentTime: string;
  assignedEquipment: Equipment | null;
  equipmentList: Equipment[];
  selectedEquipment: Equipment | null;
  setSelectedEquipment: (eq: Equipment | null) => void;
  ordersLoading: boolean;
  displayOrders: ProductionOrder[];
  selectedOrder: ProductionOrder | null;
  setSelectedOrder: (o: ProductionOrder | null) => void;
  handleLogout: () => void;
  createSession: UseMutationResult<ProductionSession, Error, void, unknown>;
}

export function IoTSchedulePanel({
  lang, setLang, workerName, currentDate, currentTime,
  assignedEquipment, equipmentList, selectedEquipment, setSelectedEquipment,
  ordersLoading, displayOrders, selectedOrder, setSelectedOrder,
  handleLogout, createSession,
}: IoTSchedulePanelProps) {
  const { t } = useTranslation("common");
  const t = (uz: string, ru: string) => lang === "uz" ? uz : ru;

  return (
    <div className="min-h-screen bg-background font-inter" data-testid="iot-tablet-schedule">
      <div className="bg-primary text-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-card/10 flex items-center justify-center border border-white/20 shadow-inner">
              <span className="text-2xl font-bold">{(workerName ?? "?").charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <p className="font-bold text-xl tracking-tight">{workerName}</p>
              <p className="text-sm opacity-90 font-medium">{currentDate}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right mr-2">
              <p className="text-4xl font-mono font-black tracking-tighter">{currentTime}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" className="text-white hover:bg-card/10 rounded-full h-12 w-12" onClick={() => setLang(lang === "uz" ? "ru" : "uz")} data-testid="button-lang-schedule">
                <Languages className="h-6 w-6" />
              </Button>
              <Button variant="ghost" size="icon" className="text-white hover:bg-card/10 rounded-full h-12 w-12" onClick={handleLogout} data-testid="button-logout">
                <LogOut className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-6">
        {assignedEquipment && (
          <div className="bg-card rounded-xl p-5 border-l-4 border-green-500 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-green-50 flex items-center justify-center shadow-sm">
                <Settings className="h-8 w-8 text-[var(--ep-green)]" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t("Sizga tayinlangan uskuna", "Закрепленное за вами оборудование")}</p>
                <p className="text-2xl font-bold text-foreground tracking-tight">
                  {lang === "ru" && assignedEquipment.nameRu ? assignedEquipment.nameRu : assignedEquipment.name}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 mb-2">
          <div className="h-8 w-1.5 bg-primary rounded-full" />
          <EPPageHeader
        breadcrumb={<>{t("dashboard9")}<b className="text-foreground">{t("ishlabChiqarishRejangiz")}</b></>}
        title={t("ishlabChiqarishRejangiz")}
      />
        </div>

        {!assignedEquipment && (
          <div className="bg-card rounded-xl p-6 border border-border shadow-sm space-y-4">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("Uskuna tanlang", "Выберите оборудование")}</Label>
            <Select onValueChange={v => setSelectedEquipment((Array.isArray(equipmentList) ? equipmentList : []).find(e => e.id === v) || null)}>
              <SelectTrigger className="h-14 text-lg bg-background border-border text-foreground rounded-xl focus:ring-primary" data-testid="select-equipment-schedule">
                <SelectValue placeholder={t("Uskunani tanlang", "Выберите оборудование")} />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {(Array.isArray(equipmentList) ? equipmentList : []).map(eq => (
                  <SelectItem key={eq.id} value={eq.id} className="text-lg py-3 focus:bg-muted">{lang === "ru" && eq.nameRu ? eq.nameRu : eq.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {ordersLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <EPLoader size={48} />
            <p className="text-muted-foreground font-medium">{t("Reja yuklanmoqda...", "Загрузка плана...")}</p>
          </div>
        ) : displayOrders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg text-muted-foreground">{t("Bugun uchun vazifalar yo'q", "Нет задач на сегодня")}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4 pb-24">
            {(Array.isArray(displayOrders) ? displayOrders : []).map((order, index) => (
              <Card
                key={order.id}
                className={`cursor-pointer transition-all duration-200 border-none rounded-xl overflow-hidden shadow-sm hover:shadow-md ${selectedOrder?.id === order.id ? "ring-2 ring-primary bg-muted" : "bg-card hover:bg-muted/40"}`}
                onClick={() => setSelectedOrder(order)}
                data-testid={`card-schedule-order-${order.id}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex items-center gap-5">
                      <div className={`h-14 w-14 rounded-xl flex items-center justify-center text-xl font-black shadow-inner ${selectedOrder?.id === order.id ? "bg-primary text-white" : "bg-muted/60 text-muted-foreground"}`}>
                        {index + 1}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <p className="text-2xl font-bold text-primary tracking-tight">{order.orderNumber}</p>
                          {(order.priority || 5) <= 1 && (
                            <span className="bg-red-100 text-red-800 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider">
                              {t("Shoshilinch", "Срочный")}
                            </span>
                          )}
                        </div>
                        <p className="text-lg font-medium text-foreground leading-tight">{lang === "ru" && order.productNameRu ? order.productNameRu : order.productName}</p>
                      </div>
                    </div>
                    <div className="text-right space-y-1 bg-muted/40 px-4 py-2 rounded-xl border border-border/30">
                      <p className="text-3xl font-black text-foreground tracking-tighter">{(order.quantity || 0).toLocaleString()}</p>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("dona", "шт")}</p>
                    </div>
                  </div>
                  <div className="mt-5 pt-5 border-t border-border/30 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-6">
                      {order.setupTimeMinutes && (
                        <div className="flex items-center gap-2 text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-lg border border-border/20">
                          <Settings className="h-4 w-4" />
                          <span className="text-sm font-semibold">{order.setupTimeMinutes} {t("min sozlash", "мин настройка")}</span>
                        </div>
                      )}
                      {order.barcode && (
                        <div className="flex items-center gap-2 text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-lg border border-border/20">
                          <Barcode className="h-4 w-4" />
                          <span className="font-mono text-sm font-bold tracking-widest">{order.barcode}</span>
                        </div>
                      )}
                    </div>
                    <Badge variant={(order.priority || 5) <= 1 ? "destructive" : "secondary"}>
                      {(order.priority || 5) <= 1 ? t("Shoshilinch", "Срочный") : t("Oddiy", "Обычный")}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {selectedOrder && selectedEquipment && (
          <div className="fixed bottom-6 left-6 right-6 z-40">
            <Button
              className="w-full h-20 text-2xl font-black tracking-tight bg-primary text-white rounded-xl shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all"
              onClick={() => createSession.mutate()}
              disabled={createSession.isPending}
              data-testid="button-start-from-schedule"
            >
              {createSession.isPending ? <EPLoader size={32} className="mr-3" /> : <Play className="h-8 w-8 fill-current mr-3" />}
              {t("SOZLASHNI BOSHLASH", "НАЧАТЬ НАСТРОЙКУ")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
