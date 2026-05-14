/**
 * @module get-devices.query
 * @description Source module. See exports for details.
 */

export class GetDevicesQuery {
  constructor(readonly status?: string,
    readonly type?: string,
    readonly page: number = 1,
    readonly limit: number = 20) {}
}
