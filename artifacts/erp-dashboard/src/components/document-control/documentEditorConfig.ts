/**
 * @module documentEditorConfig
 * @description Shared TipTap extension set for the erkin-hujjat editor (Google-Docs-style
 * redesign, Variant B — visual only). One config so the toolbar and the canvas use the same
 * editor. StarterKit v3 already bundles bold/italic/underline/strike/code/headings/lists/
 * blockquote/link/history; TableKit adds tables. Align/color/highlight/image are added in a
 * later commit. NB: content is still TipTap JSON in our own DB — no data-model change.
 */

import StarterKit from '@tiptap/starter-kit';
import { TableKit } from '@tiptap/extension-table';
import type { Extensions } from '@tiptap/react';

export const documentEditorExtensions: Extensions = [
  StarterKit,
  TableKit,
];
