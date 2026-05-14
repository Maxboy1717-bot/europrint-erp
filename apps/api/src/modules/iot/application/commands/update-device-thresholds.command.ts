/**
 * @module update-device-thresholds.command
 * @description Source module. See exports for details.
 */

export class UpdateDeviceThresholdsCommand {
  constructor(readonly deviceId: string,
    readonly thresholds: {
      min?: number;
      max?: number;
      unit: string;
    }) {}
}
