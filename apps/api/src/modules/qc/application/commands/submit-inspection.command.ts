/**
 * @module submit-inspection.command
 * @description Source module. See exports for details.
 */

export class SubmitInspectionCommand {
  constructor(readonly inspectionId: string,
    readonly orderId: number,
    readonly passed: boolean,
    readonly reason: string,
    readonly supplierId?: number) {}
}

export class CreateInspectionCommand {
  constructor(
    readonly orderId: number,
    readonly batchId: string,
    readonly inspectorId: number,
    readonly sampleSize: number,
  ) {}
}

export class AddDefectCommand {
  constructor(
    readonly inspectionId: string,
    readonly type: string,
    readonly description: string,
    readonly location: string,
    readonly severity: number,
  ) {}
}
