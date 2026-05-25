/**
 * @module i-order-header
 * @description Cross-context marker for "an order" — sales / production / design /
 * purchase / workflow. Each bounded context owns its own aggregate with full
 * semantics (state machine, invariants, events); this interface only specifies
 * the minimal shape that downstream / reporting / audit code can rely on.
 *
 * If you need richer semantics, depend on the context-specific aggregate
 * (e.g. `SalesOrder.transitionStatus(...)`), NOT on this interface.
 *
 * @see docs/context-map.md — bounded-context overview
 */

/** Order kind discriminator — which bounded context owns this order. */
export type OrderKind = 'sales' | 'production' | 'design' | 'purchase' | 'workflow';

export interface IOrderHeader {
  readonly id: string | number;
  readonly orderNumber: string;
  readonly status: string;
  readonly kind: OrderKind;
  readonly createdAt: Date;
  readonly updatedAt?: Date | null;
  readonly createdBy?: string | number | null;
}
