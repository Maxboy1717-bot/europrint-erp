/**
 * Proves the P1-3 find & replace extension actually finds + replaces on a real TipTap editor.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { Editor } from '@tiptap/react';
import { documentEditorExtensions } from '../documentEditorConfig';
import { setSearchTerm, setSearchCaseSensitive, findNext, replaceCurrent, replaceAll, searchStatus, clearSearch } from '../SearchReplaceExtension';

describe('SearchReplace extension', () => {
  let editor: Editor;
  const make = (html: string) => (editor = new Editor({ extensions: documentEditorExtensions, content: html }));
  afterEach(() => editor?.destroy());

  it('finds all matches (case-insensitive by default)', () => {
    make('<p>Foo bar foo baz FOO</p>');
    setSearchTerm(editor, 'foo');
    expect(searchStatus(editor).count).toBe(3);
  });

  it('respects case sensitivity', () => {
    make('<p>Foo bar foo baz FOO</p>');
    setSearchCaseSensitive(editor, true);
    setSearchTerm(editor, 'foo');
    expect(searchStatus(editor).count).toBe(1); // only lowercase "foo"
  });

  it('findNext advances the current index', () => {
    make('<p>x x x</p>');
    setSearchTerm(editor, 'x');
    expect(searchStatus(editor).index).toBe(0);
    findNext(editor);
    expect(searchStatus(editor).index).toBe(1);
  });

  it('replaceCurrent replaces one match', () => {
    make('<p>cat cat cat</p>');
    setSearchTerm(editor, 'cat');
    replaceCurrent(editor, 'dog');
    expect(editor.getText()).toBe('dog cat cat');
  });

  it('replaceAll replaces every match and clears the count', () => {
    make('<p>foo bar foo baz foo</p>');
    setSearchTerm(editor, 'foo');
    replaceAll(editor, 'X');
    expect(editor.getText()).toBe('X bar X baz X');
    expect(searchStatus(editor).count).toBe(0);
  });

  it('clearSearch removes highlights/matches', () => {
    make('<p>a a a</p>');
    setSearchTerm(editor, 'a');
    expect(searchStatus(editor).count).toBe(3);
    clearSearch(editor);
    expect(searchStatus(editor).count).toBe(0);
  });
});
