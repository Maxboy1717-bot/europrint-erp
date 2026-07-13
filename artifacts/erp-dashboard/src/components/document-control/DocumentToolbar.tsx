/**
 * @module DocumentToolbar
 * @description Google-Docs-style compact icon toolbar for the erkin-hujjat editor (Variant B,
 * visual only). Sticky under the top bar; icon-only buttons with tooltips, grouped by
 * separators; --ep-* chrome tokens (not Google's colors). Maps to the SAME TipTap
 * StarterKit/TableKit commands — no command logic is reinvented, only newly exposed
 * (underline/strike/H3 were already in StarterKit v3). Align/color/highlight/image arrive in a
 * later commit.
 */

import { type Editor } from '@tiptap/react';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading1, Heading2, Heading3, List, ListOrdered, Quote, Code,
  Link as LinkIcon, Table as TableIcon, Undo, Redo,
} from 'lucide-react';
import { cn } from '@/lib/utils';

function Btn({ active, disabled, onClick, title, children }: {
  active?: boolean; disabled?: boolean; onClick: () => void; title: string; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-8 h-8 flex items-center justify-center rounded text-[var(--ep-text)] hover:bg-[var(--ep-bg)] transition-colors disabled:opacity-40',
        active && 'bg-[var(--ep-blue)]/12 text-[var(--ep-blue)]',
      )}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <span className="w-px h-5 bg-[var(--ep-border)] mx-1.5 shrink-0" />;
}

export function DocumentToolbar({ editor }: { editor: Editor }) {
  const setLink = () => {
    const prev = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Havola (URL):', prev ?? 'https://');
    if (url === null) return;
    if (url === '') { editor.chain().focus().extendMarkRange('link').unsetLink().run(); return; }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };
  const c = () => editor.chain().focus();
  return (
    <div className="sticky top-0 z-20 flex flex-wrap items-center gap-0.5 border-b border-[var(--ep-border)] bg-[var(--ep-surface)] px-3 py-1 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <Btn title="Orqaga (Ctrl+Z)" disabled={!editor.can().undo()} onClick={() => c().undo().run()}><Undo className="w-4 h-4" /></Btn>
      <Btn title="Oldinga (Ctrl+Y)" disabled={!editor.can().redo()} onClick={() => c().redo().run()}><Redo className="w-4 h-4" /></Btn>
      <Sep />
      <Btn title="Qalin (Ctrl+B)" active={editor.isActive('bold')} onClick={() => c().toggleBold().run()}><Bold className="w-4 h-4" /></Btn>
      <Btn title="Kursiv (Ctrl+I)" active={editor.isActive('italic')} onClick={() => c().toggleItalic().run()}><Italic className="w-4 h-4" /></Btn>
      <Btn title="Tagchiziq (Ctrl+U)" active={editor.isActive('underline')} onClick={() => c().toggleUnderline().run()}><UnderlineIcon className="w-4 h-4" /></Btn>
      <Btn title="Chizib tashlangan" active={editor.isActive('strike')} onClick={() => c().toggleStrike().run()}><Strikethrough className="w-4 h-4" /></Btn>
      <Sep />
      <Btn title="Sarlavha 1" active={editor.isActive('heading', { level: 1 })} onClick={() => c().toggleHeading({ level: 1 }).run()}><Heading1 className="w-4 h-4" /></Btn>
      <Btn title="Sarlavha 2" active={editor.isActive('heading', { level: 2 })} onClick={() => c().toggleHeading({ level: 2 }).run()}><Heading2 className="w-4 h-4" /></Btn>
      <Btn title="Sarlavha 3" active={editor.isActive('heading', { level: 3 })} onClick={() => c().toggleHeading({ level: 3 }).run()}><Heading3 className="w-4 h-4" /></Btn>
      <Sep />
      <Btn title="Belgili ro'yxat" active={editor.isActive('bulletList')} onClick={() => c().toggleBulletList().run()}><List className="w-4 h-4" /></Btn>
      <Btn title="Raqamli ro'yxat" active={editor.isActive('orderedList')} onClick={() => c().toggleOrderedList().run()}><ListOrdered className="w-4 h-4" /></Btn>
      <Btn title="Iqtibos" active={editor.isActive('blockquote')} onClick={() => c().toggleBlockquote().run()}><Quote className="w-4 h-4" /></Btn>
      <Btn title="Kod bloki" active={editor.isActive('codeBlock')} onClick={() => c().toggleCodeBlock().run()}><Code className="w-4 h-4" /></Btn>
      <Sep />
      <Btn title="Havola" active={editor.isActive('link')} onClick={setLink}><LinkIcon className="w-4 h-4" /></Btn>
      <Btn title="Jadval qo'shish" onClick={() => c().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}><TableIcon className="w-4 h-4" /></Btn>
    </div>
  );
}
