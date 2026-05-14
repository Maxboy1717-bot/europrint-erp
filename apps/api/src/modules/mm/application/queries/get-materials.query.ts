/**
 * @module get-materials.query
 * @description Source module. See exports for details.
 */

export class GetMaterialsQuery {
  constructor(public readonly category?: string,
    public readonly isActive?: boolean,
    public readonly lowStock?: boolean,
    public readonly page: number = 1,
    public readonly limit: number = 20) {}
}
