/**
 * @module LogisticsDashboardVehiclesTab
 * @description React page component. Route-level UI.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Truck, Fuel, Wrench, User, Plus } from "lucide-react";
import { useTranslation } from '@/lib/i18n';

export interface Vehicle {
  id: string;
  plateNumber: string;
  model: string;
  type: string;
  status: string;
  driverName?: string;
  driverPhone?: string;
  fuelLevel?: number;
  mileage?: number;
  lastServiceDate?: string;
  nextServiceDate?: string;
  insuranceExpiry?: string;
  loadCapacity?: number;
  notes?: string;
}

export interface FuelLog {
  id: string;
  vehicleId: string;
  plateNumber?: string;
  date: string;
  liters: number;
  costPerLiter: number;
  totalCost: number;
  station?: string;
  mileage?: number;
}

export interface Maintenance {
  id: string;
  vehicleId: string;
  plateNumber?: string;
  type: string;
  date: string;
  cost: number;
  mileage?: number;
  nextDueDate?: string;
  workshop?: string;
  status: string;
}

const statusLabel: Record<string, string> = {
  active: "Tayyor", on_route: "Yo'lda", maintenance: "Ta'mirda", idle: "Dam olmoqda", retired: "Hisobdan chiqarilgan",
  in_transit: "Yo'lda", delivered: "Yetkazildi", planned: "Rejalashtirilgan", failed: "Bajarilmadi", cancelled: "Bekor qilindi",
  completed: "Bajarildi", in_progress: "Jarayonda",
};

interface Props {
  vehicleList: Vehicle[];
  fuelLogs: FuelLog[];
  maintenanceList: Maintenance[];
  vLoading: boolean;
  fLoading: boolean;
  mLoading: boolean;
  onAddVehicle: () => void;
  onAddFuel: () => void;
}

export function LogisticsDashboardVehiclesTab({
  vehicleList, fuelLogs, maintenanceList,
  vLoading, fLoading, mLoading,
  onAddVehicle, onAddFuel,
}: Props) {
  const { t } = useTranslation("common");
  return (
    <>
      {/* TRANSPORT PARKI */}
      <TabsContent value="vehicles">
        <Card className="bg-card border-none rounded-xl">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Truck className="w-5 h-5 text-primary" />
                {t("mashinalarRoyxati")}
              </CardTitle>
              <Button onClick={onAddVehicle} data-testid="button-add-vehicle" className="bg-primary text-white rounded-lg px-5 py-2.5 text-sm font-semibold border-none gap-2">
                <Plus className="w-4 h-4" />{t("mashinaQosh")}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {vLoading ? (
              <div className="p-4 space-y-2">{([...Array(3)]).map((_, i) => <Skeleton key={`k-${i}`} className="h-10 w-full rounded-lg" />)}</div>
            ) : vehicleList.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Truck className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>{t("haliMashinaQoshilmagan")}</p>
              </div>
            ) : (
              <div className="ep-table-scroll"><Table>
                <TableHeader>
                  <TableRow className="bg-muted/60 hover:bg-muted/60 border-none">
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t("raqam")}</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t("model1")}</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t("type")}</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t("haydovchi")}</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t("yoqilgi")}</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t("keyingiTa")}</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t("sugurta")}</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t("status28")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(Array.isArray(vehicleList) ? vehicleList : []).map(v => {
                    const nextDays = v.nextServiceDate ? Math.floor((new Date(v.nextServiceDate).getTime() - Date.now()) / 86400000) : null;
                    const insDays = v.insuranceExpiry ? Math.floor((new Date(v.insuranceExpiry).getTime() - Date.now()) / 86400000) : null;
                    return (
                      <TableRow key={v.id} data-testid={`row-vehicle-${v.id}`} className="hover:bg-muted/40 transition-colors border-none">
                        <TableCell className="py-3 px-6 font-mono font-medium text-foreground">{v.plateNumber}</TableCell>
                        <TableCell className="py-3 px-6 text-foreground">{v.model}</TableCell>
                        <TableCell className="py-3 px-6">
                          <Badge className="bg-muted/60 text-foreground rounded-full px-2.5 py-0.5 text-xs font-semibold border-none">
                            {v.type === "own" ? "O'z" : v.type === "rental" ? "Ijara" : "Tashqi"}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3 px-6 text-foreground">{v.driverName ? <span className="flex items-center gap-1"><User className="w-3 h-3 text-muted-foreground" />{v.driverName}</span> : <span className="text-muted-foreground">—</span>}</TableCell>
                        <TableCell className="py-3 px-6">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-muted/60 rounded-full h-1.5">
                              <div className={`h-full rounded-full ${(v.fuelLevel || 0) < 30 ? "bg-[var(--ep-red)]" : (v.fuelLevel || 0) < 60 ? "bg-amber-500" : "bg-primary"}`} style={{ width: `${v.fuelLevel || 0}%` }} />
                            </div>
                            <span className="text-[10px] font-bold text-foreground">{v.fuelLevel || 0}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 px-6">
                          {v.nextServiceDate ? (
                            <span className={`text-xs ${nextDays !== null && nextDays < 30 ? "text-[var(--ep-red)] font-bold" : "text-foreground"}`}>
                              {v.nextServiceDate}{nextDays !== null ? ` (${nextDays}k)` : ""}
                            </span>
                          ) : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="py-3 px-6">
                          {v.insuranceExpiry ? (
                            <span className={`text-xs ${insDays !== null && insDays < 60 ? "text-[var(--ep-red)] font-bold" : "text-foreground"}`}>{v.insuranceExpiry}</span>
                          ) : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="py-3 px-6">
                          <Badge className={v.status === "maintenance" ? "bg-red-100 text-red-800 rounded-full px-2.5 py-0.5 text-xs font-semibold border-none" : v.status === "on_route" ? "bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-semibold border-none" : "bg-green-100 text-green-800 rounded-full px-2.5 py-0.5 text-xs font-semibold border-none"}>
                            {statusLabel[v.status] || v.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table></div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* YOQILG'I */}
      <TabsContent value="fuel">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="flex items-center gap-2"><Fuel className="w-5 h-5" />{t("yoqilgiJurnali")}</CardTitle>
              </div>
              <Button onClick={onAddFuel} data-testid="button-add-fuel">
                <Plus className="w-4 h-4 mr-2" />{t("yoqilgiQosh")}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {fLoading ? (
              <div className="p-4 space-y-2">{([...Array(3)]).map((_, i) => <Skeleton key={`k-${i}`} className="h-10 w-full rounded-lg" />)}</div>
            ) : fuelLogs.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Fuel className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>{t("haliYoqilgiYozuviYoq")}</p>
              </div>
            ) : (
              <div className="ep-table-scroll"><Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("mashina")}</TableHead>
                    <TableHead>{t("date")}</TableHead>
                    <TableHead>{t("litri1")}</TableHead>
                    <TableHead>{t("narxiL")}</TableHead>
                    <TableHead>{t("jamiNarx1")}</TableHead>
                    <TableHead>{t("stantsiya1")}</TableHead>
                    <TableHead>{t("probeg")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(Array.isArray(fuelLogs) ? fuelLogs : []).map(f => (
                    <TableRow key={f.id} data-testid={`row-fuel-${f.id}`} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="font-mono">{f.plateNumber || f.vehicleId}</TableCell>
                      <TableCell>{f.date}</TableCell>
                      <TableCell className="font-mono">{f.liters} L</TableCell>
                      <TableCell className="font-mono">{(f.costPerLiter || 0).toLocaleString()}</TableCell>
                      <TableCell className="font-mono">{(f.totalCost || 0).toLocaleString()} so'm</TableCell>
                      <TableCell>{f.station || "—"}</TableCell>
                      <TableCell className="font-mono">{f.mileage ? `${f.mileage.toLocaleString()} km` : "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table></div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* TA TARIXI */}
      <TabsContent value="maintenance">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Wrench className="w-5 h-5" />{t("texnikXizmatTarixi")}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {mLoading ? (
              <div className="p-4 space-y-2">{([...Array(3)]).map((_, i) => <Skeleton key={`k-${i}`} className="h-10 w-full rounded-lg" />)}</div>
            ) : maintenanceList.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Wrench className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>{t("haliTamirlashYozuviYoq")}</p>
              </div>
            ) : (
              <div className="ep-table-scroll"><Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("mashina")}</TableHead>
                    <TableHead>{t("type")}</TableHead>
                    <TableHead>{t("date")}</TableHead>
                    <TableHead>{t("xarajat1")}</TableHead>
                    <TableHead>{t("probeg")}</TableHead>
                    <TableHead>{t("keyingiTa")}</TableHead>
                    <TableHead>{t("ustaxona")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(Array.isArray(maintenanceList) ? maintenanceList : []).map(m => (
                    <TableRow key={m.id} data-testid={`row-maintenance-${m.id}`} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="font-mono">{m.plateNumber || m.vehicleId}</TableCell>
                      <TableCell>{m.type}</TableCell>
                      <TableCell>{m.date}</TableCell>
                      <TableCell className="font-mono">{(m.cost || 0).toLocaleString()} so'm</TableCell>
                      <TableCell className="font-mono">{m.mileage ? `${m.mileage.toLocaleString()} km` : "—"}</TableCell>
                      <TableCell>{m.nextDueDate || "—"}</TableCell>
                      <TableCell>{m.workshop || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table></div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </>
  );
}
