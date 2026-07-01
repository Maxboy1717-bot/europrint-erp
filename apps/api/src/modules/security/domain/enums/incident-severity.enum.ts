/**
 * @module incident-severity.enum
 * @description Source module. See exports for details.
 */

export enum IncidentSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum IncidentType {
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  DATA_BREACH = 'data_breach',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  SYSTEM_VULNERABILITY = 'system_vulnerability',
  INCIDENT_RESPONSE = 'incident_response',
  /**
   * FAZA Q — ombor AI-kamera nazorati: chiqish darvozasida yuz-tanish orqali
   * tasdiqlanmagan xodim tomonidan tovar chiqarilishi (noqonuniy olib chiqish
   * yoki ruxsatsiz kirish shubhasi). Avtomatik yaratiladi
   * (WarehouseExitGuardService.verifyExit → anomaly_detected=true).
   */
  UNAUTHORIZED_WAREHOUSE_EXIT = 'unauthorized_warehouse_exit',
}
