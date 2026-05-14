/**
 * @module AttendanceMonitorPageSections
 * @description UI sections and helper components for AttendanceMonitorPage.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Users, Clock, MapPin, Camera, RefreshCw, Download, Filter,
  ArrowRightCircle, ArrowLeftCircle, Activity, AlertTriangle, ShieldAlert,
} from 'lucide-react';
import { TerritoryEvent, LiveStatus, eventBadgeColor, fmtTime, fmtDate } from './AttendanceMonitorPageTypes';
import { EPPageHeader } from "@/components/ep";

// ─── Event Icon ───────────────────────────────────────────────────────────────

export function EventIcon({ type }: { type: string }) {
  switch (type) {
    case 'enter':        return <ArrowRightCircle className="h-3.5 w-3.5 text-[var(--ep-green)]" />;
    case 'exit':         return <ArrowLeftCircle  className="h-3.5 w-3.5 text-muted-foreground" />;
    case 'detected':     return <Camera           className="h-3.5 w-3.5 text-[var(--ep-blue)]" />;
    case 'absent_check': return <AlertTriangle    className="h-3.5 w-3.5 text-[var(--ep-yellow)]" />;
    case 'late_arrival': return <Clock            className="h-3.5 w-3.5 text-[var(--ep-primary)]" />;
    case 'unknown_face': return <ShieldAlert      className="h-3.5 w-3.5 text-[var(--ep-red)]" />;
    default:             return <Activity         className="h-3.5 w-3.5" />;
  }
}

// ─── Page Header ──────────────────────────────────────────────────────────────

interface AttendanceHeaderProps {
  date: string;
  wsConnected: boolean;
  filtered: TerritoryEvent[];
  onRefresh: () => void;
  onExport: () => void;
}

export function AttendanceHeader({ date, wsConnected, filtered, onRefresh, onExport }: AttendanceHeaderProps) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <EPPageHeader
        breadcrumb={<>Dashboard · <b className="text-foreground">Hudud Kuzatuvchi</b></>}
        title="Hudud Kuzatuvchi"
        subtitle="Kamera asosida real-vaqt davomad monitori · {date} <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${wsConnected ? 'bg-emerald-50 border-emerald-200 text-[var(--ep-green)]' : 'bg-gray-50 border-gray-200 text-gray-500'}`}> <span className={`w-1.5 h-1.5 rounded-full ${wsConnected ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} /> {wsConnected ? 'Socket.IO jonli' : 'Ulash...'} </span>"
      />
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onRefresh} className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" /> Yangilash
        </Button>
        <Button variant="outline" size="sm" onClick={onExport} className="gap-1.5" disabled={filtered.length === 0}>
          <Download className="h-3.5 w-3.5" /> CSV
        </Button>
      </div>
    </div>
  );
}

// ─── Stats Cards ──────────────────────────────────────────────────────────────

interface AttendanceStatsProps {
  stats: LiveStatus;
  liveLoading: boolean;
  alertCount: number;
  filteredCount: number;
}

export function AttendanceStats({ stats, liveLoading, alertCount, filteredCount }: AttendanceStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
      <Card className="border-0 shadow-sm">
        <CardContent className="pt-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg"><Users className="h-4 w-4 text-[var(--ep-green)]" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Hozir bor</p>
              <p className="text-2xl font-bold text-foreground">{liveLoading ? '…' : stats.present_count}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="border-0 shadow-sm">
        <CardContent className="pt-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg"><Clock className="h-5 w-5 text-[var(--ep-yellow)]" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Kech kelganlar</p>
              <p className="text-2xl font-bold text-foreground">{liveLoading ? '…' : stats.late_count}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="border-0 shadow-sm">
        <CardContent className="pt-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg"><Camera className="h-5 w-5 text-[var(--ep-blue)]" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Bugungi voqealar</p>
              <p className="text-2xl font-bold text-foreground">{liveLoading ? '…' : stats.events_today}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="border-0 shadow-sm">
        <CardContent className="pt-5">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${alertCount > 0 ? 'bg-red-100' : 'bg-purple-100'}`}>
              {alertCount > 0
                ? <ShieldAlert className="h-5 w-5 text-[var(--ep-red)]" />
                : <MapPin      className="h-5 w-5 text-[var(--ep-purple)]" />}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{alertCount > 0 ? 'Xavfsizlik ogohlantirishlari' : 'Filtr natijalar'}</p>
              <p className="text-2xl font-bold text-foreground">{alertCount > 0 ? alertCount : filteredCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Events Table ─────────────────────────────────────────────────────────────

interface EventsTableProps {
  filtered: TerritoryEvent[];
  logsLoading: boolean;
  empFilter: string;
  deptFilter: string;
  departments: string[];
  date: string;
  onEmpFilterChange: (v: string) => void;
  onDeptFilterChange: (v: string) => void;
  onDateChange: (v: string) => void;
}

export function EventsTable({
  filtered, logsLoading, empFilter, deptFilter, departments, date,
  onEmpFilterChange, onDeptFilterChange, onDateChange,
}: EventsTableProps) {
  return (
    <Card className="lg:col-span-2 border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle className="text-base font-semibold">Hudud Voqealari</CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Filter className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Xodim ismi yoki ID"
                value={empFilter}
                onChange={(e) => onEmpFilterChange(e.target.value)}
                className="pl-7 h-8 w-40 text-sm"
              />
            </div>
            <select
              value={deptFilter}
              onChange={(e) => onDeptFilterChange(e.target.value)}
              className="h-8 rounded-md border border-input bg-background text-sm px-2 focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Barcha bo'limlar</option>
              {departments.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <Input
              type="date"
              value={date}
              onChange={(e) => onDateChange(e.target.value)}
              className="h-8 w-36 text-sm"
            />
          </div>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="p-0">
        {logsLoading ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">Yuklanmoqda…</div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">Bu sana uchun voqealar yo'q</div>
        ) : (
          <ScrollArea className="h-[420px]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-surface-variant/30">
                  <th className="text-left py-2 px-4 font-medium text-xs text-muted-foreground">Sana/Vaqt</th>
                  <th className="text-left py-2 px-4 font-medium text-xs text-muted-foreground">Xodim</th>
                  <th className="text-left py-2 px-4 font-medium text-xs text-muted-foreground">Bo'lim</th>
                  <th className="text-left py-2 px-4 font-medium text-xs text-muted-foreground">Voqea</th>
                  <th className="text-left py-2 px-4 font-medium text-xs text-muted-foreground">Xona</th>
                  <th className="text-right py-2 px-4 font-medium text-xs text-muted-foreground">Ishonch</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((event) => (
                  <tr key={event.id} className="border-b last:border-0 hover:bg-surface-variant/20 transition-colors">
                    <td className="py-2.5 px-4 text-xs text-muted-foreground whitespace-nowrap">
                      <span className="text-foreground font-medium">{fmtTime(event.ts)}</span>
                      <span className="ml-1 opacity-60">{fmtDate(event.ts)}</span>
                    </td>
                    <td className="py-2.5 px-4 text-xs">
                      {event.employee_name ? (
                        <span className="font-medium text-foreground">{event.employee_name}</span>
                      ) : event.employee_id ? (
                        <span className="font-mono text-muted-foreground">#{event.employee_id}</span>
                      ) : (
                        <span className="text-[var(--ep-red)] font-medium">Noma'lum</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-xs text-muted-foreground">{event.department_name ?? '—'}</td>
                    <td className="py-2.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border font-medium ${eventBadgeColor(event.event_type)}`}>
                        <EventIcon type={event.event_type} />{event.event_type}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-xs text-muted-foreground">{event.room_code ?? '—'}</td>
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
  );
}

// ─── Live Events Feed ─────────────────────────────────────────────────────────

interface LiveEventsFeedProps {
  events: TerritoryEvent[];
  wsConnected: boolean;
}

export function LiveEventsFeed({ events, wsConnected }: LiveEventsFeedProps) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">So'nggi Voqealar</CardTitle>
          <Badge
            variant="outline"
            className={`text-xs gap-1 ${wsConnected ? 'border-emerald-300 text-[var(--ep-green)]' : 'border-gray-300 text-gray-500'}`}
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
        {events.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">So'nggi voqealar yo'q</div>
        ) : (
          <ScrollArea className="h-[420px]">
            <div className="divide-y">
              {events.map((ev, idx) => (
                <div key={`${ev.id}-${idx}`} className="flex items-start gap-3 p-3 hover:bg-surface-variant/10 transition-colors">
                  <div className="mt-0.5 p-1.5 bg-surface-variant rounded-md flex-shrink-0">
                    <EventIcon type={ev.event_type} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-sm text-foreground truncate">
                        {ev.employee_name ?? (ev.employee_id ? `#${ev.employee_id}` : 'Noma\'lum')}
                      </span>
                      <span className="text-xs text-muted-foreground flex-shrink-0">{fmtTime(ev.ts)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className={`text-xs px-1.5 py-0.5 rounded border ${eventBadgeColor(ev.event_type)}`}>{ev.event_type}</span>
                      {ev.department_name && <span className="text-xs text-muted-foreground">· {ev.department_name}</span>}
                      {ev.room_code && <span className="text-xs text-muted-foreground">· {ev.room_code}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
