/**
 * test/cc-baskets-pagination.controller.spec.ts
 *
 * CC #19 — the 3-basket list endpoints (inbox/pending/outbox) now paginate
 * (page 1-based + limit, default 50, max 100 → offset) instead of a hardcoded
 * LIMIT 200. These tests prove the controller's clamp + offset math and that it
 * threads the values to the service.
 */

import { CcBasketsController } from '../src/modules/communication-center/presentation/cc-baskets.controller';

function build() {
  const svc = { listBasket: jest.fn().mockResolvedValue([]) };
  const ctrl = new CcBasketsController(svc as never, {} as never, {} as never);
  return { ctrl, svc };
}

const USER = { id: 5 };

describe('CcBasketsController pagination (CC #19)', () => {
  it('defaults to limit 50, offset 0 when no query params', async () => {
    const { ctrl, svc } = build();
    await ctrl.inbox(USER);
    expect(svc.listBasket).toHaveBeenCalledWith(5, 'inbox', 50, 0);
  });

  it('computes offset from a 1-based page', async () => {
    const { ctrl, svc } = build();
    await ctrl.inbox(USER, '3', '25');
    expect(svc.listBasket).toHaveBeenCalledWith(5, 'inbox', 25, 50); // (3-1)*25
  });

  it('clamps limit to a max of 100', async () => {
    const { ctrl, svc } = build();
    await ctrl.pending(USER, '1', '500');
    expect(svc.listBasket).toHaveBeenCalledWith(5, 'pending', 100, 0);
  });

  it('clamps a bad page/limit to safe defaults (page<1 -> 1, limit<1 -> 1)', async () => {
    const { ctrl, svc } = build();
    await ctrl.outbox(USER, '0', '-3');
    expect(svc.listBasket).toHaveBeenCalledWith(5, 'outbox', 1, 0);
  });

  it('falls back to defaults on non-numeric params', async () => {
    const { ctrl, svc } = build();
    await ctrl.inbox(USER, 'abc', 'xyz');
    expect(svc.listBasket).toHaveBeenCalledWith(5, 'inbox', 50, 0);
  });
});
