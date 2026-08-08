/**
 * @module GraphViewDetailDrawer
 * @description Slide-in panel shown when a Canvas node is clicked — node
 * detail + its edges (owner TZ: "klik → yon panel Quick Preview"). Plain EP
 * tokens (Qoida 21), not the Aisha bespoke exception.
 */

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { colorForType } from './GraphViewTypes';
import type { KgNode, KgEdge } from './GraphViewTypes';
import { tLabel } from '@/lib/i18n/tLabel';

export function GraphViewDetailDrawer({
  node, edges, onClose,
}: { node: KgNode; edges: KgEdge[]; onClose: () => void }) {
  return (
    <aside
      className="fixed top-0 right-0 h-full w-80 max-w-[90vw] bg-[var(--ep-surface)] border-l border-[var(--ep-border)] shadow-xl z-40 overflow-y-auto"
      data-testid="kg-detail-drawer"
    >
      <div className="flex items-center justify-between p-4 border-b border-[var(--ep-border)]">
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold text-white"
          style={{ backgroundColor: colorForType(node.entityType) }}
        >
          {node.entityType}
        </span>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label={tLabel('common.close', 'Yopish')}>
          <X className="w-4 h-4" />
        </Button>
      </div>
      <div className="p-4 space-y-3">
        <div>
          <h3 className="text-[15px] font-semibold text-[var(--ep-text)]">{node.title}</h3>
          <p className="text-[12px] text-[var(--ep-muted)] mt-0.5">ID: {node.entityId}</p>
          {node.summary && <p className="text-[13px] text-[var(--ep-text)] mt-2">{node.summary}</p>}
        </div>
        <div className="pt-2 border-t border-[var(--ep-border)]">
          <p className="text-[11px] uppercase tracking-wide text-[var(--ep-subtle)] font-semibold mb-2">
            {tLabel('knowledgeGraph.connections', "Bog'lanishlar")} ({edges.length})
          </p>
          {edges.length === 0 && (
            <p className="text-[12px] text-[var(--ep-muted)]">{tLabel('knowledgeGraph.noConnections', "Bog'lanish yo'q")}</p>
          )}
          <ul className="space-y-1.5">
            {edges.map((e) => {
              const isSource = e.sourceType === node.entityType && e.sourceId === node.entityId;
              const other = isSource ? `${e.targetType}:${e.targetId}` : `${e.sourceType}:${e.sourceId}`;
              return (
                <li
                  key={e.id}
                  className={`text-[12px] rounded-md border p-2 ${e.isBroken ? 'border-red-300 bg-red-50 text-red-700' : 'border-[var(--ep-border)] bg-[var(--ep-bg)] text-[var(--ep-text)]'}`}
                  title={e.brokenReason ?? undefined}
                >
                  <span className="font-medium">{isSource ? '→' : '←'} {e.relationType}</span>
                  <div className="text-[var(--ep-muted)]">{other}</div>
                  {e.isBroken && <div className="text-red-600 mt-0.5">{e.brokenReason}</div>}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </aside>
  );
}
