/**
 * @module RichTextEditor
 * @description Erkin hujjatlar (Phase A3) — TipTap v3 rich-text editor covering the daily-80%
 * (headings, bold/italic, lists, links, tables, quote/code). Emits both TipTap JSON (source of
 * truth → erp_documents.content) and rendered HTML (→ content_html, for preview + Phase-A2 PDF).
 * No auto-save/collaboration (single-author-at-a-time, per scope).
 */

import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TableKit } from '@tiptap/extension-table';
import { useEffect } from 'react';
import {
  Bold, Italic, Heading1, Heading2, List, ListOrdered, Quote, Code, Link as LinkIcon,
  Table as TableIcon, Undo, Redo,
} from 'lucide-react';
import { cn } from '@/lib/utils';

function Btn({ active, onClick, title, children }: { active?: boolean; onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        'p-1.5 rounded-md text-[var(--ep-muted)] hover:bg-[var(--ep-bg)] transition-colors',
        active && 'bg-[var(--ep-bg)] text-[var(--ep-primary)]',
      )}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const setLink = () => {
    const prev = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Havola (URL):', prev ?? 'https://');
    if (url === null) return;
    if (url === '') { editor.chain().focus().extendMarkRange('link').unsetLink().run(); return; }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };
  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-[var(--ep-border)] px-2 py-1.5 bg-[var(--ep-surface)]">
      <Btn title="Qalin" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="w-4 h-4" /></Btn>
      <Btn title="Kursiv" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="w-4 h-4" /></Btn>
      <span className="w-px h-5 bg-[var(--ep-border)] mx-1" />
      <Btn title="Sarlavha 1" active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}><Heading1 className="w-4 h-4" /></Btn>
      <Btn title="Sarlavha 2" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="w-4 h-4" /></Btn>
      <span className="w-px h-5 bg-[var(--ep-border)] mx-1" />
      <Btn title="Belgili ro'yxat" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="w-4 h-4" /></Btn>
      <Btn title="Raqamli ro'yxat" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="w-4 h-4" /></Btn>
      <Btn title="Iqtibos" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote className="w-4 h-4" /></Btn>
      <Btn title="Kod" active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()}><Code className="w-4 h-4" /></Btn>
      <span className="w-px h-5 bg-[var(--ep-border)] mx-1" />
      <Btn title="Havola" active={editor.isActive('link')} onClick={setLink}><LinkIcon className="w-4 h-4" /></Btn>
      <Btn title="Jadval qo'shish" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}><TableIcon className="w-4 h-4" /></Btn>
      <span className="w-px h-5 bg-[var(--ep-border)] mx-1" />
      <Btn title="Orqaga" onClick={() => editor.chain().focus().undo().run()}><Undo className="w-4 h-4" /></Btn>
      <Btn title="Oldinga" onClick={() => editor.chain().focus().redo().run()}><Redo className="w-4 h-4" /></Btn>
    </div>
  );
}

export function RichTextEditor({
  value,
  editable = true,
  onChange,
}: {
  value?: Record<string, unknown> | null;
  editable?: boolean;
  onChange?: (json: Record<string, unknown>, html: string) => void;
}) {
  const editor = useEditor({
    extensions: [StarterKit, TableKit],
    content: value ?? { type: 'doc', content: [{ type: 'paragraph' }] },
    editable,
    onUpdate: ({ editor: ed }) => onChange?.(ed.getJSON() as Record<string, unknown>, ed.getHTML()),
  });

  // Keep editability in sync if the prop changes.
  useEffect(() => {
    editor?.setEditable(editable);
  }, [editable, editor]);

  if (!editor) return null;

  return (
    <div className="border border-[var(--ep-border)] rounded-lg overflow-hidden bg-white">
      {editable && <Toolbar editor={editor} />}
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none p-4 min-h-[320px] focus:outline-none [&_.ProseMirror]:outline-none [&_table]:border-collapse [&_td]:border [&_td]:border-[var(--ep-border)] [&_td]:p-2 [&_th]:border [&_th]:border-[var(--ep-border)] [&_th]:p-2 [&_th]:bg-[var(--ep-bg)]"
      />
    </div>
  );
}
