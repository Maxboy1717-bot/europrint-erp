/**
 * @module record-sensor-reading.command
 * @description Source module. See exports for details.
 */

export class RecordSensorReadingCommand {
  constructor(readonly deviceId: string,
    readonly machineId: string,
    readonly value: number,
    readonly unit: string) {}
}
