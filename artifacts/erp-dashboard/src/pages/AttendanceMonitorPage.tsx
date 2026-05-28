/**
 * @module AttendanceMonitorPage
 * @description React page component. Route-level UI.
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import { apiRequest } from '@/lib/queryClient';
import { TerritoryEvent, LiveStatus, LogsResponse, buildMonthlyStats, exportCsv } from './AttendanceMonitorPageTypes';
import {
  AttendanceHeader, AttendanceStats,
  EventsTable, LiveEventsFeed,
} from './AttendanceMonitorPageSections';
import { MonthlyLateChart } from './AttendanceMonitorPageChart';
import { useTranslation } from '@/lib/i18n';

const SOCKET_URL = typeof window !== 'undefined' ? window.location.origin : '';

export default function AttendanceMonitorPage() {
  const { t } = useTranslation('common');
  const today = new Date().toISOString().slice(0, 10);

  const [date, setDate]               = useState(today);
  const [empFilter, setEmpFilter]     = useState('');
  const [deptFilter, setDeptFilter]   = useState('');
  const [liveEvents, setLiveEvents]   = useState<TerritoryEvent[]>([]);
  const [alertCount, setAlertCount]   = useState(0);
  const [wsConnected, setWsConnected] = useState(false);

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Socket.io auth delivered via httpOnly access_token cookie attached
    // to the WebSocket handshake when `withCredentials: true`. The server
    // gateway extracts it; no token needs to be passed from the client.
    const socket = io(`${SOCKET_URL}/territory`, {
      path:                 '/socket.io',
      transports:           ['websocket', 'polling'],
      reconnectionDelay:    2000,
      reconnectionAttempts: 10,
      withCredentials:      true,
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
    const q     = empFilter.trim().toLowerCase();
    const empOk = !q ||
      (e.employee_name ?? '').toLowerCase().includes(q) ||
      String(e.employee_id ?? '').includes(q);
    const deptOk = !deptFilter || e.department_name === deptFilter;
    return empOk && deptOk;
  }), [logs, empFilter, deptFilter]);

  const monthlyData    = buildMonthlyStats(logs);
  const allLiveEvents  = [...liveEvents, ...(stats.recent_events ?? [])].slice(0, 30);

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <AttendanceHeader
        date={stats.date}
        wsConnected={wsConnected}
        filtered={filtered}
        onRefresh={() => { void refetchLive(); void refetchLogs(); }}
        onExport={() => exportCsv(filtered)}
      />

      <AttendanceStats
        stats={stats}
        liveLoading={liveLoading}
        alertCount={alertCount}
        filteredCount={filtered.length}
      />

      {!wsConnected && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
          {t("wsDisconnected")}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <EventsTable
          filtered={filtered}
          logsLoading={logsLoading}
          empFilter={empFilter}
          deptFilter={deptFilter}
          departments={departments}
          date={date}
          onEmpFilterChange={setEmpFilter}
          onDeptFilterChange={setDeptFilter}
          onDateChange={setDate}
        />
        <LiveEventsFeed events={allLiveEvents} wsConnected={wsConnected} />
      </div>

      <MonthlyLateChart data={monthlyData} />
    </div>
  );
}
