/**
 * @module ErpDocumentEditor
 * @description Erkin hujjat yaratish/tahrirlash — Google-Docs-style shell (Variant B, visual
 * only). Top bar = inline-editable title + tier badge near the title + save-status; below it
 * the sticky toolbar + paper canvas (RichTextEditor). Saves content (JSON) + content_html to
 * /api/erp-documents (same endpoint/security as before). Explicit Save with a dirty indicator
 * (no autosave — every save bumps version).
 */

import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Save, ArrowLeft, Check, Share2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { tLabel } from '@/lib/i18n/tLabel';
import { RichTextEditor } from '@/components/document-control/RichTextEditor';
import { SendToCcModal } from './SendToCcModal';

interface ErpDoc {
  id: string;
  title: string;
  content: Record<string, unknown>;
  content_html: string | null;
  sensitivity_tier: string;
  version: number;
}

const TIERS: { value: string; label: string }[] = [
  { value: 'oddiy', label: tLabel('documents.tierOddiy', 'Oddiy') },
  { value: 'maxfiy', label: tLabel('documents.tierMaxfiy', 'Maxfiy') },
  { value: 'juda-maxfiy', label: tLabel('documents.tierJudaMaxfiy', 'Juda maxfiy') },
];

const TIER_PILL: Record<string, string> = {
  oddiy: 'border-slate-200 text-slate-600 bg-slate-50',
  maxfiy: 'border-amber-200 text-amber-700 bg-amber-50',
  'juda-maxfiy': 'border-red-200 text-red-700 bg-red-50',
};

export default function ErpDocumentEditor() {
  const params = useParams();
  const id = params.id as string | undefined; // undefined => create mode
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [title, setTitle] = useState('');
  const [tier, setTier] = useState('oddiy');
  const [content, setContent] = useState<Record<string, unknown> | null>(null);
  const [contentHtml, setContentHtml] = useState('');
  const [dirty, setDirty] = useState(false);
  const [showSendCc, setShowSendCc] = useState(false);

  const docQ = useQuery<ErpDoc>({
    queryKey: [`/api/erp-documents/${id}`],
    queryFn: () => apiRequest<ErpDoc>('GET', `/api/erp-documents/${id}`),
    enabled: !!id,
  });

  useEffect(() => {
    if (docQ.data) {
      setTitle(docQ.data.title);
      setTier(docQ.data.sensitivity_tier);
      setContent(docQ.data.content);
      setDirty(false);
    }
  }, [docQ.data]);

  const save = useMutation({
    mutationFn: async () => {
      const payload = { title: title.trim(), content: content ?? { type: 'doc', content: [] }, contentHtml, sensitivityTier: tier };
      return id
        ? apiRequest<ErpDoc>('PATCH', `/api/erp-documents/${id}`, payload)
        : apiRequest<ErpDoc>('POST', '/api/erp-documents', payload);
    },
    onSuccess: (doc) => {
      toast({ title: tLabel('documents.saved', 'Saqlandi'), description: title.trim() });
      setDirty(false);
      qc.invalidateQueries({ queryKey: ['/api/erp-documents'] });
      if (!id && doc?.id) navigate(`/documents/${doc.id}`);
    },
    onError: () => toast({ title: tLabel('common.error', 'Xatolik'), description: tLabel('documents.saveFailed', "Saqlab bo'lmadi"), variant: 'destructive' }),
  });

  const statusText = save.isPending
    ? tLabel('documents.saving', 'Saqlanmoqda…')
    : dirty
      ? tLabel('documents.unsaved', "Saqlanmagan o'zgarishlar")
      : id
        ? tLabel('documents.allSaved', 'Barcha o\'zgarishlar saqlangan')
        : '';

  if (id && docQ.isLoading) {
    return <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[var(--ep-muted)]" /></div>;
  }

  return (
    <div className="flex flex-col">
      {/* ── Google-Docs-style top bar ── */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-[var(--ep-border)] bg-[var(--ep-surface)]">
        <button onClick={() => navigate('/documents')} className="p-2 rounded-lg text-[var(--ep-muted)] hover:bg-[var(--ep-bg)] shrink-0" title={tLabel('documents.back', 'Orqaga')}>
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <input
            value={title}
            onChange={(e) => { setTitle(e.target.value); setDirty(true); }}
            placeholder={tLabel('documents.titlePlaceholder', 'Hujjat sarlavhasi')}
            className="w-full text-[17px] font-medium text-[var(--ep-text)] bg-transparent outline-none border-b border-transparent hover:border-[var(--ep-border)] focus:border-[var(--ep-blue)] transition-colors py-0.5"
          />
          <div className="flex items-center gap-2 mt-0.5">
            {/* tier badge-dropdown near the title (de-emphasised) */}
            <select
              value={tier}
              onChange={(e) => { setTier(e.target.value); setDirty(true); }}
              title={tLabel('documents.tierLabel', 'Maxfiylik darajasi')}
              className={`text-[11px] font-medium rounded-full border px-2 py-0.5 outline-none cursor-pointer ${TIER_PILL[tier] ?? TIER_PILL.oddiy}`}
            >
              {TIERS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <span className="text-[11px] text-[var(--ep-muted)] inline-flex items-center gap-1">
              {statusText && !dirty && !save.isPending && <Check className="w-3 h-3 text-[var(--ep-green)]" />}
              {statusText}
            </span>
          </div>
        </div>
        {id && (
          <button
            onClick={() => setShowSendCc(true)}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-[var(--ep-border)] text-[var(--ep-text)] text-sm font-medium hover:bg-[var(--ep-bg)] shrink-0"
            title={tLabel('documents.sendViaCc', 'CC orqali yuborish')}
          >
            <Share2 className="w-4 h-4" />
            {tLabel('documents.sendViaCc', 'CC orqali yuborish')}
          </button>
        )}
        <button
          onClick={() => title.trim() && save.mutate()}
          disabled={!title.trim() || save.isPending}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-[var(--ep-primary)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 shrink-0"
        >
          {save.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {tLabel('documents.save', 'Saqlash')}
        </button>
      </div>

      {id && <SendToCcModal erpDocumentId={id} open={showSendCc} onClose={() => setShowSendCc(false)} />}

      <RichTextEditor
        value={content}
        tier={tier}
        onChange={(json, html) => { setContent(json); setContentHtml(html); setDirty(true); }}
      />
    </div>
  );
}
