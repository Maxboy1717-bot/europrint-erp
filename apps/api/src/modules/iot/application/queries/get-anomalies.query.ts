/**
 * @module get-anomalies.query
 * @description Source module. See exports for details.
 */

export class GetAnomaliesQuery {
  constructor(readonly page: number = 1,
    readonly limit: number = 20) {}
}
