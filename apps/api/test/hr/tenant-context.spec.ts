/**
 * @module tenant-context.spec
 * @description Phase 2 / Task 2.1 — verifies the tenant scope plumbing.
 *
 *   Covers:
 *     1. getTenantId() returns DEFAULT_TENANT_ID when no scope is active.
 *     2. tenantContext.run(...) makes the id visible to sync code inside.
 *     3. runWithTenant(...) preserves the id across async hops.
 *     4. Nested runs override the parent scope and restore on unwind.
 *     5. Concurrent runs do not bleed state between them.
 *     6. TenantContextInterceptor pulls tenantId from request.user.
 *     7. TenantContextInterceptor falls back to default when JWT claim is absent.
 *     8. TenantContextInterceptor exposes the scope to a downstream handler.
 */

import 'reflect-metadata';
import { lastValueFrom, of } from 'rxjs';
import {
  DEFAULT_TENANT_ID,
  getTenantId,
  runWithTenant,
  tenantContext,
} from '../../src/shared/db/tenant-context';
import { TenantContextInterceptor } from '../../src/shared/db/tenant-context.interceptor';

interface FakeReq { user?: { tenantId?: number | string; tenant_id?: number } }

function makeCtx(req: FakeReq): { switchToHttp: () => { getRequest: () => FakeReq } } {
  return { switchToHttp: () => ({ getRequest: () => req }) };
}

describe('tenant-context (Phase 2 / Task 2.1)', () => {
  describe('helpers', () => {
    it('returns DEFAULT_TENANT_ID outside any run() scope', () => {
      expect(getTenantId()).toBe(DEFAULT_TENANT_ID);
      expect(DEFAULT_TENANT_ID).toBe(1);
    });

    it('exposes the tenantId inside tenantContext.run(...)', () => {
      tenantContext.run({ tenantId: 42 }, () => {
        expect(getTenantId()).toBe(42);
      });
    });

    it('runWithTenant propagates id across async boundaries', async () => {
      const observed = await runWithTenant(7, async () => {
        // First microtask hop
        await Promise.resolve();
        const a = getTenantId();
        // Second hop via setTimeout(0) — exercises a different scheduler
        const b = await new Promise<number>((resolve) =>
          setTimeout(() => resolve(getTenantId()), 0),
        );
        return { a, b };
      });
      expect(observed).toEqual({ a: 7, b: 7 });
    });

    it('nested runs override and unwind cleanly', async () => {
      await runWithTenant(2, async () => {
        expect(getTenantId()).toBe(2);
        await runWithTenant(99, async () => {
          expect(getTenantId()).toBe(99);
        });
        // Restored to parent scope after nested run completes
        expect(getTenantId()).toBe(2);
      });
      expect(getTenantId()).toBe(DEFAULT_TENANT_ID);
    });

    it('concurrent runs do not bleed state', async () => {
      // Launch two scopes in parallel; each must see only its own id.
      const [a, b] = await Promise.all([
        runWithTenant(11, async () => {
          await new Promise((r) => setTimeout(r, 10));
          return getTenantId();
        }),
        runWithTenant(22, async () => {
          await new Promise((r) => setTimeout(r, 5));
          return getTenantId();
        }),
      ]);
      expect(a).toBe(11);
      expect(b).toBe(22);
    });
  });

  describe('TenantContextInterceptor', () => {
    const interceptor = new TenantContextInterceptor();

    it('uses request.user.tenantId when present (camelCase)', async () => {
      const req: FakeReq = { user: { tenantId: 5 } };
      let observed = -1;
      const next = {
        handle: () => {
          observed = getTenantId();
          return of('ok');
        },
      };
      // Need to typecast for the test — Nest internals require a richer ctx
      // surface than we expose to the interceptor, but only switchToHttp
      // is consulted in practice.
      await lastValueFrom(
        interceptor.intercept(makeCtx(req) as never, next as never),
      );
      expect(observed).toBe(5);
    });

    it('accepts snake_case tenant_id from legacy tokens', async () => {
      const req: FakeReq = { user: { tenant_id: 13 } };
      let observed = -1;
      const next = { handle: () => { observed = getTenantId(); return of('x'); } };
      await lastValueFrom(
        interceptor.intercept(makeCtx(req) as never, next as never),
      );
      expect(observed).toBe(13);
    });

    it('falls back to DEFAULT_TENANT_ID when JWT has no tenant claim', async () => {
      const req: FakeReq = { user: {} };
      let observed = -1;
      const next = { handle: () => { observed = getTenantId(); return of('x'); } };
      await lastValueFrom(
        interceptor.intercept(makeCtx(req) as never, next as never),
      );
      expect(observed).toBe(DEFAULT_TENANT_ID);
    });

    it('handles missing request.user (public endpoint) by using default', async () => {
      const req: FakeReq = {};
      let observed = -1;
      const next = { handle: () => { observed = getTenantId(); return of('x'); } };
      await lastValueFrom(
        interceptor.intercept(makeCtx(req) as never, next as never),
      );
      expect(observed).toBe(DEFAULT_TENANT_ID);
    });

    it('coerces stringified tenantId from JWT into a positive integer', async () => {
      const req: FakeReq = { user: { tenantId: '3' as unknown as number } };
      let observed = -1;
      const next = { handle: () => { observed = getTenantId(); return of('x'); } };
      await lastValueFrom(
        interceptor.intercept(makeCtx(req) as never, next as never),
      );
      expect(observed).toBe(3);
    });

    it('rejects non-positive tenantId values and uses default', async () => {
      const req: FakeReq = { user: { tenantId: 0 } };
      let observed = -1;
      const next = { handle: () => { observed = getTenantId(); return of('x'); } };
      await lastValueFrom(
        interceptor.intercept(makeCtx(req) as never, next as never),
      );
      expect(observed).toBe(DEFAULT_TENANT_ID);
    });
  });
});
