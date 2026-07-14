/**
 * @module RichTextEditor
 * @description Erkin hujjatlar editor — Google-Docs-style shell (Variant B, visual only):
 * sticky DocumentToolbar + DocumentPaper canvas, with the tier-gated DocumentWatermark (3.4)
 * rendered OVER the paper content. Still emits TipTap JSON (→ erp_documents.content) + HTML
 * (→ content_html) through the exact same save path — no data-model / API / security change.
 */

import { useEditor, EditorContent } from '@tiptap/react';
import { useEffect, useRef, useState } from 'react';
import { documentEditorExtensions } from './documentEditorConfig';
import { DocumentToolbar } from './DocumentToolbar';
import { DocumentPaper, type PageMargins } from './DocumentPaper';
import { DocumentWatermark } from './DocumentWatermark';
import { FindBar } from './FindBar';

const EMPTY_DOC = { type: 'doc', content: [{ type: 'paragraph' }] };

export function RichTextEditor({
  value,
  contentKey,
  editable = true,
  tier,
  margins,
  onChange,
}: {
  value?: Record<string, unknown> | null;
  /** Identity of the document/version whose content `value` holds. When it changes the editor
   *  re-applies `value` (fixes async-loaded / imported content not showing after mount). It does
   *  NOT change on keystrokes, so there is no per-edit setContent cost or feedback loop. */
  contentKey?: string | number;
  editable?: boolean;
  tier?: string | null;
  margins?: PageMargins;
  onChange?: (json: Record<string, unknown>, html: string) => void;
}) {
  const editor = useEditor({
    extensions: documentEditorExtensions,
    content: value ?? EMPTY_DOC,
    editable,
    onUpdate: ({ editor: ed }) => onChange?.(ed.getJSON() as Record<string, unknown>, ed.getHTML()),
  });

  useEffect(() => {
    editor?.setEditable(editable);
  }, [editable, editor]);

  // Re-apply content when a DIFFERENT document/version loads (value may arrive async, after
  // mount). Guarded by contentKey so typing (which changes `value` via onChange) never re-sets.
  const loadedKey = useRef<string | number | undefined>(contentKey);
  useEffect(() => {
    if (!editor) return;
    if (contentKey !== loadedKey.current) {
      loadedKey.current = contentKey;
      editor.commands.setContent(value ?? EMPTY_DOC, { emitUpdate: false });
    }
  }, [editor, contentKey, value]);

  const [findOpen, setFindOpen] = useState(false);

  if (!editor) return null;

  return (
    <div
      className="flex flex-col rounded-lg overflow-hidden border border-[var(--ep-border)]"
      onKeyDown={(e) => {
        if ((e.ctrlKey || e.metaKey) && (e.key === 'f' || e.key === 'F')) { e.preventDefault(); setFindOpen(true); }
      }}
    >
      {editable && <FindBar editor={editor} open={findOpen} onClose={() => setFindOpen(false)} />}
      {editable && <DocumentToolbar editor={editor} onFind={() => setFindOpen(true)} />}
      <DocumentPaper margins={margins}>
        {/* Watermark wraps the writing surface only (over the paper, under the toolbar). */}
        <DocumentWatermark tier={tier}>
          <EditorContent
            editor={editor}
            className="prose prose-sm sm:prose-base max-w-none min-h-[900px] focus:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[900px] [&_table]:border-collapse [&_td]:border [&_td]:border-[var(--ep-border)] [&_td]:p-2 [&_th]:border [&_th]:border-[var(--ep-border)] [&_th]:p-2 [&_th]:bg-[var(--ep-bg)] [&_.ep-search-match]:bg-yellow-200 [&_.ep-search-current]:bg-orange-300 [&_.ep-search-current]:rounded-sm"
          />
        </DocumentWatermark>
      </DocumentPaper>
    </div>
  );
}
