/**
 * @module create-warehouse.command
 * @description Source module. See exports for details.
 */

export class CreateWarehouseCommand {
  constructor(public readonly name: string,
    public readonly address: string,
    public readonly isFreeStorage?: boolean,
    public readonly freeStorageDays?: number,
    public readonly monthlyRate?: number | null) {}
}
