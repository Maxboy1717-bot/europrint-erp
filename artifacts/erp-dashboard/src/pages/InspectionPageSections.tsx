/**
 * @module InspectionPageSections
 * @description Reusable section and card components for InspectionPage.
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Building2, AlertTriangle, CheckCircle2, Clock, Image, ArrowLeftRight, ClipboardCheck,
} from 'lucide-react';
import type { RoomRow, AlertRow } from './InspectionPageTypes';
import { ROOMS } from './InspectionPageTypes';
import { useTranslation } from '@/lib/i18n';

export function ScoreBar({ value = 0, label }: { value?: number; label: string }) {
  const { t } = useTranslation("common");
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

export function RoomCard({
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
  const cs         = data?.cleanliness_score;
  const os         = data?.order_score;
  const eq         = data?.equipment_ok;
  const avg        = cs !== undefined && os !== undefined ? (cs + os) / 2 : undefined;
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
            <Building2 className={`w-4 h-4 ${hasAnomaly ? 'text-[var(--ep-red)]' : 'text-[var(--ep-blue)]'}`} />
            <span className="font-semibold text-sm">{room.name}</span>
          </div>
          <span className="text-xs text-gray-400">{room.code}</span>
        </div>
        {hasAnomaly
          ? <AlertTriangle className="w-5 h-5 text-[var(--ep-red)] shrink-0 mt-0.5" />
          : hasData
            ? <CheckCircle2 className="w-5 h-5 text-[var(--ep-green)] shrink-0 mt-0.5" />
            : <Badge variant="outline" className="text-xs">{t("malumotYoq")}</Badge>
        }
      </div>

      {hasData ? (
        <div className="space-y-1.5">
          <ScoreBar value={cs} label={t("tozalik1")} />
          <ScoreBar value={os} label={t("tartib")} />
          <div className="flex items-center gap-1 text-xs">
            <span className="text-gray-500">{t("jihozlar1")}</span>
            <span className={eq ? 'text-[var(--ep-green)] font-medium' : 'text-[var(--ep-red)] font-medium'}>
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
        <p className="text-xs text-gray-400 italic">{t("haliInspeksiyaOtkazilmagan")}</p>
      )}

      <div className="flex gap-1.5 pt-1">
        <Button
          size="sm" variant="ghost" className="flex-1 h-7 text-xs"
          onClick={() => onDetails(room.code)}
        >
          <ArrowLeftRight className="w-3 h-3 mr-1" />{t("taqqoslash")}
        </Button>
        {canUpload && (
          <Button size="sm" variant="ghost" className="h-7 text-xs px-2"
                  onClick={() => onUpload(room.code)} title={t("referansRasmYuklash")}>
            <Image className="w-3 h-3" />
          </Button>
        )}
        {canInspect && (
          <Button size="sm" variant="ghost" className="h-7 text-xs px-2"
                  onClick={() => onInspect(room.code)} title={t("qoldaInspeksiya")}>
            <ClipboardCheck className="w-3 h-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

function getRoomMeta(code: string) {
  return ROOMS.find((r) => r.code === code) ?? { code, name: code };
}

export function AlertsTabContent({
  alerts,
  onDetail,
}: {
  alerts: AlertRow[];
  onDetail: (code: string) => void;
}) {
  if ((alerts ?? []).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
        <CheckCircle2 className="w-12 h-12 text-green-300" />
        <p className="text-base font-medium text-gray-500">{t("songgi48SoatdaMuammoAniqlanmadi")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {(Array.isArray(alerts) ? alerts : []).map((a) => {
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
              ? <AlertTriangle className="w-5 h-5 text-[var(--ep-red)] mt-0.5 shrink-0" />
              : <CheckCircle2 className="w-5 h-5 text-[var(--ep-green)] mt-0.5 shrink-0" />
            }
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">{r.name}</span>
                <span className="text-xs text-gray-400">{r.code}</span>
              </div>
              <div className="flex gap-3 mt-1 text-xs text-gray-600">
                <span>{t("tozalik")}<b>{cs}%</b></span>
                <span>{t("tartib1")}<b>{os}%</b></span>
                <span>{t("jihozlar1")}<b>{a.equipment_ok ? '✓' : '✗'}</b></span>
              </div>
              {(a.anomalies ?? []).length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {(a.anomalies ?? []).slice(0, 3).map((an, i) => (
                    <Badge key={i} variant="outline" className="text-[10px] border-red-200 text-[var(--ep-red)]">
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
                onClick={() => onDetail(a.room_code)}
              >
                {t("Batafsil")}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
