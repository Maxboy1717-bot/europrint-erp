import { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import { safeStorage } from '@/lib/safeStorage';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { apiRequest } from '@/lib/queryClient';
import {
  Users, Clock, MapPin, Camera, RefreshCw, Download, Filter,
  ArrowRightCircle, ArrowLeftCircle, Activity, AlertTriangle, ShieldAlert,
} from 'lucide-react';

const SOCKET_URL = typeof window !== 'undefined' ? window.location.origin : '';

interface TerritoryEvent {
  id:              string;
  employee_id:     number | null;
  employee_name:   string | null;
  department_name: string | null;
  event_type:      'enter' | 'exit' | 'detected' | 'absent_check';
  room_code:       string | null;
  ts:              string;
  confidence:      string | null;
}

interface LiveStatus {
  date:           string;
  present_count:  number;
  late_count:     number;
  events_today:   number;
  recent_events:  TerritoryEvent[];
}

interface LogsResponse {
  date: string;
  logs: TerritoryEvent[];
}

interface MonthlyLatePoint { month: string; late_count: number; }

function eventBadgeColor(type: string) {
  switch (type) {
    case 'enter':        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'exit':         return 'bg-slate-100 text-slate-700 border-slate-200';
    case 'detected':     return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'absent_check': return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'late_arrival': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'unknown_face': return 'bg-red-100 text-red-800 border-red-200';
    default:             return 'bg-gray-100 text-gray-700';
  }
}

function EventIcon({ type }: { type: string }) {
  switch (type) {
    case 'enter':        return <ArrowRightCircle className="h-3.5 w-3.5 text-emerald-600" />;
    case 'exit':         return <ArrowLeftCircle  className="h-3.5 w-3.5 text-slate-500" />;
    case 'detected':     return <Camera           className="h-3.5 w-3.5 text-blue-600" />;
    case 'absent_check': return <AlertTriangle    className="h-3.5 w-3.5 text-amber-600" />;
    case 'late_arrival': return <Clock            className="h-3.5 w-3.5 text-orange-500" />;
    case 'unknown_face': return <ShieldAlert      className="h-3.5 w-3.5 text-red-600" />;
    default:             return <Activity         className="h-3.5 w-3.5" />;
  }
}

function fmtTime(ts: string) {
  try { return new Date(ts).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' }); }
  catch { return ts; }
}

function fmtDate(ts: string) {
  try { return new Date(ts).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit' }); }
  catch { return ts; }
}

function buildMonthlyStats(logs: TerritoryEvent[]): MonthlyLatePoint[] {
  const map = new Map<string, number>();
  for (const l of logs) {
    if (l.event_type !== 'enter') continue;
    const d  = new Date(l.ts);
    const ts = new Date(l.ts);
    if (ts.getHours() > 9 || (ts.getHours() === 9 && ts.getMinutes() > 0)) {
      const key = `${d.getMonth() + 1}/${d.getFullYear()}`;
      map.set(key, (map.get(key) ?? 0) + 1);
    }
  }
  return Array.from(map.entries()).map(([month, late_count]) => ({ month, late_count }));
}

function exportCsv(events: TerritoryEvent[]) {
  const header = 'ID,Employee ID,Employee Name,Department,Event,Room,Time,Confidence';
  const rows = (events ?? []).map((e) =>
    [
      e.id,
      e.employee_id ?? '',
      `"${e.employee_name ?? ''}"`,
      `"${e.department_name ?? ''}"`,
      e.event_type,
      e.room_code ?? '-',
      e.ts,
      e.confidence ?? '',
    ].join(','),
  );
  const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `territory-events-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
}

export default function AttendanceMonitorPage() {
  const today = new Date().toISOString().slice(0, 10);

  const [date, setDate]               = useState(today);
  const [empFilter, setEmpFilter]     = useState('');
  const [deptFilter, setDeptFilter]   = useState('');
  const [liveEvents, setLiveEvents]   = useState<TerritoryEvent[]>([]);
  const [alertCount, setAlertCount]   = useState(0);
  const [wsConnected, setWsConnected] = useState(false);

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = safeStorage.getItem('access_token') ?? undefined;
    const socket = io(`${SOCKET_URL}/territory`, {
      path:                 '/socket.io',
      transports:           ['websocket', 'polling'],
      reconnectionDelay:    2000,
      reconnectionAttempts: 10,
      auth:                 token ? { token } : undefined,
    });

    socket.on('connect',    () => setWsConnected(true));
    socket.on('disconnect', () => setWsConnected(false));

    socket.on('territory.event', (payload: Record<string, unknown>) => {
      const event: TerritoryEvent = {
        id:              String(payload['log_id'] ?? `live-${Date.now()}`),
        employee_id:     payload['employee_id'] !== null && payload['employee_id'] !== undefined
                           ? Number(payload['employee_id'])
                           : null,
        employee_name:   payload['employee_name'] ? String(payload['employee_name']) : null,
        department_name: payload['department_name'] ? String(payload['department_name']) : null,
        event_type:      (payload['type'] as TerritoryEvent['event_type']) ?? 'detected',
        room_code:       String(payload['room_code'] ?? '') || null,
        ts:              String(payload['ts'] ?? new Date().toISOString()),
        confidence:      null,
      };
      setLiveEvents((prev) => [event, ...prev].slice(0, 100));
    });

    socket.on('security.alert', () => {
      setAlertCount((c) => c + 1);
    });

    socketRef.current = socket;
    return () => { socket.disconnect(); };
  }, []);

  const { data: live, isLoading: liveLoading, refetch: refetchLive } = useQuery<LiveStatus>({
    queryKey:        ['/api/hr/attendance/live'],
    queryFn:         () => apiRequest('GET', '/api/hr/attendance/live'),
    refetchInterval: 60_000,
  });

  const logsParams = new URLSearchParams({ date });
  if (empFilter.trim()) {
    const numId = parseInt(empFilter.trim(), 10);
    if (!isNaN(numId)) logsParams.set('employee_id', String(numId));
  }

  const { data: logsData, isLoading: logsLoading, refetch: refetchLogs } = useQuery<LogsResponse>({
    queryKey: ['/api/hr/attendance/territory/logs', date, empFilter],
    queryFn:  () => apiRequest('GET', `/api/hr/attendance/territory/logs?${logsParams.toString()}`),
  });

  const logs  = logsData?.logs ?? [];
  const stats = live ?? { date: today, present_count: 0, late_count: 0, events_today: 0, recent_events: [] };

  const departments = useMemo(() => {
    const set = new Set<string>();
    for (const l of logs) {
      if (l.department_name) set.add(l.department_name);
    }
    return Array.from(set).sort();
  }, [logs]);

  const filtered = useMemo(() => logs.filter((e) => {
    const q    = empFilter.trim().toLowerCase();
    const empOk = !q ||
      (e.employee_name ?? '').toLowerCase().includes(q) ||
      String(e.employee_id ?? '').includes(q);
    const deptOk = !deptFilter || e.department_name === deptFilter;
    return empOk && deptOk;
  }), [logs, empFilter, deptFilter]);

  const monthlyData = buildMonthlyStats(logs);

  const allLiveEvents = [...liveEvents, ...(stats.recent_events ?? [])].slice(0, 30);

  return (
    <div className="flex-1 overflow-auto bg-surface p-6 space-y-6 min-h-screen">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-light tracking-tight text-on-surface">
            Hudud <span className="font-bold text-primary">Kuzatuvchi</span>
          </h1>
          <p className="text-on-surface-variant mt-1 flex items-center gap-2">
            Kamera asosida real-vaqt davomad monitori · {stats.date}
            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${wsConnected ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${wsConnected ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
              {wsConnected ? 'Socket.IO jonli' : 'Ulash...'}
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { void refetchLive(); void refetchLogs(); }} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" /> Yangilash
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportCsv(filtered)} className="gap-1.5" disabled={filtered.length === 0}>
            <Download className="h-3.5 w-3.5" /> CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg"><Users className="h-5 w-5 text-emerald-600" /></div>
              <div>
                <p className="text-xs text-on-surface-variant">Hozir bor</p>
                <p className="text-2xl font-bold text-on-surface">{liveLoading ? '…' : stats.present_count}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg"><Clock className="h-5 w-5 text-amber-600" /></div>
              <div>
                <p className="text-xs text-on-surface-variant">Kech kelganlar</p>
                <p className="text-2xl font-bold text-on-surface">{liveLoading ? '…' : stats.late_count}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg"><Camera className="h-5 w-5 text-blue-600" /></div>
              <div>
                <p className="text-xs text-on-surface-variant">Bugungi voqealar</p>
                <p className="text-2xl font-bold text-on-surface">{liveLoading ? '…' : stats.events_today}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${alertCount > 0 ? 'bg-red-100' : 'bg-purple-100'}`}>
                {alertCount > 0
                  ? <ShieldAlert className="h-5 w-5 text-red-600" />
                  : <MapPin      className="h-5 w-5 text-purple-600" />}
              </div>
              <div>
                <p className="text-xs text-on-surface-variant">{alertCount > 0 ? 'Xavfsizlik ogohlantirishlari' : 'Filtr natijalar'}</p>
                <p className="text-2xl font-bold text-on-surface">{alertCount > 0 ? alertCount : filtered.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <CardTitle className="text-base font-semibold">Hudud Voqealari</CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Filter className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-on-surface-variant" />
                  <Input
                    placeholder="Xodim ismi yoki ID"
                    value={empFilter}
                    onChange={(e) => setEmpFilter(e.target.value)}
                    className="pl-7 h-8 w-40 text-sm"
                  />
                </div>
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="h-8 rounded-md border border-input bg-background text-sm px-2 focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">Barcha bo'limlar</option>
                  {departments.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-8 w-36 text-sm"
                />
              </div>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="p-0">
            {logsLoading ? (
              <div className="flex items-center justify-center h-40 text-on-surface-variant text-sm">Yuklanmoqda…</div>
            ) : filtered.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-on-surface-variant text-sm">Bu sana uchun voqealar yo'q</div>
            ) : (
              <ScrollArea className="h-[420px]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-surface-variant/30">
                      <th className="text-left py-2 px-4 font-medium text-xs text-on-surface-variant">Sana/Vaqt</th>
                      <th className="text-left py-2 px-4 font-medium text-xs text-on-surface-variant">Xodim</th>
                      <th className="text-left py-2 px-4 font-medium text-xs text-on-surface-variant">Bo'lim</th>
                      <th className="text-left py-2 px-4 font-medium text-xs text-on-surface-variant">Voqea</th>
                      <th className="text-left py-2 px-4 font-medium text-xs text-on-surface-variant">Xona</th>
                      <th className="text-right py-2 px-4 font-medium text-xs text-on-surface-variant">Ishonch</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((event) => (
                      <tr key={event.id} className="border-b last:border-0 hover:bg-surface-variant/20 transition-colors">
                        <td className="py-2.5 px-4 text-xs text-on-surface-variant whitespace-nowrap">
                          <span className="text-on-surface font-medium">{fmtTime(event.ts)}</span>
                          <span className="ml-1 opacity-60">{fmtDate(event.ts)}</span>
                        </td>
                        <td className="py-2.5 px-4 text-xs">
                          {event.employee_name ? (
                            <span className="font-medium text-on-surface">{event.employee_name}</span>
                          ) : event.employee_id ? (
                            <span className="font-mono text-on-surface-variant">#{event.employee_id}</span>
                          ) : (
                            <span className="text-red-600 font-medium">Noma'lum</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-xs text-on-surface-variant">
                          {event.department_name ?? '—'}
                        </td>
                        <td className="py-2.5 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border font-medium ${eventBadgeColor(event.event_type)}`}>
                            <EventIcon type={event.event_type} />{event.event_type}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-xs text-on-surface-variant">{event.room_code ?? '—'}</td>
                        <td className="py-2.5 px-4 text-right text-xs">
                          {event.confidence != null ? `${Math.round(parseFloat(event.confidence) * 100)}%` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">So'nggi Voqealar</CardTitle>
              <Badge
                variant="outline"
                className={`text-xs gap-1 ${wsConnected ? 'border-emerald-300 text-emerald-700' : 'border-gray-300 text-gray-500'}`}
              >
                <span className="relative flex h-2 w-2">
                  {wsConnected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />}
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${wsConnected ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                </span>
                {wsConnected ? 'Jonli' : 'Oflayn'}
              </Badge>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="p-0">
            {allLiveEvents.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-on-surface-variant text-sm">So'nggi voqealar yo'q</div>
            ) : (
              <ScrollArea className="h-[420px]">
                <div className="divide-y">
                  {allLiveEvents.map((ev, idx) => (
                    <div key={`${ev.id}-${idx}`} className="flex items-start gap-3 p-3 hover:bg-surface-variant/10 transition-colors">
                      <div className="mt-0.5 p-1.5 bg-surface-variant rounded-md flex-shrink-0">
                        <EventIcon type={ev.event_type} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-sm text-on-surface truncate">
                            {ev.employee_name ?? (ev.employee_id ? `#${ev.employee_id}` : 'Noma\'lum')}
                          </span>
                          <span className="text-xs text-on-surface-variant flex-shrink-0">{fmtTime(ev.ts)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className={`text-xs px-1.5 py-0.5 rounded border ${eventBadgeColor(ev.event_type)}`}>{ev.event_type}</span>
                          {ev.department_name && <span className="text-xs text-on-surface-variant">· {ev.department_name}</span>}
                          {ev.room_code && <span className="text-xs text-on-surface-variant">· {ev.room_code}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {monthlyData.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Oylik Kech Kelish Statistikasi</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData} margin={{ left: -10, right: 10, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-surface-variant, #e2e8f0)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip
                  formatter={(value: number) => [`${value} kishi`, 'Kech keldi']}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <Bar dataKey="late_count" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Kech keldi" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
