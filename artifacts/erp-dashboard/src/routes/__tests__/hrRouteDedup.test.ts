import { describe, it, expect } from 'vitest';
import { HR_ROUTES } from '../HRRoutes';
import { STUB_ROUTES } from '../StubRoutes';

/**
 * Phase 3 / T3.1: Sidebar duplicate cleanup tests.
 *
 * Verifies that:
 *   1. /hr/succession-planning is no longer a separate HR route
 *      (canonical: /hr/succession).
 *   2. /hr/leave is no longer a stub route
 *      (canonical: /hr/vacation-sick).
 *   3. The canonical paths still exist and map to components.
 */
describe('HR sidebar dedup (Phase 3 / T3.1)', () => {
  const hrPaths = HR_ROUTES.map(([p]) => p);
  const stubPaths = STUB_ROUTES.map(([p]) => p);

  it('removes /hr/succession-planning from HR_ROUTES', () => {
    expect(hrPaths).not.toContain('/hr/succession-planning');
  });

  it('keeps canonical /hr/succession in HR_ROUTES', () => {
    expect(hrPaths).toContain('/hr/succession');
  });

  it('removes /hr/leave from STUB_ROUTES (now redirected)', () => {
    expect(stubPaths).not.toContain('/hr/leave');
  });

  it('keeps canonical /hr/vacation-sick in HR_ROUTES', () => {
    expect(hrPaths).toContain('/hr/vacation-sick');
  });

  it('does not register /hr/leave anywhere in HR_ROUTES', () => {
    expect(hrPaths).not.toContain('/hr/leave');
  });
});
