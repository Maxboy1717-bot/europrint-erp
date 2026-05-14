/**
 * @module api
 * @description Source module. See exports for details.
 */

import { apiRequest } from "@/lib/queryClient";
import type { CameraAiRow, DashboardStatsBrief, CameraAlertBrief } from "./types";

export async function fetchCamerasFull(): Promise<CameraAiRow[]> {
  const data = await apiRequest("GET", "/api/cameras");
  return Array.isArray(data) ? data : [];
}

export async function fetchCameraDashboardStats(): Promise<DashboardStatsBrief> {
  return apiRequest("GET", "/api/camera-dashboard/stats");
}

export async function fetchPendingAlerts(limit = 12): Promise<CameraAlertBrief[]> {
  const data = await apiRequest("GET", `/api/camera-dashboard/pending-alerts?limit=${limit}`);
  return Array.isArray(data) ? data : [];
}

export interface PatchCameraAiPayload {
  aiCategories?: string[];
  aiPrompt?: string | null;
  aiSensitivity?: "low" | "medium" | "high";
  aiEnabled?: boolean;
  isActive?: boolean;
}

export async function patchCameraAi(id: string | number, body: PatchCameraAiPayload): Promise<CameraAiRow> {
  return apiRequest("PATCH", `/api/cameras/${id}`, body);
}

export interface AnalyzeByMissionsBody {
  cameraId: string | number;
  imageBase64: string;
  persist?: boolean;
  userId?: string;
  workCenterId?: string;
}

/** Kamera DB dagi topshiriqlar bo‘yicha tanlangan AI yo‘llar + ixtiyoriy persist */
export async function analyzeByMissions(body: AnalyzeByMissionsBody): Promise<Record<string, unknown>> {
  return apiRequest("POST", "/api/ai-camera/analyze-by-missions", body);
}
