/**
 * @module CameraLiveMonitoringTypes
 * @description Types and interfaces for CameraLiveMonitoring.
 */

export interface Detection {
  id: string;
  cameraId: string;
  userId: string | null;
  detectionDate: string;
  detectionTime: string;
  zoneName: string | null;
  confidence: number | null;
  createdAt: string;
}

export interface Employee {
  id: string;
  employeeId: string;
  fullName: string;
}

export interface Camera {
  id: string;
  code: string;
  name: string;
  location: string | null;
  streamUrl?: string | null;
  streamType?: string | null;
  thumbnailUrl?: string | null;
  isActive?: boolean;
}

export interface LiveDetection {
  detection: Detection;
  camera: Camera;
  employee: Employee | null;
}

export interface CameraWithDetections {
  camera: {
    id: string;
    code: string;
    name: string;
    nameRu?: string | null;
    location?: string | null;
    isActive: boolean;
  };
  detections: Array<{
    detection: Detection;
    employee: Employee | null;
  }>;
  lastDetectionTime: string | null;
}

export function getConfidenceColor(confidence: number | null): "default" | "secondary" | "destructive" {
  if (!confidence) return "secondary";
  if (confidence >= 0.9) return "default";
  if (confidence >= 0.75) return "secondary";
  return "destructive";
}

export function getTimeSinceDetection(timestamp: string): string {
  const now = new Date();
  const detected = new Date(timestamp);
  const diffMs = now.getTime() - detected.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Hozir";
  if (diffMins < 60) return `${diffMins} daqiqa oldin`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)} soat oldin`;
  return `${Math.floor(diffMins / 1440)} kun oldin`;
}
