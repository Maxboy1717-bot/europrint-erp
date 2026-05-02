import { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Building2, AlertTriangle, CheckCircle2, RefreshCw, Camera, ClipboardCheck, TrendingUp,
  Clock, Image, ArrowLeftRight,
} from 'lucide-react';
import { RoomReferenceUpload } from '@/components/hr/inspection/RoomReferenceUpload';
import { ManualInspectionForm } from '@/components/hr/inspection/ManualInspectionForm';
import { useAuth } from '@/hooks/use-auth';

interface RoomRow {
  room_code:          string;
  room_name:          string;
  photo_url?:         string;
  description?:       string;
  cleanliness_score?: number;
  order_score?:       number;
  equipment_ok?:      boolean;
  anomalies?:         { type: string; description: string; severity: string }[];
  analyzed_at?:       string;
  current_photo_url?: string;
}

interface AlertRow {
  id:                string;
  room_code:         string;
  cleanliness_score: number;
  order_score:       number;
  equipment_ok:      boolean;
  anomalies:         { type: string; description: string; severity: string }[];
  analyzed_at:       string;
}

interface HistoryRow {
  analyzed_at:       string;
  cleanliness_score: number;
  order_score:       number;
  equipment_ok:      boolean;
}

const ROOMS = [
  { code: 'OFFSET',    name: 'Ofset bosma' },
  { code: 'FLEXO',     name: 'Fleksografiya' },
  { code: 'PREPRESS',  name: 'Prepress' },
  { code: 'CUTTING',   name: 'Kesish/Bukish' },
  { code: 'WAREHOUSE', name: 'Ombor' },
  { code: 'OFFICE',    name: 'Ofis' },
  { code: 'OSHXONA',   name: 'Oshxona' },
  { code: 'SANITAR',   name: 'Sanitar xonalar' },
];

const REFERENCE_PHOTO_ROLES = new Set(['SUPER_ADMIN', 'DIRECTOR', 'HR_MANAGER', 'HR_DIRECTOR']);
const MANUAL_INSPECTION_ROLES = new Set(['SUPER_ADMIN', 'DIRECTOR', 'HR_MANAGER', 'HR_DIRECTOR', 'SECURITY']);

function getToken(): string {
  return localStorage.getItem('access_token') ?? '';
}

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(path, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json() as Promise<T>;
}

