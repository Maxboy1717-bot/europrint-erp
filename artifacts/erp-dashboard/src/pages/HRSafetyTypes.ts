/**
 * HRSafetyTypes.ts
 * Interfaces, Zod schemas, types and constants for HRSafety.
 */
import { z } from "zod";

export const IncidentSchema = z.object({
  userId:       z.string().optional(),
  incidentType: z.enum(["injury", "near_miss", "property_damage", "fire"]),
  severity:     z.enum(["minor", "major", "critical"]),
  description:  z.string().min(3, "Tavsif majburiy"),
  incidentDate: z.string().min(1, "Sana majburiy"),
  location:     z.string().min(1, "Joylashuv majburiy"),
});

export const PpeSchema = z.object({
  userId:    z.string().optional(),
  ppeType:   z.enum(["helmet", "gloves", "vest", "boots", "glasses"]),
  status:    z.enum(["compliant", "non_compliant"]),
  issuedDate: z.string().optional(),
  expiryDate: z.string().optional(),
});

// P1.23.3: trainingId (numeric FK) preferred; trainingName kept as fallback
export const TrainingSchema = z.object({
  userId:        z.string().optional(),
  trainingId:    z.string().optional(),           // selected course ID (numeric string)
  trainingName:  z.string().optional(),            // free-text fallback when no ID selected
  trainingType:  z.string().optional(),
  scheduledDate: z.string().optional(),
  expiryDate:    z.string().optional(),
  status:        z.enum(["pending", "completed", "expired"]),
}).refine(d => d.trainingId || d.trainingName, { message: "treningIdYokiNomiKerak", path: ["trainingName"] });

export const ZoneSchema = z.object({
  zoneName:     z.string().min(1, "Zona nomi majburiy"),
  zoneCode:     z.string().optional(),
  location:     z.string().min(1, "Joylashuv majburiy"),
  hazardType:   z.string().min(1, "Xavf turi majburiy"),
  description:  z.string().optional(),
  riskLevel:    z.enum(["low", "medium", "high", "critical"]),
  maxOccupancy: z.coerce.number().int().positive().optional(),
  requiredPpe:  z.string().optional(),
});

export type IncidentData  = z.infer<typeof IncidentSchema>;
export type PpeData       = z.infer<typeof PpeSchema>;
export type TrainingData  = z.infer<typeof TrainingSchema>;
export type ZoneData      = z.infer<typeof ZoneSchema>;

export interface SafetyIncident {
  id: number;
  userId?: number;
  incidentType?: string;
  severity?: string;
  description?: string;
  incidentDate?: string;
  location?: string;
  status?: string;
}

export interface SafetySummary {
  incidentsThisMonth?: number;
  ppeCompliancePercent?: number;
  expiringTrainings?: number;
  openIncidents?: number;
}

export interface PpeRecord {
  id: number;
  userId?: number;
  ppeType?: string;
  status?: string;
  issuedDate?: string;
  expiryDate?: string;
}

export interface SafetyTraining {
  id: number;
  userId?: number;
  trainingName?: string;
  status?: string;
  scheduledDate?: string;
  expiryDate?: string;
}

export interface HazardZone {
  id: number;
  zoneName?: string;
  zoneCode?: string;
  location?: string;
  hazardType?: string;
  riskLevel?: string;
  maxOccupancy?: number;
  requiredPpe?: string;
  isActive?: boolean;
}

export const RISK_COLORS: Record<string, string> = {
  low: "text-[var(--ep-green)]",
  medium: "text-[var(--ep-primary)]",
  high: "text-[var(--ep-red)]",
  critical: "text-red-800",
};

export type SubTab = "incidents" | "ppe" | "trainings" | "zones";
