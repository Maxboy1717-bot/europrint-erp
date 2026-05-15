/**
 * @module CameraRoutes
 * @description Frontend route definition.
 */

import { lazy } from "react";

const CameraDashboard = lazy(() => import("@/pages/camera-dashboard"));
const CamerasManagement = lazy(() => import("@/pages/cameras-management"));
const CameraSafety = lazy(() => import("@/pages/camera-safety"));
const CameraQuality = lazy(() => import("@/pages/camera-quality"));
const CameraEmployeesAI = lazy(() => import("@/pages/camera-employees"));
const CameraMachines = lazy(() => import("@/pages/camera-machines"));
const CameraAlertsPage = lazy(() => import("@/pages/camera-alerts"));
const CameraReportsPage = lazy(() => import("@/pages/camera-reports"));
const CameraSettingsPage = lazy(() => import("@/pages/camera-settings"));
const CameraHeatmapPage = lazy(() => import("@/pages/camera-heatmap"));
const CameraEmployeeRatingsPage = lazy(() => import("@/pages/camera-employee-ratings"));
const CameraLiveMonitoring = lazy(() => import("@/pages/CameraLiveMonitoring"));
const FaceRecognitionMonitoring = lazy(() => import("@/pages/FaceRecognitionMonitoring"));
const FaceRegistration = lazy(() => import("@/pages/FaceRegistration"));
const AttendanceMonitorPage = lazy(() => import("@/pages/AttendanceMonitorPage"));
const CameraAIModernHub = lazy(() => import("@/camera-ai-modern/pages/CameraAIModernHub"));const SecurityDashboard = lazy(() => import("@/pages/SecurityDashboard"));
const SecurityExtended = lazy(() => import("@/pages/SecurityExtended"));

export const CAMERA_ROUTES: [string, React.ComponentType][] = [
  ['/camera-dashboard',              CameraDashboard],
  ['/cameras',                       CamerasManagement],
  ['/camera-safety',                 CameraSafety],
  ['/camera-quality',                CameraQuality],
  ['/camera-employees',              CameraEmployeesAI],
  ['/camera-machines',               CameraMachines],
  ['/camera-alerts',                 CameraAlertsPage],
  ['/camera-reports',                CameraReportsPage],
  ['/camera-settings',               CameraSettingsPage],
  ['/camera-heatmap',                CameraHeatmapPage],
  ['/camera-employee-ratings',       CameraEmployeeRatingsPage],
  ['/camera-live-monitoring',        CameraLiveMonitoring],
  ['/camera/monitoring',             FaceRecognitionMonitoring],
  ['/face-registration',             FaceRegistration],
  ['/attendance-monitor',            AttendanceMonitorPage],

  ['/camera-ai',                     CameraAIModernHub],
  ['/security',                      SecurityDashboard],
  ['/security/attendance',           SecurityExtended],
  ['/security/zone-access',          SecurityExtended],
  ['/security/ppe',                  SecurityExtended],
  ['/security/hazmat',               SecurityExtended],
  ['/security/evacuation',           SecurityExtended],
  ['/security/visitors',             SecurityExtended],
  ['/security/rating',               SecurityExtended],
];
