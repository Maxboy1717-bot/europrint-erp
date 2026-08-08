/**
 * @module GraphView
 * @description AI Bilim Grafigi — Faza A minimal ro'yxat UI (hali Canvas
 * emas, Faza B). Node/edge ro'yxatlarini `EPTable` bilan ko'rsatadi + yangi
 * qo'lda bog'lanish (manual link) yaratish formasi (Q-19 CRUD talabi).
 * `/api/knowledge-graph/*` — row-level RBAC serverda hisoblanadi, FE hech
 * narsani filtrlamaydi (backend allaqachon ruxsatsiz turlarni chiqarib
 * tashlaydi).
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Link2 } from 'lucide-react';
import { EPPageHeader } from '@/components/ep/EPPageHeader';
import { EPTable } from '@/components/ep';
import type { TableColumn } from '@/components/ep';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { tLabel } from '@/lib/i18n/tLabel';

interface KgNode {
  id: string;
  entityType: string;
  entityId: string;
  title: string;
  summary: string | null;
  updatedAt: string;
}

interface KgEdge {
  id: string;
  sourceType: string;
  sourceId: string;
  targetType: string;
  targetId: string;
  relationType: string;
  isBroken: boolean;
  brokenReason: string | null;
}

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
          <Input placeholder={tLabel('knowledgeGraph.sourceType', "Manba turi (masalan sales_order)")} value={form.sourceType} onChange={(e) => setForm({ ...form, sourceType: e.target.value })} className="h-9 text-sm" />
          <Input placeholder={tLabel('knowledgeGraph.sourceId', 'Manba ID')} value={form.sourceId} onChange={(e) => setForm({ ...form, sourceId: e.target.value })} className="h-9 text-sm" />
          <Input placeholder={tLabel('knowledgeGraph.targetType', "Maqsad turi (masalan document)")} value={form.targetType} onChange={(e) => setForm({ ...form, targetType: e.target.value })} className="h-9 text-sm" />
          <Input placeholder={tLabel('knowledgeGraph.targetId', 'Maqsad ID')} value={form.targetId} onChange={(e) => setForm({ ...form, targetId: e.target.value })} className="h-9 text-sm" />
          <Input placeholder={tLabel('knowledgeGraph.relationType', "Aloqa turi (masalan related_to)")} value={form.relationType} onChange={(e) => setForm({ ...form, relationType: e.target.value })} className="h-9 text-sm" />
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

  const nodesQ = useQuery<{ data: KgNode[] }>({
    queryKey: ['/api/knowledge-graph/nodes'],
    queryFn: () => apiRequest<{ data: KgNode[] }>('GET', '/api/knowledge-graph/nodes?limit=100'),
  });
  const edgesQ = useQuery<{ data: KgEdge[] }>({
    queryKey: ['/api/knowledge-graph/edges'],
    queryFn: () => apiRequest<{ data: KgEdge[] }>('GET', '/api/knowledge-graph/edges?limit=100'),
  });

  const nodes = Array.isArray(nodesQ.data?.data) ? nodesQ.data.data : [];
  const edges = Array.isArray(edgesQ.data?.data) ? edgesQ.data.data : [];

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
    {
      key: 'sourceType', label: tLabel('knowledgeGraph.colSource', 'Manba'), width: '220px',
      render: (_v, row) => `${row.sourceType}:${row.sourceId}`,
    },
    { key: 'relationType', label: tLabel('knowledgeGraph.colRelation', 'Aloqa'), width: '140px' },
    {
      key: 'targetType', label: tLabel('knowledgeGraph.colTarget', 'Maqsad'), width: '220px',
      render: (_v, row) => `${row.targetType}:${row.targetId}`,
    },
    {
      key: 'isBroken', label: tLabel('knowledgeGraph.colStatus', 'Holat'), width: '200px',
      render: (_v, row) => row.isBroken
        ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-red-50 text-red-700 border-red-200" title={row.brokenReason ?? ''}>{tLabel('knowledgeGraph.broken', 'Uzilgan')}</span>
        : <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200">{tLabel('knowledgeGraph.healthy', 'Sog\'lom')}</span>,
    },
  ];

  return (
    <div className="p-4 space-y-4">
      <EPPageHeader
        title={tLabel('knowledgeGraph.title', 'Bilim Grafigi')}
        subtitle={tLabel('knowledgeGraph.subtitle', 'ERP entity\'lari orasidagi bog\'lanishlar — AI agentlar shu grafni qidiradi')}
        actions={<Button onClick={() => setShowCreate(true)} className="gap-1.5"><Link2 className="w-4 h-4" />{tLabel('knowledgeGraph.newLink', "Yangi bog'lanish")}</Button>}
      />
      <EPTable<KgNode>
        title={tLabel('knowledgeGraph.nodesTitle', 'Node\'lar')}
        columns={nodeColumns}
        data={nodes}
        isLoading={nodesQ.isLoading}
        searchable
        searchPlaceholder={tLabel('knowledgeGraph.searchNodes', 'Node qidirish...')}
        emptyMessage={tLabel('knowledgeGraph.emptyNodes', "Hali node yo'q — real ERP hodisalari (buyurtma, ishlab chiqarish, sifat nazorati) sodir bo'lganda avtomatik paydo bo'ladi")}
        zebra
      />
      <EPTable<KgEdge>
        title={tLabel('knowledgeGraph.edgesTitle', "Bog'lanishlar")}
        columns={edgeColumns}
        data={edges}
        isLoading={edgesQ.isLoading}
        searchable
        searchPlaceholder={tLabel('knowledgeGraph.searchEdges', "Bog'lanish qidirish...")}
        emptyMessage={tLabel('knowledgeGraph.emptyEdges', "Hali bog'lanish yo'q")}
        zebra
      />
      <CreateLinkDialog open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}
