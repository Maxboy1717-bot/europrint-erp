/**
 * @module notification-type.enum
 * @description Source module. See exports for details.
 */

export enum NotificationType {
  QC_RESULT = 'qc_result',
  ORDER_STATUS = 'order_status',
  STOCK_ALERT = 'stock_alert',
  CERT_EXPIRY = 'cert_expiry',
  ADVANCE_REMINDER = 'advance_reminder',
  IOT_ANOMALY = 'iot_anomaly',
  DELIVERY_STATUS = 'delivery_status',
}

export enum NotificationStatus {
  SENT = 'sent',
  READ = 'read',
  FAILED = 'failed',
}
