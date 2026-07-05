/**
 * @module InspectionPage
 * @description React page component. Route-level UI.
 */

import { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { RoomReferenceUpload } from '@/components/hr/inspection/RoomReferenceUpload';
import { ManualInspectionForm } from '@/components/hr/inspection/ManualInspectionForm';
import { useAuth } from '@/hooks/use-auth';
import type { RoomRow, AlertRow } from './InspectionPageTypes';
import { ROOMS, REFERENCE_PHOTO_ROLES, MANUAL_INSPECTION_ROLES, apiFetch } from './InspectionPageTypes';
import { RoomCard, AlertsTabContent } from './InspectionPageSections';
import { RoomDetailModal } from './InspectionPageDialogs';
import { EPStatusPill } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

export default function InspectionPage() {
  const { t } = useTranslation("common");
  const { user }      = useAuth();
  const userRole      = (user?.role ?? '').toUpperCase();
  const canUpload     = REFERENCE_PHOTO_ROLES.has(userRole);
  const canInspect    = MANUAL_INSPECTION_ROLES.has(userRole);

  const [rooms,       setRooms]       = useState<RoomRow[]>([]);
  const [alerts,      setAlerts]      = useState<AlertRow[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [detailRoom,  setDetailRoom]  = useState<string | null>(null);
  const [uploadRoom,  setUploadRoom]  = useState<string | null>(null);
  const [inspectRoom, setInspectRoom] = useState<string | null>(null);
  const [tab,         setTab]         = useState('rooms');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [roomsRes, alertsRes] = await Promise.all([
        apiFetch<{ items: RoomRow[] }>('/api/hr/inspection/rooms'),
        apiFetch<{ items: AlertRow[] }>('/api/hr/inspection/alerts?hours=48'),
      ]);
      setRooms(roomsRes.items ?? []);
      setAlerts(alertsRes.items ?? []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const anomalyCount = (Array.isArray(alerts) ? alerts : []).filter(
    (a) => a.cleanliness_score < 0.6 || a.order_score < 0.6 || a.equipment_ok === false,
  ).length;

  const getRoomMeta = (code: string) =>
    ROOMS.find((r) => r.code === code) ?? { code, name: code };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-[var(--ep-blue)]" />
            {t("xonaInspeksiyasi")}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{t("aiTahlilVaRealTimeMonitoring")}</p>
        </div>
        <div className="flex items-center gap-3">
          {anomalyCount > 0 && (
            <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
              <AlertTriangle className="w-4 h-4 text-[var(--ep-red)]" />
              <span className="text-sm font-semibold text-[var(--ep-red)]">{anomalyCount} muammo</span>
            </div>
          )}
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            {t("refresh")}
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="rooms">
            <Building2 className="w-4 h-4 mr-1" />{t("xonalar")}
          </TabsTrigger>
          <TabsTrigger value="alerts">
            <AlertTriangle className="w-4 h-4 mr-1" />Ogohlantirishlar
            {anomalyCount > 0 && (
              <EPStatusPill tone="danger" className="ml-1 h-4 px-1 text-[10px]">{anomalyCount}</EPStatusPill>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rooms" className="mt-4">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {(Array.isArray(ROOMS) ? ROOMS : []).map((r) => (
                <div key={r.code} className="h-48 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {(Array.isArray(ROOMS) ? ROOMS : []).map((r) => (
                <RoomCard
                  key={r.code}
                  room={r}
                  data={rooms.find((row) => row.room_code === r.code)}
                  onDetails={setDetailRoom}
                  onUpload={setUploadRoom}
                  onInspect={setInspectRoom}
                  canUpload={canUpload}
                  canInspect={canInspect}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="alerts" className="mt-4">
          <AlertsTabContent alerts={alerts} onDetail={setDetailRoom} />
        </TabsContent>
      </Tabs>

      <RoomDetailModal
        open={Boolean(detailRoom)}
        roomCode={detailRoom ?? ''}
        allRooms={rooms}
        onClose={() => setDetailRoom(null)}
      />

      {uploadRoom && (
        <RoomReferenceUpload
          open={Boolean(uploadRoom)}
          roomCode={uploadRoom}
          roomName={getRoomMeta(uploadRoom).name}
          onClose={() => setUploadRoom(null)}
          onSaved={() => { setUploadRoom(null); void load(); }}
        />
      )}

      {inspectRoom && (
        <ManualInspectionForm
          open={Boolean(inspectRoom)}
          roomCode={inspectRoom}
          roomName={getRoomMeta(inspectRoom).name}
          onClose={() => setInspectRoom(null)}
          onSaved={() => { setInspectRoom(null); void load(); }}
        />
      )}
    </div>
  );
}
