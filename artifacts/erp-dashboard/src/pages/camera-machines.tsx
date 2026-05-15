/**
 * @module camera-machines
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { safeArray } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Factory, 
  Play,
  Pause,
  Square,
  Wrench,
  AlertTriangle,
  Clock,
  ArrowLeft,
  Activity,
  TrendingUp,
  Zap
} from "lucide-react";
import { Link } from "wouter";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { EPErrorState, EPPageHeader } from "@/components/ep";
interface MachineStatus {
  id: string;
  code: string;
  name: string;
  currentStatus: string;
  lastUpdate: string | null;
  stopReason: string | null;
}

interface MachineStatusLog {
  id: number;
  workCenterId: string;
  status: string;
  previousStatus: string | null;
  durationMinutes: number | null;
  stopReason: string | null;
  stopReasonDetail: string | null;
  createdAt: string;
}

const statusLabels: Record<string, { uz: string; ru: string; color: string; icon: typeof Play }> = {
  running: { uz: "Ishlayapti", ru: "Работает", color: "bg-green-100 text-green-800", icon: Play },
  idle: { uz: "Bo'sh", ru: "Простаивает", color: "bg-yellow-100 text-yellow-800", icon: Pause },
  stopped: { uz: "To'xtagan", ru: "Остановлен", color: "bg-red-100 text-red-800", icon: Square },
  maintenance: { uz: "Ta'mirlash", ru: "Обслуживание", color: "bg-blue-100 text-blue-800", icon: Wrench },
  breakdown: { uz: "Buzilgan", ru: "Поломка", color: "bg-red-200 text-red-900", icon: AlertTriangle },
  unknown: { uz: "Noma'lum", ru: "Неизвестно", color: "bg-muted/40 text-foreground", icon: Activity }
};

const stopReasonLabels: Record<string, { uz: string; ru: string }> = {
  material_shortage: { uz: "Material yetishmovchiligi", ru: "Нехватка материала" },
  maintenance: { uz: "Texnik xizmat", ru: "Техническое обслуживание" },
  breakdown: { uz: "Buzilish", ru: "Поломка" },
  changeover: { uz: "Sozlash", ru: "Переналадка" },
  no_order: { uz: "Buyurtma yo'q", ru: "Нет заказа" }
};

const COLORS = ['#22c55e', '#eab308', '#ef4444', '#3b82f6', '#dc2626'];

export default function CameraMachines() {
  const [language, setLanguage] = useState<"uz" | "ru">("uz");

  const { data: machines, isLoading: machinesLoading, isError, refetch} = useQuery<MachineStatus[]>({
    queryKey: ["/api/machine-status-current"]
  });

  const { data: logs, isLoading: logsLoading } = useQuery<MachineStatusLog[]>({
    queryKey: ["/api/machine-status-logs"]
  });

  const t = {
    title: language === "uz" ? "Mashina Holati" : "Статус машин",
    subtitle: language === "uz" ? "AI kamera orqali mashina holatlarini kuzatish" : "Мониторинг статуса машин через AI камеры",
    back: language === "uz" ? "Orqaga" : "Назад",
    totalMachines: language === "uz" ? "Jami mashinalar" : "Всего машин",
    running: language === "uz" ? "Ishlayapti" : "Работают",
    idle: language === "uz" ? "Bo'sh" : "Простаивают",
    stopped: language === "uz" ? "To'xtagan" : "Остановлены",
    machineStatus: language === "uz" ? "Mashina holati" : "Статус машины",
    statusHistory: language === "uz" ? "Holat tarixi" : "История статусов",
    machine: language === "uz" ? "Mashina" : "Машина",
    status: language === "uz" ? "Holat" : "Статус",
    duration: language === "uz" ? "Davomiylik" : "Длительность",
    reason: language === "uz" ? "Sabab" : "Причина",
    lastUpdate: language === "uz" ? "Oxirgi yangilanish" : "Последнее обновление",
    noMachines: language === "uz" ? "Mashinalar topilmadi" : "Машины не найдены",
    oee: language === "uz" ? "OEE (Umumiy samaradorlik)" : "OEE (Общая эффективность)",
    minutes: language === "uz" ? "daqiqa" : "минут"
  };

  const safeMachines = safeArray<MachineStatus>(machines);
  const safeLogs = safeArray<MachineStatusLog>(logs);

  const runningCount = (Array.isArray(safeMachines) ? safeMachines : []).filter(m => m.currentStatus === "running").length;
  const idleCount = (Array.isArray(safeMachines) ? safeMachines : []).filter(m => m.currentStatus === "idle").length;
  const stoppedCount = (Array.isArray(safeMachines) ? safeMachines : []).filter(m => ["stopped", "breakdown", "maintenance"].includes(m.currentStatus)).length;
  const totalMachines = safeMachines.length;

  const pieData = ([
    { name: t.running, value: runningCount },
    { name: t.idle, value: idleCount },
    { name: t.stopped, value: stoppedCount }
  ]).filter(d => d.value > 0);

  const oeeValue = totalMachines > 0 ? Math.round((runningCount / totalMachines) * 100) : 0;

  if (machinesLoading || logsLoading) {
    return (
      <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
        <Skeleton className="h-10 w-64 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {([...Array(4)]).map((_, i) => <Skeleton key={`k-${i}`} className="h-32 rounded-lg" />)}
        </div>
      </div>
    );
  }

  if (isError) {
    return <EPErrorState onRetry={refetch} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/camera-dashboard">
              <Button variant="ghost" size="sm" className="rounded-lg text-muted-foreground hover:bg-muted/40" data-testid="button-back">
                <ArrowLeft className="h-4 w-4 mr-1" />
                {t.back}
              </Button>
            </Link>
          </div>
          <EPPageHeader
        breadcrumb={<><b className="text-foreground">{t.title}</b></>}
        title={t.title}
        subtitle={t.subtitle}
      />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border overflow-hidden">
            <Button 
              variant={language === "uz" ? "default" : "ghost"} 
              size="sm"
              className="rounded-none px-4"
              onClick={() => setLanguage("uz")}
            >
              UZ
            </Button>
            <Button 
              variant={language === "ru" ? "default" : "ghost"} 
              size="sm"
              className="rounded-none px-4"
              onClick={() => setLanguage("ru")}
            >
              RU
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-card border-none rounded-lg p-5" data-testid="card-total-machines">
          <div className="flex flex-row items-center justify-between gap-2 mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.totalMachines}</span>
            <Factory className="h-4 w-4 text-primary" />
          </div>
          <div className="text-4xl font-bold tracking-tight text-foreground" data-testid="text-total-machines">{totalMachines}</div>
        </Card>

        <Card className="bg-card border-none rounded-lg p-5" data-testid="card-running">
          <div className="flex flex-row items-center justify-between gap-2 mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.running}</span>
            <Play className="h-5 w-5 text-[var(--ep-green)]" />
          </div>
          <div className="text-4xl font-bold tracking-tight text-[var(--ep-green)]" data-testid="text-running-count">{runningCount}</div>
          <Progress value={totalMachines > 0 ? (runningCount / totalMachines) * 100 : 0} className="mt-4 h-1.5 bg-muted/60" />
        </Card>

        <Card className="bg-card border-none rounded-lg p-5" data-testid="card-idle">
          <div className="flex flex-row items-center justify-between gap-2 mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.idle}</span>
            <Pause className="h-5 w-5 text-[var(--ep-yellow)]" />
          </div>
          <div className="text-4xl font-bold tracking-tight text-[var(--ep-yellow)]" data-testid="text-idle-count">{idleCount}</div>
          <Progress value={totalMachines > 0 ? (idleCount / totalMachines) * 100 : 0} className="mt-4 h-1.5 bg-muted/60" />
        </Card>

        <Card className="bg-card border-none rounded-lg p-5" data-testid="card-stopped">
          <div className="flex flex-row items-center justify-between gap-2 mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.stopped}</span>
            <Square className="h-5 w-5 text-[var(--ep-red)]" />
          </div>
          <div className="text-4xl font-bold tracking-tight text-[var(--ep-red)]" data-testid="text-stopped-count">{stoppedCount}</div>
          <Progress value={totalMachines > 0 ? (stoppedCount / totalMachines) * 100 : 0} className="mt-4 h-1.5 bg-muted/60" />
        </Card>

        <Card className="bg-card border-none rounded-lg p-5" data-testid="card-oee">
          <div className="flex flex-row items-center justify-between gap-2 mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.oee}</span>
            <Zap className="h-5 w-5 text-[var(--ep-blue)]" />
          </div>
          <div className={`text-4xl font-bold tracking-tight ${
            oeeValue >= 80 ? "text-[var(--ep-green)]" : oeeValue >= 60 ? "text-[var(--ep-yellow)]" : "text-[var(--ep-red)]"
          }`} data-testid="text-oee-value">{oeeValue}%</div>
          <Progress value={oeeValue} className="mt-4 h-1.5 bg-muted/60" />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-none rounded-lg overflow-hidden shadow-none" data-testid="card-status-pie">
          <CardHeader className="bg-muted/40/50 py-4 px-6">
            <CardTitle className="text-[14px] font-semibold font-bold text-foreground">{t.machineStatus}</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {(Array.isArray(pieData) ? pieData : []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                {t.noMachines}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-none rounded-lg overflow-hidden shadow-none" data-testid="card-machines-grid">
          <CardHeader className="bg-muted/40/50 py-4 px-6">
            <CardTitle className="text-[14px] font-semibold font-bold text-foreground">{t.machineStatus}</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ScrollArea className="h-[300px]">
              {safeMachines.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(Array.isArray(safeMachines) ? safeMachines : []).map((machine) => {
                    const statusInfo = statusLabels[machine.currentStatus] || statusLabels.unknown;
                    const IconComponent = statusInfo.icon;
                    return (
                      <div
                        key={machine.id}
                        className={`p-4 rounded-lg bg-background border hover:bg-muted/40 transition-colors group ${
                          machine.currentStatus === "running" ? "border-green-200" :
                          machine.currentStatus === "idle" ? "border-yellow-200" :
                          "border-red-200"
                        }`}
                        data-testid={`machine-card-${machine.id}`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-lg ${
                              machine.currentStatus === "running" ? "bg-green-100 text-[var(--ep-green)]" :
                              machine.currentStatus === "idle" ? "bg-yellow-100 text-[var(--ep-yellow)]" :
                              "bg-red-100 text-[var(--ep-red)]"
                            }`}>
                              <IconComponent className="h-4 w-4" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{machine.code}</span>
                          </div>
                          <Badge className={`${statusInfo.color} border-none rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider`}>
                            {language === "uz" ? statusInfo.uz : statusInfo.ru}
                          </Badge>
                        </div>
                        <p className="text-sm font-bold text-foreground truncate mb-1">{machine.name}</p>
                        {machine.stopReason && (
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--ep-red)]">
                            {stopReasonLabels[machine.stopReason]?.[language] || machine.stopReason}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-10">
                  <Factory className="h-12 w-12 mb-4 opacity-10" />
                  <p className="font-bold uppercase tracking-widest text-sm">{t.noMachines}</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-none rounded-lg overflow-hidden shadow-none" data-testid="card-status-history">
        <CardHeader className="bg-muted/40/50 py-4 px-6">
          <CardTitle className="text-[14px] font-semibold font-bold flex items-center gap-2 text-foreground">
            <Clock className="h-5 w-5 text-primary" />
            {t.statusHistory}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px]">
            <div className="ep-table-scroll"><Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t.machine}</TableHead>
                  <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t.status}</TableHead>
                  <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t.duration}</TableHead>
                  <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t.reason}</TableHead>
                  <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t.lastUpdate}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {safeLogs.length > 0 ? (
                  safeLogs.slice(0, 20).map((log) => {
                    const statusInfo = statusLabels[log.status] || statusLabels.unknown;
                    return (
                      <TableRow key={log.id} className="hover:bg-muted/40 transition-colors border-none" data-testid={`row-log-${log.id}`}>
                        <TableCell className="py-4 px-6 font-bold text-foreground">{log.workCenterId.slice(0, 8)}...</TableCell>
                        <TableCell className="py-4 px-6">
                          <Badge className={`${statusInfo.color} border-none rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider`}>
                            {language === "uz" ? statusInfo.uz : statusInfo.ru}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4 px-6 text-sm font-medium text-muted-foreground">
                          {log.durationMinutes ? `${log.durationMinutes} ${t.minutes}` : "—"}
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          {log.stopReason ? (
                            <span className="text-sm font-medium text-[var(--ep-red)]">{stopReasonLabels[log.stopReason]?.[language] || log.stopReason}</span>
                          ) : "—"}
                        </TableCell>
                        <TableCell className="py-4 px-6 text-sm font-medium text-muted-foreground">
                          {new Date(log.createdAt).toLocaleString(language === "uz" ? "uz-UZ" : "ru-RU")}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-20 text-[13px] text-muted-foreground">
                      <Clock className="h-16 w-16 mx-auto mb-4 opacity-10" />
                      <p className="font-bold uppercase tracking-widest text-sm">{language === "uz" ? "Tarix topilmadi" : "История не найдена"}</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table></div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
