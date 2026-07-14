/**
 * @module DocumentAuditLog
 * @description STEP 3.9 — Director audit panel: the ONE reader of `document_access_log`. Shows
 * who viewed/printed/copied/exported which document, when, from where, and (for print/export)
 * why. Filters (document type, action, tier, user, date range) + server-side pagination against
 * GET /api/document-access/audit-log (role-gated director/super_admin — the URL prefix
 * `director/` also hides this from the sidebar for everyone else). Reuses EPTable (design §3.4).
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react';
import { EPTable } from '@/components/ep';
import type { TableColumn } from '@/components/ep';
import { apiRequest } from '@/lib/queryClient';
import { tLabel } from '@/lib/i18n/tLabel';

interface AuditRow {
  id: number;
  user_id: number | null;
  user_full_name: string | null;
  user_role: string | null;
  document_type: string;
  document_id: string;
  action: string;
  reason: string | null;
  sensitivity_tier: string | null;
  ip_address: string | null;
  created_at: string;
}
interface AuditResp { items: AuditRow[]; total: number; page: number; limit: number }

const ACTION_BADGE: Record<string, { label: string; cls: string }> = {
  view: { label: tLabel('audit.view', "Ko'rish"), cls: 'bg-slate-100 text-slate-600 border-slate-200' },
  print: { label: tLabel('audit.print', 'Chop etish'), cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  copy: { label: tLabel('audit.copy', 'Nusxa'), cls: 'bg-violet-50 text-violet-700 border-violet-200' },
  export: { label: tLabel('audit.export', 'Eksport'), cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  client_export: { label: tLabel('audit.clientExport', 'Mijoz eksport'), cls: 'bg-orange-50 text-orange-700 border-orange-200' },
};
const TIER_BADGE: Record<string, { label: string; cls: string }> = {
  oddiy: { label: tLabel('documents.tierOddiy', 'Oddiy'), cls: 'bg-slate-100 text-slate-600 border-slate-200' },
  maxfiy: { label: tLabel('documents.tierMaxfiy', 'Maxfiy'), cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  'juda-maxfiy': { label: tLabel('documents.tierJudaMaxfiy', 'Juda maxfiy'), cls: 'bg-red-50 text-red-700 border-red-200' },
};
const DOC_TYPES = ['', 'erp_document', 'erp_spreadsheet', 'cc', 'hr_document', 'employment_contract', 'technology_card', 'sd_contract', 'lms_certificate', 'gl_document'];
const ACTIONS = ['', 'view', 'print', 'copy', 'export', 'client_export'];
const TIERS = ['', 'oddiy', 'maxfiy', 'juda-maxfiy'];
const LIMIT = 50;

const selCls = 'h-9 text-sm rounded-lg border border-[var(--ep-border)] bg-[var(--ep-surface)] px-2 outline-none focus:border-[var(--ep-blue)]';

export default function DocumentAuditLog() {
  const [documentType, setDocumentType] = useState('');
  const [action, setAction] = useState('');
  const [tier, setTier] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  const qs = new URLSearchParams();
  qs.set('page', String(page));
  qs.set('limit', String(LIMIT));
  if (documentType) qs.set('documentType', documentType);
  if (action) qs.set('action', action);
  if (tier) qs.set('sensitivityTier', tier);
  if (dateFrom) qs.set('dateFrom', new Date(dateFrom).toISOString());
  if (dateTo) qs.set('dateTo', new Date(dateTo + 'T23:59:59').toISOString());

  const q = useQuery<AuditResp>({
    queryKey: ['/api/document-access/audit-log', qs.toString()],
    queryFn: () => apiRequest<AuditResp>('GET', `/api/document-access/audit-log?${qs.toString()}`),
  });

  const rows = Array.isArray(q.data?.items) ? q.data!.items : [];
  const total = q.data?.total ?? 0;
  const maxPage = Math.max(1, Math.ceil(total / LIMIT));
  const resetPage = (fn: (v: string) => void) => (v: string) => { fn(v); setPage(1); };

  const columns: TableColumn<AuditRow>[] = [
    { key: 'created_at', label: tLabel('audit.when', 'Vaqt'), width: '170px', render: (_v, r) => new Date(r.created_at).toLocaleString('uz-UZ') },
    {
      key: 'user_full_name', label: tLabel('audit.who', 'Kim'), render: (_v, r) => (
        <div className="flex flex-col"><span className="font-medium">{r.user_full_name ?? `#${r.user_id ?? '—'}`}</span>
          {r.user_role && <span className="text-[11px] text-[var(--ep-muted)]">{r.user_role}</span>}</div>
      ),
    },
    { key: 'document_type', label: tLabel('audit.docType', 'Hujjat turi'), width: '150px' },
    { key: 'document_id', label: 'ID', width: '110px', render: (_v, r) => <span className="font-mono text-[11px]">{String(r.document_id).slice(0, 10)}</span> },
    {
      key: 'action', label: tLabel('audit.action', 'Amal'), width: '120px', render: (_v, r) => {
        const b = ACTION_BADGE[r.action] ?? { label: r.action, cls: 'bg-slate-100 text-slate-600 border-slate-200' };
        return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${b.cls}`}>{b.label}</span>;
      },
    },
    {
      key: 'sensitivity_tier', label: tLabel('audit.tier', 'Maxfiylik'), width: '120px', render: (_v, r) => {
        const b = TIER_BADGE[r.sensitivity_tier ?? ''] ?? { label: r.sensitivity_tier ?? '—', cls: 'bg-slate-50 text-slate-400 border-slate-200' };
        return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${b.cls}`}>{b.label}</span>;
      },
    },
    { key: 'reason', label: tLabel('audit.reason', 'Sabab'), render: (_v, r) => r.reason ?? '—' },
    { key: 'ip_address', label: 'IP', width: '120px', render: (_v, r) => <span className="font-mono text-[11px]">{r.ip_address ?? '—'}</span> },
  ];

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-5 h-5 text-[var(--ep-blue)]" />
        <h1 className="text-lg font-semibold text-[var(--ep-text)]">{tLabel('audit.title', 'Hujjat-kirish jurnali')}</h1>
        <span className="text-sm text-[var(--ep-muted)]">({total})</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <select value={documentType} onChange={(e) => resetPage(setDocumentType)(e.target.value)} className={selCls} title={tLabel('audit.docType', 'Hujjat turi')}>
          {DOC_TYPES.map((t) => <option key={t} value={t}>{t === '' ? tLabel('audit.allTypes', 'Barcha turlar') : t}</option>)}
        </select>
        <select value={action} onChange={(e) => resetPage(setAction)(e.target.value)} className={selCls} title={tLabel('audit.action', 'Amal')}>
          {ACTIONS.map((a) => <option key={a} value={a}>{a === '' ? tLabel('audit.allActions', 'Barcha amallar') : (ACTION_BADGE[a]?.label ?? a)}</option>)}
        </select>
        <select value={tier} onChange={(e) => resetPage(setTier)(e.target.value)} className={selCls} title={tLabel('audit.tier', 'Maxfiylik')}>
          {TIERS.map((t) => <option key={t} value={t}>{t === '' ? tLabel('audit.allTiers', 'Barcha darajalar') : (TIER_BADGE[t]?.label ?? t)}</option>)}
        </select>
        <input type="date" value={dateFrom} onChange={(e) => resetPage(setDateFrom)(e.target.value)} className={selCls} title={tLabel('audit.from', 'Dan')} />
        <input type="date" value={dateTo} onChange={(e) => resetPage(setDateTo)(e.target.value)} className={selCls} title={tLabel('audit.to', 'Gacha')} />
      </div>

      <EPTable<AuditRow>
        title={tLabel('audit.title', 'Hujjat-kirish jurnali')}
        columns={columns}
        data={rows}
        isLoading={q.isLoading}
        emptyMessage={tLabel('audit.empty', 'Yozuv topilmadi')}
        zebra
      />

      {/* Server pagination */}
      <div className="flex items-center justify-end gap-2 text-sm">
        <span className="text-[var(--ep-muted)]">{tLabel('audit.page', 'Sahifa')} {page} / {maxPage}</span>
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
          className="inline-flex items-center h-8 px-2 rounded-lg border border-[var(--ep-border)] hover:bg-[var(--ep-bg)] disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
        <button onClick={() => setPage((p) => Math.min(maxPage, p + 1))} disabled={page >= maxPage}
          className="inline-flex items-center h-8 px-2 rounded-lg border border-[var(--ep-border)] hover:bg-[var(--ep-bg)] disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
      </div>
    </div>
  );
}
