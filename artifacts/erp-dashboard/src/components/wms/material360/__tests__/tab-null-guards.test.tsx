/**
 * @module tab-null-guards.test
 * @description Regression guard for Phase 3 (WMS dead-duplicate removal). The live
 * material360 tabs are passed data that Material360Card itself treats as nullable
 * (`stock?.`), yet the tabs dereference it. These tests assert each tab renders an
 * empty-state instead of crashing when its data section is null/undefined — i.e.
 * opening e.g. the "Ombor" tab for a material with no stock record must NOT crash.
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/i18n', () => ({
  useTranslation: () => ({ t: (key: string, fallback?: string) => fallback ?? key }),
}));

import { StockTab } from '../StockTab';
import { MovementsTab } from '../MovementsTab';
import { ProductionTab } from '../ProductionTab';
import { SuppliersTab } from '../SuppliersTab';
import { InventoryTab } from '../InventoryTab';

const basic = {} as never;

describe('material360 tab null-guards (no crash on missing data)', () => {
  it('StockTab renders empty-state when stock is null', () => {
    render(<StockTab stock={null as never} basic={basic} />);
    expect(screen.getByText('omborMalumotlariYoq')).toBeTruthy();
  });
  it('MovementsTab renders empty-state when movements is null', () => {
    render(<MovementsTab movements={null as never} basic={basic} />);
    expect(screen.getByText('harakatMalumotlariYoq')).toBeTruthy();
  });
  it('ProductionTab renders empty-state when productionUsage is null', () => {
    render(<ProductionTab productionUsage={null as never} basic={basic} />);
    expect(screen.getByText('ishlabChiqarishMalumotlariYoq')).toBeTruthy();
  });
  it('SuppliersTab renders empty-state when suppliers is null', () => {
    render(<SuppliersTab suppliers={null as never} basic={basic} />);
    expect(screen.getByText('yetkazibBeruvchiMalumotlariYoq')).toBeTruthy();
  });
  it('InventoryTab renders empty-state when inventory is null', () => {
    render(<InventoryTab inventory={null as never} basic={basic} />);
    expect(screen.getByText('inventarizatsiyaMalumotlariYoq')).toBeTruthy();
  });
});
