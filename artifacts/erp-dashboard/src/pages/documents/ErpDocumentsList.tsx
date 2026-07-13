/**
 * @module ErpDocumentsList
 * @description "Mening hujjatlarim" — erkin hujjatlar list (Phase A4 + B-4). UNIFIED list:
 * merges text documents (/api/erp-documents) AND spreadsheets (/api/erp-spreadsheets) into one
 * table sorted by updated_at, so a created spreadsheet is reachable again (it wasn't before —
 * only text docs were listed). Each row carries its kind ('doc' | 'sheet'): a "Turi" column
 * shows the icon, and edit/delete route to the correct editor/endpoint. Reuses EPTable
 * (design-system §3.4); "+ Yangi hujjat" → /documents/new (format choice); soft-delete via
 * ConfirmDialog (Qoida 14).
 */

import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash2, FileText, Table2 } from 'lucide-react';
import { EPTable } from '@/components/ep';
import type { TableColumn } from '@/components/ep';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { tLabel } from '@/lib/i18n/tLabel';
import { ImportDocxButton } from './ImportDocxButton';

interface ApiRow {
  id: string;
  title: string;
  sensitivity_tier: string;
  version: number;
  updated_at: string;
}

type DocKind = 'doc' | 'sheet';
interface UnifiedRow extends ApiRow {
  kind: DocKind;
}

const TIER_BADGE: Record<string, { label: string; cls: string }> = {
  oddiy: { label: tLabel('documents.tierOddiy', 'Oddiy'), cls: 'bg-slate-100 text-slate-600 border-slate-200' },
  maxfiy: { label: tLabel('documents.tierMaxfiy', 'Maxfiy'), cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  'juda-maxfiy': { label: tLabel('documents.tierJudaMaxfiy', 'Juda maxfiy'), cls: 'bg-red-50 text-red-700 border-red-200' },
};

// Per-kind routing/endpoint map — keeps edit + delete honest about which resource a row is.
const KIND: Record<DocKind, { editPath: (id: string) => string; endpoint: string; icon: React.ReactNode; label: string }> = {
  doc: {
    editPath: (id) => `/documents/${id}`,
    endpoint: '/api/erp-documents',
    icon: <FileText className="w-4 h-4 text-[var(--ep-blue)]" />,
    label: tLabel('documents.textDoc', 'Matn hujjati'),
  },
  sheet: {
    editPath: (id) => `/spreadsheets/${id}`,
    endpoint: '/api/erp-spreadsheets',
    icon: <Table2 className="w-4 h-4 text-[var(--ep-green)]" />,
    label: tLabel('documents.spreadsheet', 'Jadval'),
  },
};

export default function ErpDocumentsList() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [confirm, setConfirm] = useState<{ id: string; kind: DocKind } | null>(null);

  const docsQ = useQuery<ApiRow[]>({
    queryKey: ['/api/erp-documents'],
    queryFn: () => apiRequest<ApiRow[]>('GET', '/api/erp-documents'),
  });
  const sheetsQ = useQuery<ApiRow[]>({
    queryKey: ['/api/erp-spreadsheets'],
    queryFn: () => apiRequest<ApiRow[]>('GET', '/api/erp-spreadsheets'),
  });

  const del = useMutation({
    mutationFn: ({ id, kind }: { id: string; kind: DocKind }) =>
      apiRequest('DELETE', `${KIND[kind].endpoint}/${id}`),
    onSuccess: (_res, vars) => {
      toast({ title: tLabel('documents.deleted', "O'chirildi") });
      qc.invalidateQueries({ queryKey: [KIND[vars.kind].endpoint] });
    },
    onError: () => toast({ title: tLabel('common.error', 'Xatolik'), variant: 'destructive' }),
  });

  const docs = Array.isArray(docsQ.data) ? docsQ.data : [];
  const sheets = Array.isArray(sheetsQ.data) ? sheetsQ.data : [];
  const rows: UnifiedRow[] = [
    ...docs.map((r) => ({ ...r, kind: 'doc' as const })),
    ...sheets.map((r) => ({ ...r, kind: 'sheet' as const })),
  ].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  const columns: TableColumn<UnifiedRow>[] = [
    {
      key: 'kind',
      label: tLabel('documents.colType', 'Turi'),
      width: '110px',
      render: (_v, row) => (
        <span className="inline-flex items-center gap-1.5 text-[13px] text-[var(--ep-text)]" title={KIND[row.kind].label}>
          {KIND[row.kind].icon}
          {KIND[row.kind].label}
        </span>
      ),
    },
    {
      key: 'title',
      label: tLabel('documents.colTitle', 'Sarlavha'),
      sortable: true,
      render: (_v, row) => (
        <button onClick={() => navigate(KIND[row.kind].editPath(row.id))} className="text-left font-medium text-[var(--ep-primary)] hover:underline">
          {row.title}
        </button>
      ),
    },
    {
      key: 'sensitivity_tier',
      label: tLabel('documents.colTier', 'Maxfiylik'),
      width: '130px',
      render: (_v, row) => {
        const b = TIER_BADGE[row.sensitivity_tier] ?? TIER_BADGE.oddiy;
        return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${b.cls}`}>{b.label}</span>;
      },
    },
    { key: 'version', label: tLabel('documents.colVersion', 'Versiya'), width: '90px' },
    {
      key: 'updated_at',
      label: tLabel('documents.colUpdated', "O'zgartirilgan"),
      width: '170px',
      sortable: true,
      render: (_v, row) => new Date(row.updated_at).toLocaleString('uz-UZ'),
    },
    {
      key: 'actions',
      label: '',
      width: '90px',
      render: (_v, row) => (
        <div className="flex items-center gap-1">
          <button onClick={() => navigate(KIND[row.kind].editPath(row.id))} title={tLabel('documents.edit', 'Tahrirlash')} className="p-1.5 rounded-md text-[var(--ep-muted)] hover:bg-[var(--ep-bg)]">
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={() => setConfirm({ id: row.id, kind: row.kind })} title={tLabel('documents.delete', "O'chirish")} className="p-1.5 rounded-md text-[var(--ep-muted)] hover:bg-[var(--ep-red)]/10 hover:text-[var(--ep-red)]">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-end">
        <ImportDocxButton />
      </div>
      <EPTable<UnifiedRow>
        title={tLabel('documents.myDocuments', 'Mening hujjatlarim')}
        columns={columns}
        data={rows}
        isLoading={docsQ.isLoading || sheetsQ.isLoading}
        searchable
        searchPlaceholder={tLabel('documents.searchPlaceholder', 'Hujjat qidirish...')}
        onAdd={() => navigate('/documents/new')}
        addLabel={tLabel('documents.newDocument', 'Yangi hujjat')}
        emptyMessage={tLabel('documents.empty', "Hali hujjat yo'q — 'Yangi hujjat' bilan yarating")}
        zebra
      />
      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(o) => { if (!o) setConfirm(null); }}
        title={tLabel('documents.deleteTitle', "Hujjatni o'chirish")}
        description={tLabel('documents.deleteDesc', "Bu hujjat o'chiriladi (qayta tiklab bo'lmaydi). Davom etamizmi?")}
        confirmText={tLabel('documents.delete', "O'chirish")}
        variant="destructive"
        onConfirm={() => { if (confirm) del.mutate(confirm); setConfirm(null); }}
      />
    </div>
  );
}
