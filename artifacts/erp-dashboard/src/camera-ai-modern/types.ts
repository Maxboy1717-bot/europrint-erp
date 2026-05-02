export interface CameraAiRow {
  id: number | string;
  code: string;
  name: string;
  nameRu?: string | null;
  location?: string | null;
  isActive: boolean;
  streamUrl?: string | null;
  streamType?: string | null;
  thumbnailUrl?: string | null;
  aiPrompt?: string | null;
  aiCategories?: unknown;
  aiSensitivity?: string | null;
  aiEnabled?: boolean;
}

export interface DashboardStatsBrief {
  date?: string;
  totalCameras?: number;
  activeCameras?: number;
  unresolvedAlerts?: number;
  safetyViolationsCount?: number;
  qualityDefectsCount?: number;
  avgProductivityScore?: number;
}

export interface CameraAlertBrief {
  id: number;
  title: string;
  severity: string;
  alertType?: string;
  isResolved?: boolean;
  createdAt?: string;
}
