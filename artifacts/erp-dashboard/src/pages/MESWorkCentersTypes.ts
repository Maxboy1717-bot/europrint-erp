
import { tLabel } from '@/lib/i18n/tLabel';
/**
 * MESWorkCentersTypes.ts
 * Interfaces and helper functions for MESWorkCenters
 */

export interface Session {
  id: string;
  sessionNumber: string;
  equipmentId: string;
  equipmentName?: string;
  status: string;
  targetQuantity: number;
  actualQuantity: number;
  defectQuantity: number;
  runningTimeSeconds: number;
  stoppedTimeSeconds: number;
  oee?: number;
  orderNumber?: string;
  workerId?: string;
}

export interface EquipmentSummary {
  eqId: string;
  name: string;
  latest: Session;
  totalProduced: number;
  totalTarget: number;
  totalDefects: number;
  totalRunning: number;
  avgOee: number | null;
  progress: number;
  sessionCount: number;
}

export interface WcFormState {
  name: string;
  code: string;
  type: string;
  capacity: string;
}

export interface SessionFormState {
  equipmentId: string;
  targetQuantity: string;
  orderNumber: string;
}

export function oeeColor(v: number): string {
  if (v >= 0.85) return "text-[var(--ep-green)]";
  if (v >= 0.70) return "text-[var(--ep-yellow)]";
  return "text-[var(--ep-red)]";
}

export function statusBadge(s: string): { label: string; variant: "default" | "secondary" | "destructive" | "outline" } {
  const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    running:   { label: tLabel('common.MESWorkCenters.ishlamoqda', "Ishlamoqda"),   variant: "default" },
    active:    { label: "Aktiv",        variant: "default" },
    paused:    { label: "To'xtatildi",  variant: "secondary" },
    stopped:   { label: "To'xtadi",     variant: "destructive" },
    pending:   { label: tLabel('common.MESWorkCenters.kutilmoqda', "Kutilmoqda"),   variant: "outline" },
    completed: { label: "Tugadi",       variant: "secondary" },
  };
  return map[s] ?? { label: s, variant: "outline" as const };
}

export function fmtSecs(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  return h > 0 ? `${h}s ${m}d` : `${m} daq`;
}

export function buildEquipmentList(sessions: Session[]): EquipmentSummary[] {
  const byEquipment = sessions.reduce<Record<string, Session[]>>((acc, s) => {
    if (!acc[s.equipmentId]) acc[s.equipmentId] = [];
    acc[s.equipmentId].push(s);
    return acc;
  }, {});

  return Object.entries(byEquipment).map(([eqId, ss]) => {
    const latest = ss.sort((a, b) => new Date(b.id).getTime() - new Date(a.id).getTime())[0];
    const safeSs = Array.isArray(ss) ? ss : [];
    const totalProduced = safeSs.reduce((a, s) => a + (s.actualQuantity || 0), 0);
    const totalTarget   = safeSs.reduce((a, s) => a + (s.targetQuantity || 0), 0);
    const totalDefects  = safeSs.reduce((a, s) => a + (s.defectQuantity || 0), 0);
    const totalRunning  = safeSs.reduce((a, s) => a + (s.runningTimeSeconds || 0), 0);
    const oeeVals       = safeSs.filter(s => s.oee != null).map(s => s.oee ?? 0);
    const avgOee        = oeeVals.length
      ? oeeVals.reduce((a, v) => a + v, 0) / oeeVals.length
      : null;
    const progress = totalTarget > 0
      ? Math.min(100, Math.round((totalProduced / totalTarget) * 100))
      : 0;
    return {
      eqId,
      name: latest.equipmentName || eqId,
      latest,
      totalProduced,
      totalTarget,
      totalDefects,
      totalRunning,
      avgOee,
      progress,
      sessionCount: ss.length,
    };
  });
}
