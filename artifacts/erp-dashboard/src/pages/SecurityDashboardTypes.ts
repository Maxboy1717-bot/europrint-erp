/**
 * @module SecurityDashboardTypes
 * @description Shared TypeScript interfaces, form-state defaults, and display
 * constants for the Security Dashboard feature. No JSX — safe to import from
 * both .ts and .tsx files.
 */

// ---------------------------------------------------------------------------
// Domain interfaces
// ---------------------------------------------------------------------------

export interface AttendanceRecord {
  id: string;
  employeeName: string;
  type: string;
  timestamp: string;
  method: string;
  location: string;
  isAnomaly: boolean;
}

export interface DailySummary {
  activeOnSite: number;
  totalEntries: number;
  totalExits: number;
  anomalyCount: number;
}

export interface Visitor {
  id: string;
  fullName: string;
  company: string;
  purpose: string;
  hostEmployeeName: string;
  enteredAt: string;
  exitedAt: string | null;
  badgeNumber: string;
  status: string;
}

export interface SecurityIncident {
  id: string;
  type: string;
  description: string;
  severity: string;
  location: string;
  reportedBy: string;
  status: string;
  createdAt: string;
}

export interface PPECheck {
  id: string;
  employeeName: string;
  department: string;
  helmetOk: boolean;
  vestOk: boolean;
  glovesOk: boolean;
  bootsOk: boolean;
  createdAt: string;
  notes: string | null;
}

export type FireSensor = {
  id: string;
  type: string;
  location: string;
  status: string;
  lastCheck: string;
};

export type AccessZone = {
  id: string;
  name: string;
  accessLevel: string;
  activeCount: number;
  maxCapacity: number;
};

// ---------------------------------------------------------------------------
// Form-state shapes & defaults
// ---------------------------------------------------------------------------

export interface VisitorForm {
  fullName: string;
  company: string;
  purpose: string;
  hostEmployeeName: string;
  badgeNumber: string;
}

export interface IncidentForm {
  type: string;
  description: string;
  severity: string;
  location: string;
  reportedBy: string;
}

export interface PPEForm {
  employeeName: string;
  department: string;
  helmetOk: boolean;
  vestOk: boolean;
  glovesOk: boolean;
  bootsOk: boolean;
  notes: string;
}

export const DEFAULT_VISITOR_FORM: VisitorForm = {
  fullName: "",
  company: "",
  purpose: "",
  hostEmployeeName: "",
  badgeNumber: "",
};

export const DEFAULT_INCIDENT_FORM: IncidentForm = {
  type: "unauthorized_access",
  description: "",
  severity: "medium",
  location: "",
  reportedBy: "",
};

export const DEFAULT_PPE_FORM: PPEForm = {
  employeeName: "",
  department: "",
  helmetOk: true,
  vestOk: true,
  glovesOk: true,
  bootsOk: true,
  notes: "",
};

// ---------------------------------------------------------------------------
// Display constants
// ---------------------------------------------------------------------------

export const INCIDENT_TYPE_LABEL: Record<string, string> = {
  unauthorized_access: "Ruxsatsiz kirish",
  ppe_violation: "PPE buzilishi",
  fire_alarm: "Yong'in signali",
  gas_leak: "Gaz sizishi",
  accident: "Baxtsiz hodisa",
  theft: "O'g'irlik",
  other: "Boshqa",
};

export const SEVERITY_VARIANT: Record<
  string,
  "destructive" | "default" | "secondary" | "outline"
> = {
  high: "destructive",
  medium: "default",
  low: "secondary",
};

export const EVACUATION_STEPS: string[] = [
  "1. Barcha ishlarni to'xtatib, mashinalar quvvatini o'chirilsin",
  "2. Xodimlar evakuatsiya yo'llaridan chiqib ketishi kerak",
  "3. Har bo'lim mas'uli xodimlar sonini tekshiradi",
  "4. Yig'ilish nuqtasi: Zavod oldidagi park maydoni",
  "5. Xavfsizlik xizmati va qo'riqchi kirish/chiqish nazorat qiladi",
  "6. Tashrifchilar darhol chiqarilsin va nishonlari qaytarilsin",
];
