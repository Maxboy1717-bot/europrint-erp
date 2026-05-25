/**
 * @module CameraMachinesData
 * @description Types, lookup tables, and constants for CameraMachines.
 * Extracted from camera-machines.tsx (Rule 16).
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MachineStatus {
  id: string;
  code: string;
  name: string;
  currentStatus: string;
  lastUpdate: string | null;
  stopReason: string | null;
}

export interface MachineStatusLog {
  id: number;
  workCenterId: string;
  status: string;
  previousStatus: string | null;
  durationMinutes: number | null;
  stopReason: string | null;
  stopReasonDetail: string | null;
  createdAt: string;
}

// ─── Lookup tables ────────────────────────────────────────────────────────────

import {
  Play, Pause, Square, Wrench, AlertTriangle, Activity,
} from "lucide-react";

export const statusLabels: Record<string, { uz: string; ru: string; color: string; icon: typeof Play }> = {
  running:     { uz: "Ishlayapti", ru: "Работает",     color: "bg-green-100 text-green-800",  icon: Play          },
  idle:        { uz: "Bo'sh",      ru: "Простаивает",  color: "bg-yellow-100 text-yellow-800", icon: Pause         },
  stopped:     { uz: "To'xtagan", ru: "Остановлен",   color: "bg-red-100 text-red-800",       icon: Square        },
  maintenance: { uz: "Ta'mirlash", ru: "Обслуживание", color: "bg-blue-100 text-blue-800",     icon: Wrench        },
  breakdown:   { uz: "Buzilgan",   ru: "Поломка",      color: "bg-red-200 text-red-900",       icon: AlertTriangle },
  unknown:     { uz: "Noma'lum",  ru: "Неизвестно",   color: "bg-muted/40 text-foreground",   icon: Activity      },
};

export const stopReasonLabels: Record<string, { uz: string; ru: string }> = {
  material_shortage: { uz: "Material yetishmovchiligi", ru: "Нехватка материала"        },
  maintenance:       { uz: "Texnik xizmat",             ru: "Техническое обслуживание"   },
  breakdown:         { uz: "Buzilish",                  ru: "Поломка"                    },
  changeover:        { uz: "Sozlash",                   ru: "Переналадка"                },
  no_order:          { uz: "Buyurtma yo'q",             ru: "Нет заказа"                 },
};

export const MACHINE_COLORS = ['#22c55e', '#eab308', '#ef4444', '#3b82f6', '#dc2626'];
