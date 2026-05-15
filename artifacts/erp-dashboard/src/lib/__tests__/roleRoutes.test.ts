/**
 * @module roleRoutes.test
 * @description Vitest tests for the getDefaultRouteForRole helper.
 */

import { describe, it, expect } from 'vitest';
import { getDefaultRouteForRole } from '../roleRoutes';

describe('getDefaultRouteForRole', () => {
  it('returns "/" for admin', () => {
    expect(getDefaultRouteForRole('admin')).toBe('/');
  });

  it('returns "/" for super_admin', () => {
    expect(getDefaultRouteForRole('super_admin')).toBe('/');
  });

  it('returns "/" for director and manager', () => {
    expect(getDefaultRouteForRole('director')).toBe('/');
    expect(getDefaultRouteForRole('manager')).toBe('/');
  });

  it('routes HR roles to /hr', () => {
    expect(getDefaultRouteForRole('hr')).toBe('/hr');
    expect(getDefaultRouteForRole('hr_manager')).toBe('/hr');
    expect(getDefaultRouteForRole('employee')).toBe('/hr');
  });

  it('routes finance roles to /finance', () => {
    expect(getDefaultRouteForRole('finance')).toBe('/finance');
    expect(getDefaultRouteForRole('cfo')).toBe('/finance');
    expect(getDefaultRouteForRole('accountant')).toBe('/finance');
  });

  it('routes sales to /crm-workspace', () => {
    expect(getDefaultRouteForRole('sales')).toBe('/crm-workspace');
  });

  it('routes production roles to /planning', () => {
    expect(getDefaultRouteForRole('production')).toBe('/planning');
    expect(getDefaultRouteForRole('pp_manager')).toBe('/planning');
  });

  it('routes warehouse roles to /warehouse', () => {
    expect(getDefaultRouteForRole('warehouse')).toBe('/warehouse');
    expect(getDefaultRouteForRole('warehouse_manager')).toBe('/warehouse');
  });

  it('falls back to "/" for unknown roles', () => {
    expect(getDefaultRouteForRole('martian')).toBe('/');
    expect(getDefaultRouteForRole('')).toBe('/');
  });

  it('routes IT and LMS managers correctly', () => {
    expect(getDefaultRouteForRole('it')).toBe('/settings');
    expect(getDefaultRouteForRole('lms_manager')).toBe('/lms');
    expect(getDefaultRouteForRole('qc_manager')).toBe('/qc-module');
  });
});
