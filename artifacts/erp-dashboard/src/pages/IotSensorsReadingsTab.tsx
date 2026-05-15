/**
 * IotSensorsReadingsTab — Live sensors grid and historical readings chart
 * for IoTDashboard.
 */
import { TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, Cpu, Wind, Clock } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { IotSensor } from "@shared/schema";
import { SENSOR_ICONS, getStatusColor, getStatusBadge } from "./IotDashboardHelpers";

interface Props {
  sensors: IotSensor[];
  selectedSensorId: string;
  setSelectedSensorId: (id: string) => void;
  readingsChartData: Array<{ time: string; value: number }>;
  t: (key: string) => string;
  tProd: (key: string) => string;
  language: string;
}

export function IotSensorsReadingsTab({
  sensors, selectedSensorId, setSelectedSensorId,
  readingsChartData, t, tProd, language,
}: Props) {
  return (
    <>
      {/* ── Live Sensors ── */}
      <TabsContent value="sensors" className="space-y-4 focus-visible:outline-none">
        {sensors.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-20 text-center shadow-sm">
            <Cpu className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">{t('noActiveSensors')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {(Array.isArray(sensors) ? sensors : []).map(sensor => {
              const Icon = SENSOR_ICONS[sensor.type] ?? Activity;
              const statusColor = getStatusColor(sensor);
              return (
                <div
                  key={sensor.id}
                  className="bg-card rounded-xl p-5 border border-border shadow-sm hover:shadow-md transition-all cursor-pointer group"
                  data-testid={`card-sensor-${sensor.id}`}
                  onClick={() => setSelectedSensorId(sensor.id)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-colors ${statusColor === "text-[var(--ep-red)]" ? "bg-red-50" : statusColor === "text-[var(--ep-yellow)]" ? "bg-yellow-50" : "bg-green-50"}`}>
                        <Icon className={`h-5 w-5 ${statusColor}`} />
                      </div>
                      <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate max-w-[120px]">{sensor.name}</p>
                    </div>
                    {getStatusBadge(sensor, t)}
                  </div>
                  <div className="space-y-1">
                    <p className={`text-4xl font-black tracking-tighter ${statusColor}`} data-testid={`text-sensor-value-${sensor.id}`}>
                      {sensor.lastReading !== null ? sensor.lastReading : "—"}
                      <span className="text-lg font-bold ml-1 opacity-70">{sensor.unit ?? ""}</span>
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{sensor.sensorCode}</p>
                  </div>
                  <div className="mt-5 pt-4 border-t border-border/30 space-y-2">
                    {sensor.location && (
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-medium">
                        <Wind className="h-3 w-3" />{sensor.location}
                      </div>
                    )}
                    {sensor.lastReadingAt && (
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-medium">
                        <Clock className="h-3 w-3" />
                        {new Date(sensor.lastReadingAt).toLocaleString(language === "uz" ? "uz-UZ" : "ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </TabsContent>

      {/* ── Historical Readings ── */}
      <TabsContent value="readings" className="focus-visible:outline-none">
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4 flex-wrap mb-8">
            <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              {t('sensorReadings')}
            </h3>
            <Select value={selectedSensorId} onValueChange={setSelectedSensorId}>
              <SelectTrigger className="w-full sm:w-[300px] h-9 rounded-xl border-border bg-background shadow-sm focus:ring-primary/20" data-testid="select-sensor">
                <SelectValue placeholder={t('selectSensor')} />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border shadow-xl">
                {(Array.isArray(sensors) ? sensors : []).map(s => (
                  <SelectItem key={s.id} value={s.id} className="py-2.5 rounded-lg font-medium" data-testid={`select-sensor-option-${s.id}`}>
                    {s.name} <span className="text-muted-foreground opacity-60 ml-1">({s.sensorCode})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="bg-background rounded-xl border border-border/30 p-8">
            {!selectedSensorId ? (
              <div className="py-32 flex flex-col items-center gap-4 text-center">
                <div className="h-16 w-16 rounded-full bg-muted/60 flex items-center justify-center">
                  <Activity className="h-8 w-8 text-muted-foreground/30" />
                </div>
                <p className="text-muted-foreground font-bold max-w-[280px]">{t('selectSensorPrompt')}</p>
              </div>
            ) : readingsChartData.length === 0 ? (
              <div className="py-32 text-center text-muted-foreground font-bold">{tProd('noDataFound')}</div>
            ) : (
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={readingsChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--outline-variant))" />
                    <XAxis dataKey="time" tick={{ fontSize: 10, fill: "hsl(var(--on-surface-variant))" }} axisLine={false} tickLine={false} dy={10} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--on-surface-variant))" }} axisLine={false} tickLine={false} dx={-10} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "hsl(var(--surface-container-lowest))", borderRadius: "12px", border: "1px solid hsl(var(--outline-variant))", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                      labelStyle={{ fontWeight: "black", marginBottom: "4px", color: "hsl(var(--primary))" }}
                    />
                    <Line
                      type="monotone" dataKey="value"
                      stroke="hsl(var(--primary))" strokeWidth={4}
                      dot={{ r: 4, strokeWidth: 2, fill: "white" }}
                      activeDot={{ r: 7, strokeWidth: 0 }}
                      name={t('readingValue')}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </TabsContent>
    </>
  );
}
