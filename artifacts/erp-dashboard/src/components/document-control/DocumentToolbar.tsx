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
  AlignLeft, AlignCenter, AlignRight, AlignJustify, Baseline, Highlighter, Image as ImageIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { tLabel } from '@/lib/i18n/tLabel';

// A toolbar button whose icon opens the native color picker (text color / highlight).
function ColorBtn({ title, icon, value, onPick }: {
  title: string; icon: React.ReactNode; value: string; onPick: (color: string) => void;
}) {
  return (
    <label title={title} className="w-8 h-8 flex items-center justify-center rounded text-[var(--ep-text)] hover:bg-[var(--ep-bg)] cursor-pointer relative">
      {icon}
      <input type="color" value={value} onChange={(e) => onPick(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
    </label>
  );
}

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

// Compact labelled button for the in-table controls (shown only when the caret is inside a table).
function TBtn({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button type="button" title={title} onClick={onClick}
      className="h-8 px-1.5 rounded text-[11px] font-medium text-[var(--ep-text)] hover:bg-[var(--ep-bg)] whitespace-nowrap">
      {children}
    </button>
  );
}

const FONTS = ['Arial', 'Times New Roman', 'Georgia', 'Courier New', 'Verdana', 'Tahoma'];
const SIZES = ['10', '11', '12', '14', '16', '18', '24', '36'];

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
      <select
        title={tLabel('documents.fontFamily', 'Shrift')}
        value={(editor.getAttributes('textStyle').fontFamily as string) ?? ''}
        onChange={(e) => (e.target.value ? c().setFontFamily(e.target.value).run() : c().unsetFontFamily().run())}
        className="h-8 text-xs rounded border border-[var(--ep-border)] bg-[var(--ep-surface)] px-1 max-w-[120px]"
      >
        <option value="">{tLabel('documents.fontDefault', 'Shrift')}</option>
        {FONTS.map((f) => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
      </select>
      <select
        title={tLabel('documents.fontSize', "O'lcham")}
        value={((editor.getAttributes('textStyle').fontSize as string) ?? '').replace('px', '')}
        onChange={(e) => (e.target.value ? c().setFontSize(`${e.target.value}px`).run() : c().unsetFontSize().run())}
        className="h-8 text-xs rounded border border-[var(--ep-border)] bg-[var(--ep-surface)] px-1"
      >
        <option value="">–</option>
        {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
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
      <Btn title={tLabel('documents.alignLeft', 'Chapga')} active={editor.isActive({ textAlign: 'left' })} onClick={() => c().setTextAlign('left').run()}><AlignLeft className="w-4 h-4" /></Btn>
      <Btn title={tLabel('documents.alignCenter', 'Markazga')} active={editor.isActive({ textAlign: 'center' })} onClick={() => c().setTextAlign('center').run()}><AlignCenter className="w-4 h-4" /></Btn>
      <Btn title={tLabel('documents.alignRight', "O'ngga")} active={editor.isActive({ textAlign: 'right' })} onClick={() => c().setTextAlign('right').run()}><AlignRight className="w-4 h-4" /></Btn>
      <Btn title={tLabel('documents.alignJustify', 'Ikki tomonga')} active={editor.isActive({ textAlign: 'justify' })} onClick={() => c().setTextAlign('justify').run()}><AlignJustify className="w-4 h-4" /></Btn>
      <Sep />
      <ColorBtn title={tLabel('documents.textColor', 'Matn rangi')} icon={<Baseline className="w-4 h-4" />} value={(editor.getAttributes('textStyle').color as string) ?? '#111111'} onPick={(col) => c().setColor(col).run()} />
      <ColorBtn title={tLabel('documents.highlight', "Ajratib ko'rsatish (marker)")} icon={<Highlighter className="w-4 h-4" />} value={(editor.getAttributes('highlight').color as string) ?? '#fff3a3'} onPick={(col) => c().setHighlight({ color: col }).run()} />
      <Sep />
      <Btn title={tLabel('documents.linkBtn', 'Havola')} active={editor.isActive('link')} onClick={setLink}><LinkIcon className="w-4 h-4" /></Btn>
      <Btn title={tLabel('documents.insertImage', "Rasm qo'shish")} onClick={() => { const url = window.prompt(tLabel('documents.imageUrl', 'Rasm URL:')); if (url) c().setImage({ src: url }).run(); }}><ImageIcon className="w-4 h-4" /></Btn>
      <Btn title="Jadval qo'shish" onClick={() => c().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}><TableIcon className="w-4 h-4" /></Btn>
      {/* In-table controls (TableKit) — only while the caret is inside a table (P1-1). */}
      {editor.isActive('table') && (
        <>
          <Sep />
          <TBtn title={tLabel('documents.tblRowAfter', 'Pastdan qator')} onClick={() => c().addRowAfter().run()}>+{tLabel('documents.tblRow', 'Qator')}</TBtn>
          <TBtn title={tLabel('documents.tblRowDel', "Qatorni o'chirish")} onClick={() => c().deleteRow().run()}>−{tLabel('documents.tblRow', 'Qator')}</TBtn>
          <TBtn title={tLabel('documents.tblColAfter', "O'ngdan ustun")} onClick={() => c().addColumnAfter().run()}>+{tLabel('documents.tblCol', 'Ustun')}</TBtn>
          <TBtn title={tLabel('documents.tblColDel', "Ustunni o'chirish")} onClick={() => c().deleteColumn().run()}>−{tLabel('documents.tblCol', 'Ustun')}</TBtn>
          <TBtn title={tLabel('documents.tblMerge', "Kataklarni birlashtirish / bo'lish")} onClick={() => c().mergeOrSplit().run()}>{tLabel('documents.tblMergeShort', 'Birlash/Bo\'l')}</TBtn>
          <TBtn title={tLabel('documents.tblHeader', 'Sarlavha qatori')} onClick={() => c().toggleHeaderRow().run()}>{tLabel('documents.tblHeaderShort', 'Sarlavha')}</TBtn>
          <TBtn title={tLabel('documents.tblDelete', "Jadvalni o'chirish")} onClick={() => c().deleteTable().run()}>🗑 {tLabel('documents.tblTable', 'Jadval')}</TBtn>
        </>
      )}
    </div>
  );
}
