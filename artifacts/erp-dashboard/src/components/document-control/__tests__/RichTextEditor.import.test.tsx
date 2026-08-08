/**
 * @module RichTextEditor.import.test
 * @description Proves the .docx-import render path end-to-end in jsdom:
 *  1. generateJSON() turns mammoth-style HTML into non-empty TipTap doc JSON (the import step).
 *  2. RichTextEditor mounted with that content renders the actual Uzbek text into the DOM.
 *  3. When content arrives AFTER mount (async load / import→open — the original bug), a
 *     contentKey change makes the editor re-apply it so the text appears.
 */

import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { generateJSON } from '@tiptap/react';
import { TestProviders } from '@/test/TestProviders';
import { documentEditorExtensions } from '../documentEditorConfig';
import { RichTextEditor } from '../RichTextEditor';

// Representative of mammoth's .docx→HTML output (headings, bold, paragraphs, lists).
const MAMMOTH_HTML =
  '<p><strong>YOZGI TA\'TIL KAFOLAT XATI</strong></p>' +
  '<p>Men, ota-ona sifatida, farzandim xavfsizligini kafolatlayman.</p>' +
  '<ul><li>Birinchi shart</li><li>Ikkinchi shart</li></ul>';

describe('RichTextEditor — .docx import render path', () => {
  it('generateJSON produces non-empty TipTap content from mammoth HTML', () => {
    const json = generateJSON(MAMMOTH_HTML, documentEditorExtensions) as {
      type: string; content?: unknown[];
    };
    expect(json.type).toBe('doc');
    expect(Array.isArray(json.content)).toBe(true);
    expect((json.content ?? []).length).toBeGreaterThanOrEqual(3); // 2 paragraphs + list
    expect(JSON.stringify(json)).toContain('YOZGI TA'); // real text carried through
  });

  it('renders the imported text into the DOM when content is present at mount', async () => {
    const content = generateJSON(MAMMOTH_HTML, documentEditorExtensions) as Record<string, unknown>;
    render(<RichTextEditor value={content} contentKey="doc-1:1" editable={false} />, { wrapper: TestProviders });
    await waitFor(() => expect(screen.getByText(/YOZGI TA'TIL KAFOLAT XATI/)).toBeTruthy());
    expect(screen.getByText(/farzandim xavfsizligini kafolatlayman/)).toBeTruthy();
    expect(screen.getByText(/Ikkinchi shart/)).toBeTruthy();
  });

  it('re-applies content when it arrives AFTER mount (the original bug: empty → loaded)', async () => {
    const content = generateJSON(MAMMOTH_HTML, documentEditorExtensions) as Record<string, unknown>;
    // First render: empty (mirrors the editor mounting before the row has loaded).
    const { rerender } = render(
      <RichTextEditor value={null} contentKey="new" editable={false} />,
      { wrapper: TestProviders },
    );
    expect(screen.queryByText(/YOZGI TA'TIL KAFOLAT XATI/)).toBeNull();
    // Content + a NEW contentKey arrive (import→open): editor must re-apply and show the text.
    rerender(<RichTextEditor value={content} contentKey="doc-1:1" editable={false} />);
    await waitFor(() => expect(screen.getByText(/YOZGI TA'TIL KAFOLAT XATI/)).toBeTruthy());
  });
});
