/**
 * @module submit-inspection.command
 * @description Source module. See exports for details.
 */

/**
 * QC inspector's verdict. The third option `rework` (Qayta ishlash) sends the
 * batch back to production instead of accepting (pass) or scrapping (fail).
 */
export type QcDecision = 'pass' | 'fail' | 'rework';

export class SubmitInspectionCommand {
  constructor(readonly inspectionId: string,
    readonly orderId: number,
    readonly passed: boolean,
    readonly reason: string,
    readonly supplierId?: number,
    /**
     * Explicit 3-way decision. When omitted, falls back to `passed`
     * (true → 'pass', false → 'fail') so existing callers keep working.
     */
    readonly decision?: QcDecision) {}
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
