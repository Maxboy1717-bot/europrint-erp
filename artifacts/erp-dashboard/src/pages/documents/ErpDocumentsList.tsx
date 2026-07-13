/**
 * @module ErpDocumentsList
 * @description "Mening hujjatlarim" — erkin hujjatlar list (Phase A4). Reuses EPTable
 * (design-system §3.4). Row → editor; "+ Yangi hujjat" → /documents/new; soft-delete via
 * ConfirmDialog (Qoida 14). Data from /api/erp-documents (owner-scoped).
 */

import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash2 } from 'lucide-react';
import { EPTable } from '@/components/ep';
import type { TableColumn } from '@/components/ep';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface ErpDocRow {
  id: string;
  title: string;
  sensitivity_tier: string;
  version: number;
  updated_at: string;
}

const TIER_BADGE: Record<string, { label: string; cls: string }> = {
  oddiy: { label: 'Oddiy', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
  maxfiy: { label: 'Maxfiy', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  'juda-maxfiy': { label: 'Juda maxfiy', cls: 'bg-red-50 text-red-700 border-red-200' },
};

export default function ErpDocumentsList() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const listQ = useQuery<ErpDocRow[]>({
    queryKey: ['/api/erp-documents'],
    queryFn: () => apiRequest<ErpDocRow[]>('GET', '/api/erp-documents'),
  });

  const del = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/erp-documents/${id}`),
    onSuccess: () => {
      toast({ title: "O'chirildi" });
      qc.invalidateQueries({ queryKey: ['/api/erp-documents'] });
    },
    onError: () => toast({ title: 'Xatolik', variant: 'destructive' }),
  });

  const rows = Array.isArray(listQ.data) ? listQ.data : [];

  const columns: TableColumn<ErpDocRow>[] = [
    {
      key: 'title',
      label: 'Sarlavha',
      sortable: true,
      render: (_v, row) => (
        <button onClick={() => navigate(`/documents/${row.id}`)} className="text-left font-medium text-[var(--ep-primary)] hover:underline">
          {row.title}
        </button>
      ),
    },
    {
      key: 'sensitivity_tier',
      label: 'Maxfiylik',
      width: '130px',
      render: (_v, row) => {
        const b = TIER_BADGE[row.sensitivity_tier] ?? TIER_BADGE.oddiy;
        return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${b.cls}`}>{b.label}</span>;
      },
    },
    { key: 'version', label: 'Versiya', width: '90px' },
    {
      key: 'updated_at',
      label: "O'zgartirilgan",
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
          <button onClick={() => navigate(`/documents/${row.id}`)} title="Tahrirlash" className="p-1.5 rounded-md text-[var(--ep-muted)] hover:bg-[var(--ep-bg)]">
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={() => setConfirmId(row.id)} title="O'chirish" className="p-1.5 rounded-md text-[var(--ep-muted)] hover:bg-[var(--ep-red)]/10 hover:text-[var(--ep-red)]">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 space-y-4">
      <EPTable<ErpDocRow>
        title="Mening hujjatlarim"
        columns={columns}
        data={rows}
        isLoading={listQ.isLoading}
        searchable
        searchPlaceholder="Hujjat qidirish..."
        onAdd={() => navigate('/documents/new')}
        addLabel="Yangi hujjat"
        emptyMessage="Hali hujjat yo'q — 'Yangi hujjat' bilan yarating"
        zebra
      />
      <ConfirmDialog
        open={confirmId !== null}
        onOpenChange={(o) => { if (!o) setConfirmId(null); }}
        title="Hujjatni o'chirish"
        description="Bu hujjat o'chiriladi (qayta tiklab bo'lmaydi). Davom etamizmi?"
        confirmText="O'chirish"
        variant="destructive"
        onConfirm={() => { if (confirmId) del.mutate(confirmId); setConfirmId(null); }}
      />
    </div>
  );
}
