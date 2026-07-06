/**
 * @module FaceRecognitionMonitoringTypes
 * @description Types for FaceRecognitionMonitoring. Labels moved to i18n
 * "iot" namespace under the "FaceRec." key prefix.
 */

export interface RecognitionStats {
  total: number;
  successful: number;
  failed: number;
  falsePositives: number;
  falseNegatives: number;
  avgConfidence: number;
  accuracy: number;
  dailyStats: Array<{
    date: string;
    total: number;
    successful: number;
    failed: number;
    falsePositives: number;
    falseNegatives: number;
  }>;
}

export interface RecognitionLog {
  id: string;
  cameraId: string | null;
  zoneId: string | null;
  employeeId: string | null;
  isRecognized: boolean;
  confidence: number;
  faceImageUrl: string | null;
  timestamp: string;
  metadata: Record<string, unknown> | null;
  flaggedAs: string | null;
  flaggedBy: string | null;
  flaggedAt: string | null;
  employeeName: string | null;
  cameraName: string | null;
}
