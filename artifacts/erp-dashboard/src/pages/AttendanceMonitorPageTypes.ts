/**
 * @module AttendanceMonitorPageTypes
 * @description Types, interfaces, and pure utility functions for AttendanceMonitorPage.
 */

export interface TerritoryEvent {
  id:              string;
  employee_id:     number | null;
  employee_name:   string | null;
  department_name: string | null;
  event_type:      'enter' | 'exit' | 'detected' | 'absent_check';
  room_code:       string | null;
  ts:              string;
  confidence:      string | null;
}

export interface LiveStatus {
  date:           string;
  present_count:  number;
  late_count:     number;
  events_today:   number;
  recent_events:  TerritoryEvent[];
}

export interface LogsResponse {
  date: string;
  logs: TerritoryEvent[];
}

export interface MonthlyLatePoint { month: string; late_count: number; }

export function eventBadgeColor(type: string): string {
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

export function fmtTime(ts: string): string {
  try { return new Date(ts).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' }); }
  catch { return ts; }
}

export function fmtDate(ts: string): string {
  try { return new Date(ts).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit' }); }
  catch { return ts; }
}

export function buildMonthlyStats(logs: TerritoryEvent[]): MonthlyLatePoint[] {
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

export function exportCsv(events: TerritoryEvent[]): void {
  const header = 'ID,Employee ID,Employee Name,Department,Event,Room,Time,Confidence';
  const rows = (Array.isArray(events) ? events : []).map((e) =>
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
