/**
 * @module get-reclamation-by-id.query
 * @description CQRS query: fetch a single qc_reclamations row by id.
 */

export class GetReclamationByIdQuery {
  constructor(public readonly id: number) {}
}
