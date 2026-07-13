/**
 * @module ImportDocxButton
 * @description Import a Word .docx into a new erkin-hujjat (item #4). Fully client-side:
 * mammoth converts the .docx → HTML in the browser, TipTap generateJSON() turns it into the
 * same content JSON the editor uses, then it POSTs to the SAME secured /api/erp-documents
 * endpoint. The raw .docx never reaches the server → zero leftover-file leak risk (Document
 * Control posture). Images are stripped (no-base64 policy #… — text + structure only), which
 * is surfaced to the user. On success it opens the new doc in the editor for review.
 */

import { useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { Upload, Loader2 } from 'lucide-react';
import mammoth from 'mammoth';
import { generateJSON } from '@tiptap/react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { tLabel } from '@/lib/i18n/tLabel';
import { documentEditorExtensions } from '@/components/document-control/documentEditorConfig';

interface CreatedDoc { id: string }

export function ImportDocxButton() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-picking the same file later
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.docx')) {
      toast({ title: tLabel('common.error', 'Xatolik'), description: tLabel('documents.importDocxOnly', 'Faqat .docx fayl qabul qilinadi'), variant: 'destructive' });
      return;
    }
    setBusy(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const { value } = await mammoth.convertToHtml({ arrayBuffer });
      // Strip images: base64 blobs violate the no-base64 storage/security policy → text + structure only.
      const html = (value || '').replace(/<img[^>]*>/gi, '').trim() || '<p></p>';
      const content = generateJSON(html, documentEditorExtensions);
      const title = file.name.replace(/\.docx$/i, '').trim() || tLabel('documents.importedTitle', 'Import qilingan hujjat');
      const doc = await apiRequest<CreatedDoc>('POST', '/api/erp-documents', {
        title, content, contentHtml: html, sensitivityTier: 'oddiy',
      });
      qc.invalidateQueries({ queryKey: ['/api/erp-documents'] });
      toast({ title: tLabel('documents.imported', 'Import qilindi'), description: tLabel('documents.importedNote', 'Matn va tuzilma import qilindi (rasmlar import qilinmaydi). Tekshirib saqlang.') });
      if (doc?.id) navigate(`/documents/${doc.id}`);
    } catch {
      toast({ title: tLabel('common.error', 'Xatolik'), description: tLabel('documents.importFailed', "Faylni import qilib bo'lmadi"), variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <input ref={inputRef} type="file" accept=".docx" className="hidden" onChange={onFile} />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[var(--ep-border)] text-[var(--ep-text)] text-xs font-medium hover:bg-[var(--ep-bg)] disabled:opacity-50"
        title={tLabel('documents.importDocxHint', 'Word (.docx) faylni import qilish')}
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
        {tLabel('documents.importDocx', 'Import (.docx)')}
      </button>
    </>
  );
}
