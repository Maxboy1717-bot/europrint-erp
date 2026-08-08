/**
 * @module get-defect-by-id.query
 * @description CQRS query: fetch a single qc_defects row by id.
 */

export class GetDefectByIdQuery {
  constructor(public readonly id: string) {}
}
