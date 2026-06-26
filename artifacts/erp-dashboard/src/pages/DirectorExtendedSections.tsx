/**
 * @module DirectorExtendedSections
 * @description Problems, production, HR, finance, and KPI tab components for DirectorExtended.
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TabsContent } from "@/components/ui/tabs";
import {
  AlertTriangle, BarChart3, CheckCircle2, Clock,
  DollarSign, Package, RefreshCw, TrendingDown, TrendingUp,
  Users, XCircle, type LucideIcon,
} from "lucide-react";
import type {
  DirectorAlert, FinData, HrData, KpiData, KpiListItem, KPIEquipment,
  ProdData, ProductionOrder, ProductionSession, HRDepartment,
} from "./DirectorExtendedTypes";
import { StatCard } from "./DirectorExtendedDialogs";

import { useTranslation } from '@/lib/i18n';
export { StatCard, AiSummaryTab } from "./DirectorExtendedDialogs";

export function ProblemsTab({ alerts, alertsLoading, onRefresh, }: {
  alerts: DirectorAlert[];
  alertsLoading: boolean;
  onRefresh: () => void;
}) {
  const { t } = useTranslation('common');
  return (
    <TabsContent value="problems" className="mt-0 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("muammoliNuqtalarVaOgohlantirishlar")}</h2>
        <Button variant="outline" size="sm" onClick={onRefresh} data-testid="button-refresh-alerts">
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />{t("refresh")}
        </Button>
      </div>
      {alertsLoading ? (
        <div className="space-y-3">{([...Array(3)]).map((_, i) => <Card key={`k-${i}`}><CardContent className="pt-4 pb-4 h-20 animate-pulse bg-muted/30 rounded" /></Card>)}</div>
      ) : alerts.length === 0 ? (
        <Card>
          <CardContent className="pt-8 pb-8 text-center">
            <CheckCircle2 className="h-10 w-10 text-[var(--ep-green)] mx-auto mb-3" />
            <p className="text-muted-foreground">{t("hozirchaHechQandayMuammoYoq")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {(Array.isArray(alerts) ? alerts : []).map((a: DirectorAlert, i: number) => (
            <Card key={`k-${i}`} className={a.severity === "critical" ? "border-red-300" : a.severity === "high" ? "border-orange-300" : ""} data-testid={`card-alert-${i}`}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className={`h-5 w-5 shrink-0 mt-0.5 ${a.severity === "critical" ? "text-[var(--ep-red)]" : a.severity === "high" ? "text-[var(--ep-primary)]" : "text-[var(--ep-yellow)]"}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge variant="outline" className="text-xs">{a.module}</Badge>
                      <Badge variant={a.severity === "critical" ? "destructive" : a.severity === "high" ? "secondary" : "outline"} className="text-xs">{a.severity}</Badge>
                      <span className="text-xs text-muted-foreground">{a.createdAt ? new Date(a.createdAt).toLocaleTimeString("uz-UZ") : ""}</span>
                    </div>
                    <p className="text-sm font-medium">{a.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{a.message}</p>
                  </div>
                  <Button variant="outline" size="sm" data-testid={`button-resolve-${i}`}>{t("halQilish")}</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </TabsContent>
  );
}

export function ProductionTab({ prodData, prodLoading }: { prodData: ProdData | undefined; prodLoading: boolean }) {
  const { t } = useTranslation("common");
  return (
    <TabsContent value="production" className="mt-0 space-y-4">
      <h2 className="text-lg font-semibold">{t("ishlabChiqarishHolati")}</h2>
      {prodLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{([...Array(3)]).map((_, i) => <Card key={`k-${i}`}><CardContent className="pt-4 pb-3 h-16 animate-pulse bg-muted/30 rounded" /></Card>)}</div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(prodData?.orderBreakdown || {}).map(([status, cnt]: [string, number]) => (
            <StatCard key={status} icon={Package} label={status} value={cnt} color={status === "completed" ? "text-[var(--ep-green)]" : status === "production" ? "text-[var(--ep-blue)]" : "text-[var(--ep-primary)]"} />
          ))}
          {!prodData?.orderBreakdown && <p className="text-muted-foreground col-span-4 text-center py-4">{t("buyurtmalarYoq")}</p>}
        </div>
      )}
      {prodData?.oeeToday && (
        <Card>
          <CardHeader><CardTitle className="text-base">{t("oeeBugun")}</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {([
                { l: t("ortachaOee"), v: prodData.oeeToday.avg ?? "—" },
                { l: t("oeeMinimum"), v: prodData.oeeToday.min ?? "—" },
                { l: t("oeeMaksimum"), v: prodData.oeeToday.max ?? "—" },
                { l: t("oeeSnapshotSoni"), v: prodData.oeeToday.snapshots?.length ?? 0 },
              ]).map(s => (
                <div key={s.l} className="text-center p-3 bg-muted/30 rounded-md">
                  <div className="text-xl font-bold">{s.v}{typeof s.v === "string" && s.v !== "—" ? "%" : ""}</div>
                  <div className="text-xs text-muted-foreground mt-1">{s.l}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      {(prodData?.overdueOrders?.length || 0) > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base text-[var(--ep-red)]">{t("kechikkanBuyurtmalar1")}</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="ep-table-scroll"><Table>
              <TableHeader><TableRow><TableHead>{t("papka1")}</TableHead><TableHead>{"Holat"}</TableHead><TableHead>{t("muddati")}</TableHead></TableRow></TableHeader>
              <TableBody>
                {prodData?.overdueOrders?.map((o: ProductionOrder) => (
                  <TableRow key={o.id} data-testid={`row-overdue-${o.id}`} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-medium">{o.papkaNo}</TableCell>
                    <TableCell><Badge variant="outline">{o.status}</Badge></TableCell>
                    <TableCell className="text-[var(--ep-red)]">{o.tayyorBolishSanasi}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table></div>
          </CardContent>
        </Card>
      )}
      {(prodData?.sessionsToday?.length || 0) > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">{t("bugungiSessiyalar")}</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="ep-table-scroll"><Table>
              <TableHeader><TableRow><TableHead>{t("stanoq")}</TableHead><TableHead>{"Holat"}</TableHead><TableHead>{t("Maqsad")}</TableHead><TableHead>{t("Bajarildi")}</TableHead><TableHead>{t("Brak")}</TableHead><TableHead>OEE</TableHead></TableRow></TableHeader>
              <TableBody>
                {prodData?.sessionsToday?.map((s: ProductionSession) => (
                  <TableRow key={s.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-medium">{s.equipmentId}</TableCell>
                    <TableCell><Badge variant={s.status === "running" ? "default" : "outline"}>{s.status}</Badge></TableCell>
                    <TableCell>{s.targetQty}</TableCell>
                    <TableCell>{s.producedQty}</TableCell>
                    <TableCell className="text-[var(--ep-red)]">{s.defectQty}</TableCell>
                    <TableCell>{s.oee ? `${Number(s.oee).toFixed(1)}%` : "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table></div>
          </CardContent>
        </Card>
      )}
    </TabsContent>
  );
}

export function HrTab({ hrData, hrLoading }: { hrData: HrData | undefined; hrLoading: boolean }) {
  const { t } = useTranslation("common");
  return (
    <TabsContent value="hr" className="mt-0 space-y-4">
      <h2 className="text-lg font-semibold">{t("hrVaDavomadHolati")}</h2>
      {hrLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{([...Array(6)]).map((_, i) => <Card key={`k-${i}`}><CardContent className="pt-4 pb-3 h-16 animate-pulse bg-muted/30 rounded" /></Card>)}</div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Users} label={t("jamiXodimlar1")} value={hrData?.employees?.total ?? 0} sub="Ro'yxatdagi" color="text-primary" />
            <StatCard icon={CheckCircle2} label={t("keldi")} value={hrData?.attendance?.present ?? 0} sub={`${hrData?.attendance?.attendanceRate ?? 0}%`} color="text-[var(--ep-green)]" />
            <StatCard icon={XCircle} label={t("kelmadi")} value={hrData?.attendance?.absent ?? 0} sub="Bugun" color="text-[var(--ep-red)]" />
            <StatCard icon={Clock} label={t("kechikkan")} value={hrData?.attendance?.late ?? 0} sub="Bugun" color="text-[var(--ep-primary)]" />
          </div>
          {(hrData?.byDepartment?.length || 0) > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">{t("bolimlarBoyicha")}</CardTitle></CardHeader>
              <CardContent className="p-0">
                <div className="ep-table-scroll"><Table>
                  <TableHeader><TableRow><TableHead>{t("bolim1")}</TableHead><TableHead>{t("xodimlarSoni")}</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {hrData?.byDepartment?.map((d: HRDepartment) => (
                      <TableRow key={d.department} data-testid={`row-dept-${d.department}`} className="hover:bg-muted/40 transition-colors">
                        <TableCell className="font-medium">{d.department}</TableCell>
                        <TableCell>{d.count} nafar</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table></div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </TabsContent>
  );
}

export function FinanceTab({ finData, finLoading }: { finData: FinData | undefined; finLoading: boolean }) {
  const { t } = useTranslation("common");
  return (
    <TabsContent value="finance" className="mt-0 space-y-4">
      <h2 className="text-lg font-semibold">{t("moliyaHolati")}</h2>
      {finLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{([...Array(3)]).map((_, i) => <Card key={`k-${i}`}><CardContent className="pt-4 pb-3 h-16 animate-pulse bg-muted/30 rounded" /></Card>)}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard icon={DollarSign} label={t("jamiDebitorlik")} value={`${(finData?.totalReceivable || 0).toLocaleString()} so'm`} sub="To'lanmagan" color="text-[var(--ep-primary)]" />
          <StatCard icon={AlertTriangle} label={t("muddatiOtgan")} value={`${(finData?.overdueAmount || 0).toLocaleString()} so'm`} sub="Overdue" color="text-[var(--ep-red)]" />
          <StatCard icon={Clock} label={t("kutilayotgan")} value={`${(finData?.pendingAmount || 0).toLocaleString()} so'm`} sub="Pending" color="text-[var(--ep-yellow)]" />
        </div>
      )}
      {finData?.invoices && (
        <Card>
          <CardHeader><CardTitle className="text-base">{t("hisobFakturalarHolati")}</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="ep-table-scroll"><Table>
              <TableHeader><TableRow><TableHead>{"Holat"}</TableHead><TableHead>{t("count")}</TableHead><TableHead>{t("summa")}</TableHead></TableRow></TableHeader>
              <TableBody>
                {Object.entries(finData.invoices).map(([status, data]: [string, { count?: number; amount?: number }]) => (
                  <TableRow key={status} data-testid={`row-invoice-${status}`} className="hover:bg-muted/40 transition-colors">
                    <TableCell><Badge variant={status === "overdue" ? "destructive" : status === "paid" ? "default" : "outline"}>{status}</Badge></TableCell>
                    <TableCell>{data.count} ta</TableCell>
                    <TableCell>{data.amount?.toLocaleString() || 0} so'm</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table></div>
          </CardContent>
        </Card>
      )}
    </TabsContent>
  );
}

export function KpisTab({ kpiList, kpiData }: { kpiList: KpiListItem[]; kpiData: KpiData | undefined }) {
  const { t } = useTranslation("common");
  return (
    <TabsContent value="kpis" className="mt-0 space-y-4">
      <h2 className="text-lg font-semibold">{"KPI Monitoringi"}</h2>
      <Card>
        <CardContent className="pt-4 space-y-3">
          {(Array.isArray(kpiList) ? kpiList : []).map(kpi => (
            <div key={kpi.name} className="flex items-center gap-3" data-testid={`row-kpi-${kpi.name.slice(0, 8)}`}>
              {kpi.trend === "up" ? <TrendingUp className="h-4 w-4 text-[var(--ep-green)] shrink-0" /> : <TrendingDown className="h-4 w-4 text-[var(--ep-red)] shrink-0" />}
              <span className="text-sm w-52 shrink-0">{kpi.name}</span>
              <div className="flex-1 h-2 bg-muted rounded">
                <div className={`h-2 rounded ${kpi.pct >= 90 ? "bg-green-500" : kpi.pct >= 70 ? "bg-yellow-500" : "bg-red-500"}`} style={{ width: `${Math.min(kpi.pct, 100)}%` }} />
              </div>
              <span className="text-sm font-bold w-32 text-right">{kpi.value}</span>
              <span className="text-xs text-muted-foreground w-24 text-right">Maqsad: {kpi.target}</span>
            </div>
          ))}
        </CardContent>
      </Card>
      {(kpiData?.oeeByEquipment?.length ?? 0) > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">{t("oeeStanoqlarBoyicha")}</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="ep-table-scroll"><Table>
              <TableHeader><TableRow><TableHead>{t("stanoq")}</TableHead><TableHead>OEE</TableHead><TableHead>{t("Mavjudlik")}</TableHead><TableHead>{t("Unumdorlik")}</TableHead><TableHead>{t("Sifat")}</TableHead></TableRow></TableHeader>
              <TableBody>
                {kpiData?.oeeByEquipment?.map((o: KPIEquipment) => (
                  <TableRow key={o.equipmentId} data-testid={`row-oee-${o.equipmentId}`} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-medium">{o.equipmentId}</TableCell>
                    <TableCell>
                      <Badge variant={Number(o.avgOee) >= 85 ? "default" : Number(o.avgOee) >= 70 ? "secondary" : "destructive"}>{o.avgOee}%</Badge>
                    </TableCell>
                    <TableCell>{o.avgAvailability}%</TableCell>
                    <TableCell>{o.avgPerformance}%</TableCell>
                    <TableCell>{o.avgQuality}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table></div>
          </CardContent>
        </Card>
      )}
    </TabsContent>
  );
}

export { BarChart3 };
