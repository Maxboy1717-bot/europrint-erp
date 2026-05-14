/**
 * @module sensor-status.enum
 * @description Source module. See exports for details.
 */

export enum SensorStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  FAULT = 'fault',
  MAINTENANCE = 'maintenance',
}

export enum SensorType {
  TEMPERATURE = 'temperature',
  HUMIDITY = 'humidity',
  PRESSURE = 'pressure',
  VIBRATION = 'vibration',
  ENERGY = 'energy',
}
