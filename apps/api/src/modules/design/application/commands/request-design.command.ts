/**
 * @module request-design.command
 * @description Source module. See exports for details.
 */

export class RequestDesignCommand {
  constructor(readonly salesOrderId: number,
    readonly productId: number,
    readonly description: string,
    readonly customerId: number) {}
}

export class ApproveDesignCommand {
  constructor(readonly designOrderId: string) {}
}

export class RejectDesignCommand {
  constructor(
    readonly designOrderId: string,
    readonly reason: string,
  ) {}
}
