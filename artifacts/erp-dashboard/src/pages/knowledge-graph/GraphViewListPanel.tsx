/**
 * @module GraphViewListPanel
 * @description Tabular fallback view (Faza A's original list UI, preserved
 * per Q-46 — advancing to Canvas doesn't remove working functionality,
 * it's offered as a view-toggle alongside it).
 */

import { EPTable } from '@/components/ep';
import type { TableColumn } from '@/components/ep';
import type { KgNode, KgEdge } from './GraphViewTypes';
import { tLabel } from '@/lib/i18n/tLabel';

export function GraphViewListPanel({
  nodes, edges, nodesLoading, edgesLoading,
}: { nodes: KgNode[]; edges: KgEdge[]; nodesLoading: boolean; edgesLoading: boolean }) {
  const nodeColumns: TableColumn<KgNode>[] = [
    { key: 'entityType', label: tLabel('knowledgeGraph.colType', 'Turi'), width: '160px' },
    { key: 'entityId', label: tLabel('knowledgeGraph.colId', 'ID'), width: '100px' },
    { key: 'title', label: tLabel('knowledgeGraph.colTitle', 'Sarlavha'), sortable: true },
    {
      key: 'updatedAt', label: tLabel('knowledgeGraph.colUpdated', "O'zgartirilgan"), width: '170px', sortable: true,
      render: (_v, row) => new Date(row.updatedAt).toLocaleString('uz-UZ'),
    },
  ];

  const edgeColumns: TableColumn<KgEdge>[] = [
    { key: 'sourceType', label: tLabel('knowledgeGraph.colSource', 'Manba'), width: '220px', render: (_v, row) => `${row.sourceType}:${row.sourceId}` },
    { key: 'relationType', label: tLabel('knowledgeGraph.colRelation', 'Aloqa'), width: '140px' },
    { key: 'targetType', label: tLabel('knowledgeGraph.colTarget', 'Maqsad'), width: '220px', render: (_v, row) => `${row.targetType}:${row.targetId}` },
    {
      key: 'isBroken', label: tLabel('knowledgeGraph.colStatus', 'Holat'), width: '200px',
      render: (_v, row) => row.isBroken
        ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-red-50 text-red-700 border-red-200" title={row.brokenReason ?? ''}>{tLabel('knowledgeGraph.broken', 'Uzilgan')}</span>
        : <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200">{tLabel('knowledgeGraph.healthy', "Sog'lom")}</span>,
    },
  ];

  return (
    <div className="space-y-4">
      <EPTable<KgNode>
        title={tLabel('knowledgeGraph.nodesTitle', "Node'lar")}
        columns={nodeColumns}
        data={nodes}
        isLoading={nodesLoading}
        searchable
        searchPlaceholder={tLabel('knowledgeGraph.searchNodes', 'Node qidirish...')}
        emptyMessage={tLabel('knowledgeGraph.emptyNodes', "Hali node yo'q — real ERP hodisalari sodir bo'lganda avtomatik paydo bo'ladi")}
        zebra
      />
      <EPTable<KgEdge>
        title={tLabel('knowledgeGraph.edgesTitle', "Bog'lanishlar")}
        columns={edgeColumns}
        data={edges}
        isLoading={edgesLoading}
        searchable
        searchPlaceholder={tLabel('knowledgeGraph.searchEdges', "Bog'lanish qidirish...")}
        emptyMessage={tLabel('knowledgeGraph.emptyEdges', "Hali bog'lanish yo'q")}
        zebra
      />
    </div>
  );
}