function ScoreBar({ value = 0, label }: { value?: number; label: string }) {
  const pct   = Math.round((value ?? 0) * 100);
  const color = pct >= 70 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-xs text-gray-600">
        <span>{label}</span><span>{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function RoomCard({
  room, data, onDetails, onUpload, onInspect, canUpload, canInspect,
}: {
  room:       { code: string; name: string };
  data?:      RoomRow;
  onDetails:  (code: string) => void;
  onUpload:   (code: string) => void;
  onInspect:  (code: string) => void;
  canUpload:  boolean;
  canInspect: boolean;
}) {
  const cs       = data?.cleanliness_score;
  const os       = data?.order_score;
  const eq       = data?.equipment_ok;
  const avg      = cs !== undefined && os !== undefined ? (cs + os) / 2 : undefined;
  const hasAnomaly = (cs !== undefined && cs < 0.6) || (os !== undefined && os < 0.6) || eq === false;
  const hasData    = cs !== undefined;

  return (
    <div
      className={`bg-white rounded-xl border-2 p-4 flex flex-col gap-3 transition-all hover:shadow-md ${
        hasAnomaly ? 'border-red-300' : hasData ? 'border-green-200' : 'border-gray-200'
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <Building2 className={`w-4 h-4 ${hasAnomaly ? 'text-red-500' : 'text-blue-500'}`} />
            <span className="font-semibold text-sm">{room.name}</span>
          </div>
          <span className="text-xs text-gray-400">{room.code}</span>
        </div>
        {hasAnomaly
          ? <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          : hasData
            ? <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
            : <Badge variant="outline" className="text-xs">Ma'lumot yo'q</Badge>
        }
      </div>

      {hasData ? (
        <div className="space-y-1.5">
          <ScoreBar value={cs} label="Tozalik" />
          <ScoreBar value={os} label="Tartib" />
          <div className="flex items-center gap-1 text-xs">
            <span className="text-gray-500">Jihozlar:</span>
            <span className={eq ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
              {eq ? '✓ Joyida' : '✗ Muammo'}
            </span>
            {avg !== undefined && (
              <span className="ml-auto font-semibold text-gray-700">{Math.round(avg * 100)}%</span>
            )}
          </div>
          {data?.analyzed_at && (
            <div className="flex items-center gap-1 text-[11px] text-gray-400">
              <Clock className="w-3 h-3" />
              {new Date(data.analyzed_at).toLocaleString('uz')}
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs text-gray-400 italic">Hali inspeksiya o'tkazilmagan</p>
      )}

      <div className="flex gap-1.5 pt-1">
        <Button
          size="sm" variant="ghost" className="flex-1 h-7 text-xs"
          onClick={() => onDetails(room.code)}
        >
          <ArrowLeftRight className="w-3 h-3 mr-1" />Taqqoslash
        </Button>
        {canUpload && (
          <Button size="sm" variant="ghost" className="h-7 text-xs px-2" onClick={() => onUpload(room.code)}
                  title="Referans rasm yuklash">
            <Image className="w-3 h-3" />
          </Button>
        )}
        {canInspect && (
          <Button size="sm" variant="ghost" className="h-7 text-xs px-2" onClick={() => onInspect(room.code)}
                  title="Qo'lda inspeksiya">
            <ClipboardCheck className="w-3 h-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

function RoomDetailModal({
  open, roomCode, allRooms, onClose,
}: {
  open:     boolean;
  roomCode: string;
  allRooms: RoomRow[];
  onClose:  () => void;
}) {
  const [history,        setHistory]        = useState<HistoryRow[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const roomMeta = ROOMS.find((r) => r.code === roomCode);
  const latest   = allRooms.find((r) => r.room_code === roomCode);
  const refPhoto = latest?.photo_url ?? null;
  const curPhoto = latest?.current_photo_url ?? null;

  useEffect(() => {
    if (!open || !roomCode) return;
    setLoadingHistory(true);
    apiFetch<{ items: HistoryRow[] }>(`/api/hr/inspection/rooms/${roomCode}/history?days=14&limit=50`)
      .then((r) => setHistory(r.items ?? []))
      .catch(() => setHistory([]))
      .finally(() => setLoadingHistory(false));
  }, [open, roomCode]);

  const chartData = [...(history ?? [])].reverse().map((h) => ({
    date:    new Date(h.analyzed_at).toLocaleDateString('uz', { day: '2-digit', month: '2-digit' }),
    tozalik: Math.round((h.cleanliness_score ?? 0) * 100),
    tartib:  Math.round((h.order_score ?? 0) * 100),
  }));

  const cs       = latest?.cleanliness_score;
  const os       = latest?.order_score;
  const eq       = latest?.equipment_ok;
  const hasAnomaly = (cs !== undefined && cs < 0.6) || (os !== undefined && os < 0.6) || eq === false;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            {roomMeta?.name ?? roomCode} — Batafsil
            {hasAnomaly && <Badge variant="destructive" className="ml-2">Anomaliya</Badge>}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4" />Ideal vs Joriy holat
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {([
                { label: 'Ideal (Referans)', src: refPhoto, border: 'border-green-200' },
                { label: 'Joriy holat',      src: curPhoto, border: hasAnomaly ? 'border-red-300' : 'border-blue-200' },
              ] ?? []).map(({ label, src, border }) => (
                <div key={label} className="space-y-1">
                  <p className="text-xs text-center text-gray-500 font-medium">{label}</p>
                  {src ? (
                    <img src={src} alt={label} className={`w-full h-44 object-cover rounded-lg border-2 ${border}`} />
                  ) : (
                    <div className="w-full h-44 rounded-lg border-2 border-dashed border-gray-200 flex items-center
                                    justify-center bg-gray-50">
                      <div className="text-center">
                        <Camera className="w-8 h-8 text-gray-300 mx-auto mb-1" />
                        <p className="text-xs text-gray-400">Rasm yo'q</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {([
              { label: 'Tozalik', value: cs },
              { label: 'Tartib',  value: os },
              { label: 'Umumiy',  value: cs !== undefined && os !== undefined ? (cs + os) / 2 : undefined },
            ] ?? []).map(({ label, value }) => {
              const pct   = value !== undefined ? Math.round(value * 100) : null;
              const color = pct === null
                ? 'text-gray-400'
                : pct >= 70 ? 'text-green-600' : pct >= 50 ? 'text-yellow-600' : 'text-red-600';
              return (
                <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className={`text-2xl font-bold ${color}`}>{pct !== null ? `${pct}%` : '—'}</p>
                </div>
              );
            })}
          </div>

          {(latest?.anomalies ?? []).length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 space-y-1">
              <p className="text-sm font-semibold text-red-700 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />Aniqlangan muammolar
              </p>
              {(latest?.anomalies ?? []).map((a, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-red-600">
                  <span className="text-red-400">•</span>
                  <span>{a.description}</span>
                  <Badge
                    variant="outline"
                    className={`ml-auto text-xs ${
                      a.severity === 'critical' ? 'border-red-400 text-red-600' : 'border-orange-300 text-orange-600'
                    }`}
                  >
                    {a.severity}
                  </Badge>
                </div>
              ))}
            </div>
          )}

          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />14 kunlik tarix
            </h3>
            {loadingHistory ? (
              <div className="h-40 flex items-center justify-center text-gray-400 text-sm">
                Yuklanmoqda...
              </div>
            ) : chartData.length === 0 ? (
              <div className="h-40 flex items-center justify-center bg-gray-50 rounded-lg text-gray-400 text-sm">
                Tarixiy ma'lumot yo'q
              </div>
            ) : (
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v: number) => `${v}%`} />
                    <ReferenceLine
                      y={60} stroke="#ef4444" strokeDasharray="4 4"
                      label={{ value: 'Chegara', position: 'right', fontSize: 9, fill: '#ef4444' }}
                    />
                    <Line type="monotone" dataKey="tozalik" stroke="#22c55e" strokeWidth={2} dot={false} name="Tozalik" />
                    <Line type="monotone" dataKey="tartib"  stroke="#3b82f6" strokeWidth={2} dot={false} name="Tartib" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function InspectionPage() {
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

  const anomalyCount = (alerts ?? []).filter((a) => {
    return a.cleanliness_score < 0.6 || a.order_score < 0.6 || a.equipment_ok === false;
  }).length;

  const getRoomMeta = (code: string) =>
    ROOMS.find((r) => r.code === code) ?? { code, name: code };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-600" />
            Xona Inspeksiyasi
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">AI tahlil va real-time monitoring</p>
        </div>
        <div className="flex items-center gap-3">
          {anomalyCount > 0 && (
            <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="text-sm font-semibold text-red-600">{anomalyCount} muammo</span>
            </div>
          )}
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Yangilash
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="rooms">
            <Building2 className="w-4 h-4 mr-1" />Xonalar
          </TabsTrigger>
          <TabsTrigger value="alerts">
            <AlertTriangle className="w-4 h-4 mr-1" />Ogohlantirishlar
            {anomalyCount > 0 && (
              <Badge variant="destructive" className="ml-1 h-4 px-1 text-[10px]">{anomalyCount}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rooms" className="mt-4">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {(ROOMS ?? []).map((r) => (
                <div key={r.code} className="h-48 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {(ROOMS ?? []).map((r) => (
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
          {(alerts ?? []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
              <CheckCircle2 className="w-12 h-12 text-green-300" />
              <p className="text-base font-medium text-gray-500">So'nggi 48 soatda muammo aniqlanmadi</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(alerts ?? []).map((a) => {
                const r      = getRoomMeta(a.room_code);
                const cs     = Math.round((a.cleanliness_score ?? 0) * 100);
                const os     = Math.round((a.order_score ?? 0) * 100);
                const isAnom = cs < 60 || os < 60 || a.equipment_ok === false;
                return (
                  <div
                    key={a.id}
                    className={`bg-white rounded-xl border p-4 flex items-start gap-4 ${
                      isAnom ? 'border-red-200 bg-red-50/30' : 'border-green-200'
                    }`}
                  >
                    {isAnom
                      ? <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                      : <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                    }
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{r.name}</span>
                        <span className="text-xs text-gray-400">{r.code}</span>
                      </div>
                      <div className="flex gap-3 mt-1 text-xs text-gray-600">
                        <span>Tozalik: <b>{cs}%</b></span>
                        <span>Tartib: <b>{os}%</b></span>
                        <span>Jihozlar: <b>{a.equipment_ok ? '✓' : '✗'}</b></span>
                      </div>
                      {(a.anomalies ?? []).length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {(a.anomalies ?? []).slice(0, 3).map((an, i) => (
                            <Badge key={i} variant="outline" className="text-[10px] border-red-200 text-red-600">
                              {an.type}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[11px] text-gray-400">
                        {new Date(a.analyzed_at).toLocaleString('uz', {
                          day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                      <Button
                        size="sm" variant="ghost" className="h-6 text-xs mt-1"
                        onClick={() => setDetailRoom(a.room_code)}
                      >
                        Batafsil
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
