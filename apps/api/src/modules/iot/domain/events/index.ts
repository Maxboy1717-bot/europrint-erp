export class SensorReadingRecordedEvent {
  constructor(readonly deviceId: string,
    readonly value: number,
    readonly isAnomaly: boolean) {}
}

export class AnomalyDetectedEvent {
  constructor(
    readonly deviceId: string,
    readonly machineId: string,
    readonly anomalyType: string,
    readonly value: number,
  ) {}
}
