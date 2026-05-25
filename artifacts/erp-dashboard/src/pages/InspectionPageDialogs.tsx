/**
 * @module InspectionPageDialogs
 * @description Dialog components for InspectionPage (detail modal, history chart).
 */

import { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Building2, AlertTriangle, TrendingUp, ArrowLeftRight, Camera } from 'lucide-react';
import type { RoomRow, HistoryRow } from './InspectionPageTypes';
import { ROOMS, apiFetch } from './InspectionPageTypes';
import { EPStatusPill } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

export function RoomDetailModal({
  open, roomCode, allRooms, onClose,
}: {
  open:     boolean;
  roomCode: string;
  allRooms: RoomRow[];
  onClose:  () => void;
}) {
  const { t } = useTranslation("common");
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

  const cs         = latest?.cleanliness_score;
  const os         = latest?.order_score;
  const eq         = latest?.equipment_ok;
  const hasAnomaly = (cs !== undefined && cs < 0.6) || (os !== undefined && os < 0.6) || eq === false;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[var(--ep-blue)]" />
            {roomMeta?.name ?? roomCode} — Batafsil
            {hasAnomaly && <EPStatusPill tone="danger" className="ml-2">{t("anomaliya")}</EPStatusPill>}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4" />{t("idealVsJoriyHolat")}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {([
                { label: 'Ideal (Referans)', src: refPhoto, border: 'border-green-200' },
                { label: 'Joriy holat',      src: curPhoto, border: hasAnomaly ? 'border-red-300' : 'border-blue-200' },
              ]).map(({ label, src, border }) => (
                <div key={label} className="space-y-1">
                  <p className="text-xs text-center text-gray-500 font-medium">{label}</p>
                  {src ? (
                    <img src={src} alt={label} className={`w-full h-44 object-cover rounded-lg border-2 ${border}`} />
                  ) : (
                    <div className="w-full h-44 rounded-lg border-2 border-dashed border-gray-200 flex items-center
                                    justify-center bg-gray-50">
                      <div className="text-center">
                        <Camera className="w-8 h-8 text-gray-300 mx-auto mb-1" />
                        <p className="text-xs text-gray-400">{t("rasmYoq")}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {([
              { label: 'Tozalik', value: cs },
              { label: 'Tartib',  value: os },
              { label: 'Umumiy',  value: cs !== undefined && os !== undefined ? (cs + os) / 2 : undefined },
            ]).map(({ label, value }) => {
              const pct   = value !== undefined ? Math.round(value * 100) : null;
              const color = pct === null
                ? 'text-gray-400'
                : pct >= 70 ? 'text-[var(--ep-green)]' : pct >= 50 ? 'text-[var(--ep-yellow)]' : 'text-[var(--ep-red)]';
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
              <p className="text-sm font-semibold text-[var(--ep-red)] flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />{t("aniqlanganMuammolar")}
              </p>
              {(Array.isArray(latest?.anomalies) ? latest?.anomalies : []).map((a, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-[var(--ep-red)]">
                  <span className="text-red-400">•</span>
                  <span>{a.description}</span>
                  <Badge
                    variant="outline"
                    className={`ml-auto text-xs ${
                      a.severity === 'critical' ? 'border-red-400 text-[var(--ep-red)]' : 'border-orange-300 text-[var(--ep-primary)]'
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
                {t("Yuklanmoqda...")}
              </div>
            ) : chartData.length === 0 ? (
              <div className="h-40 flex items-center justify-center bg-gray-50 rounded-lg text-gray-400 text-sm">
                {t("tarixiyMalumotYoq")}
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
