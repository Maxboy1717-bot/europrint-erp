/**
 * IotOeeAlertsTab — OEE trend chart, per-machine OEE gauges, and active alerts
 * for IoTDashboard.
 */
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TabsContent } from "@/components/ui/tabs";
import {
  AlertTriangle, Factory, TrendingUp, CheckCircle2, Activity, Clock,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import type { IotAlert } from "@shared/schema";
import { OeeGauge, getSeverityBadge } from "./IotDashboardHelpers";

interface OeePoint { date: string; oee: number; availability: number; performance: number; quality: number }
interface MachineOee  { availability: number; performance: number; quality: number; oee: number }

interface Props {
  oeeChartData: OeePoint[];
  machineOeeMap: Record<string, MachineOee>;
  alerts: IotAlert[];
  onResolveAlert: (id: string) => void;
  resolveAlertPending: boolean;
  t: (key: string) => string;
  tProd: (key: string) => string;
  language: string;
}

export function IotOeeAlertsTab({
  oeeChartData, machineOeeMap,
  alerts, onResolveAlert, resolveAlertPending,
  t, tProd, language,
}: Props) {
  return (
    <>
      {/* ── OEE Trend ── */}
      <TabsContent value="oee" className="space-y-6 focus-visible:outline-none">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
            <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              {t('oeeTitle')}
            </h3>
            {oeeChartData.length === 0 ? (
              <div className="py-20 text-center text-muted-foreground font-medium">{tProd('noDataFound')}</div>
            ) : (
              <div className="h-[350px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={oeeChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--outline-variant))" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--on-surface-variant))" }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(var(--on-surface-variant))" }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "hsl(var(--surface-container-lowest))", borderRadius: "12px", border: "1px solid hsl(var(--outline-variant))", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                      itemStyle={{ fontWeight: "bold" }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: "20px" }} />
                    <Line type="monotone" dataKey="oee"          stroke="hsl(var(--primary))" name={tProd('oee')}             strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: "white" }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="availability" stroke="#22c55e"              name={tProd('availability')}    strokeWidth={2} dot={false} strokeDasharray="5 5" />
                    <Line type="monotone" dataKey="performance"  stroke="#3b82f6"              name={tProd('performanceRate')} strokeWidth={2} dot={false} strokeDasharray="5 5" />
                    <Line type="monotone" dataKey="quality"      stroke="#f59e0b"              name={tProd('qualityRate')}     strokeWidth={2} dot={false} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
            <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <Factory className="h-5 w-5 text-primary" />
              {t('oeeByMachine')}
            </h3>
            {Object.keys(machineOeeMap).length === 0 ? (
              <div className="py-20 text-center text-muted-foreground font-medium">{tProd('noDataFound')}</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {Object.entries(machineOeeMap).map(([machineId, oee]) => (
                  <div key={machineId} className="bg-background p-5 rounded-xl border border-border/50" data-testid={`oee-machine-${machineId}`}>
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-primary inline-block" />
                      {machineId}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <OeeGauge label={tProd('availability')}    value={oee.availability} color="#22c55e" />
                      <OeeGauge label={tProd('performanceRate')} value={oee.performance}  color="#3b82f6" />
                      <OeeGauge label={tProd('qualityRate')}     value={oee.quality}      color="#f59e0b" />
                      <OeeGauge label={tProd('oee')}             value={oee.oee}          color="hsl(var(--primary))" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </TabsContent>

      {/* ── Active Alerts ── */}
      <TabsContent value="alerts" className="focus-visible:outline-none">
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-[var(--ep-red)]" />
            {t('activeAlertsDesc')}
          </h3>
          {alerts.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-20 text-center">
              <div className="h-20 w-20 rounded-full bg-green-50 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-[var(--ep-green)]" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">{t('allGood')}</p>
                <p className="text-muted-foreground font-medium">{t('noActiveAlerts')}</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(Array.isArray(alerts) ? alerts : []).map(alert => (
                <div key={alert.id} className="flex items-start justify-between gap-4 p-5 bg-background rounded-xl border border-border/50 hover:border-error/30 transition-all" data-testid={`alert-${alert.id}`}>
                  <div className="flex items-start gap-4 min-w-0">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${alert.severity === 'critical' ? 'bg-[var(--ep-red)]/10 text-[var(--ep-red)]' : 'bg-amber-100 text-[var(--ep-yellow)]'}`}>
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        {getSeverityBadge(alert.severity, t)}
                        <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider">{alert.alertType}</Badge>
                      </div>
                      <p className="text-sm font-bold text-foreground leading-snug">{alert.message}</p>
                      <div className="flex items-center gap-3 mt-3 text-[11px] text-muted-foreground font-medium">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(alert.createdAt).toLocaleString(language === 'uz' ? 'uz-UZ' : 'ru-RU', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {alert.value !== null && (
                          <span className="flex items-center gap-1 font-bold text-foreground">
                            <Activity className="h-3 w-3" /> {alert.value}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-lg h-9 font-bold text-xs border-border hover:bg-green-50 hover:text-green-600 hover:border-green-200 transition-all shadow-sm"
                    onClick={() => onResolveAlert(alert.id)}
                    disabled={resolveAlertPending}
                    data-testid={`button-resolve-${alert.id}`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                    {t('resolve')}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </TabsContent>
    </>
  );
}
