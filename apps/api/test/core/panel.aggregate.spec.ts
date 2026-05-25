/**
 * test/core/panel.aggregate.spec.ts
 * Unit tests for Panel aggregate — user dashboard layout aggregate.
 */
import { Panel, PanelLayout } from '../../src/modules/core/domain/aggregates/panel.aggregate';
import { userFactory } from '../_fixtures/factories';

function makeLayout(overrides: Partial<PanelLayout> = {}): PanelLayout {
  return {
    widgetId: 'w-1',
    widgetType: 'kpi',
    position: { x: 0, y: 0, w: 4, h: 2 },
    config: { metric: 'revenue' },
    ...overrides,
  };
}

function makePanel(overrides: Partial<{
  id: string;
  userId: string;
  name: string;
  layout: PanelLayout[];
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}> = {}): Panel {
  const u = userFactory();
  return new Panel(
    overrides.id ?? 'panel-1',
    overrides.userId ?? String(u.id),
    overrides.name ?? 'Bosh sahifa',
    overrides.layout ?? [makeLayout()],
    overrides.isDefault ?? false,
    overrides.createdAt ?? new Date('2026-01-01'),
    overrides.updatedAt ?? new Date('2026-01-01'),
  );
}

describe('Panel aggregate', () => {
  describe('constructor()', () => {
    it('assigns id, userId, and name as provided', () => {
      const p = makePanel({ id: 'pn-7', userId: 'u-9', name: 'My Dashboard' });
      expect(p.id).toBe('pn-7');
      expect(p.userId).toBe('u-9');
      expect(p.name).toBe('My Dashboard');
    });

    it('stores layout array with at least one widget', () => {
      const p = makePanel({ layout: [makeLayout({ widgetId: 'a' }), makeLayout({ widgetId: 'b' })] });
      expect(p.layout).toHaveLength(2);
      expect(p.layout[0].widgetId).toBe('a');
      expect(p.layout[1].widgetId).toBe('b');
    });

    it('accepts empty layout array', () => {
      const p = makePanel({ layout: [] });
      expect(p.layout).toEqual([]);
    });

    it('preserves widget position coordinates', () => {
      const w = makeLayout({ position: { x: 3, y: 4, w: 6, h: 2 } });
      const p = makePanel({ layout: [w] });
      expect(p.layout[0].position).toEqual({ x: 3, y: 4, w: 6, h: 2 });
    });

    it('preserves widget config dictionary', () => {
      const w = makeLayout({ config: { metric: 'oee', threshold: 85 } });
      const p = makePanel({ layout: [w] });
      expect(p.layout[0].config).toEqual({ metric: 'oee', threshold: 85 });
    });
  });

  describe('widgetType enumeration', () => {
    it('accepts type "chart" for chart widget', () => {
      const p = makePanel({ layout: [makeLayout({ widgetType: 'chart' })] });
      expect(p.layout[0].widgetType).toBe('chart');
    });

    it('accepts type "table" for table widget', () => {
      const p = makePanel({ layout: [makeLayout({ widgetType: 'table' })] });
      expect(p.layout[0].widgetType).toBe('table');
    });

    it('accepts type "calendar" for calendar widget', () => {
      const p = makePanel({ layout: [makeLayout({ widgetType: 'calendar' })] });
      expect(p.layout[0].widgetType).toBe('calendar');
    });

    it('accepts type "map" for map widget', () => {
      const p = makePanel({ layout: [makeLayout({ widgetType: 'map' })] });
      expect(p.layout[0].widgetType).toBe('map');
    });
  });

  describe('isDefault flag', () => {
    it('exposes isDefault=true when user marked panel as default', () => {
      const p = makePanel({ isDefault: true });
      expect(p.isDefault).toBe(true);
    });

    it('exposes isDefault=false for additional non-default panels', () => {
      const p = makePanel({ isDefault: false });
      expect(p.isDefault).toBe(false);
    });
  });

  describe('mutable updatedAt', () => {
    it('allows reassignment to a newer timestamp', () => {
      const p = makePanel({ updatedAt: new Date('2026-01-01') });
      const next = new Date('2026-07-01');
      p.updatedAt = next;
      expect(p.updatedAt.getTime()).toBe(next.getTime());
    });

    it('keeps layout array reference stable after updatedAt mutation', () => {
      const layout = [makeLayout()];
      const p = makePanel({ layout });
      p.updatedAt = new Date('2026-02-01');
      expect(p.layout).toBe(layout);
    });
  });

  describe('multi-widget composition', () => {
    it('supports a 3-widget panel with mixed types', () => {
      const layout: PanelLayout[] = [
        makeLayout({ widgetId: 'kpi-1', widgetType: 'kpi' }),
        makeLayout({ widgetId: 'chart-1', widgetType: 'chart' }),
        makeLayout({ widgetId: 'table-1', widgetType: 'table' }),
      ];
      const p = makePanel({ layout });
      expect(p.layout.map(w => w.widgetType)).toEqual(['kpi', 'chart', 'table']);
    });

    it('keeps separate config per widget without leakage', () => {
      const layout: PanelLayout[] = [
        makeLayout({ widgetId: 'a', config: { unit: 'UZS' } }),
        makeLayout({ widgetId: 'b', config: { unit: 'USD' } }),
      ];
      const p = makePanel({ layout });
      expect(p.layout[0].config).toEqual({ unit: 'UZS' });
      expect(p.layout[1].config).toEqual({ unit: 'USD' });
    });
  });
});
