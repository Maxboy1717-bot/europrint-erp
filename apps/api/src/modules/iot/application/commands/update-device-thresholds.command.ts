export class UpdateDeviceThresholdsCommand {
  constructor(readonly deviceId: string,
    readonly thresholds: {
      min?: number;
      max?: number;
      unit: string;
    }) {}
}
