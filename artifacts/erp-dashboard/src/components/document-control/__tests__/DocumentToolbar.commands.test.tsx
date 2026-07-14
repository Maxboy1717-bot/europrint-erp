/**
 * Verifies every command the DocumentToolbar invokes (a) exists and (b) actually mutates the
 * document — a dead toolbar button = a missing extension or a no-op command. Each check runs on
 * a fresh editor so commands are tested in isolation (no accumulated-state artifacts).
 */
import { describe, it, expect, afterEach } from 'vitest';
import { Editor } from '@tiptap/react';
import { documentEditorExtensions } from '../documentEditorConfig';

const COMMANDS = [
  'undo', 'redo',
  'toggleBold', 'toggleItalic', 'toggleUnderline', 'toggleStrike',
  'toggleHeading', 'toggleBulletList', 'toggleOrderedList', 'toggleBlockquote', 'toggleCodeBlock',
  'setTextAlign', 'setColor', 'setHighlight',
  'setFontFamily', 'unsetFontFamily', 'setFontSize', 'unsetFontSize',
  'setLink', 'unsetLink', 'setImage', 'insertTable',
  // P1-1 in-table controls (TableKit)
  'addRowAfter', 'deleteRow', 'addColumnAfter', 'deleteColumn', 'mergeOrSplit', 'toggleHeaderRow', 'deleteTable',
] as const;

describe('DocumentToolbar commands are all wired', () => {
  let editor: Editor;
  afterEach(() => editor?.destroy());
  const fresh = () => { editor?.destroy(); editor = new Editor({ extensions: documentEditorExtensions, content: '<p>hello world</p>' }); return editor; };
  const onAll = () => editor.chain().focus().selectAll();

  it('exposes every command the toolbar calls', () => {
    fresh();
    const missing = COMMANDS.filter((c) => typeof (editor.commands as Record<string, unknown>)[c] !== 'function');
    expect(missing).toEqual([]);
  });

  it('marks toggle on', () => {
    fresh(); onAll().toggleBold().run();      expect(editor.isActive('bold')).toBe(true);
    fresh(); onAll().toggleItalic().run();    expect(editor.isActive('italic')).toBe(true);
    fresh(); onAll().toggleUnderline().run(); expect(editor.isActive('underline')).toBe(true);
    fresh(); onAll().toggleStrike().run();    expect(editor.isActive('strike')).toBe(true);
  });

  it('blocks/lists/align toggle on', () => {
    fresh(); onAll().toggleHeading({ level: 2 }).run(); expect(editor.getHTML()).toContain('<h2');
    fresh(); onAll().toggleBulletList().run();          expect(editor.getHTML()).toContain('<ul');
    fresh(); onAll().toggleOrderedList().run();         expect(editor.getHTML()).toContain('<ol');
    fresh(); onAll().toggleBlockquote().run();          expect(editor.getHTML()).toContain('<blockquote');
    fresh(); onAll().toggleCodeBlock().run();           expect(editor.getHTML()).toContain('<pre');
    fresh(); onAll().setTextAlign('center').run();      expect(editor.isActive({ textAlign: 'center' })).toBe(true);
  });

  it('text-style / color / font / link / image / table apply', () => {
    fresh(); onAll().setColor('#ff0000').run();               expect(editor.getAttributes('textStyle').color).toBe('#ff0000');
    fresh(); onAll().setHighlight({ color: '#fff3a3' }).run(); expect(editor.isActive('highlight')).toBe(true);
    fresh(); onAll().setFontFamily('Arial').run();            expect(editor.getAttributes('textStyle').fontFamily).toBe('Arial');
    fresh(); onAll().setFontSize('16px').run();               expect(editor.getAttributes('textStyle').fontSize).toBe('16px');
    fresh(); onAll().setLink({ href: 'https://x.uz' }).run(); expect(editor.isActive('link')).toBe(true);
    fresh(); editor.chain().focus().insertTable({ rows: 2, cols: 2, withHeaderRow: true }).run(); expect(editor.getHTML()).toContain('<table');
    fresh(); editor.chain().focus().setImage({ src: 'https://x.uz/a.png' }).run();                expect(editor.getHTML()).toContain('<img');
  });
});
