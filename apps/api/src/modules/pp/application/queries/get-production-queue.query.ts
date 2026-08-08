/**
 * @module get-production-queue.query
 * @description Wave 6 (500K build): ranked production-queue query. Surfaces the REAL (previously
 *              caller-less) ProductionPriorityService.buildQueue over an HTTP path.
 */
export class GetProductionQueueQuery {
  constructor(public readonly filters: { onlyActive?: boolean } = {}) {}
}
