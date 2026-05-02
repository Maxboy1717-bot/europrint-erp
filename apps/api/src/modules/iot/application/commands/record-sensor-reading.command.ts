export class RecordSensorReadingCommand {
  constructor(readonly deviceId: string,
    readonly machineId: string,
    readonly value: number,
    readonly unit: string) {}
}
