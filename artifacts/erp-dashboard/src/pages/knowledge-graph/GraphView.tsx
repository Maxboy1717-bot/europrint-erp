/**
 * @module GraphView
 * @description AI Bilim Grafigi — Faza B: interactive Canvas (React Flow) +
 * table-view toggle (Faza A's original list, preserved per Q-46). Manual
 * link creation dialog (Q-19 CRUD). `/api/knowledge-graph/*` — row-level
 * RBAC computed server-side; FE renders exactly what the backend returns.
 */

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Link2, LayoutList, Waypoints } from 'lucide-react';
import { EPPageHeader } from '@/components/ep/EPPageHeader';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { tLabel } from '@/lib/i18n/tLabel';
import type { KgNode, KgEdge, GraphView as ViewMode, LayoutMode } from './GraphViewTypes';
import { nodeKey } from './GraphViewTypes';
import { bfsDepth } from './GraphViewLayout';
import { GraphViewCanvas } from './GraphViewCanvas';
import { GraphViewControls } from './GraphViewControls';
import { GraphViewDetailDrawer } from './GraphViewDetailDrawer';
import { GraphViewListPanel } from './GraphViewListPanel';

function CreateLinkDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState({ sourceType: '', sourceId: '', targetType: '', targetId: '', relationType: '' });

  const create = useMutation({
    mutationFn: () => apiRequest('POST', '/api/knowledge-graph/links', form),
    onSuccess: () => {
      toast({ title: tLabel('knowledgeGraph.linkCreated', "Bog'lanish yaratildi") });
      qc.invalidateQueries({ queryKey: ['/api/knowledge-graph/edges'] });
      setForm({ sourceType: '', sourceId: '', targetType: '', targetId: '', relationType: '' });
      onClose();
    },
    onError: () => toast({ title: tLabel('common.error', 'Xatolik'), variant: 'destructive' }),
  });

  const isValid = Object.values(form).every((v) => v.trim().length > 0);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle>{tLabel('knowledgeGraph.newLink', "Yangi bog'lanish")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Input placeholder={tLabel('knowledgeGraph.sourceType', 'Manba turi (masalan sales_order)')} value={form.sourceType} onChange={(e) => setForm({ ...form, sourceType: e.target.value })} className="h-9 text-sm" />
          <Input placeholder={tLabel('knowledgeGraph.sourceId', 'Manba ID')} value={form.sourceId} onChange={(e) => setForm({ ...form, sourceId: e.target.value })} className="h-9 text-sm" />
          <Input placeholder={tLabel('knowledgeGraph.targetType', 'Maqsad turi (masalan document)')} value={form.targetType} onChange={(e) => setForm({ ...form, targetType: e.target.value })} className="h-9 text-sm" />
          <Input placeholder={tLabel('knowledgeGraph.targetId', 'Maqsad ID')} value={form.targetId} onChange={(e) => setForm({ ...form, targetId: e.target.value })} className="h-9 text-sm" />
          <Input placeholder={tLabel('knowledgeGraph.relationType', 'Aloqa turi (masalan related_to)')} value={form.relationType} onChange={(e) => setForm({ ...form, relationType: e.target.value })} className="h-9 text-sm" />
          <div className="flex gap-2 pt-1">
            <Button variant="outline" onClick={onClose} className="flex-1">{tLabel('common.cancel', 'Bekor')}</Button>
            <Button onClick={() => create.mutate()} disabled={!isValid || create.isPending} className="flex-1 gap-1.5">
              {create.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
              {tLabel('common.create', 'Yaratish')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function GraphView() {
  const [showCreate, setShowCreate] = useState(false);
  const [view, setView] = useState<ViewMode>('canvas');
  const [search, setSearch] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState<string | null>(null);
  const [layout, setLayout] = useState<LayoutMode>('grid');
  const [depth, setDepth] = useState(2);
  const [focusKey, setFocusKey] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<KgNode | null>(null);

  const nodesQ = useQuery<{ data: KgNode[] }>({
    queryKey: ['/api/knowledge-graph/nodes'],
    queryFn: () => apiRequest<{ data: KgNode[] }>('GET', '/api/knowledge-graph/nodes?limit=100'),
  });
  const edgesQ = useQuery<{ data: KgEdge[] }>({
    queryKey: ['/api/knowledge-graph/edges'],
    queryFn: () => apiRequest<{ data: KgEdge[] }>('GET', '/api/knowledge-graph/edges?limit=100'),
  });

  const allNodes = Array.isArray(nodesQ.data?.data) ? nodesQ.data.data : [];
  const allEdges = Array.isArray(edgesQ.data?.data) ? edgesQ.data.data : [];

  const filteredNodes = useMemo(() => allNodes.filter((n) => {
    if (entityTypeFilter && n.entityType !== entityTypeFilter) return false;
    if (search && !n.title.toLowerCase().includes(search.toLowerCase()) && !n.entityId.includes(search)) return false;
    return true;
  }), [allNodes, entityTypeFilter, search]);

  const visibleKeys = useMemo(() => {
    if (!focusKey) return null;
    const dist = bfsDepth(focusKey, allEdges, depth);
    return new Set(dist.keys());
  }, [focusKey, allEdges, depth]);

  const selectedNodeEdges = useMemo(() => {
    if (!selectedNode) return [];
    return allEdges.filter((e) =>
      (e.sourceType === selectedNode.entityType && e.sourceId === selectedNode.entityId) ||
      (e.targetType === selectedNode.entityType && e.targetId === selectedNode.entityId));
  }, [selectedNode, allEdges]);

  function handleNodeClick(node: KgNode) {
    setSelectedNode(node);
    setFocusKey(nodeKey(node.entityType, node.entityId));
  }

  return (
    <div className="p-4 space-y-4">
      <EPPageHeader
        title={tLabel('knowledgeGraph.title', 'Bilim Grafigi')}
        subtitle={tLabel('knowledgeGraph.subtitle', "ERP entity'lari orasidagi bog'lanishlar — AI agentlar shu grafni qidiradi")}
        actions={(
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-md border border-[var(--ep-border)] overflow-hidden">
              <button
                onClick={() => setView('canvas')}
                className={`px-2.5 py-1.5 text-[12px] flex items-center gap-1 ${view === 'canvas' ? 'bg-[var(--ep-primary)] text-white' : 'bg-[var(--ep-surface)] text-[var(--ep-muted)]'}`}
              >
                <Waypoints className="w-3.5 h-3.5" />{tLabel('knowledgeGraph.viewCanvas', 'Grafik')}
              </button>
              <button
                onClick={() => setView('table')}
                className={`px-2.5 py-1.5 text-[12px] flex items-center gap-1 ${view === 'table' ? 'bg-[var(--ep-primary)] text-white' : 'bg-[var(--ep-surface)] text-[var(--ep-muted)]'}`}
              >
                <LayoutList className="w-3.5 h-3.5" />{tLabel('knowledgeGraph.viewTable', "Ro'yxat")}
              </button>
            </div>
            <Button onClick={() => setShowCreate(true)} className="gap-1.5">
              <Link2 className="w-4 h-4" />{tLabel('knowledgeGraph.newLink', "Yangi bog'lanish")}
            </Button>
          </div>
        )}
      />

      {view === 'canvas' ? (
        <>
          <GraphViewControls
            search={search}
            onSearchChange={setSearch}
            entityTypeFilter={entityTypeFilter}
            onEntityTypeFilterChange={setEntityTypeFilter}
            layout={layout}
            onLayoutChange={setLayout}
            depth={depth}
            onDepthChange={setDepth}
            focusActive={focusKey !== null}
          />
          {focusKey && (
            <button
              onClick={() => setFocusKey(null)}
              className="text-[12px] text-[var(--ep-primary)] hover:underline"
            >
              {tLabel('knowledgeGraph.clearFocus', "Filtrni tozalash — hammasini ko'rsatish")}
            </button>
          )}
          <GraphViewCanvas
            nodes={filteredNodes}
            edges={allEdges}
            layout={layout}
            visibleKeys={visibleKeys}
            onNodeClick={handleNodeClick}
          />
        </>
      ) : (
        <GraphViewListPanel nodes={filteredNodes} edges={allEdges} nodesLoading={nodesQ.isLoading} edgesLoading={edgesQ.isLoading} />
      )}

      {selectedNode && (
        <GraphViewDetailDrawer
          node={selectedNode}
          edges={selectedNodeEdges}
          onClose={() => setSelectedNode(null)}
        />
      )}
      <CreateLinkDialog open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}
