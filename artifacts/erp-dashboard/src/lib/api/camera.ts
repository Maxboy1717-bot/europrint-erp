/**
 * @module camera
 * @description Frontend utility / library module.
 */

import { apiRequest } from "@/lib/queryClient";

export const cameraApi = {
  analyzeByMissions: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/camera-alerts/analyze-by-missions", data),
  acknowledgeAlert: (id: number | string) =>
    apiRequest("POST", `/api/camera-alerts/${id}/acknowledge`),
  resolveAlert: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("POST", `/api/camera-alerts/${id}/resolve`, data),
  generateHeatmapExcel: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/camera-heatmap/generate-excel", data),
  generateHeatmapPdf: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/camera-heatmap/generate-pdf", data),
  flagRecognitionLog: (id: number | string) =>
    apiRequest("PATCH", `/api/camera/recognition-logs/${id}/flag`),
  unflagRecognitionLog: (id: number | string) =>
    apiRequest("PATCH", `/api/camera/recognition-logs/${id}/unflag`),
  updateCameraPrompt: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PUT", `/api/camera-ai/cameras/${id}/prompt`, data),
  updateCameraAlert: (data: Record<string, unknown>) =>
    apiRequest("PUT", "/api/camera-alerts", data),
};
