/**
 * @module index
 * @description Barrel re-export file. Surfaces the public API of this folder.
 */

export class QcPassedEvent {
  constructor(readonly inspectionId: string,
    readonly orderId: number) {}
}

export class QcFailedEvent {
  constructor(
    readonly inspectionId: string,
    readonly orderId: number,
    readonly reason: string,
  ) {}
}

export class SupplierQualityFailEvent {
  constructor(
    readonly supplierId: number,
    readonly orderId: number,
    readonly reason: string,
  ) {}
}
