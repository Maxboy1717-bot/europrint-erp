/**
 * @module MMExtendedFleetTabs
 * @description Fleet management tab components: Transport, GPS, Fuel,
 * Drivers, Schedule, and Routes. Each receives data as props.
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TabsContent } from "@/components/ui/tabs";
import { Navigation, MapPin, Map, Plus } from "lucide-react";
import type { MMVehicle, MMDelivery, MMFuelLog } from "./MMExtendedTypes";
import { fmtMoney } from "./MMExtendedTypes";
import { useTranslation } from '@/lib/i18n';

// ─── GPSTab ───────────────────────────────────────────────────────────────────

interface GPSTabProps {
  vehicles: MMVehicle[];
  vehiclesLoading: boolean;
}

export function GPSTab({ vehicles, vehiclesLoading }: GPSTabProps) {
  const { t } = useTranslation("common");
  const activeVehicles = (Array.isArray(vehicles) ? vehicles : []).filter(v => v.status === "on_route");
  return (
    <TabsContent value="gps" className="mt-0 space-y-4">
      <h2 className="text-lg font-semibold">{t("gpsRealTimeMonitoring")}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">{t("harakatdagiTransportlar")}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {vehiclesLoading ? (
              <div className="text-sm text-muted-foreground">{t("Yuklanmoqda...")}</div>
            ) : activeVehicles.length === 0 ? (
              <div className="text-sm text-muted-foreground py-4 text-center">{t("hozirdaHarakatdagiTransportYoq")}</div>
            ) : activeVehicles.map((v: MMVehicle) => (
              <div key={v.id} className="flex items-center gap-3 p-3 rounded-md bg-muted/50">
                <Navigation className="h-5 w-5 text-[var(--ep-blue)]" />
                <div className="flex-1">
                  <div className="font-medium text-sm">{v.model || v.plateNumber}</div>
                  <div className="text-xs text-muted-foreground">{v.driverName || "Haydovchi yo'q"}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-medium text-[var(--ep-green)]">{v.plateNumber}</div>
                  <div className="text-xs text-muted-foreground">{t("gpsTracking")}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="h-48 bg-muted/30 rounded-md flex items-center justify-center border border-dashed">
              <div className="text-center text-muted-foreground">
                <MapPin className="h-8 w-8 mx-auto mb-2" />
                <div className="text-sm">{t("gpsXaritaKorinishi")}</div>
                <div className="text-xs mt-1">{activeVehicles.length} transport harakatda</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TabsContent>
  );
}

// ─── FuelTab ──────────────────────────────────────────────────────────────────

interface FuelTabProps {
  fuelLogs: MMFuelLog[];
  vehicles: MMVehicle[];
  fuelLoading: boolean;
}

export function FuelTab({ fuelLogs, vehicles, fuelLoading }: FuelTabProps) {
  const { t } = useTranslation("common");
  const safeFuelLogs = Array.isArray(fuelLogs) ? fuelLogs : [];
  return (
    <TabsContent value="fuel" className="mt-0 space-y-4">
      <h2 className="text-lg font-semibold">{t("yoqilgiNazorati")}</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {([
          { l: "Jami sarfi (L)",      v: safeFuelLogs.reduce((s, f) => s + Number(f.liters || 0), 0).toFixed(0) + " L", c: "text-[var(--ep-primary)]" },
          { l: "Jami xarajat",        v: fmtMoney(safeFuelLogs.reduce((s, f) => s + Number(f.totalCost || 0), 0)),       c: "text-[var(--ep-red)]" },
          { l: "Yonilg'i to'ldirish", v: fuelLogs.length + " ta",                                                        c: "text-[var(--ep-blue)]" },
          { l: "Mashinalar soni",     v: vehicles.length + " ta",                                                         c: "text-[var(--ep-green)]" },
        ]).map(s => (
          <Card key={s.l}><CardContent className="pt-4 pb-3">
            <div className={`text-2xl font-bold ${s.c}`}>{fuelLoading ? "..." : s.v}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.l}</div>
          </CardContent></Card>
        ))}
      </div>
      <Card><CardContent className="p-0">
        <div className="ep-table-scroll"><Table>
          <TableHeader><TableRow>
            <TableHead>{t("mashina")}</TableHead><TableHead>{t("date")}</TableHead>
            <TableHead>{t("miqdorL")}</TableHead><TableHead>Narx/L</TableHead><TableHead>{t("jamiXarajat")}</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {fuelLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">{t("Yuklanmoqda...")}</TableCell></TableRow>
            ) : safeFuelLogs.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">{t("yonilgiMalumotlariYoq")}</TableCell></TableRow>
            ) : safeFuelLogs.map((f: MMFuelLog) => (
              <TableRow key={f.id} data-testid={`row-fuel-${f.id}`} className="hover:bg-muted/40 transition-colors">
                <TableCell className="font-medium">{f.plateNumber || `Mashina #${f.vehicleId}`}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{f.date || (f.createdAt ? new Date(f.createdAt).toLocaleDateString("uz-UZ") : "-")}</TableCell>
                <TableCell>{Number(f.liters || 0).toFixed(1)} L</TableCell>
                <TableCell>{fmtMoney(f.costPerLiter)}/L</TableCell>
                <TableCell className="font-medium">{fmtMoney(f.totalCost)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table></div>
      </CardContent></Card>
    </TabsContent>
  );
}

// ─── DriversTab ───────────────────────────────────────────────────────────────

interface DriversTabProps {
  vehicles: MMVehicle[];
  vehiclesLoading: boolean;
  onAddDriver: () => void;
}

export function DriversTab({ vehicles, vehiclesLoading, onAddDriver }: DriversTabProps) {
  const { t } = useTranslation("common");
  return (
    <TabsContent value="drivers" className="mt-0 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("haydovchilar")}</h2>
        <Button data-testid="button-add-driver" onClick={onAddDriver}>
          <Plus className="h-4 w-4 mr-2" />{t("haydovchiQoshish")}
        </Button>
      </div>
      <Card><CardContent className="p-0">
        <div className="ep-table-scroll"><Table>
          <TableHeader><TableRow>
            <TableHead>{t("haydovchi")}</TableHead><TableHead>{t("transport")}</TableHead>
            <TableHead>{t("davlatRaqami1")}</TableHead><TableHead>{t("holati")}</TableHead><TableHead>{t("sugurtaMuddati")}</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {vehiclesLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">{t("Yuklanmoqda...")}</TableCell></TableRow>
            ) : vehicles.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">{t("transportMalumotlariYoq")}</TableCell></TableRow>
            ) : (Array.isArray(vehicles) ? vehicles : []).map((v: MMVehicle, i: number) => (
              <TableRow key={v.id} data-testid={`row-driver-${i}`} className="hover:bg-muted/40 transition-colors">
                <TableCell className="font-medium">{v.driverName || <span className="text-muted-foreground text-xs">{t("tayinlanmagan")}</span>}</TableCell>
                <TableCell>{v.model || "-"}</TableCell>
                <TableCell className="font-mono text-sm">{v.plateNumber || "-"}</TableCell>
                <TableCell>
                  <Badge variant={v.status === "on_route" ? "default" : "outline"}>
                    {v.status === "on_route" ? "Yo'lda" : v.status === "idle" ? "Bo'sh" : v.status || "-"}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {v.insuranceExpiry ? new Date(v.insuranceExpiry).toLocaleDateString("uz-UZ") : "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table></div>
      </CardContent></Card>
    </TabsContent>
  );
}

// ─── ScheduleTab ──────────────────────────────────────────────────────────────

interface ScheduleTabProps {
  deliveries: MMDelivery[];
  deliveriesLoading: boolean;
}

export function ScheduleTab({ deliveries, deliveriesLoading }: ScheduleTabProps) {
  const { t } = useTranslation("common");
  return (
    <TabsContent value="schedule" className="mt-0 space-y-4">
      <h2 className="text-lg font-semibold">{t("transportJadvali")}</h2>
      <Card>
        <CardHeader><CardTitle className="text-base">{t("yetkazishJadvali1")}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {deliveriesLoading ? (
            <div className="text-sm text-muted-foreground">{t("Yuklanmoqda...")}</div>
          ) : deliveries.length === 0 ? (
            <div className="text-sm text-muted-foreground py-4 text-center">{t("rejalashtirilganYetkazishYoq")}</div>
          ) : (Array.isArray(deliveries) ? deliveries : []).slice(0, 10).map((d: MMDelivery, i: number) => {
            const statusMap: Record<string, string> = { delivered: "Bajarildi", in_transit: "Bajarilmoqda", planned: "Rejalashtirilgan", cancelled: "Bekor" };
            const statusLabel = statusMap[d.status || ""] || d.status || "-";
            const scheduledTime = d.estimatedArrival
              ? new Date(d.estimatedArrival).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })
              : "-";
            return (
              <div key={d.id} className="flex items-center gap-4 p-3 rounded-md bg-muted/50" data-testid={`row-schedule-${i}`}>
                <span className="font-bold text-sm w-12 shrink-0">{scheduledTime}</span>
                <Badge variant="outline" className="shrink-0 font-mono">{d.plateNumber || `#${d.vehicleId}`}</Badge>
                <span className="text-sm flex-1">{d.customerName || "Mijoz"} — {d.address || "Manzil ko'rsatilmagan"}</span>
                <Badge variant={d.status === "delivered" ? "default" : d.status === "in_transit" ? "secondary" : "outline"}>
                  {statusLabel}
                </Badge>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </TabsContent>
  );
}

// ─── RoutesTab ────────────────────────────────────────────────────────────────

export function RoutesTab() {
  const { t } = useTranslation("common");
  return (
    <TabsContent value="routes" className="mt-0 space-y-4">
      <h2 className="text-lg font-semibold">{t("aiMarshrutRejalashtirish")}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">{t("yangiMarshrutHisoblash")}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {([
              { l: "Qayerdan",          p: "Toshkent, Sergeli" },
              { l: "Qayerga",           p: "Namangan shahar" },
              { l: "Transportlar soni", p: "2" },
              { l: "Umumiy yuk",        p: "8,500 kg" },
            ]).map(f => (
              <div key={f.l} className="space-y-1">
                <Label className="text-muted-foreground">{f.l}</Label>
                <Input defaultValue={f.p} />
              </div>
            ))}
            <Button className="w-full gap-2" data-testid="button-calc-route">
              <Map className="h-4 w-4" />{t("optimalMarshrut")}
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">{t("aiTavsiya")}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {([
              { label: "Masofa",          value: "312 km" },
              { label: "Taxminiy vaqt",   value: "4.5 soat" },
              { label: "Yoqilg'i",        value: "58 L" },
              { label: "Xarajat",         value: "649,600 so'm" },
              { label: "Yetkazish vaqti", value: "15:30" },
            ]).map(r => (
              <div key={r.label} className="flex justify-between text-sm py-1.5 border-b border-border/50 last:border-0">
                <span className="text-muted-foreground">{r.label}</span>
                <span className="font-bold">{r.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </TabsContent>
  );
}

// ─── TransportTab ─────────────────────────────────────────────────────────────

interface TransportTabProps {
  vehicles: MMVehicle[];
  vehiclesLoading: boolean;
  onAddVehicle: () => void;
}

export function TransportTab({ vehicles, vehiclesLoading, onAddVehicle }: TransportTabProps) {
  const { t } = useTranslation("common");
  return (
    <TabsContent value="transport" className="mt-0 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("transportParki")}</h2>
        <Button data-testid="button-add-vehicle" onClick={onAddVehicle}>
          <Plus className="h-4 w-4 mr-2" />{t("mashinaQoshish")}
        </Button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {([
          { l: "Jami transport", v: vehicles.length,                                                                          c: "text-primary" },
          { l: "Yo'lda",         v: (Array.isArray(vehicles) ? vehicles : []).filter(v => v.status === "on_route").length,    c: "text-[var(--ep-blue)]" },
          { l: "Bo'sh",          v: (Array.isArray(vehicles) ? vehicles : []).filter(v => v.status === "idle").length,        c: "text-[var(--ep-green)]" },
          { l: "Ta'mirda",       v: (Array.isArray(vehicles) ? vehicles : []).filter(v => v.status === "maintenance").length, c: "text-[var(--ep-red)]" },
        ]).map(s => (
          <Card key={s.l}><CardContent className="pt-4 pb-3">
            <div className={`text-2xl font-bold ${s.c}`}>{vehiclesLoading ? "..." : s.v}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.l}</div>
          </CardContent></Card>
        ))}
      </div>
      <Card><CardContent className="p-0">
        <div className="ep-table-scroll"><Table>
          <TableHeader><TableRow>
            <TableHead>{t("davlatRaqami1")}</TableHead><TableHead>{t("model1")}</TableHead>
            <TableHead>{t("haydovchi")}</TableHead><TableHead>{t("holati")}</TableHead><TableHead>{t("yoqilgi")}</TableHead><TableHead>{t("probeg")}</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {vehiclesLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">{t("Yuklanmoqda...")}</TableCell></TableRow>
            ) : vehicles.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">{t("transportMalumotlariYoq")}</TableCell></TableRow>
            ) : (Array.isArray(vehicles) ? vehicles : []).map((v: MMVehicle) => {
              const fuelLevel = Number(v.fuelLevel || 0);
              return (
                <TableRow key={v.id} data-testid={`row-vehicle-${v.id}`} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-medium font-mono">{v.plateNumber || "-"}</TableCell>
                  <TableCell>{v.model || "-"}</TableCell>
                  <TableCell>{v.driverName || <span className="text-muted-foreground text-xs">{t("tayinlanmagan")}</span>}</TableCell>
                  <TableCell>
                    <Badge variant={v.status === "on_route" ? "default" : v.status === "idle" ? "outline" : "secondary"}>
                      {v.status === "on_route" ? "Yo'lda" : v.status === "idle" ? "Bo'sh" : v.status === "maintenance" ? "Ta'mirda" : v.status || "-"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-muted rounded">
                        <div className={`h-1.5 rounded ${fuelLevel > 50 ? "bg-green-500" : fuelLevel > 25 ? "bg-yellow-500" : "bg-red-500"}`} style={{ width: `${fuelLevel}%` }} />
                      </div>
                      <span className="text-xs">{fuelLevel}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{Number(v.mileage || 0).toLocaleString()} km</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table></div>
      </CardContent></Card>
    </TabsContent>
  );
}
