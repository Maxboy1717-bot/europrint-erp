/**
 * @module SearchReplaceExtension
 * @description P1-3 find & replace for the erkin-hujjat editor. Self-contained TipTap extension
 * (no new dependency — prosemirror primitives come from @tiptap/pm/*, Extension from
 * @tiptap/react). Search state lives in PLUGIN STATE so it is crash-safe: highlight decorations
 * are re-mapped through doc changes each transaction, and matches recompute whenever the doc or
 * query changes. Operations are exported as plain functions (setSearchTerm/findNext/…/replaceAll)
 * that dispatch transactions — this avoids the fragile TipTap command-typing augmentation while
 * keeping every edit a normal, undoable transaction. The FindBar UI drives these functions.
 */

import { Extension } from '@tiptap/react';
import type { Editor } from '@tiptap/react';
import { Plugin, PluginKey, TextSelection } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import type { Node as PMNode } from '@tiptap/pm/model';

export interface SearchMatch { from: number; to: number }
interface SearchState {
  term: string;
  caseSensitive: boolean;
  matches: SearchMatch[];
  index: number; // current match, -1 when none
  deco: DecorationSet;
}
interface SearchMeta { term?: string; caseSensitive?: boolean; index?: number }

const key = new PluginKey<SearchState>('searchReplace');

function computeMatches(doc: PMNode, term: string, caseSensitive: boolean): SearchMatch[] {
  const out: SearchMatch[] = [];
  if (!term) return out;
  const needle = caseSensitive ? term : term.toLowerCase();
  doc.descendants((node: PMNode, pos: number) => {
    if (!node.isText || !node.text) return;
    const hay = caseSensitive ? node.text : node.text.toLowerCase();
    let i = 0;
    while ((i = hay.indexOf(needle, i)) !== -1) {
      out.push({ from: pos + i, to: pos + i + term.length });
      i += term.length;
    }
  });
  return out;
}

function buildDeco(doc: PMNode, matches: SearchMatch[], index: number): DecorationSet {
  if (!matches.length) return DecorationSet.empty;
  return DecorationSet.create(
    doc,
    matches.map((m, i) => Decoration.inline(m.from, m.to, { class: i === index ? 'ep-search-current' : 'ep-search-match' })),
  );
}

export const SearchReplace = Extension.create({
  name: 'searchReplace',
  addProseMirrorPlugins() {
    return [
      new Plugin<SearchState>({
        key,
        state: {
          init: () => ({ term: '', caseSensitive: false, matches: [], index: -1, deco: DecorationSet.empty }),
          apply(tr, value, _oldState, newState): SearchState {
            const meta = tr.getMeta(key) as SearchMeta | undefined;
            const term = meta?.term !== undefined ? meta.term : value.term;
            const caseSensitive = meta?.caseSensitive !== undefined ? meta.caseSensitive : value.caseSensitive;
            if (tr.docChanged || meta) {
              const matches = computeMatches(newState.doc, term, caseSensitive);
              let index = meta?.index !== undefined ? meta.index : value.index;
              if (index >= matches.length) index = matches.length ? matches.length - 1 : -1;
              if (index < 0 && matches.length) index = 0;
              return { term, caseSensitive, matches, index, deco: buildDeco(newState.doc, matches, index) };
            }
            return { ...value, term, caseSensitive, deco: value.deco.map(tr.mapping, tr.doc) };
          },
        },
        props: { decorations: (state) => key.getState(state)?.deco },
      }),
    ];
  },
});

// ── Operations (dispatch transactions; the FindBar calls these) ─────────────────────────────
function stateOf(editor: Editor): SearchState | undefined {
  return key.getState(editor.state);
}

export function setSearchTerm(editor: Editor, term: string): void {
  editor.view.dispatch(editor.state.tr.setMeta(key, { term, index: term ? 0 : -1 }));
}
export function setSearchCaseSensitive(editor: Editor, on: boolean): void {
  editor.view.dispatch(editor.state.tr.setMeta(key, { caseSensitive: on }));
}
export function findNext(editor: Editor): void {
  const s = stateOf(editor);
  if (!s || !s.matches.length) return;
  const index = (s.index + 1) % s.matches.length;
  const m = s.matches[index];
  const tr = editor.state.tr.setSelection(TextSelection.create(editor.state.doc, m.from, m.to)).scrollIntoView().setMeta(key, { index });
  editor.view.dispatch(tr);
}
export function findPrev(editor: Editor): void {
  const s = stateOf(editor);
  if (!s || !s.matches.length) return;
  const index = (s.index - 1 + s.matches.length) % s.matches.length;
  const m = s.matches[index];
  const tr = editor.state.tr.setSelection(TextSelection.create(editor.state.doc, m.from, m.to)).scrollIntoView().setMeta(key, { index });
  editor.view.dispatch(tr);
}
export function replaceCurrent(editor: Editor, replacement: string): void {
  const s = stateOf(editor);
  const m = s?.matches[s.index ?? -1];
  if (!m) return;
  editor.view.dispatch(editor.state.tr.insertText(replacement, m.from, m.to).setMeta(key, {}));
}
export function replaceAll(editor: Editor, replacement: string): void {
  const s = stateOf(editor);
  if (!s || !s.matches.length) return;
  const tr = editor.state.tr;
  // Replace from last to first so earlier match positions stay valid within this tr.
  for (let i = s.matches.length - 1; i >= 0; i--) {
    const m = s.matches[i];
    tr.insertText(replacement, m.from, m.to);
  }
  editor.view.dispatch(tr.setMeta(key, { index: -1 }));
}
export function clearSearch(editor: Editor): void {
  editor.view.dispatch(editor.state.tr.setMeta(key, { term: '', index: -1 }));
}
export function searchStatus(editor: Editor | null): { count: number; index: number } {
  if (!editor) return { count: 0, index: -1 };
  const s = key.getState(editor.state);
  return { count: s?.matches.length ?? 0, index: s?.index ?? -1 };
}
