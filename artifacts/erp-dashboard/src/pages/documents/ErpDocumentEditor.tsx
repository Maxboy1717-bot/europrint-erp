/**
 * @module ErpDocumentEditor
 * @description Erkin hujjat yaratish/tahrirlash — Google-Docs-style shell (Variant B, visual
 * only). Top bar = inline-editable title + tier badge near the title + save-status; below it
 * the sticky toolbar + paper canvas (RichTextEditor). Saves content (JSON) + content_html to
 * /api/erp-documents (same endpoint/security as before). Explicit Save with a dirty indicator
 * (no autosave — every save bumps version).
 */

import { useEffect, useRef, useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Save, ArrowLeft, Check, Share2, Printer } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { tLabel } from '@/lib/i18n/tLabel';
import { logDocumentAccess } from '@/lib/documentAccessLog';

// Decision #5 — print is leadership-only (admin/super_admin/director bypass; *_manager = dept heads).
const PRINT_ROLES = new Set(['admin', 'super_admin', 'director', 'manager', 'hr_manager', 'finance_manager', 'production_manager']);
import { RichTextEditor } from '@/components/document-control/RichTextEditor';
import { SendToCcModal } from './SendToCcModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

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
  const [showNameModal, setShowNameModal] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [showPrint, setShowPrint] = useState(false);
  const [printReason, setPrintReason] = useState('');
  const { user } = useAuth();
  const canPrint = PRINT_ROLES.has((user?.role ?? '').toLowerCase());

  const docQ = useQuery<ErpDoc>({
    queryKey: [`/api/erp-documents/${id}`],
    queryFn: () => apiRequest<ErpDoc>('GET', `/api/erp-documents/${id}`),
    enabled: !!id,
  });

  // Seed the local buffer from the server row ONCE per document id. Seeding on every docQ.data
  // change would let a background refetch (reconnect, invalidation) overwrite unsaved edits and
  // reset `dirty` — i.e. typed changes silently disappear. Re-seeds only when the id changes.
  const seededId = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (docQ.data && seededId.current !== id) {
      seededId.current = id;
      setTitle(docQ.data.title);
      setTier(docQ.data.sensitivity_tier);
      setContent(docQ.data.content);
      setDirty(false);
    }
  }, [docQ.data, id]);

  const save = useMutation({
    mutationFn: async (vars: { finalTitle: string; silent?: boolean }) => {
      const payload = { title: vars.finalTitle.trim(), content: content ?? { type: 'doc', content: [] }, contentHtml, sensitivityTier: tier };
      return id
        ? apiRequest<ErpDoc>('PATCH', `/api/erp-documents/${id}`, payload)
        : apiRequest<ErpDoc>('POST', '/api/erp-documents', payload);
    },
    onSuccess: (doc, vars) => {
      if (!vars.silent) toast({ title: tLabel('documents.saved', 'Saqlandi'), description: title.trim() });
      setDirty(false);
      qc.invalidateQueries({ queryKey: ['/api/erp-documents'] });
      if (!id && doc?.id) navigate(`/documents/${doc.id}`);
    },
    onError: () => toast({ title: tLabel('common.error', 'Xatolik'), description: tLabel('documents.saveFailed', "Saqlab bo'lmadi"), variant: 'destructive' }),
  });

  // Word-style: first save of a brand-new doc prompts for a name; later saves are direct.
  const doSave = (name?: string) => {
    const finalTitle = (name ?? title).trim();
    if (!finalTitle) return;
    if (name && name.trim() !== title) setTitle(name.trim());
    save.mutate({ finalTitle });
  };

  // Live autosave: once the doc exists (has id + a title), edits persist automatically after a
  // short pause — no need to press Saqlash. A brand-new doc still takes one explicit named save
  // first (it needs a title + id); after that every change is saved live and silently.
  useEffect(() => {
    if (!id || !dirty || save.isPending || !title.trim()) return;
    const t = setTimeout(() => save.mutate({ finalTitle: title.trim(), silent: true }), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, dirty, content, title, tier, save.isPending]);
  const handleSaveClick = () => {
    if (!id) { setNameInput(title.trim()); setShowNameModal(true); return; }
    doSave();
  };

  // Ctrl+S / Cmd+S = save now (and suppress the browser's "save page" dialog). A ref keeps the
  // one-time listener pointing at the latest save closure (no stale content).
  const saveRef = useRef(handleSaveClick);
  useEffect(() => { saveRef.current = handleSaveClick; });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) { e.preventDefault(); saveRef.current(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Decision #4/#5 — gated print: reason required + leadership-only + logged, then browser print.
  const print = useMutation({
    mutationFn: (reason: string) => apiRequest('POST', `/api/erp-documents/${id}/print`, { reason }),
    onSuccess: () => { setShowPrint(false); setPrintReason(''); setTimeout(() => window.print(), 100); },
    onError: () => toast({ title: tLabel('common.error', 'Xatolik'), description: tLabel('documents.printDenied', "Chop etish rad etildi"), variant: 'destructive' }),
  });

  // P1-4 — live word/character count derived from the HTML (no extra TipTap extension needed).
  const plainText = contentHtml.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ');
  const wordCount = plainText.trim() ? plainText.trim().split(/\s+/).length : 0;
  const charCount = plainText.replace(/\s+/g, '').length;

  const statusText = save.isPending
    ? tLabel('documents.saving', 'Saqlanmoqda…')
    : dirty
      ? tLabel('documents.unsaved', "Saqlanmagan o'zgarishlar")
      : id
        ? tLabel('documents.allSaved', 'Barcha o\'zgarishlar saqlangan')
        : '';

  // Wait for the row itself (not just isLoading) so the editor never mounts before its content
  // exists — otherwise it mounts empty and TipTap ignores the later-arriving content.
  if (id && !docQ.data) {
    return <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[var(--ep-muted)]" /></div>;
  }

  // Editor initial content comes DIRECTLY from the loaded row (existing/imported docs) so it is
  // present at mount; for a new doc it is the local buffer. contentKey re-applies it per document.
  const editorValue = id ? (docQ.data?.content ?? null) : content;
  const editorKey = id ? `${id}:${docQ.data?.version ?? 0}` : 'new';

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
            {/* P1-4 word/char count (live from the HTML). */}
            <span className="text-[11px] text-[var(--ep-muted)]" title={tLabel('documents.wordCount', 'So\'z / belgi soni')}>
              {wordCount} {tLabel('documents.words', "so'z")} · {charCount} {tLabel('documents.chars', 'belgi')}
            </span>
          </div>
        </div>
        {id && canPrint && (
          <button
            onClick={() => setShowPrint(true)}
            className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-[var(--ep-border)] text-[var(--ep-text)] hover:bg-[var(--ep-bg)] shrink-0"
            title={tLabel('documents.print', 'Chop etish')}
          >
            <Printer className="w-4 h-4" />
          </button>
        )}
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
          onClick={handleSaveClick}
          disabled={save.isPending}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-[var(--ep-primary)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 shrink-0"
        >
          {save.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {tLabel('documents.save', 'Saqlash')}
        </button>
      </div>

      {id && <SendToCcModal erpDocumentId={id} open={showSendCc} onClose={() => setShowSendCc(false)} />}

      {/* Gated print: reason required (#4) + leadership-only (#5) + logged, then browser print */}
      <Dialog open={showPrint} onOpenChange={setShowPrint}>
        <DialogContent className="max-w-sm p-6">
          <DialogHeader>
            <DialogTitle>{tLabel('documents.print', 'Chop etish')}</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-[var(--ep-muted)] -mt-1">{tLabel('documents.printReasonHint', 'Chop etish sababi majburiy va jurnalga yoziladi.')}</p>
          <input
            autoFocus
            value={printReason}
            onChange={(e) => setPrintReason(e.target.value)}
            placeholder={tLabel('documents.printReason', 'Chop etish sababi (kamida 3 belgi)')}
            className="w-full h-10 rounded-lg border border-[var(--ep-border)] bg-[var(--ep-surface)] px-3 text-sm outline-none focus:border-[var(--ep-blue)]"
          />
          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setShowPrint(false)}>{tLabel('documents.cancel', 'Bekor')}</Button>
            <Button onClick={() => printReason.trim().length >= 3 && print.mutate(printReason.trim())} disabled={printReason.trim().length < 3 || print.isPending} className="gap-1.5">
              {print.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
              {tLabel('documents.print', 'Chop etish')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Word-style name prompt on first save of a new document */}
      <Dialog open={showNameModal} onOpenChange={setShowNameModal}>
        <DialogContent className="max-w-sm p-6">
          <DialogHeader>
            <DialogTitle>{tLabel('documents.nameDocument', 'Hujjat nomini kiriting')}</DialogTitle>
          </DialogHeader>
          <input
            autoFocus
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && nameInput.trim()) { setShowNameModal(false); doSave(nameInput); } }}
            placeholder={tLabel('documents.titlePlaceholder', 'Hujjat sarlavhasi')}
            className="w-full h-10 rounded-lg border border-[var(--ep-border)] bg-[var(--ep-surface)] px-3 text-sm outline-none focus:border-[var(--ep-blue)]"
          />
          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setShowNameModal(false)}>{tLabel('documents.cancel', 'Bekor')}</Button>
            <Button onClick={() => { if (nameInput.trim()) { setShowNameModal(false); doSave(nameInput); } }} disabled={!nameInput.trim()}>
              {tLabel('documents.save', 'Saqlash')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* onCopy bubbles up from the contenteditable — log every copy (best-effort, decision #6:
          copy is allowed, only logged). Only for a saved doc (needs an id to reference). */}
      <div onCopy={() => { if (id) logDocumentAccess('erp_document', id, 'copy'); }}>
        <RichTextEditor
          key={editorKey}
          contentKey={editorKey}
          value={editorValue}
          tier={tier}
          onChange={(json, html) => { setContent(json); setContentHtml(html); setDirty(true); }}
        />
      </div>
    </div>
  );
}
