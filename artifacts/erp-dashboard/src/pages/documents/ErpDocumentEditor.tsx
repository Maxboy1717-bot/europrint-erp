/**
 * @module ErpDocumentEditor
 * @description Erkin hujjat yaratish/tahrirlash sahifasi (Phase A3). Title + tier + TipTap
 * rich-text body → saves content (JSON) + content_html to /api/erp-documents. The editor is
 * wrapped in DocumentWatermark (tier-gated, STEP 3.4); download is blocked globally (3.2);
 * view/copy logging happens on the API side (3.3). Single-author, explicit Save (no auto-save).
 */

import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Save, ArrowLeft } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { RichTextEditor } from '@/components/document-control/RichTextEditor';
import { DocumentWatermark } from '@/components/document-control/DocumentWatermark';

interface ErpDoc {
  id: string;
  title: string;
  content: Record<string, unknown>;
  content_html: string | null;
  sensitivity_tier: string;
  version: number;
}

const TIERS: { value: string; label: string }[] = [
  { value: 'oddiy', label: 'Oddiy' },
  { value: 'maxfiy', label: 'Maxfiy' },
  { value: 'juda-maxfiy', label: 'Juda maxfiy' },
];

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
      toast({ title: 'Saqlandi', description: title.trim() });
      qc.invalidateQueries({ queryKey: ['/api/erp-documents'] });
      if (!id && doc?.id) navigate(`/documents/${doc.id}`);
    },
    onError: () => toast({ title: 'Xatolik', description: "Saqlab bo'lmadi", variant: 'destructive' }),
  });

  if (id && docQ.isLoading) {
    return <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[var(--ep-muted)]" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/documents')} className="p-2 rounded-lg text-[var(--ep-muted)] hover:bg-[var(--ep-bg)]" title="Orqaga">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Hujjat sarlavhasi"
          className="flex-1 text-lg font-semibold bg-transparent outline-none border-b border-transparent focus:border-[var(--ep-border)] py-1"
        />
        <select
          value={tier}
          onChange={(e) => setTier(e.target.value)}
          className="h-9 rounded-lg border border-[var(--ep-border)] bg-[var(--ep-surface)] px-2 text-sm"
          title="Maxfiylik darajasi"
        >
          {TIERS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <button
          onClick={() => title.trim() && save.mutate()}
          disabled={!title.trim() || save.isPending}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-[var(--ep-primary)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          {save.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Saqlash
        </button>
      </div>

      <DocumentWatermark tier={tier}>
        <RichTextEditor
          value={content}
          onChange={(json, html) => { setContent(json); setContentHtml(html); }}
        />
      </DocumentWatermark>
    </div>
  );
}
