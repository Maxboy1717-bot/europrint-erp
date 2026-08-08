/**
 * @module GraphViewControls
 * @description Toolbar per owner TZ: Search/Filter, Layout Switch, Depth
 * Slider. Zoom in/out/fit-to-screen is React Flow's own built-in
 * `<Controls />` (rendered on the canvas itself, not duplicated here).
 */

import { Search, LayoutGrid, CircleDot } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { LayoutMode } from './GraphViewTypes';
import { ENTITY_COLOR_MAP } from './GraphViewTypes';
import { tLabel } from '@/lib/i18n/tLabel';

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  entityTypeFilter: string | null;
  onEntityTypeFilterChange: (v: string | null) => void;
  layout: LayoutMode;
  onLayoutChange: (v: LayoutMode) => void;
  depth: number;
  onDepthChange: (v: number) => void;
  focusActive: boolean;
}

export function GraphViewControls({
  search, onSearchChange, entityTypeFilter, onEntityTypeFilterChange,
  layout, onLayoutChange, depth, onDepthChange, focusActive,
}: Props) {
  const types = Object.keys(ENTITY_COLOR_MAP);

  return (
    <div className="flex flex-wrap items-center gap-2 p-2 bg-[var(--ep-surface)] border border-[var(--ep-border)] rounded-lg">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--ep-muted)]" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={tLabel('knowledgeGraph.searchNodes', 'Node qidirish...')}
          className="pl-8 h-8 text-sm w-48"
        />
      </div>

      <select
        value={entityTypeFilter ?? ''}
        onChange={(e) => onEntityTypeFilterChange(e.target.value || null)}
        className="h-8 text-sm rounded-md border border-[var(--ep-border)] bg-[var(--ep-surface)] px-2 text-[var(--ep-text)]"
      >
        <option value="">{tLabel('knowledgeGraph.allTypes', 'Barcha turlar')}</option>
        {types.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>

      <div className="flex items-center gap-1 border-l border-[var(--ep-border)] pl-2">
        <Button size="icon" variant={layout === 'grid' ? 'default' : 'outline'} className="h-8 w-8" onClick={() => onLayoutChange('grid')} title={tLabel('knowledgeGraph.layoutGrid', 'Panjara joylashuv')}>
          <LayoutGrid className="w-4 h-4" />
        </Button>
        <Button size="icon" variant={layout === 'circular' ? 'default' : 'outline'} className="h-8 w-8" onClick={() => onLayoutChange('circular')} title={tLabel('knowledgeGraph.layoutCircular', 'Aylana joylashuv')}>
          <CircleDot className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex items-center gap-2 border-l border-[var(--ep-border)] pl-2">
        <label className={`text-[12px] whitespace-nowrap ${focusActive ? 'text-[var(--ep-text)]' : 'text-[var(--ep-subtle)]'}`}>
          {tLabel('knowledgeGraph.depth', "Chuqurlik")}: {focusActive ? depth : tLabel('knowledgeGraph.depthAll', 'hammasi')}
        </label>
        <input
          type="range" min={1} max={5} value={depth}
          onChange={(e) => onDepthChange(Number(e.target.value))}
          disabled={!focusActive}
          className="w-24"
        />
      </div>
      {!focusActive && (
        <span className="text-[11px] text-[var(--ep-muted)]">
          {tLabel('knowledgeGraph.focusHint', "Node bosing — chuqurlik filtri shu node atrofida ishlaydi")}
        </span>
      )}
    </div>
  );
}
