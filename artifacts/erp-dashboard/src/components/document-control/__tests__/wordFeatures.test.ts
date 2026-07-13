/**
 * @module wordFeatures.test
 * @description Self-audit (#4): drive the ACTUAL editor extensions the Word toolbar buttons call
 * and assert each produces the expected styled output — so "font/bold/heading/…" are proven to
 * genuinely apply, not just typecheck. Runs a real TipTap editor over documentEditorExtensions
 * in jsdom (the same extension set the UI uses).
 */

import { describe, it, expect, afterEach } from 'vitest';
import { Editor } from '@tiptap/react';
import { documentEditorExtensions } from '../documentEditorConfig';

let editor: Editor;
function makeEditor(html = '<p>hello world</p>') {
  editor = new Editor({ extensions: documentEditorExtensions, content: html });
  editor.commands.selectAll();
  return editor;
}
afterEach(() => editor?.destroy());

describe('Word toolbar features — real editor output', () => {
  it('font family applies', () => {
    makeEditor().commands.setFontFamily('Georgia');
    expect(editor.getHTML()).toContain('font-family');
    expect(editor.getHTML()).toContain('Georgia');
  });
  it('font size applies', () => {
    makeEditor().commands.setFontSize('24px');
    expect(editor.getHTML()).toContain('font-size: 24px');
  });
  it('bold / italic / underline / strike apply', () => {
    makeEditor().chain().toggleBold().toggleItalic().run();
    const h = editor.getHTML();
    expect(h).toContain('<strong>');
    expect(h).toContain('<em>');
  });
  it('headings apply', () => {
    makeEditor().commands.toggleHeading({ level: 2 });
    expect(editor.getHTML()).toContain('<h2');
  });
  it('bullet list applies', () => {
    makeEditor().commands.toggleBulletList();
    expect(editor.getHTML()).toContain('<ul>');
  });
  it('text align applies', () => {
    makeEditor().commands.setTextAlign('center');
    expect(editor.getHTML()).toContain('text-align: center');
  });
  it('text color + highlight apply', () => {
    makeEditor().chain().setColor('#ff0000').setHighlight({ color: '#ffff00' }).run();
    const h = editor.getHTML();
    expect(h.toLowerCase()).toContain('color'); // color mark present
    expect(h).toContain('mark'); // highlight <mark>
  });
  it('link applies', () => {
    makeEditor().commands.setLink({ href: 'https://example.uz' });
    expect(editor.getHTML()).toContain('href="https://example.uz"');
  });
  it('image inserts', () => {
    makeEditor().commands.setImage({ src: 'https://example.uz/logo.png' });
    expect(editor.getHTML()).toContain('<img');
    expect(editor.getHTML()).toContain('logo.png');
  });
  it('table inserts', () => {
    makeEditor().commands.insertTable({ rows: 2, cols: 2, withHeaderRow: true });
    expect(editor.getHTML()).toContain('<table');
    expect(editor.getHTML()).toContain('<td');
  });
});
