/**
 * @module IoTExtendedTypes
 * @description Types and constants for IoTExtended.
 */

import type { LucideIcon } from "lucide-react";
import { Activity, Brain, Gauge, Layers, AlertTriangle, BarChart3 } from "lucide-react";
import { z } from "zod";

export interface IoTSensor {
  id: number | string;
  sensorId?: number | string;
  name?: string;
  type?: string;
  sensorType?: string;
  location?: string;
  machineId?: number | string;
  isActive?: boolean;
  value?: number | string;
  minValue?: number;
  maxValue?: number;
  unit?: string;
  status?: string;
}

export interface IoTAlert {
  id: number | string;
  sensorId?: number | string;
  sensorName?: string;
  message?: string;
  alertMessage?: string;
  severity?: string;
  triggeredValue?: number | string;
  resolvedAt?: string | null;
  createdAt?: string;
}

export interface OEEData {
  name?: string;
  machineId?: number | string;
  workCenter?: string;
  oee?: number | string;
  value?: number | string;
  target?: number | string;
  availability?: number | string;
  performance?: number | string;
  quality?: number | string;
}

export interface PredictionData {
  name?: string;
  machineId?: number | string;
  machine?: string;
  risk?: number;
  daysUntilMaintenance?: number;
  recommendation?: string;
  prediction?: string;
}

export const URL_TAB_MAP: Record<string, string> = {
  "/iot/sensor-monitoring": "sensors",
  "/iot/predictive-maintenance": "predictive",
  "/iot/oee-live": "oee",
  "/iot/digital-twin": "twin",
  "/iot/alerts": "alerts",
};

export const tabMeta: Record<string, { title: string; icon: LucideIcon }> = {
  sensors:    { title: "Sensor Monitoring",  icon: Activity },
  predictive: { title: "Nosozlik Bashorati", icon: Brain },
  oee:        { title: "OEE Live",           icon: BarChart3 },
  twin:       { title: "Digital Twin",       icon: Layers },
  alerts:     { title: "Ogohlantirishlar",   icon: AlertTriangle },
};

export const SensorSchema = z.object({
  sensorId:    z.string().min(1),
  machineId:   z.string().min(1),
  sensorType:  z.string().min(1),
  unit:        z.string().min(1),
  minValue:    z.number(),
  maxValue:    z.number(),
  criticalMin: z.number(),
  criticalMax: z.number(),
});

export type SensorFormValues = z.infer<typeof SensorSchema>;
