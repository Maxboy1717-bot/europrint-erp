export class RegisterDeviceCommand {
  constructor(readonly deviceCode: string,
    readonly name: string,
    readonly location: string,
    readonly type: string,
    readonly thresholds: {
      min?: number;
      max?: number;
      unit: string;
    }) {}
}
