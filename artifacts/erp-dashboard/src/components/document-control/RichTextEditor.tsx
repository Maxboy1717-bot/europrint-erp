/**
 * @module RichTextEditor
 * @description Erkin hujjatlar editor — Google-Docs-style shell (Variant B, visual only):
 * sticky DocumentToolbar + DocumentPaper canvas, with the tier-gated DocumentWatermark (3.4)
 * rendered OVER the paper content. Still emits TipTap JSON (→ erp_documents.content) + HTML
 * (→ content_html) through the exact same save path — no data-model / API / security change.
 */

import { useEditor, EditorContent } from '@tiptap/react';
import { useEffect } from 'react';
import { documentEditorExtensions } from './documentEditorConfig';
import { DocumentToolbar } from './DocumentToolbar';
import { DocumentPaper } from './DocumentPaper';
import { DocumentWatermark } from './DocumentWatermark';

export function RichTextEditor({
  value,
  editable = true,
  tier,
  onChange,
}: {
  value?: Record<string, unknown> | null;
  editable?: boolean;
  tier?: string | null;
  onChange?: (json: Record<string, unknown>, html: string) => void;
}) {
  const editor = useEditor({
    extensions: documentEditorExtensions,
    content: value ?? { type: 'doc', content: [{ type: 'paragraph' }] },
    editable,
    onUpdate: ({ editor: ed }) => onChange?.(ed.getJSON() as Record<string, unknown>, ed.getHTML()),
  });

  useEffect(() => {
    editor?.setEditable(editable);
  }, [editable, editor]);

  if (!editor) return null;

  return (
    <div className="flex flex-col rounded-lg overflow-hidden border border-[var(--ep-border)]">
      {editable && <DocumentToolbar editor={editor} />}
      <DocumentPaper>
        {/* Watermark wraps the writing surface only (over the paper, under the toolbar). */}
        <DocumentWatermark tier={tier}>
          <EditorContent
            editor={editor}
            className="prose prose-sm sm:prose-base max-w-none min-h-[900px] focus:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[900px] [&_table]:border-collapse [&_td]:border [&_td]:border-[var(--ep-border)] [&_td]:p-2 [&_th]:border [&_th]:border-[var(--ep-border)] [&_th]:p-2 [&_th]:bg-[var(--ep-bg)]"
          />
        </DocumentWatermark>
      </DocumentPaper>
    </div>
  );
}
